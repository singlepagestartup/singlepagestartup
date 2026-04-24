import { DI, type IRepository } from "@sps/shared-backend-api";
import {
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
  createMemoryCache,
} from "@sps/shared-utils";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import { type IModel as IRolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/sdk/model";
import { api as rolesToPermissionsApi } from "@sps/rbac/relations/roles-to-permissions/sdk/server";
import * as jwt from "hono/jwt";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service/singlepage";
import { inject, injectable } from "inversify";
import { SubjectDI } from "../../di";

const cache = createMemoryCache({ ttlMs: 30_000, maxSize: 10_000 });

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

@injectable()
export class Service {
  repository: IRepository;
  subjectsToRolesService: SubjectsToRolesService;

  constructor(
    @inject(DI.IRepository) repository: IRepository,
    @inject(SubjectDI.ISubjectsToRolesService)
    subjectsToRolesService: SubjectsToRolesService,
  ) {
    this.repository = repository;
    this.subjectsToRolesService = subjectsToRolesService;
  }

  private async getSubjectRoleIds(subjectId: string) {
    const cacheKey = `subjects-to-roles:subject:${subjectId}`;
    const cachedRoleIds = cache.get<string[]>(cacheKey);

    if (cachedRoleIds) {
      return cachedRoleIds;
    }

    const subjectsToRoles = await this.subjectsToRolesService
      .find({
        params: {
          filters: {
            and: [
              {
                column: "subjectId",
                method: "eq",
                value: subjectId,
              },
            ],
          },
        },
      })
      .catch(() => undefined);

    const roleIds = Array.isArray(subjectsToRoles)
      ? Array.from(
          new Set(
            subjectsToRoles
              .map((item) => item.roleId)
              .filter((roleId): roleId is string => typeof roleId === "string"),
          ),
        )
      : [];

    cache.set(cacheKey, roleIds);

    return roleIds;
  }

  private getRoleIdsByPermissionId(props: {
    rolesToPermissions: IRolesToPermissions[];
    permissionId?: string;
  }) {
    const { rolesToPermissions, permissionId } = props;

    if (!permissionId) {
      return [];
    }

    return Array.from(
      new Set(
        rolesToPermissions
          .filter((roleToPermission) => {
            return roleToPermission.permissionId === permissionId;
          })
          .map((roleToPermission) => roleToPermission.roleId)
          .filter((roleId): roleId is string => typeof roleId === "string"),
      ),
    );
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
      const tokenCacheKey = `jwt:subject:${authorization}`;
      subjectId = cache.get<string>(tokenCacheKey);

      if (!subjectId) {
        const decoded = await jwt.verify(authorization, RBAC_JWT_SECRET);

        if (!decoded.subject?.["id"]) {
          throw new Error("Validation error. No subject provided in the token");
        }

        if (typeof decoded.subject["id"] !== "string") {
          throw new Error("Validation error. Subject ID is not a string");
        }

        subjectId = decoded.subject["id"];
        cache.set(tokenCacheKey, subjectId);
      }
    }

    const permissionResolutionCacheKey = [
      "permission-resolution",
      props.permission.type,
      props.permission.method,
      props.permission.route,
    ].join(":");

    let permissionResolution = cache.get<
      Awaited<ReturnType<typeof permissionApi.resolveByRoute>>
    >(permissionResolutionCacheKey);

    if (!permissionResolution) {
      permissionResolution = await permissionApi.resolveByRoute({
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

      if (permissionResolution) {
        cache.set(permissionResolutionCacheKey, permissionResolution);
      }
    }

    const permission = permissionResolution?.permission;
    const rootPermission = permissionResolution?.rootPermission;

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
        .catch(() => undefined);

      rolesToPermissions = Array.isArray(fetched) ? fetched : [];
      cache.set(rolesToPermissionsCacheKey, rolesToPermissions);
    }

    let subjectRoleIds: string[] | undefined = undefined;
    const getSubjectRoleIds = async () => {
      if (!subjectId) {
        return [];
      }

      if (!subjectRoleIds) {
        subjectRoleIds = await this.getSubjectRoleIds(subjectId);
      }

      return subjectRoleIds;
    };

    if (permission) {
      const permissionRoleIds = new Set(
        this.getRoleIdsByPermissionId({
          rolesToPermissions,
          permissionId: permission.id,
        }),
      );

      /**
       * Permissions without roles are public
       */
      if (!permissionRoleIds.size) {
        authorized = true;
      }

      if (!authorized && subjectId) {
        const roles = await getSubjectRoleIds();

        authorized = roles.some((roleId) => {
          return permissionRoleIds.has(roleId);
        });
      }
    }

    if (!authorized && subjectId) {
      const rootRoleIds = new Set(
        this.getRoleIdsByPermissionId({
          rolesToPermissions,
          permissionId: rootPermission?.id,
        }),
      );

      if (rootRoleIds.size) {
        const roles = await getSubjectRoleIds();

        authorized = roles.some((roleId) => {
          return rootRoleIds.has(roleId);
        });
      }
    }

    if (!authorized) {
      throw new Error(
        `Permission error. You do not have access to this resource: ${JSON.stringify(props.permission)}`,
      );
    } else {
      return {
        ok: true,
      };
    }
  }
}
