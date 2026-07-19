---
title: "CM 建链"
description: "详解 RDMA CM（Connection Manager）的建链流程，包括 CM 事件处理、REQ/REP 消息交换与 QP 连接。"
date: "2026-07-19"
order: 25
tags: ["RDMA", "CM", "建链", "Connection Manager"]
---
# CM 建链

> 注: 知乎原文403不可达，本文基于rdma_cm编程接口及CM协议交互机制重构

---

CM（Communication Management）是RDMA技术中用于管理连接建立和拆除的一套机制。它的"CM"一词在RDMA领域中有三层含义——CM协议、CM角色和CM API（即CMA，Connection Management Abstraction）。本文将从这三个维度全面介绍CM建链。

## CM的三层含义

### 1. CM协议 — InfiniBand子网中用于连接管理的协议

CM协议是InfiniBand规范中定义的一组用于在通信节点之间建立、管理和拆除连接的协议。CM协议使用QP1（GSI，General Service Interface）作为传输通道，通过MAD（Management Datagram）报文来交换连接信息。

CM协议支持的服务类型包括RC（可靠连接）和UC（不可靠连接）。

### 2. CM角色 — 通信管理实体

在iWARP协议栈中，CM承担着MPA层参数协商的职责。iWARP通信开始前，两个节点需要在MPA层协商Marker和CRC等参数，这个协商过程由CM触发和管理。

### 3. CM API (CMA) — rdma_cm编程接口

CMA（Connection Management Abstraction）是rdma_cm库提供的一组API，封装了连接管理的细节。它在Socket和Verbs API之上实现，为用户提供了更简便的连接管理接口。

```
┌──────────────────────────────────┐
│        用户应用程序               │
├──────────────────────────────────┤
│         rdma_cm (CMA)            │
│  ┌─────────────┬──────────────┐  │
│  │ 连接管理API  │ 数据收发API  │  │
│  │ rdma_listen │ rdma_post_   │  │
│  │ rdma_connect│ read/write/  │  │
│  │ rdma_accept │ send/recv    │  │
│  └─────────────┴──────────────┘  │
├──────────────────────────────────┤
│    Socket API  +  Verbs API     │
│  (底层实现，对用户透明)          │
├──────────────────────────────────┤
│          RDMA 硬件               │
└──────────────────────────────────┘
```

## CM协议报文格式

CM协议使用MAD（Management Datagram）作为承载，通过QP1传输。CM报文分为请求（Request）、响应（Reply）和各类管理消息。

### CM Request报文

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├───────────────────────────────────────────────────────────────┤
│                    MAD Common Header                           │
│  ┌──────────┬──────────┬─────────────────────────────────────┐│
│  │Base Ver=1│ MgmtClass│ ClassVersion │  Method              ││
│  │          │  =0x03   │              │  =Req/Resp/...       ││
│  ├──────────┴──────────┴──────────────┴──────────────────────┤│
│  │  Status  │  ClassSpecific │  Tid (Transaction ID)         ││
│  │          │  =CM Subclass │                                ││
│  ├──────────┴────────────────┴───────────────────────────────┤│
│  │  AttrID (CM attribute, e.g. CM_REQ=0x0011)               ││
│  └───────────────────────────────────────────────────────────┘│
├───────────────────────────────────────────────────────────────┤
│                      CM REQ Data                               │
│  ┌───────────────────────────────────────────────────────────┐│
│  │  Local QPN (24 bits)     │  Local EECN  │  Rsvd          ││
│  ├───────────────────────────────────────────────────────────┤│
│  │  Local PSN / 初始包序号                                    ││
│  ├───────────────────────────────────────────────────────────┤│
│  │  Responder Resources  │  Initiator Depth                  ││
│  ├───────────────────────────────────────────────────────────┤│
│  │  Local P_Key / Partition Key                              ││
│  ├───────────────────────────────────────────────────────────┤│
│  │  Service Type / 服务类型                                   ││
│  ├───────────────────────────────────────────────────────────┤│
│  │  ... (更多属性)                                            ││
│  └───────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

### CM交互过程

一个完整的CM建链过程如下：

```
Client (主动端)                               Server (被动端)
      │                                            │
      │  ① CM Request                               │
      │  ── [QPN, PSN, P_Key, ServiceType] ────▶   │
      │                                            │  ② 解析请求
      │                                            │  ③ DREP (Data Receiving Endpoint)
      │                                            │     分配接收资源
      │                                            │
      │  ④ CM Reply (成功/失败)                     │
      │  ◀── [Remote QPN, PSN, ...] ────────────   │
      │                                            │
      │  ⑤ RTU (Ready To Use)                      │
      │  ── [确认连接就绪] ─────────────────────▶   │
      │                                            │
      │  ⑥ 开始RDMA数据传输                         │
      │  ──── RDMA Write/Read/SEND ──────────────▶  │
      │                                            │
```

## CMA编程接口

rdma_cm库提供了一套事件驱动的异步连接管理接口。

### 核心数据结构

```c
struct rdma_cm_id {
    struct ibv_context *verbs;     // RDMA设备上下文
    struct ibv_qp *qp;            // 关联的QP
    struct rdma_event_channel *channel; // 事件通道
    void *context;                // 用户自定义上下文
    // ... 更多内部字段
};

struct rdma_event_channel {
    int fd;                       // 事件通道的文件描述符
    // ... 更多内部字段
};
```

### Server端编程模型

Server端的CM建链流程如下：

```c
#include <rdma/rdma_cma.h>
#include <rdma/rdma_verbs.h>

struct rdma_cm_id *cm_id;
struct rdma_event_channel *cm_channel;
struct rdma_cm_event *event;

// 1. 创建事件通道
cm_channel = rdma_create_event_channel();

// 2. 创建CM ID（绑定到RDMA设备）
rdma_create_id(cm_channel, &cm_id, NULL, RDMA_PS_TCP);

// 3. 绑定地址并监听
struct sockaddr_in addr = {
    .sin_family = AF_INET,
    .sin_port = htons(18515),
    .sin_addr = { .s_addr = INADDR_ANY },
};
rdma_bind_addr(cm_id, (struct sockaddr *)&addr);
rdma_listen(cm_id, 5);  // 开始监听

// 4. 事件循环
while (1) {
    rdma_get_cm_event(cm_channel, &event);
    switch (event->event) {
        case RDMA_CM_EVENT_CONNECT_REQUEST:
            // 收到连接请求
            // 创建QP
            struct ibv_qp_init_attr qp_attr = { ... };
            rdma_create_qp(event->id, pd, &qp_attr);
            
            // 接受连接
            struct rdma_conn_param conn_param = { ... };
            rdma_accept(event->id, &conn_param);
            break;

        case RDMA_CM_EVENT_ESTABLISHED:
            // 连接建立成功
            printf("Connection established!\n");
            break;

        case RDMA_CM_EVENT_DISCONNECTED:
            // 连接断开
            rdma_destroy_qp(event->id);
            rdma_destroy_id(event->id);
            goto out;

        default:
            break;
    }
    rdma_ack_cm_event(event);
}
out:
rdma_destroy_id(cm_id);
rdma_destroy_event_channel(cm_channel);
```

### Client端编程模型

Client端的CM建链流程：

```c
struct rdma_cm_id *cm_id;
struct rdma_event_channel *cm_channel;
struct rdma_cm_event *event;

// 1. 创建事件通道和CM ID
cm_channel = rdma_create_event_channel();
rdma_create_id(cm_channel, &cm_id, NULL, RDMA_PS_TCP);

// 2. 解析地址并路由
struct sockaddr_in addr = {
    .sin_family = AF_INET,
    .sin_port = htons(18515),
};
inet_pton(AF_INET, "192.168.1.100", &addr.sin_addr);
rdma_resolve_addr(cm_id, NULL, (struct sockaddr *)&addr, 2000);
// 等待地址解析完成...
rdma_get_cm_event(cm_channel, &event);  // RDMA_CM_EVENT_ADDR_RESOLVED
rdma_ack_cm_event(event);

rdma_resolve_route(cm_id, 2000);
// 等待路由解析完成...
rdma_get_cm_event(cm_channel, &event);  // RDMA_CM_EVENT_ROUTE_RESOLVED
rdma_ack_cm_event(event);

// 3. 创建QP
struct ibv_pd *pd = ibv_alloc_pd(cm_id->verbs);
struct ibv_qp_init_attr qp_attr = {
    .send_cq = cq,
    .recv_cq = cq,
    .cap = { .max_send_wr = 10, .max_recv_wr = 10 },
    .qp_type = IBV_QPT_RC,
};
rdma_create_qp(cm_id, pd, &qp_attr);

// 4. 发起连接
struct rdma_conn_param conn_param = { .initiator_depth = 1 };
rdma_connect(cm_id, &conn_param);

// 5. 等待连接建立完成
rdma_get_cm_event(cm_channel, &event);  // RDMA_CM_EVENT_ESTABLISHED
rdma_ack_cm_event(event);
printf("Connected to server!\n");

// 6. 开始RDMA数据传输
// 使用rdma_post_read/write/send或ibv_post_send...
```

### 完整的事件类型

rdma_cm定义的事件类型：

| 事件 | 方向 | 说明 |
|------|------|------|
| RDMA_CM_EVENT_ADDR_RESOLVED | Client | 地址解析完成 |
| RDMA_CM_EVENT_ADDR_ERROR | Client | 地址解析失败 |
| RDMA_CM_EVENT_ROUTE_RESOLVED | Client | 路由解析完成 |
| RDMA_CM_EVENT_ROUTE_ERROR | Client | 路由解析失败 |
| RDMA_CM_EVENT_CONNECT_REQUEST | Server | 收到连接请求 |
| RDMA_CM_EVENT_CONNECT_RESPONSE | Client | 收到连接响应 |
| RDMA_CM_EVENT_ESTABLISHED | 双方 | 连接建立成功 |
| RDMA_CM_EVENT_DISCONNECTED | 双方 | 连接断开 |
| RDMA_CM_EVENT_TIMEWAIT_EXIT | 双方 | TIME_WAIT状态结束 |
| RDMA_CM_EVENT_REJECTED | Client | 连接被拒绝 |
| RDMA_CM_EVENT_UNREACHABLE | Client | 对端不可达 |

## CM建链的完整数据流

通过Wireshark抓包可以观察到CM建链的完整报文交互过程。

### CM建链的Wireshark抓包

```
No.    Time    Source          Destination     Protocol     Info
 1   0.000    192.168.1.1     192.168.1.2     InfiniBand   CM Request
 2   0.001    192.168.1.2     192.168.1.1     InfiniBand   CM Reply (成功)
 3   0.001    192.168.1.1     192.168.1.2     InfiniBand   CM RTU
 4   0.002    192.168.1.1     192.168.1.2     RoCE         SEND (第一个RDMA数据)
```

在Wireshark中展开CM Request报文可以看到：

```
InfiniBand
    ├── Local Route Header (LRH)
    ├── Global Route Header (GRH)
    ├── Base Transport Header (BTH)
    ├── Datagram Extension Header (DETH)
    ├── MAD: Management Datagram
    │   ├── MAD Common Header
    │   │   ├── Base Version: 1
    │   │   ├── Mgmt Class: CM (0x03)
    │   │   ├── Class Version: 2
    │   │   ├── Method: Send (0x01)
    │   │   ├── Status: 0
    │   │   ├── ClassSpecific: CM_REQ (0x11)
    │   │   └── Attribute Modifier: 0
    │   └── CM REQ Data
    │       ├── Local QPN: 0x000003
    │       ├── Local EECN: 0x000000
    │       ├── Local PSN: 0x123456
    │       ├── Responder Resources: 1
    │       ├── Initiator Depth: 1
    │       ├── Local P_Key: 0x7fff
    │       └── Service Type: RC (Reliable Connection)
    └── Invariant CRC (ICRC)
```

CM Reply报文：

```
MAD → CM REP Data
    ├── Remote QPN: 0x000007      (Server端的QP编号)
    ├── Remote EECN: 0x000000
    ├── Remote PSN: 0x654321       (Server端的初始包序号)
    ├── Responder Resources: 1
    ├── Initiator Depth: 1
    ├── Remote P_Key: 0x7fff
    ├── Service Type: RC
    └── Status: SUCCESS (0x00)
```

## CM建链的三种建链场景

### 场景一：IB网络中的CM建链

在纯IB网络中，CM协议通过QP1进行MAD报文交换。QP1是每个节点上预留给GSI（General Service Interface）的特殊QP。

```
IB节点A                          IB子网管理器          IB节点B
  │                                  │                    │
  │  ① CM Request (QP1)              │                    │
  │  ────────────────────────────────▶                    │
  │                                  │  ② 路径查询        │
  │                                  │  ③ 转发请求        │
  │                                  │  ────────────────▶ │
  │                                  │                    │  ④ 处理请求
  │                                  │                    │
  │                                  │  ⑤ CM Reply       │
  │                                  │  ◀────────────────  │
  │  ⑥ CM Reply (QP1)               │                    │
  │  ◀────────────────────────────────                    │
  │                                  │                    │
  │  ⑦ CM RTU (QP1)                 │                    │
  │  ────────────────────────────────▶                    │
  │                                  │                    │
  │  ⑧ RDMA数据传输 (QP3→QP7)       │                    │
  │  ────────────────────────────────▶ RDMA数据 ────────▶  │
```

### 场景二：RoCE v2中的CM建链

RoCE v2中，CM建链是可选的。RoCE v2支持更简单的Socket建链（通过TCP交换信息），但在某些场景下也可以使用CM建链。

```
RoCE v2节点A                         RoCE v2节点B
      │                                    │
      │  RoCE v2建链方式选择：               │
      │  方式1: Socket建链（推荐）           │
      │   ── TCP交换QPN/GID/PSN ──────▶    │
      │                                    │
      │  方式2: CM建链（可选）               │
      │   ── InfiniBand CM MAD ────────▶   │
      │      (封装在RoCE v2报文中)          │
      │                                    │
```

在实际部署中，RoCE v2通常使用Socket建链，因为更简单高效。只有在需要与IB网络互通或应用程序使用了rdma_cm接口时才使用CM建链。

### 场景三：iWARP中的CM建链（必需）

iWARP必须使用CM建链，因为iWARP需要MPA层的参数协商（如Marker启用、CRC启用），这个协商过程由CM触发。

```
iWARP节点A                            iWARP节点B
    │                                      │
    │  ① TCP三次握手                       │
    │  ◀───────────────────────────────▶    │
    │                                      │
    │  ② CM触发MPA协商                     │
    │   ── MPA Request Frame ──────────▶   │
    │      M=1, CRC=1 (请求启用Marker+CRC)  │
    │                                      │
    │                                      │  ③ MPA协商
    │  ◀── MPA Response Frame ───────────  │
    │      M=1, CRC=1 (同意启用)           │
    │                                      │
    │  ④ CM连接建立完成                     │
    │  ⑤ 开始iWARP RDMA数据传输             │
    │   ── iWARP DDP/RDMAP ────────────▶   │
    │                                      │
```

## 基于CM的数据收发API

除了连接管理，rdma_cm还提供了一组封装的数据收发接口，称为CM Verbs：

```c
// CM Verbs - 基于CM连接的数据收发接口

// RDMA Write: 向远端内存写入数据
rdma_post_write(cm_id, wr_id, buf, len, mr, flags,
                remote_addr, rkey);

// RDMA Read: 从远端内存读取数据
rdma_post_read(cm_id, wr_id, buf, len, mr, flags,
               remote_addr, rkey);

// Send: 发送数据（需要远端有RECV）
rdma_post_send(cm_id, wr_id, buf, len, mr, flags);

// Recv: 接收数据（配合Send使用）
rdma_post_recv(cm_id, wr_id, buf, len, mr);

// 获取完成事件
rdma_get_cm_event(channel, &event);
```

CM Verbs与原生Verbs的主要差异：

| 对比项 | 原生Verbs (ibv_post_send) | CM Verbs (rdma_post_write) |
|--------|--------------------------|---------------------------|
| 参数复杂度 | 高（需要构造复杂的WR结构体） | 低（直接传入地址和长度） |
| QP管理 | 需要手动管理QP和事件通道 | CM ID自动管理QP |
| 使用限制 | 无限制 | 必须配合CMA链路使用 |
| 适用场景 | 高性能生产环境 | 快速原型开发 |

## CM建链 vs Socket建链

| 对比项 | Socket建链 | CM建链 |
|--------|-----------|--------|
| 实现层级 | 应用层（手动TCP连接） | 库层（rdma_cm自动管理） |
| 接口风格 | 同步Socket API | 事件驱动的异步API |
| 代码量 | 多（手动收发/编码/解码） | 少（事件回调处理） |
| 错误处理 | 手动处理 | 事件通知（REJECTED/UNREACHABLE） |
| 状态管理 | 无 | 内置状态机 |
| 对iWARP支持 | 不支持（缺少MPA协商） | 支持（触发MPA协商） |
| 对RoCE支持 | 支持（推荐方案） | 支持（可选方案） |
| 对IB支持 | 不支持（需要额外的IP网络） | 支持（基于QP1的MAD） |
| 性能 | 稍高（无额外抽象层） | 稍低（事件循环开销） |

## 实践：在Soft-iWARP上使用CM建链

由于iWARP必须使用CM建链，perftest在Soft-iWARP上需要使用`-R`参数：

```bash
# Server (Soft-iWARP)
ib_write_bw -d siw_0 -R

# Client (Soft-iWARP)
ib_write_bw -d siw_0 -R 192.168.217.128
```

在Wireshark中抓包，可以看到CM建链的交互过程。与Socket建链不同，CM建链在Wireshark中显示为iWARP/MPA协议（而非TCP数据流），因为MPA协商发生在CM框架内部。

## CM连接的断开

CM连接的断开也由事件驱动：

```c
// 主动断开连接
rdma_disconnect(cm_id);

// 等待对端确认断开
// Server端收到: RDMA_CM_EVENT_DISCONNECTED
// 清理资源
rdma_destroy_qp(cm_id);
rdma_destroy_id(cm_id);
```

在iWARP中，断开连接会触发MPA层的关闭流程，确保双方协议栈状态的一致性。

## 总结

CM建链是RDMA中重要的连接管理方式。CM具有三层含义：

1. **CM协议**：InfiniBand子网中用于连接管理的标准协议，基于QP1和MAD报文
2. **CM角色**：iWARP协议栈中触发MPA层参数协商的管理实体
3. **CM API (CMA)**：rdma_cm库提供的事件驱动连接管理接口

CM建链通过事件驱动模型简化了连接管理，支持IB、RoCE和iWARP三种RDMA协议。在iWARP中CM建链是必须的（负责MPA协商），在RoCE v2中是可选的（通常使用更简单的Socket建链），在IB中CM建链是标准的建链方式。

理解CM建链对于掌握iWARP协议栈和进行跨协议（IB/RoCE/iWARP）的RDMA应用开发至关重要。

## 参考文档

1. IB Specification Vol 1, Chapter 12: Communication Management
2. librdmacm API文档: man rdma_cm (7)
3. RDMA Aware Networks Programming User Manual Rev 1.7

5. perftest工具: https://github.com/linux-rdma/perftest
