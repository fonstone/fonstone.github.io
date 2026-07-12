---
title: "嵌入式 Rust"
description: "嵌入式 Rust - 嵌入式 Rust"
date: "2026-07-12"
order: 20000
tags: ["嵌入式", "no_std", "PAC", "HAL", "Embassy", "中断"]
est_time: "5 分钟"
---

 <p>在这一章中，我们将离开操作系统的「舒适区」，直接在裸机（Bare-metal）硬件上编写 Rust 代码。嵌入式开发是 Rust 的核心战场之一——Rust 的内存安全性与硬件级的控制能力，解决了长久以来 C 语言嵌入式开发中内存安全隐患、并发竞争和难以跨平台抽象的痛点。</p>
<p>Rust 嵌入式的核心优势：<strong>零成本抽象</strong>（高级语法，C 级机器码）、<strong>类型安全</strong>（将硬件状态编码进类型，编译期拦截非法操作）、<strong>强大生态</strong>（Embedded-HAL 标准，一份驱动跑在不同 MCU 上）。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-no-std-basics">裸机开发基础：no_std 环境</a></td><td><code>no_std</code> 环境、Panic 处理与程序入口点</td></tr><tr><td><a href="./02-memory-layout">内存布局与链接脚本</a></td><td>内存映射、<code>memory.x</code> 与启动时的内存段初始化</td></tr><tr><td><a href="./03-hardware-abstraction">硬件抽象：PAC 与 HAL</a></td><td>PAC、HAL 以及类型安全的寄存器操作</td></tr><tr><td><a href="./04-interrupts-concurrency">中断与并发安全</a></td><td>嵌入式并发、原子操作，中断中的安全数据访问</td></tr><tr><td><a href="./05-async-embassy">实战演练：简易内核实验</a></td><td>现代化异步嵌入式框架，高效处理多任务</td></tr><tr><td><a href="./06-toolchain-debug">异步嵌入式：Embassy 框架</a></td><td>嵌入式工具链配置、调试手段与实战项目串联</td></tr></tbody></table> 