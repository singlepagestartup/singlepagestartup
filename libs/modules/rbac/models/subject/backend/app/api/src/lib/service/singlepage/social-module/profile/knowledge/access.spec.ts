/**
 * BDD Suite: profile-scoped assistant management RBAC provisioning.
 *
 * Given: a Telegram owner rbac.subject and its personal AI social.profile.
 * When: assistant management access is ensured.
 * Then: one profile-specific owner role, fourteen permissions, and existing RBAC relations are created idempotently.
 */

import {
  getSocialProfileKnowledgePermissionDescriptors,
  SocialProfileKnowledgeAccessService,
} from "./access";

function createMemoryService(prefix: string) {
  const rows: any[] = [];
  let nextId = 1;

  return {
    rows,
    find: jest.fn(async (props: any) => {
      const filters = props?.params?.filters?.and || [];

      return rows
        .filter((row) =>
          filters.every((filter: any) => row[filter.column] === filter.value),
        )
        .slice(0, props?.params?.limit || rows.length);
    }),
    create: jest.fn(async ({ data }: any) => {
      const entity = { id: `${prefix}-${nextId++}`, ...data };
      rows.push(entity);
      return entity;
    }),
  };
}

describe("Given: a profile-specific Knowledge owner grant", () => {
  /**
   * BDD Scenario
   * Given: the owner has not been granted Knowledge access yet.
   * When: access is ensured twice.
   * Then: the same role and relations are reused without duplicate records.
   */
  it("When: provisioning repeats Then: creates one idempotent RBAC grant", async () => {
    const permission = {
      ...createMemoryService("permission"),
      invalidateRouteResolutionCache: jest.fn(),
    };
    const role = createMemoryService("role");
    const rolesToPermissions = createMemoryService("role-permission");
    const subjectsToRoles = createMemoryService("subject-role");
    const service = new SocialProfileKnowledgeAccessService({
      permission: permission as any,
      role: role as any,
      rolesToPermissions: rolesToPermissions as any,
      subjectsToRoles: subjectsToRoles as any,
    });
    const props = {
      ownerRbacSubjectId: "owner-subject-id",
      socialModuleProfileId: "82d95822-2e14-4b5a-9576-2d1f11fa27c2",
    };

    const first = await service.ensure(props);
    const second = await service.ensure(props);

    expect(second.role.id).toBe(first.role.id);
    expect(role.rows).toHaveLength(1);
    expect(permission.rows).toHaveLength(14);
    expect(rolesToPermissions.rows).toHaveLength(14);
    expect(subjectsToRoles.rows).toEqual([
      expect.objectContaining({
        subjectId: "owner-subject-id",
        roleId: first.role.id,
      }),
    ]);
    expect(permission.invalidateRouteResolutionCache).toHaveBeenCalledTimes(2);
  });

  /**
   * BDD Scenario
   * Given: two authenticated subjects are allowed to manage one target profile.
   * When: access is ensured for both subjects.
   * Then: they share the profile role while receiving separate subject-scoped
   * permission paths and subject-to-role relations.
   */
  it("When: a second manager is granted Then: reuses the profile role safely", async () => {
    const permission = {
      ...createMemoryService("permission"),
      invalidateRouteResolutionCache: jest.fn(),
    };
    const role = createMemoryService("role");
    const rolesToPermissions = createMemoryService("role-permission");
    const subjectsToRoles = createMemoryService("subject-role");
    const service = new SocialProfileKnowledgeAccessService({
      permission: permission as any,
      role: role as any,
      rolesToPermissions: rolesToPermissions as any,
      subjectsToRoles: subjectsToRoles as any,
    });
    const socialModuleProfileId = "82d95822-2e14-4b5a-9576-2d1f11fa27c2";

    await service.ensure({
      ownerRbacSubjectId: "telegram-owner-subject-id",
      socialModuleProfileId,
    });
    await service.ensure({
      ownerRbacSubjectId: "browser-manager-subject-id",
      socialModuleProfileId,
    });

    expect(role.rows).toHaveLength(1);
    expect(permission.rows).toHaveLength(28);
    expect(rolesToPermissions.rows).toHaveLength(28);
    expect(subjectsToRoles.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ subjectId: "telegram-owner-subject-id" }),
        expect.objectContaining({ subjectId: "browser-manager-subject-id" }),
      ]),
    );
  });

  /**
   * BDD Scenario
   * Given: permissions are generated for one exact target social.profile UUID.
   * When: collection and item paths are inspected.
   * Then: the target UUID remains literal while only declared requester, chat, and document ids are masks.
   */
  it("When: permission paths are generated Then: masks only declared ids", () => {
    const profileId = "82d95822-2e14-4b5a-9576-2d1f11fa27c2";
    const descriptors = getSocialProfileKnowledgePermissionDescriptors({
      ownerRbacSubjectId: "owner-subject-id",
      socialModuleProfileId: profileId,
    });

    expect(descriptors).toHaveLength(14);
    expect(
      descriptors
        .filter(({ path }) => !path.endsWith("/profiles"))
        .every(({ path }) => path.includes(profileId)),
    ).toBe(true);
    expect(
      descriptors.every(
        ({ path }) =>
          path.includes("profiles/[social.profiles.id]") &&
          path.includes("chats/[social.chats.id]"),
      ),
    ).toBe(true);
    expect(
      descriptors
        .filter(({ path }) => path.includes("/knowledge/documents/"))
        .every(({ path }) => path.includes("[knowledge.documents.id]")),
    ).toBe(true);
    expect(
      descriptors.some(({ path }) =>
        path.includes("[target.social.profiles.id]"),
      ),
    ).toBe(false);
    expect(descriptors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: "GET",
          path: expect.stringMatching(/\/profiles$/),
        }),
        expect.objectContaining({
          method: "PATCH",
          path: expect.stringMatching(new RegExp(`/profiles/${profileId}$`)),
        }),
        expect.objectContaining({
          method: "POST",
          path: expect.stringMatching(/\/avatar$/),
        }),
        expect.objectContaining({
          method: "GET",
          path: expect.stringMatching(/\/skills\/available$/),
        }),
        expect.objectContaining({
          method: "DELETE",
          path: expect.stringContaining("/skills/[social.skills.id]"),
        }),
      ]),
    );
  });
});
