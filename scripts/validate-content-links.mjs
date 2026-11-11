/**
 * 校验 courses.ts / learningMap.ts 里引用的 article key 与课程 slug 是否真实存在。
 * 用法：node scripts/validate-content-links.mjs
 * 退出码非 0 表示存在死链。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(md|mdx)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

// 从源码常量里解析 article key 与课程 slug，不引入 TS 运行时依赖
function readConst(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

const coursesSource = readConst("src/lib/constants/courses.ts");
const mapSource = readConst("src/lib/constants/learningMap.ts");

const articleKeyPattern = /"((?:ai|os|management|autonomous-driving)\/[a-z0-9-]+)"/g;
const keys = new Set();
for (const source of [coursesSource, mapSource]) {
  for (const match of source.matchAll(articleKeyPattern)) keys.add(match[1]);
}

// 真实文章 key
const CATEGORY_SLUG = {
  AI: "ai",
  OS: "os",
  管理: "management",
  "自动驾驶 & 具身智能": "autonomous-driving",
};
const realKeys = new Set();
for (const filePath of walk(path.join(ROOT, "content"))) {
  const rel = path.relative(path.join(ROOT, "content"), filePath);
  const category = rel.split(path.sep)[0];
  const catSlug = CATEGORY_SLUG[category];
  if (!catSlug) continue;
  const slug = path.basename(filePath).replace(/\.(md|mdx)$/i, "").toLowerCase();
  realKeys.add(`${catSlug}/${slug}`);
}

// 真实课程 slug
const realCourses = new Set(
  fs
    .readdirSync(path.join(ROOT, "projects"), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
);

// 只解析 COURSES 段，排除 COURSE_HUBS 里的 hub slug
const coursesBlock = coursesSource.slice(
  coursesSource.indexOf("export const COURSES:"),
  coursesSource.indexOf("export const COURSE_SLUGS")
);
const declaredCourses = new Set(
  [...coursesBlock.matchAll(/^\s{4}slug: "([a-z0-9-]+)",$/gm)].map((m) => m[1])
);

const errors = [];
for (const key of keys) {
  if (!realKeys.has(key)) errors.push(`文章不存在: ${key}`);
}
for (const slug of declaredCourses) {
  if (!realCourses.has(slug)) errors.push(`课程目录不存在: projects/${slug}`);
}
for (const dir of realCourses) {
  if (!declaredCourses.has(dir)) errors.push(`课程目录未登记到 courses.ts: projects/${dir}`);
}

console.log(`文章引用 ${keys.size} 个，实际文章 ${realKeys.size} 篇`);
console.log(`课程登记 ${declaredCourses.size} 门，实际目录 ${realCourses.size} 个`);

if (errors.length) {
  console.error(`\n发现 ${errors.length} 处死链：`);
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log("全部引用有效 ✓");
