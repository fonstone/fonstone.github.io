---
title: "基础语法"
description: "基本语法 - 基础语法"
date: "2026-07-12"
order: 2000
tags: ["基础语法", "变量", "数据类型", "控制流", "函数", "宏"]
est_time: "5 分钟"
---

 <p>学一门语言，第一步永远是同一件事：弄清楚它的基本构成要素——变量怎么声明，类型系统什么样，怎么写条件分支和循环，怎么定义函数。</p>
<p>这些东西在各门语言里大同小异，但 Rust 有几处独特的地方值得注意。比如变量默认不可变，比如 <code>if</code> 是表达式而不是语句，比如函数的返回值是最后一个表达式的值而不是 <code>return</code>。这些设计选择背后都有原因，理解了原因，规则就不难记住。</p>
<p>本章把这些基础语法挨个讲清楚，外加属性和宏两个 Rust 特有的概念。</p>
<h2 id="一段代码看懂本章要学什么">一段代码，看懂本章要学什么</h2>
<p>下面这段代码虽然不长，但用到了本章涵盖的大部分内容——变量、数据类型、函数、控制流、循环和格式化输出：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E6%A0%B9%E6%8D%AE%E5%88%86%E6%95%B0%E5%88%A4%E6%96%AD%E7%AD%89%E7%BA%A7%EF%BC%88%E5%87%BD%E6%95%B0%20%2B%20%E6%8E%A7%E5%88%B6%E6%B5%81%EF%BC%89%0Afn%20grade(score%3A%20u32)%20-%3E%20%26'static%20str%20%7B%0A%20%20%20%20if%20score%20%3E%3D%2090%20%7B%0A%20%20%20%20%20%20%20%20%22%E4%BC%98%E7%A7%80%22%0A%20%20%20%20%7D%20else%20if%20score%20%3E%3D%2080%20%7B%0A%20%20%20%20%20%20%20%20%22%E8%89%AF%E5%A5%BD%22%0A%20%20%20%20%7D%20else%20if%20score%20%3E%3D%2060%20%7B%0A%20%20%20%20%20%20%20%20%22%E5%8F%8A%E6%A0%BC%22%0A%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%22%E4%B8%8D%E5%8F%8A%E6%A0%BC%22%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%8F%98%E9%87%8F%E4%B8%8E%E6%95%B0%E7%BB%84%0A%20%20%20%20let%20scores%20%3D%20%5B95%2C%2082%2C%2061%2C%2045%5D%3B%0A%0A%20%20%20%20%2F%2F%20for%20%E5%BE%AA%E7%8E%AF%E9%81%8D%E5%8E%86%0A%20%20%20%20for%20score%20in%20scores%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E6%A0%BC%E5%BC%8F%E5%8C%96%E8%BE%93%E5%87%BA%EF%BC%88println!%20%E5%AE%8F%EF%BC%89%0A%20%20%20%20%20%20%20%20println!(%22%E5%88%86%E6%95%B0%20%7B%3A%3E3%7D%EF%BC%9A%7B%7D%22%2C%20score%2C%20grade(score))%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">// 根据分数判断等级（函数 + 控制流）
fn grade(score: u32) -&gt; &amp;'static str {
    if score &gt;= 90 {
        "优秀"
    } else if score &gt;= 80 {
        "良好"
    } else if score &gt;= 60 {
        "及格"
    } else {
        "不及格"
    }
}

fn main() {
    // 变量与数组
    let scores = [95, 82, 61, 45];

    // for 循环遍历
    for score in scores {
        // 格式化输出（println! 宏）
        println!("分数 {:&gt;3}：{}", score, grade(score));
    }
}</code></pre></div>
<p>读完本章，你会知道这段代码里每一行是什么意思，也能自己写出类似的程序。</p>
<blockquote>
<p>如果你是有经验的程序员，前几节可以快速浏览——重点关注和你熟悉语言的<strong>差异</strong>，而不是从零理解每个概念。</p>
</blockquote>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-comments">注释</a></td><td>行注释、块注释与文档注释的写法和用途</td></tr><tr><td><a href="./02-formatted-output">格式化输出</a></td><td><code>println!</code> 宏的各种格式化占位符，调试打印与自定义格式</td></tr><tr><td><a href="./03-data-types">数据类型</a></td><td>整数、浮点、布尔、字符等基础类型，以及元组和数组</td></tr><tr><td><a href="./04-variables">变量与可变性</a></td><td><code>let</code> 绑定、默认不可变、<code>mut</code>、常量与遮蔽（shadowing）</td></tr><tr><td><a href="./05-control-flow">控制流</a></td><td><code>if</code> 表达式、<code>loop</code>、<code>while</code>、<code>for</code> 循环的语法与特性</td></tr><tr><td><a href="./06-functions">函数</a></td><td>函数定义、参数、返回值，以及表达式与语句的区别</td></tr><tr><td><a href="./07-attributes">属性</a></td><td><code>#[...]</code> 属性的作用：控制编译行为、附加元数据</td></tr><tr><td><a href="./08-macros">宏</a></td><td>Rust 宏的基本概念，常用内置宏一览</td></tr><tr><td><a href="./09-practice">综合练习</a></td><td>用本章所学语法完成编程练习，巩固基础</td></tr></tbody></table> 