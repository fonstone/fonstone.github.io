---
title: "模块与可见性"
description: "模块系统 - 模块与可见性"
date: "2026-07-12"
order: 7002
tags: ["模块", "mod", "pub", "可见性", "私有性", "模块树", "封装"]
est_time: "35 分钟"
---

 <h1 id="模块介绍">模块介绍</h1>
<h2 id="为什么需要模块">为什么需要模块</h2>
<p>随着代码增长，代码会变得杂乱无序。模块提供了一种<strong>组织和隐藏</strong>代码的方式：</p>
<ul>
<li><strong>组织</strong>：把相关功能分组到一起，提高可读性</li>
<li><strong>隐藏</strong>：控制哪些代码对外部可见，隐藏内部实现细节（封装）</li>
<li><strong>作用域隔离</strong>：防止名称冲突，同一个名字可以在不同模块中存在</li>
</ul>
<p>想象一个餐厅：<strong>前台</strong>（公开，客人可见）和<strong>后台</strong>（私有，只有员工可见）。模块就是这样的概念。</p>
<h2 id="定义模块mod-关键字">定义模块：mod 关键字</h2>
<p>使用 <code>mod</code> 关键字定义一个模块：</p>
<div class="code-runner" data-full-code="mod%20front_of_house%20%7B%0A%20%20%20%20fn%20greet_customer()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E6%AC%A2%E8%BF%8E%E6%9D%A5%E5%88%B0%E6%88%91%E4%BB%AC%E7%9A%84%E9%A4%90%E5%8E%85%EF%BC%81%22)%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81front_of_house%20%E4%B8%AD%E7%9A%84%E5%87%BD%E6%95%B0%E6%98%AF%E7%A7%81%E6%9C%89%E7%9A%84%EF%BC%8C%E6%97%A0%E6%B3%95%E7%9B%B4%E6%8E%A5%E8%B0%83%E7%94%A8%0A%20%20%20%20%2F%2F%20front_of_house%3A%3Agreet_customer()%3B%0A%20%20%20%20println!(%22%E7%A8%8B%E5%BA%8F%E8%BF%90%E8%A1%8C%22)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">mod front_of_house {
    fn greet_customer() {
        println!("欢迎来到我们的餐厅！");
    }
}

fn main() {
    // 错误！front_of_house 中的函数是私有的，无法直接调用
    // front_of_house::greet_customer();
    println!("程序运行");
}</code></pre></div>
<p>模块可以<strong>嵌套</strong>，形成模块树。每个模块里可以包含子模块：</p>
<pre><code class="language-rust">mod restaurant {
    mod front_of_house {
        mod hosting {
            fn add_to_waitlist() {
                println!("已将您添加到等待列表");
            }
        }
    }
}</code></pre>
<h1 id="可见性pub-关键字">可见性：pub 关键字</h1>
<p>默认情况下，模块中的所有项都是<strong>私有的</strong>（private）。私有项只能在本模块和子模块中访问。</p>
<p>要让项对外部可见，需要用 <code>pub</code> 修饰：</p>
<div class="code-runner" data-full-code="mod%20restaurant%20%7B%0A%20%20%20%20%2F%2F%20%E7%A7%81%E6%9C%89%E6%A8%A1%E5%9D%97%EF%BC%88%E5%8F%AA%E8%83%BD%E5%9C%A8%20restaurant%20%E5%86%85%E9%83%A8%E4%BD%BF%E7%94%A8%EF%BC%89%0A%20%20%20%20mod%20back_of_house%20%7B%0A%20%20%20%20%20%20%20%20fn%20prepare_order()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%87%86%E5%A4%87%E8%AE%A2%E5%8D%95...%22)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E5%85%AC%E6%9C%89%E6%A8%A1%E5%9D%97%EF%BC%88%E5%8F%AF%E4%BB%A5%E4%BB%8E%E5%A4%96%E9%83%A8%E8%AE%BF%E9%97%AE%EF%BC%89%0A%20%20%20%20pub%20mod%20front_of_house%20%7B%0A%20%20%20%20%20%20%20%20pub%20fn%20add_to_waitlist()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%B7%B2%E6%B7%BB%E5%8A%A0%E5%88%B0%E7%AD%89%E5%BE%85%E5%88%97%E8%A1%A8%22)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20pub%20fn%20eat_at_restaurant()%20%7B%0A%20%20%20%20%20%20%20%20front_of_house%3A%3Aadd_to_waitlist()%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%AD%A3%E7%A1%AE%EF%BC%81front_of_house%20%E6%98%AF%20pub%EF%BC%8Cadd_to_waitlist%20%E4%B9%9F%E6%98%AF%20pub%0A%20%20%20%20restaurant%3A%3Afront_of_house%3A%3Aadd_to_waitlist()%3B%0A%0A%20%20%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81back_of_house%20%E6%98%AF%E7%A7%81%E6%9C%89%E7%9A%84%0A%20%20%20%20%2F%2F%20restaurant%3A%3Aback_of_house%3A%3Aprepare_order()%3B%0A%7D" data-mode="run"><pre><code class="language-rust">mod restaurant {
    // 私有模块（只能在 restaurant 内部使用）
    mod back_of_house {
        fn prepare_order() {
            println!("准备订单...");
        }
    }

    // 公有模块（可以从外部访问）
    pub mod front_of_house {
        pub fn add_to_waitlist() {
            println!("已添加到等待列表");
        }
    }

    pub fn eat_at_restaurant() {
        front_of_house::add_to_waitlist();
    }
}

fn main() {
    // 正确！front_of_house 是 pub，add_to_waitlist 也是 pub
    restaurant::front_of_house::add_to_waitlist();

    // 错误！back_of_house 是私有的
    // restaurant::back_of_house::prepare_order();
}</code></pre></div>
<h2 id="pub-应用规则">pub 应用规则</h2>
<ul>
<li><strong>模块</strong>：必须标记 <code>pub</code> 才能从外部访问</li>
<li><strong>函数</strong>：必须标记 <code>pub</code> 才能从外部调用</li>
<li><strong>结构体字段</strong>：默认私有，每个字段需要单独标记 <code>pub</code></li>
<li><strong>枚举变体</strong>：如果枚举是 <code>pub</code>，所有变体自动是 <code>pub</code></li>
</ul>
<blockquote>
<p><strong>重要</strong>：<code>pub</code> 关键字控制的是<strong>可见性</strong>（visibility）——“能否看到和访问”。这是独立于以下两个机制的：</p>
<ul>
<li><strong>所有权</strong>（ownership）— “谁拥有这个值”（由之前的所有权系统控制）</li>
<li><strong>可变性</strong>（mutability）— “能否修改这个值”（由 <code>mut</code> 关键字控制）</li>
</ul>
<p>一个字段可以既是 <code>pub</code>（对外可见）又是不可变的（没有 <code>mut</code>）；反之，一个私有字段可以被内部代码通过 <code>mut</code> 修改。</p>
</blockquote>
<h2 id="结构体和枚举的可见性">结构体和枚举的可见性</h2>
<p><strong>结构体的字段需要单独声明为 pub：</strong></p>
<div class="code-runner" data-full-code="mod%20restaurant%20%7B%0A%20%20%20%20pub%20struct%20Breakfast%20%7B%0A%20%20%20%20%20%20%20%20pub%20toast%3A%20String%2C%20%20%20%20%20%20%2F%2F%20%E5%85%AC%E6%9C%89%0A%20%20%20%20%20%20%20%20seasonal_fruit%3A%20String%2C%20%2F%2F%20%E7%A7%81%E6%9C%89%0A%20%20%20%20%7D%0A%0A%20%20%20%20impl%20Breakfast%20%7B%0A%20%20%20%20%20%20%20%20pub%20fn%20new(toast%3A%20%26str)%20-%3E%20Breakfast%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Breakfast%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20toast%3A%20toast.to_string()%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20seasonal_fruit%3A%20%22%E8%8B%B9%E6%9E%9C%22.to_string()%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20mut%20meal%20%3D%20restaurant%3A%3ABreakfast%3A%3Anew(%22%E9%BB%91%E9%BA%A6%E9%9D%A2%E5%8C%85%22)%3B%0A%0A%20%20%20%20%2F%2F%20%E6%AD%A3%E7%A1%AE%EF%BC%81toast%20%E6%98%AF%20pub%0A%20%20%20%20println!(%22%E4%BB%8A%E5%A4%A9%E7%9A%84%E9%9D%A2%E5%8C%85%E6%98%AF%20%7B%7D%22%2C%20meal.toast)%3B%0A%0A%20%20%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%81seasonal_fruit%20%E6%98%AF%E7%A7%81%E6%9C%89%E7%9A%84%0A%20%20%20%20%2F%2F%20println!(%22%E6%B0%B4%E6%9E%9C%E6%98%AF%20%7B%7D%22%2C%20meal.seasonal_fruit)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">mod restaurant {
    pub struct Breakfast {
        pub toast: String,      // 公有
        seasonal_fruit: String, // 私有
    }

    impl Breakfast {
        pub fn new(toast: &amp;str) -&gt; Breakfast {
            Breakfast {
                toast: toast.to_string(),
                seasonal_fruit: "苹果".to_string(),
            }
        }
    }
}

fn main() {
    let mut meal = restaurant::Breakfast::new("黑麦面包");

    // 正确！toast 是 pub
    println!("今天的面包是 {}", meal.toast);

    // 错误！seasonal_fruit 是私有的
    // println!("水果是 {}", meal.seasonal_fruit);
}</code></pre></div>
<blockquote>
<p>结构体中 impl 里的函数也算是结构体的一部分，因此需要单独的 pub（不需要给 impl 加 pub，impl 的公开性同 struct）</p>
</blockquote>
<p><strong>枚举的所有变体自动是 pub（如果枚举本身是 pub）：</strong></p>
<div class="code-runner" data-full-code="mod%20pizza%20%7B%0A%20%20%20%20pub%20enum%20PizzaSize%20%7B%0A%20%20%20%20%20%20%20%20Small%2C%0A%20%20%20%20%20%20%20%20Medium%2C%0A%20%20%20%20%20%20%20%20Large%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E6%89%80%E6%9C%89%E5%8F%98%E4%BD%93%E9%83%BD%E5%8F%AF%E4%BB%A5%E8%AE%BF%E9%97%AE%0A%20%20%20%20let%20_size%20%3D%20pizza%3A%3APizzaSize%3A%3ALarge%3B%0A%7D" data-mode="run"><pre><code class="language-rust">mod pizza {
    pub enum PizzaSize {
        Small,
        Medium,
        Large,
    }
}

fn main() {
    // 所有变体都可以访问
    let _size = pizza::PizzaSize::Large;
}</code></pre></div>
<h1 id="可见性与模块层级">可见性与模块层级</h1>
<h2 id="理论-1路径可达性原则">理论 1：路径可达性原则</h2>
<p>Rust 可见性的本质是<strong>路径可达性</strong>。当你要访问 <code>a::b::c::item</code> 时，不仅 <code>item</code> 要公开，整条路径上的每一步 <code>a</code>、<code>b</code>、<code>c</code> 都必须是可穿过的（即都要标 <code>pub</code>），否则整条路径就断裂了。</p>
<p>想象一个办公楼：</p>
<ul>
<li>楼 A（私有）→ 即使楼内的办公室是开放的，外人也进不去</li>
<li>楼 A（公开）→ 但对应楼层是私有的 → 外人也进不了那层</li>
<li>楼 A（公开）→ 楼层（公开）→ 办公室（私有）→ 外人还是进不了办公室</li>
</ul>
<p><strong>结论</strong>：父模块是私有的，就像给整栋楼上了锁，子模块内的任何 <code>pub</code> 项都无法从外部访问。</p>
<div class="code-runner" data-full-code="mod%20parent%20%7B%0A%20%20%20%20mod%20child%20%7B%0A%20%20%20%20%20%20%20%20pub%20fn%20public_function()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E6%88%91%E6%98%AF%20pub%20%E7%9A%84%22)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20%2F%2F%20%E2%9D%8C%20%E5%8D%B3%E4%BD%BF%E5%87%BD%E6%95%B0%E6%98%AF%20pub%EF%BC%8C%E4%BD%86%20parent%20%E6%98%AF%E7%A7%81%E6%9C%89%E7%9A%84%EF%BC%8C%E5%A4%96%E9%83%A8%E6%97%A0%E6%B3%95%E7%A9%BF%E8%BF%87%0A%20%20%20%20parent%3A%3Achild%3A%3Apublic_function()%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">mod parent {
    mod child {
        pub fn public_function() {
            println!("我是 pub 的");
        }
    }
}

fn main() {
    // ❌ 即使函数是 pub，但 parent 是私有的，外部无法穿过
    parent::child::public_function();
}</code></pre></div>
<p>修复：让父模块也标为 <code>pub</code></p>
<div class="code-runner" data-full-code="pub%20mod%20parent%20%7B%0A%20%20%20%20pub%20mod%20child%20%7B%0A%20%20%20%20%20%20%20%20pub%20fn%20public_function()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E7%8E%B0%E5%9C%A8%E5%8F%AF%E4%BB%A5%E8%AE%BF%E9%97%AE%E4%BA%86%22)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20parent%3A%3Achild%3A%3Apublic_function()%3B%20%20%2F%2F%20%E2%9C%85%0A%7D" data-mode="run"><pre><code class="language-rust">pub mod parent {
    pub mod child {
        pub fn public_function() {
            println!("现在可以访问了");
        }
    }
}

fn main() {
    parent::child::public_function();  // ✅
}</code></pre></div>
<h2 id="理论-2访问方向的非对称性">理论 2：访问方向的非对称性</h2>
<p>模块树内的访问有一个重要的<strong>不对称性</strong>：同一棵树里，向上可以，向下不行。为什么？</p>
<p><strong>向上访问</strong>（子访问父）：</p>
<ul>
<li>子模块内可以用 <code>super</code> 关键字访问父模块的<strong>任何内容</strong>，包括私有项</li>
<li><strong>类比</strong>：楼 A（私有）→ 楼层（私有）→ 办公室（私有），虽然楼 A 和楼层都是私有的，但现在这件办公室的员工必须有访问楼 A 和楼层的权限，不然楼都进不去</li>
</ul>
<p><strong>向下访问</strong>（父访问子）：</p>
<ul>
<li>父模块<strong>无法访问</strong>子模块的私有项，只能访问子模块标记为 <code>pub</code> 的东西</li>
<li><strong>类比</strong>：楼 A（公开）→ 楼层（公开）→ 办公室（私有），虽然在公司内，但不能随意进入每个员工的私人办公室。如果员工想让别人进来，必须把门打开（标记为 <code>pub</code>）</li>
</ul>
<p>这看起来不对称，但有深层逻辑：<strong>私有性是一种承诺</strong> —— 子模块说”这是我的内部实现，整个树内也不能依赖”。这样才能真正隐藏实现细节，让子模块可以自由改变内部结构而不影响外部（包括父模块）。</p>
<div class="code-runner" data-full-code="mod%20parent%20%7B%0A%20%20%20%20fn%20parent_private()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E7%88%B6%E7%9A%84%E7%A7%81%E6%9C%89%E5%87%BD%E6%95%B0%22)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20pub%20mod%20child%20%7B%0A%20%20%20%20%20%20%20%20fn%20child_private()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%AD%90%E7%9A%84%E7%A7%81%E6%9C%89%E5%87%BD%E6%95%B0%22)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%0A%20%20%20%20%20%20%20%20pub%20fn%20access_upward()%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E2%9C%85%20%E5%AD%90%E5%8F%AF%E4%BB%A5%E5%90%91%E4%B8%8A%E8%AE%BF%E9%97%AE%E7%88%B6%E7%9A%84%E7%A7%81%E6%9C%89%E9%A1%B9%0A%20%20%20%20%20%20%20%20%20%20%20%20super%3A%3Aparent_private()%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20pub%20fn%20access_downward()%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E2%9D%8C%20%E7%88%B6%E6%97%A0%E6%B3%95%E8%AE%BF%E9%97%AE%E5%AD%90%E7%9A%84%E7%A7%81%E6%9C%89%E9%A1%B9%0A%20%20%20%20%20%20%20%20child%3A%3Achild_private()%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20parent%3A%3Achild%3A%3Aaccess_upward()%3B%0A%7D" data-mode="expect-error"><pre><code class="language-rust">mod parent {
    fn parent_private() {
        println!("父的私有函数");
    }

    pub mod child {
        fn child_private() {
            println!("子的私有函数");
        }

        pub fn access_upward() {
            // ✅ 子可以向上访问父的私有项
            super::parent_private();
        }
    }

    pub fn access_downward() {
        // ❌ 父无法访问子的私有项
        child::child_private();
    }
}

fn main() {
    parent::child::access_upward();
}</code></pre></div>
<h2 id="实战总结">实战总结</h2>
<img alt="mod" src="/images/rust/mod.svg" style="max-width:100%;margin:1rem 0;"/>
<p>我们来看看这个图，思考几个场景（假设都是非 pub 的）：</p>
<ol>
<li>「自己」访问「父模块」的私有项：「兄弟模块」、「函数 A」、「结构体 A」 —— 都可以访问（向上访问，树内特权。原因是这四者同属一个父模块，父模块的内容都可以访问）</li>
<li>「自己」访问「子模块 a」或者「子模块 b」—— 不能访问（父访问子）</li>
<li>「自己」访问「兄弟模块」的「结构体 b」 —— 不能访问（向下访问，私有边界保护）</li>
<li>「子模块 a」 访问「自己」（子模块 a 的父级）的「私有项」：「子模块 b」 或者「函数 a」 —— 能访问（向上访问，树内特权）</li>
<li>「子模块 a」 访问「子模块 b」（子模块 a 的兄弟） 的「私有项」 —— 不能访问（私有边界保护）</li>
<li>「子模块 a」 访问「父模块」（子模块 a 的爷级）的私有项：「函数 A」、「结构体 A」 —— 可以访问（向上访问，传递的树内特权）</li>
</ol>
<table><thead><tr><th>场景</th><th>是否可以</th><th>原因</th></tr></thead><tbody><tr><td>外部代码访问私有模块内的 pub 项</td><td>❌</td><td>路径断裂</td></tr><tr><td>外部代码访问完整 pub 路径末端的项</td><td>✅</td><td>路径可达</td></tr><tr><td>子模块访问父模块的私有项</td><td>✅</td><td>同树内部</td></tr><tr><td>父模块访问子模块的私有项</td><td>❌</td><td>要尊重私有边界</td></tr><tr><td>兄弟模块互相访问 pub 项</td><td>✅</td><td>通过 <code>super</code> 从父导航</td></tr></tbody></table>
<h1 id="文件模块化">文件模块化</h1>
<h2 id="模块树">模块树</h2>
<p>每个 crate 都有一个<strong>模块树</strong>，以 crate root（<code>src/main.rs</code> 或 <code>src/lib.rs</code>）为根：</p>
<pre><code class="language-text">crate                          ← 隐式的根模块
 └── restaurant                ← 模块
     └── front_of_house        ← 嵌套模块
         ├── hosting           ← 模块
         │   ├── add_to_waitlist
         │   └── seat_at_table
         └── serving           ← 模块
             ├── take_order
             ├── serve_order
             └── take_payment</code></pre>
<p>树中的每一项（函数、结构体、常量等）都有一个<strong>路径</strong>：</p>
<ul>
<li><code>crate::restaurant::front_of_house::hosting::add_to_waitlist</code></li>
<li><code>crate::restaurant::front_of_house::serving::take_order</code></li>
</ul>
<p>当模块变得很大时，可以将它们放在单独的文件中。</p>
<p><strong>项目结构有两种等价的方式：</strong></p>
<p>方式 1：单文件 + 目录</p>
<pre><code class="language-text">src/
├── main.rs
├── restaurant.rs          ← 模块文件
└── restaurant/
    └── hosting.rs         ← 嵌套模块文件</code></pre>
<p>方式 2：纯目录形式（旧写法，不推荐了）</p>
<pre><code class="language-text">src/
├── main.rs
└── restaurant/
    ├── mod.rs             ← 模块定义（代替 restaurant.rs）
    └── hosting.rs         ← 嵌套模块文件</code></pre>
<p><strong>src/main.rs：</strong></p>
<pre><code class="language-rust">mod restaurant;

fn main() {
    restaurant::eat_at_restaurant();
}</code></pre>
<p><strong>src/restaurant.rs：</strong></p>
<pre><code class="language-rust">pub mod hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}</code></pre>
<p><strong>src/restaurant/hosting.rs：</strong></p>
<blockquote>
<p><strong>目录名必须与模块名相同</strong>：如果模块叫 <code>restaurant</code>，目录必须叫 <code>restaurant/</code>，不能用其他名字</p>
</blockquote>
<pre><code class="language-rust">pub fn add_to_waitlist() {
    println!("已添加到等待列表");
}</code></pre>
<h2 id="文件模块化的规则">文件模块化的规则</h2>
<ul>
<li>声明模块使用 <code>mod 模块名;</code>（注意<strong>分号</strong>）</li>
<li>Rust 会在 <code>模块名.rs</code> 文件或 <code>模块名/</code> 目录中查找模块定义</li>
<li><strong>模块树中每个模块只能被声明一次</strong>：模块的声明权属于它的父模块。例如，如果 <code>main.rs</code> 中声明了 <code>mod c;</code>，其他文件就不能再声明 <code>mod c;</code></li>
<li>嵌套模块的文件放在对应名称的<strong>目录</strong>中</li>
<li>目录内的 <code>mod.rs</code> 文件定义该目录对应模块的内容</li>
</ul>
<h1 id="练习题">练习题</h1>
<h2 id="模块定义测验">模块定义测验</h2>
<pre><code class="language-rust">mod restaurant {
    mod kitchen {
        fn cook() {}
    }

    pub fn eat() {
        kitchen::cook();
    }
}</code></pre>
</div>
</div>
</div>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="补充-pub-关键字">补充 pub 关键字</h3>
<p>补充下面代码中缺少的 <code>pub</code> 关键字，使得所有调用都能编译通过。</p>
<div class="code-editor" data-block-id="07-modules/02-modules#4:4" data-expect-mode="literal" data-expect-pattern="%E4%B9%A6%E5%90%8D%EF%BC%9ARust%20%E5%9C%A3%E7%BB%8F%0A%E4%B9%A6%E7%B1%8D%E5%B7%B2%E6%B7%BB%E5%8A%A0%EF%BC%9A%E6%B7%B1%E5%85%A5%E6%B5%85%E5%87%BA%20Rust%0A%E5%88%97%E5%87%BA%E6%89%80%E6%9C%89%E4%B9%A6%E7%B1%8D" data-starter-code="mod%20library%20%7B%0A%20%20%20%20struct%20Book%20%7B%0A%20%20%20%20%20%20%20%20title%3A%20String%2C%0A%20%20%20%20%20%20%20%20isbn%3A%20String%2C%20%20%2F%2F%20%E7%A7%81%E6%9C%89%0A%20%20%20%20%7D%0A%0A%20%20%20%20impl%20Book%20%7B%0A%20%20%20%20%20%20%20%20fn%20new(title%3A%20%26str%2C%20isbn%3A%20%26str)%20-%3E%20Self%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20Book%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20title%3A%20title.to_string()%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20isbn%3A%20isbn.to_string()%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20add_book(title%3A%20%26str)%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E4%B9%A6%E7%B1%8D%E5%B7%B2%E6%B7%BB%E5%8A%A0%EF%BC%9A%7B%7D%22%2C%20title)%3B%0A%20%20%20%20%7D%0A%0A%20%20%20%20mod%20storage%20%7B%0A%20%20%20%20%20%20%20%20fn%20store(title%3A%20%26str)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E5%B7%B2%E5%AD%98%E5%82%A8%E4%B9%A6%E7%B1%8D%EF%BC%9A%7B%7D%22%2C%20title)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20fn%20list_books()%20%7B%0A%20%20%20%20%20%20%20%20println!(%22%E5%88%97%E5%87%BA%E6%89%80%E6%9C%89%E4%B9%A6%E7%B1%8D%22)%3B%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20book%20%3D%20library%3A%3ABook%3A%3Anew(%22Rust%20%E5%9C%A3%E7%BB%8F%22%2C%20%22123-456%22)%3B%0A%20%20%20%20println!(%22%E4%B9%A6%E5%90%8D%EF%BC%9A%7B%7D%22%2C%20book.title)%3B%0A%0A%20%20%20%20%2F%2F%20%E8%B0%83%E7%94%A8%E5%85%AC%E5%BC%80%E5%87%BD%E6%95%B0%0A%20%20%20%20library%3A%3Aadd_book(%22%E6%B7%B1%E5%85%A5%E6%B5%85%E5%87%BA%20Rust%22)%3B%0A%20%20%20%20library%3A%3Alist_books()%3B%0A%0A%20%20%20%20%2F%2F%20%E8%BF%99%E4%BA%9B%E6%97%A0%E6%B3%95%E8%AE%BF%E9%97%AE%EF%BC%88%E9%A2%84%E6%9C%9F%EF%BC%89%0A%20%20%20%20%2F%2F%20println!(%22ISBN%3A%20%7B%7D%22%2C%20book.isbn)%3B%0A%20%20%20%20%2F%2F%20library%3A%3Astorage%3A%3Astore(%22%E6%9F%90%E6%9C%AC%E4%B9%A6%22)%3B%0A%7D"><pre><code class="language-rust">mod library {
    struct Book {
        title: String,
        isbn: String,  // 私有
    }

    impl Book {
        fn new(title: &amp;str, isbn: &amp;str) -&gt; Self {
            Book {
                title: title.to_string(),
                isbn: isbn.to_string(),
            }
        }
    }

    fn add_book(title: &amp;str) {
        println!("书籍已添加：{}", title);
    }

    mod storage {
        fn store(title: &amp;str) {
            println!("已存储书籍：{}", title);
        }
    }

    fn list_books() {
        println!("列出所有书籍");
    }
}

fn main() {
    let book = library::Book::new("Rust 圣经", "123-456");
    println!("书名：{}", book.title);

    // 调用公开函数
    library::add_book("深入浅出 Rust");
    library::list_books();

    // 这些无法访问（预期）
    // println!("ISBN: {}", book.isbn);
    // library::storage::store("某本书");
}</code></pre></div> 