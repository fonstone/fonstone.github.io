import Link from "next/link";
import { getAllKnowledgePosts, getKnowledgeCategories } from "@/lib/knowledge/knowledge";

export default async function KnowledgeIndexPage() {
  const posts = await getAllKnowledgePosts();
  const categories = await getKnowledgeCategories();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">文章</h1>
        <p className="text-sm text-white/50">
          按分类沉淀笔记与思考，共 {categories.length} 个分类、{posts.length} 篇文章。
        </p>
      </header>

      <div className="flex gap-8">
        <aside className="hidden md:block w-48 shrink-0">
          <nav className="sticky top-4 flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-white/80 mb-3">分类</h3>
            {categories.map((cat) => (
              <Link
                key={cat.category}
                href={`/knowledge/${encodeURIComponent(cat.category)}`}
                className="rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              >
                {cat.category}
                <span className="ml-2 text-xs text-white/40">
                  {cat.posts.length}
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {categories.map((cat) => (
            <section key={cat.category} className="flex flex-col gap-1 mb-8">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-white/80">{cat.category}</h2>
                <Link
                  href={`/knowledge/${encodeURIComponent(cat.category)}`}
                  className="text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  查看全部 →
                </Link>
              </div>
              <div className="flex flex-col divide-y divide-white/5">
                {cat.posts.map((post) => (
                  <Link
                    key={`${post.category}:${post.slug}`}
                    href={`/knowledge/${encodeURIComponent(post.category)}/${encodeURIComponent(post.slug)}`}
                    className="group flex flex-col gap-1 py-4 transition-colors hover:bg-white/5 -mx-2 px-2 rounded-lg"
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
                      <p className="text-xs text-white/40 line-clamp-1">
                        {post.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {posts.length === 0 && (
            <p className="text-sm text-white/40">
              还没有文章内容，请在 /content 里添加 .mdx 文件。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

