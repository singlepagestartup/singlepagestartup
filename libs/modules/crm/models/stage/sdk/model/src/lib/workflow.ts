import Decimal from "decimal.js";
import { z } from "zod";
import {
  OPEN_AI_STAGE_TEXT_DEFAULT,
  OPEN_AI_STAGE_TEXT_REASONING,
  OPEN_AI_WORK_MODELS,
  openAIChatReasoning,
  providerReasoningEffortValues,
  type IOpenAIWorkModelSelection,
} from "@sps/shared-utils";

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
  silenceOutcome: outcomeSchema
    .optional()
    .transform((value) =>
      value === undefined ? undefined : ("closed-without-result" as const),
    ),
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

export const coverAttachmentRoleSchema = z.enum([
  "product-photo",
  "style-reference",
]);
export type TCoverAttachmentRole = z.infer<typeof coverAttachmentRoleSchema>;

const nonnegativeAmount = z
  .string()
  .regex(/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,12})?$/);
const positiveAmount = nonnegativeAmount.refine((amount) =>
  /[1-9]/.test(amount),
);

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
  z.object({ kind: z.literal("work-tokens") }),
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

export const FUNNEL_STAGE_SKILL_LIMIT = 6;

export const stageWorkFundingSchema = z
  .object({
    payer: z.literal("customer").optional(),
    multiplier: nonnegativeAmount.optional(),
    orderFormula: z.literal(true).optional(),
    payerSubjectId: z.uuid().optional(),
    currencyId: z.uuid(),
    maxStageAmount: nonnegativeAmount.optional(),
    maxRunAmount: nonnegativeAmount.optional(),
  })
  .refine((value) =>
    value.payer === "customer"
      ? (value.multiplier !== undefined) !== Boolean(value.orderFormula) &&
        !value.payerSubjectId
      : Boolean(value.payerSubjectId) &&
        value.multiplier === undefined &&
        !value.orderFormula,
  )
  .refine(
    ({ payer, maxStageAmount, maxRunAmount }) =>
      payer === "customer" ||
      (maxStageAmount !== undefined &&
        maxRunAmount !== undefined &&
        positiveAmount.safeParse(maxRunAmount).success &&
        nonnegativeAmount.safeParse(maxStageAmount).success &&
        new Decimal(maxRunAmount).lte(maxStageAmount)),
    { path: ["maxRunAmount"] },
  );

const storedStageBehavior = z.enum([
  "ecommerce-module-order-payment",
  "order-file-delivery",
  "order-payment",
]);

export function normalizeStageBehavior(
  behavior: z.infer<typeof storedStageBehavior>,
) {
  return behavior === "order-payment"
    ? "ecommerce-module-order-payment"
    : behavior;
}

export const stageSchema = z
  .object({
    id: stageIdSchema,
    name: z.string().trim().min(1).max(150),
    instruction: z.string().trim().max(4000).default(""),
    behavior: storedStageBehavior.transform(normalizeStageBehavior).optional(),
    output: z.enum(["chat", "pdf", "image"]).optional(),
    provider: z
      .object({
        modelId: z.string().trim().min(1).max(150),
        reasoning: z.enum(providerReasoningEffortValues).optional(),
      })
      .strict()
      .optional(),
    imageBrief: z.literal("marketplace-cover").optional(),
    imageBriefAutoGenerate: z.boolean().optional(),
    coverAttachmentRole: coverAttachmentRoleSchema.optional(),
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
    workFunding: stageWorkFundingSchema.optional(),
    defaultAssigneeSubjectId: z.uuid().optional(),
    skillIds: z
      .array(z.uuid())
      .max(FUNNEL_STAGE_SKILL_LIMIT)
      .refine((ids) => new Set(ids).size === ids.length)
      .optional(),
    settlementEvent: z.string().trim().max(150).optional(),
    settlementInstruction: z.string().trim().max(4000).optional(),
    resultPricing: resultPricingSchema.optional(),
    actions: z.array(actionSchema).max(100).default([]),
    waiting: waitingSchema.optional(),
  })
  .superRefine(({ output, provider }, context) => {
    if (!provider) {
      return;
    }
    const kind = output === "image" ? "image" : "text";
    if (!OPEN_AI_WORK_MODELS[kind].some((id) => id === provider.modelId)) {
      context.addIssue({
        code: "custom",
        path: ["provider", "modelId"],
        message: "Choose an OpenAI model available for the stage output",
      });
    }
    if (provider.reasoning) {
      const allowedEfforts =
        provider.modelId === OPEN_AI_STAGE_TEXT_DEFAULT.modelId
          ? OPEN_AI_STAGE_TEXT_REASONING
          : openAIChatReasoning(provider.modelId)?.supportedEfforts;
      if (
        kind !== "text" ||
        !allowedEfforts?.some((effort) => effort === provider.reasoning)
      ) {
        context.addIssue({
          code: "custom",
          path: ["provider", "reasoning"],
          message: "The selected model does not support this reasoning effort",
        });
      }
    }
  })
  .refine((stage) => !stage.imageBrief || stage.output === "image", {
    path: ["imageBrief"],
    message: "Marketplace cover brief requires image output",
  })
  .refine(
    (stage) =>
      !stage.imageBriefAutoGenerate || stage.imageBrief === "marketplace-cover",
    {
      path: ["imageBriefAutoGenerate"],
      message: "Automatic cover generation requires a marketplace cover brief",
    },
  )
  .refine(
    (stage) => !stage.skillIds?.length || stage.defaultAssigneeSubjectId,
    {
      path: ["skillIds"],
      message: "Stage skills require an assigned agent",
    },
  );

export const workFundingSchema = z.object({
  payer: z.enum(["store-owner", "customer"]),
  currencyId: z.uuid(),
  maxTaskAmount: positiveAmount,
  maxRunAmount: positiveAmount,
});

export interface IFunnelAction extends z.infer<typeof actionSchema> {}
export interface IFunnelStage extends z.infer<typeof stageSchema> {}
export interface IStageWorkFunding extends z.infer<
  typeof stageWorkFundingSchema
> {}

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

export function stageWorkModelSelection(
  stage: Pick<IFunnelStage, "output" | "provider">,
  capability: TStageWorkCapability,
  requested?: Partial<IOpenAIWorkModelSelection>,
): (Partial<IOpenAIWorkModelSelection> & { provider?: "openai" }) | undefined {
  const mainCapability = stage.output === "image" ? "image" : "text";
  if (capability !== mainCapability) {
    return undefined;
  }
  const configured = stage.provider;
  if (!configured) {
    return requested;
  }
  if (configured.modelId === OPEN_AI_STAGE_TEXT_DEFAULT.modelId) {
    return {
      ...configured,
      provider: "openai",
      reasoning: configured.reasoning ?? OPEN_AI_STAGE_TEXT_DEFAULT.reasoning,
    };
  }
  return { ...configured, provider: "openai" };
}

export function stageWorkCapabilities(
  stage: Pick<
    IFunnelStage,
    "output" | "imageBrief" | "imageBriefAutoGenerate" | "operations"
  >,
): TStageWorkCapability[] {
  if (stage.imageBrief === "marketplace-cover") {
    return isAutomaticCoverStage(stage) ? ["image", "decision"] : ["image"];
  }
  const main = stage.output === "image" ? "image" : "text";
  return [
    ...new Set<TStageWorkCapability>([
      main,
      ...(stage.operations ?? [])
        .filter(
          (operation) =>
            operation !== "vision" && operation !== "transcription",
        )
        .map((operation) => paidOperationCapabilities[operation]),
    ]),
  ];
}

export function isAutomaticCoverStage(
  stage: Pick<IFunnelStage, "output" | "imageBrief" | "imageBriefAutoGenerate">,
) {
  return (
    stage.output === "image" &&
    stage.imageBrief === "marketplace-cover" &&
    stage.imageBriefAutoGenerate === true
  );
}

export interface IResultConversion extends z.infer<
  typeof resultConversionSchema
> {}
export interface IWorkFunding extends Omit<
  z.infer<typeof workFundingSchema>,
  "maxTaskAmount" | "maxRunAmount"
> {
  maxTaskAmount?: string;
  maxRunAmount?: string;
  multiplier?: string;
  orderFormula?: true;
}

export function customerPaysForWork(
  funding?: IWorkFunding,
): funding is IWorkFunding {
  return (
    funding?.payer === "customer" &&
    (funding.multiplier === undefined || /[1-9]/.test(funding.multiplier))
  );
}

type TStageFundingSetup = Pick<
  IFunnelStage,
  "archived" | "workFunding" | "defaultAssigneeSubjectId"
>;

export function needsStageWorkFunding(
  stage: TStageFundingSetup,
  previousStage?: TStageFundingSetup,
) {
  return (
    !stage.archived &&
    !stage.workFunding &&
    (!previousStage ||
      previousStage.archived ||
      Boolean(previousStage.workFunding) ||
      previousStage.defaultAssigneeSubjectId !== stage.defaultAssigneeSubjectId)
  );
}

export type TActorKind = z.infer<typeof actorKindSchema>;
export type TEvidenceKind = z.infer<typeof evidenceKindSchema>;
export type TTaskOutcome = z.infer<typeof outcomeSchema>;
