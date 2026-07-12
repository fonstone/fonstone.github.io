---
title: "暴露 Rust 给 C：cbindgen"
description: "C 互操作 - 暴露 Rust 给 C：cbindgen"
date: "2026-07-12"
order: 19003
tags: ["cbindgen", "Rust 暴露", "C 头文件生成"]
est_time: "30 分钟"
---

 <h1 id="导出-rust-给-c">导出 Rust 给 C</h1>
<p>有时我们需要编写一个极高性能的 Rust 库，然后让现有的 C、C++ 或 Python 代码调用它。这需要我们完成两件事：</p>
<ol>
<li>将 Rust 代码编译成 C 兼容的动态链接库（<code>.so</code>/<code>.dll</code>）。</li>
<li>为 C 代码提供对应的头文件（<code>.h</code>）。</li>
</ol>
<p>这就是 <strong><code>cbindgen</code></strong> 的用武之地。</p>
<h2 id="准备-rust-代码">准备 Rust 代码</h2>
<p>要导出函数，必须满足：</p>
<ul>
<li>使用 <code>pub extern "C"</code>。</li>
<li>使用 <code>#[no_mangle]</code> 禁用符号重整。</li>
</ul>
<div class="code-runner" data-full-code="%23%5Brepr(C)%5D%0Apub%20struct%20CalculationResult%20%7B%0A%20%20%20%20pub%20value%3A%20f64%2C%0A%20%20%20%20pub%20is_valid%3A%20bool%2C%0A%7D%0A%0A%23%5Bno_mangle%5D%0Apub%20extern%20%22C%22%20fn%20calculate_sqrt(input%3A%20f64)%20-%3E%20CalculationResult%20%7B%0A%20%20%20%20if%20input%20%3C%200.0%20%7B%0A%20%20%20%20%20%20%20%20CalculationResult%20%7B%20value%3A%200.0%2C%20is_valid%3A%20false%20%7D%0A%20%20%20%20%7D%20else%20%7B%0A%20%20%20%20%20%20%20%20CalculationResult%20%7B%20value%3A%20input.sqrt()%2C%20is_valid%3A%20true%20%7D%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[repr(C)]
pub struct CalculationResult {
    pub value: f64,
    pub is_valid: bool,
}

#[no_mangle]
pub extern "C" fn calculate_sqrt(input: f64) -&gt; CalculationResult {
    if input &lt; 0.0 {
        CalculationResult { value: 0.0, is_valid: false }
    } else {
        CalculationResult { value: input.sqrt(), is_valid: true }
    }
}</code></pre></div>
<p>注意：结构体必须加上 <code>#[repr(C)]</code>，否则 Rust 的布局方式与 C 不一致，会导致严重的数据损坏问题。</p>
<h2 id="项目配置">项目配置</h2>
<p>在 <code>Cargo.toml</code> 中，必须指定库类型为 <code>cdylib</code>：</p>
<pre><code class="language-toml">[lib]
crate-type = ["cdylib"]</code></pre>
<h1 id="配置与使用">配置与使用</h1>
<p>虽然可以手动写头文件，但如果你的 Rust 接口经常变动，同步起来会非常麻烦。<code>cbindgen</code> 可以自动化这一过程。</p>
<h2 id="使用-cli-工具">使用 CLI 工具</h2>
<p>安装工具：</p>
<pre><code class="language-bash">cargo install cbindgen</code></pre>
<p>在 Rust 项目根目录运行：</p>
<pre><code class="language-bash">cbindgen --config cbindgen.toml --crate my_project --output my_lib.h</code></pre>
<p>生成的 <code>my_lib.h</code> 如下：</p>
<pre><code class="language-c">#include &lt;stdint.h&gt;
#include &lt;stdbool.h&gt;

typedef struct {
  double value;
  bool is_valid;
} CalculationResult;

CalculationResult calculate_sqrt(double input);</code></pre>
<h2 id="cbindgentoml-配置">cbindgen.toml 配置</h2>
<p>通过一个可选的配置文件，你可以精细控制头文件的生成逻辑：</p>
<pre><code class="language-toml">language = "C" # 也可以是 "C++"
header = "/* 自动化生成的 Rust 绑定头文件 */"
include_guard = "MY_LIB_H"

[export]
include = ["CalculationResult", "calculate_sqrt"]</code></pre>
<h2 id="内存安全警告">内存安全警告</h2>
<p>从 C 调用 Rust 时，<strong>所有权规则依然存在</strong>。</p>
<ul>
<li>如果 Rust 返回了一个在堆上分配的对象（如 <code>Box</code> 或 <code>Vec</code>），C 代码必须将其传回给 Rust 的特定函数来释放。</li>
<li>绝不要在 C 语言中直接调用 <code>free()</code> 来释放由 Rust 堆分配器管理的内存。</li>
</ul>
<h1 id="练习题">练习题</h1>
<h2 id="核心概念测验">核心概念测验</h2>
</div>
</div>
</div>
</div>
</div> 