/**
 * 产物级验收：直接读 out/ 下的静态 HTML，不依赖构建缓存。
 * 用法：node scripts/verify-build.mjs   （先跑 next build）
 * 检查 title / canonical / JSON-LD、站内链接与图片引用、SEO 文件与体积。
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "out");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""; // 与 next.config.ts 注入的值一致

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function dirSize(dir) {
  let total = 0;
  for (const file of walk(dir)) total += fs.statSync(file).size;
  return total;
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function resolveInternal(url) {
  let clean = url.split("#")[0].split("?")[0];
  if (!clean.startsWith("/")) return null;
  if (clean.startsWith("//")) return null;
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // 非法百分号编码按原样处理
  }
  let rel = clean.slice(1);
  if (BASE && rel.startsWith(`${BASE}/`)) rel = rel.slice(BASE.length + 1);
  rel = rel.replace(/\/$/, "");
  const candidates = [
    path.join(OUT, rel),
    path.join(OUT, rel, "index.html"),
    path.join(OUT, `${rel}.html`),
  ];
  return candidates.find((file) => fs.existsSync(file) && fs.statSync(file).isFile()) ?? null;
}

async function main() {
  if (!fs.existsSync(OUT)) {
    console.error("out/ 不存在，请先构建");
    process.exit(1);
  }

  const allFiles = walk(OUT);
  const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));
  const titles = new Map();
  let canonical = 0;
  let jsonLd = 0;
  let lang = 0;
  let themeScript = 0;
  let searchEntry = 0;
  let navLinks = 0;
  const internalLinks = new Set();
  const imageRefs = new Set();

  for (const file of htmlFiles) {
    const html = await fsp.readFile(file, "utf8");
    const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
    titles.set(title, (titles.get(title) ?? 0) + 1);
    if (/rel="canonical"/.test(html)) canonical++;
    if (/application\/ld\+json/.test(html)) jsonLd++;
    if (/<html[^>]*lang="zh-CN"/.test(html)) lang++;
    if (/stonefon-theme/.test(html)) themeScript++;
    if (/aria-label="搜索站内文章与课程"|站内搜索/.test(html)) searchEntry++;
    if (/aria-label="主导航"/.test(html)) navLinks++;

    for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
      const url = match[1];
      if (/\.(png|jpe?g|webp|svg|gif|ico|css|js|woff2?|ttf|json|xml|txt)$/i.test(url)) {
        imageRefs.add(url);
      } else {
        internalLinks.add(url);
      }
    }
  }

  const brokenLinks = [...internalLinks].filter((url) => !resolveInternal(url));
  const brokenImages = [...imageRefs].filter((url) => !resolveInternal(url));

  const sitemapPath = path.join(OUT, "sitemap.xml");
  const sitemapCount = fs.existsSync(sitemapPath)
    ? (await fsp.readFile(sitemapPath, "utf8")).match(/<loc>/g)?.length ?? 0
    : 0;
  const feedPath = path.join(OUT, "feed.xml");
  const feedCount = fs.existsSync(feedPath)
    ? (await fsp.readFile(feedPath, "utf8")).match(/<item>/g)?.length ?? 0
    : 0;

  const seo = ["index.html", "404.html", "robots.txt", "sitemap.xml", "feed.xml", "search-index.json"]
    .filter((f) => fs.existsSync(path.join(OUT, f)));

  const pages = [
    ["search/index.html", "站内搜索"],
    ["papers/index.html", "出处索引墙"],
    ["progress/index.html", "学习进度"],
    ["start/index.html", "五层系统栈"],
  ];
  const pageResults = pages.map(([file, keyword]) => {
    const target = path.join(OUT, file);
    if (!fs.existsSync(target)) return `${file} 缺失`;
    const html = fs.readFileSync(target, "utf8");
    return `${file} ${html.includes(keyword) ? "✓" : `未找到「${keyword}」`}`;
  });

  const defaultTitle = "StoneFon，从内核到智能系统";
  const uniqueTitles = [...titles.entries()].filter(([title]) => title && title !== defaultTitle);
  const duplicateTitles = uniqueTitles.filter(([, count]) => count > 1);

  console.log(`产物：${htmlFiles.length} 个 HTML / ${allFiles.length} 个文件 / out ${mb(dirSize(OUT))} / public ${mb(dirSize(path.join(ROOT, "public")))}`);
  console.log(`独立内容 title：${uniqueTitles.length} 个（重复 ${duplicateTitles.length} 个）`);
  console.log(`canonical ${canonical} / ${htmlFiles.length}，JSON-LD ${jsonLd} 页，lang=zh-CN ${lang} 页`);
  console.log(`主题脚本 ${themeScript} 页，搜索入口 ${searchEntry} 页，全站导航 ${navLinks} 页`);
  console.log(`站内链接 ${internalLinks.size} 条，失效 ${brokenLinks.length} 条；静态资源引用 ${imageRefs.size} 条，失效 ${brokenImages.length} 条`);
  console.log(`sitemap ${sitemapCount} URL，RSS ${feedCount} 条，SEO 文件 ${seo.join("、")}`);
  console.log(`新页面：${pageResults.join("；")}`);

  if (brokenLinks.length) console.log("失效链接示例：", brokenLinks.slice(0, 10).join("\n  "));
  if (brokenImages.length) console.log("失效资源示例：", brokenImages.slice(0, 10).join("\n  "));
  if (duplicateTitles.length) console.log("重复 title 示例：", duplicateTitles.slice(0, 5).map(([t, c]) => `${t} ×${c}`).join("；"));

  const failed = brokenLinks.length > 0 || brokenImages.length > 0 || duplicateTitles.length > 0;
  console.log(failed ? "\n验收未通过" : "\n产物验收通过");
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
