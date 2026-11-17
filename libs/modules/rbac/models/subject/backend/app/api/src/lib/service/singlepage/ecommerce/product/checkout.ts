import type { Service as SubjectService } from "../../index";
import type { IEcommerceCartSelection } from "@sps/rbac/models/subject/sdk/model";
import {
  ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds,
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
} from "@sps/shared-utils";
import { z } from "zod";

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
    offerId?: string;
    destination?: IEcommerceCartSelection["destination"];
    services?: IEcommerceCartSelection["services"];
    billingModule?: { currency?: { id?: string } };
  };
}
export type ICheckout = (props: IExecuteProps) => Promise<unknown>;
export interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "findById"
    | "subjectsToIdentities"
    | "ecommerceModule"
    | "billingModule"
    | "ecommerceModuleOrderCreate"
    | "ecommerceOrderCheckout"
  >;
}

export class Service {
  constructor(readonly service: IConstructorProps["service"]) {}
  async execute({ id, productId, data }: IExecuteProps) {
    if (!id || !productId || !data || typeof data !== "object") {
      throw new Error(
        "Validation error. Subject, Product and data are required",
      );
    }
    const quantity = data.quantity ?? 1;
    if (
      !Number.isSafeInteger(quantity) ||
      quantity < quantityBounds.min ||
      quantity > quantityBounds.max
    ) {
      throw new Error(
        `Validation error. Quantity must be an integer between ${quantityBounds.min} and ${quantityBounds.max}`,
      );
    }
    const product = await this.service.ecommerceModule.product.findById({
      id: productId,
    });
    if (!product) {
      throw new Error("Not Found error. Product not found");
    }
    if (product.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG) {
      throw new Error(
        "Permission error. Initial Free is available only through authentication bootstrap",
      );
    }
    const offers =
      await this.service.ecommerceModule.storesToProducts.offersForProduct({
        productId,
        ...(data.storeId ? { storeId: data.storeId } : {}),
      });
    let offer;
    if (data.offerId) {
      offer = offers.find((candidate) => candidate.id === data.offerId);
    } else if (offers.length === 1) {
      offer = offers[0];
    }
    if (!offer) {
      throw new Error(
        "Validation error. Choose one available store offer before checkout",
      );
    }
    let currencyId = data.billingModule?.currency?.id ?? "";
    let quote = await this.service.ecommerceModule.storesToProducts.quote({
      offerId: offer.id,
      quantity,
      currencyId,
      destination: data.destination,
      services: data.services,
    });
    if (!currencyId) {
      const defaults = await this.service.billingModule.currency.find({
        params: {
          filters: {
            and: [{ column: "isDefault", method: "eq", value: true }],
          },
        },
      });
      currencyId =
        defaults.find((currency: { id: string }) =>
          quote.currencyIds.includes(currency.id),
        )?.id ??
        quote.currencyIds[0] ??
        "";
      if (currencyId) {
        quote = await this.service.ecommerceModule.storesToProducts.quote({
          offerId: offer.id,
          quantity,
          currencyId,
          destination: data.destination,
          services: data.services,
        });
      }
    }
    if (
      !currencyId ||
      quote.amount === null ||
      quote.issues.length ||
      !quote.currencyIds.includes(currencyId)
    ) {
      throw new Error(
        `Validation error. Complete the offer selection in the cart before checkout. ${quote.issues.map((issue) => issue.message).join("; ")}`,
      );
    }
    const entity = await this.service.findById({ id });
    if (!entity) {
      throw new Error("Not Found error. Subject not found");
    }
    if (data.provider !== "telegram-star") {
      if (
        data.email &&
        !z.string().trim().email().safeParse(data.email).success
      ) {
        throw new Error("Validation error. Receipt email must be valid");
      }
      if (!data.email) {
        const identities = await this.service.subjectsToIdentities.find({
          params: {
            filters: {
              and: [{ column: "subjectId", method: "eq", value: id }],
            },
            limit: 1,
          },
        });
        if (!identities.length) {
          throw new Error("Validation error. Email is required for checkout.");
        }
      }
    }
    const created = await this.service.ecommerceModuleOrderCreate({
      subjectId: id,
      productId,
      offerId: offer.id,
      expectedQuoteVersion: quote.version,
      storeId: offer.storeId,
      quantity,
      billingModuleCurrencyId: currencyId,
      destination: data.destination,
      services: data.services,
      comment: data.comment,
    });
    const result = await this.service.ecommerceOrderCheckout({
      id,
      email: data.email,
      account: data.account,
      provider: data.provider,
      ecommerceModule: { orders: [{ id: created.orderId }] },
      comment: data.comment,
    });
    return result;
  }
}
