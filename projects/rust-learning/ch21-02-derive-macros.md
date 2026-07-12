---
title: "自定义 derive 宏"
description: "过程宏 - 自定义 derive 宏"
date: "2026-07-12"
order: 21002
tags: ["#[derive(...)]", "自定义 derive", "proc-macro-derive"]
est_time: "35 分钟"
---

 <h1 id="从需求出发">从需求出发</h1>
<h2 id="一个需要手动重复的-trait">一个需要手动重复的 trait</h2>
<p>假设你有一个日志 trait，要求每种类型都能描述自己的名字：</p>
<div class="code-runner" data-full-code="trait%20Describe%20%7B%0A%20%20%20%20fn%20describe(%26self)%20-%3E%20String%3B%0A%7D%0A%0Astruct%20Point%20%7B%20x%3A%20f64%2C%20y%3A%20f64%20%7D%0Astruct%20Circle%20%7B%20x%3A%20f64%2C%20y%3A%20f64%2C%20radius%3A%20f64%20%7D%0Astruct%20Rectangle%20%7B%20width%3A%20f64%2C%20height%3A%20f64%20%7D%0A%0A%2F%2F%20%E4%B8%BA%E6%AF%8F%E4%B8%AA%E7%B1%BB%E5%9E%8B%E6%89%8B%E5%8A%A8%E5%AE%9E%E7%8E%B0%E2%80%94%E2%80%94%E4%BB%A3%E7%A0%81%E5%AE%8C%E5%85%A8%E9%9B%B7%E5%90%8C%0Aimpl%20Describe%20for%20Point%20%7B%0A%20%20%20%20fn%20describe(%26self)%20-%3E%20String%20%7B%20%22Point%22.to_string()%20%7D%0A%7D%0Aimpl%20Describe%20for%20Circle%20%7B%0A%20%20%20%20fn%20describe(%26self)%20-%3E%20String%20%7B%20%22Circle%22.to_string()%20%7D%0A%7D%0Aimpl%20Describe%20for%20Rectangle%20%7B%0A%20%20%20%20fn%20describe(%26self)%20-%3E%20String%20%7B%20%22Rectangle%22.to_string()%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20Point%20%7B%20x%3A%200.0%2C%20y%3A%200.0%20%7D.describe())%3B%20%2F%2F%20Point%0A%20%20%20%20println!(%22%7B%7D%22%2C%20Circle%20%7B%20x%3A%200.0%2C%20y%3A%200.0%2C%20radius%3A%201.0%20%7D.describe())%3B%20%2F%2F%20Circle%0A%7D" data-mode="run"><pre><code class="language-rust">trait Describe {
    fn describe(&amp;self) -&gt; String;
}

struct Point { x: f64, y: f64 }
struct Circle { x: f64, y: f64, radius: f64 }
struct Rectangle { width: f64, height: f64 }

// 为每个类型手动实现——代码完全雷同
impl Describe for Point {
    fn describe(&amp;self) -&gt; String { "Point".to_string() }
}
impl Describe for Circle {
    fn describe(&amp;self) -&gt; String { "Circle".to_string() }
}
impl Describe for Rectangle {
    fn describe(&amp;self) -&gt; String { "Rectangle".to_string() }
}

fn main() {
    println!("{}", Point { x: 0.0, y: 0.0 }.describe()); // Point
    println!("{}", Circle { x: 0.0, y: 0.0, radius: 1.0 }.describe()); // Circle
}</code></pre></div>
<p>这三个实现<strong>逻辑完全相同</strong>：返回类型名字符串。但你不得不为每个类型都写一遍。</p>
<p>如果用自定义 derive 宏，使用时只需写：</p>
<pre><code class="language-rust">#[derive(Describe)]
struct Point { x: f64, y: f64 }

// 等价于自动生成：
// impl Describe for Point {
//     fn describe(&amp;self) -&gt; String { "Point".to_string() }
// }</code></pre>
<h2 id="derive-宏做的事读取结构体名字生成实现代码">derive 宏做的事：读取结构体名字，生成实现代码</h2>
<p>derive 宏在编译时：</p>
<ol>
<li>接收结构体的 <code>TokenStream</code>（包含类型名、字段等信息）</li>
<li>从中提取<strong>类型名</strong>（<code>Point</code>、<code>Circle</code>……）</li>
<li><strong>生成代码</strong>：<code>impl Describe for 类型名 { ... }</code></li>
<li>把生成的代码注入到编译结果中</li>
</ol>
<h1 id="实现步骤">实现步骤</h1>
<h2 id="项目准备">项目准备</h2>
<p>按照前一章的结构，创建一个 proc-macro crate <code>my-macros</code>。</p>
<p>在 <code>my-macros/Cargo.toml</code> 中：</p>
<pre><code class="language-toml">[package]
name = "my-macros"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true

[dependencies]
syn = { version = "2", features = ["full"] }
quote = "1"</code></pre>
<ul>
<li><strong><code>syn</code></strong>：解析 <code>TokenStream</code> 为 Rust 语法树（AST），让你能方便地提取”类型名”等信息</li>
<li><strong><code>quote</code></strong>：用模板语法生成新的 <code>TokenStream</code>，比手动拼接 token 简单得多</li>
</ul>
<p>有了这两个工具，实现 Describe 宏的思路就清晰了：用 syn 把输入解析成语法树、从中读出类型名，再用 quote 拼出 impl 块返回给编译器。</p>
<h2 id="写最简单的-derive-宏">写最简单的 derive 宏</h2>
<p>目标：<code>#[derive(Describe)]</code> 为类型自动生成 <code>Describe::describe()</code> 返回类型名。</p>
<pre><code class="language-rust">// my-macros/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(Describe)]
pub fn describe_derive(input: TokenStream) -&gt; TokenStream {
    // 第一步：把 TokenStream 解析成 Rust 语法树
    // DeriveInput 包含了被 derive 的类型的所有信息
    let ast = parse_macro_input!(input as DeriveInput);

    // 第二步：从语法树中提取类型名
    // ast.ident 就是类型的标识符（如 Point、Circle……）
    let name = &amp;ast.ident;
    // name 是 Ident 类型，表示一个标识符，这里是结构体/枚举的名字

    // 第三步：用 quote! 生成实现代码
    // quote! 里可以用 #name 插值，#name 会被替换为实际的类型名
    let expanded = quote! {
        impl Describe for #name {
            fn describe(&amp;self) -&gt; String {
                // stringify! 把标识符转为字符串字面量
                stringify!(#name).to_string()
            }
        }
    };

    // 第四步：把生成的代码转回 TokenStream 返回给编译器
    expanded.into()
}</code></pre>
<h2 id="在主项目中使用">在主项目中使用</h2>
<pre><code class="language-rust">// src/main.rs
use my_macros::Describe;

trait Describe {
    fn describe(&amp;self) -&gt; String;
}

#[derive(Describe)]
struct Point { x: f64, y: f64 }

#[derive(Describe)]
struct Circle { radius: f64 }

#[derive(Describe)]
enum Direction { North, South, East, West }

fn main() {
    let p = Point { x: 1.0, y: 2.0 };
    let c = Circle { radius: 5.0 };
    let d = Direction::North;

    println!("{}", p.describe()); // Point
    println!("{}", c.describe()); // Circle
    println!("{}", d.describe()); // Direction
}</code></pre>
<h2 id="展开后的代码是什么样的">展开后的代码是什么样的</h2>
<p><code>#[derive(Describe)]</code> 在 <code>Point</code> 上展开后，编译器相当于看到了：</p>
<pre><code class="language-rust">struct Point { x: f64, y: f64 }

// 宏自动生成的代码（invisible to user）：
impl Describe for Point {
    fn describe(&amp;self) -&gt; String {
        "Point".to_string()
    }
}</code></pre>
<p>宏生成的代码和用户写的代码<strong>并存</strong>——宏不替换原来的结构体定义，只是<strong>额外添加</strong>了 impl 块。</p>
<h1 id="提取字段信息">提取字段信息</h1>
<h2 id="访问字段列表">访问字段列表</h2>
<p>仅仅输出类型名还不够。更多场景需要遍历字段，比如：</p>
<ul>
<li><code>#[derive(Debug)]</code> 需要打印每个字段的名字和值</li>
<li><code>#[derive(Serialize)]</code> 需要把每个字段序列化为 JSON</li>
</ul>
<p>下面演示如何遍历结构体的字段：</p>
<pre><code class="language-rust">use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields};

#[proc_macro_derive(FieldNames)]
pub fn field_names_derive(input: TokenStream) -&gt; TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &amp;ast.ident;

    // 从 ast.data 里提取字段信息
    let field_names: Vec&lt;String&gt; = match &amp;ast.data {
        // Data::Struct 说明这是一个结构体
        Data::Struct(data_struct) =&gt; {
            match &amp;data_struct.fields {
                // 命名字段（如 struct Foo { x: i32, y: i32 }）
                Fields::Named(fields) =&gt; {
                    fields.named.iter()
                        .map(|f| f.ident.as_ref().unwrap().to_string())
                        .collect()
                }
                // 其他情况（元组结构体、单元结构体）暂时不处理
                _ =&gt; vec![],
            }
        }
        // 如果不是结构体，暂时返回空
        _ =&gt; vec![],
    };

    let fields_str = field_names.join(", ");

    let expanded = quote! {
        impl #name {
            pub fn field_names() -&gt; &amp;'static str {
                #fields_str
            }
        }
    };

    expanded.into()
}</code></pre>
<p>用法：</p>
<pre><code class="language-rust">#[derive(FieldNames)]
struct User {
    name: String,
    email: String,
    age: u32,
}

fn main() {
    println!("{}", User::field_names()); // name, email, age
}</code></pre>
<h2 id="完整示例自动生成-display">完整示例：自动生成 Display</h2>
<p>下面是一个更实用的例子——自动为只有一个字段的 newtype 结构体生成 <code>Display</code>：</p>
<pre><code class="language-rust">use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields};

// #[derive(NewtypeDisplay)] 为 struct Foo(InnerType) 自动实现 Display
// 委托给内部类型的 Display
#[proc_macro_derive(NewtypeDisplay)]
pub fn newtype_display_derive(input: TokenStream) -&gt; TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &amp;ast.ident;

    // 检查是否是单字段元组结构体
    let is_newtype = matches!(
        &amp;ast.data,
        Data::Struct(s) if matches!(&amp;s.fields, Fields::Unnamed(f) if f.unnamed.len() == 1)
    );

    if !is_newtype {
        // compile_error! 宏可以让编译器输出自定义错误信息
        return quote! {
            compile_error!("NewtypeDisplay 只能用于单字段元组结构体，如 struct Foo(Bar)");
        }.into();
    }

    // 生成：impl Display for Foo，委托给 self.0 的 Display
    quote! {
        impl std::fmt::Display for #name {
            fn fmt(&amp;self, f: &amp;mut std::fmt::Formatter&lt;'_&gt;) -&gt; std::fmt::Result {
                std::fmt::Display::fmt(&amp;self.0, f)
            }
        }
    }.into()
}</code></pre>
<blockquote>
<p><strong>注意</strong>：以上过程宏代码需要在独立的 proc-macro crate 中运行。<code>cargo-expand</code> 工具可以让你看到宏展开后的代码（<code>cargo expand</code>），在调试时很有用。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="derive-宏原理测验">derive 宏原理测验</h2>
</div>
</div>
<pre><code class="language-rust">// 过程宏代码（在 proc-macro crate 中）
#[proc_macro_derive(MyDerive)]
pub fn my_derive(input: TokenStream) -&gt; TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &amp;ast.ident;
    quote! {
        impl MyTrait for #name {
            fn hello(&amp;self) { println!("Hello from {}!", stringify!(#name)); }
        }
    }.into()
}</code></pre>
</div>
</div> 