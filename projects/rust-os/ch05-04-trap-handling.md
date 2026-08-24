---
title: "实现特权级的切换"
description: "由于处理器具有硬件级的特权级机制，应用程序在用户态特权级运行时，是无法直接通过函数调用访问处于内核态特权级的批处理操作系统内核中的函数。但应用程序又需要得到操作系统提供的服务，所以应用程序与操作系统需要通过某种合作机制完..."
date: "2026-07-12"
order: 35
tags: ["trap", "特权级切换", "上下文保存", "系统调用", "RISC-V"]
est_time: "50分钟"
---
## 本节导读

由于处理器具有硬件级的特权级机制，应用程序在用户态特权级运行时，是无法直接通过函数调用访问处于内核态特权级的批处理操作系统内核中的函数。但应用程序又需要得到操作系统提供的服务，所以应用程序与操作系统需要通过某种合作机制完成特权级之间的切换，使得用户态应用程序可以得到内核态操作系统函数的服务。本节将讲解在 RISC-V 64 处理器提供的 U/S 特权级下，批处理操作系统和应用程序如何相互配合，完成特权级切换的。

## RISC-V特权级切换

### 特权级切换的起因

我们知道，批处理操作系统被设计为运行在内核态特权级（RISC-V 的 S 模式），这是作为 SEE（Supervisor Execution Environment）的 RustSBI 所保证的。而应用程序被设计为运行在用户态特权级（RISC-V 的 U 模式），被操作系统为核心的执行环境监管起来。在本章中，这个应用程序的执行环境即是由“邓式鱼” 批处理操作系统提供的 AEE（Application Execution Environment) 。批处理操作系统为了建立好应用程序的执行环境，需要在执行应用程序之前进行一些初始化工作，并监控应用程序的执行，具体体现在：

- 当启动应用程序的时候，需要初始化应用程序的用户态上下文，并能切换到用户态执行应用程序；
- 当应用程序发起系统调用（即发出 Trap）之后，需要到批处理操作系统中进行处理；
- 当应用程序执行出错的时候，需要到批处理操作系统中杀死该应用并加载运行下一个应用；
- 当应用程序执行结束的时候，需要到批处理操作系统中加载运行下一个应用（实际上也是通过系统调用 sys\_exit 来实现的）。

这些处理都涉及到特权级切换，因此需要应用程序、操作系统和硬件一起协同，完成特权级切换机制。

### 特权级切换相关的控制状态寄存器

当从一般意义上讨论 RISC-V 架构的 Trap 机制时，通常需要注意两点：

- 在触发 Trap 之前 CPU 运行在哪个特权级；
- CPU 需要切换到哪个特权级来处理该 Trap ，并在处理完成之后返回原特权级。

但本章中我们仅考虑如下流程：当 CPU 在用户态特权级（ RISC-V 的 U 模式）运行应用程序，执行到 Trap，切换到内核态特权级（ RISC-V的S 模式），批处理操作系统的对应代码响应 Trap，并执行系统调用服务，处理完毕后，从内核态返回到用户态应用程序继续执行后续指令。

在 RISC-V 架构中，关于 Trap 有一条重要的规则：在 Trap 前的特权级不会高于 Trap 后的特权级。因此如果触发 Trap 之后切换到 S 特权级（下称 Trap 到 S），说明 Trap 发生之前 CPU 只能运行在 S/U 特权级。但无论如何，只要是 Trap 到 S 特权级，操作系统就会使用 S 特权级中与 Trap 相关的 **控制状态寄存器** (CSR, Control and Status Register) 来辅助 Trap 处理。我们在编写运行在 S 特权级的批处理操作系统中的 Trap 处理相关代码的时候，就需要使用如下所示的 S 模式的 CSR 寄存器。

进入 S 特权级 Trap 的相关 CSR

|  |  |
| --- | --- |
| CSR 名 | 该 CSR 与 Trap 相关的功能 |
| sstatus | SPP 等字段给出 Trap 发生之前 CPU 处在哪个特权级（S/U）等信息 |
| sepc | 当 Trap 是一个异常的时候，记录 Trap 发生之前执行的最后一条指令的地址 |
| scause | 描述 Trap 的原因 |
| stval | 给出 Trap 附加信息 |
| stvec | 控制 Trap 处理代码的入口地址 |

> **Note**
>
> **S模式下最重要的 sstatus 寄存器**
>
> 注意 sstatus 是 S 特权级最重要的 CSR，可以从多个方面控制 S 特权级的 CPU 行为和执行状态。

### 特权级切换

当执行一条 Trap 类指令（如 ecall 时），CPU 发现触发了一个异常并需要进行特殊处理，这涉及到 执行环境切换 。具体而言，用户态执行环境中的应用程序通过 ecall 指令向内核态执行环境中的操作系统请求某项服务功能，那么处理器和操作系统会完成到内核态执行环境的切换，并在操作系统完成服务后，再次切换回用户态执行环境，然后应用程序会紧接着 ecall 指令的后一条指令位置处继续执行，参考 图示 。

应用程序被切换回来之后需要从发出系统调用请求的执行位置恢复应用程序上下文并继续执行，这需要在切换前后维持应用程序的上下文保持不变。应用程序的上下文包括通用寄存器和栈两个主要部分。由于 CPU 在不同特权级下共享一套通用寄存器，所以在运行操作系统的 Trap 处理过程中，操作系统也会用到这些寄存器，这会改变应用程序的上下文。因此，与函数调用需要保存函数调用上下文/活动记录一样，在执行操作系统的 Trap 处理过程（会修改通用寄存器）之前，我们需要在某个地方（某内存块或内核的栈）保存这些寄存器并在 Trap 处理结束后恢复这些寄存器。

除了通用寄存器之外还有一些可能在处理 Trap 过程中会被修改的 CSR，比如 CPU 所在的特权级。我们要保证它们的变化在我们的预期之内。比如，对于特权级转换而言，应该是 Trap 之前在 U 特权级，处理 Trap 的时候在 S 特权级，返回之后又需要回到 U 特权级。而对于栈问题则相对简单，只要两个应用程序执行过程中用来记录执行历史的栈所对应的内存区域不相交，就不会产生令我们头痛的覆盖问题或数据破坏问题，也就无需进行保存/恢复。

特权级切换的具体过程一部分由硬件直接完成，另一部分则需要由操作系统来实现。

## 特权级切换的硬件控制机制

当 CPU 执行完一条指令（如 ecall ）并准备从用户特权级 陷入（ Trap ）到 S 特权级的时候，硬件会自动完成如下这些事情：

- sstatus 的 SPP 字段会被修改为 CPU 当前的特权级（U/S）。
- sepc 会被修改为被中断或触发异常的指令的地址。如 CPU 执行 ecall 指令会触发异常，则 sepc 会被设置为 ecall 指令的地址。
- scause/stval 分别会被修改成这次 Trap 的原因以及相关的附加信息。
- CPU 会跳转到 stvec 所设置的 Trap 处理入口地址，并将当前特权级设置为 S ，然后从Trap 处理入口地址处开始执行。

> **Note**
>
> **stvec 相关细节**
>
> 在 RV64 中， stvec 是一个 64 位的 CSR，在中断使能的情况下，保存了中断处理的入口地址。它有两个字段：
>
> - MODE 位于 [1:0]，长度为 2 bits；
> - BASE 位于 [63:2]，长度为 62 bits。
>
> 当 MODE 字段为 0 的时候， stvec 被设置为 Direct 模式，此时进入 S 模式的 Trap 无论原因如何，处理 Trap 的入口地址都是 BASE<<2 ， CPU 会跳转到这个地方进行异常处理。本书中我们只会将 stvec 设置为 Direct 模式。而 stvec 还可以被设置为 Vectored 模式，有兴趣的同学可以自行参考 RISC-V 指令集特权级规范。

而当 CPU 完成 Trap 处理准备返回的时候，需要通过一条 S 特权级的特权指令 sret 来完成，这一条指令具体完成以下功能：

- CPU 会将当前的特权级按照 sstatus 的 SPP 字段设置为 U 或者 S ；
- CPU 会跳转到 sepc 寄存器指向的那条指令，然后继续执行。

这些基本上都是硬件不得不完成的事情，还有一些剩下的收尾工作可以都交给软件，让操作系统能有更大的灵活性。

## 用户栈与内核栈

在 Trap 触发的一瞬间， CPU 就会切换到 S 特权级并跳转到 stvec 所指示的位置。但是在正式进入 S 特权级的 Trap 处理之前，上面
提到过我们必须保存原控制流的寄存器状态，这一般通过内核栈来保存。注意，我们需要用专门为操作系统准备的内核栈，而不是应用程序运行时用到的用户栈。

使用两个不同的栈主要是为了安全性：如果两个控制流（即应用程序的控制流和内核的控制流）使用同一个栈，在返回之后应用程序就能读到 Trap 控制流的历史信息，比如内核一些函数的地址，这样会带来安全隐患。于是，我们要做的是，在批处理操作系统中添加一段汇编代码，实现从用户栈切换到内核栈，并在内核栈上保存应用程序控制流的寄存器状态。不过需要注意的是，在没有启用虚拟内存的情况下，用户态代码依然可以通过物理地址访问整个内存空间，包括内核栈区域。

我们声明两个类型 KernelStack 和 UserStack 分别表示内核栈和用户栈，它们都只是字节数组的简单包装：

```
// os/src/batch.rs

const USER_STACK_SIZE: usize = 4096 * 2;
const KERNEL_STACK_SIZE: usize = 4096 * 2;

#[repr(align(4096))]
struct KernelStack {
    data: [u8; KERNEL_STACK_SIZE],
}

#[repr(align(4096))]
struct UserStack {
    data: [u8; USER_STACK_SIZE],
}

static KERNEL_STACK: KernelStack = KernelStack { data: [0; KERNEL_STACK_SIZE] };
static USER_STACK: UserStack = UserStack { data: [0; USER_STACK_SIZE] };
```

常数 USER\_STACK\_SIZE 和 KERNEL\_STACK\_SIZE 指出用户栈和内核栈的大小分别为 $8text{KiB}$ 。两个类型是以全局变量的形式实例化在批处理操作系统的 .bss 段中的。

我们为两个类型实现了 get\_sp 方法来获取栈顶地址。由于在 RISC-V 中栈是向下增长的，我们只需返回包裹的数组的结尾地址，以用户栈类型 UserStack 为例：

```
impl UserStack {
    fn get_sp(&self) -> usize {
        self.data.as_ptr() as usize + USER_STACK_SIZE
    }
}
```

于是换栈是非常简单的，只需将 sp 寄存器的值修改为 get\_sp 的返回值即可。

接下来是Trap上下文（即数据结构 TrapContext ），类似前面提到的函数调用上下文，即在 Trap 发生时需要保存的物理资源内容，并将其一起放在一个名为 TrapContext 的类型中，定义如下：

```
// os/src/trap/context.rs

#[repr(C)]
pub struct TrapContext {
    pub x: [usize; 32],
    pub sstatus: Sstatus,
    pub sepc: usize,
}
```

可以看到里面包含所有的通用寄存器 x0~x31 ，还有 sstatus 和 sepc 。那么为什么需要保存它们呢？

- 对于通用寄存器而言，两条控制流（应用程序控制流和内核控制流）运行在不同的特权级，所属的软件也可能由不同的编程语言编写，虽然在 Trap 控制流中只是会执行 Trap 处理相关的代码，但依然可能直接或间接调用很多模块，因此很难甚至不可能找出哪些寄存器无需保存。既然如此我们就只能全部保存了。但这里也有一些例外，如 x0 被硬编码为 0 ，它自然不会有变化；还有 tp(x4) 寄存器，除非我们手动出于一些特殊用途使用它，否则一般也不会被用到。虽然它们无需保存，但我们仍然在 TrapContext 中为它们预留空间，主要是为了后续的实现方便。
- 对于 CSR 而言，我们知道进入 Trap 的时候，硬件会立即覆盖掉 scause/stval/sstatus/sepc 的全部或是其中一部分。scause/stval 的情况是：它总是在 Trap 处理的第一时间就被使用或者是在其他地方保存下来了，因此它没有被修改并造成不良影响的风险。而对于 sstatus/sepc 而言，它们会在 Trap 处理的全程有意义（在 Trap 控制流最后 sret 的时候还用到了它们），而且确实会出现 Trap 嵌套的情况使得它们的值被覆盖掉。所以我们需要将它们也一起保存下来，并在 sret 之前恢复原样。

## Trap 管理

特权级切换的核心是对Trap的管理。这主要涉及到如下一些内容：

- 应用程序通过 ecall 进入到内核状态时，操作系统保存被打断的应用程序的 Trap 上下文；
- 操作系统根据Trap相关的CSR寄存器内容，完成系统调用服务的分发与处理；
- 操作系统完成系统调用服务后，需要恢复被打断的应用程序的Trap 上下文，并通 sret 让应用程序继续执行。

接下来我们具体介绍上述内容。

### Trap 上下文的保存与恢复

首先是具体实现 Trap 上下文保存和恢复的汇编代码。

在批处理操作系统初始化的时候，我们需要修改 stvec 寄存器来指向正确的 Trap 处理入口点。

```
// os/src/trap/mod.rs

global_asm!(include_str!("trap.S"));

pub fn init() {
    unsafe extern "C" {
        safe fn __alltraps();
    }
    unsafe {
        stvec::write(stvec::Stvec::new(
            linker_symbol_addr!(__alltraps),
            TrapMode::Direct,
        ));
    }
}
```

这里我们引入了一个外部符号 \_\_alltraps ，并将 stvec 设置为 Direct 模式指向它的地址。我们在 os/src/trap/trap.S 中实现 Trap 上下文保存/恢复的汇编代码，分别用外部符号 \_\_alltraps 和 \_\_restore 标记为函数，并通过 global\_asm! 宏将 trap.S 这段汇编代码插入进来。

Trap 处理的总体流程如下：首先通过 \_\_alltraps 将 Trap 上下文保存在内核栈上，然后跳转到使用 Rust 编写的 trap\_handler 函数完成 Trap 分发及处理。当 trap\_handler 返回之后，使用 \_\_restore 从保存在内核栈上的 Trap 上下文恢复寄存器。最后通过一条 sret 指令回到应用程序执行。

首先是保存 Trap 上下文的 \_\_alltraps 的实现：

```
# os/src/trap/trap.S

.macro SAVE_GP n
    sd x\n, \n*8(sp)
.endm

.align 2
__alltraps:
    csrrw sp, sscratch, sp
    # now sp->kernel stack, sscratch->user stack
    # allocate a TrapContext on kernel stack
    addi sp, sp, -34*8
    # save general-purpose registers
    sd x1, 1*8(sp)
    # skip sp(x2), we will save it later
    sd x3, 3*8(sp)
    # skip tp(x4), application does not use it
    # save x5~x31
    .set n, 5
    .rept 27
        SAVE_GP %n
        .set n, n+1
    .endr
    # we can use t0/t1/t2 freely, because they were saved on kernel stack
    csrr t0, sstatus
    csrr t1, sepc
    sd t0, 32*8(sp)
    sd t1, 33*8(sp)
    # read user stack from sscratch and save it on the kernel stack
    csrr t2, sscratch
    sd t2, 2*8(sp)
    # set input argument of trap_handler(cx: &mut TrapContext)
    mv a0, sp
    call trap_handler
```

- 第 7 行我们使用 .align 将 \_\_alltraps 的地址 4 字节对齐，这是 RISC-V 特权级规范的要求；
- 第 9 行的 csrrw 原型是 $text{csrrw rd, csr, rs}$ 可以将 CSR 当前的值读到通用寄存器 $text{rd}$ 中，然后将通用寄存器 $text{rs}$ 的值写入该 CSR 。因此这里起到的是交换 sscratch 和 sp 的效果。在这一行之前 sp 指向用户栈， sscratch 指向内核栈（原因稍后说明），现在 sp 指向内核栈， sscratch 指向用户栈。
- 第 12 行，我们准备在内核栈上保存 Trap 上下文，于是预先分配 $34times 8$ 字节的栈帧，这里改动的是 sp ，说明确实是在内核栈上。
- 第 13~24 行，保存 Trap 上下文的通用寄存器 x0~x31，跳过 x0 和 tp(x4)，原因之前已经说明。我们在这里也不保存 sp(x2)，因为我们要基于它来找到每个寄存器应该被保存到的正确的位置。实际上，在栈帧分配之后，我们可用于保存 Trap 上下文的地址区间为 $[text{sp},text{sp}+8times34)$ ，按照 TrapContext 结构体的内存布局，基于内核栈的位置（sp所指地址）来从低地址到高地址分别按顺序放置 x0~x31这些通用寄存器，最后是 sstatus 和 sepc 。因此通用寄存器 xn 应该被保存在地址区间 $[text{sp}+8n,text{sp}+8(n+1))$ 。

  为了简化代码，x5~x31 这 27 个通用寄存器我们通过类似循环的 .rept 每次使用 SAVE\_GP 宏来保存，其实质是相同的。注意我们需要在 trap.S 开头加上 .altmacro 才能正常使用 .rept 命令。
- 第 25~28 行，我们将 CSR sstatus 和 sepc 的值分别读到寄存器 t0 和 t1 中然后保存到内核栈对应的位置上。指令 $text{csrr rd, csr}$ 的功能就是将 CSR 的值读到寄存器 $text{rd}$ 中。这里我们不用担心 t0 和 t1 被覆盖，因为它们刚刚已经被保存了。
- 第 30~31 行专门处理 sp 的问题。首先将 sscratch 的值读到寄存器 t2 并保存到内核栈上，注意： sscratch 的值是进入 Trap 之前的 sp 的值，指向用户栈。而现在的 sp 则指向内核栈。
- 第 33 行令 $text{a}\_0leftarrowtext{sp}$，让寄存器 a0 指向内核栈的栈指针也就是我们刚刚保存的 Trap 上下文的地址，这是由于我们接下来要调用 trap\_handler 进行 Trap 处理，它的第一个参数 cx 由调用规范要从 a0 中获取。而 Trap 处理函数 trap\_handler 需要 Trap 上下文的原因在于：它需要知道其中某些寄存器的值，比如在系统调用的时候应用程序传过来的 syscall ID 和对应参数。我们不能直接使用这些寄存器现在的值，因为它们可能已经被修改了，因此要去内核栈上找已经被保存下来的值。

> **Note**
>
> **CSR 相关原子指令**
>
> RISC-V 中读写 CSR 的指令是一类能不会被打断地完成多个读写操作的指令。这种不会被打断地完成多个操作的指令被称为 **原子指令** (Atomic Instruction)。这里的 **原子** 的含义是“不可分割的最小个体”，也就是说指令的多个操作要么都不完成，要么全部完成，而不会处于某种中间状态。
>
> 另外，RISC-V 架构中常规的数据处理和访存类指令只能操作通用寄存器而不能操作 CSR 。因此，当想要对 CSR 进行操作时，需要先使用读取 CSR 的指令将 CSR 读到一个通用寄存器中，而后操作该通用寄存器，最后再使用写入 CSR 的指令将该通用寄存器的值写入到 CSR 中。

当 trap\_handler 返回之后会从调用 trap\_handler 的下一条指令开始执行，也就是从栈上的 Trap 上下文恢复的 \_\_restore ：

```
# os/src/trap/trap.S

.macro LOAD_GP n
    ld x\n, \n*8(sp)
.endm

__restore:
    # case1: start running app by __restore
    # case2: back to U after handling trap
    mv sp, a0
    # now sp->kernel stack(after allocated), sscratch->user stack
    # restore sstatus/sepc
    ld t0, 32*8(sp)
    ld t1, 33*8(sp)
    ld t2, 2*8(sp)
    csrw sstatus, t0
    csrw sepc, t1
    csrw sscratch, t2
    # restore general-purpuse registers except sp/tp
    ld x1, 1*8(sp)
    ld x3, 3*8(sp)
    .set n, 5
    .rept 27
        LOAD_GP %n
        .set n, n+1
    .endr
    # release TrapContext on kernel stack
    addi sp, sp, 34*8
    # now sp->kernel stack, sscratch->user stack
    csrrw sp, sscratch, sp
    sret
```

- 第 10 行比较奇怪我们暂且不管，假设它从未发生，那么 sp 仍然指向内核栈的栈顶。
- 第 13~26 行负责从内核栈顶的 Trap 上下文恢复通用寄存器和 CSR 。注意我们要先恢复 CSR 再恢复通用寄存器，这样我们使用的三个临时寄存器才能被正确恢复。
- 在第 28 行之前，sp 指向保存了 Trap 上下文之后的内核栈栈顶， sscratch 指向用户栈栈顶。我们在第 28 行在内核栈上回收 Trap 上下文所占用的内存，回归进入 Trap 之前的内核栈栈顶。第 30 行，再次交换 sscratch 和 sp，现在 sp 重新指向用户栈栈顶，sscratch 也依然保存进入 Trap 之前的状态并指向内核栈栈顶。
- 在应用程序控制流状态被还原之后，第 31 行我们使用 sret 指令回到 U 特权级继续运行应用程序控制流。

> **Note**
>
> **sscratch CSR 的用途**
>
> 在特权级切换的时候，我们需要将 Trap 上下文保存在内核栈上，因此需要一个寄存器暂存内核栈地址，并以它作为基地址指针来依次保存 Trap 上下文的内容。但是所有的通用寄存器都不能够用作基地址指针，因为它们都需要被保存，如果覆盖掉它们，就会影响后续应用控制流的执行。
>
> 事实上我们缺少了一个重要的中转寄存器，而 sscratch CSR 正是为此而生。从上面的汇编代码中可以看出，在保存 Trap 上下文的时候，它起到了两个作用：首先是保存了内核栈的地址，其次它可作为一个中转站让 sp （目前指向的用户栈的地址）的值可以暂时保存在 sscratch 。这样仅需一条 csrrw sp, sscratch, sp 指令（交换对 sp 和 sscratch 两个寄存器内容）就完成了从用户栈到内核栈的切换，这是一种极其精巧的实现。

### Trap 分发与处理

Trap 在使用 Rust 实现的 trap\_handler 函数中完成分发和处理：

```
// os/src/trap/mod.rs

#[unsafe(no_mangle)]
pub fn trap_handler(cx: &mut TrapContext) -> &mut TrapContext {
    let scause = scause::read();
    let stval = stval::read();
    let trap: Trap<Interrupt, Exception> = match scause.cause().try_into() {
        Ok(trap) => trap,
        Err(_) => panic!(
            "Unsupported trap {:?}, stval = {:#x}!",
            scause.cause(),
            stval
        ),
    };
    match trap {
        Trap::Exception(Exception::UserEnvCall) => {
            cx.sepc += 4;
            cx.x[10] = syscall(cx.x[17], [cx.x[10], cx.x[11], cx.x[12]]) as usize;
        }
        Trap::Exception(Exception::StoreFault) |
        Trap::Exception(Exception::StorePageFault) => {
            println!("[kernel] PageFault in application, kernel killed it.");
            run_next_app();
        }
        Trap::Exception(Exception::IllegalInstruction) => {
            println!("[kernel] IllegalInstruction in application, kernel killed it.");
            run_next_app();
        }
        _ => {
            panic!("Unsupported trap {:?}, stval = {:#x}!", trap, stval);
        }
    }
    cx
}
```

- 第 5 行声明返回值为 &mut TrapContext 并在第 33 行实际将传入的 Trap 上下文 cx 原样返回，因此在 \_\_restore 的时候 a0 寄存器在调用 trap\_handler 前后并没有发生变化，仍然指向分配 Trap 上下文之后的内核栈栈顶，和此时 sp 的值相同，这里的 $text{sp}leftarrowtext{a}\_0$ 并不会有问题；
- 第 6~15 行根据 scause 寄存器所保存的 Trap 的原因进行分发处理。这里我们无需手动操作这些 CSR ，而是使用 Rust 的 riscv 库来更加方便的做这些事情。在 riscv 0.16 中，第 8~14 行先通过 try\_into 将 scause.cause() 转换成 Trap<Interrupt, Exception>，再和具体异常原因进行匹配。要引入 riscv 库，我们需要：

  ```
  # os/Cargo.toml

  [dependencies]
  riscv = { version = "0.16", features = ["s-mode"] }
  ```
- 第 16~19 行，发现触发 Trap 的原因是来自 U 特权级的 Environment Call，也就是系统调用。这里我们首先修改保存在内核栈上的 Trap 上下文里面 sepc，让其增加 4。这是因为我们知道这是一个由 ecall 指令触发的系统调用，在进入 Trap 的时候，硬件会将 sepc 设置为这条 ecall 指令所在的地址（因为它是进入 Trap 之前最后一条执行的指令）。而在 Trap 返回之后，我们希望应用程序控制流从 ecall 的下一条指令开始执行。因此我们只需修改 Trap 上下文里面的 sepc，让它增加 ecall 指令的码长，也即 4 字节。这样在 \_\_restore 的时候 sepc 在恢复之后就会指向 ecall 的下一条指令，并在 sret 之后从那里开始执行。

  用来保存系统调用返回值的 a0 寄存器也会同样发生变化。我们从 Trap 上下文取出作为 syscall ID 的 a7 和系统调用的三个参数 a0~a2 传给 syscall 函数并获取返回值。 syscall 函数是在 syscall 子模块中实现的。 这段代码是处理正常系统调用的控制逻辑。
- 第 20~28 行，分别处理应用程序出现访存错误和非法指令错误的情形。此时需要打印错误信息并调用 run\_next\_app 直接切换并运行下一个应用程序。
- 第 29~31 行，当遇到目前还不支持的 Trap 类型的时候，“邓式鱼” 批处理操作系统整个 panic 报错退出。

### 实现系统调用功能

对于系统调用而言， syscall 函数并不会实际处理系统调用，而只是根据 syscall ID 分发到具体的处理函数：

```
// os/src/syscall/mod.rs

pub fn syscall(syscall_id: usize, args: [usize; 3]) -> isize {
    match syscall_id {
        SYSCALL_WRITE => sys_write(args[0], args[1] as *const u8, args[2]),
        SYSCALL_EXIT => sys_exit(args[0] as i32),
        _ => panic!("Unsupported syscall_id: {}", syscall_id),
    }
}
```

这里我们会将传进来的参数 args 转化成能够被具体的系统调用处理函数接受的类型。它们的实现都非常简单：

```
// os/src/syscall/fs.rs

const FD_STDOUT: usize = 1;

pub fn sys_write(fd: usize, buf: *const u8, len: usize) -> isize {
    match fd {
        FD_STDOUT => {
            let slice = unsafe { core::slice::from_raw_parts(buf, len) };
            let str = core::str::from_utf8(slice).unwrap();
            print!("{}", str);
            len as isize
        },
        _ => {
            panic!("Unsupported fd in sys_write!");
        }
    }
}

// os/src/syscall/process.rs

pub fn sys_exit(xstate: i32) -> ! {
    println!("[kernel] Application exited with code {}", xstate);
    run_next_app()
}
```

- sys\_write 我们将传入的位于应用程序内的缓冲区的开始地址和长度转化为一个字符串 &str ，然后使用批处理操作系统已经实现的 print! 宏打印出来。注意这里我们并没有检查传入参数的安全性，即使会在出错严重的时候 panic，还是会存在安全隐患。这里我们出于实现方便暂且不做修补。
- sys\_exit 打印退出的应用程序的返回值并同样调用 run\_next\_app 切换到下一个应用程序。

## 执行应用程序

当批处理操作系统初始化完成，或者是某个应用程序运行结束或出错的时候，我们要调用 run\_next\_app 函数切换到下一个应用程序。此时 CPU 运行在 S 特权级，而它希望能够切换到 U 特权级。在 RISC-V 架构中，唯一一种能够使得 CPU 特权级下降的方法就是执行 Trap 返回的特权指令，如 sret 、mret 等。事实上，在从操作系统内核返回到运行应用程序之前，要完成如下这些工作：

- 构造应用程序开始执行所需的 Trap 上下文；
- 通过 \_\_restore 函数，从刚构造的 Trap 上下文中，恢复应用程序执行的部分寄存器；
- 设置 sepc CSR的内容为应用程序入口点 0x80400000；
- 切换 scratch 和 sp 寄存器，设置 sp 指向应用程序用户栈；
- 执行 sret 从 S 特权级切换到 U 特权级。

它们可以通过复用 \_\_restore 的代码来更容易的实现上述工作。我们只需要在内核栈上压入一个为启动应用程序而特殊构造的 Trap 上下文，再通过 \_\_restore 函数，就能让这些寄存器到达启动应用程序所需要的上下文状态。

```
// os/src/trap/context.rs

impl TrapContext {
    pub fn set_sp(&mut self, sp: usize) { self.x[2] = sp; }
    pub fn app_init_context(entry: usize, sp: usize) -> Self {
        let mut sstatus = sstatus::read();
        sstatus.set_spp(SPP::User);
        let mut cx = Self {
            x: [0; 32],
            sstatus,
            sepc: entry,
        };
        cx.set_sp(sp);
        cx
    }
}
```

为 TrapContext 实现 app\_init\_context 方法，修改其中的 sepc 寄存器为应用程序入口点 entry， sp 寄存器为我们设定的一个栈指针，并将 sstatus 寄存器的 SPP 字段设置为 User 。

在 run\_next\_app 函数中我们能够看到：

```
// os/src/batch.rs

pub fn run_next_app() -> ! {
    let mut app_manager = APP_MANAGER.exclusive_access();
    let current_app = app_manager.get_current_app();
    unsafe {
        app_manager.load_app(current_app);
    }
    app_manager.move_to_next_app();
    drop(app_manager);
    // before this we have to drop local variables related to resources manually
    // and release the resources
    unsafe extern "C" {
        unsafe fn __restore(cx_addr: usize);
    }
    unsafe {
        __restore(KERNEL_STACK.push_context(
            TrapContext::app_init_context(APP_BASE_ADDRESS, USER_STACK.get_sp())
        ) as *const _ as usize);
    }
    panic!("Unreachable in batch::run_current_app!");
}
```

在高亮行所做的事情是在内核栈上压入一个 Trap 上下文，其 sepc 是应用程序入口地址 0x80400000 ，其 sp 寄存器指向用户栈，其 sstatus 的 SPP 字段被设置为 User 。push\_context 的返回值是内核栈压入 Trap 上下文之后的栈顶，它会被作为 \_\_restore 的参数（回看 \_\_restore 代码 ，这时我们可以理解为何 \_\_restore 函数的起始部分会完成 $text{sp}leftarrowtext{a}\_0$ ），这使得在 \_\_restore 函数中 sp 仍然可以指向内核栈的栈顶。这之后，就和执行一次普通的 \_\_restore 函数调用一样了。

> **Note**
>
> 有兴趣的同学可以思考： sscratch 是何时被设置为内核栈顶的？

---

## 本节练习

2. \*\* 扩展内核，实现新系统调用get\_taskinfo，能显示当前task的id和task name；实现一个裸机应用程序B，能访问get\_taskinfo系统调用。

3. \*\* 扩展内核，能够统计多个应用的执行过程中系统调用编号和访问此系统调用的次数。

4. \*\* 扩展内核，能够统计每个应用执行后的完成时间。

7. \*\* 操作系统在完成用户态<-->内核态双向切换中的一般处理过程是什么？

   当 CPU 在用户态特权级（ RISC-V 的 U 模式）运行应用程序，执行到 Trap，切换到内核态特权级（ RISC-V的S 模式），批处理操作系统的对应代码响应 Trap，并执行系统调用服务，处理完毕后，从内核态返回到用户态应用程序继续执行后续指令。

8. \*\* 程序陷入内核的原因有中断、异常和陷入（系统调用），请问 riscv64 支持哪些中断 / 异常？如何判断进入内核是由于中断还是异常？描述陷入内核时的几个重要寄存器及其值。

   - 具体支持的异常和中断，参见 RISC-V 特权集规范 *The RISC-V Instruction Set Manual Volume II: Privileged Architecture* 。其它很多问题在这里也有答案。
   - scause 的最高位，为 1 表示中断，为 0 表示异常
   - 重要的寄存器：

     - scause ：发生了具体哪个异常或中断
     - sstatus ：其中的一些控制为标志发生异常时的处理器状态，如 sstatus.SPP 表示发生异常时处理器在哪个特权级。
     - sepc ：发生异常或中断的时候，将要执行但未成功执行的指令地址
     - stval ：值与具体异常相关，可能是发生异常的地址，指令等

10. \*\* Trap上下文的含义是啥？在本章的操作系统中，Trap上下文的具体内容是啥？如果不进行Trap上下文的保存于恢复，会出现什么情况？

> Trap上下文的主要有两部分含义：
>
> - 在触发 Trap 之前 CPU 运行在哪个特权级；
> - CPU 需要切换到哪个特权级来处理该 Trap ，并在处理完成之后返回原特权级。在本章的实际操作系统中，Trap上下文的具体内容主要包括通用寄存器和栈两部分。如果不进行Trap的上下文保存与恢复，CPU就无法在处理完成之后，返回原特权级。

---

## 本节练习

### 实验作业

### 实践作业

#### sys\_write 安全检查

ch2 中，我们实现了第一个系统调用 sys\_write，这使得我们可以在用户态输出信息。但是 os 在提供服务的同时，还有保护 os 本身以及其他用户程序不受错误或者恶意程序破坏的功能。

由于还没有实现虚拟内存，我们可以在用户程序中指定一个属于其他程序字符串，并将它输出，这显然是不合理的，因此我们要对 sys\_write 做检查：

- sys\_write 仅能输出位于程序本身内存空间内的数据，否则报错。

#### 实验要求

- 实现分支: ch2-lab
- 目录要求不变
- 为 sys\_write 增加安全检查

  在 os 目录下执行 make run TEST=1 测试 sys\_write 安全检查的实现，正确执行目标用户测例，并得到预期输出（详见测例注释）。

  注意：如果设置默认 log 等级，从 lab2 开始关闭所有 log 输出。

challenge: 支持多核，实现多个核运行用户程序。

#### 实验约定

在第二章的测试中，我们对于内核有如下仅仅为了测试方便的要求，请调整你的内核代码来符合这些要求。

- 用户栈大小必须为 4096，且按照 4096 字节对齐。这一规定可以在实验4开始删除，仅仅为通过 lab2/3 测例设置。

> **Note**
>
> **如何快速继承上一章练习题的修改**
>
> 从这一章开始，在完成本章习题之前，首先要做的就是将上一章框架的修改继承到本章的框架代码。出于各种原因，实际上通过 git merge 并不是很方便，这里给出一种打 patch 的方法，希望能够有所帮助。
>
> 1. 切换到上一章的分支，通过 git log 找到你在此分支上的第一次 commit 的前一个 commit 的 ID ，复制其前 8 位，记作 base-commit 。假设分支上最新的一次 commit ID 是 last-commit 。
> 2. 确保你位于项目根目录 rCore-Tutorial-v3 下。通过 git diff <base-commit> <last-commit> > <patch-path> 即可在 patch-path 路径位置（比如 ~/Desktop/chx.patch ）生成一个描述你对于上一章分支进行的全部修改的一个补丁文件。打开看一下，它给出了每个被修改的文件中涉及了哪些块的修改，还附加了块前后的若干行代码。如果想更加灵活进行合并的话，可以通过 git format-patch <base-commit> 命令在当前目录下生成一组补丁，它会对于 base-commit 后面的每一次 commit 均按照顺序生成一个补丁。
> 3. 切换到本章分支，通过 git apply --reject <patch-path> 来将一个补丁打到当前章节上。它的大概原理是对于补丁中的每个被修改文件中的每个修改块，尝试通过块的前后若干行代码来定位它在当前分支上的位置并进行替换。有一些块可能无法匹配，此时会生成与这些块所在的文件同名的 \*.rej 文件，描述了哪些块替换失败了。在项目根目录 rCore-Tutorial-v3 下，可以通过 find . -name \*.rej 来找到所有相关的 \*.rej 文件并手动完成替换。
> 4. 在处理完所有 \*.rej 之后，将它们删除并 commit 一下。现在就可以开始本章的实验了。

### 问答作业

1. 正确进入 U 态后，程序的特征还应有：使用 S 态特权指令，访问 S 态寄存器后会报错。请自行测试这些内容 (运行 Rust 三个 bad 测例 ) ，描述程序出错行为，注明你使用的 sbi 及其版本。
2. 请结合用例理解 [trap.S](https://github.com/rcore-os/rCore-Tutorial-v3/blob/ch2/os/src/trap/trap.S) 中两个函数 \_\_alltraps 和 \_\_restore 的作用，并回答如下几个问题:

   1. L40：刚进入 \_\_restore 时，a0 代表了什么值。请指出 \_\_restore 的两种使用情景。
   2. L46-L51：这几行汇编代码特殊处理了哪些寄存器？这些寄存器的的值对于进入用户态有何意义？请分别解释。

      ```
      ld t0, 32*8(sp)
      ld t1, 33*8(sp)
      ld t2, 2*8(sp)
      csrw sstatus, t0
      csrw sepc, t1
      csrw sscratch, t2
      ```
   3. L53-L59：为何跳过了 x2 和 x4？

      ```
      ld x1, 1*8(sp)
      ld x3, 3*8(sp)
      .set n, 5
      .rept 27
         LOAD_GP %n
         .set n, n+1
      .endr
      ```
   4. L63：该指令之后，sp 和 sscratch 中的值分别有什么意义？

      ```
      csrrw sp, sscratch, sp
      ```
   5. \_\_restore：中发生状态切换在哪一条指令？为何该指令执行之后会进入用户态？
   6. L13：该指令之后，sp 和 sscratch 中的值分别有什么意义？

      ```
      csrrw sp, sscratch, sp
      ```
   7. 从 U 态进入 S 态是哪一条指令发生的？
3. 对于任何中断，\_\_alltraps 中都需要保存所有寄存器吗？你有没有想到一些加速 \_\_alltraps 的方法？简单描述你的想法。

### 实验练习的提交报告要求

- 简单总结与上次实验相比本次实验你增加的东西（控制在5行以内，不要贴代码）。
- 完成问答问题。
- (optional) 你对本次实验设计及难度/工作量的看法，以及有哪些需要改进的地方，欢迎畅所欲言。

---

## 本节练习

2. \* 中断、异常和系统调用有何异同之处？

   - 相同点

     - 都会从通常的控制流中跳出，进入 trap handler 进行处理。
   - 不同点

     - 中断的来源是异步的外部事件，由外设、时钟、别的 hart 等外部来源，与 CPU 正在做什么没关系。
     - 异常是 CPU 正在执行的指令遇到问题无法正常进行而产生的。
     - 系统调用是程序有意想让操作系统帮忙执行一些操作，用专门的指令（如 ecall ）触发的。

3. \* RISC-V支持哪些中断/异常？

见下图

![./interrupts.png](/images/rust-os/rcore/chapter3/interrupts.png)

4. \* 如何判断进入操作系统内核的起因是由于中断还是异常？

检查 mcause 寄存器的最高位，1 表示中断，0 表示异常。

当然在 Rust 中也可以直接利用 riscv 库提供的接口判断：

```
let scause = scause::read();
    if scause.is_interrupt() {
        do_something
    }
    if scause.is_exception() {
        do_something
    }
```

又或者，可以按照 trap/mod.rs:trap\_handler() 中的写法，用
scause.cause().try\_into() 转换出的 Trap<Interrupt, Exception> 来判断。

5. \*\* 在 RISC-V 中断机制中，PLIC 和 CLINT 各起到了什么作用？

   CLINT 处理时钟中断 (MTI) 和核间的软件中断 (MSI)；PLIC 处理外部来源的中断 (MEI)。

   PLIC 的规范文档： <https://github.com/riscv/riscv-plic-spec>

6. \*\* 基于RISC-V 的操作系统支持中断嵌套？请给出进一步的解释说明。

RISC-V原生不支持中断嵌套。(在S态的内核中)只有 sstatus 的 SIE
位为 1 时，才会开启中断，再由 sie
寄存器控制哪些中断可以触发。触发中断时，sstatus.SPIE 置为
sstatus.SIE，而 sstatus.SIE 置为0；当执行 sret
时，sstatus.SIE置为 sstatus.SPIE，而 sstatus.SPIE
置为1。这意味着触发中断时，因为 sstatus.SIE
为0，所以无法再次触发中断。
