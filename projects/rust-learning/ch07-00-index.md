---
title: "模块系统"
description: "模块系统 - 模块系统"
date: "2026-07-12"
order: 7000
tags: ["模块系统", "package", "crate", "pub", "use", "路径"]
est_time: "5 分钟"
---

 <p>当代码量增长，你需要一套机制来组织它——把相关的函数、类型和常量分组，控制哪些内容对外可见，避免命名冲突。这就是 Rust 的模块系统。</p>
<p>理解模块系统，关键是搞清楚三个层级的关系：<strong>Package</strong>（一次 <code>cargo new</code>）、<strong>Crate</strong>（编译单元）和<strong>模块</strong>（代码组织单元），以及如何在它们之间导航和控制访问权限。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-packages-crates">Package 与 Crate</a></td><td>编译单元的基本概念，binary crate 与 library crate 的区别</td></tr><tr><td><a href="./02-modules">模块与可见性</a></td><td>用 <code>mod</code> 组织代码，用 <code>pub</code> 控制对外可见性</td></tr><tr><td><a href="./03-paths-use">路径与 use</a></td><td>在模块树中用路径引用项，<code>use</code> 关键字简化写法</td></tr></tbody></table> 