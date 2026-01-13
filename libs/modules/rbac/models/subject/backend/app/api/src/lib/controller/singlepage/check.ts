import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { api as subjectsToEcommerceModuleOrdersApi } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/sdk/server";
import { Service } from "../../service";
import { api as ecommerceProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { IModel as IRolesToEcommerceModuleProducts } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/model";
import { api as rolesToEcommerceModuleProductsApi } from "@sps/rbac/relations/roles-to-ecommerce-module-products/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as ecommerceOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
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

      console.log(
        "🚀 ~ execute ~ subjectsToEcommerceModuleOrders:",
        subjectsToEcommerceModuleOrders,
      );

      if (!subjectsToEcommerceModuleOrders?.length) {
        return c.json({
          data: {
            ok: true,
          },
        });
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

      console.log("🚀 ~ execute ~ orders:", orders);

      if (!orders?.length) {
        throw new Error("Not Found error. No orders found");
      }

      for (const order of orders) {
        try {
          const ordersToProducts = await ecommerceOrdersToProductsApi.find({
            params: {
              filters: {
                and: [
                  {
                    column: "orderId",
                    method: "eq",
                    value: order.id,
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

          let rolesToEcommerceModuleProducts:
            | IRolesToEcommerceModuleProducts[]
            | undefined;

          if (ordersToProducts?.length) {
            const products = await ecommerceProductApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "id",
                      method: "inArray",
                      value: ordersToProducts?.map(
                        (orderToProduct) => orderToProduct.productId,
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

            if (products?.length) {
              const productIds = products.map((product) => product.id);

              rolesToEcommerceModuleProducts =
                await rolesToEcommerceModuleProductsApi.find({
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
                  options: {
                    headers: {
                      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                      "Cache-Control": "no-store",
                    },
                  },
                });
            }
          }

          if (subjectsToEcommerceModuleOrders?.length) {
            for (const rbacSubjectToEcommerceModuleOrder of subjectsToEcommerceModuleOrders) {
              const rbacSubjectsToRoles = await subjectsToRolesApi.find({
                params: {
                  filters: {
                    and: [
                      {
                        column: "subjectId",
                        method: "eq",
                        value: rbacSubjectToEcommerceModuleOrder.subjectId,
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

              console.log("🚀 ~ execute ~ existingRolesIds:", existingRolesIds);

              const productRolesIds = rolesToEcommerceModuleProducts?.map(
                (roleToEcommerceModuleProduct) =>
                  roleToEcommerceModuleProduct.roleId,
              );

              if (order.status === "delivering") {
                const newRolesIds = productRolesIds?.filter(
                  (productRoleId) => !existingRolesIds?.includes(productRoleId),
                );

                if (newRolesIds?.length) {
                  for (const newRoleId of newRolesIds) {
                    await subjectsToRolesApi.create({
                      data: {
                        subjectId: rbacSubjectToEcommerceModuleOrder.subjectId,
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
              } else if (
                order.status &&
                ["paying", "delivered"].includes(order.status)
              ) {
                const removeRolesIds = productRolesIds?.filter(
                  (productRoleId) => existingRolesIds?.includes(productRoleId),
                );

                console.log("🚀 ~ execute ~ removeRolesIds:", removeRolesIds);

                if (removeRolesIds?.length) {
                  for (const removeRoleId of removeRolesIds) {
                    const rbacSubjectToRole = rbacSubjectsToRoles?.find(
                      (rbacSubjectToRole) =>
                        rbacSubjectToRole.roleId === removeRoleId,
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
              }
            }
          }
        } catch (error) {
          console.log("🚀 ~ execute ~ error:", error);
        }
      }

      return c.json({
        data: {
          ok: true,
        },
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
