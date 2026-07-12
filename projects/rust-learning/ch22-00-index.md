---
title: "高级特性"
description: "高级主题 - 高级特性"
date: "2026-07-12"
order: 22000
tags: ["关联类型", "dyn Trait", "异步", "高级模式匹配"]
est_time: "5 分钟"
---

 <p>本章介绍在日常编程中不常直接写、但理解它们能让你读懂更多代码的进阶机制——从关联类型、动态分发到异步基础，这些特性共同构成了 Rust 高级抽象能力的基础。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-associated-types">关联类型</a></td><td>泛型 Trait 中的 <code>type Item</code>，让签名与调用都更清晰</td></tr><tr><td><a href="./02-dyn-trait">dyn Trait：动态分发</a></td><td>fat pointer 原理、<code>Box&lt;dyn Trait&gt;</code> 与 <code>&amp;dyn Trait</code> 的选择，对象安全</td></tr><tr><td><a href="./03-async-basics">异步编程基础</a></td><td><code>async</code>/<code>await</code> 核心概念，Future 与执行器原理</td></tr><tr><td><a href="./04-advanced-patterns">高级模式匹配</a></td><td><code>@</code> 绑定、守卫、解构嵌套结构等进阶模式</td></tr></tbody></table> 