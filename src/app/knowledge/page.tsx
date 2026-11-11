import { getAllKnowledgePosts, getKnowledgeCategories, getAllTags } from "@/lib/knowledge/knowledge";
import KnowledgeTagFilter from "@/components/knowledge/KnowledgeTagFilter";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Compass } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "知识空间",
  description:
    "按分类整理的技术长文，覆盖 AI 工程化、操作系统内核、超低时延与自动驾驶系统栈。",
  alternates: { canonical: "/knowledge" },
};

export default async function KnowledgeIndexPage() {
  const allPosts = await getAllKnowledgePosts();
  const categories = await getKnowledgeCategories();
  const allTags = await getAllTags();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/start"
        className="group flex flex-wrap items-center gap-3 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 px-5 py-4 hover:border-blue-400 dark:hover:border-blue-400 transition-colors"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 shrink-0">
          <Compass className="h-4 w-4" />
        </span>
        <span className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            第一次来？先看「从这里开始」
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            五层系统栈、{allPosts.length} 篇长文与 8 门课程的阅读顺序，不必在标签墙里碰运气。
          </span>
        </span>
        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-blue-500 group-hover:translate-x-1 transition-transform" />
      </Link>

      <Suspense
        fallback={
          <div className="flex flex-col gap-6">
            <div className="h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="flex gap-2">
              <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-6 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        }
      >
        <KnowledgeTagFilter allPosts={allPosts} categories={categories} allTags={allTags} />
      </Suspense>
    </div>
  );
}
