import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";

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
      if (error.message.includes("not found")) {
        throw new HTTPException(404, {
          message: error.message || "Not Found",
          cause: error,
        });
      }

      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
