/**
 * BDD Suite: concurrent profile-scoped Knowledge RBAC provisioning.
 *
 * Given: the migrated RBAC repositories enforce their shared natural keys.
 * When: two repository-backed Knowledge grants are provisioned concurrently.
 * Then: both callers converge on one role, fourteen permissions, fourteen links, and one subject-role link.
 */

import { randomUUID } from "node:crypto";
import {
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { Configuration as PermissionConfiguration } from "@sps/rbac/models/permission/backend/app/api/src/lib/configuration";
import { Repository as PermissionRepository } from "@sps/rbac/models/permission/backend/app/api/src/lib/repository";
import { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import { Configuration as RoleConfiguration } from "@sps/rbac/models/role/backend/app/api/src/lib/configuration";
import { Repository as RoleRepository } from "@sps/rbac/models/role/backend/app/api/src/lib/repository";
import { Service as RoleService } from "@sps/rbac/models/role/backend/app/api/src/lib/service";
import { Configuration as SubjectConfiguration } from "@sps/rbac/models/subject/backend/app/api/src/lib/configuration";
import { Repository as SubjectRepository } from "@sps/rbac/models/subject/backend/app/api/src/lib/repository";
import { Configuration as RolesToPermissionsConfiguration } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/configuration";
import { Repository as RolesToPermissionsRepository } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/repository";
import { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";
import { Configuration as SubjectsToRolesConfiguration } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/configuration";
import { Repository as SubjectsToRolesRepository } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/repository";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import {
  getSocialProfileKnowledgePermissionDescriptors,
  SocialProfileKnowledgeAccessService,
} from "./access";

interface ITestServices {
  permission: PermissionService;
  role: RoleService;
  rolesToPermissions: RolesToPermissionsService;
  subjectsToRoles: SubjectsToRolesService;
  subjectRepository: SubjectRepository;
}

function createTestServices(): ITestServices {
  const permission = new PermissionService(
    new PermissionRepository(new PermissionConfiguration()),
    { find: async () => [] } as any,
  );
  const role = new RoleService(new RoleRepository(new RoleConfiguration()));
  const rolesToPermissions = new RolesToPermissionsService(
    new RolesToPermissionsRepository(new RolesToPermissionsConfiguration()),
  );
  const subjectsToRoles = new SubjectsToRolesService(
    new SubjectsToRolesRepository(new SubjectsToRolesConfiguration()),
  );

  return {
    permission,
    role,
    rolesToPermissions,
    subjectsToRoles,
    subjectRepository: new SubjectRepository(new SubjectConfiguration()),
  };
}

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});

describe("Given: a clean subject and profile-specific Knowledge grant", () => {
  /**
   * BDD Scenario: two real concurrent grant requests.
   *
   * Given: one persisted subject and a unique target profile.
   * When: two ensure calls race through real PostgreSQL repositories.
   * Then: both resolve to the same complete grant and a third call performs no additional writes.
   */
  it("When: two ensure calls race Then: converges on one complete grant", async () => {
    const services = createTestServices();
    const suffix = randomUUID();
    const subjectSlug = `issue-211-subject-${suffix}`;
    const socialModuleProfileId = randomUUID();
    const subject = await services.subjectRepository.insert({
      slug: subjectSlug,
      variant: "default",
    });

    if (!subject.id) {
      throw new Error("Integration setup error. Subject id was not returned.");
    }

    const subjectId = subject.id;
    const props = {
      ownerRbacSubjectId: subjectId,
      socialModuleProfileId,
    };
    const descriptors = getSocialProfileKnowledgePermissionDescriptors(props);
    const roleSlug = `social-profile-${socialModuleProfileId}-knowledge-owner`;
    const access = new SocialProfileKnowledgeAccessService(services);

    try {
      const [first, second] = await Promise.all([
        access.ensure(props),
        access.ensure(props),
      ]);

      expect(second.role.id).toBe(first.role.id);
      expect(second.permissions.map(({ id }) => id)).toEqual(
        first.permissions.map(({ id }) => id),
      );
      expect(second.subjectToRole.id).toBe(first.subjectToRole.id);

      const roles = await services.role.find({
        params: {
          filters: {
            and: [{ column: "slug", method: "eq", value: roleSlug }],
          },
        },
      });
      const permissionGroups = await Promise.all(
        descriptors.map((descriptor) =>
          services.permission.find({
            params: {
              filters: {
                and: [
                  { column: "type", method: "eq", value: "HTTP" },
                  {
                    column: "method",
                    method: "eq",
                    value: descriptor.method,
                  },
                  { column: "path", method: "eq", value: descriptor.path },
                ],
              },
            },
          }),
        ),
      );
      const rolePermissions = await services.rolesToPermissions.find({
        params: {
          filters: {
            and: [{ column: "roleId", method: "eq", value: first.role.id }],
          },
        },
      });
      const subjectRoles = await services.subjectsToRoles.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: subjectId },
              { column: "roleId", method: "eq", value: first.role.id },
            ],
          },
        },
      });

      expect(roles).toHaveLength(1);
      expect(permissionGroups).toHaveLength(14);
      expect(permissionGroups.every((group) => group.length === 1)).toBe(true);
      expect(rolePermissions).toHaveLength(14);
      expect(subjectRoles).toHaveLength(1);

      const third = await access.ensure(props);

      expect(third.role.id).toBe(first.role.id);
      expect(third.permissions.map(({ id }) => id)).toEqual(
        first.permissions.map(({ id }) => id),
      );
      await expect(
        services.rolesToPermissions.find({
          params: {
            filters: {
              and: [{ column: "roleId", method: "eq", value: first.role.id }],
            },
          },
        }),
      ).resolves.toHaveLength(14);
    } finally {
      const sql = getPostgresClient();

      await sql.begin(async (transaction) => {
        await transaction.unsafe("DELETE FROM sps_rc_role WHERE slug = $1", [
          roleSlug,
        ]);
        await transaction.unsafe(
          "DELETE FROM sps_rc_permission WHERE path = ANY($1::text[])",
          [descriptors.map(({ path }) => path)],
        );
        await transaction.unsafe("DELETE FROM sps_rc_subject WHERE id = $1", [
          subjectId,
        ]);
      });
    }
  });
});
