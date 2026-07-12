---
title: "关联类型"
description: "高级主题 - 关联类型"
date: "2026-07-12"
order: 22001
tags: ["关联类型", "trait 关联类型", "Iterator::Item"]
est_time: "25 分钟"
---

 <h1 id="从问题出发">从问题出发</h1>
<h2 id="需求输出类型随实现者变化">需求：输出类型随实现者变化</h2>
<p>假设你在写三种”转换器”，它们都接受一个 <code>i32</code>，但输出不同：</p>
<table><thead><tr><th>转换器</th><th>输入</th><th>输出</th><th>输出类型</th></tr></thead><tbody><tr><td><code>Double</code></td><td><code>5</code></td><td><code>10</code></td><td><code>i32</code></td></tr><tr><td><code>Stringify</code></td><td><code>5</code></td><td><code>"5"</code></td><td><code>String</code></td></tr><tr><td><code>IsEven</code></td><td><code>5</code></td><td><code>false</code></td><td><code>bool</code></td></tr></tbody></table>
<p>三种都是”转换器”，你想用一个 trait 统一表达这个概念：</p>
<pre><code class="language-rust">trait Converter {
    fn convert(&amp;self, input: i32) -&gt; ???; // 输出类型怎么写？
}</code></pre>
<p>问题来了：<code>Double</code> 输出 <code>i32</code>，<code>Stringify</code> 输出 <code>String</code>，<code>IsEven</code> 输出 <code>bool</code>——没法写死一个具体类型。</p>
<h2 id="第一次尝试impl-trait">第一次尝试：impl Trait</h2>
<p>你学过 <code>impl Trait</code> 可以让返回类型灵活，试一下：</p>
<div class="code-runner" data-full-code="trait%20Converter%20%7B%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20impl%20std%3A%3Afmt%3A%3ADisplay%3B%20%2F%2F%20%E2%9D%8C%0A%7D%0Afn%20main()%20%7B%7D" data-has-hidden="true" data-mode="expect-error"><pre><code class="language-rust">trait Converter {
    fn convert(&amp;self, input: i32) -&gt; impl std::fmt::Display; // ❌
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">trait</span><span style="color:#B392F0"> Converter</span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#F97583">    fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#F97583"> impl</span><span style="color:#B392F0"> std</span><span style="color:#F97583">::</span><span style="color:#B392F0">fmt</span><span style="color:#F97583">::</span><span style="color:#B392F0">Display</span><span style="color:#E1E4E8">; </span><span style="color:#6A737D">// ❌</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {}</span></span></div></div>
<p>报错了。<code>impl Trait</code> 可以用在<strong>普通函数</strong>的返回值位置，但 <strong>trait 方法里不允许</strong>这样写。这条路走不通。并且这里只能返回 Display，但我们希望输出的是类型，所以也不满足需求。</p>
<h2 id="第二次尝试泛型参数">第二次尝试：泛型参数</h2>
<p>你也学过泛型，把输出类型变成类型参数 <code>Output</code>：</p>
<div class="code-runner" data-full-code="trait%20Converter%3COutput%3E%20%7B%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20Output%3B%0A%7D%0A%0Astruct%20Double%3B%0Astruct%20Stringify%3B%0A%0Aimpl%20Converter%3Ci32%3E%20for%20Double%20%7B%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20i32%20%7B%20input%20*%202%20%7D%0A%7D%0A%0Aimpl%20Converter%3CString%3E%20for%20Stringify%20%7B%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20String%20%7B%20input.to_string()%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20Double.convert(5))%3B%20%20%20%20%2F%2F%2010%0A%20%20%20%20println!(%22%7B%7D%22%2C%20Stringify.convert(5))%3B%20%2F%2F%205%0A%7D" data-mode="run"><pre><code class="language-rust">trait Converter&lt;Output&gt; {
    fn convert(&amp;self, input: i32) -&gt; Output;
}

struct Double;
struct Stringify;

impl Converter&lt;i32&gt; for Double {
    fn convert(&amp;self, input: i32) -&gt; i32 { input * 2 }
}

impl Converter&lt;String&gt; for Stringify {
    fn convert(&amp;self, input: i32) -&gt; String { input.to_string() }
}

fn main() {
    println!("{}", Double.convert(5));    // 10
    println!("{}", Stringify.convert(5)); // 5
}</code></pre></div>
<p>能运行！但藏着一个语义问题。</p>
<h2 id="泛型参数的语义问题">泛型参数的语义问题</h2>
<p>用 <code>Converter&lt;Output&gt;</code> 时，<code>Output</code> 是<strong>外部传入的</strong>——这意味着调用方可以随意决定 <code>Output</code> 是什么。没有任何东西阻止你为同一个 <code>Double</code> 实现两个版本：</p>
<div class="code-runner" data-full-code="trait%20Converter%3COutput%3E%20%7B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20Output%3B%20%7D%0Astruct%20Double%3B%0Aimpl%20Converter%3Ci32%3E%20for%20Double%20%7B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20i32%20%7B%20input%20*%202%20%7D%20%7D%0A%0A%2F%2F%20%E5%AE%8C%E5%85%A8%E5%90%88%E6%B3%95%E2%80%94%E2%80%94Double%20%E7%8E%B0%E5%9C%A8%E5%8F%88%E5%A4%9A%E4%BA%86%E4%B8%80%E4%B8%AA%20String%20%E7%89%88%E6%9C%AC%0Aimpl%20Converter%3CString%3E%20for%20Double%20%7B%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20String%20%7B%0A%20%20%20%20%20%20%20%20format!(%22%E7%BB%93%E6%9E%9C%E6%98%AF%20%7B%7D%22%2C%20input%20*%202)%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20n%3A%20i32%20%3D%20Double.convert(5)%3B%20%20%20%20%2F%2F%2010%0A%20%20%20%20let%20s%3A%20String%20%3D%20Double.convert(5)%3B%20%2F%2F%20%E7%BB%93%E6%9E%9C%E6%98%AF%2010%0A%20%20%20%20println!(%22%7B%7D%22%2C%20n)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D" data-has-hidden="true" data-mode="run"><pre><code class="language-rust">// 完全合法——Double 现在又多了一个 String 版本
impl Converter&lt;String&gt; for Double {
    fn convert(&amp;self, input: i32) -&gt; String {
        format!("结果是 {}", input * 2)
    }
}

fn main() {
    let n: i32 = Double.convert(5);    // 10
    let s: String = Double.convert(5); // 结果是 10
    println!("{}", n);
    println!("{}", s);
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">trait</span><span style="color:#B392F0"> Converter</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">Output</span><span style="color:#E1E4E8">&gt; { </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> Output</span><span style="color:#E1E4E8">; }</span></span>
<span class="line"><span style="color:#F97583">struct</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#F97583">impl</span><span style="color:#B392F0"> Converter</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">i32</span><span style="color:#E1E4E8">&gt; </span><span style="color:#F97583">for</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8"> { </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8"> { input </span><span style="color:#F97583">*</span><span style="color:#79B8FF"> 2</span><span style="color:#E1E4E8"> } }</span></span>

<span class="line"><span style="color:#6A737D">// 完全合法——Double 现在又多了一个 String 版本</span></span>
<span class="line"><span style="color:#F97583">impl</span><span style="color:#B392F0"> Converter</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">String</span><span style="color:#E1E4E8">&gt; </span><span style="color:#F97583">for</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#F97583">    fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> String</span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#B392F0">        format!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"结果是 {}"</span><span style="color:#E1E4E8">, input </span><span style="color:#F97583">*</span><span style="color:#79B8FF"> 2</span><span style="color:#E1E4E8">)</span></span>
<span class="line"><span style="color:#E1E4E8">    }</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>

<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {</span></span>
<span class="line"><span style="color:#F97583">    let</span><span style="color:#E1E4E8"> n</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> Double</span><span style="color:#F97583">.</span><span style="color:#B392F0">convert</span><span style="color:#E1E4E8">(</span><span style="color:#79B8FF">5</span><span style="color:#E1E4E8">);    </span><span style="color:#6A737D">// 10</span></span>
<span class="line"><span style="color:#F97583">    let</span><span style="color:#E1E4E8"> s</span><span style="color:#F97583">:</span><span style="color:#B392F0"> String</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> Double</span><span style="color:#F97583">.</span><span style="color:#B392F0">convert</span><span style="color:#E1E4E8">(</span><span style="color:#79B8FF">5</span><span style="color:#E1E4E8">); </span><span style="color:#6A737D">// 结果是 10</span></span>
<span class="line"><span style="color:#B392F0">    println!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"{}"</span><span style="color:#E1E4E8">, n);</span></span>
<span class="line"><span style="color:#B392F0">    println!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"{}"</span><span style="color:#E1E4E8">, s);</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></div></div>
<p>同一个 <code>Double</code>，既能输出 <code>i32</code>，又能输出 <code>String</code>。<strong>但一个”翻倍转换器”在逻辑上只应该有一种输出</strong>——这个设计允许了不该允许的事。</p>
<h2 id="调用时还要手动指定-output-的问题">调用时还要手动指定 Output 的问题</h2>
<p>更头疼的是，当你想写一个通用函数”运行任意转换器并打印结果”时：</p>
<div class="code-runner" data-full-code="trait%20Converter%3COutput%3E%20%7B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20Output%3B%20%7D%0Astruct%20Double%3B%0Aimpl%20Converter%3Ci32%3E%20for%20Double%20%7B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20i32%20%7B%20input%20*%202%20%7D%20%7D%0Ause%20std%3A%3Afmt%3A%3ADisplay%3B%0A%0Afn%20run%3CC%2C%20Output%3E(c%3A%20C%2C%20input%3A%20i32)%0Awhere%0A%20%20%20%20C%3A%20Converter%3COutput%3E%2C%0A%20%20%20%20Output%3A%20Display%2C%0A%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20c.convert(input))%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20run%3A%3A%3CDouble%2C%20i32%3E(Double%2C%205)%3B%20%2F%2F%20%E5%BF%85%E9%A1%BB%E6%89%8B%E5%8A%A8%E7%94%A8%20turbofish%20%E6%8C%87%E5%AE%9A%20Output%20%3D%20i32%0A%7D" data-mode="run"><pre><code class="language-rust">trait Converter&lt;Output&gt; { fn convert(&amp;self, input: i32) -&gt; Output; }
struct Double;
impl Converter&lt;i32&gt; for Double { fn convert(&amp;self, input: i32) -&gt; i32 { input * 2 } }
use std::fmt::Display;

fn run&lt;C, Output&gt;(c: C, input: i32)
where
    C: Converter&lt;Output&gt;,
    Output: Display,
{
    println!("{}", c.convert(input));
}

fn main() {
    run::&lt;Double, i32&gt;(Double, 5); // 必须手动用 turbofish 指定 Output = i32
}</code></pre></div>
<p>代码能运行，但看调用那行：</p>
<pre><code class="language-rust">impl Converter&lt;i32&gt; for Double { ... }  // 这里已经写了：Double 的输出是 i32
run::&lt;Double, i32&gt;(Double, 5);          // 这里又写了一遍：i32</code></pre>
<p>同一个 <code>i32</code> 出现了两次。第一次是 <code>Double</code> 的实现里写死的，第二次是调用方在 turbofish 里手动再指定一遍。</p>
<p>编译器本来可以从 <code>impl Converter&lt;i32&gt; for Double</code> 这行自己推出 <code>Output = i32</code>，但用泛型参数 <code>Converter&lt;Output&gt;</code> 时，<code>Output</code> 是”外部参数”，由调用方决定，编译器不敢自作主张——所以它要求你再写一遍。</p>
<h2 id="问题归纳">问题归纳</h2>
<p>总结一下，<code>trait Converter&lt;Output&gt;</code> 的泛型参数方案有两个问题：</p>
<ol>
<li><strong>语义不匹配</strong>：允许同一个类型对同一个 trait 实现多次（不同的 <code>Output</code>）——但”翻倍转换器”在逻辑上只应该有一种输出，泛型参数无法在语言层面阻止你意外添加第二种实现</li>
<li><strong>调用繁琐</strong>：通用函数需要多一个类型参数 <code>Output</code>，调用时还要手动用 turbofish 再写一遍已经在实现里指定过的类型</li>
</ol>
<p>这两个问题都源于同一根源：泛型参数把 <code>Output</code> 当成”调用方传入的信息”，而不是”实现者自己的信息”。这正是泛型参数方案的根本缺陷，而<strong>关联类型</strong>就是专门为此设计的解决方案。</p>
<h1 id="关联类型把输出类型绑定到实现者">关联类型：把输出类型绑定到实现者</h1>
<p>问题的根源在于：用泛型参数时，输出类型是”外部信息”，任何人都能指定。但它本应是”内部信息”，由每个实现者自己锁定，外部无权干涉。</p>
<p><strong>关联类型</strong>就是为此而设计的——在 trait 里留一个”类型槽”，由每个实现者填入，填完就锁死：</p>
<pre><code class="language-rust">trait Converter {
    type Output;                                   // 声明一个类型槽
    fn convert(&amp;self, input: i32) -&gt; Self::Output; // 方法返回这个槽里的类型
}</code></pre>
<p>语法只有两个新东西：</p>
<ul>
<li><strong><code>type Output;</code></strong> — 声明类型槽，名字叫 <code>Output</code>，具体是什么类型留给实现者填</li>
<li><strong><code>Self::Output</code></strong> — 引用这个槽（<code>Self</code> 是”当前这个实现者”，<code>Self::Output</code> 就是”它填入的类型”）</li>
</ul>
<p>实现时，在 <code>impl</code> 块里用 <code>type Output = 具体类型</code> 填入。写法和泛型版本差不多，优势体现在两件事上——编译器能保证每个类型只有一种实现，以及调用通用函数时不再需要 turbofish。先看实现：</p>
<div class="code-runner" data-full-code="trait%20Converter%20%7B%0A%20%20%20%20type%20Output%3B%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20Self%3A%3AOutput%3B%0A%7D%0A%0Astruct%20Double%3B%0Astruct%20Stringify%3B%0Astruct%20IsEven%3B%0A%0Aimpl%20Converter%20for%20Double%20%7B%0A%20%20%20%20type%20Output%20%3D%20i32%3B%20%20%20%20%2F%2F%20Double%20%E5%A1%AB%E5%85%A5%EF%BC%9A%E8%BE%93%E5%87%BA%E6%98%AF%20i32%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20i32%20%7B%20input%20*%202%20%7D%0A%7D%0A%0Aimpl%20Converter%20for%20Stringify%20%7B%0A%20%20%20%20type%20Output%20%3D%20String%3B%20%2F%2F%20Stringify%20%E5%A1%AB%E5%85%A5%EF%BC%9A%E8%BE%93%E5%87%BA%E6%98%AF%20String%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20String%20%7B%20input.to_string()%20%7D%0A%7D%0A%0Aimpl%20Converter%20for%20IsEven%20%7B%0A%20%20%20%20type%20Output%20%3D%20bool%3B%20%20%20%2F%2F%20IsEven%20%E5%A1%AB%E5%85%A5%EF%BC%9A%E8%BE%93%E5%87%BA%E6%98%AF%20bool%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20bool%20%7B%20input%20%25%202%20%3D%3D%200%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20Double.convert(5))%3B%20%20%20%20%2F%2F%2010%0A%20%20%20%20println!(%22%7B%7D%22%2C%20Stringify.convert(5))%3B%20%2F%2F%205%0A%20%20%20%20println!(%22%7B%7D%22%2C%20IsEven.convert(4))%3B%20%20%20%20%2F%2F%20true%0A%20%20%20%20println!(%22%7B%7D%22%2C%20IsEven.convert(5))%3B%20%20%20%20%2F%2F%20false%0A%7D" data-mode="run"><pre><code class="language-rust">trait Converter {
    type Output;
    fn convert(&amp;self, input: i32) -&gt; Self::Output;
}

struct Double;
struct Stringify;
struct IsEven;

impl Converter for Double {
    type Output = i32;    // Double 填入：输出是 i32
    fn convert(&amp;self, input: i32) -&gt; i32 { input * 2 }
}

impl Converter for Stringify {
    type Output = String; // Stringify 填入：输出是 String
    fn convert(&amp;self, input: i32) -&gt; String { input.to_string() }
}

impl Converter for IsEven {
    type Output = bool;   // IsEven 填入：输出是 bool
    fn convert(&amp;self, input: i32) -&gt; bool { input % 2 == 0 }
}

fn main() {
    println!("{}", Double.convert(5));    // 10
    println!("{}", Stringify.convert(5)); // 5
    println!("{}", IsEven.convert(4));    // true
    println!("{}", IsEven.convert(5));    // false
}</code></pre></div>
<p>现在尝试为 <code>Double</code> 再实现一次不同的输出——编译器直接拒绝：</p>
<div class="code-runner" data-full-code="trait%20Converter%20%7B%20type%20Output%3B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20Self%3A%3AOutput%3B%20%7D%0Astruct%20Double%3B%0Aimpl%20Converter%20for%20Double%20%7B%20type%20Output%20%3D%20i32%3B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20i32%20%7B%20input%20*%202%20%7D%20%7D%0A%0Aimpl%20Converter%20for%20Double%20%7B%20%20%20%20%20%20%20%20%2F%2F%20%E2%9D%8C%20Double%20%E5%B7%B2%E7%BB%8F%E5%AE%9E%E7%8E%B0%E4%BA%86%20Converter%EF%BC%8C%E4%B8%8D%E8%83%BD%E5%86%8D%E5%AE%9E%E7%8E%B0%E4%B8%80%E6%AC%A1%0A%20%20%20%20type%20Output%20%3D%20String%3B%0A%20%20%20%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20String%20%7B%20input.to_string()%20%7D%0A%7D%0Afn%20main()%20%7B%7D" data-has-hidden="true" data-mode="expect-error"><pre><code class="language-rust">impl Converter for Double {        // ❌ Double 已经实现了 Converter，不能再实现一次
    type Output = String;
    fn convert(&amp;self, input: i32) -&gt; String { input.to_string() }
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">trait</span><span style="color:#B392F0"> Converter</span><span style="color:#E1E4E8"> { </span><span style="color:#F97583">type</span><span style="color:#B392F0"> Output</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#79B8FF"> Self</span><span style="color:#F97583">::</span><span style="color:#B392F0">Output</span><span style="color:#E1E4E8">; }</span></span>
<span class="line"><span style="color:#F97583">struct</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#F97583">impl</span><span style="color:#B392F0"> Converter</span><span style="color:#F97583"> for</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8"> { </span><span style="color:#F97583">type</span><span style="color:#B392F0"> Output</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8"> { input </span><span style="color:#F97583">*</span><span style="color:#79B8FF"> 2</span><span style="color:#E1E4E8"> } }</span></span>

<span class="line"><span style="color:#F97583">impl</span><span style="color:#B392F0"> Converter</span><span style="color:#F97583"> for</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8"> {        </span><span style="color:#6A737D">// ❌ Double 已经实现了 Converter，不能再实现一次</span></span>
<span class="line"><span style="color:#F97583">    type</span><span style="color:#B392F0"> Output</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> String</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#F97583">    fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> String</span><span style="color:#E1E4E8"> { input</span><span style="color:#F97583">.</span><span style="color:#B392F0">to_string</span><span style="color:#E1E4E8">() }</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {}</span></span></div></div>
<p>关联类型从语言层面保证了”一个类型对一个 trait 只有一种实现”，语义正确。</p>
<h2 id="在泛型函数里使用">在泛型函数里使用</h2>
<h3 id="引用关联类型coutput">引用关联类型：C::Output</h3>
<p>关联类型有名字，所以在泛型函数里可以用 <code>类型::关联类型名</code> 来引用它。</p>
<p>比如 <code>C::Output</code> 的意思是：“C 这个类型，它填入的 Output 类型是什么”。</p>
<p>来看之前那个通用函数，现在用关联类型写：</p>
<p>先看不加任何约束会怎样：</p>
<div class="code-runner" data-full-code="trait%20Converter%20%7B%20type%20Output%3B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20Self%3A%3AOutput%3B%20%7D%0Astruct%20Double%3B%0Aimpl%20Converter%20for%20Double%20%7B%20type%20Output%20%3D%20i32%3B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20i32%20%7B%20input%20*%202%20%7D%20%7D%0A%0Afn%20run%3CC%3A%20Converter%3E(c%3A%20C%2C%20input%3A%20i32)%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20c.convert(input))%3B%20%2F%2F%20%E2%9D%8C%20%E4%B8%8D%E7%9F%A5%E9%81%93%20Output%20%E6%9C%89%E6%B2%A1%E6%9C%89%E5%AE%9E%E7%8E%B0%20Display%0A%7D%0Afn%20main()%20%7B%7D" data-has-hidden="true" data-mode="expect-error"><pre><code class="language-rust">fn run&lt;C: Converter&gt;(c: C, input: i32) {
    println!("{}", c.convert(input)); // ❌ 不知道 Output 有没有实现 Display
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">trait</span><span style="color:#B392F0"> Converter</span><span style="color:#E1E4E8"> { </span><span style="color:#F97583">type</span><span style="color:#B392F0"> Output</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#79B8FF"> Self</span><span style="color:#F97583">::</span><span style="color:#B392F0">Output</span><span style="color:#E1E4E8">; }</span></span>
<span class="line"><span style="color:#F97583">struct</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#F97583">impl</span><span style="color:#B392F0"> Converter</span><span style="color:#F97583"> for</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8"> { </span><span style="color:#F97583">type</span><span style="color:#B392F0"> Output</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8"> { input </span><span style="color:#F97583">*</span><span style="color:#79B8FF"> 2</span><span style="color:#E1E4E8"> } }</span></span>

<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> run</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">C</span><span style="color:#F97583">:</span><span style="color:#B392F0"> Converter</span><span style="color:#E1E4E8">&gt;(c</span><span style="color:#F97583">:</span><span style="color:#B392F0"> C</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) {</span></span>
<span class="line"><span style="color:#B392F0">    println!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"{}"</span><span style="color:#E1E4E8">, c</span><span style="color:#F97583">.</span><span style="color:#B392F0">convert</span><span style="color:#E1E4E8">(input)); </span><span style="color:#6A737D">// ❌ 不知道 Output 有没有实现 Display</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {}</span></span></div></div>
<p><code>c.convert(input)</code> 返回的是”C 填入的 Output 类型”，但我们没说它能打印，所以报错。</p>
<p>加上约束——用 <code>C::Output: Display</code> 告诉编译器”C 的 Output 必须实现 Display”：</p>
<div class="code-runner" data-full-code="trait%20Converter%20%7B%20type%20Output%3B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20Self%3A%3AOutput%3B%20%7D%0Astruct%20Double%3B%20struct%20Stringify%3B%20struct%20IsEven%3B%0Aimpl%20Converter%20for%20Double%20%7B%20type%20Output%20%3D%20i32%3B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20i32%20%7B%20input%20*%202%20%7D%20%7D%0Aimpl%20Converter%20for%20Stringify%20%7B%20type%20Output%20%3D%20String%3B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20String%20%7B%20input.to_string()%20%7D%20%7D%0Aimpl%20Converter%20for%20IsEven%20%7B%20type%20Output%20%3D%20bool%3B%20fn%20convert(%26self%2C%20input%3A%20i32)%20-%3E%20bool%20%7B%20input%20%25%202%20%3D%3D%200%20%7D%20%7D%0Ause%20std%3A%3Afmt%3A%3ADisplay%3B%0A%0Afn%20run%3CC%3E(c%3A%20C%2C%20input%3A%20i32)%0Awhere%0A%20%20%20%20C%3A%20Converter%2C%0A%20%20%20%20C%3A%3AOutput%3A%20Display%2C%20%2F%2F%20C%20%E8%87%AA%E5%B7%B1%E5%A1%AB%E7%9A%84%20Output%EF%BC%8C%E5%BF%85%E9%A1%BB%E5%AE%9E%E7%8E%B0%20Display%0A%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20c.convert(input))%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20run(Double%2C%205)%3B%20%20%20%20%2F%2F%2010%20%20%20%E2%80%94%20Double%3A%3AOutput%20%3D%20i32%EF%BC%8Ci32%20%E5%AE%9E%E7%8E%B0%E4%BA%86%20Display%20%E2%9C%85%0A%20%20%20%20run(Stringify%2C%205)%3B%20%2F%2F%205%20%20%20%20%E2%80%94%20Stringify%3A%3AOutput%20%3D%20String%EF%BC%8CString%20%E5%AE%9E%E7%8E%B0%E4%BA%86%20Display%20%E2%9C%85%0A%20%20%20%20run(IsEven%2C%204)%3B%20%20%20%20%2F%2F%20true%20%E2%80%94%20IsEven%3A%3AOutput%20%3D%20bool%EF%BC%8Cbool%20%E5%AE%9E%E7%8E%B0%E4%BA%86%20Display%20%E2%9C%85%0A%20%20%20%20%2F%2F%20%E8%B0%83%E7%94%A8%E6%97%B6%E4%B8%8D%E9%9C%80%E8%A6%81%E6%8C%87%E5%AE%9A%20Output%EF%BC%8C%E7%BC%96%E8%AF%91%E5%99%A8%E4%BB%8E%E5%90%84%E8%87%AA%E7%9A%84%E5%AE%9E%E7%8E%B0%E9%87%8C%E8%87%AA%E5%8A%A8%E6%8E%A8%E5%AF%BC%0A%7D" data-has-hidden="true" data-mode="run"><pre><code class="language-rust">use std::fmt::Display;

fn run&lt;C&gt;(c: C, input: i32)
where
    C: Converter,
    C::Output: Display, // C 自己填的 Output，必须实现 Display
{
    println!("{}", c.convert(input));
}

fn main() {
    run(Double, 5);    // 10   — Double::Output = i32，i32 实现了 Display ✅
    run(Stringify, 5); // 5    — Stringify::Output = String，String 实现了 Display ✅
    run(IsEven, 4);    // true — IsEven::Output = bool，bool 实现了 Display ✅
    // 调用时不需要指定 Output，编译器从各自的实现里自动推导
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">trait</span><span style="color:#B392F0"> Converter</span><span style="color:#E1E4E8"> { </span><span style="color:#F97583">type</span><span style="color:#B392F0"> Output</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#79B8FF"> Self</span><span style="color:#F97583">::</span><span style="color:#B392F0">Output</span><span style="color:#E1E4E8">; }</span></span>
<span class="line"><span style="color:#F97583">struct</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">struct</span><span style="color:#B392F0"> Stringify</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">struct</span><span style="color:#B392F0"> IsEven</span><span style="color:#E1E4E8">;</span></span>
<span class="line"><span style="color:#F97583">impl</span><span style="color:#B392F0"> Converter</span><span style="color:#F97583"> for</span><span style="color:#B392F0"> Double</span><span style="color:#E1E4E8"> { </span><span style="color:#F97583">type</span><span style="color:#B392F0"> Output</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8"> { input </span><span style="color:#F97583">*</span><span style="color:#79B8FF"> 2</span><span style="color:#E1E4E8"> } }</span></span>
<span class="line"><span style="color:#F97583">impl</span><span style="color:#B392F0"> Converter</span><span style="color:#F97583"> for</span><span style="color:#B392F0"> Stringify</span><span style="color:#E1E4E8"> { </span><span style="color:#F97583">type</span><span style="color:#B392F0"> Output</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> String</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> String</span><span style="color:#E1E4E8"> { input</span><span style="color:#F97583">.</span><span style="color:#B392F0">to_string</span><span style="color:#E1E4E8">() } }</span></span>
<span class="line"><span style="color:#F97583">impl</span><span style="color:#B392F0"> Converter</span><span style="color:#F97583"> for</span><span style="color:#B392F0"> IsEven</span><span style="color:#E1E4E8"> { </span><span style="color:#F97583">type</span><span style="color:#B392F0"> Output</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> bool</span><span style="color:#E1E4E8">; </span><span style="color:#F97583">fn</span><span style="color:#B392F0"> convert</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">&amp;</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> bool</span><span style="color:#E1E4E8"> { input </span><span style="color:#F97583">%</span><span style="color:#79B8FF"> 2</span><span style="color:#F97583"> ==</span><span style="color:#79B8FF"> 0</span><span style="color:#E1E4E8"> } }</span></span>
<span class="line"><span style="color:#F97583">use</span><span style="color:#B392F0"> std</span><span style="color:#F97583">::</span><span style="color:#B392F0">fmt</span><span style="color:#F97583">::</span><span style="color:#B392F0">Display</span><span style="color:#E1E4E8">;</span></span>

<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> run</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">C</span><span style="color:#E1E4E8">&gt;(c</span><span style="color:#F97583">:</span><span style="color:#B392F0"> C</span><span style="color:#E1E4E8">, input</span><span style="color:#F97583">:</span><span style="color:#B392F0"> i32</span><span style="color:#E1E4E8">)</span></span>
<span class="line"><span style="color:#F97583">where</span></span>
<span class="line"><span style="color:#B392F0">    C</span><span style="color:#F97583">:</span><span style="color:#B392F0"> Converter</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#B392F0">    C</span><span style="color:#F97583">::</span><span style="color:#B392F0">Output</span><span style="color:#F97583">:</span><span style="color:#B392F0"> Display</span><span style="color:#E1E4E8">, </span><span style="color:#6A737D">// C 自己填的 Output，必须实现 Display</span></span>
<span class="line"><span style="color:#E1E4E8">{</span></span>
<span class="line"><span style="color:#B392F0">    println!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"{}"</span><span style="color:#E1E4E8">, c</span><span style="color:#F97583">.</span><span style="color:#B392F0">convert</span><span style="color:#E1E4E8">(input));</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>

<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {</span></span>
<span class="line"><span style="color:#B392F0">    run</span><span style="color:#E1E4E8">(</span><span style="color:#B392F0">Double</span><span style="color:#E1E4E8">, </span><span style="color:#79B8FF">5</span><span style="color:#E1E4E8">);    </span><span style="color:#6A737D">// 10   — Double::Output = i32，i32 实现了 Display ✅</span></span>
<span class="line"><span style="color:#B392F0">    run</span><span style="color:#E1E4E8">(</span><span style="color:#B392F0">Stringify</span><span style="color:#E1E4E8">, </span><span style="color:#79B8FF">5</span><span style="color:#E1E4E8">); </span><span style="color:#6A737D">// 5    — Stringify::Output = String，String 实现了 Display ✅</span></span>
<span class="line"><span style="color:#B392F0">    run</span><span style="color:#E1E4E8">(</span><span style="color:#B392F0">IsEven</span><span style="color:#E1E4E8">, </span><span style="color:#79B8FF">4</span><span style="color:#E1E4E8">);    </span><span style="color:#6A737D">// true — IsEven::Output = bool，bool 实现了 Display ✅</span></span>
<span class="line"><span style="color:#6A737D">    // 调用时不需要指定 Output，编译器从各自的实现里自动推导</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></div></div>
<p>对比之前泛型参数的版本：</p>
<table><thead><tr><th></th><th>泛型参数 <code>Converter&lt;Output&gt;</code></th><th>关联类型 <code>Converter { type Output }</code></th></tr></thead><tbody><tr><td>Output 由谁决定</td><td>调用方</td><td>实现者</td></tr><tr><td>同一类型能实现几次</td><td>可以多次（不同 Output）</td><td>只能一次</td></tr><tr><td>通用函数需要几个类型参数</td><td><code>fn run&lt;C, Output&gt;</code></td><td><code>fn run&lt;C&gt;</code></td></tr><tr><td>函数调用</td><td><code>run::&lt;Double, i32&gt;(...)</code></td><td><code>run(Double, ...)</code></td></tr></tbody></table>
<h3 id="你已经用过它了">你已经用过它了</h3>
<p><code>for x in vec![1, 2, 3]</code> 里，Rust 怎么知道 <code>x</code> 是 <code>i32</code>？</p>
<p>因为 <code>Vec&lt;i32&gt;</code> 实现了 <code>Iterator</code> trait，而 <code>Iterator</code> 里就有一个关联类型 <code>Item</code>：</p>
<pre><code class="language-rust">// Iterator trait 的定义（简化）
trait Iterator {
    type Item;                                 // 每次迭代产出的元素类型
    fn next(&amp;mut self) -&gt; Option&lt;Self::Item&gt;;  // 取下一个元素
}

// Vec&lt;i32&gt; 的实现
// impl Iterator for ... {
//     type Item = i32;  ← 这就是 x 得到 i32 类型的原因
//     ...
// }</code></pre>
<p><code>type Item = i32</code> 这行告诉编译器 <code>for x in vec</code> 里每个 <code>x</code> 是 <code>i32</code>。迭代器的详细用法在后续章节讲，现在你知道了：那个 <code>Item</code> 就是一个关联类型。</p>
<h1 id="练习题">练习题</h1>
<h2 id="关联类型测验">关联类型测验</h2>
</div>
<pre><code class="language-rust">trait Converter {
    type Output;
    fn convert(&amp;self, input: i32) -&gt; Self::Output;
}

struct IsEven;
impl Converter for IsEven {
    type Output = bool;
    fn convert(&amp;self, input: i32) -&gt; bool { input % 2 == 0 }
}</code></pre>
</div>
</div>
</div> 