import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  Layers,
  Sparkles,
} from "lucide-react";
import { getAllKnowledgePosts, categoryToSlug } from "@/lib/knowledge/knowledge";
import {
  COURSES,
  COURSE_HUBS,
  getHubMeta,
} from "@/lib/constants/courses";
import {
  ARTICLE_SERIES,
  LEARNING_TRACKS,
} from "@/lib/constants/learningMap";
import { getStackData } from "@/lib/learningMapData";
import SystemStack from "@/components/SystemStack";

export const metadata: Metadata = {
  title: "从这里开始",
  description:
    "StoneFon 的阅读路线图：沿系统启动、内核调度、异构计算到智能系统五层栈，串起技术长文、招牌系列与可动手的课程。",
  alternates: { canonical: "/start" },
};

type ArticleLink = { key: string; title: string; href: string };

export default async function StartPage() {
  const [allPosts, stackData] = await Promise.all([
    getAllKnowledgePosts(),
    getStackData(),
  ]);

  const articleMap = new Map<string, ArticleLink>();
  for (const post of allPosts) {
    const key = `${categoryToSlug(post.category)}/${post.slug}`;
    articleMap.set(key, {
      key,
      title: post.title,
      href: `/knowledge/${categoryToSlug(post.category)}/${post.slug}`,
    });
  }
  const resolve = (keys: string[]) =>
    keys.map((k) => articleMap.get(k)).filter((v): v is ArticleLink => Boolean(v));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
      {/* Hero */}
      <header className="mb-14 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-8 md:p-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-sky-400">
          <Compass className="h-3.5 w-3.5" />
          阅读路线图
        </div>
        <h1 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          从内核到智能系统，
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            从这里开始
          </span>
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
          这里不是按日期排的文章列表。整个空间只讲一件事：当 AI 任务
          落到真实的操作系统和硬件上，每一层分别要解决什么问题。下面这条五层系统栈，
          把 {allPosts.length} 篇长文和 {COURSES.length} 门课程放在了它们该在的位置。
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            <strong className="text-lg font-semibold text-slate-900 dark:text-slate-100">{allPosts.length}</strong> 篇技术长文
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            <strong className="text-lg font-semibold text-slate-900 dark:text-slate-100">{COURSES.length}</strong> 门可动手课程
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            <strong className="text-lg font-semibold text-slate-900 dark:text-slate-100">{LEARNING_TRACKS.length}</strong> 层系统栈
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            <strong className="text-lg font-semibold text-slate-900 dark:text-slate-100">{ARTICLE_SERIES.length}</strong> 条招牌系列
          </span>
        </div>
      </header>

      {/* 分层系统栈 */}
      <section className="mb-16">
        <div className="mb-7 flex items-center gap-3">
          <Layers className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            五层系统栈
          </h2>
          <span className="ml-auto hidden text-xs text-slate-400 dark:text-slate-500 sm:block">
            从下往上读，每一层都有配套课程
          </span>
        </div>

        <SystemStack tracks={stackData} />
      </section>

      {/* 招牌系列 */}
      <section className="mb-16">
        <div className="mb-7 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            四条招牌系列
          </h2>
          <span className="ml-auto hidden text-xs text-slate-400 dark:text-slate-500 sm:block">
            成组写就，按顺序读
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ARTICLE_SERIES.map((series) => {
            const articles = resolve(series.articleKeys);
            const indexArticle = series.indexKey ? articleMap.get(series.indexKey) : undefined;
            const entry = indexArticle ?? articles[0];
            if (!entry) return null;
            return (
              <div
                key={series.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`text-lg font-semibold bg-gradient-to-r ${series.accent} bg-clip-text text-transparent`}>
                    {series.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {articles.length} 篇
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {series.description}
                </p>
                <Link
                  href={entry.href}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:gap-2.5 transition-all dark:text-sky-400"
                >
                  {indexArticle ? `读系列索引《${indexArticle.title}》` : `从《${entry.title}》开始`}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <ul className="mt-1 flex flex-col gap-1 border-t border-slate-200 pt-3 dark:border-slate-800">
                  {articles.slice(0, 3).map((article) => (
                    <li key={article.key}>
                      <Link
                        href={article.href}
                        className="line-clamp-1 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400"
                      >
                        · {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* 全部课程 */}
      <section className="mb-12">
        <div className="mb-7 flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-emerald-500" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            全部课程
          </h2>
          <Link
            href="/projects"
            className="ml-auto text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400"
          >
            课程总览 →
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {COURSE_HUBS.map((hub) => (
            <div
              key={hub.slug}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6"
            >
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {hub.title}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {hub.description}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {hub.courseSlugs.map((slug) => {
                  const course = COURSES.find((c) => c.slug === slug);
                  if (!course) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/projects/${slug}`}
                      className="group rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800 group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-sky-400">
                          {course.shortTitle}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                          {course.level}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                        {course.description}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6">
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              车载与功能安全
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {COURSES.filter((c) => !getHubMeta(c.hub)).map((course) => (
                <Link
                  key={course.slug}
                  href={`/projects/${course.slug}`}
                  className="group rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-sky-400">
                      {course.shortTitle}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                      {course.level}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {course.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 底部出口 */}
      <footer className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-8 text-center">
        <BookOpen className="h-5 w-5 text-slate-400" />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          想按分类慢慢翻，去知识空间；想按章节动手做，去课程总览。
        </p>
        <div className="flex gap-2">
          <Link
            href="/knowledge"
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:text-slate-300 dark:hover:text-sky-400 transition-colors"
          >
            知识空间
          </Link>
          <Link
            href="/projects"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
          >
            课程总览
          </Link>
        </div>
      </footer>
    </main>
  );
}
