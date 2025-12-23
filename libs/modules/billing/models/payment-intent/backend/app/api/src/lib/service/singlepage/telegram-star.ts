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

      const telegramInvoice = await this.getInvoiceStatus(
        props.data.telegram_payment_charge_id,
      );

      console.log("🚀 ~ proceed ~ telegramInvoice:", telegramInvoice);

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

  async getInvoiceStatus(invoiceId: string) {
    if (!TELEGRAM_SERVICE_BOT_TOKEN) {
      throw new Error(
        "Configuration error. TELEGRAM_SERVICE_BOT_TOKEN secret key not found",
      );
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_SERVICE_BOT_TOKEN}/getInvoice?invoice_id=${invoiceId}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }

    return data;
  }
}
