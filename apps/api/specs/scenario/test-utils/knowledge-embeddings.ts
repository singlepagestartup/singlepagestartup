import { KNOWLEDGE_EMBEDDING_DIMENSIONS } from "@sps/knowledge/backend/app/api/src/lib/configuration";

export function embeddingResponse(url: unknown, init?: RequestInit) {
  expect(String(url)).toBe("https://api.openai.com/v1/embeddings");
  expect(new Headers(init?.headers).get("authorization")).toBe(
    "Bearer " + process.env.OPEN_AI_API_KEY,
  );
  const request = JSON.parse(String(init?.body));
  expect(request).toMatchObject({
    model: "text-embedding-3-large",
    dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
  });
  return Response.json({
    model: request.model,
    data: request.input.map((_text: string, index: number) => ({
      index,
      embedding: Array<number>(request.dimensions).fill(0.01),
    })),
    usage: {
      prompt_tokens: request.input.length,
      total_tokens: request.input.length,
    },
  });
}

export function useFixtureEmbeddings() {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.KNOWLEDGE_EMBEDDING_PROVIDER;
  beforeEach(() => {
    process.env.KNOWLEDGE_EMBEDDING_PROVIDER = "openai";
    globalThis.fetch = Object.assign(
      (url: Parameters<typeof fetch>[0], init?: RequestInit) => {
        if (String(url).endsWith("/embeddings")) {
          return Promise.resolve(embeddingResponse(url, init));
        }
        return originalFetch(url, init);
      },
      { preconnect: originalFetch.preconnect },
    );
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) {
      delete process.env.KNOWLEDGE_EMBEDDING_PROVIDER;
    } else {
      process.env.KNOWLEDGE_EMBEDDING_PROVIDER = originalProvider;
    }
  });
}
