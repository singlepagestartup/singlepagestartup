import { RBAC_JWT_SECRET, createMemoryCache } from "@sps/shared-utils";
import { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";
import * as jwt from "hono/jwt";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
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
  permissionService: PermissionService;
  rolesToPermissionsService: RolesToPermissionsService;
  subjectsToRolesService: SubjectsToRolesService;

  constructor(
    @inject(SubjectDI.IPermissionService)
    permissionService: PermissionService,
    @inject(SubjectDI.IRolesToPermissionsService)
    rolesToPermissionsService: RolesToPermissionsService,
    @inject(SubjectDI.ISubjectsToRolesService)
    subjectsToRolesService: SubjectsToRolesService,
  ) {
    this.permissionService = permissionService;
    this.rolesToPermissionsService = rolesToPermissionsService;
    this.subjectsToRolesService = subjectsToRolesService;
  }

  invalidateSubjectRoleCache(subjectId: string) {
    cache.del(`subjects-to-roles:subject:${subjectId}`);
  }

  protected async getSubjectRoleIds(subjectId: string) {
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

  protected async getRoleIdsByPermissionId(permissionId?: string) {
    if (!permissionId) {
      return [];
    }

    const rolesToPermissions = await this.rolesToPermissionsService.find({
      params: {
        filters: {
          and: [
            {
              column: "permissionId",
              method: "eq",
              value: permissionId,
            },
          ],
        },
      },
    });

    return Array.from(
      new Set(
        rolesToPermissions
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
      Awaited<ReturnType<PermissionService["resolveByRoute"]>>
    >(permissionResolutionCacheKey);

    if (!permissionResolution) {
      permissionResolution = await this.permissionService.resolveByRoute({
        permission: {
          method: props.permission.method,
          route: props.permission.route,
          type: props.permission.type,
        },
      });

      if (permissionResolution) {
        cache.set(permissionResolutionCacheKey, permissionResolution);
      }
    }

    const permission = permissionResolution?.permission;
    const rootPermission = permissionResolution?.rootPermission;

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
        await this.getRoleIdsByPermissionId(permission.id),
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
        await this.getRoleIdsByPermissionId(rootPermission?.id),
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
