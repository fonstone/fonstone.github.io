---
title: "Result<T, E>"
description: "错误处理 - Result<T, E>"
date: "2026-07-12"
order: 9002
tags: ["Result", "Ok", "Err", "unwrap", "expect", "错误处理", "match", "错误传播"]
est_time: "20 分钟"
---

 <h1 id="resultt-e">Result&lt;T, E&gt;</h1>
<h2 id="为什么需要-result">为什么需要 Result</h2>
<p>上一篇讲了 <code>panic!</code>，用于”不应该发生”的错误。但现实中大多数错误都是<strong>可以预料的、可以处理的</strong>：</p>
<ul>
<li>尝试打开一个文件 → 文件可能不存在</li>
<li>尝试解析一个字符串为数字 → 字符串可能不是合法的数字</li>
<li>发起网络请求 → 服务器可能临时不可用</li>
</ul>
<p>这些情况不是 bug，是正常的程序运行中随时可能发生的事情。对这类错误调用 <code>panic!</code> 并让程序崩溃，显然不合适。</p>
<p>Rust 的解决方案是 <strong><code>Result&lt;T, E&gt;</code> 枚举</strong>：让可能失败的函数在返回值里<strong>明确表达”成功”或”失败”</strong>，让调用者决定如何处理。</p>
<h2 id="result-是什么">Result 是什么</h2>
<p>你之前学过 <code>Option&lt;T&gt;</code>——它表达”值可能不存在”：</p>
<pre><code class="language-rust">enum Option&lt;T&gt; {
    Some(T),  // 有值
    None,     // 没有值
}</code></pre>
<p><code>Result&lt;T, E&gt;</code> 是类似的概念，但表达的是”操作可能失败”：</p>
<pre><code class="language-rust">enum Result&lt;T, E&gt; {
    Ok(T),   // 成功，携带结果值
    Err(E),  // 失败，携带错误信息
}</code></pre>
<p><code>T</code> 是成功时的值的类型，<code>E</code> 是失败时的错误类型。比如 <code>File::open</code> 的返回类型是 <code>Result&lt;File, io::Error&gt;</code>——成功返回文件句柄，失败返回 IO 错误。</p>
<blockquote>
<p><strong>如何知道一个函数返回什么类型？</strong> 看文档，或者直接问编译器。把返回值赋给一个错误类型的变量，编译器会在报错信息里告诉你正确的类型。</p>
</blockquote>
<h2 id="用-match-处理-result">用 match 处理 Result</h2>
<p><code>Result</code> 和 <code>Option</code> 一样，需要用 <code>match</code> 明确处理两种情况。下面是打开文件的例子：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Afs%3A%3AFile%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20result%20%3D%20File%3A%3Aopen(%22hello.txt%22)%3B%0A%0A%20%20%20%20match%20result%20%7B%0A%20%20%20%20%20%20%20%20Ok(file)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E6%96%87%E4%BB%B6%E6%89%93%E5%BC%80%E6%88%90%E5%8A%9F%EF%BC%81%E5%8F%A5%E6%9F%84%EF%BC%9A%7B%3A%3F%7D%22%2C%20file)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20Err(error)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E6%89%93%E5%BC%80%E6%96%87%E4%BB%B6%E5%A4%B1%E8%B4%A5%EF%BC%8C%E5%8E%9F%E5%9B%A0%EF%BC%9A%7B%7D%22%2C%20error)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E8%BF%99%E9%87%8C%E5%8F%AF%E4%BB%A5%E5%81%9A%E6%81%A2%E5%A4%8D%E5%A4%84%E7%90%86%EF%BC%8C%E6%AF%94%E5%A6%82%E5%88%9B%E5%BB%BA%E6%96%87%E4%BB%B6%E3%80%81%E4%BD%BF%E7%94%A8%E9%BB%98%E8%AE%A4%E5%80%BC%E3%80%81%E6%8F%90%E7%A4%BA%E7%94%A8%E6%88%B7%E7%AD%89%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fs::File;

fn main() {
    let result = File::open("hello.txt");

    match result {
        Ok(file) =&gt; {
            println!("文件打开成功！句柄：{:?}", file);
        }
        Err(error) =&gt; {
            println!("打开文件失败，原因：{}", error);
            // 这里可以做恢复处理，比如创建文件、使用默认值、提示用户等
        }
    }
}</code></pre></div>
<p>这里 <code>File::open("hello.txt")</code> 返回 <code>Result&lt;File, io::Error&gt;</code>。<code>match</code> 分别处理了 <code>Ok</code> 和 <code>Err</code> 两种情况——失败时打印错误信息并继续，而不是让程序崩溃。</p>
<h3 id="匹配不同类型的错误">匹配不同类型的错误</h3>
<p>有时候同一个操作可能因为不同原因失败，我们想对不同原因做不同处理。<code>io::Error</code> 有一个 <code>kind()</code> 方法可以获取错误类型：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Afs%3A%3AFile%3B%0Ause%20std%3A%3Aio%3A%3AErrorKind%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20f%20%3D%20File%3A%3Aopen(%22hello.txt%22)%3B%0A%0A%20%20%20%20let%20file%20%3D%20match%20f%20%7B%0A%20%20%20%20%20%20%20%20Ok(file)%20%3D%3E%20file%2C%0A%20%20%20%20%20%20%20%20Err(error)%20%3D%3E%20match%20error.kind()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E6%96%87%E4%BB%B6%E4%B8%8D%E5%AD%98%E5%9C%A8%20%E2%86%92%20%E5%88%9B%E5%BB%BA%E5%AE%83%0A%20%20%20%20%20%20%20%20%20%20%20%20ErrorKind%3A%3ANotFound%20%3D%3E%20match%20File%3A%3Acreate(%22hello.txt%22)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20Ok(new_file)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E6%96%87%E4%BB%B6%E4%B8%8D%E5%AD%98%E5%9C%A8%EF%BC%8C%E5%B7%B2%E5%88%9B%E5%BB%BA%E6%96%B0%E6%96%87%E4%BB%B6%22)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20new_file%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20panic!(%22%E5%88%9B%E5%BB%BA%E6%96%87%E4%BB%B6%E5%A4%B1%E8%B4%A5%EF%BC%9A%7B%3A%3F%7D%22%2C%20e)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%85%B6%E4%BB%96%E9%94%99%E8%AF%AF%20%E2%86%92%20%E7%9B%B4%E6%8E%A5%20panic%0A%20%20%20%20%20%20%20%20%20%20%20%20other%20%3D%3E%20panic!(%22%E6%89%93%E5%BC%80%E6%96%87%E4%BB%B6%E6%97%B6%E9%81%87%E5%88%B0%E5%85%B6%E4%BB%96%E9%94%99%E8%AF%AF%EF%BC%9A%7B%3A%3F%7D%22%2C%20other)%2C%0A%20%20%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20println!(%22%E5%BE%97%E5%88%B0%E4%BA%86%E6%96%87%E4%BB%B6%E5%8F%A5%E6%9F%84%EF%BC%9A%7B%3A%3F%7D%22%2C%20file)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt");

    let file = match f {
        Ok(file) =&gt; file,
        Err(error) =&gt; match error.kind() {
            // 文件不存在 → 创建它
            ErrorKind::NotFound =&gt; match File::create("hello.txt") {
                Ok(new_file) =&gt; {
                    println!("文件不存在，已创建新文件");
                    new_file
                }
                Err(e) =&gt; panic!("创建文件失败：{:?}", e),
            },
            // 其他错误 → 直接 panic
            other =&gt; panic!("打开文件时遇到其他错误：{:?}", other),
        },
    };

    println!("得到了文件句柄：{:?}", file);
}</code></pre></div>
<p>这里有三层 <code>match</code> 嵌套。虽然完整，但看起来有点繁重。</p>
<h2 id="unwrap-和-expect快捷但有代价">unwrap 和 expect：快捷但有代价</h2>
<p><code>Result</code> 有两个便捷方法，让你不用每次都写 <code>match</code>：</p>
<p><strong><code>unwrap()</code></strong>：如果是 <code>Ok</code>，返回值；如果是 <code>Err</code>，直接 panic。</p>
<div class="code-runner" data-full-code="use%20std%3A%3Afs%3A%3AFile%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E6%96%87%E4%BB%B6%E4%B8%8D%E5%AD%98%E5%9C%A8%EF%BC%8C%E8%BF%99%E9%87%8C%E4%BC%9A%20panic%0A%20%20%20%20let%20f%20%3D%20File%3A%3Aopen(%22hello.txt%22).unwrap()%3B%0A%20%20%20%20println!(%22%E6%96%87%E4%BB%B6%E5%8F%A5%E6%9F%84%EF%BC%9A%7B%3A%3F%7D%22%2C%20f)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fs::File;

fn main() {
    // 如果文件不存在，这里会 panic
    let f = File::open("hello.txt").unwrap();
    println!("文件句柄：{:?}", f);
}</code></pre></div>
<p><strong><code>expect("消息")</code></strong>：和 <code>unwrap</code> 一样，但 panic 时显示你提供的消息，更容易调试：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Afs%3A%3AFile%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20f%20%3D%20File%3A%3Aopen(%22hello.txt%22)%0A%20%20%20%20%20%20%20%20.expect(%22%E6%97%A0%E6%B3%95%E6%89%93%E5%BC%80%20hello.txt%EF%BC%8C%E8%AF%B7%E6%A3%80%E6%9F%A5%E6%96%87%E4%BB%B6%E6%98%AF%E5%90%A6%E5%AD%98%E5%9C%A8%22)%3B%0A%20%20%20%20println!(%22%E6%96%87%E4%BB%B6%E5%8F%A5%E6%9F%84%EF%BC%9A%7B%3A%3F%7D%22%2C%20f)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fs::File;

fn main() {
    let f = File::open("hello.txt")
        .expect("无法打开 hello.txt，请检查文件是否存在");
    println!("文件句柄：{:?}", f);
}</code></pre></div>
<p><strong>什么时候用 unwrap/expect？</strong></p>
<ul>
<li><strong>适合用</strong>：写原型、写示例、写测试代码时。此时你更关心逻辑本身，不想被错误处理分散注意力。</li>
<li><strong>不适合用</strong>：生产代码中，尤其是有可能失败的操作。一旦失败就 panic，用户体验很差。</li>
</ul>
<blockquote>
<p><strong>记住</strong>：<code>unwrap</code> 和 <code>expect</code> 本质上是”我相信这里不会失败，如果失败就让程序崩溃”的声明。在代码审查中，看到 <code>unwrap</code> 就意味着这里需要审查：这个假设是否成立？</p>
</blockquote>
<h2 id="向调用者传播错误">向调用者传播错误</h2>
<p>到目前为止，我们要么用 <code>match</code> 处理错误，要么调 <code>panic!</code> 崩溃。但有第三种选择：<strong>把错误向上传播给调用者</strong>。</p>
<p>当前函数没有足够的上下文来决定怎么处理错误时，这很合理——调用者可能比被调用者更清楚应该怎么处理。</p>
<p>下面是一个从文件读取用户名的函数，把错误传播给调用者：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Aio%3B%0Ause%20std%3A%3Aio%3A%3ARead%3B%0Ause%20std%3A%3Afs%3A%3AFile%3B%0A%0Afn%20read_username()%20-%3E%20Result%3CString%2C%20io%3A%3AError%3E%20%7B%0A%20%20%20%20let%20f%20%3D%20File%3A%3Aopen(%22username.txt%22)%3B%0A%0A%20%20%20%20let%20mut%20file%20%3D%20match%20f%20%7B%0A%20%20%20%20%20%20%20%20Ok(file)%20%3D%3E%20file%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20return%20Err(e)%2C%20%20%2F%2F%20%E6%89%93%E5%BC%80%E5%A4%B1%E8%B4%A5%20%E2%86%92%20%E7%AB%8B%E5%8D%B3%E8%BF%94%E5%9B%9E%20Err%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20let%20mut%20name%20%3D%20String%3A%3Anew()%3B%0A%0A%20%20%20%20match%20file.read_to_string(%26mut%20name)%20%7B%0A%20%20%20%20%20%20%20%20Ok(_)%20%3D%3E%20Ok(name)%2C%20%20%20%20%2F%2F%20%E8%AF%BB%E5%8F%96%E6%88%90%E5%8A%9F%20%E2%86%92%20%E8%BF%94%E5%9B%9E%20Ok(%E5%86%85%E5%AE%B9)%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20Err(e)%2C%20%20%20%20%20%2F%2F%20%E8%AF%BB%E5%8F%96%E5%A4%B1%E8%B4%A5%20%E2%86%92%20%E8%BF%94%E5%9B%9E%20Err%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20match%20read_username()%20%7B%0A%20%20%20%20%20%20%20%20Ok(name)%20%3D%3E%20println!(%22%E7%94%A8%E6%88%B7%E5%90%8D%EF%BC%9A%7B%7D%22%2C%20name)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20println!(%22%E8%AF%BB%E5%8F%96%E5%A4%B1%E8%B4%A5%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::io;
use std::io::Read;
use std::fs::File;

fn read_username() -&gt; Result&lt;String, io::Error&gt; {
    let f = File::open("username.txt");

    let mut file = match f {
        Ok(file) =&gt; file,
        Err(e) =&gt; return Err(e),  // 打开失败 → 立即返回 Err
    };

    let mut name = String::new();

    match file.read_to_string(&amp;mut name) {
        Ok(_) =&gt; Ok(name),    // 读取成功 → 返回 Ok(内容)
        Err(e) =&gt; Err(e),     // 读取失败 → 返回 Err
    }
}

fn main() {
    match read_username() {
        Ok(name) =&gt; println!("用户名：{}", name),
        Err(e) =&gt; println!("读取失败：{}", e),
    }
}</code></pre></div>
<p>注意函数返回值类型 <code>Result&lt;String, io::Error&gt;</code>——函数<strong>承诺</strong>调用者：要么给你一个 <code>String</code>，要么给你一个 <code>io::Error</code>，你来决定怎么处理。</p>
<p>这段代码有点冗长：每个可能失败的操作都要写一遍 <code>match</code> 加 <code>return Err</code>。当一个函数里有多个可能失败的操作时，就会有很多这样的样板代码。</p>
<p>Rust 为此提供了一个更简洁的语法：<code>?</code> 运算符。下一篇文章会详细讲它。</p>
<h1 id="练习题">练习题</h1>
<h2 id="result-基础测验">Result 基础测验</h2>
<pre><code class="language-rust">use std::num::ParseIntError;

fn parse_age(s: &amp;str) -&gt; Result&lt;u32, ParseIntError&gt; {
    let n: i32 = s.parse()?;
    if n &lt; 0 {
        panic!("年龄不能为负数");
    }
    Ok(n as u32)
}</code></pre>
</div>
</div>
<pre><code class="language-rust">fn get_value() -&gt; i32 {
    let result: Result&lt;i32, String&gt; = Ok(42);
    result
}</code></pre>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面这个函数直接用 <code>unwrap</code> 处理所有错误。请用 <code>match</code> 改写，使其：</p>
<ul>
<li>解析成功时打印结果</li>
<li>解析失败时打印”输入不是合法数字：&lt;原因&gt;“，<strong>不要让程序崩溃</strong></li>
</ul>
<div class="code-editor" data-block-id="09-error-handling/02-result#1:5" data-expect-mode="literal" data-expect-pattern="42%20%E8%A7%A3%E6%9E%90%E4%B8%BA%2042%0A100%20%E8%A7%A3%E6%9E%90%E4%B8%BA%20100" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20inputs%20%3D%20vec!%5B%2242%22%2C%20%22hello%22%2C%20%22100%22%2C%20%22world%22%5D%3B%0A%0A%20%20%20%20for%20s%20in%20inputs%20%7B%0A%20%20%20%20%20%20%20%20let%20n%3A%20i32%20%3D%20s.parse().unwrap()%3B%20%20%2F%2F%20%E9%81%87%E5%88%B0%20%22hello%22%20%E4%BC%9A%E5%B4%A9%E6%BA%83%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%20%E8%A7%A3%E6%9E%90%E4%B8%BA%20%7B%7D%22%2C%20s%2C%20n)%3B%0A%20%20%20%20%7D%0A%7D"><pre><code class="language-rust">fn main() {
    let inputs = vec!["42", "hello", "100", "world"];

    for s in inputs {
        let n: i32 = s.parse().unwrap();  // 遇到 "hello" 会崩溃
        println!("{} 解析为 {}", s, n);
    }
}</code></pre></div> 