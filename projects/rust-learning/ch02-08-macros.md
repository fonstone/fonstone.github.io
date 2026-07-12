---
title: "声明宏"
description: "基本语法 - 声明宏"
date: "2026-07-12"
order: 2008
tags: ["macro_rules!", "声明宏", "元变量", "重复模式", "宏卫生性", "macro_export", "元编程"]
est_time: "50 分钟"
---

 <h1 id="宏的基础">宏的基础</h1>
<h2 id="什么是宏">什么是宏</h2>
<p>你已经频繁使用过<code>println!</code>宏了。是时候看清楚它背后的机制，并学会编写自己的宏了。</p>
<p><strong>宏</strong>（Macro）是一种”为写代码而写代码”的机制，称为<strong>元编程</strong>（metaprogramming）。宏在<strong>编译时展开</strong>——编译器遇到宏调用时，先把它展开成普通代码，再编译生成的代码。</p>
<p>宏调用有一个显眼的标志：名称后跟感叹号 <code>!</code>。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20println!(%22%E8%BF%99%E6%98%AF%E5%AE%8F%E8%B0%83%E7%94%A8%22)%3B%20%20%20%20%20%20%20%20%20%20%2F%2F%20println!%20%E5%B1%95%E5%BC%80%E4%B8%BA%E6%A0%BC%E5%BC%8F%E5%8C%96%E6%89%93%E5%8D%B0%E4%BB%A3%E7%A0%81%0A%20%20%20%20let%20v%20%3D%20vec!%5B10%2C%2020%2C%2030%5D%3B%20%20%20%20%20%20%20%20%2F%2F%20vec!%20%E5%B1%95%E5%BC%80%E4%B8%BA%E5%88%9B%E5%BB%BA%20Vec%20%E7%9A%84%E4%BB%A3%E7%A0%81%0A%20%20%20%20let%20s%20%3D%20format!(%22%E7%BB%93%E6%9E%9C%EF%BC%9A%7B%7D%22%2C%2042)%3B%20%2F%2F%20format!%20%E5%B1%95%E5%BC%80%E4%B8%BA%E6%9E%84%E5%BB%BA%20String%20%E7%9A%84%E4%BB%A3%E7%A0%81%0A%20%20%20%20println!(%22%7B%3A%3F%7D%20%20%7B%7D%22%2C%20v%2C%20s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    println!("这是宏调用");          // println! 展开为格式化打印代码
    let v = vec![10, 20, 30];        // vec! 展开为创建 Vec 的代码
    let s = format!("结果：{}", 42); // format! 展开为构建 String 的代码
    println!("{:?}  {}", v, s);
}</code></pre></div>
<blockquote>
<p><strong>本文范围说明</strong>：Rust 的宏分为两大类——<strong>声明宏</strong>（<code>macro_rules!</code>）和<strong>过程宏</strong>。本文只讲解声明宏。过程宏涉及 <code>TokenStream</code>、<code>syn</code>、<code>quote</code> 等进阶概念，难度较高，已单独成章，详见<a href="/RustCourse/chapters/21-proc-macros/00-index">过程宏</a>。</p>
</blockquote>
<h2 id="宏与函数的核心区别">宏与函数的核心区别</h2>
<p>宏能做到函数做不到的三件事：</p>
<p><strong>一、接受可变数量的参数。</strong> 函数签名必须写明参数个数，宏不需要：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20println!(%22%E4%B8%80%E4%B8%AA%E5%8F%82%E6%95%B0%22)%3B%0A%20%20%20%20println!(%22%E4%B8%A4%E4%B8%AA%EF%BC%9A%7B%7D%22%2C%2099)%3B%0A%20%20%20%20println!(%22%E5%9B%9B%E4%B8%AA%EF%BC%9A%7B%7D%20%7B%7D%20%7B%7D%22%2C%20%22a%22%2C%20%22b%22%2C%20%22c%22)%3B%0A%20%20%20%20%2F%2F%20%E6%99%AE%E9%80%9A%E5%87%BD%E6%95%B0%E6%97%A0%E6%B3%95%E5%81%9A%E5%88%B0%E5%8F%82%E6%95%B0%E4%B8%AA%E6%95%B0%E5%8F%AF%E5%8F%98%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    println!("一个参数");
    println!("两个：{}", 99);
    println!("四个：{} {} {}", "a", "b", "c");
    // 普通函数无法做到参数个数可变
}</code></pre></div>
<p><strong>二、可以在编译时生成代码（例如 trait 实现）。</strong>
像 <code>#[derive(Debug)]</code> 这类宏，能在<strong>编译期</strong>为你自动“写”出实现 <code>Debug</code> trait 的完整 Rust 源代码，并交给编译器一起翻译成机器码。
普通函数绝对做不到这一点。因为普通函数只有在程序编译完成、进入<strong>运行期</strong>后才会被真正的执行。当函数运行时，程序已经是底层的机器码，编译器早就“下班”了，根本无法再接收和处理任何新生成的代码。
因此，“写代码”这个动作，只能交给在编译阶段就提前激活的<strong>宏</strong>来完成。</p>
<blockquote>
<p><code>#[derive(...)]</code> 可能会令你疑惑，不是刚讲了是属性吗，现在怎么又说是宏了呢？这其实是因为从<strong>语法层面</strong>看<code>#[derive(...)]</code>是一个属性，但从<strong>实现原理</strong>看，它由<strong>过程宏</strong>提供支持——编译器在编译时调用这些宏，自动生成代码。这是 Rust 元编程的核心体现。详细原理见<a href="/RustCourse/chapters/21-proc-macros/00-index">过程宏</a>。本章仅了解即可。</p>
</blockquote>
<p><strong>三、必须在调用前定义或引入。</strong> 这与函数不同——函数可以在文件任意位置定义，宏的作用域是<strong>顺序</strong>的：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20greet!()%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E6%AD%A4%E5%A4%84%E5%AE%8F%E5%B0%9A%E6%9C%AA%E5%AE%9A%E4%B9%89%0A%7D%0A%0Amacro_rules!%20greet%20%7B%0A%20%20%20%20()%20%3D%3E%20%7B%20println!(%22%E4%BD%A0%E5%A5%BD%EF%BC%81%22)%3B%20%7D%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn main() {
    greet!(); // 错误：此处宏尚未定义
}

macro_rules! greet {
    () =&gt; { println!("你好！"); };
}</code></pre></div>
<p>把宏定义移到调用之前就能正常工作：</p>
<div class="code-runner" data-full-code="macro_rules!%20greet%20%7B%0A%20%20%20%20()%20%3D%3E%20%7B%20println!(%22%E4%BD%A0%E5%A5%BD%EF%BC%81%22)%3B%20%7D%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20greet!()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">macro_rules! greet {
    () =&gt; { println!("你好！"); };
}

fn main() {
    greet!();
}</code></pre></div>
<h2 id="第一个声明宏">第一个声明宏</h2>
<p><code>macro_rules!</code> 让你编写基于<strong>模式匹配</strong>的宏。语法结构：</p>
<pre><code class="language-text">macro_rules! 宏名 {
    (模式1) =&gt; { 展开代码1 };
    (模式2) =&gt; { 展开代码2 };
}</code></pre>
<p>调用宏时，编译器依次用输入去匹配各规则，使用<strong>第一个匹配成功</strong>的规则展开：</p>
<div class="code-runner" data-full-code="macro_rules!%20say%20%7B%0A%20%20%20%20%2F%2F%20%E8%A7%84%E5%88%99%201%EF%BC%9A%E7%A9%BA%E5%8F%82%E6%95%B0%0A%20%20%20%20()%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%BD%A0%E5%A5%BD%EF%BC%8C%E4%B8%96%E7%95%8C%EF%BC%81%22)%3B%0A%20%20%20%20%7D%3B%0A%20%20%20%20%2F%2F%20%E8%A7%84%E5%88%99%202%EF%BC%9A%E4%B8%80%E4%B8%AA%E8%A1%A8%E8%BE%BE%E5%BC%8F%0A%20%20%20%20(%24msg%3Aexpr)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%B6%88%E6%81%AF%EF%BC%9A%7B%7D%22%2C%20%24msg)%3B%0A%20%20%20%20%7D%3B%0A%20%20%20%20%2F%2F%20%E8%A7%84%E5%88%99%203%EF%BC%9A%E4%B8%A4%E4%B8%AA%E8%A1%A8%E8%BE%BE%E5%BC%8F%0A%20%20%20%20(%24a%3Aexpr%2C%20%24b%3Aexpr)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%20%2B%20%7B%7D%20%3D%20%7B%7D%22%2C%20%24a%2C%20%24b%2C%20%24a%20%2B%20%24b)%3B%0A%20%20%20%20%7D%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20say!()%3B%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%8C%B9%E9%85%8D%E8%A7%84%E5%88%99%201%0A%20%20%20%20say!(%22Rust%22)%3B%20%20%20%20%20%2F%2F%20%E5%8C%B9%E9%85%8D%E8%A7%84%E5%88%99%202%0A%20%20%20%20say!(10%2C%2020)%3B%20%20%20%20%20%2F%2F%20%E5%8C%B9%E9%85%8D%E8%A7%84%E5%88%99%203%0A%7D" data-mode="run"><pre><code class="language-rust">macro_rules! say {
    // 规则 1：空参数
    () =&gt; {
        println!("你好，世界！");
    };
    // 规则 2：一个表达式
    ($msg:expr) =&gt; {
        println!("消息：{}", $msg);
    };
    // 规则 3：两个表达式
    ($a:expr, $b:expr) =&gt; {
        println!("{} + {} = {}", $a, $b, $a + $b);
    };
}

fn main() {
    say!();           // 匹配规则 1
    say!("Rust");     // 匹配规则 2
    say!(10, 20);     // 匹配规则 3
}</code></pre></div>
<h2 id="元变量与片段类型">元变量与片段类型</h2>
<p>模式中用 <code>$名称:片段类型</code> 捕获传入的代码片段，称为<strong>元变量</strong>（metavariable）。片段类型决定能匹配哪种代码：</p>
<table><thead><tr><th>片段类型</th><th>匹配内容</th><th>示例</th><th>说明</th></tr></thead><tbody><tr><td><code>expr</code></td><td>任意表达式</td><td><code>1+2</code>、<code>"hello"</code>、<code>foo()</code></td><td>能计算出值的代码，最常用</td></tr><tr><td><code>ty</code></td><td>任意类型</td><td><code>i32</code>、<code>String</code>、<code>Vec&lt;u8&gt;</code></td><td>类型标注中使用</td></tr><tr><td><code>ident</code></td><td>标识符</td><td><code>x</code>、<code>my_fn</code>、<code>Point</code></td><td>变量名、函数名、类型名等（不能是表达式）</td></tr><tr><td><code>literal</code></td><td>字面量</td><td><code>42</code>、<code>"text"</code>、<code>true</code>、<code>3.14</code></td><td>具体的值，不是变量</td></tr><tr><td><code>pat</code></td><td>模式</td><td><code>Some(x)</code>、<code>(a, b)</code>、<code>_</code></td><td>match/if let 分支的模式</td></tr><tr><td><code>stmt</code></td><td>单条语句</td><td><code>let x = 1;</code>、<code>foo();</code></td><td>以分号结尾的单行代码</td></tr><tr><td><code>block</code></td><td>代码块</td><td><code>{ let x = 1; x + 1 }</code></td><td>花括号包裹的多行代码</td></tr><tr><td><code>tt</code></td><td>Token 树</td><td>任何东西</td><td>最宽泛的类型，作为”兜底方案”</td></tr></tbody></table>
<p><strong>实际应用</strong>：</p>
<div class="code-runner" data-full-code="macro_rules!%20create_fn%20%7B%0A%20%20%20%20%2F%2F%20%24name%3Aident%20%E5%8C%B9%E9%85%8D%E5%87%BD%E6%95%B0%E5%90%8D%EF%BC%8C%24ret%3Aty%20%E5%8C%B9%E9%85%8D%E8%BF%94%E5%9B%9E%E7%B1%BB%E5%9E%8B%EF%BC%8C%24body%3Ablock%20%E5%8C%B9%E9%85%8D%E5%87%BD%E6%95%B0%E4%BD%93%0A%20%20%20%20(%24name%3Aident%2C%20%24ret%3Aty%2C%20%24body%3Ablock)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20fn%20%24name()%20-%3E%20%24ret%20%24body%0A%20%20%20%20%7D%3B%0A%7D%0A%0A%2F%2F%20%E5%AE%8F%E5%B1%95%E5%BC%80%E5%90%8E%E7%AD%89%E4%BB%B7%E4%BA%8E%EF%BC%9Afn%20add_one()%20-%3E%20i32%20%7B%2041%20%2B%201%20%7D%0Acreate_fn!(add_one%2C%20i32%2C%20%7B%2041%20%2B%201%20%7D)%3B%0A%0A%2F%2F%20%E5%B1%95%E5%BC%80%E5%90%8E%EF%BC%9Afn%20greeting()%20-%3E%20String%20%7B%20%22%E4%BD%A0%E5%A5%BD%EF%BC%81%22.to_string()%20%7D%0Acreate_fn!(greeting%2C%20String%2C%20%7B%20%22%E4%BD%A0%E5%A5%BD%EF%BC%81%22.to_string()%20%7D)%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20add_one())%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20greeting())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">macro_rules! create_fn {
    // $name:ident 匹配函数名，$ret:ty 匹配返回类型，$body:block 匹配函数体
    ($name:ident, $ret:ty, $body:block) =&gt; {
        fn $name() -&gt; $ret $body
    };
}

// 宏展开后等价于：fn add_one() -&gt; i32 { 41 + 1 }
create_fn!(add_one, i32, { 41 + 1 });

// 展开后：fn greeting() -&gt; String { "你好！".to_string() }
create_fn!(greeting, String, { "你好！".to_string() });

fn main() {
    println!("{}", add_one());
    println!("{}", greeting());
}</code></pre></div>
<h3 id="tt-的特殊地位">tt 的特殊地位</h3>
<p><code>tt</code>（token tree）是最宽泛的片段类型。<strong>重要</strong>：<code>tt</code> 能匹配<strong>单个 token 或完整的括号对</strong>，但不能匹配像 <code>3 + 5</code> 这样跨越多个不括号的 token。</p>
<div class="code-runner" data-full-code="macro_rules!%20my_debug%20%7B%0A%20%20%20%20%2F%2F%20%E6%8E%A5%E6%94%B6%E4%BB%BB%E6%84%8F%E5%8D%95%E4%B8%AA%20token%20%E6%88%96%E6%8B%AC%E5%8F%B7%E5%AF%B9%0A%20%20%20%20(%24x%3Att)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20%24x)%3B%0A%20%20%20%20%7D%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%0A%0A%20%20%20%20my_debug!(42)%3B%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%8D%95%E4%B8%AA%E5%AD%97%E9%9D%A2%E9%87%8F%20%E2%9C%93%0A%20%20%20%20my_debug!(true)%3B%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%8D%95%E4%B8%AA%E5%AD%97%E9%9D%A2%E9%87%8F%20%E2%9C%93%0A%20%20%20%20my_debug!(x)%3B%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%8D%95%E4%B8%AA%E6%A0%87%E8%AF%86%E7%AC%A6%20%E2%9C%93%0A%20%20%20%20my_debug!((3%20%2B%205))%3B%20%20%20%20%20%20%2F%2F%20%E6%8B%AC%E5%8F%B7%E5%AF%B9%20%E2%9C%93%0A%20%20%20%20%2F%2F%20my_debug!(3%20%2B%205)%3B%20%20%20%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%9A%E5%A4%9A%E4%B8%AA%E4%B8%8D%E6%8B%AC%E5%8F%B7%E7%9A%84%20token%0A%7D" data-mode="run"><pre><code class="language-rust">macro_rules! my_debug {
    // 接收任意单个 token 或括号对
    ($x:tt) =&gt; {
        println!("{:?}", $x);
    };
}

fn main() {
    let x = 5;

    my_debug!(42);           // 单个字面量 ✓
    my_debug!(true);         // 单个字面量 ✓
    my_debug!(x);            // 单个标识符 ✓
    my_debug!((3 + 5));      // 括号对 ✓
    // my_debug!(3 + 5);     // ✗ 错误：多个不括号的 token
}</code></pre></div>
<p><strong>tt 的实际用途</strong>：在需要原样转发给其他宏时（通常配合重复模式 <code>$(...)*</code>，后面会讲）：</p>
<div class="code-runner" data-full-code="macro_rules!%20passthrough%20%7B%0A%20%20%20%20(%24(%24t%3Att)*)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E6%8A%8A%E6%89%80%E6%9C%89%20token%20%E5%8E%9F%E5%B0%81%E4%B8%8D%E5%8A%A8%E5%9C%B0%E6%94%BE%E5%88%B0%20println!%20%E9%87%8C%0A%20%20%20%20%20%20%20%20%2F%2F%20%E5%AE%8F%E5%B1%95%E5%BC%80%E5%90%8E%E7%AD%89%E4%BB%B7%E4%BA%8E%EF%BC%9Aprintln!(%22%E6%A0%BC%E5%BC%8F%E5%8C%96%EF%BC%9A%7B%7D%20%2B%20%7B%7D%20%3D%20%7B%7D%22%2C%201%2C%202%2C%203)%0A%20%20%20%20%20%20%20%20println!(%24(%24t)*)%0A%20%20%20%20%7D%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20passthrough!(%22%E6%A0%BC%E5%BC%8F%E5%8C%96%EF%BC%9A%7B%7D%20%2B%20%7B%7D%20%3D%20%7B%7D%22%2C%201%2C%202%2C%203)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">macro_rules! passthrough {
    ($($t:tt)*) =&gt; {
        // 把所有 token 原封不动地放到 println! 里
        // 宏展开后等价于：println!("格式化：{} + {} = {}", 1, 2, 3)
        println!($($t)*)
    };
}

fn main() {
    passthrough!("格式化：{} + {} = {}", 1, 2, 3);
}</code></pre></div>
<h2 id="重复模式">重复模式</h2>
<p>重复模式让一条规则能匹配不定数量的输入，是声明宏最强大的特性之一。</p>
<p>语法：<code>$( 捕获内容 ) 分隔符? 量词</code>，这里很类似正则表达式的写法</p>
<table><thead><tr><th>量词</th><th>含义</th></tr></thead><tbody><tr><td><code>*</code></td><td>零次或多次</td></tr><tr><td><code>+</code></td><td>一次或多次</td></tr><tr><td><code>?</code></td><td>零次或一次（不能有分隔符）</td></tr></tbody></table>
<h3 id="逗号分隔的列表">逗号分隔的列表</h3>
<p>标准库的 <code>vec!</code> 宏就是用重复模式实现的，下面是简化版：</p>
<div class="code-runner" data-full-code="macro_rules!%20my_vec%20%7B%0A%20%20%20%20%2F%2F%20%24(%20%24x%3Aexpr%20)%2C*%20%20%E2%86%90%20%20%E5%8C%B9%E9%85%8D%EF%BC%9A%E9%9B%B6%E4%B8%AA%E6%88%96%E5%A4%9A%E4%B8%AA%22%E8%A1%A8%E8%BE%BE%E5%BC%8F%22%EF%BC%8C%E4%B8%AD%E9%97%B4%E7%94%A8%E9%80%97%E5%8F%B7%E5%88%86%E9%9A%94%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E8%A6%81%E7%94%A8%E5%88%86%E5%8F%B7%E5%88%86%E9%9A%94%EF%BC%8C%E5%86%99%E6%B3%95%E5%B0%B1%E6%98%AF%EF%BC%9A%24(%20%24x%3Aexpr%20)%3B*%0A%20%20%20%20(%20%24(%20%24x%3Aexpr%20)%2C*%20)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20let%20mut%20v%20%3D%20Vec%3A%3Anew()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%24(%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%B1%95%E5%BC%80%E5%8C%BA%EF%BC%9A%E5%AF%B9%E6%AF%8F%E4%B8%AA%20%24x%20%E9%87%8D%E5%A4%8D%E8%BF%99%E6%AE%B5%E4%BB%A3%E7%A0%81%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20v.push(%24x)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20)*%0A%20%20%20%20%20%20%20%20%20%20%20%20v%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%3B%0A%20%20%20%20%2F%2F%20%E6%94%AF%E6%8C%81%E6%9C%AB%E5%B0%BE%E5%A4%9A%E4%BD%99%E7%9A%84%E9%80%97%E5%8F%B7%EF%BC%88my_vec!%5B1%2C%202%2C%203%2C%5D%EF%BC%89%0A%20%20%20%20(%20%24(%20%24x%3Aexpr%20)%2C%2B%20%2C%20)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20my_vec!%5B%24(%24x)%2C*%5D%20%20%20%20%2F%2F%E9%80%92%E5%BD%92%E4%BD%BF%E7%94%A8%E8%87%AA%E5%B7%B1%0A%20%20%20%20%7D%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%20my_vec!%5B1%2C%202%2C%203%5D%3B%0A%20%20%20%20let%20b%20%3D%20my_vec!%5B%22x%22%2C%20%22y%22%2C%20%22z%22%2C%20%22w%22%5D%3B%0A%20%20%20%20let%20c%3A%20Vec%3Ci32%3E%20%3D%20my_vec!%5B%5D%3B%20%20%20%2F%2F%20%E9%9B%B6%E4%B8%AA%E5%8F%82%E6%95%B0%E4%B9%9F%E5%90%88%E6%B3%95%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20a)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20b)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20c)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">macro_rules! my_vec {
    // $( $x:expr ),*  ←  匹配：零个或多个"表达式"，中间用逗号分隔
    // 如果要用分号分隔，写法就是：$( $x:expr );*
    ( $( $x:expr ),* ) =&gt; {
        {
            let mut v = Vec::new();
            $(               // 展开区：对每个 $x 重复这段代码
                v.push($x);
            )*
            v
        }
    };
    // 支持末尾多余的逗号（my_vec![1, 2, 3,]）
    ( $( $x:expr ),+ , ) =&gt; {
        my_vec![$($x),*]    //递归使用自己
    };
}

fn main() {
    let a = my_vec![1, 2, 3];
    let b = my_vec!["x", "y", "z", "w"];
    let c: Vec&lt;i32&gt; = my_vec![];   // 零个参数也合法

    println!("{:?}", a);
    println!("{:?}", b);
    println!("{:?}", c);
}</code></pre></div>
<p>拆解 <code>$( $x:expr ),*</code>：</p>
<ul>
<li><code>$(</code> <code>)</code> — 捕获组的开始与结束</li>
<li><code>$x:expr</code> — 在组内捕获一个表达式，命名为 <code>$x</code></li>
<li><code>,</code> — 每次重复之间的<strong>分隔符</strong>（可选，可以是任意 token）</li>
<li><code>*</code> — 重复零次或多次</li>
</ul>
<p><strong>三种不同调用的展开示例</strong>：</p>
<pre><code class="language-rust">// 调用 1：my_vec![1, 2, 3]
// 展开后：
let a = {
    let mut v = Vec::new();
    v.push(1);      // 这是语句（有分号）
    v.push(2);      // 这是语句（有分号）
    v.push(3);      // 这是语句（有分号）
    v               // 最后是表达式（无分号），作为块的返回值
};

// 调用 2：my_vec!["x", "y", "z", "w"]
// 展开后：
let b = {
    let mut v = Vec::new();
    v.push("x");
    v.push("y");
    v.push("z");
    v.push("w");
    v
};

// 调用 3：my_vec![]
// 展开后（零个元素）：
let c = {
    let mut v = Vec::new();
    // $( v.push($x); )* 重复 0 次，所以中间什么都没有
    v
};</code></pre>
<blockquote>
<p><strong>为什么 <code>$( v.push($x); )*</code> 后面没有分号？</strong></p>
<p>因为 <code>v.push($x);</code> 里面<strong>已经有分号了</strong>。展开时，每次重复生成的代码都是完整的语句：</p>
<pre><code class="language-plaintext">v.push(1);  v.push(2);  v.push(3);</code></pre>
<p>如果在 <code>)*</code> 后面再加分号，就变成了：</p>
<pre><code class="language-plaintext">v.push(1);  v.push(2);  v.push(3);;  // ✗ 双分号，错误</code></pre>
<p><strong>为什么<code>( $( $x:expr ),* )</code>有两层 <code>{}</code>？</strong></p>
<p>宏展开后，我们希望能写 <code>let a = my_vec![1, 2, 3];</code> 这样的代码。但 <code>let mut v = Vec::new()</code> 是<strong>语句</strong>，不是<strong>表达式</strong>，无法直接放在赋值号的右边。在 Rust 中，赋值号右边必须是表达式才能返回一个值。</p>
<p>所以宏需要：</p>
<ol>
<li><strong>外层 <code>{}</code> 是宏语法</strong>——<code>=&gt; { ... }</code> 这是定义宏展开体的必须写法</li>
<li><strong>内层 <code>{}</code> 是代码块表达式</strong>——把多个语句包裹成一个表达式，这样整个块可以在赋值位置使用，最后一行 <code>v</code> 成为块的返回值</li>
</ol>
<p>对比：</p>
<pre><code class="language-rust">// ✗ 没有内层 {} 的展开（错误）
let a = let mut v = Vec::new(); v.push(1); v;

// ✓ 有内层 {} 的展开（正确）
let a = { let mut v = Vec::new(); v.push(1); v };</code></pre>
</blockquote>
<h3 id="加号量词至少一次">加号量词（至少一次）</h3>
<p>用 <code>+</code> 表示至少一次重复。对比 <code>*</code> 的区别就是：<code>*</code> 可以零次，<code>+</code> 必须至少一次。</p>
<div class="code-runner" data-full-code="macro_rules!%20print_all%20%7B%0A%20%20%20%20%2F%2F%20%E7%94%A8%20%2B%20%E8%A1%A8%E7%A4%BA%E8%87%B3%E5%B0%91%E4%B8%80%E4%B8%AA%E5%8F%82%E6%95%B0%EF%BC%8C%E7%94%A8%E9%80%97%E5%8F%B7%E5%88%86%E9%9A%94%0A%20%20%20%20(%20%24(%20%24x%3Aexpr%20)%2C%2B%20)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%24(%0A%20%20%20%20%20%20%20%20%20%20%20%20print!(%22%7B%7D%20%22%2C%20%24x)%3B%0A%20%20%20%20%20%20%20%20)*%0A%20%20%20%20%20%20%20%20println!()%3B%0A%20%20%20%20%7D%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20print_all!(1)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E2%9C%93%20%E4%B8%80%E4%B8%AA%E5%8F%82%E6%95%B0%0A%20%20%20%20print_all!(10%2C%2020%2C%2030)%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E2%9C%93%20%E5%A4%9A%E4%B8%AA%E5%8F%82%E6%95%B0%0A%20%20%20%20print_all!(%22a%22%2C%20%22b%22%2C%20%22c%22%2C%20%22d%22)%3B%20%20%20%20%20%2F%2F%20%E2%9C%93%20%E5%A4%9A%E4%B8%AA%E5%8F%82%E6%95%B0%0A%20%20%20%20%2F%2F%20print_all!()%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E2%9C%97%20%E9%94%99%E8%AF%AF%EF%BC%9A%2B%20%E8%A6%81%E6%B1%82%E8%87%B3%E5%B0%91%E4%B8%80%E4%B8%AA%0A%7D" data-mode="run"><pre><code class="language-rust">macro_rules! print_all {
    // 用 + 表示至少一个参数，用逗号分隔
    ( $( $x:expr ),+ ) =&gt; {
        $(
            print!("{} ", $x);
        )*
        println!();
    };
}

fn main() {
    print_all!(1);                      // ✓ 一个参数
    print_all!(10, 20, 30);             // ✓ 多个参数
    print_all!("a", "b", "c", "d");     // ✓ 多个参数
    // print_all!();                    // ✗ 错误：+ 要求至少一个
}</code></pre></div>
<p><strong>展开示例</strong>：</p>
<pre><code class="language-rust">print_all!(10, 20)  展开为：
    print!("{} ", 10);
    print!("{} ", 20);
    println!();</code></pre>
<h3 id="问号量词零或一次">问号量词（零或一次）</h3>
<p>用 <code>?</code> 表示可选的（零次或一次）。<strong>注意：<code>?</code> 不能有分隔符</strong>。</p>
<div class="code-runner" data-full-code="macro_rules!%20config%20%7B%0A%20%20%20%20%2F%2F%20%E5%8F%AF%E9%80%89%E7%9A%84%E8%B5%8B%E5%80%BC%EF%BC%9Aconfig!(name)%20%E6%88%96%20config!(name%20%3D%20value)%0A%20%20%20%20(%24name%3Aident%20%24(%20%3D%20%24val%3Aexpr%20)%3F)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20let%20v%3A%20usize%20%3D%200%20%24(%20%2B%20%24val%20)%3F%3B%20%20%2F%2F%20%E6%9C%89%E5%80%BC%E5%88%99%E5%8A%A0%E4%B8%8A%EF%BC%8C%E6%B2%A1%E6%9C%89%E5%88%99%E4%BF%9D%E6%8C%81%200%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E9%85%8D%E7%BD%AE%20%7B%7D%3A%20%7B%7D%22%2C%20stringify!(%24name)%2C%20v)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20v%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20config!(max_size)%3B%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E2%9C%93%20%E6%97%A0%E8%B5%8B%E5%80%BC%0A%20%20%20%20config!(buffer_size%20%3D%2064)%3B%20%20%2F%2F%20%E2%9C%93%20%E6%9C%89%E8%B5%8B%E5%80%BC%0A%7D" data-mode="run"><pre><code class="language-rust">macro_rules! config {
    // 可选的赋值：config!(name) 或 config!(name = value)
    ($name:ident $( = $val:expr )?) =&gt; {
        {
            let v: usize = 0 $( + $val )?;  // 有值则加上，没有则保持 0
            println!("配置 {}: {}", stringify!($name), v);
            v
        }
    };
}

fn main() {
    config!(max_size);          // ✓ 无赋值
    config!(buffer_size = 64);  // ✓ 有赋值
}</code></pre></div>
<p><strong>展开示例</strong>：</p>
<pre><code class="language-rust">config!(max_size)  展开为：
    let v: usize = 0;
    println!("配置 {}: {}", "max_size", v);

config!(buffer_size = 64)  展开为：
    let v: usize = 0 + 64;
    println!("配置 {}: {}", "buffer_size", v);</code></pre>
<h1 id="进阶与作用域">进阶与作用域</h1>
<h2 id="宏的卫生性">宏的卫生性</h2>
<p>Rust 的声明宏是<strong>卫生的</strong>（hygienic）。这意味着：</p>
<ol>
<li><strong>宏内部定义的变量不会污染外层作用域</strong> — 下面代码里宏内的 <code>tmp</code> 不会覆盖调用者的 <code>tmp</code></li>
<li><strong>调用者的变量也不会污染宏内部</strong> — 但通过参数传入的变量除外</li>
</ol>
<p>简单理解：<strong>宏内部是隔离的</strong>，宏内新定义的名字不会逃逸出去。</p>
<div class="code-runner" data-full-code="macro_rules!%20swap%20%7B%0A%20%20%20%20(%24a%3Aexpr%2C%20%24b%3Aexpr)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E5%AE%8F%E5%86%85%E7%9A%84%20tmp%20%E5%8F%98%E9%87%8F%E4%B8%8D%E4%BC%9A%E4%B8%8E%E8%B0%83%E7%94%A8%E8%80%85%E7%9A%84%20tmp%20%E5%86%B2%E7%AA%81%EF%BC%88%E5%8D%AB%E7%94%9F%E6%80%A7%EF%BC%89%0A%20%20%20%20%20%20%20%20let%20tmp%20%3D%20%24a%3B%0A%20%20%20%20%20%20%20%20%24a%20%3D%20%24b%3B%0A%20%20%20%20%20%20%20%20%24b%20%3D%20tmp%3B%0A%20%20%20%20%7D%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20tmp%20%3D%20%22%E8%BF%99%E6%98%AF%E7%94%A8%E6%88%B7%E7%9A%84%20tmp%22.to_string()%3B%20%2F%2F%20%E7%94%A8%E6%88%B7%E6%9C%89%E4%B8%AA%20tmp%0A%20%20%20%20let%20mut%20x%20%3D%2010%3B%0A%20%20%20%20let%20mut%20y%20%3D%2020%3B%0A%20%20%20%20swap!(x%2C%20y)%3B%0A%0A%20%20%20%20println!(%22x%3D%7B%7D%2C%20y%3D%7B%7D%22%2C%20x%2C%20y)%3B%20%20%20%20%20%20%20%20%20%20%20%2F%2F%2010%20%E5%92%8C%2020%20%E4%BA%92%E6%8D%A2%E4%BA%86%0A%20%20%20%20println!(%22%E7%94%A8%E6%88%B7%E7%9A%84%20tmp%20%E6%B2%A1%E8%A2%AB%E8%A6%86%E7%9B%96%EF%BC%9A%7B%7D%22%2C%20tmp)%3B%20%2F%2F%20%E7%94%A8%E6%88%B7%E7%9A%84%20tmp%20%E4%BE%9D%E7%84%B6%E5%AE%8C%E5%A5%BD%EF%BC%8C%E4%B8%8D%E6%98%AF%E5%AE%8F%E5%86%85%E7%9A%84%20tmp%0A%7D" data-mode="run"><pre><code class="language-rust">macro_rules! swap {
    ($a:expr, $b:expr) =&gt; {
        // 宏内的 tmp 变量不会与调用者的 tmp 冲突（卫生性）
        let tmp = $a;
        $a = $b;
        $b = tmp;
    };
}

fn main() {
    let tmp = "这是用户的 tmp".to_string(); // 用户有个 tmp
    let mut x = 10;
    let mut y = 20;
    swap!(x, y);

    println!("x={}, y={}", x, y);           // 10 和 20 互换了
    println!("用户的 tmp 没被覆盖：{}", tmp); // 用户的 tmp 依然完好，不是宏内的 tmp
}</code></pre></div>
<p><strong>关键点</strong>：元变量 <code>$a</code>、<code>$b</code> 传入的是<strong>表达式本身</strong>（<code>x</code> 和 <code>y</code>），它们属于<strong>调用者的作用域</strong>，所以修改 <code>$a</code> 等于直接修改 <code>x</code>。</p>
<blockquote>
<p><strong>注意</strong>：卫生性只对 <code>ident</code> 片段和宏内新声明的绑定有效。若用 <code>$name:ident</code> 直接拼接出新的标识符（<code>concat_idents</code> 这类场景），需要格外小心。</p>
</blockquote>
<h2 id="模块内作用域">模块内作用域</h2>
<p><strong>快速概念预览</strong>：<code>mod</code> 是 Rust 的模块系统，用来组织代码。<code>pub</code> 关键字使项目对外部可见；没有 <code>pub</code> 的项只在模块内可见。在下面的例子中，<code>square</code> 宏定义在 <code>math</code> 模块内，所以 <code>main</code> 函数无法访问它。要深入了解模块系统，见<a href="/RustCourse/chapters/07-modules/00-index">模块系统</a>。本页内容目前仅作了解即可。</p>
<p>宏默认只在定义它的<strong>模块及其子模块</strong>内可见，且遵循<strong>顺序规则</strong>（必须先定义后使用）：</p>
<div class="code-runner" data-full-code="mod%20math%20%7B%0A%20%20%20%20macro_rules!%20square%20%7B%0A%20%20%20%20%20%20%20%20(%24x%3Aexpr)%20%3D%3E%20%7B%20%24x%20*%20%24x%20%7D%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20pub%20fn%20demo()%20%7B%0A%20%20%20%20%20%20%20%20println!(%223%C2%B2%20%3D%20%7B%7D%22%2C%20square!(3))%3B%20%2F%2F%20%E5%9C%A8%E5%90%8C%E4%B8%80%E6%A8%A1%E5%9D%97%E5%86%85%E5%8F%AF%E7%94%A8%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20math%3A%3Ademo()%3B%0A%20%20%20%20%2F%2F%20square!(4)%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E8%BF%99%E9%87%8C%E7%9C%8B%E4%B8%8D%E5%88%B0%20math%20%E6%A8%A1%E5%9D%97%E9%87%8C%E7%9A%84%E5%AE%8F%0A%7D" data-mode="run"><pre><code class="language-rust">mod math {
    macro_rules! square {
        ($x:expr) =&gt; { $x * $x };
    }

    pub fn demo() {
        println!("3² = {}", square!(3)); // 在同一模块内可用
    }
}

fn main() {
    math::demo();
    // square!(4); // 错误：这里看不到 math 模块里的宏
}</code></pre></div>
<h2 id="跨模块与导出">跨模块与导出</h2>
<p>在子模块上加 <code>#[macro_use]</code>，可以把该模块的宏提升到父模块。另外，使用 <code>#[macro_export]</code> 可以让宏被<strong>其他 crate</strong> 引入：</p>
<div class="code-runner" data-full-code="%23%5Bmacro_use%5D%0Amod%20helpers%20%7B%0A%20%20%20%20macro_rules!%20double%20%7B%0A%20%20%20%20%20%20%20%20(%24x%3Aexpr)%20%3D%3E%20%7B%20%24x%20*%202%20%7D%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20double!(7))%3B%20%2F%2F%20%E7%88%B6%E6%A8%A1%E5%9D%97%E5%8F%AF%E4%BB%A5%E4%BD%BF%E7%94%A8%0A%7D" data-mode="run"><pre><code class="language-rust">#[macro_use]
mod helpers {
    macro_rules! double {
        ($x:expr) =&gt; { $x * 2 };
    }
}

fn main() {
    println!("{}", double!(7)); // 父模块可以使用
}</code></pre></div>
<p>在库的开发中，如果你希望宏提供给最终用户使用，可以在宏上面添加 <code>#[macro_export]</code>：</p>
<div class="code-runner" data-full-code="%23%5Bmacro_export%5D%0Amacro_rules!%20assert_approx_eq%20%7B%0A%20%20%20%20(%24a%3Aexpr%2C%20%24b%3Aexpr%2C%20%24eps%3Aexpr)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20let%20diff%20%3D%20(%24a%20-%20%24b).abs()%3B%0A%20%20%20%20%20%20%20%20if%20diff%20%3E%20%24eps%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20panic!(%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22%E6%96%AD%E8%A8%80%E5%A4%B1%E8%B4%A5%EF%BC%9A%7C%7B%7D%20-%20%7B%7D%7C%20%3D%20%7B%7D%20%3E%20%7B%7D%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%24a%2C%20%24b%2C%20diff%2C%20%24eps%0A%20%20%20%20%20%20%20%20%20%20%20%20)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20assert_approx_eq!(1.0_f64%2C%201.0000001%2C%200.001)%3B%20%2F%2F%20%E9%80%9A%E8%BF%87%0A%20%20%20%20println!(%22%E8%BF%91%E4%BC%BC%E7%9B%B8%E7%AD%89%E6%96%AD%E8%A8%80%E9%80%9A%E8%BF%87%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">#[macro_export]
macro_rules! assert_approx_eq {
    ($a:expr, $b:expr, $eps:expr) =&gt; {
        let diff = ($a - $b).abs();
        if diff &gt; $eps {
            panic!(
                "断言失败：|{} - {}| = {} &gt; {}",
                $a, $b, diff, $eps
            );
        }
    };
}

fn main() {
    assert_approx_eq!(1.0_f64, 1.0000001, 0.001); // 通过
    println!("近似相等断言通过");
}</code></pre></div>
<blockquote>
<p><code>#[macro_export]</code> 会把宏提升到 crate 根作用域，其他 crate 用 <code>use your_crate::assert_approx_eq;</code> 引入。</p>
</blockquote>
<h1 id="常用宏与调试">常用宏与调试</h1>
<h2 id="实用标准库宏预览">实用标准库宏预览</h2>
<p>这里还有一些你可能会用到的宏，现在可以先混个脸熟，防止后面看到后慌乱：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20----%20%E8%B0%83%E8%AF%95%E7%94%A8%20----%0A%20%20%20%20let%20x%20%3D%205%3B%0A%20%20%20%20let%20y%20%3D%20dbg!(x%20*%202%20%2B%201)%3B%20%2F%2F%20%E6%89%93%E5%8D%B0%E8%A1%A8%E8%BE%BE%E5%BC%8F%E5%92%8C%E5%80%BC%EF%BC%8C%E8%BF%94%E5%9B%9E%E5%80%BC%E6%9C%AC%E8%BA%AB%0A%20%20%20%20println!(%22y%20%3D%20%7B%7D%22%2C%20y)%3B%0A%0A%20%20%20%20%2F%2F%20----%20%E7%BC%96%E8%AF%91%E6%97%B6%E5%AD%97%E7%AC%A6%E4%B8%B2%20----%0A%20%20%20%20const%20GREET%3A%20%26str%20%3D%20concat!(%22Hello%22%2C%20%22%2C%20%22%2C%20%22world%22%2C%20%22!%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20GREET)%3B%0A%0A%20%20%20%20let%20expr%20%3D%20stringify!(1%20%2B%202%20*%203)%3B%20%2F%2F%20%E6%8A%8A%E8%A1%A8%E8%BE%BE%E5%BC%8F%E8%BD%AC%E6%88%90%E5%AD%97%E7%AC%A6%E4%B8%B2%EF%BC%8C%E4%B8%8D%E6%B1%82%E5%80%BC%0A%20%20%20%20println!(%22%E8%A1%A8%E8%BE%BE%E5%BC%8F%E5%8E%9F%E6%96%87%EF%BC%9A%7B%7D%22%2C%20expr)%3B%0A%0A%20%20%20%20%2F%2F%20----%20%E6%9D%A1%E4%BB%B6%E7%BC%96%E8%AF%91%E4%BF%A1%E6%81%AF%20----%0A%20%20%20%20%2F%2F%20env!(%22CARGO_PKG_VERSION%22)%20%E5%9C%A8%E7%BC%96%E8%AF%91%E6%97%B6%E8%AF%BB%E5%8F%96%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%0A%20%20%20%20let%20version%20%3D%20env!(%22CARGO_PKG_VERSION%22)%3B%0A%20%20%20%20println!(%22%E7%89%88%E6%9C%AC%EF%BC%9A%7B%7D%22%2C%20version)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // ---- 调试用 ----
    let x = 5;
    let y = dbg!(x * 2 + 1); // 打印表达式和值，返回值本身
    println!("y = {}", y);

    // ---- 编译时字符串 ----
    const GREET: &amp;str = concat!("Hello", ", ", "world", "!");
    println!("{}", GREET);

    let expr = stringify!(1 + 2 * 3); // 把表达式转成字符串，不求值
    println!("表达式原文：{}", expr);

    // ---- 条件编译信息 ----
    // env!("CARGO_PKG_VERSION") 在编译时读取环境变量
    let version = env!("CARGO_PKG_VERSION");
    println!("版本：{}", version);
}</code></pre></div>
<div class="code-runner" data-full-code="fn%20not_done_yet()%20%7B%0A%20%20%20%20todo!(%22%E7%AD%89%E4%BB%A5%E5%90%8E%E5%86%8D%E5%AE%9E%E7%8E%B0%22)%3B%20%20%20%20%20%20%20%20%20%2F%2F%20%E8%BF%90%E8%A1%8C%E6%97%B6%20panic%EF%BC%8C%E5%B8%A6%E6%B6%88%E6%81%AF%0A%7D%0A%0Afn%20impossible_path(x%3A%20u8)%20-%3E%20%26'static%20str%20%7B%0A%20%20%20%20match%20x%20%7B%0A%20%20%20%20%20%20%20%200%20%3D%3E%20%22%E9%9B%B6%22%2C%0A%20%20%20%20%20%20%20%201..%3D255%20%3D%3E%20%22%E9%9D%9E%E9%9B%B6%22%2C%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20unreachable!(%22u8%20%E4%B8%8D%E5%8F%AF%E8%83%BD%E8%B6%85%E8%BF%87%20255%22)%2C%20%2F%2F%20%E5%91%8A%E8%AF%89%E7%BC%96%E8%AF%91%E5%99%A8%E6%AD%A4%E5%A4%84%E4%B8%8D%E5%8F%AF%E8%BE%BE%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20impossible_path(42))%3B%0A%20%20%20%20not_done_yet()%3B%20%2F%2F%20%E4%BC%9A%20panic%0A%7D" data-mode="expect-error"><pre><code class="language-rust">fn not_done_yet() {
    todo!("等以后再实现");         // 运行时 panic，带消息
}

fn impossible_path(x: u8) -&gt; &amp;'static str {
    match x {
        0 =&gt; "零",
        1..=255 =&gt; "非零",
        _ =&gt; unreachable!("u8 不可能超过 255"), // 告诉编译器此处不可达
    }
}

fn main() {
    println!("{}", impossible_path(42));
    not_done_yet(); // 会 panic
}</code></pre></div>
<h2 id="调试宏展开">调试宏展开</h2>
<p><strong>为什么需要调试宏</strong>：宏在编译时展开，不像普通代码那样好追踪。如果宏没有按预期工作，你需要看到实际展开后的代码才能理解发生了什么。</p>
<p><strong>使用 cargo-expand 工具</strong>：</p>
<p>安装工具：</p>
<pre><code class="language-bash">cargo install cargo-expand</code></pre>
<p>常见用法：</p>
<pre><code class="language-bash">cargo expand              # 展开整个 crate，输出所有宏展开结果
cargo expand my_module   # 只展开指定模块
cargo expand my_module::my_macro  # 只展开特定宏</code></pre>
<p><strong>实际例子</strong>：</p>
<p>假设你的代码中有这个宏调用：</p>
<pre><code class="language-rust">my_vec![1, 2, 3]</code></pre>
<p>运行 <code>cargo expand</code> 后会看到：</p>
<pre><code class="language-rust">// 展开后的代码
let a = {
    let mut v = Vec::new();
    v.push(1);
    v.push(2);
    v.push(3);
    v
};</code></pre>
<p><strong>常见用途</strong>：</p>
<ol>
<li><strong>排查宏展开错误</strong> — 看不懂编译错误时，查看展开代码能帮你理解宏生成了什么</li>
<li><strong>调试变量捕获</strong> — 确认元变量是否正确替换（比如 <code>$x</code> 是否替换成了你期望的值）</li>
<li><strong>验证分隔符和重复</strong> — 确认 <code>$( ... )*</code> 是否按预期重复展开</li>
</ol>
<p><strong>在哪里运行</strong>：<code>cargo expand</code> 是<strong>命令行工具</strong>，在项目的根目录（<code>Cargo.toml</code> 所在位置）运行。它会自动检测当前 Cargo 项目，展开该项目中的所有宏。展开结果输出到<strong>终端</strong>（标准输出），不会写入代码文件——你需要查看输出来理解展开后的代码。</p>
<p><strong>注意</strong>：如果宏有语法错误，<code>cargo expand</code> 会直接报错，不会输出展开结果。展开失败时的错误信息就是调试的关键线索。</p>
<h1 id="练习题">练习题</h1>
<h2 id="基础测验">基础测验</h2>
</div>
</div>
<pre><code class="language-rust">macro_rules! let_bind {
    ($name:ident = $val:expr) =&gt; {
        let $name = $val;
    };
}</code></pre>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习一定义-print_twice-宏">练习一：定义 <code>print_twice!</code> 宏</h3>
<p>定义一个 <code>print_twice!</code> 宏，接受一个表达式，将该值打印两次（每次单独一行）。</p>
<div class="code-editor" data-block-id="02-basic-syntax/08-macros#3:5" data-expect-mode="literal" data-expect-pattern="42%0A42%0AHello%0AHello" data-starter-code="%2F%2F%20%E5%9C%A8%E8%BF%99%E9%87%8C%E5%AE%9A%E4%B9%89%20print_twice!%20%E5%AE%8F%0A%0Afn%20main()%20%7B%0A%20%20%20%20print_twice!(42)%3B%0A%20%20%20%20print_twice!(%22Hello%22)%3B%0A%7D"><pre><code class="language-rust">// 在这里定义 print_twice! 宏

fn main() {
    print_twice!(42);
    print_twice!("Hello");
}</code></pre></div>
<h3 id="练习二实现-max-宏">练习二：实现 <code>max!</code> 宏</h3>
<p>实现一个 <code>max!</code> 宏，接受<strong>两个</strong>表达式，返回较大的值。提示：宏可以展开为 <code>if</code> 表达式。</p>
<div class="code-editor" data-block-id="02-basic-syntax/08-macros#3:6" data-expect-mode="literal" data-expect-pattern="7%0A10%0A-1" data-starter-code="macro_rules!%20max%20%7B%0A%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E5%A1%AB%E5%86%99%E8%A7%84%E5%88%99%EF%BC%8C%E6%8E%A5%E5%8F%97%E4%B8%A4%E4%B8%AA%E8%A1%A8%E8%BE%BE%E5%BC%8F%EF%BC%8C%E8%BF%94%E5%9B%9E%E8%BE%83%E5%A4%A7%E7%9A%84%E9%82%A3%E4%B8%AA%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20max!(3%2C%207))%3B%20%20%20%20%20%2F%2F%207%0A%20%20%20%20println!(%22%7B%7D%22%2C%20max!(10%2C%202))%3B%20%20%20%20%2F%2F%2010%0A%20%20%20%20println!(%22%7B%7D%22%2C%20max!(-1%2C%20-5))%3B%20%20%20%2F%2F%20-1%0A%7D"><pre><code class="language-rust">macro_rules! max {
    // TODO：填写规则，接受两个表达式，返回较大的那个
}

fn main() {
    println!("{}", max!(3, 7));     // 7
    println!("{}", max!(10, 2));    // 10
    println!("{}", max!(-1, -5));   // -1
}</code></pre></div>
<h3 id="练习三实现-repeat_str-宏">练习三：实现 <code>repeat_str!</code> 宏</h3>
<p>实现一个 <code>repeat_str!</code> 宏，接受多个字符串字面量，返回它们连接后的结果。</p>
<p>示例：<code>repeat_str!("Hello", " ", "world")</code> 应该返回 <code>"Hello world"</code>。</p>
<div class="code-editor" data-block-id="02-basic-syntax/08-macros#3:7" data-expect-mode="literal" data-expect-pattern="Hello%0AHello%20world!%0ARust%20is%20awesome" data-starter-code="macro_rules!%20repeat_str%20%7B%0A%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E5%AE%9E%E7%8E%B0%E5%AE%8F%EF%BC%8C%E4%BD%BF%E7%94%A8%E9%87%8D%E5%A4%8D%E6%A8%A1%E5%BC%8F%20%2B%20%E5%88%86%E9%9A%94%E7%AC%A6%E5%8C%B9%E9%85%8D%E5%AD%97%E7%AC%A6%E4%B8%B2%E5%88%97%E8%A1%A8%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20greeting%20%3D%20repeat_str!(%22Hello%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20greeting)%3B%0A%0A%20%20%20%20let%20message%20%3D%20repeat_str!(%22Hello%22%2C%20%22%20%22%2C%20%22world%22%2C%20%22!%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20message)%3B%0A%0A%20%20%20%20let%20words%20%3D%20repeat_str!(%22Rust%22%2C%20%22%20%22%2C%20%22is%22%2C%20%22%20%22%2C%20%22awesome%22)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20words)%3B%0A%7D"><pre><code class="language-rust">macro_rules! repeat_str {
    // TODO：实现宏，使用重复模式 + 分隔符匹配字符串列表
}

fn main() {
    let greeting = repeat_str!("Hello");
    println!("{}", greeting);

    let message = repeat_str!("Hello", " ", "world", "!");
    println!("{}", message);

    let words = repeat_str!("Rust", " ", "is", " ", "awesome");
    println!("{}", words);
}</code></pre></div> 