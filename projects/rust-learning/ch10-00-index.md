---
title: "泛型与 Trait"
description: "泛型与 trait - 泛型与 Trait"
date: "2026-07-12"
order: 10000
tags: ["泛型", "trait", "trait 约束", "关联类型", "单态化", "impl Trait"]
est_time: "5 分钟"
---

 <p>泛型和 Trait 是 Rust 抽象能力的两根支柱，天然咬合：<strong>泛型</strong>（<code>&lt;T&gt;</code>）让一份代码适配多种类型，<strong>Trait</strong> 定义”某类型能做什么”的行为契约，<strong>Trait 约束</strong>把二者联结起来——泛型代码可以调用约束所保证的方法，编译器在使用时展开为具体类型，零运行时开销。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-generics-syntax">泛型语法</a></td><td>函数、结构体、枚举和 impl 块中的泛型写法，单态化原理</td></tr><tr><td><a href="./02-traits">Trait：定义共享行为</a></td><td>定义与实现 Trait，默认方法，<code>Display</code> 与 <code>Debug</code> 背后的机制</td></tr><tr><td><a href="./03-trait-bounds">Trait 约束</a></td><td><code>T: Trait</code> 语法，多重约束，<code>where</code> 子句，<code>impl Trait</code></td></tr><tr><td><a href="./04-conversion-traits">转换 Trait</a></td><td><code>From</code>/<code>Into</code>、<code>TryFrom</code>/<code>TryInto</code> 的惯用模式</td></tr><tr><td><a href="./05-practice">综合练习</a></td><td>综合运用泛型与 Trait 解决实际问题</td></tr></tbody></table> 