---
title: "模式匹配与 match 表达式"
description: "自定义类型 - 模式匹配与 match 表达式"
date: "2026-07-12"
order: 4004
tags: ["match", "模式", "穷尽性", "绑定", "通配符"]
est_time: "30 分钟"
---

 <h1 id="match-表达式的威力">match 表达式的威力</h1>
<p><code>match</code> 是 Rust 中最强大的控制流构造，它结合了 C 的 <code>switch</code> 和模式匹配的强大功能。（上一节你可能已经看到了如何使用，本篇文章我们将深入一些细节）</p>
<p>基本思想：</p>
<ol>
<li>比较一个值与一系列模式</li>
<li>执行与第一个匹配的模式对应的代码</li>
<li><strong>编译器强制检查所有可能的情况</strong></li>
</ol>
<h2 id="基本-match-语法">基本 match 语法</h2>
<div class="code-runner" data-full-code="enum%20Coin%20%7B%0A%20%20%20%20Penny%2C%0A%20%20%20%20Nickel%2C%0A%20%20%20%20Dime%2C%0A%20%20%20%20Quarter%2C%0A%7D%0A%0Afn%20value_in_cents(coin%3A%20Coin)%20-%3E%20u32%20%7B%0A%20%20%20%20match%20coin%20%7B%0A%20%20%20%20%20%20%20%20Coin%3A%3APenny%20%3D%3E%201%2C%0A%20%20%20%20%20%20%20%20Coin%3A%3ANickel%20%3D%3E%205%2C%0A%20%20%20%20%20%20%20%20Coin%3A%3ADime%20%3D%3E%2010%2C%0A%20%20%20%20%20%20%20%20Coin%3A%3AQuarter%20%3D%3E%2025%2C%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22Penny%20%E4%BB%B7%E5%80%BC%20%7B%7D%20%E7%BE%8E%E5%88%86%22%2C%20value_in_cents(Coin%3A%3APenny))%3B%0A%20%20%20%20println!(%22Quarter%20%E4%BB%B7%E5%80%BC%20%7B%7D%20%E7%BE%8E%E5%88%86%22%2C%20value_in_cents(Coin%3A%3AQuarter))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -&gt; u32 {
    match coin {
        Coin::Penny =&gt; 1,
        Coin::Nickel =&gt; 5,
        Coin::Dime =&gt; 10,
        Coin::Quarter =&gt; 25,
    }
}

fn main() {
    println!("Penny 价值 {} 美分", value_in_cents(Coin::Penny));
    println!("Quarter 价值 {} 美分", value_in_cents(Coin::Quarter));
}</code></pre></div>
<p><strong>结构：</strong></p>
<ul>
<li><code>match 表达式 { ... }</code> — 要匹配的值放在 <code>match</code> 后</li>
<li>每个分支：<code>模式 =&gt; 代码</code></li>
<li>分支间用逗号分隔</li>
<li>多行代码用大括号：<code>模式 =&gt; { ... }</code></li>
</ul>
<h1 id="绑定匹配值中的数据">绑定匹配值中的数据</h1>
<p>枚举成员常包含数据，<code>match</code> 可以解构这些数据：</p>
<div class="code-runner" data-full-code="enum%20UsState%20%7B%0A%20%20%20%20Alabama%2C%0A%20%20%20%20Alaska%2C%0A%20%20%20%20Arizona%2C%0A%7D%0A%0Aenum%20Coin%20%7B%0A%20%20%20%20Penny%2C%0A%20%20%20%20Nickel%2C%0A%20%20%20%20Dime%2C%0A%20%20%20%20Quarter(UsState)%2C%0A%7D%0A%0Afn%20describe_coin(coin%3A%20Coin)%20-%3E%20String%20%7B%0A%20%20%20%20match%20coin%20%7B%0A%20%20%20%20%20%20%20%20Coin%3A%3APenny%20%3D%3E%20String%3A%3Afrom(%22%E9%97%AA%E9%97%AA%E5%8F%91%E5%85%89%E7%9A%84%E4%BE%BF%E5%A3%AB%22)%2C%0A%20%20%20%20%20%20%20%20Coin%3A%3ANickel%20%3D%3E%20String%3A%3Afrom(%22%E9%95%8D%E5%B8%81%22)%2C%0A%20%20%20%20%20%20%20%20Coin%3A%3ADime%20%3D%3E%20String%3A%3Afrom(%22%E5%8D%81%E7%BE%8E%E5%88%86%E7%A1%AC%E5%B8%81%22)%2C%0A%20%20%20%20%20%20%20%20Coin%3A%3AQuarter(state)%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20format!(%22%E6%9D%A5%E8%87%AA%20%7B%3A%3F%7D%20%E7%9A%84%2025%20%E7%BE%8E%E5%88%86%E7%A1%AC%E5%B8%81%22%2C%20state)%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20coin%20%3D%20Coin%3A%3AQuarter(UsState%3A%3AAlaska)%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe_coin(coin))%3B%0A%7D" data-mode="run"><pre><code class="language-rust">enum UsState {
    Alabama,
    Alaska,
    Arizona,
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn describe_coin(coin: Coin) -&gt; String {
    match coin {
        Coin::Penny =&gt; String::from("闪闪发光的便士"),
        Coin::Nickel =&gt; String::from("镍币"),
        Coin::Dime =&gt; String::from("十美分硬币"),
        Coin::Quarter(state) =&gt; {
            format!("来自 {:?} 的 25 美分硬币", state)
        }
    }
}

fn main() {
    let coin = Coin::Quarter(UsState::Alaska);
    println!("{}", describe_coin(coin));
}</code></pre></div>
<p>当匹配 <code>Quarter(state)</code> 时，<code>state</code> 被<strong>绑定</strong>到内部的 <code>UsState</code> 值。</p>
<h1 id="穷尽性与模式匹配">穷尽性与模式匹配</h1>
<p><code>match</code> 的核心是两个特性：<strong>穷尽性检查</strong>（所有情况都必须处理）和<strong>灵活的模式</strong>（提取或忽略你关心的部分）。</p>
<h2 id="穷尽性检查必须处理所有情况">穷尽性检查：必须处理所有情况</h2>
<p><code>match</code> 必须覆盖所有可能的情况，否则编译失败：</p>
<div class="code-runner" data-full-code="enum%20TrafficLight%20%7B%0A%20%20%20%20Red%2C%0A%20%20%20%20Yellow%2C%0A%20%20%20%20Green%2C%0A%7D%0A%0Afn%20check_light(light%3A%20TrafficLight)%20%7B%0A%20%20%20%20match%20light%20%7B%0A%20%20%20%20%20%20%20%20TrafficLight%3A%3ARed%20%3D%3E%20println!(%22%E5%81%9C%E6%AD%A2%22)%2C%0A%20%20%20%20%20%20%20%20TrafficLight%3A%3AYellow%20%3D%3E%20println!(%22%E5%87%86%E5%A4%87%22)%2C%0A%20%20%20%20%20%20%20%20%2F%2F%20%E7%BC%96%E8%AF%91%E9%94%99%E8%AF%AF%EF%BC%9A%E7%BC%BA%E5%B0%91%20Green%20%E5%88%86%E6%94%AF%0A%20%20%20%20%7D%0A%7D" data-mode="expect-error"><pre><code class="language-rust">enum TrafficLight {
    Red,
    Yellow,
    Green,
}

fn check_light(light: TrafficLight) {
    match light {
        TrafficLight::Red =&gt; println!("停止"),
        TrafficLight::Yellow =&gt; println!("准备"),
        // 编译错误：缺少 Green 分支
    }
}</code></pre></div>
<p>编译器会明确告诉你哪个情况被遗漏。这防止了难以追踪的逻辑 bug。</p>
<h2 id="用-catch-all-模式满足穷尽性">用 catch-all 模式满足穷尽性</h2>
<p>当有很多情况但你只关心其中几个时，用 <code>_</code> 或变量名作为 catch-all 模式来处理其他所有情况：</p>
<h3 id="方案一用-_-丢弃其他值">方案一：用 <code>_</code> 丢弃其他值</h3>
<div class="code-runner" data-full-code="fn%20describe_number(n%3A%20u8)%20%7B%0A%20%20%20%20match%20n%20%7B%0A%20%20%20%20%20%20%20%200%20%3D%3E%20println!(%22%E9%9B%B6%22)%2C%0A%20%20%20%20%20%20%20%201%20%3D%3E%20println!(%22%E4%B8%80%22)%2C%0A%20%20%20%20%20%20%20%202%20%3D%3E%20println!(%22%E4%BA%8C%22)%2C%0A%20%20%20%20%20%20%20%20_%20%3D%3E%20println!(%22%E5%85%B6%E4%BB%96%E6%95%B0%E5%AD%97%22)%2C%20%20%2F%2F%20%E6%BB%A1%E8%B6%B3%E7%A9%B7%E5%B0%BD%E6%80%A7%EF%BC%8C%E4%BD%86%E4%B8%8D%E4%BD%BF%E7%94%A8%E5%80%BC%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20describe_number(0)%3B%0A%20%20%20%20describe_number(5)%3B%0A%7D" data-mode="run"><pre><code class="language-rust">fn describe_number(n: u8) {
    match n {
        0 =&gt; println!("零"),
        1 =&gt; println!("一"),
        2 =&gt; println!("二"),
        _ =&gt; println!("其他数字"),  // 满足穷尽性，但不使用值
    }
}

fn main() {
    describe_number(0);
    describe_number(5);
}</code></pre></div>
<h3 id="方案二用变量名捕获其他值">方案二：用变量名捕获其他值</h3>
<div class="code-runner" data-full-code="fn%20main()%20%7B%0A%20%20%20%20let%20dice_roll%20%3D%209%3B%0A%0A%20%20%20%20match%20dice_roll%20%7B%0A%20%20%20%20%20%20%20%203%20%3D%3E%20println!(%22%E5%8A%A0%E5%B8%BD%E5%AD%90%22)%2C%0A%20%20%20%20%20%20%20%207%20%3D%3E%20println!(%22%E7%A7%BB%E9%99%A4%E5%B8%BD%E5%AD%90%22)%2C%0A%20%20%20%20%20%20%20%20other%20%3D%3E%20println!(%22%E7%A7%BB%E5%8A%A8%E7%8E%A9%E5%AE%B6%20%7B%7D%20%E6%AD%A5%22%2C%20other)%2C%20%20%2F%2F%20other%20%E6%8D%95%E8%8E%B7%E4%BA%86%E5%80%BC%209%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">fn main() {
    let dice_roll = 9;

    match dice_roll {
        3 =&gt; println!("加帽子"),
        7 =&gt; println!("移除帽子"),
        other =&gt; println!("移动玩家 {} 步", other),  // other 捕获了值 9
    }
}</code></pre></div>
<p><strong>对比：</strong></p>
<ul>
<li><code>_</code> — 匹配任何值但丢弃（不能使用）</li>
<li><code>other</code>（或任何变量名） — 匹配任何值并将其绑定到变量（可以在分支中使用）</li>
</ul>
<h2 id="提取部分值灵活提取关心的字段">提取部分值：灵活提取关心的字段</h2>
<p>match 时，你可以选择性地提取字段，而不必全部提取。</p>
<h3 id="用-_-忽略元组中的字段">用 <code>_</code> 忽略元组中的字段</h3>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Aenum%20Point%20%7B%0A%20%20%20%20Point2D(i32%2C%20i32)%2C%0A%20%20%20%20Point3D(i32%2C%20i32%2C%20i32)%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20p%20%3D%20Point%3A%3APoint3D(1%2C%202%2C%203)%3B%0A%0A%20%20%20%20match%20p%20%7B%0A%20%20%20%20%20%20%20%20Point%3A%3APoint3D(x%2C%20_%2C%20_)%20%3D%3E%20println!(%22%E5%8F%AA%E5%85%B3%E5%BF%83%20x%EF%BC%9A%7B%7D%22%2C%20x)%2C%0A%20%20%20%20%20%20%20%20Point%3A%3APoint2D(x%2C%20y)%20%3D%3E%20println!(%222D%20%E7%82%B9%EF%BC%9A(%7B%7D%2C%20%7B%7D)%22%2C%20x%2C%20y)%2C%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
enum Point {
    Point2D(i32, i32),
    Point3D(i32, i32, i32),
}

fn main() {
    let p = Point::Point3D(1, 2, 3);

    match p {
        Point::Point3D(x, _, _) =&gt; println!("只关心 x：{}", x),
        Point::Point2D(x, y) =&gt; println!("2D 点：({}, {})", x, y),
    }
}</code></pre></div>
<h3 id="用--忽略结构体中的字段">用 <code>..</code> 忽略结构体中的字段</h3>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Aenum%20Person%20%7B%0A%20%20%20%20Student%20%7B%20name%3A%20String%2C%20grade%3A%20u32%20%7D%2C%0A%20%20%20%20Teacher%20%7B%20name%3A%20String%2C%20subject%3A%20String%20%7D%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20person%20%3D%20Person%3A%3AStudent%20%7B%0A%20%20%20%20%20%20%20%20name%3A%20String%3A%3Afrom(%22Alice%22)%2C%0A%20%20%20%20%20%20%20%20grade%3A%2010%2C%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20match%20person%20%7B%0A%20%20%20%20%20%20%20%20Person%3A%3AStudent%20%7B%20name%2C%20..%20%7D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20%E5%8F%AA%E6%8F%90%E5%8F%96%20name%EF%BC%8C%E5%85%B6%E4%BB%96%E7%94%A8%20..%20%E5%BF%BD%E7%95%A5%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%7B%7D%20%E6%98%AF%E5%AD%A6%E7%94%9F%22%2C%20name)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20Person%3A%3ATeacher%20%7B%20subject%2C%20..%20%7D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E6%95%99%E7%A7%91%E7%9B%AE%EF%BC%9A%7B%7D%22%2C%20subject)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
enum Person {
    Student { name: String, grade: u32 },
    Teacher { name: String, subject: String },
}

fn main() {
    let person = Person::Student {
        name: String::from("Alice"),
        grade: 10,
    };

    match person {
        Person::Student { name, .. } =&gt; {
            // 只提取 name，其他用 .. 忽略
            println!("{} 是学生", name);
        }
        Person::Teacher { subject, .. } =&gt; {
            println!("教科目：{}", subject);
        }
    }
}</code></pre></div>
<h3 id="提取字段的简写语法">提取字段的简写语法</h3>
<p>在 match 模式中，<code>{key}</code> 是 <code>{key: key}</code> 的简写——字段名同时也是绑定的变量名。如果想用不同的变量名，才需要用完整形式 <code>{key: var_name}</code>：</p>
<div class="code-runner" data-full-code="%23%5Bderive(Debug)%5D%0Aenum%20Config%20%7B%0A%20%20%20%20Set%20%7B%20host%3A%20String%2C%20port%3A%20u32%20%7D%2C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20cfg%20%3D%20Config%3A%3ASet%20%7B%0A%20%20%20%20%20%20%20%20host%3A%20String%3A%3Afrom(%22localhost%22)%2C%0A%20%20%20%20%20%20%20%20port%3A%208080%2C%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20match%20cfg%20%7B%0A%20%20%20%20%20%20%20%20%2F%2F%20%E7%AE%80%E5%86%99%E5%BD%A2%E5%BC%8F%EF%BC%9A%7Bhost%2C%20port%7D%20%E7%9B%B8%E5%BD%93%E4%BA%8E%20%7Bhost%3A%20host%2C%20port%3A%20port%7D%0A%20%20%20%20%20%20%20%20Config%3A%3ASet%20%7B%20host%2C%20port%20%7D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E8%BF%9E%E6%8E%A5%E5%88%B0%20%7B%7D%3A%7B%7D%22%2C%20host%2C%20port)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%0A%20%20%20%20%2F%2F%20%E5%A6%82%E6%9E%9C%E8%A6%81%E7%94%A8%E4%B8%8D%E5%90%8C%E7%9A%84%E5%8F%98%E9%87%8F%E5%90%8D%EF%BC%8C%E7%94%A8%E5%AE%8C%E6%95%B4%E5%BD%A2%E5%BC%8F%0A%20%20%20%20match%20cfg%20%7B%0A%20%20%20%20%20%20%20%20Config%3A%3ASet%20%7B%20host%3A%20h%2C%20port%3A%20p%20%7D%20%3D%3E%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20println!(%22%E8%BF%9E%E6%8E%A5%E5%88%B0%20%7B%7D%3A%7B%7D%22%2C%20h%2C%20p)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%7D" data-mode="run"><pre><code class="language-rust">#[derive(Debug)]
enum Config {
    Set { host: String, port: u32 },
}

fn main() {
    let cfg = Config::Set {
        host: String::from("localhost"),
        port: 8080,
    };

    match cfg {
        // 简写形式：{host, port} 相当于 {host: host, port: port}
        Config::Set { host, port } =&gt; {
            println!("连接到 {}:{}", host, port);
        }
    }

    // 如果要用不同的变量名，用完整形式
    match cfg {
        Config::Set { host: h, port: p } =&gt; {
            println!("连接到 {}:{}", h, p);
        }
    }
}</code></pre></div>
<p><strong>小结：</strong> 穷尽性检查要求覆盖所有情况，而灵活的模式（<code>_</code>、<code>..</code>、变量名）让你按需提取或忽略数据。</p>
<h2 id="多个模式匹配同一分支">多个模式匹配同一分支</h2>
<p>有时候，不同的模式需要执行同样的代码。可以用 <code>|</code> 将多个模式组合在一起：</p>
<div class="code-runner" data-full-code="enum%20HttpStatus%20%7B%0A%20%20%20%20Ok%2C%0A%20%20%20%20Created%2C%0A%20%20%20%20BadRequest%2C%0A%20%20%20%20NotFound%2C%0A%20%20%20%20ServerError%2C%0A%7D%0A%0Afn%20is_error(status%3A%20HttpStatus)%20-%3E%20bool%20%7B%0A%20%20%20%20match%20status%20%7B%0A%20%20%20%20%20%20%20%20HttpStatus%3A%3AOk%20%7C%20HttpStatus%3A%3ACreated%20%3D%3E%20false%2C%20%20%20%20%20%20%20%20%2F%2F%20%E6%88%90%E5%8A%9F%E7%8A%B6%E6%80%81%0A%20%20%20%20%20%20%20%20HttpStatus%3A%3ABadRequest%20%7C%20HttpStatus%3A%3ANotFound%20%7C%20HttpStatus%3A%3AServerError%20%3D%3E%20true%2C%20%20%2F%2F%20%E9%94%99%E8%AF%AF%E7%8A%B6%E6%80%81%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20is_error(HttpStatus%3A%3AOk))%3B%20%20%20%20%20%20%20%20%20%20%20%2F%2F%20false%0A%20%20%20%20println!(%22%7B%7D%22%2C%20is_error(HttpStatus%3A%3ABadRequest))%3B%20%20%20%2F%2F%20true%0A%7D" data-mode="run"><pre><code class="language-rust">enum HttpStatus {
    Ok,
    Created,
    BadRequest,
    NotFound,
    ServerError,
}

fn is_error(status: HttpStatus) -&gt; bool {
    match status {
        HttpStatus::Ok | HttpStatus::Created =&gt; false,        // 成功状态
        HttpStatus::BadRequest | HttpStatus::NotFound | HttpStatus::ServerError =&gt; true,  // 错误状态
    }
}

fn main() {
    println!("{}", is_error(HttpStatus::Ok));           // false
    println!("{}", is_error(HttpStatus::BadRequest));   // true
}</code></pre></div>
<p>使用 <code>|</code> 可以避免代码重复——不用为每个模式单独写一个分支。</p>
<h1 id="匹配规则注意点">匹配规则注意点</h1>
<p>如果你熟悉 C 的 <code>switch</code> 语句，需要注意 Rust 的 <code>match</code> 有不同的行为：</p>
<h2 id="1-无需-break自动跳出">1. 无需 <code>break</code>，自动跳出</h2>
<p><strong>C 的 switch：</strong></p>
<pre><code class="language-c">switch (value) {
    case 1:
        printf("一");
        break;  // 必须写 break，否则会"fall through"
    case 2:
        printf("二");
        break;
}</code></pre>
<p><strong>Rust 的 match：</strong></p>
<div class="code-runner" data-full-code="let%20value%20%3D%201%3B%0A%0Amatch%20value%20%7B%0A%20%20%20%201%20%3D%3E%20println!(%22%E4%B8%80%22)%2C%20%20%2F%2F%20%E6%97%A0%E9%9C%80%20break%EF%BC%8C%E5%8C%B9%E9%85%8D%E5%90%8E%E8%87%AA%E5%8A%A8%E8%B7%B3%E5%87%BA%0A%20%20%20%202%20%3D%3E%20println!(%22%E4%BA%8C%22)%2C%0A%20%20%20%20_%20%3D%3E%20%7B%7D%0A%7D" data-mode="run"><pre><code class="language-rust">let value = 1;

match value {
    1 =&gt; println!("一"),  // 无需 break，匹配后自动跳出
    2 =&gt; println!("二"),
    _ =&gt; {}
}</code></pre></div>
<p>Rust 在匹配一个分支后<strong>自动跳出</strong>，不会继续执行下一个分支，所以不需要 <code>break</code>。这也意味着 Rust <strong>禁止 fall through 行为</strong>——你无法写出像 C 那样忘记 <code>break</code> 就继续执行下一个分支的代码。如果需要多个分支执行相同的代码，使用 <code>|</code> 组合模式即可（见前面”多个模式匹配同一分支”部分）。</p>
<h2 id="2-多个分支不能匹配同样的值">2. 多个分支不能匹配同样的值</h2>
<p><strong>在 Rust 中编译错误：</strong></p>
<div class="code-runner" data-full-code="let%20value%20%3D%201%3B%0A%0Amatch%20value%20%7B%0A%20%20%20%201%20%3D%3E%20println!(%22%E4%B8%80%22)%2C%0A%20%20%20%201%20%3D%3E%20println!(%22%E5%86%8D%E6%9D%A5%E4%B8%80%E9%81%8D%22)%2C%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%811%20%E5%B7%B2%E7%BB%8F%E8%A2%AB%E5%89%8D%E9%9D%A2%E7%9A%84%E5%88%86%E6%94%AF%E5%8C%B9%E9%85%8D%0A%20%20%20%20_%20%3D%3E%20%7B%7D%0A%7D" data-mode="expect-error"><pre><code class="language-rust">let value = 1;

match value {
    1 =&gt; println!("一"),
    1 =&gt; println!("再来一遍"),  // 错误！1 已经被前面的分支匹配
    _ =&gt; {}
}</code></pre></div>
<p>编译器会拒绝<strong>重复的模式</strong>。如果你需要不同的代码执行，必须放在同一个分支中。即使用 <code>|</code> 组合模式，也不能让某个值在多个分支中被匹配到：</p>
<div class="code-runner" data-full-code="let%20value%20%3D%202%3B%0A%0Amatch%20value%20%7B%0A%20%20%20%201%20%7C%202%20%3D%3E%20println!(%22%E4%B8%80%E6%88%96%E4%BA%8C%22)%2C%0A%20%20%20%202%20%7C%203%20%3D%3E%20println!(%22%E4%BA%8C%E6%88%96%E4%B8%89%22)%2C%20%20%2F%2F%20%E9%94%99%E8%AF%AF%EF%BC%812%20%E5%B7%B2%E7%BB%8F%E5%9C%A8%E5%89%8D%E4%B8%80%E4%B8%AA%E5%88%86%E6%94%AF%E8%A2%AB%E5%8C%B9%E9%85%8D%E8%BF%87%0A%20%20%20%20_%20%3D%3E%20%7B%7D%0A%7D" data-mode="expect-error"><pre><code class="language-rust">let value = 2;

match value {
    1 | 2 =&gt; println!("一或二"),
    2 | 3 =&gt; println!("二或三"),  // 错误！2 已经在前一个分支被匹配过
    _ =&gt; {}
}</code></pre></div>
<blockquote>
<p><strong>预告</strong>：本章介绍的是 <code>match</code> 的基础用法。Rust 的模式匹配系统非常强大，还有更多进阶特性（如范围模式、守卫条件、引用解构等），将在<a href="/RustCourse/chapters/22-advanced/04-advanced-patterns">高级模式匹配</a>中详细讲解。</p>
</blockquote>
<h1 id="练习题">练习题</h1>
<h2 id="选择题">选择题</h2>
<pre><code class="language-rust">enum Animal {
    Dog,
    Cat,
    Bird,
}

let animal = Animal::Cat;

match animal {
    Animal::Dog =&gt; println!("汪"),
    Animal::Cat =&gt; println!("喵"),
}</code></pre>
</div>
<pre><code class="language-rust">enum Status {
    Pending,
    Running,
    Done,
}

let status = Status::Running;

match status {
    Status::Pending =&gt; println!("等待中"),
    Status::Running =&gt; println!("运行中"),
    Status::Done =&gt; println!("完成"),
}</code></pre>
</div>
<pre><code class="language-rust">enum Message {
    Text(String),
    Number(i32),
}

let msg = Message::Number(42);

match msg {
    Message::Text(s) =&gt; println!("文本：{}", s),
    Message::Number(n) =&gt; println!("数字：{}", n),
}</code></pre>
</div>
<pre><code class="language-rust">enum Level {
    Low,
    Medium,
    High,
    Critical,
}

let level = Level::High;

match level {
    Level::Low | Level::Medium =&gt; println!("正常"),
    Level::High | Level::Critical =&gt; println!("警告"),
}</code></pre>
</div>
<h2 id="编程练习">编程练习</h2>
<h3 id="练习-1完善-match-分支">练习 1：完善 match 分支</h3>
<p>下面的代码缺少一个分支，请修复它：</p>
<div class="code-editor" data-block-id="04-custom-types/04-match#4:4" data-expect-mode="literal" data-expect-pattern="%E7%BA%A2%E8%89%B2%0A%E8%93%9D%E8%89%B2" data-starter-code="enum%20Color%20%7B%0A%20%20%20%20Red%2C%0A%20%20%20%20Green%2C%0A%20%20%20%20Blue%2C%0A%7D%0A%0Afn%20describe_color(color%3A%20Color)%20-%3E%20String%20%7B%0A%20%20%20%20match%20color%20%7B%0A%20%20%20%20%20%20%20%20Color%3A%3ARed%20%3D%3E%20String%3A%3Afrom(%22%E7%BA%A2%E8%89%B2%22)%2C%0A%20%20%20%20%20%20%20%20Color%3A%3AGreen%20%3D%3E%20String%3A%3Afrom(%22%E7%BB%BF%E8%89%B2%22)%2C%0A%20%20%20%20%20%20%20%20%2F%2F%20TODO%3A%20%E6%B7%BB%E5%8A%A0%20Blue%20%E5%88%86%E6%94%AF%0A%20%20%20%20%7D%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe_color(Color%3A%3ARed))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20describe_color(Color%3A%3ABlue))%3B%0A%7D"><pre><code class="language-rust">enum Color {
    Red,
    Green,
    Blue,
}

fn describe_color(color: Color) -&gt; String {
    match color {
        Color::Red =&gt; String::from("红色"),
        Color::Green =&gt; String::from("绿色"),
        // TODO: 添加 Blue 分支
    }
}

fn main() {
    println!("{}", describe_color(Color::Red));
    println!("{}", describe_color(Color::Blue));
}</code></pre></div>
<h3 id="练习-2使用-match-解构枚举">练习 2：使用 match 解构枚举</h3>
<p>定义一个 <code>Message</code> 枚举，包含三个成员：</p>
<ul>
<li><code>Text(String)</code> — 文本消息</li>
<li><code>Number(i32)</code> — 数字消息</li>
<li><code>Empty</code> — 空消息</li>
</ul>
<p>实现一个函数 <code>process_message()</code> 处理不同的消息：</p>
<div class="code-editor" data-block-id="04-custom-types/04-match#4:5" data-expect-mode="literal" data-expect-pattern="%E6%96%87%E6%9C%AC%E6%B6%88%E6%81%AF%0A%E6%95%B0%E5%AD%97%E6%B6%88%E6%81%AF%0A%E7%A9%BA%E6%B6%88%E6%81%AF" data-starter-code="enum%20Message%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9A%E4%B9%89%E4%B8%89%E4%B8%AA%E6%88%90%E5%91%98%0A%7D%0A%0Afn%20process_message(msg%3A%20Message)%20-%3E%20String%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E4%BD%BF%E7%94%A8%20match%20%E5%A4%84%E7%90%86%E4%B8%89%E7%A7%8D%E6%B6%88%E6%81%AF%EF%BC%8C%E8%BF%94%E5%9B%9E%E7%9B%B8%E5%BA%94%E6%8F%8F%E8%BF%B0%EF%BC%9A%E6%96%87%E6%9C%AC%E6%B6%88%E6%81%AF%EF%BD%9C%E6%95%B0%E5%AD%97%E6%B6%88%E6%81%AF%EF%BD%9C%E7%A9%BA%E6%B6%88%E6%81%AF%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20msg1%20%3D%20Message%3A%3AText(String%3A%3Afrom(%22Hello%22))%3B%0A%20%20%20%20let%20msg2%20%3D%20Message%3A%3ANumber(42)%3B%0A%20%20%20%20let%20msg3%20%3D%20Message%3A%3AEmpty%3B%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20process_message(msg1))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20process_message(msg2))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20process_message(msg3))%3B%0A%7D"><pre><code class="language-rust">enum Message {
    // TODO: 定义三个成员
}

fn process_message(msg: Message) -&gt; String {
    // TODO: 使用 match 处理三种消息，返回相应描述：文本消息｜数字消息｜空消息
}

fn main() {
    let msg1 = Message::Text(String::from("Hello"));
    let msg2 = Message::Number(42);
    let msg3 = Message::Empty;

    println!("{}", process_message(msg1));
    println!("{}", process_message(msg2));
    println!("{}", process_message(msg3));
}</code></pre></div>
<h3 id="练习-3处理不同形式的关联数据">练习 3：处理不同形式的关联数据</h3>
<p>定义一个 <code>Command</code> 枚举，包含两个成员（展示元组风格和结构体风格的混合）：</p>
<ul>
<li><code>Execute(String)</code> — 执行命令（元组风格，关联一个字符串）</li>
<li><code>Config { key: String, value: String }</code> — 配置（结构体风格，关联两个字段）</li>
</ul>
<p>实现一个函数 <code>handle_command()</code> 使用 match 处理这两种情况，返回对应的描述字符串：</p>
<ul>
<li>对于 <code>Execute</code>：返回 <code>"执行命令：{命令名}"</code></li>
<li>对于 <code>Config</code>：返回 <code>"配置 {key} = {value}"</code></li>
</ul>
<div class="code-editor" data-block-id="04-custom-types/04-match#4:6" data-expect-mode="literal" data-expect-pattern="%E6%89%A7%E8%A1%8C%E5%91%BD%E4%BB%A4%EF%BC%9Astart%0A%E9%85%8D%E7%BD%AE%20timeout%20%3D%2030" data-starter-code="enum%20Command%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E5%AE%9A%E4%B9%89%E4%B8%A4%E4%B8%AA%E6%88%90%E5%91%98%0A%7D%0A%0Afn%20handle_command(cmd%3A%20Command)%20-%3E%20String%20%7B%0A%20%20%20%20%2F%2F%20TODO%3A%20%E4%BD%BF%E7%94%A8%20match%20%E5%A4%84%E7%90%86%E5%91%BD%E4%BB%A4%E5%B9%B6%E8%BF%94%E5%9B%9E%E5%A4%84%E7%90%86%E7%BB%93%E6%9E%9C%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20let%20cmd1%20%3D%20Command%3A%3AExecute(String%3A%3Afrom(%22start%22))%3B%0A%20%20%20%20let%20cmd2%20%3D%20Command%3A%3AConfig%20%7B%0A%20%20%20%20%20%20%20%20key%3A%20String%3A%3Afrom(%22timeout%22)%2C%0A%20%20%20%20%20%20%20%20value%3A%20String%3A%3Afrom(%2230%22)%2C%0A%20%20%20%20%7D%3B%0A%0A%20%20%20%20println!(%22%7B%7D%22%2C%20handle_command(cmd1))%3B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20handle_command(cmd2))%3B%0A%7D"><pre><code class="language-rust">enum Command {
    // TODO: 定义两个成员
}

fn handle_command(cmd: Command) -&gt; String {
    // TODO: 使用 match 处理命令并返回处理结果
}

fn main() {
    let cmd1 = Command::Execute(String::from("start"));
    let cmd2 = Command::Config {
        key: String::from("timeout"),
        value: String::from("30"),
    };

    println!("{}", handle_command(cmd1));
    println!("{}", handle_command(cmd2));
}</code></pre></div> 