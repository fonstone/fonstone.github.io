"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useCourseProgress } from "./CourseProgress";

export default function MarkCompleteButton({
  projectSlug,
  chapterSlug,
}: {
  projectSlug: string;
  chapterSlug: string;
}) {
  const { isCompleted, toggleCompleted } = useCourseProgress(projectSlug);
  const done = isCompleted(chapterSlug);

  return (
    <button
      onClick={() => toggleCompleted(chapterSlug)}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
        done
          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20"
          : "border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
    >
      {done ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <Circle className="w-4 h-4" />
      )}
      {done ? "已完成" : "标记为已完成"}
    </button>
  );
}
