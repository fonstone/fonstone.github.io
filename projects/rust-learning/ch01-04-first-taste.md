---
title: "示例：今天是星期几？"
description: "Rust 基础 - 示例：今天是星期几？"
date: "2026-07-12"
order: 1004
tags: ["初探第一个程序", "日期计算", "星期几"]
est_time: "10 分钟"
---

 <h1 id="代码初体验">代码初体验</h1>
<p>在正式学习语法之前，我们先来跑一个真正”有用”的程序，感受一下 Rust 代码长什么样。</p>
<p><strong>你的目标很简单</strong>：输入一个日期（年/月/日），程序告诉你那天是星期几。</p>
<p>你可以尝试看一下下面的代码，但不需要现在看懂每一行——就像第一次坐飞机，你不必先学会造飞机。先上去飞一圈，感受一下。</p>
<h2 id="完整程序">完整程序</h2>
<p>下面是一个能运行的完整程序。点击”运行”看看结果，然后我们再一起扫一眼代码结构。</p>
<div class="code-runner" data-full-code="%2F%2F%20%E5%88%A4%E6%96%AD%E6%98%AF%E5%90%A6%E6%98%AF%E9%97%B0%E5%B9%B4%0Afn%20is_leap_year(year%3A%20u32)%20-%3E%20bool%20%7B%0A%20%20%20%20(year%20%25%204%20%3D%3D%200%20%26%26%20year%20%25%20100%20!%3D%200)%20%7C%7C%20year%20%25%20400%20%3D%3D%200%0A%7D%0A%0A%2F%2F%20%E8%BF%94%E5%9B%9E%E6%9F%90%E6%9C%88%E6%9C%89%E5%A4%9A%E5%B0%91%E5%A4%A9%0Afn%20days_in_month(year%3A%20u32%2C%20month%3A%20u32)%20-%3E%20u32%20%7B%0A%20%20%20%20match%20month%20%7B%0A%20%20%20%20%20%20%20%201%20%7C%203%20%7C%205%20%7C%207%20%7C%208%20%7C%2010%20%7C%2012%20%3D%3E%2031%2C%0A%20%20%20%20%20%20%20%204%20%7C%206%20%7C%209%20%7C%2011%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3D%3E%2030%2C%0A%20%20%20%20%20%20%20%202%20%3D%3E%20if%20is_leap_year(year)%20%7B%2029%20%7D%20else%20%7B%2028%20%7D%2C%0A%20%20%20%20%20%20%20%20_%20%20%3D%3E%200%2C%0A%20%20%20%20%7D%0A%7D%0A%0A%2F%2F%20%E8%AE%A1%E7%AE%97%E6%98%9F%E6%9C%9F%E5%87%A0%0A%2F%2F%20%E5%9F%BA%E5%87%86%EF%BC%9A1583%E5%B9%B41%E6%9C%881%E6%97%A5%E6%98%AF%E6%98%9F%E6%9C%9F%E5%85%AD%EF%BC%88%E6%A0%BC%E9%87%8C%E5%8E%86%E6%AD%A3%E5%BC%8F%E5%AE%9E%E6%96%BD%E7%9A%84%E7%AC%AC%E4%B8%80%E5%B9%B4%E5%85%83%E6%97%A6%EF%BC%89%0Afn%20day_of_week(year%3A%20u32%2C%20month%3A%20u32%2C%20day%3A%20u32)%20-%3E%20%26'static%20str%20%7B%0A%20%20%20%20let%20weekdays%20%3D%20%5B%22%E6%97%A5%22%2C%20%22%E4%B8%80%22%2C%20%22%E4%BA%8C%22%2C%20%22%E4%B8%89%22%2C%20%22%E5%9B%9B%22%2C%20%22%E4%BA%94%22%2C%20%22%E5%85%AD%22%5D%3B%0A%0A%20%20%20%20let%20mut%20total_days%3A%20u32%20%3D%200%3B%0A%0A%20%20%20%20%2F%2F%20%E7%B4%AF%E5%8A%A0%201583%20%E5%B9%B4%E5%88%B0%E7%9B%AE%E6%A0%87%E5%B9%B4%E4%B9%8B%E5%89%8D%E7%9A%84%E5%A4%A9%E6%95%B0%0A%20%20%20%20for%20y%20in%201583..year%20%7B%0A%20%20%20%20%20%20%20%20total_days%20%2B%3D%20if%20is_leap_year(y)%20%7B%20366%20%7D%20else%20%7B%20365%20%7D%3B%0A%20%20%20%20%7D%0A%20%20%20%20%2F%2F%20%E7%B4%AF%E5%8A%A0%E7%9B%AE%E6%A0%87%E5%B9%B4%E5%86%85%E5%90%84%E6%9C%88%E7%9A%84%E5%A4%A9%E6%95%B0%0A%20%20%20%20for%20m%20in%201..month%20%7B%0A%20%20%20%20%20%20%20%20total_days%20%2B%3D%20days_in_month(year%2C%20m)%3B%0A%20%20%20%20%7D%0A%20%20%20%20%2F%2F%20%E5%8A%A0%E4%B8%8A%E5%BD%93%E6%9C%88%E5%B7%B2%E8%BF%87%E7%9A%84%E5%A4%A9%E6%95%B0%EF%BC%88%E7%AC%AC1%E5%A4%A9%E4%B8%8D%E9%A2%9D%E5%A4%96%E5%8A%A0%EF%BC%89%0A%20%20%20%20total_days%20%2B%3D%20day%20-%201%3B%0A%0A%20%20%20%20%2F%2F%201583-01-01%20%E6%98%AF%E6%98%9F%E6%9C%9F%E5%85%AD%EF%BC%88%E7%B4%A2%E5%BC%95%206%EF%BC%89%EF%BC%8C%E6%8E%A8%E7%AE%97%E7%9B%AE%E6%A0%87%E6%97%A5%E6%9C%9F%0A%20%20%20%20let%20index%20%3D%20(total_days%20%2B%206)%20%25%207%3B%0A%20%20%20%20weekdays%5Bindex%20as%20usize%5D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%87%A0%E4%B8%AA%E6%9C%89%E6%84%8F%E6%80%9D%E7%9A%84%E6%97%A5%E6%9C%9F%0A%20%20%20%20let%20dates%20%3D%20%5B%0A%20%20%20%20%20%20%20%20(1583%2C%20%201%2C%20%201%2C%20%221583%E5%B9%B4%E5%85%83%E6%97%A6%EF%BC%88%E6%A0%BC%E9%87%8C%E5%8E%86%E5%85%83%E5%B9%B4%EF%BC%89%22)%2C%0A%20%20%20%20%20%20%20%20(1776%2C%20%207%2C%20%204%2C%20%22%E7%BE%8E%E5%9B%BD%E7%8B%AC%E7%AB%8B%E5%AE%A3%E8%A8%80%E7%AD%BE%E7%BD%B2%22)%2C%0A%20%20%20%20%20%20%20%20(1969%2C%20%207%2C%2020%2C%20%22%E9%98%BF%E6%B3%A2%E7%BD%9711%E5%8F%B7%E7%99%BB%E6%9C%88%22)%2C%0A%20%20%20%20%20%20%20%20(2008%2C%20%208%2C%20%208%2C%20%22%E5%8C%97%E4%BA%AC%E5%A5%A5%E8%BF%90%E4%BC%9A%E5%BC%80%E5%B9%95%22)%2C%0A%20%20%20%20%20%20%20%20(2024%2C%20%201%2C%20%201%2C%20%222024%E5%B9%B4%E5%85%83%E6%97%A6%22)%2C%0A%20%20%20%20%5D%3B%0A%0A%20%20%20%20println!(%22%7B%3A%3C24%7D%20%E6%98%9F%E6%9C%9F%22%2C%20%22%E6%97%A5%E6%9C%9F%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20%22%E2%94%80%22.repeat(30))%3B%0A%0A%20%20%20%20for%20(year%2C%20month%2C%20day%2C%20label)%20in%20dates%20%7B%0A%20%20%20%20%20%20%20%20let%20w%20%3D%20day_of_week(year%2C%20month%2C%20day)%3B%0A%20%20%20%20%20%20%20%20println!(%22%7B%3A%3C24%7D%20%E6%98%9F%E6%9C%9F%7B%7D%22%2C%20label%2C%20w)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">// 判断是否是闰年
fn is_leap_year(year: u32) -&gt; bool {
    (year % 4 == 0 &amp;&amp; year % 100 != 0) || year % 400 == 0
}

// 返回某月有多少天
fn days_in_month(year: u32, month: u32) -&gt; u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 =&gt; 31,
        4 | 6 | 9 | 11              =&gt; 30,
        2 =&gt; if is_leap_year(year) { 29 } else { 28 },
        _  =&gt; 0,
    }
}

// 计算星期几
// 基准：1583年1月1日是星期六（格里历正式实施的第一年元旦）
fn day_of_week(year: u32, month: u32, day: u32) -&gt; &amp;'static str {
    let weekdays = ["日", "一", "二", "三", "四", "五", "六"];

    let mut total_days: u32 = 0;

    // 累加 1583 年到目标年之前的天数
    for y in 1583..year {
        total_days += if is_leap_year(y) { 366 } else { 365 };
    }
    // 累加目标年内各月的天数
    for m in 1..month {
        total_days += days_in_month(year, m);
    }
    // 加上当月已过的天数（第1天不额外加）
    total_days += day - 1;

    // 1583-01-01 是星期六（索引 6），推算目标日期
    let index = (total_days + 6) % 7;
    weekdays[index as usize]
}

fn main() {
    // 几个有意思的日期
    let dates = [
        (1583,  1,  1, "1583年元旦（格里历元年）"),
        (1776,  7,  4, "美国独立宣言签署"),
        (1969,  7, 20, "阿波罗11号登月"),
        (2008,  8,  8, "北京奥运会开幕"),
        (2024,  1,  1, "2024年元旦"),
    ];

    println!("{:&lt;24} 星期", "日期");
    println!("{}", "─".repeat(30));

    for (year, month, day, label) in dates {
        let w = day_of_week(year, month, day);
        println!("{:&lt;24} 星期{}", label, w);
    }
}</code></pre></div>
<blockquote>
<p><strong>为什么代码里要以 1583 年为基准？</strong></p>
<p>1582 年之前，欧洲使用的是<strong>儒略历</strong>（Julian calendar），它的闰年规则比较简单（每 4 年一闰），但长期积累了误差——到 16 世纪末，历法已经比天文实际多走了约 10 天，导致春分节气漂移，影响复活节的计算。</p>
<p>1582 年，罗马教皇格里高利十三世推行<strong>格里历</strong>（Gregorian calendar，即今天全球通用的公历）：规定整百年只有被 400 整除才算闰年（如 1600、2000 是闰年，而 1700、1800、1900 不是）。为了弥补历史误差，改历时<strong>直接删掉了 10 天</strong>——1582 年 10 月 4 日（星期四）的第二天变成了 10 月 15 日（星期五），中间 10 天在历史上消失了。</p>
<p>本程序使用格里历规则，从格里历正式生效的 <strong>1583 年 1 月 1 日</strong>起均可正确计算。</p>
</blockquote>
<h2 id="代码结构速览">代码结构速览</h2>
<p>不用现在记住语法细节，只看<strong>整体骨架</strong>：</p>
<pre><code class="language-text">fn is_leap_year(...)  → 一个函数：判断闰年
fn days_in_month(...) → 一个函数：返回月份天数
fn day_of_week(...)   → 一个函数：返回"一"/"二"/...
fn main()             → 程序入口：调用上面的函数，打印结果</code></pre>
<p>你能注意到的 Rust 特点：</p>
<ul>
<li><code>fn</code> 开头定义函数（function 的缩写）</li>
<li><code>//</code> 是注释，编译器忽略</li>
<li><code>match</code> 类似其他语言的 <code>switch</code>，但更强大</li>
<li><code>for y in 1583..year</code> 是循环，从 1583 数到 year</li>
<li><code>let</code> 声明变量，<code>let mut</code> 声明可修改的变量</li>
</ul>
<blockquote>
<p>这些语法在后续章节里都会逐一讲清楚。现在只需要知道<strong>代码可以拆成一个个小函数，每个函数只做一件事</strong>——这是好代码的基本样子。</p>
</blockquote>
<h1 id="你来试试">你来试试</h1>
<h2 id="算算你的生日">算算你的生日</h2>
<p>把下面代码里的日期改成你的生日或者今天，运行看看是哪天。</p>
<div class="code-editor" data-block-id="01-rust-basics/04-first-taste#1:0" data-starter-code="fn%20is_leap_year(year%3A%20u32)%20-%3E%20bool%20%7B%0A%20%20%20%20(year%20%25%204%20%3D%3D%200%20%26%26%20year%20%25%20100%20!%3D%200)%20%7C%7C%20year%20%25%20400%20%3D%3D%200%0A%7D%0A%0Afn%20days_in_month(year%3A%20u32%2C%20month%3A%20u32)%20-%3E%20u32%20%7B%0A%20%20%20%20match%20month%20%7B%0A%20%20%20%20%20%20%20%201%20%7C%203%20%7C%205%20%7C%207%20%7C%208%20%7C%2010%20%7C%2012%20%3D%3E%2031%2C%0A%20%20%20%20%20%20%20%204%20%7C%206%20%7C%209%20%7C%2011%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3D%3E%2030%2C%0A%20%20%20%20%20%20%20%202%20%3D%3E%20if%20is_leap_year(year)%20%7B%2029%20%7D%20else%20%7B%2028%20%7D%2C%0A%20%20%20%20%20%20%20%20_%20%20%3D%3E%200%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20day_of_week(year%3A%20u32%2C%20month%3A%20u32%2C%20day%3A%20u32)%20-%3E%20%26'static%20str%20%7B%0A%20%20%20%20let%20weekdays%20%3D%20%5B%22%E6%97%A5%22%2C%20%22%E4%B8%80%22%2C%20%22%E4%BA%8C%22%2C%20%22%E4%B8%89%22%2C%20%22%E5%9B%9B%22%2C%20%22%E4%BA%94%22%2C%20%22%E5%85%AD%22%5D%3B%0A%20%20%20%20let%20mut%20total_days%3A%20u32%20%3D%200%3B%0A%20%20%20%20for%20y%20in%201583..year%20%7B%0A%20%20%20%20%20%20%20%20total_days%20%2B%3D%20if%20is_leap_year(y)%20%7B%20366%20%7D%20else%20%7B%20365%20%7D%3B%0A%20%20%20%20%7D%0A%20%20%20%20for%20m%20in%201..month%20%7B%0A%20%20%20%20%20%20%20%20total_days%20%2B%3D%20days_in_month(year%2C%20m)%3B%0A%20%20%20%20%7D%0A%20%20%20%20total_days%20%2B%3D%20day%20-%201%3B%0A%20%20%20%20weekdays%5B((total_days%20%2B%206)%20%25%207)%20as%20usize%5D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%8A%8A%E8%BF%99%E9%87%8C%E6%94%B9%E6%88%90%E4%BD%A0%E7%9A%84%E7%94%9F%E6%97%A5%20%E2%86%93%0A%20%20%20%20let%20(year%2C%20month%2C%20day)%20%3D%20(2024%2C%201%2C%201)%3B%0A%0A%20%20%20%20println!(%0A%20%20%20%20%20%20%20%20%22%7B%7D%E5%B9%B4%7B%7D%E6%9C%88%7B%7D%E6%97%A5%20%E6%98%AF%20%E6%98%9F%E6%9C%9F%7B%7D%22%2C%0A%20%20%20%20%20%20%20%20year%2C%20month%2C%20day%2C%0A%20%20%20%20%20%20%20%20day_of_week(year%2C%20month%2C%20day)%0A%20%20%20%20)%3B%0A%7D"><pre><code class="language-rust">fn is_leap_year(year: u32) -&gt; bool {
    (year % 4 == 0 &amp;&amp; year % 100 != 0) || year % 400 == 0
}

fn days_in_month(year: u32, month: u32) -&gt; u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 =&gt; 31,
        4 | 6 | 9 | 11              =&gt; 30,
        2 =&gt; if is_leap_year(year) { 29 } else { 28 },
        _  =&gt; 0,
    }
}

fn day_of_week(year: u32, month: u32, day: u32) -&gt; &amp;'static str {
    let weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    let mut total_days: u32 = 0;
    for y in 1583..year {
        total_days += if is_leap_year(y) { 366 } else { 365 };
    }
    for m in 1..month {
        total_days += days_in_month(year, m);
    }
    total_days += day - 1;
    weekdays[((total_days + 6) % 7) as usize]
}

fn main() {
    // 把这里改成你的生日 ↓
    let (year, month, day) = (2024, 1, 1);

    println!(
        "{}年{}月{}日 是 星期{}",
        year, month, day,
        day_of_week(year, month, day)
    );
}</code></pre></div>
<p>用手机日历验证一下——结果对吗？</p>
<blockquote>
<p><strong>适用范围</strong>：1583 年及之后的日期均可使用。修改 <code>(year, month, day) = (...)</code> 那一行即可。</p>
</blockquote> 