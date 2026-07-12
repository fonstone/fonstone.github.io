---
title: "枚举"
description: "自定义类型 - 枚举"
date: "2026-07-12"
order: 4003
tags: ["枚举", "enum", "成员", "变体", "关联数据"]
est_time: "25 分钟"
---

 <h1 id="什么是枚举">什么是枚举</h1>
<p><strong>枚举</strong>（enum）允许你定义一个类型，其值<strong>只能是预先列举的几个成员之一</strong>。</p>
<p>日常比喻：一个消息可能是”收到新邮件”、“收到推送通知”或”收到短信”，但同一时刻只能是其中一种。这正是枚举的用途。</p>
<h2 id="为什么需要枚举">为什么需要枚举</h2>
<p>比如你要表示网络请求的状态：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E4%B8%8D%E5%A5%BD%E7%9A%84%E5%81%9A%E6%B3%95%EF%BC%9A%E7%94%A8%E5%A4%9A%E4%B8%AA%E5%B8%83%E5%B0%94%E5%AD%97%E6%AE%B5%EF%BC%8C%E5%AE%B9%E6%98%93%E9%99%B7%E5%85%A5%E7%9F%9B%E7%9B%BE%E7%8A%B6%E6%80%81%0Astruct%20RequestStatus%20%7B%0A%20%20%20%20is_pending%3A%20bool%2C%0A%20%20%20%20is_success%3A%20bool%2C%0A%20%20%20%20is_error%3A%20bool%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E8%BF%99%E4%B8%AA%E7%8A%B6%E6%80%81%E6%98%AF%E4%BB%80%E4%B9%88%EF%BC%9F%E5%90%8C%E6%97%B6%E6%98%AF%20success%20%E5%92%8C%20error%EF%BC%9F%E8%BF%99%E6%B2%A1%E6%9C%89%E6%84%8F%E4%B9%89%EF%BC%81%0A%20%20%20%20let%20status%20%3D%20RequestStatus%20%7B%0A%20%20%20%20%20%20%20%20is_pending%3A%20true%2C%0A%20%20%20%20%20%20%20%20is_success%3A%20true%2C%0A%20%20%20%20%20%20%20%20is_error%3A%20false%2C%0A%20%20%20%20%7D%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 不好的做法：用多个布尔字段，容易陷入矛盾状态
struct RequestStatus {
    is_pending: bool,
    is_success: bool,
    is_error: bool,
}

fn main() {
    // 这个状态是什么？同时是 success 和 error？这没有意义！
    let status = RequestStatus {
        is_pending: true,
        is_success: true,
        is_error: false,
    };
}</code></pre></div>
<p>用枚举：</p>
<div class="code-runner" data-full-code="enum%20RequestStatus%20%7B%0A%20%20%20%20Pending%2C%0A%20%20%20%20Success%2C%0A%20%20%20%20Error%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%B8%85%E6%99%B0%E6%98%8E%E4%BA%86%EF%BC%9A%E5%8F%AA%E8%83%BD%E6%98%AF%E8%BF%99%E4%B8%89%E4%B8%AA%E7%8A%B6%E6%80%81%E4%B9%8B%E4%B8%80%0A%20%20%20%20let%20status%20%3D%20RequestStatus%3A%3APending%3B%0A%7D" data-mode="run"><pre><code class="language-rust">enum RequestStatus {
    Pending,
    Success,
    Error,
}

fn main() {
    // 清晰明了：只能是这三个状态之一
    let status = RequestStatus::Pending;
}</code></pre></div>
<p>枚举通过编译器的强制，确保<strong>不会陷入无效的状态组合</strong>。</p>
<h2 id="定义和使用枚举">定义和使用枚举</h2>
<p>基本语法：</p>
<div class="code-runner" data-full-code="enum%20Direction%20%7B%0A%20%20%20%20North%2C%0A%20%20%20%20South%2C%0A%20%20%20%20East%2C%0A%20%20%20%20West%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20my_direction%20%3D%20Direction%3A%3ANorth%3B%0A%0A%20%20%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E6%9C%89%E5%A4%9A%E4%B8%AA%E6%88%90%E5%91%98%0A%20%20%20%20let%20go_east%20%3D%20Direction%3A%3AEast%3B%0A%20%20%20%20let%20go_back%20%3D%20Direction%3A%3ASouth%3B%0A%7D" data-mode="run"><pre><code class="language-rust">enum Direction {
    North,
    South,
    East,
    West,
}

fn main() {
    let my_direction = Direction::North;

    // 可以有多个成员
    let go_east = Direction::East;
    let go_back = Direction::South;
}</code></pre></div>
<p><strong>关键点：</strong></p>
<ul>
<li>成员名用 <strong><code>EnumName::MemberName</code></strong> 访问</li>
<li>成员名按惯例用大驼峰</li>
<li>同一枚举的所有成员都是同一类型</li>
</ul>
<h1 id="枚举成员与关联数据">枚举成员与关联数据</h1>
<p>枚举的真正力量在于：<strong>每个成员可以关联不同类型的数据</strong>。</p>
<blockquote>
<p><strong>对于 C 程序员的类比</strong>：Rust 枚举相当于 C 的 <strong>tagged union</strong>（带标签的联合体）。C 的 <code>union</code> 让多个成员共享同一块内存但没有标记当前活跃成员，容易出错。Rust 枚举自动添加标签记录当前变体，编译器强制安全地访问数据，无需手动维护标志位。</p>
</blockquote>
<h2 id="简单关联数据">简单关联数据</h2>
<p>比如，一条消息可能是”发送字符串”或”发送数字”：</p>
<div class="code-runner" data-full-code="enum%20Message%20%7B%0A%20%20%20%20Text(String)%2C%0A%20%20%20%20Number(i32)%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20msg1%20%3D%20Message%3A%3AText(String%3A%3Afrom(%22Hello%22))%3B%0A%20%20%20%20let%20msg2%20%3D%20Message%3A%3ANumber(42)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">enum Message {
    Text(String),
    Number(i32),
}

fn main() {
    let msg1 = Message::Text(String::from("Hello"));
    let msg2 = Message::Number(42);
}</code></pre></div>
<p>每个成员可以关联不同数量和类型的数据：</p>
<div class="code-runner" data-full-code="enum%20Message%20%7B%0A%20%20%20%20Quit%2C%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E6%97%A0%E6%95%B0%E6%8D%AE%0A%20%20%20%20Move%20%7B%20x%3A%20i32%2C%20y%3A%20i32%20%7D%2C%20%20%20%20%20%20%20%2F%2F%20%E7%BB%93%E6%9E%84%E4%BD%93%E9%A3%8E%E6%A0%BC%E7%9A%84%E6%95%B0%E6%8D%AE%0A%20%20%20%20Write(String)%2C%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%8D%95%E4%B8%AA%E5%80%BC%0A%20%20%20%20ChangeColor(i32%2C%20i32%2C%20i32)%2C%20%20%20%20%2F%2F%20%E5%A4%9A%E4%B8%AA%E5%80%BC%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20msg1%20%3D%20Message%3A%3AQuit%3B%0A%20%20%20%20let%20msg2%20%3D%20Message%3A%3AMove%20%7B%20x%3A%2010%2C%20y%3A%2020%20%7D%3B%0A%20%20%20%20let%20msg3%20%3D%20Message%3A%3AWrite(String%3A%3Afrom(%22hello%22))%3B%0A%20%20%20%20let%20msg4%20%3D%20Message%3A%3AChangeColor(255%2C%200%2C%200)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">enum Message {
    Quit,                          // 无数据
    Move { x: i32, y: i32 },       // 结构体风格的数据
    Write(String),                 // 单个值
    ChangeColor(i32, i32, i32),    // 多个值
}

fn main() {
    let msg1 = Message::Quit;
    let msg2 = Message::Move { x: 10, y: 20 };
    let msg3 = Message::Write(String::from("hello"));
    let msg4 = Message::ChangeColor(255, 0, 0);
}</code></pre></div>
<p>这相当于用不同的结构体，但统一在一个类型下。</p>
<h2 id="为什么这比结构体更好">为什么这比结构体更好</h2>
<p>假设没有枚举，你可能这样做：</p>
<div class="code-runner" data-full-code="struct%20MoveMessage%20%7B%0A%20%20%20%20x%3A%20i32%2C%0A%20%20%20%20y%3A%20i32%2C%0A%7D%0A%0Astruct%20WriteMessage%20%7B%0A%20%20%20%20text%3A%20String%2C%0A%7D%0A%0A%2F%2F%20%E7%8E%B0%E5%9C%A8%E8%A6%81%E5%A4%84%E7%90%86%E8%BF%99%E4%BA%9B%E6%B6%88%E6%81%AF%EF%BC%8C%E5%86%99%E7%9A%84%E5%87%BD%E6%95%B0%E5%BE%88%E9%9A%BE%E5%A4%84%E7%90%86..." data-mode="run"><pre><code class="language-rust">struct MoveMessage {
    x: i32,
    y: i32,
}

struct WriteMessage {
    text: String,
}

// 现在要处理这些消息，写的函数很难处理...</code></pre></div>
<p>用枚举就简单了，所有消息都是一种类型。</p>
<h1 id="为枚举定义方法">为枚举定义方法</h1>
<p>像结构体一样，枚举也可以有方法：</p>
<div class="code-runner" data-full-code="enum%20GameResult%20%7B%0A%20%20%20%20Win%2C%0A%20%20%20%20Lose%2C%0A%20%20%20%20Draw%2C%0A%7D%0A%0Aimpl%20GameResult%20%7B%0A%20%20%20%20fn%20message(%26self)%20-%3E%20String%20%7B%0A%20%20%20%20%20%20%20%20match%20self%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20GameResult%3A%3AWin%20%3D%3E%20String%3A%3Afrom(%22%E4%BD%A0%E8%B5%A2%E4%BA%86%EF%BC%81%22)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20GameResult%3A%3ALose%20%3D%3E%20String%3A%3Afrom(%22%E4%BD%A0%E8%BE%93%E4%BA%86%22)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20GameResult%3A%3ADraw%20%3D%3E%20String%3A%3Afrom(%22%E5%B9%B3%E5%B1%80%22)%2C%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20result%20%3D%20GameResult%3A%3AWin%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20result.message())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">enum GameResult {
    Win,
    Lose,
    Draw,
}

impl GameResult {
    fn message(&amp;self) -&gt; String {
        match self {
            GameResult::Win =&gt; String::from("你赢了！"),
            GameResult::Lose =&gt; String::from("你输了"),
            GameResult::Draw =&gt; String::from("平局"),
        }
    }
}

fn main() {
    let result = GameResult::Win;
    println!("{}", result.message());
}</code></pre></div>
<p>（这里用到了 <code>match</code>，后续会详细讲）</p>
<h1 id="常见枚举模式">常见枚举模式</h1>
<h2 id="状态机">状态机</h2>
<p>用枚举模型系统状态：</p>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Aenum%20PlayerState%20%7B%0A%20%20%20%20Idle%2C%0A%20%20%20%20Walking%2C%0A%20%20%20%20Running%2C%0A%20%20%20%20Jumping%20%7B%20height%3A%20u32%20%7D%2C%0A%7D%0A%0Aimpl%20PlayerState%20%7B%0A%20%20%20%20fn%20can_jump(%26self)%20-%3E%20bool%20%7B%0A%20%20%20%20%20%20%20%20match%20self%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20PlayerState%3A%3AIdle%20%7C%20PlayerState%3A%3AWalking%20%3D%3E%20true%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20_%20%3D%3E%20false%2C%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20state%20%3D%20PlayerState%3A%3AIdle%3B%0A%20%20%20%20println!(%22%E5%BD%93%E5%89%8D%E7%8A%B6%E6%80%81%E8%83%BD%E8%B7%B3%E5%90%97%EF%BC%9F%7B%7D%22%2C%20state.can_jump())%3B%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
enum PlayerState {
    Idle,
    Walking,
    Running,
    Jumping { height: u32 },
}

impl PlayerState {
    fn can_jump(&amp;self) -&gt; bool {
        match self {
            PlayerState::Idle | PlayerState::Walking =&gt; true,
            _ =&gt; false,
        }
    }
}

fn main() {
    let state = PlayerState::Idle;
    println!("当前状态能跳吗？{}", state.can_jump());
}</code></pre></div>
<h2 id="错误表示">错误表示</h2>
<p>用枚举表示各种错误情况（先了解，后续错误处理章节会深入）：</p>
<div class="code-runner" data-full-code="enum%20FileError%20%7B%0A%20%20%20%20NotFound%2C%0A%20%20%20%20PermissionDenied%2C%0A%20%20%20%20UnknownError(String)%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20error%20%3D%20FileError%3A%3ANotFound%3B%0A%7D" data-mode="run"><pre><code class="language-rust">enum FileError {
    NotFound,
    PermissionDenied,
    UnknownError(String),
}

fn main() {
    let error = FileError::NotFound;
}</code></pre></div>
<h1 id="练习题">练习题</h1>
<pre><code class="language-rust">enum TrafficLight {
    Red,
    Yellow,
    Green,
}</code></pre>
</div>
<pre><code class="language-rust">enum Color {
    Red(u8, u8, u8),
    Hex(String),
}

fn main() {
    let color1 = Color::Red(255, 0, 0);
    let color2 = Color::Hex(String::from("#FF0000"));
}</code></pre>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习-1定义包含关联数据的枚举">练习 1：定义包含关联数据的枚举</h3>
<p>定义一个 <code>FileOperation</code> 枚举，包含以下成员：</p>
<ul>
<li><code>Create(String)</code> — 创建文件（参数是文件名）</li>
<li><code>Delete(String)</code> — 删除文件</li>
<li><code>Read(String)</code> — 读取文件</li>
<li><code>Write { filename: String, content: String }</code> — 写入文件</li>
</ul>
<p>创建几个实例并打印（需要派生 Debug）：</p>
<div class="code-editor" data-block-id="04-custom-types/03-enums#4:3" data-expect-mode="literal" data-expect-pattern="Create(%22test.txt%22)%0AWrite%20%7B%20filename%3A%20%22test.txt%22%2C%20content%3A%20%22Hello%2C%20world!%22%20%7D%0ARead(%22test.txt%22)" data-starter-code="%23%5Bderive(Debug)%5D%0Aenum%20FileOperation%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9A%E4%B9%89%E5%9B%9B%E4%B8%AA%E6%88%90%E5%91%98%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20op1%20%3D%20FileOperation%3A%3ACreate(String%3A%3Afrom(%22test.txt%22))%3B%0A%20%20%20%20let%20op2%20%3D%20FileOperation%3A%3AWrite%20%7B%0A%20%20%20%20%20%20%20%20filename%3A%20String%3A%3Afrom(%22test.txt%22)%2C%0A%20%20%20%20%20%20%20%20content%3A%20String%3A%3Afrom(%22Hello%2C%20world!%22)%2C%0A%20%20%20%20%7D%3B%0A%20%20%20%20let%20op3%20%3D%20FileOperation%3A%3ARead(String%3A%3Afrom(%22test.txt%22))%3B%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20op1)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20op2)%3B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20op3)%3B%0A%7D"><pre><code class="language-rust">#[derive(Debug)]
enum FileOperation {
    // TODO: 定义四个成员
}

fn main() {
    let op1 = FileOperation::Create(String::from("test.txt"));
    let op2 = FileOperation::Write {
        filename: String::from("test.txt"),
        content: String::from("Hello, world!"),
    };
    let op3 = FileOperation::Read(String::from("test.txt"));

    println!("{:?}", op1);
    println!("{:?}", op2);
    println!("{:?}", op3);
}</code></pre></div>
<h3 id="练习-2重构用枚举替代多个结构体">练习 2：重构：用枚举替代多个结构体</h3>
<p>下面用多个结构体定义了不同的网络消息，你的任务是把这段代码改写成用枚举来统一这些消息。</p>
<p><strong>原来的代码（多个结构体）：</strong></p>
<pre><code class="language-rust">struct QuitMessage;               // 关闭应用
struct MoveMessage {
    x: i32,
    y: i32,
}                                // 移动光标
struct WriteMessage {
    text: String,
}                                // 写入文本
struct ChangeColorMessage {
    r: u8,
    g: u8,
    b: u8,
}                                // 改变颜色</code></pre>
<p><strong>你的任务：</strong> 定义一个 <code>Message</code> 枚举，把上面四种消息统一为一个类型。每个成员的关联数据结构应该与原结构体完全对应。然后创建各种类型的消息实例并打印它们。</p>
<div class="code-editor" data-block-id="04-custom-types/03-enums#4:4" data-expect-mode="literal" data-expect-pattern="Quit%0AMove%20%7B%20x%3A%20100%2C%20y%3A%20200%20%7D%0AWrite(%22Hello%22)%0AChangeColor%20%7B%20r%3A%20255%2C%20g%3A%200%2C%20b%3A%200%20%7D" data-starter-code="%2F%2F%20TODO%3A%20%E5%AE%9A%E4%B9%89%20Message%20%E6%9E%9A%E4%B8%BE%EF%BC%8C%E5%8C%85%E5%90%AB%E4%B8%8A%E9%9D%A2%E5%9B%9B%E7%A7%8D%E6%B6%88%E6%81%AF%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20quit%20%3D%20Message%3A%3AQuit%3B%0A%20%20%20%20let%20move_msg%20%3D%20Message%3A%3AMove%20%7B%20x%3A%20100%2C%20y%3A%20200%20%7D%3B%0A%20%20%20%20let%20write_msg%20%3D%20Message%3A%3AWrite(String%3A%3Afrom(%22Hello%22))%3B%0A%20%20%20%20let%20color_msg%20%3D%20Message%3A%3AChangeColor%20%7B%20r%3A%20255%2C%20g%3A%200%2C%20b%3A%200%20%7D%3B%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E4%BD%BF%E7%94%A8%20%7B%3A%3F%7D%20%E6%89%93%E5%8D%B0%E8%BF%99%E5%9B%9B%E4%B8%AA%E6%B6%88%E6%81%AF%EF%BC%88%E9%9C%80%E8%A6%81%E6%B4%BE%E7%94%9F%20Debug%EF%BC%89%0A%7D"><pre><code class="language-rust">// TODO: 定义 Message 枚举，包含上面四种消息

fn main() {
    let quit = Message::Quit;
    let move_msg = Message::Move { x: 100, y: 200 };
    let write_msg = Message::Write(String::from("Hello"));
    let color_msg = Message::ChangeColor { r: 255, g: 0, b: 0 };

    // TODO: 使用 {:?} 打印这四个消息（需要派生 Debug）
}</code></pre></div> 