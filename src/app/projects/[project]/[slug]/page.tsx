import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectMdx from "@/components/projects/ProjectMdx";
import MarkCompleteButton from "@/components/course/MarkCompleteButton";
import { ChapterFooterLinks } from "@/components/RelatedContent";
import ArticleEnhancements from "@/components/reading/ArticleEnhancements";
import TocRail from "@/components/reading/TocRail";
import { getCourseMeta } from "@/lib/constants/courses";
import {
  getProjectPost,
  getProjectStaticParams,
  extractProjectHeadings,
  slugToProject,
  projectToSlug,
  getProjectCategories,
  isChapterIndex,
} from "@/lib/projects/projects";
import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  toValidDate,
} from "@/lib/constants/site";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getProjectStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ project: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const project = slugToProject(resolvedParams.project);
  const data = await getProjectPost({ ...resolvedParams, project });
  if (!data) return { title: "章节不存在" };

  const { post } = data;
  const pathname = `/projects/${projectToSlug(post.project)}/${post.slug}`;
  const description = post.description ?? `${post.project} 课程章节，${post.title}`;

  return {
    title: post.title,
    description,
    keywords: post.tags,
    alternates: { canonical: pathname },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: absoluteUrl(pathname),
      siteName: SITE_NAME,
      locale: "zh_CN",
      publishedTime: toValidDate(post.date)?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default async function ProjectPostPage({
  params,
}: {
  params: Promise<{ project: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const project = slugToProject(resolvedParams.project);
  const data = await getProjectPost({ ...resolvedParams, project });
  if (!data) notFound();

  const { post, mdxSource } = data;
  const headings = extractProjectHeadings(mdxSource);
  const projSlug = projectToSlug(post.project);

  const categories = await getProjectCategories();
  const current = categories.find((c) => c.slug === projSlug);
  const posts = current?.posts ?? [];
  const idx = posts.findIndex((p) => p.slug === post.slug);
  const prev = idx > 0 ? posts[idx - 1] : null;
  const next = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null;
  const pathname = `/projects/${projSlug}/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: post.title,
    description: post.description ?? SITE_DESCRIPTION,
    datePublished: toValidDate(post.date)?.toISOString(),
    inLanguage: "zh-CN",
    keywords: post.tags.join(", "),
    author: { "@type": "Person", name: SITE_AUTHOR, url: SITE_URL },
    isPartOf: {
      "@type": "Course",
      name: post.project,
      url: absoluteUrl(`/projects/${projSlug}`),
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(pathname) },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div className="flex gap-8">
      <article className="flex-1 min-w-0">
        <header className="flex flex-col gap-3 mb-8">
          <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <Link href="/projects" className="hover:text-blue-500 transition-colors">
              项目空间
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <Link
              href={`/projects/${projSlug}`}
              className="hover:text-blue-500 transition-colors"
            >
              {getCourseMeta(projSlug)?.shortTitle ?? post.project}
            </Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-500 dark:text-slate-400 line-clamp-1">
              {post.title}
            </span>
          </nav>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {post.title}
          </h1>

          {post.description && (
            <p className="text-base text-slate-500 dark:text-slate-400">
              {post.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {post.date && <span>{post.date}</span>}
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-2 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div className="prose max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-a:text-blue-600 dark:prose-a:text-sky-400 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-hr:border-slate-200 dark:prose-hr:border-slate-800">
          <ProjectMdx source={mdxSource} format={post.filePath.endsWith(".mdx") ? "mdx" : "md"} />
        </div>

        {!isChapterIndex(post.slug) && (
          <div className="mt-8 flex justify-center">
            <MarkCompleteButton projectSlug={projSlug} chapterSlug={post.slug} />
          </div>
        )}

        {(prev || next) && (
          <nav className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
            {prev ? (
              <Link
                href={`/projects/${projSlug}/${prev.slug}`}
                className="group flex flex-col gap-1 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1"
              >
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  ← 上一篇
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {next ? (
              <Link
                href={`/projects/${projSlug}/${next.slug}`}
                className="group flex flex-col gap-1 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 sm:items-end"
              >
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  下一篇 →
                </span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">
                  {next.title}
                </span>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </nav>
        )}

        <ChapterFooterLinks courseSlug={projSlug} />
        <ArticleEnhancements />
      </article>

      {headings.length > 0 && <TocRail headings={headings} />}
      </div>
    </>
  );
}
