export const PermissionDI = {
  IRolesToPermissionsService: Symbol.for(
    "rbac.permission.roles-to-permissions.service",
  ),
  IPermissionsToBillingModuleCurrenciesService: Symbol.for(
    "rbac.permission.permissions-to-billing-module-currencies.service",
  ),
};
