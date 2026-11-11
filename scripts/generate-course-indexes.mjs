/**
 * 为缺总纲的 7 门课程生成 00-index.md。
 *
 * 课程定位、难度、前置、成果物、配套文章全部从 src/lib/constants/courses.ts
 * 读取；章节路线表从各课程目录里真实的 frontmatter 生成，保证链接有效。
 * 已有总纲的 ai-agent 不覆盖。
 * 用法：node scripts/generate-course-indexes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// 生成标记放在 frontmatter 里：正文走 MDXRemote，HTML 注释在 .mdx 模式下会编译失败
const GENERATED_FIELD = 'generated: "course-index"';
const LEGACY_MARKER = "<!-- generated-course-index -->";
const TODAY = "2026-11-08";

// ------ 1. 从 courses.ts 解析课程元数据（只做结构化字段提取，不执行 TS） ------
const coursesSource = fs.readFileSync(
  path.join(ROOT, "src/lib/constants/courses.ts"),
  "utf8"
);
const block = coursesSource.slice(
  coursesSource.indexOf("export const COURSES:"),
  coursesSource.indexOf("export const COURSE_SLUGS")
);
const chunks = block.split(/(?=^  \{\n    slug: ")/m).slice(1);

function str(source, field) {
  const m = source.match(new RegExp(`^\\s*${field}:\\s*"([^"]*)"`, "m"));
  return m ? m[1] : "";
}
function strArray(source, field) {
  const m = source.match(new RegExp(`^\\s*${field}:\\s*\\[([^\\]]*)\\]`, "ms"));
  if (!m) return [];
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

const courseMeta = new Map();
for (const chunk of chunks) {
  const slug = str(chunk, "slug");
  if (!slug) continue;
  courseMeta.set(slug, {
    slug,
    title: str(chunk, "title"),
    shortTitle: str(chunk, "shortTitle"),
    description: str(chunk, "description").replace(/\s+/g, " ").trim(),
    level: str(chunk, "level"),
    prerequisites: strArray(chunk, "prerequisites"),
    outcomes: strArray(chunk, "outcomes"),
    relatedArticles: strArray(chunk, "relatedArticles"),
  });
}

// ------ 2. 文章 key -> 标题 映射 ------
const CATEGORY_SLUG = {
  AI: "ai",
  OS: "os",
  管理: "management",
  "自动驾驶 & 具身智能": "autonomous-driving",
};
const articleTitles = new Map();
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
for (const file of walk(path.join(ROOT, "content"))) {
  const rel = path.relative(path.join(ROOT, "content"), file);
  const cat = CATEGORY_SLUG[rel.split(path.sep)[0]];
  if (!cat) continue;
  const data = matter(fs.readFileSync(file, "utf8")).data;
  const slug = path.basename(file).replace(/\.(md|mdx)$/i, "").toLowerCase();
  articleTitles.set(`${cat}/${slug}`, data.title || slug);
}

// ------ 3. 每门课的定位与读法（文案层，与元数据互补，不重复字段） ------
const INTRO = {
  "ai-infra": {
    intro:
      "这门课按「硬件 → 网络 → 并行 → 推理 → 应用」自下而上排。前四章先把 GPU 互联和集合通信的带宽账算清楚，中间的并行策略与 ZeRO 才不会变成背名词。第 10 章之后的推理优化和 Agent 应用，都建立在前面对显存、带宽、算力三者排队关系的理解上。",
    howto:
      "建议按序读，不要跳到第 12 章的 Agent 应用。每章结尾的带宽与时延数字值得单独抄一遍，后面讲并行切分时会反复用到。想先看全景，读知识空间里的《AI Infra 全栈架构（2026）深度解析》。",
  },
  "autosar-functional-safety": {
    intro:
      "前 7 章拆 AUTOSAR OS 的实现：从 OSEK/VDX 的任务与资源模型，到 ERIKA v3 在 TC38x 上的移植，再到多核启动、内存保护。后 5 章转到功能安全，用 ISO 26262 的 HARA 与 ASIL 分解回答「凭什么说这个调度是安全的」。两部分用同一个车载场景串起来。",
    howto:
      "有裸机开发经验可以从第 2 章开始；只想补功能安全，第 8 章起单独成段。第 7 章的 TC38x 移植记录和知识空间里的 ERIKA3 源码解析对照读，能省掉不少查手册的时间。",
  },
  chcore: {
    intro:
      "6 个 lab 对应上海交通大学 IPADS 实验室的 ChCore 微内核实验，目标平台是树莓派 3B+。从 ARM 汇编「拆炸弹」开始，依次做机器启动、内存管理、进程管理、多核 IPC，最后落到虚拟文件系统。每一章都有明确的可运行结果。",
    howto:
      "lab 之间强依赖，不要跳。建议每章先跑通测试再往下读，遇到问题回头看《Linux 内存屏障深度解析》和《Linux 内核启动流程分析》，这两篇讲清了 lab 里默认你会的概念。",
  },
  qemu: {
    intro:
      "课程以 Quard-Star 这块自定义虚拟板卡为主线，从注册板卡、加串口和中断控制器开始，经 OpenSBI、U-Boot、VirtIO 设备、Linux 内核与根文件系统，一直做到应用移植与调试扩展。它把「启动」这件事拆成 8 段可单步验证的过程。",
    howto:
      "第 1 章的环境搭建必须动手，后面所有章节都基于它。配套代码按 tag 分阶段，建议每完成一章就 checkout 对应 tag 对照。设备树写法见《Linux 设备树详解》，构建系统选型见《Yocto 与 Buildroot 详解》。",
  },
  rdma: {
    intro:
      "25 章分三段：1~5 章讲清楚 RDMA 是什么、和 Socket 差在哪、三种技术实现怎么选；6~14 章逐个拆 Memory Region、Protection Domain、Queue Pair、Completion Queue 等核心对象以及 Verbs 编程；15~25 章落到 Soft-RoCE / Soft-iWARP 实验与 DDP、RDMAP、MPA 协议栈。",
    howto:
      "第 3 章的基本元素是后面所有章节的词汇表，务必先读。有 Socket 编程经验可以快读前两章，但从第 6 章起建议配合实验环境，每读一个对象就用 Verbs 打一次日志验证。时延侧的理论背景见《超低时延研究地图，七个方向在哪里交汇》。",
  },
  "rust-learning": {
    intro:
      "12 章按 Rust 的核心机制推进：语法打底之后，重点是所有权、生命周期、泛型与 trait、并发和错误处理，最后落到工程化与测试。课程用系统程序员的视角讲，不停留在语法对照。",
    howto:
      "第 3 章所有权是第一道分水岭，之后每章都建立在它之上。学完可以直接接《从零写 Rust RTOS》，那里会把 unsafe 边界和裸机环境一起交代清楚。",
  },
  "rust-os": {
    intro:
      "在 QEMU 模拟的 ARM Cortex-R52 上从零实现一个 RTOS。章节按 rCore 风格的实验序列组织：先建立执行环境与裸机程序，再逐步加串口驱动、异常向量表、系统定时器、上下文切换、抢占式调度器、同步原语与任务间通信，中间穿插 Rust 系统编程与 RISC-V 汇编附录。",
    howto:
      "章号形如 chNN-MM，chNN-00-index 是每章的索引，先读索引再进正文。附录按需要查，不必顺序读。调度器部分可以和知识空间里的《XPU 精细化调度与抢占》对照，区分「通用 OS 的时间片」与「RTOS 的确定性」各自要解决什么。",
  },
};

// ------ 4. 生成 ------
function cell(text) {
  return String(text || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}
function quote(text) {
  return String(text).replace(/"/g, "「").replace(/\r?\n/g, " ").trim();
}

let created = 0;
let skipped = 0;
for (const [slug, config] of Object.entries(INTRO)) {
  const dir = path.join(ROOT, "projects", slug);
  if (!fs.existsSync(dir)) {
    console.error(`目录不存在: projects/${slug}`);
    process.exitCode = 1;
    continue;
  }
  const target = path.join(dir, "00-index.md");
  if (fs.existsSync(target)) {
    const existing = fs.readFileSync(target, "utf8");
    const generatedByUs =
      existing.includes(GENERATED_FIELD) || existing.includes(LEGACY_MARKER);
    if (!generatedByUs) {
      console.log(`- 跳过手工总纲: projects/${slug}/00-index.md`);
      skipped++;
      continue;
    }
  }

  const meta = courseMeta.get(slug);
  if (!meta) {
    console.error(`courses.ts 中找不到课程: ${slug}`);
    process.exitCode = 1;
    continue;
  }

  // 章节：排除 index，按 order 排序
  const chapters = fs
    .readdirSync(dir)
    .filter((f) => /\.(md|mdx)$/i.test(f))
    .filter((f) => !/^00-index/.test(f))
    .map((f) => {
      const data = matter(fs.readFileSync(path.join(dir, f), "utf8")).data;
      return {
        slug: f.replace(/\.(md|mdx)$/i, "").toLowerCase(),
        title: data.title || f,
        description: data.description || "",
        order: typeof data.order === "number" ? data.order : 999,
        est_time: data.est_time || "—",
      };
    })
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

  const lines = [
    "---",
    `title: "课程总纲：${quote(meta.title)}"`,
    `description: "《${quote(meta.title)}》${chapters.length} 章的路线图、前置要求与配套阅读索引。"`,
    `date: "${TODAY}"`,
    "order: 0",
    `tags: ["课程总纲", "${quote(meta.shortTitle)}"]`,
    'est_time: "10 分钟"',
    GENERATED_FIELD,
    "---",
    "",
    `# ${meta.title}`,
    "",
    config.intro,
    "",
    "## 课程信息",
    "",
    `- 难度：${meta.level}`,
    `- 章节数：${chapters.length} 章`,
    `- 前置要求：${meta.prerequisites.join("；")}`,
    `- 学完能拿到：${meta.outcomes.join("；")}`,
    `- 课程首页（含学习进度）：[/projects/${slug}](/projects/${slug})`,
    `- 全站阅读路线图：[/start](/start)`,
    "",
    "## 章节路线",
    "",
    "| # | 章节 | 要点 | 预计 |",
    "| --- | --- | --- | --- |",
    ...chapters.map(
      (c, i) =>
        `| ${String(i + 1).padStart(2, "0")} | [${cell(c.title)}](/projects/${slug}/${c.slug}) | ${cell(c.description)} | ${cell(c.est_time)} |`
    ),
    "",
  ];

  const related = meta.relatedArticles
    .map((key) => ({ key, title: articleTitles.get(key) }))
    .filter((x) => x.title);
  if (related.length > 0) {
    lines.push("## 配套阅读", "");
    lines.push("知识空间里对应的技术长文，讲这一层为什么要这么设计。", "");
    for (const item of related) {
      lines.push(`- [${item.title}](/knowledge/${item.key})`);
    }
    lines.push("");
  }

  lines.push("## 怎么读", "", config.howto, "");
  lines.push(
    "> 本页由 `scripts/generate-course-indexes.mjs` 从 `courses.ts` 与章节 frontmatter 生成，章节标题与链接随内容自动更新。",
    ""
  );

  const content = lines.join("\n");
  if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === content) {
    skipped++;
    continue;
  }
  fs.writeFileSync(target, content, "utf8");
  console.log(`+ projects/${slug}/00-index.md（${chapters.length} 章）`);
  created++;
}

console.log(`\n新建/更新 ${created} 份，跳过 ${skipped} 份`);
