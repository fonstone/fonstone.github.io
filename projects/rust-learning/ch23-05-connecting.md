---
title: "接入 run 函数"
description: "综合项目实战 - 接入 run 函数"
date: "2026-07-12"
order: 23005
tags: ["命令分发", "run函数", "execute", "TDD", "cargo run"]
est_time: "20 分钟"
---

 <h1 id="提取-execute-函数">提取 execute 函数</h1>
<p><code>run()</code> 目前的结构是：读参数 → 解析 → 执行。“执行”这一步涉及所有业务逻辑，也是最需要测试的部分。但 <code>run()</code> 本身直接调用 <code>std::env::args()</code>，测试时无法控制输入，不能直接测试。</p>
<p>解决办法是把”执行”单独提取成一个函数：</p>
<pre><code class="language-text">run()
  ├── 读取 args（std::env::args）
  ├── parse_args(&amp;args)  ← 上一章已测过
  └── execute(command, &amp;mut list)  ← 这里放分发逻辑，可以独立测试</code></pre>
<p><code>execute</code> 接受一个已经解析好的 <code>Command</code> 和一个可变的 <code>TodoList</code>，在 <code>rtodo/src/lib.rs</code> 里规划好签名，先用 <code>todo!()</code> 占位：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — run() 定义之后添加
fn execute(command: Command, list: &amp;mut TodoList) -&gt; Result&lt;(), String&gt; {
    todo!()
}</code></pre>
<p>同时把 <code>run()</code> 里的 <code>todo!()</code> 替换成调用结构，先只读参数：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 替换 run() 中的 todo!()
pub fn run() -&gt; Result&lt;(), String&gt; {
    let args: Vec&lt;String&gt; = std::env::args().skip(1).collect();
    let command = parse_args(&amp;args)?;
    let mut list = TodoList::new();
    execute(command, &amp;mut list)
}</code></pre>
<p>还需要在文件顶部引入 <code>TodoList</code>：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 文件顶部，替换原有 use
use rtodo_core::TodoList;</code></pre>
<p>骨架建好后先编译，确认类型没问题：</p>
<pre><code class="language-bash">cargo build</code></pre>
<h1 id="先写测试">先写测试</h1>
<p>在 <code>rtodo/src/lib.rs</code> 里已有一个 <code>mod tests</code>（上一章 <code>parse_args</code> 的测试在那里）。把 <code>execute</code> 的测试追加到<strong>同一个</strong> <code>mod tests</code> 里，不要新建：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 已有的 mod tests 内，追加以下测试函数
    #[test]
    fn test_execute_add() {
        let mut list = TodoList::new();
        execute(Command::Add("写代码".to_string()), &amp;mut list).unwrap();
        assert_eq!(list.all().len(), 1);
        assert_eq!(list.all()[0].title, "写代码");
    }

    #[test]
    fn test_execute_done() {
        let mut list = TodoList::new();
        list.add("任务".to_string());
        execute(Command::Done(1), &amp;mut list).unwrap();
        assert!(list.all()[0].completed);
    }

    #[test]
    fn test_execute_done_not_found() {
        let mut list = TodoList::new();
        assert!(execute(Command::Done(99), &amp;mut list).is_err());
    }

    #[test]
    fn test_execute_remove() {
        let mut list = TodoList::new();
        list.add("任务".to_string());
        execute(Command::Remove(1), &amp;mut list).unwrap();
        assert_eq!(list.all().len(), 0);
    }

    #[test]
    fn test_execute_remove_not_found() {
        let mut list = TodoList::new();
        assert!(execute(Command::Remove(99), &amp;mut list).is_err());
    }

    #[test]
    fn test_execute_list_and_search_ok() {
        let mut list = TodoList::new();
        list.add("学习 Rust".to_string());
        assert!(execute(Command::List, &amp;mut list).is_ok());
        assert!(execute(Command::Search("Rust".to_string()), &amp;mut list).is_ok());
    }</code></pre>
<p>把这六个测试函数写在已有 <code>mod tests</code> 的<strong>闭合 <code>}</code> 之前</strong>，不要在文件末尾再新建一个 <code>mod tests</code>——同一个文件里不能有两个同名模块。</p>
<p>运行，所有测试因 <code>todo!()</code> 而失败：</p>
<pre><code class="language-bash">cargo test -p rtodo</code></pre>
<p>先红后绿——下面填实现。</p>
<h1 id="实现-execute">实现 execute</h1>
<p>把 <code>execute</code> 里的 <code>todo!()</code> 替换成 <code>match command</code>。<code>match</code> 必须覆盖 <code>Command</code> 的<strong>所有</strong>变体，漏掉任何一个编译器都会报错——这是枚举的核心保障。</p>
<p>下面逐个分支填入，最后合并成完整函数。</p>
<h2 id="add-分支">Add 分支</h2>
<p><code>Command::Add(title)</code> 解构出任务标题，调用 <code>list.add()</code> 添加，再打印确认信息：</p>
<pre><code class="language-rust">Command::Add(title) =&gt; {
    let todo = list.add(title);
    println!("已添加：[{}] {}", todo.id, todo.title);
}</code></pre>
<p><code>list.add(title)</code> 返回 <code>&amp;Todo</code>（刚添加那条的引用），直接用来打印 ID 和标题，调用方不需要再去列表里查一次。</p>
<h2 id="list-分支">List 分支</h2>
<p><code>Command::List</code> 没有附带数据，直接取出所有任务打印：</p>
<pre><code class="language-rust">Command::List =&gt; {
    let todos = list.all();
    if todos.is_empty() {
        println!("暂无任务");
    } else {
        for todo in todos {
            let status = if todo.completed { "[x]" } else { "[ ]" };
            println!("[{}] {} {}", todo.id, status, todo.title);
        }
    }
}</code></pre>
<p><code>list.all()</code> 返回 <code>&amp;[Todo]</code> 切片，直接 <code>for todo in todos</code> 迭代。<code>completed</code> 用三元表达式转成字符标记：<code>[x]</code> 表示已完成，<code>[ ]</code> 表示未完成。空列表单独判断，避免打印什么都没有的情况。</p>
<h2 id="done-分支">Done 分支</h2>
<pre><code class="language-rust">Command::Done(id) =&gt; {
    list.mark_done(id)?;
    println!("已完成 {}", id);
}</code></pre>
<p><code>mark_done</code> 返回 <code>Result&lt;(), String&gt;</code>，成功时得到 <code>()</code>，只需要打印 ID，不需要任务数据。<code>?</code> 把找不到任务或已经完成的错误直接传出 <code>execute</code>，最终由 <code>main()</code> 打印。</p>
<h2 id="remove-分支">Remove 分支</h2>
<pre><code class="language-rust">Command::Remove(id) =&gt; {
    let todo = list.remove(id)?;
    println!("已删除：[{}] {}", todo.id, todo.title);
}</code></pre>
<p><code>remove</code> 返回 <code>Result&lt;Todo, String&gt;</code>——把元素从 Vec 里移出，所有权交给 <code>todo</code>。删除后用 <code>todo</code> 打印确认信息，用户能看到删的是哪条，操作更直观。</p>
<h2 id="search-分支">Search 分支</h2>
<pre><code class="language-rust">Command::Search(query) =&gt; {
    let results = list.search(&amp;query);
    if results.is_empty() {
        println!("没有找到包含 \"{}\" 的任务", query);
    } else {
        for todo in results {
            let status = if todo.completed { "[x]" } else { "[ ]" };
            println!("[{}] {} {}", todo.id, status, todo.title);
        }
    }
}</code></pre>
<p><code>search</code> 返回 <code>Vec&lt;&amp;Todo&gt;</code>，元素是对 <code>list</code> 内部数据的引用，不复制数据。搜索结果为空时把关键词也带进提示，用户知道搜的是什么。</p>
<h2 id="help-分支">Help 分支</h2>
<pre><code class="language-rust">Command::Help =&gt; print_help(),</code></pre>
<p>委托给独立函数，<code>execute</code> 本身不含帮助文本，便于日后单独修改。</p>
<h2 id="合并写入">合并写入</h2>
<p>五个分支都理解清楚后，把 <code>execute</code> 完整写入文件：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 替换 execute() 中的 todo!()
fn execute(command: Command, list: &amp;mut TodoList) -&gt; Result&lt;(), String&gt; {
    match command {
        Command::Add(title) =&gt; {
            let todo = list.add(title);
            println!("已添加：[{}] {}", todo.id, todo.title);
        }

        Command::List =&gt; {
            let todos = list.all();
            if todos.is_empty() {
                println!("暂无任务");
            } else {
                for todo in todos {
                    let status = if todo.completed { "[x]" } else { "[ ]" };
                    println!("[{}] {} {}", todo.id, status, todo.title);
                }
            }
        }

        Command::Done(id) =&gt; {
            list.mark_done(id)?;
            println!("已完成 {}", id);
        }

        Command::Remove(id) =&gt; {
            let todo = list.remove(id)?;
            println!("已删除：[{}] {}", todo.id, todo.title);
        }

        Command::Search(query) =&gt; {
            let results = list.search(&amp;query);
            if results.is_empty() {
                println!("没有找到包含 \"{}\" 的任务", query);
            } else {
                for todo in results {
                    let status = if todo.completed { "[x]" } else { "[ ]" };
                    println!("[{}] {} {}", todo.id, status, todo.title);
                }
            }
        }

        Command::Help =&gt; print_help(),
    }

    Ok(())
}</code></pre>
<p>再跑一次测试，确认全绿：</p>
<pre><code class="language-bash">cargo test -p rtodo</code></pre>
<p>在 <code>execute</code> 之后添加 <code>print_help</code>：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — execute() 之后添加
fn print_help() {
    println!("rtodo — 命令行任务管理器");
    println!();
    println!("用法：");
    println!("  rtodo add \"任务内容\"    添加新任务");
    println!("  rtodo list               列出所有任务");
    println!("  rtodo done &lt;id&gt;          标记任务完成");
    println!("  rtodo remove &lt;id&gt;        删除任务");
    println!("  rtodo search \"关键词\"   搜索任务");
    println!("  rtodo help               显示本帮助");
}</code></pre>
<p>再跑测试，确认全绿：</p>
<pre><code class="language-bash">cargo test -p rtodo</code></pre>
<h1 id="编译并运行">编译并运行</h1>
<h2 id="cargo-run-的指令格式">cargo run 的指令格式</h2>
<p>在 workspace 里运行某个 crate，需要这样写：</p>
<pre><code class="language-bash">cargo run -p rtodo -- add "写完教程"
#          ↑           ↑   ↑
#          指定 crate   │   传给程序的参数
#                       │
#                      "--" 是分隔符</code></pre>
<p><code>-p rtodo</code> 告诉 cargo 运行哪个 crate（workspace 里可能有多个）。<code>--</code> 是 cargo 和程序参数之间的<strong>分隔符</strong>——<code>--</code> 左边的参数属于 cargo 自己，右边的参数原封不动传给程序。不写 <code>--</code> 的话，cargo 会把 <code>add</code> 当成 cargo 自己的子命令，运行会报错。</p>
<h2 id="逐条试验">逐条试验</h2>
<pre><code class="language-bash">cargo run -p rtodo -- add "写完解析章节"
# 已添加：[1] 写完解析章节

cargo run -p rtodo -- add "写完数据建模章节"
# 已添加：[1] 写完数据建模章节</code></pre>
<p>两次 <code>add</code> 打印的 ID 都是 1——每次运行都创建新的空列表，ID 从 1 重新开始。</p>
<pre><code class="language-bash">cargo run -p rtodo -- list
# 暂无任务</code></pre>
<p>刚才添加的任务也看不到，原因相同：内存不持久。</p>
<pre><code class="language-bash">cargo run -p rtodo -- done 1      # 需要先在同一次运行里 add
cargo run -p rtodo -- search "章节"
cargo run -p rtodo -- remove 1
cargo run -p rtodo -- help</code></pre>
<h2 id="验证错误路径">验证错误路径</h2>
<pre><code class="language-bash">cargo run -p rtodo -- done abc
# 错误: 任务 ID 无效

cargo run -p rtodo -- foobar
# 错误: 未知命令

cargo run -p rtodo -- done 99
# 错误: 找不到对应任务</code></pre>
<p>错误信息从 <code>parse_args</code> 或 <code>execute</code> 产生，经 <code>?</code> 传回 <code>run()</code>，再由 <code>main()</code> 里的 <code>eprintln!</code> 打印到标准错误，进程以退出码 1 结束。</p>
<h2 id="当前的局限">当前的局限</h2>
<p>所有命令都能正常执行，但每次运行都从空列表开始——<code>TodoList::new()</code> 只在内存里建列表，进程退出后数据消失。下一章用文件读写解决这个问题。</p> 