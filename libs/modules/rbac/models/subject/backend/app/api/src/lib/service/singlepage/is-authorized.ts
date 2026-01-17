import { IRepository } from "@sps/shared-backend-api";
import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import { api as rolesToPermissionsApi } from "@sps/rbac/relations/roles-to-permissions/sdk/server";
import { IModel as ISubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/sdk/model";
import * as jwt from "hono/jwt";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { logger } from "@sps/backend-utils";

export type IExecuteProps = {
  permission: {
    route: string;
    method: string;
    type: "HTTP";
  };
  authorization: {
    value?: string;
  };
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    let authorized = false;

    if (!RBAC_JWT_SECRET) {
      throw new Error("Configuration error. RBAC_JWT_SECRET is not defined");
    }

    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not defined");
    }

    const authorization = props.authorization.value;

    let subjectsToRoles: ISubjectsToRoles[] | undefined;

    if (authorization) {
      try {
        const decoded = await jwt.verify(authorization, RBAC_JWT_SECRET);

        if (!decoded.subject?.["id"]) {
          throw new Error(
            "Authorization error. No subject provided in the token",
          );
        }

        subjectsToRoles = await subjectsToRolesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "subjectId",
                  method: "eq",
                  value: decoded.subject["id"],
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
      } catch (error) {
        throw new Error(
          "Authorization error. " +
            (error?.["message"] || "Invalid authorization token provided"),
        );
      }
    }

    try {
      const rootPermission = await permissionApi.findByRoute({
        params: {
          permission: {
            method: "*",
            route: "*",
            type: "HTTP",
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (rootPermission) {
        if (subjectsToRoles?.length) {
          for (const subjectToRole of subjectsToRoles) {
            const rolesToPermissions = await rolesToPermissionsApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "roleId",
                      method: "eq",
                      value: subjectToRole.roleId,
                    },
                    {
                      column: "permissionId",
                      method: "eq",
                      value: rootPermission.id,
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

            if (rolesToPermissions?.length) {
              return {
                ok: true,
              };
            }
          }
        }
      }
    } catch (error) {
      logger.error("isAuthorized ~ error:", error);
    }

    try {
      const permission = await permissionApi.findByRoute({
        params: {
          permission: {
            method: props.permission.method,
            route: props.permission.route,
            type: props.permission.type,
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (permission) {
        const rolesToPermissions = await rolesToPermissionsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "permissionId",
                  method: "eq",
                  value: permission.id,
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

        /**
         * Permissions without roles are public
         */
        if (!rolesToPermissions?.length) {
          authorized = true;
        }

        if (subjectsToRoles?.length && !authorized) {
          for (const subjectToRole of subjectsToRoles) {
            const rolesToPermissions = await rolesToPermissionsApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "roleId",
                      method: "eq",
                      value: subjectToRole.roleId,
                    },
                    {
                      column: "permissionId",
                      method: "eq",
                      value: permission.id,
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

            if (rolesToPermissions?.length) {
              authorized = true;
            }
          }
        }
      }
    } catch (error) {
      // logger.error("isAuthorized ~ error:", error);
    }

    if (!authorized) {
      throw new Error(
        `Authorization error. You do not have access to this resource: ${JSON.stringify(props.permission)}`,
      );
    } else {
      return {
        ok: true,
      };
    }
  }
}
