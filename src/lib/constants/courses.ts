/**
 * 课程元数据单一数据源。
 *
 * 课程聚合页、hub 页、/start 路线图、sitemap、课程总纲脚本、文章详情页的
 * 「配套课程」全部从这里派生。新增一门课程时：
 *   1. 在 projects/ 下建目录并写章节；
 *   2. 在 COURSES 里加一条（若需要新 hub，再加 COURSE_HUBS 一条）；
 * 路由、sitemap、导航、总纲、互链均自动生成，无需改动任何 page.tsx。
 *
 * article key 格式为 `${categorySlug}/${postSlug}`，例如 "ai/ai-agent-knowledge-base"。
 * 由 scripts/validate-content-links.mjs 校验其真实存在。
 */

export type CourseLevel = "入门" | "进阶" | "深入";

export type CourseIcon =
  | "cpu"
  | "brain"
  | "circuit"
  | "monitor"
  | "box"
  | "network"
  | "binary"
  | "chip";

export type CourseMeta = {
  /** 与 projects/ 下的目录名、URL 段一致 */
  slug: string;
  /** 完整课程名，用于 <title> 与 h1 */
  title: string;
  /** 短名，用于导航、卡片、面包屑 */
  shortTitle: string;
  description: string;
  /** 所属 hub 的 slug */
  hub: string;
  /** 所属分层栈层级，见 learningMap.ts 的 LEARNING_TRACKS */
  track: string;
  level: CourseLevel;
  /** 前置要求 */
  prerequisites: string[];
  /** 学完能拿到的成果物 */
  outcomes: string[];
  /** 配套知识文章，article key 数组 */
  relatedArticles: string[];
  icon: CourseIcon;
  /** 卡片图标配色（浅色 + 深色） */
  accent: string;
  iconColor: string;
};

export type HubMeta = {
  slug: string;
  title: string;
  description: string;
  /** 该 hub 下课程的展示顺序 */
  courseSlugs: string[];
};

export const COURSE_HUBS: HubMeta[] = [
  {
    slug: "ai",
    title: "AI Infra & Agent",
    description:
      "从 GPU 互联、集合通信到推理加速，再往上到 Agent 框架与上下文工程。两层分开学，避免把基础设施问题当成提示词问题。",
    courseSlugs: ["ai-infra", "ai-agent"],
  },
  {
    slug: "os",
    title: "智能时代 OS",
    description:
      "从微内核实验、Rust 语言基础到在 QEMU 上从零写 RTOS，把「操作系统」从名词变成可以跑起来的代码。",
    courseSlugs: ["chcore", "rust-learning", "rust-os"],
  },
  {
    slug: "qemu-cpu",
    title: "QEMU & CPU 架构",
    description:
      "用模拟器把启动链路拆开看，再沿着 RDMA 追到内存与网络，理解一次数据搬运到底跨过多少层。",
    courseSlugs: ["qemu", "rdma"],
  },
];

export const COURSES: CourseMeta[] = [
  {
    slug: "ai-infra",
    title: "AI Infra 互动教程",
    shortTitle: "AI Infra",
    description:
      "从 GPU 芯片到 AI Agent，从集合通信到分布式训练与推理优化，系统拆解大模型基础设施的全栈知识：硬件架构、网络互联、并行策略、推理加速与 Agent 应用。",
    hub: "ai",
    track: "edge-ai",
    level: "进阶",
    prerequisites: ["了解基本的神经网络训练流程", "会用 Linux 命令行", "知道 TCP/IP 与进程/线程的基本概念"],
    outcomes: [
      "能读懂一张 AI 集群拓扑图并指出带宽瓶颈",
      "能解释 DP / TP / PP / ZeRO 各自省下的是什么",
      "能说清一次推理请求在显存、带宽与算力之间怎么排队",
    ],
    relatedArticles: [
      "ai/ai-infra-fullstack-architecture-2026",
      "ai/dspark-speculative-decoding-deep-dive",
      "ai/kimi-k3-architecture-deep-dive",
      "ai/edge-ai-deployment-challenges",
      "os/xpu-preemptive-scheduling",
      "os/ai-era-heterogeneous-os-new-interfaces-2026",
    ],
    icon: "cpu",
    accent: "bg-blue-100 dark:bg-blue-500/15",
    iconColor: "text-blue-500 dark:text-blue-300",
  },
  {
    slug: "ai-agent",
    title: "AI Agent 互动教程",
    shortTitle: "AI Agent",
    description:
      "从零开始构建智能体，覆盖 Agent 基础理论、LLM 核心机制、经典范式、框架开发、记忆与检索、通信协议与综合案例，最后落到可运行的毕业设计。",
    hub: "ai",
    track: "edge-ai",
    level: "入门",
    prerequisites: ["会写 Python", "调用过至少一种大模型 API", "了解 HTTP 与 JSON"],
    outcomes: [
      "从零写出一个带工具调用与记忆的 Agent",
      "说清 ReAct、规划、反思三种范式的取舍",
      "完成一个可演示的多智能体综合案例",
    ],
    relatedArticles: [
      "ai/ai-agent-knowledge-base",
      "ai/agent-best-practices",
      "ai/agent-orchestration-paradigms",
      "ai/openviking-context-database",
      "ai/skvm-language-vm-for-agent-skills",
      "ai/llm-uncertainty-compliance-engineering",
    ],
    icon: "brain",
    accent: "bg-purple-100 dark:bg-purple-500/15",
    iconColor: "text-purple-500 dark:text-purple-300",
  },
  {
    slug: "autosar-functional-safety",
    title: "AUTOSAR & 功能安全互动教程",
    shortTitle: "AUTOSAR 与功能安全",
    description:
      "从 OSEK/VDX 到 AUTOSAR OS，从 ERIKA v3 实现到 TC38x 硬件适配，再到 ISO 26262 功能安全标准与 ASIL 分解，把车载嵌入式系统的骨架与安全约束一起讲透。",
    hub: "autosar",
    track: "autonomous",
    level: "深入",
    prerequisites: ["懂 C 语言与裸机开发", "了解中断、任务与调度的基本概念", "读过至少一份芯片数据手册"],
    outcomes: [
      "能手写一个符合 OSEK 约定的任务调度表",
      "能解释 ERIKA v3 在 TC38x 上的移植取舍",
      "能独立完成一次 HARA 与 ASIL 分解推演",
    ],
    relatedArticles: [
      "autonomous-driving/autosar-os-erika3-tc38x",
      "autonomous-driving/someip-protocol-panoramic-analysis",
      "os/mixed-criticality-scheduling",
      "os/wcet-analysis-timing-verification",
      "os/deterministic-multicore-shared-data",
    ],
    icon: "circuit",
    accent: "bg-green-100 dark:bg-green-500/15",
    iconColor: "text-green-500 dark:text-green-300",
  },
  {
    slug: "chcore",
    title: "ChCore 微内核操作系统课程",
    shortTitle: "ChCore 微内核",
    description:
      "基于上海交通大学 IPADS 实验室的 ChCore 微内核，在树莓派 3B+ 上从 ARM 汇编拆炸弹一路做到虚拟文件系统，亲手构建一个功能完整的操作系统内核。",
    hub: "os",
    track: "kernel",
    level: "进阶",
    prerequisites: ["会 C 与基础 ARM 汇编", "理解虚拟内存与页表", "能用法命令行编译与调试"],
    outcomes: [
      "跑通从机器启动到用户进程的完整链路",
      "实现多核 IPC 与虚拟文件系统",
      "读懂微内核与宏内核在接口边界上的差异",
    ],
    relatedArticles: [
      "os/linux-kernel-boot-flow",
      "os/memory-barrier-deep-dive",
      "os/device-tree-guide",
      "os/ai-era-os-coding",
    ],
    icon: "monitor",
    accent: "bg-blue-100 dark:bg-blue-500/15",
    iconColor: "text-blue-500 dark:text-blue-300",
  },
  {
    slug: "qemu",
    title: "QEMU & CPU 架构互动教程",
    shortTitle: "QEMU 与 CPU",
    description:
      "从 QEMU 环境搭建到自定义板卡、OpenSBI、U-Boot、VirtIO 设备模拟、Linux 内核与根文件系统、应用移植与调试扩展，把一条完整的 RISC-V 启动链拆开看。",
    hub: "qemu-cpu",
    track: "bsp",
    level: "进阶",
    prerequisites: ["熟悉 Linux 使用与 Makefile", "了解交叉编译", "知道 bootloader 的基本职责"],
    outcomes: [
      "在 QEMU 里注册一块自己的虚拟板卡",
      "从第一条指令追到 Linux shell 起来",
      "能加一个自定义 VirtIO 设备并调试它",
    ],
    relatedArticles: [
      "os/linux-kernel-boot-flow",
      "os/device-tree-guide",
      "os/yocto-buildroot-embedded-linux-build-systems",
      "os/ai-era-heterogeneous-os",
    ],
    icon: "box",
    accent: "bg-orange-100 dark:bg-orange-500/15",
    iconColor: "text-orange-500 dark:text-orange-300",
  },
  {
    slug: "rdma",
    title: "RDMA 技术详解互动教程",
    shortTitle: "RDMA",
    description:
      "从 RDMA 基本概念与三种技术实现，到 Memory Region、Queue Pair、Completion Queue 等核心元素，再到 Verbs 编程、Soft-RoCE 实验部署与 iWARP 协议栈，完整覆盖远程直接内存访问。",
    hub: "qemu-cpu",
    track: "bsp",
    level: "深入",
    prerequisites: ["熟悉 Socket 网络编程", "理解 DMA 与虚拟内存", "能读 C 代码与内核日志"],
    outcomes: [
      "能用 Verbs 写出一次 RDMA Write 并解释每一步",
      "在 Soft-RoCE 环境里复现实验",
      "说清绕过内核到底省下了哪些开销",
    ],
    relatedArticles: [
      "os/ultra-low-latency-research-map",
      "os/tail-latency-jitter-attribution",
      "os/shared-resource-interference-isolation",
      "os/xpu-preemptive-scheduling",
      "ai/ai-infra-fullstack-architecture-2026",
    ],
    icon: "network",
    accent: "bg-green-100 dark:bg-green-500/15",
    iconColor: "text-green-500 dark:text-green-300",
  },
  {
    slug: "rust-learning",
    title: "Rust 编程语言入门教程",
    shortTitle: "Rust 语言",
    description:
      "从安装环境、基础语法到所有权系统、生命周期、泛型与 trait、并发编程、错误处理与工程化实践，用系统程序员的视角把 Rust 的核心机制过一遍。",
    hub: "os",
    track: "kernel",
    level: "入门",
    prerequisites: ["写过任意一门静态类型语言", "了解栈与堆的区别"],
    outcomes: [
      "能解释借用检查器拒绝某段代码的原因",
      "写出带泛型与 trait 约束的库",
      "用 Cargo 组织并测试一个多模块工程",
    ],
    relatedArticles: ["os/ai-era-os-coding", "os/vib-os-vibe-coding"],
    icon: "binary",
    accent: "bg-orange-100 dark:bg-orange-500/15",
    iconColor: "text-orange-500 dark:text-orange-300",
  },
  {
    slug: "rust-os",
    title: "从零写 Rust RTOS",
    shortTitle: "Rust RTOS",
    description:
      "在 QEMU 模拟的 ARM Cortex-R52 上从零实现一个简易 RTOS：串口驱动、异常向量表、系统定时器、上下文切换、抢占式调度器、同步原语与任务间通信。",
    hub: "os",
    track: "kernel",
    level: "深入",
    prerequisites: ["已掌握 Rust 所有权与 unsafe 边界", "了解 ARM 异常模型", "看懂汇编级别的上下文保存"],
    outcomes: [
      "实现可抢占的多任务调度器",
      "完成异常向量表与系统定时器驱动",
      "在 QEMU 上跑通任务间通信",
    ],
    relatedArticles: [
      "os/xpu-preemptive-scheduling",
      "os/mixed-criticality-scheduling",
      "os/deterministic-multicore-shared-data",
      "os/linux-kernel-boot-flow",
      "autonomous-driving/autosar-os-erika3-tc38x",
    ],
    icon: "chip",
    accent: "bg-red-100 dark:bg-red-500/15",
    iconColor: "text-red-500 dark:text-red-300",
  },
];

export const COURSE_SLUGS: string[] = COURSES.map((c) => c.slug);

export function getCourseMeta(slug: string): CourseMeta | undefined {
  return COURSES.find((c) => c.slug === slug);
}

export function getHubMeta(slug: string): HubMeta | undefined {
  return COURSE_HUBS.find((h) => h.slug === slug);
}

/** 文章详情页用：反查某篇文章配套了哪些课程 */
export function getRelatedCourses(articleKey: string): CourseMeta[] {
  return COURSES.filter((c) => c.relatedArticles.includes(articleKey));
}

/** 所有被课程引用的 article key，用于校验与统计 */
export function getAllRelatedArticleKeys(): string[] {
  return Array.from(new Set(COURSES.flatMap((c) => c.relatedArticles)));
}

/** 该课程应展示的配套文章链接 */
export function courseArticleHref(articleKey: string): string {
  return `/knowledge/${articleKey}`;
}

export function courseHref(slug: string): string {
  return `/projects/${slug}`;
}

/** 面包屑：课程所属 hub；AUTOSAR 目前没有独立 hub，直接归项目空间 */
export function getCourseHub(slug: string): HubMeta | undefined {
  const course = getCourseMeta(slug);
  return course ? getHubMeta(course.hub) : undefined;
}

/** hub 静态页的 metadata 对象，避免三个 page.tsx 里重复写标题与描述 */
export function hubSeo(slug: string) {
  const hub = getHubMeta(slug);
  return {
    title: hub?.title ?? "课程",
    description: hub?.description ?? "按章节组织的技术课程",
    alternates: { canonical: `/projects/${slug}` },
  };
}

/**
 * 首页「项目实战」板块的精选课程。
 * 只登记 slug 与要展示的成果物序号，文案全部取自 COURSES.outcomes，
 * 不维护第二份项目描述。
 */
export const FEATURED_HANDS_ON: Array<{ slug: string; outcomeIndex: number }> = [
  { slug: "ai-agent", outcomeIndex: 0 },
  { slug: "qemu", outcomeIndex: 0 },
  { slug: "rust-os", outcomeIndex: 0 },
  { slug: "rdma", outcomeIndex: 0 },
];

/** 课程静态页的 metadata 对象（供外部脚本或未来静态化使用） */
export function courseSeo(slug: string) {
  const course = getCourseMeta(slug);
  return {
    title: course?.title ?? "课程",
    description: course?.description ?? "按章节组织的技术课程",
    alternates: { canonical: `/projects/${slug}` },
  };
}
