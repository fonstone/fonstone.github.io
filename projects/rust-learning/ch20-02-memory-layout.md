---
title: "内存布局与链接脚本"
description: "嵌入式 Rust - 内存布局与链接脚本"
date: "2026-07-12"
order: 20002
tags: ["内存布局", "链接脚本", "linker.x", "内存映射"]
est_time: "30 分钟"
---

 <h1 id="内存布局与链接脚本">内存布局与链接脚本</h1>
<p>在嵌入式开发中，你必须比在 PC 开发时更清楚代码和数据被放在了哪里。嵌入式芯片的存储空间通常是由不连续的地址块组成的。</p>
<h2 id="1-嵌入式内存映射">1. 嵌入式内存映射</h2>
<p>典型的 32 位微控制器（如 STM32）的内存地址空间如下：</p>
<ul>
<li><strong><code>0x0800_0000</code> (FLASH)</strong>：代码指令和只读常量。断电后不会丢失。</li>
<li><strong><code>0x2000_0000</code> (RAM)</strong>：运行时变量、堆栈（Stack）和堆（Heap）。速度极快，但断电即失。</li>
<li><strong><code>0x4000_0000</code> (外设寄存器)</strong>：映射到特定的地址，用于控制 GPIO、UART 等硬件。</li>
</ul>
<h2 id="2-链接脚本的作用">2. 链接脚本的作用</h2>
<p>编译器（rustc）生成的代码只是逻辑上的指令，它并不知道你的具体芯片有多少 Flash 或 RAM。</p>
<p><strong>链接脚本 (Linker Script)</strong> 的任务是：</p>
<ol>
<li><strong>定义物理边界</strong>：告诉链接器「这里有 128KB Flash，从 0x08000000 开始」。</li>
<li><strong>分配段 (Sections)</strong>：告诉链接器「把所有指令放到 FLASH 中，把变量放到 RAM 中」。</li>
</ol>
<h2 id="3-rust-中的-memoryx">3. Rust 中的 <code>memory.x</code></h2>
<p>在 Rust 嵌入式生态（尤其是 Cortex-M）中，我们通常不需要编写复杂的 GNU Linker 脚本，只需要在一个简单的 <code>memory.x</code> 文件中定义内存区域：</p>
<pre><code class="language-text">/* memory.x */
MEMORY
{
  /* 我们可以存放代码和常量的地方 */
  FLASH : ORIGIN = 0x08000000, LENGTH = 128K

  /* 我们可以存放变量和堆栈的地方 */
  RAM   : ORIGIN = 0x20000000, LENGTH = 20K
}</code></pre>
<h2 id="4-程序段-program-sections">4. 程序段 (Program Sections)</h2>
<p>链接器会根据 <code>memory.x</code> 将代码分成不同的「段」：</p>
<h3 id="text-代码段"><code>.text</code> (代码段)</h3>
<p>存放所有的可执行机器指令。</p>
<ul>
<li><strong>位置</strong>：FLASH。</li>
<li><strong>特点</strong>：只读。</li>
</ul>
<h3 id="rodata-只读数据段"><code>.rodata</code> (只读数据段)</h3>
<p>存放常量。</p>
<ul>
<li><strong>位置</strong>：FLASH。</li>
<li><strong>示例</strong>：<code>static MESSAGE: &amp;str = "Hello";</code> 中的字符串。</li>
</ul>
<h3 id="data-已初始化变量段"><code>.data</code> (已初始化变量段)</h3>
<p>存放初始值不为零的全局变量。</p>
<ul>
<li><strong>挑战</strong>：这些变量需要能读写（在 RAM），但初始值必须保存在断电不丢失的地方（在 FLASH）。</li>
<li><strong>处理</strong>：运行时入口（<code>cortex-m-rt</code>）会在启动时自动将这些值从 FLASH 拷贝到 RAM。</li>
</ul>
<h3 id="bss-未初始化变量段"><code>.bss</code> (未初始化变量段)</h3>
<p>存放初始值为零的全局变量。</p>
<ul>
<li><strong>处理</strong>：不需要在 FLASH 中存储初始值，启动时直接在 RAM 中清零即可。</li>
</ul>
<h2 id="5-堆栈-stack--heap">5. 堆栈 (Stack &amp; Heap)</h2>
<ul>
<li><strong>栈 (Stack)</strong>：用于局部变量和函数调用信息。在 Rust 嵌入式中，栈通常从 RAM 的末尾开始，向下增长。</li>
<li><strong>堆 (Heap)</strong>：如果你在 <code>no_std</code> 下使用了 <code>alloc</code> 库，你需要手动定义一块 RAM 区域作为堆。</li>
</ul>
<h2 id="6-lma-与-vma">6. LMA 与 VMA</h2>
<p>这是链接脚本中最容易混淆的概念：</p>
<ul>
<li><strong>LMA (Load Memory Address)</strong>：加载地址。即程序烧录进芯片时，数据所在的物理位置（通常是 FLASH）。</li>
<li><strong>VMA (Virtual Memory Address)</strong>：运行地址。即程序运行时，数据应该被 CPU 访问的地址（对于变量来说，是 RAM）。</li>
</ul>
<h1 id="练习题">练习题</h1>
<h2 id="核心概念测验">核心概念测验</h2>
</div>
</div>
</div>
</div>
</div> 