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
      className="mx-auto w-full max-w-7xl font-sans px-0 md:px-6 text-gray-900"
      style={
        {
          "--font-sans":
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-white">
        <div className="flex flex-col md:grid md:grid-cols-[250px,1fr]">
          <aside className="border-b border-gray-200 md:border-b-0 md:border-r md:h-[calc(100svh-48px)] md:sticky md:top-0 overflow-y-auto bg-gray-50">
            <div className="p-4 md:p-6">
              <div className="mb-6 flex items-center justify-between">
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  ← 返回主页
                </Link>
                <span className="text-sm font-semibold text-gray-900">
                  知识空间
                </span>
              </div>
              <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-gray-100" />}>
                <KnowledgeSidebar data={sidebarData} tags={tagData} />
              </Suspense>
            </div>
          </aside>
          <section className="p-6 md:p-10 overflow-y-auto">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
