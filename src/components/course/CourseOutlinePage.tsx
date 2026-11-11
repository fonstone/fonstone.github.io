import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, ListTree } from "lucide-react";
import CourseCard from "@/components/course/CourseCard";
import CourseProgressBar from "@/components/course/CourseProgress";
import { getProjectCategories, isCourseIndex } from "@/lib/projects/projects";
import {
  getAllKnowledgePosts,
  categoryToSlug,
} from "@/lib/knowledge/knowledge";
import {
  getCourseMeta,
  getHubMeta,
} from "@/lib/constants/courses";

/**
 * 所有课程聚合页共用的渲染组件。元数据、难度、前置要求、成果物、配套文章
 * 全部来自 src/lib/constants/courses.ts，章节来自 projects/ 目录。
 */
export default async function CourseOutlinePage({ slug }: { slug: string }) {
  const meta = getCourseMeta(slug);
  if (!meta) notFound();

  const [categories, allPosts] = await Promise.all([
    getProjectCategories(),
    getAllKnowledgePosts(),
  ]);
  const current = categories.find((c) => c.slug === slug);
  if (!current) notFound();

  const indexChapters = current.posts.filter((p) => isCourseIndex(p.slug));
  const chapters = current.posts.filter((p) => !isCourseIndex(p.slug));
  const firstChapter = chapters[0] ?? current.posts[0];
  const hub = getHubMeta(meta.hub);

  const articleMap = new Map(
    allPosts.map((p) => [
      `${categoryToSlug(p.category)}/${p.slug}`,
      { title: p.title, href: `/knowledge/${categoryToSlug(p.category)}/${p.slug}` },
    ])
  );
  const relatedArticles = meta.relatedArticles
    .map((key) => articleMap.get(key))
    .filter((v): v is { title: string; href: string } => Boolean(v));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2">
          <Link href="/projects" className="hover:text-blue-500 transition-colors">
            课程空间
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          {hub ? (
            <>
              <Link href={`/projects/${hub.slug}`} className="hover:text-blue-500 transition-colors">
                {hub.title}
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
            </>
          ) : null}
          <span className="text-slate-500 dark:text-slate-400">{meta.shortTitle}</span>
        </nav>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-sky-400">
              {meta.level}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              共 {chapters.length} 章
            </span>
          </div>

          <h1 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {meta.title}
          </h1>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            {meta.description}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <BookOpen className="h-3.5 w-3.5" />
                前置要求
              </div>
              <ul className="flex flex-col gap-1">
                {meta.prerequisites.map((item) => (
                  <li key={item} className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                学完能拿到
              </div>
              <ul className="flex flex-col gap-1">
                {meta.outcomes.map((item) => (
                  <li key={item} className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              本地学习进度（保存在浏览器）
            </div>
            <CourseProgressBar projectSlug={slug} total={chapters.length} />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {firstChapter && (
              <Link
                href={`/projects/${slug}/${firstChapter.slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                开始学习 <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {indexChapters[0] && (
              <Link
                href={`/projects/${slug}/${indexChapters[0].slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:text-slate-300 dark:hover:text-sky-400 transition-colors"
              >
                <ListTree className="h-4 w-4" />
                课程总纲
              </Link>
            )}
            <Link
              href="/start"
              className="text-sm text-slate-400 hover:text-blue-500 dark:text-slate-500 transition-colors"
            >
              回到阅读路线图
            </Link>
          </div>
        </div>
      </header>

      {relatedArticles.length > 0 && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6">
          <h2 className="mb-1 text-base font-semibold text-slate-800 dark:text-slate-200">
            配套阅读
          </h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            先看知识空间里的工程账，再回到课程动手做实验。
          </p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {relatedArticles.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                <span className="line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-sky-400">
                  {a.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          课程目录
        </h2>
        {chapters.map((chapter) => (
          <CourseCard
            key={chapter.slug}
            chapter={{
              slug: chapter.slug,
              title: chapter.title,
              description: chapter.description,
              tags: chapter.tags,
              est_time: chapter.est_time,
              order: chapter.order,
            }}
            projectSlug={slug}
          />
        ))}
      </div>
    </div>
  );
}
