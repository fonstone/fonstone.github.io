---
title: "汇编入口与 Rust no_std 程序"
description: "最小裸机启动 - 汇编入口与 Rust no_std 程序"
date: "2026-07-12"
order: 3002
tags: ["reset handler", "汇编", "no_std", "no_main", "栈初始化", "BSS", "global_asm"]
est_time: "60分钟"
---

# 本章目标

- 理解寄存器和常用汇编指令的基本含义
- 编写 reset handler 完成三步初始化：设置栈、清零 BSS、复制 .data
- 用 `global_asm!` 将汇编嵌入 Rust 源文件
- 编写 `#[no_std]` 的 Rust 入口函数
- 编译成功并在 QEMU 上启动，无报错，程序进入死循环

## 前置知识

### 已完成的章节

`02-minimal-boot/01-memory-layout.md` 已完成，项目目录下已有 `link.x`、`Cargo.toml`、`.cargo/config.toml`。

### 了解 .data 和 .bss 的区别

知道 .data 存有初始值的全局变量、.bss 存零值变量、Flash 断电不丢失而 RAM 会清空。这在上一篇中已经解释过。

# 汇编基础速查

在写 reset handler 之前，先快速了解会用到的汇编概念。不需要系统学汇编，只要能看懂下面这几样东西就够。

## 寄存器是什么

寄存器是 CPU 内部速度最快的一小块存储单元，直接集成在处理器芯片里，访问它不需要经过总线或内存，延迟几乎为零。程序运行时所有的计算（加减乘除、比较、跳转）都必须先把数据搬到寄存器里才能操作——CPU 没有办法直接对内存里的数据做运算。

寄存器分为两类：**通用寄存器**（存临时数据）和**特殊寄存器**（控制 CPU 行为，比如状态标志位）。这里我们先关心通用寄存器和几个有特殊用途的别名。

> **为什么写 Rust 还要了解寄存器？** 正常情况下完全不需要——编译器会自动分配寄存器，你感知不到它们的存在。但我们需要手写一些汇编代码（reset handler），而汇编是直接操作寄存器的。为了理解汇编代码的含义，必须知道寄存器的作用。

Cortex-R52 有 16 个通用寄存器（r0–r15），其中 r0–r12 完全由程序指令控制，r13–r15 虽然程序也能读写，但 CPU 硬件会自动维护它们，因此有固定别名和约定用途。本章会直接用到 **r0–r3**、**sp**、**lr**、**pc**：

| 寄存器 | 别名 | 由谁操作 | 用途 |
| --- | --- | --- | --- |
| `r0` | — | 程序 | 通用临时变量；函数第 1 个参数 / 返回值 |
| `r1` | — | 程序 | 通用临时变量；函数第 2 个参数 |
| `r2` | — | 程序 | 通用临时变量；函数第 3 个参数 |
| `r3` | — | 程序 | 通用临时变量；函数第 4 个参数 |
| `r4`–`r11` | — | 程序 | 通用变量；调用者需要保存后才能使用 |
| `r12` | `ip` | 程序 | 临时寄存器（Intra-Procedure scratch），编译器内部临时用 |
| `r13` | `sp` | 程序 + CPU | 栈指针（Stack Pointer）；`push`/`pop` 时 CPU 自动更新 |
| `r14` | `lr` | 程序 + CPU | 链接寄存器（Link Register）；执行 `bl` 时 CPU 自动写入返回地址 |
| `r15` | `pc` | 程序 + CPU | 程序计数器（Program Counter）；每执行一条指令 CPU 自动 +4 |

类比：把 CPU 想象成一个工人，r0–r12 是他桌上可以随意涂改的便利贴，sp/lr/pc 则是三张有特殊格式的便利贴——工人自己也会维护它们，你轻易别乱动。

## 常用指令速查

| 指令 | 全称 | 含义 | 对应的 C 语言概念 |
| --- | --- | --- | --- |
| `ldr r0, =VALUE` | Load Register | 伪指令，可加载任意 32 位值或符号地址 | `r0 = &VALUE;` （或 `r0 = VALUE;`） |
| `mov r0, #4` | Move | 直接编码进指令的立即数赋值，只能用受限的值 | `r0 = 4;` |
| `str r0, [r1]` | Store Register | 把 r0 的值写入 r1 指向的内存地址 | `*r1 = r0;` |
| `ldr r0, [r1]` | Load Register | 从 r1 指向的内存地址读取值装入 r0 | `r0 = *r1;` |
| `add r0, r0, #4` | Add | r0 = r0 + 4 | `r0 += 4;` |
| `cmp r0, r1` | Compare | 比较 r0 和 r1，结果更新状态标志位 | 供后面的 if 判断使用，如比较两者大小 |
| `bhs LABEL` | Branch if Higher or Same | 如果（上一条比较无符号）≥，跳转到 LABEL | `if (r0 >= r1) goto LABEL;` |
| `b LABEL` | Branch | 无条件跳转到 LABEL | `goto LABEL;` |
| `bl LABEL` | Branch with Link | 跳转到 LABEL，同时把返回地址存入 lr | `LABEL();` （带返回机制的函数调用） |
| `wfi` | Wait For Interrupt | 让 CPU 进入低功耗等待状态 | 休眠指令，如 `SLEEP();` |

> **`mov` 和 `ldr =` 有什么区别？**
>
> 每条 ARM32 指令本身只有 32 位宽，除了操作码之外，留给"立即数"的编码空间非常有限（大约只有 12 位）。这意味着 `mov` 能直接写进指令的数值是有限制的，只有满足特定编码规则的值才合法（比如 `0`、`4`、`255`、`0x100` 可以，而 `0x10000000` 这样的地址几乎都不行）。
>
> `ldr r0, =VALUE` 则是一条**伪指令**——汇编器看到它时会做两件事：① 把那个 32 位值存到代码附近一块叫"字面量池（Literal Pool）"的内存里；② 生成一条真实的 `ldr`，用 PC 相对寻址去读这个值。最终能加载任意 32 位数或符号地址，没有限制。
>
> 简单记：**写死的小数字用 `mov`，地址或不确定能不能编码的数值用 `ldr =`**。

## 数字标签与跳转

汇编里用数字做局部标签，`1b` 表示"向前找最近的 `1:` 标签"，`2f` 表示"向后找最近的 `2:` 标签"：

```asm
1:
    ...
    b 1b    @ 跳回上面的 1:，形成循环
    ...
2:          @ 这里是循环结束的位置
    bhs 2f  @ 条件成立时，跳到下面的 2:
    ...
```

# 汇编与 Rust 的无缝结合 (src/main.rs)

在开发这类裸机程序时，传统的做法是分开写一个 `.s` 汇编文件和一个 `.c` 源文件然后再进行链接。但在 Rust 中，我们可以直接使用 `global_asm!` 宏，把底层的初始化汇编代码和高层的业务 Rust 代码优雅地放在同一个文件里。

请打开你的 `src/main.rs` 文件清空默认内容。接下来我们要在这个文件里完成两大核心任务：编写汇编启动入口（`reset_handler`）以及编写 Rust 运行入口（`rust_main`）。

## 第一部分：理清汇编层的初始化逻辑

在将代码完整塞进源文件之前，我们需要先了解一下：CPU 上电后，必须通过纯汇编代码完成哪五个底层的环境初始化操作？

### 声明并安放汇编入口点

每一段汇编代码都需要告诉汇编器它应该被放到哪里，以及是否允许外部调用。
在刚开始时，我们要先写下这两行：

```asm
    // 放在 .text.reset_handler 节，链接脚本会把它放到 0x00000000
    .section .text.reset_handler, "ax"
    .global reset_handler
```

- **`.section .text.reset_handler, "ax"`**：这是一句编译指令（Directive）。它告诉汇编器把接下来的代码放到名叫 `.text.reset_handler` 的特殊段（Section）里。末尾的 `"ax"` 表示这段内存应当分配且具有可执行权限（Allocatable & Executable）。我们在上一节链接脚本里写过，把 `.text.reset_handler` 固定在 `0x00000000` 首地址，这句指令就完美地跟链接脚本配合在了一起。
- **`.global reset_handler`**：将 `reset_handler` 这个标签暴露成全局符号。这相当于在一个 C 文件里写非 `static` 函数，其他文件也能”看到”它。

---

### 检测并切换 CPU 运行模式 (HYP -> SVC)

> **科普：什么是 HYP 和 SVC 模式？**
> 像 Cortex-R52 这种复杂的 ARM 处理器，并非只有一种运行状态。为了安全和权限管理，它划分了多种**特权模式**：
> - **USR (User)**：最低权限，普通第三方应用程序运行在这里。
> - **SVC (Supervisor)**：特权/超级管理员模式，我们的**操作系统内核**（RTOS）默认且通常运行在这个模式，拥有直接管理外设寄存器的全权。
> - **HYP (Hypervisor)**：虚拟化管理模式，权限比 SVC 还高，用于在一颗物理芯片上同时跑多个独立操作系统（虚拟机管理）。
>
> **为什么要做切换？**
> Cortex-R52 在 mps3-an536 刚上电时，由于它本身支持虚拟化，所以直接以权限最高的 **HYP 模式（0x1A）** 启动。但由于我们只是编写一个简单的 RTOS，没有虚拟化需求，所以我们希望把 CPU 切换到 **SVC 模式（0x13）**，以便后续的操作系统内核代码能正常访问外设寄存器。

解决方案是在启动最开头检测是否处于 HYP 模式，如果是，主动“降级”并立刻用 `eret` 切换到 SVC 模式：

```asm
reset_handler:
    @ 检测 HYP 模式（mps3-an536 以 HYP 启动）
    mrs r0, cpsr
    and r0, r0, #0x1f      @ 取出 CPSR.M（模式位）
    cmp r0, #0x1a          @ 0x1a = HYP 模式
    bne .Lnormal_init      @ 不是 HYP，跳过切换，跳转到 .Lnormal_init（接下来会讲到）

    @ 在 HYP 模式：设置 SPSR_hyp = SVC + I+F 禁用，然后 ERET
    mov r0, #0xd3          @ SVC 模式（AArch32 EL1）| I=1 | F=1
    msr spsr_cxsf, r0
    adr r0, .Lnormal_init  @ 切换后的入口地址
    msr elr_hyp, r0
    eret                   @ 切换到 SVC 模式
```

- **`reset_handler:`**：标志这段代码在这里真正开始。也就是上面通过`.global reset_handler`暴露的全局符号。注意`.global reset_handler`和`text.reset_handler`里都有`reset_handler`，但是作用不同，前者是”函数符号”，后者是”内存布局”。
- **`.L` 前缀的含义**：`.Lnormal_init` 中的 `.L` 是 GNU 汇编器的局部标签约定——带 `.L` 的标签不会出现在最终的符号表里，链接器和调试器都看不到它，只是文件内部的跳转锚点。`reset_handler` 没有 `.L` 前缀，加上 `.global` 后才能被链接器识别为全局入口。

**先理解整体逻辑再看每行：**

在 HYP 模式下，CPU **不允许**用 `msr cpsr, r0` 直接改写 CPSR 来降级——这是 ARM 的安全限制。`eret`（Exception Return）是**唯一能退出 HYP 模式的指令**，它执行时会原子地做两件事：① 把 `spsr_hyp` 的值写入 CPSR（决定切换后的模式）；② 把 `elr_hyp` 的值写入 PC（决定切换后跳到哪里执行）。

因此整个逻辑是：**先把”目标模式”填进 `spsr_hyp`，把”目标地址”填进 `elr_hyp`，然后 `eret` 一步到位完成切换**。前面五行都是在为这两个寄存器”填表”：

- **`mrs r0, cpsr`**：把 `cpsr`（Current Program Status Register，当前程序状态寄存器）读入 `r0`，它记录了 CPU 当前的运行模式等标志位。
- **`and r0, r0, #0x1f`**：按位与，`0x1f`=`0b00011111`，保留 `cpsr` 的低 5 位（模式字段），其余位清零。
- **`cmp r0, #0x1a`**：对比模式编号是否等于 `0x1a`（HYP），结果写入状态标志位。
- **`bne .Lnormal_init`**：`bne`（Branch if Not Equal）——不是 HYP 模式就直接跳过切换，进入正常初始化。
- **`mov r0, #0xd3`**：构造目标 CPSR 值：`0xd3` = SVC 模式（`0x13`）| `I=1`（禁 IRQ）| `F=1`（禁 FIQ）。
- **`msr spsr_cxsf, r0`**：把构造好的目标模式写入 `spsr_hyp`（`cxsf` 是字段掩码，表示写入全部字段）。`eret` 会把它恢复成 CPSR。
- **`adr r0, .Lnormal_init`**：把标签 `.Lnormal_init` 的地址装入 `r0`，即切换后要跳到的位置。
- **`msr elr_hyp, r0`**：把目标地址写入 `elr_hyp`。`eret` 会把它装入 PC。
- **`eret`**：原子执行——`spsr_hyp` → CPSR（切换到 SVC 模式），`elr_hyp` → PC（跳到 `.Lnormal_init`），模式切换完成。

### 初始化栈、清零 BSS、复制 .data、跳转 Rust

完整的后半段代码如下（`.Lnormal_init:` 是内部跳转锚点，加 `.L` 前缀使其不进符号表；后面的数字标签 `1:`/`2:` 则是 GNU 汇编器内置的永远局部的标签类型，天生不会进符号表，无需任何前缀）：

```asm
.Lnormal_init:
    @ 1. 设置栈指针
    ldr sp, =_stack_start

    @ 2. 清零 BSS 段
    ldr r0, =_sbss
    ldr r1, =_ebss
    mov r2, #0
1:
    cmp r0, r1
    bhs 2f
    str r2, [r0]
    add r0, r0, #4
    b 1b
2:
    @ 3. 复制 .data 段从 Flash 到 RAM
    ldr r0, =_sdata
    ldr r1, =_edata
    ldr r2, =_sidata
3:
    cmp r0, r1
    bhs 4f
    ldr r3, [r2]
    str r3, [r0]
    add r0, r0, #4
    add r2, r2, #4
    b 3b
4:
    @ 4. 跳转到 Rust 入口
    bl rust_main
5:
    wfi
    b 5b
```

逐段说明：

#### 设置栈指针

CPU 上电时 `sp` 的值不确定，必须先把它设好，后续的函数调用才能正常压栈出栈。`_stack_start` 是链接脚本里定义的 RAM 末尾地址（`0x10080000`），栈从高地址向低地址增长。

`.bss` 存放初始值为零的全局变量。RAM 上电内容随机，必须手动把这段内存清零。

```asm
    @ 2. 清零 BSS 段
    ldr r0, =_sbss
    ldr r1, =_ebss
    mov r2, #0
1:
    cmp r0, r1
    bhs 2f
    str r2, [r0]
    add r0, r0, #4
    b 1b
2:
```

逐行说明：

- **`ldr r0, =_sbss`**：把链接脚本里的 `_sbss`（BSS 段起始地址）装入 `r0`，作为"当前写入指针"。
- **`ldr r1, =_ebss`**：把 `_ebss`（BSS 段结束地址）装入 `r1`，作为循环终止条件。
- **`mov r2, #0`**：`r2` 固定存 `0`，每次用它写入内存。
- **`1:`**：循环入口标签。
- **`cmp r0, r1`**：比较当前指针和终止地址，结果存入状态标志位（不改变 r0/r1）。
- **`bhs 2f`**：`r0 >= r1` 时跳到标签 `2:`，退出循环（已写完）。
- **`str r2, [r0]`**：把 `r2`（值为 0）写入 `r0` 指向的内存地址。
- **`add r0, r0, #4`**：指针后移 4 字节，指向下一个待清零的位置。
- **`b 1b`**：无条件跳回标签 `1:`，继续循环。
- **`2:`**：循环出口标签，清零完成后继续执行后面的代码。

> **语法小提示：`1:` / `2:` / `b 1b` / `bhs 2f`**
> 这是 GNU 汇编的**局部数字标签**语法：`b`=backward（跳到上方最近的该标签），`f`=forward（跳到下方最近的该标签），省去给每个小循环起名的麻烦。

用伪代码翻译成你熟悉的语言大概是这样：

```text
r0 = _sbss   // 当前写入地址，从 BSS 起始开始
r1 = _ebss   // 终止地址
r2 = 0       // 要写入的值

while r0 < r1:
    *r0 = 0      // 向 r0 指向的地址写 0
    r0 += 4      // 指针后移 4 字节（一个 u32 的大小）
```

#### 复制 .data 段（Flash → RAM）

```asm
2:
    @ 3. 复制 .data 段从 Flash 到 RAM
    ldr r0, =_sdata
    ldr r1, =_edata
    ldr r2, =_sidata
3:
    cmp r0, r1
    bhs 4f
    ldr r3, [r2]
    str r3, [r0]
    add r0, r0, #4
    add r2, r2, #4
    b 3b
4:
```

有初始值的全局变量（如 `static mut X: u32 = 42`）的初始值存在 Flash（`_sidata`），但运行时必须在 RAM 里读写。用 `r2` 从 Flash 逐字读、`r0` 逐字写到 RAM，直到 `r0 >= r1`（即 `_edata`）为止。

#### 跳转到 Rust

```asm
4:
    @ 4. 跳转到 Rust 入口
    bl rust_main
5:
    wfi
    b 5b
```

`bl rust_main` 把控制权交给 Rust。`rust_main` 正常情况下不会返回（它的返回类型是 `!`），但后面的 `wfi` + 死循环是保底防线——万一意外返回，CPU 进入低功耗等待，不会乱跑。


## 第二部分：编写完整的 src/main.rs

现在你已经理解了底层的 5 步初始化干了什么。我们使用 `global_asm!` 把这些汇编字符串逐行嵌入到 Rust 中，顺便将 `rust_main` 写在底下。

把你刚刚清空的 `src/main.rs` 替换为以下全部内容：

```rust
#![no_std]
#![no_main]

use core::arch::global_asm;
use core::panic::PanicInfo;

global_asm!(r#"
    @ 放在 .text.reset_handler 节，链接脚本会把它放到 0x00000000
    .section .text.reset_handler, "ax"
    .global reset_handler
reset_handler:

    @ 0. 检测 HYP 模式（mps3-an536 以 HYP 模式启动），切换到 SVC
    mrs r0, cpsr
    and r0, r0, #0x1f
    cmp r0, #0x1a
    bne .Lnormal_init
    mov r0, #0xd3
    msr spsr_cxsf, r0      @ SVC 模式（AArch32 EL1），禁 IRQ/FIQ
    adr r0, .Lnormal_init
    msr elr_hyp, r0
    eret
.Lnormal_init:

    @ 1. 设置栈指针
    ldr sp, =_stack_start

    @ 2. 清零 BSS 段
    ldr r0, =_sbss
    ldr r1, =_ebss
    mov r2, #0
1:
    cmp r0, r1
    bhs 2f
    str r2, [r0]
    add r0, r0, #4
    b 1b
2:

    @ 3. 复制 .data 段从 Flash 到 RAM
    ldr r0, =_sdata
    ldr r1, =_edata
    ldr r2, =_sidata
3:
    cmp r0, r1
    bhs 4f
    ldr r3, [r2]
    str r3, [r0]
    add r0, r0, #4
    add r2, r2, #4
    b 3b
4:

    @ 4. 跳转到 Rust 入口
    bl rust_main

    @ 安全保底死循环
5:
    wfi
    b 5b
"#);

/// 程序真正的入口。reset handler 搞定一切脏活累活后就往这儿跳。
#[unsafe(no_mangle)]
pub extern "C" fn rust_main() -> ! {
    loop {}
}

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}
```

## 第三部分：关键 Rust 特性解析

在以上的 Rust 代码中，出现了一些系统级编程才会见到的宏与修饰符：

`#![no_std]` — 不链接依赖操作系统的 `std` 标准库，改用裸机可用的 `core`。

`#![no_main]` — 告诉编译器不要寻找普通的 `fn main()`，程序入口由我们自己控制（就是 `reset_handler`）。

`#[unsafe(no_mangle)]` — 禁止编译器修改函数名。如果没有这个，Rust 会把 `rust_main` 编译成类似 `_ZN4rtos9rust_mainE` 的乱码名，汇编里的 `bl rust_main` 就找不到它了。

`extern "C"` — 使用 C 语言的调用规范（ABI）。汇编直接调用此函数，必须和汇编约定的调用规范一致。

`-> !` — 函数类型签名中 `!` 表示"永不返回"（Never 类型）。`loop {}` 死循环确保了这一点。

`#[panic_handler]` — 在普通的 Rust 程序中，遇到 `panic!`（致命错误）时，标准库会负责把错误打印到终端并退出程序。但在 `#![no_std]` 的裸机环境下没有标准库，编译器要求我们**必须亲自接管 panic 的处理逻辑**。目前我们在里面放了一个死循环，只要程序发生崩溃就把 CPU 卡死在这里防止产生更危险的行为。后续我们有了串口驱动后，还会把这里的 `_info` 参数利用起来，将代码文件路径和崩溃报错信息输出到屏幕上以供调试！

# 验证方法

## 编译验证

```bash
cargo build
```

预期输出：

```text
   Compiling core v0.0.0 (...)
   Compiling rtos v0.1.0 (...)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in Xs
```

无警告，无错误。

## 符号地址验证

```bash
rust-nm target/armv8r-none-eabihf/debug/rtos | grep -E "reset_handler|rust_main|_stack_start"
```

预期输出：

```text
00000000 T reset_handler
00000094 T rust_main
10080000 A _stack_start
```

- `reset_handler` 在 `0x00000000`——CPU 上电第一条指令就是它 ✓
- `rust_main` 紧随其后在 Flash 里 ✓
- `_stack_start` 在 `0x10080000`（BRAM 末尾）✓

## QEMU 启动验证

```bash
qemu-system-arm \
  -machine mps3-an536 \
  -nographic \
  -device loader,file=target/armv8r-none-eabihf/debug/rtos
```

程序会进入 `loop {}`，QEMU 保持运行不退出、不报错。用 **Ctrl+A 然后按 X（Ctrl+A 后可能没有反应，没关系继续按 X）** 退出 QEMU。

> **注意：** 目前没有任何输出，屏幕一片空白是正常的——我们还没有实现 UART 驱动。下一章会在 `rust_main` 里加上串口输出，届时就能看到程序实际在跑了。

# 练习题

```quiz single
Q: reset handler 中必须在调用 rust_main 之前完成的操作，以下哪一项最关键？
- 初始化 UART 外设，否则无法输出调试信息
- 启用 CPU 缓存，否则程序运行太慢
+ 设置栈指针（SP），否则 rust_main 中的任何函数调用都会因无效栈而崩溃
- 初始化中断控制器，否则 Rust 代码无法运行
E: 函数调用依赖栈来保存返回地址和局部变量。SP 未设置时栈指针指向随机地址，第一次 push/函数调用就会写到非法内存，程序立即崩溃。UART、缓存、中断控制器都可以后续初始化。
```

```quiz single
Q: 为什么清零 BSS 段要由我们自己在 reset handler 里手动完成，而不是 CPU 自动做？
+ 因为 RAM 上电后内容随机，C/Rust 语言规范保证零值变量初始为零，但硬件不提供这个保证，必须软件实现
- 因为 Cortex-R52 没有硬件清零功能
- 因为 BSS 段太大，CPU 清零太慢
- 因为链接脚本无法自动清零内存
E: C 和 Rust 语言标准规定全局零值变量（BSS 段）在程序启动时必须为零。但"程序启动"指的是语言运行时开始前，硬件只负责上电，不保证 RAM 的初始值。所以这个工作必须由启动代码（reset handler）在进入语言运行时前完成。
```

```quiz single
Q: #[unsafe(no_mangle)] 属性的作用是什么？
- 防止编译器优化掉这个函数
- 把函数放到特定的内存段
- 让函数可以被中断处理程序调用
+ 禁止编译器对函数名进行名称修饰（mangling），确保汇编代码能通过原始名称找到这个函数
E: Rust（和 C++）编译器会对函数名进行"名称修饰"，在编译后的符号表里变成包含类型信息的乱码名字。#[unsafe(no_mangle)] 禁止这个行为，让函数名在符号表里保持原样。汇编里 bl rust_main 依赖函数名的原始形式，少了这个属性链接器就找不到 rust_main。
```

```quiz single
Q: global_asm! 宏把汇编放在 .text.reset_handler 节，链接脚本里的哪一行保证了它被放在 0x00000000？
- .text : { *(.text .text.*) } > FLASH
- ENTRY(reset_handler) 指令直接把函数放在地址 0
- FLASH : ORIGIN = 0x00000000 规定了所有代码的起始地址
+ KEEP(*(.text.reset_handler)) 在 .text 块的第一行，确保该节被放在 Flash 最开头
E: KEEP(*(.text.reset_handler)) 在 .text 段的 SECTIONS 块里是第一条规则，链接器按顺序处理，所以 .text.reset_handler 节的内容被放在 .text 段的最前面。.text 段起始地址是 FLASH 的 ORIGIN，也就是 0x00000000。ENTRY() 只是声明 ELF 入口点，不改变代码的实际地址。
```