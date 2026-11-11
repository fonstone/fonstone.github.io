"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, Layers3 } from "lucide-react";
import type { StackTrackData } from "@/lib/learningMapData";

type Props = {
  tracks: StackTrackData[];
  variant?: "full" | "compact";
  /** 默认展开的层，站点最独特的一层 */
  initialId?: string;
};

/** 把「从内核到智能系统」做成可点击的信息架构：层数与链接全部由内容目录派生 */
export default function SystemStack({
  tracks,
  variant = "full",
  initialId = "edge-ai",
}: Props) {
  const [activeId, setActiveId] = useState(
    tracks.some((t) => t.id === initialId) ? initialId : tracks[0]?.id
  );

  const activeIndex = Math.max(
    0,
    tracks.findIndex((t) => t.id === activeId)
  );
  const active = tracks[activeIndex];

  const stats = useMemo(() => {
    const articles = new Set<string>();
    const courses = new Set<string>();
    let chapters = 0;
    for (const track of tracks) {
      for (const article of track.articles) articles.add(article.key);
      for (const course of track.courses) {
        courses.add(course.slug);
        chapters += course.chapterCount;
      }
    }
    return { articles: articles.size, courses: courses.size, chapters };
  }, [tracks]);

  if (!active) return null;

  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % tracks.length;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + tracks.length) % tracks.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tracks.length - 1;
    setActiveId(tracks[next].id);
    document.getElementById(`stack-tab-${tracks[next].id}`)?.focus();
  };

  const displayedArticles = variant === "compact" ? active.articles.slice(0, 3) : active.articles;
  const displayedCourses = variant === "compact" ? active.courses.slice(0, 2) : active.courses;
  const chapterTotal = active.courses.reduce((sum, c) => sum + c.chapterCount, 0);

  return (
    <div>
      {variant === "full" && (
        <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Layers3 className="h-3.5 w-3.5 text-blue-500" />
            点击任一层查看文章与课程
          </span>
          <span>全栈覆盖 {stats.articles} 篇长文</span>
          <span>{stats.courses} 门课</span>
          <span>{stats.chapters} 个章节</span>
        </div>
      )}

      <div className={variant === "compact" ? "grid gap-5 md:grid-cols-[240px,1fr]" : "grid gap-5 lg:grid-cols-[280px,1fr]"}>
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label="五层系统栈"
          className={
            variant === "compact"
              ? "flex flex-col gap-1.5"
              : "flex flex-col gap-2"
          }
        >
          {[...tracks].reverse().map((track) => {
            const selected = track.id === active.id;
            const index = tracks.findIndex((t) => t.id === track.id);
            return (
              <button
                key={track.id}
                id={`stack-tab-${track.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="stack-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(track.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 text-left transition-all cursor-pointer ${
                  variant === "compact" ? "py-2" : "py-3"
                } ${
                  selected
                    ? "border-blue-400 bg-blue-50/80 shadow-sm dark:border-blue-500/60 dark:bg-blue-500/10"
                    : "border-slate-200 bg-white/60 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-blue-500/50"
                }`}
              >
                <span className={`h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${track.accent}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[11px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                      {track.step}
                    </span>
                    <span
                      className={`truncate text-sm font-medium ${
                        selected
                          ? "text-blue-700 dark:text-sky-300"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {track.name}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {track.subtitle}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                  {track.articles.length + track.courses.length}
                </span>
              </button>
            );
          })}
        </div>

        <div
          id="stack-panel"
          role="tabpanel"
          aria-labelledby={`stack-tab-${active.id}`}
          className="rounded-2xl border border-slate-200 bg-white/70 p-5 md:p-6 dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${active.accent} text-xs font-bold text-white`}>
                  {active.step}
                </span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {active.name}
                </h3>
              </div>
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {active.description}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {active.articles.length} 篇 · {active.courses.length} 门 · {chapterTotal} 章
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <BookOpen className="h-3.5 w-3.5" />
                先读这些
              </p>
              <ul className="flex flex-col gap-1">
                {displayedArticles.map((article) => (
                  <li key={article.key}>
                    <Link
                      href={article.href}
                      className="group flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs leading-snug text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300 group-hover:bg-blue-500 dark:bg-slate-600" />
                      <span className="line-clamp-2">{article.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <GraduationCap className="h-3.5 w-3.5" />
                再动手做
              </p>
              <div className="flex flex-col gap-1.5">
                {displayedCourses.map((course) => (
                  <Link
                    key={course.slug}
                    href={`/projects/${course.slug}`}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-sky-400 transition-colors"
                  >
                    <span className="line-clamp-1">{course.shortTitle}</span>
                    <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500">
                      {course.chapterCount} 章 →
                    </span>
                  </Link>
                ))}
                {active.courses.length === 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">这一层暂未配课程</span>
                )}
              </div>
            </div>
          </div>

          {variant === "compact" && (
            <Link
              href="/start"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:gap-2.5 transition-all dark:text-sky-400"
            >
              看完整五层系统栈
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
