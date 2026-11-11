/**
 * 把 public/ 根目录三张 jpg 与一张遗留 RDMA PNG 转成 WebP，同步改引用，再删原图。
 * 幂等：转换前先检查目标文件，引用已是 .webp 时不重复处理。
 * 用法：node scripts/optimize-root-images.mjs
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();

const TASKS = [
  {
    from: "public/portrait.jpg",
    to: "public/portrait.webp",
    oldRef: "/portrait.jpg",
    newRef: "/portrait.webp",
    refFiles: ["src/lib/constants/siteContent.ts"],
    maxWidth: 1200,
  },
  {
    from: "public/ai_article.jpg",
    to: "public/ai_article.webp",
    oldRef: "/ai_article.jpg",
    newRef: "/ai_article.webp",
    refFiles: ["src/components/OfficialAccountCard.tsx"],
    maxWidth: 800,
  },
  {
    from: "public/wehcart.jpg",
    to: "public/wehcart.webp",
    oldRef: "/wehcart.jpg",
    newRef: "/wehcart.webp",
    refFiles: ["src/components/WeChatCard.tsx"],
    maxWidth: 950,
  },
  // RDMA 的 ed91ac1a...png 抓取时像素损坏（libspng read error），
  // 已在 projects/rdma/03-rdma-basics.md 里改成文字说明并删除原图，不参与转换。
];

const SCAN_DIRS = ["src", "content", "projects", "public", "docs"];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?|mdx?|css|html|json|txt|mjs|py)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

async function main() {
  let converted = 0;
  let refsChanged = 0;
  let removed = 0;

  for (const task of TASKS) {
    const fromPath = path.join(ROOT, task.from);
    const toPath = path.join(ROOT, task.to);

    if (!fs.existsSync(toPath)) {
      if (!fs.existsSync(fromPath)) {
        console.log(`跳过 ${task.from}：原图不存在`);
        continue;
      }
      await sharp(fromPath)
        .resize({ width: task.maxWidth, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(toPath);
      converted++;
      const before = fs.statSync(fromPath).size;
      const after = fs.statSync(toPath).size;
      console.log(`转换 ${task.from} → ${path.basename(toPath)}：${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB`);
    }

    for (const refFile of task.refFiles) {
      const full = path.join(ROOT, refFile);
      if (!fs.existsSync(full)) continue;
      const text = await fsp.readFile(full, "utf8");
      if (!text.includes(task.oldRef)) continue;
      await fsp.writeFile(full, text.split(task.oldRef).join(task.newRef), "utf8");
      refsChanged++;
      console.log(`引用已更新：${refFile}`);
    }

    if (!fs.existsSync(fromPath)) continue;
    const remaining = [];
    for (const file of SCAN_DIRS.flatMap(walk)) {
      try {
        if (fs.readFileSync(file, "utf8").includes(task.oldRef)) remaining.push(file);
      } catch {
        // 二进制或不可读文件跳过
      }
    }
    if (remaining.length === 0) {
      await fsp.unlink(fromPath);
      removed++;
      console.log(`删除原图 ${task.from}（全库已无引用，git 可恢复）`);
    } else {
      console.log(`保留原图 ${task.from}，仍有引用：${remaining.slice(0, 3).join("、")}`);
    }
  }

  console.log(`\n转换 ${converted} 张，改引用 ${refsChanged} 处，删原图 ${removed} 张`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
