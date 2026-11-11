import Link from "next/link";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import { getAllKnowledgePosts, categoryToSlug } from "@/lib/knowledge/knowledge";
import { ARTICLE_SERIES } from "@/lib/constants/learningMap";

type LinkInfo = { key: string; title: string; href: string };

/** 文章底部顺序导航：属于招牌系列时按系列顺序，否则按全库发布时间。 */
export default async function ArticlePrevNext({ articleKey }: { articleKey: string }) {
  const posts = await getAllKnowledgePosts();
  const index = new Map<string, LinkInfo>(
    posts.map((post) => {
      const key = `${categoryToSlug(post.category)}/${post.slug}`;
      return [
        key,
        { key, title: post.title, href: `/knowledge/${categoryToSlug(post.category)}/${post.slug}` },
      ];
    })
  );

  const series = ARTICLE_SERIES.find((s) => s.articleKeys.includes(articleKey));
  const seriesPosition = series ? series.articleKeys.indexOf(articleKey) : -1;
  const globalPosition = posts.findIndex(
    (p) => `${categoryToSlug(p.category)}/${p.slug}` === articleKey
  );

  let prev: LinkInfo | null = null;
  let next: LinkInfo | null = null;

  if (series && seriesPosition >= 0) {
    prev = series.articleKeys.slice(0, seriesPosition).reverse().map((k) => index.get(k)).find(Boolean) ?? null;
    next = series.articleKeys.slice(seriesPosition + 1).map((k) => index.get(k)).find(Boolean) ?? null;
  } else if (globalPosition >= 0) {
    // 列表按日期倒序，前一条是更新的文章
    prev = globalPosition > 0 ? index.get(`${categoryToSlug(posts[globalPosition - 1].category)}/${posts[globalPosition - 1].slug}`) ?? null : null;
    const newer = posts[globalPosition + 1];
    next = newer ? index.get(`${categoryToSlug(newer.category)}/${newer.slug}`) ?? null : null;
  }

  if (!prev && !next) return null;

  const seriesIndex =
    series?.indexKey && series.indexKey !== articleKey ? index.get(series.indexKey) : undefined;

  return (
    <nav
      aria-label="文章顺序导航"
      className="mt-12 border-t border-slate-200 pt-6 dark:border-slate-800"
    >
      {series && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Layers className="h-3.5 w-3.5" />
          <span>
            {series.name} · 第 {seriesPosition + 1} / {series.articleKeys.length} 篇
          </span>
          {seriesIndex && (
            <Link
              href={seriesIndex.href}
              className="text-blue-600 hover:underline dark:text-sky-400"
            >
              系列索引 →
            </Link>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {prev ? (
          <Link
            href={prev.href}
            className="group flex flex-1 flex-col gap-1 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
          >
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <ArrowLeft className="h-3.5 w-3.5" />
              {series ? "系列上一篇" : "更新的文章"}
            </span>
            <span className="line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-sky-400">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={next.href}
            className="group flex flex-1 flex-col gap-1 rounded-xl border border-slate-200 px-4 py-3 text-right transition-colors hover:border-blue-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
          >
            <span className="flex items-center justify-end gap-1 text-xs text-slate-400 dark:text-slate-500">
              {series ? "系列下一篇" : "更早的文章"}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <span className="line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-sky-400">
              {next.title}
            </span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </nav>
  );
}
