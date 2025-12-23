import "reflect-metadata";
import { injectable } from "inversify";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";
import { RBAC_SECRET_KEY, TELEGRAM_SERVICE_BOT_TOKEN } from "@sps/shared-utils";
import { api as paymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import { Bot } from "grammy";

export type IServiceProceedProps =
  | {
      entity: (typeof Table)["$inferSelect"];
      action: "create";
      account: string;
      currency: string;
      metadata: {
        paymentIntentId: string;
      };
    }
  | {
      action: "webhook";
      data: {
        currency: string;
        total_amount: number;
        invoice_payload: string;
        telegram_payment_charge_id: string;
        provider_payment_charge_id: string;
      };
      callback: ({
        invoice,
      }: {
        invoice: IInvoice;
      }) => Promise<{ ok: boolean }>;
    };

@injectable()
export class Service {
  constructor() {}

  async proceed(props: IServiceProceedProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not found");
    }

    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN secret key not found",
      );
    }

    if (props.action === "create") {
      let invoice = await invoiceApi.create({
        data: {
          amount: props.entity.amount,
          status: "open",
          provider: "telegram-star",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const bot = new Bot(TELEGRAM_SERVICE_BOT_TOKEN);
      await bot.api.sendInvoice(
        props.account,
        "Invoice created",
        "Pay invoice to get the target good",
        invoice.id,
        "XTR",
        [{ label: "Star", amount: props.entity.amount }],
      );

      await paymentIntentsToInvoicesApi.create({
        data: {
          paymentIntentId: props.entity.id,
          invoiceId: invoice.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      return invoice;
    } else {
      const invoices = await invoiceApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: props.data.invoice_payload,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

      if (!invoices?.length) {
        throw new Error("Not Found error. Invoice not found");
      }

      if (invoices.length > 1) {
        throw new Error("Validation error. Multiple invoices found");
      }

      await this.verifyTelegramStarPayment({
        invoicePayload: props.data.invoice_payload,
        telegramPaymentChargeId: props.data.telegram_payment_charge_id,
        providerPaymentChargeId: props.data.provider_payment_charge_id,
        totalAmount: props.data.total_amount,
      });

      const invoice = await invoiceApi.update({
        id: invoices[0].id,
        data: {
          ...invoices[0],
          providerId: props.data.telegram_payment_charge_id,
          amount: props.data.total_amount,
          status: "paid",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!invoice) {
        throw new Error("Not Found error. Invoice not found");
      }

      await props.callback({ invoice });

      return { code: 0 };
    }
  }

  private async fetchRecentStarTransactions(limit = 100): Promise<
    Array<{
      id?: string;
      telegram_payment_charge_id?: string;
      telegramPaymentChargeId?: string;
      provider_payment_charge_id?: string;
      providerPaymentChargeId?: string;
      total_amount?: number;
      amount?: number;
      stars?: number;
      value?: { amount?: number };
      purpose?: {
        invoice_payload?: string;
        payload?: string;
        total_amount?: number;
      };
      source?: {
        transaction_type?: string;
        type?: string;
        invoice_payload?: string;
        payload?: string;
        user?: { id?: number };
      };
      transaction?: {
        purpose?: {
          invoice_payload?: string;
          payload?: string;
        };
      };
    }>
  > {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN secret key not found",
      );
    }

    const url = new URL(
      `https://api.telegram.org/bot${TELEGRAM_SERVICE_BOT_TOKEN}/getStarTransactions`,
    );
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok || !data?.ok) {
      const description = data?.description || response.statusText;
      throw new Error(
        `Telegram API error (getStarTransactions): ${description}`,
      );
    }

    const result = (data.result ?? {}) as unknown;
    const transactions =
      (result as { transactions?: unknown }).transactions ?? result;
    if (!Array.isArray(transactions)) {
      return [];
    }

    return transactions as Array<{
      id?: string;
      telegram_payment_charge_id?: string;
      telegramPaymentChargeId?: string;
      provider_payment_charge_id?: string;
      providerPaymentChargeId?: string;
      total_amount?: number;
      amount?: number;
      stars?: number;
      value?: { amount?: number };
      purpose?: {
        invoice_payload?: string;
        payload?: string;
        total_amount?: number;
      };
      source?: {
        transaction_type?: string;
        type?: string;
        invoice_payload?: string;
        payload?: string;
        user?: { id?: number };
      };
      transaction?: {
        purpose?: {
          invoice_payload?: string;
          payload?: string;
        };
      };
    }>;
  }

  private async verifyTelegramStarPayment(props: {
    invoicePayload: string;
    telegramPaymentChargeId?: string;
    providerPaymentChargeId?: string;
    totalAmount?: number;
  }): Promise<void> {
    const transactions = await this.fetchRecentStarTransactions(100);

    const matched = transactions.find((tx) => {
      const purpose = (tx?.purpose ?? tx?.transaction?.purpose ?? {}) as {
        invoice_payload?: string;
        payload?: string;
        total_amount?: number;
      };
      const payloadCandidates = [
        purpose?.invoice_payload,
        purpose?.payload,
        tx?.source?.invoice_payload,
        tx?.source?.payload,
      ].filter((v) => typeof v === "string");
      const purposePayload = payloadCandidates[0];

      const tpci =
        tx?.telegram_payment_charge_id ?? tx?.telegramPaymentChargeId ?? tx?.id;
      const ppci =
        tx?.provider_payment_charge_id ?? tx?.providerPaymentChargeId;

      const amounts = [
        tx?.total_amount,
        tx?.amount,
        tx?.stars,
        tx?.value?.amount,
        purpose?.total_amount,
      ].filter((v) => typeof v === "number");

      const amountMatches =
        !props.totalAmount ||
        amounts.some((v) => Number(v) === Number(props.totalAmount));

      const payloadMatches = purposePayload === props.invoicePayload;
      const tpciMatches =
        !!props.telegramPaymentChargeId &&
        tpci === props.telegramPaymentChargeId;
      const ppciMatches =
        !!props.providerPaymentChargeId &&
        ppci === props.providerPaymentChargeId;

      return amountMatches && (payloadMatches || tpciMatches || ppciMatches);
    });

    if (!matched) {
      throw new Error(
        "Telegram verification failed: matching Star transaction not found",
      );
    }
  }
}
