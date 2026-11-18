import { Service } from "./index";
import { createAppAssembly } from "@sps/shared-backend-api";
import { bootstrap, createService } from "../../bootstrap";
import { Service as StartupRevocation } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/startup/ecommerce/order/role-revocation";
function fixture() {
  let current: { id: string; subjectId: string; roleId: string } | null = {
    id: "grant",
    subjectId: "subject",
    roleId: "role",
  };
  const repository = {
    findFirstByField: jest.fn(async () => current),
    deleteFirstByField: jest.fn(async () => {
      const previous = current;
      current = null;
      return previous;
    }),
    updateFirstByField: jest.fn(
      async (_field, _value, data) => (current = { ...current!, ...data }),
    ),
    withSubjectGrantTransaction: jest.fn(async (_subject, operation) =>
      operation(),
    ),
  };
  const service = new Service(repository as never);
  const dependencies = {
    revoke: jest.fn(async () => {}),
    canFulfill: jest.fn(async () => true),
  };
  return { service, repository, dependencies };
}
it("fails closed when a new service instance is not configured for revocation", async () => {
  const { service, repository } = fixture();
  await expect(service.delete({ id: "grant" })).rejects.toThrow(
    "not configured",
  );
  await expect(
    service.update({ id: "grant", data: { roleId: "other" } as never }),
  ).rejects.toThrow("not configured");
  expect(repository.deleteFirstByField).not.toHaveBeenCalled();
  expect(repository.updateFirstByField).not.toHaveBeenCalled();
});
it("marks matching orders before deleting a grant inside the owning transaction", async () => {
  const { service, repository, dependencies } = fixture();
  service.configureRevocation(dependencies);
  await service.delete({ id: "grant" });
  expect(repository.withSubjectGrantTransaction).toHaveBeenCalledWith(
    "subject",
    expect.any(Function),
  );
  expect(dependencies.revoke).toHaveBeenCalledWith(
    expect.objectContaining({ subjectId: "subject", roleId: "role" }),
  );
  expect(dependencies.revoke.mock.invocationCallOrder[0]).toBeLessThan(
    repository.deleteFirstByField.mock.invocationCallOrder[0],
  );
});
it("uses startup revocation before HTTP and serves the same relation after startup", async () => {
  const assembly = createAppAssembly();
  const scoped = createService(assembly);
  const direct = fixture();
  const http = fixture();
  const revoke = jest
    .spyOn(StartupRevocation.prototype, "revoke")
    .mockResolvedValue();
  try {
    scoped.repository = direct.repository as never;
    await scoped.delete({ id: "grant" });
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(direct.repository.deleteFirstByField).toHaveBeenCalledTimes(1);
    expect(createService()).not.toBe(scoped);

    scoped.repository = http.repository as never;
    const { app } = await bootstrap(assembly);
    expect(app.controller.service).toBe(scoped);
    const response = await app.hono.request("/grant", { method: "DELETE" });
    expect(response.status).toBe(200);
    expect(revoke).toHaveBeenCalledTimes(2);
    expect(http.repository.deleteFirstByField).toHaveBeenCalledTimes(1);
  } finally {
    revoke.mockRestore();
  }
});
it("does not delete or reassign the grant when marking revocation fails", async () => {
  const { service, repository, dependencies } = fixture();
  dependencies.revoke.mockRejectedValue(new Error("order write failed"));
  service.configureRevocation(dependencies);
  await expect(service.delete({ id: "grant" })).rejects.toThrow(
    "order write failed",
  );
  expect(repository.deleteFirstByField).not.toHaveBeenCalled();
  await expect(
    service.update({ id: "grant", data: { subjectId: "other" } as never }),
  ).rejects.toThrow();
  expect(repository.updateFirstByField).not.toHaveBeenCalled();
});
it("allows only verified internal fulfillment cleanup without stamping revocation", async () => {
  const { service, repository, dependencies } = fixture();
  service.configureRevocation(dependencies);
  dependencies.canFulfill.mockResolvedValue(false);
  await expect(
    service.deleteForOrderFulfillment({
      id: "grant",
      subjectId: "subject",
      orderId: "order",
    }),
  ).rejects.toThrow("scope");
  expect(repository.deleteFirstByField).not.toHaveBeenCalled();
  dependencies.canFulfill.mockResolvedValue(true);
  await service.deleteForOrderFulfillment({
    id: "grant",
    subjectId: "subject",
    orderId: "order",
  });
  expect(dependencies.revoke).not.toHaveBeenCalled();
  expect(repository.deleteFirstByField).toHaveBeenCalled();
});
