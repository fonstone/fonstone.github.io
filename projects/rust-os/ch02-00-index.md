---
title: "开发环境搭建"
description: "开发环境搭建 - 开发环境搭建"
date: "2026-07-12"
order: 2000
tags: ["Rust", "nightly", "QEMU", "armv8r-none-eabihf", "工具链", "rustup"]
est_time: "30分钟"
---

# 本章目标

- 安装 Rust nightly 工具链，并配置好编译 Cortex-R52 程序所需的组件
- 安装满足版本要求的 QEMU（8.0+），能够识别 `mps3-an536` 开发板
- 运行验证命令，确认所有工具安装正确

## 前置知识

### Rust 基础语法

你需要了解 Rust 的变量声明、函数、结构体等基本概念。如果还没学过 Rust，建议先读完 [RUST 互动教程](https://xyfx-fhw.github.io/RustCourse/) 的前三章。

### 操作系统

本章支持 **macOS** 和 **Linux**（Ubuntu 24.04 / Debian 12 及更高）。

> **注意：** Windows 用户请先安装 WSL2，之后在 WSL2 内按照本章的 Linux 步骤操作。WSL2 安装方法请参考 [微软官方文档](https://learn.microsoft.com/zh-cn/windows/wsl/install)。

# 安装 Rust 工具链

## 步骤一：安装 rustup

`rustup` 是 Rust 官方的工具链管理器，相当于 Python 生态中的 `pyenv`。有了它，你可以随时安装、切换、更新不同版本的 Rust。

打开终端，运行：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

安装向导出现后，选择 `1) Proceed with standard installation`，回车确认。

安装完成后，让当前终端窗口加载 rustup 的环境变量：

```bash
source "$HOME/.cargo/env"
```

> **注意：** 如果你之前已经安装过 rustup，跳过上面两步，直接继续。可以用 `rustup --version` 确认 rustup 是否已经存在。

## 步骤二：安装 nightly 工具链

### 先解释一个概念：**交叉编译**

我们写代码的电脑是 x86_64 架构，但程序最终要跑在 Cortex-R52（ARM 架构）上。这就像你在中文环境写了一份文件，但要交给只懂英文的读者——你需要一个翻译。Rust 编译器就是这个翻译，通过指定**编译目标（target）**，告诉它把代码翻译成哪种架构的机器指令。本项目使用的 target 是：

```text
armv8r-none-eabihf
```

这串名字是有规律的，可以拆开来理解：

| 部分 | 含义 |
| --- | --- |
| `armv8r` | ARM 第 8 代架构，R 系列（R = Real-time，实时处理器） |
| `none` | 没有操作系统（裸机环境） |
| `eabi` | 嵌入式 ABI，ARM 平台的函数调用规范 |
| `hf` | 硬件浮点（Hard Float），使用处理器内置的 FPU 处理浮点运算 |

Cortex-R52 正是 ARMv8-R 架构，所以这个 target 与之精确匹配。

为了加深理解，这里列举几个其他典型的 target 名称：
- `x86_64-unknown-linux-gnu`：普通的 64 位 Linux 系统（比如常见的云服务器）
- `x86_64-pc-windows-msvc`：常见的 64 位 Windows 系统
- `aarch64-apple-darwin`：Apple Silicon（M1/M2 等）芯片的 macOS 系统
- `thumbv7m-none-eabi`：常见的 ARM Cortex-M3 芯片裸机环境（如某些 STM32 开发板）

### 为什么要用 nightly

现在说说为什么需要 **nightly**，先解释 nightly 是什么。

在步骤一里提到，rustup 类似 pyenv，可以管理多个 Rust 版本。Rust 有两个主要版本：

- **stable**：每六周发布一次的正式版，只包含经过充分测试的稳定功能
- **nightly**：每天从最新开发代码自动构建，包含还在实验阶段的新功能

nightly 就是 Rust 的一个版本，和 Python 3.11、3.12 是一个意思。大多数项目用 stable 就够，但某些实验性功能只在 nightly 里有。

我们需要 nightly 的逻辑链如下：

首先，Rust 编译任何程序都需要依赖一份**标准库**（包含了 `Option`、`Result` 等基础类型定义的 `core`，以及提供各种数据结构和动态内存分配的 `alloc` 等）。它就像盖房需要的水泥和砖块，是编写 Rust 代码的基础设施。这份库也必须是为目标架构编译好的版本，不能用你电脑原生的 x86_64 版本。对于常见平台，Rust 官方会预先编译好这份库，用户直接下载就能用。但 Rust 把平台支持分成了三级：

- **Tier 1 / Tier 2**：Rust 官方提供预编译好的标准库，可以直接下载使用
- **Tier 3**：官方承认这个平台，但**不提供预编译库**，需要用户自己从源码编译

`armv8r-none-eabihf` 是 **Tier 3**。没有现成的库可以下载，我们必须在编译项目时同时从源码编译 `core` 和 `alloc`。

Rust 为此提供了一个专门的编译选项 `-Z build-std`，加上它之后，编译器会自动把标准库的源码也一起编译。**但这个选项目前是实验性功能，只在 nightly 版本中可用**，还没有合入 stable 正式版。

所以结论是：Tier 3 target → 没有预编译库 → 需要 `-Z build-std` → 只能用 nightly。

> **注意：** Tier 3 不代表不好用。`-Z build-std` 在嵌入式社区已经相当成熟，只是 Rust 官方还在走稳定化流程。后续章节会通过 `.cargo/config.toml` 把它配置好，届时每次 `cargo build` 都会自动处理，你感受不到任何差异。

### 安装 nightly

解释了这么多，安装 nightly 就使用下面这条指令即可

```bash
rustup toolchain install nightly
```

这条命令让 rustup 下载并安装最新的 nightly 工具链，过程需要几分钟。

## 步骤三：安装 rust-src 组件

`rust-src` 是 Rust 核心库（`core`、`alloc`、`std` 等）的**源代码**，和平台无关，就是一份普通的 Rust 代码。装一次，所有 target 都能用这同一份源码。

要理解为什么需要它，先搞清楚两个概念：

**`core` 和 `alloc` 是什么？**

我们写 Rust 代码时能直接用的东西，比如 `Option`、`Result`、切片、迭代器……这些都不是凭空出现的，它们定义在 Rust 的核心库里。`core` 是最底层的库，不依赖任何操作系统；`alloc` 在 `core` 基础上加了动态内存分配（`Vec`、`Box` 等）。裸机程序离不开这两个库。

**为什么需要它们的源代码？**

在 Tier 1/2 平台上，Rust 官方会提前把 `core` 和 `alloc` 编译成二进制文件，工具链安装时一并下载好，用的时候直接拿来链接，你完全感觉不到它们的存在。

但 `armv8r-none-eabihf` 是 Tier 3，官方没有为它预编译这些库。我们必须在每次编译自己的项目时，把 `core` 和 `alloc` 也一起从源码编译出来——编译成专门适配 Cortex-R52 的版本，再和我们的代码链接到一起。

`-Z build-std` 就是做这件事的。它需要 `rust-src` 里的源代码作为输入，否则不知道该编译什么。没有 `rust-src`，编译时会直接报错：

```text
error[E0463]: can't find crate for `core`
```

```bash
rustup component add rust-src --toolchain nightly
```

注意这里指定了 `--toolchain nightly`，意思是把 rust-src 安装到 nightly 这个版本下，而不是 stable 版本下——类似 `pip install --python 3.12 xxx` 指定装到某个特定 Python 版本里。

## 步骤四：安装 llvm-tools 组件

编译 Rust 代码后会得到一个 `.elf` 文件（ELF 是一种包含调试信息、符号表的通用可执行格式）。嵌入式开发中经常需要对这个文件做进一步处理，`llvm-tools` 提供了三个常用工具：

- `llvm-objcopy`：把 `.elf` 转成 `.bin` 或 `.hex`——某些情况下 QEMU 和硬件烧录器需要纯二进制格式
- `llvm-size`：查看程序占用了多少 Flash（代码段）和 RAM（数据段），嵌入式芯片内存有限，这个数字很关键
- `llvm-objdump`：把程序反汇编成汇编指令，调试时用来确认编译器生成的代码是否符合预期

这些工具在后面章节才会实际用到，但属于嵌入式开发的标配，环境搭建阶段一起装好，避免后面中途打断：

```bash
rustup component add llvm-tools --toolchain nightly
```

# 安装 QEMU

QEMU 是一款开源的硬件模拟器。可以把它想象成一台"软件做的开发板"——它能在你的电脑上完整模拟一块嵌入式硬件的行为，包括 CPU、内存、外设。我们用它模拟 `mps3-an536` 开发板（一块搭载 Cortex-R52 处理器的 ARM FPGA 评估板）。

`mps3-an536` 这个 machine type 是在 QEMU **8.0** 之后才加入的。如果你装了一个旧版本的 QEMU，后续启动模拟器时会看到这个错误：

```text
qemu-system-arm: -machine mps3-an536: unsupported machine type
```

遇到这个报错，说明 QEMU 版本不够，升级即可。因此这里安装时就需要确保版本 ≥ 8.0。

## macOS

通过 Homebrew 安装。如果你还没有 Homebrew，先安装它：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

然后安装 QEMU：

```bash
brew install qemu
```

Homebrew 会自动安装当前最新稳定版，通常是大于 8.0 版本的，满足要求。

## Linux（Ubuntu / Debian）

Ubuntu 24.04 LTS 及更高版本，系统源里的 QEMU 版本（8.2）已满足要求，直接安装：

```bash
sudo apt update
sudo apt install qemu-system-arm
```

如果你使用的是 Ubuntu 22.04 或更旧的版本，请先查看当前版本：

```bash
qemu-system-arm --version
```

若版本低于 8.0，建议升级系统到 Ubuntu 24.04，或者前往 [QEMU 官方下载页](https://www.qemu.org/download/) 手动下载编译。

> **注意：** Fedora 用户使用 `sudo dnf install qemu-system-arm`；Arch Linux 用户使用 `sudo pacman -S qemu-system-arm`。其他发行版请查阅对应的包管理器文档。

# 验证方法

依次运行以下命令，确认所有工具安装正确：

```bash
rustup --version
rustc +nightly --version
rustup component list --toolchain nightly | grep "rust-src"
rustup component list --toolchain nightly | grep "llvm-tools"
qemu-system-arm --version
```

预期输出（版本号可能不同，但关键信息应与此一致）：

```text
rustup 1.27.x (...)
rustc 1.xx.0-nightly (...)
rust-src (installed)
llvm-tools (installed)
QEMU emulator version 8.x.x (...)
```

检查要点：

- `rustc +nightly --version` 的输出中含有 `nightly`
- `rust-src` 和 `llvm-tools` 显示 `(installed)` 而不是 `(not installed)`
- QEMU 版本号 ≥ 8.0

# 练习题

```quiz single
Q: 为什么本系列必须使用 Rust nightly 而不是 stable？
- 因为 nightly 生成的程序运行更快
- 因为 stable 不支持任何嵌入式目标
+ 因为 armv8r-none-eabihf 是 Tier 3 target，需要 nightly 才有的 -Z build-std 功能在本地编译核心库
- 因为 QEMU 只能运行 nightly 编译出的程序
E: armv8r-none-eabihf 是 Tier 3 target，官方不提供预编译的标准库。我们需要通过 -Z build-std 在本地从源码编译 core 和 alloc，而该功能目前仅在 nightly 中可用，和运行速度、QEMU 兼容性无关。
```

```quiz single
Q: rustup component add rust-src --toolchain nightly 的主要作用是什么？
- 把 nightly 设置为系统默认工具链
- 下载 armv8r-none-eabihf 的预编译标准库
+ 安装 Rust 核心库的源代码，供 -Z build-std 在本地编译时使用
- 安装用于调试裸机程序的 GDB 扩展
E: rust-src 包含的是 core、alloc 等核心库的源代码。裸机目标没有现成的预编译库，-Z build-std 会读取这份源码并在构建时现场编译。它和 GDB、默认工具链切换没有关系。
```

```quiz single
Q: 关于 armv8r-none-eabihf 这个 target 名称，以下哪项解释是错误的？
- armv8r 表示 ARMv8 架构的 R 系列（实时处理器）
- none 表示没有操作系统的裸机环境
+ eabi 表示使用 x86 平台的函数调用规范
- hf 表示使用硬件浮点单元
E: eabi 是 Embedded ABI 的缩写，是 ARM 平台专有的嵌入式函数调用规范，与 x86 毫无关系。x86 有自己独立的 ABI 规范（如 System V AMD64 ABI）。
```

```quiz single
Q: 在 Linux 上安装 QEMU 后发现版本是 6.2.0，应该怎么处理？
- 无需处理，6.2 已经足够运行 Cortex-R52 程序
- 降级使用 Cortex-M 目标，因为它对 QEMU 版本要求更低
- 改用 armv7r-none-eabihf target，它支持旧版 QEMU
+ 升级 QEMU 到 8.0 或更高，mps3-an536 machine type 在此版本之前不存在
E: mps3-an536 是在 QEMU 8.0 之后才加入的 machine type。版本 6.2 运行时会报 unsupported machine type 错误。需要升级 QEMU，这与使用哪个 Rust target 无关。
```