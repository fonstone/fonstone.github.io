---
title: "自定义类型"
description: "结构体、方法语法、枚举、模式匹配、Option 类型、常量"
date: "2026-07-12"
order: 4
tags: ["结构体", "枚举", "模式匹配", "Option"]
est_time: "60 分钟"
---

你已经学过 Rust 的基本类型（整数、浮点、布尔、字符串等）。现在是时候创建自己的类型了。

结构体用于将相关数据组织在一起，枚举表达”多选一”的语义，`match` 则是处理枚举值的利器——这三者结合，构成了 Rust 描述复杂问题域的核心工具。`Option<T>` 是 Rust 处理”值可能不存在”问题的答案，用来彻底替代其他语言中的 `null`。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 定义和实例化结构体，字段更新语法与元组结构体 |                 |
| 用               | impl            | 块为结构体添加方法和关联函数  |
| 定义枚举类型，枚举变体中携带数据 |                 |
| match           | 表达式的用法，穷尽匹配与通配模式 |
| 简洁处理单一模式的语法糖    |                 |
| 用               | Option          | 安全地表达值的存在或缺失，替代 null |
| const           | 、               | static          | 与编译期常量的使用场景     |
| 综合运用自定义类型解决实际问题 |                 |
# 什么是结构体

**结构体**（struct）是 Rust 中最常用的自定义类型，允许你将多个相关的数据组织在一起，并给每个数据片段起一个有意义的名字。

想象你要存储一个矩形的尺寸。用普通变量，你可能这样写：

```
fn main() {
    let width = 30;
    let height = 50;

    println!("矩形尺寸：宽 {}, 高 {}", width, height);
}
```

这样做的问题是：没有清晰表现出这两个数字是相关的（都属于同一个矩形）。用**元组**能改进一点：

```
fn main() {
    let rect = (30, 50);

    println!("矩形尺寸：宽 {}, 高 {}", rect.0, rect.1);
}
```

但是代码读者仍然需要记住”第一个字段是宽，第二个是高”。如果用结构体：

```
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect = Rectangle {
        width: 30,
        height: 50,
    };

    println!("矩形尺寸：宽 {}, 高 {}", rect.width, rect.height);
}
```

现在一切都清晰了：字段有名字，代码自解释。**这就是结构体的核心价值**——用有意义的名字让代码更易维护。

# 定义和实例化结构体

## 基本语法

定义结构体使用 `struct` 关键字，后跟结构体名和一对大括号，括号内列出**字段**（field）及其类型：

```
struct User {
    name: String,
    email: String,
    age: u32,
    active: bool,
}

fn main() {
    // 创建一个实例
    let user1 = User {
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
        age: 30,
        active: true,
    };

    println!("用户：{}, 邮箱：{}", user1.name, user1.email);
}
```

**几个要点：**

- 结构体名按惯例使用**大驼峰**（CapitalCase）
- 字段名按惯例使用**蛇形命名**（snake_case）
- 字段顺序在实例化时**可以不同**，因为用的是名字而不是位置
- 访问字段用**点号**（`.`）

## 修改字段值

只有当结构体实例是 `mut` 时，才能修改它的字段：

```
struct User {
    name: String,
    email: String,
}

fn main() {
    let mut user1 = User {
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
    };

    user1.email = String::from("newemail@example.com"); // ✓ 可以修改
    println!("新邮箱：{}", user1.email);
}
```

**重要：** Rust 不支持让结构体的部分字段可变，部分字段不可变。要么整个实例是 `mut`，要么都是不可变的。

### 嵌套结构体的可变性

`mut` 会沿路径**向下传递**，嵌套的字段也全部变为可变：

```
struct Inner {
    value: i32,
}

struct Outer {
    inner: Inner,
    name: String,
}

fn main() {
    let mut outer = Outer {
        inner: Inner { value: 1 },
        name: String::from("test"),
    };

    outer.inner.value = 42;  // ✓ outer 是 mut，嵌套字段也可以改
    println!("inner.value = {}", outer.inner.value);
}
```

### 字段是 &mut 引用时

当字段本身是 `&mut T` 引用时，有一个微妙的区别——**通过引用修改数据**和**替换引用字段本身**是两回事：
（以下有一个’a 的语法，现在还没有学习过，这里可以暂时不用管它，后面会讲解，和现在讲解的内容无关）

```
struct Wrapper<'a> {
    data_ptr: &'a mut i32,
}

fn main() {
    let mut x = 5;
    let w = Wrapper { data_ptr: &mut x };  // w 本身不是 mut

    *(w.data_ptr) = 10;  // ✓ 通过 &mut 引用修改数据，不需要 w 是 mut
    println!("x = {}", x);
}
```

```
struct Wrapper<'a> {
    data_ptr: &'a mut i32,
}

fn main() {
    let mut x = 5;
    let mut y = 99;
    let w = Wrapper { data_ptr: &mut x };  // w 不是 mut

    w.data_ptr = &mut y;  // 错误！替换字段本身需要 w 是 mut
}
```

![切片的原理](/images/rust/data_ptr_mut.svg)

![切片的原理](/images/rust/w_mut.svg)
规律：

- w实例的`mut` 控制**能不能改这个字段引用的自身地址**
- data_ptr的`mut` 控制**能不能改这个字段引用指向的数据的值**

> 另外，这里 data_ptr 和 x、y 的可变性必须一致，也就是 data_ptr 如果是 mut，那么 x、y 也必须申请为 mut，不然会编译拦截


## 从函数返回结构体实例

结构体可以作为函数的返回值：

```
struct User {
    name: String,
    email: String,
}

fn create_user(name: String, email: String) -> User {
    User {
        name: name,
        email: email,
    }
}

fn main() {
    let user = create_user(
        String::from("Bob"),
        String::from("bob@example.com"),
    );
    println!("用户 {} 已创建", user.name);
}
```

# 结构体的语法糖

## 字段初始化简写语法

当**函数参数名与结构体字段名相同**时，可以省略重复的 `field: field`：

```
struct User {
    name: String,
    email: String,
}

// 普通写法
fn create_user_verbose(name: String, email: String) -> User {
    User {
        name: name,
        email: email,
    }
}

// 简写写法
fn create_user(name: String, email: String) -> User {
    User {
        name,     // 相当于 name: name
        email,    // 相当于 email: email
    }
}

fn main() {
    let user = create_user(
        String::from("Charlie"),
        String::from("charlie@example.com"),
    );
    println!("邮箱：{}", user.email);
}
```

这个简写在实际代码中非常常用。

## 结构体更新语法

有时你想基于一个已有的实例，创建一个新实例，但修改其中某些字段。**结构体更新语法**（`..`）让这个操作很简洁：

```
struct User {
    name: String,
    email: String,
    age: u32,
}

fn main() {
    let user1 = User {
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
        age: 30,
    };

    // 创建 user2，只改邮箱，其他字段复用 user1 的值
    let user2 = User {
        email: String::from("alice.new@example.com"),
        ..user1  // 用 user1 的其他字段填充
    };

    println!("user2 的名字：{}, 邮箱：{}", user2.name, user2.email);
}
```

**语法要点：**

- `..` 必须放在最后，表示”剩余字段用某个实例的对应字段填充”
- 可以显式指定某些字段，用 `..` 填充其他字段

> 关于所有权的警告：结构体更新语法会转移没有被明确赋值的字段的所有权。在上面的例子中，name 是 String（非 Copy 类型），所以 user1.name 的所有权被转移到了 user2，之后不能再用 user1.name：

```
struct User {
    name: String,
    email: String,
}

fn main() {
    let user1 = User {
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
    };

    let user2 = User {
        email: String::from("new@example.com"),
        ..user1
    };

    println!("{}", user1.name);  // 错误！user1.name 已被转移
}
```


有三种情况下，`user1` 的字段在更新语法后**仍然可用**：

```
struct User {
    name: String,
    age: u32,
    email: String,
}

fn main() {
    let user1 = User {
        name: String::from("Alice"),
        age: 30,
        email: String::from("alice@example.com"),
    };

    // 情况一：字段被显式赋了新值，不会被转移
    let user2 = User {
        email: String::from("new@example.com"),
        ..user1
    };
    println!("{}", user1.email);  // ✓ email 被显式赋值了，不会转移

    // 情况二：字段是 Copy 类型，复制而非转移
    let user3 = User {
        name: String::from("Bob"),
        ..user2
    };
    println!("{}", user2.age);  // ✓ age 是 u32（Copy 类型），可以继续用

    // 情况三：对实例调用 clone，避免所有权转移
    let user4 = User {
        age: 35,
        ..user3.clone()  // 克隆整个实例，非 Copy 字段也被复制
    };
    println!("{}", user3.name);  // ✓ user3 已被 clone，原值仍可用
}
```

**关键点：**

- **显式赋新值**——该字段不转移
- **Copy 类型**（如 `u32`、`bool` 等）——自动复制，不转移
- `..user.clone()`——克隆整个实例，所有字段都被复制

# 结构体与所有权

结构体是 **Copy** 还是 **Move** 类型，**完全取决于它的字段**：

- 如果**所有字段都是 Copy 类型**（如 `u32`、`bool`、`i32` 等），那么整个结构体自动是 Copy 类型
- 如果**任何一个字段是 Move 类型**（如 `String`），那么整个结构体就是 Move 类型

看一个对比：

```
struct Point {
    x: i32,
    y: i32,  // 都是 Copy 类型
}

struct User {
    name: String,   // Move 类型
    age: u32,       // Copy 类型
}

fn main() {
    let p1 = Point { x: 10, y: 20 };
    let p2 = p1;  // ✓ Copy 结构体，p1 仍可用
    println!("{:?}", p1);

    let u1 = User {
        name: String::from("Alice"),
        age: 30,
    };
    let u2 = u1;  // Move 结构体，u1 的所有权转移到 u2
    // println!("{:?}", u1);  // ✗ 错误！u1 已被 move
}
```

**推论**：

- Copy 结构体赋值时复制所有数据，源变量仍可用
- Move 结构体赋值时转移所有权，源变量失效
- 这就是为什么在前面的例子中，`user1` 通过 `..user` 更新语法会失去 `name` 字段的所有权——因为 `User` 是 Move 类型（包含 String）

# 三种结构体形式

Rust 支持三种结构体定义方式。

## 1. 具名字段结构体（最常用）

就是我们一直在用的形式，字段都有名字：

```
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 10, y: 20 };
    println!("点坐标：({}, {})", p.x, p.y);
}
```

## 2. 元组结构体

当你只关心字段**类型**而不需要给每个字段起名字时，可以用元组结构体。这在为了区分不同类型而创建”包装类型”时很有用：

```
struct Color(u8, u8, u8);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);

    // 访问字段用索引（从 0 开始）
    println!("黑色的红通道：{}", black.0);
    println!("原点的 x 坐标：{}", origin.0);
}
```

**注意**：`Color` 和 `Point` 是**不同的类型**，即使它们的字段都是三个 `i32` 或 `u8`。这正是元组结构体的价值——让编译器区分具有不同语义的数据。

普通元组与元组结构体的区别：

- 普通元组：不用提前定义。属于“数据层面的临时拼凑”，追求的是快捷、高效。
- 元组结构体：必须提前定义。属于“面向对象/强类型的封装”，追求的是业务语义的明确、以及严苛的类型安全防线。

## 3. 类单元结构体（Unit-Like）

没有任何字段的结构体。看起来奇怪，但在与 trait 结合时很有用（后续章节会讲）：

```
struct Marker;

fn main() {
    let m = Marker;
    println!("标记创建成功");
}
```

# 调试打印

在格式化输出一章我们讲解过自定义类型不能使用 `{}` 进行打印，现在我们再复习一下：默认 `println!` 用 `{}` 格式化器不支持结构体（因为如何显示没有统一的答案）。需要改用 `{:?}` 或 `{:#?}`：

```
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("{}", rect);  // 错误！无法用 {} 打印 Rectangle
}
```

解决办法是派生 `Debug` trait（目前你只需知道这个语法）：

```
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };

    // 紧凑格式
    println!("矩形：{:?}", rect);

    // 漂亮打印（多行）
    println!("矩形：{:#?}", rect);
}
```

# 练习题

## 结构体基础测验

```
struct Book {
    title: String,
    author: String,
    pages: u32,
}
```

```
struct User {
    name: String,
    email: String,
}

fn main() {
    let user1 = User {
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
    };
}
```

## 编程练习

### 练习 1：创建和修改结构体

定义一个 `Person` 结构体，包含 `name`（String）、`age`（u32）、`email`（String）三个字段。创建两个实例，修改其中一个的邮箱并打印两个实例的信息。

```
struct Person {
    // TODO: 定义三个字段
}

fn main() {
    // TODO: 创建 person1，name="Alice", age=28, email="alice@example.com"

    // TODO: 创建 person2，name="Bob", age=35, email="bob@example.com"

    // TODO: 修改 person2 的 email 为 "bob.new@example.com"

    // TODO: 打印两个实例（需要使用 {:?} 和 derive Debug）
}
```

### 练习 2：使用结构体更新语法

定义一个 `Config` 结构体，包含 `host`、`port` 和 `debug` 三个字段。创建一个默认配置，然后基于它创建两个变体（只改某个字段）。

```
struct Config {
    host: String,
    port: u16,
    debug: bool,
}

fn main() {
    let default_config = Config {
        host: String::from("localhost"),
        port: 8080,
        debug: false,
    };

    // TODO: 创建 dev_config，基于 default_config 但改 port 为 3000

    // TODO: 创建 prod_config，基于 default_config 但改 host 为 "0.0.0.0" 和 debug 为 true

    // TODO: 打印三个配置（需要派生 Debug）
}
```
# 从函数到方法

前面我们学过函数，也学过结构体。现在的问题是：如何让某个函数与某个结构体**紧密关联**？

比如，计算矩形面积的逻辑本质上是**矩形的行为**，而不是一个独立的工具函数。用函数实现需要这样：

```
struct Rectangle {
    width: u32,
    height: u32,
}

fn area(rect: &Rectangle) -> u32 {
    rect.width * rect.height
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("面积：{} 平方像素", area(&rect));
}
```

问题是：读代码的人需要去别处找 `area` 函数，且不清楚它属于哪个类型。如果 Rust 能把函数”附属”到结构体上就好了。

**方法** 就是解决这个问题的。方法是与某个类型相关联的函数，可以用 `.` 运算符调用：

```
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("面积：{} 平方像素", rect.area());
}
```

现在清晰多了：`area()` 是 `Rectangle` 的方法，调用时直接用 `rect.area()`。

# 定义方法

方法定义在 `impl`** 块**（implementation block）中。语法：

```
struct Circle {
    radius: f64,
}

impl Circle {
    fn area(&self) -> f64 {
        3.14159 * self.radius * self.radius
    }

    fn is_large(&self) -> bool {
        self.area() > 100.0
    }
}

fn main() {
    let circle = Circle { radius: 5.0 };
    println!("圆的面积：{:.2}", circle.area());
    println!("是否很大？{}", circle.is_large());
}
```

**关键点：**

- `impl 类型名 { ... }` 定义该类型的实现块
- 方法的**第一个参数总是 **`self`，它代表调用方法的实例
- 方法在 `impl` 块中，与类型在同一个逻辑命名空间

## self 的三种形式

方法可以以三种方式接收 `self`，取决于方法是否需要修改实例：

### 1. `&self` — 不可变借用（最常用）

方法只需读取字段值：

```
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn width(&self) -> bool {
        self.width > 0
    }
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("面积：{}", rect.area());
    println!("宽度是否为正？{}", rect.width());
}
```

### 2. `&mut self` — 可变借用

方法需要修改字段值：

```
struct Counter {
    count: i32,
}

impl Counter {
    fn increment(&mut self) {
        self.count += 1;
    }

    fn value(&self) -> i32 {
        self.count
    }
}

fn main() {
    let mut c = Counter { count: 0 };
    c.increment();
    c.increment();
    println!("计数器值：{}", c.value());
}
```

### 3. `self` — 获取所有权（不常见）

方法消费掉实例（获取完全所有权），调用后实例无法再用。这用于需要将实例转换成其他形式的情况：

```
struct Document {
    content: String,
}

impl Document {
    fn into_uppercase(self) -> String {
        self.content.to_uppercase()
    }
}

fn main() {
    let doc = Document { content: String::from("hello") };
    let upper = doc.into_uppercase();
    println!("{}", upper);
    // println!("{}", doc.content);  // 错误！doc 已被转移
}
```

> 命名惯例：获取所有权的方法经常用 into_ 前缀，表示”消费转换”。比如 into_uppercase() 表示”消费这个实例，返回大写版本”。


## 多个参数的方法

方法可以有除 `self` 外的其他参数：

```
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    let rect2 = Rectangle { width: 10, height: 40 };
    let rect3 = Rectangle { width: 60, height: 45 };

    println!("rect1 能容纳 rect2？{}", rect1.can_hold(&rect2));
    println!("rect1 能容纳 rect3？{}", rect1.can_hold(&rect3));
}
```

# 关联函数

有时你需要一个与某个类型相关但**不作用于实例**的函数，比如构造函数。这叫**关联函数**（associated function）。定义方式是在 `impl` 块中不使用 `self` 参数：

```
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // 关联函数，用于创建正方形
    fn square(size: u32) -> Rectangle {
        Rectangle {
            width: size,
            height: size,
        }
    }

    // 普通方法
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    // 用关联函数创建实例，用 :: 而不是 .
    let square = Rectangle::square(50);
    println!("正方形面积：{}", square.area());
}
```

**关键点：**

- 关联函数用 `::` 调用（命名空间操作符），如 `Rectangle::square(50)`
- `String::from()` 就是一个关联函数
- 关联函数经常用作**构造函数**（从某些数据创建实例）

# 多个 impl 块

你可以为同一个类型定义多个 `impl` 块。这在组织代码时很有用（虽然通常不必要）：

```
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn perimeter(&self) -> u32 {
        2 * (self.width + self.height)
    }
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };
    println!("面积：{}, 周长：{}", rect.area(), rect.perimeter());
}
```

多个 `impl` 块在泛型和 trait（后续章节）中特别有用，可以为不同的类型参数或 trait 提供不同的实现。

# 自动引用和解引用

Rust 有一个方便的特性：调用方法时，**自动添加 **`&`**、**`&mut`** 或 **`*`** 以匹配方法签名**。

比如，方法签名是 `&self`，但你调用时用的可能是：

```
struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn distance_from_origin(&self) -> f64 {
        ((self.x.pow(2) + self.y.pow(2)) as f64).sqrt()
    }
}

fn main() {
    let p = Point { x: 3, y: 4 };

    // 这四种调用方式都等价：
    p.distance_from_origin();      // 自动转为 (&p).distance_from_origin()
    (&p).distance_from_origin();   // 显式写出

    let p_ref = &p;
    p_ref.distance_from_origin();  // 也可以
}
```

这个特性使 Rust 的方法调用语法很优雅，无需手动管理引用。所以 `->`（C/C++ 的结构体指针成员访问符）在 Rust 里完全不需要——`.` 就够了，编译器会自动帮你处理。


```
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}
```

## 编程练习

### 练习 1：为结构体添加方法

定义一个 `Account` 结构体，包含 `balance`（f64）字段。为它实现三个方法：

```
struct Account {
    balance: f64,
}

impl Account {
    fn deposit(&mut self, amount: f64) {
        // TODO: 实现
    }

    fn withdraw(&mut self, amount: f64) -> bool {
        // TODO: 实现，余额不足返回 false，否则返回 true
    }

    fn get_balance(&self) -> f64 {
        // TODO: 实现
    }
}

fn main() {
    let mut account = Account { balance: 100.0 };

    println!("初始余额：{}", account.get_balance());

    account.deposit(50.0);
    println!("存入 50 后：{}", account.get_balance());

    if account.withdraw(30.0) {
        println!("取出 30 成功，余额：{}", account.get_balance());
    }

    if !account.withdraw(200.0) {
        println!("取出 200 失败（余额不足）");
    }
}
```

### 练习 2：实现关联函数作为构造函数

定义一个 `Color` 结构体，包含 `r`、`g`、`b` 三个 `u8` 字段，写出对应关联函数和方法并实现三个功能：

```
#[derive(Debug)]
struct Color {
    r: u8,
    g: u8,
    b: u8,
}

// TODO: 返回白色 (255, 255, 255)
// TODO: 返回黑色 (0, 0, 0)
// TODO: 计算亮度（(r+g+b)/3）

fn main() {
    let white = Color::white();
    let black = Color::black();

    println!("白色亮度：{:.2}", white.brightness() as f64);
    println!("黑色亮度：{:.2}", black.brightness() as f64);
}
```
# 什么是枚举

**枚举**（enum）允许你定义一个类型，其值**只能是预先列举的几个成员之一**。

日常比喻：一个消息可能是”收到新邮件”、“收到推送通知”或”收到短信”，但同一时刻只能是其中一种。这正是枚举的用途。

## 为什么需要枚举

比如你要表示网络请求的状态：

```
// 不好的做法：用多个布尔字段，容易陷入矛盾状态
struct RequestStatus {
    is_pending: bool,
    is_success: bool,
    is_error: bool,
}

fn main() {
    // 这个状态是什么？同时是 success 和 error？这没有意义！
    let status = RequestStatus {
        is_pending: true,
        is_success: true,
        is_error: false,
    };
}
```

用枚举：

```
enum RequestStatus {
    Pending,
    Success,
    Error,
}

fn main() {
    // 清晰明了：只能是这三个状态之一
    let status = RequestStatus::Pending;
}
```

枚举通过编译器的强制，确保**不会陷入无效的状态组合**。

## 定义和使用枚举

基本语法：

```
enum Direction {
    North,
    South,
    East,
    West,
}

fn main() {
    let my_direction = Direction::North;

    // 可以有多个成员
    let go_east = Direction::East;
    let go_back = Direction::South;
}
```

**关键点：**

- 成员名用 `EnumName::MemberName` 访问
- 成员名按惯例用大驼峰
- 同一枚举的所有成员都是同一类型

# 枚举成员与关联数据

枚举的真正力量在于：**每个成员可以关联不同类型的数据**。

> 对于 C 程序员的类比：Rust 枚举相当于 C 的 tagged union（带标签的联合体）。C 的 union 让多个成员共享同一块内存但没有标记当前活跃成员，容易出错。Rust 枚举自动添加标签记录当前变体，编译器强制安全地访问数据，无需手动维护标志位。


## 简单关联数据

比如，一条消息可能是”发送字符串”或”发送数字”：

```
enum Message {
    Text(String),
    Number(i32),
}

fn main() {
    let msg1 = Message::Text(String::from("Hello"));
    let msg2 = Message::Number(42);
}
```

每个成员可以关联不同数量和类型的数据：

```
enum Message {
    Quit,                          // 无数据
    Move { x: i32, y: i32 },       // 结构体风格的数据
    Write(String),                 // 单个值
    ChangeColor(i32, i32, i32),    // 多个值
}

fn main() {
    let msg1 = Message::Quit;
    let msg2 = Message::Move { x: 10, y: 20 };
    let msg3 = Message::Write(String::from("hello"));
    let msg4 = Message::ChangeColor(255, 0, 0);
}
```

这相当于用不同的结构体，但统一在一个类型下。

## 为什么这比结构体更好

假设没有枚举，你可能这样做：

```
struct MoveMessage {
    x: i32,
    y: i32,
}

struct WriteMessage {
    text: String,
}

// 现在要处理这些消息，写的函数很难处理...
```

用枚举就简单了，所有消息都是一种类型。

# 为枚举定义方法

像结构体一样，枚举也可以有方法：

```
enum GameResult {
    Win,
    Lose,
    Draw,
}

impl GameResult {
    fn message(&self) -> String {
        match self {
            GameResult::Win => String::from("你赢了！"),
            GameResult::Lose => String::from("你输了"),
            GameResult::Draw => String::from("平局"),
        }
    }
}

fn main() {
    let result = GameResult::Win;
    println!("{}", result.message());
}
```

（这里用到了 `match`，后续会详细讲）

# 常见枚举模式

## 状态机

用枚举模型系统状态：

```
#[derive(Debug)]
enum PlayerState {
    Idle,
    Walking,
    Running,
    Jumping { height: u32 },
}

impl PlayerState {
    fn can_jump(&self) -> bool {
        match self {
            PlayerState::Idle | PlayerState::Walking => true,
            _ => false,
        }
    }
}

fn main() {
    let state = PlayerState::Idle;
    println!("当前状态能跳吗？{}", state.can_jump());
}
```

## 错误表示

用枚举表示各种错误情况（先了解，后续错误处理章节会深入）：

```
enum FileError {
    NotFound,
    PermissionDenied,
    UnknownError(String),
}

fn main() {
    let error = FileError::NotFound;
}
```


```
enum TrafficLight {
    Red,
    Yellow,
    Green,
}
```

```
enum Color {
    Red(u8, u8, u8),
    Hex(String),
}

fn main() {
    let color1 = Color::Red(255, 0, 0);
    let color2 = Color::Hex(String::from("#FF0000"));
}
```

## 编程练习

### 练习 1：定义包含关联数据的枚举

定义一个 `FileOperation` 枚举，包含以下成员：

- `Create(String)` — 创建文件（参数是文件名）
- `Delete(String)` — 删除文件
- `Read(String)` — 读取文件
- `Write { filename: String, content: String }` — 写入文件

创建几个实例并打印（需要派生 Debug）：

```
#[derive(Debug)]
enum FileOperation {
    // TODO: 定义四个成员
}

fn main() {
    let op1 = FileOperation::Create(String::from("test.txt"));
    let op2 = FileOperation::Write {
        filename: String::from("test.txt"),
        content: String::from("Hello, world!"),
    };
    let op3 = FileOperation::Read(String::from("test.txt"));

    println!("{:?}", op1);
    println!("{:?}", op2);
    println!("{:?}", op3);
}
```

### 练习 2：重构：用枚举替代多个结构体

下面用多个结构体定义了不同的网络消息，你的任务是把这段代码改写成用枚举来统一这些消息。

**原来的代码（多个结构体）：**

```
struct QuitMessage;               // 关闭应用
struct MoveMessage {
    x: i32,
    y: i32,
}                                // 移动光标
struct WriteMessage {
    text: String,
}                                // 写入文本
struct ChangeColorMessage {
    r: u8,
    g: u8,
    b: u8,
}                                // 改变颜色
```

**你的任务：** 定义一个 `Message` 枚举，把上面四种消息统一为一个类型。每个成员的关联数据结构应该与原结构体完全对应。然后创建各种类型的消息实例并打印它们。

```
// TODO: 定义 Message 枚举，包含上面四种消息

fn main() {
    let quit = Message::Quit;
    let move_msg = Message::Move { x: 100, y: 200 };
    let write_msg = Message::Write(String::from("Hello"));
    let color_msg = Message::ChangeColor { r: 255, g: 0, b: 0 };

    // TODO: 使用 {:?} 打印这四个消息（需要派生 Debug）
}
```
# match 表达式的威力

`match` 是 Rust 中最强大的控制流构造，它结合了 C 的 `switch` 和模式匹配的强大功能。（上一节你可能已经看到了如何使用，本篇文章我们将深入一些细节）

基本思想：

- 比较一个值与一系列模式
- 执行与第一个匹配的模式对应的代码
- **编译器强制检查所有可能的情况**

## 基本 match 语法

```
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u32 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}

fn main() {
    println!("Penny 价值 {} 美分", value_in_cents(Coin::Penny));
    println!("Quarter 价值 {} 美分", value_in_cents(Coin::Quarter));
}
```

**结构：**

- `match 表达式 { ... }` — 要匹配的值放在 `match` 后
- 每个分支：`模式 => 代码`
- 分支间用逗号分隔
- 多行代码用大括号：`模式 => { ... }`

# 绑定匹配值中的数据

枚举成员常包含数据，`match` 可以解构这些数据：

```
enum UsState {
    Alabama,
    Alaska,
    Arizona,
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn describe_coin(coin: Coin) -> String {
    match coin {
        Coin::Penny => String::from("闪闪发光的便士"),
        Coin::Nickel => String::from("镍币"),
        Coin::Dime => String::from("十美分硬币"),
        Coin::Quarter(state) => {
            format!("来自 {:?} 的 25 美分硬币", state)
        }
    }
}

fn main() {
    let coin = Coin::Quarter(UsState::Alaska);
    println!("{}", describe_coin(coin));
}
```

当匹配 `Quarter(state)` 时，`state` 被**绑定**到内部的 `UsState` 值。

# 穷尽性与模式匹配

`match` 的核心是两个特性：**穷尽性检查**（所有情况都必须处理）和**灵活的模式**（提取或忽略你关心的部分）。

## 穷尽性检查：必须处理所有情况

`match` 必须覆盖所有可能的情况，否则编译失败：

```
enum TrafficLight {
    Red,
    Yellow,
    Green,
}

fn check_light(light: TrafficLight) {
    match light {
        TrafficLight::Red => println!("停止"),
        TrafficLight::Yellow => println!("准备"),
        // 编译错误：缺少 Green 分支
    }
}
```

编译器会明确告诉你哪个情况被遗漏。这防止了难以追踪的逻辑 bug。

## 用 catch-all 模式满足穷尽性

当有很多情况但你只关心其中几个时，用 `_` 或变量名作为 catch-all 模式来处理其他所有情况：

### 方案一：用 `_` 丢弃其他值

```
fn describe_number(n: u8) {
    match n {
        0 => println!("零"),
        1 => println!("一"),
        2 => println!("二"),
        _ => println!("其他数字"),  // 满足穷尽性，但不使用值
    }
}

fn main() {
    describe_number(0);
    describe_number(5);
}
```

### 方案二：用变量名捕获其他值

```
fn main() {
    let dice_roll = 9;

    match dice_roll {
        3 => println!("加帽子"),
        7 => println!("移除帽子"),
        other => println!("移动玩家 {} 步", other),  // other 捕获了值 9
    }
}
```

**对比：**

- `_` — 匹配任何值但丢弃（不能使用）
- `other`（或任何变量名） — 匹配任何值并将其绑定到变量（可以在分支中使用）

## 提取部分值：灵活提取关心的字段

match 时，你可以选择性地提取字段，而不必全部提取。

### 用 `_` 忽略元组中的字段

```
#[derive(Debug)]
enum Point {
    Point2D(i32, i32),
    Point3D(i32, i32, i32),
}

fn main() {
    let p = Point::Point3D(1, 2, 3);

    match p {
        Point::Point3D(x, _, _) => println!("只关心 x：{}", x),
        Point::Point2D(x, y) => println!("2D 点：({}, {})", x, y),
    }
}
```

### 用 `..` 忽略结构体中的字段

```
#[derive(Debug)]
enum Person {
    Student { name: String, grade: u32 },
    Teacher { name: String, subject: String },
}

fn main() {
    let person = Person::Student {
        name: String::from("Alice"),
        grade: 10,
    };

    match person {
        Person::Student { name, .. } => {
            // 只提取 name，其他用 .. 忽略
            println!("{} 是学生", name);
        }
        Person::Teacher { subject, .. } => {
            println!("教科目：{}", subject);
        }
    }
}
```

### 提取字段的简写语法

在 match 模式中，`{key}` 是 `{key: key}` 的简写——字段名同时也是绑定的变量名。如果想用不同的变量名，才需要用完整形式 `{key: var_name}`：

```
#[derive(Debug)]
enum Config {
    Set { host: String, port: u32 },
}

fn main() {
    let cfg = Config::Set {
        host: String::from("localhost"),
        port: 8080,
    };

    match cfg {
        // 简写形式：{host, port} 相当于 {host: host, port: port}
        Config::Set { host, port } => {
            println!("连接到 {}:{}", host, port);
        }
    }

    // 如果要用不同的变量名，用完整形式
    match cfg {
        Config::Set { host: h, port: p } => {
            println!("连接到 {}:{}", h, p);
        }
    }
}
```

**小结：** 穷尽性检查要求覆盖所有情况，而灵活的模式（`_`、`..`、变量名）让你按需提取或忽略数据。

## 多个模式匹配同一分支

有时候，不同的模式需要执行同样的代码。可以用 `|` 将多个模式组合在一起：

```
enum HttpStatus {
    Ok,
    Created,
    BadRequest,
    NotFound,
    ServerError,
}

fn is_error(status: HttpStatus) -> bool {
    match status {
        HttpStatus::Ok | HttpStatus::Created => false,        // 成功状态
        HttpStatus::BadRequest | HttpStatus::NotFound | HttpStatus::ServerError => true,  // 错误状态
    }
}

fn main() {
    println!("{}", is_error(HttpStatus::Ok));           // false
    println!("{}", is_error(HttpStatus::BadRequest));   // true
}
```

使用 `|` 可以避免代码重复——不用为每个模式单独写一个分支。

# 匹配规则注意点

如果你熟悉 C 的 `switch` 语句，需要注意 Rust 的 `match` 有不同的行为：

## 1. 无需 `break`，自动跳出

**C 的 switch：**

```
switch (value) {
    case 1:
        printf("一");
        break;  // 必须写 break，否则会"fall through"
    case 2:
        printf("二");
        break;
}
```

**Rust 的 match：**

```
let value = 1;

match value {
    1 => println!("一"),  // 无需 break，匹配后自动跳出
    2 => println!("二"),
    _ => {}
}
```

Rust 在匹配一个分支后**自动跳出**，不会继续执行下一个分支，所以不需要 `break`。这也意味着 Rust **禁止 fall through 行为**——你无法写出像 C 那样忘记 `break` 就继续执行下一个分支的代码。如果需要多个分支执行相同的代码，使用 `|` 组合模式即可（见前面”多个模式匹配同一分支”部分）。

## 2. 多个分支不能匹配同样的值

**在 Rust 中编译错误：**

```
let value = 1;

match value {
    1 => println!("一"),
    1 => println!("再来一遍"),  // 错误！1 已经被前面的分支匹配
    _ => {}
}
```

编译器会拒绝**重复的模式**。如果你需要不同的代码执行，必须放在同一个分支中。即使用 `|` 组合模式，也不能让某个值在多个分支中被匹配到：

```
let value = 2;

match value {
    1 | 2 => println!("一或二"),
    2 | 3 => println!("二或三"),  // 错误！2 已经在前一个分支被匹配过
    _ => {}
}
```

> 预告：本章介绍的是 match 的基础用法。Rust 的模式匹配系统非常强大，还有更多进阶特性（如范围模式、守卫条件、引用解构等），将在[高级模式匹配](/RustCourse/chapters/22-advanced/04-advanced-patterns)中详细讲解。



## 选择题

```
enum Animal {
    Dog,
    Cat,
    Bird,
}

let animal = Animal::Cat;

match animal {
    Animal::Dog => println!("汪"),
    Animal::Cat => println!("喵"),
}
```

```
enum Status {
    Pending,
    Running,
    Done,
}

let status = Status::Running;

match status {
    Status::Pending => println!("等待中"),
    Status::Running => println!("运行中"),
    Status::Done => println!("完成"),
}
```

```
enum Message {
    Text(String),
    Number(i32),
}

let msg = Message::Number(42);

match msg {
    Message::Text(s) => println!("文本：{}", s),
    Message::Number(n) => println!("数字：{}", n),
}
```

```
enum Level {
    Low,
    Medium,
    High,
    Critical,
}

let level = Level::High;

match level {
    Level::Low | Level::Medium => println!("正常"),
    Level::High | Level::Critical => println!("警告"),
}
```

## 编程练习

### 练习 1：完善 match 分支

下面的代码缺少一个分支，请修复它：

```
enum Color {
    Red,
    Green,
    Blue,
}

fn describe_color(color: Color) -> String {
    match color {
        Color::Red => String::from("红色"),
        Color::Green => String::from("绿色"),
        // TODO: 添加 Blue 分支
    }
}

fn main() {
    println!("{}", describe_color(Color::Red));
    println!("{}", describe_color(Color::Blue));
}
```

### 练习 2：使用 match 解构枚举

定义一个 `Message` 枚举，包含三个成员：

- `Text(String)` — 文本消息
- `Number(i32)` — 数字消息
- `Empty` — 空消息

实现一个函数 `process_message()` 处理不同的消息：

```
enum Message {
    // TODO: 定义三个成员
}

fn process_message(msg: Message) -> String {
    // TODO: 使用 match 处理三种消息，返回相应描述：文本消息｜数字消息｜空消息
}

fn main() {
    let msg1 = Message::Text(String::from("Hello"));
    let msg2 = Message::Number(42);
    let msg3 = Message::Empty;

    println!("{}", process_message(msg1));
    println!("{}", process_message(msg2));
    println!("{}", process_message(msg3));
}
```

### 练习 3：处理不同形式的关联数据

定义一个 `Command` 枚举，包含两个成员（展示元组风格和结构体风格的混合）：

- `Execute(String)` — 执行命令（元组风格，关联一个字符串）
- `Config { key: String, value: String }` — 配置（结构体风格，关联两个字段）

实现一个函数 `handle_command()` 使用 match 处理这两种情况，返回对应的描述字符串：

- 对于 `Execute`：返回 `"执行命令：{命令名}"`
- 对于 `Config`：返回 `"配置 {key} = {value}"`

```
enum Command {
    // TODO: 定义两个成员
}

fn handle_command(cmd: Command) -> String {
    // TODO: 使用 match 处理命令并返回处理结果
}

fn main() {
    let cmd1 = Command::Execute(String::from("start"));
    let cmd2 = Command::Config {
        key: String::from("timeout"),
        value: String::from("30"),
    };

    println!("{}", handle_command(cmd1));
    println!("{}", handle_command(cmd2));
}
```
# if let：match 的简洁写法

有时候，你用 `match` 只想处理**一个特定的情况**，其他情况都无需特殊处理。这时 `if let` 提供了更简洁的语法。

## match vs if let

假设你只想在 `Option` 有值时做某事：

```
// 使用 match（相对冗长）
let config_max = Some(3u8);

match config_max {
    Some(max) => println!("最大值配置为 {}", max),
    _ => (),  // 什么都不做
}
```

用 `if let` 简化：

```
// 使用 if let（更简洁）
let config_max = Some(3u8);

if let Some(max) = config_max {
    println!("最大值配置为 {}", max);
}
```

**关键差异：**

- `match` 必须穷尽所有情况
- `if let` 只关心一个模式是否匹配，**其他情况隐含地忽略**（相当于自动加了 `_ => {}`）

> 重要：if let 确实”绕过”了穷尽性检查，但这是有意的设计。当你只关心某一种情况时，不需要为其他情况写冗长的 _ => {} 分支。比如上面的例子，你只想在配置有值时处理，不关心 None 的情况——这时 if let 就很合适。


## if let 的语法

```
if let 模式 = 表达式 {
    // 模式匹配时执行
}
```

注意：是 `=` 而不是 `match`。

## 实际例子

```
enum Status {
    Done,
    Working { progress: u32 },
}

fn main() {
    let status = Status::Working { progress: 50 };

    // 用 match
    match status {
        Status::Working { progress } => {
            println!("进度：{}%", progress);
        }
        _ => {}
    }

    // 用 if let（更清晰）
    if let Status::Working { progress } = status {
        println!("进度：{}%", progress);
    }
}
```

## if let … else

`if let` 可以配合 `else`，处理模式不匹配的情况：

```
let favorite_color: Option<&str> = Some("蓝色");
let is_tuesday = false;
let age: Result<u8, _> = "34".parse();

if let Some(color) = favorite_color {
    println!("使用你最喜欢的颜色：{}", color);
} else if is_tuesday {
    println!("星期二穿绿色！");
} else if let Ok(age) = age {
    if age > 30 {
        println!("使用紫色");
    } else {
        println!("使用橙色");
    }
} else {
    println!("使用蓝色作为后备方案");
}
```

**等价的 match 写法会更复杂**。

# while let：循环中的模式匹配

类似 `if let`，`while let` 在循环中只关心某个模式：

```
fn main() {
    let mut stack = vec![1, 2, 3];

    // 当 pop() 返回 Some 时继续循环
    while let Some(top) = stack.pop() {
        println!("栈顶：{}", top);
    }
}
```

等价的 `loop + match` 写法：

```
fn main() {
    let mut stack = vec![1, 2, 3];

    loop {
        match stack.pop() {
            Some(top) => println!("栈顶：{}", top),
            None => break,
        }
    }
}
```

`while let` 明显更简洁。

# 何时用 if let vs match

| 情况              | 用 if let        | 用 match         |
| --------------- | --------------- | --------------- |
| 只关心一个模式匹配       | ✓               | 不推荐（代码冗长）       |
| 需要穷尽所有情况        | ✗               | ✓               |
| 需要处理多个模式        | 嵌套 if let 会很丑   | ✓               |
| 需要在模式中使用守卫条件    | 可以，但有限制         | ✓               |

简单规则：**如果你的 **`match`** 只有两个分支，其中一个用 **`_`** 忽略，那就考虑用 **`if let`**。**


```
let x = Some(5);

if let Some(y) = x {
    println!("{}", y);
}
```

```
let config = Some(String::from("config.toml"));

if let Some(file) = config {
    println!("使用配置文件：{}", file);
} else {
    println!("使用默认配置");
}
```

```
while let Some(x) = some_iterator {
    // ...
}
```

## 编程练习

### 练习 1：用 if let 简化代码

使用 `if let` 和 `else` 处理以下场景：

```
enum Message {
    NewEmail { subject: String, sender: String },
    Text(String),
    Quit,
}

fn main() {
    let message = Message::NewEmail {
        subject: String::from("你好"),
        sender: String::from("Alice"),
    };

    // TODO: 用 if let 检查是否是 NewEmail
    // 如果是，打印 "收到新邮件，主题：{subject}，来自：{sender}"
    // 否则打印 "收到其他类型的消息"
}
```

### 练习 2：用 while let 遍历集合

使用 `while let` 循环处理向量中的元素：

```
fn main() {
    let mut numbers = vec![1, 2, 3, 4, 5];

    // TODO: 使用 while let 配合 pop() 从向量末尾取出元素
    // 逐个打印每个数字（注意顺序是从后往前）
}
```
# 为什么 Rust 没有 null

很多编程语言（Java、C、JavaScript）都有 `null` 值，表示”没有值”。这听起来合理，但 Tony Hoare（`null` 的发明者）后来称之为 **“十亿美元的错误”**，因为 `null` 导致的 bug 无穷无尽：

- 忘记检查 `null`，程序崩溃（“Null Pointer Exception”）
- 在不该是 `null` 的地方突然变成 `null`
- 很难区分”正常的空值”和”未初始化”

Rust 的解决方案是：**没有 **`null`**，用 **`Option<T>`** 枚举代替**。

这强制你在编译期就必须处理”可能没有值”的情况。

# Option<T> 的定义

`Option<T>` 是标准库中的一个枚举：

```
enum Option<T> {
    Some(T),
    None,
}
```

它很简单：

- `Some(T)` — 表示有值
- `None` — 表示没有值

`<T>` 是一个**泛型参数**（后续会详细讲），现在只需知道它表示”任何类型”。

## 使用 Option

`Option<T>` 在 **prelude** 中，无需导入前缀就能用 `Some` 和 `None`：

> 什么是 prelude？ Rust 标准库中有一个 prelude（前奏）模块，包含最常用的类型和函数。每个 Rust 程序都会自动导入 prelude 中的内容，所以你可以直接使用 Some、None、Option 等，而不需要写完整的路径如 std::option::Some。


```
fn main() {
    let some_number: Option<i32> = Some(5);
    let none_number: Option<i32> = None;

    println!("{:?}", some_number);
    println!("{:?}", none_number);
}
```

当有 `None` 时，必须指定类型，因为编译器无法推断。

## 为什么这比 null 安全

假如 Rust 有 `null`：

```
let x: i32 = null;     // x 可能是 null
println!("{}", x + 1); // 崩溃！
```

用 `Option<T>`：

```
let x: Option<i32> = None;
println!("{}", x + 1);  // 编译错误！Option<i32> 不能直接和 i32 相加
```

你**必须** 先处理 `Option` 的两种情况。

# 提取 Option 中的值

## 方法一：match 表达式（最常见）

用 `match` 分别处理 `Some` 和 `None`：

```
fn main() {
    let maybe_age: Option<u32> = Some(25);

    match maybe_age {
        Some(age) => println!("年龄是 {}", age),
        None => println!("年龄未知"),
    }
}
```

`Some(age)` 会绑定内部的值，可以在分支中使用。

## 方法二：if let 表达式（只关心 Some 的情况）

如果只想处理 `Some` 的情况，`if let` 更简洁：

```
fn main() {
    let favorite_color: Option<&str> = Some("蓝色");

    if let Some(color) = favorite_color {
        println!("你最喜欢的颜色是 {}", color);
    }
}
```

（`if let` 会在后续详细讲）

## 方法三：Option 的方法

`Option<T>` 提供了许多方便的方法（这里先了解，后续会深入）：

```
fn main() {
    let x = Some(5);

    // unwrap()：如果是 Some，返回内部值；如果是 None，panic
    let value = x.unwrap();
    println!("值是 {}", value);

    // unwrap_or()：如果是 Some，返回内部值；如果是 None，返回默认值
    let y: Option<i32> = None;
    let value = y.unwrap_or(0);
    println!("值是 {}", value);

    // is_some()、is_none()：检查是 Some 还是 None
    let z = Some(10);
    if z.is_some() {
        println!("z 有值");
    }
}
```

> 警告：unwrap() 如果碰到 None 会 panic。在不确定的情况下，用 match 或 if let 更安全。



```
fn get_age(name: &str) -> Option<u32> {
    match name {
        "Alice" => Some(30),
        "Bob" => Some(25),
        _ => None,
    }
}
```

```
let x: Option<i32> = Some(5);
let y = x.unwrap();
```

## 编程练习

### 练习 1：返回 Option 的函数

实现一个函数 `first_word_length()`，返回字符串中第一个单词的长度。如果字符串为空或只有空白，返回 None：

```
fn first_word_length(s: &str) -> Option<usize> {
    // TODO: 实现函数
    // 提示：trim() 可以去掉空白，split_whitespace() 可以按空白分割
}

fn main() {
    println!("{:?}", first_word_length("hello world"));      // Some(5)
    println!("{:?}", first_word_length("  "));               // None
    println!("{:?}", first_word_length(""));                 // None
    println!("{:?}", first_word_length("single"));           // Some(6)
}
```

### 练习 2：安全地处理 Option

实现一个函数 `divide()`，返回除法结果的 Option。只有当除数不为 0 时才返回 Some，否则返回 None：

```
fn divide(dividend: f64, divisor: f64) -> Option<f64> {
    // TODO: 实现函数
}

fn main() {
    match divide(10.0, 2.0) {
        Some(result) => println!("10 ÷ 2 = {}", result),
        None => println!("无法除以 0"),
    }

    match divide(10.0, 0.0) {
        Some(result) => println!("10 ÷ 0 = {}", result),
        None => println!("无法除以 0"),
    }
}
```
# const：常量

**常量** 是那些在程序运行期间**不能改变**的值。与变量不同，常量必须始终是不可变的，且不能用 `mut` 修饰。

## 基本用法

```
const PI: f64 = 3.14159;
const MAX_POINTS: u32 = 100_000;
const MAX_SIZE: usize = 1024 * 1024;  // 可以是常量表达式

fn main() {
    println!("π ≈ {}", PI);
    println!("最大分数：{}", MAX_POINTS);
    println!("最大尺寸：{} 字节", MAX_SIZE);
}
```

## const 的特点

- **必须指定类型**（不能依赖类型推断）
- **在编译期计算**，值被硬编码到二进制文件中
- **可以在任何作用域定义**，包括全局作用域
- **按惯例用全大写**（SCREAMING_SNAKE_CASE）
- **可以进行简单的常量表达式计算**

```
const SECONDS_PER_DAY: u32 = 24 * 60 * 60;
const THRESHOLD: i32 = 10;

fn main() {
    println!("每天秒数：{}", SECONDS_PER_DAY);
}
```

## 常数表达式

`const` 可以使用常数表达式（编译期可计算的表达式，不会消耗运行性能）：

```
const HOURS_PER_DAY: u32 = 24;
const MINUTES_PER_HOUR: u32 = 60;
const SECONDS_PER_MINUTE: u32 = 60;

const SECONDS_PER_DAY: u32 =
    HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;

fn main() {
    println!("每天秒数：{}", SECONDS_PER_DAY);
}
```

## const 的限制

不能用复杂的运行时操作定义 const，比如函数调用（除了一些特殊的 const 函数）：

```
const VALUE: String = String::from("hello");  // 编译错误！
```

这是因为 `String::from()` 需要在运行时执行。

# static：静态变量

**静态变量**是一种**全局变量**，在程序整个生命周期中只存在一个实例，存储在**固定的内存地址**上。与 const 不同，static 在内存中有真实的地址，可以被取引用。

> 重要：static 和 const 一样，都必须明确指定类型，不能依赖类型推断。


```
static VERSION: &str = "1.0.0";

fn main() {
    // static 有固定地址
    println!("版本：{}", VERSION);
    println!("版本地址：{:p}", &VERSION);  // 可以取地址
}
```

## static 的限制

static 的初始值也必须在**编译期可知**，这一点和 const 相同。不能使用运行时函数来初始化 static：

```
static NAME: String = String::from("App");  // 编译错误！
```

因为 `String::from()` 需要在运行时执行。如果需要字符串，应该用 `&str` 字面量：

```
static NAME: &str = "App";  // 正确

fn main() {
    println!("{}", NAME);
}
```

Rust 也支持在函数内声明 static，这与 C 语言相似。函数内的 static 变量生命周期贯穿整个程序，但**作用域被限制在函数内部**，是一种很好的封装手段。

```
fn get_db_timeout() -> u32 {
    // 函数内的 static — 只初始化一次
    static DEFAULT_TIMEOUT: u32 = 30;
    DEFAULT_TIMEOUT
}

fn main() {
    println!("超时：{} 秒", get_db_timeout());
    println!("超时：{} 秒", get_db_timeout());  // 不会重新初始化
}
```

**关键特性：**

- 每次调用函数时，static 不会重新初始化（只在首次调用时初始化）
- 外部无法直接访问这个 static（作用域限制）
- 这样既能保持全局状态，又能避免污染全局命名空间

## 可变 static

如果你需要一个可变的全局状态，可以用 `static mut`，但**访问或修改都需要 **`unsafe`** 块**。

### 为什么需要 unsafe

静态变量存在于全局数据区。如果在多个线程中同时访问可变 static，会引发**数据竞争**（Data Race）。Rust 通过 `unsafe` 块要求你显式承认这个风险。

### 例子

```
static mut COUNTER: i32 = 0;

fn increment() {
    unsafe {
        COUNTER += 1;
        println!("计数器：{}", COUNTER);
    }
}

fn main() {
    increment();
    increment();
}
```

> 建议： 一般不推荐使用可变 static，因为容易引起并发问题。如果你需要全局可变状态，考虑其他方案（如 Mutex、线程本地存储等，后续会讲）。


# const vs static：全局变量的选择

## 全局变量只能是 const 或 static

在全局作用域（函数外），你**不能用 **`let`，只能用 `const` 或 `static`。（函数内的话都可以使用）

```
// 错误！不能在全局作用域用 let
let name = "Alice";

fn main() {}
```

**为什么？** 全局变量的生命周期贯穿整个程序，编译器要求它要么是编译期已知的常数（const），要么是有特殊运行时特性的（static）。普通的 let 变量无法满足这一要求。

## const vs static 的本质区别

虽然 const 和 static 都可以在全局作用域使用，但它们的**原理和用途完全不同**。

### 三种变量的对比

```
// 1. 局部 let 变量
fn example_local() {
    let name = "Alice";  // 每次调用都重新创建
}

// 2. 全局 const
const API_HOST: &str = "api.example.com";  // 编译期被内联到每个使用处

// 3. 全局 static
static DATABASE_URL: &str = "postgres://...";  // 在内存的固定地址，程序启动创建

fn main() {
    // const：编译后的二进制里有多个 "api.example.com" 副本
    println!("{}", API_HOST);

    // static：二进制里只有一个 DATABASE_URL，所有代码指向同一地址
    println!("{}", DATABASE_URL);
}
```

### const vs static 的核心区别

| 特性              | const           | static          |
| --------------- | --------------- | --------------- |
| 存储位置            | 编译期内联到代码中       | 程序内存中的固定地址      |
| 运行时地址           | 无地址（被替换为值）      | 有固定地址（          | &STATIC         | 可取地址）           |
| 性能              | 零开销（直接是值）       | 通过地址访问（多一步寻址）   |
| 生命周期            | 编译期存在           | 程序从启动到结束        |
| 作用域             | 可以是局部（如函数内）     | 必须是全局           |
| 可变性             | 总是不可变           | 可以是             | static mut      | （需 unsafe）      |

**类比理解：**

- `const` 像”直接数字替换”：`PI` 在使用处被替换为 `3.14159`
- `static` 像”全局变量”：在内存中有一个固定盒子，所有地方都访问同一个地址

### 为什么 static 需要固定地址

```
const PI: f64 = 3.14;
static VERSION: &str = "1.0";

fn main() {
    // const 没有地址，无法取引用
    // println!("{:p}", &PI);  // 编译错误！

    // static 有地址，可以取引用
    println!("版本地址：{:p}", &VERSION);
}
```

const 因为被编译期内联了，根本不存在于运行时，所以没有地址。而 static 在内存中有真实的地址，因此可以被取引用。


```
const PI: f64 = 3.14;
const RADIUS: i32 = 5;

fn main() {
    let area = PI * (RADIUS * RADIUS) as f64;
}
```

```
static COUNT: i32 = 0;
static NAME: String = String::from("App");
```

## 编程练习

### 练习 1：定义应用配置常数

为一个应用定义所有的配置常数：

```
// TODO: 定义以下常数
// - API_HOST: &str = "https://api.example.com"
// - API_TIMEOUT: u64 = 30（秒）
// - MAX_RETRIES: u32 = 3
// - CACHE_ENABLED: bool = true
// - DEBUG: bool = false

fn main() {
    println!("应用配置：");
    println!("  API 主机：{}", API_HOST);
    println!("  超时时间：{} 秒", API_TIMEOUT);
    println!("  最大重试：{}", MAX_RETRIES);
    println!("  缓存：{}", if CACHE_ENABLED { "启用" } else { "禁用" });
    println!("  调试：{}", if DEBUG { "开启" } else { "关闭" });
}
```

### 练习 2：使用常数表达式

定义与时间相关的常数，并计算衍生常数：

```
const SECONDS_PER_MINUTE: u32 = 60;
const MINUTES_PER_HOUR: u32 = 60;
const HOURS_PER_DAY: u32 = 24;

// TODO: 定义衍生常数
// - SECONDS_PER_HOUR
// - SECONDS_PER_DAY
// - MINUTES_PER_DAY

fn main() {
    println!("时间单位换算：");
    println!("  每分钟秒数：{}", SECONDS_PER_MINUTE);
    println!("  每小时秒数：{}", SECONDS_PER_HOUR);
    println!("  每天秒数：{}", SECONDS_PER_DAY);
    println!("  每天分钟数：{}", MINUTES_PER_DAY);
}
```
# 代码判断题

## 题目 1：结构体与所有权

```
struct Person {
    name: String,
    age: u32,
}

fn main() {
    let p1 = Person {
        name: String::from("Alice"),
        age: 30,
    };
    
    let p2 = Person {
        name: p1.name,
        age: p1.age,
    };
    
    println!("{}", p1.name);
}
```

## 题目 2：枚举与模式匹配

```
enum Result {
    Ok(i32),
    Err(String),
}

fn main() {
    let result = Result::Ok(42);
    
    match result {
        Result::Ok(x) if x > 0 => println!("正数：{}", x),
        Result::Ok(x) => println!("非正数：{}", x),
        Result::Err(_) => println!("错误"),
    }
}
```

## 题目 3：Option 与 if let

```
fn main() {
    let x: Option<i32> = None;
    let y = if let Some(val) = x { val + 1 } else { 0 };
    println!("{}", y);
}
```

# 编程练习

## 练习 1：书籍管理

定义一个 `Book` 结构体，并实现相关方法。

**任务：**

- 定义 `Book` 结构体，包含 `title`（String）、`author`（String）、`pages`（u32）
- 实现 `new()` 方法创建新书
- 实现 `summary()` 方法返回书籍摘要

**格式要求：**

- `summary()` 返回格式：`"{title}" by {author}（{pages} 页）`
- 例如：`"Rust 圣经" by 张汉东（652 页）`

```
struct Book {
    // TODO: 添加三个字段
}

impl Book {
    fn new(title: String, author: String, pages: u32) -> Book {
        // TODO: 创建并返回 Book 实例
    }
    
    fn summary(&self) -> String {
        // TODO: 返回书籍摘要，按格式要求组织
    }
}

fn main() {
    let book = Book::new(String::from("Rust 圣经"), String::from("张汉东"), 652);
    println!("{}", book.summary());
}
```

## 练习 2：灯泡颜色

定义一个 `LightColor` 枚举，用 `match` 返回颜色的描述。

**任务：**

- 定义 `LightColor` 枚举，包含三个成员：`Red`、`Green`、`Blue`
- 实现 `describe()` 函数，接收 `LightColor`，用 `match` 返回对应的中文描述

**格式要求：**

- 红灯返回：`"红灯：停止"`
- 绿灯返回：`"绿灯：通行"`
- 蓝灯返回：`"蓝灯：准备"`

```
enum LightColor {
    // TODO: 定义三个成员：Red、Green、Blue
}

fn describe(color: LightColor) -> String {
    // TODO: 使用 match 处理三种情况，返回对应字符串
}

fn main() {
    println!("{}", describe(LightColor::Red));
    println!("{}", describe(LightColor::Green));
    println!("{}", describe(LightColor::Blue));
}
```

## 练习 3：数组中查找

使用 `Option` 在数组中查找元素。

**任务：**

- 实现 `find_number()` 函数，在数组中查找指定数字
- 如果找到，返回 `Some(位置)`；如果没找到，返回 `None`
- 在 `main` 中使用 `if let` 处理结果，并打印查找信息

**格式要求：**

- 找到时：`"{number} 在位置 {index}"`（例如：`30 在位置 2`）
- 未找到时：`"{number} 未找到"`（例如：`99 未找到`）

**提示：**

- 可以用 `for` 循环配合 `enumerate()` 遍历数组
- 或使用 `numbers.iter().position(|&x| x == target)`

```
fn find_number(numbers: &[i32], target: i32) -> Option<usize> {
    // TODO: 遍历数组，找到 target 返回 Some(位置)，否则返回 None
}

fn main() {
    let nums = [10, 20, 30, 40, 50];
    
    // TODO: 查找 30，使用 if let 处理返回值，按格式打印
    
    // TODO: 查找 99，使用 if let 处理返回值，按格式打印
}
```

---
**完成这三个练习，你掌握了自定义类型的基础！**