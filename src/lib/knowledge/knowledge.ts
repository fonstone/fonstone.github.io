import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type KnowledgePostFrontmatter = {
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  draft?: boolean;
};

export type KnowledgeHeading = {
  id: string;
  text: string;
  level: number;
};

export type KnowledgePost = {
  category: string;
  slug: string;
  filePath: string;
  title: string;
  description?: string;
  date?: string;
  tags: string[];
  draft: boolean;
  updatedAtMs: number;
};

export type KnowledgeCategory = {
  category: string;
  slug: string;
  posts: KnowledgePost[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

const CATEGORY_SLUG_MAP: Record<string, string> = {
  "自动驾驶": "autonomous-driving",
  "生活": "life",
  "AI": "ai",
  "OS": "os",
};

const SLUG_TO_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_MAP).map(([k, v]) => [v, k])
);

export function categoryToSlug(category: string): string {
  return CATEGORY_SLUG_MAP[category] || category;
}

export function slugToCategory(slug: string): string {
  return SLUG_TO_CATEGORY_MAP[slug] || slug;
}

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function toSlug(fileName: string) {
  return fileName
    .replace(/\.(md|mdx)$/i, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

async function walkFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)));
      continue;
    }
    if (!/\.(md|mdx)$/i.test(entry.name)) continue;
    files.push(full);
  }

  return files;
}

export async function getKnowledgeCategories(): Promise<KnowledgeCategory[]> {
  if (!(await pathExists(CONTENT_ROOT))) return [];

  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  const categoriesList = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const customOrder = ["生活"];
  const insertBefore = ["自动驾驶"];
  for (const cat of customOrder) {
    const idx = categoriesList.indexOf(cat);
    if (idx !== -1) {
      categoriesList.splice(idx, 1);
      categoriesList.push(cat);
    }
  }
  for (const cat of insertBefore) {
    const idx = categoriesList.indexOf(cat);
    if (idx !== -1) {
      categoriesList.splice(idx, 1);
      const lifeIdx = categoriesList.indexOf("生活");
      categoriesList.splice(lifeIdx !== -1 ? lifeIdx : categoriesList.length, 0, cat);
    }
  }

  const categories = categoriesList;

  const result: KnowledgeCategory[] = [];

  for (const category of categories) {
    const categoryDir = path.join(CONTENT_ROOT, category);
    const filePaths = await walkFiles(categoryDir);
    const posts: KnowledgePost[] = [];

    for (const filePath of filePaths) {
      const stat = await fs.stat(filePath);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      const fm = (parsed.data ?? {}) as KnowledgePostFrontmatter;
      const fileName = path.basename(filePath);
      const slug = toSlug(fileName);

      const title = (typeof fm.title === "string" && fm.title.trim()) || slug;
      const description =
        typeof fm.description === "string" ? fm.description.trim() : undefined;
      const date = typeof fm.date === "string" ? fm.date : undefined;
      const tags = Array.isArray(fm.tags) ? fm.tags.filter(Boolean) : [];
      const draft = Boolean(fm.draft);

      posts.push({
        category,
        slug,
        filePath,
        title,
        description,
        date,
        tags,
        draft,
        updatedAtMs: stat.mtimeMs,
      });
    }

    posts.sort((a, b) => {
      const ad = a.date ? Date.parse(a.date) : Number.NaN;
      const bd = b.date ? Date.parse(b.date) : Number.NaN;
      if (!Number.isNaN(ad) && !Number.isNaN(bd)) return bd - ad;
      if (!Number.isNaN(ad) && Number.isNaN(bd)) return -1;
      if (Number.isNaN(ad) && !Number.isNaN(bd)) return 1;
      return b.updatedAtMs - a.updatedAtMs;
    });

    result.push({ category, slug: categoryToSlug(category), posts: posts.filter((p) => !p.draft) });
  }

  return result.filter((c) => c.posts.length > 0);
}

export type KnowledgeTagInfo = {
  tag: string;
  count: number;
  posts: KnowledgePost[];
};

export async function getAllKnowledgePosts(): Promise<KnowledgePost[]> {
  const categories = await getKnowledgeCategories();
  return categories.flatMap((c) => c.posts);
}

export async function getAllTags(): Promise<KnowledgeTagInfo[]> {
  const posts = await getAllKnowledgePosts();
  const tagMap = new Map<string, KnowledgePost[]>();

  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)!.push(post);
    }
  }

  return Array.from(tagMap.entries())
    .map(([tag, tagPosts]) => ({
      tag,
      count: tagPosts.length,
      posts: tagPosts,
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getKnowledgePost(params: {
  category: string;
  slug: string;
}): Promise<
  | {
      post: KnowledgePost;
      mdxSource: string;
      frontmatter: KnowledgePostFrontmatter;
    }
  | null
> {
  const categoryDir = path.join(CONTENT_ROOT, params.category);
  if (!(await pathExists(categoryDir))) return null;

  const candidates = [
    path.join(categoryDir, `${params.slug}.mdx`),
    path.join(categoryDir, `${params.slug}.md`),
  ];

  let filePath: string | null = null;
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      filePath = candidate;
      break;
    }
  }
  if (!filePath) return null;

  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  const fm = (parsed.data ?? {}) as KnowledgePostFrontmatter;
  const stat = await fs.stat(filePath);

  const title =
    (typeof fm.title === "string" && fm.title.trim()) || params.slug;
  const description =
    typeof fm.description === "string" ? fm.description.trim() : undefined;
  const date = typeof fm.date === "string" ? fm.date : undefined;
  const tags = Array.isArray(fm.tags) ? fm.tags.filter(Boolean) : [];
  const draft = Boolean(fm.draft);

  if (draft) return null;

  const post: KnowledgePost = {
    category: params.category,
    slug: params.slug,
    filePath,
    title,
    description,
    date,
    tags,
    draft,
    updatedAtMs: stat.mtimeMs,
  };

  return { post, mdxSource: parsed.content, frontmatter: fm };
}

export function extractHeadings(mdxContent: string): KnowledgeHeading[] {
  const stripped = stripCodeBlocks(mdxContent);
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: KnowledgeHeading[] = [];
  const slugCounter = new Map<string, number>();
  let match;

  while ((match = headingRegex.exec(stripped)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = generateSlug(text, slugCounter);
    headings.push({ id, text, level });
  }

  return headings;
}

function stripCodeBlocks(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let fenceOpen = false;
  let fenceMarker = "";

  for (const line of lines) {
    if (!fenceOpen) {
      const m = line.match(/^([\x60~]{3,})/);
      if (m) {
        fenceOpen = true;
        fenceMarker = m[1];
        result.push("");
      } else {
        result.push(line);
      }
    } else {
      if (line.startsWith(fenceMarker) && line.length >= fenceMarker.length) {
        const after = line.substring(fenceMarker.length);
        if (!after || after[0] === " " || after === "") {
          fenceOpen = false;
          fenceMarker = "";
          result.push("");
        }
      }
      // inside code block, skip line (push empty to preserve line numbers)
      result.push("");
    }
  }

  return result.join("\n");
}

function generateSlug(text: string, slugCounter: Map<string, number>): string {
  let slug = text
    .toLowerCase()
    .replace(/[\u2000-\u206F]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (slugCounter.has(slug)) {
    const count = slugCounter.get(slug)! + 1;
    slugCounter.set(slug, count);
    slug = `${slug}-${count}`;
  } else {
    slugCounter.set(slug, 0);
  }

  return slug;
}

export async function getKnowledgeStaticParams(): Promise<
  Array<{ category: string; slug: string }>
> {
  const posts = await getAllKnowledgePosts();
  return posts.map((p) => ({ category: categoryToSlug(p.category), slug: p.slug }));
}

