/**
 * BDD Suite: public URL SDK transport.
 * Given: URL enumeration returns data, an HTTP failure or malformed data.
 * When: the server SDK reads sitemap candidates.
 * Then: path segments survive without imposing Page languages and failures cannot look like an empty site.
 */
import { action } from "./urls";

const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
});

it("preserves the segment-array contract without Page language data", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(
    new Response(
      JSON.stringify({
        data: {
          urls: [{ url: "/" }, { url: "/blog/article" }],
        },
      }),
      { status: 200 },
    ),
  );
  await expect(action({ host: "https://api.example.test" })).resolves.toEqual([
    { url: [] },
    { url: ["blog", "article"] },
  ]);
  expect(global.fetch).toHaveBeenCalledWith(
    "https://api.example.test/api/host/pages/urls",
    { cache: "no-store" },
  );
});
it("propagates HTTP failures and only suppresses them when explicitly requested", async () => {
  (global.fetch as jest.Mock).mockImplementation(
    async () =>
      new Response(JSON.stringify({ message: "Unavailable" }), { status: 503 }),
  );
  await expect(action({})).rejects.toThrow();
  await expect(action({ catchErrors: true })).resolves.toBeUndefined();
});
it("distinguishes valid empty results from malformed upstream data", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce(
    new Response(JSON.stringify({ data: { urls: [] } })),
  );
  await expect(action({})).resolves.toEqual([]);
  (global.fetch as jest.Mock).mockResolvedValueOnce(
    new Response(JSON.stringify({ data: {} })),
  );
  await expect(action({})).rejects.toThrow(
    "Invalid page URL enumeration response",
  );
});
