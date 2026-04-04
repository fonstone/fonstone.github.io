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
      className="mx-auto w-full max-w-7xl font-sans px-4 md:px-6"
      style={
        {
          "--font-sans":
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
        } as CSSProperties
      }
    >
      <div className="min-h-screen md:min-h-[calc(100svh-48px)] rounded-none md:rounded-2xl border-0 md:border border-white/10 bg-white/0">
        <div className="flex flex-col md:grid md:grid-cols-[260px,1fr]">
          <aside className="border-b border-white/10 md:border-b-0 md:border-r md:h-[calc(100svh-48px)] md:sticky md:top-0 overflow-y-auto">
            <div className="p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <Link
                  href="/"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  ← 返回主页
                </Link>
                <span className="text-sm font-semibold text-white/80">
                  知识空间
                </span>
              </div>
              <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-white/5" />}>
                <KnowledgeSidebar data={sidebarData} tags={tagData} />
              </Suspense>
            </div>
          </aside>
          <section className="p-4 md:p-8 overflow-y-auto">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
