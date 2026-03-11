export interface RequestIdentity {
  tenantId: string;
  userId: string;
}

export interface SearchHistoryRecord {
  id: string;
  tenantId: string;
  userId: string;
  query: string;
  bookId?: string;
  bookTitle?: string;
  createdAt: string;
}

export interface SearchHistoryQuery {
  limit?: number;
  offset?: number;
}
