---
title: "类属性宏"
description: "过程宏 - 类属性宏"
date: "2026-07-12"
order: 21003
tags: ["属性宏", "#[attr]", "proc-macro-attribute"]
est_time: "30 分钟"
---

 <h1 id="属性宏的特点">属性宏的特点</h1>
<h2 id="与-derive-宏的对比">与 derive 宏的对比</h2>
<p>你已经学会了 derive 宏。现在来看<strong>类属性宏</strong>（Attribute Macro）——它比 derive 宏更灵活，也更强大。</p>
<p>两者的关键区别：</p>
<table><thead><tr><th></th><th>derive 宏</th><th>类属性宏</th></tr></thead><tbody><tr><td>语法</td><td><code>#[derive(MyMacro)]</code></td><td><code>#[my_macro]</code> 或 <code>#[my_macro(args)]</code></td></tr><tr><td>只能用于</td><td>结构体和枚举</td><td><strong>任意代码项</strong>（函数、结构体、枚举、impl 块……）</td></tr><tr><td>对原始代码</td><td><strong>保留</strong>原始定义，额外添加代码</td><td><strong>可以完全替换</strong>原始代码项</td></tr><tr><td>接收参数</td><td>无法直接传参（只能用辅助属性）</td><td>可以通过 <code>#[macro(key = value)]</code> 传任意参数</td></tr></tbody></table>
<p>以下都是类属性宏的真实例子：</p>
<pre><code class="language-rust">// web 框架中标注路由
#[get("/users")]
async fn list_users() -&gt; Vec&lt;User&gt; { ... }

// 追踪函数调用（tracing 库）
#[instrument(skip(password))]
fn login(username: &amp;str, password: &amp;str) -&gt; Result&lt;Token, Error&gt; { ... }

// 测试框架标注异步测试（tokio）
#[tokio::test]
async fn test_database_connection() { ... }</code></pre>
<h2 id="属性宏的函数签名">属性宏的函数签名</h2>
<p>属性宏函数接收<strong>两个</strong> <code>TokenStream</code>：</p>
<pre><code class="language-rust">#[proc_macro_attribute]
pub fn my_attr(
    attr: TokenStream,  // #[my_attr(这里的内容)] ← 属性括号里的参数
    item: TokenStream,  // 被标注的代码项（函数体、结构体定义……）
) -&gt; TokenStream {
    // 返回替换后的代码
}</code></pre>
<ul>
<li><code>attr</code>：属性括号里的参数，如 <code>#[route(GET, "/")]</code> 中的 <code>GET, "/"</code> 部分</li>
<li><code>item</code>：被标注的整个代码项（如函数的完整定义）</li>
<li>返回值：<strong>替换</strong> <code>item</code> 的新代码（注意：不是追加，而是替换！）</li>
</ul>
<h1 id="实现一个计时属性宏">实现一个计时属性宏</h1>
<h2 id="需求自动统计函数执行时间">需求：自动统计函数执行时间</h2>
<p>你希望写这样的代码：</p>
<pre><code class="language-rust">#[timed]
fn slow_computation(n: u64) -&gt; u64 {
    // 模拟耗时计算
    (0..n).sum()
}</code></pre>
<p>调用 <code>slow_computation(1000000)</code> 时，自动打印：</p>
<pre><code class="language-text">slow_computation 执行耗时：5.2ms</code></pre>
<p>不用每个函数都手动加计时代码，宏帮你搞定。</p>
<h2 id="实现">实现</h2>
<p>属性宏的关键是：接收原始函数，生成一个包含计时逻辑的新函数。</p>
<pre><code class="language-rust">// my-macros/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn timed(
    _attr: TokenStream,  // 这个宏不需要参数，忽略 attr
    item: TokenStream,   // 被标注的函数
) -&gt; TokenStream {
    // 把 item 解析为一个函数定义（ItemFn）
    let func = parse_macro_input!(item as ItemFn);

    // 提取函数信息
    let func_name = &amp;func.sig.ident;        // 函数名
    let func_name_str = func_name.to_string(); // 函数名的字符串形式
    let func_vis = &amp;func.vis;               // 可见性（pub、pub(crate) 等）
    let func_sig = &amp;func.sig;               // 完整函数签名（名字、参数、返回类型）
    let func_body = &amp;func.block;            // 函数体

    // 生成新函数：在原函数体外面包一层计时逻辑
    quote! {
        #func_vis #func_sig {
            let __start = std::time::Instant::now();
            let __result = (|| #func_body)(); // 把原函数体包进闭包执行
            let __elapsed = __start.elapsed();
            println!("{} 执行耗时：{:.1}ms", #func_name_str, __elapsed.as_secs_f64() * 1000.0);
            __result
        }
    }.into()
}</code></pre>
<p>使用时：</p>
<pre><code class="language-rust">use my_macros::timed;

#[timed]
fn compute_sum(n: u64) -&gt; u64 {
    (0..n).sum()
}

fn main() {
    let result = compute_sum(10_000_000);
    println!("结果：{}", result);
    // 输出：
    // compute_sum 执行耗时：15.3ms
    // 结果：49999995000000
}</code></pre>
<p>展开后，宏生成的代码相当于：</p>
<pre><code class="language-rust">fn compute_sum(n: u64) -&gt; u64 {
    let __start = std::time::Instant::now();
    let __result = (|| {
        (0..n).sum()  // 原函数体
    })();
    let __elapsed = __start.elapsed();
    println!("compute_sum 执行耗时：{:.1}ms", __elapsed.as_secs_f64() * 1000.0);
    __result
}</code></pre>
<h1 id="带参数的属性宏">带参数的属性宏</h1>
<h2 id="接收和解析参数">接收和解析参数</h2>
<p>属性宏可以通过 <code>#[my_macro(param)]</code> 传入参数，通过第一个 <code>attr: TokenStream</code> 接收。</p>
<p>下面实现一个 <code>#[retry(n)]</code> 宏——自动在函数失败时重试 n 次：</p>
<pre><code class="language-rust">use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn, LitInt};

#[proc_macro_attribute]
pub fn retry(
    attr: TokenStream, // 接收括号里的参数，如 retry(3) 里的 "3"
    item: TokenStream,
) -&gt; TokenStream {
    // 把参数解析为一个整数字面量
    let retry_count = parse_macro_input!(attr as LitInt);
    let count: u64 = retry_count.base10_parse().unwrap_or(3);

    let func = parse_macro_input!(item as ItemFn);
    let func_name = &amp;func.sig.ident;
    let func_vis = &amp;func.vis;
    let func_sig = &amp;func.sig;
    let func_body = &amp;func.block;

    quote! {
        #func_vis #func_sig {
            let mut __attempts = 0u64;
            loop {
                let __result = (|| #func_body)();
                match __result {
                    Ok(v) =&gt; return Ok(v),
                    Err(e) =&gt; {
                        __attempts += 1;
                        if __attempts &gt;= #count {
                            eprintln!("{} 重试 {} 次后失败", stringify!(#func_name), #count);
                            return Err(e);
                        }
                        eprintln!("{} 第 {} 次失败，重试中...", stringify!(#func_name), __attempts);
                    }
                }
            }
        }
    }.into()
}</code></pre>
<p>使用时：</p>
<pre><code class="language-rust">use my_macros::retry;

#[retry(3)]  // 最多重试 3 次
fn fetch_data(url: &amp;str) -&gt; Result&lt;String, String&gt; {
    // 模拟可能失败的操作
    Err(format!("连接 {} 失败", url))
}

fn main() {
    match fetch_data("https://example.com") {
        Ok(data) =&gt; println!("数据：{}", data),
        Err(e) =&gt; println!("最终失败：{}", e),
    }
    // 输出：
    // fetch_data 第 1 次失败，重试中...
    // fetch_data 第 2 次失败，重试中...
    // fetch_data 重试 3 次后失败
    // 最终失败：连接 https://example.com 失败
}</code></pre>
<h1 id="练习题">练习题</h1>
<h2 id="类属性宏测验">类属性宏测验</h2>
</div>
</div>
<pre><code class="language-rust">// 假设宏实现如下：
#[proc_macro_attribute]
pub fn log_call(_attr: TokenStream, item: TokenStream) -&gt; TokenStream {
    let func = parse_macro_input!(item as ItemFn);
    let name = func.sig.ident.to_string();
    let vis = &amp;func.vis;
    let sig = &amp;func.sig;
    let body = &amp;func.block;
    quote! {
        #vis #sig {
            println!("调用：{}", #name);
            #body
        }
    }.into()
}

// 使用宏标注函数：
#[log_call]
fn greet(name: &amp;str) {
    println!("你好，{}", name);
}</code></pre>
</div>
</div> 