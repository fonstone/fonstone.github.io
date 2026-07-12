---
title: "生命周期"
description: "生命周期 - 生命周期"
date: "2026-07-12"
order: 11000
tags: ["生命周期", "借用检查器", "内存安全", "悬垂指针", "省略规则", "'static 生命周期"]
est_time: "5 分钟"
---

 <p>生命周期是 Rust 最独特的特性之一——它让编译器能够在<strong>不需要垃圾回收器</strong>的情况下，保证所有引用永远不会成为悬垂指针。</p>
<p>本章从”为什么需要生命周期”出发，逐步学习如何在函数、结构体中标注生命周期，再掌握省略规则（让你少写大量标注）和特殊的 <code>'static</code> 生命周期。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-what-are-lifetimes">什么是生命周期</a></td><td>悬垂引用的问题，借用检查器如何通过生命周期保证内存安全</td></tr><tr><td><a href="./02-lifetime-annotations">生命周期标注</a></td><td>函数和方法签名中的生命周期参数语法与语义</td></tr><tr><td><a href="./03-struct-lifetimes">结构体中的生命周期</a></td><td>包含引用字段的结构体如何声明生命周期</td></tr><tr><td><a href="./04-lifetime-elision">生命周期省略规则</a></td><td>三条省略规则，让你在大多数情况下不必手写标注</td></tr><tr><td><a href="./05-practice">综合练习</a></td><td>运用生命周期知识解决实际问题</td></tr></tbody></table> 