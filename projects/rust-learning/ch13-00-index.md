---
title: "智能指针"
description: "智能指针 - 智能指针"
date: "2026-07-12"
order: 13000
tags: ["智能指针", "Box", "Rc", "RefCell", "Deref", "Drop", "所有权", "堆内存"]
est_time: "5 分钟"
---

 <p>指针（Pointer）是一个包含内存地址的变量。而<strong>智能指针（Smart Pointers）<strong>是一类特殊的结构体，它们不仅表现得像指针，还拥有额外的元数据和功能——通常</strong>拥有</strong>它们所指向的数据，而不只是借用。</p>
<p>不同的智能指针解决不同的问题，选用时参考下表：</p>
<table><thead><tr><th>场景</th><th>推荐类型</th></tr></thead><tbody><tr><td>将数据分配到堆上，或定义递归类型</td><td><code>Box&lt;T&gt;</code></td></tr><tr><td>单线程下多处共享同一份只读数据</td><td><code>Rc&lt;T&gt;</code></td></tr><tr><td>需要在”不可变”的外壳下修改内部数据</td><td><code>RefCell&lt;T&gt;</code></td></tr><tr><td>单线程下多处共享且需要修改数据</td><td><code>Rc&lt;RefCell&lt;T&gt;&gt;</code></td></tr><tr><td>多线程下共享数据</td><td><code>Arc&lt;T&gt;</code> / <code>Arc&lt;Mutex&lt;T&gt;&gt;</code></td></tr></tbody></table>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-box">Box&lt;T&gt;：堆内存分配</a></td><td>堆分配的场景，递归类型的解决方案，Deref coercion</td></tr><tr><td><a href="./02-deref-drop">Deref 与 Drop</a></td><td>自定义解引用行为与自动资源清理的两个核心 Trait</td></tr><tr><td><a href="./03-rc">Rc&lt;T&gt;：引用计数</a></td><td>单线程下的多重所有权，引用计数原理</td></tr><tr><td><a href="./04-refcell">RefCell&lt;T&gt;：内部可变性</a></td><td>运行时借用检查，在不可变引用外壳下修改数据</td></tr></tbody></table> 