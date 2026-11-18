import {
  API_SERVICE_URL,
  NextRequestOptions,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import type { Service as PaymentIntent } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service";
import { api } from "@sps/billing/models/payment-intent/sdk/server";
import { logger, providerMinorUnits } from "@sps/backend-utils";
import { orderPaymentIntentsRoute } from "@sps/rbac/models/subject/sdk/model";
import { paymentProviderPrecision } from "@sps/billing/models/payment-intent/sdk/model";
import { api as paymentIntentsToCurrenciesApi } from "@sps/billing/relations/payment-intents-to-currencies/sdk/server";

interface IDispatchData {
  currencyId?: string;
  metadata?: Record<string, unknown>;
}

export class Service {
  constructor(private readonly service: PaymentIntent) {}

  async execute(id: string, provider: string, data: IDispatchData) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }
    const entity = await this.service.findById({ id });
    if (!entity) {
      throw new Error("Not Found error. Payment intent not found");
    }
    const durableDispatch =
      entity.checkoutDispatchState && entity.checkoutDispatchState !== "legacy";
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
      throw new Error(`Validation error. Provider ${provider} is not allowed`);
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
            entry.status === "paid" ||
            (["open", "draft"].includes(entry.status) && entry.paymentUrl),
        );
        if (invoice) {
          return invoice;
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
      return this.publicResult(paidIntent);
    }

    const email =
      typeof data.metadata?.email === "string" ? data.metadata.email : "";
    const account =
      typeof data.metadata?.account === "string" ? data.metadata.account : "";
    if (provider !== "dummy" && provider !== "telegram-star" && !email) {
      throw new Error("Validation error. Email is required");
    }
    if (provider === "telegram-star" && !account) {
      throw new Error("Validation error. Telegram account is required");
    }
    const metadata = { ...data.metadata, paymentIntentId: entity.id };
    if (
      entity.type === "subscription" &&
      (["0xprocessing", "paykeeper", "telegram-star"].includes(provider) ||
        provider.includes("payselection"))
    ) {
      await api.update({
        id: entity.id,
        data: { type: "one_off" },
        options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY } },
      });
    }

    if (provider === "stripe") {
      result = await this.service.stripe({
        entity,
        action: "create",
        email,
        currency: currency.slug,
        metadata: {
          email,
          paymentIntentId: id,
        },
      });
    } else if (provider === "0xprocessing") {
      result = await this.service.OxProcessing({
        action: "create",
        email,
        metadata: {
          paymentIntentId: id,
        },
        entity,
      });
    } else if (provider.includes("payselection")) {
      const credentialsType = provider.includes("international")
        ? "INT"
        : "RUB";
      result = await this.service.payselection({
        credentialsType,
        entity,
        action: "create",
        email,
      });
    } else if (provider === "cloudpayments") {
      result = await this.service.cloudpayments({
        entity,
        action: "create",
        currency: currency.slug,
        email,
        metadata,
      });
    } else if (provider === "tiptoppay") {
      result = await this.service.tiptoppay({
        entity,
        action: "create",
        currency: currency.slug,
        email,
        metadata,
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

        fetch(`${API_SERVICE_URL}${orderPaymentIntentsRoute}/dummy/webhook`, {
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
        } as Partial<NextRequestOptions>)
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
        email,
        currency: currency.slug,
        metadata,
      });
    } else if (provider === "telegram-star") {
      result = await this.service.telegramStar({
        entity,
        action: "create",
        currency: currency.slug,
        account,
        metadata,
      });
    }

    if (durableDispatch) {
      await this.service.markCheckoutExposed({ id: entity.id });
    }
    return this.publicResult(result);
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
