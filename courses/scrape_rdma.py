#!/usr/bin/env python3
import os, re, time, requests, html2text
from urllib.parse import urlparse
from bs4 import BeautifulSoup

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(OUTPUT_DIR, 'images')
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
session = requests.Session()
session.headers.update(HEADERS)

def safe(s): return re.sub(r'[\\/:*?"<>|]', '_', s).strip()[:100]

def fetch(url, t=30):
    for _ in range(3):
        try:
            r = session.get(url, timeout=t)
            if r.status_code == 200: return r
        except: pass
        time.sleep(2)
    return None

def dl_img(url):
    if not url or url.startswith('data:'): return None
    if url.startswith('//'): url = 'https:' + url
    fn = os.path.basename(urlparse(url).path).split('?')[0]
    if not fn or len(fn) < 5: fn = f"img_{abs(hash(url))%100000}.png"
    lp = os.path.join(IMAGES_DIR, fn)
    if os.path.exists(lp): return lp
    os.makedirs(IMAGES_DIR, exist_ok=True)
    try:
        r = session.get(url, timeout=15)
        if r.status_code == 200:
            with open(lp, 'wb') as f: f.write(r.content)
            return lp
    except: pass
    return None

def csdn(url):
    r = fetch(url)
    if not r: return None, None
    s = BeautifulSoup(r.text, 'html.parser')
    c = s.find('div', id='content_views') or s.find('div', class_='article_content') or s.find('div', class_='htmledit_views')
    if not c: return None, None
    t = s.find('h1', class_='title-article')
    t = t.get_text(strip=True) if t else (s.find('title').get_text(strip=True) if s.find('title') else 'Untitled')
    for tag in c.find_all(['script','style','aside']): tag.decompose()
    return t, c

def cnb(url):
    r = fetch(url)
    if not r: return None, None
    s = BeautifulSoup(r.text, 'html.parser')
    c = s.find('div', id='cnblogs_post_body') or s.find('div', class_='postbody') or s.find('div', id='post_detail')
    if not c: return None, None
    t = s.find('h1')
    t = t.get_text(strip=True) if t else (s.find('title').get_text(strip=True) if s.find('title') else 'Untitled')
    for tag in c.find_all(['script','style','aside']): tag.decompose()
    return t, c

def to_md(elem):
    h = html2text.HTML2Text()
    h.body_width = 0; h.ignore_links = False; h.ignore_images = False
    h.ignore_tables = False; h.unicode_snob = True; h.mark_code = True
    h.images_to_alt = False
    return h.handle(str(elem))

ARTICLES = [
    ("00","专栏索引","https://zhuanlan.zhihu.com/p/164908617","",""),
    ("01","RDMA概述","https://zhuanlan.zhihu.com/p/138874738","https://blog.csdn.net/bandaoyu/article/details/112859853",""),
    ("02","比较基于Socket与RDMA的通信","https://zhuanlan.zhihu.com/p/139548242","https://blog.csdn.net/bandaoyu/article/details/112861399","https://www.cnblogs.com/bandaoyu/p/16752336.html"),
    ("03","RDMA基本元素","https://zhuanlan.zhihu.com/p/141267386","https://blog.csdn.net/bandaoyu/article/details/112861431","https://www.cnblogs.com/bandaoyu/p/16752335.html"),
    ("04","RDMA操作类型","https://zhuanlan.zhihu.com/p/142175657","https://blog.csdn.net/bandaoyu/article/details/112861454","https://www.cnblogs.com/bandaoyu/p/16752341.html"),
    ("05","RDMA基本服务类型","https://zhuanlan.zhihu.com/p/144099636","https://blog.csdn.net/bandaoyu/article/details/112861469","https://www.cnblogs.com/bandaoyu/p/16752334.html"),
    ("06","RDMA之Memory Region","https://zhuanlan.zhihu.com/p/156975042","https://blog.csdn.net/bandaoyu/article/details/112861488","https://www.cnblogs.com/bandaoyu/p/16752338.html"),
    ("07","RDMA之Protection Domain","https://zhuanlan.zhihu.com/p/159493100","https://blog.csdn.net/bandaoyu/article/details/113115845","https://www.cnblogs.com/bandaoyu/p/16752331.html"),
    ("08","RDMA之Address Handle","https://zhuanlan.zhihu.com/p/163552044","https://blog.csdn.net/bandaoyu/article/details/113116613","https://www.cnblogs.com/bandaoyu/p/16752330.html"),
    ("09","RDMA之Queue Pair","https://zhuanlan.zhihu.com/p/195757767","https://blog.csdn.net/bandaoyu/article/details/113118302","https://www.cnblogs.com/bandaoyu/p/16752329.html"),
    ("10","RDMA之Completion Queue","https://zhuanlan.zhihu.com/p/259650980","",""),
    ("11","RDMA之Shared Receive Queue","https://zhuanlan.zhihu.com/p/279904125","https://blog.csdn.net/bandaoyu/article/details/113120391","https://www.cnblogs.com/bandaoyu/p/16752328.html"),
    ("12","RDMA之Memory Window","https://zhuanlan.zhihu.com/p/353590347","https://blog.csdn.net/bandaoyu/article/details/120485072",""),
    ("13","RDMA之Verbs","https://zhuanlan.zhihu.com/p/329198771","https://blog.csdn.net/bandaoyu/article/details/113125244","https://www.cnblogs.com/bandaoyu/p/16752342.html"),
    ("14","RDMA之用户态与内核态交互","https://zhuanlan.zhihu.com/p/346708569","https://blog.csdn.net/bandaoyu/article/details/113125473","https://www.cnblogs.com/bandaoyu/p/16752326.html"),
    ("15","Soft-RoCE","https://zhuanlan.zhihu.com/p/361740115","https://blog.csdn.net/bandaoyu/article/details/120485632","https://www.cnblogs.com/bandaoyu/p/16752136.html"),
    ("16","Pyverbs Python Verbs","https://zhuanlan.zhihu.com/p/455174484","",""),
    ("17","内存地址基础知识","https://zhuanlan.zhihu.com/p/463199854","",""),
    ("18","Queue Buffer","https://zhuanlan.zhihu.com/p/565736840","",""),
    ("19","用户态Memory Region Buffer","https://zhuanlan.zhihu.com/p/642286038","",""),
    ("20","iWARP概述","https://zhuanlan.zhihu.com/p/449189540","","https://www.cnblogs.com/bandaoyu/p/16752012.html"),
    ("21","iWARP之DDP","https://zhuanlan.zhihu.com/p/408817872","https://blog.csdn.net/bandaoyu/article/details/120485693",""),
    ("22","iWARP之RDMAP","https://zhuanlan.zhihu.com/p/421211722","",""),
    ("23","iWARP之MPA","https://zhuanlan.zhihu.com/p/435467605","",""),
    ("24","Socket建链","https://zhuanlan.zhihu.com/p/476407641","",""),
    ("25","CM建链","https://zhuanlan.zhihu.com/p/494826608","",""),
]

def scrape(num, title, zurl, csdn_url, cnb_url):
    print(f"\n[{num}] {title}")
    content, source = None, None
    if csdn_url:
        t, c = csdn(csdn_url)
        if c: content, source = str(c), f'CSDN'; title = t if t and 'Untitled' not in t else title
    if not content and cnb_url:
        t, c = cnb(cnb_url)
        if c: content, source = str(c), f'cnblogs'; title = t if t else title
    if not content:
        print(f"  FAILED"); return None, None
    
    tc = re.sub(r'^【[^】]*】\s*', '', title)
    soup = BeautifulSoup(content, 'html.parser')
    for img in soup.find_all('img'):
        src = img.get('src') or img.get('data-src') or ''
        if src:
            if src.startswith('//'): src = 'https:' + src
            lp = dl_img(src)
            if lp: img['src'] = os.path.relpath(lp, OUTPUT_DIR)
    md = to_md(soup)
    lines = [l for l in md.split('\n') if not (l.strip().startswith('[') and ']:' in l.strip())]
    md = '\n'.join(lines)
    hdr = f"# {num}. {tc}\n\n> 原文: [{zurl}]({zurl})  |  来源: {source}\n\n---\n\n"
    fp = os.path.join(OUTPUT_DIR, f"{safe(f'{num}_{tc}')}.md")
    with open(fp, 'w', encoding='utf-8') as f: f.write(hdr + md)
    ic = len(re.findall(r'!\[.*?\]\(.*?\)', md))
    print(f"  Saved ({len(hdr+md)} chars, {ic} imgs)")
    return fp, tc

results = []
for n, t, z, c, b in ARTICLES:
    p, ct = scrape(n, t, z, c, b)
    results.append((n, ct or t, z, p))
    time.sleep(1.5)

summary = "# 《RDMA杂谈》专栏文章\n\n> 抓取自知乎专栏，因知乎 403 故从 CSDN/博客园镜像获取。\n\n| # | 标题 | 状态 | 原文 |\n|---|------|------|------|\n"
for n, t, z, p in results:
    f = os.path.basename(p) if p else ''
    s = "✅" if p else "❌"
    summary += f"| {n} | {'['+t+']('+f+')' if p else t} | {s} | [知乎]({z}) |\n"

ok = sum(1 for r in results if r[3])
summary += f"\n---\n> 成功: {ok}/{len(results)} | 时间: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
with open(os.path.join(OUTPUT_DIR, 'README.md'), 'w', encoding='utf-8') as f: f.write(summary)
print(f"\nDone: {ok}/{len(results)}")
