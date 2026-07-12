---
title: "综合项目"
description: "综合项目实战 - 综合项目"
date: "2026-07-12"
order: 23000
tags: ["项目实战", "CLI", "Todo", "命令行", "文档", "Rust 综合"]
est_time: "5 分钟"
---

 <h2 id="构建一个命令行任务管理器">构建一个命令行任务管理器</h2>
<p>本章构建一个真正实用的命令行工具：<strong><code>rtodo</code></strong> —— <strong>一个可以在终端里增删查改任务的 Todo 管理器</strong>。</p>
<pre><code class="language-bash">$ rtodo add "写完 Rust 教程第三章"
✓ 已添加：[1] 写完 Rust 教程第三章

$ rtodo add "复习生命周期"
✓ 已添加：[2] 复习生命周期

$ rtodo list
  ID  状态  任务
  ──────────────────────────────────
  1   [ ]   写完 Rust 教程第三章
  2   [ ]   复习生命周期

$ rtodo search "生命"
搜索 "生命"，找到 1 条：
  ──────────────────────────────────
  2   [ ]   复习生命周期

$ rtodo done 1
✓ 已完成：[1] 写完 Rust 教程第三章

$ rtodo remove 1
✓ 已删除：[1] 写完 Rust 教程第三章</code></pre>
<p>任务数据保存在本地 JSON 文件里，重启终端后仍然保留。</p>
<h2 id="这个项目会用到什么">这个项目会用到什么</h2>
<table><thead><tr><th>知识点</th><th>在项目中的体现</th></tr></thead><tbody><tr><td>结构体 + impl</td><td><code>Todo { id, title, completed }</code> 及其方法</td></tr><tr><td>枚举</td><td><code>Command</code>（Add/List/Done/Remove/Search/Help）</td></tr><tr><td><code>Vec</code> 操作</td><td>增删改查任务列表</td></tr><tr><td><code>serde</code> + <code>serde_json</code></td><td>把任务列表序列化/反序列化为 JSON 文件</td></tr><tr><td>文件 I/O</td><td>读写 <code>~/.rtodo.json</code></td></tr><tr><td>错误处理（<code>Result</code> + <code>?</code>）</td><td>文件读写、参数解析的失败处理</td></tr><tr><td><code>std::env::args()</code></td><td>解析命令行参数</td></tr><tr><td>迭代器 + 闭包</td><td><code>.filter()</code> 搜索关键词、<code>.find()</code> 查 ID、<code>.position()</code> 定位下标</td></tr><tr><td><code>fmt::Display</code> trait</td><td>任务条目的格式化输出</td></tr><tr><td>单元测试</td><td>测试 CRUD 与搜索逻辑</td></tr></tbody></table>
<h2 id="本章结构">本章结构</h2>
<ol>
<li><strong>项目架构</strong> — Workspace 结构、两个 crate 的职责划分、搭建骨架</li>
<li><strong>解析命令行参数</strong> — <code>Command</code> 枚举、<code>lib.rs</code> + <code>main.rs</code> 并存、切片模式匹配</li>
<li><strong>数据建模</strong> — <code>Todo</code> 结构体、<code>TodoList</code>、用 <code>todo!()</code> 先规划接口</li>
<li><strong>实现 TodoList</strong> — TDD 方式逐个实现 CRUD 方法</li>
<li><strong>接入 run 函数</strong> — 连接解析层和数据层，跑通所有命令</li>
<li><strong>数据持久化</strong> — serde + JSON 文件读写，让数据在重启后保留</li>
<li><strong>体验优化</strong> — 改善错误信息、输出格式、Display trait 和彩色输出</li>
<li><strong>生成文档</strong> — <code>///</code> 文档注释、<code>cargo doc</code> 生成 HTML、文档测试</li>
</ol> 