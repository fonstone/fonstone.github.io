---
title: "Rust 工程架构设计"
description: "编程方法论 - Rust 工程架构设计"
date: "2026-07-12"
order: 17001
tags: ["架构", "项目结构", "模块化", "分层架构"]
est_time: "30 分钟"
---

 <h2 id="为什么-rust-工程需要提前规划">为什么 Rust 工程需要提前规划</h2>
<p>写小脚本时，代码结构并不重要。但随着项目规模增长，“想到哪写到哪”会快速积累问题：</p>
<ul>
<li>模块之间依赖关系复杂，改一处牵一发动全身</li>
<li>公共逻辑散落各处，难以复用</li>
<li>接口不稳定，测试难以编写</li>
<li>新成员难以理解代码意图</li>
</ul>
<p>Rust 的类型系统和所有权机制在<strong>微观层面</strong>帮你避免内存 bug，但<strong>宏观层面</strong>的模块设计、依赖方向、接口边界，还是需要人来决策。好的架构设计能让 Rust 的编译期保证从函数级别延伸到整个系统。</p>
<blockquote>
<p>架构设计不是一次性的 — 它会随着需求演进而迭代。但在项目初期花时间认真思考结构，能节省后期数倍乃至数十倍的重构时间。</p>
</blockquote>
<h2 id="从需求到模块划分">从需求到模块划分</h2>
<p><strong>第一步：列出系统需要做的事</strong></p>
<p>把需求拆解成动词短语（“解析配置”、“执行 HTTP 请求”、“持久化到数据库”）。每一个独立的”做什么”往往对应一个模块的核心职责。</p>
<p><strong>第二步：按变化频率分组</strong></p>
<p>把这些能力按”哪些会一起变化、哪些变化互不影响”分组。会一起变化的功能放同一个模块，独立变化的拆分开。</p>
<p>例如，一个命令行工具的职责分组可能是：</p>
<pre><code class="language-text">cli/        ← 解析命令行参数（输入层，随 UX 变）
config/     ← 读取配置文件（配置格式变时只改这里）
core/       ← 核心业务逻辑（最稳定，测试最密集）
output/     ← 格式化输出（输出格式变时只改这里）</code></pre>
<p><strong>第三步：画出模块间的依赖箭头</strong></p>
<p>用一张简单的有向图标记哪个模块依赖哪个模块。<strong>箭头不能形成环</strong>——循环依赖是架构腐化的早期信号。</p>
<p>好的依赖方向通常是：<code>入口层 → 业务层 → 基础设施层</code>，箭头指向稳定性更高的方向。</p>
<h2 id="定义公共接口trait-先行">定义公共接口（Trait 先行）</h2>
<p>Rust 工程架构的核心习惯：<strong>先写 Trait，后写实现</strong>。</p>
<p>Trait 定义了模块之间的”契约”——你的模块对外承诺提供什么能力，调用方只需要知道这个契约，不关心内部如何实现。</p>
<p><strong>Trait 先行的流程：</strong></p>
<ol>
<li>确定模块边界后，为每个模块的对外能力抽象出一个或几个 Trait</li>
<li>在 Trait 里只写方法签名，不写实现</li>
<li>用这些 Trait 编写调用方的逻辑（此时实现还不存在也没关系，甚至可以用 <code>todo!()</code> 占位）</li>
<li>最后再实现 Trait 的具体逻辑</li>
</ol>
<p>这个顺序的好处是：</p>
<ul>
<li><strong>接口设计由使用方驱动</strong>，而不是由实现方驱动，更贴近真实需求</li>
<li>调用方代码可以针对 Trait 编写，<strong>依赖注入</strong> 和<strong>测试替换</strong>变得自然</li>
<li>多个实现（如生产环境用真实数据库、测试用内存 mock）可以无缝切换</li>
</ul>
<blockquote>
<p>如果你发现 Trait 方法数量急剧增长（超过 5-7 个），通常说明这个 Trait 承担了太多职责，需要拆分。</p>
</blockquote>
<h2 id="cargo-workspace-结构规划">Cargo Workspace 结构规划</h2>
<p>当项目规模较大时，把所有代码塞进一个 crate 会导致编译时间长、模块边界模糊。<strong>Cargo Workspace</strong> 允许你把项目拆成多个 crate，各自独立编译，但共享同一个 <code>Cargo.lock</code> 和构建缓存。</p>
<p><strong>典型的 Workspace 布局：</strong></p>
<pre><code class="language-text">my-project/
├── Cargo.toml          ← workspace 根配置（只列 members，不写代码）
├── crates/
│   ├── core/           ← 核心库，零依赖或最少依赖，最稳定
│   │   └── Cargo.toml
│   ├── cli/            ← 命令行入口，依赖 core
│   │   └── Cargo.toml
│   ├── server/         ← HTTP 服务入口，依赖 core
│   │   └── Cargo.toml
│   └── common/         ← 跨 crate 共享的类型、工具函数
│       └── Cargo.toml
└── tests/              ← 集成测试（可访问所有 crate 的公开接口）</code></pre>
<p><strong>什么时候拆 crate：</strong></p>
<ul>
<li>核心逻辑有多个不同的入口（CLI + HTTP + WebAssembly）→ 核心单独一个 crate</li>
<li>某个功能需要完全不同的依赖集 → 隔离依赖，避免污染其他 crate</li>
<li>团队不同人负责不同部分，需要独立发布 → 各自维护版本</li>
</ul>
<p><strong>什么时候不要过度拆分：</strong></p>
<ul>
<li>项目规模小（&lt;5000 行代码）</li>
<li>团队只有 1-2 人</li>
<li>功能还在高速变化，边界不稳定</li>
</ul>
<blockquote>
<p><strong>经验法则</strong>：先用单 crate 快速验证，等边界清晰、代码稳定后再迁移到 Workspace。过早拆分带来的协调成本往往大于好处。</p>
</blockquote>
<h2 id="关于-unsafe-的架构决策">关于 unsafe 的架构决策</h2>
<p>Rust 的 <code>unsafe</code> 块允许你做编译器无法验证安全性的操作（裸指针、FFI 调用、手动内存管理等）。但 unsafe 引入的风险需要在架构层面控制好，而不是散落在代码各处。</p>
<p><strong>核心原则：把 unsafe 封装在最小边界内，对外只暴露安全接口。</strong></p>
<p>常见的做法：</p>
<ul>
<li>把所有 unsafe 操作集中在一个独立的私有模块（如 <code>mod raw</code>），该模块的公开 API 全部是 safe 的</li>
<li>在不需要 unsafe 的模块顶部加 <code>#![forbid(unsafe_code)]</code>，让编译器强制保障</li>
<li>为每个 unsafe 块写注释，说明<strong>为什么这里是安全的</strong>（不变式是什么）</li>
</ul>
<p><strong>架构中 unsafe 的合理使用场景：</strong></p>
<table><thead><tr><th>场景</th><th>说明</th></tr></thead><tbody><tr><td>FFI 调用 C 库</td><td>封装在专用的 <code>ffi</code> 模块，对外提供 safe 包装</td></tr><tr><td>高性能数据结构</td><td>如自定义 Vec，核心 unsafe 逻辑集中，公开接口全 safe</td></tr><tr><td>平台特定 IO</td><td>操作系统 syscall，封装后外部无感知</td></tr></tbody></table>
<p><strong>应该避免的做法：</strong></p>
<ul>
<li>在业务逻辑层散落 unsafe 块（说明抽象没有做好）</li>
<li>unsafe 块没有注释说明安全前提（留下隐患，无法审计）</li>
<li>用 unsafe 绕过借用检查”图省事”（这是 bug 的温床）</li>
</ul>
<blockquote>
<p>一个好的架构应该让 unsafe 代码的范围<strong>一目了然且尽可能小</strong>。审计时只需要重点检查这些边界，不需要扫描整个代码库。</p>
</blockquote>
<h2 id="小结架构自查清单">小结：架构自查清单</h2>
<p>在开始写代码之前，对照下面的清单做一次快速检查：</p>
<ul class="contains-task-list">
<li class="task-list-item"><input disabled="" type="checkbox"/> 是否列出了系统的所有核心职责并分组成模块？</li>
<li class="task-list-item"><input disabled="" type="checkbox"/> 是否画出了模块间的依赖图，确认没有循环依赖？</li>
<li class="task-list-item"><input disabled="" type="checkbox"/> 每个模块是否用 Trait 定义了对外接口？</li>
<li class="task-list-item"><input disabled="" type="checkbox"/> 核心逻辑是否可以不依赖具体的 IO 实现而被单独测试？</li>
<li class="task-list-item"><input disabled="" type="checkbox"/> 是否确定了 Workspace 划分策略（单 crate 或多 crate）？</li>
<li class="task-list-item"><input disabled="" type="checkbox"/> unsafe 代码是否被封装在最小边界，每处都有安全注释？</li>
</ul>
<blockquote>
<p>不需要一次把所有问题都回答完美。架构是活的文档，随着你对问题域的理解加深，它会不断演进。重要的是养成<strong>显式思考</strong>的习惯，而不是让结构”自然生长”成一团乱麻。</p>
</blockquote> 