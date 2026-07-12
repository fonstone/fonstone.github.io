---
title: "错误处理"
description: "panic! 宏、Result 类型、? 运算符、多种错误类型处理、何时该 panic"
date: "2026-07-12"
order: 7
tags: ["错误处理", "panic", "Result", "错误传播"]
est_time: "60 分钟"
---

不同于许多语言依赖异常（exception）机制，Rust 把错误分成两类：**不可恢复错误**（用 `panic!`）和**可恢复错误**（用 `Result<T, E>`）。这种区分让调用者清楚知道一个函数”可能失败”，并强制处理失败情况——错误处理从”猜测”变成了”明确”。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 何时触发 panic，如何读懂 panic 输出与 backtrace |                 |
| 可恢复错误的表达方式，     | unwrap          | 、               | expect          | 与模式匹配处理         |
| 错误传播的语法糖，以及背后的  | From            | 转换机制            |
| 两种错误处理方式的决策框架，用类型编码不变量的思路 |                 |
| Box<dyn Error>  | 处理多类错误，遍历集合时的错误处理策略 |
# 错误的两种类型

所有程序都会遇到错误——文件不存在、用户输入了非法数据、网络连接超时。Rust 把这些情况分成截然不同的两类，并用不同的机制分别处理：

![error](/images/rust/error.svg)
-
**不可恢复的错误（unrecoverable errors）**：程序遭遇了”不应该发生”的状态，继续运行会带来更大的风险。最典型的例子是代码中的 bug——访问了数组越界位置、违反了程序的核心不变量。这类情况的正确处理是**立即停止程序**。

-
**可恢复的错误（recoverable errors）**：错误在预期范围内，程序可以做出响应并继续。文件不存在 → 提示用户或创建文件；格式解析失败 → 报告给调用者处理。这类错误用 `Result<T, E>` 来处理，下一篇会详细讲解。


本文聚焦第一类：**不可恢复的错误**和 `panic!` 宏。

## 使用 panic! 宏

`panic!` 宏用于”程序无法继续执行”的情况，调用后它会：

- 打印一条错误信息
- 清理调用栈（默认行为，称为”展开”）
- 退出程序

```
fn main() {
    panic!("发生了不可恢复的错误！");
}
```

运行后会看到类似这样的输出：

```
thread 'main' panicked at '发生了不可恢复的错误！', src/main.rs:2:5
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

第一行告诉你：在哪个文件的哪一行触发了 panic，以及消息内容。第二行提示可以用 `RUST_BACKTRACE=1` 查看完整调用链。

## 自动触发的 panic

很多时候 panic 不是手动调用的，而是 Rust 内部检测到非法操作时**自动触发**的。最常见的例子是访问越界索引：

```
fn main() {
    let v = vec![1, 2, 3];
    println!("{}", v[99]);  // 只有 3 个元素，index 99 不存在
}
```

Rust 会 panic 并提示：

```
thread 'main' panicked at 'index out of bounds: the len is 3 but the index is 99'
```

**为什么 Rust 选择 panic 而不是返回垃圾值？** 这是有意识的安全设计。C 语言中，越界访问会直接读取那块内存里碰巧在那儿的数据，这叫**缓冲区溢出（buffer overread）**，是大量安全漏洞的根源。Rust 宁可程序立即崩溃，也不允许读取不属于该数组的内存。

## 用 backtrace 定位问题

当 panic 发生在标准库内部时，错误信息指向的是标准库的源码，不是你的代码。这时候 **backtrace（调用链追踪）** 很有用。

设置环境变量 `RUST_BACKTRACE=1` 再运行，可以看到从程序入口到 panic 点的完整调用链：

```
RUST_BACKTRACE=1 cargo run
```

输出中每一行是一个**栈帧**（函数调用记录）。读 backtrace 的关键是**从上往下找第一个写着你自己文件名的行**——那就是问题的发源地。

对于上面的越界例子，backtrace 里会有一行类似：

```
12: panic_example::main
         at src/main.rs:3
```

这告诉你：问题在 `src/main.rs` 的第 3 行，也就是 `v[99]` 那里。

> 注意：backtrace 需要程序以 debug 模式编译（不加 --release）。Release 模式下可能缺少调试符号，输出不够完整。


## 展开与终止：panic 的两种行为

panic 触发后，Rust 默认的行为是**展开（unwinding）**：顺着调用栈往回走，逐个清理各函数的数据（调用析构函数、释放内存）。这保证资源正确释放，但有一定开销。

如果你追求更小的二进制文件，可以改为**终止（abort）**：直接退出进程，让操作系统回收内存。在 `Cargo.toml` 里配置：

```
[profile.release]
panic = 'abort'
```

这样 release 模式下 panic 时会直接终止，不展开调用栈。

> 对于大多数应用来说，默认的展开行为就够用了。panic = 'abort' 主要用在两种场景：一是对二进制体积极度敏感的项目；二是嵌入式开发（no_std 环境），那里没有操作系统支持，调用栈展开的实现方式与具体芯片架构强绑定（ARM、RISC-V 等各不相同），通常直接 abort 更可靠。嵌入式场景还需要用 #[panic_handler] 自定义 panic 发生时的行为（比如让指示灯闪烁或复位芯片），但这属于嵌入式开发的专题内容。


# 练习题

## panic 基础测验

```
fn main() {
    let v = vec![1, 2, 3];
    let x = v[5];
    println!("{}", x);
}
```
# Result<T, E>

## 为什么需要 Result

上一篇讲了 `panic!`，用于”不应该发生”的错误。但现实中大多数错误都是**可以预料的、可以处理的**：

- 尝试打开一个文件 → 文件可能不存在
- 尝试解析一个字符串为数字 → 字符串可能不是合法的数字
- 发起网络请求 → 服务器可能临时不可用

这些情况不是 bug，是正常的程序运行中随时可能发生的事情。对这类错误调用 `panic!` 并让程序崩溃，显然不合适。

Rust 的解决方案是 `Result<T, E>`** 枚举**：让可能失败的函数在返回值里**明确表达”成功”或”失败”**，让调用者决定如何处理。

## Result 是什么

你之前学过 `Option<T>`——它表达”值可能不存在”：

```
enum Option<T> {
    Some(T),  // 有值
    None,     // 没有值
}
```

`Result<T, E>` 是类似的概念，但表达的是”操作可能失败”：

```
enum Result<T, E> {
    Ok(T),   // 成功，携带结果值
    Err(E),  // 失败，携带错误信息
}
```

`T` 是成功时的值的类型，`E` 是失败时的错误类型。比如 `File::open` 的返回类型是 `Result<File, io::Error>`——成功返回文件句柄，失败返回 IO 错误。

> 如何知道一个函数返回什么类型？ 看文档，或者直接问编译器。把返回值赋给一个错误类型的变量，编译器会在报错信息里告诉你正确的类型。


## 用 match 处理 Result

`Result` 和 `Option` 一样，需要用 `match` 明确处理两种情况。下面是打开文件的例子：

```
use std::fs::File;

fn main() {
    let result = File::open("hello.txt");

    match result {
        Ok(file) => {
            println!("文件打开成功！句柄：{:?}", file);
        }
        Err(error) => {
            println!("打开文件失败，原因：{}", error);
            // 这里可以做恢复处理，比如创建文件、使用默认值、提示用户等
        }
    }
}
```

这里 `File::open("hello.txt")` 返回 `Result<File, io::Error>`。`match` 分别处理了 `Ok` 和 `Err` 两种情况——失败时打印错误信息并继续，而不是让程序崩溃。

### 匹配不同类型的错误

有时候同一个操作可能因为不同原因失败，我们想对不同原因做不同处理。`io::Error` 有一个 `kind()` 方法可以获取错误类型：

```
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let f = File::open("hello.txt");

    let file = match f {
        Ok(file) => file,
        Err(error) => match error.kind() {
            // 文件不存在 → 创建它
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(new_file) => {
                    println!("文件不存在，已创建新文件");
                    new_file
                }
                Err(e) => panic!("创建文件失败：{:?}", e),
            },
            // 其他错误 → 直接 panic
            other => panic!("打开文件时遇到其他错误：{:?}", other),
        },
    };

    println!("得到了文件句柄：{:?}", file);
}
```

这里有三层 `match` 嵌套。虽然完整，但看起来有点繁重。

## unwrap 和 expect：快捷但有代价

`Result` 有两个便捷方法，让你不用每次都写 `match`：

`unwrap()`：如果是 `Ok`，返回值；如果是 `Err`，直接 panic。

```
use std::fs::File;

fn main() {
    // 如果文件不存在，这里会 panic
    let f = File::open("hello.txt").unwrap();
    println!("文件句柄：{:?}", f);
}
```

`expect("消息")`：和 `unwrap` 一样，但 panic 时显示你提供的消息，更容易调试：

```
use std::fs::File;

fn main() {
    let f = File::open("hello.txt")
        .expect("无法打开 hello.txt，请检查文件是否存在");
    println!("文件句柄：{:?}", f);
}
```

**什么时候用 unwrap/expect？**

- **适合用**：写原型、写示例、写测试代码时。此时你更关心逻辑本身，不想被错误处理分散注意力。
- **不适合用**：生产代码中，尤其是有可能失败的操作。一旦失败就 panic，用户体验很差。

> 记住：unwrap 和 expect 本质上是”我相信这里不会失败，如果失败就让程序崩溃”的声明。在代码审查中，看到 unwrap 就意味着这里需要审查：这个假设是否成立？


## 向调用者传播错误

到目前为止，我们要么用 `match` 处理错误，要么调 `panic!` 崩溃。但有第三种选择：**把错误向上传播给调用者**。

当前函数没有足够的上下文来决定怎么处理错误时，这很合理——调用者可能比被调用者更清楚应该怎么处理。

下面是一个从文件读取用户名的函数，把错误传播给调用者：

```
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username() -> Result<String, io::Error> {
    let f = File::open("username.txt");

    let mut file = match f {
        Ok(file) => file,
        Err(e) => return Err(e),  // 打开失败 → 立即返回 Err
    };

    let mut name = String::new();

    match file.read_to_string(&mut name) {
        Ok(_) => Ok(name),    // 读取成功 → 返回 Ok(内容)
        Err(e) => Err(e),     // 读取失败 → 返回 Err
    }
}

fn main() {
    match read_username() {
        Ok(name) => println!("用户名：{}", name),
        Err(e) => println!("读取失败：{}", e),
    }
}
```

注意函数返回值类型 `Result<String, io::Error>`——函数**承诺**调用者：要么给你一个 `String`，要么给你一个 `io::Error`，你来决定怎么处理。

这段代码有点冗长：每个可能失败的操作都要写一遍 `match` 加 `return Err`。当一个函数里有多个可能失败的操作时，就会有很多这样的样板代码。

Rust 为此提供了一个更简洁的语法：`?` 运算符。下一篇文章会详细讲它。


## Result 基础测验

```
use std::num::ParseIntError;

fn parse_age(s: &str) -> Result<u32, ParseIntError> {
    let n: i32 = s.parse()?;
    if n < 0 {
        panic!("年龄不能为负数");
    }
    Ok(n as u32)
}
```

```
fn get_value() -> i32 {
    let result: Result<i32, String> = Ok(42);
    result
}
```

## 编程练习

下面这个函数直接用 `unwrap` 处理所有错误。请用 `match` 改写，使其：

- 解析成功时打印结果
- 解析失败时打印”输入不是合法数字：<原因>“，**不要让程序崩溃**

```
fn main() {
    let inputs = vec!["42", "hello", "100", "world"];

    for s in inputs {
        let n: i32 = s.parse().unwrap();  // 遇到 "hello" 会崩溃
        println!("{} 解析为 {}", s, n);
    }
}
```
# ? 运算符

## 问题：传播错误太繁琐

上一篇末尾，我们写了一个从文件读取用户名的函数：

```
fn read_username() -> Result<String, io::Error> {
    let f = File::open("username.txt");

    let mut file = match f {
        Ok(file) => file,
        Err(e) => return Err(e),  // 打开失败 → 立即返回 Err
    };

    let mut name = String::new();

    match file.read_to_string(&mut name) {
        Ok(_) => Ok(name),
        Err(e) => Err(e),
    }
}
```

函数里每个可能失败的操作都要写一遍 `match ... return Err(e)`。当一个函数里有三四个这样的操作时，代码会充斥着重复的样板。

`?` 运算符就是为了解决这个问题而生的。

## ? 的作用

在一个返回 `Result` 的表达式后面加 `?`，效果等价于：

- 如果是 `Ok(value)` → 解出 `value`，继续执行
- 如果是 `Err(e)` → **立即从当前函数返回 **`Err(e)`

用 `?` 改写上面的函数：

```
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username() -> Result<String, io::Error> {
    let mut file = File::open("username.txt")?;  // 失败就立刻返回 Err
    let mut name = String::new();
    file.read_to_string(&mut name)?;             // 失败就立刻返回 Err
    Ok(name)
}

fn main() {
    match read_username() {
        Ok(name) => println!("用户名：{}", name),
        Err(e)   => println!("读取失败：{}", e),
    }
}
```

对比前一个版本，代码量减少了一半，逻辑却更清晰——每行代码在说”做这件事，失败就停下来”。

还可以进一步用**链式调用**写得更短：

```
use std::io;
use std::io::Read;
use std::fs::File;

fn read_username() -> Result<String, io::Error> {
    let mut name = String::new();
    File::open("username.txt")?.read_to_string(&mut name)?;
    Ok(name)
}

fn main() {
    match read_username() {
        Ok(name) => println!("用户名：{}", name),
        Err(e)   => println!("读取失败：{}", e),
    }
}
```

## ? 背后的自动类型转换

`?` 和手写 `match ... return Err(e)` 有一点细微差别：`?`** 会在返回错误之前自动做类型转换**。

具体来说，`?` 内部会调用标准库的 `From` trait（`From::from(e)`），把当前错误转换成函数声明的返回错误类型。只要两种错误类型之间实现了 `From` 转换关系，`?` 就会自动完成，不需要手动处理。

> From trait 暂时了解即可：From 是 Rust 的标准类型转换 trait，后面讲 trait 时会详细介绍。这里只需要知道：? 不仅仅是提早返回，它还帮你做了错误类型的自动转换。


## ? 也能用于 Option

`?` 不只能用于 `Result`，也可以用于 `Option<T>`：

- `Some(value)` → 解出 `value`，继续执行
- `None` → 立即从当前函数返回 `None`

```
fn first_char(s: &str) -> Option<char> {
    let first = s.chars().next()?;  // 如果字符串为空，立刻返回 None
    Some(first)
}

fn main() {
    println!("{:?}", first_char("hello"));  // Some('h')
    println!("{:?}", first_char(""));       // None
}
```

> 注意：? 用于 Option 时，函数返回类型必须是 Option；? 用于 Result 时，函数返回类型必须是 Result。两者不能混用。


## ? 的使用限制：函数返回类型

`?` 只能在返回 `Result` 或 `Option` 的函数中使用。如果在 `main` 函数里直接用 `?`（`main` 默认返回 `()`），会编译报错：

```
use std::fs::File;

fn main() {
    let f = File::open("hello.txt")?;  // 错误：main 返回 ()，不是 Result
}
```

编译器会说：`?` 只能在返回 `Result` 或 `Option` 的函数里使用。

**解决方法**：让 `main` 返回 `Result`。

```
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let f = File::open("hello.txt")?;
    println!("文件打开成功：{:?}", f);
    Ok(())
}
```

`Box<dyn Error>` 是一个能装下**任意错误类型**的容器（详细原理在 trait 章节讲解），让 `main` 函数可以方便地使用 `?` 来处理各种错误。

> 程序退出码：当 main 返回 Ok(()) 时，程序退出码是 0（成功）；返回 Err 时，Rust 会打印错误信息并以非零退出码退出。


### 在文档测试中使用 ?

上一章讲文档注释时提到，文档代码块默认没有 `main()` 函数，也没有返回类型，不能直接用 `?`。

**为什么不能用？** `?` 需要当前函数返回 `Result` 或 `Option`，而文档测试的代码块隐式地跑在一个返回 `()` 的匿名函数里，就像这样：

```
// 文档测试实际上被包成这样：
fn doctest_wrapper() {
    let n: i32 = "42".parse()?;  // ❌ 编译错误：() 不支持 ?
    assert_eq!(n, 42);
}
```

**解决办法**：用 `#` 隐藏行，手动包裹一个返回 `Result` 的函数，让 `?` 有合法的上下文：

```
/// # Examples
///
/// ```rust
/// # use std::error::Error;
/// # fn run() -> Result<(), Box<dyn Error>> {  // ← 隐藏：提供返回 Result 的函数
/// let n: i32 = "42".parse()?;  // ← 读者能看到这行
/// assert_eq!(n, 42);           // ← 读者能看到这行
/// # Ok(())                     // ← 隐藏：函数需要返回 Ok
/// # }                          // ← 隐藏：关闭函数
/// # run().unwrap();             // ← 隐藏：实际调用这个函数
/// ```
```

**读者看到的文档**只有两行核心代码：

```
let n: i32 = "42".parse()?;
assert_eq!(n, 42);
```

`cargo test`** 实际运行的代码**包含了全部（隐藏行也在）：

```
use std::error::Error;
fn run() -> Result<(), Box<dyn Error>> {
    let n: i32 = "42".parse()?;
    assert_eq!(n, 42);
    Ok(())
}
run().unwrap();
```

这样文档简洁，测试也能正常运行。


## ? 运算符测验

```
use std::num::ParseIntError;

fn double_number(s: &str) -> Result<i32, ParseIntError> {
    let n = s.parse::<i32>()?;
    Ok(n * 2)
}
```
# 何时 panic，何时 Result

## 核心原则

学完 `panic!` 和 `Result`，你可能会问：**这两种方式什么时候用哪个？**

答案的核心是：**错误是调用者能处理的吗？**

- 如果调用者**可以**做出合理响应（文件不存在、网络超时、输入格式不对）→ 返回 `Result`，把选择权给调用者
- 如果调用者**无法**做出合理响应，继续下去只会更糟（违反了代码的不变量、不可能发生的状态出现了）→ 用 `panic!`

## 适合用 Result 的场景

### 任何”预期可能失败”的操作

文件读写、网络请求、用户输入解析——这些在正常运行中随时可能失败，不代表代码有 bug：

```
use std::num::ParseIntError;

fn parse_age(s: &str) -> Result<u32, ParseIntError> {
    let n: u32 = s.trim().parse()?;
    Ok(n)
}

fn main() {
    match parse_age("25") {
        Ok(age) => println!("年龄：{}", age),
        Err(e)  => println!("格式不对：{}", e),
    }

    match parse_age("abc") {
        Ok(age) => println!("年龄：{}", age),
        Err(e)  => println!("格式不对：{}", e),
    }
}
```

“abc” 解析失败不是 bug，是用户输入的正常变化。用 `Result` 让调用者来决定怎么处理——是重试、是使用默认值、还是显示错误提示。

## 适合 panic! 的场景

### 1. 原型和示例代码

写原型时，错误处理会让代码变得冗长，分散对核心逻辑的注意力。用 `unwrap` 先让代码跑起来，后续再完善：

```
// 原型代码：先跑起来，错误处理后续完善
fn main() {
    let content = std::fs::read_to_string("config.txt").unwrap();
    println!("{}", content);
}
```

`unwrap` 留下了一个明显的”待完善”标记，比悄悄吞掉错误或写假的错误处理要诚实。

### 2. 测试代码

测试中某个操作失败了，测试就应该失败。用 `unwrap/expect` 让测试在遇到错误时立刻报告：

```
#[test]
fn test_parse() {
    let n: i32 = "42".parse().expect("这个字符串应该能解析");
    assert_eq!(n, 42);
}
```

### 3. 你比编译器知道得更多

有时候你通过代码逻辑可以确定某个 `Result` 一定是 `Ok`，但编译器类型系统无法验证这一点：

```
use std::net::IpAddr;

fn main() {
    // "127.0.0.1" 是硬编码的合法 IP，parse 不可能失败
    let home: IpAddr = "127.0.0.1".parse().unwrap();
    println!("{}", home);
}
```

这里 `unwrap` 是合理的——IP 字符串是代码里写死的，不是运行时的用户输入。即使这样，建议加上注释说明原因，让代码审查者知道这不是疏漏。

### 4. 代码遇到了不变量被破坏的情况

当代码检测到”这种情况不应该存在，一定是 bug”时，panic 比悄悄继续运行更好：

```
fn get_element(v: &[i32], index: usize) -> i32 {
    if index >= v.len() {
        panic!("index {} 超出范围，向量长度是 {}", index, v.len());
    }
    v[index]
}

fn main() {
    let v = vec![1, 2, 3];
    println!("{}", get_element(&v, 1));  // 正常
    // println!("{}", get_element(&v, 5));  // 会 panic
}
```

## 用类型系统编码不变量

有一个更优雅的思路：与其在函数内部反复检查参数合法性，不如**用类型来保证只有合法的值才能被创建**。

举个例子：假设你的程序中大量函数都需要一个”1 到 100 之间的数字”。如果直接用 `i32`，每个函数都要检查范围。

更好的做法：创建一个 `Guess` 类型，把检查放在构造时：

```
pub struct Guess {
    value: i32,  // private，外部无法直接设置
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            // 违反了 Guess 的契约 → 调用者的 bug → panic
            panic!("猜测值必须在 1 到 100 之间，得到了 {}", value);
        }
        Guess { value }
    }

    pub fn value(&self) -> i32 {
        self.value
    }
}

fn check_guess(guess: Guess) {
    // 这里不需要再检查范围了
    // 因为能创建出 Guess，就说明值一定在 1-100 之间
    println!("你猜了 {}，在有效范围内", guess.value());
}

fn main() {
    let g = Guess::new(42);
    check_guess(g);

    // Guess::new(200);  // 这行会 panic——调用者的 bug
}
```

**关键点**：

- `value` 字段是私有的，外部代码**必须**通过 `new` 创建 `Guess`
- `new` 中的检查确保了：只要一个 `Guess` 存在，它的值就一定合法
- 所有接受 `Guess` 参数的函数不再需要重复检查范围

这就是”用类型编码不变量”——把检查从”每次使用时”移到”创建时”，一次检查，处处保证。

## 总结：决策框架

| 情况              | 推荐做法            |
| --------------- | --------------- |
| 用户输入、文件读写、网络请求等预期可能失败的操作 | 返回              | Result          |
| 写原型/示例，不想被错误处理分散注意力 | unwrap/expect   | 先跑起来            |
| 测试中的断言          | unwrap/expect   |
| 硬编码值，你确定不会失败    | unwrap          | （加注释说明原因）       |
| 参数违反了契约（调用者的 bug） | panic!          |
| 代码遇到了不可能的状态     | panic!          |
| 提供给其他开发者使用的库    | 几乎总是返回          | Result          |

> 库的特殊情况：如果你在写一个供他人使用的库，对外暴露的函数几乎应该总是返回 Result，让库的用户自己决定如何处理错误。在库的内部实现中，遇到 bug 可以 panic。



## 决策测验

## 编程练习

下面的函数签名已经改为返回 `Result<u32, String>`，但函数体里还在用 `panic!`。请将两处 `panic!` 改为返回 `Err(...)`，并把最后的返回值改为 `Ok(...)`，使代码能正常运行。

```
fn parse_age(s: &str) -> Result<u32, String> {
    let n: i32 = match s.trim().parse() {
        Ok(n)  => n,
        Err(e) => panic!("解析失败：{}", e),
    };
    if n < 0 || n > 150 {
        panic!("年龄 {} 不在有效范围内", n);
    }
    n as u32
}

fn main() {
    println!("{:?}", parse_age("25"));
    // 下面这行目前会 panic，改好后应该打印错误信息
    // println!("{:?}", parse_age("abc"));
}
```
# 多种错误来源

## 遇到了什么问题

前几篇都用 `io::Error` 或 `ParseIntError` 这样的**单一错误类型**。但现实中一个函数经常遇到**多种错误来源**。比如——读取文件并解析里面的数字：

```
use std::fs;
use std::num::ParseIntError;

fn double_from_file(path: &str) -> Result<i32, ???> {
    let content = fs::read_to_string(path)?;  // 可能是 io::Error
    let n: i32 = content.trim().parse()?;     // 可能是 ParseIntError
    Ok(n * 2)
}
```

返回类型 `Result<i32, ???>` 里该填什么？`io::Error` 和 `ParseIntError` 是两个不同的类型，`?` 无法同时返回两种。

## Box<dyn Error>：快速解决多种错误

`Box<dyn Error>` 是一个能容纳**任意错误类型**的容器。只要某个类型实现了 `Error` trait，就能被放进来。

> 理解 Box<dyn Error>：dyn Error 是”实现了 Error trait 的某种类型”的意思，Box 是把它放在堆上（编译时不知道具体大小）。现阶段只需要知道它是个”通用错误容器”，详细原理在 trait 章节会讲。


```
use std::error::Error;
use std::fs;

fn double_from_file(path: &str) -> Result<i32, Box<dyn Error>> {
    let content = fs::read_to_string(path)?;  // io::Error 自动装入 Box
    let n: i32 = content.trim().parse()?;     // ParseIntError 自动装入 Box
    Ok(n * 2)
}

fn main() {
    match double_from_file("number.txt") {
        Ok(n)  => println!("结果：{}", n),
        Err(e) => println!("错误：{}", e),
    }
}
```

`?` 会自动把 `io::Error` 和 `ParseIntError` 都转换成 `Box<dyn Error>`，不需要手动处理。

**优点**：代码极简，几乎不需要额外写任何东西。

**缺点**：调用者拿到的是一个”盒子”，无法直接判断里面是哪种错误、做精确处理（比如区分”文件不存在”和”格式不对”）。

> Box<dyn Error> 适合：应用程序的 main 函数、脚本、快速原型。不适合：需要让调用者精确匹配错误类型的库。


## 需要精确错误类型时怎么办

对外暴露 API 的库，往往需要让调用者能精确 `match` 不同的错误情况。这时候要**定义自己的错误枚举**，并实现三个 trait：

| Trait           | 为什么需要           |
| --------------- | --------------- |
| Display         | 控制              | {}              | 打印的内容，即面向用户的错误描述 |
| Error           | 把你的类型标记为”合法的错误类型”， | ?               | 和标准库才认识它        |
| From<底层错误>      | 让               | ?               | 遇到              | io::Error       | 时自动转成你的类型，不用手动  | map_err         |

最简单的例子：

```
use std::fmt;

#[derive(Debug)]
enum AppError {
    Io(std::io::Error),
    Parse(std::num::ParseIntError),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Io(e)    => write!(f, "文件错误：{}", e),
            AppError::Parse(e) => write!(f, "解析错误：{}", e),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self { AppError::Io(e) }
}
impl From<std::num::ParseIntError> for AppError {
    fn from(e: std::num::ParseIntError) -> Self { AppError::Parse(e) }
}

fn double_from_file(path: &str) -> Result<i32, AppError> {
    let content = std::fs::read_to_string(path)?; // io::Error 自动转 AppError::Io
    let n: i32 = content.trim().parse()?;          // ParseIntError 自动转 AppError::Parse
    Ok(n * 2)
}

fn main() {
    match double_from_file("number.txt") {
        Ok(n)               => println!("结果：{}", n),
        Err(AppError::Io(e))    => println!("文件问题，可重试：{}", e),
        Err(AppError::Parse(e)) => println!("内容格式错误：{}", e),
    }
}
```

> 这里用到了 trait 实现语法（impl Xxx for Yyy），目前看不懂细节很正常——trait 章节会完整讲解。这里有个印象即可，在实际项目使用到的时候再回头深入学习即可。


# 遍历 Result

## 迭代器中的错误处理

> 下面的代码用到了闭包（|s| ...）和迭代器（.map()、.collect() 等），这些语法会在[闭包与迭代器](/RustCourse/chapters/12-closures-iterators/00-index)章节详细讲解。这里先看整体用法，理解”遇到错误时有哪些处理策略”即可，细节后续自然会清楚。


当你对一个集合做 `map` 操作时，每个元素的转换可能失败。Rust 提供了三种实用策略：

```
fn main() {
    let strings = vec!["1", "两", "3", "4"];

    // 策略一：filter_map — 忽略失败项，只保留成功的
    let numbers: Vec<i32> = strings.iter()
        .filter_map(|s| s.parse::<i32>().ok())
        .collect();
    println!("忽略失败：{:?}", numbers);  // [1, 3, 4]

    // 策略二：collect 到 Result — 遇到第一个失败就整体返回 Err
    let result: Result<Vec<i32>, _> = strings.iter()
        .map(|s| s.parse::<i32>())
        .collect();
    println!("遇错即停：{:?}", result);  // Err(...)

    // 策略三：partition — 把成功和失败分开收集
    let (ok_vals, err_vals): (Vec<_>, Vec<_>) = strings.iter()
        .map(|s| s.parse::<i32>())
        .partition(Result::is_ok);
    let numbers: Vec<i32> = ok_vals.into_iter().map(Result::unwrap).collect();
    let errors: Vec<_>    = err_vals.into_iter().map(Result::unwrap_err).collect();
    println!("分开收集：ok={:?}, err={:?}", numbers, errors);
}
```

三种策略各有用途：

| 策略              | 适用场景            |
| --------------- | --------------- |
| filter_map(.ok()) | 不关心失败项，只要成功的结果  |
| collect::<Result<Vec<_>,_>>() | 要么全部成功，要么整体失败（数据导入等批量操作） |
| partition(Result::is_ok) | 既要成功结果，也要收集所有错误信息 |


## 多种错误来源测验

## 编程练习

### 练习一：修复错误传播

下面这个函数无法编译，因为函数体内可能出现两种不同的错误类型，但返回类型只写了 `io::Error`。把返回类型改成能容纳任意错误的类型，使其编译通过。

```
use std::fs;
use std::io;

fn read_number(path: &str) -> Result<i32, io::Error> {
    let content = fs::read_to_string(path)?;
    let n: i32 = content.trim().parse()?;
    Ok(n)
}

fn main() {
    match read_number("number.txt") {
        Ok(n)  => println!("数字是 {}", n),
        Err(e) => println!("出错了：{}", e),
    }
}
```

### 练习二：用迭代器处理错误

把能转换成整数的字符串保留下来，不能转换的跳过。请用 `filter_map` 补全代码。

```
fn main() {
    let inputs = vec!["1", "two", "3", "四", "5"];

    // 使用 filter_map 过滤掉无法解析的，只保留成功解析的整数
    let numbers: Vec<i32> = inputs.iter()
        .filter_map(|s| s.parse::<i32>().???)
        .collect();

    println!("{:?}", numbers);
}
```