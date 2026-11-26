import { Service } from "./index";
import { McpCatalogUnavailable } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/mcp/catalog";

const item = { eventId: "event", taskId: "task", storeId: "store" };
function fixture() {
  const hasAttempt = jest.fn().mockResolvedValue(false);
  const service = new Service({
    hasUnfinishedOrReplyAttempt: hasAttempt,
    atomic: async (_key: string, run: () => Promise<unknown>) => run(),
  } as never);
  let preparationFailures = 0;
  let pending = true;
  const intake = {
    listPendingWork: jest.fn(async () =>
      pending ? [{ ...item, preparationFailures }] : [],
    ),
    retryPreparation: jest.fn(
      async (_id: string, previous: number, _delay: number) => {
        if (previous !== preparationFailures) {
          return false;
        }
        preparationFailures++;
        return true;
      },
    ),
    defer: jest.fn(),
    ack: jest.fn(async () => {
      pending = false;
    }),
    deliverEmployeeTrainingFailure: jest.fn().mockResolvedValue(true),
    failForCustomerWalletBalance: jest.fn(async () => {
      pending = false;
      return true;
    }),
  };
  jest.spyOn(service, "modules", "get").mockReturnValue({
    rbac: { subject: { customerWork: intake } },
  } as never);
  const dispatch = jest
    .spyOn(service, "dispatch")
    .mockImplementation(async () => {
      pending = false;
      return { id: "attempt", state: "delivered" };
    });
  return { service, intake, dispatch, hasAttempt };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("rechecks a wake before commit and recovers a pre-provider outage in the same task", async () => {
  const { service, intake, dispatch } = fixture();
  intake.listPendingWork.mockResolvedValueOnce([]);
  dispatch.mockRejectedValueOnce(
    new McpCatalogUnavailable(new Error("connection refused")),
  );
  service.wakeCustomerWork(item.taskId);
  await jest.runAllTimersAsync();
  expect(intake.listPendingWork.mock.calls).toEqual(
    Array(4).fill([{ limit: 1, taskId: item.taskId, includeRetryCount: true }]),
  );
  expect(intake.retryPreparation).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledTimes(2);
  expect(intake.deliverEmployeeTrainingFailure).not.toHaveBeenCalled();
});

it("reports a persistent MCP outage once in the employee thread before acknowledging it", async () => {
  const { service, intake, dispatch } = fixture();
  dispatch.mockRejectedValue(
    new McpCatalogUnavailable(new Error("ECONNREFUSED")),
  );
  service.wakeCustomerWork(item.taskId);
  await jest.runAllTimersAsync();
  expect(dispatch).toHaveBeenCalledTimes(4);
  expect(intake.retryPreparation.mock.calls.map((call) => call[2])).toEqual([
    1000, 5000, 30000,
  ]);
  expect(intake.deliverEmployeeTrainingFailure).toHaveBeenCalledTimes(1);
  expect(intake.deliverEmployeeTrainingFailure).toHaveBeenCalledWith(
    item,
    "mcp",
  );
  expect(intake.ack).toHaveBeenCalledWith({
    eventId: item.eventId,
    failed: true,
  });
});

it("leaves an unknown provider outcome to reconciliation", async () => {
  const { service, intake, dispatch } = fixture();
  dispatch.mockResolvedValue({ id: "paid", state: "unknown" });
  service.wakeCustomerWork(item.taskId);
  await jest.runAllTimersAsync();
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(intake.ack).not.toHaveBeenCalled();
  expect(intake.deliverEmployeeTrainingFailure).not.toHaveBeenCalled();
});

it("reports insufficient balance in a metered order without retrying the charge", async () => {
  const { service, intake, dispatch } = fixture();
  dispatch.mockRejectedValueOnce(
    new Error("Payment required. Insufficient available wallet balance"),
  );

  await expect(service.drain()).resolves.toBe(true);

  expect(intake.failForCustomerWalletBalance).toHaveBeenCalledWith(item);
  expect(intake.retryPreparation).not.toHaveBeenCalled();
  expect(dispatch).toHaveBeenCalledTimes(1);
});

it("does not dispatch after another worker records an attempt during the backoff", async () => {
  const { service, hasAttempt, dispatch, intake } = fixture();
  dispatch.mockRejectedValueOnce(new Error("Transient failure"));
  hasAttempt.mockResolvedValueOnce(false).mockResolvedValue(true);
  service.wakeCustomerWork(item.taskId);
  await jest.runAllTimersAsync();
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(intake.ack).not.toHaveBeenCalled();
});

it("retries a transient queue read on the addressed task", async () => {
  const { service, intake, dispatch } = fixture();
  intake.listPendingWork.mockRejectedValueOnce(
    new Error("Temporary database outage"),
  );
  service.wakeCustomerWork(item.taskId);
  await jest.runAllTimersAsync();
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(intake.listPendingWork).toHaveBeenCalledTimes(3);
  expect(intake.listPendingWork).toHaveBeenCalledWith({
    limit: 1,
    taskId: item.taskId,
    includeRetryCount: true,
  });
});

it("finishes an order reply after a restart when cron picks up its last preparation retry", async () => {
  const { service, intake, dispatch } = fixture();
  intake.listPendingWork.mockResolvedValueOnce([
    { ...item, preparationFailures: 3 },
  ]);
  intake.deliverEmployeeTrainingFailure.mockResolvedValue(false);
  dispatch.mockRejectedValue(new Error("Unavailable before generation"));
  await service.drain();
  expect(intake.ack).toHaveBeenCalledWith({
    eventId: item.eventId,
    failed: true,
  });
  expect(intake.retryPreparation).not.toHaveBeenCalled();
});
