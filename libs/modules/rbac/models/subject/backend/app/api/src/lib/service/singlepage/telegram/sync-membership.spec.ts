/**
 * BDD Suite: telegram sync-membership.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

const mockSubjectsToRolesCreate = jest.fn();
const mockSubjectsToRolesDelete = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "test-rbac-secret",
}));

jest.mock("@sps/rbac/relations/subjects-to-roles/sdk/server", () => ({
  api: {
    create: (...args: unknown[]) => mockSubjectsToRolesCreate(...args),
    delete: (...args: unknown[]) => mockSubjectsToRolesDelete(...args),
  },
}));

import { Service } from "./sync-membership";

describe("Given: telegram membership synchronization runs for a subject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("When: availableOnRegistration roles include product-bound roles", () => {
    it("Then: only non-product registration roles are attached", async () => {
      const role = {
        find: jest.fn().mockImplementation((props?: any) => {
          const filters = props?.params?.filters?.and ?? [];

          const hasRequiredChannelRoleFilter = filters.some((filter: any) => {
            return (
              filter.column === "slug" &&
              filter.method === "eq" &&
              filter.value === "required-telegram-channel-subscriber"
            );
          });

          if (hasRequiredChannelRoleFilter) {
            return Promise.resolve([]);
          }

          const hasRegistrationRoleFilter = filters.some((filter: any) => {
            return (
              filter.column === "availableOnRegistration" &&
              filter.method === "eq" &&
              filter.value === true
            );
          });

          if (hasRegistrationRoleFilter) {
            return Promise.resolve([
              {
                id: "role-free-subscriber",
                slug: "free-subscriber",
                availableOnRegistration: true,
              },
              {
                id: "role-user",
                slug: "user",
                availableOnRegistration: true,
              },
            ]);
          }

          return Promise.resolve([]);
        }),
      } as any;

      const subjectsToRoles = {
        find: jest.fn().mockResolvedValue([]),
      } as any;

      const rolesToEcommerceModuleProducts = {
        find: jest.fn().mockResolvedValue([
          {
            id: "rtep-1",
            roleId: "role-free-subscriber",
            ecommerceModuleProductId: "product-free",
          },
        ]),
      } as any;

      const service = new Service({
        role,
        subjectsToRoles,
        rolesToEcommerceModuleProducts,
      });

      const result = await service.execute({
        id: "subject-1",
      });

      expect(mockSubjectsToRolesCreate).toHaveBeenCalledTimes(1);
      expect(mockSubjectsToRolesCreate).toHaveBeenCalledWith({
        data: {
          subjectId: "subject-1",
          roleId: "role-user",
        },
        options: {
          headers: expect.objectContaining({
            "X-RBAC-SECRET-KEY": "test-rbac-secret",
          }),
        },
      });

      expect(result.addedRoleIds).toEqual(["role-user"]);
      expect(result.removedRoleIds).toEqual([]);
    });
  });
});
