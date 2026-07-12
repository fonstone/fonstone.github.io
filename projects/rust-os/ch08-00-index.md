---
title: "调度器设计"
description: "调度器设计 - 调度器设计"
date: "2026-07-12"
order: 8000
tags: ["调度器", "抢占", "时间片", "Round-Robin", "SRSDB", "RFEIA", "context frame"]
est_time: "20分钟"
---

# 本章目标

- 理解协作式调度与抢占式调度的本质区别
- 了解本章实现的调度器全貌：Round-Robin 时间片 + FIQ 真抢占
- 掌握 16 字 context frame 的设计，理解为什么需要这个格式
- 了解 ARM 两条专用指令 `SRSDB` / `RFEIA` 如何优雅地解决 FIQ 抢占难题

## 本章结构

| 小节 | 内容 |
| --- | --- |
| `01-ready-queue.md` | 调度器数据结构、Round-Robin 算法、任务状态、任务退出 |
| `02-preemption.md` | 16 字 context frame、FIQ handler 改写、与调度器联动 |

## 前置知识

### 已完成的章节

`06-context-switch` 已完成，`Task` 结构体、`create_task`、协作式 `context_switch` 均可用，两个任务可以手动轮换执行。

### 了解 ARM 异常模式

AArch32 拥有多种**处理器模式**（类似于不同的工作台状态），每种模式在硬件上拥有一套独立的 `sp` 和 `lr`（称为 **Banked** 寄存器）：

| 模式 | 触发条件 | 额外 Banked 的寄存器 | 备注 |
| :--- | :--- | :--- | :--- |
| **SVC** | 复位或执行 `SVC` 指令 | `sp`, `lr` | 内核与协作式切换所在的模式 |
| **IRQ** | 普通硬件中断 | `sp`, `lr` | 常见的外部设备中断 |
| **FIQ** | 快速硬件中断 | **`r8-r14`** | **响应速度最快，具有专属寄存器** |
| **SYS** | 编程手动切换 | 无 (与 User 共享) | 任务运行的常规模式 |

**深度解析：FIQ 为什么快？**
在进入 **IRQ** 模式时，硬件只自动备份了 `sp` 和 `lr`。如果中断处理函数想使用 `r8-r12`，必须先手动 `push` 进内存，执行完再 `pop` 出来，这会消耗几十个时钟周期。
而 **FIQ** 模式在硬件设计上直接提供了独有的 `r8-r12` 物理套件（Banked）。进入 FIQ 后，CPU 会瞬间切换到这组“私人抽屉”，不需要任何内存搬运即可开始计算。

**抢占的难点：访问“被隐藏”的数据**
正是因为 FIQ 拥有这种“独占权”，当 CPU 处于 FIQ 模式时，原本任务在 SYS/SVC 模式下使用的 `r8-r12` 会被硬件物理隔离。这使得在 FIQ 模式下直接读取或修改被中断任务的原始寄存器变得非常困难——我们需要借助特殊的汇编指令（如 `SRS` 和 `RFE`）来跨越模式的隔离墙。

# 协作式 vs 抢占式

## 协作式调度（第 06 章的做法）

任务主动调用 `context_switch()` 让出 CPU：

```text
Task A: ... do work ... → context_switch() → Task B 运行
Task B: ... do work ... → context_switch() → Task A 运行
```

**优点**：实现简单，任务完全控制切换时机。
**缺点**：如果某个任务陷入死循环或长时间计算，其他任务永远得不到执行。

## 抢占式调度（本章实现）

FIQ 定时中断**强制**打断当前任务，切换到下一个：

```text
Task A 运行 → FIQ 触发 → 保存 A 的完整现场 → 调度器选 B → 恢复 B 的现场 → B 继续运行
Task B 运行 → FIQ 触发 → 保存 B 的完整现场 → 调度器选 C → 恢复 C 的现场 → C 继续运行
```

**优点**：任务无需主动让出，即使某个任务死循环也不影响其他任务。
**缺点**：必须正确保存/恢复所有寄存器，包括条件标志（CPSR），稍有出错就会崩溃。

# 任务切换流程

## 整体流程

在看流程之前，先明确两套 banked 寄存器的关系：

- **任务**运行在 SVC 模式，使用 `sp_svc`（指向 `TASK_STACKS[id]`）和 `lr_svc`
- **FIQ 中断**触发后切换到 FIQ 模式，CPU 改用 `sp_fiq` 和 `lr_fiq`，以及 FIQ 专属的 `r8-r12_fiq`
- 两套寄存器是完全独立的物理硬件：FIQ 模式下 `sp_svc` 原封不动保留着任务栈的地址，`lr_svc` 里的函数返回地址也没有被碰

FIQ 定时中断触发时，硬件跳向量表执行 `fiq_handler`，经历三个阶段后跳到下一个任务：

```text
任务正常运行（SVC 模式）
  │
  │  FIQ 中断触发
  │  硬件自动：lr_fiq ← 被打断的 PC+4
  │            SPSR_fiq ← 被打断的 CPSR
  │            切换到 FIQ 模式
  ▼
fiq_handler 汇编：保存当前任务现场（FIQ 模式）
  │  SUB + SRSDB：把 lr_fiq / SPSR_fiq 搬到任务的 SVC 栈，压入栈顶（FIQ 模式）
  │  CPS：切换到 SVC 模式（中断处理全程在此模式下运行）
  │  PUSH：把任务的 r0-r12 和 lr_svc 也压进 SVC 栈（SVC 模式）
  ▼
rust_fiq_handler（Rust）：执行中断处理
  │  清 timer 中断标志、tick++
  │  调度器：选出下一个任务，更新 CURRENT_TASK
  ▼
fiq_handler 汇编：恢复下一个任务现场
  │  POP：恢复下一个任务的 r0-r12 和 lr_svc
  │  RFEIA：原子恢复 PC 和 CPSR，跳到下一个任务
  ▼
下一个任务继续执行
```

> 正因为 `sp_svc` 在 FIQ 模式下依然有效，SRSDB 才能在 FIQ 模式里直接向任务的 SVC 栈写数据。

## 为什么不能直接沿用第 06 章的做法

第 06 章的协作式切换在 SVC 模式下执行 `push {r0-r12, lr}`，完全没问题。但 FIQ 触发时 CPU 已经切换到了 FIQ 模式，**FIQ 模式有自己私有的 banked 寄存器**：r8-r12 和 lr 在 FIQ 模式下指向 FIQ 专属的物理寄存器，任务原本的 r8-r12 和 lr_svc 被硬件屏蔽。

如果在 FIQ 模式下直接执行同一条 `push {r0-r12, lr}`，保存的是错误的值：

| 寄存器 | 协作式（SVC 模式） | 抢占式（FIQ 模式直接 push） |
| --- | --- | --- |
| r0–r7 | 任务的值 ✓ | 任务的值 ✓（这几个不 bank） |
| r8–r12 | 任务的值 ✓ | **FIQ 自己的 banked 值 ✗** |
| lr | lr_svc（任务函数返回地址）✓ | **lr_fiq（FIQ 的中断返回地址）✗** |

除了 banking 问题，还有两项是 14 字 frame 根本没有的：

| 缺失 | 为什么必须保存 |
| --- | --- |
| **resume_pc** | 协作式里任务主动调用 `context_switch()`，ARM ABI 把返回地址放进了 lr，所以 lr_svc 本身就等于 resume_pc，一个槽够用。抢占式里任务在任意位置被强制打断，lr_svc 里存的是某个函数调用链的返回地址，被打断的真实 PC 在 lr_fiq 里，两者完全不同——必须单独记录 |
| **CPSR** | 任务可能正处于 `cmp` 之后、`beq` 之前，条件标志丢失会跳到错误地址 |

## 具体实现：SRSDB + CPS + PUSH

FIQ 模式的价值只有一点：`lr_fiq` 和 `SPSR_fiq` 这两个只有 FIQ 模式才能访问的寄存器，分别存着被打断的 PC 和被打断的 CPSR。只要把这两个值提取出来，FIQ 模式就完成了使命——立刻切回 SVC 模式，剩下的全部在 SVC 下完成。

```asm
; ── 阶段一：FIQ 模式（极短，只做一件事：提取 FIQ 独有信息）──────
SUB   lr, lr, #4        ; 硬件存入 lr_fiq 的是 PC+4，减 4 还原被打断的真实地址
SRSDB SP!, #0x13        ; 跨模式写栈：把 {lr_fiq, SPSR_fiq} 压入 SVC 模式的栈
                        ;   #0x13 = SVC 模式编号（ARM CPSR 低 5 位的模式字段）
                        ;   SP! 表示更新 sp_svc，不是 sp_fiq
                        ;   执行后 SVC 栈顶多了 [resume_pc, cpsr] 两个槽

; ── 阶段二：切换回 SVC 模式 ───────────────────────────────────────
CPS   #0x13             ; 切换处理器模式到 SVC
                        ; FIQ 的 banked r8-r12 和 lr_fiq 被收起，
                        ; r8-r12 恢复为任务的真实值，lr 恢复为 lr_svc

; ── 阶段三：SVC 模式下保存剩余寄存器，执行中断处理，恢复现场 ──────
PUSH  {r0-r12, lr}      ; 保存任务的 r0-r12 和 lr_svc（现在都是正确的值）

BL    rust_fiq_handler  ; 清 timer、tick++、调度器
                        ; 全程在 SVC 模式、任务私有栈上运行，可以自由调用 Rust 函数

POP   {r0-r12, lr}      ; 恢复下一个任务的 r0-r12 和 lr_svc
RFEIA SP!               ; 从栈上原子加载 PC 和 CPSR，跳到下一个任务
                        ; 普通 pop 无法写入 CPSR，必须用异常返回专用指令
```

## 16 字 Context Frame 布局

三个阶段执行完后，SVC 栈上形成一个完整的 16 字 frame（64 字节）：

- **SRSDB** 先压了 resume_pc + cpsr（高地址，8 字节）
- **PUSH** 后压了 r0-r12 + lr_svc（低地址，56 字节）

```text
sp+0:  r0        ← 低地址，sp 指向这里
sp+4:  r1
sp+8:  r2
sp+12: r3
sp+16: r4
sp+20: r5
sp+24: r6
sp+28: r7
sp+32: r8
sp+36: r9
sp+40: r10
sp+44: r11
sp+48: r12
sp+52: lr_svc    ← 任务函数调用链的返回地址（SVC 模式的 lr）
sp+56: resume_pc ← 被打断的 PC（来自 lr_fiq - 4，由 SRSDB 存入）
sp+60: cpsr      ← 被打断时的 CPSR（来自 SPSR_fiq，由 SRSDB 存入）
```

协作式和抢占式共用这个格式（协作式的 context_switch 也会在 02 节改为构建同样布局的帧）。统一格式带来的好处是：恢复任何任务的代码永远只有一种写法——POP + RFEIA，调度器不需要区分任务是怎么被暂停的。

## SRSDB 与 RFEIA：ARM 的 OS 利器

这两条指令是 ARM 架构专门为操作系统上下文保存设计的：

**`SRSDB SP!, #mode`**（Store Return State, Decrement Before）
把**当前模式**的 LR 和 SPSR 存到**指定模式**的栈上，再更新该模式的 SP。

```asm
; FIQ 模式里：
SUB   LR, LR, #4          ; LR_fiq = 被中断的 PC
SRSDB SP!, #0x13           ; 把 {LR_fiq, SPSR_fiq} 存入 SVC 模式的栈
                           ; → 任务的 SVC 栈顶出现了 [resume_pc, cpsr]
```

一条指令完成了"把 FIQ 模式里的中断现场信息转移到任务 SVC 栈"的操作，绕开了 FIQ r8-r12 banking 的问题。

**`RFEIA SP!`**（Return From Exception, Increment After）
从栈上加载 PC 和 CPSR，完成异常返回——恢复路径的最后一步。

```asm
RFEIA SP!    ; PC = [sp], CPSR = [sp+4], sp += 8，跳到 PC，同时恢复 CPSR
```

> **FreeRTOS 做什么？** FreeRTOS ARM_CRx 也用了完全相同的 `SRSDB`/`RFEIA` 技术，但它用 IRQ（不用 FIQ）做 tick。由于 IRQ 只 bank r13/r14（不 bank r8-r12），它甚至不需要我们这里的 SRSDB 技巧——但 RFEIA 同样是它恢复路径的核心。

# 调度器整体结构

```text
┌─────────────────────────────────────────────┐
│               FIQ handler                   │
│  SRSDB + CPS + PUSH → save context          │
│  BL scheduler_tick() → tick++, 唤醒, 调度   │
│  POP + RFEIA          → restore context     │
└────────────────┬────────────────────────────┘
                 │ BL
┌────────────────▼────────────────────────────┐
│            scheduler_tick()                  │
│  ① 唤醒 sleep_until 到期的 Sleeping 任务     │
│  ② 递减当前任务时间片                        │
│  ③ 检测是否有更高优先级任务刚被唤醒          │
│  ④ 若需切换：更新 CURRENT_TASK              │
└─────────────────────────────────────────────┘

任务状态机：
  add_task()       → Ready
  scheduler 选中   → Running
  sleep_ticks(n)   → Sleeping（真正让出 CPU，n tick 后自动唤醒 → Ready）
  time slice ends  → Ready（重新入队，保留优先级）
  task_exit()      → Zombie（永不再调度）
  all sleeping     → idle 任务（wfi 低功耗等待）
```

| 小节 | 内容 |
| --- | --- |
| `01-ready-queue.md` | 优先级就绪队列、`sleep_ticks`、空闲任务、完整 scheduler_tick |
| `02-preemption.md` | SRSDB/RFEIA 实现、16 字 context frame、`add_task(entry, priority)` |

# 练习题

```quiz single
Q: 协作式调度和抢占式调度的根本区别是什么？
- 协作式更快，抢占式更慢
+ 协作式由任务主动让出 CPU，抢占式由硬件中断强制切换，任务无需配合
- 协作式只支持两个任务，抢占式支持更多
- 协作式不能用于嵌入式系统
E: 协作式调度的"协"字指任务之间相互配合、主动让出。一旦某个任务出现 bug 陷入死循环，整个系统就卡死。抢占式调度依靠定时中断强制打断任意任务，即使某个任务死循环，定时器仍然会触发，调度器仍然能切换到其他任务。
```

```quiz single
Q: 为什么 14 字 frame（第 06 章的 push {r0-r12, lr}）对真抢占不够？
+ 缺少 CPSR 条件标志和任务自己的 lr_svc，任务在任意点被中断时这两个值都可能正在使用中
- 因为 14 字 frame 只适用于协作式切换
- 因为 push {r0-r12, lr} 在 FIQ 模式下会保存错误的 r8-r12
- 因为 14 字 frame 不够放下所有寄存器
E: 在协作式切换中，任务主动调用 context_switch()，CPSR 条件标志已经"消耗完"了（没有未执行的条件分支依赖它），lr 也等于函数的返回地址（这正是我们需要保存的）。而在抢占式切换中，任务可能在任何指令之间被中断，此时 CPSR 可能正在等待一个条件判断，lr 也可能是函数调用链中的某个中间地址，两者都必须精确保存和恢复。
```

```quiz single
Q: SRSDB SP!, #0x13 在 FIQ 模式下执行，它在哪里存储什么内容？
- 在 FIQ 模式的栈上存储 r0-r7 的值
+ 在 SVC 模式（0x13）的栈上存储 LR_fiq（= 被中断的 PC）和 SPSR_fiq（= 被中断的 CPSR）
- 在 SVC 模式的栈上存储 FIQ 模式的 r8-r12
- 在 FIQ 模式的栈上存储 SVC 模式的 sp 和 lr
E: SRS = Store Return State，存储"返回状态"（即异常返回所需的 LR 和 SPSR）。DB = Decrement Before（先递减 SP 再存储）。#0x13 = SVC 模式。所以这条指令把当前模式（FIQ）的 LR 和 SPSR 存到 SVC 模式的栈上，并更新 SVC 模式的 SP。这正好把"被中断的 PC"和"被中断的 CPSR"从 FIQ 的 banked 寄存器里"搬"到了任务的 SVC 栈上。
```