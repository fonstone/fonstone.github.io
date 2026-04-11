import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import KnowledgeMdx from "@/components/knowledge/KnowledgeMdx";
import TableOfContents from "@/components/knowledge/TableOfContents";
import PostBreadcrumb from "@/components/knowledge/PostBreadcrumb";
import {
  getKnowledgePost,
  getKnowledgeStaticParams,
  extractHeadings,
  slugToCategory,
  categoryToSlug,
} from "@/lib/knowledge/knowledge";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getKnowledgeStaticParams();
}

export default async function KnowledgePostPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const category = slugToCategory(resolvedParams.category);
  const data = await getKnowledgePost({ ...resolvedParams, category });
  if (!data) notFound();

  const { post, mdxSource } = data;
  const headings = extractHeadings(mdxSource);
  const catSlug = categoryToSlug(post.category);

  return (
    <div className="flex gap-8">
      <article className="flex-1 min-w-0">
        <header className="flex flex-col gap-3 mb-8">
          <Suspense fallback={<div className="h-5 w-20 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />}>
            <PostBreadcrumb category={post.category} categorySlug={catSlug} />
          </Suspense>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {post.date && <span>{post.date}</span>}
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/knowledge?tag=${encodeURIComponent(tag)}`}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-2 py-1 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </header>

        <div className="prose max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-a:text-blue-600 dark:prose-a:text-sky-400 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-code:text-slate-900 dark:prose-code:text-slate-100 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800 prose-hr:border-slate-200 dark:prose-hr:border-slate-800 prose-thead:border-b-slate-200 dark:prose-thead:border-b-slate-800 prose-th:text-slate-900 dark:prose-th:text-slate-100 prose-td:text-slate-700 dark:prose-td:text-slate-300">
          <KnowledgeMdx source={mdxSource} />
        </div>
      </article>

      {headings.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0">
          <TableOfContents headings={headings} />
        </aside>
      )}
    </div>
  );
}

