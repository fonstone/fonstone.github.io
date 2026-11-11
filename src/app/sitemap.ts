import type { MetadataRoute } from "next";
import {
  categoryToSlug,
  getAllKnowledgePosts,
} from "@/lib/knowledge/knowledge";
import {
  getAllProjectPosts,
  projectToSlug,
} from "@/lib/projects/projects";
import { absoluteUrl, toValidDate } from "@/lib/constants/site";
import { COURSES, COURSE_HUBS } from "@/lib/constants/courses";

export const dynamic = "force-static";

/** 课程与 hub 的 URL 全部从 courses.ts 派生，不再扫描 page.tsx 目录 */
function getStaticProjectPages(): string[] {
  return [
    ...COURSE_HUBS.map((h) => `/projects/${h.slug}`),
    ...COURSES.map((c) => `/projects/${c.slug}`),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [knowledgePosts, projectPosts] = await Promise.all([
    getAllKnowledgePosts(),
    getAllProjectPosts(),
  ]);
  const staticProjectPages = getStaticProjectPages();

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/start"), changeFrequency: "monthly", priority: 0.95 },
    { url: absoluteUrl("/knowledge"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/projects"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/search"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/papers"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/progress"), changeFrequency: "monthly", priority: 0.3 },
  ];

  const categorySlugs = new Set<string>();
  for (const post of knowledgePosts) {
    const catSlug = categoryToSlug(post.category);
    categorySlugs.add(catSlug);
    entries.push({
      url: absoluteUrl(`/knowledge/${catSlug}/${post.slug}`),
      lastModified: toValidDate(post.date),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const catSlug of categorySlugs) {
    entries.push({
      url: absoluteUrl(`/knowledge/${catSlug}`),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const page of staticProjectPages) {
    entries.push({
      url: absoluteUrl(page),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const post of projectPosts) {
    entries.push({
      url: absoluteUrl(`/projects/${projectToSlug(post.project)}/${post.slug}`),
      lastModified: toValidDate(post.date),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
