---
title: "RDMA 之 Verbs 和编程步骤"
description: "介绍 RDMA Verbs API 体系、用户态与内核态 Verbs 接口、编程步骤与 WR/WC 的处理流程。"
date: "2026-07-19"
order: 13
tags: ["RDMA", "Verbs", "编程步骤", "API"]
---
# RDMA 之 Verbs 和编程步骤


---

**目录**

RDMA编程基础

什么是Verbs

相关名词解释

Verbs API

Verbs API是什么

设计Verbs API的原因

Verbs API所包含的内容

使用Verbs API编写RDMA应用程序

查看接口定义

包含头文件

编写应用

编译 & 执行

官方示例程序

libibverbs

librdmacm

参考文献

RDMA编程流程

ibv_poll_cq()

ibv_req_notify_cq()

ibv_get_cq_event()

Errors记录

IBV_WC_WR_FLUSH_ERR(5/0x5)

IBV_WC_RNR_RETRY_EXC_ERR(13/0xd)

* * *


原文：[access open 知乎_12. RDMA之Verbs_暴躁的巨锤的博客-CSDN博客](https://blog.csdn.net/weixin_33978451/article/details/112398245 "access open 知乎_12. RDMA之Verbs_暴躁的巨锤的博客-CSDN博客")

# RDMA编程基础

[存储大师班 | RDMA简介与编程基础 - 知乎](https://zhuanlan.zhihu.com/p/387549948 "存储大师班 | RDMA简介与编程基础 - 知乎")

[RDMA 和传统网卡编程的区别：​​​​​​NVMe over Fabrics又让RDMA技术火了一把 - rodenpark - 博客园](https://www.cnblogs.com/rodenpark/p/6220474.html "RDMA 和传统网卡编程的区别：​​​​​​NVMe over Fabrics又让RDMA技术火了一把 - rodenpark - 博客园")

# 什么是Verbs

Verbs直译过来是“动词”的意思，它在RDMA领域中有两种含义：

**1) 由IB规范所描述的一组抽象定义**

规定了各厂商的软硬件在各种Verbs下应该执行的动作或者表现出的行为，IB规范并未规定如何编程实现这些Verbs，在这种含义下，Verbs是与操作系统无关的。

举个例子，IB规范要求所有RDMA设备必须支持Create QP的行为（IB 规范11.2.5.1）：

> 描述：   
>  ​ 为指定的设备创建一个QP。   
>  ​ 用户必须指定一组用于初始化QP的属性。   
>  ​ 如果创建QP所需的属性有非法值或者缺失，那么应该返回错误，该QP不会被创建；如果成功， 那么返回该QP的指针和QPN。   
>  ​ ……   
>  输入：   
>  ​ 设备指针；   
>  ​ SQ关联到的CQ；   
>  ​ RQ关联到的CQ，如果是XRC的INI QP，则可以不携带此参数；   
>  ​ ……   
>  输出：   
>  ​ 新创建的QP的指针；   
>  ​ QP Number;   
>  ​ SQ的最大WR容量。   
>  ​ …… 

可以看出IB规范中的Verbs是对一个概念进行定义，讲的是“需要支持什么，但具体怎么实现我不做规定”。

**2) 由OpenFabrics推动实现的一组RDMA应用编程接口（API）**

既然是API，那么必然和运行的操作系统相关。Verbs API有Linux版本以及Windows版本（Windows版很久没有更新了）。

以Create QP为例，下文引用自Linux用户态Verbs API的帮助文档（ibv_create_qp(3): create/destroy queue pair）：

> 名称：   
>  ​ ibv_create_qp - create a queue pair (QP)   
>  概要： 
> 
> `#include <infiniband/verbs.h>  
>  struct ibv_qp ibv_create_qp(struct ibv_pd pd, struct ibv_qp_init_attr *qp_init_attr);`

描述：  
​ ibv_create_qp()通过一个关联的PD创建一个QP，参数qp_init_attr是一个ibv_qp_init_attr类型的结构体，其定义在<infiniband/verbs.h>中。

> struct ibv_qp_init_attr {
> 
> struct ibv_cq *send_cq; /* CQ to be associated with the Send Queue (SQ) */  
>  struct ibv_cq *recv_cq; /* CQ to be associated with the Receive Queue (RQ) */  
>  struct ibv_srq *srq; /* SRQ handle if QP is to be associated with an SRQ, otherwise NULL */  
>  struct ibv_qp_cap cap; /* QP capabilities */  
>  enum ibv_qp_type qp_type; /* QP Transport Service Type: IBV_QPT_RC, IBV_QPT_UC, or IBV_QPT_UD */  
>  ...
> 
> };

​ 函数ibv_create_qp()会更新qp_init_attr->cap struct的内容，返回创建的QP所真正支持的规格……  
返回值：  
​ ibv_create_qp()返回被创建的QP的指针，或者在失败时返回NULL。QPN将在返回的指针所指向的结构体中。

可见Verbs API即是对IB规范中的Verbs定义的具体软件实现。

Verbs的第一种语义直接查阅IB规范的第11章即可，里面做了非常详细的描述。

本文介绍的是第二种语义，包含Verbs API是什么，如何和硬件产生交互，我们如何通过Verbs API来编写RDMA程序。如无特殊说明，下文中的Verbs均特指Verbs API。

# 相关名词解释

  * **rdma-core**



指**开源RDMA用户态软件协议栈** ，（用户空间的驱动）包含用户态框架、各厂商用户态驱动、API帮助手册以及开发自测试工具等。

rdma-core在github上维护，我们的用户态Verbs API实际上就是它实现的。<https://github.com/linux-rdma/rdma-core>

  * **kernel RDMA subsystem**



指**开源的Linux内核中的RDMA子系统** ，（内核空间的驱动）包含RDMA内核框架及各厂商的驱动。

RDMA子系统跟随Linux维护，**是内核的的一部分** 。一方面提供内核态的Verbs API，一方面负责对接用户态的接口。

  * **FED**



全称为OpenFabrics Enterprise Distribution，是一个**开源软件包集合** ，其中包含内核框架和驱动、用户框架和驱动、以及各种中间件、测试工具和API文档。

开源OFED由OFA组织负责开发、发布和维护，它会定期从rdma-core和内核的RDMA子系统取软件版本，并对各商用OS发行版进行适配。除了协议栈和驱动外，还包含了**perftest** 等测试工具。

（源码仓：<https://github.com/linux-rdma/>）

下图为OFA给出的OFED的概览：

![43666da8107d1235b94797d995820b3b.png](images\\43666da8107d1235b94797d995820b3b.png)

除了开源OFED之外，各厂商也会提供定制版本的OFED软件包，比如华为的HW_OFED和Mellanox的MLNX_OFED。这些定制版本基于开源OFED开发，由厂商自己测试和维护，会在开源软件包基础上提供私有的增强特性，并附上自己的配置、测试工具等。

以上三者是包含关系。无论是用户态还是内核态，整个RDMA社区非常活跃，框架几乎每天都在变动，都是平均每两个月一个版本。而OFED会定期从两个社区中取得代码，进行功能和兼容性测试后发布版本，时间跨度较大，以年为单位计。

# Verbs API

## Verbs API是什么

Verbs API 操作RDMA的函数接口，也就是说业界的RDMA应用，要么直接基于这组API编写，要么基于在Verbs API上又封装了一层接口的各种中间件编写。（rdma_cm）

Verbs API向用户提供了有关RDMA的一切功能，典型的包括：注册MR、创建QP、Post Send、Poll CQ等等。

对于Linux系统来说，**Verbs的功能由rdma-core和内核中的RDMA子系统提供** ，分为用户空间驱动的 Verbs api和内核空间驱动的Verbs api，分别用于用户态和内核态的RDMA 程序。

结合上一部分的内容，我们给出一个OFED的全景：

![e0eba2a4af3d4e6179e178ec3a005632.png](images\\e0eba2a4af3d4e6179e178ec3a005632.png)

**广义的Verbs API主要由两大部分组成verbs和rdma_cm：**

**verbs和rdma_cm的区别：**[【RDMA】rdma_cm和verbs的区别_bandaoyu的笔记-CSDN博客](https://blog.csdn.net/bandaoyu/article/details/115668933 "【RDMA】rdma_cm和verbs的区别_bandaoyu的笔记-CSDN博客")

**1、****IB_VERBS**

接口以ibv_xx（用户态）或者ib_xx（内核态）作为前缀，是最基础的编程接口，使用IB_VERBS就足够编写RDMA应用了。

比如：

  * ibv_create_qp() 用于创建QP
  * ibv_post_send() 用于下发Send WR
  * ibv_poll_cq() 用于从CQ中轮询CQE



**2、RDMA_CM**

以rdma_为前缀，主要分为两个功能：

1）CMA（Connection Management Abstraction）---- 建连连接管理

在Socket和Verbs API基础上实现的，用于CM建链并交换信息的一组接口。CM建链是在Socket基础上封装为QP实现，从用户的角度来看，是在通过QP交换之后数据交换所需要的QPN，Key等信息。

比如：

  * rdma_listen()用于监听链路上的CM建链请求。
  * rdma_connect()用于确认CM连接。



2）CM VERBS ----收发数据

RDMA_CM也可以用于~~数据交换~~ (收发数据），相当于在verbs API上又封装了一套数据交换接口。

比如：

  * rdma_post_read()可以直接下发RDMA READ操作的WR，而不像ibv_post_send()，需要在参数中指定操作类型为READ。
  * rdma_post_ud_send()可以直接传入远端QPN，指向远端的AH，本地缓冲区指针等信息触发一次UD SEND操作。



上述接口虽然方便，但是需要配合CMA管理的链路使用，不能配合Verbs API使用。

Verbs API除了IB_VERBS和RDMA_CM之外，还有MAD（Management Datagram）接口等。

**需要注意的是，软件栈中的Verbs API具体实现和IB规范中的描述并不是完全一致的。IB规范迭代较慢，而软件栈几乎每天都有变化，所以编写应用或者驱动程序时，应以软件栈API文档中的描述为准。**

狭义的Verbs API专指以ibv_/ib_为前缀的用户态Verbs接口，因为RDMA的典型应用是在用户态，下文主要介绍用户态的Verbs API。

## 设计Verbs API的原因

传统以太网的用户，基于Socket API来编写应用程序；**而RDMA的用户，基于Verbs API来编写应用程序。**

RDMA有三种协议IB/iWARP/RoCE，设计Verbs API通过统一接口，让同一份RDMA程序程序可以无视底层的硬件和链路差异运行在不同的环境中。

## Verbs API所包含的内容

用户态Verbs API主要包含两个层面的功能：

为方便讲解，下面对各接口的形式做了简化，格式为"_返回值1,返回值2_ **函数名**(_参数1, 参数2_)"

**1）控制面：**

**设备管理：**

  * _device_list_ **ibv_get_device_list**()



用户获取可用的RDMA设备列表，会返回一组可用设备的指针。

  * _device_context_ **ibv_open_device**(_device_)



打开一个可用的RDMA设备，返回其上下文指针（这个指针会在以后用来对这个设备进行各种操作）。

  * _device_attr, errno**ibv_query_device**(_device_context*)



查询一个设备的属性/能力，比如其支持的最大QP，CQ数量等。返回设备的属性结构体指针，以及错误码。

**资源的创建，查询，修改和销毁：**

  * _pd_ **ibv_alloc_pd**(_device_context_)



申请PD。该函数会返回一个PD的指针。(PD(内存)保护域--见:[【RDMA】技术详解（三）：理解RDMA Scatter Gather List|聚散表_bandaoyu的笔记-CSDN博客](https://blog.csdn.net/bandaoyu/article/details/112859981 "【RDMA】技术详解（三）：理解RDMA Scatter Gather List|聚散表_bandaoyu的笔记-CSDN博客")）

  * _mr_ **ibv_reg_mr**(_pd, addr, length, access_flag_)



注册MR。用户传入要注册的内存的起始地址和长度，以及这个MR将要从属的PD和它的访问权限（本地读/写，远端读/写等），返回一个MR的指针给用户。

  * _cq_**ibv_create_cq**(_device_context, cqe_depth, ..._)



创建CQ。用户传入CQ的最小深度（驱动实际申请的可能比这个值大），然后该函数返回CQ的指针。

  * _qp_ **ibv_create_qp**(_pd, qp_init_attr_)



创建QP。用户传入PD和一组属性（包括RQ和SQ绑定到的CQ、QP绑定的SRQ、QP的能力、QP类型等），向用户返回QP的指针。（SRQ=shared receive queue）

  * _errno_ **ibv_modiy_qp**(_qp, attr, attr_mask_)



修改QP。用户传入QP的指针，以及表示要修改的属性的掩码和要修改值。修改的内容可以是QP状态、对端QPN(QP的序号)、QP能力、端口号和重传次数等等。如果失败，该函数会返回错误码。  
Modify QP最重要的作用是让QP在不同的状态间迁移，完成RST-->INIT-->RTR-->RTS的状态机转移后才具备下发Send WR的能力。也可用来将QP切换到ERROR状态。

  * _errno_ **ibv_destroy_qp**(_qp_)



销毁QP。即销毁QP相关的软件资源。其他的资源也都有类似的销毁接口。

**中断处理：**

  * _event_info, errno_ **ibv_get_async_event**(_device_context_)



从事件队列中获取一个异步事件，返回异步事件的信息（事件来源，事件类型等）以及错误码。

**连接管理**

  * rdma_xxx()



用于CM建链，不在本文展开讲。

  * ...



**2）数据面：**

**下发WR**

  * _bad_wr, errno_ **ibv_post_send**(_qp, wr_)



向一个QP下发一个Send WR，参数 _wr_ 是一个结构体，包含了WR的所有信息。包括wr_id、sge数量、操作码（SEND/WRITE/READ等以及更细分的类型）。

WR的结构会根据服务类型和操作类型有所差异，比如**RC服务** 的WRITE和READ操作的WR会包含远端内存地址和R_Key，**UD服务** 类型会包含AH，远端QPN和Q_Key等。

WR经由驱动进一步处理后，会转化成WQE下发给硬件。

出错之后，该接口会返回出错的WR的指针以及错误码。

  * _bad_wr, errno_**ibv_post_recv**(_qp, wr_)



同ibv_post_send，只不过是专门用来下发RECV操作WR的接口。

**获取WC**

  * _num, wc_**ibv_poll_cq**(_cq, max_num_)



从完成队列CQ中轮询CQE，用户需要提前准备好内存来存放WC，并传入可以接收多少个WC。该接口会返回一组WC结构体（其内容包括wr_id，状态，操作码，QPN等信息）以及WC的数量。

# 使用Verbs API编写RDMA应用程序

(RDMA通信流程;[RDMA简要介绍_baidu_14946515的博客-CSDN博客](https://blog.csdn.net/baidu_14946515/article/details/84201240 "RDMA简要介绍_baidu_14946515的博客-CSDN博客"))

  * ### **查看接口定义**




**内核态**

内核态Verbs接口没有专门的API手册，编程时需要参考头文件中的函数注释。声明这些接口的头文件位于内核源码目录中的：

.../include/rdma/ib_verbs.h

比如ib_post_send()接口：

![bcd542df2b9ba4968da751fa7e71fa47.png](images\\bcd542df2b9ba4968da751fa7e71fa47.png)

函数注释中有明确介绍该函数的作用，输入、输出参数以及返回值。

**用户态**

有多种方法查阅用户态的Verbs API：

  * **在线查阅最新man page**



用户态的Verbs API手册跟代码在一个仓库维护，手册地址：

https://github.com/linux-rdma/rdma-core/tree/master/libibverbs/man

这里是按照Linux的man page格式编写的源文件，直接看源文件可能不太直观。有很多在线的man page网站可以查阅这些接口的说明，比如官方的连接：

https://man7.org/linux/man-pages/man3/ibv_post_send.3.html

也有一些其他非官方网页，支持在线搜索：

https://linux.die.net/man/3/ibv_post_send

[You searched for ibv_post_send - RDMAmojo RDMAmojo](https://www.rdmamojo.com/?s=ibv_post_send "You searched for ibv_post_send - RDMAmojo RDMAmojo") (推荐）

  * **查阅系统man page**




如果你使用的商用OS安装了rdma-core或者libibverbs库，那么可以直接用man命令查询接口：
[code] 
    man ibv_post_send
[/code]

![e0d2fb93b12caf6996274de5b19dd75b.png](images\\e0d2fb93b12caf6996274de5b19dd75b.png)

  * **查询Mellanox的编程手册**



《RDMA Aware Networks Programming User Manual Rev 1.7》，最新版是2015年更新的。该手册写的比较详尽，并且附有示例程序，但是可能与最新的接口有一些差异。

### **包含头文件**

按需包含以下头文件：
[code] 
    #include <infiniband/verbs.h> // IB_VERBS 基础头文件
    
    #include <rdma/rdma_cma.h> // RDMA_CM CMA 头文件 用于CM建链
    
    #include <rdma/rdma_verbs.h> // RDMA_CM VERBS 头文件 用于使用基于CM的Verbs接口
[/code]

### 编写应用

下面附上一个简单的RDMA程序的大致接口调用流程，Client端的程序会发送一个SEND请求给Server端的程序，图中的接口上文中都有简单介绍。

需要注意的是图中的**建链过程** 是为了交换对端的GID _（相当于TCP中的IP）_ ，QPN _（QP序号）_ 等信息，可以通过传统的Socket接口实现，也可以通过本文中介绍的**CMA** 接口实现。

图中特意列出了多次**modify QP** 的流程，一方面是**把建链之后交互得到的信息存入QPC** 中（即QP间建立连接的过程），另一方面是为了（转换状态）使QP处于具备收/发能力状态才能进行下一步的数据交互。具体状态机的内容请回顾9. RDMA之Queue Pair

（假设A节点的某个QP要跟B节点的某个QP交换信息，除了要知道B节点的**QP序号——QPN** 之外，还需要GID--（相当于TCP中的IP），在传统TCP-IP协议栈中，使用了家喻户晓的IP地址来标识网络层的每个节点。而IB协议中的这个标识被称为**GID（Global Identifier，全局ID）**[8\. RDMA之Address Handle - 知乎](https://zhuanlan.zhihu.com/p/163552044 "8. RDMA之Address Handle - 知乎")）

![3bba5d9bae953ee8ca3519516cbfdec5.png](images\\3bba5d9bae953ee8ca3519516cbfdec5.png)

### 编译 & 执行

不在本文讨论范围内。

### 官方示例程序

rdma-core的源码目录下，为libibverbs和librdmacm都提供了简单的示例程序，大家编程时可以参考。

### libibverbs

位于rdma-core/libibverbs/examples/目录下，都使用最基础的IB_VERBS接口实现，所以建链方式都是基于Socket的。

  * asyncwatch.c 查询指定RDMA设备是否有异步事件上报
  * device_list.c 列出本端RDMA设备列表
  * devinfo.c 查询并打印本端RDMA设备详细信息，没有双端数据交互
  * rc_pingpong.c 基于RC服务类型双端数据收发示例
  * srq_pingpong.c 基于RC服务类型双端数据收发示例，与上一个示例程序的差异是使用了SRQ而不是普通的RQ。
  * ud_pingpong.c 基于UD服务类型双端数据收发示例
  * ud_pingpong.c 基于UC服务类型双端数据收发示例
  * xsrq_pingpong.c 基于XRC服务类型双端数据收发示例



### librdmacm

位于rdma-core/librdmacm/examples/目录下：

  * rdma_client/server.c 基础示例，通过CM建链并使用CM VERBS进行数据收发。



该目录剩下的程序就没有研究了。

# 参考文献

[1] RDMA Aware Networks Programming User Manual Rev 1.7

[2] part1-OFA_Training_Sept_2016

[3] https://en.wikipedia.org/wiki/OpenFabrics_Alliance

# RDMA编程流程

使用RDMA传输协议，能满足低时延要求。目前有两张硬件可以使用RDMA传输，一个是infiniband，一个是RDMA over Ethernet，由于IB的成本较高，所以RoCE成为一种趋势。

RoCE可以在以太网上运行RDMA协议，时延比普通以太网可以提升30%以上，也可以支持双协议栈，同时用TCP和RDMA，编程过程类似IB。

有两张建链方式，一种是通过RDMA_CM建链，一种是先通过TCP建链，通过tcp通道交换双方的设备信息，QP信息，简历RDMA链路，然后关闭tcp链路，第二种更常用。  
  
原文：https://blog.csdn.net/fellow0305/article/details/52900749

**RDMA编程流程**

1）初始化RDMA设备

ibv_get_device_list（）获取使用可以使用RDMA传输的设备个数，可以根据ibv_get_device_list结构中的dev_name找到需要使用的设备；

struct ibv_device **ibv_get_device_list(int *num_devices)；

ibv_open_device()打开设备，获取设备句柄；

ibv_query_device（）查询设备，获取设备属性

ibv_query_port（）查询设备端口属性

如果类型为Ethernet，bv_query_gid（）获取设备GID，用于交换双方信息使用

2）创建QP信息

ibv_alloc_pd（）用于创建qp接口的参数

ibv_create_cq（）创建CQ，一个CQ可以完成的CQE的个数，CQE与队列个数有关，队列多，CQE个数就设置多，否则设置少，一个CQ可以对应一个QP，也可以两个CQ对应一个QP。一个CQ包含发送和接收队列。

ibv_create_qp（）创建QP。类似tcp的socket

3）注册MR信息

ibv_reg_mr（）注册网卡内存信息，把操作系统物理内存注册到网卡

4）交换QP信息

ibv_modify_qp（）交换双方QP信息，修改QP信息状态级

Client端：先创建QP，修改状态级reset到INIT，修改INIT到RTR，然后发送到server端，server端创建QP，修改状态机有INIT到RTR，然后发送到客户端，客户端修改状态机有RTR到RTS，发送到server端，server端修改状态机有RTR到RTS，这样rmda链路简建立成功。

5）发送和接收

ibv_post_recv（）接收消息接口

ibv_post_send（）发送消息接口

ibv_poll_cq（）用于查询cq队列是否有事件产生，如果有调用recv接口接收。

(fellow0305)

![](/images/rdma/\ec705cadfe79ccd18ad1360b019b4d17.png)

**例子**

下面的代码示例演示了一种处理完成事件的可能方法。它执行以下步骤：

第一阶段：准备

1.创建一个CQ

2.请求在新的（第一个）完成事件上进行通知

第二阶段：完成处理程序

3.等待完成事件并确认

4.要求在下一次完成活动时发出通知

5.清空CQ

注意，可能会触发额外事件，而无需在CQ中具有相应的完成条目。如果将完成条目添加到步骤4和步骤5之间的CQ，然后在步骤5中清空（轮询）CQ，则会发生这种情况。
[code] 
    cq = ibv_create_cq(ctx, 1, ev_ctx, channel, 0);
    if (!cq)
    {
        fprintf(stderr, "Failed to create CQ\n");
        return 1;
    }
    
    /* Request notification before any completion can be created */
    if (ibv_req_notify_cq(cq, 0))
    {
        fprintf(stderr, "Couldn't request CQ notification\n");
        return 1;
    }
    
    .
    .
    .
    
    /* Wait for the completion event */
    if (ibv_get_cq_event(channel, &ev_cq, &ev_ctx))
    {
        fprintf(stderr, "Failed to get cq_event\n");
        return 1;
    }
    /* Ack the event */
    ibv_ack_cq_events(ev_cq, 1);
    
    /* Request notification upon the next completion event */
    if (ibv_req_notify_cq(ev_cq, 0))
    {
        fprintf(stderr, "Couldn't request CQ notification\n");
        return 1;
    }
    
    /* Empty the CQ: poll all of the completions from the CQ (if any exist)
    */
    do
    {
        ne = ibv_poll_cq(cq, 1, &wc);
        if (ne < 0)
        {
            fprintf(stderr, "Failed to poll completions from the CQ\n");
            return 1;
        }
        /* there may be an extra event with no completion in the CQ */
        if (ne == 0)
            continue;
    
        if (wc.status != IBV_WC_SUCCESS)
        {
            fprintf(stderr, "Completion with status 0x%x was found\n",
                    wc.status);
            return 1;
        }
    }
    while (ne);
    The following code example demonstrates one possible way to work with 
    completion events in non - blocking mode. It performs the following steps:
    1. Set the completion event channel to be non - blocked
    2. Poll the channel until there it has a completion event
    3. Get the completion event and ack it
    
    /* change the blocking mode of the completion channel */
    flags = fcntl(channel->fd, F_GETFL);
    rc = fcntl(channel->fd, F_SETFL, flags | O_NONBLOCK);
    if (rc < 0)
    {
        fprintf(stderr, "Failed to change file descriptor of completion event channel\n");
        return 1;
    }
    /*
     * poll the channel until it has an event and sleep ms_timeout
     * milliseconds between any iteration
     */
    my_pollfd.fd      = channel->fd;
    my_pollfd.events  = POLLIN;
    my_pollfd.revents = 0;
    do
    {
        rc = poll(&my_pollfd, 1, ms_timeout);
    }
    while (rc == 0);
    if (rc < 0)
    {
        fprintf(stderr, "poll failed\n");
        return 1;
    }
    ev_cq = cq;
    /* Wait for the completion event */
    if (ibv_get_cq_event(channel, &ev_cq, &ev_ctx))
    {
        fprintf(stderr, "Failed to get cq_event\n");
        return 1;
    }
    /* Ack the event */
    ibv_ack_cq_events(ev_cq, 1);
[/code]

### **ibv_poll_cq()**
[code] 
    intibv_poll_cq(structibv_cq *cq,intnum_entries,structibv_wc *wc);
    
[/code]

用于从 Completion Queue 中查询已完成的 Work Request。

所有的 Receive Request、signaled Send Request 和出错的 Send Request 在完成之后都会产生一个 Work Completion，Work Completion 就被放入完成队列（Completion Queue）中。

完成队列是 FIFO 的，ibv_poll_cq() 检查是否有 Work Completion 在完成队列中，如果是那么就将队首弹出，并返回那个 Work Completion 到 *wc 中。

ibv_wc 的结构如下，描述了一个 Work Completion 的情况。
[code] 
    structibv_wc {
    uint64_twr_id;
    enumibv_wc_status status;
    enumibv_wc_opcode opcode;
    uint32_tvendor_err;
    uint32_tbyte_len;
    uint32_timm_data;
    uint32_tqp_num;
    uint32_tsrc_qp;
    intwc_flags;
    uint16_tpkey_index;
    uint16_tslid;
    uint8_tsl;
    uint8_tdlid_path_bits;
    };
    
[/code]

  * wr_id 由产生 Work Completion 的 Request 决定

  * status 是操作的状态，通常为 IBV_WC_SUCCESS 表示 Work Completion 成功完成，其他还有一些错误信息

  * opcode 表示当前的 Work Competition 是怎么产生的

  * bute_len 表示传输的字节数




参数说明：

Name| Direction| Description  
---|---|---  
*cq| in| 用于存放 Work Completion 的完成队列  
num_entries| in| 表示最大从完成队列中读取多少个 Work Completion  
*wc| out| 将读取到的 Work Completion 返回出来，如果有多个则返回的是数组  
  
函数的返回值：成功则返回读取到的 Work Completion 数量，为 0 表示未读取到 Work Completion，可认为是完成队列为空，为负值则表示读取出错。

### ibv_req_notify_cq()
[code] 
    intibv_req_notify_cq(structibv_cq *cq,intsolicited_only);
    
[/code]

用于在完成队列中请求一个完成通知。

调用 ibv_req_notify_cq() 之后，下一个被加到 CQ 中的请求（发送请求或者接收请求）会被加上通知标记，当请求完成产生一个 Work Completion 之后就会产生通知，完成通知将被 ibv_get_cq_event() 函数读取出来。

传入的参数中：

  * solicited_only 为 0 时表示无论下一个加入 CQ 的请求是哪种类型的都会产生通知，否则只有 Solicited 或者出错的 Work Completion 才会产生通知



### ibv_get_cq_event()
[code] 
    intibv_get_cq_event(structibv_comp_channel *channel,
    structibv_cq **cq,void**cq_context);
    
[/code]

用于等待某一 channel 中的下一个通知产生。

ibv_get_cq_event() 默认是一个阻塞函数，调用之后会将当前程序阻塞在这里，直到下一个通知事件产生。

当 ibv_get_cq_event() 收到完成事件的通知之后，需要调用 ibv_get_cq_event() 来确认事件。

典型用法：

  * Stage I：准备阶段



创建一个 CQ，并且将它与一个 Completion Event Channel 相关联；

用 ibv_req_notify_cq() 对一个 Completion Work 调用通知请求；

  * Stage II：运行中



等待事件产生；

产生之后处理事件，并且调用 ibv_ack_cq_events() 来确认事件；

对下一个 Completion Work 调用 ibv_req_notify_cq() 的通知请求；

参数说明：

Name| Direction| Description  
---|---|---  
*channel| in| 关联在 CQ 上的 Completion Event Channel  
**cq| out| 从 Completion 事件中得到的一个 CQ  
**cq_context| out| 从 Completion 事件中得到的 CQ context  
  
返回值：为 0 表示成功，-1 在非阻塞模式下表示当前没有事件可读，阻塞模式则表示出错。

这种机制用于避免 CPU 反复读取 Work Completion ，若不采用事件的方法则只能通过不断地 ibv_poll_cq() 来轮询是否有事件完成

### 

# Errors记录

### IBV_WC_WR_FLUSH_ERR(5/0x5)

Work Request Flushed Error

当 QP 的传送状态处于 Error 状态时，任何操作都会引发该错误。

### IBV_WC_RNR_RETRY_EXC_ERR(13/0xd)

Receiver-Not-Ready Retry Error

当接收端没有准备好 Recv Request 时发送端产生了一个 Send Request 就会发生 RNR_RETRY 错误。

要求 ibv_post_recv() 必须在 ibv_post_send 之前完成，所以一种基本的思路就是一开始就 Post 一堆 Recv Request 到队列中去，然后检查当队列中的 Recv Request 少于一定数量时补充，保证不管发送端什么时候 Post Send Request 时，接收端都有足够的 Recv Request 来接收。

问题是如果发送端毫无顾忌地可以任意发送数据，尤其是在 RDMA_WRITE 方式，接收端这边会不会来不及取走数据，就被发送端传过来的新数据覆盖掉了？

或者设置 ibv_modify_qp() 参数中的 min_rnr_timer 以及 rnr_retry，前者是重试间隔时间，后者是重试次数，当 rnr_retry 为 7 时表示重试无限次。这种方法可用于重试直到接收端确认取走数据，并且准备好下一次的 Recv Request，然后发送端再进行发送。

当发送端发生 RNR_RETRY 错误时，重新调用 ibv_post_send() 是没用的，因为此时 QP 已经进入错误状态，接下来不管什么样的操作都会继续引发 IBV_WC_WR_FLUSH_ERR 错误。

除非另外使用一种流控制的方式，不然上面的两种解决方案都总会存在一定的局限性。

# 
