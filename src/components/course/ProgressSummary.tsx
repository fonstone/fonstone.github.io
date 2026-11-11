"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ListChecks } from "lucide-react";
import {
  PROGRESS_EVENT,
  computeProgress,
  type ProgressCourse,
} from "@/lib/courseProgress";

/** 首页的学习进度摘要，与 /progress 仪表盘读同一份 localStorage */
export default function ProgressSummary({ courses }: { courses: ProgressCourse[] }) {
  const [counts, setCounts] = useState({ done: 0, total: 0 });

  const sync = useCallback(() => {
    const states = computeProgress(courses);
    setCounts({
      done: states.reduce((sum, s) => sum + s.done, 0),
      total: states.reduce((sum, s) => sum + s.total, 0),
    });
  }, [courses]);

  useEffect(() => {
    sync();
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, [sync]);

  const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <ListChecks className="h-4 w-4 text-emerald-500" />
        我的学习进度
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {counts.done > 0
          ? `已完成 ${counts.done} / ${counts.total} 个章节，继续往下读。`
          : `还没有勾选过章节。${courses.length} 门课、${counts.total} 章，读完后在章节页底部打个勾。`}
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <Link
        href="/progress"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:gap-2 transition-all dark:text-sky-400"
      >
        打开学习仪表盘
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
