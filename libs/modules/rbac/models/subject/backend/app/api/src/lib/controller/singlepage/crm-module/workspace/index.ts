import { getHttpErrorType } from "@sps/backend-utils";
import { withConsistencySnapshot } from "@sps/shared-backend-api";
import {
  crmWorkspaceCommandSchema,
  crmWorkspaceEmployeeDetailSchema,
  crmWorkspaceEmployeeListSchema,
  crmWorkspaceFunnelBySlugSchema,
  crmWorkspaceFunnelListSchema,
  crmWorkspaceStoreListSchema,
  crmWorkspaceStorePageSchema,
  crmWorkspaceFunnelProductsSchema,
  crmWorkspaceOrdersSchema,
  crmWorkspaceCustomerSchema,
  crmWorkspaceOrderSchema,
  crmWorkspaceTaskDetailSchema,
  crmWorkspaceTaskListSchema,
  crmWorkspaceThreadMessageSchema,
  crmWorkspaceThreadSchema,
} from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { messageAttachmentResponse } from "../../ecommerce-module/customer-work";
import type { Service } from "../../../../service/singlepage/crm/workspace";

type TOperation =
  | "stores"
  | "options"
  | "overview"
  | "orders"
  | "order"
  | "customers"
  | "customer"
  | "employees"
  | "employee"
  | "funnels"
  | "funnel"
  | "tasks"
  | "detail"
  | "intake"
  | "thread"
  | "send"
  | "attachment"
  | "artifact"
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

      if (this.operation === "send") {
        const scope = crmWorkspaceThreadSchema.parse(c.req.query());
        const form = await c.req.formData();
        const message = crmWorkspaceThreadMessageSchema.parse({
          text: form.get("text"),
          operationKey: form.get("operationKey"),
        });
        const files = z.array(z.instanceof(File)).parse(form.getAll("files"));
        const data = await this.service.send(actorId, scope, {
          ...message,
          files,
        });
        c.header("X-SPS-SKIP-ACTION-LOGGER", "1");
        return c.json({ data });
      }
      if (this.operation === "attachment") {
        const scope = crmWorkspaceThreadSchema.parse(c.req.query());
        const file = z
          .object({ messageId: z.uuid(), attachmentId: z.uuid() })
          .parse(c.req.query());
        const data = await this.service.attachment(actorId, scope, file);
        return messageAttachmentResponse(data, c.req.method);
      }
      if (this.operation === "artifact") {
        const scope = crmWorkspaceThreadSchema.parse(c.req.query());
        const artifactId = z.uuid().parse(c.req.query("artifactId"));
        const data = await this.service.artifact(actorId, scope, artifactId);
        const contentType = [
          "image/png",
          "image/jpeg",
          "image/webp",
          "application/pdf",
        ].find((mime) => mime === data.mimeType);
        return messageAttachmentResponse(data, c.req.method, contentType);
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
      offset:
        query["offset"] === undefined ? undefined : Number(query["offset"]),
      limit: query["limit"] === undefined ? undefined : Number(query["limit"]),
      current:
        query["current"] === undefined
          ? undefined
          : query["current"] === "true",
      overdue:
        query["overdue"] === undefined
          ? undefined
          : query["overdue"] === "true",
    };

    switch (this.operation) {
      case "stores": {
        const store = crmWorkspaceStoreListSchema.parse({
          ...query,
          tasks: query["tasks"] === "true",
        });
        return this.service.stores(actorId, store.storeSlug, store.tasks);
      }
      case "options": {
        const view = z
          .enum(["editor", "products"])
          .optional()
          .parse(query["view"]);
        if (view === "products") {
          return this.service.funnelProducts(
            actorId,
            crmWorkspaceFunnelProductsSchema.parse(query),
          );
        }
        return this.service.options(
          actorId,
          z.uuid().parse(query["storeId"]),
          view !== "editor",
        );
      }
      case "overview":
        return this.service.overview(actorId, z.uuid().parse(query["storeId"]));
      case "orders":
        return this.service.orders(
          actorId,
          crmWorkspaceOrdersSchema.parse(query),
        );
      case "order":
        return this.service.order(
          actorId,
          crmWorkspaceOrderSchema.parse(query),
        );
      case "customers":
        return this.service.customers(
          actorId,
          crmWorkspaceStorePageSchema.parse(query),
        );
      case "customer":
        return this.service.customer(
          actorId,
          crmWorkspaceCustomerSchema.parse(query),
        );
      case "employees":
        return this.service.employeeList(
          actorId,
          crmWorkspaceEmployeeListSchema.parse(query),
        );
      case "employee":
        return this.service.employeeDetail(
          actorId,
          crmWorkspaceEmployeeDetailSchema.parse(query),
        );
      case "funnels":
        return this.service.funnels(
          actorId,
          crmWorkspaceFunnelListSchema.parse(input),
        );
      case "funnel":
        return this.service.funnel(
          actorId,
          crmWorkspaceFunnelBySlugSchema.parse(query),
        );
      case "tasks":
        return this.service.tasks(
          actorId,
          crmWorkspaceTaskListSchema.parse({
            ...input,
            includeStageNames: query["includeStageNames"] === "true",
          }),
        );
      case "detail":
        return this.service.detail(
          actorId,
          crmWorkspaceTaskDetailSchema.parse(input),
        );
      case "intake":
        return this.service.intake(actorId, z.uuid().parse(query["storeId"]));
      case "thread":
        return this.service.thread(
          actorId,
          crmWorkspaceThreadSchema.parse(query),
        );
      case "send":
      case "attachment":
      case "artifact":
      case "command":
        throw new Error("Internal error. Unsupported CRM workspace read");
    }
  }
}
