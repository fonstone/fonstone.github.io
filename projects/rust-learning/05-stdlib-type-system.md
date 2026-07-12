---
title: "标准库类型与类型系统"
description: "Vector、String、HashMap，类型推断与转换、类型别名、newtype 模式"
date: "2026-07-12"
order: 5
tags: ["Vector", "String", "HashMap", "类型系统"]
est_time: "60 分钟"
---

有了基础类型和自定义类型，实际开发中你还会频繁需要**集合**——存储一组数据而非单个值。Rust 标准库提供了三种最常用的集合类型，几乎出现在每一个 Rust 程序中：动态数组 `Vec<T>`、可变字符串 `String`，以及键值对集合 `HashMap<K, V>`。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 可动态增长的数组：创建、读取、增删改与遍历 |                 |
| String          | 与               | &str            | 的区别，字符串操作与 UTF-8 编码 |
| 键值对集合：创建、查找、更新与迭代 |                 |
| 综合运用三种集合类型解决实际问题 |                 |
# 什么是向量（Vector）

**向量**（Vector）是 Rust 标准库中最常用的**动态数组**类型，记作 `Vec<T>`。

“动态”是什么意思呢？对比你前面学过的**数组**（`[T; n]`），数组的长度在编译时就确定了，是**固定的**：

```
fn main() {
    // 数组：长度固定为 5
    let arr: [i32; 5] = [1, 2, 3, 4, 5];
    println!("数组长度：{}", arr.len());

    // 向量：长度可以动态增加或减少
    let mut vec: Vec<i32> = vec![1, 2, 3, 4, 5];
    println!("向量初始长度：{}", vec.len());

    vec.push(6);  // 可以添加新元素
    println!("向量现在的长度：{}", vec.len());
}
```

## 为什么需要向量

想象这个场景：你写一个程序来读取用户输入。用户不一定输入多少行，可能是 1 行，也可能是 100 行。如果用数组，你需要**提前声明大小**（`[String; 100]`），这样既浪费空间（如果只有 10 行输入），又不够灵活（如果有 101 行就溢出了）。

向量解决了这个问题：**可以根据需要动态增长**，无需提前知道确切大小。

```
fn main() {
    let mut lines = Vec::new();

    // 模拟用户输入三行数据
    lines.push(String::from("第一行"));
    lines.push(String::from("第二行"));
    lines.push(String::from("第三行"));

    println!("收到 {} 行数据", lines.len());

    for line in &lines {
        println!("  {}", line);
    }
}
```

# 使用向量

## 创建和初始化向量

### 使用 `Vec::new()`

最直接的方式是调用 `Vec::new()`：

```
fn main() {
    let mut v: Vec<i32> = Vec::new();

    v.push(1);
    v.push(2);
    v.push(3);

    println!("向量：{:?}", v);
}
```

注意这里需要**显式标注类型** `Vec<i32>`。为什么？因为向量是空的，编译器无法推断元素类型。

### 使用 `vec!` 宏

更简洁的方式是使用 `vec!` 宏。它可以在创建时直接填充数据，而且**编译器能自动推断类型**：

```
fn main() {
    // 创建并初始化
    let v = vec![1, 2, 3];
    println!("向量：{:?}", v);

    // 也可以用重复语法
    let v2 = vec![0; 5];  // 五个 0
    println!("重复向量：{:?}", v2);
}
```

这两个写法是等价的：

```
fn main() {
    // 这两种方式结果相同
    let v1 = vec![0, 0, 0, 0, 0];
    let v2 = vec![0; 5];

    println!("v1: {:?}", v1);
    println!("v2: {:?}", v2);
}
```

> 小技巧：如果你需要创建一个特定容量的空向量（为了减少重新分配次数），可以用 Vec::with_capacity(n)。这个技巧对性能敏感的代码有帮助。


## 访问向量中的元素

### 使用索引

向量支持基于索引的访问，就像数组一样：

```
fn main() {
    let v = vec![10, 20, 30, 40];

    println!("第一个元素：{}", v[0]);
    println!("第三个元素：{}", v[2]);
}
```

### 越界会 panic（恐慌）

如果你访问的索引超出范围，程序会**崩溃**（panic）：

```
fn main() {
    let v = vec![10, 20, 30];

    // 这会导致 panic！
    println!("{}", v[5]);
}
```

这在交互式代码中会直接失败。Rust 的设计理念是：**非法的操作应该当即失败**，而不是允许未定义行为。

### 使用 `get()` 方法安全地访问

如果你不确定索引是否有效，使用 `get()` 方法返回 `Option`：

```
fn main() {
    let v = vec![10, 20, 30];

    match v.get(0) {
        Some(value) => println!("第一个元素：{}", value),
        None => println!("向量为空"),
    }

    match v.get(10) {
        Some(value) => println!("第 11 个元素：{}", value),
        None => println!("索引 10 超出范围"),
    }
}
```

`get()` 返回 `Option<&T>`，你可以安全地处理”找不到”的情况。

### 关键区别：`[]` vs `get()`

- `v[i]`：如果超出范围，**panic**。用于已确认索引合法的地方。
- `v.get(i)`：返回 `Option`。用于索引可能不合法的地方。

```
fn main() {
    let v = vec![10, 20, 30];

    // 场景 1：你知道索引肯定存在
    println!("第一个：{}", v[0]);  // ✓ 直接用 [] 没关系

    // 场景 2：索引来自外部输入，可能无效
    let user_input = "5";
    if let Ok(index) = user_input.parse::<usize>() {
        match v.get(index) {
            Some(val) => println!("找到：{}", val),
            None => println!("用户输入的索引超出范围"),
        }
    }
}
```

## 修改向量

### 添加元素：`push()`

```
fn main() {
    let mut v = vec![1, 2, 3];

    v.push(4);
    v.push(5);

    println!("向量：{:?}", v);
}
```

### 删除元素：`pop()`

`pop()` 移除并返回最后一个元素，返回 `Option`：

```
fn main() {
    let mut v = vec![1, 2, 3];

    match v.pop() {
        Some(value) => println!("弹出：{}", value),
        None => println!("向量为空"),
    }

    println!("剩余：{:?}", v);
}
```

### 删除指定位置：`remove()`

`remove(index)` 删除指定索引的元素，并返回该元素。**注意**：这个操作时间复杂度是 O(n)，因为后面的所有元素都要向前移动：

```
fn main() {
    let mut v = vec!["a", "b", "c", "d"];

    let removed = v.remove(1);  // 删除索引 1 的元素
    println!("删除的元素：{}", removed);
    println!("剩余：{:?}", v);
}
```

### 修改元素

向量是可变的时候，可以直接修改元素：

```
fn main() {
    let mut v = vec![1, 2, 3];

    v[0] = 10;  // 直接修改第一个元素

    println!("修改后：{:?}", v);
}
```

或者用迭代获取可变引用：

```
fn main() {
    let mut v = vec![1, 2, 3];

    for elem in &mut v {
        *elem *= 2;  // 将每个元素乘以 2
    }

    println!("翻倍后：{:?}", v);
}
```

## 遍历向量

### 不可变遍历

最常见的遍历方式是用 `for` 循环和不可变借用 `&v`：

```
fn main() {
    let v = vec![1, 2, 3, 4, 5];

    for num in &v {
        println!("数字：{}", num);
    }

    // 遍历后仍然可以使用 v
    println!("向量长度：{}", v.len());
}
```

如果直接 `for num in v`（不用 `&`），会**转移所有权**，之后就无法再使用 `v` 了。

### 可变遍历

要修改遍历过程中的元素，使用 `&mut v`：

```
fn main() {
    let mut v = vec![1, 2, 3, 4];

    for num in &mut v {
        *num += 10;  // 指针解引用后修改
    }

    println!("修改后：{:?}", v);
}
```

### 转移所有权的遍历

如果向量包含**非复制类型**（如 `String`），直接 `for elem in v` 会转移所有权，元素无法再用：

```
fn main() {
    let v = vec![
        String::from("hello"),
        String::from("world"),
    ];

    for s in v {
        // s 拥有这个字符串的所有权
        println!("{}", s);
        // s 在这里被销毁
    }

    // v 现在已经被清空了（所有权转移完成）
    // println!("{:?}", v);  // ✗ 错误！v 已经被消耗
}
```

对比一下用不可变借用的方式，它不会消耗原向量：

```
fn main() {
    let v = vec![
        String::from("hello"),
        String::from("world"),
    ];

    for s in &v {
        // s 是一个引用 &String
        println!("{}", s);
    }

    // v 仍然可用！
    println!("向量长度：{}", v.len());
}
```

# 向量中的所有权规则

这是一个容易出错的地方。向量的所有权规则和普通变量一样，但因为向量可以包含多个元素，情况会更复杂。

## 规则 1：向量拥有其元素的所有权

```
fn main() {
    let s = String::from("hello");
    let mut v = vec![s];

    // s 的所有权已经转移到 v
    // println!("{}", s);  // ✗ 错误！s 已经没有所有权了

    println!("向量中的字符串：{:?}", v[0]);
}
```

向量被销毁时，它会自动销毁其中的所有元素。

## 规则 2：不能在遍历时修改向量的大小

一个常见的错误是：**在迭代过程中修改向量的结构**（添加/删除元素）。

```
fn main() {
    let mut v = vec![1, 2, 3];

    // 这样做是错误的：
    // for elem in &v {
    //     v.push(*elem);  // ✗ 错误！不能在迭代时修改 v
    // }
}
```

为什么不行？因为迭代器一开始就记录了要遍历的元素，如果中途改变向量的大小，迭代器可能会访问无效的内存。

> 如果需要修改向量的大小：先遍历并收集信息（比如要删除的索引），然后遍历完成后再修改向量。或者使用 retain() 方法：v.retain(|&x| x % 2 == 1) 保留满足条件的元素。


## 规则 3：不能同时持有可变和不可变引用

```
fn main() {
    let mut v = vec![1, 2, 3];

    let first = &v[0];  // 不可变借用

    v.push(4);  // ✗ 错误！不能获得可变借用，因为还有不可变借用存在

    println!("{}", first);
}
```

这个规则确保了内存安全。如果允许在持有引用时修改向量，那个引用可能变成悬垂指针。

# 向量中的多种类型

向量的类型参数 `T` 必须是单一类型。如果你要存储**多种不同类型**的数据，可以用**枚举**：

```
enum Value {
    Integer(i32),
    Text(String),
    Boolean(bool),
}

fn main() {
    let v = vec![
        Value::Integer(42),
        Value::Text(String::from("hello")),
        Value::Boolean(true),
    ];

    for val in &v {
        match val {
            Value::Integer(i) => println!("整数：{}", i),
            Value::Text(s) => println!("文本：{}", s),
            Value::Boolean(b) => println!("布尔值：{}", b),
        }
    }
}
```

另一个选择是用 **trait 对象**（后续章节会学到），这里先不展开。

# 常见操作速览

向量还有很多好用的方法。这里列出最常用的几个：

```
fn main() {
    let mut v = vec![3, 1, 4, 1, 5, 9, 2, 6];

    // 获取长度
    println!("长度：{}", v.len());

    // 检查是否为空
    println!("为空吗？{}", v.is_empty());

    // 清空（删除所有元素）
    let mut v2 = v.clone();
    v2.clear();
    println!("清空后的长度：{}", v2.len());

    // 检查是否包含某个元素（用 contains）
    println!("包含 4 吗？{}", v.contains(&4));

    // 获取第一个和最后一个元素
    println!("第一个：{:?}", v.first());
    println!("最后一个：{:?}", v.last());

    // 反转
    let mut v3 = v.clone();
    v3.reverse();
    println!("反转后：{:?}", v3);
}
```

# 练习题

## 编程练习

### 练习 1：创建和初始化向量

创建三个向量：

- 使用 `Vec::new()` 和 `push()` 添加数字 10、20、30
- 使用 `vec!` 宏直接创建包含 `"red"`、`"green"`、`"blue"` 的向量
- 使用 `vec![0; 5]` 创建五个零

然后打印这三个向量的长度和内容：

```
fn main() {
    // TODO: 创建第一个向量（通过 Vec::new 和 push）


    // TODO: 创建第二个向量（颜色）


    // TODO: 创建第三个向量（五个零）


    // TODO: 打印三个向量的长度和内容
    println!("第一个向量长度：{}，内容：{:?}", v1.len(), v1);
    println!("第二个向量长度：{}，内容：{:?}", v2.len(), v2);
    println!("第三个向量长度：{}，内容：{:?}", v3.len(), v3);
}
```

### 练习 2：向量操作综合

完成下面的函数，实现对向量的各种操作：

```
fn print_vector_info(v: &Vec<i32>) {
    // 打印向量的长度
    println!("长度：{}", );

    // 打印是否为空
    println!("为空吗？{}", );

    // 打印第一个元素（用 first）
    println!("第一个元素：{:?}", );

    // 打印最后一个元素（用 last）
    println!("最后一个元素：{:?}", );

    // 打印所有元素
    println!("所有元素：{:?}", );
}

fn sum_vector(v: &Vec<i32>) -> i32 {
    // 计算向量所有元素的和（用 for 循环）

}

fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];

    print_vector_info(&v);

    println!("总和：{}", sum_vector(&v));
}
```
# 字符串基础

## 为什么 Rust 有两种字符串类型

这是初学者最常困惑的地方。**Rust 不是有一种字符串类型，而是有两种：**`String`** 和 **`&str`。

想象一下快递：

- `String` 像是你**拥有的包裹**——你可以打开它、修改里面的东西、把它转送给别人
- `&str` 像是你在某个时刻**看到的包裹标签内容**——你只能读，不能修改，但标签本身可能属于别人

这种设计的核心理由是 **所有权**。Rust 使用所有权系统来管理内存安全。`String` 拥有堆上的数据，而 `&str` 只是借用（引用）了某个地方的字符串数据。

## String 和 &str 的基本区别

| 特性              | String          | &str            |
| --------------- | --------------- | --------------- |
| 存储位置            | 堆（heap）         | 栈（stack）或数据段    |
| 大小              | 动态，运行时确定        | 固定，编译时确定        |
| 可修改性            | 可以修改（如果是        | mut             | ）               | 不可修改            |
| 所有权             | 拥有完整数据所有权       | 仅是借用            |
| 类型              | String          | &str            | （引用类型）          |

让我们看一个简单对比：

```
fn main() {
    // String：我们拥有的字符串
    let mut s1 = String::from("Hello");
    s1.push_str(", World!");  // 可以修改
    println!("String: {}", s1);

    // &str：字符串切片，借用的数据
    let s2: &str = "Hello";
    // s2.push_str(", World!");  // ✗ 错误！&str 不可修改
    println!("&str: {}", s2);
}
```

这两种类型都是**有效的**，选择哪一种取决于你的**使用场景**。

## 字符串字面量就是 &str

你一直在用的字符串字面量（双引号里的文本）其实就是 `&str` 类型：

```
fn main() {
    // 这个字面量的类型是 &str，不是 String！
    let s: &str = "这是一个字符串字面量";
    println!("字面量类型：&str");
    println!("内容：{}", s);
}
```

为什么字面量是 `&str` 而不是 `String`？因为字面量在**编译时就已确定**，被硬编码到二进制文件中，所以没必要在运行时分配堆内存。`&str` 的大小在编译时就知道，效率最高。

# 创建与初始化

## 创建空 String

最基础的方式是 `String::new()`：

```
fn main() {
    let mut s = String::new();
    println!("空字符串长度：{}", s.len());
    println!("空字符串容量：{}", s.capacity());

    // 现在可以向里面添加数据
    s.push_str("Hello");
    println!("添加后：{}", s);
}
```

## 从字面量创建 String

方式 1：`String::from()`

```
fn main() {
    let s1 = String::from("Hello, World!");
    println!("{}", s1);
}
```

方式 2：`.to_string()` 方法（任何实现了 `ToString` trait 的类型都有这个方法）

```
fn main() {
    let s2 = "Hello, World!".to_string();
    println!("{}", s2);
}
```

两种写法的结果完全相同：

```
fn main() {
    let s1 = String::from("Hello");
    let s2 = "Hello".to_string();

    println!("s1: {}", s1);
    println!("s2: {}", s2);
    println!("s1 == s2: {}", s1 == s2);
}
```

> 选择建议：两种方式都可以，但 String::from() 更明确地表示”从这个数据创建一个 String”，而 .to_string() 更灵活（可用于其他类型的转换）。


## 预分配容量

如果你知道字符串最终会有大概多少字符，可以用 `with_capacity()` 预分配空间，减少内存重分配次数：

```
fn main() {
    // 预分配 10 字节容量
    let mut s = String::with_capacity(10);
    println!("初始容量：{}", s.capacity());

    // 添加数据
    s.push_str("Hello");
    println!("添加后容量：{}", s.capacity());
}
```

# 修改字符串

`String` 的一大优势是**可修改**。这里列出最常用的修改操作。

## 单个字符：`push()`

向字符串末尾添加一个 char：

```
fn main() {
    let mut s = String::from("hello");
    s.push('!');
    println!("{}", s);

    // 也可以是中文字符
    s.push('✨');
    println!("{}", s);
}
```

## 字符串片段：`push_str()`

向末尾追加一个字符串切片（`&str`）：

```
fn main() {
    let mut s = String::from("Hello");
    s.push_str(", ");
    s.push_str("World!");
    println!("{}", s);
}
```

> 注意：push_str() 接受 &str，不获得所有权，所以原字符串仍可用。


## 移除末尾字符：`pop()`

移除并返回最后一个字符（如果有的话）：

```
fn main() {
    let mut s = String::from("hello");

    match s.pop() {
        Some(ch) => println!("移除的字符：{}", ch),
        None => println!("字符串为空"),
    }

    println!("移除后：{}", s);
}
```

## 删除指定位置：`remove()`

删除并返回指定**字节位置**的字符。这个方法有些复杂，因为涉及 UTF-8 编码：

```
fn main() {
    let mut s = String::from("hello");

    // 删除位置 0 的字符（'h'）
    let removed = s.remove(0);
    println!("删除的字符：{}", removed);
    println!("修改后：{}", s);
}
```

> 警告：remove() 按字节位置工作，不是字符位置。对于多字节字符（如中文），必须传正确的字节位置，否则会 panic。详见后文”字符编码复杂性”。


## 清空字符串：`clear()`

删除所有内容：

```
fn main() {
    let mut s = String::from("Hello, World!");
    println!("清空前长度：{}", s.len());

    s.clear();
    println!("清空后长度：{}", s.len());
    println!("清空后：'{}'", s);
}
```

## 替换：`replace()` 和 `replace_range()`

`replace()` 返回一个**新的** String（原字符串不变）：

```
fn main() {
    let s = "hello world";
    let s2 = s.replace("world", "Rust");
    println!("原字符串：{}", s);
    println!("新字符串：{}", s2);
}
```

如果要修改原字符串的某个范围，用 `replace_range()`：

```
fn main() {
    let mut s = String::from("hello world");

    // 将位置 0..5 的字符替换为 "Hi"
    s.replace_range(0..5, "Hi");
    println!("{}", s);
}
```

## 截断：`truncate()`

保留前 n 个**字节**，删除剩余部分：

```
fn main() {
    let mut s = String::from("Hello, World!");

    s.truncate(5);  // 只保留前 5 个字节
    println!("{}", s);
}
```

> 同样，truncate() 按字节位置工作，不能用在多字节字符的中间。


# 操作与查询

## 为什么不能用 [] 直接索引字符串

这是一个常见的困惑。你可以对数组和向量用 `v[0]` 获取元素，但**不能对 String 这样做**：

```
fn main() {
    let s = String::from("hello");
    println!("{}", s[0]);  // ✗ 错误！
}
```

为什么？**UTF-8 编码的复杂性**。中文字符、表情符号等多字节字符占多个字节，一个”字符”可能是 1、2、3 或 4 个字节。`s[0]` 只能返回一个字节，而不是一个”字符”。Rust 的设计是**宁可不提供这个操作，也不要让你无意中出错**。

## 字符串切片：使用范围

如果你知道**字节范围**，可以创建字符串切片（`&str`）：

```
fn main() {
    let s = String::from("hello");

    let slice1: &str = &s[0..2];   // 前 2 个字节
    let slice2: &str = &s[1..4];   // 字节 1-4

    println!("slice1: {}", slice1);
    println!("slice2: {}", slice2);
}
```

但是**必须确保切片边界在字符边界上**，否则会 panic：

```
fn main() {
    let s = "Hello 🦀";  // 这里的 🦀 是 4 个字节

    // 这会 panic！因为在字符中间切割
    let slice = &s[0..7];
}
```

## 字节 vs 字符 vs 字形簇

这是 UTF-8 字符串最容易混淆的地方。让我们澄清三个概念：

**字节（Byte）** — 最小单位，1 个字节 = 8 比特：

```
fn main() {
    let s = "hello";
    println!("字节数：{}", s.len());  // 5

    let s2 = "Hello 世";
    println!("字节数：{}", s2.len());  // 9（不是 7！）
}
```

**字符（Char）** — Unicode 字符，`char` 类型：

```
fn main() {
    let s = "Hello 世界";
    println!("字符数：{}", s.chars().count());  // 8
    println!("字节数：{}", s.len());             // 12
}
```

**字形簇（Grapheme Cluster）** — 用户看到的”一个字符”，可能由多个 Unicode 字符组合而成（最常见的是变音符号）：

```
fn main() {
    // 这个看起来像一个"e"，但由两个 Unicode 字符组成
    let e_with_acute = "é";  // U+00E9（单个字符）
    let e_combining = "e\u{0301}";  // e（U+0065）+ 锐重音（U+0301）

    println!("字节数（é）：{}", e_with_acute.len());
    println!("字符数（é）：{}", e_with_acute.chars().count());

    println!("字节数（e̍）：{}", e_combining.len());
    println!("字符数（e̍）：{}", e_combining.chars().count());
}
```

**结论**：永远不要假设”一个字符 = 一个字节”。需要的时候：

- 按字节处理用 `.len()` 和 `&s[..]`
- 按字符处理用 `.chars()`
- 按字形簇处理需要第三方库

## 字符迭代

遍历字符串中的每个 **Unicode 字符**（而不是字节）：

```
fn main() {
    let s = "Hello 🦀";

    for ch in s.chars() {
        println!("字符：{}", ch);
    }
}
```

迭代**字节**（如果你真的需要）：

```
fn main() {
    let s = "hello";

    for byte in s.bytes() {
        println!("字节：{}", byte);
    }
}
```

## 常用字符串方法

**查看是否包含子字符串**：

```
fn main() {
    let s = "Hello, Rust!";

    println!("包含 'Rust'？{}", s.contains("Rust"));
    println!("包含 'Python'？{}", s.contains("Python"));
}
```

**查看开头或结尾**：

```
fn main() {
    let s = "hello.txt";

    println!("以 'hello' 开头？{}", s.starts_with("hello"));
    println!("以 '.txt' 结尾？{}", s.ends_with(".txt"));
}
```

**分割字符串**：

```
fn main() {
    let s = "one,two,three";

    for part in s.split(',') {
        println!("部分：{}", part);
    }
}
```

**移除首尾空白**：

```
fn main() {
    let s = "  Hello, Rust!  ";

    println!("原字符串：'{}'", s);
    println!("trim()：'{}'", s.trim());
    println!("trim_start()：'{}'", s.trim_start());
    println!("trim_end()：'{}'", s.trim_end());
}
```

**转换大小写**：

```
fn main() {
    let s = "Hello, Rust!";

    println!("大写：{}", s.to_uppercase());
    println!("小写：{}", s.to_lowercase());
}
```

## String 作为函数参数

这是初学者经常遇到的问题：**应该传 **`String`** 还是 **`&str`**？**

一般规则是：**优先传 **`&str`。原因是 `&str` 更灵活——无论你有 `String` 还是字面量，都可以转换成 `&str`：

```
fn print_string(s: &str) {
    println!("接收到：{}", s);
}

fn main() {
    // 传入字面量（已经是 &str）
    print_string("Hello");

    // 传入 String（会自动解引用转换成 &str）
    let owned = String::from("World");
    print_string(&owned);
}
```

如果你传 `String`，那就只能接收 `String`，不能接收字面量（需要显式转换）：

```
fn print_string_owned(s: String) {
    println!("接收到：{}", s);
}

fn main() {
    let owned = String::from("Hello");
    print_string_owned(owned);

    // print_string_owned("World");  // ✗ 错误！需要显式转换
    print_string_owned("World".to_string());  // 可以，但很啰嗦
}
```

> 最佳实践：除非函数需要修改字符串或需要获得所有权，否则总是接收 &str。


## 字符串解析

将字符串转换成其他类型，使用 `parse()` 方法：

```
fn main() {
    let s1 = "42";
    let num: i32 = s1.parse().expect("无法解析为整数");
    println!("解析后：{}", num);

    let s2 = "3.14";
    let float: f64 = s2.parse().expect("无法解析为浮点数");
    println!("解析后：{}", float);
}
```


## String 和 &str 基础测验

```
fn main() {
    let s1 = "Hello";
    let s2 = String::from("Hello");
}
```

## 字符串创建与修改

```
let mut s = String::from("Hello");
s.push('!');
s.push_str(" World");
```

## 字符编码和索引

```
let s = "Hello 中文";
let byte_count = s.len();
let char_count = s.chars().count();
```

## 函数参数和常用操作

```
fn describe(s: &str) {
    println!("字符串：{}", s);
}

fn main() {
    describe("Hello");
    describe(&String::from("World"));
}
```

## 编程练习

### 练习 1：字符串切片和迭代

完成下面程序，要求对字符串进行分析：

```
fn main() {
    let text = "Hello, Rust!";

    // TODO 1: 获取前 5 个字节的切片
    let first_five =
    println!("前5个字节: {}", first_five);

    // TODO 2: 遍历并计算所有字符，使用 for 实现
    let mut char_count = 0;
    for  {
        // TODO: 计数
    }
    println!("字符总数: {}", char_count);

    // TODO 3: 检查字符串是否以 "Hello" 开头
    if  {
        println!("以 'Hello' 开头: true");
    }

    // TODO 4: 检查字符串是否以 "!" 结尾
    if  {
        println!("以 '!' 结尾: true");
    }
}
```

### 练习 2：文本处理函数

编写一个函数 `process_text()`，接收一个 `&str`，返回处理后的 `String`。要求：

- 移除首尾空白
- 将所有内容转为小写
- 如果内容为空则返回 “(empty)”

```
fn process_text(text: &str) -> String {
    // TODO: 实现函数体

}

fn main() {
    let test1 = "  HELLO WORLD  ";
    let result1 = process_text(test1);
    println!("输入: '{}' -> 输出: '{}'", test1, result1);

    let test2 = "    ";
    let result2 = process_text(test2);
    println!("输入: '{}' -> 输出: '{}'", test2, result2);

    let test3 = "RustLang";
    let result3 = process_text(test3);
    println!("输入: '{}' -> 输出: '{}'", test3, result3);
}
```
# 什么是 HashMap

**HashMap<K, V>** 是 Rust 标准库中最常用的**键值对**（key-value pair）集合类型。与向量 `Vec<T>` 和字符串 `String` 不同，HashMap 不按位置存储数据，而是通过**键**来查找对应的**值**。

想象一个现实场景：你要建一本电话簿。向量不太适合，因为你需要通过**姓名**（而不是位置）来查找电话号码。

```
use std::collections::HashMap;

fn main() {
    // 创建一个 HashMap 存储人名 -> 电话号码
    let mut phone_book = HashMap::new();

    phone_book.insert("Alice", "123-4567");
    phone_book.insert("Bob", "234-5678");
    phone_book.insert("Charlie", "345-6789");

    // 通过姓名查找电话
    if let Some(phone) = phone_book.get("Alice") {
        println!("Alice 的电话：{}", phone);
    }
}
```

## 为什么需要 HashMap

对比三种查找场景：

| 场景              | 向量              | 字符串             | HashMap         |
| --------------- | --------------- | --------------- | --------------- |
| 按位置查找           | ✓ 快速            | ✗ 不适合           | ✗ 不适合           |
| 按内容查找           | ✗ 需要遍历          | ✓ 可以            | ✓ 快速            |
| 关联数据            | ✗ 分散            | ✗ 分散            | ✓ 紧凑            |

HashMap 通过**哈希函数**将键映射到存储位置，使得查找、插入、删除的平均时间复杂度是 O(1)，远比遍历向量快得多。

## HashMap 的基本概念

每个条目由两部分组成：

- **键（Key）**：用来查找的唯一标识，必须实现 `Eq` 和 `Hash` trait
- **值（Value）**：与键关联的数据，类型没有限制

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();

    // Key 是 String，Value 是 i32
    map.insert("apple", 5);
    map.insert("banana", 3);
    map.insert("cherry", 7);

    println!("苹果的数量：{}", map.get("apple").unwrap_or(&0));
}
```

> 哈希函数（Hash Function）：一个函数，能快速把任意大小的输入”转换”成固定大小的数字（位置）。想象一下档案馆：给定一个人名，哈希函数计算出应该放在哪一行哪一列，从而快速找到文件。Rust 中常见的键类型（i32、String 等）都内置了哈希实现，不用你手动处理。


# 使用HashMap

## 创建和初始化 HashMap

### 使用 `HashMap::new()`

最直接的创建方式：

```
use std::collections::HashMap;

fn main() {
    let mut map: HashMap<String, i32> = HashMap::new();

    println!("空 HashMap 的长度：{}", map.len());
}
```

注意这里需要显式标注类型 `HashMap<String, i32>`，因为 HashMap 是空的，编译器无法推断。

### 从向量创建

一个常见的模式是从**元组向量**转换成 HashMap：

```
use std::collections::HashMap;

fn main() {
    // 一个团队的名字和成绩
    let teams = vec![
        ("Alice", 88),
        ("Bob", 92),
        ("Charlie", 85),
    ];

    // 使用 collect() 将向量转换为 HashMap
    let scores: HashMap<&str, i32> = teams.iter().cloned().collect();

    println!("总共 {} 个团队", scores.len());
    println!("Bob 的成绩：{}", scores.get("Bob").unwrap_or(&0));
}
```

> 学习提示：iter().cloned().collect() 是一个很常用的模式。不用现在完全理解迭代器的细节，[闭包与迭代器](/RustCourse/chapters/12-closures-iterators/00-index)章节会详细讲解。


## 访问 HashMap 中的值

### 使用 `get()` 方法

最安全的访问方式是 `get()`，它返回 `Option<&V>`：

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("name", "Alice");
    map.insert("job", "Engineer");

    // get() 返回 Option<&V>
    match map.get("name") {
        Some(name) => println!("名字：{}", name),
        None => println!("找不到 name 键"),
    }

    match map.get("age") {
        Some(age) => println!("年龄：{}", age),
        None => println!("找不到 age 键"),
    }
}
```

`get()` 的优点是**不会 panic**，你可以安全地处理键不存在的情况。

### 使用索引访问

也可以直接用 `map[key]` 访问，但如果键不存在会 panic：

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("city", "Beijing");

    // 如果键确实存在，直接用 [] 没关系
    println!("城市：{}", map["city"]);

    // 但如果键不存在会 panic：
    // println!("{}", map["nonexistent"]);  // ✗ panic！
}
```

**选择建议**：

- 用 `get()` 当键可能不存在时
- 用 `[]` 当你确定键一定存在时

### 检查键是否存在

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("red", 0xFF0000);
    map.insert("green", 0x00FF00);

    if map.contains_key("red") {
        println!("红色存在！");
    }

    if !map.contains_key("blue") {
        println!("蓝色不存在，添加它");
        map.insert("blue", 0x0000FF);
    }
}
```

### 获取 HashMap 的大小

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("x", 10);
    map.insert("y", 20);

    println!("条目数量：{}", map.len());
    println!("是否为空：{}", map.is_empty());
}
```

## 插入和修改数据

### 插入新键值对

`insert()` 既可以添加新数据，也可以覆盖存在的值：

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();

    // 第一次插入
    map.insert("a", 1);
    println!("插入后：{:?}", map);

    // 如果键已存在，新值覆盖旧值
    let old_value = map.insert("a", 10);
    println!("返回的旧值：{:?}", old_value);
    println!("现在的值：{:?}", map);
}
```

`insert()` 会返回原来的值（如果存在），这很有用。

### 使用 `entry()` API 优化更新

`entry()`** 的作用**：只需查找一次，就能**检查键是否存在**并**根据存在与否来执行不同的操作**。它返回一个 `Entry` 对象，你可以链式调用 `or_insert()`（不存在就插入）或 `and_modify()`（存在就修改）。

为什么用 `entry()` 而不是先 `get()` 再 `insert()`？因为 `entry()` 只查找一次，而分开操作需要查找两次，性能更差。

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();

    // 场景 1：只在键不存在时才插入
    map.entry("name").or_insert("Alice");
    println!("name：{}", map.get("name").unwrap());

    map.entry("name").or_insert("Bob");  // 已存在，不会改变
    println!("name 仍然是：{}", map.get("name").unwrap());

    // 场景 2：修改已存在的值，否则插入初始值（常见的计数模式）
    map.entry("count")
        .and_modify(|e| *e += 1)  // 如果存在，修改它，这里的操作后面会讲到，目前只需要会用即可
        .or_insert(1);             // 如果不存在，插入 1

    println!("count：{}", map.get("count").unwrap());

    // 再运行一次
    map.entry("count")
        .and_modify(|e| *e += 1)
        .or_insert(1);

    println!("count 现在是：{}", map.get("count").unwrap());
}
```

这个模式在**计数、累加、初始化**等场景中最常见。

## 删除数据

### 删除键值对

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("name", "Alice");
    map.insert("age", "28");

    // remove() 返回删除的值
    if let Some(value) = map.remove("age") {
        println!("删除的值：{}", value);
    }

    println!("删除后的 map：{:?}", map);
}
```

### 清空 HashMap

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("a", 1);
    map.insert("b", 2);

    println!("清空前：{}", map.len());
    map.clear();
    println!("清空后：{}", map.len());
}
```

## 遍历 HashMap

### 遍历所有键值对

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("red", 0xFF0000);
    map.insert("green", 0x00FF00);
    map.insert("blue", 0x0000FF);

    // 遍历键值对
    for (color, hex) in &map {
        println!("{} 的十六进制值：{:06X}", color, hex);
    }
}
```

### 只遍历键

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("Alice", 88);
    map.insert("Bob", 92);
    map.insert("Charlie", 85);

    println!("所有学生：");
    for name in map.keys() {
        println!("  {}", name);
    }
}
```

### 只遍历值

```
use std::collections::HashMap;

fn main() {
    let map = {
        let mut m = HashMap::new();
        m.insert("Alice", 88);
        m.insert("Bob", 92);
        m.insert("Charlie", 85);
        m
    };

    println!("所有分数：");
    for score in map.values() {
        println!("  {}", score);
    }
}
```

### 可变遍历

要修改值，需要可变引用：

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert("apple", 5);
    map.insert("banana", 3);
    map.insert("cherry", 7);

    // 将所有数量翻倍
    for (_fruit, count) in &mut map {
        *count *= 2;
    }

    println!("翻倍后：{:?}", map);
}
```

> 提示：不能在遍历 HashMap 时修改其大小（添加或删除键值对）。这会导致迭代器失效，导致编译错误。如果需要在遍历中过滤或修改 HashMap，应该先遍历收集结果，然后在循环外修改。这个限制和向量一样——它们都使用迭代器，都要保护迭代器的有效性。


# HashMap 的所有权规则

HashMap **拥有其键和值的所有权**。这是一个容易出错的地方。

## 键和值被转移到 HashMap

```
use std::collections::HashMap;

fn main() {
    let key = String::from("name");
    let value = String::from("Alice");

    let mut map = HashMap::new();
    map.insert(key, value);

    // 现在 key 和 value 的所有权已转移到 map
    // println!("{}", key);    // ✗ 错误！key 已被转移
    // println!("{}", value);  // ✗ 错误！value 已被转移

    println!("map 中的值：{:?}", map);
}
```

但如果键和值是 **Copy 类型**（如 `i32`），就不会转移所有权：

```
use std::collections::HashMap;

fn main() {
    let key = 1;
    let value = 100;

    let mut map = HashMap::new();
    map.insert(key, value);

    // key 和 value 都是 i32（Copy 类型），仍可使用
    println!("key：{}，value：{}", key, value);
    println!("map 中的值：{:?}", map);
}
```

## 使用引用作为键

如果键是非 Copy 类型（如 `String`），不想转移所有权，可以用**引用**：

```
use std::collections::HashMap;

fn main() {
    let key = String::from("name");
    let value = String::from("Alice");

    let mut map = HashMap::new();
    map.insert(&key, &value);  // 用引用

    // 现在可以继续使用原始的 key 和 value
    println!("key：{}，value：{}", key, value);
    println!("map 中的键：{:?}", map.get(key.as_str()).unwrap());
}
```

但这样做有个限制：HashMap 中的引用受**生命周期**约束（后续章节会学到）。实际上最常见的做法是 HashMap 拥有数据的所有权。

# HashMap 的重要特性

## 键必须实现 Eq 和 Hash

这是 HashMap 的一个基础限制。大多数内置类型（`i32`、`String`、`&str` 等）都实现了这两个 trait，所以通常不是问题。

```
use std::collections::HashMap;

fn main() {
    // 这些都是合法的键
    let mut m1 = HashMap::new();
    m1.insert(1, "one");  // i32 可以

    let mut m2 = HashMap::new();
    m2.insert("key", "value");  // &str 可以

    let mut m3 = HashMap::new();
    m3.insert(String::from("key"), "value");  // String 可以

    println!("所有类型都有效！");
}
```

## HashMap 无序

HashMap **不保证遍历顺序**。如果需要有序的键值对，需要使用 `BTreeMap`（后续章节会提到）。

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert(3, "three");
    map.insert(1, "one");
    map.insert(2, "two");

    // 遍历顺序未定义，可能是 3, 1, 2 或任何其他顺序
    for (k, v) in &map {
        println!("{}: {}", k, v);
    }
}
```


## HashMap 基础测验

```
let mut map = HashMap::new();
map.insert("count", 0);
map.entry("count").and_modify(|e| *e += 1).or_insert(0);
map.entry("count").and_modify(|e| *e += 1).or_insert(0);
```

## 编程练习

### 练习 1：创建和查询 HashMap

创建一个 HashMap 存储学生姓名和分数，然后查询特定学生的分数。

```
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();

    // TODO: 添加三个学生及其分数
    // Alice: 88, Bob: 92, Charlie: 85


    // TODO: 查询 Alice 的分数，如果存在打印，不存在打印"学生不存在"


    // TODO: 检查 "Diana" 是否存在，不存在则添加分数 90


    for (name, score) in scores {
        println!("{}: {}", name, score);
    }
}
```

### 练习 2：更新和删除

在 HashMap 中更新值和删除键。

```
use std::collections::HashMap;

fn main() {
    let mut inventory = HashMap::new();
    inventory.insert("apple", 10);
    inventory.insert("banana", 5);
    inventory.insert("cherry", 8);

    println!("初始库存：{:?}", inventory);

    // TODO: 将苹果的数量增加 5 个（用 entry().and_modify(|e| *e += 5)）

    println!("苹果现在有 {} 个", inventory.get("apple").unwrap());

    // TODO: 删除香蕉并打印删除的数量
    if let Some(count) =  {
        println!("删除的香蕉数量：{}", count);
    }

    // TODO: 添加新的水果 "grape"，数量 12


    // TODO: 打印最终库存
    println!("最终库存：{:?}", inventory);
}
```
# 代码判断题

## 题目 1：向量与所有权

```
fn main() {
    let mut vec = vec![1, 2, 3];
    let first = &vec[0];

    vec.push(4);

    println!("{}", first);
}
```

## 题目 2：String 与 &str 的区别

```
fn modify_string(s: &mut String) {
    s.push_str("!");
}

fn main() {
    let s = "Hello";
    modify_string(s);
}
```

## 题目 3：HashMap 的所有权转移

```
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    let key = String::from("name");

    map.insert(key, "Alice");

    println!("{}", key);
}
```

## 题目 4：向量的迭代与修改

```
fn main() {
    let mut vec = vec![1, 2, 3];

    for val in &vec {
        if *val == 2 {
            vec.push(4);
        }
    }
}
```

## 题目 5：字符串查找

```
fn main() {
    let s = String::from("hello");
    let sub = "ll";

    if s.contains(sub) {
        println!("找到了");
    }
}
```

---
# 编程练习

## 练习 1：向量去重

从一个向量中移除所有重复的元素，保留第一次出现的值。

**任务：**

- 实现 `deduplicate()` 函数，接收 `Vec<i32>`，返回去重后的新向量
- 只保留每个值的第一次出现

**格式要求：**

- 输入：`[1, 2, 2, 3, 1, 4, 3]`
- 输出：`[1, 2, 3, 4]`

**提示：**

- 可以创建一个新的空向量
- 遍历原向量，检查元素是否已在结果向量中
- `vec.contains(&x)` 可以检查是否存在

```
fn deduplicate(vec: Vec<i32>) -> Vec<i32> {
    // TODO: 创建结果向量，遍历原向量去重
    Vec::new()
}

fn main() {
    let nums = vec![1, 2, 2, 3, 1, 4, 3];
    let result = deduplicate(nums);
    println!("{:?}", result);
}
```

## 练习 2：单词频率统计

统计文本中每个单词出现的次数，输出频率最高的单词。

**任务：**

- 实现 `most_frequent_word()` 函数，接收 `&str`
- 返回出现次数最多的单词和出现次数
- 格式：`"{word}" 出现了 {count} 次`
- 假设单词用空格分隔

**格式要求：**

- 输入：`"the cat and the dog and the bird"`
- 输出：`"the" 出现了 3 次`

**提示：**

- 用 `split_whitespace()` 方法分割单词
- 使用 HashMap 存储单词计数
- 使用 `entry().and_modify().or_insert()` 更新计数
- 找出最大值

```
use std::collections::HashMap;

fn most_frequent_word(text: &str) -> String {
    // TODO: 统计单词频率，返回频率最高的单词
    String::new()
}

fn main() {
    let text = "the cat and the dog and the bird";
    println!("{}", most_frequent_word(text));
}
```
Rust 的类型系统远不止于”声明变量的类型”。本章深入四个主题：编译器如何在大多数场景下自动推断类型，`as` 关键字如何进行显式数值转换，类型别名如何增强代码可读性，以及 newtype 模式如何用零开销的方式创建出语义不同的新类型——让编译器帮你区分「米」和「厘米」。

## 本章目录

| 文章              | 主要内容            |
| --------------- | --------------- |
| 编译器如何根据上下文推断变量和表达式的类型 |                 |
| as              | 关键字的数值类型显式转换与注意事项 |
| type            | 关键字给已有类型起别名，提升可读性 |
| 用单字段元组结构体创建真正的新类型，实现编译期类型隔离 |                 |
# 类型推导基础

## 为什么需要类型推导

在很多编程语言中，你需要为每一个变量显式标注类型：

```
// 如果没有类型推导，你需要写：
let x: i32 = 5;
let name: String = String::from("Alice");
let nums: Vec<i32> = Vec::new();
```

这样做很冗长。Rust 设计了一个**聪明的类型推导引擎**，让编译器自动推断变量的类型。这不仅使代码更简洁，还不失安全性——编译器会在无法确定类型时明确告诉你。

类型推导的核心理念：**编译器通过你使用变量的方式来推断它的类型**。

## 基本推导规则

### 从初始化值推导

最直接的方式是从右边赋予的值推导类型：

```
fn main() {
    let x = 5;              // 推导为 i32（Rust 整数默认类型）
    let y = 5.0;            // 推导为 f64（Rust 浮点数默认类型）
    let name = "hello";     // 推导为 &str（字符串字面量）
    let b = true;           // 推导为 bool

    println!("x: {:?}, y: {:?}, name: {:?}, b: {:?}", x, y, name, b);
}
```

### 从使用方式推导

编译器不只看初始化，还会看变量**之后如何被使用**。这是 Rust 类型推导最强大的地方：

```
fn main() {
    // 创建一个空向量，此时编译器还不知道元素类型
    let mut vec = Vec::new();

    // 向其中添加 5u8（无符号 8 位整数）
    vec.push(5u8);

    // 现在编译器推导出：vec 是 Vec<u8>
    println!("vec: {:?}", vec);

    // 再看这个例子
    let mut collection = Vec::new();
    collection.push(10);    // 这一行确定了元素类型是 i32
    println!("collection: {:?}", collection);
}
```

### 跨行推导

类型推导可以**跨越多行代码**。编译器会汇总所有线索来确定类型：

```
fn main() {
    let mut numbers = Vec::new();

    // 第 1 行：暂时还是 Vec<_>

    numbers.push(42);
    // 第 2 行：现在是 Vec<i32>

    numbers.push(100);
    // 第 3 行：仍然是 Vec<i32>

    println!("{:?}", numbers);
}
```

## 何时显式标注类型

虽然 Rust 的推导很强大，但有些情况下**必须**或**应该**显式标注类型。

### 必须标注的情况

**1. 空初始化**

空集合无法推导元素类型：

```
fn main() {
    // 错误！编译器不知道要什么类型
    // let empty = Vec::new();

    // 正确：显式标注
    let empty: Vec<i32> = Vec::new();
    println!("empty vec: {:?}", empty);
}
```

**2. 多个可能的类型**

有时推导会产生歧义，编译器拒绝猜测：

```
fn main() {
    // 错误！5 既可以是 i32、i64、u32 等
    // let x = 5;
    // x.parse::<...>() 会推导失败

    // 正确：明确指定类型
    let x: i32 = 5;
    let y: u8 = 5;
    let z: f64 = 5.0;

    println!("x: {}, y: {}, z: {}", x, y, z);
}
```

**3. 函数参数和返回值**

函数签名中**必须**显式标注参数和返回类型（这不是推导，而是接口要求）：

```
fn add(x: i32, y: i32) -> i32 {
    x + y
}

fn main() {
    let result = add(3, 4);  // 调用时不需要标注，但函数定义中必须
    println!("result: {}", result);
}
```

### 应该标注的情况

**1. 提高代码可读性**

即使编译器能推导，但代码可能会不清楚：

```
fn main() {
    // 难以一眼看出类型
    let data = vec![1, 2, 3];

    // 更清晰
    let numbers: Vec<i32> = vec![1, 2, 3];

    println!("{:?}", numbers);
}
```

**2. 函数返回值有歧义**

某些方法可能返回多种类型，需要显式指定：

```
fn main() {
    // turbofish 语法 ::<type>
    // parse 方法可以返回 i32、u32、f64 等
    let num: i32 = "42".parse().expect("无法解析");

    // 或者用 turbofish
    let num2 = "42".parse::<u32>().expect("无法解析");

    println!("num: {}, num2: {}", num, num2);
}
```

## 类型推导的限制

### 限制 1：不跨越函数边界

编译器**不会**根据函数调用方来推导函数内部的类型。每个函数都是独立的类型检查单元：

```
fn process(x) {  // 错误！函数参数必须标注类型
    println!("{}", x);
}

fn main() {
    process(42);
}
```

### 限制 2：无法改变变量的已推导类型

一旦变量被推导为某个类型，就无法再赋予不同类型的值：

```
fn main() {
    let mut value = 5;  // 推导为 i32

    // 错误！无法改变已推导的类型
    value = "hello";  // "hello" 是 &str，与 i32 冲突
}
```

### 限制 3：过度使用 `_` 通配符

虽然可以用 `_` 让编译器推导，但过度使用会降低可读性：

```
fn main() {
    // 可以接受
    let numbers: Vec<_> = vec![1, 2, 3];

    // 不推荐（太模糊）
    // let x: _ = 42;

    println!("{:?}", numbers);
}
```

## 实战例子：集合类型推导

### 向量元素类型推导

```
fn main() {
    // 例子 1：从 push 推导
    let mut vec = Vec::new();
    vec.push("hello");
    vec.push("world");
    // 现在 vec 是 Vec<&str>

    // 例子 2：从初始化宏推导
    let nums = vec![1, 2, 3, 4];
    // 自动推导为 Vec<i32>

    // 例子 3：需要显式标注
    let colors: Vec<&str> = vec![];
    // 空向量需要标注

    println!("vec: {:?}", vec);
    println!("nums: {:?}", nums);
    println!("colors: {:?}", colors);
}
```

### HashMap 键值类型推导

```
use std::collections::HashMap;

fn main() {
    // 从 insert 推导键值类型
    let mut scores = HashMap::new();
    scores.insert("Alice", 88);
    scores.insert("Bob", 92);
    // 推导为 HashMap<&str, i32>

    // 空 HashMap 需要标注
    let empty: HashMap<String, i32> = HashMap::new();

    println!("scores: {:?}", scores);
    println!("empty: {:?}", empty);
}
```


## 类型推导测验

```
let x = 5;
```

```
let mut vec = Vec::new();
vec.push(42);
vec.push("hello");
```

```
let mut x = 5;
x = "hello";
```

## 编程练习

### 练习 1：修复类型推导冲突

下面的代码存在类型推导冲突。修复这些冲突（可以通过改变值的类型、添加显式标注或改变赋值顺序）：

```
fn main() {
    // 错误 1：混合类型
    // let mut values = Vec::new();
    // values.push(42);
    // values.push("hello");
    // println!("{:?}", values);

    // 错误 2：类型冲突
    // let mut x = 5;
    // x = "world";
    // println!("{}", x);

    // TODO: 修复上面的两个错误，保持输出正确

    println!("修复成功！");
}
```
# 类型铸造基础

## 为什么需要类型铸造

不同类型的数据之间有时需要互相转换。例如：

- 将浮点数转为整数
- 将整数转为字符
- 将小范围的整数转为大范围的整数

Rust **不提供隐式类型转换**（除了某些特殊情况如自动解引用）。这是 Rust 的安全哲学：**显式优于隐式**。如果你想转换类型，必须明确地说出来。

这样做的好处：

- **防止意外的数据丢失**（如 `f64 -> i32` 丢失小数部分）
- **明确意图**（代码清晰可读）
- **捕获错误**（编译器会检查非法转换）

## 基本语法

使用 `as` 关键字进行显式类型转换：

```
fn main() {
    // 浮点数 -> 整数
    let float_val: f32 = 65.4;
    let int_val = float_val as i32;
    println!("浮点数 {} 转为整数 {}", float_val, int_val);

    // 整数 -> 浮点数
    let num = 100;
    let float_num = num as f64;
    println!("整数 {} 转为浮点数 {}", num, float_num);

    // 整数 -> 字符
    let code = 65u8;
    let character = code as char;
    println!("整数 {} 转为字符 '{}'", code, character);
}
```

## 整数转换规则

### 无符号整数之间的转换

当从一个无符号整数类型转换到另一个时，**只保留有效位**。多余的高位被丢弃：

```
fn main() {
    // 1000 在 u8 范围内吗？u8 最大值是 255，所以不在
    // 1000 的二进制是 11111010000（11 位）
    // 只保留低 8 位：11101000 = 232
    let value = 1000u16;
    let narrow = value as u8;
    println!("1000 as u8 = {} (期望 232)", narrow);

    // 验证：1000 mod 256 = 232
    println!("1000 % 256 = {}", 1000 % 256);
}
```

> 记住：对于无符号整数转换，转换后的值相当于原值对 2^(目标位数) 取模。


### 有符号整数的转换

有符号整数的转换涉及**二进制补码**（two’s complement）。转换规则：

- **如果值在目标范围内**，直接转换
- **如果值超出范围**，先转为对应的无符号类型（按上面的规则），再按二进制补码解释

```
fn main() {
    // 例子 1：值在范围内
    let num = 128i32;
    let as_i16 = num as i16;
    println!("128 as i16 = {}", as_i16);  // 仍是 128

    // 例子 2：值超出范围
    // 128 作为 u8 还是 128
    // 但 128 的二进制补码被解释为 i8 时，最高位是 1，所以是负数
    // 128 = 10000000 (i8) -> -128
    let num2 = 128i32;
    let as_i8 = num2 as i8;
    println!("128 as i8 = {} (二进制补码解释为 -128)", as_i8);

    // 例子 3：负数转无符号
    // -1 的二进制补码是 11111111（所有位都是 1）
    // 转为 u8 后保留所有 8 位，结果是 255
    let neg = -1i8;
    let as_u8 = neg as u8;
    println!("-1 as u8 = {}", as_u8);
}
```

### 有符号转无符号，无符号转有符号

```
fn main() {
    // 有符号 -> 无符号：按二进制补码转换
    let signed: i32 = -42;
    let unsigned = signed as u32;
    println!("-42 as u32 = {}", unsigned);  // 大正数

    // 无符号 -> 有符号：按二进制补码解释
    let unsigned2: u32 = 4294967254;  // 就是 -42 的二进制表示
    let signed2 = unsigned2 as i32;
    println!("4294967254 as i32 = {}", signed2);  // -42
}
```

## 浮点数转换

### 浮点数 -> 整数

转换时**舍弃小数部分**（向 0 取整）：

```
fn main() {
    let f1 = 3.99f32;
    let i1 = f1 as i32;
    println!("3.99 as i32 = {} (舍弃小数部分)", i1);  // 3

    let f2 = -3.99f32;
    let i2 = f2 as i32;
    println!("-3.99 as i32 = {}", i2);  // -3

    // 如果浮点数太大，超出整数范围会产生未定义行为
    // （在实践中通常转为 0 或该类型的最小值）
}
```

### 整数 -> 浮点数

通常没有精度问题，因为浮点数范围更大：

```
fn main() {
    let i = 100i32;
    let f = i as f64;
    println!("{} as f64 = {}", i, f);

    // 但大整数可能因浮点精度限制而丧失精确性
    let big = 1_000_000_000_000_000_i64;
    let f_big = big as f64;
    println!("大整数转浮点：{} -> {}", big, f_big);
}
```

### 浮点数 -> 浮点数

```
fn main() {
    let f32_val: f32 = 3.14;
    let f64_val = f32_val as f64;
    println!("f32 {} -> f64 {}", f32_val, f64_val);

    let f64_val2: f64 = 2.71828;
    let f32_val2 = f64_val2 as f32;
    println!("f64 {} -> f32 {}", f64_val2, f32_val2);  // 精度可能丧失
}
```

## 字符和整数的转换

### 整数 -> 字符

使用 `as char` 将有效的 Unicode 标量值转为字符：

```
fn main() {
    let codes = vec![65u8, 66, 67, 68];

    for code in codes {
        let ch = code as char;
        println!("{} -> '{}'", code, ch);
    }
}
```

### 字符 -> 整数

使用 `as u32` 获得 Unicode 代码点：

```
fn main() {
    let chars = vec!['A', 'B', 'C', '中'];

    for ch in chars {
        let code = ch as u32;
        println!("'{}' -> {}", ch, code);
    }
}
```

> 注意：不是所有整数都对应有效的 Unicode 字符。转换时 Rust 不检查有效性（这是 as 的限制）。如果需要安全的转换，应使用 char::from_u32()。


## 常见陷阱

### 陷阱 1：溢出时的未定义行为

在 release 模式下，整数溢出不会 panic，而是**环绕**：

```
fn main() {
    // Debug 模式会 panic，release 模式会环绕
    #[cfg(debug_assertions)]
    println!("Debug 模式：大整数转 u8 可能 panic");

    #[cfg(not(debug_assertions))]
    println!("Release 模式：大整数转 u8 会环绕");

    let large = 256u16;
    let small = large as u8;
    println!("256 as u8 = {}", small);  // 0（环绕）
}
```

### 陷阱 2：浮点转整数时的精度丧失

```
fn main() {
    let f = 123.456f64;
    let i = f as i32;
    println!("123.456 转为整数：{}", i);  // 123（小数丢失）
}
```

### 陷阱 3：转换顺序很重要

```
fn main() {
    let a = 1000i32;

    // 方式 1：先转 u8，再转 f64
    let result1 = (a as u8) as f64;
    println!("(1000 as u8) as f64 = {}", result1);  // 232.0

    // 方式 2：先转 f64，再转 u8
    let result2 = (a as f64) as u8;
    println!("(1000 as f64) as u8 = {}", result2);  // 232

    // 两者结果相同，但过程不同
}
```


## 类型铸造测验

```
fn main() {
    let x: u8 = 256u16 as u8;
    println!("{}", x);
}
```

```
fn main() {
    let f: f32 = 3.7;
    let i = f as i32;
    println!("{}", i);
}
```

```
fn main() {
    let x: i8 = 128i32 as i8;
    println!("{}", x);
}
```

```
let x = 5u32;
// 如何安全地转为 char？
```

## 编程练习

### 练习 1：整数转换

完成下面的代码，使其正确输出各种整数转换的结果：

```
fn main() {
    // TODO: 将 1000u16 转为 u8，输出结果和预期
    let val1 = 1000u16;


    // TODO: 将 -42i32 转为 u32，输出结果
    let val2 = -42i32;


    // TODO: 将 255i32 转为 i8，输出结果
    let val3 = 255i32;


    println!("1000 as u8 预期 232，实际 {}", val1);
    println!("-42 as u32 预期大数，实际 {}", val2);
    println!("255 as i8 预期 -1，实际 {}", val3);
}
```

### 练习 2：浮点和字符转换

完成下面的代码，实现浮点数和字符的转换：

```
fn main() {
    // TODO: 将浮点数 3.99 转为 i32，存储在 int_val
    let float_val = 3.99f32;


    // TODO: 将整数 65 转为 char，存储在 char_val
    let int_code = 65u8;


    // TODO: 将字符 'Z' 转为 u32，存储在 code
    let character = 'Z';


    println!("浮点数 {} 转为整数：{}", float_val, int_val);
    println!("整数 {} 转为字符：'{}'", int_code, char_val);
    println!("字符 '{}' 转为代码：{}", character, code);
}
```
# 类型别名基础

## 什么是类型别名

**类型别名** 让你为现有类型起一个新的、更简洁或更具语义化的名字，使用 `type` 关键字：

```
// 为 u64 起别名
type Milliseconds = u64;

fn main() {
    let duration: Milliseconds = 1000;
    println!("持续时间：{} 毫秒", duration);
}
```

## 为什么使用类型别名

### 1. 提高代码可读性

对于复杂的泛型类型，别名能显著提高可读性：

```
use std::collections::HashMap;

// 没有别名
// let cache: HashMap<String, Vec<i32>> = HashMap::new();

// 使用别名
type Cache = HashMap<String, Vec<i32>>;

fn main() {
    let cache: Cache = HashMap::new();
    println!("cache 已初始化");
}
```

### 2. 减少重复代码

当你多次使用同一复杂类型时：

```
use std::io;

// 常见做法：Result<T, std::io::Error> 缩写为 IoResult<T>
type IoResult<T> = Result<T, io::Error>;

fn read_file() -> IoResult<String> {
    // 返回类型简洁多了
    Ok(String::from("content"))
}

fn main() {
    match read_file() {
        Ok(content) => println!("读取成功：{}", content),
        Err(_) => println!("读取失败"),
    }
}
```

## 别名的作用域和命名规则

### 命名规范

类型别名应使用 **CamelCase**（驼峰命名法）：

```
// 正确
type UserId = u32;
type CacheEntry = (String, Vec<i32>);

// 不规范（会产生编译警告）
// type user_id = u32;

fn main() {
    let id: UserId = 42;
    println!("用户 ID: {}", id);
}
```

### 别名的作用域

别名在定义作用域内有效，可以在模块中定义：

```
mod network {
    pub type Response = Result<String, String>;
}

fn main() {
    let resp: network::Response = Ok(String::from("OK"));
    println!("{:?}", resp);
}
```

## 别名 vs 新类型（重要区别）

**关键点**：类型别名**不创建新类型**，它只是给现有类型换个名字。**因此不提供类型安全**

```
type UserId = u32;
type ProductId = u32;

fn main() {
    let user_id: UserId = 1;
    let product_id: ProductId = 2;

    // 这是允许的！因为别名不提供类型安全
    let sum = user_id + product_id;
    println!("用户 ID {} + 产品 ID {} = {}", user_id, product_id, sum);
}
```

> 警告：如果你需要真正的类型安全（使 UserId 和 ProductId 不兼容），应该使用 newtype 模式（结构体包装），而不是别名。


## 实战例子

### 例子 1：简化 Result 类型

```
use std::num::ParseIntError;

// 定义自定义 Result 别名
type ParseResult<T> = Result<T, ParseIntError>;

fn parse_number(s: &str) -> ParseResult<i32> {
    s.parse()
}

fn main() {
    match parse_number("42") {
        Ok(num) => println!("解析成功：{}", num),
        Err(_) => println!("解析失败"),
    }
}
```

### 例子 2：复杂嵌套类型的别名

```
use std::collections::HashMap;

// 复杂类型别名
type UserDatabase = HashMap<String, Vec<(String, u32)>>;
// 等价于：HashMap<用户名, 记录列表(姓名, 年龄)>

fn main() {
    let mut db: UserDatabase = HashMap::new();

    // 添加数据
    db.insert(
        "user1".to_string(),
        vec![("Alice".to_string(), 30)]
    );

    println!("数据库：{:?}", db);
}
```

### 例子 3：泛型类型别名

别名也可以是泛型：

```
// 定义一个泛型别名
type Pair<T> = (T, T);

fn main() {
    let int_pair: Pair<i32> = (1, 2);
    let str_pair: Pair<&str> = ("hello", "world");

    println!("int_pair: {:?}", int_pair);
    println!("str_pair: {:?}", str_pair);
}
```

## 何时使用类型别名

✅ **适合使用别名：**

- 复杂的泛型类型重复出现多次
- 为了增强代码的自文档化（别名名字说明用途）
- 统一管理某个复杂类型的定义

❌ **不应该用别名：**

- 希望提供类型安全隔离（用 newtype 代替）
- 只使用一次（没有重复）
- 别名不能添加方法（如需要，用结构体）


## 类型别名测验

```
type UserId = u32;
type ProductId = u32;

fn main() {
    let id1: UserId = 1;
    let id2: ProductId = 2;
    let sum = id1 + id2;
}
```

## 编程练习

### 练习 1：为复杂类型定义别名

使用别名简化以下代码：

```
use std::collections::HashMap;

fn main() {
    // TODO: 定义类型别名 ServerResponse，表示 Result<String, String>


    // TODO: 定义类型别名 UserCache，表示 HashMap<String, i32>


    // 使用别名声明变量
    let response: ServerResponse = Ok("success".to_string());
    let cache: UserCache = HashMap::new();

    println!("response: {:?}", response);
    println!("cache: {:?}", cache);
}
```
# Newtype 模式

## 相同类型，不同语义

考虑一个简单场景：你的程序需要处理距离，有时是米，有时是厘米。两者的底层值都是 `f64`，但混用会出大问题：

```
fn add_lengths(a: f64, b: f64) -> f64 {
    a + b
}

fn main() {
    let distance_m = 1.5;
    let distance_cm = 150.0;

    // 能编译，但语义是错的：1.5 米 + 150 厘米 ≠ 151.5 米
    let total = add_lengths(distance_m, distance_cm);
    println!("total = {}", total); // 151.5，完全错误
}
```

编译器毫无怨言地接受了这个错误——因为它们都是 `f64`，无法区分。

**Newtype 模式**的核心思路：把底层类型包裹在一个**单字段元组结构体**里，让它成为一个新类型：

```
struct Meters(f64);
struct Centimeters(f64);

fn add_meters(a: Meters, b: Meters) -> Meters {
    Meters(a.0 + b.0)
}

fn main() {
    let distance_m = Meters(1.5);
    let distance_cm = Centimeters(150.0);

    add_meters(distance_m, distance_cm); // 编译错误！类型不匹配
}
```

> 错误被提前到了编译期，代码运行之前就被阻止了。


## 定义和访问内部值

Newtype 就是一个**元组结构体**，语法极简：

```
struct Meters(f64);

fn main() {
    let m = Meters(42.0);

    // 用 .0 访问内部值（元组结构体第一个字段）
    println!("距离：{} 米", m.0);

    // 也可以解构
    let Meters(value) = m;
    println!("值：{}", value);
}
```

## 为 newtype 实现方法

Newtype 是完整的类型，可以为它实现任何方法：

```
use std::fmt;

struct Meters(f64);
struct Centimeters(f64);

impl Meters {
    fn to_centimeters(&self) -> Centimeters {
        Centimeters(self.0 * 100.0)
    }
}

impl Centimeters {
    fn to_meters(&self) -> Meters {
        Meters(self.0 / 100.0)
    }
}

impl fmt::Display for Meters {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} m", self.0)
    }
}

impl fmt::Display for Centimeters {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{} cm", self.0)
    }
}

fn main() {
    let d = Meters(1.5);
    println!("{}", d);                              // 1.5 m
    println!("{}", d.to_centimeters());             // 150 cm
    println!("{}", d.to_centimeters().to_meters()); // 1.5 m
}
```

## 零开销保证

Newtype 包装在运行时**完全没有开销**。

`struct Meters(f64)` 在内存中和裸 `f64` 布局完全相同，没有额外字段或指针。这个”包装”只存在于编译期的类型检查阶段，机器码层面编译器直接操作内部的 `f64`。


## Newtype 测验

```
struct UserId(u64);
struct PostId(u64);

fn get_user(id: UserId) -> String {
    format!("用户 #{}", id.0)
}
```

## 编程练习

下面的代码用裸 `u64` 表示两种 ID，导致 `validate_user(session_id)` 能通过编译。请用 newtype 模式定义 `UserId` 和 `SessionId`，让最后一行产生编译错误。

```
// TODO: 把下面两行改成 newtype 定义
type UserId = u64;
type SessionId = u64;

fn validate_user(id: UserId) -> bool {
    id > 0
}

fn validate_session(id: SessionId) -> bool {
    id > 1000
}

fn main() {
    let uid = UserId(42);       // 改完后这里能用
    let sid = SessionId(9001);

    println!("用户有效: {}", validate_user(uid));
    println!("会话有效: {}", validate_session(sid));

    // 改完后取消注释，应该编译失败：
    // validate_user(sid);
}
```