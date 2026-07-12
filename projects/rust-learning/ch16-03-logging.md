---
title: "日志输出（log + env_logger）"
description: "调试 - 日志输出（log + env_logger）"
date: "2026-07-12"
order: 16003
tags: ["log", "env_logger", "日志", "日志级别", "tracing"]
est_time: "25 分钟"
---

 <h1 id="为什么需要日志">为什么需要日志</h1>
<h2 id="println-的局限">println! 的局限</h2>
<p><code>dbg!</code> 和 <code>println!</code> 适合开发期的临时调试，但有几个明显的局限：</p>
<ol>
<li><strong>无法分级</strong>：你没法说”这条消息是警告，那条是调试信息”</li>
<li><strong>无法过滤</strong>：不需要的时候必须手动删，需要的时候再手动加回来</li>
<li><strong>不适合库代码</strong>：库的使用者不想看到你的调试输出</li>
<li><strong>格式固定</strong>：无法输出带时间戳、带模块名的结构化日志</li>
</ol>
<p>日志系统解决了这些问题。Rust 生态有一个广泛采用的日志<strong>门面</strong>（Facade）—— <a href="https://crates.io/crates/log"><code>log</code></a> crate，它只定义接口，不绑定具体输出方式。程序中用 <code>log</code> 的宏写日志，运行时插入一个<strong>日志实现</strong>（如 <code>env_logger</code>）来决定怎么输出。</p>
<p>类比：USB 是接口标准，具体的 U 盘品牌是实现。你买了 <code>log</code> 的”USB 接口”，可以随时换不同的”U 盘”（日志后端），代码不需要改。</p>
<h2 id="日志级别">日志级别</h2>
<p><code>log</code> 定义了五个级别，从最详细到最严重：</p>
<table><thead><tr><th>级别</th><th>宏</th><th>用途</th></tr></thead><tbody><tr><td><code>TRACE</code></td><td><code>trace!()</code></td><td>极细粒度的追踪信息，通常不在生产环境开启</td></tr><tr><td><code>DEBUG</code></td><td><code>debug!()</code></td><td>开发调试信息，生产环境通常关闭</td></tr><tr><td><code>INFO</code></td><td><code>info!()</code></td><td>常规运行信息（启动、完成、重要事件）</td></tr><tr><td><code>WARN</code></td><td><code>warn!()</code></td><td>警告，程序还能运行但有潜在问题</td></tr><tr><td><code>ERROR</code></td><td><code>error!()</code></td><td>错误，某个操作失败（但程序可能继续运行）</td></tr></tbody></table>
<p>级别越高（ERROR 最高），越重要。生产环境一般只输出 <code>INFO</code> 及以上级别。</p>
<h2 id="添加依赖">添加依赖</h2>
<p>在 <code>Cargo.toml</code> 中添加：</p>
<pre><code class="language-toml">[dependencies]
log = "0.4"
env_logger = "0.11"</code></pre>
<p><code>log</code> 是接口，<code>env_logger</code> 是开发和测试常用的简单实现（读取 <code>RUST_LOG</code> 环境变量来配置输出）。</p>
<h1 id="env_logger-实战">env_logger 实战</h1>
<h2 id="初始化与基本使用">初始化与基本使用</h2>
<p>在 <code>main</code> 函数的<strong>最开始</strong>调用 <code>env_logger::init()</code> 来初始化日志系统，然后就可以用 <code>log</code> 的宏了：</p>
<div class="code-runner" data-full-code="use%20log%3A%3A%7Btrace%2C%20debug%2C%20info%2C%20warn%2C%20error%7D%3B%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E5%88%9D%E5%A7%8B%E5%8C%96%20env_logger%EF%BC%8C%E8%AF%BB%E5%8F%96%20RUST_LOG%20%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%0A%20%20%20%20env_logger%3A%3Ainit()%3B%0A%0A%20%20%20%20trace!(%22%E8%B6%85%E8%AF%A6%E7%BB%86%E7%9A%84%E8%BF%BD%E8%B8%AA%E4%BF%A1%E6%81%AF%EF%BC%9A%7B%7D%22%2C%2042)%3B%0A%20%20%20%20debug!(%22%E8%B0%83%E8%AF%95%E4%BF%A1%E6%81%AF%EF%BC%9A%E6%AD%A3%E5%9C%A8%E5%A4%84%E7%90%86%E8%AF%B7%E6%B1%82%22)%3B%0A%20%20%20%20info!(%22%E6%9C%8D%E5%8A%A1%E5%99%A8%E5%90%AF%E5%8A%A8%EF%BC%8C%E7%9B%91%E5%90%AC%E7%AB%AF%E5%8F%A3%20%7B%7D%22%2C%208080)%3B%0A%20%20%20%20warn!(%22%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E4%B8%AD%E6%9C%AA%E6%89%BE%E5%88%B0%E8%B6%85%E6%97%B6%E8%AE%BE%E7%BD%AE%EF%BC%8C%E4%BD%BF%E7%94%A8%E9%BB%98%E8%AE%A4%E5%80%BC%2030s%22)%3B%0A%20%20%20%20error!(%22%E6%95%B0%E6%8D%AE%E5%BA%93%E8%BF%9E%E6%8E%A5%E5%A4%B1%E8%B4%A5%EF%BC%9A%7B%7D%22%2C%20%22connection%20refused%22)%3B%0A%7D" data-has-hidden="true" data-mode="run"><pre><code class="language-rust">fn main() {
    // 初始化 env_logger，读取 RUST_LOG 环境变量
    env_logger::init();

    trace!("超详细的追踪信息：{}", 42);
    debug!("调试信息：正在处理请求");
    info!("服务器启动，监听端口 {}", 8080);
    warn!("配置文件中未找到超时设置，使用默认值 30s");
    error!("数据库连接失败：{}", "connection refused");
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">use</span><span style="color:#B392F0"> log</span><span style="color:#F97583">::</span><span style="color:#E1E4E8">{trace, debug, info, warn, error};</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {</span></span>
<span class="line"><span style="color:#6A737D">    // 初始化 env_logger，读取 RUST_LOG 环境变量</span></span>
<span class="line"><span style="color:#B392F0">    env_logger</span><span style="color:#F97583">::</span><span style="color:#B392F0">init</span><span style="color:#E1E4E8">();</span></span>

<span class="line"><span style="color:#B392F0">    trace!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"超详细的追踪信息：{}"</span><span style="color:#E1E4E8">, </span><span style="color:#79B8FF">42</span><span style="color:#E1E4E8">);</span></span>
<span class="line"><span style="color:#B392F0">    debug!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"调试信息：正在处理请求"</span><span style="color:#E1E4E8">);</span></span>
<span class="line"><span style="color:#B392F0">    info!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"服务器启动，监听端口 {}"</span><span style="color:#E1E4E8">, </span><span style="color:#79B8FF">8080</span><span style="color:#E1E4E8">);</span></span>
<span class="line"><span style="color:#B392F0">    warn!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"配置文件中未找到超时设置，使用默认值 30s"</span><span style="color:#E1E4E8">);</span></span>
<span class="line"><span style="color:#B392F0">    error!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"数据库连接失败：{}"</span><span style="color:#E1E4E8">, </span><span style="color:#9ECBFF">"connection refused"</span><span style="color:#E1E4E8">);</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></div></div>
<p>直接 <code>cargo run</code>，你会发现<strong>没有任何输出</strong>。这是正常的——默认情况下 <code>env_logger</code> 不输出任何内容，需要通过 <code>RUST_LOG</code> 环境变量指定要显示的级别。</p>
<h2 id="rust_log-环境变量">RUST_LOG 环境变量</h2>
<p><code>RUST_LOG</code> 是控制 env_logger 输出的核心变量：</p>
<pre><code class="language-bash"># 显示 INFO 及以上（INFO、WARN、ERROR）
RUST_LOG=info cargo run

# 显示所有级别（包括 TRACE、DEBUG）
RUST_LOG=trace cargo run

# 只显示 ERROR 级别
RUST_LOG=error cargo run</code></pre>
<p>开启 <code>RUST_LOG=info</code> 后，上面程序的输出类似：</p>
<pre><code class="language-text">[2026-01-15T10:30:00Z INFO  my_app] 服务器启动，监听端口 8080
[2026-01-15T10:30:00Z WARN  my_app] 配置文件中未找到超时设置，使用默认值 30s
[2026-01-15T10:30:00Z ERROR my_app] 数据库连接失败：connection refused</code></pre>
<p>输出格式：<code>[时间 级别 模块名] 消息</code></p>
<h2 id="按模块过滤">按模块过滤</h2>
<p><code>RUST_LOG</code> 支持精确指定哪些模块的日志要显示：</p>
<pre><code class="language-bash"># 只显示名为 my_app::database 的模块的 DEBUG 及以上日志
RUST_LOG=my_app::database=debug cargo run

# my_app 模块用 debug 级别，其他依赖用 warn 级别
RUST_LOG=warn,my_app=debug cargo run

# 多模块独立控制
RUST_LOG=my_app::http=info,my_app::db=debug cargo run</code></pre>
<p>这种过滤对调试复杂系统非常有用：你可以只打开正在排查的模块的详细日志，而不被其他模块的噪音淹没。</p>
<h2 id="在库中使用日志">在库中使用日志</h2>
<p><code>log</code> 是专门为库设计的门面。<strong>库代码只使用 <code>log</code> 的宏，不调用 <code>env_logger::init()</code></strong>——由使用库的应用程序决定用哪个日志实现：</p>
<div class="code-runner" data-full-code="%2F%2F%20%E8%BF%99%E6%98%AF%E4%B8%80%E4%B8%AA%E5%BA%93%E7%9A%84%E4%BB%A3%E7%A0%81%EF%BC%88lib.rs%EF%BC%89%0Ause%20log%3A%3A%7Bdebug%2C%20info%2C%20warn%7D%3B%0A%0Apub%20fn%20parse_config(path%3A%20%26str)%20-%3E%20Result%3CString%2C%20String%3E%20%7B%0A%20%20%20%20debug!(%22%E5%BC%80%E5%A7%8B%E8%A7%A3%E6%9E%90%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%EF%BC%9A%7B%7D%22%2C%20path)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%A8%A1%E6%8B%9F%E8%AF%BB%E5%8F%96%E9%85%8D%E7%BD%AE%0A%20%20%20%20if%20path.is_empty()%20%7B%0A%20%20%20%20%20%20%20%20warn!(%22%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E8%B7%AF%E5%BE%84%E4%B8%BA%E7%A9%BA%EF%BC%8C%E4%BD%BF%E7%94%A8%E9%BB%98%E8%AE%A4%E9%85%8D%E7%BD%AE%22)%3B%0A%20%20%20%20%20%20%20%20return%20Ok(%22default%22.to_string())%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20info!(%22%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E8%A7%A3%E6%9E%90%E6%88%90%E5%8A%9F%22)%3B%0A%20%20%20%20Ok(%22config%20content%22.to_string())%0A%7D" data-mode="run"><pre><code class="language-rust">// 这是一个库的代码（lib.rs）
use log::{debug, info, warn};

pub fn parse_config(path: &amp;str) -&gt; Result&lt;String, String&gt; {
    debug!("开始解析配置文件：{}", path);

    // 模拟读取配置
    if path.is_empty() {
        warn!("配置文件路径为空，使用默认配置");
        return Ok("default".to_string());
    }

    info!("配置文件解析成功");
    Ok("config content".to_string())
}</code></pre></div>
<p>库不调用 <code>env_logger::init()</code>，这样库的使用者可以自由选择 <code>env_logger</code>、<code>tracing</code>、<code>fern</code> 等任意日志后端。</p>
<blockquote>
<p><strong>注意</strong>：如果你同时在库和应用里都调用了 <code>env_logger::init()</code>，会触发运行时 panic（日志系统只能初始化一次）。库里永远不要调用 <code>init()</code>。</p>
</blockquote>
<h2 id="在测试中查看日志">在测试中查看日志</h2>
<p>单元测试默认会捕获 stdout，但 <code>env_logger</code> 输出到 stderr。要在测试中查看日志，可以这样初始化：</p>
<div class="code-runner" data-full-code="%23%5Bcfg(test)%5D%0Amod%20tests%20%7B%0A%20%20%20%20use%20super%3A%3A*%3B%0A%0A%20%20%20%20fn%20init_logger()%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20try_init%20%E5%9C%A8%E5%B7%B2%E5%88%9D%E5%A7%8B%E5%8C%96%E6%97%B6%E4%B8%8D%E6%8A%A5%E9%94%99%EF%BC%88%E6%B5%8B%E8%AF%95%E4%BC%9A%E5%A4%9A%E6%AC%A1%E8%B0%83%E7%94%A8%EF%BC%89%0A%20%20%20%20%20%20%20%20let%20_%20%3D%20env_logger%3A%3Abuilder()%0A%20%20%20%20%20%20%20%20%20%20%20%20.is_test(true)%20%20%20%20%20%20%20%2F%2F%20%E8%AE%A9%E6%97%A5%E5%BF%97%E8%B5%B0%20test%20%E7%9A%84%E8%BE%93%E5%87%BA%E6%9C%BA%E5%88%B6%0A%20%20%20%20%20%20%20%20%20%20%20%20.try_init()%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20%23%5Btest%5D%0A%20%20%20%20fn%20test_with_logging()%20%7B%0A%20%20%20%20%20%20%20%20init_logger()%3B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E8%AE%BE%E7%BD%AE%20RUST_LOG%3Ddebug%20cargo%20test%20%E5%8D%B3%E5%8F%AF%E7%9C%8B%E5%88%B0%E6%B5%8B%E8%AF%95%E4%B8%AD%E7%9A%84%E6%97%A5%E5%BF%97%0A%20%20%20%20%20%20%20%20log%3A%3Adebug!(%22%E6%B5%8B%E8%AF%95%E5%BC%80%E5%A7%8B%22)%3B%0A%20%20%20%20%20%20%20%20assert_eq!(2%20%2B%202%2C%204)%3B%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[cfg(test)]
mod tests {
    use super::*;

    fn init_logger() {
        // try_init 在已初始化时不报错（测试会多次调用）
        let _ = env_logger::builder()
            .is_test(true)       // 让日志走 test 的输出机制
            .try_init();
    }

    #[test]
    fn test_with_logging() {
        init_logger();
        // 设置 RUST_LOG=debug cargo test 即可看到测试中的日志
        log::debug!("测试开始");
        assert_eq!(2 + 2, 4);
    }
}</code></pre></div>
<h2 id="日志格式定制">日志格式定制</h2>
<p><code>env_logger</code> 的 Builder API 支持自定义输出格式：</p>
<div class="code-runner" data-full-code="use%20log%3A%3Ainfo%3B%0Afn%20main()%20%7B%0A%20%20%20%20env_logger%3A%3ABuilder%3A%3Afrom_default_env()%0A%20%20%20%20%20%20%20%20.format_timestamp_secs()%20%20%20%2F%2F%20%E6%97%B6%E9%97%B4%E6%88%B3%E7%B2%BE%E5%BA%A6%E5%88%B0%E7%A7%92%EF%BC%88%E9%BB%98%E8%AE%A4%E6%98%AF%E6%AF%AB%E7%A7%92%EF%BC%89%0A%20%20%20%20%20%20%20%20.format_module_path(false)%20%2F%2F%20%E4%B8%8D%E6%98%BE%E7%A4%BA%E6%A8%A1%E5%9D%97%E8%B7%AF%E5%BE%84%0A%20%20%20%20%20%20%20%20.init()%3B%0A%0A%20%20%20%20info!(%22%E6%A0%BC%E5%BC%8F%E6%9B%B4%E7%AE%80%E6%B4%81%E7%9A%84%E6%97%A5%E5%BF%97%22)%3B%0A%7D" data-has-hidden="true" data-mode="run"><pre><code class="language-rust">fn main() {
    env_logger::Builder::from_default_env()
        .format_timestamp_secs()   // 时间戳精度到秒（默认是毫秒）
        .format_module_path(false) // 不显示模块路径
        .init();

    info!("格式更简洁的日志");
}</code></pre><div aria-hidden="true" class="code-runner-full-hl" hidden=""><span class="line"><span style="color:#F97583">use</span><span style="color:#B392F0"> log</span><span style="color:#F97583">::</span><span style="color:#E1E4E8">info;</span></span>
<span class="line"><span style="color:#F97583">fn</span><span style="color:#B392F0"> main</span><span style="color:#E1E4E8">() {</span></span>
<span class="line"><span style="color:#B392F0">    env_logger</span><span style="color:#F97583">::</span><span style="color:#B392F0">Builder</span><span style="color:#F97583">::</span><span style="color:#B392F0">from_default_env</span><span style="color:#E1E4E8">()</span></span>
<span class="line"><span style="color:#F97583">        .</span><span style="color:#B392F0">format_timestamp_secs</span><span style="color:#E1E4E8">()   </span><span style="color:#6A737D">// 时间戳精度到秒（默认是毫秒）</span></span>
<span class="line"><span style="color:#F97583">        .</span><span style="color:#B392F0">format_module_path</span><span style="color:#E1E4E8">(</span><span style="color:#79B8FF">false</span><span style="color:#E1E4E8">) </span><span style="color:#6A737D">// 不显示模块路径</span></span>
<span class="line"><span style="color:#F97583">        .</span><span style="color:#B392F0">init</span><span style="color:#E1E4E8">();</span></span>

<span class="line"><span style="color:#B392F0">    info!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"格式更简洁的日志"</span><span style="color:#E1E4E8">);</span></span>
<span class="line"><span style="color:#E1E4E8">}</span></span></div></div>
<p>对于生产级别的日志需求（结构化 JSON 输出、异步日志、分布式追踪），可以考虑 <a href="https://crates.io/crates/tracing"><code>tracing</code></a> 生态——它是 <code>log</code> 的超集，额外支持 span（时间段追踪）概念，在异步程序中特别有用。</p>
<h1 id="练习题">练习题</h1>
<h2 id="日志系统测验">日志系统测验</h2>
</div>
</div>
</div>
</div> 