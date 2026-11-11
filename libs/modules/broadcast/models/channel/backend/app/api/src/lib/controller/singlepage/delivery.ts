import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { deliveryCommand } from "@sps/broadcast/models/channel/sdk/model";
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
        case "publish": {
          const created = await queue.publish(input);

          return c.json({ data: { created } });
        }
        case "reserve": {
          const delivery = await queue.reserve({ ...input, concurrency: 1 });

          return c.json({
            data: delivery,
          });
        }
        case "removeCompleted": {
          const removed = await queue.removeCompleted(
            input.channelId,
            new Date(input.before),
            input.limit,
          );

          return c.json({
            data: {
              removed,
            },
          });
        }
        case "start": {
          const accepted = await queue.start(input);

          return this.receiptResponse(c, accepted);
        }
        case "renew": {
          const accepted = await queue.renew(input, input.leaseSeconds);

          return this.receiptResponse(c, accepted);
        }
        case "acknowledge": {
          const accepted = await queue.acknowledge(input, input.payload);

          return this.receiptResponse(c, accepted);
        }
        case "release": {
          const accepted = await queue.release(input);

          return this.receiptResponse(c, accepted);
        }
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
