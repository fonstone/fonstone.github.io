---
title: "unsafe 块与超能力"
description: "Unsafe Rust - unsafe 块与超能力"
date: "2026-07-12"
order: 18001
tags: ["unsafe", "unsafe 块", "unsafe 能力"]
est_time: "20 分钟"
---

 <h1 id="为什么需要-unsafe">为什么需要 unsafe</h1>
<p>Rust 的安全保证来自编译器——借用检查器、类型系统、生命周期检查，它们在编译期拦截了绝大多数内存错误。但这套系统并非万能：有时候你写的代码<strong>确实是安全的</strong>，编译器却因为信息不足而无法证明。</p>
<p>典型场景：</p>
<ul>
<li>调用 C 语言函数——编译器不了解 C 的内存契约</li>
<li>直接操作硬件寄存器——访问地址由硬件手册决定，而非 Rust 类型系统</li>
<li>实现 <code>Vec</code>、<code>Arc</code> 这样的底层数据结构——需要手动管理内存布局</li>
</ul>
<p>为了支持这些场景，Rust 提供了 <code>unsafe</code> 关键字，让你对编译器说：“这里我比你更了解情况，放行。“</p>
<h2 id="unsafe-块做了什么和你以为的不一样">unsafe 块做了什么（和你以为的不一样）</h2>
<p><strong>常见误解</strong>：<code>unsafe {}</code> 会关闭借用检查器。</p>
<p><strong>实际上</strong>：<code>unsafe</code> 块<strong>不会</strong>禁用任何安全检查。借用规则、生命周期、类型检查在 <code>unsafe</code> 块里一样全力运行。<code>unsafe</code> 只是<strong>解锁了五种额外操作</strong>，在普通代码里这五种操作是被禁止的。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20x%20%3D%205%3B%0A%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E5%9C%A8%20unsafe%20%E5%9D%97%E9%87%8C%EF%BC%8C%E5%80%9F%E7%94%A8%E6%A3%80%E6%9F%A5%E5%99%A8%E4%BB%8D%E7%84%B6%E5%B7%A5%E4%BD%9C%0A%20%20%20%20%20%20%20%20let%20r1%20%3D%20%26x%3B%0A%20%20%20%20%20%20%20%20let%20r2%20%3D%20%26x%3B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%20%7B%7D%22%2C%20r1%2C%20r2)%3B%20%2F%2F%20%E6%AD%A3%E5%B8%B8%EF%BC%9A%E4%B8%A4%E4%B8%AA%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%80%9F%E7%94%A8%0A%0A%20%20%20%20%20%20%20%20%2F%2F%20%E4%B8%8B%E9%9D%A2%E8%BF%99%E8%A1%8C%E5%9C%A8%20unsafe%20%E9%87%8C%E4%B9%9F%E4%BC%9A%E7%BC%96%E8%AF%91%E5%A4%B1%E8%B4%A5%EF%BC%9A%0A%20%20%20%20%20%20%20%20%2F%2F%20let%20r3%20%3D%20%26mut%20x%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9A%E4%B8%8D%E5%8F%AF%E5%8F%98%E5%80%9F%E7%94%A8%E4%BB%8D%E7%84%B6%E6%B4%BB%E8%B7%83%0A%20%20%20%20%20%20%20%20let%20_%20%3D%20r1%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20unsafe%20%E5%9D%97%E5%94%AF%E4%B8%80%E5%81%9A%E7%9A%84%E4%BA%8B%EF%BC%9A%E5%85%81%E8%AE%B8%E8%A7%A3%E5%BC%95%E7%94%A8%E8%A3%B8%E6%8C%87%E9%92%88%0A%20%20%20%20let%20raw%20%3D%20%26mut%20x%20as%20*mut%20i32%3B%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20*raw%20%2B%3D%201%3B%20%2F%2F%20%E5%8F%AA%E6%9C%89%E8%BF%99%E6%AD%A5%E9%9C%80%E8%A6%81%20unsafe%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22x%20%3D%20%7B%7D%22%2C%20x)%3B%20%2F%2F%206%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut x = 5;

    unsafe {
        // 在 unsafe 块里，借用检查器仍然工作
        let r1 = &amp;x;
        let r2 = &amp;x;
        println!("{} {}", r1, r2); // 正常：两个不可变借用

        // 下面这行在 unsafe 里也会编译失败：
        // let r3 = &amp;mut x; // 错误：不可变借用仍然活跃
        let _ = r1;
    }

    // unsafe 块唯一做的事：允许解引用裸指针
    let raw = &amp;mut x as *mut i32;
    unsafe {
        *raw += 1; // 只有这步需要 unsafe
    }
    println!("x = {}", x); // 6
}</code></pre></div>
<blockquote>
<p><strong>关键心智模型</strong>：<code>unsafe</code> 是你对编译器做出的<strong>承诺</strong>——“我检查过了，这里的内存操作是安全的”。责任从编译器转移到了你。</p>
</blockquote>
<h2 id="五大-unsafe-超能力">五大 unsafe 超能力</h2>
<p>只有以下五种操作需要 <code>unsafe</code> 块或 <code>unsafe</code> 标注，其他的什么都不需要：</p>
<table><thead><tr><th>操作</th><th>为何危险</th></tr></thead><tbody><tr><td>解引用裸指针 <code>*const T</code> / <code>*mut T</code></td><td>指针可能为空、已释放或未对齐</td></tr><tr><td>调用 <code>unsafe</code> 函数或方法</td><td>函数要求调用者满足特定前提条件</td></tr><tr><td>读写可变静态变量 <code>static mut</code></td><td>多线程下存在数据竞争风险</td></tr><tr><td>实现 <code>unsafe trait</code></td><td>trait 要求实现者保证某些编译器无法验证的契约</td></tr><tr><td>访问 <code>union</code> 的字段</td><td>union 的内存解释完全由你负责</td></tr></tbody></table>
<h1 id="五大超能力详解">五大超能力详解</h1>
<h2 id="超能力一解引用裸指针">超能力一：解引用裸指针</h2>
<p><strong>为什么编译器不允许？</strong></p>
<p>Rust 的引用（<code>&amp;T</code> / <code>&amp;mut T</code>）有严格的编译期保证：总是有效、非 null、已对齐、有正确的生命周期。裸指针（<code>*const T</code> / <code>*mut T</code>）没有任何这些保证——它可能是 null、指向已释放的内存、指向未初始化的数据，或者根本没有对齐。编译器无法检查，所以默认禁止。</p>
<p><strong>什么时候真正需要它？</strong></p>
<ul>
<li>调用 C 函数：C 的 API 返回裸指针，你必须解引用才能读数据</li>
<li>构建双向链表、自引用结构——这些结构用安全引用无法表达</li>
<li>在手动分配的内存上读写数据（如实现自己的 <code>Vec</code> 或内存池）</li>
</ul>
<p><strong>你需要保证什么：</strong> 解引用时，指针非 null、指向已初始化的有效内存、内存对齐满足 <code>T</code> 的要求、且指向的数据在整个使用期间不会被释放。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%2042i32%3B%0A%0A%20%20%20%20%2F%2F%20%E5%88%9B%E5%BB%BA%E8%A3%B8%E6%8C%87%E9%92%88%E4%B8%8D%E9%9C%80%E8%A6%81%20unsafe%E2%80%94%E2%80%94%E5%8F%AA%E6%98%AF%E8%AE%B0%E5%BD%95%E4%BA%86%E4%B8%80%E4%B8%AA%E5%9C%B0%E5%9D%80%0A%20%20%20%20let%20ptr%3A%20*const%20i32%20%3D%20%26x%20as%20*const%20i32%3B%0A%0A%20%20%20%20%2F%2F%20%E8%A7%A3%E5%BC%95%E7%94%A8%E9%9C%80%E8%A6%81%20unsafe%EF%BC%8C%E5%9B%A0%E4%B8%BA%E7%BC%96%E8%AF%91%E5%99%A8%E6%97%A0%E6%B3%95%E4%BF%9D%E8%AF%81%20ptr%20%E6%9C%89%E6%95%88%0A%20%20%20%20%2F%2F%20%E4%BD%86%E6%88%91%E4%BB%AC%E7%9F%A5%E9%81%93%E5%AE%83%E6%9C%89%E6%95%88%EF%BC%9Aptr%20%E6%9D%A5%E8%87%AA%E5%90%88%E6%B3%95%E5%BC%95%E7%94%A8%EF%BC%8Cx%20%E8%BF%98%E6%B4%BB%E7%9D%80%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E9%80%9A%E8%BF%87%E8%A3%B8%E6%8C%87%E9%92%88%E8%AF%BB%E5%8F%96%3A%20%7B%7D%22%2C%20*ptr)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E6%BC%94%E7%A4%BA%E5%8D%B1%E9%99%A9%EF%BC%9Anull%20%E6%8C%87%E9%92%88%E8%A7%A3%E5%BC%95%E7%94%A8%20%3D%20%E7%A8%8B%E5%BA%8F%E5%B4%A9%E6%BA%83%0A%20%20%20%20let%20null_ptr%3A%20*const%20i32%20%3D%20std%3A%3Aptr%3A%3Anull()%3B%0A%20%20%20%20println!(%22null%20%E6%8C%87%E9%92%88%E6%98%AF%E5%90%A6%E4%B8%BA%20null%3A%20%7B%7D%22%2C%20null_ptr.is_null())%3B%0A%20%20%20%20%2F%2F%20unsafe%20%7B%20println!(%22%7B%7D%22%2C%20*null_ptr)%3B%20%7D%20%2F%2F%20%E5%8D%83%E4%B8%87%E5%88%AB%E8%BF%99%E6%A0%B7%E5%81%9A%EF%BC%8C%E7%9B%B4%E6%8E%A5%20crash%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 42i32;

    // 创建裸指针不需要 unsafe——只是记录了一个地址
    let ptr: *const i32 = &amp;x as *const i32;

    // 解引用需要 unsafe，因为编译器无法保证 ptr 有效
    // 但我们知道它有效：ptr 来自合法引用，x 还活着
    unsafe {
        println!("通过裸指针读取: {}", *ptr);
    }

    // 演示危险：null 指针解引用 = 程序崩溃
    let null_ptr: *const i32 = std::ptr::null();
    println!("null 指针是否为 null: {}", null_ptr.is_null());
    // unsafe { println!("{}", *null_ptr); } // 千万别这样做，直接 crash
}</code></pre></div>
<blockquote>
<p>一句话记忆：<strong>创建裸指针安全，解引用裸指针危险</strong>。</p>
</blockquote>
<h2 id="超能力二调用-unsafe-函数">超能力二：调用 unsafe 函数</h2>
<p><strong>为什么编译器不允许？</strong></p>
<p>有些函数的正确性依赖于调用者必须满足的前提条件，但这些条件无法用类型系统表达，编译器检查不了。例如：</p>
<ul>
<li><code>std::str::from_utf8_unchecked(bytes)</code> — 要求字节序列是合法的 UTF-8，否则字符串乱码或 panic</li>
<li><code>Vec::set_len(new_len)</code> — 要求 <code>new_len</code> 不超过容量且新范围内的元素已初始化，否则访问未初始化内存</li>
<li><code>slice::get_unchecked(idx)</code> — 要求 <code>idx</code> 在范围内，否则越界读</li>
</ul>
<p>这类函数把安全责任明确转移给调用者，用 <code>unsafe fn</code> 标注是一种警告：<strong>“调用我之前，你必须自己检查。”</strong></p>
<p><strong>什么时候真正需要它？</strong></p>
<ul>
<li>性能敏感路径，已经在外部验证了条件，不想再做重复的边界检查</li>
<li>FFI：所有 <code>extern "C"</code> 函数都是隐式 <code>unsafe fn</code></li>
<li>标准库底层实现内部</li>
</ul>
<p><strong>你需要保证什么：</strong> 该函数的 <code># Safety</code> 文档里写了什么，你就保证什么。没有 <code># Safety</code> 文档的 <code>unsafe fn</code> 是写得不够好的代码。</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20bytes%20%3D%20vec!%5B104u8%2C%20101%2C%20108%2C%20108%2C%20111%5D%3B%20%2F%2F%20%22hello%22%20%E7%9A%84%20UTF-8%0A%0A%20%20%20%20%2F%2F%20%E5%AE%89%E5%85%A8%E7%89%88%E6%9C%AC%EF%BC%9A%E4%BC%9A%E9%AA%8C%E8%AF%81%20UTF-8%EF%BC%8C%E8%BF%94%E5%9B%9E%20Result%0A%20%20%20%20let%20s_safe%20%3D%20std%3A%3Astr%3A%3Afrom_utf8(%26bytes).unwrap()%3B%0A%20%20%20%20println!(%22%E5%AE%89%E5%85%A8%E7%89%88%E6%9C%AC%3A%20%7B%7D%22%2C%20s_safe)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%B8%8D%E5%AE%89%E5%85%A8%E7%89%88%E6%9C%AC%EF%BC%9A%E8%B7%B3%E8%BF%87%E9%AA%8C%E8%AF%81%EF%BC%8C%E7%9B%B4%E6%8E%A5%E8%BD%AC%E6%8D%A2%0A%20%20%20%20%2F%2F%20%E6%88%91%E4%BB%AC%E4%BF%9D%E8%AF%81%E4%BA%86%20bytes%20%E7%A1%AE%E5%AE%9E%E6%98%AF%E5%90%88%E6%B3%95%E7%9A%84%20UTF-8%0A%20%20%20%20let%20s_fast%20%3D%20unsafe%20%7B%20std%3A%3Astr%3A%3Afrom_utf8_unchecked(%26bytes)%20%7D%3B%0A%20%20%20%20println!(%22%E4%B8%8D%E5%AE%89%E5%85%A8%E7%89%88%E6%9C%AC%3A%20%7B%7D%22%2C%20s_fast)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E4%BC%A0%E5%85%A5%E9%9D%9E%E6%B3%95%20UTF-8%EF%BC%8Cfrom_utf8_unchecked%20%E4%BC%9A%E4%BA%A7%E7%94%9F%E6%9C%AA%E5%AE%9A%E4%B9%89%E8%A1%8C%E4%B8%BA%0A%20%20%20%20%2F%2F%20%E8%BF%99%E6%AD%A3%E6%98%AF%E5%AE%83%E9%9C%80%E8%A6%81%20unsafe%20%E7%9A%84%E5%8E%9F%E5%9B%A0%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let bytes = vec![104u8, 101, 108, 108, 111]; // "hello" 的 UTF-8

    // 安全版本：会验证 UTF-8，返回 Result
    let s_safe = std::str::from_utf8(&amp;bytes).unwrap();
    println!("安全版本: {}", s_safe);

    // 不安全版本：跳过验证，直接转换
    // 我们保证了 bytes 确实是合法的 UTF-8
    let s_fast = unsafe { std::str::from_utf8_unchecked(&amp;bytes) };
    println!("不安全版本: {}", s_fast);

    // 如果传入非法 UTF-8，from_utf8_unchecked 会产生未定义行为
    // 这正是它需要 unsafe 的原因
}</code></pre></div>
<blockquote>
<p>注意：所有通过 <code>extern "C"</code> 声明的 C 函数都属于这一类——Rust 编译器看不到 C 的实现，无法验证安全性，所以调用 C 函数也需要 <code>unsafe</code> 块。</p>
</blockquote>
<h2 id="超能力三读写可变静态变量">超能力三：读写可变静态变量</h2>
<p><strong>为什么编译器不允许？</strong></p>
<p>不可变静态变量（<code>static FOO: i32 = 0</code>）是安全的，因为只读不存在竞争。可变静态变量（<code>static mut</code>）是全局共享的可变状态——如果两个线程同时读写同一个全局变量，就会产生<strong>数据竞争</strong>（data race），这是未定义行为。</p>
<p>编译器无法知道你的程序在哪里会产生多线程访问，所以对所有 <code>static mut</code> 的读写都要求 <code>unsafe</code>，把”我保证不会有并发访问”这个责任交给你。</p>
<p><strong>什么时候真正需要它？</strong></p>
<ul>
<li>嵌入式系统：中断处理程序和主循环共享的硬件寄存器状态</li>
<li>单线程小程序里的简单全局计数器</li>
<li>与 C 代码共享全局变量（C 常用全局状态）</li>
</ul>
<p><strong>你需要保证什么：</strong> 要么程序是单线程的；要么对这个变量的所有访问都通过互斥锁（<code>Mutex</code>）或原子操作保护。</p>
<blockquote>
<p><strong>既然有 <code>Mutex</code>，为何不直接用 <code>static Mutex&lt;T&gt;</code> 代替 <code>static mut</code>？</strong></p>
<p>对于普通应用代码，这<strong>完全可以</strong>，也是推荐做法——<code>static Mutex&lt;T&gt;</code> 不需要 <code>unsafe</code>，且天然线程安全。但 <code>static mut</code> 在某些场景下不可替代：</p>
<ul>
<li><strong>嵌入式 / <code>no_std</code> 环境</strong>：没有操作系统，标准库的 <code>Mutex</code> 依赖 OS 的阻塞原语，根本无法使用</li>
<li><strong>FFI / 与 C 交互</strong>：C 代码不认识 Rust 的 <code>Mutex</code>，共享全局状态只能用裸变量</li>
<li><strong>极致性能路径</strong>：已在外部保证了单线程访问，不想引入任何加锁开销</li>
</ul>
<p>所以 <code>static mut</code> 主要留给系统级、嵌入式和 FFI 场景；普通代码尽量用 <code>static Mutex&lt;T&gt;</code> 或 <code>static AtomicXxx</code>。</p>
</blockquote>
<div class="code-runner" data-full-code="static%20mut%20REQUEST_COUNT%3A%20u64%20%3D%200%3B%0A%0A%2F%2F%20%E5%81%87%E8%AE%BE%E8%BF%99%E4%B8%AA%E5%87%BD%E6%95%B0%E5%8F%AA%E4%BC%9A%E5%9C%A8%E5%8D%95%E7%BA%BF%E7%A8%8B%E4%B8%AD%E8%A2%AB%E8%B0%83%E7%94%A8%0Afn%20handle_request()%20%7B%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20REQUEST_COUNT%20%2B%3D%201%3B%0A%20%20%20%20%7D%0A%20%20%20%20%2F%2F%20%E5%A4%84%E7%90%86%E8%AF%B7%E6%B1%82%E9%80%BB%E8%BE%91...%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20handle_request()%3B%0A%20%20%20%20handle_request()%3B%0A%20%20%20%20handle_request()%3B%0A%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%A4%84%E7%90%86%E4%BA%86%20%7B%7D%20%E4%B8%AA%E8%AF%B7%E6%B1%82%22%2C%20REQUEST_COUNT)%3B%20%2F%2F%203%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">static mut REQUEST_COUNT: u64 = 0;

// 假设这个函数只会在单线程中被调用
fn handle_request() {
    unsafe {
        REQUEST_COUNT += 1;
    }
    // 处理请求逻辑...
}

fn main() {
    handle_request();
    handle_request();
    handle_request();

    unsafe {
        println!("处理了 {} 个请求", REQUEST_COUNT); // 3
    }
}</code></pre></div>
<blockquote>
<p><strong>生产代码的替代方案</strong>：用 <code>std::sync::atomic::AtomicU64</code> 代替 <code>static mut u64</code>，用 <code>Mutex&lt;T&gt;</code> 代替 <code>static mut T</code>。它们的读写不需要 <code>unsafe</code>，且天然线程安全。</p>
</blockquote>
<h2 id="超能力四实现-unsafe-trait">超能力四：实现 unsafe trait</h2>
<p><strong>什么是 unsafe trait？</strong></p>
<p>普通的 trait 只是一组方法签名，编译器可以验证你的实现类型是否匹配。但有些 trait 还附带一条<strong>编译器无法验证的安全承诺</strong>——这样的 trait 就标注为 <code>unsafe trait</code>，实现它时必须写 <code>unsafe impl</code>，意思是：“我承诺满足了那条隐性规则。”</p>
<p>用一个具体例子来建立直觉。先想想这个问题：如果你要把一块内存里的所有字节都设为 <code>0</code>，然后把它当作某个类型的值来用，这安全吗？</p>
<p>答案是：<strong>看类型</strong>。</p>
<ul>
<li><code>u32</code>：4 个字节全零 = 数字 <code>0</code>，完全合法</li>
<li><code>bool</code>：只允许 <code>0</code>（false）或 <code>1</code>（true），全零是 <code>0</code>，合法</li>
<li><code>&amp;str</code>：是一个指针，全零 = null 指针，<strong>Rust 的引用不允许为 null，立刻未定义行为</strong></li>
</ul>
<p>编译器知道每种类型占多少字节，但它<strong>不知道哪些字节模式对这个类型是合法值</strong>——这是语义层面的规则，只有程序员才清楚。</p>
<p>这就是 <code>unsafe trait</code> 的用武之地：让程序员用 <code>unsafe impl</code> 向编译器做出承诺：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E5%AE%9A%E4%B9%89%E4%B8%80%E4%B8%AA%20unsafe%20trait%EF%BC%8C%E9%99%84%E5%B8%A6%E4%B8%80%E6%9D%A1%E6%89%BF%E8%AF%BA%EF%BC%9A%0A%2F%2F%20%22%E5%AE%9E%E7%8E%B0%E4%BA%86%E8%BF%99%E4%B8%AA%20trait%20%E7%9A%84%E7%B1%BB%E5%9E%8B%EF%BC%8C%E5%85%A8%E9%9B%B6%E5%AD%97%E8%8A%82%E6%98%AF%E5%90%88%E6%B3%95%E5%80%BC%22%0Aunsafe%20trait%20Zeroable%20%7B%7D%0A%0A%2F%2F%20u32%20%E5%85%A8%E9%9B%B6%E5%B0%B1%E6%98%AF%E6%95%B0%E5%AD%97%200%EF%BC%8C%E5%90%88%E6%B3%95%EF%BC%8C%E6%88%91%E4%BB%AC%E6%89%BF%E8%AF%BA%0Aunsafe%20impl%20Zeroable%20for%20u32%20%7B%7D%0A%0A%2F%2F%20bool%20%E5%85%A8%E9%9B%B6%E5%B0%B1%E6%98%AF%20false%EF%BC%8C%E4%B9%9F%E5%90%88%E6%B3%95%0Aunsafe%20impl%20Zeroable%20for%20bool%20%7B%7D%0A%0A%2F%2F%20%26str%20%E6%88%91%E4%BB%AC%E4%B8%8D%E5%AE%9E%E7%8E%B0%20%E2%80%94%E2%80%94%20null%20%E5%BC%95%E7%94%A8%E6%98%AF%E6%9C%AA%E5%AE%9A%E4%B9%89%E8%A1%8C%E4%B8%BA%EF%BC%8C%E4%B8%8D%E8%83%BD%E6%89%BF%E8%AF%BA%0A%0A%2F%2F%20%E6%9C%89%E4%BA%86%20Zeroable%20%E7%BA%A6%E6%9D%9F%EF%BC%8C%E8%BF%99%E4%B8%AA%E5%87%BD%E6%95%B0%E6%89%8D%E6%95%A2%E8%B0%83%E7%94%A8%20mem%3A%3Azeroed%0Afn%20zeroed%3CT%3A%20Zeroable%3E()%20-%3E%20T%20%7B%0A%20%20%20%20unsafe%20%7B%20std%3A%3Amem%3A%3Azeroed()%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20n%3A%20u32%20%3D%20zeroed()%3B%0A%20%20%20%20let%20b%3A%20bool%20%3D%20zeroed()%3B%0A%20%20%20%20println!(%22u32%3A%20%7B%7D%22%2C%20n)%3B%20%20%20%2F%2F%200%0A%20%20%20%20println!(%22bool%3A%20%7B%7D%22%2C%20b)%3B%20%20%2F%2F%20false%0A%7D" data-mode="run"><pre><code class="language-rust">// 定义一个 unsafe trait，附带一条承诺：
// "实现了这个 trait 的类型，全零字节是合法值"
unsafe trait Zeroable {}

// u32 全零就是数字 0，合法，我们承诺
unsafe impl Zeroable for u32 {}

// bool 全零就是 false，也合法
unsafe impl Zeroable for bool {}

// &amp;str 我们不实现 —— null 引用是未定义行为，不能承诺

// 有了 Zeroable 约束，这个函数才敢调用 mem::zeroed
fn zeroed&lt;T: Zeroable&gt;() -&gt; T {
    unsafe { std::mem::zeroed() }
}

fn main() {
    let n: u32 = zeroed();
    let b: bool = zeroed();
    println!("u32: {}", n);   // 0
    println!("bool: {}", b);  // false
}</code></pre></div>
<p><strong>整个过程的逻辑链：</strong></p>
<ol>
<li><code>std::mem::zeroed::&lt;T&gt;()</code> 把 T 的内存全部清零并返回——这是 <code>unsafe fn</code>，因为编译器不知道全零对 T 是否合法</li>
<li>我们定义 <code>Zeroable</code> trait，语义是”全零合法”的承诺</li>
<li><code>zeroed&lt;T: Zeroable&gt;</code> 函数里，因为 T 被约束为 <code>Zeroable</code>，我们知道全零一定合法，所以可以安心调用 <code>mem::zeroed</code></li>
<li>调用者只能对 <code>u32</code>、<code>bool</code> 这些我们手动 <code>unsafe impl</code> 过的类型使用 <code>zeroed()</code>——如果尝试 <code>zeroed::&lt;&amp;str&gt;()</code>，编译器会直接报错</li>
</ol>
<blockquote>
<p>写下 <code>unsafe impl</code> 不会让类型自动变安全——编译器只是信任了你的承诺。如果承诺是错的（比如为 <code>&amp;str</code> 实现 <code>Zeroable</code>），程序照样崩溃，编译器不会再阻拦你。</p>
</blockquote>
<h2 id="超能力五访问-union-字段">超能力五：访问 union 字段</h2>
<p><strong>为什么编译器不允许？</strong></p>
<p><code>union</code> 的所有字段共享同一块内存。当你写入 <code>u.i = 42</code>，之后读 <code>u.f</code>，得到的是把 <code>42i32</code> 的内存字节解释为 <code>f32</code> 的结果——这可能是一个无意义的浮点数，也可能引发更严重的问题（如把整数当指针解引用）。编译器不会跟踪”当前这个 union 里存的是哪个类型”，所以读取任何字段都需要你承诺”我知道现在存的是这个类型”。</p>
<p><strong>什么时候真正需要它？</strong></p>
<ul>
<li>FFI：C 语言大量使用 union（如 <code>sockaddr</code> 网络地址结构、<code>ioctl</code> 参数）</li>
<li>位操作技巧：把 <code>f32</code> 的内存位直接当 <code>u32</code> 读（fast inverse square root 算法就用了这个）</li>
<li>手动实现带标签的 union（不过 Rust 的 <code>enum</code> 在大多数场合更好）</li>
</ul>
<p><strong>你需要保证什么：</strong> 读取某个字段时，union 中存储的确实是该字段的有效值，且该值满足该类型的有效性约束（如引用类型的字段不能是无效地址）。</p>
<div class="code-runner" data-full-code="union%20FloatBits%20%7B%0A%20%20%20%20f%3A%20f32%2C%0A%20%20%20%20bits%3A%20u32%2C%0A%7D%0A%0Afn%20float_to_bits(val%3A%20f32)%20-%3E%20u32%20%7B%0A%20%20%20%20let%20u%20%3D%20FloatBits%20%7B%20f%3A%20val%20%7D%3B%0A%20%20%20%20unsafe%20%7B%20u.bits%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%88%A9%E7%94%A8%20union%20%E6%9F%A5%E7%9C%8B%E6%B5%AE%E7%82%B9%E6%95%B0%E7%9A%84%E5%86%85%E9%83%A8%E4%BA%8C%E8%BF%9B%E5%88%B6%E8%A1%A8%E7%A4%BA%0A%20%20%20%20println!(%221.0%20%E7%9A%84%E4%BD%8D%E8%A1%A8%E7%A4%BA%3A%20%7B%3A%23010x%7D%22%2C%20float_to_bits(1.0))%3B%20%20%20%2F%2F%200x3f800000%0A%20%20%20%20println!(%220.5%20%E7%9A%84%E4%BD%8D%E8%A1%A8%E7%A4%BA%3A%20%7B%3A%23010x%7D%22%2C%20float_to_bits(0.5))%3B%20%20%20%2F%2F%200x3f000000%0A%20%20%20%20println!(%22-1.0%20%E7%9A%84%E4%BD%8D%E8%A1%A8%E7%A4%BA%3A%20%7B%3A%23010x%7D%22%2C%20float_to_bits(-1.0))%3B%20%2F%2F%200xbf800000%0A%0A%20%20%20%20%2F%2F%20%E6%BC%94%E7%A4%BA%E5%8D%B1%E9%99%A9%EF%BC%9A%E5%86%99%E5%85%A5%20i%EF%BC%8C%E8%AF%BB%E5%8F%96%20f%0A%20%20%20%20let%20u%20%3D%20FloatBits%20%7B%20bits%3A%200x40000000%20%7D%3B%20%2F%2F%202.0f32%20%E7%9A%84%E4%BD%8D%E8%A1%A8%E7%A4%BA%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20println!(%22bits%3D0x40000000%20%E8%A7%A3%E9%87%8A%E4%B8%BA%20f32%3A%20%7B%7D%22%2C%20u.f)%3B%20%2F%2F%202.0%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">union FloatBits {
    f: f32,
    bits: u32,
}

fn float_to_bits(val: f32) -&gt; u32 {
    let u = FloatBits { f: val };
    unsafe { u.bits }
}

fn main() {
    // 利用 union 查看浮点数的内部二进制表示
    println!("1.0 的位表示: {:#010x}", float_to_bits(1.0));   // 0x3f800000
    println!("0.5 的位表示: {:#010x}", float_to_bits(0.5));   // 0x3f000000
    println!("-1.0 的位表示: {:#010x}", float_to_bits(-1.0)); // 0xbf800000

    // 演示危险：写入 i，读取 f
    let u = FloatBits { bits: 0x40000000 }; // 2.0f32 的位表示
    unsafe {
        println!("bits=0x40000000 解释为 f32: {}", u.f); // 2.0
    }
}</code></pre></div>
<blockquote>
<p><strong>与 enum 的对比</strong>：Rust 的 <code>enum</code> 是”有标签的 union”——编译器自动跟踪当前存的是哪个变体，读取时通过 <code>match</code> 确保类型正确。没有特殊需求（FFI、位操作）时，优先用 <code>enum</code> 而非 <code>union</code>。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="unsafe-基础测验">unsafe 基础测验</h2>
</div>
</div>
<pre><code class="language-rust">static mut TOTAL: i32 = 0;

fn add(n: i32) {
    TOTAL += n;
}</code></pre>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面的代码尝试通过裸指针交换两个变量的值，但缺少必要的 <code>unsafe</code> 标注，请修复它：</p>
<div class="code-editor" data-block-id="18-unsafe/01-unsafe#2:5" data-expect-mode="literal" data-expect-pattern="x%3D20%2C%20y%3D10" data-starter-code="fn%20swap_via_ptr(a%3A%20%26mut%20i32%2C%20b%3A%20%26mut%20i32)%20%7B%0A%20%20%20%20let%20pa%3A%20*mut%20i32%20%3D%20a%20as%20*mut%20i32%3B%0A%20%20%20%20let%20pb%3A%20*mut%20i32%20%3D%20b%20as%20*mut%20i32%3B%0A%20%20%20%20let%20tmp%20%3D%20*pa%3B%20%20%20%2F%2F%20%E9%9C%80%E8%A6%81%20unsafe%0A%20%20%20%20*pa%20%3D%20*pb%3B%20%20%20%20%20%20%20%2F%2F%20%E9%9C%80%E8%A6%81%20unsafe%0A%20%20%20%20*pb%20%3D%20tmp%3B%20%20%20%20%20%20%20%2F%2F%20%E9%9C%80%E8%A6%81%20unsafe%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20x%20%3D%2010%3B%0A%20%20%20%20let%20mut%20y%20%3D%2020%3B%0A%20%20%20%20swap_via_ptr(%26mut%20x%2C%20%26mut%20y)%3B%0A%20%20%20%20println!(%22x%3D%7B%7D%2C%20y%3D%7B%7D%22%2C%20x%2C%20y)%3B%0A%7D"><pre><code class="language-rust">fn swap_via_ptr(a: &amp;mut i32, b: &amp;mut i32) {
    let pa: *mut i32 = a as *mut i32;
    let pb: *mut i32 = b as *mut i32;
    let tmp = *pa;   // 需要 unsafe
    *pa = *pb;       // 需要 unsafe
    *pb = tmp;       // 需要 unsafe
}

fn main() {
    let mut x = 10;
    let mut y = 20;
    swap_via_ptr(&amp;mut x, &amp;mut y);
    println!("x={}, y={}", x, y);
}</code></pre></div> 