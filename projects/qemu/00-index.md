---
title: "课程总纲：QEMU & CPU 架构互动教程"
description: "《QEMU & CPU 架构互动教程》8 章的路线图、前置要求与配套阅读索引。"
date: "2026-11-08"
order: 0
tags: ["课程总纲", "QEMU 与 CPU"]
est_time: "10 分钟"
generated: "course-index"
---

# QEMU & CPU 架构互动教程

课程以 Quard-Star 这块自定义虚拟板卡为主线，从注册板卡、加串口和中断控制器开始，经 OpenSBI、U-Boot、VirtIO 设备、Linux 内核与根文件系统，一直做到应用移植与调试扩展。它把「启动」这件事拆成 8 段可单步验证的过程。

## 课程信息

- 难度：进阶
- 章节数：8 章
- 前置要求：熟悉 Linux 使用与 Makefile；了解交叉编译；知道 bootloader 的基本职责
- 学完能拿到：在 QEMU 里注册一块自己的虚拟板卡；从第一条指令追到 Linux shell 起来；能加一个自定义 VirtIO 设备并调试它
- 课程首页（含学习进度）：[/projects/qemu](/projects/qemu)
- 全站阅读路线图：[/start](/start)

## 章节路线

| # | 章节 | 要点 | 预计 |
| --- | --- | --- | --- |
| 01 | [QEMU 环境搭建与 Quard-Star 自定义板卡](/projects/qemu/01-qemu-env-and-board) | 从下载 QEMU 源码、注册自定义 Quard-Star 仿真板，到添加串口/中断控制器/pflash 并编写 lowlevelboot 测试固件验证串口打印。 | 60 分钟 |
| 02 | [多级 BootLoader、OpenSBI 与设备树](/projects/qemu/02-opensbi-and-bootloader) | 理解 SOC 多级 Boot 设计，移植 OpenSBI 并添加 platform，编写设备树文件，加载运行 OpenSBI，并配置 Domain 实现安全域隔离。 | 40 分钟 |
| 03 | [U-Boot 移植、内存重规划与 virtio/fw_cfg](/projects/qemu/03-uboot-and-virtio) | 移植 U-Boot 到 udomain，重新规划整系统物理内存，添加 virtio-mmio 与 fw_cfg 虚拟外设，为 Linux 内核启动做准备。 | 25 分钟 |
| 04 | [Linux 内核加载与最小根文件系统](/projects/qemu/04-linux-kernel-rootfs) | 编译 Linux 内核并制作文件系统映像引导启动，移植 busybox，编写 inittab/rcS/fstab 完成最小根文件系统，探究动态链接 ELF 加载机制与多用户管理。 | 40 分钟 |
| 05 | [Framebuffer 显示、交叉编译应用与 RTC/syscon](/projects/qemu/05-device-and-gui) | 添加 virtio-gpu 显示设备并调试 DRM 驱动，交叉编译 bash/ncurses/make 并用 virtio-9p 共享目录，添加 RTC 时钟与 syscon 复位/关机设备。 | 25 分钟 |
| 06 | [应用移植、工具链更换与 Qt 库移植](/projects/qemu/06-app-porting-toolchain) | 交叉编译 sudo/screen/tree/cu，更换为自编译的 GCC 工具链（glibc + newlib），简谈 libc 选择，并把 Qt 库移植到 Framebuffer 上运行 GUI 应用。 | 25 分钟 |
| 07 | [FreeRTOS 移植、网卡配置与 sshd 服务](/projects/qemu/07-rtos-and-network) | 在 trusted-domain 中移植 FreeRTOS 到 RISC-V S 模式（自写 port 层），给 qemu 添加 virtio-net 网卡并配置 DHCP 开机启动，交叉编译 openssh 并配置 sshd 服务。 | 25 分钟 |
| 08 | [调试技巧、qemu 参数速查与扩展主题](/projects/qemu/08-debugging-and-extensions) | kgdb 调试 Linux 内核与驱动模块，qemu gdbstub 早期调试，gcc -pg 选项做嵌入式 profile，qemu 常用参数速查表，QEMU CAN 总线模拟，ifplugd 网口插拔检测配置。 | 25 分钟 |

## 配套阅读

知识空间里对应的技术长文，讲这一层为什么要这么设计。

- [Linux 内核启动流程分析](/knowledge/os/linux-kernel-boot-flow)
- [Linux 设备树详解](/knowledge/os/device-tree-guide)
- [Yocto 与 Buildroot 详解，嵌入式 Linux 构建系统的原理、流程与作用](/knowledge/os/yocto-buildroot-embedded-linux-build-systems)
- [AI 时代异构操作系统：从通用管理到异构计算深度优化](/knowledge/os/ai-era-heterogeneous-os)

## 怎么读

第 1 章的环境搭建必须动手，后面所有章节都基于它。配套代码按 tag 分阶段，建议每完成一章就 checkout 对应 tag 对照。设备树写法见《Linux 设备树详解》，构建系统选型见《Yocto 与 Buildroot 详解》。

> 本页由 `scripts/generate-course-indexes.mjs` 从 `courses.ts` 与章节 frontmatter 生成，章节标题与链接随内容自动更新。
