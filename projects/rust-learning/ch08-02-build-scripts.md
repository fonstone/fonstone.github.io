---
title: "构建脚本 build.rs"
description: "工程化 - 构建脚本 build.rs"
date: "2026-07-12"
order: 8002
tags: ["build.rs", "构建脚本", "代码生成", "原生库", "OUT_DIR", "cargo指令"]
est_time: "35 分钟"
---

 <h1 id="什么是构建脚本">什么是构建脚本</h1>
<p>编译 Rust 项目时，Cargo 通常只是调用 <code>rustc</code> 把 <code>.rs</code> 文件编译成二进制。但有时候，<strong>编译之前</strong>需要做一些准备工作：</p>
<h2 id="代码生成">代码生成</h2>
<p>某些代码不是手写的，而是从其他格式生成的。比如：</p>
<ul>
<li>Protocol Buffers（<code>.proto</code> 文件） → Rust 代码</li>
<li>GraphQL 数据结构定义 → Rust 类型</li>
<li>数据库 schema → ORM 模型</li>
</ul>
<p>这些生成的代码往往体积大、重复性高，手动维护既容易出错，又容易过时。<code>build.rs</code> 可以在编译前自动从源定义生成代码。</p>
<h2 id="检测系统环境">检测系统环境</h2>
<p>某些库依赖系统中是否安装了特定的 C 库。比如：</p>
<ul>
<li>能否链接 OpenSSL？</li>
<li>系统中是否有 libsqlite3？</li>
<li>目标平台是 Linux、macOS 还是 Windows？</li>
</ul>
<p>手动检测很脆弱（不同系统的安装位置不同），<code>build.rs</code> 可以根据检测结果动态决定编译哪些代码、链接哪些库。</p>
<h2 id="嵌入编译时信息">嵌入编译时信息</h2>
<p>某些信息需要在编译时写死在二进制里，而不是运行时读取：</p>
<ul>
<li>当前 git commit hash（用于发布版本的追踪）</li>
<li>编译日期和时间</li>
<li>编译时的环境变量（比如版本号）</li>
</ul>
<p>这些信息必须通过 <code>build.rs</code> 在编译时嵌入，因为二进制部署后无法再修改。</p>
<h2 id="条件编译和平台适配">条件编译和平台适配</h2>
<p>交叉编译时（比如在 x86 机器上编译 ARM 程序），需要根据<strong>目标平台</strong>生成不同的代码：</p>
<ul>
<li>Windows 上的系统调用 API 和 Linux 不同</li>
<li>ARM 和 x86_64 的性能优化策略不同</li>
<li>嵌入式系统可能不支持某些特性</li>
</ul>
<p><code>build.rs</code> 可以检测编译目标，并据此设置 cfg 标志来控制条件编译。</p>
<p>这些需求就是 <strong>构建脚本（Build Script）</strong> 的用武之地。</p>
<h1 id="使用构建脚本">使用构建脚本</h1>
<h2 id="创建构建脚本">创建构建脚本</h2>
<p>在 crate 根目录（<code>Cargo.toml</code> 的同级）创建 <code>build.rs</code> 文件：</p>
<pre><code class="language-text">my_crate/
├── Cargo.toml
├── build.rs      ← 构建脚本
└── src/
    └── lib.rs</code></pre>
<p><code>build.rs</code> 本身就是一个普通的 Rust 程序，有 <code>main()</code> 函数，<strong>在编译你的 crate 之前运行</strong>：</p>
<pre><code class="language-rust">// build.rs
fn main() {
    // 构建脚本在这里执行
    println!("cargo::warning=构建脚本运行中...");
}</code></pre>
<blockquote>
<p><strong>构建脚本是独立编译的</strong>：<code>build.rs</code> 会被编译成一个单独的可执行文件并运行，它的运行环境是<strong>编译机器</strong>（宿主机），而不是目标机器。因此即使你在做交叉编译，<code>build.rs</code> 也在你的本机上执行。</p>
</blockquote>
<h3 id="当-buildrs-变得很大时">当 build.rs 变得很大时</h3>
<p>如果构建逻辑变得复杂，一个 <code>build.rs</code> 文件会非常臃肿。Rust 允许你把逻辑分散到多个模块文件中，通常的做法是创建一个 <code>build/</code> 目录：</p>
<pre><code class="language-text">my_crate/
├── Cargo.toml
├── build.rs           ← 主入口，只负责调用
├── build/             ← 构建模块目录
│   ├── mod.rs         ← 模块入口，声明子模块
│   ├── codegen.rs     ← 代码生成逻辑
│   └── linkage.rs     ← 链接逻辑
└── src/
    └── lib.rs</code></pre>
<p>在 <code>build.rs</code> 中声明模块并调用：</p>
<pre><code class="language-rust">// build.rs
mod build;</code></pre>
<p>这样 <code>build.rs</code> 保持简洁，具体逻辑分散在各个子模块里，更容易维护。</p>
<h2 id="buildrs-向-cargo-发指令">build.rs 向 Cargo 发指令</h2>
<p>build.rs 本身只是一个普通的 Rust 程序，但它有一个特殊能力：<strong>它可以通过向 stdout 打印特定格式的行来与 Cargo 通信</strong>（例如：<code>println!("cargo::rerun-if-changed=build.rs");</code>）。Cargo 会读取这些输出，根据其中的指令改变编译行为。这就是 build.rs 如此强大的原因。</p>
<p>指令格式是：</p>
<pre><code class="language-text">cargo::指令名=值</code></pre>
<p>常用指令：</p>
<table><thead><tr><th>指令</th><th>作用与用途</th></tr></thead><tbody><tr><td><code>cargo::rerun-if-changed=PATH</code></td><td>只在指定文件变化时才重新运行脚本。默认任何文件变化都会重新运行，很低效。通常指定 <code>build.rs</code> 本身、<code>.proto</code> 定义文件等</td></tr><tr><td><code>cargo::rerun-if-env-changed=VAR</code></td><td>只在指定环境变量变化时才重新运行脚本。用于依赖系统环境的构建，如 <code>OPENSSL_DIR</code>、<code>PKG_CONFIG_PATH</code></td></tr><tr><td><code>cargo::rustc-cfg=KEY</code> 或 <code>KEY="VALUE"</code></td><td>为代码设置自定义 cfg 标志。代码中可用 <code>#[cfg(key)]</code> 识别。用于根据构建时检测结果决定编译哪些代码</td></tr><tr><td><code>cargo::rustc-env=KEY=VALUE</code></td><td>设置编译时环境变量，代码中用 <code>env!("KEY")</code> 读取。用于嵌入 git hash、版本号等编译时信息</td></tr><tr><td><code>cargo::rustc-link-lib=NAME</code> 或 <code>static=NAME</code></td><td>链接原生 C 库。<code>NAME</code> 为动态链接（默认），<code>static=NAME</code> 为静态链接。链接器会在搜索路径中查找库</td></tr><tr><td><code>cargo::rustc-link-search=PATH</code></td><td>添加库搜索路径。链接器会在这些目录中查找 C 库文件。用于非标准安装位置</td></tr><tr><td><code>cargo::warning=MESSAGE</code></td><td>在编译时输出警告信息。用于告诉用户构建中发生了什么，如”检测到 OpenSSL”等</td></tr></tbody></table>
<blockquote>
<p><strong>新旧语法</strong>：从 Cargo 1.77 起，推荐用 <code>cargo::</code> 前缀（双冒号）。旧版写法是 <code>cargo:</code> 单冒号，如 <code>cargo:rerun-if-changed=...</code>。两者目前都支持。</p>
</blockquote>
<h3 id="具体例子向-crate-嵌入编译信息">具体例子：向 crate 嵌入编译信息</h3>
<p>看一个完整的例子，了解 build.rs 和 crate 代码如何协作：</p>
<p><strong>build.rs：</strong> 生成编译时信息</p>
<pre><code class="language-rust">// build.rs
use std::process::Command;

fn main() {
    // 只在 build.rs 本身变化时重新运行
    println!("cargo::rerun-if-changed=build.rs");

    // 获取 git commit hash
    let output = Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output();

    let git_hash = match output {
        Ok(out) if out.status.success() =&gt; {
            String::from_utf8_lossy(&amp;out.stdout).trim().to_string()
        }
        _ =&gt; "unknown".to_string(),
    };

    // 通过 rustc-env 指令向 Cargo 发出指令
    // Cargo 会把这个环境变量设置给 rustc
    println!("cargo::rustc-env=GIT_HASH={}", git_hash);
}</code></pre>
<p><strong>src/main.rs：</strong> 在代码中使用这个信息</p>
<pre><code class="language-rust">fn main() {
    // env!() 宏在编译时读取环境变量
    // build.rs 通过 println!("cargo::rustc-env=...") 设置的变量
    let version = env!("CARGO_PKG_VERSION");
    let git_hash = env!("GIT_HASH");

    println!("程序版本：{}", version);
    println!("编译自 commit：{}", git_hash);
}</code></pre>
<p><strong>过程说明：</strong></p>
<ol>
<li><code>cargo build</code> 时，Cargo 先编译并运行 <code>build.rs</code></li>
<li>build.rs 执行代码，从 git 读取 commit hash</li>
<li>build.rs 打印 <code>cargo::rustc-env=GIT_HASH=abc123</code></li>
<li><strong>Cargo 读取这一行输出</strong>，理解这是一条指令</li>
<li>Cargo 把 <code>GIT_HASH=abc123</code> 设置为环境变量</li>
<li>Cargo 调用 <code>rustc</code> 编译 <code>src/main.rs</code></li>
<li>编译时，<code>env!("GIT_HASH")</code> 展开为 <code>"abc123"</code></li>
<li>最终二进制中包含了编译时的 git 信息</li>
</ol>
<p>这就是 build.rs 的工作流：<strong>代码 → 输出指令 → Cargo 解析 → 影响编译</strong>。</p>
<h2 id="控制脚本何时重新运行">控制脚本何时重新运行</h2>
<p>默认情况下，任何文件变化都会导致构建脚本重新运行。用 <code>rerun-if-changed</code> 可以缩小范围，让构建更快：</p>
<pre><code class="language-rust">// build.rs
fn main() {
    // 只在这几个文件变化时才重新运行
    println!("cargo::rerun-if-changed=build.rs");
    println!("cargo::rerun-if-changed=src/schema.proto");

    // 只在环境变量变化时重新运行
    println!("cargo::rerun-if-env-changed=MY_LIB_PATH");
}</code></pre>
<blockquote>
<p><strong>重要</strong>：如果你写了 <code>rerun-if-changed</code>，Cargo 就会<strong>只</strong>在你指定的文件变化时才重新运行脚本，不再监听其他文件。所以一般都要包含 <code>build.rs</code> 本身。</p>
</blockquote>
<h1 id="实用场景示例">实用场景示例</h1>
<h2 id="生成代码">生成代码</h2>
<p>代码生成是构建脚本最强大的用途：读取某种定义文件（<code>.proto</code>、<code>.fbs</code>、配置 JSON 等），生成对应的 Rust 代码。</p>
<p>生成的文件必须写到 <code>OUT_DIR</code> 目录——这是 Cargo 为构建脚本专门提供的输出目录：</p>
<pre><code class="language-rust">// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    println!("cargo::rerun-if-changed=src/messages.txt");

    // Cargo 提供 OUT_DIR 环境变量，指向构建输出目录
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&amp;out_dir).join("generated.rs");

    // 读取定义文件，生成 Rust 代码
    let messages = fs::read_to_string("src/messages.txt").unwrap_or_default();
    let mut code = String::from("// 自动生成，请勿手动修改\n\n");

    for (i, line) in messages.lines().enumerate() {
        let line = line.trim();
        if !line.is_empty() {
            code.push_str(&amp;format!(
                "pub const MSG_{}: &amp;str = \"{}\";\n",
                i, line
            ));
        }
    }

    fs::write(&amp;dest_path, code).unwrap();
}</code></pre>
<p>在 crate 的 <code>lib.rs</code> 中引入生成的代码：</p>
<pre><code class="language-rust">// src/lib.rs

// include! 宏在编译时把文件内容插入到这里
include!(concat!(env!("OUT_DIR"), "/generated.rs"));</code></pre>
<p>这样 <code>MSG_0</code>、<code>MSG_1</code> 等常量就可以像普通 Rust 代码一样使用了。</p>
<h2 id="设置自定义-cfg-标志">设置自定义 cfg 标志</h2>
<p>构建脚本可以根据系统环境设置自定义的 <code>cfg</code> 标志，比简单的 <code>#[cfg(target_os = "...")]</code> 更灵活：</p>
<pre><code class="language-rust">// build.rs
fn main() {
    println!("cargo::rerun-if-changed=build.rs");

    // 检测是否有某个系统库
    if has_openssl() {
        println!("cargo::rustc-cfg=has_openssl");
    }

    // 根据目标架构设置标志
    let target_arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
    if target_arch == "x86_64" || target_arch == "aarch64" {
        println!("cargo::rustc-cfg=is_64bit");
    }
}

fn has_openssl() -&gt; bool {
    // 实际项目中可以用 pkg-config crate 来检测
    std::process::Command::new("pkg-config")
        .args(["--exists", "openssl"])
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}</code></pre>
<p>在代码中使用：</p>
<pre><code class="language-rust">#[cfg(has_openssl)]
mod tls {
    pub fn connect_tls() { /* ... */ }
}

#[cfg(is_64bit)]
fn optimized_64bit_algo() { /* ... */ }</code></pre>
<h2 id="链接原生库">链接原生库</h2>
<p>Rust 经常需要调用 C 库。构建脚本告诉 Cargo 要链接哪个库：</p>
<pre><code class="language-rust">// build.rs
fn main() {
    println!("cargo::rerun-if-changed=build.rs");

    // 告诉链接器链接 libssl（不带 lib 前缀和 .a/.so 后缀）
    println!("cargo::rustc-link-lib=ssl");
    println!("cargo::rustc-link-lib=crypto");

    // 动态链接（默认）
    println!("cargo::rustc-link-lib=dylib=ssl");

    // 静态链接
    println!("cargo::rustc-link-lib=static=ssl");

    // 添加库搜索路径
    println!("cargo::rustc-link-search=/usr/local/lib");
    println!("cargo::rustc-link-search=native=/opt/homebrew/lib");
}</code></pre>
<blockquote>
<p><strong>实际项目中</strong>：手写库路径很脆弱，不同系统的安装位置不同。推荐使用 <code>pkg-config</code> crate，它能自动检测系统中安装的 C 库：</p>
<pre><code class="language-rust">// build.rs
fn main() {
    pkg_config::probe_library("openssl").unwrap();
}</code></pre>
</blockquote>
<h2 id="cargo-提供的环境变量">Cargo 提供的环境变量</h2>
<p>构建脚本运行时，Cargo 会设置很多有用的环境变量：</p>
<table><thead><tr><th>变量</th><th>内容</th></tr></thead><tbody><tr><td><code>OUT_DIR</code></td><td>构建输出目录（生成文件必须写这里）</td></tr><tr><td><code>CARGO_PKG_VERSION</code></td><td>crate 的版本号</td></tr><tr><td><code>CARGO_PKG_NAME</code></td><td>crate 的名称</td></tr><tr><td><code>CARGO_MANIFEST_DIR</code></td><td><code>Cargo.toml</code> 所在目录的绝对路径</td></tr><tr><td><code>CARGO_CFG_TARGET_OS</code></td><td>目标操作系统</td></tr><tr><td><code>CARGO_CFG_TARGET_ARCH</code></td><td>目标 CPU 架构</td></tr><tr><td><code>PROFILE</code></td><td><code>debug</code> 或 <code>release</code></td></tr><tr><td><code>HOST</code></td><td>编译机器（宿主）的 target triple</td></tr><tr><td><code>TARGET</code></td><td>目标机器的 target triple</td></tr></tbody></table>
<h1 id="练习题">练习题</h1>
<h2 id="构建脚本概念测验">构建脚本概念测验</h2>
</div>
</div>
</div>
</div>
</div> 