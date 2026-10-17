/** Sequential, alternating local API comparison; never prints bodies or credentials. */
import { readFile, writeFile } from "node:fs/promises";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

const fixture = JSON.parse(
  await readFile(".artifacts/consistency/fixtures.json", "utf8"),
);
const current = process.env.API_SERVICE_URL || "http://localhost:4005";
const baseline = process.env.SPS_BASELINE_API_URL || "http://localhost:4006";
for (const url of [current, baseline])
  if (new URL(url).hostname !== "localhost")
    throw new Error("Local benchmark only");
if (!RBAC_SECRET_KEY) throw new Error("Operator credential required");
const linksResponse = await fetch(
  current +
    "/api/ecommerce/orders-to-products?" +
    new URLSearchParams({
      "filters[and][0][column]": "productId",
      "filters[and][0][method]": "eq",
      "filters[and][0][value]": fixture.product.id,
    }),
  {
    headers: {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    },
  },
);
if (!linksResponse.ok)
  throw new Error(`Fixture order lookup: ${linksResponse.status}`);
const links = ((await linksResponse.json()) as { data: { orderId: string }[] })
  .data;
const order =
  links.find((link) => fixture.ownedOrderIds?.includes(link.orderId)) ||
  (links.length === 1 ? links[0] : undefined);
if (!order) throw new Error("Benchmark needs an owned fixture order");
const route = `/api/ecommerce/orders/${order.orderId}/total`;
const cases = [
  { name: "baselineNoStore", host: baseline, noStore: true },
  { name: "currentNoStore", host: current, noStore: true },
  { name: "currentCache", host: current, noStore: false },
];
const results = new Map(
  cases.map(({ name }) => [
    name,
    { ms: [] as number[], hits: 0, metadataBytes: 0, bodyBytes: 0 },
  ]),
);
let expected: string | undefined;
async function sample(entry: (typeof cases)[number], record: boolean) {
  const start = performance.now();
  const res = await fetch(entry.host + route, {
    headers: {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY!,
      "X-SPS-Consistency": "1",
      ...(entry.noStore ? { "Cache-Control": "no-store" } : {}),
    },
  });
  const body = await res.text();
  const elapsed = performance.now() - start;
  if (!res.ok) throw new Error(`${entry.name}: ${res.status}`);
  if (expected === undefined) expected = body;
  if (body !== expected) throw new Error(`${entry.name}: aggregate differs`);
  if (record) {
    const result = results.get(entry.name)!;
    result.ms.push(elapsed);
    result.hits += Number(res.headers.get("X-SPS-Cache") === "hit");
    result.metadataBytes = Buffer.byteLength(
      res.headers.get("X-SPS-Consistency") || "",
    );
    result.bodyBytes = Buffer.byteLength(body);
  }
}
for (let i = 0; i < 5; i++)
  for (const entry of cases) await sample(entry, false);
for (let i = 0; i < 40; i++)
  for (const entry of cases) await sample(entry, true);
const summary = Object.fromEntries(
  [...results].map(([name, result]) => {
    const values = result.ms.toSorted((a, b) => a - b);
    return [
      name,
      {
        requests: values.length,
        p50: values[Math.floor(values.length * 0.5)],
        p95: values[Math.ceil(values.length * 0.95) - 1],
        hits: result.hits,
        metadataBytes: result.metadataBytes,
        bodyBytes: result.bodyBytes,
      },
    ];
  }),
);
const status = await fetch(current + "/api/consistency/status", {
  headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
});
const diagnostics = status.ok
  ? ((await status.json()) as { data: Record<string, unknown> }).data
  : { status: status.status };
const report = {
  sampledAt: new Date().toISOString(),
  scenario:
    "cart total, identical fixture and database, alternating sequential requests",
  summary,
  diagnostics: Object.fromEntries(
    Object.entries(diagnostics).filter(([key]) => key !== "queryRequests"),
  ),
};
await writeFile(
  ".artifacts/consistency/benchmark.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
