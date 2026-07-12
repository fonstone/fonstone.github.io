---
title: "自定义数据类型"
description: "自定义类型 - 自定义数据类型"
date: "2026-07-12"
order: 4000
tags: ["结构体", "枚举", "Option", "模式匹配", "类型系统"]
est_time: "5 分钟"
---

 <p>你已经学过 Rust 的基本类型（整数、浮点、布尔、字符串等）。现在是时候创建自己的类型了。</p>
<p>结构体用于将相关数据组织在一起，枚举表达”多选一”的语义，<code>match</code> 则是处理枚举值的利器——这三者结合，构成了 Rust 描述复杂问题域的核心工具。<code>Option&lt;T&gt;</code> 是 Rust 处理”值可能不存在”问题的答案，用来彻底替代其他语言中的 <code>null</code>。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-structs">结构体</a></td><td>定义和实例化结构体，字段更新语法与元组结构体</td></tr><tr><td><a href="./02-struct-methods">方法与关联函数</a></td><td>用 <code>impl</code> 块为结构体添加方法和关联函数</td></tr><tr><td><a href="./03-enums">枚举</a></td><td>定义枚举类型，枚举变体中携带数据</td></tr><tr><td><a href="./04-match">match 模式匹配</a></td><td><code>match</code> 表达式的用法，穷尽匹配与通配模式</td></tr><tr><td><a href="./05-if-let">if let</a></td><td>简洁处理单一模式的语法糖</td></tr><tr><td><a href="./06-option">Option&lt;T&gt;</a></td><td>用 <code>Option</code> 安全地表达值的存在或缺失，替代 null</td></tr><tr><td><a href="./07-constants">常量与静态变量</a></td><td><code>const</code>、<code>static</code> 与编译期常量的使用场景</td></tr><tr><td><a href="./08-practice">综合练习</a></td><td>综合运用自定义类型解决实际问题</td></tr></tbody></table> 