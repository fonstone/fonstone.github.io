import type { Metadata } from "next";
import CourseOutlinePage from "@/components/course/CourseOutlinePage";
import {
  COURSE_SLUGS,
  getCourseMeta,
} from "@/lib/constants/courses";
import { SITE_DESCRIPTION } from "@/lib/constants/site";

export const dynamicParams = false;

/**
 * 所有课程聚合页共用一个动态路由。
 * 新增课程只需在 src/lib/constants/courses.ts 的 COURSES 里加一条，
 * 页面、sitemap、导航、路线图会自动出现，无需新建 page.tsx。
 */
export function generateStaticParams() {
  return COURSE_SLUGS.map((project) => ({ project }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ project: string }>;
}): Promise<Metadata> {
  const { project } = await params;
  const meta = getCourseMeta(project);
  if (!meta) return { title: "课程不存在", description: SITE_DESCRIPTION };

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/projects/${meta.slug}` },
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.description,
      url: `/projects/${meta.slug}`,
      locale: "zh_CN",
    },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  return <CourseOutlinePage slug={project} />;
}
