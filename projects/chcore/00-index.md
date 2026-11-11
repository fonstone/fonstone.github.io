---
title: "课程总纲：ChCore 微内核操作系统课程"
description: "《ChCore 微内核操作系统课程》6 章的路线图、前置要求与配套阅读索引。"
date: "2026-11-08"
order: 0
tags: ["课程总纲", "ChCore 微内核"]
est_time: "10 分钟"
generated: "course-index"
---

# ChCore 微内核操作系统课程

6 个 lab 对应上海交通大学 IPADS 实验室的 ChCore 微内核实验，目标平台是树莓派 3B+。从 ARM 汇编「拆炸弹」开始，依次做机器启动、内存管理、进程管理、多核 IPC，最后落到虚拟文件系统。每一章都有明确的可运行结果。

## 课程信息

- 难度：进阶
- 章节数：6 章
- 前置要求：会 C 与基础 ARM 汇编；理解虚拟内存与页表；能用法命令行编译与调试
- 学完能拿到：跑通从机器启动到用户进程的完整链路；实现多核 IPC 与虚拟文件系统；读懂微内核与宏内核在接口边界上的差异
- 课程首页（含学习进度）：[/projects/chcore](/projects/chcore)
- 全站阅读路线图：[/start](/start)

## 章节路线

| # | 章节 | 要点 | 预计 |
| --- | --- | --- | --- |
| 01 | [Lab0：拆炸弹 — ARM 汇编逆向工程](/projects/chcore/01-lab0-arm-bomb) | 基于 CSAPP 拆炸弹实验思想，针对 ARM64 (AArch64) 架构，通过 GDB 逆向分析二进制程序破解 6 个 phase | 480 分钟 |
| 02 | [Lab1：机器启动 — CPU 异常级别、页表与 MMU](/projects/chcore/02-lab1-machine-boot) | 在树莓派 3B+ 上启动 ChCore 微内核，完成 EL3→EL1 异常级别切换、AArch64 4 级页表配置、MMU 启用，深入分析启动源码 | 750 分钟 |
| 03 | [Lab2：内存管理 — 伙伴系统、SLAB 与缺页异常](/projects/chcore/03-lab2-memory-management) | 实现 ChCore 内核的物理内存管理器（伙伴系统 + SLAB 分配器）、虚拟内存管理（页表分配）和缺页异常处理 | 1050 分钟 |
| 04 | [Lab3：进程与线程管理 — Capability、异常处理与系统调用](/projects/chcore/04-lab3-process-management) | 在 ChCore 上创建第一个用户态进程，完善异常处理和系统调用，实现用户态程序的完整运行链路 | 750 分钟 |
| 05 | [Lab4：多核调度与 IPC — SMP、Round-Robin 与 Capability 权限 IPC](/projects/chcore/05-lab4-multicore-ipc) | 使 ChCore 支持多核启动、实现 Round-Robin 调度算法和基于 Capability 权限管控的进程间通信机制 | 900 分钟 |
| 06 | [Lab5：虚拟文件系统 — 微内核 VFS 架构 FSM、FS_Base 与 BowerAccess](/projects/chcore/06-lab5-virtual-file-system) | 在微内核架构下实现虚拟文件系统抽象层，包含 POSIX 适配、FSM 挂载管理、FS_Base vnode 抽象和 BowerAccess 页预取优化 | 750 分钟 |

## 配套阅读

知识空间里对应的技术长文，讲这一层为什么要这么设计。

- [Linux 内核启动流程分析](/knowledge/os/linux-kernel-boot-flow)
- [Linux 内存屏障深度解析：并发设计的隐形基石](/knowledge/os/memory-barrier-deep-dive)
- [Linux 设备树详解](/knowledge/os/device-tree-guide)
- [AI 时代下的 OS 代码编程](/knowledge/os/ai-era-os-coding)

## 怎么读

lab 之间强依赖，不要跳。建议每章先跑通测试再往下读，遇到问题回头看《Linux 内存屏障深度解析》和《Linux 内核启动流程分析》，这两篇讲清了 lab 里默认你会的概念。

> 本页由 `scripts/generate-course-indexes.mjs` 从 `courses.ts` 与章节 frontmatter 生成，章节标题与链接随内容自动更新。
