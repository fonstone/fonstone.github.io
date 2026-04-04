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

export default function KnowledgeSidebar({ data, tags }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

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
    <nav className="flex flex-col gap-6">
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          分类
        </h3>
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
                      "h-9 w-9 shrink-0 rounded-lg text-sm text-gray-500 hover:bg-gray-100",
                      isActiveCategory && "bg-gray-100"
                    )}
                    aria-label={isOpen ? "折叠分类" : "展开分类"}
                  >
                    {isOpen ? "−" : "+"}
                  </button>
                  <Link
                    href={categoryHref}
                    className={clsx(
                      "flex-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100",
                      isActiveCategory && "bg-gray-100 text-gray-900"
                    )}
                  >
                    {cat.category}
                    <span className="ml-2 text-xs text-gray-400">
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
                            "rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                            isActive && "bg-gray-100 text-gray-900"
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
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          标签
        </h3>
        <div className="flex flex-wrap gap-2">
          {activeTag && (
            <button
              type="button"
              onClick={clearTagFilter}
              className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs text-red-600 hover:bg-red-100 transition-colors"
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
                    ? "border-gray-300 bg-gray-100 text-gray-900"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900"
                )}
              >
                {tagInfo.tag}
                <span className="ml-1 opacity-60">{tagInfo.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
