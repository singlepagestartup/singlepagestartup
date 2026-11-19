import { z } from "zod";
import type {
  IOrderWorkExpertArchive,
  TWorkFulfillmentState,
} from "@sps/ecommerce/models/order-work/sdk/model";

export const orderWorkScopeSchema = z.object({
  storeId: z.uuid(),
  taskId: z.uuid(),
});

export const orderWorkFulfillmentSchema = orderWorkScopeSchema
  .extend({
    stage: z.enum(["preparing", "in-transit", "delivered"]),
    operationKey: z.string().trim().min(1).max(140),
    trackingNumber: z.string().trim().min(1).max(180).optional(),
    carrierEvidenceId: z.string().trim().min(1).max(180).optional(),
  })
  .strict();

const decisionSchema = orderWorkScopeSchema.extend({
  resultVersionId: z.uuid(),
  operationKey: z.string().trim().min(1).max(140),
});

export const orderWorkDecisionSchema = z.discriminatedUnion("operation", [
  decisionSchema.extend({ operation: z.literal("accept") }).strict(),
  decisionSchema
    .extend({
      operation: z.literal("decline"),
      reason: z.string().trim().min(1).max(4000),
    })
    .strict(),
]);

export type TOrderWorkDecision = z.infer<typeof orderWorkDecisionSchema>;
export interface IOrderWorkScope extends z.infer<typeof orderWorkScopeSchema> {}

export interface IOrderArtifact {
  id: string;
  path: string;
}

export interface IOrderVersionView {
  id: string;
  number: number;
  createdAt: string;
  price: string;
  currencyId: string;
  preview: IOrderArtifact;
  previewMimeType?: string;
}

export interface IOrderWorkView {
  orderId: string;
  taskId: string;
  storeId: string;
  state: TWorkFulfillmentState;
  acceptedVersionId: string | null;
  paidVersionId: string | null;
  versions: IOrderVersionView[];
  result: IOrderArtifact | null;
  receipt: IOrderArtifact | null;
  deliveryStatus: "pending" | "available";
  trackingNumber: string | null;
  expertArchive?: IOrderWorkExpertArchive;
}

export function orderWorkPath(subjectId: string, orderId: string) {
  return `/api/rbac/subjects/${subjectId}/ecommerce-module/orders/${orderId}/work`;
}

export function orderArtifactPath(
  subjectId: string,
  orderId: string,
  fileId: string,
) {
  return `${orderWorkPath(subjectId, orderId)}/artifacts/${fileId}`;
}
