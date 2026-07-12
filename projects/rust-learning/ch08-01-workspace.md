---
title: "工作空间"
description: "工程化 - 工作空间"
date: "2026-07-12"
order: 8001
tags: ["workspace", "cargo", "多crate", "monorepo", "共享依赖", "virtual workspace"]
est_time: "25 分钟"
---

 <h1 id="工作空间基础">工作空间基础</h1>
<h2 id="为什么需要工作空间">为什么需要工作空间</h2>
<p>随着项目规模增大，单个 crate 会变得臃肿难以维护。更常见的情况是：一个项目自然分成了几个部分——核心库 + CLI 工具 + 集成测试 + 辅助工具库。</p>
<p>如果把它们当作<strong>独立项目</strong>来管理，麻烦就来了：</p>
<ul>
<li>每次修改核心库，都要先发布新版本，再更新工具的 <code>Cargo.toml</code>，非常繁琐</li>
<li>各自有独立的 <code>target/</code> 目录，重复编译同样的依赖，浪费大量时间</li>
<li>无法在一条命令里构建和测试所有部分</li>
</ul>
<p><strong>工作空间（Workspace）</strong> 就是解决这个问题的方案：把多个相关 crate 放在同一个目录下，用一个根 <code>Cargo.toml</code> 统一管理。</p>
<h2 id="工作空间的文件结构">工作空间的文件结构</h2>
<p>一个典型的工作空间长这样：</p>
<pre><code class="language-text">my_project/            ← 工作空间根目录
├── Cargo.toml         ← 工作空间配置（根 Cargo.toml）
├── Cargo.lock         ← 共享的依赖锁文件
├── target/            ← 共享的构建目录
├── my_lib/            ← 成员 crate：核心库
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── my_cli/            ← 成员 crate：命令行工具
    ├── Cargo.toml
    └── src/
        └── main.rs</code></pre>
<p>根目录的 <code>Cargo.toml</code> 使用 <code>[workspace]</code> 段落声明这是一个工作空间，并通过 <code>members</code> 列出所有成员：</p>
<pre><code class="language-toml"># 根 Cargo.toml
[workspace]
members = [
    "my_lib",
    "my_cli",
]
resolver = "2"</code></pre>
<blockquote>
<p><strong><code>resolver = "2"</code></strong>：从 Rust 2021 edition 起，建议在工作空间中显式声明使用第 2 版依赖解析器，它在处理 features 时行为更一致、更符合直觉。</p>
</blockquote>
<p>每个成员 crate 有自己的 <code>Cargo.toml</code>，跟普通项目一样：</p>
<pre><code class="language-toml"># my_lib/Cargo.toml
[package]
name = "my_lib"
version = "0.1.0"
edition = "2021"</code></pre>
<pre><code class="language-toml"># my_cli/Cargo.toml
[package]
name = "my_cli"
version = "0.1.0"
edition = "2021"

[dependencies]
my_lib = { path = "../my_lib" }  # 引用同工作空间内的本地 crate</code></pre>
<h2 id="在工作空间中运行命令">在工作空间中运行命令</h2>
<p>在工作空间根目录下，可以用 <code>-p</code>（<code>--package</code>）指定针对哪个成员运行命令：</p>
<pre><code class="language-bash"># 编译所有成员
cargo build --workspace

# 只编译 my_lib
cargo build -p my_lib

# 运行 my_cli（必须是二进制 crate）
cargo run -p my_cli

# 测试所有成员
cargo test --workspace

# 只测试 my_cli
cargo test -p my_cli

# 快速检查所有成员（不生成二进制文件，比 build 快）
cargo check --workspace</code></pre>
<blockquote>
<p><strong>共享 <code>target/</code></strong>：所有成员共用同一个 <code>target/</code> 编译目录。这意味着：如果 <code>my_lib</code> 和 <code>my_cli</code> 都依赖 <code>serde</code>，它只会被编译一次。大型项目里这能节省大量编译时间。</p>
</blockquote>
<h1 id="依赖管理">依赖管理</h1>
<h2 id="共享的-cargolock">共享的 Cargo.lock</h2>
<p>工作空间只有<strong>一个</strong> <code>Cargo.lock</code>，位于根目录。这意味着所有成员 crate 使用同一份依赖版本快照。</p>
<p>好处：</p>
<ul>
<li><strong>版本一致</strong>：<code>my_lib</code> 和 <code>my_cli</code> 使用完全相同版本的 <code>serde</code>，不会出现”我这里是 1.0.180，你那里是 1.0.193”这种诡异问题</li>
<li><strong>确定性构建</strong>：整个工作空间的构建行为完全可复现</li>
</ul>
<h2 id="工作空间级别的共享依赖">工作空间级别的共享依赖</h2>
<p>如果多个成员都依赖同一个外部 crate，你每次都要在各自的 <code>Cargo.toml</code> 里写，还要保证版本号一致——容易出错。</p>
<p>从 Rust 1.64 起，可以在根 <code>Cargo.toml</code> 的 <code>[workspace.dependencies]</code> 里<strong>统一声明依赖</strong>，各成员直接继承：</p>
<pre><code class="language-toml"># 根 Cargo.toml
[workspace]
members = ["my_lib", "my_cli"]
resolver = "2"

[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
anyhow = "1.0"</code></pre>
<blockquote>
<p><strong>Features 小知识</strong>：<code>features</code> 是依赖库的<strong>可选功能模块</strong>，编译时由你选择启用哪些（如 serde 的 derive 宏），未启用的代码完全不参与编译，可以减小二进制体积。文章后面会专门讲解。</p>
</blockquote>
<p>成员的 <code>Cargo.toml</code> 只需写 <code>workspace = true</code> 来继承：</p>
<pre><code class="language-toml"># my_lib/Cargo.toml
[dependencies]
serde = { workspace = true }      # 继承根的版本和 features
anyhow = { workspace = true }

# 可以在继承基础上追加额外 features
tokio = { workspace = true, features = ["sync"] }</code></pre>
<blockquote>
<p><strong>features 是累加的</strong>：继承 <code>workspace.dependencies</code> 时，你只能追加 features，不能删除根里已有的。这与 Cargo feature 的”累加”设计是一致的——features 只能开启，不能关闭。</p>
</blockquote>
<h2 id="虚拟工作空间">虚拟工作空间</h2>
<h3 id="什么是虚拟工作空间">什么是虚拟工作空间</h3>
<p>有两种工作空间结构：</p>
<p><strong>非虚拟（常见）</strong>：根目录本身是一个 crate</p>
<pre><code class="language-text">my_project/           ← 根目录既是工作空间，也是一个 crate
├── Cargo.toml        （有 [package] + [workspace]）
├── src/
└── member1/
    └── Cargo.toml</code></pre>
<p><strong>虚拟（特殊）</strong>：根目录只是”容器”，本身不是 crate</p>
<pre><code class="language-text">monorepo/             ← 根目录只是工作空间，不是 crate
├── Cargo.toml        （只有 [workspace]，没有 [package]）
├── lib_a/
│   └── Cargo.toml
├── lib_b/
│   └── Cargo.toml
└── lib_c/
    └── Cargo.toml</code></pre>
<h3 id="为什么要用虚拟工作空间">为什么要用虚拟工作空间</h3>
<ul>
<li><strong>根没有代码</strong>：有些项目天然是”多个独立库的集合”，比如 Tokio 生态（tokio、tokio-util、tokio-native-tls 各是独立库）</li>
<li><strong>避免歧义</strong>：没有一个”主”库，所以 <code>cargo build</code> 默认不知道该构建谁，必须明确指定，更清晰</li>
<li><strong>平等性</strong>：所有成员地位相同，没有”这个是主，那个是附属”的混乱</li>
</ul>
<h3 id="行为差异">行为差异</h3>
<table><thead><tr><th>场景</th><th>虚拟工作空间</th><th>有 [package] 的工作空间</th></tr></thead><tbody><tr><td><code>cargo build</code>（无参）</td><td>构建<strong>所有</strong>成员</td><td>只构建<strong>根</strong> package</td></tr><tr><td><code>cargo run</code></td><td>报错（没有根二进制）</td><td>运行根的 main 函数</td></tr><tr><td><code>cargo test --workspace</code></td><td>测试所有成员</td><td>测试所有成员</td></tr></tbody></table>
<p><strong>实际使用建议</strong>：</p>
<ul>
<li>如果你的项目有一个”主”库或应用（如 web 服务器），用<strong>有 [package] 的工作空间</strong></li>
<li>如果是平等的多个库组合（如工具链、中间件库族），用<strong>虚拟工作空间</strong></li>
</ul>
<h1 id="features">Features</h1>
<h2 id="什么是-features-以及为什么需要它们">什么是 Features 以及为什么需要它们</h2>
<p>在工作空间讲解中，我们看到了这样的用法：</p>
<pre><code class="language-toml">[dependencies]
tokio = { version = "1", features = ["full"] }</code></pre>
<p>这里的 <code>features = ["full"]</code> 表示：“我要使用 tokio 这个库，并启用它的所有功能”。</p>
<p><strong>关键澄清</strong>：<code>"full"</code> 不是 Cargo 的内置关键字，而是 <strong>tokio 库作者定义的一个特殊 feature 的名字</strong>。这个 feature 的作用就是启用 tokio 提供的所有可选功能。</p>
<p>如果用户不想要所有功能，可以只选择需要的：</p>
<pre><code class="language-toml">[dependencies]
# 只启用 sync 和 time 功能（不启用其他）
tokio = { version = "1", features = ["sync", "time"] }</code></pre>
<p><strong>背景</strong>：很多库会提供多个可选功能。比如 tokio 库可以提供：</p>
<ul>
<li>异步运行时（rt）</li>
<li>同步原语（sync）</li>
<li>计时器（time）</li>
<li>I/O 工具（io-util）</li>
<li>等等…</li>
</ul>
<p>库的作者不想强迫所有用户都编译所有功能，因为：</p>
<ul>
<li>编译时间长</li>
<li>二进制文件体积大</li>
<li>可能有不需要的依赖被引入</li>
</ul>
<p>所以库提供了 <strong>features</strong> 机制：用户可以选择”我需要哪些功能”。</p>
<h2 id="两个视角理解-features">两个视角理解 Features</h2>
<img alt="features" src="/images/rust/features.svg" style="max-width:100%;margin:1rem 0;"/>
<h3 id="视角-1作为库的使用者用户">视角 1：作为库的使用者（用户）</h3>
<p>当你使用提供 features 的库时，比如 tokio，你可以：</p>
<pre><code class="language-toml"># 使用默认 features（tokio 默认是 rt）
tokio = "1"

# 启用特定 features（比如同步原语和计时器）
tokio = { version = "1", features = ["sync", "time"] }

# 启用所有 features
tokio = { version = "1", features = ["full"] }

# 关掉默认 features，只启用某些
tokio = { version = "1", default-features = false, features = ["rt"] }</code></pre>
<h3 id="视角-2作为库的设计者库作者">视角 2：作为库的设计者（库作者）</h3>
<p>现在反过来，<strong>如果你在设计 tokio 这样的库</strong>，怎么定义 features？</p>
<p>tokio 库就是这样做的，它提供多个可选功能模块。假设 tokio 的简化版本长这样：</p>
<pre><code class="language-toml"># Cargo.toml

[features]
# 定义有哪些 features，以及它们之间的关系
default = ["rt"]             # 默认启用异步运行时
rt = []                      # 运行时功能本身不需要额外依赖
sync = []                    # 同步原语功能
time = []                    # 计时器功能
io-util = []                 # I/O 工具功能
full = ["rt", "sync", "time", "io-util"]  # 启用所有功能

[dependencies]
# 这些库用 optional = true 标记为可选
# 比如，某些高级功能可能需要额外的依赖库
# （现实中 tokio 不完全这样做，这里为了讲解简化）</code></pre>
<p><strong>逻辑关系</strong>：</p>
<ol>
<li><code>[features]</code> 中，定义可用的 feature 及其组合关系</li>
<li><code>default</code> 定义默认启用哪些</li>
<li><code>"full"</code> 是一个特殊 feature，它启用其他所有 features</li>
</ol>
<h2 id="库设计者的三个步骤以-tokio-为例">库设计者的三个步骤（以 tokio 为例）</h2>
<h3 id="步骤-1声明可选依赖">步骤 1：声明可选依赖</h3>
<pre><code class="language-toml">[dependencies]
tokio-util = { version = "0.7", optional = true }
tracing = { version = "0.1", optional = true }</code></pre>
<p><code>optional = true</code> 表示这个库<strong>不是必需的</strong>。只有当用户启用了依赖这个库的 feature 时，这个库才会被下载和编译。如果没有任何 feature 需要它，这个库就根本不会出现在项目中。</p>
<h3 id="步骤-2在-features-中关联">步骤 2：在 Features 中关联</h3>
<pre><code class="language-toml">[features]
default = ["rt"]
rt = []                           # 异步运行时，无外部依赖
sync = []                         # 同步原语
time = []                         # 计时器
io-util = ["dep:tokio-util"]      # I/O 工具需要额外的库
tracing-support = ["dep:tracing"] # 追踪支持需要额外的库
full = ["rt", "sync", "time", "io-util", "tracing-support"]</code></pre>
<p><code>dep:库名</code> 表示”启用这个 feature 时，引入对应的库”。注意：是 <code>dep:</code> 前缀，不是直接写库名。这样明确区分”库的名字”和”feature 的名字”。</p>
<h3 id="步骤-3在代码中条件编译">步骤 3：在代码中条件编译</h3>
<pre><code class="language-rust">// 基础功能，总是存在
pub fn version() {
    println!("tokio 1.0");
}

// 异步运行时：只在启用 rt feature 时编译
#[cfg(feature = "rt")]
pub fn spawn_task&lt;F&gt;(task: F)
where
    F: Fn() + Send + 'static,
{
    println!("在运行时中生成任务");
}

// 同步原语：只在启用 sync feature 时编译
#[cfg(feature = "sync")]
pub fn create_mutex&lt;T&gt;(value: T) {
    println!("创建互斥锁");
}

// 计时器：只在启用 time feature 时编译
#[cfg(feature = "time")]
pub fn sleep_ms(ms: u64) {
    println!("睡眠 {} 毫秒", ms);
}

// I/O 工具：需要 tokio-util 库，只在启用 io-util feature 时编译
#[cfg(feature = "io-util")]
pub fn use_codec() {
    use tokio_util;  // 这个 use 也被条件编译
    println!("使用 codec");
}</code></pre>
<p><strong>关键</strong>：当用户启用 <code>tokio = { version = "1", features = ["sync", "time"] }</code> 时：</p>
<ul>
<li><code>rt</code>、<code>sync</code>、<code>time</code> 被启用，对应的函数<strong>被编译进来</strong></li>
<li><code>io-util</code> 没被启用，<code>use_codec</code> 函数<strong>不会被编译</strong></li>
<li><code>tokio-util</code> 库<strong>不会被下载</strong></li>
<li>二进制文件中<strong>没有未使用功能的代码</strong></li>
</ul>
<p>这就是 features 的”零成本”抽象。</p>
<h2 id="库使用者的使用方式">库使用者的使用方式</h2>
<p>当用户在 <code>Cargo.toml</code> 中选择启用某个 feature 时，如果那个 feature 需要可选依赖，Cargo 会自动拉下来：</p>
<pre><code class="language-toml">[dependencies]
# 启用 io-util feature，tokio-util 库会自动被下载和编译
tokio = { version = "1", features = ["io-util"] }

# 启用多个 features，所有需要的库都会被拉下来
tokio = { version = "1", features = ["sync", "io-util", "tracing-support"] }</code></pre>
<p>这样做的好处：</p>
<ul>
<li>用户不需要手动管理 <code>tokio-util</code> 等可选依赖</li>
<li>Cargo 根据选择的 features，自动推导需要哪些库</li>
<li>未选择的 feature 对应的库<strong>完全不下载</strong>，节省空间</li>
</ul>
<h3 id="从命令行启用-features">从命令行启用 Features</h3>
<p>库作者设计好 features 后，用户也可以从命令行选择：</p>
<pre><code class="language-bash"># 启用指定 features
cargo build --features "sync,io-util"

# 启用所有 features（包括所有可选依赖）
cargo build --all-features

# 不启用默认 features，只选特定的
cargo build --no-default-features --features "io-util"</code></pre>
<h1 id="练习题">练习题</h1>
<h2 id="工作空间概念测验">工作空间概念测验</h2>
</div>
</div>
</div>
</div>
<pre><code class="language-toml"># 根 Cargo.toml：
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }

# my_cli 的 Cargo.toml：
[dependencies]
serde = { workspace = true, features = ["rc"] }</code></pre>
</div>
<h2 id="features-与工作空间">Features 与工作空间</h2>
</div>
</div>
</div>
</div>
</div> 