import { IRepository } from "@sps/shared-backend-api";
import {
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
  createMemoryCache,
} from "@sps/shared-utils";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import { IModel as IPermission } from "@sps/rbac/models/permission/sdk/model";
import { IModel as IRolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/sdk/model";
import { api as rolesToPermissionsApi } from "@sps/rbac/relations/roles-to-permissions/sdk/server";
import * as jwt from "hono/jwt";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";

const cache = createMemoryCache({ ttlMs: 30_000 });

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

    let subjectId: string | undefined = undefined;
    const authorization = props.authorization.value;

    if (authorization) {
      const decoded = await jwt.verify(authorization, RBAC_JWT_SECRET);

      if (!decoded.subject?.["id"]) {
        throw new Error("Validation error. No subject provided in the token");
      }

      if (typeof decoded.subject["id"] !== "string") {
        throw new Error("Validation error. Subject ID is not a string");
      }

      subjectId = decoded.subject["id"];
    }

    const permissionCacheKey = `permission:${props.permission.type}:${props.permission.method}:${props.permission.route}`;
    let permission = cache.get<IPermission>(permissionCacheKey);
    if (!permission) {
      const fetched = await permissionApi
        .findByRoute({
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
        })
        .catch((error) => undefined);

      permission = fetched ?? undefined;

      if (permission) {
        cache.set(permissionCacheKey, permission);
      }
    }

    const rolesToPermissionsCacheKey = "roles-to-permissions:all";
    let rolesToPermissions = cache.get<IRolesToPermissions[]>(
      rolesToPermissionsCacheKey,
    );
    if (!rolesToPermissions) {
      const fetched = await rolesToPermissionsApi
        .find({
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        })
        .catch((error) => undefined);

      rolesToPermissions = Array.isArray(fetched) ? fetched : undefined;

      if (rolesToPermissions) {
        cache.set(rolesToPermissionsCacheKey, rolesToPermissions);
      }
    }

    if (permission && rolesToPermissions) {
      const rolesToPremission = rolesToPermissions.filter(
        (roleToPermission) => {
          return roleToPermission.permissionId === permission.id;
        },
      );

      /**
       * Permissions without roles are public
       */
      if (!rolesToPremission?.length) {
        authorized = true;
      }

      if (!authorized && subjectId) {
        const subjectsToRoles = await subjectsToRolesApi
          .find({
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          })
          .catch((error) => {});

        const subjectToRoles = subjectId
          ? subjectsToRoles?.filter((subjectToRole) => {
              return subjectToRole.subjectId === subjectId;
            })
          : [];

        if (subjectToRoles?.length) {
          for (const subjectToRole of subjectToRoles) {
            const rolesToPermission = rolesToPermissions.filter(
              (roleToPermission) => {
                return (
                  roleToPermission.roleId === subjectToRole.roleId &&
                  roleToPermission.permissionId === permission.id
                );
              },
            );

            if (rolesToPermission?.length) {
              authorized = true;
              break;
            }
          }
        }
      }
    }

    if (!authorized && subjectId) {
      const rootPermissionCacheKey = "permission:HTTP:*:*";
      let rootPermission = cache.get<IPermission>(rootPermissionCacheKey);
      if (!rootPermission) {
        const fetched = await permissionApi
          .findByRoute({
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
          })
          .catch((error) => undefined);

        rootPermission = fetched ?? undefined;

        if (rootPermission) {
          cache.set(rootPermissionCacheKey, rootPermission);
        }
      }

      if (rootPermission && rolesToPermissions) {
        const rootRoles = rolesToPermissions?.filter((roleToPermission) => {
          return roleToPermission.permissionId === rootPermission.id;
        });

        if (rootRoles?.length) {
          const subjectsToRoles = await subjectsToRolesApi
            .find({
              options: {
                headers: {
                  "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
                },
              },
            })
            .catch((error) => {});

          if (subjectsToRoles?.length) {
            for (const subjectToRole of subjectsToRoles) {
              if (subjectToRole.subjectId !== subjectId) {
                continue;
              }

              const isRootSubject = rootRoles?.find((rootRole) => {
                return rootRole.roleId === subjectToRole.roleId;
              });

              if (isRootSubject) {
                authorized = true;
                break;
              }
            }
          }
        }
      }
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
