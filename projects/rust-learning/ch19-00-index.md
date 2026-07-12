---
title: "与 C 语言交互"
description: "C 互操作 - 与 C 语言交互"
date: "2026-07-12"
order: 19000
tags: ["FFI", "C 交互", "bindgen", "cbindgen", "混合编译"]
est_time: "5 分钟"
---

 <p>在系统编程的世界里，C 语言是通用的二进制语言。无论处理操作系统内核、数据库引擎还是图形驱动，都不可避免地需要与 C 代码打交道。</p>
<p>Rust 的设计目标之一是<strong>零成本互操作性</strong>：你可以像调用 Rust 函数一样调用 C 函数；外部语言也可以像调用 C 函数一样调用 Rust；数据在两种语言之间传递时，通常不需要额外的拷贝开销。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-ffi-basics">FFI 基础</a></td><td>ABI、<code>extern "C"</code> 块、基本类型映射与内存安全边界</td></tr><tr><td><a href="./02-bindgen">自动生成绑定：bindgen</a></td><td>从 C 头文件自动生成 Rust FFI 绑定代码</td></tr><tr><td><a href="./03-cbindgen">暴露 Rust 给 C：cbindgen</a></td><td>生成 C 头文件，将 Rust 库嵌入现有 C 代码库</td></tr><tr><td><a href="./04-mixed-build">混合编译</a></td><td>用 <code>cc</code> crate 在 Rust 项目中直接编译和链接 C 源码</td></tr></tbody></table> 