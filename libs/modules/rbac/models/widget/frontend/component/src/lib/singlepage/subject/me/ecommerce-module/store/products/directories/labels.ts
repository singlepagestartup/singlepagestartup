import type {
  IStoreCatalogDirectoryItem,
  TStoreCatalogDirectoryKind,
} from "@sps/rbac/models/subject/sdk/model";
import { localizedText } from "../view-model";

export const directoryTitles = {
  categories: { ru: "Категории", en: "Categories" },
  "attribute-keys": { ru: "Ключи атрибутов", en: "Attribute keys" },
  attributes: { ru: "Атрибуты", en: "Attributes" },
} satisfies Record<TStoreCatalogDirectoryKind, { ru: string; en: string }>;

export function directoryValue(
  item: IStoreCatalogDirectoryItem,
  language: string,
) {
  return typeof item.value === "string"
    ? item.value
    : localizedText(item.value ?? null, language) || "";
}

export function directoryItemLabel(
  item: IStoreCatalogDirectoryItem,
  language: string,
) {
  const value = directoryValue(item, language);
  const keyTitle = directoryKeyTitle(item, language);
  if (value && keyTitle) return `${keyTitle} · ${value}`;
  return (
    value ||
    localizedText(item.title ?? null, language) ||
    item.adminTitle ||
    item.slug
  );
}

export function directoryKeyTitle(
  item: IStoreCatalogDirectoryItem,
  language: string,
) {
  return localizedText(item.keyTranslations ?? null, language) || item.keyTitle;
}
