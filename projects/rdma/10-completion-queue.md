---
title: "RDMA 之 Completion Queue"
description: "详解 Completion Queue 的概念、CQ 的创建、轮询与事件通知机制，以及 CQ 与 QP 的关联关系。"
date: "2026-07-19"
order: 10
tags: ["RDMA", "Completion Queue", "CQ", "完成事件"]
---
# RDMA 之 Completion Queue

> 注: 知乎原文403不可达，本文基于IB规范及专栏上下文重构

---

我们在前面的文章中反复提到过CQ的概念，在[RDMA基本元素](03_3. RDMA基本元素和编程基础.md)一文中我们简单介绍了CQ和CQE，在[Queue Pair](09_9. RDMA之Queue Pair.md)一文中也已说明QP与CQ的关联关系。本文将对CQ进行更深入的讲解。

## CQ的概念

CQ全称为Completion Queue，即完成队列。它是RDMA技术中用来向用户报告WQE（Work Queue Element）处理完成情况的机制。与SQ/RQ这对"任务下发"队列相对，CQ是"任务完成汇报"的队列。

CQ是一个FIFO队列，其中存放的元素称为CQE（Completion Queue Element）。每当硬件完成了一个WQE的处理（无论是成功还是出错），就会生成一个对应的CQE放入CQ中。用户通过从CQ中取出CQE来感知任务的完成状态。

简而言之，软件通过WQ（SQ/RQ）给硬件下任务，硬件通过CQ向软件汇报任务结果。

```
┌─────────────────────────────────────────────────────────────┐
│                        RDMA Software Stack                 │
│                                                             │
│  ┌─────────┐          ┌─────────┐          ┌─────────┐     │
│  │    WQ   │          │    WQ   │          │    CQ   │     │
│  │ (SQ/RQ) │          │ (SQ/RQ) │          │        │     │
│  │ WQE WQE │  ──────▶ │ WQE WQE │  ──────▶ │ CQE    │     │
│  │ WQE     │  POST    │ WQE     │  COMPL.  │ CQE    │     │
│  └─────────┘          └─────────┘          └─────────┘     │
│       │                     │                    │          │
│       ▼                     ▼                    ▼          │
│  ┌──────────────────────────────────────────────────┐      │
│  │                    RDMA Hardware                  │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 为什么需要CQ

如果硬件完成了一个WQE的处理，它需要以某种方式知会软件。CQ就是这种"通知"的载体。通过轮询(Poll)CQ或事件(Event)机制，软件可以获知WQE的完成状态，从而进行下一步操作（如释放缓冲区、发起新的操作等）。

CQ与WQ的关系如下图所示：

```
         SQ          RQ
          │           │
          │     QP    │
          ├─────┬─────┤
          │     │     │
          │ WQE │ WQE │
          │ WQE │ WQE │
          │ WQE │ WQE │
          └──┬──┴──┬──┘
             │     │
             ▼     ▼
         ┌───────────┐
         │    CQ     │
         │ CQE  CQE  │
         │ CQE  CQE  │
         └───────────┘
```

## CQE的结构

CQE是CQ中的元素，用来描述一个WQE的完成情况。一个CQE主要包含以下关键信息：

### wr_id

用户自定义的WR ID。用户在提交WR时可以设置wr_id，硬件在处理完成时会原封不动地将其放在CQE中返回。这样用户就可以通过wr_id来区分是哪个WR完成了。

### status

完成状态。表示WQE是被成功执行还是遇到了错误。常见的状态值包括：

| 状态值 | 名称 | 含义 |
|--------|------|------|
| 0 | IBV_WC_SUCCESS | 成功完成 |
| 5 | IBV_WC_WR_FLUSH_ERR | WR被Flush（QP进入错误状态） |
| 6 | IBV_WC_RETRY_EXC_ERR | 重试次数超限 |
| 9 | IBV_WC_REM_ACCESS_ERR | 远端访问权限错误 |
| 11 | IBV_WC_REM_OP_ERR | 远端操作错误 |
| 13 | IBV_WC_RNR_RETRY_EXC_ERR | RNR重试次数超限 |

### opcode

操作码。标识这个CQE是由哪种操作产生的。对于Send操作完成产生的CQE，opcode为IBV_WC_SEND；对于RDMA Write操作完成产生的CQE，opcode为IBV_WC_RDMA_WRITE；对于RECV操作完成产生的CQE，opcode为IBV_WC_RECV等。

### byte_len

传输的字节数。对于RECV操作，byte_len表示实际收到的数据长度；对于SEND操作，表示实际发送的数据长度。

### imm_data

立即数（网络字节序）。如果发送端在SEND操作中携带了立即数，接收端可以在对应的CQE中获取到这个立即数。

### qp_num / src_qp

本端QP编号和对端QP编号。用于标识这个完成信息属于哪个QP以及与哪个远端QP进行了通信。

## CQ与QP的关系

CQ与QP是多对多的关系，这是CQ设计中非常重要的一个特性。

### 一个CQ可以关联多个QP

一个CQ可以被多个QP共享。即多个QP的SQ和/或RQ可以关联到同一个CQ上，它们的完成事件都会在这个CQ中产生CQE。这种设计的好处是节省资源——当有大量QP时，不必为每个QP都创建独立的CQ。

```
       QP1 ────┐
               ├──── CQ1
       QP2 ────┘
       
       QP3 ──── CQ2
```

### 一个QP可以关联多个CQ

一个QP的SQ和RQ可以分别关联到不同的CQ上。也就是说，用户可以为SQ的完成事件创建一个CQ，为RQ的完成事件创建另一个CQ。这样可以将发送完成和接收完成的处理逻辑分离。

```
              ┌── SQ ──── CQ1
       QP ────┤
              └── RQ ──── CQ2
```

通常来说，RC和UC服务类型的QP需要将SQ和RQ关联到同一个CQ，因为其WQE的处理是保序的；而UD服务类型则可以将SQ和RQ关联到不同的CQ。

## 如何获取Completion

软件获取WQE完成情况（即从CQ中取出CQE）有两种方式：Poll模式和Event模式。

### Poll模式（轮询模式）

Poll模式是最常用的方式。用户通过调用轮询接口，主动从CQ中取出CQE。

轮询接口的一般行为如下：

```
ibv_poll_cq(cq, max_num, wc_array)
```

用户传入CQ的指针、希望获取的CQE最大数量以及存放CQE的数组指针。函数返回实际获取到的CQE数量。返回0表示CQ为空（没有完成的WQE），返回正数表示成功获取到的CQE数量，返回负数表示出错。

Poll模式的特点是：
- 用户主动查询，延迟低
- 需要用户不断轮询，会占用CPU
- 适用于对延迟敏感的场景

Poll的典型工作流程如下：

```
用户下发WR后：
  ① 软件调用ibv_post_send()将WR下发给SQ
  ② 硬件从SQ中取出WQE并处理
  ③ 处理完成后，硬件向CQ中写入一个CQE
  ④ 软件循环调用ibv_poll_cq()从CQ中取出CQE
  ⑤ 软件解析CQE，判断任务是否成功完成
```

```
┌──────┐  ibv_post_send  ┌──────┐  WQE  ┌────────┐  CQE  ┌──────┐
│ User │ ───────────────▶ │  SQ  │ ────▶ │ HCA    │ ────▶ │  CQ  │
│      │                  │      │       │ (HW)   │       │      │
│      │ ◀─────────────── │  CQ  │ ◀──── │        │       │      │
└──────┘   ibv_poll_cq   └──────┘       └────────┘       │      │
                                                          └──────┘
```

### Event模式（事件通知模式）

Event模式下，用户先通过接口向CQ注册一个事件通知请求。当CQ中第一次有新的CQE入队时，硬件会通过Completion Event Channel向用户发送一个事件通知。用户在收到通知后，再通过轮询的方式将CQ中的CQE全部取出。

Event模式的工作流程如下：

```
准备阶段：
  ① 用户创建Completion Event Channel
  ② 创建CQ时将该Channel关联到CQ
  ③ 调用ibv_req_notify_cq()请求通知

运行阶段：
  ④ 硬件处理WQE完成，向CQ写入CQE
  ⑤ 如果这是该CQ中第一个CQE，硬件通过Event Channel发送通知
  ⑥ 用户通过ibv_get_cq_event()获取通知
  ⑦ 用户确认事件（ibv_ack_cq_events()）
  ⑧ 用户再次调用ibv_req_notify_cq()请求下一次通知
  ⑨ 用户通过ibv_poll_cq()取走CQ中累积的所有CQE
```

Event模式的特点：
- 用户无需主动轮询，CPU占用低
- 适合大批量、低频率的完成事件处理
- 比Poll模式有更高的延迟
- 需要配合Poll模式使用（事件通知只是"敲门"，实际取CQE还需要Poll）

两种模式的取舍：

| 特性 | Poll模式 | Event模式 |
|------|----------|-----------|
| 延迟 | 低 | 较高 |
| CPU占用 | 高（持续轮询） | 低（事件驱动） |
| 适用场景 | 低延迟要求、高频操作 | CPU资源敏感、低频操作 |
| 实现复杂度 | 简单 | 较复杂（需要处理事件通道） |

实际应用中，通常会在高性能场景下使用Poll模式（如存储系统、高频交易），在CPU资源受限或延迟不敏感的场景下使用Event模式。

## Completion Event Channel

Completion Event Channel（完成事件通道）是Event模式中的核心概念。它是一个与CQ关联的通信通道，用于从内核向用户态传递完成事件通知。

Event Channel本质上是一个文件描述符（fd），用户可以通过select/poll/epoll等IO多路复用机制来等待其上发生的事件。这使得CQ的事件通知可以很方便地集成到现有的IO事件处理框架中。

当多个CQ关联到同一个Event Channel时，任何一个CQ有新的CQE入队，都会通过这个Channel发送通知。用户收到通知后，需要根据通知中携带的CQ指针来确定是哪个CQ产生了事件。

## 错误类型与CQ

RDMA中的错误通过CQ上报给用户，按照错误的上报方式可以分为三类：

### 立即错误（Immediate Error）

当用户调用某个Verbs接口传递了非法参数时，接口会立即返回错误码。这类错误不会生成CQE，也不会进入CQ。

### 完成错误（Completion Error）

当WQE在硬件处理过程中发生错误时，硬件会生成一个包含错误状态的CQE放入CQ中。用户通过Poll CQ获取到这个CQE，从status字段中读取错误码。

这类错误又可以分为两类：

**操作错误**：与具体操作相关的问题，比如RDMA READ/WRITE的R_Key无效、地址越界等。

**传输错误**：与网络传输相关的问题，比如重传超限、RNR重试超限等。

### 异步错误（Async Error）

异步错误是与具体QP不直接相关的错误，如端口状态变化、设备故障等。这类错误通过异步事件队列（Async Event Queue）上报，而不是通过CQ。

## CQ的创建与管理

### 创建CQ

创建CQ时，用户需要指定CQ的最小深度（即最多能容纳多少个CQE）。驱动实际分配的深度可能会比用户要求的大。此外，创建CQ时还可以选择是否关联一个Completion Event Channel，以及是否在创建后立即请求通知。

CQ的深度选择是一个需要权衡的问题：
- CQ深度太小：可能导致硬件因为没有可用的CQE空间而阻塞WQE的处理
- CQ深度太大：浪费内存资源

一般建议CQ深度不小于对应QP中可能同时处于未完成状态的WQE数量。

### 查询CQ

用户可以查询CQ的状态信息，包括CQ的深度、已使用的CQE数量、关联的Event Channel等。

### 重设CQ大小

在某些实现中，CQ创建后可以动态调整大小。这在CQ深度不足导致硬件报错时非常有用。

### 销毁CQ

销毁CQ时，需要确保没有QP还关联到这个CQ，并且没有未取走的CQE。通常在销毁QP之后销毁CQ。

## CQ的编程示例

下面是一个简化的CQ使用示例：

```c
struct ibv_cq *cq;
struct ibv_comp_channel *channel;
struct ibv_wc wc;
int ne;

/* 创建Completion Event Channel */
channel = ibv_create_comp_channel(context);

/* 创建CQ，关联到Event Channel */
cq = ibv_create_cq(context, 100, NULL, channel, 0);

/* 请求通知 */
ibv_req_notify_cq(cq, 0);

/* 等待事件通知 */
struct ibv_cq *ev_cq;
void *ev_ctx;
ibv_get_cq_event(channel, &ev_cq, &ev_ctx);

/* 确认事件 */
ibv_ack_cq_events(ev_cq, 1);

/* 请求下一次通知 */
ibv_req_notify_cq(cq, 0);

/* 取出CQE */
ne = ibv_poll_cq(cq, 1, &wc);
if (ne > 0) {
    if (wc.status == IBV_WC_SUCCESS) {
        /* 处理成功完成的WQE */
        printf("WR %lu completed successfully, %u bytes\n",
               wc.wr_id, wc.byte_len);
    } else {
        /* 处理失败的WQE */
        fprintf(stderr, "WR %lu failed with status %d\n",
                wc.wr_id, wc.status);
    }
}
```

## 总结

CQ是RDMA技术中连接硬件和软件的"任务汇报"通道，与SQ/RQ（"任务下发"通道）相辅相成。通过CQ，用户可以获取WQE的执行结果。

本文介绍了CQ的核心概念，包括CQE的结构、CQ与QP的多对多关系、Poll和Event两种获取Completion的方式、Completion Event Channel机制以及CQ相关的错误分类。CQ的深度选择、Event Channel的配置，都会直接影响RDMA应用的性能和稳定性。希望读者在编写RDMA程序时，能够根据业务场景合理配置和使用CQ。

## IB规范相关章节

- 10.2.8 CQ的基本概念和作用
- 10.4 CQ的状态机和操作
- 10.8 CQ相关的完成信息
- 11.3 CQ相关的Verbs接口（Create/Query/Resize/Destroy CQ）

## 参考文档

1. IB Specification Vol 1-Release-1.4
2. RDMA Aware Networks Programming User Manual Rev 1.7
3. Linux Kernel Networking - Implementation and Theory. Chapter 13
