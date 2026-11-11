import type { IModel } from "@sps/rbac/models/permission/sdk/model";
import type { FindServiceProps } from "@sps/shared-backend-api";
import { isExactResourceGrant } from "@sps/shared-utils";
import {
  publicResourceIdsSchema,
  type IPublicResourceIdsParams,
} from "@sps/rbac/models/role/sdk/model";

interface IRead<T> {
  find(props?: FindServiceProps): Promise<T[]>;
}
export interface IDependencies {
  permission: IRead<IModel> & {
    isSensitiveRoute(
      route: string,
      method: string,
      permissionPath?: string,
    ): Promise<boolean>;
  };
  rolesToPermissions: IRead<{ permissionId: string }>;
}

/** Concrete public grants are candidates; callers still read the resource anonymously. */
export class Service {
  constructor(private readonly dependencies: IDependencies) {}

  async execute(props: IPublicResourceIdsParams): Promise<string[]> {
    const parsed = publicResourceIdsSchema.safeParse(props);
    if (!parsed.success) {
      throw new Error("Validation error. Invalid API resource path");
    }
    const { resource } = parsed.data;
    const ids = new Set<string>();
    let offset = 0;
    let hasPermissions = true;
    while (hasPermissions) {
      const permissions = await this.dependencies.permission.find({
        params: {
          filters: {
            and: [
              { column: "type", method: "eq", value: "HTTP" },
              { column: "method", method: "eq", value: "GET" },
              { column: "path", method: "like", value: resource + "/" },
            ],
          },
          orderBy: { and: [{ column: "id", method: "asc" }] },
          limit: 100,
          offset,
        },
      });
      const exact = permissions.filter((permission) =>
        isExactResourceGrant(resource, permission.path),
      );
      const bound = new Set<string>();
      if (exact.length) {
        let linkOffset = 0;
        let hasBindings = true;
        while (hasBindings) {
          const bindings = await this.dependencies.rolesToPermissions.find({
            params: {
              filters: {
                and: [
                  {
                    column: "permissionId",
                    method: "inArray",
                    value: exact.map(({ id }) => id),
                  },
                ],
              },
              orderBy: { and: [{ column: "id", method: "asc" }] },
              limit: 100,
              offset: linkOffset,
            },
          });
          for (const binding of bindings) {
            bound.add(binding.permissionId);
          }
          hasBindings = bindings.length === 100;
          linkOffset += 100;
        }
      }
      for (const permission of exact) {
        if (
          !bound.has(permission.id) &&
          !(await this.dependencies.permission.isSensitiveRoute(
            permission.path,
            "GET",
            permission.path,
          ))
        ) {
          ids.add(permission.path.slice(resource.length + 1));
        }
      }
      hasPermissions = permissions.length === 100;
      offset += 100;
    }
    return [...ids].sort();
  }
}
