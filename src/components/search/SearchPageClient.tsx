"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, GraduationCap, Search, SlidersHorizontal, X } from "lucide-react";
import {
  loadSearchIndex,
  searchEntries,
  snippet,
  type SearchEntry,
} from "@/lib/search";

type Filter = "all" | "article" | "chapter";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "article", label: "知识文章" },
  { value: "chapter", label: "课程章节" },
];

export default function SearchPageClient() {
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    const type = params.get("type");
    if (type === "article" || type === "chapter") setFilter(type);
    loadSearchIndex()
      .then((data) => setEntries(data.entries))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (filter !== "all") params.set("type", filter);
    const next = params.toString() ? `/search?${params.toString()}` : "/search";
    window.history.replaceState(null, "", next);
  }, [query, filter, loading]);

  const results = useMemo(
    () => searchEntries(entries, query, { type: filter, limit: 60 }),
    [entries, query, filter]
  );

  const hotTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      if (entry.type !== "article") continue;
      for (const tag of entry.tags) {
        if (tag.length > 12) continue;
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);
  }, [entries]);

  const articleCount = entries.filter((e) => e.type === "article").length;
  const chapterCount = entries.length - articleCount;

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索标题、标签、摘要与正文，比如「WCET」「RDMA」「抢占」"
          aria-label="搜索关键词"
          autoFocus
          className="w-full rounded-2xl border border-slate-200 bg-white/80 py-4 pl-12 pr-12 text-base text-slate-900 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="清空搜索"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="mr-1 h-4 w-4 text-slate-400" />
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              filter === value
                ? "border-blue-400 bg-blue-50 font-medium text-blue-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-sky-400"
                : "border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {articleCount} 篇文章 · {chapterCount} 个章节
        </span>
      </div>

      {!query.trim() && hotTags.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">高频标签</span>
          {hotTags.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-sky-400"
            >
              {tag} <span className="text-slate-300 dark:text-slate-600">{count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {query.trim() ? `「${query.trim()}」的搜索结果` : filter === "all" ? "最近更新" : "全部内容"}
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {loading ? "加载索引…" : `${results.length} 条`}
          </span>
        </div>

        {failed && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            索引加载失败，请刷新页面重试。
          </p>
        )}

        <div className="flex flex-col gap-2">
          {results.map((entry) => (
            <Link
              key={entry.id}
              href={entry.href}
              className="group rounded-xl border border-slate-200 bg-white/60 px-4 py-3.5 transition-colors hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-blue-500"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-slate-400">
                  {entry.type === "article" ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <GraduationCap className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-800 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-sky-400">
                    {entry.title}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {query.trim()
                      ? snippet(entry, query, 130)
                      : entry.description || entry.body.slice(0, 130)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                      {entry.type === "article" ? "知识文章" : "课程章节"}
                    </span>
                    <span>{entry.category}</span>
                    {entry.date && <span>· {entry.date}</span>}
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>· {tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!loading && results.length === 0 && !failed && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            没有匹配的内容。试试更短的词，或切换到「全部」。
          </div>
        )}
      </div>
    </>
  );
}
