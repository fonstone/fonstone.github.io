import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectMdx from "@/components/projects/ProjectMdx";
import {
  getProjectPost,
  getProjectStaticParams,
  extractProjectHeadings,
  slugToProject,
  projectToSlug,
  getProjectCategories,
} from "@/lib/projects/projects";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getProjectStaticParams();
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

  return (
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
              {post.project}
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

        <div className="prose max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-a:text-blue-600 dark:prose-a:text-sky-400 prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-code:text-slate-900 dark:prose-code:text-slate-100 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800 prose-hr:border-slate-200 dark:prose-hr:border-slate-800 prose-thead:border-b-slate-200 dark:prose-thead:border-b-slate-800 prose-th:text-slate-900 dark:prose-th:text-slate-100 prose-td:text-slate-700 dark:prose-td:text-slate-300">
          <ProjectMdx source={mdxSource} />
        </div>

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
      </article>

      {headings.length > 0 && (
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-8">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm p-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                目录
              </h3>
              <nav className="flex flex-col gap-1.5 max-h-[70vh] overflow-y-auto">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors line-clamp-1"
                    style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
