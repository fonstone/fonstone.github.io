---
title: "不安全 Rust"
description: "Unsafe Rust - 不安全 Rust"
date: "2026-07-12"
order: 18000
tags: ["unsafe", "裸指针", "unsafe trait", "安全抽象", "FFI"]
est_time: "5 分钟"
---

 <p>Rust 的安全保证来自编译器——但有时候你写的代码确实是安全的，编译器却无法证明。<code>unsafe</code> 关键字是对编译器说：“这里我比你更了解情况，放行。”</p>
<p><strong>重要：<code>unsafe</code> 不会关闭借用检查器</strong>，它只解锁了五种额外操作：解引用裸指针、调用 unsafe 函数、访问可变静态变量、实现 unsafe trait、访问 union 字段。安全责任由此从编译器转移到你。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-unsafe">unsafe 块与超能力</a></td><td>unsafe 块的真实含义，五大超能力逐一讲解</td></tr><tr><td><a href="./02-raw-pointers">裸指针</a></td><td><code>*const T</code> 与 <code>*mut T</code> 的创建、解引用与指针算术</td></tr><tr><td><a href="./03-unsafe-functions">unsafe 函数与 Trait</a></td><td><code>unsafe fn</code> 的设计规范、<code># Safety</code> 文档约定，<code>Send</code>/<code>Sync</code> 手动实现</td></tr><tr><td><a href="./04-safe-abstractions">安全抽象</a></td><td>用 unsafe 实现 + safe 接口封装，最小化 unsafe 范围</td></tr></tbody></table> 