---
title: "什么是所有权"
description: "所有权系统 - 什么是所有权"
date: "2026-07-12"
order: 3002
tags: ["所有权", "作用域", "String", "drop", "可变性", "let mut", "遮蔽"]
est_time: "30 分钟"
---

 <h1 id="核心思想">核心思想</h1>
<h2 id="什么是所有权系统">什么是所有权系统</h2>
<p><strong>所有权系统</strong>是 Rust 用来管理内存的核心机制。它的基本思想很简单：<strong>每个值都有一个所有者负责它的生命周期</strong>。</p>
<p>这听起来抽象，但解决的是一个现实问题：</p>
<p>在其他编程语言中：</p>
<ul>
<li><strong>Java/Python</strong>：用垃圾回收器（GC）自动清理，但有运行时开销，暂停不可控</li>
<li><strong>C/C++</strong>：程序员手动管理内存（<code>malloc</code>/<code>free</code>），容易出现内存泄漏、悬垂指针、二次释放等 bug</li>
</ul>
<p>Rust 的答案是：<strong>在编译时通过静态分析，让编译器确保只有一个所有者负责释放每个值，从而零运行时开销地保证内存安全</strong>。</p>
<blockquote>
<p><strong>易混淆概念澄清</strong>：所有权（ownership）和可变性（mutability）是<strong>两个完全独立</strong>的概念。</p>
<ul>
<li><strong>所有权</strong>：回答的问题是”谁负责释放这个值？”</li>
<li><strong>可变性</strong>：回答的问题是”这个值能否被修改？”</li>
</ul>
<p>一个不可变的变量可以转移所有权给可变的变量；一个可变的变量也可以被销毁而不修改。它们没有必然关系。</p>
</blockquote>
<h2 id="三条黄金规则">三条黄金规则</h2>
<p>所有权系统的核心思想只有三条规则。理解它们，一切都能推导出来：</p>
<p><strong>规则一</strong>：<strong>Rust 中每一个值都有一个「所有者（owner）」变量。</strong></p>
<p><strong>规则二</strong>：<strong>值在任一时刻有且只有一个所有者。</strong></p>
<p><strong>规则三</strong>：<strong>当所有者离开作用域，这个值将被「自动丢弃（drop）」</strong></p>
<p>这三条规则一起工作，确保：</p>
<ul>
<li>✓ 没有内存泄漏（规则三：自动清理）</li>
<li>✓ 没有二次释放（规则二：只有一个所有者）</li>
<li>✓ 没有悬垂指针（规则三：所有者消失时数据也消失）</li>
<li>✓ 零运行时开销（规则一：编译期静态检查）</li>
</ul>
<h1 id="规则详解">规则详解</h1>
<h2 id="规则一与二所有者与单一性">规则一与二：所有者与单一性</h2>
<h3 id="问题背景二次释放">问题背景：二次释放</h3>
<p>先看一个问题。在 C 中，如果你不小心这样做：</p>
<pre><code class="language-c">// C 语言中的问题
char* s1 = malloc(100);
char* s2 = s1;      // 两个指针指向同一块内存

free(s1);           // 释放一次
free(s2);           // 释放第二次 → 二次释放 bug！内存崩溃</code></pre>
<p>或者在没有 GC 的环境中：</p>
<pre><code class="language-plaintext">s1 指向堆上的数据 → s1 被释放了
s2 仍然指向那块内存 → s2 成了悬垂指针
访问 s2 → 使用已释放的内存 → 未定义行为</code></pre>
<p>这是内存安全的大敌：<strong>同一块内存被释放多次，或者被释放后还被访问</strong>。</p>
<h3 id="rust-的解决方案">Rust 的解决方案</h3>
<p>Rust 通过规则一和规则二直接禁止这种情况：</p>
<blockquote>
<p><strong>不允许两个变量同时有效地指向同一块堆数据</strong></p>
</blockquote>
<p>如果一个变量要把数据的控制权交给另一个变量，那就<strong>转移所有权</strong>——原变量失效，新变量成为唯一的所有者。这样：</p>
<ul>
<li>✓ 永远只有一个所有者，只释放一次</li>
<li>✓ 原变量失效后无法访问，不存在悬垂指针</li>
<li>✓ 编译器在编译期就检查这一点，运行时零开销</li>
</ul>
<p>看具体例子：</p>
<p>每个值都需要一个”主人”来负责它，而且只能有一个主人。当主人改变时，所有权就转移了：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s1%20%3D%20String%3A%3Afrom(%22hello%22)%3B%20%20%2F%2F%20s1%20%E6%8B%A5%E6%9C%89%E8%BF%99%E4%B8%AA%20String%0A%0A%20%20%20%20let%20s2%20%3D%20s1%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E6%89%80%E6%9C%89%E6%9D%83%E8%BD%AC%E7%A7%BB%E7%BB%99%20s2%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E7%8E%B0%E5%9C%A8%20s2%20%E6%98%AF%E4%B8%BB%E4%BA%BA%EF%BC%8Cs1%20%E5%A4%B1%E6%95%88%E4%BA%86%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s2)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E2%9C%93%20%E5%8F%AF%E4%BB%A5%EF%BC%8Cs2%20%E6%8B%A5%E6%9C%89%E6%95%B0%E6%8D%AE%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20s1)%3B%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%8Cs1%20%E5%B7%B2%E5%A4%B1%E6%95%88%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s1 = String::from("hello");  // s1 拥有这个 String

    let s2 = s1;                      // 所有权转移给 s2
                                      // 现在 s2 是主人，s1 失效了

    println!("{}", s2);               // ✓ 可以，s2 拥有数据
    // println!("{}", s1);            // ✗ 错误，s1 已失效
}</code></pre></div>
<p><strong>这里发生了什么</strong>：</p>
<ul>
<li><code>s1</code> 原本拥有 String 数据的所有权</li>
<li><code>let s2 = s1</code> 执行时，所有权转移给 <code>s2</code></li>
<li><code>s1</code> 从这一刻起<strong>失效</strong>了（Rust 编译器禁止访问，因此也不能再通过它去做释放了）</li>
<li>只有 <code>s2</code> 可以访问数据，作用域结束时 <code>s2</code> 负责释放</li>
</ul>
<p><strong>为什么 <code>s1</code> 会失效</strong>？因为 <code>String</code> 存在堆上，有释放的成本。Rust 不允许两个变量同时指向同一块堆数据，否则就回到了”谁来释放”的问题上。</p>
<p><strong>栈类型是个例外</strong>。整数这样的小数据存在栈上，复制成本极低，Rust 自动为它们复制而不是移动（可以再回忆下上一篇文章讲的三种数据流动方式）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20let%20y%20%3D%20x%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E8%87%AA%E5%8A%A8%E5%A4%8D%E5%88%B6%0A%0A%20%20%20%20println!(%22x%3D%7B%7D%2C%20y%3D%7B%7D%22%2C%20x%2C%20y)%3B%20%20%2F%2F%20%E2%9C%93%20%E4%B8%A4%E4%B8%AA%E9%83%BD%E6%9C%89%E6%95%88%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 5;
    let y = x;              // 自动复制

    println!("x={}, y={}", x, y);  // ✓ 两个都有效
}</code></pre></div>
<h2 id="规则三作用域与自动释放">规则三：作用域与自动释放</h2>
<p>当一个变量离开作用域，它的值自动被释放（drop）。这就是 Rust 不需要手动 <code>free</code> 的原因（因此避免了手动释放的安全风险）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%20%20%2F%2F%20s%20%E4%BB%8E%E8%BF%99%E9%87%8C%E5%BC%80%E5%A7%8B%E6%9C%89%E6%95%88%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%20%20%20%20%7D%20%20%2F%2F%20s%20%E7%A6%BB%E5%BC%80%E4%BD%9C%E7%94%A8%E5%9F%9F%EF%BC%8CRust%20%E8%87%AA%E5%8A%A8%E8%B0%83%E7%94%A8%20drop%EF%BC%8C%E5%A0%86%E5%86%85%E5%AD%98%E8%A2%AB%E9%87%8A%E6%94%BE%0A%0A%20%20%20%20%2F%2F%20s%20%E5%B7%B2%E4%B8%8D%E5%AD%98%E5%9C%A8%EF%BC%8C%E8%AE%BF%E9%97%AE%E4%BC%9A%E6%8A%A5%E9%94%99%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    {
        let s = String::from("hello");  // s 从这里开始有效
        println!("{}", s);
    }  // s 离开作用域，Rust 自动调用 drop，堆内存被释放

    // s 已不存在，访问会报错
}</code></pre></div>
<p>对比其他语言：</p>
<ul>
<li>Java：GC 在某个时间点清理（时机不确定）</li>
<li>C：需要手动 <code>free</code>（容易忘记）</li>
<li>Rust：作用域结束立即释放（确定且无开销）</li>
</ul>
<h1 id="所有权转移">所有权转移</h1>
<h2 id="什么是所有权转移">什么是所有权转移？</h2>
<p>前面讲了三条所有权规则，但有个关键概念还没深入：<strong>当一个值从一个所有者转到另一个所有者时会发生什么</strong>？</p>
<p>这就是<strong>所有权转移</strong>（move）——一个值的所有权从一个变量转移到另一个变量。这是 Rust 实现规则二（“值在任一时刻有且只有一个所有者”）的核心机制。</p>
<h2 id="为什么要理解所有权转移">为什么要理解所有权转移？</h2>
<p>回顾前面讲过的：</p>
<ul>
<li><strong>规则二</strong> 说：一个值永远只能有一个所有者</li>
<li>这意味着：<strong>当多个变量都想”拥有”同一个值时，Rust 不允许</strong></li>
<li>Rust 的解决方案：<strong>让原所有者失效，新变量成为唯一的所有者</strong></li>
</ul>
<p>所有权转移就是这个”转移”过程。理解它，才能理解 Rust 如何在编译期保证内存安全。</p>
<p><strong>核心原则</strong>：只要一个值被”消费”了（被移动到新的所有者），所有权就转移。原所有者从此失效。这发生在以下场景：</p>
<h3 id="场景一赋值">场景一：赋值</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s1%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20let%20s2%20%3D%20s1%3B%20%20%2F%2F%20s1%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%E8%BD%AC%E7%A7%BB%E7%BB%99%20s2%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s2)%3B%20%20%2F%2F%20%E2%9C%93%20%E5%8F%AF%E4%BB%A5%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20s1)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%9As1%20%E5%B7%B2%E5%A4%B1%E6%95%88%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s1 = String::from("hello");
    let s2 = s1;  // s1 的所有权转移给 s2

    println!("{}", s2);  // ✓ 可以
    // println!("{}", s1);  // ✗ 错误：s1 已失效
}</code></pre></div>
<h3 id="场景二函数传参">场景二：函数传参</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20takes_ownership(s)%3B%20%20%2F%2F%20s%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%E8%BD%AC%E7%A7%BB%E5%88%B0%E5%87%BD%E6%95%B0%E5%86%85%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20s)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%9As%20%E5%B7%B2%E5%A4%B1%E6%95%88%0A%7D%0A%0Afn%20takes_ownership(s%3A%20String)%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D%20%20%2F%2F%20s%20%E7%A6%BB%E5%BC%80%E4%BD%9C%E7%94%A8%E5%9F%9F%EF%BC%8C%E5%A0%86%E5%86%85%E5%AD%98%E9%87%8A%E6%94%BE" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = String::from("hello");
    takes_ownership(s);  // s 的所有权转移到函数内
    // println!("{}", s);  // ✗ 错误：s 已失效
}

fn takes_ownership(s: String) {
    println!("{}", s);
}  // s 离开作用域，堆内存释放</code></pre></div>
<h3 id="场景三函数返回">场景三：函数返回</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s1%20%3D%20gives_ownership()%3B%20%20%2F%2F%20%E5%87%BD%E6%95%B0%E8%BF%94%E5%9B%9E%E7%9A%84%20String%20%E6%89%80%E6%9C%89%E6%9D%83%E8%BD%AC%E7%BB%99%20s1%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s1)%3B%0A%7D%0A%0Afn%20gives_ownership()%20-%3E%20String%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22yours%22)%3B%0A%20%20%20%20s%20%20%2F%2F%20%E8%BF%94%E5%9B%9E%20s%EF%BC%8C%E6%89%80%E6%9C%89%E6%9D%83%E8%BD%AC%E7%A7%BB%E7%BB%99%E8%B0%83%E7%94%A8%E8%80%85%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s1 = gives_ownership();  // 函数返回的 String 所有权转给 s1
    println!("{}", s1);
}

fn gives_ownership() -&gt; String {
    let s = String::from("yours");
    s  // 返回 s，所有权转移给调用者
}</code></pre></div>
<h3 id="其他场景">其他场景</h3>
<p>模式匹配、match 表达式、for 循环、闭包捕获等也都会转移所有权：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%A8%A1%E5%BC%8F%E5%8C%B9%E9%85%8D%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20let%20(a%2C%20b)%20%3D%20(%22x%22%2C%20s)%3B%20%20%2F%2F%20s%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%E8%BD%AC%E7%A7%BB%E5%88%B0%E6%A8%A1%E5%BC%8F%E4%B8%AD%0A%0A%20%20%20%20%2F%2F%20match%20%E8%A1%A8%E8%BE%BE%E5%BC%8F%0A%20%20%20%20match%20b%20%7B%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20println!(%22%7B%7D%22%2C%20b)%2C%20%20%2F%2F%20b%20%E8%A2%AB%E6%B6%88%E8%B4%B9%0A%20%20%20%20%7D%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20b)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%9Ab%20%E5%B7%B2%E5%A4%B1%E6%95%88%0A%0A%20%20%20%20%2F%2F%20for%20%E5%BE%AA%E7%8E%AF%0A%20%20%20%20let%20vec%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%20%20%20%20for%20item%20in%20vec%20%7B%20%20%2F%2F%20vec%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%E8%A2%AB%E8%BD%AC%E7%A7%BB%E5%88%B0%E8%BF%AD%E4%BB%A3%E5%99%A8%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20item)%3B%0A%20%20%20%20%7D%0A%20%20%20%20%2F%2F%20println!(%22%7B%3A%3F%7D%22%2C%20vec)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%9Avec%20%E5%B7%B2%E5%A4%B1%E6%95%88%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 模式匹配
    let s = String::from("hello");
    let (a, b) = ("x", s);  // s 的所有权转移到模式中

    // match 表达式
    match b {
        _ =&gt; println!("{}", b),  // b 被消费
    }
    // println!("{}", b);  // ✗ 错误：b 已失效

    // for 循环
    let vec = vec![1, 2, 3];
    for item in vec {  // vec 的所有权被转移到迭代器
        println!("{}", item);
    }
    // println!("{:?}", vec);  // ✗ 错误：vec 已失效
}</code></pre></div>
<h2 id="注意copy-类型不转移所有权">注意：Copy 类型不转移所有权</h2>
<p><strong>并非所有类型都会转移所有权！</strong> 对于栈类型（整数、布尔等），Rust 会自动复制而不是转移：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E8%B5%8B%E5%80%BC%E6%97%B6%E5%A4%8D%E5%88%B6%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20let%20y%20%3D%20x%3B%20%20%2F%2F%20%E8%87%AA%E5%8A%A8%E5%A4%8D%E5%88%B6%EF%BC%8C%E4%B8%8D%E8%BD%AC%E7%A7%BB%E6%89%80%E6%9C%89%E6%9D%83%0A%20%20%20%20println!(%22x%3D%7B%7D%2C%20y%3D%7B%7D%22%2C%20x%2C%20y)%3B%20%20%2F%2F%20%E2%9C%93%20%E4%B8%A4%E4%B8%AA%E9%83%BD%E6%9C%89%E6%95%88%0A%0A%20%20%20%20%2F%2F%20%E5%87%BD%E6%95%B0%E4%BC%A0%E5%8F%82%E6%97%B6%E5%A4%8D%E5%88%B6%0A%20%20%20%20let%20a%20%3D%2042%3B%0A%20%20%20%20print_number(a)%3B%20%20%2F%2F%20%E8%87%AA%E5%8A%A8%E5%A4%8D%E5%88%B6%EF%BC%8Ca%20%E4%BB%8D%E6%9C%89%E6%95%88%0A%20%20%20%20println!(%22a%3D%7B%7D%22%2C%20a)%3B%20%20%2F%2F%20%E2%9C%93%20%E6%9C%89%E6%95%88%0A%0A%20%20%20%20%2F%2F%20%E5%87%BD%E6%95%B0%E8%BF%94%E5%9B%9E%E6%97%B6%E5%A4%8D%E5%88%B6%0A%20%20%20%20let%20b%20%3D%20get_number()%3B%20%20%2F%2F%20%E8%87%AA%E5%8A%A8%E5%A4%8D%E5%88%B6%0A%20%20%20%20println!(%22b%3D%7B%7D%22%2C%20b)%3B%0A%7D%0A%0Afn%20print_number(x%3A%20i32)%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20x)%3B%0A%7D%0A%0Afn%20get_number()%20-%3E%20i32%20%7B%0A%20%20%20%2042%20%20%2F%2F%20%E8%87%AA%E5%8A%A8%E5%A4%8D%E5%88%B6%E7%BB%99%E8%B0%83%E7%94%A8%E8%80%85%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 赋值时复制
    let x = 5;
    let y = x;  // 自动复制，不转移所有权
    println!("x={}, y={}", x, y);  // ✓ 两个都有效

    // 函数传参时复制
    let a = 42;
    print_number(a);  // 自动复制，a 仍有效
    println!("a={}", a);  // ✓ 有效

    // 函数返回时复制
    let b = get_number();  // 自动复制
    println!("b={}", b);
}

fn print_number(x: i32) {
    println!("{}", x);
}

fn get_number() -&gt; i32 {
    42  // 自动复制给调用者
}</code></pre></div>
<p><strong>为什么</strong>？因为这些类型实现了 <code>Copy</code> 特征——它们存在栈上，复制成本极低，所以 Rust 默认复制而不转移。也就是说之前讲解过的三种数据流动形式中只有 Move 才会进行所有权转移。</p>
<h2 id="对比string-vs-i32">对比：String vs i32</h2>
<p>看一个更清晰的对比：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20String%EF%BC%9A%E5%A0%86%E7%B1%BB%E5%9E%8B%EF%BC%8C%E8%BD%AC%E7%A7%BB%E6%89%80%E6%9C%89%E6%9D%83%0A%20%20%20%20let%20s1%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20let%20s2%20%3D%20s1%3B%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20s1)%3B%20%20%2F%2F%20%E2%9C%97%20s1%20%E5%B7%B2%E5%A4%B1%E6%95%88%0A%0A%20%20%20%20%2F%2F%20i32%EF%BC%9A%E6%A0%88%E7%B1%BB%E5%9E%8B%EF%BC%8C%E8%87%AA%E5%8A%A8%E5%A4%8D%E5%88%B6%0A%20%20%20%20let%20n1%20%3D%2042%3B%0A%20%20%20%20let%20n2%20%3D%20n1%3B%0A%20%20%20%20println!(%22n1%3D%7B%7D%2C%20n2%3D%7B%7D%22%2C%20n1%2C%20n2)%3B%20%20%2F%2F%20%E2%9C%93%20%E9%83%BD%E6%9C%89%E6%95%88%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // String：堆类型，转移所有权
    let s1 = String::from("hello");
    let s2 = s1;
    // println!("{}", s1);  // ✗ s1 已失效

    // i32：栈类型，自动复制
    let n1 = 42;
    let n2 = n1;
    println!("n1={}, n2={}", n1, n2);  // ✓ 都有效
}</code></pre></div>
<table><thead><tr><th></th><th>String（堆）</th><th>i32（栈）</th></tr></thead><tbody><tr><td><code>let b = a</code></td><td>转移所有权，a 失效</td><td>复制值，a 仍有效</td></tr><tr><td><code>func(a)</code></td><td>转移所有权，a 失效</td><td>复制值，a 仍有效</td></tr><tr><td><code>return a</code></td><td>转移所有权给调用者</td><td>复制值给调用者</td></tr></tbody></table>
<p>这样虽然工作，但对于堆类型频繁地”传进去再返回”很烦。Rust 提供了更优雅的方案——<strong>引用</strong>（下一篇的主题）。</p>
<h1 id="所有权系统的作用">所有权系统的作用</h1>
<p>你可能想：所有权系统这么复杂，是不是只有堆类型才需要？<strong>不是的。</strong> 所有权系统的作用远不止管理堆内存。</p>
<h2 id="所有权不只是堆的问题">所有权不只是堆的问题</h2>
<p>即使程序中完全不用堆，所有权系统仍然有用：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%A0%88%E7%B1%BB%E5%9E%8B%EF%BC%8C%E5%85%A8%E6%98%AF%20Copy%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20let%20y%20%3D%20x%3B%20%20%2F%2F%20%E5%A4%8D%E5%88%B6%0A%0A%20%20%20%20println!(%22x%3D%7B%7D%2C%20y%3D%7B%7D%22%2C%20x%2C%20y)%3B%20%20%2F%2F%20%E9%83%BD%E6%9C%89%E6%95%88%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 栈类型，全是 Copy
    let x = 5;
    let y = x;  // 复制

    println!("x={}, y={}", x, y);  // 都有效
}</code></pre></div>
<p>这里没有堆，没有内存释放的复杂性，但<strong>所有权规则仍然在保护你</strong>——保护的是<strong>变量的生命周期和使用范围</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20x%20%3D%205%3B%20%20%2F%2F%20x%20%E4%BB%8E%E8%BF%99%E9%87%8C%E5%BC%80%E5%A7%8B%E6%9C%89%E6%95%88%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20x)%3B%20%20%2F%2F%20%E2%9C%93%20%E6%9C%89%E6%95%88%0A%20%20%20%20%7D%20%20%2F%2F%20x%20%E7%A6%BB%E5%BC%80%E4%BD%9C%E7%94%A8%E5%9F%9F%EF%BC%8C%E5%A4%B1%E6%95%88%0A%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20x)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%9Ax%20%E5%B7%B2%E6%97%A0%E6%95%88%EF%BC%8C%E7%BC%96%E8%AF%91%E5%99%A8%E9%98%BB%E6%AD%A2%E4%BD%A0%E8%AE%BF%E9%97%AE%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    {
        let x = 5;  // x 从这里开始有效
        println!("{}", x);  // ✓ 有效
    }  // x 离开作用域，失效

    // println!("{}", x);  // ✗ 错误：x 已无效，编译器阻止你访问
}</code></pre></div>
<p>对于栈类型，所有权规则保护你的是：</p>
<ul>
<li><strong>确定的作用域</strong>：变量在出作用域时自动失效，不会有悬垂变量</li>
<li><strong>清晰的生命周期</strong>：一眼看出变量何时存在、何时消失</li>
<li><strong>防止意外使用</strong>：即使是栈变量，也不能超出作用域使用</li>
</ul>
<h2 id="所有权的真正作用">所有权的真正作用</h2>
<p>所有权系统的核心不是”防止内存泄漏”，而是<strong>确保资源的唯一管理者</strong>。这涵盖的远不止内存：</p>
<h3 id="1-规范资源的生命周期">1. <strong>规范资源的生命周期</strong></h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20file%20%3D%20std%3A%3Afs%3A%3AFile%3A%3Aopen(%22test.txt%22).ok()%3B%20%20%2F%2F%20%E6%89%93%E5%BC%80%E6%96%87%E4%BB%B6%E8%B5%84%E6%BA%90%0A%0A%20%20%20%20%2F%2F%20file%20%E7%A6%BB%E5%BC%80%E4%BD%9C%E7%94%A8%E5%9F%9F%E6%97%B6%EF%BC%8C%E6%96%87%E4%BB%B6%E8%87%AA%E5%8A%A8%E5%85%B3%E9%97%AD%EF%BC%88%E4%B8%8D%E6%98%AF%E6%B3%84%E6%BC%8F%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let file = std::fs::File::open("test.txt").ok();  // 打开文件资源

    // file 离开作用域时，文件自动关闭（不是泄漏）
}</code></pre></div>
<p>文件、网络连接、互斥锁等<strong>非内存资源</strong>也需要确定的生命周期。所有权系统保证了这一点。</p>
<h3 id="2-防止数据竞争">2. <strong>防止数据竞争</strong></h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20data%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E8%83%BD%E6%9C%89%E4%B8%80%E4%B8%AA%E6%89%80%E6%9C%89%E8%80%85%EF%BC%8C%E4%BF%9D%E8%AF%81%E5%90%8C%E4%B8%80%E6%97%B6%E5%88%BB%E5%8F%AA%E6%9C%89%E4%B8%80%E4%B8%AA%E5%9C%B0%E6%96%B9%E4%BF%AE%E6%94%B9%E6%95%B0%E6%8D%AE%0A%20%20%20%20%2F%2F%20%E8%BF%99%E6%98%AF%20Rust%20%E6%97%A0%E9%9C%80%20GC%20%E4%B9%9F%E8%83%BD%E4%BF%9D%E8%AF%81%E7%BA%BF%E7%A8%8B%E5%AE%89%E5%85%A8%E7%9A%84%E5%8E%9F%E5%9B%A0%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let data = vec![1, 2, 3];

    // 只能有一个所有者，保证同一时刻只有一个地方修改数据
    // 这是 Rust 无需 GC 也能保证线程安全的原因
}</code></pre></div>
<p>多个所有者 = 可能的数据竞争。Rust 通过所有权规则完全消除了这个问题。</p>
<h3 id="3-明确责任">3. <strong>明确责任</strong></h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20%2F%2F%20%E4%B8%80%E7%9C%BC%E7%9C%8B%E5%87%BA%EF%BC%9A%E8%B0%81%E8%B4%9F%E8%B4%A3%E6%B8%85%E7%90%86%E8%BF%99%E4%B8%AA%20String%EF%BC%9F%E5%B0%B1%E6%98%AF%20s%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = String::from("hello");
    // 一眼看出：谁负责清理这个 String？就是 s
}</code></pre></div>
<p>对比其他语言：在共享指针或 GC 环境中，你永远不知道谁负责清理。Rust 中，<strong>所有权明确说明了责任</strong>。</p>
<h2 id="总结所有权的三大价值">总结：所有权的三大价值</h2>
<table><thead><tr><th>价值</th><th>作用</th><th>例子</th></tr></thead><tbody><tr><td><strong>内存安全</strong></td><td>防止悬垂指针、二次释放、内存泄漏</td><td>String、Vec</td></tr><tr><td><strong>资源安全</strong></td><td>确保文件、锁等资源的确定释放</td><td>文件、Mutex</td></tr><tr><td><strong>并发安全</strong></td><td>编译期防止数据竞争，无需原子操作或锁</td><td>多线程代码</td></tr></tbody></table>
<p>所以，所有权系统的用处不是”只用堆才有用”，而是<strong>贯穿整个程序，保证所有资源的安全管理</strong>。</p>
<h1 id="练习题">练习题</h1>
<h2 id="所有权规则测验">所有权规则测验</h2>
<pre><code class="language-rust">fn main() {
    let s1 = String::from("rust");
    let s2 = s1;
    println!("{}", s1);
}</code></pre>
</div>
<h2 id="所有权转移的场景判断">所有权转移的场景判断</h2>
</div>
<h2 id="copy-vs-move">Copy vs Move</h2>
<pre><code class="language-rust">fn main() {
    let a = 42;
    let b = a;
    let s1 = String::from("hi");
    let s2 = s1;
}</code></pre>
</div>
<h2 id="作用域与-drop">作用域与 Drop</h2>
<pre><code class="language-rust">fn main() {
    {
        let s = String::from("hello");
        println!("{}", s);
    }
}</code></pre>
</div>
<h2 id="栈类型的所有权保护">栈类型的所有权保护</h2>
<pre><code class="language-rust">fn main() {
    let x = 10;
    {
        let y = x;  // 复制，因为 i32 是 Copy
        // y 是 x 的一个独立副本
    }
    println!("{}", x);  // ✓ 可以，x 仍有效
}</code></pre>
</div>
<h2 id="所有权与可变性的独立性">所有权与可变性的独立性</h2>
<pre><code class="language-rust">fn main() {
    let immutable = String::from("hello");  // 不可变，但有所有权
    let mut mutable = immutable;             // 可变，获得所有权
    mutable.push_str("!");                   // ✓ 可以修改
    // println!("{}", immutable);             // ✗ 错误，所有权已转移
}</code></pre>
</div>
<h2 id="编程练习修复所有权错误">编程练习：修复所有权错误</h2>
<p>下面的代码有所有权错误，请修复它，使输出为 <code>s1 = hello, s2 = hello</code>。</p>
<div class="code-editor" data-block-id="03-ownership/02-what-is-ownership#4:6" data-expect-mode="literal" data-expect-pattern="s1%20%3D%20hello%2C%20s2%20%3D%20hello" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20s1%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20let%20s2%20%3D%20s1%3B%0A%20%20%20%20println!(%22s1%20%3D%20%7B%7D%2C%20s2%20%3D%20%7B%7D%22%2C%20s1%2C%20s2)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("s1 = {}, s2 = {}", s1, s2);
}</code></pre></div>
<p><strong>提示</strong>：想想上一章讲过的”三种数据流动方式”，怎样才能让 s1 和 s2 都有效？</p>
<hr/>
<p>下面的代码没有正确接收函数返回的所有权，请修复它使其能正常输出。</p>
<div class="code-editor" data-block-id="03-ownership/02-what-is-ownership#4:7" data-expect-mode="literal" data-expect-pattern="hello" data-starter-code="fn%20create_string()%20-%3E%20String%20%7B%0A%20%20%20%20String%3A%3Afrom(%22hello%22)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20create_string()%3B%20%20%2F%2F%20%E8%BF%99%E9%87%8C%E6%B2%A1%E6%9C%89%E6%8E%A5%E6%94%B6%E8%BF%94%E5%9B%9E%E5%80%BC%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%20%20%2F%2F%20s%20%E6%B2%A1%E6%9C%89%E8%A2%AB%E5%AE%9A%E4%B9%89%0A%7D"><pre><code class="language-rust">fn create_string() -&gt; String {
    String::from("hello")
}

fn main() {
    create_string();  // 这里没有接收返回值
    println!("{}", s);  // s 没有被定义
}</code></pre></div>
<p><strong>提示</strong>：函数返回一个 String，调用者需要用变量接收它。所有权会从函数转移到这个接收变量。</p> 