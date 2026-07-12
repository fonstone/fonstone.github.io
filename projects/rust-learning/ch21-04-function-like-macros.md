---
title: "类函数宏"
description: "过程宏 - 类函数宏"
date: "2026-07-12"
order: 21004
tags: ["函数宏", "macro!", "proc-macro"]
est_time: "30 分钟"
---

 <h1 id="类函数宏的形式">类函数宏的形式</h1>
<h2 id="三种宏的外观对比">三种宏的外观对比</h2>
<p>你现在认识了三种宏，它们看起来是：</p>
<pre><code class="language-rust">// 1. 声明宏（macro_rules!）
vec![1, 2, 3]
println!("hello")

// 2. derive 宏
#[derive(Debug, Clone)]
struct Point { ... }

// 3. 类属性宏
#[route(GET, "/")]
async fn index() { ... }

// 4. 类函数宏
let query = sql!(SELECT * FROM users WHERE id = ?);
html! { &lt;div class="main"&gt;Hello&lt;/div&gt; }</code></pre>
<p><strong>类函数宏</strong>（Function-like Macro）看起来像普通函数调用（加 <code>!</code>），但它的括号里可以是<strong>任意 token 序列</strong>，不需要是合法的 Rust 表达式。</p>
<p><code>sql!(SELECT * FROM users)</code> 这行代码括号里的内容是 SQL，不是 Rust。声明宏和普通函数都做不到接受这样的输入——类函数过程宏可以。</p>
<h2 id="与-macro_rules-的区别">与 macro_rules! 的区别</h2>
<table><thead><tr><th></th><th><code>macro_rules!</code></th><th>类函数过程宏</th></tr></thead><tbody><tr><td>实现方式</td><td>模式匹配规则</td><td>任意 Rust 代码逻辑</td></tr><tr><td>能力</td><td>受限于模式匹配</td><td>可以做任意分析和生成</td></tr><tr><td>错误信息</td><td>有时难以理解</td><td>可以自定义精确错误位置</td></tr><tr><td>调试</td><td>难调试</td><td>是正常的 Rust 函数，可以 println! 调试</td></tr><tr><td>适用场景</td><td>简单重复模式</td><td>复杂解析、编译时验证、DSL</td></tr></tbody></table>
<h2 id="函数签名">函数签名</h2>
<p>类函数宏只接收一个 <code>TokenStream</code>：</p>
<pre><code class="language-rust">#[proc_macro]
pub fn my_macro(input: TokenStream) -&gt; TokenStream {
    // input 是括号里的所有 token
    // 返回值是展开后的代码
    input
}</code></pre>
<p>注意 <code>#[proc_macro]</code> 而不是 <code>#[proc_macro_derive]</code> 或 <code>#[proc_macro_attribute]</code>。</p>
<h1 id="实现一个-html-生成宏">实现一个 HTML 生成宏</h1>
<h2 id="目标">目标</h2>
<p>实现一个简单的 <code>html!</code> 宏，把类似 HTML 的语法转换为字符串拼接代码：</p>
<pre><code class="language-rust">let output = html!(div "container" { "Hello, " strong { "World" } "!" });
// 生成：&lt;div class="container"&gt;Hello, &lt;strong&gt;World&lt;/strong&gt;!&lt;/div&gt;</code></pre>
<p>真正的 <code>html!</code> 宏（如 <code>yew</code> 框架的）非常复杂。这里实现一个简化版，重点学习类函数宏的结构。</p>
<h2 id="简化版实现编译时验证数学表达式">简化版实现：编译时验证数学表达式</h2>
<p>先从更简单的例子开始——一个 <code>assert_positive!</code> 宏，在编译时检查字面量是否为正数：</p>
<pre><code class="language-rust">use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitInt};

// assert_positive!(42)    → 编译通过
// assert_positive!(-1)    → 编译错误（但 i32 字面量不能是负数，所以这个例子需要调整）
// assert_positive!(0)     → 编译错误：0 不是正数

#[proc_macro]
pub fn assert_positive(input: TokenStream) -&gt; TokenStream {
    // 解析输入为整数字面量
    let lit = parse_macro_input!(input as LitInt);
    let value: i64 = lit.base10_parse().expect("需要整数字面量");

    if value &lt;= 0 {
        // 返回编译错误
        return quote! {
            compile_error!("assert_positive! 需要正整数");
        }.into();
    }

    // 编译通过，生成值本身的代码
    let u = value as u64;
    quote! { #u }.into()
}</code></pre>
<p>使用时：</p>
<pre><code class="language-rust">use my_macros::assert_positive;

fn main() {
    let n = assert_positive!(42);   // ✅ 编译时确认 42 &gt; 0
    println!("{}", n);              // 42
    
    // let m = assert_positive!(0); // ❌ 编译错误：assert_positive! 需要正整数
}</code></pre>
<p>这个宏虽然简单，但演示了核心能力：<strong>在编译时验证数据的合法性</strong>，违法时给出清晰错误，比运行时的 <code>assert!</code> 更早发现问题。</p>
<h2 id="实现一个格式验证宏checked_parse">实现一个格式验证宏（checked_parse）</h2>
<p>下面实现一个更实用的宏：在编译时验证字符串是否是合法的格式：</p>
<pre><code class="language-rust">use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitStr};

// 检查 IP 地址格式（编译时）
#[proc_macro]
pub fn ip(input: TokenStream) -&gt; TokenStream {
    let lit = parse_macro_input!(input as LitStr);
    let value = lit.value();

    // 在编译时解析 IP 地址——如果格式不对，编译报错
    let parsed: Result&lt;std::net::IpAddr, _&gt; = value.parse();
    match parsed {
        Ok(_) =&gt; {
            // 合法 IP，生成解析表达式
            quote! {
                #lit.parse::&lt;std::net::IpAddr&gt;().unwrap()
            }.into()
        }
        Err(_) =&gt; {
            // 非法 IP，编译时报错，并精确指向这个宏调用的位置
            let msg = format!("非法的 IP 地址：{}", value);
            quote! {
                compile_error!(#msg)
            }.into()
        }
    }
}</code></pre>
<p>使用时：</p>
<pre><code class="language-rust">use my_macros::ip;

fn main() {
    let addr = ip!("192.168.1.1");   // ✅ 编译时验证通过
    println!("{}", addr);            // 192.168.1.1

    // let bad = ip!("999.999.0.0"); // ❌ 编译错误：非法的 IP 地址：999.999.0.0
    // let bad2 = ip!("localhost");  // ❌ 编译错误：非法的 IP 地址：localhost
}</code></pre>
<p>这是类函数过程宏的经典用途：<strong>把运行时才会发现的错误，提前到编译时报告</strong>。</p>
<h2 id="实现一个-sql-模板宏简化版">实现一个 SQL 模板宏（简化版）</h2>
<p>真实框架中 <code>sqlx</code> 的 <code>query!</code> 宏会在编译时连接数据库验证 SQL。这里实现一个简化版，只验证 SQL 语法关键字：</p>
<pre><code class="language-rust">use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitStr};

// sql!("SELECT * FROM users") → 生成字符串常量，同时验证以 SELECT/INSERT/UPDATE/DELETE 开头
#[proc_macro]
pub fn sql(input: TokenStream) -&gt; TokenStream {
    let lit = parse_macro_input!(input as LitStr);
    let query = lit.value();
    let query_upper = query.trim().to_uppercase();

    let valid_start = ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP"]
        .iter()
        .any(|kw| query_upper.starts_with(kw));

    if !valid_start {
        let msg = format!(
            "SQL 语句必须以 SELECT/INSERT/UPDATE/DELETE/CREATE/DROP 开头，得到：\"{}\"",
            query
        );
        return quote! { compile_error!(#msg) }.into();
    }

    // 验证通过，返回字符串
    quote! { #lit }.into()
}</code></pre>
<p>使用时：</p>
<pre><code class="language-rust">use my_macros::sql;

fn main() {
    let q = sql!("SELECT * FROM users WHERE id = 1");  // ✅
    println!("执行查询：{}", q);

    // let bad = sql!("HACK users SET admin = true");  // ❌ 编译错误
}</code></pre>
<h1 id="练习题">练习题</h1>
<h2 id="类函数宏测验">类函数宏测验</h2>
</div>
</div>
<pre><code class="language-rust">#[proc_macro]
pub fn double(input: TokenStream) -&gt; TokenStream {
    let lit = parse_macro_input!(input as LitInt);
    let value: u64 = lit.base10_parse().unwrap();
    let doubled = value * 2;
    quote! { #doubled }.into()
}</code></pre>
</div>
</div> 