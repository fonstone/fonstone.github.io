---
title: "结构体中的生命周期"
description: "生命周期 - 结构体中的生命周期"
date: "2026-07-12"
order: 11003
tags: ["struct lifetime", "结构体生命周期", "impl", "方法", "T: 'a", "trait"]
est_time: "30 分钟"
---

 <h1 id="含引用的结构体">含引用的结构体</h1>
<h2 id="为什么结构体需要生命周期">为什么结构体需要生命周期</h2>
<p>到目前为止，你见过的结构体字段都是有所有权的类型，比如 <code>String</code>、<code>Vec&lt;T&gt;</code>、<code>i32</code>。这些类型在结构体销毁时随之销毁，没有引用的问题。</p>
<p>但如果你想让结构体<strong>持有引用</strong>——比如存一个字符串 slice <code>&amp;str</code> 而不是 <code>String</code>——问题就来了：结构体不拥有那块数据，那块数据可能在结构体还活着的时候就被销毁了。</p>
<p>Rust 要求你在定义时明确标注生命周期，保证”结构体实例的生命周期不超过它所引用数据的生命周期”。</p>
<h2 id="基本语法">基本语法</h2>
<p>先看不写标注会发生什么：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E5%AD%97%E6%AE%B5%20part%20%E6%98%AF%20%26str%EF%BC%8C%E4%BD%86%E6%B2%A1%E6%9C%89%E4%BB%BB%E4%BD%95%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E4%BF%A1%E6%81%AF%0Astruct%20ImportantExcerpt%20%7B%0A%20%20%20%20part%3A%20%26str%2C%0A%7D" data-mode="expect-error"><pre><code class="language-rust">// 字段 part 是 &amp;str，但没有任何生命周期信息
struct ImportantExcerpt {
    part: &amp;str,
}</code></pre></div>
<p>编译器直接报错：<code>missing lifetime specifier</code>——结构体持有引用，但编译器不知道这个引用需要活多久，无法做任何保证。</p>
<p>解决方法是在结构体名后声明一个生命周期参数，并把它标注到引用字段上：</p>
<div class="code-runner" data-full-code="%2F%2F%20'a%20%E5%A3%B0%E6%98%8E%E5%9C%A8%E7%BB%93%E6%9E%84%E4%BD%93%E5%90%8D%E5%90%8E%E9%9D%A2%E7%9A%84%E5%B0%96%E6%8B%AC%E5%8F%B7%E9%87%8C%0A%2F%2F%20%E5%AD%97%E6%AE%B5%20part%20%E6%98%AF%E4%B8%80%E4%B8%AA%E4%B8%8E%20'a%20%E5%85%B3%E8%81%94%E7%9A%84%20%26str%20%E5%BC%95%E7%94%A8%0Astruct%20ImportantExcerpt%3C'a%3E%20%7B%0A%20%20%20%20part%3A%20%26'a%20str%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20novel%20%3D%20String%3A%3Afrom(%22%E5%8F%AB%E6%88%91%E4%BC%8A%E5%AE%9E%E9%A9%AC%E5%88%A9%E3%80%82%E4%BB%8E%E5%89%8D%E5%B9%B4%E8%BD%BB%E7%9A%84%E6%97%B6%E5%80%99%E2%80%A6%E2%80%A6%22)%3B%0A%20%20%20%20%2F%2F%20novel%20%E7%9A%84%E6%89%80%E6%9C%89%E6%9D%83%E5%9C%A8%E8%BF%99%E9%87%8C%EF%BC%8C%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E8%A6%86%E7%9B%96%E6%95%B4%E4%B8%AA%20main%0A%20%20%20%20let%20first_sentence%20%3D%20novel.split('%E3%80%82').next().expect(%22%E6%B2%A1%E6%89%BE%E5%88%B0%E5%8F%A5%E5%8F%B7%22)%3B%0A%20%20%20%20%2F%2F%20excerpt%20%E5%BC%95%E7%94%A8%E4%BA%86%20novel%20%E7%9A%84%E4%B8%80%E9%83%A8%E5%88%86%0A%20%20%20%20%2F%2F%20novel%20%E5%BF%85%E9%A1%BB%E6%B4%BB%E5%BE%97%E6%AF%94%20excerpt%20%E6%9B%B4%E4%B9%85%EF%BC%88%E6%88%96%E4%B8%80%E6%A0%B7%E4%B9%85%EF%BC%89%0A%20%20%20%20let%20excerpt%20%3D%20ImportantExcerpt%20%7B%20part%3A%20first_sentence%20%7D%3B%0A%20%20%20%20println!(%22%E6%91%98%E5%BD%95%EF%BC%9A%7B%7D%22%2C%20excerpt.part)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 'a 声明在结构体名后面的尖括号里
// 字段 part 是一个与 'a 关联的 &amp;str 引用
struct ImportantExcerpt&lt;'a&gt; {
    part: &amp;'a str,
}

fn main() {
    let novel = String::from("叫我伊实马利。从前年轻的时候……");
    // novel 的所有权在这里，生命周期覆盖整个 main
    let first_sentence = novel.split('。').next().expect("没找到句号");
    // excerpt 引用了 novel 的一部分
    // novel 必须活得比 excerpt 更久（或一样久）
    let excerpt = ImportantExcerpt { part: first_sentence };
    println!("摘录：{}", excerpt.part);
}</code></pre></div>
<p><code>ImportantExcerpt&lt;'a&gt;</code> 的意思是：这个结构体实例不能比 <code>part</code> 字段所引用的数据活得更久。</p>
<p>如果尝试违反这个约束：</p>
<div class="code-runner" data-full-code="struct%20ImportantExcerpt%3C'a%3E%20%7B%0A%20%20%20%20part%3A%20%26'a%20str%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20excerpt%3B%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20novel%20%3D%20String%3A%3Afrom(%22%E5%8F%AB%E6%88%91%E4%BC%8A%E5%AE%9E%E9%A9%AC%E5%88%A9%E3%80%82%E4%BB%8E%E5%89%8D%E5%B9%B4%E8%BD%BB%E7%9A%84%E6%97%B6%E5%80%99%E2%80%A6%E2%80%A6%22)%3B%0A%20%20%20%20%20%20%20%20let%20first%20%3D%20novel.split('%E3%80%82').next().unwrap()%3B%0A%20%20%20%20%20%20%20%20excerpt%20%3D%20ImportantExcerpt%20%7B%20part%3A%20first%20%7D%3B%0A%20%20%20%20%20%20%20%20%2F%2F%20novel%20%E5%9C%A8%E8%BF%99%E9%87%8C%E8%A2%AB%E9%94%80%E6%AF%81%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22%7B%7D%22%2C%20excerpt.part)%3B%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81excerpt%20%E5%BC%95%E7%94%A8%E4%BA%86%E5%B7%B2%E9%94%80%E6%AF%81%E7%9A%84%20novel%0A%7D" data-mode="expect-error"><pre><code class="language-rust">struct ImportantExcerpt&lt;'a&gt; {
    part: &amp;'a str,
}

fn main() {
    let excerpt;
    {
        let novel = String::from("叫我伊实马利。从前年轻的时候……");
        let first = novel.split('。').next().unwrap();
        excerpt = ImportantExcerpt { part: first };
        // novel 在这里被销毁
    }
    println!("{}", excerpt.part); // 错误！excerpt 引用了已销毁的 novel
}</code></pre></div>
<h2 id="多个生命周期参数">多个生命周期参数</h2>
<p>结构体可以有多个生命周期参数，表示不同字段来自不同的数据源：</p>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Astruct%20TwoRefs%3C'a%2C%20'b%3E%20%7B%0A%20%20%20%20x%3A%20%26'a%20i32%2C%0A%20%20%20%20y%3A%20%26'b%20i32%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20a%20%3D%2010%3B%0A%20%20%20%20let%20result%3B%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20b%20%3D%2020%3B%0A%20%20%20%20%20%20%20%20let%20t%20%3D%20TwoRefs%20%7B%20x%3A%20%26a%2C%20y%3A%20%26b%20%7D%3B%0A%20%20%20%20%20%20%20%20%2F%2F%20a%20%E5%92%8C%20b%20%E5%8F%AF%E4%BB%A5%E6%9C%89%E4%B8%8D%E5%90%8C%E7%9A%84%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%0A%20%20%20%20%20%20%20%20result%20%3D%20*t.x%3B%20%2F%2F%20%E5%8F%AA%E5%A4%8D%E5%88%B6%20x%20%E7%9A%84%E5%80%BC%EF%BC%8C%E4%B8%8D%E5%A4%8D%E5%88%B6%E5%BC%95%E7%94%A8%0A%20%20%20%20%20%20%20%20println!(%22t%20%3D%20%7B%3A%3F%7D%22%2C%20t)%3B%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22a%20%3D%20%7B%7D%22%2C%20result)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
struct TwoRefs&lt;'a, 'b&gt; {
    x: &amp;'a i32,
    y: &amp;'b i32,
}

fn main() {
    let a = 10;
    let result;
    {
        let b = 20;
        let t = TwoRefs { x: &amp;a, y: &amp;b };
        // a 和 b 可以有不同的生命周期
        result = *t.x; // 只复制 x 的值，不复制引用
        println!("t = {:?}", t);
    }
    println!("a = {}", result);
}</code></pre></div>
<h2 id="枚举中的生命周期">枚举中的生命周期</h2>
<p>枚举的变体也可以包含引用，同样需要生命周期标注：</p>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Aenum%20Message%3C'a%3E%20%7B%0A%20%20%20%20Quit%2C%0A%20%20%20%20Move%20%7B%20x%3A%20i32%2C%20y%3A%20i32%20%7D%2C%0A%20%20%20%20Write(%26'a%20str)%2C%20%20%20%20%20%20%20%20%2F%2F%20%E6%8C%81%E6%9C%89%E4%B8%80%E4%B8%AA%E5%AD%97%E7%AC%A6%E4%B8%B2%20slice%20%E5%BC%95%E7%94%A8%0A%20%20%20%20ChangeColor(u8%2C%20u8%2C%20u8)%2C%0A%7D%0A%0Afn%20process(msg%3A%20%26Message)%20%7B%0A%20%20%20%20match%20msg%20%7B%0A%20%20%20%20%20%20%20%20Message%3A%3AWrite(text)%20%3D%3E%20println!(%22%E5%86%99%E5%85%A5%EF%BC%9A%7B%7D%22%2C%20text)%2C%0A%20%20%20%20%20%20%20%20Message%3A%3AMove%20%7B%20x%2C%20y%20%7D%20%3D%3E%20println!(%22%E7%A7%BB%E5%8A%A8%E5%88%B0%20(%7B%7D%2C%20%7B%7D)%22%2C%20x%2C%20y)%2C%0A%20%20%20%20%20%20%20%20Message%3A%3AQuit%20%3D%3E%20println!(%22%E9%80%80%E5%87%BA%22)%2C%0A%20%20%20%20%20%20%20%20Message%3A%3AChangeColor(r%2C%20g%2C%20b)%20%3D%3E%20println!(%22%E9%A2%9C%E8%89%B2%EF%BC%9A%7B%7D%20%7B%7D%20%7B%7D%22%2C%20r%2C%20g%2C%20b)%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20text%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20let%20msg%20%3D%20Message%3A%3AWrite(%26text)%3B%0A%20%20%20%20process(%26msg)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
enum Message&lt;'a&gt; {
    Quit,
    Move { x: i32, y: i32 },
    Write(&amp;'a str),        // 持有一个字符串 slice 引用
    ChangeColor(u8, u8, u8),
}

fn process(msg: &amp;Message) {
    match msg {
        Message::Write(text) =&gt; println!("写入：{}", text),
        Message::Move { x, y } =&gt; println!("移动到 ({}, {})", x, y),
        Message::Quit =&gt; println!("退出"),
        Message::ChangeColor(r, g, b) =&gt; println!("颜色：{} {} {}", r, g, b),
    }
}

fn main() {
    let text = String::from("hello");
    let msg = Message::Write(&amp;text);
    process(&amp;msg);
}</code></pre></div>
<h1 id="impl-块的生命周期">impl 块的生命周期</h1>
<h2 id="基本写法">基本写法</h2>
<p>当你为带生命周期参数的结构体实现方法时，<code>impl</code> 关键字后面也需要声明生命周期：</p>
<div class="code-runner" data-full-code="struct%20Excerpt%3C'a%3E%20%7B%0A%20%20%20%20part%3A%20%26'a%20str%2C%0A%7D%0A%0A%2F%2F%20impl%3C'a%3E%20%E5%A3%B0%E6%98%8E%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%EF%BC%8CExcerpt%3C'a%3E%20%E4%BD%BF%E7%94%A8%E5%AE%83%0Aimpl%3C'a%3E%20Excerpt%3C'a%3E%20%7B%0A%20%20%20%20%2F%2F%20%E4%B8%8D%E6%B6%89%E5%8F%8A%E5%BC%95%E7%94%A8%E8%BF%94%E5%9B%9E%E5%80%BC%E6%97%B6%EF%BC%8C%E6%96%B9%E6%B3%95%E7%AD%BE%E5%90%8D%E5%8F%AF%E4%BB%A5%E5%BE%88%E7%AE%80%E6%B4%81%0A%20%20%20%20fn%20level(%26self)%20-%3E%20i32%20%7B%0A%20%20%20%20%20%20%20%203%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E8%BF%94%E5%9B%9E%E5%AD%97%E6%AE%B5%E5%BC%95%E7%94%A8%EF%BC%8C%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E7%94%B1%E7%9C%81%E7%95%A5%E8%A7%84%E5%88%99%E8%87%AA%E5%8A%A8%E5%A4%84%E7%90%86%0A%20%20%20%20fn%20content(%26self)%20-%3E%20%26str%20%7B%0A%20%20%20%20%20%20%20%20self.part%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E6%8E%A5%E5%8F%97%E4%B8%80%E4%B8%AA%E9%A2%9D%E5%A4%96%E7%9A%84%E5%BC%95%E7%94%A8%E5%8F%82%E6%95%B0%0A%20%20%20%20fn%20announce_and_return(%26self%2C%20announcement%3A%20%26str)%20-%3E%20%26str%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%B3%A8%E6%84%8F%EF%BC%9A%7B%7D%22%2C%20announcement)%3B%0A%20%20%20%20%20%20%20%20self.part%20%2F%2F%20%E8%BF%94%E5%9B%9E%20self.part%EF%BC%8C%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E4%B8%8E%20self%20%E7%BB%91%E5%AE%9A%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20text%20%3D%20String%3A%3Afrom(%22%E8%BF%99%E6%98%AF%E4%B8%80%E6%AE%B5%E9%87%8D%E8%A6%81%E7%9A%84%E6%96%87%E5%AD%97%E3%80%82%E5%90%8E%E9%9D%A2%E8%BF%98%E6%9C%89%E6%9B%B4%E5%A4%9A%E5%86%85%E5%AE%B9%E3%80%82%22)%3B%0A%20%20%20%20let%20first%20%3D%20text.split('%E3%80%82').next().unwrap()%3B%0A%20%20%20%20let%20exc%20%3D%20Excerpt%20%7B%20part%3A%20first%20%7D%3B%0A%0A%20%20%20%20println!(%22%E7%BA%A7%E5%88%AB%EF%BC%9A%7B%7D%22%2C%20exc.level())%3B%0A%20%20%20%20println!(%22%E5%86%85%E5%AE%B9%EF%BC%9A%7B%7D%22%2C%20exc.content())%3B%0A%20%20%20%20println!(%22%E5%85%AC%E5%91%8A%E5%90%8E%E8%BF%94%E5%9B%9E%EF%BC%9A%7B%7D%22%2C%20exc.announce_and_return(%22%E8%AF%B7%E6%B3%A8%E6%84%8F%EF%BC%81%22))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">struct Excerpt&lt;'a&gt; {
    part: &amp;'a str,
}

// impl&lt;'a&gt; 声明生命周期，Excerpt&lt;'a&gt; 使用它
impl&lt;'a&gt; Excerpt&lt;'a&gt; {
    // 不涉及引用返回值时，方法签名可以很简洁
    fn level(&amp;self) -&gt; i32 {
        3
    }

    // 返回字段引用，生命周期由省略规则自动处理
    fn content(&amp;self) -&gt; &amp;str {
        self.part
    }

    // 接受一个额外的引用参数
    fn announce_and_return(&amp;self, announcement: &amp;str) -&gt; &amp;str {
        println!("注意：{}", announcement);
        self.part // 返回 self.part，生命周期与 self 绑定
    }
}

fn main() {
    let text = String::from("这是一段重要的文字。后面还有更多内容。");
    let first = text.split('。').next().unwrap();
    let exc = Excerpt { part: first };

    println!("级别：{}", exc.level());
    println!("内容：{}", exc.content());
    println!("公告后返回：{}", exc.announce_and_return("请注意！"));
}</code></pre></div>
<blockquote>
<p><code>impl&lt;'a&gt;</code> 后面的 <code>'a</code> 与结构体定义中的 <code>'a</code> 是同一个生命周期参数。</p>
</blockquote>
<h2 id="为带生命周期的类型实现-trait">为带生命周期的类型实现 trait</h2>
<div class="code-runner" data-full-code="use%20std%3A%3Afmt%3B%0A%0Astruct%20Wrapper%3C'a%3E%20%7B%0A%20%20%20%20data%3A%20%26'a%20%5Bi32%5D%2C%0A%7D%0A%0Aimpl%3C'a%3E%20fmt%3A%3ADisplay%20for%20Wrapper%3C'a%3E%20%7B%0A%20%20%20%20fn%20fmt(%26self%2C%20f%3A%20%26mut%20fmt%3A%3AFormatter%3C'_%3E)%20-%3E%20fmt%3A%3AResult%20%7B%0A%20%20%20%20%20%20%20%20let%20parts%3A%20Vec%3CString%3E%20%3D%20self.data.iter().map(%7Cx%7C%20x.to_string()).collect()%3B%0A%20%20%20%20%20%20%20%20write!(f%2C%20%22%5B%7B%7D%5D%22%2C%20parts.join(%22%2C%20%22))%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20nums%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%2C%205%5D%3B%0A%20%20%20%20let%20w%20%3D%20Wrapper%20%7B%20data%3A%20%26nums%20%7D%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20w)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fmt;

struct Wrapper&lt;'a&gt; {
    data: &amp;'a [i32],
}

impl&lt;'a&gt; fmt::Display for Wrapper&lt;'a&gt; {
    fn fmt(&amp;self, f: &amp;mut fmt::Formatter&lt;'_&gt;) -&gt; fmt::Result {
        let parts: Vec&lt;String&gt; = self.data.iter().map(|x| x.to_string()).collect();
        write!(f, "[{}]", parts.join(", "))
    }
}

fn main() {
    let nums = vec![1, 2, 3, 4, 5];
    let w = Wrapper { data: &amp;nums };
    println!("{}", w);
}</code></pre></div>
<h2 id="方法中的生命周期">方法中的生命周期</h2>
<p>有了结构体生命周期的基础，现在可以来看方法里的情况了。</p>
<p>方法签名里通常有两条生命周期线索：一条是结构体字段带来的 <code>'a</code>，另一条是方法自身参数带来的新生命周期。关键问题是：<strong>返回值的生命周期该跟哪条线索走？</strong></p>
<div class="code-runner" data-full-code="struct%20Config%3C'a%3E%20%7B%0A%20%20%20%20host%3A%20%26'a%20str%2C%0A%20%20%20%20port%3A%20u16%2C%0A%7D%0A%0Aimpl%3C'a%3E%20Config%3C'a%3E%20%7B%0A%20%20%20%20%2F%2F%20%E8%BF%94%E5%9B%9E%E7%9A%84%E6%98%AF%20self.host%EF%BC%8C%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E8%B7%9F%E7%BB%93%E6%9E%84%E4%BD%93%E7%9A%84%20'a%20%E8%B5%B0%0A%20%20%20%20%2F%2F%20%EF%BC%88%E7%9C%81%E7%95%A5%E8%A7%84%E5%88%99%E8%87%AA%E5%8A%A8%E5%A4%84%E7%90%86%EF%BC%8C%E4%B8%8D%E9%9C%80%E8%A6%81%E6%89%8B%E5%86%99%EF%BC%89%0A%20%20%20%20fn%20host(%26self)%20-%3E%20%26str%20%7B%0A%20%20%20%20%20%20%20%20self.host%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E6%8E%A5%E5%8F%97%E4%B8%80%E4%B8%AA%E5%A4%96%E9%83%A8%E5%AD%97%E7%AC%A6%E4%B8%B2%EF%BC%8C%E5%8E%9F%E6%A0%B7%E8%BF%94%E5%9B%9E%E5%AE%83%0A%20%20%20%20%2F%2F%20%E8%BF%94%E5%9B%9E%E5%80%BC%E8%B7%9F%20new_host%20%E8%B5%B0%EF%BC%8C%E5%92%8C%E7%BB%93%E6%9E%84%E4%BD%93%E7%9A%84%20'a%20%E6%97%A0%E5%85%B3%20%E2%86%92%20%E9%9C%80%E8%A6%81%E7%8B%AC%E7%AB%8B%E7%9A%84%20'b%0A%20%20%20%20fn%20with_host%3C'b%3E(%26self%2C%20new_host%3A%20%26'b%20str)%20-%3E%20%26'b%20str%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%8E%9F%E4%B8%BB%E6%9C%BA%3A%20%7B%7D%22%2C%20self.host)%3B%0A%20%20%20%20%20%20%20%20new_host%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20host%20%3D%20String%3A%3Afrom(%22localhost%22)%3B%0A%20%20%20%20let%20cfg%20%3D%20Config%20%7B%20host%3A%20%26host%2C%20port%3A%208080%20%7D%3B%0A%0A%20%20%20%20let%20result%3B%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20new_host%20%3D%20String%3A%3Afrom(%22example.com%22)%3B%0A%20%20%20%20%20%20%20%20result%20%3D%20cfg.with_host(%26new_host)%3B%0A%20%20%20%20%20%20%20%20println!(%22%E5%88%87%E6%8D%A2%E5%88%B0%3A%20%7B%7D%22%2C%20result)%3B%0A%20%20%20%20%20%20%20%20%2F%2F%20new_host%20%E5%9C%A8%E8%BF%99%E9%87%8C%E9%94%80%E6%AF%81%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22%E5%8E%9F%E6%9D%A5%E7%9A%84%3A%20%7B%7D%22%2C%20cfg.host())%3B%20%2F%2F%20cfg%20%E5%92%8C%20host%20%E4%BB%8D%E7%84%B6%E6%9C%89%E6%95%88%0A%7D" data-mode="run"><pre><code class="language-rust">struct Config&lt;'a&gt; {
    host: &amp;'a str,
    port: u16,
}

impl&lt;'a&gt; Config&lt;'a&gt; {
    // 返回的是 self.host，生命周期跟结构体的 'a 走
    // （省略规则自动处理，不需要手写）
    fn host(&amp;self) -&gt; &amp;str {
        self.host
    }

    // 接受一个外部字符串，原样返回它
    // 返回值跟 new_host 走，和结构体的 'a 无关 → 需要独立的 'b
    fn with_host&lt;'b&gt;(&amp;self, new_host: &amp;'b str) -&gt; &amp;'b str {
        println!("原主机: {}", self.host);
        new_host
    }
}

fn main() {
    let host = String::from("localhost");
    let cfg = Config { host: &amp;host, port: 8080 };

    let result;
    {
        let new_host = String::from("example.com");
        result = cfg.with_host(&amp;new_host);
        println!("切换到: {}", result);
        // new_host 在这里销毁
    }
    println!("原来的: {}", cfg.host()); // cfg 和 host 仍然有效
}</code></pre></div>
<p><code>with_host</code> 为什么要用 <code>'b</code> 而不直接复用 <code>'a</code>？</p>
<p>如果写成 <code>fn with_host(&amp;self, new_host: &amp;'a str) -&gt; &amp;'a str</code>，调用方就必须保证 <code>new_host</code> 活得和 <code>self.host</code> 一样久——但 <code>new_host</code> 只是临时传进来用一下，没必要这么长寿。上面的例子里 <code>new_host</code> 在内部 <code>{}</code> 里就销毁了，如果强制要求它活到 <code>'a</code>，这段合理的代码就会被编译器拒绝。</p>
<p>独立的 <code>'b</code> 告诉编译器：<strong>返回值只和 <code>new_host</code> 有关，和结构体的 <code>'a</code> 互不干扰</strong>。</p>
<h2 id="生命周期约束-t-a">生命周期约束 T: ‘a</h2>
<p>当结构体需要持有泛型类型 <code>T</code> 的引用时，要约束 <code>T</code> 里包含的引用不会比结构体本身先销毁。语法是 <code>T: 'a</code>：</p>
<ul>
<li><code>T: 'a</code> — <code>T</code> 中的所有引用都必须比 <code>'a</code> 活得更久</li>
<li><code>T: Trait + 'a</code> — <code>T</code> 必须实现 <code>Trait</code>，且 <code>T</code> 中的所有引用都比 <code>'a</code> 活得更久</li>
</ul>
<div class="code-runner" data-full-code="use%20std%3A%3Afmt%3A%3ADebug%3B%0A%0A%2F%2F%20Ref%3C'a%2C%20T%3E%20%E6%8C%81%E6%9C%89%E4%B8%80%E4%B8%AA%E6%8C%87%E5%90%91%20T%20%E7%9A%84%E5%BC%95%E7%94%A8%0A%2F%2F%20T%3A%20'a%20%E4%BF%9D%E8%AF%81%20T%20%E5%86%85%E9%83%A8%E7%9A%84%E5%BC%95%E7%94%A8%E5%9C%A8%20'a%20%E6%9C%9F%E9%97%B4%E5%A7%8B%E7%BB%88%E6%9C%89%E6%95%88%0A%23%5Bderive(Debug)%5D%0Astruct%20Ref%3C'a%2C%20T%3A%20'a%3E(%26'a%20T)%3B%0A%0Afn%20print_ref%3C'a%2C%20T%3E(t%3A%20%26'a%20T)%0Awhere%0A%20%20%20%20T%3A%20Debug%20%2B%20'a%2C%0A%7B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20t)%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%2042%3B%0A%20%20%20%20let%20r%20%3D%20Ref(%26x)%3B%0A%20%20%20%20print_ref(r.0)%3B%0A%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22hello%22)%3B%0A%20%20%20%20print_ref(%26s)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fmt::Debug;

// Ref&lt;'a, T&gt; 持有一个指向 T 的引用
// T: 'a 保证 T 内部的引用在 'a 期间始终有效
#[derive(Debug)]
struct Ref&lt;'a, T: 'a&gt;(&amp;'a T);

fn print_ref&lt;'a, T&gt;(t: &amp;'a T)
where
    T: Debug + 'a,
{
    println!("{:?}", t);
}

fn main() {
    let x = 42;
    let r = Ref(&amp;x);
    print_ref(r.0);

    let s = String::from("hello");
    print_ref(&amp;s);
}</code></pre></div>
<h2 id="trait-实现中的生命周期">trait 实现中的生命周期</h2>
<p>为带生命周期参数的类型实现 trait 时，<code>impl</code> 块同样需要声明这个参数：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Afmt%3B%0A%0Astruct%20StrWrapper%3C'a%3E%20%7B%0A%20%20%20%20content%3A%20%26'a%20str%2C%0A%7D%0A%0A%2F%2F%20impl%20%E5%9D%97%E4%B9%9F%E8%A6%81%E5%B8%A6%20%3C'a%3E%EF%BC%8C%E4%B8%8E%E7%BB%93%E6%9E%84%E4%BD%93%E5%AE%9A%E4%B9%89%E4%BF%9D%E6%8C%81%E4%B8%80%E8%87%B4%0Aimpl%3C'a%3E%20fmt%3A%3ADisplay%20for%20StrWrapper%3C'a%3E%20%7B%0A%20%20%20%20fn%20fmt(%26self%2C%20f%3A%20%26mut%20fmt%3A%3AFormatter%3C'_%3E)%20-%3E%20fmt%3A%3AResult%20%7B%0A%20%20%20%20%20%20%20%20write!(f%2C%20%22%5B%7B%7D%5D%22%2C%20self.content)%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20s%20%3D%20String%3A%3Afrom(%22Rust%20%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%22)%3B%0A%20%20%20%20let%20w%20%3D%20StrWrapper%20%7B%20content%3A%20%26s%20%7D%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20w)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fmt;

struct StrWrapper&lt;'a&gt; {
    content: &amp;'a str,
}

// impl 块也要带 &lt;'a&gt;，与结构体定义保持一致
impl&lt;'a&gt; fmt::Display for StrWrapper&lt;'a&gt; {
    fn fmt(&amp;self, f: &amp;mut fmt::Formatter&lt;'_&gt;) -&gt; fmt::Result {
        write!(f, "[{}]", self.content)
    }
}

fn main() {
    let s = String::from("Rust 生命周期");
    let w = StrWrapper { content: &amp;s };
    println!("{}", w);
}</code></pre></div>
<p>含有字符串的结构体，有两种写法：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E6%96%B9%E6%A1%88%20A%EF%BC%9A%E5%AD%97%E6%AE%B5%E6%8C%81%E6%9C%89%E6%89%80%E6%9C%89%E6%9D%83%EF%BC%88String%EF%BC%89%0A%2F%2F%20%E4%BC%98%E7%82%B9%EF%BC%9A%E7%BB%93%E6%9E%84%E4%BD%93%E5%AE%8C%E5%85%A8%E7%8B%AC%E7%AB%8B%EF%BC%8C%E4%B8%8D%E4%BE%9D%E8%B5%96%E5%A4%96%E9%83%A8%E6%95%B0%E6%8D%AE%0A%2F%2F%20%E7%BC%BA%E7%82%B9%EF%BC%9A%E5%88%9B%E5%BB%BA%E6%97%B6%E5%BF%85%E9%A1%BB%E5%88%86%E9%85%8D%E5%A0%86%E5%86%85%E5%AD%98%0Astruct%20OwnedConfig%20%7B%0A%20%20%20%20host%3A%20String%2C%0A%20%20%20%20port%3A%20u16%2C%0A%7D%0A%0A%2F%2F%20%E6%96%B9%E6%A1%88%20B%EF%BC%9A%E5%AD%97%E6%AE%B5%E6%8C%81%E6%9C%89%E5%BC%95%E7%94%A8%EF%BC%88%26str%EF%BC%89%0A%2F%2F%20%E4%BC%98%E7%82%B9%EF%BC%9A%E9%9B%B6%E6%8B%B7%E8%B4%9D%EF%BC%8C%E7%9B%B4%E6%8E%A5%E5%BC%95%E7%94%A8%E7%8E%B0%E6%9C%89%E5%AD%97%E7%AC%A6%E4%B8%B2%0A%2F%2F%20%E7%BC%BA%E7%82%B9%EF%BC%9A%E7%BB%93%E6%9E%84%E4%BD%93%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E5%8F%97%E9%99%90%E4%BA%8E%E8%A2%AB%E5%BC%95%E7%94%A8%E5%AD%97%E7%AC%A6%E4%B8%B2%0Astruct%20BorrowedConfig%3C'a%3E%20%7B%0A%20%20%20%20host%3A%20%26'a%20str%2C%0A%20%20%20%20port%3A%20u16%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20A%EF%BC%9A%E4%BB%BB%E4%BD%95%E6%97%B6%E5%80%99%E9%83%BD%E8%83%BD%E7%94%A8%0A%20%20%20%20let%20cfg_owned%20%3D%20OwnedConfig%20%7B%0A%20%20%20%20%20%20%20%20host%3A%20String%3A%3Afrom(%22localhost%22)%2C%0A%20%20%20%20%20%20%20%20port%3A%203000%2C%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20%2F%2F%20B%EF%BC%9A%E5%8F%AA%E5%9C%A8%20host%20%E6%95%B0%E6%8D%AE%E6%9C%89%E6%95%88%E6%9C%9F%E5%86%85%E8%83%BD%E7%94%A8%0A%20%20%20%20let%20host%20%3D%20String%3A%3Afrom(%22example.com%22)%3B%0A%20%20%20%20let%20cfg_borrowed%20%3D%20BorrowedConfig%20%7B%20host%3A%20%26host%2C%20port%3A%208080%20%7D%3B%0A%0A%20%20%20%20println!(%22A%3A%20%7B%7D%3A%7B%7D%22%2C%20cfg_owned.host%2C%20cfg_owned.port)%3B%0A%20%20%20%20println!(%22B%3A%20%7B%7D%3A%7B%7D%22%2C%20cfg_borrowed.host%2C%20cfg_borrowed.port)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 方案 A：字段持有所有权（String）
// 优点：结构体完全独立，不依赖外部数据
// 缺点：创建时必须分配堆内存
struct OwnedConfig {
    host: String,
    port: u16,
}

// 方案 B：字段持有引用（&amp;str）
// 优点：零拷贝，直接引用现有字符串
// 缺点：结构体生命周期受限于被引用字符串
struct BorrowedConfig&lt;'a&gt; {
    host: &amp;'a str,
    port: u16,
}

fn main() {
    // A：任何时候都能用
    let cfg_owned = OwnedConfig {
        host: String::from("localhost"),
        port: 3000,
    };

    // B：只在 host 数据有效期内能用
    let host = String::from("example.com");
    let cfg_borrowed = BorrowedConfig { host: &amp;host, port: 8080 };

    println!("A: {}:{}", cfg_owned.host, cfg_owned.port);
    println!("B: {}:{}", cfg_borrowed.host, cfg_borrowed.port);
}</code></pre></div>
<blockquote>
<p><strong>实践建议：</strong> 初学时优先用 <code>String</code>（方案 A），更简单不容易出错。当你有明确的性能需求（避免拷贝），且数据来源的生命周期容易管理，再考虑方案 B。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="结构体生命周期测验">结构体生命周期测验</h2>
</div>
</div>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p><code>Config</code> 结构体目前无法编译，它持有两个字符串 slice 引用。请添加正确的生命周期标注，使其能够工作：</p>
<div class="code-editor" data-block-id="11-lifetimes/03-struct-lifetimes#2:5" data-expect-mode="literal" data-expect-pattern="https%3A%2F%2Fexample.com%2Fapi%2Fv1" data-starter-code="%2F%2F%20TODO%3A%20%E7%BB%99%20Config%20%E5%92%8C%20impl%20%E5%9D%97%E6%B7%BB%E5%8A%A0%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E6%A0%87%E6%B3%A8%0Astruct%20Config%20%7B%0A%20%20%20%20host%3A%20%26str%2C%0A%20%20%20%20path%3A%20%26str%2C%0A%7D%0A%0Aimpl%20Config%20%7B%0A%20%20%20%20fn%20new(host%3A%20%26str%2C%20path%3A%20%26str)%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20Config%20%7B%20host%2C%20path%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20url(%26self)%20-%3E%20String%20%7B%0A%20%20%20%20%20%20%20%20format!(%22https%3A%2F%2F%7B%7D%7B%7D%22%2C%20self.host%2C%20self.path)%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20host%20%3D%20String%3A%3Afrom(%22example.com%22)%3B%0A%20%20%20%20let%20path%20%3D%20String%3A%3Afrom(%22%2Fapi%2Fv1%22)%3B%0A%20%20%20%20let%20cfg%20%3D%20Config%3A%3Anew(%26host%2C%20%26path)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20cfg.url())%3B%0A%7D"><pre><code class="language-rust">// TODO: 给 Config 和 impl 块添加生命周期标注
struct Config {
    host: &amp;str,
    path: &amp;str,
}

impl Config {
    fn new(host: &amp;str, path: &amp;str) -&gt; Self {
        Config { host, path }
    }

    fn url(&amp;self) -&gt; String {
        format!("https://{}{}", self.host, self.path)
    }
}

fn main() {
    let host = String::from("example.com");
    let path = String::from("/api/v1");
    let cfg = Config::new(&amp;host, &amp;path);
    println!("{}", cfg.url());
}</code></pre></div> 