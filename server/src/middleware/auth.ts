import {
  setAuthenticatedPrincipal,
  type AuthenticatedPrincipal,
} from "../types/request-context";
import { parseBearerToken, verifyJwt } from "../utils/jwt";

export interface AuthMiddlewareConfig {
  jwtSecret: string;
  issuer?: string;
  audience?: string;
  publicPaths: string[];
}

function unauthorized(message: string): Response {
  return Response.json(
    {
      code: "UNAUTHORIZED",
      message,
    },
    { status: 401 },
  );
}

export function resolveAuthConfig(env: Record<string, string | undefined>): AuthMiddlewareConfig {
  const jwtSecret = env.JWT_SECRET ?? "dev-secret-change-me";

  return {
    jwtSecret,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    publicPaths: ["/api/health", "/api/dev/token"],
  };
}

function isPublicPath(request: Request, publicPaths: string[]): boolean {
  const pathname = new URL(request.url).pathname;
  return publicPaths.some((path) => pathname === path);
}

export async function authMiddleware(
  request: Request,
  config: AuthMiddlewareConfig,
): Promise<Response | void> {
  if (isPublicPath(request, config.publicPaths)) {
    return;
  }

  const bearerToken = parseBearerToken(request.headers.get("authorization"));
  if (!bearerToken) {
    return unauthorized("Missing bearer token");
  }

  try {
    const claims = await verifyJwt(bearerToken, {
      secret: config.jwtSecret,
      issuer: config.issuer,
      audience: config.audience,
    });

    const principal: AuthenticatedPrincipal = {
      userId: claims.sub,
      tenantId: claims.tenantId,
      roles: claims.roles,
      token: bearerToken,
    };
    setAuthenticatedPrincipal(request, principal);
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid token";
    return unauthorized(message);
  }
}
