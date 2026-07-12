---
title: "综合练习"
description: "生命周期 - 综合练习"
date: "2026-07-12"
order: 11005
tags: ["lifetime", "生命周期", "练习", "综合练习", "编程练习"]
est_time: "20 分钟"
---

 <h1 id="综合练习">综合练习</h1>
<p>本节通过一组难度递进的练习，综合检验你对生命周期的掌握。每道题都配有提示，遇到困难时可以先看提示再动手。</p>
<h2 id="练习-1修复悬垂引用">练习 1：修复悬垂引用</h2>
<p>下面的函数试图返回在函数内部创建的字符串的引用，这会导致悬垂引用。请将函数改写成正确的版本——不返回引用，而是返回有所有权的值。</p>
<div class="code-editor" data-block-id="11-lifetimes/05-practice#0:0" data-expect-mode="literal" data-expect-pattern="%E4%BD%A0%E5%A5%BD%EF%BC%8CAlice%EF%BC%81" data-starter-code="%2F%2F%20%E4%BF%AE%E5%A4%8D%E8%BF%99%E4%B8%AA%E5%87%BD%E6%95%B0%EF%BC%9A%E8%AE%A9%E5%AE%83%E8%83%BD%E6%AD%A3%E7%A1%AE%E5%B7%A5%E4%BD%9C%0Afn%20get_greeting(name%3A%20%26str)%20-%3E%20%26str%20%7B%0A%20%20%20%20let%20greeting%20%3D%20format!(%22%E4%BD%A0%E5%A5%BD%EF%BC%8C%7B%7D%EF%BC%81%22%2C%20name)%3B%0A%20%20%20%20%26greeting%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%9Agreeting%20%E5%9C%A8%E5%87%BD%E6%95%B0%E7%BB%93%E6%9D%9F%E6%97%B6%E8%A2%AB%E9%94%80%E6%AF%81%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20name%20%3D%20%22Alice%22%3B%0A%20%20%20%20let%20msg%20%3D%20get_greeting(name)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20msg)%3B%0A%7D"><pre><code class="language-rust">// 修复这个函数：让它能正确工作
fn get_greeting(name: &amp;str) -&gt; &amp;str {
    let greeting = format!("你好，{}！", name);
    &amp;greeting // 错误：greeting 在函数结束时被销毁
}

fn main() {
    let name = "Alice";
    let msg = get_greeting(name);
    println!("{}", msg);
}</code></pre></div>
<h2 id="练习-2添加生命周期标注">练习 2：添加生命周期标注</h2>
<p><code>first_word</code> 函数接受两个 <code>&amp;str</code> 参数：要搜索的文本和分隔符，返回第一个分隔符之前的部分。由于有两个引用参数，编译器无法推断返回值的生命周期——请添加正确的标注使其通过编译：</p>
<div class="code-editor" data-block-id="11-lifetimes/05-practice#0:1" data-expect-mode="literal" data-expect-pattern="%E7%AC%AC%E4%B8%80%E6%AE%B5%EF%BC%9AAlice%0A%E5%8E%9F%E5%A7%8B%EF%BC%9AAlice%2CBob%2CCharlie" data-starter-code="%2F%2F%20%E8%BF%99%E4%B8%AA%E5%87%BD%E6%95%B0%E6%97%A0%E6%B3%95%E7%BC%96%E8%AF%91%EF%BC%8C%E8%AF%B7%E6%B7%BB%E5%8A%A0%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E6%A0%87%E6%B3%A8%0A%2F%2F%20%E6%8F%90%E7%A4%BA%EF%BC%9A%E8%BF%94%E5%9B%9E%E5%80%BC%E5%8F%AA%E5%8F%AF%E8%83%BD%E6%9D%A5%E8%87%AA%20text%EF%BC%8C%E5%92%8C%20separator%20%E6%97%A0%E5%85%B3%0Afn%20split_before(text%3A%20%26str%2C%20separator%3A%20%26str)%20-%3E%20%26str%20%7B%0A%20%20%20%20match%20text.find(separator)%20%7B%0A%20%20%20%20%20%20%20%20Some(pos)%20%3D%3E%20%26text%5B..pos%5D%2C%0A%20%20%20%20%20%20%20%20None%20%3D%3E%20text%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20sentence%20%3D%20String%3A%3Afrom(%22Alice%2CBob%2CCharlie%22)%3B%0A%20%20%20%20let%20result%3B%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20let%20sep%20%3D%20String%3A%3Afrom(%22%2C%22)%3B%0A%20%20%20%20%20%20%20%20result%20%3D%20split_before(%26sentence%2C%20%26sep)%3B%0A%20%20%20%20%20%20%20%20%2F%2F%20sep%20%E5%9C%A8%E8%BF%99%E9%87%8C%E9%94%80%E6%AF%81%EF%BC%8C%E4%BD%86%20result%20%E6%9D%A5%E8%87%AA%20sentence%EF%BC%8Csentence%20%E8%BF%98%E6%B4%BB%E7%9D%80%0A%20%20%20%20%7D%0A%20%20%20%20println!(%22%E7%AC%AC%E4%B8%80%E6%AE%B5%EF%BC%9A%7B%7D%22%2C%20result)%3B%0A%20%20%20%20println!(%22%E5%8E%9F%E5%A7%8B%EF%BC%9A%7B%7D%22%2C%20sentence)%3B%0A%7D"><pre><code class="language-rust">// 这个函数无法编译，请添加生命周期标注
// 提示：返回值只可能来自 text，和 separator 无关
fn split_before(text: &amp;str, separator: &amp;str) -&gt; &amp;str {
    match text.find(separator) {
        Some(pos) =&gt; &amp;text[..pos],
        None =&gt; text,
    }
}

fn main() {
    let sentence = String::from("Alice,Bob,Charlie");
    let result;
    {
        let sep = String::from(",");
        result = split_before(&amp;sentence, &amp;sep);
        // sep 在这里销毁，但 result 来自 sentence，sentence 还活着
    }
    println!("第一段：{}", result);
    println!("原始：{}", sentence);
}</code></pre></div>
<h2 id="练习-3含引用的结构体">练习 3：含引用的结构体</h2>
<p><code>Parser</code> 结构体需要持有对输入字符串的引用，以便逐步解析。请添加生命周期标注并实现 <code>next_token</code> 方法，返回下一个以空格分隔的 token（每次调用后推进内部位置）：</p>
<div class="code-editor" data-block-id="11-lifetimes/05-practice#0:2" data-expect-mode="literal" data-expect-pattern="token%3A%20hello%0Atoken%3A%20world%0Atoken%3A%20rust" data-starter-code="%2F%2F%20TODO%3A%20%E7%BB%99%20Parser%20%E6%B7%BB%E5%8A%A0%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E6%A0%87%E6%B3%A8%0Astruct%20Parser%20%7B%0A%20%20%20%20input%3A%20%26str%2C%0A%20%20%20%20pos%3A%20usize%2C%0A%7D%0A%0Aimpl%20Parser%20%7B%0A%20%20%20%20fn%20new(input%3A%20%26str)%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20Parser%20%7B%20input%2C%20pos%3A%200%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E8%BF%94%E5%9B%9E%E4%B8%8B%E4%B8%80%E4%B8%AA%20token%EF%BC%88%E4%BB%8E%20pos%20%E5%BC%80%E5%A7%8B%E7%9A%84%E4%B8%8B%E4%B8%80%E6%AE%B5%E4%B8%8D%E5%90%AB%E7%A9%BA%E6%A0%BC%E7%9A%84%E5%86%85%E5%AE%B9%EF%BC%89%EF%BC%8C%E5%A6%82%E6%9E%9C%E5%B7%B2%E7%BB%8F%E5%88%B0%E6%9C%AB%E5%B0%BE%EF%BC%8C%E8%BF%94%E5%9B%9E%20None%0A%20%20%20%20fn%20next_token(%26mut%20self)%20-%3E%20Option%3C%26str%3E%20%7B%0A%20%20%20%20%20%20%20%20let%20start%20%3D%20self.pos%0A%20%20%20%20%20%20%20%20%20%20%20%20%2B%20self.input%5Bself.pos..%5D.find(%7Cc%3A%20char%7C%20!c.is_whitespace())%3F%3B%0A%20%20%20%20%20%20%20%20let%20rest%20%3D%20%26self.input%5Bstart..%5D%3B%0A%20%20%20%20%20%20%20%20let%20end%20%3D%20rest.find(char%3A%3Ais_whitespace).unwrap_or(rest.len())%3B%0A%20%20%20%20%20%20%20%20self.pos%20%3D%20start%20%2B%20end%3B%0A%20%20%20%20%20%20%20%20Some(%26self.input%5Bstart..start%20%2B%20end%5D)%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20text%20%3D%20String%3A%3Afrom(%22hello%20world%20rust%22)%3B%0A%20%20%20%20let%20mut%20parser%20%3D%20Parser%3A%3Anew(%26text)%3B%0A%0A%20%20%20%20while%20let%20Some(token)%20%3D%20parser.next_token()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22token%3A%20%7B%7D%22%2C%20token)%3B%0A%20%20%20%20%7D%0A%7D"><pre><code class="language-rust">// TODO: 给 Parser 添加生命周期标注
struct Parser {
    input: &amp;str,
    pos: usize,
}

impl Parser {
    fn new(input: &amp;str) -&gt; Self {
        Parser { input, pos: 0 }
    }

    // 返回下一个 token（从 pos 开始的下一段不含空格的内容），如果已经到末尾，返回 None
    fn next_token(&amp;mut self) -&gt; Option&lt;&amp;str&gt; {
        let start = self.pos
            + self.input[self.pos..].find(|c: char| !c.is_whitespace())?;
        let rest = &amp;self.input[start..];
        let end = rest.find(char::is_whitespace).unwrap_or(rest.len());
        self.pos = start + end;
        Some(&amp;self.input[start..start + end])
    }
}

fn main() {
    let text = String::from("hello world rust");
    let mut parser = Parser::new(&amp;text);

    while let Some(token) = parser.next_token() {
        println!("token: {}", token);
    }
}</code></pre></div>
<h2 id="练习-4生命周期与泛型结合">练习 4：生命周期与泛型结合</h2>
<p><code>Cache</code> 结构体用来缓存一个计算结果的引用。它持有一个对 <code>T</code> 类型数据的引用。请完成实现：</p>
<div class="code-editor" data-block-id="11-lifetimes/05-practice#0:3" data-expect-mode="literal" data-expect-pattern="%E7%AD%94%E6%A1%88%3A%2042" data-starter-code="use%20std%3A%3Afmt%3A%3ADisplay%3B%0A%0A%2F%2F%20TODO%3A%20%E6%B7%BB%E5%8A%A0%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E6%A0%87%E6%B3%A8%0Astruct%20Cache%20%7B%0A%20%20%20%20value%3A%20%26i32%2C%0A%20%20%20%20label%3A%20%26str%2C%0A%7D%0A%0Aimpl%20Cache%20%7B%0A%20%20%20%20fn%20new(value%3A%20%26i32%2C%20label%3A%20%26str)%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20Cache%20%7B%20value%2C%20label%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0A%2F%2F%20%E4%B8%BA%20Cache%20%E5%AE%9E%E7%8E%B0%20Display%20trait%EF%BC%8C%E6%A0%BC%E5%BC%8F%EF%BC%9A%22%7Blabel%7D%3A%20%7Bvalue%7D%22%0Aimpl%20Display%20for%20Cache%20%7B%0A%20%20%20%20fn%20fmt(%26self%2C%20f%3A%20%26mut%20std%3A%3Afmt%3A%3AFormatter%3C'_%3E)%20-%3E%20std%3A%3Afmt%3A%3AResult%20%7B%0A%20%20%20%20%20%20%20%20write!(f%2C%20%22%7B%7D%3A%20%7B%7D%22%2C%20self.label%2C%20self.value)%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20result%20%3D%2042%3B%0A%20%20%20%20let%20name%20%3D%20String%3A%3Afrom(%22%E7%AD%94%E6%A1%88%22)%3B%0A%20%20%20%20let%20cache%20%3D%20Cache%3A%3Anew(%26result%2C%20%26name)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20cache)%3B%0A%7D"><pre><code class="language-rust">use std::fmt::Display;

// TODO: 添加生命周期标注
struct Cache {
    value: &amp;i32,
    label: &amp;str,
}

impl Cache {
    fn new(value: &amp;i32, label: &amp;str) -&gt; Self {
        Cache { value, label }
    }
}

// 为 Cache 实现 Display trait，格式："{label}: {value}"
impl Display for Cache {
    fn fmt(&amp;self, f: &amp;mut std::fmt::Formatter&lt;'_&gt;) -&gt; std::fmt::Result {
        write!(f, "{}: {}", self.label, self.value)
    }
}

fn main() {
    let result = 42;
    let name = String::from("答案");
    let cache = Cache::new(&amp;result, &amp;name);
    println!("{}", cache);
}</code></pre></div>
<h2 id="练习-5识别省略规则">练习 5：识别省略规则</h2>
<p>下面有四个函数签名，其中有的可以省略生命周期，有的不能。判断哪些能通过编译（无需修改），哪些需要手动添加生命周期标注才能编译，并在注释中解释原因：</p>
<div class="code-editor" data-block-id="11-lifetimes/05-practice#0:4" data-expect-mode="literal" data-expect-pattern="x%20%3D%203%0Ahello" data-starter-code="%2F%2F%20%E5%88%A4%E6%96%AD%E4%B8%8B%E9%9D%A2%E5%93%AA%E4%BA%9B%E5%87%BD%E6%95%B0%E8%83%BD%E7%9B%B4%E6%8E%A5%E7%BC%96%E8%AF%91%EF%BC%8C%E5%93%AA%E4%BA%9B%E9%9C%80%E8%A6%81%E6%B7%BB%E5%8A%A0%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E6%A0%87%E6%B3%A8%0A%2F%2F%20%E5%9C%A8%E6%AF%8F%E4%B8%AA%E5%87%BD%E6%95%B0%E5%89%8D%E6%B7%BB%E5%8A%A0%E6%B3%A8%E9%87%8A%E8%AF%B4%E6%98%8E%E5%8E%9F%E5%9B%A0%EF%BC%8C%E7%84%B6%E5%90%8E%E4%BF%AE%E5%A4%8D%E4%B8%8D%E8%83%BD%E7%BC%96%E8%AF%91%E7%9A%84%E5%87%BD%E6%95%B0%0A%0A%2F%2F%20%E5%87%BD%E6%95%B0%20A%0Afn%20get_x(point%3A%20%26(i32%2C%20i32))%20-%3E%20%26i32%20%7B%0A%20%20%20%20%26point.0%0A%7D%0A%0A%2F%2F%20%E5%87%BD%E6%95%B0%20B%EF%BC%88%E8%BF%99%E4%B8%AA%E9%9C%80%E8%A6%81%E4%BF%AE%E6%94%B9%EF%BC%89%0Afn%20combine(a%3A%20%26str%2C%20b%3A%20%26str)%20-%3E%20%26str%20%7B%0A%20%20%20%20if%20a.len()%20%3E%20b.len()%20%7B%20a%20%7D%20else%20%7B%20b%20%7D%0A%7D%0A%0A%2F%2F%20%E5%87%BD%E6%95%B0%20C%0Afn%20identity(x%3A%20%26str)%20-%3E%20%26str%20%7B%0A%20%20%20%20x%0A%7D%0A%0A%2F%2F%20%E5%87%BD%E6%95%B0%20D%EF%BC%88%E8%BF%99%E4%B8%AA%E9%9C%80%E8%A6%81%E4%BF%AE%E6%94%B9%EF%BC%89%0Afn%20first_of_two(a%3A%20%26str%2C%20_b%3A%20%26str)%20-%3E%20%26str%20%7B%0A%20%20%20%20a%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%B5%8B%E8%AF%95%20A%0A%20%20%20%20let%20p%20%3D%20(3%2C%204)%3B%0A%20%20%20%20println!(%22x%20%3D%20%7B%7D%22%2C%20get_x(%26p))%3B%0A%0A%20%20%20%20%2F%2F%20%E6%B5%8B%E8%AF%95%20C%0A%20%20%20%20println!(%22%7B%7D%22%2C%20identity(%22hello%22))%3B%0A%7D"><pre><code class="language-rust">// 判断下面哪些函数能直接编译，哪些需要添加生命周期标注
// 在每个函数前添加注释说明原因，然后修复不能编译的函数

// 函数 A
fn get_x(point: &amp;(i32, i32)) -&gt; &amp;i32 {
    &amp;point.0
}

// 函数 B（这个需要修改）
fn combine(a: &amp;str, b: &amp;str) -&gt; &amp;str {
    if a.len() &gt; b.len() { a } else { b }
}

// 函数 C
fn identity(x: &amp;str) -&gt; &amp;str {
    x
}

// 函数 D（这个需要修改）
fn first_of_two(a: &amp;str, _b: &amp;str) -&gt; &amp;str {
    a
}

fn main() {
    // 测试 A
    let p = (3, 4);
    println!("x = {}", get_x(&amp;p));

    // 测试 C
    println!("{}", identity("hello"));
}</code></pre></div> 