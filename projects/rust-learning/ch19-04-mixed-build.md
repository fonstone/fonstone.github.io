---
title: "静态混合编译：Rust 与 C 的深度链接"
description: "C 互操作 - 静态混合编译：Rust 与 C 的深度链接"
date: "2026-07-12"
order: 19004
tags: ["混合编译", "静态链接", "cc crate", "build.rs"]
est_time: "35 分钟"
---

 <h1 id="静态混合编译">静态混合编译</h1>
<p>在系统级编程中，<strong>静态链接 (Static Linking)</strong> 是最稳健的方案。它将所有依赖的代码在编译期直接拷贝到最终的可执行文件中，生成一个没有任何外部库依赖的二进制文件，这对于跨平台分发和嵌入式开发至关重要。</p>
<p>本节我们将讨论两种典型的静态混合编译场景。</p>
<h2 id="场景一c-为-rust-所用在-rust-项目中编译-c-源码">场景一：C 为 Rust 所用（在 Rust 项目中编译 C 源码）</h2>
<p>当你需要调用一小段 C 代码，或者正在将一个现有的 C 库集成到 Rust 项目中时，你会选择这个方案。</p>
<h3 id="1-目录结构">1. 目录结构</h3>
<p>推荐将 C 源码放在项目根目录下的独立文件夹中（如 <code>c_src</code>），以保持源码整洁：</p>
<pre><code class="language-text">my_project/
├── Cargo.toml
├── build.rs         &lt;-- 构建脚本
├── c_src/           &lt;-- C 源码
│   ├── utils.c
│   └── utils.h
└── src/
    └── main.rs      &lt;-- Rust 逻辑</code></pre>
<h3 id="2-使用-cc-crate-管理构建">2. 使用 <code>cc</code> crate 管理构建</h3>
<p><code>cc</code> crate 是 Rust 生态中编译 C/C++ 代码的标准工具。它会自动搜索系统中安装的编译器（如 <code>gcc</code>, <code>clang</code>, <code>msvc</code>），并根据目标平台设置正确的编译参数。</p>
<p><strong>步骤 A：添加依赖</strong> (<code>Cargo.toml</code>)</p>
<pre><code class="language-toml">[build-dependencies]
cc = "1.0"</code></pre>
<p><strong>步骤 B：编写构建脚本</strong> (<code>build.rs</code>)
构建脚本在 Rust 编译开始前运行。其核心任务是调用编译器将 C 文件编译成静态库（<code>.a</code> 或 <code>.lib</code>）。</p>
<pre><code class="language-rust">fn main() {
    // 1. 指定监控的文件：如果 utils.c 变动，Cargo 会自动重新编译 C 代码
    println!("cargo:rerun-if-changed=c_src/utils.c");

    // 2. 使用 cc::Build 配置编译
    cc::Build::new()
        .file("c_src/utils.c")      // 添加源文件
        .include("c_src")           // 添加头文件搜索路径（-I）
        .define("DEBUG_MODE", "1")  // 添加宏定义（-D）
        .warnings(true)             // 启用警告
        .compile("myutils");        // 编译并生成 libmyutils.a 静态库
}</code></pre>
<h3 id="3-构建脚本背后的秘密">3. 构建脚本背后的「秘密」</h3>
<p>当你调用 <code>.compile("myutils")</code> 时，<code>cc</code> crate 实际上为 Cargo 做了两件事：</p>
<ol>
<li><strong>运行编译器</strong>：在 <code>target/</code> 目录下生成静态库文件。</li>
<li><strong>发送链接指令</strong>：它会自动向 Cargo 标准输出打印如下内容（你看不到但 Cargo 能接收到）：
<ul>
<li><code>cargo:rustc-link-lib=static=myutils</code> (告诉链接器包含这个库)</li>
<li><code>cargo:rustc-link-search=native=/path/to/library</code> (告诉链接器在哪找)</li>
</ul>
</li>
</ol>
<h3 id="4-在-rust-中建立桥梁">4. 在 Rust 中建立桥梁</h3>
<p>现在你可以直接在 Rust 里声明对应的外部函数了：</p>
<pre><code class="language-rust">// src/main.rs
extern "C" {
    // 必须与 C 中的声明完全一致
    fn c_function_name(arg: i32);
}

fn main() {
    unsafe {
        c_function_name(42);
    }
}</code></pre>
<hr/>
<h2 id="场景二rust-为-c-所用将-rust-打包给-c-工程">场景二：Rust 为 C 所用（将 Rust 打包给 C 工程）</h2>
<p>如果你想在一个现有的庞大 C 语言工程中引入 Rust（例如重写某个性能瓶颈模块），你需要将 Rust 编译成一个 C 编译器能理解的「静态库文件」。</p>
<h3 id="1-配置项目类型">1. 配置项目类型</h3>
<p>默认情况下，Cargo 会生成 Rust 专用的 <code>.rlib</code>。要生成 C 定义的静态库，必须在 <code>Cargo.toml</code> 中显式指定：</p>
<pre><code class="language-toml">[lib]
name = "my_rust_core"
crate-type = ["staticlib"] # 👈 关键点：生成静态二进制库 (.a 或 .lib)</code></pre>
<h3 id="2-导出函数">2. 导出函数</h3>
<p>确保你的 Rust 函数使用了 <code>extern "C"</code> 和 <code>#[no_mangle]</code>：</p>
<pre><code class="language-rust">#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -&gt; i32 {
    a + b
}</code></pre>
<h3 id="3-在-c-工程中链接">3. 在 C 工程中链接</h3>
<p>当你运行 <code>cargo build --release</code> 后，在 <code>target/release/</code> 下会找到 <code>libmy_rust_core.a</code>。</p>
<p><strong>链接命令示例 (GCC)：</strong></p>
<pre><code class="language-bash">gcc main.c -L ./target/release/ -lmy_rust_core -lpthread -ldl -o my_app</code></pre>
<blockquote>
<p><strong>💡 专家提示：</strong>
静态链接 Rust 时，必须手动链接其底层的操作系统依赖。在 Linux 上通常是 <code>-lpthread</code> 和 <code>-ldl</code>。如果链接时报错「undefined reference」，请检查是否遗漏了这些系统库。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="概念测验">概念测验</h2>
</div>
</div>
</div> 