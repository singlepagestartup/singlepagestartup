import type { IModel as IPage } from "../../../modules/host/page/interface";
import type { IModel as ILayout } from "../../../modules/host/layout/interface";
import type { IModel as IWidget } from "../../../modules/host/widget/interface";
import type { IModel as IMetadata } from "../../../modules/host/metadata/interface";
import { HOST_STUDIO_SAMPLE_IDS } from "./constants";

export interface IHostModelMap {
  page: IPage;
  layout: ILayout;
  widget: IWidget;
  metadata: IMetadata;
}
export type HostModel = keyof IHostModelMap;
export type HostRecord = IHostModelMap[HostModel];
export interface IHostStudioState {
  models: { [K in HostModel]: IHostModelMap[K][] };
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
export function hostRecordLabel(record: HostRecord, language = "en"): string {
  if ("adminTitle" in record) return record.adminTitle;
  return typeof record.title === "string"
    ? record.title
    : (record.title?.[language] ?? record.id);
}
export function hostFieldValue(record: HostRecord, key: string): string {
  const value = (record as unknown as Record<string, unknown>)[key];
  if (value == null) return "";
  if (typeof value === "object")
    return Object.values(value).filter(Boolean).join(" ");
  return String(value);
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
export function removeHostModels(
  state: IHostStudioState,
  kind: HostModel,
  ids: string[],
): IHostStudioState {
  return {
    ...state,
    models: {
      ...state.models,
      [kind]: state.models[kind].filter((record) => !ids.includes(record.id)),
    },
  };
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
  };
  return state;
}
