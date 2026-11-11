/**
 * 把 public/images 下的 PNG / JPG 转成 WebP，并把内容里的站内 /images/*.png|jpg 引用改为 .webp。
 *
 * 运行：CODEBUDDY_SAFE_DELETE_ENABLED=0 node scripts/optimize-images.mjs
 * 可重复运行。负向后顾保证只匹配站内引用，外部 URL 里的 /images/ 片段与文档示例文字不动。
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGE_ROOT = path.resolve(process.cwd(), "public", "images");
const REF_DIRS = ["content", "projects", "courses", "src"];
const MAX_WIDTH = 1600;
const QUALITY = 82;
const BATCH = 8;

const RASTER = /\.(png|jpe?g)$/i;
const TEXT = /\.(md|mdx|ts|tsx)$/i;

// 前面的字符不能是 URL 的一部分，用来排除 https://.../docs/images/foo.png 这类外部链接
const IMAGE_REF = /(?<![\w:/.-])(\/images\/[^\s)'"\]}>]+?)\.(png|jpe?g)(?=[\s)'"\]}>]|$)/gi;
const VERIFY_REF = /(?<![\w:/.-])(\/images\/[^\s)'"\]}>]+?)\.(webp|png|jpe?g)/gi;

// 源文件本身已损坏，保留原图与 .png 引用，不参与转换和迁移
const KNOWN_BROKEN = new Set([
  "/images/rdma/ed91ac1a892807ed67caa2d23df4b498",
]);

function toStem(file) {
  const relative = path.relative(process.cwd(), file).replace(/\\/g, "/");
  return `/${relative.replace(/^public\//, "").replace(RASTER, "")}`;
}

async function walk(dir, accepts) {
  const result = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walk(full, accepts)));
    } else if (accepts.test(entry.name)) {
      result.push(full);
    }
  }
  return result;
}

async function convertImages() {
  const files = await walk(IMAGE_ROOT, RASTER);
  let beforeBytes = 0;
  let afterBytes = 0;
  let converted = 0;
  let skippedBroken = 0;
  const failures = [];
  const skipStems = new Set(KNOWN_BROKEN);

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    await Promise.all(
      batch.map(async (file) => {
        const stem = toStem(file);
        if (skipStems.has(stem)) {
          skippedBroken += 1;
          return;
        }
        const target = file.replace(RASTER, ".webp");
        try {
          const buffer = await fs.readFile(file);
          const output = await sharp(buffer)
            .rotate()
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .webp({ quality: QUALITY, effort: 4 })
            .toBuffer();

          await fs.writeFile(target, output);
          await fs.unlink(file);
          beforeBytes += buffer.length;
          afterBytes += output.length;
          converted += 1;
        } catch (error) {
          skipStems.add(stem);
          failures.push(`${file}: ${error.message}`);
        }
      })
    );
  }

  return {
    count: files.length,
    converted,
    skippedBroken,
    beforeBytes,
    afterBytes,
    failures,
    skipStems,
  };
}

async function rewriteReferences(skipStems) {
  const files = (
    await Promise.all(
      REF_DIRS.map((dir) => walk(path.resolve(process.cwd(), dir), TEXT))
    )
  ).flat();

  let changedFiles = 0;
  let replacedRefs = 0;
  let skippedRefs = 0;

  for (const file of files) {
    const original = await fs.readFile(file, "utf8");
    let hits = 0;
    const updated = original.replace(IMAGE_REF, (match, stem) => {
      if (skipStems.has(stem)) {
        skippedRefs += 1;
        return match;
      }
      hits += 1;
      return `${stem}.webp`;
    });
    if (hits > 0) {
      await fs.writeFile(file, updated, "utf8");
      changedFiles += 1;
      replacedRefs += hits;
    }
  }

  return { scannedFiles: files.length, changedFiles, replacedRefs, skippedRefs };
}

async function verify() {
  const files = (
    await Promise.all(
      REF_DIRS.map((dir) => walk(path.resolve(process.cwd(), dir), TEXT))
    )
  ).flat();

  const referenced = new Set();
  let leftoverRaster = 0;
  let webpRefs = 0;
  let knownBrokenRefs = 0;

  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    for (const match of text.matchAll(VERIFY_REF)) {
      const ref = match[0];
      const stem = ref.replace(/\.(webp|png|jpe?g)$/i, "");
      if (KNOWN_BROKEN.has(stem)) {
        knownBrokenRefs += 1;
        continue;
      }
      if (ref.toLowerCase().endsWith(".webp")) {
        webpRefs += 1;
        referenced.add(decodeURIComponent(ref));
      } else {
        leftoverRaster += 1;
      }
    }
  }

  const missing = [];
  for (const ref of referenced) {
    const full = path.join(process.cwd(), "public", ref.replace(/^\//, ""));
    try {
      await fs.access(full);
    } catch {
      missing.push(ref);
    }
  }

  return {
    webpRefs,
    uniqueRefs: referenced.size,
    leftoverRaster,
    knownBrokenRefs,
    missing,
  };
}

const convert = await convertImages();
const refs = await rewriteReferences(convert.skipStems);
const check = await verify();

const mb = (n) => (n / 1048576).toFixed(1);
const ratio =
  convert.beforeBytes > 0
    ? ((1 - convert.afterBytes / convert.beforeBytes) * 100).toFixed(1)
    : "0.0";

console.log("=== 图片转换 ===");
console.log(
  `扫描 ${convert.count} 张，成功 ${convert.converted} 张，已知损坏跳过 ${convert.skippedBroken} 张，失败 ${convert.failures.length} 张`
);
console.log(`${mb(convert.beforeBytes)} MB -> ${mb(convert.afterBytes)} MB，减少 ${ratio}%`);
convert.failures.slice(0, 10).forEach((f) => console.log(`  失败 ${f}`));

console.log("=== 引用迁移 ===");
console.log(
  `扫描 ${refs.scannedFiles} 个文本文件，改动 ${refs.changedFiles} 个，替换 ${refs.replacedRefs} 处，跳过损坏素材 ${refs.skippedRefs} 处`
);

console.log("=== 校验 ===");
console.log(`站内 webp 引用 ${check.webpRefs} 处，去重 ${check.uniqueRefs} 个`);
console.log(
  `残留旧扩展名引用 ${check.leftoverRaster} 处，已知损坏素材 ${check.knownBrokenRefs} 处，失效引用 ${check.missing.length} 个`
);
check.missing.slice(0, 10).forEach((m) => console.log(`  失效 ${m}`));

if (check.leftoverRaster || check.missing.length) {
  process.exitCode = 1;
}
