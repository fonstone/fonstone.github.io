---
title: "FFI 基础"
description: "C 互操作 - FFI 基础"
date: "2026-07-12"
order: 19001
tags: ["FFI", "FFI", "C ABI", "C 函数调用"]
est_time: "25 分钟"
---

 <h1 id="基础概念">基础概念</h1>
<p>Rust 的 <strong>FFI (Foreign Function Interface)</strong> 允许它调用其他语言（主要是 C）编写的函数，也允许其他语言调用 Rust。这对于复用现有的库或在现有 C 系统中引入 Rust 至关重要。</p>
<h2 id="什么是-abi">什么是 ABI？</h2>
<p>要让两种不同的编程语言相互通信，它们必须在二进制层面上达成一致。这种约定被称为 <strong>ABI（Application Binary Interface，应用二进制接口）</strong>。</p>
<p>ABI 规定了：</p>
<ul>
<li>函数参数是如何传递的（是通过寄存器还是栈？顺序如何？）</li>
<li>返回值如何处理。</li>
<li>函数在内存中的符号名称（Symbol Name）如何生成。</li>
</ul>
<p>由于 C 语言是事实上的系统编程标准，绝大多数平台都定义了「标准的 C ABI」。</p>
<h2 id="extern-c-块"><code>extern "C"</code> 块</h2>
<p>为了在 Rust 中调用 C 函数，我们需要声明该函数的原型，并告知 Rust 使用 C ABI。</p>
<pre><code class="language-rust">extern "C" {
    fn abs(input: i32) -&gt; i32;
}

fn main() {
    unsafe {
        println!("Absolute value of -3 according to C: {}", abs(-3));
    }
}</code></pre>
<ul>
<li><strong><code>extern "C"</code></strong>：指定使用 C ABI。</li>
<li><strong><code>unsafe</code> 块</strong>：调用外部函数总是被标记为 <code>unsafe</code>。因为 Rust 编译器无法检查外部 C 代码是否遵守 Rust 的内存安全规则（如指针有效性）。</li>
</ul>
<h2 id="导出-rust-函数给-c">导出 Rust 函数给 C</h2>
<p>既然我们能调用 C，反过来，我们也需要让 C 能够调用 Rust。为了实现这一点，我们同样需要在 Rust 函数定义上使用 <code>extern "C"</code>。</p>
<p>在 Rust 中，<code>extern "C"</code> 有两种用法：</p>
<ol>
<li><strong><code>extern "C" { ... }</code> 块</strong>：用于<strong>声明</strong>（导入）外部已经存在的 C 函数。</li>
<li><strong><code>extern "C" fn ...</code></strong>：用于<strong>定义</strong>（导出）一个符合 C ABI 的 Rust 函数。</li>
</ol>
<pre><code class="language-rust">// 这是一个符合 C 调用约定的 Rust 函数
#[no_mangle]
pub extern "C" fn my_rust_library_function(x: i32) -&gt; i32 {
    x * 2
}</code></pre>
<p><strong>为什么要这么做？</strong>
虽然函数的逻辑是用 Rust 写的，但当 C 程序调用它时，它必须穿上「C 的制服」（使用 C ABI 进行压栈、跳转和返回）。如果没有 <code>extern "C"</code>，Rust 编译器会使用由于性能优化而经常变动的 Rust 默认调用约定，这在 C 看来就是一堆无法理解的乱码。</p>
<h2 id="符号名重整-name-mangling">符号名重整 (Name Mangling)</h2>
<p>如果没有重整，它们在生成的二进制文件中都会被简简单单地命名为 <code>add</code>。当你尝试运行程序时，链接器会因为发现两个同名的「符号」而报错（符号冲突）。Rust 通过将名字重整为类似 <code>_ZN4math3add17h123abc456def789E</code> 的形式，确保了全球唯一性。</p>
<h3 id="ffi-中的尴尬">FFI 中的尴尬</h3>
<p>然而，C 语言及其链接器非常「单纯」。它不支持命名空间或函数重载，因此它期望你在代码里写 <code>call_from_c</code>，二进制文件里也必须叫 <code>call_from_c</code>。</p>
<p>如果我们想让 Rust 函数能被 C 链接器精准识别，就必须使用 <code>#[no_mangle]</code> 属性，强制要求 Rust 编译器：「原封不动地保留这个名字」。</p>
<div class="code-runner" data-full-code="%2F%2F%20%E4%BD%BF%E7%94%A8%20%23%5Bno_mangle%5D%20%E5%91%8A%E8%AF%89%E7%BC%96%E8%AF%91%E5%99%A8%E4%B8%8D%E8%A6%81%E9%87%8D%E6%95%B4%E5%87%BD%E6%95%B0%E5%90%8D%0A%2F%2F%20%E8%BF%99%E6%A0%B7%E5%9C%A8%E7%BC%96%E8%AF%91%E5%87%BA%E7%9A%84%E5%BA%93%E4%B8%AD%EF%BC%8C%E5%87%BD%E6%95%B0%E5%90%8D%E4%BE%9D%E7%84%B6%E6%98%AF%20%22call_from_c%22%0A%23%5Bno_mangle%5D%0Apub%20extern%20%22C%22%20fn%20call_from_c()%20%7B%0A%20%20%20%20println!(%22%E6%88%90%E5%8A%9F%E6%94%B6%E5%88%B0%20C%20%E7%9A%84%E8%B0%83%E7%94%A8%EF%BC%9ARust%20%E6%B2%A1%E6%8A%8A%E6%88%91%E7%9A%84%E5%90%8D%E5%AD%97%E6%94%B9%E6%8E%89%EF%BC%81%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 使用 #[no_mangle] 告诉编译器不要重整函数名
// 这样在编译出的库中，函数名依然是 "call_from_c"
#[no_mangle]
pub extern "C" fn call_from_c() {
    println!("成功收到 C 的调用：Rust 没把我的名字改掉！");
}</code></pre></div>
<h1 id="类型映射">类型映射</h1>
<p>跨越语言边界最大的挑战在于：<strong>如何确保两边对内存数据的理解完全一致？</strong></p>
<p>这是双向的要求：</p>
<ul>
<li><strong>从 C 到 Rust</strong>：当你在 <code>extern "C"</code> 块中声明 C 函数时，必须将 C 的参数类型准确映射为对应的 Rust 类型，否则 Rust 给 C 传参时可能会因为字节数对不上而造成崩溃。</li>
<li><strong>从 Rust 到 C</strong>：当你写一个给 C 调用函数时，必须使用 C 兼容的类型和布局（如 <code>#[repr(C)]</code>），否则 C 语言会解析错你的数据结构。</li>
</ul>
<h2 id="基础数值类型">基础数值类型</h2>
<p>你可能会想：C 里的 <code>int</code> 不就是 Rust 里的 <code>i32</code> 吗？</p>
<p><strong>不一定。</strong> 在不同的 C 编译器和 CPU 架构下，<code>int</code> 可能是 16 位、32 位甚至 64 位。为了处理这种不确定性，Rust 在 <code>std::os::raw</code>（或 <code>core::ffi</code>）中定义了跨平台别名。</p>
<table><thead><tr><th align="left">C 类型</th><th align="left">Rust 别名</th><th align="left">建议</th></tr></thead><tbody><tr><td align="left"><code>int</code></td><td align="left"><code>c_int</code></td><td align="left">始终优先使用别名，而非硬编码 <code>i32</code></td></tr><tr><td align="left"><code>unsigned int</code></td><td align="left"><code>c_uint</code></td><td align="left">匹配 C 的无符号整型</td></tr><tr><td align="left"><code>long</code></td><td align="left"><code>c_long</code></td><td align="left">极其重要：在 Windows 上通常是 32 位，Linux 上通常是 64 位</td></tr><tr><td align="left"><code>size_t</code></td><td align="left"><code>usize</code></td><td align="left">虽然大部分情况等价，但在 FFI 签名中显式使用 <code>libc::size_t</code> 更规范</td></tr></tbody></table>
<h2 id="结构体布局reprc">结构体布局：<code>#[repr(C)]</code></h2>
<p>这是初学者最容易掉进去的坑。</p>
<p>默认情况下，Rust 编译器为了优化内存空间（对齐和填充），可能会<strong>重新排列</strong>结构体中字段的顺序。而 C 语言严格按照定义的顺序排列字段。</p>
<div class="code-runner" data-full-code="%2F%2F%20%E2%9D%8C%20%E5%8D%B1%E9%99%A9%EF%BC%9A%E8%BF%99%E4%B8%AA%E7%BB%93%E6%9E%84%E4%BD%93%E4%BC%A0%E7%BB%99%20C%20%E4%BC%9A%E8%A7%A3%E6%9E%90%E5%87%BA%E9%94%99%0Astruct%20Data%20%7B%0A%20%20%20%20a%3A%20u8%2C%0A%20%20%20%20b%3A%20u64%2C%0A%7D%0A%0A%2F%2F%20%E2%9C%85%20%E6%AD%A3%E7%A1%AE%EF%BC%9A%E5%BC%BA%E5%88%B6%E4%BD%BF%E7%94%A8%20C%20%E5%85%BC%E5%AE%B9%E7%9A%84%E5%86%85%E5%AD%98%E5%B8%83%E5%B1%80%0A%23%5Brepr(C)%5D%0Astruct%20SafeData%20%7B%0A%20%20%20%20a%3A%20u8%2C%0A%20%20%20%20b%3A%20u64%2C%0A%7D" data-mode="expect-error"><pre><code class="language-rust">// ❌ 危险：这个结构体传给 C 会解析出错
struct Data {
    a: u8,
    b: u64,
}

// ✅ 正确：强制使用 C 兼容的内存布局
#[repr(C)]
struct SafeData {
    a: u8,
    b: u64,
}</code></pre></div>
<h3 id="reprc-会影响性能吗"><code>#[repr(C)]</code> 会影响性能吗？</h3>
<p>这是一个很好的问题。答案是：<strong>几乎没有性能开销，但可能会有轻微的内存开销。</strong></p>
<ul>
<li><strong>运行开销（零成本）</strong>：<code>#[repr(C)]</code> 只是在编译时告诉编译器如何摆放数据。它不会在运行时产生多余的指令或 CPU 开销。</li>
<li><strong>空间开销（填充）</strong>：Rust 默认的布局非常「聪明」，它会为了减少内存空隙而重排字段。例如，它可能会把几个小的 <code>u8</code> 塞进一个 <code>u64</code> 留下的缝隙里。而 <code>#[repr(C)]</code> 禁用了这种聪明才智，必须按照 C 的古老规则保留固定顺序。这意味着你的结构体可能会因为额外的 <strong>填充字节（Padding）</strong> 而大出几个字节。</li>
</ul>
<blockquote>
<p><strong>结论</strong>：为了 FFI 的正确性，这点小小的内存牺牲是必须的，且在 99% 的场景下，这种尺寸差异对性能的影响微乎其微。</p>
</blockquote>
<blockquote>
<p><strong>记住</strong>：任何要传给 C 或从 C 接收的结构体，必须标注 <code>#[repr(C)]</code>。</p>
</blockquote>
<h2 id="指针与-void">指针与 <code>void*</code></h2>
<p>C 语言中随处可见的 <code>T*</code> 指针在 Rust 中对应的是<strong>裸指针 (Raw Pointers)</strong>。它们之间的映射关系如下：</p>
<ul>
<li><code>const T*</code> -&gt; <code>*const T</code></li>
<li><code>T*</code> (可变) -&gt; <code>*mut T</code></li>
<li><code>void*</code> (通用指针) -&gt; <code>*mut c_void</code></li>
</ul>
<p>裸指针不像引用那样受借用检查器的保护，你可以随意解引用它们（但在 <code>unsafe</code> 块中），也可以随意在它们之间强转。</p>
<h2 id="c-语言字符串处理">C 语言字符串处理</h2>
<p>处理字符串是 FFI 中最繁琐的部分，因为两者的设计理念完全不同：</p>
<ul>
<li><strong>C 字符串</strong>：一段连续内存，以 <code>\0</code> (nul) 结尾。没有长度信息。</li>
<li><strong>Rust 字符串</strong>：有效的 UTF-8 序列，拥有显式的长度信息。</li>
</ul>
<h3 id="1-cstring将-rust-字符串发往-c">1. <code>CString</code>：将 Rust 字符串发往 C</h3>
<p>当你需要生成一个 C 兼容的字符串并传给外部库时，使用 <code>CString</code>。它会分配内存并在末尾自动补上 <code>\0</code>。</p>
<pre><code class="language-rust">use std::ffi::CString;

let s = CString::new("Hello C").expect("字符串内部不能包含 nul 字节");
// 注意：必须保持 c_str 的生命周期比 C 调用长
unsafe {
    some_c_function(s.as_ptr());
}</code></pre>
<h3 id="2-cstr读取来自-c-的字符串">2. <code>CStr</code>：读取来自 C 的字符串</h3>
<p>当 C 库返回给你一个 <code>*const char</code> 时，使用 <code>CStr</code> 来「包裹」它，从而能够以借用的方式读取数据，而无需立即拷贝。</p>
<pre><code class="language-rust">use std::ffi::CStr;
use std::os::raw::c_char;

fn handle_callback(ptr: *const c_char) {
    let c_str = unsafe {
        assert!(!ptr.is_null());
        CStr::from_ptr(ptr)
    };
    println!("C 传来的消息: {:?}", c_str.to_str().unwrap());
}</code></pre>
<h1 id="代码实战示例">代码实战示例</h1>
<p>本节将通过完整的示例代码，展示如何将前面学到的知识点串联起来。</p>
<h2 id="示例-1调用-c-标准库进行数学计算">示例 1：调用 C 标准库进行数学计算</h2>
<p>在 C 语言中，<code>sqrt</code> 函数用于计算平方根。在 Rust 中我们不需要手动链接库，因为它通常包含在默认链接的标准库中。</p>
<div class="code-runner" data-full-code="use%20std%3A%3Aos%3A%3Araw%3A%3Ac_double%3B%0A%0A%2F%2F%20%E5%A3%B0%E6%98%8E%E5%A4%96%E9%83%A8%20C%20%E5%87%BD%E6%95%B0%0Aextern%20%22C%22%20%7B%0A%20%20%20%20fn%20sqrt(x%3A%20c_double)%20-%3E%20c_double%3B%0A%20%20%20%20fn%20pow(base%3A%20c_double%2C%20exp%3A%20c_double)%20-%3E%20c_double%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%3A%20f64%20%3D%202.0%3B%0A%20%20%20%20let%20y%3A%20f64%20%3D%203.0%3B%0A%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20println!(%222.0%20%E7%9A%84%E5%B9%B3%E6%96%B9%E6%A0%B9%E6%98%AF%3A%20%7B%7D%22%2C%20sqrt(x))%3B%0A%20%20%20%20%20%20%20%20println!(%222.0%20%E7%9A%84%203.0%20%E6%AC%A1%E6%96%B9%E6%98%AF%3A%20%7B%7D%22%2C%20pow(x%2C%20y))%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::os::raw::c_double;

// 声明外部 C 函数
extern "C" {
    fn sqrt(x: c_double) -&gt; c_double;
    fn pow(base: c_double, exp: c_double) -&gt; c_double;
}

fn main() {
    let x: f64 = 2.0;
    let y: f64 = 3.0;

    unsafe {
        println!("2.0 的平方根是: {}", sqrt(x));
        println!("2.0 的 3.0 次方是: {}", pow(x, y));
    }
}</code></pre></div>
<h2 id="示例-2向-c-传递复杂的配置结构体">示例 2：向 C 传递复杂的配置结构体</h2>
<p>当我们需要向外部库传递配置信息时，通常会定义一个 <code>#[repr(C)]</code> 的结构体。</p>
<pre><code class="language-rust">use std::os::raw::{c_int, c_char};
use std::ffi::CString;

// 1. 定义兼容 C 的结构体
#[repr(C)]
pub struct Config {
    pub id: c_int,
    pub name: *const c_char,
    pub active: bool,
}

// 2. 声明位于 C 库中的函数原型
extern "C" {
    fn process_config(config: *const Config);
}

fn main() {
    // 3. 准备数据：注意 CString 的生命周期
    let name = CString::new("Rust-InterOp-Service").unwrap();

    let config = Config {
        id: 1024,
        name: name.as_ptr(),
        active: true,
    };

    // 4. 调用外部函数
    unsafe {
        process_config(&amp;config);
    }
}</code></pre>
<blockquote>
<p><strong>💡 思考：手动写这些太麻烦了怎么办？</strong></p>
<p>你可能已经发现了：C 语言只需要 <code>#include &lt;header.h&gt;</code> 就能拿到定义，Rust 难道必须手动重写一遍 C 库里成百上千个结构体吗？</p>
<p>答案是：<strong>不需要。</strong> 虽然 Rust 编译器本身不理解 <code>.h</code> 文件，但我们可以使用工具 <strong><code>bindgen</code></strong>。它能自动解析 C 头文件并生成对应的 Rust <code>extern "C"</code> 块和 <code>#[repr(C)]</code> 结构体。在处理大型 C 项目时，自动化工具是绝对的主流。我们将在下一篇文章里详细探讨它。</p>
</blockquote>
<blockquote>
<p><strong>注意</strong>：在上面的代码中，<code>process_config</code> 函数的实现是在外部的 C 库（如 <code>.c</code> 文件或 <code>.so/.dll</code> 动态库）中。Rust 编译器在编译时会通过 <code>extern "C"</code> 块生成一个待链接的符号，并在链接阶段将其指向真实的 C 实现。</p>
</blockquote>
<h2 id="示例-3处理-c-风格的回调函数">示例 3：处理 C 风格的回调函数</h2>
<p>C 语言库经常通过函数指针来提供异步或事件回调。在 Rust 中，我们可以通过 <code>extern "C" fn</code> 来定义符合要求的函数。</p>
<pre><code class="language-rust">use std::os::raw::c_int;

// 1. 定义函数指针类型（符合 C ABI）
type Callback = extern "C" fn(c_int, c_int) -&gt; c_int;

extern "C" {
    // 2. 声明一个接收回调的外部 C 函数
    fn run_operation(a: c_int, b: c_int, cb: Callback);
}

// 3. 在 Rust 中编写回调函数的具体实现
// 必须加上 extern "C" 以匹配调用约定
extern "C" fn my_rust_callback(a: c_int, b: c_int) -&gt; c_int {
    println!("Rust 回调被触发：a = {}, b = {}", a, b);
    a + b
}

fn main() {
    unsafe {
        // 4. 将 Rust 函数作为回调传给 C
        run_operation(10, 20, my_rust_callback);
    }
}</code></pre>
<h1 id="练习题">练习题</h1>
<h2 id="核心概念测验">核心概念测验</h2>
</div>
</div>
</div>
</div>
</div> 