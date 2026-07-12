---
title: "编写单元测试"
description: "测试 - 编写单元测试"
date: "2026-07-12"
order: 15001
tags: ["单元测试", "#[test]", "assert!", "assert_eq!", "should_panic", "cargo test"]
est_time: "20 分钟"
---

 <h1 id="测试函数的解剖">测试函数的解剖</h1>
<p>在 Rust 里，一个测试就是一个带有 <code>#[test]</code> 属性的普通函数。当你运行 <code>cargo test</code> 时，Rust 会编译一个专门的测试执行程序，找到所有标注了 <code>#[test]</code> 的函数并逐一运行，最后汇报哪些通过、哪些失败。</p>
<h2 id="第一个测试">第一个测试</h2>
<p>新建一个库项目时，Cargo 会自动帮你生成一个测试模块：</p>
<pre><code class="language-bash">cargo new adder --lib</code></pre>
<p>打开 <code>src/lib.rs</code>，可以看到：</p>
<div class="code-runner" data-full-code="%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20it_works()%20%7B%0A%20%20%20%20%20%20%20%20assert_eq!(2%20%2B%202%2C%204)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}</code></pre></div>
<p>几个关键点：</p>
<ul>
<li><strong><code>#[cfg(test)]</code></strong>：条件编译标记，告诉 Rust 只在执行 <code>cargo test</code> 时才编译这个模块，<code>cargo build</code> 时不编译，不会浪费编译时间，也不会增大二进制文件体积。</li>
<li><strong><code>mod tests</code></strong>：普通的模块，只是约定俗成地叫 <code>tests</code>。</li>
<li><strong><code>#[test]</code></strong>：标记这个函数是一个测试函数。模块内也可以有普通的辅助函数（不加 <code>#[test]</code>），用来为测试准备数据。</li>
</ul>
<p>运行测试：</p>
<pre><code class="language-bash">cargo test</code></pre>
<p>输出示例：</p>
<pre><code class="language-text">running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out</code></pre>
<h2 id="测试是怎么失败的">测试是怎么失败的</h2>
<p><strong>测试函数 panic，测试就失败。</strong> 每个测试跑在独立的线程里，如果线程 panic 了，主线程会捕捉到并把这个测试标记为失败。</p>
<div class="code-runner" data-full-code="%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20another()%20%7B%0A%20%20%20%20%20%20%20%20panic!(%22%E8%AE%A9%E8%BF%99%E4%B8%AA%E6%B5%8B%E8%AF%95%E5%A4%B1%E8%B4%A5%22)%3B%20%20%2F%2F%20%E4%B8%BB%E5%8A%A8%20panic%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[cfg(test)]
mod tests {
    #[test]
    fn another() {
        panic!("让这个测试失败");  // 主动 panic
    }
}</code></pre></div>
<p>输出示例：</p>
<pre><code class="language-text">running 1 test
test tests::another ... FAILED

failures:
---- tests::another stdout ----
thread 'tests::another' panicked at '让这个测试失败', src/lib.rs:4:9

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out</code></pre>
<blockquote>
<p>这就是所有断言宏的工作原理——当条件不满足时，它们调用 <code>panic!</code>，从而让测试失败。</p>
</blockquote>
<h2 id="use-super">use super::*</h2>
<p>测试模块是嵌套在源码文件里的内部模块，要访问外层模块的内容，需要显式导入：</p>
<div class="code-runner" data-full-code="pub%20fn%20add_two(a%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20a%20%2B%202%0A%7D%0A%0A%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%20%20%2F%2F%20%E6%8A%8A%E5%A4%96%E5%B1%82%E6%A8%A1%E5%9D%97%E7%9A%84%E6%89%80%E6%9C%89%E5%85%AC%E5%BC%80%EF%BC%88%E5%8F%8A%E7%A7%81%E6%9C%89%EF%BC%89%E5%86%85%E5%AE%B9%E5%BC%95%E5%85%A5%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20it_adds_two()%20%7B%0A%20%20%20%20%20%20%20%20assert_eq!(4%2C%20add_two(2))%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">pub fn add_two(a: i32) -&gt; i32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;  // 把外层模块的所有公开（及私有）内容引入

    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2));
    }
}</code></pre></div>
<p>注意 <code>use super::*</code> 可以访问<strong>私有函数</strong>，这是 Rust 允许的——测试就在同一个文件里，没有跨越模块边界。</p>
<h1 id="断言宏">断言宏</h1>
<p>Rust 标准库提供了三个核心断言宏，覆盖了绝大多数测试场景。</p>
<h2 id="assert">assert!</h2>
<p><code>assert!(expr)</code> —— 断言表达式为 <code>true</code>，否则 panic。</p>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Astruct%20Rectangle%20%7B%0A%20%20%20%20width%3A%20u32%2C%0A%20%20%20%20height%3A%20u32%2C%0A%7D%0A%0Aimpl%20Rectangle%20%7B%0A%20%20%20%20fn%20can_hold(%26self%2C%20other%3A%20%26Rectangle)%20-%3E%20bool%20%7B%0A%20%20%20%20%20%20%20%20self.width%20%3E%20other.width%20%26%26%20self.height%20%3E%20other.height%0A%20%20%20%20%7D%0A%7D%0A%0A%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20larger_can_hold_smaller()%20%7B%0A%20%20%20%20%20%20%20%20let%20large%20%3D%20Rectangle%20%7B%20width%3A%208%2C%20height%3A%207%20%7D%3B%0A%20%20%20%20%20%20%20%20let%20small%20%3D%20Rectangle%20%7B%20width%3A%205%2C%20height%3A%201%20%7D%3B%0A%20%20%20%20%20%20%20%20assert!(large.can_hold(%26small))%3B%20%20%2F%2F%20%E6%9C%9F%E6%9C%9B%E4%B8%BA%20true%0A%20%20%20%20%7D%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20smaller_cannot_hold_larger()%20%7B%0A%20%20%20%20%20%20%20%20let%20large%20%3D%20Rectangle%20%7B%20width%3A%208%2C%20height%3A%207%20%7D%3B%0A%20%20%20%20%20%20%20%20let%20small%20%3D%20Rectangle%20%7B%20width%3A%205%2C%20height%3A%201%20%7D%3B%0A%20%20%20%20%20%20%20%20assert!(!small.can_hold(%26large))%3B%20%20%2F%2F%20%E5%8F%96%E5%8F%8D%EF%BC%8C%E6%9C%9F%E6%9C%9B%20false%20%E5%8F%98%20true%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&amp;self, other: &amp;Rectangle) -&gt; bool {
        self.width &gt; other.width &amp;&amp; self.height &gt; other.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn larger_can_hold_smaller() {
        let large = Rectangle { width: 8, height: 7 };
        let small = Rectangle { width: 5, height: 1 };
        assert!(large.can_hold(&amp;small));  // 期望为 true
    }

    #[test]
    fn smaller_cannot_hold_larger() {
        let large = Rectangle { width: 8, height: 7 };
        let small = Rectangle { width: 5, height: 1 };
        assert!(!small.can_hold(&amp;large));  // 取反，期望 false 变 true
    }
}</code></pre></div>
<h2 id="assert_eq-和-assert_ne">assert_eq! 和 assert_ne!</h2>
<p><code>assert_eq!(left, right)</code> 断言两值<strong>相等</strong>；<code>assert_ne!(left, right)</code> 断言两值<strong>不相等</strong>。</p>
<p>它们比 <code>assert!(a == b)</code> 更好用的地方在于：<strong>断言失败时会打印出具体的两个值</strong>，方便定位问题。</p>
<div class="code-runner" data-full-code="pub%20fn%20add_two(a%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20a%20%2B%202%0A%7D%0A%0A%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20it_adds_two()%20%7B%0A%20%20%20%20%20%20%20%20assert_eq!(4%2C%20add_two(2))%3B%20%20%2F%2F%20%E6%9C%9F%E6%9C%9B%204%EF%BC%8C%E5%AE%9E%E9%99%85%20add_two(2)%20%3D%204%EF%BC%8C%E9%80%9A%E8%BF%87%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">pub fn add_two(a: i32) -&gt; i32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_adds_two() {
        assert_eq!(4, add_two(2));  // 期望 4，实际 add_two(2) = 4，通过
    }
}</code></pre></div>
<p>故意引入 bug，把 <code>a + 2</code> 改成 <code>a + 3</code>，失败输出会是：</p>
<pre><code class="language-text">assertion failed: `(left == right)`
  left: `4`,
 right: `5`</code></pre>
<p>清楚地告诉你”期望是 4，实际是 5”。</p>
<blockquote>
<p><strong>注意</strong>：<code>assert_eq!</code> 的两个参数叫 <code>left</code> 和 <code>right</code>，没有”期望值必须放哪边”的强制约定，但通常习惯把期望值放左边。</p>
</blockquote>
<p>使用 <code>assert_eq!</code> / <code>assert_ne!</code> 的类型必须实现 <code>PartialEq</code> 和 <code>Debug</code> trait，大多数内置类型已经实现。自定义结构体可以加 <code>#[derive(PartialEq, Debug)]</code>。</p>
<h2 id="自定义失败信息">自定义失败信息</h2>
<p>断言宏都支持额外的格式化字符串参数，失败时会一并打印出来：</p>
<div class="code-runner" data-full-code="pub%20fn%20greeting(name%3A%20%26str)%20-%3E%20String%20%7B%0A%20%20%20%20format!(%22%E4%BD%A0%E5%A5%BD%EF%BC%8C%7B%7D%EF%BC%81%22%2C%20name)%0A%7D%0A%0A%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20greeting_contains_name()%20%7B%0A%20%20%20%20%20%20%20%20let%20result%20%3D%20greeting(%22%E5%B0%8F%E6%98%8E%22)%3B%0A%20%20%20%20%20%20%20%20assert!(%0A%20%20%20%20%20%20%20%20%20%20%20%20result.contains(%22%E5%B0%8F%E6%98%8E%22)%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%22%E9%97%AE%E5%80%99%E8%AF%AD%E4%B8%AD%E6%B2%A1%E6%9C%89%E5%8C%85%E5%90%AB%E5%90%8D%E5%AD%97%EF%BC%8C%E5%AE%9E%E9%99%85%E5%BE%97%E5%88%B0%E7%9A%84%E6%98%AF%EF%BC%9A%60%7B%7D%60%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20result%0A%20%20%20%20%20%20%20%20)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">pub fn greeting(name: &amp;str) -&gt; String {
    format!("你好，{}！", name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_contains_name() {
        let result = greeting("小明");
        assert!(
            result.contains("小明"),
            "问候语中没有包含名字，实际得到的是：`{}`",
            result
        );
    }
}</code></pre></div>
<p>当测试失败时，你会看到具体的 <code>result</code> 值，而不是干巴巴的”断言失败”。</p>
<h1 id="特殊测试属性">特殊测试属性</h1>
<p>除了 <code>#[test]</code>，还有两种常用的测试属性，分别用于测试”应该 panic 的代码”和”应该返回错误的代码”。</p>
<h2 id="should_panic测试预期中的-panic">should_panic：测试预期中的 panic</h2>
<p>有些函数在接收非法输入时<strong>应该</strong> panic（比如边界检查）。<code>#[should_panic]</code> 属性可以测试这类场景：</p>
<div class="code-runner" data-full-code="pub%20struct%20Guess%20%7B%0A%20%20%20%20value%3A%20i32%2C%0A%7D%0A%0Aimpl%20Guess%20%7B%0A%20%20%20%20pub%20fn%20new(value%3A%20i32)%20-%3E%20Guess%20%7B%0A%20%20%20%20%20%20%20%20if%20value%20%3C%201%20%7C%7C%20value%20%3E%20100%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20panic!(%22%E7%8C%9C%E6%B5%8B%E5%80%BC%E5%BF%85%E9%A1%BB%E5%9C%A8%201%20%E5%88%B0%20100%20%E4%B9%8B%E9%97%B4%EF%BC%8C%E5%AE%9E%E9%99%85%E6%94%B6%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20value)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20Guess%20%7B%20value%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0A%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20%23%5Bshould_panic%5D%0A%20%20%20%20fn%20greater_than_100()%20%7B%0A%20%20%20%20%20%20%20%20Guess%3A%3Anew(200)%3B%20%20%2F%2F%20%E8%BF%99%E9%87%8C%E5%BA%94%E8%AF%A5%20panic%EF%BC%8C%E5%A6%82%E6%9E%9C%E6%B2%A1%E6%9C%89%20panic%EF%BC%8C%E6%B5%8B%E8%AF%95%E5%8F%8D%E8%80%8C%E5%A4%B1%E8%B4%A5%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -&gt; Guess {
        if value &lt; 1 || value &gt; 100 {
            panic!("猜测值必须在 1 到 100 之间，实际收到：{}", value);
        }
        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn greater_than_100() {
        Guess::new(200);  // 这里应该 panic，如果没有 panic，测试反而失败
    }
}</code></pre></div>
<p>但 <code>#[should_panic]</code> 有个缺点：只要函数 panic 了（不管原因），测试就通过，容易产生误报。</p>
<p>加上 <code>expected</code> 参数可以更精确——只有 panic 信息<strong>包含</strong>指定字符串时，测试才通过：</p>
<div class="code-runner" data-full-code="pub%20struct%20Guess%20%7B%0A%20%20%20%20value%3A%20i32%2C%0A%7D%0A%0Aimpl%20Guess%20%7B%0A%20%20%20%20pub%20fn%20new(value%3A%20i32)%20-%3E%20Guess%20%7B%0A%20%20%20%20%20%20%20%20if%20value%20%3C%201%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20panic!(%22%E7%8C%9C%E6%B5%8B%E5%80%BC%E5%BF%85%E9%A1%BB%E5%A4%A7%E4%BA%8E%E7%AD%89%E4%BA%8E%201%EF%BC%8C%E5%AE%9E%E9%99%85%E6%94%B6%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20value)%3B%0A%20%20%20%20%20%20%20%20%7D%20else%20if%20value%20%3E%20100%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20panic!(%22%E7%8C%9C%E6%B5%8B%E5%80%BC%E5%BF%85%E9%A1%BB%E5%B0%8F%E4%BA%8E%E7%AD%89%E4%BA%8E%20100%EF%BC%8C%E5%AE%9E%E9%99%85%E6%94%B6%E5%88%B0%EF%BC%9A%7B%7D%22%2C%20value)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20Guess%20%7B%20value%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0A%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20%23%5Bshould_panic(expected%20%3D%20%22%E5%BF%85%E9%A1%BB%E5%B0%8F%E4%BA%8E%E7%AD%89%E4%BA%8E%20100%22)%5D%20%20%2F%2F%20panic%20%E4%BF%A1%E6%81%AF%E5%BF%85%E9%A1%BB%E5%8C%85%E5%90%AB%E8%BF%99%E4%B8%AA%E5%AD%90%E4%B8%B2%0A%20%20%20%20fn%20greater_than_100()%20%7B%0A%20%20%20%20%20%20%20%20Guess%3A%3Anew(200)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -&gt; Guess {
        if value &lt; 1 {
            panic!("猜测值必须大于等于 1，实际收到：{}", value);
        } else if value &gt; 100 {
            panic!("猜测值必须小于等于 100，实际收到：{}", value);
        }
        Guess { value }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic(expected = "必须小于等于 100")]  // panic 信息必须包含这个子串
    fn greater_than_100() {
        Guess::new(200);
    }
}</code></pre></div>
<h2 id="用-resultt-e-编写测试">用 Result&lt;T, E&gt; 编写测试</h2>
<p>除了 panic，也可以让测试函数返回 <code>Result&lt;(), E&gt;</code>：</p>
<ul>
<li>返回 <code>Ok(())</code> → 测试通过</li>
<li>返回 <code>Err(...)</code> → 测试失败</li>
</ul>
<div class="code-runner" data-full-code="%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20it_works()%20-%3E%20Result%3C()%2C%20String%3E%20%7B%0A%20%20%20%20%20%20%20%20if%202%20%2B%202%20%3D%3D%204%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Ok(())%0A%20%20%20%20%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Err(String%3A%3Afrom(%222%20%2B%202%20%E7%9A%84%E7%BB%93%E6%9E%9C%E4%B8%8D%E6%98%AF%204%22))%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[cfg(test)]
mod tests {
    #[test]
    fn it_works() -&gt; Result&lt;(), String&gt; {
        if 2 + 2 == 4 {
            Ok(())
        } else {
            Err(String::from("2 + 2 的结果不是 4"))
        }
    }
}</code></pre></div>
<p>这种写法的好处是可以在测试体内使用 <code>?</code> 运算符，方便链式调用会返回 <code>Result</code> 的函数：</p>
<pre><code class="language-rust">fn read_file_test() -&gt; Result&lt;(), std::io::Error&gt; {
    let content = std::fs::read_to_string("config.txt")?;  // 失败则测试直接失败
    assert!(content.contains("version"));
    Ok(())
}</code></pre>
<blockquote>
<p><strong>注意</strong>：使用 <code>Result&lt;T, E&gt;</code> 的测试<strong>不能</strong>同时使用 <code>#[should_panic]</code>。如果想断言某操作返回 <code>Err</code>，用 <code>assert!(result.is_err())</code> 代替。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="测验">测验</h2>
</div>
<pre><code class="language-rust">#[test]
fn another() {
    panic!("oops");
}</code></pre>
</div>
</div>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<p>下面的函数已经写好，请<strong>补全两处 <code>TODO</code></strong>，用 <code>assert_eq!</code> 验证 <code>multiply</code> 的结果：</p>
<div class="code-editor" data-block-id="15-testing/01-unit-tests#3:6" data-expect-mode="literal" data-expect-pattern="test%20normal_multiply%20...%20ok%0Atest%20multiply_by_zero%20...%20ok" data-starter-code="pub%20fn%20multiply(a%3A%20i32%2C%20b%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20a%20*%20b%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E7%94%A8%20assert_eq!%20%E9%AA%8C%E8%AF%81%20multiply(3%2C%204)%20%3D%3D%2012%0A%20%20%20%20println!(%22test%20normal_multiply%20...%20ok%22)%3B%0A%0A%20%20%20%20%2F%2F%20TODO%3A%20%E7%94%A8%20assert_eq!%20%E9%AA%8C%E8%AF%81%20multiply(5%2C%200)%20%3D%3D%200%0A%20%20%20%20println!(%22test%20multiply_by_zero%20...%20ok%22)%3B%0A%7D"><pre><code class="language-rust">pub fn multiply(a: i32, b: i32) -&gt; i32 {
    a * b
}

fn main() {
    // TODO: 用 assert_eq! 验证 multiply(3, 4) == 12
    println!("test normal_multiply ... ok");

    // TODO: 用 assert_eq! 验证 multiply(5, 0) == 0
    println!("test multiply_by_zero ... ok");
}</code></pre></div> 