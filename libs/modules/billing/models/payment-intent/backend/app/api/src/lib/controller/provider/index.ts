import {
  HOST_URL,
  NextRequestOptions,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { api as billingCurrencyApi } from "@sps/billing/models/currency/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC secret key not found",
        });
      }

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new HTTPException(400, {
          message: "Invalid id",
        });
      }

      const body = await c.req.parseBody();
      const provider = c.req.param("provider");

      if (typeof body["data"] !== "string") {
        throw new HTTPException(400, {
          message: "Invalid data",
        });
      }

      const entity = await this.service.findById({ id: uuid });

      const data = JSON.parse(body["data"]);

      if (!data) {
        throw new HTTPException(400, {
          message: "Invalid data",
        });
      }

      console.log("🚀 ~ provider ~ provider:", provider);
      console.log("🚀 ~ provider ~ data:", data);

      if (!entity) {
        throw new HTTPException(400, {
          message: "Payment intent not found",
        });
      }

      if (!data.currencyId) {
        throw new HTTPException(400, {
          message: "Currency is required",
        });
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
        throw new HTTPException(400, {
          message: "Currency not found",
        });
      }

      console.log("🚀 ~ provider ~ currency:", currency);

      let result: any;

      if (provider === "stripe") {
        if (!data.metadata?.email) {
          throw new HTTPException(400, {
            message: "Email is required",
          });
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
          throw new HTTPException(400, {
            message: "Email is required",
          });
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
          throw new HTTPException(400, {
            message: "Email is required",
          });
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
          throw new HTTPException(400, {
            message: "Email is required",
          });
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
          throw new HTTPException(400, {
            message: "Email is required",
          });
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

          fetch(HOST_URL + "/api/billing/payment-intents/dummy/webhook", {
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
          } as NextRequestOptions)
            .then(async (res) => {
              return res.json();
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        }, 10000);
      }

      return c.json(
        {
          data: result,
        },
        201,
      );
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
