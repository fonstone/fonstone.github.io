---
title: "并发编程"
description: "并发编程 - 并发编程"
date: "2026-07-12"
order: 14000
tags: ["并发", "多线程", "Arc", "Mutex", "Channels", "线程安全"]
est_time: "5 分钟"
---

 <p>Rust 的设计目标之一是「无畏并发」（Fearless Concurrency）——通过所有权系统，Rust 在<strong>编译期</strong>就能消除绝大多数并发错误（如数据竞争），而不是把问题留到运行时。</p>
<p>并发模型的核心选择只有两种：<strong>消息传递</strong>（线程之间发送数据，不共享内存）和<strong>共享状态</strong>（线程之间共享数据，用锁保护）。Rust 对这两种模式都提供了安全的实现，本章将分别讲解。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-threads">多线程基础</a></td><td>创建线程、<code>join</code> 等待、<code>move</code> 闭包捕获环境</td></tr><tr><td><a href="./02-channels">消息传递与 Channel</a></td><td>通过通道在线程间安全传递数据</td></tr><tr><td><a href="./03-shared-state">共享状态：Arc 与 Mutex</a></td><td>多线程下安全共享和修改同一份数据</td></tr><tr><td><a href="./04-sync-send">Sync 与 Send Trait</a></td><td>线程安全背后的底层标记 Trait，编译期线程安全保证的来源</td></tr></tbody></table> 