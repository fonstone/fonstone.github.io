# human-writing 写作方法整合实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 human-writing（v1.1.0）写作方法裁剪为本项目技术知识文章的写作规范：docs/writing-guide.md + AGENTS.md + scripts/check_prose.py。

**Architecture:** 三个独立文件。检测脚本原样复制（不加来源标注）；完整写作指南放在 docs/；根目录 AGENTS.md 作为简短入口，Agent 自动加载。

**Tech Stack:** Markdown、Python 3（脚本由 `python` 命令运行，本机已装 Python 3.12.10）。

**来源材料:** human-writing 仓库已克隆在 `C:\Users\Xiang\AppData\Local\Temp\opencode\human-writing\human-writing\`（SKILL.md、references/forum-prose.md、references/reality.md、references/revision.md、scripts/check_prose.py）。

## Global Constraints

- 所有新文件正文为中文。
- 指南和 AGENTS.md 自身必须通过 check_prose.py 的硬禁令检查（冒号仅引原话可用、无破折号、无翻案句、无硬停词、无黑话、无模型路标），体现方法自洽。
- 禁令示例词一律用反引号包成行内代码，如 `` `先说结论` ``、`` `一句话总结：` ``。check_prose.py 的 mask_non_prose 会跳过行内代码，示例不会被误判。
- 正文禁止出现裸冒号与破折号。列举时用顿号、逗号或句号断开，不用"标题：内容"的提示性写法。
- 不修改现有 content/ 文章与站点代码。
- 文件头不注明 human-writing 来源与 MIT 许可（用户明确要求）。
- 说话位置按文章分类区分。AI 知识空间文章以 AI 大模型工程师身份说话。其他（嵌入式/OS/自动驾驶算法）以对应领域工程师身份说话。
- 提交信息沿用仓库 conventional commits 风格（docs/feat/chore 前缀）。

---

### Task 1: 复制检测脚本

**Files:**
- Create: `scripts/check_prose.py`（复制自 `C:\Users\Xiang\AppData\Local\Temp\opencode\human-writing\human-writing\scripts\check_prose.py`，内容完全一致，不加来源标注）

**Interfaces:**
- Produces: `scripts/check_prose.py`，命令行用法 `python scripts/check_prose.py <稿件路径>`，硬禁令命中返回退出码 1，否则 0。

- [ ] **Step 1: 复制脚本**

```powershell
Copy-Item "C:\Users\Xiang\AppData\Local\Temp\opencode\human-writing\human-writing\scripts\check_prose.py" "D:\00 Work\fonstone\fonstone.github.io\scripts\check_prose.py"
```

- [ ] **Step 2: 验证可运行（用现有文章做冒烟测试）**

Run: `python scripts/check_prose.py "content/AI/kimi-k3-architecture-deep-dive.mdx"`
Expected: 输出汉字数统计与检测结果（需要修改或需要人工判断），脚本正常结束，不报错崩溃。若按退出码返回 1（命中禁令），属正常现象，说明检测器在工作。

- [ ] **Step 3: 提交**

```bash
git add scripts/check_prose.py
git commit -m "chore(writing): add check_prose.py from human-writing v1.1.0"
```

### Task 2: 创建 docs/writing-guide.md

**Files:**
- Create: `docs/writing-guide.md`

**Interfaces:**
- Consumes: `scripts/check_prose.py`（指南末尾引用其用法）；Task 1 完成后再写本文件。
- Produces: 完整写作指南，供 AGENTS.md（Task 3）引用。

- [ ] **Step 1: 编写指南正文**

按下面给出的完整内容写入 `docs/writing-guide.md`（内容已保证自身通过硬禁令检查，禁令示例均已反引号包裹）。来源对应关系标注在各节标题行尾，供校对时参考。

```markdown
# StoneFon 知识空间写作指南

面向本工程 content/ 下的技术知识文章。目标是把文章写成一个具体的人在说话。他做过调试、查过资料、有判断，也承认哪里拿不准。读者读完要能核验你写的每个数字。

## 动笔前先过材料关

来源 SKILL.md 第一关。技术长文（1200 字以上）动笔前，逐条列出至少五件具体材料。论文或官方文档的原文、源码或 config.json 里的参数、实验或基准数字、产品版本号与许可证、本人亲历的调试过程，都可以。每件注明来自哪份来源。材料不够，按顺序处理。查公开资料并重新计数。查不到就一次问用户最多三个问题。用户不让问，就缩小题目或缩短篇幅。绝不拿重复解释灌字数。抽象观点换四种说法仍然是同一条材料。每段都要能指出它靠哪件材料站住。答案只是由上一段可以想到，删。

## 找到说话位置

来源 SKILL.md 动笔前先找到说话位置。写 AI 知识空间文章，以 AI 大模型工程师的身份说话。写 OS、嵌入式、自动驾驶文章，以对应领域的工程师身份说话。内部回答五件事。谁在说，凭什么知道。什么事情让他现在想说。手里有哪些能托住文章的材料，比如动作、数字、时间、版本、原话、失败、代价。他对哪一点有明确判断，依据是什么。读者读完上一段最会追问什么。作者可以承认哪块只是推测，哪块查过资料，哪块到现在仍拿不准。查资料不等于亲历，两者都写清楚。

## 真实性核验

来源 references/reality.md。数字、版本号、许可证、价格、产品能力写作前重新确认。职位、政策、软件版本会变。一手材料优先。论文、正式文档、源码、config.json、官方模型卡。媒体与二手分析只用来补背景和交叉核对。来源冲突时，说明你怎样取舍，不挑最适合故事的一条写死。数据写完继续走一步。数字后面说明它让谁多花多少时间、少付多少钱、增加哪种选择或受什么限制。一个案例不能代表整个行业。产品状态分开记录。已开放、邀请测试、宣布即将提供、长期愿景、行业猜测。标题只写到当前事实允许的位置。用户提供截图，不补注册和运行过程。用户记不清原话，写大意或请确认。完全靠公开资料写成的文章，开头附近留一处真实的检索痕迹，比如"我把能找到的报告和 config 对了一遍，公开细节其实很少"。后面不用反复声明谨慎。引用别人的话第一次出现时说明是谁说的。

## 细节必须有工作

来源 references/forum-prose.md 具体细节必须有工作。一条 config 参数要说明它改变什么。一次编译报错要说明它如何暴露问题。一个性能数字要说明它相对谁、在什么条件下快多少。装饰性细节全部删除。无来源的精确时间、天气、神态、房间摆设。没有来源又不改变后文的细节，越具体越假。技术知识等读者问到再出现。一段背景能解释为什么只能这样选，或能推翻直觉，才放进来。只证明作者知道很多，删掉。

## 文章怎样往前走

来源 references/forum-prose.md 文章按局部问题往前走。开头尽快碰到事情，不预告结构。标题和小标题不先命名成三个维度、四层原因，分类从材料里长出来。写完一段只问一句，读者现在最想知道什么。推进靠材料和因果，不靠更深一层这类路标。新段落必须增加新东西。新事实、新动作、新例子、新区别或新后果。同一观点换说法不算推进。可以岔开，回来时要多带一件东西。一条证据、一个尺度、一个反例。

## 中文怎么顺

来源 references/forum-prose.md 句子先把主干交出来。先说谁做了什么，再补时间、原因和条件。一句话里三四个"的"，先找做事的人。删掉一半连词。中文小句靠语序和事理相接。长短句有高低差。十个字的句子挨着四十个字的句子。普通地方用普通句子结束，不要每段都用短判断收尾。该重复的词就重复，不要换同义词躲。动词直接写。把流程改顺了，不写完成了对流程的优化。动作、数字、原话已经把意思写出来就停住，不追一句解释。留白只省读者自己能得到的部分。

## 成稿绝对不能出现

来源 SKILL.md 成稿绝对不能出现，外加 references/revision.md 第五遍。冒号与英文冒号只允许引出人物直接原话。提示性冒号禁止，比如 `一句话总结：`。网址、代码、字段除外。破折号一律不用。翻案腔禁止。指先立一个读者没有的误解再推翻它抬价，穿什么字面都算。常见外衣有 `不是A而是B`、`并非A而是B`、`不在于A而在于B`、`与其说A不如说B`、`表面A实际B`、`看似A实则B`、`你以为A其实B`、`A不重要重要的是B`。判断从正面下，依据放在旁边。三项以上同构排比禁止。同一句型连排三次，留两项，第三项换说法或删掉。不给抽象名词配具体动词写抒情。时间不保管细节，焦虑不显出形状。不把动词名词化。`进行优化`写成改顺了。不用黑话。`赋能`、`抓手`、`商业闭环`、`能力沉淀`、`拉通`、`底层逻辑`、`顶层设计`、`认知跃迁`、`价值释放`、`降本增效`、`全链路`、`组合拳`、`打开想象空间`、`结构性机会`、`关键命题`、`深层逻辑`、`技术底座`、`公共底座`、`技术主权`、`单点风险`、`主脊柱`、`材料锚点`、`认知增量`、`迭代闭环`。语境词谨慎用。`沉淀`、`颗粒度`、`对齐`、`协同`、`链路`、`生态位`、`心智`、`范式`、`方法论`、`核心变量`、`打法`、`想象空间`、`闭环`、`不丢`。表示本义时保留，抬价时改写。不用洞察路标抬段。`更微妙的是`、`还有一层`、`只说对了一半`、`值得注意的是`、`需要指出的是`、`从某种意义上说`。不用 `说白了`、`说穿了`、`先说结论`。不用仓库、抽屉、温度、死亡、坍塌、浪潮、钥匙、底座等借喻包装抽象概念。文章真的在写这些东西时不受影响。引用原话命中以上禁令时改成转述，不能靠引号保留。结尾不重新摘要全文，不升华到时代、文明、未来。

## 七遍改稿

来源 references/revision.md。

第一遍看谁在说。作者凭什么知道这件事。哪几段换一个模型也能原样写出来，这类段落优先补材料来路或删掉。

第二遍看推进。给每段标作用。动作、事实、解释、例子、疑问、判断、背景。连续几段只做同一件事就合并或删除。删掉三分之一后事实和判断几乎不变，原稿在注水。

第三遍拆表演性中文。假深刻，单句截图好看放进正文没用的，删。假具体，无来源的精确细节，删。抽象名词，一句话能换进十篇文章，删。比喻换场，先还原成本义。

第四遍听节奏。主干早点来。后一句接前一句的对象。逗号处还能接着说，句号处已落下一件事。动作后面少解释一句。

第五遍清禁用项。逐项对照成稿绝对不能出现，用检测脚本扫一遍。

第六遍核事实。数字、引语、因果、第一人称动作逐项核对，核验笔记留在后台。

第七遍查结尾。最后两段分别删掉再读，删掉更有力就让文章提前结束。末段概括全文的删掉。结尾回到具体事实，不升华。

## 用检测脚本

运行 `python scripts/check_prose.py 稿件路径`。脚本把冒号、破折号、翻案句、硬停词、模型路标和绝对禁用的黑话判为失败，命中就改到清零。警告项比如句长变异系数、连词密度、段落节奏、借喻簇，需要人工判断。
```

- [ ] **Step 2: 自检指南自身**

Run: `python scripts/check_prose.py docs/writing-guide.md`
Expected: 输出汉字数统计。需要修改（failures）必须为零。需要人工判断（warnings）可以存在，逐条确认是真实提示而非禁令（例如"真正"出现次数超过提醒线时，改写一两处）。若有 failures，按提示修改指南措辞，禁令示例保持反引号包裹，直到清零。

- [ ] **Step 3: 提交**

```bash
git add docs/writing-guide.md
git commit -m "docs(writing): add writing guide adapted from human-writing for knowledge articles"
```

### Task 3: 创建根目录 AGENTS.md

**Files:**
- Create: `AGENTS.md`（仓库根目录）

**Interfaces:**
- Consumes: `docs/writing-guide.md`（Task 2 的产物，链接目标）。

- [ ] **Step 1: 写入文件**

按下面给出的完整内容写入 `AGENTS.md`（内容已保证自身通过硬禁令检查，无裸冒号、无破折号）。

```markdown
# AGENTS.md

本仓库是 StoneFon 的个人知识博客（Next.js + MDX）。写 content/ 下的知识文章时，遵循 docs/writing-guide.md 的完整写作规范。核心规则如下。

- 材料关。技术长文动笔前至少五件可指认来源的具体材料，包括论文、官方文档、源码、config.json、实验数字、亲历调试。不够就先查、再问、最后缩短，禁止重复解释灌水。
- 真实性。数字、版本号、许可证写作前重新确认。一手材料优先。来源冲突说明取舍。数据写完说明影响谁。标题只写到事实允许的位置。
- 细节。细节必须有工作。一条参数、一次报错、一个数字都要改变理解。无来源的装饰性细节全部删除。
- 说话位置。AI 知识空间文章以 AI 大模型工程师身份说话。OS、嵌入式、自动驾驶文章以对应领域工程师身份说话。
- 硬禁令。正文不用冒号（仅引原话可用）、破折号、翻案句、三项以上排比、黑话、借喻包装、洞察路标。结尾不升华。
- 交稿前运行 `python scripts/check_prose.py <稿件路径>`，硬禁令清零才能提交。
```

- [ ] **Step 2: 验证**

- 确认 `docs/writing-guide.md` 存在（Task 2 产物）。
- 运行 `python scripts/check_prose.py AGENTS.md`。需要修改（failures）必须为零。

- [ ] **Step 3: 提交**

```bash
git add AGENTS.md
git commit -m "docs(writing): add AGENTS.md entry pointing to writing guide"
```

---

## 最终验收

- [ ] `scripts/check_prose.py` 可用。`python scripts/check_prose.py <mdx>` 正常输出
- [ ] `docs/writing-guide.md` 覆盖。材料门槛、说话位置（按分类）、真实性核验、细节规则、推进方式、中文语感、硬禁令、七遍改稿、脚本用法
- [ ] 指南自身通过硬禁令检查（failures 为零）
- [ ] `AGENTS.md` 存在，含核心规则与完整指南链接，自身 failures 为零
- [ ] 三个文件均无 human-writing 来源与 MIT 许可标注
