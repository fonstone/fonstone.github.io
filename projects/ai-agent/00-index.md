---
title: "课程总览"
description: "AI Agent 体系化课程——从原理到实践，从构建到进化。"
date: "2026-07-29"
order: 0
tags: ["目录", "课程体系", "AI Agent"]
---

## AI Agent 体系化课程

本课程对标《深入理解 AI Agent》（bojieli/ai-agent-book）知识体系，结合工业界最佳实践，形成一套从原理到实战的全链路教程。

核心公式贯穿始终：**Agent = LLM + 上下文 + 工具**

## 课程体系

### 第一部分：基础与认知（1–4 章）

| 章节 | 对应书籍 | 核心内容 |
|------|----------|----------|
| [01. 初识智能体](01-intro-to-agents) | 第1章 | Agent 定义与演进，PEAS 模型，**Agent = LLM + 上下文 + 工具**，ReAct 循环，Harness 工程 |
| [02. 智能体发展史](02-agent-history) | 第1章（背景） | 符号主义到 LLM Agent，环境分类，智能体类型 |
| [03. 大语言模型基础](03-llm-foundations) | 第1–2章 | Transformer 架构，Tokenization，嵌入表示，**KV Cache 与上下文设计** |
| [04. 智能体范式](04-agent-paradigms) | 第1章 | ReAct、Plan-and-Solve、Reflection、工具调用、多智能体 |

### 第二部分：构建 Agent（5–7 章）

| 章节 | 对应书籍 | 核心内容 |
|------|----------|----------|
| [05. 低代码平台](05-lowcode-platforms) | — | Coze、Dify、FastGPT、n8n |
| [06. 框架实践](06-framework-practice) | — | AutoGen、AgentScope、CAMEL、LangGraph |
| [07. 构建智能体框架](07-build-agent-framework) | 第1–5章 | HelloAgents 框架实战 |

### 第三部分：核心能力深化（8–10 章）

| 章节 | 对应书籍 | 核心内容 |
|------|----------|----------|
| [08. 记忆与检索](08-memory-and-rag) | 第3章 | 用户记忆系统（三层次框架/四种存储格式/User as Code）、RAG 技术栈、混合检索、知识图谱 RAG |
| [09. 上下文工程](09-context-engineering) | 第2章 | 上下文构成、Agent 状态栏、上下文压缩、提示注入防御 |
| [10. 工具与协议](10-communication-protocols) | 第4章 | MCP 协议、工具分类（感知/执行/协作/事件/沟通）、事件驱动架构 |

### 第四部分：进阶能力（11–13 章）

| 章节 | 对应书籍 | 核心内容 |
|------|----------|----------|
| [11. Agentic-RL](11-agentic-rl) | 第7章 | 预训练-SFT-RL 三阶段、**SFT 记忆 vs RL 泛化**、GRPO、RLVP |
| [12. 智能体评估](12-agent-evaluation) | 第6章 | 评估环境（工具调用型/人机交互型）、LLM-as-a-Judge、Rubric 四准则、统计显著性 |
| [13. Coding Agent](18-coding-agent) | 第5章 | 七个核心工具、OpenClaw 架构、Sessionless、提议者-审核者、安全 |

### 第五部分：进化与协作（14–16 章）

| 章节 | 对应书籍 | 核心内容 |
|------|----------|----------|
| [14. 持续进化](20-continuous-evolution) | 第8章 | 四种更新方式（知识/指令/程序/参数）、验证-发布-回滚、双循环 |
| [15. 多模态与实时交互](21-multimodal-realtime) | 第9章 | 语音三种范式、Computer Use、VLA 机器人、快慢思考架构 |
| [16. 多 Agent 协作](22-multi-agent-collaboration) | 第10章 | 协作分类框架、三种拓扑、失败模式、Agent 社会 |

### 第六部分：项目实战（17–22 章）

| 章节 | 内容 |
|------|------|
| [17. 智能旅行助手](13-travel-assistant) | 构建端到端旅行规划 Agent |
| [18. 深度研究助手](14-deep-research-agent) | 构建自主调研 Agent |
| [19. 赛博小镇](15-cyber-town) | 多 Agent 社会模拟 |
| [20. 毕业设计](16-capstone) | 综合项目指南 |

## 知识体系全景

```
┌─────────────────────────────────────────────────────┐
│                    AI Agent                          │
│              Agent = LLM + 上下文 + 工具             │
├──────────┬──────────┬──────────┬──────────┬──────────┤
│  构建    │  评估    │  进化    │  交互    │  协作    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 上下文   │ 评估环境 │ 知识沉淀 │ 语音     │ 共享上下 │
│ 工程     │ 数据集   │ 指令学习 │ Computer │ 文协作   │
│ 工具设计 │ LLM作为  │ 程序固化 │  Use     │ 对等协作 │
│ 记忆与   │ 评委     │ 参数更新 │ VLA 机器│ 管理者编 │
│ 知识库   │ Rubric   │ 验证回滚 │ 人控制   │ 排       │
│ Coding   │ 统计显著│          │          │ 去中心化 │
│  Agent   │ 性       │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

## 课程特色

![Agent 核心公式](/images/courses/ai-agent/fig0-1.svg)
*图 0-1: Agent = LLM + 上下文 + 工具*

![全书结构](/images/courses/ai-agent/fig0-2.svg)
*图 0-2: 全书结构——构建、评估与进化、交互与协作*

本课程全程引用《深入理解 AI Agent》开源书籍（Apache 2.0 许可证）的核心框架与配图，覆盖设计原理与工程实践的双重要求。
