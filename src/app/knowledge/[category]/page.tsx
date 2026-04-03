import { notFound } from "next/navigation";
import KnowledgeCards from "@/components/knowledge/KnowledgeCards";
import { getKnowledgeCategories } from "@/lib/knowledge/knowledge";

export const dynamicParams = false;

export async function generateStaticParams() {
  const categories = await getKnowledgeCategories();
  return categories.map((c) => ({ category: c.category }));
}

export default async function KnowledgeCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = await getKnowledgeCategories();
  const current = categories.find((c) => c.category === category);
  if (!current) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">{category}</h1>
        <p className="text-sm text-white/70">{current.posts.length} 篇</p>
      </header>

      <KnowledgeCards posts={current.posts} />
    </div>
  );
}
