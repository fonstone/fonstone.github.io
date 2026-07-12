---
title: "? 运算符"
description: "错误处理 - ? 运算符"
date: "2026-07-12"
order: 9003
tags: ["? 运算符", "错误传播", "From", "Option", "Result", "错误处理"]
est_time: "20 分钟"
---

 <h1 id="-运算符">? 运算符</h1>
<h2 id="问题传播错误太繁琐">问题：传播错误太繁琐</h2>
<p>上一篇末尾，我们写了一个从文件读取用户名的函数：</p>
<pre><code class="language-rust">fn read_username() -&gt; Result&lt;String, io::Error&gt; {
    let f = File::open("username.txt");

    let mut file = match f {
        Ok(file) =&gt; file,
        Err(e) =&gt; return Err(e),  // 打开失败 → 立即返回 Err
    };

    let mut name = String::new();

    match file.read_to_string(&amp;mut name) {
        Ok(_) =&gt; Ok(name),
        Err(e) =&gt; Err(e),
    }
}</code></pre>
<p>函数里每个可能失败的操作都要写一遍 <code>match ... return Err(e)</code>。当一个函数里有三四个这样的操作时，代码会充斥着重复的样板。</p>
<p><code>?</code> 运算符就是为了解决这个问题而生的。</p>
<h2 id="-的作用">? 的作用</h2>
<p>在一个返回 <code>Result</code> 的表达式后面加 <code>?</code>，效果等价于：</p>
<ul>
<li>如果是 <code>Ok(value)</code> → 解出 <code>value</code>，继续执行</li>
<li>如果是 <code>Err(e)</code> → <strong>立即从当前函数返回 <code>Err(e)</code></strong></li>
</ul>
<p>用 <code>?</code> 改写上面的函数：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Aio%3B%0Ause%20std%3A%3Aio%3A%3ARead%3B%0Ause%20std%3A%3Afs%3A%3AFile%3B%0A%0Afn%20read_username()%20-%3E%20Result%3CString%2C%20io%3A%3AError%3E%20%7B%0A%20%20%20%20let%20mut%20file%20%3D%20File%3A%3Aopen(%22username.txt%22)%3F%3B%20%20%2F%2F%20%E5%A4%B1%E8%B4%A5%E5%B0%B1%E7%AB%8B%E5%88%BB%E8%BF%94%E5%9B%9E%20Err%0A%20%20%20%20let%20mut%20name%20%3D%20String%3A%3Anew()%3B%0A%20%20%20%20file.read_to_string(%26mut%20name)%3F%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%A4%B1%E8%B4%A5%E5%B0%B1%E7%AB%8B%E5%88%BB%E8%BF%94%E5%9B%9E%20Err%0A%20%20%20%20Ok(name)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20match%20read_username()%20%7B%0A%20%20%20%20%20%20%20%20Ok(name)%20%3D%3E%20println!(%22%E7%94%A8%E6%88%B7%E5%90%8D%EF%BC%9A%7B%7D%22%2C%20name)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%20%20%3D%3E%20println!(%22%E8%AF%BB%E5%8F%96%E5%A4%B1%E8%B4%A5%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::io;
use std::io::Read;
use std::fs::File;

fn read_username() -&gt; Result&lt;String, io::Error&gt; {
    let mut file = File::open("username.txt")?;  // 失败就立刻返回 Err
    let mut name = String::new();
    file.read_to_string(&amp;mut name)?;             // 失败就立刻返回 Err
    Ok(name)
}

fn main() {
    match read_username() {
        Ok(name) =&gt; println!("用户名：{}", name),
        Err(e)   =&gt; println!("读取失败：{}", e),
    }
}</code></pre></div>
<p>对比前一个版本，代码量减少了一半，逻辑却更清晰——每行代码在说”做这件事，失败就停下来”。</p>
<p>还可以进一步用<strong>链式调用</strong>写得更短：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Aio%3B%0Ause%20std%3A%3Aio%3A%3ARead%3B%0Ause%20std%3A%3Afs%3A%3AFile%3B%0A%0Afn%20read_username()%20-%3E%20Result%3CString%2C%20io%3A%3AError%3E%20%7B%0A%20%20%20%20let%20mut%20name%20%3D%20String%3A%3Anew()%3B%0A%20%20%20%20File%3A%3Aopen(%22username.txt%22)%3F.read_to_string(%26mut%20name)%3F%3B%0A%20%20%20%20Ok(name)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20match%20read_username()%20%7B%0A%20%20%20%20%20%20%20%20Ok(name)%20%3D%3E%20println!(%22%E7%94%A8%E6%88%B7%E5%90%8D%EF%BC%9A%7B%7D%22%2C%20name)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%20%20%3D%3E%20println!(%22%E8%AF%BB%E5%8F%96%E5%A4%B1%E8%B4%A5%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::io;
use std::io::Read;
use std::fs::File;

fn read_username() -&gt; Result&lt;String, io::Error&gt; {
    let mut name = String::new();
    File::open("username.txt")?.read_to_string(&amp;mut name)?;
    Ok(name)
}

fn main() {
    match read_username() {
        Ok(name) =&gt; println!("用户名：{}", name),
        Err(e)   =&gt; println!("读取失败：{}", e),
    }
}</code></pre></div>
<h2 id="-背后的自动类型转换">? 背后的自动类型转换</h2>
<p><code>?</code> 和手写 <code>match ... return Err(e)</code> 有一点细微差别：<strong><code>?</code> 会在返回错误之前自动做类型转换</strong>。</p>
<p>具体来说，<code>?</code> 内部会调用标准库的 <code>From</code> trait（<code>From::from(e)</code>），把当前错误转换成函数声明的返回错误类型。只要两种错误类型之间实现了 <code>From</code> 转换关系，<code>?</code> 就会自动完成，不需要手动处理。</p>
<blockquote>
<p><strong><code>From</code> trait 暂时了解即可</strong>：<code>From</code> 是 Rust 的标准类型转换 trait，后面讲 trait 时会详细介绍。这里只需要知道：<code>?</code> 不仅仅是提早返回，它还帮你做了错误类型的自动转换。</p>
</blockquote>
<h2 id="-也能用于-option">? 也能用于 Option</h2>
<p><code>?</code> 不只能用于 <code>Result</code>，也可以用于 <code>Option&lt;T&gt;</code>：</p>
<ul>
<li><code>Some(value)</code> → 解出 <code>value</code>，继续执行</li>
<li><code>None</code> → 立即从当前函数返回 <code>None</code></li>
</ul>
<div class="code-runner" data-full-code="fn%20first_char(s%3A%20%26str)%20-%3E%20Option%3Cchar%3E%20%7B%0A%20%20%20%20let%20first%20%3D%20s.chars().next()%3F%3B%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E5%AD%97%E7%AC%A6%E4%B8%B2%E4%B8%BA%E7%A9%BA%EF%BC%8C%E7%AB%8B%E5%88%BB%E8%BF%94%E5%9B%9E%20None%0A%20%20%20%20Some(first)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20first_char(%22hello%22))%3B%20%20%2F%2F%20Some('h')%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20first_char(%22%22))%3B%20%20%20%20%20%20%20%2F%2F%20None%0A%7D" data-mode="run"><pre><code class="language-rust">fn first_char(s: &amp;str) -&gt; Option&lt;char&gt; {
    let first = s.chars().next()?;  // 如果字符串为空，立刻返回 None
    Some(first)
}

fn main() {
    println!("{:?}", first_char("hello"));  // Some('h')
    println!("{:?}", first_char(""));       // None
}</code></pre></div>
<blockquote>
<p><strong>注意</strong>：<code>?</code> 用于 <code>Option</code> 时，函数返回类型必须是 <code>Option</code>；<code>?</code> 用于 <code>Result</code> 时，函数返回类型必须是 <code>Result</code>。两者不能混用。</p>
</blockquote>
<h2 id="-的使用限制函数返回类型">? 的使用限制：函数返回类型</h2>
<p><code>?</code> 只能在返回 <code>Result</code> 或 <code>Option</code> 的函数中使用。如果在 <code>main</code> 函数里直接用 <code>?</code>（<code>main</code> 默认返回 <code>()</code>），会编译报错：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Afs%3A%3AFile%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20f%20%3D%20File%3A%3Aopen(%22hello.txt%22)%3F%3B%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9Amain%20%E8%BF%94%E5%9B%9E%20()%EF%BC%8C%E4%B8%8D%E6%98%AF%20Result%0A%7D" data-mode="expect-error"><pre><code class="language-rust">use std::fs::File;

fn main() {
    let f = File::open("hello.txt")?;  // 错误：main 返回 ()，不是 Result
}</code></pre></div>
<p>编译器会说：<code>?</code> 只能在返回 <code>Result</code> 或 <code>Option</code> 的函数里使用。</p>
<p><strong>解决方法</strong>：让 <code>main</code> 返回 <code>Result</code>。</p>
<div class="code-runner" data-full-code="use%20std%3A%3Aerror%3A%3AError%3B%0Ause%20std%3A%3Afs%3A%3AFile%3B%0A%0Afn%20main()%20-%3E%20Result%3C()%2C%20Box%3Cdyn%20Error%3E%3E%20%7B%0A%20%20%20%20let%20f%20%3D%20File%3A%3Aopen(%22hello.txt%22)%3F%3B%0A%20%20%20%20println!(%22%E6%96%87%E4%BB%B6%E6%89%93%E5%BC%80%E6%88%90%E5%8A%9F%EF%BC%9A%7B%3A%3F%7D%22%2C%20f)%3B%0A%20%20%20%20Ok(())%0A%7D" data-mode="run"><pre><code class="language-rust">use std::error::Error;
use std::fs::File;

fn main() -&gt; Result&lt;(), Box&lt;dyn Error&gt;&gt; {
    let f = File::open("hello.txt")?;
    println!("文件打开成功：{:?}", f);
    Ok(())
}</code></pre></div>
<p><code>Box&lt;dyn Error&gt;</code> 是一个能装下<strong>任意错误类型</strong>的容器（详细原理在 trait 章节讲解），让 <code>main</code> 函数可以方便地使用 <code>?</code> 来处理各种错误。</p>
<blockquote>
<p><strong>程序退出码</strong>：当 <code>main</code> 返回 <code>Ok(())</code> 时，程序退出码是 0（成功）；返回 <code>Err</code> 时，Rust 会打印错误信息并以非零退出码退出。</p>
</blockquote>
<h3 id="在文档测试中使用">在文档测试中使用 ?</h3>
<p>上一章讲文档注释时提到，文档代码块默认没有 <code>main()</code> 函数，也没有返回类型，不能直接用 <code>?</code>。</p>
<p><strong>为什么不能用？</strong> <code>?</code> 需要当前函数返回 <code>Result</code> 或 <code>Option</code>，而文档测试的代码块隐式地跑在一个返回 <code>()</code> 的匿名函数里，就像这样：</p>
<pre><code class="language-rust">// 文档测试实际上被包成这样：
fn doctest_wrapper() {
    let n: i32 = "42".parse()?;  // ❌ 编译错误：() 不支持 ?
    assert_eq!(n, 42);
}</code></pre>
<p><strong>解决办法</strong>：用 <code>#</code> 隐藏行，手动包裹一个返回 <code>Result</code> 的函数，让 <code>?</code> 有合法的上下文：</p>
<pre><code class="language-markdown">/// # Examples
///
/// ```rust
/// # use std::error::Error;
/// # fn run() -&gt; Result&lt;(), Box&lt;dyn Error&gt;&gt; {  // ← 隐藏：提供返回 Result 的函数
/// let n: i32 = "42".parse()?;  // ← 读者能看到这行
/// assert_eq!(n, 42);           // ← 读者能看到这行
/// # Ok(())                     // ← 隐藏：函数需要返回 Ok
/// # }                          // ← 隐藏：关闭函数
/// # run().unwrap();             // ← 隐藏：实际调用这个函数
/// ```</code></pre>
<p><strong>读者看到的文档</strong>只有两行核心代码：</p>
<pre><code class="language-rust">let n: i32 = "42".parse()?;
assert_eq!(n, 42);</code></pre>
<p><strong><code>cargo test</code> 实际运行的代码</strong>包含了全部（隐藏行也在）：</p>
<pre><code class="language-rust">use std::error::Error;
fn run() -&gt; Result&lt;(), Box&lt;dyn Error&gt;&gt; {
    let n: i32 = "42".parse()?;
    assert_eq!(n, 42);
    Ok(())
}
run().unwrap();</code></pre>
<p>这样文档简洁，测试也能正常运行。</p>
<h1 id="练习题">练习题</h1>
<h2 id="-运算符测验">? 运算符测验</h2>
<pre><code class="language-rust">use std::num::ParseIntError;

fn double_number(s: &amp;str) -&gt; Result&lt;i32, ParseIntError&gt; {
    let n = s.parse::&lt;i32&gt;()?;
    Ok(n * 2)
}</code></pre>
</div>
</div>
</div>
</div> 