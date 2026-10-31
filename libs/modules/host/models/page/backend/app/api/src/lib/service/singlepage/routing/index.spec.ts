import { RoutingService } from "./index";
const sources = [
  {
    name: "custom.owners",
    route: "/api/custom/owners",
    resource: { table: "owners", columns: ["id"], references: [] },
  },
  {
    name: "custom.items",
    route: "/api/custom/items",
    resource: { table: "items", columns: ["id"], references: [] },
  },
  {
    name: "custom.links",
    route: "/api/custom/links",
    resource: {
      table: "links",
      columns: ["id", "customOwner", "customTarget"],
      references: [
        { column: "customOwner", table: "owners", targetColumn: "id" },
        { column: "customTarget", table: "items", targetColumn: "id" },
      ],
    },
  },
];
it("reads relation keys from the service resource descriptions in both directions", () => {
  const routing = new RoutingService(sources);
  expect(routing.relation("custom.links", "custom.owners")).toEqual({
    source: "custom.owners",
    sourceKey: "customOwner",
    target: "custom.items",
    targetKey: "customTarget",
  });
  expect(routing.relation("custom.links", "custom.items")).toEqual({
    source: "custom.items",
    sourceKey: "customTarget",
    target: "custom.owners",
    targetKey: "customOwner",
  });
});
it("does not permit arbitrary unregistered endpoint reads", async () => {
  await expect(
    new RoutingService(sources).find("other.private"),
  ).rejects.toThrow("Unknown route source");
});
it("enumerates all API pages instead of truncating at one batch", async () => {
  const routing = new RoutingService(sources);
  const find = jest
    .spyOn(routing, "find")
    .mockResolvedValueOnce(
      Array.from({ length: 100 }, (_, i) => ({ id: String(i) })),
    )
    .mockResolvedValueOnce([{ id: "last" }]);
  expect(await routing.all("custom.items")).toHaveLength(101);
  expect(find.mock.calls[1][1]?.offset).toBe(100);
});
