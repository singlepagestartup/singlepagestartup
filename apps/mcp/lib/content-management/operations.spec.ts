/**
 * BDD Suite: MCP content-management generic operations
 * Given content entities expose mocked server SDK adapters
 * When Codex calls generic find, create, update, delete, and localized update operations
 * Then the operations validate input, forward caller auth headers, and respect dry-run or confirmation guardrails
 */

import { z } from "zod";
import {
  applyDeleteContentModelRecord,
  createContentModelRecord,
  describeContentEntities,
  describeContentModel,
  findContentModelRecords,
  previewDeleteContentModelRecord,
  updateContentModelRecord,
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
    createFromUrl: jest.fn(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "created-from-url-record",
        file: "https://storage.example.com/uploaded.webp",
        ...data,
      }),
    ),
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
    route:
      key === "file-storage.file" ? "/api/file-storage/files" : `/api/${key}`,
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
    operations: ["find", "count", "get", "create", "update", "delete"],
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
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario: Entity list exposes descriptor metadata
   * Given a supported blog widget descriptor
   * When Codex asks for content entities
   * Then the response includes fields, localized fields, variants, and operations
   */
  it("summarizes supported modules with nested model descriptors", () => {
    const api = createApi();
    const registry = [createDescriptor(api)];

    expect(describeContentEntities({ registry })).toEqual({
      modules: [
        expect.objectContaining({
          id: "blog",
          models: [
            expect.objectContaining({
              id: "widget",
              operations: [
                "find",
                "count",
                "get",
                "create",
                "update",
                "delete",
              ],
            }),
          ],
          relations: [],
        }),
      ],
    });
  });

  /**
   * BDD Scenario: Model schema exposes descriptor metadata
   * Given a supported blog widget descriptor
   * When Codex asks for the model schema
   * Then the response includes fields, localized fields, variants, and operations
   */
  it("describes model schema metadata", async () => {
    const api = createApi();
    const registry = [createDescriptor(api)];

    await expect(
      describeContentModel(
        {
          module: "blog",
          model: "widget",
        },
        { registry },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        module: "blog",
        model: "widget",
        fields: expect.arrayContaining([
          expect.objectContaining({ name: "title", localized: true }),
        ]),
        localizedFields: ["title"],
        variants: ["default", "list"],
        operations: ["find", "count", "get", "create", "update", "delete"],
      }),
    );
  });

  /**
   * BDD Scenario: File model schema exposes upload examples
   * Given the file-storage file model supports uploads
   * When Codex asks for the model schema
   * Then the response shows URL and base64 upload examples for AI chat clients
   */
  it("describes file upload examples for file-storage files", async () => {
    const api = createApi();
    const registry = [createDescriptor(api, { key: "file-storage.file" })];

    await expect(
      describeContentModel(
        {
          module: "file-storage",
          model: "file",
        },
        { registry },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        module: "file-storage",
        model: "file",
        writeExamples: expect.objectContaining({
          createFromUrl: expect.objectContaining({
            data: expect.objectContaining({
              url: "https://example.com/image.webp",
            }),
          }),
          uploadBase64: expect.objectContaining({
            data: expect.objectContaining({
              contentBase64: "<base64-without-data-url-prefix>",
              fileName: "image.webp",
              mimeType: "image/webp",
            }),
          }),
        }),
      }),
    );
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
      findContentModelRecords(
        {
          module: "blog",
          model: "widget",
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
      createContentModelRecord(
        {
          module: "blog",
          model: "widget",
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
      module: "blog",
      model: "widget",
      data: {
        title: { en: "Articles" },
        adminTitle: "Articles",
      },
    });
    expect(api.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: File create from URL uses the file API route
   * Given an AI chat client provides a public image URL for file-storage.file
   * When dryRun is false
   * Then MCP calls the file SDK createFromUrl action instead of generic JSON create
   */
  it("creates file-storage file records from public URLs", async () => {
    const api = createApi();
    const registry = [createDescriptor(api, { key: "file-storage.file" })];

    await expect(
      createContentModelRecord(
        {
          module: "file-storage",
          model: "file",
          data: {
            url: "https://example.com/cover.webp",
            adminTitle: "Cover",
            alt: "Cover alt",
          },
          dryRun: false,
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual({
      id: "created-from-url-record",
      file: "https://storage.example.com/uploaded.webp",
      url: "https://example.com/cover.webp",
      adminTitle: "Cover",
      alt: "Cover alt",
    });

    expect(api.createFromUrl).toHaveBeenCalledWith({
      data: {
        url: "https://example.com/cover.webp",
        adminTitle: "Cover",
        alt: "Cover alt",
      },
      options: {
        headers: authHeaders,
      },
    });
    expect(api.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: File create from base64 uses multipart upload
   * Given an AI chat client has a generated image only inside its own sandbox
   * When it sends contentBase64 for file-storage.file
   * Then MCP uploads multipart data to the file-storage API with caller auth
   */
  it("creates file-storage file records from base64 content", async () => {
    const api = createApi();
    const registry = [createDescriptor(api, { key: "file-storage.file" })];
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            id: "file-record",
            file: "https://storage.example.com/cover.webp",
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(
      createContentModelRecord(
        {
          module: "file-storage",
          model: "file",
          data: {
            contentBase64: Buffer.from("image-content").toString("base64"),
            fileName: "cover.webp",
            mimeType: "image/webp",
            adminTitle: "Cover",
            alt: "Cover alt",
          },
          dryRun: false,
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual({
      id: "file-record",
      file: "https://storage.example.com/cover.webp",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/file-storage/files",
      expect.objectContaining({
        method: "POST",
        headers: authHeaders,
        body: expect.any(FormData),
      }),
    );

    const body = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(body.get("data")).toBe(
      JSON.stringify({
        mimeType: "image/webp",
        adminTitle: "Cover",
        alt: "Cover alt",
      }),
    );
    expect(body.get("file")).toBeInstanceOf(File);
    expect(api.create).not.toHaveBeenCalled();
    expect(api.createFromUrl).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: File create rejects inaccessible client paths
   * Given ChatGPT created an image inside /mnt/data
   * When it passes that local path to file-storage.file
   * Then MCP returns an actionable validation error instead of creating a broken record
   */
  it("rejects MCP client local paths for file-storage files", async () => {
    const api = createApi();
    const registry = [createDescriptor(api, { key: "file-storage.file" })];

    await expect(
      createContentModelRecord(
        {
          module: "file-storage",
          model: "file",
          data: {
            file: "/mnt/data/cover.webp",
            adminTitle: "Cover",
          },
          dryRun: false,
        },
        { registry, authHeaders },
      ),
    ).rejects.toThrow("file-storage.file cannot read MCP client local paths");

    expect(api.create).not.toHaveBeenCalled();
    expect(api.createFromUrl).not.toHaveBeenCalled();
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
      updateContentModelRecord(
        {
          module: "blog",
          model: "widget",
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
      previewDeleteContentModelRecord(
        {
          module: "blog",
          model: "widget",
          id: "widget-1",
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual({
      module: "blog",
      model: "widget",
      id: "widget-1",
      record: {
        id: "widget-1",
        adminTitle: "Articles",
      },
      confirmationToken: "model:blog:widget:widget-1",
    });

    await expect(
      applyDeleteContentModelRecord(
        {
          module: "blog",
          model: "widget",
          id: "widget-1",
          confirm: true,
          confirmationToken: "wrong-token",
        },
        { registry, authHeaders },
      ),
    ).rejects.toThrow(
      "Validation error. Delete confirmation token does not match selector and id",
    );

    await expect(
      applyDeleteContentModelRecord(
        {
          module: "blog",
          model: "widget",
          id: "widget-1",
          confirm: true,
          confirmationToken: "model:blog:widget:widget-1",
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
      previewDeleteContentModelRecord(
        {
          module: "blog",
          model: "widget",
          id: "widget-1",
        },
        { registry, authHeaders },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        module: "blog",
        model: "widget",
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
      module: "blog",
      model: "widget",
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
