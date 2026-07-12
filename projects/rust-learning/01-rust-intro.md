---
title: "Rust 简介与环境搭建"
description: "了解 Rust 的设计哲学、核心优势与适用范围，完成开发环境安装配置，运行第一个 Rust 程序"
date: "2026-07-12"
order: 1
tags: ["Rust简介", "安装", "环境配置", "Cargo"]
est_time: "60 分钟"
---

# 教程介绍

大家好，我是博主雪云飞星。我在汽车嵌入式行业做了多年 AUTOSAR 和系统架构相关的工作。在这个领域，C 语言长期统治着一切——实时操作系统、底层驱动、车控业务软件，无不用 C 写成。它足够快，足够直接，但它也足够危险：一个野指针、一次越界访问，都可能在量产车辆上酿成故障。

第一次接触 Rust 时，我的感受是：**这正是我一直在等的东西。**

它和 C 一样快，和 C 一样接近硬件，却在编译器层面拒绝了那些让人夜不能寐的内存 bug。这不是理论上的承诺——Rust 的所有权系统是一套经过严格设计的方案，它把「内存安全」从程序员的责任转移到了编译器的职责。

这套教程，是我把 Rust 引入工程实践过程中的思考总结，也同时起到指引入门学习的作用。

## 这套教程是什么

一套**互动式** Rust 教程。每篇文章里的代码都可以直接在浏览器里运行，不需要配置任何环境；练习题可以直接在页面上编辑和提交；选择题会即时反馈答案和解析。

学习一门语言，光看是不够的。你需要动手，需要看到错误，需要理解编译器在说什么。这套教程的设计目标，就是让这个过程尽可能流畅。

## 和官方文档有什么不同

[Rust 官方「The Book」](https://doc.rust-lang.org/book/) 是极好的参考资料，但它是一本理论书——它假设你会从头到尾顺序阅读，它追求严谨完整。

这套教程做的是另一件事：**用更口语化的方式把概念讲透，配上可以立刻运行的代码、可交互的测试题，让你在理解之前就先感受到，学完教程就能做开发。**

对于重要的概念，我们会反复从不同角度解释。对于容易犯错的地方，我们会故意给出会报错的代码，让你看到编译器的反应。这不是坏事——学会读懂编译器的报错信息，是学 Rust 最重要的技能之一。

## 一点期待

Rust 的学习曲线在前期是真实存在的。所有权系统是一套新的思维方式，和大多数语言都不一样。你会遇到编译器拒绝你认为「完全没问题」的代码的情况，这很正常。

但一旦那个转折点到来——你开始感觉编译器是在帮你，而不是在为难你——你会发现这门语言真的很好用。

希望这套教程能帮你更快到达那个转折点。

—— 雪云飞星（付皓文）

# 如何学习本教程

## 学习 Rust 需要什么基础

本教程假设你：

- 有过至少一门编程语言的经验（不限语言）
- 了解基本的编程概念（变量、函数、循环）

不需要：

- 操作系统或编译原理知识
- 任何 Rust 相关经验

如果你完全没有编程基础，建议先学一门入门语言（Python 或者 C 是个不错的选择，本教程通常会与 C 进行对比或举例），再来学 Rust。说实话，Rust 并非是一门适合新手小白入门的编程语言，有了其他语言的基础，学习 Rust 将会更加稳健。

## 完成本教程需要多长时间

**本教程的设计学习周期是 1-2 个月**，每天投入 1-2 小时。

具体节奏参考：

| 阶段              | 内容              | 建议时间            |
| --------------- | --------------- | --------------- |
| 入门阶段            | Rust 基础、安装环境、变量与类型、控制流 | 第 1-2 周         |
| 核心阶段            | 所有权、借用、生命周期（Rust 最难的部分） | 第 3-5 周         |
| 进阶阶段            | 结构体、枚举、trait、泛型、错误处理 | 第 6-7 周         |
| 实战阶段            | 完成所有练习题，尝试写一个小项目 | 第 8 周           |

不要着急。核心阶段（所有权和借用）是绝大多数人卡住的地方，在这里多花一倍时间是完全正常的。

> 注意：这里的时间仅作参考，实际时间可能会更长，如果你想要在后续的项目工程中使用 Rust，建议将速度放慢一点，或者多学习几遍（通常来说想要达成 C 语言同样的熟练度，Rust 前期需要花费几倍的学习时间）


## Rust 的学习曲线是什么样的

坦率地说：Rust 的学习曲线比大多数语言都陡。但它陡的方式比较特殊——**它难在前期，而不是后期**。

![Rust 学习曲线示意图](/images/rust/rust-learning-curve.svg)
一旦跨过所有权这道坎，后面的内容反而会越来越流畅。很多 Rust 开发者的反馈是：**写了一段时间后，感觉编译器越来越像一个会指出你错误的代码审查者，而不是障碍。**

## 熟练掌握 Rust 要多久

这里做一个横向对比，前提是每天有 1-2 小时的学习和练习时间：

| 目标程度            | Python          | C 语言            | Rust            |
| --------------- | --------------- | --------------- | --------------- |
| 能写出能跑的程序        | 1-2 周           | 2-4 周           | 1-2 月           |
| 能独立完成中型项目       | 2-3 月           | 4-6 月           | 4-6 月           |
| 达到生产级熟练度        | 6-12 月          | 1-2 年           | 1-2 年           |

Rust 的入门期明显比 Python 长，但和 C 语言相比，达到**生产级熟练度**的时间其实差不多——因为 Rust 编译器会帮你排查掉大量 C 语言里需要靠经验积累才能避免的问题。

> 从实战角度：如果你有 C/C++ 背景，适应 Rust 通常需要 1-3 个月；如果你只有 Python/Java 背景，需要 2-4 个月才能感觉”顺手”。但这个时间投入是值得的——Rust 程序一旦编译通过，出 bug 的概率远低于等效的 C 代码。


## 学习建议

### 不要跳过错误信息

Rust 的编译器报错信息是业界最详细的。每次报错都仔细读一遍，时间久了你会发现自己越来越能预判编译器会说什么。

### 所有权卡住了就多读几遍

所有权章节不是一遍能懂的，多数人需要读 2-3 遍、写几段代码之后才会真正明白。这是正常现象，不是你的问题。

### 动手比阅读重要

每篇文章的练习题不要跳过，即使看起来很简单。Rust 的很多概念，你以为你懂了，但动手写的时候才会发现真正的理解在哪里。

### 推荐学习资源

| 资源              | 链接              | 说明              |
| --------------- | --------------- | --------------- |
| Rust 官方 The Book | 最权威的入门读物，本教程的主要参考来源 |                 |
| Rust 中文 The Book | 上面的中文译版，质量较高    |                 |
| Rust by Example | 以代码示例为主，适合对照查阅  |                 |
| Rustlings       | 小练习题集，适合巩固基础    |                 |
| Rust Playground | 在线运行 Rust 代码，无需安装环境 |                 |
| Comprehensive Rust | Google 出品的 Rust 课程，结构清晰 |                 |
| Rust 标准库文档      | 遇到不认识的类型和方法就查这里 |                 |

[doc.rust-lang.org/book](https://doc.rust-lang.org/book/)[rustwiki.org/zh-CN/book](https://rustwiki.org/zh-CN/book/)[doc.rust-lang.org/rust-by-example](https://doc.rust-lang.org/rust-by-example/)[github.com/rust-lang/rustlings](https://github.com/rust-lang/rustlings)[play.rust-lang.org](https://play.rust-lang.org/)[google.github.io/comprehensive-rust](https://google.github.io/comprehensive-rust/)[doc.rust-lang.org/std](https://doc.rust-lang.org/std/)
### 遇到问题善用社区

- [Rust 官方论坛](https://users.rust-lang.org/)：友好，适合提问
- [Rust 中文社区](https://rustcc.cn/)：中文资源
- [Stack Overflow](https://stackoverflow.com/questions/tagged/rust)：具体技术问题

# 加博主微信（和大家交个朋友）

由于博主平时也需要忙自己的工作，所以目前有点处理不过来大家的消息。微信是想和大家交个朋友，大家如果有技术上的问题，还请到微信群里向大家提问，加群请勿催促，博主会统一拉大家进群

**加好友请备注“Rust“**，否则通不过

微信号：**xyfx18909025121（雪云飞星）**
# Rust 是什么

你可能听说过 Rust 很难学，也可能听说过它是”程序员最爱的语言”，甚至两者都听说过。这两件事并不矛盾——Rust 确实有一定的学习曲线，但它试图解决的问题是真实存在且困扰编程世界数十年的老难题。

学习 Rust 之前，先搞清楚它**为什么存在**，能帮你在遇到困难时不至于放弃。

## 一个长达几十年的矛盾

在编程语言的世界里，有一对长期对立的需求：

**高性能、底层控制** vs **安全、高效的开发体验**

![安全与速度的矛盾](/images/rust/safety_vs_speed.svg)
- C 和 C++ 给你完全的底层控制，可以精确管理内存，运行极快。代价是：一不小心就会有内存泄漏、空指针崩溃、数据竞争等 bug，找起来极其痛苦。
- Python、Java、Go 等语言有垃圾回收器（GC）帮你管内存，开发体验好，但运行时有额外开销，无法用于对延迟和资源极敏感的场景（比如嵌入式系统、操作系统内核）。

这就是那个矛盾：**要么安全，要么快，二选一。**

Rust 的答案是：**不，两者可以兼得。**

> Rust 不靠运行时 GC 来保证内存安全，而是通过编译期的所有权系统，在代码运行之前就把不安全的写法拒之门外。


## Rust 的核心思路：让编译器当守门员

![编译器守门员](/images/rust/compiler_goalkeeper.svg)
传统语言里，内存 bug 通常在**运行时**才暴露——程序崩了、客户投诉、深夜排查。

Rust 的做法完全不同：它在**编译期**就检查内存安全。如果你写了一段可能出问题的代码，Rust 编译器会直接拒绝编译，并给出详细的错误信息告诉你哪里出了问题。

这一套机制的核心叫做**所有权系统**（ownership），我们后续会详细学习。现在只需要记住一件事：

**在 Rust 中，以往那些只能靠测试和代码评审才能发现的 bug，编译器会在你运行之前就帮你找出来。**

这对团队协作意义重大——你不再需要依赖每个人都”足够小心”，编译器本身就是那道安全网。

## Rust 没有运行时开销

Rust 实现内存安全的方式是**编译期分析**，不是运行时的垃圾回收器。这意味着：

- 没有 GC 的暂停（GC pause）
- 没有运行时的额外内存占用
- 可以精确控制内存布局
- 可以用于嵌入式、内核、实时系统等对资源极其敏感的场景

Rust 追求的是**零开销抽象**（zero-cost abstractions）：你写的高层代码，编译后和手写的底层代码一样快。如果用不到某个特性，就不付出该特性的开销。

## 一句话总结

**Rust 是一门让你同时拥有 C 的性能和 Python 的安全感的系统编程语言——它用编译期的所有权检查，在不引入运行时开销的前提下，彻底消灭内存 bug。**

# Rust的适用范围

## 谁适合学 Rust

| 人群              | 为什么适合           |
| --------------- | --------------- |
| 系统/嵌入式开发者       | 保持 C/C++ 同等性能的同时摆脱内存 bug；汽车电子、工业控制、物联网已有大量实践 |
| 后端/基础设施开发者      | 适合构建高性能 Web 服务、CLI 工具、数据库引擎；并发模型让编译器在编译期阻止竞争条件 |
| 学生和技术爱好者        | 真正理解内存、生命周期、栈与堆——这些在其他语言里被抽象掉的基础概念 |
| 任何想写更可靠软件的人     | 学 Rust 会改变你思考程序正确性的方式，受益于所有语言 |

## Rust 现在用在哪里

- **浏览器引擎**：Firefox CSS 引擎 [Stylo](https://github.com/servo/servo)、独立浏览器引擎 [Servo](https://github.com/servo/servo)
- **操作系统**：Linux 内核已接受 Rust 代码；[Redox OS](https://github.com/redox-os/redox) 是完全用 Rust 编写的操作系统
- **嵌入式**：[Embassy](https://github.com/embassy-rs/embassy) 是专为微控制器设计的 Rust 异步框架，越来越多的汽车电子项目也在引入 Rust
- **Web 框架**：[Actix Web](https://github.com/actix/actix-web) 和 [Axum](https://github.com/tokio-rs/axum) 是最流行的 Rust Web 框架
- **异步运行时**：[Tokio](https://github.com/tokio-rs/tokio) 是 Rust 生态中最广泛使用的异步运行时
- **桌面应用**：[Tauri](https://github.com/tauri-apps/tauri) 用 Rust 替代 Electron，打包体积从几百 MB 降到几 MB
- **终端工具**：[Alacritty](https://github.com/alacritty/alacritty)（终端模拟器）、[ripgrep](https://github.com/BurntSushi/ripgrep)（极速文本搜索）、[fd](https://github.com/sharkdp/fd)（find 替代品）、[bat](https://github.com/sharkdp/bat)（带语法高亮的 cat）

Rust 不是一门试图替代所有语言的语言。它有明确的定位：**在需要高性能和底层控制的地方，提供内存安全保障**。

> Rust 连续多年被 Stack Overflow 开发者调查评为「最受喜爱的编程语言」第一名。


接下来，我们从安装环境开始，第一步一步把 Rust 跑起来。

# 练习题

## 关于 Rust 的定位

## 零开销抽象

## 与其他语言的对比

## Rust 的适用场景

## 编译器的角色
# 了解 rustup

## 什么是 rustup

安装 Rust 的官方推荐方式是 **rustup**——它不只是一个安装程序，而是 Rust 的**版本管理器**。

一个类比：rustup 之于 Rust，就像 nvm 之于 Node.js，或者 pyenv 之于 Python。它负责帮你管理 Rust 的版本，而不是让你只能通过系统包管理器装一个固定版本。

你可能会问：为什么不直接装一个固定版本就行？

因为 Rust 发布节奏较快，**每六周发布一次稳定版**。Rust 对向后兼容非常重视（几乎不会破坏已有代码），但新版本通常会带来：

- 更清晰的编译器报错信息（学习期间非常有价值）
- 新的语言特性和标准库 API
- 性能和编译速度改进

此外，Rust 维护三个发布渠道：

| 渠道              | 说明              | 适合谁             |
| --------------- | --------------- | --------------- |
| stable          | 每六周发布，经过充分测试    | 日常开发，           | 推荐使用            |
| beta            | 下一个 stable 的候选版本 | 想提前测试兼容性        |
| nightly         | 每天构建，包含实验性特性    | 需要              | #![feature(...)] | 的高级用法           |

rustup 让你可以：

- 随时升级到最新稳定版（`rustup update`）
- 在不同渠道之间切换（`rustup default nightly`）
- 为不同项目指定不同版本（在项目目录放 `rust-toolchain.toml`）
- 为嵌入式等目标平台安装交叉编译工具链（`rustup target add`）

> 本教程全程使用 stable 渠道，安装时选默认选项即可。


## rustup 安装了什么

运行安装脚本后，你会得到：

| 工具              | 作用              |
| --------------- | --------------- |
| rustc           | Rust 编译器        |
| cargo           | 包管理器 + 构建工具（最常用的命令） |
| rustup          | 版本管理器本身         |
| rustfmt         | 代码格式化工具         |
| clippy          | 代码检查（lint）工具    |
| rust-analyzer   | LSP 服务器（IDE 代码补全的基础） |

日常开发中，你打交道最多的是 `cargo`和`rust-analyzer`，`rustc` 通常不需要直接调用。

## rustup 的日常使用

| 命令              | 作用              |
| --------------- | --------------- |
| rustup update   | 升级 Rust 到最新稳定版  |
| rustup show     | 查看当前安装的工具链信息    |
| rustup doc      | 在浏览器打开本地离线的 Rust 官方英文文档 |
| rustup self uninstall | 完全卸载 Rust 和 rustup |

**建议定期运行 **`rustup update`——Rust 每六周发布新版本，新版本通常会改进编译器的报错信息，学习期间能看到更清晰的提示。

# 安装步骤

## macOS / Linux 安装

打开终端，运行：

```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

安装脚本会引导你完成安装，选择默认选项（按回车）即可。安装成功后会出现：

```
Rust is installed now. Great!
```

安装完成后，**重新打开终端**，或者手动加载环境变量：

```
source "$HOME/.cargo/env"
```

### macOS：安装链接器

Rust 编译输出需要一个**链接器**把目标文件合并成可执行文件。macOS 上最简单的获取方式是安装 Xcode 命令行工具：

```
xcode-select --install
```

如果你已经安装了完整的 Xcode 或 Homebrew，通常已经自带链接器，可以跳过这一步。

### Linux：安装链接器

Linux 用户需要安装 C 编译器（包含链接器）。以 Ubuntu / Debian 为例：

```
sudo apt-get install build-essential
```

Fedora / RHEL 系：

```
sudo dnf install gcc
```

> 为什么 Rust 需要 C 链接器？ Rust 的标准库和部分 crate 在最终链接阶段依赖系统的 C 链接器（ld）。这不是 Rust 的缺陷，而是和操作系统 ABI 集成的必要步骤。


## Windows 安装

访问 [https://rustup.rs](https://rustup.rs) 下载 `rustup-init.exe` 并运行。

### Windows 需要 C++ 构建工具

Windows 上的 Rust 默认使用 MSVC 工具链，这需要 **Visual Studio C++ 构建工具**。安装向导会自动提示你，选择以下组件：

- **C++ 桌面开发**（Desktop development with C++）
- Windows 10/11 SDK
- MSVC 编译器组件

如果不想安装 Visual Studio，可以改用 GNU 工具链（`x86_64-pc-windows-gnu`），但建议初学者使用默认的 MSVC 工具链——兼容性更好，报错信息更清晰。

> 需要多少空间？ Visual Studio 构建工具约需 3-5 GB 磁盘空间。如果磁盘紧张，可以在安装时只选择最小必要组件。


安装完成后打开新终端（命令提示符或 PowerShell），使环境变量生效。

## 验证安装是否成功

在终端中运行：

```
rustc --version
```

正常输出类似：

```
rustc 1.79.0 (129f3b996 2024-06-10)
```

再验证 Cargo：

```
cargo --version
```

输出类似：

```
cargo 1.79.0 (ffa9cf99a 2024-06-03)
```

两个命令都有输出就说明安装成功。

## 常见问题：命令找不到

**macOS / Linux**：如果提示 `command not found`，说明环境变量没有生效。运行：

```
source "$HOME/.cargo/env"
```

然后把这行加到你的 `~/.bashrc` 或 `~/.zshrc` 末尾，以后打开终端就自动生效。

**Windows**：如果提示找不到命令，检查 `%USERPROFILE%\.cargo\bin` 是否在系统的 `PATH` 环境变量中。rustup 安装时通常会自动添加，但需要重新打开终端才能生效。
# 你的第一个 Rust 程序

按照程序员世界的传统，学习一门新语言的第一件事，就是让计算机说出 “Hello, world!”。这不只是仪式感——它能让你快速感受到这门语言最基本的节奏：写代码、编译、运行。

## 创建项目目录

Rust 对代码存放的位置没有任何限制，但养成规范的目录结构是好习惯。我们在主目录下创建一个统一的 `projects` 目录，存放本教程的所有练习。

**Linux / macOS / Windows PowerShell：**

```
mkdir ~/projects
cd ~/projects
mkdir hello_world
cd hello_world
```

**Windows CMD：**

```
mkdir "%USERPROFILE%\projects"
cd /d "%USERPROFILE%\projects"
mkdir hello_world
cd hello_world
```

> 文件命名约定： 如果文件名包含多个单词，统一用小写字母并通过下划线分隔，例如 hello_world.rs，而不是 helloworld.rs 或 HelloWorld。这是 Rust 社区的惯例。


## 编写第一个程序

在 `hello_world` 目录下，创建名为 `main.rs` 的文件（Rust 源文件以 `.rs` 结尾），输入以下内容：

```
fn main() {
    println!("Hello, world!");
}
```

保存文件。你刚才写完了人生中第一个 Rust 程序，只有两行代码。接下来我们逐行拆解它。

## 程序解剖：每行代码的含义

这个程序虽然简单，但 Rust 的几个核心语法已经悄悄出现了。

### `fn main()` 是什么？

`fn` 是 **function（函数）** 的缩写，`main` 是这个函数的名字，`()` 表示它不接收任何参数。

```
// main 函数是程序的入口点
// Rust 运行时总是从这里开始执行
fn main() {
    // 函数体放在一对大括号里
}
```

`main` 函数是每个可执行 Rust 程序的**入口点**——就像马拉松的起跑线，无论程序有多复杂，都从 `main` 跑起来。

> Rust 规范要求左大括号 { 和函数声明放在同一行，中间加一个空格。如果你不确定格式是否规范，可以运行 rustfmt main.rs，这是 Rust 工具链内置的格式化工具，会自动帮你整理代码风格。


### `println!` 是什么？

注意 `println` 后面有一个感叹号 `!`。在 Rust 中，**带 **`!`** 的是宏（macro），不是普通函数**：

```
fn main() {
    println!("Hello, world!");  // println! 是宏
}
```

宏和函数有本质区别——宏在编译阶段就会展开处理代码，能做到函数做不到的事情（比如接受数量不固定的参数）。`println!` 就是一个功能强大的宏，能格式化并把文本打印到终端。

关于”宏到底是什么”先按下不表，等你对 Rust 有了更多了解之后，我们会专门深入讲解。**现在只需记住一条规则：看到 **`!`** = 调用的是宏。**

### 字符串字面量与分号

```
fn main() {
    //        双引号包裹的文本叫字符串字面量
    println!("Hello, world!");
    //                        ^ 英文分号，表示这条语句结束
}
```

还有两个细节值得注意：

- **4 个空格的缩进**，不是 Tab。这是 Rust 社区的统一约定。
- **英文分号 **`;` 表示这条语句已经完整结束。Rust 中大多数语句都以 `;` 结尾——后续你会理解为什么”大多数”而不是”全部”。

## 编译并运行

Rust 是**编译型语言**，必须先把源代码编译成二进制可执行文件，才能运行。

### 第一步：编译

在终端中，确保你在 `hello_world` 目录下，执行：

```
rustc main.rs
```

这条命令调用 Rust 编译器 `rustc`，把 `main.rs` 编译成可执行文件。编译成功后不会有任何输出——**没有消息就是好消息**。

### 第二步：查看生成的文件

```
ls          # Linux / macOS
dir /B      # Windows CMD
```

你会看到：

| 文件              | 说明              |
| --------------- | --------------- |
| main.rs         | 你写的源代码          |
| main            | （Linux/macOS）或  | main.exe        | （Windows）       | 编译产出的可执行文件      |
| main.pdb        | （仅 Windows）     | 调试符号文件          |

### 第三步：运行

```
./main          # Linux / macOS
.\main.exe      # Windows PowerShell / CMD
```

终端应该输出：

```
Hello, world!
```

看到这行输出了吗？**恭喜你，你已经是一名 Rust 开发者了！**

## 编译型 vs 解释型：为什么 Rust 要编译？

如果你之前学过 Python、Ruby 或 JavaScript，可能会觉得”先编译再运行”多了一步，有点麻烦。但这背后有深刻的权衡。

| 特性              | 解释型（Python / JS） | 编译型（Rust / C++） |
| --------------- | --------------- | --------------- |
| 运行方式            | 需要解释器逐行执行       | 直接运行二进制文件       |
| 分发程序            | 对方需要安装对应运行时     | 对方不需要安装任何东西     |
| 性能              | 相对较慢            | 接近硬件极限          |
| 错误发现时机          | 运行时才暴露          | 编译时就能发现大多数错误    |

Rust 选择做**预编译（ahead-of-time compiled）语言**，带来了两个关键好处：

**分发简单**：你可以把编译好的 `main` 文件直接发给任何人，他们不需要安装 Rust 就能直接运行。发给朋友一个 Python 脚本，他得先装 Python；发给他一个 Rust 编译出的可执行文件，双击就跑。

**错误前置**：Rust 编译器极其严格，能在你运行代码之前发现大量潜在错误。这也是 Rust”安全性”的核心来源之一——它不让不安全的程序通过编译关。

> 每次看到编译器报错，请别沮丧。Rust 的报错信息在所有主流语言里是出了名的详细和友好，它在帮你、不是在为难你。渐渐地你会发现，「把错误解决在编译阶段」是一件很爽的事。


## 小结

这篇文章里，你完成了人生中第一个 Rust 程序，并了解了它的每一行代码。回顾关键点：

- 每个 Rust 可执行程序都从 `fn main()` 开始运行
- `println!` 是一个**宏**，注意感叹号 `!`
- `rustc main.rs` 编译源代码，生成可执行文件
- Rust 是预编译语言，生成的二进制文件可以独立分发

用 `rustc` 直接编译对小程序没问题，但随着项目规模增长，管理依赖、组织代码文件会变得很繁琐。下一篇文章，我们来认识 Rust 的构建和包管理工具 **Cargo**，它才是你日常开发的真正起点。


## 程序入口

## 宏的标志

## 缩进风格

## 编译命令

## 预编译语言的优势

## 错误修复

下面的代码有**两处**语法错误，找出并修复它们，让程序输出 `Hello, world!`。

```
fn main() {
    println("Hello, world!")
}
```
# Cargo: Rust 的项目管理神器

用 `rustc` 直接编译文件，对一两个文件的小程序没问题。但真实项目往往有几十个源文件、十几个外部依赖——这时候手动调用 `rustc` 就变成了噩梦。**Cargo** 是 Rust 官方给出的答案，也是你日后每天都会用到的工具。

## 什么是 Cargo？

Cargo 同时扮演两个角色：

| 角色              | 职责              |
| --------------- | --------------- |
| 构建系统            | 编译代码、处理编译顺序、管理多文件项目 |
| 包管理器            | 下载、编译、管理第三方库（crate） |

Cargo 随 Rust 工具链一起安装。先确认它可用：

```
cargo --version
```

看到类似 `cargo 1.xx.x` 的输出就说明一切正常。

## 用 Cargo 创建项目

回到 `projects` 目录，执行：

```
cargo new hello_cargo
cd hello_cargo
```

一条命令，Cargo 帮你做了三件事：

- 创建 `hello_cargo` 目录和标准项目结构
- 生成开箱即用的 `Cargo.toml` 配置文件
- 初始化 Git 仓库（含 `.gitignore`）

Cargo 生成的 `src/main.rs` 模式会生成一个完整可运行的 Hello world 程序：

```
fn main() {
    println!("Hello, world!");
}
```

> 如果已有一个没用 Cargo 管理的项目，只需把源文件移到 src/ 目录，再创建对应的 Cargo.toml，即可迁移成 Cargo 项目。


## 项目结构一览

`cargo new` 创建的目录结构：

```
hello_cargo/
├── Cargo.toml      ← 项目配置文件
├── Cargo.lock      ← 依赖版本锁定文件（首次构建后自动生成）
├── .gitignore      ← 自动忽略 target/ 目录
└── src/
    └── main.rs     ← 源代码入口
```

**Cargo 的约定：源文件只放在 **`src/`**，根目录只放配置、文档和授权文件。** 这个约定让所有 Cargo 项目拥有一致的布局，你接手任何陌生项目都能快速找到源文件。

## Cargo.toml 详解

`Cargo.toml` 是项目的”身份证”，TOML 格式，内容简洁：

```
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]
```

逐段解读：

`[package]`** 表块**——描述这个包本身的信息：

- `name`：包名，也是编译出的可执行文件名
- `version`：版本号，遵循语义化版本（semver）惯例，格式为 `主版本.次版本.修订版`
- `edition`：使用的 Rust 语言大版本，目前推荐 `2021`及以上

`[dependencies]`** 表块**——列出项目依赖的外部 crate。现在是空的；需要引入第三方库时在这里添加一行即可，Cargo 会自动下载和编译。

> crate 是 Rust 代码包的单位，相当于 Node.js 的 npm package 或 Python 的 pip 包。Rust 的官方 crate 仓库是 [crates.io](https://crates.io)，目前有超过 15 万个 crate。


# 构建与运行

## cargo build：编译项目

在项目根目录执行：

```
cargo build
```

Cargo 编译 `src/main.rs`，可执行文件放到 `target/debug/` 目录下：

```
./target/debug/hello_cargo       # Linux / macOS
.\target\debug\hello_cargo.exe   # Windows
```

首次构建时还会生成 `Cargo.lock`，记录所有依赖的精确版本——不需要手动编辑，Cargo 全程自动维护。

> target/ 目录体积大、随时可重新生成，Cargo 已在 .gitignore 中帮你排除，不会被提交到 Git 仓库。


## cargo run：编译 + 运行一步到位

开发时最常用的命令：

```
cargo run
```

`cargo run` 等于 `cargo build` + 运行，一步完成。如果源文件自上次编译后没有改动，Cargo 会直接运行已有的可执行文件，跳过编译，节省等待时间。

来验证它的工作方式——下面是 Cargo 管理的项目中 `main.rs` 的典型内容：

```
fn main() {
    println!("由 Cargo 构建并运行！");
}
```

## cargo check：快速语法检查

```
cargo check
```

`cargo check` 只检查代码能否通过编译，**不生成可执行文件**。因为省略了代码生成阶段，它通常比 `cargo build` 快 5～10 倍。

实际开发中，很多 Rust 开发者会养成这样的习惯：边写代码边频繁运行 `cargo check`，确保没有语法和类型错误；等到真正需要测试运行效果时，才执行 `cargo run`。

## cargo build —release：发布构建

```
cargo build --release
```

加上 `--release` 标志后，Cargo 开启全套编译优化，生成**性能最优**的可执行文件，放到 `target/release/` 目录。

两种模式的对比：

| 模式              | 命令              | 编译速度            | 运行性能            | 输出目录            |
| --------------- | --------------- | --------------- | --------------- | --------------- |
| 开发模式            | cargo build     | 快               | 含调试信息，未优化       | target/debug/   |
| 发布模式            | cargo build --release | 慢               | 最大化优化           | target/release/ |

> 做性能测试（benchmark）时，必须用 --release 版本——开发模式包含大量调试信息、禁用了优化，测出的数据会严重失真。


## 小结

这六条命令覆盖了日常 90% 的需求：

| 命令              | 用途              |
| --------------- | --------------- |
| cargo new <name> | 创建新项目（在当前目录下新建项目目录） |
| cargo init      | 将当前目录创建为新项目     |
| cargo build     | 编译（开发模式）        |
| cargo run       | 编译 + 运行（最常用）    |
| cargo check     | 只检查语法，不生成文件（最快） |
| cargo build --release | 编译发布版（最优化）      |

不管你在 Linux、macOS 还是 Windows 上，这些命令完全一致——这是 Cargo 跨平台一致性的体现。


## 工具定位

## rustup 的职责

## cargo check 的特点

## 发布构建

## Rust 工具箱

## 填空：工具速查表

将下方备选描述填入对应工具的 `""` 中，让程序输出完整的工具速查表。每条描述只用一次。

**备选描述：**

- `"LSP 服务器（IDE 代码补全的基础）"`
- `"版本管理器本身"`
- `"Rust 编译器"`
- `"代码格式化工具"`
- `"包管理器 + 构建工具（最常用的命令）"`
- `"代码检查（lint）工具"`

```
fn main() {
    println!("rustc:         {}", "");  // 填入对应的作用
    println!("cargo:         {}", "");
    println!("rustup:        {}", "");
    println!("rustfmt:       {}", "");
    println!("clippy:        {}", "");
    println!("rust-analyzer: {}", "");
}
```
# 代码初体验

在正式学习语法之前，我们先来跑一个真正”有用”的程序，感受一下 Rust 代码长什么样。

**你的目标很简单**：输入一个日期（年/月/日），程序告诉你那天是星期几。

你可以尝试看一下下面的代码，但不需要现在看懂每一行——就像第一次坐飞机，你不必先学会造飞机。先上去飞一圈，感受一下。

## 完整程序

下面是一个能运行的完整程序。点击”运行”看看结果，然后我们再一起扫一眼代码结构。

```
// 判断是否是闰年
fn is_leap_year(year: u32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

// 返回某月有多少天
fn days_in_month(year: u32, month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11              => 30,
        2 => if is_leap_year(year) { 29 } else { 28 },
        _  => 0,
    }
}

// 计算星期几
// 基准：1583年1月1日是星期六（格里历正式实施的第一年元旦）
fn day_of_week(year: u32, month: u32, day: u32) -> &'static str {
    let weekdays = ["日", "一", "二", "三", "四", "五", "六"];

    let mut total_days: u32 = 0;

    // 累加 1583 年到目标年之前的天数
    for y in 1583..year {
        total_days += if is_leap_year(y) { 366 } else { 365 };
    }
    // 累加目标年内各月的天数
    for m in 1..month {
        total_days += days_in_month(year, m);
    }
    // 加上当月已过的天数（第1天不额外加）
    total_days += day - 1;

    // 1583-01-01 是星期六（索引 6），推算目标日期
    let index = (total_days + 6) % 7;
    weekdays[index as usize]
}

fn main() {
    // 几个有意思的日期
    let dates = [
        (1583,  1,  1, "1583年元旦（格里历元年）"),
        (1776,  7,  4, "美国独立宣言签署"),
        (1969,  7, 20, "阿波罗11号登月"),
        (2008,  8,  8, "北京奥运会开幕"),
        (2024,  1,  1, "2024年元旦"),
    ];

    println!("{:<24} 星期", "日期");
    println!("{}", "─".repeat(30));

    for (year, month, day, label) in dates {
        let w = day_of_week(year, month, day);
        println!("{:<24} 星期{}", label, w);
    }
}
```

> 为什么代码里要以 1583 年为基准？

> 1582 年之前，欧洲使用的是儒略历（Julian calendar），它的闰年规则比较简单（每 4 年一闰），但长期积累了误差——到 16 世纪末，历法已经比天文实际多走了约 10 天，导致春分节气漂移，影响复活节的计算。

> 1582 年，罗马教皇格里高利十三世推行格里历（Gregorian calendar，即今天全球通用的公历）：规定整百年只有被 400 整除才算闰年（如 1600、2000 是闰年，而 1700、1800、1900 不是）。为了弥补历史误差，改历时直接删掉了 10 天——1582 年 10 月 4 日（星期四）的第二天变成了 10 月 15 日（星期五），中间 10 天在历史上消失了。

> 本程序使用格里历规则，从格里历正式生效的 1583 年 1 月 1 日起均可正确计算。


## 代码结构速览

不用现在记住语法细节，只看**整体骨架**：

```
fn is_leap_year(...)  → 一个函数：判断闰年
fn days_in_month(...) → 一个函数：返回月份天数
fn day_of_week(...)   → 一个函数：返回"一"/"二"/...
fn main()             → 程序入口：调用上面的函数，打印结果
```

你能注意到的 Rust 特点：

- `fn` 开头定义函数（function 的缩写）
- `//` 是注释，编译器忽略
- `match` 类似其他语言的 `switch`，但更强大
- `for y in 1583..year` 是循环，从 1583 数到 year
- `let` 声明变量，`let mut` 声明可修改的变量

> 这些语法在后续章节里都会逐一讲清楚。现在只需要知道代码可以拆成一个个小函数，每个函数只做一件事——这是好代码的基本样子。


# 你来试试

## 算算你的生日

把下面代码里的日期改成你的生日或者今天，运行看看是哪天。

```
fn is_leap_year(year: u32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

fn days_in_month(year: u32, month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11              => 30,
        2 => if is_leap_year(year) { 29 } else { 28 },
        _  => 0,
    }
}

fn day_of_week(year: u32, month: u32, day: u32) -> &'static str {
    let weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    let mut total_days: u32 = 0;
    for y in 1583..year {
        total_days += if is_leap_year(y) { 366 } else { 365 };
    }
    for m in 1..month {
        total_days += days_in_month(year, m);
    }
    total_days += day - 1;
    weekdays[((total_days + 6) % 7) as usize]
}

fn main() {
    // 把这里改成你的生日 ↓
    let (year, month, day) = (2024, 1, 1);

    println!(
        "{}年{}月{}日 是 星期{}",
        year, month, day,
        day_of_week(year, month, day)
    );
}
```

用手机日历验证一下——结果对吗？

> 适用范围：1583 年及之后的日期均可使用。修改 (year, month, day) = (...) 那一行即可。