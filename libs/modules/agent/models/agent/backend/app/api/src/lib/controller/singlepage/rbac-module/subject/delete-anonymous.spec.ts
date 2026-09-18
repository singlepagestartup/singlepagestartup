/**
 * BDD Suite: scheduled anonymous subject cleanup handler.
 *
 * Given: the cleanup agent owns the schedule, not the retention rules.
 * When: the agent route is called.
 * Then: the handler delegates to the rbac module in one call and reports the
 * counts it receives.
 */

const mockDeleteAnonymous = jest.fn();
const mockLoggerInfo = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
  logger: {
    info: (...args: unknown[]) => mockLoggerInfo(...args),
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    deleteAnonymous: (...args: unknown[]) => mockDeleteAnonymous(...args),
  },
}));

import { Handler } from "./delete-anonymous";

function createContext() {
  return {
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  return {
    rbacModule: {
      subject: { find: jest.fn(), delete: jest.fn() },
      subjectsToIdentities: { find: jest.fn() },
      subjectsToSocialModuleProfiles: { find: jest.fn() },
    },
  } as any;
}

describe("Given: the anonymous cleanup agent route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteAnonymous.mockResolvedValue({
      scanned: 3,
      deleted: 1,
      failed: 0,
      retained: 2,
      retainedByReason: { identity: 2 },
    });
  });

  /**
   * BDD Scenario: the agent delegates.
   *
   * Given: the agent has the module secret.
   * When: the route is called.
   * Then: the rbac module runs the retention rules once and the agent reads
   * neither subjects nor relations itself.
   */
  it("When: the route is called Then: the rbac module is called once with the secret", async () => {
    const service = createService();
    const handler = new Handler(service);
    const context = createContext();

    const response: any = await handler.execute(context, jest.fn());

    expect(mockDeleteAnonymous).toHaveBeenCalledTimes(1);
    expect(mockDeleteAnonymous).toHaveBeenCalledWith({
      data: {},
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "test-rbac-secret",
        },
      },
    });
    expect(service.rbacModule.subject.find).not.toHaveBeenCalled();
    expect(service.rbacModule.subject.delete).not.toHaveBeenCalled();
    expect(service.rbacModule.subjectsToIdentities.find).not.toHaveBeenCalled();
    expect(
      service.rbacModule.subjectsToSocialModuleProfiles.find,
    ).not.toHaveBeenCalled();
    expect(response.data.ok).toBe(true);
    expect(response.data.result.deleted).toBe(1);
    expect(response.data.result.retained).toBe(2);
  });

  /**
   * BDD Scenario: the cleanup fails.
   *
   * Given: the rbac module rejects the call.
   * When: the route is called.
   * Then: the handler raises the error so the cron run is visibly failed.
   */
  it("When: the rbac module fails Then: the error surfaces", async () => {
    mockDeleteAnonymous.mockRejectedValue(new Error("cleanup failed"));

    const handler = new Handler(createService());

    await expect(
      handler.execute(createContext(), jest.fn()),
    ).rejects.toBeTruthy();
  });
});
