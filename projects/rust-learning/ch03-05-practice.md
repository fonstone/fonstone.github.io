---
title: "综合练习"
description: "所有权系统 - 综合练习"
date: "2026-07-12"
order: 3005
tags: ["所有权", "移动", "借用", "引用", "切片", "Copy", "Clone"]
est_time: "30 分钟"
---

 <h1 id="所有权与移动">所有权与移动</h1>
<h2 id="赋值后的-string">赋值后的 String</h2>
<pre><code class="language-rust">fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s1);
}</code></pre>
</div>
<h2 id="哪些类型是-copy">哪些类型是 Copy</h2>
</div>
<h2 id="clone-做了什么">clone() 做了什么</h2>
<pre><code class="language-rust">fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();
    println!("s1={}, s2={}", s1, s2);
}</code></pre>
</div>
<h2 id="函数消耗所有权">函数消耗所有权</h2>
<pre><code class="language-rust">fn consume(s: String) -&gt; usize {
    s.len()
}

fn main() {
    let s = String::from("hello");
    let n = consume(s);
    println!("{} {}", n, s);
}</code></pre>
</div>
<h2 id="变量何时被释放">变量何时被释放</h2>
<pre><code class="language-rust">fn main() {
    let x = 5;
    {
        let y = String::from("hello");
        println!("{} {}", x, y);
    }
    println!("{}", x);
}</code></pre>
</div>
<h1 id="借用与切片">借用与切片</h1>
<h2 id="nll-与借用范围">NLL 与借用范围</h2>
<pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");

    let r1 = &amp;s;
    let r2 = &amp;s;
    println!("{} {}", r1, r2); // r1、r2 最后一次使用在这里

    let r3 = &amp;mut s;
    r3.push_str(" world");
    println!("{}", r3);
}</code></pre>
</div>
<h2 id="不可变与可变引用共存">不可变与可变引用共存</h2>
<pre><code class="language-rust">fn main() {
    let mut s = String::from("hello");
    let r1 = &amp;s;
    let r2 = &amp;mut s;
    println!("{} {}", r1, r2);
}</code></pre>
</div>
<h2 id="返回局部变量的引用">返回局部变量的引用</h2>
<pre><code class="language-rust">fn make_greeting() -&gt; &amp;String {
    let s = String::from("hello");
    &amp;s
}</code></pre>
</div>
<h2 id="切片的类型">切片的类型</h2>
<pre><code class="language-rust">fn main() {
    let s = String::from("hello world");
    let word = &amp;s[6..11];
    println!("{}", word);
}</code></pre>
</div>
<h2 id="str-还是-string">&amp;str 还是 &amp;String</h2>
</div>
<h1 id="编程练习">编程练习</h1>
<h2 id="练习-1修复所有权错误">练习 1：修复所有权错误</h2>
<p>下面的函数在打印名字后，<code>main</code> 中无法再使用 <code>name</code>。请修改函数签名（及调用方式），让 <code>main</code> 在调用后仍能使用 <code>name</code>：</p>
<div class="code-editor" data-block-id="03-ownership/05-practice#2:0" data-expect-mode="literal" data-expect-pattern="Hello%2C%20Alice!%0ANice%20to%20meet%20you%2C%20Alice!" data-starter-code="fn%20greet(name%3A%20String)%20%7B%0A%20%20%20%20println!(%22Hello%2C%20%7B%7D!%22%2C%20name)%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20name%20%3D%20String%3A%3Afrom(%22Alice%22)%3B%0A%20%20%20%20greet(name)%3B%0A%20%20%20%20println!(%22Nice%20to%20meet%20you%2C%20%7B%7D!%22%2C%20name)%3B%20%2F%2F%20%E7%9B%AE%E5%89%8D%E8%BF%99%E8%A1%8C%E4%BC%9A%E6%8A%A5%E9%94%99%0A%7D"><pre><code class="language-rust">fn greet(name: String) {
    println!("Hello, {}!", name);
}

fn main() {
    let name = String::from("Alice");
    greet(name);
    println!("Nice to meet you, {}!", name); // 目前这行会报错
}</code></pre></div>
<h2 id="练习-2修复借用冲突">练习 2：修复借用冲突</h2>
<p>下面的代码在持有不可变引用时尝试修改字符串，导致编译错误。请在<strong>不删除任何 <code>println!</code></strong> 的前提下，仅调整代码顺序使其通过编译：</p>
<div class="code-editor" data-block-id="03-ownership/05-practice#2:1" data-expect-mode="literal" data-expect-pattern="first%20snapshot%3A%20hello%0Afull%20sentence%3A%20hello%20world" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20sentence%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%0A%20%20%20%20let%20first%20%3D%20%26sentence%3B%0A%20%20%20%20sentence.push_str(%22%20world%22)%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E5%AD%98%E5%9C%A8%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%E6%97%B6%E4%B8%8D%E8%83%BD%E4%BF%AE%E6%94%B9%0A%0A%20%20%20%20println!(%22first%20snapshot%3A%20%7B%7D%22%2C%20first)%3B%0A%20%20%20%20println!(%22full%20sentence%3A%20%7B%7D%22%2C%20sentence)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    let mut sentence = String::from("hello");

    let first = &amp;sentence;
    sentence.push_str(" world"); // 错误：存在不可变引用时不能修改

    println!("first snapshot: {}", first);
    println!("full sentence: {}", sentence);
}</code></pre></div>
<h2 id="练习-3实现字符计数函数">练习 3：实现字符计数函数</h2>
<p>请实现 <code>count_char</code> 函数，统计字符串中某个字符出现的次数：</p>
<div class="code-editor" data-block-id="03-ownership/05-practice#2:2" data-expect-mode="literal" data-expect-pattern="3%0A3%0A2" data-starter-code="fn%20count_char(s%3A%20%26str%2C%20target%3A%20char)%20-%3E%20usize%20%7B%0A%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E9%81%8D%E5%8E%86%20s%20%E4%B8%AD%E7%9A%84%E6%AF%8F%E4%B8%AA%E5%AD%97%E7%AC%A6%EF%BC%8C%E7%BB%9F%E8%AE%A1%E4%B8%8E%20target%20%E7%9B%B8%E7%AD%89%E7%9A%84%E4%B8%AA%E6%95%B0%0A%20%20%20%200%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20count_char(%22hello%20world%22%2C%20'l'))%3B%20%2F%2F%203%0A%20%20%20%20println!(%22%7B%7D%22%2C%20count_char(%22rust%20programming%22%2C%20'r'))%3B%20%2F%2F%203%0A%20%20%20%20println!(%22%7B%7D%22%2C%20count_char(%22abcabc%22%2C%20'a'))%3B%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%202%0A%7D"><pre><code class="language-rust">fn count_char(s: &amp;str, target: char) -&gt; usize {
    // TODO：遍历 s 中的每个字符，统计与 target 相等的个数
    0
}

fn main() {
    println!("{}", count_char("hello world", 'l')); // 3
    println!("{}", count_char("rust programming", 'r')); // 3
    println!("{}", count_char("abcabc", 'a'));            // 2
}</code></pre></div>
<h2 id="练习-4修复可变引用错误">练习 4：修复可变引用错误</h2>
<p>下面的函数想通过引用将数值加一，但使用了不可变引用。请修复函数签名和调用处，使程序正确输出：</p>
<div class="code-editor" data-block-id="03-ownership/05-practice#2:3" data-expect-mode="literal" data-expect-pattern="count%20%3D%203" data-starter-code="fn%20add_one(n%3A%20%26i32)%20%7B%0A%20%20%20%20*n%20%2B%3D%201%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E4%B8%8D%E8%83%BD%E9%80%9A%E8%BF%87%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%E4%BF%AE%E6%94%B9%E5%80%BC%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20count%20%3D%200%3B%0A%20%20%20%20add_one(%26count)%3B%0A%20%20%20%20add_one(%26count)%3B%0A%20%20%20%20add_one(%26count)%3B%0A%20%20%20%20println!(%22count%20%3D%20%7B%7D%22%2C%20count)%3B%0A%7D"><pre><code class="language-rust">fn add_one(n: &amp;i32) {
    *n += 1; // 错误：不能通过不可变引用修改值
}

fn main() {
    let mut count = 0;
    add_one(&amp;count);
    add_one(&amp;count);
    add_one(&amp;count);
    println!("count = {}", count);
}</code></pre></div>
<h2 id="练习-5实现切片最大值函数">练习 5：实现切片最大值函数</h2>
<p>请实现 <code>max_in_slice</code> 函数，返回整数切片中的最大值。函数应接受任意长度的切片（完整数组或其中一段）：</p>
<div class="code-editor" data-block-id="03-ownership/05-practice#2:4" data-expect-mode="literal" data-expect-pattern="9%0A4%0A9" data-starter-code="fn%20max_in_slice(numbers%3A%20%26%5Bi32%5D)%20-%3E%20i32%20%7B%0A%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E6%89%BE%E5%87%BA%E5%88%87%E7%89%87%E4%B8%AD%E7%9A%84%E6%9C%80%E5%A4%A7%E5%80%BC%E5%B9%B6%E8%BF%94%E5%9B%9E%0A%20%20%20%20%2F%2F%20%E6%8F%90%E7%A4%BA%EF%BC%9A%E5%8F%AF%E4%BB%A5%E5%85%88%E5%81%87%E8%AE%BE%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%E6%98%AF%E6%9C%80%E5%A4%A7%E5%80%BC%EF%BC%8C%E7%84%B6%E5%90%8E%E9%80%90%E4%B8%AA%E6%AF%94%E8%BE%83%0A%20%20%20%200%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20arr%20%3D%20%5B3%2C%201%2C%204%2C%201%2C%205%2C%209%2C%202%2C%206%5D%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20max_in_slice(%26arr))%3B%20%20%20%20%20%20%20%20%2F%2F%209%0A%20%20%20%20println!(%22%7B%7D%22%2C%20max_in_slice(%26arr%5B..4%5D))%3B%20%20%20%2F%2F%204%0A%20%20%20%20println!(%22%7B%7D%22%2C%20max_in_slice(%26arr%5B4..%5D))%3B%20%20%20%2F%2F%209%0A%7D"><pre><code class="language-rust">fn max_in_slice(numbers: &amp;[i32]) -&gt; i32 {
    // TODO：找出切片中的最大值并返回
    // 提示：可以先假设第一个元素是最大值，然后逐个比较
    0
}

fn main() {
    let arr = [3, 1, 4, 1, 5, 9, 2, 6];
    println!("{}", max_in_slice(&amp;arr));        // 9
    println!("{}", max_in_slice(&amp;arr[..4]));   // 4
    println!("{}", max_in_slice(&amp;arr[4..]));   // 9
}</code></pre></div> 