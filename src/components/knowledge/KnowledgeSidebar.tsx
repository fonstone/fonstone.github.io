"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";

export type KnowledgeSidebarData = Array<{
  category: string;
  slug: string;
  posts: Array<{
    slug: string;
    title: string;
  }>;
}>;

export type KnowledgeTagData = Array<{
  tag: string;
  count: number;
}>;

type Props = {
  data: KnowledgeSidebarData;
  tags: KnowledgeTagData;
};

type ViewMode = "categories" | "tags";

export default function KnowledgeSidebar({ data, tags }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("categories");

  const initialOpen = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const activeCategory = segments[1];
    return new Set(activeCategory ? [activeCategory] : []);
  }, [pathname]);

  const [open, setOpen] = useState<Set<string>>(initialOpen);

  const activeTag = searchParams.get("tag") || null;

  function handleTagClick(tag: string) {
    if (activeTag === tag) {
      router.replace(pathname);
    } else {
      router.replace(`${pathname}?tag=${encodeURIComponent(tag)}`);
    }
  }

  function clearTagFilter() {
    router.replace(pathname);
  }

  return (
    <nav className="flex flex-col gap-4">
      <div className="flex rounded-lg bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setViewMode("categories")}
          className={clsx(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "categories"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white/80"
          )}
        >
          分类
        </button>
        <button
          type="button"
          onClick={() => setViewMode("tags")}
          className={clsx(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "tags"
              ? "bg-white/10 text-white"
              : "text-white/50 hover:text-white/80"
          )}
        >
          标签
        </button>
      </div>

      {viewMode === "categories" ? (
        <div className="flex flex-col gap-2">
          {data.map((cat) => {
            const isOpen = open.has(cat.slug);
            const categoryHref = `/knowledge/${cat.slug}`;
            const isActiveCategory =
              pathname === categoryHref || pathname.startsWith(`${categoryHref}/`);

            return (
              <section key={cat.slug} className="rounded-lg">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen((prev) => {
                        const next = new Set(prev);
                        if (next.has(cat.slug)) next.delete(cat.slug);
                        else next.add(cat.slug);
                        return next;
                      });
                    }}
                    className={clsx(
                      "h-9 w-9 shrink-0 rounded-lg text-sm hover:bg-white/5",
                      isActiveCategory && "bg-white/5"
                    )}
                    aria-label={isOpen ? "折叠分类" : "展开分类"}
                  >
                    {isOpen ? "−" : "+"}
                  </button>
                  <Link
                    href={categoryHref}
                    className={clsx(
                      "flex-1 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/5",
                      isActiveCategory && "bg-white/5"
                    )}
                  >
                    {cat.category}
                    <span className="ml-2 text-xs text-white/50">
                      {cat.posts.length}
                    </span>
                  </Link>
                </div>

                {isOpen && (
                  <div className="mt-1 flex flex-col gap-1 pl-11">
                    {cat.posts.map((post) => {
                      const href = `/knowledge/${cat.slug}/${post.slug}`;
                      const isActive = pathname === href;
                      return (
                        <Link
                          key={post.slug}
                          href={href}
                          className={clsx(
                            "rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white",
                            isActive && "bg-white/5 text-white"
                          )}
                        >
                          {post.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {activeTag && (
            <button
              type="button"
              onClick={clearTagFilter}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
            >
              ✕ 清除筛选
            </button>
          )}
          {tags.map((tagInfo) => {
            const isActive = activeTag === tagInfo.tag;
            return (
              <button
                key={tagInfo.tag}
                type="button"
                onClick={() => handleTagClick(tagInfo.tag)}
                className={clsx(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  isActive
                    ? "border-white/30 bg-white/15 text-white"
                    : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                )}
              >
                {tagInfo.tag}
                <span className="ml-1 opacity-60">{tagInfo.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
