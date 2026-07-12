---
title: "省略规则与 'static"
description: "生命周期 - 省略规则与 'static"
date: "2026-07-12"
order: 11004
tags: ["lifetime elision", "生命周期省略", "static", "'static", "省略规则"]
est_time: "20 分钟"
---

 <h1 id="省略规则">省略规则</h1>
<h2 id="为什么大多数时候不需要标注">为什么大多数时候不需要标注</h2>
<p>学完前两篇你可能有个疑问：既然每个引用都有生命周期，为什么很多函数没有写 <code>'a</code> 也能编译？比如：</p>
<div class="code-runner" data-full-code="fn%20first_word(s%3A%20%26str)%20-%3E%20%26str%20%7B%0A%20%20%20%20let%20bytes%20%3D%20s.as_bytes()%3B%0A%20%20%20%20for%20(i%2C%20%26byte)%20in%20bytes.iter().enumerate()%20%7B%0A%20%20%20%20%20%20%20%20if%20byte%20%3D%3D%20b'%20'%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%26s%5B0..i%5D%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20%26s%5B..%5D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%20world%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20first_word(%26s))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn first_word(s: &amp;str) -&gt; &amp;str {
    let bytes = s.as_bytes();
    for (i, &amp;byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return &amp;s[0..i];
        }
    }
    &amp;s[..]
}

fn main() {
    let s = String::from("hello world");
    println!("{}", first_word(&amp;s));
}</code></pre></div>
<p>这个函数既有引用参数又有引用返回值，按理说需要标注——但它没有，也能编译。</p>
<p>原因是 Rust 编译器内置了<strong>生命周期省略规则</strong>（lifetime elision rules）。这些规则覆盖了最常见的模式，当输入输出的生命周期关系可以唯一确定时，编译器帮你自动填写，你不需要手写。</p>
<blockquote>
<p>省略规则不是”猜测”，而是确定性的推断。如果应用规则后仍有歧义，编译器会报错要求你显式标注。</p>
</blockquote>
<h2 id="三条省略规则">三条省略规则</h2>
<p>编译器按顺序应用这三条规则，对所有函数（包括 <code>fn</code> 定义和 <code>impl</code> 块）有效：</p>
<h3 id="规则一每个引用参数各自获得独立的生命周期">规则一：每个引用参数各自获得独立的生命周期</h3>
<pre><code class="language-rust">// 原始写法：
fn foo(x: &amp;i32) -&gt; i32 { *x }

// 编译器看到的：
fn foo&lt;'a&gt;(x: &amp;'a i32) -&gt; i32 { *x }</code></pre>
<pre><code class="language-rust">// 两个参数各自独立：
fn bar(x: &amp;i32, y: &amp;i32) -&gt; i32 { x + y }

// 编译器看到的：
fn bar&lt;'a, 'b&gt;(x: &amp;'a i32, y: &amp;'b i32) -&gt; i32 { x + y }</code></pre>
<h3 id="规则二只有一个引用参数时它的生命周期赋给所有返回引用">规则二：只有一个引用参数时，它的生命周期赋给所有返回引用</h3>
<pre><code class="language-rust">// 原始写法：
fn first_word(s: &amp;str) -&gt; &amp;str { ... }

// 应用规则一后：
fn first_word&lt;'a&gt;(s: &amp;'a str) -&gt; &amp;str { ... }

// 应用规则二后（只有一个输入生命周期 'a，赋给输出）：
fn first_word&lt;'a&gt;(s: &amp;'a str) -&gt; &amp;'a str { ... }</code></pre>
<p>这就是为什么 <code>first_word</code> 不需要手写标注！</p>
<h3 id="规则三方法中有-self-或-mut-self-时self-的生命周期赋给所有返回引用">规则三：方法中有 &amp;self 或 &amp;mut self 时，self 的生命周期赋给所有返回引用</h3>
<p>这条规则让方法签名通常不需要任何生命周期标注：</p>
<div class="code-runner" data-full-code="struct%20Excerpt%3C'a%3E%20%7B%0A%20%20%20%20part%3A%20%26'a%20str%2C%0A%7D%0A%0Aimpl%3C'a%3E%20Excerpt%3C'a%3E%20%7B%0A%20%20%20%20%2F%2F%20%E6%9C%89%20%26self%20%E5%8F%82%E6%95%B0%EF%BC%8C%E8%A7%84%E5%88%99%E4%B8%89%EF%BC%9A%E8%BF%94%E5%9B%9E%E5%80%BC%E7%9A%84%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E4%B8%8E%20%26self%20%E7%9B%B8%E5%90%8C%0A%20%20%20%20%2F%2F%20%E7%9B%B8%E5%BD%93%E4%BA%8E%3A%20fn%20announce(%26'b%20self%2C%20ann%3A%20%26'c%20str)%20-%3E%20%26'b%20str%0A%20%20%20%20fn%20announce(%26self%2C%20ann%3A%20%26str)%20-%3E%20%26str%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E9%80%9A%E7%9F%A5%EF%BC%9A%7B%7D%22%2C%20ann)%3B%0A%20%20%20%20%20%20%20%20self.part%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20text%20%3D%20String%3A%3Afrom(%22%E9%87%8D%E8%A6%81%E5%86%85%E5%AE%B9%E5%9C%A8%E8%BF%99%E9%87%8C%E3%80%82%E8%BF%98%E6%9C%89%E6%9B%B4%E5%A4%9A%E3%80%82%22)%3B%0A%20%20%20%20let%20first%20%3D%20text.split('%E3%80%82').next().unwrap()%3B%0A%20%20%20%20let%20exc%20%3D%20Excerpt%20%7B%20part%3A%20first%20%7D%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20exc.announce(%22%E8%AF%B7%E6%B3%A8%E6%84%8F%22))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Excerpt&lt;'a&gt; {
    part: &amp;'a str,
}

impl&lt;'a&gt; Excerpt&lt;'a&gt; {
    // 有 &amp;self 参数，规则三：返回值的生命周期与 &amp;self 相同
    // 相当于: fn announce(&amp;'b self, ann: &amp;'c str) -&gt; &amp;'b str
    fn announce(&amp;self, ann: &amp;str) -&gt; &amp;str {
        println!("通知：{}", ann);
        self.part
    }
}

fn main() {
    let text = String::from("重要内容在这里。还有更多。");
    let first = text.split('。').next().unwrap();
    let exc = Excerpt { part: first };
    println!("{}", exc.announce("请注意"));
}</code></pre></div>
<h2 id="三条规则的实战演示">三条规则的实战演示</h2>
<p>用规则来推导 <code>longest</code> 函数为什么必须手写标注：</p>
<pre><code class="language-rust">// 原始：
fn longest(x: &amp;str, y: &amp;str) -&gt; &amp;str

// 规则一（两个引用参数，各自获得生命周期）：
fn longest&lt;'a, 'b&gt;(x: &amp;'a str, y: &amp;'b str) -&gt; &amp;str

// 规则二：多于一个输入生命周期，不适用
// 规则三：不是方法，没有 &amp;self，不适用

// 结果：返回值的生命周期无法确定 → 编译器报错，要求你手写</code></pre>
<p>这就是为什么 <code>longest</code> 必须手写 <code>&lt;'a&gt;</code>——三条规则用完还是有歧义。</p>
<h2 id="省略规则是语法糖">省略规则是”语法糖”</h2>
<p>省略掉的生命周期<strong>依然存在</strong>，只是不用写出来。加上或去掉都完全等价：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E8%BF%99%E4%B8%A4%E4%B8%AA%E5%87%BD%E6%95%B0%E5%AE%8C%E5%85%A8%E7%AD%89%E4%BB%B7%0Afn%20get_first(v%3A%20%26%5Bi32%5D)%20-%3E%20%26i32%20%7B%0A%20%20%20%20%26v%5B0%5D%0A%7D%0A%0Afn%20get_first_explicit%3C'a%3E(v%3A%20%26'a%20%5Bi32%5D)%20-%3E%20%26'a%20i32%20%7B%0A%20%20%20%20%26v%5B0%5D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20nums%20%3D%20vec!%5B10%2C%2020%2C%2030%5D%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20get_first(%26nums))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20get_first_explicit(%26nums))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 这两个函数完全等价
fn get_first(v: &amp;[i32]) -&gt; &amp;i32 {
    &amp;v[0]
}

fn get_first_explicit&lt;'a&gt;(v: &amp;'a [i32]) -&gt; &amp;'a i32 {
    &amp;v[0]
}

fn main() {
    let nums = vec![10, 20, 30];
    println!("{}", get_first(&amp;nums));
    println!("{}", get_first_explicit(&amp;nums));
}</code></pre></div>
<h1 id="static-生命周期"><code>'static</code> 生命周期</h1>
<h2 id="什么是-static">什么是 ‘static</h2>
<p><code>'static</code> 是一个特殊的生命周期，表示<strong>整个程序运行期间都有效</strong>。带有 <code>'static</code> 生命周期的数据永远不会被销毁（或者说活到程序结束）。</p>
<p>有两种方式产生 <code>'static</code> 数据：</p>
<p><strong>1. 字符串字面量：</strong></p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E7%B1%BB%E5%9E%8B%E6%8E%A8%E6%96%AD%E8%83%BD%E8%87%AA%E5%8A%A8%E5%BE%97%E5%87%BA%20%26'static%20str%EF%BC%8C%E9%80%9A%E5%B8%B8%E4%B8%8D%E9%9C%80%E8%A6%81%E6%89%8B%E5%86%99%0A%20%20%20%20let%20s1%20%3D%20%22%E6%88%91%E6%98%AF%E5%AD%97%E9%9D%A2%E9%87%8F%EF%BC%8C%E4%BD%8F%E5%9C%A8%E4%BA%8C%E8%BF%9B%E5%88%B6%E7%9A%84%E5%8F%AA%E8%AF%BB%E6%AE%B5%22%3B%0A%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E6%9C%89%E5%9C%A8%E5%87%BD%E6%95%B0%E7%AD%BE%E5%90%8D%E7%AD%89%E9%9C%80%E8%A6%81%E6%98%8E%E7%A1%AE%E7%BA%A6%E6%9D%9F%E6%97%B6%EF%BC%8C%E6%89%8D%E6%98%BE%E5%BC%8F%E5%86%99%E5%87%BA%20'static%0A%20%20%20%20let%20s2%3A%20%26'static%20str%20%3D%20%22%E8%BF%99%E9%87%8C%E6%98%BE%E5%BC%8F%E5%86%99%E5%87%BA%E6%9D%A5%EF%BC%8C%E6%95%88%E6%9E%9C%E7%9B%B8%E5%90%8C%22%3B%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s1)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 类型推断能自动得出 &amp;'static str，通常不需要手写
    let s1 = "我是字面量，住在二进制的只读段";

    // 只有在函数签名等需要明确约束时，才显式写出 'static
    let s2: &amp;'static str = "这里显式写出来，效果相同";

    println!("{}", s1);
    println!("{}", s2);
}</code></pre></div>
<p><strong>2. <code>static</code> 全局常量：</strong></p>
<div class="code-runner" data-full-code="%2F%2F%20static%20%E5%A3%B0%E6%98%8E%E7%9A%84%E5%80%BC%E5%9C%A8%E6%95%B4%E4%B8%AA%E7%A8%8B%E5%BA%8F%E6%9C%9F%E9%97%B4%E5%AD%98%E5%9C%A8%0A%2F%2F%20%E8%8B%A5%E5%AD%97%E6%AE%B5%E6%98%AF%E5%BC%95%E7%94%A8%EF%BC%8C'static%20%E6%98%AF%E9%9A%90%E5%90%AB%E7%9A%84%EF%BC%8C%E4%B8%8D%E9%9C%80%E8%A6%81%E5%86%99%E5%87%BA%E6%9D%A5%0Astatic%20MAX_CONNECTIONS%3A%20u32%20%3D%20100%3B%0Astatic%20APPNAME%3A%20%26str%20%3D%20%22my-app%22%3B%20%2F%2F%20%E7%AD%89%E4%BB%B7%E4%BA%8E%20%26'static%20str%EF%BC%8C'static%20%E5%8F%AF%E7%9C%81%E7%95%A5%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%E6%9C%80%E5%A4%A7%E8%BF%9E%E6%8E%A5%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20MAX_CONNECTIONS)%3B%0A%20%20%20%20println!(%22%E5%BA%94%E7%94%A8%E5%90%8D%EF%BC%9A%7B%7D%22%2C%20APPNAME)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// static 声明的值在整个程序期间存在
// 若字段是引用，'static 是隐含的，不需要写出来
static MAX_CONNECTIONS: u32 = 100;
static APPNAME: &amp;str = "my-app"; // 等价于 &amp;'static str，'static 可省略

fn main() {
    println!("最大连接数：{}", MAX_CONNECTIONS);
    println!("应用名：{}", APPNAME);
}</code></pre></div>
<h2 id="static-可以被缩短">‘static 可以被”缩短”</h2>
<p><code>'static</code> 是最长的生命周期，它可以被强制转换成任何更短的生命周期。这很自然：一个活到程序结束的引用，在任何子区间内当然也是有效的。</p>
<div class="code-runner" data-full-code="static%20NUM%3A%20i32%20%3D%2018%3B%0A%0A%2F%2F%20%E6%8E%A5%E5%8F%97%E4%B8%80%E4%B8%AA%20%26'a%20i32%EF%BC%8C%E8%BF%94%E5%9B%9E%E4%B8%80%E4%B8%AA%20%26'a%20i32%0A%2F%2F%20%E6%8A%8A%20%26'static%20i32%20%E7%9A%84%20NUM%20%E5%BD%93%E4%BD%9C%20%26'a%20i32%20%E4%BC%A0%E5%85%A5%EF%BC%8C%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%22%E7%BC%A9%E7%9F%AD%22%E4%BA%86%0Afn%20coerce_static%3C'a%3E(_%3A%20%26'a%20i32)%20-%3E%20%26'a%20i32%20%7B%0A%20%20%20%20%26NUM%20%20%2F%2F%20NUM%20%E6%98%AF%20'static%EF%BC%8C%E4%BD%86%E5%87%BD%E6%95%B0%E7%AD%BE%E5%90%8D%E6%89%BF%E8%AF%BA%E5%8F%AA%E8%BF%94%E5%9B%9E%20'a%20%E7%BA%A7%E5%88%AB%E7%9A%84%E5%BC%95%E7%94%A8%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%2010%3B%0A%20%20%20%20let%20r%20%3D%20coerce_static(%26x)%3B%0A%20%20%20%20println!(%22r%20%3D%20%7B%7D%22%2C%20r)%3B%0A%20%20%20%20println!(%22NUM%20%3D%20%7B%7D%20%E4%BB%8D%E7%84%B6%E5%8F%AF%E8%AE%BF%E9%97%AE%22%2C%20NUM)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">static NUM: i32 = 18;

// 接受一个 &amp;'a i32，返回一个 &amp;'a i32
// 把 &amp;'static i32 的 NUM 当作 &amp;'a i32 传入，生命周期"缩短"了
fn coerce_static&lt;'a&gt;(_: &amp;'a i32) -&gt; &amp;'a i32 {
    &amp;NUM  // NUM 是 'static，但函数签名承诺只返回 'a 级别的引用
}

fn main() {
    let x = 10;
    let r = coerce_static(&amp;x);
    println!("r = {}", r);
    println!("NUM = {} 仍然可访问", NUM);
}</code></pre></div>
<h2 id="何时该用-static">何时该用 ‘static</h2>
<p><code>'static</code> 最常见的合法用途是<strong>字符串字面量</strong>和<strong>全局常量</strong>——它们确实在整个程序期间存在。</p>
<p>在函数签名中使用 <code>'static</code> 作为返回值约束，意味着返回的引用必须是这两者之一：</p>
<div class="code-runner" data-full-code="fn%20get_error_msg(code%3A%20u32)%20-%3E%20%26'static%20str%20%7B%0A%20%20%20%20match%20code%20%7B%0A%20%20%20%20%20%20%20%20404%20%3D%3E%20%22%E6%9C%AA%E6%89%BE%E5%88%B0%22%2C%0A%20%20%20%20%20%20%20%20500%20%3D%3E%20%22%E6%9C%8D%E5%8A%A1%E5%99%A8%E5%86%85%E9%83%A8%E9%94%99%E8%AF%AF%22%2C%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20%22%E6%9C%AA%E7%9F%A5%E9%94%99%E8%AF%AF%22%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20get_error_msg(404))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn get_error_msg(code: u32) -&gt; &amp;'static str {
    match code {
        404 =&gt; "未找到",
        500 =&gt; "服务器内部错误",
        _ =&gt; "未知错误",
    }
}

fn main() {
    println!("{}", get_error_msg(404));
}</code></pre></div>
<h2 id="常见误区不要乱用-static">常见误区：不要乱用 ‘static</h2>
<p>当你遇到生命周期错误时，编译器有时会建议”考虑使用 <code>'static</code>”，这<strong>不是建议你真的这样做</strong>，而是在告诉你一种可能的（但通常是错误的）解决方案。</p>
<div class="code-runner" data-full-code="%2F%2F%20%E9%94%99%E8%AF%AF%E7%9A%84%E7%94%A8%E6%B3%95%EF%BC%9A%E8%AF%95%E5%9B%BE%E7%94%A8%20'static%20%E9%80%83%E9%81%BF%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E9%97%AE%E9%A2%98%0Afn%20bad_idea(s%3A%20String)%20-%3E%20%26'static%20str%20%7B%0A%20%20%20%20%2F%2F%20%E4%B8%8D%E5%8F%AF%E8%83%BD%EF%BC%81s%20%E5%9C%A8%E5%87%BD%E6%95%B0%E7%BB%93%E6%9D%9F%E6%97%B6%E9%94%80%E6%AF%81%EF%BC%8C%E6%B2%A1%E6%B3%95%E8%BF%94%E5%9B%9E%20'static%20%E5%BC%95%E7%94%A8%0A%20%20%20%20%26s%0A%7D" data-mode="expect-error"><pre><code class="language-rust">// 错误的用法：试图用 'static 逃避生命周期问题
fn bad_idea(s: String) -&gt; &amp;'static str {
    // 不可能！s 在函数结束时销毁，没法返回 'static 引用
    &amp;s
}</code></pre></div>
<p>遇到生命周期错误，应该<strong>找根本原因</strong>——通常是返回引用而应该返回有所有权的值，或者调整数据的生命周期让它活得足够久。</p>
<blockquote>
<p>规则：只有当数据<strong>真的在整个程序期间存在</strong>时，才使用 <code>'static</code>。如果你只是想”消除编译错误”而用它，几乎肯定是在掩盖真正的问题。</p>
</blockquote>
<hr/>
<h1 id="练习题">练习题</h1>
<h2 id="省略规则测验">省略规则测验</h2>
<p>下面是几组函数，判断编译器推断后的完整签名：</p>
</div>
</div>
</div>
<h2 id="static-测验">‘static 测验</h2>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>实现 <code>status_text</code> 函数，根据 HTTP 状态码返回对应的描述字符串。返回值类型应该是 <code>&amp;'static str</code>——想想为什么这里用 <code>'static</code> 是合理的：</p>
<div class="code-editor" data-block-id="11-lifetimes/04-lifetime-elision#2:5" data-expect-mode="literal" data-expect-pattern="OK%0ANot%20Found%0AInternal%20Server%20Error%0AUnknown" data-starter-code="%2F%2F%20TODO%3A%20%E8%A1%A5%E5%85%A8%E8%BF%94%E5%9B%9E%E5%80%BC%E7%B1%BB%E5%9E%8B%E5%92%8C%E5%87%BD%E6%95%B0%E4%BD%93%0A%2F%2F%20200%20-%3E%20%22OK%22%EF%BC%8C404%20-%3E%20%22Not%20Found%22%EF%BC%8C500%20-%3E%20%22Internal%20Server%20Error%22%EF%BC%8C%E5%85%B6%E4%BB%96%20-%3E%20%22Unknown%22%0Afn%20status_text(code%3A%20u32)%20-%3E%20%3F%3F%3F%20%7B%0A%20%20%20%20todo!()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20status_text(200))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20status_text(404))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20status_text(500))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20status_text(418))%3B%0A%7D"><pre><code class="language-rust">// TODO: 补全返回值类型和函数体
// 200 -&gt; "OK"，404 -&gt; "Not Found"，500 -&gt; "Internal Server Error"，其他 -&gt; "Unknown"
fn status_text(code: u32) -&gt; ??? {
    todo!()
}

fn main() {
    println!("{}", status_text(200));
    println!("{}", status_text(404));
    println!("{}", status_text(500));
    println!("{}", status_text(418));
}</code></pre></div> 