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
    /**
     * BDD Scenario
     * Given: registration roles include both product-bound and ordinary roles.
     * When: Telegram membership synchronization runs.
     * Then: only the ordinary registration role is attached.
     */
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

  /**
   * BDD Scenario
   * Given: two Telegram updates concurrently observe one registration role as missing.
   * When: both updates try to attach the same subject-role pair.
   * Then: the unique-conflict loser re-reads the winning relation and both updates finish.
   */
  it("When: concurrent updates attach one role Then: both calls converge", async () => {
    const role = {
      find: jest.fn().mockImplementation((props?: any) => {
        const filters = props?.params?.filters?.and ?? [];
        const requiredChannelRole = filters.some((filter: any) => {
          return (
            filter.column === "slug" &&
            filter.method === "eq" &&
            filter.value === "required-telegram-channel-subscriber"
          );
        });

        if (requiredChannelRole) {
          return Promise.resolve([]);
        }

        return Promise.resolve([
          {
            id: "role-user",
            slug: "user",
            availableOnRegistration: true,
          },
        ]);
      }),
    } as any;

    const storedLinks: Array<{
      id: string;
      subjectId: string;
      roleId: string;
    }> = [];
    let initialReadCount = 0;
    let releaseInitialReads: () => void = () => undefined;
    const initialReadsReady = new Promise<void>((resolve) => {
      releaseInitialReads = resolve;
    });
    const subjectsToRoles = {
      find: jest.fn().mockImplementation(async (props?: any) => {
        const filters = props?.params?.filters?.and ?? [];
        const roleId = filters.find((filter: any) => {
          return filter.column === "roleId" && filter.method === "eq";
        })?.value;

        if (roleId) {
          return storedLinks.filter((link) => {
            return link.subjectId === "subject-1" && link.roleId === roleId;
          });
        }

        initialReadCount += 1;
        if (initialReadCount === 2) {
          releaseInitialReads();
        }
        await initialReadsReady;

        return [];
      }),
    } as any;
    const rolesToEcommerceModuleProducts = {
      find: jest.fn().mockResolvedValue([]),
    } as any;

    mockSubjectsToRolesCreate.mockImplementation(async (props: any) => {
      const existing = storedLinks.find((link) => {
        return (
          link.subjectId === props.data.subjectId &&
          link.roleId === props.data.roleId
        );
      });

      if (existing) {
        throw new Error(
          'duplicate key value violates unique constraint "sps_rc_subject_role_unique"',
        );
      }

      const created = {
        id: "subject-role-1",
        subjectId: props.data.subjectId,
        roleId: props.data.roleId,
      };
      storedLinks.push(created);

      return created;
    });

    const service = new Service({
      role,
      subjectsToRoles,
      rolesToEcommerceModuleProducts,
    });
    const results = await Promise.all([
      service.execute({ id: "subject-1" }),
      service.execute({ id: "subject-1" }),
    ]);

    expect(mockSubjectsToRolesCreate).toHaveBeenCalledTimes(2);
    expect(storedLinks).toHaveLength(1);
    expect(results.flatMap((result) => result.addedRoleIds)).toEqual([
      "role-user",
    ]);
    expect(results.every((result) => result.removedRoleIds.length === 0)).toBe(
      true,
    );
  });
});
