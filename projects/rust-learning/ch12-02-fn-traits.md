---
title: "Fn trait 与闭包的高阶用法"
description: "闭包与迭代器 - Fn trait 与闭包的高阶用法"
date: "2026-07-12"
order: 12002
tags: ["Fn", "FnMut", "FnOnce", "闭包参数", "impl Fn", "高阶函数"]
est_time: "20 分钟"
---

 <h1 id="fn--fnmut--fnonce">Fn / FnMut / FnOnce</h1>
<h2 id="为什么有三个-trait">为什么有三个 trait</h2>
<p>上一篇我们看到闭包可以通过三种方式捕获变量：不可变引用、可变引用、所有权转移。这三种方式对应了三个 trait，它们描述的是<strong>闭包能被怎样调用</strong>：</p>
<table><thead><tr><th>Trait</th><th>调用方式</th><th>对应捕获方式</th><th>能调用几次</th></tr></thead><tbody><tr><td><code>Fn</code></td><td>不可变引用调用</td><td><code>&amp;T</code> 捕获</td><td>任意多次</td></tr><tr><td><code>FnMut</code></td><td>可变引用调用</td><td><code>&amp;mut T</code> 捕获</td><td>任意多次（但需要 <code>mut</code>）</td></tr><tr><td><code>FnOnce</code></td><td>消费调用</td><td><code>T</code> 捕获（移动）</td><td>只能一次</td></tr></tbody></table>
<p>三者之间有继承关系：<strong><code>Fn</code> 是最严格的子集，<code>FnOnce</code> 是最宽松的</strong>。</p>
<pre><code class="language-plaintext">FnOnce（所有闭包都实现）
  └── FnMut（不消耗所有权的闭包实现）
        └── Fn（只读访问的闭包实现）</code></pre>
<p>即：<code>Fn</code> 的闭包一定实现了 <code>FnMut</code> 和 <code>FnOnce</code>；<code>FnMut</code> 的闭包一定实现了 <code>FnOnce</code>。</p>
<h2 id="编译器自动推断">编译器自动推断</h2>
<p>你不需要手动声明闭包实现哪个 trait——编译器根据闭包体里的行为自动决定：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E8%AF%BB%E5%8F%96%20x%20%E2%86%92%20%E5%AE%9E%E7%8E%B0%20Fn%20%2B%20FnMut%20%2B%20FnOnce%0A%20%20%20%20let%20read_only%20%3D%20%7C%7C%20println!(%22%7B%7D%22%2C%20x)%3B%0A%20%20%20%20read_only()%3B%0A%20%20%20%20read_only()%3B%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E5%A4%9A%E6%AC%A1%E8%B0%83%E7%94%A8%0A%0A%20%20%20%20let%20mut%20count%20%3D%200%3B%0A%20%20%20%20%2F%2F%20%E4%BF%AE%E6%94%B9%20count%20%E2%86%92%20%E5%AE%9E%E7%8E%B0%20FnMut%20%2B%20FnOnce%EF%BC%88%E4%B8%8D%E5%AE%9E%E7%8E%B0%20Fn%EF%BC%89%0A%20%20%20%20let%20mut%20mutating%20%3D%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20count%20%2B%3D%201%3B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20count)%3B%0A%20%20%20%20%7D%3B%0A%20%20%20%20mutating()%3B%0A%20%20%20%20mutating()%3B%20%2F%2F%20FnMut%20%E5%8F%AF%E4%BB%A5%E5%A4%9A%E6%AC%A1%E8%B0%83%E7%94%A8%0A%0A%20%20%20%20let%20name%20%3D%20String%3A%3Afrom(%22Alice%22)%3B%0A%20%20%20%20%2F%2F%20%E6%B6%88%E8%B4%B9%20name%20%E2%86%92%20%E5%8F%AA%E5%AE%9E%E7%8E%B0%20FnOnce%0A%20%20%20%20let%20consuming%20%3D%20%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20let%20_n%20%3D%20name%3B%20%2F%2F%20%E7%A7%BB%E5%8A%A8%E4%BA%86%20name%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%0A%20%20%20%20%7D%3B%0A%20%20%20%20consuming()%3B%0A%20%20%20%20%2F%2F%20consuming()%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81FnOnce%20%E5%8F%AA%E8%83%BD%E8%B0%83%E4%B8%80%E6%AC%A1%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 5;
    // 只读取 x → 实现 Fn + FnMut + FnOnce
    let read_only = || println!("{}", x);
    read_only();
    read_only(); // 可以多次调用

    let mut count = 0;
    // 修改 count → 实现 FnMut + FnOnce（不实现 Fn）
    let mut mutating = || {
        count += 1;
        println!("{}", count);
    };
    mutating();
    mutating(); // FnMut 可以多次调用

    let name = String::from("Alice");
    // 消费 name → 只实现 FnOnce
    let consuming = || {
        let _n = name; // 移动了 name 的所有权
    };
    consuming();
    // consuming(); // 错误！FnOnce 只能调一次
}</code></pre></div>
<h1 id="闭包作为参数">闭包作为参数</h1>
<h2 id="用-impl-fn-接受闭包">用 impl Fn 接受闭包</h2>
<p>当函数需要接受一个闭包参数时，用 <code>impl Fn</code>/<code>impl FnMut</code>/<code>impl FnOnce</code> 作为类型：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E6%8E%A5%E5%8F%97%E4%BB%BB%E4%BD%95%20i32%20-%3E%20i32%20%E7%9A%84%E9%97%AD%E5%8C%85%EF%BC%8C%E5%AF%B9%203%20%E8%B0%83%E7%94%A8%E5%AE%83%EF%BC%88%E5%8F%AA%E8%B0%83%E4%B8%80%E6%AC%A1%EF%BC%8C%E7%94%A8%20Fn%20%E5%8D%B3%E5%8F%AF%EF%BC%89%0Afn%20apply_to_3(f%3A%20impl%20Fn(i32)%20-%3E%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20f(3)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20double%20%3D%20%7Cx%7C%20x%20*%202%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20apply_to_3(double))%3B%20%2F%2F%206%0A%0A%20%20%20%20let%20add_one%20%3D%20%7Cx%7C%20x%20%2B%201%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20apply_to_3(add_one))%3B%20%2F%2F%204%0A%7D" data-mode="run"><pre><code class="language-rust">// 接受任何 i32 -&gt; i32 的闭包，对 3 调用它（只调一次，用 Fn 即可）
fn apply_to_3(f: impl Fn(i32) -&gt; i32) -&gt; i32 {
    f(3)
}

fn main() {
    let double = |x| x * 2;
    println!("{}", apply_to_3(double)); // 6

    let add_one = |x| x + 1;
    println!("{}", apply_to_3(add_one)); // 4
}</code></pre></div>
<p><strong><code>FnMut</code>：需要多次调用且闭包有副作用</strong></p>
<p>当函数要多次调用闭包，且闭包可能修改捕获的变量时，参数类型要用 <code>FnMut</code>：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E5%AF%B9%E5%88%97%E8%A1%A8%E7%9A%84%E6%AF%8F%E4%B8%80%E9%A1%B9%E8%B0%83%E7%94%A8%20f%E2%80%94%E2%80%94f%20%E4%BC%9A%E8%A2%AB%E8%B0%83%E7%94%A8%E5%A4%9A%E6%AC%A1%EF%BC%8C%E4%B8%94%E5%8F%AF%E8%83%BD%E6%9C%89%E5%89%AF%E4%BD%9C%E7%94%A8%0Afn%20for_each(items%3A%20%26%5Bi32%5D%2C%20mut%20f%3A%20impl%20FnMut(i32))%20%7B%0A%20%20%20%20for%20%26x%20in%20items%20%7B%0A%20%20%20%20%20%20%20%20f(x)%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20sum%20%3D%200%3B%0A%20%20%20%20%2F%2F%20%E9%97%AD%E5%8C%85%E4%BF%AE%E6%94%B9%E4%BA%86%20sum%EF%BC%8C%E6%98%AF%20FnMut%0A%20%20%20%20for_each(%26%5B1%2C%202%2C%203%2C%204%2C%205%5D%2C%20%7Cx%7C%20sum%20%2B%3D%20x)%3B%0A%20%20%20%20println!(%22sum%20%3D%20%7B%7D%22%2C%20sum)%3B%20%2F%2F%2015%0A%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E8%AF%BB%E5%8F%96%E4%B9%9F%E8%83%BD%E4%BC%A0%EF%BC%8C%E5%9B%A0%E4%B8%BA%20Fn%20%E6%98%AF%20FnMut%20%E7%9A%84%E5%AD%90%E9%9B%86%0A%20%20%20%20for_each(%26%5B1%2C%202%2C%203%5D%2C%20%7Cx%7C%20println!(%22%7B%7D%22%2C%20x))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 对列表的每一项调用 f——f 会被调用多次，且可能有副作用
fn for_each(items: &amp;[i32], mut f: impl FnMut(i32)) {
    for &amp;x in items {
        f(x);
    }
}

fn main() {
    let mut sum = 0;
    // 闭包修改了 sum，是 FnMut
    for_each(&amp;[1, 2, 3, 4, 5], |x| sum += x);
    println!("sum = {}", sum); // 15

    // 只读取也能传，因为 Fn 是 FnMut 的子集
    for_each(&amp;[1, 2, 3], |x| println!("{}", x));
}</code></pre></div>
<blockquote>
<p>注意：接受 <code>FnMut</code> 参数时，参数本身需要声明 <code>mut</code>（<code>mut f: impl FnMut()</code>），因为调用它会修改其内部状态。</p>
</blockquote>
<p><strong><code>FnOnce</code>：只需调用一次，接受最广泛</strong></p>
<div class="code-runner" data-full-code="%2F%2F%20%E5%8F%AA%E8%B0%83%E7%94%A8%E4%B8%80%E6%AC%A1%EF%BC%8C%E7%94%A8%20FnOnce%E2%80%94%E2%80%94%E8%BF%9E%E6%B6%88%E8%B4%B9%E5%8F%98%E9%87%8F%E7%9A%84%E9%97%AD%E5%8C%85%E9%83%BD%E8%83%BD%E6%8E%A5%E5%8F%97%0Afn%20call_once(f%3A%20impl%20FnOnce()%20-%3E%20String)%20-%3E%20String%20%7B%0A%20%20%20%20f()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20msg%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20%2F%2F%20%E6%B6%88%E8%B4%B9%E4%BA%86%20msg%20%E7%9A%84%E9%97%AD%E5%8C%85%EF%BC%88FnOnce%EF%BC%89%E4%B9%9F%E8%83%BD%E4%BC%A0%E8%BF%9B%E6%9D%A5%0A%20%20%20%20let%20result%20%3D%20call_once(move%20%7C%7C%20msg.to_uppercase())%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20result)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 只调用一次，用 FnOnce——连消费变量的闭包都能接受
fn call_once(f: impl FnOnce() -&gt; String) -&gt; String {
    f()
}

fn main() {
    let msg = String::from("hello");
    // 消费了 msg 的闭包（FnOnce）也能传进来
    let result = call_once(move || msg.to_uppercase());
    println!("{}", result);
}</code></pre></div>
<h2 id="选哪个-trait">选哪个 trait？</h2>
<p><strong>原则：选限制最少的那个</strong>——这样调用方能传入范围最广的闭包：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E5%A6%82%E6%9E%9C%E5%8F%AA%E9%9C%80%E8%A6%81%E8%B0%83%E7%94%A8%E4%B8%80%E6%AC%A1%EF%BC%8C%E7%94%A8%20FnOnce%EF%BC%88%E6%9C%80%E5%AE%BD%E6%9D%BE%EF%BC%8C%E6%8E%A5%E5%8F%97%E6%89%80%E6%9C%89%E9%97%AD%E5%8C%85%EF%BC%89%0Afn%20run_once(f%3A%20impl%20FnOnce()%20-%3E%20String)%20-%3E%20String%20%7B%0A%20%20%20%20f()%0A%7D%0A%0A%2F%2F%20%E5%A6%82%E6%9E%9C%E9%9C%80%E8%A6%81%E8%B0%83%E7%94%A8%E5%A4%9A%E6%AC%A1%EF%BC%8C%E7%94%A8%20Fn%EF%BC%88%E8%B0%83%E7%94%A8%E6%96%B9%E7%9A%84%E9%97%AD%E5%8C%85%E4%B8%8D%E8%83%BD%E6%9C%89%E5%8F%AF%E5%8F%98%E5%89%AF%E4%BD%9C%E7%94%A8%EF%BC%89%0Afn%20run_twice(f%3A%20impl%20Fn()%20-%3E%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20f()%20%2B%20f()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20msg%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20%2F%2F%20%E6%B6%88%E8%B4%B9%E4%BA%86%20msg%EF%BC%8C%E5%8F%AA%E8%83%BD%E8%B0%83%E4%B8%80%E6%AC%A1%20%E2%86%92%20%E4%BC%A0%E7%BB%99%20FnOnce%20%E6%B2%A1%E9%97%AE%E9%A2%98%0A%20%20%20%20let%20result%20%3D%20run_once(move%20%7C%7C%20msg.to_uppercase())%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20result)%3B%0A%0A%20%20%20%20let%20base%20%3D%2010%3B%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E8%AF%BB%E5%8F%96%20base%EF%BC%8C%E5%8F%AF%E4%BB%A5%E5%A4%9A%E6%AC%A1%E8%B0%83%E7%94%A8%20%E2%86%92%20%E4%BC%A0%E7%BB%99%20Fn%20%E6%B2%A1%E9%97%AE%E9%A2%98%0A%20%20%20%20println!(%22%7B%7D%22%2C%20run_twice(%7C%7C%20base%20%2B%201))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 如果只需要调用一次，用 FnOnce（最宽松，接受所有闭包）
fn run_once(f: impl FnOnce() -&gt; String) -&gt; String {
    f()
}

// 如果需要调用多次，用 Fn（调用方的闭包不能有可变副作用）
fn run_twice(f: impl Fn() -&gt; i32) -&gt; i32 {
    f() + f()
}

fn main() {
    let msg = String::from("hello");
    // 消费了 msg，只能调一次 → 传给 FnOnce 没问题
    let result = run_once(move || msg.to_uppercase());
    println!("{}", result);

    let base = 10;
    // 只读取 base，可以多次调用 → 传给 Fn 没问题
    println!("{}", run_twice(|| base + 1));
}</code></pre></div>
<blockquote>
<p><strong>实践建议：</strong> 不确定用哪个时，从 <code>Fn</code> 开始写。编译器会告诉你是否需要放宽到 <code>FnMut</code> 或 <code>FnOnce</code>。</p>
</blockquote>
<h2 id="也可以用泛型写法">也可以用泛型写法</h2>
<p><code>impl Fn(...)</code> 是 <code>&lt;F: Fn(...)&gt;</code> 的简写，两种写法等价：</p>
<div class="code-runner" data-full-code="%2F%2F%20impl%20Trait%20%E5%86%99%E6%B3%95%EF%BC%88%E6%9B%B4%E7%AE%80%E6%B4%81%EF%BC%89%0Afn%20apply_a(f%3A%20impl%20Fn(i32)%20-%3E%20i32%2C%20x%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20f(x)%0A%7D%0A%0A%2F%2F%20%E6%B3%9B%E5%9E%8B%E5%86%99%E6%B3%95%EF%BC%88%E9%9C%80%E8%A6%81%E5%A4%9A%E6%AC%A1%E7%94%A8%E5%88%B0%E5%90%8C%E4%B8%80%E4%B8%AA%E9%97%AD%E5%8C%85%E7%B1%BB%E5%9E%8B%E6%97%B6%E6%9B%B4%E7%81%B5%E6%B4%BB%EF%BC%89%0Afn%20apply_b%3CF%3A%20Fn(i32)%20-%3E%20i32%3E(f%3A%20F%2C%20x%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20f(x)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20apply_a(%7Cx%7C%20x%20*%203%2C%204))%3B%20%2F%2F%2012%0A%20%20%20%20println!(%22%7B%7D%22%2C%20apply_b(%7Cx%7C%20x%20*%203%2C%204))%3B%20%2F%2F%2012%0A%7D" data-mode="run"><pre><code class="language-rust">// impl Trait 写法（更简洁）
fn apply_a(f: impl Fn(i32) -&gt; i32, x: i32) -&gt; i32 {
    f(x)
}

// 泛型写法（需要多次用到同一个闭包类型时更灵活）
fn apply_b&lt;F: Fn(i32) -&gt; i32&gt;(f: F, x: i32) -&gt; i32 {
    f(x)
}

fn main() {
    println!("{}", apply_a(|x| x * 3, 4)); // 12
    println!("{}", apply_b(|x| x * 3, 4)); // 12
}</code></pre></div>
<h1 id="闭包作为返回值">闭包作为返回值</h1>
<h2 id="必须用-impl-fn">必须用 impl Fn</h2>
<p>每个闭包都有一个唯一的匿名类型，函数不能以具体类型返回它，必须用 <code>impl Fn(...)</code> 语法：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E8%BF%94%E5%9B%9E%E4%B8%80%E4%B8%AA%22%E5%8A%A0%E4%B8%8A%E5%81%8F%E7%A7%BB%E9%87%8F%22%E7%9A%84%E9%97%AD%E5%8C%85%0Afn%20make_adder(offset%3A%20i32)%20-%3E%20impl%20Fn(i32)%20-%3E%20i32%20%7B%0A%20%20%20%20move%20%7Cx%7C%20x%20%2B%20offset%20%20%2F%2F%20%E5%BF%85%E9%A1%BB%20move%EF%BC%8C%E5%90%A6%E5%88%99%20offset%20%E5%9C%A8%E5%87%BD%E6%95%B0%E7%BB%93%E6%9D%9F%E5%90%8E%E5%B0%B1%E5%A4%B1%E6%95%88%E4%BA%86%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20add5%20%3D%20make_adder(5)%3B%0A%20%20%20%20let%20add10%20%3D%20make_adder(10)%3B%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20add5(3))%3B%20%20%20%2F%2F%208%0A%20%20%20%20println!(%22%7B%7D%22%2C%20add10(3))%3B%20%20%2F%2F%2013%0A%20%20%20%20println!(%22%7B%7D%22%2C%20add5(7))%3B%20%20%20%2F%2F%2012%EF%BC%88add5%20%E8%BF%98%E5%8F%AF%E4%BB%A5%E7%BB%A7%E7%BB%AD%E7%94%A8%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">// 返回一个"加上偏移量"的闭包
fn make_adder(offset: i32) -&gt; impl Fn(i32) -&gt; i32 {
    move |x| x + offset  // 必须 move，否则 offset 在函数结束后就失效了
}

fn main() {
    let add5 = make_adder(5);
    let add10 = make_adder(10);

    println!("{}", add5(3));   // 8
    println!("{}", add10(3));  // 13
    println!("{}", add5(7));   // 12（add5 还可以继续用）
}</code></pre></div>
<h2 id="为什么必须-move">为什么必须 move</h2>
<p>返回的闭包会在函数结束后继续使用，但 <code>offset</code> 是函数的局部变量，函数结束就销毁了。必须用 <code>move</code> 把 <code>offset</code> 的所有权移入闭包：</p>
<div class="code-runner" data-full-code="fn%20make_adder_broken(offset%3A%20i32)%20-%3E%20impl%20Fn(i32)%20-%3E%20i32%20%7B%0A%20%20%20%20%2F%2F%20%E4%B8%8D%E5%8A%A0%20move%EF%BC%9A%E9%97%AD%E5%8C%85%E5%8F%AA%E6%98%AF%E5%80%9F%E7%94%A8%20offset%0A%20%20%20%20%2F%2F%20%E5%87%BD%E6%95%B0%E8%BF%94%E5%9B%9E%E5%90%8E%20offset%20%E9%94%80%E6%AF%81%EF%BC%8C%E9%97%AD%E5%8C%85%E6%8C%81%E6%9C%89%E6%82%AC%E5%9E%82%E5%BC%95%E7%94%A8%20%E2%86%92%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%0A%20%20%20%20%7Cx%7C%20x%20%2B%20offset%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn make_adder_broken(offset: i32) -&gt; impl Fn(i32) -&gt; i32 {
    // 不加 move：闭包只是借用 offset
    // 函数返回后 offset 销毁，闭包持有悬垂引用 → 编译错误
    |x| x + offset
}</code></pre></div>
<hr/>
<h1 id="练习题">练习题</h1>
<h2 id="fn-trait-测验">Fn trait 测验</h2>
</div>
</div>
<pre><code class="language-rust">fn run&lt;F: Fn()&gt;(f: F) {
    f();
    f();
}

fn main() {
    let mut count = 0;
    run(|| count += 1);
    println!("{}", count);
}</code></pre>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>实现 <code>run_n</code> 函数，将传入的闭包执行 <code>n</code> 次。关键是选对 trait——<code>Fn</code>、<code>FnMut</code> 还是 <code>FnOnce</code>？</p>
<div class="code-editor" data-block-id="12-closures-iterators/02-fn-traits#3:4" data-expect-mode="literal" data-expect-pattern="hello%0Ahello%0Ahello%0Acount%20%3D%204" data-starter-code="%2F%2F%20TODO%3A%20%E6%8A%8A%20%3F%3F%3F%20%E6%9B%BF%E6%8D%A2%E6%88%90%E6%AD%A3%E7%A1%AE%E7%9A%84%20trait%EF%BC%88Fn%20%2F%20FnMut%20%2F%20FnOnce%EF%BC%89%0A%2F%2F%20%E6%8F%90%E7%A4%BA%EF%BC%9Af%20%E4%BC%9A%E8%A2%AB%E8%B0%83%E7%94%A8%20n%20%E6%AC%A1%EF%BC%8C%E4%B8%94%E7%AC%AC%E4%BA%8C%E4%B8%AA%E7%94%A8%E6%B3%95%E9%87%8C%20f%20%E4%BC%9A%E4%BF%AE%E6%94%B9%E5%A4%96%E9%83%A8%E5%8F%98%E9%87%8F%0Afn%20run_n(%3F%3F%3F)%20%7B%0A%20%20%20%20for%20_%20in%200..n%20%7B%0A%20%20%20%20%20%20%20%20f()%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E7%94%A8%E6%B3%95%201%EF%BC%9A%E5%8F%AA%E8%AF%BB%E5%8F%96%EF%BC%8C%E8%B0%83%E7%94%A8%203%20%E6%AC%A1%0A%20%20%20%20let%20msg%20%3D%20%22hello%22%3B%0A%20%20%20%20run_n(3%2C%20%7C%7C%20println!(%22%7B%7D%22%2C%20msg))%3B%0A%0A%20%20%20%20%2F%2F%20%E7%94%A8%E6%B3%95%202%EF%BC%9A%E4%BF%AE%E6%94%B9%E5%A4%96%E9%83%A8%E5%8F%98%E9%87%8F%EF%BC%8C%E8%B0%83%E7%94%A8%204%20%E6%AC%A1%0A%20%20%20%20let%20mut%20count%20%3D%200%3B%0A%20%20%20%20run_n(4%2C%20%7C%7C%20count%20%2B%3D%201)%3B%0A%20%20%20%20println!(%22count%20%3D%20%7B%7D%22%2C%20count)%3B%0A%7D"><pre><code class="language-rust">// TODO: 把 ??? 替换成正确的 trait（Fn / FnMut / FnOnce）
// 提示：f 会被调用 n 次，且第二个用法里 f 会修改外部变量
fn run_n(???) {
    for _ in 0..n {
        f();
    }
}

fn main() {
    // 用法 1：只读取，调用 3 次
    let msg = "hello";
    run_n(3, || println!("{}", msg));

    // 用法 2：修改外部变量，调用 4 次
    let mut count = 0;
    run_n(4, || count += 1);
    println!("count = {}", count);
}</code></pre></div> 