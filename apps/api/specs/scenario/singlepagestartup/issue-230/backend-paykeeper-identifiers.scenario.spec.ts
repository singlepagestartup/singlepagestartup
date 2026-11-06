/**
 * BDD Suite: PayKeeper identifier errors through the running API and database.
 *
 * Given: a running API with PayKeeper configured and a random, nonexistent Payment Intent UUID.
 * When: form or JSON notifications contain invalid identifiers or that unknown UUID.
 * Then: malformed values return 400 without being echoed, while the exact UUID lookup retains 404.
 */
import { randomUUID } from "node:crypto";

const base =
  process.env["SCENARIO_API_URL"] ||
  process.env["API_SERVICE_URL"] ||
  "http://localhost:4000";
const unknownOrder = randomUUID();

async function webhook(data: unknown, form = false) {
  const secret = process.env["RBAC_SECRET_KEY"];
  if (!secret)
    throw new Error("RBAC_SECRET_KEY is required for scenario route access");
  const response = await fetch(
    `${base}/api/billing/payment-intents/paykeeper/webhook`,
    {
      method: "POST",
      headers: {
        "X-RBAC-SECRET-KEY": secret,
        "Content-Type": form
          ? "application/x-www-form-urlencoded"
          : "application/json",
      },
      body: form
        ? new URLSearchParams(data as Record<string, string>).toString()
        : JSON.stringify(data),
    },
  );
  return { status: response.status, text: await response.text() };
}

it("rejects a malformed form UUID with 400 and never includes the submitted value in the response", async () => {
  const sentinel = "pr266-invalid-identifier-" + randomUUID();
  const result = await webhook(
    { orderid: sentinel, id: "301", sum: "100.00", clientid: "" },
    true,
  );
  expect(result.status).toBe(400);
  expect(JSON.parse(result.text).error).toContain(
    "Validation error. Invalid orderid",
  );
  expect(result.text).not.toContain(sentinel);
  expect(result.text).not.toContain("invalid input syntax");
});

it.each([
  ["id", { privateValue: "pr266-do-not-echo" }],
  ["sum", 100],
  ["clientid", ["pr266-do-not-echo"]],
])("rejects a non-string %s in JSON before lookup", async (field, value) => {
  const result = await webhook({
    orderid: unknownOrder,
    [field as string]: value,
  });
  expect(result.status).toBe(400);
  expect(JSON.parse(result.text).error).toContain(
    `Validation error. Invalid ${field}`,
  );
  expect(result.text).not.toContain("pr266-do-not-echo");
});

it.each([null, [], 42, "pr266-do-not-echo"])(
  "rejects a malformed JSON payload (%p)",
  async (data) => {
    const result = await webhook(data);
    expect(result.status).toBe(400);
    expect(JSON.parse(result.text).error).toContain(
      "Validation error. Invalid webhook payload",
    );
    expect(result.text).not.toContain("pr266-do-not-echo");
  },
);

it("retains 404 after the exact lookup for a canonical but unknown Payment Intent UUID", async () => {
  const result = await webhook(
    { orderid: unknownOrder, id: "301", sum: "100.00", clientid: "" },
    true,
  );
  expect(result.status).toBe(404);
  expect(JSON.parse(result.text).error).toContain(
    "Not Found error. Payment intent to invoice relation not found",
  );
});
