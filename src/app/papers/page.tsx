import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookMarked } from "lucide-react";
import PapersBrowser from "@/components/PapersBrowser";
import { PAPER_ENTRIES } from "@/lib/generated/papers";

export const metadata: Metadata = {
  title: "出处索引墙",
  description:
    "把知识空间各篇长文文末的论文、官方文档与开源工程集中索引，按文章与主题聚合，逐条可点回原文核验。",
  alternates: { canonical: "/papers" },
};

export default function PapersPage() {
  const articleCount = new Set(PAPER_ENTRIES.map((p) => p.articleKey)).size;
  const withUrl = PAPER_ENTRIES.filter((p) => p.url).length;
  const years = PAPER_ENTRIES.map((p) => p.year).filter((y): y is number => Boolean(y));
  const topicCounts = ["论文与预印本", "官方文档", "开源工程", "其他资料"].map((topic) => ({
    topic,
    count: PAPER_ENTRIES.filter((p) => p.topic === topic).length,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
      <header className="mb-10 rounded-3xl border border-slate-200 bg-white/60 p-8 md:p-10 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 dark:bg-purple-500/10 dark:text-purple-300">
          <BookMarked className="h-3.5 w-3.5" />
          一手材料索引
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-slate-100">
          出处索引墙
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          每篇长文都把数字和结论的来路写在文末参考资料里。这一页把 {articleCount} 篇文章的
          {PAPER_ENTRIES.length} 条出处抽出来按主题聚合，{withUrl} 条带可点击的外链，
          {years.length > 0 ? `最早可追到 ${Math.min(...years)} 年的材料` : "逐条可回原文核验"}。
          索引由构建脚本从正文生成，不手写第二份书目。
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {topicCounts.map(({ topic, count }) => (
            <div
              key={topic}
              className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{count}</div>
              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{topic}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
          <Link href="/start" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-sky-400">
            <ArrowLeft className="h-3.5 w-3.5" />
            回到阅读路线图
          </Link>
          <Link href="/search" className="text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-sky-400">
            按关键词搜全文 →
          </Link>
        </div>
      </header>

      <PapersBrowser papers={PAPER_ENTRIES} />
    </main>
  );
}
