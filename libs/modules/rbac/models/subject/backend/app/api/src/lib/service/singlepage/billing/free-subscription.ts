import {
  ALLOWED_BILLING_SERVICE_PROVIDERS,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as orderApi } from "@sps/ecommerce/models/order/sdk/server";
import { type IBillingModule, type IEcommerceModule } from "../../../di";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";

const terminalSubscriptionOrderStatuses = new Set(["completed", "canceled"]);

export interface IExecuteProps {
  id: string;
  chatId?: string;
  email?: string;
}

export interface IConstructorProps {
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
}

export class Service {
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;

  constructor(props: IConstructorProps) {
    this.ecommerceModule = props.ecommerceModule;
    this.billingModule = props.billingModule;
    this.subjectsToEcommerceModuleOrders =
      props.subjectsToEcommerceModuleOrders;
  }

  protected async hasActiveSubscriptionOrder(props: {
    subjectToOrders?: { ecommerceModuleOrderId?: string | null }[];
  }) {
    if (!props.subjectToOrders?.length) {
      return false;
    }

    for (const subjectToOrder of props.subjectToOrders) {
      if (!subjectToOrder.ecommerceModuleOrderId) {
        continue;
      }

      const ecommerceModuleOrder = await this.ecommerceModule.order.findById({
        id: subjectToOrder.ecommerceModuleOrderId,
      });

      if (!ecommerceModuleOrder) {
        continue;
      }

      if (
        ecommerceModuleOrder.status &&
        terminalSubscriptionOrderStatuses.has(ecommerceModuleOrder.status)
      ) {
        continue;
      }

      const checkoutAttributes =
        await this.ecommerceModule.order.findByIdCheckoutAttributes({
          id: ecommerceModuleOrder.id,
        });

      if (checkoutAttributes?.type === "subscription") {
        return true;
      }
    }

    return false;
  }

  protected async hasPreviousProductOrder(props: {
    subjectToOrders?: { ecommerceModuleOrderId?: string | null }[];
    productId: string;
  }) {
    const orderIds = Array.from(
      new Set(
        props.subjectToOrders
          ?.map((item) => item.ecommerceModuleOrderId)
          .filter((orderId): orderId is string => Boolean(orderId)) ?? [],
      ),
    );

    if (!orderIds.length) {
      return false;
    }

    const ordersToProducts = await this.ecommerceModule.ordersToProducts.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "inArray",
              value: orderIds,
            },
            {
              column: "productId",
              method: "eq",
              value: props.productId,
            },
          ],
        },
      },
    });

    return Boolean(ordersToProducts?.length);
  }

  async execute(props: IExecuteProps) {
    const rbacSecretKey = RBAC_SECRET_KEY;

    if (!rbacSecretKey) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    if (!props.id) {
      throw new Error("Validation error. 'id' is required");
    }

    return this.executeCheckout(props, rbacSecretKey);
  }

  protected async executeCheckout(props: IExecuteProps, rbacSecretKey: string) {
    const subjectToOrders = await this.subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: props.id,
            },
          ],
        },
      },
    });

    const hasActiveSubscriptionOrder = await this.hasActiveSubscriptionOrder({
      subjectToOrders: subjectToOrders ?? [],
    });

    if (hasActiveSubscriptionOrder) {
      return null;
    }

    const subscriptionProducts = await this.ecommerceModule.product.find({
      params: {
        filters: {
          and: [
            {
              column: "type",
              method: "eq",
              value: "subscription",
            },
            { column: "slug", method: "eq", value: "free-subscription" },
          ],
        },
      },
    });

    if (!subscriptionProducts?.length) {
      return this.unavailable(props);
    }

    const priceAttributeKeys = await this.ecommerceModule.attributeKey.find({
      params: {
        filters: {
          and: [
            {
              column: "type",
              method: "eq",
              value: "price",
            },
          ],
        },
      },
    });

    const priceAttributeKey = priceAttributeKeys?.[0];
    if (!priceAttributeKey) {
      return this.unavailable(props);
    }

    const priceKeyToAttributes =
      await this.ecommerceModule.attributeKeysToAttributes.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeKeyId",
                method: "eq",
                value: priceAttributeKey.id,
              },
            ],
          },
        },
      });

    if (!priceKeyToAttributes?.length) {
      return this.unavailable(props);
    }

    const productsToPriceAttributes =
      await this.ecommerceModule.productsToAttributes.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "inArray",
                value: subscriptionProducts.map((item) => item.id),
              },
              {
                column: "attributeId",
                method: "inArray",
                value: priceKeyToAttributes.map((item) => item.attributeId),
              },
            ],
          },
        },
      });

    if (!productsToPriceAttributes?.length) {
      return this.unavailable(props);
    }

    const productPriceAttributes = await this.ecommerceModule.attribute.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: productsToPriceAttributes.map((item) => item.attributeId),
            },
          ],
        },
      },
    });

    if (!productPriceAttributes?.length) {
      return this.unavailable(props);
    }

    const zeroPriceAttributes = productPriceAttributes.filter((item) => {
      return item.number === "0";
    });

    if (!zeroPriceAttributes.length) {
      return this.unavailable(props);
    }

    const zeroPriceProductToAttributes = productsToPriceAttributes.filter(
      (productToAttribute) => {
        return zeroPriceAttributes
          .map((item) => item.id)
          .includes(productToAttribute.attributeId);
      },
    );

    if (!zeroPriceProductToAttributes.length) {
      return this.unavailable(props);
    }

    const everyProductToAttributeIsTheSameProduct =
      zeroPriceProductToAttributes.every((item) => {
        return item.productId === zeroPriceProductToAttributes[0].productId;
      });

    if (!everyProductToAttributeIsTheSameProduct) {
      return this.unavailable(props);
    }

    const attributesToBillingCurrencies =
      await this.ecommerceModule.attributesToBillingModuleCurrencies.find({
        params: {
          filters: {
            and: [
              {
                column: "attributeId",
                method: "inArray",
                value: zeroPriceAttributes.map((item) => item.id),
              },
            ],
          },
        },
      });

    if (!attributesToBillingCurrencies?.length) {
      return this.unavailable(props);
    }

    const billingModuleCurrency = await this.billingModule.currency.findById({
      id: attributesToBillingCurrencies[0].billingModuleCurrencyId,
    });

    if (!billingModuleCurrency) {
      return this.unavailable(props);
    }

    const freeSubscriptionProduct = subscriptionProducts.find((item) => {
      return item.id === zeroPriceProductToAttributes[0].productId;
    });

    if (!freeSubscriptionProduct) {
      return this.unavailable(props);
    }

    const hasPreviousFreeSubscriptionOrder = await this.hasPreviousProductOrder(
      {
        subjectToOrders: subjectToOrders ?? [],
        productId: freeSubscriptionProduct.id,
      },
    );

    if (hasPreviousFreeSubscriptionOrder) {
      return null;
    }

    if (
      !props.chatId &&
      !ALLOWED_BILLING_SERVICE_PROVIDERS.split(",").includes("dummy")
    )
      throw new Error(
        "Configuration error. Enable the internal dummy provider for automatic zero-price subscriptions.",
      );

    return rbacModuleSubjectApi.ecommerceModuleProductCheckout({
      id: props.id,
      productId: freeSubscriptionProduct.id,
      data: {
        provider: props.chatId ? "telegram-star" : "dummy",
        billingModule: {
          currency: billingModuleCurrency,
        },
        ...(props.chatId ? { account: props.chatId } : { email: props.email }),
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": rbacSecretKey,
          "Cache-Control": "no-store",
        },
      },
    });
  }

  private unavailable(props: IExecuteProps): null {
    if (!props.chatId)
      throw new Error(
        "Configuration error. Configure the free-subscription product with a zero price, interval and token top-up before registering users.",
      );
    return null;
  }

  async activate(
    props: IExecuteProps,
    proceed: (props: { subjectId: string }) => Promise<unknown>,
  ) {
    const result = await this.execute(props);
    if (!result) return;
    const options = {
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY!,
        "Cache-Control": "no-store",
      },
    };
    const links = await this.subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: props.id }],
        },
      },
    });
    const ids = links.map((link) => link.ecommerceModuleOrderId);
    // Zero-price invoices settle locally. Complete delivery before issuing the session.
    for (let attempt = 0; attempt < 40; attempt++) {
      const orders = await this.ecommerceModule.order.find({
        params: {
          filters: {
            and: [
              { column: "id", method: "inArray", value: ids },
              {
                column: "status",
                method: "inArray",
                value: ["paying", "paid", "delivering"],
              },
            ],
          },
        },
      });
      for (const order of orders.filter((order) => order.status === "paying"))
        await orderApi.check({ id: order.id, data: {}, options });
      await proceed({ subjectId: props.id });
      const ready = await this.ecommerceModule.order.find({
        params: {
          filters: {
            and: [
              { column: "id", method: "inArray", value: ids },
              { column: "status", method: "eq", value: "delivering" },
            ],
          },
        },
      });
      if (ready.length) return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error(
      "Configuration error. Free subscription delivery did not complete.",
    );
  }
}
