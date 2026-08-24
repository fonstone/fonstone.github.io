---
title: "基于地址空间的分时多任务"
description: "本节我们介绍如何基于地址空间抽象而不是对于物理内存的直接访问来实现支持地址空间隔离的分时多任务系统 -- “头甲龙” [[1]] 操作系统 。这样，我们的应用编写会更加方便，应用与操作系统内核的空间隔离性增强了，应用程序..."
date: "2026-07-12"
order: 77
tags: ["地址空间切换", "分时多任务", "进程", "任务切换"]
est_time: "30分钟"
---
## 本节导读

本节我们介绍如何基于地址空间抽象而不是对于物理内存的直接访问来实现支持地址空间隔离的分时多任务系统 -- “头甲龙” [[1]] 操作系统 。这样，我们的应用编写会更加方便，应用与操作系统内核的空间隔离性增强了，应用程序和操作系统自身的安全性也得到了加强。为此，需要对现有的操作系统进行如下的功能扩展：

- 创建内核页表，使能分页机制，建立内核的虚拟地址空间；
- 扩展Trap上下文，在保存与恢复Trap上下文的过程中切换页表（即切换虚拟地址空间）；
- 建立用于内核地址空间与应用地址空间相互切换所需的跳板空间；
- 扩展任务控制块包括虚拟内存相关信息，并在加载执行创建基于某应用的任务时，建立应用的虚拟地址空间；
- 改进Trap处理过程和sys\_write等系统调用的实现以支持分离的应用地址空间和内核地址空间。

在扩展了上述功能后，应用与应用之间，应用与操作系统内核之间通过硬件分页机制实现了内存空间隔离，且应用和内核之间还是能有效地进行相互访问，而且应用程序的编写也会更加简单通用。

## 建立并开启基于分页模式的虚拟地址空间

当 SBI 实现（本项目中基于 RustSBI）初始化完成后， CPU 将跳转到内核入口点并在 S 特权级上执行，此时还并没有开启分页模式，内核的每次访存是直接的物理内存访问。而在开启分页模式之后，内核代码在访存时只能看到内核地址空间，此时每次访存需要通过 MMU 的地址转换。这两种模式之间的过渡在内核初始化期间完成。

### 创建内核地址空间

我们创建内核地址空间的全局实例：

```
// os/src/mm/memory_set.rs

lazy_static! {
    pub static ref KERNEL_SPACE: Arc<UPSafeCell<MemorySet>> = Arc::new(unsafe {
        UPSafeCell::new(MemorySet::new_kernel()
    )});
}
```

从之前对于 lazy\_static! 宏的介绍可知， KERNEL\_SPACE 在运行期间它第一次被用到时才会实际进行初始化，而它所
占据的空间则是编译期被放在全局数据段中。这里使用 Arc<UPSafeCell<T>> 组合是因为我们既需要 Arc<T> 提供的共享
引用，也需要 UPSafeCell<T> 提供的内部可变引用访问。

在 rust\_main 函数中，我们首先调用 mm::init 进行内存管理子系统的初始化：

```
// os/src/mm/mod.rs

pub use memory_set::KERNEL_SPACE;

pub fn init() {
    heap_allocator::init_heap();
    frame_allocator::init_frame_allocator();
    KERNEL_SPACE.exclusive_access().activate();
}
```

可以看到，我们最先进行了全局动态内存分配器的初始化，因为接下来马上就要用到 Rust 的堆数据结构。接下来我们初始化物理页帧管理器（内含堆数据结构 Vec<T> ）使能可用物理页帧的分配和回收能力。最后我们创建内核地址空间并让 CPU 开启分页模式， MMU 在地址转换的时候使用内核的多级页表，这一切均在一行之内做到：

- 首先，我们引用 KERNEL\_SPACE ，这是它第一次被使用，就在此时它会被初始化，调用 MemorySet::new\_kernel 创建一个内核地址空间并使用 Arc<UPSafeCell<T>> 包裹起来；
- 接着使用 .exclusive\_access() 获取一个可变引用 &mut MemorySet 。需要注意的是这里发生了两次隐式类型转换：

  1. 我们知道 exclusive\_access 是 UPSafeCell<T> 的方法而不是 Arc<T> 的方法，由于 Arc<T> 实现了 Deref Trait ，当 exclusive\_access 需要一个 &UPSafeCell<T> 类型的参数的时候，编译器会自动将传入的 Arc<UPSafeCell<T>> 转换为 &UPSafeCell<T> 这样就实现了类型匹配；
  2. 事实上 UPSafeCell<T>::exclusive\_access 返回的是一个 RefMut<'\_, T> ，这同样是 RAII 的思想，当这个类型生命周期结束后互斥锁就会被释放。而该类型实现了 DerefMut Trait，因此当一个函数接受类型为 &mut T 的参数却被传入一个类型为 &mut RefMut<'\_, T> 的参数的时候，编译器会自动进行类型转换使参数匹配。
- 最后，我们调用 MemorySet::activate ：

  > ```
  > // os/src/mm/page_table.rs
  >
  > pub fn token(&self) -> usize {
  >     8usize << 60 | self.root_ppn.0
  > }
  >
  > // os/src/mm/memory_set.rs
  >
  > impl MemorySet {
  >     pub fn activate(&self) {
  >         let satp = self.page_table.token();
  >         unsafe {
  >             satp::write(satp::Satp::from_bits(satp));
  >             asm!("sfence.vma");
  >         }
  >     }
  > }
  > ```

  PageTable::token 会按照 satp CSR 格式要求 构造一个无符号 64 位无符号整数，使得其分页模式为 SV39 ，且将当前多级页表的根节点所在的物理页号填充进去。在 activate 中，我们将这个值写入当前 CPU 的 satp CSR ，从这一刻开始 SV39 分页模式就被启用了，而且 MMU 会使用内核地址空间的多级页表进行地址转换。

  我们必须注意切换 satp CSR 是否是一个 *平滑* 的过渡：其含义是指，切换 satp 的指令及其下一条指令这两条相邻的指令的虚拟地址是相邻的（由于切换 satp 的指令并不是一条跳转指令， pc 只是简单的自增当前指令的字长），而它们所在的物理地址一般情况下也是相邻的，但是它们所经过的地址转换流程却是不同的——切换 satp 导致 MMU 查的多级页表是不同的。这就要求前后两个地址空间在切换 satp 的指令 *附近* 的映射满足某种意义上的连续性。

  幸运的是，我们做到了这一点。这条写入 satp 的指令及其下一条指令都在内核内存布局的代码段中，在切换之后是一个恒等映射，而在切换之前是视为物理地址直接取指，也可以将其看成一个恒等映射。这完全符合我们的期待：即使切换了地址空间，指令仍应该能够被连续的执行。

注意到在 activate 的最后，我们插入了一条汇编指令 sfence.vma ，它又起到什么作用呢？

让我们再来回顾一下多级页表：它相比线性表虽然大量节约了内存占用，但是却需要 MMU 进行更多的隐式访存。如果是一个线性表， MMU 仅需单次访存就能找到页表项并完成地址转换，而多级页表（以 SV39 为例，不考虑大页）最顺利的情况下也需要三次访存。这些额外的访存和真正访问数据的那些访存在空间上并不相邻，加大了多级缓存的压力，一旦缓存缺失将带来巨大的性能惩罚。如果采用多级页表实现，这个问题会变得更为严重，使得地址空间抽象的性能开销过大。

为了解决性能问题，一种常见的做法是在 CPU 中利用部分硬件资源额外加入一个 **快表** (TLB, Translation Lookaside Buffer) ， 它维护了部分虚拟页号到页表项的键值对。当 MMU 进行地址转换的时候，首先会到快表中看看是否匹配，如果匹配的话直接取出页表项完成地址转换而无需访存；否则再去查页表并将键值对保存在快表中。一旦我们修改 satp 就会切换地址空间，快表中的键值对就会失效（因为快表保存着老地址空间的映射关系，切换到新地址空间后，老的映射关系就没用了）。为了确保 MMU 的地址转换能够及时与 satp 的修改同步，我们需要立即使用 sfence.vma 指令将快表清空，这样 MMU 就不会看到快表中已经过期的键值对了。

> **Note**
>
> **sfence.vma 是一个屏障(Barrier)**
>
> 对于一种含有快表的 RISC-V CPU 实现来说，我们可以认为 sfence.vma 的作用就是清空快表。事实上它在特权级规范中被定义为一种含义更加丰富的内存屏障，具体来说： sfence.vma 可以使得所有发生在它后面的地址转换都能够看到所有排在它前面的写入操作。在不同的硬件配置上这条指令要做的具体事务是有差异的。这条指令还可以被精细配置来减少同步开销，详情请参考 RISC-V 特权级规范。

### 检查内核地址空间的多级页表设置

调用 mm::init 之后我们就使能了内核动态内存分配、物理页帧管理，还启用了分页模式进入了内核地址空间。之后我们可以通过 mm::remap\_test 来检查内核地址空间的多级页表是否被正确设置：

```
// os/src/mm/memory_set.rs

pub fn remap_test() {
    let mut kernel_space = KERNEL_SPACE.exclusive_access();
    let mid_text: VirtAddr = ((linker_symbol_addr!(stext) + linker_symbol_addr!(etext)) / 2).into();
    let mid_rodata: VirtAddr =
        ((linker_symbol_addr!(srodata) + linker_symbol_addr!(erodata)) / 2).into();
    let mid_data: VirtAddr = ((linker_symbol_addr!(sdata) + linker_symbol_addr!(edata)) / 2).into();
    assert_eq!(
        kernel_space.page_table.translate(mid_text.floor()).unwrap().writable(),
        false
    );
    assert_eq!(
        kernel_space.page_table.translate(mid_rodata.floor()).unwrap().writable(),
        false,
    );
    assert_eq!(
        kernel_space.page_table.translate(mid_data.floor()).unwrap().executable(),
        false,
    );
    println!("remap_test passed!");
}
```

在上述函数的实现中，分别通过手动查内核多级页表的方式验证代码段和只读数据段不允许被写入，同时不允许从数据段上取指执行。

## 跳板机制的实现

上一小节我们看到无论是内核还是应用的地址空间，最高的虚拟页面都是一个跳板。同时应用地址空间的次高虚拟页面还被设置为用来存放应用的 Trap 上下文。那么跳板究竟起什么作用呢？为何不直接把 Trap 上下文仍放到应用的内核栈中呢？

回忆曾在第二章介绍过的 Trap 上下文保存与恢复 。当一个应用 Trap 到内核时，sscratch 已指向该应用的内核栈栈顶，我们用一条指令即可从用户栈切换到内核栈，然后直接将 Trap 上下文压入内核栈栈顶。当 Trap 处理完毕返回用户态的时候，将 Trap 上下文中的内容恢复到寄存器上，最后将保存着应用用户栈顶的 sscratch 与 sp 进行交换，也就从内核栈切换回了用户栈。在这个过程中， sscratch 起到了非常关键的作用，它使得我们可以在不破坏任何通用寄存器的情况下，完成用户栈与内核栈的切换，以及位于内核栈顶的 Trap 上下文的保存与恢复。

然而，一旦使能了分页机制，一切就并没有这么简单了，我们必须在这个过程中同时完成地址空间的切换。具体来说，当 \_\_alltraps 保存 Trap 上下文的时候，我们必须通过修改 satp 从应用地址空间切换到内核地址空间，因为 trap handler 只有在内核地址空间中才能访问；同理，在 \_\_restore 恢复 Trap 上下文的时候，我们也必须从内核地址空间切换回应用地址空间，因为应用的代码和数据只能在它自己的地址空间中才能访问，应用是看不到内核地址空间的。这样就要求地址空间的切换不能影响指令的连续执行，即要求应用和内核地址空间在切换地址空间指令附近是平滑的。

> **Note**
>
> **内核与应用地址空间的隔离**
>
> 目前我们的设计思路 A 是：对内核建立唯一的内核地址空间存放内核的代码、数据，同时对于每个应用维护一个它们自己的用户地址空间，因此在 Trap 的时候就需要进行地址空间切换，而在任务切换的时候无需进行（因为这个过程全程在内核内完成）。
>
> 另外的一种设计思路 B 是：让每个应用都有一个包含应用和内核的地址空间，并将其中的逻辑段分为内核和用户两部分，分别映射到内核/用户的数据和代码，且分别在 CPU 处于 S/U 特权级时访问。此设计中并不存在一个单独的内核地址空间。
>
> 设计方式 B 的优点在于： Trap 的时候无需切换地址空间，而在任务切换的时候才需要切换地址空间。相对而言，设计方式B比设计方式A更容易实现，在应用高频进行系统调用的时候，采用设计方式B能够避免频繁地址空间切换的开销，这通常源于快表或 cache 的失效问题。但是设计方式B也有缺点：即内核的逻辑段需要在每个应用的地址空间内都映射一次，这会带来一些无法忽略的内存占用开销，并显著限制了嵌入式平台（如我们所采用的 K210 ）的任务并发数。此外，设计方式 B 无法防御针对处理器电路设计缺陷的侧信道攻击（如 [熔断 (Meltdown) 漏洞](https://cacm.acm.org/magazines/2020/6/245161-meltdown/fulltext) ），使得恶意应用能够以某种方式间接“看到”内核地址空间中的数据，使得用户隐私数据有可能被泄露。将内核与地址空间隔离便是修复此漏洞的一种方法。
>
> 经过权衡，在本教程中我们参考 MIT 的教学 OS [xv6](https://github.com/mit-pdos/xv6-riscv) ，采用内核和应用地址空间隔离的设计。

我们为何将应用的 Trap 上下文放到应用地址空间的次高页面而不是内核地址空间中的内核栈中呢？原因在于，在保存 Trap 上下文到内核栈中之前，我们必须完成两项工作：1）必须先切换到内核地址空间，这就需要将内核地址空间的 token 写入 satp 寄存器；2）之后还需要保存应用的内核栈栈顶的位置，这样才能以它为基址保存 Trap 上下文。这两步需要用寄存器作为临时周转，然而我们无法在不破坏任何一个通用寄存器的情况下做到这一点。因为事实上我们需要用到内核的两条信息：内核地址空间的 token ，以及应用的内核栈栈顶的位置，RISC-V却只提供一个 sscratch 寄存器可用来进行周转。所以，我们不得不将 Trap 上下文保存在应用地址空间的一个虚拟页面中，而不是切换到内核地址空间去保存。

### 扩展Trap 上下文

为了方便实现，我们在 Trap 上下文中包含更多内容（和我们关于上下文的定义有些不同，它们在初始化之后便只会被读取而不会被写入，并不是每次都需要保存/恢复）：

```
// os/src/trap/context.rs

#[repr(C)]
pub struct TrapContext {
    pub x: [usize; 32],
    pub sstatus: Sstatus,
    pub sepc: usize,
    pub kernel_satp: usize,
    pub kernel_sp: usize,
    pub trap_handler: usize,
}
```

在多出的三个字段中：

- kernel\_satp 表示内核地址空间的 token ，即内核页表的起始物理地址；
- kernel\_sp 表示当前应用在内核地址空间中的内核栈栈顶的虚拟地址；
- trap\_handler 表示内核中 trap handler 入口点的虚拟地址。

它们在应用初始化的时候由内核写入应用地址空间中的 TrapContext 的相应位置，此后就不再被修改。

### 切换地址空间

让我们来看一下现在的 \_\_alltraps 和 \_\_restore 各是如何在保存和恢复 Trap 上下文的同时也切换地址空间的：

```
# os/src/trap/trap.S

    .section .text.trampoline
    .globl __alltraps
    .globl __restore
    .align 2
__alltraps:
    csrrw sp, sscratch, sp
    # now sp->*TrapContext in user space, sscratch->user stack
    # save other general purpose registers
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
    # we can use t0/t1/t2 freely, because they have been saved in TrapContext
    csrr t0, sstatus
    csrr t1, sepc
    sd t0, 32*8(sp)
    sd t1, 33*8(sp)
    # read user stack from sscratch and save it in TrapContext
    csrr t2, sscratch
    sd t2, 2*8(sp)
    # load kernel_satp into t0
    ld t0, 34*8(sp)
    # load trap_handler into t1
    ld t1, 36*8(sp)
    # move to kernel_sp
    ld sp, 35*8(sp)
    # switch to kernel space
    csrw satp, t0
    sfence.vma
    # jump to trap_handler
    jr t1

__restore:
    # a0: *TrapContext in user space(Constant); a1: user space token
    # switch to user space
    csrw satp, a1
    sfence.vma
    csrw sscratch, a0
    mv sp, a0
    # now sp points to TrapContext in user space, start restoring based on it
    # restore sstatus/sepc
    ld t0, 32*8(sp)
    ld t1, 33*8(sp)
    csrw sstatus, t0
    csrw sepc, t1
    # restore general purpose registers except x0/sp/tp
    ld x1, 1*8(sp)
    ld x3, 3*8(sp)
    .set n, 5
    .rept 27
        LOAD_GP %n
        .set n, n+1
    .endr
    # back to user stack
    ld sp, 2*8(sp)
    sret
```

- 当应用 Trap 进入内核的时候，硬件会设置一些 CSR 并在 S 特权级下跳转到 \_\_alltraps 保存 Trap 上下文。此时 sp 寄存器仍指向用户栈，但 sscratch 则被设置为指向应用地址空间中存放 Trap 上下文的位置（实际在次高页面）。随后，就像之前一样，我们 csrrw 交换 sp 和 sscratch ，并基于指向 Trap 上下文位置的 sp 开始保存通用寄存器和一些 CSR ，这个过程在第 28 行结束。到这里，我们就全程在应用地址空间中完成了保存 Trap 上下文的工作。
- 接下来该考虑切换到内核地址空间并跳转到 trap handler 了。

  - 第 30 行将内核地址空间的 token 载入到 t0 寄存器中；
  - 第 32 行将 trap handler 入口点的虚拟地址载入到 t1 寄存器中；
  - 第 34 行直接将 sp 修改为应用内核栈顶的地址；

  注：这三条信息均是内核在初始化该应用的时候就已经设置好的。

  - 第 36~37 行将 satp 修改为内核地址空间的 token 并使用 sfence.vma 刷新快表，这就切换到了内核地址空间；
  - 第 39 行 最后通过 jr 指令跳转到 t1 寄存器所保存的trap handler 入口点的地址。

  注：这里我们不能像之前的章节那样直接 call trap\_handler ，原因稍后解释。
- 当内核将 Trap 处理完毕准备返回用户态的时候会 *调用* \_\_restore （符合RISC-V函数调用规范），它有两个参数：第一个是 Trap 上下文在应用地址空间中的位置，这个对于所有的应用来说都是相同的，在 a0 寄存器中传递；第二个则是即将回到的应用的地址空间的 token ，在 a1 寄存器中传递。

  - 第 44~45 行先切换回应用地址空间（注：Trap 上下文是保存在应用地址空间中）；
  - 第 46 行将传入的 Trap 上下文位置保存在 sscratch 寄存器中，这样 \_\_alltraps 中才能基于它将 Trap 上下文保存到正确的位置；
  - 第 47 行将 sp 修改为 Trap 上下文的位置，后面基于它恢复各通用寄存器和 CSR；
  - 第 64 行最后通过 sret 指令返回用户态。

### 建立跳板页面

接下来还需要考虑切换地址空间前后指令能否仍能连续执行。可以看到我们将 trap.S 中的整段汇编代码放置在 .text.trampoline 段，并在调整内存布局的时候将它对齐到代码段的一个页面中：

```
# os/src/linker.ld

    stext = .;
    .text : {
        *(.text.entry)
+        . = ALIGN(4K);
+        strampoline = .;
+        *(.text.trampoline);
+        . = ALIGN(4K);
        *(.text .text.*)
    }
```

这样，这段汇编代码放在一个物理页帧中，且 \_\_alltraps 恰好位于这个物理页帧的开头，其物理地址被外部符号 strampoline 标记。在开启分页模式之后，内核和应用代码都只能看到各自的虚拟地址空间，而在它们的视角中，这段汇编代码都被放在它们各自地址空间的最高虚拟页面上，由于这段汇编代码在执行的时候涉及到地址空间切换，故而被称为跳板页面。

在产生trap前后的一小段时间内会有一个比较 **极端** 的情况，即刚产生trap时，CPU已经进入了内核态（即Supervisor Mode），但此时执行代码和访问数据还是在应用程序所处的用户态虚拟地址空间中，而不是我们通常理解的内核虚拟地址空间。在这段特殊的时间内，CPU指令为什么能够被连续执行呢？这里需要注意：无论是内核还是应用的地址空间，跳板的虚拟页均位于同样位置，且它们也将会映射到同一个实际存放这段汇编代码的物理页帧。也就是说，在执行 \_\_alltraps 或 \_\_restore 函数进行地址空间切换的时候，应用的用户态虚拟地址空间和操作系统内核的内核态虚拟地址空间对切换地址空间的指令所在页的映射方式均是相同的，这就说明了这段切换地址空间的指令控制流仍是可以连续执行的。

现在可以说明我们在创建用户/内核地址空间中用到的 map\_trampoline 是如何实现的了：

```
// os/src/config.rs

pub const TRAMPOLINE: usize = usize::MAX - PAGE_SIZE + 1;

// os/src/mm/memory_set.rs

impl MemorySet {
    /// Mention that trampoline is not collected by areas.
    fn map_trampoline(&mut self) {
        self.page_table.map(
            VirtAddr::from(TRAMPOLINE).into(),
            PhysAddr::from(linker_symbol_addr!(strampoline)).into(),
            PTEFlags::R | PTEFlags::X,
        );
    }
}
```

这里我们为了实现方便并没有新增逻辑段 MemoryArea 而是直接在多级页表中插入一个从地址空间的最高虚拟页面映射到跳板汇编代码所在的物理页帧的键值对，访问权限与代码段相同，即 RX （可读可执行）。

最后可以解释为何我们在 \_\_alltraps 中需要借助寄存器 jr 而不能直接 call trap\_handler 了。因为在内存布局中，这条 .text.trampoline 段中的跳转指令和 trap\_handler 都在代码段之内，汇编器（Assembler）和链接器（Linker）会根据 linker-qemu/k210.ld 的地址布局描述，设定跳转指令的地址，并计算二者地址偏移量，让跳转指令的实际效果为当前 pc 自增这个偏移量。但实际上由于我们设计的缘故，这条跳转指令在被执行的时候，它的虚拟地址被操作系统内核设置在地址空间中的最高页面之内，所以加上这个偏移量并不能正确的得到 trap\_handler 的入口地址。

**问题的本质可以概括为：跳转指令实际被执行时的虚拟地址和在编译器/汇编器/链接器进行后端代码生成和链接形成最终机器码时设置此指令的地址是不同的。**

## 加载和执行应用程序

### 扩展任务控制块

为了让应用在运行时有一个安全隔离且符合编译器给应用设定的地址空间布局的虚拟地址空间，操作系统需要对任务进行更多的管理，所以任务控制块相比第三章也包含了更多内容：

```
// os/src/task/task.rs

pub struct TaskControlBlock {
    pub task_cx: TaskContext,
    pub task_status: TaskStatus,
    pub memory_set: MemorySet,
    pub trap_cx_ppn: PhysPageNum,
    pub base_size: usize,
}
```

除了应用的地址空间 memory\_set 之外，还有位于应用地址空间次高页的 Trap 上下文被实际存放在物理页帧的物理页号 trap\_cx\_ppn ，它能够方便我们对于 Trap 上下文进行访问。此外， base\_size 统计了应用数据的大小，也就是在应用地址空间中从 $text{0x0}$ 开始到用户栈结束一共包含多少字节。它后续还应该包含用于应用动态内存分配的堆空间的大小，但目前暂不支持。

### 更新对任务控制块的管理

下面是任务控制块的创建：

```
// os/src/config.rs

/// Return (bottom, top) of a kernel stack in kernel space.
pub fn kernel_stack_position(app_id: usize) -> (usize, usize) {
    let top = TRAMPOLINE - app_id * (KERNEL_STACK_SIZE + PAGE_SIZE);
    let bottom = top - KERNEL_STACK_SIZE;
    (bottom, top)
}

// os/src/task/task.rs

impl TaskControlBlock {
    pub fn new(elf_data: &[u8], app_id: usize) -> Self {
        // memory_set with elf program headers/trampoline/trap context/user stack
        let (memory_set, user_sp, entry_point) = MemorySet::from_elf(elf_data);
        let trap_cx_ppn = memory_set
            .translate(VirtAddr::from(TRAP_CONTEXT).into())
            .unwrap()
            .ppn();
        let task_status = TaskStatus::Ready;
        // map a kernel-stack in kernel space
        let (kernel_stack_bottom, kernel_stack_top) = kernel_stack_position(app_id);
        KERNEL_SPACE
            .exclusive_access()
            .insert_framed_area(
                kernel_stack_bottom.into(),
                kernel_stack_top.into(),
                MapPermission::R | MapPermission::W,
            );
        let task_control_block = Self {
            task_status,
            task_cx: TaskContext::goto_trap_return(kernel_stack_top),
            memory_set,
            trap_cx_ppn,
            base_size: user_sp,
        };
        // prepare TrapContext in user space
        let trap_cx = task_control_block.get_trap_cx();
        *trap_cx = TrapContext::app_init_context(
            entry_point,
            user_sp,
            KERNEL_SPACE.exclusive_access().token(),
            kernel_stack_top,
            linker_symbol_addr!(trap_handler),
        );
        task_control_block
    }
}
```

- 第 15 行，解析传入的 ELF 格式数据构造应用的地址空间 memory\_set 并获得其他信息；
- 第 16 行，从地址空间 memory\_set 中查多级页表找到应用地址空间中的 Trap 上下文实际被放在哪个物理页帧；
- 第 22 行，根据传入的应用 ID app\_id 调用在 config 子模块中定义的 kernel\_stack\_position 找到
  应用的内核栈预计放在内核地址空间 KERNEL\_SPACE 中的哪个位置，并通过 insert\_framed\_area 实际将这个逻辑段
  加入到内核地址空间中；
- 第 30~32 行，在应用的内核栈顶压入一个跳转到 trap\_return 而不是 \_\_restore 的任务上下文，这主要是为了能够支持对该应用的启动并顺利切换到用户地址空间执行。在构造方式上，只是将 ra 寄存器的值设置为 trap\_return 的地址。 trap\_return 是后面要介绍的新版的 Trap 处理的一部分。

  这里对裸指针解引用成立的原因在于：当前已经进入了内核地址空间，而要操作的内核栈也是在内核地址空间中的；
- 第 33~36 行，用上面的信息来创建并返回任务控制块实例 task\_control\_block；
- 第 38 行，查找该应用的 Trap 上下文的内核虚地址。由于应用的 Trap 上下文是在应用地址空间而不是在内核地址空间中，我们只能手动查页表找到 Trap 上下文实际被放在的物理页帧，然后通过之前介绍的 在内核地址空间读写特定物理页帧的能力 获得在用户空间的 Trap 上下文的可变引用用于初始化：

  ```
  // os/src/task/task.rs

  impl TaskControlBlock {
      pub fn get_trap_cx(&self) -> &'static mut TrapContext {
          self.trap_cx_ppn.get_mut()
      }
  }
  ```

  此处需要说明的是，返回 'static 的可变引用和之前一样可以看成一个绕过 unsafe 的裸指针；而 PhysPageNum::get\_mut 是一个泛型函数，由于我们已经声明了总体返回 TrapContext 的可变引用，则Rust编译器会给 get\_mut 泛型函数针对具体类型 TrapContext 的情况生成一个特定版本的 get\_mut 函数实现。在 get\_trap\_cx 函数中则会静态调用 get\_mut 泛型函数的特定版本实现。
- 第 39~45 行，调用 TrapContext::app\_init\_context 函数，通过应用的 Trap 上下文的可变引用来对其进行初始化。具体初始化过程如下所示：

  ```
  // os/src/trap/context.rs

  impl TrapContext {
      pub fn set_sp(&mut self, sp: usize) { self.x[2] = sp; }
      pub fn app_init_context(
          entry: usize,
          sp: usize,
          kernel_satp: usize,
          kernel_sp: usize,
          trap_handler: usize,
      ) -> Self {
          let mut sstatus = sstatus::read();
          sstatus.set_spp(SPP::User);
          let mut cx = Self {
              x: [0; 32],
              sstatus,
              sepc: entry,
              kernel_satp,
              kernel_sp,
              trap_handler,
          };
          cx.set_sp(sp);
          cx
      }
  }
  ```

  和之前实现相比， TrapContext::app\_init\_context 需要补充上让应用在 \_\_alltraps 能够顺利进入到内核地址空间并跳转到 trap handler 入口点的相关信息。

在内核初始化的时候，需要将所有的应用加载到全局应用管理器中：

```
// os/src/task/mod.rs

struct TaskManagerInner {
    tasks: Vec<TaskControlBlock>,
    current_task: usize,
}

lazy_static! {
    pub static ref TASK_MANAGER: TaskManager = {
        println!("init TASK_MANAGER");
        let num_app = get_num_app();
        println!("num_app = {}", num_app);
        let mut tasks: Vec<TaskControlBlock> = Vec::new();
        for i in 0..num_app {
            tasks.push(TaskControlBlock::new(
                get_app_data(i),
                i,
            ));
        }
        TaskManager {
            num_app,
            inner: RefCell::new(TaskManagerInner {
                tasks,
                current_task: 0,
            }),
        }
    };
}
```

可以看到，在 TaskManagerInner 中我们使用向量 Vec 来保存任务控制块。在全局任务管理器 TASK\_MANAGER 初始化的时候，只需使用 loader 子模块提供的 get\_num\_app 和 get\_app\_data 分别获取链接到内核的应用数量和每个应用的 ELF 文件格式的数据，然后依次给每个应用创建任务控制块并加入到向量中即可。将 current\_task 设置为 0 ，表示内核将从第 0 个应用开始执行。

回过头来介绍一下应用构建器 os/build.rs 的改动：

- 首先，我们在 .incbin 中不再插入清除全部符号的应用二进制镜像 \*.bin ，而是将应用的 ELF 执行文件直接链接进来；
- 其次，在链接每个 ELF 执行文件之前我们都加入一行 .align 3 来确保它们对齐到 8 字节，这是由于如果不这样做， xmas-elf crate 可能会在解析 ELF 的时候进行不对齐的内存读写，例如使用 ld 指令从内存的一个没有对齐到 8 字节的地址加载一个 64 位的值到一个通用寄存器。而在 k210 平台上，由于其硬件限制，这种情况会触发一个内存读写不对齐的异常，导致解析无法正常完成。

为了方便后续的实现，全局任务管理器还需要提供关于当前应用与地址空间有关的一些信息：

```
// os/src/task/mod.rs

impl TaskManager {
    fn get_current_token(&self) -> usize {
        let inner = self.inner.borrow();
        let current = inner.current_task;
        inner.tasks[current].get_user_token()
    }

    fn get_current_trap_cx(&self) -> &mut TrapContext {
        let inner = self.inner.borrow();
        let current = inner.current_task;
        inner.tasks[current].get_trap_cx()
    }
}

pub fn current_user_token() -> usize {
    TASK_MANAGER.get_current_token()
}

pub fn current_trap_cx() -> &'static mut TrapContext {
    TASK_MANAGER.get_current_trap_cx()
}
```

通过 current\_user\_token 可以获得当前正在执行的应用的地址空间的 token 。同时，该应用地址空间中的 Trap 上下文很关键，内核需要访问它来拿到应用进行系统调用的参数并将系统调用返回值写回，通过 current\_trap\_cx 内核可以拿到它访问这个 Trap 上下文的可变引用并进行读写。

## 改进 Trap 处理的实现

让我们来看现在 trap\_handler 的改进实现：

```
// os/src/trap/mod.rs

fn set_kernel_trap_entry() {
    unsafe {
        stvec::write(stvec::Stvec::new(
            linker_symbol_addr!(trap_from_kernel),
            TrapMode::Direct,
        ));
    }
}

#[unsafe(no_mangle)]
pub fn trap_from_kernel() -> ! {
    panic!("a trap from kernel!");
}

#[unsafe(no_mangle)]
pub fn trap_handler() -> ! {
    set_kernel_trap_entry();
    let cx = current_trap_cx();
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
        ...
    }
    trap_return();
}
```

由于应用的 Trap 上下文不在内核地址空间，因此我们调用 current\_trap\_cx 来获取当前应用的 Trap 上下文的可变引用而不是像之前那样作为参数传入 trap\_handler 。至于 Trap 处理的过程则没有发生什么变化。

注意到，在 trap\_handler 的开头还调用 set\_kernel\_trap\_entry 将 stvec 修改为同模块下另一个函数 trap\_from\_kernel 的地址。这就是说，一旦进入内核后再次触发到 S态 Trap，则硬件在设置一些 CSR 寄存器之后，会跳过对通用寄存器的保存过程，直接跳转到 trap\_from\_kernel 函数，在这里直接 panic 退出。这是因为内核和应用的地址空间分离之后，U态 --> S态 与 S态 --> S态 的 Trap 上下文保存与恢复实现方式/Trap 处理逻辑有很大差别。这里为了简单起见，弱化了 S态 --> S态的 Trap 处理过程：直接 panic 。

在 trap\_handler 完成 Trap 处理之后，我们需要调用 trap\_return 返回用户态：

```
// os/src/trap/mod.rs

fn set_user_trap_entry() {
    unsafe {
        stvec::write(stvec::Stvec::new(TRAMPOLINE, TrapMode::Direct));
    }
}

#[unsafe(no_mangle)]
pub fn trap_return() -> ! {
    set_user_trap_entry();
    let trap_cx_ptr = TRAP_CONTEXT;
    let user_satp = current_user_token();
    unsafe extern "C" {
        unsafe fn __alltraps();
        unsafe fn __restore();
    }
    let restore_va = linker_symbol_addr!(__restore) - linker_symbol_addr!(__alltraps) + TRAMPOLINE;
    unsafe {
        asm!(
            "fence.i",
            "jr {restore_va}",
            restore_va = in(reg) restore_va,
            in("a0") trap_cx_ptr,
            in("a1") user_satp,
            options(noreturn)
        );
    }
    panic!("Unreachable in back_to_user!");
}
```

- 第 11 行，在 trap\_return 的开始处就调用 set\_user\_trap\_entry ，来让应用 Trap 到 S 的时候可以跳转到 \_\_alltraps 。注：我们把 stvec 设置为内核和应用地址空间共享的跳板页面的起始地址 TRAMPOLINE 而不是编译器在链接时看到的 \_\_alltraps 的地址。这是因为启用分页模式之后，内核只能通过跳板页面上的虚拟地址来实际取得 \_\_alltraps 和 \_\_restore 的汇编代码。
- 第 12~13 行，准备好 \_\_restore 需要两个参数：分别是 Trap 上下文在应用地址空间中的虚拟地址和要继续执行的应用地址空间的 token 。

  最后我们需要跳转到 \_\_restore ，以执行：切换到应用地址空间、从 Trap 上下文中恢复通用寄存器、 sret 继续执行应用。它的关键在于如何找到 \_\_restore 在内核/应用地址空间中共同的虚拟地址。
- 第 18 行，展示了计算 \_\_restore 虚地址的过程：由于 \_\_alltraps 是对齐到地址空间跳板页面的起始地址 TRAMPOLINE 上的， 则 \_\_restore 的虚拟地址只需在 TRAMPOLINE 基础上加上 \_\_restore 相对于 \_\_alltraps 的偏移量即可。这里 \_\_alltraps 和 \_\_restore 都是指编译器在链接时看到的内核内存布局中的地址。
- 第 20-27 行，首先需要使用 fence.i 指令清空指令缓存 i-cache 。这是因为，在内核中进行的一些操作可能导致一些原先存放某个应用代码的物理页帧如今用来存放数据或者是其他应用的代码，i-cache 中可能还保存着该物理页帧的错误快照。因此我们直接将整个 i-cache 清空避免错误。接着使用 jr 指令完成了跳转到 \_\_restore 的任务。

当每个应用第一次获得 CPU 使用权即将进入用户态执行的时候，它的内核栈顶放置着我们在 内核加载应用的时候 构造的一个任务上下文：

```
// os/src/task/context.rs

impl TaskContext {
    pub fn goto_trap_return() -> Self {
        Self {
            ra: linker_symbol_addr!(trap_return),
            s: [0; 12],
        }
    }
}
```

在 \_\_switch 切换到该应用的任务上下文的时候，内核将会跳转到 trap\_return 并返回用户态开始该应用的启动执行。

## 改进 sys\_write 的实现

类似Trap处理的改进，由于内核和应用地址空间的隔离， sys\_write 不再能够直接访问位于应用空间中的数据，而需要手动查页表才能知道那些数据被放置在哪些物理页帧上并进行访问。

为此，页表模块 page\_table 提供了将应用地址空间中一个缓冲区转化为在内核空间中能够直接访问的形式的辅助函数：

```
// os/src/mm/page_table.rs

pub fn translated_byte_buffer(
    token: usize,
    ptr: *const u8,
    len: usize
) -> Vec<&'static [u8]> {
    let page_table = PageTable::from_token(token);
    let mut start = ptr as usize;
    let end = start + len;
    let mut v = Vec::new();
    while start < end {
        let start_va = VirtAddr::from(start);
        let mut vpn = start_va.floor();
        let ppn = page_table
            .translate(vpn)
            .unwrap()
            .ppn();
        vpn.step();
        let mut end_va: VirtAddr = vpn.into();
        end_va = end_va.min(VirtAddr::from(end));
        if end_va.page_offset() == 0 {
            v.push(&mut ppn.get_bytes_array()[start_va.page_offset()..]);
        } else {
            v.push(&mut ppn.get_bytes_array()[start_va.page_offset()..end_va.page_offset()]);
        }
        start = end_va.into();
    }
    v
}
```

参数中的 token 是某个应用地址空间的 token ， ptr 和 len 则分别表示该地址空间中的一段缓冲区的起始地址和长度(注：这个缓冲区的应用虚拟地址范围是连续的)。 translated\_byte\_buffer 会以向量的形式返回一组可以在内核空间中直接访问的字节数组切片（注：这个缓冲区的内核虚拟地址范围有可能是不连续的），具体实现在这里不再赘述。

进而我们可以完成对 sys\_write 系统调用的改造：

```
// os/src/syscall/fs.rs

pub fn sys_write(fd: usize, buf: *const u8, len: usize) -> isize {
    match fd {
        FD_STDOUT => {
            let buffers = translated_byte_buffer(current_user_token(), buf, len);
            for buffer in buffers {
                print!("{}", core::str::from_utf8(buffer).unwrap());
            }
            len as isize
        },
        _ => {
            panic!("Unsupported fd in sys_write!");
        }
    }
}
```

上述函数尝试将按应用的虚地址指向的缓冲区转换为一组按内核虚地址指向的字节数组切片构成的向量，然后把每个字节数组切片转化为字符串``&str`` 然后输出即可。

## 小结

这一章内容很多，讲解了 **地址空间** 这一抽象概念是如何在一个具体的“头甲龙”操作系统中实现的。这里面的核心内容是如何建立基于页表机制的虚拟地址空间。为此，操作系统需要知道并管理整个系统中的物理内存；需要建立虚拟地址到物理地址映射关系的页表；并基于页表给操作系统自身和每个应用提供一个虚拟地址空间；并需要对管理应用的任务控制块进行扩展，确保能对应用的地址空间进行管理；由于应用和内核的地址空间是隔离的，需要有一个跳板来帮助完成应用与内核之间的切换执行；并导致了对异常、中断、系统调用的相应更改。这一系列的改进，最终的效果是编写应用更加简单了，且应用的执行或错误不会影响到内核和其他应用的正常工作。为了得到这些好处，我们需要比较费劲地进化我们的操作系统。如果同学结合阅读代码，编译并运行应用+内核，读懂了上面的文档，那完成本章的实验就有了一个坚实的基础。

如果同学能想明白如何插入/删除页表；如何在 trap\_handler 下处理 LoadPageFault ；以及 sys\_get\_time 在使能页机制下如何实现，那就会发现下一节的实验练习也许 **就和lab1一样** 。

[1] [ 1 ] 头甲龙最早出现在1.8亿年以前的侏罗纪中期，是身披重甲的食素恐龙，尾巴末端的尾锤，是防身武器。

---

## 本节练习

3. \*\*\* 扩展内核，支持基于缺页异常机制，具有Lazy 策略的按需分页机制。

   在页面懒分配（Lazy allocation of pages）技术中，内存分配并不会立即发生，而是在需要使用内存时才分配，这样可以节省系统的资源并提高程序的性能。

   实现页面懒分配的思路是：当调用sbrk时不分配实际的页面，而是仅仅增大堆的大小，当实际访问页面时，就会触发缺页异常，此时再申请一个页面并映射到页表中，这时再次执行触发缺页异常的代码就可以正常读写内存了。

   注释掉growproc()函数，增加堆的size，但不实际分配内存：

```
//os/syscall.c
uint64 sys_sbrk(int n)
{
     uint64 addr;
     struct proc *p = curr_proc();
     addr = p->program_brk;
     int heap_size = addr + n - p->heap_bottom;
     if(heap_size < 0){
             errorf("out of heap_bottom\n");
             return -1;
     }
     else{
             p->program_brk += n; //增加堆的size，但不实际分配内存
             if(n < 0){
                     printf("uvmdealloc\n");
                     uvmdealloc(p->pagetable, addr, addr + n); //如果减少内存则调用内存释放函数
             }
     }
     //if(growproc(n) < 0) //注释掉growproc()函数，不实际分配内存
     //        return -1;
     return addr;
}
```

因为没有给虚拟地址实际分配内存，所以当对相应的虚拟地址的内存进行读写的时候会触发缺页错误，这时再实际分配内存：

```
//os/loader.c
void usertrap()
{
     set_kerneltrap();
     struct trapframe *trapframe = curr_proc()->trapframe;
     tracef("trap from user epc = %p", trapframe->epc);
     if ((r_sstatus() & SSTATUS_SPP) != 0)
             panic("usertrap: not from user mode");
     uint64 cause = r_scause();
     if (cause & (1ULL << 63)) {
             cause &= ~(1ULL << 63);
             switch (cause) {
             case SupervisorTimer:
                     tracef("time interrupt!");
                     set_next_timer();
                     yield();
                     break;
             default:
                     unknown_trap();
                     break;
             }
     } else {
             switch (cause) {
             case UserEnvCall:
                     trapframe->epc += 4;
                     syscall();
                     break;
             case StorePageFault: // 读缺页错误
             case LoadPageFault:  // 写缺页错误
                     {
                             uint64 addr = r_stval(); // 获取发生缺页错误的地址
                             if(lazy_alloc(addr) < 0){ // 调用页面懒分配函数
                                     errorf("lazy_aolloc() failed!\n");
                                     exit(-2);
                             }
                             break;
                     }
             case StoreMisaligned:
             case InstructionMisaligned:
             case InstructionPageFault:
             case LoadMisaligned:
                     errorf("%d in application, bad addr = %p, bad instruction = %p, "
                            "core dumped.",
                            cause, r_stval(), trapframe->epc);
                     exit(-2);
                     break;
             case IllegalInstruction:
                     errorf("IllegalInstruction in application, core dumped.");
                     exit(-3);
                     break;
             default:
                     unknown_trap();
                     break;
             }
     }
     usertrapret();
}
```

实现页面懒分配函数，首先判断地址是否在堆的范围内，然后分配实际的内存，最后在页面中建立映射：

```
//os/trap.c
int lazy_alloc(uint64 addr){
     struct proc *p = curr_proc();
     // 通过两个if判断发生缺页错误的地址是否在堆的范围内，不在则返回
     if (addr >= p->program_brk) {
             errorf("lazy_alloc: access invalid address");
             return -1;
     }
     if (addr < p->heap_bottom) {
             errorf("lazy_alloc: access address below stack");
             return -2;
     }
     uint64 va = PGROUNDDOWN(addr);
     char* mem = kalloc(); // 调用kalloc()实际分配页面
     if (mem == 0) {
             errorf("lazy_alloc: kalloc failed");
             return -3;
     }
     memset(mem, 0, PGSIZE);
     if(mappages(p->pagetable, va, PGSIZE, (uint64)mem, PTE_W|PTE_X|PTE_R|PTE_U) != 0){ // 将新分配的页面和虚拟地址在页表中建立映射
             kfree(mem);
             return -4;
     }
     return 0;
}
```

4. \*\*\* 扩展内核，支持基于缺页异常的COW机制。（初始时，两个任务共享一个只读物理页。当一个任务执行写操作后，两个任务拥有各自的可写物理页）

   COW（Copy on Write）是指当需要在内存中创建一个新的副本时，COW技术会推迟复制操作，直到数据被修改为止。从而减少不必要的内存拷贝，提升性能。

   实现COW的思路是：在创建内存副本时，在内存中创建一个指向原始数据的指针或引用，而不是创建原始数据的完整副本。如果原始数据没有被修改，新副本将继续共享原始数据的指针或引用，以节省内存。当某个程序试图修改数据时，COW技术会在新副本中复制原始数据，使得每个程序都有自己的独立副本，从而避免数据之间的干扰。

   增加一个当做计数器的数据结构用于记录每个物理页面被多少变量引用，当页面初始被分配时计数器设置为1，其后如果产生副本则计数器加1。当页面被释放的时候则计数器减1，如果计数器不为0，说明还有其他引用在使用该页面，此时不执行实际的释放操作，最后计数器变为0时才真正释放页面：

```
//os/kalloc.c
uint64 page_ref[ (PHYSTOP - KERNBASE)/PAGE_SIZE] = {0}; // 定义用来记录页面引用的计数器，并将其值初始化为0
// 新增修改页面计数器的函数
void page_ref_add(uint64 pa, int n){ // 增加页面计数
     page_ref[(PGROUNDDOWN(pa)-KERNBASE)/PGSIZE] += n;
}
void page_ref_reduce(uint64 pa, int n){ // 减少页面计数
     page_ref[(PGROUNDDOWN(pa)-KERNBASE)/PGSIZE] -= n;
}
uint64 page_ref_get(uint64 pa){ // 返回页面计数
     return page_ref[(PGROUNDDOWN(pa)-KERNBASE)/PGSIZE];
}
void *kalloc()
{
     struct linklist *l;
     l = kmem.freelist;
     if (l) {
             kmem.freelist = l->next;
             memset((char *)l, 5, PGSIZE); // fill with junk
             page_ref_add((uint64)l, 1); // 在页面分配的时候设置计数器为1
     }
     return (void *)l;
}
void kfree(void *pa)
{
     struct linklist *l;
     if (((uint64)pa % PGSIZE) != 0 || (char *)pa < ekernel ||
         (uint64)pa >= PHYSTOP)
             panic("kfree");
     if(page_ref_get((uint64)pa) > 1){ // 判断计数器的值，如果大于1说明还有其他引用，计数器减1后直接返回
             page_ref_reduce((uint64)pa, 1);
             return;
     }
     // Fill with junk to catch dangling refs.
     memset(pa, 1, PGSIZE);
     l = (struct linklist *)pa;
     l->next = kmem.freelist;
     kmem.freelist = l;
}
```

修改内存复制函数umcopy()，其实不进行实际的内存复制，只是增加新的引用到需要复制的内存上：

```
 //os/vm.c
 int uvmcopy(pagetable_t old, pagetable_t new, uint64 max_page)
{
      pte_t *pte;
      uint64 pa, i;
      uint flags;
      //char *mem;
      for (i = 0; i < max_page * PAGE_SIZE; i += PGSIZE) {
              if ((pte = walk(old, i, 0)) == 0)
                      continue;
              if ((*pte & PTE_V) == 0)
                      continue;
              pa = PTE2PA(*pte);
              flags = PTE_FLAGS(*pte);
              *pte = ((*pte) & (~PTE_W)) | PTE_COW; // 虽然不进行内存页的复制，但是需要修改内存页的操作权限，取消页的写操作权限，同时增加COW权限
              /*if ((mem = kalloc()) == 0) // 注释掉分配内存的函数
                      goto err;
              memmove(mem, (char *)pa, PGSIZE);
              if (mappages(new, i, PGSIZE, (uint64)mem, flags) != 0) {*/
              if (mappages(new, i, PGSIZE, (uint64)pa, (flags & (~PTE_W)) | PTE_COW) != 0) { // 让另一页表中的虚拟地址指向原来页表中的物理地址
                      //kfree(mem);
                      goto err;
              }
              page_ref_add(pa, 1);
      }
      return 0;
 err:
      uvmunmap(new, 0, i / PGSIZE, 1);
      return -1;
 }
```

因为没有实际地进行内存复制，且取消了页面的的写权限，所以当对相应的虚拟地址的内存进行写操作的时候会触发缺页错误，这时再调用cowcopy()函数实际分配页或修改页的写权限：

```
//os/trap.c
void usertrap()
{
     set_kerneltrap();
     struct trapframe *trapframe = curr_proc()->trapframe;
     tracef("trap from user epc = %p", trapframe->epc);
     if ((r_sstatus() & SSTATUS_SPP) != 0)
             panic("usertrap: not from user mode");
     uint64 cause = r_scause();
     if (cause & (1ULL << 63)) {
             cause &= ~(1ULL << 63);
             switch (cause) {
             case SupervisorTimer:
                     tracef("time interrupt!");
                     set_next_timer();
                     yield();
                     break;
             default:
                     unknown_trap();
                     break;
             }
     } else {
             switch (cause) {
             case UserEnvCall:
                     trapframe->epc += 4;
                     syscall();
                     break;
             case StorePageFault:{ // 写缺页错误
                     uint64 va = r_stval(); //获取发生缺页错误的虚拟地址
                     if(cowcopy(va) == -1){ // 当发生写缺页错误的时候，调用COW函数，进行实际的内存复制
                             errorf("Copy on Write Failed!\n");
                             exit(-2);
                     }
                     break;
             }
             case StoreMisaligned:
             case InstructionMisaligned:
             case InstructionPageFault:
             case LoadMisaligned:
             case LoadPageFault:
                     errorf("%d in application, bad addr = %p, bad instruction = %p, "
                            "core dumped.",
                            cause, r_stval(), trapframe->epc);
                     exit(-2);
                     break;
             case IllegalInstruction:
                     errorf("IllegalInstruction in application, core dumped.");
                     exit(-3);
                     break;
             default:
                     unknown_trap();
                     break;
             }
     }
     usertrapret();
}
```

实现cowcopy()分配函数，首先判断地址是否在堆的范围内，然后分配实际的内存，最后在页面中建立映射：

```
//os/vm.c
int cowcopy(uint64 va){
     va = PGROUNDDOWN(va);
     pagetable_t p = curr_proc()->pagetable;
     pte_t* pte = walk(p, va, 0);
     uint64 pa = PTE2PA(*pte);
     uint flags = PTE_FLAGS(*pte); // 获取页面的操作权限
     if(!(flags & PTE_COW)){
             printf("not cow\n");
             return -2; // not cow page
     }
     uint ref = page_ref_get(pa); // 获取页面的被引用的次数
     if(ref > 1){ // 若果大于1则说明有多个引用，这时需要重新分配页面
             // ref > 1, alloc a new page
             char* mem = kalloc();
             if(mem == 0){
                     errorf("kalloc failed!\n");
                     return -1;
             }
             memmove(mem, (char*)pa, PGSIZE); // 复制页中的内容到新的页
             if(mappages(p, va, PGSIZE, (uint64)mem, (flags & (~PTE_COW)) | PTE_W) != 0){
                     errorf("mappage failed!\n");
                     kfree(mem);
                     return -1;
             }
             page_ref_reduce(pa, 1);
     }else{
             // ref = 1, use this page directly
             *pte = ((*pte) & (~PTE_COW)) | PTE_W; // 如果没有其他引用则修改页面操作权限，使得该页面可以进行写操作
     }
     return 0;
}
```

6. \*\* 如果在页访问异常中断服务例程执行时，再次出现页访问异常，这时计算机系统（软件或硬件）会如何处理？这种情况可能出现吗？

   我们实验的os在此时不支持内核的异常中断，因此此时会直接panic掉，并且这种情况在我们的os中这种情况不可能出现。像linux系统，也不会出现嵌套的page fault。

15. \*\* 缺页指的是进程访问页面时页面不在页表中或在页表中无效的现象，此时 MMU 将会返回一个中断，告知操作系统：该进程内存访问出了问题。然后操作系统可选择填补页表并重新执行异常指令或者杀死进程。操作系统基于缺页异常进行优化的两个常见策略中，其一是 Lazy 策略，也就是直到内存页面被访问才实际进行页表操作。比如，一个程序被执行时，进程的代码段理论上需要从磁盘加载到内存。但是 操作系统并不会马上这样做，而是会保存 .text 段在磁盘的位置信息，在这些代码第一次被执行时才完成从磁盘的加载操作。 另一个常见策略是 swap 页置换策略，也就是内存页面可能被换到磁盘上了，导致对应页面失效，操作系统在任务访问到该页产生异常时，再把数据从磁盘加载到内存。

    - 哪些异常可能是缺页导致的？发生缺页时，描述与缺页相关的CSR寄存器的值及其含义。
    - Lazy 策略有哪些好处？请描述大致如何实现Lazy策略？
    - swap 页置换策略有哪些好处？此时页面失效如何表现在页表项(PTE)上？请描述大致如何实现swap策略？

    1. 哪些异常可能是缺页导致的？发生缺页时，描述与缺页相关的CSR寄存器的值及其含义。
    - 答案： mcause 寄存器中会保存发生中断异常的原因，其中 Exception Code 为 12 时发生指令缺页异常，为 15 时发生 store/AMO 缺页异常，为 13 时发生 load 缺页异常。

    CSR寄存器:

    > - scause: 中断/异常发生时， CSR 寄存器 scause 中会记录其信息， Interrupt 位记录是中断还是异常， Exception Code 记录中断/异常的种类。
    > - sstatus: 记录处理器当前状态，其中 SPP 段记录当前特权等级。
    > - stvec: 记录处理 trap 的入口地址，现有两种模式 Direct 和 Vectored 。
    > - sscratch: 其中的值是指向hart相关的S态上下文的指针，比如内核栈的指针。
    > - sepc: trap 发生时会将当前指令的下一条指令地址写入其中，用于 trap 处理完成后返回。
    > - stval: trap 发生进入S态时会将异常信息写入，用于帮助处理 trap ，其中会保存导致缺页异常的虚拟地址。

    2. Lazy 策略有哪些好处？请描述大致如何实现Lazy策略？
    - 答案：Lazy策略一定不会比直接加载策略慢，并且可能会提升性能，因为可能会有些页面被加载后并没有进行访问就被释放或替代了，这样可以避免很多无用的加载。分配内存时暂时不进行分配，只是将记录下来，访问缺页时会触发缺页异常，在`trap handler`中处理相应的异常，在此时将内存加载或分配即可。
    3. swap 页置换策略有哪些好处？此时页面失效如何表现在页表项(PTE)上？请描述大致如何实现swap策略？
    - 答案：可以为用户程序提供比实际物理内存更大的内存空间。页面失效会将标志位`V`置为`0`。将置换出的物理页面保存在磁盘中，在之后访问再次触发缺页异常时将该页面写入内存。
