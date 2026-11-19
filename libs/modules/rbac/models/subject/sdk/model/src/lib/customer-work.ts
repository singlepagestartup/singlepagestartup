import { z } from "zod";
import { ecommerceOrderCreateSchema } from "./ecommerce-product-purchase";

const scopeSchema = z.object({
  storeId: z.uuid(),
  operationKey: z.uuid(),
});
const offerScopeSchema = scopeSchema.extend({
  productId: z.uuid(),
  offerId: z.uuid(),
});

export const customerWorkCommandSchema = z.discriminatedUnion("operation", [
  offerScopeSchema.extend({ operation: z.literal("ask") }).strict(),
  offerScopeSchema
    .extend({
      operation: z.literal("add"),
      consultationTaskId: z.uuid().optional(),
      selection: ecommerceOrderCreateSchema
        .omit({
          productId: true,
          storeId: true,
          offerId: true,
        })
        .strict(),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("message"),
      taskId: z.uuid(),
      text: z.string().trim().min(1).max(8000),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("handoff"),
      taskId: z.uuid(),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("approve-budget"),
      taskId: z.uuid(),
      maximum: z
        .string()
        .regex(/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,12})?$/)
        .refine((value) => /[1-9]/.test(value)),
      priceKey: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("memory-project"),
      taskId: z.uuid(),
      projectId: z.uuid().nullable(),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("remember"),
      taskId: z.uuid(),
      sourceId: z.uuid().optional(),
      text: z.string().trim().min(1).max(2000),
    })
    .strict(),
  scopeSchema
    .extend({
      operation: z.literal("forget"),
      taskId: z.uuid(),
      sourceId: z.uuid(),
    })
    .strict(),
]);

export const customerWorkScopeSchema = z.object({
  storeId: z.uuid(),
  taskId: z.uuid(),
});
export const customerWorkOfferScopeSchema = customerWorkScopeSchema
  .pick({ storeId: true })
  .extend({
    offerId: z.uuid(),
    productId: z.uuid(),
  });

export type TCustomerWorkCommand = z.infer<typeof customerWorkCommandSchema>;
export interface ICustomerWorkScope extends z.infer<
  typeof customerWorkScopeSchema
> {}
export interface ICustomerWorkOfferScope extends z.infer<
  typeof customerWorkOfferScopeSchema
> {}
export interface ICustomerWorkOfferAvailability {
  consultation: boolean;
  order: boolean;
  payAfterAcceptance: boolean;
}

export interface ICustomerWorkMessage {
  id: string;
  author: string;
  kind: "customer" | "operator";
  body: string;
}

export interface ICustomerWorkMemoryNote {
  id: string;
  text: string;
}

export interface ICustomerWorkMemory {
  currentProjectId?: string;
  projects: { id: string; title: string }[];
  notes: ICustomerWorkMemoryNote[];
}

export interface ICustomerWorkPrice {
  key: string;
  rates: {
    capability: "text" | "image";
    model: string;
    inputUsdPerMillion: string;
    outputUsdPerMillion: string;
    usdPerSps: string;
    workMultiplier: string;
    version: string;
  }[];
}

export interface ICustomerWorkView {
  storeId: string;
  taskId: string;
  chatId: string;
  threadId: string;
  orderId?: string;
  offerId?: string;
  productSlug?: string;
  consultationTaskId?: string;
  operator?: string;
  assignment: "assistant" | "manager" | "unassigned";
  status: "active" | "waiting" | "closed";
  customerPays: boolean;
  requiredMaximum?: string;
  fundingCurrency?: string;
  price?: ICustomerWorkPrice;
  approvedMaximum?: string;
  memory?: ICustomerWorkMemory;
  messages: ICustomerWorkMessage[];
}

export interface IPendingCustomerWork {
  storeId: string;
  taskId: string;
  eventId: string;
  assigneeId: string;
  assignmentRevision: number;
  capability: "text";
}

export interface ICustomerWorkRun extends Omit<
  IPendingCustomerWork,
  "capability"
> {}

export interface ICustomerWorkSourceVersion {
  id: string;
  version: string;
}

export interface ICustomerWorkReply extends ICustomerWorkRun {
  attemptId: string;
  text: string;
  sourceVersions?: ICustomerWorkSourceVersion[];
}
