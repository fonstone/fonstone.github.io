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
      className="mx-auto w-full max-w-6xl font-sans"
      style={
        {
          "--font-sans":
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
        } as CSSProperties
      }
    >
      <div className="h-[calc(100svh-24px)] md:h-[calc(100svh-48px)] overflow-hidden rounded-2xl border border-white/10 bg-white/0">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[280px,1fr]">
          <aside className="h-full overflow-y-auto border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 text-sm font-semibold text-white/80">
              知识空间
            </div>
            <KnowledgeSidebar data={sidebarData} />
          </aside>
          <section className="h-full overflow-y-auto p-4 lg:p-6">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
