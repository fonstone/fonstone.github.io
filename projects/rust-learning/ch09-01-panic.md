---
title: "panic! 与不可恢复错误"
description: "错误处理 - panic! 与不可恢复错误"
date: "2026-07-12"
order: 9001
tags: ["panic", "错误处理", "backtrace", "不可恢复错误", "index out of bounds"]
est_time: "15 分钟"
---

 <h1 id="错误的两种类型">错误的两种类型</h1>
<p>所有程序都会遇到错误——文件不存在、用户输入了非法数据、网络连接超时。Rust 把这些情况分成截然不同的两类，并用不同的机制分别处理：</p>
<img alt="error" src="/images/rust/error.svg" style="max-width:100%;margin:1rem 0;"/>
<ul>
<li>
<p><strong>不可恢复的错误（unrecoverable errors）</strong>：程序遭遇了”不应该发生”的状态，继续运行会带来更大的风险。最典型的例子是代码中的 bug——访问了数组越界位置、违反了程序的核心不变量。这类情况的正确处理是<strong>立即停止程序</strong>。</p>
</li>
<li>
<p><strong>可恢复的错误（recoverable errors）</strong>：错误在预期范围内，程序可以做出响应并继续。文件不存在 → 提示用户或创建文件；格式解析失败 → 报告给调用者处理。这类错误用 <code>Result&lt;T, E&gt;</code> 来处理，下一篇会详细讲解。</p>
</li>
</ul>
<p>本文聚焦第一类：<strong>不可恢复的错误</strong>和 <code>panic!</code> 宏。</p>
<h2 id="使用-panic-宏">使用 panic! 宏</h2>
<p><code>panic!</code> 宏用于”程序无法继续执行”的情况，调用后它会：</p>
<ol>
<li>打印一条错误信息</li>
<li>清理调用栈（默认行为，称为”展开”）</li>
<li>退出程序</li>
</ol>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20panic!(%22%E5%8F%91%E7%94%9F%E4%BA%86%E4%B8%8D%E5%8F%AF%E6%81%A2%E5%A4%8D%E7%9A%84%E9%94%99%E8%AF%AF%EF%BC%81%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    panic!("发生了不可恢复的错误！");
}</code></pre></div>
<p>运行后会看到类似这样的输出：</p>
<pre><code class="language-text">thread 'main' panicked at '发生了不可恢复的错误！', src/main.rs:2:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace</code></pre>
<p>第一行告诉你：在哪个文件的哪一行触发了 panic，以及消息内容。第二行提示可以用 <code>RUST_BACKTRACE=1</code> 查看完整调用链。</p>
<h2 id="自动触发的-panic">自动触发的 panic</h2>
<p>很多时候 panic 不是手动调用的，而是 Rust 内部检测到非法操作时<strong>自动触发</strong>的。最常见的例子是访问越界索引：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20v%5B99%5D)%3B%20%20%2F%2F%20%E5%8F%AA%E6%9C%89%203%20%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%8Cindex%2099%20%E4%B8%8D%E5%AD%98%E5%9C%A8%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3];
    println!("{}", v[99]);  // 只有 3 个元素，index 99 不存在
}</code></pre></div>
<p>Rust 会 panic 并提示：</p>
<pre><code class="language-text">thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99'</code></pre>
<p><strong>为什么 Rust 选择 panic 而不是返回垃圾值？</strong> 这是有意识的安全设计。C 语言中，越界访问会直接读取那块内存里碰巧在那儿的数据，这叫<strong>缓冲区溢出（buffer overread）</strong>，是大量安全漏洞的根源。Rust 宁可程序立即崩溃，也不允许读取不属于该数组的内存。</p>
<h2 id="用-backtrace-定位问题">用 backtrace 定位问题</h2>
<p>当 panic 发生在标准库内部时，错误信息指向的是标准库的源码，不是你的代码。这时候 <strong>backtrace（调用链追踪）</strong> 很有用。</p>
<p>设置环境变量 <code>RUST_BACKTRACE=1</code> 再运行，可以看到从程序入口到 panic 点的完整调用链：</p>
<pre><code class="language-bash">RUST_BACKTRACE=1 cargo run</code></pre>
<p>输出中每一行是一个<strong>栈帧</strong>（函数调用记录）。读 backtrace 的关键是<strong>从上往下找第一个写着你自己文件名的行</strong>——那就是问题的发源地。</p>
<p>对于上面的越界例子，backtrace 里会有一行类似：</p>
<pre><code class="language-text">12: panic_example::main
         at src/main.rs:3</code></pre>
<p>这告诉你：问题在 <code>src/main.rs</code> 的第 3 行，也就是 <code>v[99]</code> 那里。</p>
<blockquote>
<p><strong>注意</strong>：backtrace 需要程序以 debug 模式编译（不加 <code>--release</code>）。Release 模式下可能缺少调试符号，输出不够完整。</p>
</blockquote>
<h2 id="展开与终止panic-的两种行为">展开与终止：panic 的两种行为</h2>
<p>panic 触发后，Rust 默认的行为是<strong>展开（unwinding）</strong>：顺着调用栈往回走，逐个清理各函数的数据（调用析构函数、释放内存）。这保证资源正确释放，但有一定开销。</p>
<p>如果你追求更小的二进制文件，可以改为<strong>终止（abort）</strong>：直接退出进程，让操作系统回收内存。在 <code>Cargo.toml</code> 里配置：</p>
<pre><code class="language-toml">[profile.release]
panic = 'abort'</code></pre>
<p>这样 release 模式下 panic 时会直接终止，不展开调用栈。</p>
<blockquote>
<p>对于大多数应用来说，默认的展开行为就够用了。<code>panic = 'abort'</code> 主要用在两种场景：一是对二进制体积极度敏感的项目；二是嵌入式开发（<code>no_std</code> 环境），那里没有操作系统支持，调用栈展开的实现方式与具体芯片架构强绑定（ARM、RISC-V 等各不相同），通常直接 abort 更可靠。嵌入式场景还需要用 <code>#[panic_handler]</code> 自定义 panic 发生时的行为（比如让指示灯闪烁或复位芯片），但这属于嵌入式开发的专题内容。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="panic-基础测验">panic 基础测验</h2>
<pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3];
    let x = v[5];
    println!("{}", x);
}</code></pre>
</div>
</div>
</div>
</div>
</div> 