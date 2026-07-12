---
title: "控制流"
description: "基本语法 - 控制流"
date: "2026-07-12"
order: 2005
tags: ["if", "else", "loop", "while", "for", "控制流", "循环", "条件分支"]
est_time: "30 分钟"
---

 <h1 id="分支表达式">分支表达式</h1>
<p>根据条件走不同的路，或者反复执行同一段代码——这就是<strong>控制流</strong>的本质。本文介绍 Rust 的 <code>if</code> 表达式和三种循环。</p>
<p><code>if</code> 表达式让程序根据条件选择执行不同的代码块。</p>
<h2 id="基本语法">基本语法</h2>
<p>关键字 <code>if</code>，后跟条件，再接花括号包裹的代码块。条件为真时执行该块，为假时执行可选的 <code>else</code> 块：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20number%20%3D%203%3B%0A%0A%20%20%20%20if%20number%20%3C%205%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%9D%A1%E4%BB%B6%E4%B8%BA%E7%9C%9F%22)%3B%0A%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%9D%A1%E4%BB%B6%E4%B8%BA%E5%81%87%22)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let number = 3;

    if number &lt; 5 {
        println!("条件为真");
    } else {
        println!("条件为假");
    }
}</code></pre></div>
<p><code>else</code> 分支是<strong>可选的</strong>。如果条件为假且没有 <code>else</code>，程序直接跳过 <code>if</code> 块，继续往下执行。</p>
<h2 id="条件必须是-bool">条件必须是 bool</h2>
<p>Rust <strong>不会</strong>自动将其他类型转换为布尔值。如果把整数直接作为条件，编译器会报错：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20number%20%3D%203%3B%0A%20%20%20%20if%20number%20%7B%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E6%9C%9F%E6%9C%9B%20bool%EF%BC%8C%E5%BE%97%E5%88%B0%E6%95%B4%E6%95%B0%0A%20%20%20%20%20%20%20%20println!(%22number%20%E4%B8%8D%E7%AD%89%E4%BA%8E%E9%9B%B6%22)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let number = 3;
    if number {  // 错误：期望 bool，得到整数
        println!("number 不等于零");
    }
}</code></pre></div>
<p>这和 JavaScript 或 Ruby 不同——那些语言里 <code>0</code>、空字符串等会被隐式当作 <code>false</code>。Rust 要求你<strong>显式写出条件</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20number%20%3D%203%3B%0A%20%20%20%20if%20number%20!%3D%200%20%7B%20%2F%2F%E9%A1%B5%E9%9D%A2%E4%B8%8A%E6%9C%89%E6%97%B6%E5%80%99%E4%BC%9A%E6%98%BE%E5%BC%8F%E4%B8%8D%E7%AD%89%E5%8F%B7%E4%B8%BA%E2%89%A0%EF%BC%8C%E8%BF%99%E9%87%8C%E6%98%AF%E6%98%BE%E5%BC%8F%E7%9A%84%E9%97%AE%E9%A2%98%EF%BC%8C%E4%BB%A3%E7%A0%81%E9%87%8C%E4%BB%8D%E5%86%99%E6%88%90%20!%20%2B%20%3D%0A%20%20%20%20%20%20%20%20println!(%22number%20%E4%B8%8D%E7%AD%89%E4%BA%8E%E9%9B%B6%22)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let number = 3;
    if number != 0 { //页面上有时候会显式不等号为≠，这里是显式的问题，代码里仍写成 ! + =
        println!("number 不等于零");
    }
}</code></pre></div>
<p>这个设计让代码意图更清晰，也杜绝了一类依赖隐式转换的隐性 bug。</p>
<h2 id="else-if-多重条件">else if 多重条件</h2>
<p>需要检查多个条件时，可以用 <code>else if</code> 链：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20number%20%3D%206%3B%0A%0A%20%20%20%20if%20number%20%25%204%20%3D%3D%200%20%7B%0A%20%20%20%20%20%20%20%20println!(%22number%20%E8%83%BD%E8%A2%AB%204%20%E6%95%B4%E9%99%A4%22)%3B%0A%20%20%20%20%7D%20else%20if%20number%20%25%203%20%3D%3D%200%20%7B%0A%20%20%20%20%20%20%20%20println!(%22number%20%E8%83%BD%E8%A2%AB%203%20%E6%95%B4%E9%99%A4%22)%3B%0A%20%20%20%20%7D%20else%20if%20number%20%25%202%20%3D%3D%200%20%7B%0A%20%20%20%20%20%20%20%20println!(%22number%20%E8%83%BD%E8%A2%AB%202%20%E6%95%B4%E9%99%A4%22)%3B%0A%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20println!(%22number%20%E4%B8%8D%E8%83%BD%E8%A2%AB%204%E3%80%813%20%E6%88%96%202%20%E6%95%B4%E9%99%A4%22)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let number = 6;

    if number % 4 == 0 {
        println!("number 能被 4 整除");
    } else if number % 3 == 0 {
        println!("number 能被 3 整除");
    } else if number % 2 == 0 {
        println!("number 能被 2 整除");
    } else {
        println!("number 不能被 4、3 或 2 整除");
    }
}</code></pre></div>
<p>注意：Rust 只会执行<strong>第一个条件为真</strong>的分支，然后直接跳过其余所有分支。6 同时能被 3 和 2 整除，但程序只会打印”能被 3 整除”——找到第一个匹配就停了。</p>
<blockquote>
<p>如果 <code>else if</code> 链过长，代码会变得难以维护。Rust 有一个更强大的分支结构 <a href="/RustCourse/chapters/04-custom-types/04-match"><code>match</code></a>，我们在自定义类型章节会详细讲解，它正是为处理多条件分支而生的。</p>
</blockquote>
<h2 id="if-是表达式">if 是表达式</h2>
<p>这是 Rust 和许多语言的一个关键区别：<code>if</code> 在 Rust 中是<strong>表达式</strong>，不仅仅是语句——它可以返回一个值，可以用在赋值的右边。代码块的返回值是块中<strong>最后一个表达式的值</strong>；如果块中只有语句没有表达式，就隐式返回 <code>()</code>（之前讲过的单元类型）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20condition%20%3D%20true%3B%0A%20%20%20%20let%20number%20%3D%20if%20condition%20%7B%205%20%7D%20else%20%7B%206%20%7D%3B%0A%0A%20%20%20%20println!(%22number%20%E7%9A%84%E5%80%BC%E6%98%AF%EF%BC%9A%7B%7D%22%2C%20number)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E5%88%86%E6%94%AF%E4%B8%AD%E5%8F%AA%E6%9C%89%E8%AF%AD%E5%8F%A5%EF%BC%8C%E5%B0%B1%E8%BF%94%E5%9B%9E%20()%0A%20%20%20%20let%20result%20%3D%20if%20condition%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%9D%A1%E4%BB%B6%E4%B8%BA%E7%9C%9F%22)%3B%20%2F%2F%20%E8%BF%99%E6%98%AF%E8%AF%AD%E5%8F%A5%EF%BC%8C%E6%B2%A1%E6%9C%89%E8%BF%94%E5%9B%9E%E5%80%BC%0A%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20()%0A%20%20%20%20%7D%3B%0A%20%20%20%20println!(%22result%20%E7%9A%84%E7%B1%BB%E5%9E%8B%E6%98%AF%20()%3A%20%7B%3A%3F%7D%22%2C%20result)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let condition = true;
    let number = if condition { 5 } else { 6 };

    println!("number 的值是：{}", number);

    // 如果分支中只有语句，就返回 ()
    let result = if condition {
        println!("条件为真"); // 这是语句，没有返回值
    } else {
        ()
    };
    println!("result 的类型是 (): {:?}", result);
}</code></pre></div>
<p><code>number</code> 会根据条件被绑定到 <code>5</code> 或 <code>6</code>。第二个例子中，<code>if</code> 分支中的 <code>println!</code> 是语句，没有返回值，所以 <code>result</code> 得到的是 <code>()</code>。</p>
<p><strong>两个分支的类型必须相同</strong>。Rust 在编译时就需要确定变量的类型，如果两个分支返回不同类型，编译器无法决定 <code>number</code> 是什么类型：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20condition%20%3D%20true%3B%0A%20%20%20%20let%20number%20%3D%20if%20condition%20%7B%205%20%7D%20else%20%7B%20%22six%22%20%7D%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E6%95%B4%E6%95%B0%E4%B8%8E%E5%AD%97%E7%AC%A6%E4%B8%B2%E7%B1%BB%E5%9E%8B%E4%B8%8D%E5%85%BC%E5%AE%B9%0A%20%20%20%20println!(%22number%20%E7%9A%84%E5%80%BC%E6%98%AF%EF%BC%9A%7B%7D%22%2C%20number)%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    let condition = true;
    let number = if condition { 5 } else { "six" }; // 错误：整数与字符串类型不兼容
    println!("number 的值是：{}", number);
}</code></pre></div>
<p>这种编译期类型检查是 Rust 安全保证的基础——运行时不会出现”这个变量到底是什么类型”的意外。</p>
<h1 id="循环表达式">循环表达式</h1>
<p>Rust 有三种循环：<code>loop</code>、<code>while</code>、<code>for</code>，各有适用场景。</p>
<h2 id="loop-无限循环">loop 无限循环</h2>
<p><code>loop</code> 是最基础的循环——它会<strong>无限重复</strong>执行代码块，直到你用 <code>break</code> 显式停止。</p>
<blockquote>
<p>与 C 的 <code>while(1)</code> 不同，<strong>Rust 编译器会进行控制流分析</strong>。如果编译器发现某个分支永远无法到达 <code>break</code>，它会标记该代码为不可达（unreachable code）。这样能帮你提前发现意外的无限循环。但如果代码真的被设计为无限循环（比如 <code>loop { /* 故意死循环 */ }</code>），编译器也不会报错（没有不可到达的代码时，比如 main  函数里的顶层 loop，后面没有任何代码了），尊重你的设计意图。</p>
</blockquote>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20count%20%3D%200%3B%0A%0A%20%20%20%20loop%20%7B%0A%20%20%20%20%20%20%20%20count%20%2B%3D%201%3B%0A%20%20%20%20%20%20%20%20println!(%22%E7%AC%AC%20%7B%7D%20%E6%AC%A1%E5%BE%AA%E7%8E%AF%22%2C%20count)%3B%0A%0A%20%20%20%20%20%20%20%20if%20count%20%3D%3D%203%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20break%3B%20%2F%2F%20%E6%BB%A1%E8%B6%B3%E6%9D%A1%E4%BB%B6%EF%BC%8C%E9%80%80%E5%87%BA%E5%BE%AA%E7%8E%AF%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E5%BE%AA%E7%8E%AF%E7%BB%93%E6%9D%9F%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut count = 0;

    loop {
        count += 1;
        println!("第 {} 次循环", count);

        if count == 3 {
            break; // 满足条件，退出循环
        }
    }

    println!("循环结束");
}</code></pre></div>
<p><code>continue</code> 关键字会跳过当前迭代剩余的代码，直接进入下一次迭代：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20i%20%3D%200%3B%0A%0A%20%20%20%20loop%20%7B%0A%20%20%20%20%20%20%20%20i%20%2B%3D%201%3B%0A%20%20%20%20%20%20%20%20if%20i%20%3E%206%20%7B%20break%3B%20%7D%0A%0A%20%20%20%20%20%20%20%20if%20i%20%25%202%20%3D%3D%200%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20continue%3B%20%2F%2F%20%E8%B7%B3%E8%BF%87%E5%81%B6%E6%95%B0%EF%BC%8C%E4%B8%8D%E6%89%A7%E8%A1%8C%E4%B8%8B%E9%9D%A2%E7%9A%84%20println%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20i)%3B%20%2F%2F%20%E5%8F%AA%E6%89%93%E5%8D%B0%E5%A5%87%E6%95%B0%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut i = 0;

    loop {
        i += 1;
        if i &gt; 6 { break; }

        if i % 2 == 0 {
            continue; // 跳过偶数，不执行下面的 println
        }
        println!("{}", i); // 只打印奇数
    }
}</code></pre></div>
<h2 id="循环标签">循环标签</h2>
<p>嵌套循环中，<code>break</code> 和 <code>continue</code> 默认作用于<strong>最内层</strong>的循环。如果需要跳出外层循环，可以给循环贴上<strong>标签</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20count%20%3D%200%3B%0A%0A%20%20%20%20'counting_up%3A%20loop%20%7B%0A%20%20%20%20%20%20%20%20println!(%22count%20%3D%20%7B%7D%22%2C%20count)%3B%0A%20%20%20%20%20%20%20%20let%20mut%20remaining%20%3D%2010%3B%0A%0A%20%20%20%20%20%20%20%20loop%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22remaining%20%3D%20%7B%7D%22%2C%20remaining)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20if%20remaining%20%3D%3D%209%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20break%3B%20%2F%2F%20%E5%8F%AA%E9%80%80%E5%87%BA%E5%86%85%E5%B1%82%E5%BE%AA%E7%8E%AF%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20if%20count%20%3D%3D%202%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20break%20'counting_up%3B%20%2F%2F%20%E9%80%80%E5%87%BA%E5%A4%96%E5%B1%82%E5%BE%AA%E7%8E%AF%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20%20%20remaining%20-%3D%201%3B%0A%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20count%20%2B%3D%201%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E6%9C%80%E7%BB%88%20count%20%3D%20%7B%7D%22%2C%20count)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut count = 0;

    'counting_up: loop {
        println!("count = {}", count);
        let mut remaining = 10;

        loop {
            println!("remaining = {}", remaining);
            if remaining == 9 {
                break; // 只退出内层循环
            }
            if count == 2 {
                break 'counting_up; // 退出外层循环
            }
            remaining -= 1;
        }

        count += 1;
    }

    println!("最终 count = {}", count);
}</code></pre></div>
<p>标签以单引号开头，如 <code>'counting_up</code>。<code>break 'counting_up</code> 会跳出被标记的那层循环，无论当前嵌套多深。</p>
<h2 id="while-条件循环">while 条件循环</h2>
<p><code>while</code> 是”当条件为真时持续循环”的简洁写法。<strong><code>while</code> 先检查条件再执行循环体</strong>——如果条件一开始就为假，循环体会一次都不执行。</p>
<p>Rust 没有 <code>do-while</code> 这样的”先执行后检查”的循环结构。如果你需要至少执行一次的循环，可以用 <code>loop</code> + <code>if</code> + <code>break</code> 的模式代替：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20number%20%3D%203%3B%0A%0A%20%20%20%20while%20number%20!%3D%200%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D!%22%2C%20number)%3B%0A%20%20%20%20%20%20%20%20number%20-%3D%201%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%E5%8F%91%E5%B0%84%EF%BC%81%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut number = 3;

    while number != 0 {
        println!("{}!", number);
        number -= 1;
    }

    println!("发射！");
}</code></pre></div>
<p>这等价于 <code>loop</code> + <code>if</code> + <code>break</code> 的组合写法，但更简洁清晰。<strong>当循环只有一个退出条件时，优先用 <code>while</code>。</strong></p>
<h2 id="for-遍历集合">for 遍历集合</h2>
<p><code>for</code> 循环用于遍历一个集合中的每个元素，是 Rust 中<strong>最常用的循环</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%20%5B10%2C%2020%2C%2030%2C%2040%2C%2050%5D%3B%0A%0A%20%20%20%20for%20element%20in%20a%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%80%BC%E6%98%AF%EF%BC%9A%7B%7D%22%2C%20element)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let a = [10, 20, 30, 40, 50];

    for element in a {
        println!("值是：{}", element);
    }
}</code></pre></div>
<p>对比用 <code>while</code> 手动管理索引，<code>for</code> 有明显优势：</p>
<ul>
<li><strong>不会越界</strong>：Rust 自动处理边界，不存在意外访问越界索引的风险</li>
<li><strong>更简洁</strong>：不需要声明、更新索引变量</li>
<li><strong>更安全</strong>：如果数组长度变了，不需要同步修改循环条件</li>
</ul>
<h3 id="range范围">Range（范围）</h3>
<p>在 Rust 中，<code>..</code> 和 <code>..=</code> 是<strong>Range 操作符</strong>，用来表示一个数值序列。它们经常配合 <code>for</code> 使用：</p>
<table><thead><tr><th>操作符</th><th>示例</th><th>具体数字</th><th>说明</th></tr></thead><tbody><tr><td><code>..</code></td><td><code>1..5</code></td><td>1, 2, 3, 4</td><td>不含右端点（半开区间）</td></tr><tr><td><code>..=</code></td><td><code>1..=5</code></td><td>1, 2, 3, 4, 5</td><td>含两个端点（闭区间）</td></tr><tr><td><code>..</code></td><td><code>..5</code></td><td>0, 1, 2, 3, 4</td><td>从 0 开始，不含右端</td></tr><tr><td><code>..=</code></td><td><code>..=5</code></td><td>0, 1, 2, 3, 4, 5</td><td>从 0 开始，含右端</td></tr></tbody></table>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E4%B8%8D%E5%90%AB%E5%8F%B3%E7%AB%AF%EF%BC%9A1%E3%80%812%E3%80%813%E3%80%814%0A%20%20%20%20for%20i%20in%201..5%20%7B%0A%20%20%20%20%20%20%20%20println!(%221..5%3A%20%7B%7D%22%2C%20i)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E5%90%AB%E4%B8%A4%E7%AB%AF%EF%BC%9A1%E3%80%812%E3%80%813%E3%80%814%E3%80%815%0A%20%20%20%20for%20i%20in%201..%3D5%20%7B%0A%20%20%20%20%20%20%20%20println!(%221..%3D5%3A%20%7B%7D%22%2C%20i)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E4%BB%8E%200%20%E5%BC%80%E5%A7%8B%EF%BC%9A0%E3%80%811%E3%80%812%E3%80%813%E3%80%814%0A%20%20%20%20for%20i%20in%20..5%20%7B%0A%20%20%20%20%20%20%20%20println!(%22..5%3A%20%7B%7D%22%2C%20i)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // 不含右端：1、2、3、4
    for i in 1..5 {
        println!("1..5: {}", i);
    }

    // 含两端：1、2、3、4、5
    for i in 1..=5 {
        println!("1..=5: {}", i);
    }

    // 从 0 开始：0、1、2、3、4
    for i in ..5 {
        println!("..5: {}", i);
    }
}</code></pre></div>
<p>使用 <code>Range</code> 配合 <code>.rev()</code> 来倒计时，这是 Rust 中的惯用写法：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20for%20number%20in%20(1..4).rev()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D!%22%2C%20number)%3B%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22%E5%8F%91%E5%B0%84%EF%BC%81%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    for number in (1..4).rev() {
        println!("{}!", number);
    }
    println!("发射！");
}</code></pre></div>
<p><code>(1..4).rev()</code> 先创建 Range <code>1..4</code>（即 1、2、3），再用 <code>.rev()</code> 反转为 3、2、1。</p>
<blockquote>
<p>即使只是重复固定次数，Rustacean 也倾向于用 <code>for</code> + Range，而不是 <code>while</code>。<code>for</code> 更能表达”遍历一个序列”的意图，代码读起来也更直观。</p>
</blockquote>
<h2 id="循环作为表达式">循环作为表达式</h2>
<p>在 Rust 中，<strong><code>loop</code>、<code>while</code>、<code>for</code> 都是表达式</strong>（就像 <code>if</code> 一样），可以返回值。通常 <code>while</code> 和 <code>for</code> 返回 <code>()</code>，但 <code>loop</code> 可以通过 <code>break</code> 返回具体的值。</p>
<table><thead><tr><th>循环</th><th>返回值</th><th>用法</th></tr></thead><tbody><tr><td><code>loop</code></td><td>任意类型（由 <code>break</code> 决定）</td><td>可用 <code>break value</code> 提取结果</td></tr><tr><td><code>while</code></td><td>通常是 <code>()</code></td><td>循环完成后返回 <code>()</code></td></tr><tr><td><code>for</code></td><td>通常是 <code>()</code></td><td>遍历完成后返回 <code>()</code></td></tr></tbody></table>
<p><strong>代码对比</strong>：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20loop%20%E4%BD%9C%E4%B8%BA%E8%A1%A8%E8%BE%BE%E5%BC%8F%EF%BC%8C%E8%BF%94%E5%9B%9E%E5%80%BC%0A%20%20%20%20let%20result1%20%3D%20loop%20%7B%0A%20%20%20%20%20%20%20%20break%2042%3B%0A%20%20%20%20%7D%3B%0A%20%20%20%20println!(%22loop%20%E8%BF%94%E5%9B%9E%3A%20%7B%7D%22%2C%20result1)%3B%20%2F%2F%2042%0A%0A%20%20%20%20%2F%2F%20while%20%E4%BD%9C%E4%B8%BA%E8%A1%A8%E8%BE%BE%E5%BC%8F%EF%BC%8C%E8%BF%94%E5%9B%9E%20()%0A%20%20%20%20let%20result2%20%3D%20while%20true%20%7B%20break%3B%20%7D%3B%0A%20%20%20%20println!(%22while%20%E8%BF%94%E5%9B%9E%3A%20%7B%3A%3F%7D%22%2C%20result2)%3B%20%2F%2F%20()%0A%0A%20%20%20%20%2F%2F%20for%20%E4%BD%9C%E4%B8%BA%E8%A1%A8%E8%BE%BE%E5%BC%8F%EF%BC%8C%E8%BF%94%E5%9B%9E%20()%0A%20%20%20%20let%20result3%20%3D%20for%20i%20in%201..%3D3%20%7B%20println!(%22%7B%7D%22%2C%20i)%3B%20%7D%3B%0A%20%20%20%20println!(%22for%20%E8%BF%94%E5%9B%9E%3A%20%7B%3A%3F%7D%22%2C%20result3)%3B%20%2F%2F%20()%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // loop 作为表达式，返回值
    let result1 = loop {
        break 42;
    };
    println!("loop 返回: {}", result1); // 42

    // while 作为表达式，返回 ()
    let result2 = while true { break; };
    println!("while 返回: {:?}", result2); // ()

    // for 作为表达式，返回 ()
    let result3 = for i in 1..=3 { println!("{}", i); };
    println!("for 返回: {:?}", result3); // ()
}</code></pre></div>
<p>这种设计让 Rust 在表达式的层面保持了一致性——几乎所有控制流结构都遵循”表达式返回值”的原则。</p>
<h1 id="练习题">练习题</h1>
<h2 id="if-表达式测验">if 表达式测验</h2>
<pre><code class="language-rust">fn main() {
    let x = 10;
    let result = if x &gt; 5 { x * 2 } else { x + 1 };
    println!("{}", result);
}</code></pre>
</div>
</div>
<pre><code class="language-rust">fn main() {
    let val = if true { 42 } else { "hello" };
    println!("{}", val);
}</code></pre>
</div>
<h2 id="循环测验">循环测验</h2>
<pre><code class="language-rust">fn main() {
    let result = loop {
        break 42;
    };
    println!("{}", result);
}</code></pre>
</div>
<pre><code class="language-rust">fn main() {
    let mut i = 0;
    'outer: loop {
        loop {
            if i == 2 {
                break 'outer;
            }
            i += 1;
        }
    }
    println!("{}", i);
}</code></pre>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习一fizzbuzz">练习一：FizzBuzz</h3>
<p>经典的 FizzBuzz 问题：用 <code>for</code> 循环打印 1 到 20。能被 3 整除打印 <code>Fizz</code>，能被 5 整除打印 <code>Buzz</code>，既能被 3 也能被 5 整除打印 <code>FizzBuzz</code>，其余打印数字本身。</p>
<div class="code-editor" data-block-id="02-basic-syntax/05-control-flow#2:6" data-expect-mode="literal" data-expect-pattern="1%0A2%0AFizz%0A4%0ABuzz%0AFizz%0A7%0A8%0AFizz%0ABuzz%0A11%0AFizz%0A13%0A14%0AFizzBuzz%0A16%0A17%0AFizz%0A19%0ABuzz" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20for%20i%20in%201..%3D20%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E6%A0%B9%E6%8D%AE%E6%9D%A1%E4%BB%B6%E6%89%93%E5%8D%B0%20Fizz%E3%80%81Buzz%E3%80%81FizzBuzz%20%E6%88%96%E6%95%B0%E5%AD%97%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20i)%3B%0A%20%20%20%20%7D%0A%7D"><pre><code class="language-rust">fn main() {
    for i in 1..=20 {
        // TODO：根据条件打印 Fizz、Buzz、FizzBuzz 或数字
        println!("{}", i);
    }
}</code></pre></div>
<h3 id="练习二改写为-for-循环">练习二：改写为 for 循环</h3>
<p>下面用 <code>while</code> + 手动索引遍历数组，容易因索引出错导致 panic。请改写为等价的 <code>for</code> 循环，使代码更简洁、安全。</p>
<div class="code-editor" data-block-id="02-basic-syntax/05-control-flow#2:7" data-expect-mode="literal" data-expect-pattern="%E5%80%BC%EF%BC%9A1%0A%E5%80%BC%EF%BC%9A2%0A%E5%80%BC%EF%BC%9A3%0A%E5%80%BC%EF%BC%9A4%0A%E5%80%BC%EF%BC%9A5" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20numbers%20%3D%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20let%20mut%20index%20%3D%200%3B%0A%0A%20%20%20%20while%20index%20%3C%205%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%80%BC%EF%BC%9A%7B%7D%22%2C%20numbers%5Bindex%5D)%3B%0A%20%20%20%20%20%20%20%20index%20%2B%3D%201%3B%0A%20%20%20%20%7D%0A%7D"><pre><code class="language-rust">fn main() {
    let numbers = [1, 2, 3, 4, 5];
    let mut index = 0;

    while index &lt; 5 {
        println!("值：{}", numbers[index]);
        index += 1;
    }
}</code></pre></div> 