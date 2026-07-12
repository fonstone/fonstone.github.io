---
title: "项目工程化"
description: "工程化 - 项目工程化"
date: "2026-07-12"
order: 8000
tags: ["workspace", "features", "build.rs", "文档注释", "doctest", "cargo"]
est_time: "5 分钟"
---

 <p>当项目从单个文件成长为多个 crate 协作的大型工程，你需要掌握 Rust 的工程化能力。本章覆盖三个核心工具：用 Workspace 统一管理多 crate 依赖，用构建脚本在编译前执行自定义逻辑，以及写出能自动测试的文档注释。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-workspace">工作空间 Workspace</a></td><td>用一个根 <code>Cargo.toml</code> 管理多个 crate，共享依赖版本与编译缓存</td></tr><tr><td><a href="./02-build-scripts">构建脚本 build.rs</a></td><td>编译前的自定义脚本：代码生成、链接原生库、features 条件编译</td></tr><tr><td><a href="./03-doc-comments">文档注释与 doctest</a></td><td><code>///</code> 文档注释的写法，以及嵌入代码示例并自动测试</td></tr></tbody></table> 