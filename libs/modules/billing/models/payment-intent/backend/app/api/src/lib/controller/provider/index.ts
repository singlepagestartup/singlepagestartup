import {
  ALLOWED_BILLING_SERVICE_PROVIDERS,
  API_SERVICE_URL,
  NextRequestOptions,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { api as billingCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { getHttpErrorType, logger } from "@sps/backend-utils";

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

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Invalid id");
      }

      const body = await c.req.parseBody();
      const provider = c.req.param("provider");

      if (typeof body["data"] !== "string") {
        throw new Error("Invalid data");
      }

      const entity = await this.service.findById({ id: uuid });

      const data = JSON.parse(body["data"]);

      if (!data) {
        throw new Error("Invalid data");
      }

      logger.debug("provider", provider);
      logger.debug("data", data);

      if (!entity) {
        throw new Error("Payment intent not found");
      }

      if (!data.currencyId) {
        throw new Error("Currency is required");
      }

      const currency = await billingCurrencyApi.findById({
        id: data.currencyId,
        params: {
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        },
      });

      if (!currency) {
        throw new Error("Currency not found");
      }

      logger.debug("currency", currency);

      let result: any;

      const allowedProviders = ALLOWED_BILLING_SERVICE_PROVIDERS.split(",");

      if (!allowedProviders.includes(provider)) {
        throw new Error(`Provider ${provider} is not allowed`);
      }

      if (provider === "stripe") {
        if (!data.metadata?.email) {
          throw new Error("Email is required");
        }

        result = await this.service.stripe({
          entity,
          action: "create",
          email: data.metadata.email,
          currency: currency.slug,
          metadata: {
            email: data.metadata.email,
            paymentIntentId: uuid,
          },
        });
      } else if (provider === "0xprocessing") {
        if (!data.metadata?.email) {
          throw new Error("Email is required");
        }

        result = await this.service.OxProcessing({
          action: "create",
          email: data.metadata.email,
          metadata: {
            paymentIntentId: uuid,
          },
          entity,
        });
      } else if (provider.includes("payselection")) {
        if (!data.metadata?.email) {
          throw new Error("Email is required");
        }

        const credentialsType = provider.includes("international")
          ? "INT"
          : "RUB";
        result = await this.service.payselection({
          credentialsType,
          entity,
          action: "create",
          email: data.metadata.email,
        });
      } else if (provider === "cloudpayments") {
        if (!data.metadata?.email) {
          throw new Error("Email is required");
        }

        result = await this.service.cloudpayments({
          entity,
          action: "create",
          currency: currency.slug,
          email: data.metadata.email,
          metadata: data.metadata,
        });
      } else if (provider === "tiptoppay") {
        if (!data.metadata?.email) {
          throw new Error("Email is required");
        }

        result = await this.service.tiptoppay({
          entity,
          action: "create",
          currency: currency.slug,
          email: data.metadata.email,
          metadata: data.metadata,
        });
      } else if (provider === "dummy") {
        result = await this.service.dummy({
          entity,
          action: "create",
        });

        setTimeout(async () => {
          if (!RBAC_SECRET_KEY) {
            return;
          }

          fetch(
            API_SERVICE_URL + "/api/billing/payment-intents/dummy/webhook",
            {
              credentials: "include",
              method: "POST",
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                data: {
                  id: result.id,
                },
              }),
              next: {
                cache: "no-store",
              },
            } as NextRequestOptions,
          )
            .then(async (res) => {
              return res.json();
            })
            .catch((error) => {
              logger.error("Error:", error);
            });
        }, 10000);
      } else if (provider === "paykeeper") {
        result = await this.service.paykeeper({
          entity,
          action: "create",
          email: data.metadata.email,
          currency: currency.slug,
          metadata: data.metadata,
        });
      }

      return c.json(
        {
          data: result,
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
