/**
 * BDD Suite: PostgreSQL advisory lock runner.
 *
 * Given: independent database sessions execute namespaced operations.
 * When: equal or different advisory keys are acquired.
 * Then: equal keys serialize, different keys proceed concurrently, and failures release locks.
 */

import { getPostgresClient, resetPostgresClient } from "./postgres";
import { withPostgresAdvisoryLock } from "./advisory-lock";

interface IDeferred {
  promise: Promise<void>;
  resolve: () => void;
}

function createDeferred(): IDeferred {
  let resolve = () => {};
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

describe("Given: two operations using PostgreSQL advisory locks", () => {
  /**
   * BDD Scenario: equal-key serialization across sessions.
   *
   * Given: the first callback holds one namespaced key.
   * When: a second session requests the same key.
   * Then: the second callback enters only after the first releases it.
   */
  it("When: keys are equal Then: serializes the callbacks", async () => {
    const firstEntered = createDeferred();
    const releaseFirst = createDeferred();
    const events: string[] = [];
    let secondEntered = false;

    const first = withPostgresAdvisoryLock({
      namespace: "issue-211-test",
      key: "same",
      execute: async () => {
        events.push("first-enter");
        firstEntered.resolve();
        await releaseFirst.promise;
        events.push("first-exit");
      },
    });

    await firstEntered.promise;

    const second = withPostgresAdvisoryLock({
      namespace: "issue-211-test",
      key: "same",
      execute: async () => {
        secondEntered = true;
        events.push("second-enter");
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(secondEntered).toBe(false);

    releaseFirst.resolve();
    await Promise.all([first, second]);

    expect(events).toEqual(["first-enter", "first-exit", "second-enter"]);
  });

  /**
   * BDD Scenario: different-key concurrency.
   *
   * Given: one callback holds its key.
   * When: a second callback requests another key.
   * Then: it enters without waiting for the first callback.
   */
  it("When: keys differ Then: keeps unrelated operations concurrent", async () => {
    const firstEntered = createDeferred();
    const releaseFirst = createDeferred();
    const secondEntered = createDeferred();

    const first = withPostgresAdvisoryLock({
      namespace: "issue-211-test",
      key: "first",
      execute: async () => {
        firstEntered.resolve();
        await releaseFirst.promise;
      },
    });

    await firstEntered.promise;

    const second = withPostgresAdvisoryLock({
      namespace: "issue-211-test",
      key: "second",
      execute: async () => {
        secondEntered.resolve();
      },
    });

    await secondEntered.promise;
    releaseFirst.resolve();
    await Promise.all([first, second]);
  });

  /**
   * BDD Scenario: error-safe release.
   *
   * Given: a callback throws after acquiring its key.
   * When: another callback requests the same key.
   * Then: the original error is preserved and the next callback acquires the released lock.
   */
  it("When: a callback fails Then: releases the key for the next caller", async () => {
    const callbackError = new Error("expected callback failure");

    await expect(
      withPostgresAdvisoryLock({
        namespace: "issue-211-test",
        key: "failure",
        execute: async () => {
          throw callbackError;
        },
      }),
    ).rejects.toBe(callbackError);

    await expect(
      withPostgresAdvisoryLock({
        namespace: "issue-211-test",
        key: "failure",
        execute: async () => "recovered",
      }),
    ).resolves.toBe("recovered");
  });
});
