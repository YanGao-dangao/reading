export interface JwtClaims {
  sub: string;
  tenantId: string;
  roles: string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  iss?: string;
  aud?: string | string[];
}

export interface JwtVerifyOptions {
  secret: string;
  issuer?: string;
  audience?: string;
  clockToleranceSec?: number;
}

export interface JwtSignOptions {
  secret: string;
  expiresInSec?: number;
  issuer?: string;
  audience?: string;
}

interface RawJwtPayload {
  [key: string]: unknown;
}

function decodeBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = normalized + (pad === 0 ? "" : "=".repeat(4 - pad));
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signHs256(signingInput: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );
  return toBase64Url(new Uint8Array(signatureBuffer));
}

async function verifyHs256Signature(
  signingInput: string,
  signatureB64Url: string,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const expectedBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );
  const expected = new Uint8Array(expectedBuffer);
  const actual = decodeBase64Url(signatureB64Url);
  return timingSafeEqual(expected, actual);
}

function ensureAudience(aud: unknown, expected?: string): void {
  if (!expected) return;
  if (typeof aud === "string" && aud === expected) return;
  if (Array.isArray(aud) && aud.includes(expected)) return;
  throw new Error("Invalid JWT audience");
}

function normalizeClaims(payload: RawJwtPayload): JwtClaims {
  const sub = String(payload.sub ?? "");
  const tenantId = String(payload.tenant_id ?? payload.tenantId ?? "");
  const rawRoles = payload.roles;
  const roles = Array.isArray(rawRoles)
    ? rawRoles.map((item) => String(item))
    : [];

  if (!sub) throw new Error("Missing JWT sub");
  if (!tenantId) throw new Error("Missing JWT tenant_id");

  return {
    sub,
    tenantId,
    roles,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
    nbf: typeof payload.nbf === "number" ? payload.nbf : undefined,
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
    iss: typeof payload.iss === "string" ? payload.iss : undefined,
    aud: typeof payload.aud === "string" || Array.isArray(payload.aud)
      ? (payload.aud as string | string[])
      : undefined,
  };
}

export function parseBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.trim().split(/\s+/, 2);
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token;
}

export async function verifyJwt(
  token: string,
  options: JwtVerifyOptions,
): Promise<JwtClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed JWT");
  }
  const [headerB64, payloadB64, signatureB64] = parts;

  const headerJson = new TextDecoder().decode(decodeBase64Url(headerB64));
  const payloadJson = new TextDecoder().decode(decodeBase64Url(payloadB64));
  const header = JSON.parse(headerJson) as { alg?: string };
  const payload = JSON.parse(payloadJson) as RawJwtPayload;

  if (header.alg !== "HS256") {
    throw new Error("Unsupported JWT algorithm");
  }

  const isSignatureValid = await verifyHs256Signature(
    `${headerB64}.${payloadB64}`,
    signatureB64,
    options.secret,
  );
  if (!isSignatureValid) {
    throw new Error("Invalid JWT signature");
  }

  const claims = normalizeClaims(payload);
  const now = Math.floor(Date.now() / 1000);
  const tolerance = options.clockToleranceSec ?? 30;

  if (claims.nbf && now + tolerance < claims.nbf) {
    throw new Error("JWT not active yet");
  }
  if (claims.exp && now - tolerance > claims.exp) {
    throw new Error("JWT expired");
  }
  if (options.issuer && claims.iss !== options.issuer) {
    throw new Error("Invalid JWT issuer");
  }
  ensureAudience(claims.aud, options.audience);
  return claims;
}

export async function signJwt(
  payload: Record<string, unknown>,
  options: JwtSignOptions,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (options.expiresInSec ?? 3600);
  const header = { alg: "HS256", typ: "JWT" };
  const claims: Record<string, unknown> = {
    ...payload,
    iat: now,
    exp,
  };
  if (options.issuer) claims.iss = options.issuer;
  if (options.audience) claims.aud = options.audience;

  const headerB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = await signHs256(`${headerB64}.${payloadB64}`, options.secret);
  return `${headerB64}.${payloadB64}.${signature}`;
}
