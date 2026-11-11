"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, GraduationCap, RotateCcw, Sparkles } from "lucide-react";
import {
  PROGRESS_EVENT,
  clearProgress,
  computeProgress,
  type CourseProgressState,
  type ProgressCourse,
} from "@/lib/courseProgress";

export default function ProgressDashboard({ courses }: { courses: ProgressCourse[] }) {
  const [states, setStates] = useState<CourseProgressState[]>([]);
  const [mounted, setMounted] = useState(false);

  const sync = useCallback(() => {
    setStates(computeProgress(courses));
    setMounted(true);
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

  const totalDone = states.reduce((sum, s) => sum + s.done, 0);
  const totalChapters = states.reduce((sum, s) => sum + s.total, 0);
  const percent = totalChapters > 0 ? Math.round((totalDone / totalChapters) * 100) : 0;

  const continuing = useMemo(() => {
    const inProgress = states.find((s) => s.done > 0 && s.nextChapter);
    if (inProgress?.nextChapter) {
      return { href: `/projects/${inProgress.slug}/${inProgress.nextChapter}`, label: "继续上次的学习" };
    }
    const first = states.find((s) => s.firstChapter);
    if (first?.firstChapter) {
      return { href: `/projects/${first.slug}/${first.firstChapter}`, label: "从第一章开始" };
    }
    return null;
  }, [states]);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  const resetOne = (slug: string) => {
    clearProgress([slug]);
    sync();
  };

  const resetAll = () => {
    if (!window.confirm("确定清空全部课程的学习进度？此操作只影响本机浏览器记录。")) return;
    clearProgress(courses.map((c) => c.slug));
    sync();
  };

  return (
    <>
      <section className="mb-10 grid grid-cols-1 gap-5 rounded-3xl border border-slate-200 bg-white/70 p-6 md:grid-cols-[180px,1fr] md:items-center md:p-8 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-center justify-center">
          <div className="relative h-36 w-36">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-slate-200 dark:stroke-slate-800" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                stroke="url(#progressGradient)"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {mounted ? percent : 0}%
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">总进度</span>
            </div>
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-sky-400">
            <Sparkles className="h-3.5 w-3.5" />
            本机学习档案
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            已完成 {mounted ? totalDone : 0} / {totalChapters} 个章节
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            每门课共 {courses.length} 门、{totalChapters} 章。章节页底部的「标记为已完成」会写进浏览器本地存储，
            这里把 8 门课的进度汇总到一处，换页面回来也能接着读。数据只存在这台设备上。
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {continuing && (
              <Link
                href={continuing.href}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-cyan-600 transition-colors"
              >
                <GraduationCap className="h-4 w-4" />
                {continuing.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {totalDone > 0 && (
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-500 hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:text-slate-400 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                清空进度
              </button>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">各门课程</h2>
          <Link href="/projects" className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400">
            课程总览 →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {courses.map((course) => {
            const state = states.find((s) => s.slug === course.slug);
            const done = state?.done ?? 0;
            const pct = state?.percent ?? 0;
            const chapter = state?.nextChapter ?? state?.firstChapter;
            return (
              <div
                key={course.slug}
                className="rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${course.slug}`}
                      className="font-medium text-slate-800 hover:text-blue-600 dark:text-slate-100 dark:hover:text-sky-400"
                    >
                      {course.shortTitle}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      {course.level} · {course.chapters.length} 章
                    </p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                    {done}/{course.chapters.length}
                  </span>
                </div>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-cyan-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  {chapter && (
                    <Link
                      href={`/projects/${course.slug}/${chapter}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-sky-400"
                    >
                      {done > 0 && pct < 100 ? "继续下一章" : done > 0 ? "回顾课程" : "开始第一章"}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                  {pct === 100 && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] text-green-600 dark:bg-green-500/10 dark:text-green-300">
                      已结课
                    </span>
                  )}
                  {done > 0 && (
                    <button
                      type="button"
                      onClick={() => resetOne(course.slug)}
                      className="ml-auto text-[11px] text-slate-400 hover:text-red-500 dark:text-slate-500"
                    >
                      重置本课
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
