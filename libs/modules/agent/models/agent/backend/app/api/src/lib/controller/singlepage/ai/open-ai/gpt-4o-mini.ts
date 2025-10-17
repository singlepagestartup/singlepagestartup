import { OPEN_AI_API_KEY, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../service";
import OpenAI from "openai";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      if (!OPEN_AI_API_KEY) {
        throw new Error("Configuration error. OPEN_AI_API_KEY not set");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data;
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      const client = new OpenAI({
        apiKey: OPEN_AI_API_KEY,
      });

      if (!data.description) {
        throw new Error(
          "Validation error. Missing description in body['data']",
        );
      }

      const response = await client.responses.create({
        model: "gpt-4o-mini",
        input: data.description,
      });

      return c.json({
        data: response,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);

      throw new HTTPException(status, { message, cause: details });
    }
  }
}
