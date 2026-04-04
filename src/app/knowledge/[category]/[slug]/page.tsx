import Link from "next/link";
import { notFound } from "next/navigation";
import KnowledgeMdx from "@/components/knowledge/KnowledgeMdx";
import TableOfContents from "@/components/knowledge/TableOfContents";
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
          <div className="flex items-center gap-3 text-sm text-gray-500 md:text-white/60">
            <Link href={`/knowledge/${catSlug}`} className="hover:text-gray-700 md:hover:text-white/80 transition-colors">
              {post.category}
            </Link>
            <span className="text-gray-300 md:text-white/30">/</span>
            <Link href="/knowledge" className="hover:text-gray-700 md:hover:text-white/80 transition-colors">全部</Link>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-white">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 md:text-white/50">
            {post.date && <span>{post.date}</span>}
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-gray-200 md:border-white/10 px-2 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="prose max-w-none prose-headings:text-gray-900 md:prose-headings:text-white prose-p:text-gray-700 md:prose-p:text-white/80 prose-strong:text-gray-900 md:prose-strong:text-white prose-a:text-blue-600 md:prose-a:text-sky-400 prose-li:text-gray-700 md:prose-li:text-white/80 prose-blockquote:text-gray-600 md:prose-blockquote:text-white/60 prose-code:text-gray-900 md:prose-code:text-white prose-pre:bg-gray-100 md:prose-pre:bg-white/5 prose-pre:border prose-pre:border-gray-200 md:prose-pre:border-white/10 prose-hr:border-gray-200 md:prose-hr:border-white/10 prose-thead:border-b-gray-200 md:prose-thead:border-b-white/10 prose-th:text-gray-900 md:prose-th:text-white prose-td:text-gray-700 md:prose-td:text-white/80">
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

