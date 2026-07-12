---
title: "内存布局与链接脚本"
description: "最小裸机启动 - 内存布局与链接脚本"
date: "2026-07-12"
order: 3001
tags: ["链接脚本", "linker script", "内存布局", "Flash", "RAM", "BSS", "data段", "text段"]
est_time: "45分钟"
---

# 本章目标

- 理解嵌入式系统中 Flash 和 RAM 的作用和区别
- 了解 mps3-an536 的内存地图（各区域的起始地址和大小）
- 编写一份链接脚本，控制程序各部分的存放位置
- 理解链接脚本中各段（`.text`、`.data`、`.bss`）的含义

## 前置知识

### 已完成的章节

`01-environment-setup/01-project-setup.md` 已完成，项目目录下已有 `Cargo.toml` 和 `.cargo/config.toml`，其中 `rustflags = ["-Tlink.x"]` 指定了链接脚本的文件名。

# mps3-an536 的内存地图

`mps3-an536` 是 ARM 官方提供的一个针对 Cortex-R52 处理器的 FPGA 评估板参考设计。如果你对硬件的所有寄存器定义和完整内存空间分布感兴趣，可以查阅 [ARM 官方的 Application Note 536 (AN536) 文档](https://developer.arm.com/documentation/dai0536/latest/) 以及 [QEMU 官方对应的模拟器支持文档](https://www.qemu.org/docs/master/system/arm/mps2.html)。

<div style="text-align: center; margin: 2rem 0;">
  <img src="/RustRTOS/diagrams/mps3-memory-map.png" alt="mps3-an536 官方内存地图" style="max-width:100%;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
</div>

在本次简易构建之旅中，我们暂时不需要了解全部的外设，把重点先放在最核心的代码和数据存储上：

| 区域 | 起始地址 | 大小 | 结束地址 | 用途 |
| --- | --- | --- | --- | --- |
| Flash（ATCM） | `0x00000000` | 32 KB | `0x00008000` | 存放程序代码和常量 |
| RAM（BRAM） | `0x10000000` | 512 KB | `0x10080000` | 存放运行时数据和栈 |

> **注意：** 在 ARM 官方的内存地图（Memory Map）中，`0x00000000` 实际上标记为 **ATCM**（Tightly Coupled Memory，紧耦合内存），而 `0x10000000` 标记为 **BRAM**（Block RAM）。在这个教学项目中，为了方便理解，我们直接将处于零地址的 ATCM 视作断电不丢失的“Flash”（存放代码指令和常量），CPU 上电后会直接从物理零地址读取第一条指令执行；而把 BRAM 划作读写速度快的“RAM”（存放运行时变量与调用栈）。

# 什么是链接脚本

为了理解链接脚本的作用，我们先简要回顾一下**编译流程**和**CPU执行流程**：

1. **编译流水线**：你写的源文件及其依赖库，会被 Rust 编译器分别翻译成只有机器指令和基本数据的碎片组件（目标文件 `.o`）。此时，不同文件互相调用函数、访问全局变量的具体地址都是 **未确定** 的。最后一道工序交由 **链接器（Linker）** 出马，它负责像拼图一样，把这些碎片组合拼接成一个完整的、含有绝对内存地址的可执行文件。
2. **CPU 执行流程**：当最终的可执行文件烧录到硬件后，芯片一上电，CPU 硬件逻辑固定会从某个特定的物理基地址（比如 Flash 的 `0x00000000`）去读取第一条指令并执行。此后在运行过程中，它会严格按照指令代码里要求的绝对地址去访问相应的 RAM 进行数据读写。

因此，为了保证程序启动时指令能正好被 CPU 取到、变量确实保存在有读写权限的 RAM 里，需要精确安排。在编译文件时会产生很多"段"（section）：

- **`.text`**：机器指令（代码本体）
- **`.rodata`**：只读数据（字符串常量、`const` 变量等）
- **`.data`**：有初始值的全局变量
- **`.bss`**：初始值为零的全局变量

问题来了：**这些段该放到内存的哪个具体物理地址？** 编译器自身并不知道目标板硬件的内存是如何划分的，它不知道 Flash 在 `0x00000000`，也不知道 RAM 具体在 `0x10000000`。

链接脚本就是专门告诉链接器（linker）"请把 `.text` 放到物理 Flash 中，把 `.data` 映射到真实的物理 RAM 地址"的图纸与配置文件。有了它，链接器才能把代码里所有还没确定的符号地址，全部替换重算成目标板卡上真实的绝对物理地址。

> **科普：链接脚本的后缀是 `.ld` 还是 `.x`？**
> 在 C/C++ 的传统嵌入式开发中，链接脚本的后缀名最常见的是 `.ld`（Linker Document 的缩写）。而在 Rust 嵌入式生态中（如著名的 `cortex-m-rt` 库），大家约定俗成地使用 `.x` 作为后缀。
> 实际上，它们在本质上是**毫无区别**的纯文本配置文件，遵循着一模一样的 GNU Linker 语言标准。仅仅因为在上一章 `.cargo/config.toml` 里配置了 `-Tlink.x`，所以我们待会创建的文件就叫 `link.x`；如果你写的是 `-Tlink.ld`，自然就要创建 `link.ld` 文件。

# 编写链接脚本

请在你在上一章创建的项目根目录下（即与 `Cargo.toml` 平级的那个 `rtos` 目录），新建一个名为 `link.x` 的文本文件。

## 步骤一：声明内存区域（MEMORY）

链接脚本的第一部分是 `MEMORY` 块，告诉链接器这块板子有哪些内存、地址在哪、有多大：

```text
MEMORY
{
    FLASH : ORIGIN = 0x00000000, LENGTH = 32K
    RAM   : ORIGIN = 0x10000000, LENGTH = 512K
}
```

每行格式是 `名字 : ORIGIN = 起始地址, LENGTH = 大小`。名字可以自取，后面会用到。

## 步骤二：安排各个段（SECTIONS）

`SECTIONS` 块告诉链接器把哪些段放到哪块内存里：

```text
SECTIONS
{
    .text :
    {
        KEEP(*(.text.reset_handler))
        *(.text .text.*)
        *(.rodata .rodata.*)
    } > FLASH

    .data :
    {
        _sdata = .;
        *(.data .data.*)
        _edata = .;
    } > RAM AT > FLASH

    _sidata = LOADADDR(.data);

    .bss (NOLOAD) :
    {
        _sbss = .;
        *(.bss .bss.*)
        *(COMMON)
        _ebss = .;
    } > RAM

    _stack_start = ORIGIN(RAM) + LENGTH(RAM);
}
```

这里有几个需要解释的细节：

**`.text` 段** 放在 Flash。`KEEP(*(.text.reset_handler))` 表示强制把名为 `reset_handler` 的函数放在最前面——这样它就落在 `0x00000000`，CPU 上电后第一个执行的就是它。后面的 `*(.text .text.*)` 把其余代码追加进来。

**`.data` 段** 有两个地址。`> RAM AT > FLASH` 是关键：

- `AT > FLASH`：**加载地址（LMA）**，这段数据在 Flash 里存放，烧录时写入 Flash
- `> RAM`：**运行地址（VMA）**，程序运行时从 RAM 里读取

为什么要这样？因为有初始值的全局变量（比如 `static mut X: u32 = 42`）的初始值必须存在 Flash 里（断电不丢失），但运行时 CPU 需要读写它，而 Flash 不支持随意写入，所以必须在启动时把这段数据从 Flash 复制到 RAM。这就是 reset handler 第三步要做的事情。

**`_sidata`、`_sdata`、`_edata`** 是三个符号（相当于全局变量），分别记录：
- `_sidata`：`.data` 在 Flash 里的起始地址（复制的来源）
- `_sdata`：`.data` 在 RAM 里的起始地址（复制的目标）
- `_edata`：`.data` 在 RAM 里的结束地址（知道复制多少字节）

reset handler 的汇编代码会读取这三个地址来完成数据段的复制。

**`.bss` 段** 放在 RAM，标记了 `NOLOAD` 表示链接器不为它分配 Flash 空间——零值变量不需要存在 Flash 里，直接在启动时把 RAM 清零就行。`_sbss` 和 `_ebss` 告诉 reset handler 清零的范围。

**`_stack_start`** 设置在 RAM 的最高地址（即：0x10080000，是 0x10000000 + 512K）。栈是从高地址向低地址增长的，所以把栈顶放在 RAM 末尾，向下增长，堆数据从低地址向上，两者相向而行，用满为止。

## 步骤三：完整的 link.x 文件

把前面声明的内存区域和段安排合并，并在最开头加上 `ENTRY` 指令，最终文件如下：

> **提示：`ENTRY(reset_handler)` 的作用**
> 它的作用是在生成的 ELF 执行文件头部打个标记，告诉调试器（比如 GDB）或者模拟器（比如 QEMU）：整个程序的“逻辑入口点”是 `reset_handler`。虽然裸机硬件上电时通常是死板地从零地址或者固定向量表读取指令，但加入 `ENTRY` 能让工具链更聪明地知道程序是从哪里开始的，还可以防止链接器以为这个函数没人调用而把它优化砍掉！

```text
ENTRY(reset_handler)

MEMORY
{
    FLASH : ORIGIN = 0x00000000, LENGTH = 32K
    RAM   : ORIGIN = 0x10000000, LENGTH = 512K
}

SECTIONS
{
    .text :
    {
        KEEP(*(.text.reset_handler))
        *(.text .text.*)
        *(.rodata .rodata.*)
    } > FLASH

    .data :
    {
        _sdata = .;
        *(.data .data.*)
        _edata = .;
    } > RAM AT > FLASH

    _sidata = LOADADDR(.data);

    .bss (NOLOAD) :
    {
        _sbss = .;
        *(.bss .bss.*)
        *(COMMON)
        _ebss = .;
    } > RAM

    _stack_start = ORIGIN(RAM) + LENGTH(RAM);
}
```

将这个文件保存到项目根目录，命名为 `link.x`。

# 验证方法

链接脚本本身无法独立运行，需要在下一篇文章编写 reset handler 和 Rust 入口后，通过 `cargo build` 一并验证。

本文完成后，项目根目录下应该有 `link.x` 文件：

```bash
ls -l link.x
```

预期输出：

```text
-rw-r--r--  1 ...  link.x
```

# 练习题

```quiz single
Q: 嵌入式系统中 Flash 和 RAM 最核心的区别是什么？
- Flash 比 RAM 速度更快
+ Flash 断电后数据不丢失，RAM 断电后数据全部清空
- Flash 可以随意读写，RAM 只能读不能写
- Flash 用于存运行时数据，RAM 用于存代码
E: Flash 是非易失性存储器（断电不丢失），用来存放代码和常量。RAM 是易失性存储器（断电清空），速度快，用来存放运行时变量和栈。两者各司其职。
```

```quiz single
Q: 链接脚本中 `.data > RAM AT > FLASH` 的含义是什么？
- .data 段既放在 RAM 也放在 Flash，两份拷贝同步更新
- .data 段在 RAM 和 Flash 之间自动切换
+ .data 段存储在 Flash（加载地址），运行时在 RAM（运行地址），启动时需要从 Flash 复制到 RAM
- .data 段只存在 RAM，Flash 里没有备份
E: > RAM 指定运行地址（VMA），AT > FLASH 指定加载地址（LMA）。有初始值的全局变量的初始值保存在 Flash，启动时 reset handler 把它们复制到 RAM，之后程序从 RAM 读写这些变量。
```

```quiz single
Q: .bss 段为什么标记 NOLOAD，不占用 Flash 空间？
- 因为 .bss 段的内容太大，Flash 放不下
+ 因为 .bss 段存放初始值为零的变量，启动时直接清零 RAM 即可，不需要在 Flash 里保存任何数据
- 因为 QEMU 模拟器不支持从 Flash 加载 .bss 段
- 因为 .bss 段的变量在程序运行期间不会被修改
E: 初始值为零意味着 Flash 里不需要存任何内容。启动时只需把对应的 RAM 区域清零，比复制数据更简单，也节省了 Flash 空间。
```

```quiz single
Q: 链接脚本中 _stack_start = ORIGIN(RAM) + LENGTH(RAM) 把栈顶设在 RAM 末尾，原因是什么？
- 因为 RAM 末尾的地址最小，方便计算
- 因为 Cortex-R52 规定栈只能从 RAM 末尾开始
+ 因为 ARM 的栈从高地址向低地址增长，把栈顶放在 RAM 末尾，栈向下增长，与堆/数据区相向而行，空间利用最大化
- 因为链接脚本里地址必须按从小到大顺序排列
E: ARM 架构的栈是满递减栈（Full Descending），每次压栈先减 SP 再写数据，也就是从高地址向低地址增长。把 _stack_start 设在 RAM 最高地址，栈就有最大的向下增长空间，同时和从低地址增长的数据区不会一开始就冲突。
```