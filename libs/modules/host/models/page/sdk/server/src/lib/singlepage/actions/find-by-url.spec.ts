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
