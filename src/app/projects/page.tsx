import Link from "next/link";
import { getProjectCategories } from "@/lib/projects/projects";

export default async function ProjectsIndexPage() {
  const categories = await getProjectCategories();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 pb-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Link href="/" className="hover:text-blue-500 transition-colors">
            主页
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">项目空间</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          项目空间
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {categories.length} 个项目页签
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/projects/${cat.slug}`}
            className="group flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                {cat.project}
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {cat.posts.length} 篇
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {cat.posts.slice(0, 3).map((p) => (
                <span
                  key={p.slug}
                  className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1"
                >
                  · {p.title}
                </span>
              ))}
              {cat.posts.length > 3 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  还有 {cat.posts.length - 3} 篇...
                </span>
              )}
            </div>
          </Link>
        ))}
        {categories.length === 0 && (
          <div className="text-slate-500 dark:text-slate-400 col-span-full text-center">
            未检测到项目内容。请在 projects/ 下创建项目文件夹与 .mdx 文件。
          </div>
        )}
      </div>
    </div>
  );
}
