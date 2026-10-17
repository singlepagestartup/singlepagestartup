const tag = jest.fn();
jest.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => tag(...args),
  revalidatePath: jest.fn(),
}));
jest.mock("@sps/shared-utils", () => ({
  CONSISTENCY_REVALIDATION_BATCH_SIZE: 128,
}));
import { POST } from "./route";
const request = (body: unknown) =>
  new Request("http://localhost/api/revalidate", {
    method: "POST",
    body: JSON.stringify(body),
  });
afterEach(() => tag.mockReset());
it("invalidates a bounded batch before acknowledging it", async () => {
  const res = await POST(request({ tags: ["one", "two", "one"] }));
  expect(res.status).toBe(200);
  expect(tag.mock.calls).toEqual([["one"], ["two"]]);
});
it.each([{ tags: [42] }, null, { tags: Array(129).fill("a") }])(
  "rejects malformed or oversized tag batches: %p",
  async (body) => {
    const res = await POST(request(body));
    expect(res.status).toBe(400);
    expect(tag).not.toHaveBeenCalled();
  },
);
it("does not acknowledge a failed invalidation", async () => {
  tag.mockImplementation(() => {
    throw new Error("Cache unavailable");
  });
  await expect(POST(request({ tags: ["one"] }))).rejects.toThrow(
    "Cache unavailable",
  );
});
