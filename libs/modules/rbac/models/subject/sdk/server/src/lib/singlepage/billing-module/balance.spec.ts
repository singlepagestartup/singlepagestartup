/**
 * BDD Suite: Scoped balance request headers.
 * Given: caller headers supplied as an object, tuples or Headers.
 * When: the Subject SDK requests the balance.
 * Then: caller headers survive and the private response bypasses HTTP caching.
 */
jest.mock("server-only", () => ({}), { virtual: true });
import { api } from "@sps/rbac/models/subject/sdk/server";
import { action } from "./balance";
afterEach(() => jest.restoreAllMocks());
it.each([
  [{ "X-Test": "one" }, "one"],
  [{ "X-Test": ["one", "two"] }, "one, two"],
  [[["X-Test", "one"]], "one"],
  [new Headers({ "X-Test": "one" }), "one"],
] as const)(
  "preserves supported header representations %j",
  async (headers, expected) => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ data: { amount: "12", currencyId: null } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    await expect(
      api.billingModuleBalance({
        id: "subject",
        host: "https://api.example.test",
        options: { headers: headers as any },
      }),
    ).resolves.toEqual({ amount: "12", currencyId: null });
    const sent = fetchMock.mock.calls[0][1]!.headers as Headers;
    expect(sent.get("X-Test")).toBe(expected);
    expect(sent.get("Cache-Control")).toBe("no-store");
  },
);

it("preserves authentication and bypasses HTTP caching for each balance read", async () => {
  const fetchMock = jest.spyOn(global, "fetch").mockImplementation(
    async () =>
      new Response(
        JSON.stringify({ data: { amount: "3000", currencyId: "token" } }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
  );
  try {
    await action({
      id: "owner",
      host: "http://localhost:4000",
      options: {
        headers: {
          Authorization: "Bearer fixture",
          "Cache-Control": "max-age=60",
        },
      },
    });
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer fixture");
    expect(headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:4000/api/rbac/subjects/owner/billing-module/balance",
    );
  } finally {
    fetchMock.mockRestore();
  }
});
