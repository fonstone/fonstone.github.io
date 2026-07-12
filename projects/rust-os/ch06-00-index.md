---
title: "系统定时器"
description: "系统定时器 - 系统定时器"
date: "2026-07-12"
order: 6000
tags: ["Tick", "系统时钟", "get_ticks", "delay", "临界区", "时间抽象"]
est_time: "40分钟"
---

# 本章目标

- 理解为什么原始 `TICK_COUNT` 静态变量不足以作为系统时钟
- 将定时器中断处理抽象为独立的 `tick` 模块
- 实现 `get_ticks()`（读取当前 tick 计数）和 `delay_ticks(n)`（基于 tick 的忙等延迟）
- 理解单核裸机中保护共享计数器的正确方式

## 前置知识

### 已完成的章节

`04-exceptions-and-interrupts/02-gic-setup.md` 已完成，定时器每 100ms 触发一次 FIQ，`TICK_COUNT` 在 `rust_fiq_handler` 中递增。

### 了解 static mut 的风险

`static mut` 变量在 Rust 中访问需要 `unsafe`，因为编译器无法保证并发安全。本章会解释在单核裸机上如何安全地使用它。

# 为什么需要 Tick 模块

目前 `TICK_COUNT` 直接定义在 `main.rs` 里，存在几个问题：

**问题 1：没有封装**。任何模块都可以直接修改 `TICK_COUNT`，包括误操作（比如在错误的地方写 `TICK_COUNT = 0`）。良好的设计应该只允许 FIQ handler 递增，其他模块只能读取。

**问题 2：没有单位语义**。`TICK_COUNT` 只是一个计数，调用者不知道"一个 tick = 多少时间"。如果将来调整定时器周期，所有用到它的代码都要同步修改。

**问题 3：读取不安全**。在单核系统上，读取 32 位变量通常是原子的（单条 LDR 指令）。但如果将来 tick 变成 64 位，或者在中断处理中需要读-修改-写，就需要临界区保护。从一开始就养成正确的习惯。

# 封装 Tick 模块

## 步骤一：新建 src/tick.rs

```rust
/// 每 tick 100ms（5_000_000 cycles @ 50MHz）
pub const TICK_PERIOD_MS: u32 = 100;

static mut TICK_COUNT: u32 = 0;

/// 由 FIQ handler 调用，每次定时器中断递增一次
pub fn tick_increment() {
    unsafe { TICK_COUNT += 1; }
}

/// 读取当前 tick 计数
///
/// 必须用 read_volatile，否则编译器会在主线程紧循环中
/// 把读取优化为寄存器缓存，永远看不到 FIQ 写入的新值。
pub fn get_ticks() -> u32 {
    // &raw const 直接产生裸指针，不经过引用
    // 避免 &TICK_COUNT 隐含的"独占访问"假设与 FIQ 并发写入冲突（UB）
    unsafe { (&raw const TICK_COUNT).read_volatile() }
}
```

> **注意：** `tick_increment` 只应在中断处理函数里调用。在其他地方调用会破坏 tick 的单调递增语义。

## 步骤二：添加延迟函数

基于 tick 实现忙等延迟（busy-wait delay）：

```rust
/// 等待至少 n 个 tick 后返回（粗粒度延迟，每 tick = 100ms）
pub fn delay_ticks(n: u32) {
    let start = get_ticks();
    // 处理 u32 溢出回绕（运行约 13 年后会溢出）
    while get_ticks().wrapping_sub(start) < n {}
}
```

`wrapping_sub` 是处理整数回绕的关键。如果 `start = 0xFFFF_FFFF` 而当前 tick = `0x00000003`，普通减法会下溢，而 `wrapping_sub` 正确给出 4。

## 步骤三：更新 main.rs

FIQ handler 尽量短：只递增计数和清除中断标志。输出放在主线程里轮询：

```rust
mod tick;

// FIQ handler：极简，只做必要的事
#[unsafe(no_mangle)]
pub extern "C" fn rust_fiq_handler() {
    let intid = gic::gic_ack0();
    if intid == 33 {
        timer::timer_clear_interrupt();
        tick::tick_increment();
    }
    gic::gic_eoi0(intid);
}

// 主线程：轮询 tick，每 10 个 tick（= 1000ms）打印一次
#[unsafe(no_mangle)]
pub extern "C" fn rust_main() -> ! {
    uart::uart_init();
    println!("Hello from RTOS!");
    gic::gic_init();
    timer::timer_init();
    println!("Timer started, 100ms tick.");
    gic::cpu_enable_interrupts();  // 最后才开 IRQ + FIQ

    let mut last = 0u32;
    loop {
        let t = tick::get_ticks();
        if t.wrapping_sub(last) >= 10 {
            last = t;
            println!("Tick: {}ms", t * tick::TICK_PERIOD_MS);
        }
    }
}
```

**为什么输出放在主线程而不是 FIQ handler？**

FIQ handler 里调用 `println!`（最终是 UART 轮询写入）会让中断处理时间过长。100ms tick 意味着每秒 10 次中断，如果每次都做 UART 写入，中断处理时间会远超 100ms，导致 tick 计数不准。好的设计是：**中断 handler 只做最短的事**（更新状态、清除硬件标志），主线程或任务来消费这些状态。

## 步骤四：完整的 src/tick.rs

```rust
pub const TICK_PERIOD_MS: u32 = 100;

static mut TICK_COUNT: u32 = 0;

pub fn tick_increment() {
    unsafe { TICK_COUNT += 1; }
}

pub fn get_ticks() -> u32 {
    unsafe { (&raw const TICK_COUNT).read_volatile() }
}

pub fn delay_ticks(n: u32) {
    let start = get_ticks();
    while get_ticks().wrapping_sub(start) < n {}
}

pub fn delay_ms(ms: u32) {
    delay_ticks(ms / TICK_PERIOD_MS);
}
```

> 这里 delay_ms 暂时没有被使用到，可能存在一些告警，我们先不管它

# 一些额外的解释

## 关于 QEMU 定时器频率的限制

### 为什么 tick 周期选 100ms 而不是 1ms

真实的 RTOS tick 通常是 1ms（1 kHz）。按照 50MHz 时钟换算，加载值应该是 50,000。但在 QEMU 上直接使用 1ms 定时器会产生一个隐蔽的性能问题，导致输出长时间不出现。

**QEMU 定时器的模拟方式：**

QEMU 的 CMSDK DualTimer 不是按模拟 CPU 周期计时，而是挂在主机的 wall clock（真实时钟）上：

```text
             = 5_000_000 / 50_000_000 Hz = 0.1 秒（100ms）
```

所以 5,000,000 加载值 → 每 **100ms 真实时间**触发一次 FIQ。

**每次 FIQ 的模拟代价：**

每次 FIQ 触发，QEMU 需要模拟约 100 条 ARM 指令（上下文保存/恢复、GIC 状态更新、handler 代码），这大约消耗主机 **1~5ms** 的真实 CPU 时间。

| 定时器周期 | FIQ 频率 | 两次 FIQ 之间主机可用时间 | QEMU 能否跟上 |
|-----------|---------|--------------------------|-------------|
| 100ms | 10 Hz | ~100ms | ✅ 轻松，接近 1:1 真实速度 |
| 1ms   | 1000 Hz | ~1ms | ❌ FIQ 开销 > 间隔，QEMU 被压垮 |

**实测结果：**

- 100ms 定时器：每秒 10 个 tick，1000 个 tick 约 100 秒后打印 `Tick: 1000ms`（QEMU 接近实时）
- 1ms 定时器：QEMU 有效速度降至真实速度的 0.5%，每秒仅累积约 5 个 tick，等待 1000 个 tick 需要约 3 分钟

> **真实硬件上的区别：** Cortex-R52 跑一次 FIQ handler 只需几百 ns，远小于 1ms 的中断间隔，所以 1ms tick 在真实硬件上完全没有问题。QEMU 的限制仅来自主机模拟开销，不是架构本身的约束。

因此本章（以及后续章节）在 QEMU 环境下统一使用 **100ms 定时器（5_000_000 加载值）**，并通过 `TICK_PERIOD_MS = 100` 让上层代码仍以毫秒为单位推算时间。

## 关于临界区

`get_ticks()` 在单核系统上是安全的，因为：

1. `TICK_COUNT` 是 `u32`，读取是单条 ARM `LDR` 指令（原子）
2. 即使 FIQ 在 `LDR` 执行过程中触发，中断响应也要等当前指令完成后才发生

但如果 `tick_increment()` 需要做"读-修改-写"以外的操作，或者涉及多个变量的一致性，就需要临界区。AArch32 上最简单的临界区是关中断：

```rust
fn with_irq_disabled<F: FnOnce() -> R, R>(f: F) -> R {
    unsafe {
        core::arch::asm!("cpsid if");  // 关 IRQ + FIQ
        let result = f();
        core::arch::asm!("cpsie if");  // 开 IRQ + FIQ
        result
    }
}
```

本章暂不需要，在第 08 章同步原语里会系统讲解。

# 验证方法

```bash
cargo build
qemu-system-arm \
  -machine mps3-an536 \
  -nographic \
  -device loader,file=target/armv8r-none-eabihf/debug/rtos
```

预期输出（每 10 个 tick = 1000ms 打印一次；QEMU 模拟速度低于真实速度，实际等待约 1 秒每行）：

```text
Hello from RTOS!
Timer started, 100ms tick.
Tick: 1000ms
Tick: 2000ms
```

# 练习题

```quiz single
Q: get_ticks() 为什么必须使用 read_volatile 而不是直接读 TICK_COUNT？
- 因为 TICK_COUNT 是 unsafe 变量，必须用特殊方式访问
+ 因为主线程的紧循环中编译器会将读取优化为寄存器缓存，导致永远读到旧值，read_volatile 强制每次从内存重新读取
- 因为 FIQ handler 用了 write_volatile 写入，必须配对使用
- 因为 read_volatile 比普通读取更快
E: 编译器看到主线程的 loop { let t = get_ticks(); ... } 时，若不加限制，会认为循环内没有修改 TICK_COUNT 的代码，直接把第一次读到的值缓存在寄存器里复用。FIQ handler 在中断里修改了内存，但编译器感知不到这个"外部修改"。read_volatile 告诉编译器：每次调用都必须真正去内存读，不能用缓存。
```

```quiz single
Q: 为什么 delay_ticks 使用 wrapping_sub 而不是普通减法？
- 因为 Rust 不支持 u32 减法
- 因为 wrapping_sub 更快
+ 因为 tick 计数器最终会溢出回绕，wrapping_sub 能正确处理 start > current 的情况
- 因为 delay_ticks 需要处理负数延迟
E: 当 tick 计数器从 0xFFFFFFFF 回绕到 0 时，current < start。普通减法会产生一个巨大的正数（实际上是负数的无符号表示），导致延迟永远不会结束。wrapping_sub 在模 2^32 下计算差值，0x00000003.wrapping_sub(0xFFFFFFFF) = 4，正确表示经过了 4 个 tick。
```

```quiz single
Q: 为什么单核系统上读取 u32 的 TICK_COUNT 不需要临界区？
- 因为 Rust 的 unsafe 已经提供了保护
- 因为 FIQ 优先级最高，不会被打断
- 因为 TICK_COUNT 是 static，编译器会自动保护
+ 因为 u32 读取编译为单条 LDR 指令，而中断只能在指令边界触发，不会"撕裂"一个 u32 读取
E: ARM 的 LDR 指令是原子的——要么读到旧值，要么读到新值，不存在"读到一半"的状态。中断只能在指令完成后才能响应。但这个结论只对 u32 成立，u64 需要两条指令（LDRD），就不再是原子的，必须加临界区。
```

```quiz single
Q: tick_increment 只应在中断处理函数里调用，原因是什么？
- 因为 Rust 规定只有 no_mangle 函数才能修改 static mut
+ 因为 tick 语义是"每次定时器硬件中断递增一次"，在其他地方调用会使计数不反映真实时间，破坏所有依赖 tick 的时间推断
- 因为在普通函数里调用会引起 FIQ 嵌套
- 因为 tick_increment 使用了不安全的汇编指令
E: tick 计数器的含义是"经过了多少个定时器周期"。如果在业务代码里随意调用 tick_increment，计数值就不再代表时间，依赖它的 delay_ticks 和所有时间判断都会出错。封装的目的是让修改路径只有一个（中断 handler），防止误用。
```