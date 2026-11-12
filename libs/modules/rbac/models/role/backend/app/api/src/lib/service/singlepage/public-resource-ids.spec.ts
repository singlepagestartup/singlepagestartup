import { Service } from "./public-resource-ids";
const first = "11111111-1111-4111-8111-111111111111";
const second = "22222222-2222-4222-8222-222222222222";
function fixture() {
  const dependencies = {
    permission: {
      find: jest.fn(),
      isSensitiveRoute: jest.fn(async () => false),
    },
    rolesToPermissions: { find: jest.fn(async () => []) },
  };
  return { dependencies, service: new Service(dependencies as any) };
}
it("selects only exact roleless GET resource grants and respects the owner's sensitive-route policy", async () => {
  const { dependencies, service } = fixture();
  dependencies.permission.find.mockResolvedValue([
    { id: "public", variant: "hidden", path: "/api/custom/items/" + first },
    { id: "private", path: "/api/custom/items/" + second },
    { id: "template", path: "/api/custom/items/[custom.items.id]" },
    { id: "other", path: "/api/custom/items-extra/" + first },
    { id: "nested", path: "/api/custom/items/" + first + "/files/" + second },
  ]);
  dependencies.rolesToPermissions.find.mockResolvedValue([
    { permissionId: "private" },
  ] as any);
  expect(await service.execute({ resource: "/api/custom/items" })).toEqual([
    first,
  ]);
  dependencies.permission.isSensitiveRoute.mockResolvedValue(true);
  expect(await service.execute({ resource: "/api/custom/items" })).toEqual([]);
});
it("paginates permission candidates and every role binding before publishing an ID", async () => {
  const { dependencies, service } = fixture();
  dependencies.permission.find
    .mockResolvedValueOnce(
      Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        path: "/api/custom/items/[mask]",
      })),
    )
    .mockResolvedValueOnce([
      { id: "public", variant: "hidden", path: "/api/custom/items/" + first },
    ]);
  dependencies.rolesToPermissions.find
    .mockResolvedValueOnce(
      Array.from({ length: 100 }, () => ({ permissionId: "different" })) as any,
    )
    .mockResolvedValueOnce([{ permissionId: "public" }] as any);
  expect(await service.execute({ resource: "/api/custom/items" })).toEqual([]);
  expect(dependencies.permission.find).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      params: expect.objectContaining({ offset: 100 }),
    }),
  );
  expect(dependencies.rolesToPermissions.find).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      params: expect.objectContaining({ offset: 100 }),
    }),
  );
});
it.each([
  "https://example.test/api/items",
  "/api/custom/items?all=1",
  "/api/custom/[items]",
])("rejects a non-resource path before reading data: %s", async (resource) => {
  const { dependencies, service } = fixture();
  await expect(service.execute({ resource })).rejects.toThrow(
    "Validation error",
  );
  expect(dependencies.permission.find).not.toHaveBeenCalled();
});
