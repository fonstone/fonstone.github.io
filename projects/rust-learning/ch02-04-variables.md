---
title: "变量与可变性"
description: "基本语法 - 变量与可变性"
date: "2026-07-12"
order: 2004
tags: ["let", "mut", "const", "shadowing", "遮蔽", "作用域", "变量绑定"]
est_time: "25 分钟"
---

 <h1 id="声明与绑定">声明与绑定</h1>
<p>Rust 的变量系统比大多数语言多了一个维度：<strong>可变性由你显式控制</strong>，而不是默认允许修改。</p>
<p>Rust 用 <code>let</code> 关键字声明变量。“变量绑定”这个名字比”变量赋值”更准确——你是在把一个值<strong>绑定</strong>到一个名字上。</p>
<h2 id="基本语法">基本语法</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E6%95%B4%E6%95%B0%EF%BC%8C%E7%BC%96%E8%AF%91%E5%99%A8%E6%8E%A8%E6%96%AD%E4%B8%BA%20i32%0A%20%20%20%20let%20y%20%3D%203.14%3B%20%20%20%20%20%20%20%2F%2F%20%E6%B5%AE%E7%82%B9%EF%BC%8C%E6%8E%A8%E6%96%AD%E4%B8%BA%20f64%0A%20%20%20%20let%20z%3A%20u8%20%3D%20255%3B%20%20%20%20%2F%2F%20%E4%B9%9F%E5%8F%AF%E4%BB%A5%E6%98%BE%E5%BC%8F%E6%A0%87%E6%B3%A8%E7%B1%BB%E5%9E%8B%0A%20%20%20%20let%20flag%20%3D%20true%3B%20%20%20%20%2F%2F%20%E5%B8%83%E5%B0%94%E5%80%BC%0A%0A%20%20%20%20println!(%22x%3D%7B%7D%20y%3D%7B%7D%20z%3D%7B%7D%20flag%3D%7B%7D%22%2C%20x%2C%20y%2C%20z%2C%20flag)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 5;          // 整数，编译器推断为 i32
    let y = 3.14;       // 浮点，推断为 f64
    let z: u8 = 255;    // 也可以显式标注类型
    let flag = true;    // 布尔值

    println!("x={} y={} z={} flag={}", x, y, z, flag);
}</code></pre></div>
<blockquote>
<p><strong>类型推断</strong>：Rust 的编译器非常聪明，大多数情况下能从赋值和使用方式推断出变量类型，你不需要每次都写类型注解。当推断不了时，编译器会直接报错告诉你需要补上。</p>
</blockquote>
<h2 id="默认不可变">默认不可变</h2>
<p>Rust 的变量<strong>默认是不可变的</strong>——绑定之后，值就不能再改变：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20x%20%3D%206%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81%E4%B8%8D%E8%83%BD%E5%AF%B9%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%8F%98%E9%87%8F%E4%BA%8C%E6%AC%A1%E8%B5%8B%E5%80%BC%0A%20%20%20%20println!(%22%7B%7D%22%2C%20x)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let x = 5;
    x = 6; // 错误！不能对不可变变量二次赋值
    println!("{}", x);
}</code></pre></div>
<p>编译器会给出非常清晰的错误信息，甚至告诉你解决方法：</p>
<pre><code class="language-text">   Compiling playground v0.0.1 (/playground)
error[E0384]: cannot assign twice to immutable variable `x`
 --&gt; src/main.rs:3:5
  |
2 |     let x = 5;
  |         - first assignment to `x`
3 |     x = 6; // 错误！不能对不可变变量二次赋值
  |     ^^^^^ cannot assign twice to immutable variable
  |</code></pre>
<h2 id="为什么要默认不可变">为什么要默认不可变？</h2>
<p>这是 Rust 最有意思的设计决策之一，值得认真理解。</p>
<p><strong>问题场景</strong>：假设你的程序里有这样一段逻辑——</p>
<div class="code-runner" data-full-code="fn%20calculate_tax(income%3A%20f64)%20-%3E%20f64%20%7B%0A%20%20%20%20let%20rate%20%3D%200.20%3B%20%2F%2F%20%E7%A8%8E%E7%8E%87%2020%25%EF%BC%8C%22%E6%84%9F%E8%A7%89%22%E4%B8%8D%E4%BC%9A%E5%8F%98%0A%0A%20%20%20%20%2F%2F%20%E5%81%87%E8%AE%BE%E4%B8%AD%E9%97%B4%E6%9C%89%E5%BE%88%E5%A4%9A%E9%80%BB%E8%BE%91%E2%80%A6%E2%80%A6%0A%20%20%20%20let%20taxable%20%3D%20income%20*%200.8%3B%0A%0A%20%20%20%20%2F%2F...%E5%BE%88%E5%A4%9A%E8%A1%8C%E4%BB%A3%E7%A0%81...%0A%0A%20%20%20%20%2F%2F%20%E6%9F%90%E4%B8%AA%E5%9C%B0%E6%96%B9%E6%82%84%E6%82%84%E4%BF%AE%E6%94%B9%E4%BA%86%20rate%EF%BC%88%E6%AF%94%E5%A6%82%E5%8F%A6%E4%B8%80%E4%B8%AA%E5%90%8C%E4%BA%8B%E5%86%99%E7%9A%84%EF%BC%89%0A%20%20%20%20%2F%2F%20rate%20%3D%200.25%3B%20%2F%2F%20%E5%A6%82%E6%9E%9C%E6%98%AF%E5%8F%AF%E5%8F%98%E7%9A%84%EF%BC%8C%E8%BF%99%E8%A1%8C%E5%8F%AF%E8%83%BD%E6%BD%9C%E4%BC%8F%E5%9C%A8%E5%87%A0%E7%99%BE%E8%A1%8C%E4%B9%8B%E5%90%8E%0A%0A%20%20%20%20%2F%2F...%E5%BE%88%E5%A4%9A%E8%A1%8C%E4%BB%A3%E7%A0%81...%0A%0A%20%20%20%20taxable%20*%20rate%20%2F%2F%20%E8%BF%99%E9%87%8C%E7%94%A8%E7%9A%84%E6%98%AF%E5%93%AA%E4%B8%AA%20rate%EF%BC%9F%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%E7%A8%8E%E9%A2%9D%3A%20%7B%3A.2%7D%22%2C%20calculate_tax(100_000.0))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn calculate_tax(income: f64) -&gt; f64 {
    let rate = 0.20; // 税率 20%，"感觉"不会变

    // 假设中间有很多逻辑……
    let taxable = income * 0.8;

    //...很多行代码...

    // 某个地方悄悄修改了 rate（比如另一个同事写的）
    // rate = 0.25; // 如果是可变的，这行可能潜伏在几百行之后

    //...很多行代码...

    taxable * rate // 这里用的是哪个 rate？
}

fn main() {
    println!("税额: {:.2}", calculate_tax(100_000.0));
}</code></pre></div>
<p>在大型项目中，<code>rate</code> 可能在函数的前半段设置，在几百行之后的某处被意外修改，导致最终计算结果出错。追踪这类 bug 非常痛苦——你不得不在整个函数里搜索”谁改了这个值”。</p>
<p><strong>Rust 的解法</strong>：变量默认不可变。如果 <code>rate</code> 不需要改变，就不加 <code>mut</code>——编译器<strong>保证</strong>它不会被任何地方修改，你读代码时可以完全放心地说”这个值从声明到用完都是 0.20”。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20config_value%20%3D%2042%3B%20%2F%2F%20%E9%85%8D%E7%BD%AE%E9%A1%B9%EF%BC%8C%E4%B8%8D%E5%BA%94%E8%AF%A5%E8%A2%AB%E4%BF%AE%E6%94%B9%0A%0A%20%20%20%20%2F%2F%20%E5%87%A0%E7%99%BE%E8%A1%8C%E4%B9%8B%E5%90%8E%EF%BC%8C%E6%9F%90%E5%A4%84%E6%84%8F%E5%A4%96%E5%B0%9D%E8%AF%95%E4%BF%AE%E6%94%B9%E5%AE%83%E2%80%A6%E2%80%A6%0A%20%20%20%20config_value%20%3D%2099%3B%20%2F%2F%20%E7%BC%96%E8%AF%91%E5%99%A8%EF%BC%9A%E4%B8%8D%E8%A1%8C%EF%BC%81%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20config_value)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let config_value = 42; // 配置项，不应该被修改

    // 几百行之后，某处意外尝试修改它……
    config_value = 99; // 编译器：不行！

    println!("{}", config_value);
}</code></pre></div>
<blockquote>
<p><strong>不可变性 ≠ 性能损失</strong>：不可变变量和可变变量在运行时没有性能差异，不可变只是编译期的约束。<code>mut</code> 是你告诉编译器”我真的需要修改这个值”的明确声明，而不是一个优化开关。</p>
</blockquote>
<h2 id="先声明后初始化">先声明，后初始化</h2>
<p>可以先声明变量，稍后再给它赋值——但 <strong>Rust 绝不允许使用未初始化的变量</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20result%3B%20%2F%2F%20%E5%8F%AA%E5%A3%B0%E6%98%8E%EF%BC%8C%E4%B8%8D%E8%B5%8B%E5%80%BC%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20base%20%3D%204%3B%0A%20%20%20%20%20%20%20%20result%20%3D%20base%20*%20base%3B%20%2F%2F%20%E5%9C%A8%E5%86%85%E5%B1%82%E4%BD%9C%E7%94%A8%E5%9F%9F%E9%87%8C%E5%88%9D%E5%A7%8B%E5%8C%96%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22result%20%3D%20%7B%7D%22%2C%20result)%3B%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E4%BD%BF%E7%94%A8%EF%BC%8C%E5%9B%A0%E4%B8%BA%E5%B7%B2%E7%BB%8F%E5%88%9D%E5%A7%8B%E5%8C%96%E4%BA%86%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let result; // 只声明，不赋值

    {
        let base = 4;
        result = base * base; // 在内层作用域里初始化
    }

    println!("result = {}", result); // 可以使用，因为已经初始化了
}</code></pre></div>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20x)%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81%E4%BD%BF%E7%94%A8%E4%BA%86%E6%9C%AA%E5%88%9D%E5%A7%8B%E5%8C%96%E7%9A%84%E5%8F%98%E9%87%8F%0A%20%20%20%20x%20%3D%201%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let x;
    println!("{}", x); // 错误！使用了未初始化的变量
    x = 1;
}</code></pre></div>
<blockquote>
<p>这和 C 语言不同。C 允许使用未初始化的变量（值是不确定的垃圾数据），这是很多 bug 的来源。Rust 编译器在编译期就禁止这种情况，彻底杜绝了”读垃圾值”的问题。</p>
</blockquote>
<h2 id="用-_-前缀抑制未使用警告">用 <code>_</code> 前缀抑制未使用警告</h2>
<p>声明了但没有使用的变量，编译器会发出警告。如果某个变量是有意不使用的（比如调试时临时写的），加上 <code>_</code> 前缀可以告诉编译器”我知道，不用提醒我”：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20_intentionally_unused%20%3D%2042%3B%20%2F%2F%20%E4%B8%8D%E4%BC%9A%E8%AD%A6%E5%91%8A%0A%20%20%20%20let%20also_unused%20%3D%2099%3B%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E4%BC%9A%E8%AD%A6%E5%91%8A%EF%BC%9Aunused%20variable%0A%0A%20%20%20%20println!(%22%E5%8F%AA%E7%94%A8%E8%BF%99%E4%B8%80%E4%B8%AA%22)%3B%0A%20%20%20%20%2F%2F%20also_unused%20%E4%BB%8E%E6%9C%AA%E8%A2%AB%E8%AF%BB%E5%8F%96%0A%20%20%20%20let%20_%20%3D%20also_unused%3B%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E7%94%A8%20let%20_%20%3D%20%E6%98%BE%E5%BC%8F%E4%B8%A2%E5%BC%83%E4%B9%9F%E5%8F%AF%E4%BB%A5%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let _intentionally_unused = 42; // 不会警告
    let also_unused = 99;           // 会警告：unused variable

    println!("只用这一个");
    // also_unused 从未被读取
    let _ = also_unused;            // 用 let _ = 显式丢弃也可以
}</code></pre></div>
<h1 id="可变与常量">可变与常量</h1>
<h2 id="用-mut-声明可变变量">用 <code>mut</code> 声明可变变量</h2>
<p>在变量名前加 <code>mut</code>，就可以在绑定后修改它的值：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20count%20%3D%200%3B%0A%0A%20%20%20%20count%20%2B%3D%201%3B%0A%20%20%20%20count%20%2B%3D%201%3B%0A%20%20%20%20count%20%2B%3D%201%3B%0A%0A%20%20%20%20println!(%22count%20%3D%20%7B%7D%22%2C%20count)%3B%20%2F%2F%203%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut count = 0;

    count += 1;
    count += 1;
    count += 1;

    println!("count = {}", count); // 3
}</code></pre></div>
<p><code>mut</code> 不只是给编译器看的，也是给<strong>读代码的人</strong>看的——它明确传达”这个变量的值会变化”。没有 <code>mut</code> 的变量，阅读代码时可以放心地认为它的值从始至终不变。</p>
<h2 id="用-const-声明常量">用 <code>const</code> 声明常量</h2>
<p><code>const</code> 声明的是真正的常量，有几个与 <code>let</code> 不同的规则：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E5%B8%B8%E9%87%8F%E9%80%9A%E5%B8%B8%E5%9C%A8%E5%87%BD%E6%95%B0%E5%A4%96%E5%A3%B0%E6%98%8E%EF%BC%88%E5%85%A8%E5%B1%80%E5%8F%AF%E8%A7%81%EF%BC%89%EF%BC%8C%E4%B9%9F%E5%8F%AF%E4%BB%A5%E5%9C%A8%E5%87%BD%E6%95%B0%E5%86%85%0Aconst%20MAX_SCORE%3A%20u32%20%3D%20100%3B%0Aconst%20SECONDS_PER_HOUR%3A%20u32%20%3D%2060%20*%2060%3B%20%2F%2F%20%E5%B8%B8%E9%87%8F%E8%A1%A8%E8%BE%BE%E5%BC%8F%EF%BC%8C%E7%BC%96%E8%AF%91%E6%97%B6%E8%AE%A1%E7%AE%97%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%E6%BB%A1%E5%88%86%3A%20%7B%7D%22%2C%20MAX_SCORE)%3B%0A%20%20%20%20println!(%22%E4%B8%80%E5%B0%8F%E6%97%B6%3A%20%7B%7D%20%E7%A7%92%22%2C%20SECONDS_PER_HOUR)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 常量通常在函数外声明（全局可见），也可以在函数内
const MAX_SCORE: u32 = 100;
const SECONDS_PER_HOUR: u32 = 60 * 60; // 常量表达式，编译时计算

fn main() {
    println!("满分: {}", MAX_SCORE);
    println!("一小时: {} 秒", SECONDS_PER_HOUR);
}</code></pre></div>
<p><code>const</code> 的特点：</p>
<ul>
<li><strong>必须标注类型</strong>：编译器不推断常量类型</li>
<li><strong>命名约定</strong>：全大写字母 + 下划线分隔（<code>SCREAMING_SNAKE_CASE</code>）</li>
<li><strong>只能是常量表达式</strong>：不能是函数调用结果或运行时才知道的值</li>
<li><strong>在任意作用域有效</strong>：包括全局，整个程序运行期间都存在</li>
</ul>
<h2 id="let--let-mut--const-对比"><code>let</code> / <code>let mut</code> / <code>const</code> 对比</h2>
<table><thead><tr><th></th><th><code>let</code></th><th><code>let mut</code></th><th><code>const</code></th></tr></thead><tbody><tr><td>可变</td><td>否</td><td><strong>是</strong></td><td>否（永远）</td></tr><tr><td>必须标注类型</td><td>否（推断）</td><td>否（推断）</td><td><strong>是</strong></td></tr><tr><td>作用域</td><td>块作用域</td><td>块作用域</td><td>任意（含全局）</td></tr><tr><td>能遮蔽</td><td>是</td><td>是</td><td>否</td></tr><tr><td>典型用途</td><td>局部值</td><td>需要修改的值</td><td>程序常量、配置值</td></tr></tbody></table>
<blockquote>
<p><strong>const 与不可变 let 的本质区别</strong>：<code>let</code> 默认不可变，但可以被遮蔽（重新绑定，下一页会讲到）；<code>const</code> 是真正的常量，不能被任何操作改变，编译器会把它内联到每个使用处。</p>
</blockquote>
<h1 id="作用域与遮蔽">作用域与遮蔽</h1>
<h2 id="作用域">作用域</h2>
<p>变量的作用域由 <code>{}</code> 划定——超出大括号，变量就不再存在：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20outer%20%3D%20%22%E5%A4%96%E5%B1%82%22%3B%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20inner%20%3D%20%22%E5%86%85%E5%B1%82%22%3B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%20%E5%92%8C%20%7B%7D%22%2C%20outer%2C%20inner)%3B%20%2F%2F%20%E5%86%85%E5%B1%82%E5%8F%AF%E4%BB%A5%E8%AE%BF%E9%97%AE%E5%A4%96%E5%B1%82%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20outer)%3B%20%20%2F%2F%20%E6%AD%A3%E5%B8%B8%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20inner)%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81inner%20%E5%B7%B2%E7%A6%BB%E5%BC%80%E4%BD%9C%E7%94%A8%E5%9F%9F%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let outer = "外层";

    {
        let inner = "内层";
        println!("{} 和 {}", outer, inner); // 内层可以访问外层
    }

    println!("{}", outer);  // 正常
    // println!("{}", inner); // 错误！inner 已离开作用域
}</code></pre></div>
<h2 id="变量遮蔽">变量遮蔽</h2>
<p>用 <code>let</code> 重新声明同名变量，会<strong>遮蔽</strong>（shadow）之前的变量——新变量使旧变量失效，在当前作用域内使用新值。遮蔽实际上是创建了一个同名的新变量（会消耗另外的内存），它在该作用域内遮挡外层同名变量，使其暂时无法访问：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20println!(%22%E5%8E%9F%E5%A7%8B%20x%20%3D%20%7B%7D%22%2C%20x)%3B%20%2F%2F%205%0A%0A%20%20%20%20let%20x%20%3D%20x%20%2B%201%3B%20%2F%2F%20%E9%81%AE%E8%94%BD%EF%BC%9A%E6%96%B0%20x%20%3D%20%E6%97%A7%20x%20%2B%201%0A%20%20%20%20println!(%22%E9%81%AE%E8%94%BD%E5%90%8E%20x%20%3D%20%7B%7D%22%2C%20x)%3B%20%2F%2F%206%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20x%20%3D%20x%20*%202%3B%20%2F%2F%20%E5%86%85%E5%B1%82%E4%BD%9C%E7%94%A8%E5%9F%9F%E9%81%AE%E8%94%BD%0A%20%20%20%20%20%20%20%20println!(%22%E5%86%85%E5%B1%82%20x%20%3D%20%7B%7D%22%2C%20x)%3B%20%2F%2F%2012%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E7%A6%BB%E5%BC%80%E5%86%85%E5%B1%82%E5%90%8E%20x%20%3D%20%7B%7D%22%2C%20x)%3B%20%2F%2F%20%E5%9B%9E%E5%88%B0%206%EF%BC%8C%E5%86%85%E5%B1%82%E9%81%AE%E8%94%BD%E6%B6%88%E5%A4%B1%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 5;
    println!("原始 x = {}", x); // 5

    let x = x + 1; // 遮蔽：新 x = 旧 x + 1
    println!("遮蔽后 x = {}", x); // 6

    {
        let x = x * 2; // 内层作用域遮蔽
        println!("内层 x = {}", x); // 12
    }

    println!("离开内层后 x = {}", x); // 回到 6，内层遮蔽消失
}</code></pre></div>
<p>遮蔽有一个 <code>mut</code> 做不到的能力：<strong>改变变量的类型</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20mut%20%E6%97%A0%E6%B3%95%E5%81%9A%E5%88%B0%E8%BF%99%E4%BB%B6%E4%BA%8B%EF%BC%88%E7%B1%BB%E5%9E%8B%E4%B8%8D%E8%83%BD%E6%94%B9%E5%8F%98%EF%BC%89%0A%20%20%20%20let%20spaces%20%3D%20%22%20%20%20%22%3B%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%26str%20%E7%B1%BB%E5%9E%8B%0A%20%20%20%20let%20spaces%20%3D%20spaces.len()%3B%20%20%20%20%2F%2F%20%E9%81%AE%E8%94%BD%E4%B8%BA%20usize%20%E7%B1%BB%E5%9E%8B%0A%0A%20%20%20%20println!(%22%E7%A9%BA%E6%A0%BC%E6%95%B0%3A%20%7B%7D%22%2C%20spaces)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E7%94%A8%20mut%20%E5%B0%9D%E8%AF%95%E6%94%B9%E7%B1%BB%E5%9E%8B%EF%BC%8C%E4%BC%9A%E7%BC%96%E8%AF%91%E6%8A%A5%E9%94%99%EF%BC%9A%0A%20%20%20%20%2F%2F%20let%20mut%20spaces%20%3D%20%22%20%20%20%22%3B%0A%20%20%20%20%2F%2F%20spaces%20%3D%20spaces.len()%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81%E7%B1%BB%E5%9E%8B%E4%B8%8D%E5%8C%B9%E9%85%8D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // mut 无法做到这件事（类型不能改变）
    let spaces = "   ";           // &amp;str 类型
    let spaces = spaces.len();    // 遮蔽为 usize 类型

    println!("空格数: {}", spaces);

    // 如果用 mut 尝试改类型，会编译报错：
    // let mut spaces = "   ";
    // spaces = spaces.len(); // 错误！类型不匹配
}</code></pre></div>
<blockquote>
<p><strong>遮蔽 vs mut 的选择</strong>：如果需要修改同一个值，用 <code>mut</code>；如果想对一个值做一次性转换后得到一个新的不可变绑定，用遮蔽——遮蔽后的变量默认仍是不可变的。</p>
</blockquote>
<h2 id="冻结">冻结</h2>
<p>当一个可变变量被<strong>不可变绑定遮蔽</strong>时，在该作用域内它就被”冻结”了，不能再修改。离开该作用域后，可变性恢复：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20value%20%3D%20100%3B%0A%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20value%20%3D%20value%3B%20%2F%2F%20%E7%94%A8%E4%B8%8D%E5%8F%AF%E5%8F%98%E7%BB%91%E5%AE%9A%E9%81%AE%E8%94%BD%20value%EF%BC%8C%E5%86%BB%E7%BB%93%E5%AE%83%0A%20%20%20%20%20%20%20%20value%20%3D%20200%3B%20%20%20%20%20%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81value%20%E5%9C%A8%E6%AD%A4%E4%BD%9C%E7%94%A8%E5%9F%9F%E8%A2%AB%E5%86%BB%E7%BB%93%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E7%A6%BB%E5%BC%80%E5%86%85%E5%B1%82%E4%BD%9C%E7%94%A8%E5%9F%9F%EF%BC%8C%E5%86%BB%E7%BB%93%E8%A7%A3%E9%99%A4%0A%20%20%20%20value%20%3D%20200%3B%20%2F%2F%20%E6%AD%A3%E5%B8%B8%EF%BC%81%0A%20%20%20%20println!(%22%7B%7D%22%2C%20value)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let mut value = 100;

    {
        let value = value; // 用不可变绑定遮蔽 value，冻结它
        value = 200;       // 错误！value 在此作用域被冻结
    }

    // 离开内层作用域，冻结解除
    value = 200; // 正常！
    println!("{}", value);
}</code></pre></div>
<p>冻结的本质：遮蔽创建了一个新的不可变变量（名字相同），在它的作用域内，可变的外层变量被”挡住”了，无从访问。</p>
<h1 id="练习题">练习题</h1>
<h2 id="不可变变量的错误">不可变变量的错误</h2>
<pre><code class="language-rust">fn main() {
    let score = 100;
    score = 90;
    println!("{}", score);
}</code></pre>
</div>
<h2 id="mut-的含义">mut 的含义</h2>
</div>
<h2 id="const-与-let-的区别">const 与 let 的区别</h2>
</div>
<h2 id="遮蔽的能力">遮蔽的能力</h2>
<pre><code class="language-rust">fn main() {
    let x = "hello";
    let x = x.len();
    println!("{}", x);
}</code></pre>
</div>
<h2 id="变量超出作用域">变量超出作用域</h2>
<pre><code class="language-rust">fn main() {
    let x = 1;
    {
        let y = 2;
        println!("{}", x + y);
    }
    println!("{}", y);
}</code></pre>
</div>
<h2 id="未初始化变量">未初始化变量</h2>
</div>
<h2 id="编程练习-1">编程练习 1</h2>
<p>下面的代码想实现一个简单的计数器，但有编译错误，请修复它：</p>
<div class="code-editor" data-block-id="02-basic-syntax/04-variables#3:6" data-expect-mode="literal" data-expect-pattern="count%20%3D%203" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20count%20%3D%200%3B%0A%0A%20%20%20%20count%20%3D%20count%20%2B%201%3B%0A%20%20%20%20count%20%3D%20count%20%2B%201%3B%0A%20%20%20%20count%20%3D%20count%20%2B%201%3B%0A%0A%20%20%20%20println!(%22count%20%3D%20%7B%7D%22%2C%20count)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    let count = 0;

    count = count + 1;
    count = count + 1;
    count = count + 1;

    println!("count = {}", count);
}</code></pre></div>
<h2 id="编程练习-2">编程练习 2</h2>
<p>用遮蔽把字符串 <code>"  Rust  "</code> 分三步处理：先去掉首尾空白，再转换为大写，最后输出长度。每一步用同名变量 <code>s</code> 遮蔽，不使用 <code>mut</code>。</p>
<div class="code-editor" data-block-id="02-basic-syntax/04-variables#3:7" data-expect-mode="literal" data-expect-pattern="4" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20%22%20%20Rust%20%20%22%3B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E7%AC%AC%E4%B8%80%E6%AD%A5%EF%BC%9As%20%3D%20s.trim()%EF%BC%88%E5%8E%BB%E6%8E%89%E9%A6%96%E5%B0%BE%E7%A9%BA%E7%99%BD%EF%BC%89%0A%20%20%20%20%2F%2F%20TODO%3A%20%E7%AC%AC%E4%BA%8C%E6%AD%A5%EF%BC%9As%20%3D%20s.to_uppercase()%EF%BC%88%E8%BD%AC%E5%A4%A7%E5%86%99%EF%BC%89%0A%20%20%20%20%2F%2F%20TODO%3A%20%E7%AC%AC%E4%B8%89%E6%AD%A5%EF%BC%9As%20%3D%20s.len()%EF%BC%88%E5%8F%96%E9%95%BF%E5%BA%A6%EF%BC%89%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    let s = "  Rust  ";
    // TODO: 第一步：s = s.trim()（去掉首尾空白）
    // TODO: 第二步：s = s.to_uppercase()（转大写）
    // TODO: 第三步：s = s.len()（取长度）
    println!("{}", s);
}</code></pre></div> 