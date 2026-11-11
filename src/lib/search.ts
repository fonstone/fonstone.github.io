/** 静态搜索的纯函数部分，服务端与客户端都可安全引用（无 Node API）。 */

export type SearchEntry = {
  id: string;
  type: "article" | "chapter";
  title: string;
  href: string;
  category: string;
  course?: string;
  date: string;
  description: string;
  tags: string[];
  body: string;
};

export type SearchIndex = { entries: SearchEntry[] };

export const SEARCH_INDEX_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search-index.json`;

let cachedIndex: Promise<SearchIndex> | null = null;

export function loadSearchIndex(): Promise<SearchIndex> {
  if (!cachedIndex) {
    cachedIndex = fetch(SEARCH_INDEX_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`索引加载失败 ${res.status}`);
        return res.json() as Promise<SearchIndex>;
      })
      .catch((error) => {
        cachedIndex = null;
        throw error;
      });
  }
  return cachedIndex;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ");
}

/** 标题、标签、摘要、正文分级计分；多词查询要求每个词都有落点 */
export function scoreEntry(entry: SearchEntry, query: string): number {
  const terms = normalize(query).split(" ").filter(Boolean);
  if (terms.length === 0) return 0;

  const title = normalize(entry.title);
  const tags = normalize(entry.tags.join(" "));
  const description = normalize(entry.description);
  const body = normalize(entry.body);

  let score = 0;
  for (const term of terms) {
    let termScore = 0;
    if (title.includes(term)) termScore += title.startsWith(term) ? 16 : 12;
    if (tags.includes(term)) termScore += 6;
    if (description.includes(term)) termScore += 4;
    if (body.includes(term)) termScore += 1;
    if (termScore === 0) return 0;
    score += termScore;
  }
  // 文章优先于章节，标题完全命中再加一点
  if (entry.type === "article") score += 1;
  if (title === normalize(query)) score += 10;
  return score;
}

export function searchEntries(
  entries: SearchEntry[],
  query: string,
  options: { type?: "all" | "article" | "chapter"; limit?: number } = {}
): SearchEntry[] {
  const { type = "all", limit = 30 } = options;
  const q = query.trim();
  if (!q) {
    return entries
      .filter((e) => type === "all" || e.type === type)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, limit);
  }
  return entries
    .filter((e) => type === "all" || e.type === type)
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date))
    .slice(0, limit)
    .map((item) => item.entry);
}

export function snippet(entry: SearchEntry, query: string, length = 96): string {
  const q = query.trim().split(/\s+/)[0]?.toLowerCase();
  const source = entry.description || entry.body;
  if (!q) return source.slice(0, length);
  const at = source.toLowerCase().indexOf(q);
  if (at < 0) return source.slice(0, length);
  const start = Math.max(0, at - 24);
  return `${start > 0 ? "…" : ""}${source.slice(start, start + length)}${start + length < source.length ? "…" : ""}`;
}
