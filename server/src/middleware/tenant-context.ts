import { getRequestContext } from "../types/request-context";

function forbidden(message: string): Response {
  return Response.json(
    {
      code: "FORBIDDEN",
      message,
    },
    { status: 403 },
  );
}

export interface TenantContext {
  tenantId: string;
  userId: string;
}

export function tenantContextMiddleware(request: Request): Response | void {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api/health" || pathname === "/api/dev/token") {
    return;
  }

  const context = getRequestContext(request);
  if (!context.auth) {
    return forbidden("Missing authentication context");
  }
  if (!context.auth.tenantId) {
    return forbidden("Missing tenant context");
  }
  return;
}

export function requireTenantContext(request: Request): TenantContext {
  const context = getRequestContext(request);
  if (!context.auth?.tenantId || !context.auth.userId) {
    throw new Error("Tenant context is required");
  }
  return {
    tenantId: context.auth.tenantId,
    userId: context.auth.userId,
  };
}
