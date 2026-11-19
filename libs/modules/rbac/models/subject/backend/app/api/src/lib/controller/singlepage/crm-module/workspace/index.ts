import { getHttpErrorType } from "@sps/backend-utils";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import {
  crmWorkspaceCommandSchema,
  crmWorkspaceFunnelListSchema,
  crmWorkspacePublicationListSchema,
  crmWorkspaceTaskDetailSchema,
  crmWorkspaceTaskListSchema,
} from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { Service } from "../../../../service/singlepage/crm/workspace";

type TOperation =
  | "stores"
  | "options"
  | "funnels"
  | "publications"
  | "tasks"
  | "detail"
  | "command";

export class Handler {
  constructor(
    readonly service: Service,
    readonly operation: TOperation,
  ) {}

  async execute(c: Context): Promise<Response> {
    const actorId = c.get("signedInSubjectId") as string;
    if (!actorId) {
      throw new HTTPException(401, {
        message: "Authentication error. Sign in to continue",
      });
    }

    try {
      if (this.operation === "command") {
        const raw: unknown = await c.req.json().catch(() => undefined);
        const { data: command } = z
          .object({ data: crmWorkspaceCommandSchema })
          .parse(raw);
        const result = await this.service.execute(actorId, command);
        return c.json({ data: result });
      }

      const data = await withConsistencySnapshot(() => this.read(c, actorId));
      return c.json({ data });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(422, {
          message: "Validation error. Invalid CRM workspace parameters",
        });
      }
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private async read(c: Context, actorId: string) {
    const query = c.req.query();
    const input = {
      ...query,
      limit: query["limit"] === undefined ? undefined : Number(query["limit"]),
      overdue:
        query["overdue"] === undefined
          ? undefined
          : query["overdue"] === "true",
    };

    switch (this.operation) {
      case "stores":
        return this.service.stores(actorId);
      case "options":
        return this.service.options(actorId, z.uuid().parse(query["storeId"]));
      case "funnels":
        return this.service.funnels(
          actorId,
          crmWorkspaceFunnelListSchema.parse(input),
        );
      case "publications":
        return this.service.publications(
          actorId,
          crmWorkspacePublicationListSchema.parse(input),
        );
      case "tasks":
        return this.service.tasks(
          actorId,
          crmWorkspaceTaskListSchema.parse(input),
        );
      case "detail":
        return this.service.detail(
          actorId,
          crmWorkspaceTaskDetailSchema.parse(input),
        );
      case "command":
        throw new Error("Internal error. CRM command cannot be read");
    }
  }
}
