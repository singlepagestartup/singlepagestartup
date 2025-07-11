import {
  NEXT_PUBLIC_API_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../service";
import { api as notificationTopicApi } from "@sps/notification/models/topic/sdk/server";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";
import { api as notificationNotificationApi } from "@sps/notification/models/notification/sdk/server";
import { api as notificationNotificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as notificationTopicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as ecommerceOrderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as ecommerceProductApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as ecommerceOrdersToProductsApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as fileStorageFileApi } from "@sps/file-storage/models/file/sdk/server";
import { api as ecommerceOrdersToFileStorageModuleFilesApi } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC_SECRET_KEY not set",
        });
      }

      const uuid = c.req.param("uuid");

      if (!uuid) {
        throw new HTTPException(400, {
          message: "No uuid provided",
        });
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new HTTPException(400, {
          message: "Invalid body",
        });
      }

      const data = JSON.parse(body["data"]);

      const subjectsToIdentities = await subjectsToIdentitiesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: uuid,
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
        throw new HTTPException(404, {
          message: "No subjects to identities found",
        });
      }

      const identities = await identityApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: subjectsToIdentities.map((item) => item.identityId),
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

      if (!identities?.length) {
        throw new HTTPException(404, {
          message: "No identities found",
        });
      }

      if (!data.notification?.notification?.method) {
        throw new HTTPException(400, {
          message: "No notification.notification.method provided",
        });
      }

      if (!data.notification?.topic?.slug) {
        throw new HTTPException(400, {
          message: "No notification.topic.slug provided",
        });
      }

      const topics = await notificationTopicApi.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: data.notification.topic.slug,
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

      if (!topics?.length) {
        throw new HTTPException(404, {
          message: "No topic found",
        });
      }

      const topic = topics[0];

      if (!data.notification?.template?.variant) {
        throw new HTTPException(400, {
          message: "No template variant provided",
        });
      }

      if (!["email"].includes(data.notification.notification.method)) {
        throw new HTTPException(400, {
          message: "Invalid notification method",
        });
      }

      const templates = await notificationTemplateApi.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "eq",
                value: data.notification.template.variant,
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

      if (!templates?.length) {
        throw new HTTPException(404, {
          message: "No template found",
        });
      }

      const template = templates[0];

      const notifications: {
        data: string;
        method: string;
        reciever: string;
        attachments: string;
      }[] = [];

      if (data.ecommerce?.order?.id) {
        const order = await ecommerceOrderApi.findById({
          id: data.ecommerce.order.id,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (!order) {
          throw new HTTPException(404, {
            message: "No order found",
          });
        }

        if (order.status === "approving") {
          let notificationData = JSON.parse(
            data.notification.notification.data,
          );

          notificationData.ecommerce = {
            ...notificationData.ecommerce,
            order: {
              ...notificationData.ecommerce.order,
            },
          };

          const attachments: {
            type: string;
            url: string;
          }[] = [];

          const ecommerceOrdersToFileStorageModuleFiles =
            await ecommerceOrdersToFileStorageModuleFilesApi.find({
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
                },
              },
            });

          const ecommerceOrdersToProducts =
            await ecommerceOrdersToProductsApi.find({
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
                },
              },
            });

          if (ecommerceOrdersToProducts?.length) {
            const ecommerceOrderToProduct = ecommerceOrdersToProducts[0];

            const product = await ecommerceProductApi.findById({
              id: ecommerceOrderToProduct.productId,
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            });

            if (product) {
              if (ecommerceOrdersToFileStorageModuleFiles?.length) {
                for (const ecommerceOrderToFileStorageModuleFile of ecommerceOrdersToFileStorageModuleFiles) {
                  const attachmentFiles = await fileStorageFileApi.find({
                    params: {
                      filters: {
                        and: [
                          {
                            column: "id",
                            method: "eq",
                            value:
                              ecommerceOrderToFileStorageModuleFile.fileStorageModuleFileId,
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

                  if (attachmentFiles?.length) {
                    for (const attachmentFile of attachmentFiles) {
                      attachments.push({
                        type: "image",
                        url: `${NEXT_PUBLIC_API_SERVICE_URL}/public${attachmentFile.file}`,
                      });

                      const ecommerceOrderToFileStorageModuleFileAdded =
                        notificationData.ecommerce.order.ordersToFileStorageModuleFiles.find(
                          (orderToFileStorageFile) => {
                            return (
                              orderToFileStorageFile.id ===
                              ecommerceOrderToFileStorageModuleFile.id
                            );
                          },
                        );

                      if (!ecommerceOrderToFileStorageModuleFileAdded) {
                        notificationData.ecommerce.order.ordersToFileStorageModuleFiles.push(
                          {
                            ...ecommerceOrderToFileStorageModuleFile,
                            fileStorageModuleFile: attachmentFile,
                          },
                        );
                      }
                    }
                  }
                }
              }
            }
          }

          const type = template.variant.includes("email")
            ? "email"
            : template.variant.includes("telegram")
              ? "telegram"
              : undefined;

          for (const identity of identities) {
            if (type === "email") {
              if (!identity.email) {
                continue;
              }

              notifications.push({
                ...data.notification.notification,
                data: JSON.stringify({ ...notificationData }),
                reciever: identity.email,
                attachments: attachments ? JSON.stringify(attachments) : "[]",
              });
            } else if (type === "telegram") {
              if (identity.provider !== "telegram") {
                continue;
              }

              notifications.push({
                ...data.notification.notification,
                data: JSON.stringify({ ...notificationData }),
                reciever: identity.account,
                attachments: attachments ? JSON.stringify(attachments) : "[]",
              });
            }
          }
        }
      } else {
        const type = template.variant.includes("email")
          ? "email"
          : template.variant.includes("telegram")
            ? "telegram"
            : undefined;

        for (const identity of identities) {
          if (type === "email") {
            if (!identity.email) {
              continue;
            }

            notifications.push({
              ...data.notification.notification,
              data: data.notification.notification.data,
              reciever: identity.email,
              attachments: "[]",
            });
          } else if (type === "telegram") {
            if (identity.provider !== "telegram") {
              continue;
            }

            notifications.push({
              ...data.notification.notification,
              data: data.notification.notification.data,
              reciever: identity.account,
              attachments: "[]",
            });
          }
        }
      }

      for (const notification of notifications) {
        const createdNotification = await notificationNotificationApi.create({
          data: {
            ...notification,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        if (!createdNotification) {
          continue;
        }

        await notificationNotificationsToTemplatesApi.create({
          data: {
            notificationId: createdNotification.id,
            templateId: template.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        await notificationTopicsToNotificationsApi.create({
          data: {
            topicId: topic.id,
            notificationId: createdNotification.id,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });

        await notificationNotificationApi.send({
          id: createdNotification.id,
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        });
      }

      const entity = await this.service.findById({
        id: uuid,
      });

      if (!entity) {
        throw new HTTPException(404, {
          message: "No entity found",
        });
      }

      return c.json({
        data: entity,
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
