import {
  API_SERVICE_URL,
  NextRequestOptions,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { api } from "@sps/billing/models/payment-intent/sdk/server";
import {
  getHttpErrorType,
  logger,
  providerMinorUnits,
} from "@sps/backend-utils";
import { paymentProviderPrecision } from "@sps/billing/models/payment-intent/sdk/model";
import { api as paymentIntentsToCurrenciesApi } from "@sps/billing/relations/payment-intents-to-currencies/sdk/server";

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
        throw new Error("Validation error. Invalid id");
      }

      const body = await c.req.parseBody();
      const provider = c.req.param("provider");
      if (!provider) {
        throw new Error("Validation error. Invalid provider");
      }

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid data");
      }

      const entity = await this.service.findById({ id: uuid });

      let data = JSON.parse(body["data"]);

      if (!data) {
        throw new Error("Validation error. Invalid data");
      }

      if (!entity) {
        throw new Error("Not Found error. Payment intent not found");
      }

      const durableDispatch =
        entity.checkoutDispatchState &&
        entity.checkoutDispatchState !== "legacy";
      if (durableDispatch) {
        if (
          entity.checkoutProvider !== provider ||
          !entity.checkoutCurrencyId ||
          !entity.checkoutMetadata
        ) {
          throw new Error(
            "Conflict error. Payment attempt provider context does not match",
          );
        }
        data = {
          currencyId: entity.checkoutCurrencyId,
          metadata: entity.checkoutMetadata,
        };
      }
      if (!this.service.isProviderAllowed({ provider })) {
        throw new Error(
          `Validation error. Provider ${provider} is not allowed`,
        );
      }

      if (!data.currencyId) {
        throw new Error("Validation error. Currency is required");
      }

      const currency = await this.service.billingModule.currency.findById({
        id: data.currencyId,
      });

      if (!currency) {
        throw new Error("Not Found error. Currency not found");
      }
      providerMinorUnits(
        entity.amount,
        paymentProviderPrecision(provider, currency),
      );

      if (durableDispatch) {
        const claimed = await this.service.claimCheckoutDispatch({
          id: entity.id,
          provider,
        });
        if (!claimed) {
          const links =
            await this.service.billingModule.paymentIntentsToInvoices.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "paymentIntentId",
                      method: "eq",
                      value: entity.id,
                    },
                  ],
                },
              },
            });
          const invoices = await this.service.billingModule.invoice.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: links.map((link) => link.invoiceId),
                  },
                ],
              },
            },
          });
          const invoice = invoices.find(
            (entry) =>
              ["open", "draft", "paid"].includes(entry.status) &&
              entry.paymentUrl,
          );
          if (invoice) {
            return c.json({ data: invoice }, 201);
          }
          throw new Error(
            "Conflict error. Payment dispatch is already in progress or its outcome is unknown",
          );
        }
      }

      await paymentIntentsToCurrenciesApi.create({
        data: {
          paymentIntentId: entity.id,
          currencyId: currency.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      logger.debug("currency", currency);

      let result: any;

      if (entity.amount === 0) {
        const paidIntent = await this.service.settleFreePayment(
          entity.id,
          provider,
        );
        if (durableDispatch) {
          await this.service.markCheckoutExposed({ id: entity.id });
        }
        return c.json({ data: this.publicResult(paidIntent) }, 201);
      }

      if (provider === "stripe") {
        if (!data.metadata?.email) {
          throw new Error("Validation error. Email is required");
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
          throw new Error("Validation error. Email is required");
        }
        if (entity.type === "subscription") {
          await api.update({
            id: entity.id,
            data: {
              ...(this.publicResult(entity) as Record<string, unknown>),
              type: "one_off",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
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
          throw new Error("Validation error. Email is required");
        }

        if (entity.type === "subscription") {
          await api.update({
            id: entity.id,
            data: {
              ...(this.publicResult(entity) as Record<string, unknown>),
              type: "one_off",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
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
          throw new Error("Validation error. Email is required");
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
          throw new Error("Validation error. Email is required");
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
            } as Partial<NextRequestOptions>,
          )
            .then(async (res) => {
              return res.json();
            })
            .catch((error) => {
              logger.error("Error:", error);
            });
        }, 10000);
      } else if (provider === "paykeeper") {
        if (entity.type === "subscription") {
          await api.update({
            id: entity.id,
            data: {
              ...(this.publicResult(entity) as Record<string, unknown>),
              type: "one_off",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        }

        result = await this.service.paykeeper({
          entity,
          action: "create",
          email: data.metadata.email,
          currency: currency.slug,
          metadata: data.metadata,
        });
      } else if (provider === "telegram-star") {
        if (entity.type === "subscription") {
          await api.update({
            id: entity.id,
            data: {
              ...(this.publicResult(entity) as Record<string, unknown>),
              type: "one_off",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        }

        result = await this.service.telegramStar({
          entity,
          action: "create",
          currency: currency.slug,
          account: data.metadata.account,
          metadata: data.metadata,
        });
      }

      if (durableDispatch) {
        await this.service.markCheckoutExposed({ id: entity.id });
      }
      return c.json(
        {
          data: this.publicResult(result),
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
  private publicResult(result: unknown): unknown {
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      return result;
    }
    const {
      checkoutProvider,
      checkoutCurrencyId,
      checkoutMetadata,
      checkoutDispatchState,
      checkoutDispatchStartedAt,
      ...output
    } = result as Record<string, unknown>;
    return output;
  }
}
