import type { Service as SubjectService } from "../../index";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as ecommerceOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as ecommerceStoresToOrdersToApi } from "@sps/ecommerce/relations/stores-to-orders/sdk/server";
import { api as ecommerceOrdersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api as subjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";

export interface IExecuteProps {
  id: string;
  productId: string;
  data: {
    provider: string;
    email?: string;
    account?: string | null;
    quantity?: number;
    comment?: string;
    storeId?: string;
    billingModule?: { currency?: { id?: string } };
  };
}

export type ICheckout = (props: IExecuteProps) => Promise<unknown>;

export interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "findById"
    | "deanonymize"
    | "subjectsToIdentities"
    | "ecommerceModule"
    | "billingModule"
    | "ecommerceOrderCheckout"
  >;
}

export class Service {
  constructor(readonly service: IConstructorProps["service"]) {}

  async execute({ id, productId, data }: IExecuteProps) {
    if (!RBAC_SECRET_KEY)
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    if (!id || !productId || !data || typeof data !== "object")
      throw new Error(
        "Validation error. Subject, Product and data are required",
      );
    let storeId = data.storeId;
    let billingModuleCurrencyId = data["billingModule"]?.currency?.id;

    if (!storeId) {
      const stores = await this.service.ecommerceModule.store.find();

      if (stores?.length === 0) {
        throw new Error("Not Found error. No stores found");
      }

      if (stores?.length && stores.length > 1) {
        throw new Error(
          "Internal error. Multiple stores found. Pass 'data.storeId'",
        );
      }

      storeId = stores?.[0]?.id;
    }

    const entity = await this.service.findById({ id });

    if (!entity) {
      throw new Error("Not Found error. No entity found with id:" + id);
    }

    if (data.provider !== "telegram-star" && data.email) {
      await this.service.deanonymize({ id, email: data.email });
    } else if (data.provider !== "telegram-star") {
      const identities = await this.service.subjectsToIdentities.find({
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: id }],
          },
          limit: 1,
        },
      });
      if (!identities.length)
        throw new Error("Validation error. Email is required for checkout.");
    }

    const ecommerceModuleProductsToAttributes =
      await this.service.ecommerceModule.productsToAttributes.find({
        params: {
          filters: {
            and: [
              {
                column: "productId",
                method: "eq",
                value: productId,
              },
            ],
          },
        },
      });

    const attributesToBillingModuleCurrencies =
      await this.service.ecommerceModule.attributesToBillingModuleCurrencies.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "inArray",
                  value:
                    ecommerceModuleProductsToAttributes?.map(
                      (productToAttribute) => productToAttribute.attributeId,
                    ) || [],
                },
              ],
            },
          },
        },
      );

    if (
      attributesToBillingModuleCurrencies?.length &&
      !billingModuleCurrencyId
    ) {
      const defaultBillingModuleCurrency =
        await this.service.billingModule.currency.find({
          params: {
            filters: {
              and: [
                {
                  column: "isDefault",
                  method: "eq",
                  value: true,
                },
              ],
            },
          },
        });

      if (defaultBillingModuleCurrency?.length) {
        billingModuleCurrencyId = attributesToBillingModuleCurrencies.find(
          (attributeToBillingModuleCurrency) =>
            attributeToBillingModuleCurrency.billingModuleCurrencyId ===
            defaultBillingModuleCurrency[0].id,
        )?.billingModuleCurrencyId;

        if (!billingModuleCurrencyId) {
          billingModuleCurrencyId =
            attributesToBillingModuleCurrencies[0]?.billingModuleCurrencyId;
        }
      }
    }

    const order = await ecommerceOrderApi.create({
      data: { comment: data.comment },
      options: {
        headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
      },
    });

    await subjectsToEcommerceModuleOrdersApi.create({
      data: {
        subjectId: id,
        ecommerceModuleOrderId: order.id,
      },
      options: {
        headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
      },
    });

    await ecommerceOrdersToProductsApi.create({
      data: {
        productId,
        orderId: order.id,
        quantity: data.quantity || 1,
      },
      options: {
        headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
      },
    });

    await ecommerceStoresToOrdersToApi.create({
      data: {
        storeId,
        orderId: order.id,
      },
      options: {
        headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY },
      },
    });

    const ordersToBillingModuleCurrencies =
      await ecommerceOrdersToBillingModuleCurrenciesApi.create({
        data: {
          orderId: order.id,
          billingModuleCurrencyId: billingModuleCurrencyId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

    if (!ordersToBillingModuleCurrencies) {
      throw new Error(
        "Not Found error. No orders to billing module currencies found",
      );
    }

    const result = await this.service.ecommerceOrderCheckout({
      id,
      email: data.email,
      account: data.account,
      provider: data.provider,
      ecommerceModule: {
        orders: [{ id: order.id }],
      },
      comment: data.comment,
    });

    return result;
  }
}
