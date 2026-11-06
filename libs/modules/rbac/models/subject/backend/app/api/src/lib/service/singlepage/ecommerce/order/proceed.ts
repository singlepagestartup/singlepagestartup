import { DI, type FindServiceProps } from "@sps/shared-backend-api";
import {
  INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { IModel as IEcommerceModuleAttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { IModel as ISubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/sdk/model";
import { type IResult as IEcommerceOrderResult } from "@sps/ecommerce/models/order/sdk/server";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { inject, injectable } from "inversify";
import {
  SubjectDI,
  type IEcommerceModule,
  type INotificationModule,
  type ISocialModule,
} from "../../../../di";
import { Service as SubjectsToSocialModuleProfilesService } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/service";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import { Service as SubjectsToBillingModuleCurrenciesService } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as SubjectsToIdentitiesService } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";
import { Service as IdentityService } from "@sps/rbac/models/identity/backend/app/api/src/lib/service";
import { Service as RoleService } from "@sps/rbac/models/role/backend/app/api/src/lib/service";
import { Service as RolesToEcommerceModuleProductsService } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/service";
import { logger } from "@sps/backend-utils";
import type { ICheckout as IEcommerceProductCheckout } from "../product/checkout";
import { Repository } from "../../../../repository";

export type IExecuteProps = {
  subjectId?: string;
};

type IExtendedEcommerceModuleOrder = IEcommerceModuleOrder & {
  checkoutAttributesByCurrency: IEcommerceOrderResult["ICheckoutAttributesByCurrencyResult"];
} & IEcommerceOrderResult["IExtendedResult"];

interface ILifecycleProps {
  order: IEcommerceModuleOrder;
  extendedOrder: IExtendedEcommerceModuleOrder;
  subjectToEcommerceModuleOrder: {
    subjectId: string;
    ecommerceModuleOrderId: string;
  };
  existingRolesIds?: string[];
  productsRolesIds?: string[];
  subjectsToRoles?: ISubjectsToRoles[];
}

export interface IPaidFulfillmentEffect {
  accepted: true;
  extendedOrder: IExtendedEcommerceModuleOrder;
  status: string;
}

type ISubjectsToEcommerceModuleOrder = Awaited<
  ReturnType<SubjectsToEcommerceModuleOrdersService["find"]>
>[number];

type IFindFilter = NonNullable<
  NonNullable<FindServiceProps["params"]>["filters"]
>["and"][number];

export const ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT = 100;

export const ECOMMERCE_ORDER_PROCEED_STATUSES = [
  "paid",
  "delivering",
  "requested_cancelation",
  "delivered",
  "expired",
  "canceling",
];

function getBoundedUniqueOrders(orders: IEcommerceModuleOrder[]) {
  const orderById = new Map<string, IEcommerceModuleOrder>();

  for (const order of orders) {
    if (!order.id || orderById.has(order.id)) {
      continue;
    }

    orderById.set(order.id, order);

    if (orderById.size >= ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT) {
      break;
    }
  }

  return {
    orders: Array.from(orderById.values()),
    orderIds: Array.from(orderById.keys()),
  };
}

function groupSubjectOrderRelationsByOrderId(
  subjectsToEcommerceModuleOrders: ISubjectsToEcommerceModuleOrder[],
) {
  const result = new Map<string, ISubjectsToEcommerceModuleOrder[]>();

  for (const subjectToEcommerceModuleOrder of subjectsToEcommerceModuleOrders) {
    const orderId = subjectToEcommerceModuleOrder.ecommerceModuleOrderId;

    if (!orderId) {
      continue;
    }

    result.set(orderId, [
      ...(result.get(orderId) ?? []),
      subjectToEcommerceModuleOrder,
    ]);
  }

  return result;
}

@injectable()
export class Service {
  repository: Repository;
  socialModule: ISocialModule;
  ecommerceModule: IEcommerceModule;
  notificationModule: INotificationModule;
  identity: IdentityService;
  role: RoleService;
  rolesToEcommerceModuleProducts: RolesToEcommerceModuleProductsService;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
  subjectsToRoles: SubjectsToRolesService;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;
  subjectsToBillingModuleCurrencies: SubjectsToBillingModuleCurrenciesService;
  subjectsToIdentities: SubjectsToIdentitiesService;
  protected processingOrderIds = new Set<string>();
  private recurringCursors = new Map<string, string>();

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(SubjectDI.ISocialModule) socialModule: ISocialModule,
    @inject(SubjectDI.IEcommerceModule) ecommerceModule: IEcommerceModule,
    @inject(SubjectDI.INotificationModule)
    notificationModule: INotificationModule,
    @inject(SubjectDI.IIdentityService) identity: IdentityService,
    @inject(SubjectDI.IRoleService) role: RoleService,
    @inject(SubjectDI.IRolesToEcommerceModuleProductsService)
    rolesToEcommerceModuleProducts: RolesToEcommerceModuleProductsService,
    @inject(SubjectDI.ISubjectsToEcommerceModuleOrdersService)
    subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService,
    @inject(SubjectDI.ISubjectsToRolesService)
    subjectsToRoles: SubjectsToRolesService,
    @inject(SubjectDI.ISubjectsToSocialModuleProfilesService)
    subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService,
    @inject(SubjectDI.ISubjectsToBillingModuleCurrenciesService)
    subjectsToBillingModuleCurrencies: SubjectsToBillingModuleCurrenciesService,
    @inject(SubjectDI.ISubjectsToIdentitiesService)
    subjectsToIdentities: SubjectsToIdentitiesService,
    @inject(SubjectDI.IEcommerceProductCheckout)
    readonly ecommerceProductCheckout: IEcommerceProductCheckout,
  ) {
    this.repository = repository;
    this.socialModule = socialModule;
    this.ecommerceModule = ecommerceModule;
    this.notificationModule = notificationModule;
    this.identity = identity;
    this.role = role;
    this.rolesToEcommerceModuleProducts = rolesToEcommerceModuleProducts;
    this.subjectsToEcommerceModuleOrders = subjectsToEcommerceModuleOrders;
    this.subjectsToRoles = subjectsToRoles;
    this.subjectsToSocialModuleProfiles = subjectsToSocialModuleProfiles;
    this.subjectsToBillingModuleCurrencies = subjectsToBillingModuleCurrencies;
    this.subjectsToIdentities = subjectsToIdentities;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const scopeFilters: IFindFilter[] = [];
    if (props.subjectId) {
      const scopedOrderIds = await this.ownedOrderIds(props.subjectId);
      if (!scopedOrderIds.length) return;
      scopeFilters.push({
        column: "id",
        method: "inArray",
        value: scopedOrderIds,
      });
    }
    const candidateOrders = await this.candidateOrders(
      scopeFilters,
      props.subjectId ?? "*",
    );

    const { orders, orderIds } = getBoundedUniqueOrders(candidateOrders ?? []);

    if (!orderIds.length) {
      return;
    }

    const relationFilters: IFindFilter[] = [
      {
        column: "ecommerceModuleOrderId",
        method: "inArray",
        value: orderIds,
      },
    ];

    if (props.subjectId) {
      relationFilters.unshift({
        column: "subjectId",
        method: "eq",
        value: props.subjectId,
      });
    }

    const subjectsToEcommerceModuleOrders =
      await this.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: relationFilters,
          },
        },
      });

    if (!subjectsToEcommerceModuleOrders?.length) {
      return;
    }

    const subjectsToEcommerceModuleOrdersByOrderId =
      groupSubjectOrderRelationsByOrderId(subjectsToEcommerceModuleOrders);

    for (const order of orders) {
      if (this.processingOrderIds.has(order.id)) {
        continue;
      }

      this.processingOrderIds.add(order.id);

      try {
        const extendedOrder = await this.getExtendedEcommerceModuleOrderById({
          id: order.id,
        });

        const matchingSubjectsToEcommerceModuleOrders =
          subjectsToEcommerceModuleOrdersByOrderId.get(order.id) ?? [];

        for (const subjectToEcommerceModuleOrder of matchingSubjectsToEcommerceModuleOrders) {
          const rbacSubjectsToRoles = await this.subjectsToRoles.find({
            params: {
              filters: {
                and: [
                  {
                    column: "subjectId",
                    method: "eq",
                    value: subjectToEcommerceModuleOrder.subjectId,
                  },
                ],
              },
            },
          });

          const existingRolesIds = rbacSubjectsToRoles?.map(
            (rbacSubjectToRole) => rbacSubjectToRole.roleId,
          );

          const productsRolesIds = await this.getProductsRolesIds({
            productIds:
              extendedOrder.ordersToProducts
                ?.map((orderToProduct) => orderToProduct.productId)
                .filter((productId): productId is string =>
                  Boolean(productId),
                ) ?? [],
          });

          if (extendedOrder.status && extendedOrder.status === "delivered") {
            if (
              extendedOrder.subscriptionPeriodInvoiceId &&
              productsRolesIds.every((roleId) =>
                existingRolesIds?.includes(roleId),
              )
            ) {
              const renewal = await this.renewSubscription({
                order: extendedOrder,
                extendedOrder,
                subjectToEcommerceModuleOrder: {
                  subjectId: subjectToEcommerceModuleOrder.subjectId,
                  ecommerceModuleOrderId: order.id,
                },
              });
              if (renewal?.accepted) continue;
            }
            await this.delivered({
              order: extendedOrder,
              extendedOrder,
              subjectToEcommerceModuleOrder: {
                subjectId: subjectToEcommerceModuleOrder.subjectId,
                ecommerceModuleOrderId:
                  subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
              },
              existingRolesIds,
              productsRolesIds,
              subjectsToRoles: rbacSubjectsToRoles,
            });
          } else if (["paid", "expired"].includes(extendedOrder.status)) {
            await this.fromPaidStatus({
              order: extendedOrder,
              extendedOrder,
              subjectToEcommerceModuleOrder: {
                subjectId: subjectToEcommerceModuleOrder.subjectId,
                ecommerceModuleOrderId:
                  subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
              },
              existingRolesIds,
              productsRolesIds,
            });
          } else if (
            ["delivering", "requested_cancelation"].includes(
              extendedOrder.status,
            )
          ) {
            // A removed grant is a durable revocation. Ordinary proceed never repairs it.
            if (
              !extendedOrder.subscriptionRevokedAt &&
              extendedOrder.subscriptionPeriodInvoiceId &&
              productsRolesIds.every((roleId) =>
                existingRolesIds?.includes(roleId),
              )
            ) {
              await this.renewSubscription({
                order: extendedOrder,
                extendedOrder,
                subjectToEcommerceModuleOrder: {
                  subjectId: subjectToEcommerceModuleOrder.subjectId,
                  ecommerceModuleOrderId: order.id,
                },
              });
            }
          } else if (extendedOrder.status === "canceling") {
            await this.repository.withOrderDelivery(
              {
                subjectId: subjectToEcommerceModuleOrder.subjectId,
                orderId: order.id,
              },
              async () => {
                await this.ecommerceModule.order.lockForLifecycle({
                  id: order.id,
                });
                const current = await this.freshLifecycleProps({
                  order,
                  extendedOrder: await this.getExtendedEcommerceModuleOrderById(
                    { id: order.id },
                  ),
                  subjectToEcommerceModuleOrder: {
                    subjectId: subjectToEcommerceModuleOrder.subjectId,
                    ecommerceModuleOrderId: order.id,
                  },
                });
                if (!current || current.order.status !== "canceling") return;
                const extendedOrder = current.extendedOrder;
                const productsRolesIds = current.productsRolesIds ?? [];
                const existingRolesIds = current.existingRolesIds ?? [];
                const rbacSubjectsToRoles = current.subjectsToRoles ?? [];

                const revokedOrder =
                  await this.ecommerceModule.order.revokeSubscription({
                    id: order.id,
                  });
                const preservedRoles = await this.otherActiveOrderRoles({
                  subjectId: subjectToEcommerceModuleOrder.subjectId,
                  orderId: order.id,
                  existingRolesIds: existingRolesIds ?? [],
                });
                const toRemoveRolesIds = productsRolesIds?.filter(
                  (productRoleId) =>
                    productRoleId &&
                    existingRolesIds?.includes(productRoleId) &&
                    !preservedRoles.has(productRoleId),
                );

                if (existingRolesIds?.length) {
                  for (const existingRoleId of existingRolesIds) {
                    if (!toRemoveRolesIds.includes(existingRoleId)) {
                      continue;
                    }

                    const toRemoveSubjectToRole = rbacSubjectsToRoles?.find(
                      (rbacSubjectToRole) => {
                        return rbacSubjectToRole.roleId === existingRoleId;
                      },
                    );

                    if (!toRemoveSubjectToRole) {
                      continue;
                    }

                    await this.subjectsToRoles.deleteForOrderFulfillment({
                      id: toRemoveSubjectToRole.id,
                      subjectId: subjectToEcommerceModuleOrder.subjectId,
                      orderId: order.id,
                    });
                  }
                }

                await this.ecommerceModule.order.update({
                  id: order.id,
                  data: {
                    ...extendedOrder,
                    ...revokedOrder,
                    status: "canceled",
                  },
                });
              },
            );
          }
        }
      } catch (error: any) {
        logger.error("RBAC ecommerce order proceed failed", {
          orderId: order.id,
          orderStatus: order.status,
          subjectId: props.subjectId,
          error,
        });
      } finally {
        this.processingOrderIds.delete(order.id);
      }
    }
  }

  private async ownedOrderIds(subjectId: string): Promise<string[]> {
    const ids = new Set<string>();
    for (let offset = 0; ; offset += ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT) {
      const page = await this.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: subjectId }],
          },
          limit: ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT,
          offset,
          orderBy: { and: [{ column: "id", method: "asc" }] },
        },
      });
      for (const link of page ?? [])
        if (link.subjectId === subjectId && link.ecommerceModuleOrderId)
          ids.add(link.ecommerceModuleOrderId);
      if (!page || page.length < ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT) break;
    }
    return Array.from(ids);
  }

  private async candidateOrders(
    scope: IFindFilter[],
    cursorKey: string,
  ): Promise<IEcommerceModuleOrder[]> {
    const priorityStatuses = ["paid", "delivered", "canceling"];
    const priority = await this.ecommerceModule.order.find({
      params: {
        filters: {
          and: [
            ...scope,
            { column: "status", method: "inArray", value: priorityStatuses },
          ],
        },
        limit: ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT,
        orderBy: { and: [{ column: "updatedAt", method: "asc" }] },
      },
    });
    const selected = getBoundedUniqueOrders(
      (priority ?? []).filter((order) =>
        priorityStatuses.includes(order.status),
      ),
    ).orders;
    const remaining = ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT - selected.length;
    if (!remaining) return selected;
    const recurringStatuses = [
      "delivering",
      "requested_cancelation",
      "expired",
    ];
    const cursor = this.recurringCursors.get(cursorKey);
    const read = (after?: string) =>
      this.ecommerceModule.order.find({
        params: {
          filters: {
            and: [
              ...scope,
              { column: "status", method: "inArray", value: recurringStatuses },
              ...(after
                ? [{ column: "id", method: "gt" as const, value: after }]
                : []),
            ],
          },
          limit: remaining,
          orderBy: { and: [{ column: "id", method: "asc" }] },
        },
      });
    let page = await read(cursor);
    if (!page?.length && cursor) page = await read();
    const valid = (page ?? []).filter((order) =>
      recurringStatuses.includes(order.status),
    );
    const last = valid.at(-1)?.id;
    if (last) {
      this.recurringCursors.delete(cursorKey);
      this.recurringCursors.set(cursorKey, last);
      if (this.recurringCursors.size > 256)
        this.recurringCursors.delete(
          this.recurringCursors.keys().next().value!,
        );
    } else this.recurringCursors.delete(cursorKey);
    return getBoundedUniqueOrders([...selected, ...valid]).orders;
  }

  async collectTopupCurrencies(props: {
    extendedOrder: IExtendedEcommerceModuleOrder;
    subjectToEcommerceModuleOrder: {
      subjectId: string;
      ecommerceModuleOrderId: string;
    };
  }): Promise<
    {
      billingModuleCurrencyId: string;
      billingModuleCurrency: IBillingModuleCurrency;
      amount: string;
    }[]
  > {
    const currencies = new Map<
      string,
      {
        billingModuleCurrencyId: string;
        billingModuleCurrency: IBillingModuleCurrency;
        amount: string;
      }
    >();
    for (const line of props.extendedOrder.ordersToProducts) {
      const quantity = Number(line.quantity ?? 1);
      if (!Number.isSafeInteger(quantity) || quantity <= 0)
        throw new Error(
          "Validation error. Topup quantity must be a positive integer",
        );
      for (const { attribute } of line.product.productsToAttributes ?? []) {
        if (
          !attribute.attributeKeysToAttribute?.some(
            (link) => link.attributeKey?.type === "topup",
          )
        )
          continue;
        const amount = Number(attribute.number);
        if (
          typeof attribute.number !== "string" ||
          !attribute.number.trim() ||
          !Number.isFinite(amount) ||
          amount <= 0
        )
          throw new Error(
            "Validation error. Topup amount must be finite and positive",
          );
        const links = attribute.attributesToBillingModuleCurrencies ?? [];
        if (!links.length)
          throw new Error("Configuration error. Topup currency is missing");
        const seen = new Set<string>();
        for (const link of links) {
          if (
            !link.billingModuleCurrency ||
            seen.has(link.billingModuleCurrencyId)
          )
            throw new Error(
              "Configuration error. Topup currency is missing or duplicated",
            );
          seen.add(link.billingModuleCurrencyId);
          const previous = currencies.get(link.billingModuleCurrencyId);
          const total = Number(previous?.amount ?? 0) + amount * quantity;
          if (!Number.isFinite(total) || total <= 0)
            throw new Error(
              "Validation error. Topup total must be finite and positive",
            );
          currencies.set(link.billingModuleCurrencyId, {
            billingModuleCurrencyId: link.billingModuleCurrencyId,
            billingModuleCurrency: link.billingModuleCurrency,
            amount: String(total),
          });
        }
      }
    }
    return [...currencies.values()];
  }

  private isInitialFree(order: IExtendedEcommerceModuleOrder) {
    return order.ordersToProducts.some(
      (line) => line.product.slug === INITIAL_FREE_SUBSCRIPTION_PRODUCT_SLUG,
    );
  }

  private async freeDeliveryEligible(props: ILifecycleProps) {
    if (!this.isInitialFree(props.extendedOrder)) return true;
    if (
      props.extendedOrder.ordersToProducts.length !== 1 ||
      Number(props.extendedOrder.ordersToProducts[0].quantity ?? 1) !== 1
    )
      throw new Error(
        "Validation error. Initial Free must contain exactly one unit of its internal Product",
      );
    const identities = await this.subjectsToIdentities.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: props.subjectToEcommerceModuleOrder.subjectId,
            },
          ],
        },
      },
    });
    if (!identities.length)
      throw new Error(
        "Permission error. Initial Free requires a registered Subject",
      );
    const owned = await this.subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: props.subjectToEcommerceModuleOrder.subjectId,
            },
          ],
        },
      },
    });
    const ids = owned
      .filter(
        (link) =>
          link.subjectId === props.subjectToEcommerceModuleOrder.subjectId,
      )
      .map((link) => link.ecommerceModuleOrderId);
    const lines = await this.ecommerceModule.ordersToProducts.find({
      params: {
        filters: {
          and: [
            { column: "orderId", method: "inArray", value: ids },
            {
              column: "productId",
              method: "eq",
              value: props.extendedOrder.ordersToProducts[0].productId,
            },
          ],
        },
      },
    });
    const freeIds = [...new Set(lines.map((line) => line.orderId))];
    const orders = await this.ecommerceModule.order.find({
      params: {
        filters: { and: [{ column: "id", method: "inArray", value: freeIds }] },
      },
    });
    const candidates = orders.filter((order) => freeIds.includes(order.id));
    if (
      candidates.some(
        (order) =>
          order.id !== props.order.id &&
          (order.subscriptionPeriodInvoiceId ||
            !["new", "paying", "paid"].includes(order.status)),
      )
    )
      return false;
    candidates.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
        a.id.localeCompare(b.id),
    );
    return (
      !props.order.subscriptionPeriodInvoiceId &&
      candidates[0]?.id === props.order.id
    );
  }

  /** Internal orchestration only: caller owns the common Subject transaction. */
  async fulfillPaidOrderInTransaction(scope: {
    subjectId: string;
    orderId: string;
  }): Promise<IPaidFulfillmentEffect | undefined> {
    await this.repository.lockOrderDelivery(scope);
    await this.ecommerceModule.order.lockForLifecycle({ id: scope.orderId });
    const extendedOrder = await this.getExtendedEcommerceModuleOrderById({
      id: scope.orderId,
    });
    const current = await this.freshLifecycleProps({
      order: extendedOrder,
      extendedOrder,
      subjectToEcommerceModuleOrder: {
        subjectId: scope.subjectId,
        ecommerceModuleOrderId: scope.orderId,
      },
    });
    if (!current || !["paid", "expired"].includes(current.order.status)) return;
    return this.applyPaidStatus(current);
  }

  async dispatchPaidEffects(result: IPaidFulfillmentEffect) {
    await this.notifyAdmin({
      extendedEcommerceModuleOrder: result.extendedOrder,
      status: result.status,
    }).catch(() => undefined);
    await this.notifyOrderOwner({
      extendedEcommerceModuleOrder: result.extendedOrder,
      status: result.status,
    }).catch(() => undefined);
  }

  async fromPaidStatus(props: ILifecycleProps) {
    const scope = {
      subjectId: props.subjectToEcommerceModuleOrder.subjectId,
      orderId: props.order.id,
    };
    const result = await this.repository.withOrderDelivery(scope, () =>
      this.fulfillPaidOrderInTransaction(scope),
    );
    if (result) await this.dispatchPaidEffects(result);
  }

  private async applyPaidStatus(
    props: ILifecycleProps,
  ): Promise<IPaidFulfillmentEffect | undefined> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const free = this.isInitialFree(props.extendedOrder);
    if (free && !(await this.freeDeliveryEligible(props))) return;
    const paidInvoices = props.extendedOrder.ordersToBillingModulePaymentIntents
      .flatMap(
        (link) => link.billingModulePaymentIntent.paymentIntentsToInvoices,
      )
      .map((link) => link.invoice)
      .filter((invoice) => invoice?.status === "paid");
    if (!paidInvoices.length) return;
    if (
      free &&
      (props.extendedOrder.checkoutAttributesByCurrency.amount !== 0 ||
        paidInvoices.some((invoice) => invoice!.amount !== 0))
    )
      throw new Error(
        "Validation error. Initial Free settlement must be zero-priced",
      );
    const subscription =
      props.extendedOrder.checkoutAttributesByCurrency.type === "subscription";
    const activated = Boolean(props.order.subscriptionPeriodInvoiceId);
    if (subscription && props.order.subscriptionRevokedAt) return;
    const resumeExpired =
      activated &&
      props.order.status === "expired" &&
      !props.order.subscriptionRevokedAt;
    if (
      subscription &&
      activated &&
      !resumeExpired &&
      props.productsRolesIds?.some(
        (roleId) => !props.existingRolesIds?.includes(roleId),
      )
    )
      return;

    if (
      subscription &&
      !(await this.ecommerceModule.order.assertSubscriptionPayment({
        id: props.order.id,
      }))
    )
      return;

    const newRolesIds = props.productsRolesIds?.filter(
      (productRoleId) =>
        productRoleId && !props.existingRolesIds?.includes(productRoleId),
    );

    if (newRolesIds?.length && (!subscription || !activated || resumeExpired)) {
      for (const newRoleId of newRolesIds) {
        await this.subjectsToRoles.create({
          data: {
            subjectId: props.subjectToEcommerceModuleOrder.subjectId,
            roleId: newRoleId,
          },
        });
      }
    }

    const topupCurrencies = await this.collectTopupCurrencies({
      extendedOrder: props.extendedOrder,
      subjectToEcommerceModuleOrder: props.subjectToEcommerceModuleOrder,
    });

    if (subscription) {
      const freshGrants = await this.subjectsToRoles.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.subjectToEcommerceModuleOrder.subjectId,
              },
            ],
          },
        },
      });
      if (
        props.productsRolesIds?.some(
          (roleId) => !freshGrants.some((grant) => grant.roleId === roleId),
        )
      )
        return;
      const period = await this.ecommerceModule.order.acceptSubscriptionPeriod({
        id: props.order.id,
        expectedInvoiceId: props.order.subscriptionPeriodInvoiceId ?? null,
      });
      if (!period.accepted) return;
    }

    const rbacSubjectsToSocialModuleProfiles =
      await this.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: props.subjectToEcommerceModuleOrder.subjectId,
              },
            ],
          },
        },
      });

    const invitedSocialModuleProfilesIds: string[] = [];

    if (!free && rbacSubjectsToSocialModuleProfiles?.length) {
      for (const rbacSubjectsToSocialModuleProfile of rbacSubjectsToSocialModuleProfiles) {
        const socialModuleAttributes = await this.socialModule.attribute.find({
          params: {
            filters: {
              and: [
                {
                  column: "slug",
                  method: "ilike",
                  value: `-invitedby-${rbacSubjectsToSocialModuleProfile.socialModuleProfileId}`,
                },
              ],
            },
          },
        });

        if (socialModuleAttributes?.length) {
          socialModuleAttributes.forEach((socialModuleAttribute) => {
            const invitedSocialModuleProfileId =
              socialModuleAttribute.slug.replaceAll(
                `-invitedby-${rbacSubjectsToSocialModuleProfile.socialModuleProfileId}`,
                "",
              );

            invitedSocialModuleProfilesIds.push(invitedSocialModuleProfileId);
          });
        }
      }
    }

    if (
      free &&
      (topupCurrencies.length !== 1 ||
        topupCurrencies[0].billingModuleCurrency.slug !== "token" ||
        Number(topupCurrencies[0].amount) !== 3000)
    )
      throw new Error(
        "Configuration error. Initial Free requires exactly 3000 Token credits",
      );
    if (topupCurrencies.length) {
      const subjectsToBillingModuleCurrencies =
        await this.subjectsToBillingModuleCurrencies.find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: props.subjectToEcommerceModuleOrder.subjectId,
                },
              ],
            },
          },
        });

      for (const topupCurrency of topupCurrencies) {
        const existingSubjectToBillingModuleCurrency =
          subjectsToBillingModuleCurrencies?.find(
            (subjectsToBillingModuleCurrency) => {
              return (
                subjectsToBillingModuleCurrency.billingModuleCurrencyId ===
                topupCurrency.billingModuleCurrency.id
              );
            },
          );

        const topupAmount =
          parseFloat(topupCurrency.amount) +
          invitedSocialModuleProfilesIds.length * 3;

        if (existingSubjectToBillingModuleCurrency) {
          const credited =
            await this.subjectsToBillingModuleCurrencies.updateAmountIfUnchanged(
              {
                id: existingSubjectToBillingModuleCurrency.id,
                expectedAmount: existingSubjectToBillingModuleCurrency.amount,
                amount: String(
                  parseFloat(existingSubjectToBillingModuleCurrency.amount) +
                    topupAmount,
                ),
              },
            );
          if (!credited)
            throw new Error(
              "Conflict error. Subject balance changed during order delivery",
            );
        } else {
          await this.subjectsToBillingModuleCurrencies.create({
            data: {
              subjectId: props.subjectToEcommerceModuleOrder.subjectId,
              billingModuleCurrencyId: topupCurrency.billingModuleCurrency.id,
              amount: String(topupAmount),
            },
          });
        }
      }
    }

    const updateEcommerceOrderData = { ...props.order, status: "approving" };

    if (
      props.extendedOrder.checkoutAttributesByCurrency.type == "subscription"
    ) {
      updateEcommerceOrderData.status = "delivering";
    }

    if (!subscription) {
      await this.ecommerceModule.order.update({
        id: props.order.id,
        data: updateEcommerceOrderData,
      });
    }

    return {
      accepted: true,
      extendedOrder: props.extendedOrder,
      status: updateEcommerceOrderData.status,
    };
  }

  async delivered(props: ILifecycleProps) {
    const checkout = await this.repository.withOrderDelivery(
      {
        subjectId: props.subjectToEcommerceModuleOrder.subjectId,
        orderId: props.order.id,
      },
      async () => {
        await this.ecommerceModule.order.lockForLifecycle({
          id: props.order.id,
        });
        const current = await this.freshLifecycleProps(props);
        if (!current || current.order.status !== "delivered") return undefined;
        return this.applyDeliveredStatus(current);
      },
    );
    if (checkout) await checkout();
  }

  private async applyDeliveredStatus(props: ILifecycleProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const canAutoRenew =
      !this.isInitialFree(props.extendedOrder) &&
      !props.order.subscriptionRevokedAt &&
      (props.productsRolesIds ?? []).every((roleId) =>
        props.existingRolesIds?.includes(roleId),
      );

    const preservedRoles = await this.otherActiveOrderRoles({
      subjectId: props.subjectToEcommerceModuleOrder.subjectId,
      orderId: props.order.id,
      existingRolesIds: props.existingRolesIds ?? [],
    });

    const removeRolesIds = props.productsRolesIds?.filter(
      (productRoleId) =>
        productRoleId &&
        props.existingRolesIds?.includes(productRoleId) &&
        !preservedRoles.has(productRoleId),
    );

    if (removeRolesIds?.length) {
      for (const removeRoleId of removeRolesIds) {
        const rbacSubjectToRole = props.subjectsToRoles?.find(
          (rbacSubjectToRole) => rbacSubjectToRole.roleId === removeRoleId,
        );

        if (!rbacSubjectToRole) {
          continue;
        }

        await this.subjectsToRoles.deleteForOrderFulfillment({
          id: rbacSubjectToRole.id,
          subjectId: props.subjectToEcommerceModuleOrder.subjectId,
          orderId: props.order.id,
        });
      }
    }

    const needToCreateSubscriptionOrder =
      canAutoRenew &&
      props.extendedOrder.checkoutAttributesByCurrency.type ===
        "subscription" &&
      props.extendedOrder.ordersToBillingModulePaymentIntents
        .map((orderToBillingModulePaymentIntent) => {
          return orderToBillingModulePaymentIntent.billingModulePaymentIntent
            .type;
        })
        .every((billingModulePaymentIntentType) => {
          return billingModulePaymentIntentType === "one_off";
        }) &&
      props.extendedOrder.ordersToProducts.length === 1;

    const currencies = props.extendedOrder.ordersToBillingModulePaymentIntents
      .map((orderToBillingModulePaymentIntent) => {
        return orderToBillingModulePaymentIntent.billingModulePaymentIntent.paymentIntentsToCurrencies.map(
          (paymentIntentToCurrency) => {
            return paymentIntentToCurrency.currency;
          },
        );
      })
      .flat(1)
      .filter((currency): currency is IBillingModuleCurrency =>
        Boolean(currency),
      );

    const invoices = props.extendedOrder.ordersToBillingModulePaymentIntents
      .map((orderToBillingModulePaymentIntent) => {
        return orderToBillingModulePaymentIntent.billingModulePaymentIntent.paymentIntentsToInvoices.map(
          (paymentIntentsToInvoices) => {
            return paymentIntentsToInvoices.invoice;
          },
        );
      })
      .flat(1)
      .filter((invoice): invoice is NonNullable<typeof invoice> =>
        Boolean(invoice),
      );

    const firstCurrency = currencies[0];
    const firstInvoice = invoices[0];

    const allOrderCurrenciesAreTheSame =
      Boolean(firstCurrency) &&
      currencies.every((entity) => {
        return firstCurrency.id === entity.id;
      });

    const allProvidersAreTheSame =
      Boolean(firstInvoice) &&
      invoices.every((invoice) => {
        return invoice.provider === firstInvoice.provider;
      });

    const recurring =
      props.extendedOrder.ordersToBillingModulePaymentIntents.some(
        (link) => link.billingModulePaymentIntent.type === "subscription",
      );
    await this.ecommerceModule.order.update({
      id: props.extendedOrder.id,
      data: {
        ...props.extendedOrder,
        status:
          recurring && !props.order.subscriptionRevokedAt
            ? "expired"
            : "completed",
      },
    });

    if (
      needToCreateSubscriptionOrder &&
      firstCurrency &&
      firstInvoice &&
      allOrderCurrenciesAreTheSame &&
      allProvidersAreTheSame
    ) {
      const provider = firstInvoice.provider;
      const currency = firstCurrency;

      if (
        provider &&
        firstInvoice.amount === 0 &&
        props.extendedOrder.checkoutAttributesByCurrency.amount === 0
      ) {
        return () =>
          this.ecommerceProductCheckout({
            id: props.subjectToEcommerceModuleOrder.subjectId,
            productId: props.extendedOrder.ordersToProducts[0].productId,
            data: { provider, billingModule: { currency } },
          });
        return;
      }

      if (provider === "telegram-star") {
        const subjectToSocialModuleProfiles =
          await this.subjectsToSocialModuleProfiles.find({
            params: {
              filters: {
                and: [
                  {
                    column: "subjectId",
                    method: "eq",
                    value: props.subjectToEcommerceModuleOrder.subjectId,
                  },
                ],
              },
            },
          });

        if (subjectToSocialModuleProfiles?.length) {
          const socialModuleProfilesToChats =
            await this.socialModule.profilesToChats.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "profileId",
                      method: "inArray",
                      value: subjectToSocialModuleProfiles.map((entity) => {
                        return entity.socialModuleProfileId;
                      }),
                    },
                  ],
                },
              },
            });

          if (socialModuleProfilesToChats?.length) {
            const telegramChats = await this.socialModule.chat.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: socialModuleProfilesToChats.map((entity) => {
                        return entity.chatId;
                      }),
                    },
                    {
                      column: "variant",
                      method: "eq",
                      value: "telegram",
                    },
                  ],
                },
              },
            });

            if (telegramChats?.length && telegramChats.length === 1) {
              return () =>
                this.ecommerceProductCheckout({
                  id: props.subjectToEcommerceModuleOrder.subjectId,
                  productId: props.extendedOrder.ordersToProducts[0].productId,
                  data: {
                    provider,
                    billingModule: {
                      currency,
                    },
                    account: telegramChats[0].sourceSystemId,
                  },
                });
            }
          }
        }
      }
    }
    return undefined;
  }

  async notifyOrderOwner(props: {
    extendedEcommerceModuleOrder: IExtendedEcommerceModuleOrder;
    status: IEcommerceModuleOrder["status"];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const notificationModuleEcommerceNotificationTemplates =
      await this.notificationModule.template.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "ilike",
                value: "-ecommerce-order-status-changed-",
              },
              {
                column: "variant",
                method: "notIlike",
                value: "-admin",
              },
            ],
          },
        },
      });

    const subjectsToEcommerceModuleOrders =
      await this.subjectsToEcommerceModuleOrders.find({
        params: {
          filters: {
            and: [
              {
                column: "ecommerceModuleOrderId",
                method: "eq",
                value: props.extendedEcommerceModuleOrder.id,
              },
            ],
          },
        },
      });

    if (!subjectsToEcommerceModuleOrders?.length) {
      return;
    }

    const subjectsToIdentities = await this.subjectsToIdentities.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "inArray",
              value: subjectsToEcommerceModuleOrders.map(
                (item) => item.subjectId,
              ),
            },
          ],
        },
      },
    });

    if (!subjectsToIdentities?.length) {
      return;
    }

    const identities = await this.identity.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: subjectsToIdentities.map(
                (subjectToIdentity) => subjectToIdentity.identityId,
              ),
            },
          ],
        },
      },
    });

    if (!identities?.length) {
      return;
    }

    if (notificationModuleEcommerceNotificationTemplates?.length) {
      for (const notificationModuleEcommerceNotificationTemplate of notificationModuleEcommerceNotificationTemplates) {
        for (const subjectToEcommerceModuleOrder of subjectsToEcommerceModuleOrders) {
          const files: IFileStorageModuleFile[] = [];

          props.extendedEcommerceModuleOrder.ordersToFileStorageModuleFiles.forEach(
            (orderToFileStorageModuleFile) => {
              if (!orderToFileStorageModuleFile.fileStorageModuleFile) {
                return;
              }

              files.push(orderToFileStorageModuleFile.fileStorageModuleFile);
            },
          );

          if (props.extendedEcommerceModuleOrder.ordersToProducts.length) {
            for (const orderToProduct of props.extendedEcommerceModuleOrder
              .ordersToProducts) {
              const attachmentFiles =
                orderToProduct.product.productsToFileStorageModuleFiles?.filter(
                  (productToFileStorageModuleFile) => {
                    return productToFileStorageModuleFile.variant.includes(
                      "attachment",
                    );
                  },
                );

              if (attachmentFiles?.length) {
                for (const attachmentFile of attachmentFiles) {
                  if (attachmentFile.fileStorageModuleFile) {
                    files.push(attachmentFile.fileStorageModuleFile);
                  }
                }
              }
            }
          }

          await api.notify({
            id: subjectToEcommerceModuleOrder.subjectId,
            data: {
              notification: {
                topic: {
                  slug: "information",
                },
                template: notificationModuleEcommerceNotificationTemplate,
                notification: {
                  data: {
                    ecommerce: {
                      order: props.extendedEcommerceModuleOrder,
                    },
                    comment: props.extendedEcommerceModuleOrder.comment,
                  },
                },
              },
              fileStorage: {
                files,
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        }
      }
    }
  }

  async notifyAdmin(props: {
    extendedEcommerceModuleOrder: IExtendedEcommerceModuleOrder;
    status: IEcommerceModuleOrder["status"];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const notificationModuleEcommerceNotificationTemplates =
      await this.notificationModule.template.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "ilike",
                value: "-ecommerce-order-status-changed-",
              },
              {
                column: "variant",
                method: "ilike",
                value: "-admin",
              },
            ],
          },
        },
      });

    const adminRoles = await this.role.find({
      params: {
        filters: {
          and: [
            {
              column: "slug",
              method: "eq",
              value: "admin",
            },
          ],
        },
      },
    });

    if (!adminRoles?.length) {
      return;
    }

    const subjectsToRoles = await this.subjectsToRoles.find({
      params: {
        filters: {
          and: [
            {
              column: "roleId",
              method: "inArray",
              value: adminRoles.map((adminRole) => adminRole.id),
            },
          ],
        },
      },
    });

    if (!subjectsToRoles?.length) {
      return;
    }

    const subjectsToIdentities = await this.subjectsToIdentities.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "inArray",
              value: subjectsToRoles.map((item) => item.subjectId),
            },
          ],
        },
      },
    });

    if (!subjectsToIdentities?.length) {
      return;
    }

    const identities = await this.identity.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: subjectsToIdentities.map(
                (subjectToIdentity) => subjectToIdentity.identityId,
              ),
            },
          ],
        },
      },
    });

    if (!identities?.length) {
      return;
    }

    if (notificationModuleEcommerceNotificationTemplates?.length) {
      for (const notificationModuleEcommerceNotificationTemplate of notificationModuleEcommerceNotificationTemplates) {
        for (const subjectToRole of subjectsToRoles) {
          const files: IFileStorageModuleFile[] = [];

          props.extendedEcommerceModuleOrder.ordersToFileStorageModuleFiles.forEach(
            (orderToFileStorageModuleFile) => {
              if (!orderToFileStorageModuleFile.fileStorageModuleFile) {
                return;
              }

              files.push(orderToFileStorageModuleFile.fileStorageModuleFile);
            },
          );

          if (props.extendedEcommerceModuleOrder.ordersToProducts.length) {
            for (const orderToProduct of props.extendedEcommerceModuleOrder
              .ordersToProducts) {
              const attachmentFiles =
                orderToProduct.product.productsToFileStorageModuleFiles?.filter(
                  (productToFileStorageModuleFile) => {
                    return productToFileStorageModuleFile.variant.includes(
                      "attachment",
                    );
                  },
                );

              if (attachmentFiles?.length) {
                for (const attachmentFile of attachmentFiles) {
                  if (attachmentFile.fileStorageModuleFile) {
                    files.push(attachmentFile.fileStorageModuleFile);
                  }
                }
              }
            }
          }

          await api.notify({
            id: subjectToRole.subjectId,
            data: {
              notification: {
                topic: {
                  slug: "information",
                },
                template: notificationModuleEcommerceNotificationTemplate,
                notification: {
                  data: {
                    ecommerce: {
                      order: props.extendedEcommerceModuleOrder,
                    },
                    comment: props.extendedEcommerceModuleOrder.comment,
                  },
                },
              },
              fileStorage: {
                files,
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        }
      }
    }
  }

  private async renewSubscription(props: ILifecycleProps) {
    if (this.isInitialFree(props.extendedOrder)) return;
    const result = await this.repository.withOrderDelivery(
      {
        subjectId: props.subjectToEcommerceModuleOrder.subjectId,
        orderId: props.order.id,
      },
      async () => {
        await this.ecommerceModule.order.lockForLifecycle({
          id: props.order.id,
        });
        const current = await this.freshLifecycleProps(props);
        if (
          !current ||
          current.order.subscriptionRevokedAt ||
          !current.order.subscriptionPeriodInvoiceId ||
          !["delivering", "requested_cancelation", "delivered"].includes(
            current.order.status,
          ) ||
          current.productsRolesIds?.some(
            (roleId) => !current.existingRolesIds?.includes(roleId),
          )
        )
          return;
        return this.applyPaidStatus(current);
      },
    );
    if (result) await this.dispatchPaidEffects(result);
    return result;
  }

  private async freshLifecycleProps(
    props: ILifecycleProps,
  ): Promise<ILifecycleProps | undefined> {
    const ownership = await this.subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: props.subjectToEcommerceModuleOrder.subjectId,
            },
            {
              column: "ecommerceModuleOrderId",
              method: "eq",
              value: props.order.id,
            },
          ],
        },
      },
    });
    if (
      !ownership.some(
        (link) =>
          link.subjectId === props.subjectToEcommerceModuleOrder.subjectId &&
          link.ecommerceModuleOrderId === props.order.id,
      )
    )
      return undefined;
    const extendedOrder = await this.getExtendedEcommerceModuleOrderById({
      id: props.order.id,
    });
    const subjectsToRoles = await this.subjectsToRoles.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: props.subjectToEcommerceModuleOrder.subjectId,
            },
          ],
        },
      },
    });
    const productsRolesIds = await this.getProductsRolesIds({
      productIds: extendedOrder.ordersToProducts.map((line) => line.productId),
    });
    return {
      ...props,
      order: extendedOrder,
      extendedOrder,
      subjectsToRoles,
      existingRolesIds: subjectsToRoles.map((grant) => grant.roleId),
      productsRolesIds,
    };
  }

  async getProductsRolesIds(props: {
    productIds: string[];
  }): Promise<string[]> {
    if (!props.productIds.length) {
      return [];
    }

    const rolesToProducts = await this.rolesToEcommerceModuleProducts.find({
      params: {
        filters: {
          and: [
            {
              column: "ecommerceModuleProductId",
              method: "inArray",
              value: props.productIds,
            },
          ],
        },
      },
    });

    return Array.from(
      new Set(
        (rolesToProducts ?? [])
          .map((item) => item.roleId)
          .filter((roleId): roleId is string => Boolean(roleId)),
      ),
    );
  }

  private async otherActiveOrderRoles(props: {
    subjectId: string;
    orderId: string;
    existingRolesIds: string[];
  }): Promise<Set<string>> {
    if (!props.existingRolesIds.length) return new Set();
    const owned = await this.subjectsToEcommerceModuleOrders.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: props.subjectId }],
        },
      },
    });
    const ids = Array.from(
      new Set(
        owned
          .filter(
            (link) =>
              link.subjectId === props.subjectId &&
              link.ecommerceModuleOrderId !== props.orderId,
          )
          .map((link) => link.ecommerceModuleOrderId),
      ),
    );
    if (!ids.length) return new Set();
    const now = Date.now();
    const otherOrders = await this.ecommerceModule.order.find({
      params: {
        filters: {
          and: [
            { column: "id", method: "inArray", value: ids },
            {
              column: "status",
              method: "inArray",
              value: ["delivering", "requested_cancelation"],
            },
            {
              column: "subscriptionPeriodEndsAt",
              method: "gt",
              value: new Date(now),
            },
          ],
        },
      },
    });
    const activeIds = otherOrders
      .filter(
        (order) =>
          ids.includes(order.id) &&
          order.type === "history" &&
          ["delivering", "requested_cancelation"].includes(order.status) &&
          !order.subscriptionRevokedAt &&
          order.subscriptionPeriodInvoiceId &&
          order.subscriptionPeriodStartsAt &&
          new Date(order.subscriptionPeriodStartsAt).getTime() <= now &&
          order.subscriptionPeriodEndsAt &&
          new Date(order.subscriptionPeriodEndsAt).getTime() > now,
      )
      .map((order) => order.id);
    if (!activeIds.length) return new Set();
    const lines = await this.ecommerceModule.ordersToProducts.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "inArray", value: activeIds }],
        },
      },
    });
    const roles = new Set<string>();
    for (const id of activeIds) {
      const productIds = lines
        .filter((line) => line.orderId === id)
        .map((line) => line.productId);
      const required = await this.getProductsRolesIds({ productIds });
      if (
        required.length &&
        required.every((roleId) => props.existingRolesIds.includes(roleId))
      )
        required.forEach((roleId) => roles.add(roleId));
    }
    return roles;
  }

  async getExtendedEcommerceModuleOrderById(props: {
    id: IEcommerceModuleOrder["id"];
  }): Promise<IExtendedEcommerceModuleOrder> {
    const extended = await this.ecommerceModule.order.findByIdExtended({
      id: props.id,
    });

    if (!extended) {
      throw new Error("Not found error. 'extendedOrder' not found.");
    }

    return extended as IExtendedEcommerceModuleOrder;
  }
}
