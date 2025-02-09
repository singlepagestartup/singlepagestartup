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

      if (!queryUrl) {
        throw new Error("Query url is required");
      }

      const sanitizedUrl = queryUrl?.split("?")[0];
      const segment = c.req.query("segment");

      if (!segment) {
        throw new Error("Query segment is required");
      }

      const segmentValue = await this.service.urlSegmentValue({
        url: sanitizedUrl,
        segment,
      });

      return c.json({
        data: segmentValue,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
