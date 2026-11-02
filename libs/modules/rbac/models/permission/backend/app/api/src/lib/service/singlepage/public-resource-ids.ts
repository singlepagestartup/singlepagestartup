import type { FindServiceProps } from "@sps/shared-backend-api";
import { UUID_PATH_SUFFIX_REGEX } from "@sps/shared-utils";
import {
  publicResourceIdsSchema,
  type IPublicResourceIdsParams,
  type IModel,
} from "@sps/rbac/models/permission/sdk/model";

interface IRead<T> {
  find(props?: FindServiceProps): Promise<T[]>;
}
export interface IDependencies {
  permission: IRead<IModel> & {
    isSensitiveRoute(route: string, method: string): Promise<boolean>;
  };
  rolesToPermissions: IRead<{ permissionId: string }>;
}

/** Concrete public grants are candidates; callers still read the resource anonymously. */
export class Service {
  constructor(private readonly dependencies: IDependencies) {}

  async execute(props: IPublicResourceIdsParams): Promise<string[]> {
    const parsed = publicResourceIdsSchema.safeParse(props);
    if (!parsed.success)
      throw new Error("Validation error. Invalid API resource path");
    const { resource } = parsed.data;
    const ids = new Set<string>();
    for (let offset = 0; ; offset += 100) {
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
      const exact = permissions.filter((permission) => {
        const match = UUID_PATH_SUFFIX_REGEX.exec(permission.path);
        return (
          match?.index === resource.length &&
          match[0] === permission.path.slice(resource.length)
        );
      });
      const bound = new Set<string>();
      if (exact.length) {
        for (let linkOffset = 0; ; linkOffset += 100) {
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
          for (const binding of bindings) bound.add(binding.permissionId);
          if (bindings.length < 100) break;
        }
      }
      for (const permission of exact) {
        if (
          !bound.has(permission.id) &&
          !(await this.dependencies.permission.isSensitiveRoute(
            permission.path,
            "GET",
          ))
        )
          ids.add(permission.path.slice(resource.length + 1));
      }
      if (permissions.length < 100) break;
    }
    return [...ids].sort();
  }
}
