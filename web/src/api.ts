import axios from "axios";

export interface SearchItem {
  id: string;
  title: string;
  author: string;
  description: string;
  source: "tavily" | "fallback";
}

export interface SearchResult {
  items: SearchItem[];
  isFallback: boolean;
}

export interface SearchHistoryItem {
  id: string;
  tenantId: string;
  userId: string;
  query: string;
  bookId?: string;
  bookTitle?: string;
  createdAt: string;
}

export interface OutlineNode {
  id: string;
  title: string;
  children?: OutlineNode[];
}

export interface OutlineRecord {
  tenantId: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  outline: OutlineNode[];
  updatedAt: string;
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:3101",
  timeout: 15000,
});

let bearerToken = "";

function withAuthHeader() {
  return {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  };
}

export async function ensureToken(): Promise<string> {
  if (bearerToken) return bearerToken;
  const res = await client.get<{ code: string; data: { token: string } }>(
    "/api/dev/token",
  );
  bearerToken = res.data.data.token;
  return bearerToken;
}

export async function searchBooks(query: string): Promise<SearchResult> {
  await ensureToken();
  const res = await client.post<{ code: string; data: SearchResult }>(
    "/api/read/search",
    { query },
    withAuthHeader(),
  );
  return res.data.data;
}

export async function listHistory(limit = 10): Promise<SearchHistoryItem[]> {
  await ensureToken();
  const res = await client.get<{ code: string; data: SearchHistoryItem[] }>(
    `/api/read/books/history?limit=${limit}&offset=0`,
    withAuthHeader(),
  );
  return res.data.data;
}

export async function generateOutline(
  bookId: string,
  bookTitle: string,
): Promise<OutlineRecord> {
  await ensureToken();
  const res = await client.post<{ code: string; data: OutlineRecord }>(
    "/api/read/outline/generate",
    { bookId, bookTitle },
    withAuthHeader(),
  );
  return res.data.data;
}

export async function getOutline(bookId: string): Promise<OutlineRecord> {
  await ensureToken();
  const res = await client.get<{ code: string; data: OutlineRecord }>(
    `/api/read/books/${encodeURIComponent(bookId)}/outline`,
    withAuthHeader(),
  );
  return res.data.data;
}

export interface GenerationJobRequest {
  bookId: string;
  bookTitle: string;
  chapterIds: string[];
  chapterTitles: string[];
  mode: "brief" | "detailed" | "insights";
  params?: { style?: string; wordCount?: number };
}

export interface GenerationJobResponse {
  jobId: string;
  streamUrl: string;
  timeoutSec: number;
}

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

export async function createGenerationJob(
  payload: GenerationJobRequest,
): Promise<GenerationJobResponse> {
  await ensureToken();
  const res = await client.post<{ code: string; data: GenerationJobResponse }>(
    "/api/read/generation/jobs",
    payload,
    withAuthHeader(),
  );
  return res.data.data;
}

export function getStreamUrl(relativePath: string): string {
  const base = import.meta.env.VITE_API_BASE ?? "http://localhost:3101";
  return `${base}${relativePath}`;
}

export async function* streamGeneration(
  streamUrl: string,
): AsyncGenerator<{ event: string; data: unknown }> {
  const token = await ensureToken();
  const fullUrl = getStreamUrl(streamUrl);
  const res = await fetch(fullUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.body) throw new Error("No body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const block of lines) {
      const eventMatch = block.match(/^event:\s*(.+)$/m);
      const dataMatch = block.match(/^data:\s*(.+)$/m);
      if (eventMatch && dataMatch) {
        const event = eventMatch[1].trim();
        const data = JSON.parse(dataMatch[1].trim());
        yield { event, data };
      }
    }
  }
}

export async function listGenerations(
  bookId: string,
): Promise<GenerationRecord[]> {
  await ensureToken();
  const res = await client.get<{ code: string; data: GenerationRecord[] }>(
    `/api/read/books/${encodeURIComponent(bookId)}/generations`,
    withAuthHeader(),
  );
  return res.data.data;
}

export async function getGeneration(id: string): Promise<GenerationRecord> {
  await ensureToken();
  const res = await client.get<{ code: string; data: GenerationRecord }>(
    `/api/read/generations/${encodeURIComponent(id)}`,
    withAuthHeader(),
  );
  return res.data.data;
}
