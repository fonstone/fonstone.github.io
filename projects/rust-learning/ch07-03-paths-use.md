---
title: "路径与 use 关键字"
description: "模块系统 - 路径与 use 关键字"
date: "2026-07-12"
order: 7003
tags: ["路径", "绝对路径", "相对路径", "use", "super", "重导出", "pub use"]
est_time: "40 分钟"
---

 <h1 id="为什么需要路径和-use">为什么需要路径和 use</h1>
<p>前面我们讲过，模块在模块树中<strong>只能被声明一次</strong>（声明权属于父模块），但<strong>可以从多处访问</strong>。当你需要在 <code>a.rs</code> 和 <code>b.rs</code> 中都使用模块 <code>c</code> 时，不能重复声明，而要通过<strong>路径</strong>来访问它。</p>
<img alt="use" src="/images/rust/use.svg" style="max-width:100%;margin:1rem 0;"/>
<p><strong>核心区别</strong>：</p>
<ul>
<li><strong><code>mod</code></strong> — <strong>构建</strong>模块树的结构（<code>mod c;</code> 声明模块 c）</li>
<li><strong><code>路径/use</code></strong> — <strong>使用</strong>构建好的模块树（<code>use super::c;</code> 访问模块 c）</li>
</ul>
<h1 id="访问模块中的项路径">访问模块中的项：路径</h1>
<p>模块中定义的项需要通过<strong>路径</strong>来访问。路径就像文件系统中的路径：<code>/home/user/file.txt</code>。</p>
<p>Rust 中有两种路径：</p>
<ul>
<li><strong>绝对路径</strong>：从 crate root 开始</li>
<li><strong>相对路径</strong>：从当前模块开始</li>
</ul>
<h2 id="绝对路径">绝对路径</h2>
<p>绝对路径以 <code>crate</code> 关键字或 crate 名开头，表示从 crate 根部开始。</p>
<div class="code-runner" data-full-code="mod%20restaurant%20%7B%0A%20%20%20%20pub%20mod%20front_of_house%20%7B%0A%20%20%20%20%20%20%20%20pub%20mod%20hosting%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20pub%20fn%20add_to_waitlist()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%B7%B2%E6%B7%BB%E5%8A%A0%E5%88%B0%E7%AD%89%E5%BE%85%E5%88%97%E8%A1%A8%22)%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E7%BB%9D%E5%AF%B9%E8%B7%AF%E5%BE%84%EF%BC%9A%E4%BB%8E%20crate%20%E6%A0%B9%E5%BC%80%E5%A7%8B%0A%20%20%20%20crate%3A%3Arestaurant%3A%3Afront_of_house%3A%3Ahosting%3A%3Aadd_to_waitlist()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">mod restaurant {
    pub mod front_of_house {
        pub mod hosting {
            pub fn add_to_waitlist() {
                println!("已添加到等待列表");
            }
        }
    }
}

fn main() {
    // 绝对路径：从 crate 根开始
    crate::restaurant::front_of_house::hosting::add_to_waitlist();
}</code></pre></div>
<h3 id="为什么用-crate-而不是包名">为什么用 crate:: 而不是包名？</h3>
<p>对于库 crate（lib.rs），使用 <code>crate::</code> 代表 crate 根。这样的好处是：</p>
<ul>
<li>如果库被重命名，代码不需要改变</li>
<li>跨越 crate 边界时更清晰</li>
</ul>
<pre><code class="language-rust">// 库中的绝对路径写法
pub fn some_function() {
    crate::restaurant::eat();  // 总是指向本 crate
}</code></pre>
<h2 id="相对路径">相对路径</h2>
<p>相对路径以当前模块的标识符、<code>self</code>、<code>super</code> 开头。</p>
<p><code>self</code> 表示当前模块，<code>super</code> 表示父模块（类似文件系统的 <code>..</code>）。<strong>通常情况下 <code>self::</code> 可以省略</strong>，只有在 <code>use</code> 语句中需要显式写出。</p>
<div class="code-runner" data-full-code="fn%20serve_order()%20%7B%0A%20%20%20%20println!(%22%E6%8F%90%E4%BE%9B%E8%AE%A2%E5%8D%95%22)%3B%0A%7D%0A%0Amod%20back_of_house%20%7B%0A%20%20%20%20fn%20cook_order()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%87%86%E5%A4%87%E8%AE%A2%E5%8D%95%22)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20pub%20fn%20fix_incorrect_order()%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E2%9C%93%20%E4%BD%BF%E7%94%A8%20self%20%E8%AE%BF%E9%97%AE%E5%90%8C%E4%B8%80%E6%A8%A1%E5%9D%97%E7%9A%84%20cook_order%0A%20%20%20%20%20%20%20%20self%3A%3Acook_order()%3B%0A%0A%20%20%20%20%20%20%20%20%2F%2F%20%E2%9C%93%20%E4%BD%BF%E7%94%A8%20super%20%E8%AE%BF%E9%97%AE%E7%88%B6%E6%A8%A1%E5%9D%97%E7%9A%84%20serve_order%0A%20%20%20%20%20%20%20%20super%3A%3Aserve_order()%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20back_of_house%3A%3Afix_incorrect_order()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn serve_order() {
    println!("提供订单");
}

mod back_of_house {
    fn cook_order() {
        println!("准备订单");
    }

    pub fn fix_incorrect_order() {
        // ✓ 使用 self 访问同一模块的 cook_order
        self::cook_order();

        // ✓ 使用 super 访问父模块的 serve_order
        super::serve_order();
    }
}

fn main() {
    back_of_house::fix_incorrect_order();
}</code></pre></div>
<h2 id="绝对路径-vs-相对路径">绝对路径 vs 相对路径</h2>
<table><thead><tr><th>场景</th><th>推荐</th><th>原因</th></tr></thead><tbody><tr><td>定义项和使用项位置距离远</td><td>绝对路径</td><td>移动时只需改变一个位置</td></tr><tr><td>项在嵌套较深的模块中</td><td>相对路径 + super</td><td>避免写太长的路径</td></tr><tr><td>同时移动定义和使用</td><td>相对路径</td><td>整体迁移更方便</td></tr></tbody></table>
<h1 id="use-关键字">use 关键字</h1>
<p><code>use</code> 的作用是<strong>将项引入当前作用域</strong>，使你可以用更短的路径来访问它，而不用每次都写完整的模块路径。这是对路径的补充和简化。</p>
<h2 id="简化路径">简化路径</h2>
<p>每次都写完整路径会很冗长。<code>use</code> 关键字可以将项引入作用域，之后就可以使用短路径。</p>
<div class="code-runner" data-full-code="mod%20restaurant%20%7B%0A%20%20%20%20pub%20mod%20hosting%20%7B%0A%20%20%20%20%20%20%20%20pub%20fn%20add_to_waitlist()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%B7%B2%E6%B7%BB%E5%8A%A0%22)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E2%9D%8C%20%E4%B8%8D%E7%94%A8%20use%20%E6%97%B6%EF%BC%8C%E6%AF%8F%E6%AC%A1%E9%83%BD%E8%A6%81%E5%86%99%E5%AE%8C%E6%95%B4%E8%B7%AF%E5%BE%84%0A%20%20%20%20restaurant%3A%3Ahosting%3A%3Aadd_to_waitlist()%3B%0A%20%20%20%20restaurant%3A%3Ahosting%3A%3Aadd_to_waitlist()%3B%0A%0A%20%20%20%20%2F%2F%20%E2%9C%93%20%E4%BD%BF%E7%94%A8%20use%20%E5%BC%95%E5%85%A5%E5%90%8E%EF%BC%8C%E5%8F%AF%E4%BB%A5%E7%94%A8%E7%9F%AD%E8%B7%AF%E5%BE%84%0A%20%20%20%20use%20restaurant%3A%3Ahosting%3B%0A%20%20%20%20hosting%3A%3Aadd_to_waitlist()%3B%0A%20%20%20%20hosting%3A%3Aadd_to_waitlist()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">mod restaurant {
    pub mod hosting {
        pub fn add_to_waitlist() {
            println!("已添加");
        }
    }
}

fn main() {
    // ❌ 不用 use 时，每次都要写完整路径
    restaurant::hosting::add_to_waitlist();
    restaurant::hosting::add_to_waitlist();

    // ✓ 使用 use 引入后，可以用短路径
    use restaurant::hosting;
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}</code></pre></div>
<h3 id="use-的惯例">use 的惯例</h3>
<h4 id="函数导入到父模块调用时指定完整路径"><strong>函数</strong>：导入到父模块，调用时指定完整路径</h4>
<div class="code-runner" data-full-code="use%20std%3A%3Acollections%3A%3AHashMap%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20map%20%3D%20HashMap%3A%3Anew()%3B%20%20%2F%2F%20%E2%9C%93%20%E8%BF%99%E6%98%AF%E6%83%AF%E4%BE%8B%E7%94%A8%E6%B3%95%0A%20%20%20%20map.insert(1%2C%202)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();  // ✓ 这是惯例用法
    map.insert(1, 2);
}</code></pre></div>
<p>不好的做法：直接导入函数</p>
<div class="code-runner" data-full-code="use%20std%3A%3Acollections%3A%3Ahash_map%3A%3AHashMap%3A%3Anew%3B%20%20%2F%2F%20%E2%9C%97%20%E4%B8%8D%E6%8E%A8%E8%8D%90%0A%0A%2F%2F%20%E5%BA%94%E8%AF%A5%E8%BF%99%E6%A0%B7%EF%BC%9A%0Ause%20std%3A%3Acollections%3A%3AHashMap%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20map%20%3D%20HashMap%3A%3Anew()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::collections::hash_map::HashMap::new;  // ✗ 不推荐

// 应该这样：
use std::collections::HashMap;

fn main() {
    let map = HashMap::new();
}</code></pre></div>
<h4 id="结构体枚举导入完整路径"><strong>结构体、枚举</strong>：导入完整路径</h4>
<div class="code-runner" data-full-code="use%20std%3A%3Acollections%3A%3AHashMap%3B%0Ause%20std%3A%3Aresult%3A%3AResult%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20_map%20%3D%20HashMap%3A%3Anew()%3B%0A%20%20%20%20let%20_result%3A%20Result%3Ci32%2C%20String%3E%20%3D%20Ok(42)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::collections::HashMap;
use std::result::Result;

fn main() {
    let _map = HashMap::new();
    let _result: Result&lt;i32, String&gt; = Ok(42);
}</code></pre></div>
<h2 id="处理名称冲突">处理名称冲突</h2>
<p>当导入两个同名的项时，需要用父模块来区分，或用 <code>as</code> 起别名。</p>
<h3 id="方式-1用父模块区分">方式 1：用父模块区分</h3>
<div class="code-runner" data-full-code="use%20std%3A%3Afmt%3B%0Ause%20std%3A%3Aio%3B%0A%0Afn%20function1()%20-%3E%20fmt%3A%3AResult%20%7B%0A%20%20%20%20Ok(())%0A%7D%0A%0Afn%20function2()%20-%3E%20io%3A%3AResult%3C()%3E%20%7B%0A%20%20%20%20Ok(())%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20_r1%3A%20fmt%3A%3AResult%20%3D%20function1()%3B%0A%20%20%20%20let%20_r2%3A%20io%3A%3AResult%3C()%3E%20%3D%20function2()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fmt;
use std::io;

fn function1() -&gt; fmt::Result {
    Ok(())
}

fn function2() -&gt; io::Result&lt;()&gt; {
    Ok(())
}

fn main() {
    let _r1: fmt::Result = function1();
    let _r2: io::Result&lt;()&gt; = function2();
}</code></pre></div>
<h3 id="方式-2用-as-重命名">方式 2：用 as 重命名</h3>
<div class="code-runner" data-full-code="use%20std%3A%3Afmt%3A%3AResult%3B%0Ause%20std%3A%3Aio%3A%3AResult%20as%20IoResult%3B%0A%0Afn%20function1()%20-%3E%20Result%20%7B%0A%20%20%20%20Ok(())%0A%7D%0A%0Afn%20function2()%20-%3E%20IoResult%3C()%3E%20%7B%0A%20%20%20%20Ok(())%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20_r1%3A%20Result%20%3D%20function1()%3B%0A%20%20%20%20let%20_r2%3A%20IoResult%3C()%3E%20%3D%20function2()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -&gt; Result {
    Ok(())
}

fn function2() -&gt; IoResult&lt;()&gt; {
    Ok(())
}

fn main() {
    let _r1: Result = function1();
    let _r2: IoResult&lt;()&gt; = function2();
}</code></pre></div>
<h2 id="嵌套-use-路径">嵌套 use 路径</h2>
<p>导入多个项时，可以合并相同的前缀。</p>
<div class="code-runner" data-full-code="%2F%2F%20%E4%BC%A0%E7%BB%9F%E5%86%99%E6%B3%95%0Ause%20std%3A%3Acmp%3A%3AOrdering%3B%0Ause%20std%3A%3Aio%3B%0A%0A%2F%2F%20%E5%B5%8C%E5%A5%97%E5%86%99%E6%B3%95%EF%BC%88%E6%9B%B4%E7%AE%80%E6%B4%81%EF%BC%89%0Ause%20std%3A%3A%7Bcmp%3A%3AOrdering%2C%20io%7D%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20_order%20%3D%20Ordering%3A%3ALess%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 传统写法
use std::cmp::Ordering;
use std::io;

// 嵌套写法（更简洁）
use std::{cmp::Ordering, io};

fn main() {
    let _order = Ordering::Less;
}</code></pre></div>
<h3 id="包括-self-的嵌套">包括 self 的嵌套</h3>
<div class="code-runner" data-full-code="use%20std%3A%3Aio%3A%3A%7Bself%2C%20Write%7D%3B%20%20%2F%2F%20%E5%AF%BC%E5%85%A5%20io%20%E5%92%8C%20io%3A%3AWrite%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E4%BD%BF%E7%94%A8%20io%3A%3A%20%E5%92%8C%20io%3A%3AWrite%3A%3A%0A%7D" data-mode="run"><pre><code class="language-rust">use std::io::{self, Write};  // 导入 io 和 io::Write

fn main() {
    // 可以使用 io:: 和 io::Write::
}</code></pre></div>
<h2 id="glob-运算符">glob 运算符</h2>
<p>用 <code>*</code> 导入模块中的所有公有项（谨慎使用）。</p>
<div class="code-runner" data-full-code="use%20std%3A%3Acollections%3A%3A*%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%89%80%E6%9C%89%20collections%20%E4%B8%AD%E7%9A%84%E5%85%AC%E6%9C%89%E9%A1%B9%E9%83%BD%E5%8F%AF%E4%BB%A5%E4%BD%BF%E7%94%A8%0A%20%20%20%20let%20_vec%20%3D%20Vec%3A%3Anew()%3B%0A%20%20%20%20let%20_map%20%3D%20HashMap%3A%3Anew()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::collections::*;

fn main() {
    // 所有 collections 中的公有项都可以使用
    let _vec = Vec::new();
    let _map = HashMap::new();
}</code></pre></div>
<blockquote>
<p><strong>注意</strong>：glob 会让代码变得难以追踪名称来源，通常只在测试中使用。</p>
</blockquote>
<h2 id="pub-use重导出">pub use：重导出</h2>
<p><code>pub use</code> 将导入的项重新导出，使其对外部可见。这在设计库的公开 API 时很有用。</p>
<div class="code-runner" data-full-code="mod%20front_of_house%20%7B%0A%20%20%20%20pub%20mod%20hosting%20%7B%0A%20%20%20%20%20%20%20%20pub%20fn%20add_to_waitlist()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%B7%B2%E6%B7%BB%E5%8A%A0%22)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0A%2F%2F%20%E5%B0%86%20hosting%20%E9%87%8D%E6%96%B0%E5%AF%BC%E5%87%BA%E5%88%B0%E5%BA%93%E7%9A%84%E9%A1%B6%E5%B1%82%20API%0Apub%20use%20front_of_house%3A%3Ahosting%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E7%94%A8%E6%88%B7%E5%8F%AF%E4%BB%A5%E7%9B%B4%E6%8E%A5%E8%AE%BF%E9%97%AE%20hosting%EF%BC%8C%E4%B8%8D%E9%9C%80%E8%A6%81%E7%9F%A5%E9%81%93%20front_of_house%20%E7%9A%84%E5%AD%98%E5%9C%A8%0A%20%20%20%20hosting%3A%3Aadd_to_waitlist()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {
            println!("已添加");
        }
    }
}

// 将 hosting 重新导出到库的顶层 API
pub use front_of_house::hosting;

fn main() {
    // 用户可以直接访问 hosting，不需要知道 front_of_house 的存在
    hosting::add_to_waitlist();
}</code></pre></div>
<h3 id="为什么要重导出">为什么要重导出？</h3>
<p>想象你设计了一个库，内部结构是 <code>types::User</code> 和 <code>types::Post</code>，但用户只关心”用户”和”文章”这两个概念。用 <code>pub use</code> 可以简化 API。</p>
<p><strong>单文件例子：</strong></p>
<pre><code class="language-rust">// 内部结构
mod types {
    pub struct User { pub name: String }
    pub struct Post { pub title: String }
}

// 导出到顶层，用户可以直接用
pub use types::{User, Post};

// 用户现在可以这样使用：
// use my_lib::{User, Post};
// 而不需要知道 types 模块</code></pre>
<p><strong>多文件例子（深层模块的重导出）：</strong></p>
<p>假设你的库有这样的结构：<code>types</code> 模块在深处定义了 <code>User</code> 和 <code>Post</code>。问题是：能否直接从顶层 <code>lib.rs</code> 把它们导出给用户？</p>
<h3 id="第一种方式直接导出无中间层">第一种方式：直接导出（无中间层）</h3>
<p>项目结构：</p>
<pre><code class="language-text">src/
├── lib.rs
└── types/
    └── mod.rs         ← 这里定义 User 和 Post</code></pre>
<p><strong>types/mod.rs：</strong></p>
<pre><code class="language-rust">pub struct User { pub name: String }
pub struct Post { pub title: String }</code></pre>
<p><strong>lib.rs：</strong></p>
<pre><code class="language-rust">mod types;

// 直接从 types 导出到顶层
pub use types::{User, Post};</code></pre>
<p><strong>用户使用：</strong></p>
<pre><code class="language-rust">use my_lib::{User, Post};  // ✅ 工作正常</code></pre>
<hr/>
<h3 id="第二种方式链式重导出多层嵌套">第二种方式：链式重导出（多层嵌套）</h3>
<p>如果 types 被嵌套在 utils 内部，才需要链式转发：</p>
<p>项目结构：</p>
<pre><code class="language-text">src/
├── lib.rs
└── utils/
    ├── mod.rs
    └── types.rs        ← types 是 utils 的子模块</code></pre>
<p><strong>utils/types.rs：</strong></p>
<pre><code class="language-rust">pub struct User { pub name: String }
pub struct Post { pub title: String }</code></pre>
<p><strong>utils/mod.rs（从子模块重导出）：</strong></p>
<pre><code class="language-rust">mod types;

// 把 types 导出到 utils 的公开 API
pub use types::{User, Post};</code></pre>
<p><strong>lib.rs（再导出一级到顶层）：</strong></p>
<pre><code class="language-rust">mod utils;

// 把 utils 的导出再导到顶层
pub use utils::{User, Post};</code></pre>
<p><strong>用户使用：</strong></p>
<pre><code class="language-rust">use my_lib::{User, Post};  // ✅ 用户完全看不到 utils 的存在</code></pre>
<p><strong>真实意义</strong>：当 types 本身是 utils 内部的组织时，链式重导出让用户只看到最简洁的公开 API。</p>
<blockquote>
<p><strong>重要</strong>：重导出有个前提——<strong>源项必须是 <code>pub</code> 的</strong>。如果 <code>User</code> 本身是私有的，即使你写了 <code>pub use types::User;</code> 也会编译错误。因为重导出就是”我允许外部访问这个项”，但前提是这个项本身要对外可见。</p>
</blockquote>
<h1 id="跨-crate-使用">跨 Crate 使用</h1>
<p>前面讲的都是<strong>同一个 crate 内</strong>的模块访问。Rust 也支持<strong>跨 crate 访问</strong>——调用其他 crate 中的函数。</p>
<h2 id="前提条件">前提条件</h2>
<ol>
<li><strong>目标必须是库 crate</strong>（有 <code>src/lib.rs</code>）</li>
<li><strong>函数必须标记为 <code>pub</code></strong>（否则外部无法访问）</li>
<li><strong>在 Cargo.toml 中声明依赖</strong></li>
<li><strong>用 <code>use</code> 导入</strong></li>
</ol>
<h2 id="文件结构">文件结构</h2>
<pre><code class="language-text">workspace/
├── math_lib/                    ← 库 crate
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs              ← 包含 pub fn add()
│
└── my_app/                      ← 应用 crate
    ├── Cargo.toml              ← 声明对 math_lib 的依赖
    └── src/
        └── main.rs             ← 使用 use math_lib::add;</code></pre>
<h2 id="实例">实例</h2>
<p>假设有两个 crate：<code>math_lib</code>（库）和 <code>my_app</code>（应用）</p>
<p><strong>math_lib/src/lib.rs：</strong></p>
<pre><code class="language-rust">pub fn add(a: i32, b: i32) -&gt; i32 {
    a + b
}

fn internal_helper() {  // 私有，外部无法访问
    println!("内部帮助函数");
}</code></pre>
<p><strong>my_app/Cargo.toml：</strong></p>
<pre><code class="language-toml">[dependencies]
math_lib = { path = "../math_lib" }  # 本地路径
# 或从 crates.io：
# math_lib = "0.1"</code></pre>
<p><strong>my_app/src/main.rs：</strong></p>
<pre><code class="language-rust">use math_lib::add;  // 导入其他 crate 的函数

fn main() {
    let result = add(2, 3);  // ✓ 可以调用 pub 函数
    println!("结果：{}", result);

    // ❌ 无法调用私有函数
    // math_lib::internal_helper();
}</code></pre>
<h2 id="可见性仍然有效">可见性仍然有效</h2>
<p>跨 crate 访问时，<strong>可见性规则仍然适用</strong>：</p>
<ul>
<li>只能访问目标 crate 中标记为 <code>pub</code> 的项</li>
<li>嵌套模块也要遵循”完整路径都是 pub”的规则</li>
<li>私有项永远隐藏，无论在哪里调用</li>
</ul>
<p>这是 <strong>Cargo（包管理器）</strong> 和 <strong>模块系统</strong> 结合的力量。</p>
<h2 id="循环依赖约束">循环依赖约束</h2>
<p><strong>重要限制</strong>：Rust 的 crate 依赖<strong>必须是 DAG（有向无环图）</strong>，不允许循环依赖。</p>
<pre><code class="language-text">❌ 不允许循环依赖：
crate_a → crate_b → crate_c → crate_a</code></pre>
<p><strong>如果遇到循环依赖</strong>，通常说明代码设计有问题，需要重构：</p>
<ul>
<li>提取公共功能到第三个 crate</li>
<li>将某个 crate 的依赖改为模块内依赖</li>
</ul>
<p>强制消除循环依赖，反而能写出更清晰的架构。</p>
<h1 id="练习题">练习题</h1>
<h2 id="路径基础测验">路径基础测验</h2>
<pre><code class="language-rust">mod outer {
    pub mod inner {
        pub fn function() {
            println!("inner function");
        }
    }
}</code></pre>
</div>
</div>
</div>
<div class="code-runner" data-full-code="use%20std%3A%3Acmp%3A%3AOrdering%3B%0Ause%20std%3A%3Acollections%3A%3AHashMap%3B%0Ause%20std%3A%3Acollections%3A%3AHashSet%3B%0Ause%20std%3A%3Aio%3B%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20_order%20%3D%20Ordering%3A%3ALess%3B%0A%20%20%20%20let%20_map%20%3D%20HashMap%3A%3Anew()%3B%0A%20%20%20%20let%20_set%20%3D%20HashSet%3A%3Anew()%3B%0A%20%20%20%20let%20_io%20%3D%20io%3A%3Astdout()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">use std::cmp::Ordering;
use std::collections::HashMap;
use std::collections::HashSet;
use std::io;

fn main() {
    let _order = Ordering::Less;
    let _map = HashMap::new();
    let _set = HashSet::new();
    let _io = io::stdout();
}</code></pre></div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="利用-use-和路径组织模块">利用 use 和路径组织模块</h3>
<p>创建一个库结构，包含：</p>
<ul>
<li><code>types</code> 模块（私有），定义 <code>User</code> 和 <code>Post</code> 结构体</li>
<li>通过 <code>pub use</code> 将 <code>User</code> 和 <code>Post</code> 重导出到顶层</li>
<li><code>utils</code> 模块，包含 <code>format_user()</code> 函数</li>
<li>在 <code>main</code> 中通过简洁的路径使用这些项</li>
</ul>
<div class="code-editor" data-block-id="07-modules/03-paths-use#4:5" data-expect-mode="literal" data-expect-pattern="Alice%0A%E6%88%91%E7%9A%84%E5%8D%9A%E6%96%87%0A%E7%94%A8%E6%88%B7%3A%20Alice" data-starter-code="%2F%2F%20TODO%3A%20%E4%BF%AE%E6%94%B9%E5%8F%AF%E8%A7%81%E6%80%A7%0Amod%20types%20%7B%0A%20%20%20%20struct%20User%20%7B%0A%20%20%20%20%20%20%20%20name%3A%20String%2C%0A%20%20%20%20%7D%0A%20%20%20%20struct%20Post%20%7B%0A%20%20%20%20%20%20%20%20title%3A%20String%2C%0A%20%20%20%20%7D%0A%7D%0A%0A%2F%2F%20TODO%3A%20%E4%BD%BF%E7%94%A8%20pub%20use%20%E5%B0%86%20User%20%E5%92%8C%20Post%20%E9%87%8D%E5%AF%BC%E5%87%BA%0A%0A%2F%2F%20TODO%3A%20%E4%BD%BF%E7%94%A8%20User%0Amod%20utils%20%7B%0A%0A%0A%20%20%20%20pub%20fn%20format_user(user%3A%20%26User)%20-%3E%20String%20%7B%0A%20%20%20%20%20%20%20%20format!(%22%E7%94%A8%E6%88%B7%3A%20%7B%7D%22%2C%20user.name)%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E7%9B%B4%E6%8E%A5%E4%BD%BF%E7%94%A8%20User%EF%BC%8C%E4%B8%8D%E9%9C%80%E8%A6%81%E7%9F%A5%E9%81%93%20types%20%E6%A8%A1%E5%9D%97%0A%20%20%20%20let%20user%20%3D%20User%20%7B%20name%3A%20%22Alice%22.to_string()%20%7D%3B%0A%20%20%20%20let%20post%20%3D%20Post%20%7B%20title%3A%20%22%E6%88%91%E7%9A%84%E5%8D%9A%E6%96%87%22.to_string()%20%7D%3B%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20user.name)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20post.title)%3B%0A%0A%20%20%20%20%2F%2F%20%E4%BD%BF%E7%94%A8%20utils%20%E4%B8%AD%E7%9A%84%E5%87%BD%E6%95%B0%0A%20%20%20%20println!(%22%7B%7D%22%2C%20utils%3A%3Aformat_user(%26user))%3B%0A%7D"><pre><code class="language-rust">// TODO: 修改可见性
mod types {
    struct User {
        name: String,
    }
    struct Post {
        title: String,
    }
}

// TODO: 使用 pub use 将 User 和 Post 重导出

// TODO: 使用 User
mod utils {


    pub fn format_user(user: &amp;User) -&gt; String {
        format!("用户: {}", user.name)
    }
}

fn main() {
    // 直接使用 User，不需要知道 types 模块
    let user = User { name: "Alice".to_string() };
    let post = Post { title: "我的博文".to_string() };

    println!("{}", user.name);
    println!("{}", post.title);

    // 使用 utils 中的函数
    println!("{}", utils::format_user(&amp;user));
}</code></pre></div> 