---
title: "消息传递"
description: "并发编程 - 消息传递"
date: "2026-07-12"
order: 14002
tags: ["通道", "mpsc", "消息传递", "发送者", "接收者", "并发"]
est_time: "20 分钟"
---

 <h1 id="通道线程间的单行道">通道：线程间的单行道</h1>
<p>Go 语言有一句著名的口号：“<strong>不要通过共享内存来通信，而要通过通信来共享内存。</strong>”</p>
<p>这句话描述了一种并发思路：与其让多个线程同时读写同一块内存（复杂、危险），不如给每个线程一个”收件箱”，线程之间传递消息，接收方从自己的收件箱里取数据。</p>
<p>Rust 标准库提供了<strong>通道</strong>（channel）来实现这个模式。</p>
<h2 id="什么是-mpsc-通道">什么是 mpsc 通道</h2>
<p><code>std::sync::mpsc</code> 里的 <code>mpsc</code> 是 <strong>Multiple Producer, Single Consumer</strong> 的缩写——<strong>多个发送者、一个接收者</strong>。</p>
<p>可以把通道想象成一条传送带：</p>
<ul>
<li><strong>发送端</strong>（<code>Sender&lt;T&gt;</code>）：往传送带上放东西</li>
<li><strong>接收端</strong>（<code>Receiver&lt;T&gt;</code>）：从传送带末端取东西</li>
<li>传送带只有一个出口，但入口可以有多个（克隆发送端）</li>
</ul>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3Ampsc%3B%0Ause%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20channel()%20%E8%BF%94%E5%9B%9E%20(%E5%8F%91%E9%80%81%E7%AB%AF%2C%20%E6%8E%A5%E6%94%B6%E7%AB%AF)%20%E7%9A%84%E5%85%83%E7%BB%84%0A%20%20%20%20let%20(tx%2C%20rx)%20%3D%20mpsc%3A%3Achannel()%3B%0A%0A%20%20%20%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E6%8A%8A%20tx%20%E7%A7%BB%E5%85%A5%E5%AD%90%E7%BA%BF%E7%A8%8B%EF%BC%8C%E5%8F%91%E9%80%81%E4%B8%80%E6%9D%A1%E6%B6%88%E6%81%AF%0A%20%20%20%20%20%20%20%20tx.send(String%3A%3Afrom(%22%E4%BD%A0%E5%A5%BD%EF%BC%8C%E4%B8%BB%E7%BA%BF%E7%A8%8B%EF%BC%81%22)).unwrap()%3B%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%2F%2F%20recv()%20%E4%BC%9A%E9%98%BB%E5%A1%9E%EF%BC%8C%E7%9B%B4%E5%88%B0%E6%9C%89%E6%B6%88%E6%81%AF%E5%88%B0%E6%9D%A5%0A%20%20%20%20let%20msg%20%3D%20rx.recv().unwrap()%3B%0A%20%20%20%20println!(%22%E6%94%B6%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20msg)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::mpsc;
use std::thread;

fn main() {
    // channel() 返回 (发送端, 接收端) 的元组
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        // 把 tx 移入子线程，发送一条消息
        tx.send(String::from("你好，主线程！")).unwrap();
    });

    // recv() 会阻塞，直到有消息到来
    let msg = rx.recv().unwrap();
    println!("收到：{}", msg);
}</code></pre></div>
<h2 id="发送与接收">发送与接收</h2>
<p>接收端有两个方法：</p>
<table><thead><tr><th>方法</th><th>行为</th></tr></thead><tbody><tr><td><code>rx.recv()</code></td><td><strong>阻塞</strong>等待，有消息则返回 <code>Ok(T)</code>，通道关闭则返回 <code>Err</code></td></tr><tr><td><code>rx.try_recv()</code></td><td><strong>立即返回</strong>，有消息返回 <code>Ok(T)</code>，暂无消息返回 <code>Err</code>（不阻塞）</td></tr></tbody></table>
<p>当发送端被丢弃（所有 <code>tx</code> 都 drop 了），通道关闭，<code>recv()</code> 会返回 <code>Err</code>。</p>
<h2 id="所有权与消息传递">所有权与消息传递</h2>
<p>通道传值会<strong>转移所有权</strong>，这是 Rust 并发安全的关键之一：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3Ampsc%3B%0Ause%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20(tx%2C%20rx)%20%3D%20mpsc%3A%3Achannel()%3B%0A%0A%20%20%20%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20let%20val%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20%20%20%20%20tx.send(val).unwrap()%3B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%9Aval%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%E5%B7%B2%E7%BB%8F%E8%BD%AC%E7%A7%BB%E7%BB%99%E9%80%9A%E9%81%93%E4%BA%86%EF%BC%8C%E8%BF%99%E9%87%8C%E4%B8%8D%E8%83%BD%E5%86%8D%E7%94%A8%0A%20%20%20%20%20%20%20%20println!(%22val%20%3D%20%7B%7D%22%2C%20val)%3B%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20println!(%22%E6%94%B6%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20rx.recv().unwrap())%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hello");
        tx.send(val).unwrap();
        // 编译错误：val 的所有权已经转移给通道了，这里不能再用
        println!("val = {}", val);
    });

    println!("收到：{}", rx.recv().unwrap());
}</code></pre></div>
<p><code>send(val)</code> 的签名是 <code>fn send(&amp;self, t: T) -&gt; Result&lt;...&gt;</code>，它会<strong>消耗</strong> <code>val</code>。这防止了”已发送的数据还被发送方修改”这类竞争 bug。</p>
<h1 id="发送多条消息">发送多条消息</h1>
<h2 id="把接收端当迭代器">把接收端当迭代器</h2>
<p>实际场景里子线程往往需要发送多条消息。可以把 <code>rx</code> 当作迭代器来遍历，通道关闭后迭代自动结束：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3Ampsc%3B%0Ause%20std%3A%3Athread%3B%0Ause%20std%3A%3Atime%3A%3ADuration%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20(tx%2C%20rx)%20%3D%20mpsc%3A%3Achannel()%3B%0A%0A%20%20%20%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20let%20items%20%3D%20vec!%5B%22%E8%8B%B9%E6%9E%9C%22%2C%20%22%E9%A6%99%E8%95%89%22%2C%20%22%E6%A9%99%E5%AD%90%22%2C%20%22%E8%91%A1%E8%90%84%22%5D%3B%0A%20%20%20%20%20%20%20%20for%20item%20in%20items%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20tx.send(item).unwrap()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20thread%3A%3Asleep(Duration%3A%3Afrom_millis(100))%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%2F%2F%20tx%20%E5%9C%A8%E8%BF%99%E9%87%8C%20drop%EF%BC%8C%E9%80%9A%E9%81%93%E5%85%B3%E9%97%AD%EF%BC%8Crx%20%E7%9A%84%E8%BF%AD%E4%BB%A3%E9%9A%8F%E4%B9%8B%E7%BB%93%E6%9D%9F%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%2F%2F%20for%20received%20in%20rx%20%E4%BC%9A%E9%98%BB%E5%A1%9E%E7%AD%89%E5%BE%85%EF%BC%8C%E7%9B%B4%E5%88%B0%E9%80%9A%E9%81%93%E5%85%B3%E9%97%AD%0A%20%20%20%20for%20received%20in%20rx%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%94%B6%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20received)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E6%89%80%E6%9C%89%E6%B6%88%E6%81%AF%E6%8E%A5%E6%94%B6%E5%AE%8C%E6%AF%95%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let items = vec!["苹果", "香蕉", "橙子", "葡萄"];
        for item in items {
            tx.send(item).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
        // tx 在这里 drop，通道关闭，rx 的迭代随之结束
    });

    // for received in rx 会阻塞等待，直到通道关闭
    for received in rx {
        println!("收到：{}", received);
    }

    println!("所有消息接收完毕");
}</code></pre></div>
<h2 id="多生产者克隆发送端">多生产者：克隆发送端</h2>
<p><code>mpsc</code> 的 <strong>M</strong>（Multiple Producer）体现在：你可以克隆发送端，让多个线程各自往同一个通道里发消息：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3Ampsc%3B%0Ause%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20(tx%2C%20rx)%20%3D%20mpsc%3A%3Achannel()%3B%0A%0A%20%20%20%20%2F%2F%20%E5%85%8B%E9%9A%86%E4%B8%80%E4%BB%BD%E5%8F%91%E9%80%81%E7%AB%AF%E7%BB%99%E7%AC%AC%E4%BA%8C%E4%B8%AA%E7%BA%BF%E7%A8%8B%0A%20%20%20%20let%20tx2%20%3D%20tx.clone()%3B%0A%0A%20%20%20%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20tx.send(%22%E6%9D%A5%E8%87%AA%E7%BA%BF%E7%A8%8B%201%20%E7%9A%84%E6%B6%88%E6%81%AF%22).unwrap()%3B%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20tx2.send(%22%E6%9D%A5%E8%87%AA%E7%BA%BF%E7%A8%8B%202%20%E7%9A%84%E6%B6%88%E6%81%AF%22).unwrap()%3B%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%8E%A5%E6%94%B6%E4%B8%A4%E6%9D%A1%E6%B6%88%E6%81%AF%EF%BC%88%E9%A1%BA%E5%BA%8F%E4%B8%8D%E7%A1%AE%E5%AE%9A%EF%BC%89%0A%20%20%20%20for%20_%20in%200..2%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20rx.recv().unwrap())%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 克隆一份发送端给第二个线程
    let tx2 = tx.clone();

    thread::spawn(move || {
        tx.send("来自线程 1 的消息").unwrap();
    });

    thread::spawn(move || {
        tx2.send("来自线程 2 的消息").unwrap();
    });

    // 接收两条消息（顺序不确定）
    for _ in 0..2 {
        println!("{}", rx.recv().unwrap());
    }
}</code></pre></div>
<p>两个线程各自拥有一个发送端，谁先发到就先收到谁的。接收端仍然只有一个。</p>
<h1 id="练习题">练习题</h1>
<h2 id="测验">测验</h2>
</div>
</div>
</div>
</div>
</div>
</div> 