import { consistencyRequestOptions } from "./request-options";

it("keeps private Next fetches dynamic without disabling the authorized API cache", async () => {
  const result = await consistencyRequestOptions("http://localhost/api/items", {
    headers: { Authorization: "private-token" },
  });
  expect(result.cache).toBe("no-store");
  expect(result.next?.revalidate).toBe(0);
  expect(
    new Headers(result.headers as HeadersInit).get("Cache-Control"),
  ).toBeNull();
});

it("preserves an explicit API cache bypass", async () => {
  const result = await consistencyRequestOptions("http://localhost/api/items", {
    headers: { "Cache-Control": "no-store" },
  });
  expect(new Headers(result.headers as HeadersInit).get("Cache-Control")).toBe(
    "no-store",
  );
  expect(result.cache).toBe("no-store");
});
