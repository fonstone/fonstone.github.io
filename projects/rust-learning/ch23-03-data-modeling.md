---
title: "数据建模"
description: "综合项目实战 - 数据建模"
date: "2026-07-12"
order: 23003
tags: ["数据建模", "结构体", "Vec", "TDD", "方法签名", "impl"]
est_time: "30 分钟"
---

 <h1 id="设计-todo-结构体">设计 Todo 结构体</h1>
<p>一条任务需要存储哪些数据？从上一章的命令设计反推：</p>
<ul>
<li><code>done 1</code>、<code>remove 2</code> 需要通过 ID 找到任务 → 需要<strong>唯一 ID</strong></li>
<li><code>add "写代码"</code> 需要存储标题 → 需要<strong>标题</strong></li>
<li><code>list</code> 需要显示完成状态 → 需要<strong>是否完成</strong></li>
</ul>
<p>把这三个属性翻译成 Rust 结构体。打开 <code>rtodo-core/src/lib.rs</code>，把默认内容删掉，写入：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — 把默认内容删掉，写入以下代码
pub struct Todo {
    pub id: u32,
    pub title: String,
    pub completed: bool,
}</code></pre>
<p><code>id</code> 用 <code>u32</code> 因为任务 ID 不会是负数。字段和结构体都加 <code>pub</code>，让 <code>rtodo</code> bin crate 能访问。</p>
<p>新建任务时 <code>completed</code> 总是 <code>false</code>，用一个关联函数封装这个约定，调用方就不需要每次手写 <code>completed: false</code>：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — Todo 定义之后写入
impl Todo {
    pub fn new(id: u32, title: String) -&gt; Self {
        Todo { id, title, completed: false }
    }
}</code></pre>
<h1 id="定义任务列表结构体">定义任务列表结构体</h1>
<p>任务列表就是一组 <code>Todo</code>，用 <code>Vec&lt;Todo&gt;</code> 存储。把它封装进一个结构体 <code>TodoList</code>：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl Todo 之后写入
pub struct TodoList {
    todos: Vec&lt;Todo&gt;,
}</code></pre>
<p><code>todos</code> 是私有字段，外部不能直接操作 Vec，只能通过方法访问。这样可以保证所有改动都经过我们定义的方法，不会绕过。</p>
<p>直接用 <code>Vec&lt;Todo&gt;</code> 完全可以跑通，但包一层结构体有好处：所有操作都挂在 <code>TodoList</code> 的方法上，调用方只和 <code>list</code> 打交道；下一章要加 <code>path</code> 字段时，也不需要改任何调用方的代码。</p>
<h1 id="规划方法签名">规划方法签名</h1>
<p>在写具体实现之前，先把所有方法的签名（函数名、参数、返回值）规划好，填 <code>todo!()</code> 占位。这样可以先验证接口设计合不合理，再去填逻辑。</p>
<p>在 <code>rtodo-core/src/lib.rs</code> 里添加：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — TodoList 定义之后写入（含全部 todo!() 占位）
impl TodoList {
    /// 创建空任务列表
    pub fn new() -&gt; Self {
        TodoList { todos: Vec::new() }
    }

    /// 返回所有任务的只读切片
    pub fn all(&amp;self) -&gt; &amp;[Todo] {
        todo!()
    }

    /// 添加新任务，返回刚添加那条的引用（用于打印确认信息）
    pub fn add(&amp;mut self, title: String) -&gt; &amp;Todo {
        todo!()
    }

    /// 将指定 ID 的任务标记为完成；ID 不存在或已完成时返回错误
    pub fn mark_done(&amp;mut self, id: u32) -&gt; Result&lt;(), String&gt; {
        todo!()
    }

    /// 删除指定 ID 的任务并返回它；ID 不存在时返回错误
    pub fn remove(&amp;mut self, id: u32) -&gt; Result&lt;Todo, String&gt; {
        todo!()
    }

    /// 搜索标题包含 query 的任务（大小写不敏感），返回引用列表
    pub fn search(&amp;self, query: &amp;str) -&gt; Vec&lt;&amp;Todo&gt; {
        todo!()
    }

    /// 生成下一个可用 ID（当前最大 ID + 1，空列表时返回 1）
    fn next_id(&amp;self) -&gt; u32 {
        todo!()
    }
}</code></pre>
<p><code>todo!()</code> 是 Rust 内置宏，表示”这里还没实现”，编译能通过，运行时会 panic 并打印位置信息。先把骨架写出来，再逐个填逻辑，不会被细节打断思路。</p>
<p>每个方法的设计思路：</p>
<p><strong><code>all()</code></strong>：返回 <code>&amp;[Todo]</code> 切片引用，不是 <code>Vec&lt;Todo&gt;</code>。切片是对内部数据的只读视图，调用方能遍历，但不能直接增删元素。</p>
<p><strong><code>add()</code></strong>：接受 <code>String</code>（拥有所有权），返回 <code>&amp;Todo</code>（刚添加那条的引用）。返回引用而不是 <code>()</code> 是为了让调用方能打印”已添加：[1] 写代码”。</p>
<p><strong><code>mark_done()</code></strong>：返回 <code>Result&lt;(), String&gt;</code>——标记完成后调用方只需要知道成功了，不需要拿到任务数据。</p>
<p><strong><code>remove()</code></strong>：返回 <code>Result&lt;Todo, String&gt;</code>，而不是 <code>Result&lt;&amp;Todo, String&gt;</code>——删除后元素从 Vec 里移出，所有权交给调用方，引用就无处指向了，所以必须返回所有权。</p>
<p><strong><code>search()</code></strong>：返回 <code>Vec&lt;&amp;Todo&gt;</code>，只传递引用，不复制数据。</p>
<p><strong><code>next_id()</code></strong>：私有方法，只给 <code>add()</code> 内部用，不加 <code>pub</code>。</p>
<h2 id="编译验证">编译验证</h2>
<pre><code class="language-bash">cargo build</code></pre>
<p>用 <code>todo!()</code> 占位后编译依然能通过，说明接口设计没有类型错误。下一章用 TDD 逐个填入实现。</p> 