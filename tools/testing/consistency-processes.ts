/** Two real API processes, independent sockets and committed PostgreSQL writes. */
import { readFile, writeFile } from "node:fs/promises";
import {
  getDrizzle,
  getPostgresClient,
} from "@sps/shared-backend-database-config";
import { Table } from "@sps/ecommerce/models/product/backend/repository/database";
import { eq } from "drizzle-orm";
import type { IConsistencyMetadata } from "@sps/shared-utils";

interface IFrame {
  type: string;
  refs?: string[];
  cursor?: string;
}
const fixture = JSON.parse(
  await readFile(".artifacts/consistency/fixtures.json", "utf8"),
);
const response = await fetch(
  `http://localhost:4005/api/ecommerce/products/${fixture.product.id}`,
  { headers: { "Cache-Control": "no-store" } },
);
if (!response.ok || !response.headers.get("x-sps-consistency"))
  throw new Error("Anonymous fixture read needs a capability");
const metadata: IConsistencyMetadata = JSON.parse(
  Buffer.from(
    response.headers.get("x-sps-consistency")!,
    "base64url",
  ).toString(),
);
if (metadata.audience === "service")
  throw new Error("A public fixture capability is required");
function connect(port: number) {
  const socket = new WebSocket(`ws://localhost:${port}/ws/revalidation`);
  const frames: { frame: IFrame; time: number }[] = [];
  const listeners = new Set<() => void>();
  const waitFor = (predicate: () => boolean) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        listeners.delete(check);
        reject(
          new Error(
            `API ${port}: delivery timed out; frames=${JSON.stringify(frames.map(({ frame }) => ({ type: frame.type, refs: frame.refs?.length, matched: frame.refs?.includes(metadata.ref) })))}`,
          ),
        );
      }, 10000);
      function check() {
        if (predicate()) {
          clearTimeout(timer);
          listeners.delete(check);
          resolve();
        }
      }
      listeners.add(check);
      check();
    });
  socket.addEventListener("open", () =>
    socket.send(
      JSON.stringify({
        type: "subscribe",
        refs: [metadata.ref],
        epoch: metadata.epoch,
        cursor: metadata.cursor,
        authorization: "",
      }),
    ),
  );
  socket.addEventListener("message", (event) => {
    const frame: IFrame = JSON.parse(String(event.data));
    frames.push({ frame, time: performance.now() });
    for (const listener of [...listeners]) listener();
  });
  const changedAfter = (time: number) =>
    frames.find(
      (entry) =>
        entry.time >= time &&
        ["invalidate", "resync"].includes(entry.frame.type) &&
        entry.frame.refs?.includes(metadata.ref),
    );
  return { socket, frames, waitFor, changedAfter };
}
const clients = [connect(4005), connect(4007)];
const db = getDrizzle({});
const [original] = await db
  .select({ title: Table.title })
  .from(Table)
  .where(eq(Table.id, fixture.product.id));
const samples: number[] = [];
try {
  await Promise.all(
    clients.map((client) =>
      client.waitFor(() =>
        client.frames.some(
          ({ frame }) =>
            frame.type === "ready" && frame.refs?.includes(metadata.ref),
        ),
      ),
    ),
  );
  for (let i = 0; i < 20; i++) {
    const start = performance.now();
    await db
      .update(Table)
      .set({ title: { en: `Consistency process sample ${i}` } })
      .where(eq(Table.id, fixture.product.id));
    const committed = performance.now();
    await Promise.all(
      clients.map((client) =>
        client.waitFor(() => !!client.changedAfter(start)),
      ),
    );
    samples.push(
      Math.max(
        ...clients.map((client) =>
          Math.max(0, client.changedAfter(start)!.time - committed),
        ),
      ),
    );
  }
  const values = samples.toSorted((a, b) => a - b);
  const report = {
    processes: 2,
    sockets: 2,
    commits: samples.length,
    p50Ms: values[10],
    p95Ms: values[18],
    maxMs: values.at(-1),
    metadataBytes: response.headers.get("x-sps-consistency")!.length,
  };
  await writeFile(
    ".artifacts/consistency/processes.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  await db
    .update(Table)
    .set({ title: original.title })
    .where(eq(Table.id, fixture.product.id));
  clients.forEach((client) => client.socket.close());
  await getPostgresClient().end();
}
