---
title: "切片"
description: "所有权系统 - 切片"
date: "2026-07-12"
order: 3004
tags: ["切片", "slice", "&str", "&[T]", "字符串切片", "数组切片", "range"]
est_time: "35 分钟"
---

 <h1 id="字符串切片">字符串切片</h1>
<p><strong>切片</strong>（slice）是对集合中一段<strong>连续元素序列</strong>的引用，它不拥有所有权。切片用一种让编译器帮你检查边界安全性的方式，取代了手动管理索引。</p>
<img alt="切片的原理" src="/images/rust/slice_string.svg" style="max-width:100%;margin:1rem 0;"/>
<h2 id="问题引入返回索引有什么不好">问题引入：返回索引有什么不好</h2>
<p>假设我们要写一个函数，找出字符串中第一个单词的结束位置。不用切片时，最直接的想法是返回一个索引：</p>
<div class="code-runner" data-full-code="fn%20first_word(s%3A%20%26String)%20-%3E%20usize%20%7B%0A%20%20%20%20let%20bytes%20%3D%20s.as_bytes()%3B%20%2F%2F%20%E6%8A%8A%E5%AD%97%E7%AC%A6%E4%B8%B2%E8%BD%AC%E6%88%90%E5%AD%97%E8%8A%82%E6%95%B0%E7%BB%84%0A%0A%20%20%20%20%2F%2F%20%E9%80%90%E5%AD%97%E8%8A%82%E9%81%8D%E5%8E%86%EF%BC%8C%E6%89%BE%E5%88%B0%E7%AC%AC%E4%B8%80%E4%B8%AA%E7%A9%BA%E6%A0%BC%0A%20%20%20%20for%20(i%2C%20%26item)%20in%20bytes.iter().enumerate()%20%7B%0A%20%20%20%20%20%20%20%20if%20item%20%3D%3D%20b'%20'%20%7B%20%2F%2F%20b'%20'%20%E6%98%AF%E7%A9%BA%E6%A0%BC%E5%AD%97%E8%8A%82%E7%9A%84%E5%AD%97%E9%9D%A2%E9%87%8F%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20i%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20s.len()%20%2F%2F%20%E6%B2%A1%E6%9C%89%E7%A9%BA%E6%A0%BC%EF%BC%8C%E6%95%B4%E4%B8%AA%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%B0%B1%E6%98%AF%E4%B8%80%E4%B8%AA%E5%8D%95%E8%AF%8D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%20world%22)%3B%0A%20%20%20%20let%20word_end%20%3D%20first_word(%26s)%3B%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%8D%95%E8%AF%8D%E7%BB%93%E6%9D%9F%E4%BA%8E%E7%B4%A2%E5%BC%95%20%7B%7D%22%2C%20word_end)%3B%20%2F%2F%205%0A%7D" data-mode="run"><pre><code class="language-rust">fn first_word(s: &amp;String) -&gt; usize {
    let bytes = s.as_bytes(); // 把字符串转成字节数组

    // 逐字节遍历，找到第一个空格
    for (i, &amp;item) in bytes.iter().enumerate() {
        if item == b' ' { // b' ' 是空格字节的字面量
            return i;
        }
    }

    s.len() // 没有空格，整个字符串就是一个单词
}

fn main() {
    let s = String::from("hello world");
    let word_end = first_word(&amp;s);
    println!("第一个单词结束于索引 {}", word_end); // 5
}</code></pre></div>
<p>这能工作，但有一个隐患——<code>word_end</code> 只是一个普通的 <code>usize</code> 整数，它和字符串 <code>s</code> 完全没有绑定关系：</p>
<div class="code-runner" data-full-code="fn%20first_word(s%3A%20%26String)%20-%3E%20usize%20%7B%0A%20%20%20%20let%20bytes%20%3D%20s.as_bytes()%3B%0A%20%20%20%20for%20(i%2C%20%26item)%20in%20bytes.iter().enumerate()%20%7B%0A%20%20%20%20%20%20%20%20if%20item%20%3D%3D%20b'%20'%20%7B%20return%20i%3B%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20s.len()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%20world%22)%3B%0A%20%20%20%20let%20word_end%20%3D%20first_word(%26s)%3B%20%2F%2F%20%E8%BF%94%E5%9B%9E%205%0A%0A%20%20%20%20s.clear()%3B%20%2F%2F%20%E6%8A%8A%E5%AD%97%E7%AC%A6%E4%B8%B2%E6%B8%85%E7%A9%BA%E4%BA%86%EF%BC%81%0A%0A%20%20%20%20%2F%2F%20word_end%20%E4%BB%8D%E7%84%B6%E6%98%AF%205%EF%BC%8C%E4%BD%86%20s%20%E5%B7%B2%E7%BB%8F%E7%A9%BA%E4%BA%86%0A%20%20%20%20%2F%2F%20%E7%94%A8%20word_end%20%E5%8E%BB%E5%88%87%E5%88%86%20s%20%E4%BC%9A%E5%BE%97%E5%88%B0%E9%94%99%E8%AF%AF%E7%BB%93%E6%9E%9C%EF%BC%8C%E4%BD%86%E7%BC%96%E8%AF%91%E5%99%A8%E4%B8%8D%E7%9F%A5%E9%81%93%0A%20%20%20%20println!(%22word_end%20%3D%20%7B%7D%22%2C%20word_end)%3B%20%2F%2F%20%E7%A8%8B%E5%BA%8F%E4%B8%8D%E6%8A%A5%E9%94%99%EF%BC%8C%E4%BD%86%E8%BF%99%E6%98%AF%20bug%EF%BC%81%0A%7D" data-mode="run"><pre><code class="language-rust">fn first_word(s: &amp;String) -&gt; usize {
    let bytes = s.as_bytes();
    for (i, &amp;item) in bytes.iter().enumerate() {
        if item == b' ' { return i; }
    }
    s.len()
}

fn main() {
    let mut s = String::from("hello world");
    let word_end = first_word(&amp;s); // 返回 5

    s.clear(); // 把字符串清空了！

    // word_end 仍然是 5，但 s 已经空了
    // 用 word_end 去切分 s 会得到错误结果，但编译器不知道
    println!("word_end = {}", word_end); // 程序不报错，但这是 bug！
}</code></pre></div>
<p>索引 <code>5</code> 变成了无效的信息——它描述的那个字符串已经不存在了，而编译器对此一无所知。如果再写一个 <code>second_word</code> 返回 <code>(usize, usize)</code>，情况会更难维护。</p>
<p><strong>切片解决的正是这个问题：让引用和数据永远绑定在一起。</strong></p>
<h2 id="字符串切片语法">字符串切片语法</h2>
<p>字符串切片（string slice）是对 <code>String</code> 中一段内容的引用，类型写作 <code>&amp;str</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%20world%22)%3B%0A%0A%20%20%20%20let%20hello%20%3D%20%26s%5B0..5%5D%3B%20%20%20%2F%2F%20%E7%B4%A2%E5%BC%95%200%20%E5%88%B0%204%EF%BC%88%E4%B8%8D%E5%90%AB%205%EF%BC%89%0A%20%20%20%20let%20world%20%3D%20%26s%5B6..11%5D%3B%20%20%2F%2F%20%E7%B4%A2%E5%BC%95%206%20%E5%88%B0%2010%EF%BC%88%E4%B8%8D%E5%90%AB%2011%EF%BC%89%0A%0A%20%20%20%20println!(%22%7B%7D%20%7B%7D%22%2C%20hello%2C%20world)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = String::from("hello world");

    let hello = &amp;s[0..5];   // 索引 0 到 4（不含 5）
    let world = &amp;s[6..11];  // 索引 6 到 10（不含 11）

    println!("{} {}", hello, world);
}</code></pre></div>
<p>语法是 <code>&amp;s[start..end]</code>，其中：</p>
<ul>
<li><code>start</code> 是切片的<strong>起始索引</strong>（包含）</li>
<li><code>end</code> 是切片的<strong>结束索引</strong>（不含，即”开区间”）</li>
</ul>
<blockquote>
<p>索引是按<strong>字节</strong>计算的，不是按字符。对于全 ASCII 的字符串没有问题；如果字符串包含中文等多字节字符，必须在字符边界处切分，否则程序会 panic。</p>
</blockquote>
<h2 id="range-的各种简写">Range 的各种简写</h2>
<p>Rust 的 <code>..</code> 语法有几种简写形式：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BB%8E%E5%A4%B4%E5%BC%80%E5%A7%8B%EF%BC%8C%E5%8F%AF%E4%BB%A5%E7%9C%81%E7%95%A5%E8%B5%B7%E5%A7%8B%E7%B4%A2%E5%BC%95%0A%20%20%20%20let%20s1%20%3D%20%26s%5B0..3%5D%3B%20%2F%2F%20%22hel%22%0A%20%20%20%20let%20s2%20%3D%20%26s%5B..3%5D%3B%20%20%2F%2F%20%E7%AD%89%E5%90%8C%E4%BA%8E%E4%B8%8A%E9%9D%A2%0A%0A%20%20%20%20%2F%2F%20%E5%88%B0%E6%9C%AB%E5%B0%BE%E7%BB%93%E6%9D%9F%EF%BC%8C%E5%8F%AF%E4%BB%A5%E7%9C%81%E7%95%A5%E7%BB%93%E6%9D%9F%E7%B4%A2%E5%BC%95%0A%20%20%20%20let%20s3%20%3D%20%26s%5B2..s.len()%5D%3B%20%2F%2F%20%22llo%22%0A%20%20%20%20let%20s4%20%3D%20%26s%5B2..%5D%3B%20%20%20%20%20%20%20%20%2F%2F%20%E7%AD%89%E5%90%8C%E4%BA%8E%E4%B8%8A%E9%9D%A2%0A%0A%20%20%20%20%2F%2F%20%E6%95%B4%E4%B8%AA%E5%AD%97%E7%AC%A6%E4%B8%B2%0A%20%20%20%20let%20s5%20%3D%20%26s%5B0..s.len()%5D%3B%20%2F%2F%20%22hello%22%0A%20%20%20%20let%20s6%20%3D%20%26s%5B..%5D%3B%20%20%20%20%20%20%20%20%20%2F%2F%20%E7%AD%89%E5%90%8C%E4%BA%8E%E4%B8%8A%E9%9D%A2%0A%0A%20%20%20%20println!(%22%7B%7D%20%7B%7D%20%7B%7D%20%7B%7D%20%7B%7D%20%7B%7D%22%2C%20s1%2C%20s2%2C%20s3%2C%20s4%2C%20s5%2C%20s6)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s = String::from("hello");

    // 从头开始，可以省略起始索引
    let s1 = &amp;s[0..3]; // "hel"
    let s2 = &amp;s[..3];  // 等同于上面

    // 到末尾结束，可以省略结束索引
    let s3 = &amp;s[2..s.len()]; // "llo"
    let s4 = &amp;s[2..];        // 等同于上面

    // 整个字符串
    let s5 = &amp;s[0..s.len()]; // "hello"
    let s6 = &amp;s[..];         // 等同于上面

    println!("{} {} {} {} {} {}", s1, s2, s3, s4, s5, s6);
}</code></pre></div>
<h2 id="用切片重写-first_word">用切片重写 first_word</h2>
<p>返回 <code>&amp;str</code> 而不是 <code>usize</code>，让切片与原始字符串绑定在一起：</p>
<div class="code-runner" data-full-code="fn%20first_word(s%3A%20%26String)%20-%3E%20%26str%20%7B%0A%20%20%20%20let%20bytes%20%3D%20s.as_bytes()%3B%0A%0A%20%20%20%20for%20(i%2C%20%26item)%20in%20bytes.iter().enumerate()%20%7B%0A%20%20%20%20%20%20%20%20if%20item%20%3D%3D%20b'%20'%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20%26s%5B0..i%5D%3B%20%2F%2F%20%E8%BF%94%E5%9B%9E%E5%88%87%E7%89%87%EF%BC%8C%E8%80%8C%E4%B8%8D%E6%98%AF%E7%B4%A2%E5%BC%95%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20%26s%5B..%5D%20%2F%2F%20%E6%B2%A1%E6%9C%89%E7%A9%BA%E6%A0%BC%EF%BC%8C%E8%BF%94%E5%9B%9E%E6%95%B4%E4%B8%AA%E5%AD%97%E7%AC%A6%E4%B8%B2%E7%9A%84%E5%88%87%E7%89%87%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%20world%22)%3B%0A%20%20%20%20let%20word%20%3D%20first_word(%26s)%3B%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%8D%95%E8%AF%8D%E6%98%AF%EF%BC%9A%7B%7D%22%2C%20word)%3B%20%2F%2F%20%22hello%22%0A%7D" data-mode="run"><pre><code class="language-rust">fn first_word(s: &amp;String) -&gt; &amp;str {
    let bytes = s.as_bytes();

    for (i, &amp;item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &amp;s[0..i]; // 返回切片，而不是索引
        }
    }

    &amp;s[..] // 没有空格，返回整个字符串的切片
}

fn main() {
    let s = String::from("hello world");
    let word = first_word(&amp;s);
    println!("第一个单词是：{}", word); // "hello"
}</code></pre></div>
<p>现在如果我们尝试在切片还存活时清空字符串，借用检查器会直接报错：</p>
<div class="code-runner" data-full-code="fn%20first_word(s%3A%20%26String)%20-%3E%20%26str%20%7B%0A%20%20%20%20let%20bytes%20%3D%20s.as_bytes()%3B%0A%20%20%20%20for%20(i%2C%20%26item)%20in%20bytes.iter().enumerate()%20%7B%0A%20%20%20%20%20%20%20%20if%20item%20%3D%3D%20b'%20'%20%7B%20return%20%26s%5B0..i%5D%3B%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20%26s%5B..%5D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20s%20%3D%20String%3A%3Afrom(%22hello%20world%22)%3B%0A%20%20%20%20let%20word%20%3D%20first_word(%26s)%3B%20%2F%2F%20word%20%E6%98%AF%E5%AF%B9%20s%20%E7%9A%84%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%0A%0A%20%20%20%20s.clear()%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81clear()%20%E9%9C%80%E8%A6%81%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%EF%BC%8C%E4%BD%86%20word%20%E8%BF%98%E6%8C%81%E6%9C%89%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20word)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn first_word(s: &amp;String) -&gt; &amp;str {
    let bytes = s.as_bytes();
    for (i, &amp;item) in bytes.iter().enumerate() {
        if item == b' ' { return &amp;s[0..i]; }
    }
    &amp;s[..]
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&amp;s); // word 是对 s 的不可变引用

    s.clear(); // 错误！clear() 需要可变引用，但 word 还持有不可变引用

    println!("{}", word);
}</code></pre></div>
<p>同样的 bug，现在在编译期就被发现了，而不是在运行时悄悄出错。这正是切片的核心价值：<strong>把”数据从哪里来”的信息编码进类型，让编译器帮你检查。</strong></p>
<h2 id="字符串字面量就是切片">字符串字面量就是切片</h2>
<p>我们一直在用的字符串字面量，它的类型其实就是 <code>&amp;str</code>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20s%3A%20%26str%20%3D%20%22hello%2C%20world!%22%3B%20%2F%2F%20%26str%20%E7%B1%BB%E5%9E%8B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let s: &amp;str = "hello, world!"; // &amp;str 类型
    println!("{}", s);
}</code></pre></div>
<p><code>"hello, world!"</code> 是程序二进制文件中只读区域的一段数据，<code>s</code> 是指向它的切片引用。这就是为什么字符串字面量永远是不可变的——它是对只读数据的不可变引用。</p>
<h1 id="str-vs-string">&amp;str vs &amp;String</h1>
<p>写函数时，参数应该用 <code>&amp;String</code> 还是 <code>&amp;str</code>？这是一个非常实用但容易搞混的问题：</p>
<h2 id="问题背景为什么会纠结">问题背景：为什么会纠结</h2>
<p>假设你要写一个函数来找出字符串中第一个单词。新手可能会这样写：</p>
<pre><code class="language-rust">fn first_word(s: &amp;String) -&gt; &amp;str {
    let bytes = s.as_bytes();
    for (i, &amp;item) in bytes.iter().enumerate() {
        if item == b' ' { return &amp;s[0..i]; }
    }
    &amp;s[..]
}

fn main() {
    let owned = String::from("hello world");
    let w1 = first_word(&amp;owned);           // ✓ 可以

    let w2 = first_word("hello world");    // ✗ 错误！参数是 &amp;str，不是 &amp;String
}</code></pre>
<p>你会发现，用 <code>&amp;String</code> 作参数后，<strong>无法直接传入字符串字面量</strong>。这很不方便。</p>
<h2 id="解决方案用-str-代替-string">解决方案：用 &amp;str 代替 &amp;String</h2>
<p>如果函数只需要<strong>读取</strong>字符串内容（不需要转移所有权），应该用 <code>&amp;str</code> 而不是 <code>&amp;String</code>：</p>
<div class="code-runner" data-full-code="fn%20first_word(s%3A%20%26str)%20-%3E%20%26str%20%7B%20%20%2F%2F%20%E6%94%B9%E4%B8%BA%20%26str%0A%20%20%20%20let%20bytes%20%3D%20s.as_bytes()%3B%0A%20%20%20%20for%20(i%2C%20%26item)%20in%20bytes.iter().enumerate()%20%7B%0A%20%20%20%20%20%20%20%20if%20item%20%3D%3D%20b'%20'%20%7B%20return%20%26s%5B0..i%5D%3B%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20%26s%5B..%5D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20owned%20%3D%20String%3A%3Afrom(%22hello%20world%22)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BC%A0%20%26String%EF%BC%9A%E8%87%AA%E5%8A%A8%E8%BD%AC%E6%8D%A2%E4%B8%BA%20%26str%EF%BC%88%E8%A7%A3%E5%BC%95%E7%94%A8%E5%BC%BA%E5%88%B6%E8%BD%AC%E6%8D%A2%EF%BC%89%0A%20%20%20%20let%20w1%20%3D%20first_word(%26owned)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BC%A0%20%26str%20%E5%88%87%E7%89%87%0A%20%20%20%20let%20w2%20%3D%20first_word(%26owned%5B..%5D)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BC%A0%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%AD%97%E9%9D%A2%E9%87%8F%EF%BC%88%E5%AD%97%E9%9D%A2%E9%87%8F%E6%9C%AC%E8%BA%AB%E5%B0%B1%E6%98%AF%20%26str%EF%BC%89%0A%20%20%20%20let%20w3%20%3D%20first_word(%22hello%20world%22)%3B%0A%0A%20%20%20%20println!(%22%7B%7D%20%7B%7D%20%7B%7D%22%2C%20w1%2C%20w2%2C%20w3)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn first_word(s: &amp;str) -&gt; &amp;str {  // 改为 &amp;str
    let bytes = s.as_bytes();
    for (i, &amp;item) in bytes.iter().enumerate() {
        if item == b' ' { return &amp;s[0..i]; }
    }
    &amp;s[..]
}

fn main() {
    let owned = String::from("hello world");

    // 传 &amp;String：自动转换为 &amp;str（解引用强制转换）
    let w1 = first_word(&amp;owned);

    // 传 &amp;str 切片
    let w2 = first_word(&amp;owned[..]);

    // 传字符串字面量（字面量本身就是 &amp;str）
    let w3 = first_word("hello world");

    println!("{} {} {}", w1, w2, w3);
}</code></pre></div>
<p>现在<strong>三种调用方式都工作了</strong>！</p>
<h2 id="原理解引用强制转换">原理：解引用强制转换</h2>
<p>为什么 <code>&amp;String</code> 可以自动转换为 <code>&amp;str</code>？这叫<strong>解引用强制转换</strong>（deref coercion）。</p>
<ul>
<li><code>&amp;String</code> 的本质是”指向 String 数据的引用”</li>
<li><code>&amp;str</code> 的本质是”对字符串数据某一段的切片引用”</li>
<li>Rust 编译器足够聪明，知道当你传 <code>&amp;String</code> 给期望 <code>&amp;str</code> 的函数时，可以自动将其转换为”整个字符串的 <code>&amp;str</code> 切片”</li>
</ul>
<h2 id="最佳实践">最佳实践</h2>
<p><strong>规则很简单</strong>：</p>
<table><thead><tr><th>函数需要…</th><th>参数类型</th><th>原因</th></tr></thead><tbody><tr><td>只读字符串</td><td><code>&amp;str</code></td><td>可以接受 <code>&amp;String</code>、字面量、切片，最灵活</td></tr><tr><td>可能修改字符串</td><td><code>&amp;mut String</code></td><td>需要可变访问权限，只能传 <code>&amp;mut String</code></td></tr><tr><td>拥有字符串</td><td><code>String</code></td><td>需要完全所有权，会转移所有权</td></tr></tbody></table>
<p><strong>类比其他切片</strong>：数组切片也遵循同样逻辑——函数参数用 <code>&amp;[T]</code> 比 <code>&amp;Vec&lt;T&gt;</code> 更通用，因为 <code>&amp;[T]</code> 可以接受任何数组或 <code>Vec</code> 的切片。</p>
<h1 id="数组与其他切片">数组与其他切片</h1>
<p>字符串切片只是切片的一种特殊形式。Rust 的切片机制适用于任何数组和序列类型。</p>
<h2 id="数组切片语法">数组切片语法</h2>
<p>对数组取切片，就像对字符串取切片一样：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20let%20slice%20%3D%20%26a%5B1..3%5D%3B%20%2F%2F%20%E5%8F%96%E7%B4%A2%E5%BC%95%201%20%E5%88%B0%202%20%E7%9A%84%E5%85%83%E7%B4%A0%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20slice)%3B%20%2F%2F%20%5B2%2C%203%5D%0A%0A%20%20%20%20%2F%2F%20%E7%9C%81%E7%95%A5%E5%86%99%E6%B3%95%E5%90%8C%E6%A0%B7%E9%80%82%E7%94%A8%0A%20%20%20%20let%20first_three%20%3D%20%26a%5B..3%5D%3B%20%2F%2F%20%5B1%2C%202%2C%203%5D%0A%20%20%20%20let%20last_two%20%3D%20%26a%5B3..%5D%3B%20%20%20%20%2F%2F%20%5B4%2C%205%5D%0A%20%20%20%20let%20all%20%3D%20%26a%5B..%5D%3B%20%20%20%20%20%20%20%20%20%20%2F%2F%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%20%7B%3A%3F%7D%20%7B%3A%3F%7D%22%2C%20first_three%2C%20last_two%2C%20all)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let a = [1, 2, 3, 4, 5];

    let slice = &amp;a[1..3]; // 取索引 1 到 2 的元素
    println!("{:?}", slice); // [2, 3]

    // 省略写法同样适用
    let first_three = &amp;a[..3]; // [1, 2, 3]
    let last_two = &amp;a[3..];    // [4, 5]
    let all = &amp;a[..];          // [1, 2, 3, 4, 5]

    println!("{:?} {:?} {:?}", first_three, last_two, all);
}</code></pre></div>
<p>数组切片的类型是 <code>&amp;[T]</code>，其中 <code>T</code> 是数组元素的类型。比如 <code>[i32; 5]</code> 的切片类型是 <code>&amp;[i32]</code>，<code>[bool; 3]</code> 的切片类型是 <code>&amp;[bool]</code>。</p>
<h2 id="切片的内部结构">切片的内部结构</h2>
<img alt="切片的原理" src="/images/rust/slice.svg" style="max-width:100%;margin:1rem 0;"/>
<p>字符串切片和数组切片在内部结构上是一样的：存储<strong>指向序列起始位置的指针</strong>和<strong>切片的长度</strong>。切片本身存在栈上（两个 <code>usize</code> 大小），真正的数据仍然在原始集合里。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%20%5B10%2C%2020%2C%2030%2C%2040%2C%2050%5D%3B%0A%20%20%20%20let%20slice%20%3D%20%26a%5B1..4%5D%3B%20%2F%2F%20%E6%8C%87%E5%90%91%20a%5B1%5D%EF%BC%8C%E9%95%BF%E5%BA%A6%E4%B8%BA%203%0A%0A%20%20%20%20println!(%22%E5%88%87%E7%89%87%E5%86%85%E5%AE%B9%EF%BC%9A%7B%3A%3F%7D%22%2C%20slice)%3B%0A%20%20%20%20println!(%22%E5%88%87%E7%89%87%E9%95%BF%E5%BA%A6%EF%BC%9A%7B%7D%22%2C%20slice.len())%3B%20%2F%2F%203%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let a = [10, 20, 30, 40, 50];
    let slice = &amp;a[1..4]; // 指向 a[1]，长度为 3

    println!("切片内容：{:?}", slice);
    println!("切片长度：{}", slice.len()); // 3
}</code></pre></div>
<p>这也意味着切片不复制数据，只是创建了一个”窗口”，从已有数据中截取一段来观察。</p>
<h2 id="函数中使用数组切片">函数中使用数组切片</h2>
<p>把 <code>&amp;[T]</code> 作为函数参数，是 Rust 中处理序列数据的惯用方式。函数可以接受数组的任意一段，而不需要知道数组的具体大小：</p>
<div class="code-runner" data-full-code="fn%20sum(numbers%3A%20%26%5Bi32%5D)%20-%3E%20i32%20%7B%0A%20%20%20%20let%20mut%20total%20%3D%200%3B%0A%20%20%20%20for%20n%20in%20numbers%20%7B%0A%20%20%20%20%20%20%20%20total%20%2B%3D%20n%3B%0A%20%20%20%20%7D%0A%20%20%20%20total%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20arr%20%3D%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20println!(%22%E5%85%A8%E9%83%A8%E4%B9%8B%E5%92%8C%EF%BC%9A%7B%7D%22%2C%20sum(%26arr))%3B%20%20%20%20%20%20%20%20%2F%2F%2015%0A%20%20%20%20println!(%22%E5%89%8D%E4%B8%89%E9%A1%B9%E4%B9%8B%E5%92%8C%EF%BC%9A%7B%7D%22%2C%20sum(%26arr%5B..3%5D))%3B%20%2F%2F%206%0A%20%20%20%20println!(%22%E5%90%8E%E4%B8%A4%E9%A1%B9%E4%B9%8B%E5%92%8C%EF%BC%9A%7B%7D%22%2C%20sum(%26arr%5B3..%5D))%3B%20%2F%2F%209%0A%7D" data-mode="run"><pre><code class="language-rust">fn sum(numbers: &amp;[i32]) -&gt; i32 {
    let mut total = 0;
    for n in numbers {
        total += n;
    }
    total
}

fn main() {
    let arr = [1, 2, 3, 4, 5];

    println!("全部之和：{}", sum(&amp;arr));        // 15
    println!("前三项之和：{}", sum(&amp;arr[..3])); // 6
    println!("后两项之和：{}", sum(&amp;arr[3..])); // 9
}</code></pre></div>
<blockquote>
<p>这个 <code>sum</code> 函数接受 <code>&amp;[i32]</code>，因此同一个函数既可以接受完整数组的引用，也可以接受任意长度的子切片——灵活又安全。</p>
</blockquote>
<h2 id="切片与所有权">切片与所有权</h2>
<p>切片不拥有数据，它是对原始集合的<strong>借用</strong>。</p>
<h3 id="不可变切片">不可变切片</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20let%20s%20%3D%20%26v%5B1..3%5D%3B%20%2F%2F%20%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%88%87%E7%89%87%0A%0A%20%20%20%20v%5B0%5D%20%3D%2099%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81v%20%E8%A2%AB%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%80%9F%E7%94%A8%E4%B8%AD%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20s)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let mut v = [1, 2, 3, 4, 5];
    let s = &amp;v[1..3]; // 不可变切片

    v[0] = 99; // 错误！v 被不可变借用中

    println!("{:?}", s);
}</code></pre></div>
<h3 id="可变切片">可变切片</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20let%20s%20%3D%20%26mut%20v%5B1..3%5D%3B%20%2F%2F%20%E5%8F%AF%E5%8F%98%E5%88%87%E7%89%87%0A%0A%20%20%20%20s%5B0%5D%20%3D%2020%3B%20%20%2F%2F%20%E2%9C%93%20%E5%8F%AF%E4%BB%A5%E4%BF%AE%E6%94%B9%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut v = vec![1, 2, 3, 4, 5];
    let s = &amp;mut v[1..3]; // 可变切片

    s[0] = 20;  // ✓ 可以修改
    println!("{:?}", v);
}</code></pre></div>
<p>切片遵循和引用完全相同的借用规则——不可变切片可以多个共存，可变切片同一时间只能有一个，两者不能同时存在。</p>
<h1 id="练习题">练习题</h1>
<h2 id="字符串切片测验">字符串切片测验</h2>
</div>
<pre><code class="language-rust">fn main() {
    let s = String::from("hello world");
    let hello = &amp;s[..5];
    let world = &amp;s[6..];
    println!("{} {}", hello, world);
}</code></pre>
</div>
</div>
<pre><code class="language-rust">fn first_word(s: &amp;String) -&gt; &amp;str {
    let bytes = s.as_bytes();
    for (i, &amp;item) in bytes.iter().enumerate() {
        if item == b' ' { return &amp;s[0..i]; }
    }
    &amp;s[..]
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&amp;s);
    s.clear();
    println!("{}", word);
}</code></pre>
</div>
<h2 id="数组切片测验">数组切片测验</h2>
<pre><code class="language-rust">fn main() {
    let a = [10, 20, 30, 40, 50];
    let s = &amp;a[1..4];
    println!("{}", s.len());
}</code></pre>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面的函数返回第一个单词结束位置的<strong>索引</strong>，请将其改写为返回<strong>字符串切片</strong>（<code>&amp;str</code>）：</p>
<div class="code-editor" data-block-id="03-ownership/04-slices#3:6" data-expect-mode="literal" data-expect-pattern="hello" data-starter-code="fn%20first_word(s%3A%20%26str)%20-%3E%20usize%20%7B%0A%20%20%20%20let%20bytes%20%3D%20s.as_bytes()%3B%0A%20%20%20%20for%20(i%2C%20%26item)%20in%20bytes.iter().enumerate()%20%7B%0A%20%20%20%20%20%20%20%20if%20item%20%3D%3D%20b'%20'%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20return%20i%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20s.len()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%20world%22)%3B%0A%20%20%20%20let%20word%20%3D%20first_word(%26s)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20word)%3B%0A%7D"><pre><code class="language-rust">fn first_word(s: &amp;str) -&gt; usize {
    let bytes = s.as_bytes();
    for (i, &amp;item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }
    s.len()
}

fn main() {
    let s = String::from("hello world");
    let word = first_word(&amp;s);
    println!("{}", word);
}</code></pre></div>
<hr/>
<p>下面的代码有借用冲突错误。找出问题并修复：</p>
<div class="code-editor" data-block-id="03-ownership/04-slices#3:7" data-starter-code="fn%20double_first(arr%3A%20%26mut%20%5Bi32%5D)%20%7B%0A%20%20%20%20arr%5B0%5D%20*%3D%202%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%20%20%20%20let%20first%20%3D%20%26v%5B0%5D%3B%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%88%9B%E5%BB%BA%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%88%87%E7%89%87%0A%20%20%20%20%0A%20%20%20%20double_first(%26mut%20v%5B..%5D)%3B%20%20%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81%E8%AF%95%E5%9B%BE%E5%88%9B%E5%BB%BA%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%0A%20%20%20%20%0A%20%20%20%20println!(%22first%3A%20%7B%7D%2C%20v%5B0%5D%3A%20%7B%7D%22%2C%20first%2C%20v%5B0%5D)%3B%0A%7D"><pre><code class="language-rust">fn double_first(arr: &amp;mut [i32]) {
    arr[0] *= 2;
}

fn main() {
    let mut v = vec![1, 2, 3];
    let first = &amp;v[0];           // 创建不可变切片
    
    double_first(&amp;mut v[..]);    // 错误！试图创建可变引用
    
    println!("first: {}, v[0]: {}", first, v[0]);
}</code></pre></div>
<p><strong>问题分析</strong>：</p>
<ol>
<li>
<p><strong>为什么会报错</strong>？ <code>first</code> 是什么类型的引用？ <code>double_first</code> 的参数需要什么类型的引用？</p>
</li>
<li>
<p><strong>如何修复</strong>？有几种修复方式，请思考至少两种。</p>
</li>
<li>
<p><strong>借用规则</strong>：这体现了之前学过的什么规则？（不可变引用与可变引用不能同时活跃）</p>
</li>
</ol> 