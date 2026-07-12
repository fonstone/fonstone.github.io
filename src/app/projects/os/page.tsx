import Link from "next/link";
import {
  getProjectCategories,
} from "@/lib/projects/projects";
import { ArrowRight, Monitor, Binary, Cpu } from "lucide-react";

export default async function OsProjectIndexPage() {
  const categories = await getProjectCategories();
  const chcoreCat = categories.find((c) => c.slug === "chcore");
  const rustCat = categories.find((c) => c.slug === "rust-learning");
  const rustOsCat = categories.find((c) => c.slug === "rust-os");

  const courses = [
    {
      slug: "chcore",
      name: "ChCore",
      title: "ChCore 微内核操作系统课程",
      description:
        "从 ARM 汇编拆炸弹到虚拟文件系统——基于上海交通大学 IPADS 实验室 ChCore 微内核，在树莓派 3B+ 上从零构建一个功能完整的操作系统内核。",
      icon: Monitor,
      iconClassName: "bg-blue-100 dark:bg-blue-500/15",
      iconColor: "text-blue-500 dark:text-blue-300",
      count: chcoreCat?.posts.length ?? 0,
    },
    {
      slug: "rust-learning",
      name: "Rust 语言",
      title: "Rust 编程语言入门教程",
      description:
        "从零开始学习 Rust——涵盖安装环境、基础语法、所有权系统、生命周期、泛型与 trait、并发编程、错误处理、工程化实践等核心内容。",
      icon: Binary,
      iconClassName: "bg-orange-100 dark:bg-orange-500/15",
      iconColor: "text-orange-500 dark:text-orange-300",
      count: rustCat?.posts.length ?? 0,
    },
    {
      slug: "rust-os",
      name: "Rust RTOS",
      title: "从零写 Rust RTOS",
      description:
        "在 QEMU 模拟的 ARM Cortex-R52 上从零实现一个简易 RTOS——串口驱动、异常向量表、系统定时器、上下文切换、抢占式调度器、同步原语与任务间通信。",
      icon: Cpu,
      iconClassName: "bg-red-100 dark:bg-red-500/15",
      iconColor: "text-red-500 dark:text-red-300",
      count: rustOsCat?.posts.length ?? 0,
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
          <span className="text-slate-500 dark:text-slate-400">智能时代 OS</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          智能时代 OS
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
