/**
 * BDD Suite: RBAC repository natural-key constraints.
 *
 * Given: startup repository schemas compose the singlepage constraints.
 * When: their Drizzle table metadata is inspected.
 * Then: every shared RBAC natural key remains uniquely constrained.
 */

import { getTableConfig } from "drizzle-orm/pg-core";
import { Table as PermissionTable } from "@sps/rbac/models/permission/backend/repository/database";
import { Table as RolesToPermissionsTable } from "@sps/rbac/relations/roles-to-permissions/backend/repository/database";
import { Table as SubjectsToRolesTable } from "@sps/rbac/relations/subjects-to-roles/backend/repository/database";

interface IExpectedIndex {
  name: string;
  columns: string[];
}

function expectUniqueIndex(
  table: Parameters<typeof getTableConfig>[0],
  expected: IExpectedIndex,
) {
  const index = getTableConfig(table).indexes.find(
    (item) => item.config.name === expected.name,
  );

  expect(index).toBeDefined();
  expect(index?.config.unique).toBe(true);
  expect(
    index?.config.columns.map((column) =>
      "name" in column ? column.name : undefined,
    ),
  ).toEqual(expected.columns);
}

describe("Given: startup RBAC repository schemas", () => {
  /**
   * BDD Scenario: permission natural key.
   *
   * Given: a startup may add repository constraints.
   * When: the final permission table is built.
   * Then: it retains the singlepage type/method/path uniqueness invariant.
   */
  it("When: permission constraints are composed Then: keeps the HTTP route natural key", () => {
    expectUniqueIndex(PermissionTable, {
      name: "sps_rc_permission_type_method_path_unique",
      columns: ["type", "method", "path"],
    });
  });

  /**
   * BDD Scenario: role-permission natural key.
   *
   * Given: a startup may add repository constraints.
   * When: the final role-permission table is built.
   * Then: it retains one semantic link per role and permission.
   */
  it("When: role-permission constraints are composed Then: keeps one relation per pair", () => {
    expectUniqueIndex(RolesToPermissionsTable, {
      name: "sps_rc_role_permission_unique",
      columns: ["re_id", "pn_id"],
    });
  });

  /**
   * BDD Scenario: subject-role natural key.
   *
   * Given: a startup may add repository constraints.
   * When: the final subject-role table is built.
   * Then: it retains one semantic link per subject and role.
   */
  it("When: subject-role constraints are composed Then: keeps one relation per pair", () => {
    expectUniqueIndex(SubjectsToRolesTable, {
      name: "sps_rc_subject_role_unique",
      columns: ["st_id", "re_id"],
    });
  });
});
