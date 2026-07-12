---
title: "所有权系统"
description: "所有权系统 - 所有权系统"
date: "2026-07-12"
order: 3000
tags: ["所有权", "栈", "堆", "移动", "Copy", "Clone", "所有权与函数"]
est_time: "5 分钟"
---

 <p>所有权是 Rust 最核心也最独特的特性——它让 Rust 在没有垃圾回收器的情况下保证内存安全。这不是一个孤立的概念，而是一套贯穿整个语言的规则体系，从变量赋值到函数调用，无处不在。</p>
<p>理解所有权需要先理解 Rust 的内存模型。本章从栈与堆的区别出发，逐步展开所有权规则、引用与借用、切片等核心概念。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-memory-and-move">内存与数据流动</a></td><td>栈与堆的区别，移动、拷贝与克隆三种数据交互方式</td></tr><tr><td><a href="./02-what-is-ownership">什么是所有权</a></td><td>所有权三条规则、变量作用域与 String 类型的所有权交互</td></tr><tr><td><a href="./03-references-borrowing">引用与借用</a></td><td>不转移所有权地使用数据，可变引用与借用规则</td></tr><tr><td><a href="./04-slices">切片</a></td><td>对序列数据的局部引用，字符串切片与数组切片</td></tr><tr><td><a href="./05-practice">综合练习</a></td><td>运用所有权、引用与切片解决实际问题</td></tr></tbody></table> 