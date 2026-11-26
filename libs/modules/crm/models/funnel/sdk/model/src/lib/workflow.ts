import { z } from "zod";
import {
  stageIdSchema,
  stageSchema,
  workFundingSchema,
  type IFunnelStage,
  type IFunnelAction,
  type TEvidenceKind,
  type IStageWorkFunding,
  type IWorkFunding,
} from "@sps/crm/models/stage/sdk/model/src/lib/workflow";
export * from "@sps/crm/models/stage/sdk/model/src/lib/workflow";

export const funnelKindSchema = z.enum([
  "consultation",
  "individual-service",
  "physical-order",
]);

export const funnelDefinitionSchema = z.object({
  initialStageId: stageIdSchema,
  progression: z.literal("linear").optional(),
  applicability: z.string().trim().max(4000).optional(),
  goal: z.string().trim().max(4000).optional(),
  workFunding: workFundingSchema.optional(),
  maintenanceSourceId: z.uuid().optional(),
  stages: z.array(stageSchema).min(1).max(100),
});

export const FUNNEL_PRODUCT_LIMIT = 100;

export const funnelBindingsSchema = z.object({
  productIds: z.array(z.uuid()).max(FUNNEL_PRODUCT_LIMIT).default([]),
  offerIds: z.array(z.uuid()).max(100).default([]),
  formIds: z.array(z.uuid()).max(100).default([]),
});

export interface IFunnelDefinition extends z.infer<
  typeof funnelDefinitionSchema
> {}

const commerceEvidence = new Set<TEvidenceKind>([
  "payment",
  "delivery",
  "result-accepted",
  "file-access",
]);

function handles(stage: IFunnelStage, evidence: TEvidenceKind) {
  return stage.actions.some(
    (action) =>
      action.actors.includes("system") && action.evidence.includes(evidence),
  );
}

export function isOrderPaymentStage(stage: IFunnelStage) {
  return (
    stage.behavior === "ecommerce-module-order-payment" ||
    handles(stage, "payment")
  );
}

export function orderPaymentStagePatch(
  stage: IFunnelStage,
): Partial<IFunnelStage> {
  return {
    behavior: "ecommerce-module-order-payment",
    output: "chat",
    imageBrief: undefined,
    imageBriefAutoGenerate: undefined,
    coverAttachmentRole: undefined,
    provider: stage.output === "image" ? undefined : stage.provider,
    ...(stage.waiting &&
      !["payment", "message"].includes(stage.waiting.expectedEvent) && {
        waiting: undefined,
      }),
  };
}

export function stageCompletionCondition(stage: IFunnelStage) {
  if (
    stage.behavior ||
    !stage.actions.some(
      (action) =>
        action.actors.includes("ai") &&
        action.evidence.includes("model-result"),
    )
  ) {
    return undefined;
  }
  return stage.evidenceInstruction?.trim() || undefined;
}

export function linearFunnelDefinition(
  definition: IFunnelDefinition,
): IFunnelDefinition {
  const fileWork = definition.stages.some(
    (stage) =>
      !stage.archived &&
      (stage.output === "image" ||
        stage.output === "pdf" ||
        handles(stage, "result-accepted")),
  );
  const stages = definition.stages.map((stage, index): IFunnelStage => {
    if (stage.archived) {
      return stage;
    }
    const paymentStage = isOrderPaymentStage(stage);
    const legacyDelivery =
      !definition.progression &&
      !paymentStage &&
      (handles(stage, "file-access") ||
        (fileWork && handles(stage, "delivery")));
    if (stage.behavior === "order-file-delivery" || legacyDelivery) {
      const payment = definition.stages
        .slice(0, index)
        .reverse()
        .find((entry) => !entry.archived && isOrderPaymentStage(entry));
      const {
        behavior,
        waiting,
        imageBrief,
        imageBriefAutoGenerate,
        ...employeeStage
      } = stage;
      const russian = /\p{Script=Cyrillic}/u.test(stage.name);
      return {
        ...employeeStage,
        instruction:
          stage.instruction?.trim() ||
          (russian
            ? "Отправь покупателю оплаченный оригинал заказа."
            : "Send the paid original file to the customer."),
        evidenceInstruction:
          stage.evidenceInstruction?.trim() ||
          (russian
            ? "Оплаченный оригинал прикреплён к сообщению покупателю в чате заказа."
            : "The paid original file is attached to a message in the customer's order chat."),
        output: "chat",
        provider:
          (stage.output !== "image" ? stage.provider : undefined) ??
          (payment?.output !== "image" ? payment?.provider : undefined),
        defaultAssigneeSubjectId:
          stage.defaultAssigneeSubjectId ?? payment?.defaultAssigneeSubjectId,
        actions: [],
      };
    }
    if (paymentStage) {
      return { ...stage, ...orderPaymentStagePatch(stage) };
    }
    return stage;
  });
  const active = stages.filter((stage) => !stage.archived);
  return {
    ...definition,
    progression: "linear",
    initialStageId: active[0]?.id ?? definition.initialStageId,
    stages: stages.map((stage) => {
      if (stage.archived) {
        return stage;
      }
      const next = active[active.indexOf(stage) + 1];
      const destination = next
        ? { nextStageId: next.id }
        : { outcome: "completed" as const };
      const action: IFunnelAction = {
        id: "advance",
        name: "Advance",
        actors: ["ai"],
        evidence: ["model-result"],
        ...destination,
      };
      if (stage.behavior === "ecommerce-module-order-payment") {
        return {
          ...stage,
          actions: [{ ...action, actors: ["system"], evidence: ["payment"] }],
        };
      }
      const secured = stage.actions.flatMap((previous): IFunnelAction[] => {
        const evidence = previous.evidence.filter((entry) =>
          commerceEvidence.has(entry),
        );
        if (!previous.actors.includes("system") || !evidence.length) {
          return [];
        }
        const { nextStageId, outcome, ...fields } = previous;
        return [{ ...fields, actors: ["system"], evidence, ...destination }];
      });
      if (secured.length) {
        return { ...stage, actions: secured };
      }
      const priorAcceptance = active
        .slice(0, active.indexOf(stage))
        .some((entry) => handles(entry, "result-accepted"));
      if (
        !definition.progression &&
        fileWork &&
        next?.behavior === "ecommerce-module-order-payment" &&
        !priorAcceptance
      ) {
        return {
          ...stage,
          actions: [
            { ...action, actors: ["system"], evidence: ["result-accepted"] },
          ],
        };
      }
      let evidenceInstruction = stage.evidenceInstruction;
      if (!evidenceInstruction && !definition.progression) {
        const previous = stage.actions.find(
          (candidate) =>
            candidate.actors.includes("ai") &&
            candidate.evidence.includes("model-result"),
        );
        if (previous) {
          evidenceInstruction =
            previous.instruction || stage.instruction || undefined;
        }
      }
      const manual: IFunnelAction = {
        ...action,
        id: "advance-manually",
        name: /\p{Script=Cyrillic}/u.test(stage.name)
          ? "Завершить этап"
          : "Complete stage",
        actors: ["manager", "human"],
        evidence: ["manual"],
      };
      return {
        ...stage,
        ...(evidenceInstruction ? { evidenceInstruction } : {}),
        actions: [action, manual],
      };
    }),
  };
}
export function stageWorkFunding(
  definition: Pick<IFunnelDefinition, "workFunding">,
  stage: Pick<
    IFunnelStage,
    "workFunding" | "behavior" | "defaultAssigneeSubjectId"
  >,
): IWorkFunding | undefined {
  if (
    stage.behavior === "ecommerce-module-order-payment" &&
    !stage.defaultAssigneeSubjectId &&
    !stage.workFunding
  ) {
    return undefined;
  }
  if (!stage.workFunding) {
    return definition.workFunding;
  }
  return {
    payer: stage.workFunding.payer ?? "store-owner",
    currencyId: stage.workFunding.currencyId,
    ...(stage.workFunding.payer === "customer"
      ? { multiplier: stage.workFunding.multiplier }
      : {
          maxTaskAmount: stage.workFunding.maxStageAmount,
          maxRunAmount: stage.workFunding.maxRunAmount,
        }),
  };
}

export function customerStageFunding(
  stage: Pick<IFunnelStage, "workFunding">,
  tokenCurrencyId: string,
): IStageWorkFunding {
  const existing = stage.workFunding;
  return {
    payer: "customer",
    currencyId:
      existing?.payer === "customer" ? existing.currencyId : tokenCurrencyId,
    multiplier: existing?.payer === "customer" ? existing.multiplier : "0",
  };
}

export function employeeTrainingStageFunding(
  definition: IFunnelDefinition,
  ownerId: string,
): IFunnelStage | undefined {
  return definition.stages.find(
    (stage) => !stage.archived && stage.workFunding?.payerSubjectId === ownerId,
  );
}
export interface IFunnelBindings extends z.infer<typeof funnelBindingsSchema> {
  storeWide?: boolean;
}
export type TFunnelKind = z.infer<typeof funnelKindSchema>;
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
export const getFunnelBySlugSchema = scopedSchema.extend({
  funnelSlug: z
    .string()
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .refine((slug) => slug !== "new"),
});
export const saveFunnelSchema = scopedSchema.extend({
  funnelId: z.uuid().optional(),
  operationKey: z.string().trim().min(1).max(180).optional(),
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
const editFunnelScopeSchema = scopedSchema.extend({
  funnelId: z.uuid(),
  expectedRevision: z.number().int().positive(),
});
export const funnelEditCommands = [
  z.object({
    kind: z.literal("save-funnel-settings"),
    funnel: editFunnelScopeSchema
      .extend({
        name: saveFunnelSchema.shape.name,
        applicability: funnelDefinitionSchema.shape.applicability,
        goal: funnelDefinitionSchema.shape.goal,
        maintenanceSourceId: z.uuid().nullable().optional(),
        linkedProductIds: z
          .array(z.uuid())
          .max(FUNNEL_PRODUCT_LIMIT)
          .optional(),
      })
      .strict(),
  }),
  z.object({
    kind: z.literal("save-funnel-stage"),
    funnel: editFunnelScopeSchema.extend({ stage: stageSchema }).strict(),
  }),
  z.object({
    kind: z.literal("move-funnel-stage"),
    funnel: editFunnelScopeSchema
      .extend({ stageId: stageIdSchema, targetStageId: stageIdSchema })
      .strict(),
  }),
  z.object({
    kind: z.literal("delete-funnel-stage"),
    funnel: editFunnelScopeSchema
      .extend({
        stageId: stageIdSchema,
        targetStageId: stageIdSchema.optional(),
      })
      .strict(),
  }),
] as const;
export const funnelEditCommandSchema = z.discriminatedUnion(
  "kind",
  funnelEditCommands,
);
export type TFunnelEditCommand = z.input<typeof funnelEditCommandSchema>;
export const listFunnelsSchema = scopedSchema.extend({
  ...pageInputSchema.shape,
  offset: z.number().int().nonnegative().optional(),
  search: z.string().trim().max(180).optional(),
  kind: funnelKindSchema.optional(),
});
export const resolveFunnelSchema = scopedSchema.extend({
  kind: funnelKindSchema,
  formId: z.uuid().optional(),
  productId: z.uuid().optional(),
  offerId: z.uuid().optional(),
});

export interface ISaveFunnel extends z.input<typeof saveFunnelSchema> {}
export interface IGetFunnelBySlug extends z.infer<
  typeof getFunnelBySlugSchema
> {}
export interface IListFunnels extends z.infer<typeof listFunnelsSchema> {}
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
