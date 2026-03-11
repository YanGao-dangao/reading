import type { RequestIdentity } from "../read/read.types";

export interface OutlineNode {
  id: string;
  title: string;
  children?: OutlineNode[];
}

export interface BookOutlineRecord {
  tenantId: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  outline: OutlineNode[];
  updatedAt: string;
}

function recordKey(identity: RequestIdentity, bookId: string): string {
  return `${identity.tenantId}:${identity.userId}:${bookId}`;
}

export class OutlineRepository {
  private readonly store = new Map<string, BookOutlineRecord>();

  public saveOutline(record: BookOutlineRecord): BookOutlineRecord {
    const key = recordKey(
      { tenantId: record.tenantId, userId: record.userId },
      record.bookId,
    );
    const next: BookOutlineRecord = {
      ...record,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(key, next);
    return next;
  }

  public getOutline(identity: RequestIdentity, bookId: string): BookOutlineRecord | null {
    const key = recordKey(identity, bookId);
    return this.store.get(key) ?? null;
  }
}
