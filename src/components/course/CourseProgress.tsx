"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PROGRESS_EVENT,
  readProgress,
  writeProgress,
} from "@/lib/courseProgress";

export function useCourseProgress(projectSlug: string) {
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => setProgress(readProgress(projectSlug));
    sync();
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [projectSlug]);

  const isCompleted = useCallback(
    (slug: string) => Boolean(progress[slug]),
    [progress]
  );

  const toggleCompleted = useCallback(
    (slug: string) => {
      setProgress((prev) => {
        const next = { ...prev, [slug]: !prev[slug] };
        writeProgress(projectSlug, next);
        return next;
      });
    },
    [projectSlug]
  );

  const completedCount = Object.values(progress).filter(Boolean).length;

  return { progress, isCompleted, toggleCompleted, completedCount };
}

export default function CourseProgressBar({
  projectSlug,
  total,
}: {
  projectSlug: string;
  total: number;
}) {
  const { completedCount } = useCourseProgress(projectSlug);
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
        {completedCount}/{total} ({pct}%)
      </span>
    </div>
  );
}
