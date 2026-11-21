import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { getProjectCategories } from "@/lib/projects/projects";
import { COURSES } from "@/lib/constants/courses";

export default async function ProjectsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const categories = await getProjectCategories();

  return (
    <div
      className="mx-auto w-full max-w-7xl font-sans px-0 md:px-6 text-slate-900 dark:text-slate-100"
      style={
        {
          "--font-sans":
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-transparent">
        <div className="flex flex-col md:grid md:grid-cols-[240px_minmax(0,1fr)] gap-0">
          <aside className="border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl md:rounded-r-none md:rounded-l-2xl">
            <div className="p-4 md:p-6 md:sticky md:top-[88px]">
              <div className="mb-6 flex items-center justify-between gap-2">
                <Link
                  href="/start"
                  className="text-sm font-medium text-slate-500 hover:text-blue-500 dark:text-slate-400 transition-colors"
                >
                  ← 阅读路线图
                </Link>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  课程空间
                </span>
              </div>

              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                课程目录
              </h3>
              <nav className="flex flex-col gap-2">
                {categories.map((cat) => {
                  const href = `/projects/${cat.slug}`;
                  const meta = COURSES.find((c) => c.slug === cat.slug);
                  return (
                    <div key={cat.slug} className="rounded-lg">
                      <Link
                        href={href}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>{meta?.shortTitle ?? cat.project}</span>
                        <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                          {cat.posts.length}
                        </span>
                      </Link>
                    </div>
                  );
                })}
                {categories.length === 0 && (
                  <div className="text-xs text-slate-400 dark:text-slate-500 px-3 py-2">
                    未检测到项目内容。
                  </div>
                )}
              </nav>
            </div>
          </aside>
          <section className="p-4 md:p-8 lg:p-10">{children}</section>
        </div>
      </div>
    </div>
  );
}
