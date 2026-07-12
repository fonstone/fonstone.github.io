---
title: "迭代器基础"
description: "闭包与迭代器 - 迭代器基础"
date: "2026-07-12"
order: 12003
tags: ["迭代器", "Iterator", "next", "iter", "into_iter", "惰性求值", "自定义迭代器"]
est_time: "40 分钟"
---

 <h1 id="迭代器是什么">迭代器是什么</h1>
<p>迭代器（iterator）是一种<strong>按需逐个产生值</strong>的机制。你可以把它想象成一条传送带：上面放着待处理的货物，但传送带只有在你喊”下一个”时才会动一格——这就是 Rust 迭代器的核心特征：<strong>惰性求值</strong>（lazy evaluation）。</p>
<h2 id="惰性求值不问不动">惰性求值：不问不动</h2>
<p>创建迭代器本身<strong>不会做任何计算</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v1%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%20%20%20%20let%20v1_iter%20%3D%20v1.iter()%3B%20%2F%2F%20%E5%8F%AA%E6%98%AF%E5%88%9B%E5%BB%BA%E4%BA%86%E8%BF%AD%E4%BB%A3%E5%99%A8%EF%BC%8C%E4%BB%80%E4%B9%88%E9%83%BD%E6%B2%A1%E5%8F%91%E7%94%9F%0A%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E6%9C%89%E7%94%A8%E5%88%B0%E6%97%B6%E6%89%8D%E7%9C%9F%E6%AD%A3%E6%89%A7%E8%A1%8C%0A%20%20%20%20for%20val%20in%20v1_iter%20%7B%0A%20%20%20%20%20%20%20%20println!(%22Got%3A%20%7B%7D%22%2C%20val)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v1 = vec![1, 2, 3];
    let v1_iter = v1.iter(); // 只是创建了迭代器，什么都没发生

    // 只有用到时才真正执行
    for val in v1_iter {
        println!("Got: {}", val);
    }
}</code></pre></div>
<p>这和 Python 的 <code>range</code> 类似——<code>range(1_000_000)</code> 不会立刻创建百万个数，只是记录了”从 0 数到 999999”的指令，Rust 迭代器也是同样的道理。</p>
<h2 id="iterinto_iteriter_mut-的区别">iter、into_iter、iter_mut 的区别</h2>
<p>同一个集合可以用三种方式创建迭代器，区别在于<strong>所有权和可变性</strong>：</p>
<table><thead><tr><th>方法</th><th>产生值的类型</th><th>原集合之后</th></tr></thead><tbody><tr><td><code>iter()</code></td><td><code>&amp;T</code>（不可变引用）</td><td>仍可使用</td></tr><tr><td><code>into_iter()</code></td><td><code>T</code>（拥有所有权）</td><td>被消耗，不可再用</td></tr><tr><td><code>iter_mut()</code></td><td><code>&amp;mut T</code>（可变引用）</td><td>仍可使用（但期间独占）</td></tr></tbody></table>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5BString%3A%3Afrom(%22hello%22)%2C%20String%3A%3Afrom(%22world%22)%5D%3B%0A%0A%20%20%20%20%2F%2F%20iter()%EF%BC%9A%E5%80%9F%E7%94%A8%EF%BC%8C%E4%B8%8D%E6%B6%88%E8%80%97%20v%0A%20%20%20%20for%20s%20in%20v.iter()%20%7B%0A%20%20%20%20%20%20%20%20print!(%22%7B%7D%20%22%2C%20s)%3B%20%2F%2F%20s%20%E6%98%AF%20%26String%0A%20%20%20%20%7D%0A%20%20%20%20println!()%3B%0A%20%20%20%20println!(%22v%20%E4%BB%8D%E7%84%B6%E6%9C%89%E6%95%88%3A%20%7B%3A%3F%7D%22%2C%20v)%3B%20%2F%2F%20v%20%E5%8F%AF%E4%BB%A5%E7%BB%A7%E7%BB%AD%E7%94%A8%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![String::from("hello"), String::from("world")];

    // iter()：借用，不消耗 v
    for s in v.iter() {
        print!("{} ", s); // s 是 &amp;String
    }
    println!();
    println!("v 仍然有效: {:?}", v); // v 可以继续用
}</code></pre></div>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20%2F%2F%20iter_mut()%EF%BC%9A%E5%8F%AF%E5%8F%98%E5%80%9F%E7%94%A8%EF%BC%8C%E5%8F%AF%E4%BB%A5%E4%BF%AE%E6%94%B9%E5%85%83%E7%B4%A0%0A%20%20%20%20for%20x%20in%20v.iter_mut()%20%7B%0A%20%20%20%20%20%20%20%20*x%20*%3D%202%3B%20%2F%2F%20%E8%A7%A3%E5%BC%95%E7%94%A8%E5%90%8E%E4%BF%AE%E6%94%B9%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20v)%3B%20%2F%2F%20%5B2%2C%204%2C%206%5D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![1, 2, 3];

    // iter_mut()：可变借用，可以修改元素
    for x in v.iter_mut() {
        *x *= 2; // 解引用后修改
    }
    println!("{:?}", v); // [2, 4, 6]
}</code></pre></div>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5BString%3A%3Afrom(%22hello%22)%2C%20String%3A%3Afrom(%22world%22)%5D%3B%0A%0A%20%20%20%20%2F%2F%20into_iter()%EF%BC%9A%E8%BD%AC%E7%A7%BB%E6%89%80%E6%9C%89%E6%9D%83%EF%BC%8Cv%20%E4%B9%8B%E5%90%8E%E4%B8%8D%E5%8F%AF%E5%86%8D%E7%94%A8%0A%20%20%20%20for%20s%20in%20v.into_iter()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20v)%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81v%20%E5%B7%B2%E8%A2%AB%E6%B6%88%E8%80%97%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let v = vec![String::from("hello"), String::from("world")];

    // into_iter()：转移所有权，v 之后不可再用
    for s in v.into_iter() {
        println!("{}", s);
    }

    println!("{:?}", v); // 错误！v 已被消耗
}</code></pre></div>
<blockquote>
<p><strong>经验法则</strong>：只需读取用 <code>iter()</code>；需要修改用 <code>iter_mut()</code>；需要把元素所有权传出去用 <code>into_iter()</code>。</p>
</blockquote>
<h2 id="iterator-trait-与-next">Iterator Trait 与 next</h2>
<h3 id="iterator-trait-的定义">Iterator trait 的定义</h3>
<p>所有迭代器都实现了标准库中的 <code>Iterator</code> trait，它的核心长这样：</p>
<pre><code class="language-rust">pub trait Iterator {
    type Item; // 这个迭代器产生什么类型的值

    fn next(&amp;mut self) -&gt; Option&lt;Self::Item&gt;; // 唯一必须实现的方法

    // 以下数十个方法都有默认实现，只要实现了 next 就全部免费获得
    // fn map(...) { ... }
    // fn filter(...) { ... }
    // fn sum(...) { ... }
    // ...
}</code></pre>
<p><code>type Item</code> 叫做<strong>关联类型</strong>，声明了”这个迭代器产出什么类型的值”。<code>next</code> 方法是唯一必须自己实现的，其余几十个方法都基于 <code>next</code> 有默认实现。</p>
<p><code>next</code> 每次调用返回：</p>
<ul>
<li><code>Some(value)</code> — 下一个值</li>
<li><code>None</code> — 迭代结束</li>
</ul>
<h3 id="直接调用-next">直接调用 next</h3>
<p><code>for</code> 循环其实就是在反复调用 <code>next</code>，只是语法糖让它看起来更简洁：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B10%2C%2020%2C%2030%5D%3B%0A%20%20%20%20let%20mut%20iter%20%3D%20v.iter()%3B%20%2F%2F%20%E7%9B%B4%E6%8E%A5%E8%B0%83%E7%94%A8%20next%20%E9%9C%80%E8%A6%81%20mut%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20iter.next())%3B%20%2F%2F%20Some(%2610)%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20iter.next())%3B%20%2F%2F%20Some(%2620)%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20iter.next())%3B%20%2F%2F%20Some(%2630)%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20iter.next())%3B%20%2F%2F%20None%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20iter.next())%3B%20%2F%2F%20None%EF%BC%88%E7%BB%A7%E7%BB%AD%E8%B0%83%E7%94%A8%E4%BB%8D%E6%98%AF%20None%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![10, 20, 30];
    let mut iter = v.iter(); // 直接调用 next 需要 mut

    println!("{:?}", iter.next()); // Some(&amp;10)
    println!("{:?}", iter.next()); // Some(&amp;20)
    println!("{:?}", iter.next()); // Some(&amp;30)
    println!("{:?}", iter.next()); // None
    println!("{:?}", iter.next()); // None（继续调用仍是 None）
}</code></pre></div>
<blockquote>
<p><strong>为什么需要 <code>mut</code>？</strong> 每次调用 <code>next</code> 都会推进迭代器内部的”游标”位置——这是对迭代器自身状态的修改。<code>for</code> 循环会拿走迭代器的所有权并在背后把它设为可变，所以你不用手动写 <code>mut</code>。</p>
</blockquote>
<h1 id="自定义迭代器">自定义迭代器</h1>
<h2 id="只需实现-next">只需实现 next</h2>
<p>任何结构体，只要为它实现了 <code>Iterator</code> trait 的 <code>next</code> 方法，就成了一个迭代器。来创建一个从 1 数到 5 的计数器：</p>
<blockquote>
<p><strong>关于 <code>type Item</code></strong>：代码里的 <code>type Item = u32;</code> 用到了<strong>关联类型</strong>（associated type）这个特性，<a href="/RustCourse/chapters/22-advanced/01-associated-types">高级特性：关联类型</a>一节会专门讲解它。现在只需要把它理解成”告诉编译器这个迭代器产出什么类型的值”——照着写就行，不需要深究语法原理。</p>
</blockquote>
<div class="code-runner" data-full-code="struct%20Counter%20%7B%0A%20%20%20%20count%3A%20u32%2C%0A%7D%0A%0Aimpl%20Counter%20%7B%0A%20%20%20%20fn%20new()%20-%3E%20Counter%20%7B%0A%20%20%20%20%20%20%20%20Counter%20%7B%20count%3A%200%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Aimpl%20Iterator%20for%20Counter%20%7B%0A%20%20%20%20type%20Item%20%3D%20u32%3B%20%2F%2F%20%E5%A3%B0%E6%98%8E%E8%BF%99%E4%B8%AA%E8%BF%AD%E4%BB%A3%E5%99%A8%E4%BA%A7%E5%87%BA%20u32%20%E5%80%BC%EF%BC%88%E5%85%B3%E8%81%94%E7%B1%BB%E5%9E%8B%EF%BC%8C%E5%90%8E%E7%BB%AD%E7%AB%A0%E8%8A%82%E4%BC%9A%E8%AE%B2%EF%BC%89%0A%0A%20%20%20%20fn%20next(%26mut%20self)%20-%3E%20Option%3CSelf%3A%3AItem%3E%20%7B%0A%20%20%20%20%20%20%20%20self.count%20%2B%3D%201%3B%0A%20%20%20%20%20%20%20%20if%20self.count%20%3C%3D%205%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Some(self.count)%0A%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20None%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E7%94%A8%20for%20%E5%BE%AA%E7%8E%AF%0A%20%20%20%20for%20n%20in%20Counter%3A%3Anew()%20%7B%0A%20%20%20%20%20%20%20%20print!(%22%7B%7D%20%22%2C%20n)%3B%0A%20%20%20%20%7D%0A%20%20%20%20println!()%3B%20%2F%2F%201%202%203%204%205%0A%0A%20%20%20%20%2F%2F%20%E4%B9%9F%E5%8F%AF%E4%BB%A5%E7%9B%B4%E6%8E%A5%E8%B0%83%E7%94%A8%20next%0A%20%20%20%20let%20mut%20c%20%3D%20Counter%3A%3Anew()%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20c.next())%3B%20%2F%2F%20Some(1)%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20c.next())%3B%20%2F%2F%20Some(2)%0A%7D" data-mode="run"><pre><code class="language-rust">struct Counter {
    count: u32,
}

impl Counter {
    fn new() -&gt; Counter {
        Counter { count: 0 }
    }
}

impl Iterator for Counter {
    type Item = u32; // 声明这个迭代器产出 u32 值（关联类型，后续章节会讲）

    fn next(&amp;mut self) -&gt; Option&lt;Self::Item&gt; {
        self.count += 1;
        if self.count &lt;= 5 {
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    // 可以用 for 循环
    for n in Counter::new() {
        print!("{} ", n);
    }
    println!(); // 1 2 3 4 5

    // 也可以直接调用 next
    let mut c = Counter::new();
    println!("{:?}", c.next()); // Some(1)
    println!("{:?}", c.next()); // Some(2)
}</code></pre></div>
<h2 id="免费获得的其他方法">免费获得的其他方法</h2>
<p>只要实现了 <code>next</code>，<code>Iterator</code> trait 上几十个有默认实现的方法就全部可以使用——不需要再写任何代码：</p>
<div class="code-runner" data-full-code="struct%20Counter%20%7B%0A%20%20%20%20count%3A%20u32%2C%0A%7D%0A%0Aimpl%20Counter%20%7B%0A%20%20%20%20fn%20new()%20-%3E%20Counter%20%7B%20Counter%20%7B%20count%3A%200%20%7D%20%7D%0A%7D%0A%0Aimpl%20Iterator%20for%20Counter%20%7B%0A%20%20%20%20type%20Item%20%3D%20u32%3B%0A%20%20%20%20fn%20next(%26mut%20self)%20-%3E%20Option%3CSelf%3A%3AItem%3E%20%7B%0A%20%20%20%20%20%20%20%20self.count%20%2B%3D%201%3B%0A%20%20%20%20%20%20%20%20if%20self.count%20%3C%3D%205%20%7B%20Some(self.count)%20%7D%20else%20%7B%20None%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20sum%EF%BC%9A%E6%B1%82%E5%92%8C%EF%BC%88%E5%8F%AA%E5%AE%9E%E7%8E%B0%E4%BA%86%20next%EF%BC%8Csum%20%E6%98%AF%E5%85%8D%E8%B4%B9%E7%9A%84%EF%BC%89%0A%20%20%20%20let%20total%3A%20u32%20%3D%20Counter%3A%3Anew().sum()%3B%0A%20%20%20%20println!(%221%2B2%2B3%2B4%2B5%20%3D%20%7B%7D%22%2C%20total)%3B%20%2F%2F%2015%0A%0A%20%20%20%20%2F%2F%20%E9%93%BE%E5%BC%8F%E7%BB%84%E5%90%88%EF%BC%9A%0A%20%20%20%20%2F%2F%20Counter%3A%3Anew()%20%20%20%20%20%20%20%20%20%E2%86%92%201%2C2%2C3%2C4%2C5%0A%20%20%20%20%2F%2F%20.zip(skip(1))%20%20%20%20%20%20%20%20%20%20%E2%86%92%20(1%2C2)%2C(2%2C3)%2C(3%2C4)%2C(4%2C5)%0A%20%20%20%20%2F%2F%20.map(%7C(a%2Cb)%7C%20a*b)%20%20%20%20%20%20%E2%86%92%202%2C6%2C12%2C20%0A%20%20%20%20%2F%2F%20.filter(%7Cx%7C%20x%253%3D%3D0)%20%20%20%E2%86%92%206%2C12%0A%20%20%20%20%2F%2F%20.sum()%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%E2%86%92%2018%0A%20%20%20%20let%20result%3A%20u32%20%3D%20Counter%3A%3Anew()%0A%20%20%20%20%20%20%20%20.zip(Counter%3A%3Anew().skip(1))%0A%20%20%20%20%20%20%20%20.map(%7C(a%2C%20b)%7C%20a%20*%20b)%0A%20%20%20%20%20%20%20%20.filter(%7Cx%7C%20x%20%25%203%20%3D%3D%200)%0A%20%20%20%20%20%20%20%20.sum()%3B%0A%20%20%20%20println!(%22%E7%BB%93%E6%9E%9C%3A%20%7B%7D%22%2C%20result)%3B%20%2F%2F%2018%0A%7D" data-mode="run"><pre><code class="language-rust">struct Counter {
    count: u32,
}

impl Counter {
    fn new() -&gt; Counter { Counter { count: 0 } }
}

impl Iterator for Counter {
    type Item = u32;
    fn next(&amp;mut self) -&gt; Option&lt;Self::Item&gt; {
        self.count += 1;
        if self.count &lt;= 5 { Some(self.count) } else { None }
    }
}

fn main() {
    // sum：求和（只实现了 next，sum 是免费的）
    let total: u32 = Counter::new().sum();
    println!("1+2+3+4+5 = {}", total); // 15

    // 链式组合：
    // Counter::new()         → 1,2,3,4,5
    // .zip(skip(1))          → (1,2),(2,3),(3,4),(4,5)
    // .map(|(a,b)| a*b)      → 2,6,12,20
    // .filter(|x| x%3==0)   → 6,12
    // .sum()                 → 18
    let result: u32 = Counter::new()
        .zip(Counter::new().skip(1))
        .map(|(a, b)| a * b)
        .filter(|x| x % 3 == 0)
        .sum();
    println!("结果: {}", result); // 18
}</code></pre></div>
<p>这就是”只需实现 <code>next</code>，其余全部免费”的威力。它也体现了 Rust trait 系统的核心设计哲学：最小接口 + 大量基于它的默认实现。</p>
<h1 id="零开销抽象">零开销抽象</h1>
<h2 id="迭代器-vs-for-循环谁更快">迭代器 vs for 循环：谁更快？</h2>
<p>初次接触迭代器时，很多人会担心：<code>map</code>、<code>filter</code> 这些高级方法会不会有额外开销？毕竟它们比手写 <code>for</code> 循环看起来”高级”多了。</p>
<p>答案是：<strong>不会</strong>。Rust 针对这个问题专门做了一个基准测试，搜索阿瑟·柯南·道尔”福尔摩斯探案集”全文中的某个单词：</p>
<pre><code class="language-text">test bench_search_for  ... bench:  19,620,300 ns/iter (+/- 915,700)
test bench_search_iter ... bench:  19,234,900 ns/iter (+/- 657,200)</code></pre>
<p>迭代器版本不仅没有更慢，反而<strong>略快一点</strong>。</p>
<h2 id="零开销抽象是什么">零开销抽象是什么</h2>
<p>这背后的原因是 Rust 的<strong>零开销抽象</strong>（zero-cost abstraction）原则。这个词借自 C++ 之父本贾尼·斯特劳斯特卢普：</p>
<blockquote>
<p>从整体来说，C++ 的实现遵循了零开销原则：你不需要的，无需为它买单。更进一步：你需要的，也不可能找到更好的手写代码了。</p>
</blockquote>
<p>Rust 把这个原则贯彻得更彻底。迭代器是一个<strong>编译时抽象</strong>——当你写 <code>v.iter().map(...).filter(...).sum()</code> 时，编译器看到的不是”调用了三个函数”，而是一整块可以整体优化的代码。最终生成的机器码与你手写的最优循环几乎一模一样。</p>
<p>理解零开销抽象的关键是区分<strong>运行时抽象</strong>和<strong>编译时抽象</strong>：</p>
<table><thead><tr><th>类型</th><th>例子</th><th>运行时开销</th></tr></thead><tbody><tr><td>运行时抽象</td><td>虚函数、动态派发（<code>dyn Trait</code>）</td><td>有（查 vtable）</td></tr><tr><td>编译时抽象</td><td>泛型、迭代器、闭包</td><td>无（编译期单态化）</td></tr></tbody></table>
<p><code>Iterator</code> trait 的方法是<strong>泛型的</strong>——每种具体迭代器类型会在编译期生成专属的代码，不存在”通过指针间接调用”的运行时开销。</p>
<h2 id="编译器如何做到循环展开">编译器如何做到：循环展开</h2>
<p>来看一个来自音频解码器的真实例子。这段代码使用线性预测算法，用迭代器链对三个变量做数学运算：</p>
<pre><code class="language-rust"># let mut buffer = [0i32; 16];
# let coefficients = [1i64; 12];
# let qlp_shift: i16 = 1;
for i in 12..buffer.len() {
    let prediction = coefficients.iter()
        .zip(&amp;buffer[i - 12..i])
        .map(|(&amp;c, &amp;s)| c * s as i64)
        .sum::&lt;i64&gt;() &gt;&gt; qlp_shift;
    let delta = buffer[i];
    buffer[i] = prediction as i32 + delta;
}</code></pre>
<p>因为 <code>coefficients</code> 的长度固定是 12，Rust 编译器<strong>知道这个迭代只会执行 12 次</strong>。它不会生成带循环控制逻辑（比较、跳转）的循环，而是直接把 12 次迭代<strong>展开</strong>（loop unrolling）成 12 段直线代码——消除了循环开销，让所有系数直接存进寄存器，也不需要运行时边界检查。</p>
<p>结果：迭代器链被编译成了<strong>与手写汇编等价</strong>的代码。</p>
<h2 id="应该用迭代器还是-for-循环">应该用迭代器还是 for 循环？</h2>
<p><strong>性能上没有区别</strong>，选择取决于可读性：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%2C%206%2C%207%2C%208%2C%209%2C%2010%5D%3B%0A%0A%20%20%20%20%2F%2F%20for%20%E5%BE%AA%E7%8E%AF%E7%89%88%E6%9C%AC%0A%20%20%20%20let%20mut%20sum%20%3D%200%3B%0A%20%20%20%20for%20%26x%20in%20%26v%20%7B%0A%20%20%20%20%20%20%20%20if%20x%20%25%202%20%3D%3D%200%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20sum%20%2B%3D%20x%20*%20x%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22for%20%E5%BE%AA%E7%8E%AF%3A%20%7B%7D%22%2C%20sum)%3B%0A%0A%20%20%20%20%2F%2F%20%E8%BF%AD%E4%BB%A3%E5%99%A8%E7%89%88%E6%9C%AC%E2%80%94%E2%80%94%E6%84%8F%E5%9B%BE%E6%9B%B4%E6%B8%85%E6%99%B0%EF%BC%9A%22%E8%BF%87%E6%BB%A4%E5%81%B6%E6%95%B0%EF%BC%8C%E5%B9%B3%E6%96%B9%EF%BC%8C%E6%B1%82%E5%92%8C%22%0A%20%20%20%20let%20sum2%3A%20i32%20%3D%20v.iter()%0A%20%20%20%20%20%20%20%20.filter(%7C%26%26x%7C%20x%20%25%202%20%3D%3D%200)%0A%20%20%20%20%20%20%20%20.map(%7C%26x%7C%20x%20*%20x)%0A%20%20%20%20%20%20%20%20.sum()%3B%0A%20%20%20%20println!(%22%E8%BF%AD%E4%BB%A3%E5%99%A8%3A%20%7B%7D%22%2C%20sum2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // for 循环版本
    let mut sum = 0;
    for &amp;x in &amp;v {
        if x % 2 == 0 {
            sum += x * x;
        }
    }
    println!("for 循环: {}", sum);

    // 迭代器版本——意图更清晰："过滤偶数，平方，求和"
    let sum2: i32 = v.iter()
        .filter(|&amp;&amp;x| x % 2 == 0)
        .map(|&amp;x| x * x)
        .sum();
    println!("迭代器: {}", sum2);
}</code></pre></div>
<blockquote>
<p>对于需要跨步骤共享可变状态的复杂逻辑，<code>for</code> 循环可能更直观。其他情况优先选迭代器——代码更短、意图更清晰，编译器也更容易优化。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="惰性求值与-next-测验">惰性求值与 next 测验</h2>
<pre><code class="language-rust">let v = vec![1, 2, 3];
let mut iter = v.iter();
iter.next();
iter.next();</code></pre>
</div>
</div>
</div>
<h2 id="iterator-trait-实现测验">Iterator trait 实现测验</h2>
<pre><code class="language-rust">struct Counter { count: u32 }

impl Iterator for Counter {
    type Item = u32;
    fn next(&amp;mut self) -&gt; Option&lt;Self::Item&gt; {
        self.count += 1;
        if self.count &lt;= 3 { Some(self.count) } else { None }
    }
}</code></pre>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面是一段简单的”词法分析”：对 token 列表，用 <code>next()</code> 单独取出第一个 token 做特殊处理，剩余的交给 <code>for</code> 循环处理。补全代码使输出符合预期——这道题考查的是 <code>next()</code> 调用会推进迭代器状态，<code>for</code> 接着从”剩余部分”继续的特性。</p>
<div class="code-editor" data-block-id="12-closures-iterators/03-iterators#3:5" data-expect-mode="literal" data-expect-pattern="%E5%85%B3%E9%94%AE%E5%AD%97%3A%20fn%0A%20%20token%3A%20greet%0A%20%20token%3A%20(%0A%20%20token%3A%20name%0A%20%20token%3A%20%3A%0A%20%20token%3A%20String%0A%20%20token%3A%20)%0A%20%20token%3A%20%7B%0A%20%20token%3A%20%7D" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20tokens%20%3D%20vec!%5B%22fn%22%2C%20%22greet%22%2C%20%22(%22%2C%20%22name%22%2C%20%22%3A%22%2C%20%22String%22%2C%20%22)%22%2C%20%22%7B%22%2C%20%22%7D%22%5D%3B%0A%20%20%20%20let%20mut%20iter%20%3D%20tokens.iter()%3B%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E7%94%A8%20next()%20%E5%8F%96%E5%87%BA%E7%AC%AC%E4%B8%80%E4%B8%AA%20token%EF%BC%8C%E6%89%93%E5%8D%B0%E4%B8%BA%20%22%E5%85%B3%E9%94%AE%E5%AD%97%3A%20%3Ctoken%3E%22%0A%20%20%20%20%2F%2F%20%E7%84%B6%E5%90%8E%E7%94%A8%20for%20%E5%BE%AA%E7%8E%AF%E6%89%93%E5%8D%B0%E5%89%A9%E4%BD%99%20token%EF%BC%8C%E6%AF%8F%E4%B8%AA%E6%89%93%E5%8D%B0%E4%B8%BA%20%22%20%20token%3A%20%3Ctoken%3E%22%0A%0A%7D"><pre><code class="language-rust">fn main() {
    let tokens = vec!["fn", "greet", "(", "name", ":", "String", ")", "{", "}"];
    let mut iter = tokens.iter();

    // TODO: 用 next() 取出第一个 token，打印为 "关键字: &lt;token&gt;"
    // 然后用 for 循环打印剩余 token，每个打印为 "  token: &lt;token&gt;"

}</code></pre></div> 