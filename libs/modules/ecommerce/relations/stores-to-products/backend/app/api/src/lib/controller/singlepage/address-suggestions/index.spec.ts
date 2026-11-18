import { Hono } from "hono";
import { READ_ONLY_OPERATION_CONTEXT_KEY } from "@sps/shared-utils";
import { Handler } from "./index";

const suggest = jest.fn();
const uuid = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
let readOnly: unknown;
const app = new Hono<{
  Variables: Record<typeof READ_ONLY_OPERATION_CONTEXT_KEY, boolean>;
}>();
app.use("*", async (c, next) => {
  await next();
  readOnly = c.get(READ_ONLY_OPERATION_CONTEXT_KEY);
});
app.post("/:uuid/address-suggestions", (c) =>
  new Handler({ addressSuggestions: suggest } as any).execute(c),
);
beforeEach(() => {
  suggest.mockReset().mockResolvedValue({ suggestions: ["Main Street 1"] });
  readOnly = undefined;
});
it("executes the address lookup and classifies the POST as a private no-store read", async () => {
  const response = await app.request(`/${uuid}/address-suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Main", language: "en" }),
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(readOnly).toBe(true);
  expect(await response.json()).toEqual({
    data: { suggestions: ["Main Street 1"] },
  });
  expect(suggest).toHaveBeenCalledWith(
    { offerId: uuid, query: "Main", language: "en" },
    expect.any(AbortSignal),
  );
});
it.each([
  { query: "ab", language: "en" },
  { query: "x".repeat(501), language: "en" },
  { query: "Main", language: "en-US" },
  { query: "Main", language: "en", regionIds: ["other"] },
])("rejects malformed input without calling the service", async (body) => {
  const response = await app.request(`/${uuid}/address-suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(400);
  expect(suggest).not.toHaveBeenCalled();
});
