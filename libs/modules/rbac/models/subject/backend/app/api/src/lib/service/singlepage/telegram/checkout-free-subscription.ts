import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as ecommerceModuleOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as ecommerceModuleProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as ecommerceModuleAttributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { api as ecommerceModuleAttributeKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { api as ecommerceModuleProductsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as ecommerceModuleAttributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { api as ecommerceModuleAttributesToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/server";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";

export interface IExecuteProps {
  id: string;
  chatId: string;
}

export interface IConstructorProps {
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
}

export class Service {
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;

  constructor(props: IConstructorProps) {
    this.subjectsToEcommerceModuleOrders =
      props.subjectsToEcommerceModuleOrders;
  }

  private getSdkHeaders() {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    return {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    };
  }

  async execute(props: IExecuteProps) {
    if (!props.id) {
      throw new Error("Validation error. 'id' is required");
    }

    if (!props.chatId) {
      return null;
    }

    const headers = this.getSdkHeaders();

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

    if (subjectToOrders?.length) {
      const ecommerceModuleOrders = await ecommerceModuleOrderApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: subjectToOrders.map(
                  (item) => item.ecommerceModuleOrderId,
                ),
              },
            ],
          },
        },
        options: { headers },
      });

      const allOrdersAreCompleted = ecommerceModuleOrders?.every((order) => {
        return order.status === "completed" || order.status === "canceled";
      });

      if (!allOrdersAreCompleted) {
        return null;
      }
    }

    const subscriptionProducts = await ecommerceModuleProductApi.find({
      params: {
        filters: {
          and: [
            {
              column: "type",
              method: "eq",
              value: "subscription",
            },
          ],
        },
      },
      options: { headers },
    });

    if (!subscriptionProducts?.length) {
      return null;
    }

    const priceAttributeKeys = await ecommerceModuleAttributeKeyApi.find({
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
      options: { headers },
    });

    const priceAttributeKey = priceAttributeKeys?.[0];
    if (!priceAttributeKey) {
      return null;
    }

    const priceKeyToAttributes =
      await ecommerceModuleAttributeKeysToAttributesApi.find({
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
        options: { headers },
      });

    if (!priceKeyToAttributes?.length) {
      return null;
    }

    const productsToPriceAttributes =
      await ecommerceModuleProductsToAttributesApi.find({
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
        options: { headers },
      });

    if (!productsToPriceAttributes?.length) {
      return null;
    }

    const productPriceAttributes = await ecommerceModuleAttributeApi.find({
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
      options: { headers },
    });

    if (!productPriceAttributes?.length) {
      return null;
    }

    const zeroPriceAttributes = productPriceAttributes.filter((item) => {
      return item.number === "0";
    });

    if (!zeroPriceAttributes.length) {
      return null;
    }

    const zeroPriceProductToAttributes = productsToPriceAttributes.filter(
      (productToAttribute) => {
        return zeroPriceAttributes
          .map((item) => item.id)
          .includes(productToAttribute.attributeId);
      },
    );

    if (!zeroPriceProductToAttributes.length) {
      return null;
    }

    const everyProductToAttributeIsTheSameProduct =
      zeroPriceProductToAttributes.every((item) => {
        return item.productId === zeroPriceProductToAttributes[0].productId;
      });

    if (!everyProductToAttributeIsTheSameProduct) {
      return null;
    }

    const attributesToBillingCurrencies =
      await ecommerceModuleAttributesToBillingModuleCurrenciesApi.find({
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
        options: { headers },
      });

    if (!attributesToBillingCurrencies?.length) {
      return null;
    }

    const billingModuleCurrency = await billingModuleCurrencyApi.findById({
      id: attributesToBillingCurrencies[0].billingModuleCurrencyId,
      options: { headers },
    });

    if (!billingModuleCurrency) {
      return null;
    }

    const freeSubscriptionProduct = subscriptionProducts.find((item) => {
      return item.id === zeroPriceProductToAttributes[0].productId;
    });

    if (!freeSubscriptionProduct) {
      return null;
    }

    return rbacModuleSubjectApi.ecommerceModuleProductCheckout({
      id: props.id,
      productId: freeSubscriptionProduct.id,
      data: {
        provider: "telegram-star",
        billingModule: {
          currency: billingModuleCurrency,
        },
        account: props.chatId,
      },
    });
  }
}
