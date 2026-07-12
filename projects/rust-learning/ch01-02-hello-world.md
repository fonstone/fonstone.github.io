---
title: "Hello, World!"
description: "Rust 基础 - Hello, World!"
date: "2026-07-12"
order: 1002
tags: ["Hello World", "main函数", "println!", "rustc编译", "预编译"]
est_time: "20 分钟"
---

 <h1 id="你的第一个-rust-程序">你的第一个 Rust 程序</h1>
<p>按照程序员世界的传统，学习一门新语言的第一件事，就是让计算机说出 “Hello, world!”。这不只是仪式感——它能让你快速感受到这门语言最基本的节奏：写代码、编译、运行。</p>
<h2 id="创建项目目录">创建项目目录</h2>
<p>Rust 对代码存放的位置没有任何限制，但养成规范的目录结构是好习惯。我们在主目录下创建一个统一的 <code>projects</code> 目录，存放本教程的所有练习。</p>
<p><strong>Linux / macOS / Windows PowerShell：</strong></p>
<pre><code class="language-bash">mkdir ~/projects
cd ~/projects
mkdir hello_world
cd hello_world</code></pre>
<p><strong>Windows CMD：</strong></p>
<pre><code class="language-bash">mkdir "%USERPROFILE%\projects"
cd /d "%USERPROFILE%\projects"
mkdir hello_world
cd hello_world</code></pre>
<blockquote>
<p><strong>文件命名约定：</strong> 如果文件名包含多个单词，统一用小写字母并通过下划线分隔，例如 <code>hello_world.rs</code>，而不是 <code>helloworld.rs</code> 或 <code>HelloWorld</code>。这是 Rust 社区的惯例。</p>
</blockquote>
<h2 id="编写第一个程序">编写第一个程序</h2>
<p>在 <code>hello_world</code> 目录下，创建名为 <code>main.rs</code> 的文件（Rust 源文件以 <code>.rs</code> 结尾），输入以下内容：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20println!(%22Hello%2C%20world!%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    println!("Hello, world!");
}</code></pre></div>
<p>保存文件。你刚才写完了人生中第一个 Rust 程序，只有两行代码。接下来我们逐行拆解它。</p>
<h2 id="程序解剖每行代码的含义">程序解剖：每行代码的含义</h2>
<p>这个程序虽然简单，但 Rust 的几个核心语法已经悄悄出现了。</p>
<h3 id="fn-main-是什么"><code>fn main()</code> 是什么？</h3>
<p><code>fn</code> 是 <strong>function（函数）</strong> 的缩写，<code>main</code> 是这个函数的名字，<code>()</code> 表示它不接收任何参数。</p>
<div class="code-runner" data-full-code="%2F%2F%20main%20%E5%87%BD%E6%95%B0%E6%98%AF%E7%A8%8B%E5%BA%8F%E7%9A%84%E5%85%A5%E5%8F%A3%E7%82%B9%0A%2F%2F%20Rust%20%E8%BF%90%E8%A1%8C%E6%97%B6%E6%80%BB%E6%98%AF%E4%BB%8E%E8%BF%99%E9%87%8C%E5%BC%80%E5%A7%8B%E6%89%A7%E8%A1%8C%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%87%BD%E6%95%B0%E4%BD%93%E6%94%BE%E5%9C%A8%E4%B8%80%E5%AF%B9%E5%A4%A7%E6%8B%AC%E5%8F%B7%E9%87%8C%0A%7D" data-mode="run"><pre><code class="language-rust">// main 函数是程序的入口点
// Rust 运行时总是从这里开始执行
fn main() {
    // 函数体放在一对大括号里
}</code></pre></div>
<p><code>main</code> 函数是每个可执行 Rust 程序的<strong>入口点</strong>——就像马拉松的起跑线，无论程序有多复杂，都从 <code>main</code> 跑起来。</p>
<blockquote>
<p>Rust 规范要求左大括号 <code>{</code> 和函数声明放在同一行，中间加一个空格。如果你不确定格式是否规范，可以运行 <code>rustfmt main.rs</code>，这是 Rust 工具链内置的格式化工具，会自动帮你整理代码风格。</p>
</blockquote>
<h3 id="println-是什么"><code>println!</code> 是什么？</h3>
<p>注意 <code>println</code> 后面有一个感叹号 <code>!</code>。在 Rust 中，<strong>带 <code>!</code> 的是宏（macro），不是普通函数</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20println!(%22Hello%2C%20world!%22)%3B%20%20%2F%2F%20println!%20%E6%98%AF%E5%AE%8F%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    println!("Hello, world!");  // println! 是宏
}</code></pre></div>
<p>宏和函数有本质区别——宏在编译阶段就会展开处理代码，能做到函数做不到的事情（比如接受数量不固定的参数）。<code>println!</code> 就是一个功能强大的宏，能格式化并把文本打印到终端。</p>
<p>关于”宏到底是什么”先按下不表，等你对 Rust 有了更多了解之后，我们会专门深入讲解。<strong>现在只需记住一条规则：看到 <code>!</code> = 调用的是宏。</strong></p>
<h3 id="字符串字面量与分号">字符串字面量与分号</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%20%20%20%20%20%20%20%E5%8F%8C%E5%BC%95%E5%8F%B7%E5%8C%85%E8%A3%B9%E7%9A%84%E6%96%87%E6%9C%AC%E5%8F%AB%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%AD%97%E9%9D%A2%E9%87%8F%0A%20%20%20%20println!(%22Hello%2C%20world!%22)%3B%0A%20%20%20%20%2F%2F%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%5E%20%E8%8B%B1%E6%96%87%E5%88%86%E5%8F%B7%EF%BC%8C%E8%A1%A8%E7%A4%BA%E8%BF%99%E6%9D%A1%E8%AF%AD%E5%8F%A5%E7%BB%93%E6%9D%9F%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    //        双引号包裹的文本叫字符串字面量
    println!("Hello, world!");
    //                        ^ 英文分号，表示这条语句结束
}</code></pre></div>
<p>还有两个细节值得注意：</p>
<ol>
<li><strong>4 个空格的缩进</strong>，不是 Tab。这是 Rust 社区的统一约定。</li>
<li><strong>英文分号 <code>;</code></strong> 表示这条语句已经完整结束。Rust 中大多数语句都以 <code>;</code> 结尾——后续你会理解为什么”大多数”而不是”全部”。</li>
</ol>
<h2 id="编译并运行">编译并运行</h2>
<p>Rust 是<strong>编译型语言</strong>，必须先把源代码编译成二进制可执行文件，才能运行。</p>
<h3 id="第一步编译">第一步：编译</h3>
<p>在终端中，确保你在 <code>hello_world</code> 目录下，执行：</p>
<pre><code class="language-bash">rustc main.rs</code></pre>
<p>这条命令调用 Rust 编译器 <code>rustc</code>，把 <code>main.rs</code> 编译成可执行文件。编译成功后不会有任何输出——<strong>没有消息就是好消息</strong>。</p>
<h3 id="第二步查看生成的文件">第二步：查看生成的文件</h3>
<pre><code class="language-bash">ls          # Linux / macOS
dir /B      # Windows CMD</code></pre>
<p>你会看到：</p>
<table><thead><tr><th>文件</th><th>说明</th></tr></thead><tbody><tr><td><code>main.rs</code></td><td>你写的源代码</td></tr><tr><td><code>main</code>（Linux/macOS）或 <code>main.exe</code>（Windows）</td><td>编译产出的可执行文件</td></tr><tr><td><code>main.pdb</code>（仅 Windows）</td><td>调试符号文件</td></tr></tbody></table>
<h3 id="第三步运行">第三步：运行</h3>
<pre><code class="language-bash">./main          # Linux / macOS
.\main.exe      # Windows PowerShell / CMD</code></pre>
<p>终端应该输出：</p>
<pre><code class="language-text">Hello, world!</code></pre>
<p>看到这行输出了吗？<strong>恭喜你，你已经是一名 Rust 开发者了！</strong></p>
<h2 id="编译型-vs-解释型为什么-rust-要编译">编译型 vs 解释型：为什么 Rust 要编译？</h2>
<p>如果你之前学过 Python、Ruby 或 JavaScript，可能会觉得”先编译再运行”多了一步，有点麻烦。但这背后有深刻的权衡。</p>
<table><thead><tr><th>特性</th><th>解释型（Python / JS）</th><th>编译型（Rust / C++）</th></tr></thead><tbody><tr><td>运行方式</td><td>需要解释器逐行执行</td><td>直接运行二进制文件</td></tr><tr><td>分发程序</td><td>对方需要安装对应运行时</td><td>对方不需要安装任何东西</td></tr><tr><td>性能</td><td>相对较慢</td><td>接近硬件极限</td></tr><tr><td>错误发现时机</td><td>运行时才暴露</td><td><strong>编译时就能发现大多数错误</strong></td></tr></tbody></table>
<p>Rust 选择做<strong>预编译（ahead-of-time compiled）语言</strong>，带来了两个关键好处：</p>
<p><strong>分发简单</strong>：你可以把编译好的 <code>main</code> 文件直接发给任何人，他们不需要安装 Rust 就能直接运行。发给朋友一个 Python 脚本，他得先装 Python；发给他一个 Rust 编译出的可执行文件，双击就跑。</p>
<p><strong>错误前置</strong>：Rust 编译器极其严格，能在你运行代码之前发现大量潜在错误。这也是 Rust”安全性”的核心来源之一——它不让不安全的程序通过编译关。</p>
<blockquote>
<p>每次看到编译器报错，请别沮丧。Rust 的报错信息在所有主流语言里是出了名的详细和友好，它在帮你、不是在为难你。渐渐地你会发现，「把错误解决在编译阶段」是一件很爽的事。</p>
</blockquote>
<h2 id="小结">小结</h2>
<p>这篇文章里，你完成了人生中第一个 Rust 程序，并了解了它的每一行代码。回顾关键点：</p>
<ul>
<li>每个 Rust 可执行程序都从 <code>fn main()</code> 开始运行</li>
<li><code>println!</code> 是一个<strong>宏</strong>，注意感叹号 <code>!</code></li>
<li><code>rustc main.rs</code> 编译源代码，生成可执行文件</li>
<li>Rust 是预编译语言，生成的二进制文件可以独立分发</li>
</ul>
<p>用 <code>rustc</code> 直接编译对小程序没问题，但随着项目规模增长，管理依赖、组织代码文件会变得很繁琐。下一篇文章，我们来认识 Rust 的构建和包管理工具 <strong>Cargo</strong>，它才是你日常开发的真正起点。</p>
<h1 id="练习题">练习题</h1>
<h2 id="程序入口">程序入口</h2>
</div>
<h2 id="宏的标志">宏的标志</h2>
</div>
<h2 id="缩进风格">缩进风格</h2>
</div>
<h2 id="编译命令">编译命令</h2>
</div>
<h2 id="预编译语言的优势">预编译语言的优势</h2>
</div>
<h2 id="错误修复">错误修复</h2>
<p>下面的代码有<strong>两处</strong>语法错误，找出并修复它们，让程序输出 <code>Hello, world!</code>。</p>
<div class="code-editor" data-block-id="01-rust-basics/02-hello-world#1:5" data-expect-mode="literal" data-expect-pattern="Hello%2C%20world!" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20println(%22Hello%2C%20world!%22)%0A%7D"><pre><code class="language-rust">fn main() {
    println("Hello, world!")
}</code></pre></div> 