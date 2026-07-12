---
title: "模块与工程化"
description: "包与 crate、模块系统、路径与 use、workspace、构建脚本、文档注释"
date: "2026-07-12"
order: 6
tags: ["模块", "Crate", "Workspace", "文档"]
est_time: "60 分钟"
---

当代码量增长，你需要一套机制来组织它——把相关的函数、类型和常量分组，控制哪些内容对外可见，避免命名冲突。这就是 Rust 的模块系统。

理解模块系统，关键是搞清楚三个层级的关系：**Package**（一次 `cargo new`）、**Crate**（编译单元）和**模块**（代码组织单元），以及如何在它们之间导航和控制访问权限。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 编译单元的基本概念，binary crate 与 library crate 的区别 |                 |
| 用               | mod             | 组织代码，用          | pub             | 控制对外可见性         |
| 在模块树中用路径引用项，    | use             | 关键字简化写法         |
# Package 和 Crate

## 为什么需要 Package 和 Crate

随着项目变大，代码会逐渐增多。Rust 提供了一套**模块系统**来帮助你组织代码，让功能清晰、可复用、易于维护。这个模块系统的基础就是 **Package**（包）和 **Crate**（箱）这两个概念。

虽然它们经常一起出现，但它们是不同的东西：

- **Crate** 是代码的**编译单元**，是 Rust 编译器处理的最小单位
- **Package** 是代码的**组织单位**，用 Cargo 来管理

## 理解 Crate

### 什么是 Crate

**Crate** 是 Rust 中最小的可编译单位。一个 crate 包含：

- 一个 **crate root**（根源文件）
- 由此生成的**单个二进制程序**或**单个库**

你可以认为 crate 是一个”编译产物”——编译器会根据 crate root 生成一个可执行文件或库文件。

### Crate 的两种类型

![crate](/images/rust/crate.svg)
#### **二进制 Crate（Binary Crate）**

二进制 crate 编译后生成一个**可执行程序** (`.bin` / `.elf`)。必须有一个 `main()` 函数作为程序入口。

```
fn main() {
    println!("这是一个二进制 crate 的例子");
}
```

#### **库 Crate（Library Crate）**

库 crate 编译后生成一个**库文件**（`.rlib`），没有 `main()` 函数。目的是被其他项目调用和重用。

```
// 库 crate 的例子：没有 main()，只有可供外部调用的函数
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

## 理解 Package

### 什么是 Package

**Package**（包）是一个使用 Cargo 管理的项目目录。一个 package：

- 包含一个 **Cargo.toml** 文件（项目配置）
- 至多包含**一个库 crate**（library crate）
- 可以包含**零或者任意多个二进制 crate**（binary crate）
- **至少包含一个 crate**（二进制或库）

![包](/images/rust/package.svg)
你可以认为 package 是”项目文件夹”的概念——它包装了一个或多个 crate，让你用 Cargo 来管理它们。

### Cargo.toml：Package 的清单

**Cargo.toml** 是 Cargo 用来管理 package 的配置文件。它定义了：

```
[package]
name = "my-app"              # package 的名称
version = "0.1.0"            # package 版本
edition = "2021"             # Rust 版本

[dependencies]
serde = "1.0"                # 依赖的外部 crate
```

**关键特点：**

- 每个 package 只有**一个** Cargo.toml
- Cargo 会根据 Cargo.toml 中的配置来构建和管理这个 package 中的所有 crate
- **Cargo.toml 中不需要列出 crate**，Cargo 会按约定自动识别 `src/main.rs`、`src/lib.rs` 等
- 你可以在这里声明依赖、配置构建选项、设置 package 元数据

# Package 和 Crate 的关系

现在你已经知道了 Package 和 Crate 的定义，那它们是如何工作的呢？让我们看看一些实际的例子。

![二者的对应视角](/images/rust/angle_of_view.svg)
> 核心认知：

> - Package 是从逻辑管理的视角——“我要如何组织这个项目？用 Cargo.toml 来管理依赖、版本、配置”
> - Crate 是从编译的视角——“Rust 编译器该如何处理这些文件？一个 crate root 生成一个编译产物”

> 一个 package 可以包含多个 crate，但一个 crate 只能编译生成一个二进制或一个库。


## Cargo 的约定：文件到 Crate 的映射

当你用 Cargo 创建项目时，Cargo 遵循一套**约定**来自动识别 crate：

| 源文件             | Cargo 认为这是      | 生成物             |
| --------------- | --------------- | --------------- |
| src/main.rs     | 与 package 同名的   | 二进制 crate       | 的根              | 可执行程序           |
| src/lib.rs      | 与 package 同名的   | 库 crate         | 的根              | 库文件             |
| src/bin/*.rs    | 中的每个文件          | 独立的             | 二进制 crate       | 各自的可执行程序        |

**这意味着你不需要在 Cargo.toml 中显式列出这些 crate，Cargo 会自动找到它们。**

### 实例 1：最简单的 Package（只有二进制）

```
cargo new my-app
```

生成的结构：

```
my-app/
├── Cargo.toml
└── src/
    └── main.rs
```

这个 package 包含 **1 个 crate**：

- **二进制 crate**（名为 `my-app`），从 `src/main.rs` 开始

### 实例 2：只有库 crate

如果你想创建一个库供其他项目使用：

```
cargo new --lib my-library
```

生成的结构：

```
my-library/
├── Cargo.toml
└── src/
    └── lib.rs
```

这个 package 包含 **1 个 crate**：

- **库 crate**（名为 `my-library`），从 `src/lib.rs` 开始

**使用方式：**

```
# 编译库（生成 .rlib 文件）
$ cargo build

# 测试库
$ cargo test

# 发布到 crates.io
$ cargo publish
```

### 实例 3：同时有库和二进制

有时你想提供一个库，同时也有一个可执行程序来演示库的用法。基于只有库的 crate 的包手动添加 `src/main.rs`，或者基于只有二进制 crate 的包手动添加 `src/lib.rs`：

```
my-library/
├── Cargo.toml
└── src/
    ├── lib.rs      ← 库 crate 的根
    └── main.rs     ← 二进制 crate 的根
```

这个 package 包含 **2 个 crate**（都同名 `my-library`）：

- **库 crate**：从 `src/lib.rs` 开始
- **二进制 crate**：从 `src/main.rs` 开始

**使用方式：**

```
# 编译整个 package（包含两个 crate）
$ cargo build

# 运行二进制程序（演示库）
$ cargo run

# 只构建库
$ cargo build --lib

# 只构建二进制
$ cargo build --bin my-library
```

**库内部的代码可以被二进制调用：**

```
// src/lib.rs
pub fn greet() {
    println!("来自库的问候");
}
```

```
// src/main.rs
fn main() {
    my_library::greet();  // 调用库中的公开函数
}
```

### 实例4：多二进制 Crate 的项目

![安全与速度的矛盾](/images/rust/package_and_crate.svg)
一个 package 可以包含**多个二进制 crate**。把它们放在 `src/bin/` 目录中，每个文件都会被编译成独立的二进制程序。

> 注意：src/bin/ 目录下的二进制 crate 需要手动创建，Cargo 没有提供自动生成命令。只需创建 .rs 文件即可，Cargo 会自动识别。


首先创建基础项目：

```
cargo new my-project
```

然后手动创建额外的二进制：

```
mkdir -p src/bin
touch src/bin/tool-a.rs
touch src/bin/tool-b.rs
```

最终结构：

```
my-project/
├── Cargo.toml
├── src/
│   ├── main.rs                # 二进制 crate（命名为 "my-project"）
│   ├── lib.rs                 # 库 crate（命名为 "my-project"）
│   └── bin/
│       ├── tool-a.rs          # 二进制 crate（命名为 "tool-a"）
│       └── tool-b.rs          # 二进制 crate（命名为 "tool-b"）
```

这个 package 包含**4 个 crate**：

- 1 个库 crate：`my-project`
- 3 个二进制 crate：`my-project`、`tool-a`、`tool-b`

**编译和运行：**

```
# 编译所有 crate
$ cargo build

# 运行主二进制
$ cargo run

# 运行特定的二进制
$ cargo run --bin tool-a
$ cargo run --bin tool-b

# 列出所有可执行文件
$ cargo build --bins
```

## 自定义 Crate 路径和名称

如果你不想使用 Cargo 的默认约定，可以在 Cargo.toml 中显式指定：

```
[[bin]]
name = "my-tool"            # 二进制可执行文件的名称
path = "src/custom/main.rs" # 指定二进制 crate 的 root 路径

[lib]
name = "my-library"         # 库的名称
path = "src/custom/lib.rs"  # 指定库 crate 的 root 路径
```

这样你就可以打破默认约定，使用自己想要的目录结构和名称。但**大多数情况下，按照 Cargo 的默认约定最好**，这样其他人更容易理解你的项目结构。

# 练习题

## Package 和 Crate 概念测验
# 模块介绍

## 为什么需要模块

随着代码增长，代码会变得杂乱无序。模块提供了一种**组织和隐藏**代码的方式：

- **组织**：把相关功能分组到一起，提高可读性
- **隐藏**：控制哪些代码对外部可见，隐藏内部实现细节（封装）
- **作用域隔离**：防止名称冲突，同一个名字可以在不同模块中存在

想象一个餐厅：**前台**（公开，客人可见）和**后台**（私有，只有员工可见）。模块就是这样的概念。

## 定义模块：mod 关键字

使用 `mod` 关键字定义一个模块：

```
mod front_of_house {
    fn greet_customer() {
        println!("欢迎来到我们的餐厅！");
    }
}

fn main() {
    // 错误！front_of_house 中的函数是私有的，无法直接调用
    // front_of_house::greet_customer();
    println!("程序运行");
}
```

模块可以**嵌套**，形成模块树。每个模块里可以包含子模块：

```
mod restaurant {
    mod front_of_house {
        mod hosting {
            fn add_to_waitlist() {
                println!("已将您添加到等待列表");
            }
        }
    }
}
```

# 可见性：pub 关键字

默认情况下，模块中的所有项都是**私有的**（private）。私有项只能在本模块和子模块中访问。

要让项对外部可见，需要用 `pub` 修饰：

```
mod restaurant {
    // 私有模块（只能在 restaurant 内部使用）
    mod back_of_house {
        fn prepare_order() {
            println!("准备订单...");
        }
    }

    // 公有模块（可以从外部访问）
    pub mod front_of_house {
        pub fn add_to_waitlist() {
            println!("已添加到等待列表");
        }
    }

    pub fn eat_at_restaurant() {
        front_of_house::add_to_waitlist();
    }
}

fn main() {
    // 正确！front_of_house 是 pub，add_to_waitlist 也是 pub
    restaurant::front_of_house::add_to_waitlist();

    // 错误！back_of_house 是私有的
    // restaurant::back_of_house::prepare_order();
}
```

## pub 应用规则

- **模块**：必须标记 `pub` 才能从外部访问
- **函数**：必须标记 `pub` 才能从外部调用
- **结构体字段**：默认私有，每个字段需要单独标记 `pub`
- **枚举变体**：如果枚举是 `pub`，所有变体自动是 `pub`

> 重要：pub 关键字控制的是可见性（visibility）——“能否看到和访问”。这是独立于以下两个机制的：

> - 所有权（ownership）— “谁拥有这个值”（由之前的所有权系统控制）
> - 可变性（mutability）— “能否修改这个值”（由 mut 关键字控制）

> 一个字段可以既是 pub（对外可见）又是不可变的（没有 mut）；反之，一个私有字段可以被内部代码通过 mut 修改。


## 结构体和枚举的可见性

**结构体的字段需要单独声明为 pub：**

```
mod restaurant {
    pub struct Breakfast {
        pub toast: String,      // 公有
        seasonal_fruit: String, // 私有
    }

    impl Breakfast {
        pub fn new(toast: &str) -> Breakfast {
            Breakfast {
                toast: toast.to_string(),
                seasonal_fruit: "苹果".to_string(),
            }
        }
    }
}

fn main() {
    let mut meal = restaurant::Breakfast::new("黑麦面包");

    // 正确！toast 是 pub
    println!("今天的面包是 {}", meal.toast);

    // 错误！seasonal_fruit 是私有的
    // println!("水果是 {}", meal.seasonal_fruit);
}
```

> 结构体中 impl 里的函数也算是结构体的一部分，因此需要单独的 pub（不需要给 impl 加 pub，impl 的公开性同 struct）


**枚举的所有变体自动是 pub（如果枚举本身是 pub）：**

```
mod pizza {
    pub enum PizzaSize {
        Small,
        Medium,
        Large,
    }
}

fn main() {
    // 所有变体都可以访问
    let _size = pizza::PizzaSize::Large;
}
```

# 可见性与模块层级

## 理论 1：路径可达性原则

Rust 可见性的本质是**路径可达性**。当你要访问 `a::b::c::item` 时，不仅 `item` 要公开，整条路径上的每一步 `a`、`b`、`c` 都必须是可穿过的（即都要标 `pub`），否则整条路径就断裂了。

想象一个办公楼：

- 楼 A（私有）→ 即使楼内的办公室是开放的，外人也进不去
- 楼 A（公开）→ 但对应楼层是私有的 → 外人也进不了那层
- 楼 A（公开）→ 楼层（公开）→ 办公室（私有）→ 外人还是进不了办公室

**结论**：父模块是私有的，就像给整栋楼上了锁，子模块内的任何 `pub` 项都无法从外部访问。

```
mod parent {
    mod child {
        pub fn public_function() {
            println!("我是 pub 的");
        }
    }
}

fn main() {
    // ❌ 即使函数是 pub，但 parent 是私有的，外部无法穿过
    parent::child::public_function();
}
```

修复：让父模块也标为 `pub`

```
pub mod parent {
    pub mod child {
        pub fn public_function() {
            println!("现在可以访问了");
        }
    }
}

fn main() {
    parent::child::public_function();  // ✅
}
```

## 理论 2：访问方向的非对称性

模块树内的访问有一个重要的**不对称性**：同一棵树里，向上可以，向下不行。为什么？

**向上访问**（子访问父）：

- 子模块内可以用 `super` 关键字访问父模块的**任何内容**，包括私有项
- **类比**：楼 A（私有）→ 楼层（私有）→ 办公室（私有），虽然楼 A 和楼层都是私有的，但现在这件办公室的员工必须有访问楼 A 和楼层的权限，不然楼都进不去

**向下访问**（父访问子）：

- 父模块**无法访问**子模块的私有项，只能访问子模块标记为 `pub` 的东西
- **类比**：楼 A（公开）→ 楼层（公开）→ 办公室（私有），虽然在公司内，但不能随意进入每个员工的私人办公室。如果员工想让别人进来，必须把门打开（标记为 `pub`）

这看起来不对称，但有深层逻辑：**私有性是一种承诺** —— 子模块说”这是我的内部实现，整个树内也不能依赖”。这样才能真正隐藏实现细节，让子模块可以自由改变内部结构而不影响外部（包括父模块）。

```
mod parent {
    fn parent_private() {
        println!("父的私有函数");
    }

    pub mod child {
        fn child_private() {
            println!("子的私有函数");
        }

        pub fn access_upward() {
            // ✅ 子可以向上访问父的私有项
            super::parent_private();
        }
    }

    pub fn access_downward() {
        // ❌ 父无法访问子的私有项
        child::child_private();
    }
}

fn main() {
    parent::child::access_upward();
}
```

## 实战总结

![mod](/images/rust/mod.svg)
我们来看看这个图，思考几个场景（假设都是非 pub 的）：

- 「自己」访问「父模块」的私有项：「兄弟模块」、「函数 A」、「结构体 A」 —— 都可以访问（向上访问，树内特权。原因是这四者同属一个父模块，父模块的内容都可以访问）
- 「自己」访问「子模块 a」或者「子模块 b」—— 不能访问（父访问子）
- 「自己」访问「兄弟模块」的「结构体 b」 —— 不能访问（向下访问，私有边界保护）
- 「子模块 a」 访问「自己」（子模块 a 的父级）的「私有项」：「子模块 b」 或者「函数 a」 —— 能访问（向上访问，树内特权）
- 「子模块 a」 访问「子模块 b」（子模块 a 的兄弟） 的「私有项」 —— 不能访问（私有边界保护）
- 「子模块 a」 访问「父模块」（子模块 a 的爷级）的私有项：「函数 A」、「结构体 A」 —— 可以访问（向上访问，传递的树内特权）

| 场景              | 是否可以            | 原因              |
| --------------- | --------------- | --------------- |
| 外部代码访问私有模块内的 pub 项 | ❌               | 路径断裂            |
| 外部代码访问完整 pub 路径末端的项 | ✅               | 路径可达            |
| 子模块访问父模块的私有项    | ✅               | 同树内部            |
| 父模块访问子模块的私有项    | ❌               | 要尊重私有边界         |
| 兄弟模块互相访问 pub 项  | ✅               | 通过              | super           | 从父导航            |

# 文件模块化

## 模块树

每个 crate 都有一个**模块树**，以 crate root（`src/main.rs` 或 `src/lib.rs`）为根：

```
crate                          ← 隐式的根模块
 └── restaurant                ← 模块
     └── front_of_house        ← 嵌套模块
         ├── hosting           ← 模块
         │   ├── add_to_waitlist
         │   └── seat_at_table
         └── serving           ← 模块
             ├── take_order
             ├── serve_order
             └── take_payment
```

树中的每一项（函数、结构体、常量等）都有一个**路径**：

- `crate::restaurant::front_of_house::hosting::add_to_waitlist`
- `crate::restaurant::front_of_house::serving::take_order`

当模块变得很大时，可以将它们放在单独的文件中。

**项目结构有两种等价的方式：**

方式 1：单文件 + 目录

```
src/
├── main.rs
├── restaurant.rs          ← 模块文件
└── restaurant/
    └── hosting.rs         ← 嵌套模块文件
```

方式 2：纯目录形式（旧写法，不推荐了）

```
src/
├── main.rs
└── restaurant/
    ├── mod.rs             ← 模块定义（代替 restaurant.rs）
    └── hosting.rs         ← 嵌套模块文件
```

**src/main.rs：**

```
mod restaurant;

fn main() {
    restaurant::eat_at_restaurant();
}
```

**src/restaurant.rs：**

```
pub mod hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

**src/restaurant/hosting.rs：**

> 目录名必须与模块名相同：如果模块叫 restaurant，目录必须叫 restaurant/，不能用其他名字


```
pub fn add_to_waitlist() {
    println!("已添加到等待列表");
}
```

## 文件模块化的规则

- 声明模块使用 `mod 模块名;`（注意**分号**）
- Rust 会在 `模块名.rs` 文件或 `模块名/` 目录中查找模块定义
- **模块树中每个模块只能被声明一次**：模块的声明权属于它的父模块。例如，如果 `main.rs` 中声明了 `mod c;`，其他文件就不能再声明 `mod c;`
- 嵌套模块的文件放在对应名称的**目录**中
- 目录内的 `mod.rs` 文件定义该目录对应模块的内容


## 模块定义测验

```
mod restaurant {
    mod kitchen {
        fn cook() {}
    }

    pub fn eat() {
        kitchen::cook();
    }
}
```

## 编程练习

### 补充 pub 关键字

补充下面代码中缺少的 `pub` 关键字，使得所有调用都能编译通过。

```
mod library {
    struct Book {
        title: String,
        isbn: String,  // 私有
    }

    impl Book {
        fn new(title: &str, isbn: &str) -> Self {
            Book {
                title: title.to_string(),
                isbn: isbn.to_string(),
            }
        }
    }

    fn add_book(title: &str) {
        println!("书籍已添加：{}", title);
    }

    mod storage {
        fn store(title: &str) {
            println!("已存储书籍：{}", title);
        }
    }

    fn list_books() {
        println!("列出所有书籍");
    }
}

fn main() {
    let book = library::Book::new("Rust 圣经", "123-456");
    println!("书名：{}", book.title);

    // 调用公开函数
    library::add_book("深入浅出 Rust");
    library::list_books();

    // 这些无法访问（预期）
    // println!("ISBN: {}", book.isbn);
    // library::storage::store("某本书");
}
```
# 为什么需要路径和 use

前面我们讲过，模块在模块树中**只能被声明一次**（声明权属于父模块），但**可以从多处访问**。当你需要在 `a.rs` 和 `b.rs` 中都使用模块 `c` 时，不能重复声明，而要通过**路径**来访问它。

![use](/images/rust/use.svg)
**核心区别**：

- `mod` — **构建**模块树的结构（`mod c;` 声明模块 c）
- `路径/use` — **使用**构建好的模块树（`use super::c;` 访问模块 c）

# 访问模块中的项：路径

模块中定义的项需要通过**路径**来访问。路径就像文件系统中的路径：`/home/user/file.txt`。

Rust 中有两种路径：

- **绝对路径**：从 crate root 开始
- **相对路径**：从当前模块开始

## 绝对路径

绝对路径以 `crate` 关键字或 crate 名开头，表示从 crate 根部开始。

```
mod restaurant {
    pub mod front_of_house {
        pub mod hosting {
            pub fn add_to_waitlist() {
                println!("已添加到等待列表");
            }
        }
    }
}

fn main() {
    // 绝对路径：从 crate 根开始
    crate::restaurant::front_of_house::hosting::add_to_waitlist();
}
```

### 为什么用 crate:: 而不是包名？

对于库 crate（lib.rs），使用 `crate::` 代表 crate 根。这样的好处是：

- 如果库被重命名，代码不需要改变
- 跨越 crate 边界时更清晰

```
// 库中的绝对路径写法
pub fn some_function() {
    crate::restaurant::eat();  // 总是指向本 crate
}
```

## 相对路径

相对路径以当前模块的标识符、`self`、`super` 开头。

`self` 表示当前模块，`super` 表示父模块（类似文件系统的 `..`）。**通常情况下 **`self::`** 可以省略**，只有在 `use` 语句中需要显式写出。

```
fn serve_order() {
    println!("提供订单");
}

mod back_of_house {
    fn cook_order() {
        println!("准备订单");
    }

    pub fn fix_incorrect_order() {
        // ✓ 使用 self 访问同一模块的 cook_order
        self::cook_order();

        // ✓ 使用 super 访问父模块的 serve_order
        super::serve_order();
    }
}

fn main() {
    back_of_house::fix_incorrect_order();
}
```

## 绝对路径 vs 相对路径

| 场景              | 推荐              | 原因              |
| --------------- | --------------- | --------------- |
| 定义项和使用项位置距离远    | 绝对路径            | 移动时只需改变一个位置     |
| 项在嵌套较深的模块中      | 相对路径 + super    | 避免写太长的路径        |
| 同时移动定义和使用       | 相对路径            | 整体迁移更方便         |

# use 关键字

`use` 的作用是**将项引入当前作用域**，使你可以用更短的路径来访问它，而不用每次都写完整的模块路径。这是对路径的补充和简化。

## 简化路径

每次都写完整路径会很冗长。`use` 关键字可以将项引入作用域，之后就可以使用短路径。

```
mod restaurant {
    pub mod hosting {
        pub fn add_to_waitlist() {
            println!("已添加");
        }
    }
}

fn main() {
    // ❌ 不用 use 时，每次都要写完整路径
    restaurant::hosting::add_to_waitlist();
    restaurant::hosting::add_to_waitlist();

    // ✓ 使用 use 引入后，可以用短路径
    use restaurant::hosting;
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
```

### use 的惯例

#### **函数**：导入到父模块，调用时指定完整路径

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();  // ✓ 这是惯例用法
    map.insert(1, 2);
}
```

不好的做法：直接导入函数

```
use std::collections::hash_map::HashMap::new;  // ✗ 不推荐

// 应该这样：
use std::collections::HashMap;

fn main() {
    let map = HashMap::new();
}
```

#### **结构体、枚举**：导入完整路径

```
use std::collections::HashMap;
use std::result::Result;

fn main() {
    let _map = HashMap::new();
    let _result: Result<i32, String> = Ok(42);
}
```

## 处理名称冲突

当导入两个同名的项时，需要用父模块来区分，或用 `as` 起别名。

### 方式 1：用父模块区分

```
use std::fmt;
use std::io;

fn function1() -> fmt::Result {
    Ok(())
}

fn function2() -> io::Result<()> {
    Ok(())
}

fn main() {
    let _r1: fmt::Result = function1();
    let _r2: io::Result<()> = function2();
}
```

### 方式 2：用 as 重命名

```
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result {
    Ok(())
}

fn function2() -> IoResult<()> {
    Ok(())
}

fn main() {
    let _r1: Result = function1();
    let _r2: IoResult<()> = function2();
}
```

## 嵌套 use 路径

导入多个项时，可以合并相同的前缀。

```
// 传统写法
use std::cmp::Ordering;
use std::io;

// 嵌套写法（更简洁）
use std::{cmp::Ordering, io};

fn main() {
    let _order = Ordering::Less;
}
```

### 包括 self 的嵌套

```
use std::io::{self, Write};  // 导入 io 和 io::Write

fn main() {
    // 可以使用 io:: 和 io::Write::
}
```

## glob 运算符

用 `*` 导入模块中的所有公有项（谨慎使用）。

```
use std::collections::*;

fn main() {
    // 所有 collections 中的公有项都可以使用
    let _vec = Vec::new();
    let _map = HashMap::new();
}
```

> 注意：glob 会让代码变得难以追踪名称来源，通常只在测试中使用。


## pub use：重导出

`pub use` 将导入的项重新导出，使其对外部可见。这在设计库的公开 API 时很有用。

```
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {
            println!("已添加");
        }
    }
}

// 将 hosting 重新导出到库的顶层 API
pub use front_of_house::hosting;

fn main() {
    // 用户可以直接访问 hosting，不需要知道 front_of_house 的存在
    hosting::add_to_waitlist();
}
```

### 为什么要重导出？

想象你设计了一个库，内部结构是 `types::User` 和 `types::Post`，但用户只关心”用户”和”文章”这两个概念。用 `pub use` 可以简化 API。

**单文件例子：**

```
// 内部结构
mod types {
    pub struct User { pub name: String }
    pub struct Post { pub title: String }
}

// 导出到顶层，用户可以直接用
pub use types::{User, Post};

// 用户现在可以这样使用：
// use my_lib::{User, Post};
// 而不需要知道 types 模块
```

**多文件例子（深层模块的重导出）：**

假设你的库有这样的结构：`types` 模块在深处定义了 `User` 和 `Post`。问题是：能否直接从顶层 `lib.rs` 把它们导出给用户？

### 第一种方式：直接导出（无中间层）

项目结构：

```
src/
├── lib.rs
└── types/
    └── mod.rs         ← 这里定义 User 和 Post
```

**types/mod.rs：**

```
pub struct User { pub name: String }
pub struct Post { pub title: String }
```

**lib.rs：**

```
mod types;

// 直接从 types 导出到顶层
pub use types::{User, Post};
```

**用户使用：**

```
use my_lib::{User, Post};  // ✅ 工作正常
```

---
### 第二种方式：链式重导出（多层嵌套）

如果 types 被嵌套在 utils 内部，才需要链式转发：

项目结构：

```
src/
├── lib.rs
└── utils/
    ├── mod.rs
    └── types.rs        ← types 是 utils 的子模块
```

**utils/types.rs：**

```
pub struct User { pub name: String }
pub struct Post { pub title: String }
```

**utils/mod.rs（从子模块重导出）：**

```
mod types;

// 把 types 导出到 utils 的公开 API
pub use types::{User, Post};
```

**lib.rs（再导出一级到顶层）：**

```
mod utils;

// 把 utils 的导出再导到顶层
pub use utils::{User, Post};
```

**用户使用：**

```
use my_lib::{User, Post};  // ✅ 用户完全看不到 utils 的存在
```

**真实意义**：当 types 本身是 utils 内部的组织时，链式重导出让用户只看到最简洁的公开 API。

> 重要：重导出有个前提——源项必须是 pub 的。如果 User 本身是私有的，即使你写了 pub use types::User; 也会编译错误。因为重导出就是”我允许外部访问这个项”，但前提是这个项本身要对外可见。


# 跨 Crate 使用

前面讲的都是**同一个 crate 内**的模块访问。Rust 也支持**跨 crate 访问**——调用其他 crate 中的函数。

## 前提条件

- **目标必须是库 crate**（有 `src/lib.rs`）
- **函数必须标记为 **`pub`（否则外部无法访问）
- **在 Cargo.toml 中声明依赖**
- **用 **`use`** 导入**

## 文件结构

```
workspace/
├── math_lib/                    ← 库 crate
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs              ← 包含 pub fn add()
│
└── my_app/                      ← 应用 crate
    ├── Cargo.toml              ← 声明对 math_lib 的依赖
    └── src/
        └── main.rs             ← 使用 use math_lib::add;
```

## 实例

假设有两个 crate：`math_lib`（库）和 `my_app`（应用）

**math_lib/src/lib.rs：**

```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn internal_helper() {  // 私有，外部无法访问
    println!("内部帮助函数");
}
```

**my_app/Cargo.toml：**

```
[dependencies]
math_lib = { path = "../math_lib" }  # 本地路径
# 或从 crates.io：
# math_lib = "0.1"
```

**my_app/src/main.rs：**

```
use math_lib::add;  // 导入其他 crate 的函数

fn main() {
    let result = add(2, 3);  // ✓ 可以调用 pub 函数
    println!("结果：{}", result);

    // ❌ 无法调用私有函数
    // math_lib::internal_helper();
}
```

## 可见性仍然有效

跨 crate 访问时，**可见性规则仍然适用**：

- 只能访问目标 crate 中标记为 `pub` 的项
- 嵌套模块也要遵循”完整路径都是 pub”的规则
- 私有项永远隐藏，无论在哪里调用

这是 **Cargo（包管理器）** 和 **模块系统** 结合的力量。

## 循环依赖约束

**重要限制**：Rust 的 crate 依赖**必须是 DAG（有向无环图）**，不允许循环依赖。

```
❌ 不允许循环依赖：
crate_a → crate_b → crate_c → crate_a
```

**如果遇到循环依赖**，通常说明代码设计有问题，需要重构：

- 提取公共功能到第三个 crate
- 将某个 crate 的依赖改为模块内依赖

强制消除循环依赖，反而能写出更清晰的架构。


## 路径基础测验

```
mod outer {
    pub mod inner {
        pub fn function() {
            println!("inner function");
        }
    }
}
```

```
use std::cmp::Ordering;
use std::collections::HashMap;
use std::collections::HashSet;
use std::io;

fn main() {
    let _order = Ordering::Less;
    let _map = HashMap::new();
    let _set = HashSet::new();
    let _io = io::stdout();
}
```

## 编程练习

### 利用 use 和路径组织模块

创建一个库结构，包含：

- `types` 模块（私有），定义 `User` 和 `Post` 结构体
- 通过 `pub use` 将 `User` 和 `Post` 重导出到顶层
- `utils` 模块，包含 `format_user()` 函数
- 在 `main` 中通过简洁的路径使用这些项

```
// TODO: 修改可见性
mod types {
    struct User {
        name: String,
    }
    struct Post {
        title: String,
    }
}

// TODO: 使用 pub use 将 User 和 Post 重导出

// TODO: 使用 User
mod utils {


    pub fn format_user(user: &User) -> String {
        format!("用户: {}", user.name)
    }
}

fn main() {
    // 直接使用 User，不需要知道 types 模块
    let user = User { name: "Alice".to_string() };
    let post = Post { title: "我的博文".to_string() };

    println!("{}", user.name);
    println!("{}", post.title);

    // 使用 utils 中的函数
    println!("{}", utils::format_user(&user));
}
```
当项目从单个文件成长为多个 crate 协作的大型工程，你需要掌握 Rust 的工程化能力。本章覆盖三个核心工具：用 Workspace 统一管理多 crate 依赖，用构建脚本在编译前执行自定义逻辑，以及写出能自动测试的文档注释。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 用一个根            | Cargo.toml      | 管理多个 crate，共享依赖版本与编译缓存 |
| 编译前的自定义脚本：代码生成、链接原生库、features 条件编译 |                 |
| ///             | 文档注释的写法，以及嵌入代码示例并自动测试 |
# 工作空间基础

## 为什么需要工作空间

随着项目规模增大，单个 crate 会变得臃肿难以维护。更常见的情况是：一个项目自然分成了几个部分——核心库 + CLI 工具 + 集成测试 + 辅助工具库。

如果把它们当作**独立项目**来管理，麻烦就来了：

- 每次修改核心库，都要先发布新版本，再更新工具的 `Cargo.toml`，非常繁琐
- 各自有独立的 `target/` 目录，重复编译同样的依赖，浪费大量时间
- 无法在一条命令里构建和测试所有部分

**工作空间（Workspace）** 就是解决这个问题的方案：把多个相关 crate 放在同一个目录下，用一个根 `Cargo.toml` 统一管理。

## 工作空间的文件结构

一个典型的工作空间长这样：

```
my_project/            ← 工作空间根目录
├── Cargo.toml         ← 工作空间配置（根 Cargo.toml）
├── Cargo.lock         ← 共享的依赖锁文件
├── target/            ← 共享的构建目录
├── my_lib/            ← 成员 crate：核心库
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── my_cli/            ← 成员 crate：命令行工具
    ├── Cargo.toml
    └── src/
        └── main.rs
```

根目录的 `Cargo.toml` 使用 `[workspace]` 段落声明这是一个工作空间，并通过 `members` 列出所有成员：

```
# 根 Cargo.toml
[workspace]
members = [
    "my_lib",
    "my_cli",
]
resolver = "2"
```

> resolver = "2"：从 Rust 2021 edition 起，建议在工作空间中显式声明使用第 2 版依赖解析器，它在处理 features 时行为更一致、更符合直觉。


每个成员 crate 有自己的 `Cargo.toml`，跟普通项目一样：

```
# my_lib/Cargo.toml
[package]
name = "my_lib"
version = "0.1.0"
edition = "2021"
```

```
# my_cli/Cargo.toml
[package]
name = "my_cli"
version = "0.1.0"
edition = "2021"

[dependencies]
my_lib = { path = "../my_lib" }  # 引用同工作空间内的本地 crate
```

## 在工作空间中运行命令

在工作空间根目录下，可以用 `-p`（`--package`）指定针对哪个成员运行命令：

```
# 编译所有成员
cargo build --workspace

# 只编译 my_lib
cargo build -p my_lib

# 运行 my_cli（必须是二进制 crate）
cargo run -p my_cli

# 测试所有成员
cargo test --workspace

# 只测试 my_cli
cargo test -p my_cli

# 快速检查所有成员（不生成二进制文件，比 build 快）
cargo check --workspace
```

> 共享 target/：所有成员共用同一个 target/ 编译目录。这意味着：如果 my_lib 和 my_cli 都依赖 serde，它只会被编译一次。大型项目里这能节省大量编译时间。


# 依赖管理

## 共享的 Cargo.lock

工作空间只有**一个** `Cargo.lock`，位于根目录。这意味着所有成员 crate 使用同一份依赖版本快照。

好处：

- **版本一致**：`my_lib` 和 `my_cli` 使用完全相同版本的 `serde`，不会出现”我这里是 1.0.180，你那里是 1.0.193”这种诡异问题
- **确定性构建**：整个工作空间的构建行为完全可复现

## 工作空间级别的共享依赖

如果多个成员都依赖同一个外部 crate，你每次都要在各自的 `Cargo.toml` 里写，还要保证版本号一致——容易出错。

从 Rust 1.64 起，可以在根 `Cargo.toml` 的 `[workspace.dependencies]` 里**统一声明依赖**，各成员直接继承：

```
[workspace]
members = ["my_lib", "my_cli"]
resolver = "2"

[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
anyhow = "1.0"
```

> Features 小知识：features 是依赖库的可选功能模块，编译时由你选择启用哪些（如 serde 的 derive 宏），未启用的代码完全不参与编译，可以减小二进制体积。文章后面会专门讲解。


成员的 `Cargo.toml` 只需写 `workspace = true` 来继承：

```
[dependencies]
serde = { workspace = true }      # 继承根的版本和 features
anyhow = { workspace = true }

# 可以在继承基础上追加额外 features
tokio = { workspace = true, features = ["sync"] }
```

> features 是累加的：继承 workspace.dependencies 时，你只能追加 features，不能删除根里已有的。这与 Cargo feature 的”累加”设计是一致的——features 只能开启，不能关闭。


## 虚拟工作空间

### 什么是虚拟工作空间

有两种工作空间结构：

**非虚拟（常见）**：根目录本身是一个 crate

```
my_project/           ← 根目录既是工作空间，也是一个 crate
├── Cargo.toml        （有 [package] + [workspace]）
├── src/
└── member1/
    └── Cargo.toml
```

**虚拟（特殊）**：根目录只是”容器”，本身不是 crate

```
monorepo/             ← 根目录只是工作空间，不是 crate
├── Cargo.toml        （只有 [workspace]，没有 [package]）
├── lib_a/
│   └── Cargo.toml
├── lib_b/
│   └── Cargo.toml
└── lib_c/
    └── Cargo.toml
```

### 为什么要用虚拟工作空间

- **根没有代码**：有些项目天然是”多个独立库的集合”，比如 Tokio 生态（tokio、tokio-util、tokio-native-tls 各是独立库）
- **避免歧义**：没有一个”主”库，所以 `cargo build` 默认不知道该构建谁，必须明确指定，更清晰
- **平等性**：所有成员地位相同，没有”这个是主，那个是附属”的混乱

### 行为差异

| 场景              | 虚拟工作空间          | 有 [package] 的工作空间 |
| --------------- | --------------- | --------------- |
| cargo build     | （无参）            | 构建              | 所有              | 成员              | 只构建             | 根               | package         |
| cargo run       | 报错（没有根二进制）      | 运行根的 main 函数    |
| cargo test --workspace | 测试所有成员          | 测试所有成员          |

**实际使用建议**：

- 如果你的项目有一个”主”库或应用（如 web 服务器），用**有 [package] 的工作空间**
- 如果是平等的多个库组合（如工具链、中间件库族），用**虚拟工作空间**

# Features

## 什么是 Features 以及为什么需要它们

在工作空间讲解中，我们看到了这样的用法：

```
[dependencies]
tokio = { version = "1", features = ["full"] }
```

这里的 `features = ["full"]` 表示：“我要使用 tokio 这个库，并启用它的所有功能”。

**关键澄清**：`"full"` 不是 Cargo 的内置关键字，而是 **tokio 库作者定义的一个特殊 feature 的名字**。这个 feature 的作用就是启用 tokio 提供的所有可选功能。

如果用户不想要所有功能，可以只选择需要的：

```
[dependencies]
# 只启用 sync 和 time 功能（不启用其他）
tokio = { version = "1", features = ["sync", "time"] }
```

**背景**：很多库会提供多个可选功能。比如 tokio 库可以提供：

- 异步运行时（rt）
- 同步原语（sync）
- 计时器（time）
- I/O 工具（io-util）
- 等等…

库的作者不想强迫所有用户都编译所有功能，因为：

- 编译时间长
- 二进制文件体积大
- 可能有不需要的依赖被引入

所以库提供了 **features** 机制：用户可以选择”我需要哪些功能”。

## 两个视角理解 Features

![features](/images/rust/features.svg)
### 视角 1：作为库的使用者（用户）

当你使用提供 features 的库时，比如 tokio，你可以：

```
# 使用默认 features（tokio 默认是 rt）
tokio = "1"

# 启用特定 features（比如同步原语和计时器）
tokio = { version = "1", features = ["sync", "time"] }

# 启用所有 features
tokio = { version = "1", features = ["full"] }

# 关掉默认 features，只启用某些
tokio = { version = "1", default-features = false, features = ["rt"] }
```

### 视角 2：作为库的设计者（库作者）

现在反过来，**如果你在设计 tokio 这样的库**，怎么定义 features？

tokio 库就是这样做的，它提供多个可选功能模块。假设 tokio 的简化版本长这样：

```
# Cargo.toml

[features]
# 定义有哪些 features，以及它们之间的关系
default = ["rt"]             # 默认启用异步运行时
rt = []                      # 运行时功能本身不需要额外依赖
sync = []                    # 同步原语功能
time = []                    # 计时器功能
io-util = []                 # I/O 工具功能
full = ["rt", "sync", "time", "io-util"]  # 启用所有功能

[dependencies]
# 这些库用 optional = true 标记为可选
# 比如，某些高级功能可能需要额外的依赖库
# （现实中 tokio 不完全这样做，这里为了讲解简化）
```

**逻辑关系**：

- `[features]` 中，定义可用的 feature 及其组合关系
- `default` 定义默认启用哪些
- `"full"` 是一个特殊 feature，它启用其他所有 features

## 库设计者的三个步骤（以 tokio 为例）

### 步骤 1：声明可选依赖

```
[dependencies]
tokio-util = { version = "0.7", optional = true }
tracing = { version = "0.1", optional = true }
```

`optional = true` 表示这个库**不是必需的**。只有当用户启用了依赖这个库的 feature 时，这个库才会被下载和编译。如果没有任何 feature 需要它，这个库就根本不会出现在项目中。

### 步骤 2：在 Features 中关联

```
[features]
default = ["rt"]
rt = []                           # 异步运行时，无外部依赖
sync = []                         # 同步原语
time = []                         # 计时器
io-util = ["dep:tokio-util"]      # I/O 工具需要额外的库
tracing-support = ["dep:tracing"] # 追踪支持需要额外的库
full = ["rt", "sync", "time", "io-util", "tracing-support"]
```

`dep:库名` 表示”启用这个 feature 时，引入对应的库”。注意：是 `dep:` 前缀，不是直接写库名。这样明确区分”库的名字”和”feature 的名字”。

### 步骤 3：在代码中条件编译

```
// 基础功能，总是存在
pub fn version() {
    println!("tokio 1.0");
}

// 异步运行时：只在启用 rt feature 时编译
#[cfg(feature = "rt")]
pub fn spawn_task<F>(task: F)
where
    F: Fn() + Send + 'static,
{
    println!("在运行时中生成任务");
}

// 同步原语：只在启用 sync feature 时编译
#[cfg(feature = "sync")]
pub fn create_mutex<T>(value: T) {
    println!("创建互斥锁");
}

// 计时器：只在启用 time feature 时编译
#[cfg(feature = "time")]
pub fn sleep_ms(ms: u64) {
    println!("睡眠 {} 毫秒", ms);
}

// I/O 工具：需要 tokio-util 库，只在启用 io-util feature 时编译
#[cfg(feature = "io-util")]
pub fn use_codec() {
    use tokio_util;  // 这个 use 也被条件编译
    println!("使用 codec");
}
```

**关键**：当用户启用 `tokio = { version = "1", features = ["sync", "time"] }` 时：

- `rt`、`sync`、`time` 被启用，对应的函数**被编译进来**
- `io-util` 没被启用，`use_codec` 函数**不会被编译**
- `tokio-util` 库**不会被下载**
- 二进制文件中**没有未使用功能的代码**

这就是 features 的”零成本”抽象。

## 库使用者的使用方式

当用户在 `Cargo.toml` 中选择启用某个 feature 时，如果那个 feature 需要可选依赖，Cargo 会自动拉下来：

```
[dependencies]
# 启用 io-util feature，tokio-util 库会自动被下载和编译
tokio = { version = "1", features = ["io-util"] }

# 启用多个 features，所有需要的库都会被拉下来
tokio = { version = "1", features = ["sync", "io-util", "tracing-support"] }
```

这样做的好处：

- 用户不需要手动管理 `tokio-util` 等可选依赖
- Cargo 根据选择的 features，自动推导需要哪些库
- 未选择的 feature 对应的库**完全不下载**，节省空间

### 从命令行启用 Features

库作者设计好 features 后，用户也可以从命令行选择：

```
# 启用指定 features
cargo build --features "sync,io-util"

# 启用所有 features（包括所有可选依赖）
cargo build --all-features

# 不启用默认 features，只选特定的
cargo build --no-default-features --features "io-util"
```


## 工作空间概念测验

```
# 根 Cargo.toml：
[workspace.dependencies]
serde = { version = "1.0", features = ["derive"] }

# my_cli 的 Cargo.toml：
[dependencies]
serde = { workspace = true, features = ["rc"] }
```

## Features 与工作空间
# 什么是构建脚本

编译 Rust 项目时，Cargo 通常只是调用 `rustc` 把 `.rs` 文件编译成二进制。但有时候，**编译之前**需要做一些准备工作：

## 代码生成

某些代码不是手写的，而是从其他格式生成的。比如：

- Protocol Buffers（`.proto` 文件） → Rust 代码
- GraphQL 数据结构定义 → Rust 类型
- 数据库 schema → ORM 模型

这些生成的代码往往体积大、重复性高，手动维护既容易出错，又容易过时。`build.rs` 可以在编译前自动从源定义生成代码。

## 检测系统环境

某些库依赖系统中是否安装了特定的 C 库。比如：

- 能否链接 OpenSSL？
- 系统中是否有 libsqlite3？
- 目标平台是 Linux、macOS 还是 Windows？

手动检测很脆弱（不同系统的安装位置不同），`build.rs` 可以根据检测结果动态决定编译哪些代码、链接哪些库。

## 嵌入编译时信息

某些信息需要在编译时写死在二进制里，而不是运行时读取：

- 当前 git commit hash（用于发布版本的追踪）
- 编译日期和时间
- 编译时的环境变量（比如版本号）

这些信息必须通过 `build.rs` 在编译时嵌入，因为二进制部署后无法再修改。

## 条件编译和平台适配

交叉编译时（比如在 x86 机器上编译 ARM 程序），需要根据**目标平台**生成不同的代码：

- Windows 上的系统调用 API 和 Linux 不同
- ARM 和 x86_64 的性能优化策略不同
- 嵌入式系统可能不支持某些特性

`build.rs` 可以检测编译目标，并据此设置 cfg 标志来控制条件编译。

这些需求就是 **构建脚本（Build Script）** 的用武之地。

# 使用构建脚本

## 创建构建脚本

在 crate 根目录（`Cargo.toml` 的同级）创建 `build.rs` 文件：

```
my_crate/
├── Cargo.toml
├── build.rs      ← 构建脚本
└── src/
    └── lib.rs
```

`build.rs` 本身就是一个普通的 Rust 程序，有 `main()` 函数，**在编译你的 crate 之前运行**：

```
// build.rs
fn main() {
    // 构建脚本在这里执行
    println!("cargo::warning=构建脚本运行中...");
}
```

> 构建脚本是独立编译的：build.rs 会被编译成一个单独的可执行文件并运行，它的运行环境是编译机器（宿主机），而不是目标机器。因此即使你在做交叉编译，build.rs 也在你的本机上执行。


### 当 build.rs 变得很大时

如果构建逻辑变得复杂，一个 `build.rs` 文件会非常臃肿。Rust 允许你把逻辑分散到多个模块文件中，通常的做法是创建一个 `build/` 目录：

```
my_crate/
├── Cargo.toml
├── build.rs           ← 主入口，只负责调用
├── build/             ← 构建模块目录
│   ├── mod.rs         ← 模块入口，声明子模块
│   ├── codegen.rs     ← 代码生成逻辑
│   └── linkage.rs     ← 链接逻辑
└── src/
    └── lib.rs
```

在 `build.rs` 中声明模块并调用：

```
// build.rs
mod build;
```

这样 `build.rs` 保持简洁，具体逻辑分散在各个子模块里，更容易维护。

## build.rs 向 Cargo 发指令

build.rs 本身只是一个普通的 Rust 程序，但它有一个特殊能力：**它可以通过向 stdout 打印特定格式的行来与 Cargo 通信**（例如：`println!("cargo::rerun-if-changed=build.rs");`）。Cargo 会读取这些输出，根据其中的指令改变编译行为。这就是 build.rs 如此强大的原因。

指令格式是：

```
cargo::指令名=值
```

常用指令：

| 指令              | 作用与用途           |
| --------------- | --------------- |
| cargo::rerun-if-changed=PATH | 只在指定文件变化时才重新运行脚本。默认任何文件变化都会重新运行，很低效。通常指定 | build.rs        | 本身、             | .proto          | 定义文件等           |
| cargo::rerun-if-env-changed=VAR | 只在指定环境变量变化时才重新运行脚本。用于依赖系统环境的构建，如 | OPENSSL_DIR     | 、               | PKG_CONFIG_PATH |
| cargo::rustc-cfg=KEY | 或               | KEY="VALUE"     | 为代码设置自定义 cfg 标志。代码中可用 | #[cfg(key)]     | 识别。用于根据构建时检测结果决定编译哪些代码 |
| cargo::rustc-env=KEY=VALUE | 设置编译时环境变量，代码中用  | env!("KEY")     | 读取。用于嵌入 git hash、版本号等编译时信息 |
| cargo::rustc-link-lib=NAME | 或               | static=NAME     | 链接原生 C 库。       | NAME            | 为动态链接（默认），      | static=NAME     | 为静态链接。链接器会在搜索路径中查找库 |
| cargo::rustc-link-search=PATH | 添加库搜索路径。链接器会在这些目录中查找 C 库文件。用于非标准安装位置 |
| cargo::warning=MESSAGE | 在编译时输出警告信息。用于告诉用户构建中发生了什么，如”检测到 OpenSSL”等 |

> 新旧语法：从 Cargo 1.77 起，推荐用 cargo:: 前缀（双冒号）。旧版写法是 cargo: 单冒号，如 cargo:rerun-if-changed=...。两者目前都支持。


### 具体例子：向 crate 嵌入编译信息

看一个完整的例子，了解 build.rs 和 crate 代码如何协作：

**build.rs：** 生成编译时信息

```
// build.rs
use std::process::Command;

fn main() {
    // 只在 build.rs 本身变化时重新运行
    println!("cargo::rerun-if-changed=build.rs");

    // 获取 git commit hash
    let output = Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output();

    let git_hash = match output {
        Ok(out) if out.status.success() => {
            String::from_utf8_lossy(&out.stdout).trim().to_string()
        }
        _ => "unknown".to_string(),
    };

    // 通过 rustc-env 指令向 Cargo 发出指令
    // Cargo 会把这个环境变量设置给 rustc
    println!("cargo::rustc-env=GIT_HASH={}", git_hash);
}
```

**src/main.rs：** 在代码中使用这个信息

```
fn main() {
    // env!() 宏在编译时读取环境变量
    // build.rs 通过 println!("cargo::rustc-env=...") 设置的变量
    let version = env!("CARGO_PKG_VERSION");
    let git_hash = env!("GIT_HASH");

    println!("程序版本：{}", version);
    println!("编译自 commit：{}", git_hash);
}
```

**过程说明：**

- `cargo build` 时，Cargo 先编译并运行 `build.rs`
- build.rs 执行代码，从 git 读取 commit hash
- build.rs 打印 `cargo::rustc-env=GIT_HASH=abc123`
- **Cargo 读取这一行输出**，理解这是一条指令
- Cargo 把 `GIT_HASH=abc123` 设置为环境变量
- Cargo 调用 `rustc` 编译 `src/main.rs`
- 编译时，`env!("GIT_HASH")` 展开为 `"abc123"`
- 最终二进制中包含了编译时的 git 信息

这就是 build.rs 的工作流：**代码 → 输出指令 → Cargo 解析 → 影响编译**。

## 控制脚本何时重新运行

默认情况下，任何文件变化都会导致构建脚本重新运行。用 `rerun-if-changed` 可以缩小范围，让构建更快：

```
// build.rs
fn main() {
    // 只在这几个文件变化时才重新运行
    println!("cargo::rerun-if-changed=build.rs");
    println!("cargo::rerun-if-changed=src/schema.proto");

    // 只在环境变量变化时重新运行
    println!("cargo::rerun-if-env-changed=MY_LIB_PATH");
}
```

> 重要：如果你写了 rerun-if-changed，Cargo 就会只在你指定的文件变化时才重新运行脚本，不再监听其他文件。所以一般都要包含 build.rs 本身。


# 实用场景示例

## 生成代码

代码生成是构建脚本最强大的用途：读取某种定义文件（`.proto`、`.fbs`、配置 JSON 等），生成对应的 Rust 代码。

生成的文件必须写到 `OUT_DIR` 目录——这是 Cargo 为构建脚本专门提供的输出目录：

```
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    println!("cargo::rerun-if-changed=src/messages.txt");

    // Cargo 提供 OUT_DIR 环境变量，指向构建输出目录
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("generated.rs");

    // 读取定义文件，生成 Rust 代码
    let messages = fs::read_to_string("src/messages.txt").unwrap_or_default();
    let mut code = String::from("// 自动生成，请勿手动修改\n\n");

    for (i, line) in messages.lines().enumerate() {
        let line = line.trim();
        if !line.is_empty() {
            code.push_str(&format!(
                "pub const MSG_{}: &str = \"{}\";\n",
                i, line
            ));
        }
    }

    fs::write(&dest_path, code).unwrap();
}
```

在 crate 的 `lib.rs` 中引入生成的代码：

```
// src/lib.rs

// include! 宏在编译时把文件内容插入到这里
include!(concat!(env!("OUT_DIR"), "/generated.rs"));
```

这样 `MSG_0`、`MSG_1` 等常量就可以像普通 Rust 代码一样使用了。

## 设置自定义 cfg 标志

构建脚本可以根据系统环境设置自定义的 `cfg` 标志，比简单的 `#[cfg(target_os = "...")]` 更灵活：

```
// build.rs
fn main() {
    println!("cargo::rerun-if-changed=build.rs");

    // 检测是否有某个系统库
    if has_openssl() {
        println!("cargo::rustc-cfg=has_openssl");
    }

    // 根据目标架构设置标志
    let target_arch = std::env::var("CARGO_CFG_TARGET_ARCH").unwrap_or_default();
    if target_arch == "x86_64" || target_arch == "aarch64" {
        println!("cargo::rustc-cfg=is_64bit");
    }
}

fn has_openssl() -> bool {
    // 实际项目中可以用 pkg-config crate 来检测
    std::process::Command::new("pkg-config")
        .args(["--exists", "openssl"])
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}
```

在代码中使用：

```
#[cfg(has_openssl)]
mod tls {
    pub fn connect_tls() { /* ... */ }
}

#[cfg(is_64bit)]
fn optimized_64bit_algo() { /* ... */ }
```

## 链接原生库

Rust 经常需要调用 C 库。构建脚本告诉 Cargo 要链接哪个库：

```
// build.rs
fn main() {
    println!("cargo::rerun-if-changed=build.rs");

    // 告诉链接器链接 libssl（不带 lib 前缀和 .a/.so 后缀）
    println!("cargo::rustc-link-lib=ssl");
    println!("cargo::rustc-link-lib=crypto");

    // 动态链接（默认）
    println!("cargo::rustc-link-lib=dylib=ssl");

    // 静态链接
    println!("cargo::rustc-link-lib=static=ssl");

    // 添加库搜索路径
    println!("cargo::rustc-link-search=/usr/local/lib");
    println!("cargo::rustc-link-search=native=/opt/homebrew/lib");
}
```

> 实际项目中：手写库路径很脆弱，不同系统的安装位置不同。推荐使用 pkg-config crate，它能自动检测系统中安装的 C 库：

```
// build.rs
fn main() {
    pkg_config::probe_library("openssl").unwrap();
}
```


## Cargo 提供的环境变量

构建脚本运行时，Cargo 会设置很多有用的环境变量：

| 变量              | 内容              |
| --------------- | --------------- |
| OUT_DIR         | 构建输出目录（生成文件必须写这里） |
| CARGO_PKG_VERSION | crate 的版本号      |
| CARGO_PKG_NAME  | crate 的名称       |
| CARGO_MANIFEST_DIR | Cargo.toml      | 所在目录的绝对路径       |
| CARGO_CFG_TARGET_OS | 目标操作系统          |
| CARGO_CFG_TARGET_ARCH | 目标 CPU 架构       |
| PROFILE         | debug           | 或               | release         |
| HOST            | 编译机器（宿主）的 target triple |
| TARGET          | 目标机器的 target triple |


## 构建脚本概念测验
# 文档注释

**什么是文档注释？** Rust 有一种特殊的注释叫”文档注释”，它不仅注解代码，还能用 `cargo doc` 生成漂亮的 HTML 文档。这对 Rust 生态特别重要。

**为什么需要文档注释？** 与 C/C++ 不同，Rust **没有头文件**。C 使用者看头文件（`.h`）来了解库的接口，但 Rust 库没有这个。所以 Rust 社区的约定是：**库作者必须用文档注释详细说明每个 pub API 的用法、参数含义、返回值、可能的错误——使用者完全靠这些文档来理解如何使用库**。这也是为什么 Rust 开源社区对文档质量有很高的要求。

**什么内容需要文档注释？**

- **所有 pub 项**：任何公开的函数、结构体、枚举、trait、常量都应该有文档
- **复杂的逻辑**：非显而易见的行为、性能特性、安全约束等
- **模块和 crate 级别**：用 `//!` 说明整个模块的目的和使用场景
- **字段注释**：struct 和 enum 的每个公开字段都值得记录

## 两种文档注释

> 基础回顾：/// 和 //! 的基本语法已在[《注释》](/RustCourse/chapters/02-basic-syntax/01-comments#%E6%96%87%E6%A1%A3%E6%B3%A8%E9%87%8A--1)章节讲解。这里关注文档注释的进阶用法：Markdown 格式、标准文档章节、代码示例验证等。


> 使用规则：

> - //! 放在 lib.rs 顶部 → crate 级别的文档（在 docs.rs 首页显示）
> - //! 放在模块文件顶部 → 该模块的文档
> - /// 放在每个 pub item 之前 → 该 item 的文档


## 文档注释中的 Markdown

文档注释支持完整的 Markdown 语法：

```
/// 一个简单的用户结构体。
///
/// ## 字段说明
///
/// - `name`：用户名，不能为空
/// - `age`：用户年龄，必须大于 0
///
/// ## 示例
///
/// ```rust
/// let user = User { name: "Alice".to_string(), age: 25 };
/// assert_eq!(user.name, "Alice");
/// ```
pub struct User {
    /// 用户的名称
    pub name: String,
    /// 用户的年龄（岁）
    pub age: u32,
}
```

代码块（`````）、加粗、斜体、列表、表格、链接——Markdown 里有的这里都支持。生成的文档会按 Markdown 渲染成 HTML。

## 标准文档章节

Rust 社区约定了几个标准章节名，`cargo doc` 会把它们格式化得更显眼。这类似于 Doxygen（C/C++ 的文档生成工具）的概念——用特定的标记让文档生成工具能够识别和组织信息：

```
/// 将两个向量拼接，返回一个新向量。
///
/// # Examples
///
/// ```rust
/// let a = vec![1, 2];
/// let b = vec![3, 4];
/// let c = concat_vecs(a, b);
/// assert_eq!(c, vec![1, 2, 3, 4]);
/// ```
///
/// # Panics
///
/// 本函数不会 panic。
///
/// # Errors
///
/// 本函数不返回 `Result`，因此不会产生错误。
///
/// # Safety
///
/// 本函数完全安全，无需 unsafe。
pub fn concat_vecs(mut a: Vec<i32>, b: Vec<i32>) -> Vec<i32> {
    a.extend(b);
    a
}

fn main() {
    let result = concat_vecs(vec![1, 2], vec![3, 4]);
    println!("{:?}", result);
}
```

常用章节：

| 章节              | 用途              |
| --------------- | --------------- |
| # Examples      | 代码示例（几乎所有 pub API 都该有） |
| # Panics        | 说明什么情况下会 panic  |
| # Errors        | 返回              | Result          | 时说明错误类型和原因      |
| # Safety        | unsafe fn       | 必须说明调用者的安全不变量   |

## 生成和查看文档

```
# 生成文档，输出到 target/doc/
cargo doc

# 生成并在浏览器中打开
cargo doc --open

# 生成时包含私有 item 的文档
cargo doc --document-private-items
```

`cargo doc` 会在 `target/doc/` 目录下生成完整的 HTML 文档。你可以在 [官方 Rust 文档](https://doc.rust-lang.org/std/)上看到标准库的文档效果——这些都是用 `cargo doc` 生成的。

# Doctest

## 什么是 Doctest

文档注释里的代码块不仅是展示用的——`cargo test` 会自动把它们当成测试用例来编译和运行。这叫 **doctest**。

好处：

- 文档和测试合二为一，修改 API 时如果忘了更新文档里的示例，测试会失败
- 文档里的代码示例永远是”能运行的”，不会变成过时的死代码

```
/// 将摄氏度转换为华氏度。
///
/// # Examples
///
/// ```rust
/// // 这段代码会被 cargo test 当作测试运行！
/// assert_eq!(celsius_to_fahrenheit(0.0), 32.0);
/// assert_eq!(celsius_to_fahrenheit(100.0), 212.0);
/// ```
pub fn celsius_to_fahrenheit(c: f64) -> f64 {
    c * 9.0 / 5.0 + 32.0
}

fn main() {
    println!("100°C = {}°F", celsius_to_fahrenheit(100.0));
}
```

## 运行 Doctest

```
# 运行所有测试（包括 doctests、单元测试、集成测试）
cargo test

# 只运行 doctests
cargo test --doc

# 运行特定函数的 doctest（按函数名过滤）
cargo test celsius_to_fahrenheit
```

## 在 Doctest 中隐藏代码

有时候示例需要一些样板代码（`use` 语句、辅助结构体、错误处理等），但这些代码放在文档里会分散注意力。用 `#` 加空格开头的行可以在文档中隐藏，但在 doctest 运行时仍然包含：

```
/// 解析 JSON 格式的用户数据。
///
/// # Examples
///
/// ```rust
/// # // 这一行在文档里不显示，但 doctest 运行时包含
/// # struct User { name: String, age: u32 }
/// # fn parse_user(s: &str) -> Option<User> {
/// #     Some(User { name: s.to_string(), age: 18 })
/// # }
/// let user = parse_user("Alice");
/// assert!(user.is_some());
/// ```
pub fn demo() {
    println!("演示 doctest 隐藏行");
}

fn main() {
    demo();
}
```

> # 冲突问题：在 doctest 的代码块内部，#  是特殊语法（用于隐藏行）。而 Markdown 的 # 是在代码块外部用于标题。两者的上下文不同，所以不会混淆。


## Doctest 的特殊标记

代码块可以加修饰词来改变 doctest 的行为（如果有写代码不想作为测试的代码，可以使用以下方式）：

```
```rust,no_run
// no_run：编译但不运行（适合会产生副作用的代码，如网络请求）
let response = http_get("https://example.com").unwrap();
```

```rust,ignore
// ignore：既不编译也不运行（适合伪代码或未完成的示例）
let x = some_function_that_doesnt_exist();
```

```rust,should_panic
// should_panic：期望代码 panic（正确运行反而失败）
let v: Vec<i32> = vec![];
let _ = v[0];  // 越界访问，应该 panic
```

```rust,compile_fail
// compile_fail：期望代码编译失败（展示错误用法）
let s = String::from("hello");
let r1 = &mut s;  // 错误：s 不可变
```
```

## 跨行示例：? 运算符

`?` 运算符用于错误传播，在 `Result` 或 `Option` 后使用时，如果是 `Err` 或 `None` 就立即返回，否则继续执行。Doctest 里默认没有 `main()` 函数，也没有 `?` 的错误传播上下文。如果示例需要用 `?`，需要用 `#` 隐藏行来提供一个返回 `Result` 的函数作为上下文。这里了解即可。


## 文档注释测验