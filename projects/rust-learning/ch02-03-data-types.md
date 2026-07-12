---
title: "基础数据类型"
description: "基本语法 - 基础数据类型"
date: "2026-07-12"
order: 2003
tags: ["整数类型", "浮点数", "bool", "char", "元组", "数组", "类型推断"]
est_time: "30 分钟"
---

 <h1 id="标量类型">标量类型</h1>
<p>Rust 是<strong>静态类型</strong>语言——每个值在编译时就有确定的类型。不用担心，Rust 的类型推断能力很强，大多数时候你不需要手动写类型，但理解它们是写出正确代码的基础。</p>
<h2 id="整数类型">整数类型</h2>
<p>整数是最常用的类型。Rust 把整数分为<strong>有符号</strong>（可以是负数）和<strong>无符号</strong>（只能是非负数）两大类，并按位宽细分：</p>
<table><thead><tr><th>位宽</th><th>有符号</th><th>无符号</th><th>范围（有符号）</th></tr></thead><tbody><tr><td>8 位</td><td><code>i8</code></td><td><code>u8</code></td><td>-128 ~ 127</td></tr><tr><td>16 位</td><td><code>i16</code></td><td><code>u16</code></td><td>-32768 ~ 32767</td></tr><tr><td>32 位</td><td><code>i32</code></td><td><code>u32</code></td><td>-约21亿 ~ 约21亿</td></tr><tr><td>64 位</td><td><code>i64</code></td><td><code>u64</code></td><td>极大范围</td></tr><tr><td>128 位</td><td><code>i128</code></td><td><code>u128</code></td><td>更大</td></tr><tr><td>指针宽度</td><td><code>isize</code></td><td><code>usize</code></td><td>取决于 CPU 架构（通常为32位或64位）</td></tr></tbody></table>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20a%3A%20i32%20%3D%20-42%3B%20%20%20%20%20%20%2F%2F%20%E6%9C%89%E7%AC%A6%E5%8F%B7%EF%BC%8C%E5%8F%AF%E4%BB%A5%E6%98%AF%E8%B4%9F%E6%95%B0%0A%20%20%20%20let%20b%3A%20u32%20%3D%20100%3B%20%20%20%20%20%20%2F%2F%20%E6%97%A0%E7%AC%A6%E5%8F%B7%EF%BC%8C%E5%8F%AA%E8%83%BD%E9%9D%9E%E8%B4%9F%0A%20%20%20%20let%20c%3A%20u8%20%20%3D%20255%3B%20%20%20%20%20%20%2F%2F%20u8%20%E6%9C%80%E5%A4%A7%E5%80%BC%0A%20%20%20%20let%20d%3A%20i64%20%3D%209_999_999_999%3B%20%2F%2F%20%E5%A4%A7%E6%95%B0%E7%94%A8%E4%B8%8B%E5%88%92%E7%BA%BF%E5%88%86%E9%9A%94%EF%BC%8C%E6%9B%B4%E6%98%93%E8%AF%BB%0A%0A%20%20%20%20println!(%22a%3D%7B%7D%20b%3D%7B%7D%20c%3D%7B%7D%20d%3D%7B%7D%22%2C%20a%2C%20b%2C%20c%2C%20d)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let a: i32 = -42;      // 有符号，可以是负数
    let b: u32 = 100;      // 无符号，只能非负
    let c: u8  = 255;      // u8 最大值
    let d: i64 = 9_999_999_999; // 大数用下划线分隔，更易读

    println!("a={} b={} c={} d={}", a, b, c, d);
}</code></pre></div>
<p><strong>不写类型时的默认值</strong>：整数默认推断为 <code>i32</code>，这是最常用的整数类型。<code>isize</code> 和 <code>usize</code> 的宽度取决于 CPU 架构（x86_64为64，嵌入式MCU 通常是32），<strong>主要用于集合的索引</strong>，如 <code>arr[i]</code> 中的 <code>i</code> 就是 <code>usize</code>。</p>
<blockquote>
<p><strong>整型溢出</strong>：<code>u8</code> 最大值是 255，赋值 256 会怎样？在 <strong>Debug 模式</strong>（<code>cargo build</code>）下，Rust 会 panic——程序崩溃并报错，帮你发现 bug。在 <strong>Release 模式</strong>（<code>cargo build --release</code>）下，Rust 不 panic，而是做”二进制补码包裹”：256 变 0，257 变 1……程序不崩溃，但值是错的。如果你需要有意地处理溢出，应该显式的调用 <code>wrapping_add</code>、<code>saturating_add</code>、<code>checked_add</code> 等方法。</p>
</blockquote>
<h2 id="浮点数">浮点数</h2>
<p>Rust 有两种浮点类型：</p>
<table><thead><tr><th>类型</th><th>精度</th><th>说明</th></tr></thead><tbody><tr><td><code>f32</code></td><td>单精度（约 7 位有效数字）</td><td>性能更好，精度较低</td></tr><tr><td><code>f64</code></td><td>双精度（约 15 位有效数字）</td><td>默认类型，精度更高</td></tr></tbody></table>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%E6%B5%AE%E7%82%B9%E6%95%B0%E5%B0%BD%E9%87%8F%E5%B0%86%E5%B0%8F%E6%95%B0%E7%82%B9%E6%98%BE%E5%BC%8F%E7%9A%84%E5%86%99%E5%87%BA%E6%9D%A5%EF%BC%8C%E4%BB%A5%E5%8C%BA%E5%88%AB%E4%BA%8E%E6%95%B4%E6%95%B0%E7%B1%BB%E5%9E%8B%0A%20%20%20%20let%20x%20%3D%203.14%3B%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E9%BB%98%E8%AE%A4%20f64%0A%20%20%20%20let%20y%3A%20f32%20%3D%202.0%3B%20%20%20%20%20%20%2F%2F%20%E6%98%BE%E5%BC%8F%E6%8C%87%E5%AE%9A%20f32%0A%20%20%20%20let%20z%20%3D%201.0_f64%3B%20%20%20%20%20%20%20%2F%2F%20%E7%94%A8%E5%90%8E%E7%BC%80%E6%8C%87%E5%AE%9A%E7%B1%BB%E5%9E%8B%0A%0A%20%20%20%20println!(%22%7B%7D%20%7B%7D%20%7B%7D%22%2C%20x%2C%20y%2C%20z)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%B5%AE%E7%82%B9%E8%BF%90%E7%AE%97%0A%20%20%20%20println!(%22%E5%9C%86%E9%9D%A2%E7%A7%AF%20%3D%20%7B%3A.4%7D%22%2C%203.14159%20*%202.0_f64%20*%202.0_f64)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    //浮点数尽量将小数点显式的写出来，以区别于整数类型
    let x = 3.14;          // 默认 f64
    let y: f32 = 2.0;      // 显式指定 f32
    let z = 1.0_f64;       // 用后缀指定类型

    println!("{} {} {}", x, y, z);

    // 浮点运算
    println!("圆面积 = {:.4}", 3.14159 * 2.0_f64 * 2.0_f64);
}</code></pre></div>
<blockquote>
<p>浮点数有精度误差，不要用 <code>==</code> 直接比较两个浮点数是否相等，应使用差值是否足够小来判断。</p>
</blockquote>
<h2 id="布尔型与字符型">布尔型与字符型</h2>
<p><strong>布尔型</strong> <code>bool</code> 只有两个值：<code>true</code> 和 <code>false</code>，常用于条件判断。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20is_active%3A%20bool%20%3D%20true%3B%0A%20%20%20%20let%20is_empty%20%3D%20false%3B%20%2F%2F%20%E7%B1%BB%E5%9E%8B%E6%8E%A8%E6%96%AD%0A%0A%20%20%20%20println!(%22active%3A%20%7B%7D%2C%20empty%3A%20%7B%7D%22%2C%20is_active%2C%20is_empty)%3B%0A%20%20%20%20println!(%22AND%3A%20%7B%7D%2C%20OR%3A%20%7B%7D%2C%20NOT%3A%20%7B%7D%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20is_active%20%26%26%20is_empty%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20is_active%20%7C%7C%20is_empty%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20!is_active)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let is_active: bool = true;
    let is_empty = false; // 类型推断

    println!("active: {}, empty: {}", is_active, is_empty);
    println!("AND: {}, OR: {}, NOT: {}",
             is_active &amp;&amp; is_empty,
             is_active || is_empty,
             !is_active);
}</code></pre></div>
<p><strong>字符型</strong> <code>char</code> 表示单个 Unicode 字符，用单引号包裹，占 <strong>4 字节</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20c1%20%3D%20'A'%3B%0A%20%20%20%20let%20c2%20%3D%20'%E4%B8%AD'%3B%20%20%20%20%20%2F%2F%20%E6%B1%89%E5%AD%97%E4%B9%9F%E6%98%AF%E5%90%88%E6%B3%95%E7%9A%84%20char%0A%20%20%20%20let%20c3%20%3D%20'%F0%9F%98%80'%3B%20%20%20%20%2F%2F%20%E8%A1%A8%E6%83%85%E7%AC%A6%E5%8F%B7%E5%90%8C%E6%A0%B7%E5%8F%AF%E4%BB%A5%0A%20%20%20%20let%20c4%20%3D%20'%5Cn'%3B%20%20%20%20%20%2F%2F%20%E8%BD%AC%E4%B9%89%E5%AD%97%E7%AC%A6%0A%0A%20%20%20%20println!(%22%7B%7D%20%7B%7D%20%7B%7D%20(%E6%8D%A2%E8%A1%8C%E5%9C%A8%E8%BF%99%E9%87%8C%7B%7D)%22%2C%20c1%2C%20c2%2C%20c3%2C%20c4)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let c1 = 'A';
    let c2 = '中';     // 汉字也是合法的 char
    let c3 = '😀';    // 表情符号同样可以
    let c4 = '\n';     // 转义字符

    println!("{} {} {} (换行在这里{})", c1, c2, c3, c4);
}</code></pre></div>
<blockquote>
<p><code>char</code> 是 4 字节的 Unicode 标量值，而不是 ASCII 字节。这和 C 语言的 <code>char</code>（1 字节）不同。如果想要像 C 语言那样操作 ASCII，应该写成 <code>b'A'</code> 的形式</p>
</blockquote>
<h2 id="单元类型">单元类型</h2>
<p><strong>单元类型</strong> <code>()</code> 表示”无值”或”空”，是 Rust 中一个合法的类型。不要把它和其他语言的 <code>null</code>、<code>void</code> 或 <code>None</code> 混淆——<code>()</code> 是一个真实的值，可以赋给变量、打印、传递给函数。重要的是，<strong>单元类型是零大小类型</strong>（zero-sized type），在运行时<strong>不占用任何内存</strong>——只是一个编译期的占位符。</p>
<p>不显式返回值的函数会隐式返回 <code>()</code>：</p>
<div class="code-runner" data-full-code="fn%20say_hello()%20%7B%0A%20%20%20%20println!(%22Hello!%22)%3B%0A%20%20%20%20%2F%2F%20%E9%9A%90%E5%BC%8F%E8%BF%94%E5%9B%9E%20()%EF%BC%8C%E7%9B%B8%E5%BD%93%E4%BA%8E%20return%20()%3B%0A%7D%0A%0Afn%20add_one(x%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20x%20%2B%201%20%20%2F%2F%20%E6%9C%89%E8%BF%94%E5%9B%9E%E5%80%BC%EF%BC%8C%E6%98%AF%20i32%0A%7D%0A%0Afn%20do_nothing()%20%7B%0A%20%20%20%20%2F%2F%20%E6%97%A0%E8%BF%94%E5%9B%9E%E5%80%BC%EF%BC%8C%E9%9A%90%E5%BC%8F%E8%BF%94%E5%9B%9E%20()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%20say_hello()%3B%20%20%2F%2F%20x%20%E7%9A%84%E7%B1%BB%E5%9E%8B%E6%98%AF%20()%0A%20%20%20%20println!(%22say_hello%20%E8%BF%94%E5%9B%9E%3A%20%7B%3A%3F%7D%22%2C%20x)%3B%20%20%2F%2F%20%E8%BE%93%E5%87%BA%20()%0A%0A%20%20%20%20let%20y%20%3D%20add_one(5)%3B%20%20%20%2F%2F%20y%20%E7%9A%84%E7%B1%BB%E5%9E%8B%E6%98%AF%20i32%0A%20%20%20%20println!(%22add_one%20%E8%BF%94%E5%9B%9E%3A%20%7B%7D%22%2C%20y)%3B%0A%0A%20%20%20%20let%20z%20%3D%20do_nothing()%3B%20%2F%2F%20z%20%E7%9A%84%E7%B1%BB%E5%9E%8B%E6%98%AF%20()%0A%20%20%20%20println!(%22do_nothing%20%E8%BF%94%E5%9B%9E%3A%20%7B%3A%3F%7D%22%2C%20z)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn say_hello() {
    println!("Hello!");
    // 隐式返回 ()，相当于 return ();
}

fn add_one(x: i32) -&gt; i32 {
    x + 1  // 有返回值，是 i32
}

fn do_nothing() {
    // 无返回值，隐式返回 ()
}

fn main() {
    let x = say_hello();  // x 的类型是 ()
    println!("say_hello 返回: {:?}", x);  // 输出 ()

    let y = add_one(5);   // y 的类型是 i32
    println!("add_one 返回: {}", y);

    let z = do_nothing(); // z 的类型是 ()
    println!("do_nothing 返回: {:?}", z);
}</code></pre></div>
<p>单元类型常用于：</p>
<ul>
<li><strong>函数没有有意义的返回值</strong>：只想执行副作用（如打印、修改状态），不返回数据</li>
<li><strong>空的代码块</strong>：<code>if</code> 条件分支没有返回值时</li>
<li><strong>表示”什么都没有”</strong>：在某些错误处理或控制流场景中</li>
</ul>
<h2 id="字面量写法与类型后缀">字面量写法与类型后缀</h2>
<p>字面量是你在代码里直接写出来的、一眼就能看出其具体数值的数据，和上面的整型、浮点型不同，字面量不是变量。 它是对”字面意思”的直接呈现，也就是说，你看到的是什么，它的值就是什么。比如：<code>18</code>，<code>3.14</code>，<code>"张三"</code>。</p>
<blockquote>
<p><strong>Rust 字符串 vs C 语言</strong>：“张三”是字符串字面量。Rust 的字符串（<code>&amp;str</code>）<strong>不需要以 <code>\0</code> 结尾</strong>，长度由字符串对象记录；C 语言字符串必须以 <code>\0</code> 结尾才能确定长度，容易导致缓冲区溢出。</p>
</blockquote>
<p>Rust 支持多种进制的字面量，还可以在数字中插入下划线提升可读性：</p>
<table><thead><tr><th>字面量形式</th><th>示例</th></tr></thead><tbody><tr><td>十进制</td><td><code>98_222</code></td></tr><tr><td>十六进制</td><td><code>0xFF</code></td></tr><tr><td>八进制</td><td><code>0o77</code></td></tr><tr><td>二进制</td><td><code>0b1111_0000</code></td></tr><tr><td>字节（仅限 <code>u8</code>）</td><td><code>b'A'</code></td></tr></tbody></table>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20decimal%20%20%20%20%20%3D%20255%3B%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%8D%81%E8%BF%9B%E5%88%B6%0A%20%20%20%20let%20hex%20%20%20%20%20%20%20%20%20%3D%200xFF%3B%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%8D%81%E5%85%AD%E8%BF%9B%E5%88%B6%EF%BC%880x%20%E5%89%8D%E7%BC%80%EF%BC%89%0A%20%20%20%20let%20octal%20%20%20%20%20%20%20%3D%200o377%3B%20%20%20%20%20%20%20%20%2F%2F%20%E5%85%AB%E8%BF%9B%E5%88%B6%EF%BC%880o%20%E5%89%8D%E7%BC%80%EF%BC%89%0A%20%20%20%20let%20binary%20%20%20%20%20%20%3D%200b1111_1111%3B%20%20%2F%2F%20%E4%BA%8C%E8%BF%9B%E5%88%B6%EF%BC%880b%20%E5%89%8D%E7%BC%80%EF%BC%89%0A%20%20%20%20let%20million%20%20%20%20%20%3D%201_000_000%3B%20%20%20%20%2F%2F%20%E4%B8%8B%E5%88%92%E7%BA%BF%E5%8F%AA%E6%98%AF%E8%A7%86%E8%A7%89%E5%88%86%E9%9A%94%E7%AC%A6%0A%20%20%20%20let%20byte%3A%20u8%20%20%20%20%3D%20b'A'%3B%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%AD%97%E8%8A%82%E5%AD%97%E9%9D%A2%E9%87%8F%EF%BC%8C%E7%AD%89%E4%BB%B7%E4%BA%8E%2065u8%0A%0A%20%20%20%20%2F%2F%20%E7%B1%BB%E5%9E%8B%E5%90%8E%E7%BC%80%EF%BC%9A%E7%9B%B4%E6%8E%A5%E5%86%99%E5%9C%A8%E6%95%B0%E5%AD%97%E5%90%8E%E9%9D%A2%E6%8C%87%E5%AE%9A%E7%B1%BB%E5%9E%8B%0A%20%20%20%20let%20typed%3A%20u32%20%20%3D%20255u32%3B%0A%20%20%20%20let%20also_typed%20%20%3D%20255_u8%3B%20%20%20%20%20%20%20%2F%2F%20%E4%B8%8B%E5%88%92%E7%BA%BF%E5%8F%AF%E4%BB%A5%E6%94%BE%E5%9C%A8%E5%90%8E%E7%BC%80%E5%89%8D%0A%0A%20%20%20%20println!(%22%7B%7D%20%7B%7D%20%7B%7D%20%7B%7D%20%7B%7D%20%7B%7D%20%7B%7D%20%7B%7D%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20decimal%2C%20hex%2C%20octal%2C%20binary%2C%20million%2C%20byte%2C%20typed%2C%20also_typed)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let decimal     = 255;          // 十进制
    let hex         = 0xFF;         // 十六进制（0x 前缀）
    let octal       = 0o377;        // 八进制（0o 前缀）
    let binary      = 0b1111_1111;  // 二进制（0b 前缀）
    let million     = 1_000_000;    // 下划线只是视觉分隔符
    let byte: u8    = b'A';         // 字节字面量，等价于 65u8

    // 类型后缀：直接写在数字后面指定类型
    let typed: u32  = 255u32;
    let also_typed  = 255_u8;       // 下划线可以放在后缀前

    println!("{} {} {} {} {} {} {} {}",
             decimal, hex, octal, binary, million, byte, typed, also_typed);
}</code></pre></div>
<p><strong>类型后缀</strong>的用途：当 Rust 无法从上下文推断类型时，直接在字面量后写类型：<code>42u8</code>、<code>3.14f32</code>、<code>1000i64</code>。</p>
<h1 id="复合类型">复合类型</h1>
<h2 id="元组">元组</h2>
<p>元组可以把<strong>不同类型</strong>的多个值打包在一起，用圆括号 <code>()</code> 包裹：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20t%20%3D%20(1i32%2C%20true%2C%20'x'%2C%203.14f64)%3B%0A%0A%20%20%20%20%2F%2F%20%E7%94%A8%20.%E7%B4%A2%E5%BC%95%20%E8%AE%BF%E9%97%AE%E5%85%83%E7%B4%A0%EF%BC%88%E6%B3%A8%E6%84%8F%EF%BC%9A%E6%98%AF%20.0%20%E4%B8%8D%E6%98%AF%20%5B0%5D%EF%BC%89%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%3A%20%7B%7D%22%2C%20t.0)%3B%0A%20%20%20%20println!(%22%E7%AC%AC%E4%BA%8C%E4%B8%AA%3A%20%7B%7D%22%2C%20t.1)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%95%B4%E4%B8%AA%E5%85%83%E7%BB%84%E7%94%A8%20%7B%3A%3F%7D%20%E6%89%93%E5%8D%B0%0A%20%20%20%20println!(%22%E5%AE%8C%E6%95%B4%E5%85%83%E7%BB%84%3A%20%7B%3A%3F%7D%22%2C%20t)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let t = (1i32, true, 'x', 3.14f64);

    // 用 .索引 访问元素（注意：是 .0 不是 [0]）
    println!("第一个: {}", t.0);
    println!("第二个: {}", t.1);

    // 整个元组用 {:?} 打印
    println!("完整元组: {:?}", t);
}</code></pre></div>
<blockquote>
<p>元组用 <code>.索引</code> 访问，<strong>不能</strong> 用 <code>t[0]</code>——这是元组和数组的重要区别。</p>
</blockquote>
<h2 id="元组解构与函数返回值">元组解构与函数返回值</h2>
<p><strong>解构</strong>（destructure）可以把元组的每个值绑定到独立变量：</p>
<div class="code-runner" data-full-code="fn%20min_max(numbers%3A%20%26%5Bi32%5D)%20-%3E%20(i32%2C%20i32)%20%7B%0A%20%20%20%20%2F%2F%20%E5%87%BD%E6%95%B0%E8%BF%94%E5%9B%9E%E5%85%83%E7%BB%84%EF%BC%8C%E5%AE%9E%E7%8E%B0%E5%A4%9A%E8%BF%94%E5%9B%9E%E5%80%BC%0A%20%20%20%20(numbers.iter().copied().min().unwrap()%2C%0A%20%20%20%20%20numbers.iter().copied().max().unwrap())%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20point%20%3D%20(10%2C%2020)%3B%0A%20%20%20%20let%20(x%2C%20y)%20%3D%20point%3B%20%20%2F%2F%20%E8%A7%A3%E6%9E%84%EF%BC%9A%E6%8A%8A%2010%20%E7%BB%91%E5%AE%9A%E7%BB%99%20x%EF%BC%8C20%20%E7%BB%91%E5%AE%9A%E7%BB%99%20y%0A%20%20%20%20println!(%22x%3D%7B%7D%2C%20y%3D%7B%7D%22%2C%20x%2C%20y)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%85%83%E7%BB%84%E4%BD%9C%E4%B8%BA%E5%A4%9A%E8%BF%94%E5%9B%9E%E5%80%BC%0A%20%20%20%20let%20nums%20%3D%20%5B3%2C%201%2C%204%2C%201%2C%205%2C%209%2C%202%2C%206%5D%3B%0A%20%20%20%20let%20(min%2C%20max)%20%3D%20min_max(%26nums)%3B%0A%20%20%20%20println!(%22%E6%9C%80%E5%B0%8F%E5%80%BC%3D%7B%7D%2C%20%E6%9C%80%E5%A4%A7%E5%80%BC%3D%7B%7D%22%2C%20min%2C%20max)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E6%9C%89%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%E7%9A%84%E5%85%83%E7%BB%84%E9%9C%80%E8%A6%81%E5%B0%BE%E9%9A%8F%E9%80%97%E5%8F%B7%E4%BB%A5%E5%8C%BA%E5%88%86%E6%8B%AC%E5%8F%B7%E8%A1%A8%E8%BE%BE%E5%BC%8F%0A%20%20%20%20let%20single%20%3D%20(42%2C)%3B%0A%20%20%20%20println!(%22%E5%8D%95%E5%85%83%E7%B4%A0%E5%85%83%E7%BB%84%3A%20%7B%3A%3F%7D%22%2C%20single)%3B%0A%20%20%20%20println!(%22%E8%BF%99%E5%8F%AA%E6%98%AF%E6%8B%AC%E5%8F%B7%3A%20%7B%3A%3F%7D%22%2C%20(42))%3B%20%2F%2F%20%E8%BF%99%E6%98%AF%20i32%EF%BC%8C%E4%B8%8D%E6%98%AF%E5%85%83%E7%BB%84%0A%7D" data-mode="run"><pre><code class="language-rust">fn min_max(numbers: &amp;[i32]) -&gt; (i32, i32) {
    // 函数返回元组，实现多返回值
    (numbers.iter().copied().min().unwrap(),
     numbers.iter().copied().max().unwrap())
}

fn main() {
    let point = (10, 20);
    let (x, y) = point;  // 解构：把 10 绑定给 x，20 绑定给 y
    println!("x={}, y={}", x, y);

    // 元组作为多返回值
    let nums = [3, 1, 4, 1, 5, 9, 2, 6];
    let (min, max) = min_max(&amp;nums);
    println!("最小值={}, 最大值={}", min, max);

    // 只有一个元素的元组需要尾随逗号以区分括号表达式
    let single = (42,);
    println!("单元素元组: {:?}", single);
    println!("这只是括号: {:?}", (42)); // 这是 i32，不是元组
}</code></pre></div>
<h2 id="数组">数组</h2>
<p>数组存储<strong>相同类型</strong>的多个值，长度<strong>编译时固定</strong>，存储在栈上：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E7%B1%BB%E5%9E%8B%E6%A0%87%E6%B3%A8%E6%A0%BC%E5%BC%8F%EF%BC%9A%5B%E5%85%83%E7%B4%A0%E7%B1%BB%E5%9E%8B%3B%20%E9%95%BF%E5%BA%A6%5D%0A%20%20%20%20let%20xs%3A%20%5Bi32%3B%205%5D%20%3D%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E7%94%A8%E7%9B%B8%E5%90%8C%E5%80%BC%E5%88%9D%E5%A7%8B%E5%8C%96%EF%BC%9A%5B%E5%88%9D%E5%A7%8B%E5%80%BC%3B%20%E9%95%BF%E5%BA%A6%5D%0A%20%20%20%20let%20zeros%3A%20%5Bi32%3B%203%5D%20%3D%20%5B0%3B%203%5D%3B%20%20%2F%2F%20%5B0%2C%200%2C%200%5D%0A%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%3A%20%7B%7D%22%2C%20xs%5B0%5D)%3B%0A%20%20%20%20println!(%22%E6%9C%80%E5%90%8E%E4%B8%80%E4%B8%AA%3A%20%7B%7D%22%2C%20xs%5Bxs.len()%20-%201%5D)%3B%0A%20%20%20%20println!(%22%E9%95%BF%E5%BA%A6%3A%20%7B%7D%22%2C%20xs.len())%3B%0A%20%20%20%20println!(%22zeros%3A%20%7B%3A%3F%7D%22%2C%20zeros)%3B%0A%0A%20%20%20%20%2F%2F%20%E8%B6%8A%E7%95%8C%E8%AE%BF%E9%97%AE%E4%BC%9A%20panic%EF%BC%88%E8%BF%90%E8%A1%8C%E6%97%B6%E9%94%99%E8%AF%AF%EF%BC%89%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20xs%5B10%5D)%3B%20%20%2F%2F%20panic%3A%20index%20out%20of%20bounds%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 类型标注格式：[元素类型; 长度]
    let xs: [i32; 5] = [1, 2, 3, 4, 5];

    // 用相同值初始化：[初始值; 长度]
    let zeros: [i32; 3] = [0; 3];  // [0, 0, 0]

    println!("第一个: {}", xs[0]);
    println!("最后一个: {}", xs[xs.len() - 1]);
    println!("长度: {}", xs.len());
    println!("zeros: {:?}", zeros);

    // 越界访问会 panic（运行时错误）
    // println!("{}", xs[10]);  // panic: index out of bounds
}</code></pre></div>
<blockquote>
<p>数组长度是<strong>类型的一部分</strong>：<code>[i32; 5]</code> 和 <code>[i32; 6]</code> 是两种不同类型，不能互相赋值。同时注意在使用数组时不能越界（即不能使用超出数组大小的索引）</p>
</blockquote>
<h1 id="运算符">运算符</h1>
<h2 id="常用运算符">常用运算符</h2>
<p>Rust 支持算术、布尔、位运算等常见运算符，用法与 C 语言基本一致：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E7%AE%97%E6%9C%AF%E8%BF%90%E7%AE%97%0A%20%20%20%20println!(%225%20%2B%203%20%3D%20%7B%7D%22%2C%205i32%20%2B%203)%3B%0A%20%20%20%20println!(%225%20-%203%20%3D%20%7B%7D%22%2C%205i32%20-%203)%3B%0A%20%20%20%20println!(%221%20-%202%20%3D%20%7B%7D%22%2C%201i32%20-%202)%3B%20%20%2F%2F%20%E6%9C%89%E7%AC%A6%E5%8F%B7%E6%89%8D%E8%83%BD%E5%BE%97%E5%88%B0%E8%B4%9F%E6%95%B0%0A%0A%20%20%20%20%2F%2F%20%E6%95%B4%E6%95%B0%E9%99%A4%E6%B3%95%EF%BC%9A%E7%BB%93%E6%9E%9C%E5%90%91%E9%9B%B6%E6%88%AA%E6%96%AD%EF%BC%88%E4%B8%8D%E6%98%AF%E5%90%91%E4%B8%8B%E5%8F%96%E6%95%B4%EF%BC%89%0A%20%20%20%20println!(%225%20%2F%202%20%3D%20%7B%7D%22%2C%205i32%20%2F%202)%3B%20%20%20%2F%2F%202%EF%BC%8C%E4%B8%8D%E6%98%AF%202.5%0A%20%20%20%20println!(%222%20%2F%203%20%3D%20%7B%7D%22%2C%202i32%20%2F%203)%3B%20%20%20%2F%2F%200%EF%BC%81%E6%B3%A8%E6%84%8F%E8%BF%99%E4%B8%AA%E9%99%B7%E9%98%B1%0A%20%20%20%20println!(%2243%20%25%205%20%3D%20%7B%7D%22%2C%2043i32%20%25%205)%3B%20%2F%2F%20%E5%8F%96%E4%BD%99%20%3D%203%0A%0A%20%20%20%20%2F%2F%20%E5%B8%83%E5%B0%94%E8%BF%90%E7%AE%97%EF%BC%88%E7%9F%AD%E8%B7%AF%E6%B1%82%E5%80%BC%EF%BC%89%0A%20%20%20%20println!(%22true%20%26%26%20false%20%3D%20%7B%7D%22%2C%20true%20%26%26%20false)%3B%0A%20%20%20%20println!(%22true%20%7C%7C%20false%20%3D%20%7B%7D%22%2C%20true%20%7C%7C%20false)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BD%8D%E8%BF%90%E7%AE%97%0A%20%20%20%20println!(%220b0011%20%26%200b0101%20%3D%20%7B%3A04b%7D%22%2C%200b0011u32%20%26%200b0101)%3B%20%20%2F%2F%20AND%0A%20%20%20%20println!(%220b0011%20%7C%200b0101%20%3D%20%7B%3A04b%7D%22%2C%200b0011u32%20%7C%200b0101)%3B%20%20%2F%2F%20OR%0A%20%20%20%20println!(%220b0011%20%5E%200b0101%20%3D%20%7B%3A04b%7D%22%2C%200b0011u32%20%5E%200b0101)%3B%20%20%2F%2F%20XOR%0A%20%20%20%20println!(%221%20%3C%3C%203%20%3D%20%7B%7D%22%2C%201u32%20%3C%3C%203)%3B%20%20%20%2F%2F%20%E5%B7%A6%E7%A7%BB%0A%20%20%20%20println!(%2216%20%3E%3E%202%20%3D%20%7B%7D%22%2C%2016u32%20%3E%3E%202)%3B%20%2F%2F%20%E5%8F%B3%E7%A7%BB%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 算术运算
    println!("5 + 3 = {}", 5i32 + 3);
    println!("5 - 3 = {}", 5i32 - 3);
    println!("1 - 2 = {}", 1i32 - 2);  // 有符号才能得到负数

    // 整数除法：结果向零截断（不是向下取整）
    println!("5 / 2 = {}", 5i32 / 2);   // 2，不是 2.5
    println!("2 / 3 = {}", 2i32 / 3);   // 0！注意这个陷阱
    println!("43 % 5 = {}", 43i32 % 5); // 取余 = 3

    // 布尔运算（短路求值）
    println!("true &amp;&amp; false = {}", true &amp;&amp; false);
    println!("true || false = {}", true || false);

    // 位运算
    println!("0b0011 &amp; 0b0101 = {:04b}", 0b0011u32 &amp; 0b0101);  // AND
    println!("0b0011 | 0b0101 = {:04b}", 0b0011u32 | 0b0101);  // OR
    println!("0b0011 ^ 0b0101 = {:04b}", 0b0011u32 ^ 0b0101);  // XOR
    println!("1 &lt;&lt; 3 = {}", 1u32 &lt;&lt; 3);   // 左移
    println!("16 &gt;&gt; 2 = {}", 16u32 &gt;&gt; 2); // 右移
}</code></pre></div>
<blockquote>
<p><strong>无符号整数减法陷阱</strong>：<code>1u32 - 2u32</code> 会 panic（溢出）。如果可能出现负数，应使用有符号类型。</p>
</blockquote>
<h2 id="优先级完整列表">优先级完整列表</h2>
<p>当一个表达式里有多个运算符时，<strong>谁先算、谁后算</strong>由优先级决定。优先级高的运算符先计算，同级从左到右。</p>
<p>Rust 的运算符优先级与 C 语言<strong>高度相似</strong>，如果你有 C/C++ 背景，大部分直觉可以直接沿用。主要差异在于：Rust 没有 C 的三目运算符 <code>? :</code>，<code>as</code> 类型转换替代了 C 的强制类型转换，以及比较运算符不支持链式写法。</p>
<p>下表从高到低排列 Rust 的运算符优先级：</p>
<table><thead><tr><th>优先级</th><th>运算符</th><th>说明</th><th>结合性</th></tr></thead><tbody><tr><td>1（最高）</td><td><code>expr.field</code>、<code>expr.method()</code></td><td>字段访问、方法调用</td><td>左到右</td></tr><tr><td>2</td><td><code>expr[index]</code></td><td>索引</td><td>左到右</td></tr><tr><td>3</td><td><code>expr?</code></td><td>错误传播</td><td>—</td></tr><tr><td>4</td><td><code>-expr</code>、<code>!expr</code>、<code>*expr</code>、<code>&amp;expr</code>、<code>&amp;mut expr</code></td><td>一元运算符（取负、逻辑非、解引用、借用）</td><td>右到左</td></tr><tr><td>5</td><td><code>as</code></td><td>类型转换</td><td>左到右</td></tr><tr><td>6</td><td><code>*</code>、<code>/</code>、<code>%</code></td><td>乘、除、取余</td><td>左到右</td></tr><tr><td>7</td><td><code>+</code>、<code>-</code></td><td>加、减</td><td>左到右</td></tr><tr><td>8</td><td><code>&lt;&lt;</code>、<code>&gt;&gt;</code></td><td>位移</td><td>左到右</td></tr><tr><td>9</td><td><code>&amp;</code></td><td>位与（Bitwise AND）</td><td>左到右</td></tr><tr><td>10</td><td><code>^</code></td><td>位异或（Bitwise XOR）</td><td>左到右</td></tr><tr><td>11</td><td><code>|</code></td><td>位或（Bitwise OR）</td><td>左到右</td></tr><tr><td>12</td><td><code>==</code>、<code>!=</code>、<code>&lt;</code>、<code>&gt;</code>、<code>&lt;=</code>、<code>&gt;=</code></td><td>比较运算符</td><td>要求括号</td></tr><tr><td>13</td><td><code>&amp;&amp;</code></td><td>逻辑与（短路）</td><td>左到右</td></tr><tr><td>14</td><td><code>||</code></td><td>逻辑或（短路）</td><td>左到右</td></tr><tr><td>15</td><td><code>..</code>、<code>..=</code></td><td>区间</td><td>—</td></tr><tr><td>16</td><td><code>=</code>、<code>+=</code>、<code>-=</code>、<code>*=</code>、<code>/=</code>、<code>%=</code>、<code>&amp;=</code>、<code>|=</code>、<code>^=</code>、<code>&lt;&lt;=</code>、<code>&gt;&gt;=</code></td><td>赋值与复合赋值</td><td>右到左</td></tr><tr><td>17（最低）</td><td><code>return</code>、<code>break</code>、闭包</td><td>控制流表达式</td><td>—</td></tr></tbody></table>
<blockquote>
<p>比较运算符（==、!=、&lt;、&gt; 等）<strong>不支持链式比较</strong>：<code>1 &lt; x &lt; 10</code> 在 Rust 中是非法的，必须写成 <code>1 &lt; x &amp;&amp; x &lt; 10</code>。</p>
</blockquote>
<h2 id="常见场景示例">常见场景示例</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E4%B9%98%E9%99%A4%E4%BC%98%E5%85%88%E4%BA%8E%E5%8A%A0%E5%87%8F%EF%BC%88%E5%92%8C%E6%95%B0%E5%AD%A6%E4%B8%80%E6%A0%B7%EF%BC%89%0A%20%20%20%20println!(%22%7B%7D%22%2C%202%20%2B%203%20*%204)%3B%20%20%20%20%20%2F%2F%2014%EF%BC%8C%E4%B8%8D%E6%98%AF%2020%0A%0A%20%20%20%20%2F%2F%20%E4%BD%8D%E8%BF%90%E7%AE%97%E4%BC%98%E5%85%88%E7%BA%A7%E4%BD%8E%E4%BA%8E%E7%AE%97%E6%9C%AF%EF%BC%8C%E5%B8%B8%E9%9C%80%E6%8B%AC%E5%8F%B7%0A%20%20%20%20println!(%22%7B%7D%22%2C%201%20%2B%202%20%26%203)%3B%20%20%20%20%20%2F%2F%20%E5%85%88%E7%AE%97%201%2B2%3D3%EF%BC%8C%E5%86%8D%203%263%3D3%0A%20%20%20%20println!(%22%7B%7D%22%2C%201%20%2B%20(2%20%26%203))%3B%20%20%20%2F%2F%20%E5%85%88%E7%AE%97%202%263%3D2%EF%BC%8C%E5%86%8D%201%2B2%3D3%EF%BC%88%E4%B8%8D%E5%90%8C%EF%BC%81%EF%BC%89%0A%0A%20%20%20%20%2F%2F%20%E6%AF%94%E8%BE%83%E8%BF%90%E7%AE%97%E7%AC%A6%E4%BC%98%E5%85%88%E7%BA%A7%E4%BD%8E%E4%BA%8E%E7%AE%97%E6%9C%AF%0A%20%20%20%20println!(%22%7B%7D%22%2C%202%20%2B%203%20%3E%204)%3B%20%20%20%20%20%2F%2F%20%E5%85%88%E7%AE%97%202%2B3%3D5%EF%BC%8C%E5%86%8D%205%3E4%3Dtrue%0A%0A%20%20%20%20%2F%2F%20%E9%80%BB%E8%BE%91%E4%B8%8E%E4%BC%98%E5%85%88%E4%BA%8E%E9%80%BB%E8%BE%91%E6%88%96%0A%20%20%20%20println!(%22%7B%7D%22%2C%20true%20%7C%7C%20false%20%26%26%20false)%3B%20%2F%2F%20%E5%85%88%E7%AE%97%20false%26%26false%3Dfalse%EF%BC%8C%E5%86%8D%20true%7C%7Cfalse%3Dtrue%0A%0A%20%20%20%20%2F%2F%20as%20%E7%B1%BB%E5%9E%8B%E8%BD%AC%E6%8D%A2%E4%BC%98%E5%85%88%E7%BA%A7%E8%BE%83%E9%AB%98%0A%20%20%20%20let%20x%20%3D%203.99_f64%20as%20i32%20%2B%201%3B%20%20%20%2F%2F%20%E5%85%88%20as%EF%BC%9A3.99%E2%86%923%EF%BC%8C%E5%86%8D%203%2B1%3D4%0A%20%20%20%20println!(%22%7B%7D%22%2C%20x)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 乘除优先于加减（和数学一样）
    println!("{}", 2 + 3 * 4);     // 14，不是 20

    // 位运算优先级低于算术，常需括号
    println!("{}", 1 + 2 &amp; 3);     // 先算 1+2=3，再 3&amp;3=3
    println!("{}", 1 + (2 &amp; 3));   // 先算 2&amp;3=2，再 1+2=3（不同！）

    // 比较运算符优先级低于算术
    println!("{}", 2 + 3 &gt; 4);     // 先算 2+3=5，再 5&gt;4=true

    // 逻辑与优先于逻辑或
    println!("{}", true || false &amp;&amp; false); // 先算 false&amp;&amp;false=false，再 true||false=true

    // as 类型转换优先级较高
    let x = 3.99_f64 as i32 + 1;   // 先 as：3.99→3，再 3+1=4
    println!("{}", x);
}</code></pre></div>
<h2 id="最佳实践多用括号">最佳实践：多用括号</h2>
<p>通常一个有经验的程序员都会使用括号来避免产生优先级问题。优先级规则记不住没关系——<strong>加括号让意图更清晰</strong>，比依赖优先级更好：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%205%3B%0A%20%20%20%20let%20b%20%3D%203%3B%0A%20%20%20%20let%20c%20%3D%202%3B%0A%0A%20%20%20%20%2F%2F%20%E4%B8%8D%E6%B8%85%E6%99%B0%EF%BC%9A%E8%AF%BB%E8%80%85%E8%A6%81%E8%AE%B0%E5%BF%86%E4%BC%98%E5%85%88%E7%BA%A7%0A%20%20%20%20let%20r1%20%3D%20a%20%2B%20b%20*%20c%20%26%200xFF%3B%0A%0A%20%20%20%20%2F%2F%20%E6%B8%85%E6%99%B0%EF%BC%9A%E6%8B%AC%E5%8F%B7%E6%98%8E%E7%A1%AE%E6%AF%8F%E6%AD%A5%E6%84%8F%E5%9B%BE%0A%20%20%20%20let%20r2%20%3D%20(a%20%2B%20(b%20*%20c))%20%26%200xFF%3B%0A%0A%20%20%20%20println!(%22%7B%7D%20%7B%7D%22%2C%20r1%2C%20r2)%3B%20%2F%2F%20%E7%BB%93%E6%9E%9C%E7%9B%B8%E5%90%8C%EF%BC%8C%E4%BD%86%20r2%20%E7%9A%84%E5%86%99%E6%B3%95%E6%9B%B4%E6%98%93%E7%BB%B4%E6%8A%A4%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let a = 5;
    let b = 3;
    let c = 2;

    // 不清晰：读者要记忆优先级
    let r1 = a + b * c &amp; 0xFF;

    // 清晰：括号明确每步意图
    let r2 = (a + (b * c)) &amp; 0xFF;

    println!("{} {}", r1, r2); // 结果相同，但 r2 的写法更易维护
}</code></pre></div>
<blockquote>
<p><strong>Clippy 会提示</strong>：当表达式中混合了不同类的运算符（如算术和位运算）而没有括号时，<code>cargo clippy</code> 会建议你加上括号，这是 Rust 社区推荐的风格。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="整数类型的范围">整数类型的范围</h2>
</div>
<h2 id="默认整数类型">默认整数类型</h2>
<pre><code class="language-rust">let x = 42;
let y: i64 = 100;
let z = 255u8;</code></pre>
</div>
<h2 id="元组的访问方式">元组的访问方式</h2>
<pre><code class="language-rust">fn main() {
    let t = (10, "hello", 3.14);
    println!("{}", t.1);
}</code></pre>
</div>
<h2 id="char-的特点">char 的特点</h2>
</div>
<h2 id="数组类型标注">数组类型标注</h2>
</div>
<h2 id="数组越界">数组越界</h2>
<pre><code class="language-rust">fn main() {
    let arr = [1, 2, 3];
    println!("{}", arr[5]);
}</code></pre>
</div>
<h2 id="整数除法">整数除法</h2>
<pre><code class="language-rust">fn main() {
    let x: i32 = 7 / 2;
    println!("{}", x);
}</code></pre>
</div>
<h2 id="整型溢出行为">整型溢出行为</h2>
</div>
<h2 id="优先级计算">优先级计算</h2>
<pre><code class="language-rust">fn main() {
    println!("{}", 2 + 3 * 4 - 1);
}</code></pre>
</div>
<h2 id="函数返回值与单元类型">函数返回值与单元类型</h2>
<pre><code class="language-rust">fn say_hello() {
    println!("Hello!");
}

fn main() {
    let x = say_hello();
    println!("{:?}", x);
}</code></pre>
</div>
<h2 id="编程练习-1">编程练习 1</h2>
<p>下面函数接受一个坐标元组并计算两点之间的距离，但有一处访问方式写错了，请修复：</p>
<div class="code-editor" data-block-id="02-basic-syntax/03-data-types#3:10" data-expect-mode="literal" data-expect-pattern="5" data-starter-code="fn%20distance(p1%3A%20(f64%2C%20f64)%2C%20p2%3A%20(f64%2C%20f64))%20-%3E%20f64%20%7B%0A%20%20%20%20let%20dx%20%3D%20p1%5B0%5D%20-%20p2%5B0%5D%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%E7%9A%84%E8%AE%BF%E9%97%AE%E6%96%B9%E5%BC%8F%0A%20%20%20%20let%20dy%20%3D%20p1%5B1%5D%20-%20p2%5B1%5D%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%E7%9A%84%E8%AE%BF%E9%97%AE%E6%96%B9%E5%BC%8F%0A%20%20%20%20(dx%20*%20dx%20%2B%20dy%20*%20dy).sqrt()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%20(0.0%2C%200.0)%3B%0A%20%20%20%20let%20b%20%3D%20(3.0%2C%204.0)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20distance(a%2C%20b))%3B%0A%7D"><pre><code class="language-rust">fn distance(p1: (f64, f64), p2: (f64, f64)) -&gt; f64 {
    let dx = p1[0] - p2[0]; // 错误的访问方式
    let dy = p1[1] - p2[1]; // 错误的访问方式
    (dx * dx + dy * dy).sqrt()
}

fn main() {
    let a = (0.0, 0.0);
    let b = (3.0, 4.0);
    println!("{}", distance(a, b));
}</code></pre></div>
<h2 id="编程练习-2">编程练习 2</h2>
<p>下面函数想计算百分比，但因为整数除法导致结果总是 <code>0.0</code>，请修复使其输出正确结果。</p>
<div class="code-editor" data-block-id="02-basic-syntax/03-data-types#3:11" data-expect-mode="literal" data-expect-pattern="33.3%0A40.0" data-starter-code="fn%20percentage(part%3A%20i32%2C%20total%3A%20i32)%20-%3E%20f64%20%7B%0A%20%20%20%20(part%20%2F%20total%20*%20100)%20as%20f64%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%3A.1%7D%22%2C%20percentage(1%2C%203))%3B%0A%20%20%20%20println!(%22%7B%3A.1%7D%22%2C%20percentage(2%2C%205))%3B%0A%7D"><pre><code class="language-rust">fn percentage(part: i32, total: i32) -&gt; f64 {
    (part / total * 100) as f64
}

fn main() {
    println!("{:.1}", percentage(1, 3));
    println!("{:.1}", percentage(2, 5));
}</code></pre></div> 