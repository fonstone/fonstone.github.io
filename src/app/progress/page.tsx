import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import ProgressDashboard from "@/components/course/ProgressDashboard";
import { COURSES } from "@/lib/constants/courses";
import { getProjectCategories, isChapterIndex } from "@/lib/projects/projects";
import type { ProgressCourse } from "@/lib/courseProgress";

export const metadata: Metadata = {
  title: "我的学习进度",
  description:
    "汇总 8 门课程、全部可勾选章节的完成进度。记录保存在本机浏览器，可从任意章节继续学习。",
  alternates: { canonical: "/progress" },
};

export default async function ProgressPage() {
  const categories = await getProjectCategories();
  const chapterMap = new Map(
    categories.map((category) => [
      category.slug,
      category.posts.filter((post) => !isChapterIndex(post.slug)).map((post) => post.slug),
    ])
  );

  const courses: ProgressCourse[] = COURSES.filter((course) =>
    (chapterMap.get(course.slug)?.length ?? 0) > 0
  ).map((course) => ({
    slug: course.slug,
    shortTitle: course.shortTitle,
    title: course.title,
    level: course.level,
    chapters: chapterMap.get(course.slug) ?? [],
  }));

  const total = courses.reduce((sum, course) => sum + course.chapters.length, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
      <header className="mb-10 rounded-3xl border border-slate-200 bg-white/60 p-8 md:p-10 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Compass className="h-3.5 w-3.5" />
          学习仪表盘
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-slate-100">
          读到哪一层了
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          站点把 {courses.length} 门课、{total} 个可勾选章节放在同一条系统栈上。
          在每个章节页底部点「标记为已完成」，进度就会在这里汇总。记录只写进这台设备的浏览器，
          不上传、不登录，换设备不会同步。
        </p>
        <Link
          href="/start"
          className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-sky-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          回到阅读路线图
        </Link>
      </header>

      <ProgressDashboard courses={courses} />
    </main>
  );
}
