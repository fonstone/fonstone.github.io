---
title: "引用与借用"
description: "所有权系统 - 引用与借用"
date: "2026-07-12"
order: 3003
tags: ["引用", "借用", "&T", "&mut T", "可变引用", "悬垂引用", "借用检查器", "NLL"]
est_time: "40 分钟"
---

 <h1 id="引用概述">引用概述</h1>
<p>上一篇讲了所有权转移，但有个问题：每次函数调用都转移所有权会很麻烦。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s1%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20let%20(s2%2C%20len)%20%3D%20calculate_length(s1)%3B%20%2F%2F%20s1%20%E8%A2%AB%E8%BD%AC%E7%A7%BB%E8%BF%9B%E5%87%BD%E6%95%B0%0A%20%20%20%20println!(%22'%7B%7D'%20%E7%9A%84%E9%95%BF%E5%BA%A6%E6%98%AF%20%7B%7D%22%2C%20s2%2C%20len)%3B%0A%7D%0A%0Afn%20calculate_length(s%3A%20String)%20-%3E%20(String%2C%20usize)%20%7B%0A%20%20%20%20let%20length%20%3D%20s.len()%3B%0A%20%20%20%20(s%2C%20length)%20%2F%2F%20%E5%BF%85%E9%A1%BB%E6%8A%8A%20s%20%E4%B8%80%E8%B5%B7%E8%BF%94%E5%9B%9E%EF%BC%8C%E5%90%A6%E5%88%99%E8%BF%99%E9%87%8C%20%7D%20%E4%BC%9A%E5%B0%86%E5%85%B6%E9%94%80%E6%AF%81%EF%BC%8C%E8%B0%83%E7%94%A8%E8%80%85%EF%BC%88main%EF%BC%89%E5%86%8D%E4%B9%9F%E6%8B%BF%E4%B8%8D%E5%88%B0%E5%AE%83%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s1 = String::from("hello");
    let (s2, len) = calculate_length(s1); // s1 被转移进函数
    println!("'{}' 的长度是 {}", s2, len);
}

fn calculate_length(s: String) -&gt; (String, usize) {
    let length = s.len();
    (s, length) // 必须把 s 一起返回，否则这里 } 会将其销毁，调用者（main）再也拿不到它
}</code></pre></div>
<p>为了在函数返回后还能使用 <code>s1</code>，不得不把它连同结果一起装进元组返回。这太繁琐了。</p>
<p>有没有办法让函数<strong>临时借用</strong>数据，查看一下，然后让调用者继续拥有它？答案就是<strong>引用</strong>（reference）。</p>
<h2 id="什么是引用">什么是引用</h2>
<p><strong>引用</strong>（reference）是一个指向值的指针，但它<strong>不拥有这个值</strong>。（<strong>引用本质是指针</strong>）</p>
<p>创建引用的行为叫做<strong>借用</strong>（borrowing）——就像借别人的书，看完要还，而且你不是主人。（<strong>借用本质是动作</strong>）</p>
<p>使用引用的语法很简单，加一个 <code>&amp;</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s1%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20let%20len%20%3D%20calculate_length(%26s1)%3B%20%2F%2F%20%E4%BC%A0%E5%BC%95%E7%94%A8%EF%BC%8Cs1%20%E6%89%80%E6%9C%89%E6%9D%83%E4%B8%8D%E5%8F%98%0A%20%20%20%20println!(%22'%7B%7D'%20%E7%9A%84%E9%95%BF%E5%BA%A6%E6%98%AF%20%7B%7D%22%2C%20s1%2C%20len)%3B%20%2F%2F%20s1%20%E4%BB%8D%E7%84%B6%E6%9C%89%E6%95%88%EF%BC%81%0A%7D%0A%0Afn%20calculate_length(s%3A%20%26String)%20-%3E%20usize%20%7B%20%2F%2F%20%E5%8F%82%E6%95%B0%E6%98%AF%E5%BC%95%E7%94%A8%0A%20%20%20%20s.len()%0A%7D%20%2F%2F%20s%20%E7%A6%BB%E5%BC%80%E4%BD%9C%E7%94%A8%E5%9F%9F%EF%BC%8C%E4%BD%86%E5%AE%83%E5%8F%AA%E6%98%AF%E5%BC%95%E7%94%A8%EF%BC%8C%E4%B8%8D%E6%8B%A5%E6%9C%89%E6%95%B0%E6%8D%AE%EF%BC%8C%E4%BB%80%E4%B9%88%E9%83%BD%E4%B8%8D%E5%8F%91%E7%94%9F" data-mode="run"><pre><code class="language-rust">fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&amp;s1); // 传引用，s1 所有权不变
    println!("'{}' 的长度是 {}", s1, len); // s1 仍然有效！
}

fn calculate_length(s: &amp;String) -&gt; usize { // 参数是引用
    s.len()
} // s 离开作用域，但它只是引用，不拥有数据，什么都不发生</code></pre></div>
<p><code>&amp;s1</code> 创建了一个指向 <code>s1</code> 的引用。当引用离开作用域时，被引用的数据<strong>不会被释放</strong>，因为引用不拥有这些数据——所有权还在 <code>s1</code> 手里。</p>
<h1 id="引用的可变性">引用的可变性</h1>
<h2 id="不可变引用">不可变引用</h2>
<p>引用默认是<strong>不可变的</strong>——通过引用只能<strong>读取</strong>数据，不能<strong>修改</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20change(%26s)%3B%0A%7D%0A%0Afn%20change(s%3A%20%26String)%20%7B%0A%20%20%20%20s.push_str(%22%2C%20world%22)%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%E4%B8%8D%E8%83%BD%E4%BF%AE%E6%94%B9%E6%95%B0%E6%8D%AE%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let s = String::from("hello");
    change(&amp;s);
}

fn change(s: &amp;String) {
    s.push_str(", world"); // 错误：不可变引用不能修改数据
}</code></pre></div>
<p>这和变量的默认行为一致：<code>let</code> 绑定默认不可变，<code>&amp;T</code> 也默认不可变。</p>
<blockquote>
<p>原变量是否 <code>mut</code> 和引用是否 <code>&amp;mut</code> <strong>互不影响</strong>：即使原变量声明了 <code>let mut</code>，<code>&amp;s</code> 默认仍然是<strong>不可变引用</strong>（必须显式写 <code>&amp;mut s</code> 才能创建可变引用）</p>
</blockquote>
<h2 id="可变引用">可变引用</h2>
<p>如果需要通过引用<strong>修改</strong>数据，引用本身也需要是可变的。使用<strong>可变引用</strong> <code>&amp;mut T</code>。</p>
<p>创建和使用可变引用需要三处配合：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%20%2F%2F%201.%20%E5%8E%9F%E5%8F%98%E9%87%8F%E5%BF%85%E9%A1%BB%E5%A3%B0%E6%98%8E%E4%B8%BA%20mut%0A%0A%20%20%20%20change(%26mut%20s)%3B%20%2F%2F%202.%20%E4%BC%A0%E5%8F%82%E6%97%B6%E7%94%A8%20%26mut%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D%0A%0Afn%20change(s%3A%20%26mut%20String)%20%7B%20%2F%2F%203.%20%E5%8F%82%E6%95%B0%E7%B1%BB%E5%9E%8B%E6%98%AF%20%26mut%20String%0A%20%20%20%20s.push_str(%22%2C%20world%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("hello"); // 1. 原变量必须声明为 mut

    change(&amp;mut s); // 2. 传参时用 &amp;mut
    println!("{}", s);
}

fn change(s: &amp;mut String) { // 3. 参数类型是 &amp;mut String
    s.push_str(", world");
}</code></pre></div>
<p>三处缺一不可。比如原变量不是 <code>mut</code>，编译器会直接报错：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%20%2F%2F%20%E6%B2%A1%E6%9C%89%20mut%0A%20%20%20%20change(%26mut%20s)%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E4%B8%8D%E8%83%BD%E4%BB%8E%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%8F%98%E9%87%8F%E5%88%9B%E5%BB%BA%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%0A%7D%0A%0Afn%20change(s%3A%20%26mut%20String)%20%7B%0A%20%20%20%20s.push_str(%22%2C%20world%22)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let s = String::from("hello"); // 没有 mut
    change(&amp;mut s); // 错误：不能从不可变变量创建可变引用
}

fn change(s: &amp;mut String) {
    s.push_str(", world");
}</code></pre></div>
<blockquote>
<p><strong>重要</strong>：函数签名是一个<strong>契约</strong>。即使函数实现里没有实际修改数据，只要签名声明了 <code>&amp;mut T</code>，调用者就<strong>必须传入可变引用</strong>。编译器不会根据函数体的实际行为来”宽松”处理。这是为了让调用者只看签名就清楚地知道这个函数可能会修改数据。</p>
</blockquote>
<h1 id="借用的两条核心规则">借用的两条核心规则</h1>
<p>Rust 针对引用有两条核心规则限制。它们是 Rust 借用系统的基础：</p>
<blockquote>
<p><strong>规则一</strong>：在任意给定时间，<strong>要么</strong>只能有任意数量的不可变引用，<strong>要么</strong>只能有一个可变引用。两者<strong>不能同时存在</strong>。</p>
<p><strong>规则二</strong>：引用必须总是有效的，不能指向已释放的数据。</p>
</blockquote>
<h2 id="规则一详解排他性与多重共享">规则一详解：排他性与多重共享</h2>
<h3 id="情况一多个不可变引用可以共存">情况一：多个不可变引用可以共存</h3>
<p>不可变引用可以同时有很多个，因为只读操作之间互不干扰：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20let%20r1%20%3D%20%26s%3B%0A%20%20%20%20let%20r2%20%3D%20%26s%3B%0A%20%20%20%20let%20r3%20%3D%20%26s%3B%20%2F%2F%20%E5%AE%8C%E5%85%A8%E6%B2%A1%E9%97%AE%E9%A2%98%EF%BC%8C%E5%8F%AF%E4%BB%A5%E6%9C%89%E4%BB%BB%E6%84%8F%E5%A4%9A%E4%B8%AA%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%0A%0A%20%20%20%20println!(%22%7B%7D%2C%20%7B%7D%2C%20%7B%7D%22%2C%20r1%2C%20r2%2C%20r3)%3B%0A%20%20%20%20println!(%22%E5%8E%9F%E5%A7%8B%E5%80%BC%E4%BB%8D%E7%84%B6%E6%9C%89%E6%95%88%EF%BC%9A%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = String::from("hello");

    let r1 = &amp;s;
    let r2 = &amp;s;
    let r3 = &amp;s; // 完全没问题，可以有任意多个不可变引用

    println!("{}, {}, {}", r1, r2, r3);
    println!("原始值仍然有效：{}", s);
}</code></pre></div>
<blockquote>
<p>如果是多个不可变引用，那么原数据可以被正常访问。即使原数据是 <code>let mut</code> 声明的，在不可变引用活跃期间，也可以通过原变量读取（因为读取不会违反”只读”的约束），但不能修改。</p>
</blockquote>
<h3 id="情况二同一时间只能有一个可变引用">情况二：同一时间只能有一个可变引用</h3>
<p>可变引用有个重要限制：<strong>对同一数据，同一时间只能有一个活跃的可变引用</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20let%20r1%20%3D%20%26mut%20s%3B%0A%20%20%20%20let%20r2%20%3D%20%26mut%20s%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81s%20%E5%B7%B2%E7%BB%8F%E8%A2%AB%E5%8F%AF%E5%8F%98%E5%80%9F%E7%94%A8%E4%BA%86%0A%0A%20%20%20%20println!(%22%7B%7D%2C%20%7B%7D%22%2C%20r1%2C%20r2)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");

    let r1 = &amp;mut s;
    let r2 = &amp;mut s; // 错误！s 已经被可变借用了

    println!("{}, {}", r1, r2);
}</code></pre></div>
<p><strong>为什么有这个限制</strong>？想象两个人同时修改同一份文件——谁的改动会最终被保存？结果不可预测。这就是<strong>数据竞争</strong>（data race）——两个或更多指针同时访问同一数据，且至少有一个在写入，且没有同步机制。数据竞争导致未定义行为，极难调试。</p>
<p>Rust 直接在编译期<strong>禁止一切有数据竞争风险的代码</strong>。</p>
<h3 id="情况三不可变引用与可变引用不能共存">情况三：不可变引用与可变引用不能共存</h3>
<p>当已经有不可变引用时，不能创建可变引用：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20let%20r1%20%3D%20%26s%3B%20%20%20%20%20%20%20%20%2F%2F%20%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%0A%20%20%20%20let%20r2%20%3D%20%26s%3B%20%20%20%20%20%20%20%20%2F%2F%20%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%EF%BC%8C%E6%B2%A1%E9%97%AE%E9%A2%98%0A%20%20%20%20let%20r3%20%3D%20%26mut%20s%3B%20%20%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81r1%20%E5%92%8C%20r2%20%E8%BF%98%E6%B4%BB%E7%9D%80%0A%0A%20%20%20%20println!(%22%7B%7D%2C%20%7B%7D%2C%20%7B%7D%22%2C%20r1%2C%20r2%2C%20r3)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");

    let r1 = &amp;s;        // 不可变引用
    let r2 = &amp;s;        // 不可变引用，没问题
    let r3 = &amp;mut s;    // 错误！r1 和 r2 还活着

    println!("{}, {}, {}", r1, r2, r3);
}</code></pre></div>
<p>想象你正在读一份文件（不可变引用），同时另一个人正在修改它（可变引用）——你读到的内容就可能前后矛盾。</p>
<h3 id="错开引用的使用nll">错开引用的使用（NLL）</h3>
<p>关键是不能<strong>同时活跃</strong>。如果一个引用已经不再使用，就可以创建新的（包括可变的）引用。</p>
<p>Rust 编译器能智能判断引用<strong>最后一次使用</strong>的位置。引用的有效范围只到最后一次使用处为止，而不是到块的右花括号。这叫做<strong>非词法作用域生命周期</strong>（Non-Lexical Lifetimes，NLL）。</p>
<p>正因如此，下面的代码是合法的：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20let%20r1%20%3D%20%26s%3B%0A%20%20%20%20let%20r2%20%3D%20%26s%3B%0A%20%20%20%20println!(%22%7B%7D%20%E5%92%8C%20%7B%7D%22%2C%20r1%2C%20r2)%3B%0A%20%20%20%20%2F%2F%20r1%E3%80%81r2%20%E5%9C%A8%E8%BF%99%E9%87%8C%E6%98%AF%E6%9C%80%E5%90%8E%E4%B8%80%E6%AC%A1%E4%BD%BF%E7%94%A8%EF%BC%8C%E5%80%9F%E7%94%A8%E5%88%B0%E6%AD%A4%E7%BB%93%E6%9D%9F%0A%0A%20%20%20%20let%20r3%20%3D%20%26mut%20s%3B%20%2F%2F%20%E5%90%88%E6%B3%95%EF%BC%81r1%20%E5%92%8C%20r2%20%E7%9A%84%E5%80%9F%E7%94%A8%E5%B7%B2%E7%BB%8F%E7%BB%93%E6%9D%9F%0A%20%20%20%20r3.push_str(%22%2C%20world%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20r3)%3B%0A%20%20%20%20%2F%2F%20r3%20%E7%9A%84%E5%80%9F%E7%94%A8%E5%88%B0%E8%BF%99%E9%87%8C%E7%BB%93%E6%9D%9F%0A%0A%20%20%20%20%2F%2F%20r3%20%E4%BD%BF%E7%94%A8%E5%AE%8C%E5%90%8E%EF%BC%8C%E8%BF%98%E8%83%BD%E5%86%8D%E5%88%9B%E5%BB%BA%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%0A%20%20%20%20let%20r4%20%3D%20%26s%3B%0A%20%20%20%20let%20r5%20%3D%20%26s%3B%0A%20%20%20%20println!(%22%E6%9C%80%E5%90%8E%E8%AF%BB%E5%8F%96%EF%BC%9A%7B%7D%2C%20%7B%7D%22%2C%20r4%2C%20r5)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");

    let r1 = &amp;s;
    let r2 = &amp;s;
    println!("{} 和 {}", r1, r2);
    // r1、r2 在这里是最后一次使用，借用到此结束

    let r3 = &amp;mut s; // 合法！r1 和 r2 的借用已经结束
    r3.push_str(", world");
    println!("{}", r3);
    // r3 的借用到这里结束

    // r3 使用完后，还能再创建不可变引用
    let r4 = &amp;s;
    let r5 = &amp;s;
    println!("最后读取：{}, {}", r4, r5);
}</code></pre></div>
<p>r1 和 r2 在 <code>println!</code> 之后就不再使用了，所以它们的借用在那时就结束了。虽然块的右花括号还在下面，但 r3 可以创建可变引用，因为 r1、r2 已经不活跃了。</p>
<p>同样，多个可变引用也可以错开使用：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20r1%20%3D%20%26mut%20s%3B%0A%20%20%20%20%20%20%20%20r1.push_str(%22%20world%22)%3B%0A%20%20%20%20%20%20%20%20println!(%22%E5%86%85%E9%83%A8%E4%BD%9C%E7%94%A8%E5%9F%9F%EF%BC%9A%7B%7D%22%2C%20r1)%3B%0A%20%20%20%20%7D%20%2F%2F%20r1%20%E5%9C%A8%E8%BF%99%E9%87%8C%E7%BB%93%E6%9D%9F%EF%BC%8C%E5%80%9F%E7%94%A8%E8%A2%AB%E9%87%8A%E6%94%BE%0A%0A%20%20%20%20let%20r2%20%3D%20%26mut%20s%3B%20%2F%2F%20%E7%8E%B0%E5%9C%A8%E5%8F%AF%E4%BB%A5%E5%88%9B%E5%BB%BA%E6%96%B0%E7%9A%84%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%0A%20%20%20%20r2.push_str(%22!%22)%3B%0A%20%20%20%20println!(%22%E6%9C%80%E7%BB%88%EF%BC%9A%7B%7D%22%2C%20r2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");

    {
        let r1 = &amp;mut s;
        r1.push_str(" world");
        println!("内部作用域：{}", r1);
    } // r1 在这里结束，借用被释放

    let r2 = &amp;mut s; // 现在可以创建新的可变引用
    r2.push_str("!");
    println!("最终：{}", r2);
}</code></pre></div>
<h2 id="规则二详解有效性">规则二详解：有效性</h2>
<p>在有指针的语言中，很容易写出<strong>悬垂指针</strong>——指针指向的内存已被释放，但指针还在。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20r%20%3D%20dangle()%3B%0A%7D%0A%0Afn%20dangle()%20-%3E%20%26String%20%7B%20%2F%2F%20%E8%AF%95%E5%9B%BE%E8%BF%94%E5%9B%9E%E5%AD%97%E7%AC%A6%E4%B8%B2%E7%9A%84%E5%BC%95%E7%94%A8%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20%26s%20%2F%2F%20%E8%BF%94%E5%9B%9E%20s%20%E7%9A%84%E5%BC%95%E7%94%A8%0A%7D%20%2F%2F%20s%20%E5%9C%A8%E8%BF%99%E9%87%8C%E7%A6%BB%E5%BC%80%E4%BD%9C%E7%94%A8%E5%9F%9F%E8%A2%AB%E9%87%8A%E6%94%BE%EF%BC%8C%E4%BD%86%E5%BC%95%E7%94%A8%E6%8C%87%E5%90%91%E7%9A%84%E5%86%85%E5%AD%98%E5%B7%B2%E4%B8%8D%E5%AD%98%E5%9C%A8%EF%BC%81" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let r = dangle();
}

fn dangle() -&gt; &amp;String { // 试图返回字符串的引用
    let s = String::from("hello");
    &amp;s // 返回 s 的引用
} // s 在这里离开作用域被释放，但引用指向的内存已不存在！</code></pre></div>
<p>编译器报错，提示返回值借用了一个在函数结束时就会被释放的值。</p>
<p><strong>解决方案</strong>很简单：直接返回 <code>String</code> 本身，把所有权转移出去：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20no_dangle()%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D%0A%0Afn%20no_dangle()%20-%3E%20String%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20s%20%2F%2F%20%E8%BF%94%E5%9B%9E%20s%EF%BC%8C%E6%89%80%E6%9C%89%E6%9D%83%E8%BD%AC%E7%A7%BB%E7%BB%99%E8%B0%83%E7%94%A8%E8%80%85%EF%BC%8Cs%20%E6%9C%AC%E8%BA%AB%E4%B8%8D%E4%BC%9A%E8%A2%AB%E9%87%8A%E6%94%BE%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = no_dangle();
    println!("{}", s);
}

fn no_dangle() -&gt; String {
    let s = String::from("hello");
    s // 返回 s，所有权转移给调用者，s 本身不会被释放
}</code></pre></div>
<h1 id="小结与回顾">小结与回顾</h1>
<p>我们已经学习了所有权、借用与可变性等核心概念。让我们通过类比和完整的例子来理解它们的区别和互动。</p>
<h2 id="类比你对一本书的权利">类比：你对一本书的权利</h2>
<p>假设有一本书，我们可以用”书的权利”来比喻 Rust 中的核心概念：</p>
<table><thead><tr><th>权利类型</th><th>类比</th><th>Rust 术语</th><th>代码</th><th>能做什么</th></tr></thead><tbody><tr><td><strong>完全所有权</strong></td><td>你买了这本书，可以做任何事</td><td>变量所有权 <code>let mut s</code></td><td>所有者</td><td>读、改、转移、销毁</td></tr><tr><td><strong>所有权转移</strong></td><td>你把这本书给了朋友，现在是他的了</td><td>赋值/函数参数 <code>let s2 = s1</code></td><td>新所有者</td><td>只有新所有者能读改，原主人无权访问</td></tr><tr><td><strong>临时阅读权</strong></td><td>朋友借你的书去看（不能改）</td><td>不可变引用 <code>&amp;s</code></td><td>借用者</td><td>只能读</td></tr><tr><td><strong>临时编辑权</strong></td><td>朋友借你的书做笔记（可以改）</td><td>可变引用 <code>&amp;mut s</code></td><td>借用者</td><td>可以读和改</td></tr></tbody></table>
<p><strong>核心区别</strong>：</p>
<ul>
<li><strong>所有权</strong>：谁负责这个东西，到底是谁的（永久）</li>
<li><strong>所有权转移</strong>：从一个所有者转到另一个所有者，原主人永久失权</li>
<li><strong>借用</strong>：这个东西暂时在谁手里用（临时）</li>
<li><strong>可变性</strong>：拿着这个东西时，能不能修改它</li>
</ul>
<h2 id="权利的变更流程">权利的变更流程</h2>
<h3 id="场景一所有权转移永久">场景一：所有权转移（永久）</h3>
<p>当你把所有权交给别人，原主人就彻底失权了：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20%2F%2F%20%E5%88%9D%E5%A7%8B%EF%BC%9A%E6%88%91%E6%8B%A5%E6%9C%89%E8%BF%99%E6%9C%AC%E4%B9%A6%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20let%20book%20%3D%20String%3A%3Afrom(%22Rust%20Programming%22)%3B%0A%20%20%20%20println!(%22%E3%80%90%E5%88%9D%E5%A7%8B%E3%80%91%E6%88%91%E6%8B%A5%E6%9C%89%EF%BC%9A%7B%7D%22%2C%20book)%3B%0A%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20%2F%2F%20%E8%BD%AC%E7%A7%BB%EF%BC%9A%E6%88%91%E6%8A%8A%E4%B9%A6%E7%BB%99%E4%BA%86%E6%9C%8B%E5%8F%8B%EF%BC%88%E6%B0%B8%E4%B9%85%E8%BD%AC%E7%A7%BB%E6%89%80%E6%9C%89%E6%9D%83%EF%BC%89%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20let%20friend_book%20%3D%20book%3B%20%20%2F%2F%20%E6%89%80%E6%9C%89%E6%9D%83%E8%BD%AC%E7%A7%BB%E7%BB%99%20friend_book%0A%20%20%20%20println!(%22%E3%80%90%E8%BD%AC%E7%A7%BB%E3%80%91%E6%9C%8B%E5%8F%8B%E7%8E%B0%E5%9C%A8%E6%8B%A5%E6%9C%89%EF%BC%9A%7B%7D%22%2C%20friend_book)%3B%0A%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20book)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%81%E6%88%91%E5%B7%B2%E7%BB%8F%E6%B2%A1%E6%9C%89%E8%BF%99%E6%9C%AC%E4%B9%A6%E4%BA%86%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // ════════════════════════════════════════
    // 初始：我拥有这本书
    // ════════════════════════════════════════
    let book = String::from("Rust Programming");
    println!("【初始】我拥有：{}", book);

    // ════════════════════════════════════════
    // 转移：我把书给了朋友（永久转移所有权）
    // ════════════════════════════════════════
    let friend_book = book;  // 所有权转移给 friend_book
    println!("【转移】朋友现在拥有：{}", friend_book);

    // println!("{}", book);  // ✗ 错误！我已经没有这本书了
}</code></pre></div>
<p><strong>关键点</strong>：所有权转移后，原变量彻底失效，永久无法使用。</p>
<h3 id="场景二借用临时">场景二：借用（临时）</h3>
<p>当你借给别人，保留所有权，朋友用完要还：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20%2F%2F%20%E7%AC%AC%E4%B8%80%E9%98%B6%E6%AE%B5%EF%BC%9A%E7%8B%AC%E5%8D%A0%E6%89%80%E6%9C%89%E6%9D%83%EF%BC%88%E6%88%91%E6%8B%A5%E6%9C%89%E4%B9%A6%EF%BC%89%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20let%20mut%20book%20%3D%20String%3A%3Afrom(%22Rust%20Programming%22)%3B%0A%20%20%20%20println!(%22%E3%80%90%E5%88%9D%E5%A7%8B%E3%80%91%E6%88%91%E6%8B%A5%E6%9C%89%EF%BC%9A%7B%7D%22%2C%20book)%3B%0A%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20%2F%2F%20%E7%AC%AC%E4%BA%8C%E9%98%B6%E6%AE%B5%EF%BC%9A%E5%80%9F%E5%87%BA%E9%98%85%E8%AF%BB%E6%9D%83%EF%BC%88%E6%9C%8B%E5%8F%8B%E5%80%9F%E5%8E%BB%E7%9C%8B%EF%BC%89%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20let%20friend1%20%3D%20%26book%3B%20%20%20%20%20%20%20%20%2F%2F%20%E6%9C%8B%E5%8F%8B1%E5%80%9F%E5%8E%BB%E7%9C%8B%0A%20%20%20%20let%20friend2%20%3D%20%26book%3B%20%20%20%20%20%20%20%20%2F%2F%20%E6%9C%8B%E5%8F%8B2%E4%B9%9F%E5%80%9F%E5%8E%BB%E7%9C%8B%0A%20%20%20%20println!(%22%E3%80%90%E5%80%9F%E5%87%BA%E3%80%91%E6%9C%8B%E5%8F%8B1%E7%9C%8B%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20friend1)%3B%0A%20%20%20%20println!(%22%E3%80%90%E5%80%9F%E5%87%BA%E3%80%91%E6%9C%8B%E5%8F%8B2%E7%9C%8B%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20friend2)%3B%0A%20%20%20%20%2F%2F%20%E8%BF%99%E9%87%8C%E6%9C%8B%E5%8F%8B1%E3%80%81%E6%9C%8B%E5%8F%8B2%E7%9A%84%E9%98%85%E8%AF%BB%E6%9D%83%E7%BB%93%E6%9D%9F%0A%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20%2F%2F%20%E7%AC%AC%E4%B8%89%E9%98%B6%E6%AE%B5%EF%BC%9A%E5%80%9F%E5%87%BA%E7%BC%96%E8%BE%91%E6%9D%83%EF%BC%88%E6%9C%8B%E5%8F%8B%E5%81%9A%E7%AC%94%E8%AE%B0%EF%BC%89%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20let%20editor%20%3D%20%26mut%20book%3B%20%20%20%20%20%2F%2F%20%E6%9C%8B%E5%8F%8B%E5%80%9F%E5%8E%BB%E5%81%9A%E7%AC%94%E8%AE%B0%EF%BC%88%E5%8F%AF%E4%BB%A5%E6%94%B9%EF%BC%89%0A%20%20%20%20editor.push_str(%22%20(with%20notes)%22)%3B%0A%20%20%20%20println!(%22%E3%80%90%E7%BC%96%E8%BE%91%E3%80%91%E6%9C%8B%E5%8F%8B%E5%81%9A%E4%BA%86%E7%AC%94%E8%AE%B0%EF%BC%9A%7B%7D%22%2C%20editor)%3B%0A%20%20%20%20%2F%2F%20%E8%BF%99%E9%87%8C%E7%BC%96%E8%BE%91%E6%9D%83%E7%BB%93%E6%9D%9F%0A%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20%2F%2F%20%E7%AC%AC%E5%9B%9B%E9%98%B6%E6%AE%B5%EF%BC%9A%E6%88%91%E6%81%A2%E5%A4%8D%E5%AE%8C%E5%85%A8%E6%89%80%E6%9C%89%E6%9D%83%0A%20%20%20%20%2F%2F%20%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%E2%95%90%0A%20%20%20%20println!(%22%E3%80%90%E6%9C%80%E5%90%8E%E3%80%91%E6%88%91%E5%8F%96%E5%9B%9E%E4%B9%A6%EF%BC%9A%7B%7D%22%2C%20book)%3B%0A%20%20%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E7%BB%A7%E7%BB%AD%E4%BF%AE%E6%94%B9%0A%20%20%20%20book.push_str(%22%20(my%20notes)%22)%3B%0A%20%20%20%20println!(%22%E3%80%90%E6%9C%80%E5%90%8E%E3%80%91%E6%88%91%E4%B9%9F%E5%81%9A%E4%BA%86%E7%AC%94%E8%AE%B0%EF%BC%9A%7B%7D%22%2C%20book)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // ════════════════════════════════════════
    // 第一阶段：独占所有权（我拥有书）
    // ════════════════════════════════════════
    let mut book = String::from("Rust Programming");
    println!("【初始】我拥有：{}", book);

    // ════════════════════════════════════════
    // 第二阶段：借出阅读权（朋友借去看）
    // ════════════════════════════════════════
    let friend1 = &amp;book;        // 朋友1借去看
    let friend2 = &amp;book;        // 朋友2也借去看
    println!("【借出】朋友1看到：{}", friend1);
    println!("【借出】朋友2看到：{}", friend2);
    // 这里朋友1、朋友2的阅读权结束

    // ════════════════════════════════════════
    // 第三阶段：借出编辑权（朋友做笔记）
    // ════════════════════════════════════════
    let editor = &amp;mut book;     // 朋友借去做笔记（可以改）
    editor.push_str(" (with notes)");
    println!("【编辑】朋友做了笔记：{}", editor);
    // 这里编辑权结束

    // ════════════════════════════════════════
    // 第四阶段：我恢复完全所有权
    // ════════════════════════════════════════
    println!("【最后】我取回书：{}", book);
    // 可以继续修改
    book.push_str(" (my notes)");
    println!("【最后】我也做了笔记：{}", book);
}</code></pre></div>
<p>这个例子展示了整个过程中权利的转变：</p>
<ol>
<li><strong>独占所有权</strong> → 可以读、改、删除</li>
<li><strong>借出多个阅读权</strong> → 只能读，不能改</li>
<li><strong>借出编辑权</strong> → 可以读和改，但原所有者暂时无权访问</li>
<li><strong>恢复独占所有权</strong> → 朋友还书后，又能读改删除</li>
</ol>
<h2 id="规则速查表">规则速查表</h2>
<p>快速理解所有权和借用的规则：</p>
<table><thead><tr><th>场景</th><th>允许吗</th><th>原因</th></tr></thead><tbody><tr><td>多个 <code>&amp;T</code> 同时活跃</td><td>✅</td><td>多个读者互不影响</td></tr><tr><td>多个 <code>&amp;mut T</code> 同时活跃</td><td>❌</td><td>无法确定谁的改动有效</td></tr><tr><td><code>&amp;T</code> 和 <code>&amp;mut T</code> 同时活跃</td><td>❌</td><td>读者看到修改中的数据</td></tr><tr><td>原变量读取，同时有 <code>&amp;T</code></td><td>✅</td><td>多个读者看到相同数据</td></tr><tr><td>原变量修改，同时有 <code>&amp;T</code></td><td>❌</td><td>读者看到修改后的不一致数据</td></tr><tr><td>原变量读取，同时有 <code>&amp;mut T</code></td><td>❌</td><td>编辑权与读权冲突</td></tr></tbody></table>
<h2 id="核心要点回顾">核心要点回顾</h2>
<p><strong>所有权三条规则</strong>（来自第一篇）：</p>
<ol>
<li>每个值都有唯一所有者</li>
<li>值转移时，原所有者失效</li>
<li>所有者离开作用域时，值被释放</li>
</ol>
<p><strong>借用两条规则</strong>（本篇）：</p>
<ol>
<li>排他性：多读 OR 单写，不能混合</li>
<li>有效性：引用不能指向已释放的数据</li>
</ol>
<p><strong>可变性的独立性</strong>：</p>
<ul>
<li>所有权和可变性两个独立维度</li>
<li><code>let mut s</code> 不代表 <code>&amp;s</code> 是可变的</li>
<li><code>let s</code> 不代表 <code>&amp;mut s</code> 可行（因为原变量不可变）</li>
</ul>
<p>理解这些概念，就掌握了 Rust 内存安全的核心秘诀。</p>
<h1 id="练习题">练习题</h1>
<h2 id="引用基础测验">引用基础测验</h2>
</div>
<pre><code class="language-rust">fn main() {
    let s = String::from("hello");
    let r = &amp;s;
    println!("{}", r);
    println!("{}", s);
}</code></pre>
</div>
<h2 id="可变引用与修改">可变引用与修改</h2>
<pre><code class="language-rust">fn main() {
    let s = String::from("hello");
    append_world(&amp;mut s);
    println!("{}", s);
}

fn append_world(s: &amp;mut String) {
    s.push_str(", world");
}</code></pre>
</div>
<h2 id="借用规则一排他性">借用规则一：排他性</h2>
<pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");
    let r1 = &amp;s;
    let r2 = &amp;s;
    let r3 = &amp;mut s;
    println!("{}, {}, {}", r1, r2, r3);
}</code></pre>
</div>
</div>
<h2 id="借用规则二有效性">借用规则二：有效性</h2>
<pre><code class="language-rust">fn dangle() -&gt; &amp;String {
    let s = String::from("hello");
    &amp;s
}</code></pre>
</div>
<h2 id="综合应用">综合应用</h2>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面的函数想通过引用给字符串追加感叹号。请修复函数签名和 <code>main</code> 中的调用，使其能编译并正确输出：</p>
<div class="code-editor" data-block-id="03-ownership/03-references-borrowing#4:7" data-expect-mode="literal" data-expect-pattern="hello!" data-starter-code="fn%20append_exclamation(s%3A%20%26String)%20%7B%0A%20%20%20%20s.push_str(%22!%22)%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20append_exclamation(%26s)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D"><pre><code class="language-rust">fn append_exclamation(s: &amp;String) {
    s.push_str("!");
}

fn main() {
    let s = String::from("hello");
    append_exclamation(&amp;s);
    println!("{}", s);
}</code></pre></div>
<p><strong>提示</strong>：想想为什么无法通过不可变引用修改数据？</p>
<hr/>
<p>下面的函数试图返回一个局部变量的引用。请修改 <code>create_greeting</code> 的返回类型和返回值，使其能正确返回数据：</p>
<div class="code-editor" data-block-id="03-ownership/03-references-borrowing#4:8" data-expect-mode="literal" data-expect-pattern="hello%2C%20world" data-starter-code="fn%20create_greeting()%20-%3E%20%26String%20%7B%0A%20%20%20%20let%20greeting%20%3D%20String%3A%3Afrom(%22hello%2C%20world%22)%3B%0A%20%20%20%20%26greeting%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20create_greeting()%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D"><pre><code class="language-rust">fn create_greeting() -&gt; &amp;String {
    let greeting = String::from("hello, world");
    &amp;greeting
}

fn main() {
    let s = create_greeting();
    println!("{}", s);
}</code></pre></div>
<p><strong>提示</strong>：思考函数返回时会发生什么。如果返回引用，被引用的数据在函数结束时会被释放。如何才能让数据活下来？</p> 