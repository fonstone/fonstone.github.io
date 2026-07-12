---
title: "安装 Rust"
description: "Rust 基础 - 安装 Rust"
date: "2026-07-12"
order: 1001
tags: ["rustup", "安装", "工具链", "cargo", "rustc", "环境配置"]
est_time: "10 分钟"
---

 <h1 id="了解-rustup">了解 rustup</h1>
<h2 id="什么是-rustup">什么是 rustup</h2>
<p>安装 Rust 的官方推荐方式是 <strong>rustup</strong>——它不只是一个安装程序，而是 Rust 的<strong>版本管理器</strong>。</p>
<p>一个类比：rustup 之于 Rust，就像 nvm 之于 Node.js，或者 pyenv 之于 Python。它负责帮你管理 Rust 的版本，而不是让你只能通过系统包管理器装一个固定版本。</p>
<p>你可能会问：为什么不直接装一个固定版本就行？</p>
<p>因为 Rust 发布节奏较快，<strong>每六周发布一次稳定版</strong>。Rust 对向后兼容非常重视（几乎不会破坏已有代码），但新版本通常会带来：</p>
<ul>
<li>更清晰的编译器报错信息（学习期间非常有价值）</li>
<li>新的语言特性和标准库 API</li>
<li>性能和编译速度改进</li>
</ul>
<p>此外，Rust 维护三个发布渠道：</p>
<table><thead><tr><th>渠道</th><th>说明</th><th>适合谁</th></tr></thead><tbody><tr><td><code>stable</code></td><td>每六周发布，经过充分测试</td><td>日常开发，<strong>推荐使用</strong></td></tr><tr><td><code>beta</code></td><td>下一个 stable 的候选版本</td><td>想提前测试兼容性</td></tr><tr><td><code>nightly</code></td><td>每天构建，包含实验性特性</td><td>需要 <code>#![feature(...)]</code> 的高级用法</td></tr></tbody></table>
<p>rustup 让你可以：</p>
<ul>
<li>随时升级到最新稳定版（<code>rustup update</code>）</li>
<li>在不同渠道之间切换（<code>rustup default nightly</code>）</li>
<li>为不同项目指定不同版本（在项目目录放 <code>rust-toolchain.toml</code>）</li>
<li>为嵌入式等目标平台安装交叉编译工具链（<code>rustup target add</code>）</li>
</ul>
<blockquote>
<p>本教程全程使用 <code>stable</code> 渠道，安装时选默认选项即可。</p>
</blockquote>
<h2 id="rustup-安装了什么">rustup 安装了什么</h2>
<p>运行安装脚本后，你会得到：</p>
<table><thead><tr><th>工具</th><th>作用</th></tr></thead><tbody><tr><td><code>rustc</code></td><td>Rust 编译器</td></tr><tr><td><code>cargo</code></td><td>包管理器 + 构建工具（最常用的命令）</td></tr><tr><td><code>rustup</code></td><td>版本管理器本身</td></tr><tr><td><code>rustfmt</code></td><td>代码格式化工具</td></tr><tr><td><code>clippy</code></td><td>代码检查（lint）工具</td></tr><tr><td><code>rust-analyzer</code></td><td>LSP 服务器（IDE 代码补全的基础）</td></tr></tbody></table>
<p>日常开发中，你打交道最多的是 <code>cargo</code>和<code>rust-analyzer</code>，<code>rustc</code> 通常不需要直接调用。</p>
<h2 id="rustup-的日常使用">rustup 的日常使用</h2>
<table><thead><tr><th>命令</th><th>作用</th></tr></thead><tbody><tr><td><code>rustup update</code></td><td>升级 Rust 到最新稳定版</td></tr><tr><td><code>rustup show</code></td><td>查看当前安装的工具链信息</td></tr><tr><td><code>rustup doc</code></td><td>在浏览器打开本地离线的 Rust 官方英文文档</td></tr><tr><td><code>rustup self uninstall</code></td><td>完全卸载 Rust 和 rustup</td></tr></tbody></table>
<p><strong>建议定期运行 <code>rustup update</code></strong>——Rust 每六周发布新版本，新版本通常会改进编译器的报错信息，学习期间能看到更清晰的提示。</p>
<h1 id="安装步骤">安装步骤</h1>
<h2 id="macos--linux-安装">macOS / Linux 安装</h2>
<p>打开终端，运行：</p>
<pre><code class="language-bash">curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh</code></pre>
<p>安装脚本会引导你完成安装，选择默认选项（按回车）即可。安装成功后会出现：</p>
<pre><code class="language-text">Rust is installed now. Great!</code></pre>
<p>安装完成后，<strong>重新打开终端</strong>，或者手动加载环境变量：</p>
<pre><code class="language-bash">source "$HOME/.cargo/env"</code></pre>
<h3 id="macos安装链接器">macOS：安装链接器</h3>
<p>Rust 编译输出需要一个<strong>链接器</strong>把目标文件合并成可执行文件。macOS 上最简单的获取方式是安装 Xcode 命令行工具：</p>
<pre><code class="language-bash">xcode-select --install</code></pre>
<p>如果你已经安装了完整的 Xcode 或 Homebrew，通常已经自带链接器，可以跳过这一步。</p>
<h3 id="linux安装链接器">Linux：安装链接器</h3>
<p>Linux 用户需要安装 C 编译器（包含链接器）。以 Ubuntu / Debian 为例：</p>
<pre><code class="language-bash">sudo apt-get install build-essential</code></pre>
<p>Fedora / RHEL 系：</p>
<pre><code class="language-bash">sudo dnf install gcc</code></pre>
<blockquote>
<p><strong>为什么 Rust 需要 C 链接器？</strong> Rust 的标准库和部分 crate 在最终链接阶段依赖系统的 C 链接器（<code>ld</code>）。这不是 Rust 的缺陷，而是和操作系统 ABI 集成的必要步骤。</p>
</blockquote>
<h2 id="windows-安装">Windows 安装</h2>
<p>访问 <a href="https://rustup.rs">https://rustup.rs</a> 下载 <code>rustup-init.exe</code> 并运行。</p>
<h3 id="windows-需要-c-构建工具">Windows 需要 C++ 构建工具</h3>
<p>Windows 上的 Rust 默认使用 MSVC 工具链，这需要 <strong>Visual Studio C++ 构建工具</strong>。安装向导会自动提示你，选择以下组件：</p>
<ul>
<li><strong>C++ 桌面开发</strong>（Desktop development with C++）</li>
<li>Windows 10/11 SDK</li>
<li>MSVC 编译器组件</li>
</ul>
<p>如果不想安装 Visual Studio，可以改用 GNU 工具链（<code>x86_64-pc-windows-gnu</code>），但建议初学者使用默认的 MSVC 工具链——兼容性更好，报错信息更清晰。</p>
<blockquote>
<p><strong>需要多少空间？</strong> Visual Studio 构建工具约需 3-5 GB 磁盘空间。如果磁盘紧张，可以在安装时只选择最小必要组件。</p>
</blockquote>
<p>安装完成后打开新终端（命令提示符或 PowerShell），使环境变量生效。</p>
<h2 id="验证安装是否成功">验证安装是否成功</h2>
<p>在终端中运行：</p>
<pre><code class="language-bash">rustc --version</code></pre>
<p>正常输出类似：</p>
<pre><code class="language-text">rustc 1.79.0 (129f3b996 2024-06-10)</code></pre>
<p>再验证 Cargo：</p>
<pre><code class="language-bash">cargo --version</code></pre>
<p>输出类似：</p>
<pre><code class="language-text">cargo 1.79.0 (ffa9cf99a 2024-06-03)</code></pre>
<p>两个命令都有输出就说明安装成功。</p>
<h2 id="常见问题命令找不到">常见问题：命令找不到</h2>
<p><strong>macOS / Linux</strong>：如果提示 <code>command not found</code>，说明环境变量没有生效。运行：</p>
<pre><code class="language-bash">source "$HOME/.cargo/env"</code></pre>
<p>然后把这行加到你的 <code>~/.bashrc</code> 或 <code>~/.zshrc</code> 末尾，以后打开终端就自动生效。</p>
<p><strong>Windows</strong>：如果提示找不到命令，检查 <code>%USERPROFILE%\.cargo\bin</code> 是否在系统的 <code>PATH</code> 环境变量中。rustup 安装时通常会自动添加，但需要重新打开终端才能生效。</p> 