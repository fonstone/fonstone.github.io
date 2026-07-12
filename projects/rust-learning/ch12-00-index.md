---
title: "闭包与迭代器"
description: "闭包与迭代器 - 闭包与迭代器"
date: "2026-07-12"
order: 12000
tags: ["闭包", "迭代器", "Fn", "Iterator", "map", "filter", "零开销抽象"]
est_time: "5 分钟"
---

 <p>闭包和迭代器是 Rust 函数式编程风格的两块基石，也是最常配合使用的一对特性。</p>
<p><strong>闭包</strong>是可以捕获所在作用域变量的匿名函数——你可以把”一段行为”存进变量、传给函数、或从函数返回。它的三个 trait（<code>Fn</code>/<code>FnMut</code>/<code>FnOnce</code>）描述了闭包如何捕获以及能被调用几次。</p>
<p><strong>迭代器</strong>是按需逐个产生值的惰性接口——整条变换链只有在”消费”时才真正执行，不产生任何中间集合。两类方法各司其职：迭代器适配器（<code>map</code>、<code>filter</code>）描述变换但不执行；消费适配器（<code>sum</code>、<code>collect</code>）触发执行并拿走结果。</p>
<p>这两者的深度融合让你可以写出像这样的代码：</p>
<pre><code class="language-rust">let total: i32 = orders
    .iter()
    .filter(|o| o.is_paid)
    .map(|o| o.amount)
    .sum();</code></pre>
<p>简洁、无中间分配、性能与手写循环等价——这是 Rust <strong>零开销抽象</strong>的典型体现。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-closures">闭包</a></td><td>闭包语法、三种捕获方式（借用/可变借用/移动），以及何时用 <code>move</code></td></tr><tr><td><a href="./02-fn-traits">Fn Trait</a></td><td><code>Fn</code>/<code>FnMut</code>/<code>FnOnce</code> 三个 trait 的区别，闭包作为参数与返回值</td></tr><tr><td><a href="./03-iterators">迭代器基础</a></td><td>惰性求值、<code>iter</code>/<code>into_iter</code>/<code>iter_mut</code>、自定义迭代器与零开销原理</td></tr><tr><td><a href="./04-adaptors">适配器</a></td><td>消费适配器与迭代器适配器的本质区别，常用方法速查</td></tr><tr><td><a href="./05-practice">综合练习</a></td><td>手写 <code>my_filter</code> 和 <code>my_sum</code>，理解标准库适配器的实现原理</td></tr></tbody></table> 