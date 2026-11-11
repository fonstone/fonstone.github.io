---
title: "课程总纲：RDMA 技术详解互动教程"
description: "《RDMA 技术详解互动教程》25 章的路线图、前置要求与配套阅读索引。"
date: "2026-11-08"
order: 0
tags: ["课程总纲", "RDMA"]
est_time: "10 分钟"
generated: "course-index"
---

# RDMA 技术详解互动教程

25 章分三段：1~5 章讲清楚 RDMA 是什么、和 Socket 差在哪、三种技术实现怎么选；6~14 章逐个拆 Memory Region、Protection Domain、Queue Pair、Completion Queue 等核心对象以及 Verbs 编程；15~25 章落到 Soft-RoCE / Soft-iWARP 实验与 DDP、RDMAP、MPA 协议栈。

## 课程信息

- 难度：深入
- 章节数：25 章
- 前置要求：熟悉 Socket 网络编程；理解 DMA 与虚拟内存；能读 C 代码与内核日志
- 学完能拿到：能用 Verbs 写出一次 RDMA Write 并解释每一步；在 Soft-RoCE 环境里复现实验；说清绕过内核到底省下了哪些开销
- 课程首页（含学习进度）：[/projects/rdma](/projects/rdma)
- 全站阅读路线图：[/start](/start)

## 章节路线

| # | 章节 | 要点 | 预计 |
| --- | --- | --- | --- |
| 01 | [RDMA 概述](/projects/rdma/01-rdma-overview) | 介绍 RDMA 技术背景、三种技术实现（InfiniBand/RoCE/iWARP）、特点优势与基本术语。 | 60 分钟 |
| 02 | [比较基于 Socket 与 RDMA 的通信](/projects/rdma/02-socket-vs-rdma) | 通过对比一次典型的 Socket 和 RDMA 通信流程，直观展示 RDMA 在零拷贝、内核旁路和 CPU 卸载方面的优势。 | 15 分钟 |
| 03 | [RDMA 基本元素和编程基础](/projects/rdma/03-rdma-basics) | 介绍 RDMA 的核心编程元素：Context、Device、PD、MR、QP、CQ、AH 等，以及基本的编程流程。 | 25 分钟 |
| 04 | [RDMA 操作类型——WRITE / READ](/projects/rdma/04-rdma-operations) | 详解 RDMA 的 SEND/RECV、WRITE、READ 三种基本操作类型，以及 WRITE/READ 特有的零拷贝远程直接访问语义。 | 40 分钟 |
| 05 | [RDMA 基本服务类型](/projects/rdma/05-rdma-service-types) | 介绍 RDMA 的可靠连接（RC）、不可靠连接（UC）、不可靠数据报（UD）三种服务类型及其特性对比。 | 25 分钟 |
| 06 | [RDMA 之 Memory Region](/projects/rdma/06-memory-region) | 详解 RDMA Memory Region 的概念、注册流程、内存映射、权限控制以及 MR 的生命周期管理。 | 25 分钟 |
| 07 | [RDMA 之 Protection Domain](/projects/rdma/07-protection-domain) | 介绍 Protection Domain 的概念和作用，PD 如何隔离不同应用的 RDMA 资源，以及 PD 与 MR、QP、AH 的关系。 | 15 分钟 |
| 08 | [RDMA 之 Address Handle](/projects/rdma/08-address-handle) | 详解 Address Handle 的概念、创建与使用，AH 在 UD 服务类型中如何标识对端地址信息。 | 15 分钟 |
| 09 | [RDMA 之 Queue Pair](/projects/rdma/09-queue-pair) | 深入讲解 Queue Pair 的概念、类型、状态转换（RTS/INIT/SQErr等）、QP 创建与配置。 | 25 分钟 |
| 10 | [RDMA 之 Completion Queue](/projects/rdma/10-completion-queue) | 详解 Completion Queue 的概念、CQ 的创建、轮询与事件通知机制，以及 CQ 与 QP 的关联关系。 | 40 分钟 |
| 11 | [RDMA 之 Shared Receive Queue](/projects/rdma/11-shared-receive-queue) | 介绍 Shared Receive Queue（SRQ）的概念、优势、创建与使用场景，以及 SRQ 如何减少内存占用。 | 25 分钟 |
| 12 | [RDMA 之 Memory Window](/projects/rdma/12-memory-window) | 详解 Memory Window 的概念、类型、绑定流程，以及 MW 如何实现对远程内存的细粒度动态访问控制。 | 40 分钟 |
| 13 | [RDMA 之 Verbs 和编程步骤](/projects/rdma/13-verbs-and-programming) | 介绍 RDMA Verbs API 体系、用户态与内核态 Verbs 接口、编程步骤与 WR/WC 的处理流程。 | 40 分钟 |
| 14 | [RDMA 之用户态与内核态交互](/projects/rdma/14-userspace-kernel-interaction) | 分析 RDMA 软件协议栈中用户态与内核态的交互机制，包括系统调用、IOCTL、MMIO 等通路。 | 25 分钟 |
| 15 | [RDMA 之 RoCE & Soft-RoCE](/projects/rdma/15-roce-soft-roce) | 详解 RoCEv1/RoCEv2 协议、无损网络要求、PFC/ECN 流控机制，以及 Soft-RoCE 的部署与实验。 | 40 分钟 |
| 16 | [Pyverbs——Python Verbs](/projects/rdma/16-pyverbs-python-verbs) | 介绍 Pyverbs（Python 绑定的 RDMA Verbs API）的使用方法、编程示例，以及如何用 Python 进行 RDMA 开发。 | 40 分钟 |
| 17 | [内存地址基础知识](/projects/rdma/17-memory-address-basics) | 介绍虚拟地址、物理地址、IOVA 的概念及其在 RDMA 中的映射关系，以及页大小对 RDMA 的影响。 | 40 分钟 |
| 18 | [Queue Buffer](/projects/rdma/18-queue-buffer) | 详解 RDMA Queue Buffer 的分配、管理与 DMA 映射，以及与 QP 相关的缓冲区机制。 | 40 分钟 |
| 19 | [用户态 Memory Region Buffer](/projects/rdma/19-userspace-mr-buffer) | 详解用户态 MR Buffer 的分配、注册、生命周期管理及在零拷贝传输中的作用。 | 40 分钟 |
| 20 | [RDMA 之 iWARP & Soft-iWARP](/projects/rdma/20-iwarp-soft-iwarp) | 介绍 iWARP 协议栈架构、与 RoCE 的对比、Soft-iWARP 实现以及 iWARP 在标准以太网上的部署方案。 | 60 分钟 |
| 21 | [RDMA 之 DDP（Direct Data Placement）](/projects/rdma/21-ddp) | 详解 iWARP 协议栈中的 DDP 层——直接数据放置协议，功能、报文格式与操作流程。 | 40 分钟 |
| 22 | [iWARP 之 RDMAP](/projects/rdma/22-rdmap) | 详解 iWARP 协议栈中的 RDMAP 层——远程直接内存访问协议，操作语义与报文格式。 | 40 分钟 |
| 23 | [iWARP 之 MPA](/projects/rdma/23-mpa) | 详解 iWARP 协议栈中的 MPA（Marker PDU Aligned）层，功能、帧格式与 TCP 协作机制。 | 40 分钟 |
| 24 | [Socket 建链](/projects/rdma/24-socket-connection) | 详解通过 Socket 建立 RDMA 连接的完整流程，包括资源初始化、QP 状态转换、内存注册等步骤。 | 40 分钟 |
| 25 | [CM 建链](/projects/rdma/25-cm-connection) | 详解 RDMA CM（Connection Manager）的建链流程，包括 CM 事件处理、REQ/REP 消息交换与 QP 连接。 | 40 分钟 |

## 配套阅读

知识空间里对应的技术长文，讲这一层为什么要这么设计。

- [超低时延研究地图，七个方向在哪里交汇](/knowledge/os/ultra-low-latency-research-map)
- [尾延迟尖峰的归因，从请求足迹到跨层时间校准](/knowledge/os/tail-latency-jitter-attribution)
- [共享资源争抢的干扰建模与隔离，从 MSHR 到内存银行](/knowledge/os/shared-resource-interference-isolation)
- [XPU 精细化调度与抢占，时间片、三级模型与微秒级拆核](/knowledge/os/xpu-preemptive-scheduling)
- [AI Infra 全栈架构（2026）深度解析](/knowledge/ai/ai-infra-fullstack-architecture-2026)

## 怎么读

第 3 章的基本元素是后面所有章节的词汇表，务必先读。有 Socket 编程经验可以快读前两章，但从第 6 章起建议配合实验环境，每读一个对象就用 Verbs 打一次日志验证。时延侧的理论背景见《超低时延研究地图，七个方向在哪里交汇》。

> 本页由 `scripts/generate-course-indexes.mjs` 从 `courses.ts` 与章节 frontmatter 生成，章节标题与链接随内容自动更新。
