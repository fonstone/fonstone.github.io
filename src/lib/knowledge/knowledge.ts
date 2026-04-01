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
  posts: KnowledgePost[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

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
  const categories = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

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

    result.push({ category, posts: posts.filter((p) => !p.draft) });
  }

  return result.filter((c) => c.posts.length > 0);
}

export async function getAllKnowledgePosts(): Promise<KnowledgePost[]> {
  const categories = await getKnowledgeCategories();
  return categories.flatMap((c) => c.posts);
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

export async function getKnowledgeStaticParams(): Promise<
  Array<{ category: string; slug: string }>
> {
  const posts = await getAllKnowledgePosts();
  return posts.map((p) => ({ category: p.category, slug: p.slug }));
}

