import re
import os
from html.parser import HTMLParser
from pathlib import Path

SOURCE_DIR = Path(r"D:\00 Work\ai-web\rust_learning\src\content\lessons")
TARGET_DIR = Path(r"D:\00 Work\fonstone\fonstone.github.io\projects\rust-learning")

class HtmlToMarkdown(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lines = []
        self.line = ""
        self.in_pre = False
        self.pre_lang = ""
        self.pre_content = ""
        self.in_code = False
        self.in_strong = False
        self.in_li = False
        self.in_blockquote = False
        self.in_table = False
        self.in_th = False
        self.in_td = False
        self.in_a = False
        self.a_href = ""
        self.a_text = ""
        self.in_h = False
        self.h_level = 0
        self.skip_tag = False
        self.skip_depth = 0
        self.td_content = []
        self.table_rows = []
        self.current_row = []
        self.is_header = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if self.skip_depth > 0:
            if tag in ("div", "figure"):
                self.skip_depth += 1
            return

        if tag == "div" and "id" in attrs_dict and attrs_dict["id"] == "article-content":
            return
        if tag == "div" and "class" in attrs_dict and "quiz" in attrs_dict.get("class", ""):
            self.skip_tag = True
            self.skip_depth = 1
            return
        if tag == "div" and "class" in attrs_dict and "quiz-placeholder" in attrs_dict.get("class", ""):
            self.skip_tag = True
            self.skip_depth = 1
            return
        if tag in ("script", "style"):
            self.skip_tag = True
            return

        if tag == "pre":
            self.in_pre = True
            # look for language
            for k, v in attrs:
                if k == "class" and v and v.startswith("language-"):
                    self.pre_lang = v.replace("language-", "")
            return
        if tag == "code" and not self.in_pre:
            self.in_code = True
            return
        if tag in ("strong", "b"):
            self.in_strong = True
            return
        if tag == "br":
            self.line += "\n"
            return
        if tag == "hr":
            self.lines.append("---")
            return
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.in_h = True
            self.h_level = int(tag[1])
            self.flush_line()
            self.line = "#" * self.h_level + " "
            return
        if tag == "p":
            self.flush_line()
            return
        if tag == "ul":
            self.flush_line()
            return
        if tag == "ol":
            self.flush_line()
            return
        if tag == "li":
            self.flush_line()
            self.line = "- "
            self.in_li = True
            return
        if tag == "blockquote":
            self.flush_line()
            self.in_blockquote = True
            return
        if tag == "a":
            self.in_a = True
            self.a_href = ""
            self.a_text = ""
            for k, v in attrs:
                if k == "href":
                    self.a_href = v
            return
        if tag == "img":
            src = ""
            alt = ""
            for k, v in attrs:
                if k == "src":
                    src = v
                if k == "alt":
                    alt = v
            src = src.replace("/RustCourse/diagrams/", "/images/rust/")
            src = src.replace("/RustCourse/images/", "/images/rust/")
            self.line += f"![{alt}]({src})"
            return
        if tag == "table":
            self.in_table = True
            self.table_rows = []
            return
        if tag == "thead":
            self.is_header = True
            return
        if tag == "tbody":
            self.is_header = False
            return
        if tag == "tr":
            self.current_row = []
            return
        if tag in ("th", "td"):
            if tag == "th":
                self.in_th = True
            else:
                self.in_td = True
            return

    def handle_endtag(self, tag):
        if self.skip_depth > 0:
            if tag == "div":
                self.skip_depth -= 1
                if self.skip_depth == 0:
                    self.skip_tag = False
            return

        if tag in ("script", "style"):
            self.skip_tag = False
            return

        if tag == "pre":
            self.in_pre = False
            lang = self.pre_lang or ""
            self.lines.append(f"```{lang}")
            self.lines.append(self.pre_content.rstrip("\n"))
            self.lines.append("```")
            self.lines.append("")
            self.pre_content = ""
            self.pre_lang = ""
            return
        if tag == "code" and not self.in_pre:
            self.in_code = False
            return
        if tag in ("strong", "b"):
            self.in_strong = False
            return
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.in_h = False
            self.flush_line()
            self.lines.append("")
            return
        if tag == "p":
            self.flush_line()
            self.lines.append("")
            return
        if tag == "li":
            self.in_li = False
            self.flush_line()
            return
        if tag in ("ul", "ol"):
            self.flush_line()
            self.lines.append("")
            return
        if tag == "blockquote":
            self.in_blockquote = False
            self.flush_line()
            self.lines.append("")
            return
        if tag == "a":
            self.in_a = False
            if self.a_href:
                self.line += f"[{self.a_text}]({self.a_href})"
            else:
                self.line += self.a_text
            return
        if tag == "table":
            self.in_table = False
            self.flush_table()
            return
        if tag == "thead":
            self.is_header = False
            return
        if tag == "tr":
            if self.current_row:
                self.table_rows.append(list(self.current_row))
            self.current_row = []
            return
        if tag in ("th", "td"):
            if tag == "th":
                self.in_th = False
            else:
                self.in_td = False
            return

    def handle_data(self, data):
        if self.skip_depth > 0 or self.skip_tag:
            return

        if self.in_pre:
            self.pre_content += data
            return

        if self.in_a:
            self.a_text += data
            return

        if self.in_th or self.in_td:
            self.current_row.append(data.strip())
            return

        if self.in_blockquote:
            self.line += data
            return

        if self.in_code:
            self.line += f"`{data}`"
            return

        if self.in_strong:
            self.line += f"**{data}**"
            return

        self.line += data

    def flush_line(self):
        line = self.line.strip()
        if not line:
            self.line = ""
            return
        if self.in_blockquote:
            for l in line.split("\n"):
                self.lines.append(f"> {l}")
        else:
            self.lines.append(line)
        self.line = ""

    def flush_table(self):
        if not self.table_rows:
            return
        # find max cols
        max_cols = max(len(r) for r in self.table_rows)
        # header row
        if self.table_rows:
            self.lines.append("| " + " | ".join(r.ljust(15) for r in self.table_rows[0]) + " |")
            # separator
            self.lines.append("| " + " | ".join("-" * 15 for _ in self.table_rows[0]) + " |")
            for row in self.table_rows[1:]:
                padded = [r.ljust(15) for r in row]
                while len(padded) < len(self.table_rows[0]):
                    padded.append("".ljust(15))
                self.lines.append("| " + " | ".join(padded) + " |")
        self.lines.append("")

    def get_markdown(self):
        result = []
        for line in self.lines:
            if self.in_blockquote and line.startswith("> "):
                result.append(line)
            else:
                result.append(line)
        text = "\n".join(result)
        text = re.sub(r'\n{4,}', '\n\n\n', text)
        return text.strip()


def convert_file(filepath):
    raw = filepath.read_text(encoding="utf-8")
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", raw, re.DOTALL)
    if not fm_match:
        return None, None, None
    
    fm_text = fm_match.group(1)
    body = raw[fm_match.end():]
    
    # Remove article-content wrapper
    body = re.sub(r'<div\s+id="article-content">', "", body)
    body = re.sub(r'</div>\s*$', "", body)
    
    # Remove quiz elements entirely (with content)
    body = re.sub(r'<div class="quiz-choice".*?</div>', "", body, flags=re.DOTALL)
    body = re.sub(r'<div class="quiz-placeholder">.*?</div>', "", body, flags=re.DOTALL)
    body = re.sub(r'<h2[^>]*>练习题.*?</h2>', "", body, flags=re.DOTALL)
    
    # Extract metadata
    title_m = re.search(r'^title:\s*"(.*)"', fm_text, re.MULTILINE)
    title = title_m.group(1) if title_m else ""
    
    # Convert HTML to Markdown
    parser = HtmlToMarkdown()
    parser.feed(body)
    markdown = parser.get_markdown()
    
    return title, markdown, fm_text


# Define 12 chapters: (slug, title, description, tags, order, source_chapters)
CHAPTERS = [
    {
        "slug": "01-rust-intro",
        "title": "Rust 简介与环境搭建",
        "description": "了解 Rust 的设计哲学、核心优势与适用范围，完成开发环境安装配置，运行第一个 Rust 程序",
        "tags": ["Rust简介", "安装", "环境配置", "Cargo"],
        "order": 1,
        "dirs": ["00-preface", "01-rust-basics"],
        "source_title": "",
    },
    {
        "slug": "02-basic-syntax",
        "title": "基本语法",
        "description": "注释、格式化输出、数据类型、变量与可变性、控制流、函数、属性与宏",
        "tags": ["语法", "变量", "控制流", "函数"],
        "order": 2,
        "dirs": ["02-basic-syntax"],
        "source_title": "",
    },
    {
        "slug": "03-ownership",
        "title": "所有权系统",
        "description": "理解栈与堆、所有权规则、移动语义、引用与借用、切片类型",
        "tags": ["所有权", "借用", "引用", "切片"],
        "order": 3,
        "dirs": ["03-ownership"],
        "source_title": "",
    },
    {
        "slug": "04-custom-types",
        "title": "自定义类型",
        "description": "结构体、方法语法、枚举、模式匹配、Option 类型、常量",
        "tags": ["结构体", "枚举", "模式匹配", "Option"],
        "order": 4,
        "dirs": ["04-custom-types"],
        "source_title": "",
    },
    {
        "slug": "05-stdlib-type-system",
        "title": "标准库类型与类型系统",
        "description": "Vector、String、HashMap，类型推断与转换、类型别名、newtype 模式",
        "tags": ["Vector", "String", "HashMap", "类型系统"],
        "order": 5,
        "dirs": ["05-stdlib-types", "06-type-system"],
        "source_title": "",
    },
    {
        "slug": "06-modules-engineering",
        "title": "模块与工程化",
        "description": "包与 crate、模块系统、路径与 use、workspace、构建脚本、文档注释",
        "tags": ["模块", "Crate", "Workspace", "文档"],
        "order": 6,
        "dirs": ["07-modules", "08-engineering"],
        "source_title": "",
    },
    {
        "slug": "07-error-handling",
        "title": "错误处理",
        "description": "panic! 宏、Result 类型、? 运算符、多种错误类型处理、何时该 panic",
        "tags": ["错误处理", "panic", "Result", "错误传播"],
        "order": 7,
        "dirs": ["09-error-handling"],
        "source_title": "",
    },
    {
        "slug": "08-generics-traits-lifetimes",
        "title": "泛型、trait 与生命周期",
        "description": "泛型语法、trait 定义与实现、trait bound、From/Into 等转换 trait、生命周期标注与省略规则",
        "tags": ["泛型", "Trait", "生命周期", "Trait Bound"],
        "order": 8,
        "dirs": ["10-generics-traits", "11-lifetimes"],
        "source_title": "",
    },
    {
        "slug": "09-closures-iterators-smart-pointers",
        "title": "闭包、迭代器与智能指针",
        "description": "闭包语法与捕获、Fn trait、迭代器与适配器、Box、Deref/Drop、Rc、RefCell",
        "tags": ["闭包", "迭代器", "智能指针", "Box"],
        "order": 9,
        "dirs": ["12-closures-iterators", "13-smart-pointers"],
        "source_title": "",
    },
    {
        "slug": "10-concurrency",
        "title": "并发编程",
        "description": "线程创建与控制、消息传递（Channel）、共享状态（Mutex）、Sync 与 Send trait",
        "tags": ["并发", "线程", "Channel", "Mutex"],
        "order": 10,
        "dirs": ["14-concurrency"],
        "source_title": "",
    },
    {
        "slug": "11-testing-debugging",
        "title": "测试、调试与编程方法论",
        "description": "单元测试与集成测试、测试控制、dbg! 宏、日志、代码架构、lint、CI、性能分析",
        "tags": ["测试", "调试", "Lint", "CI"],
        "order": 11,
        "dirs": ["15-testing", "16-debugging", "17-methodology"],
        "source_title": "",
    },
    {
        "slug": "12-advanced-topics",
        "title": "高级主题",
        "description": "Unsafe Rust、FFI 与 C 互操作、嵌入式 Rust 基础、过程宏",
        "tags": ["Unsafe", "FFI", "嵌入式", "过程宏"],
        "order": 12,
        "dirs": ["18-unsafe", "19-c-interop", "20-embedded", "21-proc-macros"],
        "source_title": "",
    },
]


def get_ordered_files(chapter_dirs):
    files = []
    for cd in chapter_dirs:
        d = SOURCE_DIR / cd
        if not d.exists():
            continue
        for f in sorted(d.iterdir()):
            if f.suffix == ".md":
                files.append(f)
    return files


os.makedirs(TARGET_DIR, exist_ok=True)

# First pass: read all source files
all_content = {}
for fpath in sorted(SOURCE_DIR.rglob("*.md")):
    if fpath.name.startswith("."):
        continue
    rel = fpath.relative_to(SOURCE_DIR)
    title, markdown, fm = convert_file(fpath)
    if markdown:
        all_content[rel] = {"title": title, "content": markdown, "path": fpath}

# Build chapter content
for ch in CHAPTERS:
    slug = ch["slug"]
    dirs = ch["dirs"]
    
    all_parts = []
    titles = []
    for cd in dirs:
        d = SOURCE_DIR / cd
        if not d.exists():
            print(f"  WARN: dir not found: {cd}")
            continue
        for f in sorted(d.iterdir()):
            if f.suffix != ".md":
                continue
            rel = f.relative_to(SOURCE_DIR)
            if rel in all_content:
                item = all_content[rel]
                if item["title"]:
                    titles.append(item["title"])
                content = item["content"]
                if content:
                    all_parts.append(content)
    
    # Merge content, deduplicate headings
    merged = []
    seen_heads = set()
    for part in all_parts:
        lines = part.split("\n")
        for line in lines:
            # Deduplicate top-level headings
            if line.startswith("# ") and line in seen_heads:
                continue
            if line.startswith("# "):
                seen_heads.add(line)
            merged.append(line)
    
    final_content = "\n".join(merged)
    
    # Build description for first file
    descriptions = []
    for cd in dirs:
        d = SOURCE_DIR / cd
        if d.exists():
            for f in sorted(d.iterdir()):
                if f.suffix != ".md":
                    continue
                rel = f.relative_to(SOURCE_DIR)
                if rel in all_content:
                    t = all_content[rel]["title"]
                    if t and t not in descriptions:
                        descriptions.append(t)
    
    desc = "、".join(descriptions[:5])
    if len(descriptions) > 5:
        desc += " 等"
    
    tags_str = ", ".join(f'"{t}"' for t in ch["tags"])
    order = ch["order"]
    chapter_title = ch["title"]
    
    fm_block = f"""---
title: "{chapter_title}"
description: "{ch["description"]}"
date: "2026-07-12"
order: {order}
tags: [{tags_str}]
est_time: "60 分钟"
---

"""
    output = fm_block + final_content
    target = TARGET_DIR / f"{slug}.md"
    target.write_text(output, encoding="utf-8")
    
    # Count subsections
    h2_count = len(re.findall(r'\n## ', final_content))
    print(f"  {slug}.md: ~{len(final_content)} chars, {h2_count} sections")

# Remove old chXX- files
for f in TARGET_DIR.glob("ch*.md"):
    f.unlink()
    print(f"  Removed: {f.name}")

print("\nDone! 12 chapters written.")
