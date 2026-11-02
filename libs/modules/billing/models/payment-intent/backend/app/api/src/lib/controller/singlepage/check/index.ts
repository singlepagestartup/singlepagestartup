import {
  CLOUDPAYMENTS_API_SECRET,
  CLOUDPAYMENTS_PUBLIC_ID,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export const PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS = 5 * 60 * 1000;

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC secret key not found");
      }

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new Error("Validation error. Invalid id");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Validation error. Invalid data");
      }

      const entity = await this.service.findById({ id: uuid });

      const data = JSON.parse(body["data"]);

      if (!data) {
        throw new Error("Validation error. Invalid data");
      }

      if (!entity) {
        throw new Error("Not Found error. Not found");
      }

      if (["succeeded", "failed", "canceled"].includes(entity.status)) {
        return c.json({
          data: entity,
        });
      }

      const paymentIntentsToInvoices =
        await this.service.billingModule.paymentIntentsToInvoices.find({
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
        });

      if (!paymentIntentsToInvoices?.length) {
        const updatedAt = new Date(
          entity.updatedAt ?? entity.createdAt,
        ).getTime();
        const initializationExpired =
          updatedAt <
          Date.now() - PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS;

        if (initializationExpired) {
          const failedEntity =
            await this.service.failUninitializedPaymentIntent(
              entity.id,
              new Date(
                Date.now() - PAYMENT_INTENT_INITIALIZATION_GRACE_PERIOD_MS,
              ),
            );

          return c.json({
            data: failedEntity,
          });
        }

        return c.json({
          data: entity,
        });
      }

      const invoices = await this.service.billingModule.invoice.find({
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
      });

      if (invoices?.length) {
        for (const invoice of invoices) {
          if (invoice.provider === "cloudpayments") {
            if (!CLOUDPAYMENTS_PUBLIC_ID || !CLOUDPAYMENTS_API_SECRET) {
              throw new Error(
                "Not Found error. Cloudpayments credentials not found",
              );
            }

            if (!invoice.providerId) {
              throw new Error(
                "Not Found error. Cloudpayments invoice id not found",
              );
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
                if (tx.Status !== "Completed" || tx.Type !== 0 || tx.Refunded)
                  return false;
                try {
                  const jsonData =
                    typeof tx.JsonData === "string"
                      ? JSON.parse(tx.JsonData)
                      : tx.JsonData;
                  return jsonData?.invoiceId === invoice.id;
                } catch {
                  return false;
                }
              });
            }

            if (
              matchedTransaction?.Status === "Completed" &&
              matchedTransaction.Type === 0 &&
              !matchedTransaction.Refunded
            ) {
              await this.service.settlePayment({
                invoiceId: invoice.id,
                provider: "cloudpayments",
                providerId: invoice.providerId,
                amount: Number(matchedTransaction.Amount),
              });
            } else {
              await this.service.expireInvoice({
                invoiceId: invoice.id,
                provider: "cloudpayments",
                expiresBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
              });
            }
            return c.json({
              data: await this.service.findById({ id: entity.id }),
            });
          }

          await this.service.expireInvoice({
            invoiceId: invoice.id,
            provider: invoice.provider,
            expiresBefore: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          });
        }
      }

      return c.json({
        data: await this.service.findById({ id: entity.id }),
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
