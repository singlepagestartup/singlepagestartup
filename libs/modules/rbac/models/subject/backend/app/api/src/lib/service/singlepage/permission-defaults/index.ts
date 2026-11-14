import { readDump } from "@sps/shared-backend-api";
import { UUID_VALUE_REGEX } from "@sps/shared-utils";
import type { IPermissionDefault } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IPermission } from "@sps/rbac/models/permission/sdk/model";
import type { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import type { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";

interface ILink {
  permissionId: string;
}

function routeKey(permission: Pick<IPermission, "method" | "path">) {
  return (
    permission.method + " " + permission.path.replace(/\[[^/\]]+\]/g, ":uuid")
  );
}

export class Service {
  constructor(
    private permission: PermissionService,
    private rolesToPermissions: RolesToPermissionsService,
  ) {}

  async execute() {
    const permissions = this.permission.repository.configuration?.repository;
    const roles = this.rolesToPermissions.repository.configuration?.repository;
    const billing =
      this.permission.permissionsToBillingModuleCurrenciesService.repository
        .configuration?.repository;
    if (
      !permissions?.seed.active ||
      !roles?.seed.active ||
      !billing?.seed.active
    ) {
      return [];
    }

    const [defaults, roleLinks, billingLinks, installed] = await Promise.all([
      readDump<Pick<IPermission, "id" | "type" | "method" | "path">>(
        permissions.dump.directory,
      ),
      readDump<ILink>(roles.dump.directory),
      readDump<ILink>(billing.dump.directory),
      this.permission.find({
        params: {
          filters: { and: [{ column: "type", method: "eq", value: "HTTP" }] },
        },
      }),
    ]);
    const restrictedIds = new Set<string>();
    for (const link of [...roleLinks, ...billingLinks]) {
      if (typeof link.permissionId !== "string" || !link.permissionId) {
        throw new Error(
          "Configuration error. Invalid permission link in the RBAC dump",
        );
      }
      restrictedIds.add(link.permissionId);
    }
    const restricted = new Set(
      defaults.filter((row) => restrictedIds.has(row.id)).map(routeKey),
    );
    const configured = new Set(installed.map(routeKey));
    const suggestions: IPermissionDefault[] = [];
    for (const row of defaults) {
      const key = routeKey(row);
      if (
        row.type !== "HTTP" ||
        !row.path.startsWith("/api/") ||
        !["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE"].includes(
          row.method,
        ) ||
        row.path.includes("*") ||
        row.path.split("/").some((part) => UUID_VALUE_REGEX.test(part)) ||
        restricted.has(key)
      ) {
        continue;
      }
      // Evaluate templates against the same concrete path shape that authorization sees.
      const example = row.path.replace(
        /\[[^/\]]+\]|:uuid/g,
        "00000000-0000-4000-8000-000000000000",
      );
      if (
        await this.permission.isSensitiveRoute(example, row.method, row.path)
      ) {
        continue;
      }
      suggestions.push({
        type: row.type,
        method: row.method,
        path: row.path,
        configured: configured.has(key),
      });
    }
    return suggestions.sort(
      (left, right) =>
        left.path.localeCompare(right.path) ||
        left.method.localeCompare(right.method),
    );
  }
}
