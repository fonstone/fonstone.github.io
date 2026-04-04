import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import KnowledgeSidebar, {
  type KnowledgeSidebarData,
} from "@/components/knowledge/KnowledgeSidebar";
import { getKnowledgeCategories } from "@/lib/knowledge/knowledge";

export default async function KnowledgeLayout({
  children,
}: {
  children: ReactNode;
}) {
  const categories = await getKnowledgeCategories();
  const sidebarData: KnowledgeSidebarData = categories.map((c) => ({
    category: c.category,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  return (
    <div
      className="mx-auto w-full max-w-6xl font-sans px-2 md:px-4"
      style={
        {
          "--font-sans":
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
        } as CSSProperties
      }
    >
      <div className="min-h-[calc(100svh-24px)] md:min-h-[calc(100svh-48px)] rounded-xl md:rounded-2xl border border-white/10 bg-white/0">
        <div className="flex flex-col md:grid md:h-[calc(100svh-48px)] md:grid-cols-[280px,1fr]">
          <aside className="border-b border-white/10 md:border-b-0 md:border-r">
            <div className="p-3 md:p-4">
              <div className="mb-3 flex items-center justify-between">
                <Link
                  href="/"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  ← 返回主页
                </Link>
              </div>
              <div className="mb-3 text-sm font-semibold text-white/80">
                知识空间
              </div>
              <KnowledgeSidebar data={sidebarData} />
            </div>
          </aside>
          <section className="p-3 md:p-6 overflow-y-auto">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
