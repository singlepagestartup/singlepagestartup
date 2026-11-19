import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { connectionCommand } from "@sps/rbac/models/subject/sdk/model/src/lib/provider-connections";
import type { Service } from "../../../service";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context) {
    c.header("Cache-Control", "private, no-store");
    c.header("X-SPS-SKIP-ACTION-LOGGER", "1");
    try {
      const id = c.req.param("id");
      const storeId = c.req.param("storeId");
      const token = c.req
        .header("Authorization")
        ?.match(/^Bearer (\S+)$/i)?.[1];
      if (
        !id ||
        !storeId ||
        !token ||
        (await this.service.isAuthorizedService.getSubjectId(token)) !== id ||
        !(await this.service.authenticationMe({ subjectId: id }))?.authenticated
      ) {
        throw new HTTPException(401, {
          message: "A signed-in store owner is required",
        });
      }
      if (c.req.method === "GET") {
        return c.json({
          data: await this.service.providerConnections.list(id, storeId),
        });
      }
      const body = await c.req.json().catch(() => null);
      const parsed = connectionCommand.safeParse(body?.data);
      if (!parsed.success || parsed.data.storeId !== storeId) {
        throw new HTTPException(400, {
          message: "Invalid provider connection command",
        });
      }
      const result = await this.service.providerConnections.change(
        id,
        parsed.data,
      );
      return c.json({ data: { id: result.id } });
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      const failure = getHttpErrorType(error);
      // Schema/driver error details may include submitted values.
      throw new HTTPException(failure.status, {
        message:
          failure.status >= 500
            ? "Provider connection unavailable"
            : "Provider operation rejected",
      });
    }
  }
}
