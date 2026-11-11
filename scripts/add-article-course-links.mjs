/**
 * 给同题知识文章追加「配套课程」段落，打通 content ↔ projects 的内容层互链。
 * 幂等：靠正文里的 MDX 表达式注释标记判断是否已追加。
 * 注意：.mdx 由 MDXRemote 按 mdx 格式编译，HTML 注释会触发
 * "Unexpected character ! before name"，必须用 MDX 表达式注释。
 * 用法：node scripts/add-article-course-links.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = "{/* course-crosslink */}";
const LEGACY_MARKER = "<!-- course-crosslink -->";

const ENTRIES = [
  {
    file: "content/自动驾驶 & 具身智能/autosar-os-erika3-tc38x.mdx",
    body: `## 配套课程

上面拆的是 ERIKA3 在 TC38x 上的源码实现。要把 OSEK 任务调度、ISR 与资源锁自己配一遍，[《AUTOSAR & 功能安全互动教程》](/projects/autosar-functional-safety) 用 12 章从 OSEK/VDX 一路做到 ISO 26262 的 ASIL 分解。车载以太网这一层可接着读 [SOME/IP 协议全景解析](/knowledge/autonomous-driving/someip-protocol-panoramic-analysis)。`,
  },
  {
    file: "content/AI/ai-agent-knowledge-base.mdx",
    body: `## 配套课程

这篇是知识点的横向铺开，[《AI Agent 互动教程》](/projects/ai-agent) 是同一套体系的纵向动手版：23 章从 LLM 核心机制排到框架开发、记忆检索、通信协议，最后落到一个可运行的毕业设计。想先看工程约束再决定怎么搭，可接 [大模型的不确定性与遵从性，怎么落到工程约束](/knowledge/ai/llm-uncertainty-compliance-engineering)。`,
  },
  {
    file: "content/AI/ai-infra-fullstack-architecture-2026.mdx",
    body: `## 配套课程

架构图讲的是「有哪些层」，[《AI Infra 互动教程》](/projects/ai-infra) 逐层拆「每层怎么算」：12 章覆盖 GPU 互联、集合通信、并行策略、ZeRO 与推理加速。网络这一层如果要追到内存语义，继续走 [《RDMA 技术详解互动教程》](/projects/rdma)。`,
  },
  {
    file: "content/OS/ultra-low-latency-research-map.mdx",
    body: `## 配套课程

这七条研究主线里，「绕过内核能省下什么」有可复现的实验路径：[《RDMA 技术详解互动教程》](/projects/rdma) 从 Memory Region 与 Queue Pair 讲到 Verbs 编程和 Soft-RoCE 部署。调度侧的对应实验在 [《从零写 Rust RTOS》](/projects/rust-os)，直接实现抢占式调度器。`,
  },
  {
    file: "content/OS/xpu-preemptive-scheduling.mdx",
    body: `## 配套课程

时间片、抢占粒度这些数字，在 [《从零写 Rust RTOS》](/projects/rust-os) 里对应一个可运行的抢占式调度器实现；集群侧的同一套排队问题，[《AI Infra 互动教程》](/projects/ai-infra) 从集合通信与并行策略的角度再算一遍。`,
  },
  {
    file: "content/OS/linux-kernel-boot-flow.mdx",
    body: `## 配套课程

启动流程的每一段都能在模拟器里单步验证：[《QEMU & CPU 架构互动教程》](/projects/qemu) 从注册一块自定义虚拟板卡开始，经 OpenSBI、U-Boot、VirtIO 一路走到 Linux shell。设备树描述硬件的写法见 [Linux 设备树详解](/knowledge/os/device-tree-guide)。`,
  },
  {
    file: "content/OS/device-tree-guide.mdx",
    body: `## 配套课程

DTS 写完之后要在真实启动链里验证，[《QEMU & CPU 架构互动教程》](/projects/qemu) 第 1 章就注册了一块自定义 Quard-Star 板卡并添加串口与中断控制器。启动链全景可对照 [Linux 内核启动流程分析](/knowledge/os/linux-kernel-boot-flow)。`,
  },
  {
    file: "content/AI/edge-ai-deployment-challenges.mdx",
    body: `## 配套课程

内存带宽与低比特精度的账，放大到集群就是另一套问题：[《AI Infra 互动教程》](/projects/ai-infra) 覆盖 GPU 互联、推理加速与并行策略。异构设备上操作系统该管什么，见 [AI 时代异构操作系统的新接口，四篇 2026 年 arXiv 论文拆解](/knowledge/os/ai-era-heterogeneous-os-new-interfaces-2026)。`,
  },
];

let added = 0;
let skipped = 0;
for (const entry of ENTRIES) {
  const full = path.join(ROOT, entry.file);
  if (!fs.existsSync(full)) {
    console.error(`文件不存在: ${entry.file}`);
    process.exitCode = 1;
    continue;
  }
  let raw = fs.readFileSync(full, "utf8");
  if (raw.includes(LEGACY_MARKER)) {
    // 迁移早期版本写入的 HTML 注释，MDX 编译会报错
    raw = raw.replace(LEGACY_MARKER, MARKER);
    fs.writeFileSync(full, raw, "utf8");
  }
  if (raw.includes(MARKER)) {
    skipped++;
    continue;
  }
  const trimmed = raw.replace(/\s*$/, "");
  fs.writeFileSync(full, `${trimmed}\n\n---\n\n${MARKER}\n\n${entry.body}\n`, "utf8");
  added++;
  console.log(`+ ${entry.file}`);
}

console.log(`\n新增 ${added} 篇，跳过 ${skipped} 篇（已存在标记）`);
