import { notFound } from "next/navigation";
import Link from "next/link";
import { getKnowledgeCategories, slugToCategory } from "@/lib/knowledge/knowledge";

export const dynamicParams = false;

export async function generateStaticParams() {
  const categories = await getKnowledgeCategories();
  return categories.map((c) => ({ category: c.slug }));
}

export default async function KnowledgeCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = slugToCategory(slug);
  const categories = await getKnowledgeCategories();
  const current = categories.find((c) => c.slug === slug);
  if (!current) notFound();

  return (
    <article className="flex-1 min-w-0">
      <header className="flex flex-col gap-2 mb-8 pb-6 border-b border-white/5">
        <nav className="flex items-center gap-2 text-xs text-white/30 mb-2">
          <Link href="/knowledge" className="hover:text-white/60 transition-colors">
            知识空间
          </Link>
          <span>/</span>
          <span className="text-white/50">{category}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">{category}</h1>
        <p className="text-sm text-white/50">
          {current.posts.length} 篇文章
        </p>
      </header>

      <div className="flex flex-col divide-y divide-white/5">
        {current.posts.map((post) => (
          <Link
            key={post.slug}
            href={`/knowledge/${slug}/${post.slug}`}
            className="group flex flex-col gap-2 py-5 transition-colors hover:bg-white/5 -mx-2 px-2 rounded-lg"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-base font-medium text-white/90 group-hover:text-white transition-colors">
                {post.title}
              </h3>
              {post.date && (
                <time className="shrink-0 text-sm text-white/30 tabular-nums">
                  {post.date}
                </time>
              )}
            </div>
            {post.description && (
              <p className="text-sm text-white/40 line-clamp-2">
                {post.description}
              </p>
            )}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </article>
  );
}
