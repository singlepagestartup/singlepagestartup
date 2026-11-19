import { z } from "zod";
import { orderWorkFulfillmentSchema } from "./order-work";
import type {
  IOrderPhysicalEvent,
  TWorkFulfillmentState,
} from "@sps/ecommerce/models/order-work/sdk/model";
import type { IModel as IFunnel } from "@sps/crm/models/funnel/sdk/model";
import {
  listFunnelsSchema,
  pageInputSchema,
  publishFunnelSchema,
  saveDraftSchema,
  type IPage,
} from "@sps/crm/models/funnel/sdk/model";
import type { IModel as IPublication } from "@sps/crm/models/funnel-publication/sdk/model";
import type { IModel as ITaskEvent } from "@sps/crm/models/task-event/sdk/model";
import {
  assignTaskSchema,
  listTasksSchema,
  transitionTaskSchema,
  type IModel as ITask,
} from "@sps/crm/models/task/sdk/model";

export const crmWorkspaceFunnelListSchema = listFunnelsSchema;
export const crmWorkspacePublicationListSchema = pageInputSchema.extend({
  storeId: z.uuid(),
  funnelId: z.uuid(),
});
export const crmWorkspaceTaskListSchema = listTasksSchema;
export const crmWorkspaceTaskDetailSchema = pageInputSchema.extend({
  storeId: z.uuid(),
  taskId: z.uuid(),
});

const crmWorkspaceSaveSchema = saveDraftSchema.omit({ bindings: true });
const crmWorkspacePublishSchema = publishFunnelSchema.omit({ actorId: true });
const crmWorkspaceTransitionSchema = transitionTaskSchema
  .omit({ actorId: true, actorKind: true, evidence: true, causeId: true })
  .extend({
    reason: z.string().trim().min(1).max(2000),
    evidence: z.string().trim().max(1900).optional(),
  });

const crmWorkspaceAssignSchema = assignTaskSchema.omit({
  actorId: true,
  assigneeKind: true,
});

export const crmWorkspaceCommandSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("save"), draft: crmWorkspaceSaveSchema }),
  z.object({
    kind: z.literal("publish"),
    publication: crmWorkspacePublishSchema,
  }),
  z.object({
    kind: z.literal("transition"),
    transition: crmWorkspaceTransitionSchema,
  }),
  z.object({ kind: z.literal("assign"), assignment: crmWorkspaceAssignSchema }),
  z.object({
    kind: z.literal("fulfill"),
    fulfillment: orderWorkFulfillmentSchema.extend({ orderId: z.uuid() }),
  }),
]);

export interface ICrmWorkspaceStore {
  id: string;
  title: string;
  slug: string;
  canReadCosts: boolean;
}
export interface ICrmWorkspaceParticipant {
  id: string;
  name: string;
  kind: "human" | "ai";
}
export interface ICrmWorkspaceCurrency {
  id: string;
  title: string;
  units: number | null;
}
export interface ICrmWorkspaceOptions {
  participants: ICrmWorkspaceParticipant[];
  payers: ICrmWorkspaceParticipant[];
  currencies: ICrmWorkspaceCurrency[];
}
type TJsonDates<T> = {
  [Key in keyof T]: T[Key] extends Date | null
    ? Exclude<T[Key], Date> | string
    : T[Key];
};
export interface ICrmWorkspaceFunnel extends TJsonDates<IFunnel> {}
export interface ICrmWorkspacePublication extends TJsonDates<IPublication> {}
export interface ICrmWorkspaceEvent extends TJsonDates<ITaskEvent> {}
export interface ICrmWorkspaceTask extends TJsonDates<ITask> {
  label: string;
  customerName: string;
  assigneeName?: string;
}
export interface ICrmWorkspaceTaskDetail {
  task: ICrmWorkspaceTask;
  publication: ICrmWorkspacePublication;
  history: IPage<ICrmWorkspaceEvent>;
  order?: {
    id: string;
    status: string;
    paymentStatus: string | null;
    fulfillment?: {
      state: TWorkFulfillmentState;
      trackingNumber?: string;
      canFulfill: boolean;
    };
  };
  thread?: { id: string; title: string };
  costs?: Array<{
    id: string;
    status: string;
    amount: string;
    title: string;
    transfer?: string;
  }>;
}

export interface ICrmWorkspaceFunnelQuery extends z.input<
  typeof crmWorkspaceFunnelListSchema
> {}
export interface ICrmWorkspacePublicationQuery extends z.input<
  typeof crmWorkspacePublicationListSchema
> {}
export interface ICrmWorkspaceTaskQuery extends z.input<
  typeof crmWorkspaceTaskListSchema
> {}
export interface ICrmWorkspaceTaskDetailQuery extends z.input<
  typeof crmWorkspaceTaskDetailSchema
> {}
export type TCrmWorkspaceCommand = z.input<typeof crmWorkspaceCommandSchema>;
export type TCrmWorkspaceCommandResult =
  | { kind: "save"; data: ICrmWorkspaceFunnel }
  | { kind: "publish"; data: ICrmWorkspacePublication }
  | { kind: "fulfill"; data: IOrderPhysicalEvent }
  | { kind: "transition" | "assign"; data: ICrmWorkspaceTask };
