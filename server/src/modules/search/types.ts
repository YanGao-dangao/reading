export interface SearchBookItem {
  id: string;
  title: string;
  author: string;
  description: string;
  source: "tavily" | "fallback";
}

export interface SearchBooksResult {
  items: SearchBookItem[];
  isFallback: boolean;
}

export interface SearchProvider {
  searchByTitle(query: string): Promise<SearchBooksResult>;
}
