import { RBAC_JWT_SECRET, createMemoryCache } from "@sps/shared-utils";
import { DI, type IRepository } from "@sps/shared-backend-api";
import { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";
import { verifyJwt } from "@sps/backend-utils";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import {
  type IModel as ISubject,
  isRbacSubjectTokenRevoked,
} from "@sps/rbac/models/subject/sdk/model";
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
  repository: IRepository;

  constructor(
    @inject(SubjectDI.IPermissionService)
    permissionService: PermissionService,
    @inject(SubjectDI.IRolesToPermissionsService)
    rolesToPermissionsService: RolesToPermissionsService,
    @inject(SubjectDI.ISubjectsToRolesService)
    subjectsToRolesService: SubjectsToRolesService,
    @inject(DI.IRepository) repository: IRepository,
  ) {
    this.permissionService = permissionService;
    this.rolesToPermissionsService = rolesToPermissionsService;
    this.subjectsToRolesService = subjectsToRolesService;
    this.repository = repository;
  }

  invalidateSubjectRoleCache(subjectId: string) {
    cache.del(`subjects-to-roles:subject:${subjectId}`);
  }

  /**
   * Drops the cached revocation mark of a subject, so the next request reads
   * the one logout has just written instead of waiting for the entry to
   * expire.
   */
  invalidateSubjectRevocationCache(subjectId: string) {
    cache.del(`subject:tokens-valid-after:${subjectId}`);
  }

  /**
   * Resolves the subject of an access token. A refresh token, or a token
   * signed before its subject last logged out, is refused. A token whose
   * subject no longer exists still resolves to its id, which holds no role.
   * Route billing resolves the subject it charges through this as well.
   */
  async getSubjectId(authorization: string) {
    const decoded = await verifyJwt(authorization, RBAC_JWT_SECRET as string, {
      type: "access",
    });
    const subjectId = decoded.subject?.["id"];
    if (typeof subjectId !== "string" || !subjectId) {
      throw new Error("Validation error. No subject provided in the token");
    }

    const tokensValidAfter = await this.getSubjectTokensValidAfter(subjectId);

    if (
      isRbacSubjectTokenRevoked({
        subject: { tokensValidAfter },
        issuedAt: decoded.iat,
      })
    ) {
      throw new Error("Authentication error. Token revoked");
    }

    return subjectId;
  }

  protected async getSubjectTokensValidAfter(subjectId: string) {
    const cacheKey = `subject:tokens-valid-after:${subjectId}`;
    const cached = await cache.getAsync<{ tokensValidAfter: Date | null }>(
      cacheKey,
    );

    if (cached) {
      return cached.tokensValidAfter;
    }

    const subject: ISubject | undefined =
      await this.repository.findFirstByField("id", subjectId);
    const tokensValidAfter = subject?.tokensValidAfter ?? null;

    cache.set(cacheKey, { tokensValidAfter });

    return tokensValidAfter;
  }

  protected async getSubjectRoleIds(subjectId: string) {
    const cacheKey = `subjects-to-roles:subject:${subjectId}`;
    const cachedRoleIds = await cache.getAsync<string[]>(cacheKey);

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
      subjectId = await this.getSubjectId(authorization);
    }

    const permissionResolutionCacheKey = [
      "permission-resolution",
      props.permission.type,
      props.permission.method,
      props.permission.route,
    ].join(":");

    let permissionResolution = await cache.getAsync<
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
       * Permissions without roles are public, except on the routes the
       * framework refuses to leave open by omission (issue #270). The rule
       * only subtracts: every other role-less row keeps its behavior.
       */
      if (!permissionRoleIds.size) {
        authorized = !(await this.permissionService.isSensitiveRoute(
          props.permission.route,
          props.permission.method,
          permission.path,
        ));
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
