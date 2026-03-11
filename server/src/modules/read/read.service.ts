import { SearchService } from "../search/search.service";
import { ReadRepository } from "./read.repository";
import type { RequestIdentity } from "./read.types";

export class ReadService {
  public constructor(
    private readonly searchService: SearchService,
    private readonly readRepository: ReadRepository,
  ) {}

  public async searchBooks(identity: RequestIdentity, rawQuery: string) {
    const query = rawQuery.trim();
    if (!query) {
      throw new Error("请输入书名");
    }
    if (query.length > 120) {
      throw new Error("书名长度不能超过 120");
    }

    const result = await this.searchService.searchBooks(query);
    this.readRepository.saveSearchHistory(identity, {
      query,
      bookId: result.items[0]?.id,
      bookTitle: result.items[0]?.title,
    });
    return result;
  }

  public listBooksHistory(identity: RequestIdentity, limit?: number, offset?: number) {
    return this.readRepository.listSearchHistory(identity, {
      limit,
      offset,
    });
  }
}
