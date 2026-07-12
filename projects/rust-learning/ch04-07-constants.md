---
title: "常量与静态变量"
description: "自定义类型 - 常量与静态变量"
date: "2026-07-12"
order: 4007
tags: ["const", "static", "常量", "编译期"]
est_time: "15 分钟"
---

 <h1 id="const常量">const：常量</h1>
<p><strong>常量</strong> 是那些在程序运行期间<strong>不能改变</strong>的值。与变量不同，常量必须始终是不可变的，且不能用 <code>mut</code> 修饰。</p>
<h2 id="基本用法">基本用法</h2>
<div class="code-runner" data-full-code="const%20PI%3A%20f64%20%3D%203.14159%3B%0Aconst%20MAX_POINTS%3A%20u32%20%3D%20100_000%3B%0Aconst%20MAX_SIZE%3A%20usize%20%3D%201024%20*%201024%3B%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E6%98%AF%E5%B8%B8%E9%87%8F%E8%A1%A8%E8%BE%BE%E5%BC%8F%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%CF%80%20%E2%89%88%20%7B%7D%22%2C%20PI)%3B%0A%20%20%20%20println!(%22%E6%9C%80%E5%A4%A7%E5%88%86%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20MAX_POINTS)%3B%0A%20%20%20%20println!(%22%E6%9C%80%E5%A4%A7%E5%B0%BA%E5%AF%B8%EF%BC%9A%7B%7D%20%E5%AD%97%E8%8A%82%22%2C%20MAX_SIZE)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">const PI: f64 = 3.14159;
const MAX_POINTS: u32 = 100_000;
const MAX_SIZE: usize = 1024 * 1024;  // 可以是常量表达式

fn main() {
    println!("π ≈ {}", PI);
    println!("最大分数：{}", MAX_POINTS);
    println!("最大尺寸：{} 字节", MAX_SIZE);
}</code></pre></div>
<h2 id="const-的特点">const 的特点</h2>
<ol>
<li><strong>必须指定类型</strong>（不能依赖类型推断）</li>
<li><strong>在编译期计算</strong>，值被硬编码到二进制文件中</li>
<li><strong>可以在任何作用域定义</strong>，包括全局作用域</li>
<li><strong>按惯例用全大写</strong>（SCREAMING_SNAKE_CASE）</li>
<li><strong>可以进行简单的常量表达式计算</strong></li>
</ol>
<div class="code-runner" data-full-code="const%20SECONDS_PER_DAY%3A%20u32%20%3D%2024%20*%2060%20*%2060%3B%0Aconst%20THRESHOLD%3A%20i32%20%3D%2010%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%E6%AF%8F%E5%A4%A9%E7%A7%92%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20SECONDS_PER_DAY)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">const SECONDS_PER_DAY: u32 = 24 * 60 * 60;
const THRESHOLD: i32 = 10;

fn main() {
    println!("每天秒数：{}", SECONDS_PER_DAY);
}</code></pre></div>
<h2 id="常数表达式">常数表达式</h2>
<p><code>const</code> 可以使用常数表达式（编译期可计算的表达式，不会消耗运行性能）：</p>
<div class="code-runner" data-full-code="const%20HOURS_PER_DAY%3A%20u32%20%3D%2024%3B%0Aconst%20MINUTES_PER_HOUR%3A%20u32%20%3D%2060%3B%0Aconst%20SECONDS_PER_MINUTE%3A%20u32%20%3D%2060%3B%0A%0Aconst%20SECONDS_PER_DAY%3A%20u32%20%3D%0A%20%20%20%20HOURS_PER_DAY%20*%20MINUTES_PER_HOUR%20*%20SECONDS_PER_MINUTE%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%E6%AF%8F%E5%A4%A9%E7%A7%92%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20SECONDS_PER_DAY)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">const HOURS_PER_DAY: u32 = 24;
const MINUTES_PER_HOUR: u32 = 60;
const SECONDS_PER_MINUTE: u32 = 60;

const SECONDS_PER_DAY: u32 =
    HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;

fn main() {
    println!("每天秒数：{}", SECONDS_PER_DAY);
}</code></pre></div>
<h2 id="const-的限制">const 的限制</h2>
<p>不能用复杂的运行时操作定义 const，比如函数调用（除了一些特殊的 const 函数）：</p>
<div class="code-runner" data-full-code="const%20VALUE%3A%20String%20%3D%20String%3A%3Afrom(%22hello%22)%3B%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%81" data-mode="expect-error"><pre><code class="language-rust">const VALUE: String = String::from("hello");  // 编译错误！</code></pre></div>
<p>这是因为 <code>String::from()</code> 需要在运行时执行。</p>
<h1 id="static静态变量">static：静态变量</h1>
<p><strong>静态变量</strong>是一种<strong>全局变量</strong>，在程序整个生命周期中只存在一个实例，存储在<strong>固定的内存地址</strong>上。与 const 不同，static 在内存中有真实的地址，可以被取引用。</p>
<blockquote>
<p><strong>重要</strong>：static 和 const 一样，<strong>都必须明确指定类型</strong>，不能依赖类型推断。</p>
</blockquote>
<div class="code-runner" data-full-code="static%20VERSION%3A%20%26str%20%3D%20%221.0.0%22%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20static%20%E6%9C%89%E5%9B%BA%E5%AE%9A%E5%9C%B0%E5%9D%80%0A%20%20%20%20println!(%22%E7%89%88%E6%9C%AC%EF%BC%9A%7B%7D%22%2C%20VERSION)%3B%0A%20%20%20%20println!(%22%E7%89%88%E6%9C%AC%E5%9C%B0%E5%9D%80%EF%BC%9A%7B%3Ap%7D%22%2C%20%26VERSION)%3B%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E5%8F%96%E5%9C%B0%E5%9D%80%0A%7D" data-mode="run"><pre><code class="language-rust">static VERSION: &amp;str = "1.0.0";

fn main() {
    // static 有固定地址
    println!("版本：{}", VERSION);
    println!("版本地址：{:p}", &amp;VERSION);  // 可以取地址
}</code></pre></div>
<h2 id="static-的限制">static 的限制</h2>
<p>static 的初始值也必须在<strong>编译期可知</strong>，这一点和 const 相同。不能使用运行时函数来初始化 static：</p>
<div class="code-runner" data-full-code="static%20NAME%3A%20String%20%3D%20String%3A%3Afrom(%22App%22)%3B%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%81" data-mode="expect-error"><pre><code class="language-rust">static NAME: String = String::from("App");  // 编译错误！</code></pre></div>
<p>因为 <code>String::from()</code> 需要在运行时执行。如果需要字符串，应该用 <code>&amp;str</code> 字面量：</p>
<div class="code-runner" data-full-code="static%20NAME%3A%20%26str%20%3D%20%22App%22%3B%20%20%2F%2F%20%E6%AD%A3%E7%A1%AE%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20NAME)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">static NAME: &amp;str = "App";  // 正确

fn main() {
    println!("{}", NAME);
}</code></pre></div>
<p>Rust 也支持在函数内声明 static，这与 C 语言相似。函数内的 static 变量生命周期贯穿整个程序，但<strong>作用域被限制在函数内部</strong>，是一种很好的封装手段。</p>
<div class="code-runner" data-full-code="fn%20get_db_timeout()%20-%3E%20u32%20%7B%0A%20%20%20%20%2F%2F%20%E5%87%BD%E6%95%B0%E5%86%85%E7%9A%84%20static%20%E2%80%94%20%E5%8F%AA%E5%88%9D%E5%A7%8B%E5%8C%96%E4%B8%80%E6%AC%A1%0A%20%20%20%20static%20DEFAULT_TIMEOUT%3A%20u32%20%3D%2030%3B%0A%20%20%20%20DEFAULT_TIMEOUT%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%E8%B6%85%E6%97%B6%EF%BC%9A%7B%7D%20%E7%A7%92%22%2C%20get_db_timeout())%3B%0A%20%20%20%20println!(%22%E8%B6%85%E6%97%B6%EF%BC%9A%7B%7D%20%E7%A7%92%22%2C%20get_db_timeout())%3B%20%20%2F%2F%20%E4%B8%8D%E4%BC%9A%E9%87%8D%E6%96%B0%E5%88%9D%E5%A7%8B%E5%8C%96%0A%7D" data-mode="run"><pre><code class="language-rust">fn get_db_timeout() -&gt; u32 {
    // 函数内的 static — 只初始化一次
    static DEFAULT_TIMEOUT: u32 = 30;
    DEFAULT_TIMEOUT
}

fn main() {
    println!("超时：{} 秒", get_db_timeout());
    println!("超时：{} 秒", get_db_timeout());  // 不会重新初始化
}</code></pre></div>
<p><strong>关键特性：</strong></p>
<ul>
<li>每次调用函数时，static 不会重新初始化（只在首次调用时初始化）</li>
<li>外部无法直接访问这个 static（作用域限制）</li>
<li>这样既能保持全局状态，又能避免污染全局命名空间</li>
</ul>
<h2 id="可变-static">可变 static</h2>
<p>如果你需要一个可变的全局状态，可以用 <code>static mut</code>，但<strong>访问或修改都需要 <code>unsafe</code> 块</strong>。</p>
<h3 id="为什么需要-unsafe">为什么需要 unsafe</h3>
<p>静态变量存在于全局数据区。如果在多个线程中同时访问可变 static，会引发<strong>数据竞争</strong>（Data Race）。Rust 通过 <code>unsafe</code> 块要求你显式承认这个风险。</p>
<h3 id="例子">例子</h3>
<div class="code-runner" data-full-code="static%20mut%20COUNTER%3A%20i32%20%3D%200%3B%0A%0Afn%20increment()%20%7B%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20COUNTER%20%2B%3D%201%3B%0A%20%20%20%20%20%20%20%20println!(%22%E8%AE%A1%E6%95%B0%E5%99%A8%EF%BC%9A%7B%7D%22%2C%20COUNTER)%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20increment()%3B%0A%20%20%20%20increment()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">static mut COUNTER: i32 = 0;

fn increment() {
    unsafe {
        COUNTER += 1;
        println!("计数器：{}", COUNTER);
    }
}

fn main() {
    increment();
    increment();
}</code></pre></div>
<blockquote>
<p><strong>建议：</strong> 一般不推荐使用可变 static，因为容易引起并发问题。如果你需要全局可变状态，考虑其他方案（如 Mutex、线程本地存储等，后续会讲）。</p>
</blockquote>
<h1 id="const-vs-static全局变量的选择">const vs static：全局变量的选择</h1>
<h2 id="全局变量只能是-const-或-static">全局变量只能是 const 或 static</h2>
<p>在全局作用域（函数外），你<strong>不能用 <code>let</code></strong>，只能用 <code>const</code> 或 <code>static</code>。（函数内的话都可以使用）</p>
<div class="code-runner" data-full-code="%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81%E4%B8%8D%E8%83%BD%E5%9C%A8%E5%85%A8%E5%B1%80%E4%BD%9C%E7%94%A8%E5%9F%9F%E7%94%A8%20let%0Alet%20name%20%3D%20%22Alice%22%3B%0A%0Afn%20main()%20%7B%7D" data-mode="expect-error"><pre><code class="language-rust">// 错误！不能在全局作用域用 let
let name = "Alice";

fn main() {}</code></pre></div>
<p><strong>为什么？</strong> 全局变量的生命周期贯穿整个程序，编译器要求它要么是编译期已知的常数（const），要么是有特殊运行时特性的（static）。普通的 let 变量无法满足这一要求。</p>
<h2 id="const-vs-static-的本质区别">const vs static 的本质区别</h2>
<p>虽然 const 和 static 都可以在全局作用域使用，但它们的<strong>原理和用途完全不同</strong>。</p>
<h3 id="三种变量的对比">三种变量的对比</h3>
<div class="code-runner" data-full-code="%2F%2F%201.%20%E5%B1%80%E9%83%A8%20let%20%E5%8F%98%E9%87%8F%0Afn%20example_local()%20%7B%0A%20%20%20%20let%20name%20%3D%20%22Alice%22%3B%20%20%2F%2F%20%E6%AF%8F%E6%AC%A1%E8%B0%83%E7%94%A8%E9%83%BD%E9%87%8D%E6%96%B0%E5%88%9B%E5%BB%BA%0A%7D%0A%0A%2F%2F%202.%20%E5%85%A8%E5%B1%80%20const%0Aconst%20API_HOST%3A%20%26str%20%3D%20%22api.example.com%22%3B%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E6%9C%9F%E8%A2%AB%E5%86%85%E8%81%94%E5%88%B0%E6%AF%8F%E4%B8%AA%E4%BD%BF%E7%94%A8%E5%A4%84%0A%0A%2F%2F%203.%20%E5%85%A8%E5%B1%80%20static%0Astatic%20DATABASE_URL%3A%20%26str%20%3D%20%22postgres%3A%2F%2F...%22%3B%20%20%2F%2F%20%E5%9C%A8%E5%86%85%E5%AD%98%E7%9A%84%E5%9B%BA%E5%AE%9A%E5%9C%B0%E5%9D%80%EF%BC%8C%E7%A8%8B%E5%BA%8F%E5%90%AF%E5%8A%A8%E5%88%9B%E5%BB%BA%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20const%EF%BC%9A%E7%BC%96%E8%AF%91%E5%90%8E%E7%9A%84%E4%BA%8C%E8%BF%9B%E5%88%B6%E9%87%8C%E6%9C%89%E5%A4%9A%E4%B8%AA%20%22api.example.com%22%20%E5%89%AF%E6%9C%AC%0A%20%20%20%20println!(%22%7B%7D%22%2C%20API_HOST)%3B%0A%0A%20%20%20%20%2F%2F%20static%EF%BC%9A%E4%BA%8C%E8%BF%9B%E5%88%B6%E9%87%8C%E5%8F%AA%E6%9C%89%E4%B8%80%E4%B8%AA%20DATABASE_URL%EF%BC%8C%E6%89%80%E6%9C%89%E4%BB%A3%E7%A0%81%E6%8C%87%E5%90%91%E5%90%8C%E4%B8%80%E5%9C%B0%E5%9D%80%0A%20%20%20%20println!(%22%7B%7D%22%2C%20DATABASE_URL)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 1. 局部 let 变量
fn example_local() {
    let name = "Alice";  // 每次调用都重新创建
}

// 2. 全局 const
const API_HOST: &amp;str = "api.example.com";  // 编译期被内联到每个使用处

// 3. 全局 static
static DATABASE_URL: &amp;str = "postgres://...";  // 在内存的固定地址，程序启动创建

fn main() {
    // const：编译后的二进制里有多个 "api.example.com" 副本
    println!("{}", API_HOST);

    // static：二进制里只有一个 DATABASE_URL，所有代码指向同一地址
    println!("{}", DATABASE_URL);
}</code></pre></div>
<h3 id="const-vs-static-的核心区别">const vs static 的核心区别</h3>
<table><thead><tr><th>特性</th><th>const</th><th>static</th></tr></thead><tbody><tr><td><strong>存储位置</strong></td><td>编译期内联到代码中</td><td>程序内存中的固定地址</td></tr><tr><td><strong>运行时地址</strong></td><td>无地址（被替换为值）</td><td>有固定地址（<code>&amp;STATIC</code> 可取地址）</td></tr><tr><td><strong>性能</strong></td><td>零开销（直接是值）</td><td>通过地址访问（多一步寻址）</td></tr><tr><td><strong>生命周期</strong></td><td>编译期存在</td><td>程序从启动到结束</td></tr><tr><td><strong>作用域</strong></td><td>可以是局部（如函数内）</td><td>必须是全局</td></tr><tr><td><strong>可变性</strong></td><td>总是不可变</td><td>可以是 <code>static mut</code>（需 unsafe）</td></tr></tbody></table>
<p><strong>类比理解：</strong></p>
<ul>
<li><code>const</code> 像”直接数字替换”：<code>PI</code> 在使用处被替换为 <code>3.14159</code></li>
<li><code>static</code> 像”全局变量”：在内存中有一个固定盒子，所有地方都访问同一个地址</li>
</ul>
<h3 id="为什么-static-需要固定地址">为什么 static 需要固定地址</h3>
<div class="code-runner" data-full-code="const%20PI%3A%20f64%20%3D%203.14%3B%0Astatic%20VERSION%3A%20%26str%20%3D%20%221.0%22%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20const%20%E6%B2%A1%E6%9C%89%E5%9C%B0%E5%9D%80%EF%BC%8C%E6%97%A0%E6%B3%95%E5%8F%96%E5%BC%95%E7%94%A8%0A%20%20%20%20%2F%2F%20println!(%22%7B%3Ap%7D%22%2C%20%26PI)%3B%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%81%0A%0A%20%20%20%20%2F%2F%20static%20%E6%9C%89%E5%9C%B0%E5%9D%80%EF%BC%8C%E5%8F%AF%E4%BB%A5%E5%8F%96%E5%BC%95%E7%94%A8%0A%20%20%20%20println!(%22%E7%89%88%E6%9C%AC%E5%9C%B0%E5%9D%80%EF%BC%9A%7B%3Ap%7D%22%2C%20%26VERSION)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">const PI: f64 = 3.14;
static VERSION: &amp;str = "1.0";

fn main() {
    // const 没有地址，无法取引用
    // println!("{:p}", &amp;PI);  // 编译错误！

    // static 有地址，可以取引用
    println!("版本地址：{:p}", &amp;VERSION);
}</code></pre></div>
<p>const 因为被编译期内联了，根本不存在于运行时，所以没有地址。而 static 在内存中有真实的地址，因此可以被取引用。</p>
<h1 id="练习题">练习题</h1>
<pre><code class="language-rust">const PI: f64 = 3.14;
const RADIUS: i32 = 5;

fn main() {
    let area = PI * (RADIUS * RADIUS) as f64;
}</code></pre>
</div>
<pre><code class="language-rust">static COUNT: i32 = 0;
static NAME: String = String::from("App");</code></pre>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习-1定义应用配置常数">练习 1：定义应用配置常数</h3>
<p>为一个应用定义所有的配置常数：</p>
<div class="code-editor" data-block-id="04-custom-types/07-constants#3:3" data-expect-mode="literal" data-expect-pattern="%E5%BA%94%E7%94%A8%E9%85%8D%E7%BD%AE%EF%BC%9A%0A%20%20API%20%E4%B8%BB%E6%9C%BA%EF%BC%9Ahttps%3A%2F%2Fapi.example.com%0A%20%20%E8%B6%85%E6%97%B6%E6%97%B6%E9%97%B4%EF%BC%9A30%20%E7%A7%92%0A%20%20%E6%9C%80%E5%A4%A7%E9%87%8D%E8%AF%95%EF%BC%9A3%0A%20%20%E7%BC%93%E5%AD%98%EF%BC%9A%E5%90%AF%E7%94%A8%0A%20%20%E8%B0%83%E8%AF%95%EF%BC%9A%E5%85%B3%E9%97%AD" data-starter-code="%2F%2F%20TODO%3A%20%E5%AE%9A%E4%B9%89%E4%BB%A5%E4%B8%8B%E5%B8%B8%E6%95%B0%0A%2F%2F%20-%20API_HOST%3A%20%26str%20%3D%20%22https%3A%2F%2Fapi.example.com%22%0A%2F%2F%20-%20API_TIMEOUT%3A%20u64%20%3D%2030%EF%BC%88%E7%A7%92%EF%BC%89%0A%2F%2F%20-%20MAX_RETRIES%3A%20u32%20%3D%203%0A%2F%2F%20-%20CACHE_ENABLED%3A%20bool%20%3D%20true%0A%2F%2F%20-%20DEBUG%3A%20bool%20%3D%20false%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%E5%BA%94%E7%94%A8%E9%85%8D%E7%BD%AE%EF%BC%9A%22)%3B%0A%20%20%20%20println!(%22%20%20API%20%E4%B8%BB%E6%9C%BA%EF%BC%9A%7B%7D%22%2C%20API_HOST)%3B%0A%20%20%20%20println!(%22%20%20%E8%B6%85%E6%97%B6%E6%97%B6%E9%97%B4%EF%BC%9A%7B%7D%20%E7%A7%92%22%2C%20API_TIMEOUT)%3B%0A%20%20%20%20println!(%22%20%20%E6%9C%80%E5%A4%A7%E9%87%8D%E8%AF%95%EF%BC%9A%7B%7D%22%2C%20MAX_RETRIES)%3B%0A%20%20%20%20println!(%22%20%20%E7%BC%93%E5%AD%98%EF%BC%9A%7B%7D%22%2C%20if%20CACHE_ENABLED%20%7B%20%22%E5%90%AF%E7%94%A8%22%20%7D%20else%20%7B%20%22%E7%A6%81%E7%94%A8%22%20%7D)%3B%0A%20%20%20%20println!(%22%20%20%E8%B0%83%E8%AF%95%EF%BC%9A%7B%7D%22%2C%20if%20DEBUG%20%7B%20%22%E5%BC%80%E5%90%AF%22%20%7D%20else%20%7B%20%22%E5%85%B3%E9%97%AD%22%20%7D)%3B%0A%7D"><pre><code class="language-rust">// TODO: 定义以下常数
// - API_HOST: &amp;str = "https://api.example.com"
// - API_TIMEOUT: u64 = 30（秒）
// - MAX_RETRIES: u32 = 3
// - CACHE_ENABLED: bool = true
// - DEBUG: bool = false

fn main() {
    println!("应用配置：");
    println!("  API 主机：{}", API_HOST);
    println!("  超时时间：{} 秒", API_TIMEOUT);
    println!("  最大重试：{}", MAX_RETRIES);
    println!("  缓存：{}", if CACHE_ENABLED { "启用" } else { "禁用" });
    println!("  调试：{}", if DEBUG { "开启" } else { "关闭" });
}</code></pre></div>
<h3 id="练习-2使用常数表达式">练习 2：使用常数表达式</h3>
<p>定义与时间相关的常数，并计算衍生常数：</p>
<div class="code-editor" data-block-id="04-custom-types/07-constants#3:4" data-expect-mode="literal" data-expect-pattern="%E6%97%B6%E9%97%B4%E5%8D%95%E4%BD%8D%E6%8D%A2%E7%AE%97%EF%BC%9A%0A%20%20%E6%AF%8F%E5%88%86%E9%92%9F%E7%A7%92%E6%95%B0%EF%BC%9A60%0A%20%20%E6%AF%8F%E5%B0%8F%E6%97%B6%E7%A7%92%E6%95%B0%EF%BC%9A3600%0A%20%20%E6%AF%8F%E5%A4%A9%E7%A7%92%E6%95%B0%EF%BC%9A86400%0A%20%20%E6%AF%8F%E5%A4%A9%E5%88%86%E9%92%9F%E6%95%B0%EF%BC%9A1440" data-starter-code="const%20SECONDS_PER_MINUTE%3A%20u32%20%3D%2060%3B%0Aconst%20MINUTES_PER_HOUR%3A%20u32%20%3D%2060%3B%0Aconst%20HOURS_PER_DAY%3A%20u32%20%3D%2024%3B%0A%0A%2F%2F%20TODO%3A%20%E5%AE%9A%E4%B9%89%E8%A1%8D%E7%94%9F%E5%B8%B8%E6%95%B0%0A%2F%2F%20-%20SECONDS_PER_HOUR%0A%2F%2F%20-%20SECONDS_PER_DAY%0A%2F%2F%20-%20MINUTES_PER_DAY%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%E6%97%B6%E9%97%B4%E5%8D%95%E4%BD%8D%E6%8D%A2%E7%AE%97%EF%BC%9A%22)%3B%0A%20%20%20%20println!(%22%20%20%E6%AF%8F%E5%88%86%E9%92%9F%E7%A7%92%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20SECONDS_PER_MINUTE)%3B%0A%20%20%20%20println!(%22%20%20%E6%AF%8F%E5%B0%8F%E6%97%B6%E7%A7%92%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20SECONDS_PER_HOUR)%3B%0A%20%20%20%20println!(%22%20%20%E6%AF%8F%E5%A4%A9%E7%A7%92%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20SECONDS_PER_DAY)%3B%0A%20%20%20%20println!(%22%20%20%E6%AF%8F%E5%A4%A9%E5%88%86%E9%92%9F%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20MINUTES_PER_DAY)%3B%0A%7D"><pre><code class="language-rust">const SECONDS_PER_MINUTE: u32 = 60;
const MINUTES_PER_HOUR: u32 = 60;
const HOURS_PER_DAY: u32 = 24;

// TODO: 定义衍生常数
// - SECONDS_PER_HOUR
// - SECONDS_PER_DAY
// - MINUTES_PER_DAY

fn main() {
    println!("时间单位换算：");
    println!("  每分钟秒数：{}", SECONDS_PER_MINUTE);
    println!("  每小时秒数：{}", SECONDS_PER_HOUR);
    println!("  每天秒数：{}", SECONDS_PER_DAY);
    println!("  每天分钟数：{}", MINUTES_PER_DAY);
}</code></pre></div> 