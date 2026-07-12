---
title: "裸机开发基础：no_std 环境"
description: "嵌入式 Rust - 裸机开发基础：no_std 环境"
date: "2026-07-12"
order: 20001
tags: ["no_std", "裸机", "嵌入式", "core crate", "alloc crate"]
est_time: "25 分钟"
---

 <h1 id="裸机开发基础">裸机开发基础</h1>
<p>在传统的软件开发中，我们习惯于有操作系统（OS）的支持。操作系统为我们提供了文件系统、网络协议栈、内存管理（堆分配）以及标准库（<code>std</code>）。</p>
<p>但在嵌入式裸机（Bare-metal）开发中，这些都不存在。我们的代码直接运行在处理器上。为了让 Rust 在这种环境下运行，我们必须移除对操作系统的依赖。</p>
<h2 id="no_std-属性"><code>#[no_std]</code> 属性</h2>
<p>默认情况下，Rust 程序会链接标准库 <code>std</code>。<code>std</code> 内部依赖于操作系统的系统调用（如 <code>read</code>, <code>write</code>, <code>malloc</code> 等）。在裸机环境下，我们必须声明：</p>
<pre><code class="language-rust">#![no_std]</code></pre>
<p>这告诉编译器，我们不使用 <code>std</code> 库，转而只使用 <strong><code>core</code> 库</strong>。<code>core</code> 库是 <code>std</code> 的子集，它不依赖于任何硬件或操作系统特性，包含了基础的语言定义（如 <code>Option</code>, <code>Result</code>, 基础数值运算等）。</p>
<h3 id="std-vs-core-vs-alloc"><code>std</code> vs <code>core</code> vs <code>alloc</code></h3>
<ul>
<li><strong><code>core</code></strong>：最基础的逻辑，不涉及系统调用，不涉及堆内存。</li>
<li><strong><code>alloc</code></strong>：提供了堆内存分配相关的类型（如 <code>Vec</code>, <code>Box</code>, <code>String</code>），但需要你手动实现一个「堆分配器」。</li>
<li><strong><code>std</code></strong>：完整的标准库，包含了 <code>core</code> 和 <code>alloc</code> 的内容，并增加了系统交互（I/O 等）。</li>
</ul>
<h2 id="缺失的拼图panic-处理">缺失的拼图：Panic 处理</h2>
<p>由于没有标准库，Rust 遇到致命错误（Panic）时，不知道该如何处理（默认是打印到控制台并退出进程，但在裸机上没有控制台，也没有进程）。因此，我们必须手动定义一个 <strong>Panic 处理器</strong>。</p>
<p>我们需要引入一个提供该功能的 crate（如 <code>panic-halt</code>），或者手动编写：</p>
<pre><code class="language-rust">use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &amp;PanicInfo) -&gt; ! {
    // 这里可以是无限循环，或者是重启硬件
    loop {}
}</code></pre>
<p>注意返回类型是 <code>!</code>（发散类型），表示该函数永远不会返回。</p>
<h2 id="程序入口点entry">程序入口点：<code>#[entry]</code></h2>
<p>在普通程序中，入口是 <code>main</code> 函数，但它实际上是由操作系统在执行了一些初始化（Runtime runtime）后调用的。在裸机上，我们需要用特定的属性来标记程序的真正入口。</p>
<p>通常我们会使用 <code>cortex-m-rt</code> 等 crate 提供的 <code>#[entry]</code> 宏：</p>
<pre><code class="language-rust">#![no_std]
#![no_main] // 告知编译器我们没有标准的 main 函数

use cortex_m_rt::entry;

#[entry]
fn main() -&gt; ! {
    // 硬件初始化逻辑
    loop {
        // 应用程序主循环
    }
}</code></pre>
<h2 id="最小裸机程序模板">最小裸机程序模板</h2>
<p>让我们把这些拼凑起来，看一个完整的「极简」Rust 裸机工程文件：</p>
<pre><code class="language-rust">#![no_std]
#![no_main]

// 假设我们引入了 panic 处理 crate
use panic_halt as _;
use cortex_m_rt::entry;

#[entry]
fn main() -&gt; ! {
    let mut _counter = 0;

    loop {
        _counter += 1;
        // 在这里，没有 printf，你可能需要操作引脚让 LED 闪烁
    }
}</code></pre>
<h2 id="为什么没有-string-和-vec">为什么没有 <code>String</code> 和 <code>Vec</code>？</h2>
<p>在 <code>no_std</code> 环境下，你会发现原本常用的 <code>String</code> 或 <code>Vec&lt;u8&gt;</code> 无法直接编译。这是因为它们需要 <strong>动态堆内存分配（Heap）</strong>。</p>
<p>在嵌入式开发中，内存非常宝贵（可能只有几十 KB），程序通常使用 <strong>栈（Stack）</strong> 或 <strong>静态分配（Static）</strong>。</p>
<ul>
<li>如果你需要定长的缓冲区，使用数组：<code>let mut buffer = [0u8; 64];</code></li>
<li>如果非要用 <code>Vec</code>，你需要显式地配置一个「堆分配器」（Allocator），并使用 <code>alloc</code> crate。</li>
</ul>
<h1 id="练习题">练习题</h1>
<h2 id="核心概念测验">核心概念测验</h2>
</div>
</div>
</div>
</div>
</div>
</div> 