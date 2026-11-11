---
title: "课程总纲：Rust 编程语言入门教程"
description: "《Rust 编程语言入门教程》12 章的路线图、前置要求与配套阅读索引。"
date: "2026-11-08"
order: 0
tags: ["课程总纲", "Rust 语言"]
est_time: "10 分钟"
generated: "course-index"
---

# Rust 编程语言入门教程

12 章按 Rust 的核心机制推进：语法打底之后，重点是所有权、生命周期、泛型与 trait、并发和错误处理，最后落到工程化与测试。课程用系统程序员的视角讲，不停留在语法对照。

## 课程信息

- 难度：入门
- 章节数：12 章
- 前置要求：写过任意一门静态类型语言；了解栈与堆的区别
- 学完能拿到：能解释借用检查器拒绝某段代码的原因；写出带泛型与 trait 约束的库；用 Cargo 组织并测试一个多模块工程
- 课程首页（含学习进度）：[/projects/rust-learning](/projects/rust-learning)
- 全站阅读路线图：[/start](/start)

## 章节路线

| # | 章节 | 要点 | 预计 |
| --- | --- | --- | --- |
| 01 | [Rust 简介与环境搭建](/projects/rust-learning/01-rust-intro) | 了解 Rust 的设计哲学、核心优势与适用范围，完成开发环境安装配置，运行第一个 Rust 程序 | 60 分钟 |
| 02 | [基本语法](/projects/rust-learning/02-basic-syntax) | 注释、格式化输出、数据类型、变量与可变性、控制流、函数、属性与宏 | 60 分钟 |
| 03 | [所有权系统](/projects/rust-learning/03-ownership) | 理解栈与堆、所有权规则、移动语义、引用与借用、切片类型 | 60 分钟 |
| 04 | [自定义类型](/projects/rust-learning/04-custom-types) | 结构体、方法语法、枚举、模式匹配、Option 类型、常量 | 60 分钟 |
| 05 | [标准库类型与类型系统](/projects/rust-learning/05-stdlib-type-system) | Vector、String、HashMap，类型推断与转换、类型别名、newtype 模式 | 60 分钟 |
| 06 | [模块与工程化](/projects/rust-learning/06-modules-engineering) | 包与 crate、模块系统、路径与 use、workspace、构建脚本、文档注释 | 60 分钟 |
| 07 | [错误处理](/projects/rust-learning/07-error-handling) | panic! 宏、Result 类型、? 运算符、多种错误类型处理、何时该 panic | 60 分钟 |
| 08 | [泛型、trait 与生命周期](/projects/rust-learning/08-generics-traits-lifetimes) | 泛型语法、trait 定义与实现、trait bound、From/Into 等转换 trait、生命周期标注与省略规则 | 60 分钟 |
| 09 | [闭包、迭代器与智能指针](/projects/rust-learning/09-closures-iterators-smart-pointers) | 闭包语法与捕获、Fn trait、迭代器与适配器、Box、Deref/Drop、Rc、RefCell | 60 分钟 |
| 10 | [并发编程](/projects/rust-learning/10-concurrency) | 线程创建与控制、消息传递（Channel）、共享状态（Mutex）、Sync 与 Send trait | 60 分钟 |
| 11 | [测试、调试与编程方法论](/projects/rust-learning/11-testing-debugging) | 单元测试与集成测试、测试控制、dbg! 宏、日志、代码架构、lint、CI、性能分析 | 60 分钟 |
| 12 | [高级主题](/projects/rust-learning/12-advanced-topics) | Unsafe Rust、FFI 与 C 互操作、嵌入式 Rust 基础、过程宏 | 60 分钟 |

## 配套阅读

知识空间里对应的技术长文，讲这一层为什么要这么设计。

- [AI 时代下的 OS 代码编程](/knowledge/os/ai-era-os-coding)
- [Vib-OS 深度解析：Vibe Coding 如何从零构建操作系统](/knowledge/os/vib-os-vibe-coding)

## 怎么读

第 3 章所有权是第一道分水岭，之后每章都建立在它之上。学完可以直接接《从零写 Rust RTOS》，那里会把 unsafe 边界和裸机环境一起交代清楚。

> 本页由 `scripts/generate-course-indexes.mjs` 从 `courses.ts` 与章节 frontmatter 生成，章节标题与链接随内容自动更新。
