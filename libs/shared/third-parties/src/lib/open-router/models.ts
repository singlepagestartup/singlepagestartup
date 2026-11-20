import type { IOpenRouterModel } from "./interface";

export const OPEN_ROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL_CACHE_TTL_MS = 5 * 60 * 1000;

interface IModelCatalog {
  expiresAt: number;
  models: IOpenRouterModel[];
}

const cachedCatalogs = new Map<string, IModelCatalog>();
const catalogRequests = new Map<string, Promise<IOpenRouterModel[]>>();

export async function getOpenRouterModels(
  baseURL = OPEN_ROUTER_BASE_URL,
  apiKey?: string,
): Promise<IOpenRouterModel[]> {
  const cacheKey = apiKey ? `${baseURL}:authenticated` : baseURL;
  const cached = cachedCatalogs.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.models;
  }

  const pending = catalogRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  const request = refreshModels(cacheKey, baseURL, apiKey);
  catalogRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    catalogRequests.delete(cacheKey);
  }
}

async function refreshModels(
  cacheKey: string,
  baseURL: string,
  apiKey?: string,
) {
  try {
    const models = await fetchModels(baseURL, apiKey);
    cachedCatalogs.set(cacheKey, {
      expiresAt: Date.now() + MODEL_CACHE_TTL_MS,
      models,
    });
    return models;
  } catch (error) {
    console.warn("OpenRouter models fetch failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    const cached = cachedCatalogs.get(cacheKey);
    if (cached) {
      return cached.models;
    }
    throw error;
  }
}

async function fetchModels(baseURL: string, apiKey?: string) {
  const response = await fetch(`${baseURL}/models`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
    signal: AbortSignal.timeout(apiKey ? 30_000 : 5_000),
  });

  if (!response.ok) {
    throw new Error(
      `OpenRouter models request failed (HTTP ${response.status}).`,
    );
  }

  const { data } = (await response.json()) as { data?: IOpenRouterModel[] };
  if (
    !Array.isArray(data) ||
    !data.length ||
    !data.every(
      (model) => model && typeof model.id === "string" && model.id.trim(),
    )
  ) {
    throw new Error("OpenRouter returned an invalid model catalog.");
  }

  return data;
}
