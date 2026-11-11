/**
 * 生成第三批两个静态数据产物（幂等，无时间戳）：
 *   1. public/search-index.json  —— 全站文章与课程章节的本地搜索索引，客户端按需 fetch
 *   2. src/lib/generated/papers.ts —— 从各篇「参考资料」区抽取的出处索引，/papers 页使用
 *
 * 用法：node scripts/build-indexes.mjs
 * 新增文章或章节后重跑即可；package.json 的 build / build:pages 已串联本脚本。
 */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, "content");
const PROJECTS_ROOT = path.join(ROOT, "projects");
const SEARCH_OUTPUT = path.join(ROOT, "public", "search-index.json");
const PAPERS_OUTPUT = path.join(ROOT, "src", "lib", "generated", "papers.ts");

const CATEGORY_SLUG_MAP = {
  "自动驾驶 & 具身智能": "autonomous-driving",
  "管理": "management",
  "AI": "ai",
  "OS": "os",
};

const REFERENCE_HEADING = /^#{2,3}\s+(?:参考资料|参考文献|参考资源|参考|来源列表|来源|References?)\s*$/i;
const NEXT_HEADING = /^#{2}\s+/;
const SECTION_END = /^---\s*$/;

async function walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/\.(md|mdx)$/i.test(entry.name)) files.push(full);
  }
  return files.sort();
}

function slugOf(file) {
  return path.basename(file).replace(/\.(md|mdx)$/i, "").trim().replace(/\s+/g, "-").toLowerCase();
}

/** 把 MDX 正文压成可检索的纯文本，去掉代码块、组件标签与标记符号 */
function toPlainText(markdown, limit = 700) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/<MermaidDiagram[\s\S]*?\/>/g, " ")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*\|[-:\s|]+\|\s*$/gm, " ")
    .replace(/[|>*_~#]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return text.slice(0, limit);
}

function stringOr(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function arrayOr(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string" && v.trim()) : [];
}

async function collectSearchEntries() {
  const entries = [];

  const contentFiles = await walk(CONTENT_ROOT);
  for (const file of contentFiles) {
    const raw = await fs.readFile(file, "utf8");
    const { data, content } = matter(raw);
    if (data.draft === true) continue;
    const category = path.relative(CONTENT_ROOT, file).split(path.sep)[0];
    const catSlug = CATEGORY_SLUG_MAP[category] ?? category;
    const slug = slugOf(file);
    entries.push({
      id: `article:${catSlug}/${slug}`,
      type: "article",
      title: stringOr(data.title, slug),
      href: `/knowledge/${catSlug}/${slug}`,
      category,
      date: stringOr(data.date),
      description: stringOr(data.description),
      tags: arrayOr(data.tags),
      body: toPlainText(content),
    });
  }

  const projectFiles = await walk(PROJECTS_ROOT);
  for (const file of projectFiles) {
    const raw = await fs.readFile(file, "utf8");
    const { data, content } = matter(raw);
    if (data.draft === true) continue;
    const relative = path.relative(PROJECTS_ROOT, file).split(path.sep);
    const project = relative[0];
    const slug = slugOf(file);
    entries.push({
      id: `chapter:${project}/${slug}`,
      type: "chapter",
      title: stringOr(data.title, slug),
      href: `/projects/${project}/${slug}`,
      category: project,
      course: project,
      date: stringOr(data.date),
      description: stringOr(data.description),
      tags: arrayOr(data.tags),
      body: toPlainText(content, 420),
    });
  }

  return entries;
}

/** 从「参考资料」区抽取条目，一个列表项算一条出处，附带其余链接 */
function extractReferences(markdown) {
  const lines = markdown.split(/\r?\n/);
  let inSection = false;
  const items = [];
  let buffer = [];

  const flush = () => {
    const text = buffer.join(" ").trim();
    buffer = [];
    if (!text) return;
    const links = [...text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)].map((m) => ({
      label: m[1].trim(),
      url: m[2],
    }));
    const bareUrls = [...text.matchAll(/(?<![(\]])\bhttps?:\/\/[^\s)]+/g)].map((m) =>
      m[0].replace(/[.,;，。；]+$/, "")
    );
    const allUrls = [...new Set([...links.map((l) => l.url), ...bareUrls.filter((u) => !links.some((l) => l.url === u))])];
    const title = text
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/^\s*\d+\.\s*/, "")
      .replace(/[*_`]/g, "")
      .replace(/[，,。；;\s]+$/g, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 150);
    // 纯文本来源（无 URL）也收录，作为可核验的书目条目
    if (!title || title.length < 8) return;
    if (/^[^a-zA-Z\u4e00-\u9fa5]+$/.test(title)) return;
    items.push({ title, url: allUrls[0] ?? "", extraUrls: allUrls.slice(1, 4) });
  };

  for (const line of lines) {
    if (!inSection) {
      if (REFERENCE_HEADING.test(line.trim())) inSection = true;
      continue;
    }
    if (NEXT_HEADING.test(line) || SECTION_END.test(line.trim())) {
      flush();
      inSection = false;
      continue;
    }
    if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      flush();
      buffer = [line.replace(/^\s*(?:[-*]|\d+\.)\s+/, "").trim()];
    } else if (/^\s+\S/.test(line) && buffer.length) {
      buffer.push(line.trim());
    } else if (line.trim() === "") {
      // 空行不结束分组，允许段内多个列表项
    } else if (buffer.length) {
      buffer.push(line.trim());
    }
  }
  flush();
  return items;
}

function classifySource(url, title = "") {
  const haystack = `${url} ${title}`;
  if (/arxiv\.org|doi\.org|usenix\.org|dl\.acm\.org|ieee\.org|aclanthology|openaccess\.thecvf|proceedings\.mlr|springer|researchgate|arXiv\s?\d|IEEE |ACM |RTAS|RTSS|ECRTS|OSDI|SOSP|ATC \d|CVPR|ICLR|NeurIPS|JMLR|LIPIcs/i.test(haystack)) return "论文与预印本";
  if (/github\.com|gitlab\.com|gitee\.com|huggingface\.co/i.test(url)) return "开源工程";
  if (/docs\.|developer\.|nvidia\.com|kernel\.org|arm\.com|riscv|autosar\.org|gnu\.org|microsoft\.com|google\.com|apache\.org|pytorch\.org|openai\.com|anthropic\.com|qemu\.org/i.test(url)) return "官方文档";
  return "其他资料";
}

function extractYear(text) {
  const years = [...text.matchAll(/\b(20(?:1\d|2\d|3\d))\b/g)].map((m) => Number(m[1]));
  return years.length ? Math.max(...years) : null;
}

async function collectPapers() {
  const papers = [];
  const files = await walk(CONTENT_ROOT);
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const { data, content } = matter(raw);
    if (data.draft === true) continue;
    const category = path.relative(CONTENT_ROOT, file).split(path.sep)[0];
    const catSlug = CATEGORY_SLUG_MAP[category] ?? category;
    const slug = slugOf(file);
    const articleKey = `${catSlug}/${slug}`;
    const articleTitle = stringOr(data.title, slug);
    const href = `/knowledge/${catSlug}/${slug}`;

    const refs = extractReferences(content);
    for (const [index, ref] of refs.entries()) {
      papers.push({
        id: `${articleKey}#${index}`,
        title: ref.title,
        url: ref.url,
        extraUrls: ref.extraUrls,
        topic: classifySource(ref.url, ref.title),
        year: extractYear(ref.title),
        articleKey,
        articleTitle,
        articleHref: href,
        category,
      });
    }
  }
  return papers;
}

function tsString(value) {
  return JSON.stringify(value ?? "");
}

function renderPapersModule(papers) {
  const lines = [
    "/**",
    " * 自动生成，请勿手工编辑。运行 `node scripts/build-indexes.mjs` 重新生成。",
    " * 数据来源：content/ 下各篇文章的「参考资料 / 参考文献 / 来源列表」区。",
    " */",
    "",
    "export type PaperEntry = {",
    "  id: string;",
    "  title: string;",
    "  url: string;",
    "  extraUrls: string[];",
    "  topic: string;",
    "  year: number | null;",
    "  articleKey: string;",
    "  articleTitle: string;",
    "  articleHref: string;",
    "  category: string;",
    "};",
    "",
    "export const PAPER_ENTRIES: PaperEntry[] = [",
  ];
  for (const p of papers) {
    lines.push("  {");
    lines.push(`    id: ${tsString(p.id)},`);
    lines.push(`    title: ${tsString(p.title)},`);
    lines.push(`    url: ${tsString(p.url)},`);
    lines.push(`    extraUrls: ${JSON.stringify(p.extraUrls)},`);
    lines.push(`    topic: ${tsString(p.topic)},`);
    lines.push(`    year: ${p.year ?? "null"},`);
    lines.push(`    articleKey: ${tsString(p.articleKey)},`);
    lines.push(`    articleTitle: ${tsString(p.articleTitle)},`);
    lines.push(`    articleHref: ${tsString(p.articleHref)},`);
    lines.push(`    category: ${tsString(p.category)},`);
    lines.push("  },");
  }
  lines.push("];", "", `export const PAPER_TOPICS = ["论文与预印本", "官方文档", "开源工程", "其他资料"] as const;`, "");
  return lines.join("\n");
}

async function writeIfChanged(file, content) {
  let current = "";
  try {
    current = await fs.readFile(file, "utf8");
  } catch {
    // 文件不存在
  }
  if (current === content) return false;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
  return true;
}

async function main() {
  const [entries, papers] = await Promise.all([collectSearchEntries(), collectPapers()]);
  const searchChanged = await writeIfChanged(
    SEARCH_OUTPUT,
    `${JSON.stringify({ entries }, null, 0)}\n`
  );
  const papersChanged = await writeIfChanged(PAPERS_OUTPUT, renderPapersModule(papers));

  const topicCounts = papers.reduce((acc, p) => {
    acc[p.topic] = (acc[p.topic] ?? 0) + 1;
    return acc;
  }, {});
  const searchBytes = Buffer.byteLength(JSON.stringify({ entries }), "utf8");
  console.log(`搜索索引：${entries.length} 条（文章 ${entries.filter((e) => e.type === "article").length} / 章节 ${entries.filter((e) => e.type === "chapter").length}），${(searchBytes / 1024).toFixed(0)} KB，${searchChanged ? "已更新" : "无变化"}`);
  console.log(`出处索引：${papers.length} 条，覆盖 ${new Set(papers.map((p) => p.articleKey)).size} 篇文章，${papersChanged ? "已更新" : "无变化"}`);
  console.log(`主题分布：${Object.entries(topicCounts).map(([k, v]) => `${k} ${v}`).join(" / ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
