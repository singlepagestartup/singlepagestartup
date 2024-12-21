import "reflect-metadata";
import { injectable } from "inversify";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";
import {
  RBAC_SECRET_KEY,
  HOST_URL,
  TIPTOPPAY_PUBLIC_ID,
  TIPTOPPAY_API_SECRET,
} from "@sps/shared-utils";
import { api as paymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import * as crypto from "crypto";

export type IServiceProceedProps =
  | {
      entity: (typeof Table)["$inferSelect"];
      action: "create";
      email: string;
      currency: string;
      metadata: {
        paymentIntentId: string;
      };
    }
  | {
      action: "webhook";
      data: {
        TransactionId: string;
        Amount: number;
        Currency: "KZT";
        PaymentAmount: string;
        PaymentCurrency: "KZT";
        DateTime: string;
        CardId?: string;
        CardFirstSix?: string;
        CardLastFour?: string;
        CardType: "Visa" | "Mastercard" | "Maestro";
        CardExpDate: string;
        TestMode: boolean;
        Status: "Authorized" | "Completed";
        OperationType: "Payment" | "CardPayout";
        GatewayName?: string;
        InvoiceId?: string;
        AccountId?: string;
        SubscriptionId?: string;
        CustomFields: any;
        Data: string;
      };
      rawBody: string;
      headers: {
        "x-content-hmac": string;
        "content-hmac": string;
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
      throw new Error("RBAC secret key not found");
    }

    if (!TIPTOPPAY_PUBLIC_ID) {
      throw new Error("Tiptoppay public id not found");
    }

    if (!TIPTOPPAY_API_SECRET) {
      throw new Error("Tiptoppay API secret not found");
    }

    if (props.action === "create") {
      let invoice = await invoiceApi.create({
        data: {
          amount: props.entity.amount,
          status: "open",
          successUrl: HOST_URL,
          cancelUrl: HOST_URL,
          provider: "tiptoppay",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      const checkoutData: {
        Amount: number;
        Currency: "KZT";
        Description: string;
        Email: string;
        RequireConfirmation?: boolean;
        SendEmail?: boolean;
        InvoiceId?: string;
        AccountId?: string;
        OfferUri?: string;
        Phone?: string;
        SendSms?: boolean;
        SendViber?: boolean;
        CultureName?: "ru-RU" | "en-US";
        SubscriptionBehavior?: "CreateWeekly" | "CreateMonthly";
        SuccessRedirectUrl?: string;
        FailRedirectUrl?: string;
        JsonData?: any;
      } = {
        Amount: props.entity.amount,
        Currency: props.currency.toUpperCase() as "KZT",
        Description: `Checkout invoice id: ${props.entity.id}`,
        Email: props.email,
        JsonData: { ...props.metadata, invoiceId: invoice.id },
      };

      const checkout: {
        Model: {
          Id: string;
          Number: number;
          Amount: number;
          Currency: (typeof checkoutData)["Currency"];
          CurrencyCode: number;
          Email: (typeof checkoutData)["Email"];
          Phone: (typeof checkoutData)["Phone"];
          Description: (typeof checkoutData)["Description"];
          RequireConfirmation: (typeof checkoutData)["RequireConfirmation"];
          Url: string;
          CultureName: (typeof checkoutData)["CultureName"];
          CreatedDate: string;
          CreatedDateIso: string;
          PaymentDate: null;
          PaymentDateIso: null;
          StatusCode: number;
          Status: string;
          InternalId: number;
        };
        Success: boolean;
        Message: null;
      } = await fetch("https://api.tiptoppay.kz/orders/create", {
        method: "POST",
        body: JSON.stringify(checkoutData),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${TIPTOPPAY_PUBLIC_ID}:${TIPTOPPAY_API_SECRET}`).toString("base64")}`,
        },
      }).then((res) => res.json());

      console.log(`🚀 ~ checkout:`, checkout);

      invoice = await invoiceApi.update({
        id: invoice.id,
        data: {
          ...invoice,
          providerId: `${checkout.Model.InternalId}`,
          paymentUrl: checkout.Model.Url,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      await paymentIntentsToInvoicesApi.create({
        data: {
          paymentIntentId: props.entity.id,
          invoiceId: invoice.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      return invoice;
    } else {
      const parsedData:
        | {
            orderId: string;
            invoiceId: string;
          }
        | undefined = JSON.parse(props.data?.Data);

      if (!parsedData) {
        throw new Error("Data in transaction not found");
      }

      const invoices = await invoiceApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: parsedData.invoiceId,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!invoices?.length) {
        throw new Error("Invoice not found");
      }

      if (invoices.length > 1) {
        throw new Error("Multiple invoices found");
      }

      let invoice = invoices[0];

      const signature = crypto
        .createHmac("sha256", TIPTOPPAY_API_SECRET)
        .update(props.rawBody)
        .digest("base64");

      if (signature !== props.headers["content-hmac"]) {
        throw new Error("Signature mismatch");
      }

      if (props.data.Status === "Completed") {
        invoice = await invoiceApi.update({
          id: invoice.id,
          data: {
            ...invoice,
            amount: parseInt(props.data.PaymentAmount),
            status: "paid",
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
            next: {
              cache: "no-store",
            },
          },
        });

        if (!invoice) {
          throw new Error("Invoice not found");
        }

        await props.callback({ invoice });
      }

      return { code: 0 };
    }
  }
}
