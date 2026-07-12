---
title: "类型系统"
description: "类型系统进阶 - 类型系统"
date: "2026-07-12"
order: 6000
tags: ["类型系统", "类型推导", "类型转换", "类型别名", "newtype"]
est_time: "5 分钟"
---

 <p>Rust 的类型系统远不止于”声明变量的类型”。本章深入四个主题：编译器如何在大多数场景下自动推断类型，<code>as</code> 关键字如何进行显式数值转换，类型别名如何增强代码可读性，以及 newtype 模式如何用零开销的方式创建出语义不同的新类型——让编译器帮你区分「米」和「厘米」。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-type-inference">类型推导</a></td><td>编译器如何根据上下文推断变量和表达式的类型</td></tr><tr><td><a href="./02-type-casting">类型转换</a></td><td><code>as</code> 关键字的数值类型显式转换与注意事项</td></tr><tr><td><a href="./03-type-aliases">类型别名</a></td><td><code>type</code> 关键字给已有类型起别名，提升可读性</td></tr><tr><td><a href="./04-newtype-pattern">Newtype 模式</a></td><td>用单字段元组结构体创建真正的新类型，实现编译期类型隔离</td></tr></tbody></table> 