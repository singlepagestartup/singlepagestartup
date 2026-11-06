import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { deliveryCommand } from "@sps/broadcast/models/message/sdk/model";
import { getHttpErrorType, rbacSecretMatches } from "@sps/backend-utils";
import type { Service } from "../../service";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context) {
    try {
      if (!rbacSecretMatches(c.req.header("X-RBAC-SECRET-KEY"))) {
        throw new Error("Permission error. Operator access is required");
      }

      const command = deliveryCommand.safeParse(
        await c.req.json().catch(() => null),
      );
      if (!command.success) {
        throw new Error("Validation error. Invalid delivery command");
      }

      const input = command.data;
      const queue = this.service.queue;
      switch (input.operation) {
        case "publish":
          return c.json({ data: { created: await queue.publish(input) } });
        case "reserve":
          return c.json({
            data: await queue.reserve({ ...input, concurrency: 1 }),
          });
        case "removeCompleted":
          return c.json({
            data: {
              removed: await queue.removeCompleted(
                input.channelId,
                new Date(input.before),
                input.limit,
              ),
            },
          });
        case "start":
          return this.receiptResponse(c, await queue.start(input));
        case "renew":
          return this.receiptResponse(
            c,
            await queue.renew(input, input.leaseSeconds),
          );
        case "acknowledge":
          return this.receiptResponse(
            c,
            await queue.acknowledge(input, input.payload),
          );
        case "release":
          return this.receiptResponse(c, await queue.release(input));
      }
    } catch (error) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private receiptResponse(c: Context, accepted: boolean) {
    if (!accepted) {
      throw new Error(
        "Conflict error. Delivery is no longer available to this worker",
      );
    }
    return c.json({ data: { ok: true } });
  }
}
