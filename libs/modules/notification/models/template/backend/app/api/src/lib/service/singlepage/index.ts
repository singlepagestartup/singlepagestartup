import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/template/backend/repository/database";
import {
  NEXT_PUBLIC_HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import {
  getNotificationTemplateChannel,
  interpolateNotificationTemplate,
} from "@sps/backend-utils";
import {
  IRenderRequest,
  renderRequestSchema,
} from "@sps/notification/models/template/sdk/model";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  protected hasRenderErrorPayload(data: string): boolean {
    try {
      const parsedData = JSON.parse(data);

      return (
        !!parsedData && typeof parsedData === "object" && "error" in parsedData
      );
    } catch {
      return false;
    }
  }

  protected async fetchRenderedTemplate(params: {
    url: string;
    body: IRenderRequest;
  }): Promise<string | null> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. Secret key not found");
    }

    const response = await fetch(params.url, {
      method: "POST",
      body: JSON.stringify(params.body),
      signal: AbortSignal.timeout(10000),
      redirect: "error",
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        "Content-Type": "application/json",
      },
    });
    const data = await response.text();

    if (!response.ok || !data.trim() || this.hasRenderErrorPayload(data)) {
      return null;
    }

    return data;
  }

  async render(params: {
    id: string;
    type: "email" | "telegram";
    payload?: any;
  }): Promise<string | null> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. Secret key not found");
    }

    const template = await this.findById({
      id: params.id,
    });

    if (!template) {
      throw new Error("Not Found error. Template not found");
    }

    const channel = getNotificationTemplateChannel(template.variant);
    if (channel !== params.type) {
      throw new Error(
        "Validation error. Template does not match delivery channel",
      );
    }

    let content: string | null = null;
    if (template.content?.trim()) {
      content = interpolateNotificationTemplate({
        content: template.content,
        payload: params.payload,
      });
    }

    const body = renderRequestSchema.parse({
      variant: template.variant,
      data: params.payload,
      template: { title: template.title ?? null, content },
    });
    let path = "/api/email-generator/index.html";
    if (channel === "telegram") {
      path = "/api/telegram-generator";
    }
    const rendered = await this.fetchRenderedTemplate({
      url: NEXT_PUBLIC_HOST_SERVICE_URL + path,
      body,
    });
    return rendered;
  }
}
