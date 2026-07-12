---
title: "模式匹配进阶"
description: "高级主题 - 模式匹配进阶"
date: "2026-07-12"
order: 22004
tags: ["高级模式匹配", "@ 绑定", "模式守卫", "ref 模式"]
est_time: "25 分钟"
---

 <h1 id="绑定与守卫">绑定与守卫</h1>
<h2 id="快速回顾基础模式">快速回顾：基础模式</h2>
<p>你在前面章节已经见过基础的模式匹配：</p>
<div class="code-runner" data-full-code="enum%20Message%20%7B%0A%20%20%20%20Quit%2C%0A%20%20%20%20Move%20%7B%20x%3A%20i32%2C%20y%3A%20i32%20%7D%2C%0A%20%20%20%20Write(String)%2C%0A%20%20%20%20Color(u8%2C%20u8%2C%20u8)%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20msg%20%3D%20Message%3A%3AMove%20%7B%20x%3A%2010%2C%20y%3A%2020%20%7D%3B%0A%0A%20%20%20%20match%20msg%20%7B%0A%20%20%20%20%20%20%20%20Message%3A%3AQuit%20%3D%3E%20println!(%22%E9%80%80%E5%87%BA%22)%2C%0A%20%20%20%20%20%20%20%20Message%3A%3AMove%20%7B%20x%2C%20y%20%7D%20%3D%3E%20println!(%22%E7%A7%BB%E5%8A%A8%E5%88%B0%20(%7B%7D%2C%20%7B%7D)%22%2C%20x%2C%20y)%2C%0A%20%20%20%20%20%20%20%20Message%3A%3AWrite(text)%20%3D%3E%20println!(%22%E5%86%99%E5%85%A5%EF%BC%9A%7B%7D%22%2C%20text)%2C%0A%20%20%20%20%20%20%20%20Message%3A%3AColor(r%2C%20g%2C%20b)%20%3D%3E%20println!(%22%E9%A2%9C%E8%89%B2%EF%BC%9A%7B%7D%20%7B%7D%20%7B%7D%22%2C%20r%2C%20g%2C%20b)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    Color(u8, u8, u8),
}

fn main() {
    let msg = Message::Move { x: 10, y: 20 };

    match msg {
        Message::Quit =&gt; println!("退出"),
        Message::Move { x, y } =&gt; println!("移动到 ({}, {})", x, y),
        Message::Write(text) =&gt; println!("写入：{}", text),
        Message::Color(r, g, b) =&gt; println!("颜色：{} {} {}", r, g, b),
    }
}</code></pre></div>
<p>本章讲几种进阶用法，让你处理更复杂的情况。</p>
<h2 id="-绑定捕获的同时进行匹配">@ 绑定：捕获的同时进行匹配</h2>
<p>有时候你想<strong>同时检测</strong>一个值在不在某个范围内，<strong>并且保留</strong>这个值做后续使用。普通的范围匹配做不到：</p>
<div class="code-runner" data-full-code="fn%20describe_score(score%3A%20u32)%20-%3E%20String%20%7B%0A%20%20%20%20match%20score%20%7B%0A%20%20%20%20%20%20%20%200..%3D59%20%3D%3E%20format!(%22%E4%B8%8D%E5%8F%8A%E6%A0%BC%EF%BC%9A%7B%7D%22%2C%20score)%2C%20%2F%2F%20%E2%9C%85%20%E7%94%A8%E5%88%B0%E4%BA%86%20score%0A%20%20%20%20%20%20%20%2060..%3D79%20%3D%3E%20format!(%22%E8%89%AF%E5%A5%BD%EF%BC%9A%7B%7D%22%2C%20score)%2C%20%20%2F%2F%20%E2%9C%85%20%E4%BD%86%E8%BF%99%E9%87%8C%20score%20%E5%8F%AA%E6%98%AF%E5%8E%9F%E5%A7%8B%E5%8F%98%E9%87%8F%0A%20%20%20%20%20%20%20%2080..%3D100%20%3D%3E%20format!(%22%E4%BC%98%E7%A7%80%EF%BC%9A%7B%7D%22%2C%20score)%2C%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20format!(%22%E6%97%A0%E6%95%88%E5%88%86%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20score)%2C%0A%20%20%20%20%7D%0A%7D%0Afn%20main()%20%7B%7D" data-has-hidden="true" data-mode="run"><pre><code class="language-rust">fn describe_score(score: u32) -&gt; String {
    match score {
        0..=59 =&gt; format!("不及格：{}", score), // ✅ 用到了 score
        60..=79 =&gt; format!("良好：{}", score),  // ✅ 但这里 score 只是原始变量
        80..=100 =&gt; format!("优秀：{}", score),
        _ =&gt; format!("无效分数：{}", score),
    }
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> describe_score</span><span style="color:#E1E4E8">(score</span><span style="color:#F97583">:</span><span style="color:#B392F0"> u32</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> String</span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#F97583">    match</span><span style="color:#E1E4E8"> score {</span></span>
<span class="line"><span style="color:#79B8FF">        0</span><span style="color:#F97583">..=</span><span style="color:#79B8FF">59</span><span style="color:#F97583"> =&gt;</span><span style="color:#B392F0"> format!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"不及格：{}"</span><span style="color:#E1E4E8">, score), </span><span style="color:#6A737D">// ✅ 用到了 score</span></span>
<span class="line"><span style="color:#79B8FF">        60</span><span style="color:#F97583">..=</span><span style="color:#79B8FF">79</span><span style="color:#F97583"> =&gt;</span><span style="color:#B392F0"> format!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"良好：{}"</span><span style="color:#E1E4E8">, score),  </span><span style="color:#6A737D">// ✅ 但这里 score 只是原始变量</span></span>
<span class="line"><span style="color:#79B8FF">        80</span><span style="color:#F97583">..=</span><span style="color:#79B8FF">100</span><span style="color:#F97583"> =&gt;</span><span style="color:#B392F0"> format!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"优秀：{}"</span><span style="color:#E1E4E8">, score),</span></span>
<span class="line"><span style="color:#E1E4E8">        _ </span><span style="color:#F97583">=&gt;</span><span style="color:#B392F0"> format!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"无效分数：{}"</span><span style="color:#E1E4E8">, score),</span></span>
<span class="line"><span style="color:#E1E4E8">    }</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {}</span></span></div></div>
<p>这个可以，但模式里写的 <code>score</code> 其实是在匹配<strong>原始变量</strong>，不是”被匹配中的分支里的值”。当你想对<strong>解构出来的值</strong>同时进行范围检查并绑定时，就需要 <code>@</code> 了：</p>
<div class="code-runner" data-full-code="fn%20categorize(n%3A%20u32)%20-%3E%20String%20%7B%0A%20%20%20%20match%20n%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%40%20%E8%AE%A9%E4%BD%A0%E5%90%8C%E6%97%B6%E5%81%9A%E4%B8%A4%E4%BB%B6%E4%BA%8B%EF%BC%9A%E6%A3%80%E6%9F%A5%E6%98%AF%E5%90%A6%E5%9C%A8%201..%3D10%EF%BC%8C%E5%B9%B6%E6%8A%8A%E5%80%BC%E7%BB%91%E5%AE%9A%E5%88%B0%20small%0A%20%20%20%20%20%20%20%20small%20%40%201..%3D10%20%3D%3E%20format!(%22%7B%7D%20%E6%98%AF%E5%B0%8F%E6%95%B0%22%2C%20small)%2C%0A%20%20%20%20%20%20%20%20big%20%40%2011..%3D100%20%3D%3E%20format!(%22%7B%7D%20%E6%98%AF%E4%B8%AD%E7%AD%89%E6%95%B0%22%2C%20big)%2C%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20format!(%22%7B%7D%20%E8%B6%85%E5%87%BA%E8%8C%83%E5%9B%B4%22%2C%20n)%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20categorize(5))%3B%20%20%20%2F%2F%205%20%E6%98%AF%E5%B0%8F%E6%95%B0%0A%20%20%20%20println!(%22%7B%7D%22%2C%20categorize(50))%3B%20%20%2F%2F%2050%20%E6%98%AF%E4%B8%AD%E7%AD%89%E6%95%B0%0A%20%20%20%20println!(%22%7B%7D%22%2C%20categorize(200))%3B%20%2F%2F%20200%20%E8%B6%85%E5%87%BA%E8%8C%83%E5%9B%B4%0A%7D" data-mode="run"><pre><code class="language-rust">fn categorize(n: u32) -&gt; String {
    match n {
        // @ 让你同时做两件事：检查是否在 1..=10，并把值绑定到 small
        small @ 1..=10 =&gt; format!("{} 是小数", small),
        big @ 11..=100 =&gt; format!("{} 是中等数", big),
        _ =&gt; format!("{} 超出范围", n),
    }
}

fn main() {
    println!("{}", categorize(5));   // 5 是小数
    println!("{}", categorize(50));  // 50 是中等数
    println!("{}", categorize(200)); // 200 超出范围
}</code></pre></div>
<p><code>@ 绑定</code> 的语法：<code>名字 @ 模式</code>——如果 <code>模式</code> 匹配，把值绑定到 <code>名字</code>。</p>
<p>更复杂的例子——匹配嵌套枚举时绑定整个变体：</p>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Aenum%20Shape%20%7B%0A%20%20%20%20Circle%20%7B%20radius%3A%20f64%20%7D%2C%0A%20%20%20%20Rectangle%20%7B%20width%3A%20f64%2C%20height%3A%20f64%20%7D%2C%0A%7D%0A%0Afn%20area(shape%3A%20%26Shape)%20-%3E%20f64%20%7B%0A%20%20%20%20match%20shape%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E5%90%8C%E6%97%B6%E5%8C%B9%E9%85%8D%20Circle%20%E5%B9%B6%E6%8A%8A%E6%95%B4%E4%B8%AA%20Shape%20%E7%BB%91%E5%AE%9A%E5%88%B0%20c%EF%BC%8C%E6%96%B9%E4%BE%BF%E5%90%8E%E9%9D%A2%E8%B0%83%E8%AF%95%E6%89%93%E5%8D%B0%0A%20%20%20%20%20%20%20%20c%20%40%20Shape%3A%3ACircle%20%7B%20radius%20%7D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20let%20a%20%3D%20std%3A%3Af64%3A%3Aconsts%3A%3API%20*%20radius%20*%20radius%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%A4%84%E7%90%86%20%7B%3A%3F%7D%EF%BC%8C%E9%9D%A2%E7%A7%AF%20%3D%20%7B%3A.2%7D%22%2C%20c%2C%20a)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20a%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20Shape%3A%3ARectangle%20%7B%20width%2C%20height%20%7D%20%3D%3E%20width%20*%20height%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20Shape%3A%3ACircle%20%7B%20radius%3A%203.0%20%7D%3B%0A%20%20%20%20println!(%22%E9%9D%A2%E7%A7%AF%EF%BC%9A%7B%3A.2%7D%22%2C%20area(%26s))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
}

fn area(shape: &amp;Shape) -&gt; f64 {
    match shape {
        // 同时匹配 Circle 并把整个 Shape 绑定到 c，方便后面调试打印
        c @ Shape::Circle { radius } =&gt; {
            let a = std::f64::consts::PI * radius * radius;
            println!("处理 {:?}，面积 = {:.2}", c, a);
            a
        }
        Shape::Rectangle { width, height } =&gt; width * height,
    }
}

fn main() {
    let s = Shape::Circle { radius: 3.0 };
    println!("面积：{:.2}", area(&amp;s));
}</code></pre></div>
<h2 id="模式守卫在-match-分支里加条件">模式守卫：在 match 分支里加条件</h2>
<p>有时候模式本身不够精确，你需要加一个额外条件才能决定是否匹配。<strong>模式守卫</strong>（guard）用 <code>if</code> 关键字写在分支后面：</p>
<div class="code-runner" data-full-code="fn%20classify_temp(celsius%3A%20f64)%20-%3E%20%26'static%20str%20%7B%0A%20%20%20%20match%20celsius%20%7B%0A%20%20%20%20%20%20%20%20t%20if%20t%20%3C%200.0%20%20%20%3D%3E%20%22%E5%86%B0%E7%82%B9%E4%BB%A5%E4%B8%8B%22%2C%0A%20%20%20%20%20%20%20%20t%20if%20t%20%3C%2010.0%20%20%3D%3E%20%22%E5%AF%92%E5%86%B7%22%2C%0A%20%20%20%20%20%20%20%20t%20if%20t%20%3C%2020.0%20%20%3D%3E%20%22%E5%87%89%E7%88%BD%22%2C%0A%20%20%20%20%20%20%20%20t%20if%20t%20%3C%2030.0%20%20%3D%3E%20%22%E8%88%92%E9%80%82%22%2C%0A%20%20%20%20%20%20%20%20_%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3D%3E%20%22%E7%82%8E%E7%83%AD%22%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20classify_temp(-5.0))%3B%20%20%2F%2F%20%E5%86%B0%E7%82%B9%E4%BB%A5%E4%B8%8B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20classify_temp(5.0))%3B%20%20%20%2F%2F%20%E5%AF%92%E5%86%B7%0A%20%20%20%20println!(%22%7B%7D%22%2C%20classify_temp(25.0))%3B%20%20%2F%2F%20%E8%88%92%E9%80%82%0A%20%20%20%20println!(%22%7B%7D%22%2C%20classify_temp(35.0))%3B%20%20%2F%2F%20%E7%82%8E%E7%83%AD%0A%7D" data-mode="run"><pre><code class="language-rust">fn classify_temp(celsius: f64) -&gt; &amp;'static str {
    match celsius {
        t if t &lt; 0.0   =&gt; "冰点以下",
        t if t &lt; 10.0  =&gt; "寒冷",
        t if t &lt; 20.0  =&gt; "凉爽",
        t if t &lt; 30.0  =&gt; "舒适",
        _              =&gt; "炎热",
    }
}

fn main() {
    println!("{}", classify_temp(-5.0));  // 冰点以下
    println!("{}", classify_temp(5.0));   // 寒冷
    println!("{}", classify_temp(25.0));  // 舒适
    println!("{}", classify_temp(35.0));  // 炎热
}</code></pre></div>
<p>守卫和枚举解构组合使用：</p>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Astruct%20Point%20%7B%20x%3A%20i32%2C%20y%3A%20i32%20%7D%0A%0Afn%20quadrant(p%3A%20%26Point)%20-%3E%20%26str%20%7B%0A%20%20%20%20match%20p%20%7B%0A%20%20%20%20%20%20%20%20Point%20%7B%20x%2C%20y%20%7D%20if%20*x%20%3E%200%20%26%26%20*y%20%3E%200%20%3D%3E%20%22%E7%AC%AC%E4%B8%80%E8%B1%A1%E9%99%90%22%2C%0A%20%20%20%20%20%20%20%20Point%20%7B%20x%2C%20y%20%7D%20if%20*x%20%3C%200%20%26%26%20*y%20%3E%200%20%3D%3E%20%22%E7%AC%AC%E4%BA%8C%E8%B1%A1%E9%99%90%22%2C%0A%20%20%20%20%20%20%20%20Point%20%7B%20x%2C%20y%20%7D%20if%20*x%20%3C%200%20%26%26%20*y%20%3C%200%20%3D%3E%20%22%E7%AC%AC%E4%B8%89%E8%B1%A1%E9%99%90%22%2C%0A%20%20%20%20%20%20%20%20Point%20%7B%20x%2C%20y%20%7D%20if%20*x%20%3E%200%20%26%26%20*y%20%3C%200%20%3D%3E%20%22%E7%AC%AC%E5%9B%9B%E8%B1%A1%E9%99%90%22%2C%0A%20%20%20%20%20%20%20%20Point%20%7B%20x%3A%200%2C%20..%20%7D%20%7C%20Point%20%7B%20y%3A%200%2C%20..%20%7D%20%3D%3E%20%22%E5%9D%90%E6%A0%87%E8%BD%B4%E4%B8%8A%22%2C%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20%22%E5%8E%9F%E7%82%B9%22%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20quadrant(%26Point%20%7B%20x%3A%203%2C%20y%3A%204%20%7D))%3B%20%20%20%2F%2F%20%E7%AC%AC%E4%B8%80%E8%B1%A1%E9%99%90%0A%20%20%20%20println!(%22%7B%7D%22%2C%20quadrant(%26Point%20%7B%20x%3A%20-2%2C%20y%3A%201%20%7D))%3B%20%20%2F%2F%20%E7%AC%AC%E4%BA%8C%E8%B1%A1%E9%99%90%0A%20%20%20%20println!(%22%7B%7D%22%2C%20quadrant(%26Point%20%7B%20x%3A%200%2C%20y%3A%205%20%7D))%3B%20%20%20%2F%2F%20%E5%9D%90%E6%A0%87%E8%BD%B4%E4%B8%8A%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
struct Point { x: i32, y: i32 }

fn quadrant(p: &amp;Point) -&gt; &amp;str {
    match p {
        Point { x, y } if *x &gt; 0 &amp;&amp; *y &gt; 0 =&gt; "第一象限",
        Point { x, y } if *x &lt; 0 &amp;&amp; *y &gt; 0 =&gt; "第二象限",
        Point { x, y } if *x &lt; 0 &amp;&amp; *y &lt; 0 =&gt; "第三象限",
        Point { x, y } if *x &gt; 0 &amp;&amp; *y &lt; 0 =&gt; "第四象限",
        Point { x: 0, .. } | Point { y: 0, .. } =&gt; "坐标轴上",
        _ =&gt; "原点",
    }
}

fn main() {
    println!("{}", quadrant(&amp;Point { x: 3, y: 4 }));   // 第一象限
    println!("{}", quadrant(&amp;Point { x: -2, y: 1 }));  // 第二象限
    println!("{}", quadrant(&amp;Point { x: 0, y: 5 }));   // 坐标轴上
}</code></pre></div>
<blockquote>
<p><strong>注意</strong>：模式守卫的 <code>if</code> 条件在模式匹配<strong>成功之后</strong>才执行。如果守卫条件为假，<code>match</code> 继续尝试后面的分支。</p>
</blockquote>
<h1 id="解构进阶">解构进阶</h1>
<h2 id="嵌套结构解构">嵌套结构解构</h2>
<p>Rust 允许你在一个模式里解构多层嵌套的结构体、枚举和元组：</p>
<div class="code-runner" data-full-code="struct%20Address%20%7B%0A%20%20%20%20city%3A%20String%2C%0A%20%20%20%20zip%3A%20String%2C%0A%7D%0A%0Astruct%20Person%20%7B%0A%20%20%20%20name%3A%20String%2C%0A%20%20%20%20age%3A%20u32%2C%0A%20%20%20%20address%3A%20Address%2C%0A%7D%0A%0Afn%20greet(p%3A%20%26Person)%20%7B%0A%20%20%20%20%2F%2F%20%E4%B8%80%E4%B8%AA%E6%A8%A1%E5%BC%8F%E8%A7%A3%E6%9E%84%E4%B8%A4%E5%B1%82%E7%BB%93%E6%9E%84%E4%BD%93%0A%20%20%20%20let%20Person%20%7B%0A%20%20%20%20%20%20%20%20name%2C%0A%20%20%20%20%20%20%20%20age%2C%0A%20%20%20%20%20%20%20%20address%3A%20Address%20%7B%20city%2C%20..%20%7D%2C%0A%20%20%20%20%20%20%20%20%2F%2F%20%5E%5E%5E%5E%5E%5E%5E%5E%5E%5E%5E%5E%5E%5E%5E%20%E5%B5%8C%E5%A5%97%E8%A7%A3%E6%9E%84%20Address%EF%BC%8C%E5%8F%AA%E5%8F%96%20city%0A%20%20%20%20%7D%20%3D%20p%3B%0A%0A%20%20%20%20println!(%22%E4%BD%A0%E5%A5%BD%EF%BC%8C%7B%7D%EF%BC%81%7B%7D%E5%B2%81%EF%BC%8C%E6%9D%A5%E8%87%AA%7B%7D%E3%80%82%22%2C%20name%2C%20age%2C%20city)%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20p%20%3D%20Person%20%7B%0A%20%20%20%20%20%20%20%20name%3A%20%22Alice%22.to_string()%2C%0A%20%20%20%20%20%20%20%20age%3A%2028%2C%0A%20%20%20%20%20%20%20%20address%3A%20Address%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20city%3A%20%22%E5%8C%97%E4%BA%AC%22.to_string()%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20zip%3A%20%22100000%22.to_string()%2C%0A%20%20%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%7D%3B%0A%20%20%20%20greet(%26p)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Address {
    city: String,
    zip: String,
}

struct Person {
    name: String,
    age: u32,
    address: Address,
}

fn greet(p: &amp;Person) {
    // 一个模式解构两层结构体
    let Person {
        name,
        age,
        address: Address { city, .. },
        // ^^^^^^^^^^^^^^^ 嵌套解构 Address，只取 city
    } = p;

    println!("你好，{}！{}岁，来自{}。", name, age, city);
}

fn main() {
    let p = Person {
        name: "Alice".to_string(),
        age: 28,
        address: Address {
            city: "北京".to_string(),
            zip: "100000".to_string(),
        },
    };
    greet(&amp;p);
}</code></pre></div>
<p>枚举中包含结构体的嵌套解构：</p>
<div class="code-runner" data-full-code="enum%20Event%20%7B%0A%20%20%20%20MouseClick%20%7B%20x%3A%20i32%2C%20y%3A%20i32%20%7D%2C%0A%20%20%20%20KeyPress(char)%2C%0A%20%20%20%20Resize%20%7B%20width%3A%20u32%2C%20height%3A%20u32%20%7D%2C%0A%7D%0A%0Afn%20handle(event%3A%20%26Event)%20%7B%0A%20%20%20%20match%20event%20%7B%0A%20%20%20%20%20%20%20%20Event%3A%3AMouseClick%20%7B%20x%2C%20y%20%7D%20if%20*x%20%3E%200%20%26%26%20*y%20%3E%200%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E7%82%B9%E5%87%BB%E5%9C%A8%E6%AD%A3%E8%B1%A1%E9%99%90%EF%BC%9A(%7B%7D%2C%20%7B%7D)%22%2C%20x%2C%20y)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20Event%3A%3AMouseClick%20%7B%20x%2C%20y%20%7D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E7%82%B9%E5%87%BB%E5%9C%A8%E8%B4%9F%E8%B1%A1%E9%99%90%E6%88%96%E8%BD%B4%E4%B8%8A%EF%BC%9A(%7B%7D%2C%20%7B%7D)%22%2C%20x%2C%20y)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20Event%3A%3AKeyPress(c)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E6%8C%89%E9%94%AE%EF%BC%9A'%7B%7D'%22%2C%20c)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20Event%3A%3AResize%20%7B%20width%2C%20height%20%7D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E7%AA%97%E5%8F%A3%E5%A4%A7%E5%B0%8F%EF%BC%9A%7B%7D%C3%97%7B%7D%22%2C%20width%2C%20height)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20handle(%26Event%3A%3AMouseClick%20%7B%20x%3A%2010%2C%20y%3A%2020%20%7D)%3B%0A%20%20%20%20handle(%26Event%3A%3AKeyPress('R'))%3B%0A%20%20%20%20handle(%26Event%3A%3AResize%20%7B%20width%3A%201920%2C%20height%3A%201080%20%7D)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">enum Event {
    MouseClick { x: i32, y: i32 },
    KeyPress(char),
    Resize { width: u32, height: u32 },
}

fn handle(event: &amp;Event) {
    match event {
        Event::MouseClick { x, y } if *x &gt; 0 &amp;&amp; *y &gt; 0 =&gt; {
            println!("点击在正象限：({}, {})", x, y);
        }
        Event::MouseClick { x, y } =&gt; {
            println!("点击在负象限或轴上：({}, {})", x, y);
        }
        Event::KeyPress(c) =&gt; {
            println!("按键：'{}'", c);
        }
        Event::Resize { width, height } =&gt; {
            println!("窗口大小：{}×{}", width, height);
        }
    }
}

fn main() {
    handle(&amp;Event::MouseClick { x: 10, y: 20 });
    handle(&amp;Event::KeyPress('R'));
    handle(&amp;Event::Resize { width: 1920, height: 1080 });
}</code></pre></div>
<h2 id="-忽略剩余字段"><code>..</code> 忽略剩余字段</h2>
<p>解构结构体时，不需要的字段可以用 <code>..</code> 忽略：</p>
<div class="code-runner" data-full-code="struct%20Config%20%7B%0A%20%20%20%20debug%3A%20bool%2C%0A%20%20%20%20timeout%3A%20u32%2C%0A%20%20%20%20retries%3A%20u32%2C%0A%20%20%20%20log_level%3A%20String%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20cfg%20%3D%20Config%20%7B%0A%20%20%20%20%20%20%20%20debug%3A%20true%2C%0A%20%20%20%20%20%20%20%20timeout%3A%2030%2C%0A%20%20%20%20%20%20%20%20retries%3A%203%2C%0A%20%20%20%20%20%20%20%20log_level%3A%20%22info%22.to_string()%2C%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E5%85%B3%E5%BF%83%20debug%20%E5%92%8C%20timeout%EF%BC%8C%E5%85%B6%E4%BD%99%E7%94%A8%20..%20%E5%BF%BD%E7%95%A5%0A%20%20%20%20let%20Config%20%7B%20debug%2C%20timeout%2C%20..%20%7D%20%3D%20cfg%3B%0A%20%20%20%20println!(%22%E8%B0%83%E8%AF%95%E6%A8%A1%E5%BC%8F%EF%BC%9A%7B%7D%EF%BC%8C%E8%B6%85%E6%97%B6%EF%BC%9A%7B%7Ds%22%2C%20debug%2C%20timeout)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Config {
    debug: bool,
    timeout: u32,
    retries: u32,
    log_level: String,
}

fn main() {
    let cfg = Config {
        debug: true,
        timeout: 30,
        retries: 3,
        log_level: "info".to_string(),
    };

    // 只关心 debug 和 timeout，其余用 .. 忽略
    let Config { debug, timeout, .. } = cfg;
    println!("调试模式：{}，超时：{}s", debug, timeout);
}</code></pre></div>
<p>元组中用 <code>..</code> 忽略头部或尾部：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20numbers%20%3D%20(1%2C%202%2C%203%2C%204%2C%205)%3B%0A%0A%20%20%20%20let%20(first%2C%20..%2C%20last)%20%3D%20numbers%3B%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%EF%BC%9A%7B%7D%EF%BC%8C%E6%9C%80%E5%90%8E%E4%B8%80%E4%B8%AA%EF%BC%9A%7B%7D%22%2C%20first%2C%20last)%3B%20%2F%2F%201%2C%205%0A%0A%20%20%20%20let%20(a%2C%20b%2C%20..)%20%3D%20numbers%3B%0A%20%20%20%20println!(%22%E5%89%8D%E4%B8%A4%E4%B8%AA%EF%BC%9A%7B%7D%20%7B%7D%22%2C%20a%2C%20b)%3B%20%2F%2F%201%202%0A%0A%20%20%20%20let%20(..%2C%20x%2C%20y)%20%3D%20numbers%3B%0A%20%20%20%20println!(%22%E5%90%8E%E4%B8%A4%E4%B8%AA%EF%BC%9A%7B%7D%20%7B%7D%22%2C%20x%2C%20y)%3B%20%2F%2F%204%205%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let numbers = (1, 2, 3, 4, 5);

    let (first, .., last) = numbers;
    println!("第一个：{}，最后一个：{}", first, last); // 1, 5

    let (a, b, ..) = numbers;
    println!("前两个：{} {}", a, b); // 1 2

    let (.., x, y) = numbers;
    println!("后两个：{} {}", x, y); // 4 5
}</code></pre></div>
<h2 id="-在模式中合并多个情况"><code>|</code> 在模式中合并多个情况</h2>
<p>用 <code>|</code> 在单个 match 分支里匹配多个模式：</p>
<div class="code-runner" data-full-code="fn%20is_weekday(day%3A%20u8)%20-%3E%20bool%20%7B%0A%20%20%20%20matches!(day%2C%201..%3D5)%20%2F%2F%20%E7%AD%89%E4%BB%B7%E4%BA%8E%20day%20%3E%3D%201%20%26%26%20day%20%3C%3D%205%0A%7D%0A%0Afn%20day_name(day%3A%20u8)%20-%3E%20%26'static%20str%20%7B%0A%20%20%20%20match%20day%20%7B%0A%20%20%20%20%20%20%20%201%20%3D%3E%20%22%E5%91%A8%E4%B8%80%22%2C%0A%20%20%20%20%20%20%20%202%20%3D%3E%20%22%E5%91%A8%E4%BA%8C%22%2C%0A%20%20%20%20%20%20%20%203%20%3D%3E%20%22%E5%91%A8%E4%B8%89%22%2C%0A%20%20%20%20%20%20%20%204%20%3D%3E%20%22%E5%91%A8%E5%9B%9B%22%2C%0A%20%20%20%20%20%20%20%205%20%3D%3E%20%22%E5%91%A8%E4%BA%94%22%2C%0A%20%20%20%20%20%20%20%206%20%7C%207%20%3D%3E%20%22%E5%91%A8%E6%9C%AB%22%2C%20%20%2F%2F%20%E7%94%A8%20%7C%20%E5%90%88%E5%B9%B6%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20%22%E6%97%A0%E6%95%88%22%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20describe_char(c%3A%20char)%20-%3E%20%26'static%20str%20%7B%0A%20%20%20%20match%20c%20%7B%0A%20%20%20%20%20%20%20%20'a'..%3D'z'%20%7C%20'A'..%3D'Z'%20%3D%3E%20%22%E5%AD%97%E6%AF%8D%22%2C%20%20%20%2F%2F%20%E8%8C%83%E5%9B%B4%20%2B%20%7C%20%E7%BB%84%E5%90%88%0A%20%20%20%20%20%20%20%20'0'..%3D'9'%20%3D%3E%20%22%E6%95%B0%E5%AD%97%22%2C%0A%20%20%20%20%20%20%20%20'%20'%20%7C%20'%5Ct'%20%7C%20'%5Cn'%20%3D%3E%20%22%E7%A9%BA%E7%99%BD%22%2C%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20%22%E5%85%B6%E4%BB%96%22%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20day_name(3))%3B%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%91%A8%E4%B8%89%0A%20%20%20%20println!(%22%7B%7D%22%2C%20day_name(6))%3B%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%91%A8%E6%9C%AB%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe_char('R'))%3B%20%20%2F%2F%20%E5%AD%97%E6%AF%8D%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe_char('7'))%3B%20%20%2F%2F%20%E6%95%B0%E5%AD%97%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe_char('%20'))%3B%20%2F%2F%20%E7%A9%BA%E7%99%BD%0A%7D" data-mode="run"><pre><code class="language-rust">fn is_weekday(day: u8) -&gt; bool {
    matches!(day, 1..=5) // 等价于 day &gt;= 1 &amp;&amp; day &lt;= 5
}

fn day_name(day: u8) -&gt; &amp;'static str {
    match day {
        1 =&gt; "周一",
        2 =&gt; "周二",
        3 =&gt; "周三",
        4 =&gt; "周四",
        5 =&gt; "周五",
        6 | 7 =&gt; "周末",  // 用 | 合并
        _ =&gt; "无效",
    }
}

fn describe_char(c: char) -&gt; &amp;'static str {
    match c {
        'a'..='z' | 'A'..='Z' =&gt; "字母",   // 范围 + | 组合
        '0'..='9' =&gt; "数字",
        ' ' | '\t' | '\n' =&gt; "空白",
        _ =&gt; "其他",
    }
}

fn main() {
    println!("{}", day_name(3));         // 周三
    println!("{}", day_name(6));         // 周末
    println!("{}", describe_char('R'));  // 字母
    println!("{}", describe_char('7'));  // 数字
    println!("{}", describe_char(' ')); // 空白
}</code></pre></div>
<h1 id="切片模式">切片模式</h1>
<p>结构体和枚举的解构你已经很熟悉了。切片（slice）也可以用模式匹配，而且语法非常直观——用 <code>[]</code> 括起来，按位置描述元素。</p>
<h2 id="基本用法">基本用法</h2>
<div class="code-runner" data-full-code="fn%20describe(nums%3A%20%26%5Bi32%5D)%20-%3E%20String%20%7B%0A%20%20%20%20match%20nums%20%7B%0A%20%20%20%20%20%20%20%20%5B%5D%20%20%20%20%20%20%20%20%3D%3E%20%22%E7%A9%BA%22.to_string()%2C%0A%20%20%20%20%20%20%20%20%5Bx%5D%20%20%20%20%20%20%20%3D%3E%20format!(%22%E5%8F%AA%E6%9C%89%E4%B8%80%E4%B8%AA%EF%BC%9A%7B%7D%22%2C%20x)%2C%0A%20%20%20%20%20%20%20%20%5Bx%2C%20y%5D%20%20%20%20%3D%3E%20format!(%22%E6%81%B0%E5%A5%BD%E4%B8%A4%E4%B8%AA%EF%BC%9A%7B%7D%20%E5%92%8C%20%7B%7D%22%2C%20x%2C%20y)%2C%0A%20%20%20%20%20%20%20%20%5Bfirst%2C%20..%2C%20last%5D%20%3D%3E%20format!(%22%E9%A6%96%20%7B%7D%EF%BC%8C%E5%B0%BE%20%7B%7D%EF%BC%8C%E5%85%B1%20%7B%7D%20%E4%B8%AA%22%2C%20first%2C%20last%2C%20nums.len())%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe(%26%5B%5D))%3B%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E7%A9%BA%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe(%26%5B42%5D))%3B%20%20%20%20%20%20%20%20%2F%2F%20%E5%8F%AA%E6%9C%89%E4%B8%80%E4%B8%AA%EF%BC%9A42%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe(%26%5B1%2C%202%5D))%3B%20%20%20%20%20%20%2F%2F%20%E6%81%B0%E5%A5%BD%E4%B8%A4%E4%B8%AA%EF%BC%9A1%20%E5%92%8C%202%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe(%26%5B1%2C%202%2C%203%2C%204%5D))%3B%20%2F%2F%20%E9%A6%96%201%EF%BC%8C%E5%B0%BE%204%EF%BC%8C%E5%85%B1%204%20%E4%B8%AA%0A%7D" data-mode="run"><pre><code class="language-rust">fn describe(nums: &amp;[i32]) -&gt; String {
    match nums {
        []        =&gt; "空".to_string(),
        [x]       =&gt; format!("只有一个：{}", x),
        [x, y]    =&gt; format!("恰好两个：{} 和 {}", x, y),
        [first, .., last] =&gt; format!("首 {}，尾 {}，共 {} 个", first, last, nums.len()),
    }
}

fn main() {
    println!("{}", describe(&amp;[]));          // 空
    println!("{}", describe(&amp;[42]));        // 只有一个：42
    println!("{}", describe(&amp;[1, 2]));      // 恰好两个：1 和 2
    println!("{}", describe(&amp;[1, 2, 3, 4])); // 首 1，尾 4，共 4 个
}</code></pre></div>
<p><code>[first, .., last]</code> 里的 <code>..</code> 和结构体里的 <code>..</code> 是同一个概念——忽略中间任意多个元素。</p>
<h2 id="捕获剩余部分rest-">捕获剩余部分：<code>rest @ ..</code></h2>
<p>用 <code>@</code> 绑定可以把”剩余部分”也捕获成一个子切片：</p>
<div class="code-runner" data-full-code="fn%20process(data%3A%20%26%5Bi32%5D)%20%7B%0A%20%20%20%20match%20data%20%7B%0A%20%20%20%20%20%20%20%20%5B%5D%20%3D%3E%20println!(%22%E6%B2%A1%E6%9C%89%E6%95%B0%E6%8D%AE%22)%2C%0A%20%20%20%20%20%20%20%20%5Bhead%2C%20tail%20%40%20..%5D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20head%20%E6%98%AF%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%8Ctail%20%E6%98%AF%E5%89%A9%E4%BD%99%E9%83%A8%E5%88%86%E7%9A%84%E5%88%87%E7%89%87%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%A4%B4%EF%BC%9A%7B%7D%EF%BC%8C%E5%89%A9%E4%BD%99%20%7B%7D%20%E4%B8%AA%EF%BC%9A%7B%3A%3F%7D%22%2C%20head%2C%20tail.len()%2C%20tail)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E9%80%92%E5%BD%92%E5%A4%84%E7%90%86%20tail%EF%BC%8C%E6%88%96%E8%80%85%E7%BB%A7%E7%BB%AD%E5%8C%B9%E9%85%8D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20process(%26%5B10%2C%2020%2C%2030%2C%2040%5D)%3B%20%20%2F%2F%20%E5%A4%B4%EF%BC%9A10%EF%BC%8C%E5%89%A9%E4%BD%99%203%20%E4%B8%AA%EF%BC%9A%5B20%2C%2030%2C%2040%5D%0A%20%20%20%20process(%26%5B99%5D)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%A4%B4%EF%BC%9A99%EF%BC%8C%E5%89%A9%E4%BD%99%200%20%E4%B8%AA%EF%BC%9A%5B%5D%0A%20%20%20%20process(%26%5B%5D)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E6%B2%A1%E6%9C%89%E6%95%B0%E6%8D%AE%0A%7D" data-mode="run"><pre><code class="language-rust">fn process(data: &amp;[i32]) {
    match data {
        [] =&gt; println!("没有数据"),
        [head, tail @ ..] =&gt; {
            // head 是第一个元素，tail 是剩余部分的切片
            println!("头：{}，剩余 {} 个：{:?}", head, tail.len(), tail);
            // 可以递归处理 tail，或者继续匹配
        }
    }
}

fn main() {
    process(&amp;[10, 20, 30, 40]);  // 头：10，剩余 3 个：[20, 30, 40]
    process(&amp;[99]);               // 头：99，剩余 0 个：[]
    process(&amp;[]);                 // 没有数据
}</code></pre></div>
<p><code>tail @ ..</code> 的意思是：把 <code>..</code>（剩余所有元素）绑定到名字 <code>tail</code>。<code>tail</code> 的类型是 <code>&amp;[i32]</code>，可以继续对它做任何切片操作。</p>
<h2 id="实际用途协议解析">实际用途：协议解析</h2>
<p>切片模式在处理结构化字节流时特别有用——比如解析一个简单的文本命令：</p>
<div class="code-runner" data-full-code="fn%20handle_command(parts%3A%20%26%5B%26str%5D)%20-%3E%20String%20%7B%0A%20%20%20%20match%20parts%20%7B%0A%20%20%20%20%20%20%20%20%5B%22quit%22%5D%20%7C%20%5B%22exit%22%5D%20%3D%3E%20%22%E9%80%80%E5%87%BA%E7%A8%8B%E5%BA%8F%22.to_string()%2C%0A%20%20%20%20%20%20%20%20%5B%22help%22%5D%20%3D%3E%20%22%E6%98%BE%E7%A4%BA%E5%B8%AE%E5%8A%A9%22.to_string()%2C%0A%20%20%20%20%20%20%20%20%5B%22get%22%2C%20key%5D%20%3D%3E%20format!(%22%E8%8E%B7%E5%8F%96%20key%3A%20%7B%7D%22%2C%20key)%2C%0A%20%20%20%20%20%20%20%20%5B%22set%22%2C%20key%2C%20value%5D%20%3D%3E%20format!(%22%E8%AE%BE%E7%BD%AE%20%7B%7D%20%3D%20%7B%7D%22%2C%20key%2C%20value)%2C%0A%20%20%20%20%20%20%20%20%5B%22set%22%2C%20..%5D%20%3D%3E%20%22%E7%94%A8%E6%B3%95%EF%BC%9Aset%20%3Ckey%3E%20%3Cvalue%3E%22.to_string()%2C%0A%20%20%20%20%20%20%20%20%5Bcmd%2C%20..%5D%20%3D%3E%20format!(%22%E6%9C%AA%E7%9F%A5%E5%91%BD%E4%BB%A4%EF%BC%9A%7B%7D%22%2C%20cmd)%2C%0A%20%20%20%20%20%20%20%20%5B%5D%20%3D%3E%20%22%E8%AF%B7%E8%BE%93%E5%85%A5%E5%91%BD%E4%BB%A4%22.to_string()%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20handle_command(%26%5B%22get%22%2C%20%22name%22%5D))%3B%20%20%20%20%20%20%20%2F%2F%20%E8%8E%B7%E5%8F%96%20key%3A%20name%0A%20%20%20%20println!(%22%7B%7D%22%2C%20handle_command(%26%5B%22set%22%2C%20%22x%22%2C%20%2242%22%5D))%3B%20%20%20%20%2F%2F%20%E8%AE%BE%E7%BD%AE%20x%20%3D%2042%0A%20%20%20%20println!(%22%7B%7D%22%2C%20handle_command(%26%5B%22set%22%2C%20%22x%22%5D))%3B%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E7%94%A8%E6%B3%95%EF%BC%9Aset%20%3Ckey%3E%20%3Cvalue%3E%0A%20%20%20%20println!(%22%7B%7D%22%2C%20handle_command(%26%5B%22quit%22%5D))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E9%80%80%E5%87%BA%E7%A8%8B%E5%BA%8F%0A%20%20%20%20println!(%22%7B%7D%22%2C%20handle_command(%26%5B%22foo%22%2C%20%22bar%22%2C%20%22baz%22%5D))%3B%20%2F%2F%20%E6%9C%AA%E7%9F%A5%E5%91%BD%E4%BB%A4%EF%BC%9Afoo%0A%7D" data-mode="run"><pre><code class="language-rust">fn handle_command(parts: &amp;[&amp;str]) -&gt; String {
    match parts {
        ["quit"] | ["exit"] =&gt; "退出程序".to_string(),
        ["help"] =&gt; "显示帮助".to_string(),
        ["get", key] =&gt; format!("获取 key: {}", key),
        ["set", key, value] =&gt; format!("设置 {} = {}", key, value),
        ["set", ..] =&gt; "用法：set &lt;key&gt; &lt;value&gt;".to_string(),
        [cmd, ..] =&gt; format!("未知命令：{}", cmd),
        [] =&gt; "请输入命令".to_string(),
    }
}

fn main() {
    println!("{}", handle_command(&amp;["get", "name"]));       // 获取 key: name
    println!("{}", handle_command(&amp;["set", "x", "42"]));    // 设置 x = 42
    println!("{}", handle_command(&amp;["set", "x"]));          // 用法：set &lt;key&gt; &lt;value&gt;
    println!("{}", handle_command(&amp;["quit"]));               // 退出程序
    println!("{}", handle_command(&amp;["foo", "bar", "baz"])); // 未知命令：foo
}</code></pre></div>
<p>注意分支顺序：<code>["set", key, value]</code> 必须在 <code>["set", ..]</code> 前面，因为 <code>match</code> 从上往下匹配，更具体的模式要写在更宽泛的前面。</p>
<h1 id="ref-绑定与-match-ergonomics">ref 绑定与 match ergonomics</h1>
<h2 id="所有权问题">所有权问题</h2>
<p><code>match</code> 默认会<strong>移动</strong>被匹配的值。对 <code>String</code>、<code>Vec</code> 等有所有权的类型，这往往不是你想要的：</p>
<div class="code-runner" data-full-code="struct%20User%20%7B%0A%20%20%20%20name%3A%20String%2C%0A%20%20%20%20age%3A%20u32%2C%0A%7D%0A%0Afn%20greet(user%3A%20%26User)%20%7B%0A%20%20%20%20match%20user%20%7B%0A%20%20%20%20%20%20%20%20User%20%7B%20name%2C%20age%20%7D%20%3D%3E%20println!(%22%E4%BD%A0%E5%A5%BD%20%7B%7D%EF%BC%8C%7B%7D%E5%B2%81%22%2C%20name%2C%20age)%2C%0A%20%20%20%20%20%20%20%20%2F%2F%20%E2%9D%8C%20%E8%AF%95%E5%9B%BE%E4%BB%8E%20%26User%20%E9%87%8C%E7%A7%BB%E8%B5%B0%20String%EF%BC%8C%E4%B8%8D%E5%85%81%E8%AE%B8%0A%20%20%20%20%7D%0A%7D%0Afn%20main()%20%7B%7D" data-has-hidden="true" data-mode="expect-error"><pre><code class="language-rust">struct User {
    name: String,
    age: u32,
}

fn greet(user: &amp;User) {
    match user {
        User { name, age } =&gt; println!("你好 {}，{}岁", name, age),
        // ❌ 试图从 &amp;User 里移走 String，不允许
    }
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">struct</span><span style="color:#B392F0"> User</span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#E1E4E8">    name</span><span style="color:#F97583">:</span><span style="color:#B392F0"> String</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#E1E4E8">    age</span><span style="color:#F97583">:</span><span style="color:#B392F0"> u32</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>

<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> greet</span><span style="color:#E1E4E8">(user</span><span style="color:#F97583">:</span><span style="color:#F97583"> &amp;</span><span style="color:#B392F0">User</span><span style="color:#E1E4E8">) {</span></span>
<span class="line"><span style="color:#F97583">    match</span><span style="color:#E1E4E8"> user {</span></span>
<span class="line"><span style="color:#B392F0">        User</span><span style="color:#E1E4E8"> { name, age } </span><span style="color:#F97583">=&gt;</span><span style="color:#B392F0"> println!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"你好 {}，{}岁"</span><span style="color:#E1E4E8">, name, age),</span></span>
<span class="line"><span style="color:#6A737D">        // ❌ 试图从 &amp;User 里移走 String，不允许</span></span>
<span class="line"><span style="color:#E1E4E8">    }</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {}</span></span></div></div>
<p>有三种方式解决。</p>
<h2 id="方式一对引用本身-match">方式一：对引用本身 match</h2>
<p>最常见的做法——直接 match <code>&amp;user</code>（或者 match <code>*user</code> 并在模式里写 <code>&amp;</code>）：</p>
<div class="code-runner" data-full-code="struct%20User%20%7B%20name%3A%20String%2C%20age%3A%20u32%20%7D%0A%0Afn%20greet(user%3A%20%26User)%20%7B%0A%20%20%20%20%2F%2F%20%E5%AF%B9%20%26User%20%E8%A7%A3%E6%9E%84%EF%BC%8Cname%20%E5%92%8C%20age%20%E8%87%AA%E5%8A%A8%E6%88%90%E4%B8%BA%E5%BC%95%E7%94%A8%0A%20%20%20%20let%20User%20%7B%20name%2C%20age%20%7D%20%3D%20user%3B%0A%20%20%20%20println!(%22%E4%BD%A0%E5%A5%BD%20%7B%7D%EF%BC%8C%7B%7D%E5%B2%81%22%2C%20name%2C%20age)%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20u%20%3D%20User%20%7B%20name%3A%20%22Alice%22.to_string()%2C%20age%3A%2030%20%7D%3B%0A%20%20%20%20greet(%26u)%3B%0A%20%20%20%20println!(%22u.name%20%E8%BF%98%E5%9C%A8%EF%BC%9A%7B%7D%22%2C%20u.name)%3B%20%2F%2F%20%E6%B2%A1%E6%9C%89%E8%A2%AB%E7%A7%BB%E8%B5%B0%0A%7D" data-mode="run"><pre><code class="language-rust">struct User { name: String, age: u32 }

fn greet(user: &amp;User) {
    // 对 &amp;User 解构，name 和 age 自动成为引用
    let User { name, age } = user;
    println!("你好 {}，{}岁", name, age);
}

fn main() {
    let u = User { name: "Alice".to_string(), age: 30 };
    greet(&amp;u);
    println!("u.name 还在：{}", u.name); // 没有被移走
}</code></pre></div>
<p>对 <code>&amp;T</code> 做 <code>let</code> 解构时，Rust 自动把字段变成引用（<code>name: &amp;String</code>，<code>age: &amp;u32</code>）。这就是 <strong>match ergonomics</strong>：编译器帮你省去了每个字段前手写 <code>ref</code> 的麻烦。</p>
<h2 id="方式二显式-ref-绑定">方式二：显式 ref 绑定</h2>
<p>在模式里显式写 <code>ref</code>，把绑定变成引用而不是移动：</p>
<div class="code-runner" data-full-code="struct%20User%20%7B%20name%3A%20String%2C%20age%3A%20u32%20%7D%0A%0Afn%20greet(user%3A%20User)%20%7B%20%2F%2F%20%E6%B3%A8%E6%84%8F%EF%BC%9A%E6%8B%BF%E7%9A%84%E6%98%AF%E6%89%80%E6%9C%89%E6%9D%83%0A%20%20%20%20match%20user%20%7B%0A%20%20%20%20%20%20%20%20User%20%7B%20ref%20name%2C%20age%20%7D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20name%20%E6%98%AF%20%26String%EF%BC%88%E5%80%9F%E7%94%A8%EF%BC%89%EF%BC%8Cage%20%E6%98%AF%20u32%EF%BC%88Copy%EF%BC%8C%E7%9B%B4%E6%8E%A5%E5%A4%8D%E5%88%B6%EF%BC%89%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E4%BD%A0%E5%A5%BD%20%7B%7D%EF%BC%8C%7B%7D%E5%B2%81%22%2C%20name%2C%20age)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20user.name%20%E6%B2%A1%E6%9C%89%E8%A2%AB%E7%A7%BB%E8%B5%B0%EF%BC%8C%E4%BD%86%20user%20%E8%BF%98%E5%9C%A8%E8%BF%99%E4%B8%AA%20match%20%E4%BD%9C%E7%94%A8%E5%9F%9F%E9%87%8C%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20greet(User%20%7B%20name%3A%20%22Bob%22.to_string()%2C%20age%3A%2025%20%7D)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct User { name: String, age: u32 }

fn greet(user: User) { // 注意：拿的是所有权
    match user {
        User { ref name, age } =&gt; {
            // name 是 &amp;String（借用），age 是 u32（Copy，直接复制）
            println!("你好 {}，{}岁", name, age);
            // user.name 没有被移走，但 user 还在这个 match 作用域里
        }
    }
}

fn main() {
    greet(User { name: "Bob".to_string(), age: 25 });
}</code></pre></div>
<p><code>ref name</code> 告诉编译器：不要移动 <code>name</code>，给我一个 <code>&amp;String</code>。<code>ref mut name</code> 则给一个 <code>&amp;mut String</code>。</p>
<h2 id="什么时候还需要手写-ref">什么时候还需要手写 ref？</h2>
<p>match ergonomics（自动推导引用）覆盖了大多数情况，但有两种场景仍需手写 <code>ref</code>：</p>
<p><strong>1. 在 <code>let</code> 解构里只想借用部分字段，其他字段要移动：</strong></p>
<div class="code-runner" data-full-code="struct%20Packet%20%7B%20header%3A%20u8%2C%20payload%3A%20String%20%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20p%20%3D%20Packet%20%7B%20header%3A%200xAB%2C%20payload%3A%20%22%E6%95%B0%E6%8D%AE%22.to_string()%20%7D%3B%0A%0A%20%20%20%20%2F%2F%20header%20%E7%A7%BB%E5%8A%A8%EF%BC%88Copy%20%E7%B1%BB%E5%9E%8B%EF%BC%8C%E5%AE%9E%E9%99%85%E6%98%AF%E5%A4%8D%E5%88%B6%EF%BC%89%EF%BC%8Cpayload%20%E5%80%9F%E7%94%A8%0A%20%20%20%20let%20Packet%20%7B%20header%2C%20ref%20payload%20%7D%20%3D%20p%3B%0A%0A%20%20%20%20println!(%22%E5%A4%B4%EF%BC%9A%7B%3A%23x%7D%22%2C%20header)%3B%0A%20%20%20%20println!(%22%E6%95%B0%E6%8D%AE%EF%BC%9A%7B%7D%22%2C%20payload)%3B%0A%20%20%20%20println!(%22p.payload%20%E8%BF%98%E5%9C%A8%EF%BC%9A%7B%7D%22%2C%20p.payload)%3B%20%2F%2F%20%E6%B2%A1%E6%9C%89%E8%A2%AB%E7%A7%BB%E8%B5%B0%0A%7D" data-mode="run"><pre><code class="language-rust">struct Packet { header: u8, payload: String }

fn main() {
    let p = Packet { header: 0xAB, payload: "数据".to_string() };

    // header 移动（Copy 类型，实际是复制），payload 借用
    let Packet { header, ref payload } = p;

    println!("头：{:#x}", header);
    println!("数据：{}", payload);
    println!("p.payload 还在：{}", p.payload); // 没有被移走
}</code></pre></div>
<p><strong>2. 在 <code>match</code> 里对同一个值同时需要移动部分字段和借用部分字段时，ergonomics 可能推导不出你想要的，显式 <code>ref</code> 可以精确控制。</strong></p>
<blockquote>
<p><strong>简单记法</strong>：</p>
<ul>
<li>匹配 <code>&amp;T</code> 或 <code>&amp;mut T</code> → match ergonomics 自动处理，大多数情况不需要 <code>ref</code></li>
<li>匹配有所有权的 <code>T</code>，只想借用某个字段 → 在那个字段前写 <code>ref</code></li>
</ul>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="模式匹配测验">模式匹配测验</h2>
</div>
<pre><code class="language-rust">fn main() {
    let pair = (3, -2);
    let result = match pair {
        (x, y) if x == y =&gt; "相等",
        (x, y) if x + y &gt; 0 =&gt; "和为正",
        _ =&gt; "其他",
    };
    println!("{}", result);
}</code></pre>
</div>
<pre><code class="language-rust">fn main() {
    let numbers = (1, 2, 3, 4, 5);
    let (.., last) = numbers;
    println!("{}", last);
}</code></pre>
</div>
<pre><code class="language-rust">struct Config {
    width: u32,
    height: u32,
    title: String,
}</code></pre>
</div>
</div> 