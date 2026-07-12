---
title: "集成测试"
description: "测试 - 集成测试"
date: "2026-07-12"
order: 15003
tags: ["集成测试", "tests/", "共享模块", "测试组织"]
est_time: "15 分钟"
---

 <h1 id="两种测试的分工">两种测试的分工</h1>
<p>Rust 项目通常有两类测试，它们的目标不同、放的地方也不同：</p>
<table><thead><tr><th></th><th>单元测试</th><th>集成测试</th></tr></thead><tbody><tr><td><strong>放在哪里</strong></td><td>与源码同文件（<code>src/</code> 目录下）</td><td>独立的 <code>tests/</code> 目录</td></tr><tr><td><strong>测什么</strong></td><td>单个函数/模块的正确性，可以访问私有函数</td><td>多个模块协作的整体行为，只能访问公有 API</td></tr><tr><td><strong>需要 <code>#[cfg(test)]</code></strong></td><td>是（因为和源码在同一文件）</td><td>否（Cargo 自动识别 <code>tests/</code> 目录）</td></tr><tr><td><strong>典型用途</strong></td><td>验证内部实现细节</td><td>模拟真实用户调用库的方式</td></tr></tbody></table>
<p>单元测试发现的是”零件坏了”，集成测试发现的是”零件没坏，但组装有问题”。两者互补，缺一不可。</p>
<h2 id="单元测试的组织">单元测试的组织</h2>
<p>单元测试住在源码文件里，用 <code>#[cfg(test)]</code> 隔离：</p>
<div class="code-runner" data-full-code="pub%20fn%20add_two(a%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20internal_adder(a%2C%202)%0A%7D%0A%0Afn%20internal_adder(a%3A%20i32%2C%20b%3A%20i32)%20-%3E%20i32%20%7B%20%20%2F%2F%20%E7%A7%81%E6%9C%89%E5%87%BD%E6%95%B0%0A%20%20%20%20a%20%2B%20b%0A%7D%0A%0A%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20test_public()%20%7B%0A%20%20%20%20%20%20%20%20assert_eq!(4%2C%20add_two(2))%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20test_private()%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E5%8F%AF%E4%BB%A5%E7%9B%B4%E6%8E%A5%E6%B5%8B%E8%AF%95%E7%A7%81%E6%9C%89%E5%87%BD%E6%95%B0%EF%BC%81%0A%20%20%20%20%20%20%20%20assert_eq!(5%2C%20internal_adder(3%2C%202))%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">pub fn add_two(a: i32) -&gt; i32 {
    internal_adder(a, 2)
}

fn internal_adder(a: i32, b: i32) -&gt; i32 {  // 私有函数
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_public() {
        assert_eq!(4, add_two(2));
    }

    #[test]
    fn test_private() {
        // 可以直接测试私有函数！
        assert_eq!(5, internal_adder(3, 2));
    }
}</code></pre></div>
<p><code>#[cfg(test)]</code> 的作用是：<code>cargo build</code> 时这个模块完全不存在，只有 <code>cargo test</code> 时才编译进去。</p>
<h1 id="编写集成测试">编写集成测试</h1>
<h2 id="tests-目录结构">tests/ 目录结构</h2>
<p>集成测试放在项目根目录的 <code>tests/</code> 目录下（与 <code>src/</code> 同级）：</p>
<pre><code class="language-text">my_project/
├── src/
│   └── lib.rs
└── tests/
    └── integration_test.rs   ← 集成测试文件</code></pre>
<p><code>tests/</code> 下每个文件都是一个独立的 crate，Cargo 会在 <code>cargo test</code> 时自动编译并运行它们，<strong>不需要</strong> <code>#[cfg(test)]</code> 标注。</p>
<p>示例 <code>tests/integration_test.rs</code>：</p>
<pre><code class="language-rust">use adder;  // 引入我们的库 crate

#[test]
fn it_adds_two() {
    assert_eq!(4, adder::add_two(2));
}</code></pre>
<p>注意：</p>
<ul>
<li>需要用 <code>use</code> 显式引入库，像外部用户一样使用它</li>
<li>只能调用<strong>公有</strong> API，私有函数在集成测试中不可见</li>
<li>每个文件都是独立 crate，不同文件之间默认不共享代码</li>
</ul>
<p>运行时，输出会分为三段：</p>
<pre><code class="language-text">running 1 test                         ← 单元测试
test tests::internal ... ok

running 1 test                         ← 集成测试
test it_adds_two ... ok

running 0 tests                        ← 文档测试</code></pre>
<h2 id="运行指定的集成测试文件">运行指定的集成测试文件</h2>
<p>如果 <code>tests/</code> 下有多个文件，可以用 <code>--test</code> 指定运行某个文件：</p>
<pre><code class="language-bash">cargo test --test integration_test</code></pre>
<p>只会运行 <code>tests/integration_test.rs</code> 中的测试，忽略其他文件。</p>
<p>结合名称过滤，可以更精确：</p>
<pre><code class="language-bash">cargo test --test integration_test it_adds</code></pre>
<p>只运行 <code>integration_test.rs</code> 中名称含 <code>it_adds</code> 的测试。</p>
<h2 id="集成测试中的共享辅助模块">集成测试中的共享辅助模块</h2>
<p>当多个集成测试文件都需要共同的辅助函数时，需要特别注意——<strong>不能</strong>直接创建 <code>tests/common.rs</code>。</p>
<p>为什么？因为 <code>tests/</code> 下每个 <code>.rs</code> 文件都被视为独立的测试 crate，<code>tests/common.rs</code> 也会被当成一个独立的测试文件运行，然后显示 <code>running 0 tests</code>——让输出变得混乱。</p>
<p><strong>正确做法</strong>：创建子目录 <code>tests/common/mod.rs</code>：</p>
<pre><code class="language-text">tests/
├── integration_test.rs
└── common/
    └── mod.rs          ← 辅助函数放这里</code></pre>
<p><code>tests/common/mod.rs</code> 中写辅助函数：</p>
<pre><code class="language-rust">pub fn setup() {
    // 测试前的准备工作，比如创建临时文件、初始化数据等
}</code></pre>
<p>在集成测试文件中引用它：</p>
<pre><code class="language-rust">use adder;

mod common;  // 声明模块

#[test]
fn it_adds_two() {
    common::setup();  // 调用辅助函数
    assert_eq!(4, adder::add_two(2));
}</code></pre>
<p>子目录里的文件不会被 Cargo 当作独立的测试 crate，测试输出里不会出现多余的 <code>running 0 tests</code>。</p>
<blockquote>
<p><strong>原理</strong>：Cargo 的规则是：<code>tests/</code> 下的<strong>直接子 <code>.rs</code> 文件</strong>各自是独立 crate；但<strong>子目录下的文件</strong>不是，它们只是普通模块。<code>tests/common/mod.rs</code> 走的是第二条路，所以不会被单独编译为测试 crate。</p>
</blockquote>
<h2 id="二进制项目的集成测试">二进制项目的集成测试</h2>
<p>只有<strong>库 crate</strong>（<code>src/lib.rs</code>）才能被集成测试引入。如果你的项目只有 <code>src/main.rs</code>（二进制 crate），集成测试就无法用 <code>use</code> 引入它的代码。</p>
<p>这是 Rust 生态约定采用<strong>薄 main + 厚 lib</strong> 结构的原因：</p>
<pre><code class="language-text">src/
├── main.rs   ← 只做参数解析、调用 lib 函数，尽量精简
└── lib.rs    ← 核心逻辑全在这里，方便测试</code></pre>
<p><code>main.rs</code> 里调用 <code>lib.rs</code> 中的函数；集成测试则通过 <code>use</code> 引入 <code>lib.rs</code> 测试核心逻辑。<code>main.rs</code> 的代码很少，不测也无妨。</p>
<h1 id="练习题">练习题</h1>
<h2 id="测验">测验</h2>
</div>
</div>
</div>
</div>
</div> 