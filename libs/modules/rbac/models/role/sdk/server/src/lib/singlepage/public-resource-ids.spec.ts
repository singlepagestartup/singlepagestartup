import { action } from "./public-resource-ids";
it("reads candidate IDs anonymously through the SDK and rejects malformed or unavailable responses", async () => {
  const request = jest.spyOn(globalThis, "fetch");
  try {
    request.mockResolvedValue(
      new Response(
        JSON.stringify({ data: ["11111111-1111-4111-8111-111111111111"] }),
      ),
    );
    expect(
      await action({
        host: "http://api.example.test",
        params: { resource: "/api/custom/items" },
      }),
    ).toEqual(["11111111-1111-4111-8111-111111111111"]);
    expect(String(request.mock.calls[0][0])).toContain(
      "/api/rbac/roles/public-resource-ids?resource=%2Fapi%2Fcustom%2Fitems",
    );
    expect(request.mock.calls[0][1]?.cache).toBe("no-store");
    const headers = new Headers(request.mock.calls[0][1]?.headers);
    expect(headers.get("Cache-Control")).toBe("no-store");
    expect(headers.has("Authorization")).toBe(false);
    request.mockResolvedValue(new Response(JSON.stringify({ data: [123] })));
    await expect(
      action({ params: { resource: "/api/custom/items" } }),
    ).rejects.toThrow("Invalid public resource ID response");
    request.mockResolvedValue(
      new Response(JSON.stringify({ message: "offline" }), { status: 503 }),
    );
    await expect(
      action({ params: { resource: "/api/custom/items" } }),
    ).rejects.toMatchObject({ status: 503 });
  } finally {
    request.mockRestore();
  }
});
