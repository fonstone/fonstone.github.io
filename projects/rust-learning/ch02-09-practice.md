---
title: "综合练习"
description: "基本语法 - 综合练习"
date: "2026-07-12"
order: 2009
tags: ["练习", "算法", "斐波那契", "质数", "递归", "排序", "函数"]
est_time: "30 分钟"
---

 <h2 id="练习一斐波那契数列">练习一：斐波那契数列</h2>
<p>斐波那契数列从 0 和 1 开始，后续每项等于前两项之和：0, 1, 1, 2, 3, 5, 8, …</p>
<p>打印数列的<strong>前 10 项</strong>，每行一个数字。</p>
<blockquote>
<p><strong>提示</strong>：用两个变量 <code>a</code> 和 <code>b</code> 分别记录当前项和下一项。每轮循环打印 <code>a</code>，然后同时更新：新的 <code>a = b</code>，新的 <code>b = 原来的 a + b</code>。</p>
</blockquote>
<div class="code-editor" data-block-id="02-basic-syntax/09-practice#0:0" data-expect-mode="literal" data-expect-pattern="0%0A1%0A1%0A2%0A3%0A5%0A8%0A13%0A21%0A34" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E6%89%93%E5%8D%B0%E6%96%90%E6%B3%A2%E9%82%A3%E5%A5%91%E6%95%B0%E5%88%97%E7%9A%84%E5%89%8D%2010%20%E9%A1%B9%0A%7D"><pre><code class="language-rust">fn main() {
    // TODO：打印斐波那契数列的前 10 项
}</code></pre></div>
<h2 id="练习二质数判断">练习二：质数判断</h2>
<p>实现函数 <code>is_prime</code>，判断一个数是否为<strong>质数</strong>（只能被 1 和自身整除的大于 1 的整数），然后打印 2 到 50 之间所有质数，空格分隔。</p>
<blockquote>
<p><strong>提示</strong>：检查 <code>i * i &lt;= n</code> 即可停止，不需要遍历到 <code>n - 1</code>。如果 <code>n % i == 0</code>，则 <code>n</code> 不是质数。</p>
</blockquote>
<div class="code-editor" data-block-id="02-basic-syntax/09-practice#0:1" data-expect-mode="literal" data-expect-pattern="2%203%205%207%2011%2013%2017%2019%2023%2029%2031%2037%2041%2043%2047" data-starter-code="fn%20is_prime(n%3A%20u64)%20-%3E%20bool%20%7B%0A%20%20%20%20%2F%2F%20TODO%0A%20%20%20%20false%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20for%20n%20in%202..%3D50%20%7B%0A%20%20%20%20%20%20%20%20if%20is_prime(n)%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20print!(%22%7B%7D%20%22%2C%20n)%3B%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%20%20println!()%3B%0A%7D"><pre><code class="language-rust">fn is_prime(n: u64) -&gt; bool {
    // TODO
    false
}

fn main() {
    for n in 2..=50 {
        if is_prime(n) {
            print!("{} ", n);
        }
    }
    println!();
}</code></pre></div>
<h2 id="练习三数字反转">练习三：数字反转</h2>
<p>实现函数 <code>reverse_number</code>，将一个正整数各位数字反转后返回：</p>
<ul>
<li>12345 → 54321</li>
<li>1000 → 1（前导零自动省略）</li>
<li>7 → 7</li>
</ul>
<blockquote>
<p><strong>提示</strong>：每轮取出 <code>n</code> 的最后一位（<code>n % 10</code>），追加到结果（<code>result = result * 10 + 个位</code>），然后 <code>n /= 10</code>，直到 <code>n == 0</code>。</p>
</blockquote>
<div class="code-editor" data-block-id="02-basic-syntax/09-practice#0:2" data-expect-mode="literal" data-expect-pattern="54321%0A1%0A7%0A321" data-starter-code="fn%20reverse_number(mut%20n%3A%20u64)%20-%3E%20u64%20%7B%0A%20%20%20%20let%20mut%20result%3A%20u64%20%3D%200%3B%0A%20%20%20%20%2F%2F%20TODO%0A%20%20%20%20result%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20reverse_number(12345))%3B%20%2F%2F%2054321%0A%20%20%20%20println!(%22%7B%7D%22%2C%20reverse_number(1000))%3B%20%20%2F%2F%201%0A%20%20%20%20println!(%22%7B%7D%22%2C%20reverse_number(7))%3B%20%20%20%20%20%2F%2F%207%0A%20%20%20%20println!(%22%7B%7D%22%2C%20reverse_number(123))%3B%20%20%20%2F%2F%20321%0A%7D"><pre><code class="language-rust">fn reverse_number(mut n: u64) -&gt; u64 {
    let mut result: u64 = 0;
    // TODO
    result
}

fn main() {
    println!("{}", reverse_number(12345)); // 54321
    println!("{}", reverse_number(1000));  // 1
    println!("{}", reverse_number(7));     // 7
    println!("{}", reverse_number(123));   // 321
}</code></pre></div>
<h2 id="练习四阶乘">练习四：阶乘</h2>
<p>实现函数 <code>factorial</code>，计算 n 的阶乘（n! = n × (n-1) × (n-2) × … × 1）。</p>
<ul>
<li>0! = 1</li>
<li>5! = 120</li>
<li>10! = 3,628,800</li>
</ul>
<blockquote>
<p><strong>提示</strong>：可以用递归实现：</p>
<ul>
<li>当 <code>n == 0</code> 时，返回 1</li>
<li>否则，返回 <code>n * factorial(n - 1)</code></li>
</ul>
<p>或者用循环实现，初始化结果为 1，然后 <code>result *= i</code>，i 从 2 到 n。</p>
</blockquote>
<div class="code-editor" data-block-id="02-basic-syntax/09-practice#0:3" data-expect-mode="literal" data-expect-pattern="1%0A120%0A3628800%0A1" data-starter-code="fn%20factorial(n%3A%20u32)%20-%3E%20u32%20%7B%0A%20%20%20%20%2F%2F%20TODO%0A%20%20%20%200%0A%7D%0A%0Afn%20main()%20%7B%0A%20%20%20%20println!(%22%7B%7D%22%2C%20factorial(0))%3B%20%20%2F%2F%201%0A%20%20%20%20println!(%22%7B%7D%22%2C%20factorial(5))%3B%20%20%2F%2F%20120%0A%20%20%20%20println!(%22%7B%7D%22%2C%20factorial(10))%3B%20%2F%2F%203628800%0A%20%20%20%20println!(%22%7B%7D%22%2C%20factorial(1))%3B%20%20%2F%2F%201%0A%7D"><pre><code class="language-rust">fn factorial(n: u32) -&gt; u32 {
    // TODO
    0
}

fn main() {
    println!("{}", factorial(0));  // 1
    println!("{}", factorial(5));  // 120
    println!("{}", factorial(10)); // 3628800
    println!("{}", factorial(1));  // 1
}</code></pre></div>
<h2 id="练习五冒泡排序">练习五：冒泡排序</h2>
<p>对数组 <code>[64, 34, 25, 12, 22, 11, 90]</code> 实现<strong>冒泡排序</strong>，打印排序后的结果。</p>
<p>冒泡排序：多趟遍历数组，每趟将相邻两个顺序错误的元素交换，每趟结束后最大值”冒泡”到末尾。经过 <code>n-1</code> 趟后排序完成。</p>
<blockquote>
<p><strong>提示</strong>：交换数组中的两个元素可以用 <code>arr.swap(i, j)</code>，也可以用临时变量：</p>
<pre><code class="language-rust">let temp = arr[i];
arr[i] = arr[j];
arr[j] = temp;</code></pre>
<p>外层循环控制趟数（0..n-1），内层循环控制比较范围（0..n-1-i）。</p>
</blockquote>
<div class="code-editor" data-block-id="02-basic-syntax/09-practice#0:4" data-expect-mode="literal" data-expect-pattern="%5B11%2C%2012%2C%2022%2C%2025%2C%2034%2C%2064%2C%2090%5D" data-starter-code="fn%20main()%20%7B%0A%20%20%20%20let%20mut%20arr%20%3D%20%5B64%2C%2034%2C%2025%2C%2012%2C%2022%2C%2011%2C%2090%5D%3B%0A%20%20%20%20let%20n%20%3D%20arr.len()%3B%0A%0A%20%20%20%20%2F%2F%20TODO%EF%BC%9A%E5%AE%9E%E7%8E%B0%E5%86%92%E6%B3%A1%E6%8E%92%E5%BA%8F%0A%0A%20%20%20%20println!(%22%7B%3A%3F%7D%22%2C%20arr)%3B%0A%7D"><pre><code class="language-rust">fn main() {
    let mut arr = [64, 34, 25, 12, 22, 11, 90];
    let n = arr.len();

    // TODO：实现冒泡排序

    println!("{:?}", arr);
}</code></pre></div> 