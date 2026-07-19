# RDMA 技术详解互动教程 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `courses/` 目录的 25 篇 RDMA 专栏文章转化为结构化课程，接入 Next.js 课程渲染管线

**Architecture:** 新建 `projects/rdma/` 内容目录 + `public/images/rdma/` 图片目录 + `src/app/projects/rdma/page.tsx` 课程页 + `src/app/projects/qemu-cpu/page.tsx` Hub 聚合页

**Tech Stack:** Next.js 15 App Router, TypeScript, TailwindCSS 4, gray-matter, next-mdx-remote

## Global Constraints

- 每章必须是 `.md` 文件（非 `.mdx`），含 frontmatter: title, description, date, order, tags
- 图片路径统一转换为 `/images/rdma/<hash>.ext`
- 去掉原文链接、CSDN 版权声明、专栏导航、"上一篇/下一篇"等冗余内容
- 保留所有技术性图片、代码块、表格、引用块
- 不修改已有 QEMU 课程的任何文件
- 不修改 `CourseCard`, `CourseProgress`, `ProjectMdx` 等渲染组件
- 不修改 `projects/layout.tsx` 侧边栏

---

### Task 1: 基础设施 — 图片复制与目录创建

**Files:**
- Create: `projects/rdma/` (empty dir)
- Copy: `courses/images/` → `public/images/rdma/` (200 张)
- Create: `public/images/rdma/` (if not exists)

- [ ] **Step 1: 创建目标目录并复制图片**

```bash
New-Item -ItemType Directory -Path "D:\00 Work\fonstone\fonstone.github.io\public\images\rdma" -Force
Copy-Item -LiteralPath "D:\00 Work\fonstone\fonstone.github.io\courses\images\*" -Destination "D:\00 Work\fonstone\fonstone.github.io\public\images\rdma\" -Force
```

- [ ] **Step 2: 统计确认**

```bash
Get-ChildItem -LiteralPath "D:\00 Work\fonstone\fonstone.github.io\public\images\rdma" -File | Measure-Object | Select-Object -ExpandProperty Count
```
Expected: 200（减去 favicon32.ico 之类后可接受）

---

### Task 2: 内容转换 — 25 章 RDMA 文章

**Files:**
- Create: `projects/rdma/01-rdma-overview.md`
- Create: `projects/rdma/02-socket-vs-rdma.md`
- Create: `projects/rdma/03-rdma-basics.md`
- Create: `projects/rdma/04-rdma-operations.md`
- Create: `projects/rdma/05-rdma-service-types.md`
- Create: `projects/rdma/06-memory-region.md`
- Create: `projects/rdma/07-protection-domain.md`
- Create: `projects/rdma/08-address-handle.md`
- Create: `projects/rdma/09-queue-pair.md`
- Create: `projects/rdma/10-completion-queue.md`
- Create: `projects/rdma/11-shared-receive-queue.md`
- Create: `projects/rdma/12-memory-window.md`
- Create: `projects/rdma/13-verbs-and-programming.md`
- Create: `projects/rdma/14-userspace-kernel-interaction.md`
- Create: `projects/rdma/15-roce-soft-roce.md`
- Create: `projects/rdma/16-pyverbs-python-verbs.md`
- Create: `projects/rdma/17-memory-address-basics.md`
- Create: `projects/rdma/18-queue-buffer.md`
- Create: `projects/rdma/19-userspace-mr-buffer.md`
- Create: `projects/rdma/20-iwarp-soft-iwarp.md`
- Create: `projects/rdma/21-ddp.md`
- Create: `projects/rdma/22-rdmap.md`
- Create: `projects/rdma/23-mpa.md`
- Create: `projects/rdma/24-socket-connection.md`
- Create: `projects/rdma/25-cm-connection.md`

对每篇源文件进行：
1. 添加 frontmatter 头部
2. 去掉原文链接、CSDN 版权声明、专栏导航等冗余行
3. `![](images\\xxx)` → `![](/images/rdma/xxx)`
4. `![](images/xxx)` → `![](/images/rdma/xxx)`
5. 去掉 `> 原文:` 行
6. 保留所有核心知识内容

该 Task 可分解为 5 个子任务并行执行（每批 5 章），但此处不再细分。

- [ ] **Step 1-25: 依次读取 courses/ 中各源文件，处理后写入 projects/rdma/**

对每篇转换，调用 `Read` 读源文件 → 处理内容 → `Write` 写出目标文件。

---

### Task 3: 更新 Projects Slug 映射

**Files:**
- Modify: `src/lib/projects/projects.ts:43-50`

- [ ] **Step 1: 添加 rdma 到 PROJECT_SLUG_MAP**

```typescript
const PROJECT_SLUG_MAP: Record<string, string> = {
  "chcore": "chcore",
  "qemu": "qemu",
  "rdma": "rdma",
  "autosar-functional-safety": "autosar-functional-safety",
  "ai-infra": "ai-infra",
  "rust-learning": "rust-learning",
  "rust-os": "rust-os",
};
```

---

### Task 4: 创建 RDMA 课程页

**Files:**
- Create: `src/app/projects/rdma/page.tsx`

复用 `src/app/projects/qemu/page.tsx` 模式：

```typescript
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProjectCategories,
  slugToProject,
} from "@/lib/projects/projects";
import CourseCard from "@/components/course/CourseCard";
import CourseProgressBar from "@/components/course/CourseProgress";

export const dynamicParams = false;

const PROJECT_SLUG = "rdma";

export default async function RdmaCoursePage() {
  const project = slugToProject(PROJECT_SLUG);
  const categories = await getProjectCategories();
  const current = categories.find((c) => c.slug === PROJECT_SLUG);
  if (!current) notFound();

  const chapters = current.posts;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2">
          <Link href="/projects" className="hover:text-blue-500 transition-colors">
            项目空间
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <Link href="/projects/qemu-cpu" className="hover:text-blue-500 transition-colors">
            QEMU &amp; CPU 架构
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">{project}</span>
        </nav>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            RDMA 技术详解互动教程
          </h1>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-2xl">
            从 RDMA 基本概念到三种技术实现（InfiniBand / RoCE / iWARP），从 Memory Region、Queue Pair 等核心元素到 Verbs 编程、Soft-RoCE 实验部署与 iWARP 协议栈——系统掌握远程直接内存访问技术的全栈知识体系。
          </p>

          <div className="mt-6">
            <CourseProgressBar
              projectSlug={PROJECT_SLUG}
              total={chapters.length}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {chapters.length > 0 && (
              <Link
                href={`/projects/${PROJECT_SLUG}/${chapters[0].slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                开始学习 →
              </Link>
            )}
            <span className="inline-flex items-center text-sm text-slate-400 dark:text-slate-500">
              共 {chapters.length} 章
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          课程目录
        </h2>
        {chapters.map((chapter) => (
          <CourseCard
            key={chapter.slug}
            chapter={{
              slug: chapter.slug,
              title: chapter.title,
              description: chapter.description,
              tags: chapter.tags,
              est_time: chapter.est_time,
              order: chapter.order,
            }}
            projectSlug={PROJECT_SLUG}
          />
        ))}
      </div>
    </div>
  );
}
```

---

### Task 5: 创建 QEMU+CPU Hub 聚合页

**Files:**
- Create: `src/app/projects/qemu-cpu/page.tsx`

复用 `src/app/projects/ai/page.tsx` 模式，展示 QEMU 和 RDMA 两张课程卡片：

```typescript
import Link from "next/link";
import {
  getProjectCategories,
} from "@/lib/projects/projects";
import { ArrowRight, Cpu, Network } from "lucide-react";

export default async function QemuCpuHubPage() {
  const categories = await getProjectCategories();
  const qemuCat = categories.find((c) => c.slug === "qemu");
  const rdmaCat = categories.find((c) => c.slug === "rdma");

  const courses = [
    {
      slug: "qemu",
      name: "QEMU",
      title: "QEMU & CPU 架构互动教程",
      description:
        "从 QEMU 环境搭建到虚拟化机制、启动流程、设备模拟与调试扩展——系统掌握 QEMU 全栈知识，理解 CPU 架构与系统模拟的核心原理。",
      icon: Cpu,
      iconClassName: "bg-blue-100 dark:bg-blue-500/15",
      iconColor: "text-blue-500 dark:text-blue-300",
      count: qemuCat?.posts.length ?? 0,
    },
    {
      slug: "rdma",
      name: "RDMA",
      title: "RDMA 技术详解互动教程",
      description:
        "从 RDMA 基本概念到三种技术实现（InfiniBand / RoCE / iWARP），从核心元素到 Verbs 编程、Soft-RoCE 部署与 iWARP 协议栈——系统掌握远程直接内存访问技术的全栈知识体系。",
      icon: Network,
      iconClassName: "bg-green-100 dark:bg-green-500/15",
      iconColor: "text-green-500 dark:text-green-300",
      count: rdmaCat?.posts.length ?? 0,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 pb-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Link href="/" className="hover:text-blue-500 transition-colors">
            主页
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <Link href="/projects" className="hover:text-blue-500 transition-colors">
            项目空间
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">QEMU &amp; CPU 架构</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          QEMU &amp; CPU 架构
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          选择您要学习的课程
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {courses.map((course) => (
          <Link
            key={course.slug}
            href={`/projects/${course.slug}`}
            className="group flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6 md:p-8 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`w-14 h-14 ${course.iconClassName} rounded-2xl flex items-center justify-center shrink-0`}>
                <course.icon className={`w-7 h-7 ${course.iconColor}`} />
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                {course.title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {course.description}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm font-medium text-blue-500 group-hover:underline">
                  进入课程
                </span>
                {course.count > 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {course.count} 章
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 6: 编译验证

- [ ] **Step 1: 运行 Next.js build**

```bash
cd D:\00 Work\fonstone\fonstone.github.io
pnpm build 2>&1
```
Expected: 无错误退出，rdma 和 qemu-cpu 路由正确生成。

- [ ] **Step 2: 确认静态页面生成**

检查 `.next/` 输出目录中是否包含:
- `out/projects/rdma.html` 或相应路径
- `out/projects/qemu-cpu.html`
- `out/projects/rdma/01-rdma-overview.html` (等等 25 章)
