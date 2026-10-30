import { pgTable, uuid } from "drizzle-orm/pg-core";
import { RoutingService } from "./index";

const left = pgTable("left", { id: uuid().primaryKey() });
const right = pgTable("right", { id: uuid().primaryKey() });
const relation = pgTable("links", {
  id: uuid().primaryKey(),
  customOwner: uuid().references(() => left.id),
  customTarget: uuid().references(() => right.id),
});
const sources = [
  { name: "custom.owners", route: "/api/custom/owners", table: left },
  { name: "custom.items", route: "/api/custom/items", table: right },
  { name: "custom.links", route: "/api/custom/links", table: relation },
];
it("reads relation keys from the registered database schema in both directions", () => {
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
