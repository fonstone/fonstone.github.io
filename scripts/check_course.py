#!/usr/bin/env python3
"""projects/ 课程章节与总纲校验器。

检查项：六个必需 frontmatter 字段齐全且非空、est_time 符合「NN 分钟」、
order 在同一课程内唯一、每门课有 00-index.md、总纲里的站内章节链接
（/projects/... 绝对路径或相对章节链接）指向真实文件、courses.ts 中
每门课的 slug 对应真实目录。输出分「错误」与「警告」，有错误时退出码 1。

用法：
    python scripts/check_course.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ROOT / "projects"
COURSES_TS = ROOT / "src" / "lib" / "constants" / "courses.ts"

REQUIRED = ("title", "description", "date", "tags", "order", "est_time")
EST_TIME_RE = re.compile(r"^\d+ 分钟$")
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")

errors: list[str] = []
warnings: list[str] = []
stats = {
    "course_dirs": 0,
    "chapter_files": 0,
    "index_files": 0,
    "links": 0,
    "broken_links": 0,
    "missing_fields": 0,
    "bad_est_time": 0,
    "dup_orders": 0,
}


def parse_frontmatter(text: str):
    """解析 --- 之间的字段，返回 (字段字典, 错误信息)。"""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None, "缺少 frontmatter 起始分隔线 ---"
    end = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            end = idx
            break
    if end is None:
        return None, "frontmatter 未用 --- 闭合"

    fields: dict[str, str] = {}
    idx = 1
    while idx < end:
        match = re.match(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$", lines[idx])
        if match:
            key, value = match.group(1), match.group(2).strip()
            # 跨行数组：拼到遇到 ] 为止
            if value.startswith("[") and "]" not in value:
                cursor = idx + 1
                while cursor < end:
                    value += " " + lines[cursor].strip()
                    if "]" in lines[cursor]:
                        break
                    cursor += 1
                idx = cursor
            fields[key] = value
        idx += 1
    return fields, ""


def scalar(value: str) -> str:
    return value.strip().strip('"').strip("'").strip()


def nonempty(value: str) -> bool:
    value = scalar(value)
    if not value:
        return False
    if value.startswith("["):
        return bool(value.strip("[] ").strip())
    return True


def rel(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def chapter_candidates(course_slug: str, target: str) -> list[Path]:
    """把总纲链接目标映射为候选文件路径；非章节链接返回空列表。"""
    target = target.strip()
    if not target or target.startswith(("#", "http://", "https://", "mailto:")):
        return []
    if target.startswith(("/knowledge/", "/images/")):
        return []
    if target.rstrip("/") in ("/start", "/projects"):
        return []
    if target.startswith("/projects/"):
        parts = target[len("/projects/"):].split("/")
        if len(parts) < 2 or not parts[1]:
            return []  # /projects/<slug> 课程首页，不是章节
        slug, name = parts[0], parts[1]
    elif target.startswith("/"):
        return []  # 其它站内绝对路径，不是章节
    else:
        slug, name = course_slug, target

    name = name.split("#")[0].split("?")[0]
    if not name:
        return []
    base = PROJECTS / slug
    return [base / (name + suffix) for suffix in ("", ".md", ".mdx")]


def main() -> int:
    if not PROJECTS.is_dir():
        print(f"错误：找不到 {PROJECTS}", file=sys.stderr)
        return 2

    course_dirs = sorted(d for d in PROJECTS.iterdir() if d.is_dir())
    all_files = sorted(
        [p for p in PROJECTS.rglob("*.md")]
        + [p for p in PROJECTS.rglob("*.mdx")]
    )
    stats["course_dirs"] = len(course_dirs)
    stats["chapter_files"] = len(all_files)

    # 1. 每门课有 00-index.md
    for directory in course_dirs:
        if (directory / "00-index.md").is_file():
            stats["index_files"] += 1
        else:
            errors.append(f"课程 {directory.name} 缺少 00-index.md")

    # 2. frontmatter 字段、est_time、order
    orders: dict[str, dict[int, list[str]]] = {}
    for path in all_files:
        fields, err = parse_frontmatter(path.read_text(encoding="utf-8"))
        if fields is None:
            errors.append(f"{rel(path)} frontmatter 解析失败，{err}")
            continue

        missing = [key for key in REQUIRED if key not in fields]
        empty = [key for key in REQUIRED if key in fields and not nonempty(fields[key])]
        if missing:
            stats["missing_fields"] += len(missing)
            errors.append(f"{rel(path)} 缺少必需字段 {'、'.join(missing)}")
        if empty:
            stats["missing_fields"] += len(empty)
            errors.append(f"{rel(path)} 必需字段为空 {'、'.join(empty)}")

        if "est_time" in fields:
            est = scalar(fields["est_time"])
            if not EST_TIME_RE.match(est):
                stats["bad_est_time"] += 1
                errors.append(f"{rel(path)} est_time 不符合「NN 分钟」，实际 {est!r}")

        raw_order = scalar(fields.get("order", ""))
        course = path.parent.name
        try:
            order: int | None = int(raw_order)
        except ValueError:
            errors.append(f"{rel(path)} order 不是整数，实际 {raw_order!r}")
            order = None
        if order is not None:
            orders.setdefault(course, {}).setdefault(order, []).append(rel(path))

    # 3. order 同课程内唯一
    for course, by_order in sorted(orders.items()):
        for order, paths in sorted(by_order.items()):
            if len(paths) > 1:
                stats["dup_orders"] += 1
                errors.append(
                    f"课程 {course} 的 order={order} 重复，{'、'.join(paths)}"
                )

    # 4. 总纲链接
    linked: dict[str, set[str]] = {}
    for directory in course_dirs:
        index = directory / "00-index.md"
        if not index.is_file():
            continue
        text = index.read_text(encoding="utf-8")
        seen: set[str] = set()
        duplicates: set[str] = set()
        broken_samples: list[str] = []
        broken_count = 0
        for match in LINK_RE.finditer(text):
            target = match.group(1)
            candidates = chapter_candidates(directory.name, target)
            if not candidates:
                continue
            stats["links"] += 1
            if target in seen:
                duplicates.add(target)
            seen.add(target)
            existing = next((c for c in candidates if c.is_file()), None)
            if existing is None:
                broken_count += 1
                if len(broken_samples) < 3:
                    broken_samples.append(target)
            else:
                linked.setdefault(directory.name, set()).add(existing.as_posix())

        stats["broken_links"] += broken_count
        if broken_count:
            suffix = "，示例 " + "、".join(broken_samples) if broken_samples else ""
            errors.append(
                f"{rel(index)} 有 {broken_count} 条章节链接指向不存在的文件{suffix}"
            )
        if duplicates:
            warnings.append(
                f"{rel(index)} 有 {len(duplicates)} 个章节链接重复，"
                f"示例 {'、'.join(sorted(duplicates)[:3])}"
            )

        chapter_files = [
            p for p in all_files if p.parent == directory and p.name != "00-index.md"
        ]
        unlinked = [
            p for p in chapter_files
            if p.as_posix() not in linked.get(directory.name, set())
        ]
        if unlinked:
            warnings.append(
                f"课程 {directory.name} 有 {len(unlinked)} 个章节未被 00-index.md 链接"
                f"，示例 {'、'.join(rel(p) for p in unlinked[:3])}"
            )

        nums = sorted(n for n in orders.get(directory.name, {}) if n > 0)
        if nums:
            gaps = [n for n in range(1, max(nums) + 1) if n not in nums]
            if gaps:
                warnings.append(
                    f"课程 {directory.name} 的 order 有 {len(gaps)} 个缺口，示例 {gaps[:6]}"
                )

    # 5. courses.ts 中的 slug 对应真实目录
    ts_text = COURSES_TS.read_text(encoding="utf-8")
    start = ts_text.find("export const COURSES")
    end = ts_text.find("\n];", start) if start != -1 else -1
    segment = ts_text[start:end] if start != -1 and end != -1 else ""
    slugs = re.findall(r'\bslug:\s*"([^"]+)"', segment)
    for slug in slugs:
        if not (PROJECTS / slug).is_dir():
            errors.append(
                f"courses.ts 中的课程 slug {slug!r} 在 projects/ 下没有对应目录"
            )
    declared = set(slugs)
    for directory in course_dirs:
        if directory.name not in declared:
            warnings.append(
                f"projects/ 下的目录 {directory.name} 未在 courses.ts 的 COURSES 中声明"
            )

    # 输出
    print(
        f"扫描 projects/：{len(course_dirs)} 门课，"
        f"{len(all_files)} 个章节文件（含 {stats['index_files']} 份 00-index.md）"
    )
    print(f"courses.ts 中声明的课程 slug {len(slugs)} 个：{'、'.join(slugs)}")
    print()
    print(f"==== 错误 {len(errors)} ====")
    for item in errors:
        print(f"- {item}")
    print()
    print(f"==== 警告 {len(warnings)} ====")
    for item in warnings:
        print(f"- {item}")
    print()
    print("==== 统计 ====")
    print(f"总纲章节链接 {stats['links']} 条，断链 {stats['broken_links']} 条")
    print(
        f"字段缺失或为空 {stats['missing_fields']} 处，"
        f"est_time 格式不符 {stats['bad_est_time']} 处，"
        f"order 重复 {stats['dup_orders']} 处"
    )
    if errors:
        print(f"\n结论：发现 {len(errors)} 个错误，退出码 1")
        return 1
    print("\n结论：无错误，退出码 0")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
