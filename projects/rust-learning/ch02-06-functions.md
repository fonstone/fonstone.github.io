---
title: "函数"
description: "基本语法 - 函数"
date: "2026-07-12"
order: 2006
tags: ["fn", "函数", "参数", "返回值", "语句", "表达式", "snake_case"]
est_time: "20 分钟"
---

 <h1 id="函数基础">函数基础</h1>
<p>函数是组织代码的基本单位。本文介绍 Rust 函数的定义方式、参数规则，以及一个新手最容易踩的坑——语句与表达式的区别。</p>
<p>Rust 中函数无处不在，你已经认识了最重要的一个：<code>main</code>。</p>
<h2 id="定义与调用">定义与调用</h2>
<p>用 <code>fn</code> 关键字定义函数，后跟函数名和一对圆括号，再用花括号包裹函数体：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20println!(%22Hello%2C%20world!%22)%3B%0A%20%20%20%20another_function()%3B%20%2F%2F%20%E8%B0%83%E7%94%A8%E5%8F%A6%E4%B8%80%E4%B8%AA%E5%87%BD%E6%95%B0%0A%7D%0A%0Afn%20another_function()%20%7B%0A%20%20%20%20println!(%22%E8%BF%99%E6%98%AF%E5%8F%A6%E4%B8%80%E4%B8%AA%E5%87%BD%E6%95%B0%E3%80%82%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    println!("Hello, world!");
    another_function(); // 调用另一个函数
}

fn another_function() {
    println!("这是另一个函数。");
}</code></pre></div>
<p><strong>Rust 不关心函数定义的顺序</strong>——<code>another_function</code> 定义在 <code>main</code> 之后完全没问题。只要在同一个作用域内定义过，就可以调用。</p>
<p>Rust 函数名使用 <strong>snake_case</strong>（蛇形命名法）：全部小写，单词之间用下划线连接。例如 <code>another_function</code>、<code>calculate_area</code>，而不是 <code>AnotherFunction</code> 或 <code>calculateArea</code>。</p>
<h2 id="参数">参数</h2>
<p>函数可以声明参数，让调用者传入数据：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20greet(%22Alice%22)%3B%20%2F%2F%20%E4%BC%A0%E5%85%A5%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%AD%97%E9%9D%A2%E9%87%8F%0A%7D%0A%0Afn%20greet(name%3A%20%26str)%20%7B%0A%20%20%20%20println!(%22%E4%BD%A0%E5%A5%BD%EF%BC%8C%7B%7D%EF%BC%81%22%2C%20name)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    greet("Alice"); // 传入字符串字面量
}

fn greet(name: &amp;str) {
    println!("你好，{}！", name);
}</code></pre></div>
<p><strong>Rust 要求在函数签名中显式声明每个参数的类型</strong>。这是一个有意为之的设计：只需看函数签名，不用查阅其他代码就能知道参数类型（否者一个变量声明后，经过多层函数传递，难以快速查阅其类型），编译器也不必在函数体外猜测类型。</p>
<p>如果省略类型标注，编译器会报错：</p>
<div class="code-runner" data-full-code="fn%20add(x%2C%20y)%20-%3E%20i32%20%7B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E7%BC%BA%E5%B0%91%E5%8F%82%E6%95%B0%E7%B1%BB%E5%9E%8B%0A%20%20%20%20x%20%2B%20y%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20add(1%2C%202))%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn add(x, y) -&gt; i32 { // 错误：缺少参数类型
    x + y
}

fn main() {
    println!("{}", add(1, 2));
}</code></pre></div>
<h2 id="多个参数">多个参数</h2>
<p>多个参数用逗号分隔，每个参数都必须单独标注类型：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20print_measurement(5%2C%20'h')%3B%0A%7D%0A%0Afn%20print_measurement(value%3A%20i32%2C%20unit%3A%20char)%20%7B%0A%20%20%20%20println!(%22%E6%B5%8B%E9%87%8F%E5%80%BC%EF%BC%9A%7B%7D%7B%7D%22%2C%20value%2C%20unit)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    print_measurement(5, 'h');
}

fn print_measurement(value: i32, unit: char) {
    println!("测量值：{}{}", value, unit);
}</code></pre></div>
<p>注意 <code>value: i32, unit: char</code> 不能省写成 <code>value, unit: i32, char</code>——每个参数都要写完整的 <code>名称: 类型</code> 对。</p>
<h1 id="语句与返回值">语句与返回值</h1>
<p>Rust 是一门<strong>基于表达式</strong>的语言。理解语句和表达式的区别，是写好 Rust 函数的关键。</p>
<h2 id="语句与表达式的区别">语句与表达式的区别</h2>
<ul>
<li><strong>语句</strong>（statement）：执行操作，<strong>不返回值</strong>。</li>
<li><strong>表达式</strong>（expression）：计算并<strong>产生一个值</strong>。</li>
</ul>
<p><code>let</code> 绑定是语句，<code>5 + 6</code> 是表达式。因此，你无法把 <code>let</code> 赋值的结果再赋给别的变量——它根本没有返回值：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%20(let%20y%20%3D%206)%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9Alet%20%E6%98%AF%E8%AF%AD%E5%8F%A5%EF%BC%8C%E6%B2%A1%E6%9C%89%E8%BF%94%E5%9B%9E%E5%80%BC%0A%20%20%20%20println!(%22%7B%7D%22%2C%20x)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let x = (let y = 6); // 错误：let 是语句，没有返回值
    println!("{}", x);
}</code></pre></div>
<p>这和 C 或 Ruby 不同。在那些语言里 <code>x = y = 6</code> 是合法的，因为赋值语句会返回被赋的值。Rust 选择了更严格的设计：赋值就是赋值，不能当表达式使用。</p>
<h2 id="代码块是表达式">代码块是表达式</h2>
<p>花括号 <code>{}</code> 包裹的代码块本身也是一个表达式，<strong>整个块的值是最后一行表达式的值</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20y%20%3D%20%7B%0A%20%20%20%20%20%20%20%20let%20x%20%3D%203%3B%0A%20%20%20%20%20%20%20%20x%20%2B%201%20%20%2F%2F%20%E6%B3%A8%E6%84%8F%EF%BC%9A%E6%B2%A1%E6%9C%89%E5%88%86%E5%8F%B7%EF%BC%8C%E8%BF%99%E6%98%AF%E8%A1%A8%E8%BE%BE%E5%BC%8F%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20println!(%22y%20%E7%9A%84%E5%80%BC%E6%98%AF%EF%BC%9A%7B%7D%22%2C%20y)%3B%20%2F%2F%20%E6%89%93%E5%8D%B0%204%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let y = {
        let x = 3;
        x + 1  // 注意：没有分号，这是表达式
    };

    println!("y 的值是：{}", y); // 打印 4
}</code></pre></div>
<p>关键在 <code>x + 1</code> 这一行——<strong>没有分号</strong>。一旦加上分号，它就从表达式变成了语句，整个块的值变成空的 <code>()</code>。</p>
<h2 id="返回值">返回值</h2>
<p>函数的返回值用 <code>-&gt;</code> 声明类型，<strong>返回值就是函数体最后一个表达式的值</strong>：</p>
<div class="code-runner" data-full-code="fn%20five()%20-%3E%20i32%20%7B%0A%20%20%20%205%20%20%2F%2F%20%E6%B2%A1%E6%9C%89%E5%88%86%E5%8F%B7%EF%BC%8C%E8%BF%99%E6%98%AF%E8%BF%94%E5%9B%9E%E5%80%BC%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%20five()%3B%0A%20%20%20%20println!(%22x%20%E7%9A%84%E5%80%BC%E6%98%AF%EF%BC%9A%7B%7D%22%2C%20x)%3B%20%2F%2F%20%E6%89%93%E5%8D%B0%205%0A%7D" data-mode="run"><pre><code class="language-rust">fn five() -&gt; i32 {
    5  // 没有分号，这是返回值
}

fn main() {
    let x = five();
    println!("x 的值是：{}", x); // 打印 5
}</code></pre></div>
<p><code>five</code> 函数体只有一个裸数字 <code>5</code>，没有 <code>return</code>，没有分号——这完全合法。函数体的最后一个表达式就是返回值。</p>
<p>可以用 <code>return</code> 提前返回，这在需要提前退出时很有用：</p>
<div class="code-runner" data-full-code="fn%20absolute_value(n%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20if%20n%20%3C%200%20%7B%0A%20%20%20%20%20%20%20%20return%20-n%3B%20%2F%2F%20%E6%8F%90%E5%89%8D%E8%BF%94%E5%9B%9E%0A%20%20%20%20%7D%0A%20%20%20%20n%20%2F%2F%20%E6%AD%A3%E5%B8%B8%E8%B7%AF%E5%BE%84%EF%BC%9A%E6%9C%80%E5%90%8E%E4%B8%80%E4%B8%AA%E8%A1%A8%E8%BE%BE%E5%BC%8F%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20absolute_value(-7))%3B%20%2F%2F%207%0A%20%20%20%20println!(%22%7B%7D%22%2C%20absolute_value(3))%3B%20%20%2F%2F%203%0A%7D" data-mode="run"><pre><code class="language-rust">fn absolute_value(n: i32) -&gt; i32 {
    if n &lt; 0 {
        return -n; // 提前返回
    }
    n // 正常路径：最后一个表达式
}

fn main() {
    println!("{}", absolute_value(-7)); // 7
    println!("{}", absolute_value(3));  // 3
}</code></pre></div>
<h2 id="分号陷阱">分号陷阱</h2>
<p>这是 Rust 新手最常遇到的错误：在返回值表达式末尾多加了分号。</p>
<div class="code-runner" data-full-code="fn%20plus_one(x%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20x%20%2B%201%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E5%8A%A0%E4%BA%86%E5%88%86%E5%8F%B7%EF%BC%8C%E5%8F%98%E6%88%90%E8%AF%AD%E5%8F%A5%EF%BC%8C%E6%B2%A1%E6%9C%89%E8%BF%94%E5%9B%9E%E5%80%BC%EF%BC%8C%E9%9A%90%E5%BC%8F%E8%BF%94%E5%9B%9E%20()%EF%BC%8C%E4%B8%8E%E5%A3%B0%E6%98%8E%E7%9A%84%20i32%20%E4%B8%8D%E7%AC%A6%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20plus_one(5))%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn plus_one(x: i32) -&gt; i32 {
    x + 1; // 错误：加了分号，变成语句，没有返回值，隐式返回 ()，与声明的 i32 不符
}

fn main() {
    println!("{}", plus_one(5));
}</code></pre></div>
<p>编译器会报 <code>mismatched types</code>，并贴心地提示”consider removing this semicolon”。记住规则：<strong>函数体最后一行如果是返回值，不加分号</strong>。</p>
<p>正确写法：</p>
<div class="code-runner" data-full-code="fn%20plus_one(x%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20x%20%2B%201%20%2F%2F%20%E6%B2%A1%E6%9C%89%E5%88%86%E5%8F%B7%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20plus_one(5))%3B%20%2F%2F%20%E6%89%93%E5%8D%B0%206%0A%7D" data-mode="run"><pre><code class="language-rust">fn plus_one(x: i32) -&gt; i32 {
    x + 1 // 没有分号
}

fn main() {
    println!("{}", plus_one(5)); // 打印 6
}</code></pre></div>
<h1 id="练习题">练习题</h1>
<h2 id="函数基础测验">函数基础测验</h2>
</div>
</div>
</div>
<h2 id="语句与返回值测验">语句与返回值测验</h2>
<pre><code class="language-rust">fn main() {
    let y = {
        let x = 10;
        x * 2
    };
    println!("{}", y);
}</code></pre>
</div>
<pre><code class="language-rust">fn double(x: i32) -&gt; i32 {
    x * 2;
}</code></pre>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习一实现-add-函数">练习一：实现 add 函数</h3>
<p>补全下面的函数，使其返回两个整数之和。注意不要在返回值表达式末尾加分号。</p>
<div class="code-editor" data-block-id="02-basic-syntax/06-functions#2:6" data-expect-mode="literal" data-expect-pattern="7%0A4" data-starter-code="fn%20add(a%3A%20i32%2C%20b%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E8%BF%94%E5%9B%9E%20a%20%2B%20b%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20add(3%2C%204))%3B%20%20%20%2F%2F%20%E5%BA%94%E8%BE%93%E5%87%BA%207%0A%20%20%20%20println!(%22%7B%7D%22%2C%20add(-1%2C%205))%3B%20%20%2F%2F%20%E5%BA%94%E8%BE%93%E5%87%BA%204%0A%7D"><pre><code class="language-rust">fn add(a: i32, b: i32) -&gt; i32 {
    // TODO：返回 a + b
}

fn main() {
    println!("{}", add(3, 4));   // 应输出 7
    println!("{}", add(-1, 5));  // 应输出 4
}</code></pre></div>
<h3 id="练习二温度转换">练习二：温度转换</h3>
<p>实现一个摄氏度转华氏度的函数。转换公式：<code>华氏度 = 摄氏度 × 9 / 5 + 32</code>。</p>
<div class="code-editor" data-block-id="02-basic-syntax/06-functions#2:7" data-expect-mode="literal" data-expect-pattern="0%C2%B0C%20%3D%2032.0%C2%B0F%0A100%C2%B0C%20%3D%20212.0%C2%B0F%0A37%C2%B0C%20%3D%2098.6%C2%B0F" data-starter-code="fn%20celsius_to_fahrenheit(c%3A%20f64)%20-%3E%20f64%20%7B%0A%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E5%AE%9E%E7%8E%B0%E8%BD%AC%E6%8D%A2%E5%85%AC%E5%BC%8F%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%C2%B0C%20%3D%20%7B%3A.1%7D%C2%B0F%22%2C%200.0%2C%20celsius_to_fahrenheit(0.0))%3B%20%20%20%20%2F%2F%200%C2%B0C%20%3D%2032.0%C2%B0F%0A%20%20%20%20println!(%22%7B%7D%C2%B0C%20%3D%20%7B%3A.1%7D%C2%B0F%22%2C%20100.0%2C%20celsius_to_fahrenheit(100.0))%3B%20%2F%2F%20100%C2%B0C%20%3D%20212.0%C2%B0F%0A%20%20%20%20println!(%22%7B%7D%C2%B0C%20%3D%20%7B%3A.1%7D%C2%B0F%22%2C%2037.0%2C%20celsius_to_fahrenheit(37.0))%3B%20%20%20%2F%2F%2037%C2%B0C%20%3D%2098.6%C2%B0F%0A%7D"><pre><code class="language-rust">fn celsius_to_fahrenheit(c: f64) -&gt; f64 {
    // TODO：实现转换公式
}

fn main() {
    println!("{}°C = {:.1}°F", 0.0, celsius_to_fahrenheit(0.0));    // 0°C = 32.0°F
    println!("{}°C = {:.1}°F", 100.0, celsius_to_fahrenheit(100.0)); // 100°C = 212.0°F
    println!("{}°C = {:.1}°F", 37.0, celsius_to_fahrenheit(37.0));   // 37°C = 98.6°F
}</code></pre></div> 