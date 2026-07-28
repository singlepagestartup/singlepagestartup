/**
 * BDD Suite: primary social chat thread selection.
 *
 * Given: a chat can contain several UI threads with the same component variant.
 * When: a legacy flow needs one deterministic primary thread.
 * Then: relation ordering and chronology select it without interpreting the thread variant.
 */

import { selectPrimaryLinkedThread } from "./primary-thread";

describe("Given: several UI threads share the default component variant", () => {
  /**
   * BDD Scenario: select the oldest equally ordered relation.
   *
   * Given: every linked thread has variant default and orderIndex zero.
   * When: primary thread selection runs.
   * Then: the oldest relation wins regardless of array or thread order.
   */
  test("When: relations have equal order Then: the oldest linked thread is selected", () => {
    const result = selectPrimaryLinkedThread({
      socialModuleChatsToThreads: [
        {
          threadId: "thread-newer",
          orderIndex: 0,
          createdAt: new Date("2026-06-17T07:24:42.000Z"),
        },
        {
          threadId: "thread-primary",
          orderIndex: 0,
          createdAt: new Date("2026-06-16T22:02:05.000Z"),
        },
      ],
      socialModuleThreads: [
        {
          id: "thread-newer",
          variant: "default",
          createdAt: new Date("2026-06-17T07:24:42.000Z"),
        },
        {
          id: "thread-primary",
          variant: "default",
          createdAt: new Date("2026-06-16T22:02:05.000Z"),
        },
      ],
    });

    expect(result?.id).toBe("thread-primary");
  });
});
