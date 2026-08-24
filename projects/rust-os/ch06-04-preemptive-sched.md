---
title: "抢占式调度实现"
description: "有了时钟中断和计时器，抢占式调度就很容易实现了："
date: "2026-07-12"
order: 45
tags: ["抢占式调度", "时钟中断", "trap_handler", "时间片", "实现"]
est_time: "30分钟"
---
有了时钟中断和计时器，抢占式调度就很容易实现了：

```
// os/src/trap/mod.rs

let trap: Trap<Interrupt, Exception> = match scause.cause().try_into() {
    Ok(trap) => trap,
    Err(_) => panic!(
        "Unsupported trap {:?}, stval = {:#x}!",
        scause.cause(),
        stval
    ),
};
match trap {
    Trap::Interrupt(Interrupt::SupervisorTimer) => {
        set_next_trigger();
        suspend_current_and_run_next();
    }
}
```

我们只需在 trap\_handler 函数下新增一个条件分支跳转，当发现触发了一个 S 特权级时钟中断的时候，首先重新设置一个 10ms 的计时器，然后调用上一小节提到的 suspend\_current\_and\_run\_next 函数暂停当前应用并切换到下一个。

为了避免 S 特权级时钟中断被屏蔽，我们需要在执行第一个应用之前进行一些初始化设置：

```
// os/src/main.rs

#[unsafe(no_mangle)]
pub fn rust_main() -> ! {
    clear_bss();
    println!("[kernel] Hello, world!");
    trap::init();
    loader::load_apps();
    trap::enable_timer_interrupt();
    timer::set_next_trigger();
    task::run_first_task();
    panic!("Unreachable in rust_main!");
}

// os/src/trap/mod.rs

use riscv::register::sie;

pub fn enable_timer_interrupt() {
    unsafe { sie::set_stimer(); }
}
```

- 第 9 行设置了 sie.stie 使得 S 特权级时钟中断不会被屏蔽；
- 第 10 行则是设置第一个 10ms 的计时器。

这样，当一个应用运行了 10ms 之后，一个 S 特权级时钟中断就会被触发。由于应用运行在 U 特权级，且 sie 寄存器被正确设置，该中断不会被屏蔽，而是跳转到 S 特权级内的我们的 trap\_handler 里面进行处理，并顺利切换到下一个应用。这便是我们所期望的抢占式调度机制。从应用运行的结果也可以看出，三个 power 系列应用并没有进行 yield ，而是由内核负责公平分配它们执行的时间片。

有同学可能会注意到，我们并没有将应用初始 Trap 上下文中的 sstatus 中的 SPIE 位置为 1 。这将意味着 CPU 在用户态执行应用的时候 sstatus 的 SIE 为 0 ，根据定义来说，此时的 CPU 会屏蔽 S 态所有中断，自然也包括 S 特权级时钟中断。但是可以观察到我们的应用在用尽一个时间片之后能够正常被打断。这是因为当 CPU 在 U 态接收到一个 S 态时钟中断时会被抢占，这时无论 SIE 位是否被设置都会进入 Trap 处理流程。

目前在等待某些事件的时候仍然需要 yield ，其中一个原因是为了节约 CPU 计算资源，另一个原因是当事件依赖于其他的应用的时候，由于只有一个 CPU ，当前应用的等待可能永远不会结束。这种情况下需要先将它切换出去，使得其他的应用到达它所期待的状态并满足事件的生成条件，再切换回来。

这里我们先通过 yield 来优化 **轮询** (Busy Loop) 过程带来的 CPU 资源浪费。在 03sleep 这个应用中：

```
// user/src/bin/03sleep.rs

#[unsafe(no_mangle)]
fn main() -> i32 {
    let current_timer = get_time();
    let wait_for = current_timer + 3000;
    while get_time() < wait_for {
        yield_();
    }
    println!("Test sleep OK!");
    0
}
```

它的功能是等待 3000ms 然后退出。可以看出，我们会在循环里面 yield\_ 来主动交出 CPU 而不是无意义的忙等。其实，现在的抢占式调度会在它循环 10ms 之后切换到其他应用，这样能让内核给其他应用分配更多的 CPU 资源并让它们更早运行结束。

我们的“腔骨龙”协作式操作系统就算是实现完毕了。它支持把多个应用的代码和数据放置到内存中；并能够执行每个应用；在应用程序发出 sys\_yield 系统调用时，协作式地切换应用；并能通过时钟中断来实现抢占式调度并强行切换应用，从而提高了应用执行的灵活性、公平性和交互效率。

> **Note**
>
> **内核代码执行是否会被中断打断？**
>
> 目前为了简单起见，我们的内核不会被 S 特权级中断所打断，这是因为 CPU 在 S 特权级时， sstatus.sie 总为 0 。但这会造成内核对部分中断的响应不及时，因此一种较为合理的做法是允许内核在处理系统调用的时候被打断优先处理某些中断，这是一种允许 Trap 嵌套的设计。从第四章可以看到，我们目前的设计不允许 Trap 嵌套，当通过 Trap 进入内核再次遇到 Trap 的时候，内核会直接 panic 。

[] [ 1 ] 腔骨龙（也称虚形龙）最早出现于三叠纪晚期，它体形纤细，善于奔跑，以小型动物为食。
