import { getEnvConfig } from "./config/env";
import { authMiddleware, resolveAuthConfig } from "./middleware/auth";
import { requireTenantContext, tenantContextMiddleware } from "./middleware/tenant-context";
import {
  GenerationRepository,
  type GenerationRecord,
} from "./modules/generation/generation.repository";
import {
  mockBriefContent,
  mockDetailedContent,
  mockInsightsContent,
} from "./modules/generation/mock-content";
import { OutlineRepository } from "./modules/outline/outline.repository";
import { OutlineService } from "./modules/outline/outline.service";
import { ReadRepository } from "./modules/read/read.repository";
import { ReadService } from "./modules/read/read.service";
import { createSearchProvider } from "./modules/search/provider-factory";
import { SearchService } from "./modules/search/search.service";
import { signJwt } from "./utils/jwt";

const envConfig = getEnvConfig(process.env);
const authConfig = resolveAuthConfig(process.env);
const searchProvider = createSearchProvider(envConfig);
const searchService = new SearchService(searchProvider);
const readRepository = new ReadRepository();
const readService = new ReadService(searchService, readRepository);
const outlineRepository = new OutlineRepository();
const outlineService = new OutlineService(outlineRepository);
const generationRepository = new GenerationRepository();

interface GenerationJob {
  id: string;
  tenantId: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  mode: "brief" | "detailed" | "insights";
  style?: string;
  wordCount?: number;
  chapterIds: string[];
  chapterTitles: string[];
}
const jobStore = new Map<string, GenerationJob>();

function badRequest(message: string): Response {
  return Response.json(
    {
      code: "BAD_REQUEST",
      message,
    },
    { status: 400 },
  );
}

async function issueDevToken(): Promise<Response> {
  const allowInProd = process.env.ALLOW_DEV_TOKEN === "true";
  if (envConfig.nodeEnv === "production" && !allowInProd) {
    return Response.json(
      { code: "FORBIDDEN", message: "Disabled in production" },
      { status: 403 },
    );
  }

  const token = await signJwt(
    {
      sub: "demo-user",
      tenant_id: "demo-tenant",
      roles: ["admin"],
    },
    {
      secret: envConfig.jwtSecret,
      issuer: envConfig.jwtIssuer,
      audience: envConfig.jwtAudience,
    },
  );

  return Response.json({
    code: "OK",
    data: {
      token,
      authorization: `Bearer ${token}`,
    },
  });
}

Bun.serve({
  port: envConfig.port,
  async fetch(request) {
    const url = new URL(request.url);
    const { pathname } = url;
    const corsHeaders: Record<string, string> = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type,Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (pathname === "/api/health" && request.method === "GET") {
      return Response.json(
        { status: "ok" },
        {
          headers: corsHeaders,
        },
      );
    }

    if (pathname === "/api/dev/token" && request.method === "GET") {
      const response = await issueDevToken();
      Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    const authResult = await authMiddleware(request, authConfig);
    if (authResult) return authResult;
    const tenantResult = tenantContextMiddleware(request);
    if (tenantResult) return tenantResult;
    const identity = requireTenantContext(request);

    if (pathname === "/api/read/search" && request.method === "POST") {
      try {
        const body = (await request.json()) as { query?: string };
        const result = await readService.searchBooks(identity, body.query ?? "");
        return Response.json({
          code: "OK",
          data: result,
        }, { headers: corsHeaders });
      } catch (error) {
        const message = error instanceof Error ? error.message : "搜索失败";
        const response = badRequest(message);
        Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
        return response;
      }
    }

    if (pathname === "/api/read/books/history" && request.method === "GET") {
      const limit = Number(url.searchParams.get("limit") ?? 20);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const data = readService.listBooksHistory(identity, limit, offset);
      return Response.json({
        code: "OK",
        data,
      }, { headers: corsHeaders });
    }

    if (pathname === "/api/read/outline/generate" && request.method === "POST") {
      try {
        const body = (await request.json()) as { bookId?: string; bookTitle?: string };
        const data = outlineService.generateOutline(identity, {
          bookId: body.bookId ?? "",
          bookTitle: body.bookTitle ?? "",
        });
        return Response.json({
          code: "OK",
          data,
        }, { headers: corsHeaders });
      } catch (error) {
        const message = error instanceof Error ? error.message : "生成大纲失败";
        const response = badRequest(message);
        Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
        return response;
      }
    }

    const outlineMatch = pathname.match(/^\/api\/read\/books\/([^/]+)\/outline$/);
    if (outlineMatch && request.method === "GET") {
      const bookId = decodeURIComponent(outlineMatch[1]);
      const record = outlineService.getOutline(identity, bookId);
      if (!record) {
        return Response.json(
          { code: "NOT_FOUND", message: "未找到该书籍大纲" },
          { status: 404, headers: corsHeaders },
        );
      }
      return Response.json({
        code: "OK",
        data: record,
      }, { headers: corsHeaders });
    }

    if (pathname === "/api/read/generation/jobs" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          bookId?: string;
          bookTitle?: string;
          chapterIds?: string[];
          chapterTitles?: string[];
          mode?: "brief" | "detailed" | "insights";
          params?: { style?: string; wordCount?: number };
        };
        const bookId = (body.bookId ?? "").trim();
        const bookTitle = (body.bookTitle ?? "").trim();
        const chapterIds = Array.isArray(body.chapterIds) ? body.chapterIds : [];
        const chapterTitles = Array.isArray(body.chapterTitles) ? body.chapterTitles : chapterIds.map((id) => id);
        const mode = body.mode ?? "brief";
        const style = body.params?.style ?? "通俗易懂";
        const wordCount = body.params?.wordCount ?? 300;

        if (!bookId || chapterIds.length === 0) {
          const res = badRequest("bookId 和 chapterIds 不能为空");
          Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
          return res;
        }
        if (mode === "insights" && (wordCount < 100 || wordCount > 3000)) {
          const res = badRequest("字数范围 100-3000");
          Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
          return res;
        }

        const jobId = crypto.randomUUID();
        const job: GenerationJob = {
          id: jobId,
          tenantId: identity.tenantId,
          userId: identity.userId,
          bookId,
          bookTitle,
          mode,
          style: mode === "insights" ? style : undefined,
          wordCount: mode === "insights" ? wordCount : undefined,
          chapterIds,
          chapterTitles,
        };
        jobStore.set(jobId, job);

        return Response.json(
          {
            code: "OK",
            data: {
              jobId,
              streamUrl: `/api/read/generation/stream?jobId=${jobId}`,
              timeoutSec: 30,
            },
          },
          { headers: corsHeaders },
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "创建任务失败";
        const res = badRequest(msg);
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
    }

    const streamMatch = pathname.match(/^\/api\/read\/generation\/stream/);
    if (streamMatch && request.method === "GET") {
      const jobId = url.searchParams.get("jobId") ?? "";
      const job = jobStore.get(jobId);
      if (!job || job.tenantId !== identity.tenantId || job.userId !== identity.userId) {
        return Response.json(
          { code: "NOT_FOUND", message: "任务不存在" },
          { status: 404, headers: corsHeaders },
        );
      }

      const buildContent = (): string => {
        if (job.mode === "brief") {
          return job.chapterTitles.map((t) => mockBriefContent(t)).join("\n\n---\n\n");
        }
        if (job.mode === "detailed") {
          return job.chapterTitles.map((t) => mockDetailedContent(t)).join("\n\n---\n\n");
        }
        return mockInsightsContent(
          job.chapterTitles,
          job.style ?? "通俗易懂",
          job.wordCount ?? 300,
        );
      }

      const content = buildContent();
      const saved = generationRepository.save({
        tenantId: job.tenantId,
        userId: job.userId,
        bookId: job.bookId,
        mode: job.mode,
        style: job.style,
        wordCount: job.wordCount,
        chapterIds: job.chapterIds,
        content,
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = content.split(/(?<=[ \n])/);
          for (let i = 0; i < words.length; i += 2) {
            const chunk = words.slice(i, i + 2).join("");
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ jobId, chunk })}\n\n`));
            await new Promise((r) => setTimeout(r, 15 + Math.random() * 20));
          }
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ jobId, generationId: saved.id })}\n\n`));
          jobStore.delete(jobId);
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
        },
      });
    }

    const genListMatch = pathname.match(/^\/api\/read\/books\/([^/]+)\/generations$/);
    if (genListMatch && request.method === "GET") {
      const bookId = decodeURIComponent(genListMatch[1]);
      const list = generationRepository.list(identity, bookId);
      return Response.json({ code: "OK", data: list }, { headers: corsHeaders });
    }

    const genGetMatch = pathname.match(/^\/api\/read\/generations\/([^/]+)$/);
    if (genGetMatch && request.method === "GET") {
      const genId = genGetMatch[1];
      const gen = generationRepository.get(identity, genId);
      if (!gen) {
        return Response.json(
          { code: "NOT_FOUND", message: "未找到该生成记录" },
          { status: 404, headers: corsHeaders },
        );
      }
      return Response.json({ code: "OK", data: gen }, { headers: corsHeaders });
    }

    return Response.json(
      {
        code: "NOT_FOUND",
        message: "Not Found",
      },
      { status: 404, headers: corsHeaders },
    );
  },
});

console.log(`zhidu server listening on http://localhost:${envConfig.port}`);
