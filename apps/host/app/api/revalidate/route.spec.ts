/**
 * BDD Suite: authenticated Host cache invalidation.
 * Given: an internal request carries tags, a path or both.
 * When: the POST route validates the credential and payload.
 * Then: only authorized, valid requests invalidate the cache.
 */
import { POST } from "./route";

const mockTag = jest.fn();
const mockPath = jest.fn();
let mockSecret: string | undefined = "fixture-revalidation-secret";
jest.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockTag(...args),
  revalidatePath: (...args: unknown[]) => mockPath(...args),
}));
jest.mock("@sps/shared-utils", () => ({
  CONSISTENCY_REVALIDATION_BATCH_SIZE: 128,
  HOST_SERVICE_REVALIDATION_SECRET_HEADER: "X-HOST-REVALIDATION-SECRET",
  get HOST_SERVICE_REVALIDATION_SECRET() {
    return mockSecret;
  },
}));

const request = (body: unknown, credential = "fixture-revalidation-secret") =>
  new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: credential ? { "X-HOST-REVALIDATION-SECRET": credential } : {},
    body: JSON.stringify(body),
  });

afterEach(() => {
  mockTag.mockReset();
  mockPath.mockReset();
  mockSecret = "fixture-revalidation-secret";
});

it.each(["", "wrong", "fixture-revalidation-secrex"])(
  "rejects missing or invalid credentials before reading the request",
  async (credential) => {
    const req = request(
      { path: "/", type: "layout", tags: ["one"] },
      credential,
    );
    const read = jest.spyOn(req, "text");
    expect((await POST(req)).status).toBe(401);
    expect(read).not.toHaveBeenCalled();
    expect(mockTag).not.toHaveBeenCalled();
    expect(mockPath).not.toHaveBeenCalled();
  },
);

it("refuses requests when the Host has no configured secret", async () => {
  mockSecret = undefined;
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  try {
    expect((await POST(request({ tags: ["one"] }))).status).toBe(401);
    expect(mockTag).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});

it("expires deduplicated tags and the requested layout before acknowledging", async () => {
  const res = await POST(
    request({ tags: ["one", "two", "one"], path: "/", type: "layout" }),
  );
  expect(res.status).toBe(200);
  expect(mockTag.mock.calls).toEqual([
    ["one", { expire: 0 }],
    ["two", { expire: 0 }],
  ]);
  expect(mockPath).toHaveBeenCalledWith("/", "layout");
});

it("accepts a path-only request for a localized page", async () => {
  expect(
    (await POST(request({ path: "/ru/gallery/a%26b", type: "page" }))).status,
  ).toBe(200);
  expect(mockPath).toHaveBeenCalledWith("/ru/gallery/a%26b", "page");
  expect(mockTag).not.toHaveBeenCalled();
});

it.each([
  null,
  {},
  { tags: [42] },
  { tags: Array(129).fill("a") },
  { tags: ["one"], path: "//example.com" },
  { path: "/en?a=1", type: "page" },
  { tags: ["one"], type: "layout" },
])("rejects an invalid request without invalidating anything", async (body) => {
  expect((await POST(request(body))).status).toBe(400);
  expect(mockTag).not.toHaveBeenCalled();
  expect(mockPath).not.toHaveBeenCalled();
});

it("does not acknowledge a failed invalidation", async () => {
  mockTag.mockImplementation(() => {
    throw new Error("Cache unavailable");
  });
  await expect(POST(request({ tags: ["one"] }))).rejects.toThrow(
    "Cache unavailable",
  );
});
