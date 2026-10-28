/**
 * BDD Suite: Framework order notification recipient extension.
 * Given: framework admin recipients or a project-owned channel selector.
 * When: the real order notification service prepares delivery.
 * Then: default recipients remain compatible and project channels need no admin access.
 */
const mockNotify = jest.fn();
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-key",
}));
jest.mock("@sps/backend-utils", () => ({ logger: { error: jest.fn() } }));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { notify: (...a: unknown[]) => mockNotify(...a) },
}));
jest.mock("@sps/rbac/relations/subjects-to-roles/sdk/server", () => ({
  api: { create: jest.fn(), delete: jest.fn() },
}));
jest.mock(
  "@sps/rbac/relations/subjects-to-billing-module-currencies/sdk/server",
  () => ({ api: { create: jest.fn(), update: jest.fn() } }),
);
jest.mock("@sps/ecommerce/models/order/sdk/server", () => ({
  api: { update: jest.fn() },
}));
import { Service } from "./proceed";
class ChannelService extends Service {
  protected override async getAdminNotificationSubjectIds() {
    return ["channel-subject"];
  }
}
function fixture(Ctor: typeof Service) {
  const service: Service = Object.create(Ctor.prototype);
  service.notificationModule = {
    template: {
      find: jest.fn().mockResolvedValue([
        {
          id: "template",
          variant: "generate-telegram-ecommerce-order-status-changed-admin",
        },
      ]),
    },
  } as any;
  service.role = {
    find: jest.fn().mockResolvedValue([{ id: "admin-role" }]),
  } as any;
  service.subjectsToRoles = {
    find: jest
      .fn()
      .mockResolvedValue([
        { subjectId: "admin-subject", roleId: "admin-role" },
      ]),
  } as any;
  service.subjectsToIdentities = {
    find: jest.fn().mockResolvedValue([{ identityId: "identity" }]),
  } as any;
  service.identity = {
    find: jest
      .fn()
      .mockResolvedValue([
        { id: "identity", provider: "telegram", account: "-1001" },
      ]),
  } as any;
  const order = {
    id: "order",
    comment: "",
    ordersToProducts: [],
    ordersToFileStorageModuleFiles: [
      { fileStorageModuleFile: { id: "receipt", file: "/receipt.png" } },
    ],
  };
  return { service, order };
}
beforeEach(() => jest.clearAllMocks());
/**
 * BDD Scenario: stock framework services have no project override.
 * Given: administrators are configured through the existing admin role.
 * When: framework or empty startup services prepare a notification.
 * Then: the original admin subject is selected.
 */
it("preserves framework admin selection", async () => {
  const { service, order } = fixture(Service);
  await service.notifyAdmin({
    extendedEcommerceModuleOrder: order as any,
    status: "approving",
  });
  expect(mockNotify).toHaveBeenCalledWith(
    expect.objectContaining({ id: "admin-subject" }),
  );
});
/**
 * BDD Scenario: role relations repeat an administrator.
 * Given: more than one admin relation points to the same subject.
 * When: the framework resolves notification recipients.
 * Then: the subject receives a single receipt notification.
 */
it("deduplicates repeated administrator relations", async () => {
  const { service, order } = fixture(Service);
  (service.subjectsToRoles.find as jest.Mock).mockResolvedValue([
    { subjectId: "admin-subject" },
    { subjectId: "admin-subject" },
  ]);
  await service.notifyAdmin({
    extendedEcommerceModuleOrder: order as any,
    status: "approving",
  });
  expect(mockNotify).toHaveBeenCalledTimes(1);
});
/**
 * BDD Scenario: a child selects its own service channel.
 * Given: the channel selector returns a subject with no admin role.
 * When: it prepares a receipt notification.
 * Then: the exact channel subject receives the existing receipt payload.
 */
it("allows channel selection without promoting that subject to admin", async () => {
  const { service, order } = fixture(ChannelService);
  await service.notifyAdmin({
    extendedEcommerceModuleOrder: order as any,
    status: "approving",
  });
  expect(service.role.find).not.toHaveBeenCalled();
  expect(mockNotify).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "channel-subject",
      data: expect.objectContaining({
        fileStorage: { files: [{ id: "receipt", file: "/receipt.png" }] },
      }),
    }),
  );
});
