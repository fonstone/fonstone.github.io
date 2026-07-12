---
title: "解析命令行参数"
description: "综合项目实战 - 解析命令行参数"
date: "2026-07-12"
order: 23002
tags: ["命令行参数", "枚举", "模式匹配", "args", "Result", "lib.rs"]
est_time: "25 分钟"
---

 <h1 id="定义-command-枚举">定义 Command 枚举</h1>
<p>在写任何代码之前，先想清楚用户怎么使用这个工具：</p>
<pre><code class="language-bash">rtodo add "写代码"       # 第一个参数是命令名，第二个是内容
rtodo list              # 只有命令名，没有额外参数
rtodo done 1            # 第二个参数是任务 ID
rtodo remove 2          # 第二个参数是任务 ID
rtodo search "Rust"     # 第二个参数是搜索关键词
rtodo help              # 显示帮助</code></pre>
<p>程序拿到这些参数后，需要先判断用户想做什么，再去执行。这个”判断”的过程叫<strong>解析</strong>，是这一章的主要内容。</p>
<h2 id="定义枚举">定义枚举</h2>
<p>解析的结果是什么？可以是一个字符串，但更好的做法是用枚举——每个变体精确表达一条命令，并携带它需要的数据。</p>
<p><code>Command</code> 描述的是”用户输入了什么命令”，属于 CLI 层的概念，和业务逻辑没有关系。每个变体只携带自己需要的数据：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 新建此文件，写入以下内容
pub enum Command {
    Add(String),    // 要添加的任务标题
    List,           // 不需要额外数据
    Done(u32),      // 要标记完成的任务 ID
    Remove(u32),    // 要删除的任务 ID
    Search(String), // 要搜索的关键词
    Help,
}</code></pre>
<p><code>Add</code> 需要标题，<code>Done</code> 和 <code>Remove</code> 需要 ID，<code>List</code> 和 <code>Help</code> 不需要任何额外信息。</p>
<p><strong>为什么用枚举而不是直接 match 字符串？</strong></p>
<p>你可以直接 <code>match args[0].as_str() { "add" =&gt; ..., "list" =&gt; ... }</code>，但这样做参数解析和业务逻辑混在一起，一旦参数格式复杂（比如 <code>done</code> 后面没有 ID），错误处理就会散落各处，很难维护。</p>
<p>用枚举的方式，先把原始字符串解析成 <code>Command</code>，再执行——每一步职责清晰，错误统一在解析阶段处理。</p>
<h1 id="搭建骨架">搭建骨架</h1>
<h2 id="规划结构">规划结构</h2>
<p><code>rtodo/src/lib.rs</code> 和 <code>rtodo/src/main.rs</code> 各司其职：</p>
<pre><code class="language-text">rtodo/src/
├── lib.rs    ← Command、parse_args、run（可测试、可被外部引用）
└── main.rs   ← 只负责调用 run()</code></pre>
<p><code>lib.rs</code> 里的代码可以被单独测试和引用；<code>main.rs</code> 保持最小集，不含任何业务代码。</p>
<h2 id="在-librs-里规划函数签名">在 lib.rs 里规划函数签名</h2>
<p>在 <code>Command</code> 定义之后，用 <code>todo!()</code> 占位写出函数签名：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 接着 Command 定义之后写入
/// 把命令行参数切片解析成 Command，格式错误时返回错误描述
pub fn parse_args(args: &amp;[String]) -&gt; Result&lt;Command, String&gt; {
    todo!()
}

/// 程序主逻辑：读取参数、解析命令、执行对应操作
pub fn run() -&gt; Result&lt;(), String&gt; {
    todo!()
}</code></pre>
<p>先把骨架写出来确认接口设计，再逐个填逻辑。</p>
<h2 id="写入入口文件">写入入口文件</h2>
<p>入口文件只做一件事：调用 <code>run()</code>，出错时打印并退出：</p>
<pre><code class="language-rust">// rtodo/src/main.rs — 全文替换为以下内容
fn main() {
    if let Err(e) = rtodo::run() {
        eprintln!("错误: {}", e);
        std::process::exit(1);
    }
}</code></pre>
<p><code>rtodo::run()</code> 用 crate 名直接限定，不需要额外 <code>use</code>。<code>std::process::exit(1)</code> 立即终止进程，向操作系统返回退出码 <code>1</code>——退出码 <code>0</code> 表示成功，非零表示失败，Shell 脚本可以用 <code>$?</code> 读取它。如果只写 <code>return</code>，退出码是 <code>0</code>，调用方会误以为执行成功了。</p>
<p>骨架写好后先编译一次，确认结构没问题（可能有 warning，后续章节会处理）：</p>
<pre><code class="language-bash">cargo build</code></pre>
<h1 id="读取命令行参数">读取命令行参数</h1>
<p>先填 <code>run()</code> 的第一部分：读取原始参数。</p>
<p>Rust 用 <code>std::env::args()</code> 获取命令行参数，它返回一个迭代器，每个元素是一个 <code>String</code>。有一个细节：<strong>第一个参数永远是程序自身的路径</strong>，不是用户输入的内容。比如运行 <code>rtodo add "写代码"</code>，<code>args()</code> 实际返回的是：</p>
<pre><code class="language-text">["/usr/local/bin/rtodo", "add", "写代码"]
  ↑ 第 1 个，程序路径      ↑ 第 2 个  ↑ 第 3 个</code></pre>
<p>所以要用 <code>.skip(1)</code> 跳过第一个。<code>.collect()</code> 把剩余的迭代器收集成 <code>Vec&lt;String&gt;</code>。把 <code>run()</code> 里的 <code>todo!()</code> 替换成：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 替换 run() 中的 todo!()
pub fn run() -&gt; Result&lt;(), String&gt; {
    let args: Vec&lt;String&gt; = std::env::args().skip(1).collect();
    let command = parse_args(&amp;args)?;

    // 后续章节在这里处理 command
    Ok(())
}</code></pre>
<p><code>parse_args(&amp;args)?</code> 调用解析函数，<code>?</code> 把解析失败的错误直接从 <code>run</code> 传播出去，由入口文件打印。</p>
<h1 id="实现-parse_args">实现 parse_args</h1>
<h2 id="先写测试">先写测试</h2>
<p>TDD 的做法是先写测试描述期望的行为，再写实现让测试通过。在 <code>lib.rs</code> 末尾添加测试模块：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 文件末尾添加
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        let result = parse_args(&amp;["add".to_string(), "写代码".to_string()]);
        assert!(matches!(result, Ok(Command::Add(t)) if t == "写代码"));
    }

    #[test]
    fn test_list() {
        let result = parse_args(&amp;["list".to_string()]);
        assert!(matches!(result, Ok(Command::List)));
    }

    #[test]
    fn test_done() {
        let result = parse_args(&amp;["done".to_string(), "1".to_string()]);
        assert!(matches!(result, Ok(Command::Done(1))));
    }

    #[test]
    fn test_done_invalid_id() {
        let result = parse_args(&amp;["done".to_string(), "abc".to_string()]);
        assert!(result.is_err());
    }

    #[test]
    fn test_remove() {
        let result = parse_args(&amp;["remove".to_string(), "2".to_string()]);
        assert!(matches!(result, Ok(Command::Remove(2))));
    }

    #[test]
    fn test_search() {
        let result = parse_args(&amp;["search".to_string(), "Rust".to_string()]);
        assert!(matches!(result, Ok(Command::Search(q)) if q == "Rust"));
    }

    #[test]
    fn test_empty_args_shows_help() {
        let result = parse_args(&amp;[]);
        assert!(matches!(result, Ok(Command::Help)));
    }

    #[test]
    fn test_unknown_command_is_error() {
        let result = parse_args(&amp;["unknown".to_string()]);
        assert!(result.is_err());
    }
}</code></pre>
<p>现在运行测试：</p>
<pre><code class="language-bash">cargo test</code></pre>
<p>所有测试都会失败（<code>todo!()</code> 会 panic），这是正常的——测试先红，再让它变绿。</p>
<h2 id="实现让测试通过">实现让测试通过</h2>
<p>把 <code>parse_args</code> 里的 <code>todo!()</code> 替换成：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 替换 parse_args() 中的 todo!()
pub fn parse_args(args: &amp;[String]) -&gt; Result&lt;Command, String&gt; {
    match args {
        [cmd, title] if cmd == "add" =&gt; {
            Ok(Command::Add(title.clone()))
        }

        [cmd] if cmd == "list" =&gt; Ok(Command::List),

        [cmd, id] if cmd == "done" =&gt; {
            let id: u32 = id.parse()
                .map_err(|_| "任务 ID 无效".to_string())?;
            Ok(Command::Done(id))
        }

        [cmd, id] if cmd == "remove" =&gt; {
            let id: u32 = id.parse()
                .map_err(|_| "任务 ID 无效".to_string())?;
            Ok(Command::Remove(id))
        }

        [cmd, keyword] if cmd == "search" =&gt; {
            Ok(Command::Search(keyword.clone()))
        }

        [] =&gt; Ok(Command::Help),
        [cmd] if cmd == "help" =&gt; Ok(Command::Help),

        _ =&gt; Err("未知命令".to_string()),
    }
}</code></pre>
<p>函数接受 <code>&amp;[String]</code> 切片引用，而不是 <code>Vec&lt;String&gt;</code>——函数只需要读取数据，不需要拥有它，借用切片即可。</p>
<p>模式 <code>[cmd, title] if cmd == "add"</code> 叫<strong>带守卫的切片模式</strong>：<code>[cmd, title]</code> 要求参数数量恰好是两个，<code>if cmd == "add"</code> 要求第一个参数的值是 <code>"add"</code>，两个条件同时满足才匹配。</p>
<p><code>title.clone()</code> 把借用的字符串复制一份。<code>parse_args</code> 接受的是借用（<code>&amp;[String]</code>），<code>title</code> 是从中取出的引用，而 <code>Command::Add(String)</code> 需要拥有所有权的 <code>String</code>，不能直接把引用放进去，所以要 <code>.clone()</code> 复制一份。</p>
<p><code>.parse()</code> 把字符串转成 <code>u32</code>，可能失败（比如用户输入 <code>"abc"</code>），<code>.map_err(|_| ...)</code> 把解析错误转成 <code>String</code>，<code>?</code> 传播出去。错误信息暂时用简单的固定字符串，后面优化章节会改成包含具体值的 <code>format!</code>。</p>
<p>再跑一次测试，确认全部通过：</p>
<pre><code class="language-bash">cargo test</code></pre>
<p>所有测试绿了说明实现正确。<code>cargo build</code> 此时编译器还会报 <strong>unused variable</strong> 警告（<code>command</code> 在 <code>run()</code> 里还没用到），后续章节自然消除。</p> 