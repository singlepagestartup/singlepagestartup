import { z } from "zod";

export const ContentEntityKeySchema = z.string().min(1);

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

export const ContentModelSelectorSchema = z.object({
  module: z.string().min(1),
  model: z.string().min(1),
});

export const ContentRelationSelectorSchema = z.object({
  module: z.string().min(1),
  relation: z.string().min(1),
});

const ContentQueryInputShape = {
  filters: ContentFiltersSchema.optional(),
  orderBy: ContentOrderBySchema.optional(),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).optional(),
};

export const ContentFindInputSchema = ContentEntitySelectorSchema.extend(
  ContentQueryInputShape,
);

export const ContentModelFindInputSchema = ContentModelSelectorSchema.extend(
  ContentQueryInputShape,
);

export const ContentRelationFindInputSchema =
  ContentRelationSelectorSchema.extend(ContentQueryInputShape);

export const ContentCountInputSchema = ContentEntitySelectorSchema.extend({
  filters: ContentFiltersSchema.optional(),
});

export const ContentModelCountInputSchema = ContentModelSelectorSchema.extend({
  filters: ContentFiltersSchema.optional(),
});

export const ContentRelationCountInputSchema =
  ContentRelationSelectorSchema.extend({
    filters: ContentFiltersSchema.optional(),
  });

export const ContentGetByIdInputSchema = ContentEntitySelectorSchema.extend({
  id: z.string().min(1),
});

export const ContentModelGetByIdInputSchema = ContentModelSelectorSchema.extend(
  {
    id: z.string().min(1),
  },
);

export const ContentRelationGetByIdInputSchema =
  ContentRelationSelectorSchema.extend({
    id: z.string().min(1),
  });

export const ContentCreateInputSchema = ContentEntitySelectorSchema.extend({
  data: z.record(z.any()),
  dryRun: z.boolean().default(true),
});

export const ContentModelCreateInputSchema = ContentModelSelectorSchema.extend({
  data: z.record(z.any()),
  dryRun: z.boolean().default(true),
});

export const ContentRelationCreateInputSchema =
  ContentRelationSelectorSchema.extend({
    data: z.record(z.any()),
    dryRun: z.boolean().default(true),
  });

export const ContentUpdateInputSchema = ContentGetByIdInputSchema.extend({
  data: z.record(z.any()),
  dryRun: z.boolean().default(true),
});

export const ContentModelUpdateInputSchema =
  ContentModelGetByIdInputSchema.extend({
    data: z.record(z.any()),
    dryRun: z.boolean().default(true),
  });

export const ContentRelationUpdateInputSchema =
  ContentRelationGetByIdInputSchema.extend({
    data: z.record(z.any()),
    dryRun: z.boolean().default(true),
  });

export const ContentDeletePreviewInputSchema = ContentGetByIdInputSchema;

export const ContentModelDeletePreviewInputSchema =
  ContentModelGetByIdInputSchema;

export const ContentRelationDeletePreviewInputSchema =
  ContentRelationGetByIdInputSchema;

export const ContentDeleteApplyInputSchema = ContentGetByIdInputSchema.extend({
  confirm: z.literal(true),
  confirmationToken: z.string().min(1),
});

export const ContentModelDeleteApplyInputSchema =
  ContentModelGetByIdInputSchema.extend({
    confirm: z.literal(true),
    confirmationToken: z.string().min(1),
  });

export const ContentRelationDeleteApplyInputSchema =
  ContentRelationGetByIdInputSchema.extend({
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
export type IContentModelFindInput = z.infer<
  typeof ContentModelFindInputSchema
>;
export type IContentModelCountInput = z.infer<
  typeof ContentModelCountInputSchema
>;
export type IContentModelGetByIdInput = z.infer<
  typeof ContentModelGetByIdInputSchema
>;
export type IContentModelCreateInput = z.infer<
  typeof ContentModelCreateInputSchema
>;
export type IContentModelUpdateInput = z.infer<
  typeof ContentModelUpdateInputSchema
>;
export type IContentRelationFindInput = z.infer<
  typeof ContentRelationFindInputSchema
>;
export type IContentRelationCountInput = z.infer<
  typeof ContentRelationCountInputSchema
>;
export type IContentRelationGetByIdInput = z.infer<
  typeof ContentRelationGetByIdInputSchema
>;
export type IContentRelationCreateInput = z.infer<
  typeof ContentRelationCreateInputSchema
>;
export type IContentRelationUpdateInput = z.infer<
  typeof ContentRelationUpdateInputSchema
>;
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
