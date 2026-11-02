/**
 * BDD Suite: an enabled offline queue stays bounded (issue #233).
 *
 * Given: `KV_ENABLE_OFFLINE_QUEUE=true`, which a downstream project sets when a
 *        non-cache KV call site must survive a short reconnect rather than fail.
 * When:  a command is issued while nothing is listening, so ioredis buffers it
 *        in the offline queue instead of writing it to the socket.
 * Then:  `commandTimeout` still rejects it, so taking the documented escape
 *        hatch can never restore the indefinite wait that took the API down.
 *
 * This suite deliberately exercises the REAL ioredis, unlike `index.spec.ts`,
 * which mocks it to assert the options this repository passes. The guarantee
 * under test belongs to ioredis itself: `sendCommand` arms the command deadline
 * BEFORE the branch that pushes onto the offline queue. An upgrade that moved
 * it after would silently turn `KV_ENABLE_OFFLINE_QUEUE=true` back into an
 * unbounded hang, no option assertion would change, and nothing else in the
 * repository would notice.
 *
 * No Redis server is needed, and none must be running: the scenario requires a
 * socket that is never writable.
 */

import Redis from "ioredis";

const COMMAND_TIMEOUT_MS = 150;

/**
 * Port 1 needs root to bind, so nothing listens on it and every command takes
 * the offline-queue branch.
 */
const UNREACHABLE_PORT = 1;

describe("ioredis offline queue", () => {
  let client: Redis | undefined;

  afterEach(() => {
    client?.disconnect();
    client = undefined;
  });

  /**
   * BDD Scenario: A queued command is failed by the deadline, not by luck.
   * Given: a client with the offline queue enabled and no retry budget, so the
   *        deadline is the only thing that can fail a buffered command.
   * When:  a read is issued while the connection is down.
   * Then:  it rejects with the command timeout rather than waiting for a
   *        reconnect that never comes.
   */
  it("rejects a queued command on the command deadline instead of waiting for a reconnect", async () => {
    client = new Redis({
      host: "127.0.0.1",
      port: UNREACHABLE_PORT,
      commandTimeout: COMMAND_TIMEOUT_MS,
      enableOfflineQueue: true,
      // Unlimited on purpose. The retry budget is the OTHER way ioredis can
      // fail a queued command; removing it leaves the deadline as the single
      // mechanism under test, which is the one the escape hatch relies on.
      maxRetriesPerRequest: null,
      retryStrategy: () => 20,
    });

    // Connection failures are the point of this scenario; without a listener
    // they would surface as an unhandled 'error' event and fail the run.
    client.on("error", () => undefined);

    const startedAt = Date.now();

    await expect(client.get("issue-233")).rejects.toThrow(/timed out/i);

    // Generous enough not to be flaky on a loaded machine, tight enough that an
    // unbounded wait cannot pass.
    expect(Date.now() - startedAt).toBeLessThan(COMMAND_TIMEOUT_MS * 10);
  });
});
