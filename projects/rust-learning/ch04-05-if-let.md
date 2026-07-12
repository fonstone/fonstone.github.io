---
title: "if let 与 while let"
description: "自定义类型 - if let 与 while let"
date: "2026-07-12"
order: 4005
tags: ["if let", "while let", "语法糖", "简洁"]
est_time: "20 分钟"
---

 <h1 id="if-letmatch-的简洁写法">if let：match 的简洁写法</h1>
<p>有时候，你用 <code>match</code> 只想处理<strong>一个特定的情况</strong>，其他情况都无需特殊处理。这时 <code>if let</code> 提供了更简洁的语法。</p>
<h2 id="match-vs-if-let">match vs if let</h2>
<p>假设你只想在 <code>Option</code> 有值时做某事：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E4%BD%BF%E7%94%A8%20match%EF%BC%88%E7%9B%B8%E5%AF%B9%E5%86%97%E9%95%BF%EF%BC%89%0Alet%20config_max%20%3D%20Some(3u8)%3B%0A%0Amatch%20config_max%20%7B%0A%20%20%20%20Some(max)%20%3D%3E%20println!(%22%E6%9C%80%E5%A4%A7%E5%80%BC%E9%85%8D%E7%BD%AE%E4%B8%BA%20%7B%7D%22%2C%20max)%2C%0A%20%20%20%20_%20%3D%3E%20()%2C%20%20%2F%2F%20%E4%BB%80%E4%B9%88%E9%83%BD%E4%B8%8D%E5%81%9A%0A%7D" data-mode="run"><pre><code class="language-rust">// 使用 match（相对冗长）
let config_max = Some(3u8);

match config_max {
    Some(max) =&gt; println!("最大值配置为 {}", max),
    _ =&gt; (),  // 什么都不做
}</code></pre></div>
<p>用 <code>if let</code> 简化：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E4%BD%BF%E7%94%A8%20if%20let%EF%BC%88%E6%9B%B4%E7%AE%80%E6%B4%81%EF%BC%89%0Alet%20config_max%20%3D%20Some(3u8)%3B%0A%0Aif%20let%20Some(max)%20%3D%20config_max%20%7B%0A%20%20%20%20println!(%22%E6%9C%80%E5%A4%A7%E5%80%BC%E9%85%8D%E7%BD%AE%E4%B8%BA%20%7B%7D%22%2C%20max)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 使用 if let（更简洁）
let config_max = Some(3u8);

if let Some(max) = config_max {
    println!("最大值配置为 {}", max);
}</code></pre></div>
<p><strong>关键差异：</strong></p>
<ul>
<li><code>match</code> 必须穷尽所有情况</li>
<li><code>if let</code> 只关心一个模式是否匹配，<strong>其他情况隐含地忽略</strong>（相当于自动加了 <code>_ =&gt; {}</code>）</li>
</ul>
<blockquote>
<p><strong>重要</strong>：<code>if let</code> 确实”绕过”了穷尽性检查，但这是有意的设计。当你只关心某一种情况时，不需要为其他情况写冗长的 <code>_ =&gt; {}</code> 分支。比如上面的例子，你只想在配置有值时处理，不关心 <code>None</code> 的情况——这时 <code>if let</code> 就很合适。</p>
</blockquote>
<h2 id="if-let-的语法">if let 的语法</h2>
<pre><code class="language-rust">if let 模式 = 表达式 {
    // 模式匹配时执行
}</code></pre>
<p>注意：是 <code>=</code> 而不是 <code>match</code>。</p>
<h2 id="实际例子">实际例子</h2>
<div class="code-runner" data-full-code="enum%20Status%20%7B%0A%20%20%20%20Done%2C%0A%20%20%20%20Working%20%7B%20progress%3A%20u32%20%7D%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20status%20%3D%20Status%3A%3AWorking%20%7B%20progress%3A%2050%20%7D%3B%0A%0A%20%20%20%20%2F%2F%20%E7%94%A8%20match%0A%20%20%20%20match%20status%20%7B%0A%20%20%20%20%20%20%20%20Status%3A%3AWorking%20%7B%20progress%20%7D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E8%BF%9B%E5%BA%A6%EF%BC%9A%7B%7D%25%22%2C%20progress)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20%7B%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E7%94%A8%20if%20let%EF%BC%88%E6%9B%B4%E6%B8%85%E6%99%B0%EF%BC%89%0A%20%20%20%20if%20let%20Status%3A%3AWorking%20%7B%20progress%20%7D%20%3D%20status%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E8%BF%9B%E5%BA%A6%EF%BC%9A%7B%7D%25%22%2C%20progress)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">enum Status {
    Done,
    Working { progress: u32 },
}

fn main() {
    let status = Status::Working { progress: 50 };

    // 用 match
    match status {
        Status::Working { progress } =&gt; {
            println!("进度：{}%", progress);
        }
        _ =&gt; {}
    }

    // 用 if let（更清晰）
    if let Status::Working { progress } = status {
        println!("进度：{}%", progress);
    }
}</code></pre></div>
<h2 id="if-let--else">if let … else</h2>
<p><code>if let</code> 可以配合 <code>else</code>，处理模式不匹配的情况：</p>
<div class="code-runner" data-full-code="let%20favorite_color%3A%20Option%3C%26str%3E%20%3D%20Some(%22%E8%93%9D%E8%89%B2%22)%3B%0Alet%20is_tuesday%20%3D%20false%3B%0Alet%20age%3A%20Result%3Cu8%2C%20_%3E%20%3D%20%2234%22.parse()%3B%0A%0Aif%20let%20Some(color)%20%3D%20favorite_color%20%7B%0A%20%20%20%20println!(%22%E4%BD%BF%E7%94%A8%E4%BD%A0%E6%9C%80%E5%96%9C%E6%AC%A2%E7%9A%84%E9%A2%9C%E8%89%B2%EF%BC%9A%7B%7D%22%2C%20color)%3B%0A%7D%20else%20if%20is_tuesday%20%7B%0A%20%20%20%20println!(%22%E6%98%9F%E6%9C%9F%E4%BA%8C%E7%A9%BF%E7%BB%BF%E8%89%B2%EF%BC%81%22)%3B%0A%7D%20else%20if%20let%20Ok(age)%20%3D%20age%20%7B%0A%20%20%20%20if%20age%20%3E%2030%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%BD%BF%E7%94%A8%E7%B4%AB%E8%89%B2%22)%3B%0A%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%BD%BF%E7%94%A8%E6%A9%99%E8%89%B2%22)%3B%0A%20%20%20%20%7D%0A%7D%20else%20%7B%0A%20%20%20%20println!(%22%E4%BD%BF%E7%94%A8%E8%93%9D%E8%89%B2%E4%BD%9C%E4%B8%BA%E5%90%8E%E5%A4%87%E6%96%B9%E6%A1%88%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">let favorite_color: Option&lt;&amp;str&gt; = Some("蓝色");
let is_tuesday = false;
let age: Result&lt;u8, _&gt; = "34".parse();

if let Some(color) = favorite_color {
    println!("使用你最喜欢的颜色：{}", color);
} else if is_tuesday {
    println!("星期二穿绿色！");
} else if let Ok(age) = age {
    if age &gt; 30 {
        println!("使用紫色");
    } else {
        println!("使用橙色");
    }
} else {
    println!("使用蓝色作为后备方案");
}</code></pre></div>
<p><strong>等价的 match 写法会更复杂</strong>。</p>
<h1 id="while-let循环中的模式匹配">while let：循环中的模式匹配</h1>
<p>类似 <code>if let</code>，<code>while let</code> 在循环中只关心某个模式：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20stack%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E5%BD%93%20pop()%20%E8%BF%94%E5%9B%9E%20Some%20%E6%97%B6%E7%BB%A7%E7%BB%AD%E5%BE%AA%E7%8E%AF%0A%20%20%20%20while%20let%20Some(top)%20%3D%20stack.pop()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%A0%88%E9%A1%B6%EF%BC%9A%7B%7D%22%2C%20top)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut stack = vec![1, 2, 3];

    // 当 pop() 返回 Some 时继续循环
    while let Some(top) = stack.pop() {
        println!("栈顶：{}", top);
    }
}</code></pre></div>
<p>等价的 <code>loop + match</code> 写法：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20stack%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20loop%20%7B%0A%20%20%20%20%20%20%20%20match%20stack.pop()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Some(top)%20%3D%3E%20println!(%22%E6%A0%88%E9%A1%B6%EF%BC%9A%7B%7D%22%2C%20top)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20None%20%3D%3E%20break%2C%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut stack = vec![1, 2, 3];

    loop {
        match stack.pop() {
            Some(top) =&gt; println!("栈顶：{}", top),
            None =&gt; break,
        }
    }
}</code></pre></div>
<p><code>while let</code> 明显更简洁。</p>
<h1 id="何时用-if-let-vs-match">何时用 if let vs match</h1>
<table><thead><tr><th>情况</th><th>用 if let</th><th>用 match</th></tr></thead><tbody><tr><td>只关心一个模式匹配</td><td>✓</td><td>不推荐（代码冗长）</td></tr><tr><td>需要穷尽所有情况</td><td>✗</td><td>✓</td></tr><tr><td>需要处理多个模式</td><td>嵌套 if let 会很丑</td><td>✓</td></tr><tr><td>需要在模式中使用守卫条件</td><td>可以，但有限制</td><td>✓</td></tr></tbody></table>
<p>简单规则：<strong>如果你的 <code>match</code> 只有两个分支，其中一个用 <code>_</code> 忽略，那就考虑用 <code>if let</code>。</strong></p>
<h1 id="练习题">练习题</h1>
<pre><code class="language-rust">let x = Some(5);

if let Some(y) = x {
    println!("{}", y);
}</code></pre>
</div>
<pre><code class="language-rust">let config = Some(String::from("config.toml"));

if let Some(file) = config {
    println!("使用配置文件：{}", file);
} else {
    println!("使用默认配置");
}</code></pre>
</div>
<pre><code class="language-rust">while let Some(x) = some_iterator {
    // ...
}</code></pre>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习-1用-if-let-简化代码">练习 1：用 if let 简化代码</h3>
<p>使用 <code>if let</code> 和 <code>else</code> 处理以下场景：</p>
<div class="code-editor" data-block-id="04-custom-types/05-if-let#3:3" data-expect-mode="literal" data-expect-pattern="%E6%94%B6%E5%88%B0%E6%96%B0%E9%82%AE%E4%BB%B6%EF%BC%8C%E4%B8%BB%E9%A2%98%EF%BC%9A%E4%BD%A0%E5%A5%BD%EF%BC%8C%E6%9D%A5%E8%87%AA%EF%BC%9AAlice" data-starter-code="enum%20Message%20%7B%0A%20%20%20%20NewEmail%20%7B%20subject%3A%20String%2C%20sender%3A%20String%20%7D%2C%0A%20%20%20%20Text(String)%2C%0A%20%20%20%20Quit%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20message%20%3D%20Message%3A%3ANewEmail%20%7B%0A%20%20%20%20%20%20%20%20subject%3A%20String%3A%3Afrom(%22%E4%BD%A0%E5%A5%BD%22)%2C%0A%20%20%20%20%20%20%20%20sender%3A%20String%3A%3Afrom(%22Alice%22)%2C%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E7%94%A8%20if%20let%20%E6%A3%80%E6%9F%A5%E6%98%AF%E5%90%A6%E6%98%AF%20NewEmail%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E6%98%AF%EF%BC%8C%E6%89%93%E5%8D%B0%20%22%E6%94%B6%E5%88%B0%E6%96%B0%E9%82%AE%E4%BB%B6%EF%BC%8C%E4%B8%BB%E9%A2%98%EF%BC%9A%7Bsubject%7D%EF%BC%8C%E6%9D%A5%E8%87%AA%EF%BC%9A%7Bsender%7D%22%0A%20%20%20%20%2F%2F%20%E5%90%A6%E5%88%99%E6%89%93%E5%8D%B0%20%22%E6%94%B6%E5%88%B0%E5%85%B6%E4%BB%96%E7%B1%BB%E5%9E%8B%E7%9A%84%E6%B6%88%E6%81%AF%22%0A%7D"><pre><code class="language-rust">enum Message {
    NewEmail { subject: String, sender: String },
    Text(String),
    Quit,
}

fn main() {
    let message = Message::NewEmail {
        subject: String::from("你好"),
        sender: String::from("Alice"),
    };

    // TODO: 用 if let 检查是否是 NewEmail
    // 如果是，打印 "收到新邮件，主题：{subject}，来自：{sender}"
    // 否则打印 "收到其他类型的消息"
}</code></pre></div>
<h3 id="练习-2用-while-let-遍历集合">练习 2：用 while let 遍历集合</h3>
<p>使用 <code>while let</code> 循环处理向量中的元素：</p>
<div class="code-editor" data-block-id="04-custom-types/05-if-let#3:4" data-expect-mode="literal" data-expect-pattern="5%0A4%0A3%0A2%0A1" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20numbers%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E4%BD%BF%E7%94%A8%20while%20let%20%E9%85%8D%E5%90%88%20pop()%20%E4%BB%8E%E5%90%91%E9%87%8F%E6%9C%AB%E5%B0%BE%E5%8F%96%E5%87%BA%E5%85%83%E7%B4%A0%0A%20%20%20%20%2F%2F%20%E9%80%90%E4%B8%AA%E6%89%93%E5%8D%B0%E6%AF%8F%E4%B8%AA%E6%95%B0%E5%AD%97%EF%BC%88%E6%B3%A8%E6%84%8F%E9%A1%BA%E5%BA%8F%E6%98%AF%E4%BB%8E%E5%90%8E%E5%BE%80%E5%89%8D%EF%BC%89%0A%7D"><pre><code class="language-rust">fn main() {
    let mut numbers = vec![1, 2, 3, 4, 5];

    // TODO: 使用 while let 配合 pop() 从向量末尾取出元素
    // 逐个打印每个数字（注意顺序是从后往前）
}</code></pre></div> 