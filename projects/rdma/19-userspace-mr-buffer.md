---
title: "用户态 Memory Region Buffer"
description: "详解用户态 MR Buffer 的分配、注册、生命周期管理及在零拷贝传输中的作用。"
date: "2026-07-19"
order: 19
tags: ["RDMA", "Memory Region", "用户态", "MR Buffer"]
---
# 用户态 Memory Region Buffer

> 注: 知乎原文403不可达，本文基于MR机制及用户态Buffer管理重构

---

在[RDMA之Memory Region](06_6. RDMA之Memory Region.md)一文中，我们介绍了MR（Memory Region）的基本概念——它是RDMA网卡可以访问的一片特殊内存区域，通过注册（Registration）将虚拟地址与物理地址绑定并锁定。本文将从用户态的视角，深入探讨MR Buffer的实现细节、管理方式以及性能优化。

## 什么是用户态MR Buffer

MR Buffer是用户态应用程序注册给RDMA网卡使用的数据缓冲区。它是RDMA数据传输中Payload的直接载体——无论是SEND操作发送的数据、RECV操作接收的数据，还是RDMA READ/WRITE操作读写的目标数据，都存放在MR Buffer中。

从用户的角度看，MR Buffer就是一块通过`ibv_reg_mr()`注册过的普通内存：

```c
void *buf = malloc(4096);
struct ibv_mr *mr = ibv_reg_mr(pd, buf, 4096, IBV_ACCESS_LOCAL_WRITE);
// 现在buf就是MR Buffer，可以被RDMA网卡访问
```

从硬件的角度看，MR Buffer是HCA的MTT（Memory Translation Table）中的一个条目，记录着虚拟地址到物理地址的映射关系和访问权限。

```
用户视角：
┌────────────────────────────────────┐
│   MR Buffer (虚拟地址空间)          │
│  ┌────────────────────────────┐   │
│  │   数据 Payload             │   │
│  │   (用户读写)               │   │
│  └────────────────────────────┘   │
└────────────────────────────────────┘

硬件视角（MTT中的条目）：
┌────────────────────────────────────┐
│  MTT Entry                         │
│  ┌────────────────────────────┐   │
│  │ Virtual Address: 0x7f...   │   │
│  │ Physical Address: 0x3f...  │   │
│  │ Length: 4096               │   │
│  │ L_Key: 0xabcd01            │   │
│  │ Permissions: LOCAL_WRITE   │   │
│  └────────────────────────────┘   │
└────────────────────────────────────┘
```

## 用户态MR Buffer的创建流程

用户态MR Buffer的创建涉及用户态库、内核驱动和硬件三方的协作，具体流程如下：

```
ibv_reg_mr() 调用流程：

┌─────────────┐
│  用户APP    │ 调用 ibv_reg_mr(pd, addr, length, access_flags)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ libibverbs  │ 调用用户态驱动的reg_mr钩子函数
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 用户态驱动  │ 组装命令，通过write()系统调用陷入内核
│ (libmlx5.so)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ ib_uverbs   │ 内核模块解析命令，调用ib_core
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ ib_core     │ 调用内核态驱动的reg_mr回调
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 内核态驱动  │ 
│ (mlx5_ib.ko)│
│ ① Pin内存   │ 锁定虚拟地址对应的物理页
│ ② 建立映射表│ 创建VA→PA映射（MTT/MPT条目）
│ ③ 通知硬件  │ 将映射表写入HCA
│ ④ 生成Key   │ 分配L_Key和R_Key
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  返回mr结构 │ ibv_mr { addr, length, lkey, rkey }
└─────────────┘
```

### Pin内存（锁定页框）

Pin内存是MR注册中最关键也最耗时的一步。内核驱动遍历用户传入的虚拟地址所覆盖的每一页，确保它们都驻留在物理内存中，然后修改页表项的标记，禁止这些页面被换出。

```c
// 内核中Pin内存的伪代码
int ib_umem_get(struct ib_umem *umem, unsigned long addr,
                size_t size, int access_flags) {
    // 计算需要锁定的页数
    unsigned long first = addr >> PAGE_SHIFT;
    unsigned long last = (addr + size - 1) >> PAGE_SHIFT;
    int npages = last - first + 1;
    
    // 逐页锁定（实际实现使用GUP - get_user_pages）
    for (i = 0; i < npages; i++) {
        struct page *page;
        get_user_pages(addr + i * PAGE_SIZE, 1, &page);
        umem->pages[i] = page;
        SetPageDma(page);  // 标记为DMA页面
    }
    
    // 建立物理地址列表（用于MTT）
    build_pa_list(umem);
}
```

### 建立MTT/MPT映射

锁定内存后，驱动需要：

1. **构建MTT（Memory Translation Table）**：记录每段虚拟地址对应的物理地址
2. **构建MPT（Memory Protection Table）**：记录L_Key、R_Key和访问权限

MTT和MPT通常存放在系统内存中，HCA内部有缓存来加速访问。

```
MTT在内存中的结构：
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Entry 0 │  Entry 1 │  Entry 2 │  Entry 3 │  ...     │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ VA0→PA0  │ VA1→PA1 │ VA2→PA2 │ VA3→PA3 │          │
│ LEN=4K   │ LEN=4K   │ LEN=4K   │ LEN=4K   │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
         ↑
    MTT基地址（存入HCA寄存器）

MPT在内存中的结构：
┌──────────┬──────────┬──────────┬──────────┐
│  Entry 0 │  Entry 1 │  Entry 2 │  ...     │
├──────────┼──────────┼──────────┼──────────┤
│ L_Key=1  │ L_Key=2  │ L_Key=3  │          │
│ R_Key=1  │ R_Key=2  │ R_Key=3  │          │
│ Perm=RW  │ Perm=R   │ Perm=RW  │          │
│ MTT_idx=0│ MTT_idx=1│ MTT_idx=2│          │
└──────────┴──────────┴──────────┴──────────┘
```

## MR Buffer的内部结构

### 内存布局

一个MR Buffer在物理内存中可能是由多个不连续的物理页组成的（因为系统内存分配的特点），但在虚拟地址空间中必须是连续的。

```
虚拟地址空间（连续）：
┌──────────┬──────────┬──────────┬──────────┐
│  页 0    │  页 1    │  页 2    │  页 3    │
│ VA=A000  │ VA=A001  │ VA=A002  │ VA=A003  │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
物理地址空间（可能不连续）：
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 页框 0x3F│ │ 页框 0x8A│ │ 页框 0x12│ │ 页框 0x45│
│ PA=3F000  │ │ PA=8A000 │ │ PA=12000 │ │ PA=45000 │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### ibv_mr结构体

用户态通过`ibv_mr`结构体来引用一个MR Buffer：

```c
struct ibv_mr {
    struct ibv_context *context;  // 所属设备上下文
    struct ibv_pd     *pd;        // 所属保护域
    void              *addr;      // Buffer起始地址（虚拟地址）
    size_t             length;    // Buffer长度
    uint32_t           lkey;      // Local Key
    uint32_t           rkey;      // Remote Key
    int                access;    // 访问权限标志
};
```

其中`addr`和`length`字段就是MR Buffer的虚拟地址和长度，用户在后续的SGE中引用数据缓冲区时，需要确保地址落在这个范围内。

## 用户态MR Buffer的管理策略

### 策略一：每次通信时注册/注销

最简单的策略：每次需要发送或接收数据时，临时注册MR，使用完后立即注销。

```c
void send_data(struct ibv_pd *pd, struct ibv_qp *qp, void *buf, size_t len) {
    // 每次发送前注册
    struct ibv_mr *mr = ibv_reg_mr(pd, buf, len, IBV_ACCESS_LOCAL_WRITE);
    
    // 构造SGE，使用mr->lkey
    struct ibv_sge sge = { .addr = buf, .length = len, .lkey = mr->lkey };
    struct ibv_send_wr wr = { ... };
    ibv_post_send(qp, &wr, NULL);
    
    // 发送完成后注销
    ibv_dereg_mr(mr);
}
```

**优点**：简单直接，不需要额外的管理逻辑。

**缺点**：
- 每次ibv_reg_mr()都需要陷入内核态，延迟高
- 频繁的Pin/Unpin操作增加系统负担
- 总体吞吐量低

### 策略二：预注册（Pre-registration）

在初始化阶段预先注册好一块大的MR Buffer，然后在运行时重复使用这块缓冲区。

```c
// 初始化阶段：注册一个大Buffer
void *pool = malloc(POOL_SIZE);
struct ibv_mr *pool_mr = ibv_reg_mr(pd, pool, POOL_SIZE,
    IBV_ACCESS_LOCAL_WRITE | IBV_ACCESS_REMOTE_WRITE);

// 运行时：直接从pool中分配子区域，使用相同的lkey
void *sub_buf = pool + offset;  // 在pool范围内
struct ibv_sge sge = {
    .addr = sub_buf,
    .length = data_len,
    .lkey = pool_mr->lkey       // 使用预注册的lkey
};

// 清理阶段：统一注销
ibv_dereg_mr(pool_mr);
free(pool);
```

**优点**：
- 仅需一次内核陷入
- 运行时开销极小
- 适用于对性能敏感的场景

**缺点**：
- 需要预先规划内存大小
- 内存利用率可能不高（需要预留余量）

### 策略三：内存池（Memory Pool）

结合策略一和策略二的优点，实现一个MR Buffer池：

```c
struct mr_pool {
    struct ibv_pd *pd;
    struct list_head free_list;  // 空闲MR链表
    struct list_head used_list;  // 使用中MR链表
    size_t mr_size;              // 每个MR的大小
    int total_count;             // 总MR数量
};

// 从池中获取一个MR
struct ibv_mr *mr_pool_get(struct mr_pool *pool) {
    if (list_empty(&pool->free_list)) {
        // 池为空，分配新的MR
        void *buf = aligned_alloc(4096, pool->mr_size);
        struct ibv_mr *mr = ibv_reg_mr(pool->pd, buf, pool->mr_size,
            IBV_ACCESS_LOCAL_WRITE);
        return mr;
    }
    // 从空闲链表中取一个
    return list_first_entry(&pool->free_list, struct ibv_mr, list);
}

// 使用完后归还
void mr_pool_put(struct mr_pool *pool, struct ibv_mr *mr) {
    list_add_tail(&mr->list, &pool->free_list);
}
```

**优点**：
- 平衡了性能和内存利用率
- 可以动态扩容

**缺点**：
- 实现复杂度较高
- 需要根据业务特征调整池大小

## VA-PA地址转换过程详解

当HCA处理WQE时，需要将WQE中指定的虚拟地址转换为物理地址才能进行DMA操作。以下是完整的转换流程：

### Step 1：解析WQE获取VA

HCA从SQ Buffer中读取WQE，解析出SGE中的虚拟地址和L_Key：

```
WQE中的SGE内容：
┌────────────────────────────────────┐
│  VA:      0x7f1234567800           │
│  Length:  4096                     │
│  L_Key:   0x00abcd01               │
└────────────────────────────────────┘
```

### Step 2：通过L_Key查找MPT

HCA使用L_Key中的24位Index字段在MPT中查找对应的条目：

```
L_Key = 0x00abcd01
              │
              ▼
Index = 0x00abcd (高24位) → MPT[0x00abcd]
                              ┌────────────────┐
                              │  L_Key: 0x01   │
                              │  Permissions   │
                              │  MTT Index: 5  │
                              └────────────────┘
```

### Step 3：验证权限

HCA检查请求的操作是否在MPT记录的权限范围内。例如，如果请求是RDMA WRITE操作，但MPT中只配置了LOCAL_READ权限，HCA将拒绝这次访问并生成错误CQE。

### Step 4：通过MTT进行地址转换

HCA使用MPT中记录的MTT索引，找到对应的MTT条目，进行VA到PA的转换：

```
MTT[5]：
┌──────────────────────────────────┐
│  Virtual Page: 0x7f1234567000   │
│  Physical Page: 0x00000003f000  │
│  Page Size: 4096                │
└────────────┬─────────────────────┘
             │
             ▼
PA = Physical Page + (VA - Virtual Page)
   = 0x3f000 + (0x7f1234567800 - 0x7f1234567000)
   = 0x3f000 + 0x800
   = 0x3f800
```

### Step 5：执行DMA操作

得到物理地址后，HCA通过PCIe总线发起DMA读写操作：

```
HCA ─── PCIe ───▶ 内存控制器 ───▶ 物理内存 0x3f800
```

## 用户态MR Buffer的生命周期

### 创建

```
分配内存 → 注册MR → 验证可用性 → 加入管理
```

### 使用

```
构造SGE引用MR → 下发WR → 硬件DMA访问 → 完成
```

### 修改

MR创建后，不能直接修改其属性。如果需要更改大小或权限，必须：

1. 注销原MR（ibv_dereg_mr）
2. 重新注册新MR（ibv_reg_mr）

这被称为"重新注册"（Re-registration），在某些Verbs实现中提供了`ibv_rereg_mr()`接口来简化这一过程：

```c
// 修改MR的权限（增加远端写权限）
int new_flags = IBV_ACCESS_LOCAL_WRITE | IBV_ACCESS_REMOTE_WRITE;
ibv_rereg_mr(mr, IBV_REREG_MR_CHANGE_ACCESS, pd, NULL, 0, new_flags);
```

### 销毁

```
从管理结构中移除 → 注销MR → 释放内存
```

## 性能优化

### 使用大页（Huge Pages）

使用2MB或1GB的大页可以减少：
- 页表项数量（减少TLB缺失）
- MTT条目数量（减少HCA内部缓存压力）
- Pin内存的系统调用开销

```c
// 使用2MB大页分配MR Buffer
#include <sys/mman.h>

void *buf = mmap(NULL, 2 * 1024 * 1024,
                 PROT_READ | PROT_WRITE,
                 MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB,
                 -1, 0);
struct ibv_mr *mr = ibv_reg_mr(pd, buf, 2*1024*1024, flags);
```

### 对齐

确保MR Buffer的起始地址和大小都是页对齐的，避免注册时扩展到额外的页面：

```c
void *buf;
// 页对齐分配
posix_memalign(&buf, 4096, size);
// 或者
buf = mmap(NULL, size, PROT_READ|PROT_WRITE,
           MAP_PRIVATE|MAP_ANONYMOUS, -1, 0);
```

### 批量注册

如果需要注册多个MR，可以尝试合并为一个大的MR来减少注册次数：

```c
// 不推荐：多次注册小MR
for (int i = 0; i < N; i++) {
    ibv_reg_mr(pd, small_bufs[i], SMALL_SIZE, flags);
}

// 推荐：一次注册大MR
void *big_buf = malloc(N * SMALL_SIZE);
struct ibv_mr *big_mr = ibv_reg_mr(pd, big_buf, N * SMALL_SIZE, flags);
// 然后在big_buf范围内偏移使用
```

### 延迟注销

在高频通信场景中，复用MR Buffer比频繁创建和注销更高效。通过引用计数或池化技术，延迟MR的注销时机：

```c
struct mr_refcount {
    struct ibv_mr *mr;
    atomic_t refcount;
};

void mr_get(struct mr_refcount *mrr) {
    atomic_inc(&mrr->refcount);
}

void mr_put(struct mr_refcount *mrr) {
    if (atomic_dec_and_test(&mrr->refcount)) {
        ibv_dereg_mr(mrr->mr);
        free(mrr);
    }
}
```

## 用户态MR Buffer与内核态MR Buffer

| 特性 | 用户态MR Buffer | 内核态MR Buffer |
|------|----------------|-----------------|
| 注册API | ibv_reg_mr() | ib_alloc_mr() |
| 内存来源 | 用户进程内存 | 内核内存 |
| Pin机制 | get_user_pages() | 直接使用内核页 |
| 访问权限 | 受限的进程权限 | 完全的内核权限 |
| 使用场景 | 应用程序数据 | 内核模块（如NVMe-of） |

用户态MR Buffer是RDMA应用最常用的方式，因为RDMA的核心优势就是用户态直接访问硬件、绕过内核。内核态MR Buffer主要用于在内核中实现的RDMA服务，如NVMe-over-Fabrics目标端。

## 常见问题与调试

### MR泄漏

如果频繁注册MR但不注销，会导致：
- 物理内存被大量Pin住，系统可用内存减少
- MTT/MPT空间耗尽，无法创建新的MR

可以通过以下方式监控MR使用情况：

```bash
# 查看系统中的MR数量和信息
cat /sys/kernel/debug/rdma/system/mr

# 或者使用rdma工具
rdma resource show mr
```

### 注册失败

MR注册失败的可能原因：
- 物理内存不足（无法Pin住所有页面）
- 超过设备支持的最大MR数量
- MTT空间不足

### 性能排查

如果发现RDMA性能不佳，可以检查MR相关的配置：

```bash
# 检查是否启用了大页
cat /proc/meminfo | grep HugePages

# 检查当前MR数量
rdma resource show mr | wc -l
```

## 总结

用户态MR Buffer是RDMA数据传输的核心载体。本文从MR Buffer的概念出发，详细介绍了其创建流程（包括Pin内存、建立MTT/MPT映射）、VA-PA地址转换的完整过程、用户态管理策略（预注册、内存池）以及各种性能优化方法。

深入理解MR Buffer的内部机制，对于编写高效的RDMA应用、诊断性能问题以及优化内存使用都至关重要。在实际开发中，建议根据业务场景选择合适的MR管理策略——对延迟敏感的应用优先考虑预注册和内存池，对内存敏感的应用则需要在注册频率和内存利用率之间找到平衡。

## IB规范相关章节

- 3.5.3 Memory Keys
- 10.6.2 Memory Region
- 10.6.3 Memory Key的使用规则
- 11.2.4 注册MR的Verbs接口

## 参考文档

1. IB Specification Vol 1-Release-1.4
2. RDMA Aware Networks Programming User Manual Rev 1.7
3. Linux内核RDMA子系统: drivers/infiniband/core/umem.c
4. Mellanox OFED for Linux User Manual
