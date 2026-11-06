import { pgTable, uuid } from "drizzle-orm/pg-core";
import { Database } from "./index";
import { Service } from "../../service/crud";
import { Controller } from "../../controllers/rest";
import { App } from "../../app/default";

it("passes serializable resource descriptions through repository, service, controller and app", () => {
  const parent = pgTable("parent", { id: uuid().primaryKey() });
  const child = pgTable("child", { id: uuid().primaryKey() });
  const links = pgTable("links", {
    id: uuid().primaryKey(),
    ownerKey: uuid("owner_key").references(() => parent.id),
    targetKey: uuid("target_key").references(() => child.id),
  });
  const resource = Database.prototype.describe.call({ Table: links } as any);
  const describe = jest.fn(() => resource);
  const service = new Service({ describe } as any);
  const controller = new Controller(service);
  const app = new App({ catch: jest.fn() } as any, controller, {} as any);
  expect(app.describeRoutes()).toEqual([
    {
      route: "",
      resource: {
        table: "public.links",
        columns: ["id", "ownerKey", "targetKey"],
        references: [
          { column: "ownerKey", table: "public.parent", targetColumn: "id" },
          { column: "targetKey", table: "public.child", targetColumn: "id" },
        ],
      },
    },
  ]);
  expect(describe).toHaveBeenCalledTimes(1);
  expect(JSON.parse(JSON.stringify(app.describeRoutes()))).toEqual(
    app.describeRoutes(),
  );
});
