---
title: "转换 Trait"
description: "泛型与 trait - 转换 Trait"
date: "2026-07-12"
order: 10004
tags: ["转换trait", "From", "Into", "TryFrom", "TryInto", "类型转换"]
est_time: "30 分钟"
---

 <h1 id="转换-trait-系统">转换 Trait 系统</h1>
<h2 id="为什么需要转换-trait">为什么需要转换 Trait</h2>
<p>前面在”类型系统”章节学过，Rust 不提供<strong>隐式类型转换</strong>。但有时我们需要将一个类型<strong>安全地、优雅地</strong>转换为另一个类型。</p>
<p>转换 trait 提供了：</p>
<ul>
<li><strong>显式意图</strong>：清楚地表达”这是一个转换”</li>
<li><strong>灵活性</strong>：支持任意类型之间的转换</li>
<li><strong>错误处理</strong>：某些转换可能失败，使用 <code>Result</code> 处理</li>
<li><strong>自动化</strong>：实现一个 trait，自动获得相关功能</li>
</ul>
<h2 id="from-和-into-trait">From 和 Into Trait</h2>
<h3 id="from-trait构造自我">From Trait：构造自我</h3>
<p><code>From&lt;T&gt;</code> trait 表示”我可以从 T 构造自己”：</p>
<pre><code class="language-rust">trait From&lt;T&gt; {
    fn from(value: T) -&gt; Self;
}</code></pre>
<p><strong>标准库中已有的 From 实现：</strong></p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20String%3A%3Afrom(%26str)%0A%20%20%20%20let%20s1%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20%2F%2F%20i32%20%E5%AE%9E%E7%8E%B0%E4%BA%86%20From%3Cu16%3E%0A%20%20%20%20let%20num%3A%20i32%20%3D%20100u16.into()%3B%0A%0A%20%20%20%20println!(%22s1%3A%20%7B%7D%2C%20num%3A%20%7B%7D%22%2C%20s1%2C%20num)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // String::from(&amp;str)
    let s1 = String::from("hello");

    // i32 实现了 From&lt;u16&gt;
    let num: i32 = 100u16.into();

    println!("s1: {}, num: {}", s1, num);
}</code></pre></div>
<h3 id="为自定义类型实现-from">为自定义类型实现 From</h3>
<div class="code-runner" data-full-code="use%20std%3A%3Aconvert%3A%3AFrom%3B%0A%0A%23%5Bderive(Debug)%5D%0Astruct%20Number%20%7B%0A%20%20%20%20value%3A%20i32%2C%0A%7D%0A%0Aimpl%20From%3Ci32%3E%20for%20Number%20%7B%0A%20%20%20%20fn%20from(item%3A%20i32)%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20Number%20%7B%20value%3A%20item%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20num1%20%3D%20Number%3A%3Afrom(30)%3B%0A%20%20%20%20println!(%22%E6%96%B9%E5%BC%8F%201%20-%20from%3A%20%7B%3A%3F%7D%22%2C%20num1)%3B%0A%0A%20%20%20%20%2F%2F%20%E8%87%AA%E5%8A%A8%E8%8E%B7%E5%BE%97%20into%EF%BC%88%E4%B8%8D%E7%94%A8%E6%89%8B%E5%8A%A8%E5%AE%9E%E7%8E%B0%EF%BC%89%0A%20%20%20%20let%20num2%3A%20Number%20%3D%2040.into()%3B%0A%20%20%20%20println!(%22%E6%96%B9%E5%BC%8F%202%20-%20into%3A%20%7B%3A%3F%7D%22%2C%20num2)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::convert::From;

#[derive(Debug)]
struct Number {
    value: i32,
}

impl From&lt;i32&gt; for Number {
    fn from(item: i32) -&gt; Self {
        Number { value: item }
    }
}

fn main() {
    let num1 = Number::from(30);
    println!("方式 1 - from: {:?}", num1);

    // 自动获得 into（不用手动实现）
    let num2: Number = 40.into();
    println!("方式 2 - into: {:?}", num2);
}</code></pre></div>
<h3 id="into-trait转换为他人">Into Trait：转换为他人</h3>
<p><code>Into&lt;T&gt;</code> trait 表示”我可以转换成 T”：</p>
<pre><code class="language-rust">trait Into&lt;T&gt; {
    fn into(self) -&gt; T;
}</code></pre>
<p><strong>关键点</strong>：如果你为类型 A 实现了 <code>From&lt;B&gt;</code>，编译器会<strong>自动</strong>为 B 实现 <code>Into&lt;A&gt;</code>。它们互为倒数。</p>
<h3 id="from-vs-into何时用哪个">From vs Into：何时用哪个</h3>
<ul>
<li><strong>实现转换时</strong>：总是实现 <code>From</code>，自动获得 <code>Into</code></li>
<li><strong>使用转换时</strong>：
<ul>
<li>如果有明确的源类型，用 <code>From</code></li>
<li>如果需要类型推导，用 <code>Into</code></li>
</ul>
</li>
</ul>
<div class="code-runner" data-full-code="use%20std%3A%3Aconvert%3A%3AFrom%3B%0A%0A%23%5Bderive(Debug)%5D%0Astruct%20Point(i32%2C%20i32)%3B%0A%0Aimpl%20From%3C(i32%2C%20i32)%3E%20for%20Point%20%7B%0A%20%20%20%20fn%20from((x%2C%20y)%3A%20(i32%2C%20i32))%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20Point(x%2C%20y)%0A%20%20%20%20%7D%0A%7D%0A%0A%2F%2F%20%E6%8E%A5%E5%8F%97%E4%BB%BB%E4%BD%95%E8%83%BD%E8%BD%AC%E4%B8%BA%20Point%20%E7%9A%84%E7%B1%BB%E5%9E%8B%0Afn%20make_point%3CT%3A%20Into%3CPoint%3E%3E(x%3A%20T)%20-%3E%20Point%20%7B%0A%20%20%20%20x.into()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20p1%20%3D%20Point%3A%3Afrom((1%2C%202))%3B%0A%20%20%20%20let%20p2%3A%20Point%20%3D%20(3%2C%204).into()%3B%0A%20%20%20%20let%20p3%20%3D%20make_point((5%2C%206))%3B%0A%0A%20%20%20%20println!(%22p1%3A%20%7B%3A%3F%7D%2C%20p2%3A%20%7B%3A%3F%7D%2C%20p3%3A%20%7B%3A%3F%7D%22%2C%20p1%2C%20p2%2C%20p3)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::convert::From;

#[derive(Debug)]
struct Point(i32, i32);

impl From&lt;(i32, i32)&gt; for Point {
    fn from((x, y): (i32, i32)) -&gt; Self {
        Point(x, y)
    }
}

// 接受任何能转为 Point 的类型
fn make_point&lt;T: Into&lt;Point&gt;&gt;(x: T) -&gt; Point {
    x.into()
}

fn main() {
    let p1 = Point::from((1, 2));
    let p2: Point = (3, 4).into();
    let p3 = make_point((5, 6));

    println!("p1: {:?}, p2: {:?}, p3: {:?}", p1, p2, p3);
}</code></pre></div>
<h2 id="tryfrom-和-tryinto-trait">TryFrom 和 TryInto Trait</h2>
<h3 id="可能失败的转换">可能失败的转换</h3>
<p>某些转换不一定成功。例如，验证范围、检查有效性等。对于这样的情况，使用 <code>Try*</code> trait：</p>
<pre><code class="language-rust">trait TryFrom&lt;T&gt; {
    type Error;

    fn try_from(value: T) -&gt; Result&lt;Self, Self::Error&gt;;
}

trait TryInto&lt;T&gt; {
    type Error;

    fn try_into(self) -&gt; Result&lt;T, Self::Error&gt;;
}</code></pre>
<h3 id="实现-tryfrom">实现 TryFrom</h3>
<div class="code-runner" data-full-code="use%20std%3A%3Aconvert%3A%3ATryFrom%3B%0A%0A%23%5Bderive(Debug%2C%20PartialEq)%5D%0Astruct%20EvenNumber(i32)%3B%0A%0Aimpl%20TryFrom%3Ci32%3E%20for%20EvenNumber%20%7B%0A%20%20%20%20type%20Error%20%3D%20%26'static%20str%3B%0A%0A%20%20%20%20fn%20try_from(value%3A%20i32)%20-%3E%20Result%3CSelf%2C%20Self%3A%3AError%3E%20%7B%0A%20%20%20%20%20%20%20%20if%20value%20%25%202%20%3D%3D%200%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Ok(EvenNumber(value))%0A%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Err(%22%E4%B8%8D%E6%98%AF%E5%81%B6%E6%95%B0%22)%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20match%20EvenNumber%3A%3Atry_from(4)%20%7B%0A%20%20%20%20%20%20%20%20Ok(num)%20%3D%3E%20println!(%22%E6%88%90%E5%8A%9F%EF%BC%9A%7B%3A%3F%7D%22%2C%20num)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20println!(%22%E5%A4%B1%E8%B4%A5%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%0A%20%20%20%20match%20EvenNumber%3A%3Atry_from(3)%20%7B%0A%20%20%20%20%20%20%20%20Ok(num)%20%3D%3E%20println!(%22%E6%88%90%E5%8A%9F%EF%BC%9A%7B%3A%3F%7D%22%2C%20num)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20println!(%22%E5%A4%B1%E8%B4%A5%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::convert::TryFrom;

#[derive(Debug, PartialEq)]
struct EvenNumber(i32);

impl TryFrom&lt;i32&gt; for EvenNumber {
    type Error = &amp;'static str;

    fn try_from(value: i32) -&gt; Result&lt;Self, Self::Error&gt; {
        if value % 2 == 0 {
            Ok(EvenNumber(value))
        } else {
            Err("不是偶数")
        }
    }
}

fn main() {
    match EvenNumber::try_from(4) {
        Ok(num) =&gt; println!("成功：{:?}", num),
        Err(e) =&gt; println!("失败：{}", e),
    }

    match EvenNumber::try_from(3) {
        Ok(num) =&gt; println!("成功：{:?}", num),
        Err(e) =&gt; println!("失败：{}", e),
    }
}</code></pre></div>
<h3 id="tryinto-的自动实现">TryInto 的自动实现</h3>
<p>就像 <code>Into</code> 自动实现一样，实现 <code>TryFrom</code> 会自动获得 <code>TryInto</code>：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Aconvert%3A%3ATryFrom%3B%0A%0A%23%5Bderive(Debug)%5D%0Astruct%20PositiveNumber(u32)%3B%0A%0Aimpl%20TryFrom%3Ci32%3E%20for%20PositiveNumber%20%7B%0A%20%20%20%20type%20Error%20%3D%20String%3B%0A%0A%20%20%20%20fn%20try_from(value%3A%20i32)%20-%3E%20Result%3CSelf%2C%20Self%3A%3AError%3E%20%7B%0A%20%20%20%20%20%20%20%20if%20value%20%3E%200%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Ok(PositiveNumber(value%20as%20u32))%0A%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Err(format!(%22%E6%9C%9F%E6%9C%9B%E6%AD%A3%E6%95%B0%EF%BC%8C%E5%BE%97%E5%88%B0%20%7B%7D%22%2C%20value))%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%96%B9%E5%BC%8F%201%EF%BC%9A%E4%BD%BF%E7%94%A8%20try_from%0A%20%20%20%20match%20PositiveNumber%3A%3Atry_from(5)%20%7B%0A%20%20%20%20%20%20%20%20Ok(n)%20%3D%3E%20println!(%22try_from%3A%20%7B%3A%3F%7D%22%2C%20n)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20println!(%22%E9%94%99%E8%AF%AF%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E6%96%B9%E5%BC%8F%202%EF%BC%9A%E4%BD%BF%E7%94%A8%20try_into%EF%BC%88%E8%87%AA%E5%8A%A8%E6%8F%90%E4%BE%9B%EF%BC%89%0A%20%20%20%20let%20result%3A%20Result%3CPositiveNumber%2C%20_%3E%20%3D%2010i32.try_into()%3B%0A%20%20%20%20match%20result%20%7B%0A%20%20%20%20%20%20%20%20Ok(n)%20%3D%3E%20println!(%22try_into%3A%20%7B%3A%3F%7D%22%2C%20n)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20println!(%22%E9%94%99%E8%AF%AF%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::convert::TryFrom;

#[derive(Debug)]
struct PositiveNumber(u32);

impl TryFrom&lt;i32&gt; for PositiveNumber {
    type Error = String;

    fn try_from(value: i32) -&gt; Result&lt;Self, Self::Error&gt; {
        if value &gt; 0 {
            Ok(PositiveNumber(value as u32))
        } else {
            Err(format!("期望正数，得到 {}", value))
        }
    }
}

fn main() {
    // 方式 1：使用 try_from
    match PositiveNumber::try_from(5) {
        Ok(n) =&gt; println!("try_from: {:?}", n),
        Err(e) =&gt; println!("错误：{}", e),
    }

    // 方式 2：使用 try_into（自动提供）
    let result: Result&lt;PositiveNumber, _&gt; = 10i32.try_into();
    match result {
        Ok(n) =&gt; println!("try_into: {:?}", n),
        Err(e) =&gt; println!("错误：{}", e),
    }
}</code></pre></div>
<h2 id="转换-trait-关系图">转换 Trait 关系图</h2>
<pre><code class="language-text">From&lt;T&gt; for A  ←→  Into&lt;A&gt; for T
     ↓                    ↓
TryFrom&lt;T&gt; for A  ←→  TryInto&lt;A&gt; for T</code></pre>
<ul>
<li>实现 <code>From&lt;T&gt;</code> 自动获得 <code>Into</code></li>
<li>实现 <code>TryFrom&lt;T&gt;</code> 自动获得 <code>TryInto</code></li>
<li><code>From</code>/<code>Into</code> 用于<strong>总是成功</strong>的转换</li>
<li><code>TryFrom</code>/<code>TryInto</code> 用于<strong>可能失败</strong>的转换</li>
</ul>
<h1 id="练习题">练习题</h1>
<h2 id="from-和-into-测验">From 和 Into 测验</h2>
<pre><code class="language-rust">struct Color(u8, u8, u8);

impl From&lt;(u8, u8, u8)&gt; for Color {
    fn from((r, g, b): (u8, u8, u8)) -&gt; Self {
        Color(r, g, b)
    }
}

fn main() {
    let c: Color = (255, 0, 0).into();
}</code></pre>
</div>
</div>
<h2 id="tryfrom-和-tryinto-测验">TryFrom 和 TryInto 测验</h2>
<pre><code class="language-rust">use std::convert::TryFrom;

#[derive(Debug)]
struct EvenNumber(i32);

impl TryFrom&lt;i32&gt; for EvenNumber {
    type Error = String;

    fn try_from(value: i32) -&gt; Result&lt;Self, Self::Error&gt; {
        if value % 2 == 0 {
            Ok(EvenNumber(value))
        } else {
            Err(String::from("不是偶数"))
        }
    }
}</code></pre>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>为 <code>Point</code> 实现 <code>From&lt;(i32, i32)&gt;</code>，然后分别用 <code>From::from()</code> 和 <code>.into()</code> 两种方式创建 <code>Point</code>：</p>
<div class="code-editor" data-block-id="10-generics-traits/04-conversion-traits#1:4" data-expect-mode="literal" data-expect-pattern="p1%3A%20Point%20%7B%20x%3A%201%2C%20y%3A%202%20%7D%0Ap2%3A%20Point%20%7B%20x%3A%203%2C%20y%3A%204%20%7D" data-starter-code="%23%5Bderive(Debug)%5D%0Astruct%20Point%20%7B%0A%20%20%20%20x%3A%20i32%2C%0A%20%20%20%20y%3A%20i32%2C%0A%7D%0A%0A%2F%2F%20TODO%3A%20%E4%B8%BA%20Point%20%E5%AE%9E%E7%8E%B0%20From%3C(i32%2C%20i32)%3E%0A%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E7%94%A8%20From%20%E6%98%BE%E5%BC%8F%E8%BD%AC%E6%8D%A2%0A%20%20%20%20let%20p1%20%3D%20Point%3A%3Afrom((1%2C%202))%3B%0A%20%20%20%20println!(%22p1%3A%20%7B%3A%3F%7D%22%2C%20p1)%3B%0A%0A%20%20%20%20%2F%2F%20%E7%94%A8%20Into%20%E9%9A%90%E5%BC%8F%E8%BD%AC%E6%8D%A2%EF%BC%88%E7%94%B1%20From%20%E8%87%AA%E5%8A%A8%E6%8E%A8%E5%AF%BC%EF%BC%8C%E9%9C%80%E6%A0%87%E6%B3%A8%E7%9B%AE%E6%A0%87%E7%B1%BB%E5%9E%8B%EF%BC%89%0A%20%20%20%20let%20p2%3A%20Point%20%3D%20(3%2C%204).into()%3B%0A%20%20%20%20println!(%22p2%3A%20%7B%3A%3F%7D%22%2C%20p2)%3B%0A%7D"><pre><code class="language-rust">#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

// TODO: 为 Point 实现 From&lt;(i32, i32)&gt;


fn main() {
    // 用 From 显式转换
    let p1 = Point::from((1, 2));
    println!("p1: {:?}", p1);

    // 用 Into 隐式转换（由 From 自动推导，需标注目标类型）
    let p2: Point = (3, 4).into();
    println!("p2: {:?}", p2);
}</code></pre></div> 