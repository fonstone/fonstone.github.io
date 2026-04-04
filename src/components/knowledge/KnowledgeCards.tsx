import Link from "next/link";
import type { KnowledgePost } from "@/lib/knowledge/knowledge";
import { categoryToSlug } from "@/lib/knowledge/knowledge";

type Props = {
  posts: KnowledgePost[];
  showCategory?: boolean;
};

export default function KnowledgeCards({ posts, showCategory }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {posts.map((post) => {
        const href = `/knowledge/${categoryToSlug(post.category)}/${post.slug}`;

        return (
          <Link
            key={`${post.category}:${post.slug}`}
            href={href}
            className="group rounded-2xl border border-white/10 bg-white/0 p-5 hover:bg-white/5"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-semibold leading-snug">
                {post.title}
              </h3>
              {showCategory && (
                <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-xs text-white/70">
                  {post.category}
                </span>
              )}
            </div>

            {post.description && (
              <p className="mt-2 text-sm text-white/70">
                {post.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/50">
              {post.date && <span>{post.date}</span>}
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
