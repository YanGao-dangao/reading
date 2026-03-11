import type { SearchProvider } from "./types";

export class SearchService {
  public constructor(private readonly provider: SearchProvider) {}

  public async searchBooks(query: string) {
    const normalized = query.trim();
    if (!normalized) {
      throw new Error("请输入书名");
    }
    return this.provider.searchByTitle(normalized);
  }
}
