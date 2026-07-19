---
title: "Queue Buffer"
description: "详解 RDMA Queue Buffer 的分配、管理与 DMA 映射，以及与 QP 相关的缓冲区机制。"
date: "2026-07-19"
order: 18
tags: ["RDMA", "Queue Buffer", "DMA", "缓冲区"]
---
# Queue Buffer

> 注: 知乎原文403不可达，本文基于Queue Buffer原理及驱动实现重构

---

在前面的文章中，我们介绍了QP（Queue Pair）和CQ（Completion Queue）的概念。我们知道QP由SQ（Send Queue）和RQ（Receive Queue）组成，CQ用于存放完成信息。但这些队列本质上是什么？它们存放在哪里？软硬件如何通过这些队列交互？本文就来深入探讨Queue Buffer——这些队列的底层存储机制。

## 什么是Queue Buffer

Queue Buffer是SQ、RQ和CQ在内存中的实体。每个队列（WQ或CQ）实际上就是一段预先分配好的内存区域，这段内存区域就被称为Queue Buffer。

```
QP的软件视角：
┌──────────────────────────────────────────┐
│                  QP                      │
│  ┌──────────────────┬──────────────────┐ │
│  │    SQ Buffer     │    RQ Buffer     │ │
│  │  ┌──┬──┬──┬──┐  │  ┌──┬──┬──┬──┐  │ │
│  │  │W1│W2│W3│W4│  │  │W1│W2│W3│W4│  │ │
│  │  └──┴──┴──┴──┘  │  └──┴──┴──┴──┘  │ │
│  └──────────────────┴──────────────────┘ │
└──────────────────────────────────────────┘

CQ的软件视角：
┌──────────────────────────────────────────┐
│                 CQ Buffer                │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐       │
│  │C1│C2│C3│C4│C5│C6│C7│C8│C9│C10│       │
│  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘       │
└──────────────────────────────────────────┘
```

### Queue Buffer的物理位置

Queue Buffer可以位于：
1. **系统内存（Host Memory）**：最常用的方式，通过DMA访问
2. **HCA片内内存（On-chip Memory）**：某些高性能HCA会将部分队列放在片内SRAM中以减少延迟

对于位于系统内存中的Queue Buffer，其物理地址必须提前告知HCA，这样HCA才知道从哪里读取WQE或者写入CQE。

## Queue Buffer的创建流程

Queue Buffer的创建涉及用户态、内核态和硬件三方的协作。

### 第一步：用户态发起请求

用户在创建QP或CQ时，通过Verbs API传入队列的属性参数：

```c
// 创建QP时指定队列深度
struct ibv_qp_init_attr attr = {
    .cap = {
        .max_send_wr = 128,    // SQ最多容纳128个WQE
        .max_recv_wr = 128,    // RQ最多容纳128个WQE
        .max_send_sge = 1,     // 每个Send WQE最多1个SGE
        .max_recv_sge = 1,     // 每个Recv WQE最多1个SGE
    },
    .qp_type = IBV_QPT_RC,
};
struct ibv_qp *qp = ibv_create_qp(pd, &attr);
```

### 第二步：内核态分配内存

内核驱动根据用户请求的队列深度和WQE大小，计算出需要的Queue Buffer大小，然后分配物理连续的内存区域（或者通过IOMMU映射为连续的DMA地址）。

```
SQ Buffer大小 = max_send_wr × sizeof(Send WQE)
RQ Buffer大小 = max_recv_wr × sizeof(Recv WQE)
CQ Buffer大小 = max_cqe × sizeof(CQE)
```

### 第三步：注册到硬件

驱动将Queue Buffer的物理地址、大小等信息写入HCA的寄存器或QPC（Queue Pair Context）中。这样HCA就知道从哪里读取WQE和写入CQE。

```
内核驱动创建的QPC内容（简化）：
┌─────────────────────────────────────┐
│ QPC (Queue Pair Context)            │
│─────────────────────────────────────│
│ SQ Buffer PA:   0x000000007f123000 │
│ SQ Buffer Size: 8192 bytes         │
│ SQ Head (SW):   0                  │
│ SQ Tail (HW):   0                  │
│─────────────────────────────────────│
│ RQ Buffer PA:   0x000000007f125000 │
│ RQ Buffer Size: 8192 bytes         │
│ RQ Head (SW):   0                  │
│ RQ Tail (HW):   0                  │
└─────────────────────────────────────┘
```

### 第四步：Doorbell机制

Queue Buffer创建完成后，用户态程序通过mmap获取Doorbell寄存器的地址。当用户下发WR时，在将WQE写入Queue Buffer后，需要敲响Doorbell通知HCA有新的WQE需要处理。

```
用户态下发送WQE的完整流程：

① 用户调用ibv_post_send()
② libibverbs库从SQ Buffer中获取下一个可用的WQE槽位
③ 将WR的内容按照WQE格式填入SQ Buffer
④ 写Doorbell寄存器，通知HCA
⑤ HCA收到Doorbell，从SQ Buffer中读取WQE
⑥ HCA处理WQE（如发送数据）
⑦ 处理完成后，向CQ Buffer写入CQE
⑧ （可选）通过Event Channel通知用户
```

## WQE的结构与布局

### WQE在Buffer中的排列

WQE在Queue Buffer中是连续排列的。每个WQE的大小由操作类型和SGE数量决定。

```
SQ Buffer布局：
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  WQE 0   │  WQE 1   │  WQE 2   │  WQE 3   │   ...    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 64 bytes │ 64 bytes │ 64 bytes │ 64 bytes │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
↑                                                   ↑
Head (软件写入位置)                              Tail (硬件处理位置)
```

### WQE的典型格式

一个WQE通常包含以下域段（具体格式因厂商和操作类型而异）：

```
Send WQE格式（以Mellanox CX-5为例）：
┌────────────────────────────────────────┐
│  Control Segment                       │
│  ├─ opcode: SEND/RDMA_WRITE/...       │
│  ├─ wqe_id: 用户提供的WR ID           │
│  ├─ flags: 信号量请求/内联数据等标志   │
│  └─ total_len: 数据总长度              │
├────────────────────────────────────────┤
│  Data Segment (SGE) #1                 │
│  ├─ lkey: 本地MR的L_Key               │
│  ├─ addr: 数据的虚拟地址               │
│  └─ len: 数据长度                      │
├────────────────────────────────────────┤
│  Data Segment (SGE) #2 (可选)          │
│  ...                                   │
├────────────────────────────────────────┤
│  RDMA Segment (仅RDMA操作)             │
│  ├─ remote_addr: 远端虚拟地址          │
│  └─ rkey: 远端MR的R_Key               │
└────────────────────────────────────────┘
```

### CQE的典型格式

CQE的格式相对固定：

```
CQE格式（以Mellanox CX-5为例，32字节）：
┌────────────────────────────────────────┐
│  Byte 0-3:    opcode + status          │
│  Byte 4-7:    qp_num                   │
│  Byte 8-15:   wr_id (低64位)           │
│  Byte 16-23:  byte_len + imm_data      │
│  Byte 24-27:  src_qp                   │
│  Byte 28-31:  校验 / 标志位            │
└────────────────────────────────────────┘
```

## 环形队列（Ring Buffer）管理

Queue Buffer通常以环形队列（Ring Buffer / Circular Buffer）的形式管理。环形队列有以下优点：
- 固定大小，无需动态分配
- 入队/出队操作简单（只需移动指针）
- 可以高效地实现生产者-消费者模型

### 环形队列的结构

```
初始状态（空的环形队列）：
        Head (生产者/软件写入位置)
        Tail (消费者/硬件处理位置)
        ↓
    ┌──┬──┬──┬──┬──┬──┬──┬──┐
    │  │  │  │  │  │  │  │  │
    └──┴──┴──┴──┴──┴──┴──┴──┘
    ↑
    Head = Tail = 0


入队3个WQE后：
                Tail
                ↓
    ┌──┬──┬──┬──┬──┬──┬──┬──┐
    │W1│W2│W3│  │  │  │  │  │
    └──┴──┴──┴──┴──┴──┴──┴──┘
    ↑
    Head = 3, Tail = 0


硬件处理了2个WQE后：
                Tail
                ↓
    ┌──┬──┬──┬──┬──┬──┬──┬──┐
    │W1│W2│W3│  │  │  │  │  │ (W1、W2已被硬件消费)
    └──┴──┴──┴──┴──┴──┴──┴──┘
                ↑
                Head = 3, Tail = 2
```

### Head和Tail指针

对于SQ/RQ：
- **Head指针（软件维护）**：指向软件下一个要写入WQE的位置。每次软件下发WR后，Head递增。
- **Tail指针（硬件维护）**：指向硬件下一个要取走的WQE位置。每次硬件处理完一个WQE后，Tail递增。

对于CQ：
- **Head指针（硬件维护）**：指向硬件下一个要写入CQE的位置。
- **Tail指针（软件维护）**：指向软件下一个要读取的CQE位置。每次软件Poll CQ后，Tail递增。

```
SQ/RQ的生产者-消费者模型：
┌─────────┐         ┌──────────┐        ┌─────────┐
│  Software │ ──Post──▶│ SQ Buffer │ ──Fetch─▶│ Hardware│
│ (Producer)│         │ (Ring Buf)│         │(Consumer)│
└─────────┘         └──────────┘        └─────────┘
  维护Head指针                          维护Tail指针

CQ的生产者-消费者模型：
┌─────────┐         ┌──────────┐        ┌─────────┐
│ Hardware│ ──Write─▶│ CQ Buffer │ ──Poll──▶│ Software│
│(Producer)│         │ (Ring Buf)│         │(Consumer)│
└─────────┘         └──────────┘        └─────────┘
  维护Head指针                          维护Tail指针
```

### 队列满与队列空

环形队列需要区分"满"和"空"两种状态：

```
队列空：Head == Tail
    ┌──┬──┬──┬──┬──┐
    │  │  │  │  │  │
    └──┴──┴──┴──┴──┘
    ↑
    Head = Tail

队列满：(Head + 1) % N == Tail (预留一个槽位区分)
    ┌──┬──┬──┬──┬──┐
    │W1│W2│W3│W4│  │
    └──┴──┴──┴──┴──┘
        ↑
        Tail
    Head = 0 (越过尾部回到起点)
```

当SQ满时，ibv_post_send()返回错误，用户需要等待硬件处理完一些WQE释放空间后再下发。

## Doorbell机制详解

Doorbell是软件通知硬件有新的WQE需要处理的关键机制。Doorbell通常映射到HCA的PCIe BAR空间中的一段寄存器。

### Doorbell的工作流程

```
┌─────────────┐          Doorbell Write          ┌─────────────┐
│  用户态APP  │ ──(写寄存器: QPN + WQE计数)──▶  │    HCA      │
│             │                                  │             │
│ ① 填写WQE  │                                  │ ⑤ 读取WQE  │
│   到SQ Buffer│                                  │   处理WQE  │
│ ② 写Doorbell│                                  │ ⑥ 写入CQE  │
│ ③ 返回      │                                  │   到CQ Buffer│
└─────────────┘                                  └─────────────┘
```

Doorbell写操作的内容通常包括：
- **QPN**：标识哪个QP有新的WQE
- **WQE计数**：本次新增了多少个WQE（可以批量Doorbell，一次通知多个WQE）

Doorbell的优势：
- 用户态直接操作，无需陷入内核
- 批量通知，减少PCIe事务次数
- 使能HCA的WQE预取优化

### BlueFlame（蓝色火焰）技术

Mellanox HCA实现了BlueFlame技术，将Doorbell写入和WQE数据写入合并。在写入Doorbell的同时，将小尺寸WQE（≤Cache Line大小）一并写入到HCA的PCIe BAR空间中，减少PCIe事务的往返次数。

```
传统Doorbell：
① 写WQE到系统内存 (PCIe写事务)
② 写Doorbell寄存器 (PCIe写事务)
③ HCA从系统内存读取WQE (PCIe读事务)
总计：3次PCIe事务

BlueFlame Doorbell：
① 写Doorbell + 小WQE到BAR空间 (PCIe写事务，合并写入)
    对于小WQE，HCA不需要再回读系统内存
总计：1次PCIe事务
```

## Queue Buffer的同步机制

### Producer Index与Consumer Index

除了Head和Tail指针外，驱动和硬件还可以维护Producer Index和Consumer Index来实现更精细的队列管理：

```
SQ例子：
┌─────────────────────────────────┐
│ PCIe Doorbell:                  │
│ 写入: QPN=3, Produced=5         │
│ 含义: QP3的SQ又产生了5个WQE     │
└─────────────────────────────────┘

HCA内部维护：
  SQ Consumer Index = 2 (硬件已处理到第2个)
  Doorbell通知 Produced = 5 (软件已提交到第7个)
  → 硬件需要处理 WQE[2], WQE[3], ..., WQE[6]
```

### WQE溢出保护

为了防止软件提交的WQE超过Queue Buffer的容量，驱动在提交WQE前需要检查是否有足够的空间。如果队列满，ibv_post_send()会返回错误（ENOMEM），用户需要等待硬件消耗一些WQE后再提交。

```c
// 驱动内部的伪代码
int ibv_post_send(struct ibv_qp *qp, struct ibv_send_wr *wr) {
    // 检查SQ是否有足够空间
    if (sq_full(qp)) {
        *bad_wr = wr;
        return ENOMEM;
    }
    
    // 将WR转换为WQE，填入SQ Buffer
    wqe = get_sq_wqe(qp);
    fill_wqe(wqe, wr);
    
    // 更新Head指针
    qp->sq_head++;
    
    // 写Doorbell
    write_doorbell(qp->doorbell, qp->qp_num, 1);
    
    return 0;
}
```

## Queue Buffer与Cache一致性

### 内存屏障

由于软件写Queue Buffer和硬件读Queue Buffer之间没有同步机制（除了Doorbell），因此需要内存屏障来保证顺序：

```c
// 伪代码：提交WQE的内存屏障处理
void post_wqe(struct ibv_qp *qp, struct wqe *wqe) {
    // 1. 填写WQE内容到SQ Buffer
    memcpy(sq_buffer + offset, wqe, wqe_size);
    
    // 2. 内存屏障：确保WQE内容在Doorbell之前被硬件看到
    wmb();  // write memory barrier
    
    // 3. 写Doorbell
    writel(doorbell_addr, doorbell_value);
}
```

### 缓存行对齐

为了提高性能，WQE和CQE通常按照CPU Cache Line大小（64字节）对齐。这样可以避免伪共享（False Sharing）问题——即多个核心同时修改同一缓存行中的不同数据导致的性能下降。

## QPC（Queue Pair Context）与Queue Buffer的关系

QPC是驱动和硬件之间共享的QP控制信息块。QPC中包含了Queue Buffer的地址和大小等关键信息。

```
内存布局：
┌─────────────────────────────────────────────┐
│  QPC (由驱动填写，硬件读取)                   │
│  ├─ SQ Buffer Address (Physical)            │
│  ├─ SQ Buffer Size                          │
│  ├─ SQ WQE Size                             │
│  ├─ RQ Buffer Address (Physical)            │
│  ├─ RQ Buffer Size                          │
│  ├─ SQ Consumer Index (由硬件更新)           │
│  ├─ ...                                     │
├─────────────────────────────────────────────┤
│  SQ Buffer (由用户填写，硬件读取)             │
│  ├─ WQE 0                                   │
│  ├─ WQE 1                                   │
│  ├─ ...                                     │
├─────────────────────────────────────────────┤
│  RQ Buffer (由用户填写，硬件读取)             │
│  ├─ WQE 0                                   │
│  ├─ WQE 1                                   │
│  ├─ ...                                     │
├─────────────────────────────────────────────┤
│  CQ Buffer (由硬件填写，软件读取)             │
│  ├─ CQE 0                                   │
│  ├─ CQE 1                                   │
│  ├─ ...                                     │
└─────────────────────────────────────────────┘
```

QPC本身也存放在系统内存中，HCA内部缓存了QPC的部分内容以加速访问。

## 跨页问题

当Queue Buffer跨越内存页边界时，需要特殊的处理。因为HCA通过DMA访问Queue Buffer，而DMA使用物理地址，如果Queue Buffer跨页，HCA需要处理不连续的物理地址。

### 解决方案

1. **分配连续物理内存**：要求Queue Buffer所在的物理内存是连续的。

2. **使用Scatter List**：对于不支持连续物理内存的情况，驱动向HCA提供一组物理地址片段（Scatter List），HCA通过遍历这些片段来访问完整的Queue Buffer。

3. **IOMMU映射**：通过IOMMU将不连续的物理页映射为连续的I/O虚拟地址空间，HCA看到的是一段连续的地址。

## 性能优化

### 批量提交

一次Doorbell通知可以携带多个WQE的计数，允许硬件批量处理：

```c
// 批量提交多个WR
for (int i = 0; i < N; i++) {
    fill_wqe(sq_buffer + i * wqe_size, &wrs[i]);
}
// 一次Doorbell通知N个WQE
write_doorbell(doorbell, qpn, N);
```

### WQE预取

一些HCA在收到Doorbell后，会通过DMA预取接下来可能要用到的WQE到片内缓存中，减少后续读取WQE的延迟。

### 内联数据（Inline Data）

对于小数据量的SEND操作，可以将数据直接嵌入WQE中，而不是通过SGE指针指向独立的数据缓冲区。这样HCA不需要额外读取数据缓冲区，减少了DMA操作次数。

```c
// 设置内联数据标志
wr.send_flags |= IBV_SEND_INLINE;
// 数据被直接复制到WQE中
```

内联数据的典型阈值是几十字节到几百字节（取决于HCA实现），超过阈值的数据仍然需要通过SGE指针引用。

## 总结

Queue Buffer是RDMA队列系统的底层存储设施，是连接软件和硬件的关键桥梁。理解Queue Buffer的创建、管理、同步和优化机制，对于深入理解RDMA的工作原理以及进行高性能RDMA应用的开发调优都至关重要。

本文从Queue Buffer的概念出发，介绍了环形队列管理、Doorbell机制、内存屏障、QPC等核心概念，以及批量提交、内联数据等性能优化技术。这些知识是理解RDMA数据路径的底层基础。

## IB规范相关章节

- 10.2.4 QP与Queue Buffer
- 10.2.8 CQ与Queue Buffer
- 10.8.6 完成通知机制
- 11.4 Post Send / Post Recv操作

## 参考文档

1. IB Specification Vol 1-Release-1.4
2. Mellanox ConnectX-5 PRM (Programmer's Reference Manual)
3. RDMA Aware Networks Programming User Manual Rev 1.7
4. Linux kernel RDMA subsystem: drivers/infiniband/
