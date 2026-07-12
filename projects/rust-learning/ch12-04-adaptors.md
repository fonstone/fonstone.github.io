---
title: "适配器"
description: "闭包与迭代器 - 适配器"
date: "2026-07-12"
order: 12004
tags: ["消费适配器", "迭代器适配器", "map", "filter", "collect", "fold", "zip", "enumerate", "Iterator"]
est_time: "40 分钟"
---

 <h1 id="两类适配器">两类适配器</h1>
<p><code>Iterator</code> trait 上有几十个方法，它们分为截然不同的两类：</p>
<table><thead><tr><th>类别</th><th>返回值</th><th>是否惰性</th><th>典型方法</th></tr></thead><tbody><tr><td><strong>迭代器适配器</strong></td><td>新的迭代器</td><td>是（不立即执行）</td><td><code>map</code>、<code>filter</code>、<code>zip</code>、<code>enumerate</code></td></tr><tr><td><strong>消费适配器</strong></td><td>最终结果值</td><td>否（立即执行并消耗）</td><td><code>sum</code>、<code>collect</code>、<code>fold</code>、<code>find</code></td></tr></tbody></table>
<p>一条完整的迭代器链通常长这样：<strong>迭代器适配器（零个或多个）→ 消费适配器（恰好一个）</strong>。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%2C%206%5D%3B%0A%0A%20%20%20%20let%20result%3A%20i32%20%3D%20v.iter()%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%88%9B%E5%BB%BA%E8%BF%AD%E4%BB%A3%E5%99%A8%0A%20%20%20%20%20%20%20%20.filter(%7C%26%26x%7C%20x%20%25%202%20%3D%3D%200)%20%20%20%20%20%20%2F%2F%20%E8%BF%AD%E4%BB%A3%E5%99%A8%E9%80%82%E9%85%8D%E5%99%A8%EF%BC%9A%E6%83%B0%E6%80%A7%EF%BC%8C%E5%8F%AA%E6%8F%8F%E8%BF%B0%22%E4%BF%9D%E7%95%99%E5%81%B6%E6%95%B0%22%0A%20%20%20%20%20%20%20%20.map(%7C%26x%7C%20x%20*%20x)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E8%BF%AD%E4%BB%A3%E5%99%A8%E9%80%82%E9%85%8D%E5%99%A8%EF%BC%9A%E6%83%B0%E6%80%A7%EF%BC%8C%E5%8F%AA%E6%8F%8F%E8%BF%B0%22%E5%B9%B3%E6%96%B9%22%0A%20%20%20%20%20%20%20%20.sum()%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E6%B6%88%E8%B4%B9%E9%80%82%E9%85%8D%E5%99%A8%EF%BC%9A%E8%A7%A6%E5%8F%91%E6%89%A7%E8%A1%8C%EF%BC%8C%E8%BF%94%E5%9B%9E%20i32%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20result)%3B%20%2F%2F%204%20%2B%2016%20%2B%2036%20%3D%2056%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];

    let result: i32 = v.iter()          // 创建迭代器
        .filter(|&amp;&amp;x| x % 2 == 0)      // 迭代器适配器：惰性，只描述"保留偶数"
        .map(|&amp;x| x * x)               // 迭代器适配器：惰性，只描述"平方"
        .sum();                         // 消费适配器：触发执行，返回 i32

    println!("{}", result); // 4 + 16 + 36 = 56
}</code></pre></div>
<blockquote>
<p><strong>关键点</strong>：<code>filter</code> 和 <code>map</code> 被调用时<strong>什么都没有发生</strong>，它们只是在描述”待做的变换”。直到 <code>sum()</code> 被调用，整条链才从头到尾运行一遍。这就是惰性求值的好处——中间不产生任何临时集合，内存效率更高。</p>
</blockquote>
<h2 id="如果只调用适配器不消费会怎样">如果只调用适配器，不消费会怎样？</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20v.iter().map(%7Cx%7C%20x%20*%202)%3B%20%2F%2F%20%E7%BC%96%E8%AF%91%E5%99%A8%E8%AD%A6%E5%91%8A%EF%BC%9Aunused%20Map%EF%BC%8C%E9%80%82%E9%85%8D%E5%99%A8%E6%98%AF%E6%83%B0%E6%80%A7%E7%9A%84%EF%BC%8C%E4%B8%8D%E6%B6%88%E8%B4%B9%E5%88%99%E4%BB%80%E4%B9%88%E9%83%BD%E4%B8%8D%E5%81%9A%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3];

    v.iter().map(|x| x * 2); // 编译器警告：unused Map，适配器是惰性的，不消费则什么都不做
}</code></pre></div>
<p>Rust 编译器会发出警告提醒你：这段代码什么都没做。</p>
<h1 id="消费适配器">消费适配器</h1>
<p>消费适配器获取迭代器的所有权，反复调用 <code>next()</code> 直到 <code>None</code>，最终产生一个非迭代器的结果值。<strong>调用之后迭代器就不能再用了。</strong></p>
<table><thead><tr><th>方法</th><th>返回值</th><th>功能</th></tr></thead><tbody><tr><td><code>sum()</code></td><td>数值</td><td>对所有元素求和</td></tr><tr><td><code>product()</code></td><td>数值</td><td>对所有元素求乘积</td></tr><tr><td><code>count()</code></td><td><code>usize</code></td><td>统计元素个数</td></tr><tr><td><code>last()</code></td><td><code>Option&lt;T&gt;</code></td><td>获取最后一个元素</td></tr><tr><td><code>nth(n)</code></td><td><code>Option&lt;T&gt;</code></td><td>获取第 n 个元素（会消耗前面的）</td></tr><tr><td><code>max()</code> / <code>min()</code></td><td><code>Option&lt;T&gt;</code></td><td>获取最大 / 最小值</td></tr><tr><td><code>any(f)</code></td><td><code>bool</code></td><td>是否存在满足条件的元素（短路）</td></tr><tr><td><code>all(f)</code></td><td><code>bool</code></td><td>是否所有元素都满足条件（短路）</td></tr><tr><td><code>find(f)</code></td><td><code>Option&lt;&amp;T&gt;</code></td><td>返回第一个满足条件的元素</td></tr><tr><td><code>position(f)</code></td><td><code>Option&lt;usize&gt;</code></td><td>返回第一个满足条件的元素的索引</td></tr><tr><td><code>collect()</code></td><td>集合</td><td>收集为 <code>Vec</code>、<code>HashSet</code>、<code>String</code> 等</td></tr><tr><td><code>fold(init, f)</code></td><td>任意类型</td><td>通用聚合，从初始值开始逐步累加</td></tr></tbody></table>
<h2 id="sum-与-product数值聚合">sum 与 product：数值聚合</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20let%20total%3A%20i32%20%3D%20v.iter().sum()%3B%0A%20%20%20%20println!(%22%E6%B1%82%E5%92%8C%3A%20%7B%7D%22%2C%20total)%3B%20%2F%2F%2015%0A%0A%20%20%20%20let%20product%3A%20i32%20%3D%20v.iter().product()%3B%0A%20%20%20%20println!(%22%E6%B1%82%E7%A7%AF%3A%20%7B%7D%22%2C%20product)%3B%20%2F%2F%20120%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3, 4, 5];

    let total: i32 = v.iter().sum();
    println!("求和: {}", total); // 15

    let product: i32 = v.iter().product();
    println!("求积: {}", product); // 120
}</code></pre></div>
<h2 id="countlastnth定位与计数">count、last、nth：定位与计数</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B10%2C%2020%2C%2030%2C%2040%2C%2050%5D%3B%0A%0A%20%20%20%20println!(%22%E5%85%83%E7%B4%A0%E6%95%B0%E9%87%8F%3A%20%7B%7D%22%2C%20v.iter().count())%3B%20%2F%2F%205%0A%20%20%20%20println!(%22%E6%9C%80%E5%90%8E%E4%B8%80%E4%B8%AA%3A%20%7B%3A%3F%7D%22%2C%20v.iter().last())%3B%20%2F%2F%20Some(%2650)%0A%0A%20%20%20%20%2F%2F%20nth%20%E4%BC%9A%E6%B6%88%E8%80%97%E5%89%8D%E9%9D%A2%E7%9A%84%E5%85%83%E7%B4%A0%0A%20%20%20%20let%20mut%20iter%20%3D%20v.iter()%3B%0A%20%20%20%20println!(%22%E7%AC%AC%202%20%E4%B8%AA%3A%20%7B%3A%3F%7D%22%2C%20iter.nth(2))%3B%20%20%2F%2F%20Some(%2630)%EF%BC%8C%E5%89%8D%203%20%E4%B8%AA%E5%B7%B2%E8%A2%AB%E6%B6%88%E8%80%97%0A%20%20%20%20println!(%22%E4%B9%8B%E5%90%8E%E7%9A%84%E4%B8%8B%E4%B8%80%E4%B8%AA%3A%20%7B%3A%3F%7D%22%2C%20iter.next())%3B%20%2F%2F%20Some(%2640)%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![10, 20, 30, 40, 50];

    println!("元素数量: {}", v.iter().count()); // 5
    println!("最后一个: {:?}", v.iter().last()); // Some(&amp;50)

    // nth 会消耗前面的元素
    let mut iter = v.iter();
    println!("第 2 个: {:?}", iter.nth(2));  // Some(&amp;30)，前 3 个已被消耗
    println!("之后的下一个: {:?}", iter.next()); // Some(&amp;40)
}</code></pre></div>
<h2 id="max-与-min求极值">max 与 min：求极值</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B3%2C%201%2C%204%2C%201%2C%205%2C%209%2C%202%2C%206%5D%3B%0A%0A%20%20%20%20println!(%22%E6%9C%80%E5%A4%A7%E5%80%BC%3A%20%7B%3A%3F%7D%22%2C%20v.iter().max())%3B%20%2F%2F%20Some(%269)%0A%20%20%20%20println!(%22%E6%9C%80%E5%B0%8F%E5%80%BC%3A%20%7B%3A%3F%7D%22%2C%20v.iter().min())%3B%20%2F%2F%20Some(%261)%0A%0A%20%20%20%20let%20empty%3A%20Vec%3Ci32%3E%20%3D%20vec!%5B%5D%3B%0A%20%20%20%20println!(%22%E7%A9%BA%E9%9B%86%E5%90%88%E7%9A%84%E6%9C%80%E5%A4%A7%E5%80%BC%3A%20%7B%3A%3F%7D%22%2C%20empty.iter().max())%3B%20%2F%2F%20None%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![3, 1, 4, 1, 5, 9, 2, 6];

    println!("最大值: {:?}", v.iter().max()); // Some(&amp;9)
    println!("最小值: {:?}", v.iter().min()); // Some(&amp;1)

    let empty: Vec&lt;i32&gt; = vec![];
    println!("空集合的最大值: {:?}", empty.iter().max()); // None
}</code></pre></div>
<h2 id="any-与-all条件判断">any 与 all：条件判断</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20println!(%22%E6%9C%89%E5%81%B6%E6%95%B0%3A%20%7B%7D%22%2C%20v.iter().any(%7Cx%7C%20x%20%25%202%20%3D%3D%200))%3B%20%2F%2F%20true%0A%20%20%20%20println!(%22%E5%85%A8%E9%83%A8%E4%B8%BA%E6%AD%A3%3A%20%7B%7D%22%2C%20v.iter().all(%7Cx%7C%20*x%20%3E%200))%3B%20%20%20%2F%2F%20true%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3, 4, 5];

    println!("有偶数: {}", v.iter().any(|x| x % 2 == 0)); // true
    println!("全部为正: {}", v.iter().all(|x| *x &gt; 0));   // true
}</code></pre></div>
<blockquote>
<p><code>any</code> 和 <code>all</code> 是<strong>短路求值</strong>的：<code>any</code> 找到第一个满足条件的元素就停止；<code>all</code> 遇到第一个不满足的就停止。</p>
</blockquote>
<h2 id="find-与-position查找元素">find 与 position：查找元素</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%203%2C%205%2C%206%2C%207%2C%208%5D%3B%0A%0A%20%20%20%20let%20first_even%20%3D%20v.iter().find(%7C%26%26x%7C%20x%20%25%202%20%3D%3D%200)%3B%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%81%B6%E6%95%B0%3A%20%7B%3A%3F%7D%22%2C%20first_even)%3B%20%2F%2F%20Some(%266)%0A%0A%20%20%20%20let%20pos%20%3D%20v.iter().position(%7C%26x%7C%20x%20%25%202%20%3D%3D%200)%3B%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%81%B6%E6%95%B0%E7%9A%84%E4%BD%8D%E7%BD%AE%3A%20%7B%3A%3F%7D%22%2C%20pos)%3B%20%2F%2F%20Some(3)%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 3, 5, 6, 7, 8];

    let first_even = v.iter().find(|&amp;&amp;x| x % 2 == 0);
    println!("第一个偶数: {:?}", first_even); // Some(&amp;6)

    let pos = v.iter().position(|&amp;x| x % 2 == 0);
    println!("第一个偶数的位置: {:?}", pos); // Some(3)
}</code></pre></div>
<h2 id="collect把迭代器变成集合">collect：把迭代器变成集合</h2>
<p><code>collect</code> 是最常用的消费适配器之一，它把迭代器收集进一个集合。必须显式标注目标类型：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20let%20doubled%3A%20Vec%3Ci32%3E%20%3D%20v.iter().map(%7Cx%7C%20x%20*%202).collect()%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20doubled)%3B%20%2F%2F%20%5B2%2C%204%2C%206%5D%0A%0A%20%20%20%20%2F%2F%20%E6%94%B6%E9%9B%86%E6%88%90%E5%AD%97%E7%AC%A6%E4%B8%B2%0A%20%20%20%20let%20parts%20%3D%20vec!%5B%22Rust%22%2C%20%22%20%22%2C%20%22is%22%2C%20%22%20%22%2C%20%22fast%22%5D%3B%0A%20%20%20%20let%20sentence%3A%20String%20%3D%20parts.into_iter().collect()%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20sentence)%3B%20%2F%2F%20Rust%20is%20fast%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3];

    let doubled: Vec&lt;i32&gt; = v.iter().map(|x| x * 2).collect();
    println!("{:?}", doubled); // [2, 4, 6]

    // 收集成字符串
    let parts = vec!["Rust", " ", "is", " ", "fast"];
    let sentence: String = parts.into_iter().collect();
    println!("{}", sentence); // Rust is fast
}</code></pre></div>
<div class="code-runner" data-full-code="use%20std%3A%3Acollections%3A%3AHashSet%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%94%B6%E9%9B%86%E6%88%90%20HashSet%20%E8%87%AA%E5%8A%A8%E5%8E%BB%E9%87%8D%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%202%2C%203%2C%203%2C%203%2C%204%5D%3B%0A%20%20%20%20let%20unique%3A%20HashSet%3Ci32%3E%20%3D%20v.into_iter().collect()%3B%0A%20%20%20%20println!(%22%E5%8E%BB%E9%87%8D%E5%90%8E%E6%9C%89%20%7B%7D%20%E4%B8%AA%E5%85%83%E7%B4%A0%22%2C%20unique.len())%3B%20%2F%2F%204%0A%7D" data-mode="run"><pre><code class="language-rust">use std::collections::HashSet;

fn main() {
    // 收集成 HashSet 自动去重
    let v = vec![1, 2, 2, 3, 3, 3, 4];
    let unique: HashSet&lt;i32&gt; = v.into_iter().collect();
    println!("去重后有 {} 个元素", unique.len()); // 4
}</code></pre></div>
<h2 id="fold通用聚合">fold：通用聚合</h2>
<p><code>fold</code> 是所有聚合方法的”祖先”，<code>sum</code>/<code>product</code>/<code>count</code> 等都可以用它实现：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20%2F%2F%20fold(%E5%88%9D%E5%A7%8B%E5%80%BC%2C%20%7C%E7%B4%AF%E5%8A%A0%E5%99%A8%2C%20%E5%BD%93%E5%89%8D%E5%85%83%E7%B4%A0%7C%20%E6%96%B0%E7%9A%84%E7%B4%AF%E5%8A%A0%E5%99%A8)%0A%20%20%20%20let%20sum%20%20%3D%20v.iter().fold(0%2C%20%7Cacc%2C%20x%7C%20acc%20%2B%20x)%3B%20%20%20%20%20%2F%2F%20%E7%AD%89%E4%BB%B7%E4%BA%8E%20sum()%0A%20%20%20%20let%20prod%20%3D%20v.iter().fold(1%2C%20%7Cacc%2C%20x%7C%20acc%20*%20x)%3B%20%20%20%20%20%2F%2F%20%E7%AD%89%E4%BB%B7%E4%BA%8E%20product()%0A%20%20%20%20let%20max%20%20%3D%20v.iter().fold(i32%3A%3AMIN%2C%20%7Cacc%2C%20%26x%7C%20acc.max(x))%3B%0A%0A%20%20%20%20println!(%22sum%3D%7B%7D%20product%3D%7B%7D%20max%3D%7B%7D%22%2C%20sum%2C%20prod%2C%20max)%3B%0A%0A%20%20%20%20%2F%2F%20fold%20%E5%8F%AF%E4%BB%A5%E6%9E%84%E5%BB%BA%E4%BB%BB%E6%84%8F%E7%BB%93%E6%9E%84%0A%20%20%20%20let%20s%20%3D%20v.iter().fold(String%3A%3Anew()%2C%20%7Cmut%20acc%2C%20x%7C%20%7B%0A%20%20%20%20%20%20%20%20if%20!acc.is_empty()%20%7B%20acc.push_str(%22%2C%20%22)%3B%20%7D%0A%20%20%20%20%20%20%20%20acc.push_str(%26x.to_string())%3B%0A%20%20%20%20%20%20%20%20acc%0A%20%20%20%20%7D)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%20%2F%2F%201%2C%202%2C%203%2C%204%2C%205%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // fold(初始值, |累加器, 当前元素| 新的累加器)
    let sum  = v.iter().fold(0, |acc, x| acc + x);     // 等价于 sum()
    let prod = v.iter().fold(1, |acc, x| acc * x);     // 等价于 product()
    let max  = v.iter().fold(i32::MIN, |acc, &amp;x| acc.max(x));

    println!("sum={} product={} max={}", sum, prod, max);

    // fold 可以构建任意结构
    let s = v.iter().fold(String::new(), |mut acc, x| {
        if !acc.is_empty() { acc.push_str(", "); }
        acc.push_str(&amp;x.to_string());
        acc
    });
    println!("{}", s); // 1, 2, 3, 4, 5
}</code></pre></div>
<h1 id="迭代器适配器">迭代器适配器</h1>
<p>迭代器适配器返回新的迭代器，不立即执行，可以无限链式调用。<strong>必须以一个消费适配器结尾，整条链才会真正运行。</strong></p>
<table><thead><tr><th>方法</th><th>功能</th></tr></thead><tbody><tr><td><code>map(f)</code></td><td>对每个元素应用闭包，产生等量的新元素</td></tr><tr><td><code>filter(f)</code></td><td>保留闭包返回 <code>true</code> 的元素</td></tr><tr><td><code>filter_map(f)</code></td><td>闭包返回 <code>Some</code> 则保留变换后的值，<code>None</code> 则丢弃</td></tr><tr><td><code>enumerate()</code></td><td>将每个元素包装为 <code>(index, element)</code> 元组</td></tr><tr><td><code>zip(other)</code></td><td>将两个迭代器逐一配对为元组，以较短的为准</td></tr><tr><td><code>take(n)</code></td><td>只取前 n 个元素</td></tr><tr><td><code>skip(n)</code></td><td>跳过前 n 个元素</td></tr><tr><td><code>take_while(f)</code></td><td>取元素直到闭包首次返回 <code>false</code></td></tr><tr><td><code>skip_while(f)</code></td><td>跳过元素直到闭包首次返回 <code>false</code></td></tr><tr><td><code>chain(other)</code></td><td>将两个迭代器首尾拼接</td></tr><tr><td><code>flat_map(f)</code></td><td>每个元素映射为一个子迭代器，然后展平一层</td></tr><tr><td><code>flatten()</code></td><td>展平嵌套迭代器（等价于不做变换的 <code>flat_map</code>）</td></tr><tr><td><code>peekable()</code></td><td>包装为可窥视下一个元素而不消耗的迭代器</td></tr><tr><td><code>cloned()</code> / <code>copied()</code></td><td>将 <code>&amp;T</code> 元素克隆 / 复制为 <code>T</code></td></tr></tbody></table>
<h2 id="map变换每个元素">map：变换每个元素</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20let%20doubled%3A%20Vec%3Ci32%3E%20%3D%20v.iter().map(%7Cx%7C%20x%20*%202).collect()%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20doubled)%3B%20%2F%2F%20%5B2%2C%204%2C%206%2C%208%2C%2010%5D%0A%0A%20%20%20%20let%20strings%3A%20Vec%3CString%3E%20%3D%20v.iter().map(%7Cx%7C%20x.to_string()).collect()%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20strings)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3, 4, 5];

    let doubled: Vec&lt;i32&gt; = v.iter().map(|x| x * 2).collect();
    println!("{:?}", doubled); // [2, 4, 6, 8, 10]

    let strings: Vec&lt;String&gt; = v.iter().map(|x| x.to_string()).collect();
    println!("{:?}", strings);
}</code></pre></div>
<h2 id="filter筛选元素">filter：筛选元素</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%2C%206%5D%3B%0A%0A%20%20%20%20let%20evens%3A%20Vec%3C%26i32%3E%20%3D%20v.iter().filter(%7Cx%7C%20*x%20%25%202%20%3D%3D%200).collect()%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20evens)%3B%20%2F%2F%20%5B2%2C%204%2C%206%5D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];

    let evens: Vec&lt;&amp;i32&gt; = v.iter().filter(|x| *x % 2 == 0).collect();
    println!("{:?}", evens); // [2, 4, 6]
}</code></pre></div>
<p><code>filter</code> 的闭包可以捕获外部变量，实现动态筛选：</p>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Astruct%20Shoe%20%7B%20size%3A%20u32%2C%20style%3A%20String%20%7D%0A%0Afn%20shoes_in_size(shoes%3A%20Vec%3CShoe%3E%2C%20shoe_size%3A%20u32)%20-%3E%20Vec%3CShoe%3E%20%7B%0A%20%20%20%20shoes.into_iter()%0A%20%20%20%20%20%20%20%20.filter(%7Cs%7C%20s.size%20%3D%3D%20shoe_size)%20%2F%2F%20%E6%8D%95%E8%8E%B7%E5%A4%96%E9%83%A8%E5%8F%98%E9%87%8F%20shoe_size%0A%20%20%20%20%20%20%20%20.collect()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20shoes%20%3D%20vec!%5B%0A%20%20%20%20%20%20%20%20Shoe%20%7B%20size%3A%2010%2C%20style%3A%20String%3A%3Afrom(%22%E8%BF%90%E5%8A%A8%E9%9E%8B%22)%20%7D%2C%0A%20%20%20%20%20%20%20%20Shoe%20%7B%20size%3A%2013%2C%20style%3A%20String%3A%3Afrom(%22%E5%87%89%E9%9E%8B%22)%20%7D%2C%0A%20%20%20%20%20%20%20%20Shoe%20%7B%20size%3A%2010%2C%20style%3A%20String%3A%3Afrom(%22%E9%9D%B4%E5%AD%90%22)%20%7D%2C%0A%20%20%20%20%5D%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20shoes_in_size(shoes%2C%2010))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
struct Shoe { size: u32, style: String }

fn shoes_in_size(shoes: Vec&lt;Shoe&gt;, shoe_size: u32) -&gt; Vec&lt;Shoe&gt; {
    shoes.into_iter()
        .filter(|s| s.size == shoe_size) // 捕获外部变量 shoe_size
        .collect()
}

fn main() {
    let shoes = vec![
        Shoe { size: 10, style: String::from("运动鞋") },
        Shoe { size: 13, style: String::from("凉鞋") },
        Shoe { size: 10, style: String::from("靴子") },
    ];
    println!("{:?}", shoes_in_size(shoes, 10));
}</code></pre></div>
<h2 id="filter_map变换--过滤一步到位">filter_map：变换 + 过滤一步到位</h2>
<p>闭包返回 <code>Some(value)</code> 表示保留，返回 <code>None</code> 表示丢弃：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20strings%20%3D%20vec!%5B%221%22%2C%20%22%E4%B8%A4%22%2C%20%223%22%2C%20%22%E5%9B%9B%22%2C%20%225%22%5D%3B%0A%0A%20%20%20%20let%20numbers%3A%20Vec%3Ci32%3E%20%3D%20strings.iter()%0A%20%20%20%20%20%20%20%20.filter_map(%7Cs%7C%20s.parse().ok())%20%2F%2F%20%E8%A7%A3%E6%9E%90%E5%A4%B1%E8%B4%A5%E7%9A%84%E7%9B%B4%E6%8E%A5%E4%B8%A2%E5%BC%83%0A%20%20%20%20%20%20%20%20.collect()%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20numbers)%3B%20%2F%2F%20%5B1%2C%203%2C%205%5D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let strings = vec!["1", "两", "3", "四", "5"];

    let numbers: Vec&lt;i32&gt; = strings.iter()
        .filter_map(|s| s.parse().ok()) // 解析失败的直接丢弃
        .collect();
    println!("{:?}", numbers); // [1, 3, 5]
}</code></pre></div>
<h2 id="enumerate带上索引">enumerate：带上索引</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20fruits%20%3D%20vec!%5B%22%E8%8B%B9%E6%9E%9C%22%2C%20%22%E9%A6%99%E8%95%89%22%2C%20%22%E6%A9%99%E5%AD%90%22%5D%3B%0A%0A%20%20%20%20for%20(i%2C%20fruit)%20in%20fruits.iter().enumerate()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%3A%20%7B%7D%22%2C%20i%2C%20fruit)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let fruits = vec!["苹果", "香蕉", "橙子"];

    for (i, fruit) in fruits.iter().enumerate() {
        println!("{}: {}", i, fruit);
    }
}</code></pre></div>
<h2 id="zip合并两个迭代器">zip：合并两个迭代器</h2>
<p><code>zip</code> 把两个迭代器逐一配对，以较短的为准：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20names%20%3D%20vec!%5B%22Alice%22%2C%20%22Bob%22%2C%20%22Charlie%22%5D%3B%0A%20%20%20%20let%20scores%20%3D%20vec!%5B95%2C%2087%2C%2092%5D%3B%0A%0A%20%20%20%20let%20combined%3A%20Vec%3C(%26str%2C%20i32)%3E%20%3D%20names.into_iter().zip(scores.into_iter()).collect()%3B%0A%20%20%20%20for%20(name%2C%20score)%20in%20%26combined%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%3A%20%7B%7D%22%2C%20name%2C%20score)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let names = vec!["Alice", "Bob", "Charlie"];
    let scores = vec![95, 87, 92];

    let combined: Vec&lt;(&amp;str, i32)&gt; = names.into_iter().zip(scores.into_iter()).collect();
    for (name, score) in &amp;combined {
        println!("{}: {}", name, score);
    }
}</code></pre></div>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20let%20b%20%3D%20vec!%5B%22one%22%2C%20%22two%22%2C%20%22three%22%5D%3B%20%2F%2F%20%E5%8F%AA%E6%9C%89%203%20%E4%B8%AA%0A%0A%20%20%20%20let%20zipped%3A%20Vec%3C_%3E%20%3D%20a.iter().zip(b.iter()).collect()%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20zipped)%3B%20%2F%2F%20%5B(1%2C%20%22one%22)%2C%20(2%2C%20%22two%22)%2C%20(3%2C%20%22three%22)%5D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let a = vec![1, 2, 3, 4, 5];
    let b = vec!["one", "two", "three"]; // 只有 3 个

    let zipped: Vec&lt;_&gt; = a.iter().zip(b.iter()).collect();
    println!("{:?}", zipped); // [(1, "one"), (2, "two"), (3, "three")]
}</code></pre></div>
<h2 id="takeskip-及其变体">take、skip 及其变体</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%2C%206%2C%207%2C%208%5D%3B%0A%0A%20%20%20%20let%20first3%3A%20Vec%3C_%3E%20%3D%20v.iter().take(3).collect()%3B%0A%20%20%20%20println!(%22%E5%89%8D%203%20%E4%B8%AA%3A%20%7B%3A%3F%7D%22%2C%20first3)%3B%20%2F%2F%20%5B1%2C%202%2C%203%5D%0A%0A%20%20%20%20let%20after3%3A%20Vec%3C_%3E%20%3D%20v.iter().skip(3).collect()%3B%0A%20%20%20%20println!(%22%E8%B7%B3%E8%BF%87%E5%89%8D%203%3A%20%7B%3A%3F%7D%22%2C%20after3)%3B%20%2F%2F%20%5B4%2C%205%2C%206%2C%207%2C%208%5D%0A%0A%20%20%20%20let%20less_than5%3A%20Vec%3C_%3E%20%3D%20v.iter().take_while(%7C%26%26x%7C%20x%20%3C%205).collect()%3B%0A%20%20%20%20println!(%22%E5%B0%8F%E4%BA%8E%205%20%E7%9A%84%E5%89%8D%E7%BC%80%3A%20%7B%3A%3F%7D%22%2C%20less_than5)%3B%20%2F%2F%20%5B1%2C%202%2C%203%2C%204%5D%0A%0A%20%20%20%20let%20from5%3A%20Vec%3C_%3E%20%3D%20v.iter().skip_while(%7C%26%26x%7C%20x%20%3C%205).collect()%3B%0A%20%20%20%20println!(%22%E4%BB%8E%205%20%E5%BC%80%E5%A7%8B%3A%20%7B%3A%3F%7D%22%2C%20from5)%3B%20%2F%2F%20%5B5%2C%206%2C%207%2C%208%5D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3, 4, 5, 6, 7, 8];

    let first3: Vec&lt;_&gt; = v.iter().take(3).collect();
    println!("前 3 个: {:?}", first3); // [1, 2, 3]

    let after3: Vec&lt;_&gt; = v.iter().skip(3).collect();
    println!("跳过前 3: {:?}", after3); // [4, 5, 6, 7, 8]

    let less_than5: Vec&lt;_&gt; = v.iter().take_while(|&amp;&amp;x| x &lt; 5).collect();
    println!("小于 5 的前缀: {:?}", less_than5); // [1, 2, 3, 4]

    let from5: Vec&lt;_&gt; = v.iter().skip_while(|&amp;&amp;x| x &lt; 5).collect();
    println!("从 5 开始: {:?}", from5); // [5, 6, 7, 8]
}</code></pre></div>
<h2 id="chain-与-flat_map拼接与展平">chain 与 flat_map：拼接与展平</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%20%20%20%20let%20b%20%3D%20vec!%5B4%2C%205%2C%206%5D%3B%0A%0A%20%20%20%20%2F%2F%20chain%EF%BC%9A%E8%BF%9E%E6%8E%A5%E4%B8%A4%E4%B8%AA%E8%BF%AD%E4%BB%A3%E5%99%A8%0A%20%20%20%20let%20combined%3A%20Vec%3C_%3E%20%3D%20a.iter().chain(b.iter()).collect()%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20combined)%3B%20%2F%2F%20%5B1%2C%202%2C%203%2C%204%2C%205%2C%206%5D%0A%0A%20%20%20%20%2F%2F%20flat_map%EF%BC%9A%E5%8F%98%E6%8D%A2%E5%90%8E%E5%B1%95%E5%B9%B3%E4%B8%80%E5%B1%82%0A%20%20%20%20let%20words%20%3D%20vec!%5B%22hello%20world%22%2C%20%22foo%20bar%22%5D%3B%0A%20%20%20%20let%20all_words%3A%20Vec%3C%26str%3E%20%3D%20words.iter()%0A%20%20%20%20%20%20%20%20.flat_map(%7Cs%7C%20s.split_whitespace())%0A%20%20%20%20%20%20%20%20.collect()%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20all_words)%3B%20%2F%2F%20%5B%22hello%22%2C%20%22world%22%2C%20%22foo%22%2C%20%22bar%22%5D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];

    // chain：连接两个迭代器
    let combined: Vec&lt;_&gt; = a.iter().chain(b.iter()).collect();
    println!("{:?}", combined); // [1, 2, 3, 4, 5, 6]

    // flat_map：变换后展平一层
    let words = vec!["hello world", "foo bar"];
    let all_words: Vec&lt;&amp;str&gt; = words.iter()
        .flat_map(|s| s.split_whitespace())
        .collect();
    println!("{:?}", all_words); // ["hello", "world", "foo", "bar"]
}</code></pre></div>
<h2 id="综合示例链式流水线">综合示例：链式流水线</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20sentences%20%3D%20vec!%5B%0A%20%20%20%20%20%20%20%20%22rust%20is%20fast%22%2C%0A%20%20%20%20%20%20%20%20%22rust%20is%20safe%22%2C%0A%20%20%20%20%20%20%20%20%22go%20is%20fast%22%2C%0A%20%20%20%20%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E6%89%BE%E5%87%BA%E6%89%80%E6%9C%89%E5%8C%85%E5%90%AB%20%22rust%22%20%E7%9A%84%E5%8F%A5%E5%AD%90%E4%B8%AD%E7%9A%84%E5%8D%95%E8%AF%8D%EF%BC%8C%E5%8E%BB%E9%87%8D%E5%90%8E%E6%8C%89%E5%AD%97%E6%AF%8D%E6%8E%92%E5%BA%8F%0A%20%20%20%20let%20mut%20words%3A%20Vec%3C%26str%3E%20%3D%20sentences.iter()%0A%20%20%20%20%20%20%20%20.filter(%7Cs%7C%20s.contains(%22rust%22))%0A%20%20%20%20%20%20%20%20.flat_map(%7Cs%7C%20s.split_whitespace())%0A%20%20%20%20%20%20%20%20.collect()%3B%0A%0A%20%20%20%20words.sort()%3B%0A%20%20%20%20words.dedup()%3B%20%2F%2F%20%E5%8E%BB%E9%87%8D%EF%BC%88%E8%A6%81%E6%B1%82%E5%B7%B2%E6%8E%92%E5%BA%8F%EF%BC%89%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20words)%3B%20%2F%2F%20%5B%22fast%22%2C%20%22is%22%2C%20%22rust%22%2C%20%22safe%22%5D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let sentences = vec![
        "rust is fast",
        "rust is safe",
        "go is fast",
    ];

    // 找出所有包含 "rust" 的句子中的单词，去重后按字母排序
    let mut words: Vec&lt;&amp;str&gt; = sentences.iter()
        .filter(|s| s.contains("rust"))
        .flat_map(|s| s.split_whitespace())
        .collect();

    words.sort();
    words.dedup(); // 去重（要求已排序）
    println!("{:?}", words); // ["fast", "is", "rust", "safe"]
}</code></pre></div>
<h1 id="练习题">练习题</h1>
<h2 id="两类适配器辨别">两类适配器辨别</h2>
</div>
<pre><code class="language-rust">let v = vec![1, 2, 3];
v.iter().map(|x| x * 2);</code></pre>
</div>
<h2 id="消费适配器测验">消费适配器测验</h2>
</div>
<pre><code class="language-rust">let v = vec![1, 3, 5, 6, 7];
let result = v.iter().find(|&amp;&amp;x| x % 2 == 0);</code></pre>
</div>
</div>
<h2 id="迭代器适配器测验">迭代器适配器测验</h2>
</div>
<pre><code class="language-rust">let a = vec![1, 2, 3];
let b = vec!["a", "b"];
let result: Vec&lt;_&gt; = a.iter().zip(b.iter()).collect();</code></pre>
</div>
<h2 id="编程练习">编程练习</h2>
<p>给定一段逗号分隔的分数字符串，解析为数字，过滤掉 60 分以下的，对合格分数乘以 1.1（取整），最后求加权后的平均分（保留一位小数）。</p>
<div class="code-editor" data-block-id="12-closures-iterators/04-adaptors#3:7" data-expect-mode="literal" data-expect-pattern="%E5%8A%A0%E6%9D%83%E5%88%86%3A%20%5B79%2C%2096%2C%20100%2C%2069%2C%2083%5D%0A%E5%B9%B3%E5%9D%87%E5%88%86%3A%2085.4" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20input%20%3D%20%2245%2C72%2C88%2C55%2C91%2C63%2C38%2C76%22%3B%0A%0A%20%20%20%20%2F%2F%20TODO%3A%0A%20%20%20%20%2F%2F%201.%20%E7%94%A8%20split('%2C')%20%E5%88%86%E5%89%B2%E5%AD%97%E7%AC%A6%E4%B8%B2%0A%20%20%20%20%2F%2F%202.%20%E7%94%A8%20filter_map%20%E8%A7%A3%E6%9E%90%E4%B8%BA%20u32%EF%BC%88%E8%A7%A3%E6%9E%90%E5%A4%B1%E8%B4%A5%E7%9A%84%E8%B7%B3%E8%BF%87%EF%BC%89%0A%20%20%20%20%2F%2F%203.%20%E8%BF%87%E6%BB%A4%E6%8E%89%20%3C%2060%20%E7%9A%84%0A%20%20%20%20%2F%2F%204.%20%E6%AF%8F%E4%B8%AA%E4%B9%98%E4%BB%A5%201.1%20%E5%90%8E%E5%8F%96%E6%95%B4%EF%BC%88(x%20as%20f64%20*%201.1)%20as%20u32%EF%BC%89%0A%20%20%20%20%2F%2F%205.%20%E6%94%B6%E9%9B%86%E4%B8%BA%20Vec%3Cu32%3E%EF%BC%8C%E7%84%B6%E5%90%8E%E8%AE%A1%E7%AE%97%E5%B9%B3%E5%9D%87%E5%88%86%0A%20%20%20%20let%20adjusted%3A%20Vec%3Cu32%3E%20%3D%20todo!()%3B%0A%0A%20%20%20%20let%20avg%20%3D%20adjusted.iter().sum%3A%3A%3Cu32%3E()%20as%20f64%20%2F%20adjusted.len()%20as%20f64%3B%0A%20%20%20%20println!(%22%E5%8A%A0%E6%9D%83%E5%88%86%3A%20%7B%3A%3F%7D%22%2C%20adjusted)%3B%0A%20%20%20%20println!(%22%E5%B9%B3%E5%9D%87%E5%88%86%3A%20%7B%3A.1%7D%22%2C%20avg)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    let input = "45,72,88,55,91,63,38,76";

    // TODO:
    // 1. 用 split(',') 分割字符串
    // 2. 用 filter_map 解析为 u32（解析失败的跳过）
    // 3. 过滤掉 &lt; 60 的
    // 4. 每个乘以 1.1 后取整（(x as f64 * 1.1) as u32）
    // 5. 收集为 Vec&lt;u32&gt;，然后计算平均分
    let adjusted: Vec&lt;u32&gt; = todo!();

    let avg = adjusted.iter().sum::&lt;u32&gt;() as f64 / adjusted.len() as f64;
    println!("加权分: {:?}", adjusted);
    println!("平均分: {:.1}", avg);
}</code></pre></div> 