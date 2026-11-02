/**
 * BDD Suite: anonymous subject retention.
 *
 * Given: inactive anonymous subjects accumulate and some of them own data.
 * When: the scheduled cleanup runs.
 * Then: one bounded batch is selected by last activity, every subject with a
 * blocking relation survives, and the rest are deleted with counted results.
 */

const mockLoggerError = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS: 2592000,
  RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE: 500,
}));

jest.mock("@sps/backend-utils", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

import { Service } from "./delete-anonymous-subjects";

const subjects = [
  { id: "subject-stale" },
  { id: "subject-with-identity" },
  { id: "subject-with-order" },
] as any[];

function createBlockers(props: { identity?: string[]; order?: string[] }) {
  const identityFind = jest
    .fn()
    .mockResolvedValue(
      (props.identity || []).map((subjectId) => ({ subjectId })),
    );
  const orderFind = jest
    .fn()
    .mockResolvedValue((props.order || []).map((subjectId) => ({ subjectId })));

  return {
    identityFind,
    orderFind,
    blockers: [
      { reason: "identity", find: identityFind },
      { reason: "ecommerce-module-order", find: orderFind },
    ],
  };
}

describe("Given: anonymous subjects older than the retention period", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: the candidate query.
   *
   * Given: the retention period and the batch size are configured.
   * When: the cleanup runs.
   * Then: the database selects one bounded batch of default-variant subjects
   * whose last activity is older than the retention, oldest first.
   */
  it("When: cleanup runs Then: candidates are one bounded batch by last activity", async () => {
    const find = jest.fn().mockResolvedValue([]);
    const service = new Service({
      find,
      delete: jest.fn(),
      blockers: [],
    });

    await service.execute();

    const params = find.mock.calls[0][0].params;

    expect(params.limit).toBe(500);
    expect(params.orderBy).toEqual({
      and: [{ column: "updatedAt", method: "asc" }],
    });
    expect(params.filters.and[0]).toEqual({
      column: "variant",
      method: "eq",
      value: "default",
    });
    expect(params.filters.and[1].column).toBe("updatedAt");
    expect(params.filters.and[1].method).toBe("lt");
    expect(Date.parse(params.filters.and[1].value)).toBeLessThanOrEqual(
      Date.now() - 2592000 * 1000,
    );
  });

  /**
   * BDD Scenario: an explicit retention and batch size.
   *
   * Given: a caller passes its own retention and batch size.
   * When: the cleanup runs.
   * Then: the query uses them instead of the configured defaults.
   */
  it("When: the caller overrides the settings Then: the query uses them", async () => {
    const find = jest.fn().mockResolvedValue([]);
    const service = new Service({
      find,
      delete: jest.fn(),
      blockers: [],
    });

    await service.execute({ retentionInSeconds: 60, batchSize: 10 });

    const params = find.mock.calls[0][0].params;

    expect(params.limit).toBe(10);
    expect(Date.parse(params.filters.and[1].value)).toBeGreaterThan(
      Date.now() - 2592000 * 1000,
    );
  });

  /**
   * BDD Scenario: relation lookups after selection.
   *
   * Given: a batch of candidates.
   * When: the blockers are resolved.
   * Then: every relation is queried for the selected ids only, never as a full
   * table read.
   */
  it("When: blockers are resolved Then: relations are queried by the selected ids", async () => {
    const find = jest.fn().mockResolvedValue(subjects);
    const { identityFind, orderFind, blockers } = createBlockers({});
    const service = new Service({
      find,
      delete: jest.fn().mockResolvedValue({}),
      blockers,
    });

    await service.execute();

    const expectedFilter = {
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "inArray",
              value: [
                "subject-stale",
                "subject-with-identity",
                "subject-with-order",
              ],
            },
          ],
        },
      },
    };

    expect(identityFind).toHaveBeenCalledWith(expectedFilter);
    expect(orderFind).toHaveBeenCalledWith(expectedFilter);
  });

  /**
   * BDD Scenario: owned subjects survive.
   *
   * Given: one candidate has an identity and another has an order.
   * When: the cleanup runs.
   * Then: only the subject without a blocking relation is deleted and the
   * result names the reason each other subject was kept.
   */
  it("When: a candidate owns data Then: it is retained with its reason", async () => {
    const find = jest.fn().mockResolvedValue(subjects);
    const deleteSubject = jest.fn().mockResolvedValue({});
    const { blockers } = createBlockers({
      identity: ["subject-with-identity"],
      order: ["subject-with-order"],
    });
    const service = new Service({
      find,
      delete: deleteSubject,
      blockers,
    });

    const result = await service.execute();

    expect(deleteSubject).toHaveBeenCalledTimes(1);
    expect(deleteSubject).toHaveBeenCalledWith({ id: "subject-stale" });
    expect(result).toEqual({
      scanned: 3,
      deleted: 1,
      failed: 0,
      retained: 2,
      retainedByReason: {
        identity: 1,
        "ecommerce-module-order": 1,
      },
    });
  });

  /**
   * BDD Scenario: one deletion fails.
   *
   * Given: the first delete rejects.
   * When: the cleanup runs.
   * Then: the failure is counted and logged, and the batch continues.
   */
  it("When: a deletion fails Then: it is counted and the batch continues", async () => {
    const find = jest.fn().mockResolvedValue(subjects);
    const deleteSubject = jest
      .fn()
      .mockRejectedValueOnce(new Error("delete failed"))
      .mockResolvedValue({});
    const service = new Service({
      find,
      delete: deleteSubject,
      blockers: [],
    });

    const result = await service.execute();

    expect(deleteSubject).toHaveBeenCalledTimes(3);
    expect(result.failed).toBe(1);
    expect(result.deleted).toBe(2);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: nothing to clean.
   *
   * Given: no candidate matches the retention period.
   * When: the cleanup runs.
   * Then: no relation is read and no deletion is attempted.
   */
  it("When: no candidate matches Then: no relation is read", async () => {
    const find = jest.fn().mockResolvedValue([]);
    const deleteSubject = jest.fn();
    const { identityFind, blockers } = createBlockers({});
    const service = new Service({
      find,
      delete: deleteSubject,
      blockers,
    });

    const result = await service.execute();

    expect(identityFind).not.toHaveBeenCalled();
    expect(deleteSubject).not.toHaveBeenCalled();
    expect(result.scanned).toBe(0);
  });
});
