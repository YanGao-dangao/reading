export interface EnvConfig {
  nodeEnv: string;
  port: number;
  jwtSecret: string;
  jwtIssuer?: string;
  jwtAudience?: string;
  tavilyApiKey?: string;
}

export function getEnvConfig(
  env: Record<string, string | undefined>,
): EnvConfig {
  const nodeEnv = env.NODE_ENV ?? "development";
  return {
    nodeEnv,
    port: Number(env.PORT ?? 3101),
    jwtSecret: env.JWT_SECRET ?? "dev-secret-change-me",
    jwtIssuer: env.JWT_ISSUER,
    jwtAudience: env.JWT_AUDIENCE,
    tavilyApiKey: env.TAVILY_API_KEY,
  };
}
