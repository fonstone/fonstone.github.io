---
title: "高级主题"
description: "Unsafe Rust、FFI 与 C 互操作、嵌入式 Rust 基础、过程宏"
date: "2026-07-12"
order: 12
tags: ["Unsafe", "FFI", "嵌入式", "过程宏"]
est_time: "60 分钟"
---

Rust 的安全保证来自编译器——但有时候你写的代码确实是安全的，编译器却无法证明。`unsafe` 关键字是对编译器说：“这里我比你更了解情况，放行。”

**重要：**`unsafe`** 不会关闭借用检查器**，它只解锁了五种额外操作：解引用裸指针、调用 unsafe 函数、访问可变静态变量、实现 unsafe trait、访问 union 字段。安全责任由此从编译器转移到你。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| unsafe 块的真实含义，五大超能力逐一讲解 |                 |
| *const T        | 与               | *mut T          | 的创建、解引用与指针算术    |
| unsafe fn       | 的设计规范、          | # Safety        | 文档约定，           | Send            | /               | Sync            | 手动实现            |
| 用 unsafe 实现 + safe 接口封装，最小化 unsafe 范围 |                 |
# 为什么需要 unsafe

Rust 的安全保证来自编译器——借用检查器、类型系统、生命周期检查，它们在编译期拦截了绝大多数内存错误。但这套系统并非万能：有时候你写的代码**确实是安全的**，编译器却因为信息不足而无法证明。

典型场景：

- 调用 C 语言函数——编译器不了解 C 的内存契约
- 直接操作硬件寄存器——访问地址由硬件手册决定，而非 Rust 类型系统
- 实现 `Vec`、`Arc` 这样的底层数据结构——需要手动管理内存布局

为了支持这些场景，Rust 提供了 `unsafe` 关键字，让你对编译器说：“这里我比你更了解情况，放行。“

## unsafe 块做了什么（和你以为的不一样）

**常见误解**：`unsafe {}` 会关闭借用检查器。

**实际上**：`unsafe` 块**不会**禁用任何安全检查。借用规则、生命周期、类型检查在 `unsafe` 块里一样全力运行。`unsafe` 只是**解锁了五种额外操作**，在普通代码里这五种操作是被禁止的。

```
fn main() {
    let mut x = 5;

    unsafe {
        // 在 unsafe 块里，借用检查器仍然工作
        let r1 = &x;
        let r2 = &x;
        println!("{} {}", r1, r2); // 正常：两个不可变借用

        // 下面这行在 unsafe 里也会编译失败：
        // let r3 = &mut x; // 错误：不可变借用仍然活跃
        let _ = r1;
    }

    // unsafe 块唯一做的事：允许解引用裸指针
    let raw = &mut x as *mut i32;
    unsafe {
        *raw += 1; // 只有这步需要 unsafe
    }
    println!("x = {}", x); // 6
}
```

> 关键心智模型：unsafe 是你对编译器做出的承诺——“我检查过了，这里的内存操作是安全的”。责任从编译器转移到了你。


## 五大 unsafe 超能力

只有以下五种操作需要 `unsafe` 块或 `unsafe` 标注，其他的什么都不需要：

| 操作              | 为何危险            |
| --------------- | --------------- |
| 解引用裸指针          | *const T        | /               | *mut T          | 指针可能为空、已释放或未对齐  |
| 调用              | unsafe          | 函数或方法           | 函数要求调用者满足特定前提条件 |
| 读写可变静态变量        | static mut      | 多线程下存在数据竞争风险    |
| 实现              | unsafe trait    | trait 要求实现者保证某些编译器无法验证的契约 |
| 访问              | union           | 的字段             | union 的内存解释完全由你负责 |

# 五大超能力详解

## 超能力一：解引用裸指针

**为什么编译器不允许？**

Rust 的引用（`&T` / `&mut T`）有严格的编译期保证：总是有效、非 null、已对齐、有正确的生命周期。裸指针（`*const T` / `*mut T`）没有任何这些保证——它可能是 null、指向已释放的内存、指向未初始化的数据，或者根本没有对齐。编译器无法检查，所以默认禁止。

**什么时候真正需要它？**

- 调用 C 函数：C 的 API 返回裸指针，你必须解引用才能读数据
- 构建双向链表、自引用结构——这些结构用安全引用无法表达
- 在手动分配的内存上读写数据（如实现自己的 `Vec` 或内存池）

**你需要保证什么：** 解引用时，指针非 null、指向已初始化的有效内存、内存对齐满足 `T` 的要求、且指向的数据在整个使用期间不会被释放。

```
fn main() {
    let x = 42i32;

    // 创建裸指针不需要 unsafe——只是记录了一个地址
    let ptr: *const i32 = &x as *const i32;

    // 解引用需要 unsafe，因为编译器无法保证 ptr 有效
    // 但我们知道它有效：ptr 来自合法引用，x 还活着
    unsafe {
        println!("通过裸指针读取: {}", *ptr);
    }

    // 演示危险：null 指针解引用 = 程序崩溃
    let null_ptr: *const i32 = std::ptr::null();
    println!("null 指针是否为 null: {}", null_ptr.is_null());
    // unsafe { println!("{}", *null_ptr); } // 千万别这样做，直接 crash
}
```

> 一句话记忆：创建裸指针安全，解引用裸指针危险。


## 超能力二：调用 unsafe 函数

**为什么编译器不允许？**

有些函数的正确性依赖于调用者必须满足的前提条件，但这些条件无法用类型系统表达，编译器检查不了。例如：

- `std::str::from_utf8_unchecked(bytes)` — 要求字节序列是合法的 UTF-8，否则字符串乱码或 panic
- `Vec::set_len(new_len)` — 要求 `new_len` 不超过容量且新范围内的元素已初始化，否则访问未初始化内存
- `slice::get_unchecked(idx)` — 要求 `idx` 在范围内，否则越界读

这类函数把安全责任明确转移给调用者，用 `unsafe fn` 标注是一种警告：**“调用我之前，你必须自己检查。”**

**什么时候真正需要它？**

- 性能敏感路径，已经在外部验证了条件，不想再做重复的边界检查
- FFI：所有 `extern "C"` 函数都是隐式 `unsafe fn`
- 标准库底层实现内部

**你需要保证什么：** 该函数的 `# Safety` 文档里写了什么，你就保证什么。没有 `# Safety` 文档的 `unsafe fn` 是写得不够好的代码。

```
fn main() {
    let bytes = vec![104u8, 101, 108, 108, 111]; // "hello" 的 UTF-8

    // 安全版本：会验证 UTF-8，返回 Result
    let s_safe = std::str::from_utf8(&bytes).unwrap();
    println!("安全版本: {}", s_safe);

    // 不安全版本：跳过验证，直接转换
    // 我们保证了 bytes 确实是合法的 UTF-8
    let s_fast = unsafe { std::str::from_utf8_unchecked(&bytes) };
    println!("不安全版本: {}", s_fast);

    // 如果传入非法 UTF-8，from_utf8_unchecked 会产生未定义行为
    // 这正是它需要 unsafe 的原因
}
```

> 注意：所有通过 extern "C" 声明的 C 函数都属于这一类——Rust 编译器看不到 C 的实现，无法验证安全性，所以调用 C 函数也需要 unsafe 块。


## 超能力三：读写可变静态变量

**为什么编译器不允许？**

不可变静态变量（`static FOO: i32 = 0`）是安全的，因为只读不存在竞争。可变静态变量（`static mut`）是全局共享的可变状态——如果两个线程同时读写同一个全局变量，就会产生**数据竞争**（data race），这是未定义行为。

编译器无法知道你的程序在哪里会产生多线程访问，所以对所有 `static mut` 的读写都要求 `unsafe`，把”我保证不会有并发访问”这个责任交给你。

**什么时候真正需要它？**

- 嵌入式系统：中断处理程序和主循环共享的硬件寄存器状态
- 单线程小程序里的简单全局计数器
- 与 C 代码共享全局变量（C 常用全局状态）

**你需要保证什么：** 要么程序是单线程的；要么对这个变量的所有访问都通过互斥锁（`Mutex`）或原子操作保护。

> 既然有 Mutex，为何不直接用 static Mutex<T> 代替 static mut？

> 对于普通应用代码，这完全可以，也是推荐做法——static Mutex<T> 不需要 unsafe，且天然线程安全。但 static mut 在某些场景下不可替代：

> - 嵌入式 / no_std 环境：没有操作系统，标准库的 Mutex 依赖 OS 的阻塞原语，根本无法使用
> - FFI / 与 C 交互：C 代码不认识 Rust 的 Mutex，共享全局状态只能用裸变量
> - 极致性能路径：已在外部保证了单线程访问，不想引入任何加锁开销

> 所以 static mut 主要留给系统级、嵌入式和 FFI 场景；普通代码尽量用 static Mutex<T> 或 static AtomicXxx。


```
static mut REQUEST_COUNT: u64 = 0;

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
}
```

> 生产代码的替代方案：用 std::sync::atomic::AtomicU64 代替 static mut u64，用 Mutex<T> 代替 static mut T。它们的读写不需要 unsafe，且天然线程安全。


## 超能力四：实现 unsafe trait

**什么是 unsafe trait？**

普通的 trait 只是一组方法签名，编译器可以验证你的实现类型是否匹配。但有些 trait 还附带一条**编译器无法验证的安全承诺**——这样的 trait 就标注为 `unsafe trait`，实现它时必须写 `unsafe impl`，意思是：“我承诺满足了那条隐性规则。”

用一个具体例子来建立直觉。先想想这个问题：如果你要把一块内存里的所有字节都设为 `0`，然后把它当作某个类型的值来用，这安全吗？

答案是：**看类型**。

- `u32`：4 个字节全零 = 数字 `0`，完全合法
- `bool`：只允许 `0`（false）或 `1`（true），全零是 `0`，合法
- `&str`：是一个指针，全零 = null 指针，**Rust 的引用不允许为 null，立刻未定义行为**

编译器知道每种类型占多少字节，但它**不知道哪些字节模式对这个类型是合法值**——这是语义层面的规则，只有程序员才清楚。

这就是 `unsafe trait` 的用武之地：让程序员用 `unsafe impl` 向编译器做出承诺：

```
// 定义一个 unsafe trait，附带一条承诺：
// "实现了这个 trait 的类型，全零字节是合法值"
unsafe trait Zeroable {}

// u32 全零就是数字 0，合法，我们承诺
unsafe impl Zeroable for u32 {}

// bool 全零就是 false，也合法
unsafe impl Zeroable for bool {}

// &str 我们不实现 —— null 引用是未定义行为，不能承诺

// 有了 Zeroable 约束，这个函数才敢调用 mem::zeroed
fn zeroed<T: Zeroable>() -> T {
    unsafe { std::mem::zeroed() }
}

fn main() {
    let n: u32 = zeroed();
    let b: bool = zeroed();
    println!("u32: {}", n);   // 0
    println!("bool: {}", b);  // false
}
```

**整个过程的逻辑链：**

- `std::mem::zeroed::<T>()` 把 T 的内存全部清零并返回——这是 `unsafe fn`，因为编译器不知道全零对 T 是否合法
- 我们定义 `Zeroable` trait，语义是”全零合法”的承诺
- `zeroed<T: Zeroable>` 函数里，因为 T 被约束为 `Zeroable`，我们知道全零一定合法，所以可以安心调用 `mem::zeroed`
- 调用者只能对 `u32`、`bool` 这些我们手动 `unsafe impl` 过的类型使用 `zeroed()`——如果尝试 `zeroed::<&str>()`，编译器会直接报错

> 写下 unsafe impl 不会让类型自动变安全——编译器只是信任了你的承诺。如果承诺是错的（比如为 &str 实现 Zeroable），程序照样崩溃，编译器不会再阻拦你。


## 超能力五：访问 union 字段

**为什么编译器不允许？**

`union` 的所有字段共享同一块内存。当你写入 `u.i = 42`，之后读 `u.f`，得到的是把 `42i32` 的内存字节解释为 `f32` 的结果——这可能是一个无意义的浮点数，也可能引发更严重的问题（如把整数当指针解引用）。编译器不会跟踪”当前这个 union 里存的是哪个类型”，所以读取任何字段都需要你承诺”我知道现在存的是这个类型”。

**什么时候真正需要它？**

- FFI：C 语言大量使用 union（如 `sockaddr` 网络地址结构、`ioctl` 参数）
- 位操作技巧：把 `f32` 的内存位直接当 `u32` 读（fast inverse square root 算法就用了这个）
- 手动实现带标签的 union（不过 Rust 的 `enum` 在大多数场合更好）

**你需要保证什么：** 读取某个字段时，union 中存储的确实是该字段的有效值，且该值满足该类型的有效性约束（如引用类型的字段不能是无效地址）。

```
union FloatBits {
    f: f32,
    bits: u32,
}

fn float_to_bits(val: f32) -> u32 {
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
}
```

> 与 enum 的对比：Rust 的 enum 是”有标签的 union”——编译器自动跟踪当前存的是哪个变体，读取时通过 match 确保类型正确。没有特殊需求（FFI、位操作）时，优先用 enum 而非 union。


# 练习题

## unsafe 基础测验

```
static mut TOTAL: i32 = 0;

fn add(n: i32) {
    TOTAL += n;
}
```

## 编程练习

下面的代码尝试通过裸指针交换两个变量的值，但缺少必要的 `unsafe` 标注，请修复它：

```
fn swap_via_ptr(a: &mut i32, b: &mut i32) {
    let pa: *mut i32 = a as *mut i32;
    let pb: *mut i32 = b as *mut i32;
    let tmp = *pa;   // 需要 unsafe
    *pa = *pb;       // 需要 unsafe
    *pb = tmp;       // 需要 unsafe
}

fn main() {
    let mut x = 10;
    let mut y = 20;
    swap_via_ptr(&mut x, &mut y);
    println!("x={}, y={}", x, y);
}
```
# 裸指针基础

裸指针（raw pointer）是 Rust 中最接近 C 指针的东西，它绕过了所有借用规则和生命周期检查。和引用相比，裸指针：

- **不保证有效**：可能为空（null）、已悬垂（dangling）或指向未初始化内存
- **不受借用规则约束**：可以同时存在多个可变裸指针指向同一数据
- **不自动清理**：裸指针不拥有数据，不会触发 `Drop`

Rust 有两种裸指针：

| 类型              | 含义              |
| --------------- | --------------- |
| *const T        | 不可变裸指针，解引用后不能修改目标 |
| *mut T          | 可变裸指针，解引用后可以修改目标 |

> 裸指针类型名里的 * 是类型的一部分，不是解引用运算符。读作”pointer-const T”或”pointer-mut T”。


## 引用解决不了的四类场景

**99% 的情况下，引用（**`&T`** / **`&mut T`**）比裸指针更好**——有生命周期保护，有借用检查，出了问题编译期就报错。但有四类场景引用确实无能为力，必须用裸指针：

### 场景一：与 C 代码互操作

C 语言没有 Rust 的引用概念，C 的 API 全部用指针。调用 C 函数、接收 C 回调、读写 C 结构体，都必须用裸指针：

```
extern "C" {
    // C 标准库的 memcpy，参数全是裸指针
    fn memcpy(dst: *mut u8, src: *const u8, n: usize) -> *mut u8;
}

fn main() {
    let src = [1u8, 2, 3, 4, 5];
    let mut dst = [0u8; 5];
    unsafe {
        memcpy(dst.as_mut_ptr(), src.as_ptr(), src.len());
    }
    println!("{:?}", dst); // [1, 2, 3, 4, 5]
}
```

### 场景二：借用检查器无法表达的数据结构

双向链表、图、自引用结构——这些数据结构里，一个节点同时被多个其他节点”指向”，用引用会产生循环借用，生命周期标注会陷入死局。裸指针绕过了这个限制：

```
// 用引用实现双向链表几乎不可能——前后节点互相持有对方的引用，
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
    a.next = &mut *b as *mut Node;
    b.prev = &mut *a as *mut Node;

    unsafe {
        println!("a.next.val = {}", (*a.next).val); // 2
        println!("b.prev.val = {}", (*b.prev).val); // 1
    }
}
```

### 场景三：同时可变借用同一数据的不重叠部分

借用检查器是保守的：即使两个 `&mut` 指向同一切片的不同位置，它也会拒绝。标准库的 `split_at_mut` 就是通过裸指针实现的，它证明了”我知道这两段不会重叠”：

```
fn split_at_mut_impl(slice: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    assert!(mid <= len);

    // 安全 Rust 无法表达这个操作——两个 &mut 来自同一 slice：
    // (&mut slice[..mid], &mut slice[mid..]) // 编译错误！

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
    let (left, right) = split_at_mut_impl(&mut v, 3);
    left[0] = 10;
    right[0] = 40;
    println!("{:?}", v); // [10, 2, 3, 40, 5]
}
```

### 场景四：可空指针（nullable pointer）

C 的 API 常用 `NULL` 表示”无值”。Rust 的引用永远非空，`Option<&T>` 虽然可以表达这个语义，但在 FFI 边界上有时必须用真正的裸指针，因为 C 不认识 `Option`：

```
/// 从可空的 C 字符串指针读取内容，null 时返回默认值
unsafe fn read_or_default(ptr: *const i32, default: i32) -> i32 {
    if ptr.is_null() {
        default
    } else {
        *ptr
    }
}

fn main() {
    let x = 42i32;
    unsafe {
        println!("{}", read_or_default(&x, 0));                    // 42
        println!("{}", read_or_default(std::ptr::null(), 0));      // 0（null 返回默认值）
    }
}
```

# 使用裸指针

## 创建裸指针

**创建裸指针不需要 **`unsafe`——创建本身只是记录一个内存地址，没有任何危险操作：

```
fn main() {
    let x = 42i32;
    let mut y = 100i32;

    // 从引用转换：最常见、最安全的方式
    let p_const: *const i32 = &x as *const i32;
    let p_mut:   *mut i32   = &mut y as *mut i32;

    // 也可以用 std::ptr::addr_of! 宏（不需要创建引用）
    let p2 = std::ptr::addr_of!(x);

    println!("p_const 地址: {:?}", p_const);
    println!("p_mut   地址: {:?}", p_mut);
    println!("两者相等（都指向同类型）: {}", std::mem::size_of_val(&p_const) == std::mem::size_of_val(&p_mut));
}
```

## 解引用裸指针

解引用需要 `unsafe`，因为编译器无法保证指针有效：

```
fn main() {
    let x = 42i32;
    let p: *const i32 = &x;

    // 安全：从有效引用创建的指针，在 x 的生命周期内解引用是安全的
    unsafe {
        println!("x = {}", *p);
    }

    let mut y = 0i32;
    let pm: *mut i32 = &mut y;
    unsafe {
        *pm = 99; // 通过可变裸指针写入
    }
    println!("y = {}", y); // 99
}
```

## null 指针

Rust 的裸指针可以是 null。`std::ptr::null()` 和 `std::ptr::null_mut()` 创建 null 指针：

```
fn main() {
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
}
```

# 指针算术与高级用法

## 指针偏移

裸指针支持算术运算，用于遍历内存中连续排列的数据（如数组）：

```
fn main() {
    let arr = [10i32, 20, 30, 40, 50];
    let base: *const i32 = arr.as_ptr(); // 指向第一个元素

    unsafe {
        // offset(n) 向后移动 n 个元素（以 T 的大小为单位）
        println!("arr[0] = {}", *base);
        println!("arr[1] = {}", *base.offset(1));
        println!("arr[2] = {}", *base.add(2)); // add 是 offset 的安全别名（不允许负偏移）
        println!("arr[4] = {}", *base.add(4));
    }
}
```

> add(n) 等价于 offset(n as isize)，但语义上只允许正方向偏移，代码更清晰。越过数组边界的偏移是未定义行为，不会有编译错误，但运行时可能崩溃或产生错误数据。


## 同时持有多个可变指针

裸指针绕过了借用规则，可以同时持有多个可变指针——这是双向链表、自引用结构等实现的基础，但也是最容易出错的地方：

```
fn main() {
    let mut data = [1i32, 2, 3];

    // 在安全 Rust 里，不能同时持有两个 &mut
    // 但裸指针可以
    let p0: *mut i32 = &mut data[0];
    let p2: *mut i32 = &mut data[2];

    unsafe {
        *p0 = 100;
        *p2 = 300;
    }

    println!("{:?}", data); // [100, 2, 300]
}
```

## 裸指针与切片

从裸指针重建切片引用，是手动分配内存后访问数据的标准模式：

```
fn main() {
    let v: Vec<i32> = vec![1, 2, 3, 4, 5];

    // 获取底层裸指针和长度
    let ptr: *const i32 = v.as_ptr();
    let len = v.len();

    // 从裸指针 + 长度重建切片
    let slice: &[i32] = unsafe {
        std::slice::from_raw_parts(ptr, len)
    };

    println!("{:?}", slice); // [1, 2, 3, 4, 5]

    // 注：此时 v 和 slice 都指向同一块内存
    // 只要 v 未被修改或释放，slice 就是有效的
}
```


## 裸指针基础测验

```
let x = 5i32;
let p: *const i32 = &x;
let q: *const i32 = &x;
```

## 编程练习

用裸指针实现一个 `sum_slice` 函数，通过指针算术遍历 `i32` 数组，返回所有元素的和：

```
unsafe fn sum_slice(ptr: *const i32, len: usize) -> i32 {
    // TODO: 从 ptr 开始，用 add(i) 逐个读取元素，累加后返回
    todo!()
}

fn main() {
    let arr = [3, 1, 4, 1, 5, 9, 2, 6];
    let result = unsafe { sum_slice(arr.as_ptr(), arr.len()) };
    println!("{}", result);
}
```
# unsafe 函数

## 什么时候需要 unsafe fn

当一个函数有**调用者必须满足但编译器无法验证的前提条件**时，就需要标注 `unsafe fn`。

常见场景：

- 函数接收裸指针，要求调用者保证指针有效且对齐
- 函数操作全局状态，要求单线程调用
- 函数调用了 C 代码，要求参数满足 C 接口的约定

标注 `unsafe fn` 的含义：**这个函数把安全责任转移给调用者**。

## unsafe fn 的基本语法

```
/// # Safety
///
/// - `ptr` 必须指向一个有效的、已初始化的 `i32` 值
/// - `ptr` 必须在整个调用期间保持有效（不能是悬垂指针）
unsafe fn read_unchecked(ptr: *const i32) -> i32 {
    *ptr
}

fn main() {
    let x = 42;
    // 调用 unsafe fn 需要 unsafe 块
    let val = unsafe { read_unchecked(&x as *const i32) };
    println!("{}", val); // 42
}
```

> # Safety 文档节是 Rust 社区的约定：每个 unsafe fn 都应该有一个 # Safety 文档注释，说明调用者需要满足什么条件。这是 unsafe 代码可维护性的关键。


## unsafe fn 内部也需要 unsafe 块

**Rust 2021 和 2024 edition 在这里行为不同：**

- **2021 edition**：`unsafe fn` 的函数体是一个隐式的 unsafe 块，内部的危险操作不需要额外的 `unsafe {}`
- **2024 edition**：即使在 `unsafe fn` 内，每个危险操作也必须显式加 `unsafe {}` 块

2024 edition 的改动是故意的——强迫你精确标出每一个危险点，而不是让整个函数体”默认危险”，更容易做代码审查。本教程使用 2024 edition，所以你会看到 `unsafe fn` 内部仍然有 `unsafe {}` 块：

```
unsafe fn process(ptr: *mut i32, count: usize) {
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
}
```

## 外部函数（extern fn）

通过 `extern "C"` 块声明的外部函数（通常来自 C 库）是隐式 `unsafe` 的——调用它们需要 `unsafe` 块：

```
extern "C" {
    fn abs(x: i32) -> i32;        // C 标准库的 abs 函数
    fn strlen(s: *const u8) -> usize;
}

fn main() {
    let result = unsafe { abs(-42) };
    println!("{}", result); // 42
}
```

为什么外部函数是 unsafe？因为 Rust 编译器对 C 代码一无所知——它无法验证 C 函数的内存安全性，所以要求调用者承担责任。

# unsafe Trait

## 什么是 unsafe trait

`unsafe trait` 表示这个 trait 有**实现者必须手动保证的安全不变量**，编译器无法自动验证。

最重要的两个例子是 `Send` 和 `Sync`：

| Trait           | 含义              | 编译器自动实现的条件      |
| --------------- | --------------- | --------------- |
| Send            | 类型可以安全地移动到另一个线程 | 所有字段都是          | Send            |
| Sync            | 类型可以安全地被多个线程共享引用 | 所有字段都是          | Sync            |

## 手动实现 Send 和 Sync

当你的类型包含裸指针时，编译器会保守地不自动实现 `Send` 和 `Sync`。如果你确认线程安全，需要手动用 `unsafe impl` 声明：

```
use std::sync::atomic::{AtomicI32, Ordering};

// 包含裸指针的类型：编译器不会自动实现 Send/Sync
struct AtomicCounter {
    inner: *mut AtomicI32,
}

// 我们手动保证：通过 AtomicI32 的原子操作，多线程访问是安全的
unsafe impl Send for AtomicCounter {}
unsafe impl Sync for AtomicCounter {}

impl AtomicCounter {
    fn new(val: i32) -> Self {
        let boxed = Box::new(AtomicI32::new(val));
        AtomicCounter { inner: Box::into_raw(boxed) }
    }

    fn increment(&self) {
        unsafe { (*self.inner).fetch_add(1, Ordering::SeqCst); }
    }

    fn get(&self) -> i32 {
        unsafe { (*self.inner).load(Ordering::SeqCst) }
    }
}

impl Drop for AtomicCounter {
    fn drop(&mut self) {
        unsafe { drop(Box::from_raw(self.inner)); }
    }
}

fn main() {
    let counter = AtomicCounter::new(0);
    counter.increment();
    counter.increment();
    println!("{}", counter.get()); // 2
}
```

## 定义自己的 unsafe trait

你也可以定义自己的 `unsafe trait`，用来表达某种合同：

```
/// # Safety
///
/// 实现此 trait 的类型必须保证：
/// 内存布局与 C 中对应类型完全一致（#[repr(C)]）
unsafe trait ReprC: Sized {
    fn as_bytes(&self) -> &[u8] {
        unsafe {
            std::slice::from_raw_parts(
                self as *const Self as *const u8,
                std::mem::size_of::<Self>(),
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
}
```

## 阻止自动实现：!Send 和 !Sync

有时你的类型天生不能跨线程，需要明确**阻止**编译器自动推导 `Send` 或 `Sync`。使用 `PhantomData` 加上 negative impl 是惯用方法：

```
use std::marker::PhantomData;

// PhantomData<*const ()> 是 !Send 的，这会让 MyType 也变成 !Send
struct MyType {
    data: i32,
    _not_send: PhantomData<*const ()>,
}

fn main() {
    let x = MyType { data: 42, _not_send: PhantomData };
    println!("data = {}", x.data);

    // 下面这行会编译失败：MyType 不是 Send，不能跨线程移动
    // std::thread::spawn(move || { let _ = x; });
}
```


## unsafe 函数测验

```
unsafe fn get_first(slice: &[i32]) -> i32 {
    *slice.as_ptr()
}
```

## 编程练习

下面有一个 `unsafe fn`，但缺少 `# Safety` 文档注释，且内部的 unsafe 操作没有用 `unsafe` 块包裹。请修复它：

```
// TODO: 添加 # Safety 文档注释，说明调用者的前提条件
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
}
```
## 出发点

`Vec`、`String`、`Arc` 内部全都用了 unsafe——但你作为使用者从来不需要写 `unsafe` 就能用它们。这不是魔法，而是一种设计模式：**unsafe 实现，safe 接口**。

目标很简单：把 unsafe 的复杂性关在函数内部，让调用方看到的只是普通的安全函数。

## 为什么不能直接暴露 unsafe？

先看一个反例：

```
// 不好的做法：unsafe 泄漏到公共接口，调用者要自己保证一切
pub unsafe fn get_element(ptr: *const i32, idx: usize) -> i32 {
    unsafe { *ptr.add(idx) }
}

// 好的做法：验证放在函数内部，unsafe 不出门
pub fn get_safe(slice: &[i32], idx: usize) -> Option<i32> {
    if idx < slice.len() {
        Some(unsafe { *slice.as_ptr().add(idx) })
    } else {
        None
    }
}

fn main() {
    let arr = [10, 20, 30];
    println!("{:?}", get_safe(&arr, 1)); // Some(20)
    println!("{:?}", get_safe(&arr, 9)); // None
}
```

`get_element` 把”保证 ptr 有效、idx 在界内”的责任完全推给了每一个调用者——每次调用都要写 unsafe，每次都要自己小心。`get_safe` 把验证逻辑放在函数里，unsafe 只出现一次，调用方完全不感知。

## 不变量：unsafe 代码依赖的规矩

那函数内部的 unsafe 为什么安全？因为有**不变量**（invariant）在守护。

不变量是你的代码对自己立下的规矩——一条永远必须成立的条件。上面 `get_safe` 的不变量是：进入 unsafe 块之前，`idx < slice.len()` 一定成立。只要这条成立，`slice.as_ptr().add(idx)` 就不会越界，解引用就是合法的。

用一个生活类比建立直觉：银行账户有一条不变量”余额 ≥ 0”。取款操作在扣钱之前会先检查余额是否足够——这个检查就是在维护不变量。如果跳过检查直接扣钱，账户就进入了”不合法状态”，后续一切计算都可能出错。

unsafe 代码里的不变量是一样的道理，只是”不合法状态”变成了”未定义行为”。

## 封装的作用

理解了不变量，封装的意义就很清楚了：

**封装 = 让外部代码没有机会打破不变量。**

如果字段是 `pub` 的，任何人都能把 `len` 改大、把指针改成 null——不变量随时可能被破坏。把字段设为私有，只通过你控制的方法访问，就能保证每次修改都经过你的检查。

## 一个完整的例子

`split_at_mut` 是标准库里的经典案例——把一个可变 slice 从中间分成两段，各自可变：

```
use std::slice;

fn split_at_mut(slice: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = slice.len();
    let ptr = slice.as_mut_ptr();

    // 不变量：mid <= len
    // 只要成立，两段内存就不重叠，同时持有两个可变引用是安全的
    assert!(mid <= len);

    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut v = [1, 2, 3, 4, 5];
    let (left, right) = split_at_mut(&mut v, 3);
    println!("{:?}", left);  // [1, 2, 3]
    println!("{:?}", right); // [4, 5]
}
```

这段代码如果只用安全 Rust 来写，编译器会拒绝——它看到的是”同一个 slice 被借用了两次”，不知道两段不重叠。但我们知道，所以用 `assert!` 强制维护不变量，再用 unsafe 告诉编译器”我检查过了”。

调用方看到的只是一个普通函数，完全不需要接触 unsafe。

## 小结

三件事缺一不可：

- **识别不变量**：unsafe 代码正确运行依赖哪条必须成立的条件
- **维护不变量**：在进入 unsafe 之前，用检查（assert、if）或类型系统确保条件成立
- **封装 unsafe**：把危险操作藏在函数内部，对外只暴露安全接口

这就是标准库里每一个用了 unsafe 的类型和函数都在做的事。
在系统编程的世界里，C 语言是通用的二进制语言。无论处理操作系统内核、数据库引擎还是图形驱动，都不可避免地需要与 C 代码打交道。

Rust 的设计目标之一是**零成本互操作性**：你可以像调用 Rust 函数一样调用 C 函数；外部语言也可以像调用 C 函数一样调用 Rust；数据在两种语言之间传递时，通常不需要额外的拷贝开销。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| ABI、            | extern "C"      | 块、基本类型映射与内存安全边界 |
| 从 C 头文件自动生成 Rust FFI 绑定代码 |                 |
| 生成 C 头文件，将 Rust 库嵌入现有 C 代码库 |                 |
| 用               | cc              | crate 在 Rust 项目中直接编译和链接 C 源码 |
# 基础概念

Rust 的 **FFI (Foreign Function Interface)** 允许它调用其他语言（主要是 C）编写的函数，也允许其他语言调用 Rust。这对于复用现有的库或在现有 C 系统中引入 Rust 至关重要。

## 什么是 ABI？

要让两种不同的编程语言相互通信，它们必须在二进制层面上达成一致。这种约定被称为 **ABI（Application Binary Interface，应用二进制接口）**。

ABI 规定了：

- 函数参数是如何传递的（是通过寄存器还是栈？顺序如何？）
- 返回值如何处理。
- 函数在内存中的符号名称（Symbol Name）如何生成。

由于 C 语言是事实上的系统编程标准，绝大多数平台都定义了「标准的 C ABI」。

## `extern "C"` 块

为了在 Rust 中调用 C 函数，我们需要声明该函数的原型，并告知 Rust 使用 C ABI。

```
extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    unsafe {
        println!("Absolute value of -3 according to C: {}", abs(-3));
    }
}
```

- `extern "C"`：指定使用 C ABI。
- `unsafe`** 块**：调用外部函数总是被标记为 `unsafe`。因为 Rust 编译器无法检查外部 C 代码是否遵守 Rust 的内存安全规则（如指针有效性）。

## 导出 Rust 函数给 C

既然我们能调用 C，反过来，我们也需要让 C 能够调用 Rust。为了实现这一点，我们同样需要在 Rust 函数定义上使用 `extern "C"`。

在 Rust 中，`extern "C"` 有两种用法：

- `extern "C" { ... }`** 块**：用于**声明**（导入）外部已经存在的 C 函数。
- `extern "C" fn ...`：用于**定义**（导出）一个符合 C ABI 的 Rust 函数。

```
// 这是一个符合 C 调用约定的 Rust 函数
#[no_mangle]
pub extern "C" fn my_rust_library_function(x: i32) -> i32 {
    x * 2
}
```

**为什么要这么做？**
虽然函数的逻辑是用 Rust 写的，但当 C 程序调用它时，它必须穿上「C 的制服」（使用 C ABI 进行压栈、跳转和返回）。如果没有 `extern "C"`，Rust 编译器会使用由于性能优化而经常变动的 Rust 默认调用约定，这在 C 看来就是一堆无法理解的乱码。

## 符号名重整 (Name Mangling)

如果没有重整，它们在生成的二进制文件中都会被简简单单地命名为 `add`。当你尝试运行程序时，链接器会因为发现两个同名的「符号」而报错（符号冲突）。Rust 通过将名字重整为类似 `_ZN4math3add17h123abc456def789E` 的形式，确保了全球唯一性。

### FFI 中的尴尬

然而，C 语言及其链接器非常「单纯」。它不支持命名空间或函数重载，因此它期望你在代码里写 `call_from_c`，二进制文件里也必须叫 `call_from_c`。

如果我们想让 Rust 函数能被 C 链接器精准识别，就必须使用 `#[no_mangle]` 属性，强制要求 Rust 编译器：「原封不动地保留这个名字」。

```
// 使用 #[no_mangle] 告诉编译器不要重整函数名
// 这样在编译出的库中，函数名依然是 "call_from_c"
#[no_mangle]
pub extern "C" fn call_from_c() {
    println!("成功收到 C 的调用：Rust 没把我的名字改掉！");
}
```

# 类型映射

跨越语言边界最大的挑战在于：**如何确保两边对内存数据的理解完全一致？**

这是双向的要求：

- **从 C 到 Rust**：当你在 `extern "C"` 块中声明 C 函数时，必须将 C 的参数类型准确映射为对应的 Rust 类型，否则 Rust 给 C 传参时可能会因为字节数对不上而造成崩溃。
- **从 Rust 到 C**：当你写一个给 C 调用函数时，必须使用 C 兼容的类型和布局（如 `#[repr(C)]`），否则 C 语言会解析错你的数据结构。

## 基础数值类型

你可能会想：C 里的 `int` 不就是 Rust 里的 `i32` 吗？

**不一定。** 在不同的 C 编译器和 CPU 架构下，`int` 可能是 16 位、32 位甚至 64 位。为了处理这种不确定性，Rust 在 `std::os::raw`（或 `core::ffi`）中定义了跨平台别名。

| C 类型            | Rust 别名         | 建议              |
| --------------- | --------------- | --------------- |
| int             | c_int           | 始终优先使用别名，而非硬编码  | i32             |
| unsigned int    | c_uint          | 匹配 C 的无符号整型     |
| long            | c_long          | 极其重要：在 Windows 上通常是 32 位，Linux 上通常是 64 位 |
| size_t          | usize           | 虽然大部分情况等价，但在 FFI 签名中显式使用 | libc::size_t    | 更规范             |

## 结构体布局：`#[repr(C)]`

这是初学者最容易掉进去的坑。

默认情况下，Rust 编译器为了优化内存空间（对齐和填充），可能会**重新排列**结构体中字段的顺序。而 C 语言严格按照定义的顺序排列字段。

```
// ❌ 危险：这个结构体传给 C 会解析出错
struct Data {
    a: u8,
    b: u64,
}

// ✅ 正确：强制使用 C 兼容的内存布局
#[repr(C)]
struct SafeData {
    a: u8,
    b: u64,
}
```

### `#[repr(C)]` 会影响性能吗？

这是一个很好的问题。答案是：**几乎没有性能开销，但可能会有轻微的内存开销。**

- **运行开销（零成本）**：`#[repr(C)]` 只是在编译时告诉编译器如何摆放数据。它不会在运行时产生多余的指令或 CPU 开销。
- **空间开销（填充）**：Rust 默认的布局非常「聪明」，它会为了减少内存空隙而重排字段。例如，它可能会把几个小的 `u8` 塞进一个 `u64` 留下的缝隙里。而 `#[repr(C)]` 禁用了这种聪明才智，必须按照 C 的古老规则保留固定顺序。这意味着你的结构体可能会因为额外的 **填充字节（Padding）** 而大出几个字节。

> 结论：为了 FFI 的正确性，这点小小的内存牺牲是必须的，且在 99% 的场景下，这种尺寸差异对性能的影响微乎其微。


> 记住：任何要传给 C 或从 C 接收的结构体，必须标注 #[repr(C)]。


## 指针与 `void*`

C 语言中随处可见的 `T*` 指针在 Rust 中对应的是**裸指针 (Raw Pointers)**。它们之间的映射关系如下：

- `const T*` -> `*const T`
- `T*` (可变) -> `*mut T`
- `void*` (通用指针) -> `*mut c_void`

裸指针不像引用那样受借用检查器的保护，你可以随意解引用它们（但在 `unsafe` 块中），也可以随意在它们之间强转。

## C 语言字符串处理

处理字符串是 FFI 中最繁琐的部分，因为两者的设计理念完全不同：

- **C 字符串**：一段连续内存，以 `\0` (nul) 结尾。没有长度信息。
- **Rust 字符串**：有效的 UTF-8 序列，拥有显式的长度信息。

### 1. `CString`：将 Rust 字符串发往 C

当你需要生成一个 C 兼容的字符串并传给外部库时，使用 `CString`。它会分配内存并在末尾自动补上 `\0`。

```
use std::ffi::CString;

let s = CString::new("Hello C").expect("字符串内部不能包含 nul 字节");
// 注意：必须保持 c_str 的生命周期比 C 调用长
unsafe {
    some_c_function(s.as_ptr());
}
```

### 2. `CStr`：读取来自 C 的字符串

当 C 库返回给你一个 `*const char` 时，使用 `CStr` 来「包裹」它，从而能够以借用的方式读取数据，而无需立即拷贝。

```
use std::ffi::CStr;
use std::os::raw::c_char;

fn handle_callback(ptr: *const c_char) {
    let c_str = unsafe {
        assert!(!ptr.is_null());
        CStr::from_ptr(ptr)
    };
    println!("C 传来的消息: {:?}", c_str.to_str().unwrap());
}
```

# 代码实战示例

本节将通过完整的示例代码，展示如何将前面学到的知识点串联起来。

## 示例 1：调用 C 标准库进行数学计算

在 C 语言中，`sqrt` 函数用于计算平方根。在 Rust 中我们不需要手动链接库，因为它通常包含在默认链接的标准库中。

```
use std::os::raw::c_double;

// 声明外部 C 函数
extern "C" {
    fn sqrt(x: c_double) -> c_double;
    fn pow(base: c_double, exp: c_double) -> c_double;
}

fn main() {
    let x: f64 = 2.0;
    let y: f64 = 3.0;

    unsafe {
        println!("2.0 的平方根是: {}", sqrt(x));
        println!("2.0 的 3.0 次方是: {}", pow(x, y));
    }
}
```

## 示例 2：向 C 传递复杂的配置结构体

当我们需要向外部库传递配置信息时，通常会定义一个 `#[repr(C)]` 的结构体。

```
use std::os::raw::{c_int, c_char};
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
        process_config(&config);
    }
}
```

> 💡 思考：手动写这些太麻烦了怎么办？

> 你可能已经发现了：C 语言只需要 #include <header.h> 就能拿到定义，Rust 难道必须手动重写一遍 C 库里成百上千个结构体吗？

> 答案是：不需要。 虽然 Rust 编译器本身不理解 .h 文件，但我们可以使用工具 bindgen。它能自动解析 C 头文件并生成对应的 Rust extern "C" 块和 #[repr(C)] 结构体。在处理大型 C 项目时，自动化工具是绝对的主流。我们将在下一篇文章里详细探讨它。


> 注意：在上面的代码中，process_config 函数的实现是在外部的 C 库（如 .c 文件或 .so/.dll 动态库）中。Rust 编译器在编译时会通过 extern "C" 块生成一个待链接的符号，并在链接阶段将其指向真实的 C 实现。


## 示例 3：处理 C 风格的回调函数

C 语言库经常通过函数指针来提供异步或事件回调。在 Rust 中，我们可以通过 `extern "C" fn` 来定义符合要求的函数。

```
use std::os::raw::c_int;

// 1. 定义函数指针类型（符合 C ABI）
type Callback = extern "C" fn(c_int, c_int) -> c_int;

extern "C" {
    // 2. 声明一个接收回调的外部 C 函数
    fn run_operation(a: c_int, b: c_int, cb: Callback);
}

// 3. 在 Rust 中编写回调函数的具体实现
// 必须加上 extern "C" 以匹配调用约定
extern "C" fn my_rust_callback(a: c_int, b: c_int) -> c_int {
    println!("Rust 回调被触发：a = {}, b = {}", a, b);
    a + b
}

fn main() {
    unsafe {
        // 4. 将 Rust 函数作为回调传给 C
        run_operation(10, 20, my_rust_callback);
    }
}
```


## 核心概念测验
# 自动化绑定

手动为成百上千个 C 函数编写 `extern "C"` 声明不仅枯燥，而且极易出错。如果 C 语言库更新了头文件，手动维护这些绑定简直是噩梦。

`bindgen` 是 Rust 官方推荐的工具，它可以自动读取 C 头文件（`.h`），并生成对应的 Rust 原始绑定。

## 使用 bindgen CLI

你可以先安装命令行工具来快速测试：

```
cargo install bindgen-cli
```

假设你有一个名为 `input.h` 的文件：

```
typedef struct {
    int x;
    int y;
} Point;

void print_point(Point p);
```

运行以下命令：

```
bindgen input.h -o bindings.rs
```

生成的 `bindings.rs` 会包含：

```
#[repr(C)]
#[derive(Debug, Copy, Clone)]
pub struct Point {
    pub x: ::std::os::raw::c_int,
    pub y: ::std::os::raw::c_int,
}

extern "C" {
    pub fn print_point(p: Point);
}
```

# 构建脚本集成

在实际项目中，我们通常在 `build.rs`（构建脚本）中使用 `bindgen`，这样每次编译时它都会自动根据最新的头文件更新绑定。

## 配置步骤

- 在 `Cargo.toml` 中添加依赖：

```
[build-dependencies]
bindgen = "0.69"
```

- 编写 `build.rs`：

```
use std::env;
use std::path::PathBuf;

fn main() {
    // 告诉 Cargo，如果头文件变了，就重新运行脚本
    println!("cargo:rerun-if-changed=wrapper.h");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("Unable to generate bindings");

    // 将生成的绑定写入 $OUT_DIR/bindings.rs
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings
        .write_to_file(out_path.join("bindings.rs"))
        .expect("Couldn't write bindings!");
}
```

- 在 Rust 代码中引入生成的内容：

```
// 引入自动生成的代码
include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

fn main() {
    let p = Point { x: 10, y: 20 };
    unsafe {
        print_point(p);
    }
}
```

### 关键机制：为什么使用 `OUT_DIR`？

在上面的 `build.rs` 示例中，你可能注意到我们并没有把生成的 `bindings.rs` 放在 `src/` 目录下。这是 Rust 构建脚本的标准实践：

- **避免源码污染**：自动生成的代码会随 C 头文件的变化而变动，不应该作为「手写源码」提交到 Git 仓库。
- `OUT_DIR`** 环境变量**：这是 Cargo 为构建脚本专门准备的临时存放目录（通常在 `target/debug/build/...` 路径下）。
- `include!`** 宏**：它是 Rust 内置的宏，可以将指定文件的内容「原封不动」地粘贴到当前位置，从而让我们在 Rust 源码中直接使用那些自动生成的结构体定义。

## 处理复杂情况

- **宏定义**：bindgen 会尝试将 C 中的 `#define` 转换为 Rust 的常量。
- **不透明类型**：对于不想在 Rust 中直接访问成员的结构体，可以使用 `.opaque_type("MyStruct")`。
- **白名单机制**：如果你只想为特定函数生成绑定，可以使用 `.allowlist_function("my_func_.*")`。


## 概念测验
# 导出 Rust 给 C

有时我们需要编写一个极高性能的 Rust 库，然后让现有的 C、C++ 或 Python 代码调用它。这需要我们完成两件事：

- 将 Rust 代码编译成 C 兼容的动态链接库（`.so`/`.dll`）。
- 为 C 代码提供对应的头文件（`.h`）。

这就是 `cbindgen` 的用武之地。

## 准备 Rust 代码

要导出函数，必须满足：

- 使用 `pub extern "C"`。
- 使用 `#[no_mangle]` 禁用符号重整。

```
#[repr(C)]
pub struct CalculationResult {
    pub value: f64,
    pub is_valid: bool,
}

#[no_mangle]
pub extern "C" fn calculate_sqrt(input: f64) -> CalculationResult {
    if input < 0.0 {
        CalculationResult { value: 0.0, is_valid: false }
    } else {
        CalculationResult { value: input.sqrt(), is_valid: true }
    }
}
```

注意：结构体必须加上 `#[repr(C)]`，否则 Rust 的布局方式与 C 不一致，会导致严重的数据损坏问题。

## 项目配置

在 `Cargo.toml` 中，必须指定库类型为 `cdylib`：

```
[lib]
crate-type = ["cdylib"]
```

# 配置与使用

虽然可以手动写头文件，但如果你的 Rust 接口经常变动，同步起来会非常麻烦。`cbindgen` 可以自动化这一过程。

## 使用 CLI 工具

安装工具：

```
cargo install cbindgen
```

在 Rust 项目根目录运行：

```
cbindgen --config cbindgen.toml --crate my_project --output my_lib.h
```

生成的 `my_lib.h` 如下：

```
#include <stdint.h>
#include <stdbool.h>

typedef struct {
  double value;
  bool is_valid;
} CalculationResult;

CalculationResult calculate_sqrt(double input);
```

## cbindgen.toml 配置

通过一个可选的配置文件，你可以精细控制头文件的生成逻辑：

```
language = "C" # 也可以是 "C++"
header = "/* 自动化生成的 Rust 绑定头文件 */"
include_guard = "MY_LIB_H"

[export]
include = ["CalculationResult", "calculate_sqrt"]
```

## 内存安全警告

从 C 调用 Rust 时，**所有权规则依然存在**。

- 如果 Rust 返回了一个在堆上分配的对象（如 `Box` 或 `Vec`），C 代码必须将其传回给 Rust 的特定函数来释放。
- 绝不要在 C 语言中直接调用 `free()` 来释放由 Rust 堆分配器管理的内存。


## 核心概念测验
# 静态混合编译

在系统级编程中，**静态链接 (Static Linking)** 是最稳健的方案。它将所有依赖的代码在编译期直接拷贝到最终的可执行文件中，生成一个没有任何外部库依赖的二进制文件，这对于跨平台分发和嵌入式开发至关重要。

本节我们将讨论两种典型的静态混合编译场景。

## 场景一：C 为 Rust 所用（在 Rust 项目中编译 C 源码）

当你需要调用一小段 C 代码，或者正在将一个现有的 C 库集成到 Rust 项目中时，你会选择这个方案。

### 1. 目录结构

推荐将 C 源码放在项目根目录下的独立文件夹中（如 `c_src`），以保持源码整洁：

```
my_project/
├── Cargo.toml
├── build.rs         <-- 构建脚本
├── c_src/           <-- C 源码
│   ├── utils.c
│   └── utils.h
└── src/
    └── main.rs      <-- Rust 逻辑
```

### 2. 使用 `cc` crate 管理构建

`cc` crate 是 Rust 生态中编译 C/C++ 代码的标准工具。它会自动搜索系统中安装的编译器（如 `gcc`, `clang`, `msvc`），并根据目标平台设置正确的编译参数。

**步骤 A：添加依赖** (`Cargo.toml`)

```
[build-dependencies]
cc = "1.0"
```

**步骤 B：编写构建脚本** (`build.rs`)
构建脚本在 Rust 编译开始前运行。其核心任务是调用编译器将 C 文件编译成静态库（`.a` 或 `.lib`）。

```
fn main() {
    // 1. 指定监控的文件：如果 utils.c 变动，Cargo 会自动重新编译 C 代码
    println!("cargo:rerun-if-changed=c_src/utils.c");

    // 2. 使用 cc::Build 配置编译
    cc::Build::new()
        .file("c_src/utils.c")      // 添加源文件
        .include("c_src")           // 添加头文件搜索路径（-I）
        .define("DEBUG_MODE", "1")  // 添加宏定义（-D）
        .warnings(true)             // 启用警告
        .compile("myutils");        // 编译并生成 libmyutils.a 静态库
}
```

### 3. 构建脚本背后的「秘密」

当你调用 `.compile("myutils")` 时，`cc` crate 实际上为 Cargo 做了两件事：

- **运行编译器**：在 `target/` 目录下生成静态库文件。
- **发送链接指令**：它会自动向 Cargo 标准输出打印如下内容（你看不到但 Cargo 能接收到）：
- `cargo:rustc-link-lib=static=myutils` (告诉链接器包含这个库)
- `cargo:rustc-link-search=native=/path/to/library` (告诉链接器在哪找)


### 4. 在 Rust 中建立桥梁

现在你可以直接在 Rust 里声明对应的外部函数了：

```
// src/main.rs
extern "C" {
    // 必须与 C 中的声明完全一致
    fn c_function_name(arg: i32);
}

fn main() {
    unsafe {
        c_function_name(42);
    }
}
```

---
## 场景二：Rust 为 C 所用（将 Rust 打包给 C 工程）

如果你想在一个现有的庞大 C 语言工程中引入 Rust（例如重写某个性能瓶颈模块），你需要将 Rust 编译成一个 C 编译器能理解的「静态库文件」。

### 1. 配置项目类型

默认情况下，Cargo 会生成 Rust 专用的 `.rlib`。要生成 C 定义的静态库，必须在 `Cargo.toml` 中显式指定：

```
[lib]
name = "my_rust_core"
crate-type = ["staticlib"] # 👈 关键点：生成静态二进制库 (.a 或 .lib)
```

### 2. 导出函数

确保你的 Rust 函数使用了 `extern "C"` 和 `#[no_mangle]`：

```
#[no_mangle]
pub extern "C" fn rust_add(a: i32, b: i32) -> i32 {
    a + b
}
```

### 3. 在 C 工程中链接

当你运行 `cargo build --release` 后，在 `target/release/` 下会找到 `libmy_rust_core.a`。

**链接命令示例 (GCC)：**

```
gcc main.c -L ./target/release/ -lmy_rust_core -lpthread -ldl -o my_app
```

> 💡 专家提示：
> 静态链接 Rust 时，必须手动链接其底层的操作系统依赖。在 Linux 上通常是 -lpthread 和 -ldl。如果链接时报错「undefined reference」，请检查是否遗漏了这些系统库。



## 概念测验
在这一章中，我们将离开操作系统的「舒适区」，直接在裸机（Bare-metal）硬件上编写 Rust 代码。嵌入式开发是 Rust 的核心战场之一——Rust 的内存安全性与硬件级的控制能力，解决了长久以来 C 语言嵌入式开发中内存安全隐患、并发竞争和难以跨平台抽象的痛点。

Rust 嵌入式的核心优势：**零成本抽象**（高级语法，C 级机器码）、**类型安全**（将硬件状态编码进类型，编译期拦截非法操作）、**强大生态**（Embedded-HAL 标准，一份驱动跑在不同 MCU 上）。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| no_std          | 环境、Panic 处理与程序入口点 |
| 内存映射、           | memory.x        | 与启动时的内存段初始化     |
| PAC、HAL 以及类型安全的寄存器操作 |                 |
| 嵌入式并发、原子操作，中断中的安全数据访问 |                 |
| 现代化异步嵌入式框架，高效处理多任务 |                 |
| 嵌入式工具链配置、调试手段与实战项目串联 |                 |
# 裸机开发基础

在传统的软件开发中，我们习惯于有操作系统（OS）的支持。操作系统为我们提供了文件系统、网络协议栈、内存管理（堆分配）以及标准库（`std`）。

但在嵌入式裸机（Bare-metal）开发中，这些都不存在。我们的代码直接运行在处理器上。为了让 Rust 在这种环境下运行，我们必须移除对操作系统的依赖。

## `#[no_std]` 属性

默认情况下，Rust 程序会链接标准库 `std`。`std` 内部依赖于操作系统的系统调用（如 `read`, `write`, `malloc` 等）。在裸机环境下，我们必须声明：

```
#![no_std]
```

这告诉编译器，我们不使用 `std` 库，转而只使用 `core`** 库**。`core` 库是 `std` 的子集，它不依赖于任何硬件或操作系统特性，包含了基础的语言定义（如 `Option`, `Result`, 基础数值运算等）。

### `std` vs `core` vs `alloc`

- `core`：最基础的逻辑，不涉及系统调用，不涉及堆内存。
- `alloc`：提供了堆内存分配相关的类型（如 `Vec`, `Box`, `String`），但需要你手动实现一个「堆分配器」。
- `std`：完整的标准库，包含了 `core` 和 `alloc` 的内容，并增加了系统交互（I/O 等）。

## 缺失的拼图：Panic 处理

由于没有标准库，Rust 遇到致命错误（Panic）时，不知道该如何处理（默认是打印到控制台并退出进程，但在裸机上没有控制台，也没有进程）。因此，我们必须手动定义一个 **Panic 处理器**。

我们需要引入一个提供该功能的 crate（如 `panic-halt`），或者手动编写：

```
use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    // 这里可以是无限循环，或者是重启硬件
    loop {}
}
```

注意返回类型是 `!`（发散类型），表示该函数永远不会返回。

## 程序入口点：`#[entry]`

在普通程序中，入口是 `main` 函数，但它实际上是由操作系统在执行了一些初始化（Runtime runtime）后调用的。在裸机上，我们需要用特定的属性来标记程序的真正入口。

通常我们会使用 `cortex-m-rt` 等 crate 提供的 `#[entry]` 宏：

```
#![no_std]
#![no_main] // 告知编译器我们没有标准的 main 函数

use cortex_m_rt::entry;

#[entry]
fn main() -> ! {
    // 硬件初始化逻辑
    loop {
        // 应用程序主循环
    }
}
```

## 最小裸机程序模板

让我们把这些拼凑起来，看一个完整的「极简」Rust 裸机工程文件：

```
#![no_std]
#![no_main]

// 假设我们引入了 panic 处理 crate
use panic_halt as _;
use cortex_m_rt::entry;

#[entry]
fn main() -> ! {
    let mut _counter = 0;

    loop {
        _counter += 1;
        // 在这里，没有 printf，你可能需要操作引脚让 LED 闪烁
    }
}
```

## 为什么没有 `String` 和 `Vec`？

在 `no_std` 环境下，你会发现原本常用的 `String` 或 `Vec<u8>` 无法直接编译。这是因为它们需要 **动态堆内存分配（Heap）**。

在嵌入式开发中，内存非常宝贵（可能只有几十 KB），程序通常使用 **栈（Stack）** 或 **静态分配（Static）**。

- 如果你需要定长的缓冲区，使用数组：`let mut buffer = [0u8; 64];`
- 如果非要用 `Vec`，你需要显式地配置一个「堆分配器」（Allocator），并使用 `alloc` crate。


## 核心概念测验
# 内存布局与链接脚本

在嵌入式开发中，你必须比在 PC 开发时更清楚代码和数据被放在了哪里。嵌入式芯片的存储空间通常是由不连续的地址块组成的。

## 1. 嵌入式内存映射

典型的 32 位微控制器（如 STM32）的内存地址空间如下：

- `0x0800_0000`** (FLASH)**：代码指令和只读常量。断电后不会丢失。
- `0x2000_0000`** (RAM)**：运行时变量、堆栈（Stack）和堆（Heap）。速度极快，但断电即失。
- `0x4000_0000`** (外设寄存器)**：映射到特定的地址，用于控制 GPIO、UART 等硬件。

## 2. 链接脚本的作用

编译器（rustc）生成的代码只是逻辑上的指令，它并不知道你的具体芯片有多少 Flash 或 RAM。

**链接脚本 (Linker Script)** 的任务是：

- **定义物理边界**：告诉链接器「这里有 128KB Flash，从 0x08000000 开始」。
- **分配段 (Sections)**：告诉链接器「把所有指令放到 FLASH 中，把变量放到 RAM 中」。

## 3. Rust 中的 `memory.x`

在 Rust 嵌入式生态（尤其是 Cortex-M）中，我们通常不需要编写复杂的 GNU Linker 脚本，只需要在一个简单的 `memory.x` 文件中定义内存区域：

```
/* memory.x */
MEMORY
{
  /* 我们可以存放代码和常量的地方 */
  FLASH : ORIGIN = 0x08000000, LENGTH = 128K

  /* 我们可以存放变量和堆栈的地方 */
  RAM   : ORIGIN = 0x20000000, LENGTH = 20K
}
```

## 4. 程序段 (Program Sections)

链接器会根据 `memory.x` 将代码分成不同的「段」：

### `.text` (代码段)

存放所有的可执行机器指令。

- **位置**：FLASH。
- **特点**：只读。

### `.rodata` (只读数据段)

存放常量。

- **位置**：FLASH。
- **示例**：`static MESSAGE: &str = "Hello";` 中的字符串。

### `.data` (已初始化变量段)

存放初始值不为零的全局变量。

- **挑战**：这些变量需要能读写（在 RAM），但初始值必须保存在断电不丢失的地方（在 FLASH）。
- **处理**：运行时入口（`cortex-m-rt`）会在启动时自动将这些值从 FLASH 拷贝到 RAM。

### `.bss` (未初始化变量段)

存放初始值为零的全局变量。

- **处理**：不需要在 FLASH 中存储初始值，启动时直接在 RAM 中清零即可。

## 5. 堆栈 (Stack & Heap)

- **栈 (Stack)**：用于局部变量和函数调用信息。在 Rust 嵌入式中，栈通常从 RAM 的末尾开始，向下增长。
- **堆 (Heap)**：如果你在 `no_std` 下使用了 `alloc` 库，你需要手动定义一块 RAM 区域作为堆。

## 6. LMA 与 VMA

这是链接脚本中最容易混淆的概念：

- **LMA (Load Memory Address)**：加载地址。即程序烧录进芯片时，数据所在的物理位置（通常是 FLASH）。
- **VMA (Virtual Memory Address)**：运行地址。即程序运行时，数据应该被 CPU 访问的地址（对于变量来说，是 RAM）。


## 核心概念测验
# 硬件抽象：如何与芯片交谈

在 C 语言中，操作硬件通常涉及到大量的宏（Macros）和指针强转（如 `*(uint32_t*)0x4001080C = 0x01`）。这种方式非常容易出错，且编译器无法提供任何保护。

Rust 的嵌入式生态采用了一套三层模型，将硬件操作逐步抽象：

## 1. 寄存器访问层（PAC）

**PAC (Peripheral Access Crate)** 是最底层的抽象。它通常由工具 `svd2rust` 直接从芯片厂商提供的 SVD 文件（XML 格式的描述文件）自动生成。

PAC 把内存地址变成了结构体。

### 传统的 C 风格操作：

```
// 很容易写错地址或位偏移
RCC->APB2ENR |= (1 << 3);
```

### Rust PAC 风格操作：

```
// 类型安全的 API
dp.RCC.apb2enr.modify(|_, w| w.iopben().set_bit());
```

在 PAC 中，你依然是在操作寄存器，但 Rust 的闭包 API 确保了：

- **原子性**：`modify` 会处理读-写循环。
- **只读/只写保护**：你无法写入一个被标记为只读的寄存器。
- **字段校验**：无法设置非法的位组合。

## 2. 硬件抽象层（HAL）

**HAL (Hardware Abstraction Layer)** 在 PAC 之上提供了更高级、更符合人体工程学的 API。它不要求你记住寄存器名称，而是操作具体的业务逻辑（如「初始化串口」）。

```
// 使用 HAL 初始化 GPIO B 的第 12 号引脚为推挽输出
let gpiob = dp.GPIOB.split();
let mut led = gpiob.pb12.into_push_pull_output();

led.set_high(); // 点亮 LED
```

## 3. 核心机制：类型状态模式 (Typestate Pattern)

这是 Rust 嵌入式开发最神奇的地方。利用 Rust 的 **所有权机制**，我们可以将硬件的**状态**编码到类型中。

### 场景：配置一个引脚

一个 GPIO 引脚在同一时间只能是「输入」或「输出」，绝不能同时是两者。

```
let pin = gpioa.pa1.into_floating_input(); // 此时 pin 的类型是 Pin<Input<Floating>>
// pin.set_high(); // ❌ 编译报错！输入引脚没有 set_high 方法

let output_pin = pin.into_push_pull_output(); // 消耗原引脚，返回 Pin<Output<PushPull>>
output_pin.set_high(); // ✅ 正常工作
```

这意味着：**如果你错误地在代码里操作了状态不对的硬件，编译器会拒绝编译。** 这种「编译期拦截」极大地减少了硬件调试的压力。

## 4. 通用标准：Embedded-HAL

如果你写了一个 OLED 屏幕的驱动，你肯定希望它既能跑在 STM32 上，也能跑在 ESP32 上。

`embedded-hal` 定义了一套标准的 Trait（接口）：

- `OutputPin`（输出引脚）
- `SpiBus`（SPI 总线）
- `I2cAddress`（I2C 地址）

只要你的驱动程序要求接收一个「实现了 `OutputPin` 的类型」，那么它就可以在任何实现了该标准的硬件平台上复用。这促成了 Rust 嵌入式社区极其丰富的驱动库（Display, Sensor, Radio 等）。


## 核心概念测验
# 中断与并发安全

在嵌入式开发中，**中断（Interrupt）** 是处理异步事件的核心机制。当按键被按下、串口接收到数据或定时器到时，硬件会自动「中断」主程序的执行，跳转去运行一段特定的代码：**中断服务程序（ISR, Interrupt Service Routine）**。

这引入了一个经典的并发难题：**如何在 **`main`** 循环和 **`ISR`** 之间安全地共享数据？**

## 1. 危险的全局变量

在 C 语言中，我们通常使用 `static volatile` 全局变量。但在 Rust 中，全局可变变量是 `static mut`，通过它修改数据是 **不可取且极度危险的**，因为 `main` 修改一半时，中断可能随时发生并试图再次修改，导致数据竞争。

## 2. 临界区（Critical Section）

解决共享数据最基础的方法是：**在操作共享变量时临时禁用所有中断**。这段被保护的代码块被称为「临界区」。

在 Rust 中，我们通常使用 `critical-section` crate。

```
use critical_section as cs;

cs::with(|cs_token| {
    // 这个闭包内的代码在运行期间，中断是禁用的
    // cs_token 是一个「令牌」，证明你已经安全地合上了锁
});
```

## 3. 裸机下的 Mutex 与 RefCell

为了在不引发数据竞争的前提下共享资源，Rust 嵌入式社区使用了一种特殊的 `Mutex`（互设锁）。

### 类型定义：

```
use core::cell::RefCell;
use critical_section::Mutex;

// 定义一个被锁保护的、可内部变更的全局变量
static SHARED_DATA: Mutex<RefCell<u32>> = Mutex::new(RefCell::new(0));
```

### 访问数据：

```
fn handle_interrupt() {
    // 1. 进入临界区（获取令牌）
    critical_section::with(|cs| {
        // 2. 借用互斥锁并传入令牌
        let mut data = SHARED_DATA.borrow(cs).borrow_mut();
        // 3. 安全地操作数据
        *data += 1;
    });
}
```

**为什么需要 **`cs`** 令牌？**
Rust 的嵌入式 `Mutex` 要求在调用 `borrow` 时必须传入一个 `CriticalSection` 令牌。由于获取令牌的唯一途径是调用 `cs::with`（这会禁用中断），这就保证了 **只要你在持有数据，中断就一定发不生**。

## 4. 原子操作（Atomic）

如果你只需要共享一个简单的数值（如标志位或计数器），使用原子类型（Atomics）是效率更高、成本更低的方案。由于硬件指令集支持原子读-改-写，这种操作本身就不受中断干扰，因此不需要进入临界区。

```
use core::sync::atomic::{AtomicBool, Ordering};

static IS_PRESSED: AtomicBool = AtomicBool::new(false);

fn main_loop() {
    if IS_PRESSED.load(Ordering::SeqCst) {
        // 处理按键逻辑
        IS_PRESSED.store(false, Ordering::SeqCst);
    }
}

// 中断函数
fn on_button_click() {
    IS_PRESSED.store(true, Ordering::SeqCst);
}
```

## 5. 独占外设：`Peripherals` 的单例性

Rust 嵌入式库通过 `take()` 方法确保硬件外设是**单例**的。

```
let dp = pac::Peripherals::take().unwrap();
```

如果你的程序中两个地方同时尝试 `take()`，第二次会返回 `None`。这在编译期（或运行期初始化时）就防止了两个不同的模块同时配置同一个定时器或串口。


## 核心概念测验
# 异步嵌入式：Embassy 框架

在传统的嵌入式开发中，我们通常只有两种选择：

- **前后台模式 (Superloop)**：一个 `loop` 跑到底，所有的等待（如等待串口数据）都是阻塞的。
- **中断驱动**：通过大量复杂的中断回调来处理异步事件，代码很快就会变成难懂的「面条代码」。

**Embassy** (Embedded + Async) 的出现彻底改变了这一局面。它将 Rust 强大的 `async/await` 特性带入了嵌入式世界。

## 1. 为什么在嵌入式中使用异步？

### 极简的并发

假设你要同时闪烁两个 LED，频率不同。在 `async` 环境下，代码非常直观：

```
#[embassy_executor::task]
async fn blink_led(mut pin: Output<'static, AnyPin>, interval: Duration) {
    loop {
        pin.set_high();
        Timer::after(interval).await;
        pin.set_low();
        Timer::after(interval).await;
    }
}
```

你只需要开启两个 `task`，它们就会并发运行。不需要手写复杂的定时器状态机。

### 极致的低功耗

Embassy 的执行器（Executor）非常聪明。当所有异步任务都处于 `await`（挂起）状态时，它会自动让 CPU 进入 **低功耗睡眠模式**（如 ARM 的 WFI 指令）。只有当硬件中断发生时，处理器才会被唤醒。

## 2. Embassy 的核心组件

- `embassy-executor`：异步任务调度器。它负责轮询所有任务，且**不需要堆内存分配**。
- `embassy-time`：提供 `Timer`, `Instant`, `Duration` 等时间 API，支持毫秒甚至微秒精度。
- `embassy-stm32`** / **`nrf`** / **`rp`：针对特定芯片的 HAL 层。每个外设（如 UART, SPI）都提供了异步接口。

## 3. 一个典型的 Embassy 程序结构

```
use embassy_executor::Spawner;
use embassy_time::{Duration, Timer};
use {panic_halt as _, embassy_stm32 as _};

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    // 初始化硬件
    let p = embassy_stm32::init(Default::default());

    // 派发一个后台任务
    spawner.spawn(my_task()).unwrap();

    loop {
        println!("主循环运行中...");
        Timer::after(Duration::from_secs(1)).await;
    }
}

#[embassy_executor::task]
async fn my_task() {
    loop {
        // 执行异步操作
        Timer::after(Duration::from_millis(500)).await;
    }
}
```

## 4. 异步 vs RTOS (实时操作系统)

Embassy 虽然提供了类似 RTOS 的便利（多任务、同步原语），但它有显著的优势：

- **更小的开销**：由于 `async` 基于编译器生成的协程，它不需要为每个任务分配独立的栈空间，内存消耗极低。
- **更强的类型检查**：异步接口能更好地感知「借用和所有权」，避免了 RTOS 中常见的共享资源竞争问题。


## 核心概念测验
掌握了嵌入式基础后，理解底层逻辑的最佳方式是观察它们如何协作。我们推荐通过一个**教学性质**的实验项目来串联所学知识。

## 推荐实验：从零编写简易 RTOS

这是一个手把手的**教学实验项目**： 🔗 [从零构建 RUST 简易操作系统](https://xyfx-fhw.github.io/RustRTOS/)。

> 注意：该项目仅用于内核原理演示（如调度、中断处理）与 Rust 嵌入式的使用，不具备生产价值，旨在帮助你理解嵌入式底层真相。


### 实验核心路径

通过该实验，你将实战复习以下本章要点：

- **最小启动与日志**：验证 `no_std` 启动与串口调试。
- **中断与定时器**：实操硬件异常接管与 SysTick 配置。
- **上下文切换**：通过保存/恢复寄存器，理解多任务切换的底层瞬间。
- **任务调度**：实现最简单的协作式或抢占式任务管理。
过程宏（Procedural Macros）是 Rust 元编程的高级形式。与基于模式匹配的声明宏不同，过程宏是**真正的 Rust 程序**——它接收编译器传入的 token 流，运行任意代码逻辑，输出新的 token 流让编译器继续编译。

过程宏有三种形式：自定义 `derive` 宏（`#[derive(MyTrait)]`）、类属性宏（`#[my_attr]`）和类函数宏（`my_macro!(...)`）。它们共同的核心工具链是 `syn`（解析 token 流为 AST）和 `quote`（将 AST 转回代码）。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| token 流的概念，proc-macro crate 的项目结构与调试方法 |                 |
| 为 trait 添加      | #[derive(...)]  | 支持，自动生成 impl 代码 |
| 可应用于任意语法项的自定义属性宏 |                 |
| 接受任意 token 序列的函数形式宏 |                 |
# 过程宏是什么

## 先回顾声明宏

你在前面学过 `macro_rules!`，它通过**模式匹配**来生成代码：

```
macro_rules! say_hello {
    ($name:expr) => {
        println!("你好，{}！", $name);
    };
}

fn main() {
    say_hello!("Alice"); // 展开为 println!("你好，{}！", "Alice");
}
```

`macro_rules!` 的工作方式：**匹配输入的”形状”，按模板替换**。

这很强大，但有一个根本限制：你只能做**模式替换**，无法运行任意逻辑。

比如，你想根据结构体的字段数量生成不同的代码——`macro_rules!` 做不到，因为它不能”查看”结构体有几个字段。

## 过程宏：真正的 Rust 程序

**过程宏（Procedural Macro）** 是完全不同的一种宏。

它是一段真正运行的 Rust 程序，在**编译时**被调用：

```
你的源代码
    ↓
编译器遇到 #[derive(MyMacro)]
    ↓
调用你写的 Rust 程序（过程宏函数）
    ↓
你的程序接收 TokenStream（一串 token），可以运行任意逻辑
    ↓
输出新的 TokenStream（生成的代码）
    ↓
编译器把生成的代码和原代码合在一起继续编译
```

**声明宏 vs 过程宏：**

| 声明宏             | macro_rules!    | 过程宏             |
| --------------- | --------------- | --------------- |
| 实现方式            | 模式匹配替换          | 运行任意 Rust 代码    |
| 能力              | 只能做文本模板替换       | 可以分析 AST、运行逻辑、生成任意代码 |
| 错误提示            | 有限              | 可自定义详细错误信息      |
| 典型用途            | 简单代码生成          | #[derive(Serialize)] | 、               | #[test]         | 、               | sqlx::query!    |

表格里多次出现了 `TokenStream` 这个词。要理解过程宏，必须先搞清楚它是什么。

## TokenStream：一串 token

过程宏接收和输出的是 `TokenStream`——编译器把源码解析成的”token 序列”。

“token”就是源码的最小语法单元，比如：

```
struct Point { x: i32, y: i32 }
```

被分解成这些 token：

```
`struct` `Point` `{` `x` `:` `i32` `,` `y` `:` `i32` `}`
```

过程宏函数的签名形式固定：

```
// 接收 token 序列，返回新的 token 序列
fn my_macro(input: proc_macro::TokenStream) -> proc_macro::TokenStream {
    // 可以读取 input 里的内容，生成新代码
    input // 最简单的情况：原样返回
}
```

## 三种过程宏

Rust 有三种不同形式的过程宏，分别用于不同场景：

### 1. 自定义 Derive 宏

最常见。为结构体或枚举自动实现 trait：

```
#[derive(Debug, Clone, Serialize)]  // Debug 和 Clone 是内置，Serialize 是 serde 库提供的
struct Point { x: f64, y: f64 }
```

你自己写一个 `#[derive(MyTrait)]`，让用户一行代码就能自动实现你的 trait。

### 2. 类属性宏

像内置属性一样，可以加在任意代码项上，并修改或替换该项：

```
#[route(GET, "/")]       // web 框架用属性宏标注路由
async fn index() { ... }

#[instrument]            // tracing 库的属性宏，自动追踪函数调用
fn my_function() { ... }
```

### 3. 类函数宏

看起来像函数调用（带 `!`），但能处理任意 token：

```
let query = sql!(SELECT * FROM users WHERE id = 42);
// sql! 是过程宏，可以在编译时验证 SQL 语句的语法！
```

# 搭建过程宏项目

## 为什么需要独立 crate

**过程宏必须放在独立的 crate 里。** 这是 Rust 编译器的硬性要求。

原因是：过程宏在**编译你的代码时**运行，而不是在运行时。编译器需要先编译过程宏，才能用它来编译你的项目。如果把过程宏和普通代码放在一起，就会产生循环依赖。

典型的项目结构：

```
my-project/           ← 你的主项目
├── Cargo.toml
├── src/
│   └── main.rs       ← 使用过程宏的代码
│
└── my-macros/        ← 独立的过程宏 crate
    ├── Cargo.toml
    └── src/
        └── lib.rs    ← 过程宏的实现
```

## 过程宏 crate 的 Cargo.toml

过程宏 crate 需要在 `Cargo.toml` 中声明 `proc-macro = true`：

```
# my-macros/Cargo.toml
[package]
name = "my-macros"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true    # 告诉编译器这是一个过程宏 crate

[dependencies]
# 通常需要这两个库
syn = "2"
quote = "1"
```

主项目依赖它：

```
# my-project/Cargo.toml
[dependencies]
my-macros = { path = "./my-macros" }
```

## 第一个过程宏：什么都不做

先写一个最简单的过程宏——接收输入，原样返回：

```
// my-macros/src/lib.rs

use proc_macro::TokenStream;

// #[proc_macro_derive(DoNothing)] 声明这是一个 derive 宏，名字叫 DoNothing
#[proc_macro_derive(DoNothing)]
pub fn do_nothing_derive(input: TokenStream) -> TokenStream {
    // 原样返回输入，不做任何修改
    input
}
```

用它：

```
// my-project/src/main.rs
use my_macros::DoNothing;

#[derive(DoNothing)]  // 什么都不做，只是演示结构
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    println!("编译成功！");
}
```

> 注意：以上代码需要在有独立 proc-macro crate 的项目中运行，无法在 Rust Playground 中直接运行。可以用 cargo new my-project 新建项目，然后按上面的结构创建。


## 过程宏能做到什么（预告）

来看几个你已经每天都在用的过程宏：

```
// #[derive(Debug)] 是一个过程宏（编译器内置实现）
// 它读取结构体的字段名和类型，自动生成 Debug 实现
#[derive(Debug, Clone, PartialEq)]
struct User {
    name: String,
    age: u32,
    active: bool,
}

fn main() {
    let u1 = User { name: "Alice".into(), age: 28, active: true };
    let u2 = u1.clone();           // Clone 来自 derive(Clone)
    println!("{:?}", u1);          // Debug 来自 derive(Debug)
    println!("{}", u1 == u2);      // PartialEq 来自 derive(PartialEq)
}
```

这段代码展示的就是过程宏的威力：不需要你手动写三个 trait 的实现，编译器调用内置的过程宏，扫描你的字段，自动生成正确的实现代码。

接下来的几篇文章，你将学会自己写这样的宏。


## 过程宏概念测验
# 从需求出发

## 一个需要手动重复的 trait

假设你有一个日志 trait，要求每种类型都能描述自己的名字：

```
trait Describe {
    fn describe(&self) -> String;
}

struct Point { x: f64, y: f64 }
struct Circle { x: f64, y: f64, radius: f64 }
struct Rectangle { width: f64, height: f64 }

// 为每个类型手动实现——代码完全雷同
impl Describe for Point {
    fn describe(&self) -> String { "Point".to_string() }
}
impl Describe for Circle {
    fn describe(&self) -> String { "Circle".to_string() }
}
impl Describe for Rectangle {
    fn describe(&self) -> String { "Rectangle".to_string() }
}

fn main() {
    println!("{}", Point { x: 0.0, y: 0.0 }.describe()); // Point
    println!("{}", Circle { x: 0.0, y: 0.0, radius: 1.0 }.describe()); // Circle
}
```

这三个实现**逻辑完全相同**：返回类型名字符串。但你不得不为每个类型都写一遍。

如果用自定义 derive 宏，使用时只需写：

```
#[derive(Describe)]
struct Point { x: f64, y: f64 }

// 等价于自动生成：
// impl Describe for Point {
//     fn describe(&self) -> String { "Point".to_string() }
// }
```

## derive 宏做的事：读取结构体名字，生成实现代码

derive 宏在编译时：

- 接收结构体的 `TokenStream`（包含类型名、字段等信息）
- 从中提取**类型名**（`Point`、`Circle`……）
- **生成代码**：`impl Describe for 类型名 { ... }`
- 把生成的代码注入到编译结果中

# 实现步骤

## 项目准备

按照前一章的结构，创建一个 proc-macro crate `my-macros`。

在 `my-macros/Cargo.toml` 中：

```
[package]
name = "my-macros"
version = "0.1.0"
edition = "2021"

[lib]
proc-macro = true

[dependencies]
syn = { version = "2", features = ["full"] }
quote = "1"
```

- `syn`：解析 `TokenStream` 为 Rust 语法树（AST），让你能方便地提取”类型名”等信息
- `quote`：用模板语法生成新的 `TokenStream`，比手动拼接 token 简单得多

有了这两个工具，实现 Describe 宏的思路就清晰了：用 syn 把输入解析成语法树、从中读出类型名，再用 quote 拼出 impl 块返回给编译器。

## 写最简单的 derive 宏

目标：`#[derive(Describe)]` 为类型自动生成 `Describe::describe()` 返回类型名。

```
// my-macros/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(Describe)]
pub fn describe_derive(input: TokenStream) -> TokenStream {
    // 第一步：把 TokenStream 解析成 Rust 语法树
    // DeriveInput 包含了被 derive 的类型的所有信息
    let ast = parse_macro_input!(input as DeriveInput);

    // 第二步：从语法树中提取类型名
    // ast.ident 就是类型的标识符（如 Point、Circle……）
    let name = &ast.ident;
    // name 是 Ident 类型，表示一个标识符，这里是结构体/枚举的名字

    // 第三步：用 quote! 生成实现代码
    // quote! 里可以用 #name 插值，#name 会被替换为实际的类型名
    let expanded = quote! {
        impl Describe for #name {
            fn describe(&self) -> String {
                // stringify! 把标识符转为字符串字面量
                stringify!(#name).to_string()
            }
        }
    };

    // 第四步：把生成的代码转回 TokenStream 返回给编译器
    expanded.into()
}
```

## 在主项目中使用

```
// src/main.rs
use my_macros::Describe;

trait Describe {
    fn describe(&self) -> String;
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
}
```

## 展开后的代码是什么样的

`#[derive(Describe)]` 在 `Point` 上展开后，编译器相当于看到了：

```
struct Point { x: f64, y: f64 }

// 宏自动生成的代码（invisible to user）：
impl Describe for Point {
    fn describe(&self) -> String {
        "Point".to_string()
    }
}
```

宏生成的代码和用户写的代码**并存**——宏不替换原来的结构体定义，只是**额外添加**了 impl 块。

# 提取字段信息

## 访问字段列表

仅仅输出类型名还不够。更多场景需要遍历字段，比如：

- `#[derive(Debug)]` 需要打印每个字段的名字和值
- `#[derive(Serialize)]` 需要把每个字段序列化为 JSON

下面演示如何遍历结构体的字段：

```
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields};

#[proc_macro_derive(FieldNames)]
pub fn field_names_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    // 从 ast.data 里提取字段信息
    let field_names: Vec<String> = match &ast.data {
        // Data::Struct 说明这是一个结构体
        Data::Struct(data_struct) => {
            match &data_struct.fields {
                // 命名字段（如 struct Foo { x: i32, y: i32 }）
                Fields::Named(fields) => {
                    fields.named.iter()
                        .map(|f| f.ident.as_ref().unwrap().to_string())
                        .collect()
                }
                // 其他情况（元组结构体、单元结构体）暂时不处理
                _ => vec![],
            }
        }
        // 如果不是结构体，暂时返回空
        _ => vec![],
    };

    let fields_str = field_names.join(", ");

    let expanded = quote! {
        impl #name {
            pub fn field_names() -> &'static str {
                #fields_str
            }
        }
    };

    expanded.into()
}
```

用法：

```
#[derive(FieldNames)]
struct User {
    name: String,
    email: String,
    age: u32,
}

fn main() {
    println!("{}", User::field_names()); // name, email, age
}
```

## 完整示例：自动生成 Display

下面是一个更实用的例子——自动为只有一个字段的 newtype 结构体生成 `Display`：

```
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Data, Fields};

// #[derive(NewtypeDisplay)] 为 struct Foo(InnerType) 自动实现 Display
// 委托给内部类型的 Display
#[proc_macro_derive(NewtypeDisplay)]
pub fn newtype_display_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;

    // 检查是否是单字段元组结构体
    let is_newtype = matches!(
        &ast.data,
        Data::Struct(s) if matches!(&s.fields, Fields::Unnamed(f) if f.unnamed.len() == 1)
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
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                std::fmt::Display::fmt(&self.0, f)
            }
        }
    }.into()
}
```

> 注意：以上过程宏代码需要在独立的 proc-macro crate 中运行。cargo-expand 工具可以让你看到宏展开后的代码（cargo expand），在调试时很有用。



## derive 宏原理测验

```
// 过程宏代码（在 proc-macro crate 中）
#[proc_macro_derive(MyDerive)]
pub fn my_derive(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;
    quote! {
        impl MyTrait for #name {
            fn hello(&self) { println!("Hello from {}!", stringify!(#name)); }
        }
    }.into()
}
```
# 属性宏的特点

## 与 derive 宏的对比

你已经学会了 derive 宏。现在来看**类属性宏**（Attribute Macro）——它比 derive 宏更灵活，也更强大。

两者的关键区别：

| derive 宏        | 类属性宏            |
| --------------- | --------------- |
| 语法              | #[derive(MyMacro)] | #[my_macro]     | 或               | #[my_macro(args)] |
| 只能用于            | 结构体和枚举          | 任意代码项           | （函数、结构体、枚举、impl 块……） |
| 对原始代码           | 保留              | 原始定义，额外添加代码     | 可以完全替换          | 原始代码项           |
| 接收参数            | 无法直接传参（只能用辅助属性） | 可以通过            | #[macro(key = value)] | 传任意参数           |

以下都是类属性宏的真实例子：

```
// web 框架中标注路由
#[get("/users")]
async fn list_users() -> Vec<User> { ... }

// 追踪函数调用（tracing 库）
#[instrument(skip(password))]
fn login(username: &str, password: &str) -> Result<Token, Error> { ... }

// 测试框架标注异步测试（tokio）
#[tokio::test]
async fn test_database_connection() { ... }
```

## 属性宏的函数签名

属性宏函数接收**两个** `TokenStream`：

```
#[proc_macro_attribute]
pub fn my_attr(
    attr: TokenStream,  // #[my_attr(这里的内容)] ← 属性括号里的参数
    item: TokenStream,  // 被标注的代码项（函数体、结构体定义……）
) -> TokenStream {
    // 返回替换后的代码
}
```

- `attr`：属性括号里的参数，如 `#[route(GET, "/")]` 中的 `GET, "/"` 部分
- `item`：被标注的整个代码项（如函数的完整定义）
- 返回值：**替换** `item` 的新代码（注意：不是追加，而是替换！）

# 实现一个计时属性宏

## 需求：自动统计函数执行时间

你希望写这样的代码：

```
#[timed]
fn slow_computation(n: u64) -> u64 {
    // 模拟耗时计算
    (0..n).sum()
}
```

调用 `slow_computation(1000000)` 时，自动打印：

```
slow_computation 执行耗时：5.2ms
```

不用每个函数都手动加计时代码，宏帮你搞定。

## 实现

属性宏的关键是：接收原始函数，生成一个包含计时逻辑的新函数。

```
// my-macros/src/lib.rs
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn};

#[proc_macro_attribute]
pub fn timed(
    _attr: TokenStream,  // 这个宏不需要参数，忽略 attr
    item: TokenStream,   // 被标注的函数
) -> TokenStream {
    // 把 item 解析为一个函数定义（ItemFn）
    let func = parse_macro_input!(item as ItemFn);

    // 提取函数信息
    let func_name = &func.sig.ident;        // 函数名
    let func_name_str = func_name.to_string(); // 函数名的字符串形式
    let func_vis = &func.vis;               // 可见性（pub、pub(crate) 等）
    let func_sig = &func.sig;               // 完整函数签名（名字、参数、返回类型）
    let func_body = &func.block;            // 函数体

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
}
```

使用时：

```
use my_macros::timed;

#[timed]
fn compute_sum(n: u64) -> u64 {
    (0..n).sum()
}

fn main() {
    let result = compute_sum(10_000_000);
    println!("结果：{}", result);
    // 输出：
    // compute_sum 执行耗时：15.3ms
    // 结果：49999995000000
}
```

展开后，宏生成的代码相当于：

```
fn compute_sum(n: u64) -> u64 {
    let __start = std::time::Instant::now();
    let __result = (|| {
        (0..n).sum()  // 原函数体
    })();
    let __elapsed = __start.elapsed();
    println!("compute_sum 执行耗时：{:.1}ms", __elapsed.as_secs_f64() * 1000.0);
    __result
}
```

# 带参数的属性宏

## 接收和解析参数

属性宏可以通过 `#[my_macro(param)]` 传入参数，通过第一个 `attr: TokenStream` 接收。

下面实现一个 `#[retry(n)]` 宏——自动在函数失败时重试 n 次：

```
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn, LitInt};

#[proc_macro_attribute]
pub fn retry(
    attr: TokenStream, // 接收括号里的参数，如 retry(3) 里的 "3"
    item: TokenStream,
) -> TokenStream {
    // 把参数解析为一个整数字面量
    let retry_count = parse_macro_input!(attr as LitInt);
    let count: u64 = retry_count.base10_parse().unwrap_or(3);

    let func = parse_macro_input!(item as ItemFn);
    let func_name = &func.sig.ident;
    let func_vis = &func.vis;
    let func_sig = &func.sig;
    let func_body = &func.block;

    quote! {
        #func_vis #func_sig {
            let mut __attempts = 0u64;
            loop {
                let __result = (|| #func_body)();
                match __result {
                    Ok(v) => return Ok(v),
                    Err(e) => {
                        __attempts += 1;
                        if __attempts >= #count {
                            eprintln!("{} 重试 {} 次后失败", stringify!(#func_name), #count);
                            return Err(e);
                        }
                        eprintln!("{} 第 {} 次失败，重试中...", stringify!(#func_name), __attempts);
                    }
                }
            }
        }
    }.into()
}
```

使用时：

```
use my_macros::retry;

#[retry(3)]  // 最多重试 3 次
fn fetch_data(url: &str) -> Result<String, String> {
    // 模拟可能失败的操作
    Err(format!("连接 {} 失败", url))
}

fn main() {
    match fetch_data("https://example.com") {
        Ok(data) => println!("数据：{}", data),
        Err(e) => println!("最终失败：{}", e),
    }
    // 输出：
    // fetch_data 第 1 次失败，重试中...
    // fetch_data 第 2 次失败，重试中...
    // fetch_data 重试 3 次后失败
    // 最终失败：连接 https://example.com 失败
}
```


## 类属性宏测验

```
// 假设宏实现如下：
#[proc_macro_attribute]
pub fn log_call(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let func = parse_macro_input!(item as ItemFn);
    let name = func.sig.ident.to_string();
    let vis = &func.vis;
    let sig = &func.sig;
    let body = &func.block;
    quote! {
        #vis #sig {
            println!("调用：{}", #name);
            #body
        }
    }.into()
}

// 使用宏标注函数：
#[log_call]
fn greet(name: &str) {
    println!("你好，{}", name);
}
```
# 类函数宏的形式

## 三种宏的外观对比

你现在认识了三种宏，它们看起来是：

```
// 1. 声明宏（macro_rules!）
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
html! { <div class="main">Hello</div> }
```

**类函数宏**（Function-like Macro）看起来像普通函数调用（加 `!`），但它的括号里可以是**任意 token 序列**，不需要是合法的 Rust 表达式。

`sql!(SELECT * FROM users)` 这行代码括号里的内容是 SQL，不是 Rust。声明宏和普通函数都做不到接受这样的输入——类函数过程宏可以。

## 与 macro_rules! 的区别

| macro_rules!    | 类函数过程宏          |
| --------------- | --------------- |
| 实现方式            | 模式匹配规则          | 任意 Rust 代码逻辑    |
| 能力              | 受限于模式匹配         | 可以做任意分析和生成      |
| 错误信息            | 有时难以理解          | 可以自定义精确错误位置     |
| 调试              | 难调试             | 是正常的 Rust 函数，可以 println! 调试 |
| 适用场景            | 简单重复模式          | 复杂解析、编译时验证、DSL  |

## 函数签名

类函数宏只接收一个 `TokenStream`：

```
#[proc_macro]
pub fn my_macro(input: TokenStream) -> TokenStream {
    // input 是括号里的所有 token
    // 返回值是展开后的代码
    input
}
```

注意 `#[proc_macro]` 而不是 `#[proc_macro_derive]` 或 `#[proc_macro_attribute]`。

# 实现一个 HTML 生成宏

## 目标

实现一个简单的 `html!` 宏，把类似 HTML 的语法转换为字符串拼接代码：

```
let output = html!(div "container" { "Hello, " strong { "World" } "!" });
// 生成：<div class="container">Hello, <strong>World</strong>!</div>
```

真正的 `html!` 宏（如 `yew` 框架的）非常复杂。这里实现一个简化版，重点学习类函数宏的结构。

## 简化版实现：编译时验证数学表达式

先从更简单的例子开始——一个 `assert_positive!` 宏，在编译时检查字面量是否为正数：

```
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitInt};

// assert_positive!(42)    → 编译通过
// assert_positive!(-1)    → 编译错误（但 i32 字面量不能是负数，所以这个例子需要调整）
// assert_positive!(0)     → 编译错误：0 不是正数

#[proc_macro]
pub fn assert_positive(input: TokenStream) -> TokenStream {
    // 解析输入为整数字面量
    let lit = parse_macro_input!(input as LitInt);
    let value: i64 = lit.base10_parse().expect("需要整数字面量");

    if value <= 0 {
        // 返回编译错误
        return quote! {
            compile_error!("assert_positive! 需要正整数");
        }.into();
    }

    // 编译通过，生成值本身的代码
    let u = value as u64;
    quote! { #u }.into()
}
```

使用时：

```
use my_macros::assert_positive;

fn main() {
    let n = assert_positive!(42);   // ✅ 编译时确认 42 > 0
    println!("{}", n);              // 42
    
    // let m = assert_positive!(0); // ❌ 编译错误：assert_positive! 需要正整数
}
```

这个宏虽然简单，但演示了核心能力：**在编译时验证数据的合法性**，违法时给出清晰错误，比运行时的 `assert!` 更早发现问题。

## 实现一个格式验证宏（checked_parse）

下面实现一个更实用的宏：在编译时验证字符串是否是合法的格式：

```
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitStr};

// 检查 IP 地址格式（编译时）
#[proc_macro]
pub fn ip(input: TokenStream) -> TokenStream {
    let lit = parse_macro_input!(input as LitStr);
    let value = lit.value();

    // 在编译时解析 IP 地址——如果格式不对，编译报错
    let parsed: Result<std::net::IpAddr, _> = value.parse();
    match parsed {
        Ok(_) => {
            // 合法 IP，生成解析表达式
            quote! {
                #lit.parse::<std::net::IpAddr>().unwrap()
            }.into()
        }
        Err(_) => {
            // 非法 IP，编译时报错，并精确指向这个宏调用的位置
            let msg = format!("非法的 IP 地址：{}", value);
            quote! {
                compile_error!(#msg)
            }.into()
        }
    }
}
```

使用时：

```
use my_macros::ip;

fn main() {
    let addr = ip!("192.168.1.1");   // ✅ 编译时验证通过
    println!("{}", addr);            // 192.168.1.1

    // let bad = ip!("999.999.0.0"); // ❌ 编译错误：非法的 IP 地址：999.999.0.0
    // let bad2 = ip!("localhost");  // ❌ 编译错误：非法的 IP 地址：localhost
}
```

这是类函数过程宏的经典用途：**把运行时才会发现的错误，提前到编译时报告**。

## 实现一个 SQL 模板宏（简化版）

真实框架中 `sqlx` 的 `query!` 宏会在编译时连接数据库验证 SQL。这里实现一个简化版，只验证 SQL 语法关键字：

```
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitStr};

// sql!("SELECT * FROM users") → 生成字符串常量，同时验证以 SELECT/INSERT/UPDATE/DELETE 开头
#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
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
}
```

使用时：

```
use my_macros::sql;

fn main() {
    let q = sql!("SELECT * FROM users WHERE id = 1");  // ✅
    println!("执行查询：{}", q);

    // let bad = sql!("HACK users SET admin = true");  // ❌ 编译错误
}
```


## 类函数宏测验

```
#[proc_macro]
pub fn double(input: TokenStream) -> TokenStream {
    let lit = parse_macro_input!(input as LitInt);
    let value: u64 = lit.base10_parse().unwrap();
    let doubled = value * 2;
    quote! { #doubled }.into()
}
```