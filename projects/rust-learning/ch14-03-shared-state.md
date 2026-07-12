---
title: "共享状态"
description: "并发编程 - 共享状态"
date: "2026-07-12"
order: 14003
tags: ["Mutex", "Arc", "共享状态", "互斥锁", "原子引用计数", "线程安全"]
est_time: "30 分钟"
---

 <h1 id="mutext互斥锁">Mutex&lt;T&gt;：互斥锁</h1>
<p>通道是「通过通信共享数据」，本节介绍另一种思路：<strong>让多个线程直接共享同一块数据，但每次只允许一个线程访问</strong>。</p>
<p>这个机制叫<strong>互斥锁</strong>（Mutex，Mutual Exclusion）。你可以把它想象成公共厕所门上的锁：进去之前先锁门，出来后开锁，这样里面永远只有一个人。</p>
<h2 id="mutex-的基本用法">Mutex 的基本用法</h2>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3AMutex%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%8A%8A%E6%95%B0%E6%8D%AE%22%E8%A3%85%E8%BF%9B%22%20Mutex%EF%BC%8C%E5%A4%96%E4%BA%BA%E6%97%A0%E6%B3%95%E7%9B%B4%E6%8E%A5%E8%AE%BF%E9%97%AE%0A%20%20%20%20let%20m%20%3D%20Mutex%3A%3Anew(5)%3B%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20lock()%20%E8%8E%B7%E5%8F%96%E9%94%81%EF%BC%8C%E8%BF%94%E5%9B%9E%20MutexGuard%20%E6%99%BA%E8%83%BD%E6%8C%87%E9%92%88%0A%20%20%20%20%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E9%94%81%E5%B7%B2%E8%A2%AB%E5%85%B6%E4%BB%96%E7%BA%BF%E7%A8%8B%E6%8C%81%E6%9C%89%EF%BC%8C%E5%BD%93%E5%89%8D%E7%BA%BF%E7%A8%8B%E4%BC%9A%E9%98%BB%E5%A1%9E%E7%AD%89%E5%BE%85%0A%20%20%20%20%20%20%20%20let%20mut%20num%20%3D%20m.lock().unwrap()%3B%0A%20%20%20%20%20%20%20%20*num%20%3D%206%3B%20%2F%2F%20%E9%80%9A%E8%BF%87%20MutexGuard%20%E4%BF%AE%E6%94%B9%E5%86%85%E9%83%A8%E6%95%B0%E6%8D%AE%0A%20%20%20%20%7D%20%2F%2F%20%E8%BF%99%E9%87%8C%20num%20%E7%A6%BB%E5%BC%80%E4%BD%9C%E7%94%A8%E5%9F%9F%EF%BC%8CMutexGuard%20%E8%87%AA%E5%8A%A8%20drop%EF%BC%8C%E9%94%81%E8%87%AA%E5%8A%A8%E9%87%8A%E6%94%BE%0A%0A%20%20%20%20println!(%22m%20%3D%20%7B%3A%3F%7D%22%2C%20m)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::Mutex;

fn main() {
    // 把数据"装进" Mutex，外人无法直接访问
    let m = Mutex::new(5);

    {
        // lock() 获取锁，返回 MutexGuard 智能指针
        // 如果锁已被其他线程持有，当前线程会阻塞等待
        let mut num = m.lock().unwrap();
        *num = 6; // 通过 MutexGuard 修改内部数据
    } // 这里 num 离开作用域，MutexGuard 自动 drop，锁自动释放

    println!("m = {:?}", m);
}</code></pre></div>
<p>关键点：</p>
<ul>
<li><strong>获取数据必须先拿锁</strong>：<code>Mutex&lt;T&gt;</code> 把数据包裹起来，不 <code>lock()</code> 就无法访问 <code>T</code></li>
<li><strong>锁自动释放</strong>：<code>MutexGuard</code> 是智能指针，离开作用域时 <code>Drop</code> 实现会自动释放锁，不需要手动解锁</li>
<li><strong>中毒（Poisoning）</strong>：如果持有锁的线程 panic 了，锁进入”中毒”状态。其他线程再调用 <code>lock()</code> 会得到 <code>Err</code>，调用 <code>.unwrap()</code> 就会 panic。</li>
</ul>
<h2 id="用--手动控制持锁范围">用 {} 手动控制持锁范围</h2>
<p><code>MutexGuard</code> 在离开<strong>当前作用域</strong>时才释放锁，所以用 <code>{}</code> 块包裹可以精确控制持锁时间：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3AMutex%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20m%20%3D%20Mutex%3A%3Anew(0)%3B%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20mut%20num%20%3D%20m.lock().unwrap()%3B%0A%20%20%20%20%20%20%20%20*num%20%2B%3D%201%3B%0A%20%20%20%20%7D%20%2F%2F%20%E2%86%90%20num%20%E5%9C%A8%E8%BF%99%E9%87%8C%20drop%EF%BC%8C%E9%94%81%E7%AB%8B%E5%88%BB%E9%87%8A%E6%94%BE%0A%0A%20%20%20%20%2F%2F%20%E9%94%81%E5%B7%B2%E9%87%8A%E6%94%BE%EF%BC%8C%E5%8F%AF%E4%BB%A5%E5%86%8D%E6%AC%A1%E8%8E%B7%E5%8F%96%0A%20%20%20%20println!(%22m%20%3D%20%7B%3A%3F%7D%22%2C%20m)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::Mutex;

fn main() {
    let m = Mutex::new(0);

    {
        let mut num = m.lock().unwrap();
        *num += 1;
    } // ← num 在这里 drop，锁立刻释放

    // 锁已释放，可以再次获取
    println!("m = {:?}", m);
}</code></pre></div>
<blockquote>
<p><strong>经验法则</strong>：只在真正需要修改数据的几行外套 <code>{}</code>，改完立刻释放。持锁时间越短，其他线程等待的时间就越短，并发效率越高。</p>
</blockquote>
<h2 id="单线程场景验证">单线程场景验证</h2>
<p>先确保单线程里 Mutex 正常工作，再推进到多线程：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3AMutex%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20scores%20%3D%20Mutex%3A%3Anew(vec!%5B%5D)%3B%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20mut%20s%20%3D%20scores.lock().unwrap()%3B%0A%20%20%20%20%20%20%20%20s.push(10)%3B%0A%20%20%20%20%20%20%20%20s.push(20)%3B%0A%20%20%20%20%7D%20%2F%2F%20%E9%94%81%E9%87%8A%E6%94%BE%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20mut%20s%20%3D%20scores.lock().unwrap()%3B%0A%20%20%20%20%20%20%20%20s.push(30)%3B%0A%20%20%20%20%7D%20%2F%2F%20%E9%94%81%E5%86%8D%E6%AC%A1%E9%87%8A%E6%94%BE%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20scores.lock().unwrap())%3B%20%2F%2F%20%5B10%2C%2020%2C%2030%5D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::Mutex;

fn main() {
    let scores = Mutex::new(vec![]);

    {
        let mut s = scores.lock().unwrap();
        s.push(10);
        s.push(20);
    } // 锁释放

    {
        let mut s = scores.lock().unwrap();
        s.push(30);
    } // 锁再次释放

    println!("{:?}", scores.lock().unwrap()); // [10, 20, 30]
}</code></pre></div>
<h1 id="arct线程安全的引用计数">Arc&lt;T&gt;：线程安全的引用计数</h1>
<h2 id="为什么不能用-rct">为什么不能用 Rc&lt;T&gt;</h2>
<p>你可能想到：多线程共享数据，上一章用 <code>Rc&lt;T&gt;</code> 实现了多所有权，直接用不就好了？</p>
<div class="code-runner" data-full-code="use%20std%3A%3Arc%3A%3ARc%3B%0Ause%20std%3A%3Async%3A%3AMutex%3B%0Ause%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20counter%20%3D%20Rc%3A%3Anew(Mutex%3A%3Anew(0))%3B%0A%0A%20%20%20%20let%20counter2%20%3D%20Rc%3A%3Aclone(%26counter)%3B%0A%20%20%20%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%9ARc%3CT%3E%20%E4%B8%8D%E5%AE%9E%E7%8E%B0%20Send%EF%BC%8C%E4%B8%8D%E8%83%BD%E5%8F%91%E9%80%81%E5%88%B0%E5%85%B6%E4%BB%96%E7%BA%BF%E7%A8%8B%0A%20%20%20%20%20%20%20%20*counter2.lock().unwrap()%20%2B%3D%201%3B%0A%20%20%20%20%7D)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">use std::rc::Rc;
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Rc::new(Mutex::new(0));

    let counter2 = Rc::clone(&amp;counter);
    thread::spawn(move || {
        // 编译错误：Rc&lt;T&gt; 不实现 Send，不能发送到其他线程
        *counter2.lock().unwrap() += 1;
    });
}</code></pre></div>
<p>编译器拒绝了：<strong><code>Rc&lt;T&gt;</code> 不是线程安全的</strong>。原因在于 <code>Rc&lt;T&gt;</code> 的引用计数是普通整数操作，两个线程同时克隆时可能同时修改引用计数，导致计数混乱，最终引发内存安全问题。</p>
<h2 id="arct原子引用计数">Arc&lt;T&gt;：原子引用计数</h2>
<p><code>Arc&lt;T&gt;</code>（Atomic Reference Counting）是 <code>Rc&lt;T&gt;</code> 的线程安全版本。它用<strong>原子操作</strong>来更新引用计数，保证计数的修改不会被打断：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3AArc%3B%0Ause%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20data%20%3D%20Arc%3A%3Anew(vec!%5B1%2C%202%2C%203%5D)%3B%0A%0A%20%20%20%20let%20data2%20%3D%20Arc%3A%3Aclone(%26data)%3B%0A%20%20%20%20let%20handle%20%3D%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20data2%20%E7%8E%B0%E5%9C%A8%E5%B1%9E%E4%BA%8E%E5%AD%90%E7%BA%BF%E7%A8%8B%EF%BC%8C%E5%92%8C%E4%B8%BB%E7%BA%BF%E7%A8%8B%E7%9A%84%20data%20%E5%85%B1%E4%BA%AB%E5%90%8C%E4%B8%80%E4%BB%BD%E5%A0%86%E5%86%85%E5%AD%98%0A%20%20%20%20%20%20%20%20println!(%22%E5%AD%90%E7%BA%BF%E7%A8%8B%E7%9C%8B%E5%88%B0%E7%9A%84%E6%95%B0%E6%8D%AE%EF%BC%9A%7B%3A%3F%7D%22%2C%20data2)%3B%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20handle.join().unwrap()%3B%0A%20%20%20%20println!(%22%E4%B8%BB%E7%BA%BF%E7%A8%8B%E7%9C%8B%E5%88%B0%E7%9A%84%E6%95%B0%E6%8D%AE%EF%BC%9A%7B%3A%3F%7D%22%2C%20data)%3B%0A%20%20%20%20%2F%2F%20%E4%B8%A4%E4%B8%AA%20Arc%20drop%20%E5%90%8E%EF%BC%8C%E5%A0%86%E5%86%85%E5%AD%98%E6%89%8D%E7%9C%9F%E6%AD%A3%E9%87%8A%E6%94%BE%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);

    let data2 = Arc::clone(&amp;data);
    let handle = thread::spawn(move || {
        // data2 现在属于子线程，和主线程的 data 共享同一份堆内存
        println!("子线程看到的数据：{:?}", data2);
    });

    handle.join().unwrap();
    println!("主线程看到的数据：{:?}", data);
    // 两个 Arc drop 后，堆内存才真正释放
}</code></pre></div>
<blockquote>
<p><code>Arc</code> 和 <code>Rc</code> 的 API 完全相同，只是多线程场景下换成 <code>Arc</code> 即可。代价是原子操作比普通整数操作稍慢，所以单线程仍然首选 <code>Rc</code>。</p>
</blockquote>
<h1 id="arcmutext共享可变状态">Arc&lt;Mutex&lt;T&gt;&gt;：共享可变状态</h1>
<h2 id="组合两者">组合两者</h2>
<p><code>Arc&lt;T&gt;</code> 解决了”多个线程都持有所有权”的问题，但 <code>Arc&lt;T&gt;</code> 本身是<strong>不可变</strong>的。要让多个线程共享<strong>并修改</strong>同一份数据，需要把 <code>Mutex&lt;T&gt;</code> 套在里面：<code>Arc&lt;Mutex&lt;T&gt;&gt;</code>。</p>
<ul>
<li><strong><code>Arc</code></strong> 负责：让多个线程都能持有这份数据的所有权（引用计数）</li>
<li><strong><code>Mutex</code></strong> 负责：保证同一时刻只有一个线程在修改数据（加锁）</li>
</ul>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3A%7BArc%2C%20Mutex%7D%3B%0Ause%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20Arc%3CMutex%3Ci32%3E%3E%EF%BC%9A%E5%8F%AF%E4%BB%A5%E8%B7%A8%E7%BA%BF%E7%A8%8B%E5%85%B1%E4%BA%AB%E7%9A%84%E5%8F%AF%E5%8F%98%E8%AE%A1%E6%95%B0%E5%99%A8%0A%20%20%20%20let%20counter%20%3D%20Arc%3A%3Anew(Mutex%3A%3Anew(0))%3B%0A%20%20%20%20let%20mut%20handles%20%3D%20vec!%5B%5D%3B%0A%0A%20%20%20%20for%20_%20in%200..5%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20Arc%3A%3Aclone%20%E5%A2%9E%E5%8A%A0%E5%BC%95%E7%94%A8%E8%AE%A1%E6%95%B0%EF%BC%8C%E6%AF%8F%E4%B8%AA%E7%BA%BF%E7%A8%8B%E9%83%BD%E5%BE%97%E5%88%B0%E4%B8%80%E4%BB%BD%22%E9%97%A8%E7%A5%A8%22%0A%20%20%20%20%20%20%20%20let%20counter%20%3D%20Arc%3A%3Aclone(%26counter)%3B%0A%20%20%20%20%20%20%20%20let%20handle%20%3D%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E6%AF%8F%E4%B8%AA%E7%BA%BF%E7%A8%8B%E8%BD%AE%E6%B5%81%E8%8E%B7%E5%8F%96%E9%94%81%EF%BC%8C%E4%BF%AE%E6%94%B9%E6%95%B0%E6%8D%AE%0A%20%20%20%20%20%20%20%20%20%20%20%20let%20mut%20num%20%3D%20counter.lock().unwrap()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20*num%20%2B%3D%201%3B%0A%20%20%20%20%20%20%20%20%7D)%3B%20%2F%2F%20num%20%E5%9C%A8%E8%BF%99%E9%87%8C%20drop%EF%BC%8C%E9%94%81%E8%87%AA%E5%8A%A8%E9%87%8A%E6%94%BE%0A%20%20%20%20%20%20%20%20handles.push(handle)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E7%AD%89%E5%BE%85%E6%89%80%E6%9C%89%E7%BA%BF%E7%A8%8B%E5%AE%8C%E6%88%90%0A%20%20%20%20for%20handle%20in%20handles%20%7B%0A%20%20%20%20%20%20%20%20handle.join().unwrap()%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E6%9C%80%E7%BB%88%E8%AE%A1%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20*counter.lock().unwrap())%3B%20%2F%2F%205%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc&lt;Mutex&lt;i32&gt;&gt;：可以跨线程共享的可变计数器
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..5 {
        // Arc::clone 增加引用计数，每个线程都得到一份"门票"
        let counter = Arc::clone(&amp;counter);
        let handle = thread::spawn(move || {
            // 每个线程轮流获取锁，修改数据
            let mut num = counter.lock().unwrap();
            *num += 1;
        }); // num 在这里 drop，锁自动释放
        handles.push(handle);
    }

    // 等待所有线程完成
    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数：{}", *counter.lock().unwrap()); // 5
}</code></pre></div>
<p>5 个线程各自加 1，最终结果一定是 5，不会出现数据竞争。</p>
<h2 id="内部可变性的回顾">内部可变性的回顾</h2>
<p>你会发现 <code>counter</code> 是不可变绑定，但我们却能修改它内部的值——这和 <code>RefCell&lt;T&gt;</code> 的道理一样，都是<strong>内部可变性</strong>。</p>
<table><thead><tr><th>组合</th><th>适用场景</th></tr></thead><tbody><tr><td><code>Rc&lt;RefCell&lt;T&gt;&gt;</code></td><td>单线程，需要多所有权 + 可变性</td></tr><tr><td><code>Arc&lt;Mutex&lt;T&gt;&gt;</code></td><td>多线程，需要多所有权 + 可变性</td></tr></tbody></table>
<p><code>Mutex&lt;T&gt;</code> 是多线程版的 <code>RefCell&lt;T&gt;</code>：区别在于 <code>RefCell&lt;T&gt;</code> 在运行时检查借用规则，而 <code>Mutex&lt;T&gt;</code> 通过操作系统级别的锁来保证互斥。</p>
<h2 id="死锁需要注意的风险">死锁：需要注意的风险</h2>
<p>Rust 能防止数据竞争，但<strong>无法防止死锁</strong>。死锁发生在：线程 A 持有锁 1，等待锁 2；线程 B 持有锁 2，等待锁 1——两者互相等待，永远不会释放。</p>
<p>避免死锁的简单原则：</p>
<ul>
<li>尽量缩短持有锁的时间（把锁的作用域写小）</li>
<li>多把锁时，所有线程按相同顺序获取</li>
</ul>
<h1 id="选哪个决策指南">选哪个？决策指南</h1>
<p>学完智能指针和并发这两章，你面前摆着一堆工具：<code>Box</code>、<code>Rc</code>、<code>Arc</code>、<code>RefCell</code>、<code>Mutex</code>……初学者最容易困惑的就是”我到底该用哪个”。这里给出一个清晰的决策思路。</p>
<h2 id="第一步是否需要多所有权">第一步：是否需要多所有权？</h2>
<p><strong>不需要</strong>（一个值只有一个所有者）→ 直接用普通所有权或 <code>Box&lt;T&gt;</code>。</p>
<p><strong>需要</strong>（多个地方都要”拥有”同一份数据）→ 继续往下看。</p>
<h2 id="第二步是否跨线程">第二步：是否跨线程？</h2>
<p><strong>单线程</strong> → 用 <code>Rc&lt;T&gt;</code>（引用计数，轻量，不带线程安全开销）</p>
<p><strong>多线程</strong> → 用 <code>Arc&lt;T&gt;</code>（原子引用计数，线程安全）</p>
<h2 id="第三步是否需要修改共享的数据">第三步：是否需要修改共享的数据？</h2>
<p>只读共享：到上一步就够了，<code>Rc&lt;T&gt;</code> 或 <code>Arc&lt;T&gt;</code> 直接用。</p>
<p>需要修改：</p>
<table><thead><tr><th>场景</th><th>用法</th></tr></thead><tbody><tr><td>单线程，多所有权 + 可变</td><td><code>Rc&lt;RefCell&lt;T&gt;&gt;</code></td></tr><tr><td>多线程，多所有权 + 可变</td><td><code>Arc&lt;Mutex&lt;T&gt;&gt;</code></td></tr></tbody></table>
<h2 id="完整速查表">完整速查表</h2>
<table><thead><tr><th>需求</th><th>推荐工具</th><th>原因</th></tr></thead><tbody><tr><td>堆分配 / 递归类型</td><td><code>Box&lt;T&gt;</code></td><td>最简单的堆指针，单一所有权</td></tr><tr><td>单线程多所有权（只读）</td><td><code>Rc&lt;T&gt;</code></td><td>引用计数，零线程开销</td></tr><tr><td>单线程多所有权（可变）</td><td><code>Rc&lt;RefCell&lt;T&gt;&gt;</code></td><td>RefCell 提供运行时借用检查</td></tr><tr><td>多线程多所有权（只读）</td><td><code>Arc&lt;T&gt;</code></td><td>原子引用计数</td></tr><tr><td>多线程多所有权（可变）</td><td><code>Arc&lt;Mutex&lt;T&gt;&gt;</code></td><td>Mutex 保证互斥访问</td></tr><tr><td>多线程单向数据传递</td><td><code>mpsc::channel</code></td><td>所有权转移，天然安全</td></tr></tbody></table>
<blockquote>
<p><strong>经验法则</strong>：能用普通所有权就不用 <code>Rc</code>；能用 <code>Rc</code> 就不用 <code>Arc</code>；能用通道就不用 <code>Mutex</code>。越简单的工具，出错的可能性越小。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="测验">测验</h2>
</div>
</div>
</div>
</div>
<pre><code class="language-rust">use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let n = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    for _ in 0..3 {
        let n = Arc::clone(&amp;n);
        handles.push(thread::spawn(move || {
            *n.lock().unwrap() += 10;
        }));
    }
    for h in handles { h.join().unwrap(); }
    println!("{}", *n.lock().unwrap());
}</code></pre>
</div>
<pre><code class="language-rust">use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let n = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    for i in 1..=3 {
        let n = Arc::clone(&amp;n);
        handles.push(thread::spawn(move || {
            *n.lock().unwrap() = i * 10; // 赋值，不是累加
        }));
    }
    for h in handles { h.join().unwrap(); }
    println!("{}", *n.lock().unwrap());
}</code></pre>
</div>
</div> 