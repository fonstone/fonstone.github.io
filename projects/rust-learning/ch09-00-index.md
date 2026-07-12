---
title: "错误处理"
description: "错误处理 - 错误处理"
date: "2026-07-12"
order: 9000
tags: ["错误处理", "panic", "Result", "?"]
est_time: "5 分钟"
---

 <p>不同于许多语言依赖异常（exception）机制，Rust 把错误分成两类：<strong>不可恢复错误</strong>（用 <code>panic!</code>）和<strong>可恢复错误</strong>（用 <code>Result&lt;T, E&gt;</code>）。这种区分让调用者清楚知道一个函数”可能失败”，并强制处理失败情况——错误处理从”猜测”变成了”明确”。</p>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>主要内容</th></tr></thead><tbody><tr><td><a href="./01-panic">panic! 与不可恢复错误</a></td><td>何时触发 panic，如何读懂 panic 输出与 backtrace</td></tr><tr><td><a href="./02-result">Result&lt;T, E&gt;</a></td><td>可恢复错误的表达方式，<code>unwrap</code>、<code>expect</code> 与模式匹配处理</td></tr><tr><td><a href="./03-question-mark">? 运算符</a></td><td>错误传播的语法糖，以及背后的 <code>From</code> 转换机制</td></tr><tr><td><a href="./04-when-to-panic">何时 panic，何时 Result</a></td><td>两种错误处理方式的决策框架，用类型编码不变量的思路</td></tr><tr><td><a href="./05-multiple-errors">多种错误来源</a></td><td><code>Box&lt;dyn Error&gt;</code> 处理多类错误，遍历集合时的错误处理策略</td></tr></tbody></table> 