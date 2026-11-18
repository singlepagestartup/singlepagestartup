import { action } from "./address-suggestions";

it("sends private search text only in a no-store POST body and preserves cancellation", async () => {
  const result = {
    suggestions: ["Private Street 1"],
    attribution: [{ label: "Provider", url: "https://example.com/" }],
  };
  const request = jest
    .spyOn(global, "fetch")
    .mockResolvedValue(new Response(JSON.stringify({ data: result })));
  try {
    const signal = new AbortController().signal;
    expect(
      await action({
        host: "https://api.example",
        data: { offerId: "offer", query: "Private Street", language: "en" },
        options: { signal },
      }),
    ).toEqual(result);
    const [url, options] = request.mock.calls[0];
    expect(String(url)).toBe(
      "https://api.example/api/ecommerce/stores-to-products/offer/address-suggestions",
    );
    expect(options).toMatchObject({
      method: "POST",
      cache: "no-store",
      signal,
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      query: "Private Street",
      language: "en",
    });
  } finally {
    request.mockRestore();
  }
});
