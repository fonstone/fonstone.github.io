import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Layers } from "lucide-react";
import { getAllKnowledgePosts, categoryToSlug } from "@/lib/knowledge/knowledge";
import { COURSES, getRelatedCourses } from "@/lib/constants/courses";
import { ARTICLE_SERIES } from "@/lib/constants/learningMap";

type ArticleLink = { key: string; title: string; href: string };

async function articleIndex(): Promise<Map<string, ArticleLink>> {
  const posts = await getAllKnowledgePosts();
  return new Map(
    posts.map((p) => {
      const key = `${categoryToSlug(p.category)}/${p.slug}`;
      return [
        key,
        { key, title: p.title, href: `/knowledge/${categoryToSlug(p.category)}/${p.slug}` },
      ];
    })
  );
}

function SectionTitle({
  Icon,
  children,
}: {
  Icon: typeof BookOpen;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
      <Icon className="h-4 w-4 text-blue-500" />
      {children}
    </div>
  );
}

/**
 * 文章详情页底部：把「读完综述」导流到「动手做实验」，并串起同一系列的其它文章。
 * 课程关联来自 courses.ts 的 relatedArticles，反向派生，不需要维护第二份映射。
 */
export async function ArticleFooterLinks({ articleKey }: { articleKey: string }) {
  const courses = getRelatedCourses(articleKey);
  const series = ARTICLE_SERIES.find((s) => s.articleKeys.includes(articleKey));
  if (courses.length === 0 && !series) return null;

  const index = await articleIndex();

  return (
    <aside className="mt-14 flex flex-col gap-5 border-t border-slate-200 dark:border-slate-800 pt-8">
      {courses.length > 0 && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6">
          <SectionTitle Icon={GraduationCap}>配套课程 · 动手做一遍</SectionTitle>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            这篇讲清了原理，下面这门课把同一条链路拆成可运行的章节。
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {courses.map((course) => (
              <Link
                key={course.slug}
                href={`/projects/${course.slug}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <span className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-slate-800 group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-sky-400">
                    {course.title}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {course.level} · {course.outcomes[0]}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {series && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6">
          <SectionTitle Icon={Layers}>
            同系列 · {series.name}（{series.articleKeys.length} 篇）
          </SectionTitle>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {series.articleKeys
              .filter((key) => key !== articleKey)
              .map((key) => index.get(key))
              .filter((a): a is ArticleLink => Boolean(a))
              .map((a) => (
                <Link
                  key={a.key}
                  href={a.href}
                  className="line-clamp-1 rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                >
                  · {a.title}
                </Link>
              ))}
          </div>
          {series.indexKey && series.indexKey !== articleKey && index.get(series.indexKey) && (
            <Link
              href={index.get(series.indexKey)!.href}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-sky-400"
            >
              <Layers className="h-3.5 w-3.5" />
              读系列索引《{index.get(series.indexKey)!.title}》
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </section>
      )}

      <Link
        href="/start"
        className="inline-flex w-fit items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-sky-400"
      >
        <BookOpen className="h-3.5 w-3.5" />
        看完整阅读路线图
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </aside>
  );
}

/** 课程章节页底部：导流回知识空间的技术长文 */
export async function ChapterFooterLinks({ courseSlug }: { courseSlug: string }) {
  const course = COURSES.find((c) => c.slug === courseSlug);
  if (!course || course.relatedArticles.length === 0) return null;

  const index = await articleIndex();
  const articles = course.relatedArticles
    .slice(0, 4)
    .map((key) => index.get(key))
    .filter((a): a is ArticleLink => Boolean(a));
  if (articles.length === 0) return null;

  return (
    <aside className="mt-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-6">
      <SectionTitle Icon={BookOpen}>配套阅读 · 回到原理</SectionTitle>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        《{course.shortTitle}》对应的知识空间长文，讲这一层为什么要这么设计。
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {articles.map((a) => (
          <Link
            key={a.key}
            href={a.href}
            className="line-clamp-2 rounded-lg px-3 py-2 text-xs leading-relaxed text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400"
          >
            · {a.title}
          </Link>
        ))}
      </div>
      <Link
        href={`/projects/${courseSlug}`}
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-sky-400"
      >
        回到课程目录 <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </aside>
  );
}
