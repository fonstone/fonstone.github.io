/**
 * 归一课程章节的 frontmatter：补 est_time、填空 description、统一 est_time 写法。
 * 只做文本级精确替换，不重排 frontmatter 字段，不碰正文。
 * 用法：node scripts/normalize-course-metadata.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (/\.(md|mdx)$/i.test(e.name)) out.push(full);
  }
  return out;
}

// 4 篇附录/术语表的正文是清单或表格，没有可用摘要句，单独写
const DESCRIPTIONS = {
  "ch02-04-rust-sysprog.md":
    "Rust 系统编程入门附录，汇总 rCore 教程、Stanford CS110L 等学习资源。",
  "ch03-09-riscv-asm.md":
    "RISC-V 汇编入门附录，用 cargo rustc --emit asm 生成汇编并读懂常用指令与调用约定。",
  "ch05-05-riscv-hw.md":
    "RISC-V 硬件信息附录，寄存器 ABI、中断、CSR 与特权模式的速查清单。",
  "ch13-05-terminology.md":
    "术语中英文对照表，按出现章节整理执行环境、系统调用、上下文等核心概念。",
};

function estimateMinutes(bodyLength) {
  if (bodyLength < 2500) return 15;
  if (bodyLength < 7000) return 25;
  if (bodyLength < 18000) return 40;
  if (bodyLength < 40000) return 60;
  return 90;
}

let changed = 0;
let estAdded = 0;
let descFilled = 0;
let estNormalized = 0;

for (const file of walk(path.join(ROOT, "projects"))) {
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^(\uFEFF?---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!match) continue;

  let fm = match[2];
  const originalFm = fm;
  const body = raw.slice(match[0].length);
  const basename = path.basename(file);

  // 1. 空 description
  if (/^description:\s*""\s*$/m.test(fm)) {
    const custom = DESCRIPTIONS[basename];
    const titleMatch = fm.match(/^title:\s*"([^"]+)"/m);
    const fallback = titleMatch
      ? `${titleMatch[1]}，本章要点与参考资料索引。`
      : "本章要点与参考资料索引。";
    fm = fm.replace(/^description:\s*""\s*$/m, `description: "${custom ?? fallback}"`);
    descFilled++;
  }

  // 2. 缺 est_time
  if (!/^est_time:/m.test(fm)) {
    const mins = estimateMinutes(body.length);
    fm = fm.replace(/\n$/, "") + `\nest_time: "${mins} 分钟"`;
    estAdded++;
  } else {
    // 3. 归一 "15分钟" -> "15 分钟"
    const normalized = fm.replace(
      /^(est_time:\s*")(\d+)\s*分钟(".*)$/m,
      (_all, a, n, c) => `${a}${n} 分钟${c}`
    );
    if (normalized !== fm) {
      fm = normalized;
      estNormalized++;
    }
  }

  if (fm !== originalFm) {
    fs.writeFileSync(file, match[1] + fm + match[3] + body, "utf8");
    changed++;
  }
}

console.log(`修改 ${changed} 个文件：补 est_time ${estAdded}，填 description ${descFilled}，归一写法 ${estNormalized}`);
