import {
  CLOUDPAYMENTS_API_SECRET,
  CLOUDPAYMENTS_PUBLIC_ID,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../service";
import { api as paymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";

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

      if (!entity) {
        throw new HTTPException(400, {
          message: "Not found",
        });
      }

      if (entity.status === "succeeded") {
        return c.json({
          data: entity,
        });
      }

      const paymentIntentsToInvoices = await paymentIntentsToInvoicesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "paymentIntentId",
                method: "eq",
                value: uuid,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!paymentIntentsToInvoices?.length) {
        throw new HTTPException(400, {
          message: "Payment intents to invoices not found",
        });
      }

      const invoices = await invoiceApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: paymentIntentsToInvoices.map((item) => item.invoiceId),
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (invoices?.length) {
        for (const invoice of invoices) {
          if (invoice.provider === "cloudpayments") {
            if (!CLOUDPAYMENTS_PUBLIC_ID || !CLOUDPAYMENTS_API_SECRET) {
              throw new HTTPException(400, {
                message: "Cloudpayments credentials not found",
              });
            }

            if (!invoice.providerId) {
              throw new HTTPException(400, {
                message: "Cloudpayments invoice id not found",
              });
            }

            const paymentsList = await fetch(
              "https://api.cloudpayments.ru/payments/list",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Basic ${Buffer.from(`${CLOUDPAYMENTS_PUBLIC_ID}:${CLOUDPAYMENTS_API_SECRET}`).toString("base64")}`,
                },
                body: JSON.stringify({
                  Date: new Date(invoice.createdAt).toISOString().split("T")[0],
                }),
              },
            ).then((res) => res.json());

            let matchedTransaction: {
              ReasonCode: number;
              PublicId: string;
              TerminalUrl: string;
              TransactionId: number;
              Amount: number;
              Currency: string;
              CurrencyCode: number;
              PaymentAmount: number;
              PaymentCurrency: string;
              PaymentCurrencyCode: number;
              InvoiceId: string;
              AccountId: string;
              Email: string;
              Description: string;
              JsonData: string;
              CreatedDate: string;
              PayoutDate: string;
              PayoutDateIso: string;
              PayoutAmount: number;
              CreatedDateIso: string;
              AuthDate: string;
              AuthDateIso: string;
              ConfirmDate: string;
              ConfirmDateIso: string;
              AuthCode: string;
              TestMode: boolean;
              Rrn: string;
              OriginalTransactionId: string;
              FallBackScenarioDeclinedTransactionId: string;
              IpAddress: string;
              IpCountry: string;
              IpCity: string;
              IpRegion: string;
              IpDistrict: string;
              IpLatitude: number;
              IpLongitude: number;
              CardFirstSix: string;
              CardLastFour: string;
              CardExpDate: string;
              CardType: string;
              CardProduct: string;
              CardCategory: string;
              EscrowAccumulationId: string;
              IssuerBankCountry: string;
              Issuer: string;
              CardTypeCode: number;
              Status: string;
              StatusCode: number;
              CultureName: string;
              Reason: string;
              CardHolderMessage: string;
              Type: number;
              Refunded: boolean;
              Name: string;
              Token: string;
              SubscriptionId: string;
              GatewayName: string;
              ApplePay: boolean;
              AndroidPay: boolean;
              WalletType: string;
              TotalFee: number;
              IsLocalOrder: boolean;
              Gateway: number;
              MasterPass: boolean;
              InfoShopData: string;
              Receiver: string;
              Splits: string;
            } | null = null;
            if (paymentsList.Model?.length) {
              matchedTransaction = paymentsList.Model.find((tx: any) => {
                const jsonData = JSON.parse(tx.JsonData);
                const invoiceId = jsonData.invoiceId;

                return invoiceId === invoice.id;
              });
            }

            if (matchedTransaction) {
              await invoiceApi.update({
                id: invoice.id,
                data: {
                  ...invoice,
                  amount: matchedTransaction.Amount,
                  status: "paid",
                },
                options: {
                  headers: {
                    "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  },
                },
              });

              await this.service.updatePaymentIntentStatus({
                invoice,
              });
            }

            return c.json({
              data: entity,
            });
          }
        }
      }

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
