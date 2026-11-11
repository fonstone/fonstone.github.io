import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import SearchPageClient from "@/components/search/SearchPageClient";

export const metadata: Metadata = {
  title: "站内搜索",
  description:
    "在 StoneFon 知识空间里搜索技术长文与课程章节，覆盖操作系统内核、边缘 AI、超低时延、自动驾驶与全部 8 门课程。",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 md:px-6">
      <header className="mb-10 rounded-3xl border border-slate-200 bg-white/60 p-8 md:p-10 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-sky-400">
          <Search className="h-3.5 w-3.5" />
          本地索引，无需服务端
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-slate-100">
          站内搜索
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          索引由构建脚本从文章内容直接生成，标题、标签、摘要和正文都会参与匹配。任意页面按
          <kbd className="mx-1 rounded border border-slate-300 px-1 text-xs dark:border-slate-600">⌘K</kbd>
          或
          <kbd className="mx-1 rounded border border-slate-300 px-1 text-xs dark:border-slate-600">Ctrl K</kbd>
          也能直接唤起搜索。
        </p>
        <Link
          href="/start"
          className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-sky-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          回到阅读路线图
        </Link>
      </header>

      <SearchPageClient />
    </main>
  );
}
