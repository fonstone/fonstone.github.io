---
title: "iWARP 之 RDMAP"
description: "详解 iWARP 协议栈中的 RDMAP 层——远程直接内存访问协议，操作语义与报文格式。"
date: "2026-07-19"
order: 22
tags: ["RDMA", "iWARP", "RDMAP", "协议"]
---
# iWARP 之 RDMAP

> 注: 知乎原文403不可达，本文基于RFC 5040/5041/5042及iWARP协议栈机制重构

---

在iWARP协议栈中，RDMAP（Remote Direct Memory Access Protocol）是最靠近用户的一层，为上层应用提供RDMA操作的语义。它依赖于下层的DDP（Direct Data Placement）协议提供的零拷贝能力，实现了Send、RDMA Write和RDMA Read等操作。

## RDMAP在iWARP协议栈中的位置

iWARP协议栈由三层组成，从下到上依次是MPA、DDP和RDMAP：

```
                    ┌──────────────────────────┐
                    │   Upper Layer Protocol    │
                    │  (iSCSI, NVMe-of, ...)   │
                    ├──────────────────────────┤
                    │         RDMAP            │
                    │  (RDMA语义: Send/Write/Read)│
                    ├──────────────────────────┤
                    │         DDP              │
                    │  (直接数据放置/零拷贝)     │
                    ├──────────────────────────┤
                    │         MPA              │
                    │  (TCP流中的PDU定界)       │
                    ├──────────────────────────┤
                    │         TCP              │
                    │  (可靠传输)               │
                    ├──────────────────────────┤
                    │         IP               │
                    ├──────────────────────────┤
                    │       Ethernet           │
                    └──────────────────────────┘
```

RDMAP位于iWARP协议栈的最顶层，直接为ULP（Upper Layer Protocol）提供RDMA语义。RDMAP层定义了三类核心操作——Send、RDMA Write和RDMA Read，以及一个控制操作Terminate。

![](/images/rdma/7d1e9f5737d2de722658d92650aadbdf.png)

RDMAP层的功能示意图

## RDMAP概述

### RDMAP提供的服务

| 操作 | 类型 | 描述 | 对应Verbs接口 |
|------|------|------|---------------|
| Send | 双端操作 | 发送数据，接收端需预先下发RECV | ibv_post_send(IBV_WR_SEND) |
| RDMA Write | 单端操作 | 直接写入远端内存 | ibv_post_send(IBV_WR_RDMA_WRITE) |
| RDMA Read | 单端操作 | 从远端内存读取数据 | ibv_post_send(IBV_WR_RDMA_READ) |
| Terminate | 控制操作 | 终止连接并报告错误 | — |

### 角色定义

RDMAP中定义了两种角色：

- **Initiator（发起方）**：发起RDMA操作的节点
- **Responder（响应方）**：响应RDMA操作的节点

不同的操作中，同一节点的角色可能不同：

| 操作 | Initiator | Responder |
|------|-----------|-----------|
| Send | 数据发送方 | 数据接收方 |
| RDMA Write | 数据发送方（写入远端） | 数据接收方（被写入） |
| RDMA Read | 请求发起方（接收数据） | 数据提供方（发送数据） |

## RDMAP报文格式

RDMAP报文头紧跟在DDP头之后，作为DDP Payload的一部分。

### 通用Header格式

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├───────┬───────┬───────┬───────────────────────────────────────┤
│ OpCode│  SF   │ RSVD  │  Invalidate STag (可选) / 扩展字段    │
├───────┴───────┴───────┴───────────────────────────────────────┤
│                 RDMA Data / Header Extension                  │
└───────────────────────────────────────────────────────────────┘
```

字段说明：

- **OpCode（8 bits）**：操作码，标识操作类型
- **SF（2 bits, Send Flags）**：仅用于Send操作，标识是否带立即数或Solicited事件
- **RSVD（6 bits）**：保留位
- **Invalidate STag（32 bits，可选）**：用于在操作完成后自动使远端STag失效

### OpCode定义

| OpCode | 值 | 操作 | 说明 |
|--------|-----|------|------|
| RDMA_WRITE | 0x00 | RDMA Write | 单次写入，不分段 |
| RDMA_WRITE_FIRST | 0x06 | RDMA Write (首段) | 分段写的第一段 |
| RDMA_WRITE_MIDDLE | 0x07 | RDMA Write (中间段) | 分段写的中间段 |
| RDMA_WRITE_LAST | 0x08 | RDMA Write (末段) | 分段写的最后一段 |
| RDMA_READ_REQ | 0x01 | RDMA Read请求 | 发起读请求 |
| RDMA_READ_RESP | 0x02 | RDMA Read响应 | 响应读请求 |
| SEND_LAST | 0x03 | Send (末段/不分段) | 单个Send或最后一段 |
| SEND_FIRST | 0x04 | Send (首段) | 分段Send的第一段 |
| SEND_MIDDLE | 0x05 | Send (中间段) | 分段Send的中间段 |
| TERMINATE | 0x09 | 终止连接 | 错误终止 |

## RDMAP操作详解

### Send操作

Send是双端操作，接收端必须预先下发RECV WR。Send使用DDP的Untagged Buffer Model——接收端提前准备好一组接收Buffer，硬件按序使用。

**操作流程：**

```
Initiator (发送方)                     Responder (接收方)
       │                                    │
       │  ① 下发RECV WR到RQ                │
       │   (准备接收缓冲区)                  │
       │                                    │
       │  ② 下发SEND WR到SQ                │
       │   (指定待发送数据)                  │
       │                                    │
       │  ③ HCA读取数据，组装DDP+RDMAP报文  │
       │                                    │
       │  ── RDMAP Send (Untagged DDP) ──▶  │
       │                                    │
       │                                    │  ④ HCA解析DDP Untagged信息
       │                                    │  ⑤ 从指定队列取出Buffer
       │                                    │  ⑥ DMA写入数据
       │                                    │  ⑦ 生成CQE通知ULP
       │                                    │
       │  ◀──── TCP ACK ─────────────       │
       │                                    │
       │  ⑧ 生成CQE                        │
       │                                    │
```

**Send Header格式：**
```
├───────┬───────┬───────┬───────────────────────────────────────┤
│0x03/  │ SF=0  │ RSVD  │                 0                    │
│0x04/  │       │       │                                       │
│0x05   │       │       │                                       │
├───────┴───────┴───────┴───────────────────────────────────────┤
│                DDP Untagged Header                             │
│  ┌───────────┬────────────┬────────────┬─────────────────┐    │
│  │ QN(队列号)│ MSN(消息号)│ MO(偏移)   │                 │    │
│  └───────────┴────────────┴────────────┴─────────────────┘    │
├───────────────────────────────────────────────────────────────┤
│                       Payload (用户数据)                       │
└───────────────────────────────────────────────────────────────┘
```

**Send操作的特征：**
- 双端操作，两端CPU都需要参与
- 接收端决定数据存放位置（通过RECV WR指定的Buffer）
- 适用于控制消息、RPC调用等场景
- 与Socket的send/recv语义最接近

### RDMA Write操作

RDMA Write是单端操作。Initiator直接向Responder预先指定的内存区域写入数据，Responder的CPU完全不感知数据的写入。

**操作流程：**

```
Initiator                               Responder
    │                                        │
    │  ① 通过带外方式获取Responder的         │
    │     STag + 地址信息                     │
    │                                        │
    │  ② 下发RDMA WRITE WR到SQ              │
    │   (本地数据 + 远端STag+TO+长度)         │
    │                                        │
    │  ③ HCA读取本地数据，组装报文           │
    │                                        │
    │  ── RDMAP RDMA Write (Tagged DDP) ──▶ │
    │                                        │
    │                                        │  ④ HCA解析STag
    │                                        │  ⑤ 查MTT: STag→PA
    │                                        │  ⑥ 校验权限
    │                                        │  ⑦ DMA写入数据(零拷贝!)
    │                                        │  ⑧ 生成CQE
    │                                        │
    │  ◀──── TCP ACK ─────────────           │
    │                                        │
    │  ⑨ 生成CQE                            │
    │                                        │
```

**RDMA Write Header格式：**
```
├───────┬───────┬───────┬───────────────────────────────────────┤
│0x00/  │ RSVD  │          Invalidate STag (可选)               │
│0x06~  │       │                                               │
│0x08   │       │                                               │
├───────┴───────┴───────┴───────────────────────────────────────┤
│                  DDP Tagged Header                             │
│  ┌─────────────────────┬──────────────────────────────────┐   │
│  │       STag          │        Tagged Offset (TO)        │   │
│  └─────────────────────┴──────────────────────────────────┘   │
├───────────────────────────────────────────────────────────────┤
│                       Payload (用户数据)                       │
└───────────────────────────────────────────────────────────────┘
```

**分段写入：** 当数据量超过TCP MSS时，RDMAP将数据分成多个Segment发送。第一个Segment的OpCode为RDMA_WRITE_FIRST，中间段为RDMA_WRITE_MIDDLE，最后一段为RDMA_WRITE_LAST。所有分段使用相同的STag和连续的TO。

### RDMA Read操作

RDMA Read是唯一需要两次交互的RDMAP操作。Initiator先发送Read Request，Responder回复Read Response。

**操作流程：**

```
Initiator                               Responder
    │                                        │
    │  ① 获取Responder的STag+地址            │
    │                                        │
    │  ② 准备接收数据的本地Buffer            │
    │                                        │
    │  ── RDMA Read Request ──────────────▶  │
    │  (携带Sink STag + Source STag+TO)      │
    │                                        │  ③ HCA解析请求
    │                                        │  ④ 通过Source STag找到数据
    │                                        │  ⑤ DMA读取数据
    │                                        │
    │  ◀── RDMA Read Response ────────────   │
    │  (携带Sink STag + 数据)                │
    │                                        │
    │  ⑥ 通过Sink STag将数据DMA到本地Buffer │
    │  ⑦ 生成CQE                            │
    │                                        │
```

**RDMA Read Request格式：**
```
├───────┬───────┬───────────────────────────────────────────────┤
│0x01   │ RSVD  │          Sink STag (Initiator的接收Buffer)    │
├───────┴───────┴───────────────────────────────────────────────┤
│                        Sink TO (偏移)                          │
├───────────────────────────────────────────────────────────────┤
│                  DDP Untagged Header (传输请求本身)            │
├───────────────────────────────────────────────────────────────┤
│   RDMAP Read Request Extension:                               │
│   ┌──────────────┬────────────────────────────────────────┐   │
│   │ Source STag  │      Source TO                         │   │
│   │ (Responder上 │  (Responder上待读取数据的偏移)          │   │
│   │  的数据STag) │                                        │   │
│   └──────────────┴────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

**RDMA Read Response格式：**
```
├───────┬───────┬───────────────────────────────────────────────┤
│0x02   │ RSVD  │              Sink STag (与Request一致)        │
├───────┴───────┴───────────────────────────────────────────────┤
│                        Sink TO                                 │
├───────────────────────────────────────────────────────────────┤
│                  DDP Tagged Header                             │
│  ┌──────────────┬────────────────────────────────────────┐    │
│  │   Sink STag  │            Sink TO                     │    │
│  └──────────────┴────────────────────────────────────────┘    │
├───────────────────────────────────────────────────────────────┤
│                       Payload (读取的数据)                     │
└───────────────────────────────────────────────────────────────┘
```

RDMA Read的延迟比RDMA Write高——它需要至少一个完整的RTT。但其优势在于Initiator可以按需拉取数据，不需要Responder提前推送。

### Terminate操作

当连接出现致命错误时，任意一方可以发送Terminate消息来终止连接。Terminate消息的DDP层总是使用Untagged Buffer Model。

```
├───────┬───────┬───────┬───────────────────────────────────────┤
│0x09   │ RSVD  │ Layer │ ETyp  │      Error Data               │
├───────┴───────┴───────┴───────┴───────────────────────────────┤
│                   Terminate Control Data                       │
└───────────────────────────────────────────────────────────────┘
```

- **Layer Code**：标识错误发生的协议层（1=RDMAP, 2=DDP, 3=MPA, 4=TCP）
- **ETyp（Error Type）**：具体的错误类型码

## RDMAP与DDP的协作

RDMAP本身不处理数据传输的细节，而是通过DDP层来完成数据的放置。两者的协作关系如下：

| RDMAP操作 | DDP Buffer Model | 说明 |
|-----------|-----------------|------|
| Send | Untagged Buffer | 接收端从Untagged队列中取Buffer存放数据 |
| RDMA Write | Tagged Buffer | 通过STag直接定位接收Buffer |
| RDMA Read Request | Untagged Buffer | 传输控制信息（请求） |
| RDMA Read Response | Tagged Buffer | 通过Sink STag直接写入Initiator内存 |

这个协作关系决定了iWARP协议栈的分层设计思路——RDMAP关注"做什么"（操作语义），DDP关注"怎么做"（数据放置）。

## RDMAP与IB/RoCE的操作对比

| 对比项 | IB/RoCE | iWARP RDMAP |
|--------|---------|-------------|
| 地址标识 | GID + QPN + R_Key | IP + STag |
| 内存管理 | MR (Memory Region), PD隔离 | STag直接标识内存区域 |
| 传输层 | IB传输层 / RoCE UDP | TCP（可靠但更重） |
| 流控 | 基于Credits的链路层流控 | TCP滑动窗口 |
| Send操作 | 支持SEND/RECV | 支持Send + 立即数 |
| RDMA Write | 支持 | 支持 + 自动Invalidate |
| RDMA Read | 支持 | 支持 |
| 服务类型 | RC/UC/UD等多种 | 仅RC（因基于TCP） |

## Wireshark抓包分析

本节通过Wireshark抓包截图来分析RDMAP报文。

### iWARP报文层次

下图展示了Wireshark中iWARP报文的层次结构。一个完整的iWARP数据包从上到下依次是：Ethernet → IP → TCP → MPA → DDP → RDMAP：

```
Wireshark协议解析树：
Frame
├── Ethernet II
├── Internet Protocol Version 4
├── Transmission Control Protocol
├── MPA: Marker PDU Aligned Framing
│   └── DDP: Direct Data Placement
│       ├── T=1 (Tagged Buffer)
│       ├── STag: 0x00010001
│       └── TO: 0
│       └── RDMAP: Remote Direct Memory Access Protocol
│           ├── OpCode: RDMA_WRITE_LAST (0x08)
│           └── [Data: 1428 bytes]
└── [Payload]
```

![](/images/rdma/d5264440159d516d2f1a586bbd522885.png)

Wireshark中的iWARP报文层次（DDP/RDMAP被划分在一起）

### Send操作抓包

以下是Send操作的抓包示例（使用Untagged Buffer Model）：

```
iWARP DDP
    T: 0 (Untagged Buffer)
    L: 1 (Last Segment)
    DV: 1
    QN: 0
    MSN: 8
    MO: 0
iWARP RDMAP
    OpCode: SEND_LAST (0x03)
    SendFlags: 0x00
```

Send操作中，RDMAP Header之后的Payload即为用户发送的数据。接收端通过QN+MSN确定使用哪个接收Buffer。

### RDMA Write操作抓包

RDMA Write使用Tagged Buffer Model。如果数据超过MSS，会被分片：

```
Segment 1 (RDMA_WRITE_FIRST):
iWARP DDP
    T: 1 (Tagged Buffer)
    L: 0 (非最后一段)
    STag: 0x00010001
    TO: 0
iWARP RDMAP
    OpCode: RDMA_WRITE_FIRST (0x06)
    [Data: 1428 bytes]

Segment 2 (RDMA_WRITE_LAST):
iWARP DDP
    T: 1 (Tagged Buffer)
    L: 1 (最后一段)
    STag: 0x00010001
    TO: 1428
iWARP RDMAP
    OpCode: RDMA_WRITE_LAST (0x08)
    [Data: 72 bytes]
```

两个分段共享同一个STag，TO的值为前一段数据的累积偏移。

### RDMA Read操作抓包

RDMA Read分为请求和响应两个阶段：

**Request（使用Untagged Buffer传送控制信息）：**
```
iWARP DDP: Untagged (QN=1, MSN=2)
iWARP RDMAP: RDMA_READ_REQ (0x01)
    Sink STag: 0x00020002  (Initiator接收数据的STag)
    Sink TO: 0
    Source STag: 0x00010001 (Responder上数据的STag)
    Source TO: 0
```

**Response（使用Tagged Buffer直接写入Initiator内存）：**
```
iWARP DDP: Tagged (STag=0x00020002, TO=0)
iWARP RDMAP: RDMA_READ_RESP (0x02)
    [Data: 读取的数据]
```

## RDMAP的流控与错误处理

### 流控

RDMAP的流控主要依赖TCP的滑动窗口机制。此外，对于Send操作，如果接收端没有足够的RECV WR（Untagged Buffer），会产生RNR-like错误。在iWARP中，这通常通过TCP的接收窗口机制来处理。

### 错误分类

RDMAP规范（RFC 5040）定义的错误类型：

| 错误类型 | 描述 |
|---------|------|
| 本地操作错误 | 本地Verbs接口调用错误 |
| 本地协议错误 | 协议解析错误（如非法OpCode） |
| 远端协议错误 | 对端报告的错误 |
| 远端内存错误 | STag无效/权限不足 |
| Terminate | 致命错误，终止连接 |

## RDMAP的安全机制（RFC 5042）

### STag保护

STag由两部分组成：24位的Index和8位的Key。Index用于MTT查询，Key用于防止STag被伪造。这种设计与IB/RoCE的Memory Key机制类似。

### 访问权限控制

每个STag关联的Tagged Buffer都有访问权限控制：

- **本地读/写**：本端CPU是否可以访问
- **远端读/写**：远端Initiator是否可以RDMA Read/Write
- **远端原子操作**：是否需要支持原子操作

## 总结

RDMAP是iWARP协议栈中最靠近用户的一层，定义了Send、RDMA Write、RDMA Read三种核心操作语义。它依赖于DDP层提供的数据放置能力，实现零拷贝的高效数据传输。

与Infiniband和RoCE中的Verbs API相比，iWARP RDMAP提供了一组相似但有所不同的操作接口。主要差异源于iWARP基于TCP传输——这使得iWARP在有损网络中表现更好，但也增加了协议栈的层次和复杂度。

理解RDMAP的报文格式、操作流程和与DDP的协作关系，是深入掌握iWARP协议栈的关键。

## RFC标准

| RFC | 标题 | 内容 |
|-----|------|------|
| RFC 5040 | A Remote Direct Memory Access Protocol Specification | RDMAP层标准 |
| RFC 5041 | Direct Data Placement over Reliable Transports | DDP层标准 |
| RFC 5042 | DDP/RDMAP Security | 安全分析 |
| RFC 5044 | Marker PDU Aligned Framing for TCP Specification | MPA层标准 |
| RFC 7306 | RDMA Protocol Extensions | 扩展（Atomic、立即数） |

## 参考文档

1. RFC 5040 - RDMAP Specification
2. RFC 5041 - DDP Specification
3. RFC 5042 - DDP/RDMAP Security
4. Understanding iWARP, Intel White Paper
5. Wireshark iWARP Protocol Dissector
