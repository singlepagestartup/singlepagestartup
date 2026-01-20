import { IRepository } from "@sps/shared-backend-api";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as subjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";
import { api as ecommerceProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { IModel as IRolesToEcommerceModuleProducts } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/model";
import { api as subjectsToBillingModuleCurrenciesApi } from "@sps/rbac/relations/subjects-to-billing-module-currencies/sdk/server";
import { api as rolesToEcommerceModuleProductsApi } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/server";
import { IModel as IEcommerceModuleOrder } from "@sps/ecommerce/models/order/sdk/model";
import { IModel as IEcommerceModuleOrdersToProducts } from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { IModel as IEcommerceModuleAttributeKey } from "@sps/ecommerce/models/attribute-key/sdk/model";
import { api as roleApi } from "@sps/rbac/models/role/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as ecommerceModuleAttributeKeyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { IModel as IEcommerceModuleAttributeKeysToAttributes } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/model";
import { IModel as IEcommerceModuleAttribute } from "@sps/ecommerce/models/attribute/sdk/model";
import { IModel as IEcommerceModuleAttributesToBillingModuleCurrencies } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/model";
import { api as ecommerceModuleAttributesToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/sdk/server";
import { api as ecommerceModuleOrdersToBillingModuleCurrenciesApi } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/server";
import { api as ecommerceModuleAttributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { IModel as ISubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/sdk/model";
import { IModel as IEcommerceModuleProduct } from "@sps/ecommerce/models/product/sdk/model";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import {
  api as ecommerceOrderApi,
  type IResult as IEcommerceOrderResult,
} from "@sps/ecommerce/models/order/sdk/server";
import { IModel as IBillingModuleCurrency } from "@sps/billing/models/currency/sdk/model";
import { api as billingModuleCurrencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as ecommerceModuleOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as ecommerceModuleAttributeKeysToAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { IModel as IEcommerceModuleProductsToAttributes } from "@sps/ecommerce/relations/products-to-attributes/sdk/model";
import { api as notificationModuleTemplateApi } from "@sps/notification/models/template/sdk/server";
import { IModel as IFileStorageModuleFile } from "@sps/file-storage/models/file/sdk/model";
import { api as fileStorageModuleFileApi } from "@sps/file-storage/models/file/sdk/server";
import { IModel as IEcommerceModuleProductsToFileStorageModuleFiles } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/model";
import { api as ecommerceModuleProductsToFileStorageModuleFilesApi } from "@sps/ecommerce/relations/products-to-file-storage-module-files/sdk/server";
import { api as ecommerceModuleOrdersToFileStorageModuleFilesApi } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/sdk/server";
import { api as ecommerceModuleProductsToAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { IModel as IEcommerceModuleOrdersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/sdk/model";
import { IModel as IEcommerceModuleOrdersToBillingModuleCurrencies } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/sdk/model";

export type IExecuteProps = {};

type IExtendedEcommerceModuleOrder = IEcommerceModuleOrder & {
  checkoutAttributes: IEcommerceOrderResult["ICheckoutAttributesResult"];
  ordersToProducts: (IEcommerceModuleOrdersToProducts & {
    product: IExtendedEcommerceModuleProduct;
  })[];
  ordersToBillingModuleCurrencies: (IEcommerceModuleOrdersToBillingModuleCurrencies & {
    billingModuleCurrency?: IBillingModuleCurrency;
  })[];
  ordersToFileStorageModuleFiles: (IEcommerceModuleOrdersToFileStorageModuleFiles & {
    fileStorageModuleFile?: IFileStorageModuleFile;
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

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const subjectsToEcommerceModuleOrders =
      await subjectsToEcommerceModuleOrdersApi.find({
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!subjectsToEcommerceModuleOrders?.length) {
      return;
    }

    const orders = await ecommerceOrderApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: subjectsToEcommerceModuleOrders.map(
                (item) => item.ecommerceModuleOrderId,
              ),
            },
            {
              column: "status",
              method: "ne",
              value: "completed",
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!orders?.length) {
      return;
    }

    for (const order of orders) {
      console.log("🚀 ~ proceed ~ order:", order);

      try {
        const extendedOrder = await this.extendedEcommerceModuleOrder(order);

        for (const subjectToEcommerceModuleOrder of subjectsToEcommerceModuleOrders) {
          if (
            subjectToEcommerceModuleOrder.ecommerceModuleOrderId !== order.id
          ) {
            continue;
          }

          const rbacSubjectsToRoles = await subjectsToRolesApi.find({
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
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });

          const existingRolesIds = rbacSubjectsToRoles?.map(
            (rbacSubjectToRole) => rbacSubjectToRole.roleId,
          );

          const productRolesIds =
            extendedOrder.ordersToProducts
              ?.map((orderToProduct) => {
                return orderToProduct.product.rolesToEcommerceModuleProduct?.map(
                  (roleToEcommerceModuleProduct) =>
                    roleToEcommerceModuleProduct.roleId,
                );
              })
              .flat()
              .filter((roleId): roleId is string => Boolean(roleId)) ?? [];

          if (
            order.status &&
            ["delivered", "canceled"].includes(order.status)
          ) {
            await this.deliveredOrCanceled({
              order,
              extendedOrder,
              subjectToEcommerceModuleOrder: {
                subjectId: subjectToEcommerceModuleOrder.subjectId,
                ecommerceModuleOrderId:
                  subjectToEcommerceModuleOrder.ecommerceModuleOrderId,
              },
              existingRolesIds,
              productRolesIds,
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
              productRolesIds,
            });
          } else if (order.status === "delivering") {
            const newRolesIds = productRolesIds?.filter(
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

      const deliveringProducts = await subjectsToEcommerceModuleOrdersApi
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
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
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

          const deliveringExtendedOrders = await ecommerceOrderApi
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
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                  "Cache-Control": "no-store",
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
    productRolesIds?: string[];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const newRolesIds = props.productRolesIds?.filter(
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

    if (topupCurrencies.length) {
      const subjectsToBillingModuleCurrencies =
        await subjectsToBillingModuleCurrenciesApi.find({
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
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Constrol": "no-store",
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

        if (existingSubjectToBillingModuleCurrency) {
          await subjectsToBillingModuleCurrenciesApi.update({
            id: existingSubjectToBillingModuleCurrency.id,
            data: {
              ...existingSubjectToBillingModuleCurrency,
              amount: String(
                parseFloat(existingSubjectToBillingModuleCurrency.amount) +
                  parseFloat(topupCurrency.amount),
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
              amount: topupCurrency.amount,
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

    if (props.extendedOrder.checkoutAttributes.type == "subscription") {
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

  async deliveredOrCanceled(props: {
    order: IEcommerceModuleOrder;
    extendedOrder: IExtendedEcommerceModuleOrder;
    subjectToEcommerceModuleOrder: {
      subjectId: string;
      ecommerceModuleOrderId: string;
    };
    existingRolesIds?: string[];
    productRolesIds?: string[];
    subjectsToRoles?: ISubjectsToRoles[];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const removeRolesIds = props.productRolesIds?.filter(
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
      await subjectsToBillingModuleCurrenciesApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
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
  }

  async notifyOrderOwner(props: {
    extendedEcommerceModuleOrder: IExtendedEcommerceModuleOrder;
    status: IEcommerceModuleOrder["status"];
  }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const notificationModuleEcommerceNotificationTemplates =
      await notificationModuleTemplateApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    const subjectsToEcommerceModuleOrders =
      await subjectsToEcommerceModuleOrdersApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!subjectsToEcommerceModuleOrders?.length) {
      return;
    }

    const subjectsToIdentities = await subjectsToIdentitiesApi.find({
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!subjectsToIdentities?.length) {
      return;
    }

    const identities = await identityApi.find({
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
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
      await notificationModuleTemplateApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    const adminRoles = await roleApi.find({
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!adminRoles?.length) {
      return;
    }

    const subjectsToRoles = await subjectsToRolesApi.find({
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    if (!subjectsToRoles?.length) {
      return;
    }

    const subjectsToIdentities = await subjectsToIdentitiesApi.find({
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!subjectsToIdentities?.length) {
      return;
    }

    const identities = await identityApi.find({
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
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
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

    const ecommerceModuleOrderToProducts =
      await ecommerceModuleOrdersToProductsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "orderId",
                method: "eq",
                value: props.id,
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!ecommerceModuleOrderToProducts?.length) {
      throw new Error(
        "Not found error. 'ecommerceModuleOrdersToProducts' not found.",
      );
    }

    const ecommerceModuleProducts = await ecommerceProductApi
      .find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: ecommerceModuleOrderToProducts.map((entity) => {
                  return entity.productId;
                }),
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      })
      .then(async (products) => {
        const extendedProducts: IExtendedEcommerceModuleProduct[] = [];

        if (!products) {
          return extendedProducts;
        }

        for (const product of products) {
          const extendedProduct =
            await this.extendedEcommerceModuleProduct(product);
          extendedProducts.push(extendedProduct);
        }

        return extendedProducts;
      });

    const ecommerceModuleOrderToBillingModuleCurrencies =
      await ecommerceModuleOrdersToBillingModuleCurrenciesApi
        .find({
          params: {
            filters: {
              and: [
                {
                  column: "orderId",
                  method: "eq",
                  value: props.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        })
        .then(async (orderToBillingModuleCurrencies) => {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY not set");
          }

          if (!orderToBillingModuleCurrencies?.length) {
            return [];
          }

          const billingModuleCurrencies = await billingModuleCurrencyApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: orderToBillingModuleCurrencies.map(
                      (item) => item.billingModuleCurrencyId,
                    ),
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });

          return orderToBillingModuleCurrencies.map(
            (ecommerceModuleOrderToBillingModuleCurrency) => {
              const billingModuleCurrency = billingModuleCurrencies?.find(
                (billingModuleCurrency) => {
                  return (
                    billingModuleCurrency.id ===
                    ecommerceModuleOrderToBillingModuleCurrency.billingModuleCurrencyId
                  );
                },
              );

              if (!billingModuleCurrency) {
                return ecommerceModuleOrderToBillingModuleCurrency;
              }

              return {
                ...ecommerceModuleOrderToBillingModuleCurrency,
                billingModuleCurrency,
              };
            },
          );
        });

    const ecommerceOrderCheckoutAttributes =
      await ecommerceOrderApi.checkoutAttributes({
        id: props.id,
        billingModuleCurrencyId:
          ecommerceModuleOrderToBillingModuleCurrencies[0]
            .billingModuleCurrencyId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    const ecommerceModuleOrdersToFileStorageModuleFiles =
      await ecommerceModuleOrdersToFileStorageModuleFilesApi
        .find({
          params: {
            filters: {
              and: [
                {
                  column: "orderId",
                  method: "eq",
                  value: props.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        })
        .then(async (ecommerceModuleOrdersToFileStorageModuleFiles) => {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY not set");
          }

          if (!ecommerceModuleOrdersToFileStorageModuleFiles?.length) {
            return [];
          }
          const fileIds = ecommerceModuleOrdersToFileStorageModuleFiles.map(
            (item) => item.fileStorageModuleFileId,
          );

          const fileStorageModuleFiles = await fileStorageModuleFileApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: fileIds,
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });

          return ecommerceModuleOrdersToFileStorageModuleFiles.map(
            (ecommerceModuleOrdersToFileStorageModuleFile) => {
              const file = fileStorageModuleFiles?.find((file) => {
                return (
                  file.id ===
                  ecommerceModuleOrdersToFileStorageModuleFile.fileStorageModuleFileId
                );
              });

              if (!file) {
                return ecommerceModuleOrdersToFileStorageModuleFile;
              }

              return {
                ...ecommerceModuleOrdersToFileStorageModuleFile,
                fileStorageModuleFile: file,
              };
            },
          );
        });

    return {
      ...props,
      checkoutAttributes: ecommerceOrderCheckoutAttributes,
      ordersToProducts: ecommerceModuleOrderToProducts.map(
        (ecommerceModuleOrderToProduct) => {
          const product = ecommerceModuleProducts.find(
            (ecommerceModuleProduct) => {
              return (
                ecommerceModuleProduct.id ===
                ecommerceModuleOrderToProduct.productId
              );
            },
          );

          if (!product) {
            throw new Error("Not found error. 'product' not found.");
          }

          return {
            ...ecommerceModuleOrderToProduct,
            product,
          };
        },
      ),
      ordersToBillingModuleCurrencies:
        ecommerceModuleOrderToBillingModuleCurrencies,
      ordersToFileStorageModuleFiles:
        ecommerceModuleOrdersToFileStorageModuleFiles,
    };
  }

  async extendedEcommerceModuleProduct(
    props: IEcommerceModuleProduct,
  ): Promise<IExtendedEcommerceModuleProduct> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const rolesToEcommerceModuleProducts =
      await rolesToEcommerceModuleProductsApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    const ecommerceModuleProductToAttributes =
      await ecommerceModuleProductsToAttributesApi
        .find({
          params: {
            filters: {
              and: [
                {
                  column: "productId",
                  method: "eq",
                  value: props.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        })
        .then(async (ecommerceModuleProductsToAttributes) => {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY not set");
          }

          if (!ecommerceModuleProductsToAttributes?.length) {
            return [];
          }

          const extendedEcommerceModuleAttributeByIdPromises =
            ecommerceModuleProductsToAttributes.map(
              async (ecommerceModuleProductsToAttribute) => {
                const extendedEcommerceModuleAttribute =
                  await this.extendedEcommerceModuleAttributeById({
                    id: ecommerceModuleProductsToAttribute.attributeId,
                  });

                return {
                  ...ecommerceModuleProductsToAttribute,
                  attribute: extendedEcommerceModuleAttribute,
                };
              },
            );

          const ecommerceModuleProductsToAttributesWithAttributes =
            await Promise.all(extendedEcommerceModuleAttributeByIdPromises);

          return ecommerceModuleProductsToAttributesWithAttributes;
        });

    const ecommerceModuleProductsToFileStorageModuleFiles =
      await ecommerceModuleProductsToFileStorageModuleFilesApi
        .find({
          params: {
            filters: {
              and: [
                {
                  column: "productId",
                  method: "eq",
                  value: props.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        })
        .then(async (ecommerceModuleProductsToFileStorageModuleFiles) => {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY not set");
          }

          if (!ecommerceModuleProductsToFileStorageModuleFiles?.length) {
            return [];
          }

          const fileIds = ecommerceModuleProductsToFileStorageModuleFiles.map(
            (item) => item.fileStorageModuleFileId,
          );

          const fileStorageModuleFiles = await fileStorageModuleFileApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: fileIds,
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });

          return ecommerceModuleProductsToFileStorageModuleFiles.map(
            (ecommerceModuleProductsToFileStorageModuleFile) => {
              const file = fileStorageModuleFiles?.find((file) => {
                return (
                  file.id ===
                  ecommerceModuleProductsToFileStorageModuleFile.fileStorageModuleFileId
                );
              });

              if (!file) {
                return ecommerceModuleProductsToFileStorageModuleFile;
              }

              return {
                ...ecommerceModuleProductsToFileStorageModuleFile,
                file,
              };
            },
          );
        });

    return {
      ...props,
      rolesToEcommerceModuleProduct: rolesToEcommerceModuleProducts,
      productsToAttributes: ecommerceModuleProductToAttributes,
      productsToFileStorageModuleFiles:
        ecommerceModuleProductsToFileStorageModuleFiles,
    };
  }

  async extendedEcommerceModuleAttributeById(props: {
    id: IEcommerceModuleAttribute["id"];
  }): Promise<IExtendedEcommerceModuleAttribute> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }
    const ecommerceModuleAttribute = await ecommerceModuleAttributeApi.findById(
      {
        id: props.id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      },
    );

    if (!ecommerceModuleAttribute) {
      throw new Error("Not found error. 'attribute' not found.");
    }

    const ecommerceModuleAttributeToBillingModuleCurrencies =
      await ecommerceModuleAttributesToBillingModuleCurrenciesApi
        .find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "eq",
                  value: props.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        })
        .then(async (ecommerceModuleAttributeToBillingModuleCurrencies) => {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY not set");
          }

          if (!ecommerceModuleAttributeToBillingModuleCurrencies?.length) {
            return [];
          }

          const billingModuleCurrencies = await billingModuleCurrencyApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value:
                      ecommerceModuleAttributeToBillingModuleCurrencies.map(
                        (item) => item.billingModuleCurrencyId,
                      ),
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });

          return ecommerceModuleAttributeToBillingModuleCurrencies.map(
            (ecommerceModuleAttributeToBillingModuleCurrency) => {
              const billingModuleCurrency = billingModuleCurrencies?.find(
                (billingModuleCurrency) => {
                  return (
                    billingModuleCurrency.id ===
                    ecommerceModuleAttributeToBillingModuleCurrency.billingModuleCurrencyId
                  );
                },
              );

              if (!billingModuleCurrency) {
                return ecommerceModuleAttributeToBillingModuleCurrency;
              }

              return {
                ...ecommerceModuleAttributeToBillingModuleCurrency,
                billingModuleCurrency,
              };
            },
          );
        });

    const ecommerceModuleAttributeKeysToAttribute =
      await ecommerceModuleAttributeKeysToAttributesApi
        .find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeId",
                  method: "eq",
                  value: props.id,
                },
              ],
            },
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              "Cache-Control": "no-store",
            },
          },
        })
        .then(async (ecommerceModuleAttributeKeysToAttributes) => {
          if (!RBAC_SECRET_KEY) {
            throw new Error("Configuration error. RBAC_SECRET_KEY not set");
          }

          if (!ecommerceModuleAttributeKeysToAttributes?.length) {
            return [];
          }

          const attributeKeys = await ecommerceModuleAttributeKeyApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "id",
                    method: "inArray",
                    value: ecommerceModuleAttributeKeysToAttributes.map(
                      (item) => item.attributeKeyId,
                    ),
                  },
                ],
              },
            },
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                "Cache-Control": "no-store",
              },
            },
          });

          return ecommerceModuleAttributeKeysToAttributes.map(
            (ecommerceModuleAttributeKeyToAttribute) => {
              const attributeKey = attributeKeys?.find((attributeKey) => {
                return (
                  attributeKey.id ===
                  ecommerceModuleAttributeKeyToAttribute.attributeKeyId
                );
              });

              if (!attributeKey) {
                return ecommerceModuleAttributeKeyToAttribute;
              }

              return {
                ...ecommerceModuleAttributeKeyToAttribute,
                attributeKey,
              };
            },
          );
        });

    return {
      ...ecommerceModuleAttribute,
      attributeKeysToAttribute: ecommerceModuleAttributeKeysToAttribute,
      attributesToBillingModuleCurrencies:
        ecommerceModuleAttributeToBillingModuleCurrencies,
    };
  }
}
