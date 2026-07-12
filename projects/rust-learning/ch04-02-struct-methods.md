---
title: "方法与关联函数"
description: "自定义类型 - 方法与关联函数"
date: "2026-07-12"
order: 4002
tags: ["方法", "impl", "self", "关联函数", "接收者"]
est_time: "25 分钟"
---

 <h1 id="从函数到方法">从函数到方法</h1>
<p>前面我们学过函数，也学过结构体。现在的问题是：如何让某个函数与某个结构体<strong>紧密关联</strong>？</p>
<p>比如，计算矩形面积的逻辑本质上是<strong>矩形的行为</strong>，而不是一个独立的工具函数。用函数实现需要这样：</p>
<div class="code-runner" data-full-code="struct%20Rectangle%20%7B%0A%20%20%20%20width%3A%20u32%2C%0A%20%20%20%20height%3A%20u32%2C%0A%7D%0A%0Afn%20area(rect%3A%20%26Rectangle)%20-%3E%20u32%20%7B%0A%20%20%20%20rect.width%20*%20rect.height%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20rect%20%3D%20Rectangle%20%7B%20width%3A%2030%2C%20height%3A%2050%20%7D%3B%0A%20%20%20%20println!(%22%E9%9D%A2%E7%A7%AF%EF%BC%9A%7B%7D%20%E5%B9%B3%E6%96%B9%E5%83%8F%E7%B4%A0%22%2C%20area(%26rect))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Rectangle {
    width: u32,
    height: u32,
}

fn area(rect: &amp;Rectangle) -&gt; u32 {
    rect.width * rect.height
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("面积：{} 平方像素", area(&amp;rect));
}</code></pre></div>
<p>问题是：读代码的人需要去别处找 <code>area</code> 函数，且不清楚它属于哪个类型。如果 Rust 能把函数”附属”到结构体上就好了。</p>
<p><strong>方法</strong> 就是解决这个问题的。方法是与某个类型相关联的函数，可以用 <code>.</code> 运算符调用：</p>
<div class="code-runner" data-full-code="struct%20Rectangle%20%7B%0A%20%20%20%20width%3A%20u32%2C%0A%20%20%20%20height%3A%20u32%2C%0A%7D%0A%0Aimpl%20Rectangle%20%7B%0A%20%20%20%20fn%20area(%26self)%20-%3E%20u32%20%7B%0A%20%20%20%20%20%20%20%20self.width%20*%20self.height%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20rect%20%3D%20Rectangle%20%7B%20width%3A%2030%2C%20height%3A%2050%20%7D%3B%0A%20%20%20%20println!(%22%E9%9D%A2%E7%A7%AF%EF%BC%9A%7B%7D%20%E5%B9%B3%E6%96%B9%E5%83%8F%E7%B4%A0%22%2C%20rect.area())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&amp;self) -&gt; u32 {
        self.width * self.height
    }
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("面积：{} 平方像素", rect.area());
}</code></pre></div>
<p>现在清晰多了：<code>area()</code> 是 <code>Rectangle</code> 的方法，调用时直接用 <code>rect.area()</code>。</p>
<h1 id="定义方法">定义方法</h1>
<p>方法定义在 <strong><code>impl</code> 块</strong>（implementation block）中。语法：</p>
<div class="code-runner" data-full-code="struct%20Circle%20%7B%0A%20%20%20%20radius%3A%20f64%2C%0A%7D%0A%0Aimpl%20Circle%20%7B%0A%20%20%20%20fn%20area(%26self)%20-%3E%20f64%20%7B%0A%20%20%20%20%20%20%20%203.14159%20*%20self.radius%20*%20self.radius%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20is_large(%26self)%20-%3E%20bool%20%7B%0A%20%20%20%20%20%20%20%20self.area()%20%3E%20100.0%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20circle%20%3D%20Circle%20%7B%20radius%3A%205.0%20%7D%3B%0A%20%20%20%20println!(%22%E5%9C%86%E7%9A%84%E9%9D%A2%E7%A7%AF%EF%BC%9A%7B%3A.2%7D%22%2C%20circle.area())%3B%0A%20%20%20%20println!(%22%E6%98%AF%E5%90%A6%E5%BE%88%E5%A4%A7%EF%BC%9F%7B%7D%22%2C%20circle.is_large())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Circle {
    radius: f64,
}

impl Circle {
    fn area(&amp;self) -&gt; f64 {
        3.14159 * self.radius * self.radius
    }

    fn is_large(&amp;self) -&gt; bool {
        self.area() &gt; 100.0
    }
}

fn main() {
    let circle = Circle { radius: 5.0 };
    println!("圆的面积：{:.2}", circle.area());
    println!("是否很大？{}", circle.is_large());
}</code></pre></div>
<p><strong>关键点：</strong></p>
<ul>
<li><code>impl 类型名 { ... }</code> 定义该类型的实现块</li>
<li>方法的<strong>第一个参数总是 <code>self</code></strong>，它代表调用方法的实例</li>
<li>方法在 <code>impl</code> 块中，与类型在同一个逻辑命名空间</li>
</ul>
<h2 id="self-的三种形式">self 的三种形式</h2>
<p>方法可以以三种方式接收 <code>self</code>，取决于方法是否需要修改实例：</p>
<h3 id="1-self--不可变借用最常用">1. <code>&amp;self</code> — 不可变借用（最常用）</h3>
<p>方法只需读取字段值：</p>
<div class="code-runner" data-full-code="struct%20Rectangle%20%7B%0A%20%20%20%20width%3A%20u32%2C%0A%20%20%20%20height%3A%20u32%2C%0A%7D%0A%0Aimpl%20Rectangle%20%7B%0A%20%20%20%20fn%20area(%26self)%20-%3E%20u32%20%7B%0A%20%20%20%20%20%20%20%20self.width%20*%20self.height%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20width(%26self)%20-%3E%20bool%20%7B%0A%20%20%20%20%20%20%20%20self.width%20%3E%200%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20rect%20%3D%20Rectangle%20%7B%20width%3A%2030%2C%20height%3A%2050%20%7D%3B%0A%20%20%20%20println!(%22%E9%9D%A2%E7%A7%AF%EF%BC%9A%7B%7D%22%2C%20rect.area())%3B%0A%20%20%20%20println!(%22%E5%AE%BD%E5%BA%A6%E6%98%AF%E5%90%A6%E4%B8%BA%E6%AD%A3%EF%BC%9F%7B%7D%22%2C%20rect.width())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&amp;self) -&gt; u32 {
        self.width * self.height
    }

    fn width(&amp;self) -&gt; bool {
        self.width &gt; 0
    }
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("面积：{}", rect.area());
    println!("宽度是否为正？{}", rect.width());
}</code></pre></div>
<h3 id="2-mut-self--可变借用">2. <code>&amp;mut self</code> — 可变借用</h3>
<p>方法需要修改字段值：</p>
<div class="code-runner" data-full-code="struct%20Counter%20%7B%0A%20%20%20%20count%3A%20i32%2C%0A%7D%0A%0Aimpl%20Counter%20%7B%0A%20%20%20%20fn%20increment(%26mut%20self)%20%7B%0A%20%20%20%20%20%20%20%20self.count%20%2B%3D%201%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20value(%26self)%20-%3E%20i32%20%7B%0A%20%20%20%20%20%20%20%20self.count%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20c%20%3D%20Counter%20%7B%20count%3A%200%20%7D%3B%0A%20%20%20%20c.increment()%3B%0A%20%20%20%20c.increment()%3B%0A%20%20%20%20println!(%22%E8%AE%A1%E6%95%B0%E5%99%A8%E5%80%BC%EF%BC%9A%7B%7D%22%2C%20c.value())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Counter {
    count: i32,
}

impl Counter {
    fn increment(&amp;mut self) {
        self.count += 1;
    }

    fn value(&amp;self) -&gt; i32 {
        self.count
    }
}

fn main() {
    let mut c = Counter { count: 0 };
    c.increment();
    c.increment();
    println!("计数器值：{}", c.value());
}</code></pre></div>
<h3 id="3-self--获取所有权不常见">3. <code>self</code> — 获取所有权（不常见）</h3>
<p>方法消费掉实例（获取完全所有权），调用后实例无法再用。这用于需要将实例转换成其他形式的情况：</p>
<div class="code-runner" data-full-code="struct%20Document%20%7B%0A%20%20%20%20content%3A%20String%2C%0A%7D%0A%0Aimpl%20Document%20%7B%0A%20%20%20%20fn%20into_uppercase(self)%20-%3E%20String%20%7B%0A%20%20%20%20%20%20%20%20self.content.to_uppercase()%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20doc%20%3D%20Document%20%7B%20content%3A%20String%3A%3Afrom(%22hello%22)%20%7D%3B%0A%20%20%20%20let%20upper%20%3D%20doc.into_uppercase()%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20upper)%3B%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20doc.content)%3B%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81doc%20%E5%B7%B2%E8%A2%AB%E8%BD%AC%E7%A7%BB%0A%7D" data-mode="run"><pre><code class="language-rust">struct Document {
    content: String,
}

impl Document {
    fn into_uppercase(self) -&gt; String {
        self.content.to_uppercase()
    }
}

fn main() {
    let doc = Document { content: String::from("hello") };
    let upper = doc.into_uppercase();
    println!("{}", upper);
    // println!("{}", doc.content);  // 错误！doc 已被转移
}</code></pre></div>
<blockquote>
<p><strong>命名惯例</strong>：获取所有权的方法经常用 <code>into_</code> 前缀，表示”消费转换”。比如 <code>into_uppercase()</code> 表示”消费这个实例，返回大写版本”。</p>
</blockquote>
<h2 id="多个参数的方法">多个参数的方法</h2>
<p>方法可以有除 <code>self</code> 外的其他参数：</p>
<div class="code-runner" data-full-code="struct%20Rectangle%20%7B%0A%20%20%20%20width%3A%20u32%2C%0A%20%20%20%20height%3A%20u32%2C%0A%7D%0A%0Aimpl%20Rectangle%20%7B%0A%20%20%20%20fn%20can_hold(%26self%2C%20other%3A%20%26Rectangle)%20-%3E%20bool%20%7B%0A%20%20%20%20%20%20%20%20self.width%20%3E%20other.width%20%26%26%20self.height%20%3E%20other.height%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20rect1%20%3D%20Rectangle%20%7B%20width%3A%2030%2C%20height%3A%2050%20%7D%3B%0A%20%20%20%20let%20rect2%20%3D%20Rectangle%20%7B%20width%3A%2010%2C%20height%3A%2040%20%7D%3B%0A%20%20%20%20let%20rect3%20%3D%20Rectangle%20%7B%20width%3A%2060%2C%20height%3A%2045%20%7D%3B%0A%0A%20%20%20%20println!(%22rect1%20%E8%83%BD%E5%AE%B9%E7%BA%B3%20rect2%EF%BC%9F%7B%7D%22%2C%20rect1.can_hold(%26rect2))%3B%0A%20%20%20%20println!(%22rect1%20%E8%83%BD%E5%AE%B9%E7%BA%B3%20rect3%EF%BC%9F%7B%7D%22%2C%20rect1.can_hold(%26rect3))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&amp;self, other: &amp;Rectangle) -&gt; bool {
        self.width &gt; other.width &amp;&amp; self.height &gt; other.height
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    let rect2 = Rectangle { width: 10, height: 40 };
    let rect3 = Rectangle { width: 60, height: 45 };

    println!("rect1 能容纳 rect2？{}", rect1.can_hold(&amp;rect2));
    println!("rect1 能容纳 rect3？{}", rect1.can_hold(&amp;rect3));
}</code></pre></div>
<h1 id="关联函数">关联函数</h1>
<p>有时你需要一个与某个类型相关但<strong>不作用于实例</strong>的函数，比如构造函数。这叫<strong>关联函数</strong>（associated function）。定义方式是在 <code>impl</code> 块中不使用 <code>self</code> 参数：</p>
<div class="code-runner" data-full-code="struct%20Rectangle%20%7B%0A%20%20%20%20width%3A%20u32%2C%0A%20%20%20%20height%3A%20u32%2C%0A%7D%0A%0Aimpl%20Rectangle%20%7B%0A%20%20%20%20%2F%2F%20%E5%85%B3%E8%81%94%E5%87%BD%E6%95%B0%EF%BC%8C%E7%94%A8%E4%BA%8E%E5%88%9B%E5%BB%BA%E6%AD%A3%E6%96%B9%E5%BD%A2%0A%20%20%20%20fn%20square(size%3A%20u32)%20-%3E%20Rectangle%20%7B%0A%20%20%20%20%20%20%20%20Rectangle%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20width%3A%20size%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20height%3A%20size%2C%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E6%99%AE%E9%80%9A%E6%96%B9%E6%B3%95%0A%20%20%20%20fn%20area(%26self)%20-%3E%20u32%20%7B%0A%20%20%20%20%20%20%20%20self.width%20*%20self.height%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E7%94%A8%E5%85%B3%E8%81%94%E5%87%BD%E6%95%B0%E5%88%9B%E5%BB%BA%E5%AE%9E%E4%BE%8B%EF%BC%8C%E7%94%A8%20%3A%3A%20%E8%80%8C%E4%B8%8D%E6%98%AF%20.%0A%20%20%20%20let%20square%20%3D%20Rectangle%3A%3Asquare(50)%3B%0A%20%20%20%20println!(%22%E6%AD%A3%E6%96%B9%E5%BD%A2%E9%9D%A2%E7%A7%AF%EF%BC%9A%7B%7D%22%2C%20square.area())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // 关联函数，用于创建正方形
    fn square(size: u32) -&gt; Rectangle {
        Rectangle {
            width: size,
            height: size,
        }
    }

    // 普通方法
    fn area(&amp;self) -&gt; u32 {
        self.width * self.height
    }
}

fn main() {
    // 用关联函数创建实例，用 :: 而不是 .
    let square = Rectangle::square(50);
    println!("正方形面积：{}", square.area());
}</code></pre></div>
<p><strong>关键点：</strong></p>
<ul>
<li>关联函数用 <code>::</code> 调用（命名空间操作符），如 <code>Rectangle::square(50)</code></li>
<li><code>String::from()</code> 就是一个关联函数</li>
<li>关联函数经常用作<strong>构造函数</strong>（从某些数据创建实例）</li>
</ul>
<h1 id="多个-impl-块">多个 impl 块</h1>
<p>你可以为同一个类型定义多个 <code>impl</code> 块。这在组织代码时很有用（虽然通常不必要）：</p>
<div class="code-runner" data-full-code="struct%20Rectangle%20%7B%0A%20%20%20%20width%3A%20u32%2C%0A%20%20%20%20height%3A%20u32%2C%0A%7D%0A%0Aimpl%20Rectangle%20%7B%0A%20%20%20%20fn%20area(%26self)%20-%3E%20u32%20%7B%0A%20%20%20%20%20%20%20%20self.width%20*%20self.height%0A%20%20%20%20%7D%0A%7D%0A%0Aimpl%20Rectangle%20%7B%0A%20%20%20%20fn%20perimeter(%26self)%20-%3E%20u32%20%7B%0A%20%20%20%20%20%20%20%202%20*%20(self.width%20%2B%20self.height)%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20rect%20%3D%20Rectangle%20%7B%20width%3A%2030%2C%20height%3A%2050%20%7D%3B%0A%20%20%20%20println!(%22%E9%9D%A2%E7%A7%AF%EF%BC%9A%7B%7D%2C%20%E5%91%A8%E9%95%BF%EF%BC%9A%7B%7D%22%2C%20rect.area()%2C%20rect.perimeter())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&amp;self) -&gt; u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn perimeter(&amp;self) -&gt; u32 {
        2 * (self.width + self.height)
    }
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("面积：{}, 周长：{}", rect.area(), rect.perimeter());
}</code></pre></div>
<p>多个 <code>impl</code> 块在泛型和 trait（后续章节）中特别有用，可以为不同的类型参数或 trait 提供不同的实现。</p>
<h1 id="自动引用和解引用">自动引用和解引用</h1>
<p>Rust 有一个方便的特性：调用方法时，<strong>自动添加 <code>&amp;</code>、<code>&amp;mut</code> 或 <code>*</code> 以匹配方法签名</strong>。</p>
<p>比如，方法签名是 <code>&amp;self</code>，但你调用时用的可能是：</p>
<div class="code-runner" data-full-code="struct%20Point%20%7B%0A%20%20%20%20x%3A%20i32%2C%0A%20%20%20%20y%3A%20i32%2C%0A%7D%0A%0Aimpl%20Point%20%7B%0A%20%20%20%20fn%20distance_from_origin(%26self)%20-%3E%20f64%20%7B%0A%20%20%20%20%20%20%20%20((self.x.pow(2)%20%2B%20self.y.pow(2))%20as%20f64).sqrt()%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20p%20%3D%20Point%20%7B%20x%3A%203%2C%20y%3A%204%20%7D%3B%0A%0A%20%20%20%20%2F%2F%20%E8%BF%99%E5%9B%9B%E7%A7%8D%E8%B0%83%E7%94%A8%E6%96%B9%E5%BC%8F%E9%83%BD%E7%AD%89%E4%BB%B7%EF%BC%9A%0A%20%20%20%20p.distance_from_origin()%3B%20%20%20%20%20%20%2F%2F%20%E8%87%AA%E5%8A%A8%E8%BD%AC%E4%B8%BA%20(%26p).distance_from_origin()%0A%20%20%20%20(%26p).distance_from_origin()%3B%20%20%20%2F%2F%20%E6%98%BE%E5%BC%8F%E5%86%99%E5%87%BA%0A%0A%20%20%20%20let%20p_ref%20%3D%20%26p%3B%0A%20%20%20%20p_ref.distance_from_origin()%3B%20%20%2F%2F%20%E4%B9%9F%E5%8F%AF%E4%BB%A5%0A%7D" data-mode="run"><pre><code class="language-rust">struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn distance_from_origin(&amp;self) -&gt; f64 {
        ((self.x.pow(2) + self.y.pow(2)) as f64).sqrt()
    }
}

fn main() {
    let p = Point { x: 3, y: 4 };

    // 这四种调用方式都等价：
    p.distance_from_origin();      // 自动转为 (&amp;p).distance_from_origin()
    (&amp;p).distance_from_origin();   // 显式写出

    let p_ref = &amp;p;
    p_ref.distance_from_origin();  // 也可以
}</code></pre></div>
<p>这个特性使 Rust 的方法调用语法很优雅，无需手动管理引用。所以 <code>-&gt;</code>（C/C++ 的结构体指针成员访问符）在 Rust 里完全不需要——<code>.</code> 就够了，编译器会自动帮你处理。</p>
<h1 id="练习题">练习题</h1>
<pre><code class="language-rust">struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&amp;self) -&gt; u32 {
        self.width * self.height
    }
}</code></pre>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习-1为结构体添加方法">练习 1：为结构体添加方法</h3>
<p>定义一个 <code>Account</code> 结构体，包含 <code>balance</code>（f64）字段。为它实现三个方法：</p>
<div class="code-editor" data-block-id="04-custom-types/02-struct-methods#5:3" data-expect-mode="literal" data-expect-pattern="%E5%88%9D%E5%A7%8B%E4%BD%99%E9%A2%9D%EF%BC%9A100%0A%E5%AD%98%E5%85%A5%2050%20%E5%90%8E%EF%BC%9A150%0A%E5%8F%96%E5%87%BA%2030%20%E6%88%90%E5%8A%9F%EF%BC%8C%E4%BD%99%E9%A2%9D%EF%BC%9A120%0A%E5%8F%96%E5%87%BA%20200%20%E5%A4%B1%E8%B4%A5%EF%BC%88%E4%BD%99%E9%A2%9D%E4%B8%8D%E8%B6%B3%EF%BC%89" data-starter-code="struct%20Account%20%7B%0A%20%20%20%20balance%3A%20f64%2C%0A%7D%0A%0Aimpl%20Account%20%7B%0A%20%20%20%20fn%20deposit(%26mut%20self%2C%20amount%3A%20f64)%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9E%E7%8E%B0%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20withdraw(%26mut%20self%2C%20amount%3A%20f64)%20-%3E%20bool%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9E%E7%8E%B0%EF%BC%8C%E4%BD%99%E9%A2%9D%E4%B8%8D%E8%B6%B3%E8%BF%94%E5%9B%9E%20false%EF%BC%8C%E5%90%A6%E5%88%99%E8%BF%94%E5%9B%9E%20true%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20get_balance(%26self)%20-%3E%20f64%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9E%E7%8E%B0%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20account%20%3D%20Account%20%7B%20balance%3A%20100.0%20%7D%3B%0A%0A%20%20%20%20println!(%22%E5%88%9D%E5%A7%8B%E4%BD%99%E9%A2%9D%EF%BC%9A%7B%7D%22%2C%20account.get_balance())%3B%0A%0A%20%20%20%20account.deposit(50.0)%3B%0A%20%20%20%20println!(%22%E5%AD%98%E5%85%A5%2050%20%E5%90%8E%EF%BC%9A%7B%7D%22%2C%20account.get_balance())%3B%0A%0A%20%20%20%20if%20account.withdraw(30.0)%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%8F%96%E5%87%BA%2030%20%E6%88%90%E5%8A%9F%EF%BC%8C%E4%BD%99%E9%A2%9D%EF%BC%9A%7B%7D%22%2C%20account.get_balance())%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20if%20!account.withdraw(200.0)%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%8F%96%E5%87%BA%20200%20%E5%A4%B1%E8%B4%A5%EF%BC%88%E4%BD%99%E9%A2%9D%E4%B8%8D%E8%B6%B3%EF%BC%89%22)%3B%0A%20%20%20%20%7D%0A%7D"><pre><code class="language-rust">struct Account {
    balance: f64,
}

impl Account {
    fn deposit(&amp;mut self, amount: f64) {
        // TODO: 实现
    }

    fn withdraw(&amp;mut self, amount: f64) -&gt; bool {
        // TODO: 实现，余额不足返回 false，否则返回 true
    }

    fn get_balance(&amp;self) -&gt; f64 {
        // TODO: 实现
    }
}

fn main() {
    let mut account = Account { balance: 100.0 };

    println!("初始余额：{}", account.get_balance());

    account.deposit(50.0);
    println!("存入 50 后：{}", account.get_balance());

    if account.withdraw(30.0) {
        println!("取出 30 成功，余额：{}", account.get_balance());
    }

    if !account.withdraw(200.0) {
        println!("取出 200 失败（余额不足）");
    }
}</code></pre></div>
<h3 id="练习-2实现关联函数作为构造函数">练习 2：实现关联函数作为构造函数</h3>
<p>定义一个 <code>Color</code> 结构体，包含 <code>r</code>、<code>g</code>、<code>b</code> 三个 <code>u8</code> 字段，写出对应关联函数和方法并实现三个功能：</p>
<div class="code-editor" data-block-id="04-custom-types/02-struct-methods#5:4" data-expect-mode="literal" data-expect-pattern="%E7%99%BD%E8%89%B2%E4%BA%AE%E5%BA%A6%EF%BC%9A255.00%0A%E9%BB%91%E8%89%B2%E4%BA%AE%E5%BA%A6%EF%BC%9A0.00" data-starter-code="%23%5Bderive(Debug)%5D%0Astruct%20Color%20%7B%0A%20%20%20%20r%3A%20u8%2C%0A%20%20%20%20g%3A%20u8%2C%0A%20%20%20%20b%3A%20u8%2C%0A%7D%0A%0A%2F%2F%20TODO%3A%20%E8%BF%94%E5%9B%9E%E7%99%BD%E8%89%B2%20(255%2C%20255%2C%20255)%0A%2F%2F%20TODO%3A%20%E8%BF%94%E5%9B%9E%E9%BB%91%E8%89%B2%20(0%2C%200%2C%200)%0A%2F%2F%20TODO%3A%20%E8%AE%A1%E7%AE%97%E4%BA%AE%E5%BA%A6%EF%BC%88(r%2Bg%2Bb)%2F3%EF%BC%89%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20white%20%3D%20Color%3A%3Awhite()%3B%0A%20%20%20%20let%20black%20%3D%20Color%3A%3Ablack()%3B%0A%0A%20%20%20%20println!(%22%E7%99%BD%E8%89%B2%E4%BA%AE%E5%BA%A6%EF%BC%9A%7B%3A.2%7D%22%2C%20white.brightness()%20as%20f64)%3B%0A%20%20%20%20println!(%22%E9%BB%91%E8%89%B2%E4%BA%AE%E5%BA%A6%EF%BC%9A%7B%3A.2%7D%22%2C%20black.brightness()%20as%20f64)%3B%0A%7D"><pre><code class="language-rust">#[derive(Debug)]
struct Color {
    r: u8,
    g: u8,
    b: u8,
}

// TODO: 返回白色 (255, 255, 255)
// TODO: 返回黑色 (0, 0, 0)
// TODO: 计算亮度（(r+g+b)/3）

fn main() {
    let white = Color::white();
    let black = Color::black();

    println!("白色亮度：{:.2}", white.brightness() as f64);
    println!("黑色亮度：{:.2}", black.brightness() as f64);
}</code></pre></div> 