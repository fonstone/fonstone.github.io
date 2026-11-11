#!/usr/bin/env python3
"""content/ 硬禁令扫描、清理与复检工具（幂等）。

只处理 content/ 下的 .md/.mdx。可编辑位置由 scripts/check_prose.py 的
mask_non_prose 判定，因此 frontmatter、代码围栏、行内代码、链接 URL、
https:// 与单行 HTML/JSX 标签天然不会被碰。再按行划分三种区域：

  prose    正文散文，执行全部确定性替换
  table    表格数据行，只把破折号/连接号换成普通连字符，冒号保留
  mermaid  <MermaidDiagram ... /> 图块，只把破折号/连接号换成普通连字符，
           中文冒号改逗号，英文冒号保留（CSS 属性与图内语法需要它）
  skip     HTML 注释、{/* */} 注释、代码围栏行，一个字符都不动

替换项均为确定性、低风险：破折号、连接号、提示性冒号、硬停词、绝对禁用
黑话、模型路标、翻案句。人物直接引语前的冒号保留。技术数字、代码、
图节点与连线、表格字段值、链接 URL 一律不改。所有替换幂等，重复运行
得到 0 改动。

用法：
    python scripts/clean-legacy-prose.py                 # dry-run，打印清理后复检结果，不落盘
    python scripts/clean-legacy-prose.py --apply         # 落盘，再复检汇总
    python scripts/clean-legacy-prose.py --apply <路径>  # 只处理指定文件
"""
from __future__ import annotations

import importlib.util
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
CHECKER = ROOT / "scripts" / "check_prose.py"

_spec = importlib.util.spec_from_file_location("check_prose", CHECKER)
cp = importlib.util.module_from_spec(_spec)
sys.modules["check_prose"] = cp
_spec.loader.exec_module(cp)

# 绝对禁用黑话 -> 直白说法。按词长降序应用，避免子串误替换。
JARGON_MAP = {
    "赋能": "支持",
    "抓手": "切入点",
    "商业闭环": "商业循环",
    "价值闭环": "价值循环",
    "能力沉淀": "积累",
    "拉通": "打通",
    "底层逻辑": "原理",
    "顶层设计": "整体设计",
    "认知跃迁": "认识变化",
    "价值释放": "价值体现",
    "能力建设": "能力培养",
    "降本增效": "降低成本",
    "内容矩阵": "内容体系",
    "全链路": "全流程",
    "组合拳": "配套措施",
    "打开想象空间": "留出余地",
    "结构性机会": "结构性条件",
    "关键命题": "关键问题",
    "深层逻辑": "深层原因",
    "技术底座": "技术基础",
    "公共底座": "公共基础",
    "技术主权": "技术自主",
    "单点风险": "单点故障风险",
    "主脊柱": "主干",
    "材料锚点": "材料依据",
    "认知增量": "新的认识",
    "迭代闭环": "迭代循环",
}

QUOTE_STARTS = ("「", "『", "“", "‘", '"')

PROSE_ONLY = ("prose",)
PROSE_TABLE = ("prose", "table")

WORD_RULES = [
    (re.compile(r"(?:并)?不是[^。！？\n]{0,90}而是"), "是", PROSE_ONLY),
    (re.compile(r"并非[^。！？\n]{0,90}而是"), "是", PROSE_ONLY),
    (re.compile(r"不在于[^。！？\n]{0,90}而在于"), "在于", PROSE_ONLY),
    (re.compile(r"(?:说白了|说穿了|先说结论)[，、：: \t]*"), "", PROSE_ONLY),
    (re.compile(r"(?:更微妙的是|还有一层|只说对了一半|值得注意的是|需要指出的是|从某种意义上说)[，, \t]*"), "", PROSE_ONLY),
]
for _term in sorted(JARGON_MAP, key=len, reverse=True):
    # 图节点标签里的黑话也换成直白说法，只动标签文字，不动节点 ID 与连线。
    WORD_RULES.append(
        (re.compile(re.escape(_term)), JARGON_MAP[_term], ("prose", "table", "mermaid"))
    )

# 含技术数字的翻案句不能机械删掉前半句，逐条给出保留数字的正面改写。
MANUAL_REWRITES = {
    "content/AI/ljg-skills-cognitive-framework.mdx": [
        (
            'ljg-paper 的"7拍故事脊柱"不是"请用7个段落总结论文"，而是"把论文讲成一个有主角、困境、转折的故事"。前者是格式约束，后者是**思维方式的重塑**。',
            'ljg-paper 的"7拍故事脊柱"要求把论文讲成一个有主角、困境、转折的故事，"请用7个段落总结论文"只约束了段落数。前者管思维方式，后者管格式。',
        ),
        (
            "核心贡献不是 21 个具体的技能实现，而是三条可迁移的设计原则：",
            "核心贡献是三条可迁移的设计原则，21 个具体的技能实现只是按这些原则写出来的例子。",
        ),
    ],
    "content/AI/agent-best-practices.mdx": [
        (
            "本文将其核心思想与更广泛的 Agent 工程实践融合，形成一个完整的最佳实践框架。",
            "这份最佳实践框架把它的核心思想和更广泛的 Agent 工程实践合在了一起。",
        ),
    ],
    "content/AI/ai-agent-knowledge-base.mdx": [
        (
            "本文系统梳理了第 4-6 章核心知识点并补充多图",
            "这里整理了第 4-6 章核心知识点并补充多图",
        ),
    ],
    "content/OS/ai-era-heterogeneous-os.mdx": [
        (
            "本篇文章将结合 AI 工作负载的真实需求与产业界的前沿思考，系统梳理异构操作系统的演进之路。",
            "把 AI 工作负载的真实需求与产业界的前沿思考合在一起，顺着异构操作系统的演进逐条看。",
        ),
    ],
    "content/OS/llm-driven-os-survey.mdx": [
        (
            "本文系统梳理四个代表性框架的架构与核心贡献。",
            "四个代表性框架的架构与核心贡献，逐篇拆开看。",
        ),
    ],
    "content/管理/huawei-gray-management-framework.mdx": [
        (
            "本文基于《华为管理法》相关笔记内容整理深化，系统梳理任正非管理思想的核心框架，",
            "这份笔记在《华为管理法》的基础上整理，把任正非管理思想的核心框架摊开，",
        ),
    ],
    "content/自动驾驶 & 具身智能/autonomous-driving-algorithm-overview.mdx": [
        (
            "本文系统梳理当前主流自动驾驶算法架构，帮助读者建立对完整技术栈的清晰认知。",
            "当前主流自动驾驶算法架构按模块拆开，能看到完整技术栈各层各自做什么。",
        ),
        (
            '> 技术的发展从来是由一个个范式转移推动的， 自动驾驶领域的每一次突破，都在重新定义"可能"的边界。',
            "> 从规则驱动的模块化流水线到端到端模型，感知与决策之间的接口换过几轮。",
        ),
    ],
    "content/自动驾驶 & 具身智能/data-loop-survey.mdx": [
        (
            '没有数据闭环，模型永远是实验室里的"温室花朵"；有了高效的数据闭环，系统才能在真实世界的"风吹雨打"中持续进化。',
            "没有数据闭环，模型只能在公开数据集上评估，遇到长尾场景就要人工接管；数据闭环跑起来之后，这些场景才能回流成训练样本。",
        ),
        (
            "未来的竞争，不再是单点技术的比拼，而是整个数据闭环体系的效率比拼。谁能用最低的成本、最快的速度、最高的质量，把现实世界的经验转化为模型能力，谁就能在自动驾驶和具身智能的终局中胜出。",
            "往后要看的是整个数据闭环体系的效率，成本、速度和标注质量各自能压到什么程度，取决于车队的回传规模和自动标注的准确率。",
        ),
    ],
}

CLEANUPS = (
    ("，，", "，"),
    ("，。", "。"),
    ("。，", "，"),
    ("，、", "、"),
    ("、，", "、"),
    ("，,", "，"),
    (",，", "，"),
)


def compute_zones(text: str) -> dict[int, str]:
    """逐字符标注所属区域。"""
    zones: dict[int, str] = {}
    offset = 0
    in_mermaid = False
    for line in text.splitlines(keepends=True):
        stripped = line.strip()
        if "<MermaidDiagram" in line:
            in_mermaid = True
            zone = "mermaid"
        elif in_mermaid:
            zone = "mermaid"
            if "`} />" in line or (line.rstrip().endswith("/>") and "`" in line):
                in_mermaid = False
        elif (
            stripped.startswith("<!--")
            or stripped.startswith("{/*")
            or stripped.startswith("-->")
            or stripped.startswith("*/}")
            or stripped.startswith("```")
        ):
            zone = "skip"
        elif stripped.startswith("|"):
            zone = "table"
        else:
            zone = "prose"
        for index in range(len(line)):
            zones[offset + index] = zone
        offset += len(line)
    return zones


def editable(masked: str, text: str, zones: dict[int, str], index: int) -> bool:
    ch = text[index]
    if ch in " \t\r\n":
        return False
    if masked[index] != ch:
        return False
    return zones.get(index) != "skip"


def word_pass(text: str) -> str:
    """确定性词汇/句式替换，只在 prose 区的可编辑位置生效。"""
    masked = cp.mask_non_prose(text)
    zones = compute_zones(text)

    def allowed(start: int, end: int, allowed_zones: tuple[str, ...]) -> bool:
        for i in range(start, end):
            if text[i] in " \t\r\n":
                continue
            if not editable(masked, text, zones, i):
                return False
            if zones.get(i) not in allowed_zones:
                return False
        return True

    edits: list[tuple[int, int, str]] = []
    for pattern, repl, allowed_zones in WORD_RULES:
        for match in pattern.finditer(text):
            # 含阿拉伯数字的翻案句留给人工改写，避免机械替换删掉技术数字。
            if repl in ("是", "在于") and re.search(r"\d", match.group()):
                continue
            if allowed(match.start(), match.end(), allowed_zones):
                edits.append((match.start(), match.end(), repl))

    # 去重重叠区间，按 WORD_RULES 顺序优先。
    edits.sort(key=lambda item: item[0])
    accepted: list[tuple[int, int, str]] = []
    for start, end, repl in edits:
        if any(start < prev_end and end > prev_start for prev_start, prev_end, _ in accepted):
            continue
        accepted.append((start, end, repl))

    for start, end, repl in reversed(accepted):
        text = text[:start] + repl + text[end:]
    return text


def punct_pass(text: str) -> str:
    """标点替换：破折号、连接号、提示性冒号，按区域区别对待。"""
    masked = cp.mask_non_prose(text)
    zones = compute_zones(text)
    out: list[str] = []
    index = 0
    length = len(text)
    while index < length:
        ch = text[index]
        if not editable(masked, text, zones, index):
            out.append(ch)
            index += 1
            continue
        zone = zones.get(index, "prose")

        if ch == "\u2014":  # — 破折号
            end = index
            while end < length and text[end] == "\u2014" and editable(masked, text, zones, end):
                end += 1
            out.append("-" if zone in ("mermaid", "table") else "，")
            index = end
            continue

        if ch == "\u2013":  # – 连接号式破折号，保留数字范围语义
            out.append("-")
            index += 1
            continue

        if ch in ("\uff1a", ":"):  # 中文/英文冒号
            following = index + 1
            while following < length and text[following] in " \t":
                following += 1
            next_char = text[following] if following < length else ""
            if next_char in QUOTE_STARTS:  # 人物直接引语冒号，保留
                out.append(ch)
                index += 1
                continue
            if zone == "table":  # 表格内字段写法，保留
                out.append(ch)
                index += 1
                continue
            if ch == ":" and zone == "mermaid":  # Mermaid CSS 属性冒号，保留
                out.append(ch)
                index += 1
                continue
            rest = text[index + 1 :]
            if rest.startswith("**"):  # **标签：** 收尾，删掉冒号
                index += 1
                continue
            line_end = text.find("\n", index)
            if line_end == -1:
                line_end = length
            if text[index + 1 : line_end].strip() == "":  # 行尾提示语
                out.append("。" if ch == "\uff1a" else "")
                index += 1
                continue
            out.append("，")
            index += 1
            continue

        out.append(ch)
        index += 1
    return "".join(out)


def clean_text(text: str, rel: str | None = None) -> str:
    for old, new in MANUAL_REWRITES.get(rel or "", []):
        text = text.replace(old, new)
    result = word_pass(text)
    result = punct_pass(result)
    for before, after in CLEANUPS:
        while before in result:
            result = result.replace(before, after)
    return result


def scan_text(text: str):
    """把文本交给官方检查器（stdin），返回 (退出码, 「需要修改」条目)。"""
    env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
    result = subprocess.run(
        [sys.executable, str(CHECKER), "-"],
        input=text,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env=env,
    )
    out = result.stdout
    failures = []
    if "需要修改" in out:
        segment = out.split("需要修改", 1)[1]
        if "需要人工判断" in segment:
            segment = segment.split("需要人工判断", 1)[0]
        failures = [
            line.strip()[2:].strip()
            for line in segment.strip().splitlines()
            if line.strip().startswith("- ")
        ]
    return result.returncode, failures


def collect_files():
    return sorted(
        [p for p in CONTENT.rglob("*.md")]
        + [p for p in CONTENT.rglob("*.mdx")]
    )


def rel(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def main() -> int:
    argv = sys.argv[1:]
    apply = "--apply" in argv
    targets = [a for a in argv if not a.startswith("--")]
    files = [Path(a).resolve() for a in targets] if targets else collect_files()

    print("模式 " + ("落盘 --apply" if apply else "dry-run（只读，不写文件）"))
    changed_files = 0
    remaining = []
    total_failures = 0
    for path in files:
        text = path.read_text(encoding="utf-8")
        cleaned = clean_text(text, rel(path))
        changed = cleaned != text
        if changed:
            changed_files += 1
            if apply:
                path.write_text(cleaned, encoding="utf-8")
        code, failures = scan_text(cleaned)
        if failures:
            total_failures += len(failures)
            remaining.append((rel(path), code, failures, changed))

    for name, code, failures, changed in remaining:
        flag = "已改" if changed and apply else ("待改" if changed else "未改")
        print(f"\n==== {name}  [{flag}]  清理后剩余 {len(failures)} 条")
        for item in failures:
            print(f"  - {item}")

    print("\n---- 汇总 ----")
    print(f"扫描文件数 {len(files)}")
    print(f"本次有改动的文件数 {changed_files}")
    print(f"清理后仍含 failures 的文件数 {len(remaining)}")
    print(f"清理后 failures 条目总数 {total_failures}")
    if apply:
        print("重复运行本命令应得到 0 改动（幂等）。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
