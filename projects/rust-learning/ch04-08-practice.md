---
title: "综合练习"
description: "自定义类型 - 综合练习"
date: "2026-07-12"
order: 4008
tags: ["结构体", "枚举", "Option", "match", "综合"]
est_time: "35 分钟"
---

 <h1 id="代码判断题">代码判断题</h1>
<h2 id="题目-1结构体与所有权">题目 1：结构体与所有权</h2>
<pre><code class="language-rust">struct Person {
    name: String,
    age: u32,
}

fn main() {
    let p1 = Person {
        name: String::from("Alice"),
        age: 30,
    };
    
    let p2 = Person {
        name: p1.name,
        age: p1.age,
    };
    
    println!("{}", p1.name);
}</code></pre>
</div>
<h2 id="题目-2枚举与模式匹配">题目 2：枚举与模式匹配</h2>
<pre><code class="language-rust">enum Result {
    Ok(i32),
    Err(String),
}

fn main() {
    let result = Result::Ok(42);
    
    match result {
        Result::Ok(x) if x &gt; 0 =&gt; println!("正数：{}", x),
        Result::Ok(x) =&gt; println!("非正数：{}", x),
        Result::Err(_) =&gt; println!("错误"),
    }
}</code></pre>
</div>
<h2 id="题目-3option-与-if-let">题目 3：Option 与 if let</h2>
<pre><code class="language-rust">fn main() {
    let x: Option&lt;i32&gt; = None;
    let y = if let Some(val) = x { val + 1 } else { 0 };
    println!("{}", y);
}</code></pre>
</div>
<h1 id="编程练习">编程练习</h1>
<h2 id="练习-1书籍管理">练习 1：书籍管理</h2>
<p>定义一个 <code>Book</code> 结构体，并实现相关方法。</p>
<p><strong>任务：</strong></p>
<ul>
<li>定义 <code>Book</code> 结构体，包含 <code>title</code>（String）、<code>author</code>（String）、<code>pages</code>（u32）</li>
<li>实现 <code>new()</code> 方法创建新书</li>
<li>实现 <code>summary()</code> 方法返回书籍摘要</li>
</ul>
<p><strong>格式要求：</strong></p>
<ul>
<li><code>summary()</code> 返回格式：<code>"{title}" by {author}（{pages} 页）</code></li>
<li>例如：<code>"Rust 圣经" by 张汉东（652 页）</code></li>
</ul>
<div class="code-editor" data-block-id="04-custom-types/08-practice#1:0" data-expect-mode="literal" data-expect-pattern="%22Rust%20%E5%9C%A3%E7%BB%8F%22%20by%20%E5%BC%A0%E6%B1%89%E4%B8%9C%EF%BC%88652%20%E9%A1%B5%EF%BC%89" data-starter-code="struct%20Book%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E6%B7%BB%E5%8A%A0%E4%B8%89%E4%B8%AA%E5%AD%97%E6%AE%B5%0A%7D%0A%0Aimpl%20Book%20%7B%0A%20%20%20%20fn%20new(title%3A%20String%2C%20author%3A%20String%2C%20pages%3A%20u32)%20-%3E%20Book%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%3A%20%E5%88%9B%E5%BB%BA%E5%B9%B6%E8%BF%94%E5%9B%9E%20Book%20%E5%AE%9E%E4%BE%8B%0A%20%20%20%20%7D%0A%20%20%20%20%0A%20%20%20%20fn%20summary(%26self)%20-%3E%20String%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%3A%20%E8%BF%94%E5%9B%9E%E4%B9%A6%E7%B1%8D%E6%91%98%E8%A6%81%EF%BC%8C%E6%8C%89%E6%A0%BC%E5%BC%8F%E8%A6%81%E6%B1%82%E7%BB%84%E7%BB%87%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20book%20%3D%20Book%3A%3Anew(String%3A%3Afrom(%22Rust%20%E5%9C%A3%E7%BB%8F%22)%2C%20String%3A%3Afrom(%22%E5%BC%A0%E6%B1%89%E4%B8%9C%22)%2C%20652)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20book.summary())%3B%0A%7D"><pre><code class="language-rust">struct Book {
    // TODO: 添加三个字段
}

impl Book {
    fn new(title: String, author: String, pages: u32) -&gt; Book {
        // TODO: 创建并返回 Book 实例
    }
    
    fn summary(&amp;self) -&gt; String {
        // TODO: 返回书籍摘要，按格式要求组织
    }
}

fn main() {
    let book = Book::new(String::from("Rust 圣经"), String::from("张汉东"), 652);
    println!("{}", book.summary());
}</code></pre></div>
<h2 id="练习-2灯泡颜色">练习 2：灯泡颜色</h2>
<p>定义一个 <code>LightColor</code> 枚举，用 <code>match</code> 返回颜色的描述。</p>
<p><strong>任务：</strong></p>
<ul>
<li>定义 <code>LightColor</code> 枚举，包含三个成员：<code>Red</code>、<code>Green</code>、<code>Blue</code></li>
<li>实现 <code>describe()</code> 函数，接收 <code>LightColor</code>，用 <code>match</code> 返回对应的中文描述</li>
</ul>
<p><strong>格式要求：</strong></p>
<ul>
<li>红灯返回：<code>"红灯：停止"</code></li>
<li>绿灯返回：<code>"绿灯：通行"</code></li>
<li>蓝灯返回：<code>"蓝灯：准备"</code></li>
</ul>
<div class="code-editor" data-block-id="04-custom-types/08-practice#1:1" data-expect-mode="literal" data-expect-pattern="%E7%BA%A2%E7%81%AF%EF%BC%9A%E5%81%9C%E6%AD%A2%0A%E7%BB%BF%E7%81%AF%EF%BC%9A%E9%80%9A%E8%A1%8C%0A%E8%93%9D%E7%81%AF%EF%BC%9A%E5%87%86%E5%A4%87" data-starter-code="enum%20LightColor%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9A%E4%B9%89%E4%B8%89%E4%B8%AA%E6%88%90%E5%91%98%EF%BC%9ARed%E3%80%81Green%E3%80%81Blue%0A%7D%0A%0Afn%20describe(color%3A%20LightColor)%20-%3E%20String%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E4%BD%BF%E7%94%A8%20match%20%E5%A4%84%E7%90%86%E4%B8%89%E7%A7%8D%E6%83%85%E5%86%B5%EF%BC%8C%E8%BF%94%E5%9B%9E%E5%AF%B9%E5%BA%94%E5%AD%97%E7%AC%A6%E4%B8%B2%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe(LightColor%3A%3ARed))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe(LightColor%3A%3AGreen))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe(LightColor%3A%3ABlue))%3B%0A%7D"><pre><code class="language-rust">enum LightColor {
    // TODO: 定义三个成员：Red、Green、Blue
}

fn describe(color: LightColor) -&gt; String {
    // TODO: 使用 match 处理三种情况，返回对应字符串
}

fn main() {
    println!("{}", describe(LightColor::Red));
    println!("{}", describe(LightColor::Green));
    println!("{}", describe(LightColor::Blue));
}</code></pre></div>
<h2 id="练习-3数组中查找">练习 3：数组中查找</h2>
<p>使用 <code>Option</code> 在数组中查找元素。</p>
<p><strong>任务：</strong></p>
<ul>
<li>实现 <code>find_number()</code> 函数，在数组中查找指定数字</li>
<li>如果找到，返回 <code>Some(位置)</code>；如果没找到，返回 <code>None</code></li>
<li>在 <code>main</code> 中使用 <code>if let</code> 处理结果，并打印查找信息</li>
</ul>
<p><strong>格式要求：</strong></p>
<ul>
<li>找到时：<code>"{number} 在位置 {index}"</code>（例如：<code>30 在位置 2</code>）</li>
<li>未找到时：<code>"{number} 未找到"</code>（例如：<code>99 未找到</code>）</li>
</ul>
<p><strong>提示：</strong></p>
<ul>
<li>可以用 <code>for</code> 循环配合 <code>enumerate()</code> 遍历数组</li>
<li>或使用 <code>numbers.iter().position(|&amp;x| x == target)</code></li>
</ul>
<div class="code-editor" data-block-id="04-custom-types/08-practice#1:2" data-expect-mode="literal" data-expect-pattern="30%20%E5%9C%A8%E4%BD%8D%E7%BD%AE%202%0A99%20%E6%9C%AA%E6%89%BE%E5%88%B0" data-starter-code="fn%20find_number(numbers%3A%20%26%5Bi32%5D%2C%20target%3A%20i32)%20-%3E%20Option%3Cusize%3E%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E9%81%8D%E5%8E%86%E6%95%B0%E7%BB%84%EF%BC%8C%E6%89%BE%E5%88%B0%20target%20%E8%BF%94%E5%9B%9E%20Some(%E4%BD%8D%E7%BD%AE)%EF%BC%8C%E5%90%A6%E5%88%99%E8%BF%94%E5%9B%9E%20None%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20nums%20%3D%20%5B10%2C%2020%2C%2030%2C%2040%2C%2050%5D%3B%0A%20%20%20%20%0A%20%20%20%20%2F%2F%20TODO%3A%20%E6%9F%A5%E6%89%BE%2030%EF%BC%8C%E4%BD%BF%E7%94%A8%20if%20let%20%E5%A4%84%E7%90%86%E8%BF%94%E5%9B%9E%E5%80%BC%EF%BC%8C%E6%8C%89%E6%A0%BC%E5%BC%8F%E6%89%93%E5%8D%B0%0A%20%20%20%20%0A%20%20%20%20%2F%2F%20TODO%3A%20%E6%9F%A5%E6%89%BE%2099%EF%BC%8C%E4%BD%BF%E7%94%A8%20if%20let%20%E5%A4%84%E7%90%86%E8%BF%94%E5%9B%9E%E5%80%BC%EF%BC%8C%E6%8C%89%E6%A0%BC%E5%BC%8F%E6%89%93%E5%8D%B0%0A%7D"><pre><code class="language-rust">fn find_number(numbers: &amp;[i32], target: i32) -&gt; Option&lt;usize&gt; {
    // TODO: 遍历数组，找到 target 返回 Some(位置)，否则返回 None
}

fn main() {
    let nums = [10, 20, 30, 40, 50];
    
    // TODO: 查找 30，使用 if let 处理返回值，按格式打印
    
    // TODO: 查找 99，使用 if let 处理返回值，按格式打印
}</code></pre></div>
<hr/>
<p><strong>完成这三个练习，你掌握了自定义类型的基础！</strong></p> 