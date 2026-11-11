"use client";

import { useState } from "react";
import clsx from "clsx";

export type TagCloudItem = { tag: string; count: number };

/**
 * 全站共用的标签墙。
 *
 * 默认只渲染 count >= 2 的标签（当前 55 个），把 223 个只出现过一次的
 * 孤立标签收进「展开全部」。当前正在筛选的孤立标签即便被折叠也会强制显示，
 * 避免用户点开一个长尾标签后发现自己的筛选条件消失了。
 */
export default function TagCloud({
  tags,
  activeTag,
  onTagClick,
  dense = false,
}: {
  tags: TagCloudItem[];
  activeTag: string | null;
  onTagClick: (tag: string) => void;
  dense?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const primary = tags.filter((t) => t.count >= 2);
  const longTail = tags.filter((t) => t.count < 2);
  const activeLongTail =
    !expanded && activeTag
      ? longTail.filter((t) => t.tag === activeTag)
      : [];
  const visible = expanded ? tags : [...primary, ...activeLongTail];
  const hiddenCount = tags.length - primary.length;

  const chip = (isActive: boolean) =>
    clsx(
      "rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer",
      dense && "px-2.5 py-0.5 text-[11px]",
      isActive
        ? "border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100"
    );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {visible.map((tagInfo) => (
          <button
            key={tagInfo.tag}
            type="button"
            onClick={() => onTagClick(tagInfo.tag)}
            aria-pressed={activeTag === tagInfo.tag}
            className={chip(activeTag === tagInfo.tag)}
          >
            {tagInfo.tag}
            <span className="ml-1 opacity-60">{tagInfo.count}</span>
          </button>
        ))}
      </div>

      {hiddenCount > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="w-fit bg-transparent border-0 p-0 text-xs text-blue-600 hover:underline dark:text-sky-400 cursor-pointer"
          >
            {expanded ? "收起长尾标签 ↑" : `展开全部 ${tags.length} 个标签（另有 ${hiddenCount} 个长尾）↓`}
          </button>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            默认只显示被 2 篇以上文章共用的标签
          </span>
        </div>
      )}
    </div>
  );
}
