---
title: "数据持久化"
description: "综合项目实战 - 数据持久化"
date: "2026-07-12"
order: 23006
tags: ["持久化", "serde_json", "文件读写", "JSON", "错误处理", "PathBuf"]
est_time: "30 分钟"
---

 <h1 id="让-todo-能转成-json">让 Todo 能转成 JSON</h1>
<p>上一章的程序每次运行都从空列表开始，原因是任务只存在内存里，进程结束就消失了。要让数据保留，需要在程序退出前把列表写入文件，下次启动时再读回来。</p>
<p>最直接的格式是 JSON，人类可读，也方便调试。一份持久化后的任务文件长这样：</p>
<pre><code class="language-json">[
  { "id": 1, "title": "写完命令实现章节", "completed": true },
  { "id": 2, "title": "写完持久化章节", "completed": false }
]</code></pre>
<p>要实现这个，需要解决两件事：让 <code>Todo</code> 能自动转成 JSON，以及读写文件。</p>
<h2 id="添加-serde-依赖">添加 serde 依赖</h2>
<p>serde 是 Rust 生态里事实上的序列化标准库，本身只定义”如何转换”的接口；<code>serde_json</code> 是专门处理 JSON 格式的后端。在 <code>rtodo-core/Cargo.toml</code> 的 <code>[dependencies]</code> 里添加：</p>
<pre><code class="language-toml"># rtodo-core/Cargo.toml — [dependencies] 部分添加
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"</code></pre>
<p><code>features = ["derive"]</code> 启用 serde 的 derive 宏功能。不加的话，无法在结构体上写 <code>#[derive(Serialize, Deserialize)]</code>，需要手写大量转换代码。</p>
<h2 id="给-todo-加上序列化-derive">给 Todo 加上序列化 derive</h2>
<p>依赖加好之后，回到 <code>rtodo-core/src/lib.rs</code>，在文件顶部引入 serde，修改 <code>Todo</code> 的定义：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — 文件顶部添加 use，并替换原有 Todo 定义
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Todo {
    pub id: u32,
    pub title: String,
    pub completed: bool,
}</code></pre>
<p>和上一章相比，这里做了两处改动：</p>
<ul>
<li>加了 <code>#[derive(Serialize, Deserialize)]</code>：编译器在编译时自动生成 <code>Todo ↔ JSON</code> 的转换代码，不需要手写任何逻辑</li>
<li>加了 <code>Clone</code>：<code>TodoList</code> 的 <code>load</code> 方法里会用到，一并加上</li>
</ul>
<h1 id="确定存储路径">确定存储路径</h1>
<h2 id="数据文件放在哪里">数据文件放在哪里</h2>
<p>有两种常见选择：</p>
<ul>
<li><strong>当前目录</strong> <code>./todos.json</code>：简单，但在不同目录运行 <code>rtodo</code> 会看到不同的任务列表</li>
<li><strong>用户主目录</strong> <code>~/.rtodo.json</code>：不管在哪个目录运行，都访问同一份数据</li>
</ul>
<p>我们选用户主目录，这更符合任务管理工具的使用习惯。</p>
<h2 id="实现-data_path">实现 data_path</h2>
<p>在 <code>rtodo-core/src/lib.rs</code> 里，在 <code>Todo</code> 定义之后写一个返回数据文件路径的公开函数：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — Todo 定义之后添加
use std::path::PathBuf;

pub fn data_path() -&gt; PathBuf {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))  // Windows 的主目录变量
        .unwrap_or_else(|_| ".".to_string());        // 找不到就用当前目录

    PathBuf::from(home).join(".rtodo.json")
}</code></pre>
<p>这里用 <code>PathBuf</code> 而不是 <code>String</code> 来表示路径。路径在不同操作系统上分隔符不同（Unix 用 <code>/</code>，Windows 用 <code>\</code>），<code>PathBuf</code> 会自动处理这个差异，<code>.join()</code> 也会使用正确的分隔符拼接。如果用字符串硬拼 <code>home + "/.rtodo.json"</code>，在 Windows 上路径会出错。</p>
<h1 id="给-todolist-加上文件读写">给 TodoList 加上文件读写</h1>
<h2 id="给-todolist-加-path-字段">给 TodoList 加 path 字段</h2>
<p>上一章的 <code>TodoList</code> 只有 <code>todos</code> 字段。现在要加一个 <code>path</code>，记录数据文件的位置：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — 替换原有 TodoList 定义
pub struct TodoList {
    path: PathBuf,
    todos: Vec&lt;Todo&gt;,
}</code></pre>
<p><code>path</code> 是私有字段，外部不能直接改，只能通过 <code>load</code> 方法传入。同时把上一章的 <code>new()</code> 方法删掉，改用 <code>load()</code> 来创建 <code>TodoList</code>。</p>
<h2 id="实现-load">实现 load</h2>
<p><code>load</code> 从文件读取任务列表，文件不存在时返回空列表（第一次运行的正常情况）：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl TodoList 内，替换 new()，添加 load()
pub fn load(path: PathBuf) -&gt; Result&lt;Self, String&gt; {
    let todos = if path.exists() {
        let content = std::fs::read_to_string(&amp;path)
            .map_err(|e| format!("读取文件失败：{}", e))?;
        serde_json::from_str(&amp;content)
            .map_err(|e| format!("解析 JSON 失败：{}", e))?
    } else {
        Vec::new()
    };

    Ok(TodoList { path, todos })
}</code></pre>
<p><code>load</code> 接受 <code>PathBuf</code>（获取所有权），存进 <code>self.path</code>。两个 <code>?</code> 各自负责一种错误：第一个处理文件读取失败（权限不足、路径错误等），第二个处理 JSON 格式损坏（文件被手动编辑乱了）。<code>.map_err(|e| format!(...))</code> 把标准库的错误类型统一转成 <code>String</code>，让调用方不需要处理多种不同的错误类型。</p>
<h2 id="实现-save">实现 save</h2>
<p><code>save</code> 把当前任务列表序列化并写回文件：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl TodoList 内，load 之后添加
pub fn save(&amp;self) -&gt; Result&lt;(), String&gt; {
    let content = serde_json::to_string_pretty(&amp;self.todos)
        .map_err(|e| format!("序列化失败：{}", e))?;
    std::fs::write(&amp;self.path, content)
        .map_err(|e| format!("写入文件失败：{}", e))?;
    Ok(())
}</code></pre>
<p><code>to_string_pretty</code> 生成带缩进的 JSON，文件内容更易于人工查看。<code>fs::write</code> 不需要提前创建文件——文件不存在时自动创建，存在时直接覆盖。</p>
<h1 id="更新测试用例">更新测试用例</h1>
<p><code>TodoList</code> 加了 <code>path</code> 字段后，原来的 <code>TodoList::new()</code> 不再存在——编译器会报错。打开 <code>rtodo-core/src/lib.rs</code>，找到 <code>mod tests</code>，在模块顶部加一个辅助函数替代 <code>new()</code>：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — mod tests 内，use super::* 之后添加
fn empty_list() -&gt; TodoList {
    TodoList {
        path: "/tmp/rtodo_test_nonexistent.json".into(),
        todos: vec![],
    }
}</code></pre>
<p><code>path</code> 是私有字段，只有同一文件的 <code>mod tests</code> 能直接访问它，外部调用方做不到。路径指向一个不存在的文件——测试不会真的读写磁盘，只是给结构体一个合法的 <code>PathBuf</code> 值。</p>
<p>然后把 <code>mod tests</code> 里所有的 <code>TodoList::new()</code> 替换为 <code>empty_list()</code>：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — 替换 mod tests 内所有 TodoList::new()
// 改前：let mut list = TodoList::new();
// 改后：let mut list = empty_list();</code></pre>
<h2 id="更新-rtodo-里的测试">更新 rtodo 里的测试</h2>
<p><code>rtodo/src/lib.rs</code> 里也有一组 <code>execute</code> 的测试，同样用了 <code>TodoList::new()</code>。这里情况不同——<code>rtodo</code> 是另一个 crate，无法直接访问 <code>TodoList</code> 的私有字段，不能用上面那种方式。</p>
<p>但 <code>TodoList::load()</code> 是公开方法，传入一个不存在的路径，它会直接返回空列表：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — mod tests 内，use super::* 之后添加
fn empty_list() -&gt; TodoList {
    TodoList::load("/tmp/rtodo_test_nonexistent.json".into()).unwrap()
}</code></pre>
<p>同样把 <code>mod tests</code> 里所有的 <code>TodoList::new()</code> 替换为 <code>empty_list()</code>，确认所有测试全绿：</p>
<pre><code class="language-bash">cargo test</code></pre>
<h1 id="接入-run-函数">接入 run 函数</h1>
<h2 id="更新引入和-run-函数">更新引入和 run 函数</h2>
<p>回到 <code>rtodo/src/lib.rs</code>，更新顶部的引入，加上 <code>data_path</code>：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 文件顶部，替换原有 use
use rtodo_core::{TodoList, data_path};</code></pre>
<p>在 <code>run</code> 函数里，把 <code>TodoList::new()</code> 换成 <code>TodoList::load(data_path())</code>，并在命令执行完后调用 <code>list.save()</code>：</p>
<pre><code class="language-rust">// rtodo/src/lib.rs — 替换 run() 函数
pub fn run() -&gt; Result&lt;(), String&gt; {
    let args: Vec&lt;String&gt; = std::env::args().skip(1).collect();
    let command = parse_args(&amp;args)?;

    let mut list = TodoList::load(data_path())?;
    execute(command, &amp;mut list)?;

    list.save()?;
    Ok(())
}</code></pre>
<p><code>list.save()</code> 放在 <code>execute</code> <strong>之后</strong>，每次命令执行完都写回文件。</p>
<h2 id="再次运行">再次运行</h2>
<pre><code class="language-bash">cargo run -p rtodo -- add "写完命令实现章节"
cargo run -p rtodo -- add "写完持久化章节"
cargo run -p rtodo -- list
cargo run -p rtodo -- done 1
cargo run -p rtodo -- list</code></pre>
<p>这次再运行 <code>list</code>，上次添加的任务还在。查看 <code>~/.rtodo.json</code>，可以看到完整的 JSON 文件内容。</p>
<p>如果想直接用 <code>rtodo</code> 命令而不是每次写 <code>cargo run</code>，可以编译安装到系统：</p>
<pre><code class="language-bash">cargo install --path rtodo
rtodo add "用原生命令添加任务"</code></pre> 