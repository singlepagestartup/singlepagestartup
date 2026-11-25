import { z } from "zod";
import {
  actorKindSchema,
  pageInputSchema,
  stageIdSchema,
  coverAttachmentRoleSchema,
} from "@sps/crm/models/funnel/sdk/model";

const scopeSchema = z.object({ storeId: z.uuid() });
export const STORE_EMPLOYEE_TRAINING_KEY_PREFIX = "store-employee-training:";

export function isStoreEmployeeTraining(openingKey?: string | null) {
  return Boolean(openingKey?.startsWith(STORE_EMPLOYEE_TRAINING_KEY_PREFIX));
}
export const taskScopeSchema = scopeSchema.extend({ taskId: z.uuid() });
const auditSchema = z.object({
  actorId: z.uuid(),
  operationKey: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .refine((key) => !key.startsWith("timer:")),
  causeId: z.string().trim().min(1).max(180).optional(),
});
const changeSchema = taskScopeSchema.extend({
  ...auditSchema.shape,
  expectedRevision: z.number().int().positive(),
});
const reasonSchema = z.string().trim().min(1).max(4000);
const referenceSchema = z.string().trim().min(1).max(180);

export const taskEvidenceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("manual"), reason: reasonSchema }),
  z.object({ kind: z.literal("message"), messageId: referenceSchema }),
  z.object({ kind: z.literal("model-result"), resultId: referenceSchema }),
  z.object({
    kind: z.literal("result-accepted"),
    orderId: z.uuid(),
    fileId: z.uuid(),
  }),
  z.object({
    kind: z.literal("payment"),
    orderId: z.uuid(),
    paymentId: referenceSchema,
  }),
  z.object({
    kind: z.literal("delivery"),
    orderId: z.uuid(),
    deliveryId: referenceSchema,
    stage: z.enum(["preparing", "in-transit", "delivered"]).optional(),
  }),
  z.object({
    kind: z.literal("file-access"),
    orderId: z.uuid(),
    grantId: referenceSchema,
  }),
]);

export const openTaskSchema = scopeSchema.extend({
  ...auditSchema.shape,
  funnelId: z.uuid(),
  expectedFunnelRevision: z.number().int().positive().optional(),
  customerId: z.uuid(),
  productId: z.uuid().optional(),
  offerId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  formId: z.uuid().optional(),
});

export const listTasksSchema = scopeSchema.extend({
  ...pageInputSchema.shape,
  funnelId: z.uuid().optional(),
  stageId: stageIdSchema.optional(),
  customerId: z.uuid().optional(),
  overdue: z.boolean().optional(),
  current: z.boolean().optional(),
  orderId: z.uuid().optional(),
  assigneeId: z.uuid().optional(),
  status: z.enum(["active", "waiting", "closed"]).optional(),
  search: z.string().trim().min(1).max(180).optional(),
});

export const taskHistorySchema = taskScopeSchema.extend(pageInputSchema.shape);

export const assignTaskSchema = changeSchema.extend({
  assigneeId: z.uuid(),
  assigneeKind: z.enum(["human", "ai"]),
  assignmentExpiresAt: z.iso.datetime({ offset: true }).optional(),
});

export const resumeCustomerWorkSchema = changeSchema.extend({
  causeId: z.uuid(),
  actorKind: z.enum(["manager", "ai"]).optional(),
  assigneeId: z.uuid(),
  expectedAssignmentRevision: z.number().int().positive(),
});

export const transitionTaskSchema = changeSchema.extend({
  actorKind: actorKindSchema,
  expectedAssignmentRevision: z.number().int().nonnegative().optional(),
  actionId: stageIdSchema,
  evidence: taskEvidenceSchema,
});

export const recordTaskEvidenceSchema = transitionTaskSchema.omit({
  actionId: true,
});
export const customerTaskActivitySchema = z.discriminatedUnion("kind", [
  changeSchema.extend({
    kind: z.enum(["customer-message", "staff-message"]),
    messageId: z.uuid(),
    coverAttachmentRole: coverAttachmentRoleSchema.optional(),
  }),
  changeSchema.extend({ kind: z.literal("customer-handoff-requested") }),
  changeSchema.extend({
    kind: z.literal("customer-cart-approved"),
    orderId: z.uuid(),
    cartSelection: z
      .object({
        proposalId: z.uuid(),
        offerId: z.uuid(),
        currencyId: z.uuid(),
        quantity: z.number().int().positive(),
        amount: z.string().trim().min(1).max(50),
        quoteVersion: z.string().trim().min(1).max(180),
      })
      .strict(),
  }),
  changeSchema.extend({
    kind: z.literal("customer-budget-approved"),
    approvedMaximum: z
      .string()
      .regex(/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,12})?$/)
      .refine((value) => /[1-9]/.test(value))
      .optional(),
    priceKey: z.string().regex(/^[a-f0-9]{64}$/),
    rates: z
      .array(
        z.record(
          z.string().max(60),
          z.union([z.string().max(150), z.number().nonnegative()]),
        ),
      )
      .min(1)
      .max(20),
  }),
]);
export const transferTaskCustomerSchema = changeSchema.extend({
  previousCustomerId: z.uuid(),
  customerId: z.uuid(),
});
export const getTaskWorkSchema = taskScopeSchema.extend({
  eventId: z.uuid().optional(),
  assigneeId: z.uuid(),
  expectedRevision: z.number().int().positive().optional(),
  expectedAssignmentRevision: z.number().int().nonnegative(),
});

export const attachTaskFunnelSchema = taskScopeSchema.extend({
  funnelId: z.uuid(),
});
export interface IAttachTaskFunnel extends z.infer<
  typeof attachTaskFunnelSchema
> {}

export const attachTaskOfferSchema = changeSchema.extend({ offerId: z.uuid() });
export interface IAttachTaskOffer extends z.infer<
  typeof attachTaskOfferSchema
> {}

export const attachTaskOrderSchema = changeSchema.extend({ orderId: z.uuid() });
export const closeTaskSchema = changeSchema.extend({ reason: reasonSchema });

export const applyTimerSchema = taskScopeSchema.extend({
  timerKey: z.string().trim().min(1).max(180),
});
export const listDueTasksSchema = scopeSchema.extend({
  limit: z.number().int().min(1).max(100).optional(),
});

export interface IOpenTask extends z.infer<typeof openTaskSchema> {}
export interface ITaskScope extends z.infer<typeof taskScopeSchema> {}
export interface IListTasks extends z.infer<typeof listTasksSchema> {}
export interface ITaskHistory extends z.infer<typeof taskHistorySchema> {}
export interface IAssignTask extends z.infer<typeof assignTaskSchema> {}
export interface IResumeCustomerWork extends z.infer<
  typeof resumeCustomerWorkSchema
> {}
export interface ITransitionTask extends z.infer<typeof transitionTaskSchema> {}
export interface IRecordTaskEvidence extends z.infer<
  typeof recordTaskEvidenceSchema
> {}
export type TCustomerTaskActivity = z.infer<typeof customerTaskActivitySchema>;
export interface ITransferTaskCustomer extends z.infer<
  typeof transferTaskCustomerSchema
> {}
export interface IGetTaskWork extends z.infer<typeof getTaskWorkSchema> {}
export interface IAttachTaskOrder extends z.infer<
  typeof attachTaskOrderSchema
> {}
export interface ICloseTask extends z.infer<typeof closeTaskSchema> {}
export interface IApplyTimer extends z.infer<typeof applyTimerSchema> {}
export interface IListDueTasks extends z.infer<typeof listDueTasksSchema> {}
export type TTaskEvidence = z.infer<typeof taskEvidenceSchema>;
export type TTaskStatus = "active" | "waiting" | "closed";
export type TTaskAssigneeKind = "human" | "ai";
export type TTaskTimerKind = "reminder" | "deadline";

export interface ITaskTimer {
  key: string;
  kind: TTaskTimerKind;
  number: number;
}
