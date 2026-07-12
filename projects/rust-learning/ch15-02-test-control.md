---
title: "控制测试运行"
description: "测试 - 控制测试运行"
date: "2026-07-12"
order: 15002
tags: ["cargo test", "测试过滤", "并行测试", "ignore", "show-output", "test-threads"]
est_time: "15 分钟"
---

 <h1 id="cargo-test-的参数体系">cargo test 的参数体系</h1>
<p><code>cargo test</code> 的命令行参数分为<strong>两段</strong>，用 <code>--</code> 分隔：</p>
<pre><code class="language-bash">cargo test [cargo 自身的参数] -- [传递给测试二进制的参数]</code></pre>
<ul>
<li><code>--</code> <strong>之前</strong>：控制 Cargo 编译行为（如 <code>--release</code>、<code>--package</code>）</li>
<li><code>--</code> <strong>之后</strong>：控制测试程序的运行方式（如 <code>--test-threads</code>、<code>--show-output</code>）</li>
</ul>
<pre><code class="language-bash"># -- 之前：Cargo 自身的参数
cargo test --release               # 以 release 模式编译后运行测试
cargo test --package my_lib        # 只测试指定的包（工作区场景）
cargo test --help                  # 查看 Cargo 层的选项

# -- 之后：传给测试二进制的参数
cargo test -- --test-threads=1     # 串行运行测试
cargo test -- --show-output        # 显示通过测试的 println! 输出
cargo test -- --ignored            # 只运行被 #[ignore] 标记的测试
cargo test -- --help               # 查看测试二进制层的所有选项

# 两段组合使用
cargo test --release -- --test-threads=1   # release 模式 + 串行运行
cargo test my_func -- --show-output        # 只运行名称含 my_func 的测试，并显示输出</code></pre>
<p>这两段的参数各自独立，不要混淆。</p>
<h1 id="控制测试运行方式">控制测试运行方式</h1>
<h2 id="并行与串行">并行与串行</h2>
<p>默认情况下，Rust 会<strong>并行运行</strong>所有测试（多线程），以加快速度。</p>
<p>但并行运行有一个前提：<strong>测试之间不能共享状态</strong>。如果两个测试都读写同一个文件，就可能相互干扰，导致莫名其妙的失败。</p>
<p>遇到这种情况，可以把线程数限制为 1，让测试<strong>串行执行</strong>：</p>
<pre><code class="language-bash">cargo test -- --test-threads=1</code></pre>
<p>这样慢一些，但测试结果稳定可靠，适合调试相互干扰的测试。</p>
<h2 id="显示-println-的输出">显示 println! 的输出</h2>
<p>默认情况下，<strong>通过的测试</strong>中的 <code>println!</code> 输出会被 Rust 截获，不显示在终端，只有失败的测试才会显示标准输出。</p>
<div class="code-runner" data-full-code="fn%20double(x%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20println!(%22double(%7B%7D)%20%E8%A2%AB%E8%B0%83%E7%94%A8%E4%BA%86%22%2C%20x)%3B%20%20%2F%2F%20%E6%AD%A3%E5%B8%B8%E8%BF%90%E8%A1%8C%E6%97%B6%E4%BC%9A%E7%9C%8B%E5%88%B0%EF%BC%8C%E6%B5%8B%E8%AF%95%E9%80%9A%E8%BF%87%E6%97%B6%E7%9C%8B%E4%B8%8D%E5%88%B0%0A%20%20%20%20x%20*%202%0A%7D%0A%0A%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20test_double()%20%7B%0A%20%20%20%20%20%20%20%20let%20result%20%3D%20double(5)%3B%0A%20%20%20%20%20%20%20%20assert_eq!(10%2C%20result)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn double(x: i32) -&gt; i32 {
    println!("double({}) 被调用了", x);  // 正常运行时会看到，测试通过时看不到
    x * 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_double() {
        let result = double(5);
        assert_eq!(10, result);
    }
}</code></pre></div>
<p>运行 <code>cargo test</code>，因为测试通过，你<strong>看不到</strong> <code>println!</code> 的内容。</p>
<p>如果你想在测试通过时也看到输出，加上 <code>--show-output</code>：</p>
<pre><code class="language-bash">cargo test -- --show-output</code></pre>
<p>这在调试时很有用——你可以在函数里加几行 <code>println!</code> 来观察中间状态，而不用担心干扰测试结果。</p>
<h2 id="按名称过滤只运行部分测试">按名称过滤：只运行部分测试</h2>
<p>有时你只想运行某一个或某一类测试，不需要跑所有测试：</p>
<p>假设有三个测试：</p>
<div class="code-runner" data-full-code="pub%20fn%20add_two(a%3A%20i32)%20-%3E%20i32%20%7B%0A%20%20%20%20a%20%2B%202%0A%7D%0A%0A%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20add_two_and_two()%20%7B%0A%20%20%20%20%20%20%20%20assert_eq!(4%2C%20add_two(2))%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20add_three_and_two()%20%7B%0A%20%20%20%20%20%20%20%20assert_eq!(5%2C%20add_two(3))%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20one_hundred()%20%7B%0A%20%20%20%20%20%20%20%20assert_eq!(102%2C%20add_two(100))%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">pub fn add_two(a: i32) -&gt; i32 {
    a + 2
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_two_and_two() {
        assert_eq!(4, add_two(2));
    }

    #[test]
    fn add_three_and_two() {
        assert_eq!(5, add_two(3));
    }

    #[test]
    fn one_hundred() {
        assert_eq!(102, add_two(100));
    }
}</code></pre></div>
<p><strong>只运行一个测试</strong>——传入完整函数名：</p>
<pre><code class="language-bash">cargo test one_hundred</code></pre>
<pre><code class="language-text">running 1 test
test tests::one_hundred ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 2 filtered out</code></pre>
<p><strong>运行名称包含某个词的所有测试</strong>——传入部分名称：</p>
<pre><code class="language-bash">cargo test add</code></pre>
<pre><code class="language-text">running 2 tests
test tests::add_two_and_two ... ok
test tests::add_three_and_two ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 1 filtered out</code></pre>
<p><code>2 filtered out</code> 说明有 2 个测试被过滤掉了（这里只有 1 个，但样例展示了概念）。</p>
<blockquote>
<p>测试名称包含<strong>模块路径</strong>，因此 <code>cargo test tests</code> 可以运行 <code>tests</code> 模块里的所有测试。</p>
</blockquote>
<h2 id="忽略耗时测试">忽略耗时测试</h2>
<p>有些测试运行时间很长（比如访问网络、操作大文件），日常开发中不想每次都跑。用 <code>#[ignore]</code> 标记它们：</p>
<div class="code-runner" data-full-code="%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20quick_test()%20%7B%0A%20%20%20%20%20%20%20%20assert_eq!(2%20%2B%202%2C%204)%3B%20%20%2F%2F%20%E7%9E%AC%E9%97%B4%E5%AE%8C%E6%88%90%0A%20%20%20%20%7D%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20%23%5Bignore%5D%0A%20%20%20%20fn%20slow_test()%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E5%81%87%E8%AE%BE%E8%BF%99%E9%87%8C%E9%9C%80%E8%A6%81%E8%B7%91%E5%BE%88%E4%B9%85%E2%80%A6%E2%80%A6%0A%20%20%20%20%20%20%20%20assert!(true)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[cfg(test)]
mod tests {
    #[test]
    fn quick_test() {
        assert_eq!(2 + 2, 4);  // 瞬间完成
    }

    #[test]
    #[ignore]
    fn slow_test() {
        // 假设这里需要跑很久……
        assert!(true);
    }
}</code></pre></div>
<p>运行 <code>cargo test</code>，<code>slow_test</code> 会显示为 <code>ignored</code>，不被执行：</p>
<pre><code class="language-text">running 2 tests
test tests::slow_test ... ignored
test tests::quick_test ... ok

test result: ok. 1 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out</code></pre>
<p>当你需要专门运行被忽略的测试（比如 CI 环境），用：</p>
<pre><code class="language-bash">cargo test -- --ignored</code></pre>
<p>这样只运行带 <code>#[ignore]</code> 的测试，方便单独跑耗时测试套件。</p>
<h2 id="命令速查">命令速查</h2>
<table><thead><tr><th>目标</th><th>命令</th></tr></thead><tbody><tr><td>运行所有测试</td><td><code>cargo test</code></td></tr><tr><td>串行运行（单线程）</td><td><code>cargo test -- --test-threads=1</code></td></tr><tr><td>显示通过测试的输出</td><td><code>cargo test -- --show-output</code></td></tr><tr><td>只运行名称匹配的测试</td><td><code>cargo test &lt;关键词&gt;</code></td></tr><tr><td>只运行被忽略的测试</td><td><code>cargo test -- --ignored</code></td></tr><tr><td>运行所有（含被忽略的）</td><td><code>cargo test -- --include-ignored</code></td></tr></tbody></table>
<h1 id="练习题">练习题</h1>
<h2 id="测验">测验</h2>
</div>
</div>
</div>
</div>
</div> 