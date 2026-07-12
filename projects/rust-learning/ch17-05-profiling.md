---
title: "性能分析与基准测试"
description: "编程方法论 - 性能分析与基准测试"
date: "2026-07-12"
order: 17005
tags: ["基准测试", "性能分析", "flamegraph", "criterion", "perf"]
est_time: "35 分钟"
---

 <h1 id="基准测试">基准测试</h1>
<p>“这段代码应该更快”——在没有测量之前，这只是猜测。性能优化必须从<strong>测量</strong>开始，测量要有<strong>可比较的基准</strong>。基准测试（Benchmark）就是对代码性能建立可复现、可量化的测量标准。</p>
<h2 id="先测量再优化">先测量再优化</h2>
<p><strong>过早优化是万恶之源。</strong>（Donald Knuth）</p>
<p>在没有性能数据之前动手优化，有两个常见后果：</p>
<ol>
<li><strong>优化了不重要的地方</strong>：花了一天把某个函数优化了 30%，但那个函数只占总运行时间的 0.1%</li>
<li><strong>让代码变复杂</strong>：为了性能牺牲了可读性，结果实际收益几乎为零</li>
</ol>
<p>正确的流程：</p>
<pre><code class="language-text">① 确认有性能问题（用户反馈、监控数据）
② 测量（profiling），找出真正的热点（通常 80% 的时间在 20% 的代码）
③ 对热点建立基准测试
④ 优化热点
⑤ 重新运行基准测试，确认优化有效
⑥ 运行功能测试，确认没有引入 bug</code></pre>
<blockquote>
<p>Rust 的编译器优化（特别是 release 模式）本身就很强。很多”手动优化”在 release 模式下实际上没有效果，因为编译器已经做了。永远在 <code>--release</code> 模式下测量性能。</p>
</blockquote>
<h2 id="cargo-bench-与-criterion">cargo bench 与 criterion</h2>
<p>Rust 标准库内置了 <code>#[bench]</code> 属性（nightly only），但生产中更常用 <strong>criterion</strong> 这个第三方 benchmark 框架，它提供：</p>
<ul>
<li>统计上更可靠的测量（多次采样，过滤噪音）</li>
<li>自动检测性能退化（与上次运行对比）</li>
<li>HTML 报告，包含可视化图表</li>
<li>稳定版 Rust 即可使用</li>
</ul>
<p><strong>在项目中添加 criterion：</strong></p>
<pre><code class="language-toml"># Cargo.toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "my_benchmark"
harness = false</code></pre>
<p><strong>基准测试文件结构（<code>benches/my_benchmark.rs</code>）：</strong></p>
<div class="code-runner" data-full-code="use%20criterion%3A%3A%7Bblack_box%2C%20criterion_group%2C%20criterion_main%2C%20Criterion%7D%3B%0Afn%20fibonacci(n%3A%20u64)%20-%3E%20u64%20%7B%0A%20%20%20%20match%20n%20%7B%0A%20%20%20%20%20%20%20%200%20%3D%3E%201%2C%0A%20%20%20%20%20%20%20%201%20%3D%3E%201%2C%0A%20%20%20%20%20%20%20%20n%20%3D%3E%20fibonacci(n%20-%201)%20%2B%20fibonacci(n%20-%202)%2C%0A%20%20%20%20%7D%0A%7D%0Afn%20bench_fibonacci(c%3A%20%26mut%20Criterion)%20%7B%0A%20%20%20%20%2F%2F%20c.bench_function%20%E6%B3%A8%E5%86%8C%E4%B8%80%E4%B8%AA%E5%9F%BA%E5%87%86%E6%B5%8B%E8%AF%95%0A%20%20%20%20c.bench_function(%22fibonacci%2020%22%2C%20%7Cb%7C%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20b.iter%20%E6%98%AF%E5%AE%9E%E9%99%85%E6%B5%8B%E9%87%8F%E7%9A%84%E5%BE%AA%E7%8E%AF%0A%20%20%20%20%20%20%20%20b.iter(%7C%7C%20fibonacci(black_box(20)))%0A%20%20%20%20%20%20%20%20%2F%2F%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%5E%5E%5E%5E%5E%5E%5E%5E%5E%20black_box%20%E9%98%B2%E6%AD%A2%E7%BC%96%E8%AF%91%E5%99%A8%E4%BC%98%E5%8C%96%E6%8E%89%E8%A2%AB%E6%B5%8B%E4%BB%A3%E7%A0%81%0A%20%20%20%20%7D)%3B%0A%7D%0Acriterion_group!(benches%2C%20bench_fibonacci)%3B%0Acriterion_main!(benches)%3B" data-has-hidden="true" data-mode="run"><pre><code class="language-rust">fn bench_fibonacci(c: &amp;mut Criterion) {
    // c.bench_function 注册一个基准测试
    c.bench_function("fibonacci 20", |b| {
        // b.iter 是实际测量的循环
        b.iter(|| fibonacci(black_box(20)))
        //                   ^^^^^^^^^ black_box 防止编译器优化掉被测代码
    });
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">use</span><span style="color:#B392F0"> criterion</span><span style="color:#F97583">::</span><span style="color:#E1E4E8">{black_box, criterion_group, criterion_main, </span><span style="color:#B392F0">Criterion</span><span style="color:#E1E4E8">};</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> fibonacci</span><span style="color:#E1E4E8">(n</span><span style="color:#F97583">:</span><span style="color:#B392F0"> u64</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> u64</span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#F97583">    match</span><span style="color:#E1E4E8"> n {</span></span>
<span class="line"><span style="color:#79B8FF">        0</span><span style="color:#F97583"> =&gt;</span><span style="color:#79B8FF"> 1</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#79B8FF">        1</span><span style="color:#F97583"> =&gt;</span><span style="color:#79B8FF"> 1</span><span style="color:#E1E4E8">,</span></span>
<span class="line"><span style="color:#E1E4E8">        n </span><span style="color:#F97583">=&gt;</span><span style="color:#B392F0"> fibonacci</span><span style="color:#E1E4E8">(n </span><span style="color:#F97583">-</span><span style="color:#79B8FF"> 1</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">+</span><span style="color:#B392F0"> fibonacci</span><span style="color:#E1E4E8">(n </span><span style="color:#F97583">-</span><span style="color:#79B8FF"> 2</span><span style="color:#E1E4E8">),</span></span>
<span class="line"><span style="color:#E1E4E8">    }</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> bench_fibonacci</span><span style="color:#E1E4E8">(c</span><span style="color:#F97583">:</span><span style="color:#F97583"> &amp;mut</span><span style="color:#B392F0"> Criterion</span><span style="color:#E1E4E8">) {</span></span>
<span class="line"><span style="color:#6A737D">    // c.bench_function 注册一个基准测试</span></span>
<span class="line"><span style="color:#E1E4E8">    c</span><span style="color:#F97583">.</span><span style="color:#B392F0">bench_function</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"fibonacci 20"</span><span style="color:#E1E4E8">, </span><span style="color:#F97583">|</span><span style="color:#E1E4E8">b</span><span style="color:#F97583">|</span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#6A737D">        // b.iter 是实际测量的循环</span></span>
<span class="line"><span style="color:#E1E4E8">        b</span><span style="color:#F97583">.</span><span style="color:#B392F0">iter</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">||</span><span style="color:#B392F0"> fibonacci</span><span style="color:#E1E4E8">(</span><span style="color:#B392F0">black_box</span><span style="color:#E1E4E8">(</span><span style="color:#79B8FF">20</span><span style="color:#E1E4E8">)))</span></span>
<span class="line"><span style="color:#6A737D">        //                   ^^^^^^^^^ black_box 防止编译器优化掉被测代码</span></span>
<span class="line"><span style="color:#E1E4E8">    });</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span>
<span class="line"><span style="color:#B392F0">criterion_group!</span><span style="color:#E1E4E8">(benches, bench_fibonacci);</span></span>
<span class="line"><span style="color:#B392F0">criterion_main!</span><span style="color:#E1E4E8">(benches);</span></span></div></div>
<p><strong>运行基准测试：</strong></p>
<pre><code class="language-bash">cargo bench                          # 运行所有基准测试
cargo bench -- fibonacci             # 只运行名称包含 "fibonacci" 的测试
cargo bench -- --save-baseline main  # 保存当前结果为基准线
cargo bench -- --baseline main       # 与之前保存的基准线对比</code></pre>
<h2 id="设计有意义的-benchmark">设计有意义的 benchmark</h2>
<p>基准测试写错了会给出误导性的数据，有几个常见陷阱：</p>
<p><strong>陷阱一：让编译器优化掉被测代码</strong></p>
<p>如果被测函数的结果没有被使用，编译器可能直接删掉整个计算。使用 <code>black_box()</code> 告诉编译器”这个值我会用，不要优化掉”。</p>
<p><strong>陷阱二：测量了初始化时间</strong></p>
<p>如果被测代码需要初始化（比如创建大型数据结构），应该把初始化放在 <code>iter</code> 循环外：</p>
<div class="code-runner" data-full-code="use%20criterion%3A%3A%7Bblack_box%2C%20Criterion%7D%3B%0Afn%20bench_sort(c%3A%20%26mut%20Criterion)%20%7B%0A%20%20%20%20%2F%2F%20%E5%88%9D%E5%A7%8B%E5%8C%96%E6%94%BE%E5%9C%A8%20iter%20%E5%A4%96%0A%20%20%20%20let%20data%3A%20Vec%3Ci32%3E%20%3D%20(0..1000).rev().collect()%3B%0A%0A%20%20%20%20c.bench_function(%22sort%201000%20elements%22%2C%20%7Cb%7C%20%7B%0A%20%20%20%20%20%20%20%20b.iter(%7C%7C%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20let%20mut%20v%20%3D%20data.clone()%3B%20%2F%2F%20clone%20%E6%98%AF%E8%A2%AB%E6%B5%8B%E6%88%90%E6%9C%AC%E7%9A%84%E4%B8%80%E9%83%A8%E5%88%86%EF%BC%88%E5%A6%82%E6%9E%9C%E4%BD%A0%E6%83%B3%EF%BC%89%0A%20%20%20%20%20%20%20%20%20%20%20%20v.sort()%3B%0A%20%20%20%20%20%20%20%20%20%20%20%20black_box(v)%0A%20%20%20%20%20%20%20%20%7D)%0A%20%20%20%20%7D)%3B%0A%7D" data-has-hidden="true" data-mode="run"><pre><code class="language-rust">fn bench_sort(c: &amp;mut Criterion) {
    // 初始化放在 iter 外
    let data: Vec&lt;i32&gt; = (0..1000).rev().collect();

    c.bench_function("sort 1000 elements", |b| {
        b.iter(|| {
            let mut v = data.clone(); // clone 是被测成本的一部分（如果你想）
            v.sort();
            black_box(v)
        })
    });
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">use</span><span style="color:#B392F0"> criterion</span><span style="color:#F97583">::</span><span style="color:#E1E4E8">{black_box, </span><span style="color:#B392F0">Criterion</span><span style="color:#E1E4E8">};</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> bench_sort</span><span style="color:#E1E4E8">(c</span><span style="color:#F97583">:</span><span style="color:#F97583"> &amp;mut</span><span style="color:#B392F0"> Criterion</span><span style="color:#E1E4E8">) {</span></span>
<span class="line"><span style="color:#6A737D">    // 初始化放在 iter 外</span></span>
<span class="line"><span style="color:#F97583">    let</span><span style="color:#E1E4E8"> data</span><span style="color:#F97583">:</span><span style="color:#B392F0"> Vec</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">i32</span><span style="color:#E1E4E8">&gt; </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> (</span><span style="color:#79B8FF">0</span><span style="color:#F97583">..</span><span style="color:#79B8FF">1000</span><span style="color:#E1E4E8">)</span><span style="color:#F97583">.</span><span style="color:#B392F0">rev</span><span style="color:#E1E4E8">()</span><span style="color:#F97583">.</span><span style="color:#B392F0">collect</span><span style="color:#E1E4E8">();</span></span>

<span class="line"><span style="color:#E1E4E8">    c</span><span style="color:#F97583">.</span><span style="color:#B392F0">bench_function</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"sort 1000 elements"</span><span style="color:#E1E4E8">, </span><span style="color:#F97583">|</span><span style="color:#E1E4E8">b</span><span style="color:#F97583">|</span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#E1E4E8">        b</span><span style="color:#F97583">.</span><span style="color:#B392F0">iter</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">||</span><span style="color:#E1E4E8"> {</span></span>
<span class="line"><span style="color:#F97583">            let</span><span style="color:#F97583"> mut</span><span style="color:#E1E4E8"> v </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> data</span><span style="color:#F97583">.</span><span style="color:#B392F0">clone</span><span style="color:#E1E4E8">(); </span><span style="color:#6A737D">// clone 是被测成本的一部分（如果你想）</span></span>
<span class="line"><span style="color:#E1E4E8">            v</span><span style="color:#F97583">.</span><span style="color:#B392F0">sort</span><span style="color:#E1E4E8">();</span></span>
<span class="line"><span style="color:#B392F0">            black_box</span><span style="color:#E1E4E8">(v)</span></span>
<span class="line"><span style="color:#E1E4E8">        })</span></span>
<span class="line"><span style="color:#E1E4E8">    });</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></div></div>
<p><strong>陷阱三：数据量太小</strong></p>
<p>如果被测操作本身只需要几纳秒，测量误差会淹没真实结果。选择有代表性的数据量（通常与生产环境接近）。</p>
<h1 id="性能分析">性能分析</h1>
<p>基准测试告诉你”代码快了还是慢了”，但不告诉你”慢在哪里”。<strong>性能分析（Profiling）</strong> 工具可以记录程序运行时每个函数花了多少时间，帮你定位热点。</p>
<h2 id="perf-与-flamegraph">perf 与 flamegraph</h2>
<p><strong>perf</strong>（Linux）是最常用的性能采样工具，它以固定频率对程序进行快照，记录当时正在执行的函数。<strong>flamegraph</strong> 把 perf 的采样结果可视化成一张火焰图，让热点一目了然。</p>
<p><strong>基本工作流（Linux）：</strong></p>
<pre><code class="language-bash"># 1. 编译 release 版本并保留调试符号
cargo build --release
# 在 Cargo.toml 中添加：
# [profile.release]
# debug = true

# 2. 用 perf 采样运行
perf record -g ./target/release/my_app

# 3. 生成火焰图
perf script | stackcollapse-perf | flamegraph &gt; flamegraph.svg

# 或者用 cargo-flamegraph（封装了上述步骤）
cargo install flamegraph
cargo flamegraph --bin my_app</code></pre>
<p><strong>在 macOS 上：</strong> 使用 Instruments（Xcode 自带）或 <code>cargo-instruments</code>：</p>
<pre><code class="language-bash">cargo install cargo-instruments
cargo instruments -t time --bin my_app</code></pre>
<h2 id="读懂火焰图">读懂火焰图</h2>
<p>火焰图的阅读方式：</p>
<pre><code class="language-text">┌──────────────────────────────────────────────────┐
│                  main                            │  ← 最底层：程序入口
├──────────────┬───────────────────────────────────┤
│  parse_config│        process_data               │  ← 调用的函数
├──────────────┴──────────┬────────────────────────┤
│                         │   sort_records         │  ← 热点！宽度大 = 时间多
│                         ├────────────────────────┤
│                         │   HashMap::insert      │
└─────────────────────────┴────────────────────────┘
  横轴 = 时间占比（越宽 = 占用时间越多）
  纵轴 = 调用栈深度（越高 = 调用层数越深）</code></pre>
<p><strong>关键原则：</strong></p>
<ul>
<li>找<strong>最宽的”平顶”函数</strong>——这是热点，花了最多时间，没有继续向下调用</li>
<li>不要被调用栈深的函数迷惑——高度只代表调用层数，不代表时间多</li>
</ul>
<h2 id="定位热点的工作流">定位热点的工作流</h2>
<pre><code class="language-text">① 确认性能问题确实存在（用基准测试或生产监控数据）
    ↓
② 用 flamegraph 找出最宽的热点函数
    ↓
③ 分析热点函数：是算法复杂度问题、内存分配问题还是 IO 等待？
    ↓
④ 针对性优化：
   - 算法问题 → 换数据结构或算法
   - 内存分配过多 → 预分配、复用 buffer、避免不必要 clone
   - IO 等待 → 异步/并发、批处理、缓存
    ↓
⑤ 重新运行基准测试，量化改善幅度
    ↓
⑥ 检查功能测试，确认没有引入 bug
    ↓
⑦ 如果改善不够，回到②</code></pre>
<h2 id="常见性能瓶颈模式">常见性能瓶颈模式</h2>
<p>Rust 程序中反复出现的性能问题：</p>
<table><thead><tr><th>模式</th><th>表现</th><th>解决思路</th></tr></thead><tbody><tr><td><strong>频繁小内存分配</strong></td><td>火焰图中大量 <code>alloc</code> / <code>malloc</code></td><td>预分配 <code>Vec::with_capacity</code>；使用 arena 分配器</td></tr><tr><td><strong>不必要的 clone</strong></td><td>数据被复制多次</td><td>检查所有权，能借用就不克隆</td></tr><tr><td><strong>低效的字符串处理</strong></td><td>大量 <code>String</code> 拼接</td><td>用 <code>write!</code> 到 buffer；或 <code>join</code></td></tr><tr><td><strong>HashMap 哈希函数慢</strong></td><td>大量 HashMap 操作占用时间</td><td>换用 <code>FxHashMap</code> / <code>AHashMap</code> 等更快的哈希实现</td></tr><tr><td><strong>迭代器中的条件分支</strong></td><td>循环内有大量 if/match</td><td>尝试提取不变条件到循环外；SIMD 优化</td></tr><tr><td><strong>同步 IO 阻塞</strong></td><td>线程长时间等待 IO</td><td>换用异步 IO（tokio/async-std）</td></tr></tbody></table>
<blockquote>
<p><strong>性能优化的黄金法则</strong>：优化之后，测量必须能证明改善。如果改善不显著，回滚——复杂的代码是维护成本，不应该为不明显的收益付出这个代价。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="基准测试测验">基准测试测验</h2>
</div>
</div>
<h2 id="profiling-测验">Profiling 测验</h2>
</div>
</div> 