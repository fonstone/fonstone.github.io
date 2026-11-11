---
title: "课程总纲：AI Infra 互动教程"
description: "《AI Infra 互动教程》12 章的路线图、前置要求与配套阅读索引。"
date: "2026-11-08"
order: 0
tags: ["课程总纲", "AI Infra"]
est_time: "10 分钟"
generated: "course-index"
---

# AI Infra 互动教程

这门课按「硬件 → 网络 → 并行 → 推理 → 应用」自下而上排。前四章先把 GPU 互联和集合通信的带宽账算清楚，中间的并行策略与 ZeRO 才不会变成背名词。第 10 章之后的推理优化和 Agent 应用，都建立在前面对显存、带宽、算力三者排队关系的理解上。

## 课程信息

- 难度：进阶
- 章节数：12 章
- 前置要求：了解基本的神经网络训练流程；会用 Linux 命令行；知道 TCP/IP 与进程/线程的基本概念
- 学完能拿到：能读懂一张 AI 集群拓扑图并指出带宽瓶颈；能解释 DP / TP / PP / ZeRO 各自省下的是什么；能说清一次推理请求在显存、带宽与算力之间怎么排队
- 课程首页（含学习进度）：[/projects/ai-infra](/projects/ai-infra)
- 全站阅读路线图：[/start](/start)

## 章节路线

| # | 章节 | 要点 | 预计 |
| --- | --- | --- | --- |
| 01 | [AI 基础设施全景：从芯片到 Agent](/projects/ai-infra/01-ai-infra-overview) | Scaling Law 演进脉络，AI Infra 全栈分层架构，从 GPU 到 Agent 的四层模型，关键技术栈全景与开源生态格局。 | 40 分钟 |
| 02 | [AI 计算集群与 GPU 架构](/projects/ai-infra/02-ai-cluster-gpu) | 从 H100 到 B200 的 GPU 架构演进，万卡集群构成要素，NVLink 拓扑拓扑，算力指标与量化精度体系详解。 | 50 分钟 |
| 03 | [AI 芯片互联与性能建模](/projects/ai-infra/03-chip-interconnect-performance) | NVLink/NVSwitch 互联拓扑，Roofline 性能分析模型，MFU/HFU 建模框架，DeepGEMM 与 FP8 混合精度实现。 | 45 分钟 |
| 04 | [集合通信原理](/projects/ai-infra/04-collective-communications) | AllReduce/Ring/Tree/Butterfly 算法详解，通信域与通信组模型，NCCL 架构与 API，PyTorch 分布式原语。 | 50 分钟 |
| 05 | [AI 集群网络拓扑](/projects/ai-infra/05-network-topology) | Fat-Tree、Dragonfly+、Torus 三大拓扑结构详解，DCN 网络平面划分（Frontend/Backend/存储），AI 集群拓扑对比与选型。 | 45 分钟 |
| 06 | [高速互联与 RDMA 技术](/projects/ai-infra/06-rdma-highspeed-interconnect) | RDMA 原理与内核旁路机制，InfiniBand vs RoCEv2 对比，无损网络与拥塞控制（PFC/ECN/DCQCN），CCE 案例分析。 | 50 分钟 |
| 07 | [分布式并行策略](/projects/ai-infra/07-distributed-parallel-strategies) | 数据并行、张量并行、流水线并行、序列并行的原理与实现，Megatron-LM 与 DeepSpeed 框架对比，3D 并行组合策略。 | 55 分钟 |
| 08 | [ZeRO 优化器与显存优化](/projects/ai-infra/08-zero-optimizer) | ZeRO 1/2/3 三个阶段原理与显存节省分析，通信开销与显存节省的权衡，ZeRO-offload CPU offload 策略，代码级实现理解。 | 50 分钟 |
| 09 | [训练优化：Flash Attention 与计算通信重叠](/projects/ai-infra/09-training-optimization) | Flash Attention 1/2/3 演进，Ring Attention 超长序列支持，计算通信重叠技术（Domino/FLUX），梯度检查点与重计算优化。 | 50 分钟 |
| 10 | [大模型推理优化](/projects/ai-infra/10-inference-optimization) | KV Cache 原理与优化，PagedAttention 与 vLLM，Continuous Batching 调度策略，投机采样与推理加速技术全景。 | 55 分钟 |
| 11 | [Transformer 与 MoE 架构](/projects/ai-infra/11-transformer-moe) | 从标准 Transformer 到 DeepSeek MoE/MLA，GQA 与 MQA 注意力优化，MoE 架构的分布式部署挑战，Top-k 路由与负载均衡。 | 55 分钟 |
| 12 | [AI Agent 与 LLM 应用](/projects/ai-infra/12-ai-agent-llm-apps) | Agent 架构模式（ReAct/Plan-and-Execute），MCP 与 A2A 互操作协议，RAG 检索增强生成模式，从 AI Infra 到 AI Agent 的全栈视角。 | 50 分钟 |

## 配套阅读

知识空间里对应的技术长文，讲这一层为什么要这么设计。

- [AI Infra 全栈架构（2026）深度解析](/knowledge/ai/ai-infra-fullstack-architecture-2026)
- [DSpark 深度解析：DeepSeek 半自回归投机解码框架](/knowledge/ai/dspark-speculative-decoding-deep-dive)
- [Kimi K3 架构深度解析：KDA、AttnRes 与 Stable LatentMoE 的三维创新](/knowledge/ai/kimi-k3-architecture-deep-dive)
- [嵌入式 AI 部署的工程账：内存带宽、硬件亲和与低比特精度](/knowledge/ai/edge-ai-deployment-challenges)
- [XPU 精细化调度与抢占，时间片、三级模型与微秒级拆核](/knowledge/os/xpu-preemptive-scheduling)
- [AI 时代异构操作系统的新接口，四篇 2026 年 arXiv 论文拆解](/knowledge/os/ai-era-heterogeneous-os-new-interfaces-2026)

## 怎么读

建议按序读，不要跳到第 12 章的 Agent 应用。每章结尾的带宽与时延数字值得单独抄一遍，后面讲并行切分时会反复用到。想先看全景，读知识空间里的《AI Infra 全栈架构（2026）深度解析》。

> 本页由 `scripts/generate-course-indexes.mjs` 从 `courses.ts` 与章节 frontmatter 生成，章节标题与链接随内容自动更新。
