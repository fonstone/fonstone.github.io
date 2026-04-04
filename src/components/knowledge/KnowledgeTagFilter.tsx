"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo } from "react";
import type { KnowledgePost, KnowledgeCategory, KnowledgeTagInfo } from "@/lib/knowledge/knowledge";

type Props = {
  allPosts: KnowledgePost[];
  categories: KnowledgeCategory[];
  allTags: KnowledgeTagInfo[];
};

function KnowledgeTagFilterContent({ allPosts, categories, allTags }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTag = searchParams.get("tag") || null;

  const filteredPosts = useMemo(
    () =>
      activeTag
        ? allPosts.filter((p) => p.tags.includes(activeTag))
        : allPosts,
    [allPosts, activeTag],
  );

  const filteredCategories = useMemo(() => {
    if (!activeTag) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        posts: cat.posts.filter((p) => p.tags.includes(activeTag)),
      }))
      .filter((cat) => cat.posts.length > 0);
  }, [categories, activeTag]);

  function handleTagClick(tag: string) {
    if (activeTag === tag) {
      router.replace("/knowledge");
    } else {
      router.replace(`/knowledge?tag=${encodeURIComponent(tag)}`);
    }
  }

  function clearTagFilter() {
    router.replace("/knowledge");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-white">
          {activeTag ? `标签：${activeTag}` : "文章"}
        </h1>
        <p className="text-sm text-gray-500 md:text-white/50">
          {activeTag
            ? `共 ${filteredPosts.length} 篇文章包含标签「${activeTag}」`
            : `按分类沉淀笔记与思考，共 ${categories.length} 个分类、${allPosts.length} 篇文章。`}
        </p>
        {activeTag && (
          <button
            type="button"
            onClick={clearTagFilter}
            className="text-xs text-gray-500 hover:text-gray-900 md:text-white/40 md:hover:text-white/70 transition-colors w-fit bg-transparent border-0 cursor-pointer"
          >
            ← 查看全部文章
          </button>
        )}
      </header>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tagInfo) => {
            const isActive = activeTag === tagInfo.tag;
            return (
              <button
                key={tagInfo.tag}
                type="button"
                onClick={() => handleTagClick(tagInfo.tag)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer ${
                  isActive
                    ? "border-gray-300 bg-gray-100 text-gray-900 md:border-white/30 md:bg-white/15 md:text-white"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900 md:border-white/10 md:text-white/50 md:hover:border-white/20 md:hover:text-white/80"
                }`}
              >
                {tagInfo.tag}
                <span className="ml-1 opacity-60">{tagInfo.count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {filteredCategories.map((cat) => (
          <section key={cat.slug} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800 md:text-white/80">
                <Link
                  href={`/knowledge/${cat.slug}`}
                  className="hover:text-gray-900 md:hover:text-white transition-colors"
                >
                  {cat.category}
                </Link>
              </h2>
              <span className="text-xs text-gray-400 md:text-white/30">
                {cat.posts.length} 篇
              </span>
            </div>
            <div className="flex flex-col divide-y divide-gray-200 md:divide-white/5">
              {cat.posts.map((post) => (
                <Link
                  key={`${post.category}:${post.slug}`}
                  href={`/knowledge/${cat.slug}/${post.slug}`}
                  className="group flex flex-col gap-1.5 py-4 transition-colors hover:bg-gray-50 md:hover:bg-white/5 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-sm font-medium text-gray-800 group-hover:text-gray-900 md:text-white/80 md:group-hover:text-white transition-colors">
                      {post.title}
                    </h3>
                    {post.date && (
                      <time className="shrink-0 text-xs text-gray-400 md:text-white/30 tabular-nums">
                        {post.date}
                      </time>
                    )}
                  </div>
                  {post.description && (
                    <p className="text-xs text-gray-500 md:text-white/40 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {post.tags.slice(0, 4).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTagClick(t);
                          }}
                          className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 md:border-white/10 md:text-white/30 md:hover:text-white/60 md:hover:border-white/20 transition-colors cursor-pointer"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}

        {filteredPosts.length === 0 && (
          <p className="text-sm text-gray-500 md:text-white/40">
            {activeTag
              ? `没有找到包含标签「${activeTag}」的文章`
              : "还没有文章内容，请在 /content 里添加 .mdx 文件。"}
          </p>
        )}
      </div>
    </div>
  );
}

export default function KnowledgeTagFilter(props: Props) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-white/5" />}>
      <KnowledgeTagFilterContent {...props} />
    </Suspense>
  );
}
