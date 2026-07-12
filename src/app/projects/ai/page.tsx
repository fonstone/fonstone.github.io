import Link from "next/link";
import {
  getProjectCategories,
} from "@/lib/projects/projects";
import { ArrowRight, Brain, Cpu } from "lucide-react";

export default async function AiProjectIndexPage() {
  const categories = await getProjectCategories();
  const aiInfraCat = categories.find((c) => c.slug === "ai-infra");
  const aiAgentCat = categories.find((c) => c.slug === "ai-agent");

  const courses = [
    {
      slug: "ai-infra",
      name: "AI Infra",
      title: "AI Infra 互动教程",
      description:
        "从 GPU 芯片到 AI Agent，从集合通信到分布式训练与推理优化——系统掌握大模型基础设施全栈知识体系。",
      icon: Cpu,
      iconClassName: "bg-blue-100 dark:bg-blue-500/15",
      iconColor: "text-blue-500 dark:text-blue-300",
      count: aiInfraCat?.posts.length ?? 0,
    },
    {
      slug: "ai-agent",
      name: "AI Agent",
      title: "AI Agent 互动教程",
      description:
        "从零开始构建智能体——涵盖 Agent 基础理论、LLM 核心、经典范式、框架开发、记忆与检索、通信协议与综合案例，系统掌握多智能体全栈知识体系。",
      icon: Brain,
      iconClassName: "bg-purple-100 dark:bg-purple-500/15",
      iconColor: "text-purple-500 dark:text-purple-300",
      count: aiAgentCat?.posts.length ?? 0,
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
          <span className="text-slate-500 dark:text-slate-400">AI Infra &amp; Agent</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          AI Infra &amp; Agent
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
