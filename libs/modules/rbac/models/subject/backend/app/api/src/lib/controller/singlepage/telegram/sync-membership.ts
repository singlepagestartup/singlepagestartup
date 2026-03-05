import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context): Promise<Response> {
    try {
      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. Invalid id");
      }

      const body = await c.req.parseBody();
      const rawData = body["data"];

      let data: {
        memberStatus?: string;
      } = {};

      if (typeof rawData === "string") {
        try {
          data = JSON.parse(rawData);
        } catch {
          throw new Error(
            "Validation error. Invalid JSON in body['data']. Got: " + rawData,
          );
        }
      } else if (rawData !== undefined) {
        throw new Error(
          "Validation error. Invalid body. Expected body['data'] with type of JSON.stringify(...).",
        );
      }

      const result = await this.service.telegramSyncMembership({
        id,
        memberStatus: data.memberStatus,
      });

      return c.json({
        data: result,
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
