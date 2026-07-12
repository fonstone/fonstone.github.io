---
title: "体验优化"
description: "综合项目实战 - 体验优化"
date: "2026-07-12"
order: 23007
tags: ["体验优化", "错误信息", "format", "对齐", "Display", "crossterm", "彩色输出"]
est_time: "30 分钟"
---

 <h1 id="改善错误信息">改善错误信息</h1>
<p>上一章的错误信息使用了固定字符串，比如：</p>
<pre><code class="language-rust">.map_err(|_| "任务 ID 无效".to_string())?;</code></pre>
<p>用户看到的错误是：</p>
<pre><code class="language-text">错误: 任务 ID 无效</code></pre>
<p>不知道是哪个输入出了问题。改用 <code>format!</code> 把具体的输入值显示出来，打开 <code>rtodo/src/lib.rs</code>，把 <code>parse_args</code> 里的错误信息更新：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — parse_args() 内，替换 done/remove/_ 分支
[cmd, id] if cmd == "done" =&gt; {
    let id: u32 = id.parse()
        .map_err(|_| format!("'{}' 不是有效的任务 ID", id))?;
    Ok(Command::Done(id))
}

[cmd, id] if cmd == "remove" =&gt; {
    let id: u32 = id.parse()
        .map_err(|_| format!("'{}' 不是有效的任务 ID", id))?;
    Ok(Command::Remove(id))
}

_ =&gt; Err(format!("未知命令：{}", args.join(" "))),</code></pre>
<p>现在用户看到的错误是：</p>
<pre><code class="language-text">错误: 'abc' 不是有效的任务 ID</code></pre>
<p>立刻知道是哪个输入出了问题。<strong>把导致错误的具体值显示出来</strong>，是写错误信息的基本原则。</p>
<p>同理在 <code>add</code> 分支里加上空标题检查：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — parse_args() 内，替换 add 分支
[cmd, title] if cmd == "add" =&gt; {
    if title.is_empty() {
        Err("任务内容不能为空".to_string())
    } else {
        Ok(Command::Add(title.clone()))
    }
}</code></pre>
<p>这里不需要 <code>format!</code>，因为空字符串本身就是问题，没有需要显示的”具体值”。</p>
<h1 id="改善输出格式">改善输出格式</h1>
<h2 id="id-对齐">ID 对齐</h2>
<p>当任务数量超过 9 条，ID 有 1 位和 2 位混用，列表看起来会错位。用 <code>{:&gt;4}</code> 把 ID 右对齐到固定宽度 4。</p>
<p>在 <code>rtodo/src/lib.rs</code> 的 <code>execute</code> 函数里，更新 <code>Command::List</code> 分支：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — execute() 内，替换 Command::List 分支
Command::List =&gt; {
    let todos = list.all();
    if todos.is_empty() {
        println!("暂无任务");
    } else {
        println!("{:&gt;4}  {}  {}", "ID", "状态", "任务");
        println!("{}", "─".repeat(32));
        for todo in todos {
            let status = if todo.completed { "[x]" } else { "[ ]" };
            println!("{:&gt;4}  {}  {}", todo.id, status, todo.title);
        }
    }
}</code></pre>
<p><code>{:&gt;4}</code> 表示右对齐、宽度 4，无论 ID 是 1 位还是 2 位，都会填充空格到相同宽度，列表整齐对齐。</p>
<p><code>Command::Search</code> 分支的打印做同样的更新：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — execute() 内，替换 Command::Search 分支
Command::Search(query) =&gt; {
    let results = list.search(&amp;query);
    if results.is_empty() {
        println!("没有找到包含 \"{}\" 的任务", query);
    } else {
        println!("搜索 \"{}\"，找到 {} 条：", query, results.len());
        println!("{}", "─".repeat(32));
        for todo in results {
            let status = if todo.completed { "[x]" } else { "[ ]" };
            println!("{:&gt;4}  {}  {}", todo.id, status, todo.title);
        }
    }
}</code></pre>
<h2 id="完成的反馈">完成的反馈</h2>
<p><code>Done</code> 分支目前只打印 ID，不够直观。更好的方式是同时显示任务标题。最简单的方案是修改 <code>mark_done</code> 的返回值，把完成后的标题一并返回。</p>
<p>打开 <code>rtodo-core/src/lib.rs</code>，把签名改成返回标题：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl TodoList 内，替换 mark_done
pub fn mark_done(&amp;mut self, id: u32) -&gt; Result&lt;String, String&gt; {
    let todo = self.todos.iter_mut()
        .find(|t| t.id == id)
        .ok_or_else(|| format!("找不到 ID {} 的任务", id))?;

    if todo.completed {
        return Err(format!("任务 [{}] 已经完成了", id));
    }

    todo.completed = true;
    Ok(todo.title.clone())
}</code></pre>
<p>返回 <code>String</code>（标题的克隆），调用方就能打印出来。回到 <code>rtodo/src/lib.rs</code>，更新 <code>Done</code> 分支：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — execute() 内，替换 Command::Done 分支
Command::Done(id) =&gt; {
    let title = list.mark_done(id)?;
    println!("已完成：[{}] {}", id, title);
}</code></pre>
<h2 id="编译验证">编译验证</h2>
<pre><code class="language-bash">cargo build
cargo run -p rtodo -- add "测试对齐效果"
cargo run -p rtodo -- list
cargo run -p rtodo -- done abc</code></pre>
<p>最后一条命令应该输出：<code>错误: 'abc' 不是有效的任务 ID</code>。</p>
<h1 id="规范化输出">规范化输出</h1>
<h2 id="当前的问题">当前的问题</h2>
<p><code>list</code> 和 <code>search</code> 分支里打印任务的格式字符串各写了一份，将来如果要改格式（比如加创建时间），两处都要改，容易遗漏。</p>
<p>更好的做法是让 <code>Todo</code> 自己知道怎么打印自己——实现 <code>fmt::Display</code> trait。</p>
<h2 id="为-todo-实现-display">为 Todo 实现 Display</h2>
<p><code>fmt::Display</code> 对应的是 <code>println!("{}", value)</code> 这种打印方式。在 <code>rtodo-core/src/lib.rs</code> 顶部加上 <code>use std::fmt</code>，然后在 <code>impl Todo</code> 后添加：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — 文件顶部加 use std::fmt，impl Todo 之后添加
use std::fmt;

impl fmt::Display for Todo {
    fn fmt(&amp;self, f: &amp;mut fmt::Formatter&lt;'_&gt;) -&gt; fmt::Result {
        let status = if self.completed { "[✓]" } else { "[ ]" };
        write!(f, "{:&gt;4}  {}  {}", self.id, status, self.title)
    }
}</code></pre>
<p><code>fmt</code> 方法接收一个 <code>Formatter</code>，用 <code>write!(f, ...)</code> 向它写入格式化内容。<code>{:&gt;4}</code> 右对齐 ID，格式集中在一处统一管理。</p>
<h2 id="更新-execute-里的打印">更新 execute 里的打印</h2>
<p>回到 <code>rtodo/src/lib.rs</code>，把 <code>list</code> 和 <code>search</code> 分支里手写的格式字符串替换为直接打印 <code>todo</code>：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — execute() 内，替换 Command::List 和 Command::Search 分支
Command::List =&gt; {
    let todos = list.all();
    if todos.is_empty() {
        println!("暂无任务。使用 `rtodo add \"任务内容\"` 添加。");
    } else {
        println!("{:&gt;4}  {:3}  {}", "ID", "状态", "任务");
        println!("{}", "─".repeat(32));
        for todo in todos {
            println!("{}", todo);
        }
    }
}

Command::Search(query) =&gt; {
    let results = list.search(&amp;query);
    if results.is_empty() {
        println!("没有找到包含 \"{}\" 的任务。", query);
    } else {
        println!("搜索 \"{}\"，找到 {} 条：", query, results.len());
        println!("{}", "─".repeat(32));
        for todo in results {
            println!("{}", todo);
        }
    }
}</code></pre>
<p>打印逻辑从各分支里消失，格式改动只需要修改 <code>Display</code> 实现。</p>
<h1 id="添加彩色输出">添加彩色输出</h1>
<h2 id="引入-crossterm">引入 crossterm</h2>
<p>纯文字输出已经可用，但视觉上缺乏层次。让已完成的任务用绿色显示，能快速区分任务状态。</p>
<p>在 <code>rtodo/Cargo.toml</code> 的 <code>[dependencies]</code> 里添加：</p>
<pre><code class="language-toml"># rtodo/Cargo.toml — [dependencies] 部分添加
[dependencies]
rtodo-core = { path = "../rtodo-core" }
crossterm = "0.28"</code></pre>
<h2 id="封装打印辅助函数">封装打印辅助函数</h2>
<p>在 <code>rtodo/src/lib.rs</code> 顶部加上引入，再添加几个打印辅助函数：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 文件顶部添加
use crossterm::style::Stylize;
use rtodo_core::{Todo, TodoList, data_path};</code></pre>
<pre><code class="language-rust">// rtodo/src/lib.rs — execute() 之后添加
fn print_todo(todo: &amp;Todo) {
    let id_str = format!("{:&gt;4}", todo.id);
    if todo.completed {
        println!("{}  [✓]  {}", id_str.green(), todo.title.as_str().dark_grey());
    } else {
        println!("{}  [ ]  {}", id_str, todo.title);
    }
}</code></pre>
<p>已完成的任务 ID 显示为绿色、标题显示为深灰，给人一种”已归档”的视觉感；未完成的正常显示。</p>
<h2 id="更新-execute-使用颜色">更新 execute 使用颜色</h2>
<p>把 <code>Command::List</code> 分支里的 <code>println!("{}", todo)</code> 替换为 <code>print_todo(todo)</code>，同时加一行统计信息：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — execute() 内，替换 Command::List 分支（带颜色版本）
Command::List =&gt; {
    let todos = list.all();
    if todos.is_empty() {
        println!("{}", "暂无任务。使用 `rtodo add \"任务内容\"` 添加。".dark_grey());
    } else {
        let total = todos.len();
        let done = todos.iter().filter(|t| t.completed).count();

        println!("{:&gt;4}  {:3}  {}", "ID".bold(), "状态".bold(), "任务".bold());
        println!("{}", "─".repeat(32));
        for todo in todos {
            print_todo(todo);
        }
        println!("{}", "─".repeat(32));
        println!(
            "共 {}，已完成 {}，未完成 {}",
            total.to_string().bold(),
            done.to_string().green(),
            (total - done).to_string().yellow()
        );
    }
}</code></pre>
<h1 id="可选扩展">可选扩展</h1>
<p><code>rtodo</code> 现在已经是一个完整可用的工具。如果想继续，以下方向可以进一步扩展：</p>
<p><strong>功能扩展：</strong></p>
<ul>
<li><code>rtodo clear</code> — 清除所有已完成的任务</li>
<li><code>rtodo list --done</code> / <code>--pending</code> — 按状态过滤</li>
<li><code>rtodo edit &lt;id&gt; "新标题"</code> — 修改任务标题</li>
<li>给 <code>Todo</code> 加 <code>created_at</code> 字段，按创建时间排序</li>
</ul>
<p><strong>工程化扩展：</strong></p>
<ul>
<li>把代码拆成模块（<code>src/todo.rs</code>、<code>src/store.rs</code>、<code>src/cli.rs</code>）</li>
<li>用 <code>clap</code> crate 替代手写参数解析，自动生成 <code>--help</code> 和更复杂的参数格式</li>
<li>在 <code>tests/</code> 目录添加集成测试，模拟完整命令调用流程</li>
</ul>
<h2 id="本章总结">本章总结</h2>
<p><code>rtodo</code> 用到的 Rust 知识汇总：</p>
<table><thead><tr><th>章节</th><th>用在了哪里</th></tr></thead><tbody><tr><td>结构体与枚举</td><td><code>Todo</code>、<code>Command</code>、<code>TodoList</code></td></tr><tr><td>所有权与借用</td><td><code>&amp;Todo</code>（只读引用）vs <code>Todo</code>（移交所有权），<code>&amp;mut self</code> 修改方法</td></tr><tr><td>错误处理</td><td><code>Result&lt;_, String&gt;</code>、<code>?</code>、<code>.map_err()</code>、<code>.ok_or_else()</code></td></tr><tr><td>迭代器</td><td><code>.find()</code>、<code>.position()</code>、<code>.filter()</code>、<code>.count()</code>、<code>.max()</code></td></tr><tr><td><code>fmt::Display</code></td><td>统一的任务打印格式</td></tr><tr><td>serde</td><td><code>#[derive(Serialize, Deserialize)]</code> 自动生成 JSON 读写</td></tr><tr><td>文件 I/O</td><td><code>fs::read_to_string</code>、<code>fs::write</code></td></tr><tr><td>单元测试</td><td><code>#[cfg(test)]</code>、<code>#[test]</code>、<code>assert_eq!</code>、<code>assert!</code>、<code>matches!</code></td></tr></tbody></table> 