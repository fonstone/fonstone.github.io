---
title: "内核第一条指令（实践篇）"
description: "承接上一节，本节我们将实践在 Qemu 上执行内核的第一条指令。首先我们编写内核第一条指令并嵌入到我们的内核项目中，接着指定内核的内存布局使得我们的内核可以正确对接到 Qemu 中。由于 Qemu 的文件加载功能过于简单..."
date: "2026-07-12"
order: 19
tags: ["第一条指令", "内核入口", "汇编", "RISC-V", "QEMU"]
est_time: "45分钟"
---
## 本节导读

承接上一节，本节我们将实践在 Qemu 上执行内核的第一条指令。首先我们编写内核第一条指令并嵌入到我们的内核项目中，接着指定内核的内存布局使得我们的内核可以正确对接到 Qemu 中。由于 Qemu 的文件加载功能过于简单，它不支持完整的可执行文件，因此我们从内核可执行文件中剥离多余的元数据得到内核镜像并提供给 Qemu 。最后，我们使用 GDB 来跟踪 Qemu 的整个启动流程并验证内核的第一条指令被正确执行。

提示：在进入本节之前请参考 5setup-devel-env 安装配置 Rust 相关软件包、Qemu软件和 GDB 调试工具等。

## 编写内核第一条指令

首先，我们需要编写进入内核后的第一条指令，这样更方便我们验证我们的内核镜像是否正确对接到 Qemu 上。

```
# os/src/entry.asm
    .section .text.entry
    .globl _start
_start:
    li x1, 100
```

实际的指令位于第 5 行，也即 li x1, 100 。 li 是 Load Immediate 的缩写，也即将一个立即数加载到某个寄存器，因此这条指令可以看做将寄存器 x1 赋值为 100 。第 4 行我们声明了一个符号 \_start ，该符号指向紧跟在符号后面的内容——也就是位于第 5 行的指令，因此符号 \_start 的地址即为第 5 行的指令所在的地址。第 3 行我们告知编译器 \_start 是一个全局符号，因此可以被其他目标文件使用。第 2 行表明我们希望将第 2 行后面的内容全部放到一个名为 .text.entry 的段中。一般情况下，所有的代码都被放到一个名为 .text 的代码段中，这里我们将其命名为 .text.entry 从而区别于其他 .text 的目的在于我们想要确保该段被放置在相比任何其他代码段更低的地址上。这样，作为内核的入口点，这段指令才能被最先执行。

接着，我们在 main.rs 中嵌入这段汇编代码，这样 Rust 编译器才能够注意到它，不然编译器会认为它是一个与项目无关的文件：

```
// os/src/main.rs
#![no_std]
#![no_main]

mod lang_items;

use core::arch::global_asm;
global_asm!(include_str!("entry.asm"));
```

第 8 行，我们通过 include\_str! 宏将同目录下的汇编代码 entry.asm 转化为字符串并通过 global\_asm! 宏嵌入到代码中。

## 调整内核的内存布局

由于链接器默认的内存布局并不能符合我们的要求，为了实现与 Qemu 正确对接，我们可以通过 **链接脚本** (Linker Script) 调整链接器的行为，使得最终生成的可执行文件的内存布局符合Qemu的预期，即内核第一条指令的地址应该位于 0x80200000 。我们修改 Cargo 的配置文件来使用我们自己的链接脚本 os/src/linker.ld 而非使用默认的内存布局：

```
// os/.cargo/config
[build]
target = "riscv64gc-unknown-none-elf"

[target.riscv64gc-unknown-none-elf]
rustflags = [
    "-Clink-arg=-Tsrc/linker.ld", "-Cforce-frame-pointers=yes"
]
```

链接脚本 os/src/linker.ld 如下：

```
OUTPUT_ARCH(riscv)
ENTRY(_start)
BASE_ADDRESS = 0x80200000;

SECTIONS
{
    . = BASE_ADDRESS;
    skernel = .;

    stext = .;
    .text : {
        *(.text.entry)
        *(.text .text.*)
    }

    . = ALIGN(4K);
    etext = .;
    srodata = .;
    .rodata : {
        *(.rodata .rodata.*)
        *(.srodata .srodata.*)
    }

    . = ALIGN(4K);
    erodata = .;
    sdata = .;
    .data : {
        *(.data .data.*)
        *(.sdata .sdata.*)
    }

    . = ALIGN(4K);
    edata = .;
    .bss : {
        *(.bss.stack)
        sbss = .;
        *(.bss .bss.*)
        *(.sbss .sbss.*)
    }

    . = ALIGN(4K);
    ebss = .;
    ekernel = .;

    /DISCARD/ : {
        *(.eh_frame)
    }
}
```

第 1 行我们设置了目标平台为 riscv ；第 2 行我们设置了整个程序的入口点为之前定义的全局符号 \_start；

第 3 行定义了一个常量 BASE\_ADDRESS 为 0x80200000 ，也就是我们之前提到内核的初始化代码被放置的地址；

从第 5 行开始体现了链接过程中对输入的目标文件的段的合并。其中 . 表示当前地址，也就是链接器会从它指向的位置开始往下放置从输入的目标文件中收集来的段。我们可以对 . 进行赋值来调整接下来的段放在哪里，也可以创建一些全局符号赋值为 . 从而记录这一时刻的位置。我们还能够看到这样的格式：

```
.rodata : {
    *(.rodata)
}
```

冒号前面表示最终生成的可执行文件的一个段的名字，花括号内按照放置顺序描述将所有输入目标文件的哪些段放在这个段中，每一行格式为 <ObjectFile>(SectionName)，表示目标文件 ObjectFile 的名为 SectionName 的段需要被放进去。我们也可以使用通配符来书写 <ObjectFile> 和 <SectionName> 分别表示可能的输入目标文件和段名。因此，最终的合并结果是，在最终可执行文件中各个常见的段 .text, .rodata .data, .bss 从低地址到高地址按顺序放置，每个段里面都包括了所有输入目标文件的同名段，且每个段都有两个全局符号给出了它的开始和结束地址（比如 .text 段的开始和结束地址分别是 stext 和 etext ）。

第 12 行我们将包含内核第一条指令的 .text.entry 段放在最终的 .text 段的最开头，同时注意到在最终内存布局中代码段 .text 又是先于任何其他段的。因为所有的段都从 BASE\_ADDRESS 也即 0x80200000 开始放置，这就能够保证内核的第一条指令正好放在 0x80200000 从而能够正确对接到 Qemu 上。

此后我们便可以生成内核可执行文件，切换到 os 目录下并进行以下操作：

```
$ cargo build --release
Finished release [optimized] target(s) in 0.10s
$ file target/riscv64gc-unknown-none-elf/release/os
target/riscv64gc-unknown-none-elf/release/os: ELF 64-bit LSB executable, UCB RISC-V, version 1 (SYSV), statically linked, not stripped
```

我们以 release 模式生成了内核可执行文件，它的位置在 os/target/riscv64gc.../release/os 。接着我们通过 file 工具查看它的属性，可以看到它是一个运行在 64 位 RISC-V 架构计算机上的可执行文件，它是静态链接得到的。

> **Note**
>
> **思考： 0x80200000 可否改为其他地址？**
>
> 首先需要区分绝对地址和相对地址。在对编译器进行某些设置的情况下，在访问变量或函数时，可以通过它们所在地址与当前某个寄存器（如 PC）的相对地址而非它们位于的绝对地址来访问这些变量或函数。比如，在一个起始地址（即上面提到的 BASE\_ADDRESS ）固定为 0x80200000 的内存布局中，某个函数入口位于 0x80201111 处，那么我们可以使用其绝对地址 0x80201111 来访问它。但是，如果一条位于 0x80200111 指令会调用该函数，那么这条指令也不一定要用到绝对地址 0x80201111 ，而是用函数入口地址相对于当前指令地址 0x80200111 的相对地址 0x1000 （计算方式为函数入口地址与当前指令地址之差值）来找到并调用该函数。
>
> 如果一个程序全程都使用相对地址而不依赖任何绝对地址，那么只要保持好各段之间的相对位置不发生变化，将程序整体加载到内存中的任意位置程序均可正常运行。在这种情况下， BASE\_ADDRESS 可以为任意值，我们可以将程序在内存中随意平移。这种程序被称为 **位置无关可执行文件（PIE，Position-independent Executable）** 。相对的，如果程序依赖绝对地址，那么它一定有一个确定的内存布局，而且该程序必须被加载到与其内存布局一致的位置才能正常运行。由于我们的内核并不是位置无关的，所以我们必须将内存布局的起始地址设置为 0x80200000 ，与之匹配我们也必须将内核加载到这一地址。

> **Note**
>
> **静态链接与动态链接**
>
> 静态链接是指程序在编译时就将所有用到的函数库的目标文件链接到可执行文件中，这样会导致可执行文件容量较大，占用硬盘空间；而动态链接是指程序在编译时仅在可执行文件中记录用到哪些函数库和在这些函数库中用到了哪些符号，在操作系统执行该程序准备将可执行文件加载到内存时，操作系统会检查这些被记录的信息，将用到的函数库的代码和数据和程序一并加载到内存，并进行一些重定位工作，即对装入内存的目标程序中的指令或数据的内存地址进行修改，确保程序运行时能正确找到相关函数或数据。使用动态链接可以显著缩减可执行文件的容量，并使得程序不必在函数库更新后重新链接依然可用。
>
> 根据以往的经验， Qemu 模拟的计算机不支持在加载时动态链接，因此我们的内核采用静态链接进行编译。

## 手动加载内核可执行文件

上面得到的内核可执行文件完全符合我们对于内存布局的要求，但是我们不能将其直接提交给 Qemu ，因为它除了实际会被用到的代码和数据段之外还有一些多余的元数据，这些元数据无法被 Qemu 在加载文件时利用，且会使代码和数据段被加载到错误的位置。如下图所示：

**丢弃元数据前后的内核可执行文件被加载到 Qemu 上的情形**

![load-into-qemu.png](/images/rust-os/rcore/chapter1/load-into-qemu.png)

图中，红色的区域表示内核可执行文件中的元数据，深蓝色的区域表示各个段（包括代码段和数据段），而浅蓝色区域则表示内核被执行的第一条指令，它位于深蓝色区域的开头。图示的上半部分中，我们直接将内核可执行文件 os 提交给 Qemu ，而 Qemu 会将整个可执行文件不加处理的加载到 Qemu 内存的 0x80200000 处，由于内核可执行文件的开头是一段元数据，这会导致 Qemu 内存 0x80200000 处无法找到内核第一条指令，也就意味着 RustSBI 无法正常将计算机控制权转交给内核。相反，图示的下半部分中，将元数据丢弃得到的内核镜像 os.bin 被加载到 Qemu 之后，则可以在 0x80200000 处正确找到内核第一条指令。如果想要深入了解这些元数据的内容，可以参考 index 。

使用如下命令可以丢弃内核可执行文件中的元数据得到内核镜像：

```
$ rust-objcopy --strip-all target/riscv64gc-unknown-none-elf/release/os -O binary target/riscv64gc-unknown-none-elf/release/os.bin
```

我们可以使用 stat 工具来比较内核可执行文件和内核镜像的大小：

```
$ stat target/riscv64gc-unknown-none-elf/release/os
File: target/riscv64gc-unknown-none-elf/release/os
Size: 1016              Blocks: 8          IO Block: 4096   regular file
...
$ stat target/riscv64gc-unknown-none-elf/release/os.bin
File: target/riscv64gc-unknown-none-elf/release/os.bin
Size: 4                 Blocks: 8          IO Block: 4096   regular file
...
```

可以看到，内核镜像的大小仅有 4 字节，这是因为它里面仅包含我们在 entry.asm 中编写的一条指令。一般情况下 RISC-V 架构的一条指令位宽即为 4 字节。而内核可执行文件由于包含了两部分元数据，其大小达到了 1016 字节。这些元数据能够帮助我们更加灵活地加载并使用可执行文件，比如在加载时完成一些重定位工作或者动态链接。不过由于 Qemu 的加载功能过于简单，我们只能将这些元数据丢弃再交给 Qemu 。从某种意义上可以理解为我们手动帮助 Qemu 完成了可执行文件的加载。

> **Note**
>
> **新版 Qemu 支持直接加载 ELF**
>
> 经过我们的实验，至少在 Qemu 7.0.0 版本后，我们可以直接将内核可执行文件 os 提交给 Qemu 而不必进行任何元数据的裁剪工作，这种情况下我们的内核也能正常运行。其具体做法为：将 Qemu 的参数替换为 -device loader,file=path/to/os 。但是，我们仍推荐大家了解并在代码框架和文档中保留这一流程，原因在于这种做法更加通用，对环境和工具的依赖程度更低。

## 基于 GDB 验证启动流程

在 os 目录下通过以下命令启动 Qemu 并加载 RustSBI 和内核镜像：

```
$ qemu-system-riscv64 \
    -machine virt \
    -nographic \
    -bios ../bootloader/rustsbi-qemu.bin \
    -device loader,file=target/riscv64gc-unknown-none-elf/release/os.bin,addr=0x80200000 \
    -s -S
```

-s 可以使 Qemu 监听本地 TCP 端口 1234 等待 GDB 客户端连接，而 -S 可以使 Qemu 在收到 GDB 的请求后再开始运行。因此，Qemu 暂时没有任何输出。注意，如果不想通过 GDB 对于 Qemu 进行调试而是直接运行 Qemu 的话，则要删掉最后一行的 -s -S 。

打开另一个终端，启动一个 GDB 客户端连接到 Qemu ：

```
$ riscv64-unknown-elf-gdb \
    -ex 'file target/riscv64gc-unknown-none-elf/release/os' \
    -ex 'set arch riscv:rv64' \
    -ex 'target remote localhost:1234'
[GDB output]
0x0000000000001000 in ?? ()
```

可以看到，正如我们在上一节提到的那样，Qemu 启动后 PC 被初始化为 0x1000 。我们可以检查一下 Qemu 的启动固件的内容：

```
$ (gdb) x/10i $pc
=> 0x1000:  auipc   t0,0x0
0x1004:     addi    a1,t0,32
0x1008:     csrr    a0,mhartid
0x100c:     ld      t0,24(t0)
0x1010:     jr      t0
0x1014:     unimp
0x1016:     unimp
0x1018:     unimp
0x101a:     0x8000
0x101c:     unimp
```

这里 x/10i $pc 的含义是从当前 PC 值的位置开始，在内存中反汇编 10 条指令。不过可以看到 Qemu 的固件仅包含 5 条指令，从 0x1014 开始都是数据，当数据为 0 的时候则会被反汇编为 unimp 指令。 0x101a 处的数据 0x8000 是能够跳转到 0x80000000 进入启动下一阶段的关键。有兴趣的读者可以自行探究位于 0x1000 和 0x100c 两条指令的含义。总之，在执行位于 0x1010 的指令之前，寄存器 t0 的值恰好为 0x80000000 ，随后通过 jr t0 便可以跳转到该地址。我们可以通过单步调试来复盘这个过程：

```
$ (gdb) si
0x0000000000001004 in ?? ()
$ (gdb) si
0x0000000000001008 in ?? ()
$ (gdb) si
0x000000000000100c in ?? ()
$ (gdb) si
0x0000000000001010 in ?? ()
$ (gdb) p/x $t0
$1 = 0x80000000
$ (gdb) si
0x0000000080000000 in ?? ()
```

其中， si 可以让 Qemu 每次向下执行一条指令，之后屏幕会打印出待执行的下一条指令的地址。 p/x $t0 以 16 进制打印寄存器 t0 的值，注意当我们要打印寄存器的时候需要在寄存器的名字前面加上 $ 。可以看到，当位于 0x1010 的指令执行完毕后，下一条待执行的指令位于 RustSBI 的入口，也即 0x80000000 ，这意味着我们即将把控制权转交给 RustSBI 。

```
$ (gdb) x/10i $pc
=> 0x80000000:      auipc   sp,0x28
0x80000004: mv      sp,sp
0x80000008: lui     t0,0x4
0x8000000a: addi    t1,a0,1
0x8000000e: add     sp,sp,t0
0x80000010: addi    t1,t1,-1
0x80000012: bnez    t1,0x8000000e
0x80000016: j       0x8001125a
0x8000001a: unimp
0x8000001c: addi    sp,sp,-48
$ (gdb) si
0x0000000080000004 in ?? ()
$ (gdb) si
0x0000000080000008 in ?? ()
$ (gdb) si
0x000000008000000a in ?? ()
$ (gdb) si
0x000000008000000e in ?? ()
```

我们可以用同样的方式反汇编 RustSBI 最初的几条指令并单步调试。不过由于 RustSBI 超出了本书的范围，我们这里并不打算进行深入。接下来我们检查控制权能否被移交给我们的内核：

```
$ (gdb) b *0x80200000
Breakpoint 1 at 0x80200000
$ (gdb) c
Continuing.

Breakpoint 1, 0x0000000080200000 in ?? ()
```

我们在内核的入口点，也即地址 0x80200000 处打一个断点。需要注意，当需要在一个特定的地址打断点时，需要在地址前面加上 \* 。接下来通过 c 命令（Continue 的缩写）让 Qemu 向下运行直到遇到一个断点。可以看到，我们成功停在了 0x80200000 处。随后，可以检查内核第一条指令是否被正确执行：

```
$ (gdb) x/5i $pc
=> 0x80200000:      li      ra,100
0x80200004: unimp
0x80200006: unimp
0x80200008: unimp
0x8020000a: unimp
$ (gdb) si
0x0000000080200004 in ?? ()
$ (gdb) p/d $x1
$2 = 100
$ (gdb) p/x $sp
$3 = 0x0
```

可以看到我们在 entry.asm 中编写的第一条指令可以在 0x80200000 处找到。这里 ra 是寄存器 x1 的别名， p/d $x1 可以以十进制打印寄存器 x1 的值，它的结果正确。最后，作为下一节的铺垫，我们可以检查此时栈指针 sp 的值，可以发现它目前是 0 。下一节我们将设置好栈空间，使得内核代码可以正常进行函数调用，随后将控制权转交给 Rust 代码。

---

## 本节练习

4. \*\* 请基于QEMU模拟RISC—V的执行过程和QEMU源代码，说明RISC-V硬件加电后的几条指令在哪里？完成了哪些功能？

   在 QEMU 源码 [[1]] 中可以找到“上电”的时候刚执行的几条指令，如下：

   ```
   uint32_t reset_vec[10] = {
       0x00000297,                   /* 1:  auipc  t0, %pcrel_hi(fw_dyn) */
       0x02828613,                   /*     addi   a2, t0, %pcrel_lo(1b) */
       0xf1402573,                   /*     csrr   a0, mhartid  */
   #if defined(TARGET_RISCV32)
       0x0202a583,                   /*     lw     a1, 32(t0) */
       0x0182a283,                   /*     lw     t0, 24(t0) */
   #elif defined(TARGET_RISCV64)
       0x0202b583,                   /*     ld     a1, 32(t0) */
       0x0182b283,                   /*     ld     t0, 24(t0) */
   #endif
       0x00028067,                   /*     jr     t0 */
       start_addr,                   /* start: .dword */
       start_addr_hi32,
       fdt_load_addr,                /* fdt_laddr: .dword */
       0x00000000,
                                     /* fw_dyn: */
   };
   ```

   完成的工作是：

   - 读取当前的 Hart ID CSR mhartid 写入寄存器 a0
   - （我们还没有用到：将 FDT (Flatten device tree) 在物理内存中的地址写入 a1）
   - 跳转到 start\_addr ，在我们实验中是 RustSBI 的地址

7. \*\* 请简要说明从QEMU模拟的RISC-V计算机加电开始运行到执行应用程序的第一条指令这个阶段的执行过程。

   接第 5 题，跳转到 RustSBI 后，SBI 会对部分硬件例如串口等进行初始化，然后通过 mret 跳转到 payload 也就是 kernel 所在的起始地址。kernel 进行一系列的初始化后（内存管理，虚存管理，线程（进程）初始化等），通过 sret 跳转到应用程序的第一条指令开始执行。

---

## 本节练习

### 实验作业

### 实践作业

#### 彩色化 LOG

lab1 的工作使得我们从硬件世界跳入了软件世界，当看到自己的小 os 可以在裸机硬件上输出 hello world 是不是很高兴呢？但是为了后续的一步开发，更好的调试环境也是必不可少的，第一章的练习要求大家实现更加炫酷的彩色log。

详细的原理不多说，感兴趣的同学可以参考 [ANSI转义序列](https://zh.wikipedia.org/wiki/ANSI%E8%BD%AC%E4%B9%89%E5%BA%8F%E5%88%97) ，现在执行如下这条命令试试

```
$ echo -e "\x1b[31mhello world\x1b[0m"
```

如果你明白了我们是如何利用串口实现输出，那么要实现彩色输出就十分容易了，只需要用需要输出的字符串替换上一条命令中的 hello world，用期望颜色替换 31(代表红色) 即可。

> **Warning**
>
> 以下内容仅为推荐实现，不是练习要求，有时间和兴趣的同学可以尝试。

我们推荐实现如下几个等级的输出，输出优先级依次降低：

log 等级推荐

|  |  |  |
| --- | --- | --- |
| 名称 | 颜色 | 用途 |
| ERROR | 红色(31) | 表示发生严重错误，很可能或者已经导致程序崩溃 |
| WARN | 黄色(93) | 表示发生不常见情况，但是并不一定导致系统错误 |
| INFO | 蓝色(34) | 比较中庸的选项，输出比较重要的信息，比较常用 |
| DEBUG | 绿色(32) | 输出信息较多，在 debug 时使用 |
| TRACE | 灰色(90) | 最详细的输出，跟踪了每一步关键路径的执行 |

我们可以输出比设定输出等级以及更高输出等级的信息，如设置 LOG = INFO，则输出 ERROR、WARN、INFO 等级的信息。简单 demo 如下，输出等级为 INFO:

![color-demo.png](/images/rust-os/rcore/chapter1/color-demo.png)

为了方便使用彩色输出，我们要求同学们实现彩色输出的宏或者函数，用以代替 print 完成输出内核信息的功能，它们有着和 prinf 十分相似的使用格式，要求支持可变参数解析，形如：

```
// 这段代码输出了 os 内存空间布局，这到这些信息对于编写 os 十分重要

info!(".text [{:#x}, {:#x})", linker_symbol_addr!(s_text), linker_symbol_addr!(e_text));
debug!(".rodata [{:#x}, {:#x})", linker_symbol_addr!(s_rodata), linker_symbol_addr!(e_rodata));
error!(".data [{:#x}, {:#x})", linker_symbol_addr!(s_data), linker_symbol_addr!(e_data));
```

```
info("load range : [%d, %d] start = %d\n", s, e, start);
```

在以后，我们还可以在 log 信息中增加线程、CPU等信息（只是一个推荐，不做要求），这些信息将极大的方便你的代码调试。

#### 实验要求

- 实现分支：ch1
- 完成实验指导书中的内容并在裸机上实现 hello world 输出。
- 实现彩色输出宏(只要求可以彩色输出，不要求 log 等级控制，不要求多种颜色)
- 隐形要求

  可以关闭内核所有输出。从 lab2 开始要求关闭内核所有输出（如果实现了 log 等级控制，那么这一点自然就实现了）。
- 利用彩色输出宏输出 os 内存空间布局

  输出 .text、.data、.rodata、.bss 各段位置，输出等级为 INFO。

challenge: 支持多核，实现多个核的 boot。

#### 实验检查

- 实验目录要求(Rust)

```
├── os(内核实现)
│   ├── Cargo.toml(配置文件)
│   ├── Makefile (要求 make run LOG=xxx 可以正确执行，可以不实现对 LOG 这一属性的支持，设置默认输出等级为 INFO)
│   └── src(所有内核的源代码放在 os/src 目录下)
│       ├── main.rs(内核主函数)
│       └── ...
├── reports
│   ├── lab1.md/pdf
│   └── ...
├── README.md（其他必要的说明）
├── ...
```

报告命名 labx.md/pdf，统一放在 reports 目录下。每个实验新增一个报告，为了方便修改，检查报告是以最新分支的所有报告为准。

- 检查

```
$ cd os
$ git checkout ch1
$ make run LOG=INFO
```

可以正确执行(可以不支持LOG参数，只有要彩色输出就好)，可以看到正确的内存布局输出，根据实现不同数值可能有差异，但应该位于 linker.ld 中指示 BASE\_ADDRESS 后一段内存，输出之后关机。

#### tips

- 对于 Rust, 可以使用 crate [log](https://docs.rs/log/0.4.14/log/) ，推荐参考 [rCore](https://github.com/rcore-os/rCore/blob/master/kernel/src/logging.rs)
- 对于 C，可以实现不同的函数（注意不推荐多层可变参数解析，有时会出现不稳定情况），也可以参考 [linux printk](https://github.com/torvalds/linux/blob/master/include/linux/printk.h#L312-L385) 使用宏实现代码重用。
- 两种语言都可以使用 extern 关键字获得在其他文件中定义的符号。

### 问答作业

1. 请学习 gdb 调试工具的使用(这对后续调试很重要)，并通过 gdb 简单跟踪从机器加电到跳转到 0x80200000 的简单过程。只需要描述重要的跳转即可，只需要描述在 qemu 上的情况。
2. tips:

> - 事实上进入 rustsbi 之后就不需要使用 gdb 调试了。可以直接阅读代码。[rustsbi起始代码](https://github.com/rustsbi/rustsbi-qemu/blob/main/rustsbi-qemu/src/main.rs#L146) 。
> - 可以使用示例代码 Makefile 中的 make debug 指令。
> - 一些可能用到的 gdb 指令：
>   :   - x/10i 0x80000000 : 显示 0x80000000 处的10条汇编指令。
>       - x/10i $pc : 显示即将执行的10条汇编指令。
>       - x/10xw 0x80000000 : 显示 0x80000000 处的10条数据，格式为16进制32bit。
>       - info register: 显示当前所有寄存器信息。
>       - info r t0: 显示 t0 寄存器的值。
>       - break funcname: 在目标函数第一条指令处设置断点。
>       - break \*0x80200000: 在 0x80200000 处设置断点。
>       - continue: 执行直到碰到断点。
>       - si: 单步执行一条汇编指令。

### 实验练习的提交报告要求

- 简单总结本次实验你编程的内容。（控制在5行以内，不要贴代码）
- 由于彩色输出不好自动测试，请附正确运行后的截图。
- 完成问答问题。
- (optional) 你对本次实验设计及难度/工作量的看法，以及有哪些需要改进的地方，欢迎畅所欲言。
