# tech-blog-writing 技能与脚本扩展实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 参考 Supervisor-Skills 的 skills 实现，把技术博客写作方法升级为带阶段门禁的可执行技能（tech-blog-writing），扩展 check_prose.py 三类新检查，更新写作指南与 AGENTS.md。

**Architecture:** 四块独立交付。① `scripts/check_prose.py` 新增占位标记（硬失败）、过度声称词（警告）、真实/计划状态混写（警告）三类检查。② 用户级技能 `~/.agents/skills/tech-blog-writing/`（SKILL.md + references/ 两个纪律文件，自动被 opencode 扫描加载，无需配置）。③ `docs/writing-guide.md` 加入证据层级、材料清单模板、红牌表、声称校准、终审流程。④ `AGENTS.md` 加技能入口。

**Tech Stack:** Python 3.12（check_prose.py 已用 stdlib，无新依赖）；Markdown 技能文件。

## Global Constraints

- 技能名固定为 `tech-blog-writing`，文件夹名与 frontmatter name 一致，小写连字符
- 技能位置固定为 `C:\Users\Xiang\.agents\skills\tech-blog-writing\`（用户级外部技能，opencode 自动扫描，无需改任何配置）
- check_prose.py 不引入新依赖，保持现有输出格式（需要修改/需要人工判断/汇总行）
- 占位标记判硬失败（退出码 1），过度声称与状态混写只判警告（不影响退出码）
- docs/writing-guide.md 与 AGENTS.md 的既有规则一条不删，只增改
- 现有 content/ 文章不改动；现有文章已确认无占位标记（grep 验证），回归不得新增硬失败
- 中文控制台可能出现乱码（GBK），验证以退出码和关键字匹配为准，可加 `-X utf8` 读输出
- 技能引用工程内文件用相对路径（docs/writing-guide.md、scripts/check_prose.py），不写死绝对路径

---

### Task 1: check_prose.py 三类新检查

**Files:**
- Modify: `scripts/check_prose.py`（常量区、函数区、main() 检测区、汇总行）

**Interfaces:**
- Produces: 新失败项 `占位标记`；新警告 `过度声称词`、`状态混写段落`；汇总行新增三个计数。Task 3 的指南文档按这些名称引用。

- [ ] **Step 1: 在常量区新增四组常量**

在 `NOMINALIZATION_PATTERNS` 定义结束后（约 127 行）插入：

```python
PLACEHOLDER_PATTERNS = (
    re.compile(
        r"\[(?:TBD|TODO|FIXME|XXX|citation needed|待核验|待确认|待补充|待验证|待核实|需核实|需确认|需要补充|需要核实)[^\]]{0,24}\]",
        re.IGNORECASE,
    ),
    re.compile(
        r"[（(](?:待核验|待确认|待补充|待验证|待核实|需核实|需确认|需要补充|需要核实|TBD|TODO|citation needed)[^）)]{0,24}[）)]",
        re.IGNORECASE,
    ),
)

OVERCLAIM_WORDS = (
    "首次提出",
    "首次实现",
    "首次发布",
    "首创",
    "最先进",
    "最领先",
    "业界领先",
    "世界领先",
    "行业领先",
    "显著提升",
    "显著提高",
    "大幅提升",
    "大幅提高",
    "巨大提升",
    "革命性",
    "突破性",
    "颠覆性",
    "里程碑式",
    "彻底解决",
    "完全解决",
    "遥遥领先",
)

REAL_STATE_MARKERS = (
    "已实现",
    "已发布",
    "已开放",
    "已上线",
    "已完成",
    "已支持",
    "实测",
)

PLAN_STATE_MARKERS = (
    "将提供",
    "将发布",
    "将上线",
    "预计",
    "即将",
    "规划中",
    "计划中",
)
```

- [ ] **Step 2: 新增状态混写检测函数**

在 `prose_paragraphs` 函数定义结束后（约 339 行）插入：

```python
def state_mixing_paragraphs(text: str):
    """同一段里真实状态词与计划状态词并存，可能把计划写成了事实。"""

    matches = []
    cursor = 0
    for block in re.split(r"\n\s*\n", text):
        position = text.find(block, cursor)
        cursor = max(position + len(block), cursor)
        real = [term for term in REAL_STATE_MARKERS if term in block]
        plan = [term for term in PLAN_STATE_MARKERS if term in block]
        if real and plan:
            matches.append((position, block, real, plan))
    return matches
```

- [ ] **Step 3: main() 内新增检测逻辑**

在 `重定语句` 警告块结束之后（约 575 行）、`paragraphs = prose_paragraphs(prose)` 之前插入：

```python
    placeholder_matches = all_matches(prose, PLACEHOLDER_PATTERNS)
    for match in placeholder_matches:
        failures.append(
            f"占位标记，第 {line_number(text, match.start())} 行，"
            f"“{excerpt(match.group())}”。无来源声明先检索，找不到就改写或删除，绝不打标签。"
        )

    overclaim_matches = non_overlapping_terms(prose, OVERCLAIM_WORDS)
    if overclaim_matches:
        samples = "、".join(dict.fromkeys(phrase for _, phrase in overclaim_matches))
        lines = "、".join(
            dict.fromkeys(
                str(line_number(text, position)) for position, _ in overclaim_matches[:8]
            )
        )
        warnings.append(
            f"有 {len(overclaim_matches)} 处过度声称词。第 {lines} 行出现 {samples}。"
            "声称强度不超过证据强度，强词只配 L1 证据，拿不准就降级措辞。"
        )

    state_mixes = state_mixing_paragraphs(prose)
    for position, block, real, plan in state_mixes[:4]:
        warnings.append(
            f"同一段出现真实状态词（{'、'.join(real)}）与计划状态词（{'、'.join(plan)}），"
            f"第 {line_number(text, position)} 行附近。检查是否把计划写成了事实，或把事实写成了计划。"
        )
```

- [ ] **Step 4: 更新汇总行**

把 main() 末尾的 `print(f"汉字数 {total_han}")` 之后那段多行 print 改为：

```python
    print(
        f"翻案句 {len(pivots)}，翻案腔变形 {len(semantic_pivots)}，"
        f"同构排比 {len(anaphoras)}，名词化 {len(nominalizations)}，"
        f"黑话 {len(jargon_matches)}，硬停词 {len(stop_matches)}，"
        f"模型路标 {len(road_signs)}，需辨语境词 {len(context_jargon_matches)}，"
        f"抒情词 {len(lyric_matches)}，洞察路标 {len(marker_matches)}，"
        f"长前置成分 {len(left_branches)}，重定语句 {len(dense_de)}，"
        f"占位标记 {len(placeholder_matches)}，过度声称 {len(overclaim_matches)}，"
        f"状态混写段落 {len(state_mixes)}"
    )
```

- [ ] **Step 5: 语法自检**

Run: `python -m py_compile scripts/check_prose.py`
Expected: 无输出，退出码 0

- [ ] **Step 6: 写三个夹具并验证占位标记硬失败**

创建 `C:\Users\Xiang\AppData\Local\Temp\opencode\prose-fixtures\` 目录和三个文件：

`placeholder.md`:
```markdown
---
title: 占位标记测试
---

这里有一个[待核验]的标记，需要处理。

正常段落结束。
```

`overclaim.md`:
```markdown
---
title: 过度声称测试
---

我们的方案显著提升推理速度，首次提出端侧部署思路。

正常段落结束。
```

`state-mixing.md`:
```markdown
---
title: 状态混写测试
---

该功能已上线，多模态能力将提供预览，预计明年开放。

正常段落结束。
```

Run: `python scripts/check_prose.py C:\Users\Xiang\AppData\Local\Temp\opencode\prose-fixtures\placeholder.md; $LASTEXITCODE`
Expected: 输出含 `占位标记` 于 `需要修改` 列表，退出码 1

Run: `python scripts/check_prose.py C:\Users\Xiang\AppData\Local\Temp\opencode\prose-fixtures\overclaim.md; $LASTEXITCODE`
Expected: 输出含 `过度声称词` 于 `需要人工判断` 列表，退出码 0（警告不改变退出码）

Run: `python scripts/check_prose.py C:\Users\Xiang\AppData\Local\Temp\opencode\prose-fixtures\state-mixing.md; $LASTEXITCODE`
Expected: 输出含 `状态词` 于 `需要人工判断` 列表，退出码 0

- [ ] **Step 7: 现有文章回归**

Run: `python scripts/check_prose.py "content\AI\dspark-speculative-decoding-deep-dive.mdx" 2>&1 | Select-String "占位标记"; python scripts/check_prose.py "content\OS\memory-barrier-deep-dive.mdx" 2>&1 | Select-String "占位标记"`
Expected: 两篇都不输出 `占位标记`（内容区已 grep 确认无占位模式）。允许出现新增的 `过度声称` 或 `状态混写` 警告，逐条记录到交付说明

- [ ] **Step 8: 提交**

```bash
git add scripts/check_prose.py
git commit -m "feat(scripts): add placeholder, overclaim and state-mixing checks to check_prose.py"
```

---

### Task 2: tech-blog-writing 技能（SKILL.md + references/）

**Files:**
- Create: `C:\Users\Xiang\.agents\skills\tech-blog-writing\SKILL.md`
- Create: `C:\Users\Xiang\.agents\skills\tech-blog-writing\references\evidence-discipline.md`
- Create: `C:\Users\Xiang\.agents\skills\tech-blog-writing\references\review.md`

**Interfaces:**
- Consumes: Task 1 的检查名称（占位标记/过度声称/状态混写）在 SKILL.md P5 中引用
- Produces: 技能内容供 Task 3 的指南和 Task 4 的 AGENTS.md 引用（技能名 `tech-blog-writing`）。技能引用工程文件用相对路径，不写死绝对路径

- [ ] **Step 1: 创建 SKILL.md**

```markdown
---
name: tech-blog-writing
description: 技术博客文章写作 Skill。用于写或大幅重写技术知识文章、技术长文、技术 survey、deep-dive、技术教程、产品与技术分析（AI、OS、嵌入式、自动驾驶、底层原理等）。六阶段门禁流程，材料关、蓝图、成稿、自审、终审、交付。每个事实声明可溯源到用户材料、已核验的检索或领域常识，无来源声明在规划期排除绝不写占位标记，声称强度不超过证据强度，成稿干净无内部规划泄漏。公众号文章走 gzh-write，虚构与人物故事走 human-writing，本技能不处理。
---

# 技术博客写作

把一篇技术知识文章写成具体的人说的话。作者调试过、查过资料、有判断，也承认哪里拿不准。读者读完能核验每个数字。

本技能是流程执行者。风格规则（语感、禁令、改稿）以工程内 docs/writing-guide.md 为准，本技能负责把规则变成带门禁的阶段流程。证据纪律与终审规则在本技能 references/ 目录。

## 路由

- 本工程 content/ 下的技术知识文章、技术长文、survey、deep-dive、教程、评测，用本技能。
- 公众号文章走 gzh-write，虚构、人物、故事走 human-writing，两者不混。
- 文章所在工程有 docs/writing-guide.md 和 scripts/check_prose.py 时，先读指南，交稿前跑脚本。没有这两个文件的工程，以本技能 references/ 的规则为准。

## 能力检查（每会话一次）

- 有 websearch：检索用。没有：闭卷写作，交付说明写明未做独立检索。
- 有 task 子代理：派 fresh-context 代理独立核验关键数字与引用。没有：同上下文自查，交付说明写明。
- 证据规则本身不降级，只有核验机制降级。

## 六阶段

### P1 范围

定三件事。粒度，长文（1200 字以上）把材料清单写成工作文件，短文脑内过。文章领域，AI 知识空间以 AI 大模型工程师身份说话，OS、嵌入式、自动驾驶以对应领域工程师身份说话，管理类以管理实践者身份说话。模式，草稿可留待用户补材料，成稿所有未决项清零。

### P2 材料关

- 证据层级 L0-L4 与材料清单模板见 references/evidence-discipline.md。
- 长文逐条列出至少五件具体材料，注明层级与来源，写成材料清单文件。
- 门禁。无 L0-L3 来源的声明不写成事实。先检索，两三种关键词变体找不到，改写句子去掉该声明或删除。绝不打占位标签。
- 材料不够按顺序处理。检索补充，一次最多三问，用户不让问就缩小题目或缩短篇幅。绝不用重复解释灌字数。

### P3 说话位置与蓝图

- 内部回答五问，谁在说、凭什么知道、什么事情让他现在想说、手里哪些材料、哪块拿不准。答案不交给用户。
- 内部按技术文段落骨架规划，见 references/evidence-discipline.md 蓝图节。骨架只做内部思考，输出结构仍从材料长出来，不预设三个维度式命名。
- 对齐检查。开头场景在方案段重现。每条局限有来源。难点与方案模块一一对应。每条结论能指出支撑的证据 ID。

### P4 成稿

- 逐段 provenance thinking。写前内部确定这段声明什么、每件靠哪份来源。无来源声明在规划期排除，成稿不留任何待办标记。
- 红牌停止信号表见 references/evidence-discipline.md。出现我记得之类想法就停，省略、改写或删除。
- 声称校准。声称强度不超过证据强度，动词分级见 references/evidence-discipline.md。
- 真实结果与预期结果措辞分离，绝不混写。产品状态分开记录，已开放、邀请测试、宣布即将提供、长期愿景、行业猜测。
- 风格与语感。本工程按 docs/writing-guide.md。其他工程按 references/evidence-discipline.md 的通用规则。

### P5 终审

- 自审。谁在说、推进、表演性中文、节奏、禁令、事实、结尾。本工程按 docs/writing-guide.md 七遍改稿。
- severity 分级审查。五维度加 CRITICAL/MAJOR/MINOR 加 integrity gate，见 references/review.md。
- 跑检测脚本。本工程为 scripts/check_prose.py，硬失败清零。
- 存在 CRITICAL 禁止可直接发布结论。

### P6 交付

- 干净成稿。零标记、零内部规划泄漏、零审查过程输出。写入 content/ 对应目录。
- 有引用时附来源列表，只列对结论重要的少数来源。
- 不超过三行说明。能力降级、需用户确认项、作者该补的材料。
- 内部规划（材料清单、骨架、审查表）不入成稿，用户要时提供。
```

- [ ] **Step 2: 创建 references/evidence-discipline.md**

```markdown
# 证据纪律

## 证据层级

| 层级 | 来源 | 能支撑 | 不能支撑 |
|---|---|---|---|
| L1 全文/数据 | 论文全文、官方文档、源码、config.json、亲历调试日志 | 任何声明 | 无 |
| L2 摘要/页面 | 论文摘要、官方 release note、官方 blog | 研究方向、头条结论 | 具体数字、实现细节 |
| L3 元数据 | 检索返回的标题/作者/年份/版本 | X 在 Y 年做了 Z | 方法细节、性能数字 |
| L0 领域常识 | 从业者不引证也接受，且无数字无名无比较 | 背景框架句 | 任何带数字/名称/比较的声明 |
| L4 模型记忆 | 只是记得 | 无 | 一切 |

对一句话是否常识犹豫，它就不是 L0，检索找来源。L4 永不进材料清单。

## 材料清单模板（长文落盘，短文脑内过）

| ID | 来源 | 层级 | 能支撑 | 不能支撑 | 计划用途 | 风险 |
|---|---|---|---|---|---|---|
| E1 | 论文全文第 3 节 | L1 | 方法步骤、精确数字 | 无 | 原理段 | 无 |
| E2 | 检索元数据 | L3 | X 在 Y 年做了 Z | 方法步骤、数字 | 背景段 | 仅元数据 |

不能支撑列强制填写。来源是文件时记路径。L3 行带仅元数据风险标记。清单是内部工作文件，不进成稿。

## 写时红牌

| 想法 | 正确动作 |
|---|---|
| 我记得这个参数是 8 | 停。不确定就省略数字 |
| 我记得这篇论文用了三阶段 | 停。没读全文只写引证级 |
| 这个场景大概需要…… | 停。量级只写用户给的 |
| 背景应该提一下领域发展史 | 停。超出 L0 必须有来源，找不到就不写 |
| 加个失败案例更能说明问题 | 停。不编造案例，用用户亲历 |
| 补上原理细节更像技术文 | 停。没读到的机制不补，缺材料就明说 |

## 声称校准

- 强词（证明、首次、最先进、显著提升）只在 L1 证据上用。
- 中词（表明、说明、与……一致）用于合理但有开放性的发现。
- 弱词（可能反映、看起来、推测）用于猜测。
- 无证据时用可能、有待、看起来，不替作者抬价。
- 真实结果与预期结果措辞分离。实测、已实现、已开放，与将提供、预计、即将，绝不混写。

## 蓝图（内部段落骨架，不进入输出）

1. 具体场景或事实开头，尽快碰到事情，不预告结构。
2. 现有方案或工具的局限，至多三条，每条有来源。
3. 问题本质与目标，硬约束明确。
4. 关键难点，至多三条。
5. 方案、原理、数据，逐条对应难点。
6. 边界与结论。数据影响谁，哪些拿不准。

骨架只做内部思考。分类和小标题从材料长出来，不预设三个维度式命名。短文（1200 字以下）压缩骨架为三到四步，材料关和终审不跳过。

## 真实性

- 数字、版本号、许可证、价格写作前重新确认。
- 一手材料优先。来源冲突说明取舍，不挑最适合故事的一条写死。
- 数据写完说明影响谁。一个案例不能代表整个行业。
- 完全靠公开材料写的文章，开头附近留一处真实检索痕迹。
- 引用别人的话第一次出现说明是谁说的。
- 用户经历不代写。用户记不清原话，写大意或请确认。
```

- [ ] **Step 3: 创建 references/review.md**

```markdown
# 终审

## 五个维度

1. 事实可核验性。每个数字、版本、引用能否指出来源。
2. 材料支撑度。每段能指出支撑的证据 ID，L 级配得上声称强度。
3. 结构推进。每段新增了什么，删掉三分之一后事实判断是否不变。
4. 硬禁令。冒号、破折号、翻案句、黑话、排比、占位标记，用检测脚本扫。
5. 语感节奏。主干、长短句、段落鼓点。

## 严重度

- CRITICAL（阻断发布）。无来源的关键事实、编造数字、来源冲突挑好的写、声称强度远超证据。
- MAJOR（读者会追问）。声称过强、关键证据缺失、段落无新增、结构断裂。
- MINOR（打磨）。句长、措辞、过渡。

## integrity gate（静默执行，不输出检查过程）

- 每条 finding 必须引具体原文，不允许无引文的笼统发现。
- CRITICAL 必须有具体改法，不允许只写重写。
- 不编造引文，只引成稿里真实存在的句子。
- 严重度分级符合规则，不因口味把 MINOR 升 CRITICAL。
- 终审结论与发现一致，存在 CRITICAL 禁止可直接发布。

## 输出格式

严重度统计加分维度表格（# | 原文 | 严重度 | 改法）加发布建议（可直接发布、需 1-2 天再改、需大改）。审查结果不入成稿。
```

- [ ] **Step 4: 验证技能文件**

Run:
```powershell
Test-Path "C:\Users\Xiang\.agents\skills\tech-blog-writing\SKILL.md"
Test-Path "C:\Users\Xiang\.agents\skills\tech-blog-writing\references\evidence-discipline.md"
Test-Path "C:\Users\Xiang\.agents\skills\tech-blog-writing\references\review.md"
Get-Content "C:\Users\Xiang\.agents\skills\tech-blog-writing\SKILL.md" -TotalCount 3
```
Expected: 三个文件都存在；frontmatter 首行 `---`，第二行 `name: tech-blog-writing`，第三行以 `description:` 开头。技能位于 `~/.agents/skills/`，opencode 自动扫描外部技能，无需改配置。

- [ ] **Step 5: 提示用户重启**

告知用户：技能已创建，需要退出并重启 opencode 才会被加载（外部技能扫描在启动时进行）。

（用户级文件，不在本仓库，不提交 git。本任务无 commit。）

---

### Task 3: docs/writing-guide.md 更新

**Files:**
- Modify: `docs/writing-guide.md`（六处增改）

**Interfaces:**
- Consumes: Task 1 的检查名称（占位标记、过度声称词、状态混写）在脚本节引用；Task 2 的技能流程在终审节衔接
- Produces: 指南成为技能 P2-P6 的风格依据，Task 4 的 AGENTS.md 指向它

- [ ] **Step 1: 材料关之后新增证据层级节**

在 `## 找到说话位置` 之前插入：

```markdown
## 证据层级

材料按来源分五级，决定它能撑住多强的声明。

| 层级 | 来源 | 能支撑 | 不能支撑 |
|---|---|---|---|
| L1 全文/数据 | 论文全文、官方文档、源码、config.json、亲历调试日志 | 任何声明 | 无 |
| L2 摘要/页面 | 论文摘要、官方 release note、官方 blog | 研究方向、头条结论 | 具体数字、实现细节 |
| L3 元数据 | 检索返回的标题/作者/年份/版本 | X 在 Y 年做了 Z | 方法细节、性能数字 |
| L0 领域常识 | 从业者不引证也接受，且无数字无名无比较 | 背景框架句 | 任何带数字/名称/比较的声明 |
| L4 模型记忆 | 只是记得 | 无 | 一切 |

对一句话是否常识犹豫，它就不是 L0，检索找来源。L4 永不进材料清单。长文把材料清单写成工作文件，每件一行。

| ID | 来源 | 层级 | 能支撑 | 不能支撑 | 计划用途 | 风险 |
|---|---|---|---|---|---|---|
| E1 | 论文全文 第 3 节 | L1 | 方法步骤、精确数字 | 无 | 原理段 | 无 |
| E2 | 检索元数据 | L3 | X 在 Y 年做了 Z | 方法步骤、数字 | 背景段 | 仅元数据 |

不能支撑列强制填写。来源是文件时记路径。清单是内部工作文件，不进成稿。
```

- [ ] **Step 2: 真实性核验节内补声称校准段**

在真实性核验节的段落末尾（"完全靠公开资料写成的文章，开头附近留一处真实的检索痕迹"所在段落之后）新增一段：

```markdown
声称强度不超过证据强度。强词，证明、首次、最先进、显著提升，只在 L1 证据上用。中词，表明、说明、与……一致，用于合理但有开放性的发现。弱词，可能反映、看起来，用于猜测。真实结果与预期结果措辞分离。实测、已实现、已开放，与将提供、预计、即将，绝不混写。
```

- [ ] **Step 3: 细节节之后新增写时红牌节**

在 `## 文章怎样往前走` 之前插入：

```markdown
## 写时红牌

出现下面这些想法就停。它们是模型记忆冒充材料的信号。

| 想法 | 正确动作 |
|---|---|
| 我记得这个参数是 8 | 停。不确定就省略数字 |
| 我记得这篇论文用了三阶段 | 停。没读全文只写引证级 |
| 这个场景大概需要…… | 停。量级只写用户给的 |
| 背景应该提一下领域发展史 | 停。超出 L0 必须有来源，找不到就不写 |
| 加个失败案例更能说明问题 | 停。不编造案例，用用户亲历 |
```

- [ ] **Step 4: 七遍改稿第六遍指向终审**

把第六遍原文：

```markdown
第六遍核事实。数字、引语、因果、第一人称动作逐项核对，核验笔记留在后台。
```

改为：

```markdown
第六遍核事实。数字、引语、因果、第一人称动作逐项核对，对应终审节维度一与维度二。
```

- [ ] **Step 5: 七遍改稿之后新增终审节**

在 `## 用检测脚本` 之前插入：

```markdown
## 终审

初稿和七遍改稿之后，按五个维度过一遍，每条发现必须引原文。

1. 事实可核验性。每个数字、版本、引用能否指出来源。
2. 材料支撑度。每段能指出支撑的证据 ID，L 级配得上声称强度。
3. 结构推进。每段新增了什么，删掉三分之一后事实判断是否不变。
4. 硬禁令。冒号、破折号、翻案句、黑话、排比、占位标记，用检测脚本扫。
5. 语感节奏。主干、长短句、段落鼓点。

发现按严重度分级。阻断发布，无来源的关键事实、编造数字、来源冲突挑好的写、声称远超证据。读者会追问，声称过强、关键证据缺失、段落无新增、结构断裂。打磨，句长、措辞、过渡。阻断项必须有具体改法，不能只写重写。存在阻断项就不能交稿。
```

- [ ] **Step 6: 脚本节补充三类新检查**

把 `## 用检测脚本` 一节末尾的说明改为：

```markdown
运行 `python scripts/check_prose.py 稿件路径`。脚本把冒号、破折号、翻案句、硬停词、模型路标、绝对禁用的黑话和占位标记判为失败，命中就改到清零。占位标记指 [待核验]、[TBD]、[citation needed] 这类括号内待办。警告项比如句长变异系数、连词密度、段落节奏、借喻簇、过度声称词和状态混写，需要人工判断。过度声称词，首次提出、最先进、显著提升，对照证据层级决定降级还是保留。真实状态词与计划状态词同段并存，比如已上线与将提供，检查是否把计划写成了事实。
```

- [ ] **Step 7: 校验指南完整**

Run: `Get-Content docs/writing-guide.md | Select-String "证据层级|写时红牌|终审|声称强度|占位标记"`
Expected: 六个新关键词全部命中

- [ ] **Step 8: 提交**

```bash
git add docs/writing-guide.md
git commit -m "docs(guide): add evidence hierarchy, red flags, calibration and final review to writing guide"
```

---

### Task 4: AGENTS.md 更新

**Files:**
- Modify: `AGENTS.md`（开头规则区加一条）

**Interfaces:**
- Consumes: Task 2 的技能名 `tech-blog-writing`
- Produces: 仓库入口指向技能，技能再引用指南与脚本

- [ ] **Step 1: 加入技能入口**

在 AGENTS.md 第一段（"写 content/ 下的知识文章时，遵循 docs/writing-guide.md 的完整写作规范。核心规则如下。"）之后插入一条规则：

```markdown
- 写 content/ 下的技术知识文章时，先调用 tech-blog-writing 技能。该技能把写作指南变成六阶段门禁流程，材料关、成稿、终审都在流程内执行。
```

- [ ] **Step 2: 校验**

Run: `Get-Content AGENTS.md | Select-String "tech-blog-writing"`
Expected: 命中一行

- [ ] **Step 3: 提交**

```bash
git add AGENTS.md
git commit -m "docs: point blog writing to tech-blog-writing skill"
```

---

## 自审记录

- 规格覆盖：六阶段流水线（Task 2）、证据层级表与材料清单模板（Task 2 + Task 3）、红牌表（Task 2 + Task 3）、声称校准（Task 2 + Task 3）、终审五维度与 severity（Task 2 + Task 3）、能力降级披露（Task 2 SKILL.md）、占位标记/过度声称/状态混写三类脚本检查（Task 1）、AGENTS.md 入口（Task 4）。无遗漏。
- 占位符扫描：所有步骤含完整内容，无 TBD/TODO。
- 类型一致性：技能名 `tech-blog-writing` 在 Task 2/4 一致；检查名称占位标记、过度声称、状态混写在 Task 1/2/3 一致；`state_mixing_paragraphs`、`PLACEHOLDER_PATTERNS`、`OVERCLAIM_WORDS`、`REAL_STATE_MARKERS`、`PLAN_STATE_MARKERS` 在 Task 1 各步一致。