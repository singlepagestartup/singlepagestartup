import { api as blogWidgetApi } from "@sps/blog/models/widget/sdk/server";
import {
  insertSchema as blogWidgetInsertSchema,
  route as blogWidgetRoute,
  selectSchema as blogWidgetSelectSchema,
  variants as blogWidgetVariants,
} from "@sps/blog/models/widget/sdk/model";
import { api as hostPageApi } from "@sps/host/models/page/sdk/server";
import {
  insertSchema as hostPageInsertSchema,
  route as hostPageRoute,
  selectSchema as hostPageSelectSchema,
  variants as hostPageVariants,
} from "@sps/host/models/page/sdk/model";
import { api as hostWidgetApi } from "@sps/host/models/widget/sdk/server";
import {
  insertSchema as hostWidgetInsertSchema,
  route as hostWidgetRoute,
  selectSchema as hostWidgetSelectSchema,
  variants as hostWidgetVariants,
} from "@sps/host/models/widget/sdk/model";
import { api as hostPagesToWidgetsApi } from "@sps/host/relations/pages-to-widgets/sdk/server";
import {
  insertSchema as hostPagesToWidgetsInsertSchema,
  route as hostPagesToWidgetsRoute,
  selectSchema as hostPagesToWidgetsSelectSchema,
  variants as hostPagesToWidgetsVariants,
} from "@sps/host/relations/pages-to-widgets/sdk/model";
import { api as hostWidgetsToExternalWidgetsApi } from "@sps/host/relations/widgets-to-external-widgets/sdk/server";
import {
  externalModules as hostWidgetsToExternalWidgetsExternalModules,
  insertSchema as hostWidgetsToExternalWidgetsInsertSchema,
  route as hostWidgetsToExternalWidgetsRoute,
  selectSchema as hostWidgetsToExternalWidgetsSelectSchema,
  variants as hostWidgetsToExternalWidgetsVariants,
} from "@sps/host/relations/widgets-to-external-widgets/sdk/model";
import {
  IContentEntityDescriptor,
  IContentEntityKey,
  IContentEntitySummary,
} from "./types";

const defaultOperations = [
  "find",
  "count",
  "get-by-id",
  "create",
  "update",
  "delete",
] as const;

export const contentEntityRegistry: IContentEntityDescriptor[] = [
  {
    key: "host.page",
    kind: "model",
    module: "host",
    name: "page",
    route: hostPageRoute,
    title: "Host Page",
    description: "Routable host page resolved by URL.",
    variants: hostPageVariants,
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "title", type: "text", required: true },
      { name: "url", type: "text", required: true },
      { name: "description", type: "text" },
      { name: "language", type: "text", required: true },
      { name: "adminTitle", type: "text", required: true },
      { name: "variant", type: "text", required: true },
      { name: "className", type: "text" },
    ],
    localizedFields: [],
    relationFields: [],
    operations: defaultOperations,
    insertSchema: hostPageInsertSchema,
    selectSchema: hostPageSelectSchema,
    api: hostPageApi,
  },
  {
    key: "host.widget",
    kind: "model",
    module: "host",
    name: "widget",
    route: hostWidgetRoute,
    title: "Host Widget",
    description: "Host composition container connected to external content.",
    variants: hostWidgetVariants,
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "title", type: "json", localized: true },
      { name: "subtitle", type: "json", localized: true },
      { name: "description", type: "json", localized: true },
      { name: "adminTitle", type: "text", required: true },
      { name: "slug", type: "text", required: true },
      { name: "variant", type: "text", required: true },
      { name: "className", type: "text" },
    ],
    localizedFields: ["title", "subtitle", "description"],
    relationFields: [],
    operations: defaultOperations,
    insertSchema: hostWidgetInsertSchema,
    selectSchema: hostWidgetSelectSchema,
    api: hostWidgetApi,
  },
  {
    key: "host.pages-to-widgets",
    kind: "relation",
    module: "host",
    name: "pages-to-widgets",
    route: hostPagesToWidgetsRoute,
    title: "Host Pages To Widgets",
    description: "Orders host widgets on host pages.",
    variants: hostPagesToWidgetsVariants,
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "pageId", type: "uuid", required: true },
      { name: "widgetId", type: "uuid", required: true },
      { name: "orderIndex", type: "integer", required: true },
      { name: "variant", type: "text", required: true },
      { name: "className", type: "text" },
    ],
    localizedFields: [],
    relationFields: [
      {
        name: "pageId",
        type: "uuid",
        required: true,
        relation: { entity: "host.page", field: "id" },
      },
      {
        name: "widgetId",
        type: "uuid",
        required: true,
        relation: { entity: "host.widget", field: "id" },
      },
    ],
    operations: defaultOperations,
    insertSchema: hostPagesToWidgetsInsertSchema,
    selectSchema: hostPagesToWidgetsSelectSchema,
    api: hostPagesToWidgetsApi,
  },
  {
    key: "host.widgets-to-external-widgets",
    kind: "relation",
    module: "host",
    name: "widgets-to-external-widgets",
    route: hostWidgetsToExternalWidgetsRoute,
    title: "Host Widgets To External Widgets",
    description: "Connects host widgets to source module widgets.",
    variants: hostWidgetsToExternalWidgetsVariants,
    externalModules: hostWidgetsToExternalWidgetsExternalModules,
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "widgetId", type: "uuid", required: true },
      { name: "externalModule", type: "text", required: true },
      { name: "externalWidgetId", type: "text", required: true },
      { name: "orderIndex", type: "integer", required: true },
      { name: "variant", type: "text", required: true },
      { name: "className", type: "text" },
    ],
    localizedFields: [],
    relationFields: [
      {
        name: "widgetId",
        type: "uuid",
        required: true,
        relation: { entity: "host.widget", field: "id" },
      },
    ],
    operations: defaultOperations,
    insertSchema: hostWidgetsToExternalWidgetsInsertSchema,
    selectSchema: hostWidgetsToExternalWidgetsSelectSchema,
    api: hostWidgetsToExternalWidgetsApi,
  },
  {
    key: "blog.widget",
    kind: "model",
    module: "blog",
    name: "widget",
    route: blogWidgetRoute,
    title: "Blog Widget",
    description: "Blog content widget with localized presentation fields.",
    variants: blogWidgetVariants,
    fields: [
      { name: "id", type: "uuid", required: true },
      { name: "title", type: "json", localized: true },
      { name: "subtitle", type: "json", localized: true },
      { name: "description", type: "json", localized: true },
      { name: "adminTitle", type: "text", required: true },
      { name: "slug", type: "text", required: true },
      { name: "variant", type: "text", required: true },
      { name: "className", type: "text" },
    ],
    localizedFields: ["title", "subtitle", "description"],
    relationFields: [],
    operations: defaultOperations,
    insertSchema: blogWidgetInsertSchema,
    selectSchema: blogWidgetSelectSchema,
    api: blogWidgetApi,
  },
];

export function summarizeContentEntity(
  descriptor: IContentEntityDescriptor,
): IContentEntitySummary {
  return {
    key: descriptor.key,
    kind: descriptor.kind,
    module: descriptor.module,
    name: descriptor.name,
    route: descriptor.route,
    title: descriptor.title,
    description: descriptor.description,
    variants: descriptor.variants,
    fields: descriptor.fields,
    localizedFields: descriptor.localizedFields,
    relationFields: descriptor.relationFields,
    ...(descriptor.externalModules
      ? { externalModules: descriptor.externalModules }
      : {}),
    operations: descriptor.operations,
  };
}

export function listContentEntities() {
  return contentEntityRegistry.map((descriptor) =>
    summarizeContentEntity(descriptor),
  );
}

export function getContentEntityDescriptor(
  key: IContentEntityKey,
  registry = contentEntityRegistry,
) {
  return registry.find((descriptor) => descriptor.key === key);
}

export function requireContentEntityDescriptor(
  key: IContentEntityKey,
  registry = contentEntityRegistry,
) {
  const descriptor = getContentEntityDescriptor(key, registry);

  if (!descriptor) {
    throw new Error(`Not Found error. Content entity '${key}' not found`);
  }

  return descriptor;
}
