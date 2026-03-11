import type { EnvConfig } from "../../config/env";
import type { SearchProvider } from "./types";
import { TavilySearchProvider } from "./providers/tavily-provider";

export function createSearchProvider(env: EnvConfig): SearchProvider {
  return new TavilySearchProvider(env.tavilyApiKey);
}
