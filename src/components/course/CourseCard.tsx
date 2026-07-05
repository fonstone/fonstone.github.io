"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { useCourseProgress } from "./CourseProgress";

export type CourseCardChapter = {
  slug: string;
  title: string;
  description?: string;
  tags: string[];
  est_time?: string;
  order: number;
};

export default function CourseCard({
  chapter,
  projectSlug,
}: {
  chapter: CourseCardChapter;
  projectSlug: string;
}) {
  const { isCompleted } = useCourseProgress(projectSlug);
  const done = isCompleted(chapter.slug);

  return (
    <Link
      href={`/projects/${projectSlug}/${chapter.slug}`}
      className="group relative flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-full tabular-nums shrink-0">
            {String(chapter.order).padStart(2, "0")}
          </span>
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
            {chapter.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {chapter.est_time && (
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
              ⏱ {chapter.est_time}
            </span>
          )}
          {done ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
          )}
        </div>
      </div>

      {chapter.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 ml-11">
          {chapter.description}
        </p>
      )}

      {chapter.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 ml-11">
          {chapter.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs text-slate-400 dark:text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
