"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

type Heading = {
  id: string;
  text: string;
  level: number;
};

type Props = {
  headings: Heading[];
};

export default function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">目录</h3>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={clsx(
                "block text-sm py-1 hover:text-blue-500 transition-colors truncate",
                h.level === 2 && "pl-3 text-slate-500 dark:text-slate-400",
                h.level === 3 && "pl-6 text-slate-400 dark:text-slate-500",
                activeId === h.id && "text-blue-500 font-medium"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
