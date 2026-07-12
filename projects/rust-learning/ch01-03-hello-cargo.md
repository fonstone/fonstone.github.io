---
title: "使用 Cargo"
description: "Rust 基础 - 使用 Cargo"
date: "2026-07-12"
order: 1003
tags: ["Cargo", "cargo new", "cargo build", "cargo run", "cargo check", "Cargo.toml"]
est_time: "20 分钟"
---

 <h1 id="cargo-rust-的项目管理神器">Cargo: Rust 的项目管理神器</h1>
<p>用 <code>rustc</code> 直接编译文件，对一两个文件的小程序没问题。但真实项目往往有几十个源文件、十几个外部依赖——这时候手动调用 <code>rustc</code> 就变成了噩梦。<strong>Cargo</strong> 是 Rust 官方给出的答案，也是你日后每天都会用到的工具。</p>
<h2 id="什么是-cargo">什么是 Cargo？</h2>
<p>Cargo 同时扮演两个角色：</p>
<table><thead><tr><th>角色</th><th>职责</th></tr></thead><tbody><tr><td><strong>构建系统</strong></td><td>编译代码、处理编译顺序、管理多文件项目</td></tr><tr><td><strong>包管理器</strong></td><td>下载、编译、管理第三方库（crate）</td></tr></tbody></table>
<p>Cargo 随 Rust 工具链一起安装。先确认它可用：</p>
<pre><code class="language-bash">cargo --version</code></pre>
<p>看到类似 <code>cargo 1.xx.x</code> 的输出就说明一切正常。</p>
<h2 id="用-cargo-创建项目">用 Cargo 创建项目</h2>
<p>回到 <code>projects</code> 目录，执行：</p>
<pre><code class="language-bash">cargo new hello_cargo
cd hello_cargo</code></pre>
<p>一条命令，Cargo 帮你做了三件事：</p>
<ol>
<li>创建 <code>hello_cargo</code> 目录和标准项目结构</li>
<li>生成开箱即用的 <code>Cargo.toml</code> 配置文件</li>
<li>初始化 Git 仓库（含 <code>.gitignore</code>）</li>
</ol>
<p>Cargo 生成的 <code>src/main.rs</code> 模式会生成一个完整可运行的 Hello world 程序：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20println!(%22Hello%2C%20world!%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    println!("Hello, world!");
}</code></pre></div>
<blockquote>
<p>如果已有一个没用 Cargo 管理的项目，只需把源文件移到 <code>src/</code> 目录，再创建对应的 <code>Cargo.toml</code>，即可迁移成 Cargo 项目。</p>
</blockquote>
<h2 id="项目结构一览">项目结构一览</h2>
<p><code>cargo new</code> 创建的目录结构：</p>
<pre><code class="language-text">hello_cargo/
├── Cargo.toml      ← 项目配置文件
├── Cargo.lock      ← 依赖版本锁定文件（首次构建后自动生成）
├── .gitignore      ← 自动忽略 target/ 目录
└── src/
    └── main.rs     ← 源代码入口</code></pre>
<p><strong>Cargo 的约定：源文件只放在 <code>src/</code>，根目录只放配置、文档和授权文件。</strong> 这个约定让所有 Cargo 项目拥有一致的布局，你接手任何陌生项目都能快速找到源文件。</p>
<h2 id="cargotoml-详解">Cargo.toml 详解</h2>
<p><code>Cargo.toml</code> 是项目的”身份证”，TOML 格式，内容简洁：</p>
<pre><code class="language-toml">[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]</code></pre>
<p>逐段解读：</p>
<p><strong><code>[package]</code> 表块</strong>——描述这个包本身的信息：</p>
<ul>
<li><code>name</code>：包名，也是编译出的可执行文件名</li>
<li><code>version</code>：版本号，遵循语义化版本（semver）惯例，格式为 <code>主版本.次版本.修订版</code></li>
<li><code>edition</code>：使用的 Rust 语言大版本，目前推荐 <code>2021</code>及以上</li>
</ul>
<p><strong><code>[dependencies]</code> 表块</strong>——列出项目依赖的外部 crate。现在是空的；需要引入第三方库时在这里添加一行即可，Cargo 会自动下载和编译。</p>
<blockquote>
<p><strong>crate</strong> 是 Rust 代码包的单位，相当于 Node.js 的 npm package 或 Python 的 pip 包。Rust 的官方 crate 仓库是 <a href="https://crates.io">crates.io</a>，目前有超过 15 万个 crate。</p>
</blockquote>
<h1 id="构建与运行">构建与运行</h1>
<h2 id="cargo-build编译项目">cargo build：编译项目</h2>
<p>在项目根目录执行：</p>
<pre><code class="language-bash">cargo build</code></pre>
<p>Cargo 编译 <code>src/main.rs</code>，可执行文件放到 <code>target/debug/</code> 目录下：</p>
<pre><code class="language-bash">./target/debug/hello_cargo       # Linux / macOS
.\target\debug\hello_cargo.exe   # Windows</code></pre>
<p>首次构建时还会生成 <strong><code>Cargo.lock</code></strong>，记录所有依赖的精确版本——不需要手动编辑，Cargo 全程自动维护。</p>
<blockquote>
<p><code>target/</code> 目录体积大、随时可重新生成，Cargo 已在 <code>.gitignore</code> 中帮你排除，不会被提交到 Git 仓库。</p>
</blockquote>
<h2 id="cargo-run编译--运行一步到位">cargo run：编译 + 运行一步到位</h2>
<p>开发时最常用的命令：</p>
<pre><code class="language-bash">cargo run</code></pre>
<p><code>cargo run</code> 等于 <code>cargo build</code> + 运行，一步完成。如果源文件自上次编译后没有改动，Cargo 会直接运行已有的可执行文件，跳过编译，节省等待时间。</p>
<p>来验证它的工作方式——下面是 Cargo 管理的项目中 <code>main.rs</code> 的典型内容：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20println!(%22%E7%94%B1%20Cargo%20%E6%9E%84%E5%BB%BA%E5%B9%B6%E8%BF%90%E8%A1%8C%EF%BC%81%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    println!("由 Cargo 构建并运行！");
}</code></pre></div>
<h2 id="cargo-check快速语法检查">cargo check：快速语法检查</h2>
<pre><code class="language-bash">cargo check</code></pre>
<p><code>cargo check</code> 只检查代码能否通过编译，<strong>不生成可执行文件</strong>。因为省略了代码生成阶段，它通常比 <code>cargo build</code> 快 5～10 倍。</p>
<p>实际开发中，很多 Rust 开发者会养成这样的习惯：边写代码边频繁运行 <code>cargo check</code>，确保没有语法和类型错误；等到真正需要测试运行效果时，才执行 <code>cargo run</code>。</p>
<h2 id="cargo-build-release发布构建">cargo build —release：发布构建</h2>
<pre><code class="language-bash">cargo build --release</code></pre>
<p>加上 <code>--release</code> 标志后，Cargo 开启全套编译优化，生成<strong>性能最优</strong>的可执行文件，放到 <code>target/release/</code> 目录。</p>
<p>两种模式的对比：</p>
<table><thead><tr><th>模式</th><th>命令</th><th>编译速度</th><th>运行性能</th><th>输出目录</th></tr></thead><tbody><tr><td>开发模式</td><td><code>cargo build</code></td><td>快</td><td>含调试信息，未优化</td><td><code>target/debug/</code></td></tr><tr><td>发布模式</td><td><code>cargo build --release</code></td><td>慢</td><td><strong>最大化优化</strong></td><td><code>target/release/</code></td></tr></tbody></table>
<blockquote>
<p>做性能测试（benchmark）时，<strong>必须用 <code>--release</code> 版本</strong>——开发模式包含大量调试信息、禁用了优化，测出的数据会严重失真。</p>
</blockquote>
<h2 id="小结">小结</h2>
<p>这六条命令覆盖了日常 90% 的需求：</p>
<table><thead><tr><th>命令</th><th>用途</th></tr></thead><tbody><tr><td><code>cargo new &lt;name&gt;</code></td><td>创建新项目（在当前目录下新建项目目录）</td></tr><tr><td><code>cargo init</code></td><td>将当前目录创建为新项目</td></tr><tr><td><code>cargo build</code></td><td>编译（开发模式）</td></tr><tr><td><code>cargo run</code></td><td>编译 + 运行（最常用）</td></tr><tr><td><code>cargo check</code></td><td>只检查语法，不生成文件（最快）</td></tr><tr><td><code>cargo build --release</code></td><td>编译发布版（最优化）</td></tr></tbody></table>
<p>不管你在 Linux、macOS 还是 Windows 上，这些命令完全一致——这是 Cargo 跨平台一致性的体现。</p>
<h1 id="练习题">练习题</h1>
<h2 id="工具定位">工具定位</h2>
</div>
<h2 id="rustup-的职责">rustup 的职责</h2>
</div>
<h2 id="cargo-check-的特点">cargo check 的特点</h2>
</div>
<h2 id="发布构建">发布构建</h2>
</div>
<h2 id="rust-工具箱">Rust 工具箱</h2>
</div>
<h2 id="填空工具速查表">填空：工具速查表</h2>
<p>将下方备选描述填入对应工具的 <code>""</code> 中，让程序输出完整的工具速查表。每条描述只用一次。</p>
<p><strong>备选描述：</strong></p>
<ul>
<li><code>"LSP 服务器（IDE 代码补全的基础）"</code></li>
<li><code>"版本管理器本身"</code></li>
<li><code>"Rust 编译器"</code></li>
<li><code>"代码格式化工具"</code></li>
<li><code>"包管理器 + 构建工具（最常用的命令）"</code></li>
<li><code>"代码检查（lint）工具"</code></li>
</ul>
<div class="code-editor" data-block-id="01-rust-basics/03-hello-cargo#2:5" data-expect-mode="literal" data-expect-pattern="rustc%3A%20%20%20%20%20%20%20%20%20Rust%20%E7%BC%96%E8%AF%91%E5%99%A8%0Acargo%3A%20%20%20%20%20%20%20%20%20%E5%8C%85%E7%AE%A1%E7%90%86%E5%99%A8%20%2B%20%E6%9E%84%E5%BB%BA%E5%B7%A5%E5%85%B7%EF%BC%88%E6%9C%80%E5%B8%B8%E7%94%A8%E7%9A%84%E5%91%BD%E4%BB%A4%EF%BC%89%0Arustup%3A%20%20%20%20%20%20%20%20%E7%89%88%E6%9C%AC%E7%AE%A1%E7%90%86%E5%99%A8%E6%9C%AC%E8%BA%AB%0Arustfmt%3A%20%20%20%20%20%20%20%E4%BB%A3%E7%A0%81%E6%A0%BC%E5%BC%8F%E5%8C%96%E5%B7%A5%E5%85%B7%0Aclippy%3A%20%20%20%20%20%20%20%20%E4%BB%A3%E7%A0%81%E6%A3%80%E6%9F%A5%EF%BC%88lint%EF%BC%89%E5%B7%A5%E5%85%B7%0Arust-analyzer%3A%20LSP%20%E6%9C%8D%E5%8A%A1%E5%99%A8%EF%BC%88IDE%20%E4%BB%A3%E7%A0%81%E8%A1%A5%E5%85%A8%E7%9A%84%E5%9F%BA%E7%A1%80%EF%BC%89" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20println!(%22rustc%3A%20%20%20%20%20%20%20%20%20%7B%7D%22%2C%20%22%22)%3B%20%20%2F%2F%20%E5%A1%AB%E5%85%A5%E5%AF%B9%E5%BA%94%E7%9A%84%E4%BD%9C%E7%94%A8%0A%20%20%20%20println!(%22cargo%3A%20%20%20%20%20%20%20%20%20%7B%7D%22%2C%20%22%22)%3B%0A%20%20%20%20println!(%22rustup%3A%20%20%20%20%20%20%20%20%7B%7D%22%2C%20%22%22)%3B%0A%20%20%20%20println!(%22rustfmt%3A%20%20%20%20%20%20%20%7B%7D%22%2C%20%22%22)%3B%0A%20%20%20%20println!(%22clippy%3A%20%20%20%20%20%20%20%20%7B%7D%22%2C%20%22%22)%3B%0A%20%20%20%20println!(%22rust-analyzer%3A%20%7B%7D%22%2C%20%22%22)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    println!("rustc:         {}", "");  // 填入对应的作用
    println!("cargo:         {}", "");
    println!("rustup:        {}", "");
    println!("rustfmt:       {}", "");
    println!("clippy:        {}", "");
    println!("rust-analyzer: {}", "");
}</code></pre></div> 