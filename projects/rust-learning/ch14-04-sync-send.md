---
title: "Send 与 Sync"
description: "并发编程 - Send 与 Sync"
date: "2026-07-12"
order: 14004
tags: ["Send", "Sync", "标记trait", "线程安全", "Arc", "Rc"]
est_time: "20 分钟"
---

 <h1 id="两个神奇的标记-trait">两个神奇的标记 Trait</h1>
<p>前几节我们看到编译器拒绝了 <code>Rc&lt;T&gt;</code> 跨线程使用，接受了 <code>Arc&lt;T&gt;</code>。编译器是怎么知道谁能跨线程、谁不能的？答案就是两个内置于语言核心的标记 trait：<code>Send</code> 和 <code>Sync</code>。</p>
<p>它们定义在 <code>std::marker</code> 中，没有任何方法，只是一个「标签」——打上这个标签，就等于向编译器声明：「这个类型在多线程场景下是安全的。」</p>
<h2 id="为什么需要标记-trait">为什么需要标记 Trait</h2>
<p>Rust 的所有权系统在单线程下已经能防止大量 bug。但多线程带来了新的问题：</p>
<ul>
<li><strong>数据竞争</strong>：两个线程同时读写同一块内存，且至少有一个是写操作</li>
<li><strong>悬空指针</strong>：一个线程释放了数据，另一个线程还持有指向它的引用</li>
</ul>
<p><code>Send</code> 和 <code>Sync</code> 两个标记 trait，让编译器能在<strong>编译期</strong>就把这些问题拦截住。</p>
<h1 id="send可以跨线程转移所有权">Send：可以跨线程转移所有权</h1>
<h2 id="什么是-send">什么是 Send</h2>
<p>实现了 <code>Send</code> 的类型，其<strong>所有权</strong>可以安全地转移到另一个线程。</p>
<p>简单来说：如果你能把一个值 <code>move</code> 进 <code>thread::spawn</code> 的闭包，这个值就必须是 <code>Send</code> 的。</p>
<div class="code-runner" data-full-code="use%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%20%2F%2F%20String%20%E5%AE%9E%E7%8E%B0%E4%BA%86%20Send%0A%0A%20%20%20%20let%20handle%20%3D%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20s%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%E8%A2%AB%20move%20%E5%88%B0%E4%BA%86%E8%BF%99%E4%B8%AA%E7%BA%BF%E7%A8%8B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%20%20%20%20%7D)%3B%0A%0A%20%20%20%20handle.join().unwrap()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::thread;

fn main() {
    let s = String::from("hello"); // String 实现了 Send

    let handle = thread::spawn(move || {
        // s 的所有权被 move 到了这个线程
        println!("{}", s);
    });

    handle.join().unwrap();
}</code></pre></div>
<p><code>String</code> 实现了 <code>Send</code>，所以可以安全地移入子线程。</p>
<h2 id="哪些类型不是-send">哪些类型不是 Send</h2>
<p>最典型的是 <code>Rc&lt;T&gt;</code>：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Arc%3A%3ARc%3B%0Ause%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20rc%20%3D%20Rc%3A%3Anew(42)%3B%0A%0A%20%20%20%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%9ARc%3Ci32%3E%20%E6%B2%A1%E6%9C%89%E5%AE%9E%E7%8E%B0%20Send%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20rc)%3B%0A%20%20%20%20%7D)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">use std::rc::Rc;
use std::thread;

fn main() {
    let rc = Rc::new(42);

    thread::spawn(move || {
        // 编译错误：Rc&lt;i32&gt; 没有实现 Send
        println!("{}", rc);
    });
}</code></pre></div>
<p>为什么 <code>Rc&lt;T&gt;</code> 不是 <code>Send</code>？因为 <code>Rc</code> 的引用计数是普通整数操作，不是原子的。如果两个线程同时克隆同一个 <code>Rc</code>，会同时修改引用计数，导致计数错乱，引发内存安全问题。</p>
<p><code>Arc&lt;T&gt;</code> 用原子操作来更新计数，所以是 <code>Send</code> 的。</p>
<h2 id="自动推导规则">自动推导规则</h2>
<ul>
<li>完全由 <code>Send</code> 类型组成的类型，自动是 <code>Send</code></li>
<li>基本类型（<code>i32</code>、<code>bool</code>、<code>String</code> 等）几乎都是 <code>Send</code></li>
<li>含有非 <code>Send</code> 类型字段的结构体，自动不是 <code>Send</code></li>
</ul>
<h1 id="sync可以被多线程共享引用">Sync：可以被多线程共享引用</h1>
<h2 id="从-send-到-sync">从 Send 到 Sync</h2>
<p><code>Send</code> 解决的是「<strong>转移</strong>所有权」的问题——值从一个线程移动到另一个线程。</p>
<p>但有时候我们不想转移，只想<strong>共享</strong>：主线程有一份数据，多个子线程都拿到它的引用，同时去读它。这就是 <code>Sync</code> 解决的问题。</p>
<blockquote>
<p><strong>定义</strong>：如果类型 <code>T</code> 是 <code>Sync</code> 的，则 <code>&amp;T</code>（对 T 的不可变引用）可以安全地同时存在于多个线程中。</p>
</blockquote>
<p>换个更直观的说法：<strong>多个线程同时读同一个值，不会出问题</strong>，这个类型就是 <code>Sync</code>。</p>
<h2 id="最简单的例子只读共享">最简单的例子：只读共享</h2>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3AArc%3B%0Ause%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20Arc%20%E8%AE%A9%E5%A4%9A%E4%B8%AA%E7%BA%BF%E7%A8%8B%E5%85%B1%E4%BA%AB%E6%89%80%E6%9C%89%E6%9D%83%EF%BC%8C%E5%86%85%E9%83%A8%E7%9A%84%20Vec%20%E6%98%AF%20Sync%20%E7%9A%84%EF%BC%88%E5%8F%AA%E8%AF%BB%EF%BC%89%0A%20%20%20%20let%20data%20%3D%20Arc%3A%3Anew(vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D)%3B%0A%0A%20%20%20%20let%20mut%20handles%20%3D%20vec!%5B%5D%3B%0A%20%20%20%20for%20i%20in%200..3%20%7B%0A%20%20%20%20%20%20%20%20let%20data%20%3D%20Arc%3A%3Aclone(%26data)%3B%0A%20%20%20%20%20%20%20%20handles.push(thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%A4%9A%E4%B8%AA%E7%BA%BF%E7%A8%8B%E5%90%8C%E6%97%B6%E6%8C%81%E6%9C%89%20%26Vec%3Ci32%3E%EF%BC%8C%E5%8F%AA%E8%AF%BB%EF%BC%8C%E5%AE%8C%E5%85%A8%E5%AE%89%E5%85%A8%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E7%BA%BF%E7%A8%8B%20%7B%7D%20%E7%9C%8B%E5%88%B0%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20i%2C%20data.len())%3B%0A%20%20%20%20%20%20%20%20%7D))%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20for%20h%20in%20handles%20%7B%20h.join().unwrap()%3B%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::Arc;
use std::thread;

fn main() {
    // Arc 让多个线程共享所有权，内部的 Vec 是 Sync 的（只读）
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let mut handles = vec![];
    for i in 0..3 {
        let data = Arc::clone(&amp;data);
        handles.push(thread::spawn(move || {
            // 多个线程同时持有 &amp;Vec&lt;i32&gt;，只读，完全安全
            println!("线程 {} 看到长度：{}", i, data.len());
        }));
    }

    for h in handles { h.join().unwrap(); }
}</code></pre></div>
<p><code>Vec&lt;i32&gt;</code> 是 <code>Sync</code> 的，因为多个线程同时<strong>读</strong>它不会产生任何问题——没有人在改它，不会有竞争。</p>
<h2 id="为什么-refcellt-不是-sync">为什么 RefCell&lt;T&gt; 不是 Sync</h2>
<p><code>RefCell&lt;T&gt;</code> 内部有一个<strong>借用计数器</strong>（一个整数），记录当前有几个活跃的借用。每次调用 <code>borrow()</code> 或 <code>borrow_mut()</code> 都要修改这个计数器。</p>
<p>问题在于：这个计数器的修改<strong>不是原子的</strong>。</p>
<p>想象两个线程同时对同一个 <code>RefCell</code> 调用 <code>borrow()</code>：</p>
<ol>
<li>线程 A 读到计数器是 0</li>
<li>线程 B 读到计数器也是 0</li>
<li>线程 A 把计数器写成 1（“我借用了”）</li>
<li>线程 B 把计数器也写成 1（覆盖了 A 的写入！）</li>
</ol>
<p>现在计数器是 1，但实际有两个活跃借用——借用规则被悄悄破坏了，后续可能出现两个可变借用同时存在的情况，导致数据竞争。</p>
<p>所以编译器禁止把 <code>RefCell</code> 的引用共享给多个线程：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Acell%3A%3ARefCell%3B%0Ause%20std%3A%3Async%3A%3AArc%3B%0Ause%20std%3A%3Athread%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20data%20%3D%20Arc%3A%3Anew(RefCell%3A%3Anew(0))%3B%0A%20%20%20%20let%20data2%20%3D%20Arc%3A%3Aclone(%26data)%3B%0A%0A%20%20%20%20thread%3A%3Aspawn(move%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%9ARefCell%3Ci32%3E%20%E6%B2%A1%E6%9C%89%E5%AE%9E%E7%8E%B0%20Sync%0A%20%20%20%20%20%20%20%20%2F%2F%20Arc%20%E5%86%85%E9%83%A8%E7%9A%84%20%26RefCell%3Ci32%3E%20%E4%B8%8D%E8%83%BD%E5%AE%89%E5%85%A8%E5%9C%B0%E8%B7%A8%E7%BA%BF%E7%A8%8B%E5%85%B1%E4%BA%AB%0A%20%20%20%20%20%20%20%20*data2.borrow_mut()%20%2B%3D%201%3B%0A%20%20%20%20%7D)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">use std::cell::RefCell;
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(RefCell::new(0));
    let data2 = Arc::clone(&amp;data);

    thread::spawn(move || {
        // 编译错误：RefCell&lt;i32&gt; 没有实现 Sync
        // Arc 内部的 &amp;RefCell&lt;i32&gt; 不能安全地跨线程共享
        *data2.borrow_mut() += 1;
    });
}</code></pre></div>
<h2 id="mutext-是-sync-的原因">Mutex&lt;T&gt; 是 Sync 的原因</h2>
<p><code>Mutex&lt;T&gt;</code> 也保护内部数据，但它用<strong>操作系统锁</strong>来保证互斥，而不是一个普通整数计数器。任何线程想访问数据都必须先拿锁，拿不到就阻塞——不可能有两个线程同时进入临界区。</p>
<p>因此 <code>Mutex&lt;T&gt;</code> 的引用可以安全地在多个线程间共享，它是 <code>Sync</code> 的。</p>
<h2 id="send-与-sync-的关系">Send 与 Sync 的关系</h2>
<p>两者可以用一句话总结：</p>
<table><thead><tr><th>Trait</th><th>保证的事</th><th>典型场景</th></tr></thead><tbody><tr><td><code>Send</code></td><td><strong>所有权</strong>可以转移到另一个线程</td><td><code>move</code> 闭包</td></tr><tr><td><code>Sync</code></td><td><strong>引用</strong>可以同时存在于多个线程</td><td><code>Arc&lt;T&gt;</code> 包裹后共享</td></tr></tbody></table>
<p>它们之间有一个数学关系：<strong>如果 <code>&amp;T</code> 是 <code>Send</code>，则 <code>T</code> 就是 <code>Sync</code></strong>。</p>
<p>理解这句话：<code>&amp;T</code> 是 <code>Send</code> 意味着”这个引用可以安全地发送到另一个线程”，也就是说另一个线程拿着 <code>&amp;T</code> 读数据不会出问题——这正好就是 <code>Sync</code> 的定义。</p>
<h2 id="常见类型的-send--sync-一览">常见类型的 Send / Sync 一览</h2>
<table><thead><tr><th>类型</th><th>Send</th><th>Sync</th><th>原因</th></tr></thead><tbody><tr><td><code>i32</code>, <code>bool</code>, <code>String</code></td><td>✅</td><td>✅</td><td>基本类型，无共享状态</td></tr><tr><td><code>Rc&lt;T&gt;</code></td><td>❌</td><td>❌</td><td>引用计数非原子</td></tr><tr><td><code>Arc&lt;T&gt;</code></td><td>✅</td><td>✅</td><td>引用计数原子操作</td></tr><tr><td><code>Mutex&lt;T&gt;</code></td><td>✅ (T: Send)</td><td>✅</td><td>OS 锁保证互斥</td></tr><tr><td><code>RefCell&lt;T&gt;</code></td><td>✅ (T: Send)</td><td>❌</td><td>借用检查非原子</td></tr><tr><td><code>*mut T</code>（裸指针）</td><td>❌</td><td>❌</td><td>无安全保证</td></tr></tbody></table>
<h1 id="练习题">练习题</h1>
<h2 id="测验">测验</h2>
</div>
</div>
</div>
</div>
</div>
</div> 