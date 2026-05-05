import { z } from "zod";
import { McpAuthFieldsSchema } from "../auth";

export const ContentEntityKeySchema = z.enum([
  "host.page",
  "host.widget",
  "host.pages-to-widgets",
  "host.widgets-to-external-widgets",
  "blog.widget",
]);

export const ContentFilterMethodSchema = z.enum([
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "like",
  "ilike",
  "notLike",
  "notIlike",
  "inArray",
  "notInArray",
  "isNull",
  "isNotNull",
]);

const JsonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const ContentFilterSchema = z.object({
  column: z.string().min(1),
  method: ContentFilterMethodSchema,
  value: z
    .union([
      JsonPrimitiveSchema,
      z.array(JsonPrimitiveSchema),
      z.record(z.any()),
    ])
    .optional(),
});

export const ContentFiltersSchema = z.object({
  and: z.array(ContentFilterSchema).optional(),
});

export const ContentOrderBySchema = z.object({
  and: z
    .array(
      z.object({
        column: z.string().min(1),
        method: z.enum(["asc", "desc"]),
      }),
    )
    .optional(),
});

export const ContentEntitySelectorSchema = z.object({
  entity: ContentEntityKeySchema,
});

export const ContentEntityDescribeInputSchema = ContentEntitySelectorSchema;

export const ContentAuthInputSchema = z.object({
  auth: McpAuthFieldsSchema,
});

export const ContentFindInputSchema = ContentEntitySelectorSchema.extend({
  auth: ContentAuthInputSchema.shape.auth,
  filters: ContentFiltersSchema.optional(),
  orderBy: ContentOrderBySchema.optional(),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).optional(),
});

export const ContentCountInputSchema = ContentEntitySelectorSchema.extend({
  auth: ContentAuthInputSchema.shape.auth,
  filters: ContentFiltersSchema.optional(),
});

export const ContentGetByIdInputSchema = ContentEntitySelectorSchema.extend({
  auth: ContentAuthInputSchema.shape.auth,
  id: z.string().min(1),
});

export const ContentCreateInputSchema = ContentEntitySelectorSchema.extend({
  auth: ContentAuthInputSchema.shape.auth,
  data: z.record(z.any()),
  dryRun: z.boolean().default(false),
});

export const ContentUpdateInputSchema = ContentGetByIdInputSchema.extend({
  data: z.record(z.any()),
  dryRun: z.boolean().default(false),
});

export const ContentDeletePreviewInputSchema = ContentGetByIdInputSchema;

export const ContentDeleteApplyInputSchema = ContentGetByIdInputSchema.extend({
  confirm: z.literal(true),
  confirmationToken: z.string().min(1),
});

export const LocalizedFieldUpdateInputSchema = ContentGetByIdInputSchema.extend(
  {
    field: z.string().min(1),
    locale: z.string().min(2),
    value: z.string(),
    dryRun: z.boolean().default(true),
  },
);

export const HostGraphPreviewInputSchema = z.object({
  auth: ContentAuthInputSchema.shape.auth,
  url: z.string().min(1),
  language: z.string().min(2).default("en"),
  externalModule: z.string().optional(),
  targetText: z.string().optional(),
  widgetId: z.string().optional(),
});

export const HostGraphLocalizedFieldUpdateInputSchema =
  HostGraphPreviewInputSchema.extend({
    candidateId: z.string().optional(),
    field: z.string().min(1),
    locale: z.string().min(2),
    value: z.string(),
    dryRun: z.boolean().default(true),
  });

export type IContentEntityKey = z.infer<typeof ContentEntityKeySchema>;
export type IContentFindInput = z.infer<typeof ContentFindInputSchema>;
export type IContentCountInput = z.infer<typeof ContentCountInputSchema>;
export type IContentGetByIdInput = z.infer<typeof ContentGetByIdInputSchema>;
export type IContentCreateInput = z.infer<typeof ContentCreateInputSchema>;
export type IContentUpdateInput = z.infer<typeof ContentUpdateInputSchema>;
export type IContentDeleteApplyInput = z.infer<
  typeof ContentDeleteApplyInputSchema
>;
export type ILocalizedFieldUpdateInput = z.infer<
  typeof LocalizedFieldUpdateInputSchema
>;
export type IHostGraphPreviewInput = z.infer<
  typeof HostGraphPreviewInputSchema
>;
export type IHostGraphLocalizedFieldUpdateInput = z.infer<
  typeof HostGraphLocalizedFieldUpdateInputSchema
>;
