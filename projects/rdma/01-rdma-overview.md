---
title: "RDMA 概述"
description: "介绍 RDMA 技术背景、三种技术实现（InfiniBand/RoCE/iWARP）、特点优势与基本术语。"
date: "2026-07-19"
order: 1
tags: ["RDMA", "InfiniBand", "RoCE", "iWARP", "概述"]
---
# RDMA 概述


## 0、前言


十分推荐文章：《RDMA 架构与实践》 连接：

[RDMA 架构与实践 | Houmin](https://houmin.cc/posts/454a90d3/ "RDMA 架构与实践 | Houmin") 或 <http://t.csdn.cn/lOoTT>

## 一、技术背景

（摘自：[RDMA 架构与实践 | Houmin](https://houmin.cc/posts/454a90d3/ "RDMA 架构与实践 | Houmin")）

### 1 传统的 TCP/IP 网络通信的弊端

计算机网络通信中最重要两个衡量指标主要是 **带宽** 和 **延迟。**

> _通信延迟主要是指：_
> 
>   * _**Transmission Delay** ：_
> 
>     * _The time taken to transmit a packet from the host to the transmission medium_
>     *  _计算方式：Delayt=L/BandwidthDelayt=L/Bandwidth，其中 L 是要传输的数据包 L bit，Bandwidth 为链路带宽_
>     *  _如果两端的带宽高，则传输时间短，传输延迟低_
>   * _**Propagation delay**_
> 
>     * _After the packet is transmitted to the transmission medium, it has to go through the medium to reach the destination. Hence the time taken by the last bit of the packet to reach the destination is called propagation delay._
> 
>     * _计算方法：Delayp=Distance/VelocityDelayp=Distance/Velocity，其中 Distance 是传输链路的距离，Velocity 是物理介质传输速度_
> 
> | 介质（Medium） | 速度（Velocity） |
> | --- | --- |
> | 空气（Air） | 3 × 10⁸ m/s |
> | 光纤（Optical fibre） | 2.1 × 10⁸ m/s |
> 
>   * _**Queueing delay**_
> 
>     * _Let the packet is received by the destination, the packet will not be processed by the destination immediately. It has to wait in queue in something called as buffer. So the amount of time it waits in queue before being processed is called queueing delay._
>     * _In general we can’t calculate queueing delay because we don’t have any formula for that._
>   * _**Processing delay**_
> 
>     * _message handling time at sending/receive ends_
>     *  _buffer管理、在不同内存空间中消息复制、以及消息发送完成后的系统中断_
> 


现实计算机网络中的通信场景中，主要是以发送小消息为主，因此处理延迟是提升性能的关键。

传统的 TCP/IP 网络通信，数据需要通过用户空间发送到远程机器的用户空间，在这个过程中需要经历若干次内存拷贝：

![](/images/rdma/e99e04c8dcd33b4bffb552036dd22996.png)

![](/images/rdma/d175e58c96f499b257d4a7c78944c553.png)

[RDMA 架构与实践:https://houmin.cc/posts/454a90d3/](https://houmin.cc/posts/454a90d3/ "RDMA 架构与实践:https://houmin.cc/posts/454a90d3/")

如上图，在传统模式下，两台服务器上的应用之间传输数据，过程是这样的：

  * 首先要把数据从应用缓存拷贝到Kernel中的TCP协议栈缓存；
  * 然后再拷贝到驱动层；
  * 最后拷贝到网卡缓存。


>   * 数据发送方需要讲数据从用户空间 Buffer 复制到内核空间的 Socket Buffer
>   * 数据发送方要在内核空间中添加数据包头，进行数据封装
>   * 数据从内核空间的 Socket Buffer 复制到 NIC Buffer 进行网络传输
>   * 数据接受方接收到从远程机器发送的数据包后，要将数据包从 NIC Buffer 中复制到内核空间的 Socket Buffer
>   * 经过一系列的多层网络协议进行数据包的解析工作，解析后的数据从内核空间的 Socket Buffer 被复制到用户空间 Buffer
>   * 这个时候再进行系统上下文切换，用户应用程序才被调用
> 


多次内存拷贝需要CPU多次介入，导致处理延时大，达到数十微秒。同时整个过程中CPU过多参与，大量消耗CPU性能，影响正常的数据计算。

在高速网络条件下，传统的 TPC/IP 网络在**主机侧数据移动和复制操作带来的高开销** 限制了可以在机器之间发送的带宽。为了提高数据传输带宽，人们提出了多种解决方案，这里主要介绍下面两种：


  * Remote Direct Memroy Access （RDMA）


### 2 新的网络通信技术（TOE and RDMA）

#### 2.1 TOE （TCP/IP协议处理工作从CPU转移到网卡）

TOE （TCP Offloading Engine），在主机通过网络进行通信的过程中，CPU 需要耗费大量资源进行多层网络协议的数据包处理工作，包括数据复制、协议处理和中断处理。当主机收到网络数据包时，会引发大量的网络 I/O 中断，CPU 需要对 I/O 中断信号进行响应和确认。为了将 CPU 从这些操作中解放出来，人们发明了TOE（TCP/IP Offloading Engine）技术，将上述主机处理器的工作转移到网卡上。TOE 技术需要特定支持 Offloading 的网卡，这种特定网卡能够支持封装多层网络协议的数据包。

![](/images/rdma/44c3cf90037b181e0f73a3f5aa5fb698.png)

  * TOE 技术将原来在协议栈中进行的IP分片、TCP分段、重组、checksum校验等操作，转移到网卡硬件中进行，降低系统CPU的消耗，提高服务器处理性能。
  * 普通网卡处理每个数据包都要触发一次中断，TOE 网卡则让每个应用程序完成一次完整的数据处理进程后才触发一次中断，显著减轻服务器对中断的响应负担。
  * TOE 网卡在接收数据时，在网卡内进行协议处理，因此，它不必将数据复制到内核空间缓冲区，而是直接复制到用户空间的缓冲区，这种“零拷贝”方式避免了网卡和服务器间的不必要的数据往复拷贝。


![](/images/rdma/c61d1ca9d68abe6962cfffae9f989fc6.png)

#### 2.2 RDMA （绕过CPU，数据直接‘传’到对端内存）

为了消除传统网络通信的计算任务瓶颈，我们希望更快和更轻量级的网络通信，由此提出了RDMA(Remote Direct Memroy Access )技术。

RDMA利用 Kernel Bypass 和 Zero Copy技术提供了低延迟的特性，同时减少了CPU占用，减少了内存带宽瓶颈，提供了很高的带宽利用率。RDMA提供了给基于 IO 的通道，这种通道允许一个应用程序通过RDMA网卡对远程的虚拟内存进行直接读写。

RDMA 技术有以下几个特点：

  * **CPU Offload** ：无需CPU干预，应用程序可以访问远程主机内存而不消耗远程主机中的任何CPU。远程主机内存能够被读取而不需要远程主机上的进程（或CPU)参与。远程主机的CPU的缓存(cache)不会被访问的内存内容所填充
  * **Kernel Bypass** ：RDMA 提供一个专有的 Verbs interface 而不是传统的TCP/IP Socket interface。应用程序可以直接在用户态执行数据传输，不需要在内核态与用户态之间做上下文切换
  * **Zero Copy** ：每个应用程序都能直接访问集群中的设备的虚拟内存，这意味着应用程序能够直接执行数据传输，在不涉及到网络软件栈的情况下，数据能够被直接发送到缓冲区或者能够直接从缓冲区里接收，而不需要被复制到网络层。


下面是 RDMA 整体框架架构图，从图中可以看出，RDMA 提供了一系列 Verbs 接口，可在应用程序用户空间，操作RDMA硬件。RDMA绕过内核直接从用户空间访问RDMA 网卡。RNIC(RDMA 网卡，RNIC _（NIC=Network Interface Card ，网络接口卡、网卡，RNIC即 RDMA Network Interface Card）_ 中包括 Cached Page Table Entry，用来将虚拟页面映射到相应的物理页面。

![](/images/rdma/f9a391581712b66872fd0301a908c6f9.png)

**扩展知识：TOE 和 RDMA的区别、TOE、RDMA、smartNIC 、DPU是什么和区别：**

> 相同点：
> 
> 都具有给cpu减负的功能
> 
> 不同点：
> 
> 1、工作原理不同，见上面的简介。
> 
> 2、RDMA的网卡使用需要两端都支持RDMA技术的网卡才能发挥，TOE只需要单端即可。
> 
> 3、TOE网卡和RDMA网卡，都属于SmartNIC。
> 
> [更多和更新的内容见： http://t.csdn.cn/mLK6h](http://t.csdn.cn/mLK6h "更多和更新的内容见： http://t.csdn.cn/mLK6h")
> 


## 二、RDMA 详解（发展历程和3种技术实现）

###  1\. DMA和RDMA概念

RDMA = Remote DMA

**1.1 DMA**

传统内存访问需要通过CPU进行数据copy来移动数据，通过CPU将内存中的Buffer1移动到Buffer2中。

DMA(直接内存访问)是一种能力，允许在计算机主板上的设备通过DMA直接把数据发送到目标内存中去，数据搬运不需要CPU的参与。 

DMA模式：可以同DMA Engine之间通过硬件将数据从Buffer1移动到Buffer2,而不需要操作系统CPU的参与，大大降低了CPU Copy的开销。

![](/images/rdma/d450a7f4a1db3841846b75dd55453816.png)

**1.2 RDMA**

RDMA，即 `Remote Direct Memory Access`，是一种绕过**远程** 主机 `OS kernel` 访问其[内存](https://so.csdn.net/so/search?q=%E5%86%85%E5%AD%98&spm=1001.2101.3001.7020 "内存")中数据的技术，概念源自于 `DMA` 技术。在 [DMA](https://so.csdn.net/so/search?q=DMA&spm=1001.2101.3001.7020 "DMA") 技术中，外部设备（PCIe 设备）能够绕过 CPU 直接访问 `host memory`，不仅可以访问本地主机的内存，还能够访问另一台主机上的用户态内存（ 通俗的看成是远程的[DMA](https://baike.baidu.com/item/DMA/2385376 "DMA")技术）。

RDMA允许用户态的应用程序直接读取或写入远程内存，不经过操作系统，无内核干预和内存拷贝发生，节省了大量 CPU 资源，**提高了系统吞吐量** 、**降低了系统的网络通信延迟。**

![](/images/rdma/5383af26eabcfc48ea39499fb60edbbd.png)

RDMA是一种概念，在两个或者多个计算机进行通讯的时候使用DMA， (DMA硬件将数据）从一个主机的内存直接读写到另一个主机的内存，技术实现可以有不同的方式，见下节。

### 2 RDMA 三种不同的技术实现

（三种技术的更详细说明：<https://network.51cto.com/art/202103/648715.htm>）

目前RDMA有三种不同的硬件实现，它们都可以使用同一套API来使用，但它们有着不同的物理层和链路层：

  1. InfiniBand(IB): 基于 InfiniBand 架构的 RDMA 技术，需要专用的 IB 网卡和 IB 交换机。从性能上，很明显Infiniband网络最好，但网卡和交换机是价格也很高。

  2. RoCE：即RDMA over Ethernet(RoCE), 基于以太网的 RDMA 技术，也是由 IBTA 提出。RoCE支持在标准以太网基础设施上使用RDMA技术，但是需要交换机支持无损以太网传输，只不过网卡必须是支持RoCE的特殊的NIC。

  3. iWARP：Internet Wide Area RDMA Protocal，基于 TCP/IP 协议的 RDMA 技术(在现有TCP/IP协议栈基础上实现RDMA技术,在TCP协议上增加一层[DDP](https://link.csdn.net/?target=https%3A%2F%2Fzhuanlan.zhihu.com%2Fp%2F408817872 "DDP"))，由 IETF 标 准定义。iWARP 支持在标准以太网基础设施上使用 RDMA 技术，而不需要交换机支持无损以太网传输，但服务器需要使用支持iWARP 的网卡。与此同时，受 TCP 影响，性能稍差。


**需要注意的是，上述几种协议都需要专门的硬件（网卡）支持。**

![](/images/rdma/09dfad178d7550c20da6bcf7af0d8e48.png)

### 3 三种RDMA 技术实现的关系

**RoCEv1 和RoCEv2**

RoCE出现的背景：

> InfiniBand 架构获得了极好的性能，但是其不仅要求在服务器上安装专门的 InfiniBand 网卡，还需要专门的交换机硬件，成本十分昂贵。而在企业界大量部署的是以太网络，为了复用现有的以太网，同时获得 InfiniBand 强大的性能，IBTA 组织推出了 RoCE（RDMA over Converged Ethernet）。RoCE 支持在以太网上承载 IB 协议，实现 RDMA over Ethernet，这样一来，仅需要在服务器上安装支持 RoCE 的网卡，而在交换机和路由器仍然使用标准的以太网基础设施。
> 
> RoCE和IB网络层和链路层协议区别：

RoCE协议存在RoCEv1 （RoCE）和RoCEv2 （RRoCE）两个版本，主要区别：

  * RoCEv1是在以太网链路层（L2）之上用IB网络层代替了TCP/IP网络层实现的RDMA协议(交换机需要支持PFC等流控技术，在物理层保证可靠传输)，所以不支持IP路由功能。
  * RoCEv2是使用以太网TCP/IP协议中UDP+IP作为IB网络层(L3)实现,基于TCP/IP协议的网络层(L3)使得RoCEv2数据包可以被路由。(也可在三层做PFC）


RoCE可以被认为是IB的“低成本解决方案”，将IB的报文封装成以太网包进行收发。由于RoCE可以使用以太网的交换设备，所以现在在企业中应用也比较多，但是相同场景下相比IB性能要有一些损失。

![](/images/rdma/b3e2c3d4a0b0c940407c933703b8df1a.png)  RoCEv1把以太网L2以上的全部替换IB协议，RoCEv2把以太网L3以上全部替换IB协议 

![](/images/rdma/2d0efa910c08404cab4b986272348e5f.png) 图片来源： <https://zhuanlan.zhihu.com/p/361740115>

**RDMA 阵营划分（IB技术和IBoE <RoCE和iWARP>）**

在三种主流的RDMA技术中，可以划分为两大阵营:

一个是**IB技术** , 另一个是IBoE,即IB over Enthernet，支持RDMA的以太网技术，RoCE和iWARP都属于该技术。

IBoE，IB over Enthernet，所以他们可以在以太网上传播，用以太网交换机，IB协议是需要专门的硬件专门的路由器。 

其中, IBTA力挺的技术自然是IB和RoCE, Mellanox公司是这方面的急先锋。而iWARP则是IEEE/IETF力挺的技术，主要是Chelsio公司在推进。RoCE和iWARP的争论，请参考Mellanox和Chelsio这两家公司发布的白皮书。

在存储领域，支持RDMA的技术早就存在，比如SRP(SCSI RDMA Protocol)和iSER(iSCSI Extensions for RDMA)。 如今兴起的NVMe over Fabrics如果使用的不是FC网络的话，本质上就是NVMe over RDMA。 换句话说，NVMe over InfiniBand, NVMe over RoCE和NVMe over iWARP都是NVMe over RDMA。

更多有趣背景见说明见附录一。

**iWARP**

iWARP 从以下几个方面降低了主机侧网络负载：

  * TCP/IP 处理流程从 CPU 卸载到 RDMA 网卡处理，降低了 CPU 负载。
  * 消除内存拷贝：应用程序可以直接将数据传输到对端应用程序内存中，显著降低 CPU 负载。
  * 减少应用程序上、下文切换：应用程序可以绕过操作系统，直接在用户空间对 RDMA 网卡下发命令，降低了开销，显著降低了应用程序上、下文切换造成的延迟。


由于 TCP 协议能够提供流量控制和拥塞管理，因此 iWARP 不需要以太网支持无损传输，仅通过普通以太网交换机和 iWARP 网卡即可实现，因此能够在广域网上应用，具有较好的扩展性。

_RoCE和iWARP对比：_


iWARP 和RoCE 都属于IBoE，所以他们可以在以太网上传播，用以太网交换机，IB协议是需要专门的硬件专门的路由器。 

![](/images/rdma/3501a49b1499085ca0470e0ec2a02e9a.png)《RDMA 在分布式存储中的应用》 [RDMA 在分布式存储中的应用 - 道客巴巴](https://www.doc88.com/p-73847399626394.html "RDMA 在分布式存储中的应用 - 道客巴巴")


**小结**

**RDMA 、InfiniBand、IBoE、RoCE、iWARP、IB卡、IB驱动的关系**

1、RDMA 是一种技术（远程直接内存访问技术），如何实现这种技术呢？

2、实现这种技术你可以选择用 Infiniband 协议、也可以使用其他协议：roce、iwarp

支持Infiniband 协议 或 roce、iwarp 等RDMA协议的网卡，就叫RDMA网卡，当你在服务器上安装RDMA网卡之后，你还得安装RDMA驱动，才能使用RDMA网卡 。

> 在Infiniband/RoCE规范中，将RDMA网卡称为HCA，全称为Host Channel Adapter，即主机通道适配器；而在iWARP协议族中，将RDMA网卡称为RNIC，全称为RDMA enabled Network Interface Controller，即支持RDMA的网络接口控制器。

支持Infiniband 协议的网卡又称IB网卡，当你在服务器上安装了IB卡之后，你还得安装 IB驱动，才能使用 infiniband 。

3、如果你使用 Infiniband 协议，这个协议作为一个新一代网络协议。它必须依靠专门的硬件才能实现。(专用INC（网卡）—— IB卡+专用交换机===>专用网络）。

如果你使用roce、iwarp,需要专用网卡，但不需要专用网络（RDMA会转成以太网协议，继续用以太网传输）  


### 4 RDMA的特点和优势

> 传统的TCP/IP技术在数据包处理过程中，要经过操作系统及其他软件层，需要占用大量的服务器资源和内存总线带宽，数据在系统内存、处理器缓存和网络控制器缓存之间来回进行复制移动，给服务器的CPU和内存造成了沉重负担。尤其是网络带宽、处理器速度与内存带宽三者的严重"不匹配性"，更加剧了网络延迟效应。 

RDMA技术，最大的突破是将网络层和传输层放到了硬件中（服务器的网卡上）来实现，数据报文进入网卡后，在网卡硬件上就完成四层解析，直接上送到应用层软件，四层解析CPU无需干预.([《InfiniBand 与Intel Omni-Path Architecture 》- https://www.cnblogs.com/allcloud/p/8945544.html](https://www.cnblogs.com/allcloud/p/8945544.html "《InfiniBand 与Intel Omni-Path Architecture 》- https://www.cnblogs.com/allcloud/p/8945544.html"))

**RDMA是一种新的直接内存访问技术，RDMA让计算机可以直接存取其他计算机的内存，而不需要经过处理器的处理。** RDMA将数据从一个系统快速移动到远程系统的内存中，而不对操作系统造成任何影响。

在实现上，RDMA实际上是一种智能网卡与软件架构充分优化的远端内存直接高速访问技术，通过将RDMA协议固化于硬件(即网卡)上，以及支持Zero-copy和Kernel bypass这两种途径来达到其高性能的远程直接数据存取的目标。

特点

>   * **CPU Offload** ：无需CPU干预，应用程序可以访问远程主机内存而不消耗远程主机中的任何CPU。远程主机内存能够被读取而不需要远程主机上的进程（或CPU)参与。远程主机的CPU的缓存(cache)不会被访问的内存内容所填充
>   * **Kernel Bypass** ：RDMA 提供一个专有的 Verbs interface 而不是传统的TCP/IP Socket interface。应用程序可以直接在用户态执行数据传输，不需要在内核态与用户态之间做上下文切换
>   * **Zero Copy** ：每个应用程序都能直接访问集群中的设备的虚拟内存，这意味着应用程序能够直接执行数据传输，在不涉及到网络软件栈的情况下，数据能够被直接发送到缓冲区或者能够直接从缓冲区里接收，而不需要被复制到网络层。
> 

> 
> [RDMA 架构与实践 |https://houmin.cc/posts/454a90d3/](https://houmin.cc/posts/454a90d3/ "RDMA 架构与实践 |https://houmin.cc/posts/454a90d3/")

使用RDMA的优势如下：

>   * 零拷贝(Zero-copy) - 应用程序能够直接执行数据传输，在不涉及到网络软件栈的情况下。数据能够被直接发送到缓冲区或者能够直接从缓冲区里接收，而不需要被复制到网络层。
>   * 内核旁路(Kernel bypass) - 应用程序可以直接在用户态执行数据传输，不需要在内核态与用户态之间做上下文切换。
>   * 不需要CPU干预(No CPU involvement) - 应用程序可以访问远程主机内存而不消耗远程主机中的任何CPU。远程主机内存能够被读取而不需要远程主机上的进程（或CPU)参与。远程主机的CPU的缓存(cache)不会被访问的内存内容所填充。
>   * 消息基于事务(Message based transactions) - 数据被处理为离散消息而不是流，消除了应用程序将流切割为不同消息/事务的需求。
>   * 支持分散/聚合条目(Scatter/gather entries support) - RDMA原生态支持分散/聚合。也就是说，读取多个内存缓冲区然后作为一个流发出去或者接收一个流然后写入到多个内存缓冲区里去。
> 


在具体的远程内存读写中，远程应用程序在其本地网卡中注册相应的内存缓冲区，然后将 远程虚拟内存地址传送给对方，对方RDMA直接操作这些地址。远程节点的CPU除在连接建立、注册调用等之外，在整个RDMA数据传输过程中并不提供服务，因此没有带来任何负载。

关键技术：  
kernel pass、zero copy、硬件IO  
**优点：**

  1. 延迟很低
  2. 高吞吐、高效率
  3. 使用cpu资源很少


**缺点：**


  2. RDMA是通过硬件实现高带宽低时延，对CPU的负载很小。**代价是硬件的使用和管理较为复杂，且应用接口是全新的。** 不能说某个场景不适合使用，只能说收益可能没有那么大。而对时延敏感，还有CPU重负载的应用都会有很好的收益，比如传输量大的TCP应用，交互性的问答式连接。
  3. 其他  
链接：https://www.jianshu.com/p/22bbb8f029e6


![](/images/rdma/3fb74e8e0614ca99d2366f45cc54ec8e.jpeg)

[两种以太网 RDMA 协议： iWARP 和 RoCE - allcloud - 博客园](https://www.cnblogs.com/allcloud/p/7680277.html "两种以太网 RDMA 协议： iWARP 和 RoCE - allcloud - 博客园")

## 三、组织、标准和厂商

IBTA  Infiniband 行业联盟 (InfiniBand Trade Association)

成员： Compaq、Dell、HP、IBM、Intel、Microsoft 和 Sun

> CPU 性能的迅猛发展、I/O 系统的性能成为制约服务器性能的主要矛盾，要求构建下一代 I/O 架构的呼声此起彼伏。 Infiniband 行业联盟 也即 [BTA (InfiniBand Trade Association)](https://www.infinibandta.org/ "BTA \(InfiniBand Trade Association\)")，包括了当时的各大厂商 Compaq、Dell、HP、IBM、Intel、Microsoft 和 Sun。

![](/images/rdma/b577162b1a34a478ee7da8feea7f94a0.png)

更多详情见：<http://t.csdn.cn/Iswh4>

  
RDMAC（RDMA Consortium）和IBTA（InfiniBand Trade Association）主导了RDMA，RDMAC是IETF的一个补充，它主要定义的是iWRAP和iSER，IBTA是infiniband的全部标准制定者，并补充了RoCE v1 v2的标准化。

**RoCE**

InfiniBand 架构获得了极好的性能，但要求专门的 InfiniBand 网卡、交换机、路由硬件，成本十分昂贵。而在企业界大量部署的是以太网络，为了复用现有的以太网，同时获得 InfiniBand 强大的性能，IBTA 组织推出了 RoCE（RDMA over Converged Ethernet）。


更多详情见：<http://t.csdn.cn/Iswh4>

**收购**

2010年代，随着大数据和人工智能的爆发，InfiniBand 的应用场景从原来的超算等场景逐步扩散，得到了更加广泛的应用，InfiniBand 市场领导者 Mellanox 被 NVIDIA 收购，另一个主要玩家 QLogic 被 Intel 收购，Oracle 也开始制造自己的 InfiniBand 互联芯片和交换单元。

**OFED <\----RDMA的内核驱动和用户空间api库 来源**

> 以intel为例，安装intel的RDMA网卡后，需要安装irdma、rdma-core。其中irdma就是RDMA网卡的驱动（kernel RDMA subsystem），由于不同的厂家网卡不同，所以irdma是厂商提供。
> 
> 而rdma-core是用户态的api库，包含verbs api，遵守verbs标准，与硬件无关，所以可以从社区下载下来编译使用。同时perftest工具集，使用其中的ib_send_lat、ib_send_bw等工具进行RDMA测试。

IBTA 定义了RDMA传输过程中应具备的特性行为，但没有规定Verbs的具体接口和数据结构原型。这部分工作由OFA（Open Fabric Alliance）组织来完成，OFA提供了RDMA传输的一系列Verbs API。

OFA开发出了OFED（Open Fabric Enterprise Distribution）协议栈，支持多种RDMA传输层协议。

全称为OpenFabrics Enterprise Distribution，是一个开源软件包集合，其中包含内核框架和驱动、用户框架和驱动、以及各种中间件、测试工具和API文档。

开源OFED由OFA组织负责开发、发布和维护，它会定期从rdma-core和内核的RDMA子系统取软件版本，并对各商用OS发行版进行适配。除了协议栈和驱动外，还包含了perftest等测试工具。

下图为OFA给出的OFED的概览：

![](/images/rdma/a02cf6c200da397327a8524303b6475d.jpeg)

除了开源OFED之外，各厂商也会提供定制版本的OFED软件包，比如华为的HW_OFED和Mellanox的MLNX_OFED。这些定制版本基于开源OFED开发，由厂商自己测试和维护，会在开源软件包基础上提供私有的增强特性，并附上自己的配置、测试工具等。

以上三者是包含关系。无论是用户态还是内核态，整个RDMA社区非常活跃，框架几乎每天都在变动，都是平均每两个月一个版本。而OFED会定期从两个社区中取得代码，进行功能和兼容性测试后发布版本，时间跨度较大，以年为单位计。


> OFED中除了提供向下与RNIC基本的队列消息服务，向上还提供了ULP（Upper Layer Protocols），通过ULPs，上层应用不需要直接到Verbs API对接，而是借助于ULP与应用对接，常见的应用不需要做修改，就可以跑在RDMA传输层上。<\------------------ULP实现socket的api？

**Verbs API**

由OpenFabrics推动实现的一组RDMA应用编程接口（API）。地位相当于以太网编程的socket接口。传统以太网的用户，基于Socket API来编写应用程序；而RDMA的用户，基于Verbs API来编写应用程序。

Verbs API是RDMA最基本的软件接口，业界的RDMA应用，要么直接基于这组API编写，要么基于在Verbs API上又封装了一层接口的各种中间件编写。（如rdma_cm）

Verbs api 分为用户态Verbs接口和内核态Verbs接口，分别用于用户态和内核态的RDMA应用。 对于Linux系统来说，由rdma-core和内核中的RDMA子系统（如intel的irdma）提供。

![](/images/rdma/871fdf71a43087a5e6070d7e9eb7ac1c.jpeg)  


## 4\. RDMA基本术语  
  
4.1 Fabric
```
    A local-area RDMA network is usually referred to as a fabric. 
```
所谓Fabric，就是支持RDMA的局域网(LAN)。

4.2 CA(Channel Adapter)
```
    A channel adapter is the hardware component that connects a system to the fabric. 
```
CA是Channel Adapter(通道适配器)的缩写。那么，CA就是将系统连接到Fabric的硬件组件。 在IBTA中，一个CA就是IB子网中的一个终端结点(End Node)。分为两种类型，一种是HCA, 另一种叫做TCA, 它们合称为xCA。其中， HCA(_HCA：在Infiniband/RoCE规范中，将RDMA网卡称为HCA，全称为Host Channel Adapter_)是支持"verbs"接口的CA, TCA(Target Channel Adapter)可以理解为"weak CA", 不需要像HCA一样支持很多功能。 而在IEEE/IETF中，CA的概念被实体化为RNIC（RDMA Network Interface Card）, iWARP就把一个CA称之为一个RNIC。

**简言之，在IBTA阵营中，CA即HCA或TCA； 而在iWARP阵营中，CA就是RNIC。 总之，无论是HCA、 TCA还是RNIC，它们都是CA, 它们的基本功能本质上都是生产或消费数据包(packet)**

**NIC**

Network Interface Controller，网络接口控制器，也就是我们常说的**网卡** ，插上网线并进行配置之后就可以接入网络了。

**HCA（RNIC）**

它就是我们关注的重点，即**支持RDMA技术的网卡** 。在Infiniband/RoCE规范中，将RDMA网卡称为HCA，全称为Host Channel Adapter，即主机通道适配器；而在iWARP协议族中，将RDMA网卡称为RNIC，全称为RDMA enabled Network Interface Controller，即支持RDMA的网络接口控制器。

上面的概念均来自Infiniband，参看：《RDMA 架构与实践》 连接：

[RDMA 架构与实践 | Houmin](https://houmin.cc/posts/454a90d3/ "RDMA 架构与实践 | Houmin") 或 <http://t.csdn.cn/lOoTT>

##  5\. RDMA 编程


##  6\. **RDMA对于网络的诉求**

低延时（微秒级）、无损（lossless）则是最重要的指标。

**低延时**

网络转发延时主要产生在设备节点（这里忽略了光电传输延时和数据串行延时），设备转发延时包括以下三部分：

  * **存储转发延时：** 芯片转发流水线处理延迟，每个hop会产生1微秒左右的芯片处理延时（业界也有尝试使用cut-through模式，单跳延迟可以降低到0.3微秒左右）；
  * **Buffer缓存延时** ：当网络拥塞时，报文会被缓存起来等待转发。这时Buffer越大，缓存报文的时间就越长，产生的时延也会更高。对于RDMA网络，Buffer并不是越大越好，需要合理选择；
  * **重传延时：** 在RDMA网络里会有其他技术确保不丢包，这部分不做分析。


**无损**


在这个限制条件下，RDMA实现无损主要是依赖基于PFC和ECN的网络流控技术。


**RMDA 中专有名词和对应缩写：**

Channel-IO：RDMA 在本端应用和远端应用间创建的一个消息通道；

Queue Pairs（QP）：每个消息通道两端是两对QP;

Send Queue（SQ）： 发送队列，队列中的内容为WQE；

Receive Queue（RQ）：接收队列，队列中的内容为WQE；

Work Queue Element（WQE）：工作队列元素，WQE指向一块用于存储数据的Buffer;

Work Queue(WQ): 工作队列，在发送过程中 WQ = SQ; 在接收过程中WQ = WQ;

Complete Queue（CQ）: 完成队列，CQ用于告诉用户WQ上的消息已经被处理完成；

Work Request(WR）：传输请求，WR描述了应用希望传输到Channel对端的消息内容，在WQ中转化为 WQE 格式的信息；

## 附录

### 附录一 IB 和ROCE、iWARP发展历程和主导厂商

  
链接：https://www.zhihu.com/question/59122163/answer/208899370

讲一点，InfiniBand (以下简称IB)只是RDMA实现方式的一种！RDMA本身只是一种概念，具体实现不同厂商都有自己的实现方式，目前市场上能见到的RDMA产品可以分为三类：

1\. InfiniBand --- 这个最早是IBM和HP等一群大佬在做，现在主要交给以色列的Mellanox (IBM 控股)，但是InfiniBand从L2到L4都需要自己的专有硬件，所以成本非常高！

2\. RoCE --- RDMA over Converged Ethernet，RoCE这个东西实际上是Mellanox鉴于IB过于昂贵这个事实推出的一种低成本的产品，实际上的核心就是把IB的包架在通用Ethernet上发出去，因此对于RoCE，实际上它的二层包头已经是普通以太网的包头。

3\. iWARP --- iWARP直接将RDMA实现在了TCP上，优点是成本最低，只需要采购支持iWARP的NIC即可使用RDMA，缺点是性能不好，因为TCP本身协议栈过于重量级，即便是按照一般iWARP厂商的做法将TCP offload到硬件上实现，也很难追上IB和RoCE的性能。目前在做iWARP的主要是Intel和Chelsio两家，从现在的观察Chelsio略胜一筹，而Intel则有点想放弃iWARP转投RoCE之势。

需要说明的一点，其实不管是iWARP还是RoCE，实际上并不是自己重新发明了RDMA，而是利用了IB的上层接口修改了下层的实现，所以RoCE这个名字并不是很准确，比较准确的说法应该是IB over Converged Ethernet。此外，三种实现方式使用的user space api是一样的，都是libibverbs，这个东西原本也就是给IB用的，相当于IB的socket。

关于市场，实际上RDMA的市场一直都不算太小，传统的IB主要面向的是HPC，HP和IBM一直在使用，但是毕竟HPC只是企业级里面一块很小的业务，也不是什么企业都需要或者用得起HPC的。现在比较值得注意的一点是Intel实际上提出来了一种概念叫做“新型RDMA应用”，即传统的RDMA应用对lat和bw都非常敏感，而新型RDMA应用则在lat上可以相对宽松，但是却要求在短时间内爆发式的单播或者广播(因为RDMA在协议栈层就支持可靠广播)大量的数据包。比较典型的一个应用是现在很火的大数据，IBM做了一个东西叫做Spark over RDMA，视频链接如下 (需翻墙)：

[https://www.youtube.com/watch?v=t_4Ao2fNAfU](https://link.zhihu.com/?target=https%3A//www.youtube.com/watch%3Fv%3Dt_4Ao2fNAfU "https://www.youtube.com/watch?v=t_4Ao2fNAfU")

该方案修改了Spark的底层网络框架，充分利用了Mellanox 100G RoCE的可靠广播功能，差不多比100G TCP性能提高了6～7倍。除了大数据之外，存储市场是将来RDMA发展的一个主要方向，事实上RDMA已经成为了下一代存储网络的事实标准。国内有一家公司叫XSky给Ceph贡献了5%的代码，Ceph over RDMA就是他们实现的印象中EMC还给过他们一大笔投资。存储网络中对RDMA的使用实际上很大一部分原因是现在SSD和NVMe SSD在企业级存储中的应用。举个简单栗子：

在10G网络上，如果用iscsi架构，iodepth=32，block-size=4k， random-read-write，TCP能实现的iops约为160～170k，这个数字对于一般的HDD阵列来讲已经足够，因为HDD阵列本身速度较慢。但是对于SSD单盘180k以上的iops，显然TCP性能是不足的，更遑论NVMe SSD单盘550k的ipos。因此，在SSD时代的存储网络中，RDMA几乎是一个必选项。

[在各互联网公司中，有将 RDMA 技术用于生产环境的实例吗？ - 知乎](https://www.zhihu.com/question/59122163/answer/208899370 "在各互联网公司中，有将 RDMA 技术用于生产环境的实例吗？ - 知乎")

### 附录二 IB和ROCE数据包格式和出包方式

#### IB和ROCE数据包格式

**RoCEv2 详细讨论**

在基于以太网的版本中，下面重点选择RoCEv2来讨论。

可以看出，RoCEv2的协议栈包括IB传输层、TCP/UDP、IP和Ethernet，其中，后面三层都使用了TCP/IP中相应层次的封包格式。

**RoCEv2的封包格式**

RoCEv2的封包格式如下图所示。

![封包格式](/images/rdma/c6d249a43dc6ad916e34113b9d0b22e1.png)

其中，UDP包头中，目的端口号为4791即代表是RoCEv2帧。

IB BTH即InfiniBand Base Transport Header，定义了IB传输层的相应头部字段。

IB Payload即为消息负载。ICRC和FCS分别对应冗余检测和帧校验。

**IB BTH格式和字段定义**

IB BTH格式和字段定义如下图。

![BTH格式和字段定义如下图](/images/rdma/e080b421b0dd13389d3ec1a5dea0d45f.png)

其中，Opcode用于表明该包的type或IB PayLoad中更高层的协议类型。

S是Solicited Event的缩写，表明回应者产生应该产生一个事件。

M是MigReq的缩写，一般用于迁移状态。Pad表明有多少额外字节被填充到IB PayLoad中。

TVer即Transport Header Version，表明该包的版本号。

Partition Key用来表征与本Packet关联的逻辑内存分区。

rsvd是reserved的缩写，该字段是保留的。

Destination QP表明目的端Queue Pair序号。

A是Acknowledge Request，表示该packet的应答可由响应者调度。

PSN是Packet Sequence Number，用来检测丢失或重复的数据包。

#### RDMA网卡出包

最后，顺带说下RDMA网卡的出包。

如前文所述，RDMA是一种智能网卡与软件架构充分优化的远端内存直接高速访问技术，通过将RDMA技术固化于网卡上实现，

即，在RoCEv2协议栈中，IB BTH、UDP、IP以及Ethernet Layer全是固化在网卡上的。

用户空间的Application通过OFA Stack(亦或其他组织编写的RDMA stack)提供的verbs编程接口(比如WRITE、READ、SEND等)形成IB payload，接下来便直接进入硬件，由RDMA网卡实现负载的层层封装。

![](/images/rdma/d4a7cca1b6a4380ea1545dddde6af299.jpeg)

如上图，在传统模式下，两台服务器上的应用之间传输数据，过程是这样的：

  * 首先要把数据从应用缓存拷贝到Kernel中的TCP协议栈缓存；
  * 然后再拷贝到驱动层；
  * 最后拷贝到网卡缓存。


多次内存拷贝需要CPU多次介入，导致处理延时大，达到数十微秒。同时整个过程中CPU过多参与，大量消耗CPU性能，影响正常的数据计算。

在RDMA 模式下，应用数据可以绕过Kernel协议栈直接向网卡写数据，带来的显著好处有：

  * 处理延时由数十微秒降低到1微秒内；
  * 整个过程几乎不需要CPU参与，节省性能；
  * 传输带宽更高。


### 附录三 图片和摘抄备份

图：

[RDMA-远程直接内存访问-01-RDMA 协议 iWARP 和 RoCE | Echo Blog](https://houbb.github.io/2019/11/20/rdma-01-protocol "RDMA-远程直接内存访问-01-RDMA 协议 iWARP 和 RoCE | Echo Blog")

**传统**

![TCP/IP 流程](/images/rdma/063050610b559dbfb07139a8c575aee3.png)

**RDMA 方式**

![RDMA](/images/rdma/eb906c1f1a435a301b77a410b72bdcfe.png)

如上图，在传统模式下，两台服务器上的应用之间传输数据，过程是这样的：

  * 首先要把数据从应用缓存拷贝到Kernel中的TCP协议栈缓存；
  * 然后再拷贝到驱动层；
  * 最后拷贝到网卡缓存。


多次内存拷贝需要CPU多次介入，导致处理延时大，达到数十微秒。同时整个过程中CPU过多参与，大量消耗CPU性能，影响正常的数据计算。

在RDMA 模式下，应用数据可以绕过Kernel协议栈直接向网卡写数据，带来的显著好处有：

  * 处理延时由数十微秒降低到1微秒内；
  * 整个过程几乎不需要CPU参与，节省性能；
  * 传输带宽更高。


