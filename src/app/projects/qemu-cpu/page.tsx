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
