---
title: "Socket 建链"
description: "详解通过 Socket 建立 RDMA 连接的完整流程，包括资源初始化、QP 状态转换、内存注册等步骤。"
date: "2026-07-19"
order: 24
tags: ["RDMA", "Socket", "建链", "连接管理"]
---
# Socket 建链

> 注: 知乎原文403不可达，本文基于RDMA连接管理机制及示例程序重构

---

在RDMA通信中，两个节点上的QP之间要建立连接才能进行数据交换。建立连接的关键是双方交换彼此的QP信息——包括QPN（QP Number）、GID（Global Identifier）和PSN（Packet Sequence Number）等。

Socket建链就是利用传统的TCP Socket来传递这些信息的一种方式。它是一种轻量级、无额外依赖的建链方案，也是rdma-core官方示例程序（如rc_pingpong.c）默认使用的建链方式。

## 为什么需要建链

在RDMA通信开始前，通信双方需要了解对方的一些关键信息。这些信息无法通过RDMA硬件自动获取，必须通过某种"带外"方式交换。

### 需要交换的信息

| 信息 | 说明 | 获取方式 |
|------|------|----------|
| QPN | 对方QP的编号，用于标识通信端点 | 创建QP后获取 |
| GID | 对方端口的全局标识（RoCE），用于路由 | 查询端口属性 |
| PSN | 初始包序号，用于可靠传输的包序管理 | 由硬件生成，需要告知对方 |
| R_Key/L_Key | 对方MR的访问密钥（可选，取决于操作类型） | 注册MR后获取 |

### 建链的核心作用

建链的本质是通过一条预先建立的通信通道（Socket或CM），交换上述信息，使得双方QP的Context中记录下对方的信息，从而建立起一条完整的QP到QP的通信链路。

```
节点A                               节点B
  │                                    │
  │  ┌─────────────────────────────┐   │
  │  │ QPC (Queue Pair Context)    │   │
  │  │ ┌─────────────────────────┐ │   │
  │  │ │ 对端QPN:   待填充       │ │   │
  │  │ │ 对端GID:   待填充       │ │   │
  │  │ │ 对端PSN:   待填充       │ │   │
  │  │ └─────────────────────────┘ │   │
  │  └─────────────────────────────┘   │
  │                                    │
  │  ① 通过Socket交换信息              │
  │  ── QPN=3, GID=fe80::1, PSN=100 ─▶│
  │                                    │
  │  ◀── QPN=7, GID=fe80::2, PSN=200 ─│
  │                                    │
  │  ┌─────────────────────────────┐   │
  │  │ QPC                         │   │
  │  │ ┌─────────────────────────┐ │   │
  │  │ │ 对端QPN:   7            │ │   │
  │  │ │ 对端GID:   fe80::2      │ │   │
  │  │ │ 对端PSN:   200          │ │   │
  │  │ └─────────────────────────┘ │   │
  │  └─────────────────────────────┘   │
  │                                    │
  │  ② 调用ibv_modify_qp()             │
  │     将QPC信息写入硬件               │
  │                                    │
  │  ③ 开始RDMA数据传输                │
  │  ───── RDMA Write/Read ──────────▶ │
  │                                    │
```

## Socket建链流程

Socket建链的完整流程分为六个阶段。

### 阶段一：初始化RDMA资源

两端分别初始化RDMA设备，创建必要的资源：

```c
// Server端与Client端共同的初始化步骤
struct ibv_context *ctx;
struct ibv_pd *pd;
struct ibv_cq *cq;
struct ibv_qp *qp;
struct ibv_mr *mr;

// 1. 打开设备
ctx = ibv_open_device(ibv_get_device_list(NULL)[0]);

// 2. 创建PD
pd = ibv_alloc_pd(ctx);

// 3. 创建CQ
cq = ibv_create_cq(ctx, 100, NULL, NULL, 0);

// 4. 创建QP
struct ibv_qp_init_attr init_attr = {
    .send_cq = cq,
    .recv_cq = cq,
    .cap = { .max_send_wr = 10, .max_recv_wr = 10,
             .max_send_sge = 1, .max_recv_sge = 1 },
    .qp_type = IBV_QPT_RC,
};
qp = ibv_create_qp(pd, &init_attr);
```

### 阶段二：获取本地QP信息

创建QP后，获取需要交换的信息：

```c
// 获取QPN
uint32_t qpn = qp->qp_num;

// 获取GID（端口1，GID索引0）
union ibv_gid gid;
ibv_query_gid(ctx, 1, 0, &gid);

// 获取端口属性（用于后续Modify QP）
struct ibv_port_attr port_attr;
ibv_query_port(ctx, 1, &port_attr);

printf("Local QPN: %d\n", qpn);
printf("Local GID: %s\n", gid_to_string(&gid));
```

### 阶段三：通过Socket交换信息

这是Socket建链的核心步骤。两端通过一个预先建立的TCP Socket连接，交换各自的QP信息。

**Server端流程：**

```c
int sock = setup_tcp_server(port);
int conn_fd = accept(sock, NULL, NULL);

// 发送本地信息
send(conn_fd, &qpn, sizeof(qpn), 0);
send(conn_fd, &gid, sizeof(gid), 0);
send(conn_fd, &psn, sizeof(psn), 0);

// 接收对端信息
uint32_t peer_qpn;
union ibv_gid peer_gid;
uint32_t peer_psn;
recv(conn_fd, &peer_qpn, sizeof(peer_qpn), 0);
recv(conn_fd, &peer_gid, sizeof(peer_gid), 0);
recv(conn_fd, &peer_psn, sizeof(peer_psn), 0);
```

**Client端流程：**

```c
int conn_fd = connect_to_tcp_server(server_ip, port);

// 先接收再发送（或先发送再接收，两端顺序需要匹配）
recv(conn_fd, &peer_qpn, sizeof(peer_qpn), 0);
recv(conn_fd, &peer_gid, sizeof(peer_gid), 0);
recv(conn_fd, &peer_psn, sizeof(peer_psn), 0);

send(conn_fd, &qpn, sizeof(qpn), 0);
send(conn_fd, &gid, sizeof(gid), 0);
send(conn_fd, &psn, sizeof(psn), 0);
```

**完整的信息交换结构体：**

```c
struct rdma_conn_info {
    uint32_t    qpn;           // QP Number
    union ibv_gid gid;         // GID (16 bytes)
    uint32_t    psn;           // 初始包序号
    uint32_t    rkey;          // （可选）远端访问密钥
    uint64_t    raddr;         // （可选）远端内存地址
};
```

### 阶段四：设置QP状态（RTR + RTS）

交换完对端信息后，两端分别调用ibv_modify_qp()将QP从INIT状态迁移到RTR（Ready to Receive），再到RTS（Ready to Send）。

**RESET → INIT：**

```c
struct ibv_qp_attr attr;
int flags;

// RESET → INIT
memset(&attr, 0, sizeof(attr));
attr.qp_state = IBV_QPS_INIT;
attr.pkey_index = 0;
attr.port_num = 1;
attr.qp_access_flags = IBV_ACCESS_REMOTE_WRITE | IBV_ACCESS_REMOTE_READ;
flags = IBV_QP_STATE | IBV_QP_PKEY_INDEX | IBV_QP_PORT | IBV_QP_ACCESS_FLAGS;
ibv_modify_qp(qp, &attr, flags);
```

**INIT → RTR：**

```c
// INIT → RTR (写入对端信息)
memset(&attr, 0, sizeof(attr));
attr.qp_state = IBV_QPS_RTR;
attr.path_mtu = IBV_MTU_1024;       // MTU
attr.dest_qp_num = peer_qpn;        // 对端QPN
attr.rq_psn = peer_psn;             // 对端PSN
attr.max_dest_rd_atomic = 1;        // 最大未完成的RDMA Read/Atomic操作
attr.min_rnr_timer = 12;            // RNR重传时间

// AH信息
attr.ah_attr.dlid = 0;              // RoCE不需要DLID
attr.ah_attr.sl = 0;
attr.ah_attr.src_path_bits = 0;
attr.ah_attr.port_num = 1;
attr.ah_attr.is_global = 1;         // 使用RoCE全局路由
attr.ah_attr.grh.dgid = peer_gid;   // 对端GID
attr.ah_attr.grh.sgid_index = 0;    // 本地GID索引
attr.ah_attr.grh.hop_limit = 1;
attr.ah_attr.grh.traffic_class = 0;

flags = IBV_QP_STATE | IBV_QP_AV | IBV_QP_PATH_MTU |
        IBV_QP_DEST_QPN | IBV_QP_RQ_PSN |
        IBV_QP_MAX_DEST_RD_ATOMIC | IBV_QP_MIN_RNR_TIMER;
ibv_modify_qp(qp, &attr, flags);
```

**RTR → RTS：**

```c
// RTR → RTS
memset(&attr, 0, sizeof(attr));
attr.qp_state = IBV_QPS_RTS;
attr.sq_psn = my_psn;              // 本端PSN
attr.max_rd_atomic = 1;            // 最大未完成的RDMA Read/Atomic发起数
attr.retry_cnt = 7;                // 重试次数
attr.rnr_retry = 7;                // RNR重试次数
attr.timeout = 14;                 // 超时时间

flags = IBV_QP_STATE | IBV_QP_SQ_PSN |
        IBV_QP_MAX_QP_RD_ATOMIC | IBV_QP_RETRY_CNT |
        IBV_QP_RNR_RETRY | IBV_QP_TIMEOUT;
ibv_modify_qp(qp, &attr, flags);
```

### 阶段五：确认连接就绪

两端可以通过额外的确认消息来确保双方都已完成QP状态迁移：

```c
// 发送READY标志
char ready = 1;
send(conn_fd, &ready, sizeof(ready), 0);
recv(conn_fd, &ready, sizeof(ready), 0);

// 双方都READY，可以关闭Socket，开始RDMA通信
close(conn_fd);
```

### 阶段六：关闭Socket，开始RDMA传输

Socket建链完成后，TCP Socket的连接可以关闭。后续的数据传输全部通过RDMA硬件直接完成，不再需要Socket的参与。

```
时间线：
TCP Socket 建立连接 (握手)
    ↓
TCP Socket 交换 RDMA 信息 (QPN/GID/PSN)
    ↓  ────── Socket建链阶段 ──────
双方 Modify QP (RTR → RTS)
    ↓  ────── 连接就绪 ────────
关闭 TCP Socket
    ↓  ────── RDMA通信阶段 ─────
RDMA 数据传输 (不需要Socket参与)
```

## 完整示例代码

下面是一个完整的Socket建链示例，展示了Server和Client两端如何通过Socket交换QP信息并建立RDMA连接：

```c
/* ==================== rdma_common.h ==================== */
#include <infiniband/verbs.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define PORT 18515
#define MSG_SIZE 64

struct conn_info {
    uint32_t qpn;
    uint32_t psn;
    union ibv_gid gid;
};

struct rdma_resources {
    struct ibv_context *ctx;
    struct ibv_pd *pd;
    struct ibv_cq *cq;
    struct ibv_qp *qp;
    struct ibv_mr *mr;
    char *buf;
};

struct rdma_resources *init_rdma_resources() {
    struct rdma_resources *res = calloc(1, sizeof(*res));
    struct ibv_device **dev_list;
    int num_devices;

    dev_list = ibv_get_device_list(&num_devices);
    if (!dev_list || num_devices == 0) {
        fprintf(stderr, "No RDMA devices found\n");
        exit(1);
    }

    res->ctx = ibv_open_device(dev_list[0]);
    ibv_free_device_list(dev_list);

    res->pd = ibv_alloc_pd(res->ctx);
    res->cq = ibv_create_cq(res->ctx, 100, NULL, NULL, 0);

    struct ibv_qp_init_attr init_attr = {
        .send_cq = res->cq,
        .recv_cq = res->cq,
        .cap = { .max_send_wr = 10, .max_recv_wr = 10,
                 .max_send_sge = 1, .max_recv_sge = 1 },
        .qp_type = IBV_QPT_RC,
    };
    res->qp = ibv_create_qp(res->pd, &init_attr);

    res->buf = malloc(MSG_SIZE);
    res->mr = ibv_reg_mr(res->pd, res->buf, MSG_SIZE,
                         IBV_ACCESS_LOCAL_WRITE | IBV_ACCESS_REMOTE_WRITE);

    // RESET → INIT
    struct ibv_qp_attr attr = {
        .qp_state = IBV_QPS_INIT,
        .pkey_index = 0,
        .port_num = 1,
        .qp_access_flags = IBV_ACCESS_REMOTE_WRITE | IBV_ACCESS_REMOTE_READ,
    };
    ibv_modify_qp(res->qp, &attr,
                  IBV_QP_STATE | IBV_QP_PKEY_INDEX |
                  IBV_QP_PORT | IBV_QP_ACCESS_FLAGS);

    return res;
}

void exchange_info(int sock, struct conn_info *local,
                   struct conn_info *peer, int is_server) {
    if (is_server) {
        write(sock, local, sizeof(*local));
        read(sock, peer, sizeof(*peer));
    } else {
        read(sock, peer, sizeof(*peer));
        write(sock, local, sizeof(*local));
    }
}

void connect_qp(struct ibv_qp *qp, struct conn_info *peer,
                struct conn_info *local, int port) {
    // INIT → RTR
    struct ibv_qp_attr attr = {
        .qp_state = IBV_QPS_RTR,
        .path_mtu = IBV_MTU_1024,
        .dest_qp_num = peer->qpn,
        .rq_psn = peer->psn,
        .max_dest_rd_atomic = 1,
        .min_rnr_timer = 12,
        .ah_attr = {
            .sl = 0,
            .src_path_bits = 0,
            .port_num = port,
            .is_global = 1,
            .grh = {
                .dgid = peer->gid,
                .sgid_index = 0,
                .hop_limit = 1,
            },
        },
    };
    ibv_modify_qp(qp, &attr,
                  IBV_QP_STATE | IBV_QP_AV | IBV_QP_PATH_MTU |
                  IBV_QP_DEST_QPN | IBV_QP_RQ_PSN |
                  IBV_QP_MAX_DEST_RD_ATOMIC | IBV_QP_MIN_RNR_TIMER);

    // RTR → RTS
    attr.qp_state = IBV_QPS_RTS;
    attr.sq_psn = local->psn;
    attr.max_rd_atomic = 1;
    attr.retry_cnt = 7;
    attr.rnr_retry = 7;
    attr.timeout = 14;
    ibv_modify_qp(qp, &attr,
                  IBV_QP_STATE | IBV_QP_SQ_PSN |
                  IBV_QP_MAX_QP_RD_ATOMIC |
                  IBV_QP_RETRY_CNT | IBV_QP_RNR_RETRY |
                  IBV_QP_TIMEOUT);
}

/* ==================== server.c ==================== */
int main() {
    struct rdma_resources *res = init_rdma_resources();
    struct conn_info local, peer;

    // 获取本地信息
    local.qpn = res->qp->qp_num;
    local.psn = lrand48() & 0xffffff;  // 24位PSN
    ibv_query_gid(res->ctx, 1, 0, &local.gid);

    // 建立TCP Socket
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(PORT),
        .sin_addr = { .s_addr = INADDR_ANY },
    };
    bind(sock, (struct sockaddr *)&addr, sizeof(addr));
    listen(sock, 1);
    int conn = accept(sock, NULL, NULL);
    printf("Client connected, exchanging QP info...\n");

    // 交换信息
    exchange_info(conn, &local, &peer, 1);
    printf("Peer QPN: %d, PSN: 0x%x\n", peer.qpn, peer.psn);

    // 连接QP
    connect_qp(res->qp, &peer, &local, 1);
    printf("QP connected. Ready for RDMA transfer.\n");

    // 关闭Socket
    close(conn);
    close(sock);

    // 现在可以使用RDMA通信...
    // (省略RDMA数据传输代码)

    return 0;
}

/* ==================== client.c ==================== */
int main() {
    struct rdma_resources *res = init_rdma_resources();
    struct conn_info local, peer;

    local.qpn = res->qp->qp_num;
    local.psn = lrand48() & 0xffffff;
    ibv_query_gid(res->ctx, 1, 0, &local.gid);

    // 连接Server的TCP端口
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = htons(PORT),
    };
    inet_pton(AF_INET, "192.168.1.100", &addr.sin_addr);
    connect(sock, (struct sockaddr *)&addr, sizeof(addr));

    // 交换信息
    exchange_info(sock, &local, &peer, 0);
    printf("Peer QPN: %d, PSN: 0x%x\n", peer.qpn, peer.psn);

    // 连接QP
    connect_qp(res->qp, &peer, &local, 1);
    printf("QP connected. Ready for RDMA transfer.\n");

    close(sock);
    return 0;
}
```

## QP状态机与建链的关系

Socket建链过程中，QP经历了完整的状态机迁移：

```
     RESET (复位)
       │
       │ ibv_modify_qp(RESET → INIT)
       ▼
     INIT (初始化)
       │  - 可以下发RECV WR
       │  - 不能下发SEND WR
       │  - 收到数据包会静默丢弃
       │
       │ ① Socket交换QPN/GID/PSN
       │ ② ibv_modify_qp(INIT → RTR) ← 写入对端信息
       ▼
     RTR (Ready to Receive)
       │  - RQ可接收数据
       │  - SQ仍然不能发送
       │
       │ ibv_modify_qp(RTR → RTS)
       ▼
     RTS (Ready to Send)
       │  - SQ和RQ都可以正常工作
       │  - 可以进行完整RDMA通信
       │
       │ 开始RDMA数据传输
       ▼
    (数据传输)
```

这个状态机保证了QP在正式工作前，双方的连接参数都已经正确配置。

## Socket建链 vs CM建链

Socket建链和CM（Connection Manager）建链是RDMA中两种主要的建链方式。

| 对比项 | Socket建链 | CM建链 |
|--------|-----------|--------|
| 实现方式 | 用户手动通过Socket交换信息 | 通过rdma_cm库自动完成 |
| 接口 | Socket API (socket/bind/connect) | rdma_cm API (rdma_listen/connect) |
| 代码复杂度 | 较高，需手动处理信息交换 | 较低，自动管理 |
| 灵活性 | 高，可以交换任意自定义信息 | 低，只能交换标准信息 |
| 依赖 | 需要额外的IP网络互通 | 需要rdma_cm服务 |
| 适用场景 | RoCE v2（以太网） | iWARP（需要MPA协商） |
| 协议支持 | RC, UC, UD | RC, UC, UD |

### 适用场景分析

**RoCE v2优先使用Socket建链**：
- RoCE v2基于UDP，不需要MPA层协商
- Socket建链简单直接
- 官方示例程序（rc_pingpong.c）默认使用Socket建链

**iWARP必须使用CM建链**：
- iWARP需要MPA层的参数协商（Marker/CRC启用）
- MPA协商通过CM接口触发
- 使用Socket建链会导致MPA层协商失败

```c
// perftest中指定建链方式的参数
// -R : 使用CM建链 (用于iWARP或Soft-iWARP)
// 默认: 使用Socket建链 (用于RoCE v2或IB)

// Soft-RoCE (RXE) 测试 - 使用Socket建链（默认）
ib_send_bw -d rxe_0

// Soft-iWARP (SIW) 测试 - 必须使用CM建链
ib_write_bw -d siw_0 -R
ib_write_bw -d siw_0 -R 192.168.217.128
```

## Wireshark抓包分析

### Socket建链阶段的抓包

在Socket建链阶段，Wireshark捕获到的是标准的TCP数据流：

```
No.  Time    Source          Destination     Protocol  Info
 1   0.000   192.168.1.1     192.168.1.2     TCP       18515 → 18515 [SYN]
 2   0.001   192.168.1.2     192.168.1.1     TCP       18515 → 18515 [SYN, ACK]
 3   0.001   192.168.1.1     192.168.1.2     TCP       18515 → 18515 [ACK]
 4   0.002   192.168.1.1     192.168.1.2     TCP       PSH (QPN/GID/PSN数据)
 5   0.002   192.168.1.2     192.168.1.1     TCP       ACK
 6   0.003   192.168.1.2     192.168.1.1     TCP       PSH (对端QPN/GID/PSN数据)
 7   0.003   192.168.1.1     192.168.1.2     TCP       ACK
 8   0.004   192.168.1.1     192.168.1.2     TCP       FIN (建链完成，关闭Socket)
```

第4-7帧是真正的信息交换阶段，传输的是协商数据结构`struct conn_info`的二进制内容。

### 建链完成后的RDMA数据流

Socket关闭后，两端开始RDMA数据传输。此时Wireshark中看到的是RoCE或IB报文：

```
No.  Time    Source          Destination     Protocol  Info
 9   0.010   192.168.1.1     192.168.1.2     RoCE     SEND First
10   0.011   192.168.1.2     192.168.1.1     RoCE     ACK
11   0.012   192.168.1.1     192.168.1.2     RoCE     RDMA WRITE
12   0.012   192.168.1.2     192.168.1.1     RoCE     ACK
```

Socket建链完成后，TCP连接已关闭，后续所有数据传输都通过RDMA硬件完成。

## Socket建链的优缺点

### 优点

1. **无额外依赖**：只需要TCP/IP网络互通，不需要CM服务
2. **简单透明**：建链过程完全由用户控制，易于理解和调试
3. **灵活可扩展**：用户可以在信息交换阶段传递任意自定义数据（如MR的R_Key）
4. **与RoCE天然适配**：RoCE v2不需要MPA协商，Socket建链是最直接的方式

### 缺点

1. **需要额外的IP网络**：双方必须通过IP可达，这在纯IB网络中可能需要额外配置
2. **代码量较多**：需要手动处理Socket创建、连接、收发和错误处理
3. **无标准化的连接管理**：没有内置的重连、保活等机制
4. **不适用于iWARP**：iWARP需要MPA协商，只能使用CM建链

## 常见问题

### 信息交换顺序

一个典型的陷阱：Server和Client的send/recv顺序必须匹配，否则会导致死锁。

```
✅ 正确：
  Server: send() → recv()    (先发后收)
  Client: recv() → send()     (先收后发)

✅ 正确：
  Server: recv() → send()     (先收后发)
  Client: send() → recv()     (先发后收)

❌ 错误（死锁）：
  Server: send() → recv()     
  Client: send() → recv()     (双方都在等对方收)
```

### PSN的24位限制

PSN（Packet Sequence Number）是24位的，取值范围0x0 ~ 0xFFFFFF。在交换PSN时，必须确保只使用低24位：

```c
uint32_t psn = lrand48() & 0xFFFFFF;  // 确保24位
```

### GID的获取

对于RoCE v2，GID就是网卡的IPv6地址（fe80::前缀的链路本地地址）。可以使用如下方式获取：

```c
union ibv_gid gid;
ibv_query_gid(ctx, port, gid_index, &gid);

// 打印GID
char gid_str[40];
inet_ntop(AF_INET6, &gid, gid_str, sizeof(gid_str));
printf("GID: %s\n", gid_str);
```

## 小结

Socket建链是RDMA中最基础、最常用的建链方式。它通过TCP Socket交换QPN/GID/PSN等信息，配合ibv_modify_qp()完成QP状态迁移，最终建立一条完整的RDMA通信链路。

理解Socket建链的完整流程，对于掌握RDMA编程和排查连接问题都至关重要。在RoCE v2网络环境下，Socket建链是首选的建链方式；而在iWARP环境中，则需要使用CM建链。

## 参考文档

1. RDMA Aware Networks Programming User Manual Rev 1.7
2. libibverbs官方示例程序: rdma-core/libibverbs/examples/rc_pingpong.c
3. perftest工具文档: https://github.com/linux-rdma/perftest
4. IB Specification Vol 1, Chapter 10.3 QP状态机
