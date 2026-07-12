---
title: "综合练习"
description: "闭包与迭代器 - 综合练习"
date: "2026-07-12"
order: 12005
tags: ["Iterator", "闭包", "filter", "map", "collect", "综合练习"]
est_time: "10 分钟"
---

 <h1 id="题目筛词并转换">题目：筛词并转换</h1>
<p>给定一段英文句子，找出所有长度<strong>大于</strong> <code>min_len</code> 的单词，转成大写后收集为 <code>Vec&lt;String&gt;</code>。</p>
<h2 id="参考实现for-循环版本">参考实现：for 循环版本</h2>
<div class="code-runner" data-full-code="fn%20long_words(text%3A%20%26str%2C%20min_len%3A%20usize)%20-%3E%20Vec%3CString%3E%20%7B%0A%20%20%20%20let%20mut%20result%20%3D%20Vec%3A%3Anew()%3B%0A%20%20%20%20for%20word%20in%20text.split_whitespace()%20%7B%0A%20%20%20%20%20%20%20%20if%20word.len()%20%3E%20min_len%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20result.push(word.to_uppercase())%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20result%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20sentence%20%3D%20%22the%20quick%20brown%20fox%20jumps%20over%20the%20lazy%20dog%22%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20long_words(sentence%2C%203))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn long_words(text: &amp;str, min_len: usize) -&gt; Vec&lt;String&gt; {
    let mut result = Vec::new();
    for word in text.split_whitespace() {
        if word.len() &gt; min_len {
            result.push(word.to_uppercase());
        }
    }
    result
}

fn main() {
    let sentence = "the quick brown fox jumps over the lazy dog";
    println!("{:?}", long_words(sentence, 3));
}</code></pre></div>
<h2 id="你的任务改写为迭代器版本">你的任务：改写为迭代器版本</h2>
<p>用 <code>split_whitespace()</code>、<code>filter</code>、<code>map</code>、<code>collect</code> 以及闭包重写，结果与上面完全一致：</p>
<div class="code-editor" data-block-id="12-closures-iterators/05-practice#0:0" data-expect-mode="literal" data-expect-pattern="%5B%22QUICK%22%2C%20%22BROWN%22%2C%20%22JUMPS%22%2C%20%22OVER%22%2C%20%22LAZY%22%5D" data-starter-code="fn%20long_words_iter(text%3A%20%26str%2C%20min_len%3A%20usize)%20-%3E%20Vec%3CString%3E%20%7B%0A%20%20%20%20%2F%2F%20TODO%0A%20%20%20%20todo!()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20sentence%20%3D%20%22the%20quick%20brown%20fox%20jumps%20over%20the%20lazy%20dog%22%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20long_words_iter(sentence%2C%203))%3B%0A%7D"><pre><code class="language-rust">fn long_words_iter(text: &amp;str, min_len: usize) -&gt; Vec&lt;String&gt; {
    // TODO
    todo!()
}

fn main() {
    let sentence = "the quick brown fox jumps over the lazy dog";
    println!("{:?}", long_words_iter(sentence, 3));
}</code></pre></div> 