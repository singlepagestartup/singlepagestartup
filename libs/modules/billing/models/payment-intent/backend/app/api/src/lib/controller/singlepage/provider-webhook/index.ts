import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { STRIPE_SECRET_KEY } from "@sps/shared-utils";
import Stripe from "stripe";
import { getHttpErrorType, logger } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const provider = c.req.param("provider");
      const contentType = c.req.header("content-type");
      const headers = c.req.header();
      const rawBody = await c.req.text();

      logger.debug("🚀 ~ providerWebhook ~ headers:", headers);
      logger.debug("🚀 ~ providerWebhook ~ c.req.text:", await c.req.text());

      let data;
      if (contentType?.includes("application/json")) {
        data = await c.req.json();
      } else if (contentType?.includes("multipart/form-data")) {
        const body = await c.req.parseBody();

        if (body["data"] instanceof File) {
          throw new Error("Validation error. Files are not supported");
        }

        if (typeof body["data"] !== "string") {
          data = JSON.parse(body["data"]);
        }
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams(rawBody);
        data = Object.fromEntries(params.entries());
      }

      let result: any;

      if (provider === "stripe") {
        if (!STRIPE_SECRET_KEY) {
          throw new Error("Configuration error. Stripe secret key not found");
        }

        const stripe = new Stripe(STRIPE_SECRET_KEY);
        const event = await stripe.events.retrieve(data.id);

        result = await this.service.stripe({ data: event, action: "webhook" });
      } else if (provider === "0xprocessing") {
        result = await this.service.OxProcessing({ data, action: "webhook" });
      } else if (provider.includes("payselection")) {
        if ("x-site-id" in headers && "x-webhook-signature" in headers) {
          result = await this.service.payselection({
            data,
            action: "webhook",
            rawBody,
            headers: {
              "x-site-id": headers["x-site-id"],
              "x-webhook-signature": headers["x-webhook-signature"],
            },
          });
        } else {
          throw new Error("Validation error. Missing headers");
        }
      } else if (provider === "cloudpayments") {
        if ("x-content-hmac" in headers && "content-hmac" in headers) {
          result = await this.service.cloudpayments({
            data,
            action: "webhook",
            rawBody,
            headers: {
              "x-content-hmac": headers["x-content-hmac"],
              "content-hmac": headers["content-hmac"],
            },
            callback: this.service.updatePaymentIntentStatus,
          });
        }
      } else if (provider === "tiptoppay") {
        if ("x-content-hmac" in headers && "content-hmac" in headers) {
          result = await this.service.tiptoppay({
            data,
            action: "webhook",
            rawBody,
            headers: {
              "x-content-hmac": headers["x-content-hmac"],
              "content-hmac": headers["content-hmac"],
            },
            callback: this.service.updatePaymentIntentStatus,
          });
        }
      } else if (provider === "dummy") {
        if (!data?.["data"]?.["id"]) {
          throw new Error("Validation error. Invalid data");
        }

        result = await this.service.dummy({
          data: data["data"],
          action: "webhook",
        });
      } else if (provider === "paykeeper") {
        result = await this.service.paykeeper({
          data,
          action: "webhook",
          headers,
          rawBody,
          callback: this.service.updatePaymentIntentStatus,
        });
      }

      return c.json(
        {
          data: result,
        },
        200,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
