---
title: "安全抽象"
description: "Unsafe Rust - 安全抽象"
date: "2026-07-12"
order: 18004
tags: ["安全抽象", "封装 unsafe", "API 设计"]
est_time: "30 分钟"
---

 <h2 id="出发点">出发点</h2>
<p><code>Vec</code>、<code>String</code>、<code>Arc</code> 内部全都用了 unsafe——但你作为使用者从来不需要写 <code>unsafe</code> 就能用它们。这不是魔法，而是一种设计模式：<strong>unsafe 实现，safe 接口</strong>。</p>
<p>目标很简单：把 unsafe 的复杂性关在函数内部，让调用方看到的只是普通的安全函数。</p>
<h2 id="为什么不能直接暴露-unsafe">为什么不能直接暴露 unsafe？</h2>
<p>先看一个反例：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E4%B8%8D%E5%A5%BD%E7%9A%84%E5%81%9A%E6%B3%95%EF%BC%9Aunsafe%20%E6%B3%84%E6%BC%8F%E5%88%B0%E5%85%AC%E5%85%B1%E6%8E%A5%E5%8F%A3%EF%BC%8C%E8%B0%83%E7%94%A8%E8%80%85%E8%A6%81%E8%87%AA%E5%B7%B1%E4%BF%9D%E8%AF%81%E4%B8%80%E5%88%87%0Apub%20unsafe%20fn%20get_element(ptr%3A%20*const%20i32%2C%20idx%3A%20usize)%20-%3E%20i32%20%7B%0A%20%20%20%20unsafe%20%7B%20*ptr.add(idx)%20%7D%0A%7D%0A%0A%2F%2F%20%E5%A5%BD%E7%9A%84%E5%81%9A%E6%B3%95%EF%BC%9A%E9%AA%8C%E8%AF%81%E6%94%BE%E5%9C%A8%E5%87%BD%E6%95%B0%E5%86%85%E9%83%A8%EF%BC%8Cunsafe%20%E4%B8%8D%E5%87%BA%E9%97%A8%0Apub%20fn%20get_safe(slice%3A%20%26%5Bi32%5D%2C%20idx%3A%20usize)%20-%3E%20Option%3Ci32%3E%20%7B%0A%20%20%20%20if%20idx%20%3C%20slice.len()%20%7B%0A%20%20%20%20%20%20%20%20Some(unsafe%20%7B%20*slice.as_ptr().add(idx)%20%7D)%0A%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20None%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20arr%20%3D%20%5B10%2C%2020%2C%2030%5D%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20get_safe(%26arr%2C%201))%3B%20%2F%2F%20Some(20)%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20get_safe(%26arr%2C%209))%3B%20%2F%2F%20None%0A%7D" data-mode="run"><pre><code class="language-rust">// 不好的做法：unsafe 泄漏到公共接口，调用者要自己保证一切
pub unsafe fn get_element(ptr: *const i32, idx: usize) -&gt; i32 {
    unsafe { *ptr.add(idx) }
}

// 好的做法：验证放在函数内部，unsafe 不出门
pub fn get_safe(slice: &amp;[i32], idx: usize) -&gt; Option&lt;i32&gt; {
    if idx &lt; slice.len() {
        Some(unsafe { *slice.as_ptr().add(idx) })
    } else {
        None
    }
}

fn main() {
    let arr = [10, 20, 30];
    println!("{:?}", get_safe(&amp;arr, 1)); // Some(20)
    println!("{:?}", get_safe(&amp;arr, 9)); // None
}</code></pre></div>
<p><code>get_element</code> 把”保证 ptr 有效、idx 在界内”的责任完全推给了每一个调用者——每次调用都要写 unsafe，每次都要自己小心。<code>get_safe</code> 把验证逻辑放在函数里，unsafe 只出现一次，调用方完全不感知。</p>
<h2 id="不变量unsafe-代码依赖的规矩">不变量：unsafe 代码依赖的规矩</h2>
<p>那函数内部的 unsafe 为什么安全？因为有<strong>不变量</strong>（invariant）在守护。</p>
<p>不变量是你的代码对自己立下的规矩——一条永远必须成立的条件。上面 <code>get_safe</code> 的不变量是：进入 unsafe 块之前，<code>idx &lt; slice.len()</code> 一定成立。只要这条成立，<code>slice.as_ptr().add(idx)</code> 就不会越界，解引用就是合法的。</p>
<p>用一个生活类比建立直觉：银行账户有一条不变量”余额 ≥ 0”。取款操作在扣钱之前会先检查余额是否足够——这个检查就是在维护不变量。如果跳过检查直接扣钱，账户就进入了”不合法状态”，后续一切计算都可能出错。</p>
<p>unsafe 代码里的不变量是一样的道理，只是”不合法状态”变成了”未定义行为”。</p>
<h2 id="封装的作用">封装的作用</h2>
<p>理解了不变量，封装的意义就很清楚了：</p>
<p><strong>封装 = 让外部代码没有机会打破不变量。</strong></p>
<p>如果字段是 <code>pub</code> 的，任何人都能把 <code>len</code> 改大、把指针改成 null——不变量随时可能被破坏。把字段设为私有，只通过你控制的方法访问，就能保证每次修改都经过你的检查。</p>
<h2 id="一个完整的例子">一个完整的例子</h2>
<p><code>split_at_mut</code> 是标准库里的经典案例——把一个可变 slice 从中间分成两段，各自可变：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Aslice%3B%0A%0Afn%20split_at_mut(slice%3A%20%26mut%20%5Bi32%5D%2C%20mid%3A%20usize)%20-%3E%20(%26mut%20%5Bi32%5D%2C%20%26mut%20%5Bi32%5D)%20%7B%0A%20%20%20%20let%20len%20%3D%20slice.len()%3B%0A%20%20%20%20let%20ptr%20%3D%20slice.as_mut_ptr()%3B%0A%0A%20%20%20%20%2F%2F%20%E4%B8%8D%E5%8F%98%E9%87%8F%EF%BC%9Amid%20%3C%3D%20len%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E8%A6%81%E6%88%90%E7%AB%8B%EF%BC%8C%E4%B8%A4%E6%AE%B5%E5%86%85%E5%AD%98%E5%B0%B1%E4%B8%8D%E9%87%8D%E5%8F%A0%EF%BC%8C%E5%90%8C%E6%97%B6%E6%8C%81%E6%9C%89%E4%B8%A4%E4%B8%AA%E5%8F%AF%E5%8F%98%E5%BC%95%E7%94%A8%E6%98%AF%E5%AE%89%E5%85%A8%E7%9A%84%0A%20%20%20%20assert!(mid%20%3C%3D%20len)%3B%0A%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20(%0A%20%20%20%20%20%20%20%20%20%20%20%20slice%3A%3Afrom_raw_parts_mut(ptr%2C%20mid)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20slice%3A%3Afrom_raw_parts_mut(ptr.add(mid)%2C%20len%20-%20mid)%2C%0A%20%20%20%20%20%20%20%20)%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20let%20(left%2C%20right)%20%3D%20split_at_mut(%26mut%20v%2C%203)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20left)%3B%20%20%2F%2F%20%5B1%2C%202%2C%203%5D%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20right)%3B%20%2F%2F%20%5B4%2C%205%5D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::slice;

fn split_at_mut(slice: &amp;mut [i32], mid: usize) -&gt; (&amp;mut [i32], &amp;mut [i32]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    // 不变量：mid &lt;= len
    // 只要成立，两段内存就不重叠，同时持有两个可变引用是安全的
    assert!(mid &lt;= len);

    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut v = [1, 2, 3, 4, 5];
    let (left, right) = split_at_mut(&amp;mut v, 3);
    println!("{:?}", left);  // [1, 2, 3]
    println!("{:?}", right); // [4, 5]
}</code></pre></div>
<p>这段代码如果只用安全 Rust 来写，编译器会拒绝——它看到的是”同一个 slice 被借用了两次”，不知道两段不重叠。但我们知道，所以用 <code>assert!</code> 强制维护不变量，再用 unsafe 告诉编译器”我检查过了”。</p>
<p>调用方看到的只是一个普通函数，完全不需要接触 unsafe。</p>
<h2 id="小结">小结</h2>
<p>三件事缺一不可：</p>
<ol>
<li><strong>识别不变量</strong>：unsafe 代码正确运行依赖哪条必须成立的条件</li>
<li><strong>维护不变量</strong>：在进入 unsafe 之前，用检查（assert、if）或类型系统确保条件成立</li>
<li><strong>封装 unsafe</strong>：把危险操作藏在函数内部，对外只暴露安全接口</li>
</ol>
<p>这就是标准库里每一个用了 unsafe 的类型和函数都在做的事。</p> 