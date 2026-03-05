import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/permission/backend/repository/database";
import { Repository } from "../../repository";
import { Service as PermissionsToBillingModuleCurrenciesService } from "@sps/rbac/relations/permissions-to-billing-module-currencies/backend/app/api/src/lib/service/singlepage";
import { createMemoryCache } from "@sps/shared-utils";
import { match } from "path-to-regexp";
import { PermissionDI } from "../../di";
import { type IModel as IPermissionsToBillingModuleCurrencies } from "@sps/rbac/relations/permissions-to-billing-module-currencies/sdk/model";

const cache = createMemoryCache({ ttlMs: 30_000, maxSize: 300 });
const matcherCache = new Map<string, ReturnType<typeof match>>();

export type IResolveByRouteProps = {
  permission: {
    route: string;
    method: string;
    type: string;
  };
  includeBillingRequirements?: boolean;
};

export type IResolveByRouteResult = {
  permission?: (typeof Table)["$inferSelect"];
  rootPermission?: (typeof Table)["$inferSelect"];
  permissionsToBillingModuleCurrencies: IPermissionsToBillingModuleCurrencies[];
};

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  permissionsToBillingModuleCurrenciesService: PermissionsToBillingModuleCurrenciesService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(PermissionDI.IPermissionsToBillingModuleCurrenciesService)
    permissionsToBillingModuleCurrenciesService: PermissionsToBillingModuleCurrenciesService,
  ) {
    super(repository);
    this.permissionsToBillingModuleCurrenciesService =
      permissionsToBillingModuleCurrenciesService;
  }

  private async getPermissions() {
    const cacheKey = "permissions:all";
    let permissions = cache.get<(typeof Table)["$inferSelect"][]>(cacheKey);

    if (!permissions) {
      permissions = await this.find();
      cache.set(cacheKey, permissions);
    }

    return permissions;
  }

  private findPermissionByRoute(props: {
    permissions: (typeof Table)["$inferSelect"][];
    route: string;
    method: string;
    type: string;
  }) {
    const { permissions, route, method, type } = props;

    const filteredPermissions = permissions.filter((permission) => {
      return (
        permission.method.toUpperCase() === method.toUpperCase() &&
        permission.type === type
      );
    });

    for (const permission of filteredPermissions) {
      if (permission.path === "*") {
        return permission;
      }

      if (!permission.path) {
        continue;
      }

      const matcherCacheKey = permission.path;
      let matcher = matcherCache.get(matcherCacheKey);

      if (!matcher) {
        const template = permission.path.replace(
          /\[(.+?)\]/g,
          (_, p1) => `:${p1.replace(/[.\-]/g, "_")}`,
        );

        matcher = match(template, {
          decode: decodeURIComponent,
          end: true,
        });

        matcherCache.set(matcherCacheKey, matcher);
      }

      if (matcher(route)) {
        return permission;
      }
    }

    return undefined;
  }

  private async getPermissionBillingRequirements(permissionId: string) {
    const cacheKey = `permission:${permissionId}:billing-requirements`;
    let requirements =
      cache.get<IPermissionsToBillingModuleCurrencies[]>(cacheKey);

    if (!requirements) {
      const fetched =
        await this.permissionsToBillingModuleCurrenciesService.find({
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

      requirements = Array.isArray(fetched) ? fetched : [];
      cache.set(cacheKey, requirements);
    }

    return requirements;
  }

  async resolveByRoute(
    props: IResolveByRouteProps,
  ): Promise<IResolveByRouteResult> {
    const permissions = await this.getPermissions();

    const permission = this.findPermissionByRoute({
      permissions,
      route: props.permission.route,
      method: props.permission.method,
      type: props.permission.type,
    });

    const rootPermission = this.findPermissionByRoute({
      permissions,
      route: "*",
      method: "*",
      type: props.permission.type,
    });

    const permissionsToBillingModuleCurrencies =
      props.includeBillingRequirements && permission?.id
        ? await this.getPermissionBillingRequirements(permission.id)
        : [];

    return {
      permission,
      rootPermission,
      permissionsToBillingModuleCurrencies,
    };
  }
}
