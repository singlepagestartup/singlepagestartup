import "reflect-metadata";
import { injectable } from "inversify";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";
import {
  RBAC_SECRET_KEY,
  NEXT_PUBLIC_HOST_SERVICE_URL,
  PAYKEEPER_BASE_URL,
  PAYKEEPER_API_LOGIN,
  PAYKEEPER_API_PASSWORD,
  PAYKEEPER_WEBHOOK_SECRET,
  PAYKEEPER_SUCCESS_URL,
  PAYKEEPER_FAIL_URL,
} from "@sps/shared-utils";
import { api as paymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import * as crypto from "crypto";
import { logger } from "@sps/backend-utils";

export interface IPayKeeperTokenResponse {
  token: string;
}

export interface IPayKeeperPaymentData {
  pay_amount: number;
  clientid?: string;
  orderid: string;
  service_name: string;
  client_email: string;
  client_phone?: string;
  expiry?: string;
  token: string;
}

export interface IPayKeeperPaymentResponse {
  invoice_id?: string;
  invoice_url?: string;
  invoice?: string;
  result?: string;
  msg?: string;
  error_code?: string;
}

export interface IPayKeeperWebhookData {
  id: string;
  sum: string;
  clientid: string;
  orderid: string;
  key: string;
  pk_hostname: string;
  ps_id: string;
  client_email: string;
  client_phone: string;
  service_name: string;
  fop_receipt_key: string;
  obtain_datetime: string;
}

export interface IPayKeeperInvoiceData {
  id: string;
  status: "created" | "sent" | "paid" | "expired";
  pay_amount: string;
  clientid: string;
  orderid: string;
  service_name: string;
  client_email: string;
  client_phone: string;
  expiry_datetime: string;
  created_datetime: string;
  paid_datetime: string | null;
  user_id: number;
  paymentid: string | null;
}

export type IServiceProceedProps =
  | {
      entity: (typeof Table)["$inferSelect"];
      action: "create";
      email: string;
      currency: string;
      metadata: {
        paymentIntentId: string;
        clientPhone?: string;
        serviceName?: string;
      };
    }
  | {
      action: "webhook";
      data: IPayKeeperWebhookData;
      rawBody: string;
      headers: {
        "x-content-hmac"?: string;
        "content-hmac"?: string;
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

  private async authHeaders() {
    if (!PAYKEEPER_API_LOGIN) {
      throw new Error("Paykeeper API login not found");
    }

    if (!PAYKEEPER_API_PASSWORD) {
      throw new Error("Paykeeper API password not found");
    }

    const basic = Buffer.from(
      `${PAYKEEPER_API_LOGIN}:${PAYKEEPER_API_PASSWORD}`,
    ).toString("base64");
    return {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    };
  }

  private async verifyWebhookSignature(
    data: string,
    signature: string,
  ): Promise<boolean> {
    if (!PAYKEEPER_WEBHOOK_SECRET) {
      throw new Error("Paykeeper webhook secret not found");
    }

    const expectedSignature = crypto
      .createHmac("sha256", PAYKEEPER_WEBHOOK_SECRET)
      .update(data)
      .digest("hex");

    return expectedSignature === signature;
  }

  private async getSecurityToken(): Promise<string> {
    try {
      const response = await fetch(
        `${PAYKEEPER_BASE_URL}/info/settings/token/`,
        {
          method: "GET",
          headers: await this.authHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `PayKeeper token request failed: ${response.status} ${response.statusText}`,
        );
      }

      const tokenResponse: IPayKeeperTokenResponse = await response.json();

      if (!tokenResponse.token) {
        throw new Error("PayKeeper did not return security token");
      }

      return tokenResponse.token;
    } catch (error) {
      logger.error("Failed to get PayKeeper security token:", error);
      throw new Error(`Failed to get security token: ${error}`);
    }
  }

  private async getInvoiceData(
    invoiceId: string,
  ): Promise<IPayKeeperInvoiceData> {
    try {
      const response = await fetch(
        `${PAYKEEPER_BASE_URL}/info/invoice/byid/?id=${invoiceId}`,
        {
          method: "GET",
          headers: await this.authHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          `PayKeeper invoice request failed: ${response.status} ${response.statusText}`,
        );
      }

      const invoiceResponse: IPayKeeperInvoiceData[] = await response.json();

      if (!invoiceResponse || invoiceResponse.length === 0) {
        throw new Error("PayKeeper did not return invoice data");
      }

      return invoiceResponse[0];
    } catch (error) {
      logger.error("Failed to get PayKeeper invoice data:", error);
      throw new Error(`Failed to get invoice data: ${error}`);
    }
  }

  async proceed(props: IServiceProceedProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC secret key not found");
    }

    if (!PAYKEEPER_BASE_URL) {
      throw new Error("Paykeeper base url not found");
    }

    if (!PAYKEEPER_API_LOGIN) {
      throw new Error("Paykeeper API login not found");
    }

    if (!PAYKEEPER_API_PASSWORD) {
      throw new Error("Paykeeper API password not found");
    }

    if (!PAYKEEPER_WEBHOOK_SECRET) {
      throw new Error("Paykeeper webhook secret not found");
    }

    if (props.action === "create") {
      let invoice = await invoiceApi.create({
        data: {
          amount: props.entity.amount,
          status: "open",
          successUrl: PAYKEEPER_SUCCESS_URL || NEXT_PUBLIC_HOST_SERVICE_URL,
          cancelUrl: PAYKEEPER_FAIL_URL || NEXT_PUBLIC_HOST_SERVICE_URL,
          provider: "paykeeper",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const paymentData: Omit<IPayKeeperPaymentData, "token"> = {
        pay_amount: Math.round(props.entity.amount),
        client_email: props.email,
        service_name: props.metadata.serviceName || "Оплата товаров",
        orderid: props.entity.id,
        client_phone: props.metadata.clientPhone,
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      };

      console.log("🚀 ~ proceed ~ paymentData:", paymentData);

      try {
        const securityToken = await this.getSecurityToken();

        const formData = new URLSearchParams();

        Object.entries(paymentData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        formData.append("token", securityToken);

        const response = await fetch(
          `${PAYKEEPER_BASE_URL}/change/invoice/preview/`,
          {
            method: "POST",
            headers: await this.authHeaders(),
            body: formData,
          },
        );

        if (!response.ok) {
          throw new Error(
            `PayKeeper API error: ${response.status} ${response.statusText}`,
          );
        }

        const paykeeperResponse: IPayKeeperPaymentResponse =
          await response.json();

        if (paykeeperResponse.result === "fail") {
          const errorMessage = paykeeperResponse.msg || "Unknown error";
          throw new Error(`PayKeeper invoice creation failed: ${errorMessage}`);
        }

        if (!paykeeperResponse.invoice_id || !paykeeperResponse.invoice_url) {
          throw new Error(
            "PayKeeper invoice creation failed: missing required fields",
          );
        }

        const paykeeperInvoiceId = paykeeperResponse.invoice_id;

        if (!paykeeperInvoiceId) {
          throw new Error(
            "PayKeeper invoice creation failed: missing required fields",
          );
        }

        invoice = await invoiceApi.update({
          id: invoice.id,
          data: {
            ...invoice,
            providerId: paykeeperInvoiceId,
            paymentUrl: paykeeperResponse.invoice_url,
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
      } catch (error) {
        logger.error("PayKeeper invoice creation error:", error);
        throw error;
      }
    } else {
      // Обработка webhook от PayKeeper
      const { data, rawBody, headers } = props;

      try {
        logger.debug("🚀 ~ Processing webhook for orderid:", data.orderid);
        logger.debug("🚀 ~ Webhook data:", data);

        // Ищем связь между payment-intent и invoice
        const paymentIntentToInvoice = await paymentIntentsToInvoicesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "paymentIntentId",
                  method: "eq",
                  value: data.orderid, // orderid = payment-intent ID
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

        if (!paymentIntentToInvoice || paymentIntentToInvoice.length === 0) {
          throw new Error(
            `Payment intent to invoice relation not found for payment-intent ID: ${data.orderid}`,
          );
        }

        // Получаем invoice по ID из связи
        const invoice = await invoiceApi.findById({
          id: paymentIntentToInvoice[0].invoiceId,
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
          throw new Error(
            `Invoice not found for ID: ${paymentIntentToInvoice[0].invoiceId}`,
          );
        }

        logger.debug("🚀 ~ Found invoice for webhook:", invoice);

        // Получаем актуальные данные счёта от PayKeeper
        const paykeeperInvoiceData = await this.getInvoiceData(data.id);
        logger.debug("🚀 ~ PayKeeper invoice data:", paykeeperInvoiceData);

        // Определяем статус платежа на основе данных от PayKeeper
        let paymentStatus: "success" | "fail" | "in_process";

        switch (paykeeperInvoiceData.status) {
          case "paid":
            paymentStatus = "success";
            break;
          case "expired":
            paymentStatus = "fail";
            break;
          case "created":
          case "sent":
          default:
            paymentStatus = "in_process";
            break;
        }

        logger.debug("🚀 ~ Determined payment status:", paymentStatus);
        logger.debug(
          "🚀 ~ PayKeeper invoice status:",
          paykeeperInvoiceData.status,
        );

        // Вызываем callback для обновления статуса
        const result = await props.callback({ invoice });

        if (!result.ok) {
          throw new Error("Failed to update payment intent status");
        }

        logger.debug("🚀 ~ Payment intent status updated successfully");
        return { ok: true };
      } catch (error) {
        logger.error("Webhook processing error:", error);
        throw error;
      }
    }
  }
}
