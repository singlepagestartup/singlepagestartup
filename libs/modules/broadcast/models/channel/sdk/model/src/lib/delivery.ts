import { z } from "zod";

const channel = z.object({ channelId: z.uuid() });
const keyed = channel.extend({ key: z.string().trim().min(1).max(250) });
const owner = keyed.extend({ receipt: z.uuid() });
const seconds = z.number().int().min(1).max(86400);
const payload = z.string().max(1024 * 1024);
export const deliveryCommand = z.discriminatedUnion("operation", [
  keyed
    .extend({
      operation: z.literal("publish"),
      payload,
      announce: z.boolean().optional(),
    })
    .strict(),
  channel
    .extend({ operation: z.literal("reserve"), leaseSeconds: seconds })
    .strict(),
  owner.extend({ operation: z.literal("start") }).strict(),
  owner
    .extend({ operation: z.literal("renew"), leaseSeconds: seconds })
    .strict(),
  owner
    .extend({
      operation: z.literal("acknowledge"),
      payload: payload.optional(),
    })
    .strict(),
  owner.extend({ operation: z.literal("release") }).strict(),
  channel
    .extend({
      operation: z.literal("removeCompleted"),
      before: z.string().datetime(),
      limit: z.number().int().min(1).max(1000),
    })
    .strict(),
]);

export type IDeliveryCommand = z.infer<typeof deliveryCommand>;
export interface IReservedDelivery {
  id: string;
  channelId: string;
  key: string;
  receipt: string;
  payload: string;
}
export type IDeliveryResult<T extends IDeliveryCommand> = T extends {
  operation: "reserve";
}
  ? IReservedDelivery[]
  : T extends { operation: "publish" }
    ? { created: boolean }
    : T extends { operation: "removeCompleted" }
      ? { removed: number }
      : { ok: true };
