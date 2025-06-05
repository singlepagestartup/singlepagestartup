import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as jwt from "hono/jwt";
import { authorization } from "@sps/backend-utils";
import { Service } from "../../../../service";
import { api as crmFormApi } from "@sps/crm/models/form/sdk/server";
import { api as notificationTopicApi } from "@sps/notification/models/topic/sdk/server";
import { api as notificationTemplateApi } from "@sps/notification/models/template/sdk/server";
import { api as crmFormsToInputsApi } from "@sps/crm/relations/forms-to-inputs/sdk/server";
import { api as crmFormsToRequestsApi } from "@sps/crm/relations/forms-to-requests/sdk/server";
import { api as crmRequestApi } from "@sps/crm/models/request/sdk/server";
import { api as roleApi } from "@sps/rbac/models/role/sdk/server";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new HTTPException(400, {
          message: "RBAC_JWT_SECRET not set",
        });
      }

      if (!RBAC_SECRET_KEY) {
        throw new HTTPException(400, {
          message: "RBAC_SECRET_KEY not set",
        });
      }

      const id = c.req.param("id");

      if (!id) {
        throw new HTTPException(400, {
          message: "No id provided",
        });
      }

      const token = authorization(c);

      if (!token) {
        return c.json(
          {
            data: null,
          },
          {
            status: 401,
          },
        );
      }

      const decoded = await jwt.verify(token, RBAC_JWT_SECRET);

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        return c.json(
          {
            message: "Invalid body",
          },
          {
            status: 400,
          },
        );
      }

      const data = JSON.parse(body["data"]);

      if (decoded?.["subject"]?.["id"] !== id) {
        throw new HTTPException(403, {
          message: "Only order owner can update order",
        });
      }

      if (!data["formId"]) {
        throw new HTTPException(400, {
          message: "No data.formId provided",
        });
      }

      const formId = data["formId"];

      const entity = await this.service.findById({
        id,
      });

      if (!entity) {
        throw new HTTPException(404, {
          message: "No entity found",
        });
      }

      const form = await crmFormApi.findById({
        id: formId,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (!form) {
        throw new HTTPException(404, {
          message: "No form found",
        });
      }

      const formsToInputs = await crmFormsToInputsApi.find({
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

      const request = await crmRequestApi.create({
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

      await crmFormsToRequestsApi.create({
        data: {
          formId: form.id,
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

      const notificationCrmRequestCreatedTemplates =
        await notificationTemplateApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "variant",
                  method: "ilike",
                  value: "-crm-form-request-created-",
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

      if (notificationCrmRequestCreatedTemplates?.length) {
        const adminRoles = await roleApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "slug",
                  method: "ilike",
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

        for (const notificationCrmRequestCreatedTemplate of notificationCrmRequestCreatedTemplates) {
          if (notificationCrmRequestCreatedTemplate.variant.includes("admin")) {
            if (adminRoles?.length) {
              for (const adminRole of adminRoles) {
                const subjectsToAdminRoles = await subjectsToRolesApi.find({
                  params: {
                    filters: {
                      and: [
                        {
                          column: "roleId",
                          method: "eq",
                          value: adminRole.id,
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

                if (subjectsToAdminRoles?.length) {
                  for (const subjectToAdminRole of subjectsToAdminRoles) {
                    await api.notify({
                      id: subjectToAdminRole.subjectId,
                      data: {
                        notification: {
                          topic: {
                            slug: "information",
                          },
                          template: {
                            variant:
                              notificationCrmRequestCreatedTemplate.variant,
                          },
                          notification: {
                            method: "email",
                            title: notificationCrmRequestCreatedTemplate.title,
                            data: JSON.stringify({
                              crm: {
                                form: data,
                              },
                            }),
                          },
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
          }
        }
      }

      return c.json({
        data: {
          ...entity,
          data,
        },
      });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }
}
