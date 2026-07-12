import re
import os
from pathlib import Path

TARGET_DIR = Path(r"D:\00 Work\fonstone\fonstone.github.io\projects\rust-os")

# Fix descriptions to be meaningful lesson descriptions instead of "ch_title - title"
CHAPTER_TITLES = {
    "ch01-00-index": ("前言", "RTOS 学习路线与教程概览"),
    "ch01-01-architecture": ("项目概述与架构设计", "Cortex-R52 目标平台与 RTOS 五层架构设计"),
    "ch02-00-index": ("开发环境搭建", "Rust 交叉编译工具链与 QEMU 环境配置"),
    "ch02-01-project-setup": ("创建项目骨架", "Cargo 项目初始化与 no_std 裸机程序基础"),
    "ch03-00-index": ("最小裸机启动概述", "从零启动到 Rust main 函数的完整流程"),
    "ch03-01-memory-layout": ("内存布局与链接脚本", "mps3-an536 内存地图与 Linker Script 编写"),
    "ch03-02-reset-handler": ("汇编入口与 Rust no_std 程序", "Reset Handler 汇编、栈初始化与 Rust 入口"),
    "ch04-00-index": ("串口输出与调试宏", "CMSDK APB UART 驱动与 println! 调试宏实现"),
    "ch05-00-index": ("异常与中断体系", "ARM 异常模型、向量表与中断处理流程"),
    "ch05-01-exception-handlers": ("ARM 异常处理机制与 handler 实现", "汇编异常向量表与 Rust 异常处理函数编写"),
    "ch05-02-gic-setup": ("GIC 中断控制器与定时器中断", "GICv2 初始化与 FIQ 定时器中断配置"),
    "ch06-00-index": ("系统定时器", "SP804 定时器驱动与 tick 中断实现"),
    "ch07-00-index": ("上下文切换", "多任务核心机制：TCB、栈帧与 context_switch"),
    "ch07-01-task-control-block": ("任务控制块设计", "Task 结构体、任务栈与初始帧构造"),
    "ch07-02-context-save-restore": ("上下文保存与恢复实现", "context_switch 汇编实现与首次启动"),
    "ch08-00-index": ("调度器设计", "抢占式调度器核心设计与优先级管理"),
    "ch08-01-ready-queue": ("就绪队列与调度器核心", "优先级位图、就绪队列与 round-robin 调度"),
    "ch08-02-preemption": ("FIQ 真抢占实现", "基于 FIQ 定时器中断的抢占式调度"),
    "ch09-00-index": ("同步原语与临界区", "自旋锁、互斥量与信号量的设计与实现"),
    "ch09-01-spinlock": ("自旋锁", "AtomicBool 自旋锁与关中断变体实现"),
    "ch09-02-mutex": ("互斥量", "基于任务阻塞/唤醒机制的互斥量实现"),
    "ch09-03-semaphore": ("信号量", "计数信号量与生产者-消费者问题"),
    "ch10-00-index": ("进程间通信", "共享内存、SPSC 环形缓冲区与消息队列"),
    "ch10-01-shared-memory": ("共享内存", "AtomicBool 自旋锁保护与 SPSC 无锁环形缓冲区"),
    "ch10-02-message-queue": ("消息队列实现", "结构化消息传递与阻塞发送/接收队列"),
}

for fpath in sorted(TARGET_DIR.glob("*.md")):
    raw = fpath.read_text(encoding="utf-8")
    
    # Fix description
    for prefix, (_, new_desc) in CHAPTER_TITLES.items():
        if fpath.stem == prefix:
            raw = re.sub(r'^description: ".*"', f'description: "{new_desc}"', raw, count=1, flags=re.MULTILINE)
            break
    
    fpath.write_text(raw, encoding="utf-8")
    print(f"  Updated: {fpath.name}")

# Now add Mermaid diagrams to key chapters

DIAGRAMS = {
    "ch01-01-architecture.md": """

## 系统架构图

<MermaidDiagram>
graph TB
    subgraph "应用层"
        T1[用户任务 A]
        T2[用户任务 B]
        T3[空闲任务]
    end
    subgraph "IPC 层"
        SM[共享内存]
        RB[SPSC 环形缓冲区]
        MQ[消息队列]
    end
    subgraph "同步原语层"
        SL[自旋锁]
        MT[互斥量]
        SP[信号量]
    end
    subgraph "调度器层"
        SCHED[调度器]
        RQ[就绪队列]
        TC[任务控制块]
    end
    subgraph "硬件驱动层"
        UART[UART 驱动]
        GIC[GIC 中断控制器]
        TIM[SP804 定时器]
    end
    subgraph "启动层"
        VEC[异常向量表]
        RST[Reset Handler]
        FIQ[FIQ Handler]
    end
    T1 --> SM
    T2 --> RB
    T3 --> MQ
    SM --> SL
    RB --> MT
    MQ --> SP
    SL --> SCHED
    MT --> SCHED
    SP --> SCHED
    SCHED --> RQ
    SCHED --> TC
    SCHED --> UART
    SCHED --> GIC
    SCHED --> TIM
    RQ --> VEC
    TC --> RST
    UART --> VEC
    GIC --> FIQ
    TIM --> FIQ
</MermaidDiagram>

""",

    "ch03-01-memory-layout.md": """

## mps3-an536 内存布局图

<MermaidDiagram>
graph LR
    subgraph "0x00000000 - Flash (ATCM) 32KB"
        VEC[异常向量表<br/>0x00000000]
        TEXT[.text 代码段]
        RODATA[.rodata 常量]
    end
    subgraph "0x10000000 - RAM (BRAM) 512KB"
        DATA[.data 已初始化数据]
        BSS[.bss 零初始化数据]
        STACK[栈空间<br/>向下增长]
        HEAP[堆空间]
    end
    subgraph "外设"
        UART_P[UART 0xe7c00000]
        TIMER_P[SP804 Timer 0x58000000]
        GIC_P[GICv3]
    end
    Flash -->|启动后拷贝| RAM
</MermaidDiagram>

""",

    "ch07-02-context-save-restore.md": """

## 上下文切换流程

<MermaidDiagram>
sequenceDiagram
    participant TaskA as 任务 A
    participant Kernel as context_switch
    participant TaskB as 任务 B

    Note over TaskA: 正在执行
    TaskA->>Kernel: SVC 异常 / 定时器中断
    Kernel->>Kernel: PUSH {r4-r12, lr}  <br/>保存当前寄存器到 A 的 TCB 栈帧
    Kernel->>Kernel: 切换 sp 指向 B 的 TCB 栈帧
    Kernel->>Kernel: POP {r4-r12, lr}   <br/>从 B 的 TCB 栈帧恢复寄存器
    Kernel->>TaskB: 返回（LR 指向 B 的执行位置）
    Note over TaskB: Task B 继续执行
    TaskB->>Kernel: 下一次中断 / 主动让出
    Kernel->>TaskA: 恢复 A 的上下文
</MermaidDiagram>

""",

    "ch04-00-index.md": """

## UART 寄存器布局

<MermaidDiagram>
graph LR
    subgraph "CMSDK APB UART 寄存器"
        DATA[+0x00 DATA<br/>读/写数据]
        STATE[+0x04 STATE<br/>bit1: TX 满标志]
        CTRL[+0x08 CTRL<br/>bit0: TX 使能]
    end
    CPU -->|写入字符| DATA
    DATA -->|状态查询| STATE
    CPU -->|初始化| CTRL
</MermaidDiagram>

""",

    "ch08-01-ready-queue.md": """

## 就绪队列与优先级调度

<MermaidDiagram>
graph TD
    subgraph "优先级位图"
        P0[优先级 0<br/>最高]
        P1[优先级 1]
        P2[优先级 2]
        P3[优先级 3]
        P4[...]
    end

    subgraph "就绪队列"
        Q0[Task_A → Task_B]
        Q1[Task_C]
        Q2[(空)]
        Q3[Task_D → Task_E]
    end

    P0 --> Q0
    P1 --> Q1
    P2 --> Q2
    P3 --> Q3
    P4 --> Q4
</MermaidDiagram>

""",

    "ch09-01-spinlock.md": """

## 自旋锁工作原理

<MermaidDiagram>
sequenceDiagram
    participant CPU1 as CPU 核心 1
    participant Lock as 自旋锁 (AtomicBool)
    participant CPU2 as CPU 核心 2

    CPU1->>Lock: swap(true, Acquire)
    Lock-->>CPU1: false (未锁定)
    Note over CPU1: 获得锁，进入临界区
    CPU2->>Lock: swap(true, Acquire)
    Lock-->>CPU2: true (已锁定)
    Note over CPU2: 自旋等待...
    CPU1->>Lock: store(false, Release)
    Note over CPU1: 释放锁
    CPU2->>Lock: swap(true, Acquire)
    Lock-->>CPU2: false (已解锁)
    Note over CPU2: 获得锁，进入临界区
</MermaidDiagram>

""",

    "ch10-00-index.md": """

## IPC 通信方式对比

<MermaidDiagram>
graph LR
    subgraph "共享内存"
        T1A[Task A] -->|写入| SHM[全局 static 变量<br/>+ 自旋锁保护]
        SHM -->|读取| T2A[Task B]
    end
    subgraph "SPSC 环形缓冲区"
        T1B[Producer] -->|push| RB[无锁环形缓冲区<br/>单生产者单消费者]
        RB -->|pop| T2B[Consumer]
    end
    subgraph "消息队列"
        T1C[发送者] -->|send| MQ[消息队列<br/>携带类型+数据]
        MQ -->|recv| T2C[接收者]
    end
</MermaidDiagram>

""",
}

for fname, diagram in DIAGRAMS.items():
    fpath = TARGET_DIR / fname
    if not fpath.exists():
        continue
    raw = fpath.read_text(encoding="utf-8")
    body_start = raw.index("---\n", raw.index("---\n") + 4) + 4
    body = raw[body_start:]
    
    # Insert after first heading (typically after the first H1)
    first_h1 = re.search(r'^# ', body, re.MULTILINE)
    if first_h1:
        insert_pos = first_h1.end()
        # Find end of line for first H1
        eol = body.index("\n", insert_pos)
        new_body = body[:eol+1] + diagram + body[eol+1:]
        new_raw = raw[:body_start] + new_body
        fpath.write_text(new_raw, encoding="utf-8")
        print(f"  Added diagram: {fname}")
    else:
        print(f"  SKIP (no H1): {fname}")

print("\nDone!")
