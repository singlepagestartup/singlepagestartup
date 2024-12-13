import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/ecommerce/models/order/backend/repository/database";
import { Service } from "./service";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { api as billingPaymentIntentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as billingInvoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as billingPaymentIntentsToInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import { api as ordersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { BACKEND_URL, HOST_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as ordersToBillingModulePaymentIntentsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import QueryString from "qs";
import { api as broadcastChannelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api as productApi } from "@sps/ecommerce/models/product/sdk/server";
import { api } from "@sps/ecommerce/models/order/sdk/server";
import { userStories } from "@sps/sps-business-logic";
import pako from "pako";
@injectable()
export class Controller extends RESTController<(typeof Table)["$inferSelect"]> {
  service: Service;

  constructor(@inject(DI.IService) service: Service) {
    super(service);

    this.service = service;

    this.bindRoutes([
      {
        method: "GET",
        path: "/",
        handler: this.find,
      },
      {
        method: "GET",
        path: "/dump",
        handler: this.dump,
      },
      {
        method: "GET",
        path: "/:uuid",
        handler: this.findById,
      },
      {
        method: "GET",
        path: "/:uuid/checkout-attributes",
        handler: this.checkoutAttributes,
      },
      {
        method: "POST",
        path: "/",
        handler: this.create,
      },
      {
        method: "PATCH",
        path: "/:uuid",
        handler: this.update,
      },
      {
        method: "DELETE",
        path: "/:uuid",
        handler: this.delete,
      },
      {
        method: "POST",
        path: "/:uuid/checkout",
        handler: this.checkout,
      },
      {
        method: "POST",
        path: "/:uuid/check",
        handler: this.check,
      },
    ]);
  }

  async checkout(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        return c.json(
          {
            message: "RBAC secret key not found",
          },
          {
            status: 400,
          },
        );
      }

      const uuid = c.req.param("uuid");
      const body = await c.req.parseBody();

      if (!uuid) {
        return c.json(
          {
            message: "Invalid id",
          },
          {
            status: 400,
          },
        );
      }

      if (typeof body["data"] !== "string") {
        return c.json(
          {
            message: "Invalid body",
          },
          {
            status: 400,
          },
        );
      }

      this.service.clearOldOrders();

      const data = JSON.parse(body["data"]);

      const provider = data["provider"] ?? "stripe";

      if (!data["email"]) {
        throw new HTTPException(400, {
          message: "Email not provided",
        });
      }

      const metadata = {
        orderId: uuid,
        email: data["email"],
      };

      const existing = await this.service.findById({
        id: uuid,
      });

      if (!existing) {
        return c.json(
          {
            message: "Order not found",
          },
          {
            status: 404,
          },
        );
      }

      const orderToProducts = await ordersToProductsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
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
          next: {
            cache: "no-store",
          },
        },
      });

      if (!orderToProducts?.length) {
        return c.json(
          {
            message: "Order does not have any products",
          },
          {
            status: 401,
          },
        );
      }

      const { amount, type, interval } =
        await this.service.getCheckoutAttributes({
          id: uuid,
        });

      const paymentIntent = await billingPaymentIntentApi.create({
        data: {
          amount,
          interval,
          type,
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

      const ordersToBillingModulePaymentIntents =
        await ordersToBillingModulePaymentIntentsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "orderId",
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
            next: {
              cache: "no-store",
            },
          },
        });

      if (ordersToBillingModulePaymentIntents?.length) {
        for (const orderToBillingModulePaymentIntent of ordersToBillingModulePaymentIntents) {
          await ordersToBillingModulePaymentIntentsApi.delete({
            id: orderToBillingModulePaymentIntent.id,
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

      await ordersToBillingModulePaymentIntentsApi.create({
        data: {
          orderId: uuid,
          billingModulePaymentIntentId: paymentIntent.id,
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

      await billingPaymentIntentApi.provider({
        id: paymentIntent.id,
        data: {
          provider,
          metadata,
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

      const entity = await this.service.update({
        id: uuid,
        data: {
          ...existing,
          status: "paying",
        },
      });

      await broadcastChannelApi.pushMessage({
        data: {
          channelName: "observer",
          payload: JSON.stringify({
            trigger: {
              type: "request",
              method: "POST",
              url: `${HOST_URL}/api/billing/payment-intents/${provider}/webhook`,
            },
            pipe: [
              {
                type: "request",
                method: "POST",
                url: `${HOST_URL}/api/ecommerce/orders/${uuid}/check`,
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            ],
          }),
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

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async update(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC secret key not found",
      });
    }

    try {
      const uuid = c.req.param("uuid");
      const body = await c.req.parseBody();

      if (!uuid) {
        return c.json(
          {
            message: "Invalid id",
          },
          {
            status: 400,
          },
        );
      }

      if (typeof body["data"] !== "string") {
        return c.json(
          {
            message: "Invalid body",
          },
          {
            status: 400,
          },
        );
      }

      const data = JSON.parse(body["data"]);

      let entity = await this.service.update({ id: uuid, data });

      const checkoutAttributes = await api.checkoutAttributes({
        id: uuid,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (entity?.status === "approving") {
        const ordersToProducts = await ordersToProductsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "orderId",
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
            next: {
              cache: "no-store",
            },
          },
        });

        if (!ordersToProducts?.length) {
          throw new HTTPException(404, {
            message: "Orders to products not found",
          });
        }

        const products = await productApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: ordersToProducts.map(
                    (orderToProduct) => orderToProduct.productId,
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

        if (!products?.length) {
          throw new HTTPException(404, {
            message: "Products not found",
          });
        }

        const deflatedData = pako.deflate(
          JSON.stringify({
            ecommerce: {
              order: {
                ...entity,
                checkoutAttributes,
                ordersToProducts: ordersToProducts.map((orderToProduct) => {
                  return {
                    ...orderToProduct,
                    product: products.find(
                      (product) => product.id === orderToProduct.productId,
                    ),
                  };
                }),
              },
            },
          }),
        );

        const queryData = Buffer.from(deflatedData).toString("base64");

        const query = QueryString.stringify({
          variant:
            userStories.subjectCreateOrder.order.update.approving.receipt
              .variant,
          width:
            userStories.subjectCreateOrder.order.update.approving.receipt.width,
          height:
            userStories.subjectCreateOrder.order.update.approving.receipt
              .height,
          data: queryData,
        });

        const receiptFile = await fileStorageFileApi.createFromUrl({
          data: {
            url: `${BACKEND_URL}/api/image-generator/image.png?${query}`,
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

        entity = await this.service.update({
          id: uuid,
          data: {
            ...entity,
            receipt: receiptFile.file,
          },
        });
      }

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      throw new HTTPException(400, {
        message: error.message,
      });
    }
  }

  async check(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC secret key not found",
      });
    }

    const uuid = c.req.param("uuid");

    if (!uuid) {
      return c.json(
        {
          message: "Invalid id",
        },
        {
          status: 400,
        },
      );
    }

    const entity = await this.service.findById({
      id: uuid,
    });

    if (!entity) {
      throw new HTTPException(404, {
        message: "Order not found",
      });
    }

    if (entity.status === "paying") {
      const updatedAt = new Date(entity.updatedAt).getTime();
      const expiredPayment =
        updatedAt < new Date(Date.now() - 1000 * 60 * 24).getTime();

      if (expiredPayment) {
        await api.update({
          id: uuid,
          data: {
            ...entity,
            status: "canceled",
            type: "history",
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
      } else {
        const ordersToBillingModulePaymentIntents =
          await ordersToBillingModulePaymentIntentsApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "orderId",
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
              next: {
                cache: "no-store",
              },
            },
          });

        if (!ordersToBillingModulePaymentIntents?.length) {
          throw new HTTPException(404, {
            message: "Orders to billing module payment intents not found",
          });
        }

        const paymentIntents = await billingPaymentIntentApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: ordersToBillingModulePaymentIntents.map(
                    (order) => order.billingModulePaymentIntentId,
                  ),
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-cache",
            },
            next: {
              cache: "no-store",
            },
          },
        });

        if (!paymentIntents?.length) {
          throw new HTTPException(404, {
            message: "Payment intents not found",
          });
        }

        const paymentIntentIsSucceeded = paymentIntents.find(
          (paymentIntent) => {
            return paymentIntent.status === "succeeded";
          },
        );

        if (!paymentIntentIsSucceeded) {
          throw new HTTPException(400, {
            message: "Payment intent is not succeeded",
          });
        }

        const attributes = await this.service.getCheckoutAttributes({
          id: uuid,
        });

        await api.update({
          id: uuid,
          data: {
            ...entity,
            status:
              attributes.type === "subscription" ? "delivering" : "approving",
            type: "history",
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
    } else if (entity.status === "delivering") {
      const attributes = await this.service.getCheckoutAttributes({
        id: uuid,
      });

      if (attributes.interval) {
        const minuteIntervalDeadline = new Date(
          new Date(entity.updatedAt).setMinutes(
            new Date(entity.updatedAt).getMinutes() + 1,
          ),
        );
        const hourIntervalDeadline = new Date(
          new Date(entity.updatedAt).setHours(
            new Date(entity.updatedAt).getHours() + 1,
          ),
        );
        const dayIntervalDeadline = new Date(
          new Date(entity.updatedAt).setDate(
            new Date(entity.updatedAt).getDate() + 1,
          ),
        );
        const weekIntervalDeadline = new Date(
          new Date(entity.updatedAt).setDate(
            new Date(entity.updatedAt).getDate() + 7,
          ),
        );
        const monthIntervalDeadline = new Date(
          new Date(entity.updatedAt).setMonth(
            new Date(entity.updatedAt).getMonth() + 1,
          ),
        );
        const yearIntervalDeadline = new Date(
          new Date(entity.updatedAt).setFullYear(
            new Date(entity.updatedAt).getFullYear() + 1,
          ),
        );

        const intervalDeadline =
          attributes.interval === "minute"
            ? minuteIntervalDeadline
            : attributes.interval === "hour"
              ? hourIntervalDeadline
              : attributes.interval === "day"
                ? dayIntervalDeadline
                : attributes.interval === "week"
                  ? weekIntervalDeadline
                  : attributes.interval === "month"
                    ? monthIntervalDeadline
                    : yearIntervalDeadline;

        const isExpired = new Date() > intervalDeadline;

        console.log(`🚀 ~ check ~ new Date():`, new Date());

        console.log(`🚀 ~ check ~ intervalDeadline:`, intervalDeadline);

        console.log(`🚀 ~ check ~ isExpired:`, isExpired);

        if (isExpired) {
          const ordersToBillingModulePaymentIntents =
            await ordersToBillingModulePaymentIntentsApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "orderId",
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
                next: {
                  cache: "no-store",
                },
              },
            });

          if (!ordersToBillingModulePaymentIntents?.length) {
            throw new HTTPException(404, {
              message: "Orders to billing module payment intents not found",
            });
          }

          const paymentIntents = await billingPaymentIntentApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: ordersToBillingModulePaymentIntents.map(
                      (order) => order.billingModulePaymentIntentId,
                    ),
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-cache",
              },
              next: {
                cache: "no-store",
              },
            },
          });

          if (!paymentIntents?.length) {
            throw new HTTPException(404, {
              message: "Payment intents not found",
            });
          }

          const paymentIntentsToInvoices =
            await billingPaymentIntentsToInvoicesApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "paymentIntentId",
                      method: "inArray",
                      value: paymentIntents.map(
                        (paymentIntent) => paymentIntent.id,
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

          if (!paymentIntentsToInvoices?.length) {
            throw new HTTPException(404, {
              message: "Payment intents to invoices not found",
            });
          }

          const invoices = await billingInvoiceApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: paymentIntentsToInvoices.map(
                      (paymentIntentToInvoice) =>
                        paymentIntentToInvoice.invoiceId,
                    ),
                  },
                  {
                    column: "createdAt",
                    method: "gt",
                    value: new Date(intervalDeadline).toISOString(),
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

          console.log(`🚀 ~ check ~ invoices:`, invoices);

          if (!invoices?.length) {
            await api.update({
              id: uuid,
              data: {
                ...entity,
                status: "delivered",
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

    return c.json({
      data: {
        ok: true,
      },
    });
  }

  async checkoutAttributes(c: Context, next: any): Promise<Response> {
    if (!RBAC_SECRET_KEY) {
      throw new HTTPException(400, {
        message: "RBAC secret key not found",
      });
    }

    const uuid = c.req.param("uuid");

    if (!uuid) {
      return c.json(
        {
          message: "Invalid id",
        },
        {
          status: 400,
        },
      );
    }

    const attributes = await this.service.getCheckoutAttributes({
      id: uuid,
    });

    return c.json({
      data: attributes,
    });
  }
}
