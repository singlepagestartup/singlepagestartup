import { z } from "zod";
import {
  actorKindSchema,
  pageInputSchema,
  stageIdSchema,
} from "@sps/crm/models/funnel/sdk/model";

const scopeSchema = z.object({ storeId: z.uuid() });
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
    resultVersionId: z.uuid(),
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
  orderId: z.uuid().optional(),
  publicationId: z.uuid().optional(),
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
    kind: z.literal("customer-message"),
    messageId: z.uuid(),
  }),
  changeSchema.extend({ kind: z.literal("customer-handoff-requested") }),
]);
export const transferTaskCustomerSchema = changeSchema.extend({
  previousCustomerId: z.uuid(),
  customerId: z.uuid(),
});
export const getTaskWorkSchema = taskScopeSchema.extend({
  assigneeId: z.uuid(),
  expectedRevision: z.number().int().positive().optional(),
  expectedAssignmentRevision: z.number().int().nonnegative(),
});

export const migrateTaskSchema = changeSchema.extend({
  publicationId: z.uuid(),
  stageId: stageIdSchema,
  reason: reasonSchema,
});

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
export interface ITransitionTask extends z.infer<typeof transitionTaskSchema> {}
export interface IRecordTaskEvidence extends z.infer<
  typeof recordTaskEvidenceSchema
> {}
export type TCustomerTaskActivity = z.infer<typeof customerTaskActivitySchema>;
export interface ITransferTaskCustomer extends z.infer<
  typeof transferTaskCustomerSchema
> {}
export interface IGetTaskWork extends z.infer<typeof getTaskWorkSchema> {}
export interface IMigrateTask extends z.infer<typeof migrateTaskSchema> {}
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
