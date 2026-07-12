---
title: "RefCell<T> 与内部可变性"
description: "智能指针 - RefCell<T> 与内部可变性"
date: "2026-07-12"
order: 13004
tags: ["RefCell", "内部可变性", "运行时借用检查", "Rc<RefCell<T>>"]
est_time: "25 分钟"
---

 <h1 id="什么是内部可变性">什么是内部可变性？</h1>
<p>Rust 的借用规则很明确：当你拥有一个不可变引用 <code>&amp;T</code> 时，你不能同时拥有可变引用 <code>&amp;mut T</code>。这条规则防止了数据竞争，是内存安全的核心保障。</p>
<p>然而，在某些合理的设计场景中，这条规则会成为阻碍。<strong>内部可变性</strong> (Interior Mutability) 是一种设计模式，它允许你即使在持有不可变引用时，也能修改数据内部的值。</p>
<p>这听起来像是在绕开 Rust 的安全保障，实际上并非如此。<code>RefCell&lt;T&gt;</code> 并没有绕过借用规则，它只是将借用检查从<strong>编译时</strong>推迟到了<strong>运行时</strong>。如果运行时违反了规则，程序会 Panic 而不是产生未定义行为。</p>
<h2 id="refcellt运行时的借用检查"><code>RefCell&lt;T&gt;</code>：运行时的借用检查</h2>
<p>让我们先来理解 <code>Box&lt;T&gt;</code>、<code>Rc&lt;T&gt;</code> 和 <code>RefCell&lt;T&gt;</code> 之间的核心差异：</p>
<table><thead><tr><th>类型</th><th>所有者数量</th><th>借用检查时机</th><th>可变性</th></tr></thead><tbody><tr><td><code>Box&lt;T&gt;</code></td><td>唯一</td><td>编译时</td><td>可变或不可变</td></tr><tr><td><code>Rc&lt;T&gt;</code></td><td>多个</td><td>编译时</td><td>仅不可变</td></tr><tr><td><code>RefCell&lt;T&gt;</code></td><td>唯一</td><td><strong>运行时</strong></td><td>可变或不可变</td></tr></tbody></table>
<p><code>RefCell&lt;T&gt;</code> 提供了两个核心方法：</p>
<ul>
<li><strong><code>borrow()</code></strong>：返回 <code>Ref&lt;T&gt;</code>，行为类似不可变引用 <code>&amp;T</code>。</li>
<li><strong><code>borrow_mut()</code></strong>：返回 <code>RefMut&lt;T&gt;</code>，行为类似可变引用 <code>&amp;mut T</code>。</li>
</ul>
<p><code>RefCell&lt;T&gt;</code> 在内部维护一个计数器，追踪当前活跃的 <code>Ref&lt;T&gt;</code> 和 <code>RefMut&lt;T&gt;</code> 的数量。规则和编译期一样：可以同时有多个 <code>Ref&lt;T&gt;</code>，但 <code>RefMut&lt;T&gt;</code> 必须独占。如果违反，程序会 Panic：</p>
<pre><code class="language-text">thread 'main' panicked at 'already borrowed: BorrowMutError'</code></pre>
<h3 id="何时选择-refcellt">何时选择 <code>RefCell&lt;T&gt;</code></h3>
<p>当你<strong>确信</strong>代码在运行时不会违反借用规则，但编译器因为其分析的保守性而无法证明这一点时，<code>RefCell&lt;T&gt;</code> 是正确的选择。</p>
<h1 id="内部可变性实战">内部可变性实战</h1>
<p>最直接的场景：一个计数器，需要在只有 <code>&amp;self</code> 的方法里更新自身状态。</p>
<h2 id="直接修改编译失败">直接修改（编译失败）</h2>
<pre><code class="language-rust">struct Counter {
    count: i32,
}

impl Counter {
    // &amp;self 而非 &amp;mut self
    fn increment(&amp;self) {
        self.count += 1; // 编译错误：不能通过不可变引用修改字段
    }
}</code></pre>
<h2 id="用-refcellt-解决">用 <code>RefCell&lt;T&gt;</code> 解决</h2>
<div class="code-runner" data-full-code="use%20std%3A%3Acell%3A%3ARefCell%3B%0A%0Astruct%20Counter%20%7B%0A%20%20%20%20count%3A%20RefCell%3Ci32%3E%2C%0A%7D%0A%0Aimpl%20Counter%20%7B%0A%20%20%20%20fn%20new()%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20Counter%20%7B%20count%3A%20RefCell%3A%3Anew(0)%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E7%AD%BE%E5%90%8D%E4%BB%8D%E6%98%AF%20%26self%EF%BC%8C%E4%BD%86%E5%86%85%E9%83%A8%E5%8F%AF%E4%BB%A5%E4%BF%AE%E6%94%B9%0A%20%20%20%20fn%20increment(%26self)%20%7B%0A%20%20%20%20%20%20%20%20*self.count.borrow_mut()%20%2B%3D%201%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20value(%26self)%20-%3E%20i32%20%7B%0A%20%20%20%20%20%20%20%20*self.count.borrow()%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20c%20%3D%20Counter%3A%3Anew()%3B%0A%20%20%20%20c.increment()%3B%0A%20%20%20%20c.increment()%3B%0A%20%20%20%20c.increment()%3B%0A%20%20%20%20println!(%22%E8%AE%A1%E6%95%B0%3A%20%7B%7D%22%2C%20c.value())%3B%20%2F%2F%203%0A%7D" data-mode="run"><pre><code class="language-rust">use std::cell::RefCell;

struct Counter {
    count: RefCell&lt;i32&gt;,
}

impl Counter {
    fn new() -&gt; Self {
        Counter { count: RefCell::new(0) }
    }

    // 签名仍是 &amp;self，但内部可以修改
    fn increment(&amp;self) {
        *self.count.borrow_mut() += 1;
    }

    fn value(&amp;self) -&gt; i32 {
        *self.count.borrow()
    }
}

fn main() {
    let c = Counter::new();
    c.increment();
    c.increment();
    c.increment();
    println!("计数: {}", c.value()); // 3
}</code></pre></div>
<p><code>borrow_mut()</code> 返回一个 <code>RefMut&lt;T&gt;</code> 智能指针，通过 <code>*</code> 解引用后就可以修改内部值，用完后自动归还借用权。<code>borrow()</code> 同理，返回 <code>Ref&lt;T&gt;</code> 用于只读访问。</p>
<h1 id="rcrefcellt共享且可变"><code>Rc&lt;RefCell&lt;T&gt;&gt;</code>：共享且可变</h1>
<p><code>Rc&lt;T&gt;</code> 和 <code>RefCell&lt;T&gt;</code> 结合是 Rust 中一个非常强大的模式：</p>
<ul>
<li><code>Rc&lt;T&gt;</code> 解决了<strong>多所有者</strong>的问题</li>
<li><code>RefCell&lt;T&gt;</code> 解决了<strong>可变性</strong>的问题</li>
</ul>
<p>两者相结合，就能得到一个可以被多处共享，同时又可以被任意一处修改的值。可变性的借用检查仍然存在，只是时机变了——<code>Rc</code> 允许你从任意一个持有者处调用 <code>borrow_mut()</code>，但 <code>RefCell</code> 会在运行时确保同一时刻最多只有一个可变借用活跃；若有多个持有者同时尝试调用 <code>borrow_mut()</code> 且互相重叠，程序会 Panic：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Arc%3A%3ARc%3B%0Ause%20std%3A%3Acell%3A%3ARefCell%3B%0A%0A%23%5Bderive(Debug)%5D%0Aenum%20List%20%7B%0A%20%20%20%20Cons(Rc%3CRefCell%3Ci32%3E%3E%2C%20Rc%3CList%3E)%2C%0A%20%20%20%20Nil%2C%0A%7D%0Ause%20List%3A%3A%7BCons%2C%20Nil%7D%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E8%BF%99%E4%B8%AA%E5%80%BC%E5%B0%86%E8%A2%AB%E5%A4%9A%E4%B8%AA%E5%88%97%E8%A1%A8%E8%8A%82%E7%82%B9%E5%85%B1%E4%BA%AB%EF%BC%8C%E4%B8%94%E5%8F%AF%E4%BB%A5%E8%A2%AB%E4%BF%AE%E6%94%B9%0A%20%20%20%20let%20shared_value%20%3D%20Rc%3A%3Anew(RefCell%3A%3Anew(5))%3B%0A%0A%20%20%20%20%2F%2F%20a%E3%80%81b%E3%80%81c%20%E4%B8%89%E4%B8%AA%E5%88%97%E8%A1%A8%E9%83%BD%E6%8C%81%E6%9C%89%20shared_value%20%E7%9A%84%E4%B8%80%E4%BB%BD%E6%89%80%E6%9C%89%E6%9D%83%0A%20%20%20%20let%20a%20%3D%20Rc%3A%3Anew(Cons(Rc%3A%3Aclone(%26shared_value)%2C%20Rc%3A%3Anew(Nil)))%3B%0A%20%20%20%20let%20b%20%3D%20Cons(Rc%3A%3Anew(RefCell%3A%3Anew(3))%2C%20Rc%3A%3Aclone(%26a))%3B%0A%20%20%20%20let%20c%20%3D%20Cons(Rc%3A%3Anew(RefCell%3A%3Anew(4))%2C%20Rc%3A%3Aclone(%26a))%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BF%AE%E6%94%B9%20shared_value%20%E7%9A%84%E5%80%BC%0A%20%20%20%20*shared_value.borrow_mut()%20%2B%3D%2010%3B%0A%0A%20%20%20%20%2F%2F%20%E6%89%80%E6%9C%89%E6%8C%81%E6%9C%89%20shared_value%20%E7%9A%84%E5%88%97%E8%A1%A8%E8%8A%82%E7%82%B9%E9%83%BD%E7%9C%8B%E5%88%B0%E4%BA%86%E6%9B%B4%E6%96%B0%0A%20%20%20%20println!(%22%E4%BF%AE%E6%94%B9%E5%90%8E%20a%20%3D%20%7B%3A%3F%7D%22%2C%20a)%3B%0A%20%20%20%20println!(%22%E4%BF%AE%E6%94%B9%E5%90%8E%20b%20%3D%20%7B%3A%3F%7D%22%2C%20b)%3B%0A%20%20%20%20println!(%22%E4%BF%AE%E6%94%B9%E5%90%8E%20c%20%3D%20%7B%3A%3F%7D%22%2C%20c)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
enum List {
    Cons(Rc&lt;RefCell&lt;i32&gt;&gt;, Rc&lt;List&gt;),
    Nil,
}
use List::{Cons, Nil};

fn main() {
    // 这个值将被多个列表节点共享，且可以被修改
    let shared_value = Rc::new(RefCell::new(5));

    // a、b、c 三个列表都持有 shared_value 的一份所有权
    let a = Rc::new(Cons(Rc::clone(&amp;shared_value), Rc::new(Nil)));
    let b = Cons(Rc::new(RefCell::new(3)), Rc::clone(&amp;a));
    let c = Cons(Rc::new(RefCell::new(4)), Rc::clone(&amp;a));

    // 修改 shared_value 的值
    *shared_value.borrow_mut() += 10;

    // 所有持有 shared_value 的列表节点都看到了更新
    println!("修改后 a = {:?}", a);
    println!("修改后 b = {:?}", b);
    println!("修改后 c = {:?}", c);
}</code></pre></div>
<h1 id="练习题">练习题</h1>
<h2 id="测验">测验</h2>
</div>
</div>
<pre><code class="language-rust">use std::rc::Rc;
use std::cell::RefCell;

let data = Rc::new(RefCell::new(0));
let a = Rc::clone(&amp;data);
let b = Rc::clone(&amp;data);

*a.borrow_mut() += 10;
*b.borrow_mut() += 5;

println!("{}", data.borrow());</code></pre>
</div>
</div>
</div> 