---
title: "何时 panic，何时 Result"
description: "错误处理 - 何时 panic，何时 Result"
date: "2026-07-12"
order: 9004
tags: ["panic", "Result", "错误处理策略", "不变量", "类型系统", "unwrap"]
est_time: "20 分钟"
---

 <h1 id="何时-panic何时-result">何时 panic，何时 Result</h1>
<h2 id="核心原则">核心原则</h2>
<p>学完 <code>panic!</code> 和 <code>Result</code>，你可能会问：<strong>这两种方式什么时候用哪个？</strong></p>
<p>答案的核心是：<strong>错误是调用者能处理的吗？</strong></p>
<ul>
<li>如果调用者<strong>可以</strong>做出合理响应（文件不存在、网络超时、输入格式不对）→ 返回 <code>Result</code>，把选择权给调用者</li>
<li>如果调用者<strong>无法</strong>做出合理响应，继续下去只会更糟（违反了代码的不变量、不可能发生的状态出现了）→ 用 <code>panic!</code></li>
</ul>
<h2 id="适合用-result-的场景">适合用 Result 的场景</h2>
<h3 id="任何预期可能失败的操作">任何”预期可能失败”的操作</h3>
<p>文件读写、网络请求、用户输入解析——这些在正常运行中随时可能失败，不代表代码有 bug：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Anum%3A%3AParseIntError%3B%0A%0Afn%20parse_age(s%3A%20%26str)%20-%3E%20Result%3Cu32%2C%20ParseIntError%3E%20%7B%0A%20%20%20%20let%20n%3A%20u32%20%3D%20s.trim().parse()%3F%3B%0A%20%20%20%20Ok(n)%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20match%20parse_age(%2225%22)%20%7B%0A%20%20%20%20%20%20%20%20Ok(age)%20%3D%3E%20println!(%22%E5%B9%B4%E9%BE%84%EF%BC%9A%7B%7D%22%2C%20age)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%20%3D%3E%20println!(%22%E6%A0%BC%E5%BC%8F%E4%B8%8D%E5%AF%B9%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%0A%20%20%20%20match%20parse_age(%22abc%22)%20%7B%0A%20%20%20%20%20%20%20%20Ok(age)%20%3D%3E%20println!(%22%E5%B9%B4%E9%BE%84%EF%BC%9A%7B%7D%22%2C%20age)%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%20%3D%3E%20println!(%22%E6%A0%BC%E5%BC%8F%E4%B8%8D%E5%AF%B9%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">use std::num::ParseIntError;

fn parse_age(s: &amp;str) -&gt; Result&lt;u32, ParseIntError&gt; {
    let n: u32 = s.trim().parse()?;
    Ok(n)
}

fn main() {
    match parse_age("25") {
        Ok(age) =&gt; println!("年龄：{}", age),
        Err(e)  =&gt; println!("格式不对：{}", e),
    }

    match parse_age("abc") {
        Ok(age) =&gt; println!("年龄：{}", age),
        Err(e)  =&gt; println!("格式不对：{}", e),
    }
}</code></pre></div>
<p>“abc” 解析失败不是 bug，是用户输入的正常变化。用 <code>Result</code> 让调用者来决定怎么处理——是重试、是使用默认值、还是显示错误提示。</p>
<h2 id="适合-panic-的场景">适合 panic! 的场景</h2>
<h3 id="1-原型和示例代码">1. 原型和示例代码</h3>
<p>写原型时，错误处理会让代码变得冗长，分散对核心逻辑的注意力。用 <code>unwrap</code> 先让代码跑起来，后续再完善：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E5%8E%9F%E5%9E%8B%E4%BB%A3%E7%A0%81%EF%BC%9A%E5%85%88%E8%B7%91%E8%B5%B7%E6%9D%A5%EF%BC%8C%E9%94%99%E8%AF%AF%E5%A4%84%E7%90%86%E5%90%8E%E7%BB%AD%E5%AE%8C%E5%96%84%0Afn%20main()%20%7B%0A%20%20%20%20let%20content%20%3D%20std%3A%3Afs%3A%3Aread_to_string(%22config.txt%22).unwrap()%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20content)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 原型代码：先跑起来，错误处理后续完善
fn main() {
    let content = std::fs::read_to_string("config.txt").unwrap();
    println!("{}", content);
}</code></pre></div>
<p><code>unwrap</code> 留下了一个明显的”待完善”标记，比悄悄吞掉错误或写假的错误处理要诚实。</p>
<h3 id="2-测试代码">2. 测试代码</h3>
<p>测试中某个操作失败了，测试就应该失败。用 <code>unwrap/expect</code> 让测试在遇到错误时立刻报告：</p>
<pre><code class="language-rust">#[test]
fn test_parse() {
    let n: i32 = "42".parse().expect("这个字符串应该能解析");
    assert_eq!(n, 42);
}</code></pre>
<h3 id="3-你比编译器知道得更多">3. 你比编译器知道得更多</h3>
<p>有时候你通过代码逻辑可以确定某个 <code>Result</code> 一定是 <code>Ok</code>，但编译器类型系统无法验证这一点：</p>
<div class="code-runner" data-full-code="use%20std%3A%3Anet%3A%3AIpAddr%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%22127.0.0.1%22%20%E6%98%AF%E7%A1%AC%E7%BC%96%E7%A0%81%E7%9A%84%E5%90%88%E6%B3%95%20IP%EF%BC%8Cparse%20%E4%B8%8D%E5%8F%AF%E8%83%BD%E5%A4%B1%E8%B4%A5%0A%20%20%20%20let%20home%3A%20IpAddr%20%3D%20%22127.0.0.1%22.parse().unwrap()%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20home)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::net::IpAddr;

fn main() {
    // "127.0.0.1" 是硬编码的合法 IP，parse 不可能失败
    let home: IpAddr = "127.0.0.1".parse().unwrap();
    println!("{}", home);
}</code></pre></div>
<p>这里 <code>unwrap</code> 是合理的——IP 字符串是代码里写死的，不是运行时的用户输入。即使这样，建议加上注释说明原因，让代码审查者知道这不是疏漏。</p>
<h3 id="4-代码遇到了不变量被破坏的情况">4. 代码遇到了不变量被破坏的情况</h3>
<p>当代码检测到”这种情况不应该存在，一定是 bug”时，panic 比悄悄继续运行更好：</p>
<div class="code-runner" data-full-code="fn%20get_element(v%3A%20%26%5Bi32%5D%2C%20index%3A%20usize)%20-%3E%20i32%20%7B%0A%20%20%20%20if%20index%20%3E%3D%20v.len()%20%7B%0A%20%20%20%20%20%20%20%20panic!(%22index%20%7B%7D%20%E8%B6%85%E5%87%BA%E8%8C%83%E5%9B%B4%EF%BC%8C%E5%90%91%E9%87%8F%E9%95%BF%E5%BA%A6%E6%98%AF%20%7B%7D%22%2C%20index%2C%20v.len())%3B%0A%20%20%20%20%7D%0A%20%20%20%20v%5Bindex%5D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20v%20%3D%20vec!%5B1%2C%202%2C%203%5D%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20get_element(%26v%2C%201))%3B%20%20%2F%2F%20%E6%AD%A3%E5%B8%B8%0A%20%20%20%20%2F%2F%20println!(%22%7B%7D%22%2C%20get_element(%26v%2C%205))%3B%20%20%2F%2F%20%E4%BC%9A%20panic%0A%7D" data-mode="run"><pre><code class="language-rust">fn get_element(v: &amp;[i32], index: usize) -&gt; i32 {
    if index &gt;= v.len() {
        panic!("index {} 超出范围，向量长度是 {}", index, v.len());
    }
    v[index]
}

fn main() {
    let v = vec![1, 2, 3];
    println!("{}", get_element(&amp;v, 1));  // 正常
    // println!("{}", get_element(&amp;v, 5));  // 会 panic
}</code></pre></div>
<h2 id="用类型系统编码不变量">用类型系统编码不变量</h2>
<p>有一个更优雅的思路：与其在函数内部反复检查参数合法性，不如<strong>用类型来保证只有合法的值才能被创建</strong>。</p>
<p>举个例子：假设你的程序中大量函数都需要一个”1 到 100 之间的数字”。如果直接用 <code>i32</code>，每个函数都要检查范围。</p>
<p>更好的做法：创建一个 <code>Guess</code> 类型，把检查放在构造时：</p>
<div class="code-runner" data-full-code="pub%20struct%20Guess%20%7B%0A%20%20%20%20value%3A%20i32%2C%20%20%2F%2F%20private%EF%BC%8C%E5%A4%96%E9%83%A8%E6%97%A0%E6%B3%95%E7%9B%B4%E6%8E%A5%E8%AE%BE%E7%BD%AE%0A%7D%0A%0Aimpl%20Guess%20%7B%0A%20%20%20%20pub%20fn%20new(value%3A%20i32)%20-%3E%20Guess%20%7B%0A%20%20%20%20%20%20%20%20if%20value%20%3C%201%20%7C%7C%20value%20%3E%20100%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E8%BF%9D%E5%8F%8D%E4%BA%86%20Guess%20%E7%9A%84%E5%A5%91%E7%BA%A6%20%E2%86%92%20%E8%B0%83%E7%94%A8%E8%80%85%E7%9A%84%20bug%20%E2%86%92%20panic%0A%20%20%20%20%20%20%20%20%20%20%20%20panic!(%22%E7%8C%9C%E6%B5%8B%E5%80%BC%E5%BF%85%E9%A1%BB%E5%9C%A8%201%20%E5%88%B0%20100%20%E4%B9%8B%E9%97%B4%EF%BC%8C%E5%BE%97%E5%88%B0%E4%BA%86%20%7B%7D%22%2C%20value)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20Guess%20%7B%20value%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20pub%20fn%20value(%26self)%20-%3E%20i32%20%7B%0A%20%20%20%20%20%20%20%20self.value%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20check_guess(guess%3A%20Guess)%20%7B%0A%20%20%20%20%2F%2F%20%E8%BF%99%E9%87%8C%E4%B8%8D%E9%9C%80%E8%A6%81%E5%86%8D%E6%A3%80%E6%9F%A5%E8%8C%83%E5%9B%B4%E4%BA%86%0A%20%20%20%20%2F%2F%20%E5%9B%A0%E4%B8%BA%E8%83%BD%E5%88%9B%E5%BB%BA%E5%87%BA%20Guess%EF%BC%8C%E5%B0%B1%E8%AF%B4%E6%98%8E%E5%80%BC%E4%B8%80%E5%AE%9A%E5%9C%A8%201-100%20%E4%B9%8B%E9%97%B4%0A%20%20%20%20println!(%22%E4%BD%A0%E7%8C%9C%E4%BA%86%20%7B%7D%EF%BC%8C%E5%9C%A8%E6%9C%89%E6%95%88%E8%8C%83%E5%9B%B4%E5%86%85%22%2C%20guess.value())%3B%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20g%20%3D%20Guess%3A%3Anew(42)%3B%0A%20%20%20%20check_guess(g)%3B%0A%0A%20%20%20%20%2F%2F%20Guess%3A%3Anew(200)%3B%20%20%2F%2F%20%E8%BF%99%E8%A1%8C%E4%BC%9A%20panic%E2%80%94%E2%80%94%E8%B0%83%E7%94%A8%E8%80%85%E7%9A%84%20bug%0A%7D" data-mode="run"><pre><code class="language-rust">pub struct Guess {
    value: i32,  // private，外部无法直接设置
}

impl Guess {
    pub fn new(value: i32) -&gt; Guess {
        if value &lt; 1 || value &gt; 100 {
            // 违反了 Guess 的契约 → 调用者的 bug → panic
            panic!("猜测值必须在 1 到 100 之间，得到了 {}", value);
        }
        Guess { value }
    }

    pub fn value(&amp;self) -&gt; i32 {
        self.value
    }
}

fn check_guess(guess: Guess) {
    // 这里不需要再检查范围了
    // 因为能创建出 Guess，就说明值一定在 1-100 之间
    println!("你猜了 {}，在有效范围内", guess.value());
}

fn main() {
    let g = Guess::new(42);
    check_guess(g);

    // Guess::new(200);  // 这行会 panic——调用者的 bug
}</code></pre></div>
<p><strong>关键点</strong>：</p>
<ul>
<li><code>value</code> 字段是私有的，外部代码<strong>必须</strong>通过 <code>new</code> 创建 <code>Guess</code></li>
<li><code>new</code> 中的检查确保了：只要一个 <code>Guess</code> 存在，它的值就一定合法</li>
<li>所有接受 <code>Guess</code> 参数的函数不再需要重复检查范围</li>
</ul>
<p>这就是”用类型编码不变量”——把检查从”每次使用时”移到”创建时”，一次检查，处处保证。</p>
<h2 id="总结决策框架">总结：决策框架</h2>
<table><thead><tr><th>情况</th><th>推荐做法</th></tr></thead><tbody><tr><td>用户输入、文件读写、网络请求等预期可能失败的操作</td><td>返回 <code>Result</code></td></tr><tr><td>写原型/示例，不想被错误处理分散注意力</td><td><code>unwrap/expect</code> 先跑起来</td></tr><tr><td>测试中的断言</td><td><code>unwrap/expect</code></td></tr><tr><td>硬编码值，你确定不会失败</td><td><code>unwrap</code>（加注释说明原因）</td></tr><tr><td>参数违反了契约（调用者的 bug）</td><td><code>panic!</code></td></tr><tr><td>代码遇到了不可能的状态</td><td><code>panic!</code></td></tr><tr><td>提供给其他开发者使用的库</td><td>几乎总是返回 <code>Result</code></td></tr></tbody></table>
<blockquote>
<p><strong>库的特殊情况</strong>：如果你在写一个供他人使用的库，对外暴露的函数几乎应该总是返回 <code>Result</code>，让库的用户自己决定如何处理错误。在库的内部实现中，遇到 bug 可以 panic。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="决策测验">决策测验</h2>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面的函数签名已经改为返回 <code>Result&lt;u32, String&gt;</code>，但函数体里还在用 <code>panic!</code>。请将两处 <code>panic!</code> 改为返回 <code>Err(...)</code>，并把最后的返回值改为 <code>Ok(...)</code>，使代码能正常运行。</p>
<div class="code-editor" data-block-id="09-error-handling/04-when-to-panic#1:3" data-expect-mode="literal" data-expect-pattern="Ok(25)%0AErr(%22%E8%A7%A3%E6%9E%90%E5%A4%B1%E8%B4%A5%EF%BC%9Ainvalid%20digit%20found%20in%20string%22)" data-starter-code="fn%20parse_age(s%3A%20%26str)%20-%3E%20Result%3Cu32%2C%20String%3E%20%7B%0A%20%20%20%20let%20n%3A%20i32%20%3D%20match%20s.trim().parse()%20%7B%0A%20%20%20%20%20%20%20%20Ok(n)%20%20%3D%3E%20n%2C%0A%20%20%20%20%20%20%20%20Err(e)%20%3D%3E%20panic!(%22%E8%A7%A3%E6%9E%90%E5%A4%B1%E8%B4%A5%EF%BC%9A%7B%7D%22%2C%20e)%2C%0A%20%20%20%20%7D%3B%0A%20%20%20%20if%20n%20%3C%200%20%7C%7C%20n%20%3E%20150%20%7B%0A%20%20%20%20%20%20%20%20panic!(%22%E5%B9%B4%E9%BE%84%20%7B%7D%20%E4%B8%8D%E5%9C%A8%E6%9C%89%E6%95%88%E8%8C%83%E5%9B%B4%E5%86%85%22%2C%20n)%3B%0A%20%20%20%20%7D%0A%20%20%20%20n%20as%20u32%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20parse_age(%2225%22))%3B%0A%20%20%20%20%2F%2F%20%E4%B8%8B%E9%9D%A2%E8%BF%99%E8%A1%8C%E7%9B%AE%E5%89%8D%E4%BC%9A%20panic%EF%BC%8C%E6%94%B9%E5%A5%BD%E5%90%8E%E5%BA%94%E8%AF%A5%E6%89%93%E5%8D%B0%E9%94%99%E8%AF%AF%E4%BF%A1%E6%81%AF%0A%20%20%20%20%2F%2F%20println!(%22%7B%3A%3F%7D%22%2C%20parse_age(%22abc%22))%3B%0A%7D"><pre><code class="language-rust">fn parse_age(s: &amp;str) -&gt; Result&lt;u32, String&gt; {
    let n: i32 = match s.trim().parse() {
        Ok(n)  =&gt; n,
        Err(e) =&gt; panic!("解析失败：{}", e),
    };
    if n &lt; 0 || n &gt; 150 {
        panic!("年龄 {} 不在有效范围内", n);
    }
    n as u32
}

fn main() {
    println!("{:?}", parse_age("25"));
    // 下面这行目前会 panic，改好后应该打印错误信息
    // println!("{:?}", parse_age("abc"));
}</code></pre></div> 