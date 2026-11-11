<div align="center">

# StoneFon 知识空间

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)](https://tailwindcss.com/)

**StoneFon** 的个人主页与知识空间——深耕嵌入式系统与操作系统底层开发，对 AI 模型在边缘设备上的部署充满热情。

🌐 [在线访问](https://fonstone.github.io) · 🐛 [反馈问题](https://github.com/fonstone/fonstone.github.io/issues)

</div>

---

## ✨ 项目概览

本项目是一个基于 Next.js 构建的个人主页与知识库系统，具有以下核心功能：

- **可交互的五层系统栈**：`/start` 与首页共用同一份数据，点击层切换文章与课程，层数由内容目录实时派生
- **全站学习进度仪表盘**：`/progress` 汇总 8 门课的 localStorage 勾选记录，给出总进度环与「继续下一章」
- **项目实战**：首页用 4 张成果物卡把读者导向可动手的课程，文章页顶部给出该文配套课程的动手目标；数据全部从 `courses.ts` 派生
- **出处索引墙**：`/papers` 从各篇文末参考资料自动抽取 432 条出处，按主题与文章聚合
- **静态站内搜索**：`/search` 与任意页面的 `⌘K` / `Ctrl K` 命令面板，索引在构建期生成，无服务端
- **统一导航**：全站共用顶部导航，桌面端课程下拉、「更多」下拉与移动端菜单覆盖全量入口
- **知识空间**：基于 MDX 的分类知识库，支持代码高亮、Mermaid 暗色适配、标签收口、图片模糊占位
- **课程与实验笔记**：`projects/` 下 8 门按章节组织的课程，带总纲、难度、前置要求、配套文章、上/下篇与进度
- **文章与课程互链**：文章详情页反查配套课程、同系列文章与顺序导航，课程章节页反查配套长文
- **阅读增强**：代码一键复制、图片灯箱、阅读进度条、跳转正文链接、focus 环
- **响应式布局与三态主题**：跟随系统，也可手动切浅色 / 深色，Mermaid 随主题重渲染
- **GitHub Pages 部署**：通过 GitHub Actions 自动构建并部署至 GitHub Pages

### 知识空间内容

| 分类 | 说明 | 文章示例 |
|------|------|----------|
| 🧠 AI | 大语言模型、多智能体协作、AI 框架对比 | LLM Wiki 知识库构建、AI 框架横评 |
| ☕ OS | Linux 内核、设备树、内存屏障、超低时延 | ARM64 启动流程分析、Device Tree 详解 |
| 🚲 自动驾驶 & 具身智能 | 感知、定位、规划与控制算法栈 | 自动驾驶算法全栈概述 |
| 📋 管理 | 团队管理、需求流程、教练式辅导 | GROW 教练模型、IPD 需求管理流程 |

`content/` 下共 63 篇技术长文（含 4 条招牌系列各自的索引），`projects/` 下有 8 门按章节组织的课程，共 194 篇（含 8 份课程总纲）。每门课都有总纲、难度、前置要求、成果物与配套知识文章。第一次访问建议从 `/start` 开始，而不是直接扎进 `/knowledge` 的标签墙。

---

## 📸 页面预览

> 以下截图来自本地开发环境，展示站点各主要页面。运行 `pnpm dev` 后访问 http://localhost:3000 即可体验。

<p align="center">
  <img src="docs/preview/home.png" alt="首页" width="80%" />
</p>

<p align="center">
  <img src="docs/preview/knowledge.png" alt="知识空间" width="45%" />
  <img src="docs/preview/article.png" alt="知识文章页" width="45%" />
</p>

<details>
<summary>📷 更多截图</summary>

<p align="center">
  <img src="docs/preview/home-dark.png" alt="首页 - 暗色模式" width="45%" />
  <img src="docs/preview/contact.png" alt="联系方式" width="45%" />
</p>
</details>

> **注意**：`docs/preview/` 目前只有早期模板截图，上面引用的 `home.png` 等文件尚未补齐，需要重新截图后放入该目录。

---

## 🚀 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router, Turbopack) |
| UI | React 19 |
| 样式 | Tailwind CSS v4 |
| 动画 | CSS 动画（globals.css） |
| 内容 | MDX (next-mdx-remote) + gray-matter |
| 代码高亮 | rehype-pretty-code + Shiki |
| 图表 | Mermaid |
| 图标 | Lucide React |
| 图片优化 | Sharp + Plaiceholder + WebP |
| SEO | sitemap.xml / robots.txt / RSS / JSON-LD / 每页 metadata |
| 部署 | GitHub Pages (GitHub Actions) |

---

## 📦 快速开始

### 前置要求

- Node.js 18+
- pnpm 9+

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/fonstone/fonstone.github.io.git
cd fonstone.github.io

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看站点。

### 生产构建

```bash
# 构建（Turbopack），会先自动生成搜索索引与出处索引
pnpm build

# 或：为 GitHub Pages 构建（静态导出）
pnpm build:pages

# 只刷新两份索引，不跑构建
pnpm build:indexes

# 产物级验收（读 out/ 下的 HTML，检查 title、链接、资源与 SEO 文件）
node scripts/verify-build.mjs
```

---

## 📁 项目结构

```
fonstone.github.io/
├── content/                    # MDX 知识文章（按分类存放）
│   ├── AI/                    # 人工智能相关文章
│   ├── OS/                    # 操作系统相关文章
│   ├── 自动驾驶 & 具身智能/     # 自动驾驶与具身智能相关文章
│   └── 管理/                  # 团队管理与研发流程
├── projects/                  # 按章节组织的课程与实验笔记（8 门课）
├── courses/                   # 课程原始素材归档，不参与构建（见 courses/README.md）
├── public/                    # 静态资源
│   ├── fonts/                 # Gilroy 字体文件
│   ├── images/                # 文章配图（WebP）
│   ├── portrait.webp          # 头像
│   ├── search-index.json      # 构建期生成的全站搜索索引
│   └── wehcart.webp           # 微信二维码
├── src/
│   ├── app/
│   │   ├── globals.css        # 全局样式、暗色变体、阅读增强 CSS
│   │   ├── layout.tsx         # 根布局（字体、metadata、主题首帧脚本、跳转正文）
│   │   ├── page.tsx           # 首页（系统栈、进度摘要、项目实战）
│   │   ├── start/             # 「从这里开始」阅读路线图（可交互系统栈）
│   │   ├── search/            # 站内搜索页
│   │   ├── papers/            # 出处索引墙
│   │   ├── progress/          # 学习进度仪表盘
│   │   ├── sitemap.ts / robots.ts / not-found.tsx / feed.xml/
│   │   ├── knowledge/         # 知识空间路由
│   │   └── projects/
│   │       ├── [project]/     # 8 门课程与全部章节共用的动态路由
│   │       ├── ai/ os/ qemu-cpu/  # 三个课程分组页
│   │       └── page.tsx       # 课程总览
│   ├── components/
│   │   ├── SiteNav.tsx        # 全站统一导航（课程 / 更多下拉、移动端菜单）
│   │   ├── ThemeToggle.tsx    # 三态主题切换
│   │   ├── SystemStack.tsx    # 可交互分层系统栈
│   │   ├── HandsOnProjects.tsx / HandsOnCallout.tsx / ArticlePrevNext.tsx
│   │   ├── PapersBrowser.tsx / RelatedContent.tsx
│   │   ├── search/            # ⌘K 命令面板与搜索页客户端
│   │   ├── reading/           # 代码复制、图片灯箱、阅读进度条
│   │   ├── knowledge/         # 知识空间组件（含 TagCloud、Mermaid 暗色适配）
│   │   ├── course/            # 课程总览、分组页、进度仪表盘与摘要
│   │   ├── projects/          # 课程 MDX 渲染
│   │   └── ui/                # 通用 UI 组件
│   └── lib/
│       ├── constants/
│       │   ├── site.ts / siteContent.ts / contact.ts / socials.ts
│       │   ├── courses.ts     # 课程元数据单一数据源（标题/难度/前置/成果物/互链/实战精选）
│       │   └── learningMap.ts # 五层系统栈、四条招牌系列与各自的索引文章
│       ├── generated/papers.ts # 构建期生成的出处索引（勿手工编辑）
│       ├── learningMapData.ts # 分层栈数据派生
│       ├── courseProgress.ts  # localStorage 进度读写
│       ├── search.ts          # 搜索打分与索引加载
│       ├── knowledge/         # 知识库核心逻辑
│       └── projects/          # 课程数据层
├── scripts/                   # 内容质量、索引生成、元数据归一与资源处理脚本
└── .github/workflows/
    └── pages.yml              # GitHub Pages 部署工作流
```

---

## 🎨 定制指南

### 修改个人信息

编辑 `src/lib/constants/` 下的文件：

| 文件 | 内容 |
|------|------|
| `site.ts` | 站点 URL、名称、默认描述与关键词 |
| `siteContent.ts` | 姓名、简介、格言、头像 |
| `contact.ts` | 邮箱 |
| `socials.ts` | GitHub 链接 |

### 添加知识文章

在 `content/` 下创建新分类文件夹或向已有分类中添加 `.mdx` 文件：

```mdx
---
title: "文章标题"
description: "文章简介"
date: "2026-04-15"
tags: ["标签1", "标签2"]
---

## 正文内容

这里是 Markdown / MDX 正文...
```

分类名会自动映射为 URL slug（如 `自动驾驶 & 具身智能` → `autonomous-driving`），映射关系在 `src/lib/knowledge/knowledge.ts` 的 `CATEGORY_SLUG_MAP` 中配置。

写 `content/` 下的技术知识文章时，遵循 `docs/writing-guide.md` 的完整写作规范，交稿前运行 `python scripts/check_prose.py <稿件路径>`。

### 新增一门课程

课程元数据集中在 `src/lib/constants/courses.ts` 的 `COURSES`。路由、导航下拉、sitemap、`/start` 路线图、课程总纲和文章页的「配套课程」全部由它派生，**不需要新建或修改任何 `page.tsx`**：

1. 在 `projects/<slug>/` 下写章节 `.md` / `.mdx`，frontmatter 至少含 `title`、`description`、`date`、`order`、`est_time`、`tags`。
2. 在 `COURSES` 里加一条（含 `relatedArticles`，值为 `${分类slug}/${文章slug}`）；需要新分组时再往 `COURSE_HUBS` 加一条。
3. 依次运行：
   ```bash
   node scripts/normalize-course-metadata.mjs   # 补 est_time / 空 description，归一写法
   node scripts/generate-course-indexes.mjs     # 生成 00-index.md（文案在脚本 INTRO 中）
   node scripts/validate-content-links.mjs      # 校验文章与课程引用
   python scripts/check_course.py               # 校验字段、学时、order、总纲链接
   node scripts/build-indexes.mjs               # 刷新搜索与出处索引
   ```
4. 若要调整路线图分组或招牌系列，编辑 `src/lib/constants/learningMap.ts`；`indexKey` 指向各系列的独立索引 MDX。

课程内容的字段口径、总纲结构、练习与来源标注见 `docs/course-guide.md`。注意 `docs/writing-guide.md` 只约束 `content/` 单篇长文，课程需要的难度分级与前置要求不受其「禁止水平分层标签」限制。

### 维护搜索与出处索引

`public/search-index.json` 与 `src/lib/generated/papers.ts` 都由 `scripts/build-indexes.mjs` 生成，**不要手工编辑**。新增或改写文章、章节、参考资料后运行 `pnpm build:indexes`，或直接构建（两个 build 命令已串联该脚本）。出处索引只抽取 `## 参考资料 / 参考 / 参考文献 / 来源列表 / 来源` 区里的列表项。

### 项目实战板块

`src/lib/constants/courses.ts` 里的 `FEATURED_HANDS_ON` 只登记精选课程 slug 与成果物序号；卡片文案、难度取 `COURSES.outcomes` / `COURSES.level`，章节数由 `projects/` 目录派生，不维护第二份项目描述。文章页的 `HandsOnCallout` 通过 `getRelatedCourses(articleKey)` 反查配套课程，没有关联课程时不渲染。要换首页精选项目，只改 `FEATURED_HANDS_ON`。

长文里的实验数字仍写在正文与文末参考资料，`/papers` 出处索引墙自动抽取，不再单独维护一份数字卡数据。

### 修改 SEO 元数据

全站默认值在 `src/lib/constants/site.ts`，根 metadata 在 `src/app/layout.tsx`。文章页、课程章节页与课程聚合页各自通过 `generateMetadata` 生成独立标题、描述、canonical 与 JSON-LD。`sitemap.ts` 从内容目录与 `courses.ts` 自动派生所有 URL。

### 图片资源

`public/images/` 下的图片统一使用 WebP。新增 PNG / JPG 后运行：

```bash
node scripts/optimize-images.mjs
```

脚本会把图片压缩为 WebP、把内容里的站内 `/images/*.png|jpg` 引用改为 `.webp`，并校验引用完整性。外部 URL 与文档示例文字不受影响，可重复运行。`scripts/optimize-root-images.mjs` 负责 `public/` 根目录三张图片的同型处理（已转换完成，脚本幂等）。

### 主题与样式

- 全局配色和间距：修改 `src/app/globals.css` 中的 CSS 变量
- 字体：替换 `public/fonts/` 下的字体文件，并在 `src/app/layout.tsx` 中更新配置
- 暗色由 `<html class="dark">` 驱动，首帧由 `layout.tsx` 的内联脚本按系统偏好或 localStorage 同步设置；`ThemeToggle.tsx` 提供跟随系统 / 浅色 / 深色三态切换，Mermaid 图监听 `stonefon-theme-change` 事件重渲染
- 键盘可达性：`globals.css` 统一 focus-visible 环，页面顶部有「跳到正文」链接

---

## 🔧 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（Turbopack） |
| `pnpm build` | 生产构建（Turbopack），自动刷新索引 |
| `pnpm build:pages` | 为 GitHub Pages 静态导出构建，自动刷新索引 |
| `pnpm build:indexes` | 只生成搜索与出处索引 |
| `pnpm start` / `pnpm lint` | 启动生产服务器 / 运行 ESLint |
| `node scripts/build-indexes.mjs` | 生成 `public/search-index.json` 与 `src/lib/generated/papers.ts` |
| `node scripts/verify-build.mjs` | 产物级验收：title、canonical、JSON-LD、站内链接与资源、SEO 文件 |
| `node scripts/validate-content-links.mjs` | 校验 `courses.ts` / `learningMap.ts` 的文章与课程引用 |
| `node scripts/normalize-course-metadata.mjs` | 归一课程章节的 `est_time` 与空 `description` |
| `node scripts/generate-course-indexes.mjs` | 从元数据与章节 frontmatter 生成课程总纲 |
| `node scripts/add-article-course-links.mjs` | 给同题文章追加「配套课程」段落 |
| `node scripts/optimize-images.mjs` / `optimize-root-images.mjs` | 图片转 WebP 并迁移引用（幂等） |
| `python scripts/check_prose.py <稿件>` | 中文成稿硬禁令检测（已排除网址、代码、表格字段） |
| `python scripts/check_course.py` | 课程字段、学时、order、总纲链接校验 |
| `python scripts/clean-legacy-prose.py --apply` | 早期文章硬禁令批量清理（默认 dry-run，幂等） |

---

## 🌐 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages。推送至 `master` 分支后，`.github/workflows/pages.yml` 工作流会自动：

1. 安装依赖（pnpm 9，`--frozen-lockfile`）
2. 执行 `pnpm build:pages`，先生成搜索索引与出处索引，再静态导出到 `out/`
3. 部署至 GitHub Pages

无需手动操作。

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">
  <p>Built with Next.js & Tailwind CSS</p>
</div>
