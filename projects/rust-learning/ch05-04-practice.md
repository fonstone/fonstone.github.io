---
title: "综合练习"
description: "标准库类型 - 综合练习"
date: "2026-07-12"
order: 5004
tags: ["向量", "字符串", "哈希表", "综合应用", "所有权", "集合"]
est_time: "50 分钟"
---

 <h1 id="代码判断题">代码判断题</h1>
<h2 id="题目-1向量与所有权">题目 1：向量与所有权</h2>
<pre><code class="language-rust">fn main() {
    let mut vec = vec![1, 2, 3];
    let first = &amp;vec[0];

    vec.push(4);

    println!("{}", first);
}</code></pre>
</div>
<h2 id="题目-2string-与-str-的区别">题目 2：String 与 &amp;str 的区别</h2>
<pre><code class="language-rust">fn modify_string(s: &amp;mut String) {
    s.push_str("!");
}

fn main() {
    let s = "Hello";
    modify_string(s);
}</code></pre>
</div>
<h2 id="题目-3hashmap-的所有权转移">题目 3：HashMap 的所有权转移</h2>
<pre><code class="language-rust">use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    let key = String::from("name");

    map.insert(key, "Alice");

    println!("{}", key);
}</code></pre>
</div>
<h2 id="题目-4向量的迭代与修改">题目 4：向量的迭代与修改</h2>
<pre><code class="language-rust">fn main() {
    let mut vec = vec![1, 2, 3];

    for val in &amp;vec {
        if *val == 2 {
            vec.push(4);
        }
    }
}</code></pre>
</div>
<h2 id="题目-5字符串查找">题目 5：字符串查找</h2>
<pre><code class="language-rust">fn main() {
    let s = String::from("hello");
    let sub = "ll";

    if s.contains(sub) {
        println!("找到了");
    }
}</code></pre>
</div>
<hr/>
<h1 id="编程练习">编程练习</h1>
<h2 id="练习-1向量去重">练习 1：向量去重</h2>
<p>从一个向量中移除所有重复的元素，保留第一次出现的值。</p>
<p><strong>任务：</strong></p>
<ul>
<li>实现 <code>deduplicate()</code> 函数，接收 <code>Vec&lt;i32&gt;</code>，返回去重后的新向量</li>
<li>只保留每个值的第一次出现</li>
</ul>
<p><strong>格式要求：</strong></p>
<ul>
<li>输入：<code>[1, 2, 2, 3, 1, 4, 3]</code></li>
<li>输出：<code>[1, 2, 3, 4]</code></li>
</ul>
<p><strong>提示：</strong></p>
<ul>
<li>可以创建一个新的空向量</li>
<li>遍历原向量，检查元素是否已在结果向量中</li>
<li><code>vec.contains(&amp;x)</code> 可以检查是否存在</li>
</ul>
<div class="code-editor" data-block-id="05-stdlib-types/04-practice#1:0" data-expect-mode="literal" data-expect-pattern="%5B1%2C%202%2C%203%2C%204%5D" data-starter-code="fn%20deduplicate(vec%3A%20Vec%3Ci32%3E)%20-%3E%20Vec%3Ci32%3E%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%88%9B%E5%BB%BA%E7%BB%93%E6%9E%9C%E5%90%91%E9%87%8F%EF%BC%8C%E9%81%8D%E5%8E%86%E5%8E%9F%E5%90%91%E9%87%8F%E5%8E%BB%E9%87%8D%0A%20%20%20%20Vec%3A%3Anew()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20nums%20%3D%20vec!%5B1%2C%202%2C%202%2C%203%2C%201%2C%204%2C%203%5D%3B%0A%20%20%20%20let%20result%20%3D%20deduplicate(nums)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20result)%3B%0A%7D"><pre><code class="language-rust">fn deduplicate(vec: Vec&lt;i32&gt;) -&gt; Vec&lt;i32&gt; {
    // TODO: 创建结果向量，遍历原向量去重
    Vec::new()
}

fn main() {
    let nums = vec![1, 2, 2, 3, 1, 4, 3];
    let result = deduplicate(nums);
    println!("{:?}", result);
}</code></pre></div>
<h2 id="练习-2单词频率统计">练习 2：单词频率统计</h2>
<p>统计文本中每个单词出现的次数，输出频率最高的单词。</p>
<p><strong>任务：</strong></p>
<ul>
<li>实现 <code>most_frequent_word()</code> 函数，接收 <code>&amp;str</code></li>
<li>返回出现次数最多的单词和出现次数</li>
<li>格式：<code>"{word}" 出现了 {count} 次</code></li>
<li>假设单词用空格分隔</li>
</ul>
<p><strong>格式要求：</strong></p>
<ul>
<li>输入：<code>"the cat and the dog and the bird"</code></li>
<li>输出：<code>"the" 出现了 3 次</code></li>
</ul>
<p><strong>提示：</strong></p>
<ul>
<li>用 <code>split_whitespace()</code> 方法分割单词</li>
<li>使用 HashMap 存储单词计数</li>
<li>使用 <code>entry().and_modify().or_insert()</code> 更新计数</li>
<li>找出最大值</li>
</ul>
<div class="code-editor" data-block-id="05-stdlib-types/04-practice#1:1" data-expect-mode="literal" data-expect-pattern="%22the%22%20%E5%87%BA%E7%8E%B0%E4%BA%86%203%20%E6%AC%A1" data-starter-code="use%20std%3A%3Acollections%3A%3AHashMap%3B%0A%0Afn%20most_frequent_word(text%3A%20%26str)%20-%3E%20String%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E7%BB%9F%E8%AE%A1%E5%8D%95%E8%AF%8D%E9%A2%91%E7%8E%87%EF%BC%8C%E8%BF%94%E5%9B%9E%E9%A2%91%E7%8E%87%E6%9C%80%E9%AB%98%E7%9A%84%E5%8D%95%E8%AF%8D%0A%20%20%20%20String%3A%3Anew()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20text%20%3D%20%22the%20cat%20and%20the%20dog%20and%20the%20bird%22%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20most_frequent_word(text))%3B%0A%7D"><pre><code class="language-rust">use std::collections::HashMap;

fn most_frequent_word(text: &amp;str) -&gt; String {
    // TODO: 统计单词频率，返回频率最高的单词
    String::new()
}

fn main() {
    let text = "the cat and the dog and the bird";
    println!("{}", most_frequent_word(text));
}</code></pre></div> 