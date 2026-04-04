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
      <header className="flex flex-col gap-2 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2">
          <Link href="/knowledge" className="hover:text-blue-500 transition-colors">
            知识空间
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">{category}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{category}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {current.posts.length} 篇文章
        </p>
      </header>

      <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
        {current.posts.map((post) => (
          <Link
            key={post.slug}
            href={`/knowledge/${slug}/${post.slug}`}
            className="group flex flex-col gap-2 py-5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-base font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                {post.title}
              </h3>
              {post.date && (
                <time className="shrink-0 text-sm text-slate-400 dark:text-slate-500 tabular-nums">
                  {post.date}
                </time>
              )}
            </div>
            {post.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                {post.description}
              </p>
            )}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs text-slate-400 dark:text-slate-500"
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
