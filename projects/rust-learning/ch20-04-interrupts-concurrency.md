---
title: "中断与并发安全"
description: "嵌入式 Rust - 中断与并发安全"
date: "2026-07-12"
order: 20004
tags: ["中断", "interrupt", "临界区", "RTIC", "并发安全"]
est_time: "35 分钟"
---

 <h1 id="中断与并发安全">中断与并发安全</h1>
<p>在嵌入式开发中，<strong>中断（Interrupt）</strong> 是处理异步事件的核心机制。当按键被按下、串口接收到数据或定时器到时，硬件会自动「中断」主程序的执行，跳转去运行一段特定的代码：<strong>中断服务程序（ISR, Interrupt Service Routine）</strong>。</p>
<p>这引入了一个经典的并发难题：<strong>如何在 <code>main</code> 循环和 <code>ISR</code> 之间安全地共享数据？</strong></p>
<h2 id="1-危险的全局变量">1. 危险的全局变量</h2>
<p>在 C 语言中，我们通常使用 <code>static volatile</code> 全局变量。但在 Rust 中，全局可变变量是 <code>static mut</code>，通过它修改数据是 <strong>不可取且极度危险的</strong>，因为 <code>main</code> 修改一半时，中断可能随时发生并试图再次修改，导致数据竞争。</p>
<h2 id="2-临界区critical-section">2. 临界区（Critical Section）</h2>
<p>解决共享数据最基础的方法是：<strong>在操作共享变量时临时禁用所有中断</strong>。这段被保护的代码块被称为「临界区」。</p>
<p>在 Rust 中，我们通常使用 <code>critical-section</code> crate。</p>
<pre><code class="language-rust">use critical_section as cs;

cs::with(|cs_token| {
    // 这个闭包内的代码在运行期间，中断是禁用的
    // cs_token 是一个「令牌」，证明你已经安全地合上了锁
});</code></pre>
<h2 id="3-裸机下的-mutex-与-refcell">3. 裸机下的 Mutex 与 RefCell</h2>
<p>为了在不引发数据竞争的前提下共享资源，Rust 嵌入式社区使用了一种特殊的 <code>Mutex</code>（互设锁）。</p>
<h3 id="类型定义">类型定义：</h3>
<pre><code class="language-rust">use core::cell::RefCell;
use critical_section::Mutex;

// 定义一个被锁保护的、可内部变更的全局变量
static SHARED_DATA: Mutex&lt;RefCell&lt;u32&gt;&gt; = Mutex::new(RefCell::new(0));</code></pre>
<h3 id="访问数据">访问数据：</h3>
<pre><code class="language-rust">fn handle_interrupt() {
    // 1. 进入临界区（获取令牌）
    critical_section::with(|cs| {
        // 2. 借用互斥锁并传入令牌
        let mut data = SHARED_DATA.borrow(cs).borrow_mut();
        // 3. 安全地操作数据
        *data += 1;
    });
}</code></pre>
<p><strong>为什么需要 <code>cs</code> 令牌？</strong>
Rust 的嵌入式 <code>Mutex</code> 要求在调用 <code>borrow</code> 时必须传入一个 <code>CriticalSection</code> 令牌。由于获取令牌的唯一途径是调用 <code>cs::with</code>（这会禁用中断），这就保证了 <strong>只要你在持有数据，中断就一定发不生</strong>。</p>
<h2 id="4-原子操作atomic">4. 原子操作（Atomic）</h2>
<p>如果你只需要共享一个简单的数值（如标志位或计数器），使用原子类型（Atomics）是效率更高、成本更低的方案。由于硬件指令集支持原子读-改-写，这种操作本身就不受中断干扰，因此不需要进入临界区。</p>
<pre><code class="language-rust">use core::sync::atomic::{AtomicBool, Ordering};

static IS_PRESSED: AtomicBool = AtomicBool::new(false);

fn main_loop() {
    if IS_PRESSED.load(Ordering::SeqCst) {
        // 处理按键逻辑
        IS_PRESSED.store(false, Ordering::SeqCst);
    }
}

// 中断函数
fn on_button_click() {
    IS_PRESSED.store(true, Ordering::SeqCst);
}</code></pre>
<h2 id="5-独占外设peripherals-的单例性">5. 独占外设：<code>Peripherals</code> 的单例性</h2>
<p>Rust 嵌入式库通过 <code>take()</code> 方法确保硬件外设是<strong>单例</strong>的。</p>
<pre><code class="language-rust">let dp = pac::Peripherals::take().unwrap();</code></pre>
<p>如果你的程序中两个地方同时尝试 <code>take()</code>，第二次会返回 <code>None</code>。这在编译期（或运行期初始化时）就防止了两个不同的模块同时配置同一个定时器或串口。</p>
<h1 id="练习题">练习题</h1>
<h2 id="核心概念测验">核心概念测验</h2>
</div>
</div>
</div>
</div>
</div> 