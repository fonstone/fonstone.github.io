---
title: "自动生成绑定：bindgen"
description: "C 互操作 - 自动生成绑定：bindgen"
date: "2026-07-12"
order: 19002
tags: ["bindgen", "C 绑定生成", "自动绑定"]
est_time: "30 分钟"
---

 <h1 id="自动化绑定">自动化绑定</h1>
<p>手动为成百上千个 C 函数编写 <code>extern "C"</code> 声明不仅枯燥，而且极易出错。如果 C 语言库更新了头文件，手动维护这些绑定简直是噩梦。</p>
<p><strong><code>bindgen</code></strong> 是 Rust 官方推荐的工具，它可以自动读取 C 头文件（<code>.h</code>），并生成对应的 Rust 原始绑定。</p>
<h2 id="使用-bindgen-cli">使用 bindgen CLI</h2>
<p>你可以先安装命令行工具来快速测试：</p>
<pre><code class="language-bash">cargo install bindgen-cli</code></pre>
<p>假设你有一个名为 <code>input.h</code> 的文件：</p>
<pre><code class="language-c">typedef struct {
    int x;
    int y;
} Point;

void print_point(Point p);</code></pre>
<p>运行以下命令：</p>
<pre><code class="language-bash">bindgen input.h -o bindings.rs</code></pre>
<p>生成的 <code>bindings.rs</code> 会包含：</p>
<pre><code class="language-rust">#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct Point {
    pub x: ::std::os::raw::c_int,
    pub y: ::std::os::raw::c_int,
}

extern "C" {
    pub fn print_point(p: Point);
}</code></pre>
<h1 id="构建脚本集成">构建脚本集成</h1>
<p>在实际项目中，我们通常在 <code>build.rs</code>（构建脚本）中使用 <code>bindgen</code>，这样每次编译时它都会自动根据最新的头文件更新绑定。</p>
<h2 id="配置步骤">配置步骤</h2>
<ol>
<li>在 <code>Cargo.toml</code> 中添加依赖：</li>
</ol>
<pre><code class="language-toml">[build-dependencies]
bindgen = "0.69"</code></pre>
<ol start="2">
<li>编写 <code>build.rs</code>：</li>
</ol>
<pre><code class="language-rust">use std::env;
use std::path::PathBuf;

fn main() {
    // 告诉 Cargo，如果头文件变了，就重新运行脚本
    println!("cargo:rerun-if-changed=wrapper.h");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("Unable to generate bindings");

    // 将生成的绑定写入 $OUT_DIR/bindings.rs
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}</code></pre>
<ol start="3">
<li>在 Rust 代码中引入生成的内容：</li>
</ol>
<pre><code class="language-rust">// 引入自动生成的代码
include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

fn main() {
    let p = Point { x: 10, y: 20 };
    unsafe {
        print_point(p);
    }
}</code></pre>
<h3 id="关键机制为什么使用-out_dir">关键机制：为什么使用 <code>OUT_DIR</code>？</h3>
<p>在上面的 <code>build.rs</code> 示例中，你可能注意到我们并没有把生成的 <code>bindings.rs</code> 放在 <code>src/</code> 目录下。这是 Rust 构建脚本的标准实践：</p>
<ol>
<li><strong>避免源码污染</strong>：自动生成的代码会随 C 头文件的变化而变动，不应该作为「手写源码」提交到 Git 仓库。</li>
<li><strong><code>OUT_DIR</code> 环境变量</strong>：这是 Cargo 为构建脚本专门准备的临时存放目录（通常在 <code>target/debug/build/...</code> 路径下）。</li>
<li><strong><code>include!</code> 宏</strong>：它是 Rust 内置的宏，可以将指定文件的内容「原封不动」地粘贴到当前位置，从而让我们在 Rust 源码中直接使用那些自动生成的结构体定义。</li>
</ol>
<h2 id="处理复杂情况">处理复杂情况</h2>
<ul>
<li><strong>宏定义</strong>：bindgen 会尝试将 C 中的 <code>#define</code> 转换为 Rust 的常量。</li>
<li><strong>不透明类型</strong>：对于不想在 Rust 中直接访问成员的结构体，可以使用 <code>.opaque_type("MyStruct")</code>。</li>
<li><strong>白名单机制</strong>：如果你只想为特定函数生成绑定，可以使用 <code>.allowlist_function("my_func_.*")</code>。</li>
</ul>
<h1 id="练习题">练习题</h1>
<h2 id="概念测验">概念测验</h2>
</div>
</div>
</div>
</div>
</div> 