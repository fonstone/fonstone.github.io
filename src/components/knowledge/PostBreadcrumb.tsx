"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = {
  category: string;
  categorySlug: string;
};

export default function PostBreadcrumb({ category, categorySlug }: Props) {
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag");

  return (
    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
      <Link href={`/knowledge/${categorySlug}`} className="hover:text-blue-500 transition-colors">
        {category}
      </Link>
      <span className="text-slate-300 dark:text-slate-600">/</span>
      <Link href="/knowledge" className="hover:text-blue-500 transition-colors">全部</Link>
      {tag && (
        <>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <Link href={`/knowledge?tag=${tag}`} className="hover:text-blue-500 transition-colors">
            筛选
          </Link>
        </>
      )}
    </div>
  );
}