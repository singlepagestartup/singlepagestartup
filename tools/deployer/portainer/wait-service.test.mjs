import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test from "node:test";
import { waitForService } from "./wait-service.mjs";

async function fixture(snapshots, action) {
  let reads = 0;
  const server = createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    if (request.url === "/api/auth")
      return response.end('{"jwt":"test-session"}');
    assert.equal(request.headers.authorization, "Bearer test-session");
    if (request.url === "/api/webhooks")
      return response.end(
        JSON.stringify([
          { Token: "test-hook", ResourceId: "api", EndpointId: 1, Type: 1 },
        ]),
      );
    const current = snapshots[Math.min(reads, snapshots.length - 1)];
    if (request.url.endsWith("/services/api")) {
      reads++;
      return response.end(JSON.stringify(current.service));
    }
    if (request.url.includes("/tasks?")) {
      const snapshot = snapshots[Math.min(reads - 1, snapshots.length - 1)];
      return response.end(JSON.stringify(snapshot.tasks));
    }
    response.writeHead(404).end("{}");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    await action(
      {
        portainerURL: origin,
        webhookURL: `${origin}/api/webhooks/test-hook`,
        username: "test",
        password: "test",
        tag: "0.0.313",
        intervalMs: 1,
        timeoutMs: 2000,
        log() {},
      },
      () => reads,
    );
  } finally {
    server.closeAllConnections();
    server.close();
  }
}

function snapshot(tag, update, taskState = "running", health = true) {
  const container = {
    Image: `registry/image:${tag}@sha256:fixture`,
    ...(health ? { Healthcheck: { Test: ["CMD", "readiness"] } } : {}),
  };
  return {
    service: {
      Spec: {
        TaskTemplate: { ContainerSpec: container },
        Mode: { Replicated: { Replicas: 1 } },
      },
      UpdateStatus: { State: update },
    },
    tasks: [
      { Status: { State: taskState }, Spec: { ContainerSpec: container } },
    ],
  };
}

test("a successful webhook is followed by the target service and ready tasks", async () => {
  await fixture(
    [
      snapshot("0.0.312", "completed"),
      snapshot("0.0.313", "updating", "starting"),
      snapshot("0.0.313", "updating"),
      snapshot("0.0.313", "completed"),
    ],
    async (options, reads) => {
      await waitForService(options);
      assert.equal(reads(), 4);
    },
  );
});

test("a completed update with an old task still waits", async () => {
  const mixed = snapshot("0.0.313", "completed");
  mixed.tasks = snapshot("0.0.312", "completed").tasks;
  await fixture(
    [mixed, snapshot("0.0.313", "completed")],
    async (options, reads) => {
      await waitForService(options);
      assert.equal(reads(), 2);
    },
  );
});

for (const status of ["paused", "rollback_started", "rollback_completed"])
  test(`fails on ${status} instead of releasing dependent services`, async () => {
    await fixture([snapshot("0.0.313", status)], (options) =>
      assert.rejects(waitForService(options), /rollout stopped/),
    );
  });

test("a task on a previous digest of the same tag still waits", async () => {
  const mixed = snapshot("0.0.313", "completed");
  mixed.tasks = structuredClone(mixed.tasks);
  mixed.tasks[0].Spec.ContainerSpec.Image = "registry/image:0.0.313@sha256:old";
  await fixture(
    [mixed, snapshot("0.0.313", "completed")],
    async (options, reads) => {
      await waitForService(options);
      assert.equal(reads(), 2);
    },
  );
});

test("refuses a service without readiness checks", async () => {
  await fixture(
    [snapshot("0.0.313", "completed", "running", false)],
    (options) =>
      assert.rejects(waitForService(options), /health check is required/),
  );
});

test("a service stuck in migration times out", async () => {
  await fixture([snapshot("0.0.313", "updating", "starting")], (options) =>
    assert.rejects(
      waitForService({ ...options, timeoutMs: 40 }),
      /readiness timed out/,
    ),
  );
});
