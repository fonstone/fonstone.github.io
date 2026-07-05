import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export type ProjectPostFrontmatter = {
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  draft?: boolean;
  order?: number;
  est_time?: string;
};

export type ProjectHeading = {
  id: string;
  text: string;
  level: number;
};

export type ProjectPost = {
  project: string;
  slug: string;
  filePath: string;
  title: string;
  description?: string;
  date?: string;
  tags: string[];
  draft: boolean;
  order: number;
  est_time?: string;
  updatedAtMs: number;
};

export type ProjectCategory = {
  project: string;
  slug: string;
  posts: ProjectPost[];
};

const PROJECTS_ROOT = path.join(process.cwd(), "projects");

const PROJECT_SLUG_MAP: Record<string, string> = {
  "qemu": "qemu",
  "autosar-functional-safety": "autosar-functional-safety",
  "ai-infra": "ai-infra",
};

const SLUG_TO_PROJECT_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PROJECT_SLUG_MAP).map(([k, v]) => [v, k])
);

export function projectToSlug(project: string): string {
  return PROJECT_SLUG_MAP[project] || project;
}

export function slugToProject(slug: string): string {
  return SLUG_TO_PROJECT_MAP[slug] || slug;
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

export async function getProjectCategories(): Promise<ProjectCategory[]> {
  if (!(await pathExists(PROJECTS_ROOT))) return [];

  const entries = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
  const projectsList = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const result: ProjectCategory[] = [];

  for (const project of projectsList) {
    const projectDir = path.join(PROJECTS_ROOT, project);
    const filePaths = await walkFiles(projectDir);
    const posts: ProjectPost[] = [];

    for (const filePath of filePaths) {
      const stat = await fs.stat(filePath);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      const fm = (parsed.data ?? {}) as ProjectPostFrontmatter;
      const fileName = path.basename(filePath);
      const slug = toSlug(fileName);

      const title = (typeof fm.title === "string" && fm.title.trim()) || slug;
      const description =
        typeof fm.description === "string" ? fm.description.trim() : undefined;
      const date = typeof fm.date === "string" ? fm.date : undefined;
      const tags = Array.isArray(fm.tags) ? fm.tags.filter(Boolean) : [];
      const draft = Boolean(fm.draft);
      const order = typeof fm.order === "number" ? fm.order : 999;
      const est_time = typeof fm.est_time === "string" ? fm.est_time.trim() : undefined;

      posts.push({
        project,
        slug,
        filePath,
        title,
        description,
        date,
        tags,
        draft,
        order,
        est_time,
        updatedAtMs: stat.mtimeMs,
      });
    }

    posts.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      const ad = a.date ? Date.parse(a.date) : Number.NaN;
      const bd = b.date ? Date.parse(b.date) : Number.NaN;
      if (!Number.isNaN(ad) && !Number.isNaN(bd)) return bd - ad;
      if (!Number.isNaN(ad) && Number.isNaN(bd)) return -1;
      if (Number.isNaN(ad) && !Number.isNaN(bd)) return 1;
      return b.updatedAtMs - a.updatedAtMs;
    });

    result.push({
      project,
      slug: projectToSlug(project),
      posts: posts.filter((p) => !p.draft),
    });
  }

  return result.filter((c) => c.posts.length > 0);
}

export async function getAllProjectPosts(): Promise<ProjectPost[]> {
  const categories = await getProjectCategories();
  return categories.flatMap((c) => c.posts);
}

export async function getProjectPost(params: {
  project: string;
  slug: string;
}): Promise<
  | {
      post: ProjectPost;
      mdxSource: string;
      frontmatter: ProjectPostFrontmatter;
    }
  | null
> {
  const projectDir = path.join(PROJECTS_ROOT, params.project);
  if (!(await pathExists(projectDir))) return null;

  const candidates = [
    path.join(projectDir, `${params.slug}.mdx`),
    path.join(projectDir, `${params.slug}.md`),
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
  const fm = (parsed.data ?? {}) as ProjectPostFrontmatter;
  const stat = await fs.stat(filePath);

  const title =
    (typeof fm.title === "string" && fm.title.trim()) || params.slug;
  const description =
    typeof fm.description === "string" ? fm.description.trim() : undefined;
  const date = typeof fm.date === "string" ? fm.date : undefined;
  const tags = Array.isArray(fm.tags) ? fm.tags.filter(Boolean) : [];
  const draft = Boolean(fm.draft);
  const order = typeof fm.order === "number" ? fm.order : 999;
  const est_time = typeof fm.est_time === "string" ? fm.est_time.trim() : undefined;

  if (draft) return null;

  const post: ProjectPost = {
    project: params.project,
    slug: params.slug,
    filePath,
    title,
    description,
    date,
    tags,
    draft,
    order,
    est_time,
    updatedAtMs: stat.mtimeMs,
  };

  return { post, mdxSource: parsed.content, frontmatter: fm };
}

export function extractProjectHeadings(mdxContent: string): ProjectHeading[] {
  const stripped = stripCodeBlocks(mdxContent);
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: ProjectHeading[] = [];
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

export async function getProjectStaticParams(): Promise<
  Array<{ project: string; slug: string }>
> {
  const posts = await getAllProjectPosts();
  return posts.map((p) => ({ project: projectToSlug(p.project), slug: p.slug }));
}
