import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Binary, Box, Brain, Cpu, Monitor, Network } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getProjectCategories } from "@/lib/projects/projects";
import {
  COURSES,
  getHubMeta,
  type CourseIcon,
} from "@/lib/constants/courses";

const ICON_MAP: Record<CourseIcon, LucideIcon> = {
  cpu: Cpu,
  brain: Brain,
  circuit: Box,
  monitor: Monitor,
  box: Box,
  network: Network,
  binary: Binary,
  chip: Cpu,
};

/** 三个 hub 页共用的渲染组件，课程列表与文案全部来自 courses.ts */
export default async function CourseHubPage({ slug }: { slug: string }) {
  const hub = getHubMeta(slug);
  if (!hub) notFound();

  const categories = await getProjectCategories();
  const counts = new Map(categories.map((c) => [c.slug, c.posts.length]));

  const courses = hub.courseSlugs
    .map((courseSlug) => COURSES.find((c) => c.slug === courseSlug))
    .filter((c): c is (typeof COURSES)[number] => Boolean(c));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 pb-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Link href="/" className="hover:text-blue-500 transition-colors">
            主页
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <Link href="/projects" className="hover:text-blue-500 transition-colors">
            课程空间
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">{hub.title}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {hub.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
          {hub.description}
        </p>
        <Link href="/start" className="mt-1 w-fit text-xs text-blue-600 hover:underline dark:text-sky-400">
          不确定从哪门开始？看阅读路线图 →
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {courses.map((course) => {
          const Icon = ICON_MAP[course.icon] ?? Cpu;
          return (
            <Link
              key={course.slug}
              href={`/projects/${course.slug}`}
              className="group flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6 md:p-8 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${course.accent} shrink-0`}>
                  <Icon className={`h-7 w-7 ${course.iconColor}`} />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                    {course.title}
                  </h2>
                  <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {course.level}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm font-medium text-blue-500 group-hover:underline">
                    进入课程
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {counts.get(course.slug) ?? 0} 章
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
