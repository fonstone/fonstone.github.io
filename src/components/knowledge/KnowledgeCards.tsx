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
            className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
                {post.title}
              </h3>
              {showCategory && (
                <span className="shrink-0 rounded-full border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                  {post.category}
                </span>
              )}
            </div>

            {post.description && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {post.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {post.date && <span>{post.date}</span>}
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 dark:border-slate-700 px-2 py-1"
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
