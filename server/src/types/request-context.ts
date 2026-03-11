export interface AuthenticatedPrincipal {
  userId: string;
  tenantId: string;
  roles: string[];
  token: string;
}

export interface RequestContextState {
  requestId: string;
  auth?: AuthenticatedPrincipal;
}

const requestContextStore = new WeakMap<Request, RequestContextState>();

function createRequestId(): string {
  return crypto.randomUUID();
}

export function initRequestContext(request: Request): RequestContextState {
  const existing = requestContextStore.get(request);
  if (existing) {
    return existing;
  }

  const state: RequestContextState = {
    requestId: createRequestId(),
  };
  requestContextStore.set(request, state);
  return state;
}

export function getRequestContext(request: Request): RequestContextState {
  return initRequestContext(request);
}

export function setAuthenticatedPrincipal(
  request: Request,
  principal: AuthenticatedPrincipal,
): RequestContextState {
  const state = initRequestContext(request);
  state.auth = principal;
  return state;
}
