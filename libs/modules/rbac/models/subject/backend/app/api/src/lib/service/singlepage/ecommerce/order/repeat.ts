import {
  ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds,
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
} from "@sps/shared-utils";
import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import type { IModel as IOrderLine } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import type { Repository } from "../../../../repository";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  socialModuleProfileId: string;
  orderId: string;
}

export interface IResult {
  orderIds: string[];
}

export interface IConstructorProps {
  repository: Pick<Repository, "withProfileLock">;
  service: Pick<
    SubjectService,
    | "ecommerceModule"
    | "billingModule"
    | "socialModule"
    | "ecommerceModuleResolveProfile"
    | "ecommerceModuleOrderAssertAccess"
    | "ecommerceModuleResolveOrderCurrency"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(props: IExecuteProps): Promise<IResult> {
    if (!props.socialModuleProfileId) {
      throw new Error("Permission error. Selected profile is required");
    }
    const { repository, service } = this.dependencies;
    return repository.withProfileLock(
      { profileId: props.socialModuleProfileId },
      async () => {
        await service.ecommerceModuleResolveProfile(props);
        await service.ecommerceModuleOrderAssertAccess(props);
        const owners =
          await service.socialModule.profilesToEcommerceModuleOrders.find({
            params: {
              filters: {
                and: [
                  {
                    column: "profileId",
                    method: "eq",
                    value: props.socialModuleProfileId,
                  },
                ],
              },
            },
          });
        const profileOrderIds = owners.map(
          (owner: { ecommerceModuleOrderId: string }) =>
            owner.ecommerceModuleOrderId,
        );
        let carts: IOrder[] = [];
        if (profileOrderIds.length) {
          carts = await service.ecommerceModule.order.find({
            params: {
              filters: {
                and: [
                  { column: "id", method: "inArray", value: profileOrderIds },
                  { column: "type", method: "eq", value: "cart" },
                  { column: "status", method: "eq", value: "new" },
                ],
              },
            },
          });
        }
        const lockedIds = [
          ...new Set([props.orderId, ...carts.map((cart) => cart.id)]),
        ].sort();
        for (const id of lockedIds) {
          await service.ecommerceModule.order.lockForLifecycle({ id });
        }
        await service.ecommerceModuleOrderAssertAccess(props);
        const source = await service.ecommerceModule.order.findById({
          id: props.orderId,
        });
        if (!source) {
          throw new Error("Not Found error. Order not found");
        }
        if (source.type !== "history") {
          throw new Error(
            "Conflict error. Only a history order can be repeated",
          );
        }

        const sourceFilters = {
          and: [{ column: "orderId", method: "eq", value: source.id }],
        };
        const lines: IOrderLine[] =
          await service.ecommerceModule.ordersToProducts.find({
            params: { filters: sourceFilters },
          });
        if (!lines.length) {
          throw new Error("Validation error. Source order has no products");
        }
        const stores = await service.ecommerceModule.storesToOrders.find({
          params: { filters: sourceFilters },
        });
        if (stores.length !== 1 || !stores[0].storeId) {
          throw new Error("Validation error. Source order must have one store");
        }
        const storeId: string = stores[0].storeId;
        const store = await service.ecommerceModule.store.findById({
          id: storeId,
        });
        if (!store) {
          throw new Error(
            "Validation error. Source order store is unavailable",
          );
        }
        const currencies =
          await service.ecommerceModule.ordersToBillingModuleCurrencies.find({
            params: { filters: sourceFilters },
          });
        if (currencies.length !== 1 || !currencies[0].billingModuleCurrencyId) {
          throw new Error(
            "Validation error. Source order must have one currency",
          );
        }
        const billingModuleCurrencyId: string =
          currencies[0].billingModuleCurrencyId;
        const currency = await service.billingModule.currency.findById({
          id: billingModuleCurrencyId,
        });
        if (!currency) {
          throw new Error(
            "Validation error. Source order currency is unavailable",
          );
        }
        for (const line of lines) {
          if (
            !Number.isInteger(line.quantity) ||
            line.quantity < quantityBounds.min ||
            line.quantity > quantityBounds.max
          ) {
            throw new Error(
              `Validation error. Quantity must be an integer between ${quantityBounds.min} and ${quantityBounds.max}`,
            );
          }
          const product = await service.ecommerceModule.product.findById({
            id: line.productId,
          });
          if (!product) {
            throw new Error(
              "Validation error. Source order product is unavailable",
            );
          }
          if (product.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG) {
            throw new Error(
              "Permission error. Initial Free is available only through authentication bootstrap",
            );
          }
          const resolvedCurrencyId =
            await service.ecommerceModuleResolveOrderCurrency({
              productId: line.productId,
              billingModuleCurrencyId,
            });
          if (resolvedCurrencyId !== billingModuleCurrencyId) {
            throw new Error(
              "Validation error. Source order currency is unavailable",
            );
          }
        }
        await service.ecommerceModule.order.findByIdCheckoutAttributesByCurrency(
          {
            id: source.id,
            billingModuleCurrencyId,
          },
        );

        const replaceable: IOrder[] = [];
        for (const cart of carts) {
          await service.ecommerceModuleOrderAssertAccess({
            ...props,
            orderId: cart.id,
          });
          const current = await service.ecommerceModule.order.findById({
            id: cart.id,
          });
          if (current?.type !== "cart" || current.status !== "new") {
            continue;
          }
          await this.assertNoPaymentAttempt(current.id);
          replaceable.push(current);
        }
        // The source and every cart have been validated before the first write.
        for (const cart of replaceable) {
          await service.ecommerceModule.order.delete({ id: cart.id });
        }
        const order = await service.ecommerceModule.order.create({
          data: { type: "cart", status: "new" },
        });
        if (!order) {
          throw new Error("Not Found error. No order found");
        }
        const owner =
          await service.socialModule.profilesToEcommerceModuleOrders.create({
            data: {
              profileId: props.socialModuleProfileId,
              ecommerceModuleOrderId: order.id,
            },
          });
        if (!owner) {
          throw new Error("Not Found error. No order profile found");
        }
        for (const line of lines) {
          const created = await service.ecommerceModule.ordersToProducts.create(
            {
              data: {
                orderId: order.id,
                productId: line.productId,
                quantity: line.quantity,
              },
            },
          );
          if (!created) {
            throw new Error("Not Found error. No orders to products found");
          }
        }
        const storeLink = await service.ecommerceModule.storesToOrders.create({
          data: { orderId: order.id, storeId },
        });
        if (!storeLink) {
          throw new Error("Not Found error. No stores to orders found");
        }
        const currencyLink =
          await service.ecommerceModule.ordersToBillingModuleCurrencies.create({
            data: { orderId: order.id, billingModuleCurrencyId },
          });
        if (!currencyLink) {
          throw new Error(
            "Not Found error. No orders to billing module currencies found",
          );
        }
        return { orderIds: [order.id] };
      },
    );
  }

  private async assertNoPaymentAttempt(orderId: string): Promise<void> {
    const { ecommerceModule } = this.dependencies.service;
    const links =
      await ecommerceModule.ordersToBillingModulePaymentIntents.find({
        params: {
          filters: {
            and: [{ column: "orderId", method: "eq", value: orderId }],
          },
        },
      });
    if (links.length) {
      throw new Error(
        "Conflict error. Cart has a payment attempt and cannot be replaced",
      );
    }
  }
}
