---
title: "为什么需要生命周期"
description: "生命周期 - 为什么需要生命周期"
date: "2026-07-12"
order: 11001
tags: ["lifetime", "生命周期", "悬垂引用", "借用检查器", "borrow checker"]
est_time: "15 分钟"
---

 <h1 id="悬垂引用问题">悬垂引用问题</h1>
<p>你已经知道 Rust 有”借用”这个概念：可以不转移所有权、只拿一个引用。但引用有个潜在风险——如果被引用的数据已经销毁了，引用还在，就会指向无效内存，这叫<strong>悬垂引用</strong>（dangling reference）。</p>
<p>C/C++ 程序员对这类 bug 再熟悉不过了：use-after-free、野指针……Rust 的目标是让这类错误<strong>在编译期就被发现</strong>，永远不到运行时。</p>
<h2 id="一个会出问题的例子">一个会出问题的例子</h2>
<p>看这段代码（你可能在借用与引用章节已经见过，我们再回顾一下）——它试图在内部作用域之外使用一个指向内部变量的引用：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20r%3B%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20%20%20%20%20r%20%3D%20%26x%3B%20%20%20%20%20%20%20%2F%2F%20r%20%E5%80%9F%E7%94%A8%E4%BA%86%20x%0A%20%20%20%20%7D%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20x%20%E5%9C%A8%E8%BF%99%E9%87%8C%E8%A2%AB%E9%94%80%E6%AF%81%0A%0A%20%20%20%20println!(%22r%3A%20%7B%7D%22%2C%20r)%3B%20%2F%2F%20%E5%8D%B1%E9%99%A9%EF%BC%81x%20%E5%B7%B2%E7%BB%8F%E4%B8%8D%E5%AD%98%E5%9C%A8%E4%BA%86%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let r;

    {
        let x = 5;
        r = &amp;x;       // r 借用了 x
    }                 // x 在这里被销毁

    println!("r: {}", r); // 危险！x 已经不存在了
}</code></pre></div>
<blockquote>
<p>Rust 会直接拒绝编译，报错：<code>`x` does not live long enough</code></p>
</blockquote>
<p><code>x</code> 的生命在内部 <code>{}</code> 结束时就结束了，但 <code>r</code> 要活到 <code>println!</code> 那行。<code>r</code> 比它所引用的数据活得更久——这就是悬垂引用。</p>
<h2 id="没有问题的版本">没有问题的版本</h2>
<p>只要让被引用的数据比引用活得更久，就没有问题：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20x%20%E5%9C%A8%E8%BF%99%E9%87%8C%E5%88%9B%E5%BB%BA%EF%BC%8C%E6%B4%BB%E5%BE%97%E6%9B%B4%E9%95%BF%0A%20%20%20%20let%20r%20%3D%20%26x%3B%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20r%20%E5%80%9F%E7%94%A8%20x%0A%20%20%20%20println!(%22r%3A%20%7B%7D%22%2C%20r)%3B%20%2F%2F%20%E6%AD%A4%E6%97%B6%20x%20%E8%BF%98%E6%B4%BB%E7%9D%80%EF%BC%8C%E5%AE%8C%E5%85%A8%E5%90%88%E6%B3%95%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 5;            // x 在这里创建，活得更长
    let r = &amp;x;           // r 借用 x
    println!("r: {}", r); // 此时 x 还活着，完全合法
}</code></pre></div>
<p>这两个例子的区别只是 <code>x</code> 声明的位置，但 Rust 完全知道哪个可以、哪个不行。靠什么知道？靠<strong>借用检查器</strong>。</p>
<h1 id="借用检查器">借用检查器</h1>
<h2 id="编译器如何做判断">编译器如何做判断</h2>
<p>Rust 编译器内置了<strong>借用检查器</strong>（borrow checker），它的工作就是比对引用的生命周期与被引用数据的生命周期，确保前者不会超过后者。</p>
<p>我们用注释把生命周期可视化出来，看第一个出错的例子：</p>
<pre><code class="language-rust">{
    let r;                // ------+-- 'r 的生命周期开始
                          //       |
    {                     //       |
        let x = 5;        // -+--  |  'x 的生命周期开始
        r = &amp;x;           //  |    |
    }                     // -+    |  'x 生命周期结束！x 被销毁
                          //       |
    println!("{}", r);    //       |  r 仍然在用，但 'x 已经结束
}                         // ------+</code></pre>
<p><code>r</code> 的生命周期 <code>'r</code> 比 <code>x</code> 的生命周期 <code>'x</code> 更长。<code>r</code> 引用了 <code>x</code>，所以 <code>'x</code> 必须覆盖 <code>'r</code> 的整个范围——但它没有，编译器报错。</p>
<h2 id="正确例子的生命周期">正确例子的生命周期</h2>
<pre><code class="language-rust">{
    let x = 5;            // ------+-- 'x 开始
                          //       |
    let r = &amp;x;           // --+   |  'r 开始
                          //   |   |
    println!("{}", r);    //   |   |
                          // --+   |  'r 结束
}                         // ------+  'x 结束</code></pre>
<p><code>'x</code> 完全包含了 <code>'r</code>，引用有效，编译通过。</p>
<h2 id="生命周期不是程序员发明的">生命周期不是程序员”发明”的</h2>
<p>生命周期参数（<code>'a</code>、<code>'b</code> 这样的写法）不是 Rust 独有的概念，它实际上描述的是<strong>引用存在的那段时间</strong>——这段时间本来就存在，只是 Rust 让你在某些场合把它写出来，让编译器能够核验。</p>
<p>就像类型标注一样：变量有类型是客观事实，大多数时候编译器能推断，偶尔你需要写出来。生命周期也是如此——大多数时候编译器能推断（这叫”省略”），偶尔你需要手动标注。</p>
<h1 id="练习题">练习题</h1>
<h2 id="基础概念测验">基础概念测验</h2>
</div>
</div>
<pre><code class="language-rust">fn main() {
    let r;
    {
        let x = 10;
        r = &amp;x;
    }
    println!("{}", r);
}</code></pre>
</div>
</div>
</div> 