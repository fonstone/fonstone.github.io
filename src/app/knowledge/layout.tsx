import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Suspense } from "react";
import KnowledgeSidebar, {
  type KnowledgeSidebarData,
  type KnowledgeTagData,
} from "@/components/knowledge/KnowledgeSidebar";
import { getKnowledgeCategories, getAllTags } from "@/lib/knowledge/knowledge";

export default async function KnowledgeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const categories = await getKnowledgeCategories();
  const tags = await getAllTags();

  const sidebarData: KnowledgeSidebarData = categories.map((c) => ({
    category: c.category,
    slug: c.slug,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  const tagData: KnowledgeTagData = tags.map((t) => ({
    tag: t.tag,
    count: t.count,
  }));

  return (
    <div
      className="mx-auto w-full max-w-7xl font-sans px-0 md:px-6 text-slate-900 dark:text-slate-100"
      style={
        {
          "--font-sans":
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-transparent">
        <div className="flex flex-col md:grid md:grid-cols-[280px,1fr] gap-0">
          <aside className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 md:h-[calc(100svh-96px)] md:sticky md:top-[32px] overflow-y-auto bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl md:rounded-r-none md:rounded-l-2xl">
            <div className="p-4 md:p-6">
              <div className="mb-6 flex items-center justify-between">
                <Link
                  href="/"
                  className="text-sm font-medium text-slate-500 hover:text-blue-500 dark:text-slate-400 transition-colors"
                >
                  ← 返回主页
                </Link>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  知识空间
                </span>
              </div>
              <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
                <KnowledgeSidebar data={sidebarData} tags={tagData} />
              </Suspense>
            </div>
          </aside>
          <section className="p-4 md:p-8 lg:p-10">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
