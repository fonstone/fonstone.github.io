---
title: "自旋锁"
description: "同步原语 - 自旋锁"
date: "2026-07-12"
order: 9001
tags: ["自旋锁", "spinlock", "忙等待", "原子操作", "互斥"]
est_time: "35分钟"
---

# 自旋锁

## 什么是自旋锁

自旋锁（Spinlock）是最基础的同步原语之一。当多个任务或中断处理程序可能同时访问同一份共享数据时，自旋锁提供了一种简单的互斥机制：**锁被持有时，其他尝试获取锁的线程会原地自旋等待**（忙等待，busy-waiting），直到锁被释放。

在裸机 RTOS 环境中，自旋锁特别适合保护**极短临界区**（仅若干条内存访问指令）。因为自旋等待的开销低——不需要上下文切换，只需要一个原子操作循环。

## 自旋锁的核心要求

1. **原子性**：锁的获取（test-and-set）必须是原子的，不能被中断或并发操作拆分
2. **内存序**：获取锁时必须带 Acquire 语义，释放锁时必须带 Release 语义，保证临界区内的内存访问不会重排到锁外
3. **关中断**：在单核系统中，自旋锁配合关中断可同时防止中断处理程序与任务之间的竞争

## 基于 AtomicBool 的实现

Rust 标准库提供了 `core::sync::atomic::AtomicBool`，其中 `swap` 和 `compare_exchange` 方法保证原子性：

```rust
use core::sync::atomic::{AtomicBool, Ordering};

pub struct Spinlock {
    locked: AtomicBool,
}

impl Spinlock {
    pub const fn new() -> Self {
        Spinlock {
            locked: AtomicBool::new(false),
        }
    }

    pub fn acquire(&self) {
        while self.locked.swap(true, Ordering::Acquire) {
            // 自旋等待：执行一条 hint 指令，提示处理器当前处于等待状态
            core::hint::spin_loop();
        }
    }

    pub fn release(&self) {
        self.locked.store(false, Ordering::Release);
    }
}
```

## 关中断的变体

在 RTOS 中，任务代码可能在任何时刻被 FIQ 定时器中断抢占。如果任务持有自旋锁时被中断，而中断处理程序也尝试获取同一把锁，就会死锁。

因此，在实际的 RTOS 实现中，自旋锁通常需要配合关中断使用：

```rust
pub struct IrqSpinlock {
    locked: AtomicBool,
}

impl IrqSpinlock {
    pub const fn new() -> Self {
        IrqSpinlock {
            locked: AtomicBool::new(false),
        }
    }

    pub fn acquire(&self) {
        // 关 FIQ 中断，防止中断处理程序与当前任务竞争
        unsafe { crate::interrupt::disable_fiq(); }
        while self.locked.swap(true, Ordering::Acquire) {
            core::hint::spin_loop();
        }
    }

    pub fn release(&self) {
        self.locked.store(false, Ordering::Release);
        unsafe { crate::interrupt::enable_fiq(); }
    }
}
```

## 使用示例

```rust
static LOCK: Spinlock = Spinlock::new();

fn shared_data_access() {
    LOCK.acquire();
    // 临界区：安全访问共享数据
    LOCK.release();
}
```

## 自旋锁的适用场景

| 场景 | 适合自旋锁？ | 原因 |
| --- | --- | --- |
| 保护仅几条指令的临界区 | ✅ 非常适合 | 自旋开销小于上下文切换 |
| 临界区包含阻塞操作 | ❌ 不适合 | 自旋等待浪费 CPU |
| 中断上下文保护 | ✅ 配合关中断使用 | 中断中不能阻塞 |

> 自旋锁的核心理念是"轻量"——它假设锁只被持有极短的时间。如果你的临界区涉及复杂计算或阻塞等待，请使用互斥量（Mutex）。