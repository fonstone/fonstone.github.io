---
title: "微内核操作系统：ChCore 课程全解析"
description: "基于上海交通大学 IPADS 实验室 ChCore 微内核的操作系统课程，涵盖 ARM 汇编、内核启动、内存管理、进程线程、多核调度、IPC、虚拟文件系统和 GUI 等完整内容，难度由浅入深"
date: 2026-07-05
draft: false
categories: ["操作系统", "微内核"]
tags: ["ChCore", "ARM", "微内核", "IPC", "内存管理", "操作系统课程"]
series: "计算机系统基础"
---

# 微内核操作系统：ChCore 课程全解析

## 课程概览

本课程由上海交通大学 IPADS 实验室设计，基于自研的 **ChCore 微内核**（发表于 USENIX ATC 2020），以树莓派 3B+（Raspberry Pi 3）为实验平台，引导学生从零构建一个功能完整的微内核操作系统。

课程覆盖 **6 个实验**，从 ARM 汇编热身开始，逐步深入内核启动、内存管理、进程线程、多核调度、进程间通信，最终到虚拟文件系统。

### 实验总览

| 实验 | 名称 | 核心内容 | 难度 | 文档 |
|------|------|----------|------|------|
| Lab0 | 拆炸弹 | ARM 汇编、GDB 调试、逆向工程 | ⭐ | [详细文档](./chcore-lab0-arm-bomb.md) |
| Lab1 | 机器启动 | CPU 异常级别、页表配置、MMU 启用 | ⭐⭐ | [详细文档](./chcore-lab1-machine-boot.md) |
| Lab2 | 内存管理 | 伙伴系统、SLAB 分配器、缺页异常 | ⭐⭐⭐ | [详细文档](./chcore-lab2-memory-management.md) |
| Lab3 | 进程管理 | cap_group、线程创建、异常处理、系统调用 | ⭐⭐⭐ | [详细文档](./chcore-lab3-process-management.md) |
| Lab4 | 多核调度与 IPC | SMP 启动、Round-Robin 调度、Capability 权限管控 | ⭐⭐⭐⭐ | [详细文档](./chcore-lab4-multicore-ipc.md) |
| Lab5 | 虚拟文件系统 | POSIX 适配、FSM、FS_Base、BowerAccess | ⭐⭐⭐⭐ | [详细文档](./chcore-lab5-virtual-file-system.md) |
### 课程教材

![《操作系统：原理与实现》教材封面](/images/chcore/os-book.jpeg)

课程配套教材为《操作系统：原理与实现》（上海交通大学出版社），其中伙伴系统、SLAB 分配器、微内核 IPC 等章节与实验紧密结合。

### 完成课程后的成果

在完成全部实验后，学生可以在树莓派上运行自己 DIY 的 ChCore 内核，并能够：
- 运行宝可梦游戏（GBA 模拟器）
- 调用 DeepSeek 大模型 API
- 本地运行 Qwen-1.5B 模型

---

## 实验环境与工具链

### 环境要求

- **操作系统**：Linux（推荐），Windows/MacOS 可通过虚拟机
- **Docker**：必须依赖，用于提供统一的编译环境
- **Dev-Container**（推荐）：VS Code 插件一键启用

### 核心工具链

| 工具 | 用途 |
|------|------|
| `gcc-aarch64-linux-gnu` | ARM64 交叉编译器 |
| `qemu-system-aarch64` | 树莓派 3 系统级模拟 |
| `gdb-multiarch` | 跨架构调试器 |
| `make` | 构建系统 |
| `objdump` | 反汇编分析 |

### 三类习题

- **思考题**：需要在实验报告中书面回答的问题
- **练习题**：在 ChCore 代码中填空的核心编程题
- **挑战题**：难度稍高的附加题，加深系统设计理解

### Docker 环境配置

#### 拉取与运行 Docker 镜像

```bash
# 拉取官方镜像（推荐版本 25.03）
docker pull ipads/oslab:25.03

# 创建并启动新容器（交互模式）
docker run -it ipads/oslab:25.03 /bin/bash

# 挂载本地代码目录并启动
docker run -it -v /path/to/OS-Course-Lab:/home/stu/OS-Course-Lab ipads/oslab:25.03 /bin/bash
```

**`docker run -it` vs `docker exec -it`**：
- `docker run -it`：创建并启动一个**新**容器，适合首次进入
- `docker exec -it`：在已存在的容器中打开**新**终端会话，适合多终端并行调试（例如一个终端运行 QEMU，另一个运行 GDB）

**退出容器而不终止**：
- 按 `Ctrl+P` 然后 `Ctrl+Q`，容器会在后台继续运行
- 之后可用 `docker exec -it <container_id> /bin/bash` 重新进入
- 使用 `exit` 或 `Ctrl+D` 则会停止容器

#### VS Code Dev-Container 配置

在项目根目录创建 `.devcontainer/devcontainer.json`：

```json
{
    "name": "ChCore OS Lab",
    "image": "ipads/oslab:25.03",
    "remoteUser": "stu",
    "hostname": "Chcore",
    "customizations": {
        "vscode": {
            "extensions": [
                "ms-vscode.cpptools",
                "llvm-vs-code-extensions.vscode-clangd",
                "dan-c-underwood.arm",
                "ms-vscode.makefile-tools"
            ]
        }
    },
    "mounts": [
        "source=/path/to/OS-Course-Lab,target=/home/stu/OS-Course-Lab,type=bind"
    ]
}
```

配置说明：
- `remoteUser: "stu"`：容器内默认用户名，与实验环境一致
- `hostname: "Chcore"`：容器主机名，与 ChCore 命名一致
- `ms-vscode.cpptools`：C/C++ 语法高亮和 IntelliSense
- `llvm-vs-code-extensions.vscode-clangd`：基于 Clangd 的精确代码补全
- `dan-c-underwood.arm`：ARM 汇编语法高亮

### 构建系统详解

#### 编译流程

```bash
# 完整编译
make

# 清理编译产物
make clean
```

`make` 命令执行的完整编译流程：

```
源代码 (*.c, *.S)
  ↓ aarch64-linux-gnu-gcc（交叉编译）
目标文件 (*.o)
  ↓ 每个源文件独立编译
链接（ld -T linker.ld）
  ↓ 使用链接脚本定义布局
ELF 可执行文件
  ↓ aarch64-linux-gnu-objcopy -O binary
kernel8.img（原始二进制映像）
```

- **交叉编译**：在 x86 宿主机上使用 `aarch64-linux-gnu-gcc` 编译 ARM64 代码
- **链接脚本**：`kernel.ld`（或类似名称）定义各段（.text、.data、.bss）在内存中的布局和起始地址
- **ELF → kernel8.img**：通过 `objcopy -O binary` 去除 ELF 头部和段信息，生成树莓派 BootROM 可直接加载的原始二进制格式

#### 评分与提交

```bash
# 自动评分（运行所有测试用例）
make grade

# 提交实验
make submit
```

- `make grade`：在 QEMU 中自动运行测试脚本，逐项验证每个练习的实现是否正确
- `make submit`：根据 `filelist.mk` 中的定义打包需要提交的文件，上传到评分服务器
- 评分基于 CI 系统：提交后触发 GitHub Actions 自动提取提交文件、与主线合并后运行测试

---

## Lab0：拆炸弹（ARM 汇编热身）

### 实验目标

受 CSAPP 拆炸弹实验启发，但针对 **ARM64（AArch64）架构**。学生需要通过逆向分析二进制炸弹程序，破解 6 个 phase 的密码输入。

### 核心知识点

#### AArch64 寄存器约定

| 寄存器 | 用途 |
|--------|------|
| `x0-x7` | 参数传递，`x0` 也用作返回值 |
| `x29 (fp)` | 栈帧指针 |
| `x30 (lr)` | 返回地址 |
| `x31 (sp)` | 栈指针 |
| `w0-w31` | `x0-x31` 对应的 32 位寄存器 |

#### 寻址模式

- `[Xn]`：寄存器中的值解释为地址
- `[Xn, #imm]`：地址加常量偏移

### 调试工具

使用 `gdb-multiarch` 配合 QEMU 进行跨架构调试：

```bash
# 终端1：启动带 GDB Server 的 QEMU
make qemu-gdb

# 终端2：启动 GDB 客户端连接
make gdb
```

### 实现：6 个 Phase 的密码分析

每个 phase 对应一个独立的汇编函数（`phase_0` ~ `phase_5`），需要通过 `disassemble`、断点、查看寄存器和内存来推断正确的输入字符串。成功通过所有 phase 后输出：

```
Congrats! You have defused all phases!
```

---

## Lab1：机器启动

### 实验目标

在树莓派 3B+（QEMU 模拟或真机）上启动 ChCore 微内核，完成从 EL3 到 EL1 的异常级别切换、串口初始化和 MMU 启用。

### 核心原理

#### AArch64 异常级别

| 级别 | 名称 | 用途 |
|------|------|------|
| EL3 | Secure Monitor | 最高特权级，安全监控 |
| EL2 | Hypervisor | 虚拟机监控器 |
| EL1 | Kernel | **操作系统内核** |
| EL0 | User | 用户态程序 |

QEMU `raspi3b` 启动时 CPU 处于 EL3，需要降至 EL1。

#### 树莓派启动流程

```
ROM → bootcode.bin → start.elf → kernel8.img (加载到 0x80000)
```

QEMU 中直接通过 `-kernel` 参数加载 ELF 格式内核映像。

### 练习题实现

#### 练习 1-2：获取当前异常级别

在 `arm64_elX_to_el1` 中读取 `CurrentEL` 系统寄存器：

```asm
mrs x9, CurrentEL
```

#### 练习 3：设置 EL3 → EL1 跳转

设置 `elr_el3`（返回地址）和 `spsr_el3`（程序状态）：

```asm
adr x9, .Ltarget
msr elr_el3, x9
mov x9, SPSR_ELX_DAIF | SPSR_ELX_EL1H
msr spsr_el3, x9
```

#### 练习 6：UART 串口输出

实现字符串输出函数：

```c
void uart_send_string(char *str)
{
    while (*str) {
        early_uart_send(*str++);
    }
}
```

#### 练习 7：启用 MMU

配置 `sctlr_el1` 系统寄存器：

```asm
orr x8, x8, #SCTLR_EL1_M  // 启用 MMU
msr sctlr_el1, x8
```

### 页表映射（核心难点）

#### AArch64 4 级页表架构

```
虚拟地址 [47:0]
    ↓
L0 页表 (512 条目) → L1 页表 (512 条目) → L2 页表 (512 条目) → L3 页表 (512 条目) → 4KB 物理页
    ↓                      ↓                      ↓
  1GB 块映射            2MB 块映射              4KB 页映射
```

- **翻译粒度**：4KB
- **页表级数**：4 级（L0~L3）
- **每页表条目数**：512（每个条目 8 字节）
- **TCR_EL1**：控制高低地址分隔（48 位 / 48 位）

#### 练习 10：配置内核高地址页表

ChCore 使用 `KERNEL_VADDR = 0xffff_ff00_0000_0000` 作为内核虚拟地址基址。将物理地址 `0x00000000~0x80000000` 映射到高地址：

| 物理地址范围 | 映射类型 | 粒度 |
|-------------|---------|------|
| `0x00000000~0x3f000000` | Normal Memory | 2MB 块 |
| `0x3f000000~0x40000000` | Device Memory | 2MB 块 |
| `0x40000000~0x80000000` | Device Memory | 1GB 块 |

### 关键思考题

1. **多级页表的优势**：节省内存（不需要为未使用的地址空间分配页表）、支持按需分配、灵活的权限控制
2. **为什么先只启动 0 号核心**：避免多核并发初始化带来的竞态条件，主核完成关键初始化后再唤醒从核

---

## Lab2：内存管理

### 实验目标

实现 ChCore 内核的物理内存管理器（伙伴系统 + SLAB 分配器）、虚拟内存管理（页表分配）和缺页异常处理。

### 第一部分：物理内存管理

#### 伙伴系统（Buddy System）

ChCore 使用伙伴系统管理物理页帧，核心数据结构 `struct phys_mem_pool`：

- `page_metadata`：物理页元信息数组
- `free_lists[BUDDY_MAX_ORDER]`：每个阶的空闲链表

**阶（order）系统**：n 阶块大小 = 2^n × PAGE_SIZE

**核心操作**：
- **分配**：从指定阶查找空闲块，若没有则从更高阶分裂
- **释放**：检查伙伴块是否空闲，若是则合并回更高阶

**练习 1**：实现 `split_chunk`、`merge_chunk`、`buddy_get_pages`、`buddy_free_pages`

#### SLAB 分配器

用于处理小内存分配请求（kmalloc）：

- 每个 SLAB 管理一个或多个连续物理页
- 将物理页划分为固定大小的对象
- 维护空闲对象链表

**练习 2**：实现 `choose_new_current_slab`、`alloc_in_slab_impl`、`free_in_slab`

#### kmalloc 实现

**练习 3**：在 `_kmalloc` 中根据请求大小选择 SLAB 分配器或伙伴系统：

```c
// 小内存：SLAB 分配器
if (size <= SLAB_MAX_SIZE)
    return alloc_in_slab(size);
// 大内存：伙伴系统
else
    return get_pages(get_order(size) + PAGE_SHIFT);
```

### 第二部分：页表管理

#### VMR（虚拟地址区域）与 PMO（物理内存对象）

- **VMR**（Virtual Memory Region）：进程虚拟地址空间的一段连续区域
- **PMO**（Physical Memory Object）：物理内存的抽象对象

**练习 5-6**：实现页表映射函数 `map_range_in_pgtbl`、`unmap_range_in_pgtbl`

### 第三部分：缺页异常处理

#### 按需分页（Demand Paging）

**练习 9-10**：实现缺页处理流程：

```
do_page_fault
  → handle_trans_fault
    → 查找 fault 地址对应的 VMR
      → 通过 PMO 检查物理页是否存在
        → 若已分配：仅添加页表映射
        → 若未分配：分配新物理页 → 记录到 PMO → 添加页表映射
```

**缺页处理的关键函数**：

```c
int handle_trans_fault(struct addr_space *as, vaddr_t fault_va)
{
    // 1. 查找 VMR
    struct vmregion *vmr = find_vmr_for_va(as, fault_va);
    // 2. 计算 PMO 中的偏移
    // 3. 尝试获取物理页
    // 4. 若不存在则分配新页
    // 5. 建立页表映射
}
```

---

## Lab3：进程与线程管理

### 实验目标

在 ChCore 上创建第一个用户态进程（`procmgr`），完善异常处理流程和系统调用，支持用户态程序的运行。

### 第一部分：Capability 机制与进程创建

ChCore 使用 Capability 机制管理资源访问权限。每个进程是一个 `cap_group`，拥有一个 capability 空间，控制对所有内核对象（物理内存、IPC 连接、线程等）的访问。

**练习 1**：实现 `sys_create_cap_group` 和 `create_root_cap_group`

```
内核初始化
  → main()
    → create_root_thread()
      → create_root_cap_group()  // 创建 cap_group
      → 加载 ELF 程序段
      → init_thread_ctx()        // 初始化线程上下文
    → sched()                    // 调度第一个线程
    → eret_to_thread()           // 切换到用户态
```

#### ELF 加载过程

**练习 2**：在 `create_root_thread` 中：
1. 读取 ELF 文件头，获取程序头信息
2. 为每个程序段调用 `create_pmo` 分配物理内存
3. 通过 `map_pmo_in_vmspace` 将程序段映射到进程地址空间
4. 设置 entry point 和栈指针

#### 线程上下文初始化

**练习 3**：实现 `init_thread_ctx`，设置：
- 线程入口地址（ELF entry point）
- 栈指针
- 异常返回时的异常级别（EL0）
- FPU/SIMD 寄存器状态

### 第二部分：异常管理

#### 异常向量表

AArch64 异常向量表以 0x800 字节对齐，分为 4 类 × 4 种异常级别共 16 个条目：

| 偏移 | 异常类型 |
|------|----------|
| `+0x000` | EL1t 同异常级别同步 |
| `+0x200` | EL1t 同异常级别 IRQ |
| `+0x400` | EL1t 同异常级别 FIQ |
| `+0x600` | EL1t 同异常级别 SError |
| `+0x700` | EL0 异步异常 ... |

**练习 4-5**：填写异常向量表，配置 `vbar_el1` 寄存器

### 第三部分：系统调用

#### 异常进入与退出

**练习 6**：实现 `exception_enter`（保存上下文）和 `exception_exit`（恢复上下文）：

```
用户态 (EL0)                   内核态 (EL1)
┌────────────┐                ┌────────────┐
│ svc #0     │───异常进入────→│ exception_enter │
│            │                │  - 保存寄存器  │
│            │                │  - 切换内核栈  │
│            │                │  - 处理系统调用 │
│            │←──异常返回────│ exception_exit  │
│ 返回结果   │                │  - 恢复寄存器  │
└────────────┘                │  - eret       │
                             └────────────┘
```

#### printf 系统调用链路追踪

**练习 7-8**：用户态 `printf` 的完整调用链：

```
printf → vfprintf → __stdio_write → chcore_stdout_write
  → chcore_write → chcore_syscallx(SYS_putstr, ...)
    → svc #0 → sys_putstr (内核态)
```

---

## Lab4：多核调度与 IPC

### 实验目标

支持多核启动、实现 Round-Robin 调度算法、实现基于 Capability 权限管控的 IPC 机制。

### 第一部分：多核启动

#### SMP 启动流程

- 树莓派 3 有 4 个 CPU 核心
- **主核**（CPU 0）执行完整初始化
- **从核**（CPU 1-3）在 `secondary_boot_flag` 置位后开始执行

**练习 1-2**（思考题）：
- 主核通过 `mpidr_el1` 寄存器判断核心 ID
- 从核在主核完成初始化后通过 `enable_smp_cores` 唤醒
- `secondary_boot_flag` 的地址管理涉及物理地址与虚拟地址的转换

### 第二部分：多核调度

#### Round-Robin 调度器

**练习 3-4**：实现：
- `sched_enqueue`：将线程加入就绪队列
- `sched_dequeue`：从就绪队列移除线程
- `sched`：选择下一个要执行的线程（时间片轮转）

#### 每核心数据结构

每个 CPU 核心维护独立的：
- 就绪队列（`ready_queue`）
- 当前运行的线程（`current_thread`）
- 调度上下文（`sched_context`）

通过 `tpidr_el1` 寄存器获取当前核心 ID 以索引这些数据结构。

### 第三部分：IPC（进程间通信）

#### 微内核 IPC 架构

ChCore 的 IPC 采用 **客户端-服务器模型**：

```
Client                     Server
  │                          │
  │──ipc_register_client──→  │  (建立连接)
  │                          │
  │──ipc_call──────────────→ │  (发起请求)
  │                          │──server_handler (ipc_dispatcher)
  │←──ipc_return────────────│  (返回结果)
```

#### 三类线程

| 线程类型 | 作用 |
|----------|------|
| `TYPE_USER` | 主线程，普通用户线程 |
| `TYPE_REGISTER` | 注册回调线程，处理建连请求 |
| `TYPE_SHADOW` | 服务线程，处理实际 IPC 请求 |

注册回调和 Shadow 线程没有自己的调度上下文，继承客户端的调度时间片。

#### IPC 连接创建流程

```
1. Server 主线程调用 ipc_register_server
   → sys_register_server（内核系统调用）
   → 创建 ipc_server_config / ipc_server_register_cb_config

2. Client 调用 ipc_register_client
   → 申请共享物理内存
   → sys_register_client（内核系统调用）
   → create_connection() 创建 ipc_connection
   → 切换到注册回调线程

3. 注册回调线程（register_cb）
   → 分配共享内存虚拟地址
   → 创建 Shadow 服务线程
   → sys_ipc_register_cb_return
   → 切换回客户端
```

#### IPC 请求处理

**练习 7**：实现 `kernel/ipc/connection.c` 中的 IPC 核心逻辑：

```
4. Client: ipc_create_msg → ipc_call
   → sys_ipc_call（内核）
   → 设置 Shadow 线程参数，切换到 Server 端

5. Server: server_handler 处理请求
   → ipc_return
   → sys_ipc_return（内核）
   → 切换回 Client，恢复执行
```

---

## Lab5：虚拟文件系统

### 实验目标

在微内核架构下实现 VFS 抽象层，使不同文件系统（tmpfs、FAT32 等）在应用层以统一方式访问。

### 系统架构

```
应用程序
  ↓ POSIX 接口 (open/read/write/close)
用户态 libc（chcore-libc）
  ↓ IPC
FSM (File System Manager) - 挂载管理、路径解析
  ↓ IPC
FS_Base (文件系统 wrapper) - vnode 抽象、server_entry 映射
  ↓
具体文件系统（tmpfs 等）
```

### 第一部分：POSIX 适配

ChCore 通过 `chcore-libc` 实现 POSIX 接口兼容，将标准的文件操作函数转换为 IPC 请求：

```c
// 用户调用 open("test.txt", O_RDONLY)
// → chcore-libc 封装为 IPC 消息
// → 发送给 FSM 进行路径解析
// → 转发给对应的 FS 服务
// → 返回文件描述符
```

### 第二部分：FSM（File System Manager）

FSM 负责：
- **`FSM_REQ_MOUNT`**：挂载文件系统，建立 IPC 连接
- **`FSM_REQ_UMOUNT`**：卸载文件系统
- **`FSM_REQ_PARSE_PATH`**：解析路径，找到对应的文件系统和挂载点
- **`FSM_REQ_SYNC`**：同步文件系统

**练习 2**：实现 `fsm_mount_fs`，挂载文件系统并创建 IPC 客户端

**练习 3**：实现 IPC 请求处理函数，解析路径并返回对应的 FS cap

### 第三部分：FS_Base（VFS 实现层）

#### vnode 抽象

**练习 4**：实现 vnode 的分配、查找、引用计数管理：

```c
struct fs_vnode {
    ino_t vnode_id;       // 索引节点号
    struct rb_node node;  // 红黑树节点
    enum fs_vnode_type type; // 文件或目录
    int refcnt;           // 引用计数
    off_t size;           // 文件大小
    void *private;        // 文件系统私有数据
};
```

#### server_entry（文件表项）

**练习 5**：建立用户态 fd 与文件系统表项的映射：

```
(client_badge, fd) → fid (server_entry)
```

#### 文件操作实现

**练习 6**：实现 `fs_wrapper_open/close/read/write/lseek`：

- **Open**：分配 vnode + 创建 server_entry + 建立映射
- **Close**：减少引用计数 + 回收资源
- **Read/Write**：通过 `server_ops` 调用实际文件系统
- **Lseek**：维护文件偏移量

#### mmap 与缺页处理

文件 mmap 通过 `PMO_FILE` 类型的内存对象实现：
1. FS 创建 `PMO_FILE` 并建立页错误映射
2. 用户访问时触发缺页异常
3. 内核转发到 FS 的 `user_fault_handler`
4. FS 分配物理页、填充文件内容
5. 返回用户态继续执行

---

## 全部实验详细文档

- [Lab0：拆炸弹 — ARM 汇编逆向工程](./chcore-lab0-arm-bomb.md)
- [Lab1：机器启动 — CPU 异常级别、页表与 MMU](./chcore-lab1-machine-boot.md)
- [Lab2：内存管理 — 伙伴系统、SLAB 与缺页异常](./chcore-lab2-memory-management.md)
- [Lab3：进程与线程管理 — Capability、异常处理与系统调用](./chcore-lab3-process-management.md)
- [Lab4：多核调度与 IPC — SMP、Round-Robin 与 Capability 权限 IPC](./chcore-lab4-multicore-ipc.md)
- [Lab5：虚拟文件系统 — 微内核 VFS 架构 FSM、FS_Base 与 BowerAccess](./chcore-lab5-virtual-file-system.md)

---

## 源代码深度解析（附录）

### 附录 A：内核启动源码详解

**关键文件**：
- `kernel/arch/aarch64/boot/raspi3/init/start.S`：启动入口，主核/从核分流
- `kernel/arch/aarch64/boot/raspi3/init/tools.S`：异常级别切换、MMU 激活
- `kernel/arch/aarch64/boot/raspi3/init/mmu.c`：启动页表配置

#### 启动流程源码级追踪

```
_start (start.S)
  ├── 读取 mpidr_el1，判断是否为主核
  ├── [从核] 等待 secondary_boot_flag
  ├── [主核] arm64_elX_to_el1 → 降至 EL1
  ├── 设置 SP 栈指针
  ├── init_c (init_c.c)
  │   ├── clear_bss 清零 BSS 段
  │   ├── early_uart_init 初始化串口
  │   ├── init_kernel_pt 配置启动页表
  │   └── el1_mmu_activate 启用 MMU
  ├── start_kernel → main (高地址)
  └── [从核] secondary_init_c
```

### 附录 B：物理内存管理源码详解

**关键文件**：
- `kernel/mm/buddy.c`：伙伴系统实现
- `kernel/mm/slab.c`：SLAB 分配器
- `kernel/mm/kmalloc.c`：统一分配接口

#### 伙伴系统核心算法

```c
// 分裂：将 n 阶块分裂为两个 n-1 阶块
split_chunk(phys_mem_pool, chunk, order) {
    for (int i = order; i > target_order; i--) {
        // 计算伙伴地址
        struct phys_chunk *buddy = get_buddy_chunk(chunk, i);
        // 将伙伴加入 i-1 阶空闲链表
        list_add(&buddy->node, &pool->free_lists[i-1]);
    }
}

// 合并：检查伙伴是否空闲，是则合并
merge_chunk(phys_mem_pool, chunk, target_order) {
    for (int i = target_order; i < BUDDY_MAX_ORDER; i++) {
        struct phys_chunk *buddy = get_buddy_chunk(chunk, i);
        if (!buddy_is_free(buddy, i)) break;
        list_del(&buddy->node);
        chunk = min(chunk, buddy); // 合并到低地址
    }
}
```

### 附录 C：IPC 内核实现详解

**关键文件**：
- `kernel/ipc/connection.c`：IPC 连接管理和系统调用
- `user/chcore-libc/libchcore/porting/overrides/src/chcore-port/ipc.c`：用户态 IPC 库

#### 系统调用接口

| 系统调用 | 功能 |
|----------|------|
| `sys_register_server` | 声明为 IPC 服务器 |
| `sys_register_client` | 申请建立 IPC 连接 |
| `sys_ipc_register_cb_return` | 注册回调返回 |
| `sys_ipc_call` | 发起 IPC 请求 |
| `sys_ipc_return` | 返回 IPC 结果 |

### 附录 D：工具链使用

| 工具 | 核心命令 |
|------|----------|
| **GDB** | `break`, `continue`, `stepi`, `info registers`, `x/s` |
| **QEMU** | `qemu-system-aarch64 -M raspi3b -kernel` |
| **objdump** | `aarch64-linux-gnu-objdump -d bomb` |
| **make** | `make qemu`, `make grade`, `make submit` |

---

## 难度进阶路线图

| 实验 | 前置知识 | 预估耗时 |
|------|----------|----------|
| Lab0 | ARM64 指令集基础、GDB 调试、QEMU 用法 | 6–10 小时 |
| Lab1 | AArch64 异常级别、页表翻译、MMU 配置、链接脚本 | 10–15 小时 |
| Lab2 | 伙伴算法、SLAB 分配器、页表管理、缺页异常 | 15–20 小时 |
| Lab3 | Capability 机制、ELF 加载、异常向量表、系统调用 | 10–15 小时 |
| Lab4 | SMP 启动、Round-Robin 调度、并发同步、微内核 IPC 模型 | 12–18 小时 |
| Lab5 | VFS 架构、POSIX 接口、文件系统驱动、用户态服务 | 10–15 小时 |

```
Lab0: ARM汇编
  ↓  (熟悉 ARM64 ISA 和调试工具)
Lab1: 内核启动 + 页表
  ↓  (理解 CPU 特权级和 MMU)
Lab2: 内存管理
  ↓  (掌握物理/虚拟内存管理)
Lab3: 进程与线程
  ↓  (理解操作系统调度单元)
Lab4: 多核调度 + IPC
  ↓  (并发和微内核通信)
Lab5: 虚拟文件系统
  ↓  (微内核架构下的系统服务)
```

### 前置知识详解

各 Lab 所需的前置知识说明：

**Lab0 前置** — 计算机体系结构基础（寄存器、内存、指令执行周期），至少一门编程语言的使用经验。无需操作系统知识，是最佳入门起点。

**Lab1 前置** — ARM64 汇编基础（来自 Lab0）、编译原理基础（链接脚本、ELF 文件格式）、操作系统概念中的特权级与地址翻译。

**Lab2 前置** — C 语言指针和链表操作、数据结构中的二叉树（伙伴系统的隐式树结构）、操作系统虚拟内存与页表概念。

**Lab3 前置** — ELF 文件格式（Lab1 已接触）、操作系统进程与线程概念、ARM64 异常处理机制。

**Lab4 前置** — 并发编程基础（竞态条件、同步原语、原子操作）、调度算法基础（Round-Robin）、微内核架构设计理念。

**Lab5 前置** — POSIX 文件操作接口（open/read/write/close）、文件系统概念（inode、vnode、挂载点）、客户端-服务器通信模型。

### 评分体系

每个 Lab 的评分通过 `make grade` 自动完成，基于 CI 系统：

- 提交代码后触发 GitHub Actions
- 自动提取 `filelist.mk` 中定义的提交文件
- 与主线文件树合并后运行测试评分

---

## 总结

IPADS OS Course Lab 是一门体系完整、实践性极强的操作系统课程。它基于 ChCore 微内核，以 ARM64 和树莓派为平台，覆盖了从汇编语言到文件系统的全栈内容。

**课程设计的独特价值**：

1. **真实微内核**：使用真实发表于顶会（USENIX ATC 2020）的 ChCore 微内核
2. **全栈覆盖**：从硬件启动到用户态文件系统的完整链路
3. **渐进式挑战**：从 ARM 汇编拆弹到 IPC 调度再到 VFS，逐步深入
4. **可见的成果**：最终能在自制内核上运行宝可梦游戏和大模型
5. **工业级工具链**：GDB、QEMU、交叉编译，贴近真实开发环境

本课程不仅教会学生"操作系统是什么"，更让他们亲身体验"操作系统怎么造"。
