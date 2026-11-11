"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CornerDownLeft, GraduationCap, Search, X } from "lucide-react";
import {
  loadSearchIndex,
  searchEntries,
  snippet,
  type SearchEntry,
} from "@/lib/search";

/** 全站搜索入口：导航栏按钮 + ⌘K / Ctrl+K 命令面板。索引按需 fetch，不进首屏 bundle。 */
export default function SearchLauncher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => searchEntries(entries, query, { limit: 8 }),
    [entries, query]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (key === "escape" && open) {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadSearchIndex()
      .then((data) => {
        if (!cancelled) setEntries(data.entries);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => {
      cancelled = true;
      document.body.style.overflow = "";
      window.clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const go = useCallback(
    (entry: SearchEntry) => {
      close();
      router.push(entry.href);
    },
    [close, router]
  );

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((v) => Math.min(v + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((v) => Math.max(v - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[active]) go(results[active]);
      else if (query.trim()) {
        close();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="搜索站内文章与课程"
        className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline">搜索</span>
        <kbd className="hidden lg:inline rounded border border-slate-200 dark:border-slate-700 px-1 text-[10px] leading-4 text-slate-400">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-label="站内搜索"
        >
          <button
            type="button"
            aria-label="关闭搜索"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default bg-slate-900/50 backdrop-blur-sm"
          />
          <div className="relative mt-[12vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="搜索全站文章与课程章节…"
                aria-label="搜索关键词"
                className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={close}
                aria-label="关闭"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  {entries.length === 0 ? "正在加载索引…" : `没有匹配「${query}」的内容，换个关键词试试`}
                </div>
              )}
              {results.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(entry)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    index === active
                      ? "bg-blue-50 dark:bg-blue-500/10"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-slate-400">
                    {entry.type === "article" ? (
                      <BookOpen className="h-4 w-4" />
                    ) : (
                      <GraduationCap className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {entry.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                      {entry.type === "article" ? entry.category : `课程 · ${entry.category}`}
                      {query.trim() ? ` · ${snippet(entry, query, 60)}` : entry.description ? ` · ${entry.description}` : ""}
                    </span>
                  </span>
                  {index === active && <CornerDownLeft className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" />}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-400 dark:border-slate-700">
              <span>↑↓ 选择 · Enter 打开 · Esc 关闭</span>
              <a
                href={query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search"}
                className="hover:text-blue-500 dark:hover:text-sky-400"
              >
                打开完整搜索页 →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
