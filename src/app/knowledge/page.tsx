import Link from "next/link";
import { getAllKnowledgePosts, getKnowledgeCategories, getAllTags } from "@/lib/knowledge/knowledge";

export default async function KnowledgeIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag: activeTag } = await searchParams;
  const allPosts = await getAllKnowledgePosts();
  const categories = await getKnowledgeCategories();
  const allTags = await getAllTags();

  const filteredPosts = activeTag
    ? allPosts.filter((p) => p.tags.includes(activeTag))
    : allPosts;

  const filteredCategories = activeTag
    ? categories
        .map((cat) => ({
          ...cat,
          posts: cat.posts.filter((p) => p.tags.includes(activeTag)),
        }))
        .filter((cat) => cat.posts.length > 0)
    : categories;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {activeTag ? `标签：${activeTag}` : "文章"}
        </h1>
        <p className="text-sm text-white/50">
          {activeTag
            ? `共 ${filteredPosts.length} 篇文章包含标签「${activeTag}」`
            : `按分类沉淀笔记与思考，共 ${categories.length} 个分类、${allPosts.length} 篇文章。`}
        </p>
        {activeTag && (
          <Link
            href="/knowledge"
            className="text-xs text-white/40 hover:text-white/70 transition-colors w-fit"
          >
            ← 查看全部文章
          </Link>
        )}
      </header>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tagInfo) => {
            const isActive = activeTag === tagInfo.tag;
            return (
              <Link
                key={tagInfo.tag}
                href={`/knowledge?tag=${encodeURIComponent(tagInfo.tag)}`}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "border-white/30 bg-white/15 text-white"
                    : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
              >
                {tagInfo.tag}
                <span className="ml-1 opacity-60">{tagInfo.count}</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {filteredCategories.map((cat) => (
          <section key={cat.slug} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white/80">
                <Link
                  href={`/knowledge/${cat.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {cat.category}
                </Link>
              </h2>
              <span className="text-xs text-white/30">
                {cat.posts.length} 篇
              </span>
            </div>
            <div className="flex flex-col divide-y divide-white/5">
              {cat.posts.map((post) => (
                <Link
                  key={`${post.category}:${post.slug}`}
                  href={`/knowledge/${cat.slug}/${post.slug}`}
                  className="group flex flex-col gap-1.5 py-4 transition-colors hover:bg-white/5 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                      {post.title}
                    </h3>
                    {post.date && (
                      <time className="shrink-0 text-xs text-white/30 tabular-nums">
                        {post.date}
                      </time>
                    )}
                  </div>
                  {post.description && (
                    <p className="text-xs text-white/40 line-clamp-2">
                      {post.description}
                    </p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {post.tags.slice(0, 4).map((t) => (
                        <Link
                          key={t}
                          href={`/knowledge?tag=${encodeURIComponent(t)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/30 hover:text-white/60 hover:border-white/20 transition-colors"
                        >
                          {t}
                        </Link>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}

        {filteredPosts.length === 0 && (
          <p className="text-sm text-white/40">
            {activeTag
              ? `没有找到包含标签「${activeTag}」的文章`
              : "还没有文章内容，请在 /content 里添加 .mdx 文件。"}
          </p>
        )}
      </div>
    </div>
  );
}
