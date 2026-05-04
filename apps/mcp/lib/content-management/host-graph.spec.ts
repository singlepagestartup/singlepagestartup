/**
 * BDD Suite: MCP content-management host graph resolver
 * Given SPS host pages compose widgets through host relations and external widget links
 * When Codex previews a URL-based content path
 * Then the resolver returns deterministic candidates and refuses ambiguous writes
 */

import { z } from "zod";
import {
  filterHostGraphCandidates,
  requireSingleHostGraphCandidate,
  resolveHostGraph,
} from "./host-graph";
import { IContentEntityDescriptor } from "./types";

const originalRbacSecretKey = process.env.RBAC_SECRET_KEY;

function createDescriptor(props: {
  key: IContentEntityDescriptor["key"];
  kind?: IContentEntityDescriptor["kind"];
  find?: jest.Mock;
  findById?: jest.Mock;
  findByUrl?: jest.Mock;
}): IContentEntityDescriptor {
  return {
    key: props.key,
    kind: props.kind ?? "model",
    module: props.key.split(".")[0],
    name: props.key.split(".").slice(1).join("."),
    route: `/api/${props.key}`,
    title: props.key,
    description: props.key,
    variants: ["default"],
    fields: [{ name: "id", type: "uuid", required: true }],
    localizedFields: props.key === "blog.widget" ? ["title"] : [],
    relationFields: [],
    operations: ["find", "count", "get-by-id", "create", "update", "delete"],
    insertSchema: z.object({}).passthrough(),
    selectSchema: z.object({ id: z.string() }).passthrough(),
    api: {
      find: props.find ?? jest.fn(async () => []),
      count: jest.fn(async () => 0),
      findById: props.findById ?? jest.fn(async () => undefined),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUrl: props.findByUrl,
    },
  };
}

function createCanonicalRegistry() {
  const page = {
    id: "page-1",
    url: "/about",
    title: "About",
  };
  const pageWidgets = [
    {
      id: "page-widget-1",
      pageId: "page-1",
      widgetId: "host-widget-1",
      orderIndex: 1,
    },
  ];
  const hostWidget = {
    id: "host-widget-1",
    adminTitle: "Articles host slot",
    title: { en: "Articles" },
    slug: "articles",
    variant: "default",
  };
  const externalRelations = [
    {
      id: "external-relation-1",
      widgetId: "host-widget-1",
      externalModule: "blog",
      externalWidgetId: "blog-widget-1",
      orderIndex: 1,
      variant: "default",
    },
  ];
  const blogWidget = {
    id: "blog-widget-1",
    adminTitle: "Articles",
    title: {
      en: "Articles",
      ru: "Статьи",
    },
    slug: "articles",
    variant: "list",
  };

  const pageDescriptor = createDescriptor({
    key: "host.page",
    find: jest.fn(async () => [page]),
    findByUrl: jest.fn(async () => page),
  });
  const pageWidgetsDescriptor = createDescriptor({
    key: "host.pages-to-widgets",
    kind: "relation",
    find: jest.fn(async () => pageWidgets),
  });
  const hostWidgetDescriptor = createDescriptor({
    key: "host.widget",
    findById: jest.fn(async () => hostWidget),
  });
  const externalRelationsDescriptor = createDescriptor({
    key: "host.widgets-to-external-widgets",
    kind: "relation",
    find: jest.fn(async () => externalRelations),
  });
  const blogWidgetDescriptor = createDescriptor({
    key: "blog.widget",
    findById: jest.fn(async () => blogWidget),
  });

  return {
    registry: [
      pageDescriptor,
      pageWidgetsDescriptor,
      hostWidgetDescriptor,
      externalRelationsDescriptor,
      blogWidgetDescriptor,
    ],
    pageWidgetsDescriptor,
    externalRelationsDescriptor,
  };
}

describe("MCP content-management host graph resolver", () => {
  beforeEach(() => {
    process.env.RBAC_SECRET_KEY = "test-secret";
  });

  afterEach(() => {
    process.env.RBAC_SECRET_KEY = originalRbacSecretKey;
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: URL traversal resolves blog widget candidate
   * Given /about has an ordered host widget linked to a blog widget
   * When Codex previews the host graph for Articles
   * Then the result includes a single blog.widget candidate and ordered relation queries
   */
  it("resolves a URL through host relations to a blog widget candidate", async () => {
    const { registry, pageWidgetsDescriptor, externalRelationsDescriptor } =
      createCanonicalRegistry();

    await expect(
      resolveHostGraph(
        {
          url: "about",
          language: "en",
          externalModule: "blog",
          targetText: "Articles",
        },
        { registry },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        url: "/about",
        language: "en",
        matchStatus: "single",
        candidates: [
          expect.objectContaining({
            id: "blog-widget-1",
            externalEntityKey: "blog.widget",
            summary: expect.objectContaining({
              externalWidgetId: "blog-widget-1",
              adminTitle: "Articles",
              title: "Articles",
              slug: "articles",
              variant: "list",
            }),
          }),
        ],
      }),
    );

    expect(pageWidgetsDescriptor.api.find).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          orderBy: {
            and: [{ column: "orderIndex", method: "asc" }],
          },
        }),
      }),
    );
    expect(externalRelationsDescriptor.api.find).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          orderBy: {
            and: [{ column: "orderIndex", method: "asc" }],
          },
        }),
      }),
    );
  });

  /**
   * BDD Scenario: Missing page returns no candidates
   * Given no host page matches the requested URL
   * When Codex previews the host graph
   * Then the resolver returns a none match status without relation traversal
   */
  it("returns none when the page URL cannot be resolved", async () => {
    const pageDescriptor = createDescriptor({
      key: "host.page",
      find: jest.fn(async () => []),
      findByUrl: jest.fn(async () => undefined),
    });
    const pageWidgetsDescriptor = createDescriptor({
      key: "host.pages-to-widgets",
      kind: "relation",
    });
    const registry = [
      pageDescriptor,
      pageWidgetsDescriptor,
      createDescriptor({ key: "host.widget" }),
      createDescriptor({
        key: "host.widgets-to-external-widgets",
        kind: "relation",
      }),
      createDescriptor({ key: "blog.widget" }),
    ];

    await expect(
      resolveHostGraph({ url: "/missing", language: "en" }, { registry }),
    ).resolves.toEqual({
      url: "/missing",
      language: "en",
      candidates: [],
      matchStatus: "none",
    });
    expect(pageWidgetsDescriptor.api.find).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: Ambiguous matches are preserved
   * Given more than one candidate matches the target text
   * When Codex filters host graph candidates
   * Then all matches are returned and single-candidate enforcement throws
   */
  it("returns multiple matches and refuses single-candidate enforcement", () => {
    const candidates = [
      {
        id: "blog-widget-1",
        page: {},
        pageWidget: {},
        summary: {
          externalWidgetId: "blog-widget-1",
          adminTitle: "Articles",
          title: "Articles",
        },
      },
      {
        id: "blog-widget-2",
        page: {},
        pageWidget: {},
        summary: {
          externalWidgetId: "blog-widget-2",
          adminTitle: "Articles",
          title: "Articles",
        },
      },
    ];

    const matches = filterHostGraphCandidates({
      candidates,
      targetText: "Articles",
    });

    expect(matches).toHaveLength(2);
    expect(() =>
      requireSingleHostGraphCandidate({
        result: {
          url: "/about",
          language: "en",
          candidates: matches,
          matchStatus: "multiple",
        },
        input: {},
      }),
    ).toThrow(
      "Validation error. Expected exactly one host graph candidate, found 2",
    );
  });
});
