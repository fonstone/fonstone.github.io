---
title: "项目架构"
description: "综合项目实战 - 项目架构"
date: "2026-07-12"
order: 23001
tags: ["项目架构", "workspace", "lib crate", "bin crate", "设计思路", "分层"]
est_time: "15 分钟"
---

 <h1 id="文件结构搭建">文件结构搭建</h1>
<h2 id="用-workspace-管理两个-crate">用 Workspace 管理两个 crate</h2>
<p><code>rtodo</code> 是一个命令行工具，虽然功能不复杂，出于教学目的，我们将工程做的尽量模块化，不把所有代码堆在一个文件里。真实的小型项目通常按<strong>职责</strong>拆分：</p>
<pre><code class="language-text">rtodo/                       ← workspace 根目录
├── Cargo.toml               ← workspace 配置
│
├── rtodo-core/              ← lib crate：核心数据与逻辑
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs           ← Todo、TodoList
│
└── rtodo/                   ← bin crate：命令行入口
    ├── Cargo.toml
    └── src/
        ├── lib.rs           ← Command、parse_args
        └── main.rs          ← 程序入口（run + main）</code></pre>
<table><thead><tr><th>crate</th><th>类型</th><th>职责</th></tr></thead><tbody><tr><td><code>rtodo-core</code></td><td>lib</td><td>数据结构、业务逻辑、JSON 读写；不依赖 CLI 层</td></tr><tr><td><code>rtodo</code></td><td>lib + bin</td><td><code>lib.rs</code> 定义 Command 并负责参数解析，<code>main.rs</code> 只负责启动</td></tr></tbody></table>
<p>这种拆分方式有一个明显的好处：<strong>核心逻辑与界面逻辑解耦</strong>。如果未来想做一个 TUI 或 Web 界面，只需新增一个 bin crate 来调用同一个 <code>rtodo-core</code>，核心代码不需要动。</p>
<h2 id="搭建文件结构">搭建文件结构</h2>
<h3 id="第一步创建-workspace-根目录">第一步：创建 workspace 根目录</h3>
<p>Workspace 根目录本身<strong>没有</strong> <code>src/</code>，只是一个容器。先建好并进入：</p>
<pre><code class="language-bash">mkdir rtodo &amp;&amp; cd rtodo</code></pre>
<h3 id="第二步创建-lib-crate">第二步：创建 lib crate</h3>
<p>核心逻辑放在 lib crate 里，方便单独测试，未来也容易给其他 bin crate 复用：</p>
<pre><code class="language-bash">cargo new rtodo-core --lib</code></pre>
<p><code>--lib</code> 标志让 cargo 生成 <code>src/lib.rs</code> 而非 <code>src/main.rs</code>。</p>
<h3 id="第三步创建-bin-crate">第三步：创建 bin crate</h3>
<p>命令行入口是一个单独的 bin crate，只负责解析参数和打印输出：</p>
<pre><code class="language-bash">cargo new rtodo</code></pre>
<p>不加标志时默认生成 bin crate（<code>src/main.rs</code>）。<code>lib.rs</code> 需要手动创建：</p>
<pre><code class="language-bash">touch rtodo/src/lib.rs</code></pre>
<h3 id="第四步在根目录创建-cargotoml">第四步：在根目录创建 <code>Cargo.toml</code></h3>
<p>两个 crate 都建好后，在根目录创建一个空文件，准备写入 workspace 配置：</p>
<pre><code class="language-bash">touch Cargo.toml</code></pre>
<p>此时 Cargo.toml 还是空的，下一节填写内容。</p>
<h1 id="配置-cargotoml">配置 Cargo.toml</h1>
<p>文件结构建好之后，逐一填写三份 <code>Cargo.toml</code>。</p>
<h2 id="workspace-根目录">workspace 根目录</h2>
<p>根目录的 <code>Cargo.toml</code> 不描述任何代码，只声明这是一个 workspace 以及它包含哪些成员：</p>
<pre><code class="language-toml">[workspace]
members = ["rtodo-core", "rtodo"]
resolver = "2"</code></pre>
<p>Cargo 看到 <code>[workspace]</code> 字段，就会把两个子目录的 crate 统一管理——共享一份 <code>Cargo.lock</code>，<code>cargo build</code> 可以一次编译所有成员。</p>
<h2 id="rtodo-core">rtodo-core</h2>
<p><code>cargo new</code> 自动生成的 <code>rtodo-core/Cargo.toml</code> 只需确认 <code>edition</code> 即可，依赖后续章节用到时再按需添加：</p>
<pre><code class="language-toml">[package]
name = "rtodo-core"
version = "0.1.0"
edition = "2024"</code></pre>
<h2 id="rtodo">rtodo</h2>
<p><code>rtodo</code> 需要引用本地的 <code>rtodo-core</code>，用 <code>path</code> 指向相对路径：</p>
<pre><code class="language-toml">[package]
name = "rtodo"
version = "0.1.0"
edition = "2024"

[dependencies]
rtodo-core = { path = "../rtodo-core" }</code></pre>
<p><code>path = "../rtodo-core"</code> 是 workspace 内部引用本地 crate 的标准写法。</p>
<h2 id="验证">验证</h2>
<p>三份 <code>Cargo.toml</code> 填好后，在 workspace 根目录运行：</p>
<pre><code class="language-bash">cargo build</code></pre>
<p>cargo 会同时编译两个 crate，没有报错就说明配置正确。</p>
<h1 id="数据如何流动">数据如何流动</h1>
<pre><code class="language-text">终端输入：rtodo add "写完教程"
         ↓
main()  →  run()（rtodo/src/main.rs）
                ↓
         parse_args()（rtodo/src/lib.rs）
                ↓
         解析成 Command::Add("写完教程")
                ↓
         调用 rtodo_core::TodoList 的方法
                ↓
         TodoList 修改内存中的 Vec&lt;Todo&gt;
                ↓
         序列化为 JSON，写回 rtodo.json</code></pre>
<p><code>main()</code> 只负责调用 <code>run()</code> 并处理顶层错误。<code>run()</code> 是真正的协调者：先调 <code>parse_args()</code> 拿到 <code>Command</code>，再根据命令类型调用 <code>TodoList</code> 对应的方法。</p>
<blockquote>
<p>本章代码需要在本地运行，无法在 Playground 中直接执行。</p>
</blockquote> 