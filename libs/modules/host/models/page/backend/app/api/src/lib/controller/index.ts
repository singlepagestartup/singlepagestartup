import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/host/models/page/backend/repository/database";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../service";

@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);
    this.service = service;
    this.bindHttpRoutes([
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/find-by-url",
        handler: this.findByUrl,
      },
      {
        method: "GET",
        path: "/urls",
        handler: this.urls,
      },
      {
        method: "GET",
        path: "/url-segment-value",
        handler: this.urlSegmentValue,
      },
      {
        method: "GET",
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "POST",
        path: "/",
        handler: this.create,
      },
      {
        method: "PATCH",
        path: "/:uuid",
        handler: this.update,
      },
      {
        method: "DELETE",
        path: "/:uuid",
        handler: this.delete,
      },
    ]);
  }

  async findByUrl(c: Context, next: any): Promise<Response> {
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
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async urls(c: Context, next: any): Promise<Response> {
    const urls = await this.service.urls();

    return c.json({
      data: { urls },
    });
  }

  async urlSegmentValue(c: Context, next: any): Promise<Response> {
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
  }
}
