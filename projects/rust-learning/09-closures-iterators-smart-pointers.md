---
title: "闭包、迭代器与智能指针"
description: "闭包语法与捕获、Fn trait、迭代器与适配器、Box、Deref/Drop、Rc、RefCell"
date: "2026-07-12"
order: 9
tags: ["闭包", "迭代器", "智能指针", "Box"]
est_time: "60 分钟"
---

闭包和迭代器是 Rust 函数式编程风格的两块基石，也是最常配合使用的一对特性。

**闭包**是可以捕获所在作用域变量的匿名函数——你可以把”一段行为”存进变量、传给函数、或从函数返回。它的三个 trait（`Fn`/`FnMut`/`FnOnce`）描述了闭包如何捕获以及能被调用几次。

**迭代器**是按需逐个产生值的惰性接口——整条变换链只有在”消费”时才真正执行，不产生任何中间集合。两类方法各司其职：迭代器适配器（`map`、`filter`）描述变换但不执行；消费适配器（`sum`、`collect`）触发执行并拿走结果。

这两者的深度融合让你可以写出像这样的代码：

```
let total: i32 = orders
    .iter()
    .filter(|o| o.is_paid)
    .map(|o| o.amount)
    .sum();
```

简洁、无中间分配、性能与手写循环等价——这是 Rust **零开销抽象**的典型体现。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 闭包语法、三种捕获方式（借用/可变借用/移动），以及何时用 | move            |
| Fn              | /               | FnMut           | /               | FnOnce          | 三个 trait 的区别，闭包作为参数与返回值 |
| 惰性求值、           | iter            | /               | into_iter       | /               | iter_mut        | 、自定义迭代器与零开销原理   |
| 消费适配器与迭代器适配器的本质区别，常用方法速查 |                 |
| 手写              | my_filter       | 和               | my_sum          | ，理解标准库适配器的实现原理  |
# 闭包语法

## 什么是闭包

闭包是一种可以**像变量一样存储**、**像函数一样调用**的代码块。和普通函数最大的区别是：闭包可以捕获它定义时所在作用域中的变量。

先看一个最简单的对比：

```
fn add_one_fn(x: i32) -> i32 {
    x + 1
}

fn main() {
    // 普通函数：定义好之后通过名字调用
    println!("{}", add_one_fn(5));

    // 闭包：存储在变量里，像调用函数一样使用
    let add_one = |x| x + 1;
    println!("{}", add_one(5));
}
```

## 语法结构

闭包用一对竖线 `|` 包围参数，后跟函数体：

```
fn main() {
    // 通常不需要类型标注，编译器能推断
    let add = |x, y| x + y;

    // 无参数
    let greet = || println!("你好！");

    // 多行需要大括号
    let process = |x: i32| {
        let doubled = x * 2;
        doubled + 1
    };

    println!("{}", add(3, 4));
    greet();
    println!("{}", process(5));
}
```

把各种写法并排对比，看它们有多相似：

```
fn  add_v1   (x: i32, y: i32) -> i32 { x + y }  // 普通函数
let add_v2 = |x: i32, y: i32| -> i32 { x + y };  // 完整闭包标注
let add_v3 = |x, y|                  { x + y };  // 省略类型
let add_v4 = |x, y|                    x + y  ;  // 省略大括号
```

## 类型一旦推断就固定

闭包的参数类型通过第一次调用来推断，之后就固定了——不能再用不同类型调用：

```
fn main() {
    let identity = |x| x;

    // 第一次调用：编译器推断 x 为 String
    let _s = identity(String::from("hello"));

    // 类型已锁定为 String，传 i32 报错
    let _n = identity(5);
}
```

## 闭包能做函数做不到的事

普通函数不能访问外部作用域的变量，闭包可以：

```
fn main() {
    let threshold = 10;

    // 普通函数：无法访问外部的 threshold
    fn is_big(x: i32) -> bool {
        x > threshold  // 错误！
    }
}
```

```
fn main() {
    let threshold = 10;

    // 闭包：能直接使用同一作用域里的变量
    let is_big = |x| x > threshold;

    println!("{}", is_big(5));   // false
    println!("{}", is_big(15));  // true
}
```

这就是闭包最核心的能力——**捕获环境**。

## 主要应用场景

闭包最常见的用途——把”某个操作”作为参数传进去，让函数决定何时调用：

```
// apply 接受一个值和一个"如何处理它"的闭包

fn main() {
    println!("{}", apply(5, |x| x * 2));       // 10，乘以 2
    println!("{}", apply(5, |x| x + 100));     // 105，加 100
    println!("{}", apply(5, |x| x * x));       // 25，平方
}
```

// apply 接受一个值和一个"如何处理它"的闭包
fn apply(x: i32, f: impl Fn(i32) -> i32) -> i32 {
    f(x)
}

fn main() {
    println!("{}", apply(5, |x| x * 2));       // 10，乘以 2
    println!("{}", apply(5, |x| x + 100));     // 105，加 100
    println!("{}", apply(5, |x| x * x));       // 25，平方
}
> 闭包还有一个高频使用场景——配合迭代器的 .map()、.filter() 等方法，这部分在本章后面的迭代器文章中详细介绍。


# 捕获方式

## 三种捕获方式

闭包捕获变量有三种方式，**Rust 会自动选择限制最少的那种**：

| 捕获方式            | 发生条件            |
| --------------- | --------------- |
| 不可变引用           | &T              | 只读取变量           |
| 可变引用            | &mut T          | 修改变量            |
| 获取所有权           | T               | 消费或 drop 变量     |

**只读取 → 不可变引用：**

```
fn main() {
    let message = String::from("你好");

    let print = || println!("{}", message);

    print();
    print();
    // message 仍然有效
    println!("原来的值还在：{}", message);
}
```

**修改变量 → 可变引用：**

```
fn main() {
    let mut count = 0;

    // 闭包自身也要声明 mut，因为它内部有可变状态
    let mut increment = || {
        count += 1;
        println!("count = {}", count);
    };

    increment();
    increment();
    // 可变借用结束后，count 可以再次访问
    println!("最终 count = {}", count);
}
```

> 可变引用捕获期间，不能对同一变量进行其他借用。


**消费变量 → 获取所有权：**

```
fn main() {
    let name = String::from("Alice");

    // drop 需要所有权，闭包必须移动 name
    let consume = || {
        println!("再见，{}", name);
        drop(name);
    };

    consume();
    // consume(); // 错误：name 已被消费，这个闭包只能调用一次
}
```

## move 关键字：强制转移所有权

`move` 让闭包**强制获取所有变量的所有权**，即使闭包体里只是读取：

```
fn main() {
    let data = vec![1, 2, 3];

    // move 强制闭包拥有 data
    let contains = move |x| data.contains(x);

    println!("{}", contains(&1)); // true
    println!("{}", contains(&5)); // false

    // data 已被移入闭包，外部不能再用
    // println!("{:?}", data); // 错误！
}
```

不加 `move`——闭包借用 `data`，外部仍可使用：

```
fn main() {
    let data = vec![1, 2, 3];

    let contains = |x| data.contains(x);

    println!("{}", contains(&2));
    println!("data 还在：{:?}", data); // 完全合法
}
```

> 什么时候用 move？ 最典型的场景是把闭包传给新线程：thread::spawn(move || { ... })。新线程的生命周期可能比当前函数更长，数据必须从当前线程”移入”新线程，否则会有悬垂引用风险。


# 练习题

## 语法与捕获测验

```
fn main() {
    let greet = |msg: &str| println!("你好，{}", msg);
    greet("Rust");
    greet(42);
}
```

## 编程练习

`base_price` 和 `discount` 已经给定，请创建一个闭包 `final_price`，捕获这两个变量，接受数量 `qty`，返回 `(base_price - discount) * qty`：

```
fn main() {
    let base_price = 100;
    let discount = 20;

    // TODO: 创建闭包 final_price，接受数量 qty，返回折后总价
    let final_price = ???;

    println!("{}", final_price(3)); // (100 - 20) * 3 = 240
    println!("{}", final_price(5)); // (100 - 20) * 5 = 400
}
```
# Fn / FnMut / FnOnce

## 为什么有三个 trait

上一篇我们看到闭包可以通过三种方式捕获变量：不可变引用、可变引用、所有权转移。这三种方式对应了三个 trait，它们描述的是**闭包能被怎样调用**：

| Trait           | 调用方式            | 对应捕获方式          | 能调用几次           |
| --------------- | --------------- | --------------- | --------------- |
| Fn              | 不可变引用调用         | &T              | 捕获              | 任意多次            |
| FnMut           | 可变引用调用          | &mut T          | 捕获              | 任意多次（但需要        | mut             | ）               |
| FnOnce          | 消费调用            | T               | 捕获（移动）          | 只能一次            |

三者之间有继承关系：`Fn`** 是最严格的子集，**`FnOnce`** 是最宽松的**。

```
FnOnce（所有闭包都实现）
  └── FnMut（不消耗所有权的闭包实现）
        └── Fn（只读访问的闭包实现）
```

即：`Fn` 的闭包一定实现了 `FnMut` 和 `FnOnce`；`FnMut` 的闭包一定实现了 `FnOnce`。

## 编译器自动推断

你不需要手动声明闭包实现哪个 trait——编译器根据闭包体里的行为自动决定：

```
fn main() {
    let x = 5;
    // 只读取 x → 实现 Fn + FnMut + FnOnce
    let read_only = || println!("{}", x);
    read_only();
    read_only(); // 可以多次调用

    let mut count = 0;
    // 修改 count → 实现 FnMut + FnOnce（不实现 Fn）
    let mut mutating = || {
        count += 1;
        println!("{}", count);
    };
    mutating();
    mutating(); // FnMut 可以多次调用

    let name = String::from("Alice");
    // 消费 name → 只实现 FnOnce
    let consuming = || {
        let _n = name; // 移动了 name 的所有权
    };
    consuming();
    // consuming(); // 错误！FnOnce 只能调一次
}
```

# 闭包作为参数

## 用 impl Fn 接受闭包

当函数需要接受一个闭包参数时，用 `impl Fn`/`impl FnMut`/`impl FnOnce` 作为类型：

```
// 接受任何 i32 -> i32 的闭包，对 3 调用它（只调一次，用 Fn 即可）
fn apply_to_3(f: impl Fn(i32) -> i32) -> i32 {
    f(3)
}

fn main() {
    let double = |x| x * 2;
    println!("{}", apply_to_3(double)); // 6

    let add_one = |x| x + 1;
    println!("{}", apply_to_3(add_one)); // 4
}
```

`FnMut`**：需要多次调用且闭包有副作用**

当函数要多次调用闭包，且闭包可能修改捕获的变量时，参数类型要用 `FnMut`：

```
// 对列表的每一项调用 f——f 会被调用多次，且可能有副作用
fn for_each(items: &[i32], mut f: impl FnMut(i32)) {
    for &x in items {
        f(x);
    }
}

fn main() {
    let mut sum = 0;
    // 闭包修改了 sum，是 FnMut
    for_each(&[1, 2, 3, 4, 5], |x| sum += x);
    println!("sum = {}", sum); // 15

    // 只读取也能传，因为 Fn 是 FnMut 的子集
    for_each(&[1, 2, 3], |x| println!("{}", x));
}
```

> 注意：接受 FnMut 参数时，参数本身需要声明 mut（mut f: impl FnMut()），因为调用它会修改其内部状态。


`FnOnce`**：只需调用一次，接受最广泛**

```
// 只调用一次，用 FnOnce——连消费变量的闭包都能接受
fn call_once(f: impl FnOnce() -> String) -> String {
    f()
}

fn main() {
    let msg = String::from("hello");
    // 消费了 msg 的闭包（FnOnce）也能传进来
    let result = call_once(move || msg.to_uppercase());
    println!("{}", result);
}
```

## 选哪个 trait？

**原则：选限制最少的那个**——这样调用方能传入范围最广的闭包：

```
// 如果只需要调用一次，用 FnOnce（最宽松，接受所有闭包）
fn run_once(f: impl FnOnce() -> String) -> String {
    f()
}

// 如果需要调用多次，用 Fn（调用方的闭包不能有可变副作用）
fn run_twice(f: impl Fn() -> i32) -> i32 {
    f() + f()
}

fn main() {
    let msg = String::from("hello");
    // 消费了 msg，只能调一次 → 传给 FnOnce 没问题
    let result = run_once(move || msg.to_uppercase());
    println!("{}", result);

    let base = 10;
    // 只读取 base，可以多次调用 → 传给 Fn 没问题
    println!("{}", run_twice(|| base + 1));
}
```

> 实践建议： 不确定用哪个时，从 Fn 开始写。编译器会告诉你是否需要放宽到 FnMut 或 FnOnce。


## 也可以用泛型写法

`impl Fn(...)` 是 `<F: Fn(...)>` 的简写，两种写法等价：

```
// impl Trait 写法（更简洁）
fn apply_a(f: impl Fn(i32) -> i32, x: i32) -> i32 {
    f(x)
}

// 泛型写法（需要多次用到同一个闭包类型时更灵活）
fn apply_b<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
    f(x)
}

fn main() {
    println!("{}", apply_a(|x| x * 3, 4)); // 12
    println!("{}", apply_b(|x| x * 3, 4)); // 12
}
```

# 闭包作为返回值

## 必须用 impl Fn

每个闭包都有一个唯一的匿名类型，函数不能以具体类型返回它，必须用 `impl Fn(...)` 语法：

```
// 返回一个"加上偏移量"的闭包
fn make_adder(offset: i32) -> impl Fn(i32) -> i32 {
    move |x| x + offset  // 必须 move，否则 offset 在函数结束后就失效了
}

fn main() {
    let add5 = make_adder(5);
    let add10 = make_adder(10);

    println!("{}", add5(3));   // 8
    println!("{}", add10(3));  // 13
    println!("{}", add5(7));   // 12（add5 还可以继续用）
}
```

## 为什么必须 move

返回的闭包会在函数结束后继续使用，但 `offset` 是函数的局部变量，函数结束就销毁了。必须用 `move` 把 `offset` 的所有权移入闭包：

```
fn make_adder_broken(offset: i32) -> impl Fn(i32) -> i32 {
    // 不加 move：闭包只是借用 offset
    // 函数返回后 offset 销毁，闭包持有悬垂引用 → 编译错误
    |x| x + offset
}
```

---

## Fn trait 测验

```
fn run<F: Fn()>(f: F) {
    f();
    f();
}

fn main() {
    let mut count = 0;
    run(|| count += 1);
    println!("{}", count);
}
```

## 编程练习

实现 `run_n` 函数，将传入的闭包执行 `n` 次。关键是选对 trait——`Fn`、`FnMut` 还是 `FnOnce`？

```
// TODO: 把 ??? 替换成正确的 trait（Fn / FnMut / FnOnce）
// 提示：f 会被调用 n 次，且第二个用法里 f 会修改外部变量
fn run_n(???) {
    for _ in 0..n {
        f();
    }
}

fn main() {
    // 用法 1：只读取，调用 3 次
    let msg = "hello";
    run_n(3, || println!("{}", msg));

    // 用法 2：修改外部变量，调用 4 次
    let mut count = 0;
    run_n(4, || count += 1);
    println!("count = {}", count);
}
```
# 迭代器是什么

迭代器（iterator）是一种**按需逐个产生值**的机制。你可以把它想象成一条传送带：上面放着待处理的货物，但传送带只有在你喊”下一个”时才会动一格——这就是 Rust 迭代器的核心特征：**惰性求值**（lazy evaluation）。

## 惰性求值：不问不动

创建迭代器本身**不会做任何计算**：

```
fn main() {
    let v1 = vec![1, 2, 3];
    let v1_iter = v1.iter(); // 只是创建了迭代器，什么都没发生

    // 只有用到时才真正执行
    for val in v1_iter {
        println!("Got: {}", val);
    }
}
```

这和 Python 的 `range` 类似——`range(1_000_000)` 不会立刻创建百万个数，只是记录了”从 0 数到 999999”的指令，Rust 迭代器也是同样的道理。

## iter、into_iter、iter_mut 的区别

同一个集合可以用三种方式创建迭代器，区别在于**所有权和可变性**：

| 方法              | 产生值的类型          | 原集合之后           |
| --------------- | --------------- | --------------- |
| iter()          | &T              | （不可变引用）         | 仍可使用            |
| into_iter()     | T               | （拥有所有权）         | 被消耗，不可再用        |
| iter_mut()      | &mut T          | （可变引用）          | 仍可使用（但期间独占）     |

```
fn main() {
    let v = vec![String::from("hello"), String::from("world")];

    // iter()：借用，不消耗 v
    for s in v.iter() {
        print!("{} ", s); // s 是 &String
    }
    println!();
    println!("v 仍然有效: {:?}", v); // v 可以继续用
}
```

```
fn main() {
    let mut v = vec![1, 2, 3];

    // iter_mut()：可变借用，可以修改元素
    for x in v.iter_mut() {
        *x *= 2; // 解引用后修改
    }
    println!("{:?}", v); // [2, 4, 6]
}
```

```
fn main() {
    let v = vec![String::from("hello"), String::from("world")];

    // into_iter()：转移所有权，v 之后不可再用
    for s in v.into_iter() {
        println!("{}", s);
    }

    println!("{:?}", v); // 错误！v 已被消耗
}
```

> 经验法则：只需读取用 iter()；需要修改用 iter_mut()；需要把元素所有权传出去用 into_iter()。


## Iterator Trait 与 next

### Iterator trait 的定义

所有迭代器都实现了标准库中的 `Iterator` trait，它的核心长这样：

```
pub trait Iterator {
    type Item; // 这个迭代器产生什么类型的值

    fn next(&mut self) -> Option<Self::Item>; // 唯一必须实现的方法

    // 以下数十个方法都有默认实现，只要实现了 next 就全部免费获得
    // fn map(...) { ... }
    // fn filter(...) { ... }
    // fn sum(...) { ... }
    // ...
}
```

`type Item` 叫做**关联类型**，声明了”这个迭代器产出什么类型的值”。`next` 方法是唯一必须自己实现的，其余几十个方法都基于 `next` 有默认实现。

`next` 每次调用返回：

- `Some(value)` — 下一个值
- `None` — 迭代结束

### 直接调用 next

`for` 循环其实就是在反复调用 `next`，只是语法糖让它看起来更简洁：

```
fn main() {
    let v = vec![10, 20, 30];
    let mut iter = v.iter(); // 直接调用 next 需要 mut

    println!("{:?}", iter.next()); // Some(&10)
    println!("{:?}", iter.next()); // Some(&20)
    println!("{:?}", iter.next()); // Some(&30)
    println!("{:?}", iter.next()); // None
    println!("{:?}", iter.next()); // None（继续调用仍是 None）
}
```

> 为什么需要 mut？ 每次调用 next 都会推进迭代器内部的”游标”位置——这是对迭代器自身状态的修改。for 循环会拿走迭代器的所有权并在背后把它设为可变，所以你不用手动写 mut。


# 自定义迭代器

## 只需实现 next

任何结构体，只要为它实现了 `Iterator` trait 的 `next` 方法，就成了一个迭代器。来创建一个从 1 数到 5 的计数器：

> 关于 type Item：代码里的 type Item = u32; 用到了关联类型（associated type）这个特性，[高级特性：关联类型](/RustCourse/chapters/22-advanced/01-associated-types)一节会专门讲解它。现在只需要把它理解成”告诉编译器这个迭代器产出什么类型的值”——照着写就行，不需要深究语法原理。


```
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}

impl Iterator for Counter {
    type Item = u32; // 声明这个迭代器产出 u32 值（关联类型，后续章节会讲）

    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;
        if self.count <= 5 {
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    // 可以用 for 循环
    for n in Counter::new() {
        print!("{} ", n);
    }
    println!(); // 1 2 3 4 5

    // 也可以直接调用 next
    let mut c = Counter::new();
    println!("{:?}", c.next()); // Some(1)
    println!("{:?}", c.next()); // Some(2)
}
```

## 免费获得的其他方法

只要实现了 `next`，`Iterator` trait 上几十个有默认实现的方法就全部可以使用——不需要再写任何代码：

```
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter { Counter { count: 0 } }
}

impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;
        if self.count <= 5 { Some(self.count) } else { None }
    }
}

fn main() {
    // sum：求和（只实现了 next，sum 是免费的）
    let total: u32 = Counter::new().sum();
    println!("1+2+3+4+5 = {}", total); // 15

    // 链式组合：
    // Counter::new()         → 1,2,3,4,5
    // .zip(skip(1))          → (1,2),(2,3),(3,4),(4,5)
    // .map(|(a,b)| a*b)      → 2,6,12,20
    // .filter(|x| x%3==0)   → 6,12
    // .sum()                 → 18
    let result: u32 = Counter::new()
        .zip(Counter::new().skip(1))
        .map(|(a, b)| a * b)
        .filter(|x| x % 3 == 0)
        .sum();
    println!("结果: {}", result); // 18
}
```

这就是”只需实现 `next`，其余全部免费”的威力。它也体现了 Rust trait 系统的核心设计哲学：最小接口 + 大量基于它的默认实现。

# 零开销抽象

## 迭代器 vs for 循环：谁更快？

初次接触迭代器时，很多人会担心：`map`、`filter` 这些高级方法会不会有额外开销？毕竟它们比手写 `for` 循环看起来”高级”多了。

答案是：**不会**。Rust 针对这个问题专门做了一个基准测试，搜索阿瑟·柯南·道尔”福尔摩斯探案集”全文中的某个单词：

```
test bench_search_for  ... bench:  19,620,300 ns/iter (+/- 915,700)
test bench_search_iter ... bench:  19,234,900 ns/iter (+/- 657,200)
```

迭代器版本不仅没有更慢，反而**略快一点**。

## 零开销抽象是什么

这背后的原因是 Rust 的**零开销抽象**（zero-cost abstraction）原则。这个词借自 C++ 之父本贾尼·斯特劳斯特卢普：

> 从整体来说，C++ 的实现遵循了零开销原则：你不需要的，无需为它买单。更进一步：你需要的，也不可能找到更好的手写代码了。


Rust 把这个原则贯彻得更彻底。迭代器是一个**编译时抽象**——当你写 `v.iter().map(...).filter(...).sum()` 时，编译器看到的不是”调用了三个函数”，而是一整块可以整体优化的代码。最终生成的机器码与你手写的最优循环几乎一模一样。

理解零开销抽象的关键是区分**运行时抽象**和**编译时抽象**：

| 类型              | 例子              | 运行时开销           |
| --------------- | --------------- | --------------- |
| 运行时抽象           | 虚函数、动态派发（       | dyn Trait       | ）               | 有（查 vtable）     |
| 编译时抽象           | 泛型、迭代器、闭包       | 无（编译期单态化）       |

`Iterator` trait 的方法是**泛型的**——每种具体迭代器类型会在编译期生成专属的代码，不存在”通过指针间接调用”的运行时开销。

## 编译器如何做到：循环展开

来看一个来自音频解码器的真实例子。这段代码使用线性预测算法，用迭代器链对三个变量做数学运算：

```
# let mut buffer = [0i32; 16];
# let coefficients = [1i64; 12];
# let qlp_shift: i16 = 1;
for i in 12..buffer.len() {
    let prediction = coefficients.iter()
        .zip(&buffer[i - 12..i])
        .map(|(&c, &s)| c * s as i64)
        .sum::<i64>() >> qlp_shift;
    let delta = buffer[i];
    buffer[i] = prediction as i32 + delta;
}
```

因为 `coefficients` 的长度固定是 12，Rust 编译器**知道这个迭代只会执行 12 次**。它不会生成带循环控制逻辑（比较、跳转）的循环，而是直接把 12 次迭代**展开**（loop unrolling）成 12 段直线代码——消除了循环开销，让所有系数直接存进寄存器，也不需要运行时边界检查。

结果：迭代器链被编译成了**与手写汇编等价**的代码。

## 应该用迭代器还是 for 循环？

**性能上没有区别**，选择取决于可读性：

```
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // for 循环版本
    let mut sum = 0;
    for &x in &v {
        if x % 2 == 0 {
            sum += x * x;
        }
    }
    println!("for 循环: {}", sum);

    // 迭代器版本——意图更清晰："过滤偶数，平方，求和"
    let sum2: i32 = v.iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .sum();
    println!("迭代器: {}", sum2);
}
```

> 对于需要跨步骤共享可变状态的复杂逻辑，for 循环可能更直观。其他情况优先选迭代器——代码更短、意图更清晰，编译器也更容易优化。



## 惰性求值与 next 测验

```
let v = vec![1, 2, 3];
let mut iter = v.iter();
iter.next();
iter.next();
```

## Iterator trait 实现测验

```
struct Counter { count: u32 }

impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;
        if self.count <= 3 { Some(self.count) } else { None }
    }
}
```

## 编程练习

下面是一段简单的”词法分析”：对 token 列表，用 `next()` 单独取出第一个 token 做特殊处理，剩余的交给 `for` 循环处理。补全代码使输出符合预期——这道题考查的是 `next()` 调用会推进迭代器状态，`for` 接着从”剩余部分”继续的特性。

```
fn main() {
    let tokens = vec!["fn", "greet", "(", "name", ":", "String", ")", "{", "}"];
    let mut iter = tokens.iter();

    // TODO: 用 next() 取出第一个 token，打印为 "关键字: <token>"
    // 然后用 for 循环打印剩余 token，每个打印为 "  token: <token>"

}
```
# 两类适配器

`Iterator` trait 上有几十个方法，它们分为截然不同的两类：

| 类别              | 返回值             | 是否惰性            | 典型方法            |
| --------------- | --------------- | --------------- | --------------- |
| 迭代器适配器          | 新的迭代器           | 是（不立即执行）        | map             | 、               | filter          | 、               | zip             | 、               | enumerate       |
| 消费适配器           | 最终结果值           | 否（立即执行并消耗）      | sum             | 、               | collect         | 、               | fold            | 、               | find            |

一条完整的迭代器链通常长这样：**迭代器适配器（零个或多个）→ 消费适配器（恰好一个）**。

```
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];

    let result: i32 = v.iter()          // 创建迭代器
        .filter(|&&x| x % 2 == 0)      // 迭代器适配器：惰性，只描述"保留偶数"
        .map(|&x| x * x)               // 迭代器适配器：惰性，只描述"平方"
        .sum();                         // 消费适配器：触发执行，返回 i32

    println!("{}", result); // 4 + 16 + 36 = 56
}
```

> 关键点：filter 和 map 被调用时什么都没有发生，它们只是在描述”待做的变换”。直到 sum() 被调用，整条链才从头到尾运行一遍。这就是惰性求值的好处——中间不产生任何临时集合，内存效率更高。


## 如果只调用适配器，不消费会怎样？

```
fn main() {
    let v = vec![1, 2, 3];

    v.iter().map(|x| x * 2); // 编译器警告：unused Map，适配器是惰性的，不消费则什么都不做
}
```

Rust 编译器会发出警告提醒你：这段代码什么都没做。

# 消费适配器

消费适配器获取迭代器的所有权，反复调用 `next()` 直到 `None`，最终产生一个非迭代器的结果值。**调用之后迭代器就不能再用了。**

| 方法              | 返回值             | 功能              |
| --------------- | --------------- | --------------- |
| sum()           | 数值              | 对所有元素求和         |
| product()       | 数值              | 对所有元素求乘积        |
| count()         | usize           | 统计元素个数          |
| last()          | Option<T>       | 获取最后一个元素        |
| nth(n)          | Option<T>       | 获取第 n 个元素（会消耗前面的） |
| max()           | /               | min()           | Option<T>       | 获取最大 / 最小值      |
| any(f)          | bool            | 是否存在满足条件的元素（短路） |
| all(f)          | bool            | 是否所有元素都满足条件（短路） |
| find(f)         | Option<&T>      | 返回第一个满足条件的元素    |
| position(f)     | Option<usize>   | 返回第一个满足条件的元素的索引 |
| collect()       | 集合              | 收集为             | Vec             | 、               | HashSet         | 、               | String          | 等               |
| fold(init, f)   | 任意类型            | 通用聚合，从初始值开始逐步累加 |

## sum 与 product：数值聚合

```
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    let total: i32 = v.iter().sum();
    println!("求和: {}", total); // 15

    let product: i32 = v.iter().product();
    println!("求积: {}", product); // 120
}
```

## count、last、nth：定位与计数

```
fn main() {
    let v = vec![10, 20, 30, 40, 50];

    println!("元素数量: {}", v.iter().count()); // 5
    println!("最后一个: {:?}", v.iter().last()); // Some(&50)

    // nth 会消耗前面的元素
    let mut iter = v.iter();
    println!("第 2 个: {:?}", iter.nth(2));  // Some(&30)，前 3 个已被消耗
    println!("之后的下一个: {:?}", iter.next()); // Some(&40)
}
```

## max 与 min：求极值

```
fn main() {
    let v = vec![3, 1, 4, 1, 5, 9, 2, 6];

    println!("最大值: {:?}", v.iter().max()); // Some(&9)
    println!("最小值: {:?}", v.iter().min()); // Some(&1)

    let empty: Vec<i32> = vec![];
    println!("空集合的最大值: {:?}", empty.iter().max()); // None
}
```

## any 与 all：条件判断

```
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    println!("有偶数: {}", v.iter().any(|x| x % 2 == 0)); // true
    println!("全部为正: {}", v.iter().all(|x| *x > 0));   // true
}
```

> any 和 all 是短路求值的：any 找到第一个满足条件的元素就停止；all 遇到第一个不满足的就停止。


## find 与 position：查找元素

```
fn main() {
    let v = vec![1, 3, 5, 6, 7, 8];

    let first_even = v.iter().find(|&&x| x % 2 == 0);
    println!("第一个偶数: {:?}", first_even); // Some(&6)

    let pos = v.iter().position(|&x| x % 2 == 0);
    println!("第一个偶数的位置: {:?}", pos); // Some(3)
}
```

## collect：把迭代器变成集合

`collect` 是最常用的消费适配器之一，它把迭代器收集进一个集合。必须显式标注目标类型：

```
fn main() {
    let v = vec![1, 2, 3];

    let doubled: Vec<i32> = v.iter().map(|x| x * 2).collect();
    println!("{:?}", doubled); // [2, 4, 6]

    // 收集成字符串
    let parts = vec!["Rust", " ", "is", " ", "fast"];
    let sentence: String = parts.into_iter().collect();
    println!("{}", sentence); // Rust is fast
}
```

```
use std::collections::HashSet;

fn main() {
    // 收集成 HashSet 自动去重
    let v = vec![1, 2, 2, 3, 3, 3, 4];
    let unique: HashSet<i32> = v.into_iter().collect();
    println!("去重后有 {} 个元素", unique.len()); // 4
}
```

## fold：通用聚合

`fold` 是所有聚合方法的”祖先”，`sum`/`product`/`count` 等都可以用它实现：

```
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    // fold(初始值, |累加器, 当前元素| 新的累加器)
    let sum  = v.iter().fold(0, |acc, x| acc + x);     // 等价于 sum()
    let prod = v.iter().fold(1, |acc, x| acc * x);     // 等价于 product()
    let max  = v.iter().fold(i32::MIN, |acc, &x| acc.max(x));

    println!("sum={} product={} max={}", sum, prod, max);

    // fold 可以构建任意结构
    let s = v.iter().fold(String::new(), |mut acc, x| {
        if !acc.is_empty() { acc.push_str(", "); }
        acc.push_str(&x.to_string());
        acc
    });
    println!("{}", s); // 1, 2, 3, 4, 5
}
```

# 迭代器适配器

迭代器适配器返回新的迭代器，不立即执行，可以无限链式调用。**必须以一个消费适配器结尾，整条链才会真正运行。**

| 方法              | 功能              |
| --------------- | --------------- |
| map(f)          | 对每个元素应用闭包，产生等量的新元素 |
| filter(f)       | 保留闭包返回          | true            | 的元素             |
| filter_map(f)   | 闭包返回            | Some            | 则保留变换后的值，       | None            | 则丢弃             |
| enumerate()     | 将每个元素包装为        | (index, element) | 元组              |
| zip(other)      | 将两个迭代器逐一配对为元组，以较短的为准 |
| take(n)         | 只取前 n 个元素       |
| skip(n)         | 跳过前 n 个元素       |
| take_while(f)   | 取元素直到闭包首次返回     | false           |
| skip_while(f)   | 跳过元素直到闭包首次返回    | false           |
| chain(other)    | 将两个迭代器首尾拼接      |
| flat_map(f)     | 每个元素映射为一个子迭代器，然后展平一层 |
| flatten()       | 展平嵌套迭代器（等价于不做变换的 | flat_map        | ）               |
| peekable()      | 包装为可窥视下一个元素而不消耗的迭代器 |
| cloned()        | /               | copied()        | 将               | &T              | 元素克隆 / 复制为      | T               |

## map：变换每个元素

```
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    let doubled: Vec<i32> = v.iter().map(|x| x * 2).collect();
    println!("{:?}", doubled); // [2, 4, 6, 8, 10]

    let strings: Vec<String> = v.iter().map(|x| x.to_string()).collect();
    println!("{:?}", strings);
}
```

## filter：筛选元素

```
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];

    let evens: Vec<&i32> = v.iter().filter(|x| *x % 2 == 0).collect();
    println!("{:?}", evens); // [2, 4, 6]
}
```

`filter` 的闭包可以捕获外部变量，实现动态筛选：

```
#[derive(Debug)]
struct Shoe { size: u32, style: String }

fn shoes_in_size(shoes: Vec<Shoe>, shoe_size: u32) -> Vec<Shoe> {
    shoes.into_iter()
        .filter(|s| s.size == shoe_size) // 捕获外部变量 shoe_size
        .collect()
}

fn main() {
    let shoes = vec![
        Shoe { size: 10, style: String::from("运动鞋") },
        Shoe { size: 13, style: String::from("凉鞋") },
        Shoe { size: 10, style: String::from("靴子") },
    ];
    println!("{:?}", shoes_in_size(shoes, 10));
}
```

## filter_map：变换 + 过滤一步到位

闭包返回 `Some(value)` 表示保留，返回 `None` 表示丢弃：

```
fn main() {
    let strings = vec!["1", "两", "3", "四", "5"];

    let numbers: Vec<i32> = strings.iter()
        .filter_map(|s| s.parse().ok()) // 解析失败的直接丢弃
        .collect();
    println!("{:?}", numbers); // [1, 3, 5]
}
```

## enumerate：带上索引

```
fn main() {
    let fruits = vec!["苹果", "香蕉", "橙子"];

    for (i, fruit) in fruits.iter().enumerate() {
        println!("{}: {}", i, fruit);
    }
}
```

## zip：合并两个迭代器

`zip` 把两个迭代器逐一配对，以较短的为准：

```
fn main() {
    let names = vec!["Alice", "Bob", "Charlie"];
    let scores = vec![95, 87, 92];

    let combined: Vec<(&str, i32)> = names.into_iter().zip(scores.into_iter()).collect();
    for (name, score) in &combined {
        println!("{}: {}", name, score);
    }
}
```

```
fn main() {
    let a = vec![1, 2, 3, 4, 5];
    let b = vec!["one", "two", "three"]; // 只有 3 个

    let zipped: Vec<_> = a.iter().zip(b.iter()).collect();
    println!("{:?}", zipped); // [(1, "one"), (2, "two"), (3, "three")]
}
```

## take、skip 及其变体

```
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6, 7, 8];

    let first3: Vec<_> = v.iter().take(3).collect();
    println!("前 3 个: {:?}", first3); // [1, 2, 3]

    let after3: Vec<_> = v.iter().skip(3).collect();
    println!("跳过前 3: {:?}", after3); // [4, 5, 6, 7, 8]

    let less_than5: Vec<_> = v.iter().take_while(|&&x| x < 5).collect();
    println!("小于 5 的前缀: {:?}", less_than5); // [1, 2, 3, 4]

    let from5: Vec<_> = v.iter().skip_while(|&&x| x < 5).collect();
    println!("从 5 开始: {:?}", from5); // [5, 6, 7, 8]
}
```

## chain 与 flat_map：拼接与展平

```
fn main() {
    let a = vec![1, 2, 3];
    let b = vec![4, 5, 6];

    // chain：连接两个迭代器
    let combined: Vec<_> = a.iter().chain(b.iter()).collect();
    println!("{:?}", combined); // [1, 2, 3, 4, 5, 6]

    // flat_map：变换后展平一层
    let words = vec!["hello world", "foo bar"];
    let all_words: Vec<&str> = words.iter()
        .flat_map(|s| s.split_whitespace())
        .collect();
    println!("{:?}", all_words); // ["hello", "world", "foo", "bar"]
}
```

## 综合示例：链式流水线

```
fn main() {
    let sentences = vec![
        "rust is fast",
        "rust is safe",
        "go is fast",
    ];

    // 找出所有包含 "rust" 的句子中的单词，去重后按字母排序
    let mut words: Vec<&str> = sentences.iter()
        .filter(|s| s.contains("rust"))
        .flat_map(|s| s.split_whitespace())
        .collect();

    words.sort();
    words.dedup(); // 去重（要求已排序）
    println!("{:?}", words); // ["fast", "is", "rust", "safe"]
}
```


## 两类适配器辨别

```
let v = vec![1, 2, 3];
v.iter().map(|x| x * 2);
```

## 消费适配器测验

```
let v = vec![1, 3, 5, 6, 7];
let result = v.iter().find(|&&x| x % 2 == 0);
```

## 迭代器适配器测验

```
let a = vec![1, 2, 3];
let b = vec!["a", "b"];
let result: Vec<_> = a.iter().zip(b.iter()).collect();
```

## 编程练习

给定一段逗号分隔的分数字符串，解析为数字，过滤掉 60 分以下的，对合格分数乘以 1.1（取整），最后求加权后的平均分（保留一位小数）。

```
fn main() {
    let input = "45,72,88,55,91,63,38,76";

    // TODO:
    // 1. 用 split(',') 分割字符串
    // 2. 用 filter_map 解析为 u32（解析失败的跳过）
    // 3. 过滤掉 < 60 的
    // 4. 每个乘以 1.1 后取整（(x as f64 * 1.1) as u32）
    // 5. 收集为 Vec<u32>，然后计算平均分
    let adjusted: Vec<u32> = todo!();

    let avg = adjusted.iter().sum::<u32>() as f64 / adjusted.len() as f64;
    println!("加权分: {:?}", adjusted);
    println!("平均分: {:.1}", avg);
}
```
# 题目：筛词并转换

给定一段英文句子，找出所有长度**大于** `min_len` 的单词，转成大写后收集为 `Vec<String>`。

## 参考实现：for 循环版本

```
fn long_words(text: &str, min_len: usize) -> Vec<String> {
    let mut result = Vec::new();
    for word in text.split_whitespace() {
        if word.len() > min_len {
            result.push(word.to_uppercase());
        }
    }
    result
}

fn main() {
    let sentence = "the quick brown fox jumps over the lazy dog";
    println!("{:?}", long_words(sentence, 3));
}
```

## 你的任务：改写为迭代器版本

用 `split_whitespace()`、`filter`、`map`、`collect` 以及闭包重写，结果与上面完全一致：

```
fn long_words_iter(text: &str, min_len: usize) -> Vec<String> {
    // TODO
    todo!()
}

fn main() {
    let sentence = "the quick brown fox jumps over the lazy dog";
    println!("{:?}", long_words_iter(sentence, 3));
}
```
指针（Pointer）是一个包含内存地址的变量。而**智能指针（Smart Pointers）****是一类特殊的结构体，它们不仅表现得像指针，还拥有额外的元数据和功能——通常**拥有它们所指向的数据，而不只是借用。

不同的智能指针解决不同的问题，选用时参考下表：

| 场景              | 推荐类型            |
| --------------- | --------------- |
| 将数据分配到堆上，或定义递归类型 | Box<T>          |
| 单线程下多处共享同一份只读数据 | Rc<T>           |
| 需要在”不可变”的外壳下修改内部数据 | RefCell<T>      |
| 单线程下多处共享且需要修改数据 | Rc<RefCell<T>>  |
| 多线程下共享数据        | Arc<T>          | /               | Arc<Mutex<T>>   |

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 堆分配的场景，递归类型的解决方案，Deref coercion |                 |
| 自定义解引用行为与自动资源清理的两个核心 Trait |                 |
| 单线程下的多重所有权，引用计数原理 |                 |
| 运行时借用检查，在不可变引用外壳下修改数据 |                 |
# 智能指针从 `Box<T>` 开始

在 Rust 中，默认情况下所有值都存放在栈上。当值的大小在编译时已知，栈是高效且安全的选择。然而，在以下三种经典场景中，我们必须将数据搬到堆上：

- **类型大小编译时未知**：比如递归数据结构，它的实际大小取决于运行时的数据量。
- **大量数据转移所有权**：避免将 MB 级别的数据在栈上来回拷贝，而是只拷贝指针。
- **Trait 对象**：希望持有”实现了某个 Trait 的任意类型”，而不关心具体类型。

`Box<T>` 是 Rust 标准库提供的最简单的智能指针。它在栈上存储一个指针，而将实际数据分配在堆上。除了分配位置不同，它的行为和普通引用几乎相同。

## 最简单的用法

```
fn main() {
    let b = Box::new(5);
    println!("b = {}", b);
    // b 离开作用域时，栈上的指针和堆上的数据都会被释放
}
```

这个例子没有什么实际意义——把单个整数放在堆上没有必要。但它清晰地展示了 `Box<T>` 的基本语法：像使用栈上的值一样使用它，Rust 会在离开作用域时自动清理堆内存。

## 递归类型：`Box<T>` 大显身手

递归类型是 `Box<T>` 最重要的使用场景之一。**递归类型**指的是类型定义中包含自身的类型。

### 问题：无限大小的类型

![Box 指针示意图](/images/rust/box.svg)
我们来尝试用 Rust 定义一个来自函数式编程的经典数据结构 —— cons list（一种简单的链表）：

```
// 这段代码无法编译！
enum List {
    Cons(i32, List),  // Cons 节点包含一个值和下一个节点，是一个具名元组
    Nil,              // 表示列表终止
}
```

如果你尝试编译上面的代码，编译器会给出如下错误：

```
error[E0072]: recursive type `List` has infinite size
 --> src/main.rs:1:1
  |
1 | enum List {
  | ^^^^^^^^^ recursive type has infinite size
2 |     Cons(i32, List),
  |               ---- recursive without indirection
  |
  = help: insert indirection (e.g., a `Box`, `Rc`, or `&`) at some point
    to make `List` representable
```

这个错误发生的原因很直观：Rust 在编译时需要知道每个类型需要多少内存。当编译器看到 `List` 时，它会去计算 `Cons(i32, List)` 的大小，而这又需要再次计算 `List` 的大小……这个计算永远无法终止。

### 理解编译器的尺寸计算

对于普通的枚举，Rust 会选择其最大成员的大小。比如：

```
enum Message {
    Quit,                       // 不占数据空间
    Move { x: i32, y: i32 },   // 需要两个 i32
    Write(String),              // 需要一个 String
    ChangeColor(i32, i32, i32), // 需要三个 i32
}
```

Rust 会取所有成员中最大的那个，为所有 `Message` 实例分配相同大小的内存。但递归类型让这个计算陷入死循环。

### 解决方案：用指针打破递归

编译器错误信息给了提示：在递归处加入”间接性” (indirection)。意思是不直接存储一个 `List` 值，而是存储一个**指向** `List` 的指针：

```
#[derive(Debug)]
enum List {
    Cons(i32, Box<List>),  // 用 Box 包裹，存储的是指针而非值
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1,
        Box::new(Cons(2,
            Box::new(Cons(3,
                Box::new(Nil))))));

    println!("链表: {:?}", list);
}
```

现在 Rust 可以轻松计算出 `Cons` 成员的大小了：一个 `i32` 加上一个 `Box<List>` 指针（在 64 位系统上固定为 8 字节）。无论链表有多长，每个节点的内存布局都是固定且可知的。

## `Box<T>` 的本质

`Box<T>` 之所以称为”智能”指针，是因为它实现了两个关键 Trait：

- `Deref`** Trait**：使得 `Box<T>` 可以像引用一样被解引用（使用 `*` 运算符），以及享受解引用强制转换的便利。
- `Drop`** Trait**：当 `Box<T>` 离开作用域时，会自动释放堆上的内存，无需手动 `free`。

这两个 Trait 正是下一篇文章要深入学习的核心内容。`Box<T>` 的其他功能除此以外，既没有额外的性能开销，也没有额外的运行时检查——它是 Rust 智能指针家族中最”干净”的成员。


## 测验

```
fn main() {
    let x = Box::new(5);
    let y = x;
    println!("{}", x); // 使用 x
}
```
# 理解 `Deref`：重载解引用运算符

解引用运算符 `*` 能够追踪引用所指向的值。对于普通引用，这是自然而然的行为：

```
fn main() {
    let x = 5;
    let y = &x;       // y 是 x 的引用

    assert_eq!(5, x);
    assert_eq!(5, *y); // 使用 * 解引用，获取 y 指向的值
    println!("x = {}, *y = {}", x, *y);
}
```

现在用 `Box<T>` 替换引用，`*` 运算符同样有效：

```
fn main() {
    let x = 5;
    let y = Box::new(x); // y 是一个指向 x 值副本的 Box

    assert_eq!(5, x);
    assert_eq!(5, *y);   // 解引用 Box，和解引用普通引用一样！
    println!("解引用 Box 成功：{}", *y);
}
```

这并不是编译器为 `Box<T>` 开的特例，而是因为 `Box<T>` 实现了 `Deref` Trait。接下来我们自己动手实现一个类似的类型，来深入理解 `Deref` 的工作原理。

## 自定义实现 `Deref`

```
use std::ops::Deref;

// 定义一个元组结构体，像 Box<T> 一样包裹数据
struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

// 实现 Deref，告诉编译器如何"解开"这个类型
impl<T> Deref for MyBox<T> {
    type Target = T; // 关联类型：解引用后得到 T

    fn deref(&self) -> &Self::Target {
        &self.0 // 返回元组第一个字段的引用
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y); // Rust 在底层执行的是 *(y.deref())
    println!("自定义 MyBox 解引用成功：{}", *y);
}
```

> 关联类型简介：type Target = T 是在 Trait 内部定义一个”占位类型”，实现时指定它的具体类型。你可以把它理解成给返回值类型起一个名字，让 Trait 的方法签名更清晰。后续章节会详细介绍，现在只需知道它的作用是”声明解引用后得到什么类型”即可。


关键点：当你写 `*y` 时，Rust 实际上在幕后执行的是 `*(y.deref())`。`deref` 方法返回的是内部数据的**引用**（而不是值本身），然后再对这个引用用 `*` 进行普通解引用。如果 `deref` 直接返回值，所有权就会被转移出 `self`，这通常不是我们想要的。

# 解引用强制转换

**解引用强制转换** (Deref Coercion) 是 Rust 编译器提供的一项极其实用的自动转换功能。它会在**编译时**自动将实现了 `Deref` 的类型的引用，转换为另一种类型的引用。

## 没有强制转换时的痛苦

假设有一个接受 `&str` 的函数：

```
fn hello(name: &str) {
    println!("Hello, {}!", name);
}
```

如果没有解引用强制转换，用一个 `MyBox<String>` 来调用它将非常繁琐：

```
fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&(*m)[..]); // 手动写法：先解引用 MyBox，再取字符串切片
}
```

`(*m)` 将 `MyBox<String>` 解引用为 `String`，然后 `&` 和 `[..]` 再取整个 `String` 的字符串切片以匹配 `&str`。这又难写又难读。

## 有强制转换时的优雅

```
use std::ops::Deref;

struct MyBox<T>(T);
impl<T> MyBox<T> { fn new(x: T) -> MyBox<T> { MyBox(x) } }
impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &Self::Target { &self.0 }
}

fn hello(name: &str) {
    println!("Hello, {}!", name);
}

fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&m); // Rust 自动完成两步转换：
               // 1. &MyBox<String> -> &String（通过 MyBox 的 Deref）
               // 2. &String -> &str（通过 String 的 Deref）
}
```

Rust 自动进行了多步链式转换。整个过程发生在编译期，**没有任何运行时性能开销**。

## 强制转换与可变性

Rust 还提供了 `DerefMut` Trait 用于可变引用的解引用强制转换。规则如下：

- `&T` → `&U`：当 `T: Deref<Target=U>`
- `&mut T` → `&mut U`：当 `T: DerefMut<Target=U>`
- `&mut T` → `&U`：当 `T: Deref<Target=U>`（可变转不可变）

注意：**不可变引用永远不能被强制转换为可变引用**。原因是借用规则要求，如果存在一个可变引用，那么它必须是唯一的引用，编译器无法保证从不可变引用强转后的安全性。

# 理解 `Drop`：值离开时自动执行清理

`Drop` Trait 是 Rust 的另一块基石。它定义了一个值在**离开作用域**时需要执行的清理逻辑。这个设计来自 **RAII** (Resource Acquisition Is Initialization) 模式——资源在获取时初始化，在销毁时自动释放。

## `Drop` 的触发顺序

变量以**创建时相反的顺序**被丢弃，就像栈结构一样：

```
struct Resource {
    name: String,
}

impl Drop for Resource {
    fn drop(&mut self) {
        println!("正在释放资源: {}", self.name);
    }
}

fn main() {
    let _a = Resource { name: String::from("文件句柄-A") };
    let _b = Resource { name: String::from("数据库连接-B") };
    println!("--- 所有资源已创建，程序即将结束 ---");
    // 离开作用域时，先释放 _b，再释放 _a（LIFO 顺序）
}
```

## 提早丢弃值：`drop(x)`

有时候我们需要提前释放一个资源，比如在操作完成后立刻释放互斥锁，以便让其他代码获取锁。你可能会尝试直接调用 `val.drop()`，但 Rust 不允许这样做：

```
// 这会导致编译错误！
// error[E0040]: explicit use of destructor method
let c = Resource { name: String::from("互斥锁") };
c.drop(); // 不允许！这会导致离开作用域时的二次释放
```

正确的做法是使用标准库的全局函数 `drop(c)`。它位于 prelude 中，无需导入：

```
struct MutexGuard {
    name: &'static str,
}

impl Drop for MutexGuard {
    fn drop(&mut self) {
        println!("锁 '{}' 已释放", self.name);
    }
}

fn main() {
    let guard = MutexGuard { name: "数据锁" };
    println!("临界区开始，持有锁");

    drop(guard); // 提前显式释放，让其他代码可以获取锁
    println!("临界区结束，锁已提前归还");

    // 如果这里再使用 guard 会导致编译错误（已被移动）
}
```

`drop(x)` 函数通过**获取值的所有权**，然后让值在函数块结束时自然析构，来实现提前释放。这避免了二次释放的问题，同时保持了 Rust 的安全保证。


## 测验

```
struct A; struct B;
impl Drop for A { fn drop(&mut self) { println!("drop A"); } }
impl Drop for B { fn drop(&mut self) { println!("drop B"); } }
fn main() {
    let _a = A;
    let _b = B;
}
```
# 为什么需要多所有权？

Rust 的所有权规则确保每个值都有唯一的所有者，这是内存安全的基础。但在某些场景下，这条规则会成为障碍。

设想我们要构建这样一个图结构：两个列表 `b` 和 `c` 需要共享同一段数据 `a`。如果我们用 `Box<T>` 来实现，会遇到什么问题？

```
// 这段代码无法编译！
enum List {
    Cons(i32, Box<List>),
    Nil,
}
use List::{Cons, Nil};

fn main() {
    let a = Cons(5, Box::new(Cons(10, Box::new(Nil))));
    let b = Cons(3, Box::new(a)); // a 的所有权移动到 b
    let c = Cons(4, Box::new(a)); // 错误！a 已经被移走了
}
```

编译错误清晰地说明了问题：

```
error[E0382]: use of moved value: `a`
  --> src/main.rs:13:30
   |
12 |     let b = Cons(3, Box::new(a));
   |                              - value moved here
13 |     let c = Cons(4, Box::new(a));
   |                              ^ value used here after move
```

`Box<T>` 独占所有权，一旦 `a` 被移入 `b`，就无法再被 `c` 使用。我们可以改用引用 `&List`，但这会带来复杂的生命周期标注。在这种场景下，`Rc<T>` 才是正确的选择。

# `Rc<T>` 的工作原理

`Rc<T>` 是 **Reference Counting**（引用计数）的缩写。它在堆上存储数据，同时维护一个计数器，记录当前有多少个地方持有这份数据的引用。

- 每次调用 `Rc::clone`，计数器加 1
- 每当一个 `Rc<T>` 值离开作用域，计数器减 1
- 当计数器归零时，数据才会被真正释放

让我们用 `Rc<T>` 改写上面的例子：

```
use std::rc::Rc;

#[derive(Debug)]
enum List {
    Cons(i32, Rc<List>),
    Nil,
}
use List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    println!("创建 a 后，引用计数 = {}", Rc::strong_count(&a));

    let b = Cons(3, Rc::clone(&a)); // 计数 +1，a 和 b 共享数据
    println!("创建 b 后，引用计数 = {}", Rc::strong_count(&a));

    {
        let c = Cons(4, Rc::clone(&a)); // 计数 +1
        println!("创建 c 后，引用计数 = {}", Rc::strong_count(&a));
    } // c 离开作用域，计数 -1

    println!("c 离开后，引用计数 = {}", Rc::strong_count(&a));
    // 程序结束，b 和 a 离开作用域，计数归零，内存释放
}
```

这次代码可以正常运行。`b` 和 `c` 都通过 `Rc::clone` 获得了 `a` 中数据的共享所有权。

## 为什么用 `Rc::clone(&a)` 而不是 `a.clone()`？

在技术上，两种写法都能编译。但 Rust 社区**强烈推荐**函数式写法 `Rc::clone(&a)`，原因在于**语义上的清晰区分**：

- `deep_clone()` 或 `.clone()`：通常意味着对数据的**深拷贝**，可能非常耗时（比如拷贝整个向量）。
- `Rc::clone(&a)`：仅仅是**增加一个计数器的值**，无论数据有多大，这个操作都是 O(1) 的轻量级操作。

当你阅读代码时，看到 `Rc::clone` 可以立刻判断”这里没有性能问题”；而看到 `.clone()` 则需要停下来思考是否会触发深拷贝。

# `Rc<T>` 的限制

`Rc<T>` 的设计做了一个重要取舍：

**它只提供不可变引用。** 在任何时候，你只能对 `Rc<T>` 内部的数据进行只读访问。

这是必要的安全保障：如果允许多个所有者同时进行可变修改，就会产生数据竞争（即使在单线程中也会导致逻辑混乱）。

此外，`Rc<T>` **只能用于单线程**。它的引用计数操作不是原子性的，无法在线程之间安全地共享。如果你需要在多线程中共享数据，应该使用它的并发版本 `Arc<T>` (Atomic Reference Counting)，这将在[并发编程](/RustCourse/chapters/14-concurrency/00-index)章节中介绍。

如果你既需要多所有权，又需要可变性，就需要将 `Rc<T>` 与下一节介绍的 `RefCell<T>` 组合使用。


## 测验

```
let a = Rc::new(5);
let b = Rc::clone(&a);
{
    let c = Rc::clone(&a);
} // c 离开作用域
```

## 编程练习

在实际开发中，多个模块经常需要持有同一份只读配置。请完成下面的代码，让 `module_a` 和 `module_b` 都持有并使用同一个 `Config` 对象，并在 `main` 的最后打印出正确的引用计数（应为 1，因为两个模块函数已返回）。

```
use std::rc::Rc;

#[derive(Debug)]
struct Config {
    debug_mode: bool,
    max_connections: u32,
}

fn module_a(config: Rc<Config>) {
    println!("[模块A] debug={}, count={}",
        config.debug_mode,
        Rc::strong_count(&config));
}

fn module_b(config: Rc<Config>) {
    println!("[模块B] max_conn={}, count={}",
        config.max_connections,
        Rc::strong_count(&config));
}

fn main() {
    let config = Rc::new(Config {
        debug_mode: true,
        max_connections: 100,
    });

    module_a(/* TODO: 将 config 以共享所有权方式传入 */);
    module_b(/* TODO: 将 config 以共享所有权方式传入 */);

    println!("main 中计数: {}", Rc::strong_count(&config));
}
```
# 什么是内部可变性？

Rust 的借用规则很明确：当你拥有一个不可变引用 `&T` 时，你不能同时拥有可变引用 `&mut T`。这条规则防止了数据竞争，是内存安全的核心保障。

然而，在某些合理的设计场景中，这条规则会成为阻碍。**内部可变性** (Interior Mutability) 是一种设计模式，它允许你即使在持有不可变引用时，也能修改数据内部的值。

这听起来像是在绕开 Rust 的安全保障，实际上并非如此。`RefCell<T>` 并没有绕过借用规则，它只是将借用检查从**编译时**推迟到了**运行时**。如果运行时违反了规则，程序会 Panic 而不是产生未定义行为。

## `RefCell<T>`：运行时的借用检查

让我们先来理解 `Box<T>`、`Rc<T>` 和 `RefCell<T>` 之间的核心差异：

| 类型              | 所有者数量           | 借用检查时机          | 可变性             |
| --------------- | --------------- | --------------- | --------------- |
| Box<T>          | 唯一              | 编译时             | 可变或不可变          |
| Rc<T>           | 多个              | 编译时             | 仅不可变            |
| RefCell<T>      | 唯一              | 运行时             | 可变或不可变          |

`RefCell<T>` 提供了两个核心方法：

- `borrow()`：返回 `Ref<T>`，行为类似不可变引用 `&T`。
- `borrow_mut()`：返回 `RefMut<T>`，行为类似可变引用 `&mut T`。

`RefCell<T>` 在内部维护一个计数器，追踪当前活跃的 `Ref<T>` 和 `RefMut<T>` 的数量。规则和编译期一样：可以同时有多个 `Ref<T>`，但 `RefMut<T>` 必须独占。如果违反，程序会 Panic：

```
thread 'main' panicked at 'already borrowed: BorrowMutError'
```

### 何时选择 `RefCell<T>`

当你**确信**代码在运行时不会违反借用规则，但编译器因为其分析的保守性而无法证明这一点时，`RefCell<T>` 是正确的选择。

# 内部可变性实战

最直接的场景：一个计数器，需要在只有 `&self` 的方法里更新自身状态。

## 直接修改（编译失败）

```
struct Counter {
    count: i32,
}

impl Counter {
    // &self 而非 &mut self
    fn increment(&self) {
        self.count += 1; // 编译错误：不能通过不可变引用修改字段
    }
}
```

## 用 `RefCell<T>` 解决

```
use std::cell::RefCell;

struct Counter {
    count: RefCell<i32>,
}

impl Counter {
    fn new() -> Self {
        Counter { count: RefCell::new(0) }
    }

    // 签名仍是 &self，但内部可以修改
    fn increment(&self) {
        *self.count.borrow_mut() += 1;
    }

    fn value(&self) -> i32 {
        *self.count.borrow()
    }
}

fn main() {
    let c = Counter::new();
    c.increment();
    c.increment();
    c.increment();
    println!("计数: {}", c.value()); // 3
}
```

`borrow_mut()` 返回一个 `RefMut<T>` 智能指针，通过 `*` 解引用后就可以修改内部值，用完后自动归还借用权。`borrow()` 同理，返回 `Ref<T>` 用于只读访问。

# `Rc<RefCell<T>>`：共享且可变

`Rc<T>` 和 `RefCell<T>` 结合是 Rust 中一个非常强大的模式：

- `Rc<T>` 解决了**多所有者**的问题
- `RefCell<T>` 解决了**可变性**的问题

两者相结合，就能得到一个可以被多处共享，同时又可以被任意一处修改的值。可变性的借用检查仍然存在，只是时机变了——`Rc` 允许你从任意一个持有者处调用 `borrow_mut()`，但 `RefCell` 会在运行时确保同一时刻最多只有一个可变借用活跃；若有多个持有者同时尝试调用 `borrow_mut()` 且互相重叠，程序会 Panic：

```
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil,
}
use List::{Cons, Nil};

fn main() {
    // 这个值将被多个列表节点共享，且可以被修改
    let shared_value = Rc::new(RefCell::new(5));

    // a、b、c 三个列表都持有 shared_value 的一份所有权
    let a = Rc::new(Cons(Rc::clone(&shared_value), Rc::new(Nil)));
    let b = Cons(Rc::new(RefCell::new(3)), Rc::clone(&a));
    let c = Cons(Rc::new(RefCell::new(4)), Rc::clone(&a));

    // 修改 shared_value 的值
    *shared_value.borrow_mut() += 10;

    // 所有持有 shared_value 的列表节点都看到了更新
    println!("修改后 a = {:?}", a);
    println!("修改后 b = {:?}", b);
    println!("修改后 c = {:?}", c);
}
```


## 测验

```
use std::rc::Rc;
use std::cell::RefCell;

let data = Rc::new(RefCell::new(0));
let a = Rc::clone(&data);
let b = Rc::clone(&data);

*a.borrow_mut() += 10;
*b.borrow_mut() += 5;

println!("{}", data.borrow());
```