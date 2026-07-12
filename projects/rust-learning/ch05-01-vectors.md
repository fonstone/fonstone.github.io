---
title: "Vec<T>——动态数组"
description: "标准库类型 - Vec<T>——动态数组"
date: "2026-07-12"
order: 5001
tags: ["向量", "Vec", "动态数组", "所有权", "借用", "迭代"]
est_time: "35 分钟"
---

 <h1 id="什么是向量vector">什么是向量（Vector）</h1>
<p><strong>向量</strong>（Vector）是 Rust 标准库中最常用的<strong>动态数组</strong>类型，记作 <code>Vec&lt;T&gt;</code>。</p>
<p>“动态”是什么意思呢？对比你前面学过的<strong>数组</strong>（<code>[T; n]</code>），数组的长度在编译时就确定了，是<strong>固定的</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%95%B0%E7%BB%84%EF%BC%9A%E9%95%BF%E5%BA%A6%E5%9B%BA%E5%AE%9A%E4%B8%BA%205%0A%20%20%20%20let%20arr%3A%20%5Bi32%3B%205%5D%20%3D%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20println!(%22%E6%95%B0%E7%BB%84%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20arr.len())%3B%0A%0A%20%20%20%20%2F%2F%20%E5%90%91%E9%87%8F%EF%BC%9A%E9%95%BF%E5%BA%A6%E5%8F%AF%E4%BB%A5%E5%8A%A8%E6%80%81%E5%A2%9E%E5%8A%A0%E6%88%96%E5%87%8F%E5%B0%91%0A%20%20%20%20let%20mut%20vec%3A%20Vec%3Ci32%3E%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20println!(%22%E5%90%91%E9%87%8F%E5%88%9D%E5%A7%8B%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20vec.len())%3B%0A%0A%20%20%20%20vec.push(6)%3B%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E6%B7%BB%E5%8A%A0%E6%96%B0%E5%85%83%E7%B4%A0%0A%20%20%20%20println!(%22%E5%90%91%E9%87%8F%E7%8E%B0%E5%9C%A8%E7%9A%84%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20vec.len())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 数组：长度固定为 5
    let arr: [i32; 5] = [1, 2, 3, 4, 5];
    println!("数组长度：{}", arr.len());

    // 向量：长度可以动态增加或减少
    let mut vec: Vec&lt;i32&gt; = vec![1, 2, 3, 4, 5];
    println!("向量初始长度：{}", vec.len());

    vec.push(6);  // 可以添加新元素
    println!("向量现在的长度：{}", vec.len());
}</code></pre></div>
<h2 id="为什么需要向量">为什么需要向量</h2>
<p>想象这个场景：你写一个程序来读取用户输入。用户不一定输入多少行，可能是 1 行，也可能是 100 行。如果用数组，你需要<strong>提前声明大小</strong>（<code>[String; 100]</code>），这样既浪费空间（如果只有 10 行输入），又不够灵活（如果有 101 行就溢出了）。</p>
<p>向量解决了这个问题：<strong>可以根据需要动态增长</strong>，无需提前知道确切大小。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20lines%20%3D%20Vec%3A%3Anew()%3B%0A%0A%20%20%20%20%2F%2F%20%E6%A8%A1%E6%8B%9F%E7%94%A8%E6%88%B7%E8%BE%93%E5%85%A5%E4%B8%89%E8%A1%8C%E6%95%B0%E6%8D%AE%0A%20%20%20%20lines.push(String%3A%3Afrom(%22%E7%AC%AC%E4%B8%80%E8%A1%8C%22))%3B%0A%20%20%20%20lines.push(String%3A%3Afrom(%22%E7%AC%AC%E4%BA%8C%E8%A1%8C%22))%3B%0A%20%20%20%20lines.push(String%3A%3Afrom(%22%E7%AC%AC%E4%B8%89%E8%A1%8C%22))%3B%0A%0A%20%20%20%20println!(%22%E6%94%B6%E5%88%B0%20%7B%7D%20%E8%A1%8C%E6%95%B0%E6%8D%AE%22%2C%20lines.len())%3B%0A%0A%20%20%20%20for%20line%20in%20%26lines%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%20%20%7B%7D%22%2C%20line)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut lines = Vec::new();

    // 模拟用户输入三行数据
    lines.push(String::from("第一行"));
    lines.push(String::from("第二行"));
    lines.push(String::from("第三行"));

    println!("收到 {} 行数据", lines.len());

    for line in &amp;lines {
        println!("  {}", line);
    }
}</code></pre></div>
<h1 id="使用向量">使用向量</h1>
<h2 id="创建和初始化向量">创建和初始化向量</h2>
<h3 id="使用-vecnew">使用 <code>Vec::new()</code></h3>
<p>最直接的方式是调用 <code>Vec::new()</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%3A%20Vec%3Ci32%3E%20%3D%20Vec%3A%3Anew()%3B%0A%0A%20%20%20%20v.push(1)%3B%0A%20%20%20%20v.push(2)%3B%0A%20%20%20%20v.push(3)%3B%0A%0A%20%20%20%20println!(%22%E5%90%91%E9%87%8F%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v: Vec&lt;i32&gt; = Vec::new();

    v.push(1);
    v.push(2);
    v.push(3);

    println!("向量：{:?}", v);
}</code></pre></div>
<p>注意这里需要<strong>显式标注类型</strong> <code>Vec&lt;i32&gt;</code>。为什么？因为向量是空的，编译器无法推断元素类型。</p>
<h3 id="使用-vec-宏">使用 <code>vec!</code> 宏</h3>
<p>更简洁的方式是使用 <code>vec!</code> 宏。它可以在创建时直接填充数据，而且<strong>编译器能自动推断类型</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%88%9B%E5%BB%BA%E5%B9%B6%E5%88%9D%E5%A7%8B%E5%8C%96%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%20%20%20%20println!(%22%E5%90%91%E9%87%8F%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%B9%9F%E5%8F%AF%E4%BB%A5%E7%94%A8%E9%87%8D%E5%A4%8D%E8%AF%AD%E6%B3%95%0A%20%20%20%20let%20v2%20%3D%20vec!%5B0%3B%205%5D%3B%20%20%2F%2F%20%E4%BA%94%E4%B8%AA%200%0A%20%20%20%20println!(%22%E9%87%8D%E5%A4%8D%E5%90%91%E9%87%8F%EF%BC%9A%7B%3A%3F%7D%22%2C%20v2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 创建并初始化
    let v = vec![1, 2, 3];
    println!("向量：{:?}", v);

    // 也可以用重复语法
    let v2 = vec![0; 5];  // 五个 0
    println!("重复向量：{:?}", v2);
}</code></pre></div>
<p>这两个写法是等价的：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E8%BF%99%E4%B8%A4%E7%A7%8D%E6%96%B9%E5%BC%8F%E7%BB%93%E6%9E%9C%E7%9B%B8%E5%90%8C%0A%20%20%20%20let%20v1%20%3D%20vec!%5B0%2C%200%2C%200%2C%200%2C%200%5D%3B%0A%20%20%20%20let%20v2%20%3D%20vec!%5B0%3B%205%5D%3B%0A%0A%20%20%20%20println!(%22v1%3A%20%7B%3A%3F%7D%22%2C%20v1)%3B%0A%20%20%20%20println!(%22v2%3A%20%7B%3A%3F%7D%22%2C%20v2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 这两种方式结果相同
    let v1 = vec![0, 0, 0, 0, 0];
    let v2 = vec![0; 5];

    println!("v1: {:?}", v1);
    println!("v2: {:?}", v2);
}</code></pre></div>
<blockquote>
<p><strong>小技巧</strong>：如果你需要创建一个特定容量的空向量（为了减少重新分配次数），可以用 <code>Vec::with_capacity(n)</code>。这个技巧对性能敏感的代码有帮助。</p>
</blockquote>
<h2 id="访问向量中的元素">访问向量中的元素</h2>
<h3 id="使用索引">使用索引</h3>
<p>向量支持基于索引的访问，就像数组一样：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B10%2C%2020%2C%2030%2C%2040%5D%3B%0A%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%9A%7B%7D%22%2C%20v%5B0%5D)%3B%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%89%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%9A%7B%7D%22%2C%20v%5B2%5D)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![10, 20, 30, 40];

    println!("第一个元素：{}", v[0]);
    println!("第三个元素：{}", v[2]);
}</code></pre></div>
<h3 id="越界会-panic恐慌">越界会 panic（恐慌）</h3>
<p>如果你访问的索引超出范围，程序会<strong>崩溃</strong>（panic）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B10%2C%2020%2C%2030%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E8%BF%99%E4%BC%9A%E5%AF%BC%E8%87%B4%20panic%EF%BC%81%0A%20%20%20%20println!(%22%7B%7D%22%2C%20v%5B5%5D)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![10, 20, 30];

    // 这会导致 panic！
    println!("{}", v[5]);
}</code></pre></div>
<p>这在交互式代码中会直接失败。Rust 的设计理念是：<strong>非法的操作应该当即失败</strong>，而不是允许未定义行为。</p>
<h3 id="使用-get-方法安全地访问">使用 <code>get()</code> 方法安全地访问</h3>
<p>如果你不确定索引是否有效，使用 <code>get()</code> 方法返回 <code>Option</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B10%2C%2020%2C%2030%5D%3B%0A%0A%20%20%20%20match%20v.get(0)%20%7B%0A%20%20%20%20%20%20%20%20Some(value)%20%3D%3E%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%9A%7B%7D%22%2C%20value)%2C%0A%20%20%20%20%20%20%20%20None%20%3D%3E%20println!(%22%E5%90%91%E9%87%8F%E4%B8%BA%E7%A9%BA%22)%2C%0A%20%20%20%20%7D%0A%0A%20%20%20%20match%20v.get(10)%20%7B%0A%20%20%20%20%20%20%20%20Some(value)%20%3D%3E%20println!(%22%E7%AC%AC%2011%20%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%9A%7B%7D%22%2C%20value)%2C%0A%20%20%20%20%20%20%20%20None%20%3D%3E%20println!(%22%E7%B4%A2%E5%BC%95%2010%20%E8%B6%85%E5%87%BA%E8%8C%83%E5%9B%B4%22)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![10, 20, 30];

    match v.get(0) {
        Some(value) =&gt; println!("第一个元素：{}", value),
        None =&gt; println!("向量为空"),
    }

    match v.get(10) {
        Some(value) =&gt; println!("第 11 个元素：{}", value),
        None =&gt; println!("索引 10 超出范围"),
    }
}</code></pre></div>
<p><code>get()</code> 返回 <code>Option&lt;&amp;T&gt;</code>，你可以安全地处理”找不到”的情况。</p>
<h3 id="关键区别-vs-get">关键区别：<code>[]</code> vs <code>get()</code></h3>
<ul>
<li><strong><code>v[i]</code></strong>：如果超出范围，<strong>panic</strong>。用于已确认索引合法的地方。</li>
<li><strong><code>v.get(i)</code></strong>：返回 <code>Option</code>。用于索引可能不合法的地方。</li>
</ul>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B10%2C%2020%2C%2030%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E5%9C%BA%E6%99%AF%201%EF%BC%9A%E4%BD%A0%E7%9F%A5%E9%81%93%E7%B4%A2%E5%BC%95%E8%82%AF%E5%AE%9A%E5%AD%98%E5%9C%A8%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%EF%BC%9A%7B%7D%22%2C%20v%5B0%5D)%3B%20%20%2F%2F%20%E2%9C%93%20%E7%9B%B4%E6%8E%A5%E7%94%A8%20%5B%5D%20%E6%B2%A1%E5%85%B3%E7%B3%BB%0A%0A%20%20%20%20%2F%2F%20%E5%9C%BA%E6%99%AF%202%EF%BC%9A%E7%B4%A2%E5%BC%95%E6%9D%A5%E8%87%AA%E5%A4%96%E9%83%A8%E8%BE%93%E5%85%A5%EF%BC%8C%E5%8F%AF%E8%83%BD%E6%97%A0%E6%95%88%0A%20%20%20%20let%20user_input%20%3D%20%225%22%3B%0A%20%20%20%20if%20let%20Ok(index)%20%3D%20user_input.parse%3A%3A%3Cusize%3E()%20%7B%0A%20%20%20%20%20%20%20%20match%20v.get(index)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Some(val)%20%3D%3E%20println!(%22%E6%89%BE%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20val)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20None%20%3D%3E%20println!(%22%E7%94%A8%E6%88%B7%E8%BE%93%E5%85%A5%E7%9A%84%E7%B4%A2%E5%BC%95%E8%B6%85%E5%87%BA%E8%8C%83%E5%9B%B4%22)%2C%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![10, 20, 30];

    // 场景 1：你知道索引肯定存在
    println!("第一个：{}", v[0]);  // ✓ 直接用 [] 没关系

    // 场景 2：索引来自外部输入，可能无效
    let user_input = "5";
    if let Ok(index) = user_input.parse::&lt;usize&gt;() {
        match v.get(index) {
            Some(val) =&gt; println!("找到：{}", val),
            None =&gt; println!("用户输入的索引超出范围"),
        }
    }
}</code></pre></div>
<h2 id="修改向量">修改向量</h2>
<h3 id="添加元素push">添加元素：<code>push()</code></h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20v.push(4)%3B%0A%20%20%20%20v.push(5)%3B%0A%0A%20%20%20%20println!(%22%E5%90%91%E9%87%8F%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![1, 2, 3];

    v.push(4);
    v.push(5);

    println!("向量：{:?}", v);
}</code></pre></div>
<h3 id="删除元素pop">删除元素：<code>pop()</code></h3>
<p><code>pop()</code> 移除并返回最后一个元素，返回 <code>Option</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20match%20v.pop()%20%7B%0A%20%20%20%20%20%20%20%20Some(value)%20%3D%3E%20println!(%22%E5%BC%B9%E5%87%BA%EF%BC%9A%7B%7D%22%2C%20value)%2C%0A%20%20%20%20%20%20%20%20None%20%3D%3E%20println!(%22%E5%90%91%E9%87%8F%E4%B8%BA%E7%A9%BA%22)%2C%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E5%89%A9%E4%BD%99%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![1, 2, 3];

    match v.pop() {
        Some(value) =&gt; println!("弹出：{}", value),
        None =&gt; println!("向量为空"),
    }

    println!("剩余：{:?}", v);
}</code></pre></div>
<h3 id="删除指定位置remove">删除指定位置：<code>remove()</code></h3>
<p><code>remove(index)</code> 删除指定索引的元素，并返回该元素。<strong>注意</strong>：这个操作时间复杂度是 O(n)，因为后面的所有元素都要向前移动：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B%22a%22%2C%20%22b%22%2C%20%22c%22%2C%20%22d%22%5D%3B%0A%0A%20%20%20%20let%20removed%20%3D%20v.remove(1)%3B%20%20%2F%2F%20%E5%88%A0%E9%99%A4%E7%B4%A2%E5%BC%95%201%20%E7%9A%84%E5%85%83%E7%B4%A0%0A%20%20%20%20println!(%22%E5%88%A0%E9%99%A4%E7%9A%84%E5%85%83%E7%B4%A0%EF%BC%9A%7B%7D%22%2C%20removed)%3B%0A%20%20%20%20println!(%22%E5%89%A9%E4%BD%99%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec!["a", "b", "c", "d"];

    let removed = v.remove(1);  // 删除索引 1 的元素
    println!("删除的元素：{}", removed);
    println!("剩余：{:?}", v);
}</code></pre></div>
<h3 id="修改元素">修改元素</h3>
<p>向量是可变的时候，可以直接修改元素：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20v%5B0%5D%20%3D%2010%3B%20%20%2F%2F%20%E7%9B%B4%E6%8E%A5%E4%BF%AE%E6%94%B9%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%0A%0A%20%20%20%20println!(%22%E4%BF%AE%E6%94%B9%E5%90%8E%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![1, 2, 3];

    v[0] = 10;  // 直接修改第一个元素

    println!("修改后：{:?}", v);
}</code></pre></div>
<p>或者用迭代获取可变引用：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20for%20elem%20in%20%26mut%20v%20%7B%0A%20%20%20%20%20%20%20%20*elem%20*%3D%202%3B%20%20%2F%2F%20%E5%B0%86%E6%AF%8F%E4%B8%AA%E5%85%83%E7%B4%A0%E4%B9%98%E4%BB%A5%202%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E7%BF%BB%E5%80%8D%E5%90%8E%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![1, 2, 3];

    for elem in &amp;mut v {
        *elem *= 2;  // 将每个元素乘以 2
    }

    println!("翻倍后：{:?}", v);
}</code></pre></div>
<h2 id="遍历向量">遍历向量</h2>
<h3 id="不可变遍历">不可变遍历</h3>
<p>最常见的遍历方式是用 <code>for</code> 循环和不可变借用 <code>&amp;v</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20for%20num%20in%20%26v%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%95%B0%E5%AD%97%EF%BC%9A%7B%7D%22%2C%20num)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E9%81%8D%E5%8E%86%E5%90%8E%E4%BB%8D%E7%84%B6%E5%8F%AF%E4%BB%A5%E4%BD%BF%E7%94%A8%20v%0A%20%20%20%20println!(%22%E5%90%91%E9%87%8F%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20v.len())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3, 4, 5];

    for num in &amp;v {
        println!("数字：{}", num);
    }

    // 遍历后仍然可以使用 v
    println!("向量长度：{}", v.len());
}</code></pre></div>
<p>如果直接 <code>for num in v</code>（不用 <code>&amp;</code>），会<strong>转移所有权</strong>，之后就无法再使用 <code>v</code> 了。</p>
<h3 id="可变遍历">可变遍历</h3>
<p>要修改遍历过程中的元素，使用 <code>&amp;mut v</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%5D%3B%0A%0A%20%20%20%20for%20num%20in%20%26mut%20v%20%7B%0A%20%20%20%20%20%20%20%20*num%20%2B%3D%2010%3B%20%20%2F%2F%20%E6%8C%87%E9%92%88%E8%A7%A3%E5%BC%95%E7%94%A8%E5%90%8E%E4%BF%AE%E6%94%B9%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E4%BF%AE%E6%94%B9%E5%90%8E%EF%BC%9A%7B%3A%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![1, 2, 3, 4];

    for num in &amp;mut v {
        *num += 10;  // 指针解引用后修改
    }

    println!("修改后：{:?}", v);
}</code></pre></div>
<h3 id="转移所有权的遍历">转移所有权的遍历</h3>
<p>如果向量包含<strong>非复制类型</strong>（如 <code>String</code>），直接 <code>for elem in v</code> 会转移所有权，元素无法再用：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B%0A%20%20%20%20%20%20%20%20String%3A%3Afrom(%22hello%22)%2C%0A%20%20%20%20%20%20%20%20String%3A%3Afrom(%22world%22)%2C%0A%20%20%20%20%5D%3B%0A%0A%20%20%20%20for%20s%20in%20v%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20s%20%E6%8B%A5%E6%9C%89%E8%BF%99%E4%B8%AA%E5%AD%97%E7%AC%A6%E4%B8%B2%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%20%20%20%20%20%20%20%20%2F%2F%20s%20%E5%9C%A8%E8%BF%99%E9%87%8C%E8%A2%AB%E9%94%80%E6%AF%81%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20v%20%E7%8E%B0%E5%9C%A8%E5%B7%B2%E7%BB%8F%E8%A2%AB%E6%B8%85%E7%A9%BA%E4%BA%86%EF%BC%88%E6%89%80%E6%9C%89%E6%9D%83%E8%BD%AC%E7%A7%BB%E5%AE%8C%E6%88%90%EF%BC%89%0A%20%20%20%20%2F%2F%20println!(%22%7B%3A%3F%7D%22%2C%20v)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%81v%20%E5%B7%B2%E7%BB%8F%E8%A2%AB%E6%B6%88%E8%80%97%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![
        String::from("hello"),
        String::from("world"),
    ];

    for s in v {
        // s 拥有这个字符串的所有权
        println!("{}", s);
        // s 在这里被销毁
    }

    // v 现在已经被清空了（所有权转移完成）
    // println!("{:?}", v);  // ✗ 错误！v 已经被消耗
}</code></pre></div>
<p>对比一下用不可变借用的方式，它不会消耗原向量：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B%0A%20%20%20%20%20%20%20%20String%3A%3Afrom(%22hello%22)%2C%0A%20%20%20%20%20%20%20%20String%3A%3Afrom(%22world%22)%2C%0A%20%20%20%20%5D%3B%0A%0A%20%20%20%20for%20s%20in%20%26v%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20s%20%E6%98%AF%E4%B8%80%E4%B8%AA%E5%BC%95%E7%94%A8%20%26String%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20v%20%E4%BB%8D%E7%84%B6%E5%8F%AF%E7%94%A8%EF%BC%81%0A%20%20%20%20println!(%22%E5%90%91%E9%87%8F%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20v.len())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![
        String::from("hello"),
        String::from("world"),
    ];

    for s in &amp;v {
        // s 是一个引用 &amp;String
        println!("{}", s);
    }

    // v 仍然可用！
    println!("向量长度：{}", v.len());
}</code></pre></div>
<h1 id="向量中的所有权规则">向量中的所有权规则</h1>
<p>这是一个容易出错的地方。向量的所有权规则和普通变量一样，但因为向量可以包含多个元素，情况会更复杂。</p>
<h2 id="规则-1向量拥有其元素的所有权">规则 1：向量拥有其元素的所有权</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5Bs%5D%3B%0A%0A%20%20%20%20%2F%2F%20s%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%E5%B7%B2%E7%BB%8F%E8%BD%AC%E7%A7%BB%E5%88%B0%20v%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20s)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%81s%20%E5%B7%B2%E7%BB%8F%E6%B2%A1%E6%9C%89%E6%89%80%E6%9C%89%E6%9D%83%E4%BA%86%0A%0A%20%20%20%20println!(%22%E5%90%91%E9%87%8F%E4%B8%AD%E7%9A%84%E5%AD%97%E7%AC%A6%E4%B8%B2%EF%BC%9A%7B%3A%3F%7D%22%2C%20v%5B0%5D)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = String::from("hello");
    let mut v = vec![s];

    // s 的所有权已经转移到 v
    // println!("{}", s);  // ✗ 错误！s 已经没有所有权了

    println!("向量中的字符串：{:?}", v[0]);
}</code></pre></div>
<p>向量被销毁时，它会自动销毁其中的所有元素。</p>
<h2 id="规则-2不能在遍历时修改向量的大小">规则 2：不能在遍历时修改向量的大小</h2>
<p>一个常见的错误是：<strong>在迭代过程中修改向量的结构</strong>（添加/删除元素）。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E8%BF%99%E6%A0%B7%E5%81%9A%E6%98%AF%E9%94%99%E8%AF%AF%E7%9A%84%EF%BC%9A%0A%20%20%20%20%2F%2F%20for%20elem%20in%20%26v%20%7B%0A%20%20%20%20%2F%2F%20%20%20%20%20v.push(*elem)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%81%E4%B8%8D%E8%83%BD%E5%9C%A8%E8%BF%AD%E4%BB%A3%E6%97%B6%E4%BF%AE%E6%94%B9%20v%0A%20%20%20%20%2F%2F%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![1, 2, 3];

    // 这样做是错误的：
    // for elem in &amp;v {
    //     v.push(*elem);  // ✗ 错误！不能在迭代时修改 v
    // }
}</code></pre></div>
<p>为什么不行？因为迭代器一开始就记录了要遍历的元素，如果中途改变向量的大小，迭代器可能会访问无效的内存。</p>
<blockquote>
<p><strong>如果需要修改向量的大小</strong>：先遍历并收集信息（比如要删除的索引），然后遍历完成后再修改向量。或者使用 <code>retain()</code> 方法：<code>v.retain(|&amp;x| x % 2 == 1)</code> 保留满足条件的元素。</p>
</blockquote>
<h2 id="规则-3不能同时持有可变和不可变引用">规则 3：不能同时持有可变和不可变引用</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20let%20first%20%3D%20%26v%5B0%5D%3B%20%20%2F%2F%20%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%80%9F%E7%94%A8%0A%0A%20%20%20%20v.push(4)%3B%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%81%E4%B8%8D%E8%83%BD%E8%8E%B7%E5%BE%97%E5%8F%AF%E5%8F%98%E5%80%9F%E7%94%A8%EF%BC%8C%E5%9B%A0%E4%B8%BA%E8%BF%98%E6%9C%89%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%80%9F%E7%94%A8%E5%AD%98%E5%9C%A8%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20first)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![1, 2, 3];

    let first = &amp;v[0];  // 不可变借用

    v.push(4);  // ✗ 错误！不能获得可变借用，因为还有不可变借用存在

    println!("{}", first);
}</code></pre></div>
<p>这个规则确保了内存安全。如果允许在持有引用时修改向量，那个引用可能变成悬垂指针。</p>
<h1 id="向量中的多种类型">向量中的多种类型</h1>
<p>向量的类型参数 <code>T</code> 必须是单一类型。如果你要存储<strong>多种不同类型</strong>的数据，可以用<strong>枚举</strong>：</p>
<div class="code-runner" data-full-code="enum%20Value%20%7B%0A%20%20%20%20Integer(i32)%2C%0A%20%20%20%20Text(String)%2C%0A%20%20%20%20Boolean(bool)%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B%0A%20%20%20%20%20%20%20%20Value%3A%3AInteger(42)%2C%0A%20%20%20%20%20%20%20%20Value%3A%3AText(String%3A%3Afrom(%22hello%22))%2C%0A%20%20%20%20%20%20%20%20Value%3A%3ABoolean(true)%2C%0A%20%20%20%20%5D%3B%0A%0A%20%20%20%20for%20val%20in%20%26v%20%7B%0A%20%20%20%20%20%20%20%20match%20val%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Value%3A%3AInteger(i)%20%3D%3E%20println!(%22%E6%95%B4%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20i)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20Value%3A%3AText(s)%20%3D%3E%20println!(%22%E6%96%87%E6%9C%AC%EF%BC%9A%7B%7D%22%2C%20s)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20Value%3A%3ABoolean(b)%20%3D%3E%20println!(%22%E5%B8%83%E5%B0%94%E5%80%BC%EF%BC%9A%7B%7D%22%2C%20b)%2C%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">enum Value {
    Integer(i32),
    Text(String),
    Boolean(bool),
}

fn main() {
    let v = vec![
        Value::Integer(42),
        Value::Text(String::from("hello")),
        Value::Boolean(true),
    ];

    for val in &amp;v {
        match val {
            Value::Integer(i) =&gt; println!("整数：{}", i),
            Value::Text(s) =&gt; println!("文本：{}", s),
            Value::Boolean(b) =&gt; println!("布尔值：{}", b),
        }
    }
}</code></pre></div>
<p>另一个选择是用 <strong>trait 对象</strong>（后续章节会学到），这里先不展开。</p>
<h1 id="常见操作速览">常见操作速览</h1>
<p>向量还有很多好用的方法。这里列出最常用的几个：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B3%2C%201%2C%204%2C%201%2C%205%2C%209%2C%202%2C%206%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E8%8E%B7%E5%8F%96%E9%95%BF%E5%BA%A6%0A%20%20%20%20println!(%22%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20v.len())%3B%0A%0A%20%20%20%20%2F%2F%20%E6%A3%80%E6%9F%A5%E6%98%AF%E5%90%A6%E4%B8%BA%E7%A9%BA%0A%20%20%20%20println!(%22%E4%B8%BA%E7%A9%BA%E5%90%97%EF%BC%9F%7B%7D%22%2C%20v.is_empty())%3B%0A%0A%20%20%20%20%2F%2F%20%E6%B8%85%E7%A9%BA%EF%BC%88%E5%88%A0%E9%99%A4%E6%89%80%E6%9C%89%E5%85%83%E7%B4%A0%EF%BC%89%0A%20%20%20%20let%20mut%20v2%20%3D%20v.clone()%3B%0A%20%20%20%20v2.clear()%3B%0A%20%20%20%20println!(%22%E6%B8%85%E7%A9%BA%E5%90%8E%E7%9A%84%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20v2.len())%3B%0A%0A%20%20%20%20%2F%2F%20%E6%A3%80%E6%9F%A5%E6%98%AF%E5%90%A6%E5%8C%85%E5%90%AB%E6%9F%90%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%88%E7%94%A8%20contains%EF%BC%89%0A%20%20%20%20println!(%22%E5%8C%85%E5%90%AB%204%20%E5%90%97%EF%BC%9F%7B%7D%22%2C%20v.contains(%264))%3B%0A%0A%20%20%20%20%2F%2F%20%E8%8E%B7%E5%8F%96%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%92%8C%E6%9C%80%E5%90%8E%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%EF%BC%9A%7B%3A%3F%7D%22%2C%20v.first())%3B%0A%20%20%20%20println!(%22%E6%9C%80%E5%90%8E%E4%B8%80%E4%B8%AA%EF%BC%9A%7B%3A%3F%7D%22%2C%20v.last())%3B%0A%0A%20%20%20%20%2F%2F%20%E5%8F%8D%E8%BD%AC%0A%20%20%20%20let%20mut%20v3%20%3D%20v.clone()%3B%0A%20%20%20%20v3.reverse()%3B%0A%20%20%20%20println!(%22%E5%8F%8D%E8%BD%AC%E5%90%8E%EF%BC%9A%7B%3A%3F%7D%22%2C%20v3)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![3, 1, 4, 1, 5, 9, 2, 6];

    // 获取长度
    println!("长度：{}", v.len());

    // 检查是否为空
    println!("为空吗？{}", v.is_empty());

    // 清空（删除所有元素）
    let mut v2 = v.clone();
    v2.clear();
    println!("清空后的长度：{}", v2.len());

    // 检查是否包含某个元素（用 contains）
    println!("包含 4 吗？{}", v.contains(&amp;4));

    // 获取第一个和最后一个元素
    println!("第一个：{:?}", v.first());
    println!("最后一个：{:?}", v.last());

    // 反转
    let mut v3 = v.clone();
    v3.reverse();
    println!("反转后：{:?}", v3);
}</code></pre></div>
<h1 id="练习题">练习题</h1>
</div>
</div>
</div>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习-1创建和初始化向量">练习 1：创建和初始化向量</h3>
<p>创建三个向量：</p>
<ol>
<li>使用 <code>Vec::new()</code> 和 <code>push()</code> 添加数字 10、20、30</li>
<li>使用 <code>vec!</code> 宏直接创建包含 <code>"red"</code>、<code>"green"</code>、<code>"blue"</code> 的向量</li>
<li>使用 <code>vec![0; 5]</code> 创建五个零</li>
</ol>
<p>然后打印这三个向量的长度和内容：</p>
<div class="code-editor" data-block-id="05-stdlib-types/01-vectors#5:6" data-expect-mode="literal" data-expect-pattern="%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%90%91%E9%87%8F%E9%95%BF%E5%BA%A6%EF%BC%9A3%EF%BC%8C%E5%86%85%E5%AE%B9%EF%BC%9A%5B10%2C%2020%2C%2030%5D%0A%E7%AC%AC%E4%BA%8C%E4%B8%AA%E5%90%91%E9%87%8F%E9%95%BF%E5%BA%A6%EF%BC%9A3%EF%BC%8C%E5%86%85%E5%AE%B9%EF%BC%9A%5B%22red%22%2C%20%22green%22%2C%20%22blue%22%5D%0A%E7%AC%AC%E4%B8%89%E4%B8%AA%E5%90%91%E9%87%8F%E9%95%BF%E5%BA%A6%EF%BC%9A5%EF%BC%8C%E5%86%85%E5%AE%B9%EF%BC%9A%5B0%2C%200%2C%200%2C%200%2C%200%5D" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%88%9B%E5%BB%BA%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%90%91%E9%87%8F%EF%BC%88%E9%80%9A%E8%BF%87%20Vec%3A%3Anew%20%E5%92%8C%20push%EF%BC%89%0A%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%88%9B%E5%BB%BA%E7%AC%AC%E4%BA%8C%E4%B8%AA%E5%90%91%E9%87%8F%EF%BC%88%E9%A2%9C%E8%89%B2%EF%BC%89%0A%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%88%9B%E5%BB%BA%E7%AC%AC%E4%B8%89%E4%B8%AA%E5%90%91%E9%87%8F%EF%BC%88%E4%BA%94%E4%B8%AA%E9%9B%B6%EF%BC%89%0A%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E6%89%93%E5%8D%B0%E4%B8%89%E4%B8%AA%E5%90%91%E9%87%8F%E7%9A%84%E9%95%BF%E5%BA%A6%E5%92%8C%E5%86%85%E5%AE%B9%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%90%91%E9%87%8F%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%EF%BC%8C%E5%86%85%E5%AE%B9%EF%BC%9A%7B%3A%3F%7D%22%2C%20v1.len()%2C%20v1)%3B%0A%20%20%20%20println!(%22%E7%AC%AC%E4%BA%8C%E4%B8%AA%E5%90%91%E9%87%8F%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%EF%BC%8C%E5%86%85%E5%AE%B9%EF%BC%9A%7B%3A%3F%7D%22%2C%20v2.len()%2C%20v2)%3B%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%89%E4%B8%AA%E5%90%91%E9%87%8F%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%EF%BC%8C%E5%86%85%E5%AE%B9%EF%BC%9A%7B%3A%3F%7D%22%2C%20v3.len()%2C%20v3)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    // TODO: 创建第一个向量（通过 Vec::new 和 push）


    // TODO: 创建第二个向量（颜色）


    // TODO: 创建第三个向量（五个零）


    // TODO: 打印三个向量的长度和内容
    println!("第一个向量长度：{}，内容：{:?}", v1.len(), v1);
    println!("第二个向量长度：{}，内容：{:?}", v2.len(), v2);
    println!("第三个向量长度：{}，内容：{:?}", v3.len(), v3);
}</code></pre></div>
<h3 id="练习-2向量操作综合">练习 2：向量操作综合</h3>
<p>完成下面的函数，实现对向量的各种操作：</p>
<div class="code-editor" data-block-id="05-stdlib-types/01-vectors#5:7" data-expect-mode="literal" data-expect-pattern="%E9%95%BF%E5%BA%A6%EF%BC%9A6%0A%E4%B8%BA%E7%A9%BA%E5%90%97%EF%BC%9Ffalse%0A%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%9ASome(1)%0A%E6%9C%80%E5%90%8E%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%9ASome(6)%0A%E6%89%80%E6%9C%89%E5%85%83%E7%B4%A0%EF%BC%9A%5B1%2C%202%2C%203%2C%204%2C%205%2C%206%5D%0A%E6%80%BB%E5%92%8C%EF%BC%9A21" data-starter-code="fn%20print_vector_info(v%3A%20%26Vec%3Ci32%3E)%20%7B%0A%20%20%20%20%2F%2F%20%E6%89%93%E5%8D%B0%E5%90%91%E9%87%8F%E7%9A%84%E9%95%BF%E5%BA%A6%0A%20%20%20%20println!(%22%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%89%93%E5%8D%B0%E6%98%AF%E5%90%A6%E4%B8%BA%E7%A9%BA%0A%20%20%20%20println!(%22%E4%B8%BA%E7%A9%BA%E5%90%97%EF%BC%9F%7B%7D%22%2C%20)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%89%93%E5%8D%B0%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%88%E7%94%A8%20first%EF%BC%89%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%9A%7B%3A%3F%7D%22%2C%20)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%89%93%E5%8D%B0%E6%9C%80%E5%90%8E%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%88%E7%94%A8%20last%EF%BC%89%0A%20%20%20%20println!(%22%E6%9C%80%E5%90%8E%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%9A%7B%3A%3F%7D%22%2C%20)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%89%93%E5%8D%B0%E6%89%80%E6%9C%89%E5%85%83%E7%B4%A0%0A%20%20%20%20println!(%22%E6%89%80%E6%9C%89%E5%85%83%E7%B4%A0%EF%BC%9A%7B%3A%3F%7D%22%2C%20)%3B%0A%7D%0A%0Afn%20sum_vector(v%3A%20%26Vec%3Ci32%3E)%20-%3E%20i32%20%7B%0A%20%20%20%20%2F%2F%20%E8%AE%A1%E7%AE%97%E5%90%91%E9%87%8F%E6%89%80%E6%9C%89%E5%85%83%E7%B4%A0%E7%9A%84%E5%92%8C%EF%BC%88%E7%94%A8%20for%20%E5%BE%AA%E7%8E%AF%EF%BC%89%0A%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%2C%206%5D%3B%0A%0A%20%20%20%20print_vector_info(%26v)%3B%0A%0A%20%20%20%20println!(%22%E6%80%BB%E5%92%8C%EF%BC%9A%7B%7D%22%2C%20sum_vector(%26v))%3B%0A%7D"><pre><code class="language-rust">fn print_vector_info(v: &amp;Vec&lt;i32&gt;) {
    // 打印向量的长度
    println!("长度：{}", );

    // 打印是否为空
    println!("为空吗？{}", );

    // 打印第一个元素（用 first）
    println!("第一个元素：{:?}", );

    // 打印最后一个元素（用 last）
    println!("最后一个元素：{:?}", );

    // 打印所有元素
    println!("所有元素：{:?}", );
}

fn sum_vector(v: &amp;Vec&lt;i32&gt;) -&gt; i32 {
    // 计算向量所有元素的和（用 for 循环）

}

fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];

    print_vector_info(&amp;v);

    println!("总和：{}", sum_vector(&amp;v));
}</code></pre></div> 