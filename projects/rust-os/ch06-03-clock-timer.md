---
title: "时钟中断与计时器"
description: "由于软件（特别是操作系统）需要一种计时机制，RISC-V 架构要求处理器要有一个内置时钟，其频率一般低于 CPU 主频。此外，还有一个计数器用来统计处理器自上电以来经过了多少个内置时钟的时钟周期。在 RISC-V 64 ..."
date: "2026-07-12"
order: 44
tags: ["mtime", "mtimecmp", "计时器", "set_next_trigger", "时钟中断"]
est_time: "30分钟"
---
由于软件（特别是操作系统）需要一种计时机制，RISC-V 架构要求处理器要有一个内置时钟，其频率一般低于 CPU 主频。此外，还有一个计数器用来统计处理器自上电以来经过了多少个内置时钟的时钟周期。在 RISC-V 64 架构上，该计数器保存在一个 64 位的 CSR mtime 中，我们无需担心它的溢出问题，在内核运行全程可以认为它是一直递增的。这个计数器被设计成在所有的特权级均可以通过一条 rdtime 的伪指令访问（可以参考 RISC-V 规范的"Zicntr"拓展相关章节）。 riscv 库已经封装了这个功能，我们直接调用相应接口，在 timer 子模块的 get\_time 函数中取得计数器的值：

```
// os/src/timer.rs

use riscv::register::time;

pub fn get_time() -> usize {
    time::read()
}
```

另外一个 64 位的 CSR mtimecmp 的作用是：一旦计数器 mtime 的值超过了 mtimecmp，就会触发一次时钟中断。这使得我们可以方便的通过设置 mtimecmp 的值来决定下一次时钟中断何时触发。运行在 M 特权级的 SEE （这里是RustSBI）预留了相关接口来实现计时器的控制：

```
// os/src/sbi.rs

const SBI_SET_TIMER: usize = 0;

pub fn set_timer(timer: usize) {
    sbi_call(SBI_SET_TIMER, timer, 0, 0);
}

// os/src/timer.rs

use crate::config::CLOCK_FREQ;
const TICKS_PER_SEC: usize = 100;

pub fn set_next_trigger() {
    set_timer(get_time() + CLOCK_FREQ / TICKS_PER_SEC);
}
```

- 代码片段第 5 行， sbi 子模块有一个 set\_timer 调用，是一个由 SEE 提供的标准 SBI 接口函数，它可以用来设置 mtimecmp 的值。
- 代码片段第 14 行， timer 子模块的 set\_next\_trigger 函数对 set\_timer 进行了封装，它首先读取当前 mtime 的值，然后计算出 10ms 之内计数器的增量，再将 mtimecmp 设置为二者的和。这样，10ms 之后一个 S 特权级时钟中断就会被触发。

  至于增量的计算方式，常数 CLOCK\_FREQ 是一个预先获取到的各平台不同的时钟频率，单位为赫兹，也就是一秒钟之内计数器的增量。它可以在 config 子模块中找到。CLOCK\_FREQ 除以常数 TICKS\_PER\_SEC 即是下一次时钟中断的计数器增量值。

后面可能还有一些计时的操作，比如统计一个应用的运行时长，我们再设计一个函数：

```
// os/src/timer.rs

const MICRO_PER_SEC: usize = 1_000_000;

pub fn get_time_us() -> usize {
    time::read() / (CLOCK_FREQ / MICRO_PER_SEC)
}
```

timer 子模块的 get\_time\_us 以微秒为单位返回当前计数器的值，这让我们终于能对时间有一个具体概念了。实现原理就不再赘述。

新增一个系统调用，方便应用获取当前的时间：

```
/// 功能：获取当前的时间，保存在 TimeVal 结构体 ts 中，_tz 在我们的实现中忽略
/// 返回值：返回是否执行成功，成功则返回 0
/// syscall ID：169
fn sys_get_time(ts: *mut TimeVal, _tz: usize) -> isize;

#[repr(C)]
pub struct TimeVal {
    pub sec: usize,
    pub usec: usize,
}
```

它在内核中的实现只需调用 get\_time\_us 函数即可。
