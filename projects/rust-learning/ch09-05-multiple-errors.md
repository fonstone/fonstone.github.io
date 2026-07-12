---
title: "多种错误来源与遍历 Result"
description: "错误处理 - 多种错误来源与遍历 Result"
date: "2026-07-12"
order: 9005
tags: ["Box<dyn Error>", "多种错误", "filter_map", "collect", "partition", "遍历Result"]
est_time: "20 分钟"
---

 <h1 id="多种错误来源">多种错误来源</h1>
<h2 id="遇到了什么问题">遇到了什么问题</h2>
<p>前几篇都用 <code>io::Error</code> 或 <code>ParseIntError</code> 这样的<strong>单一错误类型</strong>。但现实中一个函数经常遇到<strong>多种错误来源</strong>。比如——读取文件并解析里面的数字：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Afs%3B%0Ause%20std%3A%3Anum%3A%3AParseIntError%3B%0A%0Afn%20double_from_file(path%3A%20%26str)%20-%3E%20Result%3Ci32%2C%20%3F%3F%3F%3E%20%7B%0A%20%20%20%20let%20content%20%3D%20fs%3A%3Aread_to_string(path)%3F%3B%20%20%2F%2F%20%E5%8F%AF%E8%83%BD%E6%98%AF%20io%3A%3AError%0A%20%20%20%20let%20n%3A%20i32%20%3D%20content.trim().parse()%3F%3B%20%20%20%20%20%2F%2F%20%E5%8F%AF%E8%83%BD%E6%98%AF%20ParseIntError%0A%20%20%20%20Ok(n%20*%202)%0A%7D" data-mode="expect-error"><pre><code class="language-rust">use std::fs;
use std::num::ParseIntError;

fn double_from_file(path: &amp;str) -&gt; Result&lt;i32, ???&gt; {
    let content = fs::read_to_string(path)?;  // 可能是 io::Error
    let n: i32 = content.trim().parse()?;     // 可能是 ParseIntError
    Ok(n * 2)
}</code></pre></div>
<p>返回类型 <code>Result&lt;i32, ???&gt;</code> 里该填什么？<code>io::Error</code> 和 <code>ParseIntError</code> 是两个不同的类型，<code>?</code> 无法同时返回两种。</p>
<h2 id="boxdyn-error快速解决多种错误">Box&lt;dyn Error&gt;：快速解决多种错误</h2>
<p><code>Box&lt;dyn Error&gt;</code> 是一个能容纳<strong>任意错误类型</strong>的容器。只要某个类型实现了 <code>Error</code> trait，就能被放进来。</p>
<blockquote>
<p><strong>理解 <code>Box&lt;dyn Error&gt;</code></strong>：<code>dyn Error</code> 是”实现了 Error trait 的某种类型”的意思，<code>Box</code> 是把它放在堆上（编译时不知道具体大小）。现阶段只需要知道它是个”通用错误容器”，详细原理在 trait 章节会讲。</p>
</blockquote>
<div class="code-runner" data-full-code="use%20std%3A%3Aerror%3A%3AError%3B%0Ause%20std%3A%3Afs%3B%0A%0Afn%20double_from_file(path%3A%20%26str)%20-%3E%20Result%3Ci32%2C%20Box%3Cdyn%20Error%3E%3E%20%7B%0A%20%20%20%20let%20content%20%3D%20fs%3A%3Aread_to_string(path)%3F%3B%20%20%2F%2F%20io%3A%3AError%20%E8%87%AA%E5%8A%A8%E8%A3%85%E5%85%A5%20Box%0A%20%20%20%20let%20n%3A%20i32%20%3D%20content.trim().parse()%3F%3B%20%20%20%20%20%2F%2F%20ParseIntError%20%E8%87%AA%E5%8A%A8%E8%A3%85%E5%85%A5%20Box%0A%20%20%20%20Ok(n%20*%202)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20match%20double_from_file(%22number.txt%22)%20%7B%0A%20%20%20%20%20%20%20%20Ok(n)%20%20%3D%3E%20println!(%22%E7%BB%93%E6%9E%9C%EF%BC%9A%7B%7D%22%2C%20n)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20println!(%22%E9%94%99%E8%AF%AF%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::error::Error;
use std::fs;

fn double_from_file(path: &amp;str) -&gt; Result&lt;i32, Box&lt;dyn Error&gt;&gt; {
    let content = fs::read_to_string(path)?;  // io::Error 自动装入 Box
    let n: i32 = content.trim().parse()?;     // ParseIntError 自动装入 Box
    Ok(n * 2)
}

fn main() {
    match double_from_file("number.txt") {
        Ok(n)  =&gt; println!("结果：{}", n),
        Err(e) =&gt; println!("错误：{}", e),
    }
}</code></pre></div>
<p><code>?</code> 会自动把 <code>io::Error</code> 和 <code>ParseIntError</code> 都转换成 <code>Box&lt;dyn Error&gt;</code>，不需要手动处理。</p>
<p><strong>优点</strong>：代码极简，几乎不需要额外写任何东西。</p>
<p><strong>缺点</strong>：调用者拿到的是一个”盒子”，无法直接判断里面是哪种错误、做精确处理（比如区分”文件不存在”和”格式不对”）。</p>
<blockquote>
<p><code>Box&lt;dyn Error&gt;</code> 适合：应用程序的 <code>main</code> 函数、脚本、快速原型。<strong>不适合</strong>：需要让调用者精确匹配错误类型的库。</p>
</blockquote>
<h2 id="需要精确错误类型时怎么办">需要精确错误类型时怎么办</h2>
<p>对外暴露 API 的库，往往需要让调用者能精确 <code>match</code> 不同的错误情况。这时候要<strong>定义自己的错误枚举</strong>，并实现三个 trait：</p>
<table><thead><tr><th>Trait</th><th>为什么需要</th></tr></thead><tbody><tr><td><code>Display</code></td><td>控制 <code>{}</code> 打印的内容，即面向用户的错误描述</td></tr><tr><td><code>Error</code></td><td>把你的类型标记为”合法的错误类型”，<code>?</code> 和标准库才认识它</td></tr><tr><td><code>From&lt;底层错误&gt;</code></td><td>让 <code>?</code> 遇到 <code>io::Error</code> 时自动转成你的类型，不用手动 <code>map_err</code></td></tr></tbody></table>
<p>最简单的例子：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Afmt%3B%0A%0A%23%5Bderive(Debug)%5D%0Aenum%20AppError%20%7B%0A%20%20%20%20Io(std%3A%3Aio%3A%3AError)%2C%0A%20%20%20%20Parse(std%3A%3Anum%3A%3AParseIntError)%2C%0A%7D%0A%0Aimpl%20fmt%3A%3ADisplay%20for%20AppError%20%7B%0A%20%20%20%20fn%20fmt(%26self%2C%20f%3A%20%26mut%20fmt%3A%3AFormatter)%20-%3E%20fmt%3A%3AResult%20%7B%0A%20%20%20%20%20%20%20%20match%20self%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20AppError%3A%3AIo(e)%20%20%20%20%3D%3E%20write!(f%2C%20%22%E6%96%87%E4%BB%B6%E9%94%99%E8%AF%AF%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20AppError%3A%3AParse(e)%20%3D%3E%20write!(f%2C%20%22%E8%A7%A3%E6%9E%90%E9%94%99%E8%AF%AF%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Aimpl%20std%3A%3Aerror%3A%3AError%20for%20AppError%20%7B%7D%0A%0Aimpl%20From%3Cstd%3A%3Aio%3A%3AError%3E%20for%20AppError%20%7B%0A%20%20%20%20fn%20from(e%3A%20std%3A%3Aio%3A%3AError)%20-%3E%20Self%20%7B%20AppError%3A%3AIo(e)%20%7D%0A%7D%0Aimpl%20From%3Cstd%3A%3Anum%3A%3AParseIntError%3E%20for%20AppError%20%7B%0A%20%20%20%20fn%20from(e%3A%20std%3A%3Anum%3A%3AParseIntError)%20-%3E%20Self%20%7B%20AppError%3A%3AParse(e)%20%7D%0A%7D%0A%0Afn%20double_from_file(path%3A%20%26str)%20-%3E%20Result%3Ci32%2C%20AppError%3E%20%7B%0A%20%20%20%20let%20content%20%3D%20std%3A%3Afs%3A%3Aread_to_string(path)%3F%3B%20%2F%2F%20io%3A%3AError%20%E8%87%AA%E5%8A%A8%E8%BD%AC%20AppError%3A%3AIo%0A%20%20%20%20let%20n%3A%20i32%20%3D%20content.trim().parse()%3F%3B%20%20%20%20%20%20%20%20%20%20%2F%2F%20ParseIntError%20%E8%87%AA%E5%8A%A8%E8%BD%AC%20AppError%3A%3AParse%0A%20%20%20%20Ok(n%20*%202)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20match%20double_from_file(%22number.txt%22)%20%7B%0A%20%20%20%20%20%20%20%20Ok(n)%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3D%3E%20println!(%22%E7%BB%93%E6%9E%9C%EF%BC%9A%7B%7D%22%2C%20n)%2C%0A%20%20%20%20%20%20%20%20Err(AppError%3A%3AIo(e))%20%20%20%20%3D%3E%20println!(%22%E6%96%87%E4%BB%B6%E9%97%AE%E9%A2%98%EF%BC%8C%E5%8F%AF%E9%87%8D%E8%AF%95%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%20%20%20%20Err(AppError%3A%3AParse(e))%20%3D%3E%20println!(%22%E5%86%85%E5%AE%B9%E6%A0%BC%E5%BC%8F%E9%94%99%E8%AF%AF%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fmt;

#[derive(Debug)]
enum AppError {
    Io(std::io::Error),
    Parse(std::num::ParseIntError),
}

impl fmt::Display for AppError {
    fn fmt(&amp;self, f: &amp;mut fmt::Formatter) -&gt; fmt::Result {
        match self {
            AppError::Io(e)    =&gt; write!(f, "文件错误：{}", e),
            AppError::Parse(e) =&gt; write!(f, "解析错误：{}", e),
        }
    }
}

impl std::error::Error for AppError {}

impl From&lt;std::io::Error&gt; for AppError {
    fn from(e: std::io::Error) -&gt; Self { AppError::Io(e) }
}
impl From&lt;std::num::ParseIntError&gt; for AppError {
    fn from(e: std::num::ParseIntError) -&gt; Self { AppError::Parse(e) }
}

fn double_from_file(path: &amp;str) -&gt; Result&lt;i32, AppError&gt; {
    let content = std::fs::read_to_string(path)?; // io::Error 自动转 AppError::Io
    let n: i32 = content.trim().parse()?;          // ParseIntError 自动转 AppError::Parse
    Ok(n * 2)
}

fn main() {
    match double_from_file("number.txt") {
        Ok(n)               =&gt; println!("结果：{}", n),
        Err(AppError::Io(e))    =&gt; println!("文件问题，可重试：{}", e),
        Err(AppError::Parse(e)) =&gt; println!("内容格式错误：{}", e),
    }
}</code></pre></div>
<blockquote>
<p>这里用到了 trait 实现语法（<code>impl Xxx for Yyy</code>），目前看不懂细节很正常——trait 章节会完整讲解。这里有个印象即可，在实际项目使用到的时候再回头深入学习即可。</p>
</blockquote>
<h1 id="遍历-result">遍历 Result</h1>
<h2 id="迭代器中的错误处理">迭代器中的错误处理</h2>
<blockquote>
<p>下面的代码用到了闭包（<code>|s| ...</code>）和迭代器（<code>.map()</code>、<code>.collect()</code> 等），这些语法会在<a href="/RustCourse/chapters/12-closures-iterators/00-index">闭包与迭代器</a>章节详细讲解。这里先看整体用法，理解”遇到错误时有哪些处理策略”即可，细节后续自然会清楚。</p>
</blockquote>
<p>当你对一个集合做 <code>map</code> 操作时，每个元素的转换可能失败。Rust 提供了三种实用策略：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20strings%20%3D%20vec!%5B%221%22%2C%20%22%E4%B8%A4%22%2C%20%223%22%2C%20%224%22%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E7%AD%96%E7%95%A5%E4%B8%80%EF%BC%9Afilter_map%20%E2%80%94%20%E5%BF%BD%E7%95%A5%E5%A4%B1%E8%B4%A5%E9%A1%B9%EF%BC%8C%E5%8F%AA%E4%BF%9D%E7%95%99%E6%88%90%E5%8A%9F%E7%9A%84%0A%20%20%20%20let%20numbers%3A%20Vec%3Ci32%3E%20%3D%20strings.iter()%0A%20%20%20%20%20%20%20%20.filter_map(%7Cs%7C%20s.parse%3A%3A%3Ci32%3E().ok())%0A%20%20%20%20%20%20%20%20.collect()%3B%0A%20%20%20%20println!(%22%E5%BF%BD%E7%95%A5%E5%A4%B1%E8%B4%A5%EF%BC%9A%7B%3A%3F%7D%22%2C%20numbers)%3B%20%20%2F%2F%20%5B1%2C%203%2C%204%5D%0A%0A%20%20%20%20%2F%2F%20%E7%AD%96%E7%95%A5%E4%BA%8C%EF%BC%9Acollect%20%E5%88%B0%20Result%20%E2%80%94%20%E9%81%87%E5%88%B0%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%A4%B1%E8%B4%A5%E5%B0%B1%E6%95%B4%E4%BD%93%E8%BF%94%E5%9B%9E%20Err%0A%20%20%20%20let%20result%3A%20Result%3CVec%3Ci32%3E%2C%20_%3E%20%3D%20strings.iter()%0A%20%20%20%20%20%20%20%20.map(%7Cs%7C%20s.parse%3A%3A%3Ci32%3E())%0A%20%20%20%20%20%20%20%20.collect()%3B%0A%20%20%20%20println!(%22%E9%81%87%E9%94%99%E5%8D%B3%E5%81%9C%EF%BC%9A%7B%3A%3F%7D%22%2C%20result)%3B%20%20%2F%2F%20Err(...)%0A%0A%20%20%20%20%2F%2F%20%E7%AD%96%E7%95%A5%E4%B8%89%EF%BC%9Apartition%20%E2%80%94%20%E6%8A%8A%E6%88%90%E5%8A%9F%E5%92%8C%E5%A4%B1%E8%B4%A5%E5%88%86%E5%BC%80%E6%94%B6%E9%9B%86%0A%20%20%20%20let%20(ok_vals%2C%20err_vals)%3A%20(Vec%3C_%3E%2C%20Vec%3C_%3E)%20%3D%20strings.iter()%0A%20%20%20%20%20%20%20%20.map(%7Cs%7C%20s.parse%3A%3A%3Ci32%3E())%0A%20%20%20%20%20%20%20%20.partition(Result%3A%3Ais_ok)%3B%0A%20%20%20%20let%20numbers%3A%20Vec%3Ci32%3E%20%3D%20ok_vals.into_iter().map(Result%3A%3Aunwrap).collect()%3B%0A%20%20%20%20let%20errors%3A%20Vec%3C_%3E%20%20%20%20%3D%20err_vals.into_iter().map(Result%3A%3Aunwrap_err).collect()%3B%0A%20%20%20%20println!(%22%E5%88%86%E5%BC%80%E6%94%B6%E9%9B%86%EF%BC%9Aok%3D%7B%3A%3F%7D%2C%20err%3D%7B%3A%3F%7D%22%2C%20numbers%2C%20errors)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let strings = vec!["1", "两", "3", "4"];

    // 策略一：filter_map — 忽略失败项，只保留成功的
    let numbers: Vec&lt;i32&gt; = strings.iter()
        .filter_map(|s| s.parse::&lt;i32&gt;().ok())
        .collect();
    println!("忽略失败：{:?}", numbers);  // [1, 3, 4]

    // 策略二：collect 到 Result — 遇到第一个失败就整体返回 Err
    let result: Result&lt;Vec&lt;i32&gt;, _&gt; = strings.iter()
        .map(|s| s.parse::&lt;i32&gt;())
        .collect();
    println!("遇错即停：{:?}", result);  // Err(...)

    // 策略三：partition — 把成功和失败分开收集
    let (ok_vals, err_vals): (Vec&lt;_&gt;, Vec&lt;_&gt;) = strings.iter()
        .map(|s| s.parse::&lt;i32&gt;())
        .partition(Result::is_ok);
    let numbers: Vec&lt;i32&gt; = ok_vals.into_iter().map(Result::unwrap).collect();
    let errors: Vec&lt;_&gt;    = err_vals.into_iter().map(Result::unwrap_err).collect();
    println!("分开收集：ok={:?}, err={:?}", numbers, errors);
}</code></pre></div>
<p>三种策略各有用途：</p>
<table><thead><tr><th>策略</th><th>适用场景</th></tr></thead><tbody><tr><td><code>filter_map(.ok())</code></td><td>不关心失败项，只要成功的结果</td></tr><tr><td><code>collect::&lt;Result&lt;Vec&lt;_&gt;,_&gt;&gt;()</code></td><td>要么全部成功，要么整体失败（数据导入等批量操作）</td></tr><tr><td><code>partition(Result::is_ok)</code></td><td>既要成功结果，也要收集所有错误信息</td></tr></tbody></table>
<h1 id="练习题">练习题</h1>
<h2 id="多种错误来源测验">多种错误来源测验</h2>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习一修复错误传播">练习一：修复错误传播</h3>
<p>下面这个函数无法编译，因为函数体内可能出现两种不同的错误类型，但返回类型只写了 <code>io::Error</code>。把返回类型改成能容纳任意错误的类型，使其编译通过。</p>
<div class="code-editor" data-block-id="09-error-handling/05-multiple-errors#2:3" data-expect-mode="literal" data-expect-pattern="%E5%87%BA%E9%94%99%E4%BA%86%EF%BC%9ANo%20such%20file%20or%20directory%20(os%20error%202)" data-starter-code="use%20std%3A%3Afs%3B%0Ause%20std%3A%3Aio%3B%0A%0Afn%20read_number(path%3A%20%26str)%20-%3E%20Result%3Ci32%2C%20io%3A%3AError%3E%20%7B%0A%20%20%20%20let%20content%20%3D%20fs%3A%3Aread_to_string(path)%3F%3B%0A%20%20%20%20let%20n%3A%20i32%20%3D%20content.trim().parse()%3F%3B%0A%20%20%20%20Ok(n)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20match%20read_number(%22number.txt%22)%20%7B%0A%20%20%20%20%20%20%20%20Ok(n)%20%20%3D%3E%20println!(%22%E6%95%B0%E5%AD%97%E6%98%AF%20%7B%7D%22%2C%20n)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20println!(%22%E5%87%BA%E9%94%99%E4%BA%86%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%7D"><pre><code class="language-rust">use std::fs;
use std::io;

fn read_number(path: &amp;str) -&gt; Result&lt;i32, io::Error&gt; {
    let content = fs::read_to_string(path)?;
    let n: i32 = content.trim().parse()?;
    Ok(n)
}

fn main() {
    match read_number("number.txt") {
        Ok(n)  =&gt; println!("数字是 {}", n),
        Err(e) =&gt; println!("出错了：{}", e),
    }
}</code></pre></div>
<h3 id="练习二用迭代器处理错误">练习二：用迭代器处理错误</h3>
<p>把能转换成整数的字符串保留下来，不能转换的跳过。请用 <code>filter_map</code> 补全代码。</p>
<div class="code-editor" data-block-id="09-error-handling/05-multiple-errors#2:4" data-expect-mode="literal" data-expect-pattern="%5B1%2C%203%2C%205%5D" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20inputs%20%3D%20vec!%5B%221%22%2C%20%22two%22%2C%20%223%22%2C%20%22%E5%9B%9B%22%2C%20%225%22%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BD%BF%E7%94%A8%20filter_map%20%E8%BF%87%E6%BB%A4%E6%8E%89%E6%97%A0%E6%B3%95%E8%A7%A3%E6%9E%90%E7%9A%84%EF%BC%8C%E5%8F%AA%E4%BF%9D%E7%95%99%E6%88%90%E5%8A%9F%E8%A7%A3%E6%9E%90%E7%9A%84%E6%95%B4%E6%95%B0%0A%20%20%20%20let%20numbers%3A%20Vec%3Ci32%3E%20%3D%20inputs.iter()%0A%20%20%20%20%20%20%20%20.filter_map(%7Cs%7C%20s.parse%3A%3A%3Ci32%3E().%3F%3F%3F)%0A%20%20%20%20%20%20%20%20.collect()%3B%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20numbers)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    let inputs = vec!["1", "two", "3", "四", "5"];

    // 使用 filter_map 过滤掉无法解析的，只保留成功解析的整数
    let numbers: Vec&lt;i32&gt; = inputs.iter()
        .filter_map(|s| s.parse::&lt;i32&gt;().???)
        .collect();

    println!("{:?}", numbers);
}</code></pre></div> 