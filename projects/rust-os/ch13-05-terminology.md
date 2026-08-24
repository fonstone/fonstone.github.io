---
title: "术语中英文对照表"
description: ""
date: "2026-07-12"
order: 89
tags: ["术语表", "中英文对照", "参考"]
est_time: "15分钟"
---
## 第一章：RV64 裸机应用

|  |  |  |
| --- | --- | --- |
| 中文 | 英文 | 出现章节 |
| 执行环境 | Execution Environment | 应用程序运行环境与平台支持 |
| 系统调用 | System Call | 应用程序运行环境与平台支持 |
| 指令集体系结构 | ISA, Instruction Set Architecture | 应用程序运行环境与平台支持 |
| 抽象 | Abstraction | 应用程序运行环境与平台支持 |
| 平台 | Platform | 应用程序运行环境与平台支持 |
| 目标三元组 | Target Triplet | 应用程序运行环境与平台支持 |
| 裸机平台 | Bare-Metal | 应用程序运行环境与平台支持 |
| 交叉编译 | Cross Compile | 移除标准库依赖 |
| 物理地址 | Physical Address | 内核第一条指令（原理篇） |
| 物理内存 | Physical Memory | 内核第一条指令（原理篇） |
| 引导加载程序 | Bootloader | 内核第一条指令（原理篇） |
| 控制流 | Control Flow | 为内核支持函数调用 |
| 函数调用 | Function Call | 为内核支持函数调用 |
| 源寄存器 | Source Register | 为内核支持函数调用 |
| 立即数 | Immediate | 为内核支持函数调用 |
| 目标寄存器 | Destination Register | 为内核支持函数调用 |
| 伪指令 | Pseudo Instruction | 为内核支持函数调用 |
| 上下文 | Context | 为内核支持函数调用 |
| 活动记录 | Activation Record | 为内核支持函数调用 |
| 保存/恢复 | Save/Restore | 为内核支持函数调用 |
| 被调用者保存 | Callee-Saved | 为内核支持函数调用 |
| 调用者保存 | Caller-Saved | 为内核支持函数调用 |
| 开场白 | Prologue | 为内核支持函数调用 |
| 收场白 | Epilogue | 为内核支持函数调用 |
| 调用规范 | Calling Convention | 为内核支持函数调用 |
| 栈/栈指针/栈帧 | Stack/Stack Pointer/Stackframe | 为内核支持函数调用 |
| 后入先出 | LIFO, Last In First Out | 为内核支持函数调用 |
| 段 | Section | 为内核支持函数调用 |
| 内存布局 | Memory Layout | 为内核支持函数调用 |
| 堆 | Heap | 为内核支持函数调用 |
| 编译器 | Compiler | 为内核支持函数调用 |
| 汇编器 | Assembler | 为内核支持函数调用 |
| 链接器 | Linker | 为内核支持函数调用 |
| 目标文件 | Object File | 为内核支持函数调用 |
| 链接脚本 | Linker Script | 为内核支持函数调用 |
| 可执行和链接格式 | ELF, Executable and Linkable Format | 手动加载、运行应用程序 |
| 元数据 | Metadata | 手动加载、运行应用程序 |
| 魔数 | Magic | 手动加载、运行应用程序 |
| 裸指针 | Raw Pointer | 手动加载、运行应用程序 |
| 解引用 | Dereference | 手动加载、运行应用程序 |

## 第二章：批处理系统

|  |  |  |
| --- | --- | --- |
| 中文 | 英文 | 出现章节 |
| 批处理系统 | Batch System | 引言 |
| 特权级 | Privilege | 引言 |
| 监督模式执行环境 | SEE, Supervisor Execution Environment | RISC-V 特权级架构 |
| 异常控制流 | ECF, Exception Control Flow | RISC-V 特权级架构 |
| 陷入 | Trap | RISC-V 特权级架构 |
| 异常 | Exception | RISC-V 特权级架构 |
| 执行环境调用 | Environment Call | RISC-V 特权级架构 |
| 监督模式二进制接口 | SBI, Supervisor Binary Interface | RISC-V 特权级架构 |
| 应用程序二进制接口 | ABI, Application Binary Interface | RISC-V 特权级架构 |
| 控制状态寄存器 | CSR, Control and Status Register | RISC-V 特权级架构 |
| 胖指针 | Fat Pointer | 实现应用程序 |
| 内部可变性 | Interior Mutability | 实现应用程序 |
| 指令缓存 | i-cache, Instruction Cache | 实现批处理系统 |
| 数据缓存 | d-cache, Data Cache | 实现批处理系统 |
| 原子指令 | Atomic Instruction | 处理 Trap |

## 第三章：多道程序与分时多任务

|  |  |  |
| --- | --- | --- |
| 中文 | 英文 | 出现章节 |
| 多道程序 | Multiprogramming | 引言 |
| 分时多任务系统 | Time-Sharing Multitasking | 引言 |
| 任务上下文 | Task Context | 任务切换 |
| 输入/输出 | I/O, Input/Output | 多道程序与协作式调度 |
| 任务控制块 | Task Control Block | 多道程序与协作式调度 |
| 吞吐量 | Throughput | 分时多任务系统与抢占式调度 |
| 后台应用 | Background Application | 分时多任务系统与抢占式调度 |
| 交互式应用 | Interactive Application | 分时多任务系统与抢占式调度 |
| 协作式调度 | Cooperative Scheduling | 分时多任务系统与抢占式调度 |
| 时间片 | Time Slice | 分时多任务系统与抢占式调度 |
| 公平性 | Fairness | 分时多任务系统与抢占式调度 |
| 时间片轮转算法 | RR, Round-Robin | 分时多任务系统与抢占式调度 |
| 中断 | Interrupt | 分时多任务系统与抢占式调度 |
| 同步 | Synchronous | 分时多任务系统与抢占式调度 |
| 异步 | Asynchronous | 分时多任务系统与抢占式调度 |
| 并行 | Parallel | 分时多任务系统与抢占式调度 |
| 软件中断 | Software Interrupt | 分时多任务系统与抢占式调度 |
| 时钟中断 | Timer Interrupt | 分时多任务系统与抢占式调度 |
| 外部中断 | External Interrupt | 分时多任务系统与抢占式调度 |
| 嵌套中断 | Nested Interrupt | 分时多任务系统与抢占式调度 |
| 轮询 | Busy Loop | 分时多任务系统与抢占式调度 |

## 第四章：地址空间

|  |  |  |
| --- | --- | --- |
| 中文 | 英文 | 出现章节 |
| 幻象 | Illusion | 引言 |
| 时分复用 | TDM, Time-Division Multiplexing | 引言 |
| 地址空间 | Address Space | 地址空间 |
| 虚拟地址 | Virtual Address | 地址空间 |
| 内存管理单元 | MMU, Memory Management Unit | 地址空间 |
| 地址转换 | Address Translation | 地址空间 |
| 插槽 | Slot | 地址空间 |
| 位图 | Bitmap | 地址空间 |
| 内碎片 | Internal Fragment | 地址空间 |
| 外碎片 | External Fragment | 地址空间 |
| 页面 | Page | 地址空间 |
| 虚拟页号 | VPN, Virtual Page Number | 地址空间 |
| 物理页号 | PPN, Physical Page Number | 地址空间 |
| 页表 | Page Table | 地址空间 |
| 静态分配 | Static Allocation | Rust 中的动态内存分配 |
| 动态分配 | Dynamic Allocation | Rust 中的动态内存分配 |
| 智能指针 | Smart Pointer | Rust 中的动态内存分配 |
| 集合 | Collection | Rust 中的动态内存分配 |
| 容器 | Container | Rust 中的动态内存分配 |
| 借用检查 | Borrow Check | Rust 中的动态内存分配 |
| 引用计数 | Reference Counting | Rust 中的动态内存分配 |
| 垃圾回收 | GC, Garbage Collection | Rust 中的动态内存分配 |
| 资源获取即初始化 | RAII, Resource Acquisition Is Initialization | Rust 中的动态内存分配 |
| 页内偏移 | Page Offset | 实现 SV39 多级页表机制（上） |
| 类型转换 | Type Conversion | 实现 SV39 多级页表机制（上） |
| 字典树 | Trie | 实现 SV39 多级页表机制（上） |
| 多级页表 | Multi-Level Page Table | 实现 SV39 多级页表机制（上） |
| 页索引 | Page Index | 实现 SV39 多级页表机制（上） |
| 大页 | Huge Page | 实现 SV39 多级页表机制（上） |
| 恒等映射 | Identical Mapping | 实现 SV39 多级页表机制（下） |
| 页表自映射 | Recursive Mapping | 实现 SV39 多级页表机制（下） |
| 跳板 | Trampoline | 内核与应用的地址空间 |
| 隔离 | Isolation | 内核与应用的地址空间 |
| 保护页面 | Guard Page | 内核与应用的地址空间 |
| 快表 | Translation Lookaside Buffer | 基于地址空间的分时多任务 |
| 熔断 | Meltdown | 基于地址空间的分时多任务 |

---

## 本节练习

6. \*\* 在实际操作系统中，如Linux，为什么会存在大量的文件系统类型？

   因为不同的文件系统有着不同的特性，比如对于特定种类的存储设备的优化，或是快照和多设备管理等高级特性，适用于不同的使用场景。

11. \*\*\* 文件系统是一个操作系统必要的组件吗？是否可以将文件系统放到用户态？这样做有什么好处？操作系统需要提供哪些基本支持？

    不是，如在本章之前的rCore就没有文件系统。可以，如在Linux下就有FUSE这样的框架可以实现这一点。这样可以使得文件系统的实现更为灵活，开发与调试更为简便。操作系统需要提供一个注册用户态文件系统实现的机制，以及将收到的文件系统相关系统调用转发给注册的用户态进程的支持。
