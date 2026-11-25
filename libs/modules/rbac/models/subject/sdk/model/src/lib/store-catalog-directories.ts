import { z } from "zod";
import { storeProductLocaleSchema } from "./store-product-relations";

export const storeCatalogDirectoryKindSchema = z.enum([
  "categories",
  "attribute-keys",
  "attributes",
]);
export type TStoreCatalogDirectoryKind = z.infer<
  typeof storeCatalogDirectoryKindSchema
>;

export const reservedCatalogKeySlugs = [
  "stock_quantity",
  "price_formula",
  "formula_version",
  "price",
  "interval",
  "topup",
];
export const sensitiveCatalogKeySlugPattern =
  /(^|[-_])(password|secret|token|credential|api[-_]key)([-_]|$)/i;

const slug = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/);
const title = z.string().trim().min(1).max(180);
const keyFields = z
  .object({
    title,
    field: z.enum(["string", "number"]),
    slug: slug
      .refine(
        (value) =>
          !reservedCatalogKeySlugs.includes(value) &&
          !sensitiveCatalogKeySlugPattern.test(value),
      )
      .optional(),
  })
  .strict();

export const storeCatalogDirectoryCreateSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("categories"),
      language: storeProductLocaleSchema,
      title,
      slug: slug.optional(),
    })
    .strict(),
  keyFields.extend({
    kind: z.literal("attribute-keys"),
    language: storeProductLocaleSchema,
  }),
  z
    .object({
      kind: z.literal("attributes"),
      language: storeProductLocaleSchema,
      keyId: z.uuid().optional(),
      newKey: keyFields.optional(),
      value: z.string().trim().min(1).max(10000),
    })
    .strict()
    .refine(({ keyId, newKey }) => Boolean(keyId) !== Boolean(newKey)),
]);

export type IStoreCatalogDirectoryCreate = z.input<
  typeof storeCatalogDirectoryCreateSchema
>;

export interface IStoreCatalogDirectoryItem {
  id: string;
  slug: string;
  adminTitle: string;
  title?: Record<string, string | undefined> | null;
  field?: string;
  keyId?: string;
  keyTitle?: string;
  keyTranslations?: Record<string, string | undefined> | null;
  value?: string | Record<string, string | undefined> | null;
}

export interface IStoreCatalogDirectoryPage {
  items: IStoreCatalogDirectoryItem[];
  total: number;
  nextOffset?: number;
  canCreate: boolean;
}

export interface IStoreCatalogDirectoryDetail extends IStoreCatalogDirectoryItem {
  updatedAt: string;
  canEdit: boolean;
  canChangeField: boolean;
}

const updateFields = {
  language: storeProductLocaleSchema,
  expectedUpdatedAt: z.iso.datetime(),
};
export const storeCatalogDirectoryUpdateSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...updateFields,
      kind: z.literal("categories"),
      title,
      slug: slug.optional(),
    })
    .strict(),
  z
    .object({
      ...updateFields,
      slug: keyFields.shape.slug,
      kind: z.literal("attribute-keys"),
      title,
      field: z.enum(["number", "string"]),
    })
    .strict(),
  z
    .object({
      ...updateFields,
      kind: z.literal("attributes"),
      value: z.string().trim().min(1).max(10000),
    })
    .strict(),
]);
export type IStoreCatalogDirectoryUpdate = z.input<
  typeof storeCatalogDirectoryUpdateSchema
>;
