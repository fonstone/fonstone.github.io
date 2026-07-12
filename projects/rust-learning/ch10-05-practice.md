---
title: "综合练习"
description: "泛型与 trait - 综合练习"
date: "2026-07-12"
order: 10005
tags: ["泛型", "练习", "综合"]
est_time: "10 分钟"
---

 <h1 id="综合判断题">综合判断题</h1>
<h2 id="泛型语法测验">泛型语法测验</h2>
</div>
<pre><code class="language-rust">struct Stack&lt;T&gt; {
    items: Vec&lt;T&gt;,
}

impl&lt;T&gt; Stack&lt;T&gt; {
    fn new() -&gt; Self { Stack { items: Vec::new() } }
    fn push(&amp;mut self, item: T) { self.items.push(item); }
    fn pop(&amp;mut self) -&gt; Option&lt;T&gt; { self.items.pop() }
    fn is_empty(&amp;self) -&gt; bool { self.items.is_empty() }
}</code></pre>
</div>
</div>
</div>
<h1 id="编程练习">编程练习</h1>
<h2 id="练习一泛型栈">练习一：泛型栈</h2>
<p>下面是一个只能存 <code>i32</code> 的栈，实现已经完整。请把它改成泛型版本 <code>Stack&lt;T&gt;</code>，让它能存任意类型：</p>
<div class="code-editor" data-block-id="10-generics-traits/05-practice#1:0" data-expect-mode="literal" data-expect-pattern="%E6%A0%88%E9%A1%B6%3A%20Some(3)%0A%E5%BC%B9%E5%87%BA%3A%20Some(3)%0A%E6%A0%88%E9%A1%B6%3A%20Some(%22world%22)%0A%E7%A9%BA%E6%A0%88%3A%20false" data-starter-code="%2F%2F%20TODO%3A%20%E6%8A%8A%20i32%20%E6%8D%A2%E6%88%90%E6%B3%9B%E5%9E%8B%E5%8F%82%E6%95%B0%20T%0Astruct%20Stack%20%7B%0A%20%20%20%20items%3A%20Vec%3Ci32%3E%2C%0A%7D%0A%0Aimpl%20Stack%20%7B%0A%20%20%20%20fn%20new()%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20Stack%20%7B%20items%3A%20Vec%3A%3Anew()%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20push(%26mut%20self%2C%20item%3A%20i32)%20%7B%0A%20%20%20%20%20%20%20%20self.items.push(item)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20pop(%26mut%20self)%20-%3E%20Option%3Ci32%3E%20%7B%0A%20%20%20%20%20%20%20%20self.items.pop()%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20peek(%26self)%20-%3E%20Option%3C%26i32%3E%20%7B%0A%20%20%20%20%20%20%20%20self.items.last()%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20is_empty(%26self)%20-%3E%20bool%20%7B%0A%20%20%20%20%20%20%20%20self.items.is_empty()%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%94%B9%E5%AE%8C%E5%90%8E%E8%BF%99%E4%B8%A4%E6%AE%B5%E4%BB%A3%E7%A0%81%E9%83%BD%E5%BA%94%E8%AF%A5%E8%83%BD%E7%BC%96%E8%AF%91%E8%BF%90%E8%A1%8C%0A%20%20%20%20let%20mut%20int_stack%3A%20Stack%3Ci32%3E%20%3D%20Stack%3A%3Anew()%3B%0A%20%20%20%20int_stack.push(1)%3B%0A%20%20%20%20int_stack.push(2)%3B%0A%20%20%20%20int_stack.push(3)%3B%0A%20%20%20%20println!(%22%E6%A0%88%E9%A1%B6%3A%20%7B%3A%3F%7D%22%2C%20int_stack.peek())%3B%20%2F%2F%20Some(3)%0A%20%20%20%20println!(%22%E5%BC%B9%E5%87%BA%3A%20%7B%3A%3F%7D%22%2C%20int_stack.pop())%3B%20%20%2F%2F%20Some(3)%0A%0A%20%20%20%20let%20mut%20str_stack%3A%20Stack%3C%26str%3E%20%3D%20Stack%3A%3Anew()%3B%0A%20%20%20%20str_stack.push(%22hello%22)%3B%0A%20%20%20%20str_stack.push(%22world%22)%3B%0A%20%20%20%20println!(%22%E6%A0%88%E9%A1%B6%3A%20%7B%3A%3F%7D%22%2C%20str_stack.peek())%3B%20%2F%2F%20Some(%22world%22)%0A%20%20%20%20println!(%22%E7%A9%BA%E6%A0%88%3A%20%7B%7D%22%2C%20int_stack.is_empty())%3B%20%2F%2F%20false%0A%7D"><pre><code class="language-rust">// TODO: 把 i32 换成泛型参数 T
struct Stack {
    items: Vec&lt;i32&gt;,
}

impl Stack {
    fn new() -&gt; Self {
        Stack { items: Vec::new() }
    }

    fn push(&amp;mut self, item: i32) {
        self.items.push(item);
    }

    fn pop(&amp;mut self) -&gt; Option&lt;i32&gt; {
        self.items.pop()
    }

    fn peek(&amp;self) -&gt; Option&lt;&amp;i32&gt; {
        self.items.last()
    }

    fn is_empty(&amp;self) -&gt; bool {
        self.items.is_empty()
    }
}

fn main() {
    // 改完后这两段代码都应该能编译运行
    let mut int_stack: Stack&lt;i32&gt; = Stack::new();
    int_stack.push(1);
    int_stack.push(2);
    int_stack.push(3);
    println!("栈顶: {:?}", int_stack.peek()); // Some(3)
    println!("弹出: {:?}", int_stack.pop());  // Some(3)

    let mut str_stack: Stack&lt;&amp;str&gt; = Stack::new();
    str_stack.push("hello");
    str_stack.push("world");
    println!("栈顶: {:?}", str_stack.peek()); // Some("world")
    println!("空栈: {}", int_stack.is_empty()); // false
}</code></pre></div>
<h2 id="练习二泛型键值对">练习二：泛型键值对</h2>
<p>实现一个 <code>KeyValue&lt;K, V&gt;</code> 结构，存储一个键值对，并为它实现 <code>swap</code> 方法，返回键值互换后的新 <code>KeyValue&lt;V, K&gt;</code>。</p>
<div class="code-editor" data-block-id="10-generics-traits/05-practice#1:1" data-expect-mode="literal" data-expect-pattern="key%3Dname%2C%20value%3D42%0Akey%3D42%2C%20value%3Dname" data-starter-code="struct%20KeyValue%3CK%2C%20V%3E%20%7B%0A%20%20%20%20%2F%2F%20TODO%0A%7D%0A%0Aimpl%3CK%2C%20V%3E%20KeyValue%3CK%2C%20V%3E%20%7B%0A%20%20%20%20fn%20new(key%3A%20K%2C%20value%3A%20V)%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20todo!()%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20swap(self)%20-%3E%20KeyValue%3CV%2C%20K%3E%20%7B%0A%20%20%20%20%20%20%20%20todo!()%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20pair%20%3D%20KeyValue%3A%3Anew(%22name%22%2C%2042)%3B%0A%20%20%20%20println!(%22key%3D%7B%7D%2C%20value%3D%7B%7D%22%2C%20pair.key%2C%20pair.value)%3B%20%2F%2F%20key%3Dname%2C%20value%3D42%0A%0A%20%20%20%20let%20swapped%20%3D%20pair.swap()%3B%0A%20%20%20%20println!(%22key%3D%7B%7D%2C%20value%3D%7B%7D%22%2C%20swapped.key%2C%20swapped.value)%3B%20%2F%2F%20key%3D42%2C%20value%3Dname%0A%7D"><pre><code class="language-rust">struct KeyValue&lt;K, V&gt; {
    // TODO
}

impl&lt;K, V&gt; KeyValue&lt;K, V&gt; {
    fn new(key: K, value: V) -&gt; Self {
        todo!()
    }

    fn swap(self) -&gt; KeyValue&lt;V, K&gt; {
        todo!()
    }
}

fn main() {
    let pair = KeyValue::new("name", 42);
    println!("key={}, value={}", pair.key, pair.value); // key=name, value=42

    let swapped = pair.swap();
    println!("key={}, value={}", swapped.key, swapped.value); // key=42, value=name
}</code></pre></div> 