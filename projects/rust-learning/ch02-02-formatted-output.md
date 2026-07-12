---
title: "格式化输出"
description: "基本语法 - 格式化输出"
date: "2026-07-12"
order: 2002
tags: ["println!", "format!", "格式化", "{:?}", "Debug", "#[derive(Debug)]", "格式规范"]
est_time: "20 分钟"
---

 <h1 id="基础输出">基础输出</h1>
<p><code>println!</code> 是你写下的第一行 Rust 代码就用到的工具，但它的能力远不止打印一句话。Rust 的格式化系统统一处理所有打印相关的操作，并且格式字符串的正确性在<strong>编译时</strong>就能检查——拼写错一个占位符，直接报编译错误，不会等到运行时才发现。</p>
<h2 id="五个打印宏">五个打印宏</h2>
<p><code>std::fmt</code> 模块（Rust 提供的标准库的模块，通常自动加载）提供了五个打印宏，记住它们的分工：</p>
<table><thead><tr><th>宏</th><th>输出目标</th><th>换行</th></tr></thead><tbody><tr><td><code>print!</code></td><td>标准输出（stdout）</td><td>否</td></tr><tr><td><code>println!</code></td><td>标准输出（stdout）</td><td><strong>是</strong></td></tr><tr><td><code>format!</code></td><td>返回 <code>String</code>，不输出</td><td>—</td></tr><tr><td><code>eprint!</code></td><td>标准错误（stderr）</td><td>否</td></tr><tr><td><code>eprintln!</code></td><td>标准错误（stderr）</td><td><strong>是</strong></td></tr></tbody></table>
<p><strong>stdout 与 stderr 的区别</strong>：操作系统为每个程序提供了两条独立的输出通道。<code>print!/println!</code> 写入 <strong>stdout</strong>（标准输出），用于程序的正常运行结果；<code>eprint!/eprintln!</code> 写入 <strong>stderr</strong>（标准错误），用于错误信息、警告和调试诊断。</p>
<p>在终端里两者看起来一样，但它们的用途不同，分开写的好处在于：用户可以把正常输出重定向到文件（<code>./app &gt; output.txt</code>），而错误信息仍然显示在终端上；或者反过来只捕获错误（<code>./app 2&gt; error.log</code>）。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20print!(%22%E6%B2%A1%E6%9C%89%E6%8D%A2%E8%A1%8C%22)%3B%0A%20%20%20%20print!(%22%EF%BC%8C%E7%BB%A7%E7%BB%AD%E5%9C%A8%E5%90%8C%E4%B8%80%E8%A1%8C%5Cn%22)%3B%20%2F%2F%20%E6%89%8B%E5%8A%A8%E5%8A%A0%E6%8D%A2%E8%A1%8C%0A%0A%20%20%20%20println!(%22%E8%BF%99%E8%A1%8C%E8%87%AA%E5%8A%A8%E6%8D%A2%E8%A1%8C%22)%3B%0A%0A%20%20%20%20let%20s%20%3D%20format!(%22%E6%8B%BC%E6%8E%A5%E6%88%90%E5%AD%97%E7%AC%A6%E4%B8%B2%EF%BC%9A%7B%7D%20%2B%20%7B%7D%20%3D%20%7B%7D%22%2C%201%2C%202%2C%203)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%0A%20%20%20%20%2F%2F%20%E7%BB%88%E7%AB%AF%E9%80%9A%E5%B8%B8%E4%B9%9F%E8%83%BD%E7%9C%8B%E5%88%B0%EF%BC%8C%E4%BD%86%E5%8D%9A%E4%B8%BB%E8%AF%95%E4%BA%86%E7%BD%91%E9%A1%B5%E5%A5%BD%E5%83%8F%E7%9C%8B%E4%B8%8D%E5%88%B0%0A%20%20%20%20eprintln!(%22%E8%BF%99%E6%98%AF%E9%94%99%E8%AF%AF%E4%BF%A1%E6%81%AF%EF%BC%8C%E8%BE%93%E5%87%BA%E5%88%B0%20stderr%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    print!("没有换行");
    print!("，继续在同一行\n"); // 手动加换行

    println!("这行自动换行");

    let s = format!("拼接成字符串：{} + {} = {}", 1, 2, 3);
    println!("{}", s);

    // 终端通常也能看到，但博主试了网页好像看不到
    eprintln!("这是错误信息，输出到 stderr");
}</code></pre></div>
<blockquote>
<p><code>format!</code> 是”静默”版本，不打印，只返回 <code>String</code>，在需要构建字符串时很有用：<code>let msg = format!("Hello, {}!", name);</code></p>
</blockquote>
<h2 id="-与-两种格式化方式"><code>{}</code> 与 <code>{:?}</code>：两种格式化方式</h2>
<p>Rust 的占位符有两类，对应两种格式化 trait（后面章节会讲解）：</p>
<table><thead><tr><th>占位符</th><th>对应 trait</th><th>设计目标</th></tr></thead><tbody><tr><td><code>{}</code></td><td><code>Display</code></td><td>面向用户的友好展示</td></tr><tr><td><code>{:?}</code></td><td><code>Debug</code></td><td>面向开发者的调试信息</td></tr><tr><td><code>{:#?}</code></td><td><code>Debug</code>（美化版）</td><td>多行缩进，结构更清晰</td></tr></tbody></table>
<p><strong>Display</strong> 和 <strong>Debug</strong> 是两个 trait（可以理解为”能力接口”）：</p>
<ul>
<li><strong><code>Display</code></strong>：定义类型”给人看”时的样子。<code>42</code>、<code>"hello"</code>、<code>true</code> 这些基本类型都实现了它，但自定义的结构体默认没有，需要手动实现。</li>
<li><strong><code>Debug</code></strong>：定义类型”供调试用”时的样子，格式更详细，通常包含类型名和字段名。可以用 <code>#[derive(Debug)]</code> 让编译器自动生成，不需要手写。</li>
</ul>
<p>简单记：<strong>开发阶段看数据用 <code>{:?}</code>，给用户展示用 <code>{}</code></strong>。</p>
<blockquote>
<p>trait 是 Rust 的核心概念，相当于其他语言的”接口”或”协议”。如何自定义 <code>Display</code>（控制 <code>{}</code> 输出格式）会在<strong>泛型与 Trait 章节</strong>中详细讲解。现在只需知道怎么用 <code>{:?}</code> 和 <code>{:#?}</code> 就够了。</p>
</blockquote>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20%2F%2F%20%7B%7D%20%E5%8F%AA%E5%AF%B9%E5%AE%9E%E7%8E%B0%E4%BA%86%20Display%20%E7%9A%84%E7%B1%BB%E5%9E%8B%E6%9C%89%E6%95%88%0A%20%20%20%20%2F%2F%20Vec%20%E6%B2%A1%E6%9C%89%E5%AE%9E%E7%8E%B0%20Display%EF%BC%8C%E4%B8%8B%E9%9D%A2%E8%BF%99%E8%A1%8C%E4%BC%9A%E7%BC%96%E8%AF%91%E6%8A%A5%E9%94%99%EF%BC%9A%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20v)%3B%0A%0A%20%20%20%20%2F%2F%20%7B%3A%3F%7D%20%E5%AF%B9%E6%89%80%E6%9C%89%E5%AE%9E%E7%8E%B0%E4%BA%86%20Debug%20%E7%9A%84%E7%B1%BB%E5%9E%8B%E6%9C%89%E6%95%88%EF%BC%8CVec%20%E9%BB%98%E8%AE%A4%E6%94%AF%E6%8C%81%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20v)%3B%20%20%20%2F%2F%20%5B1%2C%202%2C%203%5D%0A%0A%20%20%20%20%2F%2F%20%7B%3A%23%3F%7D%20%E7%BE%8E%E5%8C%96%E6%89%93%E5%8D%B0%EF%BC%8C%E5%A4%9A%E8%A1%8C%E7%BC%A9%E8%BF%9B%0A%20%20%20%20println!(%22%7B%3A%23%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v = vec![1, 2, 3];

    // {} 只对实现了 Display 的类型有效
    // Vec 没有实现 Display，下面这行会编译报错：
    // println!("{}", v);

    // {:?} 对所有实现了 Debug 的类型有效，Vec 默认支持
    println!("{:?}", v);   // [1, 2, 3]

    // {:#?} 美化打印，多行缩进
    println!("{:#?}", v);
}</code></pre></div>
<p>对于基本类型（数字、字符串、布尔值、元组等），<code>{}</code> 和 <code>{:?}</code> 都能用。对于自定义类型（结构体、枚举、集合等），需要先告诉 Rust 如何格式化它们。</p>
<h2 id="为自定义类型启用调试输出">为自定义类型启用调试输出</h2>
<blockquote>
<p>自定义类型是用户自己定义的数据类型（通常是结构体、枚举等），将会在<a href="/RustCourse/chapters/04-custom-types/00-index">自定义数据类型</a>章节讲解。现在只需要知道其并非 Rust 原生已经完全定义的类型即可。</p>
</blockquote>
<p>通过 <code>#[derive(Debug)]</code> 属性，可以让编译器<strong>自动生成</strong> <code>Debug</code> trait 的实现，不需要手写任何代码。</p>
<blockquote>
<p><code>#[...]</code> 这种写法叫<strong>属性（Attribute）</strong>，会在本章<a href="/RustCourse/chapters/02-basic-syntax/07-attributes">属性一节</a>详细讲解。现在只需要知道：把 <code>#[derive(Debug)]</code> 写在结构体上方，就能让它支持 <code>{:?}</code> 打印。</p>
</blockquote>
<div class="code-runner" data-full-code="%2F%2F%20%E5%8A%A0%E4%B8%8A%E8%BF%99%E4%B8%80%E8%A1%8C%EF%BC%8C%E7%BC%96%E8%AF%91%E5%99%A8%E8%87%AA%E5%8A%A8%E5%B8%AE%E4%BD%A0%E5%AE%9E%E7%8E%B0%20%7B%3A%3F%7D%20%E6%A0%BC%E5%BC%8F%E5%8C%96%0A%23%5Bderive(Debug)%5D%0Astruct%20Point%20%7B%0A%20%20%20%20x%3A%20f64%2C%0A%20%20%20%20y%3A%20f64%2C%0A%7D%0A%0A%23%5Bderive(Debug)%5D%0Astruct%20Rectangle%20%7B%0A%20%20%20%20top_left%3A%20Point%2C%0A%20%20%20%20bottom_right%3A%20Point%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20rect%20%3D%20Rectangle%20%7B%0A%20%20%20%20%20%20%20%20top_left%3A%20Point%20%7B%20x%3A%200.0%2C%20y%3A%2010.0%20%7D%2C%0A%20%20%20%20%20%20%20%20bottom_right%3A%20Point%20%7B%20x%3A%205.0%2C%20y%3A%200.0%20%7D%2C%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20rect)%3B%20%20%20%2F%2F%20%E5%8D%95%E8%A1%8C%0A%20%20%20%20println!(%22%7B%3A%23%3F%7D%22%2C%20rect)%3B%20%20%2F%2F%20%E5%A4%9A%E8%A1%8C%E7%BE%8E%E5%8C%96%0A%7D" data-mode="run"><pre><code class="language-rust">// 加上这一行，编译器自动帮你实现 {:?} 格式化
#[derive(Debug)]
struct Point {
    x: f64,
    y: f64,
}

#[derive(Debug)]
struct Rectangle {
    top_left: Point,
    bottom_right: Point,
}

fn main() {
    let rect = Rectangle {
        top_left: Point { x: 0.0, y: 10.0 },
        bottom_right: Point { x: 5.0, y: 0.0 },
    };

    println!("{:?}", rect);   // 单行
    println!("{:#?}", rect);  // 多行美化
}</code></pre></div>
<h2 id="参数引用位置与命名">参数引用：位置与命名</h2>
<p>除了按顺序填充 <code>{}</code>，还可以用<strong>位置索引</strong>或<strong>命名参数</strong>更灵活地引用：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E9%A1%BA%E5%BA%8F%E5%A1%AB%E5%85%85%EF%BC%9A%E6%8C%89%E5%87%BA%E7%8E%B0%E9%A1%BA%E5%BA%8F%E4%BE%9D%E6%AC%A1%E6%9B%BF%E6%8D%A2%0A%20%20%20%20println!(%22%7B%7D%20%7B%7D%20%7B%7D%22%2C%20%22a%22%2C%20%22b%22%2C%20%22c%22)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BD%8D%E7%BD%AE%E7%B4%A2%E5%BC%95%EF%BC%9A%E5%8F%AF%E4%BB%A5%E9%87%8D%E5%A4%8D%E4%BD%BF%E7%94%A8%E5%90%8C%E4%B8%80%E4%B8%AA%E5%8F%82%E6%95%B0%0A%20%20%20%20println!(%22%7B0%7D%20%7B1%7D%20%7B0%7D%22%2C%20%22Alice%22%2C%20%22Bob%22)%3B%20%2F%2F%20Alice%20Bob%20Alice%0A%0A%20%20%20%20%2F%2F%20%E5%91%BD%E5%90%8D%E5%8F%82%E6%95%B0%EF%BC%9A%E6%9B%B4%E6%98%93%E8%AF%BB%0A%20%20%20%20println!(%0A%20%20%20%20%20%20%20%20%22%7Bsubject%7D%20%7Bverb%7D%20%7Bobject%7D%22%2C%0A%20%20%20%20%20%20%20%20verb%20%3D%20%22%E8%BF%BD%22%2C%0A%20%20%20%20%20%20%20%20object%20%3D%20%22%E5%B0%8F%E9%B1%BC%22%2C%0A%20%20%20%20%20%20%20%20subject%20%3D%20%22%E5%B0%8F%E7%8C%AB%22%2C%0A%20%20%20%20)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 顺序填充：按出现顺序依次替换
    println!("{} {} {}", "a", "b", "c");

    // 位置索引：可以重复使用同一个参数
    println!("{0} {1} {0}", "Alice", "Bob"); // Alice Bob Alice

    // 命名参数：更易读
    println!(
        "{subject} {verb} {object}",
        verb = "追",
        object = "小鱼",
        subject = "小猫",
    );
}</code></pre></div>
<h2 id="常用格式规范">常用格式规范</h2>
<p>在 <code>{}</code> 的 <code>:</code> 后面可以加格式规范，控制数制、宽度、对齐和精度：</p>
<h3 id="进制输出">进制输出</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20n%20%3D%20255%3B%0A%20%20%20%20println!(%22%E5%8D%81%E8%BF%9B%E5%88%B6%3A%20%7B%7D%22%2C%20%20%20n)%3B%20%20%20%20%20%20%2F%2F%20255%0A%20%20%20%20println!(%22%E4%BA%8C%E8%BF%9B%E5%88%B6%3A%20%7B%3Ab%7D%22%2C%20n)%3B%20%20%20%20%20%20%2F%2F%2011111111%0A%20%20%20%20println!(%22%E5%85%AB%E8%BF%9B%E5%88%B6%3A%20%7B%3Ao%7D%22%2C%20n)%3B%20%20%20%20%20%20%2F%2F%20377%0A%20%20%20%20println!(%22%E5%8D%81%E5%85%AD%E8%BF%9B%E5%88%B6(%E5%B0%8F)%3A%20%7B%3Ax%7D%22%2C%20n)%3B%20%2F%2F%20ff%0A%20%20%20%20println!(%22%E5%8D%81%E5%85%AD%E8%BF%9B%E5%88%B6(%E5%A4%A7)%3A%20%7B%3AX%7D%22%2C%20n)%3B%20%2F%2F%20FF%0A%20%20%20%20println!(%22%E5%B8%A6%E5%89%8D%E7%BC%80%3A%20%20%7B%3A%23x%7D%22%2C%20n)%3B%20%20%20%20%2F%2F%200xff%0A%20%20%20%20println!(%22%E5%B8%A6%E5%89%8D%E7%BC%80%3A%20%20%7B%3A%23b%7D%22%2C%20n)%3B%20%20%20%20%2F%2F%200b11111111%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let n = 255;
    println!("十进制: {}",   n);      // 255
    println!("二进制: {:b}", n);      // 11111111
    println!("八进制: {:o}", n);      // 377
    println!("十六进制(小): {:x}", n); // ff
    println!("十六进制(大): {:X}", n); // FF
    println!("带前缀:  {:#x}", n);    // 0xff
    println!("带前缀:  {:#b}", n);    // 0b11111111
}</code></pre></div>
<h3 id="宽度与对齐">宽度与对齐</h3>
<p>宽度规范会为输出内容分配一个<strong>指定宽度的”格子”</strong>，当内容不足这个宽度时，用空格（或指定字符）填满——对齐方式决定内容靠哪边放。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%8F%B3%E5%AF%B9%E9%BD%90%EF%BC%88%E9%BB%98%E8%AE%A4%EF%BC%89%EF%BC%8C%E5%AE%BD%E5%BA%A6%2020%0A%20%20%20%20println!(%22%7B%3A%3E20%7D%22%2C%20%22hello%22)%3B%20%20%20%2F%2F%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20hello%0A%0A%20%20%20%20%2F%2F%20%E5%B7%A6%E5%AF%B9%E9%BD%90%EF%BC%8C%E5%AE%BD%E5%BA%A6%2010%0A%20%20%20%20println!(%22%7B%3A%3C10%7D%22%2C%20%22hello%22)%3B%20%20%20%2F%2F%20hello%0A%0A%20%20%20%20%2F%2F%20%E5%B1%85%E4%B8%AD%EF%BC%8C%E5%AE%BD%E5%BA%A6%2010%0A%20%20%20%20println!(%22%7B%3A%5E10%7D%22%2C%20%22hello%22)%3B%20%20%20%2F%2F%20%20%20hello%0A%0A%20%20%20%20%2F%2F%20%E7%94%A8%E6%8C%87%E5%AE%9A%E5%AD%97%E7%AC%A6%E5%A1%AB%E5%85%85%EF%BC%88%E8%BF%99%E9%87%8C%E7%94%A8%20'-'%EF%BC%89%EF%BC%8C%E5%AE%BD%E5%BA%A6%2010%0A%20%20%20%20println!(%22%7B%3A-%5E10%7D%22%2C%20%22hello%22)%3B%20%20%2F%2F%20--hello---%0A%0A%20%20%20%20%2F%2F%20%E6%95%B0%E5%AD%97%E8%A1%A5%E9%9B%B6%EF%BC%8C%E5%AE%BD%E5%BA%A6%206%0A%20%20%20%20println!(%22%7B%3A0%3E6%7D%22%2C%2042)%3B%20%20%20%20%20%20%20%20%2F%2F%20000042%0A%20%20%20%20%2F%2F%20%E7%AD%89%E4%BB%B7%E5%86%99%E6%B3%95%0A%20%20%20%20println!(%22%7B%3A06%7D%22%2C%2042)%3B%20%20%20%20%20%20%20%20%20%2F%2F%20000042%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 右对齐（默认），宽度 20
    println!("{:&gt;20}", "hello");   //                hello

    // 左对齐，宽度 10
    println!("{:&lt;10}", "hello");   // hello

    // 居中，宽度 10
    println!("{:^10}", "hello");   //   hello

    // 用指定字符填充（这里用 '-'），宽度 10
    println!("{:-^10}", "hello");  // --hello---

    // 数字补零，宽度 6
    println!("{:0&gt;6}", 42);        // 000042
    // 等价写法
    println!("{:06}", 42);         // 000042
}</code></pre></div>
<h3 id="小数精度">小数精度</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20pi%20%3D%203.141592653589793%3B%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20pi)%3B%20%20%20%20%20%20%20%20%2F%2F%20%E5%AE%8C%E6%95%B4%E7%B2%BE%E5%BA%A6%0A%20%20%20%20println!(%22%7B%3A.2%7D%22%2C%20pi)%3B%20%20%20%20%20%2F%2F%20%E4%BF%9D%E7%95%99%202%20%E4%BD%8D%E5%B0%8F%E6%95%B0%EF%BC%9A3.14%0A%20%20%20%20println!(%22%7B%3A.5%7D%22%2C%20pi)%3B%20%20%20%20%20%2F%2F%20%E4%BF%9D%E7%95%99%205%20%E4%BD%8D%E5%B0%8F%E6%95%B0%EF%BC%9A3.14159%0A%20%20%20%20println!(%22%7B%3A8.3%7D%22%2C%20pi)%3B%20%20%20%20%2F%2F%20%E5%AE%BD%E5%BA%A6%208%EF%BC%8C3%20%E4%BD%8D%E5%B0%8F%E6%95%B0%EF%BC%9A%20%20%203.142%0A%20%20%20%20println!(%22%7B%3A08.3%7D%22%2C%20pi)%3B%20%20%20%2F%2F%20%E5%AE%BD%E5%BA%A6%208%EF%BC%8C3%20%E4%BD%8D%E5%B0%8F%E6%95%B0%EF%BC%8C%E8%A1%A5%E9%9B%B6%EF%BC%9A0003.142%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let pi = 3.141592653589793;

    println!("{}", pi);        // 完整精度
    println!("{:.2}", pi);     // 保留 2 位小数：3.14
    println!("{:.5}", pi);     // 保留 5 位小数：3.14159
    println!("{:8.3}", pi);    // 宽度 8，3 位小数：   3.142
    println!("{:08.3}", pi);   // 宽度 8，3 位小数，补零：0003.142
}</code></pre></div>
<h2 id="小结">小结</h2>
<table><thead><tr><th>场景</th><th>写法</th></tr></thead><tbody><tr><td>普通打印</td><td><code>println!("{}", val)</code></td></tr><tr><td>调试打印</td><td><code>println!("{:?}", val)</code> 需要 <code>#[derive(Debug)]</code></td></tr><tr><td>美化调试</td><td><code>println!("{:#?}", val)</code></td></tr><tr><td>构建字符串</td><td><code>format!("...")</code></td></tr><tr><td>二进制/十六进制</td><td><code>{:b}</code> / <code>{:x}</code> / <code>{:#x}</code></td></tr><tr><td>固定宽度</td><td><code>{:&gt;10}</code> / <code>{:&lt;10}</code> / <code>{:^10}</code></td></tr><tr><td>小数位数</td><td><code>{:.2}</code></td></tr></tbody></table>
<p>实现自定义类型的 <code>Display</code>（控制 <code>{}</code> 的输出格式）属于进阶内容，会在后续的格式化输出进阶章节中详细讲解。</p>
<h1 id="练习题">练习题</h1>
<h2 id="选择正确的宏">选择正确的宏</h2>
</div>
<h2 id="-与--的区别"><code>{}</code> 与 <code>{:?}</code> 的区别</h2>
<pre><code class="language-rust">#[derive(Debug)]
struct Foo(i32);

fn main() {
    let f = Foo(42);
    println!("{:?}", f);
    // println!("{}", f); // 这行会编译报错
}</code></pre>
</div>
<h2 id="derivedebug-的作用"><code>#[derive(Debug)]</code> 的作用</h2>
</div>
<h2 id="格式规范识别">格式规范识别</h2>
</div>
<h2 id="stderr-与-stdout">stderr 与 stdout</h2>
</div>
<h2 id="编程练习">编程练习</h2>
<p>补全下面程序，让序号用零补齐到 2 位宽度输出（<code>01</code>、<code>02</code>……而不是 <code>1</code>、<code>2</code>……）。</p>
<div class="code-editor" data-block-id="02-basic-syntax/02-formatted-output#1:5" data-expect-mode="literal" data-expect-pattern="01%20Monday%0A02%20Tuesday%0A03%20Wednesday%0A04%20Thursday%0A05%20Friday" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20days%20%3D%20%5B%22Monday%22%2C%20%22Tuesday%22%2C%20%22Wednesday%22%2C%20%22Thursday%22%2C%20%22Friday%22%5D%3B%0A%20%20%20%20for%20(i%2C%20day)%20in%20days.iter().enumerate()%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E5%BA%8F%E5%8F%B7%E4%BB%8E%201%20%E5%BC%80%E5%A7%8B%EF%BC%8C%E5%AE%BD%E5%BA%A6%202%EF%BC%8C%E7%94%A8%E9%9B%B6%E8%A1%A5%E9%BD%90%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%20%7B%7D%22%2C%20i%20%2B%201%2C%20day)%3B%0A%20%20%20%20%7D%0A%7D"><pre><code class="language-rust">fn main() {
    let days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    for (i, day) in days.iter().enumerate() {
        // TODO：序号从 1 开始，宽度 2，用零补齐
        println!("{} {}", i + 1, day);
    }
}</code></pre></div> 