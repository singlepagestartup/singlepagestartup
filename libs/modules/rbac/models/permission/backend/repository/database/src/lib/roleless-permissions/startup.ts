import { rolelessPermissions as parentRolelessPermissions } from "./singlepage";

/**
 * Rows the project seeds without a role, as `METHOD path`, appended to the
 * framework list; the rbac unit lane and the boot report accept every listed
 * row.
 */
export const rolelessPermissions: string[] = [...parentRolelessPermissions];
