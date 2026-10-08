import type { IModel as IPage } from "../../../modules/host/models/page/interface";
import type { IModel as ILayout } from "../../../modules/host/models/layout/interface";
import type { IModel as IWidget } from "../../../modules/host/models/widget/interface";
import type { IModel as IMetadata } from "../../../modules/host/models/metadata/interface";
import type { IModel as IPagesToLayouts } from "../../../modules/host/relations/pages-to-layouts/interface";
import type { IModel as IPagesToWidgets } from "../../../modules/host/relations/pages-to-widgets/interface";
import type { IModel as IPagesToMetadata } from "../../../modules/host/relations/pages-to-metadata/interface";
import type { IModel as ILayoutsToWidgets } from "../../../modules/host/relations/layouts-to-widgets/interface";
import type { IModel as IWidgetsToExternalWidgets } from "../../../modules/host/relations/widgets-to-external-widgets/interface";
import { HOST_STUDIO_RELATIONS, HOST_STUDIO_SAMPLE_IDS } from "./constants";

export interface IHostModelMap {
  page: IPage;
  layout: ILayout;
  widget: IWidget;
  metadata: IMetadata;
}
export interface IHostRelationMap {
  "pages-to-layouts": IPagesToLayouts;
  "pages-to-widgets": IPagesToWidgets;
  "pages-to-metadata": IPagesToMetadata;
  "layouts-to-widgets": ILayoutsToWidgets;
  "widgets-to-external-widgets": IWidgetsToExternalWidgets;
}
export type HostModel = keyof IHostModelMap;
export type HostRelation = keyof IHostRelationMap;
export type HostRecord = IHostModelMap[HostModel];
export type HostLink = IHostRelationMap[HostRelation];
export interface IHostStudioState {
  models: { [K in HostModel]: IHostModelMap[K][] };
  relations: { [K in HostRelation]: IHostRelationMap[K][] };
}
export interface IHostPageComposition {
  page: IPage;
  layouts: {
    link: IPagesToLayouts;
    layout: ILayout;
    before: ILayoutsToWidgets[];
    after: ILayoutsToWidgets[];
  }[];
  widgets: IPagesToWidgets[];
  metadata: { link: IPagesToMetadata; metadata: IMetadata }[];
}
export function createHostModel<K extends HostModel>(
  kind: K,
  id: string,
  now = new Date(),
): IHostModelMap[K] {
  const common = { id, createdAt: now, updatedAt: now, variant: "default" };
  const models: IHostModelMap = {
    page: {
      ...common,
      adminTitle: "New page",
      title: "New page",
      url: "/new-page",
      description: null,
      language: "en",
      className: null,
    },
    layout: {
      ...common,
      adminTitle: "New layout",
      title: null,
      slug: "new-layout",
      className: null,
    },
    widget: {
      ...common,
      adminTitle: "New widget",
      title: {},
      subtitle: {},
      description: {},
      slug: "new-widget",
      className: null,
    },
    metadata: {
      ...common,
      title: "New metadata",
      description: null,
      keywords: null,
      author: null,
      viewport: null,
      opengraphTitle: null,
      opengraphDescription: null,
      opengraphUrl: null,
      opengraphType: null,
      opengraphSiteName: null,
      opengraphLocale: null,
      twitterCard: null,
      twitterSite: null,
      twitterCreator: null,
      twitterTitle: null,
      twitterDescription: null,
      twitterUrl: null,
      twitterDomain: null,
      twitterAppCountry: null,
    },
  };
  return models[kind];
}
export function createHostLink<K extends HostRelation>(
  kind: K,
  ownerId: string,
  targetId: string,
  id: string,
  now = new Date(),
): IHostRelationMap[K] {
  const common = {
    id,
    createdAt: now,
    updatedAt: now,
    variant: "default",
    orderIndex: 0,
    className: null,
  };
  const links: IHostRelationMap = {
    "pages-to-layouts": { ...common, pageId: ownerId, layoutId: targetId },
    "pages-to-widgets": { ...common, pageId: ownerId, widgetId: targetId },
    "pages-to-metadata": { ...common, pageId: ownerId, metadataId: targetId },
    "layouts-to-widgets": { ...common, layoutId: ownerId, widgetId: targetId },
    "widgets-to-external-widgets": {
      ...common,
      widgetId: ownerId,
      externalWidgetId: targetId,
      externalModule: "website-builder",
    },
  };
  return links[kind];
}
export function hostRecordLabel(record: HostRecord, language = "en"): string {
  if ("adminTitle" in record) return record.adminTitle;
  return typeof record.title === "string"
    ? record.title
    : (record.title?.[language] ?? record.id);
}
export function hostFieldValue(
  record: HostRecord | HostLink,
  key: string,
): string {
  const value = (record as unknown as Record<string, unknown>)[key];
  if (value == null) return "";
  if (typeof value === "object")
    return Object.values(value).filter(Boolean).join(" ");
  return String(value);
}
export function sortHostLinks<T extends HostLink>(links: T[]): T[] {
  return [...links].sort(
    (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id),
  );
}
export function hostOwnerId(kind: HostRelation, link: HostLink): string {
  return hostFieldValue(link, HOST_STUDIO_RELATIONS[kind].ownerKey);
}
export function hostTargetId(kind: HostRelation, link: HostLink): string {
  return hostFieldValue(link, HOST_STUDIO_RELATIONS[kind].targetKey);
}
export function saveHostModel<K extends HostModel>(
  state: IHostStudioState,
  kind: K,
  record: IHostModelMap[K],
): IHostStudioState {
  const collection = state.models[kind] as IHostModelMap[K][];
  return {
    ...state,
    models: {
      ...state.models,
      [kind]: collection.some((item) => item.id === record.id)
        ? collection.map((item) => (item.id === record.id ? record : item))
        : [...collection, record],
    },
  };
}
export function saveHostLink<K extends HostRelation>(
  state: IHostStudioState,
  kind: K,
  link: IHostRelationMap[K],
): IHostStudioState {
  const collection = state.relations[kind] as IHostRelationMap[K][];
  return {
    ...state,
    relations: {
      ...state.relations,
      [kind]: collection.some((item) => item.id === link.id)
        ? collection.map((item) => (item.id === link.id ? link : item))
        : [...collection, link],
    },
  };
}
export function unlinkHostRecords(
  state: IHostStudioState,
  kind: HostRelation,
  ids: string[],
): IHostStudioState {
  return {
    ...state,
    relations: {
      ...state.relations,
      [kind]: state.relations[kind].filter((link) => !ids.includes(link.id)),
    },
  };
}
export function removeHostModels(
  state: IHostStudioState,
  kind: HostModel,
  ids: string[],
): IHostStudioState {
  let next = {
    ...state,
    models: {
      ...state.models,
      [kind]: state.models[kind].filter((record) => !ids.includes(record.id)),
    },
  };
  for (const key of Object.keys(HOST_STUDIO_RELATIONS) as HostRelation[]) {
    const config = HOST_STUDIO_RELATIONS[key];
    next = unlinkHostRecords(
      next,
      key,
      state.relations[key]
        .filter(
          (link) =>
            (config.owner === kind && ids.includes(hostOwnerId(key, link))) ||
            (config.target === kind && ids.includes(hostTargetId(key, link))),
        )
        .map((link) => link.id),
    );
  }
  return next;
}
export function validateHostModel(
  state: IHostStudioState,
  kind: HostModel,
  record: HostRecord,
): string | null {
  const required =
    kind === "page"
      ? ["adminTitle", "title", "url", "language", "variant"]
      : kind === "metadata"
        ? ["title", "variant"]
        : ["adminTitle", "slug", "variant"];
  for (const field of required)
    if (!hostFieldValue(record, field).trim()) return `${field} is required.`;
  const unique =
    kind === "page"
      ? "url"
      : kind === "layout" || kind === "widget"
        ? "slug"
        : null;
  if (
    unique &&
    state.models[kind].some(
      (item) =>
        item.id !== record.id &&
        hostFieldValue(item, unique) === hostFieldValue(record, unique),
    )
  )
    return `${unique} already exists.`;
  return null;
}
export function validateHostLink(
  state: IHostStudioState,
  kind: HostRelation,
  link: HostLink,
): string | null {
  const config = HOST_STUDIO_RELATIONS[kind];
  if (
    !state.models[config.owner].some(
      (item) => item.id === hostOwnerId(kind, link),
    )
  )
    return "Select an existing owner.";
  if (
    config.target &&
    !state.models[config.target].some(
      (item) => item.id === hostTargetId(kind, link),
    )
  )
    return "Select an existing target.";
  if (!hostTargetId(kind, link).trim()) return "Select a target.";
  if ("externalModule" in link && !link.externalModule.trim())
    return "External module is required.";
  if (!link.variant.trim()) return "Variant is required.";
  if (
    !Number.isInteger(link.orderIndex) ||
    link.orderIndex < -2147483648 ||
    link.orderIndex > 2147483647
  )
    return "Order must be a 32-bit integer.";
  return null;
}
export function composeHostPage(
  state: IHostStudioState,
  pageId: string,
): IHostPageComposition | null {
  const page = state.models.page.find((record) => record.id === pageId);
  if (!page) return null;
  const widgets = sortHostLinks(
    state.relations["pages-to-widgets"].filter(
      (link) => link.pageId === pageId && link.variant === "default",
    ),
  );
  const layouts = sortHostLinks(
    state.relations["pages-to-layouts"].filter(
      (link) => link.pageId === pageId && link.variant === "default",
    ),
  ).flatMap((link) => {
    const layout = state.models.layout.find(
      (record) => record.id === link.layoutId,
    );
    if (!layout) return [];
    const scoped = state.relations["layouts-to-widgets"].filter(
      (item) => item.layoutId === layout.id,
    );
    return [
      {
        link,
        layout,
        before: sortHostLinks(
          scoped.filter((item) => item.variant === "default"),
        ),
        after: sortHostLinks(
          scoped.filter((item) => item.variant === "additional"),
        ),
      },
    ];
  });
  const metadata = sortHostLinks(
    state.relations["pages-to-metadata"].filter(
      (link) => link.pageId === pageId && link.variant === "default",
    ),
  ).flatMap((link) => {
    const record = state.models.metadata.find(
      (item) => item.id === link.metadataId,
    );
    return record ? [{ link, metadata: record }] : [];
  });
  return { page, widgets, layouts, metadata };
}
export function createHostStudioState(): IHostStudioState {
  const ids = HOST_STUDIO_SAMPLE_IDS;
  const state: IHostStudioState = {
    models: {
      page: [
        {
          ...createHostModel("page", ids.page),
          title: "Studio journal",
          adminTitle: "Studio journal",
          url: "/journal",
          description: "Updates and products from the studio.",
        },
      ],
      layout: [
        {
          ...createHostModel("layout", ids.layout),
          title: "Journal layout",
          adminTitle: "Journal layout",
          slug: "journal-layout",
        },
      ],
      widget: [
        {
          ...createHostModel("widget", ids.header),
          adminTitle: "Journal header",
          slug: "journal-header",
          title: { en: "Studio journal", ru: "Журнал студии" },
          description: { en: "Articles and products" },
        },
        {
          ...createHostModel("widget", ids.content),
          adminTitle: "Articles",
          slug: "articles",
          title: { en: "Latest articles" },
        },
        {
          ...createHostModel("widget", ids.footer),
          adminTitle: "Journal footer",
          slug: "journal-footer",
          title: { en: "Keep in touch" },
        },
      ],
      metadata: [
        {
          ...createHostModel("metadata", ids.metadata),
          title: "Studio journal",
          description: "Updates and products from the studio.",
          opengraphTitle: "Studio journal",
          twitterCard: "summary",
        },
      ],
    },
    relations: {
      "pages-to-layouts": [
        createHostLink(
          "pages-to-layouts",
          ids.page,
          ids.layout,
          "00000000-0000-4000-8000-000000000011",
        ),
      ],
      "pages-to-widgets": [
        createHostLink(
          "pages-to-widgets",
          ids.page,
          ids.content,
          "00000000-0000-4000-8000-000000000012",
        ),
      ],
      "pages-to-metadata": [
        createHostLink(
          "pages-to-metadata",
          ids.page,
          ids.metadata,
          "00000000-0000-4000-8000-000000000013",
        ),
      ],
      "layouts-to-widgets": [
        createHostLink(
          "layouts-to-widgets",
          ids.layout,
          ids.header,
          "00000000-0000-4000-8000-000000000014",
        ),
        {
          ...createHostLink(
            "layouts-to-widgets",
            ids.layout,
            ids.footer,
            "00000000-0000-4000-8000-000000000015",
          ),
          variant: "additional",
        },
      ],
      "widgets-to-external-widgets": [
        {
          ...createHostLink(
            "widgets-to-external-widgets",
            ids.content,
            "preview-blog-overview-widget",
            "00000000-0000-4000-8000-000000000016",
          ),
          externalModule: "blog",
        },
      ],
    },
  };
  return state;
}
