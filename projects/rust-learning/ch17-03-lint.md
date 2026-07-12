---
title: "代码质量：Lint、Clippy 与 rustfmt"
description: "编程方法论 - 代码质量：Lint、Clippy 与 rustfmt"
date: "2026-07-12"
order: 17003
tags: ["Clippy", "rustfmt", "lint", "代码格式", "代码规范"]
est_time: "25 分钟"
---

 <h1 id="lint-基础">Lint 基础</h1>
<p>编译器会帮你检查代码能不能运行，而 <strong>lint</strong> 工具则会进一步检查代码<strong>写得好不好</strong>——即使编译通过，lint 也能发现潜在的 bug、低效写法或不符合惯例的代码。</p>
<p>Rust 内置了两层 lint 系统：编译器自带的警告，以及功能更强大的 <strong>Clippy</strong> 工具。</p>
<h2 id="编译器内置-lint">编译器内置 lint</h2>
<p>Rust 编译器本身就会发出一些警告（warning），这些警告就是最基础的 lint。常见的有：</p>
<div class="code-runner" data-full-code="fn%20unused_function()%20%7B%0A%20%20%20%20%2F%2F%20%E6%9C%AA%E8%A2%AB%E8%B0%83%E7%94%A8%E7%9A%84%E5%87%BD%E6%95%B0%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20x%20%3D%205%3B%20%2F%2F%20%E5%A3%B0%E6%98%8E%E4%BA%86%E4%BD%86%E6%B2%A1%E7%94%A8%EF%BC%9Adead_code%20%2F%20unused_variables%0A%20%20%20%20println!(%22Hello%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn unused_function() {
    // 未被调用的函数
}

fn main() {
    let x = 5; // 声明了但没用：dead_code / unused_variables
    println!("Hello");
}</code></pre></div>
<p>运行上面代码时，编译器会输出警告：</p>
<pre><code class="language-text">warning: unused variable: `x`
warning: function `unused_function` is never used</code></pre>
<blockquote>
<p>警告不会阻止编译，但应当认真对待——在成熟项目中，警告数量应尽量保持为零。</p>
</blockquote>
<h2 id="用属性控制-lint-级别">用属性控制 lint 级别</h2>
<p>每条 lint 都可以设置四种级别：</p>
<table><thead><tr><th>级别</th><th>属性</th><th>效果</th></tr></thead><tbody><tr><td>允许</td><td><code>#[allow(lint_name)]</code></td><td>静默这条警告</td></tr><tr><td>警告</td><td><code>#[warn(lint_name)]</code></td><td>显示警告（默认）</td></tr><tr><td>错误</td><td><code>#[deny(lint_name)]</code></td><td>将警告升级为编译错误</td></tr><tr><td>禁止</td><td><code>#[forbid(lint_name)]</code></td><td>错误且不能被 allow 覆盖</td></tr></tbody></table>
<p>作用范围可以是整个 crate（<code>#![]</code> 内部属性）或单个函数/结构体（<code>#[]</code> 外部属性）：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E6%95%B4%E4%B8%AA%20crate%20%E7%BA%A7%E5%88%AB%EF%BC%9A%E5%85%81%E8%AE%B8%E6%9C%AA%E4%BD%BF%E7%94%A8%E4%BB%A3%E7%A0%81%EF%BC%88%E8%B0%83%E8%AF%95%E6%97%B6%E5%B8%B8%E7%94%A8%EF%BC%89%0A%23!%5Ballow(dead_code)%5D%0A%23!%5Ballow(unused_variables)%5D%0A%0Afn%20helper()%20%7B%7D%20%20%20%2F%2F%20%E4%B8%8D%E5%86%8D%E8%AD%A6%E5%91%8A%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20_unused%20%3D%2042%3B%20%20%2F%2F%20%E4%B8%8D%E5%86%8D%E8%AD%A6%E5%91%8A%0A%20%20%20%20println!(%22ok%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 整个 crate 级别：允许未使用代码（调试时常用）
#![allow(dead_code)]
#![allow(unused_variables)]

fn helper() {}   // 不再警告

fn main() {
    let _unused = 42;  // 不再警告
    println!("ok");
}</code></pre></div>
<div class="code-runner" data-full-code="%2F%2F%20%E5%B0%86%E6%9F%90%E6%9D%A1%E8%AD%A6%E5%91%8A%E5%8D%87%E7%BA%A7%E4%B8%BA%E9%94%99%E8%AF%AF%E2%80%94%E2%80%94%E9%80%82%E5%90%88%E5%9C%A8%20CI%20%E4%B8%AD%E5%BC%BA%E5%88%B6%E6%89%A7%E8%A1%8C%0A%23!%5Bdeny(unused_must_use)%5D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20Result%20%E5%BF%85%E9%A1%BB%E8%A2%AB%E5%A4%84%E7%90%86%EF%BC%8C%E5%90%A6%E5%88%99%E7%BC%96%E8%AF%91%E5%A4%B1%E8%B4%A5%0A%20%20%20%20let%20result%3A%20Result%3Ci32%2C%20%26str%3E%20%3D%20Ok(1)%3B%0A%20%20%20%20let%20_%20%3D%20result%3B%20%2F%2F%20%E9%9C%80%E8%A6%81%E6%98%BE%E5%BC%8F%E5%A4%84%E7%90%86%0A%20%20%20%20println!(%22ok%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 将某条警告升级为错误——适合在 CI 中强制执行
#![deny(unused_must_use)]

fn main() {
    // Result 必须被处理，否则编译失败
    let result: Result&lt;i32, &amp;str&gt; = Ok(1);
    let _ = result; // 需要显式处理
    println!("ok");
}</code></pre></div>
<blockquote>
<p>生产项目中常见的做法是在 <code>lib.rs</code> 或 <code>main.rs</code> 顶部添加 <code>#![deny(warnings)]</code>，把所有警告都变成错误，配合 CI 确保代码质量。</p>
</blockquote>
<h2 id="常见内置-lint">常见内置 lint</h2>
<table><thead><tr><th>Lint 名称</th><th>触发场景</th></tr></thead><tbody><tr><td><code>dead_code</code></td><td>定义了但从不调用的函数、结构体等</td></tr><tr><td><code>unused_variables</code></td><td>声明了但没有使用的变量</td></tr><tr><td><code>unused_imports</code></td><td>引入了但没有用到的 <code>use</code></td></tr><tr><td><code>unused_must_use</code></td><td>没有处理返回 <code>#[must_use]</code> 的值（如 <code>Result</code>）</td></tr><tr><td><code>non_snake_case</code></td><td>变量/函数不符合 snake_case 命名规范</td></tr><tr><td><code>non_camel_case_types</code></td><td>类型名不符合 CamelCase 规范</td></tr></tbody></table>
<blockquote>
<p>用 <code>_</code> 前缀可以抑制单个变量的 <code>unused_variables</code> 警告：<code>let _temp = foo();</code></p>
</blockquote>
<h1 id="clippy">Clippy</h1>
<h2 id="什么是-clippy">什么是 Clippy</h2>
<p><code>cargo clippy</code> 是 Rust 官方的 lint 工具，内置 <strong>700+ 条规则</strong>，远超编译器自带的警告。它能发现：</p>
<ul>
<li>可以简化的代码</li>
<li>常见的性能陷阱</li>
<li>容易引发 bug 的写法</li>
<li>不符合 Rust 惯例的模式</li>
</ul>
<p>安装（随 rustup 自动安装，通常已有）：</p>
<pre><code class="language-bash">rustup component add clippy</code></pre>
<p>运行：</p>
<pre><code class="language-bash">cargo clippy           # 检查当前项目
cargo clippy -- -D warnings  # 将所有 clippy 警告升级为错误（CI 推荐）</code></pre>
<h2 id="clippy-的-lint-分类">Clippy 的 lint 分类</h2>
<p>Clippy 把规则分成以下几个类别：</p>
<table><thead><tr><th>分类</th><th>说明</th><th>默认状态</th></tr></thead><tbody><tr><td><code>correctness</code></td><td>几乎肯定是 bug</td><td><strong>错误</strong>（deny）</td></tr><tr><td><code>suspicious</code></td><td>很可能是 bug 或误用</td><td><strong>警告</strong></td></tr><tr><td><code>style</code></td><td>不符合 Rust 惯用写法</td><td><strong>警告</strong></td></tr><tr><td><code>complexity</code></td><td>可以简化的复杂写法</td><td><strong>警告</strong></td></tr><tr><td><code>perf</code></td><td>有更高效的替代写法</td><td><strong>警告</strong></td></tr><tr><td><code>pedantic</code></td><td>更严格的风格检查</td><td>默认关闭</td></tr><tr><td><code>nursery</code></td><td>实验性规则</td><td>默认关闭</td></tr><tr><td><code>restriction</code></td><td>特定场景的限制性规则</td><td>默认关闭</td></tr></tbody></table>
<h2 id="典型-clippy-警告示例">典型 Clippy 警告示例</h2>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20clippy%3A%3Alen_zero%EF%BC%9A%E5%BA%94%E8%AF%A5%E7%94%A8%20.is_empty()%20%E4%BB%A3%E6%9B%BF%20.len()%20%3D%3D%200%0A%20%20%20%20let%20v%3A%20Vec%3Ci32%3E%20%3D%20vec!%5B%5D%3B%0A%20%20%20%20if%20v.len()%20%3D%3D%200%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E7%A9%BA%22)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20clippy%3A%3Aneedless_return%EF%BC%9A%E4%B8%8D%E5%BF%85%E8%A6%81%E7%9A%84%20return%0A%20%20%20%20%2F%2F%20clippy%20%E4%BC%9A%E5%BB%BA%E8%AE%AE%E5%8E%BB%E6%8E%89%20return%0A%0A%20%20%20%20%2F%2F%20clippy%3A%3Amap_unwrap_or%EF%BC%9A%E5%8F%AF%E4%BB%A5%E7%94%A8%20map_or%20%E6%9B%BF%E4%BB%A3%20.map().unwrap_or()%0A%20%20%20%20let%20opt%3A%20Option%3Ci32%3E%20%3D%20Some(5)%3B%0A%20%20%20%20let%20_x%20%3D%20opt.map(%7Cv%7C%20v%20*%202).unwrap_or(0)%3B%0A%20%20%20%20%2F%2F%20clippy%20%E5%BB%BA%E8%AE%AE%EF%BC%9Aopt.map_or(0%2C%20%7Cv%7C%20v%20*%202)%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    // clippy::len_zero：应该用 .is_empty() 代替 .len() == 0
    let v: Vec&lt;i32&gt; = vec![];
    if v.len() == 0 {
        println!("空");
    }

    // clippy::needless_return：不必要的 return
    // clippy 会建议去掉 return

    // clippy::map_unwrap_or：可以用 map_or 替代 .map().unwrap_or()
    let opt: Option&lt;i32&gt; = Some(5);
    let _x = opt.map(|v| v * 2).unwrap_or(0);
    // clippy 建议：opt.map_or(0, |v| v * 2)
}</code></pre></div>
<h2 id="针对-clippy-的属性控制">针对 Clippy 的属性控制</h2>
<p>和内置 lint 一样，可以用属性静默特定 Clippy 规则：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E5%85%81%E8%AE%B8%E6%95%B4%E4%B8%AA%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E6%9F%90%E4%BA%9B%20clippy%20%E8%A7%84%E5%88%99%0A%23!%5Ballow(clippy%3A%3Aneedless_return)%5D%0A%0Afn%20get_value()%20-%3E%20i32%20%7B%0A%20%20%20%20return%2042%3B%20%2F%2F%20clippy%20%E6%9C%AC%E6%9D%A5%E4%BC%9A%E8%AD%A6%E5%91%8A%E8%BF%99%E9%87%8C%EF%BC%8C%E7%8E%B0%E5%9C%A8%E8%A2%AB%E9%9D%99%E9%BB%98%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%8F%AA%E5%85%81%E8%AE%B8%E8%BF%99%E4%B8%80%E8%A1%8C%E7%9A%84%E7%89%B9%E5%AE%9A%20clippy%20%E8%A7%84%E5%88%99%0A%20%20%20%20%23%5Ballow(clippy%3A%3Alen_zero)%5D%0A%20%20%20%20let%20check%20%3D%20vec!%5B1%2C%202%5D.len()%20%3D%3D%200%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20check)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">// 允许整个文件使用某些 clippy 规则
#![allow(clippy::needless_return)]

fn get_value() -&gt; i32 {
    return 42; // clippy 本来会警告这里，现在被静默
}

fn main() {
    // 只允许这一行的特定 clippy 规则
    #[allow(clippy::len_zero)]
    let check = vec![1, 2].len() == 0;
    println!("{}", check);
}</code></pre></div>
<blockquote>
<p>静默 lint 应该是例外而不是常规操作。遇到 Clippy 警告时，首先思考能否按建议修改，确实有充分理由才 <code>#[allow]</code>。</p>
</blockquote>
<h2 id="常用-clippy-规则速查">常用 Clippy 规则速查</h2>
<table><thead><tr><th>规则</th><th>建议</th></tr></thead><tbody><tr><td><code>clippy::len_zero</code></td><td>用 <code>.is_empty()</code> 替代 <code>.len() == 0</code></td></tr><tr><td><code>clippy::needless_return</code></td><td>去掉多余的 <code>return</code></td></tr><tr><td><code>clippy::clone_on_copy</code></td><td><code>Copy</code> 类型不需要 <code>.clone()</code></td></tr><tr><td><code>clippy::unwrap_used</code></td><td>避免直接 <code>.unwrap()</code>，处理错误</td></tr><tr><td><code>clippy::map_unwrap_or</code></td><td>用 <code>.map_or()</code> 替代 <code>.map().unwrap_or()</code></td></tr><tr><td><code>clippy::redundant_clone</code></td><td>不必要的 <code>.clone()</code></td></tr><tr><td><code>clippy::dbg_macro</code></td><td>发布前移除 <code>dbg!()</code> 调用</td></tr><tr><td><code>clippy::todo</code></td><td>提醒 <code>todo!()</code> 未完成的代码</td></tr></tbody></table>
<h1 id="rustfmt">rustfmt</h1>
<p><code>rustfmt</code> 是 Rust 官方的代码格式化工具。它和 Clippy 解决的是不同层面的问题：Clippy 关注<strong>代码逻辑和最佳实践</strong>，rustfmt 关注<strong>代码排版外观</strong>——缩进、空格、换行、括号位置等。</p>
<p>两者的配合：先用 rustfmt 统一格式，消除格式噪音；再用 Clippy 关注实质性的逻辑问题。</p>
<h2 id="什么是-rustfmt">什么是 rustfmt</h2>
<p>rustfmt 按照 Rust 社区约定的风格重新排版代码，消除团队内部的格式争论（“括号要不要换行？""缩进用 2 还是 4 个空格？”）。</p>
<p>安装（随 rustup 自动安装）：</p>
<pre><code class="language-bash">rustup component add rustfmt</code></pre>
<p>运行：</p>
<pre><code class="language-bash">cargo fmt           # 格式化整个项目（直接修改文件）
cargo fmt --check   # 只检查，不修改（CI 中使用）</code></pre>
<p><code>cargo fmt --check</code> 在文件格式不符合规范时以非零退出码退出，适合放入 CI 流水线，强制所有提交都经过格式检查。</p>
<h2 id="rustfmttoml-配置">rustfmt.toml 配置</h2>
<p>在项目根目录创建 <code>rustfmt.toml</code>（或 <code>.rustfmt.toml</code>）可以自定义格式规则。大多数项目使用默认规则即可，常见的调整有：</p>
<pre><code class="language-toml"># rustfmt.toml
edition = "2021"          # Rust 版本（影响部分格式规则）
max_width = 100           # 最大行宽（默认 100）
use_small_heuristics = "Max"  # 尽量把短表达式放在同一行
imports_granularity = "Crate" # 将同一 crate 的 use 合并
group_imports = "StdExternalCrate"  # use 分组：std / 外部 / 本地</code></pre>
<blockquote>
<p><strong>团队项目的建议</strong>：把 <code>rustfmt.toml</code> 提交进版本库，保证所有人使用相同的格式规则。同时在 CI 中加上 <code>cargo fmt --check</code>，不符合格式的 PR 无法通过。</p>
</blockquote>
<h2 id="在-ci-中强制格式检查">在 CI 中强制格式检查</h2>
<p>格式化的最大价值在于<strong>自动化强制</strong>——不依赖每个人手动运行，而是让 CI 帮你把关。典型的 CI 格式检查步骤：</p>
<pre><code class="language-bash">cargo fmt --check          # 检查格式（不修改文件）
cargo clippy -- -D warnings  # 检查 lint（警告视为错误）</code></pre>
<p>当开发者忘记格式化时，CI 会失败，提示其本地运行 <code>cargo fmt</code> 后重新提交。</p>
<h2 id="与编辑器集成">与编辑器集成</h2>
<p>rustfmt 最常见的使用方式不是手动运行，而是<strong>保存时自动格式化</strong>：</p>
<ul>
<li><strong>VS Code</strong>：安装 rust-analyzer 后，在设置中开启 <code>editor.formatOnSave = true</code>，并将 Rust 文件的默认格式化器设为 rust-analyzer</li>
<li><strong>其他编辑器</strong>：大多数主流编辑器（Vim、Emacs、IntelliJ）都有对应的 Rust 插件支持保存时格式化</li>
</ul>
<p>保存时自动格式化后，你几乎不需要再思考格式问题——代码永远保持规范，<code>cargo fmt --check</code> 在 CI 中也永远通过。</p>
<h1 id="练习题">练习题</h1>
<h2 id="lint-级别">Lint 级别</h2>
</div>
<h2 id="前缀-_-的作用">前缀 _ 的作用</h2>
</div>
<h2 id="cargo-clippy-与-cargo-build-的区别">cargo clippy 与 cargo build 的区别</h2>
</div>
<h2 id="forbid-与-deny-的区别">#[forbid] 与 #[deny] 的区别</h2>
</div>
<h2 id="rustfmt-使用">rustfmt 使用</h2>
</div>
</div> 