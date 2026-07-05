"use client";

import { useCallback, useEffect, useState } from "react";

function getStorageKey(projectSlug: string) {
  return `course-progress-${projectSlug}`;
}

function loadProgress(projectSlug: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getStorageKey(projectSlug));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useCourseProgress(projectSlug: string) {
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setProgress(loadProgress(projectSlug));
  }, [projectSlug]);

  const isCompleted = useCallback(
    (slug: string) => Boolean(progress[slug]),
    [progress]
  );

  const toggleCompleted = useCallback(
    (slug: string) => {
      setProgress((prev) => {
        const next = { ...prev, [slug]: !prev[slug] };
        localStorage.setItem(getStorageKey(projectSlug), JSON.stringify(next));
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
