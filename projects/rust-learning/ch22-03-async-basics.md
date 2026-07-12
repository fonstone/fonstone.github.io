---
title: "异步编程"
description: "高级主题 - 异步编程"
date: "2026-07-12"
order: 22003
tags: ["异步", "async/await", "Future", "tokio", "async-std"]
est_time: "40 分钟"
---

 <h1 id="为什么需要异步">为什么需要异步</h1>
<h2 id="从一个网络服务器说起">从一个网络服务器说起</h2>
<p>假设你在写一个简单的 Web 服务器，需要处理多个用户同时发来的请求：</p>
<pre><code class="language-text">用户A：请求数据库 → 等待 50ms → 返回结果
用户B：请求数据库 → 等待 50ms → 返回结果
用户C：请求数据库 → 等待 50ms → 返回结果</code></pre>
<p>如果用<strong>单线程同步</strong>处理，只能一个一个来：</p>
<pre><code class="language-text">[等用户A的DB回复 50ms][等用户B的DB回复 50ms][等用户C的DB回复 50ms]
总耗时：150ms</code></pre>
<p>等待数据库回复时，CPU 是完全空闲的。50ms 对 CPU 来说是漫长的虚度——现代 CPU 在 50ms 里可以执行几亿条指令。</p>
<h2 id="多线程好但有代价">多线程：好，但有代价</h2>
<p>第一个想法是用多线程，每个请求一个线程：</p>
<pre><code class="language-text">线程A：[等待50ms]
线程B：   [等待50ms]
线程C：      [等待50ms]
总耗时：~50ms（并行等待）</code></pre>
<p>好多了！但线程有代价：</p>
<ul>
<li><strong>内存</strong>：每个线程默认占用 2MB 栈内存。1000 个并发请求 = 2GB 内存</li>
<li><strong>切换开销</strong>：操作系统在线程间切换需要保存/恢复寄存器，每次切换耗时几微秒</li>
<li><strong>实际上限</strong>：一台普通服务器能稳定运行几千个线程，但很多场景需要万级别的并发</li>
</ul>
<h2 id="异步等待时切换不等着浪费">异步：等待时切换，不等着浪费</h2>
<p><strong>异步编程</strong>的核心思路是：<strong>当一个任务在等待时，切换去执行另一个任务，而不是让线程傻傻地等着</strong>。</p>
<pre><code class="language-text">单线程异步：
任务A开始 → 发起DB请求 → 切换到B
任务B开始 → 发起DB请求 → 切换到C
任务C开始 → 发起DB请求 → DB结果回来
                         → 完成A → 完成B → 完成C
总耗时：~50ms（单线程处理3个请求）</code></pre>
<p>这就像一个高效的餐厅服务员：不是为每位顾客派一个专属服务员（多线程），而是一个服务员在几桌之间来回——桌A在等菜时，去服务桌B，桌B在等菜时，去服务桌C。</p>
<h2 id="什么时候用异步什么时候用线程">什么时候用异步，什么时候用线程</h2>
<table><thead><tr><th>场景</th><th>推荐方案</th></tr></thead><tbody><tr><td>大量 I/O 等待（网络、文件）</td><td><strong>异步</strong>（async/await + tokio）</td></tr><tr><td>CPU 密集计算（加密、图像处理）</td><td><strong>多线程</strong>（rayon 或 thread::spawn）</td></tr><tr><td>简单脚本，不需要并发</td><td><strong>同步</strong>就好</td></tr></tbody></table>
<h1 id="future-与-asyncawait">Future 与 async/await</h1>
<p>Rust 异步编程建立在两个互补的概念上：</p>
<ul>
<li><strong><code>Future</code></strong>：代表”一个尚未完成的计算”的类型。你可以把它想成外卖单——下单之后外卖还没到，但你手上有张单子，随时可以去查进度。<code>Future</code> 只是描述”如何得到结果”，本身什么都不执行。</li>
<li><strong><code>async</code>/<code>await</code></strong>：让你用看起来像同步的写法来组合 <code>Future</code>。<code>async fn</code> 把普通函数变成返回 <code>Future</code> 的函数；<code>.await</code> 在等待某个 <code>Future</code> 完成时暂停当前任务，让运行时去处理其他事情，完成后再回来继续。</li>
</ul>
<p>两者的分工：<code>Future</code> 是<strong>机制</strong>（描述一件异步的事），<code>async</code>/<code>await</code> 是<strong>语法糖</strong>（让你更自然地写出和组合这些 <code>Future</code>）。</p>
<h2 id="future对未来结果的承诺">Future：对”未来结果”的承诺</h2>
<p>Rust 异步编程的核心概念是 <strong><code>Future</code></strong>。</p>
<p><code>Future</code> 就是一个<strong>尚未完成的计算的描述</strong>——不是”现在给你结果”，而是”我知道怎么得到结果，但可能要等一会儿”。</p>
<p>你可以把 <code>Future</code> 想象成外卖单：你下单（创建 Future），但外卖还没到（结果还没出来）。拿到外卖单本身并不会触发任何计算——只有当外卖员轮询”这单做好了吗？“时，才会推进进度。</p>
<p><code>Future</code> trait 的核心定义（简化版）：</p>
<pre><code class="language-rust">// 标准库里 Future trait 的核心（简化）
trait Future {
    type Output;  // 最终产出的值的类型

    fn poll(&amp;mut self) -&gt; Poll&lt;Self::Output&gt;;
    // Poll::Pending  → 还没好，等会儿再问
    // Poll::Ready(v) → 好了，结果是 v
}</code></pre>
<p><strong>关键特性</strong>：<code>Future</code> 是<strong>惰性的</strong>。创建一个 <code>Future</code> 不会让任何事情发生——必须有人（运行时）来”驱动”它（调用 <code>poll</code>），它才会推进。</p>
<h2 id="asyncawait让你写出异步代码看起来像同步">async/await：让你写出异步代码看起来像同步</h2>
<p>直接操作 <code>Future</code> 和手动实现状态机非常繁琐。<code>async</code>/<code>await</code> 语法让这件事变简单：</p>
<ul>
<li><strong><code>async fn</code></strong>：将一个函数标记为异步，函数体可以”暂停等待”</li>
<li><strong><code>.await</code></strong>：在异步函数内等待一个 <code>Future</code> 完成，等待期间可以切换去做别的</li>
</ul>
<blockquote>
<p>下面示例用到了 <code>tokio::time::sleep</code>——tokio 是 Rust 最常用的异步运行时，下一节会详细介绍。这里先把它当作”等待一段时间”的工具，关注 <code>async</code>/<code>.await</code> 的写法即可。</p>
</blockquote>
<pre><code class="language-rust">// async fn 的返回类型变成 impl Future&lt;Output = i32&gt;
async fn fetch_data() -&gt; i32 {
    // 模拟异步等待
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    //                                                       ^^^^^^
    // .await 在这里"暂停"这个函数，等待 sleep 完成
    // 暂停期间，运行时可以去执行别的任务
    42
}

async fn main_logic() {
    let result = fetch_data().await;
    // fetch_data() 返回一个 Future，.await 等它完成后才继续
    println!("结果：{}", result);
}</code></pre>
<p>注意：<strong><code>async fn</code> 本身不会立即执行</strong>——调用 <code>async fn</code> 只是创建了一个 <code>Future</code> 对象，需要被 <code>.await</code> 或交给运行时才会真正运行。</p>
<pre><code class="language-rust">// 这两行代码没有任何区别——只是"描述了计算"，什么都没执行
let future1 = fetch_data();  // 没有 .await，什么都没发生
let future2 = fetch_data();  // 同上</code></pre>
<h2 id="运行时谁来驱动-future">运行时：谁来驱动 Future</h2>
<p><code>Future</code> 是惰性的——你创建了它，但什么都不会发生，需要有人来”推”它。这个推动者就叫<strong>异步运行时（async runtime）</strong>。</p>
<p>你可以把运行时理解成一个管家：你把一堆任务（<code>Future</code>）交给它，它负责在各个任务之间来回调度——某个任务在等网络，先放一放，去推进另一个；网络数据来了，再回来继续。</p>
<p>Rust 标准库只定义了 <code>Future</code> trait 本身，<strong>没有内置运行时</strong>，需要你选一个第三方库。最常用的是 <strong>tokio</strong>：</p>
<pre><code class="language-toml">[dependencies]
tokio = { version = "1", features = ["full"] }</code></pre>
<blockquote>
<p>为什么不内置？因为嵌入式设备、命令行工具、Web 服务器对运行时的要求差别太大，一个统一的实现无法满足所有场景。Rust 的做法是：标准库只定规范，具体实现交给生态。</p>
</blockquote>
<h2 id="第一个真正的异步程序">第一个真正的异步程序</h2>
<p>用 <code>#[tokio::main]</code> 宏告诉编译器：用 tokio 运行时来执行这个 <code>async main</code>：</p>
<pre><code class="language-rust">use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    println!("开始");
    slow_greeting("Alice").await;
    slow_greeting("Bob").await;
    println!("结束");
}

async fn slow_greeting(name: &amp;str) {
    sleep(Duration::from_millis(100)).await;
    println!("你好，{}！", name);
}</code></pre>
<blockquote>
<p><strong>注意</strong>：这段代码需要在有 tokio 依赖的项目中运行（Playground 环境不支持 tokio）。
你可以通过 <code>cargo new my-async-app</code> 新建项目后自行尝试。</p>
</blockquote>
<h2 id="并发执行真正发挥异步的威力">并发执行：真正发挥异步的威力</h2>
<p>上面的例子是<strong>顺序</strong>执行两个异步任务（先等 Alice，再等 Bob）。异步真正的威力在于<strong>并发</strong>：</p>
<pre><code class="language-rust">use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    // tokio::join! 并发运行多个 Future，等所有都完成
    let (a, b) = tokio::join!(
        slow_greet("Alice"),
        slow_greet("Bob")
    );
    println!("{}", a);
    println!("{}", b);
    println!("两个任务并发完成！");
}

async fn slow_greet(name: &amp;str) -&gt; String {
    sleep(Duration::from_millis(100)).await;
    format!("你好，{}！", name)
}
// 总耗时约 100ms（而不是 200ms）</code></pre>
<p><code>tokio::spawn</code> 则用于”后台运行”——不等待它完成就继续：</p>
<pre><code class="language-rust">use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    // spawn 把任务丢到后台，立即返回一个 JoinHandle
    let handle = tokio::spawn(async {
        sleep(Duration::from_millis(100)).await;
        println!("后台任务完成！");
        42  // 任务的返回值
    });

    println!("主任务继续运行...");

    // 等待后台任务完成，获取结果
    let result = handle.await.unwrap();
    println!("后台任务的结果：{}", result);
}</code></pre>
<h1 id="练习题">练习题</h1>
<h2 id="异步编程概念测验">异步编程概念测验</h2>
</div>
</div>
</div>
</div>
</div> 