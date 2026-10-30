import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Handler } from "./index";
import type { Service } from "../../../service";

describe("Page SEO preview HTTP contract", () => {
  const preview = jest.fn();
  const handler = new Handler({ seo: { preview } } as unknown as Service);
  const app = new Hono();
  app.post("/seo-preview", (c) => handler.execute(c));
  app.onError((error, c) =>
    c.json(
      { error: error.message },
      error instanceof HTTPException ? error.status : 500,
    ),
  );
  const draft = {
    url: "/ru/blog/one",
    language: "ru",
    metadata: { title: "[blog.articles.title]" },
  };
  const request = (data: unknown) =>
    app.request("/seo-preview", { method: "POST", body: JSON.stringify(data) });

  beforeEach(() => jest.resetAllMocks());
  it("returns the computed draft in the API data envelope without cache or indexing", async () => {
    preview.mockResolvedValue({
      metadata: { title: "Статья" },
      structuredData: [],
    });
    const response = await request(draft);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(preview).toHaveBeenCalledWith(draft);
    expect((await response.json()).data.metadata.title).toBe("Статья");
  });
  it("rejects invalid masks, JSON and oversized input before calling the service", async () => {
    expect(
      (await request({ ...draft, metadata: { title: "[invalid" } })).status,
    ).toBe(400);
    expect(
      (await app.request("/seo-preview", { method: "POST", body: "{" })).status,
    ).toBe(400);
    expect(
      (await request({ ...draft, metadata: { title: "x".repeat(65536) } }))
        .status,
    ).toBe(413);
    expect(preview).not.toHaveBeenCalled();
  });
  it("maps absence to 404 and hides upstream failure details", async () => {
    preview.mockRejectedValueOnce(
      new Error("Not Found error. Public page not found"),
    );
    expect((await request(draft)).status).toBe(404);
    preview.mockRejectedValueOnce(new Error("offline with internal details"));
    const response = await request(draft);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Preview is temporarily unavailable",
    });
  });
});
