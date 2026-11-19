import { z } from "zod";

export const funnelKindSchema = z.enum([
  "consultation",
  "individual-service",
  "physical-order",
]);

export const evidenceKindSchema = z.enum([
  "manual",
  "message",
  "model-result",
  "result-accepted",
  "payment",
  "delivery",
  "file-access",
]);

export const actorKindSchema = z.enum(["manager", "human", "ai", "system"]);
export const outcomeSchema = z.enum(["completed", "closed-without-result"]);
export const stageIdSchema = z.string().trim().min(1).max(80);

const actionSchema = z.object({
  id: stageIdSchema,
  name: z.string().trim().min(1).max(150),
  instruction: z.string().trim().max(4000).optional(),
  actors: z.array(actorKindSchema).min(1),
  evidence: z.array(evidenceKindSchema).min(1),
  deliveryStage: z.enum(["preparing", "in-transit", "delivered"]).optional(),
  nextStageId: stageIdSchema.optional(),
  outcome: outcomeSchema.optional(),
});

const waitingSchema = z.object({
  expectedEvent: evidenceKindSchema.exclude(["manual", "model-result"]),
  deadlineSeconds: z.number().int().positive().max(31_536_000),
  reminderSeconds: z.array(z.number().int().positive()).max(20).default([]),
  completionEvidence: z.array(evidenceKindSchema).max(7).default([]),
  silenceOutcome: outcomeSchema.optional(),
});

export const workOperationSchema = z.enum([
  "request-routing",
  "tool-selection",
  "compression",
  "knowledge-search",
  "vision",
  "transcription",
]);

export type TWorkOperation = z.infer<typeof workOperationSchema>;

const positiveAmount = z
  .string()
  .regex(/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,12})?$/)
  .refine((amount) => /[1-9]/.test(amount));

const resultConversionSchema = z
  .object({
    id: z.uuid().optional(),
    fromCurrencyId: z.uuid(),
    toCurrencyId: z.uuid(),
    rate: positiveAmount,
    source: z.string().trim().min(1).max(300),
    observedAt: z.iso.datetime({ offset: true }),
  })
  .refine((value) => value.fromCurrencyId !== value.toCurrencyId);

const resultPricingSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("offer") }),
  z.object({
    kind: z.literal("confirmed-cost"),
    multiplier: positiveAmount,
    conversions: z
      .array(resultConversionSchema)
      .max(20)
      .refine(
        (rates) =>
          new Set(
            rates.map(
              ({ fromCurrencyId, toCurrencyId }) =>
                `${fromCurrencyId}:${toCurrencyId}`,
            ),
          ).size === rates.length,
      ),
  }),
]);

const stageSchema = z
  .object({
    id: stageIdSchema,
    name: z.string().trim().min(1).max(150),
    instruction: z.string().trim().max(4000).default(""),
    output: z.enum(["chat", "pdf", "image"]).optional(),
    imageBrief: z.literal("marketplace-cover").optional(),
    operations: z
      .array(workOperationSchema)
      .max(6)
      .refine((values) => new Set(values).size === values.length)
      .optional(),
    cartOfferIds: z
      .array(z.uuid())
      .max(12)
      .refine((ids) => new Set(ids).size === ids.length)
      .optional(),
    archived: z.boolean().optional(),
    evidenceInstruction: z.string().trim().max(4000).optional(),
    missingDataInstruction: z.string().trim().max(4000).optional(),
    payerSubjectId: z.uuid().optional(),
    defaultAssigneeSubjectId: z.uuid().optional(),
    settlementEvent: z.string().trim().max(150).optional(),
    settlementInstruction: z.string().trim().max(4000).optional(),
    resultPricing: resultPricingSchema.optional(),
    actions: z.array(actionSchema).max(100),
    waiting: waitingSchema.optional(),
  })
  .refine((stage) => !stage.imageBrief || stage.output === "image", {
    path: ["imageBrief"],
    message: "Marketplace cover brief requires image output",
  });

const workFundingSchema = z.object({
  payer: z.enum(["store-owner", "customer"]),
  currencyId: z.uuid(),
  maxTaskAmount: positiveAmount,
  maxRunAmount: positiveAmount,
});

export const funnelDefinitionSchema = z.object({
  initialStageId: stageIdSchema,
  applicability: z.string().trim().max(4000).optional(),
  goal: z.string().trim().max(4000).optional(),
  workFunding: workFundingSchema.optional(),
  maintenanceSourceId: z.uuid().optional(),
  stages: z.array(stageSchema).min(1).max(100),
});

export const funnelBindingsSchema = z.object({
  productIds: z.array(z.uuid()).max(100).default([]),
  offerIds: z.array(z.uuid()).max(100).default([]),
  formIds: z.array(z.uuid()).max(100).default([]),
});

export interface IFunnelAction extends z.infer<typeof actionSchema> {}
export interface IFunnelStage extends z.infer<typeof stageSchema> {}

const paidOperationCapabilities = {
  "request-routing": "decision",
  "tool-selection": "decision",
  "knowledge-search": "embedding",
  compression: "compression",
  vision: "vision",
  transcription: "transcription",
} as const satisfies Record<TWorkOperation, string>;

export type TStageWorkCapability =
  "text" | "image" | (typeof paidOperationCapabilities)[TWorkOperation];

export function stageWorkCapabilities(
  stage: Pick<IFunnelStage, "output" | "imageBrief" | "operations">,
): TStageWorkCapability[] {
  if (stage.imageBrief === "marketplace-cover") return ["image"];
  const main = stage.output === "image" ? "image" : "text";
  return [
    ...new Set<TStageWorkCapability>([
      main,
      ...(stage.operations ?? []).map(
        (operation) => paidOperationCapabilities[operation],
      ),
    ]),
  ];
}

export interface IResultConversion extends z.infer<
  typeof resultConversionSchema
> {}
export interface IFunnelDefinition extends z.infer<
  typeof funnelDefinitionSchema
> {}
export interface IWorkFunding extends z.infer<typeof workFundingSchema> {}
export interface IFunnelBindings extends z.infer<typeof funnelBindingsSchema> {}
export type TFunnelKind = z.infer<typeof funnelKindSchema>;
export type TActorKind = z.infer<typeof actorKindSchema>;
export type TEvidenceKind = z.infer<typeof evidenceKindSchema>;
export type TTaskOutcome = z.infer<typeof outcomeSchema>;

export const pageInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().trim().min(1).max(256).optional(),
});

export interface IPageInput extends z.infer<typeof pageInputSchema> {}
export interface IPage<T> {
  items: T[];
  nextCursor: string | null;
}

const scopedSchema = z.object({ storeId: z.uuid() });
const auditSchema = z.object({
  actorId: z.uuid(),
  operationKey: z.string().trim().min(1).max(180),
});

export const saveDraftSchema = scopedSchema.extend({
  funnelId: z.uuid().optional(),
  expectedRevision: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(150),
  kind: funnelKindSchema,
  definition: funnelDefinitionSchema,
  bindings: funnelBindingsSchema.default({
    productIds: [],
    offerIds: [],
    formIds: [],
  }),
});
export const publishFunnelSchema = scopedSchema.extend({
  ...auditSchema.shape,
  funnelId: z.uuid(),
  expectedRevision: z.number().int().positive(),
});
export const listFunnelsSchema = scopedSchema.extend({
  ...pageInputSchema.shape,
  kind: funnelKindSchema.optional(),
});
export const listPublicationsSchema = scopedSchema.extend({
  ...pageInputSchema.shape,
  funnelId: z.uuid(),
});
export const resolveFunnelSchema = scopedSchema.extend({
  kind: funnelKindSchema,
  formId: z.uuid().optional(),
  productId: z.uuid().optional(),
  offerId: z.uuid().optional(),
});

export interface ISaveFunnelDraft extends z.input<typeof saveDraftSchema> {}
export interface IPublishFunnel extends z.infer<typeof publishFunnelSchema> {}
export interface IListFunnels extends z.infer<typeof listFunnelsSchema> {}
export interface IListPublications extends z.infer<
  typeof listPublicationsSchema
> {}
export interface IResolveFunnel extends z.infer<typeof resolveFunnelSchema> {}

const pagePositionSchema = z.tuple([z.iso.datetime(), z.uuid()]);

export function readPageCursor(cursor: string) {
  const position = pagePositionSchema.safeParse(cursor.split("_"));
  if (!position.success) {
    throw new Error("Validation error. Invalid page cursor");
  }

  const [timestamp, id] = position.data;
  return { updatedAt: new Date(timestamp), id };
}

export function updatedPage<T extends { updatedAt: Date; id: string }>(
  rows: T[],
  limit: number,
): IPage<T> {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  let nextCursor: string | null = null;
  if (last && rows.length > limit) {
    nextCursor = `${last.updatedAt.toISOString()}_${last.id}`;
  }

  return { items, nextCursor };
}
