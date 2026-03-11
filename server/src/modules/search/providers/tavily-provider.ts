import type { SearchBookItem, SearchBooksResult, SearchProvider } from "../types";

interface TavilyResponse {
  results?: Array<{
    title?: string;
    content?: string;
    url?: string;
  }>;
}

const FALLBACK_BOOKS: SearchBookItem[] = [
  {
    id: "fallback-csapp",
    title: "深入理解计算机系统",
    author: "未知作者",
    description: "经典计算机系统书籍，覆盖程序、体系结构、存储与操作系统核心内容。",
    source: "fallback",
  },
  {
    id: "fallback-zero-to-one",
    title: "从零到一",
    author: "Peter Thiel",
    description: "创业与创新方法论，强调从 0 到 1 的非共识创新价值。",
    source: "fallback",
  },
];

function extractAuthorFromContent(content: string): string {
  const match = content.match(/作者[:：]\s*([^\n，。]+)/);
  return match?.[1]?.trim() ?? "未知作者";
}

function toBookItem(result: { title?: string; content?: string; url?: string }, index: number): SearchBookItem {
  const title = result.title?.trim() || `候选书籍 ${index + 1}`;
  const content = result.content?.trim() || "";
  return {
    id: `tavily-${index + 1}`,
    title,
    author: extractAuthorFromContent(content),
    description: content.slice(0, 180) || (result.url ?? "暂无描述"),
    source: "tavily",
  };
}

export class TavilySearchProvider implements SearchProvider {
  public constructor(private readonly apiKey?: string) {}

  public async searchByTitle(query: string): Promise<SearchBooksResult> {
    if (!this.apiKey) {
      return {
        items: FALLBACK_BOOKS,
        isFallback: true,
      };
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query: `图书 ${query} 书名 作者 简介`,
        search_depth: "basic",
        max_results: 5,
      }),
    });

    if (!response.ok) {
      return {
        items: FALLBACK_BOOKS,
        isFallback: true,
      };
    }

    const data = (await response.json()) as TavilyResponse;
    const rawResults = data.results ?? [];
    if (rawResults.length === 0) {
      return {
        items: FALLBACK_BOOKS,
        isFallback: true,
      };
    }

    return {
      items: rawResults.map(toBookItem),
      isFallback: false,
    };
  }
}
