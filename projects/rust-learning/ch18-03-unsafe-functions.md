---
title: "unsafe 函数与 Trait"
description: "Unsafe Rust - unsafe 函数与 Trait"
date: "2026-07-12"
order: 18003
tags: ["unsafe fn", "unsafe trait", "unsafe impl"]
est_time: "25 分钟"
---

 <h1 id="unsafe-函数">unsafe 函数</h1>
<h2 id="什么时候需要-unsafe-fn">什么时候需要 unsafe fn</h2>
<p>当一个函数有<strong>调用者必须满足但编译器无法验证的前提条件</strong>时，就需要标注 <code>unsafe fn</code>。</p>
<p>常见场景：</p>
<ul>
<li>函数接收裸指针，要求调用者保证指针有效且对齐</li>
<li>函数操作全局状态，要求单线程调用</li>
<li>函数调用了 C 代码，要求参数满足 C 接口的约定</li>
</ul>
<p>标注 <code>unsafe fn</code> 的含义：<strong>这个函数把安全责任转移给调用者</strong>。</p>
<h2 id="unsafe-fn-的基本语法">unsafe fn 的基本语法</h2>
<div class="code-runner" data-full-code="%2F%2F%2F%20%23%20Safety%0A%2F%2F%2F%0A%2F%2F%2F%20-%20%60ptr%60%20%E5%BF%85%E9%A1%BB%E6%8C%87%E5%90%91%E4%B8%80%E4%B8%AA%E6%9C%89%E6%95%88%E7%9A%84%E3%80%81%E5%B7%B2%E5%88%9D%E5%A7%8B%E5%8C%96%E7%9A%84%20%60i32%60%20%E5%80%BC%0A%2F%2F%2F%20-%20%60ptr%60%20%E5%BF%85%E9%A1%BB%E5%9C%A8%E6%95%B4%E4%B8%AA%E8%B0%83%E7%94%A8%E6%9C%9F%E9%97%B4%E4%BF%9D%E6%8C%81%E6%9C%89%E6%95%88%EF%BC%88%E4%B8%8D%E8%83%BD%E6%98%AF%E6%82%AC%E5%9E%82%E6%8C%87%E9%92%88%EF%BC%89%0Aunsafe%20fn%20read_unchecked(ptr%3A%20*const%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20*ptr%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%2042%3B%0A%20%20%20%20%2F%2F%20%E8%B0%83%E7%94%A8%20unsafe%20fn%20%E9%9C%80%E8%A6%81%20unsafe%20%E5%9D%97%0A%20%20%20%20let%20val%20%3D%20unsafe%20%7B%20read_unchecked(%26x%20as%20*const%20i32)%20%7D%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20val)%3B%20%2F%2F%2042%0A%7D" data-mode="run"><pre><code class="language-rust">/// # Safety
///
/// - `ptr` 必须指向一个有效的、已初始化的 `i32` 值
/// - `ptr` 必须在整个调用期间保持有效（不能是悬垂指针）
unsafe fn read_unchecked(ptr: *const i32) -&gt; i32 {
    *ptr
}

fn main() {
    let x = 42;
    // 调用 unsafe fn 需要 unsafe 块
    let val = unsafe { read_unchecked(&amp;x as *const i32) };
    println!("{}", val); // 42
}</code></pre></div>
<blockquote>
<p><strong><code># Safety</code> 文档节</strong>是 Rust 社区的约定：每个 <code>unsafe fn</code> 都应该有一个 <code># Safety</code> 文档注释，说明调用者需要满足什么条件。这是 unsafe 代码可维护性的关键。</p>
</blockquote>
<h2 id="unsafe-fn-内部也需要-unsafe-块">unsafe fn 内部也需要 unsafe 块</h2>
<p><strong>Rust 2021 和 2024 edition 在这里行为不同：</strong></p>
<ul>
<li><strong>2021 edition</strong>：<code>unsafe fn</code> 的函数体是一个隐式的 unsafe 块，内部的危险操作不需要额外的 <code>unsafe {}</code></li>
<li><strong>2024 edition</strong>：即使在 <code>unsafe fn</code> 内，每个危险操作也必须显式加 <code>unsafe {}</code> 块</li>
</ul>
<p>2024 edition 的改动是故意的——强迫你精确标出每一个危险点，而不是让整个函数体”默认危险”，更容易做代码审查。本教程使用 2024 edition，所以你会看到 <code>unsafe fn</code> 内部仍然有 <code>unsafe {}</code> 块：</p>
<div class="code-runner" data-full-code="unsafe%20fn%20process(ptr%3A%20*mut%20i32%2C%20count%3A%20usize)%20%7B%0A%20%20%20%20%2F%2F%202024%20edition%EF%BC%9A%E5%8D%B3%E4%BD%BF%E5%9C%A8%20unsafe%20fn%20%E5%86%85%EF%BC%8C%E5%8D%B1%E9%99%A9%E6%93%8D%E4%BD%9C%E4%B9%9F%E8%A6%81%E6%98%BE%E5%BC%8F%E6%A0%87%E5%87%BA%0A%20%20%20%20for%20i%20in%200..count%20%7B%0A%20%20%20%20%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20*ptr.add(i)%20*%3D%202%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20arr%20%3D%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20process(arr.as_mut_ptr()%2C%20arr.len())%3B%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20arr)%3B%20%2F%2F%20%5B2%2C%204%2C%206%2C%208%2C%2010%5D%0A%7D" data-mode="run"><pre><code class="language-rust">unsafe fn process(ptr: *mut i32, count: usize) {
    // 2024 edition：即使在 unsafe fn 内，危险操作也要显式标出
    for i in 0..count {
        unsafe {
            *ptr.add(i) *= 2;
        }
    }
}

fn main() {
    let mut arr = [1, 2, 3, 4, 5];
    unsafe {
        process(arr.as_mut_ptr(), arr.len());
    }
    println!("{:?}", arr); // [2, 4, 6, 8, 10]
}</code></pre></div>
<h2 id="外部函数extern-fn">外部函数（extern fn）</h2>
<p>通过 <code>extern "C"</code> 块声明的外部函数（通常来自 C 库）是隐式 <code>unsafe</code> 的——调用它们需要 <code>unsafe</code> 块：</p>
<pre><code class="language-rust">extern "C" {
    fn abs(x: i32) -&gt; i32;        // C 标准库的 abs 函数
    fn strlen(s: *const u8) -&gt; usize;
}

fn main() {
    let result = unsafe { abs(-42) };
    println!("{}", result); // 42
}</code></pre>
<p>为什么外部函数是 unsafe？因为 Rust 编译器对 C 代码一无所知——它无法验证 C 函数的内存安全性，所以要求调用者承担责任。</p>
<h1 id="unsafe-trait">unsafe Trait</h1>
<h2 id="什么是-unsafe-trait">什么是 unsafe trait</h2>
<p><code>unsafe trait</code> 表示这个 trait 有<strong>实现者必须手动保证的安全不变量</strong>，编译器无法自动验证。</p>
<p>最重要的两个例子是 <code>Send</code> 和 <code>Sync</code>：</p>
<table><thead><tr><th>Trait</th><th>含义</th><th>编译器自动实现的条件</th></tr></thead><tbody><tr><td><code>Send</code></td><td>类型可以安全地移动到另一个线程</td><td>所有字段都是 <code>Send</code></td></tr><tr><td><code>Sync</code></td><td>类型可以安全地被多个线程共享引用</td><td>所有字段都是 <code>Sync</code></td></tr></tbody></table>
<h2 id="手动实现-send-和-sync">手动实现 Send 和 Sync</h2>
<p>当你的类型包含裸指针时，编译器会保守地不自动实现 <code>Send</code> 和 <code>Sync</code>。如果你确认线程安全，需要手动用 <code>unsafe impl</code> 声明：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Async%3A%3Aatomic%3A%3A%7BAtomicI32%2C%20Ordering%7D%3B%0A%0A%2F%2F%20%E5%8C%85%E5%90%AB%E8%A3%B8%E6%8C%87%E9%92%88%E7%9A%84%E7%B1%BB%E5%9E%8B%EF%BC%9A%E7%BC%96%E8%AF%91%E5%99%A8%E4%B8%8D%E4%BC%9A%E8%87%AA%E5%8A%A8%E5%AE%9E%E7%8E%B0%20Send%2FSync%0Astruct%20AtomicCounter%20%7B%0A%20%20%20%20inner%3A%20*mut%20AtomicI32%2C%0A%7D%0A%0A%2F%2F%20%E6%88%91%E4%BB%AC%E6%89%8B%E5%8A%A8%E4%BF%9D%E8%AF%81%EF%BC%9A%E9%80%9A%E8%BF%87%20AtomicI32%20%E7%9A%84%E5%8E%9F%E5%AD%90%E6%93%8D%E4%BD%9C%EF%BC%8C%E5%A4%9A%E7%BA%BF%E7%A8%8B%E8%AE%BF%E9%97%AE%E6%98%AF%E5%AE%89%E5%85%A8%E7%9A%84%0Aunsafe%20impl%20Send%20for%20AtomicCounter%20%7B%7D%0Aunsafe%20impl%20Sync%20for%20AtomicCounter%20%7B%7D%0A%0Aimpl%20AtomicCounter%20%7B%0A%20%20%20%20fn%20new(val%3A%20i32)%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20let%20boxed%20%3D%20Box%3A%3Anew(AtomicI32%3A%3Anew(val))%3B%0A%20%20%20%20%20%20%20%20AtomicCounter%20%7B%20inner%3A%20Box%3A%3Ainto_raw(boxed)%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20increment(%26self)%20%7B%0A%20%20%20%20%20%20%20%20unsafe%20%7B%20(*self.inner).fetch_add(1%2C%20Ordering%3A%3ASeqCst)%3B%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20get(%26self)%20-%3E%20i32%20%7B%0A%20%20%20%20%20%20%20%20unsafe%20%7B%20(*self.inner).load(Ordering%3A%3ASeqCst)%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Aimpl%20Drop%20for%20AtomicCounter%20%7B%0A%20%20%20%20fn%20drop(%26mut%20self)%20%7B%0A%20%20%20%20%20%20%20%20unsafe%20%7B%20drop(Box%3A%3Afrom_raw(self.inner))%3B%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20counter%20%3D%20AtomicCounter%3A%3Anew(0)%3B%0A%20%20%20%20counter.increment()%3B%0A%20%20%20%20counter.increment()%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20counter.get())%3B%20%2F%2F%202%0A%7D" data-mode="run"><pre><code class="language-rust">use std::sync::atomic::{AtomicI32, Ordering};

// 包含裸指针的类型：编译器不会自动实现 Send/Sync
struct AtomicCounter {
    inner: *mut AtomicI32,
}

// 我们手动保证：通过 AtomicI32 的原子操作，多线程访问是安全的
unsafe impl Send for AtomicCounter {}
unsafe impl Sync for AtomicCounter {}

impl AtomicCounter {
    fn new(val: i32) -&gt; Self {
        let boxed = Box::new(AtomicI32::new(val));
        AtomicCounter { inner: Box::into_raw(boxed) }
    }

    fn increment(&amp;self) {
        unsafe { (*self.inner).fetch_add(1, Ordering::SeqCst); }
    }

    fn get(&amp;self) -&gt; i32 {
        unsafe { (*self.inner).load(Ordering::SeqCst) }
    }
}

impl Drop for AtomicCounter {
    fn drop(&amp;mut self) {
        unsafe { drop(Box::from_raw(self.inner)); }
    }
}

fn main() {
    let counter = AtomicCounter::new(0);
    counter.increment();
    counter.increment();
    println!("{}", counter.get()); // 2
}</code></pre></div>
<h2 id="定义自己的-unsafe-trait">定义自己的 unsafe trait</h2>
<p>你也可以定义自己的 <code>unsafe trait</code>，用来表达某种合同：</p>
<div class="code-runner" data-full-code="%2F%2F%2F%20%23%20Safety%0A%2F%2F%2F%0A%2F%2F%2F%20%E5%AE%9E%E7%8E%B0%E6%AD%A4%20trait%20%E7%9A%84%E7%B1%BB%E5%9E%8B%E5%BF%85%E9%A1%BB%E4%BF%9D%E8%AF%81%EF%BC%9A%0A%2F%2F%2F%20%E5%86%85%E5%AD%98%E5%B8%83%E5%B1%80%E4%B8%8E%20C%20%E4%B8%AD%E5%AF%B9%E5%BA%94%E7%B1%BB%E5%9E%8B%E5%AE%8C%E5%85%A8%E4%B8%80%E8%87%B4%EF%BC%88%23%5Brepr(C)%5D%EF%BC%89%0Aunsafe%20trait%20ReprC%3A%20Sized%20%7B%0A%20%20%20%20fn%20as_bytes(%26self)%20-%3E%20%26%5Bu8%5D%20%7B%0A%20%20%20%20%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20std%3A%3Aslice%3A%3Afrom_raw_parts(%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20self%20as%20*const%20Self%20as%20*const%20u8%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20std%3A%3Amem%3A%3Asize_of%3A%3A%3CSelf%3E()%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20)%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0A%23%5Brepr(C)%5D%0Astruct%20Point%20%7B%20x%3A%20f32%2C%20y%3A%20f32%20%7D%0A%0A%2F%2F%20%E6%88%91%E4%BB%AC%E4%BF%9D%E8%AF%81%20Point%20%E6%98%AF%20%23%5Brepr(C)%5D%20%E5%B8%83%E5%B1%80%E7%9A%84%0Aunsafe%20impl%20ReprC%20for%20Point%20%7B%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20p%20%3D%20Point%20%7B%20x%3A%201.0%2C%20y%3A%202.0%20%7D%3B%0A%20%20%20%20let%20bytes%20%3D%20p.as_bytes()%3B%0A%20%20%20%20println!(%22Point%20%E5%8D%A0%20%7B%7D%20%E5%AD%97%E8%8A%82%22%2C%20bytes.len())%3B%20%2F%2F%208%0A%7D" data-mode="run"><pre><code class="language-rust">/// # Safety
///
/// 实现此 trait 的类型必须保证：
/// 内存布局与 C 中对应类型完全一致（#[repr(C)]）
unsafe trait ReprC: Sized {
    fn as_bytes(&amp;self) -&gt; &amp;[u8] {
        unsafe {
            std::slice::from_raw_parts(
                self as *const Self as *const u8,
                std::mem::size_of::&lt;Self&gt;(),
            )
        }
    }
}

#[repr(C)]
struct Point { x: f32, y: f32 }

// 我们保证 Point 是 #[repr(C)] 布局的
unsafe impl ReprC for Point {}

fn main() {
    let p = Point { x: 1.0, y: 2.0 };
    let bytes = p.as_bytes();
    println!("Point 占 {} 字节", bytes.len()); // 8
}</code></pre></div>
<h2 id="阻止自动实现send-和-sync">阻止自动实现：!Send 和 !Sync</h2>
<p>有时你的类型天生不能跨线程，需要明确<strong>阻止</strong>编译器自动推导 <code>Send</code> 或 <code>Sync</code>。使用 <code>PhantomData</code> 加上 negative impl 是惯用方法：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Amarker%3A%3APhantomData%3B%0A%0A%2F%2F%20PhantomData%3C*const%20()%3E%20%E6%98%AF%20!Send%20%E7%9A%84%EF%BC%8C%E8%BF%99%E4%BC%9A%E8%AE%A9%20MyType%20%E4%B9%9F%E5%8F%98%E6%88%90%20!Send%0Astruct%20MyType%20%7B%0A%20%20%20%20data%3A%20i32%2C%0A%20%20%20%20_not_send%3A%20PhantomData%3C*const%20()%3E%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%20MyType%20%7B%20data%3A%2042%2C%20_not_send%3A%20PhantomData%20%7D%3B%0A%20%20%20%20println!(%22data%20%3D%20%7B%7D%22%2C%20x.data)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%B8%8B%E9%9D%A2%E8%BF%99%E8%A1%8C%E4%BC%9A%E7%BC%96%E8%AF%91%E5%A4%B1%E8%B4%A5%EF%BC%9AMyType%20%E4%B8%8D%E6%98%AF%20Send%EF%BC%8C%E4%B8%8D%E8%83%BD%E8%B7%A8%E7%BA%BF%E7%A8%8B%E7%A7%BB%E5%8A%A8%0A%20%20%20%20%2F%2F%20std%3A%3Athread%3A%3Aspawn(move%20%7C%7C%20%7B%20let%20_%20%3D%20x%3B%20%7D)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::marker::PhantomData;

// PhantomData&lt;*const ()&gt; 是 !Send 的，这会让 MyType 也变成 !Send
struct MyType {
    data: i32,
    _not_send: PhantomData&lt;*const ()&gt;,
}

fn main() {
    let x = MyType { data: 42, _not_send: PhantomData };
    println!("data = {}", x.data);

    // 下面这行会编译失败：MyType 不是 Send，不能跨线程移动
    // std::thread::spawn(move || { let _ = x; });
}</code></pre></div>
<h1 id="练习题">练习题</h1>
<h2 id="unsafe-函数测验">unsafe 函数测验</h2>
</div>
<pre><code class="language-rust">unsafe fn get_first(slice: &amp;[i32]) -&gt; i32 {
    *slice.as_ptr()
}</code></pre>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面有一个 <code>unsafe fn</code>，但缺少 <code># Safety</code> 文档注释，且内部的 unsafe 操作没有用 <code>unsafe</code> 块包裹。请修复它：</p>
<div class="code-editor" data-block-id="18-unsafe/03-unsafe-functions#2:4" data-expect-mode="literal" data-expect-pattern="%5B1%2C%202%2C%203%2C%204%2C%205%5D" data-starter-code="%2F%2F%20TODO%3A%20%E6%B7%BB%E5%8A%A0%20%23%20Safety%20%E6%96%87%E6%A1%A3%E6%B3%A8%E9%87%8A%EF%BC%8C%E8%AF%B4%E6%98%8E%E8%B0%83%E7%94%A8%E8%80%85%E7%9A%84%E5%89%8D%E6%8F%90%E6%9D%A1%E4%BB%B6%0Aunsafe%20fn%20copy_bytes(src%3A%20*const%20u8%2C%20dst%3A%20*mut%20u8%2C%20count%3A%20usize)%20%7B%0A%20%20%20%20for%20i%20in%200..count%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%3A%20%E7%94%A8%20unsafe%20%E5%9D%97%E5%8C%85%E8%A3%B9%E8%A3%B8%E6%8C%87%E9%92%88%E6%93%8D%E4%BD%9C%0A%20%20%20%20%20%20%20%20*dst.add(i)%20%3D%20*src.add(i)%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20src%20%3D%20%5B1u8%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20let%20mut%20dst%20%3D%20%5B0u8%3B%205%5D%3B%0A%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20copy_bytes(src.as_ptr()%2C%20dst.as_mut_ptr()%2C%20src.len())%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20dst)%3B%0A%7D"><pre><code class="language-rust">// TODO: 添加 # Safety 文档注释，说明调用者的前提条件
unsafe fn copy_bytes(src: *const u8, dst: *mut u8, count: usize) {
    for i in 0..count {
        // TODO: 用 unsafe 块包裹裸指针操作
        *dst.add(i) = *src.add(i);
    }
}

fn main() {
    let src = [1u8, 2, 3, 4, 5];
    let mut dst = [0u8; 5];

    unsafe {
        copy_bytes(src.as_ptr(), dst.as_mut_ptr(), src.len());
    }

    println!("{:?}", dst);
}</code></pre></div> 