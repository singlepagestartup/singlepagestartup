/** @jest-environment jsdom */
import { renderHook } from "@testing-library/react";
const mockQuery = jest.fn();
const mockRequest = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => {
    mockQuery(options);
    return {};
  },
}));
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/server", () => ({
  api: { addressSuggestions: (input: unknown) => mockRequest(input) },
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({}),
}));
import { action } from "./address-suggestions";

it("keeps address text out of query keys, bounds caching, disables retries and forwards cancellation", async () => {
  const hook = renderHook(
    ({ query }) =>
      action({
        data: { offerId: "offer", query, language: "en" },
        reactQueryOptions: { staleTime: Infinity, retry: 4 },
      }),
    { initialProps: { query: "Private Street 1" } },
  );
  const first = mockQuery.mock.calls.at(-1)![0];
  expect(JSON.stringify(first.queryKey)).not.toContain("Private Street");
  expect(first).toMatchObject({ staleTime: 30_000, gcTime: 0, retry: false });
  const signal = new AbortController().signal;
  await first.queryFn({ signal });
  expect(mockRequest).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { offerId: "offer", query: "Private Street 1", language: "en" },
      options: expect.objectContaining({ signal }),
    }),
  );
  hook.rerender({ query: "Private Street 1" });
  expect(mockQuery.mock.calls.at(-1)![0].queryKey).toEqual(first.queryKey);
  hook.rerender({ query: "Different Street" });
  expect(mockQuery.mock.calls.at(-1)![0].queryKey).not.toEqual(first.queryKey);
});
