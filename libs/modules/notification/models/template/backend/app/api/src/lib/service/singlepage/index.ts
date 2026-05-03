import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/template/backend/repository/database";
import {
  NEXT_PUBLIC_HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import QueryString from "qs";
import pako from "pako";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  private hasRenderErrorPayload(data: string): boolean {
    try {
      const parsedData = JSON.parse(data);

      return (
        !!parsedData && typeof parsedData === "object" && "error" in parsedData
      );
    } catch {
      return false;
    }
  }

  private async fetchRenderedTemplate(params: {
    url: string;
  }): Promise<string | null> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. Secret key not found");
    }

    const response = await fetch(params.url, {
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
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

    let queryData: undefined | string;

    if (params?.payload) {
      const deflatedData = pako.deflate(JSON.stringify(params.payload));

      const stringifiedData = Buffer.from(deflatedData).toString("base64");

      queryData = stringifiedData;
    }

    const query = QueryString.stringify(
      {
        variant: template.variant,
        data: queryData,
      },
      {
        encodeValuesOnly: true,
      },
    );

    if (params.type === "email") {
      return await this.fetchRenderedTemplate({
        url:
          NEXT_PUBLIC_HOST_SERVICE_URL +
          "/api/email-generator/index.html?" +
          query,
      });
    } else if (params.type === "telegram") {
      return await this.fetchRenderedTemplate({
        url: NEXT_PUBLIC_HOST_SERVICE_URL + "/api/telegram-generator?" + query,
      });
    }

    throw new Error("Internal error. Passed render type is not supported");
  }
}
