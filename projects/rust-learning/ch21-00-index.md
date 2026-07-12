---
title: "过程宏"
description: "过程宏 - 过程宏"
date: "2026-07-12"
order: 21000
tags: ["过程宏", "proc macro", "derive", "属性宏", "函数宏", "syn", "quote"]
est_time: "5 分钟"
---

 <p>过程宏（Procedural Macros）是 Rust 元编程的高级形式。与基于模式匹配的声明宏不同，过程宏是<strong>真正的 Rust 程序</strong>——它接收编译器传入的 token 流，运行任意代码逻辑，输出新的 token 流让编译器继续编译。</p>
<p>过程宏有三种形式：自定义 <code>derive</code> 宏（<code>#[derive(MyTrait)]</code>）、类属性宏（<code>#[my_attr]</code>）和类函数宏（<code>my_macro!(...)</code>）。它们共同的核心工具链是 <code>syn</code>（解析 token 流为 AST）和 <code>quote</code>（将 AST 转回代码）。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-proc-macro-basics">过程宏基础</a></td><td>token 流的概念，proc-macro crate 的项目结构与调试方法</td></tr><tr><td><a href="./02-derive-macros">自定义 derive 宏</a></td><td>为 trait 添加 <code>#[derive(...)]</code> 支持，自动生成 impl 代码</td></tr><tr><td><a href="./03-attribute-macros">类属性宏</a></td><td>可应用于任意语法项的自定义属性宏</td></tr><tr><td><a href="./04-function-like-macros">类函数宏</a></td><td>接受任意 token 序列的函数形式宏</td></tr></tbody></table> 