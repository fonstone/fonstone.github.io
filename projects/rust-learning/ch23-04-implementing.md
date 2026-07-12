---
title: "实现 TodoList"
description: "综合项目实战 - 实现 TodoList"
date: "2026-07-12"
order: 23004
tags: ["TDD", "测试驱动", "impl", "迭代器", "命令分发", "run函数"]
est_time: "35 分钟"
---

 <h1 id="先写测试">先写测试</h1>
<p>上一章用 <code>todo!()</code> 把方法签名占好了，但具体行为还没有定义。TDD 的做法是：先写测试描述每个方法<strong>应该</strong>有什么行为，再写实现让测试通过。</p>
<p>在 <code>rtodo-core/src/lib.rs</code> 末尾添加测试模块：</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — 文件末尾添加
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_stores_title_and_sets_id() {
        let mut list = TodoList::new();
        let todo = list.add("写代码".to_string());
        assert_eq!(todo.title, "写代码");
        assert_eq!(todo.id, 1);
        assert!(!todo.completed);
    }

    #[test]
    fn test_add_increments_id() {
        let mut list = TodoList::new();
        list.add("第一条".to_string());
        let todo = list.add("第二条".to_string());
        assert_eq!(todo.id, 2);
    }

    #[test]
    fn test_all_returns_all_todos() {
        let mut list = TodoList::new();
        list.add("任务一".to_string());
        list.add("任务二".to_string());
        assert_eq!(list.all().len(), 2);
    }

    #[test]
    fn test_mark_done_sets_completed() {
        let mut list = TodoList::new();
        list.add("任务".to_string());
        assert!(list.mark_done(1).is_ok());
        assert!(list.all()[0].completed);
    }

    #[test]
    fn test_mark_done_not_found() {
        let mut list = TodoList::new();
        assert!(list.mark_done(99).is_err());
    }

    #[test]
    fn test_remove_returns_todo_and_shrinks_list() {
        let mut list = TodoList::new();
        list.add("任务".to_string());
        let removed = list.remove(1).unwrap();
        assert_eq!(removed.title, "任务");
        assert_eq!(list.all().len(), 0);
    }

    #[test]
    fn test_remove_not_found() {
        let mut list = TodoList::new();
        assert!(list.remove(99).is_err());
    }

    #[test]
    fn test_search_case_insensitive() {
        let mut list = TodoList::new();
        list.add("学习 Rust 编程".to_string());
        assert_eq!(list.search("rust").len(), 1);
        assert_eq!(list.search("RUST").len(), 1);
        assert_eq!(list.search("Python").len(), 0);
    }
}</code></pre>
<p>运行测试，所有用例都会因为 <code>todo!()</code> panic 而失败：</p>
<pre><code class="language-bash">cargo test -p rtodo-core</code></pre>
<p>先红后绿——这是正常的，下面逐个填实现。</p>
<h1 id="逐个实现方法">逐个实现方法</h1>
<h2 id="next_id">next_id</h2>
<p><code>add</code> 需要一个自增 ID，先实现私有的 <code>next_id</code>：找出当前所有任务里最大的 ID，加 1。</p>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl TodoList 内，替换 next_id 的 todo!()
fn next_id(&amp;self) -&gt; u32 {
    self.todos.iter().map(|t| t.id).max().unwrap_or(0) + 1
}</code></pre>
<p><code>.map(|t| t.id)</code> 把每条任务映射成 ID 值，<code>.max()</code> 返回 <code>Option&lt;u32&gt;</code>——列表为空时没有最大值，返回 <code>None</code>。<code>unwrap_or(0)</code> 在空列表时给出默认值 0，加 1 后第一个 ID 就是 1。</p>
<p>为什么不用 <code>len() + 1</code>？删除任务后 <code>len()</code> 减小，新 ID 可能和已有 ID 重复。比如添加两条再删第一条，<code>len() = 1</code>，<code>len() + 1 = 2</code>，而 id=2 的任务还在。<code>max() + 1</code> 只看当前最大值，不受删除影响。</p>
<h2 id="all">all</h2>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl TodoList 内，替换 all 的 todo!()
pub fn all(&amp;self) -&gt; &amp;[Todo] {
    &amp;self.todos
}</code></pre>
<p><code>&amp;self.todos</code> 把 <code>Vec&lt;Todo&gt;</code> 转成 <code>&amp;[Todo]</code> 切片引用。<code>Vec</code> 实现了 <code>Deref&lt;Target = [T]&gt;</code>，加 <code>&amp;</code> 会自动转换。调用方能遍历切片，但无法直接往里 push 或 remove，数据修改只能通过方法。</p>
<h2 id="add">add</h2>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl TodoList 内，替换 add 的 todo!()
pub fn add(&amp;mut self, title: String) -&gt; &amp;Todo {
    let id = self.next_id();
    self.todos.push(Todo::new(id, title));
    self.todos.last().unwrap()
}</code></pre>
<p><code>&amp;mut self</code> 是因为要修改 <code>self.todos</code>——只要方法改变字段，就必须声明 <code>&amp;mut self</code>，否则编译报错。</p>
<p><code>push</code> 把新任务推入 Vec 末尾，<code>last()</code> 取末尾元素的引用。刚 push 进去所以一定存在，<code>unwrap()</code> 不会 panic。</p>
<h2 id="mark_done">mark_done</h2>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl TodoList 内，替换 mark_done 的 todo!()
pub fn mark_done(&amp;mut self, id: u32) -&gt; Result&lt;(), String&gt; {
    let todo = self.todos.iter_mut()
        .find(|t| t.id == id)
        .ok_or("找不到对应任务".to_string())?;

    if todo.completed {
        return Err("任务已经完成了".to_string());
    }

    todo.completed = true;
    Ok(())
}</code></pre>
<p><code>iter_mut()</code> 返回可变引用的迭代器，<code>.find()</code> 找到第一个满足条件的元素，返回 <code>Option&lt;&amp;mut Todo&gt;</code>。<code>.ok_or_else(|| ...)</code> 把 <code>Option</code> 转成 <code>Result</code>——找不到时生成错误字符串，<code>?</code> 向上传播。</p>
<p><code>if todo.completed</code> 提前检查重复标记，已完成的任务再次标记直接报错，而不是静默忽略。</p>
<h2 id="remove">remove</h2>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl TodoList 内，替换 remove 的 todo!()
pub fn remove(&amp;mut self, id: u32) -&gt; Result&lt;Todo, String&gt; {
    let pos = self.todos.iter()
        .position(|t| t.id == id)
        .ok_or("找不到对应任务".to_string())?;

    Ok(self.todos.remove(pos))
}</code></pre>
<p>这里用 <code>.position()</code> 而不是 <code>.find()</code>，因为 <code>Vec::remove</code> 需要<strong>下标</strong>（<code>usize</code>），不是元素引用。<code>Vec::remove(pos)</code> 把元素从 Vec 里移出并返回所有权，其余元素向前填补空位。</p>
<h2 id="search">search</h2>
<pre><code class="language-rust">// rtodo-core/src/lib.rs — impl TodoList 内，替换 search 的 todo!()
pub fn search(&amp;self, query: &amp;str) -&gt; Vec&lt;&amp;Todo&gt; {
    let query_lower = query.to_lowercase();
    self.todos.iter()
        .filter(|t| t.title.to_lowercase().contains(&amp;query_lower))
        .collect()
}</code></pre>
<p>把 <code>query</code> 转小写存在闭包外，避免每次迭代都重复转换。每条任务的标题也转小写再比对，这样 <code>"rust"</code> 和 <code>"Rust"</code> 都能匹配到同一条任务。</p>
<h2 id="确认测试全绿">确认测试全绿</h2>
<p>所有 <code>todo!()</code> 替换完后运行：</p>
<pre><code class="language-bash">cargo test -p rtodo-core</code></pre>
<p>8 个测试全部通过，说明实现和签名完全吻合。下一章把数据层接入 <code>run()</code> 让程序真正可以运行。</p> 