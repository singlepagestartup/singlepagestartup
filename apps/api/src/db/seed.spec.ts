/**
 * Given saved widget links whose dump IDs differ from production IDs,
 * repeated seeds reuse the same relation and preserve newer production edits.
 */
import fs from "node:fs/promises";
import {
  DatabaseRepository,
  type IConfiguration,
  type ISeedResult,
} from "@sps/shared-backend-api";
import { Configuration as BlogWebsiteBuilderConfiguration } from "../../../../libs/modules/blog/relations/widgets-to-website-builder-module-widgets/backend/app/api/src/lib/configuration";
import { Configuration as SocialWebsiteBuilderConfiguration } from "../../../../libs/modules/social/relations/widgets-to-website-builder-module-widgets/backend/app/api/src/lib/configuration";
import { Configuration as RbacWebsiteBuilderConfiguration } from "../../../../libs/modules/rbac/relations/widgets-to-website-builder-module-widgets/backend/app/api/src/lib/configuration";
import { Configuration as RbacCrmConfiguration } from "../../../../libs/modules/rbac/relations/widgets-to-crm-module-widgets/backend/app/api/src/lib/configuration";
import { Configuration as RbacEcommerceConfiguration } from "../../../../libs/modules/rbac/relations/widgets-to-ecommerce-module-widgets/backend/app/api/src/lib/configuration";

jest.mock("@sps/shared-backend-database-config", () => ({
  getDrizzle: jest.fn(() => ({})),
}));

describe("Widget relation seed replay", () => {
  const ownerDump = "20000000-0000-4000-8000-000000000001";
  const ownerDb = "20000000-0000-4000-8000-000000000002";
  const targetDump = "30000000-0000-4000-8000-000000000001";
  const targetDb = "30000000-0000-4000-8000-000000000002";
  const dumpId = "10000000-0000-4000-8000-000000000001";
  const existingId = "10000000-0000-4000-8000-000000000002";

  afterEach(() => jest.restoreAllMocks());

  function fixture(
    Constructor: new () => IConfiguration,
    ownerModule: string,
    targetModule: string,
    targetField: string,
    existing: boolean,
    newer = false,
  ) {
    const dump = {
      id: dumpId,
      widgetId: ownerDump,
      [targetField]: targetDump,
      orderIndex: 2,
      updatedAt: "2026-10-27T00:00:00.000Z",
    };
    let rows: Record<string, unknown>[] = existing
      ? [
          {
            id: existingId,
            widgetId: ownerDb,
            [targetField]: targetDb,
            orderIndex: 7,
            updatedAt: newer
              ? "2026-10-28T00:00:00.000Z"
              : "2026-10-26T00:00:00.000Z",
          },
        ]
      : [];
    const repository = new DatabaseRepository(new Constructor());
    jest.spyOn(fs, "readdir").mockResolvedValue(["relation.json"] as any);
    jest.spyOn(fs, "readFile").mockResolvedValue(JSON.stringify(dump));
    const find = jest
      .spyOn(repository, "find")
      .mockImplementation(async (props) =>
        rows
          .filter(
            (row) =>
              !props?.params?.filters?.and ||
              props.params.filters.and.every(
                (filter) => row[filter.column] === filter.value,
              ),
          )
          .map((row) => ({ ...row })),
      );
    const insert = jest
      .spyOn(repository, "insert")
      .mockImplementation(async (data) => {
        const row = { ...data, id: existingId };
        rows.push(row);
        return row;
      });
    const update = jest
      .spyOn(repository, "updateFirstByField")
      .mockImplementation(async (_field, id, data) => {
        const row = { ...rows.find((item) => item.id === id), ...data, id };
        rows = rows.map((item) => (item.id === id ? row : item));
        return row;
      });
    const seeds: ISeedResult[] = [
      {
        module: ownerModule,
        name: "widget",
        type: "model",
        seeds: [{ dump: { id: ownerDump }, new: { id: ownerDb } }],
      },
      {
        module: targetModule,
        name: "widget",
        type: "model",
        seeds: [{ dump: { id: targetDump }, new: { id: targetDb } }],
      },
    ];
    return { repository, seeds, find, insert, update, rows: () => rows };
  }

  describe.each([
    [
      "blog: widgets-to-website-builder-module-widgets",
      BlogWebsiteBuilderConfiguration,
      "blog",
      "website-builder",
      "websiteBuilderModuleWidgetId",
    ] as const,
    [
      "social: widgets-to-website-builder-module-widgets",
      SocialWebsiteBuilderConfiguration,
      "social",
      "website-builder",
      "websiteBuilderModuleWidgetId",
    ] as const,
    [
      "rbac: widgets-to-website-builder-module-widgets",
      RbacWebsiteBuilderConfiguration,
      "rbac",
      "website-builder",
      "websiteBuilderModuleWidgetId",
    ] as const,
    [
      "rbac: widgets-to-crm-module-widgets",
      RbacCrmConfiguration,
      "rbac",
      "crm",
      "crmModuleWidgetId",
    ] as const,
    [
      "rbac: widgets-to-ecommerce-module-widgets",
      RbacEcommerceConfiguration,
      "rbac",
      "ecommerce",
      "ecommerceModuleWidgetId",
    ] as const,
  ])("%s", (_name, Constructor, ownerModule, targetModule, targetField) => {
    it("reuses the existing pair and relation UUID across repeated seeds after model IDs are remapped", async () => {
      const test = fixture(
        Constructor,
        ownerModule,
        targetModule,
        targetField,
        true,
      );
      const first = await test.repository.seed({ seeds: test.seeds });
      const second = await test.repository.seed({ seeds: test.seeds });
      expect(first.seeds[0].new.id).toBe(existingId);
      expect(second.seeds[0].new.id).toBe(existingId);
      expect(first.seeds[0].dump.id).toBe(dumpId);
      expect(test.insert).not.toHaveBeenCalled();
      expect(test.update).toHaveBeenCalledWith(
        "id",
        existingId,
        expect.objectContaining({
          widgetId: ownerDb,
          [targetField]: targetDb,
          orderIndex: 2,
        }),
      );
      expect(test.rows()).toHaveLength(1);
    });

    it("preserves a newer production relation instead of replacing it with older dump content", async () => {
      const test = fixture(
        Constructor,
        ownerModule,
        targetModule,
        targetField,
        true,
        true,
      );
      const result = await test.repository.seed({ seeds: test.seeds });
      expect(result.seeds[0].new.id).toBe(existingId);
      expect(result.seeds[0].new.orderIndex).toBe(7);
      expect(test.insert).not.toHaveBeenCalled();
      expect(test.update).not.toHaveBeenCalled();
    });

    it("inserts a missing remapped pair once and reuses it on the next seed", async () => {
      const test = fixture(
        Constructor,
        ownerModule,
        targetModule,
        targetField,
        false,
      );
      await test.repository.seed({ seeds: test.seeds });
      await test.repository.seed({ seeds: test.seeds });
      expect(test.insert).toHaveBeenCalledTimes(1);
      expect(test.rows()).toHaveLength(1);
      expect(test.rows()[0]).toEqual(
        expect.objectContaining({ widgetId: ownerDb, [targetField]: targetDb }),
      );
    });
  });
});
