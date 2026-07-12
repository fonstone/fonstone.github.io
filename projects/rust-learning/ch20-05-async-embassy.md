---
title: "异步嵌入式：Embassy 框架"
description: "嵌入式 Rust - 异步嵌入式：Embassy 框架"
date: "2026-07-12"
order: 20005
tags: ["Embassy", "异步", "async/await", "嵌入式异步"]
est_time: "40 分钟"
---

 <h1 id="异步嵌入式embassy-框架">异步嵌入式：Embassy 框架</h1>
<p>在传统的嵌入式开发中，我们通常只有两种选择：</p>
<ol>
<li><strong>前后台模式 (Superloop)</strong>：一个 <code>loop</code> 跑到底，所有的等待（如等待串口数据）都是阻塞的。</li>
<li><strong>中断驱动</strong>：通过大量复杂的中断回调来处理异步事件，代码很快就会变成难懂的「面条代码」。</li>
</ol>
<p><strong>Embassy</strong> (Embedded + Async) 的出现彻底改变了这一局面。它将 Rust 强大的 <code>async/await</code> 特性带入了嵌入式世界。</p>
<h2 id="1-为什么在嵌入式中使用异步">1. 为什么在嵌入式中使用异步？</h2>
<h3 id="极简的并发">极简的并发</h3>
<p>假设你要同时闪烁两个 LED，频率不同。在 <code>async</code> 环境下，代码非常直观：</p>
<pre><code class="language-rust">#[embassy_executor::task]
async fn blink_led(mut pin: Output&lt;'static, AnyPin&gt;, interval: Duration) {
    loop {
        pin.set_high();
        Timer::after(interval).await;
        pin.set_low();
        Timer::after(interval).await;
    }
}</code></pre>
<p>你只需要开启两个 <code>task</code>，它们就会并发运行。不需要手写复杂的定时器状态机。</p>
<h3 id="极致的低功耗">极致的低功耗</h3>
<p>Embassy 的执行器（Executor）非常聪明。当所有异步任务都处于 <code>await</code>（挂起）状态时，它会自动让 CPU 进入 <strong>低功耗睡眠模式</strong>（如 ARM 的 WFI 指令）。只有当硬件中断发生时，处理器才会被唤醒。</p>
<h2 id="2-embassy-的核心组件">2. Embassy 的核心组件</h2>
<ul>
<li><strong><code>embassy-executor</code></strong>：异步任务调度器。它负责轮询所有任务，且<strong>不需要堆内存分配</strong>。</li>
<li><strong><code>embassy-time</code></strong>：提供 <code>Timer</code>, <code>Instant</code>, <code>Duration</code> 等时间 API，支持毫秒甚至微秒精度。</li>
<li><strong><code>embassy-stm32</code> / <code>nrf</code> / <code>rp</code></strong>：针对特定芯片的 HAL 层。每个外设（如 UART, SPI）都提供了异步接口。</li>
</ul>
<h2 id="3-一个典型的-embassy-程序结构">3. 一个典型的 Embassy 程序结构</h2>
<pre><code class="language-rust">use embassy_executor::Spawner;
use embassy_time::{Duration, Timer};
use {panic_halt as _, embassy_stm32 as _};

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    // 初始化硬件
    let p = embassy_stm32::init(Default::default());

    // 派发一个后台任务
    spawner.spawn(my_task()).unwrap();

    loop {
        println!("主循环运行中...");
        Timer::after(Duration::from_secs(1)).await;
    }
}

#[embassy_executor::task]
async fn my_task() {
    loop {
        // 执行异步操作
        Timer::after(Duration::from_millis(500)).await;
    }
}</code></pre>
<h2 id="4-异步-vs-rtos-实时操作系统">4. 异步 vs RTOS (实时操作系统)</h2>
<p>Embassy 虽然提供了类似 RTOS 的便利（多任务、同步原语），但它有显著的优势：</p>
<ul>
<li><strong>更小的开销</strong>：由于 <code>async</code> 基于编译器生成的协程，它不需要为每个任务分配独立的栈空间，内存消耗极低。</li>
<li><strong>更强的类型检查</strong>：异步接口能更好地感知「借用和所有权」，避免了 RTOS 中常见的共享资源竞争问题。</li>
</ul>
<h1 id="练习题">练习题</h1>
<h2 id="核心概念测验">核心概念测验</h2>
</div>
</div>
</div>
</div>
</div> 