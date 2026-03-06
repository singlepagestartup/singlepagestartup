import { DI, type IRepository } from "@sps/shared-backend-api";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { IModel as IRolesToEcommerceModuleProducts } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/model";
import { api as subjectsToBillingModuleCurrenciesApi } from "@sps/rbac/relations/subjects-to-billing-module-currencies/sdk/server";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IEcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { IModel as IEcommerceModuleAttributeKey } from "@sps/ecommerce/models/attribute-key/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { IModel as IEcommerceModuleAttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/model";
import { IModel as IEcommerceModuleAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { IModel as IEcommerceModuleAttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { IModel as ISubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/sdk/model";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import {
  api as ecommerceOrderApi,
  type IResult as IEcommerceOrderResult,
} from "@sps/ecommerce/models/order/sdk/server";
import { api as ecommerceProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { IModel as IEcommerceModuleProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/sdk/model";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { IModel as IEcommerceModuleProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/model";
import { IModel as IEcommerceModuleOrdersToBillingModulePaymentIntents } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import { IModel as IBillingModuleInvoice } from "@sps/billing/models/invoice/sdk/model";
import { IModel as IBillingModulePaymentIntent } from "@sps/billing/models/payment-intent/sdk/model";
import { IModel as IBillingModulePaymentIntentsToCurrecies } from "@sps/billing/relations/payment-intents-to-currencies/sdk/model";
import { IModel as IBillingModulePaymentIntentsToInvoices } from "@sps/billing/relations/payment-intents-to-invoices/sdk/model";
import { IModel as IEcommerceModuleOrdersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/sdk/model";
import { IModel as IEcommerceModuleOrdersToBillingModuleCurrencies } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/model";
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

export type IExecuteProps = {
  subjectId?: string;
};

type IExtendedEcommerceModuleOrder = IEcommerceModuleOrder & {
  checkoutAttributesByCurrency: IEcommerceOrderResult["ICheckoutAttributesByCurrencyResult"];
  ordersToProducts: (IEcommerceModuleOrdersToProducts & {
    product: IExtendedEcommerceModuleProduct;
  })[];
  ordersToBillingModuleCurrencies: (IEcommerceModuleOrdersToBillingModuleCurrencies & {
    billingModuleCurrency?: IBillingModuleCurrency;
  })[];
  ordersToFileStorageModuleFiles: (IEcommerceModuleOrdersToFileStorageModuleFiles & {
    fileStorageModuleFile?: IFileStorageModuleFile;
  })[];
  ordersToBillingModulePaymentIntents: (IEcommerceModuleOrdersToBillingModulePaymentIntents & {
    billingModulePaymentIntent: IBillingModulePaymentIntent & {
      paymentIntentsToCurrencies: (IBillingModulePaymentIntentsToCurrecies & {
        currency: IBillingModuleCurrency;
      })[];
      paymentIntentsToInvoices: (IBillingModulePaymentIntentsToInvoices & {
        invoice: IBillingModuleInvoice;
      })[];
    };
  })[];
};

type IExtendedEcommerceModuleAttribute = IEcommerceModuleAttribute & {
  attributeKeysToAttribute?: (IEcommerceModuleAttributeKeysToAttributes & {
    attributeKey?: IEcommerceModuleAttributeKey;
  })[];
  attributesToBillingModuleCurrencies?: (IEcommerceModuleAttributesToBillingModuleCurrencies & {
    billingModuleCurrency?: IBillingModuleCurrency;
  })[];
};

type IExtendedEcommerceModuleProduct = IEcommerceModuleProduct & {
  rolesToEcommerceModuleProduct?: IRolesToEcommerceModuleProducts[] | undefined;
  productsToAttributes?: (IEcommerceModuleProductsToAttributes & {
    attribute: IExtendedEcommerceModuleAttribute;
  })[];
  productsToFileStorageModuleFiles?: (IEcommerceModuleProductsToFileStorageModuleFiles & {
    fileStorageModuleFile?: IFileStorageModuleFile;
  })[];
};

@injectable()
export class Service {
  repository: IRepository;
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

  constructor(
    @inject(DI.IRepository) repository: IRepository,
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

    const subjectsToEcommerceModuleOrders =
      await this.subjectsToEcommerceModuleOrders.find(
        props.subjectId
          ? {
              params: {
                filters: {
                  and: [
                    {
                      column: "subjectId",
                      method: "eq",
                      value: props.subjectId,
                    },
                  ],
                },
              },
            }
          : {},
      );

    if (!subjectsToEcommerceModuleOrders?.length) {
      return;
    }

    const orderIds = subjectsToEcommerceModuleOrders
      .map((item) => item.ecommerceModuleOrderId)
      .filter((orderId): orderId is string => Boolean(orderId));

    if (!orderIds.length) {
      return;
    }

    const orders = await this.ecommerceModule.order.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: orderIds,
            },
            {
              column: "status",
              method: "ne",
              value: "completed",
            },
            {
              column: "status",
              method: "ne",
              value: "canceled",
            },
          ],
        },
        orderBy: {
          and: [
            {
              column: "createdAt",
              method: "asc",
            },
          ],
        },
      },
    });

    if (!orders?.length) {
      return;
    }

    for (const order of orders) {
      try {
        const extendedOrder = await this.extendedEcommerceModuleOrder(order);

        for (const subjectToEcommerceModuleOrder of subjectsToEcommerceModuleOrders) {
          if (
            subjectToEcommerceModuleOrder.ecommerceModuleOrderId !== order.id
          ) {
            continue;
          }

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

          const productsRolesIds =
            extendedOrder.ordersToProducts
              ?.map((orderToProduct) => {
                return orderToProduct.product.rolesToEcommerceModuleProduct?.map(
                  (roleToEcommerceModuleProduct) =>
                    roleToEcommerceModuleProduct.roleId,
                );
              })
              .flat()
              .filter((roleId): roleId is string => Boolean(roleId)) ?? [];

          if (order.status && order.status === "delivered") {
            await this.delivered({
              order,
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
          } else if (order.status === "paid") {
            await this.fromPaidStatus({
              order,
              extendedOrder,
              subjectToEcommerceModuleOrder: {
                subjectId: subjectToEcommerceModuleOrder.subjectId,
                ecommerceModuleOrderId:
                  subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
              },
              existingRolesIds,
              productsRolesIds,
            });
          } else if (order.status === "delivering") {
            const newRolesIds = productsRolesIds?.filter(
              (productRoleId) =>
                productRoleId && !existingRolesIds?.includes(productRoleId),
            );

            if (newRolesIds?.length) {
              for (const newRoleId of newRolesIds) {
                await subjectsToRolesApi.create({
                  data: {
                    subjectId: subjectToEcommerceModuleOrder.subjectId,
                    roleId: newRoleId,
                  },
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                  },
                });
              }
            }
          } else if (order.status === "canceling") {
            const toRemoveRolesIds = productsRolesIds?.filter(
              (productRoleId) =>
                productRoleId && existingRolesIds?.includes(productRoleId),
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

                await subjectsToRolesApi.delete({
                  id: toRemoveSubjectToRole?.id,
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                    },
                  },
                });
              }
            }

            const subjectsToBillingModuleCurrencies =
              await this.subjectsToBillingModuleCurrencies
                .find({
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
                })
                .catch(() => undefined);

            if (subjectsToBillingModuleCurrencies?.length) {
              for (const subjectToBillingModuleCurrency of subjectsToBillingModuleCurrencies) {
                await subjectsToBillingModuleCurrenciesApi.update({
                  id: subjectToBillingModuleCurrency.id,
                  data: {
                    ...subjectToBillingModuleCurrency,
                    amount: "0",
                  },
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                      "Cache-Constrol": "no-store",
                    },
                  },
                });
              }
            }

            await ecommerceOrderApi.update({
              id: order.id,
              data: { ...order, status: "canceled" },
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });
          }
        }
      } catch (error) {
        //
      }
    }
  }

  async collectTopupCurrencies(props: {
    extendedOrder: IExtendedEcommerceModuleOrder;
    subjectToEcommerceModuleOrder: {
      subjectId: string;
      ecommerceModuleOrderId: string;
    };
  }): Promise<
    {
      billingModuleCurrencyId: IEcommerceModuleAttributesToBillingModuleCurrencies["billingModuleCurrencyId"];
      billingModuleCurrency: IBillingModuleCurrency;
      amount: string;
    }[]
  > {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. 'RBAC_SECRET_KEY' not set.");
    }

    const topupCurrencies: {
      billingModuleCurrencyId: IEcommerceModuleAttributesToBillingModuleCurrencies["billingModuleCurrencyId"];
      billingModuleCurrency: IBillingModuleCurrency;
      amount: string;
    }[] = [];

    for (const orderToProduct of props.extendedOrder.ordersToProducts) {
      const productsToAttributes =
        orderToProduct.product.productsToAttributes ?? [];

      const deliveringProducts = await this.subjectsToEcommerceModuleOrders
        .find({
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
        })
        .then(async (subjectToEcommerceModuleOrders) => {
          if (!subjectToEcommerceModuleOrders?.length) {
            return [];
          }

          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. 'RBAC_SECRET_KEY' not set.");
          }

          const deliveringExtendedOrders = await this.ecommerceModule.order
            .find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: subjectToEcommerceModuleOrders?.map(
                        (subjectToEcommerceModuleOrder) => {
                          return subjectToEcommerceModuleOrder.ecommerceModuleOrderId;
                        },
                      ),
                    },
                    {
                      column: "status",
                      method: "eq",
                      value: "delivering",
                    },
                  ],
                },
              },
            })
            .then(async (ecommerceModuleOrders) => {
              let orders: IExtendedEcommerceModuleOrder[] = [];

              if (!ecommerceModuleOrders?.length) {
                return ecommerceModuleOrders;
              }

              for (const ecommerceModuleOrder of ecommerceModuleOrders) {
                const extended =
                  await this.extendedEcommerceModuleOrder(ecommerceModuleOrder);

                orders.push(extended);
              }

              return orders
                .map((order) => {
                  return order.ordersToProducts.map((orderToProduct) => {
                    return orderToProduct.product;
                  });
                })
                .flat(1);
            });

          return deliveringExtendedOrders;
        });

      for (const productToAttribute of productsToAttributes) {
        const { attribute } = productToAttribute;

        const isTopupAttribute =
          attribute.attributeKeysToAttribute?.some(
            (attributeKeyToAttribute) =>
              attributeKeyToAttribute.attributeKey?.type === "topup",
          ) ?? false;

        if (!isTopupAttribute) {
          continue;
        }

        const attributesToBillingModuleCurrencies =
          attribute.attributesToBillingModuleCurrencies ?? [];

        for (const attributeToBillingModuleCurrency of attributesToBillingModuleCurrencies) {
          if (!attributeToBillingModuleCurrency.billingModuleCurrency) {
            throw new Error(
              "Not found error. 'attributeToBillingModuleCurrency.billingModuleCurrency' not found.",
            );
          }

          if (typeof attribute.number !== "string") {
            throw new Error(
              "Validation error. 'attribute.number' can not be null for topup attributes.",
            );
          }

          if (
            deliveringProducts?.find((deliveringProduct) => {
              return deliveringProduct.id === orderToProduct.productId;
            })
          ) {
            continue;
          }

          topupCurrencies.push({
            billingModuleCurrencyId:
              attributeToBillingModuleCurrency.billingModuleCurrencyId,
            billingModuleCurrency:
              attributeToBillingModuleCurrency.billingModuleCurrency,
            amount: attribute.number,
          });
        }
      }
    }

    return topupCurrencies;
  }

  async fromPaidStatus(props: {
    order: IEcommerceModuleOrder;
    extendedOrder: IExtendedEcommerceModuleOrder;
    subjectToEcommerceModuleOrder: {
      subjectId: string;
      ecommerceModuleOrderId: string;
    };
    existingRolesIds?: string[];
    productsRolesIds?: string[];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const newRolesIds = props.productsRolesIds?.filter(
      (productRoleId) =>
        productRoleId && !props.existingRolesIds?.includes(productRoleId),
    );

    if (newRolesIds?.length) {
      for (const newRoleId of newRolesIds) {
        await subjectsToRolesApi.create({
          data: {
            subjectId: props.subjectToEcommerceModuleOrder.subjectId,
            roleId: newRoleId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }
    }

    const topupCurrencies = await this.collectTopupCurrencies({
      extendedOrder: props.extendedOrder,
      subjectToEcommerceModuleOrder: props.subjectToEcommerceModuleOrder,
    });

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

    if (rbacSubjectsToSocialModuleProfiles?.length) {
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
          await subjectsToBillingModuleCurrenciesApi.update({
            id: existingSubjectToBillingModuleCurrency.id,
            data: {
              ...existingSubjectToBillingModuleCurrency,
              amount: String(
                parseFloat(existingSubjectToBillingModuleCurrency.amount) +
                  topupAmount,
              ),
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          });
        } else {
          await subjectsToBillingModuleCurrenciesApi.create({
            data: {
              subjectId: props.subjectToEcommerceModuleOrder.subjectId,
              billingModuleCurrencyId: topupCurrency.billingModuleCurrency.id,
              amount: String(topupAmount),
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

    const updateEcommerceOrderData = {
      ...props.order,
      status: "approving",
    };

    if (
      props.extendedOrder.checkoutAttributesByCurrency.type == "subscription"
    ) {
      updateEcommerceOrderData.status = "delivering";
    }

    await ecommerceOrderApi.update({
      id: props.order.id,
      data: updateEcommerceOrderData,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    await this.notifyAdmin({
      extendedEcommerceModuleOrder: props.extendedOrder,
      status: updateEcommerceOrderData.status,
    }).catch((error) => {
      //
    });

    await this.notifyOrderOwner({
      extendedEcommerceModuleOrder: props.extendedOrder,
      status: updateEcommerceOrderData.status,
    }).catch((error) => {
      //
    });
  }

  async delivered(props: {
    order: IEcommerceModuleOrder;
    extendedOrder: IExtendedEcommerceModuleOrder;
    subjectToEcommerceModuleOrder: {
      subjectId: string;
      ecommerceModuleOrderId: string;
    };
    existingRolesIds?: string[];
    productsRolesIds?: string[];
    subjectsToRoles?: ISubjectsToRoles[];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const removeRolesIds = props.productsRolesIds?.filter(
      (productRoleId) =>
        productRoleId && props.existingRolesIds?.includes(productRoleId),
    );

    if (removeRolesIds?.length) {
      for (const removeRoleId of removeRolesIds) {
        const rbacSubjectToRole = props.subjectsToRoles?.find(
          (rbacSubjectToRole) => rbacSubjectToRole.roleId === removeRoleId,
        );

        if (!rbacSubjectToRole) {
          continue;
        }

        await subjectsToRolesApi.delete({
          id: rbacSubjectToRole.id,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }
    }

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
              {
                column: "amount",
                method: "ne",
                value: "0",
              },
            ],
          },
        },
      });

    if (subjectsToBillingModuleCurrencies?.length) {
      for (const subjectToBillingModuleCurrency of subjectsToBillingModuleCurrencies) {
        await subjectsToBillingModuleCurrenciesApi.update({
          id: subjectToBillingModuleCurrency.id,
          data: {
            ...subjectToBillingModuleCurrency,
            amount: "0",
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        });
      }
    }

    const needToCreateSubscriptionOrder =
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
      .flat(1);

    const invoices = props.extendedOrder.ordersToBillingModulePaymentIntents
      .map((orderToBillingModulePaymentIntent) => {
        return orderToBillingModulePaymentIntent.billingModulePaymentIntent.paymentIntentsToInvoices.map(
          (paymentIntentsToInvoices) => {
            return paymentIntentsToInvoices.invoice;
          },
        );
      })
      .flat(1);

    const allOrderCurrenciesAreTheSame = currencies.every((entity) => {
      return currencies[0].id === entity.id;
    });

    const allProvidersAreTheSame = invoices.every((invoice) => {
      return invoice.provider === invoices[0].provider;
    });

    await ecommerceOrderApi.update({
      id: props.extendedOrder.id,
      data: {
        ...props.extendedOrder,
        status: "completed",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (
      needToCreateSubscriptionOrder &&
      allOrderCurrenciesAreTheSame &&
      allProvidersAreTheSame
    ) {
      const provider = invoices[0].provider;
      const currency = currencies[0];

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
              await api.ecommerceModuleProductCheckout({
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

  async extendedEcommerceModuleOrder(
    props: IEcommerceModuleOrder,
  ): Promise<IExtendedEcommerceModuleOrder> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const extendedOrder = await ecommerceOrderApi.extended({
      id: props.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!extendedOrder) {
      throw new Error("Not found error. 'extendedOrder' not found.");
    }

    const productIds =
      extendedOrder.ordersToProducts?.map((item) => item.productId) ?? [];

    if (!productIds.length) {
      return extendedOrder as IExtendedEcommerceModuleOrder;
    }

    const rolesToEcommerceModuleProducts =
      await this.rolesToEcommerceModuleProducts.find({
        params: {
          filters: {
            and: [
              {
                column: "ecommerceModuleProductId",
                method: "inArray",
                value: productIds,
              },
            ],
          },
        },
      });

    return {
      ...extendedOrder,
      ordersToProducts: extendedOrder.ordersToProducts.map((orderToProduct) => {
        return {
          ...orderToProduct,
          product: {
            ...orderToProduct.product,
            rolesToEcommerceModuleProduct:
              rolesToEcommerceModuleProducts?.filter((item) => {
                return (
                  item.ecommerceModuleProductId === orderToProduct.productId
                );
              }) ?? [],
          },
        };
      }),
    } as IExtendedEcommerceModuleOrder;
  }

  async extendedEcommerceModuleProduct(
    props: IEcommerceModuleProduct,
  ): Promise<IExtendedEcommerceModuleProduct> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const extendedProduct = await ecommerceProductApi.extended({
      id: props.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!extendedProduct) {
      throw new Error("Not found error. 'extendedProduct' not found.");
    }

    const rolesToEcommerceModuleProducts =
      await this.rolesToEcommerceModuleProducts.find({
        params: {
          filters: {
            and: [
              {
                column: "ecommerceModuleProductId",
                method: "eq",
                value: props.id,
              },
            ],
          },
        },
      });

    return {
      ...extendedProduct,
      rolesToEcommerceModuleProduct: rolesToEcommerceModuleProducts,
    };
  }
}
