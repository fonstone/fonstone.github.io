# RDMA 技术详解互动教程 — 设计文档

## 概述

将 `courses/` 目录中的 25 篇 RDMA 专栏文章（作者 Savir，原载知乎）整理为结构化的课程，接入 Next.js 课程渲染管线，与现有 QEMU 课程并列于"QEMU & CPU 架构"域下。

## 结构

```
/projects/qemu-cpu                    ← Hub 页面（聚合入口）
  ├── /projects/qemu                   ← 已有 QEMU 课程（不变）
  └── /projects/rdma                   ← 新 RDMA 课程
```

## 课程元数据格式

每章一个 `.md` 文件（非 `.mdx`，纯 Markdown），使用 frontmatter：

```yaml
---
title: "章节标题"
description: "简短描述"
date: "2026-07-19"
order: <int>
tags: ["RDMA", ...]
---
```

## 章节清单（三大篇，25 章）

### 一、基本概念篇（order 1-12）

| order | 原标题 | 文件名 |
|-------|--------|--------|
| 1 | RDMA 概述 | 01-rdma-overview |
| 2 | 比较基于 Socket 与 RDMA 的通信 | 02-socket-vs-rdma |
| 3 | RDMA 基本元素和编程基础 | 03-rdma-basics |
| 4 | RDMA 操作类型——WRITE/READ | 04-rdma-operations |
| 5 | RDMA 基本服务类型 | 05-rdma-service-types |
| 6 | RDMA 之 Memory Region | 06-memory-region |
| 7 | RDMA 之 Protection Domain | 07-protection-domain |
| 8 | RDMA 之 Address Handle | 08-address-handle |
| 9 | RDMA 之 Queue Pair | 09-queue-pair |
| 10 | RDMA 之 Completion Queue | 10-completion-queue |
| 11 | RDMA 之 Shared Receive Queue | 11-shared-receive-queue |
| 12 | RDMA 之 Memory Window | 12-memory-window |

### 二、RDMA 软件栈篇（order 13-19）

| order | 原标题 | 文件名 |
|-------|--------|--------|
| 13 | RDMA 之 Verbs 和编程步骤 | 13-verbs-and-programming |
| 14 | RDMA 之用户态与内核态交互 | 14-userspace-kernel-interaction |
| 15 | RDMA 之 RoCE & Soft-RoCE | 15-roce-soft-roce |
| 16 | Pyverbs（Python Verbs） | 16-pyverbs-python-verbs |
| 17 | 内存地址基础知识 | 17-memory-address-basics |
| 18 | Queue Buffer | 18-queue-buffer |
| 19 | 用户态 Memory Region Buffer | 19-userspace-mr-buffer |

### 三、协议详解篇（order 20-25）

| order | 原标题 | 文件名 |
|-------|--------|--------|
| 20 | RDMA 之 iWARP & Soft-iWARP | 20-iwarp-soft-iwarp |
| 21 | RDMA 之 DDP（Direct Data Placement） | 21-ddp |
| 22 | iWARP 之 RDMAP | 22-rdmap |
| 23 | iWARP 之 MPA | 23-mpa |
| 24 | Socket 建链 | 24-socket-connection |
| 25 | CM 建链 | 25-cm-connection |

## 图片处理

- 源：`courses/images/`（200 张，哈希命名 `*.png`/`*.jpeg`/`*.ico`）
- 目标：`public/images/rdma/`
- 引用转换：`![](images\\xxx)` → `![](/images/rdma/xxx)`
- favicon32.ico 不需要复制

## Hub 页面（/projects/qemu-cpu）

- 位置：`src/app/projects/qemu-cpu/page.tsx`
- 复用 `/projects/ai` 的代码模式
- 双卡片：QEMU 课程（固定） + RDMA 课程（动态）
- 侧边栏：QEMU 和 RDMA 作为独立项目显示

## RDMA 课程页（/projects/rdma）

- 位置：`src/app/projects/rdma/page.tsx`
- 复用 `/projects/qemu` 的代码模式
- 进度条 + 章节卡片列表

## 内容处理原则

1. 每章添加 frontmatter（title, description, date, order, tags）
2. 去掉原文链接、广告、CSDN 版权声明等冗余信息
3. 保留所有技术图片和核心知识内容
4. 修正图片引用路径
5. 保留代码块和表格
6. 去掉专栏导航链接（"下一篇"、"上一章"等）

## 进度跟踪

通过现有的 `useCourseProgress(projectSlug)` localStorage 机制自动生效。

## 不修改的内容

- 现有的 QEMU 课程（`projects/qemu/`）不作任何修改
- 课程渲染组件（`CourseCard`, `CourseProgress`, `ProjectMdx`）不作修改
- 侧边栏布局（`projects/layout.tsx`）不作修改
