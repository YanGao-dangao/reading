import type { RequestIdentity } from "../read/read.types";

export interface GenerationRecord {
  id: string;
  tenantId: string;
  userId: string;
  bookId: string;
  mode: "brief" | "detailed" | "insights";
  style?: string;
  wordCount?: number;
  chapterIds: string[];
  content: string;
  createdAt: string;
}

function keyOf(identity: RequestIdentity, bookId: string): string {
  return `${identity.tenantId}:${identity.userId}:${bookId}`;
}

export class GenerationRepository {
  private readonly store = new Map<string, GenerationRecord[]>();

  public save(record: Omit<GenerationRecord, "id" | "createdAt">): GenerationRecord {
    const key = keyOf(
      { tenantId: record.tenantId, userId: record.userId },
      record.bookId,
    );
    const full: GenerationRecord = {
      ...record,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const list = this.store.get(key) ?? [];
    list.unshift(full);
    this.store.set(key, list.slice(0, 20));
    return full;
  }

  public list(
    identity: RequestIdentity,
    bookId: string,
    limit = 10,
  ): GenerationRecord[] {
    const key = keyOf(identity, bookId);
    return (this.store.get(key) ?? []).slice(0, limit);
  }

  public get(
    identity: RequestIdentity,
    generationId: string,
  ): GenerationRecord | null {
    for (const list of this.store.values()) {
      const found = list.find(
        (r) =>
          r.id === generationId &&
          r.tenantId === identity.tenantId &&
          r.userId === identity.userId,
      );
      if (found) return found;
    }
    return null;
  }
}
