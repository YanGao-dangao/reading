import type {
  RequestIdentity,
  SearchHistoryQuery,
  SearchHistoryRecord,
} from "./read.types";

function keyOf(identity: RequestIdentity): string {
  return `${identity.tenantId}:${identity.userId}`;
}

export class ReadRepository {
  private readonly historyStore = new Map<string, SearchHistoryRecord[]>();

  public saveSearchHistory(
    identity: RequestIdentity,
    payload: { query: string; bookId?: string; bookTitle?: string },
  ): SearchHistoryRecord {
    const key = keyOf(identity);
    const previous = this.historyStore.get(key) ?? [];
    const record: SearchHistoryRecord = {
      id: crypto.randomUUID(),
      tenantId: identity.tenantId,
      userId: identity.userId,
      query: payload.query,
      bookId: payload.bookId,
      bookTitle: payload.bookTitle,
      createdAt: new Date().toISOString(),
    };

    const next = [record, ...previous].slice(0, 50);
    this.historyStore.set(key, next);
    return record;
  }

  public listSearchHistory(
    identity: RequestIdentity,
    query: SearchHistoryQuery,
  ): SearchHistoryRecord[] {
    const key = keyOf(identity);
    const records = this.historyStore.get(key) ?? [];
    const offset = Math.max(0, query.offset ?? 0);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    return records.slice(offset, offset + limit);
  }
}
