/**
 * BDD Suite: MCP content-management generic operations
 * Given content entities expose mocked server SDK adapters
 * When Codex calls generic find, create, update, delete, and localized update operations
 * Then the operations validate input, forward caller auth headers, and respect dry-run or confirmation guardrails
 */

import { z } from "zod";
import {
  applyDeleteContentRecord,
  createContentRecord,
  describeContentEntities,
  findContentRecords,
  previewDeleteContentRecord,
  updateContentRecord,
  updateLocalizedContentField,
} from "./operations";
import { IContentEntityDescriptor } from "./types";

const authHeaders = {
  Authorization: "Bearer test-jwt",
};

function createApi(records: Record<string, any>[] = []) {
  return {
    find: jest.fn(async () => records),
    count: jest.fn(async () => records.length),
    findById: jest.fn(async ({ id }: { id: string }) =>
      records.find((record) => record.id === id),
    ),
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "created-record",
      ...data,
    })),
    update: jest.fn(
      async ({ id, data }: { id: string; data: Record<string, unknown> }) => ({
        id,
        ...data,
      }),
    ),
    delete: jest.fn(async ({ id }: { id: string }) => ({
      id,
      deleted: true,
    })),
  };
}

function createDescriptor(
  api: ReturnType<typeof createApi>,
  props?: {
    key?: IContentEntityDescriptor["key"];
    kind?: IContentEntityDescriptor["kind"];
  },
): IContentEntityDescriptor {
  const key = props?.key ?? "blog.widget";

  return {
    key,
    kind: props?.kind ?? "model",
    module: key.split(".")[0],
    name: key.split(".").slice(1).join("."),
    route: `/api/${key}`,
    title: key,
    description: key,
    variants: ["default", "list"],
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "title", type: "json", localized: true },
      { name: "adminTitle", type: "text" },
    ],
    localizedFields: key === "blog.widget" ? ["title"] : [],
    relationFields: [],
    operations: ["find", "count", "get-by-id", "create", "update", "delete"],
    insertSchema: z
      .object({
        title: z.record(z.any()).optional(),
        adminTitle: z.string().optional(),
      })
      .passthrough(),
    selectSchema: z.object({ id: z.string() }).passthrough(),
    api,
  };
}

describe("MCP content-management generic operations", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: Entity list exposes descriptor metadata
   * Given a supported blog widget descriptor
   * When Codex asks for content entities
   * Then the response includes fields, localized fields, variants, and operations
   */
  it("summarizes supported content entity descriptors", () => {
    const api = createApi();
    const registry = [createDescriptor(api)];

    expect(describeContentEntities({ registry })).toEqual([
      expect.objectContaining({
        key: "blog.widget",
        fields: expect.arrayContaining([
          expect.objectContaining({ name: "title", localized: true }),
        ]),
        localizedFields: ["title"],
        variants: ["default", "list"],
        operations: [
          "find",
          "count",
          "get-by-id",
          "create",
          "update",
          "delete",
        ],
      }),
    ]);
  });

  /**
   * BDD Scenario: Filtered find forwards query arguments
   * Given a content entity SDK adapter supports filtered find
   * When Codex asks for blog widgets with filters and ordering
   * Then filters, order, limit, and caller auth headers are forwarded to the SDK
   */
  it("forwards filtered find arguments with caller auth headers", async () => {
    const api = createApi([{ id: "widget-1" }]);
    const registry = [createDescriptor(api)];

    await expect(
      findContentRecords(
        {
          entity: "blog.widget",
          filters: {
            and: [
              {
                column: "title->>en",
                method: "ilike",
                value: "Articles",
              },
            ],
          },
          orderBy: {
            and: [{ column: "createdAt", method: "desc" }],
          },
          limit: 2,
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual([{ id: "widget-1" }]);

    expect(api.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "title->>en",
              method: "ilike",
              value: "Articles",
            },
          ],
        },
        orderBy: {
          and: [{ column: "createdAt", method: "desc" }],
        },
        limit: 2,
      },
      options: {
        headers: authHeaders,
      },
    });
  });

  /**
   * BDD Scenario: Create dry-run validates without writing
   * Given Codex prepares a create payload
   * When dryRun is true
   * Then validated data is returned and the SDK create method is not called
   */
  it("returns create previews without invoking SDK writes", async () => {
    const api = createApi();
    const registry = [createDescriptor(api)];

    await expect(
      createContentRecord(
        {
          entity: "blog.widget",
          data: {
            title: { en: "Articles" },
            adminTitle: "Articles",
          },
          dryRun: true,
        },
        { registry },
      ),
    ).resolves.toEqual({
      operation: "create",
      entity: "blog.widget",
      data: {
        title: { en: "Articles" },
        adminTitle: "Articles",
      },
    });
    expect(api.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: Update forwards validated patch
   * Given a content entity SDK adapter supports update
   * When Codex applies a generic update
   * Then the validated patch and caller auth headers are forwarded to the SDK
   */
  it("forwards generic update patches with caller auth headers", async () => {
    const api = createApi();
    const registry = [createDescriptor(api)];

    await expect(
      updateContentRecord(
        {
          entity: "blog.widget",
          id: "widget-1",
          data: {
            adminTitle: "Fresh Articles",
          },
          dryRun: false,
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual({
      id: "widget-1",
      adminTitle: "Fresh Articles",
    });

    expect(api.update).toHaveBeenCalledWith({
      id: "widget-1",
      data: {
        adminTitle: "Fresh Articles",
      },
      options: {
        headers: authHeaders,
      },
    });
  });

  /**
   * BDD Scenario: Delete requires preview token before apply
   * Given delete-preview returns the current record and token
   * When delete-apply uses that exact token with confirm true
   * Then the SDK delete method is invoked for the selected record
   */
  it("guards delete apply with an exact preview token", async () => {
    const api = createApi([{ id: "widget-1", adminTitle: "Articles" }]);
    const registry = [createDescriptor(api)];

    await expect(
      previewDeleteContentRecord(
        {
          entity: "blog.widget",
          id: "widget-1",
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual({
      entity: "blog.widget",
      id: "widget-1",
      record: {
        id: "widget-1",
        adminTitle: "Articles",
      },
      confirmationToken: "blog.widget:widget-1",
    });

    await expect(
      applyDeleteContentRecord(
        {
          entity: "blog.widget",
          id: "widget-1",
          confirm: true,
          confirmationToken: "wrong-token",
        },
        { registry, authHeaders },
      ),
    ).rejects.toThrow(
      "Validation error. Delete confirmation token does not match entity and id",
    );

    await expect(
      applyDeleteContentRecord(
        {
          entity: "blog.widget",
          id: "widget-1",
          confirm: true,
          confirmationToken: "blog.widget:widget-1",
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual({
      id: "widget-1",
      deleted: true,
    });
    expect(api.delete).toHaveBeenCalledWith({
      id: "widget-1",
      options: {
        headers: authHeaders,
      },
    });
  });

  /**
   * BDD Scenario: Delete preview includes known relation context
   * Given a blog widget is linked through host external widget relations
   * When Codex previews deleting the blog widget
   * Then the preview includes related host relation records discovered through SDK reads
   */
  it("includes host relation context in blog widget delete previews", async () => {
    const blogApi = createApi([{ id: "widget-1", adminTitle: "Articles" }]);
    const externalRelationApi = createApi([
      {
        id: "external-relation-1",
        widgetId: "host-widget-1",
        externalModule: "blog",
        externalWidgetId: "widget-1",
      },
    ]);
    const hostWidgetApi = createApi([
      {
        id: "host-widget-1",
        adminTitle: "Articles slot",
      },
    ]);
    const pageWidgetApi = createApi([
      {
        id: "page-widget-1",
        pageId: "page-1",
        widgetId: "host-widget-1",
      },
    ]);
    const registry = [
      createDescriptor(blogApi),
      createDescriptor(externalRelationApi, {
        key: "host.widgets-to-external-widgets",
        kind: "relation",
      }),
      createDescriptor(hostWidgetApi, { key: "host.widget" }),
      createDescriptor(pageWidgetApi, {
        key: "host.pages-to-widgets",
        kind: "relation",
      }),
    ];

    await expect(
      previewDeleteContentRecord(
        {
          entity: "blog.widget",
          id: "widget-1",
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        entity: "blog.widget",
        id: "widget-1",
        relationContext: {
          externalWidgetRelations: [
            {
              id: "external-relation-1",
              widgetId: "host-widget-1",
              externalModule: "blog",
              externalWidgetId: "widget-1",
            },
          ],
          hostWidgets: [
            {
              id: "host-widget-1",
              adminTitle: "Articles slot",
            },
          ],
          pageWidgets: [
            {
              id: "page-widget-1",
              pageId: "page-1",
              widgetId: "host-widget-1",
            },
          ],
        },
      }),
    );
  });

  /**
   * BDD Scenario: Localized update dry-run preserves siblings
   * Given a blog widget title has English and Russian values
   * When Codex dry-runs title.en update
   * Then the proposed patch changes English and keeps Russian without invoking update
   */
  it("dry-runs localized field updates without dropping sibling locales", async () => {
    const api = createApi([
      {
        id: "widget-1",
        title: {
          en: "Articles",
          ru: "Статьи",
        },
      },
    ]);
    const registry = [createDescriptor(api)];

    await expect(
      updateLocalizedContentField(
        {
          entity: "blog.widget",
          id: "widget-1",
          field: "title",
          locale: "en",
          value: "Fresh articles",
          dryRun: true,
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual({
      operation: "localized-field-update",
      entity: "blog.widget",
      id: "widget-1",
      before: {
        en: "Articles",
        ru: "Статьи",
      },
      after: {
        en: "Fresh articles",
        ru: "Статьи",
      },
      data: {
        title: {
          en: "Fresh articles",
          ru: "Статьи",
        },
      },
    });
    expect(api.update).not.toHaveBeenCalled();
  });
});
