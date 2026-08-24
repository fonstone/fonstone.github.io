---
title: "在内核中接入 easy-fs"
description: "上节实现了 easy-fs 文件系统，并能在用户态来进行测试，但还没有放入到内核中来。本节我们介绍如何将 easy-fs 文件系统接入内核中从而在内核中支持常规文件和目录。为此，在操作系统内核中需要有对接 easy-fs..."
date: "2026-07-12"
order: 87
tags: ["easy-fs", "内核", "系统调用", "文件", "接入"]
est_time: "45分钟"
---
## 本节导读

上节实现了 easy-fs 文件系统，并能在用户态来进行测试，但还没有放入到内核中来。本节我们介绍如何将 easy-fs 文件系统接入内核中从而在内核中支持常规文件和目录。为此，在操作系统内核中需要有对接 easy-fs 文件系统的各种结构，它们自下而上可以分成这样几个层次：

- 块设备驱动层：针对内核所要运行在的 qemu 或 k210 平台，我们需要将平台上的块设备驱动起来并实现 easy-fs 所需的 BlockDevice Trait ，这样 easy-fs 才能将该块设备用作 easy-fs 镜像的载体。
- easy-fs 层：我们在上一节已经介绍了 easy-fs 文件系统内部的层次划分。这里是站在内核的角度，只需知道它接受一个块设备 BlockDevice ，并可以在上面打开文件系统 EasyFileSystem ，进而获取 Inode 核心数据结构，进行各种文件系统操作即可。
- 内核索引节点层：在内核中需要将 easy-fs 提供的 Inode 进一步封装成 OSInode ，以表示进程中一个打开的常规文件。由于有很多种不同的打开方式，因此在 OSInode 中要维护一些额外的信息。
- 文件描述符层：常规文件对应的 OSInode 是文件的内核内部表示，因此需要为它实现 File Trait 从而能够可以将它放入到进程文件描述符表中并通过 sys\_read/write 系统调用进行读写。
- 系统调用层：由于引入了常规文件这种文件类型，导致一些系统调用以及相关的内核机制需要进行一定的修改。

## 文件简介

应用程序看到并被操作系统管理的 **文件** (File) 就是一系列的字节组合。操作系统不关心文件内容，只关心如何对文件按字节流进行读写的机制，这就意味着任何程序可以读写任何文件（即字节流），对文件具体内容的解析是应用程序的任务，操作系统对此不做任何干涉。例如，一个Rust编译器可以读取一个C语言源程序并进行编译，操作系统并并不会阻止这样的事情发生。

有了文件这样的抽象后，操作系统内核就可把能读写并持久存储的数据按文件来进行管理，并把文件分配给进程，让进程以很简洁的统一抽象接口 File 来读写数据：

```
// os/src/fs/mod.rs

pub trait File : Send + Sync {
    fn read(&self, buf: UserBuffer) -> usize;
    fn write(&self, buf: UserBuffer) -> usize;
}
```

这个接口在内存和存储设备之间建立了数据交换的通道。其中 UserBuffer 是我们在 mm 子模块中定义的应用地址空间中的一段缓冲区（即内存）的抽象。它的具体实现在本质上其实只是一个 &[u8] ，位于应用地址空间中，内核无法直接通过用户地址空间的虚拟地址来访问，因此需要进行封装。然而，在理解抽象接口 File 的各方法时，我们仍可以将 UserBuffer 看成一个 &[u8] 切片，它是一个同时给出了缓冲区起始地址和长度的胖指针。

read 指的是从文件中读取数据放到缓冲区中，最多将缓冲区填满（即读取缓冲区的长度那么多字节），并返回实际读取的字节数；而 write 指的是将缓冲区中的数据写入文件，最多将缓冲区中的数据全部写入，并返回直接写入的字节数。至于 read 和 write 的实现则与文件具体是哪种类型有关，它决定了数据如何被读取和写入。

回过头来再看一下用户缓冲区的抽象 UserBuffer ，它的声明如下：

```
// os/src/mm/page_table.rs

pub fn translated_byte_buffer(
    token: usize,
    ptr: *const u8,
    len: usize
) -> Vec<&'static mut [u8]>;

pub struct UserBuffer {
    pub buffers: Vec<&'static mut [u8]>,
}

impl UserBuffer {
    pub fn new(buffers: Vec<&'static mut [u8]>) -> Self {
        Self { buffers }
    }
    pub fn len(&self) -> usize {
        let mut total: usize = 0;
        for b in self.buffers.iter() {
            total += b.len();
        }
        total
    }
}
```

它只是将我们调用 translated\_byte\_buffer 获得的包含多个切片的 Vec 进一步包装起来，通过 len 方法可以得到缓冲区的长度。此外，我们还让它作为一个迭代器可以逐字节进行读写。有兴趣的同学可以参考类型 UserBufferIterator 还有 IntoIterator 和 Iterator 两个 Trait 的使用方法。

## 块设备驱动层

在 drivers 子模块中的 block/mod.rs 中，我们可以找到内核访问的块设备实例 BLOCK\_DEVICE ：

```
// os/drivers/block/mod.rs

#[cfg(feature = "board_qemu")]
type BlockDeviceImpl = virtio_blk::VirtIOBlock;

#[cfg(feature = "board_k210")]
type BlockDeviceImpl = sdcard::SDCardWrapper;

lazy_static! {
    pub static ref BLOCK_DEVICE: Arc<dyn BlockDevice> = Arc::new(BlockDeviceImpl::new());
}
```

qemu 和 k210 平台上的块设备是不同的。在 qemu 上，我们使用 VirtIOBlock 访问 VirtIO 块设备；而在 k210 上，我们使用 SDCardWrapper 来访问插入 k210 开发板上真实的 microSD 卡，它们都实现了 easy-fs 要求的 BlockDevice Trait 。通过 #[cfg(feature)] 可以在编译的时候根据编译参数调整 BlockDeviceImpl 具体为哪个块设备，之后将它全局实例化为 BLOCK\_DEVICE ，使得内核的其他模块可以访问。

### Qemu 模拟器平台

在启动 Qemu 模拟器的时候，我们可以配置参数来添加一块 VirtIO 块设备：

```
# os/Makefile

FS_IMG := ../user/target/$(TARGET)/$(MODE)/fs.img

run-inner: build
ifeq ($(BOARD),qemu)
    @qemu-system-riscv64 \
        -machine virt \
        -nographic \
        -bios $(BOOTLOADER) \
        -device loader,file=$(KERNEL_BIN),addr=$(KERNEL_ENTRY_PA) \
        -drive file=$(FS_IMG),if=none,format=raw,id=x0 \
        -device virtio-blk-device,drive=x0,bus=virtio-mmio-bus.0
```

- 第 12 行，我们为虚拟机添加一块虚拟硬盘，内容为我们之前通过 easy-fs-fuse 工具打包的包含应用 ELF 的 easy-fs 镜像，并命名为 x0 。
- 第 13 行，我们将硬盘 x0 作为一个 VirtIO 总线中的一个块设备接入到虚拟机系统中。 virtio-mmio-bus.0 表示 VirtIO 总线通过 MMIO 进行控制，且该块设备在总线中的编号为 0 。

**内存映射 I/O** (MMIO, Memory-Mapped I/O) 指的是外设的设备寄存器可以通过特定的物理内存地址来访问，每个外设的设备寄存器都分布在没有交集的一个或数个物理地址区间中，不同外设的设备寄存器所占的物理地址空间也不会产生交集，且这些外设物理地址区间也不会和RAM的物理内存所在的区间存在交集（注：在后续的外设相关章节有更深入的讲解）。从Qemu for RISC-V 64 平台的 [源码](https://github.com/qemu/qemu/blob/f1dd640896ee2b50cb34328f2568aad324702954/hw/riscv/virt.c#L83) 中可以找到 VirtIO 外设总线的 MMIO 物理地址区间为从 0x10001000 开头的 4KiB 。为了能够在内核中访问 VirtIO 外设总线，我们就必须在内核地址空间中对特定内存区域提前进行映射：

```
// os/src/config.rs

#[cfg(feature = "board_qemu")]
pub const MMIO: &[(usize, usize)] = &[
    (0x10001000, 0x1000),
];
```

如上面一段代码所示，在 config 子模块中我们硬编码 Qemu 上的 VirtIO 总线的 MMIO 地址区间（起始地址，长度）。在创建内核地址空间的时候需要建立页表映射：

```
// os/src/mm/memory_set.rs

use crate::config::MMIO;

impl MemorySet {
    /// Without kernel stacks.
    pub fn new_kernel() -> Self {
        ...
        println!("mapping memory-mapped registers");
        for pair in MMIO {
            memory_set.push(MapArea::new(
                (*pair).0.into(),
                ((*pair).0 + (*pair).1).into(),
                MapType::Identical,
                MapPermission::R | MapPermission::W,
            ), None);
        }
        memory_set
    }
}
```

这里我们进行的是透明的恒等映射，从而让内核可以兼容于直接访问物理地址的设备驱动库。

由于设备驱动的开发过程比较琐碎，我们这里直接使用已有的 [virtio-drivers](https://github.com/rcore-os/virtio-drivers) crate ，它已经支持 VirtIO 总线架构下的块设备、网络设备、GPU 等设备。注：关于VirtIO 相关驱动的内容，在后续的外设相关章节有更深入的讲解。

```
// virtio-drivers/src/blk.rs
pub struct VirtIOBlk<'a, H: Hal> {
    header: &'static mut VirtIOHeader,
    queue: VirtQueue<'a, H>,
    capacity: usize,
}

// os/src/drivers/block/virtio_blk.rs
use virtio_drivers::{Hal, VirtIOBlk, VirtIOHeader};
const VIRTIO0: usize = 0x10001000;

pub struct VirtIOBlock(UPSafeCell<VirtIOBlk<'static, VirtioHal>>);

impl VirtIOBlock {
    pub fn new() -> Self {
        unsafe {
            Self(UPSafeCell::new(
                VirtIOBlk::<VirtioHal>::new(&mut *(VIRTIO0 as *mut VirtIOHeader)).unwrap(),
            ))
        }
    }
}

impl BlockDevice for VirtIOBlock {
    fn read_block(&self, block_id: usize, buf: &mut [u8]) {
        self.0
            .exclusive_access()
            .read_block(block_id, buf)
            .expect("Error when reading VirtIOBlk");
    }
    fn write_block(&self, block_id: usize, buf: &[u8]) {
        self.0
            .exclusive_access()
            .write_block(block_id, buf)
            .expect("Error when writing VirtIOBlk");
    }
}
```

virtio-drivers crate 提供的 VirtIO 块设备抽象是 VirtIOBlk<'a, H: Hal> 。其中 header 指向 MMIO 方式访问 VirtIO 设备所需的一组设备寄存器， queue 管理用于提交请求和接收响应的 VirtQueue ，而泛型参数 H 则代表由使用者提供的平台适配层。驱动库需要分配设备可读写的内存，并在物理地址和内核可访问的虚拟地址之间进行转换，但它自身并不负责内存管理；这些能力需要由负责内存管理的操作系统提供。具体来说，OS 会提供一个实现了 Hal Trait 的类型，并通过该类型的方法把这些能力交给 virtio-drivers 使用。

在 OS 中，我们将 VirtIOBlk<'static, VirtioHal> 包装为自己的 VirtIOBlock ，实质上是在外层加上一层 UPSafeCell ，使得内核可以通过独占访问来调用底层块设备驱动。初始化时， VirtIOBlk::new 需要传入 &mut VirtIOHeader ，因此我们从 qemu-system-riscv64 平台上的 Virtio MMIO 区间左端 VIRTIO0 开始转化出这个参数。这里指定的 VirtioHal 就是 OS 提供给 virtio-drivers 的平台适配层，它的实现接下来介绍。

最后，我们让 VirtIOBlock 实现 easy-fs 需要的 BlockDevice Trait 。 read\_block/write\_block 只是先取得内部 VirtIOBlk 的独占访问权，再把块读写请求转发给底层驱动。

接下来看看 OS 侧的 VirtioHal 需要为 virtio-drivers 提供哪些能力。VirtIO 设备需要占用部分内存作为一个公共区域从而更好的和 CPU 进行合作。这就像 MMU 需要在内存中保存多级页表才能和 CPU 共同实现分页机制一样。在 VirtIO 架构下，需要在公共区域中放置一种叫做 VirtQueue 的环形队列，CPU 可以向此环形队列中向 VirtIO 设备提交请求，也可以从队列中取得请求的结果，详情可以参考 [virtio 文档](https://docs.oasis-open.org/virtio/virtio/v1.1/csprd01/virtio-v1.1-csprd01.pdf) 。对于 VirtQueue 的使用涉及到设备需要读写的连续物理内存的分配和回收，以及物理地址和内核虚拟地址之间的转换，但这些能力并不在 VirtIO 驱动 virtio-drivers 的职责范围之内，因此它要求库的使用者提供一个实现了 Hal Trait 的类型：

```
// os/src/drivers/block/virtio_blk.rs

pub struct VirtioHal;

impl Hal for VirtioHal {
    fn dma_alloc(pages: usize) -> usize { ... }
    fn dma_dealloc(pa: usize, pages: usize) -> i32 { ... }
    fn phys_to_virt(addr: usize) -> usize { ... }
    fn virt_to_phys(vaddr: usize) -> usize { ... }
}
```

由于我们已经实现了基于分页内存管理的地址空间，实现这些功能自然不在话下：

```
// os/src/drivers/block/virtio_blk.rs

lazy_static! {
    static ref QUEUE_FRAMES: UPSafeCell<Vec<FrameTracker>> = unsafe {
        UPSafeCell::new(Vec::new())
    };
}

impl Hal for VirtioHal {
    fn dma_alloc(pages: usize) -> usize {
        let mut ppn_base = PhysPageNum(0);
        for i in 0..pages {
            let frame = frame_alloc().unwrap();
            if i == 0 {
                ppn_base = frame.ppn;
            }
            assert_eq!(frame.ppn.0, ppn_base.0 + i);
            QUEUE_FRAMES.exclusive_access().push(frame);
        }
        let pa: PhysAddr = ppn_base.into();
        pa.0
    }

    fn dma_dealloc(pa: usize, pages: usize) -> i32 {
        let pa = PhysAddr::from(pa);
        let mut ppn_base: PhysPageNum = pa.into();
        for _ in 0..pages {
            frame_dealloc(ppn_base);
            ppn_base.step();
        }
        0
    }

    fn phys_to_virt(addr: usize) -> usize {
        addr
    }

    fn virt_to_phys(vaddr: usize) -> usize {
        PageTable::from_token(kernel_token())
            .translate_va(VirtAddr::from(vaddr))
            .unwrap()
            .0
    }
}
```

这里有一些细节需要注意：

- dma\_alloc/dealloc 需要分配/回收数个 *连续* 的物理页帧，而我们的 frame\_alloc 是逐个分配，严格来说并不保证分配的连续性。幸运的是，这个过程只会发生在内核初始化阶段，因此能够保证连续性。
- 在 dma\_alloc 中通过 frame\_alloc 得到的那些物理页帧 FrameTracker 都会被保存在全局的向量 QUEUE\_FRAMES 以延长它们的生命周期，避免提前被回收。
- phys\_to\_virt/virt\_to\_phys 负责在物理地址和内核可访问的虚拟地址之间转换。这里内核对设备 MMIO 区间和可用物理内存都做了恒等映射，因此物理地址到虚拟地址可以直接返回；反向转换则通过当前内核页表查询得到。

### K210 真实硬件平台

在 K210 开发板上，我们可以插入 microSD 卡并将其作为块设备。相比 VirtIO 块设备来说，想要将 microSD 驱动起来是一件比较困难的事情。microSD 自身的通信规范比较复杂，且还需考虑在 K210 中microSD挂在 **串行外设接口** (SPI, Serial Peripheral Interface) 总线上的情况。此外还需要正确设置 GPIO 的管脚映射并调整各锁相环的频率。实际上，在一块小小的芯片中除了 K210 CPU 之外，还集成了很多不同种类的外设和控制模块，它们内在的关联比较紧密，不能像 VirtIO 设备那样容易地从系统中独立出来。

好在目前 Rust 嵌入式的生态正高速发展，针对 K210 平台也有比较成熟的封装了各类外设接口的库可以用来开发上层应用。但是其功能往往分散为多个 crate ，在使用的时候需要开发者根据需求自行进行组装。这属于 Rust 的特点之一，和 C 语言提供一个一站式的板级开发包风格有很大的不同。在开发的时候，笔者就从社区中选择了一些 crate 并进行了微量修改最终变成 k210-hal/k210-pac/k210-soc 三个能够运行在 S 特权级（它们的原身仅支持运行在 M 特权级）的 crate ，它们可以更加便捷的实现 microSD 的驱动。关于 microSD 的驱动 SDCardWrapper 的实现，有兴趣的同学可以参考 os/src/drivers/block/sdcard.rs 。

> **Note**
>
> **感谢相关 crate 的原身**
>
> - [k210-hal](https://github.com/riscv-rust/k210-hal)
> - [k210-pac](https://github.com/riscv-rust/k210-pac)
> - [k210-sdk-stuff](https://github.com/laanwj/k210-sdk-stuff)

要在 K210 上启用 microSD ，执行的时候无需任何改动，只需在 make run 之前将 microSD 插入 PC 再通过 make sdcard 将 easy-fs 镜像烧写进去即可。而后，将 microSD 插入 K210 开发板，连接到 PC 再 make run 。

在对 microSD 进行操作的时候，会涉及到 K210 内置的各种外设，正所谓”牵一发而动全身“。因此 K210 平台上的 MMIO 包含很多区间：

```
// os/src/config.rs

#[cfg(feature = "board_k210")]
pub const MMIO: &[(usize, usize)] = &[
    // we don't need clint in S priv when running
    // we only need claim/complete for target0 after initializing
    (0x0C00_0000, 0x3000),      /* PLIC      */
    (0x0C20_0000, 0x1000),      /* PLIC      */
    (0x3800_0000, 0x1000),      /* UARTHS    */
    (0x3800_1000, 0x1000),      /* GPIOHS    */
    (0x5020_0000, 0x1000),      /* GPIO      */
    (0x5024_0000, 0x1000),      /* SPI_SLAVE */
    (0x502B_0000, 0x1000),      /* FPIOA     */
    (0x502D_0000, 0x1000),      /* TIMER0    */
    (0x502E_0000, 0x1000),      /* TIMER1    */
    (0x502F_0000, 0x1000),      /* TIMER2    */
    (0x5044_0000, 0x1000),      /* SYSCTL    */
    (0x5200_0000, 0x1000),      /* SPI0      */
    (0x5300_0000, 0x1000),      /* SPI1      */
    (0x5400_0000, 0x1000),      /* SPI2      */
];
```

## 内核索引节点层

在本章的第一小节我们介绍过，站在用户的角度看来，在一个进程中可以使用多种不同的标志来打开一个文件，这会影响到打开的这个文件可以用何种方式被访问。此外，在连续调用 sys\_read/write 读写一个文件的时候，我们知道进程中也存在着一个文件读写的当前偏移量，它也随着文件读写的进行而被不断更新。这些用户视角中的文件系统抽象特征需要内核来实现，与进程有很大的关系，而 easy-fs 文件系统不必涉及这些与进程结合紧密的属性。因此，我们需要将 easy-fs 提供的 Inode 加上上述信息，进一步封装为 OS 中的索引节点 OSInode ：

```
// os/src/fs/inode.rs

pub struct OSInode {
    readable: bool,
    writable: bool,
    inner: Mutex<OSInodeInner>,
}

pub struct OSInodeInner {
    offset: usize,
    inode: Arc<Inode>,
}

impl OSInode {
    pub fn new(
        readable: bool,
        writable: bool,
        inode: Arc<Inode>,
    ) -> Self {
        Self {
            readable,
            writable,
            inner: Mutex::new(OSInodeInner {
                offset: 0,
                inode,
            }),
        }
    }
}
```

OSInode 就表示进程中一个被打开的常规文件或目录。 readable/writable 分别表明该文件是否允许通过 sys\_read/write 进行读写。至于在 sys\_read/write 期间被维护偏移量 offset 和它在 easy-fs 中的 Inode 则加上一把互斥锁丢到 OSInodeInner 中。这在提供内部可变性的同时，也可以简单应对多个进程同时读写一个文件的情况。

## 文件描述符层

一个进程可以访问的多个文件，所以在操作系统中需要有一个管理进程访问的多个文件的结构，这就是 **文件描述符表** (File Descriptor Table) ，其中的每个 **文件描述符** (File Descriptor) 代表了一个特定读写属性的I/O资源。

为简化操作系统设计实现，可以让每个进程都带有一个线性的 **文件描述符表** ，记录该进程请求内核打开并读写的那些文件集合。而 **文件描述符** (File Descriptor) 则是一个非负整数，表示文件描述符表中一个打开的 **文件描述符** 所处的位置（可理解为数组下标）。进程通过文件描述符，可以在自身的文件描述符表中找到对应的文件记录信息，从而也就找到了对应的文件，并对文件进行读写。当打开（ open ）或创建（ create ） 一个文件的时候，一般情况下内核会返回给应用刚刚打开或创建的文件对应的文件描述符；而当应用想关闭（ close ）一个文件的时候，也需要向内核提供对应的文件描述符，以完成对应文件相关资源的回收操作。

因为 OSInode 也是一种要放到进程文件描述符表中文件，并可通过 sys\_read/write 系统调用进行读写操作，因此我们也需要为它实现 File Trait ：

```
// os/src/fs/inode.rs

impl File for OSInode {
    fn readable(&self) -> bool { self.readable }
    fn writable(&self) -> bool { self.writable }
    fn read(&self, mut buf: UserBuffer) -> usize {
        let mut inner = self.inner.lock();
        let mut total_read_size = 0usize;
        for slice in buf.buffers.iter_mut() {
            let read_size = inner.inode.read_at(inner.offset, *slice);
            if read_size == 0 {
                break;
            }
            inner.offset += read_size;
            total_read_size += read_size;
        }
        total_read_size
    }
    fn write(&self, buf: UserBuffer) -> usize {
        let mut inner = self.inner.lock();
        let mut total_write_size = 0usize;
        for slice in buf.buffers.iter() {
            let write_size = inner.inode.write_at(inner.offset, *slice);
            assert_eq!(write_size, slice.len());
            inner.offset += write_size;
            total_write_size += write_size;
        }
        total_write_size
    }
}
```

本章我们为 File Trait 新增了 readable/writable 两个抽象接口从而在 sys\_read/sys\_write 的时候进行简单的访问权限检查。 read/write 的实现也比较简单，只需遍历 UserBuffer 中的每个缓冲区片段，调用 Inode 写好的 read/write\_at 接口就好了。注意 read/write\_at 的起始位置是在 OSInode 中维护的 offset ，这个 offset 也随着遍历的进行被持续更新。在 read/write 的全程需要获取 OSInode 的互斥锁，保证两个进程无法同时访问同个文件。

## 文件描述符表

为了支持进程对文件的管理，我们需要在进程控制块中加入文件描述符表的相应字段：

```
// os/src/task/task.rs

pub struct TaskControlBlockInner {
    pub trap_cx_ppn: PhysPageNum,
    pub base_size: usize,
    pub task_cx_ptr: usize,
    pub task_status: TaskStatus,
    pub memory_set: MemorySet,
    pub parent: Option<Weak<TaskControlBlock>>,
    pub children: Vec<Arc<TaskControlBlock>>,
    pub exit_code: i32,
    pub fd_table: Vec<Option<Arc<dyn File + Send + Sync>>>,
}
```

可以看到 fd\_table 的类型包含多层嵌套，我们从外到里分别说明：

- Vec 的动态长度特性使得我们无需设置一个固定的文件描述符数量上限，我们可以更加灵活的使用内存，而不必操心内存管理问题；
- Option 使得我们可以区分一个文件描述符当前是否空闲，当它是 None 的时候是空闲的，而 Some 则代表它已被占用；
- Arc 首先提供了共享引用能力。后面我们会提到，可能会有多个进程共享同一个文件对它进行读写。此外被它包裹的内容会被放到内核堆而不是栈上，于是它便不需要在编译期有着确定的大小；
- dyn 关键字表明 Arc 里面的类型实现了 File/Send/Sync 三个 Trait ，但是编译期无法知道它具体是哪个类型（可能是任何实现了 File Trait 的类型如 Stdin/Stdout ，故而它所占的空间大小自然也无法确定），需要等到运行时才能知道它的具体类型，对于一些抽象方法的调用也是在那个时候才能找到该类型实现的方法并跳转过去。

> **Note**
>
> **Rust 语法卡片：Rust 中的多态**
>
> 在编程语言中， **多态** (Polymorphism) 指的是在同一段代码中可以隐含多种不同类型的特征。在 Rust 中主要通过泛型和 Trait 来实现多态。
>
> 泛型是一种 **编译期多态** (Static Polymorphism)，在编译一个泛型函数的时候，编译器会对于所有可能用到的类型进行实例化并对应生成一个版本的汇编代码，在编译期就能知道选取哪个版本并确定函数地址，这可能会导致生成的二进制文件体积较大；而 Trait 对象（也即上面提到的 dyn 语法）是一种 **运行时多态** (Dynamic Polymorphism)，需要在运行时查一种类似于 C++ 中的 **虚表** (Virtual Table) 才能找到实际类型对于抽象接口实现的函数地址并进行调用，这样会带来一定的运行时开销，但是更省空间且灵活。

## 应用访问文件的内核机制实现

应用程序在访问文件之前，首先需要完成对文件系统的初始化和加载。这可以通过操作系统来完成，也可以让应用程序发出文件系统相关的系统调用（如 mount 等）来完成。我们这里的选择是让操作系统直接完成。

应用程序如果要基于文件进行I/O访问，大致就会涉及如下一些系统调用：

- 打开文件 -- sys\_open：进程只有打开文件，操作系统才能返回一个可进行读写的文件描述符给进程，进程才能基于这个值来进行对应文件的读写。
- 关闭文件 -- sys\_close：进程基于文件描述符关闭文件后，就不能再对文件进行读写操作了，这样可以在一定程度上保证对文件的合法访问。
- 读文件 -- sys\_read：进程可以基于文件描述符来读文件内容到相应内存中。
- 写文件 -- sys\_write：进程可以基于文件描述符来把相应内存内容写到文件中。

### 文件系统初始化

在上一小节我们介绍过，为了使用 easy-fs 提供的抽象和服务，我们需要进行一些初始化操作才能成功将 easy-fs 接入到我们的内核中。按照前面总结的步骤：

1. 打开块设备。从本节前面可以看出，我们已经打开并可以访问装载有 easy-fs 文件系统镜像的块设备 BLOCK\_DEVICE ；
2. 从块设备 BLOCK\_DEVICE 上打开文件系统；
3. 从文件系统中获取根目录的 inode 。

2-3 步我们在这里完成：

```
// os/src/fs/inode.rs

lazy_static! {
    pub static ref ROOT_INODE: Arc<Inode> = {
        let efs = EasyFileSystem::open(BLOCK_DEVICE.clone());
        Arc::new(EasyFileSystem::root_inode(&efs))
    };
}
```

这之后就可以使用根目录的 inode ROOT\_INODE ，在内核中进行各种 easy-fs 的相关操作了。例如，在文件系统初始化完毕之后，在内核主函数 rust\_main 中调用 list\_apps 函数来列举文件系统中可用的应用的文件名：

```
// os/src/fs/inode.rs

pub fn list_apps() {
    println!("/**** APPS ****");
    for app in ROOT_INODE.ls() {
        println!("{}", app);
    }
    println!("**************/")
}
```

### 打开与关闭文件

我们需要在内核中也定义一份打开文件的标志 OpenFlags ：

```
// os/src/fs/inode.rs

bitflags! {
    pub struct OpenFlags: u32 {
        const RDONLY = 0;
        const WRONLY = 1 << 0;
        const RDWR = 1 << 1;
        const CREATE = 1 << 9;
        const TRUNC = 1 << 10;
    }
}

impl OpenFlags {
    /// Do not check validity for simplicity
    /// Return (readable, writable)
    pub fn read_write(&self) -> (bool, bool) {
        if self.is_empty() {
            (true, false)
        } else if self.contains(Self::WRONLY) {
            (false, true)
        } else {
            (true, true)
        }
    }
}
```

它的 read\_write 方法可以根据标志的情况返回要打开的文件是否允许读写。简单起见，这里假设标志自身一定合法。

接着，我们实现 open\_file 内核函数，可根据文件名打开一个根目录下的文件：

```
// os/src/fs/inode.rs

pub fn open_file(name: &str, flags: OpenFlags) -> Option<Arc<OSInode>> {
    let (readable, writable) = flags.read_write();
    if flags.contains(OpenFlags::CREATE) {
        if let Some(inode) = ROOT_INODE.find(name) {
            // clear size
            inode.clear();
            Some(Arc::new(OSInode::new(
                readable,
                writable,
                inode,
            )))
        } else {
            // create file
            ROOT_INODE.create(name)
                .map(|inode| {
                    Arc::new(OSInode::new(
                        readable,
                        writable,
                        inode,
                    ))
                })
        }
    } else {
        ROOT_INODE.find(name)
            .map(|inode| {
                if flags.contains(OpenFlags::TRUNC) {
                    inode.clear();
                }
                Arc::new(OSInode::new(
                    readable,
                    writable,
                    inode
                ))
            })
    }
}
```

这里主要是实现了 OpenFlags 各标志位的语义。例如只有 flags 参数包含 CREATE 标志位才允许创建文件；而如果文件已经存在，则清空文件的内容。另外我们将从 OpenFlags 解析得到的读写相关权限传入 OSInode 的创建过程中。

在其基础上， sys\_open 也就很容易实现了：

```
// os/src/syscall/fs.rs

pub fn sys_open(path: *const u8, flags: u32) -> isize {
    let task = current_task().unwrap();
    let token = current_user_token();
    let path = translated_str(token, path);
    if let Some(inode) = open_file(
        path.as_str(),
        OpenFlags::from_bits(flags).unwrap()
    ) {
        let mut inner = task.inner_exclusive_access();
        let fd = inner.alloc_fd();
        inner.fd_table[fd] = Some(inode);
        fd as isize
    } else {
        -1
    }
}
```

关闭文件的系统调用 sys\_close 实现非常简单，我们只需将进程控制块中的文件描述符表对应的一项改为 None 代表它已经空闲即可，同时这也会导致内层的引用计数类型 Arc 被销毁，会减少一个文件的引用计数，当引用计数减少到 0 之后文件所占用的资源就会被自动回收。

```
// os/src/syscall/fs.rs

pub fn sys_close(fd: usize) -> isize {
    let task = current_task().unwrap();
    let mut inner = task.inner_exclusive_access();
    if fd >= inner.fd_table.len() {
        return -1;
    }
    if inner.fd_table[fd].is_none() {
        return -1;
    }
    inner.fd_table[fd].take();
    0
}
```

### 基于文件来加载并执行应用

在有了文件系统支持之后，我们在 sys\_exec 所需的应用的 ELF 文件格式的数据就不再需要通过应用加载器从内核的数据段获取，而是从文件系统中获取，这样内核与应用的代码/数据就解耦了：

```
// os/src/syscall/process.rs

pub fn sys_exec(path: *const u8) -> isize {
    let token = current_user_token();
    let path = translated_str(token, path);
    if let Some(app_inode) = open_file(path.as_str(), OpenFlags::RDONLY) {
        let all_data = app_inode.read_all();
        let task = current_task().unwrap();
        task.exec(all_data.as_slice());
        0
    } else {
        -1
    }
}
```

注意上面代码片段中的高亮部分。当执行获取应用的 ELF 数据的操作时，首先调用 open\_file 函数，以只读的方式在内核中打开应用文件并获取它对应的 OSInode 。接下来可以通过 OSInode::read\_all 将该文件的数据全部读到一个向量 all\_data 中：

```
// os/src/fs/inode.rs

impl OSInode {
    pub fn read_all(&self) -> Vec<u8> {
        let mut inner = self.inner.lock();
        let mut buffer = [0u8; 512];
        let mut v: Vec<u8> = Vec::new();
        loop {
            let len = inner.inode.read_at(inner.offset, &mut buffer);
            if len == 0 {
                break;
            }
            inner.offset += len;
            v.extend_from_slice(&buffer[..len]);
        }
        v
    }
}
```

之后，就可以从向量 all\_data 中拿到应用中的 ELF 数据，当解析完毕并创建完应用地址空间后该向量将会被回收。

同样的，我们在内核中创建初始进程 initproc 也需要替换为基于文件系统的实现：

```
// os/src/task/mod.rs

lazy_static! {
    pub static ref INITPROC: Arc<TaskControlBlock> = Arc::new({
        let inode = open_file("initproc", OpenFlags::RDONLY).unwrap();
        let v = inode.read_all();
        TaskControlBlock::new(v.as_slice())
    });
}
```

### 读写文件

基于文件抽象接口和文件描述符表，我们可以按照无结构的字节流来处理基本的文件读写，这样可以让文件读写系统调用 sys\_read/write 变得更加具有普适性，为后续支持把管道等抽象为文件打下了基础：

```
// os/src/syscall/fs.rs

pub fn sys_write(fd: usize, buf: *const u8, len: usize) -> isize {
    let token = current_user_token();
    let task = current_task().unwrap();
    let inner = task.inner_exclusive_access();
    if fd >= inner.fd_table.len() {
        return -1;
    }
    if let Some(file) = &inner.fd_table[fd] {
        let file = file.clone();
        // release current task TCB manually to avoid multi-borrow
        drop(inner);
        file.write(
            UserBuffer::new(translated_byte_buffer(token, buf, len))
        ) as isize
    } else {
        -1
    }
}

pub fn sys_read(fd: usize, buf: *const u8, len: usize) -> isize {
    let token = current_user_token();
    let task = current_task().unwrap();
    let inner = task.inner_exclusive_access();
    if fd >= inner.fd_table.len() {
        return -1;
    }
    if let Some(file) = &inner.fd_table[fd] {
        let file = file.clone();
        // release current task TCB manually to avoid multi-borrow
        drop(inner);
        file.read(
            UserBuffer::new(translated_byte_buffer(token, buf, len))
        ) as isize
    } else {
        -1
    }
}
```

操作系统都是通过文件描述符在当前进程的文件描述符表中找到某个文件，无需关心文件具体的类型，只要知道它一定实现了 File Trait 的 read/write 方法即可。Trait 对象提供的运行时多态能力会在运行的时候帮助我们定位到符合实际类型的 read/write 方法。

---

## 本节练习

2. \* 扩展内核功能，支持stat系统调用，能显示文件的inode元数据信息。


你将在本章的编程实验中实现这个功能。

3. \*\* 扩展内核功能，支持mmap系统调用，支持对文件的映射，实现基于内存读写方式的文件读写功能。


> **Note**
>
> 这里只是给出了一种参考实现。mmap本身行为比较复杂，使用你认为合理的方式实现即可。

在第四章的编程实验中你应该已经实现了mmap的匿名映射功能，这里我们要实现文件映射。
[mmap](https://man7.org/linux/man-pages/man2/mmap.2.html) 的原型如下：

```
void *mmap(void *addr, size_t length, int prot, int flags,
                int fd, off_t offset);
```

其中 addr 是一个虚拟地址的hint，在映射文件时我们不关心具体的虚拟地址（相当于传入 NULL ），这里我们的系统调用忽略这个参数。 prot 和 flags 指定了一些属性，为简单起见我们也不要这两个参数，映射的虚拟内存的属性直接继承自文件的读写属性。我们最终保留 length 、 fd 和 offset 三个参数。

考虑最简单的一种实现方式：mmap调用时随便选择一段虚拟地址空间，将它映射到一些随机的物理页面上，之后再把文件的对应部分全部读到内存里。如果这段映射是可写的，那么内核还要在合适的时机（比如调用msync、munmap、进程退出时）把内存里的东西回写到文件。

这样做的问题是被映射的文件可能很大，将映射的区域全部读入内存可能很慢，而且用户未必会访问所有的页面。这里可以应用按需分页的惰性加载策略：先不实际建立虚拟内存到物理内存的映射，当用户访问映射的区域时会触发缺页异常，我们在处理异常时分配实际的物理页面并将文件读入内存。

按照上述方式已经可以实现文件映射了，但让我们来考虑较为微妙的情况。比如以下的Linux C程序：

```
#include <unistd.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <stdio.h>

int main()
{
    char str[] = {"asdbasdq3423423\n"};
    int fd = open("2.txt", O_RDWR | O_CREAT | O_TRUNC, 0664);
    if (fd < 0) {
        printf("open failed\n");
        return -1;
    }

    if (write(fd, str, sizeof(str)) < 0) {
        printf("write failed\n");
        return -1;
    }

    char *p1 = mmap(NULL, sizeof(str), PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    char *p2 = mmap(NULL, sizeof(str), PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    printf("p1 = %p, p2 = %p\n", p1, p2);
    close(fd);

    p1[1] = '1';
    p2[2] = '2';
    p2[0] = '2';
    p1[0] = '1';
    printf("content1: %s", p1);
    printf("content2: %s", p2);
    return 0;
}
```

一个可能的输出结果如下：

```
p1 = 0x7f955a3cf000, p2 = 0x7f955a3a2000
content1: 112basdq3423423
content2: 112basdq3423423
```

可以看到文件的同一段区域被映射到了两个不同的虚拟地址，对这两段虚拟内存的修改全部生效（冲突的修改也是最后的可见），修改后再读出来的内容也相同。这样的结果是符合直觉的，因为底层的文件只有一个（也与 MAP\_SHARED 有关，由于设置 MAP\_PRIVATE 标志不会将修改真正写入文件，我们参考 MAP\_SHARED 的行为）。如果按照上面说的方式将两个虚拟内存区域映射到不同的物理页面，那么对两个区域的修改无法同时生效，我们也无法确定应该将哪个页面回写到文件。这个例子启示我们， **如果文件映射包含文件的相同部分，那么相应的虚拟页面应该映射到相同的物理页** 。

不幸的是，现有的 MapArea 类型只含 Identical 和 Framed ，不支持不同的虚拟页面共享物理页，所以我们需要手动管理一些资源。下面的 FileMapping 结构描述了一个文件的若干段映射：

```
pub struct FileMapping {
    file: Arc<Inode>,
    ranges: Vec<MapRange>,
    frames: Vec<FrameTracker>,
    dirty_parts: BTreeSet<usize>, // file segments that need writing back
    map: BTreeMap<usize, PhysPageNum>, // file offset -> ppn
}
```

其中 file 代表被映射的文件，你可能会好奇它的类型为什么不是一个文件描述符编号或者 Arc<dyn File> 。首先mmap之后使用的文件描述符可以立即被关闭而不会对文件映射造成任何影响，所以不适合只存放fd编号；其次mmap通常要求映射的文件是常规文件 （例：映射stdin和stdout毫无意义），这里用 Inode 来提醒我们这点。 ranges 里面存放了若干 MapRange ，每个都用于描述一段映射区域。 frames 用于管理实际分配的物理页帧。 dirty\_parts 记录了需要回写的脏页，注意它实际上用文件内的偏移来表示。 map 维护文件内偏移到物理页号的映射。需要注意的是这里记录脏页的方式比较简单，而且也完全没有考虑在进程间共享物理页，你可以使用引用计数等手段进行扩展。

```
#[derive(Clone)]
struct MapRange {
    start: VirtAddr,
    len: usize,    // length in bytes
    offset: usize, // offset in file
    perm: MapPermission,
}
```

MapRange 描述了一段映射区域。 start 是该区域的起始虚拟地址， offset 为其在文件中的偏移， perm 记录了该区域的属性。

前面提到过，我们的mmap忽略掉作为hint的 addr 参数，那这里的虚拟地址填什么呢？一般来说64位架构具有大到用不完的虚拟地址空间，用一个简单的线性分配器随便分配虚拟地址即可。

```
/// Base virtual address for mmap
pub const MMAP_AREA_BASE: usize = 0x0000_0001_0000_0000; // 随便选的基址，挑块没人用的

/// A naive linear virtual address space allocator
pub struct VirtualAddressAllocator {
    cur_va: VirtAddr,
}

impl VirtualAddressAllocator {
    /// Create a new allocator with given base virtual address
    pub fn new(base: usize) -> Self {
        Self {
            cur_va: base.into(),
        }
    }

    /// Allocate a virtual address area
    pub fn alloc(&mut self, len: usize) -> VirtAddr {
        let start = self.cur_va;
        let end: VirtAddr = (self.cur_va.0 + len).into();
        self.cur_va = end.ceil().into();
        start
    }

    // 不必释放
}
```

然后把 VirtualAddressAllocator 和 FileMapping 放进 TaskControlBlockInner 里。为简单起见，fork时不考虑这两个字段的复制和映射的共享。

```
pub struct TaskControlBlockInner {
    pub trap_cx_ppn: PhysPageNum,
    pub base_size: usize,
    pub task_cx: TaskContext,
    pub task_status: TaskStatus,
    pub memory_set: MemorySet,
    pub parent: Option<Weak<TaskControlBlock>>,
    pub children: Vec<Arc<TaskControlBlock>>,
    pub exit_code: i32,
    pub fd_table: Vec<Option<Arc<dyn File + Send + Sync>>>,
    pub mmap_va_allocator: VirtualAddressAllocator,
    pub file_mappings: Vec<FileMapping>,
}
```

下面来添加mmap系统调用：

```
/// This is a simplified version of mmap which only supports file-backed mapping
pub fn sys_mmap(fd: usize, len: usize, offset: usize) -> isize {
    if len == 0 {
        // invalid length
        return -1;
    }
    if (offset & (PAGE_SIZE - 1)) != 0 {
        // offset must be page size aligned
        return -1;
    }

    let task = current_task().unwrap();
    let mut tcb = task.inner_exclusive_access();
    if fd >= tcb.fd_table.len() {
        return -1;
    }
    if tcb.fd_table[fd].is_none() {
        return -1;
    }

    let fp = tcb.fd_table[fd].as_ref().unwrap();
    let opt_inode = fp.as_any().downcast_ref::<OSInode>();
    if opt_inode.is_none() {
        // must be a regular file
        return -1;
    }

    let inode = opt_inode.unwrap();
    let perm = parse_permission(inode);
    let file = inode.clone_inner_inode();
    if offset >= file.get_size() {
        // file offset exceeds size limit
        return -1;
    }

    let start = tcb.mmap_va_allocator.alloc(len);
    let mappings = &mut tcb.file_mappings;
    if let Some(m) = find_file_mapping(mappings, &file) {
        m.push(start, len, offset, perm);
    } else {
        let mut m = FileMapping::new_empty(file);
        m.push(start, len, offset, perm);
        mappings.push(m);
    }
    start.0 as isize
}
```

这里面有不少无聊的参数检查和辅助函数，就不详细介绍了。总之这个系统调用实际做的事情只有维护对应的 FileMapping 结构，实际的工作被推迟到缺页异常处理例程中。

```
#[unsafe(no_mangle)]
/// handle an interrupt, exception, or system call from user space
pub fn trap_handler() -> ! {
    set_kernel_trap_entry();
    let scause = scause::read();
    let stval = stval::read();
    let trap: Trap<Interrupt, Exception> = match scause.cause().try_into() {
        Ok(trap) => trap,
        Err(_) => panic!(
            "Unsupported trap {:?}, stval = {:#x}!",
            scause.cause(),
            stval
        ),
    };
    match trap {
        Trap::Exception(Exception::UserEnvCall) => {
            // ...
        }
        Trap::Exception(Exception::StoreFault)
        | Trap::Exception(Exception::StorePageFault)
        | Trap::Exception(Exception::InstructionFault)
        | Trap::Exception(Exception::InstructionPageFault)
        | Trap::Exception(Exception::LoadFault)
        | Trap::Exception(Exception::LoadPageFault) => {
            if !handle_page_fault(stval) {
                println!(
                    "[kernel] {:?} in application, bad addr = {:#x}, bad instruction = {:#x}, kernel killed it.",
                    scause.cause(),
                    stval,
                    current_trap_cx().sepc,
                );
                // page fault exit code
                exit_current_and_run_next(-2);
            }
        }
        Trap::Exception(Exception::IllegalInstruction) => {
            // ...
        }
        Trap::Interrupt(Interrupt::SupervisorTimer) => {
            // ...
        }
        _ => {
            panic!(
                "Unsupported trap {:?}, stval = {:#x}!",
                scause.cause(),
                stval
            );
        }
    }
    trap_return();
}
```

我们在这里尝试处理缺页异常，如果 handle\_page\_fault 返回 true 表明异常已经被处理，否则内核仍然会杀死当前进程。

```
/// Try to handle page fault caused by demand paging
/// Returns whether this page fault is fixed
pub fn handle_page_fault(fault_addr: usize) -> bool {
    let fault_va: VirtAddr = fault_addr.into();
    let fault_vpn = fault_va.floor();
    let task = current_task().unwrap();
    let mut tcb = task.inner_exclusive_access();

    if let Some(pte) = tcb.memory_set.translate(fault_vpn) {
        if pte.is_valid() {
            return false; // fault va already mapped, we cannot handle this
        }
    }

    match tcb.file_mappings.iter_mut().find(|m| m.contains(fault_va)) {
        Some(mapping) => {
            let file = Arc::clone(&mapping.file);
            // fix vm mapping
            let (ppn, range, shared) = mapping.map(fault_va).unwrap();
            tcb.memory_set.map(fault_vpn, ppn, range.perm);

            if !shared {
                // load file content
                let file_size = file.get_size();
                let file_offset = range.file_offset(fault_vpn);
                assert!(file_offset < file_size);

                // let va_offset = range.va_offset(fault_vpn);
                // let va_len = range.len - va_offset;
                // Note: we do not limit `read_len` with `va_len`
                // consider two overlapping areas with different lengths

                let read_len = PAGE_SIZE.min(file_size - file_offset);
                file.read_at(file_offset, &mut ppn.get_bytes_array()[..read_len]);
            }
            true
        }
        None => false,
    }
}
```

- handle\_page\_fault 的9~13行先检查触发异常的虚拟内存页是否已经映射到物理页面，如果是则说明此异常并非源自惰性按需分页（比如写入只读页），这个问题不归我们管，直接返回 false。
- 接下来的第15行检查出错的虚拟地址是否在映射区域内，如果是我们才上手来处理。

在实际的修复过程中：
- 第19行先调用 FileMapping 的 map 方法建立目标虚拟地址到物理页面的映射；
- 第20行将新的映射关系添加到页表；
- 第22~35行处理文件读入。注意实际的文件读取只发生在物理页面的引用计数从0变为1的时候，存在共享的情况下再读取文件可能会覆盖掉用户对内存的修改。

FileMapping 的 map 方法实现如下：

```
impl FileMapping {
    /// Create mapping for given virtual address
    fn map(&mut self, va: VirtAddr) -> Option<(PhysPageNum, MapRange, bool)> {
        // Note: currently virtual address ranges never intersect
        let vpn = va.floor();
        for range in &self.ranges {
            if !range.contains(va) {
                continue;
            }
            let offset = range.file_offset(vpn);
            let (ppn, shared) = match self.map.get(&offset) {
                Some(&ppn) => (ppn, true),
                None => {
                    let frame = frame_alloc().unwrap();
                    let ppn = frame.ppn;
                    self.frames.push(frame);
                    self.map.insert(offset, ppn);
                    (ppn, false)
                }
            };
            if range.perm.contains(MapPermission::W) {
                self.dirty_parts.insert(offset);
            }
            return Some((ppn, range.clone(), shared));
        }
        None
    }
}
```

- 第6~9行先找到包含目标虚拟地址的映射区域；
- 第10行计算虚拟地址对应的文件内偏移；
- 第11~20行先查询此文件偏移是否对应已分配的物理页，如果没有则分配一个物理页帧并记录映射关系；
- 第21~23行检查此映射区域是否有写入权限，如果有则将对应的物理页面标记为脏页。这个处理实际上比较粗糙，有些没有被真正写入的页面也被视为脏页，导致最后会有多余的文件回写。你也可以考虑不维护脏页信息，而是通过检查页表项中由硬件维护的 Dirty 位来确定哪些是真正的脏页。

修复后用户进程重新执行触发缺页异常的指令，此时物理页里存放了文件的内容，这样用户就实现了以读取内存的方式来读取文件。最后来处理被修改的脏页的同步，给 FileMapping 添加 sync 方法：

```
impl FileMapping {
    /// Write back all dirty pages
    pub fn sync(&self) {
        let file_size = self.file.get_size();
        for &offset in self.dirty_parts.iter() {
            let ppn = self.map.get(&offset).unwrap();
            if offset < file_size {
                // WARNING: this can still cause garbage written
                //  to file when sharing physical page
                let va_len = self
                    .ranges
                    .iter()
                    .map(|r| {
                        if r.offset <= offset && offset < r.offset + r.len {
                            PAGE_SIZE.min(r.offset + r.len - offset)
                        } else {
                            0
                        }
                    })
                    .max()
                    .unwrap();
                let write_len = va_len.min(file_size - offset);

                self.file
                    .write_at(offset, &ppn.get_bytes_array()[..write_len]);
            }
        }
    }
}
```

这个方法将所有潜在的脏物理页内容回写至文件。第10~22行的计算主要为了限制写入内容的长度，以避免垃圾被意外写入文件。

剩下的问题是何时调用 sync 。正常来说munmap、msync是同步点，你可以自行实现这两个系统调用，这里我们把它放在进程退出之前：

```
/// Exit the current 'Running' task and run the next task in task list.
pub fn exit_current_and_run_next(exit_code: i32) {
    let task = take_current_task().unwrap();
    // ...
    let mut inner = task.inner_exclusive_access();
    // ...
    inner.children.clear();
    // deallocate user space
    inner.memory_set.recycle_data_pages();
    // write back dirty pages
    for mapping in inner.file_mappings.iter() {
        mapping.sync();
    }
    drop(inner);
    // **** release current PCB
    // drop task manually to maintain rc correctly
    drop(task);
    // ...
}
```

8. \*\* 为什么要同时维护进程的打开文件表和操作系统的打开文件表？这两个打开文件表有什么区别和联系？

   多个进程可能会同时打开同一个文件，操作系统级的打开文件表可以加快后续的打开操作，但同时由于每个进程打开文件时使用的访问模式或是偏移量不同，所以还需要进程的打开文件表另外记录。

---

## 本节练习

### 实验作业

## 实验练习

实验练习包括实践作业和问答作业两部分。

**理解文件系统比较费事，编程难度适中**

### 实践作业

#### 硬链接

硬链接要求两个不同的目录项指向同一个文件，在我们的文件系统中也就是两个不同名称目录项指向同一个磁盘块。

本节要求实现三个系统调用 sys\_linkat、sys\_unlinkat、sys\_stat 。

**linkat**：

> - syscall ID: 37
> - 功能：创建一个文件的一个硬链接， [linkat标准接口](https://linux.die.net/man/2/linkat) 。
> - Ｃ接口： int linkat(int olddirfd, char\* oldpath, int newdirfd, char\* newpath, unsigned int flags)
> - Rust 接口： fn linkat(olddirfd: i32, oldpath: \*const u8, newdirfd: i32, newpath: \*const u8, flags: u32) -> i32
> - 参数：
>   :   - olddirfd，newdirfd: 仅为了兼容性考虑，本次实验中始终为 AT\_FDCWD (-100)，可以忽略。
>       - flags: 仅为了兼容性考虑，本次实验中始终为 0，可以忽略。
>       - oldpath：原有文件路径
>       - newpath: 新的链接文件路径。
> - 说明：
>   :   - 为了方便，不考虑新文件路径已经存在的情况（属于未定义行为），除非链接同名文件。
>       - 返回值：如果出现了错误则返回 -1，否则返回 0。
> - 可能的错误
>   :   - 链接同名文件。

**unlinkat**:

> - syscall ID: 35
> - 功能：取消一个文件路径到文件的链接, [unlinkat标准接口](https://linux.die.net/man/2/unlinkat) 。
> - Ｃ接口： int unlinkat(int dirfd, char\* path, unsigned int flags)
> - Rust 接口： fn unlinkat(dirfd: i32, path: \*const u8, flags: u32) -> i32
> - 参数：
>   :   - dirfd: 仅为了兼容性考虑，本次实验中始终为 AT\_FDCWD (-100)，可以忽略。
>       - flags: 仅为了兼容性考虑，本次实验中始终为 0，可以忽略。
>       - path：文件路径。
> - 说明：
>   :   - 为了方便，不考虑使用 unlink 彻底删除文件的情况。
> - 返回值：如果出现了错误则返回 -1，否则返回 0。
> - 可能的错误
>   :   - 文件不存在。

**fstat**:

> - syscall ID: 80
> - 功能：获取文件状态。
> - Ｃ接口： int fstat(int fd, struct Stat\* st)
> - Rust 接口： fn fstat(fd: i32, st: \*mut Stat) -> i32
> - 参数：
>   :   - fd: 文件描述符
>       - st: 文件状态结构体
>
>       ```
>       #[repr(C)]
>       #[derive(Debug)]
>       pub struct Stat {
>           /// 文件所在磁盘驱动器号，该实验中写死为 0 即可
>           pub dev: u64,
>           /// inode 文件所在 inode 编号
>           pub ino: u64,
>           /// 文件类型
>           pub mode: StatMode,
>           /// 硬链接数量，初始为1
>           pub nlink: u32,
>           /// 无需考虑，为了兼容性设计
>           pad: [u64; 7],
>       }
>
>       /// StatMode 定义：
>       bitflags! {
>           pub struct StatMode: u32 {
>               const NULL  = 0;
>               /// directory
>               const DIR   = 0o040000;
>               /// ordinary regular file
>               const FILE  = 0o100000;
>           }
>       }
>       ```

#### 实验要求

- 实现分支：ch7-lab
- 实验目录要求不变
- 通过所有测例

  在 os 目录下 make run TEST=1 加载所有测例， test\_usertest 打包了所有你需要通过的测例，你也可以通过修改这个文件调整本地测试的内容。

  你的内核必须前向兼容，能通过前一章的所有测例。

> **Note**
>
> **如何调试 easy-fs**
>
> 如果你在第一章练习题中已经借助 log crate 实现了日志功能，那么你可以直接在 easy-fs 中引入 log crate，通过 log::info!/debug! 等宏即可进行调试并在内核中看到日志输出。具体来说，在 easy-fs 中的修改是：在 easy-fs/Cargo.toml 的依赖中加入一行 log = "0.4.0"，然后在 easy-fs/src/lib.rs 中加入一行 extern crate log 。
>
> 你也可以完全在用户态进行调试。仿照 easy-fs-fuse 建立一个在当前操作系统中运行的应用程序，将测试逻辑写在 main 函数中。这个时候就可以将它引用的 easy-fs 的 no\_std 去掉并使用 println! 进行调试。

### 问答作业

无

### 实验练习的提交报告要求

- 简单总结本次实验与上个实验相比你增加的东西。（控制在5行以内，不要贴代码）
- 完成问答问题
- (optional) 你对本次实验设计及难度的看法。
