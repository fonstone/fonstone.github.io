---
title: "线程"
description: "并发编程 - 线程"
date: "2026-07-12"
order: 14001
tags: ["线程", "thread::spawn", "JoinHandle", "move 闭包", "并发"]
est_time: "25 分钟"
---

 <h1 id="并发与线程">并发与线程</h1>
<p>在大多数现代操作系统里，程序运行在一个<strong>进程</strong>（process）中，操作系统管理着多个进程。而进程内部，还可以拆分出多个同时运行的独立单元，叫做<strong>线程</strong>（thread）。</p>
<p>把工作分给多个线程能提升性能，但也带来了新挑战：</p>
<ul>
<li><strong>竞争状态</strong>（Race condition）：多个线程以不可预期的顺序读写同一份数据</li>
<li><strong>死锁</strong>（Deadlock）：两个线程互相等待对方释放资源，永远卡住</li>
<li>只在特定时机才复现的玄学 bug</li>
</ul>
<p>Rust 的设计哲学是「无畏并发」——通过所有权和类型系统，在<strong>编译期</strong>消除绝大部分并发错误。</p>
<h2 id="线程模型11-vs-mn">线程模型：1:1 vs M:N</h2>
<p>线程有两种主流实现方式，理解它们有助于你明白 Rust 的选择。</p>
<p><strong>1:1 模型</strong>：程序创建的每个线程，操作系统都分配一个真实的 OS 线程与之对应。Rust 标准库使用这种模型。</p>
<p><strong>M:N 模型（绿色线程）</strong>：语言运行时自己管理 M 个「用户态线程」，把它们调度到 N 个 OS 线程上运行，M 通常远大于 N。Go 的 goroutine、Erlang 的进程都是这种模型。</p>
<table><thead><tr><th></th><th>1:1 模型（Rust 标准库）</th><th>M:N 模型（Go goroutine）</th></tr></thead><tbody><tr><td><strong>线程由谁管理</strong></td><td>操作系统</td><td>语言运行时</td></tr><tr><td><strong>创建开销</strong></td><td>较大（需要系统调用）</td><td>极小（用户态切换）</td></tr><tr><td><strong>可并发数量</strong></td><td>受 OS 限制，通常数千</td><td>可轻松开百万个</td></tr><tr><td><strong>需要运行时</strong></td><td>不需要</td><td>需要内置调度器</td></tr></tbody></table>
<p><strong>Rust 为什么选 1:1？</strong> Rust 的核心目标之一是「零额外运行时」——程序可以直接和 C 互操作，部署到嵌入式等受限环境。M:N 模型需要一个内置的线程调度器，这与目标冲突。</p>
<blockquote>
<p>如果你需要百万级并发，Rust 生态提供了 <code>tokio</code>、<code>async-std</code> 等<strong>异步运行时</strong> crate。它们用少量 OS 线程驱动大量异步任务，效果类似 M:N，但以 crate 形式存在而非绑定进语言本身——用不到就零开销。异步编程是后续章节的主题。</p>
</blockquote>
<h2 id="使用-spawn-创建线程">使用 spawn 创建线程</h2>
<p>调用 <code>thread::spawn</code> 并传入一个闭包，闭包里的代码就在新线程中运行：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Athread%3B%0Ause%20std%3A%3Atime%3A%3ADuration%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%88%9B%E5%BB%BA%E4%B8%80%E4%B8%AA%E6%96%B0%E7%BA%BF%E7%A8%8B%0A%20%20%20%20thread%3A%3Aspawn(%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20for%20i%20in%201..%3D5%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%AD%90%E7%BA%BF%E7%A8%8B%EF%BC%9A%E7%AC%AC%20%7B%7D%20%E6%AC%A1%22%2C%20i)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20thread%3A%3Asleep(Duration%3A%3Afrom_millis(1))%3B%20%2F%2F%20%E7%9D%A1%E7%9C%A0%201%20%E6%AF%AB%E7%A7%92%EF%BC%8C%E8%AE%A9%E5%87%BA%20CPU%EF%BC%8C%E7%BB%99%E5%85%B6%E4%BB%96%E7%BA%BF%E7%A8%8B%E8%BF%90%E8%A1%8C%E6%9C%BA%E4%BC%9A%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%B8%BB%E7%BA%BF%E7%A8%8B%E8%87%AA%E5%B7%B1%E4%B9%9F%E5%9C%A8%E8%BF%90%E8%A1%8C%0A%20%20%20%20for%20i%20in%201..%3D3%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%B8%BB%E7%BA%BF%E7%A8%8B%EF%BC%9A%E7%AC%AC%20%7B%7D%20%E6%AC%A1%22%2C%20i)%3B%0A%20%20%20%20%20%20%20%20thread%3A%3Asleep(Duration%3A%3Afrom_millis(1))%3B%20%2F%2F%20%E5%90%8C%E4%B8%8A%EF%BC%8C%E5%88%B6%E9%80%A0%E4%BA%A4%E6%9B%BF%E6%89%A7%E8%A1%8C%E7%9A%84%E6%95%88%E6%9E%9C%0A%20%20%20%20%7D%0A%20%20%20%20%2F%2F%20%E4%B8%BB%E7%BA%BF%E7%A8%8B%E7%BB%93%E6%9D%9F%20%E2%86%92%20%E6%95%B4%E4%B8%AA%E7%A8%8B%E5%BA%8F%E7%BB%93%E6%9D%9F%EF%BC%8C%E5%AD%90%E7%BA%BF%E7%A8%8B%E5%8F%AF%E8%83%BD%E8%BF%98%E6%B2%A1%E8%B7%91%E5%AE%8C%EF%BC%81%0A%7D" data-mode="run"><pre><code class="language-rust">use std::thread;
use std::time::Duration;

fn main() {
    // 创建一个新线程
    thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程：第 {} 次", i);
            thread::sleep(Duration::from_millis(1)); // 睡眠 1 毫秒，让出 CPU，给其他线程运行机会
        }
    });

    // 主线程自己也在运行
    for i in 1..=3 {
        println!("主线程：第 {} 次", i);
        thread::sleep(Duration::from_millis(1)); // 同上，制造交替执行的效果
    }
    // 主线程结束 → 整个程序结束，子线程可能还没跑完！
}</code></pre></div>
<p>运行这段代码你会发现：<strong>主线程一结束，子线程也被强制终止</strong>，不管它有没有跑完。输出顺序也是不确定的，因为操作系统随时可能切换线程。</p>
<h2 id="join等待子线程完成">join：等待子线程完成</h2>
<p><code>thread::spawn</code> 返回一个 <code>JoinHandle</code>。对它调用 <code>.join()</code> 会<strong>阻塞当前线程</strong>，直到对应的子线程结束：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Athread%3B%0Ause%20std%3A%3Atime%3A%3ADuration%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%8A%8A%20JoinHandle%20%E4%BF%9D%E5%AD%98%E4%B8%8B%E6%9D%A5%0A%20%20%20%20let%20handle%20%3D%20thread%3A%3Aspawn(%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20for%20i%20in%201..%3D5%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%AD%90%E7%BA%BF%E7%A8%8B%EF%BC%9A%E7%AC%AC%20%7B%7D%20%E6%AC%A1%22%2C%20i)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20thread%3A%3Asleep(Duration%3A%3Afrom_millis(1))%3B%20%2F%2F%20%E7%9D%A1%E7%9C%A0%201%20%E6%AF%AB%E7%A7%92%EF%BC%8C%E8%AE%A9%E5%87%BA%20CPU%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20for%20i%20in%201..%3D3%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%B8%BB%E7%BA%BF%E7%A8%8B%EF%BC%9A%E7%AC%AC%20%7B%7D%20%E6%AC%A1%22%2C%20i)%3B%0A%20%20%20%20%20%20%20%20thread%3A%3Asleep(Duration%3A%3Afrom_millis(1))%3B%20%2F%2F%20%E5%90%8C%E4%B8%8A%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E5%9C%A8%E8%BF%99%E9%87%8C%E7%AD%89%E5%BE%85%E5%AD%90%E7%BA%BF%E7%A8%8B%E7%BB%93%E6%9D%9F%EF%BC%8C%E5%86%8D%E7%BB%A7%E7%BB%AD%0A%20%20%20%20handle.join().unwrap()%3B%0A%20%20%20%20println!(%22%E6%89%80%E6%9C%89%E7%BA%BF%E7%A8%8B%E9%83%BD%E5%AE%8C%E6%88%90%E4%BA%86%EF%BC%81%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::thread;
use std::time::Duration;

fn main() {
    // 把 JoinHandle 保存下来
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程：第 {} 次", i);
            thread::sleep(Duration::from_millis(1)); // 睡眠 1 毫秒，让出 CPU
        }
    });

    for i in 1..=3 {
        println!("主线程：第 {} 次", i);
        thread::sleep(Duration::from_millis(1)); // 同上
    }

    // 在这里等待子线程结束，再继续
    handle.join().unwrap();
    println!("所有线程都完成了！");
}</code></pre></div>
<p>现在子线程的 5 次输出一定会全部打印出来。</p>
<blockquote>
<p><strong>join 放在哪里很重要</strong>：如果在主线程的 <code>for</code> 循环之前就 <code>join</code>，那主线程会先等子线程跑完，再执行自己的循环——两者就不再并发了。</p>
</blockquote>
<h1 id="move-闭包与所有权">move 闭包与所有权</h1>
<h2 id="为什么需要-move">为什么需要 move</h2>
<p>子线程需要用到外部数据时，直接借用会有问题。来看一个例子：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%9A%E9%97%AD%E5%8C%85%E5%80%9F%E7%94%A8%E4%BA%86%20v%EF%BC%8C%E4%BD%86%20Rust%20%E4%B8%8D%E7%9F%A5%E9%81%93%E8%BF%99%E4%B8%AA%E7%BA%BF%E7%A8%8B%E4%BC%9A%E6%B4%BB%E5%A4%9A%E4%B9%85%0A%20%20%20%20let%20handle%20%3D%20thread%3A%3Aspawn(%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%90%91%E9%87%8F%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E8%BF%99%E9%87%8C%20drop(v)%EF%BC%8C%E5%AD%90%E7%BA%BF%E7%A8%8B%E5%B0%B1%E8%AE%BF%E9%97%AE%E4%BA%86%E6%82%AC%E7%A9%BA%E5%BC%95%E7%94%A8%EF%BC%81%0A%20%20%20%20handle.join().unwrap()%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    // 编译错误：闭包借用了 v，但 Rust 不知道这个线程会活多久
    let handle = thread::spawn(|| {
        println!("向量：{:?}", v);
    });

    // 如果这里 drop(v)，子线程就访问了悬空引用！
    handle.join().unwrap();
}</code></pre></div>
<p>编译器会报错：闭包试图借用 <code>v</code>，但 Rust 无法保证主线程不会在子线程还在用 <code>v</code> 的时候把它丢弃。这是一个<strong>合理的担忧</strong>——比如主线程可以调用 <code>drop(v)</code> 后立刻结束，子线程就读到了悬空数据。</p>
<h2 id="用-move-转移所有权">用 move 转移所有权</h2>
<p>解决办法是在闭包前加 <code>move</code> 关键字，强制闭包<strong>获取</strong>它用到的所有值的所有权：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20%2F%2F%20move%20%E6%8A%8A%20v%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%E7%A7%BB%E5%85%A5%E9%97%AD%E5%8C%85%EF%BC%8C%E5%AD%90%E7%BA%BF%E7%A8%8B%E7%8B%AC%E5%8D%A0%20v%0A%20%20%20%20let%20handle%20%3D%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%90%91%E9%87%8F%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%2F%2F%20v%20%E5%B7%B2%E7%BB%8F%E7%A7%BB%E8%B5%B0%E4%BA%86%EF%BC%8C%E8%BF%99%E9%87%8C%E4%B8%8D%E8%83%BD%E5%86%8D%E7%94%A8%20v%0A%20%20%20%20handle.join().unwrap()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    // move 把 v 的所有权移入闭包，子线程独占 v
    let handle = thread::spawn(move || {
        println!("向量：{:?}", v);
    });

    // v 已经移走了，这里不能再用 v
    handle.join().unwrap();
}</code></pre></div>
<p>加了 <code>move</code> 后，<code>v</code> 的所有权转移给了子线程的闭包。主线程再也无法访问 <code>v</code>，从根本上避免了悬空引用的可能。</p>
<h2 id="move-闭包的所有权效果">move 闭包的所有权效果</h2>
<div class="code-runner" data-full-code="use%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20let%20handle%20%3D%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20v)%3B%20%2F%2F%20v%20%E5%B7%B2%E8%A2%AB%20move%20%E8%BF%9B%E6%9D%A5%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20drop(v)%3B%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%81v%20%E5%B7%B2%E7%BB%8F%E7%A7%BB%E8%B5%B0%E4%BA%86%EF%BC%8C%E8%BF%99%E9%87%8C%E6%97%A0%E6%B3%95%E4%BD%BF%E7%94%A8%0A%0A%20%20%20%20handle.join().unwrap()%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(move || {
        println!("{:?}", v); // v 已被 move 进来
    });

    drop(v); // 编译错误！v 已经移走了，这里无法使用

    handle.join().unwrap();
}</code></pre></div>
<p>这正是 Rust 给我们的保护：<code>move</code> 之后，所有权规则确保主线程不可能再碰 <code>v</code>，消除了一类典型的并发 bug。</p>
<h1 id="练习题">练习题</h1>
<h2 id="测验">测验</h2>
</div>
</div>
<pre><code class="language-rust">use std::thread;
fn main() {
    let msg = String::from("hello");
    thread::spawn(move || println!("{}", msg));
}</code></pre>
</div>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面的代码希望创建一个子线程打印 1 到 5，主线程打印 “A” 到 “C”，并且保证子线程一定能跑完。请补全 <code>TODO</code> 部分：</p>
<div class="code-editor" data-block-id="14-concurrency/01-threads#2:6" data-expect-mode="literal" data-expect-pattern="%E4%B8%BB%E7%BA%BF%E7%A8%8B%3A%20A%0A%E4%B8%BB%E7%BA%BF%E7%A8%8B%3A%20B%0A%E4%B8%BB%E7%BA%BF%E7%A8%8B%3A%20C%0A%E5%AD%90%E7%BA%BF%E7%A8%8B%3A%201%0A%E5%AD%90%E7%BA%BF%E7%A8%8B%3A%202%0A%E5%AD%90%E7%BA%BF%E7%A8%8B%3A%203%0A%E5%AD%90%E7%BA%BF%E7%A8%8B%3A%204%0A%E5%AD%90%E7%BA%BF%E7%A8%8B%3A%205" data-starter-code="use%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20handle%20%3D%20thread%3A%3Aspawn(%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20for%20i%20in%201..%3D5%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20TODO%3A%20%E6%89%93%E5%8D%B0%20%22%E5%AD%90%E7%BA%BF%E7%A8%8B%3A%20%7Bi%7D%22%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20for%20c%20in%20%5B'A'%2C%20'B'%2C%20'C'%5D%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%B8%BB%E7%BA%BF%E7%A8%8B%3A%20%7Bc%7D%22)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E7%AD%89%E5%BE%85%E5%AD%90%E7%BA%BF%E7%A8%8B%E7%BB%93%E6%9D%9F%0A%7D"><pre><code class="language-rust">use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            // TODO: 打印 "子线程: {i}"
        }
    });

    for c in ['A', 'B', 'C'] {
        println!("主线程: {c}");
    }

    // TODO: 等待子线程结束
}</code></pre></div> 