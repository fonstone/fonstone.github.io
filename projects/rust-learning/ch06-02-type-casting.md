---
title: "类型铸造（as 关键字）"
description: "类型系统进阶 - 类型铸造（as 关键字）"
date: "2026-07-12"
order: 6002
tags: ["类型转换", "类型铸造", "as", "转换规则", "溢出"]
est_time: "20 分钟"
---

 <h1 id="类型铸造基础">类型铸造基础</h1>
<h2 id="为什么需要类型铸造">为什么需要类型铸造</h2>
<p>不同类型的数据之间有时需要互相转换。例如：</p>
<ul>
<li>将浮点数转为整数</li>
<li>将整数转为字符</li>
<li>将小范围的整数转为大范围的整数</li>
</ul>
<p>Rust <strong>不提供隐式类型转换</strong>（除了某些特殊情况如自动解引用）。这是 Rust 的安全哲学：<strong>显式优于隐式</strong>。如果你想转换类型，必须明确地说出来。</p>
<p>这样做的好处：</p>
<ul>
<li><strong>防止意外的数据丢失</strong>（如 <code>f64 -&gt; i32</code> 丢失小数部分）</li>
<li><strong>明确意图</strong>（代码清晰可读）</li>
<li><strong>捕获错误</strong>（编译器会检查非法转换）</li>
</ul>
<h2 id="基本语法">基本语法</h2>
<p>使用 <strong><code>as</code></strong> 关键字进行显式类型转换：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%B5%AE%E7%82%B9%E6%95%B0%20-%3E%20%E6%95%B4%E6%95%B0%0A%20%20%20%20let%20float_val%3A%20f32%20%3D%2065.4%3B%0A%20%20%20%20let%20int_val%20%3D%20float_val%20as%20i32%3B%0A%20%20%20%20println!(%22%E6%B5%AE%E7%82%B9%E6%95%B0%20%7B%7D%20%E8%BD%AC%E4%B8%BA%E6%95%B4%E6%95%B0%20%7B%7D%22%2C%20float_val%2C%20int_val)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%95%B4%E6%95%B0%20-%3E%20%E6%B5%AE%E7%82%B9%E6%95%B0%0A%20%20%20%20let%20num%20%3D%20100%3B%0A%20%20%20%20let%20float_num%20%3D%20num%20as%20f64%3B%0A%20%20%20%20println!(%22%E6%95%B4%E6%95%B0%20%7B%7D%20%E8%BD%AC%E4%B8%BA%E6%B5%AE%E7%82%B9%E6%95%B0%20%7B%7D%22%2C%20num%2C%20float_num)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%95%B4%E6%95%B0%20-%3E%20%E5%AD%97%E7%AC%A6%0A%20%20%20%20let%20code%20%3D%2065u8%3B%0A%20%20%20%20let%20character%20%3D%20code%20as%20char%3B%0A%20%20%20%20println!(%22%E6%95%B4%E6%95%B0%20%7B%7D%20%E8%BD%AC%E4%B8%BA%E5%AD%97%E7%AC%A6%20'%7B%7D'%22%2C%20code%2C%20character)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 浮点数 -&gt; 整数
    let float_val: f32 = 65.4;
    let int_val = float_val as i32;
    println!("浮点数 {} 转为整数 {}", float_val, int_val);

    // 整数 -&gt; 浮点数
    let num = 100;
    let float_num = num as f64;
    println!("整数 {} 转为浮点数 {}", num, float_num);

    // 整数 -&gt; 字符
    let code = 65u8;
    let character = code as char;
    println!("整数 {} 转为字符 '{}'", code, character);
}</code></pre></div>
<h2 id="整数转换规则">整数转换规则</h2>
<h3 id="无符号整数之间的转换">无符号整数之间的转换</h3>
<p>当从一个无符号整数类型转换到另一个时，<strong>只保留有效位</strong>。多余的高位被丢弃：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%201000%20%E5%9C%A8%20u8%20%E8%8C%83%E5%9B%B4%E5%86%85%E5%90%97%EF%BC%9Fu8%20%E6%9C%80%E5%A4%A7%E5%80%BC%E6%98%AF%20255%EF%BC%8C%E6%89%80%E4%BB%A5%E4%B8%8D%E5%9C%A8%0A%20%20%20%20%2F%2F%201000%20%E7%9A%84%E4%BA%8C%E8%BF%9B%E5%88%B6%E6%98%AF%2011111010000%EF%BC%8811%20%E4%BD%8D%EF%BC%89%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E4%BF%9D%E7%95%99%E4%BD%8E%208%20%E4%BD%8D%EF%BC%9A11101000%20%3D%20232%0A%20%20%20%20let%20value%20%3D%201000u16%3B%0A%20%20%20%20let%20narrow%20%3D%20value%20as%20u8%3B%0A%20%20%20%20println!(%221000%20as%20u8%20%3D%20%7B%7D%20(%E6%9C%9F%E6%9C%9B%20232)%22%2C%20narrow)%3B%0A%0A%20%20%20%20%2F%2F%20%E9%AA%8C%E8%AF%81%EF%BC%9A1000%20mod%20256%20%3D%20232%0A%20%20%20%20println!(%221000%20%25%20256%20%3D%20%7B%7D%22%2C%201000%20%25%20256)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 1000 在 u8 范围内吗？u8 最大值是 255，所以不在
    // 1000 的二进制是 11111010000（11 位）
    // 只保留低 8 位：11101000 = 232
    let value = 1000u16;
    let narrow = value as u8;
    println!("1000 as u8 = {} (期望 232)", narrow);

    // 验证：1000 mod 256 = 232
    println!("1000 % 256 = {}", 1000 % 256);
}</code></pre></div>
<blockquote>
<p><strong>记住</strong>：对于无符号整数转换，转换后的值相当于原值对 <code>2^(目标位数)</code> 取模。</p>
</blockquote>
<h3 id="有符号整数的转换">有符号整数的转换</h3>
<p>有符号整数的转换涉及<strong>二进制补码</strong>（two’s complement）。转换规则：</p>
<ol>
<li><strong>如果值在目标范围内</strong>，直接转换</li>
<li><strong>如果值超出范围</strong>，先转为对应的无符号类型（按上面的规则），再按二进制补码解释</li>
</ol>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E4%BE%8B%E5%AD%90%201%EF%BC%9A%E5%80%BC%E5%9C%A8%E8%8C%83%E5%9B%B4%E5%86%85%0A%20%20%20%20let%20num%20%3D%20128i32%3B%0A%20%20%20%20let%20as_i16%20%3D%20num%20as%20i16%3B%0A%20%20%20%20println!(%22128%20as%20i16%20%3D%20%7B%7D%22%2C%20as_i16)%3B%20%20%2F%2F%20%E4%BB%8D%E6%98%AF%20128%0A%0A%20%20%20%20%2F%2F%20%E4%BE%8B%E5%AD%90%202%EF%BC%9A%E5%80%BC%E8%B6%85%E5%87%BA%E8%8C%83%E5%9B%B4%0A%20%20%20%20%2F%2F%20128%20%E4%BD%9C%E4%B8%BA%20u8%20%E8%BF%98%E6%98%AF%20128%0A%20%20%20%20%2F%2F%20%E4%BD%86%20128%20%E7%9A%84%E4%BA%8C%E8%BF%9B%E5%88%B6%E8%A1%A5%E7%A0%81%E8%A2%AB%E8%A7%A3%E9%87%8A%E4%B8%BA%20i8%20%E6%97%B6%EF%BC%8C%E6%9C%80%E9%AB%98%E4%BD%8D%E6%98%AF%201%EF%BC%8C%E6%89%80%E4%BB%A5%E6%98%AF%E8%B4%9F%E6%95%B0%0A%20%20%20%20%2F%2F%20128%20%3D%2010000000%20(i8)%20-%3E%20-128%0A%20%20%20%20let%20num2%20%3D%20128i32%3B%0A%20%20%20%20let%20as_i8%20%3D%20num2%20as%20i8%3B%0A%20%20%20%20println!(%22128%20as%20i8%20%3D%20%7B%7D%20(%E4%BA%8C%E8%BF%9B%E5%88%B6%E8%A1%A5%E7%A0%81%E8%A7%A3%E9%87%8A%E4%B8%BA%20-128)%22%2C%20as_i8)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BE%8B%E5%AD%90%203%EF%BC%9A%E8%B4%9F%E6%95%B0%E8%BD%AC%E6%97%A0%E7%AC%A6%E5%8F%B7%0A%20%20%20%20%2F%2F%20-1%20%E7%9A%84%E4%BA%8C%E8%BF%9B%E5%88%B6%E8%A1%A5%E7%A0%81%E6%98%AF%2011111111%EF%BC%88%E6%89%80%E6%9C%89%E4%BD%8D%E9%83%BD%E6%98%AF%201%EF%BC%89%0A%20%20%20%20%2F%2F%20%E8%BD%AC%E4%B8%BA%20u8%20%E5%90%8E%E4%BF%9D%E7%95%99%E6%89%80%E6%9C%89%208%20%E4%BD%8D%EF%BC%8C%E7%BB%93%E6%9E%9C%E6%98%AF%20255%0A%20%20%20%20let%20neg%20%3D%20-1i8%3B%0A%20%20%20%20let%20as_u8%20%3D%20neg%20as%20u8%3B%0A%20%20%20%20println!(%22-1%20as%20u8%20%3D%20%7B%7D%22%2C%20as_u8)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 例子 1：值在范围内
    let num = 128i32;
    let as_i16 = num as i16;
    println!("128 as i16 = {}", as_i16);  // 仍是 128

    // 例子 2：值超出范围
    // 128 作为 u8 还是 128
    // 但 128 的二进制补码被解释为 i8 时，最高位是 1，所以是负数
    // 128 = 10000000 (i8) -&gt; -128
    let num2 = 128i32;
    let as_i8 = num2 as i8;
    println!("128 as i8 = {} (二进制补码解释为 -128)", as_i8);

    // 例子 3：负数转无符号
    // -1 的二进制补码是 11111111（所有位都是 1）
    // 转为 u8 后保留所有 8 位，结果是 255
    let neg = -1i8;
    let as_u8 = neg as u8;
    println!("-1 as u8 = {}", as_u8);
}</code></pre></div>
<h3 id="有符号转无符号无符号转有符号">有符号转无符号，无符号转有符号</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%9C%89%E7%AC%A6%E5%8F%B7%20-%3E%20%E6%97%A0%E7%AC%A6%E5%8F%B7%EF%BC%9A%E6%8C%89%E4%BA%8C%E8%BF%9B%E5%88%B6%E8%A1%A5%E7%A0%81%E8%BD%AC%E6%8D%A2%0A%20%20%20%20let%20signed%3A%20i32%20%3D%20-42%3B%0A%20%20%20%20let%20unsigned%20%3D%20signed%20as%20u32%3B%0A%20%20%20%20println!(%22-42%20as%20u32%20%3D%20%7B%7D%22%2C%20unsigned)%3B%20%20%2F%2F%20%E5%A4%A7%E6%AD%A3%E6%95%B0%0A%0A%20%20%20%20%2F%2F%20%E6%97%A0%E7%AC%A6%E5%8F%B7%20-%3E%20%E6%9C%89%E7%AC%A6%E5%8F%B7%EF%BC%9A%E6%8C%89%E4%BA%8C%E8%BF%9B%E5%88%B6%E8%A1%A5%E7%A0%81%E8%A7%A3%E9%87%8A%0A%20%20%20%20let%20unsigned2%3A%20u32%20%3D%204294967254%3B%20%20%2F%2F%20%E5%B0%B1%E6%98%AF%20-42%20%E7%9A%84%E4%BA%8C%E8%BF%9B%E5%88%B6%E8%A1%A8%E7%A4%BA%0A%20%20%20%20let%20signed2%20%3D%20unsigned2%20as%20i32%3B%0A%20%20%20%20println!(%224294967254%20as%20i32%20%3D%20%7B%7D%22%2C%20signed2)%3B%20%20%2F%2F%20-42%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 有符号 -&gt; 无符号：按二进制补码转换
    let signed: i32 = -42;
    let unsigned = signed as u32;
    println!("-42 as u32 = {}", unsigned);  // 大正数

    // 无符号 -&gt; 有符号：按二进制补码解释
    let unsigned2: u32 = 4294967254;  // 就是 -42 的二进制表示
    let signed2 = unsigned2 as i32;
    println!("4294967254 as i32 = {}", signed2);  // -42
}</code></pre></div>
<h2 id="浮点数转换">浮点数转换</h2>
<h3 id="浮点数---整数">浮点数 -&gt; 整数</h3>
<p>转换时<strong>舍弃小数部分</strong>（向 0 取整）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20f1%20%3D%203.99f32%3B%0A%20%20%20%20let%20i1%20%3D%20f1%20as%20i32%3B%0A%20%20%20%20println!(%223.99%20as%20i32%20%3D%20%7B%7D%20(%E8%88%8D%E5%BC%83%E5%B0%8F%E6%95%B0%E9%83%A8%E5%88%86)%22%2C%20i1)%3B%20%20%2F%2F%203%0A%0A%20%20%20%20let%20f2%20%3D%20-3.99f32%3B%0A%20%20%20%20let%20i2%20%3D%20f2%20as%20i32%3B%0A%20%20%20%20println!(%22-3.99%20as%20i32%20%3D%20%7B%7D%22%2C%20i2)%3B%20%20%2F%2F%20-3%0A%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E6%B5%AE%E7%82%B9%E6%95%B0%E5%A4%AA%E5%A4%A7%EF%BC%8C%E8%B6%85%E5%87%BA%E6%95%B4%E6%95%B0%E8%8C%83%E5%9B%B4%E4%BC%9A%E4%BA%A7%E7%94%9F%E6%9C%AA%E5%AE%9A%E4%B9%89%E8%A1%8C%E4%B8%BA%0A%20%20%20%20%2F%2F%20%EF%BC%88%E5%9C%A8%E5%AE%9E%E8%B7%B5%E4%B8%AD%E9%80%9A%E5%B8%B8%E8%BD%AC%E4%B8%BA%200%20%E6%88%96%E8%AF%A5%E7%B1%BB%E5%9E%8B%E7%9A%84%E6%9C%80%E5%B0%8F%E5%80%BC%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let f1 = 3.99f32;
    let i1 = f1 as i32;
    println!("3.99 as i32 = {} (舍弃小数部分)", i1);  // 3

    let f2 = -3.99f32;
    let i2 = f2 as i32;
    println!("-3.99 as i32 = {}", i2);  // -3

    // 如果浮点数太大，超出整数范围会产生未定义行为
    // （在实践中通常转为 0 或该类型的最小值）
}</code></pre></div>
<h3 id="整数---浮点数">整数 -&gt; 浮点数</h3>
<p>通常没有精度问题，因为浮点数范围更大：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20i%20%3D%20100i32%3B%0A%20%20%20%20let%20f%20%3D%20i%20as%20f64%3B%0A%20%20%20%20println!(%22%7B%7D%20as%20f64%20%3D%20%7B%7D%22%2C%20i%2C%20f)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BD%86%E5%A4%A7%E6%95%B4%E6%95%B0%E5%8F%AF%E8%83%BD%E5%9B%A0%E6%B5%AE%E7%82%B9%E7%B2%BE%E5%BA%A6%E9%99%90%E5%88%B6%E8%80%8C%E4%B8%A7%E5%A4%B1%E7%B2%BE%E7%A1%AE%E6%80%A7%0A%20%20%20%20let%20big%20%3D%201_000_000_000_000_000_i64%3B%0A%20%20%20%20let%20f_big%20%3D%20big%20as%20f64%3B%0A%20%20%20%20println!(%22%E5%A4%A7%E6%95%B4%E6%95%B0%E8%BD%AC%E6%B5%AE%E7%82%B9%EF%BC%9A%7B%7D%20-%3E%20%7B%7D%22%2C%20big%2C%20f_big)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let i = 100i32;
    let f = i as f64;
    println!("{} as f64 = {}", i, f);

    // 但大整数可能因浮点精度限制而丧失精确性
    let big = 1_000_000_000_000_000_i64;
    let f_big = big as f64;
    println!("大整数转浮点：{} -&gt; {}", big, f_big);
}</code></pre></div>
<h3 id="浮点数---浮点数">浮点数 -&gt; 浮点数</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20f32_val%3A%20f32%20%3D%203.14%3B%0A%20%20%20%20let%20f64_val%20%3D%20f32_val%20as%20f64%3B%0A%20%20%20%20println!(%22f32%20%7B%7D%20-%3E%20f64%20%7B%7D%22%2C%20f32_val%2C%20f64_val)%3B%0A%0A%20%20%20%20let%20f64_val2%3A%20f64%20%3D%202.71828%3B%0A%20%20%20%20let%20f32_val2%20%3D%20f64_val2%20as%20f32%3B%0A%20%20%20%20println!(%22f64%20%7B%7D%20-%3E%20f32%20%7B%7D%22%2C%20f64_val2%2C%20f32_val2)%3B%20%20%2F%2F%20%E7%B2%BE%E5%BA%A6%E5%8F%AF%E8%83%BD%E4%B8%A7%E5%A4%B1%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let f32_val: f32 = 3.14;
    let f64_val = f32_val as f64;
    println!("f32 {} -&gt; f64 {}", f32_val, f64_val);

    let f64_val2: f64 = 2.71828;
    let f32_val2 = f64_val2 as f32;
    println!("f64 {} -&gt; f32 {}", f64_val2, f32_val2);  // 精度可能丧失
}</code></pre></div>
<h2 id="字符和整数的转换">字符和整数的转换</h2>
<h3 id="整数---字符">整数 -&gt; 字符</h3>
<p>使用 <code>as char</code> 将有效的 Unicode 标量值转为字符：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20codes%20%3D%20vec!%5B65u8%2C%2066%2C%2067%2C%2068%5D%3B%0A%0A%20%20%20%20for%20code%20in%20codes%20%7B%0A%20%20%20%20%20%20%20%20let%20ch%20%3D%20code%20as%20char%3B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%20-%3E%20'%7B%7D'%22%2C%20code%2C%20ch)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let codes = vec![65u8, 66, 67, 68];

    for code in codes {
        let ch = code as char;
        println!("{} -&gt; '{}'", code, ch);
    }
}</code></pre></div>
<h3 id="字符---整数">字符 -&gt; 整数</h3>
<p>使用 <code>as u32</code> 获得 Unicode 代码点：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20chars%20%3D%20vec!%5B'A'%2C%20'B'%2C%20'C'%2C%20'%E4%B8%AD'%5D%3B%0A%0A%20%20%20%20for%20ch%20in%20chars%20%7B%0A%20%20%20%20%20%20%20%20let%20code%20%3D%20ch%20as%20u32%3B%0A%20%20%20%20%20%20%20%20println!(%22'%7B%7D'%20-%3E%20%7B%7D%22%2C%20ch%2C%20code)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let chars = vec!['A', 'B', 'C', '中'];

    for ch in chars {
        let code = ch as u32;
        println!("'{}' -&gt; {}", ch, code);
    }
}</code></pre></div>
<blockquote>
<p><strong>注意</strong>：不是所有整数都对应有效的 Unicode 字符。转换时 Rust 不检查有效性（这是 <code>as</code> 的限制）。如果需要安全的转换，应使用 <code>char::from_u32()</code>。</p>
</blockquote>
<h2 id="常见陷阱">常见陷阱</h2>
<h3 id="陷阱-1溢出时的未定义行为">陷阱 1：溢出时的未定义行为</h3>
<p>在 release 模式下，整数溢出不会 panic，而是<strong>环绕</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20Debug%20%E6%A8%A1%E5%BC%8F%E4%BC%9A%20panic%EF%BC%8Crelease%20%E6%A8%A1%E5%BC%8F%E4%BC%9A%E7%8E%AF%E7%BB%95%0A%20%20%20%20%23%5Bcfg(debug_assertions)%5D%0A%20%20%20%20println!(%22Debug%20%E6%A8%A1%E5%BC%8F%EF%BC%9A%E5%A4%A7%E6%95%B4%E6%95%B0%E8%BD%AC%20u8%20%E5%8F%AF%E8%83%BD%20panic%22)%3B%0A%0A%20%20%20%20%23%5Bcfg(not(debug_assertions))%5D%0A%20%20%20%20println!(%22Release%20%E6%A8%A1%E5%BC%8F%EF%BC%9A%E5%A4%A7%E6%95%B4%E6%95%B0%E8%BD%AC%20u8%20%E4%BC%9A%E7%8E%AF%E7%BB%95%22)%3B%0A%0A%20%20%20%20let%20large%20%3D%20256u16%3B%0A%20%20%20%20let%20small%20%3D%20large%20as%20u8%3B%0A%20%20%20%20println!(%22256%20as%20u8%20%3D%20%7B%7D%22%2C%20small)%3B%20%20%2F%2F%200%EF%BC%88%E7%8E%AF%E7%BB%95%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // Debug 模式会 panic，release 模式会环绕
    #[cfg(debug_assertions)]
    println!("Debug 模式：大整数转 u8 可能 panic");

    #[cfg(not(debug_assertions))]
    println!("Release 模式：大整数转 u8 会环绕");

    let large = 256u16;
    let small = large as u8;
    println!("256 as u8 = {}", small);  // 0（环绕）
}</code></pre></div>
<h3 id="陷阱-2浮点转整数时的精度丧失">陷阱 2：浮点转整数时的精度丧失</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20f%20%3D%20123.456f64%3B%0A%20%20%20%20let%20i%20%3D%20f%20as%20i32%3B%0A%20%20%20%20println!(%22123.456%20%E8%BD%AC%E4%B8%BA%E6%95%B4%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20i)%3B%20%20%2F%2F%20123%EF%BC%88%E5%B0%8F%E6%95%B0%E4%B8%A2%E5%A4%B1%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let f = 123.456f64;
    let i = f as i32;
    println!("123.456 转为整数：{}", i);  // 123（小数丢失）
}</code></pre></div>
<h3 id="陷阱-3转换顺序很重要">陷阱 3：转换顺序很重要</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%201000i32%3B%0A%0A%20%20%20%20%2F%2F%20%E6%96%B9%E5%BC%8F%201%EF%BC%9A%E5%85%88%E8%BD%AC%20u8%EF%BC%8C%E5%86%8D%E8%BD%AC%20f64%0A%20%20%20%20let%20result1%20%3D%20(a%20as%20u8)%20as%20f64%3B%0A%20%20%20%20println!(%22(1000%20as%20u8)%20as%20f64%20%3D%20%7B%7D%22%2C%20result1)%3B%20%20%2F%2F%20232.0%0A%0A%20%20%20%20%2F%2F%20%E6%96%B9%E5%BC%8F%202%EF%BC%9A%E5%85%88%E8%BD%AC%20f64%EF%BC%8C%E5%86%8D%E8%BD%AC%20u8%0A%20%20%20%20let%20result2%20%3D%20(a%20as%20f64)%20as%20u8%3B%0A%20%20%20%20println!(%22(1000%20as%20f64)%20as%20u8%20%3D%20%7B%7D%22%2C%20result2)%3B%20%20%2F%2F%20232%0A%0A%20%20%20%20%2F%2F%20%E4%B8%A4%E8%80%85%E7%BB%93%E6%9E%9C%E7%9B%B8%E5%90%8C%EF%BC%8C%E4%BD%86%E8%BF%87%E7%A8%8B%E4%B8%8D%E5%90%8C%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let a = 1000i32;

    // 方式 1：先转 u8，再转 f64
    let result1 = (a as u8) as f64;
    println!("(1000 as u8) as f64 = {}", result1);  // 232.0

    // 方式 2：先转 f64，再转 u8
    let result2 = (a as f64) as u8;
    println!("(1000 as f64) as u8 = {}", result2);  // 232

    // 两者结果相同，但过程不同
}</code></pre></div>
<h1 id="练习题">练习题</h1>
<h2 id="类型铸造测验">类型铸造测验</h2>
<pre><code class="language-rust">fn main() {
    let x: u8 = 256u16 as u8;
    println!("{}", x);
}</code></pre>
</div>
<pre><code class="language-rust">fn main() {
    let f: f32 = 3.7;
    let i = f as i32;
    println!("{}", i);
}</code></pre>
</div>
<pre><code class="language-rust">fn main() {
    let x: i8 = 128i32 as i8;
    println!("{}", x);
}</code></pre>
</div>
</div>
<pre><code class="language-rust">let x = 5u32;
// 如何安全地转为 char？</code></pre>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习-1整数转换">练习 1：整数转换</h3>
<p>完成下面的代码，使其正确输出各种整数转换的结果：</p>
<div class="code-editor" data-block-id="06-type-system/02-type-casting#1:5" data-expect-mode="literal" data-expect-pattern="1000%20as%20u8%20%E9%A2%84%E6%9C%9F%20232%EF%BC%8C%E5%AE%9E%E9%99%85%20232%0A-42%20as%20u32%20%E9%A2%84%E6%9C%9F%E5%A4%A7%E6%95%B0%EF%BC%8C%E5%AE%9E%E9%99%85%204294967254%0A255%20as%20i8%20%E9%A2%84%E6%9C%9F%20-1%EF%BC%8C%E5%AE%9E%E9%99%85%20-1" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%B0%86%201000u16%20%E8%BD%AC%E4%B8%BA%20u8%EF%BC%8C%E8%BE%93%E5%87%BA%E7%BB%93%E6%9E%9C%E5%92%8C%E9%A2%84%E6%9C%9F%0A%20%20%20%20let%20val1%20%3D%201000u16%3B%0A%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%B0%86%20-42i32%20%E8%BD%AC%E4%B8%BA%20u32%EF%BC%8C%E8%BE%93%E5%87%BA%E7%BB%93%E6%9E%9C%0A%20%20%20%20let%20val2%20%3D%20-42i32%3B%0A%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%B0%86%20255i32%20%E8%BD%AC%E4%B8%BA%20i8%EF%BC%8C%E8%BE%93%E5%87%BA%E7%BB%93%E6%9E%9C%0A%20%20%20%20let%20val3%20%3D%20255i32%3B%0A%0A%0A%20%20%20%20println!(%221000%20as%20u8%20%E9%A2%84%E6%9C%9F%20232%EF%BC%8C%E5%AE%9E%E9%99%85%20%7B%7D%22%2C%20val1)%3B%0A%20%20%20%20println!(%22-42%20as%20u32%20%E9%A2%84%E6%9C%9F%E5%A4%A7%E6%95%B0%EF%BC%8C%E5%AE%9E%E9%99%85%20%7B%7D%22%2C%20val2)%3B%0A%20%20%20%20println!(%22255%20as%20i8%20%E9%A2%84%E6%9C%9F%20-1%EF%BC%8C%E5%AE%9E%E9%99%85%20%7B%7D%22%2C%20val3)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    // TODO: 将 1000u16 转为 u8，输出结果和预期
    let val1 = 1000u16;


    // TODO: 将 -42i32 转为 u32，输出结果
    let val2 = -42i32;


    // TODO: 将 255i32 转为 i8，输出结果
    let val3 = 255i32;


    println!("1000 as u8 预期 232，实际 {}", val1);
    println!("-42 as u32 预期大数，实际 {}", val2);
    println!("255 as i8 预期 -1，实际 {}", val3);
}</code></pre></div>
<h3 id="练习-2浮点和字符转换">练习 2：浮点和字符转换</h3>
<p>完成下面的代码，实现浮点数和字符的转换：</p>
<div class="code-editor" data-block-id="06-type-system/02-type-casting#1:6" data-expect-mode="literal" data-expect-pattern="%E6%B5%AE%E7%82%B9%E6%95%B0%203.99%20%E8%BD%AC%E4%B8%BA%E6%95%B4%E6%95%B0%EF%BC%9A3%0A%E6%95%B4%E6%95%B0%2065%20%E8%BD%AC%E4%B8%BA%E5%AD%97%E7%AC%A6%EF%BC%9A'A'%0A%E5%AD%97%E7%AC%A6%20'Z'%20%E8%BD%AC%E4%B8%BA%E4%BB%A3%E7%A0%81%EF%BC%9A90" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%B0%86%E6%B5%AE%E7%82%B9%E6%95%B0%203.99%20%E8%BD%AC%E4%B8%BA%20i32%EF%BC%8C%E5%AD%98%E5%82%A8%E5%9C%A8%20int_val%0A%20%20%20%20let%20float_val%20%3D%203.99f32%3B%0A%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%B0%86%E6%95%B4%E6%95%B0%2065%20%E8%BD%AC%E4%B8%BA%20char%EF%BC%8C%E5%AD%98%E5%82%A8%E5%9C%A8%20char_val%0A%20%20%20%20let%20int_code%20%3D%2065u8%3B%0A%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%B0%86%E5%AD%97%E7%AC%A6%20'Z'%20%E8%BD%AC%E4%B8%BA%20u32%EF%BC%8C%E5%AD%98%E5%82%A8%E5%9C%A8%20code%0A%20%20%20%20let%20character%20%3D%20'Z'%3B%0A%0A%0A%20%20%20%20println!(%22%E6%B5%AE%E7%82%B9%E6%95%B0%20%7B%7D%20%E8%BD%AC%E4%B8%BA%E6%95%B4%E6%95%B0%EF%BC%9A%7B%7D%22%2C%20float_val%2C%20int_val)%3B%0A%20%20%20%20println!(%22%E6%95%B4%E6%95%B0%20%7B%7D%20%E8%BD%AC%E4%B8%BA%E5%AD%97%E7%AC%A6%EF%BC%9A'%7B%7D'%22%2C%20int_code%2C%20char_val)%3B%0A%20%20%20%20println!(%22%E5%AD%97%E7%AC%A6%20'%7B%7D'%20%E8%BD%AC%E4%B8%BA%E4%BB%A3%E7%A0%81%EF%BC%9A%7B%7D%22%2C%20character%2C%20code)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    // TODO: 将浮点数 3.99 转为 i32，存储在 int_val
    let float_val = 3.99f32;


    // TODO: 将整数 65 转为 char，存储在 char_val
    let int_code = 65u8;


    // TODO: 将字符 'Z' 转为 u32，存储在 code
    let character = 'Z';


    println!("浮点数 {} 转为整数：{}", float_val, int_val);
    println!("整数 {} 转为字符：'{}'", int_code, char_val);
    println!("字符 '{}' 转为代码：{}", character, code);
}</code></pre></div> 