---
title: "课程总纲：AUTOSAR & 功能安全互动教程"
description: "《AUTOSAR & 功能安全互动教程》12 章的路线图、前置要求与配套阅读索引。"
date: "2026-11-08"
order: 0
tags: ["课程总纲", "AUTOSAR 与功能安全"]
est_time: "10 分钟"
generated: "course-index"
---

# AUTOSAR & 功能安全互动教程

前 7 章拆 AUTOSAR OS 的实现：从 OSEK/VDX 的任务与资源模型，到 ERIKA v3 在 TC38x 上的移植，再到多核启动、内存保护。后 5 章转到功能安全，用 ISO 26262 的 HARA 与 ASIL 分解回答「凭什么说这个调度是安全的」。两部分用同一个车载场景串起来。

## 课程信息

- 难度：深入
- 章节数：12 章
- 前置要求：懂 C 语言与裸机开发；了解中断、任务与调度的基本概念；读过至少一份芯片数据手册
- 学完能拿到：能手写一个符合 OSEK 约定的任务调度表；能解释 ERIKA v3 在 TC38x 上的移植取舍；能独立完成一次 HARA 与 ASIL 分解推演
- 课程首页（含学习进度）：[/projects/autosar-functional-safety](/projects/autosar-functional-safety)
- 全站阅读路线图：[/start](/start)

## 章节路线

| # | 章节 | 要点 | 预计 |
| --- | --- | --- | --- |
| 01 | [基于 ERIKA v3 与 TC38x 深入理解 AUTOSAR OS（一）：引言与架构全景](/projects/autosar-functional-safety/01-autosar-intro) | 从 OSEK/VDX 到 AUTOSAR OS 规范演进，ERIKA v3 + TC38x 平台全景，多核架构映射与调度器双模式解析。 | 45 分钟 |
| 02 | [基于 ERIKA v3 与 TC38x 深入理解 AUTOSAR OS（二）：任务管理深度解析](/projects/autosar-functional-safety/02-kernel-data-structures) | Basic Task 与 Extended Task 状态机本质区别，调度策略 dispatch_prio 统一实现，OIL 配置到 C 数据结构的完整代码生成链路。 | 60 分钟 |
| 03 | [基于 ERIKA v3 与 TC38x 深入理解 AUTOSAR OS（三）：中断处理与资源同步](/projects/autosar-functional-safety/03-task-scheduling) | TriCore 中断向量表与 ISR Category 1/2 差异化路径，优先级天花板协议软硬件双重屏蔽，Spinlock 多核互斥原语体系。 | 50 分钟 |
| 04 | [基于 ERIKA v3 与 TC38x 深入理解 AUTOSAR OS（四）：多核启动与核间通信](/projects/autosar-functional-safety/04-interrupts-resources) | Master Core 引导与 Slave Core 唤醒流程，StartOS 双重同步屏障，GPSR 核间中断与跨核任务激活路径，自旋锁多核临界区保护体系。 | 50 分钟 |
| 05 | [基于 ERIKA v3 与 TC38x 深入理解 AUTOSAR OS（五）：Alarm 与 Counter 定时子系统](/projects/autosar-functional-safety/05-multicore-boot-ipc) | 从 TC38x 的 STM 硬件定时器出发，逐层追踪一个 tick 如何穿越 Counter 递增、触发队列扫描、Alarm 动作分发，直到任务激活的完整路径 | 50 分钟 |
| 06 | [基于 ERIKA v3 与 TC38x 深入理解 AUTOSAR OS（六）：内存保护与 OS Application 隔离](/projects/autosar-functional-safety/06-memory-protection) | 深入 AUTOSAR OS 的内存保护与 OS Application 隔离机制，分析 ERIKA v3 在 TC38x 上的实现现状与 TriCore MPU 硬件能力 | 45 分钟 |
| 07 | [基于 ERIKA v3 与 TC38x 深入理解 AUTOSAR OS（七）：实战与总结](/projects/autosar-functional-safety/07-autosar-os-practice) | 从 .oil 配置到 .elf 构建的全流程实战，核心代码导读路径分析，以及 ERIKA v3 开源生态对学习商用 AUTOSAR OS 的桥梁价值 | 40 分钟 |
| 08 | [功能安全入门与 ISO 26262 标准](/projects/autosar-functional-safety/08-fs-introduction) | 功能安全的基本概念、ISO 26262 标准体系架构、ASIL 等级定义与功能安全生命周期 | 40 分钟 |
| 09 | [危害分析与风险评估（HARA）](/projects/autosar-functional-safety/09-fs-hara) | HARA 方法论、SEOOI 参数评级、安全目标推导与工程实践案例 | 45 分钟 |
| 10 | [ASIL 分解与安全机制](/projects/autosar-functional-safety/10-fs-asil-decomposition) | ASIL 分解原则、安全机制分类、故障处理与冗余设计模式 | 45 分钟 |
| 11 | [AUTOSAR 中的功能安全实现](/projects/autosar-functional-safety/11-fs-autosar-safety) | AUTOSAR CP 中的安全机制、Safety Island、E2E 保护、SecOC 与看门狗管理器 | 50 分钟 |
| 12 | [课程总结与未来方向](/projects/autosar-functional-safety/12-course-summary) | AUTOSAR OS 与功能安全知识体系回顾、商用工具链对比、学习路径推荐 | 30 分钟 |

## 配套阅读

知识空间里对应的技术长文，讲这一层为什么要这么设计。

- [AUTOSAR OS 深度解析：基于 ERIKA3 与 Infineon AURIX TC38x 的实现](/knowledge/autonomous-driving/autosar-os-erika3-tc38x)
- [深入浅出车载以太网核心：SOME/IP协议全景解析](/knowledge/autonomous-driving/someip-protocol-panoramic-analysis)
- [混合关键系统调度，从 AMC 到强化学习和 AI 引擎](/knowledge/os/mixed-criticality-scheduling)
- [WCET 分析与时序验证，静态上界、轨迹校准和运行时兜底](/knowledge/os/wcet-analysis-timing-verification)
- [多核并行与共享数据访问，确定性被什么吃掉](/knowledge/os/deterministic-multicore-shared-data)

## 怎么读

有裸机开发经验可以从第 2 章开始；只想补功能安全，第 8 章起单独成段。第 7 章的 TC38x 移植记录和知识空间里的 ERIKA3 源码解析对照读，能省掉不少查手册的时间。

> 本页由 `scripts/generate-course-indexes.mjs` 从 `courses.ts` 与章节 frontmatter 生成，章节标题与链接随内容自动更新。
