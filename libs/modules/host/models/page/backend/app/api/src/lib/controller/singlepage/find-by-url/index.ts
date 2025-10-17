import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const queryUrl = c.req.query("url");
      const sanitizedUrl = queryUrl?.split("?")[0];
      let url = sanitizedUrl;

      if (url === "/favicon.ico") {
        return c.json({});
      }

      // Vercel changes url "/" to "index" so we need to change it back
      if (
        !url ||
        ["index"].includes(url.split("/").filter((u) => u !== "")?.[0])
      ) {
        url = "/";
      }

      const entity = await this.service.findByUrl({
        url,
        params: c.var.parsedQuery,
      });

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
