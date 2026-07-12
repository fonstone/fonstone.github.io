---
title: "就绪队列与调度器核心"
description: "调度器设计 - 就绪队列与调度器核心"
date: "2026-07-12"
order: 8001
tags: ["就绪队列", "Round-Robin", "优先级", "任务状态", "sleep_ticks", "Sleeping", "空闲任务", "Zombie"]
est_time: "60分钟"
---

# 本章目标

- 设计 `TaskState` 枚举（Ready / Running / Sleeping / Zombie），理解完整任务生命周期
- 实现优先级就绪队列：`add_task(entry, priority)`，调度器始终选最高优先级 Ready 任务
- 实现 `sleep_ticks(n)`：让任务真正让出 CPU n 个 tick，期间调度其他任务
- 实现自动空闲任务（idle_entry + wfi）：所有任务睡眠时 CPU 不空转
- 理解 `scheduler_tick` 中唤醒检查与立即抢占的顺序关系

## 前置知识

### 已完成的章节

`07-scheduler/00-index.md` 已阅读，理解调度器整体设计。`06-context-switch` 的 `context_switch` 和 `start_first_task` 是本节基础。

### 了解静态数组替代动态分配

裸机无堆分配，所有数据结构必须编译期确定大小。本节用 `[Option<TaskEntry>; MAX_TASKS]` 代替 `Vec`。

# 任务状态机

```text
add_task() → [Ready]
                ↓  scheduler 选中
           [Running] ←────────────────┐
                ↓ sleep_ticks(n)      │ 时间片到期 / yield_now()
           [Sleeping]                 │
                ↓ tick 到期，FIQ 唤醒 ┘
           [Ready]
                ↓ task_exit() 或 fn() 返回
           [Zombie]（永远不再调度）
```

**Ready**：等待被调度器选中。
**Running**：当前在 CPU 上执行（同一时刻只有一个）。
**Sleeping**：主动调用 `sleep_ticks(n)` 后进入，等待 `sleep_until` tick 到期才能重新参与调度。
**Zombie**：任务退出，永不再运行。

> **注意：** `delay_ticks(n)` 是**忙等**（不停轮询 tick），任务仍处于 Running 状态，不会让出 CPU。`sleep_ticks(n)` 才是真正的睡眠——立刻交出 CPU，n tick 后由 FIQ 自动唤醒。

# 数据结构设计

## src/scheduler.rs 结构

调度器维护一张固定大小的任务表，每个槽位是一个 `Option<TaskEntry>`——`None` 表示空闲槽，`Some` 表示已注册的任务。

```rust
pub const MAX_TASKS:  usize = 8;
pub const TIME_SLICE: u32   = 5;

#[derive(Clone, Copy, PartialEq)]
pub enum TaskState { Ready, Running, Sleeping, Zombie }

struct TaskEntry {
    task:        task::Task,
    state:       TaskState,
    remaining:   u32,        // 本轮剩余时间片 tick 数
    priority:    u8,         // 优先级：0 = 最低（idle），255 = 最高
    sleep_until: u32,        // 仅 Sleeping 时有效：tick 到此值时唤醒
}
```

各字段的作用：

- **`task`**：持有该任务的 TCB（`stack_ptr`），context switch 通过它找到任务的寄存器帧。
- **`state`**：任务当前处于生命周期的哪个阶段，调度器只调度 `Ready` 任务。
- **`remaining`**：本轮时间片剩余 tick 数，每次 FIQ 递减，归零时强制切换。初始值 = `TIME_SLICE = 5`，即每个任务最多连续占用 5 个 tick（500ms）。
- **`priority`**：优先级数字越大越高，调度器始终选最高优先级的 Ready 任务，同优先级内 Round-Robin。`0` 保留给 idle 任务。
- **`sleep_until`**：绝对 tick 值，`cur_tick >= sleep_until` 时唤醒。使用绝对值而非剩余量，可以直接在 FIQ 里比较，不需要每 tick 递减所有睡眠任务的计数器。

`sleep_until` 使用 tick 绝对值，支持 wrapping 比较（处理 u32 溢出回绕）。

调度器本身是一个全局静态变量：

```rust
struct Scheduler {
    slots:   [Option<TaskEntry>; MAX_TASKS],
    count:   usize,     // 已注册的任务数（含 idle）
    current: usize,     // 当前正在运行的任务下标
}

static mut SCHED: Scheduler = Scheduler { ... };
static mut CURRENT_TASK: *mut task::Task = core::ptr::null_mut();
```

`CURRENT_TASK` 是 FIQ handler 需要的全局指针——汇编保存/恢复上下文时，通过它找到当前任务的 TCB。

# 实现步骤

## 步骤一：注册任务 — add_task()

**位置：`src/scheduler.rs`**

`add_task` 接受用户传入的函数指针和优先级，把任务加入调度器的槽位数组。

注意这里的入口函数类型是 `fn()`（可以返回），而不是第 06 章的 `fn() -> !`（永不返回）。这是因为本章支持有限任务——任务函数跑完后自动退出，由包装器（步骤二）处理。

```rust
pub fn add_task(entry: fn(), priority: u8) {
    unsafe {
        let sched = &mut SCHED;
        let id = sched.count;
        // MAX_TASKS - 1：最后一个槽保留给 start() 自动添加的 idle 任务
        assert!(id < MAX_TASKS - 1, "too many tasks");
        sched.count += 1;
        let t = task::create_task_with_arg(
            task_entry_wrapper as *const () as usize,
            entry as *const () as usize,
        );
        sched.slots[id] = Some(TaskEntry {
            task: t,
            state: TaskState::Ready,
            remaining: TIME_SLICE,
            priority,
            sleep_until: 0,
        });
    }
}
```

`create_task_with_arg(wrapper, arg)` 是 `src/task.rs` 里新增的函数（**位置：`src/task.rs`，在 `create_task` 旁边添加**），构造初始帧时将 `wrapper` 放入 lr，将 `arg` 放入 r0。这样任务第一次被"恢复"时，CPU 会跳到 `wrapper`，且 r0 = 用户函数指针。

在 `src/task.rs` 里紧接 `create_task` 后添加：

```rust
/// 构造初始帧：lr = wrapper（任务包装器），r0 = arg（用户函数指针）
pub fn create_task_with_arg(wrapper: usize, arg: usize) -> Task {
    unsafe {
        let id = TASK_COUNT;
        TASK_COUNT += 1;

        let stack = &mut TASK_STACKS[id];
        // 14 字初始帧，与 create_task 格式相同
        // pop {r0-r12, lr} 按低地址→高地址恢复，所以：
        stack[STACK_SIZE - 1]  = wrapper as u32;  // lr  = 包装器地址
        stack[STACK_SIZE - 14] = arg as u32;      // r0  = 用户函数指针
        // r1-r12 已为 0（static 零初始化）

        Task {
            stack_ptr: &mut stack[STACK_SIZE - 14] as *mut u32,
        }
    }
}
```

与 `create_task` 的唯一区别：lr 和 r0 分别传入，而不是 `entry as u32` 直接作为 lr。这样 `start_first_task` 的 `pop + bx lr` 就会跳到 `wrapper`，并且 r0 里已经有用户函数地址。

> **注意：** 02 节（preemption）会把汇编改成 SRSDB + CPS + PUSH / RFEIA，届时初始帧会扩展为 16 字（增加 resume_pc 和 cpsr 两个槽），`create_task_with_arg` 也要同步更新。

## 步骤二：任务入口包装器

**位置：`src/scheduler.rs`（私有函数，在 `add_task` 之前定义）**

`add_task` 接受普通的 `fn()`，我们需要一个包装器：
1. 从 r0 里取出用户函数指针（初始帧传进来的）
2. 调用用户函数
3. 用户函数返回后自动调用 `task_exit()`，不会跌落到未知地址

```rust
unsafe extern "C" fn task_entry_wrapper() -> ! {
    let entry_fn: fn();
    // r0 = 初始帧里的参数（entry 函数指针）
    core::arch::asm!("mov {0}, r0", out(reg) entry_fn, options(nomem, nostack));
    entry_fn();      // 调用用户函数（fn() 有限任务或 fn()->! 无限循环）
    task_exit();     // 有限任务返回后自动退出
}
```

为什么要读 r0？`pop {r0-r12, lr}` 恢复初始帧后，r0 的值就是 `create_task_with_arg` 写进帧里的 `arg`（用户函数地址）。包装器在进入时立刻读出来，就能调用正确的函数。

## 步骤三：选最高优先级任务 — select_next()

**位置：`src/scheduler.rs`（私有函数）**

调度器的选择逻辑分两步：先找所有 Ready 任务中的最高优先级，再在这个优先级内做 Round-Robin（从 `current+1` 开始遍历，防止同优先级任务饥饿）。

```rust
fn select_next(sched: &mut Scheduler) -> Option<usize> {
    let n = sched.count;
    let cur = sched.current;

    // 找最高优先级
    let max_prio = (0..n)
        .filter_map(|i| sched.slots[i].as_ref())
        .filter(|e| e.state == TaskState::Ready)
        .map(|e| e.priority)
        .max()?;

    // 在最高优先级中，从 current+1 开始 Round-Robin（避免同优先级饥饿）
    for i in 1..=n {
        let idx = (cur + i) % n;
        if let Some(e) = &sched.slots[idx] {
            if e.state == TaskState::Ready && e.priority == max_prio {
                return Some(idx);
            }
        }
    }
    None
}
```

从 `current+1` 而不是 `0` 开始，是为了让同优先级的任务按顺序轮流，而不是每次都选下标最小的那个。`max()?` 在没有任何 Ready 任务时返回 `None`，调用者据此判断是否进入 idle。

## 步骤四：sleep_ticks — 真正的睡眠

**位置：`src/scheduler.rs`**

任务调用 `sleep_ticks(n)` 后：立刻把自己标记为 Sleeping，设定唤醒时间，然后主动调用 `context_switch` 让出 CPU。任务"消失"在 `context_switch` 里，直到 n tick 后 FIQ 将其唤醒，`context_switch` 才从被调点继续返回。

```rust
pub fn sleep_ticks(n: u32) {
    if n == 0 { return; }
    unsafe {
        let sched = &mut SCHED;
        let cur = sched.current;
        if let Some(e) = &mut sched.slots[cur] {
            e.state = TaskState::Sleeping;
            // wrapping_add 处理 tick 溢出回绕（约 49 天后发生）
            e.sleep_until = tick::get_ticks().wrapping_add(n);
            e.remaining = TIME_SLICE; // 睡醒后重置时间片
        }
        // 立刻切换到下一个 Ready 任务（至少有 idle 任务兜底）
        if let Some(next_idx) = select_next(sched) {
            let curr_ptr = CURRENT_TASK;
            let next = sched.slots[next_idx].as_mut().unwrap();
            next.state = TaskState::Running;
            sched.current = next_idx;
            CURRENT_TASK = &mut next.task as *mut task::Task;
            task::context_switch(curr_ptr, CURRENT_TASK);
            // ← 从这里返回时，本任务已被 scheduler_tick 唤醒并恢复
        }
    }
}
```

睡眠时间用绝对 tick 值记录（`sleep_until = now + n`），这样 `scheduler_tick` 只需一次比较就能判断是否到期，不需要每 tick 对所有睡眠任务递减计数器。`wrapping_add` / `wrapping_sub` 处理 u32 溢出回绕（系统运行约 49 天后发生）。

## 步骤五：启动调度器 + 自动空闲任务 — start()

**位置：`src/scheduler.rs`**

`start()` 做两件事：自动在最后一个槽里追加 idle 任务，然后选出优先级最高的任务，调用 `start_first_task` 跳入（不保存当前上下文，`rust_main` 到此"牺牲"）。

```rust
/// 空闲任务：所有任务都在 Sleeping 时自动运行，CPU 进入低功耗等待
unsafe extern "C" fn idle_entry() -> ! {
    loop { core::arch::asm!("wfi"); }
}

pub fn start() -> ! {
    unsafe {
        let sched = &mut SCHED;
        // 在所有用户任务之后，自动添加 idle 任务（priority=0，永远 Ready）
        let idle_id = sched.count;
        sched.count += 1;
        let idle = task::create_task_with_arg(idle_entry as *const () as usize, 0);
        sched.slots[idle_id] = Some(TaskEntry {
            task: idle, state: TaskState::Ready,
            remaining: TIME_SLICE, priority: 0, sleep_until: 0,
        });

        // 从最高优先级任务开始
        if let Some(idx) = select_next(sched) {
            sched.slots[idx].as_mut().unwrap().state = TaskState::Running;
            sched.current = idx;
            CURRENT_TASK = &mut sched.slots[idx].as_mut().unwrap().task;
            task::start_first_task(CURRENT_TASK);
        }
        panic!("no tasks");
    }
}
```

idle 任务的优先级是 0（最低），只有在没有任何其他 Ready 任务时才会被选中。它执行 `wfi`（Wait For Interrupt），让 CPU 低功耗挂起，直到下一个 FIQ 触发再判断是否有任务醒来。

> **注意：** 用户最多可注册 `MAX_TASKS - 1 = 7` 个任务（第 8 个槽留给 idle）。

## 步骤六：scheduler_tick — 唤醒 + 优先级调度

**位置：`src/scheduler.rs`**

这是调度器的核心，由 FIQ handler 每 tick 调用一次。每次调用按固定顺序执行五个子步骤：

```rust
#[unsafe(no_mangle)]
pub extern "C" fn scheduler_tick() {
    unsafe {
        // 1. tick++ + ACK + 清中断 + EOI
        tick::tick_increment();
        gic::gic_ack0();
        timer::TIMER1INTCLR.write_volatile(1);
        gic::gic_eoi0(33);

        let sched = &mut SCHED;
        let cur_tick = tick::get_ticks();

        // ① 唤醒所有到期的睡眠任务（必须在时间片检查之前！）
        //    wrapping_sub < 0x8000_0000 等价于 cur_tick >= sleep_until（含溢出回绕）
        for i in 0..sched.count {
            if let Some(e) = &mut sched.slots[i] {
                if e.state == TaskState::Sleeping
                    && cur_tick.wrapping_sub(e.sleep_until) < 0x8000_0000
                {
                    e.state = TaskState::Ready;
                }
            }
        }

        // ② 递减时间片
        let cur = sched.current;
        let (slice_expired, cur_prio) = {
            let e = sched.slots[cur].as_mut().unwrap();
            if e.remaining > 0 { e.remaining -= 1; }
            (e.remaining == 0, e.priority)
        };

        // ③ 立即抢占检查：有更高优先级任务刚被唤醒？
        let higher_ready = (0..sched.count).any(|i| {
            sched.slots[i].as_ref()
                .map(|e| e.state == TaskState::Ready && e.priority > cur_prio)
                .unwrap_or(false)
        });

        // 既没有到期也没有高优先级唤醒 → 继续当前任务
        if !slice_expired && !higher_ready { return; }

        // ④ 当前任务退回 Ready，时间片到期时重置
        if let Some(e) = &mut sched.slots[cur] {
            if e.state == TaskState::Running { e.state = TaskState::Ready; }
            if slice_expired { e.remaining = TIME_SLICE; }
        }

        // ⑤ 选最高优先级 Ready 任务，更新 CURRENT_TASK
        if let Some(next_idx) = select_next(sched) {
            let next = sched.slots[next_idx].as_mut().unwrap();
            next.state = TaskState::Running;
            sched.current = next_idx;
            CURRENT_TASK = &mut next.task as *mut task::Task;
        }
    }
}
```

`scheduler_tick` 只更新 `CURRENT_TASK`，**不调用 context_switch**。真正的寄存器保存/恢复由 FIQ handler 的汇编完成——汇编在调用 `scheduler_tick` 前保存了当前任务的帧，调用结束后从 `CURRENT_TASK` 指向的任务恢复帧。两者分工明确：Rust 负责"选谁"，汇编负责"怎么换"。

**为什么唤醒检查必须在时间片检查之前？**
如果先做时间片检查，再唤醒：此刻更高优先级任务还是 Sleeping，`higher_ready` 为 false，当前任务继续运行一个 tick。下一个 tick 才能切换。把唤醒提前，可以在同一 tick 内"唤醒 → 立刻抢占"，响应延迟减少 1 个 tick。

## 步骤七：任务退出 — task_exit()

**位置：`src/scheduler.rs`**

任务函数返回（或显式调用 `task_exit()`）时，把自己标记为 Zombie，然后找下一个 Ready 任务直接跳入。

注意这里用的是 `start_first_task` 而不是 `context_switch`：Zombie 任务不需要保存上下文（它永远不会被恢复），直接跳入下一个任务即可。

```rust
pub fn task_exit() -> ! {
    unsafe {
        let sched = &mut SCHED;
        if let Some(e) = &mut sched.slots[sched.current] {
            e.state = TaskState::Zombie;
            e.remaining = 0;
        }
        // 找下一个 Ready 任务直接跳入（不保存当前上下文，Zombie 不需要恢复）
        let n = sched.count;
        let start = sched.current + 1;
        for i in 0..n {
            let idx = (start + i) % n;
            if let Some(entry) = &mut sched.slots[idx] {
                if entry.state == TaskState::Ready {
                    entry.state = TaskState::Running;
                    sched.current = idx;
                    CURRENT_TASK = &mut entry.task as *mut task::Task;
                    task::start_first_task(CURRENT_TASK);
                }
            }
        }
        // 理论上不会到这里（至少有 idle 任务）
        loop { core::arch::asm!("wfi"); }
    }
}
```

# 更新 main.rs

`src/scheduler.rs` 写好后，还需要在 `src/main.rs` 里做三处修改。

## 1. 声明模块

在已有的 `mod` 声明区追加一行：

```rust
mod scheduler;   // 新增，紧跟 mod task; 后面
```

## 2. 更新任务函数签名

本章任务函数改为 `fn()`（允许返回），不再是第 06 章的 `fn() -> !`（永不返回）。任务 `fn()` 返回后 `task_entry_wrapper` 会自动调用 `task_exit()`，无需手动处理。同时将 `context_switch` 调用替换为 `scheduler::sleep_ticks(n)`：

```rust
fn task_a_fn() {    // fn() 而非 fn() -> !
    let mut count = 0u32;
    loop {
        println!("Task A: {}", count);
        count += 1;
        scheduler::sleep_ticks(5);   // 让出 CPU，5 tick 后自动唤醒
    }
}

fn task_b_fn() {
    let mut count = 0u32;
    loop {
        println!("Task B: {}", count);
        count += 1;
        scheduler::sleep_ticks(3);
    }
}
```

## 3. 更新 rust_main

删除手动创建 `TASK_A` / `TASK_B` 的代码，改为调用调度器 API：

```rust
#[unsafe(no_mangle)]
pub extern "C" fn rust_main() -> ! {
    uart::uart_init();
    println!("Hello from RTOS!");
    gic::gic_init();
    timer::timer_init();

    scheduler::add_task(task_a_fn, 1);
    scheduler::add_task(task_b_fn, 1);
    scheduler::start();   // 启动调度器，rust_main 在此"牺牲"，永不返回
}
```

`scheduler::start()` 内部会自动添加 idle 任务，然后调用 `start_first_task` 跳入优先级最高的任务，`rust_main` 的上下文从此被丢弃。

# 验证方法

## 编译验证

完成以上所有步骤后，先确认编译通过：

```bash
cargo build
```

若编译成功，说明调度器数据结构、Round-Robin 算法、`sleep_ticks`、`task_exit` 全部正确就位。

## 运行限制说明

`sleep_ticks` 的唤醒依赖 `scheduler_tick` 每 tick 检查 `sleep_until`——而 `scheduler_tick` 需要 FIQ handler 每次定时中断时调用它。这部分汇编（SRSDB + CPS + PUSH + RFEIA 完整改写 `fiq_handler`）在下一节 **02-preemption.md** 完成。

**本节完成后直接运行 QEMU 会怎样？**
任务能启动（`start_first_task` 跳入第一个任务），任务 A 打印后调用 `sleep_ticks(5)`，`sleep_ticks` 内部通过 `context_switch` 切换到任务 B，任务 B 打印后同样进入 `sleep_ticks`。由于此时 `fiq_handler` 还没有调用 `scheduler_tick`，两个任务的 `state` 永远停在 `Sleeping`，`select_next` 找不到任何 Ready 任务，系统会停在 idle 任务的 `wfi` 里——每 100ms 触发一次 FIQ 但什么也不做，输出静默。

因此，**完整的运行时验证放在 02-preemption.md 完成后再做**，届时预期输出为：

```text
Hello from RTOS!
Task A: 0
Task B: 0
Task A: 1
Task B: 0
Task A: 2
Task B: 1
...
```

（A 每 5 tick 醒来一次，B 每 3 tick 醒来一次，各自计数互不干扰。）

# 练习题

```quiz single
Q: sleep_ticks(10) 和 delay_ticks(10) 有什么本质区别？
+ sleep_ticks 将任务标记为 Sleeping 并立刻调用 context_switch 让出 CPU，10 tick 后由 FIQ 自动唤醒；delay_ticks 是忙等（循环读 get_ticks()），任务始终处于 Running 状态，独占 CPU
- sleep_ticks 更精确，delay_ticks 有误差
- sleep_ticks 需要中断支持，delay_ticks 不需要
- 两者功能相同，只是实现方式不同
E: 忙等和睡眠的核心区别是"是否让出 CPU"。delay_ticks 在等待期间不停执行指令，低优先级任务无法获得 CPU。sleep_ticks 将任务从调度池中"移除"（标记 Sleeping），调度器会选择其他 Ready 任务运行，等到 tick 到期才重新加入竞争。
```

```quiz single
Q: 为什么 start() 要自动添加一个 idle 任务（priority=0）？
+ 当所有用户任务都处于 Sleeping 状态时，select_next 必须能找到至少一个 Ready 任务，否则调度器会 panic；idle 任务永远 Ready，保证系统不会因为"没有可运行任务"而崩溃，同时用 wfi 指令让 CPU 进入低功耗等待
- 为了让调度器有初始任务可以运行
- 因为 ARM 处理器要求始终有任务在运行
- idle 任务负责清理 Zombie 任务的内存
E: 如果所有任务都在 Sleeping 而没有 idle，select_next 返回 None，此时代码路径会走到 panic 或 undefined behavior。idle 任务用 wfi（Wait For Interrupt）指令让处理器挂起直到下一个 FIQ，既保证了调度器的正确性，又不浪费 CPU 电量。
```

```quiz single
Q: scheduler_tick 里，为什么唤醒检查（步骤①）要在时间片递减（步骤②）之前？
+ 把唤醒提前，可以在同一个 tick 内"检测到更高优先级任务醒来 → 立刻抢占"，响应延迟减少 1 tick；若顺序反过来，当 tick 到期时高优先级任务还是 Sleeping，higher_ready 为 false，要多等一个 tick 才能切换
- 因为这是 ARM 的硬件要求
- 为了避免竞态条件
- 唤醒检查比时间片递减更快，所以放前面
E: 调度延迟是实时系统的关键指标。如果一个高优先级任务在 tick=T 到期，最理想是在 tick=T 就立刻得到 CPU。通过先做唤醒检查，再检测 higher_ready，可以在同一个 FIQ 处理周期内完成"唤醒→切换"，最坏响应延迟为 1 tick（100ms），而不是 2 tick。
```