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

// Интерфейс для metadata
interface IMetadata {
  ecommerceModule?: {
    orders?: Array<{
      id: string;
      ordersToProducts?: Array<{
        id: string;
        quantity: number;
        products?: Array<{
          id: string;
          title?: {
            [key: string]: string;
          };
          adminTitle?: string;
          productsToAttributes?: Array<{
            attributes?: Array<{
              number?: string;
              attributesKeysToAttributes?: Array<{
                attributeKey?: {
                  type?: string;
                  field?: string;
                };
              }>;
            }>;
            attributesToBillingModuleCurrencies?: Array<{
              id: string;
              billingModuleCurrencyId: string;
              attributeId: string;
              billingModuleCurrency?: {
                id?: string;
                slug?: string;
                symbol?: string;
              };
            }>;
          }>;
        }>;
      }>;
    }>;
  };
  clientPhone?: string;
  serviceName?: string;
}

export interface IPayKeeperTokenResponse {
  token: string;
}

export interface IPayKeeperCartItem {
  name: string;
  price: number;
  quantity: number;
  sum: number;
  tax:
    | "none"
    | "vat0"
    | "vat5"
    | "vat7"
    | "vat10"
    | "vat20"
    | "vat105"
    | "vat107"
    | "vat110"
    | "vat120";
  item_type?:
    | "goods"
    | "service"
    | "work"
    | "excise"
    | "ip"
    | "payment"
    | "agent"
    | "property_right"
    | "non_operating"
    | "sales_tax"
    | "resort_fee"
    | "other"
    | "exc_uncoded"
    | "exc_coded"
    | "goods_uncoded"
    | "goods_coded";
  payment_type?:
    | "prepay"
    | "part_prepay"
    | "advance"
    | "full"
    | "part_credit"
    | "credit"
    | "credit_payment";
  item_id?: string;
  item_code?: string;
  item_code_b64?: string;
  items_in_package?: number;
  items_sold_from_package?: number;
  measure?: string;
  item_country?: string;
  customs_declaration?: string;
  excise?: number;
  industry_attribute?: Array<{
    [key: string]: string | number | boolean;
  }>;
  item_code_validated?: boolean;
  agent?: {
    [key: string]: string | number | boolean;
  };
  supplier?: {
    [key: string]: string | number | boolean;
  };
}

export interface IPayKeeperServiceName {
  cart?: string; // JSON-строка с массивом товаров
  receipt_properties?: string; // JSON-строка с дополнительными свойствами чека
  lang?: "ru" | "en";
  user_result_callback?: string;
  service_name?: string;
}

export interface IPayKeeperPaymentData {
  pay_amount: number;
  clientid?: string;
  orderid: string;
  client_email: string;
  client_phone?: string;
  expiry?: string;
  token: string;
  service_name?: string | IPayKeeperServiceName; // Может быть строкой или JSON-объектом
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
      throw new Error("Configuration error. Paykeeper API login not found");
    }

    if (!PAYKEEPER_API_PASSWORD) {
      throw new Error("Configuration error. Paykeeper API password not found");
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
      console.log("Failed to get PayKeeper security token:", error);
      throw new Error(`Failed to get security token: ${error}`);
    }
  }

  private async getInvoiceData(
    invoiceId: string,
  ): Promise<IPayKeeperInvoiceData> {
    try {
      console.log("🚀 ~ Getting invoice data for ID:", invoiceId);

      const authHeaders = await this.authHeaders();
      console.log("🚀 ~ Auth headers:", authHeaders);

      const requestUrl = `${PAYKEEPER_BASE_URL}/info/invoice/byid/?id=${invoiceId}`;
      console.log("🚀 ~ Request URL:", requestUrl);

      const response = await fetch(requestUrl, {
        method: "GET",
        headers: authHeaders,
      });

      console.log("🚀 ~ PayKeeper response status:", response.status);
      console.log(
        "🚀 ~ PayKeeper response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("🚀 ~ PayKeeper error response:", errorText);
        throw new Error(
          `PayKeeper invoice request failed: ${response.status} ${response.statusText}. Response: ${errorText}`,
        );
      }

      const responseText = await response.text();
      console.log("🚀 ~ PayKeeper raw response:", responseText);

      let invoiceResponse: IPayKeeperInvoiceData;
      try {
        invoiceResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.log("🚀 ~ Failed to parse PayKeeper response:", parseError);
        throw new Error(`Failed to parse PayKeeper response: ${responseText}`);
      }

      console.log("🚀 ~ Parsed invoice response:", invoiceResponse);

      if (!invoiceResponse) {
        throw new Error("PayKeeper did not return invoice data");
      }

      return invoiceResponse;
    } catch (error) {
      console.log("Failed to get PayKeeper invoice data:", error);
      throw new Error(`Failed to get invoice data: ${error}`);
    }
  }

  async proceed(props: IServiceProceedProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC secret key not found");
    }

    if (!PAYKEEPER_BASE_URL) {
      throw new Error("Configuration error. Paykeeper base url not found");
    }

    if (!PAYKEEPER_API_LOGIN) {
      throw new Error("Configuration error. Paykeeper API login not found");
    }

    if (!PAYKEEPER_API_PASSWORD) {
      throw new Error("Configuration error. Paykeeper API password not found");
    }

    if (!PAYKEEPER_WEBHOOK_SECRET) {
      throw new Error(
        "Configuration error. Paykeeper webhook secret not found",
      );
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
        orderid: props.entity.id,
        client_phone: props.metadata.clientPhone,
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        service_name: {
          cart: JSON.stringify(this.buildCartFromMetadata(props.metadata)),
          service_name:
            props.metadata.serviceName || "SinglePageStartup Payment",
          lang: "ru",
        },
      };

      console.log("🚀 ~ proceed ~ paymentData:", paymentData);

      try {
        const securityToken = await this.getSecurityToken();

        const formData = new URLSearchParams();

        Object.entries(paymentData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === "service_name" && typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
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
          throw new Error("Not Found error. Invoice not found");
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
        console.log("PayKeeper invoice creation error:", error);
        throw error;
      }
    } else {
      const { data } = props;
      console.log("🚀 ~ proceed ~ props:", props);

      try {
        console.log("🚀 ~ Processing webhook for orderid:", data.orderid);
        console.log("🚀 ~ Webhook data:", data);
        console.log("🚀 ~ Webhook data.id (PayKeeper invoice ID):", data.id);

        const paymentIntentToInvoice = await paymentIntentsToInvoicesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "paymentIntentId",
                  method: "eq",
                  value: data.orderid,
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

        if (!paymentIntentToInvoice || paymentIntentToInvoice.length === 0) {
          throw new Error(
            `Not Found error. Payment intent to invoice relation not found for payment-intent ID: ${data.orderid}`,
          );
        }

        let invoice = await invoiceApi.findById({
          id: paymentIntentToInvoice[0].invoiceId,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (!invoice) {
          throw new Error(
            `Not Found error. Invoice not found for ID: ${paymentIntentToInvoice[0].invoiceId}`,
          );
        }

        console.log("🚀 ~ Found invoice for webhook:", invoice);
        console.log("🚀 ~ Invoice providerId:", invoice.providerId);

        if (!invoice.providerId) {
          throw new Error(
            "Not Found error. Invoice providerId not found - cannot get PayKeeper invoice data",
          );
        }

        console.log(
          "🚀 ~ Getting PayKeeper invoice data for providerId:",
          invoice.providerId,
        );
        const paykeeperInvoiceData = await this.getInvoiceData(
          invoice.providerId,
        );
        console.log("🚀 ~ PayKeeper invoice data:", paykeeperInvoiceData);
        console.log(
          "🚀 ~ PayKeeper invoice status:",
          paykeeperInvoiceData?.status,
        );

        if (!paykeeperInvoiceData) {
          throw new Error("Failed to get invoice data from PayKeeper");
        }

        if (paykeeperInvoiceData.status === "paid") {
          invoice = await invoiceApi.update({
            id: invoice.id,
            data: {
              ...invoice,
              amount: parseInt(paykeeperInvoiceData.pay_amount),
              status: "paid",
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        }

        console.log(
          "🚀 ~ PayKeeper invoice status:",
          paykeeperInvoiceData.status,
        );

        const result = await props.callback({ invoice });

        if (!result.ok) {
          throw new Error("Failed to update payment intent status");
        }

        console.log("🚀 ~ Payment intent status updated successfully");
        return { ok: true };
      } catch (error) {
        console.log("Webhook processing error:", error);
        throw error;
      }
    }
  }

  private buildCartFromMetadata(metadata: IMetadata) {
    const cartItems: Array<{
      name: string;
      price: number;
      quantity: number;
      sum: number;
      tax: string;
      item_type: string;
      payment_type: string;
    }> = [];

    if (!metadata?.ecommerceModule?.orders) {
      return cartItems;
    }

    for (const order of metadata.ecommerceModule.orders) {
      if (!order.ordersToProducts) {
        continue;
      }

      for (const orderToProduct of order.ordersToProducts) {
        if (!orderToProduct.products) {
          continue;
        }

        for (const product of orderToProduct.products) {
          const rubProductCurrency = product.productsToAttributes?.filter(
            (productToAttribute) => {
              return productToAttribute.attributesToBillingModuleCurrencies?.find(
                (attributeToBillingModuleCurrency) => {
                  console.log(
                    "🚀 ~ buildCartFromMetadata ~ attributeToBillingModuleCurrency:",
                    attributeToBillingModuleCurrency,
                  );

                  return (
                    attributeToBillingModuleCurrency?.billingModuleCurrency
                      ?.slug === "rub"
                  );
                },
              );
            },
          );

          if (!rubProductCurrency) {
            continue;
          }

          const productName = this.getProductName(product);
          const productPrice = this.getProductPrice(product);
          const quantity = orderToProduct.quantity || 1;

          cartItems.push({
            name: productName,
            price: Math.round(productPrice),
            quantity: quantity,
            sum: Math.round(productPrice * quantity),
            tax: "none",
            item_type: "goods",
            payment_type: "full",
          });
        }
      }
    }

    return cartItems;
  }

  private getProductName(product: {
    title?: { [key: string]: string };
    adminTitle?: string;
  }): string {
    if (product.title?.ru) {
      return product.title.ru;
    }
    if (product.title?.en) {
      return product.title.en;
    }
    if (product.adminTitle) {
      return product.adminTitle;
    }
    return "Товар";
  }

  private getProductPrice(product: {
    productsToAttributes?: Array<{
      attributes?: Array<{
        number?: string;
        attributesKeysToAttributes?: Array<{
          attributeKey?: {
            type?: string;
            field?: string;
          };
        }>;
      }>;
    }>;
  }): number {
    if (!product.productsToAttributes) {
      return 0;
    }

    for (const productToAttribute of product.productsToAttributes) {
      if (!productToAttribute.attributes) continue;

      for (const attribute of productToAttribute.attributes) {
        if (!attribute.attributesKeysToAttributes) continue;

        for (const attributeKeyToAttribute of attribute.attributesKeysToAttributes) {
          const attributeKey = attributeKeyToAttribute.attributeKey;

          if (
            attributeKey?.type === "price" &&
            attributeKey?.field === "number"
          ) {
            const priceValue = parseFloat(attribute.number || "0");
            return priceValue;
          }
        }
      }
    }

    return 0;
  }
}
