---
title: "标准库类型"
description: "标准库类型 - 标准库类型"
date: "2026-07-12"
order: 5000
tags: ["向量", "字符串", "哈希表", "集合", "所有权"]
est_time: "5 分钟"
---

 <p>有了基础类型和自定义类型，实际开发中你还会频繁需要<strong>集合</strong>——存储一组数据而非单个值。Rust 标准库提供了三种最常用的集合类型，几乎出现在每一个 Rust 程序中：动态数组 <code>Vec&lt;T&gt;</code>、可变字符串 <code>String</code>，以及键值对集合 <code>HashMap&lt;K, V&gt;</code>。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-vectors">向量 Vec&lt;T&gt;</a></td><td>可动态增长的数组：创建、读取、增删改与遍历</td></tr><tr><td><a href="./02-strings">字符串 String</a></td><td><code>String</code> 与 <code>&amp;str</code> 的区别，字符串操作与 UTF-8 编码</td></tr><tr><td><a href="./03-hashmaps">哈希表 HashMap</a></td><td>键值对集合：创建、查找、更新与迭代</td></tr><tr><td><a href="./04-practice">综合练习</a></td><td>综合运用三种集合类型解决实际问题</td></tr></tbody></table> 