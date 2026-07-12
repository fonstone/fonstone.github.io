---
title: "消息队列实现"
description: "进程间通信 - 消息队列实现"
date: "2026-07-12"
order: 10002
tags: ["消息队列", "message queue", "任务间通信", "缓冲区", "阻塞发送"]
est_time: "60分钟"
---

# 消息队列实现

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

> 消息队列是 RTOS 中最灵活的 IPC 机制之一。它比共享内存更安全（通过内核管理可防止越界访问），比信号量携带更多信息（消息类型 + 数据载荷），是实现任务间解耦通信的首选方案。