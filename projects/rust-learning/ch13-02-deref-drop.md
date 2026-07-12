---
title: "Deref 与 Drop：智能指针的两翼"
description: "智能指针 - Deref 与 Drop：智能指针的两翼"
date: "2026-07-12"
order: 13002
tags: ["Deref", "Drop", "解引用", "解引用强制转换", "RAII", "析构"]
est_time: "30 分钟"
---

 <h1 id="理解-deref重载解引用运算符">理解 <code>Deref</code>：重载解引用运算符</h1>
<p>解引用运算符 <code>*</code> 能够追踪引用所指向的值。对于普通引用，这是自然而然的行为：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20let%20y%20%3D%20%26x%3B%20%20%20%20%20%20%20%2F%2F%20y%20%E6%98%AF%20x%20%E7%9A%84%E5%BC%95%E7%94%A8%0A%0A%20%20%20%20assert_eq!(5%2C%20x)%3B%0A%20%20%20%20assert_eq!(5%2C%20*y)%3B%20%2F%2F%20%E4%BD%BF%E7%94%A8%20*%20%E8%A7%A3%E5%BC%95%E7%94%A8%EF%BC%8C%E8%8E%B7%E5%8F%96%20y%20%E6%8C%87%E5%90%91%E7%9A%84%E5%80%BC%0A%20%20%20%20println!(%22x%20%3D%20%7B%7D%2C%20*y%20%3D%20%7B%7D%22%2C%20x%2C%20*y)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 5;
    let y = &amp;x;       // y 是 x 的引用

    assert_eq!(5, x);
    assert_eq!(5, *y); // 使用 * 解引用，获取 y 指向的值
    println!("x = {}, *y = {}", x, *y);
}</code></pre></div>
<p>现在用 <code>Box&lt;T&gt;</code> 替换引用，<code>*</code> 运算符同样有效：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20let%20y%20%3D%20Box%3A%3Anew(x)%3B%20%2F%2F%20y%20%E6%98%AF%E4%B8%80%E4%B8%AA%E6%8C%87%E5%90%91%20x%20%E5%80%BC%E5%89%AF%E6%9C%AC%E7%9A%84%20Box%0A%0A%20%20%20%20assert_eq!(5%2C%20x)%3B%0A%20%20%20%20assert_eq!(5%2C%20*y)%3B%20%20%20%2F%2F%20%E8%A7%A3%E5%BC%95%E7%94%A8%20Box%EF%BC%8C%E5%92%8C%E8%A7%A3%E5%BC%95%E7%94%A8%E6%99%AE%E9%80%9A%E5%BC%95%E7%94%A8%E4%B8%80%E6%A0%B7%EF%BC%81%0A%20%20%20%20println!(%22%E8%A7%A3%E5%BC%95%E7%94%A8%20Box%20%E6%88%90%E5%8A%9F%EF%BC%9A%7B%7D%22%2C%20*y)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 5;
    let y = Box::new(x); // y 是一个指向 x 值副本的 Box

    assert_eq!(5, x);
    assert_eq!(5, *y);   // 解引用 Box，和解引用普通引用一样！
    println!("解引用 Box 成功：{}", *y);
}</code></pre></div>
<p>这并不是编译器为 <code>Box&lt;T&gt;</code> 开的特例，而是因为 <code>Box&lt;T&gt;</code> 实现了 <code>Deref</code> Trait。接下来我们自己动手实现一个类似的类型，来深入理解 <code>Deref</code> 的工作原理。</p>
<h2 id="自定义实现-deref">自定义实现 <code>Deref</code></h2>
<div class="code-runner" data-full-code="use%20std%3A%3Aops%3A%3ADeref%3B%0A%0A%2F%2F%20%E5%AE%9A%E4%B9%89%E4%B8%80%E4%B8%AA%E5%85%83%E7%BB%84%E7%BB%93%E6%9E%84%E4%BD%93%EF%BC%8C%E5%83%8F%20Box%3CT%3E%20%E4%B8%80%E6%A0%B7%E5%8C%85%E8%A3%B9%E6%95%B0%E6%8D%AE%0Astruct%20MyBox%3CT%3E(T)%3B%0A%0Aimpl%3CT%3E%20MyBox%3CT%3E%20%7B%0A%20%20%20%20fn%20new(x%3A%20T)%20-%3E%20MyBox%3CT%3E%20%7B%0A%20%20%20%20%20%20%20%20MyBox(x)%0A%20%20%20%20%7D%0A%7D%0A%0A%2F%2F%20%E5%AE%9E%E7%8E%B0%20Deref%EF%BC%8C%E5%91%8A%E8%AF%89%E7%BC%96%E8%AF%91%E5%99%A8%E5%A6%82%E4%BD%95%22%E8%A7%A3%E5%BC%80%22%E8%BF%99%E4%B8%AA%E7%B1%BB%E5%9E%8B%0Aimpl%3CT%3E%20Deref%20for%20MyBox%3CT%3E%20%7B%0A%20%20%20%20type%20Target%20%3D%20T%3B%20%2F%2F%20%E5%85%B3%E8%81%94%E7%B1%BB%E5%9E%8B%EF%BC%9A%E8%A7%A3%E5%BC%95%E7%94%A8%E5%90%8E%E5%BE%97%E5%88%B0%20T%0A%0A%20%20%20%20fn%20deref(%26self)%20-%3E%20%26Self%3A%3ATarget%20%7B%0A%20%20%20%20%20%20%20%20%26self.0%20%2F%2F%20%E8%BF%94%E5%9B%9E%E5%85%83%E7%BB%84%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%AD%97%E6%AE%B5%E7%9A%84%E5%BC%95%E7%94%A8%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20let%20y%20%3D%20MyBox%3A%3Anew(x)%3B%0A%0A%20%20%20%20assert_eq!(5%2C%20x)%3B%0A%20%20%20%20assert_eq!(5%2C%20*y)%3B%20%2F%2F%20Rust%20%E5%9C%A8%E5%BA%95%E5%B1%82%E6%89%A7%E8%A1%8C%E7%9A%84%E6%98%AF%20*(y.deref())%0A%20%20%20%20println!(%22%E8%87%AA%E5%AE%9A%E4%B9%89%20MyBox%20%E8%A7%A3%E5%BC%95%E7%94%A8%E6%88%90%E5%8A%9F%EF%BC%9A%7B%7D%22%2C%20*y)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::ops::Deref;

// 定义一个元组结构体，像 Box&lt;T&gt; 一样包裹数据
struct MyBox&lt;T&gt;(T);

impl&lt;T&gt; MyBox&lt;T&gt; {
    fn new(x: T) -&gt; MyBox&lt;T&gt; {
        MyBox(x)
    }
}

// 实现 Deref，告诉编译器如何"解开"这个类型
impl&lt;T&gt; Deref for MyBox&lt;T&gt; {
    type Target = T; // 关联类型：解引用后得到 T

    fn deref(&amp;self) -&gt; &amp;Self::Target {
        &amp;self.0 // 返回元组第一个字段的引用
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y); // Rust 在底层执行的是 *(y.deref())
    println!("自定义 MyBox 解引用成功：{}", *y);
}</code></pre></div>
<blockquote>
<p><strong>关联类型简介</strong>：<code>type Target = T</code> 是在 Trait 内部定义一个”占位类型”，实现时指定它的具体类型。你可以把它理解成给返回值类型起一个名字，让 Trait 的方法签名更清晰。后续章节会详细介绍，现在只需知道它的作用是”声明解引用后得到什么类型”即可。</p>
</blockquote>
<p>关键点：当你写 <code>*y</code> 时，Rust 实际上在幕后执行的是 <code>*(y.deref())</code>。<code>deref</code> 方法返回的是内部数据的<strong>引用</strong>（而不是值本身），然后再对这个引用用 <code>*</code> 进行普通解引用。如果 <code>deref</code> 直接返回值，所有权就会被转移出 <code>self</code>，这通常不是我们想要的。</p>
<h1 id="解引用强制转换">解引用强制转换</h1>
<p><strong>解引用强制转换</strong> (Deref Coercion) 是 Rust 编译器提供的一项极其实用的自动转换功能。它会在<strong>编译时</strong>自动将实现了 <code>Deref</code> 的类型的引用，转换为另一种类型的引用。</p>
<h2 id="没有强制转换时的痛苦">没有强制转换时的痛苦</h2>
<p>假设有一个接受 <code>&amp;str</code> 的函数：</p>
<pre><code class="language-rust">fn hello(name: &amp;str) {
    println!("Hello, {}!", name);
}</code></pre>
<p>如果没有解引用强制转换，用一个 <code>MyBox&lt;String&gt;</code> 来调用它将非常繁琐：</p>
<pre><code class="language-rust">fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&amp;(*m)[..]); // 手动写法：先解引用 MyBox，再取字符串切片
}</code></pre>
<p><code>(*m)</code> 将 <code>MyBox&lt;String&gt;</code> 解引用为 <code>String</code>，然后 <code>&amp;</code> 和 <code>[..]</code> 再取整个 <code>String</code> 的字符串切片以匹配 <code>&amp;str</code>。这又难写又难读。</p>
<h2 id="有强制转换时的优雅">有强制转换时的优雅</h2>
<div class="code-runner" data-full-code="use%20std%3A%3Aops%3A%3ADeref%3B%0A%0Astruct%20MyBox%3CT%3E(T)%3B%0Aimpl%3CT%3E%20MyBox%3CT%3E%20%7B%20fn%20new(x%3A%20T)%20-%3E%20MyBox%3CT%3E%20%7B%20MyBox(x)%20%7D%20%7D%0Aimpl%3CT%3E%20Deref%20for%20MyBox%3CT%3E%20%7B%0A%20%20%20%20type%20Target%20%3D%20T%3B%0A%20%20%20%20fn%20deref(%26self)%20-%3E%20%26Self%3A%3ATarget%20%7B%20%26self.0%20%7D%0A%7D%0A%0Afn%20hello(name%3A%20%26str)%20%7B%0A%20%20%20%20println!(%22Hello%2C%20%7B%7D!%22%2C%20name)%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20m%20%3D%20MyBox%3A%3Anew(String%3A%3Afrom(%22Rust%22))%3B%0A%20%20%20%20hello(%26m)%3B%20%2F%2F%20Rust%20%E8%87%AA%E5%8A%A8%E5%AE%8C%E6%88%90%E4%B8%A4%E6%AD%A5%E8%BD%AC%E6%8D%A2%EF%BC%9A%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%201.%20%26MyBox%3CString%3E%20-%3E%20%26String%EF%BC%88%E9%80%9A%E8%BF%87%20MyBox%20%E7%9A%84%20Deref%EF%BC%89%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%202.%20%26String%20-%3E%20%26str%EF%BC%88%E9%80%9A%E8%BF%87%20String%20%E7%9A%84%20Deref%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">use std::ops::Deref;

struct MyBox&lt;T&gt;(T);
impl&lt;T&gt; MyBox&lt;T&gt; { fn new(x: T) -&gt; MyBox&lt;T&gt; { MyBox(x) } }
impl&lt;T&gt; Deref for MyBox&lt;T&gt; {
    type Target = T;
    fn deref(&amp;self) -&gt; &amp;Self::Target { &amp;self.0 }
}

fn hello(name: &amp;str) {
    println!("Hello, {}!", name);
}

fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&amp;m); // Rust 自动完成两步转换：
               // 1. &amp;MyBox&lt;String&gt; -&gt; &amp;String（通过 MyBox 的 Deref）
               // 2. &amp;String -&gt; &amp;str（通过 String 的 Deref）
}</code></pre></div>
<p>Rust 自动进行了多步链式转换。整个过程发生在编译期，<strong>没有任何运行时性能开销</strong>。</p>
<h2 id="强制转换与可变性">强制转换与可变性</h2>
<p>Rust 还提供了 <code>DerefMut</code> Trait 用于可变引用的解引用强制转换。规则如下：</p>
<ul>
<li><code>&amp;T</code> → <code>&amp;U</code>：当 <code>T: Deref&lt;Target=U&gt;</code></li>
<li><code>&amp;mut T</code> → <code>&amp;mut U</code>：当 <code>T: DerefMut&lt;Target=U&gt;</code></li>
<li><code>&amp;mut T</code> → <code>&amp;U</code>：当 <code>T: Deref&lt;Target=U&gt;</code>（可变转不可变）</li>
</ul>
<p>注意：<strong>不可变引用永远不能被强制转换为可变引用</strong>。原因是借用规则要求，如果存在一个可变引用，那么它必须是唯一的引用，编译器无法保证从不可变引用强转后的安全性。</p>
<h1 id="理解-drop值离开时自动执行清理">理解 <code>Drop</code>：值离开时自动执行清理</h1>
<p><code>Drop</code> Trait 是 Rust 的另一块基石。它定义了一个值在<strong>离开作用域</strong>时需要执行的清理逻辑。这个设计来自 <strong>RAII</strong> (Resource Acquisition Is Initialization) 模式——资源在获取时初始化，在销毁时自动释放。</p>
<h2 id="drop-的触发顺序"><code>Drop</code> 的触发顺序</h2>
<p>变量以<strong>创建时相反的顺序</strong>被丢弃，就像栈结构一样：</p>
<div class="code-runner" data-full-code="struct%20Resource%20%7B%0A%20%20%20%20name%3A%20String%2C%0A%7D%0A%0Aimpl%20Drop%20for%20Resource%20%7B%0A%20%20%20%20fn%20drop(%26mut%20self)%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%AD%A3%E5%9C%A8%E9%87%8A%E6%94%BE%E8%B5%84%E6%BA%90%3A%20%7B%7D%22%2C%20self.name)%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20_a%20%3D%20Resource%20%7B%20name%3A%20String%3A%3Afrom(%22%E6%96%87%E4%BB%B6%E5%8F%A5%E6%9F%84-A%22)%20%7D%3B%0A%20%20%20%20let%20_b%20%3D%20Resource%20%7B%20name%3A%20String%3A%3Afrom(%22%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%9E%E6%8E%A5-B%22)%20%7D%3B%0A%20%20%20%20println!(%22---%20%E6%89%80%E6%9C%89%E8%B5%84%E6%BA%90%E5%B7%B2%E5%88%9B%E5%BB%BA%EF%BC%8C%E7%A8%8B%E5%BA%8F%E5%8D%B3%E5%B0%86%E7%BB%93%E6%9D%9F%20---%22)%3B%0A%20%20%20%20%2F%2F%20%E7%A6%BB%E5%BC%80%E4%BD%9C%E7%94%A8%E5%9F%9F%E6%97%B6%EF%BC%8C%E5%85%88%E9%87%8A%E6%94%BE%20_b%EF%BC%8C%E5%86%8D%E9%87%8A%E6%94%BE%20_a%EF%BC%88LIFO%20%E9%A1%BA%E5%BA%8F%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">struct Resource {
    name: String,
}

impl Drop for Resource {
    fn drop(&amp;mut self) {
        println!("正在释放资源: {}", self.name);
    }
}

fn main() {
    let _a = Resource { name: String::from("文件句柄-A") };
    let _b = Resource { name: String::from("数据库连接-B") };
    println!("--- 所有资源已创建，程序即将结束 ---");
    // 离开作用域时，先释放 _b，再释放 _a（LIFO 顺序）
}</code></pre></div>
<h2 id="提早丢弃值dropx">提早丢弃值：<code>drop(x)</code></h2>
<p>有时候我们需要提前释放一个资源，比如在操作完成后立刻释放互斥锁，以便让其他代码获取锁。你可能会尝试直接调用 <code>val.drop()</code>，但 Rust 不允许这样做：</p>
<pre><code class="language-rust">// 这会导致编译错误！
// error[E0040]: explicit use of destructor method
let c = Resource { name: String::from("互斥锁") };
c.drop(); // 不允许！这会导致离开作用域时的二次释放</code></pre>
<p>正确的做法是使用标准库的全局函数 <code>drop(c)</code>。它位于 prelude 中，无需导入：</p>
<div class="code-runner" data-full-code="struct%20MutexGuard%20%7B%0A%20%20%20%20name%3A%20%26'static%20str%2C%0A%7D%0A%0Aimpl%20Drop%20for%20MutexGuard%20%7B%0A%20%20%20%20fn%20drop(%26mut%20self)%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E9%94%81%20'%7B%7D'%20%E5%B7%B2%E9%87%8A%E6%94%BE%22%2C%20self.name)%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20guard%20%3D%20MutexGuard%20%7B%20name%3A%20%22%E6%95%B0%E6%8D%AE%E9%94%81%22%20%7D%3B%0A%20%20%20%20println!(%22%E4%B8%B4%E7%95%8C%E5%8C%BA%E5%BC%80%E5%A7%8B%EF%BC%8C%E6%8C%81%E6%9C%89%E9%94%81%22)%3B%0A%0A%20%20%20%20drop(guard)%3B%20%2F%2F%20%E6%8F%90%E5%89%8D%E6%98%BE%E5%BC%8F%E9%87%8A%E6%94%BE%EF%BC%8C%E8%AE%A9%E5%85%B6%E4%BB%96%E4%BB%A3%E7%A0%81%E5%8F%AF%E4%BB%A5%E8%8E%B7%E5%8F%96%E9%94%81%0A%20%20%20%20println!(%22%E4%B8%B4%E7%95%8C%E5%8C%BA%E7%BB%93%E6%9D%9F%EF%BC%8C%E9%94%81%E5%B7%B2%E6%8F%90%E5%89%8D%E5%BD%92%E8%BF%98%22)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E8%BF%99%E9%87%8C%E5%86%8D%E4%BD%BF%E7%94%A8%20guard%20%E4%BC%9A%E5%AF%BC%E8%87%B4%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%88%E5%B7%B2%E8%A2%AB%E7%A7%BB%E5%8A%A8%EF%BC%89%0A%7D" data-mode="run"><pre><code class="language-rust">struct MutexGuard {
    name: &amp;'static str,
}

impl Drop for MutexGuard {
    fn drop(&amp;mut self) {
        println!("锁 '{}' 已释放", self.name);
    }
}

fn main() {
    let guard = MutexGuard { name: "数据锁" };
    println!("临界区开始，持有锁");

    drop(guard); // 提前显式释放，让其他代码可以获取锁
    println!("临界区结束，锁已提前归还");

    // 如果这里再使用 guard 会导致编译错误（已被移动）
}</code></pre></div>
<p><code>drop(x)</code> 函数通过<strong>获取值的所有权</strong>，然后让值在函数块结束时自然析构，来实现提前释放。这避免了二次释放的问题，同时保持了 Rust 的安全保证。</p>
<h1 id="练习题">练习题</h1>
<h2 id="测验">测验</h2>
</div>
</div>
</div>
<pre><code class="language-rust">struct A; struct B;
impl Drop for A { fn drop(&amp;mut self) { println!("drop A"); } }
impl Drop for B { fn drop(&amp;mut self) { println!("drop B"); } }
fn main() {
    let _a = A;
    let _b = B;
}</code></pre>
</div>
</div> 