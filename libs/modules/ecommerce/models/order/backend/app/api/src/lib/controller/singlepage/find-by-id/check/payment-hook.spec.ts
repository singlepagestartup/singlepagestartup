/**
 * BDD Suite: Project payment completion extension.
 * Given: a paying order has a successful payment intent.
 * When: the shared checker completes that order.
 * Then: project effects finish before paid is persisted and can fail for a safe retry.
 */
const mockUpdate = jest.fn();
const mockHook = jest.fn();
jest.mock("@sps/shared-utils", () => ({ RBAC_SECRET_KEY: "test-key" }));
jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({ status: 500, message: error.message }),
  logger: { error: jest.fn() },
}));
jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: { update: (...args: unknown[]) => mockUpdate(...args) },
}));
jest.mock("@sps/billing/models/payment-intent/sdk/server", () => ({
  api: { update: jest.fn() },
}));
import { Handler, type IPaymentSucceededProps } from "./index";
class ProjectHandler extends Handler {
  protected override async onPaymentSucceeded(props: IPaymentSucceededProps) {
    await mockHook(props);
  }
}
function fixture(status = "succeeded") {
  const order = {
    id: "order",
    status: "paying",
    updatedAt: new Date().toISOString(),
  };
  const service = {
    findById: jest.fn().mockResolvedValue(order),
    ordersToBillingModuleCurrencies: { find: jest.fn().mockResolvedValue([]) },
    ordersToBillingModulePaymentIntents: {
      find: jest
        .fn()
        .mockResolvedValue([{ billingModulePaymentIntentId: "payment" }]),
    },
    billingModule: {
      paymentIntent: {
        findById: jest.fn().mockResolvedValue({ id: "payment", status }),
      },
      paymentIntentsToInvoices: { find: jest.fn().mockResolvedValue([]) },
    },
  };
  const context = {
    req: { param: () => order.id },
    json: (value: unknown) => value,
  };
  return { order, service, context };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockHook.mockReset();
  mockUpdate.mockResolvedValue({});
});
/**
 * BDD Scenario: a child completes its paid-product hook.
 * Given: payment succeeded and a project hook is installed.
 * When: the shared check completes payment.
 * Then: the hook runs before the paid update.
 */
it("runs project effects before persisting the paid order", async () => {
  const { order, service, context } = fixture();
  await new ProjectHandler(service as any).execute(context as any, undefined);
  expect(mockHook).toHaveBeenCalledWith({ order });
  expect(mockHook.mock.invocationCallOrder[0]).toBeLessThan(
    mockUpdate.mock.invocationCallOrder[0],
  );
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ status: "paid" }),
    }),
  );
});
/**
 * BDD Scenario: a child operation is temporarily unavailable.
 * Given: payment succeeded but a required project effect fails.
 * When: the check runs.
 * Then: paid is not persisted and the hook can be retried.
 */
it("keeps a failed project completion retryable", async () => {
  const { service, context } = fixture();
  mockHook.mockRejectedValueOnce(new Error("availability unavailable"));
  const handler = new ProjectHandler(service as any);
  await expect(handler.execute(context as any, undefined)).rejects.toThrow(
    "availability unavailable",
  );
  expect(mockUpdate).not.toHaveBeenCalled();
  await handler.execute(context as any, undefined);
  expect(mockHook).toHaveBeenCalledTimes(2);
  expect(mockUpdate).toHaveBeenCalledTimes(1);
});
/**
 * BDD Scenario: a framework consumer has no project hook.
 * Given: a successful payment and the framework default checker.
 * When: payment is completed.
 * Then: the existing paid transition is preserved.
 */
it("preserves the framework default without project-specific effects", async () => {
  const { service, context } = fixture();
  await new Handler(service as any).execute(context as any, undefined);
  expect(mockHook).not.toHaveBeenCalled();
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ status: "paid" }),
    }),
  );
});
/**
 * BDD Scenario: payment is still pending.
 * Given: a recent paying order with an unfinished payment.
 * When: the shared check runs.
 * Then: project completion is not invoked.
 */
it("does not run project completion for a pending payment", async () => {
  const { service, context } = fixture("requires_payment_method");
  await new ProjectHandler(service as any).execute(context as any, undefined);
  expect(mockHook).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
});
