---
title: "Pyverbs——Python Verbs"
description: "介绍 Pyverbs（Python 绑定的 RDMA Verbs API）的使用方法、编程示例，以及如何用 Python 进行 RDMA 开发。"
date: "2026-07-19"
order: 16
tags: ["RDMA", "Pyverbs", "Python", "编程"]
---
# Pyverbs——Python Verbs

> 注: 知乎原文403不可达，本文基于Pyverbs源码及RDMA软件栈文档整理

---

在之前的文章中，我们介绍了如何基于C语言的Verbs API编写RDMA应用程序(见[RDMA之Verbs](13_技术详解（四）：RDMA之Verbs和编程步骤.md))。虽然C语言的Verbs API功能强大且性能优异，但对于快速原型开发、教学演示以及自动化测试等场景，使用Python这类高级语言往往更为高效。

Pyverbs就是为此而生的——它是RDMA Verbs API的Python绑定，基于Cython实现，让用户可以直接在Python中使用RDMA的全部功能。

## Pyverbs概述

Pyverbs是rdma-core项目的一部分，位于rdma-core/pyverbs目录下。它通过Cython将libibverbs和librdmacm的C语言API封装成Python接口，使得Python开发者可以在不编写C代码的情况下使用RDMA功能。

Pyverbs的设计目标包括：

- **完整的Verbs覆盖**：尽量完整地封装Verbs API，包括控制面和数据面的接口
- **Pythonic的使用方式**：符合Python语言习惯的接口设计，使用异常处理而非错误码
- **易用性**：简化资源管理，利用Python的垃圾回收机制自动释放RDMA资源
- **性能**：在关键数据路径上保持接近C语言的性能

```
┌─────────────────────────────────────────────────────┐
│                   Python Application                 │
├─────────────────────────────────────────────────────┤
│                      Pyverbs                         │
│  (Cython封装: pyverbs/*.pyx → .so)                  │
├─────────────────────────────────────────────────────┤
│              libibverbs / librdmacm                  │
│              (C语言Verbs API)                        │
├─────────────────────────────────────────────────────┤
│            内核RDMA子系统 (ib_core.ko)               │
├─────────────────────────────────────────────────────┤
│               RDMA硬件 (HCA/RNIC)                    │
└─────────────────────────────────────────────────────┘
```

## 安装与部署

### 从系统包管理器安装

在主流Linux发行版中，Pyverbs通常作为rdma-core软件包的一部分提供：

```bash
# Ubuntu/Debian
sudo apt-get install python3-rdma

# Fedora/RHEL
sudo dnf install python3-rdma
```

### 从源码编译安装

如果需要最新的特性或修复，可以从rdma-core源码编译：

```bash
# 克隆rdma-core仓库
git clone https://github.com/linux-rdma/rdma-core.git
cd rdma-core

# 安装编译依赖
sudo apt-get install build-essential cmake cython3 \
                     libibverbs-dev librdmacm-dev

# 编译（启用Pyverbs）
mkdir build && cd build
cmake .. -DENABLE_PYVERBS=1 -DCMAKE_INSTALL_PREFIX=/usr
make -j$(nproc)
sudo make install
```

### 验证安装

安装完成后，可以通过导入pyverbs来验证：

```python
import pyverbs
print(pyverbs.__version__)
```

或者列出系统中的RDMA设备：

```python
from pyverbs.device import DeviceList

with DeviceList() as dev_list:
    for dev in dev_list:
        print(f"Device: {dev.name}")
        with dev.open() as ctx:
            attr = ctx.query_device()
            print(f"  Max QP: {attr.max_qp}")
            print(f"  Max CQ: {attr.max_cq}")
            print(f"  Max MR: {attr.max_mr}")
```

## 核心对象映射

Pyverbs将C语言Verbs API的核心对象映射为Python类：

| C Verbs类型 | Pyverbs Python类 | 说明 |
|-------------|-------------------|------|
| ibv_context | pyverbs.device.Context | 设备上下文 |
| ibv_pd | pyverbs.pd.PD | 保护域 |
| ibv_mr | pyverbs.mr.MR | 内存区域 |
| ibv_cq | pyverbs.cq.CQ | 完成队列 |
| ibv_qp | pyverbs.qp.QP | 队列对 |
| ibv_srq | pyverbs.srq.SRQ | 共享接收队列 |
| ibv_ah | pyverbs.ah.AH | 地址句柄 |
| ibv_wc | pyverbs.wc.WC | 工作完成 |
| ibv_device | pyverbs.device.Device | 设备描述 |

## Pyverbs编程示例

### 示例1：设备信息查询

这是一个简单的Pyverbs程序，用于查询系统中所有RDMA设备的信息：

```python
from pyverbs.device import DeviceList

def list_devices():
    with DeviceList() as dev_list:
        if not dev_list:
            print("No RDMA devices found")
            return
        
        for i, dev in enumerate(dev_list):
            print(f"\n{'='*50}")
            print(f"Device [{i}]: {dev.name}")
            print(f"{'='*50}")
            
            with dev.open() as ctx:
                attr = ctx.query_device()
                print(f"  Vendor: {attr.vendor_id:#x}")
                print(f"  Part:   {attr.vendor_part_id:#x}")
                print(f"  HW Ver: {attr.hw_ver}")
                print(f"  Max QP: {attr.max_qp}")
                print(f"  Max CQ: {attr.max_cq}")
                print(f"  Max MR: {attr.max_mr}")
                print(f"  Max PD: {attr.max_pd}")
                print(f"  Max AH: {attr.max_ah}")
                print(f"  Max SGE per WR: {attr.max_sge}")
                print(f"  Max inline: {attr.max_inline_data}")
                
                # 查询端口信息
                port_attr = ctx.query_port(1)
                print(f"  Port 1 state: {port_attr.state}")
                print(f"  Port 1 MTU:   {port_attr.active_mtu}")
                print(f"  Port 1 width: {port_attr.active_width}")
                print(f"  Port 1 speed: {port_attr.active_speed}")

if __name__ == '__main__':
    list_devices()
```

### 示例2：RC模式Ping-Pong

这是一个基于RC（可靠连接）服务类型的Ping-Pong示例程序，展示双方通过SEND/RECV进行数据交换：

```python
import sys
import socket
import struct
import threading
from pyverbs.device import DeviceList, Context
from pyverbs.pd import PD
from pyverbs.mr import MR
from pyverbs.cq import CQ
from pyverbs.qp import QP, QPInitAttr, QPCap
from pyverbs.wr import SGE, SendWR, RecvWR
from pyverbs.enums import *
from pyverbs.addr import AH, AHAttr

MSG_SIZE = 64
BUFFER_SIZE = 4096

class RDPingPong:
    def __init__(self, dev_name, port=1):
        self.dev_name = dev_name
        self.port = port
        self.setup_device()
        
    def setup_device(self):
        # 打开设备
        with DeviceList() as dev_list:
            for dev in dev_list:
                if dev.name.decode() == self.dev_name:
                    self.ctx = dev.open()
                    break
            else:
                raise RuntimeError(f"Device {self.dev_name} not found")
        
        # 查询端口GID
        self.port_attr = self.ctx.query_port(self.port)
        self.gid = self.ctx.query_gid(self.port, 0)
        
        # 创建PD
        self.pd = PD(self.ctx)
        
        # 注册MR
        self.send_buf = bytearray(BUFFER_SIZE)
        self.recv_buf = bytearray(BUFFER_SIZE)
        self.send_mr = MR(self.pd, self.send_buf, 
                          IBV_ACCESS_LOCAL_WRITE)
        self.recv_mr = MR(self.pd, self.recv_buf, 
                          IBV_ACCESS_LOCAL_WRITE)
        
        # 创建CQ
        self.cq = CQ(self.ctx, 100)
        
        # 创建QP
        cap = QPCap(max_send_wr=10, max_recv_wr=10,
                    max_send_sge=1, max_recv_sge=1)
        init_attr = QPInitAttr(cap=cap, qp_type=IBV_QPT_RC,
                               scq=self.cq, rcq=self.cq)
        self.qp = QP(self.pd, init_attr)
        
        # 初始化QP状态: RESET -> INIT
        self.qp.to_init(self.port, self.gid)
        
    def connect(self, peer_qpn, peer_gid, peer_psn):
        # 切换到RTR状态
        self.qp.to_rtr(peer_qpn, peer_gid, self.port, peer_psn,
                       IBV_QPT_RC)
        # 切换到RTS状态
        self.qp.to_rts()
        
    def exchange_info(self, sock, is_server):
        conn_info = struct.pack('!II16sI',
                                self.qp.qp_num,
                                self.port,
                                self.gid.raw,
                                0)  # PSN, 实际应由硬件分配
        if is_server:
            sock.send(conn_info)
            peer_info = sock.recv(1024)
        else:
            peer_info = sock.recv(1024)
            sock.send(conn_info)
        
        peer_qpn, peer_port, peer_gid_raw, peer_psn = \
            struct.unpack('!II16sI', peer_info)
        
        import ipaddress
        gid = ipaddress.IPv6Address(peer_gid_raw)
        print(f"Connected to QPN {peer_qpn}, GID {gid}")
        
        self.connect(peer_qpn, peer_gid_raw, peer_psn)
        
    def post_recv(self):
        sge = SGE(self.recv_mr.buf, MSG_SIZE, self.recv_mr.lkey)
        wr = RecvWR(num_sge=1, sg_list=[sge])
        self.qp.post_recv(wr)
        
    def post_send(self, data):
        self.send_buf[:len(data)] = data.encode()
        sge = SGE(self.send_mr.buf, MSG_SIZE, self.send_mr.lkey)
        wr = SendWR(num_sge=1, sg_list=[sge],
                    opcode=IBV_WR_SEND,
                    send_flags=IBV_SEND_SIGNALED)
        self.qp.post_send(wr)
        
    def poll_cq(self):
        wc = self.cq.poll(1)
        if wc:
            if wc[0].status != 0:
                raise RuntimeError(f"WC error: {wc[0].status}")
            return wc[0]
        return None
    
    def close(self):
        self.qp.close()
        self.cq.close()
        self.send_mr.close()
        self.recv_mr.close()
        self.pd.close()
        self.ctx.close()

def run_server(dev_name, tcp_port):
    pp = RDPingPong(dev_name)
    pp.post_recv()
    
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(('0.0.0.0', tcp_port))
        sock.listen(1)
        print(f"Server listening on port {tcp_port}")
        conn, addr = sock.accept()
        print(f"Client connected from {addr}")
        pp.exchange_info(conn, is_server=True)
    
    # 接收数据
    wc = pp.poll_cq()
    if wc:
        recv_data = bytes(pp.recv_buf[:wc.byte_len])
        print(f"Received: {recv_data.decode()}")
    
    # 回复
    pp.post_send("Hello from server!")
    pp.poll_cq()
    
    pp.close()

def run_client(dev_name, server_ip, tcp_port):
    pp = RDPingPong(dev_name)
    pp.post_recv()
    
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect((server_ip, tcp_port))
        pp.exchange_info(sock, is_server=False)
    
    # 发送数据
    pp.post_send("Hello from client!")
    pp.poll_cq()
    
    # 接收回复
    wc = pp.poll_cq()
    if wc:
        recv_data = bytes(pp.recv_buf[:wc.byte_len])
        print(f"Received: {recv_data.decode()}")
    
    pp.close()

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage:")
        print(f"  Server: {sys.argv[0]} server <dev_name> [port]")
        print(f"  Client: {sys.argv[0]} client <dev_name> <server_ip> [port]")
        sys.exit(1)
    
    mode = sys.argv[1]
    dev_name = sys.argv[2]
    port = int(sys.argv[4]) if len(sys.argv) >= 5 else 12345
    
    if mode == 'server':
        run_server(dev_name, port)
    elif mode == 'client':
        if len(sys.argv) < 4:
            print("Client mode requires server IP")
            sys.exit(1)
        server_ip = sys.argv[3]
        run_client(dev_name, server_ip, port)
```

### 示例3：使用Pyverbs进行RDMA Write操作

RDMA Write是单边操作，远端CPU不参与数据传输过程：

```python
from pyverbs.device import DeviceList
from pyverbs.pd import PD
from pyverbs.mr import MR, AccessFlags
from pyverbs.cq import CQ
from pyverbs.qp import QP, QPInitAttr, QPCap, QPAttr
from pyverbs.wr import SGE, SendWR
from pyverbs.enums import *
import numpy as np

def rdma_write_example(dev_name):
    with DeviceList() as dev_list:
        for dev in dev_list:
            if dev.name.decode() == dev_name:
                ctx = dev.open()
                break
    
    pd = PD(ctx)
    cq = CQ(ctx, 10)
    
    # 注册本地和远端MR
    local_buf = bytearray(1024)
    remote_buf = bytearray(1024)
    
    local_mr = MR(pd, local_buf, 
                  AccessFlags.LOCAL_WRITE)
    remote_mr = MR(pd, remote_buf,
                   AccessFlags.LOCAL_WRITE | 
                   AccessFlags.REMOTE_WRITE)
    
    # 创建QP
    cap = QPCap(max_send_wr=10, max_recv_wr=10,
                max_send_sge=1, max_recv_sge=1)
    init_attr = QPInitAttr(cap=cap, qp_type=IBV_QPT_RC,
                           scq=cq, rcq=cq)
    qp = QP(pd, init_attr)
    
    # 准备好QP状态后，执行RDMA Write的准备工作：
    # 本地填充数据，然后将remote_mr的地址和rkey告知对端
    
    # 构造RDMA Write WR
    sge = SGE(local_mr.buf, 1024, local_mr.lkey)
    wr = SendWR(num_sge=1, sg_list=[sge],
                opcode=IBV_WR_RDMA_WRITE,
                send_flags=IBV_SEND_SIGNALED)
    # 设置远端地址和R_Key
    wr.wr.rdma.remote_addr = remote_mr.buf
    wr.wr.rdma.rkey = remote_mr.rkey
    
    print(f"Local MR:  addr={local_mr.buf:#x}, lkey={local_mr.lkey:#x}")
    print(f"Remote MR: addr={remote_mr.buf:#x}, rkey={remote_mr.rkey:#x}")
    print(f"RDMA Write prepared: {len(local_buf)} bytes")
    
    qp.close(); cq.close(); local_mr.close()
    remote_mr.close(); pd.close(); ctx.close()

rdma_write_example("rxe_0")
```

## Pyverbs vs C Verbs API

### 编程风格对比

下面以创建QP为例，对比C和Python版本的差异：

**C语言版本：**
```c
struct ibv_pd *pd = ibv_alloc_pd(ctx);
struct ibv_cq *cq = ibv_create_cq(ctx, 100, NULL, NULL, 0);
struct ibv_qp_init_attr attr = {
    .send_cq = cq,
    .recv_cq = cq,
    .cap = { .max_send_wr = 10, .max_recv_wr = 10,
             .max_send_sge = 1, .max_recv_sge = 1 },
    .qp_type = IBV_QPT_RC,
};
struct ibv_qp *qp = ibv_create_qp(pd, &attr);
```

**Python (Pyverbs)版本：**
```python
pd = PD(ctx)
cq = CQ(ctx, 100)
cap = QPCap(max_send_wr=10, max_recv_wr=10,
            max_send_sge=1, max_recv_sge=1)
init_attr = QPInitAttr(cap=cap, qp_type=IBV_QPT_RC,
                       scq=cq, rcq=cq)
qp = QP(pd, init_attr)
```

可以看出，Pyverbs的接口设计更加简洁，利用了Python的关键字参数和对象管理机制。

### 主要差异对比

| 特性 | C Verbs API | Pyverbs |
|------|-------------|---------|
| 类型安全 | 编译器检查 | 运行时检查 |
| 资源管理 | 手动分配/释放 | 上下文管理器(with)自动管理 |
| 错误处理 | 返回错误码 | 抛出异常 |
| 开发效率 | 低（需编译、处理指针） | 高（解释执行） |
| 性能 | 最优 | 接近C（Cython实现） |
| 学习曲线 | 陡峭 | 较平缓 |
| 适用场景 | 生产系统 | 原型开发、教学、测试 |

### 资源管理对比

C语言中，开发者需要手动调用销毁函数释放RDMA资源，并且需要按照正确的顺序进行：

```c
ibv_destroy_qp(qp);
ibv_destroy_cq(cq);
ibv_dereg_mr(mr);
ibv_dealloc_pd(pd);
ibv_close_device(ctx);
```

在Pyverbs中，可以依赖Python的垃圾回收机制，或者使用上下文管理器：

```python
# 方式1：上下文管理器（推荐）
with DeviceList() as dev_list:
    with dev_list[0].open() as ctx:
        with PD(ctx) as pd:
            with CQ(ctx, 100) as cq:
                # ... 使用资源
                pass  # 自动释放

# 方式2：手动管理
pd = PD(ctx)
try:
    cq = CQ(ctx, 100)
    try:
        # ... 使用资源
        pass
    finally:
        cq.close()
finally:
    pd.close()
```

## Pyverbs的模块结构

Pyverbs的代码位于rdma-core/pyverbs目录下，按功能划分为多个模块：

```
pyverbs/
├── __init__.py          # 包初始化
├── device.pyx           # 设备管理 (Device, Context, DeviceList)
├── pd.pyx               # 保护域 (PD)
├── mr.pyx               # 内存区域 (MR, MW)
├── cq.pyx               # 完成队列 (CQ)
├── qp.pyx               # 队列对 (QP)
├── srq.pyx              # 共享接收队列 (SRQ)
├── ah.pyx               # 地址句柄 (AH)
├── wc.pyx               # 工作完成 (WC)
├── wr.pyx               # 工作请求 (SendWR, RecvWR, SGE)
├── enums.pyx            # 枚举类型定义
├── addr.pyx             # 地址管理
└── cm/                  # CM (Connection Manager) 相关
    ├── __init__.pyx
    └── ...
```

## Pyverbs的适用场景

### 原型开发与快速验证

在正式使用C语言开发RDMA应用之前，可以使用Pyverbs快速验证通信逻辑的正确性。Python的交互式特性使得调试和调试更加便捷。

### 教学与培训

Pyverbs降低了RDMA编程的学习门槛。学生可以在不了解指针管理、内存布局等C语言细节的情况下，快速理解RDMA的核心概念和通信流程。

### 自动化测试

可以利用Pyverbs编写RDMA功能的自动化测试脚本，验证RDMA设备的正确性和性能指标。

### 性能测试工具开发

虽然Pyverbs在数据路径上不如C语言高效，但对于开发配置检查、连通性测试、简单的带宽/延迟测试等工具来说，其性能已经足够。

## 注意事项

### 性能开销

Pyverbs在控制路径（如创建QP、注册MR）上相比C语言有一定性能开销，因为这些操作涉及Python对象创建和Cython类型转换。但在数据路径上，由于关键操作（如Post Send、Poll CQ）的Cython封装非常薄，性能损失可以控制在可接受范围内。

### 线程安全

Pyverbs的对象默认不是线程安全的。在多线程环境中使用时，需要由调用者保证适当的同步。

### 与C库版本兼容性

Pyverbs与特定版本的libibverbs/librdmacm绑定。如果系统中rdma-core版本与编译Pyverbs时的版本不一致，可能出现ABI不兼容的问题。

## 总结

Pyverbs为Python开发者提供了便捷的RDMA编程接口，它通过Cython完整封装了Verbs API，使得Python程序可以直接使用RDMA的全部能力。虽然Pyverbs在性能上不如C语言，但其在开发效率、易用性和可维护性方面的优势，使其成为RDMA原型开发、教学和自动化测试的理想选择。

对于想要快速上手RDMA编程的开发者来说，Pyverbs是一个很好的起点。通过Pyverbs理解RDMA的核心概念后，再过渡到C语言的Verbs API进行性能调优，是一条高效的学习路径。

## 参考文档

1. rdma-core官方仓库: https://github.com/linux-rdma/rdma-core
2. Pyverbs源码: https://github.com/linux-rdma/rdma-core/tree/master/pyverbs
3. RDMA Aware Networks Programming User Manual Rev 1.7
4. libibverbs API文档: https://man7.org/linux/man-pages/man3/ibv_post_send.3.html
