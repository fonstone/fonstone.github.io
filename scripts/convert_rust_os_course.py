import re
import os
from pathlib import Path

SOURCE_DIR = Path(r"D:\00 Work\ai-web\rust_os_learning\src\content\lessons")
TARGET_DIR = Path(r"D:\00 Work\fonstone\fonstone.github.io\projects\rust-os")

os.makedirs(TARGET_DIR, exist_ok=True)

CHAPTER_MAP = {
    "00-overview": 1,
    "01-environment-setup": 2,
    "02-minimal-boot": 3,
    "03-uart": 4,
    "04-exceptions-and-interrupts": 5,
    "05-system-timer": 6,
    "06-context-switch": 7,
    "07-scheduler": 8,
    "08-sync-primitives": 9,
    "09-ipc": 10,
}

CHAPTER_TITLES = {
    "00-overview": "项目概述与架构设计",
    "01-environment-setup": "开发环境搭建",
    "02-minimal-boot": "最小裸机启动",
    "03-uart": "串口输出与调试宏",
    "04-exceptions-and-interrupts": "异常与中断体系",
    "05-system-timer": "系统定时器",
    "06-context-switch": "上下文切换",
    "07-scheduler": "调度器设计",
    "08-sync-primitives": "同步原语",
    "09-ipc": "进程间通信",
}

LESSON_ORDER = {}
lesson_index = 0
all_source_files = sorted(SOURCE_DIR.rglob("*.md"))

for fpath in all_source_files:
    rel = fpath.relative_to(SOURCE_DIR)
    parts = rel.stem.split("__")
    ch_key = parts[0]
    order_base = CHAPTER_MAP.get(ch_key, 99) * 1000
    raw = fpath.read_text(encoding="utf-8")
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", raw, re.DOTALL)
    if not fm_match:
        continue
    fm_text = fm_match.group(1)
    lid = ""
    lm = re.search(r'^lessonId:\s*"(.*)"', fm_text, re.MULTILINE)
    if lm:
        lid = lm.group(1)
    seg = 0
    if lid:
        mn = re.search(r"(\d+)", lid)
        if mn:
            seg = int(mn.group(1))
    order = order_base + seg
    LESSON_ORDER[rel] = order


def slug_for(rel_path):
    parts = rel_path.stem.split("__")
    ch_key = parts[0]
    lesson_part = parts[1] if len(parts) > 1 else "index"
    ch_num = CHAPTER_MAP.get(ch_key, 99)
    return f"ch{ch_num:02d}-{lesson_part}"


def convert_file(fpath, generate_stub=False):
    """Convert a single source file, optionally generating content if stub."""
    raw = fpath.read_text(encoding="utf-8")
    rel = fpath.relative_to(SOURCE_DIR)
    
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", raw, re.DOTALL)
    if not fm_match:
        return None
    
    fm_text = fm_match.group(1)
    body = raw[fm_match.end():].strip()
    
    is_stub = ("（待编写）" in body or "待编写" in body) and len(body) < 500
    
    title_m = re.search(r'^title:\s*"(.*)"', fm_text, re.MULTILINE)
    title = title_m.group(1) if title_m else rel.stem
    
    tags_m = re.search(r'^tags:\s*\[(.*)\]', fm_text, re.MULTILINE)
    tag_list = ["Rust", "RTOS"]
    if tags_m:
        tag_list = [t.strip().strip('"') for t in tags_m.group(1).split(",")]
    
    duration_m = re.search(r'^duration:\s*"(.*)"', fm_text, re.MULTILINE)
    est_time = duration_m.group(1) if duration_m else "30 分钟"
    
    ch_key = rel.stem.split("__")[0]
    ch_num = CHAPTER_MAP.get(ch_key, 99)
    ch_title = CHAPTER_TITLES.get(ch_key, ch_key)
    
    order = LESSON_ORDER.get(rel, 99999)
    slug = slug_for(rel)
    
    # Generate content for stubs
    if is_stub and generate_stub:
        body = generate_stub_content(rel, title, ch_key)
    
    # Clean up HTML -> Markdown
    body = re.sub(r'<div\s+id="article-content">', "", body)
    body = re.sub(r'</div>\s*$', "", body)
    
    tags_str = ", ".join(f'"{t}"' for t in tag_list)
    fm_block = f"""---
title: "{title}"
description: "{ch_title} - {title}"
date: "2026-07-12"
order: {order}
tags: [{tags_str}]
est_time: "{est_time}"
---

"""
    return (slug, fm_block + body, rel)


def generate_stub_content(rel, title, ch_key):
    """Generate proper content for stub files based on chapter context."""
    name = rel.stem
    
    if "spinlock" in name:
        return """# 自旋锁

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

> 自旋锁的核心理念是"轻量"——它假设锁只被持有极短的时间。如果你的临界区涉及复杂计算或阻塞等待，请使用互斥量（Mutex）。"""
    
    elif "mutex" in name:
        return """# 互斥量

## 从自旋锁到互斥量

自旋锁的问题在于：如果临界区执行时间较长，自旋等待会浪费大量 CPU 周期。互斥量（Mutex）提供了另一种策略：**当锁被占用时，尝试获取锁的任务主动放弃 CPU，让调度器去执行其他就绪任务**。

这需要在 RTOS 中引入"任务阻塞（Block）"机制——任务因等待某个资源而暂停执行，被移出就绪队列，直到资源可用时再被唤醒。

## 互斥量的核心设计

一个基本的互斥量需要以下要素：

1. **状态**：锁定/未锁定
2. **等待队列**：记录哪些任务在等待这把锁
3. **lock 操作**：如果锁空闲则获取，否则将当前任务加入等待队列并触发调度
4. **unlock 操作**：释放锁，如果有等待任务则唤醒其中一个

```rust
use crate::task::{TaskControlBlock, current_task};
use crate::scheduler::SCHEDULER;
use core::sync::atomic::{AtomicBool, Ordering};

pub struct Mutex {
    locked: AtomicBool,
    wait_queue: [Option<*mut TaskControlBlock>; 8],  // 简化的等待队列
    wait_count: usize,
}

impl Mutex {
    pub const fn new() -> Self {
        Mutex {
            locked: AtomicBool::new(false),
            wait_queue: [None; 8],
            wait_count: 0,
        }
    }

    pub fn lock(&mut self) {
        if self.locked.swap(true, Ordering::Acquire) {
            // 锁已被占用，当前任务需要阻塞
            let task = current_task();
            self.wait_queue[self.wait_count] = Some(task);
            self.wait_count += 1;
            // 标记任务为阻塞状态，触发重新调度
            unsafe { block_current_and_schedule(); }
        }
    }

    pub fn unlock(&mut self) {
        if self.wait_count > 0 {
            // 有等待的任务，唤醒一个
            self.wait_count -= 1;
            if let Some(task_ptr) = self.wait_queue[0] {
                // 将剩余等待任务前移
                for i in 0..self.wait_count {
                    self.wait_queue[i] = self.wait_queue[i + 1];
                }
                self.wait_queue[self.wait_count] = None;
                unsafe { wakeup_task(task_ptr); }
            }
        }
        self.locked.store(false, Ordering::Release);
    }
}
```

## 互斥量与自旋锁的选择

| 特性 | 自旋锁 | 互斥量 |
| --- | --- | --- |
| 等待方式 | 忙等待（消耗 CPU） | 阻塞（让出 CPU） |
| 临界区长度 | 极短（数条指令） | 可长可短 |
| 中断上下文 | 可用（配合关中断） | 不可用（阻塞要求调度器） |
| 实现复杂度 | 极简 | 需要调度器配合 |

> **核心原则**：临界区极短（< 几十条指令）用自旋锁；临界区较长或可能阻塞用互斥量。"""
    
    elif "semaphore" in name:
        return """# 信号量

## 什么是信号量

信号量（Semaphore）是 Dijkstra 提出的经典同步原语，本质上是一个**带等待队列的计数器**。它有两种操作：

- **wait / P / acquire**：计数器减 1，如果结果为负则阻塞当前任务
- **signal / V / release**：计数器加 1，如果有任务在等待则唤醒一个

信号量有两种常见形式：

| 类型 | 初始值 | 用途 |
| --- | --- | --- |
| 二进制信号量 | 1 | 类似互斥量，用于互斥访问 |
| 计数信号量 | N | 管理 N 个相同资源（如缓冲区槽位） |

## 计数信号量的实现

```rust
use crate::task::TaskControlBlock;
use crate::scheduler::SCHEDULER;
use core::sync::atomic::{AtomicI32, Ordering};

pub struct Semaphore {
    count: AtomicI32,            // 资源计数
    wait_queue: [Option<*mut TaskControlBlock>; 16],
    wait_count: usize,
}

impl Semaphore {
    pub const fn new(initial: i32) -> Self {
        Semaphore {
            count: AtomicI32::new(initial),
            wait_queue: [None; 16],
            wait_count: 0,
        }
    }

    pub fn wait(&mut self) {
        loop {
            let old = self.count.load(Ordering::Relaxed);
            if old > 0 {
                if self.count.compare_exchange(old, old - 1, Ordering::Acquire, Ordering::Relaxed).is_ok() {
                    return;  // 成功获取信号量
                }
            } else {
                // 资源不足，阻塞当前任务
                let task = unsafe { crate::task::current_task() };
                self.wait_queue[self.wait_count] = Some(task);
                self.wait_count += 1;
                unsafe { block_current_and_schedule(); }
                // 被唤醒后重新尝试获取
            }
        }
    }

    pub fn signal(&mut self) {
        if self.wait_count > 0 {
            // 有等待任务，先唤醒再释放（避免信号量值无限增长）
            self.wait_count -= 1;
            if let Some(task_ptr) = self.wait_queue[0] {
                for i in 0..self.wait_count {
                    self.wait_queue[i] = self.wait_queue[i + 1];
                }
                self.wait_queue[self.wait_count] = None;
                unsafe { wakeup_task(task_ptr); }
            }
        }
        self.count.fetch_add(1, Ordering::Release);
    }
}
```

## 生产者-消费者示例

```rust
static SEM_EMPTY: Semaphore = Semaphore::new(8);  // 缓冲区有 8 个空位
static SEM_FULL:  Semaphore = Semaphore::new(0);   // 初始 0 个数据

fn producer_task() {
    loop {
        let item = produce_item();
        SEM_EMPTY.wait();    // 等待空位
        buffer[write_pos] = item;
        SEM_FULL.signal();   // 数据可用
    }
}

fn consumer_task() {
    loop {
        SEM_FULL.wait();     // 等待数据
        let item = buffer[read_pos];
        SEM_EMPTY.signal();  // 空出一个位置
        consume_item(item);
    }
}
```

## 信号量 vs 互斥量

| 特性 | 互斥量 | 二进制信号量 |
| --- | --- | --- |
| 所有权 | 有（只能由持有者释放） | 无（任何任务都可以 signal） |
| 用途 | 互斥访问 | 事件通知、资源计数 |
| 优先级反转 | 可能（可引入优先级继承解决） | 可能 |
| 递归加锁 | 通常不支持 | 不支持 |

> 在 RTOS 中，互斥量和信号量是互补关系而非替代关系。互斥量保护共享数据的互斥访问，信号量则更常用于事件通知和资源计数场景。"""
    
    elif "message-queue" in name:
        return """# 消息队列实现

## 为什么需要消息队列

共享内存和环形缓冲区适合传递原始数据流，但在许多场景中，任务之间需要传递**有结构的消息**——每条消息有明确的类型、长度和载荷。消息队列（Message Queue）正是为这种场景设计的 IPC 机制。

消息队列的核心特性：

1. **消息边界**：每条消息独立存储，接收者一次读取一条完整消息
2. **可变长度**：每条消息长度可以不同
3. **阻塞语义**：队列满时发送者阻塞，队列空时接收者阻塞
4. **优先级**：高优先级消息可被优先处理

## 消息队列的数据结构

```rust
/// 消息头：固定 8 字节，放在消息体前面
#[repr(C)]
pub struct MessageHeader {
    pub msg_type: u32,    // 消息类型（由应用定义）
    pub length: u32,      // 消息体长度（字节）
}

/// 消息队列控制块
pub struct MessageQueue {
    buffer: *mut u8,        // 消息缓冲区起始地址
    capacity: usize,        // 总容量（字节）
    head: usize,            // 读指针
    tail: usize,            // 写指针
    count: usize,           // 当前消息条数
    // 等待队列
    send_wait: [Option<*mut TaskControlBlock>; 8],
    send_wait_count: usize,
    recv_wait: [Option<*mut TaskControlBlock>; 8],
    recv_wait_count: usize,
}
```

## 发送消息

```rust
impl MessageQueue {
    pub fn send(&mut self, msg_type: u32, data: &[u8]) -> Result<(), &'static str> {
        let total_len = core::mem::size_of::<MessageHeader>() + data.len();
        if total_len > self.capacity {
            return Err("消息太大");
        }

        // 检查剩余空间是否足够（循环缓冲区）
        let space = (self.capacity - (self.tail - self.head) % self.capacity) % self.capacity;
        if space < total_len {
            // 队列满，阻塞当前任务
            let task = unsafe { current_task() };
            self.send_wait[self.send_wait_count] = Some(task);
            self.send_wait_count += 1;
            unsafe { block_current_and_schedule(); }
            // 被唤醒后重试
            return self.send(msg_type, data);
        }

        // 写入消息头
        let header = MessageHeader {
            msg_type,
            length: data.len() as u32,
        };
        let hdr_ptr = unsafe { self.buffer.add(self.tail) as *mut MessageHeader };
        unsafe { hdr_ptr.write(header); }
        self.tail = (self.tail + core::mem::size_of::<MessageHeader>()) % self.capacity;

        // 写入消息体
        for (i, &byte) in data.iter().enumerate() {
            let dst = unsafe { self.buffer.add((self.tail + i) % self.capacity) };
            unsafe { dst.write(byte); }
        }
        self.tail = (self.tail + data.len()) % self.capacity;
        self.count += 1;

        // 唤醒等待接收的任务
        if self.recv_wait_count > 0 {
            self.recv_wait_count -= 1;
            if let Some(task) = self.recv_wait[0] {
                for i in 0..self.recv_wait_count {
                    self.recv_wait[i] = self.recv_wait[i + 1];
                }
                self.recv_wait[self.recv_wait_count] = None;
                unsafe { wakeup_task(task); }
            }
        }

        Ok(())
    }
}
```

## 接收消息

```rust
impl MessageQueue {
    pub fn recv(&mut self, buf: &mut [u8]) -> Result<(u32, usize), &'static str> {
        if self.count == 0 {
            // 队列空，阻塞当前任务
            let task = unsafe { current_task() };
            self.recv_wait[self.recv_wait_count] = Some(task);
            self.recv_wait_count += 1;
            unsafe { block_current_and_schedule(); }
            // 被唤醒后重试
            return self.recv(buf);
        }

        // 读取消息头
        let hdr_ptr = unsafe { self.buffer.add(self.head) as *const MessageHeader };
        let header = unsafe { hdr_ptr.read() };
        self.head = (self.head + core::mem::size_of::<MessageHeader>()) % self.capacity;

        // 读取消息体
        let len = header.length as usize;
        let copy_len = len.min(buf.len());
        for i in 0..copy_len {
            let src = unsafe { self.buffer.add((self.head + i) % self.capacity) };
            buf[i] = unsafe { src.read() };
        }
        self.head = (self.head + len) % self.capacity;
        self.count -= 1;

        // 唤醒等待发送的任务
        if self.send_wait_count > 0 {
            self.send_wait_count -= 1;
            if let Some(task) = self.send_wait[0] {
                for i in 0..self.send_wait_count {
                    self.send_wait[i] = self.send_wait[i + 1];
                }
                self.send_wait[self.send_wait_count] = None;
                unsafe { wakeup_task(task); }
            }
        }

        Ok((header.msg_type, copy_len))
    }
}
```

> 消息队列是 RTOS 中最灵活的 IPC 机制之一。它比共享内存更安全（通过内核管理可防止越界访问），比信号量携带更多信息（消息类型 + 数据载荷），是实现任务间解耦通信的首选方案。"""
    
    elif "index" in name and "08" in ch_key:
        return """# 同步原语概述与临界区

## 为什么需要同步原语

在多任务 RTOS 中，多个任务和中断处理程序可能同时访问共享资源（全局变量、外设寄存器、缓冲区等）。如果没有正确的同步机制，就会出现**竞态条件**（Race Condition）——程序的正确性依赖于不同执行流的相对时序，而时序是不可预测的。

典型的竞态场景：

```
任务 A 读取 count = 5
   → 中断发生，处理程序修改 count = 3
   → 返回任务 A，count 仍为 5，后续操作基于过时的值
```

## 临界区

**临界区（Critical Section）** 是访问共享资源的代码片段，在同一时间只能由一个执行流进入。

保护临界区的三种基本方法：

| 方法 | 适用场景 | 缺点 |
| --- | --- | --- |
| 关中断 | 极短临界区（中断上下文 vs 任务） | 关中断时间过长影响实时性 |
| 自旋锁 | 极短临界区（多核或任务间） | 忙等待浪费 CPU |
| 互斥量/信号量 | 较长临界区（任务间） | 需要调度器支持阻塞操作 |

## 本章内容

本章将实现三种常用的同步原语：

- **自旋锁（Spinlock）**：最简单的忙等待锁，适合极短临界区
- **互斥量（Mutex）**：带等待队列的阻塞锁，适合较长临界区
- **信号量（Semaphore）**：计数型同步原语，既可用于互斥也可用于事件通知

在开始之前，请确保已完成第 07 章调度器的实现——因为互斥量和信号量需要阻塞/唤醒机制。"""
    
    elif "index" in name and "09" in ch_key:
        return """# IPC 设计原则

## 什么是 IPC

IPC（Inter-Process Communication，进程间通信）是操作系统中不同执行流之间交换数据或消息的机制。在 RTOS 语境下，我们的"进程"就是各个任务（Task），所有任务共享同一地址空间。

## 裸机 RTOS 中 IPC 的特点

与 Linux 等完整操作系统不同，我们的 RTOS 有以下特殊性：

1. **无 MMU，共享地址空间**：所有任务可以直接访问全局变量和缓冲区，不需要复杂的地址映射
2. **单核，无需处理缓存一致性**：不需要考虑多核间的缓存同步问题
3. **可预测的调度**：可以配合 `sleep_ticks` 实现确定性的任务切换

这些特点使得我们的 IPC 实现比 Linux 简单得多，但核心设计思路是一致的。

## IPC 方式对比

| 方式 | 数据量 | 通信模式 | 阻塞语义 | 复杂度 |
| --- | --- | --- | --- | --- |
| 共享内存 + 自旋锁 | 大 | 多写多读 | 忙等待 | 低 |
| SPSC 环形缓冲区 | 中等 | 单生产者单消费者 | 无锁 | 中 |
| 消息队列 | 小到中 | 多对多 | 阻塞/非阻塞 | 高 |

## 本章内容

- **共享内存**：通过 `static` 变量和自旋锁实现任务间的数据共享
- **SPSC 无锁环形缓冲区**：单生产者单消费者的高性能数据传递
- **消息队列**：结构化消息的传递机制

## 前置条件

- 第 08 章同步原语已完成（自旋锁）
- 调度器正常工作，`sleep_ticks` 可用"""
    
    return body


# Process all files
lesson_data = []
for fpath in all_source_files:
    result = convert_file(fpath, generate_stub=True)
    if result:
        lesson_data.append(result)

# Sort by order
lesson_data.sort(key=lambda x: int(re.search(r"order:\s*(\d+)", x[1]).group(1)))

# Write all files
for slug, content, rel in lesson_data:
    target = TARGET_DIR / f"{slug}.md"
    target.write_text(content, encoding="utf-8")
    status = "STUB→written" if "待编写" not in content else "OK"
    print(f"  {slug}.md ({status})")

print(f"\nDone! {len(lesson_data)} files written to {TARGET_DIR}")
