import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { RBAC_SECRET_KEY, STRIPE_SECRET_KEY } from "@sps/shared-utils";
import Stripe from "stripe";
import {
  getHttpErrorType,
  logger,
  rbacSecretMatches,
  readRbacSecret,
} from "@sps/backend-utils";
import { IModel as Invoice } from "@sps/billing/models/invoice/sdk/model";

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

      const provider = c.req.param("provider");
      if (!provider) {
        throw new Error("Validation error. Invalid provider");
      }
      const contentType = c.req.header("content-type");
      const headers = c.req.header();
      const isMultipart = contentType?.includes("multipart/form-data");
      const rawBody = isMultipart ? "" : await c.req.text();

      if (provider !== "paykeeper") {
        logger.debug("🚀 ~ providerWebhook ~ headers:", headers);
        logger.debug("🚀 ~ providerWebhook ~ c.req.text:", rawBody);
      }

      let data;
      if (contentType?.includes("application/json")) {
        try {
          data = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          throw new Error("Validation error. Invalid JSON webhook payload");
        }
      } else if (contentType?.includes("multipart/form-data")) {
        const body = await c.req.parseBody();

        if (body["data"] instanceof File) {
          throw new Error("Validation error. Files are not supported");
        }

        if (typeof body["data"] === "string") {
          data = JSON.parse(body["data"]);
        } else if (body["data"]) {
          data = body["data"];
        }
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams(rawBody);
        data = Object.fromEntries(params.entries());
      }

      if (provider === "paykeeper") {
        const result = await this.service.paykeeper({
          data,
          action: "webhook",
          headers,
          rawBody,
        });
        if (
          !result ||
          !("acknowledgment" in result) ||
          typeof result.acknowledgment !== "string"
        )
          throw new Error("Internal error. Missing PayKeeper acknowledgment");
        c.header("Cache-Control", "no-store");
        c.header("X-Robots-Tag", "noindex");
        return c.text(result.acknowledgment, 200);
      }

      if (provider === "dummy" && data?.data?.id) {
        let invoice: Invoice | undefined | null;

        try {
          invoice = await this.service.billingModule.invoice.findById({
            id: data.data.id,
          });

          if (invoice?.provider === "dummy" && invoice.amount === 0) {
            invoice = await this.service.settlePayment({
              invoiceId: invoice.id,
              provider: "dummy",
              amount: 0,
            });

            return c.json(
              {
                data: invoice,
              },
              200,
            );
          }
        } catch (error) {
          //
        }
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
      } else if (provider === "telegram-star") {
        // Compared through the shared primitive rather than inline. A plain
        // inequality is only safe here because a configuration guard above
        // rejects an unset secret first; the primitive does not depend on
        // that guard staying there, and compares in constant time.
        if (!rbacSecretMatches(readRbacSecret(c))) {
          throw new Error(
            "Forbidden error. Invalid Telegram Star webhook secret",
          );
        }

        result = await this.service.telegramStar({
          data,
          action: "webhook",
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
