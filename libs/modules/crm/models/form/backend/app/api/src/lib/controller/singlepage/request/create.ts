import { ADMIN_EMAILS, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { api } from "@sps/crm/models/form/sdk/server";
import { api as inputApi } from "@sps/crm/models/input/sdk/server";
import { api as formsToInputsApi } from "@sps/crm/relations/forms-to-inputs/sdk/server";
import { api as formsToRequestsApi } from "@sps/crm/relations/forms-to-requests/sdk/server";
import { api as requestApi } from "@sps/crm/models/request/sdk/server";
import { Service } from "../../../service";
import { api as notificationTopicApi } from "@sps/notification/models/topic/sdk/server";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";
import { api as notificationNotificationApi } from "@sps/notification/models/notification/sdk/server";
import { api as notificationNotificationsToTemplatesApi } from "@sps/notification/relations/notifications-to-templates/sdk/server";
import { api as notificationTopicsToNotificationsApi } from "@sps/notification/relations/topics-to-notifications/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Invalid id");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error("Invalid data");
      }

      const data = JSON.parse(body["data"]);

      const entity = await api.findById({
        id,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!entity) {
        throw new Error("Form not found");
      }

      const formsToInputs = await formsToInputsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "formId",
                method: "eq",
                value: id,
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

      if (!formsToInputs) {
        throw new Error("No inputs found for form with id " + id);
      }

      const inputs = await inputApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: formsToInputs?.map((formToInput) => {
                  return formToInput.inputId;
                }),
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

      const request = await requestApi.create({
        data: {
          payload: data,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!request) {
        throw new Error("Request not created");
      }

      const formsToRequests = await formsToRequestsApi.create({
        data: {
          formId: id,
          requestId: request.id,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      const topics = await notificationTopicApi.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: "information",
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!topics?.length) {
        throw new Error("No topic found");
      }

      const topic = topics[0];

      const templates = await notificationTemplateApi.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "eq",
                value: "request-from-website",
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
          next: {
            cache: "no-store",
          },
        },
      });

      if (!templates?.length) {
        throw new Error("No template found");
      }

      const template = templates[0];

      const notifications: {
        data: string;
        method: string;
        reciever: string;
        attachments: string;
      }[] = ADMIN_EMAILS.split(",").length
        ? ADMIN_EMAILS.split(",").map((email) => {
            return {
              data: JSON.stringify({
                data,
              }),
              method: "email",
              reciever: email,
              attachments: "[]",
            };
          })
        : [];

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

      return c.json(
        {
          data: {
            ...entity,
            formsToRequests: [
              {
                ...formsToRequests,
                request: {
                  ...request,
                },
              },
            ],
          },
        },
        201,
      );
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
