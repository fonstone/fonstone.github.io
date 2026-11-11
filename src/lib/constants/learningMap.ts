/**
 * 「从哪里开始」路线图的数据源。
 *
 * LEARNING_TRACKS 把文章与课程挂到一条分层系统栈上，是站点对外主张
 * 「从内核到智能系统」的信息架构；ARTICLE_SERIES 是四条已成型的招牌系列。
 * article key 格式为 `${categorySlug}/${postSlug}`，由
 * scripts/validate-content-links.mjs 校验真实存在。
 */

export type LearningTrack = {
  id: string;
  /** 栈层序号，从底层往上 */
  step: string;
  name: string;
  subtitle: string;
  description: string;
  articleKeys: string[];
  courseSlugs: string[];
  accent: string;
};

export const LEARNING_TRACKS: LearningTrack[] = [
  {
    id: "bsp",
    step: "01",
    name: "系统启动与 BSP",
    subtitle: "Boot / BSP",
    description:
      "一台设备上电之后发生了什么。设备树怎么描述硬件，交叉编译工具链怎么把代码放到目标设备上，构建系统又如何拼出根文件系统。",
    articleKeys: [
      "os/device-tree-guide",
      "os/yocto-buildroot-embedded-linux-build-systems",
      "os/modern-cpu-performance-analysis",
    ],
    courseSlugs: ["qemu"],
    accent: "from-slate-500 to-slate-700",
  },
  {
    id: "boot",
    step: "02",
    name: "启动链与虚拟化",
    subtitle: "Boot / QEMU",
    description:
      "从第一条指令追到 Linux shell。用 QEMU 把 bootloader、内核、设备模拟逐层拆开，再顺着 RDMA 看一次数据搬运跨过多少层。",
    articleKeys: [
      "os/linux-kernel-boot-flow",
      "os/memory-barrier-deep-dive",
      "os/ultra-low-latency-research-map",
    ],
    courseSlugs: ["qemu", "rdma"],
    accent: "from-orange-500 to-amber-600",
  },
  {
    id: "kernel",
    step: "03",
    name: "内核与确定性调度",
    subtitle: "Kernel / Scheduling",
    description:
      "调度、内存屏障、WCET 与混合关键系统。这一层最容易被「平均性能」骗过去，本空间花最多篇幅处理尾延迟与确定性问题。",
    articleKeys: [
      "os/xpu-preemptive-scheduling",
      "os/mixed-criticality-scheduling",
      "os/deterministic-multicore-shared-data",
      "os/wcet-analysis-timing-verification",
    ],
    courseSlugs: ["chcore", "rust-learning", "rust-os"],
    accent: "from-cyan-500 to-blue-600",
  },
  {
    id: "edge-ai",
    step: "04",
    name: "异构计算与边缘 AI",
    subtitle: "XPU / Edge AI",
    description:
      "当 GPU、NPU 和 CPU 抢同一块内存带宽，操作系统该管什么，模型部署又该让什么。这是本空间最独特的一层。",
    articleKeys: [
      "os/ai-era-heterogeneous-os-new-interfaces-2026",
      "ai/edge-ai-deployment-challenges",
      "ai/ai-infra-fullstack-architecture-2026",
      "os/ai-era-heterogeneous-os",
    ],
    courseSlugs: ["ai-infra", "ai-agent"],
    accent: "from-blue-500 to-purple-600",
  },
  {
    id: "autonomous",
    step: "05",
    name: "自动驾驶系统栈",
    subtitle: "Automotive / Safety",
    description:
      "把上面四层放进一辆车里：AUTOSAR OS 怎么保证时序，SOME/IP 怎么传消息，ISO 26262 又怎样把失效变成可论证的约束。",
    articleKeys: [
      "autonomous-driving/autosar-os-erika3-tc38x",
      "autonomous-driving/someip-protocol-panoramic-analysis",
      "autonomous-driving/autonomous-driving-algorithm-overview",
      "autonomous-driving/qwen-drive-1.0-vlm-foundation-model",
    ],
    courseSlugs: ["autosar-functional-safety"],
    accent: "from-emerald-500 to-green-600",
  },
];

export type ArticleSeries = {
  id: string;
  name: string;
  description: string;
  /** 系列顺序，也是文章详情页「上/下一篇」的依据 */
  articleKeys: string[];
  /** 独立 MDX 系列索引文章；low-latency 的索引文章本身就在 articleKeys 里 */
  indexKey?: string;
  accent: string;
};

export const ARTICLE_SERIES: ArticleSeries[] = [
  {
    id: "low-latency",
    name: "超低时延与确定性计算",
    description:
      "8 篇 2026-10-18 同日发布的研究笔记，从尾延迟归因到光计算，用论文里的实验数字回答「确定性被什么吃掉」。唯一自带索引表的系列。",
    articleKeys: [
      "os/ultra-low-latency-research-map",
      "os/deterministic-multicore-shared-data",
      "os/latency-critical-code-cache-optimization",
      "os/mixed-criticality-scheduling",
      "os/optical-computing-100k-light-sources",
      "os/shared-resource-interference-isolation",
      "os/tail-latency-jitter-attribution",
      "os/wcet-analysis-timing-verification",
    ],
    indexKey: "os/ultra-low-latency-research-map",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    id: "sdd",
    name: "AI 编码工程化",
    description:
      "本空间最大的主题群。从 OpenSpec 规范驱动，到 Skill 知识库、Harness 工程、代码检视 Agent，再到大模型不确定性怎么落成工程约束。",
    articleKeys: [
      "ai/openspec-introduction",
      "ai/multi-agent-collaboration-sdd",
      "ai/ai-skills-guide",
      "ai/harmonyos-skill-engineering",
      "ai/harness-engineering-knowledge-base",
      "ai/ai-code-review-agents-panorama",
      "ai/open-code-review-architecture-analysis",
      "ai/llm-uncertainty-compliance-engineering",
    ],
    indexKey: "ai/ai-coding-engineering-series",
    accent: "from-violet-500 to-purple-600",
  },
  {
    id: "autonomous-model",
    name: "自动驾驶大模型与数据闭环",
    description:
      "2026-07-26 同日发布的四篇同式样综述打底，往后延伸到世界模型、VLA 与 Sim-to-Real，看感知到决策怎样被一个基础模型串起来。",
    articleKeys: [
      "autonomous-driving/bev-occupancy-end-to-end-survey",
      "autonomous-driving/data-loop-survey",
      "autonomous-driving/e2e-world-model-vla-survey",
      "autonomous-driving/sim-to-real-deployment",
      "autonomous-driving/qwen-drive-1.0-vlm-foundation-model",
      "autonomous-driving/wam-world-action-models-2026-08",
      "autonomous-driving/embodied-policy-learning-four-paths",
    ],
    indexKey: "autonomous-driving/autonomous-driving-foundation-model-series",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "ai-x-os",
    name: "AI 与系统底层的交汇",
    description:
      "站点最独特的一组：异构 OS 新接口、XPU 抢占调度、边缘部署的资源约束、LLM 当内核用。把系统底层和 AI 负载放在同一条链路上看。",
    articleKeys: [
      "os/ai-era-heterogeneous-os",
      "os/ai-era-heterogeneous-os-new-interfaces-2026",
      "os/xpu-preemptive-scheduling",
      "ai/edge-ai-deployment-challenges",
      "os/llm-driven-os-survey",
      "os/ai-agent-kernel-development",
      "os/ai-era-os-coding",
      "os/multicore-hard-realtime-core-conflict",
    ],
    indexKey: "os/ai-os-convergence-series",
    accent: "from-blue-500 to-indigo-600",
  },
];

/** 首页与 /start 共用的入口建议 */
export const START_PATH = "/start";
