"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

type Props = {
  data: KnowledgeSidebarData;
};

export default function KnowledgeSidebar({ data }: Props) {
  const pathname = usePathname();

  const initialOpen = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const activeCategory = segments[1];
    return new Set(activeCategory ? [activeCategory] : []);
  }, [pathname]);

  const [open, setOpen] = useState<Set<string>>(initialOpen);

  return (
    <nav className="flex flex-col gap-2">
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
    </nav>
  );
}
