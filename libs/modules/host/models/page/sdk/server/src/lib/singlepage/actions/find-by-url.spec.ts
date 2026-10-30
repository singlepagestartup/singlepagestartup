/**
 * BDD Suite: Page lookup failure semantics.
 * Given: a Page API response or network failure.
 * When: the server SDK looks up a route with silentNotFound enabled.
 * Then: only HTTP 404 becomes absence; server and transport failures remain errors.
 */
import { api } from "@sps/host/models/page/sdk/server";

const originalFetch = global.fetch;
const originalPhase = process.env.NEXT_PHASE;

beforeEach(() => {
  global.fetch = jest.fn();
  delete process.env.NEXT_PHASE;
});
afterEach(() => {
  global.fetch = originalFetch;
  if (originalPhase === undefined) delete process.env.NEXT_PHASE;
  else process.env.NEXT_PHASE = originalPhase;
});

it("returns absence only for a real missing page", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(
    new Response(JSON.stringify({ message: "Not found" }), { status: 404 }),
  );
  await expect(
    api.findByUrl({ url: "/missing", silentNotFound: true }),
  ).resolves.toBeUndefined();
});

it.each([undefined, "phase-production-build"])(
  "does not hide a server outage during %s",
  async (phase) => {
    if (phase) process.env.NEXT_PHASE = phase;
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(JSON.stringify({ message: "Service unavailable" }), {
        status: 503,
      }),
    );
    await expect(
      api.findByUrl({ url: "/article", silentNotFound: true }),
    ).rejects.toMatchObject({ status: 503 });
  },
);

it("propagates transport errors", async () => {
  (global.fetch as jest.Mock).mockRejectedValue(
    new Error("Connection refused"),
  );
  await expect(
    api.findByUrl({ url: "/article", silentNotFound: true }),
  ).rejects.toThrow("Connection refused");
});

it("uses a tracked finite cache only when explicitly requested for a public lookup", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(
    new Response(JSON.stringify({ data: { id: "page-1" } }), { status: 200 }),
  );
  await api.findByUrl({
    url: "/about",
    language: "en",
    options: { cache: "force-cache", next: { revalidate: 300 } },
  });
  const [, options] = (global.fetch as jest.Mock).mock.calls[0];
  expect(options.cache).toBe("force-cache");
  expect(options.next.revalidate).toBe(300);
  expect(options.next.tags).toEqual(
    expect.arrayContaining([expect.stringMatching(/^sps:q:[a-f0-9]{64}$/)]),
  );
  expect(options.headers.get("X-SPS-Consistency")).toBe("1");
});

it("does not cache a lookup carrying an authorization header", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(
    new Response(JSON.stringify({ data: { id: "page-1" } }), { status: 200 }),
  );
  await api.findByUrl({
    url: "/account",
    options: {
      cache: "force-cache",
      headers: { Authorization: "Bearer token" },
    },
  });
  const [, options] = (global.fetch as jest.Mock).mock.calls[0];
  expect(options.cache).toBe("no-store");
  expect(options.next.revalidate).toBe(0);
});

it("returns a resolved Page including named route values", async () => {
  (global.fetch as jest.Mock).mockResolvedValue(
    new Response(
      JSON.stringify({
        data: {
          id: "page-1",
          url: "/blog/articles/[blog.articles.slug]",
          routeParams: { "blog.articles.slug": "example" },
        },
      }),
      { status: 200 },
    ),
  );
  await expect(
    api.findByUrl({ url: "/blog/articles/example", silentNotFound: true }),
  ).resolves.toMatchObject({
    id: "page-1",
    routeParams: { "blog.articles.slug": "example" },
  });
});
