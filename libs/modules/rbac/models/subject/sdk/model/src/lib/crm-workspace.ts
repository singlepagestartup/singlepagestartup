import { z } from "zod";
import { customerWorkOfferScopeSchema } from "./customer-work";
import { orderWorkFulfillmentSchema, type IOrderWorkView } from "./order-work";
import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import type { IChatAction } from "@sps/social/models/action/sdk/model";
import type {
  IModel as ISocialProfile,
  IProfilePresentation,
} from "@sps/social/models/profile/sdk/model";
import type {
  IModel as IEcommerceOrder,
  IStoreOrderRow,
  IOrderPhysicalEvent,
  TWorkFulfillmentState,
} from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IFunnel } from "@sps/crm/models/funnel/sdk/model";
import {
  FUNNEL_PRODUCT_LIMIT,
  getFunnelBySlugSchema,
  funnelEditCommands,
  type TFunnelEditCommand,
  listFunnelsSchema,
  pageInputSchema,
  saveFunnelSchema,
  type IPage,
} from "@sps/crm/models/funnel/sdk/model";
import type {
  IModel as ITaskEvent,
  TTaskStageState,
} from "@sps/crm/relations/tasks-to-stages/sdk/model";
import {
  assignTaskSchema,
  listTasksSchema,
  transitionTaskSchema,
  type IModel as ITask,
} from "@sps/crm/models/task/sdk/model";

export const crmWorkspaceFunnelListSchema = listFunnelsSchema;
export const crmWorkspaceFunnelBySlugSchema = getFunnelBySlugSchema;
export const crmWorkspaceStoreListSchema = z.object({
  storeSlug: z.string().min(1).optional(),
  tasks: z.boolean().optional(),
});
export const crmWorkspaceTaskListSchema = listTasksSchema.extend({
  includeStageNames: z.boolean().optional(),
});
export const crmWorkspaceTaskDetailSchema = pageInputSchema.extend({
  storeId: z.uuid(),
  taskId: z.uuid(),
});

export const crmWorkspaceThreadSchema = crmWorkspaceTaskDetailSchema
  .pick({ storeId: true, taskId: true })
  .extend({ chatId: z.uuid(), threadId: z.uuid() });

export interface ICrmWorkspaceConversation {
  title: string;
  canSend: boolean;
  messages: IChatMessage[];
  actions: IChatAction[];
  participants: ISocialProfile[];
  order: IOrderWorkView | null;
}

export const crmWorkspaceThreadMessageSchema = z.object({
  text: z.string().trim().max(8000),
  operationKey: z.uuid(),
});

export const crmWorkspaceStorePageSchema = z.object({
  storeId: z.uuid(),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  search: z.string().trim().max(180).optional(),
});
export const crmWorkspaceFunnelProductsSchema =
  crmWorkspaceStorePageSchema.extend({
    language: z.enum(["ru", "en"]).default("ru"),
  });
export interface ICrmWorkspaceFunnelProductsQuery extends z.output<
  typeof crmWorkspaceFunnelProductsSchema
> {}
export const crmWorkspaceCustomerSchema = z.object({
  storeId: z.uuid(),
  customerId: z.uuid(),
});
export const crmWorkspaceOrdersSchema = crmWorkspaceStorePageSchema.extend({
  customerId: z.uuid().optional(),
});
export interface ICrmWorkspaceCustomerQuery extends z.input<
  typeof crmWorkspaceCustomerSchema
> {}

export interface ICrmWorkspaceCustomer extends Pick<
  ISocialProfile,
  "title" | "subtitle"
> {
  subjectId: string;
  subjectSlug: string;
  profileSlug: string | null;
  orderCount: number;
}

export interface ICrmWorkspaceCustomerPage {
  items: ICrmWorkspaceCustomer[];
  total: number;
}

export const crmWorkspaceEmployeeListSchema = crmWorkspaceStorePageSchema;
export const crmWorkspaceEmployeeDetailSchema = z.object({
  storeId: z.uuid(),
  subjectId: z.uuid(),
});

export interface ICrmWorkspaceStorePageQuery {
  storeId: string;
  offset?: number;
  limit?: number;
  search?: string;
}
export interface ICrmWorkspaceEmployeeListQuery extends ICrmWorkspaceStorePageQuery {}

export interface ICrmWorkspaceStoreOrder extends Pick<
  IEcommerceOrder,
  "id" | "status"
> {
  createdAt: string;
}

export const crmWorkspaceOrderSchema = z.object({
  storeId: z.uuid(),
  orderId: z.uuid(),
});

export interface ICrmWorkspaceOrderQuery extends z.input<
  typeof crmWorkspaceOrderSchema
> {}

export interface ICrmOrderContents {
  resultFiles?: Array<{
    id: string;
    mime?: string;
    name?: string;
    createdAt: string;
    original?: true;
  }>;
  lines: Array<{
    id: string;
    productId: string;
    title: Record<string, string | undefined> | null;
    name: string;
    quantity: number;
    destination: {
      address?: string;
      region?: string;
      pickupPointId?: string;
      coordinates?: { latitude: number; longitude: number };
    };
  }>;
  comment: string | null;
  trackingNumber: string | null;
  payments?: Array<{
    id: string;
    status: string;
    currency: string | null;
    amount: number | null;
    paid: number | null;
    invoices: Array<{ id: string; status: string }>;
  }>;
}

export interface ICrmWorkspaceOrderDetail
  extends ICrmWorkspaceStoreOrder, ICrmOrderContents {
  customers: Array<{
    subjectId: string;
    name: string;
    profile?: Pick<ISocialProfile, "slug" | "title" | "subtitle">;
  }>;
  tasks: Array<Pick<ICrmWorkspaceTask, "id" | "label">>;
}

export interface ICrmWorkspaceOrderPage {
  items: IStoreOrderRow[];
  total: number;
  nextOffset?: number;
}

export interface ICrmWorkspaceEmployeeDetailQuery extends z.input<
  typeof crmWorkspaceEmployeeDetailSchema
> {}

const crmWorkspaceSaveSchema = saveFunnelSchema
  .omit({ bindings: true })
  .extend({
    productIds: z.array(z.uuid()).max(FUNNEL_PRODUCT_LIMIT).optional(),
    linkedProductIds: z.array(z.uuid()).max(FUNNEL_PRODUCT_LIMIT).optional(),
  })
  .refine(
    ({ productIds, linkedProductIds }) =>
      productIds === undefined || linkedProductIds === undefined,
  );
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
export const CRM_WORKSPACE_STAFF_MESSAGE_PREFIX = "workspace-staff:";

const workspaceStaffMessageId = z.tuple([
  z.uuid(),
  z.uuid(),
  z.union([z.uuid(), z.string().regex(/^[a-f0-9]{64}$/)]),
]);

export function taskChatStaffAuthor(message?: {
  metadata?: Record<string, unknown> | null;
  sourceSystemId?: string | null;
}) {
  const recorded = z
    .uuid()
    .safeParse(message?.metadata?.customerWorkStaffSubjectId);
  if (recorded.success) return recorded.data;
  return crmWorkspaceStaffMessageAuthor(message?.sourceSystemId);
}

export function crmWorkspaceStaffMessageAuthor(sourceSystemId?: string | null) {
  if (!sourceSystemId?.startsWith(CRM_WORKSPACE_STAFF_MESSAGE_PREFIX)) {
    return undefined;
  }
  const ids = sourceSystemId.slice(CRM_WORKSPACE_STAFF_MESSAGE_PREFIX.length);
  const parsed = workspaceStaffMessageId.safeParse(ids.split(":"));
  return parsed.success ? parsed.data[1] : undefined;
}

export const crmWorkspaceCommandSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("save"), funnel: crmWorkspaceSaveSchema }),
  ...funnelEditCommands,
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
    employee: crmWorkspaceEmployeeDetailSchema,
  }),
  z.object({
    kind: z.literal("create-employee-thread"),
    employee: crmWorkspaceEmployeeDetailSchema.extend({
      title: z.string().trim().min(1).max(120),
      operationKey: z.uuid(),
    }),
  }),
  z.object({
    kind: z.literal("fulfill"),
    fulfillment: orderWorkFulfillmentSchema.extend({ orderId: z.uuid() }),
  }),
  z.object({
    kind: z.literal("start-work"),
    participantIds: z.array(z.uuid()).max(100).optional(),
    work: customerWorkOfferScopeSchema.extend({
      operation: z.enum(["ask", "add"]),
      operationKey: z.uuid(),
    }),
  }),
  z.object({
    kind: z.literal("join-task-chat"),
    task: crmWorkspaceThreadSchema.pick({ storeId: true, taskId: true }),
  }),
  z.object({
    kind: z.literal("open-order-work"),
    participantIds: z.array(z.uuid()).max(100).optional(),
    order: z.object({ storeId: z.uuid(), orderId: z.uuid() }),
  }),
]);

export interface ICrmWorkspaceStore {
  id: string;
  title: string;
  slug: string;
  canReadCosts: boolean;
  canManageCatalog?: boolean;
  canManageTasks?: boolean;
  canManageEmployees: boolean;
  canManageProviderSettings?: boolean;
}
export interface ICrmWorkspaceStoreListItem extends ICrmWorkspaceStore {
  productCount: number;
  employeeCount: number;
}
export interface ICrmWorkspaceOverview {
  productCount: number;
  orderCount: number;
  taskCount: number;
}
export interface ICrmWorkspaceOffer {
  id: string;
  productId: string;
  title: string;
  kind: "service" | "physical";
  requiresResultAcceptance: boolean;
}
export interface ICrmWorkspaceProduct {
  id: string;
  title?: string;
  localizedTitle?: Record<string, string | undefined>;
}
export interface ICrmWorkspaceParticipant {
  id: string;
  name: string;
  kind: "human" | "ai";
  profileId?: string;
}
export interface ICrmWorkspaceEmployee {
  id: string;
  name: string;
  profileId: string;
}
export interface ICrmWorkspaceEmployeeProfile extends ICrmWorkspaceParticipant {
  canTrain: boolean;
  training?: ICrmWorkspaceEmployeeTraining;
}

export interface ICrmWorkspaceEmployeeListItem extends ICrmWorkspaceParticipant {
  profile?: Pick<ISocialProfile, "title" | "subtitle" | "slug" | "variant">;
}

export interface ICrmWorkspaceEmployeePage {
  total: number;
  items: ICrmWorkspaceEmployeeListItem[];
  nextOffset?: number;
}

export interface ICrmWorkspaceEmployeeChat {
  id: string;
  profileId: string;
  chatId: string;
  threadId: string;
}
export interface ICrmWorkspaceEmployeeTraining extends Omit<
  ICrmWorkspaceEmployeeChat,
  "id"
> {
  actorProfile: ISocialProfile;
  threads: Array<{ id: string; title: string }>;
}
export interface ICrmWorkspaceCurrency {
  slug?: string;
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
  products?: ICrmWorkspaceProduct[];
}
type TJsonDates<T> = {
  [Key in keyof T]: T[Key] extends Date | null
    ? Exclude<T[Key], Date> | string
    : T[Key];
};
export interface ICrmWorkspaceFunnel extends TJsonDates<IFunnel> {
  linkedProducts?: ICrmWorkspaceProduct[];
}
export interface ICrmWorkspaceFunnelPage extends IPage<ICrmWorkspaceFunnel> {
  total: number;
  nextOffset?: number;
}
export interface ICrmWorkspaceEvent extends TJsonDates<
  Omit<ITaskEvent, "detail">
> {
  detail: Omit<ITaskEvent["detail"], "publicationId" | "previousPublicationId">;
  assigneeName?: string;
  previousAssigneeName?: string;
}
export interface ICrmWorkspaceTask extends TJsonDates<
  Omit<ITask, "publicationId">
> {
  label: string;
  customerName: string;
  assigneeName?: string;
  assigneeProfile?: Pick<IProfilePresentation, "id" | "title" | "avatar">;
  stageName?: string;
}
export interface ICrmWorkspaceTaskDetail {
  task: ICrmWorkspaceTask;
  funnel: ICrmWorkspaceFunnel;
  stageStates?: Record<string, TTaskStageState>;
  visitedStageIds?: string[];
  awaitingManager?: boolean;
  history: IPage<ICrmWorkspaceEvent>;
  order?: {
    id: string;
    status: string;
    paymentStatus: string | null;
    originalDelivered?: boolean;
    fulfillment?: {
      state: TWorkFulfillmentState;
      trackingNumber?: string;
      canFulfill: boolean;
    };
  };
  canManageTasks: boolean;
  assignmentCandidates?: ICrmWorkspaceParticipant[];
  thread?: {
    id: string;
    title: string;
    chatId: string;
    canSend: boolean;
    actorProfileId?: string;
  };
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
export interface ICrmWorkspaceStoreQuery extends z.input<
  typeof crmWorkspaceStoreListSchema
> {}
export interface ICrmWorkspaceFunnelBySlugQuery extends z.input<
  typeof crmWorkspaceFunnelBySlugSchema
> {}
export interface ICrmWorkspaceTaskQuery extends z.input<
  typeof crmWorkspaceTaskListSchema
> {}
export interface ICrmWorkspaceTaskDetailQuery extends z.input<
  typeof crmWorkspaceTaskDetailSchema
> {}
export type TCrmWorkspaceCommand = z.input<typeof crmWorkspaceCommandSchema>;
export interface ICrmWorkspaceThreadQuery extends z.input<
  typeof crmWorkspaceThreadSchema
> {}

export interface ICrmWorkspaceThreadMessage extends z.input<
  typeof crmWorkspaceThreadMessageSchema
> {
  files?: File[];
}

export type TCrmWorkspaceCommandResult =
  | { kind: "save"; data: ICrmWorkspaceFunnel }
  | {
      [K in TFunnelEditCommand["kind"]]: {
        kind: K;
        data: ICrmWorkspaceFunnel;
      };
    }[TFunnelEditCommand["kind"]]
  | {
      kind: "create-employee" | "open-employee-chat" | "create-employee-thread";
      data: ICrmWorkspaceEmployeeChat;
    }
  | { kind: "fulfill"; data: IOrderPhysicalEvent }
  | {
      kind: "start-work";
      data: { id: string; chatId: string; threadId: string };
    }
  | {
      kind: "join-task-chat";
      data: { id: string; chatId: string; threadId: string };
    }
  | { kind: "open-order-work"; data: { id: string } }
  | { kind: "transition" | "assign"; data: ICrmWorkspaceTask };
