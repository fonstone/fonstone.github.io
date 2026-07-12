---
title: "所有权系统"
description: "理解栈与堆、所有权规则、移动语义、引用与借用、切片类型"
date: "2026-07-12"
order: 3
tags: ["所有权", "借用", "引用", "切片"]
est_time: "60 分钟"
---

所有权是 Rust 最核心也最独特的特性——它让 Rust 在没有垃圾回收器的情况下保证内存安全。这不是一个孤立的概念，而是一套贯穿整个语言的规则体系，从变量赋值到函数调用，无处不在。

理解所有权需要先理解 Rust 的内存模型。本章从栈与堆的区别出发，逐步展开所有权规则、引用与借用、切片等核心概念。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 栈与堆的区别，移动、拷贝与克隆三种数据交互方式 |                 |
| 所有权三条规则、变量作用域与 String 类型的所有权交互 |                 |
| 不转移所有权地使用数据，可变引用与借用规则 |                 |
| 对序列数据的局部引用，字符串切片与数组切片 |                 |
| 运用所有权、引用与切片解决实际问题 |                 |
# 内存基础：栈与堆

Rust 中的所有权系统根本上是在管理数据在内存中的位置和生命周期。要理解所有权，必须先知道栈（Stack）和堆（Heap）的区别。

## 栈（Stack）

栈用于存放函数调用的栈帧和那些**大小在编译期已知的小数据**（例如整数、布尔、固定大小的数组、指针元信息等）。栈的分配与释放遵循 LIFO（后进先出），速度很快且不需要运行时的分配器，但栈空间有限，无法直接保存运行时大小可变的数据。

![Stack diagram](/images/rust/stack.svg)
## 堆（Heap）

堆用于动态分配**大小不确定或较大的数据**（例如 `String`、`Vec<T>`、Box 指向的值等）。堆上的内存通过分配器（allocator）管理，分配/释放成本较高，且需要通过所有权或智能指针在程序中跟踪谁负责释放这块内存。

![Heap diagram](/images/rust/heap.svg)
## 栈与堆的配合：以 String 为例

栈存放**大小编译期已知**的数据，堆存放**大小运行时可变**的数据——但实际应用中，如果需要使用到堆，往往两者都要用到。让我们用 `String` 类型来看看它们如何配合：

```
fn main() {
    let s = String::from("hello");
    // s 是什么存在栈上？整个字符串内容在哪？
}
```

### String 的内存结构

`String` 在栈上只存**三个字**：

- **ptr**：指向堆上数据的指针
- **len**：当前字符串的字节数（这里是 5）
- **capacity**：堆上已分配内存能容纳的最大字节数（通常 ≥ len）

真正的字符数据 `"HelloWorld"` 存在**堆上**，通过 `ptr` 指针来访问。

![String memory layout](/images/rust/string.svg)
### from() 和 push_str() 做了什么

这两个操作涉及不同的内存变化：

```
fn main() {
    let mut s = String::from("hello");
    println!("len: {}, capacity: {}", s.len(), s.capacity());

    s.push_str(", world!");
    println!("len: {}, capacity: {}", s.len(), s.capacity());
}
```

-
`String::from("hello")`：

- 从只读数据区读取字面量 `"hello"`
- 在堆上分配新空间
- 复制内容到堆上
- 在栈上创建 String 结构体指向这块堆内存

-
`push_str(", world!")`：

- 检查当前容量是否足够
- 若容量不足，重新在堆上分配更大的空间，移动旧数据过去
- 追加新内容
- 更新 len（容量 capacity 可能也会改变）


![String operations](/images/rust/string_opration.svg)
# 数据流动的三种方式

理解了栈与堆的区别，现在来看 Rust 里数据在变量之间”流动”时会发生什么。这是初学者最常卡住的地方——同样是 `let b = a` 这行代码，对整数和对 `String` 的行为截然不同。

## 移动（Move）

![Heap diagram](/images/rust/move.svg)
当你把一个 `String` 赋值给另一个变量时，发生了什么？

```
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // s1 的所有权移动给 s2，s1 从这里开始无效
    println!("{}", s2);
}
```

Rust 把 `s1` 栈上的三元组（ptr, len, capacity）**拷贝**给了 `s2`，然后**让 **`s1`** 失效**——这个操作叫做**移动**（move）。注意：堆上的数据没有被复制，只是所有权换手了。

这样就解决了**二次释放**（double free）问题：现在只有 `s2` 是有效的，只有它离开作用域时才会释放内存。

下面这段代码无法编译——点”运行”看看错误信息长什么样：

```
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;           // 所有权已转移给 s2
    println!("{}", s1);    // 错误：s1 已失效（moved）
}
```

## 拷贝（Copy）：栈类型的隐式复制

![Heap diagram](/images/rust/copy.svg)
整数、布尔、浮点、字符等类型存在栈上，大小固定，复制成本极低。Rust 对这类类型自动进行**按值复制**（copy），不会让原变量失效：

```
fn main() {
    let x = 5;
    let y = x; // x 被复制，不是移动
    println!("x = {}, y = {}", x, y); // 两个都有效
}
```

实现了 `Copy` 特征的类型在赋值后原变量仍然有效。常见的 Copy 类型：

- 所有整数类型：`i32`、`u64` 等
- 浮点类型：`f32`、`f64`
- 布尔类型：`bool`
- 字符类型：`char`
- 元组，当所有字段都是 Copy 类型时，如 `(i32, bool)`

`String`、`Vec` 等堆分配类型**不是** Copy 类型，赋值时会发生移动。

## 克隆（Clone）：真正的深拷贝

![Heap diagram](/images/rust/clone.svg)
如果确实需要两份独立的数据，用 `.clone()`：

```
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // 堆上数据被完整复制
    println!("s1 = {}, s2 = {}", s1, s2); // 两个都有效
}
```

`.clone()` 是明显的”重操作”提示——堆内存被完整复制，会有性能开销。Rust 故意让这个操作显式，让你知道”这里有成本”。

## 三种方式对比

| 操作              | 发生条件            | 原变量是否失效         | 是否复制堆数据         |
| --------------- | --------------- | --------------- | --------------- |
| 移动（Move）        | 堆分配类型赋值/传参      | ❌ 失效            | 否（只复制栈上元数据）     |
| 复制（Copy）        | 栈类型（实现 Copy 特征） | ✅ 仍有效           | 不涉及堆数据          |
| 克隆（Clone）       | 显式调用            | .clone()        | ✅ 仍有效           | ✅ 是（深拷贝）        |

```
fn main() {
    // Copy 类型：赋值后双方都有效
    let a = 42_i32;
    let b = a;
    println!("a={}, b={}", a, b);

    // 移动类型：赋值后原变量失效
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s2); // s1 已失效，只能用 s2

    // 显式克隆：保留原变量，堆数据被完整复制
    let s3 = String::from("world");
    let s4 = s3.clone();
    println!("s3={}, s4={}", s3, s4);
}
```

## 快速判断

**判断一个类型是 Move 还是 Copy 的快捷方法**：

- 如果它需要在堆上分配内存（`String`、`Vec`、`Box` 等），通常是 Move
- 如果它只存在栈上（整数、浮点、布尔、char、小元组），通常是 Copy

> 使用=通常都是 Move 或者 Cpoy，如果要使用 Clone，通常都是调用.clone()的形式


## 移动 vs 浅拷贝

在其他语言里，“浅拷贝”只复制指针和元数据，不复制堆数据。Rust 的”移动”在底层做了同样的事，但额外做了一步：**让原变量无效**。

为什么叫”移动”而不是”浅拷贝”？因为移动强调的是**所有权的转移**——数据从一个所有者”流动”到了另一个所有者，而浅拷贝只描述了物理上复制了什么。Rust 的移动语义保证了内存安全：永远不会出现两个有效变量同时指向同一块堆数据。

# 练习题

## 移动与复制测验

```
fn main() {
    let x = 10;
    let y = x;
    println!("{}", x);
}
```

```
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s1);
}
```

## Copy 类型测验
# 核心思想

## 什么是所有权系统

**所有权系统**是 Rust 用来管理内存的核心机制。它的基本思想很简单：**每个值都有一个所有者负责它的生命周期**。

这听起来抽象，但解决的是一个现实问题：

在其他编程语言中：

- **Java/Python**：用垃圾回收器（GC）自动清理，但有运行时开销，暂停不可控
- **C/C++**：程序员手动管理内存（`malloc`/`free`），容易出现内存泄漏、悬垂指针、二次释放等 bug

Rust 的答案是：**在编译时通过静态分析，让编译器确保只有一个所有者负责释放每个值，从而零运行时开销地保证内存安全**。

> 易混淆概念澄清：所有权（ownership）和可变性（mutability）是两个完全独立的概念。

> - 所有权：回答的问题是”谁负责释放这个值？”
> - 可变性：回答的问题是”这个值能否被修改？”

> 一个不可变的变量可以转移所有权给可变的变量；一个可变的变量也可以被销毁而不修改。它们没有必然关系。


## 三条黄金规则

所有权系统的核心思想只有三条规则。理解它们，一切都能推导出来：

**规则一**：**Rust 中每一个值都有一个「所有者（owner）」变量。**

**规则二**：**值在任一时刻有且只有一个所有者。**

**规则三**：**当所有者离开作用域，这个值将被「自动丢弃（drop）」**

这三条规则一起工作，确保：

- ✓ 没有内存泄漏（规则三：自动清理）
- ✓ 没有二次释放（规则二：只有一个所有者）
- ✓ 没有悬垂指针（规则三：所有者消失时数据也消失）
- ✓ 零运行时开销（规则一：编译期静态检查）

# 规则详解

## 规则一与二：所有者与单一性

### 问题背景：二次释放

先看一个问题。在 C 中，如果你不小心这样做：

```
// C 语言中的问题
char* s1 = malloc(100);
char* s2 = s1;      // 两个指针指向同一块内存

free(s1);           // 释放一次
free(s2);           // 释放第二次 → 二次释放 bug！内存崩溃
```

或者在没有 GC 的环境中：

```
s1 指向堆上的数据 → s1 被释放了
s2 仍然指向那块内存 → s2 成了悬垂指针
访问 s2 → 使用已释放的内存 → 未定义行为
```

这是内存安全的大敌：**同一块内存被释放多次，或者被释放后还被访问**。

### Rust 的解决方案

Rust 通过规则一和规则二直接禁止这种情况：

> 不允许两个变量同时有效地指向同一块堆数据


如果一个变量要把数据的控制权交给另一个变量，那就**转移所有权**——原变量失效，新变量成为唯一的所有者。这样：

- ✓ 永远只有一个所有者，只释放一次
- ✓ 原变量失效后无法访问，不存在悬垂指针
- ✓ 编译器在编译期就检查这一点，运行时零开销

看具体例子：

每个值都需要一个”主人”来负责它，而且只能有一个主人。当主人改变时，所有权就转移了：

```
fn main() {
    let s1 = String::from("hello");  // s1 拥有这个 String

    let s2 = s1;                      // 所有权转移给 s2
                                      // 现在 s2 是主人，s1 失效了

    println!("{}", s2);               // ✓ 可以，s2 拥有数据
    // println!("{}", s1);            // ✗ 错误，s1 已失效
}
```

**这里发生了什么**：

- `s1` 原本拥有 String 数据的所有权
- `let s2 = s1` 执行时，所有权转移给 `s2`
- `s1` 从这一刻起**失效**了（Rust 编译器禁止访问，因此也不能再通过它去做释放了）
- 只有 `s2` 可以访问数据，作用域结束时 `s2` 负责释放

**为什么 **`s1`** 会失效**？因为 `String` 存在堆上，有释放的成本。Rust 不允许两个变量同时指向同一块堆数据，否则就回到了”谁来释放”的问题上。

**栈类型是个例外**。整数这样的小数据存在栈上，复制成本极低，Rust 自动为它们复制而不是移动（可以再回忆下上一篇文章讲的三种数据流动方式）：

```
fn main() {
    let x = 5;
    let y = x;              // 自动复制

    println!("x={}, y={}", x, y);  // ✓ 两个都有效
}
```

## 规则三：作用域与自动释放

当一个变量离开作用域，它的值自动被释放（drop）。这就是 Rust 不需要手动 `free` 的原因（因此避免了手动释放的安全风险）：

```
fn main() {
    {
        let s = String::from("hello");  // s 从这里开始有效
        println!("{}", s);
    }  // s 离开作用域，Rust 自动调用 drop，堆内存被释放

    // s 已不存在，访问会报错
}
```

对比其他语言：

- Java：GC 在某个时间点清理（时机不确定）
- C：需要手动 `free`（容易忘记）
- Rust：作用域结束立即释放（确定且无开销）

# 所有权转移

## 什么是所有权转移？

前面讲了三条所有权规则，但有个关键概念还没深入：**当一个值从一个所有者转到另一个所有者时会发生什么**？

这就是**所有权转移**（move）——一个值的所有权从一个变量转移到另一个变量。这是 Rust 实现规则二（“值在任一时刻有且只有一个所有者”）的核心机制。

## 为什么要理解所有权转移？

回顾前面讲过的：

- **规则二** 说：一个值永远只能有一个所有者
- 这意味着：**当多个变量都想”拥有”同一个值时，Rust 不允许**
- Rust 的解决方案：**让原所有者失效，新变量成为唯一的所有者**

所有权转移就是这个”转移”过程。理解它，才能理解 Rust 如何在编译期保证内存安全。

**核心原则**：只要一个值被”消费”了（被移动到新的所有者），所有权就转移。原所有者从此失效。这发生在以下场景：

### 场景一：赋值

```
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;  // s1 的所有权转移给 s2

    println!("{}", s2);  // ✓ 可以
    // println!("{}", s1);  // ✗ 错误：s1 已失效
}
```

### 场景二：函数传参

```
fn main() {
    let s = String::from("hello");
    takes_ownership(s);  // s 的所有权转移到函数内
    // println!("{}", s);  // ✗ 错误：s 已失效
}

fn takes_ownership(s: String) {
    println!("{}", s);
}  // s 离开作用域，堆内存释放
```

### 场景三：函数返回

```
fn main() {
    let s1 = gives_ownership();  // 函数返回的 String 所有权转给 s1
    println!("{}", s1);
}

fn gives_ownership() -> String {
    let s = String::from("yours");
    s  // 返回 s，所有权转移给调用者
}
```

### 其他场景

模式匹配、match 表达式、for 循环、闭包捕获等也都会转移所有权：

```
fn main() {
    // 模式匹配
    let s = String::from("hello");
    let (a, b) = ("x", s);  // s 的所有权转移到模式中

    // match 表达式
    match b {
        _ => println!("{}", b),  // b 被消费
    }
    // println!("{}", b);  // ✗ 错误：b 已失效

    // for 循环
    let vec = vec![1, 2, 3];
    for item in vec {  // vec 的所有权被转移到迭代器
        println!("{}", item);
    }
    // println!("{:?}", vec);  // ✗ 错误：vec 已失效
}
```

## 注意：Copy 类型不转移所有权

**并非所有类型都会转移所有权！** 对于栈类型（整数、布尔等），Rust 会自动复制而不是转移：

```
fn main() {
    // 赋值时复制
    let x = 5;
    let y = x;  // 自动复制，不转移所有权
    println!("x={}, y={}", x, y);  // ✓ 两个都有效

    // 函数传参时复制
    let a = 42;
    print_number(a);  // 自动复制，a 仍有效
    println!("a={}", a);  // ✓ 有效

    // 函数返回时复制
    let b = get_number();  // 自动复制
    println!("b={}", b);
}

fn print_number(x: i32) {
    println!("{}", x);
}

fn get_number() -> i32 {
    42  // 自动复制给调用者
}
```

**为什么**？因为这些类型实现了 `Copy` 特征——它们存在栈上，复制成本极低，所以 Rust 默认复制而不转移。也就是说之前讲解过的三种数据流动形式中只有 Move 才会进行所有权转移。

## 对比：String vs i32

看一个更清晰的对比：

```
fn main() {
    // String：堆类型，转移所有权
    let s1 = String::from("hello");
    let s2 = s1;
    // println!("{}", s1);  // ✗ s1 已失效

    // i32：栈类型，自动复制
    let n1 = 42;
    let n2 = n1;
    println!("n1={}, n2={}", n1, n2);  // ✓ 都有效
}
```

| String（堆）       | i32（栈）          |
| --------------- | --------------- |
| let b = a       | 转移所有权，a 失效      | 复制值，a 仍有效       |
| func(a)         | 转移所有权，a 失效      | 复制值，a 仍有效       |
| return a        | 转移所有权给调用者       | 复制值给调用者         |

这样虽然工作，但对于堆类型频繁地”传进去再返回”很烦。Rust 提供了更优雅的方案——**引用**（下一篇的主题）。

# 所有权系统的作用

你可能想：所有权系统这么复杂，是不是只有堆类型才需要？**不是的。** 所有权系统的作用远不止管理堆内存。

## 所有权不只是堆的问题

即使程序中完全不用堆，所有权系统仍然有用：

```
fn main() {
    // 栈类型，全是 Copy
    let x = 5;
    let y = x;  // 复制

    println!("x={}, y={}", x, y);  // 都有效
}
```

这里没有堆，没有内存释放的复杂性，但**所有权规则仍然在保护你**——保护的是**变量的生命周期和使用范围**：

```
fn main() {
    {
        let x = 5;  // x 从这里开始有效
        println!("{}", x);  // ✓ 有效
    }  // x 离开作用域，失效

    // println!("{}", x);  // ✗ 错误：x 已无效，编译器阻止你访问
}
```

对于栈类型，所有权规则保护你的是：

- **确定的作用域**：变量在出作用域时自动失效，不会有悬垂变量
- **清晰的生命周期**：一眼看出变量何时存在、何时消失
- **防止意外使用**：即使是栈变量，也不能超出作用域使用

## 所有权的真正作用

所有权系统的核心不是”防止内存泄漏”，而是**确保资源的唯一管理者**。这涵盖的远不止内存：

### 1. **规范资源的生命周期**

```
fn main() {
    let file = std::fs::File::open("test.txt").ok();  // 打开文件资源

    // file 离开作用域时，文件自动关闭（不是泄漏）
}
```

文件、网络连接、互斥锁等**非内存资源**也需要确定的生命周期。所有权系统保证了这一点。

### 2. **防止数据竞争**

```
fn main() {
    let data = vec![1, 2, 3];

    // 只能有一个所有者，保证同一时刻只有一个地方修改数据
    // 这是 Rust 无需 GC 也能保证线程安全的原因
}
```

多个所有者 = 可能的数据竞争。Rust 通过所有权规则完全消除了这个问题。

### 3. **明确责任**

```
fn main() {
    let s = String::from("hello");
    // 一眼看出：谁负责清理这个 String？就是 s
}
```

对比其他语言：在共享指针或 GC 环境中，你永远不知道谁负责清理。Rust 中，**所有权明确说明了责任**。

## 总结：所有权的三大价值

| 价值              | 作用              | 例子              |
| --------------- | --------------- | --------------- |
| 内存安全            | 防止悬垂指针、二次释放、内存泄漏 | String、Vec      |
| 资源安全            | 确保文件、锁等资源的确定释放  | 文件、Mutex        |
| 并发安全            | 编译期防止数据竞争，无需原子操作或锁 | 多线程代码           |

所以，所有权系统的用处不是”只用堆才有用”，而是**贯穿整个程序，保证所有资源的安全管理**。


## 所有权规则测验

```
fn main() {
    let s1 = String::from("rust");
    let s2 = s1;
    println!("{}", s1);
}
```

## 所有权转移的场景判断

## Copy vs Move

```
fn main() {
    let a = 42;
    let b = a;
    let s1 = String::from("hi");
    let s2 = s1;
}
```

## 作用域与 Drop

```
fn main() {
    {
        let s = String::from("hello");
        println!("{}", s);
    }
}
```

## 栈类型的所有权保护

```
fn main() {
    let x = 10;
    {
        let y = x;  // 复制，因为 i32 是 Copy
        // y 是 x 的一个独立副本
    }
    println!("{}", x);  // ✓ 可以，x 仍有效
}
```

## 所有权与可变性的独立性

```
fn main() {
    let immutable = String::from("hello");  // 不可变，但有所有权
    let mut mutable = immutable;             // 可变，获得所有权
    mutable.push_str("!");                   // ✓ 可以修改
    // println!("{}", immutable);             // ✗ 错误，所有权已转移
}
```

## 编程练习：修复所有权错误

下面的代码有所有权错误，请修复它，使输出为 `s1 = hello, s2 = hello`。

```
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("s1 = {}, s2 = {}", s1, s2);
}
```

**提示**：想想上一章讲过的”三种数据流动方式”，怎样才能让 s1 和 s2 都有效？

---
下面的代码没有正确接收函数返回的所有权，请修复它使其能正常输出。

```
fn create_string() -> String {
    String::from("hello")
}

fn main() {
    create_string();  // 这里没有接收返回值
    println!("{}", s);  // s 没有被定义
}
```

**提示**：函数返回一个 String，调用者需要用变量接收它。所有权会从函数转移到这个接收变量。
# 引用概述

上一篇讲了所有权转移，但有个问题：每次函数调用都转移所有权会很麻烦。

```
fn main() {
    let s1 = String::from("hello");
    let (s2, len) = calculate_length(s1); // s1 被转移进函数
    println!("'{}' 的长度是 {}", s2, len);
}

fn calculate_length(s: String) -> (String, usize) {
    let length = s.len();
    (s, length) // 必须把 s 一起返回，否则这里 } 会将其销毁，调用者（main）再也拿不到它
}
```

为了在函数返回后还能使用 `s1`，不得不把它连同结果一起装进元组返回。这太繁琐了。

有没有办法让函数**临时借用**数据，查看一下，然后让调用者继续拥有它？答案就是**引用**（reference）。

## 什么是引用

**引用**（reference）是一个指向值的指针，但它**不拥有这个值**。（**引用本质是指针**）

创建引用的行为叫做**借用**（borrowing）——就像借别人的书，看完要还，而且你不是主人。（**借用本质是动作**）

使用引用的语法很简单，加一个 `&`：

```
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1); // 传引用，s1 所有权不变
    println!("'{}' 的长度是 {}", s1, len); // s1 仍然有效！
}

fn calculate_length(s: &String) -> usize { // 参数是引用
    s.len()
} // s 离开作用域，但它只是引用，不拥有数据，什么都不发生
```

`&s1` 创建了一个指向 `s1` 的引用。当引用离开作用域时，被引用的数据**不会被释放**，因为引用不拥有这些数据——所有权还在 `s1` 手里。

# 引用的可变性

## 不可变引用

引用默认是**不可变的**——通过引用只能**读取**数据，不能**修改**：

```
fn main() {
    let s = String::from("hello");
    change(&s);
}

fn change(s: &String) {
    s.push_str(", world"); // 错误：不可变引用不能修改数据
}
```

这和变量的默认行为一致：`let` 绑定默认不可变，`&T` 也默认不可变。

> 原变量是否 mut 和引用是否 &mut 互不影响：即使原变量声明了 let mut，&s 默认仍然是不可变引用（必须显式写 &mut s 才能创建可变引用）


## 可变引用

如果需要通过引用**修改**数据，引用本身也需要是可变的。使用**可变引用** `&mut T`。

创建和使用可变引用需要三处配合：

```
fn main() {
    let mut s = String::from("hello"); // 1. 原变量必须声明为 mut

    change(&mut s); // 2. 传参时用 &mut
    println!("{}", s);
}

fn change(s: &mut String) { // 3. 参数类型是 &mut String
    s.push_str(", world");
}
```

三处缺一不可。比如原变量不是 `mut`，编译器会直接报错：

```
fn main() {
    let s = String::from("hello"); // 没有 mut
    change(&mut s); // 错误：不能从不可变变量创建可变引用
}

fn change(s: &mut String) {
    s.push_str(", world");
}
```

> 重要：函数签名是一个契约。即使函数实现里没有实际修改数据，只要签名声明了 &mut T，调用者就必须传入可变引用。编译器不会根据函数体的实际行为来”宽松”处理。这是为了让调用者只看签名就清楚地知道这个函数可能会修改数据。


# 借用的两条核心规则

Rust 针对引用有两条核心规则限制。它们是 Rust 借用系统的基础：

> 规则一：在任意给定时间，要么只能有任意数量的不可变引用，要么只能有一个可变引用。两者不能同时存在。

> 规则二：引用必须总是有效的，不能指向已释放的数据。


## 规则一详解：排他性与多重共享

### 情况一：多个不可变引用可以共存

不可变引用可以同时有很多个，因为只读操作之间互不干扰：

```
fn main() {
    let s = String::from("hello");

    let r1 = &s;
    let r2 = &s;
    let r3 = &s; // 完全没问题，可以有任意多个不可变引用

    println!("{}, {}, {}", r1, r2, r3);
    println!("原始值仍然有效：{}", s);
}
```

> 如果是多个不可变引用，那么原数据可以被正常访问。即使原数据是 let mut 声明的，在不可变引用活跃期间，也可以通过原变量读取（因为读取不会违反”只读”的约束），但不能修改。


### 情况二：同一时间只能有一个可变引用

可变引用有个重要限制：**对同一数据，同一时间只能有一个活跃的可变引用**：

```
fn main() {
    let mut s = String::from("hello");

    let r1 = &mut s;
    let r2 = &mut s; // 错误！s 已经被可变借用了

    println!("{}, {}", r1, r2);
}
```

**为什么有这个限制**？想象两个人同时修改同一份文件——谁的改动会最终被保存？结果不可预测。这就是**数据竞争**（data race）——两个或更多指针同时访问同一数据，且至少有一个在写入，且没有同步机制。数据竞争导致未定义行为，极难调试。

Rust 直接在编译期**禁止一切有数据竞争风险的代码**。

### 情况三：不可变引用与可变引用不能共存

当已经有不可变引用时，不能创建可变引用：

```
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;        // 不可变引用
    let r2 = &s;        // 不可变引用，没问题
    let r3 = &mut s;    // 错误！r1 和 r2 还活着

    println!("{}, {}, {}", r1, r2, r3);
}
```

想象你正在读一份文件（不可变引用），同时另一个人正在修改它（可变引用）——你读到的内容就可能前后矛盾。

### 错开引用的使用（NLL）

关键是不能**同时活跃**。如果一个引用已经不再使用，就可以创建新的（包括可变的）引用。

Rust 编译器能智能判断引用**最后一次使用**的位置。引用的有效范围只到最后一次使用处为止，而不是到块的右花括号。这叫做**非词法作用域生命周期**（Non-Lexical Lifetimes，NLL）。

正因如此，下面的代码是合法的：

```
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;
    let r2 = &s;
    println!("{} 和 {}", r1, r2);
    // r1、r2 在这里是最后一次使用，借用到此结束

    let r3 = &mut s; // 合法！r1 和 r2 的借用已经结束
    r3.push_str(", world");
    println!("{}", r3);
    // r3 的借用到这里结束

    // r3 使用完后，还能再创建不可变引用
    let r4 = &s;
    let r5 = &s;
    println!("最后读取：{}, {}", r4, r5);
}
```

r1 和 r2 在 `println!` 之后就不再使用了，所以它们的借用在那时就结束了。虽然块的右花括号还在下面，但 r3 可以创建可变引用，因为 r1、r2 已经不活跃了。

同样，多个可变引用也可以错开使用：

```
fn main() {
    let mut s = String::from("hello");

    {
        let r1 = &mut s;
        r1.push_str(" world");
        println!("内部作用域：{}", r1);
    } // r1 在这里结束，借用被释放

    let r2 = &mut s; // 现在可以创建新的可变引用
    r2.push_str("!");
    println!("最终：{}", r2);
}
```

## 规则二详解：有效性

在有指针的语言中，很容易写出**悬垂指针**——指针指向的内存已被释放，但指针还在。

```
fn main() {
    let r = dangle();
}

fn dangle() -> &String { // 试图返回字符串的引用
    let s = String::from("hello");
    &s // 返回 s 的引用
} // s 在这里离开作用域被释放，但引用指向的内存已不存在！
```

编译器报错，提示返回值借用了一个在函数结束时就会被释放的值。

**解决方案**很简单：直接返回 `String` 本身，把所有权转移出去：

```
fn main() {
    let s = no_dangle();
    println!("{}", s);
}

fn no_dangle() -> String {
    let s = String::from("hello");
    s // 返回 s，所有权转移给调用者，s 本身不会被释放
}
```

# 小结与回顾

我们已经学习了所有权、借用与可变性等核心概念。让我们通过类比和完整的例子来理解它们的区别和互动。

## 类比：你对一本书的权利

假设有一本书，我们可以用”书的权利”来比喻 Rust 中的核心概念：

| 权利类型            | 类比              | Rust 术语         | 代码              | 能做什么            |
| --------------- | --------------- | --------------- | --------------- | --------------- |
| 完全所有权           | 你买了这本书，可以做任何事   | 变量所有权           | let mut s       | 所有者             | 读、改、转移、销毁       |
| 所有权转移           | 你把这本书给了朋友，现在是他的了 | 赋值/函数参数         | let s2 = s1     | 新所有者            | 只有新所有者能读改，原主人无权访问 |
| 临时阅读权           | 朋友借你的书去看（不能改）   | 不可变引用           | &s              | 借用者             | 只能读             |
| 临时编辑权           | 朋友借你的书做笔记（可以改）  | 可变引用            | &mut s          | 借用者             | 可以读和改           |

**核心区别**：

- **所有权**：谁负责这个东西，到底是谁的（永久）
- **所有权转移**：从一个所有者转到另一个所有者，原主人永久失权
- **借用**：这个东西暂时在谁手里用（临时）
- **可变性**：拿着这个东西时，能不能修改它

## 权利的变更流程

### 场景一：所有权转移（永久）

当你把所有权交给别人，原主人就彻底失权了：

```
fn main() {
    // ════════════════════════════════════════
    // 初始：我拥有这本书
    // ════════════════════════════════════════
    let book = String::from("Rust Programming");
    println!("【初始】我拥有：{}", book);

    // ════════════════════════════════════════
    // 转移：我把书给了朋友（永久转移所有权）
    // ════════════════════════════════════════
    let friend_book = book;  // 所有权转移给 friend_book
    println!("【转移】朋友现在拥有：{}", friend_book);

    // println!("{}", book);  // ✗ 错误！我已经没有这本书了
}
```

**关键点**：所有权转移后，原变量彻底失效，永久无法使用。

### 场景二：借用（临时）

当你借给别人，保留所有权，朋友用完要还：

```
fn main() {
    // ════════════════════════════════════════
    // 第一阶段：独占所有权（我拥有书）
    // ════════════════════════════════════════
    let mut book = String::from("Rust Programming");
    println!("【初始】我拥有：{}", book);

    // ════════════════════════════════════════
    // 第二阶段：借出阅读权（朋友借去看）
    // ════════════════════════════════════════
    let friend1 = &book;        // 朋友1借去看
    let friend2 = &book;        // 朋友2也借去看
    println!("【借出】朋友1看到：{}", friend1);
    println!("【借出】朋友2看到：{}", friend2);
    // 这里朋友1、朋友2的阅读权结束

    // ════════════════════════════════════════
    // 第三阶段：借出编辑权（朋友做笔记）
    // ════════════════════════════════════════
    let editor = &mut book;     // 朋友借去做笔记（可以改）
    editor.push_str(" (with notes)");
    println!("【编辑】朋友做了笔记：{}", editor);
    // 这里编辑权结束

    // ════════════════════════════════════════
    // 第四阶段：我恢复完全所有权
    // ════════════════════════════════════════
    println!("【最后】我取回书：{}", book);
    // 可以继续修改
    book.push_str(" (my notes)");
    println!("【最后】我也做了笔记：{}", book);
}
```

这个例子展示了整个过程中权利的转变：

- **独占所有权** → 可以读、改、删除
- **借出多个阅读权** → 只能读，不能改
- **借出编辑权** → 可以读和改，但原所有者暂时无权访问
- **恢复独占所有权** → 朋友还书后，又能读改删除

## 规则速查表

快速理解所有权和借用的规则：

| 场景              | 允许吗             | 原因              |
| --------------- | --------------- | --------------- |
| 多个              | &T              | 同时活跃            | ✅               | 多个读者互不影响        |
| 多个              | &mut T          | 同时活跃            | ❌               | 无法确定谁的改动有效      |
| &T              | 和               | &mut T          | 同时活跃            | ❌               | 读者看到修改中的数据      |
| 原变量读取，同时有       | &T              | ✅               | 多个读者看到相同数据      |
| 原变量修改，同时有       | &T              | ❌               | 读者看到修改后的不一致数据   |
| 原变量读取，同时有       | &mut T          | ❌               | 编辑权与读权冲突        |

## 核心要点回顾

**所有权三条规则**（来自第一篇）：

- 每个值都有唯一所有者
- 值转移时，原所有者失效
- 所有者离开作用域时，值被释放

**借用两条规则**（本篇）：

- 排他性：多读 OR 单写，不能混合
- 有效性：引用不能指向已释放的数据

**可变性的独立性**：

- 所有权和可变性两个独立维度
- `let mut s` 不代表 `&s` 是可变的
- `let s` 不代表 `&mut s` 可行（因为原变量不可变）

理解这些概念，就掌握了 Rust 内存安全的核心秘诀。


## 引用基础测验

```
fn main() {
    let s = String::from("hello");
    let r = &s;
    println!("{}", r);
    println!("{}", s);
}
```

## 可变引用与修改

```
fn main() {
    let s = String::from("hello");
    append_world(&mut s);
    println!("{}", s);
}

fn append_world(s: &mut String) {
    s.push_str(", world");
}
```

## 借用规则一：排他性

```
fn main() {
    let mut s = String::from("hello");
    let r1 = &s;
    let r2 = &s;
    let r3 = &mut s;
    println!("{}, {}, {}", r1, r2, r3);
}
```

## 借用规则二：有效性

```
fn dangle() -> &String {
    let s = String::from("hello");
    &s
}
```

## 综合应用

## 编程练习

下面的函数想通过引用给字符串追加感叹号。请修复函数签名和 `main` 中的调用，使其能编译并正确输出：

```
fn append_exclamation(s: &String) {
    s.push_str("!");
}

fn main() {
    let s = String::from("hello");
    append_exclamation(&s);
    println!("{}", s);
}
```

**提示**：想想为什么无法通过不可变引用修改数据？

---
下面的函数试图返回一个局部变量的引用。请修改 `create_greeting` 的返回类型和返回值，使其能正确返回数据：

```
fn create_greeting() -> &String {
    let greeting = String::from("hello, world");
    &greeting
}

fn main() {
    let s = create_greeting();
    println!("{}", s);
}
```

**提示**：思考函数返回时会发生什么。如果返回引用，被引用的数据在函数结束时会被释放。如何才能让数据活下来？
# 字符串切片

**切片**（slice）是对集合中一段**连续元素序列**的引用，它不拥有所有权。切片用一种让编译器帮你检查边界安全性的方式，取代了手动管理索引。

![切片的原理](/images/rust/slice_string.svg)
## 问题引入：返回索引有什么不好

假设我们要写一个函数，找出字符串中第一个单词的结束位置。不用切片时，最直接的想法是返回一个索引：

```
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes(); // 把字符串转成字节数组

    // 逐字节遍历，找到第一个空格
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' { // b' ' 是空格字节的字面量
            return i;
        }
    }

    s.len() // 没有空格，整个字符串就是一个单词
}

fn main() {
    let s = String::from("hello world");
    let word_end = first_word(&s);
    println!("第一个单词结束于索引 {}", word_end); // 5
}
```

这能工作，但有一个隐患——`word_end` 只是一个普通的 `usize` 整数，它和字符串 `s` 完全没有绑定关系：

```
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' { return i; }
    }
    s.len()
}

fn main() {
    let mut s = String::from("hello world");
    let word_end = first_word(&s); // 返回 5

    s.clear(); // 把字符串清空了！

    // word_end 仍然是 5，但 s 已经空了
    // 用 word_end 去切分 s 会得到错误结果，但编译器不知道
    println!("word_end = {}", word_end); // 程序不报错，但这是 bug！
}
```

索引 `5` 变成了无效的信息——它描述的那个字符串已经不存在了，而编译器对此一无所知。如果再写一个 `second_word` 返回 `(usize, usize)`，情况会更难维护。

**切片解决的正是这个问题：让引用和数据永远绑定在一起。**

## 字符串切片语法

字符串切片（string slice）是对 `String` 中一段内容的引用，类型写作 `&str`：

```
fn main() {
    let s = String::from("hello world");

    let hello = &s[0..5];   // 索引 0 到 4（不含 5）
    let world = &s[6..11];  // 索引 6 到 10（不含 11）

    println!("{} {}", hello, world);
}
```

语法是 `&s[start..end]`，其中：

- `start` 是切片的**起始索引**（包含）
- `end` 是切片的**结束索引**（不含，即”开区间”）

> 索引是按字节计算的，不是按字符。对于全 ASCII 的字符串没有问题；如果字符串包含中文等多字节字符，必须在字符边界处切分，否则程序会 panic。


## Range 的各种简写

Rust 的 `..` 语法有几种简写形式：

```
fn main() {
    let s = String::from("hello");

    // 从头开始，可以省略起始索引
    let s1 = &s[0..3]; // "hel"
    let s2 = &s[..3];  // 等同于上面

    // 到末尾结束，可以省略结束索引
    let s3 = &s[2..s.len()]; // "llo"
    let s4 = &s[2..];        // 等同于上面

    // 整个字符串
    let s5 = &s[0..s.len()]; // "hello"
    let s6 = &s[..];         // 等同于上面

    println!("{} {} {} {} {} {}", s1, s2, s3, s4, s5, s6);
}
```

## 用切片重写 first_word

返回 `&str` 而不是 `usize`，让切片与原始字符串绑定在一起：

```
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i]; // 返回切片，而不是索引
        }
    }

    &s[..] // 没有空格，返回整个字符串的切片
}

fn main() {
    let s = String::from("hello world");
    let word = first_word(&s);
    println!("第一个单词是：{}", word); // "hello"
}
```

现在如果我们尝试在切片还存活时清空字符串，借用检查器会直接报错：

```
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' { return &s[0..i]; }
    }
    &s[..]
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&s); // word 是对 s 的不可变引用

    s.clear(); // 错误！clear() 需要可变引用，但 word 还持有不可变引用

    println!("{}", word);
}
```

同样的 bug，现在在编译期就被发现了，而不是在运行时悄悄出错。这正是切片的核心价值：**把”数据从哪里来”的信息编码进类型，让编译器帮你检查。**

## 字符串字面量就是切片

我们一直在用的字符串字面量，它的类型其实就是 `&str`：

```
fn main() {
    let s: &str = "hello, world!"; // &str 类型
    println!("{}", s);
}
```

`"hello, world!"` 是程序二进制文件中只读区域的一段数据，`s` 是指向它的切片引用。这就是为什么字符串字面量永远是不可变的——它是对只读数据的不可变引用。

# &str vs &String

写函数时，参数应该用 `&String` 还是 `&str`？这是一个非常实用但容易搞混的问题：

## 问题背景：为什么会纠结

假设你要写一个函数来找出字符串中第一个单词。新手可能会这样写：

```
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' { return &s[0..i]; }
    }
    &s[..]
}

fn main() {
    let owned = String::from("hello world");
    let w1 = first_word(&owned);           // ✓ 可以

    let w2 = first_word("hello world");    // ✗ 错误！参数是 &str，不是 &String
}
```

你会发现，用 `&String` 作参数后，**无法直接传入字符串字面量**。这很不方便。

## 解决方案：用 &str 代替 &String

如果函数只需要**读取**字符串内容（不需要转移所有权），应该用 `&str` 而不是 `&String`：

```
fn first_word(s: &str) -> &str {  // 改为 &str
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' { return &s[0..i]; }
    }
    &s[..]
}

fn main() {
    let owned = String::from("hello world");

    // 传 &String：自动转换为 &str（解引用强制转换）
    let w1 = first_word(&owned);

    // 传 &str 切片
    let w2 = first_word(&owned[..]);

    // 传字符串字面量（字面量本身就是 &str）
    let w3 = first_word("hello world");

    println!("{} {} {}", w1, w2, w3);
}
```

现在**三种调用方式都工作了**！

## 原理：解引用强制转换

为什么 `&String` 可以自动转换为 `&str`？这叫**解引用强制转换**（deref coercion）。

- `&String` 的本质是”指向 String 数据的引用”
- `&str` 的本质是”对字符串数据某一段的切片引用”
- Rust 编译器足够聪明，知道当你传 `&String` 给期望 `&str` 的函数时，可以自动将其转换为”整个字符串的 `&str` 切片”

## 最佳实践

**规则很简单**：

| 函数需要…           | 参数类型            | 原因              |
| --------------- | --------------- | --------------- |
| 只读字符串           | &str            | 可以接受            | &String         | 、字面量、切片，最灵活     |
| 可能修改字符串         | &mut String     | 需要可变访问权限，只能传    | &mut String     |
| 拥有字符串           | String          | 需要完全所有权，会转移所有权  |

**类比其他切片**：数组切片也遵循同样逻辑——函数参数用 `&[T]` 比 `&Vec<T>` 更通用，因为 `&[T]` 可以接受任何数组或 `Vec` 的切片。

# 数组与其他切片

字符串切片只是切片的一种特殊形式。Rust 的切片机制适用于任何数组和序列类型。

## 数组切片语法

对数组取切片，就像对字符串取切片一样：

```
fn main() {
    let a = [1, 2, 3, 4, 5];

    let slice = &a[1..3]; // 取索引 1 到 2 的元素
    println!("{:?}", slice); // [2, 3]

    // 省略写法同样适用
    let first_three = &a[..3]; // [1, 2, 3]
    let last_two = &a[3..];    // [4, 5]
    let all = &a[..];          // [1, 2, 3, 4, 5]

    println!("{:?} {:?} {:?}", first_three, last_two, all);
}
```

数组切片的类型是 `&[T]`，其中 `T` 是数组元素的类型。比如 `[i32; 5]` 的切片类型是 `&[i32]`，`[bool; 3]` 的切片类型是 `&[bool]`。

## 切片的内部结构

![切片的原理](/images/rust/slice.svg)
字符串切片和数组切片在内部结构上是一样的：存储**指向序列起始位置的指针**和**切片的长度**。切片本身存在栈上（两个 `usize` 大小），真正的数据仍然在原始集合里。

```
fn main() {
    let a = [10, 20, 30, 40, 50];
    let slice = &a[1..4]; // 指向 a[1]，长度为 3

    println!("切片内容：{:?}", slice);
    println!("切片长度：{}", slice.len()); // 3
}
```

这也意味着切片不复制数据，只是创建了一个”窗口”，从已有数据中截取一段来观察。

## 函数中使用数组切片

把 `&[T]` 作为函数参数，是 Rust 中处理序列数据的惯用方式。函数可以接受数组的任意一段，而不需要知道数组的具体大小：

```
fn sum(numbers: &[i32]) -> i32 {
    let mut total = 0;
    for n in numbers {
        total += n;
    }
    total
}

fn main() {
    let arr = [1, 2, 3, 4, 5];

    println!("全部之和：{}", sum(&arr));        // 15
    println!("前三项之和：{}", sum(&arr[..3])); // 6
    println!("后两项之和：{}", sum(&arr[3..])); // 9
}
```

> 这个 sum 函数接受 &[i32]，因此同一个函数既可以接受完整数组的引用，也可以接受任意长度的子切片——灵活又安全。


## 切片与所有权

切片不拥有数据，它是对原始集合的**借用**。

### 不可变切片

```
fn main() {
    let mut v = [1, 2, 3, 4, 5];
    let s = &v[1..3]; // 不可变切片

    v[0] = 99; // 错误！v 被不可变借用中

    println!("{:?}", s);
}
```

### 可变切片

```
fn main() {
    let mut v = vec![1, 2, 3, 4, 5];
    let s = &mut v[1..3]; // 可变切片

    s[0] = 20;  // ✓ 可以修改
    println!("{:?}", v);
}
```

切片遵循和引用完全相同的借用规则——不可变切片可以多个共存，可变切片同一时间只能有一个，两者不能同时存在。


## 字符串切片测验

```
fn main() {
    let s = String::from("hello world");
    let hello = &s[..5];
    let world = &s[6..];
    println!("{} {}", hello, world);
}
```

```
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' { return &s[0..i]; }
    }
    &s[..]
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&s);
    s.clear();
    println!("{}", word);
}
```

## 数组切片测验

```
fn main() {
    let a = [10, 20, 30, 40, 50];
    let s = &a[1..4];
    println!("{}", s.len());
}
```

## 编程练习

下面的函数返回第一个单词结束位置的**索引**，请将其改写为返回**字符串切片**（`&str`）：

```
fn first_word(s: &str) -> usize {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }
    s.len()
}

fn main() {
    let s = String::from("hello world");
    let word = first_word(&s);
    println!("{}", word);
}
```

---
下面的代码有借用冲突错误。找出问题并修复：

```
fn double_first(arr: &mut [i32]) {
    arr[0] *= 2;
}

fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];           // 创建不可变切片
    
    double_first(&mut v[..]);    // 错误！试图创建可变引用
    
    println!("first: {}, v[0]: {}", first, v[0]);
}
```

**问题分析**：

-
**为什么会报错**？ `first` 是什么类型的引用？ `double_first` 的参数需要什么类型的引用？

-
**如何修复**？有几种修复方式，请思考至少两种。

-
**借用规则**：这体现了之前学过的什么规则？（不可变引用与可变引用不能同时活跃）
# 所有权与移动

## 赋值后的 String

```
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s1);
}
```

## 哪些类型是 Copy

## clone() 做了什么

```
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();
    println!("s1={}, s2={}", s1, s2);
}
```

## 函数消耗所有权

```
fn consume(s: String) -> usize {
    s.len()
}

fn main() {
    let s = String::from("hello");
    let n = consume(s);
    println!("{} {}", n, s);
}
```

## 变量何时被释放

```
fn main() {
    let x = 5;
    {
        let y = String::from("hello");
        println!("{} {}", x, y);
    }
    println!("{}", x);
}
```

# 借用与切片

## NLL 与借用范围

```
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;
    let r2 = &s;
    println!("{} {}", r1, r2); // r1、r2 最后一次使用在这里

    let r3 = &mut s;
    r3.push_str(" world");
    println!("{}", r3);
}
```

## 不可变与可变引用共存

```
fn main() {
    let mut s = String::from("hello");
    let r1 = &s;
    let r2 = &mut s;
    println!("{} {}", r1, r2);
}
```

## 返回局部变量的引用

```
fn make_greeting() -> &String {
    let s = String::from("hello");
    &s
}
```

## 切片的类型

```
fn main() {
    let s = String::from("hello world");
    let word = &s[6..11];
    println!("{}", word);
}
```

## &str 还是 &String

# 编程练习

## 练习 1：修复所有权错误

下面的函数在打印名字后，`main` 中无法再使用 `name`。请修改函数签名（及调用方式），让 `main` 在调用后仍能使用 `name`：

```
fn greet(name: String) {
    println!("Hello, {}!", name);
}

fn main() {
    let name = String::from("Alice");
    greet(name);
    println!("Nice to meet you, {}!", name); // 目前这行会报错
}
```

## 练习 2：修复借用冲突

下面的代码在持有不可变引用时尝试修改字符串，导致编译错误。请在**不删除任何 **`println!` 的前提下，仅调整代码顺序使其通过编译：

```
fn main() {
    let mut sentence = String::from("hello");

    let first = &sentence;
    sentence.push_str(" world"); // 错误：存在不可变引用时不能修改

    println!("first snapshot: {}", first);
    println!("full sentence: {}", sentence);
}
```

## 练习 3：实现字符计数函数

请实现 `count_char` 函数，统计字符串中某个字符出现的次数：

```
fn count_char(s: &str, target: char) -> usize {
    // TODO：遍历 s 中的每个字符，统计与 target 相等的个数
    0
}

fn main() {
    println!("{}", count_char("hello world", 'l')); // 3
    println!("{}", count_char("rust programming", 'r')); // 3
    println!("{}", count_char("abcabc", 'a'));            // 2
}
```

## 练习 4：修复可变引用错误

下面的函数想通过引用将数值加一，但使用了不可变引用。请修复函数签名和调用处，使程序正确输出：

```
fn add_one(n: &i32) {
    *n += 1; // 错误：不能通过不可变引用修改值
}

fn main() {
    let mut count = 0;
    add_one(&count);
    add_one(&count);
    add_one(&count);
    println!("count = {}", count);
}
```

## 练习 5：实现切片最大值函数

请实现 `max_in_slice` 函数，返回整数切片中的最大值。函数应接受任意长度的切片（完整数组或其中一段）：

```
fn max_in_slice(numbers: &[i32]) -> i32 {
    // TODO：找出切片中的最大值并返回
    // 提示：可以先假设第一个元素是最大值，然后逐个比较
    0
}

fn main() {
    let arr = [3, 1, 4, 1, 5, 9, 2, 6];
    println!("{}", max_in_slice(&arr));        // 9
    println!("{}", max_in_slice(&arr[..4]));   // 4
    println!("{}", max_in_slice(&arr[4..]));   // 9
}
```