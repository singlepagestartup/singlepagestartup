export const RoleDI = {
  IPermissionService: Symbol.for("rbac.role.permission.service"),
  IRolesToPermissionsService: Symbol.for(
    "rbac.role.roles-to-permissions.service",
  ),
};
