import { Service } from "./quantity";
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-secret",
}));

it("counts two wardrobes without increasing the badge for attached delivery and assembly", async () => {
  const service = new Service({
    find: jest.fn().mockResolvedValue([
      { id: "wardrobes", quantity: 2, parentLineId: null },
      { id: "delivery", quantity: 1, parentLineId: "wardrobes" },
      { id: "assembly", quantity: 2, parentLineId: "wardrobes" },
    ]),
  } as any);
  expect(await service.execute({ id: "order" })).toBe(2);
});

it("keeps independent and legacy primary lines, including a standalone service, and reflects removal", async () => {
  let lines = [
    { id: "wardrobes", quantity: 2, parentLineId: undefined },
    { id: "standalone-service", quantity: 3, parentLineId: null },
    { id: "delivery", quantity: 1, parentLineId: "wardrobes" },
  ];
  const service = new Service({ find: jest.fn(async () => lines) } as any);
  expect(await service.execute({ id: "order" })).toBe(5);
  lines = lines.filter(
    (line) => line.id !== "wardrobes" && line.parentLineId !== "wardrobes",
  );
  expect(await service.execute({ id: "order" })).toBe(3);
});
