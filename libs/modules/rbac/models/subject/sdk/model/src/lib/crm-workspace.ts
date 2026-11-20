import { z } from "zod";
import { customerWorkOfferScopeSchema } from "./customer-work";
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

const crmWorkspaceSaveSchema = saveDraftSchema.omit({ bindings: true }).extend({
  productIds: z.array(z.uuid()).max(100).optional(),
});
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

export const STORE_EMPLOYEE_CHAT_VARIANT = "store-employee";

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
    kind: z.literal("create-employee"),
    employee: z.object({
      storeId: z.uuid(),
      name: z.string().trim().min(1).max(120),
      operationKey: z.uuid(),
    }),
  }),
  z.object({
    kind: z.literal("open-employee-chat"),
    employee: z.object({ storeId: z.uuid(), subjectId: z.uuid() }),
  }),
  z.object({
    kind: z.literal("fulfill"),
    fulfillment: orderWorkFulfillmentSchema.extend({ orderId: z.uuid() }),
  }),
  z.object({
    kind: z.literal("start-test"),
    test: customerWorkOfferScopeSchema.extend({
      funnelId: z.uuid(),
      operationKey: z.uuid(),
    }),
  }),
  z.object({
    kind: z.literal("refresh-test"),
    test: z.object({
      storeId: z.uuid(),
      taskId: z.uuid(),
      operationKey: z.uuid(),
    }),
  }),
]);

export interface ICrmWorkspaceStore {
  id: string;
  title: string;
  slug: string;
  canReadCosts: boolean;
  canTest?: boolean;
  canManageCatalog?: boolean;
  canManageEmployees: boolean;
}
export interface ICrmWorkspaceOffer {
  id: string;
  productId: string;
  title: string;
  kind: "service" | "physical";
  requiresResultAcceptance: boolean;
}
export interface ICrmWorkspaceParticipant {
  id: string;
  name: string;
  kind: "human" | "ai";
}
export interface ICrmWorkspaceEmployee {
  id: string;
  name: string;
  profileId: string;
}
export interface ICrmWorkspaceEmployeeChat {
  id: string;
  profileId: string;
  chatId: string;
  threadId: string;
}
export interface ICrmWorkspaceCurrency {
  id: string;
  title: string;
  units: number | null;
}
export interface ICrmWorkspaceSkill {
  id: string;
  title: string;
}
export interface ICrmWorkspaceOptions {
  participants: ICrmWorkspaceParticipant[];
  canManageEmployees: boolean;
  employees: ICrmWorkspaceEmployee[];
  payers: ICrmWorkspaceParticipant[];
  currencies: ICrmWorkspaceCurrency[];
  skillsByAssignee: Record<string, ICrmWorkspaceSkill[]>;
  offers?: ICrmWorkspaceOffer[];
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
  test?: boolean;
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
  thread?: { id: string; title: string; chatId?: string };
  assistant?: ICrmWorkspaceParticipant;
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
export type ICrmWorkspaceStartTest = Extract<
  TCrmWorkspaceCommand,
  { kind: "start-test" }
>["test"];
export type ICrmWorkspaceRefreshTest = Extract<
  TCrmWorkspaceCommand,
  { kind: "refresh-test" }
>["test"];
export type TCrmWorkspaceCommandResult =
  | { kind: "save"; data: ICrmWorkspaceFunnel }
  | { kind: "publish"; data: ICrmWorkspacePublication }
  | {
      kind: "create-employee" | "open-employee-chat";
      data: ICrmWorkspaceEmployeeChat;
    }
  | { kind: "fulfill"; data: IOrderPhysicalEvent }
  | {
      kind: "start-test" | "refresh-test";
      data: { id: string; chatId: string; threadId: string };
    }
  | { kind: "transition" | "assign"; data: ICrmWorkspaceTask };
