/**
 * BDD Suite: subject activity recording.
 *
 * Given: retention reads `updatedAt` as the last sign of life of a subject.
 * When: a session is initialized or refreshed.
 * Then: the row is touched once per activity interval and a failed touch never
 * reaches the caller.
 */

const mockLoggerError = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS: 3600,
}));

jest.mock("@sps/backend-utils", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

import { Service } from "./record-activity";

describe("Given: a subject renews its session", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: a busy session.
   *
   * Given: the subject was touched inside the activity interval.
   * When: activity is recorded again.
   * Then: no write happens, so a busy session does not write per request.
   */
  it("When: the last activity is inside the interval Then: the row is not written", async () => {
    const update = jest.fn();
    const service = new Service({ update });

    const written = await service.execute({
      subject: {
        id: "subject-1",
        updatedAt: new Date(Date.now() - 60 * 1000),
      },
    });

    expect(written).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a returning visitor.
   *
   * Given: the subject was last touched before the activity interval.
   * When: activity is recorded.
   * Then: the row is updated through the repository path, which sets the new
   * timestamp itself.
   */
  it("When: the last activity is older than the interval Then: the row is touched", async () => {
    const update = jest.fn().mockResolvedValue({ id: "subject-1" });
    const service = new Service({ update });

    const written = await service.execute({
      subject: {
        id: "subject-1",
        updatedAt: new Date(Date.now() - 2 * 3600 * 1000),
      },
    });

    expect(written).toBe(true);
    expect(update).toHaveBeenCalledWith({ id: "subject-1", data: {} });
  });

  /**
   * BDD Scenario: a subject without a known last activity.
   *
   * Given: the caller passes no timestamp.
   * When: activity is recorded.
   * Then: the row is touched, so the subject starts its retention window from
   * this visit.
   */
  it("When: the subject has no timestamp Then: the row is touched", async () => {
    const update = jest.fn().mockResolvedValue({ id: "subject-1" });
    const service = new Service({ update });

    const written = await service.execute({ subject: { id: "subject-1" } });

    expect(written).toBe(true);
    expect(update).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: the touch fails.
   *
   * Given: the update rejects.
   * When: activity is recorded during a session request.
   * Then: the failure is logged and the caller still receives its session.
   */
  it("When: the update fails Then: the error is logged and not thrown", async () => {
    const update = jest.fn().mockRejectedValue(new Error("database is down"));
    const service = new Service({ update });

    const written = await service.execute({
      subject: {
        id: "subject-1",
        updatedAt: new Date(Date.now() - 2 * 3600 * 1000),
      },
    });

    expect(written).toBe(false);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
  });
});
