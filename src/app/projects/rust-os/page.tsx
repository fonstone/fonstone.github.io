import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProjectCategories,
  slugToProject,
} from "@/lib/projects/projects";
import CourseCard from "@/components/course/CourseCard";
import CourseProgressBar from "@/components/course/CourseProgress";

export const dynamicParams = false;

const PROJECT_SLUG = "rust-os";

export default async function RustOsCoursePage() {
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
          <Link href="/projects/os" className="hover:text-blue-500 transition-colors">
            智能时代 OS
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">{project}</span>
        </nav>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            从零写 Rust RTOS
          </h1>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-2xl">
            在 QEMU 模拟的 ARM Cortex-R52 上从零实现一个简易 RTOS——串口驱动、异常向量表、
            系统定时器、上下文切换、抢占式调度器、同步原语与任务间通信。
            基于雪云飞星 Rust RTOS 教程。
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
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
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
