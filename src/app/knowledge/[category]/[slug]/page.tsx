import Link from "next/link";
import { notFound } from "next/navigation";
import KnowledgeMdx from "@/components/knowledge/KnowledgeMdx";
import {
  getKnowledgePost,
  getKnowledgeStaticParams,
} from "@/lib/knowledge/knowledge";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getKnowledgeStaticParams();
}

export default async function KnowledgePostPage({
  params,
}: {
  params: { category: string; slug: string };
}) {
  const data = await getKnowledgePost(params);
  if (!data) notFound();

  const { post, mdxSource } = data;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-sm text-white/60">
          <Link href={`/knowledge/${encodeURIComponent(post.category)}`}>
            {post.category}
          </Link>
          <span className="text-white/30">/</span>
          <Link href="/knowledge">全部</Link>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
          {post.date && <span>{post.date}</span>}
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-2 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <article className="prose prose-invert max-w-none">
        <KnowledgeMdx source={mdxSource} />
      </article>
    </div>
  );
}

