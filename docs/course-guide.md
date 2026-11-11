# 课程内容规范

面向 `projects/` 下按章节组织的技术课程。目标是把一门课写成能按序做完的东西，章节之间接得上，学完手里有可运行或可检查的成果物。

## 与 writing-guide 的适用边界

`docs/writing-guide.md` 与 `scripts/check_prose.py` 只管 `content/` 下的**单篇知识文章**。那一套规范的前提是读者一次性读完一篇成稿，所以禁止水平分层标签、禁止结构预告、禁止结尾升华，破折号和提示性冒号也由硬禁令检查器拦掉。

课程不是单篇成稿。它按难度递进分章，读者会跳章、回看、照着做实验，因此需要 `level`（入门 / 进阶 / 深入）、`prerequisites`、`est_time`、练习和成果物。以下是明确不适用的部分。

| 项目 | `content/` 单篇 | `projects/` 课程 |
| --- | --- | --- |
| 水平分层标签 | 禁止贴「入门 / 进阶 / 专家」标签 | 需要，`level` 与 `prerequisites` 是课程元数据 |
| 结构预告 | 禁止「本文将…」 | 总纲要写明章节路线、读法和前置，读者靠它选章 |
| 学时 | 不涉及 | 每章必须有 `est_time` |
| 练习与成果物 | 不涉及 | 章节末尾给练习，课程在 `outcomes` 里声明成果物 |
| 成稿硬禁令 | 跑 `python scripts/check_prose.py <文件>` 清零 | 不套用，跑 `python scripts/check_course.py` |
| 事实与来源 | 数字可核验、来源分级 | 同样要求，另加许可证标注 |

两处共通的要求只有一条：写的数字、版本、许可证要能指出来源，不编造实验结果。`check_course.py` 不检查文风，只检查结构数据。

## 目录结构与文件命名

```
projects/
  <course-slug>/
    00-index.md          课程总纲，每门课一份
    <章节文件>.md / .mdx
```

- `<course-slug>` 与 `src/lib/constants/courses.ts` 里 `COURSES[].slug` 完全一致，也是 URL 段 `/projects/<course-slug>`。
- 现有八门课：`ai-infra`、`ai-agent`、`autosar-functional-safety`、`chcore`、`qemu`、`rdma`、`rust-learning`、`rust-os`。
- 章节文件用两位序号开头，序号与 frontmatter 的 `order` 一致，便于按文件名排序：
  - 多数课程用 `NN-slug.md`，如 `projects/rdma/09-queue-pair.md`、`projects/ai-agent/01-intro-to-agents.md`。
  - `rust-os` 用 `chNN-MM-slug.mdx`，如 `projects/rust-os/ch01-01-architecture.mdx`，其中 `chNN-00-index` 是每章索引。
  - 同一门课内保持一种命名风格，不要混用。
- `00-index.md` 的 `order` 固定为 `0`，不参与章节排序。
- 扩展名 `.md` 与 `.mdx` 都可以，`.mdx` 用于需要 `<MermaidDiagram ... />` 等组件的章节。不要用 HTML 注释 `<!-- -->` 写说明，MDXRemote 会编译报错，注释用 `{/* ... */}`。

## 00-index.md 总纲必备段落

每门课的 `00-index.md` 要有 frontmatter（同章节字段表，`order: 0`），正文按以下顺序写。

1. **课程定位**。一段话讲清这门课做什么、在什么环境里做、对标哪份公开教材或课程。例：`在 QEMU 模拟的 ARM Cortex-R52 上从零实现一个 RTOS`。
2. **课程信息**。难度、章节数、前置要求、学完能拿到的成果物、课程首页链接 `/projects/<slug>`、全站路线图 `/start`。这几项与 `courses.ts` 的 `level` / `prerequisites` / `outcomes` 保持一致，不要各写一套。
3. **章节路线表**。表格列出每章，列至少包含序号、章节链接、要点、预计时间。链接用相对 slug（`[01. 初识智能体](01-intro-to-agents)`）或站内绝对路径（`/projects/rust-os/ch01-01-architecture`），两种写法 `check_course.py` 都会核对是否指向真实文件。
4. **配套阅读**。列出 `courses.ts` 里 `relatedArticles` 对应的 `/knowledge/<categorySlug>/<slug>` 链接，一句话说明为什么这篇配这一章。
5. **怎么读**。给出顺序、哪些章可以跳、哪些实验要连着做、和知识空间里哪篇长文对照。
6. **来源与许可**。引用第三方教材、论文、配图时写明名称与许可证；自动生成的总纲在末尾注明生成脚本和数据来源。

`rust-os/00-index.md` 由 `scripts/generate-course-indexes.mjs` 从 `courses.ts` 与章节 frontmatter 生成，表格不要手工改，改动走章节 frontmatter 与生成脚本。

## 章节 frontmatter 字段

字段写在文件开头的 `---` 之间，六个字段都必填且非空。

| 字段 | 类型 | 写法 | 说明 |
| --- | --- | --- | --- |
| `title` | 字符串 | `title: "初识智能体"` | 章节短标题，用于导航与 `<title>` |
| `description` | 字符串 | `description: "智能体定义、类型、范式与交互循环，PEAS 模型"` | 一句话讲清本章内容，不写「本章将介绍」 |
| `date` | 字符串 | `date: "2026-07-12"` | 最后实质修改日期，格式 `YYYY-MM-DD` |
| `tags` | 数组 | `tags: ["Agent", "LLM", "PEAS", "ReAct"]` | 3 到 6 个术语，用于检索，不能为空数组 |
| `order` | 整数 | `order: 1` | 同一课程内唯一，从 `1` 递增，`00-index.md` 用 `0` |
| `est_time` | 字符串 | `est_time: "60 分钟"` | 见下 |

额外字段按需添加（如 `generated: "course-index"`），不影响校验。

**`est_time` 统一写「NN 分钟」**：数字 + 一个空格 + `分钟`，例如 `"25 分钟"`、`"120 分钟"`。不要写 `1 小时`、`60min`、`约 1 小时`、`2-3 小时`。估时按读者读完并做完本章练习的时间算，不按作者写稿时间算。`check_course.py` 用 `^\d+ 分钟$` 严格校验，不符合直接报错误。

完整示例：

```yaml
---
title: "初识智能体"
description: "智能体定义、类型、范式与交互循环，PEAS 模型，传统智能体演进，LLM 智能体新范式。"
date: "2026-07-12"
order: 1
tags: ["Agent", "LLM", "PEAS", "ReAct", "范式"]
est_time: "60 分钟"
---
```

## 难度与前置

难度、前置要求、成果物、hub 归属、栈层级都在 `src/lib/constants/courses.ts` 的 `COURSES` 数组里声明，是课程元数据的单一数据源。课程聚合页、hub 页、`/start` 路线图、sitemap、文章详情页的「配套课程」都从这里派生。

- `level` 取 `入门` / `进阶` / `深入`，不要另造枚举。
- `prerequisites` 写可判断的条件，例如「会写 Python」「调用过至少一种大模型 API」，不写「有一定基础」。
- `outcomes` 写可验收的动作，例如「能用 Verbs 写出一次 RDMA Write 并解释每一步」，不写「掌握 RDMA 原理」。
- 新增 hub 时才动 `COURSE_HUBS`，并把新课程 slug 加进对应 hub 的 `courseSlugs`。

章节正文里可以复述前置，但以 `courses.ts` 为准，两处冲突时改 `courses.ts`。

## 配套文章 relatedArticles 如何维护

`COURSES[].relatedArticles` 是 article key 数组，格式 `${categorySlug}/${postSlug}`，例如 `ai/ai-agent-knowledge-base`、`os/xpu-preemptive-scheduling`、`autonomous-driving/autosar-os-erika3-tc38x`。分类目录 slug 映射：`AI`→`ai`、`OS`→`os`、`自动驾驶 & 具身智能`→`autonomous-driving`、`管理`→`management`。

维护规则：

- 只填 `content/` 下真实存在的文章。站点有 `scripts/validate-content-links.mjs` 校验 article key，写错会让详情页互链失效。
- 一门课列 4 到 6 篇，按章节顺序排，和总纲「配套阅读」段的链接一一对应。
- 新增或删除章节时，同步检查这一段：章节对应的知识文章变了，就要改 `relatedArticles` 与总纲的配套阅读。
- 文章详情页的配套课程由 `getRelatedCourses(articleKey)` 反查，不要在文章里手写课程链接。

## 新增一门课程的完整流程

1. 在 `projects/` 下建目录，目录名定下 `slug`。写章节文件，每章补齐六个 frontmatter 字段，`order` 从 `1` 递增且不重复。
2. 写 `00-index.md`，按上面的必备段落填章节路线表，链接逐条确认指向真实文件。
3. 在 `src/lib/constants/courses.ts` 的 `COURSES` 数组加一条：`slug`、`title`、`shortTitle`、`description`、`hub`、`track`、`level`、`prerequisites`、`outcomes`、`relatedArticles`、`icon`、`accent`、`iconColor`。`track` 对齐 `learningMap.ts` 的 `LEARNING_TRACKS` 的 `id`。
4. 若这门课属于新 hub，在 `COURSE_HUBS` 加一条并把 slug 写进 `courseSlugs`；否则挂到已有 hub。
5. 路由、sitemap、导航、课程聚合页、文章详情页互链都由常量派生，不需要改任何 `page.tsx`。
6. 跑 `python scripts/check_course.py`，错误清零，警告逐条判断。再跑 `scripts/validate-content-links.mjs` 确认 `relatedArticles` 指向真实文章。
7. 在总纲「更新记录」写一行，记日期和做了什么。

## 练习与成果物模板

每章末尾给练习，练习要能在 `est_time` 里做完，且有可核验的完成条件。不写「请谈谈你对本章的理解」这类无法验收的题。

```markdown
## 练习

1. 在 Soft-RoCE 环境里用 `ibv_reg_mr` 注册一段 4KB 内存，打印 `lkey` 与 `rkey`，记录两者是否相同。
2. 把第 1 题的 MR 换成 4MB，观察注册耗时变化，写下一组前后数字。

### 成果物

- `experiments/01-mr-register.c`，可编译运行。
- 一段日志输出，包含两次注册的 `lkey`、`rkey` 和耗时。
```

- 成果物是文件、可运行程序、一张表或一个可复现的实验记录，写清路径或形态。
- 课程级成果物在 `courses.ts` 的 `outcomes` 里声明，章节级成果物是它的分解。
- 需要环境依赖的练习，在练习前写明版本与安装方式，版本号按 `docs/writing-guide.md` 的真实性要求核对。

## 来源与许可标注要求

- 引用书籍、开源项目、课程讲义：写名称、作者或组织、版本或链接、许可证。`ai-agent` 课程对标《深入理解 AI Agent》（bojieli/ai-agent-book，Apache 2.0），总纲里就是这么标的。
- 引用论文：写标题、作者、会议或 arXiv 编号、年份。数字结论要能指回具体章节或表格。
- 配图：在图片下方标来源与许可证；本站自行绘制的写「本站绘制」。放在 `public/images/courses/<slug>/` 下，文件名带章节号。
- 代码：粘贴第三方代码要标仓库与许可证，改写的注明「基于 X 改写」。不要把许可证不兼容的代码直接搬进练习答案。
- 引用内容以转述和必要摘录为主，不整段照抄。来源不明的内容不要写成事实，先查再写。

## 更新日志约定

- 章节 frontmatter 的 `date` 记最后实质修改日期。改错别字、调格式不更 `date`；改实验步骤、换数字、加章节要更。
- `00-index.md` 末尾设「更新记录」小节，一行一条，格式 `- YYYY-MM-DD 做了什么`，例如 `- 2026-11-09 新增第 13 章 Verbs 编程，补齐 Soft-RoCE 实验步骤`。不写「优化内容」「完善细节」这类没有信息量的记录。
- 自动生成的总纲（`rust-os`）在末尾注明生成脚本与数据来源，改动通过重新生成完成，不在生成结果上手写更新记录。
- 增删章节时同步更新三处：章节 `order`、总纲路线表链接、`courses.ts` 的 `relatedArticles`（若涉及配套文章）。
- `est_time` 调整、`level` 或 `prerequisites` 变更，也在更新记录里留一行，方便读者判断旧笔记是否还适用。

## 校验

```
python scripts/check_course.py
```

检查项：六个 frontmatter 字段齐全且非空、`est_time` 符合「NN 分钟」、`order` 同课程内唯一、每门课有 `00-index.md`、总纲章节链接指向真实文件、`courses.ts` 的 slug 对应真实目录。输出分「错误」与「警告」，有错误时退出码 `1`。错误必须清零；警告逐条判断，属于已知取舍的在提交说明里写清原因。

`python scripts/check_prose.py <文件>` 只用于 `content/` 单篇成稿，不要拿它扫课程章节。
