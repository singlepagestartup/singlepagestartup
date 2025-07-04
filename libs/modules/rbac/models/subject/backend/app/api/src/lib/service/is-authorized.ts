import { IRepository } from "@sps/shared-backend-api";
import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { HTTPException } from "hono/http-exception";
import { api as actionApi } from "@sps/rbac/models/action/sdk/server";
import { api as rolesToActionsApi } from "@sps/rbac/relations/roles-to-actions/sdk/server";
import { IModel as ISubjectsToRoles } from "@sps/rbac/relations/subjects-to-roles/sdk/model";
import * as jwt from "hono/jwt";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { logger } from "@sps/backend-utils";

export type IExecuteProps = {
  action: {
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
      const rootAction = await actionApi.findByRoute({
        params: {
          action: {
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

      if (rootAction) {
        if (subjectsToRoles?.length) {
          for (const subjectToRole of subjectsToRoles) {
            const rolesToActions = await rolesToActionsApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "roleId",
                      method: "eq",
                      value: subjectToRole.roleId,
                    },
                    {
                      column: "actionId",
                      method: "eq",
                      value: rootAction.id,
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

            if (rolesToActions?.length) {
              authorized = true;
            }
          }
        }
      }
    } catch (error) {
      logger.error("isAuthorized ~ error:", error);
    }

    try {
      const action = await actionApi.findByRoute({
        params: {
          action: {
            method: props.action.method,
            route: props.action.route,
            type: props.action.type,
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      if (action) {
        const actionsToRoles = await rolesToActionsApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "actionId",
                  method: "eq",
                  value: action.id,
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
         * actions without roles are public
         */
        if (!actionsToRoles?.length) {
          authorized = true;
        }

        if (subjectsToRoles?.length && !authorized) {
          for (const subjectToRole of subjectsToRoles) {
            const rolesToActions = await rolesToActionsApi.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "roleId",
                      method: "eq",
                      value: subjectToRole.roleId,
                    },
                    {
                      column: "actionId",
                      method: "eq",
                      value: action.id,
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

            if (rolesToActions?.length) {
              authorized = true;
            }
          }
        }
      }
    } catch (error) {
      logger.error("isAuthorized ~ error:", error);
    }

    if (!authorized) {
      throw new Error(
        `Authorization error. You do not have access to this resource: ${JSON.stringify(props.action)}`,
      );
    } else {
      return {
        ok: true,
      };
    }
  }
}
