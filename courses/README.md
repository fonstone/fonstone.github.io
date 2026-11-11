# courses/ 原始素材归档

这个目录保存抓取与改编过程中的原始稿件，**不参与站点渲染**。`src/lib/projects/projects.ts` 只扫描 `projects/`，`src/lib/knowledge/knowledge.ts` 只扫描 `content/`。站点上的内容以这两个目录为准。

| 目录 / 文件 | 状态 | 站点上的对应内容 |
| --- | --- | --- |
| `README.md` | 本说明 | 无 |
| `scrape_rdma.py` | 抓取脚本，仅供回溯来源 | 无 |
| `hello-agents-all-chapters-merged.md` | 《Hello Agents》全书合并稿，约 1.35 MB，保留作溯源 | `projects/ai-agent/` 23 章 |
| `chcore/` 6 篇 | 与 `projects/chcore/` 6 章逐字重复 | `projects/chcore/` |
| `chcore/chcore-microkernel-os.md` | 840 行课程全解析，是唯一没有搬进 `projects/` 的总纲，保留 | 无 |
| `autosar-os/` 7 篇 | 与 `projects/autosar-functional-safety/` 前 7 篇内容接近，保留作对照 | `projects/autosar-functional-safety/` |

RDMA 专栏的 25 篇完整正文已迁到 `projects/rdma/`，下表链接指向迁移后的文件。原抓取文件名带空格与中文，已统一改为 `NN-slug.md`。原文链接保留，便于核对来源与许可。

| # | 标题 | 迁移后文件 | 原文 |
|---|------|-----------|------|
| 00 | 专栏索引 | [课程总纲](../projects/rdma/00-index.md) | [知乎](https://zhuanlan.zhihu.com/p/164908617) |
| 01 | 技术详解（一）RDMA 概述 | [01-rdma-overview.md](../projects/rdma/01-rdma-overview.md) | [知乎](https://zhuanlan.zhihu.com/p/138874738) |
| 02 | 比较基于 Socket 与 RDMA 的通信 | [02-socket-vs-rdma.md](../projects/rdma/02-socket-vs-rdma.md) | [知乎](https://zhuanlan.zhihu.com/p/139548242) |
| 03 | RDMA 基本元素和编程基础 | [03-rdma-basics.md](../projects/rdma/03-rdma-basics.md) | [知乎](https://zhuanlan.zhihu.com/p/141267386) |
| 04 | RDMA 操作类型 WRITE / READ | [04-rdma-operations.md](../projects/rdma/04-rdma-operations.md) | [知乎](https://zhuanlan.zhihu.com/p/142175657) |
| 05 | RDMA 基本服务类型 | [05-rdma-service-types.md](../projects/rdma/05-rdma-service-types.md) | [知乎](https://zhuanlan.zhihu.com/p/144099636) |
| 06 | RDMA 之 Memory Region | [06-memory-region.md](../projects/rdma/06-memory-region.md) | [知乎](https://zhuanlan.zhihu.com/p/156975042) |
| 07 | RDMA 之 Protection Domain | [07-protection-domain.md](../projects/rdma/07-protection-domain.md) | [知乎](https://zhuanlan.zhihu.com/p/159493100) |
| 08 | RDMA 之 Address Handle | [08-address-handle.md](../projects/rdma/08-address-handle.md) | [知乎](https://zhuanlan.zhihu.com/p/163552044) |
| 09 | RDMA 之 Queue Pair | [09-queue-pair.md](../projects/rdma/09-queue-pair.md) | [知乎](https://zhuanlan.zhihu.com/p/195757767) |
| 10 | RDMA 之 Completion Queue | [10-completion-queue.md](../projects/rdma/10-completion-queue.md) | [知乎](https://zhuanlan.zhihu.com/p/259650980) |
| 11 | RDMA 之 Shared Receive Queue | [11-shared-receive-queue.md](../projects/rdma/11-shared-receive-queue.md) | [知乎](https://zhuanlan.zhihu.com/p/279904125) |
| 12 | RDMA 之 Memory Window | [12-memory-window.md](../projects/rdma/12-memory-window.md) | [知乎](https://zhuanlan.zhihu.com/p/353590347) |
| 13 | RDMA 之 Verbs 和编程步骤 | [13-verbs-and-programming.md](../projects/rdma/13-verbs-and-programming.md) | [知乎](https://zhuanlan.zhihu.com/p/329198771) |
| 14 | RDMA 之用户态与内核态交互 | [14-userspace-kernel-interaction.md](../projects/rdma/14-userspace-kernel-interaction.md) | [知乎](https://zhuanlan.zhihu.com/p/346708569) |
| 15 | RDMA 之 RoCE 与 Soft-RoCE | [15-roce-soft-roce.md](../projects/rdma/15-roce-soft-roce.md) | [知乎](https://zhuanlan.zhihu.com/p/361740115) |
| 16 | Pyverbs Python Verbs | [16-pyverbs-python-verbs.md](../projects/rdma/16-pyverbs-python-verbs.md) | [知乎](https://zhuanlan.zhihu.com/p/455174484) |
| 17 | 内存地址基础知识 | [17-memory-address-basics.md](../projects/rdma/17-memory-address-basics.md) | [知乎](https://zhuanlan.zhihu.com/p/463199854) |
| 18 | Queue Buffer | [18-queue-buffer.md](../projects/rdma/18-queue-buffer.md) | [知乎](https://zhuanlan.zhihu.com/p/565736840) |
| 19 | 用户态 Memory Region Buffer | [19-userspace-mr-buffer.md](../projects/rdma/19-userspace-mr-buffer.md) | [知乎](https://zhuanlan.zhihu.com/p/642286038) |
| 20 | RDMA 之 iWARP 与 Soft-iWARP | [20-iwarp-soft-iwarp.md](../projects/rdma/20-iwarp-soft-iwarp.md) | [知乎](https://zhuanlan.zhihu.com/p/449189540) |
| 21 | iWARP 之 DDP | [21-ddp.md](../projects/rdma/21-ddp.md) | [知乎](https://zhuanlan.zhihu.com/p/408817872) |
| 22 | iWARP 之 RDMAP | [22-rdmap.md](../projects/rdma/22-rdmap.md) | [知乎](https://zhuanlan.zhihu.com/p/421211722) |
| 23 | iWARP 之 MPA | [23-mpa.md](../projects/rdma/23-mpa.md) | [知乎](https://zhuanlan.zhihu.com/p/435467605) |
| 24 | Socket 建链 | [24-socket-connection.md](../projects/rdma/24-socket-connection.md) | [知乎](https://zhuanlan.zhihu.com/p/476407641) |
| 25 | CM 建链 | [25-cm-connection.md](../projects/rdma/25-cm-connection.md) | [知乎](https://zhuanlan.zhihu.com/p/494826608) |

来源为知乎专栏《RDMA杂谈》，因知乎 403 从 CSDN / 博客园镜像补齐，运行 `python scrape_rdma.py` 可重新抓取。课程层面的字段规范、来源标注与更新约定见 `docs/course-guide.md`。
