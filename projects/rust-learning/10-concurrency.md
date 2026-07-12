---
title: "并发编程"
description: "线程创建与控制、消息传递（Channel）、共享状态（Mutex）、Sync 与 Send trait"
date: "2026-07-12"
order: 10
tags: ["并发", "线程", "Channel", "Mutex"]
est_time: "60 分钟"
---

Rust 的设计目标之一是「无畏并发」（Fearless Concurrency）——通过所有权系统，Rust 在**编译期**就能消除绝大多数并发错误（如数据竞争），而不是把问题留到运行时。

并发模型的核心选择只有两种：**消息传递**（线程之间发送数据，不共享内存）和**共享状态**（线程之间共享数据，用锁保护）。Rust 对这两种模式都提供了安全的实现，本章将分别讲解。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 创建线程、           | join            | 等待、             | move            | 闭包捕获环境          |
| 通过通道在线程间安全传递数据  |                 |
| 多线程下安全共享和修改同一份数据 |                 |
| 线程安全背后的底层标记 Trait，编译期线程安全保证的来源 |                 |
# 并发与线程

在大多数现代操作系统里，程序运行在一个**进程**（process）中，操作系统管理着多个进程。而进程内部，还可以拆分出多个同时运行的独立单元，叫做**线程**（thread）。

把工作分给多个线程能提升性能，但也带来了新挑战：

- **竞争状态**（Race condition）：多个线程以不可预期的顺序读写同一份数据
- **死锁**（Deadlock）：两个线程互相等待对方释放资源，永远卡住
- 只在特定时机才复现的玄学 bug

Rust 的设计哲学是「无畏并发」——通过所有权和类型系统，在**编译期**消除绝大部分并发错误。

## 线程模型：1:1 vs M:N

线程有两种主流实现方式，理解它们有助于你明白 Rust 的选择。

**1:1 模型**：程序创建的每个线程，操作系统都分配一个真实的 OS 线程与之对应。Rust 标准库使用这种模型。

**M:N 模型（绿色线程）**：语言运行时自己管理 M 个「用户态线程」，把它们调度到 N 个 OS 线程上运行，M 通常远大于 N。Go 的 goroutine、Erlang 的进程都是这种模型。

| 1:1 模型（Rust 标准库） | M:N 模型（Go goroutine） |
| --------------- | --------------- |
| 线程由谁管理          | 操作系统            | 语言运行时           |
| 创建开销            | 较大（需要系统调用）      | 极小（用户态切换）       |
| 可并发数量           | 受 OS 限制，通常数千    | 可轻松开百万个         |
| 需要运行时           | 不需要             | 需要内置调度器         |

**Rust 为什么选 1:1？** Rust 的核心目标之一是「零额外运行时」——程序可以直接和 C 互操作，部署到嵌入式等受限环境。M:N 模型需要一个内置的线程调度器，这与目标冲突。

> 如果你需要百万级并发，Rust 生态提供了 tokio、async-std 等异步运行时 crate。它们用少量 OS 线程驱动大量异步任务，效果类似 M:N，但以 crate 形式存在而非绑定进语言本身——用不到就零开销。异步编程是后续章节的主题。


## 使用 spawn 创建线程

调用 `thread::spawn` 并传入一个闭包，闭包里的代码就在新线程中运行：

```
use std::thread;
use std::time::Duration;

fn main() {
    // 创建一个新线程
    thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程：第 {} 次", i);
            thread::sleep(Duration::from_millis(1)); // 睡眠 1 毫秒，让出 CPU，给其他线程运行机会
        }
    });

    // 主线程自己也在运行
    for i in 1..=3 {
        println!("主线程：第 {} 次", i);
        thread::sleep(Duration::from_millis(1)); // 同上，制造交替执行的效果
    }
    // 主线程结束 → 整个程序结束，子线程可能还没跑完！
}
```

运行这段代码你会发现：**主线程一结束，子线程也被强制终止**，不管它有没有跑完。输出顺序也是不确定的，因为操作系统随时可能切换线程。

## join：等待子线程完成

`thread::spawn` 返回一个 `JoinHandle`。对它调用 `.join()` 会**阻塞当前线程**，直到对应的子线程结束：

```
use std::thread;
use std::time::Duration;

fn main() {
    // 把 JoinHandle 保存下来
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程：第 {} 次", i);
            thread::sleep(Duration::from_millis(1)); // 睡眠 1 毫秒，让出 CPU
        }
    });

    for i in 1..=3 {
        println!("主线程：第 {} 次", i);
        thread::sleep(Duration::from_millis(1)); // 同上
    }

    // 在这里等待子线程结束，再继续
    handle.join().unwrap();
    println!("所有线程都完成了！");
}
```

现在子线程的 5 次输出一定会全部打印出来。

> join 放在哪里很重要：如果在主线程的 for 循环之前就 join，那主线程会先等子线程跑完，再执行自己的循环——两者就不再并发了。


# move 闭包与所有权

## 为什么需要 move

子线程需要用到外部数据时，直接借用会有问题。来看一个例子：

```
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    // 编译错误：闭包借用了 v，但 Rust 不知道这个线程会活多久
    let handle = thread::spawn(|| {
        println!("向量：{:?}", v);
    });

    // 如果这里 drop(v)，子线程就访问了悬空引用！
    handle.join().unwrap();
}
```

编译器会报错：闭包试图借用 `v`，但 Rust 无法保证主线程不会在子线程还在用 `v` 的时候把它丢弃。这是一个**合理的担忧**——比如主线程可以调用 `drop(v)` 后立刻结束，子线程就读到了悬空数据。

## 用 move 转移所有权

解决办法是在闭包前加 `move` 关键字，强制闭包**获取**它用到的所有值的所有权：

```
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    // move 把 v 的所有权移入闭包，子线程独占 v
    let handle = thread::spawn(move || {
        println!("向量：{:?}", v);
    });

    // v 已经移走了，这里不能再用 v
    handle.join().unwrap();
}
```

加了 `move` 后，`v` 的所有权转移给了子线程的闭包。主线程再也无法访问 `v`，从根本上避免了悬空引用的可能。

## move 闭包的所有权效果

```
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(move || {
        println!("{:?}", v); // v 已被 move 进来
    });

    drop(v); // 编译错误！v 已经移走了，这里无法使用

    handle.join().unwrap();
}
```

这正是 Rust 给我们的保护：`move` 之后，所有权规则确保主线程不可能再碰 `v`，消除了一类典型的并发 bug。

# 练习题

## 测验

```
use std::thread;
fn main() {
    let msg = String::from("hello");
    thread::spawn(move || println!("{}", msg));
}
```

## 编程练习

下面的代码希望创建一个子线程打印 1 到 5，主线程打印 “A” 到 “C”，并且保证子线程一定能跑完。请补全 `TODO` 部分：

```
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            // TODO: 打印 "子线程: {i}"
        }
    });

    for c in ['A', 'B', 'C'] {
        println!("主线程: {c}");
    }

    // TODO: 等待子线程结束
}
```
# 通道：线程间的单行道

Go 语言有一句著名的口号：“**不要通过共享内存来通信，而要通过通信来共享内存。**”

这句话描述了一种并发思路：与其让多个线程同时读写同一块内存（复杂、危险），不如给每个线程一个”收件箱”，线程之间传递消息，接收方从自己的收件箱里取数据。

Rust 标准库提供了**通道**（channel）来实现这个模式。

## 什么是 mpsc 通道

`std::sync::mpsc` 里的 `mpsc` 是 **Multiple Producer, Single Consumer** 的缩写——**多个发送者、一个接收者**。

可以把通道想象成一条传送带：

- **发送端**（`Sender<T>`）：往传送带上放东西
- **接收端**（`Receiver<T>`）：从传送带末端取东西
- 传送带只有一个出口，但入口可以有多个（克隆发送端）

```
use std::sync::mpsc;
use std::thread;

fn main() {
    // channel() 返回 (发送端, 接收端) 的元组
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        // 把 tx 移入子线程，发送一条消息
        tx.send(String::from("你好，主线程！")).unwrap();
    });

    // recv() 会阻塞，直到有消息到来
    let msg = rx.recv().unwrap();
    println!("收到：{}", msg);
}
```

## 发送与接收

接收端有两个方法：

| 方法              | 行为              |
| --------------- | --------------- |
| rx.recv()       | 阻塞              | 等待，有消息则返回       | Ok(T)           | ，通道关闭则返回        | Err             |
| rx.try_recv()   | 立即返回            | ，有消息返回          | Ok(T)           | ，暂无消息返回         | Err             | （不阻塞）           |

当发送端被丢弃（所有 `tx` 都 drop 了），通道关闭，`recv()` 会返回 `Err`。

## 所有权与消息传递

通道传值会**转移所有权**，这是 Rust 并发安全的关键之一：

```
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hello");
        tx.send(val).unwrap();
        // 编译错误：val 的所有权已经转移给通道了，这里不能再用
        println!("val = {}", val);
    });

    println!("收到：{}", rx.recv().unwrap());
}
```

`send(val)` 的签名是 `fn send(&self, t: T) -> Result<...>`，它会**消耗** `val`。这防止了”已发送的数据还被发送方修改”这类竞争 bug。

# 发送多条消息

## 把接收端当迭代器

实际场景里子线程往往需要发送多条消息。可以把 `rx` 当作迭代器来遍历，通道关闭后迭代自动结束：

```
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let items = vec!["苹果", "香蕉", "橙子", "葡萄"];
        for item in items {
            tx.send(item).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
        // tx 在这里 drop，通道关闭，rx 的迭代随之结束
    });

    // for received in rx 会阻塞等待，直到通道关闭
    for received in rx {
        println!("收到：{}", received);
    }

    println!("所有消息接收完毕");
}
```

## 多生产者：克隆发送端

`mpsc` 的 **M**（Multiple Producer）体现在：你可以克隆发送端，让多个线程各自往同一个通道里发消息：

```
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // 克隆一份发送端给第二个线程
    let tx2 = tx.clone();

    thread::spawn(move || {
        tx.send("来自线程 1 的消息").unwrap();
    });

    thread::spawn(move || {
        tx2.send("来自线程 2 的消息").unwrap();
    });

    // 接收两条消息（顺序不确定）
    for _ in 0..2 {
        println!("{}", rx.recv().unwrap());
    }
}
```

两个线程各自拥有一个发送端，谁先发到就先收到谁的。接收端仍然只有一个。


## 测验
# Mutex<T>：互斥锁

通道是「通过通信共享数据」，本节介绍另一种思路：**让多个线程直接共享同一块数据，但每次只允许一个线程访问**。

这个机制叫**互斥锁**（Mutex，Mutual Exclusion）。你可以把它想象成公共厕所门上的锁：进去之前先锁门，出来后开锁，这样里面永远只有一个人。

## Mutex 的基本用法

```
use std::sync::Mutex;

fn main() {
    // 把数据"装进" Mutex，外人无法直接访问
    let m = Mutex::new(5);

    {
        // lock() 获取锁，返回 MutexGuard 智能指针
        // 如果锁已被其他线程持有，当前线程会阻塞等待
        let mut num = m.lock().unwrap();
        *num = 6; // 通过 MutexGuard 修改内部数据
    } // 这里 num 离开作用域，MutexGuard 自动 drop，锁自动释放

    println!("m = {:?}", m);
}
```

关键点：

- **获取数据必须先拿锁**：`Mutex<T>` 把数据包裹起来，不 `lock()` 就无法访问 `T`
- **锁自动释放**：`MutexGuard` 是智能指针，离开作用域时 `Drop` 实现会自动释放锁，不需要手动解锁
- **中毒（Poisoning）**：如果持有锁的线程 panic 了，锁进入”中毒”状态。其他线程再调用 `lock()` 会得到 `Err`，调用 `.unwrap()` 就会 panic。

## 用 {} 手动控制持锁范围

`MutexGuard` 在离开**当前作用域**时才释放锁，所以用 `{}` 块包裹可以精确控制持锁时间：

```
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(0);

    {
        let mut num = m.lock().unwrap();
        *num += 1;
    } // ← num 在这里 drop，锁立刻释放

    // 锁已释放，可以再次获取
    println!("m = {:?}", m);
}
```

> 经验法则：只在真正需要修改数据的几行外套 {}，改完立刻释放。持锁时间越短，其他线程等待的时间就越短，并发效率越高。


## 单线程场景验证

先确保单线程里 Mutex 正常工作，再推进到多线程：

```
use std::sync::Mutex;

fn main() {
    let scores = Mutex::new(vec![]);

    {
        let mut s = scores.lock().unwrap();
        s.push(10);
        s.push(20);
    } // 锁释放

    {
        let mut s = scores.lock().unwrap();
        s.push(30);
    } // 锁再次释放

    println!("{:?}", scores.lock().unwrap()); // [10, 20, 30]
}
```

# Arc<T>：线程安全的引用计数

## 为什么不能用 Rc<T>

你可能想到：多线程共享数据，上一章用 `Rc<T>` 实现了多所有权，直接用不就好了？

```
use std::rc::Rc;
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Rc::new(Mutex::new(0));

    let counter2 = Rc::clone(&counter);
    thread::spawn(move || {
        // 编译错误：Rc<T> 不实现 Send，不能发送到其他线程
        *counter2.lock().unwrap() += 1;
    });
}
```

编译器拒绝了：`Rc<T>`** 不是线程安全的**。原因在于 `Rc<T>` 的引用计数是普通整数操作，两个线程同时克隆时可能同时修改引用计数，导致计数混乱，最终引发内存安全问题。

## Arc<T>：原子引用计数

`Arc<T>`（Atomic Reference Counting）是 `Rc<T>` 的线程安全版本。它用**原子操作**来更新引用计数，保证计数的修改不会被打断：

```
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3]);

    let data2 = Arc::clone(&data);
    let handle = thread::spawn(move || {
        // data2 现在属于子线程，和主线程的 data 共享同一份堆内存
        println!("子线程看到的数据：{:?}", data2);
    });

    handle.join().unwrap();
    println!("主线程看到的数据：{:?}", data);
    // 两个 Arc drop 后，堆内存才真正释放
}
```

> Arc 和 Rc 的 API 完全相同，只是多线程场景下换成 Arc 即可。代价是原子操作比普通整数操作稍慢，所以单线程仍然首选 Rc。


# Arc<Mutex<T>>：共享可变状态

## 组合两者

`Arc<T>` 解决了”多个线程都持有所有权”的问题，但 `Arc<T>` 本身是**不可变**的。要让多个线程共享**并修改**同一份数据，需要把 `Mutex<T>` 套在里面：`Arc<Mutex<T>>`。

- `Arc` 负责：让多个线程都能持有这份数据的所有权（引用计数）
- `Mutex` 负责：保证同一时刻只有一个线程在修改数据（加锁）

```
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc<Mutex<i32>>：可以跨线程共享的可变计数器
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..5 {
        // Arc::clone 增加引用计数，每个线程都得到一份"门票"
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            // 每个线程轮流获取锁，修改数据
            let mut num = counter.lock().unwrap();
            *num += 1;
        }); // num 在这里 drop，锁自动释放
        handles.push(handle);
    }

    // 等待所有线程完成
    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数：{}", *counter.lock().unwrap()); // 5
}
```

5 个线程各自加 1，最终结果一定是 5，不会出现数据竞争。

## 内部可变性的回顾

你会发现 `counter` 是不可变绑定，但我们却能修改它内部的值——这和 `RefCell<T>` 的道理一样，都是**内部可变性**。

| 组合              | 适用场景            |
| --------------- | --------------- |
| Rc<RefCell<T>>  | 单线程，需要多所有权 + 可变性 |
| Arc<Mutex<T>>   | 多线程，需要多所有权 + 可变性 |

`Mutex<T>` 是多线程版的 `RefCell<T>`：区别在于 `RefCell<T>` 在运行时检查借用规则，而 `Mutex<T>` 通过操作系统级别的锁来保证互斥。

## 死锁：需要注意的风险

Rust 能防止数据竞争，但**无法防止死锁**。死锁发生在：线程 A 持有锁 1，等待锁 2；线程 B 持有锁 2，等待锁 1——两者互相等待，永远不会释放。

避免死锁的简单原则：

- 尽量缩短持有锁的时间（把锁的作用域写小）
- 多把锁时，所有线程按相同顺序获取

# 选哪个？决策指南

学完智能指针和并发这两章，你面前摆着一堆工具：`Box`、`Rc`、`Arc`、`RefCell`、`Mutex`……初学者最容易困惑的就是”我到底该用哪个”。这里给出一个清晰的决策思路。

## 第一步：是否需要多所有权？

**不需要**（一个值只有一个所有者）→ 直接用普通所有权或 `Box<T>`。

**需要**（多个地方都要”拥有”同一份数据）→ 继续往下看。

## 第二步：是否跨线程？

**单线程** → 用 `Rc<T>`（引用计数，轻量，不带线程安全开销）

**多线程** → 用 `Arc<T>`（原子引用计数，线程安全）

## 第三步：是否需要修改共享的数据？

只读共享：到上一步就够了，`Rc<T>` 或 `Arc<T>` 直接用。

需要修改：

| 场景              | 用法              |
| --------------- | --------------- |
| 单线程，多所有权 + 可变   | Rc<RefCell<T>>  |
| 多线程，多所有权 + 可变   | Arc<Mutex<T>>   |

## 完整速查表

| 需求              | 推荐工具            | 原因              |
| --------------- | --------------- | --------------- |
| 堆分配 / 递归类型      | Box<T>          | 最简单的堆指针，单一所有权   |
| 单线程多所有权（只读）     | Rc<T>           | 引用计数，零线程开销      |
| 单线程多所有权（可变）     | Rc<RefCell<T>>  | RefCell 提供运行时借用检查 |
| 多线程多所有权（只读）     | Arc<T>          | 原子引用计数          |
| 多线程多所有权（可变）     | Arc<Mutex<T>>   | Mutex 保证互斥访问    |
| 多线程单向数据传递       | mpsc::channel   | 所有权转移，天然安全      |

> 经验法则：能用普通所有权就不用 Rc；能用 Rc 就不用 Arc；能用通道就不用 Mutex。越简单的工具，出错的可能性越小。



## 测验

```
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let n = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    for _ in 0..3 {
        let n = Arc::clone(&n);
        handles.push(thread::spawn(move || {
            *n.lock().unwrap() += 10;
        }));
    }
    for h in handles { h.join().unwrap(); }
    println!("{}", *n.lock().unwrap());
}
```

```
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let n = Arc::new(Mutex::new(0));
    let mut handles = vec![];
    for i in 1..=3 {
        let n = Arc::clone(&n);
        handles.push(thread::spawn(move || {
            *n.lock().unwrap() = i * 10; // 赋值，不是累加
        }));
    }
    for h in handles { h.join().unwrap(); }
    println!("{}", *n.lock().unwrap());
}
```
# 两个神奇的标记 Trait

前几节我们看到编译器拒绝了 `Rc<T>` 跨线程使用，接受了 `Arc<T>`。编译器是怎么知道谁能跨线程、谁不能的？答案就是两个内置于语言核心的标记 trait：`Send` 和 `Sync`。

它们定义在 `std::marker` 中，没有任何方法，只是一个「标签」——打上这个标签，就等于向编译器声明：「这个类型在多线程场景下是安全的。」

## 为什么需要标记 Trait

Rust 的所有权系统在单线程下已经能防止大量 bug。但多线程带来了新的问题：

- **数据竞争**：两个线程同时读写同一块内存，且至少有一个是写操作
- **悬空指针**：一个线程释放了数据，另一个线程还持有指向它的引用

`Send` 和 `Sync` 两个标记 trait，让编译器能在**编译期**就把这些问题拦截住。

# Send：可以跨线程转移所有权

## 什么是 Send

实现了 `Send` 的类型，其**所有权**可以安全地转移到另一个线程。

简单来说：如果你能把一个值 `move` 进 `thread::spawn` 的闭包，这个值就必须是 `Send` 的。

```
use std::thread;

fn main() {
    let s = String::from("hello"); // String 实现了 Send

    let handle = thread::spawn(move || {
        // s 的所有权被 move 到了这个线程
        println!("{}", s);
    });

    handle.join().unwrap();
}
```

`String` 实现了 `Send`，所以可以安全地移入子线程。

## 哪些类型不是 Send

最典型的是 `Rc<T>`：

```
use std::rc::Rc;
use std::thread;

fn main() {
    let rc = Rc::new(42);

    thread::spawn(move || {
        // 编译错误：Rc<i32> 没有实现 Send
        println!("{}", rc);
    });
}
```

为什么 `Rc<T>` 不是 `Send`？因为 `Rc` 的引用计数是普通整数操作，不是原子的。如果两个线程同时克隆同一个 `Rc`，会同时修改引用计数，导致计数错乱，引发内存安全问题。

`Arc<T>` 用原子操作来更新计数，所以是 `Send` 的。

## 自动推导规则

- 完全由 `Send` 类型组成的类型，自动是 `Send`
- 基本类型（`i32`、`bool`、`String` 等）几乎都是 `Send`
- 含有非 `Send` 类型字段的结构体，自动不是 `Send`

# Sync：可以被多线程共享引用

## 从 Send 到 Sync

`Send` 解决的是「**转移**所有权」的问题——值从一个线程移动到另一个线程。

但有时候我们不想转移，只想**共享**：主线程有一份数据，多个子线程都拿到它的引用，同时去读它。这就是 `Sync` 解决的问题。

> 定义：如果类型 T 是 Sync 的，则 &T（对 T 的不可变引用）可以安全地同时存在于多个线程中。


换个更直观的说法：**多个线程同时读同一个值，不会出问题**，这个类型就是 `Sync`。

## 最简单的例子：只读共享

```
use std::sync::Arc;
use std::thread;

fn main() {
    // Arc 让多个线程共享所有权，内部的 Vec 是 Sync 的（只读）
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let mut handles = vec![];
    for i in 0..3 {
        let data = Arc::clone(&data);
        handles.push(thread::spawn(move || {
            // 多个线程同时持有 &Vec<i32>，只读，完全安全
            println!("线程 {} 看到长度：{}", i, data.len());
        }));
    }

    for h in handles { h.join().unwrap(); }
}
```

`Vec<i32>` 是 `Sync` 的，因为多个线程同时**读**它不会产生任何问题——没有人在改它，不会有竞争。

## 为什么 RefCell<T> 不是 Sync

`RefCell<T>` 内部有一个**借用计数器**（一个整数），记录当前有几个活跃的借用。每次调用 `borrow()` 或 `borrow_mut()` 都要修改这个计数器。

问题在于：这个计数器的修改**不是原子的**。

想象两个线程同时对同一个 `RefCell` 调用 `borrow()`：

- 线程 A 读到计数器是 0
- 线程 B 读到计数器也是 0
- 线程 A 把计数器写成 1（“我借用了”）
- 线程 B 把计数器也写成 1（覆盖了 A 的写入！）

现在计数器是 1，但实际有两个活跃借用——借用规则被悄悄破坏了，后续可能出现两个可变借用同时存在的情况，导致数据竞争。

所以编译器禁止把 `RefCell` 的引用共享给多个线程：

```
use std::cell::RefCell;
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(RefCell::new(0));
    let data2 = Arc::clone(&data);

    thread::spawn(move || {
        // 编译错误：RefCell<i32> 没有实现 Sync
        // Arc 内部的 &RefCell<i32> 不能安全地跨线程共享
        *data2.borrow_mut() += 1;
    });
}
```

## Mutex<T> 是 Sync 的原因

`Mutex<T>` 也保护内部数据，但它用**操作系统锁**来保证互斥，而不是一个普通整数计数器。任何线程想访问数据都必须先拿锁，拿不到就阻塞——不可能有两个线程同时进入临界区。

因此 `Mutex<T>` 的引用可以安全地在多个线程间共享，它是 `Sync` 的。

## Send 与 Sync 的关系

两者可以用一句话总结：

| Trait           | 保证的事            | 典型场景            |
| --------------- | --------------- | --------------- |
| Send            | 所有权             | 可以转移到另一个线程      | move            | 闭包              |
| Sync            | 引用              | 可以同时存在于多个线程     | Arc<T>          | 包裹后共享           |

它们之间有一个数学关系：**如果 **`&T`** 是 **`Send`**，则 **`T`** 就是 **`Sync`。

理解这句话：`&T` 是 `Send` 意味着”这个引用可以安全地发送到另一个线程”，也就是说另一个线程拿着 `&T` 读数据不会出问题——这正好就是 `Sync` 的定义。

## 常见类型的 Send / Sync 一览

| 类型              | Send            | Sync            | 原因              |
| --------------- | --------------- | --------------- | --------------- |
| i32             | ,               | bool            | ,               | String          | ✅               | ✅               | 基本类型，无共享状态      |
| Rc<T>           | ❌               | ❌               | 引用计数非原子         |
| Arc<T>          | ✅               | ✅               | 引用计数原子操作        |
| Mutex<T>        | ✅ (T: Send)     | ✅               | OS 锁保证互斥        |
| RefCell<T>      | ✅ (T: Send)     | ❌               | 借用检查非原子         |
| *mut T          | （裸指针）           | ❌               | ❌               | 无安全保证           |


## 测验