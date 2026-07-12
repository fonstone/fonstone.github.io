---
title: "测试、调试与编程方法论"
description: "单元测试与集成测试、测试控制、dbg! 宏、日志、代码架构、lint、CI、性能分析"
date: "2026-07-12"
order: 11
tags: ["测试", "调试", "Lint", "CI"]
est_time: "60 分钟"
---

代码能跑起来不代表代码是正确的。Rust 内置了完善的测试工具链——无需引入第三方库，`cargo test` 一条命令即可运行所有测试。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| #[test]         | 、断言宏、           | should_panic    | 与用              | Result          | 编写测试            |
| 并行与串行、过滤指定测试、忽略耗时测试 |                 |
| tests/          | 目录结构、与单元测试的分工与组合 |
# 测试函数的解剖

在 Rust 里，一个测试就是一个带有 `#[test]` 属性的普通函数。当你运行 `cargo test` 时，Rust 会编译一个专门的测试执行程序，找到所有标注了 `#[test]` 的函数并逐一运行，最后汇报哪些通过、哪些失败。

## 第一个测试

新建一个库项目时，Cargo 会自动帮你生成一个测试模块：

```
cargo new adder --lib
```

打开 `src/lib.rs`，可以看到：

```
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
```

几个关键点：

- `#[cfg(test)]`：条件编译标记，告诉 Rust 只在执行 `cargo test` 时才编译这个模块，`cargo build` 时不编译，不会浪费编译时间，也不会增大二进制文件体积。
- `mod tests`：普通的模块，只是约定俗成地叫 `tests`。
- `#[test]`：标记这个函数是一个测试函数。模块内也可以有普通的辅助函数（不加 `#[test]`），用来为测试准备数据。

运行测试：

```
cargo test
```

输出示例：

```
running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

## 测试是怎么失败的

**测试函数 panic，测试就失败。** 每个测试跑在独立的线程里，如果线程 panic 了，主线程会捕捉到并把这个测试标记为失败。

```
#[cfg(test)]
mod tests {
    #[test]
    fn another() {
        panic!("让这个测试失败");  // 主动 panic
    }
}
```

输出示例：

```
running 1 test
test tests::another ... FAILED

failures:
---- tests::another stdout ----
thread 'tests::another' panicked at '让这个测试失败', src/lib.rs:4:9

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
```

> 这就是所有断言宏的工作原理——当条件不满足时，它们调用 panic!，从而让测试失败。


## use super::*

测试模块是嵌套在源码文件里的内部模块，要访问外层模块的内容，需要显式导入：

```
pub fn add_two(a: i32) -> i32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;  // 把外层模块的所有公开（及私有）内容引入

    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2));
    }
}
```

注意 `use super::*` 可以访问**私有函数**，这是 Rust 允许的——测试就在同一个文件里，没有跨越模块边界。

# 断言宏

Rust 标准库提供了三个核心断言宏，覆盖了绝大多数测试场景。

## assert!

`assert!(expr)` —— 断言表达式为 `true`，否则 panic。

```
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let large = Rectangle { width: 8, height: 7 };
        let small = Rectangle { width: 5, height: 1 };
        assert!(large.can_hold(&small));  // 期望为 true
    }

    #[test]
    fn smaller_cannot_hold_larger() {
        let large = Rectangle { width: 8, height: 7 };
        let small = Rectangle { width: 5, height: 1 };
        assert!(!small.can_hold(&large));  // 取反，期望 false 变 true
    }
}
```

## assert_eq! 和 assert_ne!

`assert_eq!(left, right)` 断言两值**相等**；`assert_ne!(left, right)` 断言两值**不相等**。

它们比 `assert!(a == b)` 更好用的地方在于：**断言失败时会打印出具体的两个值**，方便定位问题。

```
pub fn add_two(a: i32) -> i32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2));  // 期望 4，实际 add_two(2) = 4，通过
    }
}
```

故意引入 bug，把 `a + 2` 改成 `a + 3`，失败输出会是：

```
assertion failed: `(left == right)`
  left: `4`,
 right: `5`
```

清楚地告诉你”期望是 4，实际是 5”。

> 注意：assert_eq! 的两个参数叫 left 和 right，没有”期望值必须放哪边”的强制约定，但通常习惯把期望值放左边。


使用 `assert_eq!` / `assert_ne!` 的类型必须实现 `PartialEq` 和 `Debug` trait，大多数内置类型已经实现。自定义结构体可以加 `#[derive(PartialEq, Debug)]`。

## 自定义失败信息

断言宏都支持额外的格式化字符串参数，失败时会一并打印出来：

```
pub fn greeting(name: &str) -> String {
    format!("你好，{}！", name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_contains_name() {
        let result = greeting("小明");
        assert!(
            result.contains("小明"),
            "问候语中没有包含名字，实际得到的是：`{}`",
            result
        );
    }
}
```

当测试失败时，你会看到具体的 `result` 值，而不是干巴巴的”断言失败”。

# 特殊测试属性

除了 `#[test]`，还有两种常用的测试属性，分别用于测试”应该 panic 的代码”和”应该返回错误的代码”。

## should_panic：测试预期中的 panic

有些函数在接收非法输入时**应该** panic（比如边界检查）。`#[should_panic]` 属性可以测试这类场景：

```
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("猜测值必须在 1 到 100 之间，实际收到：{}", value);
        }
        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        Guess::new(200);  // 这里应该 panic，如果没有 panic，测试反而失败
    }
}
```

但 `#[should_panic]` 有个缺点：只要函数 panic 了（不管原因），测试就通过，容易产生误报。

加上 `expected` 参数可以更精确——只有 panic 信息**包含**指定字符串时，测试才通过：

```
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 {
            panic!("猜测值必须大于等于 1，实际收到：{}", value);
        } else if value > 100 {
            panic!("猜测值必须小于等于 100，实际收到：{}", value);
        }
        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "必须小于等于 100")]  // panic 信息必须包含这个子串
    fn greater_than_100() {
        Guess::new(200);
    }
}
```

## 用 Result<T, E> 编写测试

除了 panic，也可以让测试函数返回 `Result<(), E>`：

- 返回 `Ok(())` → 测试通过
- 返回 `Err(...)` → 测试失败

```
#[cfg(test)]
mod tests {
    #[test]
    fn it_works() -> Result<(), String> {
        if 2 + 2 == 4 {
            Ok(())
        } else {
            Err(String::from("2 + 2 的结果不是 4"))
        }
    }
}
```

这种写法的好处是可以在测试体内使用 `?` 运算符，方便链式调用会返回 `Result` 的函数：

```
fn read_file_test() -> Result<(), std::io::Error> {
    let content = std::fs::read_to_string("config.txt")?;  // 失败则测试直接失败
    assert!(content.contains("version"));
    Ok(())
}
```

> 注意：使用 Result<T, E> 的测试不能同时使用 #[should_panic]。如果想断言某操作返回 Err，用 assert!(result.is_err()) 代替。


# 练习题

## 测验

```
#[test]
fn another() {
    panic!("oops");
}
```

## 编程练习

下面的函数已经写好，请**补全两处 **`TODO`，用 `assert_eq!` 验证 `multiply` 的结果：

```
pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn main() {
    // TODO: 用 assert_eq! 验证 multiply(3, 4) == 12
    println!("test normal_multiply ... ok");

    // TODO: 用 assert_eq! 验证 multiply(5, 0) == 0
    println!("test multiply_by_zero ... ok");
}
```
# cargo test 的参数体系

`cargo test` 的命令行参数分为**两段**，用 `--` 分隔：

```
cargo test [cargo 自身的参数] -- [传递给测试二进制的参数]
```

- `--` **之前**：控制 Cargo 编译行为（如 `--release`、`--package`）
- `--` **之后**：控制测试程序的运行方式（如 `--test-threads`、`--show-output`）

```
# -- 之前：Cargo 自身的参数
cargo test --release               # 以 release 模式编译后运行测试
cargo test --package my_lib        # 只测试指定的包（工作区场景）
cargo test --help                  # 查看 Cargo 层的选项

# -- 之后：传给测试二进制的参数
cargo test -- --test-threads=1     # 串行运行测试
cargo test -- --show-output        # 显示通过测试的 println! 输出
cargo test -- --ignored            # 只运行被 #[ignore] 标记的测试
cargo test -- --help               # 查看测试二进制层的所有选项

# 两段组合使用
cargo test --release -- --test-threads=1   # release 模式 + 串行运行
cargo test my_func -- --show-output        # 只运行名称含 my_func 的测试，并显示输出
```

这两段的参数各自独立，不要混淆。

# 控制测试运行方式

## 并行与串行

默认情况下，Rust 会**并行运行**所有测试（多线程），以加快速度。

但并行运行有一个前提：**测试之间不能共享状态**。如果两个测试都读写同一个文件，就可能相互干扰，导致莫名其妙的失败。

遇到这种情况，可以把线程数限制为 1，让测试**串行执行**：

```
cargo test -- --test-threads=1
```

这样慢一些，但测试结果稳定可靠，适合调试相互干扰的测试。

## 显示 println! 的输出

默认情况下，**通过的测试**中的 `println!` 输出会被 Rust 截获，不显示在终端，只有失败的测试才会显示标准输出。

```
fn double(x: i32) -> i32 {
    println!("double({}) 被调用了", x);  // 正常运行时会看到，测试通过时看不到
    x * 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_double() {
        let result = double(5);
        assert_eq!(10, result);
    }
}
```

运行 `cargo test`，因为测试通过，你**看不到** `println!` 的内容。

如果你想在测试通过时也看到输出，加上 `--show-output`：

```
cargo test -- --show-output
```

这在调试时很有用——你可以在函数里加几行 `println!` 来观察中间状态，而不用担心干扰测试结果。

## 按名称过滤：只运行部分测试

有时你只想运行某一个或某一类测试，不需要跑所有测试：

假设有三个测试：

```
pub fn add_two(a: i32) -> i32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_two_and_two() {
        assert_eq!(4, add_two(2));
    }

    #[test]
    fn add_three_and_two() {
        assert_eq!(5, add_two(3));
    }

    #[test]
    fn one_hundred() {
        assert_eq!(102, add_two(100));
    }
}
```

**只运行一个测试**——传入完整函数名：

```
cargo test one_hundred
```

```
running 1 test
test tests::one_hundred ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 2 filtered out
```

**运行名称包含某个词的所有测试**——传入部分名称：

```
cargo test add
```

```
running 2 tests
test tests::add_two_and_two ... ok
test tests::add_three_and_two ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out
```

`2 filtered out` 说明有 2 个测试被过滤掉了（这里只有 1 个，但样例展示了概念）。

> 测试名称包含模块路径，因此 cargo test tests 可以运行 tests 模块里的所有测试。


## 忽略耗时测试

有些测试运行时间很长（比如访问网络、操作大文件），日常开发中不想每次都跑。用 `#[ignore]` 标记它们：

```
#[cfg(test)]
mod tests {
    #[test]
    fn quick_test() {
        assert_eq!(2 + 2, 4);  // 瞬间完成
    }

    #[test]
    #[ignore]
    fn slow_test() {
        // 假设这里需要跑很久……
        assert!(true);
    }
}
```

运行 `cargo test`，`slow_test` 会显示为 `ignored`，不被执行：

```
running 2 tests
test tests::slow_test ... ignored
test tests::quick_test ... ok

test result: ok. 1 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out
```

当你需要专门运行被忽略的测试（比如 CI 环境），用：

```
cargo test -- --ignored
```

这样只运行带 `#[ignore]` 的测试，方便单独跑耗时测试套件。

## 命令速查

| 目标              | 命令              |
| --------------- | --------------- |
| 运行所有测试          | cargo test      |
| 串行运行（单线程）       | cargo test -- --test-threads=1 |
| 显示通过测试的输出       | cargo test -- --show-output |
| 只运行名称匹配的测试      | cargo test <关键词> |
| 只运行被忽略的测试       | cargo test -- --ignored |
| 运行所有（含被忽略的）     | cargo test -- --include-ignored |


## 测验
# 两种测试的分工

Rust 项目通常有两类测试，它们的目标不同、放的地方也不同：

| 单元测试            | 集成测试            |
| --------------- | --------------- |
| 放在哪里            | 与源码同文件（         | src/            | 目录下）            | 独立的             | tests/          | 目录              |
| 测什么             | 单个函数/模块的正确性，可以访问私有函数 | 多个模块协作的整体行为，只能访问公有 API |
| 需要              | #[cfg(test)]    | 是（因为和源码在同一文件）   | 否（Cargo 自动识别    | tests/          | 目录）             |
| 典型用途            | 验证内部实现细节        | 模拟真实用户调用库的方式    |

单元测试发现的是”零件坏了”，集成测试发现的是”零件没坏，但组装有问题”。两者互补，缺一不可。

## 单元测试的组织

单元测试住在源码文件里，用 `#[cfg(test)]` 隔离：

```
pub fn add_two(a: i32) -> i32 {
    internal_adder(a, 2)
}

fn internal_adder(a: i32, b: i32) -> i32 {  // 私有函数
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_public() {
        assert_eq!(4, add_two(2));
    }

    #[test]
    fn test_private() {
        // 可以直接测试私有函数！
        assert_eq!(5, internal_adder(3, 2));
    }
}
```

`#[cfg(test)]` 的作用是：`cargo build` 时这个模块完全不存在，只有 `cargo test` 时才编译进去。

# 编写集成测试

## tests/ 目录结构

集成测试放在项目根目录的 `tests/` 目录下（与 `src/` 同级）：

```
my_project/
├── src/
│   └── lib.rs
└── tests/
    └── integration_test.rs   ← 集成测试文件
```

`tests/` 下每个文件都是一个独立的 crate，Cargo 会在 `cargo test` 时自动编译并运行它们，**不需要** `#[cfg(test)]` 标注。

示例 `tests/integration_test.rs`：

```
use adder;  // 引入我们的库 crate

#[test]
fn it_adds_two() {
    assert_eq!(4, adder::add_two(2));
}
```

注意：

- 需要用 `use` 显式引入库，像外部用户一样使用它
- 只能调用**公有** API，私有函数在集成测试中不可见
- 每个文件都是独立 crate，不同文件之间默认不共享代码

运行时，输出会分为三段：

```
running 1 test                         ← 单元测试
test tests::internal ... ok

running 1 test                         ← 集成测试
test it_adds_two ... ok

running 0 tests                        ← 文档测试
```

## 运行指定的集成测试文件

如果 `tests/` 下有多个文件，可以用 `--test` 指定运行某个文件：

```
cargo test --test integration_test
```

只会运行 `tests/integration_test.rs` 中的测试，忽略其他文件。

结合名称过滤，可以更精确：

```
cargo test --test integration_test it_adds
```

只运行 `integration_test.rs` 中名称含 `it_adds` 的测试。

## 集成测试中的共享辅助模块

当多个集成测试文件都需要共同的辅助函数时，需要特别注意——**不能**直接创建 `tests/common.rs`。

为什么？因为 `tests/` 下每个 `.rs` 文件都被视为独立的测试 crate，`tests/common.rs` 也会被当成一个独立的测试文件运行，然后显示 `running 0 tests`——让输出变得混乱。

**正确做法**：创建子目录 `tests/common/mod.rs`：

```
tests/
├── integration_test.rs
└── common/
    └── mod.rs          ← 辅助函数放这里
```

`tests/common/mod.rs` 中写辅助函数：

```
pub fn setup() {
    // 测试前的准备工作，比如创建临时文件、初始化数据等
}
```

在集成测试文件中引用它：

```
use adder;

mod common;  // 声明模块

#[test]
fn it_adds_two() {
    common::setup();  // 调用辅助函数
    assert_eq!(4, adder::add_two(2));
}
```

子目录里的文件不会被 Cargo 当作独立的测试 crate，测试输出里不会出现多余的 `running 0 tests`。

> 原理：Cargo 的规则是：tests/ 下的直接子 .rs 文件各自是独立 crate；但子目录下的文件不是，它们只是普通模块。tests/common/mod.rs 走的是第二条路，所以不会被单独编译为测试 crate。


## 二进制项目的集成测试

只有**库 crate**（`src/lib.rs`）才能被集成测试引入。如果你的项目只有 `src/main.rs`（二进制 crate），集成测试就无法用 `use` 引入它的代码。

这是 Rust 生态约定采用**薄 main + 厚 lib** 结构的原因：

```
src/
├── main.rs   ← 只做参数解析、调用 lib 函数，尽量精简
└── lib.rs    ← 核心逻辑全在这里，方便测试
```

`main.rs` 里调用 `lib.rs` 中的函数；集成测试则通过 `use` 引入 `lib.rs` 测试核心逻辑。`main.rs` 的代码很少，不测也无妨。


## 测验
程序出 bug 是家常便饭。新手的第一反应通常是疯狂插入 `println!`——这能解决问题，但 Rust 提供了更好的工具：`dbg!` 宏快速定位逻辑错误，IDE 调试器用于复杂 bug 的单步排查，结构化日志让长期运行的程序留下可过滤的诊断信息。

> 调试能力是工程师的核心素养。掌握这些工具，遇到 bug 不再靠”感觉”，而是靠系统化排查。


## 本章目录

| 文章              | 适合什么情况          |
| --------------- | --------------- |
| 临时查看表达式的值，快速定位逻辑错误 |                 |
| 需要单步执行、观察多个变量状态的复杂 bug |                 |
| 长期运行的程序或库代码，需要可控的诊断信息 |                 |
# 认识 dbg!

`dbg!` 是 Rust 标准库内置的调试宏。和 `println!` 比起来，它有两大优势：

- **自动打印文件名、行号、表达式文本和值**，不需要手写格式字符串
- **返回表达式的值**，可以嵌套在任意表达式中而不破坏逻辑

一句话记忆：`dbg!` 就像给表达式加了个”临时监控探针”，随插随拔。

## 基本用法

最简单的用法：把变量或表达式传给 `dbg!`。

```
fn main() {
    let x = 5;
    let y = x * 2;

    dbg!(x);       // 打印 x 的值
    dbg!(y + 1);   // 打印表达式的值
}
```

输出结果：

```
[src/main.rs:4] x = 5
[src/main.rs:5] y + 1 = 11
```

注意输出格式：`[文件名:行号] 表达式 = 值`。这比 `println!("x = {}", x)` 少打很多字，而且**行号是自动的**，不需要你记住在哪一行插的调试语句。

## dbg! 会返回值

这是 `dbg!` 最独特的特性：它不是吞掉值，而是**把值的所有权返回出来**。

```
fn main() {
    // dbg! 返回值，所以可以直接在表达式里用
    let x = dbg!(5 * 3) + 1;  // 先打印 "5 * 3 = 15"，再用返回值 15 加 1
    println!("x = {}", x);     // x = 16
}
```

这意味着你可以把 `dbg!` 插入计算链的中间，不改变程序逻辑：

```
fn double(n: i32) -> i32 {
    n * 2
}

fn main() {
    // 原来的代码: let result = double(double(3));
    // 加入调试: 查看中间结果
    let result = double(dbg!(double(3)));
    println!("result = {}", result);
}
```

输出：

```
[src/main.rs:8] double(3) = 6
result = 12
```

## 和 println! 的对比

| 特性              | println!        | dbg!            |
| --------------- | --------------- | --------------- |
| 需要格式字符串         | ✓               | ✗（自动）           |
| 打印行号            | ✗（手动写）          | ✓（自动）           |
| 打印表达式文本         | ✗               | ✓（自动）           |
| 返回值             | ✗（返回            | ()              | ）               | ✓（返回原值）         |
| 输出到             | stdout          | stderr          |
| 需要              | Display         | ✓               | ✗（只需            | Debug           | ）               |

> 输出到 stderr：dbg! 的输出走 stderr，而 println! 走 stdout。这样在重定向程序输出时（./app > output.txt），调试信息不会混入结果文件里。


## 需要 Debug trait

`dbg!` 内部使用 `{:?}` 格式化，因此类型必须实现 `Debug` trait。基本类型、标准库类型都已实现。自定义类型加上 `#[derive(Debug)]` 即可：

```
#[derive(Debug)]  // 必须加这个，否则 dbg! 报错
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    let p = Point { x: 1.0, y: 2.5 };
    dbg!(&p);  // 借用，避免所有权转移
}
```

输出：

```
[src/main.rs:10] &p = Point {
    x: 1.0,
    y: 2.5,
}
```

注意这里传的是 `&p`（引用）而不是 `p`。如果传 `p`，`dbg!` 会取得所有权并返回，后续就不能用 `p` 了。

# 实战技巧

## 同时调试多个值

`dbg!` 支持多个参数，一次打印多个表达式：

```
fn main() {
    let a = 10;
    let b = 20;
    let c = a + b;

    dbg!(a, b, c);  // 三个值一起打
}
```

输出：

```
[src/main.rs:6] a = 10
[src/main.rs:6] b = 20
[src/main.rs:6] c = 30
```

## 在循环中调试

在循环体里用 `dbg!` 可以追踪每次迭代的中间状态：

```
fn main() {
    let mut sum = 0;
    for i in 1..=5 {
        sum += i;
        dbg!(i, sum);  // 追踪每轮 i 和累加结果
    }
}
```

## 在 if/match 条件中调试

有时你想知道某个条件判断里的值是什么，`dbg!` 可以不破坏条件逻辑地插入：

```
fn classify(n: i32) -> &'static str {
    if dbg!(n) > 0 {   // 打印 n，并把 n 的值返回给 if 使用
        "正数"
    } else if n < 0 {
        "负数"
    } else {
        "零"
    }
}

fn main() {
    println!("{}", classify(42));
    println!("{}", classify(-5));
}
```

## release 模式下的行为

`dbg!` 在 **release 模式**（`cargo build --release`）下仍然会输出，不会自动消除。

如果想让调试代码只在开发时生效，有两种方式：

**方式一：手动删除**（最简单，调试完就清理）

**方式二：使用条件编译**

```
fn main() {
    let x = 42;

    // 只在 debug 模式下执行
    #[cfg(debug_assertions)]
    dbg!(x);

    println!("x = {}", x);
}
```

> 最佳实践：dbg! 是临时调试工具，调试完成后应该删掉，不要提交到版本库。把它当便利贴用，用完撕掉。


## 无参数用法

`dbg!()` 不传参数时，只打印文件名和行号——相当于一个”我执行到这里了”的标记：

```
fn process(x: i32) -> i32 {
    dbg!();  // 确认函数被调用了
    if x > 0 {
        dbg!();  // 确认走了这个分支
        x * 2
    } else {
        x
    }
}

fn main() {
    process(5);
    process(-1);
}
```


## dbg! 基础测验

```
fn square(n: i32) -> i32 {
    n * n
}

fn main() {
    let result = square(dbg!(3 + 1));
    println!("{}", result);
}
```
# 配置调试环境

`dbg!` 适合快速排查，但当 bug 涉及复杂的状态变化、循环迭代或多函数调用时，**图形化调试器**会更有效率。你可以暂停程序在任意行，逐步观察每个变量的状态，而不需要插入任何代码。

## 需要安装什么

在 VS Code 中调试 Rust 程序需要两个扩展：

**1. rust-analyzer**（必须）

- Rust 语言服务器，提供代码补全、错误提示、跳转定义
- 搜索 `rust-analyzer`，安装官方扩展（Rust Programming Language 发布）

**2. CodeLLDB**（调试器后端，必须）

- 基于 LLDB 的调试适配器，让 VS Code 能控制 Rust 程序的执行
- 搜索 `CodeLLDB`，安装 Vadim Chugunov 发布的扩展

> 除了 CodeLLDB，也有 MSVC Debugger（ms-vscode.cpptools）可用于 Windows。本文以 CodeLLDB 为例，它在 macOS/Linux/Windows 上都可用。


## 创建 launch.json

VS Code 需要一个 `launch.json` 文件来知道如何启动调试会话。

**方法一：自动生成（推荐）**

- 打开 `src/main.rs`
- 点击左侧活动栏的”运行与调试”图标（或按 `Ctrl+Shift+D` / `Cmd+Shift+D`）
- 点击”创建 launch.json 文件”
- 选择 `LLDB` 作为调试器类型

VS Code 会在 `.vscode/launch.json` 生成类似以下内容：

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug executable 'my_app'",
            "cargo": {
                "args": [
                    "build",
                    "--bin=my_app",
                    "--package=my_app"
                ],
                "filter": {
                    "name": "my_app",
                    "kind": "bin"
                }
            },
            "args": [],
            "cwd": "${workspaceFolder}"
        }
    ]
}
```

关键字段说明：

| 字段              | 说明              |
| --------------- | --------------- |
| type: "lldb"    | 使用 CodeLLDB 调试器 |
| request: "launch" | 启动一个新进程（另一个选项是  | attach          | 附加到已运行的进程）      |
| cargo.args      | 构建参数，           | --bin=my_app    | 指定要调试的二进制名      |
| args            | 传给程序本身的命令行参数    |
| cwd             | 程序的工作目录         |

**方法二：手动创建**

在项目根目录创建 `.vscode/launch.json`，复制上面的模板，把 `my_app` 替换成你的 crate 名称（见 `Cargo.toml` 中的 `name` 字段）。

## 验证安装

配置好后，按 `F5` 应该能启动调试会话。如果程序正常结束，调试器会退出。如果遇到 `cargo: command not found` 或类似错误，检查 Rust 工具链是否正确安装（运行 `rustup show`）。

# 调试操作

## 设置断点

断点（Breakpoint）告诉调试器”在这行暂停程序，等我查看状态”。

**设置断点**：在代码编辑器里，点击行号左侧的空白区域，会出现一个红色圆点。

**条件断点**：右键红点 → “编辑断点” → 填入条件表达式（如 `i == 5`），只有条件为真时才暂停，在循环调试时非常有用。

## 启动调试

按 `F5` 或点击”运行与调试”面板里的绿色播放按钮。程序会运行直到遇到第一个断点，然后暂停。

此时顶部会出现**调试工具栏**：

| 按钮              | 快捷键             | 功能              |
| --------------- | --------------- | --------------- |
| 继续              | F5              | 继续运行，直到下一个断点    |
| 单步跳过            | F10             | 执行当前行，不进入函数     |
| 单步进入            | F11             | 执行当前行，如果是函数调用则进入该函数 |
| 单步跳出            | Shift+F11       | 运行完当前函数，回到调用处   |
| 重启              | Ctrl+Shift+F5   | 重新从头开始调试        |
| 停止              | Shift+F5        | 终止调试会话          |

## 观察变量

程序暂停时，左侧面板会显示：

**变量（Variables）面板**

- 自动列出当前作用域内所有变量及其值
- 可展开结构体、枚举、向量查看内部字段
- 悬停在代码中的变量名上也会弹出当前值

**监视（Watch）面板**

- 手动添加你想持续观察的表达式
- 程序每次暂停都会重新计算这些表达式的值
- 右键添加，或在变量面板右键 → “添加到监视”

**调用堆栈（Call Stack）面板**

- 显示当前的函数调用链
- 点击某一帧可以跳转到对应的代码位置，查看那一帧的局部变量

## 实际调试示例

假设有以下代码，`sum_squares` 函数的结果不对：

```
fn sum_squares(nums: &[i32]) -> i32 {
    let mut total = 0;
    for &n in nums {
        // 在这行设断点，观察每轮的 n 和 total
        total += n;  // BUG：忘记平方了
    }
    total
}

fn main() {
    let data = vec![1, 2, 3, 4];
    let result = sum_squares(&data);
    println!("sum of squares = {}", result);  // 期望 30，实际 10
}
```

调试步骤：

- 在 `total += n;` 这行设断点
- 按 `F5` 启动调试
- 程序第一次暂停时，Variables 面板显示 `n = 1`，`total = 0`
- 按 `F10` 单步跳过，查看 `total` 变为 1
- 继续按 `F5` 到下一轮循环，发现 `n` 是原始值而非平方值
- 定位 bug：`n` 没有被平方

## 调试测试函数

如果要调试 `#[test]` 函数，`launch.json` 里的 `cargo.args` 改为：

```
{
    "type": "lldb",
    "request": "launch",
    "name": "Debug unit tests",
    "cargo": {
        "args": [
            "test",
            "--no-run",
            "--lib"
        ]
    },
    "args": ["test_function_name"],  // 指定要运行的测试函数名
    "cwd": "${workspaceFolder}"
}
```

或者，在 VS Code 里找到测试函数上方出现的 `Run Test | Debug Test` 代码镜头（CodeLens），直接点”Debug Test”——这是最方便的方式，不需要手动配置。

> rust-analyzer 的 CodeLens 功能：安装 rust-analyzer 后，#[test] 函数和 fn main() 上方会自动显示 ▶ Run | Debug 链接，点击即可一键调试，无需手动管理 launch.json。



## IDE 调试测验
# 为什么需要日志

## println! 的局限

`dbg!` 和 `println!` 适合开发期的临时调试，但有几个明显的局限：

- **无法分级**：你没法说”这条消息是警告，那条是调试信息”
- **无法过滤**：不需要的时候必须手动删，需要的时候再手动加回来
- **不适合库代码**：库的使用者不想看到你的调试输出
- **格式固定**：无法输出带时间戳、带模块名的结构化日志

日志系统解决了这些问题。Rust 生态有一个广泛采用的日志**门面**（Facade）—— [log](https://crates.io/crates/log) crate，它只定义接口，不绑定具体输出方式。程序中用 `log` 的宏写日志，运行时插入一个**日志实现**（如 `env_logger`）来决定怎么输出。

类比：USB 是接口标准，具体的 U 盘品牌是实现。你买了 `log` 的”USB 接口”，可以随时换不同的”U 盘”（日志后端），代码不需要改。

## 日志级别

`log` 定义了五个级别，从最详细到最严重：

| 级别              | 宏               | 用途              |
| --------------- | --------------- | --------------- |
| TRACE           | trace!()        | 极细粒度的追踪信息，通常不在生产环境开启 |
| DEBUG           | debug!()        | 开发调试信息，生产环境通常关闭 |
| INFO            | info!()         | 常规运行信息（启动、完成、重要事件） |
| WARN            | warn!()         | 警告，程序还能运行但有潜在问题 |
| ERROR           | error!()        | 错误，某个操作失败（但程序可能继续运行） |

级别越高（ERROR 最高），越重要。生产环境一般只输出 `INFO` 及以上级别。

## 添加依赖

在 `Cargo.toml` 中添加：

```
[dependencies]
log = "0.4"
env_logger = "0.11"
```

`log` 是接口，`env_logger` 是开发和测试常用的简单实现（读取 `RUST_LOG` 环境变量来配置输出）。

# env_logger 实战

## 初始化与基本使用

在 `main` 函数的**最开始**调用 `env_logger::init()` 来初始化日志系统，然后就可以用 `log` 的宏了：

```
fn main() {
    // 初始化 env_logger，读取 RUST_LOG 环境变量
    env_logger::init();

    trace!("超详细的追踪信息：{}", 42);
    debug!("调试信息：正在处理请求");
    info!("服务器启动，监听端口 {}", 8080);
    warn!("配置文件中未找到超时设置，使用默认值 30s");
    error!("数据库连接失败：{}", "connection refused");
}
```

use log::{trace, debug, info, warn, error};
fn main() {
    // 初始化 env_logger，读取 RUST_LOG 环境变量
    env_logger::init();

    trace!("超详细的追踪信息：{}", 42);
    debug!("调试信息：正在处理请求");
    info!("服务器启动，监听端口 {}", 8080);
    warn!("配置文件中未找到超时设置，使用默认值 30s");
    error!("数据库连接失败：{}", "connection refused");
}
直接 `cargo run`，你会发现**没有任何输出**。这是正常的——默认情况下 `env_logger` 不输出任何内容，需要通过 `RUST_LOG` 环境变量指定要显示的级别。

## RUST_LOG 环境变量

`RUST_LOG` 是控制 env_logger 输出的核心变量：

```
# 显示 INFO 及以上（INFO、WARN、ERROR）
RUST_LOG=info cargo run

# 显示所有级别（包括 TRACE、DEBUG）
RUST_LOG=trace cargo run

# 只显示 ERROR 级别
RUST_LOG=error cargo run
```

开启 `RUST_LOG=info` 后，上面程序的输出类似：

```
[2026-01-15T10:30:00Z INFO  my_app] 服务器启动，监听端口 8080
[2026-01-15T10:30:00Z WARN  my_app] 配置文件中未找到超时设置，使用默认值 30s
[2026-01-15T10:30:00Z ERROR my_app] 数据库连接失败：connection refused
```

输出格式：`[时间 级别 模块名] 消息`

## 按模块过滤

`RUST_LOG` 支持精确指定哪些模块的日志要显示：

```
# 只显示名为 my_app::database 的模块的 DEBUG 及以上日志
RUST_LOG=my_app::database=debug cargo run

# my_app 模块用 debug 级别，其他依赖用 warn 级别
RUST_LOG=warn,my_app=debug cargo run

# 多模块独立控制
RUST_LOG=my_app::http=info,my_app::db=debug cargo run
```

这种过滤对调试复杂系统非常有用：你可以只打开正在排查的模块的详细日志，而不被其他模块的噪音淹没。

## 在库中使用日志

`log` 是专门为库设计的门面。**库代码只使用 **`log`** 的宏，不调用 **`env_logger::init()`——由使用库的应用程序决定用哪个日志实现：

```
// 这是一个库的代码（lib.rs）
use log::{debug, info, warn};

pub fn parse_config(path: &str) -> Result<String, String> {
    debug!("开始解析配置文件：{}", path);

    // 模拟读取配置
    if path.is_empty() {
        warn!("配置文件路径为空，使用默认配置");
        return Ok("default".to_string());
    }

    info!("配置文件解析成功");
    Ok("config content".to_string())
}
```

库不调用 `env_logger::init()`，这样库的使用者可以自由选择 `env_logger`、`tracing`、`fern` 等任意日志后端。

> 注意：如果你同时在库和应用里都调用了 env_logger::init()，会触发运行时 panic（日志系统只能初始化一次）。库里永远不要调用 init()。


## 在测试中查看日志

单元测试默认会捕获 stdout，但 `env_logger` 输出到 stderr。要在测试中查看日志，可以这样初始化：

```
#[cfg(test)]
mod tests {
    use super::*;

    fn init_logger() {
        // try_init 在已初始化时不报错（测试会多次调用）
        let _ = env_logger::builder()
            .is_test(true)       // 让日志走 test 的输出机制
            .try_init();
    }

    #[test]
    fn test_with_logging() {
        init_logger();
        // 设置 RUST_LOG=debug cargo test 即可看到测试中的日志
        log::debug!("测试开始");
        assert_eq!(2 + 2, 4);
    }
}
```

## 日志格式定制

`env_logger` 的 Builder API 支持自定义输出格式：

```
fn main() {
    env_logger::Builder::from_default_env()
        .format_timestamp_secs()   // 时间戳精度到秒（默认是毫秒）
        .format_module_path(false) // 不显示模块路径
        .init();

    info!("格式更简洁的日志");
}
```

use log::info;
fn main() {
    env_logger::Builder::from_default_env()
        .format_timestamp_secs()   // 时间戳精度到秒（默认是毫秒）
        .format_module_path(false) // 不显示模块路径
        .init();

    info!("格式更简洁的日志");
}
对于生产级别的日志需求（结构化 JSON 输出、异步日志、分布式追踪），可以考虑 [tracing](https://crates.io/crates/tracing) 生态——它是 `log` 的超集，额外支持 span（时间段追踪）概念，在异步程序中特别有用。


## 日志系统测验
写出能编译的 Rust 代码只是第一步。在真实的工程项目里，你还需要回答：代码应该怎么组织、编码时先写什么、怎么保证多人协作时代码风格一致、如何自动检查代码质量、如何找出性能瓶颈。

这一章以一个**从零到上线的大工程**为背景，按生命周期顺序讲解 Rust 工程化的核心方法论。

![ 方法论](/images/rust/method.svg)
> 这一章的内容偏”工程实践”，不需要背语法，重在理解为什么要这样做，建立工程思维。


## 本章目录

| 文章              | 核心问题            |
| --------------- | --------------- |
| 如何把需求拆成模块？Cargo Workspace 怎么规划？ |                 |
| 先定结构体还是 Trait？怎么用测试驱动实现？ |                 |
| 如何让工具自动发现问题、统一代码风格？ |                 |
| 如何自动化质量检查？依赖怎么选、怎么审计？ |                 |
| 如何用 criterion + flamegraph 定位并量化性能问题？ |                 |
## 为什么 Rust 工程需要提前规划

写小脚本时，代码结构并不重要。但随着项目规模增长，“想到哪写到哪”会快速积累问题：

- 模块之间依赖关系复杂，改一处牵一发动全身
- 公共逻辑散落各处，难以复用
- 接口不稳定，测试难以编写
- 新成员难以理解代码意图

Rust 的类型系统和所有权机制在**微观层面**帮你避免内存 bug，但**宏观层面**的模块设计、依赖方向、接口边界，还是需要人来决策。好的架构设计能让 Rust 的编译期保证从函数级别延伸到整个系统。

> 架构设计不是一次性的 — 它会随着需求演进而迭代。但在项目初期花时间认真思考结构，能节省后期数倍乃至数十倍的重构时间。


## 从需求到模块划分

**第一步：列出系统需要做的事**

把需求拆解成动词短语（“解析配置”、“执行 HTTP 请求”、“持久化到数据库”）。每一个独立的”做什么”往往对应一个模块的核心职责。

**第二步：按变化频率分组**

把这些能力按”哪些会一起变化、哪些变化互不影响”分组。会一起变化的功能放同一个模块，独立变化的拆分开。

例如，一个命令行工具的职责分组可能是：

```
cli/        ← 解析命令行参数（输入层，随 UX 变）
config/     ← 读取配置文件（配置格式变时只改这里）
core/       ← 核心业务逻辑（最稳定，测试最密集）
output/     ← 格式化输出（输出格式变时只改这里）
```

**第三步：画出模块间的依赖箭头**

用一张简单的有向图标记哪个模块依赖哪个模块。**箭头不能形成环**——循环依赖是架构腐化的早期信号。

好的依赖方向通常是：`入口层 → 业务层 → 基础设施层`，箭头指向稳定性更高的方向。

## 定义公共接口（Trait 先行）

Rust 工程架构的核心习惯：**先写 Trait，后写实现**。

Trait 定义了模块之间的”契约”——你的模块对外承诺提供什么能力，调用方只需要知道这个契约，不关心内部如何实现。

**Trait 先行的流程：**

- 确定模块边界后，为每个模块的对外能力抽象出一个或几个 Trait
- 在 Trait 里只写方法签名，不写实现
- 用这些 Trait 编写调用方的逻辑（此时实现还不存在也没关系，甚至可以用 `todo!()` 占位）
- 最后再实现 Trait 的具体逻辑

这个顺序的好处是：

- **接口设计由使用方驱动**，而不是由实现方驱动，更贴近真实需求
- 调用方代码可以针对 Trait 编写，**依赖注入** 和**测试替换**变得自然
- 多个实现（如生产环境用真实数据库、测试用内存 mock）可以无缝切换

> 如果你发现 Trait 方法数量急剧增长（超过 5-7 个），通常说明这个 Trait 承担了太多职责，需要拆分。


## Cargo Workspace 结构规划

当项目规模较大时，把所有代码塞进一个 crate 会导致编译时间长、模块边界模糊。**Cargo Workspace** 允许你把项目拆成多个 crate，各自独立编译，但共享同一个 `Cargo.lock` 和构建缓存。

**典型的 Workspace 布局：**

```
my-project/
├── Cargo.toml          ← workspace 根配置（只列 members，不写代码）
├── crates/
│   ├── core/           ← 核心库，零依赖或最少依赖，最稳定
│   │   └── Cargo.toml
│   ├── cli/            ← 命令行入口，依赖 core
│   │   └── Cargo.toml
│   ├── server/         ← HTTP 服务入口，依赖 core
│   │   └── Cargo.toml
│   └── common/         ← 跨 crate 共享的类型、工具函数
│       └── Cargo.toml
└── tests/              ← 集成测试（可访问所有 crate 的公开接口）
```

**什么时候拆 crate：**

- 核心逻辑有多个不同的入口（CLI + HTTP + WebAssembly）→ 核心单独一个 crate
- 某个功能需要完全不同的依赖集 → 隔离依赖，避免污染其他 crate
- 团队不同人负责不同部分，需要独立发布 → 各自维护版本

**什么时候不要过度拆分：**

- 项目规模小（<5000 行代码）
- 团队只有 1-2 人
- 功能还在高速变化，边界不稳定

> 经验法则：先用单 crate 快速验证，等边界清晰、代码稳定后再迁移到 Workspace。过早拆分带来的协调成本往往大于好处。


## 关于 unsafe 的架构决策

Rust 的 `unsafe` 块允许你做编译器无法验证安全性的操作（裸指针、FFI 调用、手动内存管理等）。但 unsafe 引入的风险需要在架构层面控制好，而不是散落在代码各处。

**核心原则：把 unsafe 封装在最小边界内，对外只暴露安全接口。**

常见的做法：

- 把所有 unsafe 操作集中在一个独立的私有模块（如 `mod raw`），该模块的公开 API 全部是 safe 的
- 在不需要 unsafe 的模块顶部加 `#![forbid(unsafe_code)]`，让编译器强制保障
- 为每个 unsafe 块写注释，说明**为什么这里是安全的**（不变式是什么）

**架构中 unsafe 的合理使用场景：**

| 场景              | 说明              |
| --------------- | --------------- |
| FFI 调用 C 库      | 封装在专用的          | ffi             | 模块，对外提供 safe 包装 |
| 高性能数据结构         | 如自定义 Vec，核心 unsafe 逻辑集中，公开接口全 safe |
| 平台特定 IO         | 操作系统 syscall，封装后外部无感知 |

**应该避免的做法：**

- 在业务逻辑层散落 unsafe 块（说明抽象没有做好）
- unsafe 块没有注释说明安全前提（留下隐患，无法审计）
- 用 unsafe 绕过借用检查”图省事”（这是 bug 的温床）

> 一个好的架构应该让 unsafe 代码的范围一目了然且尽可能小。审计时只需要重点检查这些边界，不需要扫描整个代码库。


## 小结：架构自查清单

在开始写代码之前，对照下面的清单做一次快速检查：

-  是否列出了系统的所有核心职责并分组成模块？
-  是否画出了模块间的依赖图，确认没有循环依赖？
-  每个模块是否用 Trait 定义了对外接口？
-  核心逻辑是否可以不依赖具体的 IO 实现而被单独测试？
-  是否确定了 Workspace 划分策略（单 crate 或多 crate）？
-  unsafe 代码是否被封装在最小边界，每处都有安全注释？

> 不需要一次把所有问题都回答完美。架构是活的文档，随着你对问题域的理解加深，它会不断演进。重要的是养成显式思考的习惯，而不是让结构”自然生长”成一团乱麻。
# 编码流程

架构设计确定了模块边界，接下来是具体的编码工作。Rust 有一套非常适合其类型系统的编码推进顺序：**数据结构 → Trait 接口 → 函数签名 → 实现 → 重构**。

按照这个顺序写代码，可以让编译器成为你的引导者：先写类型，编译器帮你检查所有依赖这个类型的地方；再写接口，编译器帮你发现哪些实现还缺失。

## 第一步：先设计数据结构

**从数据开始，不从逻辑开始。**

在写任何函数之前，先问自己：这个功能需要表达哪些概念？这些概念用什么数据结构表示？

把核心数据结构（`struct`、`enum`）写出来，但**先不写方法**。写完后停下来想：

- 这个结构体的字段是否多余？是否有字段可以合并？
- 哪些字段只在某些状态下有意义（暗示可以用枚举状态机代替）？
- 数据的所有权关系是否清晰（拥有还是借用）？

这一步的产出物是一张**类型图**——项目里所有核心类型及其关系。把它写下来或画出来，这是最重要的设计文档。

> Rust 的类型系统是你最好的文档工具。一个命名清晰、结构合理的 enum 往往比一段注释更能准确表达领域概念。


## 第二步：定义 Trait 接口

数据结构确定之后，定义各个模块对外暴露的**能力接口**（Trait）。

这一步的核心问题是：**调用方需要我提供什么？** 不是”我能提供什么”。

写 Trait 时的几个原则：

- **方法数量保持克制**：一个 Trait 超过 5-7 个方法通常意味着职责过多
- **只暴露调用方真正需要的**：不要因为”以后可能用到”就提前加方法
- **返回类型要具体**：能返回具体类型就不要返回 `Box<dyn Trait>`，除非确实需要动态分发
- **错误类型要显式**：返回 `Result<T, MyError>` 而不是 `Result<T, Box<dyn Error>>`，让调用方知道会遇到什么错误

## 第三步：写函数签名（先不写实现）

Trait 定义好之后，先把所有关键函数的签名写完，用 `todo!()` 填充函数体。

这一步的价值在于：

- **让编译器检查整体逻辑是否自洽**——类型对不上会立刻报错
- **一眼看出哪些函数需要实现**——`todo!()` 是明确的占位符，不会被遗忘
- **接口稳定后再实现**——如果在实现到一半时发现接口设计有问题，改起来成本极高

一个常见的错误是同时修改签名和实现——这会让编译错误混成一团，难以区分是设计问题还是实现 bug。**签名通过编译后，再动实现。**

## 第四步：实现与迭代

签名稳定后开始填写函数体。这是唯一允许”写逻辑”的阶段。

**每次只实现一个函数**，实现完立刻跑相关测试（哪怕还没写所有测试）。这样可以快速获得反馈，不让错误积累。

如果实现中发现之前设计的 Trait 或数据结构有问题，**先停下来修改设计**，而不是在函数体里打补丁。补丁式代码是技术债的主要来源。

## 重构的时机

**重构不是一个单独的阶段，而是贯穿整个实现过程的持续行为。**

以下信号提示你应该重构：

| 信号              | 可能的问题           | 重构方向            |
| --------------- | --------------- | --------------- |
| 同一段逻辑出现超过两次     | 缺少抽象            | 提取函数或方法         |
| 函数超过 40 行       | 职责过多            | 拆分函数            |
| 函数参数超过 4 个      | 参数应该组成一个结构体     | 提取参数结构体         |
| match           | 语句里每个分支都做同样的事   | Trait 对象或泛型更合适  | 重构为多态           |
| 大量              | clone()         | 调用              | 所有权设计有问题        | 重新审视数据流向        |
| 测试难以编写          | 函数依赖了不必要的外部状态   | 依赖注入，传入 Trait 对象 |

> 重构的前提是有测试。没有测试的重构是在赌博——你无法知道改动有没有破坏原有行为。这正是下一个 Tab 讲的内容。


# 测试驱动开发（TDD）

TDD 是一种以测试为起点的编码方式。它不只是”先写测试再实现”，更是一种**通过测试来设计接口**的思维方式。

## 为什么先写测试

先写实现、后写测试是直觉上的顺序，但这会导致一个隐患：**测试会适应代码，而不是代码适应需求**。

你会下意识地按照已有实现的结构来组织测试，跳过边界情况，用测试为实现”背书”而不是验证需求。

先写测试时，你必须先想清楚：

- 函数的输入和输出是什么？
- 有哪些边界情况？（空输入、溢出、无效参数）
- 调用方的使用方式是什么？

这些问题的答案就是接口设计，测试是接口设计的第一个”用户”。

## Red → Green → Refactor 循环

TDD 的节奏由三个反复交替的步骤组成，每轮只前进一小步：

**第一步 Red（红灯）— 先写一个会注定失败的测试**

在写任何实现代码之前，先写一个描述”我期望它怎么工作”的测试。此时运行测试，它**必须失败**——要么因为函数还不存在（编译报错），要么因为实现还没写（断言失败）。

如果测试直接通过了，说明它没有在检测任何新行为，需要重写。

**第二步 Green（绿灯）— 写最少的代码让测试通过**

现在只有一个目标：让刚写的测试变绿。写能通过这个测试的**最简单**的实现，不要多写，不要”顺手”完善其他逻辑。

这一步强调”最少”是因为：多写的代码没有测试覆盖，等于在绕过安全网。

**第三步 Refactor（重构）— 在测试保护下整理代码**

测试通过后，回头看代码质量：有没有重复的逻辑？命名是否清晰？结构能否更简洁？放心地改，测试会立刻告诉你改坏了没有。

重构完成后，回到第一步，为下一个功能写新的测试。

---
以实现一个”计算字符串单词数”的函数为例，完整走一遍：

```
Round 1
  Red:     写测试：count_words("hello world") == 2  → 编译失败（函数不存在）
  Green:   写函数，用空格分割返回数量              → 测试通过
  Refactor: 代码简洁，暂不需要改动

Round 2
  Red:     写测试：count_words("") == 0            → 测试失败（当前实现返回 1）
  Green:   加空字符串特判                          → 测试通过
  Refactor: 发现两个测试逻辑可以合并，整理一下

Round 3
  Red:     写测试：count_words("  hi  ") == 1      → 测试失败（前后空格导致多计）
  Green:   改为先 trim 再分割                      → 测试通过
  Refactor: 提取 split_whitespace，代码更清晰
```

每一轮只前进一小步，每一步都有测试保护。最终你得到的不只是”能跑的代码”，还有一套完整描述函数行为的测试。

## 在 Rust 中实践 TDD

Rust 的测试系统与 TDD 配合得非常自然：

- `#[cfg(test)]` 模块可以测试私有函数，不需要绕过可见性
- `cargo test` 运行快，反馈及时
- 编译期检查帮你在 Red 阶段更早发现接口问题
- `todo!()` / `unimplemented!()` 让你先写签名、后填实现，正好对应 Green 阶段

推进节奏上，建议每次提交前都保持测试全绿。如果发现测试很难写，大概率是因为函数依赖了太多外部状态——这个信号应该触发重构而不是绕开测试。

一个典型的 Rust TDD 小循环：

```
1. 新建测试函数，描述"这个功能应该如何工作"
2. cargo test → 编译失败（函数不存在）
3. 写函数签名，填 todo!()
4. cargo test → 运行失败（todo! panic）
5. 实现最简版本
6. cargo test → 通过
7. 审视代码，重构
8. cargo test → 仍然通过
9. 回到第 1 步
```

## 何时用 TDD，何时不用

TDD 不是所有场景的最优解：

**适合 TDD 的场景：**

- 业务逻辑清晰，有明确的输入/输出
- 需要高可靠性的核心功能
- 修改现有代码（回归测试保障）
- 接口设计不确定时（测试驱动接口探索）

**不适合 TDD 的场景：**

- 探索性编程（先理解问题再测试）
- UI 和渲染层（难以自动化测试）
- 与外部系统集成的调试阶段
- 原型验证（先跑通再完善）

> 务实地使用 TDD：核心库和业务逻辑优先 TDD，胶水代码和配置层不必强求。比 TDD 更重要的原则是：有测试总比没测试好，测试要覆盖真实的行为，不是为了覆盖率数字。



## 编码流程测验

## TDD 测验
# Lint 基础

编译器会帮你检查代码能不能运行，而 **lint** 工具则会进一步检查代码**写得好不好**——即使编译通过，lint 也能发现潜在的 bug、低效写法或不符合惯例的代码。

Rust 内置了两层 lint 系统：编译器自带的警告，以及功能更强大的 **Clippy** 工具。

## 编译器内置 lint

Rust 编译器本身就会发出一些警告（warning），这些警告就是最基础的 lint。常见的有：

```
fn unused_function() {
    // 未被调用的函数
}

fn main() {
    let x = 5; // 声明了但没用：dead_code / unused_variables
    println!("Hello");
}
```

运行上面代码时，编译器会输出警告：

```
warning: unused variable: `x`
warning: function `unused_function` is never used
```

> 警告不会阻止编译，但应当认真对待——在成熟项目中，警告数量应尽量保持为零。


## 用属性控制 lint 级别

每条 lint 都可以设置四种级别：

| 级别              | 属性              | 效果              |
| --------------- | --------------- | --------------- |
| 允许              | #[allow(lint_name)] | 静默这条警告          |
| 警告              | #[warn(lint_name)] | 显示警告（默认）        |
| 错误              | #[deny(lint_name)] | 将警告升级为编译错误      |
| 禁止              | #[forbid(lint_name)] | 错误且不能被 allow 覆盖 |

作用范围可以是整个 crate（`#![]` 内部属性）或单个函数/结构体（`#[]` 外部属性）：

```
// 整个 crate 级别：允许未使用代码（调试时常用）
#![allow(dead_code)]
#![allow(unused_variables)]

fn helper() {}   // 不再警告

fn main() {
    let _unused = 42;  // 不再警告
    println!("ok");
}
```

```
// 将某条警告升级为错误——适合在 CI 中强制执行
#![deny(unused_must_use)]

fn main() {
    // Result 必须被处理，否则编译失败
    let result: Result<i32, &str> = Ok(1);
    let _ = result; // 需要显式处理
    println!("ok");
}
```

> 生产项目中常见的做法是在 lib.rs 或 main.rs 顶部添加 #![deny(warnings)]，把所有警告都变成错误，配合 CI 确保代码质量。


## 常见内置 lint

| Lint 名称         | 触发场景            |
| --------------- | --------------- |
| dead_code       | 定义了但从不调用的函数、结构体等 |
| unused_variables | 声明了但没有使用的变量     |
| unused_imports  | 引入了但没有用到的       | use             |
| unused_must_use | 没有处理返回          | #[must_use]     | 的值（如            | Result          | ）               |
| non_snake_case  | 变量/函数不符合 snake_case 命名规范 |
| non_camel_case_types | 类型名不符合 CamelCase 规范 |

> 用 _ 前缀可以抑制单个变量的 unused_variables 警告：let _temp = foo();


# Clippy

## 什么是 Clippy

`cargo clippy` 是 Rust 官方的 lint 工具，内置 **700+ 条规则**，远超编译器自带的警告。它能发现：

- 可以简化的代码
- 常见的性能陷阱
- 容易引发 bug 的写法
- 不符合 Rust 惯例的模式

安装（随 rustup 自动安装，通常已有）：

```
rustup component add clippy
```

运行：

```
cargo clippy           # 检查当前项目
cargo clippy -- -D warnings  # 将所有 clippy 警告升级为错误（CI 推荐）
```

## Clippy 的 lint 分类

Clippy 把规则分成以下几个类别：

| 分类              | 说明              | 默认状态            |
| --------------- | --------------- | --------------- |
| correctness     | 几乎肯定是 bug       | 错误              | （deny）          |
| suspicious      | 很可能是 bug 或误用    | 警告              |
| style           | 不符合 Rust 惯用写法   | 警告              |
| complexity      | 可以简化的复杂写法       | 警告              |
| perf            | 有更高效的替代写法       | 警告              |
| pedantic        | 更严格的风格检查        | 默认关闭            |
| nursery         | 实验性规则           | 默认关闭            |
| restriction     | 特定场景的限制性规则      | 默认关闭            |

## 典型 Clippy 警告示例

```
fn main() {
    // clippy::len_zero：应该用 .is_empty() 代替 .len() == 0
    let v: Vec<i32> = vec![];
    if v.len() == 0 {
        println!("空");
    }

    // clippy::needless_return：不必要的 return
    // clippy 会建议去掉 return

    // clippy::map_unwrap_or：可以用 map_or 替代 .map().unwrap_or()
    let opt: Option<i32> = Some(5);
    let _x = opt.map(|v| v * 2).unwrap_or(0);
    // clippy 建议：opt.map_or(0, |v| v * 2)
}
```

## 针对 Clippy 的属性控制

和内置 lint 一样，可以用属性静默特定 Clippy 规则：

```
// 允许整个文件使用某些 clippy 规则
#![allow(clippy::needless_return)]

fn get_value() -> i32 {
    return 42; // clippy 本来会警告这里，现在被静默
}

fn main() {
    // 只允许这一行的特定 clippy 规则
    #[allow(clippy::len_zero)]
    let check = vec![1, 2].len() == 0;
    println!("{}", check);
}
```

> 静默 lint 应该是例外而不是常规操作。遇到 Clippy 警告时，首先思考能否按建议修改，确实有充分理由才 #[allow]。


## 常用 Clippy 规则速查

| 规则              | 建议              |
| --------------- | --------------- |
| clippy::len_zero | 用               | .is_empty()     | 替代              | .len() == 0     |
| clippy::needless_return | 去掉多余的           | return          |
| clippy::clone_on_copy | Copy            | 类型不需要           | .clone()        |
| clippy::unwrap_used | 避免直接            | .unwrap()       | ，处理错误           |
| clippy::map_unwrap_or | 用               | .map_or()       | 替代              | .map().unwrap_or() |
| clippy::redundant_clone | 不必要的            | .clone()        |
| clippy::dbg_macro | 发布前移除           | dbg!()          | 调用              |
| clippy::todo    | 提醒              | todo!()         | 未完成的代码          |

# rustfmt

`rustfmt` 是 Rust 官方的代码格式化工具。它和 Clippy 解决的是不同层面的问题：Clippy 关注**代码逻辑和最佳实践**，rustfmt 关注**代码排版外观**——缩进、空格、换行、括号位置等。

两者的配合：先用 rustfmt 统一格式，消除格式噪音；再用 Clippy 关注实质性的逻辑问题。

## 什么是 rustfmt

rustfmt 按照 Rust 社区约定的风格重新排版代码，消除团队内部的格式争论（“括号要不要换行？""缩进用 2 还是 4 个空格？”）。

安装（随 rustup 自动安装）：

```
rustup component add rustfmt
```

运行：

```
cargo fmt           # 格式化整个项目（直接修改文件）
cargo fmt --check   # 只检查，不修改（CI 中使用）
```

`cargo fmt --check` 在文件格式不符合规范时以非零退出码退出，适合放入 CI 流水线，强制所有提交都经过格式检查。

## rustfmt.toml 配置

在项目根目录创建 `rustfmt.toml`（或 `.rustfmt.toml`）可以自定义格式规则。大多数项目使用默认规则即可，常见的调整有：

```
# rustfmt.toml
edition = "2021"          # Rust 版本（影响部分格式规则）
max_width = 100           # 最大行宽（默认 100）
use_small_heuristics = "Max"  # 尽量把短表达式放在同一行
imports_granularity = "Crate" # 将同一 crate 的 use 合并
group_imports = "StdExternalCrate"  # use 分组：std / 外部 / 本地
```

> 团队项目的建议：把 rustfmt.toml 提交进版本库，保证所有人使用相同的格式规则。同时在 CI 中加上 cargo fmt --check，不符合格式的 PR 无法通过。


## 在 CI 中强制格式检查

格式化的最大价值在于**自动化强制**——不依赖每个人手动运行，而是让 CI 帮你把关。典型的 CI 格式检查步骤：

```
cargo fmt --check          # 检查格式（不修改文件）
cargo clippy -- -D warnings  # 检查 lint（警告视为错误）
```

当开发者忘记格式化时，CI 会失败，提示其本地运行 `cargo fmt` 后重新提交。

## 与编辑器集成

rustfmt 最常见的使用方式不是手动运行，而是**保存时自动格式化**：

- **VS Code**：安装 rust-analyzer 后，在设置中开启 `editor.formatOnSave = true`，并将 Rust 文件的默认格式化器设为 rust-analyzer
- **其他编辑器**：大多数主流编辑器（Vim、Emacs、IntelliJ）都有对应的 Rust 插件支持保存时格式化

保存时自动格式化后，你几乎不需要再思考格式问题——代码永远保持规范，`cargo fmt --check` 在 CI 中也永远通过。


## Lint 级别

## 前缀 _ 的作用

## cargo clippy 与 cargo build 的区别

## #[forbid] 与 #[deny] 的区别

## rustfmt 使用
# 持续集成

手动运行测试、lint 和格式检查是不可靠的——人会忘记，也会心存侥幸跳过。**持续集成（CI）** 把这些检查自动化：每次代码推送或 PR 时，CI 自动运行所有检查，不通过就不允许合并。

## 为什么需要 CI

没有 CI 的团队通常会遇到以下问题：

- “在我本地是好的”——不同开发者的本地环境不一致
- 测试很久没运行，积累了大量回归 bug
- 合并 PR 后才发现格式/lint 问题，来回修改浪费时间
- 无法知道某次提交是否引入了新的安全漏洞

CI 的核心价值是：**让质量检查成为流程的一部分，而不是个人习惯**。每次提交都是对代码的一次”体检”，结果透明、客观、可追溯。

## GitHub Actions 基本结构

GitHub Actions 通过在仓库中创建 `.github/workflows/` 目录下的 YAML 文件来定义 CI 流程。一个最简单的 Rust CI 文件：

```
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 安装 Rust 工具链
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - name: 格式检查
        run: cargo fmt --check

      - name: Clippy（警告视为错误）
        run: cargo clippy -- -D warnings

      - name: 运行测试
        run: cargo test
```

**关键字段说明：**

| 字段              | 说明              |
| --------------- | --------------- |
| on.push / pull_request | 触发时机：推送到 main 或提 PR 时触发 |
| runs-on         | 运行环境，           | ubuntu-latest   | 是最常用的           |
| actions/checkout@v4 | 拉取仓库代码          |
| dtolnay/rust-toolchain@stable | 安装指定版本的 Rust 工具链 |
| components      | 需要额外安装的组件（rustfmt、clippy 默认不包含） |

## 标准 Rust CI 流水线

一个完整的 Rust 项目 CI 流水线通常包含以下步骤，**按此顺序排列**（越快越前，尽早发现问题）：

```
① cargo fmt --check              # 最快，几秒，格式问题立刻暴露
② cargo clippy -- -D warnings    # 较快，静态分析
③ cargo test                     # 慢，运行所有测试
④ cargo audit                    # 较快，安全审计（见下一个 Tab）
⑤ cargo build --release          # 中等，验证 release 编译
```

**多平台测试**（可选，对库项目重要）：

```
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
runs-on: ${{ matrix.os }}
```

## 缓存依赖加速构建

默认情况下，CI 每次都会重新下载并编译所有依赖，非常慢。使用缓存可以将大多数 CI 运行时间从几分钟压缩到几十秒：

```
- name: 缓存 Cargo 依赖
  uses: Swatinem/rust-cache@v2
```

`Swatinem/rust-cache` 是社区最常用的 Rust 缓存 Action，它会自动缓存：

- `~/.cargo/registry`（下载的 crate 源码）
- `~/.cargo/git`（git 依赖）
- `target/` 目录中的编译产物

> 第一次运行会建立缓存（慢），之后的运行只要依赖没变化就会命中缓存（快）。


# 依赖管理与安全

选择和管理依赖是工程决策，不只是”加一行 Cargo.toml”那么简单。错误的依赖选择会带来性能问题、安全漏洞、维护负担，甚至许可证冲突。

## 选择依赖的原则

在 crates.io 上搜索一个功能往往能找到几十个 crate。如何判断哪个值得用？

**检查清单：**

| 维度              | 看什么             |
| --------------- | --------------- |
| 活跃度             | 最近的提交时间、issue 响应速度、版本更新频率 |
| 下载量             | 周下载量是社区采用度的直接指标 |
| 文档质量            | docs.rs 上的文档是否完整、示例是否清晰 |
| 依赖树             | cargo tree      | 查看会引入多少间接依赖     |
| 许可证             | MIT/Apache-2.0 最宽松；GPL 有传染性，商业项目需谨慎 |
| 维护者             | 个人项目 vs 组织/公司维护，后者通常更稳定 |

> 最少依赖原则：能用标准库解决的，不引入第三方 crate。依赖越少，安全面越小，编译越快，出问题的点越少。


## 版本策略与 Cargo.lock

**语义化版本（SemVer）**：

Cargo 使用 `major.minor.patch` 版本号：

- `major` 变更：破坏性改动（API 不兼容）
- `minor` 变更：新增功能（向后兼容）
- `patch` 变更：bug 修复（向后兼容）

**版本约束语法：**

| 写法              | 含义              |
| --------------- | --------------- |
| "1.2.3"         | 精确版本（实际等同于      | ^1.2.3          | ）               |
| "^1.2.3"        | 允许              | 1.2.3           | 到               | <2.0.0          | （推荐，兼容更新）       |
| "~1.2.3"        | 允许              | 1.2.3           | 到               | <1.3.0          | （只接受 patch 更新）  |
| ">=1.2, <2"     | 明确范围            |

**Cargo.lock 的作用：**

- **应用程序**（binary crate）：**提交 Cargo.lock**，锁定精确版本，保证所有人和 CI 使用完全相同的依赖，可复现构建
- **库**（library crate）：**不提交 Cargo.lock**，让使用者根据自己的依赖树解析版本，避免版本冲突

## cargo audit 安全审计

依赖库可能存在已知的安全漏洞。`cargo audit` 检查你的依赖树，与 [RustSec Advisory Database](https://rustsec.org/) 对比，报告存在漏洞的 crate。

安装：

```
cargo install cargo-audit
```

运行：

```
cargo audit
```

输出示例（发现漏洞时）：

```
error[RUSTSEC-2021-0073]: Potential segfault in `HeaderMap::Drain`
  --> Cargo.lock:37:1
   |
37 | http 0.2.4
   |
   = ID: RUSTSEC-2021-0073
   = Date: 2021-08-01
   = URL: https://rustsec.org/advisories/RUSTSEC-2021-0073
   = Severity: medium
```

**发现漏洞后的处理流程：**

- **升级依赖**：`cargo update` 尝试升级到修复版本
- **查看 Advisory 详情**：了解漏洞是否影响你的使用场景
- **评估影响**：如果无法立即升级（有破坏性改动），评估漏洞在你的使用方式下是否可被触发
- **标记豁免**（临时）：如果确认不影响，可在 `audit.toml` 中临时豁免，并注明理由和计划升级日期

## 在 CI 中集成安全审计

把 `cargo audit` 加入 CI 流水线，让安全检查自动化：

```
- name: 安全审计
  run: |
    cargo install cargo-audit --quiet
    cargo audit
```

或者使用 GitHub Action 版本（不需要安装步骤，更快）：

```
- name: 安全审计
  uses: rustsec/audit-check@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
```

> 建议频率：除了每次 PR 检查，还应该定期（如每周）对 main 分支运行一次审计，因为新漏洞会持续被发现，即使代码没有变化。


## cargo geiger：扫描 unsafe 使用量

`cargo geiger` 统计项目及所有依赖中 `unsafe` 代码的数量，帮你了解整个依赖树的 unsafe 暴露面。

安装与运行：

```
cargo install cargo-geiger
cargo geiger
```

输出示例（每行显示一个 crate 的 unsafe 统计）：

```
Functions  Expressions  Impls  Traits  Methods  Dependency
0/0        0/0          0/0    0/0     0/0      my-app 0.1.0
0/0        2/2          0/0    0/0     0/0      serde 1.0.x
1/12       30/30        0/0    0/0     5/5      libc 0.2.x
```

格式为 `已审计数/总数`。数字为 0/0 表示该 crate 完全没有 unsafe 代码。

**在 CI 中的用途**：与其强制在每次 PR 时运行（输出量大），不如在**引入新依赖时**手动跑一次，对比前后的报告，确认新依赖没有带入意外的大量 unsafe 代码。


## CI 配置测验

## 安全审计测验
# 基准测试

“这段代码应该更快”——在没有测量之前，这只是猜测。性能优化必须从**测量**开始，测量要有**可比较的基准**。基准测试（Benchmark）就是对代码性能建立可复现、可量化的测量标准。

## 先测量再优化

**过早优化是万恶之源。**（Donald Knuth）

在没有性能数据之前动手优化，有两个常见后果：

- **优化了不重要的地方**：花了一天把某个函数优化了 30%，但那个函数只占总运行时间的 0.1%
- **让代码变复杂**：为了性能牺牲了可读性，结果实际收益几乎为零

正确的流程：

```
① 确认有性能问题（用户反馈、监控数据）
② 测量（profiling），找出真正的热点（通常 80% 的时间在 20% 的代码）
③ 对热点建立基准测试
④ 优化热点
⑤ 重新运行基准测试，确认优化有效
⑥ 运行功能测试，确认没有引入 bug
```

> Rust 的编译器优化（特别是 release 模式）本身就很强。很多”手动优化”在 release 模式下实际上没有效果，因为编译器已经做了。永远在 --release 模式下测量性能。


## cargo bench 与 criterion

Rust 标准库内置了 `#[bench]` 属性（nightly only），但生产中更常用 **criterion** 这个第三方 benchmark 框架，它提供：

- 统计上更可靠的测量（多次采样，过滤噪音）
- 自动检测性能退化（与上次运行对比）
- HTML 报告，包含可视化图表
- 稳定版 Rust 即可使用

**在项目中添加 criterion：**

```
# Cargo.toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "my_benchmark"
harness = false
```

**基准测试文件结构（**`benches/my_benchmark.rs`**）：**

```
fn bench_fibonacci(c: &mut Criterion) {
    // c.bench_function 注册一个基准测试
    c.bench_function("fibonacci 20", |b| {
        // b.iter 是实际测量的循环
        b.iter(|| fibonacci(black_box(20)))
        //                   ^^^^^^^^^ black_box 防止编译器优化掉被测代码
    });
}
```

use criterion::{black_box, criterion_group, criterion_main, Criterion};
fn fibonacci(n: u64) -> u64 {
    match n {
        0 => 1,
        1 => 1,
        n => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
fn bench_fibonacci(c: &mut Criterion) {
    // c.bench_function 注册一个基准测试
    c.bench_function("fibonacci 20", |b| {
        // b.iter 是实际测量的循环
        b.iter(|| fibonacci(black_box(20)))
        //                   ^^^^^^^^^ black_box 防止编译器优化掉被测代码
    });
}
criterion_group!(benches, bench_fibonacci);
criterion_main!(benches);
**运行基准测试：**

```
cargo bench                          # 运行所有基准测试
cargo bench -- fibonacci             # 只运行名称包含 "fibonacci" 的测试
cargo bench -- --save-baseline main  # 保存当前结果为基准线
cargo bench -- --baseline main       # 与之前保存的基准线对比
```

## 设计有意义的 benchmark

基准测试写错了会给出误导性的数据，有几个常见陷阱：

**陷阱一：让编译器优化掉被测代码**

如果被测函数的结果没有被使用，编译器可能直接删掉整个计算。使用 `black_box()` 告诉编译器”这个值我会用，不要优化掉”。

**陷阱二：测量了初始化时间**

如果被测代码需要初始化（比如创建大型数据结构），应该把初始化放在 `iter` 循环外：

```
fn bench_sort(c: &mut Criterion) {
    // 初始化放在 iter 外
    let data: Vec<i32> = (0..1000).rev().collect();

    c.bench_function("sort 1000 elements", |b| {
        b.iter(|| {
            let mut v = data.clone(); // clone 是被测成本的一部分（如果你想）
            v.sort();
            black_box(v)
        })
    });
}
```

use criterion::{black_box, Criterion};
fn bench_sort(c: &mut Criterion) {
    // 初始化放在 iter 外
    let data: Vec<i32> = (0..1000).rev().collect();

    c.bench_function("sort 1000 elements", |b| {
        b.iter(|| {
            let mut v = data.clone(); // clone 是被测成本的一部分（如果你想）
            v.sort();
            black_box(v)
        })
    });
}
**陷阱三：数据量太小**

如果被测操作本身只需要几纳秒，测量误差会淹没真实结果。选择有代表性的数据量（通常与生产环境接近）。

# 性能分析

基准测试告诉你”代码快了还是慢了”，但不告诉你”慢在哪里”。**性能分析（Profiling）** 工具可以记录程序运行时每个函数花了多少时间，帮你定位热点。

## perf 与 flamegraph

**perf**（Linux）是最常用的性能采样工具，它以固定频率对程序进行快照，记录当时正在执行的函数。**flamegraph** 把 perf 的采样结果可视化成一张火焰图，让热点一目了然。

**基本工作流（Linux）：**

```
# 1. 编译 release 版本并保留调试符号
cargo build --release
# 在 Cargo.toml 中添加：
# [profile.release]
# debug = true

# 2. 用 perf 采样运行
perf record -g ./target/release/my_app

# 3. 生成火焰图
perf script | stackcollapse-perf | flamegraph > flamegraph.svg

# 或者用 cargo-flamegraph（封装了上述步骤）
cargo install flamegraph
cargo flamegraph --bin my_app
```

**在 macOS 上：** 使用 Instruments（Xcode 自带）或 `cargo-instruments`：

```
cargo install cargo-instruments
cargo instruments -t time --bin my_app
```

## 读懂火焰图

火焰图的阅读方式：

```
┌──────────────────────────────────────────────────┐
│                  main                            │  ← 最底层：程序入口
├──────────────┬───────────────────────────────────┤
│  parse_config│        process_data               │  ← 调用的函数
├──────────────┴──────────┬────────────────────────┤
│                         │   sort_records         │  ← 热点！宽度大 = 时间多
│                         ├────────────────────────┤
│                         │   HashMap::insert      │
└─────────────────────────┴────────────────────────┘
  横轴 = 时间占比（越宽 = 占用时间越多）
  纵轴 = 调用栈深度（越高 = 调用层数越深）
```

**关键原则：**

- 找**最宽的”平顶”函数**——这是热点，花了最多时间，没有继续向下调用
- 不要被调用栈深的函数迷惑——高度只代表调用层数，不代表时间多

## 定位热点的工作流

```
① 确认性能问题确实存在（用基准测试或生产监控数据）
    ↓
② 用 flamegraph 找出最宽的热点函数
    ↓
③ 分析热点函数：是算法复杂度问题、内存分配问题还是 IO 等待？
    ↓
④ 针对性优化：
   - 算法问题 → 换数据结构或算法
   - 内存分配过多 → 预分配、复用 buffer、避免不必要 clone
   - IO 等待 → 异步/并发、批处理、缓存
    ↓
⑤ 重新运行基准测试，量化改善幅度
    ↓
⑥ 检查功能测试，确认没有引入 bug
    ↓
⑦ 如果改善不够，回到②
```

## 常见性能瓶颈模式

Rust 程序中反复出现的性能问题：

| 模式              | 表现              | 解决思路            |
| --------------- | --------------- | --------------- |
| 频繁小内存分配         | 火焰图中大量          | alloc           | /               | malloc          | 预分配             | Vec::with_capacity | ；使用 arena 分配器   |
| 不必要的 clone      | 数据被复制多次         | 检查所有权，能借用就不克隆   |
| 低效的字符串处理        | 大量              | String          | 拼接              | 用               | write!          | 到 buffer；或      | join            |
| HashMap 哈希函数慢   | 大量 HashMap 操作占用时间 | 换用              | FxHashMap       | /               | AHashMap        | 等更快的哈希实现        |
| 迭代器中的条件分支       | 循环内有大量 if/match | 尝试提取不变条件到循环外；SIMD 优化 |
| 同步 IO 阻塞        | 线程长时间等待 IO      | 换用异步 IO（tokio/async-std） |

> 性能优化的黄金法则：优化之后，测量必须能证明改善。如果改善不显著，回滚——复杂的代码是维护成本，不应该为不明显的收益付出这个代价。



## 基准测试测验

## Profiling 测验