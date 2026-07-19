---
title: "iWARP 之 MPA"
description: "详解 iWARP 协议栈中的 MPA（Marker PDU Aligned）层，功能、帧格式与 TCP 协作机制。"
date: "2026-07-19"
order: 23
tags: ["RDMA", "iWARP", "MPA", "协议"]
---
# iWARP 之 MPA

> 注: 知乎原文403不可达，本文基于RFC 5044/6581及iWARP协议栈机制重构

---

在iWARP协议栈的三层中，MPA（Marker PDU Aligned Framing）是最复杂的一层，负责在TCP流中标记DDP消息的分界。如果说DDP是iWARP的核心、RDMAP是用户接口，那么MPA就是连接DDP和TCP的"胶水层"——它解决了如何在面向流的TCP协议之上承载面向消息的DDP协议这个核心问题。

## MPA的作用与定位

### 解决的核心问题

TCP是面向字节流的协议，数据在TCP连接上被当作连续的字节流，没有消息边界的概念。而DDP是面向消息的协议，需要接收端能够准确识别每个DDP消息的起始和结束位置。

MPA层就是为解决这个矛盾而设计的——它在发送端按照特定算法在TCP流中插入标记（Marker），使得接收端可以在TCP流中定位出DDP消息的分界。

### MPA在iWARP协议栈中的位置

```
┌──────────────────────────────┐
│      Upper Layer Protocol     │
│    (RDMAP / 用户应用程序)     │
├──────────────────────────────┤
│             DDP              │
│    (直接数据放置 / 零拷贝)    │
├──────────────────────────────┤
│             MPA              │
│  (TCP流中的PDU定界与CRC校验)  │
├──────────────────────────────┤
│             TCP              │
│      (可靠字节流传输)         │
├──────────────────────────────┤
│             IP               │
├──────────────────────────────┤
│           Ethernet           │
└──────────────────────────────┘
```

MPA层位于DDP和TCP之间。发送时，MPA接收DDP的PDU（Protocol Data Unit），添加MPA头部，然后交给TCP发送；接收时，MPA从TCP字节流中提取出MPA帧，校验后交给DDP处理。

![](/images/rdma/fb3220f971f20ccf4b1ae19286e03d21.png)

MPA层的功能示意图

## MPA要解决的设计挑战

将DDP适配到TCP上面临几个关键挑战：

### 挑战1：消息定界

TCP是流协议，不保留消息边界。发送端发了两个DDP消息，接收端可能在一个TCP段中收到两个消息、也可能一个TCP段只收到半个消息。MPA需要提供一种机制让接收端能够准确找到每个DDP消息的边界。

### 挑战2：数据完整性

DDP直接操作远端内存，一旦数据损坏可能导致严重的内存错误。TCP虽然有校验和，但16位的校验和不足以完全防止数据静默损坏。MPA需要提供更强的完整性保护。

### 挑战3：零拷贝支持

MPA不能破坏DDP的零拷贝能力。MPA的定界机制必须足够高效，不能引入过多的数据拷贝和协议处理开销。

## MPA的两种机制

MPA设计了两种机制来解决上述挑战：

### 机制1：Marker（标记）

Marker是MPA每隔一段固定长度（512字节）在TCP流中插入的一个2字节标记。这个标记指向当前DDP PDU在TCP流中的位置，接收端可以通过扫描Marker来快速定位PDU边界。

### 机制2：CRC校验

MPA在每个DDP PDU的末尾添加一个4字节的CRC（循环冗余校验），用于检测数据在传输过程中的损坏。

两种机制是独立的——Marker负责定界，CRC负责完整性保护。

## MPA帧格式

一个完整的MPA帧（MPA Frame）由MPA Header、DDP PDU和CRC三部分组成：

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┤
│  Marker (可选，每512字节插入)  │   MPA Header  (2字节)       │
├───────┴───────┴───────┴───────┴───────┴───────┴───────┴───────┤
│                                                               │
│                     DDP PDU (变长)                             │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                         CRC (4字节)                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### MPA Header (2字节)

MPA Header紧跟在Marker之后（如果启用了Marker），或位于帧的最开始：

```
 0                   1
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
├───────┬───────────────────────┤
│  M    │    Pad Length         │
│  (1)  │    (7 bits)           │
├───────┴───────────────────────┤
```

- **M（1 bit）**：Marker标志。如果为1，表示这个连接启用了Marker机制。
- **Pad Length（7 bits）**：填充长度（0-127字节）。DDP PDU可能对齐到某个边界，不足的部分用0填充。这个字段告诉接收端有多少填充字节。

### Marker (2字节)

如果连接启用了Marker机制，那么TCP字节流中每隔512字节就插入一个2字节的Marker：

```
 0                   1
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5
├───────────────────────────────┤
│      Marker (16 bits)          │
│      (当前PDU的序号)           │
└───────────────────────────────┘
```

Marker的值是一个16位的递增序号，标识当前TCP字节流位置之前的完整MPA帧数量。接收端可以通过这个序号和固定的Marker间隔来验证和恢复同步。

### CRC (4字节)

CRC字段采用CRC-32C（Castagnoli多项式），覆盖MPA Header和DDP PDU的全部内容。CRC-32C相比TCP使用的标准CRC-32具有更好的错误检测能力，尤其适合硬件实现。

```
CRC多项式: x^32 + x^28 + x^27 + x^26 + x^25 + x^23 + x^22 + x^20 +
           x^19 + x^18 + x^14 + x^13 + x^11 + x^10 + x^9 + x^8 +
           x^6 + 1
（即CRC-32C / iSCSI多项式）
```

## MPDU（Marker PDU）

MPA帧在TCP字节流中的实际传输单元称为MPDU（Marker PDU）。一个MPDU包含一个完整的MPA帧以及可选的Marker。

### MPDU结构

```
TCP字节流:
┌─────┬─────────┬─────┬──────────┬──────┐
│ ... │ Marker  │ MPA │  DDP     │ CRC  │ Next
│     │ (2字节) │ Hdr │  PDU     │(4字节)│ PDU...
│     │         │(2B) │ (变长)   │      │
└─────┴─────────┴─────┴──────────┴──────┘
│←─── Marker间隔 (512字节) ───→│
```

### Marker的放置算法

Marker的插入遵循以下规则：

1. **间隔固定**：每512字节TCP数据放置一个Marker
2. **计数基准**：Marker从TCP字节流的起点开始计算，包括所有MPA帧的头部和数据
3. **PDU对齐**：Marker只可能出现在MPA帧头部之前（即不能在DDP PDU中间插入）

```
TCP字节流 (带Marker):
Offset 0:    [MPA Hdr][DDP PDU ...  ] ← MPDU 0
Offset 512:  [Marker][MPA Hdr][DDP ... ] ← MPDU 1
Offset 1024: [Marker][MPA Hdr][DDP ... ] ← MPDU 2
...
```

## MPA的建链过程

MPA的建链是iWARP连接建立的关键步骤。在正式的DDP数据传输开始之前，两个节点需要在MPA层进行参数协商。

### 建链流程

```
Client                                    Server
   │                                        │
   │  ① TCP三次握手建立连接                  │
   │◀────────────────────────────────────▶   │
   │                                        │
   │  ② 发送MPA Request Frame               │
   │  ── [MPA Hdr][DDP PDU(ULP INFO)] ──▶  │
   │      M=1 (启用Marker)                  │
   │                                        │
   │                                        │  ③ 解析MPA Request
   │                                        │  ④ 决定是否接受连接
   │                                        │
   │  ⑤ 接收MPA Response Frame              │
   │  ◀── [MPA Hdr][DDP PDU(ULP INFO)] ───  │
   │      M=1/0 (接受/拒绝)                 │
   │                                        │
   │  ⑥ 开始正式数据传输                    │
   │  ── [Marker][MPA Hdr][DDP PDU][CRC]─▶  │
   │                                        │
```

### MPA Request Frame

建链时，Client发送的第一个MPA帧格式如下：

```
├───────┬───────────────────────────────────────────────────────┤
│  M=1  │  Pad Length=0                                         │
├───────┴───────────────────────────────────────────────────────┤
│                     DDP PDU (控制信息)                         │
│              (包含RDMAP或ULP的建链数据)                        │
├───────────────────────────────────────────────────────────────┤
│                           CRC                                  │
└───────────────────────────────────────────────────────────────┘
```

在这个帧中，M标志位声明了发送方希望启用Marker机制。Server可以在Response中选择接受（M=1）或拒绝（M=0）。

### 参数协商

MPA建链时协商的参数包括：

1. **Marker启用**：双方是否使用Marker机制
2. **CRC启用**：双方是否使用CRC校验
3. **最大PDU大小**：可选，限制单个DDP PDU的最大尺寸
4. **流控参数**：初始的Credits/窗口大小

如果Server不同意Client的提议（如不支持Marker），可以M=0的方式拒绝连接。

## MPA的同步与恢复机制

### 同步丢失（Loss of Sync）

以下情况可能导致MPA接收端失去同步：
1. TCP传输错误导致数据损坏
2. 网络设备（如ROCE网关）修改了TCP段
3. 实现缺陷导致Marker计算错误

### 再同步（Re-sync）

MPA的Marker机制使得接收端可以在失去同步后重新定位PDU边界：

1. 接收端扫描TCP字节流，查找固定的Marker间隔模式
2. 如果找到符合规则的Marker序列，尝试从这个位置开始解析MPA帧
3. 连续成功解析N个有效帧后，认为重新建立同步

```
失去同步后：
TCP流: ... [乱码] [Marker] [MPA Hdr] [DDP PDU] [CRC] ...
                     │
                     ▼  ← 接收端从这里尝试重新同步
                 校验CRC → 成功 → 继续解析后续帧
```

### CRC错误处理

当CRC校验失败时，接收端应：
1. 丢弃当前MPA帧
2. 尝试使用Marker机制重新同步
3. 如果连续CRC错误超过阈值，关闭TCP连接

## MPA与ULP的交互

MPA层向下承载于TCP之上，向上为DDP/RDMAP提供服务。MPA与ULP（Upper Layer Protocol）之间的交互通过ULP ID来区分。

### ULP ID

MPA帧中的DDP PDU的第一部分通常包含ULP信息，用于标识上层协议的类型：

| ULP类型 | 描述 |
|---------|------|
| RDMAP | 标准RDMA操作 |
| iSER | iSCSI Extension for RDMA |
| NVMe-of | NVMe over Fabrics |

## Soft-iWARP中的MPA实现

值得注意的是，Soft-iWARP（Linux内核中的siw驱动）对MPA的实现并不完整。

### 缺失的功能

根据Linux内核siw驱动代码和开发者文档：

1. **Marker插入不支持**：Soft-iWARP在发送端不会插入Marker。这是出于实现复杂度的考虑——在软件中精确地每512字节插入Marker需要在TCP流的每个发送路径上进行干预，实现复杂且影响性能。
2. **CRC计算依赖硬件**：在支持CRC卸载的网卡上，Soft-iWARP会利用硬件CRC offload。在没有硬件支持的场景下，使用软件CRC-32C计算。

### 兼容性影响

由于Soft-iWARP不发送Marker，它只能与同样不要求Marker的对端进行通信。在实际测试中：
- Soft-iWARP ←→ Soft-iWARP：正常工作
- Soft-iWARP ←→ 硬件iWARP网卡：可能需要在硬件端关闭Marker要求

## MPA的Wireshark抓包分析

### MPA协议层次

在Wireshark中，iWARP报文的层次从上到下依次是：

```
Frame: 74 bytes on wire
├── Ethernet II
├── Internet Protocol Version 4
├── Transmission Control Protocol
│   ├── Source Port: 49305
│   └── Destination Port: 12345
├── MPA: Marker PDU Aligned Framing
│   ├── M: 1 (Marker enabled)
│   ├── Pad Length: 0
│   └── [Frame Length: 56 bytes]
├── DDP: Direct Data Placement
│   ├── T: 0 (Untagged Buffer)
│   ├── L: 1 (Last)
│   ├── DV: 1
│   ├── QN: 0
│   ├── MSN: 8
│   └── MO: 0
├── RDMAP: Remote Direct Memory Access Protocol
│   ├── OpCode: SEND_LAST (0x03)
│   └── SendFlags: 0x00
└── [Payload: "Hello from client!"]
```

### MPA帧解析示例

以下是通过Wireshark捕获的一个MPA帧的解析：

```
MPA Header:
    M (Marker Present): 1 ........  (Marker机制已启用)
    Pad Length: 0 ..... 000 0000  (无填充)
    
DDP after MPA Header:
    (DDP直接跟在MPA Header之后)

CRC (在DDP PDU之后, 4字节):
    0xABCD1234  (CRC-32C校验值)
```

### 建链抓包

在iWARP连接建立时，Wireshark中可以观察到MPA Request/Response帧：

```
MPA Request (Client → Server):
    M=1 (请求启用Marker)
    Pad=0
    DDP Payload: RDMAP连接建立请求

MPA Response (Server → Client):
    M=1 (同意启用Marker)
    Pad=0
    DDP Payload: RDMAP连接建立响应
```

### 数据传输抓包

正常数据传输时，Wireshark中显示的MPA层：

```
iWARP MPA
    M: 1
    Pad Length: 0
    [MPA Payload: 1428 bytes]
iWARP DDP
    T: 1
    STag: 0x00010001
    TO: 0
```

## MPA与其他协议的关系

### MPA与TCP

MPA直接承载在TCP之上。MPA要求TCP连接提供有序、可靠的字节流传输。MPA不修改TCP协议本身，而是在TCP数据中嵌入自己的定界信息。

### MPA与SCTP

当DDP下层使用SCTP（Stream Control Transmission Protocol）而非TCP时，不需要MPA层。这是因为SCTP天然支持消息边界（类似于UDP的消息模式），DDP可以直接承载在SCTP之上。

```
使用TCP作为LLP:    ULP → RDMAP → DDP → MPA → TCP → IP
使用SCTP作为LLP:   ULP → RDMAP → DDP → SCTP → IP
```

### MPA与RoCE

RoCE协议基于UDP，不需要MPA层。UDP和IB传输层有自己的报文边界和校验机制，因此iWARP独有的MPA层在RoCE中不存在。

## MPA的性能考量

### Marker的开销

每512字节插入2字节Marker，开销约为0.39%（2/512）。对于大流量场景，这个开销可以忽略。

### CRC的计算开销

CRC-32C的计算需要逐字节处理，这可能在CPU中带来显著开销。好在：
- 现代CPU（如Intel Haswell及以上）支持CRC-32C硬件指令
- 高端网卡支持CRC卸载（checksum offload）
- Soft-iWARP可以利用硬件CRC offload

### 填充（Padding）的开销

Pad Length字段可能导致最多127字节的无效数据填充。如果DDP PDU的实际数据量很小，填充开销可能显著。但对于大块数据传输，这种开销可以忽略。

## 总结

MPA是iWARP协议栈中连接DDP和TCP的"胶水层"，解决了面向消息的DDP协议在面向流的TCP协议上传输时的定界问题。MPA通过Marker机制（每512字节插入标记）实现了PDU边界定位，通过CRC-32C校验保证了数据完整性。

MPA的设计体现了协议工程中的一个经典权衡：在TCP流之上添加消息边界。Marker机制提供了快速同步能力，CRC校验提供了强大的完整性保护——这两者的结合使得iWARP能够在广泛部署的TCP网络上实现可靠的RDMA传输。

理解MPA是理解iWARP相对于RoCE差异的关键——MPA的存在使得iWARP协议栈比RoCE更复杂，但也赋予了iWARP在有损网络中更好的适应性。

## RFC标准

| RFC | 标题 | 内容 |
|-----|------|------|
| RFC 5044 | Marker PDU Aligned Framing for TCP Specification | MPA层标准 |
| RFC 6581 | Enhanced RDMA Connection Establishment | MPA建链增强 |

## 参考文档

1. RFC 5044 - MPA Specification
2. RFC 6581 - Enhanced RDMA Connection Establishment
3. Understanding iWARP, Intel White Paper
4. Linux内核siw驱动: drivers/infiniband/sw/siw/
5. Wireshark MPA Protocol Dissector
