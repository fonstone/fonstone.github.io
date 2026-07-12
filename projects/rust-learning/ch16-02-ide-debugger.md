---
title: "IDE 调试器（rust-analyzer）"
description: "调试 - IDE 调试器（rust-analyzer）"
date: "2026-07-12"
order: 16002
tags: ["IDE", "调试器", "rust-analyzer", "断点", "调试"]
est_time: "30 分钟"
---

 <h1 id="配置调试环境">配置调试环境</h1>
<p><code>dbg!</code> 适合快速排查，但当 bug 涉及复杂的状态变化、循环迭代或多函数调用时，<strong>图形化调试器</strong>会更有效率。你可以暂停程序在任意行，逐步观察每个变量的状态，而不需要插入任何代码。</p>
<h2 id="需要安装什么">需要安装什么</h2>
<p>在 VS Code 中调试 Rust 程序需要两个扩展：</p>
<p><strong>1. rust-analyzer</strong>（必须）</p>
<ul>
<li>Rust 语言服务器，提供代码补全、错误提示、跳转定义</li>
<li>搜索 <code>rust-analyzer</code>，安装官方扩展（Rust Programming Language 发布）</li>
</ul>
<p><strong>2. CodeLLDB</strong>（调试器后端，必须）</p>
<ul>
<li>基于 LLDB 的调试适配器，让 VS Code 能控制 Rust 程序的执行</li>
<li>搜索 <code>CodeLLDB</code>，安装 Vadim Chugunov 发布的扩展</li>
</ul>
<blockquote>
<p>除了 CodeLLDB，也有 <strong>MSVC Debugger</strong>（<code>ms-vscode.cpptools</code>）可用于 Windows。本文以 CodeLLDB 为例，它在 macOS/Linux/Windows 上都可用。</p>
</blockquote>
<h2 id="创建-launchjson">创建 launch.json</h2>
<p>VS Code 需要一个 <code>launch.json</code> 文件来知道如何启动调试会话。</p>
<p><strong>方法一：自动生成（推荐）</strong></p>
<ol>
<li>打开 <code>src/main.rs</code></li>
<li>点击左侧活动栏的”运行与调试”图标（或按 <code>Ctrl+Shift+D</code> / <code>Cmd+Shift+D</code>）</li>
<li>点击”创建 launch.json 文件”</li>
<li>选择 <code>LLDB</code> 作为调试器类型</li>
</ol>
<p>VS Code 会在 <code>.vscode/launch.json</code> 生成类似以下内容：</p>
<pre><code class="language-json">{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug executable 'my_app'",
            "cargo": {
                "args": [
                    "build",
                    "--bin=my_app",
                    "--package=my_app"
                ],
                "filter": {
                    "name": "my_app",
                    "kind": "bin"
                }
            },
            "args": [],
            "cwd": "${workspaceFolder}"
        }
    ]
}</code></pre>
<p>关键字段说明：</p>
<table><thead><tr><th>字段</th><th>说明</th></tr></thead><tbody><tr><td><code>type: "lldb"</code></td><td>使用 CodeLLDB 调试器</td></tr><tr><td><code>request: "launch"</code></td><td>启动一个新进程（另一个选项是 <code>attach</code> 附加到已运行的进程）</td></tr><tr><td><code>cargo.args</code></td><td>构建参数，<code>--bin=my_app</code> 指定要调试的二进制名</td></tr><tr><td><code>args</code></td><td>传给程序本身的命令行参数</td></tr><tr><td><code>cwd</code></td><td>程序的工作目录</td></tr></tbody></table>
<p><strong>方法二：手动创建</strong></p>
<p>在项目根目录创建 <code>.vscode/launch.json</code>，复制上面的模板，把 <code>my_app</code> 替换成你的 crate 名称（见 <code>Cargo.toml</code> 中的 <code>name</code> 字段）。</p>
<h2 id="验证安装">验证安装</h2>
<p>配置好后，按 <code>F5</code> 应该能启动调试会话。如果程序正常结束，调试器会退出。如果遇到 <code>cargo: command not found</code> 或类似错误，检查 Rust 工具链是否正确安装（运行 <code>rustup show</code>）。</p>
<h1 id="调试操作">调试操作</h1>
<h2 id="设置断点">设置断点</h2>
<p>断点（Breakpoint）告诉调试器”在这行暂停程序，等我查看状态”。</p>
<p><strong>设置断点</strong>：在代码编辑器里，点击行号左侧的空白区域，会出现一个红色圆点。</p>
<p><strong>条件断点</strong>：右键红点 → “编辑断点” → 填入条件表达式（如 <code>i == 5</code>），只有条件为真时才暂停，在循环调试时非常有用。</p>
<h2 id="启动调试">启动调试</h2>
<p>按 <code>F5</code> 或点击”运行与调试”面板里的绿色播放按钮。程序会运行直到遇到第一个断点，然后暂停。</p>
<p>此时顶部会出现<strong>调试工具栏</strong>：</p>
<table><thead><tr><th>按钮</th><th>快捷键</th><th>功能</th></tr></thead><tbody><tr><td>继续</td><td><code>F5</code></td><td>继续运行，直到下一个断点</td></tr><tr><td>单步跳过</td><td><code>F10</code></td><td>执行当前行，不进入函数</td></tr><tr><td>单步进入</td><td><code>F11</code></td><td>执行当前行，如果是函数调用则进入该函数</td></tr><tr><td>单步跳出</td><td><code>Shift+F11</code></td><td>运行完当前函数，回到调用处</td></tr><tr><td>重启</td><td><code>Ctrl+Shift+F5</code></td><td>重新从头开始调试</td></tr><tr><td>停止</td><td><code>Shift+F5</code></td><td>终止调试会话</td></tr></tbody></table>
<h2 id="观察变量">观察变量</h2>
<p>程序暂停时，左侧面板会显示：</p>
<p><strong>变量（Variables）面板</strong></p>
<ul>
<li>自动列出当前作用域内所有变量及其值</li>
<li>可展开结构体、枚举、向量查看内部字段</li>
<li>悬停在代码中的变量名上也会弹出当前值</li>
</ul>
<p><strong>监视（Watch）面板</strong></p>
<ul>
<li>手动添加你想持续观察的表达式</li>
<li>程序每次暂停都会重新计算这些表达式的值</li>
<li>右键添加，或在变量面板右键 → “添加到监视”</li>
</ul>
<p><strong>调用堆栈（Call Stack）面板</strong></p>
<ul>
<li>显示当前的函数调用链</li>
<li>点击某一帧可以跳转到对应的代码位置，查看那一帧的局部变量</li>
</ul>
<h2 id="实际调试示例">实际调试示例</h2>
<p>假设有以下代码，<code>sum_squares</code> 函数的结果不对：</p>
<div class="code-runner" data-full-code="fn%20sum_squares(nums%3A%20%26%5Bi32%5D)%20-%3E%20i32%20%7B%0A%20%20%20%20let%20mut%20total%20%3D%200%3B%0A%20%20%20%20for%20%26n%20in%20nums%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E5%9C%A8%E8%BF%99%E8%A1%8C%E8%AE%BE%E6%96%AD%E7%82%B9%EF%BC%8C%E8%A7%82%E5%AF%9F%E6%AF%8F%E8%BD%AE%E7%9A%84%20n%20%E5%92%8C%20total%0A%20%20%20%20%20%20%20%20total%20%2B%3D%20n%3B%20%20%2F%2F%20BUG%EF%BC%9A%E5%BF%98%E8%AE%B0%E5%B9%B3%E6%96%B9%E4%BA%86%0A%20%20%20%20%7D%0A%20%20%20%20total%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20data%20%3D%20vec!%5B1%2C%202%2C%203%2C%204%5D%3B%0A%20%20%20%20let%20result%20%3D%20sum_squares(%26data)%3B%0A%20%20%20%20println!(%22sum%20of%20squares%20%3D%20%7B%7D%22%2C%20result)%3B%20%20%2F%2F%20%E6%9C%9F%E6%9C%9B%2030%EF%BC%8C%E5%AE%9E%E9%99%85%2010%0A%7D" data-mode="run"><pre><code class="language-rust">fn sum_squares(nums: &amp;[i32]) -&gt; i32 {
    let mut total = 0;
    for &amp;n in nums {
        // 在这行设断点，观察每轮的 n 和 total
        total += n;  // BUG：忘记平方了
    }
    total
}

fn main() {
    let data = vec![1, 2, 3, 4];
    let result = sum_squares(&amp;data);
    println!("sum of squares = {}", result);  // 期望 30，实际 10
}</code></pre></div>
<p>调试步骤：</p>
<ol>
<li>在 <code>total += n;</code> 这行设断点</li>
<li>按 <code>F5</code> 启动调试</li>
<li>程序第一次暂停时，Variables 面板显示 <code>n = 1</code>，<code>total = 0</code></li>
<li>按 <code>F10</code> 单步跳过，查看 <code>total</code> 变为 1</li>
<li>继续按 <code>F5</code> 到下一轮循环，发现 <code>n</code> 是原始值而非平方值</li>
<li>定位 bug：<code>n</code> 没有被平方</li>
</ol>
<h2 id="调试测试函数">调试测试函数</h2>
<p>如果要调试 <code>#[test]</code> 函数，<code>launch.json</code> 里的 <code>cargo.args</code> 改为：</p>
<pre><code class="language-json">{
    "type": "lldb",
    "request": "launch",
    "name": "Debug unit tests",
    "cargo": {
        "args": [
            "test",
            "--no-run",
            "--lib"
        ]
    },
    "args": ["test_function_name"],  // 指定要运行的测试函数名
    "cwd": "${workspaceFolder}"
}</code></pre>
<p>或者，在 VS Code 里找到测试函数上方出现的 <code>Run Test | Debug Test</code> 代码镜头（CodeLens），直接点”Debug Test”——这是最方便的方式，不需要手动配置。</p>
<blockquote>
<p><strong>rust-analyzer 的 CodeLens 功能</strong>：安装 rust-analyzer 后，<code>#[test]</code> 函数和 <code>fn main()</code> 上方会自动显示 <code>▶ Run | Debug</code> 链接，点击即可一键调试，无需手动管理 launch.json。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="ide-调试测验">IDE 调试测验</h2>
</div>
</div>
</div>
</div>
</div> 