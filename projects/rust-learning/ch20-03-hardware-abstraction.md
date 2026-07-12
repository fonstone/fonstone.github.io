---
title: "硬件抽象：PAC 与 HAL"
description: "嵌入式 Rust - 硬件抽象：PAC 与 HAL"
date: "2026-07-12"
order: 20003
tags: ["PAC", "HAL", "svd2rust", "embedded-hal"]
est_time: "30 分钟"
---

 <h1 id="硬件抽象如何与芯片交谈">硬件抽象：如何与芯片交谈</h1>
<p>在 C 语言中，操作硬件通常涉及到大量的宏（Macros）和指针强转（如 <code>*(uint32_t*)0x4001080C = 0x01</code>）。这种方式非常容易出错，且编译器无法提供任何保护。</p>
<p>Rust 的嵌入式生态采用了一套三层模型，将硬件操作逐步抽象：</p>
<h2 id="1-寄存器访问层pac">1. 寄存器访问层（PAC）</h2>
<p><strong>PAC (Peripheral Access Crate)</strong> 是最底层的抽象。它通常由工具 <strong><code>svd2rust</code></strong> 直接从芯片厂商提供的 SVD 文件（XML 格式的描述文件）自动生成。</p>
<p>PAC 把内存地址变成了结构体。</p>
<h3 id="传统的-c-风格操作">传统的 C 风格操作：</h3>
<pre><code class="language-c">// 很容易写错地址或位偏移
RCC-&gt;APB2ENR |= (1 &lt;&lt; 3);</code></pre>
<h3 id="rust-pac-风格操作">Rust PAC 风格操作：</h3>
<pre><code class="language-rust">// 类型安全的 API
dp.RCC.apb2enr.modify(|_, w| w.iopben().set_bit());</code></pre>
<p>在 PAC 中，你依然是在操作寄存器，但 Rust 的闭包 API 确保了：</p>
<ul>
<li><strong>原子性</strong>：<code>modify</code> 会处理读-写循环。</li>
<li><strong>只读/只写保护</strong>：你无法写入一个被标记为只读的寄存器。</li>
<li><strong>字段校验</strong>：无法设置非法的位组合。</li>
</ul>
<h2 id="2-硬件抽象层hal">2. 硬件抽象层（HAL）</h2>
<p><strong>HAL (Hardware Abstraction Layer)</strong> 在 PAC 之上提供了更高级、更符合人体工程学的 API。它不要求你记住寄存器名称，而是操作具体的业务逻辑（如「初始化串口」）。</p>
<pre><code class="language-rust">// 使用 HAL 初始化 GPIO B 的第 12 号引脚为推挽输出
let gpiob = dp.GPIOB.split();
let mut led = gpiob.pb12.into_push_pull_output();

led.set_high(); // 点亮 LED</code></pre>
<h2 id="3-核心机制类型状态模式-typestate-pattern">3. 核心机制：类型状态模式 (Typestate Pattern)</h2>
<p>这是 Rust 嵌入式开发最神奇的地方。利用 Rust 的 <strong>所有权机制</strong>，我们可以将硬件的<strong>状态</strong>编码到类型中。</p>
<h3 id="场景配置一个引脚">场景：配置一个引脚</h3>
<p>一个 GPIO 引脚在同一时间只能是「输入」或「输出」，绝不能同时是两者。</p>
<pre><code class="language-rust">let pin = gpioa.pa1.into_floating_input(); // 此时 pin 的类型是 Pin&lt;Input&lt;Floating&gt;&gt;
// pin.set_high(); // ❌ 编译报错！输入引脚没有 set_high 方法

let output_pin = pin.into_push_pull_output(); // 消耗原引脚，返回 Pin&lt;Output&lt;PushPull&gt;&gt;
output_pin.set_high(); // ✅ 正常工作</code></pre>
<p>这意味着：<strong>如果你错误地在代码里操作了状态不对的硬件，编译器会拒绝编译。</strong> 这种「编译期拦截」极大地减少了硬件调试的压力。</p>
<h2 id="4-通用标准embedded-hal">4. 通用标准：Embedded-HAL</h2>
<p>如果你写了一个 OLED 屏幕的驱动，你肯定希望它既能跑在 STM32 上，也能跑在 ESP32 上。</p>
<p><strong><code>embedded-hal</code></strong> 定义了一套标准的 Trait（接口）：</p>
<ul>
<li><code>OutputPin</code>（输出引脚）</li>
<li><code>SpiBus</code>（SPI 总线）</li>
<li><code>I2cAddress</code>（I2C 地址）</li>
</ul>
<p>只要你的驱动程序要求接收一个「实现了 <code>OutputPin</code> 的类型」，那么它就可以在任何实现了该标准的硬件平台上复用。这促成了 Rust 嵌入式社区极其丰富的驱动库（Display, Sensor, Radio 等）。</p>
<h1 id="练习题">练习题</h1>
<h2 id="核心概念测验">核心概念测验</h2>
</div>
</div>
</div>
</div>
</div> 