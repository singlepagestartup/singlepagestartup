/**
 * BDD Suite: authenticated PayKeeper protocol through API and PostgreSQL.
 * Given: disposable payment records, an isolated API and a loopback provider fixture.
 * When: callbacks are forged, mismatched, valid or repeated concurrently.
 * Then: only verified matching payments settle, acknowledgments are exact, and repeats do not write twice.
 */
import { createHash, randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";

const seed = "scenario-paykeeper-seed";
let base = "";
let api: ChildProcess | undefined;
let provider: Server;
const confirmed = new Map<string, Record<string, unknown>>();
const requests: string[] = [];
const created: { path: string; id: string }[] = [];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No test server port");
  return address.port;
}

async function call(
  path: string,
  method = "GET",
  data?: unknown,
  operator = true,
) {
  const headers: Record<string, string> = {};
  if (operator) {
    if (!process.env["RBAC_SECRET_KEY"])
      throw new Error("Test API requires RBAC_SECRET_KEY");
    headers["X-RBAC-SECRET-KEY"] = process.env["RBAC_SECRET_KEY"];
  }
  let body: URLSearchParams | undefined;
  if (data !== undefined) {
    body = new URLSearchParams({ data: JSON.stringify(data) });
  }
  const response = await fetch(base + "/api/" + path, {
    method,
    headers,
    body,
  });
  return { status: response.status, data: await response.json() };
}
async function create(path: string, data: unknown) {
  const response = await call(path, "POST", data);
  if (
    response.status < 200 ||
    response.status >= 300 ||
    !response.data.data?.id
  )
    throw new Error(
      "Cannot create test fixture: " +
        path +
        " status=" +
        response.status +
        " error=" +
        response.data.error,
    );
  const record = response.data.data;
  created.push({ path, id: record.id });
  return record;
}
function signed(data: Record<string, string>) {
  const clientid = data.clientid ?? "";
  const sum = Number(data.sum).toFixed(2);
  return {
    ...data,
    key: createHash("md5")
      .update(data.id + sum + clientid + data.orderid + seed)
      .digest("hex"),
  };
}
async function webhook(
  data: unknown,
  form = false,
  providerName = "paykeeper",
) {
  // PayKeeper cannot send the application's operator credential.
  const response = await fetch(
    base + `/api/billing/payment-intents/${providerName}/webhook`,
    {
      method: "POST",
      headers: {
        "content-type": form
          ? "application/x-www-form-urlencoded"
          : "application/json",
      },
      body: form
        ? new URLSearchParams(data as Record<string, string>).toString()
        : JSON.stringify(data),
    },
  );
  return {
    status: response.status,
    text: await response.text(),
    contentType: response.headers.get("content-type"),
  };
}
async function fixture() {
  const intent = await create("billing/payment-intents", {
    amount: 100,
    variant: `scenario-paykeeper-${randomUUID()}`,
  });
  const providerId = String(Date.now()) + String(created.length);
  const invoice = await create("billing/invoices", {
    amount: 100,
    status: "open",
    provider: "paykeeper",
    providerId,
  });
  await create("billing/payment-intents-to-invoices", {
    paymentIntentId: intent.id,
    invoiceId: invoice.id,
  });
  confirmed.set(providerId, {
    id: providerId,
    orderid: intent.id,
    paymentid: "301",
    clientid: "",
    pay_amount: "100.00",
    status: "paid",
  });
  const payload = signed({
    id: "301",
    sum: "100.00",
    clientid: "",
    orderid: intent.id,
  });
  const state = async () => ({
    intent: (await call("billing/payment-intents/" + intent.id)).data.data,
    invoice: (await call("billing/invoices/" + invoice.id)).data.data,
  });
  return { intent, invoice, providerId, payload, state };
}

beforeAll(async () => {
  provider = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const id = url.searchParams.get("id") || "";
    requests.push(id);
    if (url.pathname !== "/info/invoice/byid/" || !confirmed.has(id)) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify([confirmed.get(id)]));
  });
  const bankPort = await listen(provider);
  const reserve = createServer();
  const port = await listen(reserve);
  await new Promise<void>((resolve) => reserve.close(() => resolve()));
  base = `http://127.0.0.1:${port}`;
  api = spawn("bun", ["server.ts"], {
    cwd: join(process.cwd(), "apps/api"),
    stdio: "ignore",
    env: {
      ...process.env,
      API_SERVICE_PORT: String(port),
      API_SERVICE_URL: base,
      NEXT_PUBLIC_API_SERVICE_URL: base,
      PAYKEEPER_BASE_URL: `http://127.0.0.1:${bankPort}`,
      PAYKEEPER_API_LOGIN: "scenario",
      PAYKEEPER_API_PASSWORD: "scenario",
      PAYKEEPER_WEBHOOK_SECRET: seed,
    },
  });
  api.on("error", () => undefined);
  for (let attempt = 0; attempt < 100; attempt++) {
    if (api.exitCode != null)
      throw new Error("Isolated scenario API exited before readiness");
    try {
      if ((await call("billing/currencies")).status === 200) return;
    } catch {
      /* server startup */
    }
    await delay(100);
  }
  throw new Error("Isolated scenario API did not become ready");
});
afterAll(async () => {
  try {
    for (const item of created.reverse()) {
      const response = await call(item.path + "/" + item.id, "DELETE");
      if (![200, 404].includes(response.status))
        throw new Error("Fixture cleanup failed: " + item.path);
    }
  } finally {
    if (api && api.exitCode == null) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          api!.kill("SIGKILL");
          resolve();
        }, 3000);
        api!.once("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
        api!.kill("SIGTERM");
      });
    }
    if (provider)
      await new Promise<void>((resolve) => provider.close(() => resolve()));
  }
});

it("rejects a malformed UUID as 400 without echoing the submitted value", async () => {
  const sentinel = "pr230-invalid-" + randomUUID();
  const result = await webhook(
    { id: "301", sum: "100.00", orderid: sentinel },
    true,
  );
  expect(result.status).toBe(400);
  expect(result.text).not.toContain(sentinel);
});
it.each([null, [], 42, "do-not-echo"])(
  "rejects malformed JSON (%p)",
  async (data) => {
    const result = await webhook(data);
    expect(result.status).toBe(400);
    expect(result.text).not.toContain("do-not-echo");
  },
);
it.each(["id", "sum", "clientid"])("rejects structured %s", async (field) => {
  const result = await webhook({
    orderid: randomUUID(),
    [field]: { value: "do-not-echo" },
  });
  expect(result.status).toBe(400);
  expect(result.text).not.toContain("do-not-echo");
});
it("returns 404 for a signed, canonical unknown UUID", async () => {
  const result = await webhook(
    signed({ id: "301", sum: "100.00", orderid: randomUUID() }),
    true,
  );
  expect(result.status).toBe(404);
});
it("rejects forged callbacks and zero-invoice envelopes before any bank lookup or write", async () => {
  const f = await fixture();
  const before = await f.state();
  const bankReads = requests.length;
  const response = await webhook({
    ...f.payload,
    key: "0".repeat(32),
    data: { id: f.invoice.id },
  });
  expect(response.status).toBe(403);
  expect(response.text).not.toContain("OK ");
  expect(requests).toHaveLength(bankReads);
  expect(await f.state()).toEqual(before);
});
it("refuses a signed amount mismatch without marking the records paid", async () => {
  const f = await fixture();
  const before = await f.state();
  const response = await webhook(signed({ ...f.payload, sum: "101.00" }), true);
  expect(response.status).toBe(400);
  expect(await f.state()).toEqual(before);
});
it("commits the payment before returning exact text ACK and handles concurrent retries without changing timestamps", async () => {
  const f = await fixture();
  await f.state();
  const expected =
    "OK " +
    createHash("md5")
      .update("301" + seed)
      .digest("hex");
  const result = await webhook(f.payload, true);
  expect(result.status).toBe(200);
  expect(result.contentType).toContain("text/plain");
  expect(result.text).toBe(expected);
  const paid = await f.state();
  expect(paid.invoice.status).toBe("paid");
  expect(paid.intent.status).toBe("succeeded");
  const retries = await Promise.all([
    webhook(f.payload, true),
    webhook(f.payload, true),
    webhook(f.payload, true),
  ]);
  expect(retries.map((r) => r.text)).toEqual([expected, expected, expected]);
  expect(await f.state()).toEqual(paid);
});

it.each([0, 100])(
  "does not let dummy callbacks settle a PayKeeper invoice with amount %s",
  async (amount) => {
    const f = await fixture();
    if (amount === 0) {
      await call("billing/invoices/" + f.invoice.id, "PATCH", { amount: 0 });
      await call("billing/payment-intents/" + f.intent.id, "PATCH", {
        amount: 0,
      });
    }
    const before = await f.state();
    const response = await webhook(
      { data: { id: f.invoice.id } },
      false,
      "dummy",
    );
    expect(response.status).toBe(403);
    expect(await f.state()).toEqual(before);
  },
);

it("preserves the internal zero-amount dummy flow for a dummy Invoice", async () => {
  const f = await fixture();
  await call("billing/invoices/" + f.invoice.id, "PATCH", {
    amount: 0,
    provider: "dummy",
  });
  await call("billing/payment-intents/" + f.intent.id, "PATCH", { amount: 0 });
  const result = await webhook({ data: { id: f.invoice.id } }, false, "dummy");
  expect(result.status).toBe(200);
  const after = await f.state();
  expect(after.invoice.status).toBe("paid");
  expect(after.intent.status).toBe("succeeded");
});
