import { categoryToSlug, getAllKnowledgePosts } from "@/lib/knowledge/knowledge";
import { getProjectCategories } from "@/lib/projects/projects";
import { COURSES } from "@/lib/constants/courses";
import { LEARNING_TRACKS } from "@/lib/constants/learningMap";

export type StackTrackData = {
  id: string;
  step: string;
  name: string;
  subtitle: string;
  description: string;
  accent: string;
  articles: { key: string; title: string; href: string }[];
  courses: { slug: string; shortTitle: string; level: string; chapterCount: number }[];
};

/** 分层栈的数据全部从内容目录实时派生，不维护第二份清单 */
export async function getStackData(): Promise<StackTrackData[]> {
  const [posts, categories] = await Promise.all([
    getAllKnowledgePosts(),
    getProjectCategories(),
  ]);
  const articleIndex = new Map(
    posts.map((post) => {
      const key = `${categoryToSlug(post.category)}/${post.slug}`;
      return [key, { key, title: post.title, href: `/knowledge/${key}` }];
    })
  );
  const chapterCounts = new Map(categories.map((c) => [c.slug, c.posts.length]));

  return LEARNING_TRACKS.map((track) => ({
    id: track.id,
    step: track.step,
    name: track.name,
    subtitle: track.subtitle,
    description: track.description,
    accent: track.accent,
    articles: track.articleKeys
      .map((key) => articleIndex.get(key))
      .filter((a): a is { key: string; title: string; href: string } => Boolean(a)),
    courses: track.courseSlugs
      .map((slug) => COURSES.find((c) => c.slug === slug))
      .filter((c): c is (typeof COURSES)[number] => Boolean(c))
      .map((c) => ({
        slug: c.slug,
        shortTitle: c.shortTitle,
        level: c.level,
        chapterCount: chapterCounts.get(c.slug) ?? 0,
      })),
  }));
}
