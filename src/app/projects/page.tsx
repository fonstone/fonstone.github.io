import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, GraduationCap } from "lucide-react";
import { getProjectCategories } from "@/lib/projects/projects";
import {
  COURSES,
  COURSE_HUBS,
  getHubMeta,
} from "@/lib/constants/courses";

export const metadata: Metadata = {
  title: "课程总览",
  description:
    "按章节组织的技术课程，涵盖 AI Agent、AI Infra、AUTOSAR、ChCore、QEMU、RDMA 与 Rust 操作系统，共 8 门。",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsIndexPage() {
  const categories = await getProjectCategories();
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  const groups = [
    ...COURSE_HUBS.map((hub) => ({
      key: hub.slug,
      title: hub.title,
      description: hub.description,
      href: `/projects/${hub.slug}`,
      courses: hub.courseSlugs
        .map((slug) => COURSES.find((c) => c.slug === slug))
        .filter((c): c is (typeof COURSES)[number] => Boolean(c)),
    })),
    {
      key: "standalone",
      title: "车载与功能安全",
      description: "把系统栈放进一辆车里，处理时序、通信与功能安全约束。",
      href: null,
      courses: COURSES.filter((c) => !getHubMeta(c.hub)),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 pb-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Link href="/" className="hover:text-blue-500 transition-colors">
            主页
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">课程空间</span>
        </nav>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            课程总览
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {COURSES.length} 门课程、{categories.reduce((n, c) => n + c.posts.length, 0)} 个章节，按系统栈分组。
          不确定顺序的话，先看
          <Link href="/start" className="mx-1 text-blue-600 hover:underline dark:text-sky-400">
            阅读路线图
          </Link>
          。
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {group.title}
              <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                {group.courses.length} 门
              </span>
            </h2>
            {group.href && (
              <Link
                href={group.href}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-sky-400"
              >
                进入分组 <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{group.description}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.courses.map((course) => {
              const cat = bySlug.get(course.slug);
              const count = cat?.posts.length ?? 0;
              return (
                <Link
                  key={course.slug}
                  href={`/projects/${course.slug}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 transition-colors">
                      {course.title}
                    </h3>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                      {count} 章
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
                      {course.level}
                    </span>
                    <span>按 {count} 章推进</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                  <div className="flex flex-col gap-1 mt-1">
                    {cat?.posts.slice(0, 2).map((p) => (
                      <span
                        key={p.slug}
                        className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1"
                      >
                        · {p.title}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
