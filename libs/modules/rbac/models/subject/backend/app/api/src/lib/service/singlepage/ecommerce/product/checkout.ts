import { Service as RenewalProfile } from "../../../startup/ecommerce/order/resolve-renewal-profile";
import type { IContext as IRenewalContext } from "../order/resolve-renewal-profile";
import type { Service as SubjectService } from "../../index";
import {
  ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds,
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";

export interface IExecuteProps {
  id: string;
  productId: string;
  socialModuleProfileId?: string;
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

export interface IInternalContext extends IRenewalContext {}

export type ICheckout = (
  props: IExecuteProps,
  context?: IInternalContext,
) => Promise<unknown>;

export interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "findById"
    | "deanonymize"
    | "subjectsToIdentities"
    | "ecommerceModule"
    | "billingModule"
    | "ecommerceOrderCheckout"
    | "subjectsToBillingModulePaymentIntents"
    | "socialModule"
    | "repository"
    | "ecommerceModuleResolveProfile"
  >;
}

export class Service {
  constructor(readonly service: IConstructorProps["service"]) {}

  async execute(
    {
      id,
      productId,
      data,
      socialModuleProfileId: requestedProfileId,
    }: IExecuteProps,
    context?: IInternalContext,
  ) {
    if (!RBAC_SECRET_KEY)
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    if (!id || !productId || !data || typeof data !== "object")
      throw new Error(
        "Validation error. Subject, Product and data are required",
      );
    const quantity = data.quantity ?? 1;
    if (
      !Number.isInteger(quantity) ||
      quantity < quantityBounds.min ||
      quantity > quantityBounds.max
    ) {
      throw new Error(
        `Validation error. Quantity must be an integer between ${quantityBounds.min} and ${quantityBounds.max}`,
      );
    }

    let socialModuleProfileId: string;
    if (context) {
      socialModuleProfileId = await new RenewalProfile(this.service).execute({
        renewalOrderId: context.renewalOrderId,
        subjectId: id,
        socialModuleProfileId: requestedProfileId,
        productIds: [productId],
      });
    } else {
      socialModuleProfileId = await this.service.ecommerceModuleResolveProfile({
        subjectId: id,
        socialModuleProfileId: requestedProfileId,
        createIfMissing: true,
      });
    }

    const product = await this.service.ecommerceModule.product.findById({
      id: productId,
    });
    if (!product) throw new Error("Not Found error. Product not found");
    if (product.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG)
      throw new Error(
        "Permission error. Initial Free is available only through authentication bootstrap",
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

    const order = await this.service.repository.withProfileLock(
      { profileId: socialModuleProfileId },
      async () => {
        const createdOrder = await this.service.ecommerceModule.order.create({
          data: { comment: data.comment },
        });
        await this.service.socialModule.profilesToEcommerceModuleOrders.create({
          data: {
            profileId: socialModuleProfileId,
            ecommerceModuleOrderId: createdOrder.id,
          },
        });
        await this.service.ecommerceModule.ordersToProducts.create({
          data: { productId, orderId: createdOrder.id, quantity },
        });
        await this.service.ecommerceModule.storesToOrders.create({
          data: { storeId, orderId: createdOrder.id },
        });
        await this.service.ecommerceModule.ordersToBillingModuleCurrencies.create(
          {
            data: { orderId: createdOrder.id, billingModuleCurrencyId },
          },
        );
        return createdOrder;
      },
    );

    const checkoutProps = {
      id,
      socialModuleProfileId,
      email: data.email,
      account: data.account,
      provider: data.provider,
      ecommerceModule: { orders: [{ id: order.id }] },
      comment: data.comment,
    };
    let result: unknown;
    if (context) {
      result = await this.service.ecommerceOrderCheckout(
        checkoutProps,
        context,
      );
    } else {
      result = await this.service.ecommerceOrderCheckout(checkoutProps);
    }

    return result;
  }
}
