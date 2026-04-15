<div align="center">

# StoneFon Portfolio & Knowledge Base

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

- **个人主页**：展示个人简介、技能方向、项目领域与联系方式
- **知识空间**：基于 MDX 的分类知识库，支持代码高亮、Mermaid 图表、图片模糊占位（blur placeholder）
- **响应式设计**：桌面、平板、手机端均可完美适配
- **暗黑模式**：完整的深色主题支持
- **GitHub Pages 部署**：通过 GitHub Actions 自动构建并部署至 GitHub Pages

### 知识空间内容

| 分类 | 说明 | 文章示例 |
|------|------|----------|
| 🧠 AI | 大语言模型、多智能体协作、AI 框架对比 | LLM Wiki 知识库构建、AI 框架横评 |
| ☕ OS | Linux 内核、设备树、内存屏障 | ARM64 启动流程分析、Device Tree 详解 |
| 🚲 自动驾驶 | 感知、定位、规划与控制算法栈 | 自动驾驶算法全栈概述 |
| ❤️ 生活 | 旅行随笔、日常感悟 | 西北行记 |

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

> **注意**：截图文件位于 `docs/preview/` 目录。首次使用需自行运行项目后截图并放入该目录。

---

## 🚀 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router, Turbopack) |
| UI | React 19 |
| 样式 | Tailwind CSS v4 |
| 动画 | Motion (Framer Motion API) |
| 内容 | MDX (next-mdx-remote) + gray-matter |
| 代码高亮 | rehype-pretty-code + Shiki |
| 图表 | Mermaid |
| 图标 | Lucide React |
| 图片优化 | Sharp + Plaiceholder |
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
# 构建（Turbopack）
pnpm build

# 或：为 GitHub Pages 构建（静态导出）
pnpm build:pages
```

---

## 📁 项目结构

```
fonstone.github.io/
├── content/                    # MDX 知识文章（按分类存放）
│   ├── AI/                    # 人工智能相关文章
│   ├── OS/                    # 操作系统相关文章
│   ├── 自动驾驶/               # 自动驾驶相关文章
│   └── 生活/                  # 生活随笔
├── public/                    # 静态资源
│   ├── fonts/                 # Gilroy 字体文件
│   ├── images/                # 文章配图
│   ├── projects/              # 项目缩略图
│   ├── portrait.jpg           # 头像
│   └── wehcart.jpg            # 微信二维码
├── src/
│   ├── app/
│   │   ├── globals.css        # 全局样式与 CSS 变量
│   │   ├── layout.tsx         # 根布局（字体、Analytics）
│   │   ├── page.tsx           # 首页
│   │   └── knowledge/         # 知识空间路由
│   │       ├── page.tsx        # 知识空间首页（分类 + 标签筛选）
│   │       ├── layout.tsx     # 知识空间布局（侧边栏）
│   │       └── [category]/[slug]/page.tsx  # 文章详情页
│   ├── components/
│   │   ├── knowledge/         # 知识空间相关组件
│   │   │   ├── KnowledgeCards.tsx
│   │   │   ├── KnowledgeMdx.tsx
│   │   │   ├── KnowledgeSidebar.tsx
│   │   │   ├── KnowledgeTagFilter.tsx
│   │   │   ├── MdxImage.tsx
│   │   │   ├── MermaidDiagram.tsx
│   │   │   ├── PostBreadcrumb.tsx
│   │   │   └── TableOfContents.tsx
│   │   ├── ui/                # 通用 UI 组件
│   │   │   ├── BoltCard.tsx
│   │   │   └── BoltIconCard.tsx
│   │   ├── WeChatCard.tsx     # 微信二维码弹窗
│   │   ├── OfficialAccountCard.tsx  # 公众号二维码弹窗
│   │   └── Console.tsx        # 开发环境 Console Provider
│   ├── hooks/
│   │   └── useNavigation.ts   # 导航状态管理
│   └── lib/
│       ├── animation/         # Motion 动画配置
│       ├── constants/         # 站点内容与配置
│       │   ├── siteContent.ts  # 个人信息、简介、格言
│       │   ├── contact.ts      # 联系方式
│       │   └── socials.ts      # 社交链接
│       ├── knowledge/         # 知识库核心逻辑
│       │   ├── knowledge.ts    # 文章加载、分类、标签、目录提取
│       │   └── blur.ts        # 图片模糊占位生成
│       └── utils/             # 工具函数
└── .github/workflows/
    └── pages.yml              # GitHub Pages 部署工作流
```

---

## 🎨 定制指南

### 修改个人信息

编辑 `src/lib/constants/` 下的文件：

| 文件 | 内容 |
|------|------|
| `siteContent.ts` | 姓名、简介、格言、头像 |
| `contact.ts` | 邮箱、电话、地址 |
| `socials.ts` | GitHub、LinkedIn 等社交链接 |

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

分类名会自动映射为 URL slug（如 `自动驾驶` → `autonomous-driving`），映射关系在 `src/lib/knowledge/knowledge.ts` 的 `CATEGORY_SLUG_MAP` 中配置。

### 修改 SEO 元数据

编辑 `src/app/layout.tsx` 中的 `metadata` 导出。

### 主题与样式

- 全局配色和间距：修改 `src/app/globals.css` 中的 CSS 变量
- 字体：替换 `public/fonts/` 下的字体文件，并在 `src/app/layout.tsx` 中更新配置

---

## 🔧 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（Turbopack） |
| `pnpm build` | 生产构建（Turbopack） |
| `pnpm build:pages` | 为 GitHub Pages 静态导出构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行 ESLint |

---

## 🌐 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages。推送至 `master` 分支后，`.github/workflows/pages.yml` 工作流会自动：

1. 安装依赖（pnpm）
2. 执行 `pnpm build:pages` 生成静态文件到 `out/` 目录
3. 部署至 GitHub Pages

无需手动操作。

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">
  <p>Built with Next.js & Tailwind CSS</p>
</div>