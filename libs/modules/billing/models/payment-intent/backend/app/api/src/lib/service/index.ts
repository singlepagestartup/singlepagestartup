import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Repository } from "../repository";
import Stripe from "stripe";
import {
  STRIPE_RETURN_URL,
  O_X_PROCESSING_RETURN_URL,
  O_X_PROCESSING_SHOP_ID,
  O_X_PROCESSING_TEST_PAYMENTS,
  O_X_PROCESSING_WEBHOOK_PASSWORD,
  PAYSELECTION_RUB_PUBLIC_KEY,
  PAYSELECTION_RUB_SECRET_KEY,
  PAYSELECTION_RUB_SITE_ID,
  PAYSELECTION_RUB_SITE_NAME,
  PAYSELECTION_RUB_WEBHOOK_URL,
  RBAC_SECRET_KEY,
  STRIPE_SECRET_KEY,
  PAYSELECTION_INT_PUBLIC_KEY,
  PAYSELECTION_INT_SITE_ID,
  PAYSELECTION_INT_SECRET_KEY,
  PAYSELECTION_INT_SITE_NAME,
  PAYSELECTION_INT_WEBHOOK_URL,
  CLOUDPAYMENTS_API_SECRET,
  CLOUDPAYMENTS_PUBLIC_ID,
  HOST_URL,
} from "@sps/shared-utils";
import { api as paymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as paymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";
import * as crypto from "crypto";
// import { api as ecommerceOrdersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import {
  Service as Cloudpayments,
  IServiceProceedProps as ICloudpaymentsProceedProps,
} from "./cloudpayments";
import {
  Service as Tiptoppay,
  IServiceProceedProps as ITiptippayProceedProps,
} from "./tiptoppay";
import { logger } from "@sps/backend-utils";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }

  async updatePaymentIntentStatus(props: { invoice: IInvoice }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC secret key not found");
    }

    const paymentIntentsToInvoice = await paymentIntentsToInvoicesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "invoiceId",
              method: "eq",
              value: props.invoice.id,
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

    if (paymentIntentsToInvoice?.length) {
      const paymentIntents = await paymentIntentApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: paymentIntentsToInvoice.map(
                  (item) => item.paymentIntentId,
                ),
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

      if (paymentIntents?.length) {
        let amount = props.invoice.amount;

        for (const paymentIntent of paymentIntents) {
          if (
            amount >= paymentIntent.amount &&
            paymentIntent.status !== "succeeded" &&
            paymentIntent.status !== "canceled"
          ) {
            amount -= paymentIntent.amount;
            await paymentIntentApi.update({
              id: paymentIntent.id,
              data: {
                ...paymentIntent,
                status: "succeeded",
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
          }
        }
      }
    }

    return { ok: true };
  }

  async stripe(
    props:
      | {
          entity: (typeof Table)["$inferSelect"];
          action: "create";
          email: string;
          currency: string;
          metadata: {
            email: string;
            paymentIntentId: string;
          };
        }
      | {
          action: "webhook";
          data: Stripe.Response<Stripe.Event>;
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC secret key not found");
    }

    if (!STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not found");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    if (props.action === "create") {
      if (!props.entity.amount) {
        throw new Error("Amount is required");
      }

      if (props.entity.amount < 0) {
        throw new Error("Amount cannot be negative");
      }

      let stripeProduct: any;
      let stripePrice: any;
      let checkout:
        | Stripe.Response<Stripe.Checkout.Session>
        | Stripe.Response<Stripe.Subscription>
        | undefined;

      if (props.entity.type === "subscription") {
        if (!props.entity.interval) {
          throw new Error("Interval is required for subscription");
        }
        stripeProduct = await stripe.products.search({
          query: `name:'${props.entity.amount}' AND active:'true'`,
        });

        if (!stripeProduct?.data?.length) {
          stripeProduct = await stripe.products.create({
            name: `${props.entity.amount}`,
            default_price_data: {
              unit_amount: +props.entity.amount * 100,
              currency: "usd",
              recurring: { interval: props.entity.interval as any },
            },
          });
        } else {
          stripeProduct = stripeProduct.data[0];
        }

        const priceQuery = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          currency: props.currency,
          limit: 100,
        });

        const filteredPrices = priceQuery.data.filter((price) => {
          return (
            price.recurring &&
            price.recurring.interval === props.entity.interval
          );
        });

        if (filteredPrices.length) {
          stripePrice = filteredPrices[0];
        } else {
          stripePrice = await stripe.prices.create({
            unit_amount: +props.entity.amount * 100,
            currency: props.currency,
            recurring: { interval: props.entity.interval as any },
            product: stripeProduct.id,
          });
        }

        let customer: Stripe.Customer | undefined;
        const customers = await stripe.customers.list({
          email: props.email,
          limit: 1,
        });

        if (!customers?.data?.length) {
          customer = await stripe.customers.create({
            email: props.email,
          });
        } else {
          customer = customers.data[0];
        }

        if (!customer) {
          throw new Error("Customer not found");
        }

        checkout = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: stripePrice.id }],
          payment_behavior: "default_incomplete",
          expand: ["latest_invoice.payment_intent"],
          metadata: {
            ...props.metadata,
          },
        });
      } else {
        stripeProduct = await stripe.products.search({
          query: `name:'${props.entity.amount}' AND active:'true'`,
        });

        if (!stripeProduct?.data?.length) {
          stripeProduct = await stripe.products.create({
            name: `${props.entity.amount}`,
          });
        } else {
          stripeProduct = stripeProduct.data[0];
        }

        const prices = await stripe.prices.list({
          product: stripeProduct.id,
          active: true,
          currency: props.currency,
          limit: 100,
        });

        if (prices.data.length) {
          stripePrice = prices.data[0];
        } else {
          stripePrice = await stripe.prices.create({
            unit_amount: +props.entity.amount * 100,
            currency: props.currency,
            product: stripeProduct.id,
          });
        }

        checkout = await stripe.checkout.sessions.create({
          line_items: [{ price: stripePrice.id, quantity: 1 }],
          mode: "payment",
          customer_email: props.email,
          success_url: `${STRIPE_RETURN_URL}`,
          cancel_url: `${STRIPE_RETURN_URL}`,
          metadata: {
            email: props.metadata.email,
            paymentIntentId: props.metadata.paymentIntentId,
          },
        });
      }

      if (!checkout) {
        throw new Error("Checkout not found");
      }

      let invoice: any;

      if ("url" in checkout && checkout.url) {
        invoice = await invoiceApi.create({
          data: {
            provider: "stripe",
            status: "open",
            amount: props.entity.amount,
            providerId: checkout.id,
            paymentUrl: checkout.url,
            successUrl: checkout.success_url,
            cancelUrl: checkout.cancel_url,
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
      } else if ("latest_invoice" in checkout && checkout.latest_invoice) {
        invoice = await invoiceApi.create({
          data: {
            provider: "stripe",
            status: "open",
            amount: props.entity.amount,
            providerId: checkout.latest_invoice?.["id"],
            paymentUrl: checkout.latest_invoice?.["hosted_invoice_url"],
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
      }

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
      const data = props.data.data.object;

      if (data.object === "checkout.session") {
        const invoices = await invoiceApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "providerId",
                  method: "eq",
                  value: data.id,
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

        let invoice = invoices[0];

        if (!invoice) {
          throw new Error("Invoice not found");
        }

        if (data["status"] === "complete") {
          invoice = await invoiceApi.update({
            id: invoice.id,
            data: {
              ...invoice,
              amount: (data?.["amount_total"] || 0) / 100,
              providerId: data.id,
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

          await this.updatePaymentIntentStatus({ invoice });
        }

        return invoice;
      } else if (data.object === "invoice") {
        if (typeof data.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(
            data.subscription,
          );

          logger.debug("🚀 ~ subscription:", subscription);

          const invoices = await invoiceApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "providerId",
                    method: "eq",
                    value: data.id,
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

          logger.debug("🚀 ~ invoices:", invoices);

          let invoice: IInvoice | undefined | null;

          if (invoices?.length) {
            invoice = invoices[0];
          } else {
            invoice = await invoiceApi.create({
              data: {
                amount: data.amount_due / 100,
                providerId: data.id,
                status: "open",
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

            if (subscription?.metadata?.["paymentIntentId"]) {
              await paymentIntentsToInvoicesApi.create({
                data: {
                  paymentIntentId: subscription.metadata["paymentIntentId"],
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
            }
          }

          logger.debug("🚀 ~ invoice:", invoice);

          if (!invoice) {
            throw new Error("Invoice not found");
          }

          if (data.status === "paid") {
            invoice = await invoiceApi.update({
              id: invoice.id,
              data: {
                ...invoice,
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

            await this.updatePaymentIntentStatus({ invoice });
          }

          return invoice;
        }
      }

      throw new Error("Unknown stripe webhook data");
    }
  }

  async cloudpayments(props: ICloudpaymentsProceedProps) {
    const cloudpayments = new Cloudpayments();
    return cloudpayments.proceed(props);
  }

  async tiptoppay(props: ITiptippayProceedProps) {
    const tiptoppay = new Tiptoppay();
    return tiptoppay.proceed(props);
  }

  async OxProcessing(
    props:
      | {
          entity: (typeof Table)["$inferSelect"];
          action: "create";
          email: string;
          metadata: {
            paymentIntentId: string;
          };
        }
      | {
          action: "webhook";
          data: {
            PaymentId: number;
            MerchantId: string;
            Amount: number;
            TotalAmount: number;
            Currency: string;
            Email: string;
            Status: "Success" | "Canceled" | "Insufficient";
            Signature: string;
            BillingID: string;
            AmountUSD: number;
            TotalAmountUSD: number;
            Insufficient: boolean;
            Test: boolean;
            ClientId: string;
            TxHashes: string[];
          };
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC secret key not found");
    }

    if (!O_X_PROCESSING_SHOP_ID) {
      throw new Error("0xProcessing shop id not found");
    }

    if (!O_X_PROCESSING_WEBHOOK_PASSWORD) {
      throw new Error("0xProcessing webhook password not found");
    }

    if (props.action === "create") {
      const formData = new FormData();

      formData.append("currency", "USDT");
      formData.append("amountusd", `${props.entity.amount}`);
      formData.append("BillingId", `${props.metadata.paymentIntentId}`);
      formData.append("ClientId", `${props.email}`);
      formData.append("MerchantId", `${O_X_PROCESSING_SHOP_ID}`);
      formData.append("email", `${props.email}`);
      formData.append("ReturnUrl", `${true}`);
      formData.append("SuccessUrl", `${O_X_PROCESSING_RETURN_URL}`);
      formData.append("CancelUrl", `${O_X_PROCESSING_RETURN_URL}`);

      if (O_X_PROCESSING_TEST_PAYMENTS) {
        formData.append("test", `${true}`);
      }

      const checkout: {
        redirectUrl: string;
        id: number;
      } = await fetch("https://app.0xProcessing.com/Payment", {
        method: "POST",
        body: formData,
      }).then((res) => res.json());

      logger.debug("🚀 ~ checkout:", checkout);

      const invoice = await invoiceApi.create({
        data: {
          amount: props.entity.amount,
          status: "open",
          providerId: `${checkout.id}`,
          paymentUrl: checkout.redirectUrl,
          successUrl: O_X_PROCESSING_RETURN_URL,
          cancelUrl: O_X_PROCESSING_RETURN_URL,
          provider: "0xprocessing",
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
      const { Signature, PaymentId, Email, Currency } = props.data;

      const invoices = await invoiceApi.find({
        params: {
          filters: {
            and: [
              {
                column: "providerId",
                method: "eq",
                value: PaymentId,
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

      const string = `${PaymentId}:${O_X_PROCESSING_SHOP_ID}:${Email}:${Currency}:${O_X_PROCESSING_WEBHOOK_PASSWORD}`;

      const hash = crypto.createHash("md5").update(string).digest("hex");

      if (hash !== Signature) {
        throw new Error("Signature mismatch");
      }

      if (props.data.Status === "Success") {
        invoice = await invoiceApi.update({
          id: invoice.id,
          data: {
            ...invoice,
            amount: props.data.AmountUSD,
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

        await this.updatePaymentIntentStatus({ invoice });
      }

      return invoice;
    }
  }

  async dummy(
    props:
      | {
          entity: (typeof Table)["$inferSelect"];
          action: "create";
        }
      | {
          action: "webhook";
          data: {
            id: string;
          };
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC secret key not found");
    }

    if (props.action === "create") {
      const randomString = Math.random().toString(36).substring(7);
      const invoice = await invoiceApi.create({
        data: {
          amount: props.entity.amount,
          status: "open",
          providerId: `${randomString}`,
          paymentUrl: HOST_URL,
          successUrl: HOST_URL,
          cancelUrl: HOST_URL,
          provider: "dummy",
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
      const invoices = await invoiceApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "eq",
                value: props.data.id,
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

      invoice = await invoiceApi.update({
        id: invoice.id,
        data: {
          ...invoice,
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

      await this.updatePaymentIntentStatus({ invoice });

      return invoice;
    }
  }

  async payselection(
    props:
      | {
          entity: (typeof Table)["$inferSelect"];
          credentialsType: "INT" | "RUB";
          action: "create";
          email: string;
        }
      | {
          action: "webhook";
          data: {
            Event: "Payment";
            Amount: string;
            Currency: string;
            DateTime: string;
            IsTest: number;
            Brand: string;
            Bank: string;
            Country_Code_Alpha2: string;
            TransactionId: string;
            OrderId: string;
            Description: string;
            CustomFields: string;
            Service_Id: string;
            PaymentMethod: string;
            CardMasked: string;
            ExpirationDate: string;
            CardHolder: string;
          };
          rawBody: string;
          headers: {
            "x-site-id": string;
            "x-webhook-signature": string;
          };
        },
  ) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("RBAC secret key not found");
    }

    let PAYSELECTION_PUBLIC_KEY: string | undefined;
    let PAYSELECTION_SITE_ID: string | undefined;
    let PAYSELECTION_SITE_NAME: string | undefined;
    let PAYSELECTION_WEBHOOK_URL: string | undefined;
    let PAYSELECTION_SECRET_KEY: string | undefined;

    if (props.action === "create") {
      if (props.credentialsType === "RUB") {
        if (!PAYSELECTION_RUB_PUBLIC_KEY) {
          throw new Error("Payselection RUB public key not found");
        }

        if (!PAYSELECTION_RUB_SECRET_KEY) {
          throw new Error("Payselection RUB secret key not found");
        }

        if (!PAYSELECTION_RUB_SITE_ID) {
          throw new Error("Payselection RUB site id not found");
        }

        if (!PAYSELECTION_RUB_SITE_NAME) {
          throw new Error("Payselection RUB site name not found");
        }

        if (!PAYSELECTION_RUB_WEBHOOK_URL) {
          throw new Error("Payselection RUB webhook url not found");
        }

        PAYSELECTION_SECRET_KEY = PAYSELECTION_RUB_SECRET_KEY;
        PAYSELECTION_SITE_ID = PAYSELECTION_RUB_SITE_ID;
        PAYSELECTION_SITE_NAME = PAYSELECTION_RUB_SITE_NAME;
        PAYSELECTION_WEBHOOK_URL = PAYSELECTION_RUB_WEBHOOK_URL;
        PAYSELECTION_PUBLIC_KEY = PAYSELECTION_RUB_PUBLIC_KEY;
      } else if (props.credentialsType === "INT") {
        if (!PAYSELECTION_INT_PUBLIC_KEY) {
          throw new Error("Payselection INT public key not found");
        }

        if (!PAYSELECTION_INT_SITE_ID) {
          throw new Error("Payselection INT site id not found");
        }

        if (!PAYSELECTION_INT_SECRET_KEY) {
          throw new Error("Payselection INT secret key not found");
        }

        if (!PAYSELECTION_INT_SITE_NAME) {
          throw new Error("Payselection INT site name not found");
        }

        if (!PAYSELECTION_INT_WEBHOOK_URL) {
          throw new Error("Payselection INT webhook url not found");
        }

        PAYSELECTION_SECRET_KEY = PAYSELECTION_INT_SECRET_KEY;
        PAYSELECTION_SITE_ID = PAYSELECTION_INT_SITE_ID;
        PAYSELECTION_SITE_NAME = PAYSELECTION_INT_SITE_NAME;
        PAYSELECTION_WEBHOOK_URL = PAYSELECTION_INT_WEBHOOK_URL;
        PAYSELECTION_PUBLIC_KEY = PAYSELECTION_INT_PUBLIC_KEY;
      }
    } else {
      if (!PAYSELECTION_RUB_SITE_ID && !PAYSELECTION_INT_SITE_ID) {
        throw new Error("Payselection site id not found");
      }

      if (PAYSELECTION_RUB_SITE_ID === props.headers["x-site-id"]) {
        if (!PAYSELECTION_RUB_PUBLIC_KEY) {
          throw new Error("Payselection RUB public key not found");
        }

        if (!PAYSELECTION_RUB_PUBLIC_KEY) {
          throw new Error("Payselection RUB public key not found");
        }

        if (!PAYSELECTION_RUB_SECRET_KEY) {
          throw new Error("Payselection RUB secret key not found");
        }

        if (!PAYSELECTION_RUB_SITE_ID) {
          throw new Error("Payselection RUB site id not found");
        }

        if (!PAYSELECTION_RUB_SITE_NAME) {
          throw new Error("Payselection RUB site name not found");
        }

        if (!PAYSELECTION_RUB_WEBHOOK_URL) {
          throw new Error("Payselection RUB webhook url not found");
        }

        PAYSELECTION_SECRET_KEY = PAYSELECTION_RUB_SECRET_KEY;
        PAYSELECTION_SITE_ID = PAYSELECTION_RUB_SITE_ID;
        PAYSELECTION_SITE_NAME = PAYSELECTION_RUB_SITE_NAME;
        PAYSELECTION_WEBHOOK_URL = PAYSELECTION_RUB_WEBHOOK_URL;
        PAYSELECTION_PUBLIC_KEY = PAYSELECTION_RUB_PUBLIC_KEY;
      } else if (PAYSELECTION_INT_SITE_ID === props.headers["x-site-id"]) {
        if (!PAYSELECTION_INT_PUBLIC_KEY) {
          throw new Error("Payselection INT public key not found");
        }

        if (!PAYSELECTION_INT_SITE_ID) {
          throw new Error("Payselection INT site id not found");
        }

        if (!PAYSELECTION_INT_SECRET_KEY) {
          throw new Error("Payselection INT secret key not found");
        }

        if (!PAYSELECTION_INT_SITE_NAME) {
          throw new Error("Payselection INT site name not found");
        }

        if (!PAYSELECTION_INT_WEBHOOK_URL) {
          throw new Error("Payselection INT webhook url not found");
        }

        PAYSELECTION_SECRET_KEY = PAYSELECTION_INT_SECRET_KEY;
        PAYSELECTION_SITE_ID = PAYSELECTION_INT_SITE_ID;
        PAYSELECTION_SITE_NAME = PAYSELECTION_INT_SITE_NAME;
        PAYSELECTION_WEBHOOK_URL = PAYSELECTION_INT_WEBHOOK_URL;
        PAYSELECTION_PUBLIC_KEY = PAYSELECTION_INT_PUBLIC_KEY;
      }
    }

    if (!PAYSELECTION_PUBLIC_KEY) {
      throw new Error("Payselection public key not found");
    }

    if (!PAYSELECTION_SECRET_KEY) {
      throw new Error("Payselection secret key not found");
    }

    if (!PAYSELECTION_SITE_ID) {
      throw new Error("Payselection site id not found");
    }

    if (!PAYSELECTION_SITE_NAME) {
      throw new Error("Payselection site name not found");
    }

    if (props.action === "create") {
      if (!props.entity.amount) {
        throw new Error("Amount is required");
      }

      if (props.entity.amount < 0) {
        throw new Error("Amount cannot be negative");
      }

      const invoice = await invoiceApi.create({
        data: {
          provider: "payselection",
          status: "open",
          amount: props.entity.amount,
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

      const payload = JSON.stringify({
        PaymentRequest: {
          OrderId: invoice.id,
          Amount: `${props.entity.amount}`,
          Currency: "RUB",
          Description: `Checkout invoice id: ${invoice.id}`,
          RebillFlag: false,
          CustomerInfo: {
            Email: props.email,
            ReceiptEmail: props.email,
          },
          ExtendedData: {
            Email: {
              enabled: true,
              required: true,
            },
          },
        },
      });

      const method = "POST";
      const signature = crypto
        .createHmac("sha256", PAYSELECTION_PUBLIC_KEY)
        .update(
          `${method}\n${PAYSELECTION_SITE_NAME}\n${PAYSELECTION_SITE_ID}\n${invoice.id}\n${payload}`,
        )
        .digest("hex");

      const checkout:
        | {
            Id: string;
            Status: string;
            Url: string;
            Invoice: string;
            Description: string;
            Amount: string;
            Currency: string;
            CreatedDate: string;
          }
        | {
            Code: string;
            Description: string;
          } = await fetch(
        "https://webform.payselection.com/webpayments/paylink_create",
        {
          method,
          headers: {
            "X-SITE-ID": PAYSELECTION_SITE_ID,
            "X-REQUEST-ID": invoice.id,
            "X-REQUEST-SIGNATURE": signature,
            "Content-Type": "application/json",
          },
          body: payload,
        },
      ).then((res) => res.json());

      if ("Id" in checkout) {
        const updated = await invoiceApi.update({
          id: invoice.id,
          data: {
            ...invoice,
            status: "open",
            providerId: checkout.Id,
            paymentUrl: checkout.Url,
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

        if (!updated) {
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

        return updated;
      }

      throw new Error(
        `Payselection error ${checkout.Code} ${checkout.Description}`,
      );
    } else {
      if (!PAYSELECTION_WEBHOOK_URL) {
        throw new Error("PAYSELECTION_WEBHOOK_URL not found");
      }

      const { OrderId } = props.data;

      let invoice = await invoiceApi.findById({
        id: OrderId,
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

      const signature = crypto
        .createHmac("sha256", PAYSELECTION_SECRET_KEY)
        .update(
          `POST\n${PAYSELECTION_WEBHOOK_URL}\n${PAYSELECTION_SITE_ID}\n${props.rawBody}`,
        )
        .digest("hex");

      if (signature !== props.headers["x-webhook-signature"]) {
        throw new Error("Signature mismatch");
      }

      if (props.data.Event === "Payment") {
        invoice = await invoiceApi.update({
          id: invoice.id,
          data: {
            ...invoice,
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
          logger.error(
            "Payselection Webhook - Invoice not found: " + props.rawBody,
          );

          return;
        }

        await this.updatePaymentIntentStatus({ invoice });
      }

      return invoice;
    }
  }
}
