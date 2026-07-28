/**
 * BDD Suite: service-composed RBAC authorization.
 *
 * Given: Permission, roles-to-permissions, and subjects-to-roles services are injected.
 * When: authorization is evaluated.
 * Then: filtered service reads replace loopback API calls while public permissions remain public.
 */

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_JWT_SECRET: "test-jwt-secret",
  };
});

jest.mock("hono/jwt", () => ({
  verify: jest.fn().mockResolvedValue({
    subject: { id: "subject-1" },
  }),
}));

import { Service } from "./is-authorized";

describe("Given: injected RBAC services", () => {
  /**
   * BDD Scenario
   * Given: a route resolves to a permission with no role relations.
   * When: an anonymous request is authorized.
   * Then: the existing role-less public-permission behavior is preserved.
   */
  it("When: the permission has no roles Then: keeps it public", async () => {
    const permission = {
      id: "permission-public",
      type: "HTTP",
      method: "GET",
      path: "/public-route",
    };
    const permissionService = {
      resolveByRoute: jest.fn().mockResolvedValue({
        permission,
        permissionsToBillingModuleCurrencies: [],
      }),
    };
    const rolesToPermissionsService = {
      find: jest.fn().mockResolvedValue([]),
    };
    const service = new Service(
      permissionService as any,
      rolesToPermissionsService as any,
      { find: jest.fn() } as any,
    );

    await expect(
      service.execute({
        permission: { route: "/public-route", method: "GET", type: "HTTP" },
        authorization: {},
      }),
    ).resolves.toEqual({ ok: true });
    expect(rolesToPermissionsService.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "permissionId",
              method: "eq",
              value: "permission-public",
            },
          ],
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: a permission and subject share one role.
   * When: the subject JWT is authorized.
   * Then: only filtered relation-service queries are used and access succeeds.
   */
  it("When: the subject owns the permission role Then: authorizes through services", async () => {
    const rolesToPermissionsService = {
      find: jest
        .fn()
        .mockResolvedValue([
          { permissionId: "permission-private", roleId: "role-owner" },
        ]),
    };
    const subjectsToRolesService = {
      find: jest
        .fn()
        .mockResolvedValue([{ subjectId: "subject-1", roleId: "role-owner" }]),
    };
    const service = new Service(
      {
        resolveByRoute: jest.fn().mockResolvedValue({
          permission: { id: "permission-private" },
          permissionsToBillingModuleCurrencies: [],
        }),
      } as any,
      rolesToPermissionsService as any,
      subjectsToRolesService as any,
    );

    await expect(
      service.execute({
        permission: {
          route: "/private-route-for-service-test",
          method: "GET",
          type: "HTTP",
        },
        authorization: { value: "subject-jwt-for-service-test" },
      }),
    ).resolves.toEqual({ ok: true });
    expect(subjectsToRolesService.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: "subject-1" }],
        },
      },
    });
  });
});
