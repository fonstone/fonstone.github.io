"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Search, X } from "lucide-react";
import type { PaperEntry } from "@/lib/generated/papers";

const TOPICS = ["全部", "论文与预印本", "官方文档", "开源工程", "其他资料"] as const;

function shortLabel(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return "无外链";
  }
}

export default function PapersBrowser({ papers }: { papers: PaperEntry[] }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("全部");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((paper) => {
      if (topic !== "全部" && paper.topic !== topic) return false;
      if (!q) return true;
      return (
        paper.title.toLowerCase().includes(q) ||
        paper.articleTitle.toLowerCase().includes(q) ||
        paper.category.toLowerCase().includes(q) ||
        paper.url.toLowerCase().includes(q)
      );
    });
  }, [papers, query, topic]);

  const groups = useMemo(() => {
    const map = new Map<string, { articleTitle: string; articleHref: string; entries: PaperEntry[] }>();
    for (const paper of filtered) {
      const group = map.get(paper.articleKey) ?? {
        articleTitle: paper.articleTitle,
        articleHref: paper.articleHref,
        entries: [],
      };
      group.entries.push(paper);
      map.set(paper.articleKey, group);
    }
    return [...map.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.entries.length - a.entries.length);
  }, [filtered]);

  const withUrl = filtered.filter((p) => p.url).length;

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="按论文名、机构、文章标题过滤，比如「USENIX」「WCET」"
          aria-label="过滤出处"
          className="w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-12 pr-12 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="清空过滤"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {TOPICS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTopic(item)}
            aria-pressed={topic === item}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
              topic === item
                ? "border-blue-400 bg-blue-50 font-medium text-blue-600 dark:border-blue-500 dark:bg-blue-500/10 dark:text-sky-400"
                : "border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400"
            }`}
          >
            {item}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {filtered.length} 条出处 · {withUrl} 条带外链 · {groups.length} 篇文章
        </span>
      </div>

      <div className="mt-7 flex flex-col gap-3">
        {groups.map((group, groupIndex) => {
          const visible = expanded || groupIndex < 3 ? group.entries : group.entries.slice(0, 4);
          const hiddenCount = group.entries.length - visible.length;
          return (
            <section
              key={group.key}
              className="rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={group.articleHref}
                  className="text-sm font-semibold text-slate-800 hover:text-blue-600 dark:text-slate-100 dark:hover:text-sky-400"
                >
                  {group.articleTitle}
                </Link>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {group.entries.length} 条出处
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-1.5 lg:grid-cols-2">
                {visible.map((paper) => (
                  <li key={paper.id} className="min-w-0">
                    {paper.url ? (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs leading-relaxed text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                      >
                        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-slate-300 group-hover:text-blue-500 dark:text-slate-600" />
                        <span className="line-clamp-2">{paper.title}</span>
                      </a>
                    ) : (
                      <div className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="line-clamp-2">{paper.title}</span>
                      </div>
                    )}
                    <div className="ml-7 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                      <span>{paper.topic}</span>
                      {paper.year && <span>· {paper.year}</span>}
                      {paper.url && <span>· {shortLabel(paper.url)}</span>}
                      {paper.extraUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-slate-100 px-1 hover:text-blue-600 dark:bg-slate-800 dark:hover:text-sky-400"
                        >
                          {shortLabel(url)}
                        </a>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="mt-2 text-[11px] text-blue-600 hover:underline dark:text-sky-400"
                >
                  展开本组剩余 {hiddenCount} 条
                </button>
              )}
            </section>
          );
        })}
      </div>

      {!expanded && groups.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-5 w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-sky-400"
        >
          展开全部 {groups.length} 篇文章的出处
        </button>
      )}

      {groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 py-14 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          没有匹配的出处，换个关键词或切回「全部」。
        </div>
      )}
    </>
  );
}
