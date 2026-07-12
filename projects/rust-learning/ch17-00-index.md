---
title: "开发方法论"
description: "编程方法论 - 开发方法论"
date: "2026-07-12"
order: 17000
tags: ["架构设计", "TDD", "Clippy", "rustfmt", "CI/CD", "性能分析"]
est_time: "5 分钟"
---

 <p>写出能编译的 Rust 代码只是第一步。在真实的工程项目里，你还需要回答：代码应该怎么组织、编码时先写什么、怎么保证多人协作时代码风格一致、如何自动检查代码质量、如何找出性能瓶颈。</p>
<p>这一章以一个<strong>从零到上线的大工程</strong>为背景，按生命周期顺序讲解 Rust 工程化的核心方法论。</p>
<img alt=" 方法论" src="/images/rust/method.svg" style="max-width:100%;margin:1rem 0;"/>
<blockquote>
<p>这一章的内容偏”工程实践”，不需要背语法，重在理解<strong>为什么要这样做</strong>，建立工程思维。</p>
</blockquote>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>核心问题</th></tr></thead><tbody><tr><td><a href="./01-architecture">工程架构设计</a></td><td>如何把需求拆成模块？Cargo Workspace 怎么规划？</td></tr><tr><td><a href="./02-coding-flow">编码流程与 TDD</a></td><td>先定结构体还是 Trait？怎么用测试驱动实现？</td></tr><tr><td><a href="./03-lint">Lint、Clippy 与 rustfmt</a></td><td>如何让工具自动发现问题、统一代码风格？</td></tr><tr><td><a href="./04-ci">持续集成与依赖管理</a></td><td>如何自动化质量检查？依赖怎么选、怎么审计？</td></tr><tr><td><a href="./05-profiling">性能分析与基准测试</a></td><td>如何用 criterion + flamegraph 定位并量化性能问题？</td></tr></tbody></table> 