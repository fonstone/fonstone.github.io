---
title: "调试"
description: "调试 - 调试"
date: "2026-07-12"
order: 16000
tags: ["调试", "dbg!", "调试器", "日志", "log", "env_logger"]
est_time: "5 分钟"
---

 <p>程序出 bug 是家常便饭。新手的第一反应通常是疯狂插入 <code>println!</code>——这能解决问题，但 Rust 提供了更好的工具：<code>dbg!</code> 宏快速定位逻辑错误，IDE 调试器用于复杂 bug 的单步排查，结构化日志让长期运行的程序留下可过滤的诊断信息。</p>
<blockquote>
<p>调试能力是工程师的核心素养。掌握这些工具，遇到 bug 不再靠”感觉”，而是靠系统化排查。</p>
</blockquote>
<h2 id="本章目录">本章目录</h2>
<table><thead><tr><th>文章</th><th>适合什么情况</th></tr></thead><tbody><tr><td><a href="./01-dbg-macro">dbg! 宏</a></td><td>临时查看表达式的值，快速定位逻辑错误</td></tr><tr><td><a href="./02-ide-debugger">IDE 调试器</a></td><td>需要单步执行、观察多个变量状态的复杂 bug</td></tr><tr><td><a href="./03-logging">日志输出</a></td><td>长期运行的程序或库代码，需要可控的诊断信息</td></tr></tbody></table> 