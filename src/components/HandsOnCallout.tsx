import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { getRelatedCourses } from "@/lib/constants/courses";

/**
 * 文章页顶部：把原理文章导向一门能动手做出东西的课程。
 * 关联关系由 courses.ts 的 relatedArticles 反查，没有配套课程时不渲染。
 */
export default function HandsOnCallout({ articleKey }: { articleKey: string }) {
  const course = getRelatedCourses(articleKey)[0];
  if (!course) return null;

  return (
    <aside className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/50 px-5 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        <Wrench className="h-4 w-4" />
        配套实战
      </div>
      <p className="min-w-[12rem] flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        《{course.shortTitle}》里的动手目标：{course.outcomes[0]}
      </p>
      <Link
        href={`/projects/${course.slug}`}
        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10 transition-colors"
      >
        去看课程 <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </aside>
  );
}
