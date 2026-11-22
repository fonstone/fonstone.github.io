# 站点优化审计

审计日期 2026-11-08。范围包含页面实现、`content/` 知识文章、`projects/` 与 `courses/` 课程内容。本报告只做分析，未修改任何源码或内容文件。文中数字均来自仓库实测或构建产物 `out/`。

---

## 一、判断

内容家底足够撑起一个有辨识度的技术站，问题出在出口。

仓库里有 60 篇知识长文、187 篇课程章节、298 个 Mermaid 图、约 3500 个代码块、一套别处少见的写作门禁脚本 `scripts/check_prose.py`。这些资产现在被压在三层东西下面。

1. 264 个静态页面共用同一份模板 SEO 元数据。标题都是 `StoneFon | Personal Portfolio`，描述都是 `A modern and minimalist portfolio ... in web development and design`。
2. 知识空间首页铺了 274 个标签按钮，其中 219 个点进去只有一篇文章。
3. 首页只硬编码了 4 个项目入口。8 门课里 6 门没有直达路径，`courses/` 下 16 篇 md 从未被任何路由渲染。

访客看到的是一个还没改完的模板站，搜索引擎看到的是 264 个重复页面。内容不需要重做，需要的是门面、路径和身份。

站点主线其实很清晰，README 写了「嵌入式系统与操作系统底层开发 + AI 模型在边缘设备上的部署」。60 篇文章里 AI 24、OS 21、自动驾驶与具身智能 11，反复出现同一组母题，AI 如何进入工程流程，以及系统的确定性约束如何承接 AI。这条交叉带在中文技术博客里稀缺，目前没有任何一个页面把它讲出来。

---

## 二、家底与实测数据

| 项 | 数值 | 来源 |
|---|---|---|
| 知识文章 | 60 篇 mdx，4 分类 | `content/` |
| 分类分布 | AI 24 / OS 21 / 自动驾驶&具身智能 11 / 管理 4 | 目录统计 |
| 课程章节 | 187 篇，8 门课 | `projects/` |
| 课程分布 | rust-os 89 / rdma 25 / ai-agent 23 / ai-infra 12 / autosar-fs 12 / rust-learning 12 / qemu 8 / chcore 6 | 目录统计 |
| 未渲染内容 | 16 篇 md + 1 个抓取脚本 | `courses/`，`src/` 零引用 |
| 静态产物页 | 264 个内容页（knowledge 65 + projects 199） | `out/` |
| 图片资产 | `public/` 220 MB，其中 655 个 PNG 共 196.1 MB | `du` / `find` |
| 最大单图 | 5.6 MB `public/images/rust-os/rcore/chapter9/device-os-detail.png` | `find` |
| 图表资产 | 298 个 `<MermaidDiagram>`，覆盖 47/60 篇；约 700 行代码围栏 | 全文统计 |
| 标签 | 274 个去重标签，219 个只出现 1 次（80%） | frontmatter 统计 |
| 文章总量 | 27,288 行 / 1.58 MB | `wc` |
| 课程总量 | 121,494 行 / 约 7087 行代码围栏 | `wc` |
| SEO 产物 | `out/` 下只有 `404.html`，无 sitemap / robots / feed | `ls out` |

**关键实测**。抽查三个文章产物页，`<title>` 与 `<meta name="description">` 完全相同，均为模板文案。

```
out/knowledge/ai/agent-best-practices/index.html
out/knowledge/ai/agent-orchestration-paradigms/index.html
out/knowledge/ai/ai-agent-knowledge-base/index.html
→ <title>StoneFon | Personal Portfolio</title>
→ description: ... in web development and design.
```

---

## 三、四个阻断项

这四项决定站点能否被找到、能否打开、是否属于作者本人。建议先于任何内容工作处理。

### 3.1 SEO 全线缺失

`src/app/layout.tsx:41-63` 的 metadata 是模板原文，`authors` / `creator` / `publisher` 全是 Wafastarz，`<html lang="en">` 与全中文内容不符。全项目 `generateMetadata` 零匹配，`sitemap.ts`、`robots.ts`、`not-found.tsx`、`feed.xml/route.ts`、`opengraph-image.tsx`、JSON-LD 均不存在。

后果是 264 个页面在搜索结果里是同一条。这是当前投入产出比最高的一处修复，`knowledge.ts` 与 `projects.ts` 已返回 `title` / `description`，详情页加 `generateMetadata` 只需接线。

### 3.2 图片体积与加载

`next.config.ts:18` 设了 `images.unoptimized: true`，`KnowledgeMdx.tsx:7-21` 的 `FallbackImg` 用原生 `<img>` 且无 width / height。196 MB PNG 原图直出。单篇 `qwen-drive-1.0-vlm-foundation-model.mdx` 引用 19 张图，其中 6 张超过 1 MB，合计约 13 MB。`MdxImage.tsx` 已实现 blur 占位却只被 `ProjectMdx.tsx` 使用。

同时 `public/projects/work-1~4.jpg`（约 3.6 MB）、`person2.jpg`、部分模板 SVG 无引用仍被打包。

### 3.3 导航断裂

没有统一导航组件。首页 `page.tsx:75-107` 内联了 5 个 `#` 锚点且 `hidden md:flex`，移动端完全没有菜单。`knowledge/layout.tsx` 与 `projects/layout.tsx` 各自只有一个「返回主页」。`Navbar.tsx` / `MobileNav.tsx` 等 10 个模板组件是死代码，`navItems.ts` 三项全为 `#`。

首页 4 个硬编码入口指向 `/projects/ai`、`/projects/qemu-cpu`、`/projects/os`、`/projects/autosar-functional-safety`，8 门课里 6 门无直达路径。`next.config.ts:9-16` 的 `basePath` 条件启用，但所有 `href` 硬编码 `/knowledge/...`，换到非 user-page 仓库名会全站 404。

### 3.4 模板身份残留

| 位置 | 残留内容 |
|---|---|
| `package.json:2-19` | `name: bentofolio`，author / homepage / repository / bugs 全为原模板作者 |
| `src/app/layout.tsx:43-47` | 描述写 web development and design，作者 Wafastarz |
| `src/lib/constants/contact.ts:3-6` | 印尼电话 +62、Demak / Central Java |
| `src/lib/constants/socials.ts:3-5` | linkedin / twitter / instagram 仍为 wafastarz、masapaaaa |
| `src/lib/utils/consoleUtil.ts:20-36` | Wafastarz ASCII 彩蛋、`window.wafastarz` |
| `public/humans.txt` | 整份是模板作者信息 |
| `Footer.tsx:15-21` | 「Lavanya Yasmeen」 |
| `README.md:35,124` | 宣称有「生活 / 西北行记」分类，实际第 4 类是「管理」 |

`consoleUtil.ts:122-133` 还有一个每 500 ms 运行的 `setInterval` 用于检测 devtools，全局持续轮询，且伴随 `console.clear()`。

---

## 四、页面优化清单

### 4.1 首页

`src/app/page.tsx` 是 425 行的 5 段纵向 section，不是真正的 Bento 不规则网格。`#recent-updates` 与 `#knowledge` 是数据驱动（`allPosts.slice(0,6)`、`categories.slice(0,6)`），`#projects` 的 4 张卡完全硬编码。

缺的东西包括全站统计（文章总数、总字数、最后更新）、任何课程入口、「最新更新」时间戳、以及能表达站点主线的视觉符号。站点 slogan「从硅片到系统，每一层都值得敬畏」只作为一句 quote 摆在首屏，没有变成信息架构。

### 4.2 知识空间列表页

`knowledge/page.tsx` 只渲染 `KnowledgeTagFilter`。已有分类分组与 `?tag=` URL 筛选，侧栏标签云带 count。

| 缺失 | 位置 |
|---|---|
| 搜索 | `KnowledgeTagFilter.tsx:34-47` 仅有 tag 过滤 |
| 排序 UI | 服务端固定按 date 降序，`knowledge.ts:158-165` |
| 分页 | 60 篇一次全渲染 |
| 标签墙闸门 | `:88` 全量 `allTags.map`，274 个按钮 |
| 卡片信息 | 无封面、无阅读时长、无字数、无「含 19 张图」这类线索 |
| 置顶 / 导读 / 路线图 | 无 |

`KnowledgeCards.tsx:41` 用 `tags.slice(0,3)`，而 40/60 篇的首标签是 `AI` / `OS` / `操作系统` / `自动驾驶` 四个泛词，卡片在视觉上高度雷同。298 个 Mermaid 图在列表页完全不可见。

### 4.3 文章详情页

`knowledge/[category]/[slug]/page.tsx` 只有约 36 行结构。已有面包屑、H1、日期、tags、prose 排版、TOC 滚动高亮（`hidden xl:block`）、Shiki 双主题代码高亮、Mermaid、rehype-slug 标题锚点。

无 `generateMetadata`、上一篇/下一篇、相关推荐、阅读进度、分享、评论、返回顶部、字数统计、代码复制按钮、图片 lightbox、作者署名、更新时间、系列导航、封面 OG 图。

值得注意的是 `projects/[project]/[slug]/page.tsx:95-128` 已经实现了上一篇/下一篇，`:89-93` 有 `MarkCompleteButton`，`:66-70` 展示 description。两套文章体系能力割裂且互不复用，把 projects 的实现搬过来是低成本改动。

### 4.4 SEO 基建清单

| 要补 | 落点 |
|---|---|
| `metadataBase` / `alternates.canonical` / `title.template` | `src/app/layout.tsx` |
| `lang="zh-CN"`、作者改 StoneFon、清理模板描述与 keywords | 同上 |
| 两类详情页 `generateMetadata` | `knowledge/[category]/[slug]/page.tsx`、`projects/[project]/[slug]/page.tsx` |
| `sitemap.ts` / `robots.ts` / `not-found.tsx` | `src/app/` |
| RSS 或 Atom feed | `src/app/feed.xml/route.ts` |
| JSON-LD `BlogPosting` / `Course` | 详情页 |
| OG 图 | `opengraph-image.tsx` 或静态图 |

### 4.5 性能与可访问性

`framer-motion` 与 `motion` 双份依赖，`motion` 全项目零引用，`@vercel/analytics` 在 GitHub Pages 上 `isVercel=false` 永不加载，`src/lib/animation/variants.ts` 230 行几乎闲置。Gilroy 四个 TTF 共约 592 KB，无 woff2 与子集化。78 个内容文件使用 Mermaid，进页即动态 import 全量包，主题写死 `neutral`（`MermaidDiagram.tsx:22`），无暗色适配。

可访问性上，实际渲染代码零处 `focus:` / `focus-visible`；`WeChatCard.tsx:24-29` 与 `OfficialAccountCard.tsx:24-29` 用 `<div role="button">`；`WeChatCard.tsx:44` 遮罩 `z-0`，另一个弹窗用 `z-[100]`，前者易被 stacking context 盖住。暗色仅 `darkMode: "media"` 跟随系统且 `tailwind.config.ts` 在 Tailwind v4 下未被 `@config` 加载，`prefers-reduced-motion` 只覆盖两个自定义动画类。

### 4.6 死代码

`Navbar.tsx`、`Footer.tsx`、`MobileNav.tsx`、`HamburgerButton.tsx`、`HeroSection.tsx`、`AboutContactSection.tsx`、`PersonImageSection.tsx`、`ProjectsSection.tsx`、`ContactModal.tsx`、`ui/BoltIconCard.tsx`、`knowledge/KnowledgeCards.tsx`（部分版本）无路由引用，`constants/navItems.ts`、`constants/projects.ts` 为模板数据。删除不影响构建。

---

## 五、文章整理

### 5.1 质量上限高，组织下限低

后期的文章严格遵循 `docs/writing-guide.md`。`ultra-low-latency-research-map.mdx` 用「一辆车的制动控制要求在毫秒级完成」开头，含 26 处数字标记和 7 篇论文的实验数字，结尾写「这个系列是 2026 年 10 月的快照。论文在更新，数字会变」，没有升华。`deterministic-multicore-shared-data.mdx` 有 55 处数字、12 条论文、6 个代码块、3 个 Mermaid，开头是 ARM 工业挑战赛 2022 的 26% 数据。`qwen-drive-1.0-vlm-foundation-model.mdx` 保留了 arXiv 编号 2609.00111 这样的真实检索痕迹。

但这些文章按日期倒序堆在一堵 274 项标签墙后。全站没有「从这里开始」「入门」「路线图」类页面，唯一带系列索引章节的 `ultra-low-latency-research-map.mdx` 藏在 OS 分类。最适合当入口的 `autonomous-driving-algorithm-overview.mdx` 是最早一篇，106 行、零图零表零代码、description 只有 35 字，还因倒序排在列表末尾。

### 5.2 四条现成的招牌系列

素材已成组，缺的只是索引与命名。

| 系列 | 篇数 | 现状 |
|---|---|---|
| 超低时延与确定性计算 | 8 | 已成型。7 篇 2026-10-18 同日发布，统一逗号式标题，双向链接闭环，唯一有索引的系列 |
| AI 编码工程化 SDD / Skill / Harness | 约 17 | 最大主题群，完全无组织。可从 `openspec-introduction.mdx` 排到 `llm-uncertainty-compliance-engineering.mdx` |
| 自动驾驶大模型与数据闭环 | 约 8 | 2026-07-26 有 4 篇同日同式样综述，天然系列，无索引 |
| AI × OS 交汇 | 约 8 | 跨两个分类，`ai-era-heterogeneous-os*.mdx`、`xpu-preemptive-scheduling.mdx`、`edge-ai-deployment-challenges.mdx`。站点最独特，最适合做对外门面 |

### 5.3 元数据病灶

| 问题 | 具体位置 |
|---|---|
| 41 个内容文件带 UTF-8 BOM | 集中在 `projects/ai-agent/` 与 `content/AI/open-harmony-sdd-practice-guide.mdx`。2026-11-08 实测 `gray-matter` 能正确解析带 BOM 的 frontmatter，不影响列表页显示，属于格式噪音 |
| 2 个 `image` 死字段 | `harness-engineering-knowledge-base.mdx`、`vibe-flowing-ai-native-engineering-practice.mdx`。`knowledge.ts:6-12` 类型不含 `image`，卡片不渲染 |
| 字段顺序不统一 | 约 20 篇为 `title→date→description→tags`，其余为 `title→description→date→tags` |
| 10 篇空泛摘要 | `device-tree-guide.mdx`(34字)、`autonomous-driving-algorithm-overview.mdx`(35字)、`memory-barrier-deep-dive.mdx` 等，套话集中为「系统梳理」「深度拆解」 |
| 32 篇标题带提示性冒号 | 与 `writing-guide.md:86` 禁令直接冲突，最长 52 字（`autosar-os-erika3-tc38x.mdx`） |
| `draft` 字段零使用 | `knowledge.ts:11` 支持但无内容使用 |

### 5.4 五个具体的标题改法

| 文件 | 现标题 | 建议 |
|---|---|---|
| `llm-driven-os-survey.mdx` | LLM 驱动的操作系统，全景综述与架构解析 | 「LLM 当 OS 内核用，AIOS、上下文管理与调度逐模块拆解」。description 里已有这些具体词，标题却没有 |
| `device-tree-guide.mdx` | Linux 设备树详解 | 「Linux 设备树，DTS 语法到 K210 `k210.dts` 逐行拆解」。把正文已有的 36 个代码块前置 |
| `ai-frameworks-comparison.mdx` | Superpowers vs GStack vs GSD，AI 编码框架对比 | 「Superpowers / GStack / GSD 怎么选，先分清结构、能力还是流程」。直接把文章结尾结论当标题 |
| `autonomous-driving-algorithm-overview.mdx` | 自动驾驶算法概述，从感知到决策的完整技术栈 | 「自动驾驶入门地图，算法栈四层与本空间 11 篇怎么读」。改成索引型标题并扩写成路线图 |
| `ai-agent-knowledge-base.mdx` | AI Agent 知识点全面梳理，定义、架构、规划、记忆、工具、RAG、评估与安全 | 「AI Agent 全栈知识点，9 张架构图串起 ReAct、记忆、RAG 与评估」。承诺具体交付物 |

### 5.5 内链网络几乎不存在

全站唯一双向闭环是超低时延系列，1 篇索引表链出 7 篇，7 篇结尾统一回链索引。其余 50 余篇零内链，被链接的文章目标总共约 6 个。

`content/` 中指向 `/projects/` 或 `/courses/` 的链接为 **0**。同时站内存在多组同题双份资产，全部没有互相导流。

- `content/自动驾驶 & 具身智能/autosar-os-erika3-tc38x.mdx`（1410 行）↔ `courses/autosar-os/` 7 章 ↔ `projects/autosar-functional-safety/` 12 章
- `content/AI/ai-agent-knowledge-base.mdx`（自述基于 DataWhale《Hello Agents》）↔ `projects/ai-agent/` 23 章 ↔ `courses/hello-agents-all-chapters-merged.md`
- `content/AI/ai-infra-fullstack-architecture-2026.mdx` ↔ `projects/ai-infra/` 12 章

读完综述去动手做实验，这条最自然的转化路径被掐断了。

### 5.6 两代文风断层

分水岭在 2026 年 8 月，即 `writing-guide.md` 与 `check_prose.py` 引入前后。

| 指标 | 2026-04~07（33 篇） | 2026-08~11（26 篇） |
|---|---|---|
| 标题带冒号 | 26/33 | 6/26 |
| 正文含破折号 | 28/33 | 2/26 |
| 正文含提示性冒号 | 33/33 | 2/26 |
| 含翻案句 | 20/33 | 2/26 |
| 结构预告「本文将」 | 6/33 | 0/26 |

最刺眼的三处是 `autonomous-driving-algorithm-overview.mdx` 结尾的「重新定义可能的边界」，`data-loop-survey.mdx:439` 的「温室花朵 / 终局中胜出」，`vibe-flowing-ai-native-engineering-practice.mdx` 的「不是终点，而是新的起点」。`AGENTS.md` 本就要求交稿前跑 `check_prose.py`，早期 33 篇显然没过这道门禁。不必全文重写，只清硬禁令与结尾就能让两代文风一致。

---

## 六、课程内容

### 6.1 像 8 摞按序号排整齐的资料，不像课程

| 维度 | 现状 | 应有 |
|---|---|---|
| 课程总纲 | 8 门课只有 1 份 `projects/ai-agent/00-index.md`，且章号 1~20 与文件名 01~22 错位 | 8/8 |
| 难度与前置 | 187 篇 frontmatter 中 `difficulty` / `prerequisites` 为 0 | 每课声明 |
| 学时口径 | 34 篇无 `est_time`，有值的混用「30分钟」「60 分钟」「10-15 小时」 | 统一为「NN 分钟」并给总学时 |
| 练习 | rdma 1/25、ai-infra 0/12 有练习标题；`rewrite_rust_course.py:303` 与 `convert_rust_lessons.py:157` 在转换时主动删除 quiz 元素 | 每章目标、实验、练习、参考答案、小结 |
| 进度闭环 | localStorage 勾选，`[project]/[slug]/page.tsx:89` 硬编码 7 个 slug 白名单，**rdma 不在其中**，25 篇有进度条却无完成按钮 | 按目录自动判断，8/8 闭环 |
| 可复现环境 | 约 7087 行代码围栏，无版本锁定、无一键脚本、无预期输出、无运行截图 | 仓库 tag + Docker + 验收命令 |
| 更新与信任 | `date` 只有 6 个批量值，117 篇同为 2026-07-12，全库 0 个课程 CHANGELOG，无 `updated` / `author` | 每课 CHANGELOG + 勘误 |
| 来源与许可 | rdma 25 篇为知乎《RDMA杂谈》搬运，ai-agent 书稿改编，rust-os 后半为 rCore-Tutorial-v3 搬运，页面上无声明 | 每章标注来源与许可 |
| 统一入口 | 散在 3 个 hub + 首页 4 个硬编码入口，无课程总览 | 单一 `/courses` 总览页 |

### 6.2 重复与死内容

- `courses/autosar-os/` 7 篇与 `projects/autosar-functional-safety/` 前 7 篇，去掉 frontmatter 后正文 diff 仅 8~18 行。
- `courses/chcore/` 6 篇与 `projects/chcore/` 6 篇逐字重复。`courses/chcore/chcore-microkernel-os.md`（840 行课程全解析）反而是唯一没搬进 `projects/` 的总纲。
- `courses/README.md` 的 25 个 RDMA 链接全部是死链，对应内容已迁到 `projects/rdma/`。
- `courses/hello-agents-all-chapters-merged.md` 27,914 行 / 1.35 MB，与 `projects/ai-agent/` 22 章内容重叠，站内还残留 `../chapter6/第六章%20框架开发实践.md#习题` 这类原书死链。
- `projects/ai-agent/images/` 133 个文件与 `public/images/courses/ai-agent/` 逐一同名且 md5 相同，是冗余副本。
- `courses/` 整目录在 `src/` 中零引用，`src/lib/projects/projects.ts:42` 的 `PROJECTS_ROOT` 只指向 `projects/`。

### 6.3 章节层已自动化，课程层是手工作坊

`getProjectCategories()` 扫描目录、`walkFiles()` 递归解析 frontmatter、按 `order` 排序、`getProjectStaticParams()` 生成路由，新增章节零改动。但课程级元数据全部硬编码在 11 个 `src/app/projects/*/page.tsx` 里，3 个 hub 各有硬编码 `courses = [...]` 数组，`PROJECT_SLUG_MAP` 是 7 条恒等映射且漏了 `ai-agent`，`src/app/page.tsx:311-335` 首页入口写死。

新增一门课至少要改 2 处，通常 3~4 处。把课程元数据抽到 `projects/<slug>/course.json` 或 `00-index.md` 的 frontmatter，可降到 0~1 处。

### 6.4 规范空白

`docs/` 下 8 份 md 里，`writing-guide.md` 与 `explanation-patterns.md` 开头都写明「面向本工程 content/ 下的技术知识文章」，只管单篇长文。其余 6 份是 superpowers 的设计与实施文档，含一份 RDMA 搬运方案。

没有一份定义课程大纲、章节序列、难度分级、学时口径、练习模板、前置要求、成果物或更新日志。更需要注意 `writing-guide.md:86` 与 `explanation-patterns.md:225` 明确禁止「新手 / 高手 / 入门 / 进阶 / 专家」水平标签，这与课程天然需要的难度分级直接冲突。补 `docs/course-guide.md` 时要明确两套规范各自适用范围，而不是把文章规范套到课程上。

### 6.5 招牌候选

| 候选 | 依据 | 短板 |
|---|---|---|
| `projects/ai-agent/`（短期） | 23 篇 36,092 行，唯一有总纲与毕业设计 `16-capstone.md`，22/23 有 est_time 与练习，1494 行代码围栏、133 张 SVG 配图，首页第一入口 `/projects/ai` 指向它 | 原创度低，总纲自述引用《深入理解 AI Agent》书稿框架与配图，与 `courses/` 合并稿重复 |
| `projects/autosar-functional-safety/`（长期） | 12 篇 5,989 行，原创度最高，含 `7.3 TC38x 移植的黑客之处`、`ERIKA v3 的 OS Application 全面缺失分析`，已有 `12-course-summary.mdx`，中文系统教程稀缺，契合 OS + 自动驾驶双主线 | 零图、零 Mermaid、无总纲，前 7 篇与 `courses/autosar-os/` 重复 |

不建议用 `rust-os/`（89 篇）当门面。体量最大但质量最参差，ch11~ch13 是 rCore 搬运，文件名 `chNN-MM` 与 `order` 两套编号，md/mdx 混用，4 个空 description，13 个章级 index 被当普通章节混排。

---

## 七、把特色立起来

站点不缺内容，缺一个只有这个站成立的组织方式。建议把 slogan「从硅片到系统」从一句 quote 变成信息架构。

**分层系统栈导航**。首页做一张可交互的纵向分层图，Silicon / ARM-RISC-V、BSP 与启动驱动、OS 内核与内存调度、虚拟化 QEMU、边缘 AI 运行时与 NPU、自动驾驶系统栈。每层节点数量由 `getKnowledgeCategories()` 与 `getProjectCategories()` 实时驱动，点击映射到现有分类与课程。一处改动同时解决「导航不覆盖全量内容」与「没有视觉符号」两个问题，替换掉 `page.tsx:304-337` 的 4 张硬编码卡。

**全站学习进度仪表盘**。`course/CourseProgress.tsx` 已有 localStorage 进度（key `course-progress-${projectSlug}`），`CourseCard.tsx:33-45` 已有章节序号、`est_time` 与完成勾选。把这些聚合到首页，展示「已完成 X / 187 章」「继续学习」和各课进度环，让 187 篇课程从二级页浮上来。这是通用模板站不可能有的功能。

**工程账数据卡片**。给 frontmatter 加结构化 `metrics` 字段，把带宽、时延、量化位宽、功耗这类数字渲染成对比条。素材现成，`content/AI/edge-ai-deployment-challenges.mdx` 有 50-60 GB/s 对 1555 GB/s 的带宽墙，`OS/ultra-low-latency-research-map.mdx` 的索引表已带各篇核心数字（「MSHR 争用下 WCET 最高放大 21 倍」「CAT 平均 MSI 延迟从 4.53 微秒降到 1.62 微秒」）。嵌入式与边缘 AI 博客独有的呈现方式。

**出处索引墙**。自动抽取各文末「参考资料 / 出处」区生成 `/papers` 页，按年份与主题聚合。既呼应 `AGENTS.md` 的一手材料规范，又顺带补上详情页缺失的相关推荐。

**重做启动日志彩蛋**。`consoleUtil.ts` 目前是 Wafastarz 的 ASCII 与 500 ms 轮询。换成 QEMU / 内核启动日志、`stonefon.boot()` 打印 CPU、内存、驱动初始化序列，删掉轮询。技术站的气质从这种细节出来。

定位上建议对外只讲一句话，写 AI 与系统底层交汇处的工程账。60 篇文章与 8 门课都归到这条线下，管理类 4 篇单独放一个低调入口，不进主线导航。

---

## 八、优先级路线图

### 第一批，地基

| 动作 | 落点 | 状态 |
|---|---|---|
| 修 metadata，补 `generateMetadata`、`sitemap.ts`、`robots.ts`、`not-found.tsx`、feed、JSON-LD、`lang="zh-CN"` | `src/app/` 两类详情页 | 已完成，另补齐 11 个课程聚合页 |
| 清模板身份残留，删死组件与冗余依赖，停掉 500 ms 轮询 | `package.json`、`layout.tsx`、`constants/`、`consoleUtil.ts` | 已完成 |
| 图片批量转 WebP 并降采样，`KnowledgeMdx` 统一改用 `MdxImage`，删无引用图 | `public/images/`、新增 `scripts/optimize-images.mjs` | 已完成 |
| 清理 41 个内容文件的 UTF-8 BOM，消除解析噪音 | `content/AI/open-harmony-sdd-practice-guide.mdx`、`projects/ai-agent/` 等 | 已完成 |
| 完成按钮去掉硬编码白名单，改为除 index 页外全部课程自动显示 | `projects/[project]/[slug]/page.tsx` | 已完成，rdma 已纳入 |
| 校正 README 与实现不符的分类、预览图、技术栈描述 | `README.md` | 已完成 |

### 第二批，门面与路径

| 动作 | 落点 |
|---|---|
| 统一导航组件，含移动端菜单，覆盖 knowledge / projects / courses 全量入口，href 走 basePath | 新增组件 + 三个 layout |
| 知识空间首页加「从这里开始」索引页并置顶，标签墙默认只渲染 count ≥2 的 55 个 | `knowledge/page.tsx`、`KnowledgeTagFilter.tsx:88` |
| 为另外 3 条系列各补 1 篇索引，复用 `ultra-low-latency-research-map.mdx` 的表格格式 | 新建 3 篇 mdx |
| 补 7 份课程总纲，归一 `est_time`，补 4 个空 description | `projects/*/00-index.md` |
| 课程元数据抽到 `course.json`，新增课程从改 3~4 处降到 0~1 处 | `src/app/projects/*/page.tsx`、`projects.ts` |
| 打通 content ↔ projects 双向链接，优先 AUTOSAR、AI Agent、AI Infra 三组 | 3 篇文章 + 对应课程 index |

### 第三批，体验与特色

分层系统栈导航、学习进度仪表盘、工程账数据卡、出处索引墙、详情页上/下篇与相关推荐、静态搜索索引、代码复制与图片 lightbox、Mermaid 暗色适配、focus 状态与暗色手动切换、早期文章清硬禁令、`docs/course-guide.md` 与 `scripts/check_course.py`。启动日志彩蛋已在第一批完成。**已于 2026-11-09 执行，实测见第十二节。**

### 验收指标

| 指标 | 基线 | 第一批后 | 第二批后 | 第三批后 | 目标 |
|---|---|---|---|---|---|
| 独立 title 的内容页 | 1 / 264 | 263 / 264 | 271 / 271 | **278 / 278，重复 0** | 全部独立 |
| 详情页 JSON-LD | 0 / 247 | 247 / 247 | 254 / 254 | **257 页** | 齐全 |
| 详情页 canonical | 0 / 247 | 247 / 247 | 271 / 271 | **278 / 281 HTML**（内容页齐全） | 齐全 |
| sitemap / robots / RSS / 404 | 全部缺失 | 265 URL / 40 条 | 273 URL / 40 条 | **279 URL / 40 条 / 齐全** | 全部存在 |
| `public/` 体积 | 220 MB | 46 MB | 46 MB | **42.8 MB** | 60 MB 以内 |
| `out/` 体积 | 303 MB | 129 MB | 134 MB | **132.9 MB** | 160 MB 以内 |
| 站内静态资源失效引用 | 0 | 0 | 0 | **0 / 842** | 0 |
| 站内页面链接失效 | — | — | 0 / 472 | **0 / 493** | 0 |
| 模板身份残留 | 多处 | 0 | 0 | 0 | 0 |
| 全站统一导航覆盖 | 0 | 0 | 275 / 275 页 | **281 / 281 页** | 全覆盖 |
| 首页可达的课程数 | 4 / 8 | 4 / 8 | 8 / 8 | 8 / 8 | 8 / 8 |
| 知识空间首屏标签按钮 | 278 | 278 | 55 + 展开全部 | 55 + 展开全部 | 55 以内 |
| 有总纲的课程 | 1 / 8 | 1 / 8 | 8 / 8 | 8 / 8 | 8 / 8 |
| 带 `est_time` 的章节 | 153 / 187 | 153 / 187 | 194 / 194 | 194 / 194 | 齐全 |
| 文章到课程的互链 | 0 | 0 | 47 组关联 + 11 处正文链接 | 47 组关联 + 11 处正文链接 | 至少 12 组 |
| 新增课程需改动的位置 | 3~4 处 | 3~4 处 | 1 处（`courses.ts`） | 1 处（`courses.ts`） | 0~1 处 |
| 过 `check_prose.py` 硬禁令的文章 | 约 26 / 59 | 未改动正文 | 未改动正文 | **63 / 63** | 全部清零 |
| 独立系列索引文章 | 1 | 1 | 1 | **4 / 4** | 4 |
| 课程校验器错误 / 警告 | 无校验器 | 无校验器 | 无校验器 | **0 / 0** | 0 |

内容页从 264 增至 271（第二批 7 份总纲），再增至 278（第三批 3 篇系列索引 + `/search`、`/papers`、`/progress` 三个页面，另加首页与若干聚合页的统计口径变化）。原「差的 1 组」重复标题（rust-os `ch11-00-index` 与 `ch11-02-address-space` 都叫「地址空间」）已在第二批改名解决，同时把 `ai-agent/00-index.md` 的「课程总览」改为「课程总纲：AI Agent 互动教程」，消除与 `/projects` 的重名。

---

## 九、核对方式

文中数据来自四类核对。目录与行数统计用 `find` / `wc`，SEO 结论直接读 `out/` 下产物页的 `<title>` 与 `<meta name="description">`，frontmatter 与内链用全文检索逐项统计，写作规范对照 `docs/writing-guide.md:84-119` 与 `AGENTS.md`。抽样精读覆盖 12 篇知识文章与 7 个课程章节，跨越全部分类。

审计阶段未运行 `check_prose.py`，也未执行构建。第一批落地后的构建验证见第十节。

---

## 十、第一批执行结果（2026-11-08）

### 构建验证

`tsc --noEmit` 退出码 0。静态构建成功，生成 272 个页面，包含 60 篇知识文章、187 篇课程章节、4 个分类页、11 个课程聚合页、4 个 SEO 路由与首页。

| 项 | 基线 | 第一批后 | 变化 |
|---|---|---|---|
| `out/` 体积 | 303 MB | 129 MB | 减少 57.4% |
| `out/` 文件数 | 1600 | 1593 | 图片格式替换后基本持平 |
| `public/` 体积 | 220 MB | 46 MB | 减少 79.1% |
| 图片原始字节 | 204.5 MB | 34.1 MB | 减少 83.3% |

First Load JS 共享 103 kB，首页 114 kB。

### SEO 落地

`layout.tsx` 的 metadata 换成站点自己的标题、描述、关键词、作者与中文 locale，`<html lang="zh-CN">`，并接上 RSS 自动发现。两类详情页各有 `generateMetadata`，输出独立标题、描述、canonical、OpenGraph、Twitter 与 JSON-LD。11 个课程聚合页用 `scripts/add-course-metadata.mjs` 从各自 h1 提取标题补齐。

产物实测，264 个内容页有 263 个独立标题，247 个详情页全部带 `BlogPosting` 或 `TechArticle` 结构化数据，253 页带 canonical，267 个 HTML 页声明 `lang="zh-CN"`。`out/sitemap.xml` 收录 265 个 URL，`out/feed.xml` 有 40 条，`out/robots.txt` 105 B，`out/404.html` 13 KB。抽查 `agent-best-practices`、`xpu-preemptive-scheduling`、`03-rdma-basics` 三页，标题、描述与 canonical 均已按文章生成，不再共用模板文案。

### 图片迁移

`scripts/optimize-images.mjs` 用 sharp 把 751 张 PNG / JPG 中的 749 张转成 WebP，宽度上限 1600 px，quality 82，同步替换 117 个文本文件里的 929 处站内引用。`KnowledgeMdx` 改用现成的 `MdxImage`，知识文章的图片现在带尺寸与模糊占位。

首次运行有两个问题，都已修好。一是正则误改了 `courses/hello-agents-all-chapters-merged.md` 里 206 处外部 URL 的路径片段，已从 git 原始版本恢复该文件的这些行，并给正则加负向后顾排除 URL 内的 `/images/`。二是两张 RDMA 素材本身损坏，其中一张是 ICO 伪装成 PNG 且无引用，已删除；另一张 `libspng` 读错误但被引用，保留原图与 `.png` 引用。

修复后幂等重跑退出码 0，站内 webp 引用 770 处、去重 721 个、失效 0，残留旧扩展名 0，外部 URL 的 204 处 `.png` 保持原样。`out/` 下 775 个 webp、1 个 png（即那张已知损坏素材），HTML 内 1405 处 webp 引用。

### 身份与死代码

删除 11 个无引用的模板组件、`navItems.ts`、`variants.ts`、`constants/projects.ts`，以及 5 张无引用图片（`person2.jpg`、`work-1~4.jpg`）。`contact.ts` 只保留邮箱，`socials.ts` 只保留 GitHub，`humans.txt` 与 `package.json` 元信息改为 StoneFon。`consoleUtil.ts` 重写成内核启动日志彩蛋，去掉 Wafastarz ASCII、`console.clear()` 与每 500 ms 的 devtools 轮询。全库扫描 `wafastarz` / `lavanya` / `mkhoirulwafa` / `masapaaaa` / `bentofolio` 命中 0。

移除 `framer-motion`、`motion`、`@vercel/analytics` 三个零引用依赖，用 pnpm 9.15.9 同步 `pnpm-lock.yaml`，diff 为 4 行新增、132 行删除，与 CI 的 `pnpm install --frozen-lockfile` 兼容。

### 内容层

清理 41 个内容文件的 UTF-8 BOM，复核 `gray-matter` 解析正常，剩余 0。课程完成按钮去掉硬编码白名单，改为除 `00-index` 页外全部课程自动显示，rdma 的 25 章已纳入。README 的分类表、目录树、技术栈、预览图说明与项目结构按实现校正，并补上两个新脚本的用法。

### 勘误

审计阶段的「`open-harmony-sdd-practice-guide.mdx` 完全无 frontmatter」结论被实测证伪。该文件 frontmatter 完整，含 title、date、description 与 7 个 tags，只是文件带 UTF-8 BOM，而 `gray-matter` 会自行处理 BOM，列表页不会显示英文 slug。相关表述已在 5.3、5.4 与第八章更正，该项动作替换为 41 个文件的 BOM 清理。

审计里写的 `scripts/optimize_images.py` 实际实现为 `scripts/optimize-images.mjs`，用 Node 与项目已有的 sharp，不新增 Python 依赖。

### 遗留与第二批

第一批结束时遗留：一张损坏的 RDMA PNG 保留原图与 `.png` 引用（浏览器能否渲染未验证）；`projects/rust-os` 的 `ch11-00-index` 与 `ch11-02-address-space` frontmatter 同名；4 个课程章节无 description；`public/` 根目录 3 张 jpg（头像与二维码）约 560 KB 未转 WebP。首页课程入口、标签墙、课程总纲、`est_time`、文章与课程互链、写作硬禁令清理都留给第二批。

其中重名、空 description、首页课程入口、标签墙、总纲、`est_time`、互链已在第二批解决，见第十一节。仍未处理的只剩写作硬禁令清理、损坏 PNG 与 3 张根目录 jpg。

### 本地构建环境说明

本机通过 `NODE_OPTIONS` 注入了文件系统代理 shim，Next 对 `.next/trace` 的追加写会被它拒绝并返回 EPERM。构建命令前清空 `NODE_OPTIONS` 即可，只影响该条命令，GitHub Actions 无此注入，CI 不需要处理。另外 `sitemap.ts` 与 `robots.ts` 在 `output: export` 下必须显式 `export const dynamic = "force-static"`，这一条是代码要求，已落地。

第二批补充：该 shim 会间歇性锁住 `.next/trace`，`NODE_OPTIONS=` 赋空值有时不生效，稳定做法是 `env -u NODE_OPTIONS` 彻底移除该变量后再调用 `next build`。

---

## 十一、第二批执行结果（2026-11-08）

### 构建与验证

最终静态构建通过，`tsc --noEmit` 退出码 0。产物 **280 个静态页面 / 275 个 HTML / 1603 个文件 / `out/` 134 MB**（第一批为 272 页 / 129 MB，基线 303 MB）。`/start`、8 门课程聚合页与 3 个静态 hub 页共存，动态路由 `projects/[project]/page.tsx` 与静态目录未发生冲突。

产物级实测：271 个内容页全部有独立 title（271/271），254 个详情页带 JSON-LD，271 页带 canonical，275 页声明 `lang="zh-CN"`，sitemap 273 个 URL，RSS 40 条，472 个去重站内链接零失效，`public/` 46 MB，模板身份残留 0。

**一次真实代码故障**：给文章追加内容层互链时用了 HTML 注释 `<!-- course-crosslink -->`，而 `.mdx` 由 MDXRemote 按 `format: "mdx"` 编译，报 `Unexpected character ! before name`。文章改用 MDX 表达式注释 `{/* ... */}`，课程总纲改为把生成标记写进 frontmatter 的 `generated` 字段（`.md` 走 `format: "md"`，同样避免正文注释）。全库扫描后仅剩代码块内部的 HTML 注释，不影响编译。

### 六项改动

| 动作 | 落点 | 实测效果 |
|---|---|---|
| 统一导航 | 新增 `src/components/SiteNav.tsx`，挂到 `layout.tsx`；首页内联 fixed nav 删除并改为页内锚点条；`knowledge/layout.tsx` 与 `projects/layout.tsx` 的 sticky 偏移由 `top-[32px]` 改为 `top-[88px]`，「返回主页」改为「阅读路线图」 | 275/275 个 HTML 页含导航；桌面端课程下拉可直达 8 门课，移动端菜单列出全部课程 |
| 起始索引页 | 新增 `src/app/start/page.tsx` 与 `src/lib/constants/learningMap.ts`；首页 hero 主 CTA、知识空间置顶 banner、404 页、两个侧栏均指向 `/start` | `/start` 含 5 层系统栈、4 条招牌系列、8 门课程、20 篇文章链接；sitemap 收录 |
| 标签收口 | 新增 `src/components/knowledge/TagCloud.tsx`，`KnowledgeTagFilter.tsx` 与 `KnowledgeSidebar.tsx` 共用 | 默认只渲染 `count >= 2` 的 55 个标签，223 个孤立标签收进「展开全部」；当前激活的长尾标签强制显示 |
| 课程元数据外置 | 新增 `src/lib/constants/courses.ts`（8 门课 + 3 个 hub 的标题、描述、难度、前置、成果物、配套文章）；删除 8 个硬编码 `page.tsx`，改由 `src/app/projects/[project]/page.tsx` + `CourseOutlinePage.tsx` 渲染；3 个 hub 页与 `projects/page.tsx` 改为薄壳 + `CourseHubPage.tsx`；`sitemap.ts` 改为从常量派生 | 新增课程只需在 `courses.ts` 加一条（3~4 处 → 1 处）；8 门课独立 title 全部正确，sitemap 收录 11 个课程聚合 URL |
| 7 份课程总纲 | 新增 `scripts/generate-course-indexes.mjs`，从 `courses.ts` 与真实章节 frontmatter 生成；`scripts/normalize-course-metadata.mjs` 归一章节元数据 | 8/8 门课有总纲，164 个章节链接零失效；补 34 个 `est_time`、填 4 个空 description、归一 89 处写法，194/194 章节元数据齐全；两个脚本幂等重跑均 0 改动 |
| 文章与课程互链 | `courses.ts` 的 `relatedArticles`（47 个 article key）为单一来源，反查派生；新增 `src/components/RelatedContent.tsx`；`scripts/add-article-course-links.mjs` 给 8 篇同题文章正文追加 11 处课程链接 | 文章页显示配套课程 + 同系列文章，课程章节页显示 4 条配套文章；产物抽查 4 篇文章与 3 个章节页均可见链接 |

标签墙有一处实现细节值得记录：`/knowledge` 因客户端组件用了 `useSearchParams`，在 `output: export` 下触发 Suspense 的 CSR bailout，标签按钮不在初始 HTML 里，而是由客户端渲染。收口逻辑已打进客户端 bundle（2 个 chunk 含「展开全部」与说明文案），首屏渲染的按钮数从 278 降到 55；如需让搜索引擎直接看到标签，第三批可把 `primary` 计算移到服务端。

### 新增脚本

| 脚本 | 用途 |
|---|---|
| `scripts/validate-content-links.mjs` | 校验 `courses.ts` / `learningMap.ts` 里的 47 个文章 key 与 8 个课程 slug 是否真实存在 |
| `scripts/normalize-course-metadata.mjs` | 补 `est_time`、填空 description、统一「N 分钟」写法，幂等 |
| `scripts/generate-course-indexes.mjs` | 生成 7 份课程总纲（定位文案在脚本 `INTRO` 中），幂等 |
| `scripts/add-article-course-links.mjs` | 给 8 篇同题文章追加「配套课程」段落，幂等 |

`README.md` 已同步新的项目结构、「新增一门课程」流程与脚本清单。

### 遗留与第三批

- 3 条招牌系列目前以 `/start` 的数据驱动列表呈现，未建立各自的 MDX 索引文章（原路线图第 3 项）。
- 早期 33 篇清 `check_prose.py` 硬禁令未动，仍是两代文风断层。
- 分层系统栈目前是静态卡片，未做成可交互导航；学习进度仪表盘、工程账数据卡、论文索引墙、静态搜索、代码复制、图片 lightbox 等第三批特性均未做。
- `courses/` 下 16 篇 md 与 `projects/` 的重复内容（AUTOSAR 7 篇、ChCore 6 篇）尚未清理，133 张重复图片副本仍在。
- 一张损坏的 RDMA PNG 保留原图与 `.png` 引用（产物 HTML 里尚有 2 处 `/images/*.png`），`public/` 根目录 3 张 jpg 约 560 KB 未转 WebP。
- `docs/course-guide.md` 与 `scripts/check_course.py` 未建立；`writing-guide.md` 禁止水平分层标签，与课程难度分级仍需划清适用范围。

---

## 十二、第三批执行结果（2026-11-09）

### 构建与验收

最终静态构建通过，**286 个路由 / 281 个 HTML / 1620 个文件 / `out/` 132.9 MB / `public/` 42.8 MB**；`tsc --noEmit` 退出码 0。新增 `scripts/verify-build.mjs` 直接读 `out/` 做产物级验收，结果为 **站内链接 493 条零失效、静态资源引用 842 条零失效、278 个独立内容 title 零重复、canonical 278 / 281、JSON-LD 257 页、sitemap 279 URL、RSS 40 条**；`/search`、`/papers`、`/progress`、`/start` 四个页面的关键内容均出现在初始 HTML，代码复制、灯箱、阅读进度条与主题事件都在客户端 bundle 中。

产物抽查还确认：全站 281 页都有导航、搜索入口与主题首帧脚本；`/start` 含 `stack-tab-edge-ai` 与 `role="tablist"`；首页含「工程账」「我的学习进度」与系统栈；文章页同时含工程账数据卡与顺序导航。

### 差异化功能

| 动作 | 落点 | 实测效果 |
| --- | --- | --- |
| 可交互分层系统栈 | `src/components/SystemStack.tsx` + `src/lib/learningMapData.ts`；`/start` 用 full、首页用 compact | 层数、文章、课程与章节数全部由内容目录实时派生，默认展开第 4 层「异构计算与边缘 AI」；role=tablist 支持方向键与 Home/End |
| 学习进度仪表盘 | `/progress` + `src/components/course/ProgressDashboard.tsx`，首页 `ProgressSummary.tsx`，`src/lib/courseProgress.ts` 统一 localStorage 读写 | 8 门课、186 个可勾选章节汇总为总进度环与各课进度条，给出「继续下一章」；`MarkCompleteButton` 写回时派发 `course-progress-change`，跨页返回自动同步 |
| 工程账数据卡 | `src/lib/constants/metrics.ts` + `EngineeringMetrics.tsx`，首页 `FEATURED_METRICS` | 10 篇文章登记了正文里可核验的数字，渲染对比条与实验条件；首页 4 张精选卡回链原文 |
| 出处索引墙 | `scripts/build-indexes.mjs` 生成 `src/lib/generated/papers.ts`，`/papers` + `PapersBrowser.tsx` | 自动抽取 **432 条出处 / 31 篇文章**，论文与预印本 269、其他资料 104、开源工程 41、官方文档 18；支持关键词与主题筛选，索引不手写第二份书目 |
| 静态站内搜索 | `public/search-index.json`（257 条：63 篇文章 + 194 章节）、`src/lib/search.ts`、`/search`、`SearchLauncher.tsx` | 标题 / 标签 / 摘要 / 正文分级打分；任意页面 `⌘K` / `Ctrl K` 唤起命令面板，索引按需 fetch 不入首屏 bundle |

### 阅读体验

| 动作 | 落点 | 实测效果 |
| --- | --- | --- |
| 零侵入阅读增强 | `src/components/reading/ArticleEnhancements.tsx` 挂到两类详情页 | 直接操作已渲染 DOM：代码复制按钮、图片灯箱、阅读进度条；MDX 编译链与 rehype-pretty-code 输出完全不动 |
| 暗色手动切换 | `globals.css` 的 `@custom-variant dark`、`layout.tsx` 首帧内联脚本、`ThemeToggle.tsx` 三态 | 跟随系统 / 浅色 / 深色循环，Mermaid 监听 `stonefon-theme-change` 用 `dark` 或 `neutral` 主题重渲染；`globals.css` 统一 focus-visible 环与「跳到正文」链接 |
| 文章顺序导航 | `ArticlePrevNext.tsx` | 属于招牌系列时按系列顺序，否则按全库日期；页脚显示「第 X / Y 篇」与系列索引入口 |
| 招牌系列索引 | 新建 `content/AI/ai-coding-engineering-series.mdx`、`content/OS/ai-os-convergence-series.mdx`、`content/自动驾驶 & 具身智能/autonomous-driving-foundation-model-series.mdx` | 4 / 4 条系列都有独立索引；`learningMap.ts` 新增 `indexKey`，`/start` 卡片与详情页页脚都指向索引，23 条索引表链接零失效 |

### 内容层与规范

- **硬禁令清零**：`scripts/clean-legacy-prose.py`（幂等、默认 dry-run）清理 38 篇早期成稿的破折号、提示性冒号、翻案腔、硬停词、黑话、结构预告与结尾升华，196 条 failures 降到 38 条；随后按 `writing-guide.md`「网址、代码、字段除外」修正 `check_prose.py` 的 `mask_non_prose()`，补上多行 Mermaid 组件、任意 URI scheme、斜杠命令、时刻与表格字段区的屏蔽，仍保留表格内提示性冒号的拦截。最终 **63 / 63 篇文章零硬禁令**。
- **课程规范**：新建 `docs/course-guide.md`（明确与 `writing-guide.md` 的适用边界，课程难度分级不受「禁止水平分层标签」约束）与 `scripts/check_course.py`。修掉 6 个 chcore 学时范围值（按区间中值折算为「NN 分钟」）、补齐 `ai-agent/00-index.md` 漏掉的 2 章，最终 **0 错误 / 0 警告 / 186 条总纲链接零失效**。
- **死链与冗余资源**：把 13 处 `/RustCourse/chapters/...` 原书相对死链改指本站 `projects/rust-learning/` 对应章节；删除 `projects/ai-agent/images/` 133 个逐字重复或已有 WebP 的副本；根目录 3 张 jpg 转 WebP（378+40+130 KB → 31+7+68 KB）并改引用；确认损坏的 RDMA PNG 无法被 libspng 解码，改用文字说明并删除原图；重写 `courses/README.md`，25 个 RDMA 链接改指迁移后的真实文件。

### 新增脚本

| 脚本 | 用途 |
| --- | --- |
| `scripts/build-indexes.mjs` | 幂等生成 `public/search-index.json` 与 `src/lib/generated/papers.ts`，已串联进 `build` / `build:pages` |
| `scripts/verify-build.mjs` | 产物级验收：title、canonical、JSON-LD、链接、资源、SEO 文件与体积 |
| `scripts/optimize-root-images.mjs` | 根目录图片转 WebP、改引用、确认无引用后删原图 |
| `scripts/check_course.py` | 课程字段、学时、order、总纲链接与课程登记一致性校验 |
| `scripts/clean-legacy-prose.py` | 早期文章硬禁令批量清理，默认 dry-run，`--apply` 落盘 |

### 实现决定与坑

1. **单一数据源继续扩展**：系统栈、进度仪表盘、搜索索引、出处索引全部从 `content/` 与 `projects/` 派生，不维护第二份清单；工程账数字是唯一一份人工登记的数据，且只登记正文已有的数字。
2. **搜索索引用 `public/` 下的 JSON + 按需 fetch**，不 import 进客户端 bundle；`next.config.ts` 通过 `env.NEXT_PUBLIC_BASE_PATH` 暴露 basePath，避免 GitHub Pages 子路径部署时拼错 URL。
3. **主题改为 class 驱动**：Tailwind v4 用 `@custom-variant dark (&:where(.dark, .dark *))`，`globals.css` 的暗色变量从 `prefers-color-scheme` 媒体查询改为 `:root.dark`；首帧脚本同步执行，避免闪白。
4. **`/search` 与 `/papers` 不用 `useSearchParams`**，改在 `useEffect` 里读 `window.location.search`，避免静态导出下的 Suspense CSR bailout，让初始 HTML 保留完整页面内容。
5. **构建环境**：本机 `NODE_OPTIONS` 注入的 shim 会锁 `.next/trace`。稳定命令仍是 `env -u NODE_OPTIONS GITHUB_PAGES=true GITHUB_REPOSITORY=fonstone/fonstone.github.io ./node_modules/.bin/next build`；若仍报 EPERM，先 `rm -f .next/trace` 再重试即可，CI 无此注入。
6. **检查器误报**：`check_prose.py` 原先只屏蔽单行代码与 http URL，把 Mermaid 图里的 `style X fill:#fff`、`CPU0->>Lock: atomic_xchg()`、表格字段 `model: string` 全判成提示性冒号。这次按规范原意补齐除外项，而不是放宽到所有冒号。

### 遗留与后续

- `content/` 里仍有 32 篇早期文章的 frontmatter 标题带「主题：子项」式结构，检查器不覆盖 frontmatter；这批标题需要逐篇人工改写，本批未动，避免破坏内容身份。
- `/knowledge` 的标签按钮仍因 `useSearchParams` 在初始 HTML 缺席（客户端渲染），如需 SEO 可把 `primary` 计算移到服务端。
- `courses/` 保留原始素材（含 1.35 MB 的 Hello Agents 合并稿与重复章节），只清理了图片副本与 README 死链；若要进一步瘦身，可把合并稿移出主仓库。
- 课程章节仍缺统一的练习模板、可复现环境版本锁定与 CHANGELOG；`docs/course-guide.md` 已给出模板，需要逐课补内容。
- `docs/preview/` 仍是早期模板截图，README 里已标注，尚未重新截图。



## 十三、命名与模块调整（2026-11-11）

前面章节是各批次执行当时的原始记录，其中的「从硅片到系统」「工程账」只作历史记录保留，不代表当前站点状态。本节记录按访客反馈做的两处调整。

### 主标题换成「从内核到智能系统」

原「从硅片到系统」与站点实际内容不贴合：站内没有芯片设计内容，写的是系统软件、内核、AI 负载与整车系统栈。全站统一改成「从内核到智能系统」，不出现硅片 / Silicon 这类表述。

替换位置：`src/lib/constants/site.ts`（`SITE_TITLE` 与站点描述）、`siteContent.ts`（quote 与英文 `From Kernel to Intelligence`）、`SiteNav.tsx` 副标题、首页 `#system-stack` 板块标题、`/start` 的大标题与 metadata、`learningMap.ts` 顶层注释与首层名称（「硅片与板级」→「系统启动与 BSP」，subtitle 改 `Boot / BSP`）、`SystemStack.tsx` 注释、`consoleUtil.ts` 启动日志、`scripts/verify-build.mjs` 的默认 title 判定。文章内容与课程正文里的 Apple Silicon、HiSilicon、芯片硅片等技术名词属于技术表述，保持原样。

### 「工程账」换成「项目实战」

访客反馈数字卡看不出用途。首页 `#engineering-metrics` 板块与文章页顶部的 `EngineeringMetrics` 数字卡整体下线，改为成果物导向的实战入口：

- 新增 `src/components/HandsOnProjects.tsx`：4 张卡分别取自 AI Agent / QEMU / Rust RTOS / RDMA 四门课，主标题是 `COURSES.outcomes` 里的成果物，附难度、章节数与课程入口。
- 新增 `src/components/HandsOnCallout.tsx`：文章页顶部一条「配套实战」，由 `getRelatedCourses(articleKey)` 反查，无配套课程则不渲染。
- `courses.ts` 新增 `FEATURED_HANDS_ON`（只登记 slug 与成果物序号）；删除 `src/lib/constants/metrics.ts` 与 `src/components/EngineeringMetrics.tsx`。
- `scripts/generate-course-indexes.mjs` 的「工程账长文」改为「技术长文」，同步更新 7 份课程总纲；`RelatedContent.tsx` 的「先看工程账」改为「回到原理」。
- 文章《嵌入式 AI 部署的工程账：内存带宽、硬件亲和与低比特精度》是正式标题，正文与出处索引中的该字样保留。

### 验证

`tsc --noEmit` 退出码 0；静态导出 281 个 HTML / 1620 个文件，`out/` 133.0 MB；`node scripts/verify-build.mjs` 通过（独立 title 278 个、重复 0，站内链接 493 条与静态资源 842 条失效均为 0，sitemap 279 URL，RSS 40 条）。产物扫描：旧主标题「从硅片到系统」0 处、旧板块 `id="engineering-metrics"` 0 处、`<h2>工程账</h2>` 0 处；新主标题覆盖全站、首页 `项目实战` 4 张卡、`配套实战` 横条覆盖 27 篇文章页。预览服务逐页 HTTP 200。


## 十四、清理首页冗余入口与旧自媒体署名（2026-11-11）

### 删除首页「换一种找法」

该栏位于 `#system-stack` 右列、进度摘要卡下方，三个链接（出处索引墙、站内搜索、完整阅读路线图）在顶部导航、`⌘K` 与 hero 入口里都有，属于重复导航。整块卡片从 `src/app/page.tsx` 删除，保留 `ProgressSummary` 与左右两列布局；`/papers`、`/search`、`/start` 三个页面与路由本身都保留。

### 清理「博主雪云飞星」

`projects/` 下两门 Rust 课程沿用了旧的自媒体开场与推广段，与站点现在的 StoneFon 身份不一致。清理范围：

- `projects/rust-os/ch01-00-index.mdx`、`projects/rust-learning/01-rust-intro.md`：删掉「大家好，我是博主雪云飞星。」开场，保留紧随其后的行业背景与技术叙述；删掉两处「# 加博主微信（和大家交个朋友）」整段（含微信号 `xyfx18909025121` 与加好友备注要求）。
- `projects/rust-learning/01-rust-intro.md`：删掉文末署名「—— 雪云飞星（付皓文）」。
- `projects/rust-learning/02-basic-syntax.md`：代码注释「但博主试了网页好像看不到」改为「网页环境里不一定能看到」。
- `public/search-index.json` 与 `src/lib/generated/papers.ts` 由 `scripts/build-indexes.mjs` 重新生成，`out/` 全量重建，生成物一律不手改。

保留边界：`https://xyfx-fhw.github.io/RustCourse/`、`https://github.com/xyfx-fhw/RustRTOS/...` 等外部教程与参考代码仓库链接属于技术资源引用，不是署名宣传，未改动；首页 `WeChatCard` / `OfficialAccountCard` 的两张二维码图片经查看不含该名字（微信二维码显示 `XKL-Rocky`），保留。首页其余板块与正式文章标题不受影响。

### 验证

`tsc --noEmit` 退出码 0；`check_course.py` 0 错误、186 条总纲链接零断链；`validate-content-links.mjs` 全部引用有效。静态导出 286 路由 / 281 个 HTML / 1620 个文件，`out/` 132.9 MB；`verify-build.mjs` 通过（独立 title 278 个、重复 0，canonical 278/281、JSON-LD 257 页，站内链接 493 条与静态资源 842 条失效均为 0，sitemap 279 URL、RSS 40 条）。关键词扫描：源码与内容 370 个文件、生成索引 2 个文件、静态产物 656 个文件，对「雪云飞星 / 付皓文 / xyfx18909025121 / 加博主微信 / 博主 / 换一种找法」全部零残留；首页 `换一种找法` 0 处，进度摘要卡、系统栈、项目实战板块都还在。预览服务 9 个页面 HTTP 200、应有内容全命中、旧关键词零残留。


## 十五、首页顶部一体化与 Portfolio 清理（2026-11-11）

### 问题定位

访客截图反馈顶部导航卡片与下方「本页快速跳转」胶囊栏像两块割裂的区域，中间有一条硬边界。两个原因：

- `src/app/page.tsx` 外层容器是 `bg-slate-50 / dark:bg-slate-950`（暗色 `#020617`），而 `SiteNav` 挂在根 layout 的 body 上，body 是 `globals.css` 里的网格渐变背景（暗色 `#0b1220`）。首页这个不透明容器从导航下方开始，色差形成贯穿全宽的硬边，网格纹理也在此截断。其它页面（knowledge / projects layout）用 `bg-transparent`，没有这个问题。
- 「本页快速跳转」是首页 main 里独立居中的一行，与 sticky 导航卡片之间隔着 header 的 `mb-6` 和自身的 `mb-8`，两块各自为政。

### 改动

- 首页容器改 `bg-transparent`，body 的网格与渐变贯穿全站，硬边消失，导航与内容落在同一张画布上。
- 6 个页内锚点从 `page.tsx` 移入 `src/components/SiteNav.tsx`，作为仅首页（`pathname === "/"`）显示的卡片内第二行：柔和顶部分隔线 + 略深底色过渡、`rounded-b-2xl` 贴合卡片底部圆角、`sf-scrollbar-none` 横向滚动不露滚动条，移动端也不换行。首页 main 里原胶囊栏删除；`globals.css` 给 `section[id]` 加 `scroll-margin-top: 132px`，避免加高后的吸顶导航挡住锚点。
- 删除 hero 里的 `Portfolio` 徽章与 `Sparkles` 引用，h1 去掉 `mt-8` 收紧标题上方留白；`README.md` 标题改为「StoneFon 知识空间」。本报告前十四节出现的 `StoneFon | Personal Portfolio` 是旧模板 title 的历史审计记录，保留不改。

### 验证

`tsc --noEmit` 退出码 0；静态导出 286 路由 / 281 个 HTML / 1620 个文件，`out/` 132.9 MB；`verify-build.mjs` 通过（独立 title 278 个、重复 0，站内链接 493 条与静态资源 842 条失效均为 0，sitemap 279 URL、RSS 40 条）。产物核对：首页 sticky header 内含「本页快速跳转」与 6 个锚点胶囊、`sf-scrollbar-none` 与 `rounded-b-2xl` 均在；首页容器已是 `bg-transparent`，容器到 hero 之间不再有独立胶囊栏；`/start`、`/knowledge`、`/projects`、`/search` 及文章页均不出现首页快捷栏；281 个 HTML 中 `Portfolio` 共 0 处；CSS 新规则已编译进产物。预览服务 7 个页面 HTTP 200，应有内容全命中、旧元素零残留。


## 十六、本页快速跳转居中与可收缩（2026-11-11）

### 诉求

第十五节把 6 个页内锚点收进 sticky 导航卡片第二行后，该行是左对齐且常驻的：宽屏上整组贴左，与居中的主导航气质不符；吸顶导航始终占约 109px，滚动时也无法收起。

### 改动（仅 `src/components/SiteNav.tsx`）

- 居中：外层改为 `overflow-x-auto` 的块级容器，内层用 `mx-auto flex w-max`。内容窄于卡片时整组水平居中；窄屏放不下时 auto margin 归零，自动退化为左对齐横向滚动，不会把左侧内容裁掉。
- 可收缩：标签「本页快速跳转」从静态文字改成按钮（`aria-expanded` / `aria-controls`），带旋转 `ChevronDown` 与「收起 / 展开 6 项」提示。6 个胶囊放在 `grid-cols-[1fr] → grid-cols-[0fr]` 的横向折叠容器里，配 `opacity` 与 300ms 过渡；收起时容器宽度归零，胶囊由 `overflow-hidden` 裁掉，并同步 `aria-hidden` + `tabIndex=-1` 移出键盘焦点。
- 紧凑：收起态把这一行的 `py-2.5` 降到 `py-1`、按钮改 `text-[11px] px-2.5 py-0.5`，吸顶导航从 109px 降到 97px，页面高度不跳变（`scroll-margin-top: 132px` 仍适用）。
- 状态持久化：新增 `QUICK_LINKS_STORAGE_KEY = "sf-home-quick-links-open"`，`useEffect` 读取 + 写入 `localStorage`，离开首页再回来保持用户的收起选择；SSR 默认展开，不会水合不一致，`localStorage` 不可用时 try/catch 兜底。

### 验证

`tsc --noEmit` 0；静态导出 286 路由 / 281 个 HTML / 1620 个文件、`out/` 133.0 MB；`verify-build.mjs` 通过（独立 title 278、重复 0，canonical 278/281、JSON-LD 257 页，站内链接 493 条与静态资源 842 条失效均为 0，sitemap 279 URL、RSS 40 条）。

用无头 Chrome + DevTools Protocol 做交互实测（1440px / 390px 两档）：

| 状态 | 组中心 / 视口中心 | aria-expanded | localStorage | header 高度 |
| --- | --- | --- | --- | --- |
| 初始展开 | 712 / 712 | true | `"true"` | 109px |
| 点击收起 | 712 / 712 | false | `"false"` | 97px |
| 再次展开 | 712 / 712 | true | `"true"` | 109px |

6 个胶囊在展开态全部可见；收起态胶囊区宽度归零、只剩居中的小胶囊。390px 窄屏下整组左对齐并可横向滚动，开关按钮未被裁切。预览服务 `/`、`/start/`、`/knowledge/`、`/projects/`、`/search/` 均 HTTP 200。临时测试页与脚本已清理，未留在产物里。


## 十七、文章代码段配色与行内代码可读性（2026-11-12）

### 问题定位

访客截图反馈浅色模式下代码块和 `` `字段` `` 显示不明显。实测（无头 Chrome 读取计算样式）根因有四处，全部集中在 `src/app/globals.css`：

1. `.prose pre` 的背景用 `color-mix(in oklab, var(--color-card) 70%, black)`。浅色 `--color-card` 是白色，混出来是 `#b3b3b3` 左右的中灰；而 typography 插件的 `pre` 前景仍是默认的浅灰 `--tw-prose-pre-code`，两者互相打架。
2. `rehype-pretty-code` 配的是 `github-light` / `github-dark` 双主题，HTML 里每个 token 都带 `--shiki-light` / `--shiki-dark` 变量，但 CSS 从未消费这些变量，因此**语法高亮完全没有生效**，所有 token 都继承同一个颜色。
3. 行内代码背景是 `color-mix(... 55%, black)`，浅色下是偏深的灰胶囊；同时 `prose-code:text-slate-900` 把字压成深色，还叠加 typography 自动注入的 `content:"`"` 字面反引号，字段又暗又带多余符号。
4. `@theme inline` 里 `--font-mono: var(--font-gilroy)`，代码块继承的是无衬线比例字体，等宽对齐缺失。

### 改动

- `globals.css` 新增一组代码主题变量（`:root` / `:root.dark`）：`--code-bg / --code-fg / --code-border`、`--code-inline-*`、`--code-copy-*`，分别对齐 Shiki `github-light` 的 `#f6f8fa / #24292e` 与 `github-dark` 的 `#0d1117 / #e1e4e8`。
- `.prose pre` / `.prose pre code` 改用主题变量，补边框、圆角、`tab-size` 与真正的等宽字体栈（`ui-monospace, SFMono-Regular, Menlo, Consolas…`），`@theme inline` 的 `--font-mono` 同步改为 `var(--font-code)`。
- 新增 `.prose pre code span[style*="--shiki-light"] { color: var(--shiki-light) }` 与 `:root.dark … { color: var(--shiki-dark) }`，让语法高亮随主题实时切换，无需 JS 重渲染。
- 行内代码改成浅色/深色高对比胶囊，并用 `::before / ::after { content: none }` 去掉字面反引号；`overflow-wrap: anywhere` 防止长标识符撑破版心。
- 复制按钮配色并入同一组变量，默认从 `opacity: 0` 改为 `0.8`，触屏也能看到。
- `src/app/knowledge/[category]/[slug]/page.tsx` 与 `src/app/projects/[project]/[slug]/page.tsx` 移除 `prose-code:*` / `prose-pre:border*` 这些互相打架的 utility，代码配色统一由 `globals.css` 单点维护。

### 验证

`tsc --noEmit` 0；静态导出 282 个 HTML / 1622 个文件、`out/` 133.2 MB；`verify-build.mjs` 通过（独立 title 279、重复 0，canonical 279/282、JSON-LD 258 页，站内链接 494 条与静态资源 842 条失效均为 0，sitemap 280 URL、RSS 40 条）。编译产物里旧 `color-mix(...var(--color-card))` 已归零，新变量、`--shiki-light` / `--shiki-dark` 消费规则、等宽字体栈均已写入 CSS。

无头 Chrome + DevTools Protocol 实测三类页面（知识文章、课程章节、纯文本日志代码块）× 两种主题，对比度按 sRGB 相对亮度计算：

| 模式 | 代码块文字对比度 | 行内代码对比度 | token 着色 | 字面反引号 |
| --- | --- | --- | --- | --- |
| 浅色 | 13.78:1 | 12.59:1 | github-light（`#D73A49` / `#6F42C1` / `#005CC5`…） | 无 |
| 深色 | 14.84:1 | 12.2:1 | github-dark（`#F97583` / `#B392F0` / `#79B8FF`…） | 无 |

三类页面的代码块底色、边框、等宽字体完全一致；全站 3968 个 `<pre>` 中未带语言标记的纯文本日志块也继承正确前景色。浅色/深色对比截图已核对，`store buffer`、`a = 1` 一类字段清晰可辨。临时测试脚本未留在产物里。


## 十八、Mermaid 图配色与深浅主题适配（2026-11-20）

### 问题定位

访客截图反馈深色模式下文章里的 Mermaid 图显示不明显：整张图压着一块中灰底板，节点近黑、边标签也是中灰，层次混乱。用无头 Chrome 读取 SVG 内嵌 `<style>` 与实际计算样式，根因有四层：

1. `MermaidDiagram.tsx` 用 `theme: isDark ? "dark" : "neutral"` 并只覆盖 4 个 `themeVariables`。Mermaid 只有 `base` 主题允许完全自定义变量，`dark` / `neutral` 会在 `calculate()` 里锁死自己那套色板 —— 传入的 `primaryColor` 直接被忽略。实测深色下节点仍是 `#1f2020`、cluster 是 `#474949`、边标签是 `#585858`、箭头是 `lightgrey`；浅色下节点 `#eee`、cluster `#fcfcfc`（与白底对比度仅 1.03），两套都不成体系。
2. 容器用 `dark:bg-slate-900`，与代码块的 `--code-bg` 不是同一块表面，代码块修好之后图表成了新的割裂点。
3. 改用 `base` 主题后，mindmap 暴露第二个坑：`darkMode` 为真时 Mermaid 把 `cScale` 色板再 `darken`，`.section-N rect` 被压成 `hsl(215, 51%, 0%)` 纯黑，连线也几乎隐形（全站 12 张 mindmap 受影响）。
4. 部分图类型把字体写死成 `trebuchet ms`，与站点字体不一致。

### 改动

- `src/components/knowledge/MermaidDiagram.tsx`：主题固定为 `base`，`themeVariables` 改为运行时读取 `globals.css` 的 CSS 自定义属性，配色与字体不再散落在组件里。渲染中 / 失败 / 成功三种状态统一用 `.sf-mermaid` 容器。
- `src/app/globals.css`：新增 `--mm-*` 变量组（`:root` 浅色 / `:root.dark` 深色），容器 `--mm-surface` 直接引用 `--code-bg`，图表与代码块共用同一块表面；层次靠「容器 → cluster → 节点」的蓝色亮度递进。新增 `.sf-mermaid` 规则统一容器、边标签、箭头与字体；针对 `svg.mindmapDiagram` 覆盖节点填充 / 描边、section 连线与文字，兜住 Mermaid 内嵌 `<style>` 的 id 前缀高优先级规则。
- 主题切换链路不变：`stonefon-theme-change`（手动切换与 layout 首帧脚本的系统主题监听都会派发）触发组件重绘，实测浅色 → 深色节点色即时从 `#dbeafe` 变为 `#1c3559`。

### 验证

`tsc --noEmit` 0；静态导出 283 个 HTML / 1624 个文件、`out/` 133.5 MB；`verify-build.mjs` 通过（独立 title 280、重复 0，canonical 280/283、JSON-LD 259 页，站内链接 495 条与静态资源 842 条失效均为 0，sitemap 281 URL、RSS 40 条）。产物 CSS 里 `--mm-node-bg` / `--mm-cluster-bg` / `--font-chart` / `mindmapDiagram` 覆盖规则均已编译，旧的 `color-mix(...var(--color-card))` 归零。

全站 373 个 Mermaid 图（flowchart 306 / graph 40 / mindmap 12 / sequence 10 / state 3 / class 1 / gantt 1），取 5 个代表页面共 53 张图 × 浅色深色做 CDP 实测，全部渲染成功，0 张卡在渲染中、0 张失败：

| 模式 | 容器 | cluster | 节点 | 连线 | 节点文字对比度 | cluster 标题对比度 | 连线对比度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 浅色 | `#f6f8fa` | `#eaf1f9` | `#dbeafe` | `#4b6b94` | 11.87:1 | 9.1:1 | 5.15:1 |
| 深色 | `#0d1117` | `#16243c` | `#1c3559` | `#7dd3fc` | 10.44:1 | 10.46:1 | 11.35:1 |

深色下原来的中灰底板（与容器对比 1.97）改为深蓝递进（1.22），刺眼感消失；mindmap 的 34 / 52 个纯黑元素全部变为站点蓝，连线可见。浅色 / 深色 / mindmap 对比截图已核对。临时测试脚本未留在产物里。


## 十九、Mermaid 字号层级与配色再平衡（2026-11-21）

### 诉求与问题定位

第十八节解决了「深色下图看不清」，但访客继续反馈配色不舒服，并要求关注图中整体字体大小与色彩搭配。用无头 Chrome 读 SVG 的 `viewBox`、内嵌 `<style>` 与计算样式，定位出四类残留问题：

1. **字被缩放没了**：`useMaxWidth: true` 下 SVG 宽度铺满容器。首页示例图 `viewBox` 宽 1296.6，实际渲染 854px，缩放比 0.665；SVG 内 `fontSize: 14px` 在屏幕上只剩 **9.3px**。而单纯把字号调大会让节点变宽、`viewBox` 一起变大，缩放比同步下降，屏幕字号几乎不变。
2. **缺少字号层级**：Mermaid 内嵌样式只有 `#id { font-size:14px }`、tooltip 12px、图标题 18px，节点 / 分组标题 / 边标签全部同级；另外 cluster 标题里的 `<p>` 会被 `foreignObject *` 的基础字号规则抢走。
3. **层层色块压住正文**：容器 → cluster → 节点是三层逐渐加深的蓝（浅色）或三层暗蓝（深色），大块底色让图显得又闷又重；深色连线 `#7dd3fc` 亮青过于跳；`style ... fill:#3B82F6 !important` 这类内容自定义色在深色下是霓虹糖果色。
4. **甘特图漏配**：`sectionBkgColor` 等甘特图变量没传，深色下有 3 个 `rect.section` 仍是纯白。

### 改动

- **字号**（`globals.css` 新增 `--mm-font-size / -title / -small / -heading`，组件从 CSS 读取）：节点 17px、分组标题 15px 加粗、边标签 14px、图标题 20px，mindmap 层级多单独收一档到 14px；cluster 标题的 `<p>` 也纳入规则，避免被基础规则覆盖。所有字号规则带 `!important` 压过 Mermaid 的 `#id` 内嵌样式。
- **保证最小可读字号**：`MermaidDiagram.tsx` 渲染后解析 `viewBox` 宽，超过 700px 时把 `min-width = 0.8 × viewBox宽` 写进容器的 `--mm-render-min`，CSS 给 SVG 设 `min-width`，容器本来就有 `overflow-x-auto`。这样宽图缩放比不再低于 0.8（屏幕字号 13.6px），窄图仍按原尺寸显示（17px）不受影响；代价是极宽的图可横向滚动。`flowchart.nodeSpacing/rankSpacing` 从 50 收到 30 / 34，补偿字号变大带来的节点变宽，实测 `viewBox` 宽基本没涨（1296.6 → 1307.8）。
- **配色收敛**：分组框底色改成与容器同色、只留 1.2px 细虚线边框，节点成为唯一带填充的元素；分组标题改用主题蓝。浅色是白卡片 + 淡蓝节点（`#e8f2fd`）+ 灰蓝连线（`#7f97b4`），深色是深蓝容器（`#0f1a2b`）+ 亮蓝节点（`#203a5e`）+ 柔和灰蓝连线（`#829cbe`），深色不再出现亮青箭头。节点补 `rx/ry: 7px` 圆角、连线 2px。容器 padding 从组件的 `p-4` 收到 CSS 单点维护的 `1.25rem`。
- **内容自定义色**：`style A fill:#... !important` 是 inline `!important`，CSS 改不动 `fill`，改用 `filter` 作用在形状元素上：浅色 `saturate(.88)` 轻微柔化，深色 `saturate(.6) brightness(.78)` 压低饱和与亮度，保留六个范式的色相区分但不再刺眼。文字在 `foreignObject` 里，不受滤镜影响。
- **补齐甘特图变量**：`readMermaidTheme()` 增加 `sectionBkgColor / sectionBkgColor2 / taskBkgColor / doneTaskBkgColor / activeTaskBkgColor / critBkgColor / gridColor / excludeBkgColor / todayLineColor` 等 18 项，全部由 `--mm-*` 派生。

### 验证

`tsc --noEmit` 0；静态导出 283 个 HTML / 1624 个文件、`out/` 133.5 MB；`verify-build.mjs` 通过（独立 title 280、重复 0，canonical 280/283、JSON-LD 259 页，站内链接 495 条与静态资源 842 条失效均为 0，sitemap 281 URL、RSS 40 条）。编译 CSS 里 `--mm-font-size` / `--mm-render-min` / `stroke-dasharray` / `rx:7px` / `saturate` 均已写入。

5 个代表页面共 53 张图（flowchart / graph / mindmap / sequence / state / class / gantt）× 浅色深色，全部渲染成功，0 失败、0 纯黑、深色下 0 纯白（第十八节遗留的 3 个白色甘特 section 已消除）：

| 指标 | 改前 | 改后 |
| --- | --- | --- |
| 宽图缩放比 | 0.665 | 0.80（下限） |
| 宽图屏幕字号 | 9.3px | 13.6px |
| 窄图屏幕字号 | 14px（缩放前） | 17px（不缩放） |
| 节点 / 分组 / 边标签 | 全 14px 同级 | 17 / 15 / 14px 三级 |
| 深色连线 | `#7dd3fc` 亮青 | `#829cbe` 柔和灰蓝 |
| 深色纯白块 | 3 个甘特 section | 0 |

主题切换仍由 `stonefon-theme-change` 触发重绘，实测节点填充 `#203a5e` ↔ `#e8f2fd` 即时生效。浅色 / 深色 / mindmap / 混合图截图已核对，4 个页面 HTTP 200。临时测试脚本未留在产物里。


## 二十、文章表格线条与页面横向溢出（2026-11-21）

### 问题定位

访客反馈浅色模式下文章表格的线条不明显。用无头 Chrome 读计算样式（颜色经 canvas 规范成 sRGB 后算相对亮度对比度），确认表格线条由 `@tailwindcss/typography` 的默认变量提供，页面自己的两个 utility 又叠了一层，两套主题都不成体系：

| 位置 | 来源 | 浅色 | 深色 |
| --- | --- | --- | --- |
| 行线 | `--tw-prose-td-borders`（`tbody tr`） | `#e5e7eb`，与白底 **1.18:1** | 仍是 `#e5e7eb` 亮白线，与深底 **15.12:1**，刺眼 |
| 表头线 | `prose-thead:border-b-slate-200` / `dark:…:slate-800` | `#e2e8f0`，**1.18:1** | `#1d293d`，**1.28:1**，等于没有 |
| 外框 / 竖线 | typography 无 | 完全没有 | 完全没有 |

根因是深色只由 `<html class="dark">` 驱动，prose 并未启用 `prose-invert`，因此 `--tw-prose-td-borders` 保持浅色值；浅色则是默认色本身就太淡。此外 th / td 只有 `padding-right / bottom`，左间距为 0，文字贴边。

诊断时还发现上一节引入的一处回归：宽 Mermaid 图的 `min-width: 0.8 × viewBox` 把 grid 子项撑开，`knowledge` / `projects` 两个 layout 写的 `md:grid-cols-[280px,1fr]` 是**带逗号的无效声明**（编译产物里就是 `grid-template-columns:280px,1fr`），浏览器整条丢弃后退化成单列 auto 轨道，min-content 被宽图撑到 2367px，整页 `scrollWidth` 达 2759px，表格第一列被横向裁掉。

### 改动

- `src/app/globals.css` 新增 `--table-*` 变量组（`:root` / `:root.dark`）：表格底、外框、表头底 / 字 / 底线、行线、列线、hover 底、正文色，浅色对齐白卡片、深色对齐深蓝卡片。
- 新增 `.prose table` 规则，把表格做成与代码块同语言的圆角卡片：`border-collapse: separate` + `border-spacing: 0` + 1px 外框 + 12px 圆角；线条改成四级层次「外框 > 表头 2px 底线 > 行线 > 列线」，表头带浅蓝底、行 hover 高亮、单元格 padding 改 `0.55~0.6rem 0.9rem`，四角单元格补圆角。typography 画在 `thead` / `tbody tr` 上的线显式归零（separate 模式下 tr 边框本就不渲染），改由单元格边框统一承担。
- `src/app/knowledge/[category]/[slug]/page.tsx` 与 `src/app/projects/[project]/[slug]/page.tsx`：删掉 `prose-thead:border-b-*` / `prose-th:text-*` / `prose-td:text-*` 六个 utility，表格配色与文字色全部由 `globals.css` 单点维护，不再与全局规则打架（沿用第十七节代码配色的做法）。
- 顺带修横向溢出：`knowledge/layout.tsx` 改 `md:grid-cols-[280px_minmax(0,1fr)]`、`projects/layout.tsx` 改 `md:grid-cols-[240px_minmax(0,1fr)]`（合法声明且主轨道 min 为 0），并给 `.sf-mermaid` 补 `min-width: 0; max-width: 100%`。首页 `ProgressDashboard.tsx` / `SystemStack.tsx` 里同样带逗号的旧写法**没有动**——它们本来就是单列布局，改有效会突然变两列、破坏既有设计。

### 验证

`tsc --noEmit` 0；静态导出 283 个 HTML / 1624 个文件、`out/` 133.4 MB；`verify-build.mjs` 通过（独立 title 280、重复 0，canonical 280/283、JSON-LD 259 页，站内链接 495 条与静态资源 842 条失效均为 0，sitemap 281 URL、RSS 40 条）。编译 CSS 里 `--table-*`、两个新的 `minmax(0,1fr)`、`border-collapse:separate` 均已写入，旧的 `prose-thead\:border-b-slate-200` 归零。

CDP 实测 3 个含表格页面（18 / 9 / 2 张表，覆盖知识文章与课程章节）× 浅色深色，以及 390px 窄屏 × 两主题：

| 指标 | 改前（浅 / 深） | 改后（浅 / 深） |
| --- | --- | --- |
| 行线对比度 | 1.18 / 15.12 | **1.69 / 1.96** |
| 外框对比度 | 无 / 无 | **1.94 / 2.25** |
| 表头底线对比度 | 1.18 / 1.28 | **2.44 / 3.61** |
| 列线对比度 | 无 / 无 | **1.31 / 1.51** |
| 表格文字对比度 | 9.9 / 12.6 | 10.35 / 11.51 |
| 页面 `scrollWidth` | 2759px | 1280px（390px 窄屏为 390px） |
| 表格宽度 | 2367px（第一列裁切） | 552 / 592 / 334px（完整） |

浅色 / 深色 / 课程页 / 390px 窄屏截图已核对，线条清晰且不刺眼，表格无裁切。4 个页面 HTTP 200。临时测试脚本未留在产物里。


## 二十一、桌面端正文扩展与右侧目录收缩（2026-11-22）

### 诉求

电脑端文章页正文被三块侧栏夹住：左侧分类栏 280px、右侧目录栏 224px、两侧 padding 各 40px，1280 视口下正文只有 552px，代码、表格、Mermaid 图频繁折行或横向滚动，显得拥挤。希望正文更宽，右侧目录平时收起、鼠标靠近时再展开。

### 改动

- 新增 `src/components/reading/TocRail.tsx`，知识文章与课程章节共用，替换掉原先两份不同的目录实现（`knowledge/TableOfContents.tsx` 和课程页里内联的 `<aside>`，旧组件已删除）。
- **默认收起**：`xl` 以上只保留 44px 宽的窄轨道（图标 + 竖排「目录」+ 条目数），`sticky top-[88px]` 跟随滚动；正文拿回原目录栏的 180px。`xl` 以下整个组件不渲染，小屏保持正文全宽且无多余入口。
- **靠近展开**：轨道左侧有 24px 透明感应区，`onMouseEnter` 延迟 120ms 才展开（快速掠过不误触），展开为 224px 浮层，`absolute` 定位**不挤压正文布局**，带边框 / 阴影 / 模糊背景。键盘 Tab 进入也展开（只认 `:focus-visible`，避免鼠标点击残留焦点让目录一直展开）。
- **可固定 / 可收起**：点击轨道或浮层里的图钉按钮锁定展开，Esc 或再次点击解除；收起态链接 `tabIndex=-1` 且 `aria-hidden`，`aria-expanded` / `aria-controls` 齐全。点击目录项跳转到锚点，未固定时自动收起。保留 IntersectionObserver 当前章节高亮。
- 两个 `page.tsx` 只传 `headings`，不再各自维护 aside 与目录列表；容器仍是 `max-w-7xl`——导航也是这个宽度，单独加宽内容区会让两者错位，本次不动。

### 验证

`tsc --noEmit` 0；静态导出 283 个 HTML / 1625 个文件、`out/` 132.9 MB；`verify-build.mjs` 通过（独立 title 280、重复 0，canonical 280/283、JSON-LD 259 页，站内链接 495 条与静态资源 843 条失效均为 0，sitemap 281 URL、RSS 40 条）。产物 HTML 里 `aria-controls` 正常输出，旧 `TableOfContents` 引用归零。

无头 Chrome + CDP 真实鼠标 / 键盘事件，5 组场景（1440 浅色深色、1280、1024、课程章节页 × 1440）：

| 视口 / 页面 | 正文宽度（改前 → 改后） | 轨道 | 展开时正文宽度 | 横向溢出 |
| --- | --- | --- | --- | --- |
| 1440 知识文章 | 616 → **796px** | 44px | 796px（不变） | 无 |
| 1280 知识文章 | 552 → **732px** | 44px | 732px（不变） | 无 |
| 1440 课程章节 | 656 → **836px** | 44px | 836px（不变） | 无 |
| 1024 知识文章 | 552 → 552px | 不渲染 | — | 无 |

改前宽度在同一视口下把轨道临时还原成 224px 目录栏实测得到。交互链路全部通过：快速掠过不展开 → 停驻 120ms 展开 → 点击固定后鼠标移回正文仍展开 → Esc 收起 → 点击目录项跳转且收起；浅色深色一致，页面 `scrollWidth` 始终等于视口宽度。

**取舍**：展开是临时浮层，会短暂盖住正文右侧约 224px（鼠标移开即收起）；换成抽屉式挤压虽然不遮挡，但会让正文宽度在 hover 时跳动、文字重排，与「不拥挤」的目标相悖，因此选浮层。极宽屏幕也不额外加宽 `max-w-7xl`，避免与全站导航错位。4 个页面 HTTP 200。临时测试脚本未留在产物里。
