"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect, Suspense } from "react";
import type { KnowledgePost, KnowledgeCategory, KnowledgeTagInfo } from "@/lib/knowledge/knowledge";

type Props = {
  allPosts: KnowledgePost[];
  categories: KnowledgeCategory[];
  allTags: KnowledgeTagInfo[];
};

function KnowledgeTagFilterContent({ allPosts, categories, allTags }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTag, setActiveTag] = useState<string | null>(searchParams.get("tag"));

  useEffect(() => {
    setActiveTag(searchParams.get("tag"));
  }, [searchParams]);

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
      setActiveTag(null);
      router.replace("/knowledge");
    } else {
      setActiveTag(tag);
      router.push(`/knowledge?tag=${encodeURIComponent(tag)}`);
    }
  }

  function clearTagFilter() {
    router.replace("/knowledge");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {activeTag ? `标签：${activeTag}` : "文章"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {activeTag
            ? `共 ${filteredPosts.length} 篇文章包含标签「${activeTag}」`
            : `按分类沉淀笔记与思考，共 ${categories.length} 个分类、${allPosts.length} 篇文章。`}
        </p>
        {activeTag && (
          <button
            type="button"
            onClick={clearTagFilter}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors w-fit bg-transparent border-0 cursor-pointer"
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
                    ? "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100"
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
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                <Link
                  href={`/knowledge/${cat.slug}`}
                  className="hover:text-blue-500 transition-colors"
                >
                  {cat.category}
                </Link>
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {cat.posts.length} 篇
              </span>
            </div>
            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
              {cat.posts.map((post) => (
                <Link
                  key={`${post.category}:${post.slug}`}
                  href={`/knowledge/${cat.slug}/${post.slug}`}
                  className="group flex flex-col gap-1.5 py-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                      {post.title}
                    </h3>
                    {post.date && (
                      <time className="shrink-0 text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                        {post.date}
                      </time>
                    )}
                  </div>
                  {post.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
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
                          className="rounded-full border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer"
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
    <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />}>
      <KnowledgeTagFilterContent {...props} />
    </Suspense>
  );
}
