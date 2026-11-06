import { Service } from "./index";
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
  expect(repository.deleteFirstByField).not.toHaveBeenCalled();
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
