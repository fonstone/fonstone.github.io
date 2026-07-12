import re
import os
from pathlib import Path

SOURCE_DIR = Path(r"D:\00 Work\ai-web\rust_learning\src\content\lessons")
TARGET_DIR = Path(r"D:\00 Work\fonstone\fonstone.github.io\projects\rust-learning")

os.makedirs(TARGET_DIR, exist_ok=True)

lesson_files = sorted(SOURCE_DIR.rglob("*.md"))

chapter_names = {
    "00-preface": "前言",
    "01-rust-basics": "Rust 基础",
    "02-basic-syntax": "基本语法",
    "03-ownership": "所有权系统",
    "04-custom-types": "自定义类型",
    "05-stdlib-types": "标准库类型",
    "06-type-system": "类型系统进阶",
    "07-modules": "模块系统",
    "08-engineering": "工程化",
    "09-error-handling": "错误处理",
    "10-generics-traits": "泛型与 trait",
    "11-lifetimes": "生命周期",
    "12-closures-iterators": "闭包与迭代器",
    "13-smart-pointers": "智能指针",
    "14-concurrency": "并发编程",
    "15-testing": "测试",
    "16-debugging": "调试",
    "17-methodology": "编程方法论",
    "18-unsafe": "Unsafe Rust",
    "19-c-interop": "C 互操作",
    "20-embedded": "嵌入式 Rust",
    "21-proc-macros": "过程宏",
    "22-advanced": "高级主题",
    "23-projects": "综合项目实战",
}

CHAPTER_ORDER = {
    "00-preface": 0,
    "01-rust-basics": 1,
    "02-basic-syntax": 2,
    "03-ownership": 3,
    "04-custom-types": 4,
    "05-stdlib-types": 5,
    "06-type-system": 6,
    "07-modules": 7,
    "08-engineering": 8,
    "09-error-handling": 9,
    "10-generics-traits": 10,
    "11-lifetimes": 11,
    "12-closures-iterators": 12,
    "13-smart-pointers": 13,
    "14-concurrency": 14,
    "15-testing": 15,
    "16-debugging": 16,
    "17-methodology": 17,
    "18-unsafe": 18,
    "19-c-interop": 19,
    "20-embedded": 20,
    "21-proc-macros": 21,
    "22-advanced": 22,
    "23-projects": 23,
}

lesson_order = {}
all_lessons = []

for fpath in lesson_files:
    rel = fpath.relative_to(SOURCE_DIR)
    parts = rel.parts
    chapter_dir = parts[0]
    fname = parts[-1]

    raw = fpath.read_text(encoding="utf-8")

    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", raw, re.DOTALL)
    if not fm_match:
        print(f"SKIP (no frontmatter): {rel}")
        continue
    fm_text = fm_match.group(1)

    title = re.search(r'^title:\s*"(.*)"', fm_text, re.MULTILINE)
    title = title.group(1) if title else fname.replace(".md", "")

    desc = re.search(r'^title:\s*"(.*)"', fm_text, re.MULTILINE)
    desc_text = f"{chapter_names.get(chapter_dir, chapter_dir)} - {title}"

    tags = re.search(r'^tags:\s*\[(.*)\]', fm_text, re.MULTILINE)
    if tags:
        tag_list = [t.strip().strip('"') for t in tags.group(1).split(",")]
    else:
        tag_list = ["Rust"]

    duration = re.search(r'^duration:\s*"(.*)"', fm_text, re.MULTILINE)
    est_time = duration.group(1) if duration else "15 分钟"

    # lesson number within chapter
    lid_match = re.search(r'^lessonId:\s*"(.*)"', fm_text, re.MULTILINE)
    lid = lid_match.group(1) if lid_match else fname.replace(".md", "")

    num_match = re.search(r'^number:\s*"(.*)"', fm_text, re.MULTILINE)
    num_str = num_match.group(1) if num_match else ""

    ch_num = CHAPTER_ORDER.get(chapter_dir, 99)
    order_key = ch_num * 1000

    try:
        seg_num = int(lid.split("-")[0]) if lid.split("-")[0].isdigit() else 0
        order_key += seg_num
    except (ValueError, IndexError):
        order_key += 0

    lesson_order[rel] = order_key
    all_lessons.append((order_key, rel, fpath, raw, fm_match, title, desc_text, tag_list, est_time, num_str))

all_lessons.sort(key=lambda x: x[0])

# write a lesson index file per chapter
from collections import defaultdict
chapter_files = defaultdict(list)
for item in all_lessons:
    order_key, rel, fpath, raw, fm_match, title, desc_text, tag_list, est_time, num_str = item
    parts = rel.parts
    chapter_dir = parts[0]
    chapter_files[chapter_dir].append(item)

# Build slug: chapter-order + lesson-slug
slug_index = {}
for item in all_lessons:
    order_key, rel, fpath, raw, fm_match, title, desc_text, tag_list, est_time, num_str = item
    parts = rel.parts
    chapter_dir = parts[0]
    fname = parts[-1]
    lid = fname.replace(".md", "")

    ch_num = CHAPTER_ORDER.get(chapter_dir, 99)
    # Use a simple slug
    slug = f"ch{ch_num:02d}-{lid}"
    slug_index[rel] = slug

for item in all_lessons:
    order_key, rel, fpath, raw, fm_match, title, desc_text, tag_list, est_time, num_str = item
    parts = rel.parts
    chapter_dir = parts[0]
    fname = parts[-1]

    slug = slug_index[rel]

    body = raw[fm_match.end():]

    # Remove <div id="article-content"> and </div>
    body = re.sub(r'<div\s+id="article-content">', "", body)
    body = re.sub(r'</div>\s*$', "", body)

    # Remove quiz elements
    body = re.sub(r'<div class="quiz-choice".*?</div>', "", body, flags=re.DOTALL)

    # Remove empty quiz placeholder divs
    body = re.sub(r'<div class="quiz-placeholder">.*?</div>', "", body, flags=re.DOTALL)

    # Fix image paths: /RustCourse/diagrams/... -> /images/rust/...
    body = re.sub(r'/RustCourse/diagrams/', '/images/rust/', body)
    body = re.sub(r'/RustCourse/images/', '/images/rust/', body)

    # Clean up excessive blank lines
    body = re.sub(r'\n{4,}', '\n\n\n', body)

    # Build new frontmatter
    desc_line = f"\"{desc_text}\""
    tags_str = ", ".join(f'"{t}"' for t in tag_list)
    new_fm = f"""---
title: "{title}"
description: {desc_line}
date: "2026-07-12"
order: {order_key}
tags: [{tags_str}]
est_time: "{est_time}"
---

"""

    content = new_fm + body
    target_file = TARGET_DIR / f"{slug}.md"
    target_file.write_text(content, encoding="utf-8")
    print(f"OK: {slug}.md <- {rel}")

print(f"\nTotal: {len(all_lessons)} files converted")
