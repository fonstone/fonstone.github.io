---
title: "String 与 &str——Rust 的两种字符串"
description: "标准库类型 - String 与 &str——Rust 的两种字符串"
date: "2026-07-12"
order: 5002
tags: ["字符串", "String", "&str", "字符串切片", "所有权", "UTF-8", "字符编码"]
est_time: "35 分钟"
---

 <h1 id="字符串基础">字符串基础</h1>
<h2 id="为什么-rust-有两种字符串类型">为什么 Rust 有两种字符串类型</h2>
<p>这是初学者最常困惑的地方。<strong>Rust 不是有一种字符串类型，而是有两种：<code>String</code> 和 <code>&amp;str</code></strong>。</p>
<p>想象一下快递：</p>
<ul>
<li><strong><code>String</code></strong> 像是你<strong>拥有的包裹</strong>——你可以打开它、修改里面的东西、把它转送给别人</li>
<li><strong><code>&amp;str</code></strong> 像是你在某个时刻<strong>看到的包裹标签内容</strong>——你只能读，不能修改，但标签本身可能属于别人</li>
</ul>
<p>这种设计的核心理由是 <strong>所有权</strong>。Rust 使用所有权系统来管理内存安全。<code>String</code> 拥有堆上的数据，而 <code>&amp;str</code> 只是借用（引用）了某个地方的字符串数据。</p>
<h2 id="string-和-str-的基本区别">String 和 &amp;str 的基本区别</h2>
<table><thead><tr><th>特性</th><th><code>String</code></th><th><code>&amp;str</code></th></tr></thead><tbody><tr><td>存储位置</td><td>堆（heap）</td><td>栈（stack）或数据段</td></tr><tr><td>大小</td><td>动态，运行时确定</td><td>固定，编译时确定</td></tr><tr><td>可修改性</td><td>可以修改（如果是 <code>mut</code>）</td><td>不可修改</td></tr><tr><td>所有权</td><td>拥有完整数据所有权</td><td>仅是借用</td></tr><tr><td>类型</td><td><code>String</code></td><td><code>&amp;str</code>（引用类型）</td></tr></tbody></table>
<p>让我们看一个简单对比：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20String%EF%BC%9A%E6%88%91%E4%BB%AC%E6%8B%A5%E6%9C%89%E7%9A%84%E5%AD%97%E7%AC%A6%E4%B8%B2%0A%20%20%20%20let%20mut%20s1%20%3D%20String%3A%3Afrom(%22Hello%22)%3B%0A%20%20%20%20s1.push_str(%22%2C%20World!%22)%3B%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E4%BF%AE%E6%94%B9%0A%20%20%20%20println!(%22String%3A%20%7B%7D%22%2C%20s1)%3B%0A%0A%20%20%20%20%2F%2F%20%26str%EF%BC%9A%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%88%87%E7%89%87%EF%BC%8C%E5%80%9F%E7%94%A8%E7%9A%84%E6%95%B0%E6%8D%AE%0A%20%20%20%20let%20s2%3A%20%26str%20%3D%20%22Hello%22%3B%0A%20%20%20%20%2F%2F%20s2.push_str(%22%2C%20World!%22)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%81%26str%20%E4%B8%8D%E5%8F%AF%E4%BF%AE%E6%94%B9%0A%20%20%20%20println!(%22%26str%3A%20%7B%7D%22%2C%20s2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // String：我们拥有的字符串
    let mut s1 = String::from("Hello");
    s1.push_str(", World!");  // 可以修改
    println!("String: {}", s1);

    // &amp;str：字符串切片，借用的数据
    let s2: &amp;str = "Hello";
    // s2.push_str(", World!");  // ✗ 错误！&amp;str 不可修改
    println!("&amp;str: {}", s2);
}</code></pre></div>
<p>这两种类型都是<strong>有效的</strong>，选择哪一种取决于你的<strong>使用场景</strong>。</p>
<h2 id="字符串字面量就是-str">字符串字面量就是 &amp;str</h2>
<p>你一直在用的字符串字面量（双引号里的文本）其实就是 <code>&amp;str</code> 类型：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E8%BF%99%E4%B8%AA%E5%AD%97%E9%9D%A2%E9%87%8F%E7%9A%84%E7%B1%BB%E5%9E%8B%E6%98%AF%20%26str%EF%BC%8C%E4%B8%8D%E6%98%AF%20String%EF%BC%81%0A%20%20%20%20let%20s%3A%20%26str%20%3D%20%22%E8%BF%99%E6%98%AF%E4%B8%80%E4%B8%AA%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%AD%97%E9%9D%A2%E9%87%8F%22%3B%0A%20%20%20%20println!(%22%E5%AD%97%E9%9D%A2%E9%87%8F%E7%B1%BB%E5%9E%8B%EF%BC%9A%26str%22)%3B%0A%20%20%20%20println!(%22%E5%86%85%E5%AE%B9%EF%BC%9A%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 这个字面量的类型是 &amp;str，不是 String！
    let s: &amp;str = "这是一个字符串字面量";
    println!("字面量类型：&amp;str");
    println!("内容：{}", s);
}</code></pre></div>
<p>为什么字面量是 <code>&amp;str</code> 而不是 <code>String</code>？因为字面量在<strong>编译时就已确定</strong>，被硬编码到二进制文件中，所以没必要在运行时分配堆内存。<code>&amp;str</code> 的大小在编译时就知道，效率最高。</p>
<h1 id="创建与初始化">创建与初始化</h1>
<h2 id="创建空-string">创建空 String</h2>
<p>最基础的方式是 <code>String::new()</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Anew()%3B%0A%20%20%20%20println!(%22%E7%A9%BA%E5%AD%97%E7%AC%A6%E4%B8%B2%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20s.len())%3B%0A%20%20%20%20println!(%22%E7%A9%BA%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%AE%B9%E9%87%8F%EF%BC%9A%7B%7D%22%2C%20s.capacity())%3B%0A%0A%20%20%20%20%2F%2F%20%E7%8E%B0%E5%9C%A8%E5%8F%AF%E4%BB%A5%E5%90%91%E9%87%8C%E9%9D%A2%E6%B7%BB%E5%8A%A0%E6%95%B0%E6%8D%AE%0A%20%20%20%20s.push_str(%22Hello%22)%3B%0A%20%20%20%20println!(%22%E6%B7%BB%E5%8A%A0%E5%90%8E%EF%BC%9A%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::new();
    println!("空字符串长度：{}", s.len());
    println!("空字符串容量：{}", s.capacity());

    // 现在可以向里面添加数据
    s.push_str("Hello");
    println!("添加后：{}", s);
}</code></pre></div>
<h2 id="从字面量创建-string">从字面量创建 String</h2>
<p>方式 1：<code>String::from()</code></p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s1%20%3D%20String%3A%3Afrom(%22Hello%2C%20World!%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s1)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s1 = String::from("Hello, World!");
    println!("{}", s1);
}</code></pre></div>
<p>方式 2：<code>.to_string()</code> 方法（任何实现了 <code>ToString</code> trait 的类型都有这个方法）</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s2%20%3D%20%22Hello%2C%20World!%22.to_string()%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s2 = "Hello, World!".to_string();
    println!("{}", s2);
}</code></pre></div>
<p>两种写法的结果完全相同：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s1%20%3D%20String%3A%3Afrom(%22Hello%22)%3B%0A%20%20%20%20let%20s2%20%3D%20%22Hello%22.to_string()%3B%0A%0A%20%20%20%20println!(%22s1%3A%20%7B%7D%22%2C%20s1)%3B%0A%20%20%20%20println!(%22s2%3A%20%7B%7D%22%2C%20s2)%3B%0A%20%20%20%20println!(%22s1%20%3D%3D%20s2%3A%20%7B%7D%22%2C%20s1%20%3D%3D%20s2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s1 = String::from("Hello");
    let s2 = "Hello".to_string();

    println!("s1: {}", s1);
    println!("s2: {}", s2);
    println!("s1 == s2: {}", s1 == s2);
}</code></pre></div>
<blockquote>
<p><strong>选择建议</strong>：两种方式都可以，但 <code>String::from()</code> 更明确地表示”从这个数据创建一个 String”，而 <code>.to_string()</code> 更灵活（可用于其他类型的转换）。</p>
</blockquote>
<h2 id="预分配容量">预分配容量</h2>
<p>如果你知道字符串最终会有大概多少字符，可以用 <code>with_capacity()</code> 预分配空间，减少内存重分配次数：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E9%A2%84%E5%88%86%E9%85%8D%2010%20%E5%AD%97%E8%8A%82%E5%AE%B9%E9%87%8F%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Awith_capacity(10)%3B%0A%20%20%20%20println!(%22%E5%88%9D%E5%A7%8B%E5%AE%B9%E9%87%8F%EF%BC%9A%7B%7D%22%2C%20s.capacity())%3B%0A%0A%20%20%20%20%2F%2F%20%E6%B7%BB%E5%8A%A0%E6%95%B0%E6%8D%AE%0A%20%20%20%20s.push_str(%22Hello%22)%3B%0A%20%20%20%20println!(%22%E6%B7%BB%E5%8A%A0%E5%90%8E%E5%AE%B9%E9%87%8F%EF%BC%9A%7B%7D%22%2C%20s.capacity())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 预分配 10 字节容量
    let mut s = String::with_capacity(10);
    println!("初始容量：{}", s.capacity());

    // 添加数据
    s.push_str("Hello");
    println!("添加后容量：{}", s.capacity());
}</code></pre></div>
<h1 id="修改字符串">修改字符串</h1>
<p><code>String</code> 的一大优势是<strong>可修改</strong>。这里列出最常用的修改操作。</p>
<h2 id="单个字符push">单个字符：<code>push()</code></h2>
<p>向字符串末尾添加一个 char：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20s.push('!')%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%B9%9F%E5%8F%AF%E4%BB%A5%E6%98%AF%E4%B8%AD%E6%96%87%E5%AD%97%E7%AC%A6%0A%20%20%20%20s.push('%E2%9C%A8')%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");
    s.push('!');
    println!("{}", s);

    // 也可以是中文字符
    s.push('✨');
    println!("{}", s);
}</code></pre></div>
<h2 id="字符串片段push_str">字符串片段：<code>push_str()</code></h2>
<p>向末尾追加一个字符串切片（<code>&amp;str</code>）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22Hello%22)%3B%0A%20%20%20%20s.push_str(%22%2C%20%22)%3B%0A%20%20%20%20s.push_str(%22World!%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("Hello");
    s.push_str(", ");
    s.push_str("World!");
    println!("{}", s);
}</code></pre></div>
<blockquote>
<p>注意：<code>push_str()</code> 接受 <code>&amp;str</code>，不获得所有权，所以原字符串仍可用。</p>
</blockquote>
<h2 id="移除末尾字符pop">移除末尾字符：<code>pop()</code></h2>
<p>移除并返回最后一个字符（如果有的话）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20match%20s.pop()%20%7B%0A%20%20%20%20%20%20%20%20Some(ch)%20%3D%3E%20println!(%22%E7%A7%BB%E9%99%A4%E7%9A%84%E5%AD%97%E7%AC%A6%EF%BC%9A%7B%7D%22%2C%20ch)%2C%0A%20%20%20%20%20%20%20%20None%20%3D%3E%20println!(%22%E5%AD%97%E7%AC%A6%E4%B8%B2%E4%B8%BA%E7%A9%BA%22)%2C%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E7%A7%BB%E9%99%A4%E5%90%8E%EF%BC%9A%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");

    match s.pop() {
        Some(ch) =&gt; println!("移除的字符：{}", ch),
        None =&gt; println!("字符串为空"),
    }

    println!("移除后：{}", s);
}</code></pre></div>
<h2 id="删除指定位置remove">删除指定位置：<code>remove()</code></h2>
<p>删除并返回指定<strong>字节位置</strong>的字符。这个方法有些复杂，因为涉及 UTF-8 编码：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%88%A0%E9%99%A4%E4%BD%8D%E7%BD%AE%200%20%E7%9A%84%E5%AD%97%E7%AC%A6%EF%BC%88'h'%EF%BC%89%0A%20%20%20%20let%20removed%20%3D%20s.remove(0)%3B%0A%20%20%20%20println!(%22%E5%88%A0%E9%99%A4%E7%9A%84%E5%AD%97%E7%AC%A6%EF%BC%9A%7B%7D%22%2C%20removed)%3B%0A%20%20%20%20println!(%22%E4%BF%AE%E6%94%B9%E5%90%8E%EF%BC%9A%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");

    // 删除位置 0 的字符（'h'）
    let removed = s.remove(0);
    println!("删除的字符：{}", removed);
    println!("修改后：{}", s);
}</code></pre></div>
<blockquote>
<p><strong>警告</strong>：<code>remove()</code> 按<strong>字节位置</strong>工作，不是字符位置。对于多字节字符（如中文），必须传正确的字节位置，否则会 panic。详见后文”字符编码复杂性”。</p>
</blockquote>
<h2 id="清空字符串clear">清空字符串：<code>clear()</code></h2>
<p>删除所有内容：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22Hello%2C%20World!%22)%3B%0A%20%20%20%20println!(%22%E6%B8%85%E7%A9%BA%E5%89%8D%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20s.len())%3B%0A%0A%20%20%20%20s.clear()%3B%0A%20%20%20%20println!(%22%E6%B8%85%E7%A9%BA%E5%90%8E%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20s.len())%3B%0A%20%20%20%20println!(%22%E6%B8%85%E7%A9%BA%E5%90%8E%EF%BC%9A'%7B%7D'%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("Hello, World!");
    println!("清空前长度：{}", s.len());

    s.clear();
    println!("清空后长度：{}", s.len());
    println!("清空后：'{}'", s);
}</code></pre></div>
<h2 id="替换replace-和-replace_range">替换：<code>replace()</code> 和 <code>replace_range()</code></h2>
<p><code>replace()</code> 返回一个<strong>新的</strong> String（原字符串不变）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22hello%20world%22%3B%0A%20%20%20%20let%20s2%20%3D%20s.replace(%22world%22%2C%20%22Rust%22)%3B%0A%20%20%20%20println!(%22%E5%8E%9F%E5%AD%97%E7%AC%A6%E4%B8%B2%EF%BC%9A%7B%7D%22%2C%20s)%3B%0A%20%20%20%20println!(%22%E6%96%B0%E5%AD%97%E7%AC%A6%E4%B8%B2%EF%BC%9A%7B%7D%22%2C%20s2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "hello world";
    let s2 = s.replace("world", "Rust");
    println!("原字符串：{}", s);
    println!("新字符串：{}", s2);
}</code></pre></div>
<p>如果要修改原字符串的某个范围，用 <code>replace_range()</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%20world%22)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%B0%86%E4%BD%8D%E7%BD%AE%200..5%20%E7%9A%84%E5%AD%97%E7%AC%A6%E6%9B%BF%E6%8D%A2%E4%B8%BA%20%22Hi%22%0A%20%20%20%20s.replace_range(0..5%2C%20%22Hi%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("hello world");

    // 将位置 0..5 的字符替换为 "Hi"
    s.replace_range(0..5, "Hi");
    println!("{}", s);
}</code></pre></div>
<h2 id="截断truncate">截断：<code>truncate()</code></h2>
<p>保留前 n 个<strong>字节</strong>，删除剩余部分：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22Hello%2C%20World!%22)%3B%0A%0A%20%20%20%20s.truncate(5)%3B%20%20%2F%2F%20%E5%8F%AA%E4%BF%9D%E7%95%99%E5%89%8D%205%20%E4%B8%AA%E5%AD%97%E8%8A%82%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut s = String::from("Hello, World!");

    s.truncate(5);  // 只保留前 5 个字节
    println!("{}", s);
}</code></pre></div>
<blockquote>
<p>同样，<code>truncate()</code> 按字节位置工作，不能用在多字节字符的中间。</p>
</blockquote>
<h1 id="操作与查询">操作与查询</h1>
<h2 id="为什么不能用--直接索引字符串">为什么不能用 [] 直接索引字符串</h2>
<p>这是一个常见的困惑。你可以对数组和向量用 <code>v[0]</code> 获取元素，但<strong>不能对 String 这样做</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s%5B0%5D)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%81%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let s = String::from("hello");
    println!("{}", s[0]);  // ✗ 错误！
}</code></pre></div>
<p>为什么？<strong>UTF-8 编码的复杂性</strong>。中文字符、表情符号等多字节字符占多个字节，一个”字符”可能是 1、2、3 或 4 个字节。<code>s[0]</code> 只能返回一个字节，而不是一个”字符”。Rust 的设计是<strong>宁可不提供这个操作，也不要让你无意中出错</strong>。</p>
<h2 id="字符串切片使用范围">字符串切片：使用范围</h2>
<p>如果你知道<strong>字节范围</strong>，可以创建字符串切片（<code>&amp;str</code>）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20let%20slice1%3A%20%26str%20%3D%20%26s%5B0..2%5D%3B%20%20%20%2F%2F%20%E5%89%8D%202%20%E4%B8%AA%E5%AD%97%E8%8A%82%0A%20%20%20%20let%20slice2%3A%20%26str%20%3D%20%26s%5B1..4%5D%3B%20%20%20%2F%2F%20%E5%AD%97%E8%8A%82%201-4%0A%0A%20%20%20%20println!(%22slice1%3A%20%7B%7D%22%2C%20slice1)%3B%0A%20%20%20%20println!(%22slice2%3A%20%7B%7D%22%2C%20slice2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = String::from("hello");

    let slice1: &amp;str = &amp;s[0..2];   // 前 2 个字节
    let slice2: &amp;str = &amp;s[1..4];   // 字节 1-4

    println!("slice1: {}", slice1);
    println!("slice2: {}", slice2);
}</code></pre></div>
<p>但是<strong>必须确保切片边界在字符边界上</strong>，否则会 panic：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22Hello%20%F0%9F%A6%80%22%3B%20%20%2F%2F%20%E8%BF%99%E9%87%8C%E7%9A%84%20%F0%9F%A6%80%20%E6%98%AF%204%20%E4%B8%AA%E5%AD%97%E8%8A%82%0A%0A%20%20%20%20%2F%2F%20%E8%BF%99%E4%BC%9A%20panic%EF%BC%81%E5%9B%A0%E4%B8%BA%E5%9C%A8%E5%AD%97%E7%AC%A6%E4%B8%AD%E9%97%B4%E5%88%87%E5%89%B2%0A%20%20%20%20let%20slice%20%3D%20%26s%5B0..7%5D%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let s = "Hello 🦀";  // 这里的 🦀 是 4 个字节

    // 这会 panic！因为在字符中间切割
    let slice = &amp;s[0..7];
}</code></pre></div>
<h2 id="字节-vs-字符-vs-字形簇">字节 vs 字符 vs 字形簇</h2>
<p>这是 UTF-8 字符串最容易混淆的地方。让我们澄清三个概念：</p>
<p><strong>字节（Byte）</strong> — 最小单位，1 个字节 = 8 比特：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22hello%22%3B%0A%20%20%20%20println!(%22%E5%AD%97%E8%8A%82%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20s.len())%3B%20%20%2F%2F%205%0A%0A%20%20%20%20let%20s2%20%3D%20%22Hello%20%E4%B8%96%22%3B%0A%20%20%20%20println!(%22%E5%AD%97%E8%8A%82%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20s2.len())%3B%20%20%2F%2F%209%EF%BC%88%E4%B8%8D%E6%98%AF%207%EF%BC%81%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "hello";
    println!("字节数：{}", s.len());  // 5

    let s2 = "Hello 世";
    println!("字节数：{}", s2.len());  // 9（不是 7！）
}</code></pre></div>
<p><strong>字符（Char）</strong> — Unicode 字符，<code>char</code> 类型：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22Hello%20%E4%B8%96%E7%95%8C%22%3B%0A%20%20%20%20println!(%22%E5%AD%97%E7%AC%A6%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20s.chars().count())%3B%20%20%2F%2F%208%0A%20%20%20%20println!(%22%E5%AD%97%E8%8A%82%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20s.len())%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%2012%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "Hello 世界";
    println!("字符数：{}", s.chars().count());  // 8
    println!("字节数：{}", s.len());             // 12
}</code></pre></div>
<p><strong>字形簇（Grapheme Cluster）</strong> — 用户看到的”一个字符”，可能由多个 Unicode 字符组合而成（最常见的是变音符号）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E8%BF%99%E4%B8%AA%E7%9C%8B%E8%B5%B7%E6%9D%A5%E5%83%8F%E4%B8%80%E4%B8%AA%22e%22%EF%BC%8C%E4%BD%86%E7%94%B1%E4%B8%A4%E4%B8%AA%20Unicode%20%E5%AD%97%E7%AC%A6%E7%BB%84%E6%88%90%0A%20%20%20%20let%20e_with_acute%20%3D%20%22%C3%A9%22%3B%20%20%2F%2F%20U%2B00E9%EF%BC%88%E5%8D%95%E4%B8%AA%E5%AD%97%E7%AC%A6%EF%BC%89%0A%20%20%20%20let%20e_combining%20%3D%20%22e%5Cu%7B0301%7D%22%3B%20%20%2F%2F%20e%EF%BC%88U%2B0065%EF%BC%89%2B%20%E9%94%90%E9%87%8D%E9%9F%B3%EF%BC%88U%2B0301%EF%BC%89%0A%0A%20%20%20%20println!(%22%E5%AD%97%E8%8A%82%E6%95%B0%EF%BC%88%C3%A9%EF%BC%89%EF%BC%9A%7B%7D%22%2C%20e_with_acute.len())%3B%0A%20%20%20%20println!(%22%E5%AD%97%E7%AC%A6%E6%95%B0%EF%BC%88%C3%A9%EF%BC%89%EF%BC%9A%7B%7D%22%2C%20e_with_acute.chars().count())%3B%0A%0A%20%20%20%20println!(%22%E5%AD%97%E8%8A%82%E6%95%B0%EF%BC%88e%CC%8D%EF%BC%89%EF%BC%9A%7B%7D%22%2C%20e_combining.len())%3B%0A%20%20%20%20println!(%22%E5%AD%97%E7%AC%A6%E6%95%B0%EF%BC%88e%CC%8D%EF%BC%89%EF%BC%9A%7B%7D%22%2C%20e_combining.chars().count())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 这个看起来像一个"e"，但由两个 Unicode 字符组成
    let e_with_acute = "é";  // U+00E9（单个字符）
    let e_combining = "e\u{0301}";  // e（U+0065）+ 锐重音（U+0301）

    println!("字节数（é）：{}", e_with_acute.len());
    println!("字符数（é）：{}", e_with_acute.chars().count());

    println!("字节数（e̍）：{}", e_combining.len());
    println!("字符数（e̍）：{}", e_combining.chars().count());
}</code></pre></div>
<p><strong>结论</strong>：永远不要假设”一个字符 = 一个字节”。需要的时候：</p>
<ul>
<li>按字节处理用 <code>.len()</code> 和 <code>&amp;s[..]</code></li>
<li>按字符处理用 <code>.chars()</code></li>
<li>按字形簇处理需要第三方库</li>
</ul>
<h2 id="字符迭代">字符迭代</h2>
<p>遍历字符串中的每个 <strong>Unicode 字符</strong>（而不是字节）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22Hello%20%F0%9F%A6%80%22%3B%0A%0A%20%20%20%20for%20ch%20in%20s.chars()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%AD%97%E7%AC%A6%EF%BC%9A%7B%7D%22%2C%20ch)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "Hello 🦀";

    for ch in s.chars() {
        println!("字符：{}", ch);
    }
}</code></pre></div>
<p>迭代<strong>字节</strong>（如果你真的需要）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22hello%22%3B%0A%0A%20%20%20%20for%20byte%20in%20s.bytes()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%AD%97%E8%8A%82%EF%BC%9A%7B%7D%22%2C%20byte)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "hello";

    for byte in s.bytes() {
        println!("字节：{}", byte);
    }
}</code></pre></div>
<h2 id="常用字符串方法">常用字符串方法</h2>
<p><strong>查看是否包含子字符串</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22Hello%2C%20Rust!%22%3B%0A%0A%20%20%20%20println!(%22%E5%8C%85%E5%90%AB%20'Rust'%EF%BC%9F%7B%7D%22%2C%20s.contains(%22Rust%22))%3B%0A%20%20%20%20println!(%22%E5%8C%85%E5%90%AB%20'Python'%EF%BC%9F%7B%7D%22%2C%20s.contains(%22Python%22))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "Hello, Rust!";

    println!("包含 'Rust'？{}", s.contains("Rust"));
    println!("包含 'Python'？{}", s.contains("Python"));
}</code></pre></div>
<p><strong>查看开头或结尾</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22hello.txt%22%3B%0A%0A%20%20%20%20println!(%22%E4%BB%A5%20'hello'%20%E5%BC%80%E5%A4%B4%EF%BC%9F%7B%7D%22%2C%20s.starts_with(%22hello%22))%3B%0A%20%20%20%20println!(%22%E4%BB%A5%20'.txt'%20%E7%BB%93%E5%B0%BE%EF%BC%9F%7B%7D%22%2C%20s.ends_with(%22.txt%22))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "hello.txt";

    println!("以 'hello' 开头？{}", s.starts_with("hello"));
    println!("以 '.txt' 结尾？{}", s.ends_with(".txt"));
}</code></pre></div>
<p><strong>分割字符串</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22one%2Ctwo%2Cthree%22%3B%0A%0A%20%20%20%20for%20part%20in%20s.split('%2C')%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E9%83%A8%E5%88%86%EF%BC%9A%7B%7D%22%2C%20part)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "one,two,three";

    for part in s.split(',') {
        println!("部分：{}", part);
    }
}</code></pre></div>
<p><strong>移除首尾空白</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22%20%20Hello%2C%20Rust!%20%20%22%3B%0A%0A%20%20%20%20println!(%22%E5%8E%9F%E5%AD%97%E7%AC%A6%E4%B8%B2%EF%BC%9A'%7B%7D'%22%2C%20s)%3B%0A%20%20%20%20println!(%22trim()%EF%BC%9A'%7B%7D'%22%2C%20s.trim())%3B%0A%20%20%20%20println!(%22trim_start()%EF%BC%9A'%7B%7D'%22%2C%20s.trim_start())%3B%0A%20%20%20%20println!(%22trim_end()%EF%BC%9A'%7B%7D'%22%2C%20s.trim_end())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "  Hello, Rust!  ";

    println!("原字符串：'{}'", s);
    println!("trim()：'{}'", s.trim());
    println!("trim_start()：'{}'", s.trim_start());
    println!("trim_end()：'{}'", s.trim_end());
}</code></pre></div>
<p><strong>转换大小写</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22Hello%2C%20Rust!%22%3B%0A%0A%20%20%20%20println!(%22%E5%A4%A7%E5%86%99%EF%BC%9A%7B%7D%22%2C%20s.to_uppercase())%3B%0A%20%20%20%20println!(%22%E5%B0%8F%E5%86%99%EF%BC%9A%7B%7D%22%2C%20s.to_lowercase())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = "Hello, Rust!";

    println!("大写：{}", s.to_uppercase());
    println!("小写：{}", s.to_lowercase());
}</code></pre></div>
<h2 id="string-作为函数参数">String 作为函数参数</h2>
<p>这是初学者经常遇到的问题：<strong>应该传 <code>String</code> 还是 <code>&amp;str</code>？</strong></p>
<p>一般规则是：<strong>优先传 <code>&amp;str</code></strong>。原因是 <code>&amp;str</code> 更灵活——无论你有 <code>String</code> 还是字面量，都可以转换成 <code>&amp;str</code>：</p>
<div class="code-runner" data-full-code="fn%20print_string(s%3A%20%26str)%20%7B%0A%20%20%20%20println!(%22%E6%8E%A5%E6%94%B6%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20s)%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E4%BC%A0%E5%85%A5%E5%AD%97%E9%9D%A2%E9%87%8F%EF%BC%88%E5%B7%B2%E7%BB%8F%E6%98%AF%20%26str%EF%BC%89%0A%20%20%20%20print_string(%22Hello%22)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BC%A0%E5%85%A5%20String%EF%BC%88%E4%BC%9A%E8%87%AA%E5%8A%A8%E8%A7%A3%E5%BC%95%E7%94%A8%E8%BD%AC%E6%8D%A2%E6%88%90%20%26str%EF%BC%89%0A%20%20%20%20let%20owned%20%3D%20String%3A%3Afrom(%22World%22)%3B%0A%20%20%20%20print_string(%26owned)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn print_string(s: &amp;str) {
    println!("接收到：{}", s);
}

fn main() {
    // 传入字面量（已经是 &amp;str）
    print_string("Hello");

    // 传入 String（会自动解引用转换成 &amp;str）
    let owned = String::from("World");
    print_string(&amp;owned);
}</code></pre></div>
<p>如果你传 <code>String</code>，那就只能接收 <code>String</code>，不能接收字面量（需要显式转换）：</p>
<div class="code-runner" data-full-code="fn%20print_string_owned(s%3A%20String)%20%7B%0A%20%20%20%20println!(%22%E6%8E%A5%E6%94%B6%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20s)%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20owned%20%3D%20String%3A%3Afrom(%22Hello%22)%3B%0A%20%20%20%20print_string_owned(owned)%3B%0A%0A%20%20%20%20%2F%2F%20print_string_owned(%22World%22)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%81%E9%9C%80%E8%A6%81%E6%98%BE%E5%BC%8F%E8%BD%AC%E6%8D%A2%0A%20%20%20%20print_string_owned(%22World%22.to_string())%3B%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%EF%BC%8C%E4%BD%86%E5%BE%88%E5%95%B0%E5%97%A6%0A%7D" data-mode="run"><pre><code class="language-rust">fn print_string_owned(s: String) {
    println!("接收到：{}", s);
}

fn main() {
    let owned = String::from("Hello");
    print_string_owned(owned);

    // print_string_owned("World");  // ✗ 错误！需要显式转换
    print_string_owned("World".to_string());  // 可以，但很啰嗦
}</code></pre></div>
<blockquote>
<p><strong>最佳实践</strong>：除非函数需要<strong>修改</strong>字符串或需要<strong>获得所有权</strong>，否则总是接收 <code>&amp;str</code>。</p>
</blockquote>
<h2 id="字符串解析">字符串解析</h2>
<p>将字符串转换成其他类型，使用 <code>parse()</code> 方法：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s1%20%3D%20%2242%22%3B%0A%20%20%20%20let%20num%3A%20i32%20%3D%20s1.parse().expect(%22%E6%97%A0%E6%B3%95%E8%A7%A3%E6%9E%90%E4%B8%BA%E6%95%B4%E6%95%B0%22)%3B%0A%20%20%20%20println!(%22%E8%A7%A3%E6%9E%90%E5%90%8E%EF%BC%9A%7B%7D%22%2C%20num)%3B%0A%0A%20%20%20%20let%20s2%20%3D%20%223.14%22%3B%0A%20%20%20%20let%20float%3A%20f64%20%3D%20s2.parse().expect(%22%E6%97%A0%E6%B3%95%E8%A7%A3%E6%9E%90%E4%B8%BA%E6%B5%AE%E7%82%B9%E6%95%B0%22)%3B%0A%20%20%20%20println!(%22%E8%A7%A3%E6%9E%90%E5%90%8E%EF%BC%9A%7B%7D%22%2C%20float)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s1 = "42";
    let num: i32 = s1.parse().expect("无法解析为整数");
    println!("解析后：{}", num);

    let s2 = "3.14";
    let float: f64 = s2.parse().expect("无法解析为浮点数");
    println!("解析后：{}", float);
}</code></pre></div>
<h1 id="练习题">练习题</h1>
<h2 id="string-和-str-基础测验">String 和 &amp;str 基础测验</h2>
<pre><code class="language-rust">fn main() {
    let s1 = "Hello";
    let s2 = String::from("Hello");
}</code></pre>
</div>
</div>
<h2 id="字符串创建与修改">字符串创建与修改</h2>
<pre><code class="language-rust">let mut s = String::from("Hello");
s.push('!');
s.push_str(" World");</code></pre>
</div>
</div>
<h2 id="字符编码和索引">字符编码和索引</h2>
<pre><code class="language-rust">let s = "Hello 中文";
let byte_count = s.len();
let char_count = s.chars().count();</code></pre>
</div>
</div>
<h2 id="函数参数和常用操作">函数参数和常用操作</h2>
<pre><code class="language-rust">fn describe(s: &amp;str) {
    println!("字符串：{}", s);
}

fn main() {
    describe("Hello");
    describe(&amp;String::from("World"));
}</code></pre>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习-1字符串切片和迭代">练习 1：字符串切片和迭代</h3>
<p>完成下面程序，要求对字符串进行分析：</p>
<div class="code-editor" data-block-id="05-stdlib-types/02-strings#4:7" data-expect-mode="literal" data-expect-pattern="%E5%89%8D5%E4%B8%AA%E5%AD%97%E8%8A%82%3A%20Hello%0A%E5%AD%97%E7%AC%A6%E6%80%BB%E6%95%B0%3A%2012%0A%E4%BB%A5%20'Hello'%20%E5%BC%80%E5%A4%B4%3A%20true%0A%E4%BB%A5%20'!'%20%E7%BB%93%E5%B0%BE%3A%20true" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20text%20%3D%20%22Hello%2C%20Rust!%22%3B%0A%0A%20%20%20%20%2F%2F%20TODO%201%3A%20%E8%8E%B7%E5%8F%96%E5%89%8D%205%20%E4%B8%AA%E5%AD%97%E8%8A%82%E7%9A%84%E5%88%87%E7%89%87%0A%20%20%20%20let%20first_five%20%3D%0A%20%20%20%20println!(%22%E5%89%8D5%E4%B8%AA%E5%AD%97%E8%8A%82%3A%20%7B%7D%22%2C%20first_five)%3B%0A%0A%20%20%20%20%2F%2F%20TODO%202%3A%20%E9%81%8D%E5%8E%86%E5%B9%B6%E8%AE%A1%E7%AE%97%E6%89%80%E6%9C%89%E5%AD%97%E7%AC%A6%EF%BC%8C%E4%BD%BF%E7%94%A8%20for%20%E5%AE%9E%E7%8E%B0%0A%20%20%20%20let%20mut%20char_count%20%3D%200%3B%0A%20%20%20%20for%20%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%3A%20%E8%AE%A1%E6%95%B0%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22%E5%AD%97%E7%AC%A6%E6%80%BB%E6%95%B0%3A%20%7B%7D%22%2C%20char_count)%3B%0A%0A%20%20%20%20%2F%2F%20TODO%203%3A%20%E6%A3%80%E6%9F%A5%E5%AD%97%E7%AC%A6%E4%B8%B2%E6%98%AF%E5%90%A6%E4%BB%A5%20%22Hello%22%20%E5%BC%80%E5%A4%B4%0A%20%20%20%20if%20%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%BB%A5%20'Hello'%20%E5%BC%80%E5%A4%B4%3A%20true%22)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20TODO%204%3A%20%E6%A3%80%E6%9F%A5%E5%AD%97%E7%AC%A6%E4%B8%B2%E6%98%AF%E5%90%A6%E4%BB%A5%20%22!%22%20%E7%BB%93%E5%B0%BE%0A%20%20%20%20if%20%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%BB%A5%20'!'%20%E7%BB%93%E5%B0%BE%3A%20true%22)%3B%0A%20%20%20%20%7D%0A%7D"><pre><code class="language-rust">fn main() {
    let text = "Hello, Rust!";

    // TODO 1: 获取前 5 个字节的切片
    let first_five =
    println!("前5个字节: {}", first_five);

    // TODO 2: 遍历并计算所有字符，使用 for 实现
    let mut char_count = 0;
    for  {
        // TODO: 计数
    }
    println!("字符总数: {}", char_count);

    // TODO 3: 检查字符串是否以 "Hello" 开头
    if  {
        println!("以 'Hello' 开头: true");
    }

    // TODO 4: 检查字符串是否以 "!" 结尾
    if  {
        println!("以 '!' 结尾: true");
    }
}</code></pre></div>
<h3 id="练习-2文本处理函数">练习 2：文本处理函数</h3>
<p>编写一个函数 <code>process_text()</code>，接收一个 <code>&amp;str</code>，返回处理后的 <code>String</code>。要求：</p>
<ol>
<li>移除首尾空白</li>
<li>将所有内容转为小写</li>
<li>如果内容为空则返回 “(empty)”</li>
</ol>
<div class="code-editor" data-block-id="05-stdlib-types/02-strings#4:8" data-expect-mode="literal" data-expect-pattern="%E8%BE%93%E5%85%A5%3A%20'%20%20HELLO%20WORLD%20%20'%20-%3E%20%E8%BE%93%E5%87%BA%3A%20'hello%20world'%0A%E8%BE%93%E5%85%A5%3A%20'%20%20%20%20'%20-%3E%20%E8%BE%93%E5%87%BA%3A%20'(empty)'%0A%E8%BE%93%E5%85%A5%3A%20'RustLang'%20-%3E%20%E8%BE%93%E5%87%BA%3A%20'rustlang'" data-starter-code="fn%20process_text(text%3A%20%26str)%20-%3E%20String%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9E%E7%8E%B0%E5%87%BD%E6%95%B0%E4%BD%93%0A%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20test1%20%3D%20%22%20%20HELLO%20WORLD%20%20%22%3B%0A%20%20%20%20let%20result1%20%3D%20process_text(test1)%3B%0A%20%20%20%20println!(%22%E8%BE%93%E5%85%A5%3A%20'%7B%7D'%20-%3E%20%E8%BE%93%E5%87%BA%3A%20'%7B%7D'%22%2C%20test1%2C%20result1)%3B%0A%0A%20%20%20%20let%20test2%20%3D%20%22%20%20%20%20%22%3B%0A%20%20%20%20let%20result2%20%3D%20process_text(test2)%3B%0A%20%20%20%20println!(%22%E8%BE%93%E5%85%A5%3A%20'%7B%7D'%20-%3E%20%E8%BE%93%E5%87%BA%3A%20'%7B%7D'%22%2C%20test2%2C%20result2)%3B%0A%0A%20%20%20%20let%20test3%20%3D%20%22RustLang%22%3B%0A%20%20%20%20let%20result3%20%3D%20process_text(test3)%3B%0A%20%20%20%20println!(%22%E8%BE%93%E5%85%A5%3A%20'%7B%7D'%20-%3E%20%E8%BE%93%E5%87%BA%3A%20'%7B%7D'%22%2C%20test3%2C%20result3)%3B%0A%7D"><pre><code class="language-rust">fn process_text(text: &amp;str) -&gt; String {
    // TODO: 实现函数体

}

fn main() {
    let test1 = "  HELLO WORLD  ";
    let result1 = process_text(test1);
    println!("输入: '{}' -&gt; 输出: '{}'", test1, result1);

    let test2 = "    ";
    let result2 = process_text(test2);
    println!("输入: '{}' -&gt; 输出: '{}'", test2, result2);

    let test3 = "RustLang";
    let result3 = process_text(test3);
    println!("输入: '{}' -&gt; 输出: '{}'", test3, result3);
}</code></pre></div> 