import { z } from "zod";
import {
  selectSchema as taskRecordSchema,
  type ISelectSchema,
} from "@sps/crm/models/task/backend/repository/database";

export interface ITaskParticipants {
  customerId: string;
  assigneeId: string | null;
}

export interface ITaskParticipantStore {
  getForTasks(taskIds: string[]): Promise<Map<string, ITaskParticipants>>;
  setCustomer(taskId: string, customerId: string): Promise<void>;
  setAssignee(taskId: string, assigneeId: string | null): Promise<void>;
  listTaskIds(filter: {
    customerId?: string;
    assigneeId?: string;
  }): Promise<string[]>;
}

export interface IModel extends ISelectSchema, ITaskParticipants {
  funnelId: string;
  publicationId: string;
  storeId: string;
  productId: string | null;
  offerId: string | null;
  orderId: string | null;
  offerIds: string[];
  orderIds: string[];
}
export const selectSchema = taskRecordSchema.extend({
  funnelId: z.uuid(),
  publicationId: z.uuid(),
  storeId: z.uuid(),
  customerId: z.uuid(),
  assigneeId: z.uuid().nullable(),
  productId: z.uuid().nullable(),
  offerId: z.uuid().nullable(),
  orderId: z.uuid().nullable(),
  offerIds: z.array(z.uuid()),
  orderIds: z.array(z.uuid()),
});

export {
  type IInsertSchema,
  insertSchema,
} from "@sps/crm/models/task/backend/repository/database";

export const route = "/api/crm/tasks";

export * from "./workflow";
