import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { type IBillingModule, type IEcommerceModule } from "../../../di";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";

export interface IExecuteProps {
  id: string;
  chatId: string;
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

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    if (!props.id) {
      throw new Error("Validation error. 'id' is required");
    }

    if (!props.chatId) {
      return null;
    }

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
      const ecommerceModuleOrders = await this.ecommerceModule.order.find({
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
      });

      const allOrdersAreCompleted = ecommerceModuleOrders?.every((order) => {
        return order.status === "completed" || order.status === "canceled";
      });

      if (!allOrdersAreCompleted) {
        return null;
      }
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
          ],
        },
      },
    });

    if (!subscriptionProducts?.length) {
      return null;
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
      return null;
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
      return null;
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
      return null;
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
      return null;
    }

    const billingModuleCurrency = await this.billingModule.currency.findById({
      id: attributesToBillingCurrencies[0].billingModuleCurrencyId,
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
