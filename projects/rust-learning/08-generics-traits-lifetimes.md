---
title: "泛型、trait 与生命周期"
description: "泛型语法、trait 定义与实现、trait bound、From/Into 等转换 trait、生命周期标注与省略规则"
date: "2026-07-12"
order: 8
tags: ["泛型", "Trait", "生命周期", "Trait Bound"]
est_time: "60 分钟"
---

泛型和 Trait 是 Rust 抽象能力的两根支柱，天然咬合：**泛型**（`<T>`）让一份代码适配多种类型，**Trait** 定义”某类型能做什么”的行为契约，**Trait 约束**把二者联结起来——泛型代码可以调用约束所保证的方法，编译器在使用时展开为具体类型，零运行时开销。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 函数、结构体、枚举和 impl 块中的泛型写法，单态化原理 |                 |
| 定义与实现 Trait，默认方法， | Display         | 与               | Debug           | 背后的机制           |
| T: Trait        | 语法，多重约束，        | where           | 子句，             | impl Trait      |
| From            | /               | Into            | 、               | TryFrom         | /               | TryInto         | 的惯用模式           |
| 综合运用泛型与 Trait 解决实际问题 |                 |
# 用泛型抽象类型

## 为什么需要泛型

假设你要写一个函数，找出整数列表中最大的值：

```
fn largest_i32(list: &[i32]) -> &i32 {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大值是 {}", largest_i32(&numbers));
}
```

现在你想对 `f64` 列表做同样的事，怎么办？复制一份：

```
fn largest_f64(list: &[f64]) -> &f64 {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

两个函数的**逻辑完全相同**，只有类型不同。如果还要支持 `char`、`u8`……每次都要复制？虽然 C 语言正是这样做的，但 Rust 里可以写的更加优雅，这正是泛型要解决的问题。

**泛型**让你用一个占位符 `T` 代表”某种类型”，写一份代码，让编译器自动适配所有需要的类型。

## 泛型函数

用泛型合并上面两个函数：

```
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("整数最大值：{}", largest(&numbers));

    let floats = vec![2.7, 3.1, 0.8, 9.5, 1.4];
    println!("浮点最大值：{}", largest(&floats));
}
```

语法拆解：

- `<T: PartialOrd>` — 在函数名后用尖括号声明类型参数 `T`；`PartialOrd` 是**约束**，表示”T 必须支持比较大小”。没有这个约束，编译器不允许用 `>` 运算符
- `list: &[T]` — 参数是元素类型为 `T` 的切片
- `-> &T` — 返回对 `T` 类型值的引用

> T 只是惯例，你可以用任何标识符。但单个大写字母是 Rust 社区的约定，多个类型参数时常用 T、U、K、V。


约束语法（如 `PartialOrd`）的完整内容在 Trait 章节会讲，现在只需记住：**约束说明 T 能做什么**。

## 显式指定泛型参数：turbofish

大多数情况下，编译器能从传入的值自动推导 `T` 是什么，不需要手动指定：

```
fn wrap<T>(val: T) -> Vec<T> { vec![val] }

fn main() {
    let v = wrap(42);    // 编译器从 42 推导出 T = i32
    println!("{:?}", v);
}
```

但有些函数的泛型参数在参数里看不出来，编译器无法推导，这时需要用 `函数名::<类型>()` 显式指定：

```
fn main() {
    // parse 把字符串解析成"某种类型"，但哪种类型？编译器无法从 "42" 推断
    let n = "42".parse::<i32>().unwrap();
    let f = "3.14".parse::<f64>().unwrap();
    println!("{} {}", n, f);
}
```

`parse::<i32>()` 这种 `函数名::<类型>()` 语法叫 **turbofish**。注意不能省略 `::`，写成 `parse<i32>()` 会被编译器误读为比较运算符而报错。

规则很简单：**编译器能推导就省略；推导不了就加 turbofish**。

## 泛型结构体

类型参数同样可以放在结构体上：

```
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let int_point = Point { x: 5, y: 10 };
    let flt_point = Point { x: 1.0, y: 4.0 };
    println!("整数点: ({}, {})", int_point.x, int_point.y);
    println!("浮点点: ({}, {})", flt_point.x, flt_point.y);
}
```

注意：`x` 和 `y` 共享同一个 `T`，所以它们必须是**相同类型**：

```
let mixed = Point { x: 5, y: 4.0 }; // 错误！x 推导为 i32，y 推导为 f64
```

struct Point<T> { x: T, y: T }
fn main() {
let mixed = Point { x: 5, y: 4.0 }; // 错误！x 推导为 i32，y 推导为 f64
}
如果需要两字段可以是不同类型，用**两个类型参数**：

```
struct Point<T, U> {
    x: T,
    y: U,
}

fn main() {
    let mixed = Point { x: 5, y: 4.0 };
    println!("混合点: ({}, {})", mixed.x, mixed.y);
}
```

## 泛型枚举

你其实早就在用泛型枚举了——标准库里的 `Option` 和 `Result` 就是：

```
// 标准库中的定义（仅供参考，不需要自己写）
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Option<i32>` 和 `Option<String>` 结构完全一样，只是 `T` 不同。这就是泛型让一个枚举适配无数场景的原理。

你自己也可以定义泛型枚举：

```
// 一个简单的二叉树，存储任意类型的值
enum Tree<T> {
    Leaf(T),
    Node(Box<Tree<T>>, Box<Tree<T>>),
}

fn main() {
    let tree: Tree<i32> = Tree::Node(
        Box::new(Tree::Leaf(1)),
        Box::new(Tree::Leaf(2)),
    );
    println!("创建成功");
}
```

# 方法与单态化

## 为泛型类型定义方法

在 `impl` 块上使用泛型，需要在 `impl` 关键字后面同样声明 `<T>`：

```
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }

    fn y(&self) -> &T {
        &self.y
    }
}

fn main() {
    let p = Point { x: 5, y: 10 };
    println!("x = {}, y = {}", p.x(), p.y());
}
```

为什么要写**两次** `<T>`？对比函数就清楚了：

```
// 函数：先在 <T> 里"引入"T，然后在参数里"使用"T
fn foo<T>(x: T) { ... }
//    ^^^  ^^^
//    引入  使用

// impl：同样先"引入"T，然后在类型名里"使用"T
impl<T> Point<T> { ... }
//   ^^^       ^^^
//   引入       使用
```

`impl<T>` 里的 `<T>` 是在告诉编译器：“接下来的 `T` 是一个类型参数，不是某个叫做 `T` 的具体类型”。如果直接写 `impl Point<T>`（省掉前面的 `<T>`），编译器会以为 `T` 是某个具体类型的名字，找不到就报错。

## 为特定类型实现专属方法

也可以只为某个**具体类型**实现方法。这时 `impl` 后面不加 `<T>`：

```
struct Point<T> {
    x: T,
    y: T,
}

// 所有 Point<T> 都有这个方法
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// 只有 Point<f64> 才有这个方法
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

fn main() {
    let flt_p = Point { x: 3.0_f64, y: 4.0 };
    println!("x = {}", flt_p.x());
    println!("距原点距离: {}", flt_p.distance_from_origin()); // 5.0

    let int_p = Point { x: 3_i32, y: 4 };
    println!("x = {}", int_p.x());
    // int_p.distance_from_origin(); // 编译错误！i32 版本没有这个方法
}
```

## 单态化：零开销抽象

泛型的关键卖点：**运行时没有任何额外开销**。

Rust 编译器在编译阶段做**单态化**（monomorphization）——把每处泛型代码展开成针对该具体类型的独立代码：

```
// 你写的
fn largest<T: PartialOrd>(list: &[T]) -> &T { ... }

// 你调用了
largest(&[1_i32, 2, 3]);
largest(&[1.0_f64, 2.0, 3.0]);

// 编译器实际生成（概念示意）
fn largest_i32(list: &[i32]) -> &i32 { ... }
fn largest_f64(list: &[f64]) -> &f64 { ... }
```

这意味着：

| 维度              | 表现              |
| --------------- | --------------- |
| 运行速度            | 和手写具体类型代码完全相同   |
| 编译时间            | 用到的类型越多，编译越慢    |
| 二进制大小           | 每种类型生成一份代码，体积略增 |

Rust 选择了”编译期多花时间，换取运行时零开销”的策略。这正是 Rust 能做到既安全又高效的原因之一。

> 与单态化相对的是动态分发（dyn Trait）：推迟到运行时才确定类型，有运行时开销但编译产物更小。两种策略各有适用场景，后续章节会介绍。


# 练习题

## 泛型函数测验

```
struct Container<T, U> {
    first: T,
    second: U,
}
```

## 泛型 impl 测验

## 编程练习

下面的 `wrap` 函数只能包装 `i32`。请将它改造成泛型函数，使其能包装任意类型，并让 `main` 中所有调用都正常编译运行。

```
fn wrap(value: i32) -> Vec<i32> {
    vec![value]
}

fn main() {
    let nums = wrap(42);
    println!("{:?}", nums); // [42]

    // 让下面两行也能工作
    let strs = wrap("hello");
    println!("{:?}", strs); // ["hello"]

    let bools = wrap(true);
    println!("{:?}", bools); // [true]
}
```
# 定义与实现

## 什么是 Trait

想象你在招聘网站写了一条岗位要求：

> 后端工程师：必须能写 SQL、会用 Git、能写单元测试。


这条要求描述的是**能力（行为）**，而不是人的其他属性。不管应聘者是应届生还是工作十年的老手，只要满足这三条，都可以被”当作后端工程师”来使用。

Rust 的 **trait** 就是这个角色说明书——它定义一组方法签名，任何实现了它的类型都必须提供这些方法。trait 约定的是”能做什么”，而不关心类型内部是什么。

Trait 主要有三个用途：

- **统一接口**：让不同的类型对外表现出相同的行为。`NewsArticle` 和 `Tweet` 都实现了 `Summary`，调用方可以用同一套方式处理它们。
- **泛型约束**：写泛型函数时，用 `T: Summary` 告诉编译器”T 必须能摘要”，让函数只接受符合要求的类型。
- **接入标准库**：实现 `Display` 就能用 `println!("{}")` 打印，实现 `Iterator` 就能用 `for` 循环——trait 是 Rust 语言特性和你的类型”对话”的接口。

```
// 定义 trait：规定"能摘要的事物"必须提供 summarize 方法
trait Summary {
    fn summarize(&self) -> String;
}

struct NewsArticle {
    headline: String,
    author: String,
}

struct Tweet {
    username: String,
    content: String,
}

// 为 NewsArticle 实现 Summary
impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {}", self.headline, self.author)
    }
}

// 为 Tweet 实现 Summary
impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}

fn main() {
    let article = NewsArticle {
        headline: String::from("Rust 荣获最受喜爱语言"),
        author: String::from("小明"),
    };
    let tweet = Tweet {
        username: String::from("rustacean"),
        content: String::from("今天又爱上了 Rust！"),
    };

    println!("{}", article.summarize());
    println!("{}", tweet.summarize());
}
```

## 定义与实现语法

**定义**：用 `trait` 关键字 + 名称 + 大括号，方法签名以**分号**结尾（不写方法体）：

```
pub trait Drawable {
    fn draw(&self);
    fn bounding_box(&self) -> (f64, f64, f64, f64);
}
```

**实现**：用 `impl TraitName for TypeName`，在大括号内提供所有方法的具体实现：

```
trait Drawable {
    fn draw(&self);
}

struct Circle {
    x: f64,
    y: f64,
    radius: f64,
}

impl Drawable for Circle {
    fn draw(&self) {
        println!("画圆：圆心({}, {})，半径{}", self.x, self.y, self.radius);
    }
}

fn main() {
    let c = Circle { x: 0.0, y: 0.0, radius: 5.0 };
    c.draw();
}
```

如果实现时遗漏了 trait 中的某个方法，编译器会报错，明确告诉你缺了什么。

## 默认实现

trait 中的方法可以提供**默认实现**——实现方可以选择沿用默认行为，也可以覆盖它：

```
trait Summary {
    fn summarize_author(&self) -> String; // 没有默认，必须实现

    fn summarize(&self) -> String {       // 有默认实现，可以不覆盖
        format!("（来自 {} 的内容）", self.summarize_author())
    }
}

struct Tweet {
    username: String,
}

impl Summary for Tweet {
    // 只实现必须的方法，summarize 使用默认实现
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
}

struct NewsArticle {
    headline: String,
    author: String,
}

impl Summary for NewsArticle {
    fn summarize_author(&self) -> String {
        self.author.clone()
    }

    // 覆盖默认实现，提供自己的格式
    fn summarize(&self) -> String {
        format!("{} — {}", self.headline, self.author)
    }
}

fn main() {
    let tweet = Tweet { username: String::from("rustlang") };
    let article = NewsArticle {
        headline: String::from("Rust 2024 Edition 发布"),
        author: String::from("InfoQ"),
    };

    println!("{}", tweet.summarize());   // 用默认实现
    println!("{}", article.summarize()); // 用自己的实现
}
```

> 默认实现可以调用同一 trait 中的其他方法——哪怕那些方法没有默认实现。这让 trait 可以提供很多”免费”行为，实现方只需实现少数核心方法。


## 孤儿规则

先理解背景：**Rust 规定，任何 **`(类型, Trait)`** 组合，全局只能有一份实现**。

为什么？因为调用 `my_vec.summarize()` 时，编译器必须知道”到底执行哪段代码”。如果存在两份实现，编译器无从决断，只能报错。

现在想象一下，如果没有孤儿规则会发生什么：

```
crate "pretty-print"（某个库）写了：
    impl Display for Vec<i32> {
        fn fmt(...) { print("[1, 2, 3]") }   // 方括号风格
    }

crate "csv-tools"（另一个库）也写了：
    impl Display for Vec<i32> {
        fn fmt(...) { print("1,2,3") }       // 逗号风格
    }

你的项目同时依赖了这两个库，然后你写了：
    println!("{}", vec![1, 2, 3]);
```

Rust 看到了两份 `impl Display for Vec<i32>`，但全局只允许一份——它根本无法编译通过。更糟的是，这个冲突**在你写自己代码的时候才爆出来**，你没有修改任何一个库，却被它们之间的冲突搞崩了。

**孤儿规则的解法**：只有”拥有 `Vec<T>`”或”拥有 `Display`”的 crate 才有资格写这份实现。`Vec<T>` 和 `Display` 都属于标准库，所以只有标准库能写 `impl Display for Vec<T>`。任何第三方库试图写这个实现都会被编译器拒绝——这样冲突就从根本上被消除了。

**规则总结**：`impl Trait for Type` 中，Trait 和 Type 至少有一个必须是你当前 crate 定义的。

用一张表来看，哪些情况允许，哪些不允许：

| Trait 是你定义的     | Trait 是外部的（如标准库） |
| --------------- | --------------- |
| Type 是你定义的      | ✅ 两个都是你的，当然可以   | ✅ Type 是你的，允许   |
| Type 是外部的（如     | Vec<T>          | ）               | ✅ Trait 是你的，允许  | ❌ 两个都是别人的，不行    |

只有右下角那一格——“Trait 和 Type 都来自外部 crate”——才被禁止。

```
use std::fmt;

// ❌ Display（外部）和 Vec<T>（外部）都不是本 crate 定义的
impl<T: fmt::Display> fmt::Display for Vec<T> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[...]")
    }
}
```

use std::fmt;

// ❌ Display（外部）和 Vec<T>（外部）都不是本 crate 定义的
impl<T: fmt::Display> fmt::Display for Vec<T> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[...]")
    }
}

fn main() {}
而这些都是合法的：

```
use std::fmt;

struct MyList(Vec<i32>); // MyList 是本 crate 定义的

// ✅ MyList 是本地类型，可以为它实现外部的 Display
impl fmt::Display for MyList {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let items: Vec<String> = self.0.iter().map(|x| x.to_string()).collect();
        write!(f, "[{}]", items.join(", "))
    }
}

// 自定义 trait
trait Describable {
    fn describe(&self) -> String;
}

// ✅ Describable 是本地 trait，可以为外部的 Vec<i32> 实现它
impl Describable for Vec<i32> {
    fn describe(&self) -> String {
        format!("包含 {} 个元素的列表", self.len())
    }
}

fn main() {
    let list = MyList(vec![1, 2, 3]);
    println!("{}", list); // [1, 2, 3]

    let v = vec![10, 20, 30];
    println!("{}", v.describe()); // 包含 3 个元素的列表
}
```

> 绕过孤儿规则为外部类型实现外部 trait 的办法是用 Newtype 模式——用一个本地结构体包装外部类型，就像上面的 MyList 包装了 Vec<i32>。


# 高级特性

## #[derive]：让编译器帮你实现

对于常见的 trait，Rust 提供了 `#[derive]` 属性——只要在类型前加一行，编译器就会自动生成实现：

```
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2 = p1.clone();              // Clone 自动实现

    println!("{:?}", p1);             // Debug 自动实现
    println!("相等: {}", p1 == p2);   // PartialEq 自动实现
}
```

常用的可派生 trait：

| trait           | 作用              |
| --------------- | --------------- |
| Debug           | {:?}            | 格式化输出           |
| Clone           | .clone()        | 深拷贝             |
| Copy            | 按位复制，赋值不移动所有权   |
| PartialEq       | /               | Eq              | ==              | 和               | !=              | 比较              |
| PartialOrd      | /               | Ord             | <               | 、               | >               | 、               | <=              | 、               | >=              | 比较              |
| Hash            | 可用作             | HashMap         | 的键              |
| Default         | T::default()    | 创建默认值           |

注意表格里没有 `Display`——它**不能派生**，必须手动实现。`Debug` 和 `Display` 是两个很容易混淆的格式化 trait，区别如下：

| Debug           | Display         |
| --------------- | --------------- |
| 格式符             | {:?}            | 或               | {:#?}           | {}              |
| 面向谁             | 开发者（调试用）        | 终端用户（展示用）       |
| 能否派生            | ✅ 可以            | #[derive(Debug)] | ❌ 不能，必须手动写      |
| 输出风格            | 结构化、带字段名        | 自由定义，应简洁易读      |

`Debug` 可以派生是因为它的输出格式是固定的（显示结构体名称和所有字段）；`Display` 不能派生，因为 Rust 不知道你想让用户看到什么，因此没有默认实现，需要用户手动实现——这是业务决策，编译器无法代劳。

```
use std::fmt;

#[derive(Debug)]   // Debug 可以派生
struct Point {
    x: f64,
    y: f64,
}

// Display 必须手动实现
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

fn main() {
    let p = Point { x: 1.5, y: 2.0 };
    println!("{:?}", p);  // Debug：Point { x: 1.5, y: 2.0 }
    println!("{:#?}", p); // Debug 美化版：换行缩进
    println!("{}", p);    // Display：(1.5, 2.0)
}
```

## 运算符重载

`a + b` 实际上是 `a.add(b)` 的语法糖——`+` 运算符对应 `std::ops::Add` trait。你可以为自定义类型定义 `+` 的行为：

```
use std::ops::Add;

#[derive(Debug, PartialEq)]
struct Vec2 {
    x: f64,
    y: f64,
}

impl Add for Vec2 {
    type Output = Vec2; // 加法结果的类型

    fn add(self, other: Vec2) -> Vec2 {
        Vec2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    let v1 = Vec2 { x: 1.0, y: 2.0 };
    let v2 = Vec2 { x: 3.0, y: 4.0 };
    let v3 = v1 + v2; // 调用了我们实现的 add
    println!("{:?}", v3); // Vec2 { x: 4.0, y: 6.0 }
}
```

`std::ops` 模块里定义了所有可重载运算符对应的 trait：`Add`、`Sub`、`Mul`、`Div`、`Neg`、`Index` 等。运算符重载的本质就是为这些 trait 提供实现。

## 父 Trait

Rust 没有继承，但 trait 可以**要求实现者同时实现另一个 trait**——这个被依赖的 trait 称为”父 trait”：

```
trait Person {
    fn name(&self) -> String;
}

// 实现 Student 前，必须先实现 Person
trait Student: Person {
    fn university(&self) -> String;
}

trait Programmer {
    fn fav_language(&self) -> String;
}

// 同时依赖多个父 trait
trait CompSciStudent: Programmer + Student {
    fn git_username(&self) -> String;
}

struct Alice {
    name: String,
}

impl Person for Alice {
    fn name(&self) -> String { self.name.clone() }
}

impl Student for Alice {
    fn university(&self) -> String { String::from("清华大学") }
}

impl Programmer for Alice {
    fn fav_language(&self) -> String { String::from("Rust") }
}

impl CompSciStudent for Alice {
    fn git_username(&self) -> String { String::from("alice-dev") }
}

fn greet(s: &dyn CompSciStudent) {
    println!("你好，我是 {}，就读于 {}，最爱 {}，GitHub：{}",
        s.name(), s.university(), s.fav_language(), s.git_username());
}

fn main() {
    let alice = Alice { name: String::from("Alice") };
    greet(&alice);
}
```

父 trait 是”前提条件”：想实现 `CompSciStudent`，你得先满足 `Programmer` 和 `Student` 的要求；而 `Student` 又要求先满足 `Person`。编译器会强制检查这条链上所有 trait 都有实现（但编码没有顺序要求）。

## 消除方法歧义

一个类型可以实现多个 trait，如果两个 trait 中有同名方法，直接调用会出现歧义：

```
trait UsernameWidget {
    fn get(&self) -> String;
}

trait AgeWidget {
    fn get(&self) -> u8;
}

struct Form {
    username: String,
    age: u8,
}

impl UsernameWidget for Form {
    fn get(&self) -> String { self.username.clone() }
}

impl AgeWidget for Form {
    fn get(&self) -> u8 { self.age }
}

fn main() {
    let form = Form { username: String::from("rustacean"), age: 28 };
    println!("{}", form.get()); // 错误！有多个 get 方法
}
```

用**完全限定语法**（Fully Qualified Syntax）消除歧义：

```
fn main() {
    let form = Form { username: String::from("rustacean"), age: 28 };

    // <类型 as Trait名>::方法名(参数)
    let username = <Form as UsernameWidget>::get(&form);
    let age      = <Form as AgeWidget>::get(&form);

    println!("用户名: {}", username);
    println!("年龄: {}", age);
}
```

trait UsernameWidget { fn get(&self) -> String; }
trait AgeWidget { fn get(&self) -> u8; }
struct Form { username: String, age: u8 }
impl UsernameWidget for Form { fn get(&self) -> String { self.username.clone() } }
impl AgeWidget for Form { fn get(&self) -> u8 { self.age } }
fn main() {
    let form = Form { username: String::from("rustacean"), age: 28 };

    // <类型 as Trait名>::方法名(参数)
    let username = <Form as UsernameWidget>::get(&form);
    let age      = <Form as AgeWidget>::get(&form);

    println!("用户名: {}", username);
    println!("年龄: {}", age);
}

## Trait 基础测验

```
trait Greet {
    fn greeting(&self) -> String {
        String::from("你好！")
    }
    fn name(&self) -> String;
}

struct Bob;

impl Greet for Bob {
    fn name(&self) -> String {
        String::from("Bob")
    }
}
```

## 高级特性测验

```
#[derive(Debug, Clone, PartialEq)]
struct Color(u8, u8, u8);
```

## 编程练习

下面定义了一个 `Greet` trait，请为 `Chinese` 和 `English` 两种问候方式实现它，使 `main` 能正确运行。

```
trait Greet {
    fn hello(&self) -> String;
    fn goodbye(&self) -> String;

    fn greet_and_leave(&self) {
        println!("{}", self.hello());
        println!("{}", self.goodbye());
    }
}

struct Chinese;
struct English;

// TODO: 为 Chinese 实现 Greet
//   hello   → "你好！"
//   goodbye → "再见！"

// TODO: 为 English 实现 Greet
//   hello   → "Hello!"
//   goodbye → "Goodbye!"

fn main() {
    let zh = Chinese;
    let en = English;

    zh.greet_and_leave();
    en.greet_and_leave();
}
```
# Trait 约束

## 不加约束的泛型什么都做不了

学完 trait 的定义，再回头看泛型就清晰多了。考虑这个函数：

```
fn print_value<T>(val: T) {
    println!("{}", val); // 错误：T 不一定实现了 Display
}
```

fn print_value<T>(val: T) {
    println!("{}", val); // 错误：T 不一定实现了 Display
}

fn main() {}
`T` 代表任意类型，“任意”意味着最大不确定性——编译器不知道 `T` 是否实现了 `Display`，是否支持 `+` 运算，还是什么能力都没有。

**约束（bounds）** 就是你对 `T` 做出的承诺：告诉编译器”这个 `T` 一定实现了某个 trait”。换来的是：编译器允许你在函数体内调用那个 trait 的方法。

反过来说也成立：**你没有声明的约束，对应的能力就不能用**。加减乘除也不例外——`+` 运算符背后是 `std::ops::Add` trait，`>` 比较是 `PartialOrd`，`==` 是 `PartialEq`。想用哪个运算符，就加哪个约束：

```
use std::ops::Add;

fn double<T>(val: T) -> T {
    val + val  // 错误！T 没有声明 Add 约束，不能用 +
}
```

```
use std::ops::Add;

fn double<T: Add<Output = T> + Copy>(val: T) -> T {
    val + val  // 合法：声明了 Add 约束
}

fn main() {
    println!("{}", double(5_i32));   // 10
    println!("{}", double(1.5_f64)); // 3
}
```

use std::ops::Add;

fn double<T>(val: T) -> T {
    val + val  // 错误！T 没有声明 Add 约束，不能用 +
}

fn main() {}
这正是 Rust 约束系统的核心逻辑：`T`** 的能力由且仅由它的约束列表决定**，没有任何”隐式可用”的操作。

```
use std::fmt::Display;

fn print_value<T: Display>(val: T) {
    println!("{}", val); // 合法：T 保证实现了 Display
}

fn main() {
    print_value(42);
    print_value("hello");
    print_value(3.14);
}
```

`T: Display` 的读法：**“T 必须实现 Display trait”**。

## 常见标准库 trait 约束

| 约束              | 含义              |
| --------------- | --------------- |
| T: Display      | 可以用             | {}              | 格式化             |
| T: Debug        | 可以用             | {:?}            | 格式化             |
| T: Clone        | 可以              | .clone()        |
| T: Copy         | 可以按位复制（隐式）      |
| T: PartialOrd   | 可以用             | >               | 、               | <               | 比较大小            |
| T: PartialEq    | 可以用             | ==              | 、               | !=              | 判断相等            |

## 约束在调用时检查

约束是双向的：定义时声明，调用时编译器验证。

```
use std::fmt::Display;

fn show<T: Display>(val: T) {
    println!("{}", val);
}

struct Secret(i32); // 没有实现 Display

show(Secret(42)); // 编译错误：Secret 不满足 Display 约束
```

use std::fmt::Display;

fn show<T: Display>(val: T) {
    println!("{}", val);
}

struct Secret(i32); // 没有实现 Display

fn main() {
show(Secret(42)); // 编译错误：Secret 不满足 Display 约束
}
> 约束失败永远是编译期错误，不会到运行时才暴露。


# 多重约束与 where 子句

## 多重约束：用 + 叠加

一个 `T` 可以同时有多个约束，用 `+` 连接：

```
use std::fmt::{Debug, Display};

fn compare_and_print<T: Display + Debug + PartialOrd>(a: T, b: T) {
    if a > b {
        println!("{} 更大（Debug: {:?}）", a, a);
    } else {
        println!("{} 更大（Debug: {:?}）", b, b);
    }
}

fn main() {
    compare_and_print(10_i32, 20);
    compare_and_print("banana", "apple");
}
```

## where 子句：让复杂签名可读

多个类型参数、多个约束堆在一起时，行内写法很难看：

```
// 难以阅读
fn process<T: Display + Debug + Clone + PartialOrd, U: Debug + Clone>(t: T, u: U) -> String {
    format!("{} {:?}", t, u)
}
```

`where` 子句让每个约束独立成行：

```
use std::fmt::{Debug, Display};

fn process<T, U>(t: T, u: U) -> String
where
    T: Display + Debug + Clone + PartialOrd,
    U: Debug + Clone,
{
    format!("{} {:?}", t, u)
}

fn main() {
    let result = process(42_i32, vec![1, 2, 3]);
    println!("{}", result);
}
```

两种写法语义完全等价，`where` 只是更整洁的排版。推荐在类型参数有两个以上约束时使用。

## 在 impl 块中使用约束

约束不只能用在函数上，`impl` 块同样可以带约束，让某些方法只在满足约束时才存在：

```
use std::fmt::Display;

struct Pair<T> {
    first: T,
    second: T,
}

impl<T> Pair<T> {
    fn new(first: T, second: T) -> Self {
        Self { first, second }
    }
}

// 只有 T: Display + PartialOrd 的 Pair 才有这个方法
impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.first >= self.second {
            println!("最大值是 {}", self.first);
        } else {
            println!("最大值是 {}", self.second);
        }
    }
}

fn main() {
    let pair = Pair::new(5, 10);
    pair.cmp_display(); // 最大值是 10
}
```

# impl Trait：另一种约束写法

`impl Trait` 是专门用在**函数签名**里的语法，不能用在结构体字段、变量类型标注等地方。它有两种位置，行为不同：

## 参数位置：泛型的语法糖

在参数位置，`impl Trait` 和泛型约束完全等价——选哪个只是风格问题：

```
use std::fmt::Display;

fn notify_generic<T: Display>(item: &T) {   // 泛型写法
    println!("通知：{}", item);
}

fn notify_impl(item: &impl Display) {        // impl Trait 写法，效果一样
    println!("通知：{}", item);
}

fn main() {
    notify_generic(&42);
    notify_impl(&"hello");
}
```

但有一种情况只能用泛型：当**两个参数必须是同一类型**时：

```
// ❌ 这样写 a 和 b 可以是不同类型，无法约束它们相同
fn max_value(a: impl PartialOrd, b: impl PartialOrd) -> bool {
    a > b  // 错误：不同 impl Trait 参数不能互相比较
}
```

```
// ✅ 用泛型明确两个参数必须是同一类型 T
fn max_value<T: PartialOrd>(a: T, b: T) -> bool {
    a > b
}

fn main() {
    println!("{}", max_value(3, 5));        // false
    println!("{}", max_value("b", "a"));    // true
}
```

// ❌ 这样写 a 和 b 可以是不同类型，无法约束它们相同
fn max_value(a: impl PartialOrd, b: impl PartialOrd) -> bool {
    a > b  // 错误：不同 impl Trait 参数不能互相比较
}

fn main() {}
## 返回值位置：隐藏具体类型

在返回值位置，`impl Trait` 是独立功能，不只是语法糖。它让你隐藏返回的具体类型：

```
fn make_greeting(name: &str) -> impl std::fmt::Display {
    format!("你好，{}！", name)  // 实际返回 String，但调用方看不到
}

fn main() {
    let g = make_greeting("小明");
    println!("{}", g);  // 只能当 Display 用，不能当 String 用
}
```

这在返回**闭包**或**迭代器链**时几乎是必须的——这类类型要么无法手写，要么写出来极其冗长：

```
// 闭包类型无法手写，只能用 impl Fn
fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n
}

// 迭代器链的实际类型是 Map<Filter<...>>，用 impl Iterator 隐藏
fn even_squares(v: Vec<i32>) -> impl Iterator<Item = i32> {
    v.into_iter().filter(|x| x % 2 == 0).map(|x| x * x)
}

fn main() {
    let add5 = make_adder(5);
    println!("{}", add5(3));  // 8

    let result: Vec<i32> = even_squares(vec![1, 2, 3, 4, 5]).collect();
    println!("{:?}", result); // [4, 16]
}
```

> impl Trait 只能用在函数签名里（参数和返回值），不能用在结构体字段或变量类型标注。需要在这些地方存储”实现了某 trait 的任意类型”时，要用 Box<dyn Trait>（动态分发）。



## Trait 约束测验

```
use std::fmt::Display;

fn print_pair<T>(a: T, b: T)
where
    T: Display + PartialOrd,
{
    if a > b {
        println!("{} > {}", a, b);
    } else {
        println!("{} <= {}", a, b);
    }
}
```

## impl Trait 测验

## 编程练习

下面的 `largest` 函数有编译错误，请添加正确的约束使其能够编译运行。只添加必要的约束，不多加。

```
fn largest<T>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大整数: {}", largest(&numbers));

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("最大字符: {}", largest(&chars));
}
```
# 转换 Trait 系统

## 为什么需要转换 Trait

前面在”类型系统”章节学过，Rust 不提供**隐式类型转换**。但有时我们需要将一个类型**安全地、优雅地**转换为另一个类型。

转换 trait 提供了：

- **显式意图**：清楚地表达”这是一个转换”
- **灵活性**：支持任意类型之间的转换
- **错误处理**：某些转换可能失败，使用 `Result` 处理
- **自动化**：实现一个 trait，自动获得相关功能

## From 和 Into Trait

### From Trait：构造自我

`From<T>` trait 表示”我可以从 T 构造自己”：

```
trait From<T> {
    fn from(value: T) -> Self;
}
```

**标准库中已有的 From 实现：**

```
fn main() {
    // String::from(&str)
    let s1 = String::from("hello");

    // i32 实现了 From<u16>
    let num: i32 = 100u16.into();

    println!("s1: {}, num: {}", s1, num);
}
```

### 为自定义类型实现 From

```
use std::convert::From;

#[derive(Debug)]
struct Number {
    value: i32,
}

impl From<i32> for Number {
    fn from(item: i32) -> Self {
        Number { value: item }
    }
}

fn main() {
    let num1 = Number::from(30);
    println!("方式 1 - from: {:?}", num1);

    // 自动获得 into（不用手动实现）
    let num2: Number = 40.into();
    println!("方式 2 - into: {:?}", num2);
}
```

### Into Trait：转换为他人

`Into<T>` trait 表示”我可以转换成 T”：

```
trait Into<T> {
    fn into(self) -> T;
}
```

**关键点**：如果你为类型 A 实现了 `From<B>`，编译器会**自动**为 B 实现 `Into<A>`。它们互为倒数。

### From vs Into：何时用哪个

- **实现转换时**：总是实现 `From`，自动获得 `Into`
- **使用转换时**：
- 如果有明确的源类型，用 `From`
- 如果需要类型推导，用 `Into`


```
use std::convert::From;

#[derive(Debug)]
struct Point(i32, i32);

impl From<(i32, i32)> for Point {
    fn from((x, y): (i32, i32)) -> Self {
        Point(x, y)
    }
}

// 接受任何能转为 Point 的类型
fn make_point<T: Into<Point>>(x: T) -> Point {
    x.into()
}

fn main() {
    let p1 = Point::from((1, 2));
    let p2: Point = (3, 4).into();
    let p3 = make_point((5, 6));

    println!("p1: {:?}, p2: {:?}, p3: {:?}", p1, p2, p3);
}
```

## TryFrom 和 TryInto Trait

### 可能失败的转换

某些转换不一定成功。例如，验证范围、检查有效性等。对于这样的情况，使用 `Try*` trait：

```
trait TryFrom<T> {
    type Error;

    fn try_from(value: T) -> Result<Self, Self::Error>;
}

trait TryInto<T> {
    type Error;

    fn try_into(self) -> Result<T, Self::Error>;
}
```

### 实现 TryFrom

```
use std::convert::TryFrom;

#[derive(Debug, PartialEq)]
struct EvenNumber(i32);

impl TryFrom<i32> for EvenNumber {
    type Error = &'static str;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value % 2 == 0 {
            Ok(EvenNumber(value))
        } else {
            Err("不是偶数")
        }
    }
}

fn main() {
    match EvenNumber::try_from(4) {
        Ok(num) => println!("成功：{:?}", num),
        Err(e) => println!("失败：{}", e),
    }

    match EvenNumber::try_from(3) {
        Ok(num) => println!("成功：{:?}", num),
        Err(e) => println!("失败：{}", e),
    }
}
```

### TryInto 的自动实现

就像 `Into` 自动实现一样，实现 `TryFrom` 会自动获得 `TryInto`：

```
use std::convert::TryFrom;

#[derive(Debug)]
struct PositiveNumber(u32);

impl TryFrom<i32> for PositiveNumber {
    type Error = String;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value > 0 {
            Ok(PositiveNumber(value as u32))
        } else {
            Err(format!("期望正数，得到 {}", value))
        }
    }
}

fn main() {
    // 方式 1：使用 try_from
    match PositiveNumber::try_from(5) {
        Ok(n) => println!("try_from: {:?}", n),
        Err(e) => println!("错误：{}", e),
    }

    // 方式 2：使用 try_into（自动提供）
    let result: Result<PositiveNumber, _> = 10i32.try_into();
    match result {
        Ok(n) => println!("try_into: {:?}", n),
        Err(e) => println!("错误：{}", e),
    }
}
```

## 转换 Trait 关系图

```
From<T> for A  ←→  Into<A> for T
     ↓                    ↓
TryFrom<T> for A  ←→  TryInto<A> for T
```

- 实现 `From<T>` 自动获得 `Into`
- 实现 `TryFrom<T>` 自动获得 `TryInto`
- `From`/`Into` 用于**总是成功**的转换
- `TryFrom`/`TryInto` 用于**可能失败**的转换


## From 和 Into 测验

```
struct Color(u8, u8, u8);

impl From<(u8, u8, u8)> for Color {
    fn from((r, g, b): (u8, u8, u8)) -> Self {
        Color(r, g, b)
    }
}

fn main() {
    let c: Color = (255, 0, 0).into();
}
```

## TryFrom 和 TryInto 测验

```
use std::convert::TryFrom;

#[derive(Debug)]
struct EvenNumber(i32);

impl TryFrom<i32> for EvenNumber {
    type Error = String;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value % 2 == 0 {
            Ok(EvenNumber(value))
        } else {
            Err(String::from("不是偶数"))
        }
    }
}
```

## 编程练习

为 `Point` 实现 `From<(i32, i32)>`，然后分别用 `From::from()` 和 `.into()` 两种方式创建 `Point`：

```
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

// TODO: 为 Point 实现 From<(i32, i32)>


fn main() {
    // 用 From 显式转换
    let p1 = Point::from((1, 2));
    println!("p1: {:?}", p1);

    // 用 Into 隐式转换（由 From 自动推导，需标注目标类型）
    let p2: Point = (3, 4).into();
    println!("p2: {:?}", p2);
}
```
# 综合判断题

## 泛型语法测验

```
struct Stack<T> {
    items: Vec<T>,
}

impl<T> Stack<T> {
    fn new() -> Self { Stack { items: Vec::new() } }
    fn push(&mut self, item: T) { self.items.push(item); }
    fn pop(&mut self) -> Option<T> { self.items.pop() }
    fn is_empty(&self) -> bool { self.items.is_empty() }
}
```

# 编程练习

## 练习一：泛型栈

下面是一个只能存 `i32` 的栈，实现已经完整。请把它改成泛型版本 `Stack<T>`，让它能存任意类型：

```
// TODO: 把 i32 换成泛型参数 T
struct Stack {
    items: Vec<i32>,
}

impl Stack {
    fn new() -> Self {
        Stack { items: Vec::new() }
    }

    fn push(&mut self, item: i32) {
        self.items.push(item);
    }

    fn pop(&mut self) -> Option<i32> {
        self.items.pop()
    }

    fn peek(&self) -> Option<&i32> {
        self.items.last()
    }

    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }
}

fn main() {
    // 改完后这两段代码都应该能编译运行
    let mut int_stack: Stack<i32> = Stack::new();
    int_stack.push(1);
    int_stack.push(2);
    int_stack.push(3);
    println!("栈顶: {:?}", int_stack.peek()); // Some(3)
    println!("弹出: {:?}", int_stack.pop());  // Some(3)

    let mut str_stack: Stack<&str> = Stack::new();
    str_stack.push("hello");
    str_stack.push("world");
    println!("栈顶: {:?}", str_stack.peek()); // Some("world")
    println!("空栈: {}", int_stack.is_empty()); // false
}
```

## 练习二：泛型键值对

实现一个 `KeyValue<K, V>` 结构，存储一个键值对，并为它实现 `swap` 方法，返回键值互换后的新 `KeyValue<V, K>`。

```
struct KeyValue<K, V> {
    // TODO
}

impl<K, V> KeyValue<K, V> {
    fn new(key: K, value: V) -> Self {
        todo!()
    }

    fn swap(self) -> KeyValue<V, K> {
        todo!()
    }
}

fn main() {
    let pair = KeyValue::new("name", 42);
    println!("key={}, value={}", pair.key, pair.value); // key=name, value=42

    let swapped = pair.swap();
    println!("key={}, value={}", swapped.key, swapped.value); // key=42, value=name
}
```
生命周期是 Rust 最独特的特性之一——它让编译器能够在**不需要垃圾回收器**的情况下，保证所有引用永远不会成为悬垂指针。

本章从”为什么需要生命周期”出发，逐步学习如何在函数、结构体中标注生命周期，再掌握省略规则（让你少写大量标注）和特殊的 `'static` 生命周期。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 悬垂引用的问题，借用检查器如何通过生命周期保证内存安全 |                 |
| 函数和方法签名中的生命周期参数语法与语义 |                 |
| 包含引用字段的结构体如何声明生命周期 |                 |
| 三条省略规则，让你在大多数情况下不必手写标注 |                 |
| 运用生命周期知识解决实际问题  |                 |
# 悬垂引用问题

你已经知道 Rust 有”借用”这个概念：可以不转移所有权、只拿一个引用。但引用有个潜在风险——如果被引用的数据已经销毁了，引用还在，就会指向无效内存，这叫**悬垂引用**（dangling reference）。

C/C++ 程序员对这类 bug 再熟悉不过了：use-after-free、野指针……Rust 的目标是让这类错误**在编译期就被发现**，永远不到运行时。

## 一个会出问题的例子

看这段代码（你可能在借用与引用章节已经见过，我们再回顾一下）——它试图在内部作用域之外使用一个指向内部变量的引用：

```
fn main() {
    let r;

    {
        let x = 5;
        r = &x;       // r 借用了 x
    }                 // x 在这里被销毁

    println!("r: {}", r); // 危险！x 已经不存在了
}
```

> Rust 会直接拒绝编译，报错：`x` does not live long enough


`x` 的生命在内部 `{}` 结束时就结束了，但 `r` 要活到 `println!` 那行。`r` 比它所引用的数据活得更久——这就是悬垂引用。

## 没有问题的版本

只要让被引用的数据比引用活得更久，就没有问题：

```
fn main() {
    let x = 5;            // x 在这里创建，活得更长
    let r = &x;           // r 借用 x
    println!("r: {}", r); // 此时 x 还活着，完全合法
}
```

这两个例子的区别只是 `x` 声明的位置，但 Rust 完全知道哪个可以、哪个不行。靠什么知道？靠**借用检查器**。

# 借用检查器

## 编译器如何做判断

Rust 编译器内置了**借用检查器**（borrow checker），它的工作就是比对引用的生命周期与被引用数据的生命周期，确保前者不会超过后者。

我们用注释把生命周期可视化出来，看第一个出错的例子：

```
{
    let r;                // ------+-- 'r 的生命周期开始
                          //       |
    {                     //       |
        let x = 5;        // -+--  |  'x 的生命周期开始
        r = &x;           //  |    |
    }                     // -+    |  'x 生命周期结束！x 被销毁
                          //       |
    println!("{}", r);    //       |  r 仍然在用，但 'x 已经结束
}                         // ------+
```

`r` 的生命周期 `'r` 比 `x` 的生命周期 `'x` 更长。`r` 引用了 `x`，所以 `'x` 必须覆盖 `'r` 的整个范围——但它没有，编译器报错。

## 正确例子的生命周期

```
{
    let x = 5;            // ------+-- 'x 开始
                          //       |
    let r = &x;           // --+   |  'r 开始
                          //   |   |
    println!("{}", r);    //   |   |
                          // --+   |  'r 结束
}                         // ------+  'x 结束
```

`'x` 完全包含了 `'r`，引用有效，编译通过。

## 生命周期不是程序员”发明”的

生命周期参数（`'a`、`'b` 这样的写法）不是 Rust 独有的概念，它实际上描述的是**引用存在的那段时间**——这段时间本来就存在，只是 Rust 让你在某些场合把它写出来，让编译器能够核验。

就像类型标注一样：变量有类型是客观事实，大多数时候编译器能推断，偶尔你需要写出来。生命周期也是如此——大多数时候编译器能推断（这叫”省略”），偶尔你需要手动标注。


## 基础概念测验

```
fn main() {
    let r;
    {
        let x = 10;
        r = &x;
    }
    println!("{}", r);
}
```
# 函数中的标注

## 为什么函数需要手动标注

上一篇我们看到，两个变量之间的生命周期关系，编译器能自己推断。但函数呢？

考虑这个需求：写一个 `longest` 函数，接收两个字符串 slice，返回较长的那个。

```
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let s1 = String::from("abcd");
    let s2 = "xyz";
    println!("{}", longest(s1.as_str(), s2));
}
```

编译器报错：`missing lifetime specifier`，提示返回值是一个借用，但搞不清楚是从 `x` 还是 `y` 借的。

你可能会想：“上面的例子里 `s1` 和 `s2` 都在 `main` 里，生命周期一样长，不管返回哪个都没问题啊？“——确实，**这个特定的调用**没问题。但函数签名是一份**合约**，必须对所有可能的调用者都成立。这个函数完全可以被这样调用：

```
fn main() {
    let s1 = String::from("abcd");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
    }  // s2 在这里销毁
    println!("{}", result); // result 指向 s1 还是已销毁的 s2？
}
```

这里 `s1` 比 `s2` 活得更久。函数体里 `if x.len() > y.len() { x } else { y }` 要到运行时才知道返回哪个。如果返回了 `s2`，`result` 就变成悬垂引用了。

编译器检查函数和检查调用方是**完全隔离**的两件事：分析函数体时不看调用方，分析调用方时不看函数体。它在函数签名处看到”接受两个不知道谁更长的引用，返回其中一个”，却不知道该对返回值承诺多长的生命周期——所以报错，要求你手动说清楚。

## 生命周期标注语法

生命周期参数用撇号开头，通常命名为 `'a`、`'b`……写在 `&` 之后：

```
&i32        // 普通引用（没有显式生命周期）
&'a i32     // 带生命周期 'a 的引用
&'a mut i32 // 带生命周期 'a 的可变引用
```

和泛型类型参数一样，生命周期参数需要先在函数名后的尖括号里声明：

```
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let s1 = String::from("long string is long");
    let s2 = String::from("xyz");
    let result = longest(s1.as_str(), s2.as_str());
    println!("最长的字符串是：{}", result);
}
```

现在能编译了。`<'a>` 声明了一个泛型生命周期参数，签名说明：两个输入引用和返回值都与生命周期 `'a` 相关联。

## 深入理解：标注的含义

`<'a>` 到底说了什么？它说的是：

> 对于某个生命周期 'a，函数接受两个至少活 'a 这么久的字符串 slice，并返回一个也至少活 'a 这么久的字符串 slice。


**‘a 的实际值是 x 和 y 两个参数生命周期的「较短那个」。返回值的生命周期也会是这个较短值。有了这个信息，编译器就可以知道这个函数的返回值在调用方的作用域内是否是安全的。**

来看具体例子：

```
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("long string is long");
    {
        let s2 = String::from("xyz");
        // s1 和 s2 在这个 {} 内都有效
        // 'a 取两者中较短的，即 s2 的生命周期
        let result = longest(s1.as_str(), s2.as_str());
        println!("最长的：{}", result); // 合法，result 在 {} 内用
    }
}
```

如果把 `result` 放到内部作用域外面用，就会出问题：

```
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let s1 = String::from("long string is long");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
    }                    // s2 在这里销毁
    println!("{}", result); // 错误！result 可能引用已销毁的 s2
}
```

> 生命周期标注不改变任何引用的实际存活时间，它只是给编译器提供信息，让编译器能在违规时报错。


## 返回值生命周期必须来自参数

如果函数返回引用，这个引用要么指向某个参数，要么是 `'static`——不可能是函数内部创建的局部变量：

```
fn make_string<'a>() -> &'a str {
    let s = String::from("hello");
    s.as_str() // 错误：s 在函数结束时被销毁，返回的引用会悬垂
}
```

这种情况应该返回有所有权的 `String`，而不是引用：

```
fn make_string() -> String {
    String::from("hello")
}

fn main() {
    let s = make_string();
    println!("{}", s);
}
```

## 不相关的参数不需要标注

生命周期只需要标注**有关联**的参数和返回值。如果某个参数和返回值没有关系，不需要给它标注：

```
// y 和返回值没有关系，不需要同一个生命周期
fn always_first<'a>(x: &'a str, _y: &str) -> &'a str {
    x
}

fn main() {
    let s1 = String::from("hello");
    let result;
    {
        let s2 = String::from("world");
        result = always_first(s1.as_str(), s2.as_str());
    }
    println!("{}", result); // 合法，result 和 s1 同生命周期
}
```

# 生命周期强制转换 `'a: 'b`

前面的例子里，两个参数都标注了同一个 `'a`，编译器会取两者中较短的那个作为 `'a` 的实际值。但有时候你需要**明确表达”这两个生命周期有长短关系”**，而不是把它们合并成同一个。

考虑这种情形：函数接受两个引用，生命周期分别是 `'a` 和 `'b`，你想把 `'a` 的引用当成 `'b` 的引用来返回。这当然得有个前提——`'a` 至少和 `'b` 一样长，否则返回的引用可能比 `'b` 先失效。

打个比方：你租了一套房子，租约到 12 月底（`'a`）。朋友问你能不能借住到 6 月（`'b`）。没问题——你的租约比 6 月更长，可以”缩短承诺”给朋友。但如果租约只到 4 月，你就没法承诺到 6 月了。

`'a: 'b` 就是用来声明这个前提的。它读作”生命周期 `'a` 至少和 `'b` 一样长”（`'a` outlives `'b`），让编译器接受”把 `&'a T` 当 `&'b T` 用”这件事：

```
// 'a: 'b 表示 'a 至少和 'b 一样长
// 所以可以安全地把 &'a i32 当成 &'b i32 返回
fn choose_first<'a: 'b, 'b>(first: &'a i32, _second: &'b i32) -> &'b i32 {
    first
}

fn main() {
    let first = 10;
    let result;
    {
        let second = 20;
        // first 活得更长，可以被"缩短"到 second 的生命周期
        result = choose_first(&first, &second);
        println!("选择了: {}", result);
    }
}
```

为什么要这样写？签名说”返回值的生命周期是 `'b`”，但实际上我们返回的是 `first`（`'a`）。编译器需要知道 `'a` 至少和 `'b` 一样长，才能接受把 `'a` 引用当 `'b` 引用用。`'a: 'b` 就是这个保证。

> 日常代码里很少需要手写 'a: 'b——大多数情况编译器能自动推断。理解它的含义主要是为了读懂复杂的错误信息。



## 函数生命周期测验

```
fn dangle<'a>() -> &'a str {
    let s = String::from("hello");
    &s
}
```

## 编程练习

下面两个函数都无法编译，原因是缺少生命周期标注。请分析每个函数的返回值来自哪个参数，然后添加正确的标注使其通过编译。

注意：两个函数所需的标注方式不同——思考为什么。

```
// 函数 1：返回两个字符串中较短的那个
// 提示：返回值可能来自 a，也可能来自 b
fn shorter(a: &str, b: &str) -> &str {
    if a.len() <= b.len() { a } else { b }
}

// 函数 2：如果 text 以 prefix 开头，去掉前缀后返回剩余部分；否则原样返回
// 提示：返回值只可能来自 text，不会来自 prefix
fn strip_prefix(text: &str, prefix: &str) -> &str {
    if text.starts_with(prefix) {
        &text[prefix.len()..]
    } else {
        text
    }
}

fn main() {
    let s1 = String::from("hello");
    let result1;
    {
        let s2 = String::from("hi");
        result1 = shorter(&s1, &s2);
        println!("较短的：{}", result1);
    }

    let text = String::from("hello, world");
    let result2;
    {
        let prefix = String::from("hello, ");
        result2 = strip_prefix(&text, &prefix);
        // prefix 在这里销毁，但 result2 来自 text，text 还活着
    }
    println!("去掉前缀：{}", result2);
}
```
# 含引用的结构体

## 为什么结构体需要生命周期

到目前为止，你见过的结构体字段都是有所有权的类型，比如 `String`、`Vec<T>`、`i32`。这些类型在结构体销毁时随之销毁，没有引用的问题。

但如果你想让结构体**持有引用**——比如存一个字符串 slice `&str` 而不是 `String`——问题就来了：结构体不拥有那块数据，那块数据可能在结构体还活着的时候就被销毁了。

Rust 要求你在定义时明确标注生命周期，保证”结构体实例的生命周期不超过它所引用数据的生命周期”。

## 基本语法

先看不写标注会发生什么：

```
// 字段 part 是 &str，但没有任何生命周期信息
struct ImportantExcerpt {
    part: &str,
}
```

编译器直接报错：`missing lifetime specifier`——结构体持有引用，但编译器不知道这个引用需要活多久，无法做任何保证。

解决方法是在结构体名后声明一个生命周期参数，并把它标注到引用字段上：

```
// 'a 声明在结构体名后面的尖括号里
// 字段 part 是一个与 'a 关联的 &str 引用
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("叫我伊实马利。从前年轻的时候……");
    // novel 的所有权在这里，生命周期覆盖整个 main
    let first_sentence = novel.split('。').next().expect("没找到句号");
    // excerpt 引用了 novel 的一部分
    // novel 必须活得比 excerpt 更久（或一样久）
    let excerpt = ImportantExcerpt { part: first_sentence };
    println!("摘录：{}", excerpt.part);
}
```

`ImportantExcerpt<'a>` 的意思是：这个结构体实例不能比 `part` 字段所引用的数据活得更久。

如果尝试违反这个约束：

```
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let excerpt;
    {
        let novel = String::from("叫我伊实马利。从前年轻的时候……");
        let first = novel.split('。').next().unwrap();
        excerpt = ImportantExcerpt { part: first };
        // novel 在这里被销毁
    }
    println!("{}", excerpt.part); // 错误！excerpt 引用了已销毁的 novel
}
```

## 多个生命周期参数

结构体可以有多个生命周期参数，表示不同字段来自不同的数据源：

```
#[derive(Debug)]
struct TwoRefs<'a, 'b> {
    x: &'a i32,
    y: &'b i32,
}

fn main() {
    let a = 10;
    let result;
    {
        let b = 20;
        let t = TwoRefs { x: &a, y: &b };
        // a 和 b 可以有不同的生命周期
        result = *t.x; // 只复制 x 的值，不复制引用
        println!("t = {:?}", t);
    }
    println!("a = {}", result);
}
```

## 枚举中的生命周期

枚举的变体也可以包含引用，同样需要生命周期标注：

```
#[derive(Debug)]
enum Message<'a> {
    Quit,
    Move { x: i32, y: i32 },
    Write(&'a str),        // 持有一个字符串 slice 引用
    ChangeColor(u8, u8, u8),
}

fn process(msg: &Message) {
    match msg {
        Message::Write(text) => println!("写入：{}", text),
        Message::Move { x, y } => println!("移动到 ({}, {})", x, y),
        Message::Quit => println!("退出"),
        Message::ChangeColor(r, g, b) => println!("颜色：{} {} {}", r, g, b),
    }
}

fn main() {
    let text = String::from("hello");
    let msg = Message::Write(&text);
    process(&msg);
}
```

# impl 块的生命周期

## 基本写法

当你为带生命周期参数的结构体实现方法时，`impl` 关键字后面也需要声明生命周期：

```
struct Excerpt<'a> {
    part: &'a str,
}

// impl<'a> 声明生命周期，Excerpt<'a> 使用它
impl<'a> Excerpt<'a> {
    // 不涉及引用返回值时，方法签名可以很简洁
    fn level(&self) -> i32 {
        3
    }

    // 返回字段引用，生命周期由省略规则自动处理
    fn content(&self) -> &str {
        self.part
    }

    // 接受一个额外的引用参数
    fn announce_and_return(&self, announcement: &str) -> &str {
        println!("注意：{}", announcement);
        self.part // 返回 self.part，生命周期与 self 绑定
    }
}

fn main() {
    let text = String::from("这是一段重要的文字。后面还有更多内容。");
    let first = text.split('。').next().unwrap();
    let exc = Excerpt { part: first };

    println!("级别：{}", exc.level());
    println!("内容：{}", exc.content());
    println!("公告后返回：{}", exc.announce_and_return("请注意！"));
}
```

> impl<'a> 后面的 'a 与结构体定义中的 'a 是同一个生命周期参数。


## 为带生命周期的类型实现 trait

```
use std::fmt;

struct Wrapper<'a> {
    data: &'a [i32],
}

impl<'a> fmt::Display for Wrapper<'a> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let parts: Vec<String> = self.data.iter().map(|x| x.to_string()).collect();
        write!(f, "[{}]", parts.join(", "))
    }
}

fn main() {
    let nums = vec![1, 2, 3, 4, 5];
    let w = Wrapper { data: &nums };
    println!("{}", w);
}
```

## 方法中的生命周期

有了结构体生命周期的基础，现在可以来看方法里的情况了。

方法签名里通常有两条生命周期线索：一条是结构体字段带来的 `'a`，另一条是方法自身参数带来的新生命周期。关键问题是：**返回值的生命周期该跟哪条线索走？**

```
struct Config<'a> {
    host: &'a str,
    port: u16,
}

impl<'a> Config<'a> {
    // 返回的是 self.host，生命周期跟结构体的 'a 走
    // （省略规则自动处理，不需要手写）
    fn host(&self) -> &str {
        self.host
    }

    // 接受一个外部字符串，原样返回它
    // 返回值跟 new_host 走，和结构体的 'a 无关 → 需要独立的 'b
    fn with_host<'b>(&self, new_host: &'b str) -> &'b str {
        println!("原主机: {}", self.host);
        new_host
    }
}

fn main() {
    let host = String::from("localhost");
    let cfg = Config { host: &host, port: 8080 };

    let result;
    {
        let new_host = String::from("example.com");
        result = cfg.with_host(&new_host);
        println!("切换到: {}", result);
        // new_host 在这里销毁
    }
    println!("原来的: {}", cfg.host()); // cfg 和 host 仍然有效
}
```

`with_host` 为什么要用 `'b` 而不直接复用 `'a`？

如果写成 `fn with_host(&self, new_host: &'a str) -> &'a str`，调用方就必须保证 `new_host` 活得和 `self.host` 一样久——但 `new_host` 只是临时传进来用一下，没必要这么长寿。上面的例子里 `new_host` 在内部 `{}` 里就销毁了，如果强制要求它活到 `'a`，这段合理的代码就会被编译器拒绝。

独立的 `'b` 告诉编译器：**返回值只和 **`new_host`** 有关，和结构体的 **`'a`** 互不干扰**。

## 生命周期约束 T: ‘a

当结构体需要持有泛型类型 `T` 的引用时，要约束 `T` 里包含的引用不会比结构体本身先销毁。语法是 `T: 'a`：

- `T: 'a` — `T` 中的所有引用都必须比 `'a` 活得更久
- `T: Trait + 'a` — `T` 必须实现 `Trait`，且 `T` 中的所有引用都比 `'a` 活得更久

```
use std::fmt::Debug;

// Ref<'a, T> 持有一个指向 T 的引用
// T: 'a 保证 T 内部的引用在 'a 期间始终有效
#[derive(Debug)]
struct Ref<'a, T: 'a>(&'a T);

fn print_ref<'a, T>(t: &'a T)
where
    T: Debug + 'a,
{
    println!("{:?}", t);
}

fn main() {
    let x = 42;
    let r = Ref(&x);
    print_ref(r.0);

    let s = String::from("hello");
    print_ref(&s);
}
```

## trait 实现中的生命周期

为带生命周期参数的类型实现 trait 时，`impl` 块同样需要声明这个参数：

```
use std::fmt;

struct StrWrapper<'a> {
    content: &'a str,
}

// impl 块也要带 <'a>，与结构体定义保持一致
impl<'a> fmt::Display for StrWrapper<'a> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}]", self.content)
    }
}

fn main() {
    let s = String::from("Rust 生命周期");
    let w = StrWrapper { content: &s };
    println!("{}", w);
}
```

含有字符串的结构体，有两种写法：

```
// 方案 A：字段持有所有权（String）
// 优点：结构体完全独立，不依赖外部数据
// 缺点：创建时必须分配堆内存
struct OwnedConfig {
    host: String,
    port: u16,
}

// 方案 B：字段持有引用（&str）
// 优点：零拷贝，直接引用现有字符串
// 缺点：结构体生命周期受限于被引用字符串
struct BorrowedConfig<'a> {
    host: &'a str,
    port: u16,
}

fn main() {
    // A：任何时候都能用
    let cfg_owned = OwnedConfig {
        host: String::from("localhost"),
        port: 3000,
    };

    // B：只在 host 数据有效期内能用
    let host = String::from("example.com");
    let cfg_borrowed = BorrowedConfig { host: &host, port: 8080 };

    println!("A: {}:{}", cfg_owned.host, cfg_owned.port);
    println!("B: {}:{}", cfg_borrowed.host, cfg_borrowed.port);
}
```

> 实践建议： 初学时优先用 String（方案 A），更简单不容易出错。当你有明确的性能需求（避免拷贝），且数据来源的生命周期容易管理，再考虑方案 B。



## 结构体生命周期测验

## 编程练习

`Config` 结构体目前无法编译，它持有两个字符串 slice 引用。请添加正确的生命周期标注，使其能够工作：

```
// TODO: 给 Config 和 impl 块添加生命周期标注
struct Config {
    host: &str,
    path: &str,
}

impl Config {
    fn new(host: &str, path: &str) -> Self {
        Config { host, path }
    }

    fn url(&self) -> String {
        format!("https://{}{}", self.host, self.path)
    }
}

fn main() {
    let host = String::from("example.com");
    let path = String::from("/api/v1");
    let cfg = Config::new(&host, &path);
    println!("{}", cfg.url());
}
```
# 省略规则

## 为什么大多数时候不需要标注

学完前两篇你可能有个疑问：既然每个引用都有生命周期，为什么很多函数没有写 `'a` 也能编译？比如：

```
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return &s[0..i];
        }
    }
    &s[..]
}

fn main() {
    let s = String::from("hello world");
    println!("{}", first_word(&s));
}
```

这个函数既有引用参数又有引用返回值，按理说需要标注——但它没有，也能编译。

原因是 Rust 编译器内置了**生命周期省略规则**（lifetime elision rules）。这些规则覆盖了最常见的模式，当输入输出的生命周期关系可以唯一确定时，编译器帮你自动填写，你不需要手写。

> 省略规则不是”猜测”，而是确定性的推断。如果应用规则后仍有歧义，编译器会报错要求你显式标注。


## 三条省略规则

编译器按顺序应用这三条规则，对所有函数（包括 `fn` 定义和 `impl` 块）有效：

### 规则一：每个引用参数各自获得独立的生命周期

```
// 原始写法：
fn foo(x: &i32) -> i32 { *x }

// 编译器看到的：
fn foo<'a>(x: &'a i32) -> i32 { *x }
```

```
// 两个参数各自独立：
fn bar(x: &i32, y: &i32) -> i32 { x + y }

// 编译器看到的：
fn bar<'a, 'b>(x: &'a i32, y: &'b i32) -> i32 { x + y }
```

### 规则二：只有一个引用参数时，它的生命周期赋给所有返回引用

```
// 原始写法：
fn first_word(s: &str) -> &str { ... }

// 应用规则一后：
fn first_word<'a>(s: &'a str) -> &str { ... }

// 应用规则二后（只有一个输入生命周期 'a，赋给输出）：
fn first_word<'a>(s: &'a str) -> &'a str { ... }
```

这就是为什么 `first_word` 不需要手写标注！

### 规则三：方法中有 &self 或 &mut self 时，self 的生命周期赋给所有返回引用

这条规则让方法签名通常不需要任何生命周期标注：

```
struct Excerpt<'a> {
    part: &'a str,
}

impl<'a> Excerpt<'a> {
    // 有 &self 参数，规则三：返回值的生命周期与 &self 相同
    // 相当于: fn announce(&'b self, ann: &'c str) -> &'b str
    fn announce(&self, ann: &str) -> &str {
        println!("通知：{}", ann);
        self.part
    }
}

fn main() {
    let text = String::from("重要内容在这里。还有更多。");
    let first = text.split('。').next().unwrap();
    let exc = Excerpt { part: first };
    println!("{}", exc.announce("请注意"));
}
```

## 三条规则的实战演示

用规则来推导 `longest` 函数为什么必须手写标注：

```
// 原始：
fn longest(x: &str, y: &str) -> &str

// 规则一（两个引用参数，各自获得生命周期）：
fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str

// 规则二：多于一个输入生命周期，不适用
// 规则三：不是方法，没有 &self，不适用

// 结果：返回值的生命周期无法确定 → 编译器报错，要求你手写
```

这就是为什么 `longest` 必须手写 `<'a>`——三条规则用完还是有歧义。

## 省略规则是”语法糖”

省略掉的生命周期**依然存在**，只是不用写出来。加上或去掉都完全等价：

```
// 这两个函数完全等价
fn get_first(v: &[i32]) -> &i32 {
    &v[0]
}

fn get_first_explicit<'a>(v: &'a [i32]) -> &'a i32 {
    &v[0]
}

fn main() {
    let nums = vec![10, 20, 30];
    println!("{}", get_first(&nums));
    println!("{}", get_first_explicit(&nums));
}
```

# `'static` 生命周期

## 什么是 ‘static

`'static` 是一个特殊的生命周期，表示**整个程序运行期间都有效**。带有 `'static` 生命周期的数据永远不会被销毁（或者说活到程序结束）。

有两种方式产生 `'static` 数据：

**1. 字符串字面量：**

```
fn main() {
    // 类型推断能自动得出 &'static str，通常不需要手写
    let s1 = "我是字面量，住在二进制的只读段";

    // 只有在函数签名等需要明确约束时，才显式写出 'static
    let s2: &'static str = "这里显式写出来，效果相同";

    println!("{}", s1);
    println!("{}", s2);
}
```

**2. **`static`** 全局常量：**

```
// static 声明的值在整个程序期间存在
// 若字段是引用，'static 是隐含的，不需要写出来
static MAX_CONNECTIONS: u32 = 100;
static APPNAME: &str = "my-app"; // 等价于 &'static str，'static 可省略

fn main() {
    println!("最大连接数：{}", MAX_CONNECTIONS);
    println!("应用名：{}", APPNAME);
}
```

## ‘static 可以被”缩短”

`'static` 是最长的生命周期，它可以被强制转换成任何更短的生命周期。这很自然：一个活到程序结束的引用，在任何子区间内当然也是有效的。

```
static NUM: i32 = 18;

// 接受一个 &'a i32，返回一个 &'a i32
// 把 &'static i32 的 NUM 当作 &'a i32 传入，生命周期"缩短"了
fn coerce_static<'a>(_: &'a i32) -> &'a i32 {
    &NUM  // NUM 是 'static，但函数签名承诺只返回 'a 级别的引用
}

fn main() {
    let x = 10;
    let r = coerce_static(&x);
    println!("r = {}", r);
    println!("NUM = {} 仍然可访问", NUM);
}
```

## 何时该用 ‘static

`'static` 最常见的合法用途是**字符串字面量**和**全局常量**——它们确实在整个程序期间存在。

在函数签名中使用 `'static` 作为返回值约束，意味着返回的引用必须是这两者之一：

```
fn get_error_msg(code: u32) -> &'static str {
    match code {
        404 => "未找到",
        500 => "服务器内部错误",
        _ => "未知错误",
    }
}

fn main() {
    println!("{}", get_error_msg(404));
}
```

## 常见误区：不要乱用 ‘static

当你遇到生命周期错误时，编译器有时会建议”考虑使用 `'static`”，这**不是建议你真的这样做**，而是在告诉你一种可能的（但通常是错误的）解决方案。

```
// 错误的用法：试图用 'static 逃避生命周期问题
fn bad_idea(s: String) -> &'static str {
    // 不可能！s 在函数结束时销毁，没法返回 'static 引用
    &s
}
```

遇到生命周期错误，应该**找根本原因**——通常是返回引用而应该返回有所有权的值，或者调整数据的生命周期让它活得足够久。

> 规则：只有当数据真的在整个程序期间存在时，才使用 'static。如果你只是想”消除编译错误”而用它，几乎肯定是在掩盖真正的问题。


---

## 省略规则测验

下面是几组函数，判断编译器推断后的完整签名：

## ‘static 测验

## 编程练习

实现 `status_text` 函数，根据 HTTP 状态码返回对应的描述字符串。返回值类型应该是 `&'static str`——想想为什么这里用 `'static` 是合理的：

```
// TODO: 补全返回值类型和函数体
// 200 -> "OK"，404 -> "Not Found"，500 -> "Internal Server Error"，其他 -> "Unknown"
fn status_text(code: u32) -> ??? {
    todo!()
}

fn main() {
    println!("{}", status_text(200));
    println!("{}", status_text(404));
    println!("{}", status_text(500));
    println!("{}", status_text(418));
}
```
# 综合练习

本节通过一组难度递进的练习，综合检验你对生命周期的掌握。每道题都配有提示，遇到困难时可以先看提示再动手。

## 练习 1：修复悬垂引用

下面的函数试图返回在函数内部创建的字符串的引用，这会导致悬垂引用。请将函数改写成正确的版本——不返回引用，而是返回有所有权的值。

```
// 修复这个函数：让它能正确工作
fn get_greeting(name: &str) -> &str {
    let greeting = format!("你好，{}！", name);
    &greeting // 错误：greeting 在函数结束时被销毁
}

fn main() {
    let name = "Alice";
    let msg = get_greeting(name);
    println!("{}", msg);
}
```

## 练习 2：添加生命周期标注

`first_word` 函数接受两个 `&str` 参数：要搜索的文本和分隔符，返回第一个分隔符之前的部分。由于有两个引用参数，编译器无法推断返回值的生命周期——请添加正确的标注使其通过编译：

```
// 这个函数无法编译，请添加生命周期标注
// 提示：返回值只可能来自 text，和 separator 无关
fn split_before(text: &str, separator: &str) -> &str {
    match text.find(separator) {
        Some(pos) => &text[..pos],
        None => text,
    }
}

fn main() {
    let sentence = String::from("Alice,Bob,Charlie");
    let result;
    {
        let sep = String::from(",");
        result = split_before(&sentence, &sep);
        // sep 在这里销毁，但 result 来自 sentence，sentence 还活着
    }
    println!("第一段：{}", result);
    println!("原始：{}", sentence);
}
```

## 练习 3：含引用的结构体

`Parser` 结构体需要持有对输入字符串的引用，以便逐步解析。请添加生命周期标注并实现 `next_token` 方法，返回下一个以空格分隔的 token（每次调用后推进内部位置）：

```
// TODO: 给 Parser 添加生命周期标注
struct Parser {
    input: &str,
    pos: usize,
}

impl Parser {
    fn new(input: &str) -> Self {
        Parser { input, pos: 0 }
    }

    // 返回下一个 token（从 pos 开始的下一段不含空格的内容），如果已经到末尾，返回 None
    fn next_token(&mut self) -> Option<&str> {
        let start = self.pos
            + self.input[self.pos..].find(|c: char| !c.is_whitespace())?;
        let rest = &self.input[start..];
        let end = rest.find(char::is_whitespace).unwrap_or(rest.len());
        self.pos = start + end;
        Some(&self.input[start..start + end])
    }
}

fn main() {
    let text = String::from("hello world rust");
    let mut parser = Parser::new(&text);

    while let Some(token) = parser.next_token() {
        println!("token: {}", token);
    }
}
```

## 练习 4：生命周期与泛型结合

`Cache` 结构体用来缓存一个计算结果的引用。它持有一个对 `T` 类型数据的引用。请完成实现：

```
use std::fmt::Display;

// TODO: 添加生命周期标注
struct Cache {
    value: &i32,
    label: &str,
}

impl Cache {
    fn new(value: &i32, label: &str) -> Self {
        Cache { value, label }
    }
}

// 为 Cache 实现 Display trait，格式："{label}: {value}"
impl Display for Cache {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.label, self.value)
    }
}

fn main() {
    let result = 42;
    let name = String::from("答案");
    let cache = Cache::new(&result, &name);
    println!("{}", cache);
}
```

## 练习 5：识别省略规则

下面有四个函数签名，其中有的可以省略生命周期，有的不能。判断哪些能通过编译（无需修改），哪些需要手动添加生命周期标注才能编译，并在注释中解释原因：

```
// 判断下面哪些函数能直接编译，哪些需要添加生命周期标注
// 在每个函数前添加注释说明原因，然后修复不能编译的函数

// 函数 A
fn get_x(point: &(i32, i32)) -> &i32 {
    &point.0
}

// 函数 B（这个需要修改）
fn combine(a: &str, b: &str) -> &str {
    if a.len() > b.len() { a } else { b }
}

// 函数 C
fn identity(x: &str) -> &str {
    x
}

// 函数 D（这个需要修改）
fn first_of_two(a: &str, _b: &str) -> &str {
    a
}

fn main() {
    // 测试 A
    let p = (3, 4);
    println!("x = {}", get_x(&p));

    // 测试 C
    println!("{}", identity("hello"));
}
```