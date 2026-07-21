/**
 * BDD Suite: RBAC repository natural-key constraints.
 *
 * Given: startup repository schemas compose the singlepage constraints.
 * When: their Drizzle table metadata is inspected.
 * Then: every shared RBAC natural key remains uniquely constrained.
 */

import { getTableConfig } from "drizzle-orm/pg-core";
import { Table as IdentityTable } from "@sps/rbac/models/identity/backend/repository/database";
import { Table as PermissionTable } from "@sps/rbac/models/permission/backend/repository/database";
import { Table as RolesToPermissionsTable } from "@sps/rbac/relations/roles-to-permissions/backend/repository/database";
import { Table as SubjectsToIdentitiesTable } from "@sps/rbac/relations/subjects-to-identities/backend/repository/database";
import { Table as SubjectsToSocialProfilesTable } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/repository/database";
import { Table as SubjectsToRolesTable } from "@sps/rbac/relations/subjects-to-roles/backend/repository/database";
import { fields as subjectsToIdentitiesSinglepageFields } from "../../../../../relations/subjects-to-identities/backend/repository/database/src/lib/fields/singlepage";
import { fields as subjectsToIdentitiesStartupFields } from "../../../../../relations/subjects-to-identities/backend/repository/database/src/lib/fields/startup";
import { fields as subjectsToProfilesSinglepageFields } from "../../../../../relations/subjects-to-social-module-profiles/backend/repository/database/src/lib/fields/singlepage";
import { fields as subjectsToProfilesStartupFields } from "../../../../../relations/subjects-to-social-module-profiles/backend/repository/database/src/lib/fields/startup";
import { fields as permissionSinglepageFields } from "../../../../../models/permission/backend/repository/database/src/lib/fields/singlepage";
import { fields as permissionStartupFields } from "../../../../../models/permission/backend/repository/database/src/lib/fields/startup";
import { fields as rolesToPermissionsSinglepageFields } from "../../../../../relations/roles-to-permissions/backend/repository/database/src/lib/fields/singlepage";
import { fields as rolesToPermissionsStartupFields } from "../../../../../relations/roles-to-permissions/backend/repository/database/src/lib/fields/startup";
import { fields as subjectsToRolesSinglepageFields } from "../../../../../relations/subjects-to-roles/backend/repository/database/src/lib/fields/singlepage";
import { fields as subjectsToRolesStartupFields } from "../../../../../relations/subjects-to-roles/backend/repository/database/src/lib/fields/startup";

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

function expectUniqueIndexExists(
  table: Parameters<typeof getTableConfig>[0],
  name: string,
) {
  const index = getTableConfig(table).indexes.find(
    (item) => item.config.name === name,
  );

  expect(index).toBeDefined();
  expect(index?.config.unique).toBe(true);
}

describe("Given: startup RBAC repository schemas", () => {
  /**
   * BDD Scenario: startup fields inherit SPS fields.
   *
   * Given: permission and grant repositories expose separate field layers.
   * When: their startup field compositions are inspected.
   * Then: every SPS field remains present while startup may add or override fields.
   */
  it("When: startup fields are composed Then: retains every singlepage field", () => {
    const compositions = [
      [permissionSinglepageFields, permissionStartupFields],
      [rolesToPermissionsSinglepageFields, rolesToPermissionsStartupFields],
      [subjectsToIdentitiesSinglepageFields, subjectsToIdentitiesStartupFields],
      [subjectsToProfilesSinglepageFields, subjectsToProfilesStartupFields],
      [subjectsToRolesSinglepageFields, subjectsToRolesStartupFields],
    ];

    for (const [singlepageFields, startupFields] of compositions) {
      expect(Object.keys(startupFields)).toEqual(
        expect.arrayContaining(Object.keys(singlepageFields)),
      );
    }
  });

  /**
   * BDD Scenario: provider-specific identity natural keys.
   *
   * Given: identity providers use different canonical identifier rules.
   * When: the final identity table is built.
   * Then: every supported provider keeps its partial unique index.
   */
  it("When: identity constraints are composed Then: keeps each provider natural key", () => {
    for (const name of [
      "sps_rc_identity_telegram_account_unique",
      "sps_rc_identity_oauth_google_account_unique",
      "sps_rc_identity_evm_account_unique",
      "sps_rc_identity_email_password_email_unique",
      "sps_rc_identity_email_email_unique",
    ]) {
      expectUniqueIndexExists(IdentityTable, name);
    }
  });

  /**
   * BDD Scenario: identity ownership.
   *
   * Given: one identity must resolve to one subject.
   * When: the final subject-identity relation is built.
   * Then: identity ownership remains uniquely constrained.
   */
  it("When: subject-identity constraints are composed Then: keeps one owner per identity", () => {
    expectUniqueIndex(SubjectsToIdentitiesTable, {
      name: "sps_rc_subject_identity_identity_unique",
      columns: ["iy_id"],
    });
  });

  /**
   * BDD Scenario: subject-profile relation natural key.
   *
   * Given: the same profile link may be ensured repeatedly.
   * When: the final subject-profile relation is built.
   * Then: only one relation per subject and profile is permitted.
   */
  it("When: subject-profile constraints are composed Then: keeps one relation per pair", () => {
    expectUniqueIndex(SubjectsToSocialProfilesTable, {
      name: "sps_rc_subject_social_profile_unique",
      columns: ["st_id", "sl_me_pe_id"],
    });
  });

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
