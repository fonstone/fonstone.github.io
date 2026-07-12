---
title: "Option<T> 枚举"
description: "自定义类型 - Option<T> 枚举"
date: "2026-07-12"
order: 4006
tags: ["Option", "Some", "None", "null", "可选值"]
est_time: "20 分钟"
---

 <h1 id="为什么-rust-没有-null">为什么 Rust 没有 null</h1>
<p>很多编程语言（Java、C、JavaScript）都有 <code>null</code> 值，表示”没有值”。这听起来合理，但 Tony Hoare（<code>null</code> 的发明者）后来称之为 <strong>“十亿美元的错误”</strong>，因为 <code>null</code> 导致的 bug 无穷无尽：</p>
<ul>
<li>忘记检查 <code>null</code>，程序崩溃（“Null Pointer Exception”）</li>
<li>在不该是 <code>null</code> 的地方突然变成 <code>null</code></li>
<li>很难区分”正常的空值”和”未初始化”</li>
</ul>
<p>Rust 的解决方案是：<strong>没有 <code>null</code>，用 <code>Option&lt;T&gt;</code> 枚举代替</strong>。</p>
<p>这强制你在编译期就必须处理”可能没有值”的情况。</p>
<h1 id="optiont-的定义">Option&lt;T&gt; 的定义</h1>
<p><code>Option&lt;T&gt;</code> 是标准库中的一个枚举：</p>
<pre><code class="language-rust">enum Option&lt;T&gt; {
    Some(T),
    None,
}</code></pre>
<p>它很简单：</p>
<ul>
<li><code>Some(T)</code> — 表示有值</li>
<li><code>None</code> — 表示没有值</li>
</ul>
<p><code>&lt;T&gt;</code> 是一个<strong>泛型参数</strong>（后续会详细讲），现在只需知道它表示”任何类型”。</p>
<h2 id="使用-option">使用 Option</h2>
<p><code>Option&lt;T&gt;</code> 在 <strong>prelude</strong> 中，无需导入前缀就能用 <code>Some</code> 和 <code>None</code>：</p>
<blockquote>
<p><strong>什么是 prelude？</strong> Rust 标准库中有一个 prelude（前奏）模块，包含最常用的类型和函数。每个 Rust 程序都会自动导入 prelude 中的内容，所以你可以直接使用 <code>Some</code>、<code>None</code>、<code>Option</code> 等，而不需要写完整的路径如 <code>std::option::Some</code>。</p>
</blockquote>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20some_number%3A%20Option%3Ci32%3E%20%3D%20Some(5)%3B%0A%20%20%20%20let%20none_number%3A%20Option%3Ci32%3E%20%3D%20None%3B%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20some_number)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20none_number)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let some_number: Option&lt;i32&gt; = Some(5);
    let none_number: Option&lt;i32&gt; = None;

    println!("{:?}", some_number);
    println!("{:?}", none_number);
}</code></pre></div>
<p>当有 <code>None</code> 时，必须指定类型，因为编译器无法推断。</p>
<h2 id="为什么这比-null-安全">为什么这比 null 安全</h2>
<p>假如 Rust 有 <code>null</code>：</p>
<pre><code class="language-rust">let x: i32 = null;     // x 可能是 null
println!("{}", x + 1); // 崩溃！</code></pre>
<p>用 <code>Option&lt;T&gt;</code>：</p>
<div class="code-runner" data-full-code="let%20x%3A%20Option%3Ci32%3E%20%3D%20None%3B%0Aprintln!(%22%7B%7D%22%2C%20x%20%2B%201)%3B%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%81Option%3Ci32%3E%20%E4%B8%8D%E8%83%BD%E7%9B%B4%E6%8E%A5%E5%92%8C%20i32%20%E7%9B%B8%E5%8A%A0" data-mode="expect-error"><pre><code class="language-rust">let x: Option&lt;i32&gt; = None;
println!("{}", x + 1);  // 编译错误！Option&lt;i32&gt; 不能直接和 i32 相加</code></pre></div>
<p>你<strong>必须</strong> 先处理 <code>Option</code> 的两种情况。</p>
<h1 id="提取-option-中的值">提取 Option 中的值</h1>
<h2 id="方法一match-表达式最常见">方法一：match 表达式（最常见）</h2>
<p>用 <code>match</code> 分别处理 <code>Some</code> 和 <code>None</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20maybe_age%3A%20Option%3Cu32%3E%20%3D%20Some(25)%3B%0A%0A%20%20%20%20match%20maybe_age%20%7B%0A%20%20%20%20%20%20%20%20Some(age)%20%3D%3E%20println!(%22%E5%B9%B4%E9%BE%84%E6%98%AF%20%7B%7D%22%2C%20age)%2C%0A%20%20%20%20%20%20%20%20None%20%3D%3E%20println!(%22%E5%B9%B4%E9%BE%84%E6%9C%AA%E7%9F%A5%22)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let maybe_age: Option&lt;u32&gt; = Some(25);

    match maybe_age {
        Some(age) =&gt; println!("年龄是 {}", age),
        None =&gt; println!("年龄未知"),
    }
}</code></pre></div>
<p><code>Some(age)</code> 会绑定内部的值，可以在分支中使用。</p>
<h2 id="方法二if-let-表达式只关心-some-的情况">方法二：if let 表达式（只关心 Some 的情况）</h2>
<p>如果只想处理 <code>Some</code> 的情况，<code>if let</code> 更简洁：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20favorite_color%3A%20Option%3C%26str%3E%20%3D%20Some(%22%E8%93%9D%E8%89%B2%22)%3B%0A%0A%20%20%20%20if%20let%20Some(color)%20%3D%20favorite_color%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%BD%A0%E6%9C%80%E5%96%9C%E6%AC%A2%E7%9A%84%E9%A2%9C%E8%89%B2%E6%98%AF%20%7B%7D%22%2C%20color)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let favorite_color: Option&lt;&amp;str&gt; = Some("蓝色");

    if let Some(color) = favorite_color {
        println!("你最喜欢的颜色是 {}", color);
    }
}</code></pre></div>
<p>（<code>if let</code> 会在后续详细讲）</p>
<h2 id="方法三option-的方法">方法三：Option 的方法</h2>
<p><code>Option&lt;T&gt;</code> 提供了许多方便的方法（这里先了解，后续会深入）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%20Some(5)%3B%0A%0A%20%20%20%20%2F%2F%20unwrap()%EF%BC%9A%E5%A6%82%E6%9E%9C%E6%98%AF%20Some%EF%BC%8C%E8%BF%94%E5%9B%9E%E5%86%85%E9%83%A8%E5%80%BC%EF%BC%9B%E5%A6%82%E6%9E%9C%E6%98%AF%20None%EF%BC%8Cpanic%0A%20%20%20%20let%20value%20%3D%20x.unwrap()%3B%0A%20%20%20%20println!(%22%E5%80%BC%E6%98%AF%20%7B%7D%22%2C%20value)%3B%0A%0A%20%20%20%20%2F%2F%20unwrap_or()%EF%BC%9A%E5%A6%82%E6%9E%9C%E6%98%AF%20Some%EF%BC%8C%E8%BF%94%E5%9B%9E%E5%86%85%E9%83%A8%E5%80%BC%EF%BC%9B%E5%A6%82%E6%9E%9C%E6%98%AF%20None%EF%BC%8C%E8%BF%94%E5%9B%9E%E9%BB%98%E8%AE%A4%E5%80%BC%0A%20%20%20%20let%20y%3A%20Option%3Ci32%3E%20%3D%20None%3B%0A%20%20%20%20let%20value%20%3D%20y.unwrap_or(0)%3B%0A%20%20%20%20println!(%22%E5%80%BC%E6%98%AF%20%7B%7D%22%2C%20value)%3B%0A%0A%20%20%20%20%2F%2F%20is_some()%E3%80%81is_none()%EF%BC%9A%E6%A3%80%E6%9F%A5%E6%98%AF%20Some%20%E8%BF%98%E6%98%AF%20None%0A%20%20%20%20let%20z%20%3D%20Some(10)%3B%0A%20%20%20%20if%20z.is_some()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22z%20%E6%9C%89%E5%80%BC%22)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = Some(5);

    // unwrap()：如果是 Some，返回内部值；如果是 None，panic
    let value = x.unwrap();
    println!("值是 {}", value);

    // unwrap_or()：如果是 Some，返回内部值；如果是 None，返回默认值
    let y: Option&lt;i32&gt; = None;
    let value = y.unwrap_or(0);
    println!("值是 {}", value);

    // is_some()、is_none()：检查是 Some 还是 None
    let z = Some(10);
    if z.is_some() {
        println!("z 有值");
    }
}</code></pre></div>
<blockquote>
<p><strong>警告</strong>：<code>unwrap()</code> 如果碰到 <code>None</code> 会 panic。在不确定的情况下，用 <code>match</code> 或 <code>if let</code> 更安全。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<pre><code class="language-rust">fn get_age(name: &amp;str) -&gt; Option&lt;u32&gt; {
    match name {
        "Alice" =&gt; Some(30),
        "Bob" =&gt; Some(25),
        _ =&gt; None,
    }
}</code></pre>
</div>
<pre><code class="language-rust">let x: Option&lt;i32&gt; = Some(5);
let y = x.unwrap();</code></pre>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习-1返回-option-的函数">练习 1：返回 Option 的函数</h3>
<p>实现一个函数 <code>first_word_length()</code>，返回字符串中第一个单词的长度。如果字符串为空或只有空白，返回 None：</p>
<div class="code-editor" data-block-id="04-custom-types/06-option#3:3" data-expect-mode="literal" data-expect-pattern="Some(5)%0ANone%0ANone%0ASome(6)" data-starter-code="fn%20first_word_length(s%3A%20%26str)%20-%3E%20Option%3Cusize%3E%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9E%E7%8E%B0%E5%87%BD%E6%95%B0%0A%20%20%20%20%2F%2F%20%E6%8F%90%E7%A4%BA%EF%BC%9Atrim()%20%E5%8F%AF%E4%BB%A5%E5%8E%BB%E6%8E%89%E7%A9%BA%E7%99%BD%EF%BC%8Csplit_whitespace()%20%E5%8F%AF%E4%BB%A5%E6%8C%89%E7%A9%BA%E7%99%BD%E5%88%86%E5%89%B2%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20first_word_length(%22hello%20world%22))%3B%20%20%20%20%20%20%2F%2F%20Some(5)%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20first_word_length(%22%20%20%22))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20None%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20first_word_length(%22%22))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20None%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20first_word_length(%22single%22))%3B%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20Some(6)%0A%7D"><pre><code class="language-rust">fn first_word_length(s: &amp;str) -&gt; Option&lt;usize&gt; {
    // TODO: 实现函数
    // 提示：trim() 可以去掉空白，split_whitespace() 可以按空白分割
}

fn main() {
    println!("{:?}", first_word_length("hello world"));      // Some(5)
    println!("{:?}", first_word_length("  "));               // None
    println!("{:?}", first_word_length(""));                 // None
    println!("{:?}", first_word_length("single"));           // Some(6)
}</code></pre></div>
<h3 id="练习-2安全地处理-option">练习 2：安全地处理 Option</h3>
<p>实现一个函数 <code>divide()</code>，返回除法结果的 Option。只有当除数不为 0 时才返回 Some，否则返回 None：</p>
<div class="code-editor" data-block-id="04-custom-types/06-option#3:4" data-expect-mode="literal" data-expect-pattern="10%20%C3%B7%202%20%3D%205%0A%E6%97%A0%E6%B3%95%E9%99%A4%E4%BB%A5%200" data-starter-code="fn%20divide(dividend%3A%20f64%2C%20divisor%3A%20f64)%20-%3E%20Option%3Cf64%3E%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9E%E7%8E%B0%E5%87%BD%E6%95%B0%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20match%20divide(10.0%2C%202.0)%20%7B%0A%20%20%20%20%20%20%20%20Some(result)%20%3D%3E%20println!(%2210%20%C3%B7%202%20%3D%20%7B%7D%22%2C%20result)%2C%0A%20%20%20%20%20%20%20%20None%20%3D%3E%20println!(%22%E6%97%A0%E6%B3%95%E9%99%A4%E4%BB%A5%200%22)%2C%0A%20%20%20%20%7D%0A%0A%20%20%20%20match%20divide(10.0%2C%200.0)%20%7B%0A%20%20%20%20%20%20%20%20Some(result)%20%3D%3E%20println!(%2210%20%C3%B7%200%20%3D%20%7B%7D%22%2C%20result)%2C%0A%20%20%20%20%20%20%20%20None%20%3D%3E%20println!(%22%E6%97%A0%E6%B3%95%E9%99%A4%E4%BB%A5%200%22)%2C%0A%20%20%20%20%7D%0A%7D"><pre><code class="language-rust">fn divide(dividend: f64, divisor: f64) -&gt; Option&lt;f64&gt; {
    // TODO: 实现函数
}

fn main() {
    match divide(10.0, 2.0) {
        Some(result) =&gt; println!("10 ÷ 2 = {}", result),
        None =&gt; println!("无法除以 0"),
    }

    match divide(10.0, 0.0) {
        Some(result) =&gt; println!("10 ÷ 0 = {}", result),
        None =&gt; println!("无法除以 0"),
    }
}</code></pre></div> 