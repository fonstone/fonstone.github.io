---
title: "裸指针"
description: "Unsafe Rust - 裸指针"
date: "2026-07-12"
order: 18002
tags: ["*const T", "*mut T", "裸指针", "指针操作"]
est_time: "25 分钟"
---

 <h1 id="裸指针基础">裸指针基础</h1>
<p>裸指针（raw pointer）是 Rust 中最接近 C 指针的东西，它绕过了所有借用规则和生命周期检查。和引用相比，裸指针：</p>
<ul>
<li><strong>不保证有效</strong>：可能为空（null）、已悬垂（dangling）或指向未初始化内存</li>
<li><strong>不受借用规则约束</strong>：可以同时存在多个可变裸指针指向同一数据</li>
<li><strong>不自动清理</strong>：裸指针不拥有数据，不会触发 <code>Drop</code></li>
</ul>
<p>Rust 有两种裸指针：</p>
<table><thead><tr><th>类型</th><th>含义</th></tr></thead><tbody><tr><td><code>*const T</code></td><td>不可变裸指针，解引用后不能修改目标</td></tr><tr><td><code>*mut T</code></td><td>可变裸指针，解引用后可以修改目标</td></tr></tbody></table>
<blockquote>
<p>裸指针类型名里的 <code>*</code> 是类型的一部分，不是解引用运算符。读作”pointer-const T”或”pointer-mut T”。</p>
</blockquote>
<h2 id="引用解决不了的四类场景">引用解决不了的四类场景</h2>
<p><strong>99% 的情况下，引用（<code>&amp;T</code> / <code>&amp;mut T</code>）比裸指针更好</strong>——有生命周期保护，有借用检查，出了问题编译期就报错。但有四类场景引用确实无能为力，必须用裸指针：</p>
<h3 id="场景一与-c-代码互操作">场景一：与 C 代码互操作</h3>
<p>C 语言没有 Rust 的引用概念，C 的 API 全部用指针。调用 C 函数、接收 C 回调、读写 C 结构体，都必须用裸指针：</p>
<div class="code-runner" data-full-code="extern%20%22C%22%20%7B%0A%20%20%20%20%2F%2F%20C%20%E6%A0%87%E5%87%86%E5%BA%93%E7%9A%84%20memcpy%EF%BC%8C%E5%8F%82%E6%95%B0%E5%85%A8%E6%98%AF%E8%A3%B8%E6%8C%87%E9%92%88%0A%20%20%20%20fn%20memcpy(dst%3A%20*mut%20u8%2C%20src%3A%20*const%20u8%2C%20n%3A%20usize)%20-%3E%20*mut%20u8%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20src%20%3D%20%5B1u8%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20let%20mut%20dst%20%3D%20%5B0u8%3B%205%5D%3B%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20memcpy(dst.as_mut_ptr()%2C%20src.as_ptr()%2C%20src.len())%3B%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20dst)%3B%20%2F%2F%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%0A%7D" data-mode="run"><pre><code class="language-rust">extern "C" {
    // C 标准库的 memcpy，参数全是裸指针
    fn memcpy(dst: *mut u8, src: *const u8, n: usize) -&gt; *mut u8;
}

fn main() {
    let src = [1u8, 2, 3, 4, 5];
    let mut dst = [0u8; 5];
    unsafe {
        memcpy(dst.as_mut_ptr(), src.as_ptr(), src.len());
    }
    println!("{:?}", dst); // [1, 2, 3, 4, 5]
}</code></pre></div>
<h3 id="场景二借用检查器无法表达的数据结构">场景二：借用检查器无法表达的数据结构</h3>
<p>双向链表、图、自引用结构——这些数据结构里，一个节点同时被多个其他节点”指向”，用引用会产生循环借用，生命周期标注会陷入死局。裸指针绕过了这个限制：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E7%94%A8%E5%BC%95%E7%94%A8%E5%AE%9E%E7%8E%B0%E5%8F%8C%E5%90%91%E9%93%BE%E8%A1%A8%E5%87%A0%E4%B9%8E%E4%B8%8D%E5%8F%AF%E8%83%BD%E2%80%94%E2%80%94%E5%89%8D%E5%90%8E%E8%8A%82%E7%82%B9%E4%BA%92%E7%9B%B8%E6%8C%81%E6%9C%89%E5%AF%B9%E6%96%B9%E7%9A%84%E5%BC%95%E7%94%A8%EF%BC%8C%0A%2F%2F%20%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E6%97%A0%E6%B3%95%E6%8F%8F%E8%BF%B0%E3%80%82%E7%94%A8%E8%A3%B8%E6%8C%87%E9%92%88%E5%88%99%E7%9B%B4%E6%8E%A5%EF%BC%9A%0Astruct%20Node%20%7B%0A%20%20%20%20val%3A%20i32%2C%0A%20%20%20%20prev%3A%20*mut%20Node%2C%20%20%2F%2F%20%E6%8C%87%E5%90%91%E5%89%8D%E4%B8%80%E4%B8%AA%E8%8A%82%E7%82%B9%EF%BC%8C%E5%8F%AF%E4%B8%BA%20null%0A%20%20%20%20next%3A%20*mut%20Node%2C%20%20%2F%2F%20%E6%8C%87%E5%90%91%E5%90%8E%E4%B8%80%E4%B8%AA%E8%8A%82%E7%82%B9%EF%BC%8C%E5%8F%AF%E4%B8%BA%20null%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%BC%94%E7%A4%BA%EF%BC%9A%E5%88%9B%E5%BB%BA%E4%B8%A4%E4%B8%AA%E8%8A%82%E7%82%B9%E5%B9%B6%E8%BF%9E%E6%8E%A5%0A%20%20%20%20let%20mut%20a%20%3D%20Box%3A%3Anew(Node%20%7B%20val%3A%201%2C%20prev%3A%20std%3A%3Aptr%3A%3Anull_mut()%2C%20next%3A%20std%3A%3Aptr%3A%3Anull_mut()%20%7D)%3B%0A%20%20%20%20let%20mut%20b%20%3D%20Box%3A%3Anew(Node%20%7B%20val%3A%202%2C%20prev%3A%20std%3A%3Aptr%3A%3Anull_mut()%2C%20next%3A%20std%3A%3Aptr%3A%3Anull_mut()%20%7D)%3B%0A%0A%20%20%20%20%2F%2F%20%E7%94%A8%E8%A3%B8%E6%8C%87%E9%92%88%E5%BB%BA%E7%AB%8B%E5%8F%8C%E5%90%91%E8%BF%9E%E6%8E%A5%0A%20%20%20%20a.next%20%3D%20%26mut%20*b%20as%20*mut%20Node%3B%0A%20%20%20%20b.prev%20%3D%20%26mut%20*a%20as%20*mut%20Node%3B%0A%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20println!(%22a.next.val%20%3D%20%7B%7D%22%2C%20(*a.next).val)%3B%20%2F%2F%202%0A%20%20%20%20%20%20%20%20println!(%22b.prev.val%20%3D%20%7B%7D%22%2C%20(*b.prev).val)%3B%20%2F%2F%201%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">// 用引用实现双向链表几乎不可能——前后节点互相持有对方的引用，
// 生命周期无法描述。用裸指针则直接：
struct Node {
    val: i32,
    prev: *mut Node,  // 指向前一个节点，可为 null
    next: *mut Node,  // 指向后一个节点，可为 null
}

fn main() {
    // 演示：创建两个节点并连接
    let mut a = Box::new(Node { val: 1, prev: std::ptr::null_mut(), next: std::ptr::null_mut() });
    let mut b = Box::new(Node { val: 2, prev: std::ptr::null_mut(), next: std::ptr::null_mut() });

    // 用裸指针建立双向连接
    a.next = &amp;mut *b as *mut Node;
    b.prev = &amp;mut *a as *mut Node;

    unsafe {
        println!("a.next.val = {}", (*a.next).val); // 2
        println!("b.prev.val = {}", (*b.prev).val); // 1
    }
}</code></pre></div>
<h3 id="场景三同时可变借用同一数据的不重叠部分">场景三：同时可变借用同一数据的不重叠部分</h3>
<p>借用检查器是保守的：即使两个 <code>&amp;mut</code> 指向同一切片的不同位置，它也会拒绝。标准库的 <code>split_at_mut</code> 就是通过裸指针实现的，它证明了”我知道这两段不会重叠”：</p>
<div class="code-runner" data-full-code="fn%20split_at_mut_impl(slice%3A%20%26mut%20%5Bi32%5D%2C%20mid%3A%20usize)%20-%3E%20(%26mut%20%5Bi32%5D%2C%20%26mut%20%5Bi32%5D)%20%7B%0A%20%20%20%20let%20len%20%3D%20slice.len()%3B%0A%20%20%20%20let%20ptr%20%3D%20slice.as_mut_ptr()%3B%0A%0A%20%20%20%20assert!(mid%20%3C%3D%20len)%3B%0A%0A%20%20%20%20%2F%2F%20%E5%AE%89%E5%85%A8%20Rust%20%E6%97%A0%E6%B3%95%E8%A1%A8%E8%BE%BE%E8%BF%99%E4%B8%AA%E6%93%8D%E4%BD%9C%E2%80%94%E2%80%94%E4%B8%A4%E4%B8%AA%20%26mut%20%E6%9D%A5%E8%87%AA%E5%90%8C%E4%B8%80%20slice%EF%BC%9A%0A%20%20%20%20%2F%2F%20(%26mut%20slice%5B..mid%5D%2C%20%26mut%20slice%5Bmid..%5D)%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%81%0A%0A%20%20%20%20%2F%2F%20%E8%A3%B8%E6%8C%87%E9%92%88%E5%8F%AF%E4%BB%A5%EF%BC%9A%E6%88%91%E4%BB%AC%E7%9F%A5%E9%81%93%20%5B0%2C%20mid)%20%E5%92%8C%20%5Bmid%2C%20len)%20%E4%B8%8D%E9%87%8D%E5%8F%A0%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20(%0A%20%20%20%20%20%20%20%20%20%20%20%20std%3A%3Aslice%3A%3Afrom_raw_parts_mut(ptr%2C%20mid)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20std%3A%3Aslice%3A%3Afrom_raw_parts_mut(ptr.add(mid)%2C%20len%20-%20mid)%2C%0A%20%20%20%20%20%20%20%20)%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20v%20%3D%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20let%20(left%2C%20right)%20%3D%20split_at_mut_impl(%26mut%20v%2C%203)%3B%0A%20%20%20%20left%5B0%5D%20%3D%2010%3B%0A%20%20%20%20right%5B0%5D%20%3D%2040%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20v)%3B%20%2F%2F%20%5B10%2C%202%2C%203%2C%2040%2C%205%5D%0A%7D" data-mode="run"><pre><code class="language-rust">fn split_at_mut_impl(slice: &amp;mut [i32], mid: usize) -&gt; (&amp;mut [i32], &amp;mut [i32]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    assert!(mid &lt;= len);

    // 安全 Rust 无法表达这个操作——两个 &amp;mut 来自同一 slice：
    // (&amp;mut slice[..mid], &amp;mut slice[mid..]) // 编译错误！

    // 裸指针可以：我们知道 [0, mid) 和 [mid, len) 不重叠
    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut v = [1, 2, 3, 4, 5];
    let (left, right) = split_at_mut_impl(&amp;mut v, 3);
    left[0] = 10;
    right[0] = 40;
    println!("{:?}", v); // [10, 2, 3, 40, 5]
}</code></pre></div>
<h3 id="场景四可空指针nullable-pointer">场景四：可空指针（nullable pointer）</h3>
<p>C 的 API 常用 <code>NULL</code> 表示”无值”。Rust 的引用永远非空，<code>Option&lt;&amp;T&gt;</code> 虽然可以表达这个语义，但在 FFI 边界上有时必须用真正的裸指针，因为 C 不认识 <code>Option</code>：</p>
<div class="code-runner" data-full-code="%2F%2F%2F%20%E4%BB%8E%E5%8F%AF%E7%A9%BA%E7%9A%84%20C%20%E5%AD%97%E7%AC%A6%E4%B8%B2%E6%8C%87%E9%92%88%E8%AF%BB%E5%8F%96%E5%86%85%E5%AE%B9%EF%BC%8Cnull%20%E6%97%B6%E8%BF%94%E5%9B%9E%E9%BB%98%E8%AE%A4%E5%80%BC%0Aunsafe%20fn%20read_or_default(ptr%3A%20*const%20i32%2C%20default%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20if%20ptr.is_null()%20%7B%0A%20%20%20%20%20%20%20%20default%0A%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20*ptr%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%2042i32%3B%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20read_or_default(%26x%2C%200))%3B%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%2042%0A%20%20%20%20%20%20%20%20println!(%22%7B%7D%22%2C%20read_or_default(std%3A%3Aptr%3A%3Anull()%2C%200))%3B%20%20%20%20%20%20%2F%2F%200%EF%BC%88null%20%E8%BF%94%E5%9B%9E%E9%BB%98%E8%AE%A4%E5%80%BC%EF%BC%89%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">/// 从可空的 C 字符串指针读取内容，null 时返回默认值
unsafe fn read_or_default(ptr: *const i32, default: i32) -&gt; i32 {
    if ptr.is_null() {
        default
    } else {
        *ptr
    }
}

fn main() {
    let x = 42i32;
    unsafe {
        println!("{}", read_or_default(&amp;x, 0));                    // 42
        println!("{}", read_or_default(std::ptr::null(), 0));      // 0（null 返回默认值）
    }
}</code></pre></div>
<h1 id="使用裸指针">使用裸指针</h1>
<h2 id="创建裸指针">创建裸指针</h2>
<p><strong>创建裸指针不需要 <code>unsafe</code></strong>——创建本身只是记录一个内存地址，没有任何危险操作：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%2042i32%3B%0A%20%20%20%20let%20mut%20y%20%3D%20100i32%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BB%8E%E5%BC%95%E7%94%A8%E8%BD%AC%E6%8D%A2%EF%BC%9A%E6%9C%80%E5%B8%B8%E8%A7%81%E3%80%81%E6%9C%80%E5%AE%89%E5%85%A8%E7%9A%84%E6%96%B9%E5%BC%8F%0A%20%20%20%20let%20p_const%3A%20*const%20i32%20%3D%20%26x%20as%20*const%20i32%3B%0A%20%20%20%20let%20p_mut%3A%20%20%20*mut%20i32%20%20%20%3D%20%26mut%20y%20as%20*mut%20i32%3B%0A%0A%20%20%20%20%2F%2F%20%E4%B9%9F%E5%8F%AF%E4%BB%A5%E7%94%A8%20std%3A%3Aptr%3A%3Aaddr_of!%20%E5%AE%8F%EF%BC%88%E4%B8%8D%E9%9C%80%E8%A6%81%E5%88%9B%E5%BB%BA%E5%BC%95%E7%94%A8%EF%BC%89%0A%20%20%20%20let%20p2%20%3D%20std%3A%3Aptr%3A%3Aaddr_of!(x)%3B%0A%0A%20%20%20%20println!(%22p_const%20%E5%9C%B0%E5%9D%80%3A%20%7B%3A%3F%7D%22%2C%20p_const)%3B%0A%20%20%20%20println!(%22p_mut%20%20%20%E5%9C%B0%E5%9D%80%3A%20%7B%3A%3F%7D%22%2C%20p_mut)%3B%0A%20%20%20%20println!(%22%E4%B8%A4%E8%80%85%E7%9B%B8%E7%AD%89%EF%BC%88%E9%83%BD%E6%8C%87%E5%90%91%E5%90%8C%E7%B1%BB%E5%9E%8B%EF%BC%89%3A%20%7B%7D%22%2C%20std%3A%3Amem%3A%3Asize_of_val(%26p_const)%20%3D%3D%20std%3A%3Amem%3A%3Asize_of_val(%26p_mut))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 42i32;
    let mut y = 100i32;

    // 从引用转换：最常见、最安全的方式
    let p_const: *const i32 = &amp;x as *const i32;
    let p_mut:   *mut i32   = &amp;mut y as *mut i32;

    // 也可以用 std::ptr::addr_of! 宏（不需要创建引用）
    let p2 = std::ptr::addr_of!(x);

    println!("p_const 地址: {:?}", p_const);
    println!("p_mut   地址: {:?}", p_mut);
    println!("两者相等（都指向同类型）: {}", std::mem::size_of_val(&amp;p_const) == std::mem::size_of_val(&amp;p_mut));
}</code></pre></div>
<h2 id="解引用裸指针">解引用裸指针</h2>
<p>解引用需要 <code>unsafe</code>，因为编译器无法保证指针有效：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%2042i32%3B%0A%20%20%20%20let%20p%3A%20*const%20i32%20%3D%20%26x%3B%0A%0A%20%20%20%20%2F%2F%20%E5%AE%89%E5%85%A8%EF%BC%9A%E4%BB%8E%E6%9C%89%E6%95%88%E5%BC%95%E7%94%A8%E5%88%9B%E5%BB%BA%E7%9A%84%E6%8C%87%E9%92%88%EF%BC%8C%E5%9C%A8%20x%20%E7%9A%84%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E5%86%85%E8%A7%A3%E5%BC%95%E7%94%A8%E6%98%AF%E5%AE%89%E5%85%A8%E7%9A%84%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20println!(%22x%20%3D%20%7B%7D%22%2C%20*p)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20let%20mut%20y%20%3D%200i32%3B%0A%20%20%20%20let%20pm%3A%20*mut%20i32%20%3D%20%26mut%20y%3B%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20*pm%20%3D%2099%3B%20%2F%2F%20%E9%80%9A%E8%BF%87%E5%8F%AF%E5%8F%98%E8%A3%B8%E6%8C%87%E9%92%88%E5%86%99%E5%85%A5%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22y%20%3D%20%7B%7D%22%2C%20y)%3B%20%2F%2F%2099%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let x = 42i32;
    let p: *const i32 = &amp;x;

    // 安全：从有效引用创建的指针，在 x 的生命周期内解引用是安全的
    unsafe {
        println!("x = {}", *p);
    }

    let mut y = 0i32;
    let pm: *mut i32 = &amp;mut y;
    unsafe {
        *pm = 99; // 通过可变裸指针写入
    }
    println!("y = {}", y); // 99
}</code></pre></div>
<h2 id="null-指针">null 指针</h2>
<p>Rust 的裸指针可以是 null。<code>std::ptr::null()</code> 和 <code>std::ptr::null_mut()</code> 创建 null 指针：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20p%3A%20*const%20i32%20%3D%20std%3A%3Aptr%3A%3Anull()%3B%0A%0A%20%20%20%20println!(%22is_null%3A%20%7B%7D%22%2C%20p.is_null())%3B%20%2F%2F%20true%0A%0A%20%20%20%20%2F%2F%20%E8%A7%A3%E5%BC%95%E7%94%A8%20null%20%E6%8C%87%E9%92%88%E6%98%AF%E6%9C%AA%E5%AE%9A%E4%B9%89%E8%A1%8C%E4%B8%BA%E2%80%94%E2%80%94%E7%A8%8B%E5%BA%8F%E4%BC%9A%E5%B4%A9%E6%BA%83%E6%88%96%E4%BA%A7%E7%94%9F%E9%94%99%E8%AF%AF%E7%BB%93%E6%9E%9C%0A%20%20%20%20%2F%2F%20unsafe%20%7B%20println!(%22%7B%7D%22%2C%20*p)%3B%20%7D%20%2F%2F%20%E5%8D%83%E4%B8%87%E4%B8%8D%E8%A6%81%E8%BF%99%E6%A0%B7%E5%81%9A%EF%BC%81%0A%0A%20%20%20%20%2F%2F%20%E4%BD%BF%E7%94%A8%E5%89%8D%E5%BF%85%E9%A1%BB%E6%A3%80%E6%9F%A5%0A%20%20%20%20if%20!p.is_null()%20%7B%0A%20%20%20%20%20%20%20%20unsafe%20%7B%20println!(%22%7B%7D%22%2C%20*p)%3B%20%7D%0A%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%8C%87%E9%92%88%E4%B8%BA%20null%EF%BC%8C%E8%B7%B3%E8%BF%87%E8%A7%A3%E5%BC%95%E7%94%A8%22)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let p: *const i32 = std::ptr::null();

    println!("is_null: {}", p.is_null()); // true

    // 解引用 null 指针是未定义行为——程序会崩溃或产生错误结果
    // unsafe { println!("{}", *p); } // 千万不要这样做！

    // 使用前必须检查
    if !p.is_null() {
        unsafe { println!("{}", *p); }
    } else {
        println!("指针为 null，跳过解引用");
    }
}</code></pre></div>
<h1 id="指针算术与高级用法">指针算术与高级用法</h1>
<h2 id="指针偏移">指针偏移</h2>
<p>裸指针支持算术运算，用于遍历内存中连续排列的数据（如数组）：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20arr%20%3D%20%5B10i32%2C%2020%2C%2030%2C%2040%2C%2050%5D%3B%0A%20%20%20%20let%20base%3A%20*const%20i32%20%3D%20arr.as_ptr()%3B%20%2F%2F%20%E6%8C%87%E5%90%91%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%85%83%E7%B4%A0%0A%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20offset(n)%20%E5%90%91%E5%90%8E%E7%A7%BB%E5%8A%A8%20n%20%E4%B8%AA%E5%85%83%E7%B4%A0%EF%BC%88%E4%BB%A5%20T%20%E7%9A%84%E5%A4%A7%E5%B0%8F%E4%B8%BA%E5%8D%95%E4%BD%8D%EF%BC%89%0A%20%20%20%20%20%20%20%20println!(%22arr%5B0%5D%20%3D%20%7B%7D%22%2C%20*base)%3B%0A%20%20%20%20%20%20%20%20println!(%22arr%5B1%5D%20%3D%20%7B%7D%22%2C%20*base.offset(1))%3B%0A%20%20%20%20%20%20%20%20println!(%22arr%5B2%5D%20%3D%20%7B%7D%22%2C%20*base.add(2))%3B%20%2F%2F%20add%20%E6%98%AF%20offset%20%E7%9A%84%E5%AE%89%E5%85%A8%E5%88%AB%E5%90%8D%EF%BC%88%E4%B8%8D%E5%85%81%E8%AE%B8%E8%B4%9F%E5%81%8F%E7%A7%BB%EF%BC%89%0A%20%20%20%20%20%20%20%20println!(%22arr%5B4%5D%20%3D%20%7B%7D%22%2C%20*base.add(4))%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let arr = [10i32, 20, 30, 40, 50];
    let base: *const i32 = arr.as_ptr(); // 指向第一个元素

    unsafe {
        // offset(n) 向后移动 n 个元素（以 T 的大小为单位）
        println!("arr[0] = {}", *base);
        println!("arr[1] = {}", *base.offset(1));
        println!("arr[2] = {}", *base.add(2)); // add 是 offset 的安全别名（不允许负偏移）
        println!("arr[4] = {}", *base.add(4));
    }
}</code></pre></div>
<blockquote>
<p><code>add(n)</code> 等价于 <code>offset(n as isize)</code>，但语义上只允许正方向偏移，代码更清晰。<strong>越过数组边界的偏移是未定义行为</strong>，不会有编译错误，但运行时可能崩溃或产生错误数据。</p>
</blockquote>
<h2 id="同时持有多个可变指针">同时持有多个可变指针</h2>
<p>裸指针绕过了借用规则，可以同时持有多个可变指针——这是双向链表、自引用结构等实现的基础，但也是最容易出错的地方：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20data%20%3D%20%5B1i32%2C%202%2C%203%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E5%9C%A8%E5%AE%89%E5%85%A8%20Rust%20%E9%87%8C%EF%BC%8C%E4%B8%8D%E8%83%BD%E5%90%8C%E6%97%B6%E6%8C%81%E6%9C%89%E4%B8%A4%E4%B8%AA%20%26mut%0A%20%20%20%20%2F%2F%20%E4%BD%86%E8%A3%B8%E6%8C%87%E9%92%88%E5%8F%AF%E4%BB%A5%0A%20%20%20%20let%20p0%3A%20*mut%20i32%20%3D%20%26mut%20data%5B0%5D%3B%0A%20%20%20%20let%20p2%3A%20*mut%20i32%20%3D%20%26mut%20data%5B2%5D%3B%0A%0A%20%20%20%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20*p0%20%3D%20100%3B%0A%20%20%20%20%20%20%20%20*p2%20%3D%20300%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20data)%3B%20%2F%2F%20%5B100%2C%202%2C%20300%5D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let mut data = [1i32, 2, 3];

    // 在安全 Rust 里，不能同时持有两个 &amp;mut
    // 但裸指针可以
    let p0: *mut i32 = &amp;mut data[0];
    let p2: *mut i32 = &amp;mut data[2];

    unsafe {
        *p0 = 100;
        *p2 = 300;
    }

    println!("{:?}", data); // [100, 2, 300]
}</code></pre></div>
<h2 id="裸指针与切片">裸指针与切片</h2>
<p>从裸指针重建切片引用，是手动分配内存后访问数据的标准模式：</p>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20v%3A%20Vec%3Ci32%3E%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%0A%20%20%20%20%2F%2F%20%E8%8E%B7%E5%8F%96%E5%BA%95%E5%B1%82%E8%A3%B8%E6%8C%87%E9%92%88%E5%92%8C%E9%95%BF%E5%BA%A6%0A%20%20%20%20let%20ptr%3A%20*const%20i32%20%3D%20v.as_ptr()%3B%0A%20%20%20%20let%20len%20%3D%20v.len()%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BB%8E%E8%A3%B8%E6%8C%87%E9%92%88%20%2B%20%E9%95%BF%E5%BA%A6%E9%87%8D%E5%BB%BA%E5%88%87%E7%89%87%0A%20%20%20%20let%20slice%3A%20%26%5Bi32%5D%20%3D%20unsafe%20%7B%0A%20%20%20%20%20%20%20%20std%3A%3Aslice%3A%3Afrom_raw_parts(ptr%2C%20len)%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20slice)%3B%20%2F%2F%20%5B1%2C%202%2C%203%2C%204%2C%205%5D%0A%0A%20%20%20%20%2F%2F%20%E6%B3%A8%EF%BC%9A%E6%AD%A4%E6%97%B6%20v%20%E5%92%8C%20slice%20%E9%83%BD%E6%8C%87%E5%90%91%E5%90%8C%E4%B8%80%E5%9D%97%E5%86%85%E5%AD%98%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E8%A6%81%20v%20%E6%9C%AA%E8%A2%AB%E4%BF%AE%E6%94%B9%E6%88%96%E9%87%8A%E6%94%BE%EF%BC%8Cslice%20%E5%B0%B1%E6%98%AF%E6%9C%89%E6%95%88%E7%9A%84%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let v: Vec&lt;i32&gt; = vec![1, 2, 3, 4, 5];

    // 获取底层裸指针和长度
    let ptr: *const i32 = v.as_ptr();
    let len = v.len();

    // 从裸指针 + 长度重建切片
    let slice: &amp;[i32] = unsafe {
        std::slice::from_raw_parts(ptr, len)
    };

    println!("{:?}", slice); // [1, 2, 3, 4, 5]

    // 注：此时 v 和 slice 都指向同一块内存
    // 只要 v 未被修改或释放，slice 就是有效的
}</code></pre></div>
<h1 id="练习题">练习题</h1>
<h2 id="裸指针基础测验">裸指针基础测验</h2>
</div>
<pre><code class="language-rust">let x = 5i32;
let p: *const i32 = &amp;x;
let q: *const i32 = &amp;x;</code></pre>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>用裸指针实现一个 <code>sum_slice</code> 函数，通过指针算术遍历 <code>i32</code> 数组，返回所有元素的和：</p>
<div class="code-editor" data-block-id="18-unsafe/02-raw-pointers#3:4" data-expect-mode="literal" data-expect-pattern="31" data-starter-code="unsafe%20fn%20sum_slice(ptr%3A%20*const%20i32%2C%20len%3A%20usize)%20-%3E%20i32%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E4%BB%8E%20ptr%20%E5%BC%80%E5%A7%8B%EF%BC%8C%E7%94%A8%20add(i)%20%E9%80%90%E4%B8%AA%E8%AF%BB%E5%8F%96%E5%85%83%E7%B4%A0%EF%BC%8C%E7%B4%AF%E5%8A%A0%E5%90%8E%E8%BF%94%E5%9B%9E%0A%20%20%20%20todo!()%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20arr%20%3D%20%5B3%2C%201%2C%204%2C%201%2C%205%2C%209%2C%202%2C%206%5D%3B%0A%20%20%20%20let%20result%20%3D%20unsafe%20%7B%20sum_slice(arr.as_ptr()%2C%20arr.len())%20%7D%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20result)%3B%0A%7D"><pre><code class="language-rust">unsafe fn sum_slice(ptr: *const i32, len: usize) -&gt; i32 {
    // TODO: 从 ptr 开始，用 add(i) 逐个读取元素，累加后返回
    todo!()
}

fn main() {
    let arr = [3, 1, 4, 1, 5, 9, 2, 6];
    let result = unsafe { sum_slice(arr.as_ptr(), arr.len()) };
    println!("{}", result);
}</code></pre></div> 