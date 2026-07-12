---
title: "泛型语法基础"
description: "泛型与 trait - 泛型语法基础"
date: "2026-07-12"
order: 10001
tags: ["泛型", "generics", "类型参数", "单态化", "monomorphization"]
est_time: "20 分钟"
---

 <h1 id="用泛型抽象类型">用泛型抽象类型</h1>
<h2 id="为什么需要泛型">为什么需要泛型</h2>
<p>假设你要写一个函数，找出整数列表中最大的值：</p>
<div class="code-runner" data-full-code="fn%20largest_i32(list%3A%20%26%5Bi32%5D)%20-%3E%20%26i32%20%7B%0A%20%20%20%20let%20mut%20largest%20%3D%20%26list%5B0%5D%3B%0A%20%20%20%20for%20item%20in%20list%20%7B%0A%20%20%20%20%20%20%20%20if%20item%20%3E%20largest%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20largest%20%3D%20item%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20largest%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20numbers%20%3D%20vec!%5B34%2C%2050%2C%2025%2C%20100%2C%2065%5D%3B%0A%20%20%20%20println!(%22%E6%9C%80%E5%A4%A7%E5%80%BC%E6%98%AF%20%7B%7D%22%2C%20largest_i32(%26numbers))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn largest_i32(list: &amp;[i32]) -&gt; &amp;i32 {
    let mut largest = &amp;list[0];
    for item in list {
        if item &gt; largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大值是 {}", largest_i32(&amp;numbers));
}</code></pre></div>
<p>现在你想对 <code>f64</code> 列表做同样的事，怎么办？复制一份：</p>
<pre><code class="language-rust">fn largest_f64(list: &amp;[f64]) -&gt; &amp;f64 {
    let mut largest = &amp;list[0];
    for item in list {
        if item &gt; largest {
            largest = item;
        }
    }
    largest
}</code></pre>
<p>两个函数的<strong>逻辑完全相同</strong>，只有类型不同。如果还要支持 <code>char</code>、<code>u8</code>……每次都要复制？虽然 C 语言正是这样做的，但 Rust 里可以写的更加优雅，这正是泛型要解决的问题。</p>
<p><strong>泛型</strong>让你用一个占位符 <code>T</code> 代表”某种类型”，写一份代码，让编译器自动适配所有需要的类型。</p>
<h2 id="泛型函数">泛型函数</h2>
<p>用泛型合并上面两个函数：</p>
<div class="code-runner" data-full-code="fn%20largest%3CT%3A%20PartialOrd%3E(list%3A%20%26%5BT%5D)%20-%3E%20%26T%20%7B%0A%20%20%20%20let%20mut%20largest%20%3D%20%26list%5B0%5D%3B%0A%20%20%20%20for%20item%20in%20list%20%7B%0A%20%20%20%20%20%20%20%20if%20item%20%3E%20largest%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20largest%20%3D%20item%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20largest%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20numbers%20%3D%20vec!%5B34%2C%2050%2C%2025%2C%20100%2C%2065%5D%3B%0A%20%20%20%20println!(%22%E6%95%B4%E6%95%B0%E6%9C%80%E5%A4%A7%E5%80%BC%EF%BC%9A%7B%7D%22%2C%20largest(%26numbers))%3B%0A%0A%20%20%20%20let%20floats%20%3D%20vec!%5B2.7%2C%203.1%2C%200.8%2C%209.5%2C%201.4%5D%3B%0A%20%20%20%20println!(%22%E6%B5%AE%E7%82%B9%E6%9C%80%E5%A4%A7%E5%80%BC%EF%BC%9A%7B%7D%22%2C%20largest(%26floats))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn largest&lt;T: PartialOrd&gt;(list: &amp;[T]) -&gt; &amp;T {
    let mut largest = &amp;list[0];
    for item in list {
        if item &gt; largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("整数最大值：{}", largest(&amp;numbers));

    let floats = vec![2.7, 3.1, 0.8, 9.5, 1.4];
    println!("浮点最大值：{}", largest(&amp;floats));
}</code></pre></div>
<p>语法拆解：</p>
<ul>
<li><strong><code>&lt;T: PartialOrd&gt;</code></strong> — 在函数名后用尖括号声明类型参数 <code>T</code>；<code>PartialOrd</code> 是<strong>约束</strong>，表示”T 必须支持比较大小”。没有这个约束，编译器不允许用 <code>&gt;</code> 运算符</li>
<li><strong><code>list: &amp;[T]</code></strong> — 参数是元素类型为 <code>T</code> 的切片</li>
<li><strong><code>-&gt; &amp;T</code></strong> — 返回对 <code>T</code> 类型值的引用</li>
</ul>
<blockquote>
<p><code>T</code> 只是惯例，你可以用任何标识符。但单个大写字母是 Rust 社区的约定，多个类型参数时常用 <code>T</code>、<code>U</code>、<code>K</code>、<code>V</code>。</p>
</blockquote>
<p>约束语法（如 <code>PartialOrd</code>）的完整内容在 Trait 章节会讲，现在只需记住：<strong>约束说明 T 能做什么</strong>。</p>
<h2 id="显式指定泛型参数turbofish">显式指定泛型参数：turbofish</h2>
<p>大多数情况下，编译器能从传入的值自动推导 <code>T</code> 是什么，不需要手动指定：</p>
<div class="code-runner" data-full-code="fn%20wrap%3CT%3E(val%3A%20T)%20-%3E%20Vec%3CT%3E%20%7B%20vec!%5Bval%5D%20%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20wrap(42)%3B%20%20%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E5%99%A8%E4%BB%8E%2042%20%E6%8E%A8%E5%AF%BC%E5%87%BA%20T%20%3D%20i32%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20v)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn wrap&lt;T&gt;(val: T) -&gt; Vec&lt;T&gt; { vec![val] }

fn main() {
    let v = wrap(42);    // 编译器从 42 推导出 T = i32
    println!("{:?}", v);
}</code></pre></div>
<p>但有些函数的泛型参数在参数里看不出来，编译器无法推导，这时需要用 <code>函数名::&lt;类型&gt;()</code> 显式指定：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20parse%20%E6%8A%8A%E5%AD%97%E7%AC%A6%E4%B8%B2%E8%A7%A3%E6%9E%90%E6%88%90%22%E6%9F%90%E7%A7%8D%E7%B1%BB%E5%9E%8B%22%EF%BC%8C%E4%BD%86%E5%93%AA%E7%A7%8D%E7%B1%BB%E5%9E%8B%EF%BC%9F%E7%BC%96%E8%AF%91%E5%99%A8%E6%97%A0%E6%B3%95%E4%BB%8E%20%2242%22%20%E6%8E%A8%E6%96%AD%0A%20%20%20%20let%20n%20%3D%20%2242%22.parse%3A%3A%3Ci32%3E().unwrap()%3B%0A%20%20%20%20let%20f%20%3D%20%223.14%22.parse%3A%3A%3Cf64%3E().unwrap()%3B%0A%20%20%20%20println!(%22%7B%7D%20%7B%7D%22%2C%20n%2C%20f)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // parse 把字符串解析成"某种类型"，但哪种类型？编译器无法从 "42" 推断
    let n = "42".parse::&lt;i32&gt;().unwrap();
    let f = "3.14".parse::&lt;f64&gt;().unwrap();
    println!("{} {}", n, f);
}</code></pre></div>
<p><code>parse::&lt;i32&gt;()</code> 这种 <code>函数名::&lt;类型&gt;()</code> 语法叫 <strong>turbofish</strong>。注意不能省略 <code>::</code>，写成 <code>parse&lt;i32&gt;()</code> 会被编译器误读为比较运算符而报错。</p>
<p>规则很简单：<strong>编译器能推导就省略；推导不了就加 turbofish</strong>。</p>
<h2 id="泛型结构体">泛型结构体</h2>
<p>类型参数同样可以放在结构体上：</p>
<div class="code-runner" data-full-code="struct%20Point%3CT%3E%20%7B%0A%20%20%20%20x%3A%20T%2C%0A%20%20%20%20y%3A%20T%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20int_point%20%3D%20Point%20%7B%20x%3A%205%2C%20y%3A%2010%20%7D%3B%0A%20%20%20%20let%20flt_point%20%3D%20Point%20%7B%20x%3A%201.0%2C%20y%3A%204.0%20%7D%3B%0A%20%20%20%20println!(%22%E6%95%B4%E6%95%B0%E7%82%B9%3A%20(%7B%7D%2C%20%7B%7D)%22%2C%20int_point.x%2C%20int_point.y)%3B%0A%20%20%20%20println!(%22%E6%B5%AE%E7%82%B9%E7%82%B9%3A%20(%7B%7D%2C%20%7B%7D)%22%2C%20flt_point.x%2C%20flt_point.y)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Point&lt;T&gt; {
    x: T,
    y: T,
}

fn main() {
    let int_point = Point { x: 5, y: 10 };
    let flt_point = Point { x: 1.0, y: 4.0 };
    println!("整数点: ({}, {})", int_point.x, int_point.y);
    println!("浮点点: ({}, {})", flt_point.x, flt_point.y);
}</code></pre></div>
<p>注意：<code>x</code> 和 <code>y</code> 共享同一个 <code>T</code>，所以它们必须是<strong>相同类型</strong>：</p>
<div class="code-runner" data-full-code="struct%20Point%3CT%3E%20%7B%20x%3A%20T%2C%20y%3A%20T%20%7D%0Afn%20main()%20%7B%0Alet%20mixed%20%3D%20Point%20%7B%20x%3A%205%2C%20y%3A%204.0%20%7D%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81x%20%E6%8E%A8%E5%AF%BC%E4%B8%BA%20i32%EF%BC%8Cy%20%E6%8E%A8%E5%AF%BC%E4%B8%BA%20f64%0A%7D" data-has-hidden="true" data-mode="expect-error"><pre><code class="language-rust">let mixed = Point { x: 5, y: 4.0 }; // 错误！x 推导为 i32，y 推导为 f64</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">struct</span><span style="color:#B392F0"> Point</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">T</span><span style="color:#E1E4E8">&gt; { x</span><span style="color:#F97583">:</span><span style="color:#B392F0"> T</span><span style="color:#E1E4E8">, y</span><span style="color:#F97583">:</span><span style="color:#B392F0"> T</span><span style="color:#E1E4E8"> }</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {</span></span>
<span class="line"><span style="color:#F97583">let</span><span style="color:#E1E4E8"> mixed </span><span style="color:#F97583">=</span><span style="color:#B392F0"> Point</span><span style="color:#E1E4E8"> { x</span><span style="color:#F97583">:</span><span style="color:#79B8FF"> 5</span><span style="color:#E1E4E8">, y</span><span style="color:#F97583">:</span><span style="color:#79B8FF"> 4.0</span><span style="color:#E1E4E8"> }; </span><span style="color:#6A737D">// 错误！x 推导为 i32，y 推导为 f64</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></div></div>
<p>如果需要两字段可以是不同类型，用<strong>两个类型参数</strong>：</p>
<div class="code-runner" data-full-code="struct%20Point%3CT%2C%20U%3E%20%7B%0A%20%20%20%20x%3A%20T%2C%0A%20%20%20%20y%3A%20U%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mixed%20%3D%20Point%20%7B%20x%3A%205%2C%20y%3A%204.0%20%7D%3B%0A%20%20%20%20println!(%22%E6%B7%B7%E5%90%88%E7%82%B9%3A%20(%7B%7D%2C%20%7B%7D)%22%2C%20mixed.x%2C%20mixed.y)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Point&lt;T, U&gt; {
    x: T,
    y: U,
}

fn main() {
    let mixed = Point { x: 5, y: 4.0 };
    println!("混合点: ({}, {})", mixed.x, mixed.y);
}</code></pre></div>
<h2 id="泛型枚举">泛型枚举</h2>
<p>你其实早就在用泛型枚举了——标准库里的 <code>Option</code> 和 <code>Result</code> 就是：</p>
<pre><code class="language-rust">// 标准库中的定义（仅供参考，不需要自己写）
enum Option&lt;T&gt; {
    Some(T),
    None,
}

enum Result&lt;T, E&gt; {
    Ok(T),
    Err(E),
}</code></pre>
<p><code>Option&lt;i32&gt;</code> 和 <code>Option&lt;String&gt;</code> 结构完全一样，只是 <code>T</code> 不同。这就是泛型让一个枚举适配无数场景的原理。</p>
<p>你自己也可以定义泛型枚举：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E4%B8%80%E4%B8%AA%E7%AE%80%E5%8D%95%E7%9A%84%E4%BA%8C%E5%8F%89%E6%A0%91%EF%BC%8C%E5%AD%98%E5%82%A8%E4%BB%BB%E6%84%8F%E7%B1%BB%E5%9E%8B%E7%9A%84%E5%80%BC%0Aenum%20Tree%3CT%3E%20%7B%0A%20%20%20%20Leaf(T)%2C%0A%20%20%20%20Node(Box%3CTree%3CT%3E%3E%2C%20Box%3CTree%3CT%3E%3E)%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20tree%3A%20Tree%3Ci32%3E%20%3D%20Tree%3A%3ANode(%0A%20%20%20%20%20%20%20%20Box%3A%3Anew(Tree%3A%3ALeaf(1))%2C%0A%20%20%20%20%20%20%20%20Box%3A%3Anew(Tree%3A%3ALeaf(2))%2C%0A%20%20%20%20)%3B%0A%20%20%20%20println!(%22%E5%88%9B%E5%BB%BA%E6%88%90%E5%8A%9F%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 一个简单的二叉树，存储任意类型的值
enum Tree&lt;T&gt; {
    Leaf(T),
    Node(Box&lt;Tree&lt;T&gt;&gt;, Box&lt;Tree&lt;T&gt;&gt;),
}

fn main() {
    let tree: Tree&lt;i32&gt; = Tree::Node(
        Box::new(Tree::Leaf(1)),
        Box::new(Tree::Leaf(2)),
    );
    println!("创建成功");
}</code></pre></div>
<h1 id="方法与单态化">方法与单态化</h1>
<h2 id="为泛型类型定义方法">为泛型类型定义方法</h2>
<p>在 <code>impl</code> 块上使用泛型，需要在 <code>impl</code> 关键字后面同样声明 <code>&lt;T&gt;</code>：</p>
<div class="code-runner" data-full-code="struct%20Point%3CT%3E%20%7B%0A%20%20%20%20x%3A%20T%2C%0A%20%20%20%20y%3A%20T%2C%0A%7D%0A%0Aimpl%3CT%3E%20Point%3CT%3E%20%7B%0A%20%20%20%20fn%20x(%26self)%20-%3E%20%26T%20%7B%0A%20%20%20%20%20%20%20%20%26self.x%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20y(%26self)%20-%3E%20%26T%20%7B%0A%20%20%20%20%20%20%20%20%26self.y%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20p%20%3D%20Point%20%7B%20x%3A%205%2C%20y%3A%2010%20%7D%3B%0A%20%20%20%20println!(%22x%20%3D%20%7B%7D%2C%20y%20%3D%20%7B%7D%22%2C%20p.x()%2C%20p.y())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Point&lt;T&gt; {
    x: T,
    y: T,
}

impl&lt;T&gt; Point&lt;T&gt; {
    fn x(&amp;self) -&gt; &amp;T {
        &amp;self.x
    }

    fn y(&amp;self) -&gt; &amp;T {
        &amp;self.y
    }
}

fn main() {
    let p = Point { x: 5, y: 10 };
    println!("x = {}, y = {}", p.x(), p.y());
}</code></pre></div>
<p>为什么要写<strong>两次</strong> <code>&lt;T&gt;</code>？对比函数就清楚了：</p>
<pre><code class="language-rust">// 函数：先在 &lt;T&gt; 里"引入"T，然后在参数里"使用"T
fn foo&lt;T&gt;(x: T) { ... }
//    ^^^  ^^^
//    引入  使用

// impl：同样先"引入"T，然后在类型名里"使用"T
impl&lt;T&gt; Point&lt;T&gt; { ... }
//   ^^^       ^^^
//   引入       使用</code></pre>
<p><code>impl&lt;T&gt;</code> 里的 <code>&lt;T&gt;</code> 是在告诉编译器：“接下来的 <code>T</code> 是一个类型参数，不是某个叫做 <code>T</code> 的具体类型”。如果直接写 <code>impl Point&lt;T&gt;</code>（省掉前面的 <code>&lt;T&gt;</code>），编译器会以为 <code>T</code> 是某个具体类型的名字，找不到就报错。</p>
<h2 id="为特定类型实现专属方法">为特定类型实现专属方法</h2>
<p>也可以只为某个<strong>具体类型</strong>实现方法。这时 <code>impl</code> 后面不加 <code>&lt;T&gt;</code>：</p>
<div class="code-runner" data-full-code="struct%20Point%3CT%3E%20%7B%0A%20%20%20%20x%3A%20T%2C%0A%20%20%20%20y%3A%20T%2C%0A%7D%0A%0A%2F%2F%20%E6%89%80%E6%9C%89%20Point%3CT%3E%20%E9%83%BD%E6%9C%89%E8%BF%99%E4%B8%AA%E6%96%B9%E6%B3%95%0Aimpl%3CT%3E%20Point%3CT%3E%20%7B%0A%20%20%20%20fn%20x(%26self)%20-%3E%20%26T%20%7B%0A%20%20%20%20%20%20%20%20%26self.x%0A%20%20%20%20%7D%0A%7D%0A%0A%2F%2F%20%E5%8F%AA%E6%9C%89%20Point%3Cf64%3E%20%E6%89%8D%E6%9C%89%E8%BF%99%E4%B8%AA%E6%96%B9%E6%B3%95%0Aimpl%20Point%3Cf64%3E%20%7B%0A%20%20%20%20fn%20distance_from_origin(%26self)%20-%3E%20f64%20%7B%0A%20%20%20%20%20%20%20%20(self.x.powi(2)%20%2B%20self.y.powi(2)).sqrt()%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20flt_p%20%3D%20Point%20%7B%20x%3A%203.0_f64%2C%20y%3A%204.0%20%7D%3B%0A%20%20%20%20println!(%22x%20%3D%20%7B%7D%22%2C%20flt_p.x())%3B%0A%20%20%20%20println!(%22%E8%B7%9D%E5%8E%9F%E7%82%B9%E8%B7%9D%E7%A6%BB%3A%20%7B%7D%22%2C%20flt_p.distance_from_origin())%3B%20%2F%2F%205.0%0A%0A%20%20%20%20let%20int_p%20%3D%20Point%20%7B%20x%3A%203_i32%2C%20y%3A%204%20%7D%3B%0A%20%20%20%20println!(%22x%20%3D%20%7B%7D%22%2C%20int_p.x())%3B%0A%20%20%20%20%2F%2F%20int_p.distance_from_origin()%3B%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%81i32%20%E7%89%88%E6%9C%AC%E6%B2%A1%E6%9C%89%E8%BF%99%E4%B8%AA%E6%96%B9%E6%B3%95%0A%7D" data-mode="run"><pre><code class="language-rust">struct Point&lt;T&gt; {
    x: T,
    y: T,
}

// 所有 Point&lt;T&gt; 都有这个方法
impl&lt;T&gt; Point&lt;T&gt; {
    fn x(&amp;self) -&gt; &amp;T {
        &amp;self.x
    }
}

// 只有 Point&lt;f64&gt; 才有这个方法
impl Point&lt;f64&gt; {
    fn distance_from_origin(&amp;self) -&gt; f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

fn main() {
    let flt_p = Point { x: 3.0_f64, y: 4.0 };
    println!("x = {}", flt_p.x());
    println!("距原点距离: {}", flt_p.distance_from_origin()); // 5.0

    let int_p = Point { x: 3_i32, y: 4 };
    println!("x = {}", int_p.x());
    // int_p.distance_from_origin(); // 编译错误！i32 版本没有这个方法
}</code></pre></div>
<h2 id="单态化零开销抽象">单态化：零开销抽象</h2>
<p>泛型的关键卖点：<strong>运行时没有任何额外开销</strong>。</p>
<p>Rust 编译器在编译阶段做<strong>单态化</strong>（monomorphization）——把每处泛型代码展开成针对该具体类型的独立代码：</p>
<pre><code class="language-rust">// 你写的
fn largest&lt;T: PartialOrd&gt;(list: &amp;[T]) -&gt; &amp;T { ... }

// 你调用了
largest(&amp;[1_i32, 2, 3]);
largest(&amp;[1.0_f64, 2.0, 3.0]);

// 编译器实际生成（概念示意）
fn largest_i32(list: &amp;[i32]) -&gt; &amp;i32 { ... }
fn largest_f64(list: &amp;[f64]) -&gt; &amp;f64 { ... }</code></pre>
<p>这意味着：</p>
<table><thead><tr><th>维度</th><th>表现</th></tr></thead><tbody><tr><td>运行速度</td><td>和手写具体类型代码完全相同</td></tr><tr><td>编译时间</td><td>用到的类型越多，编译越慢</td></tr><tr><td>二进制大小</td><td>每种类型生成一份代码，体积略增</td></tr></tbody></table>
<p>Rust 选择了”编译期多花时间，换取运行时零开销”的策略。这正是 Rust 能做到既安全又高效的原因之一。</p>
<blockquote>
<p>与单态化相对的是<strong>动态分发</strong>（<code>dyn Trait</code>）：推迟到运行时才确定类型，有运行时开销但编译产物更小。两种策略各有适用场景，后续章节会介绍。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="泛型函数测验">泛型函数测验</h2>
</div>
<pre><code class="language-rust">struct Container&lt;T, U&gt; {
    first: T,
    second: U,
}</code></pre>
</div>
<h2 id="泛型-impl-测验">泛型 impl 测验</h2>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面的 <code>wrap</code> 函数只能包装 <code>i32</code>。请将它改造成泛型函数，使其能包装任意类型，并让 <code>main</code> 中所有调用都正常编译运行。</p>
<div class="code-editor" data-block-id="10-generics-traits/01-generics-syntax#2:4" data-expect-mode="literal" data-expect-pattern="%5B42%5D%0A%5B%22hello%22%5D%0A%5Btrue%5D" data-starter-code="fn%20wrap(value%3A%20i32)%20-%3E%20Vec%3Ci32%3E%20%7B%0A%20%20%20%20vec!%5Bvalue%5D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20nums%20%3D%20wrap(42)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20nums)%3B%20%2F%2F%20%5B42%5D%0A%0A%20%20%20%20%2F%2F%20%E8%AE%A9%E4%B8%8B%E9%9D%A2%E4%B8%A4%E8%A1%8C%E4%B9%9F%E8%83%BD%E5%B7%A5%E4%BD%9C%0A%20%20%20%20let%20strs%20%3D%20wrap(%22hello%22)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20strs)%3B%20%2F%2F%20%5B%22hello%22%5D%0A%0A%20%20%20%20let%20bools%20%3D%20wrap(true)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20bools)%3B%20%2F%2F%20%5Btrue%5D%0A%7D"><pre><code class="language-rust">fn wrap(value: i32) -&gt; Vec&lt;i32&gt; {
    vec![value]
}

fn main() {
    let nums = wrap(42);
    println!("{:?}", nums); // [42]

    // 让下面两行也能工作
    let strs = wrap("hello");
    println!("{:?}", strs); // ["hello"]

    let bools = wrap(true);
    println!("{:?}", bools); // [true]
}</code></pre></div> 