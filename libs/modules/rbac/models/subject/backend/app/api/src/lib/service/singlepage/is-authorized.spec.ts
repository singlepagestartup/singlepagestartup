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

import { JwtTokenExpired } from "hono/utils/jwt/types";
import { verify } from "hono/jwt";
import { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import { Service } from "./is-authorized";

/**
 * A real permission service, so the sensitive-route policy under test is the
 * framework one. Only the route resolution is stubbed, because that is the
 * database read.
 */
function createPermissionService(props: {
  permission?: Record<string, unknown>;
  rootPermission?: Record<string, unknown>;
}) {
  const service = new PermissionService({} as any, { find: jest.fn() } as any);

  service.find = jest.fn().mockResolvedValue([]);
  service.resolveByRoute = jest.fn().mockResolvedValue({
    permission: props.permission,
    rootPermission: props.rootPermission,
    permissionsToBillingModuleCurrencies: [],
  });

  return service;
}

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
    const permissionService = createPermissionService({ permission });
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
      createPermissionService({
        permission: { id: "permission-private" },
      }) as any,
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

  /**
   * BDD Scenario
   * Given: Hono rejects verification with its expired-token error, whose
   * message embeds the token.
   * When: a request carrying that token is authorized.
   * Then: the failure reaches the caller as a fixed authentication error that
   * repeats no part of the token.
   */
  it("When: the token is expired Then: fails with a token-free authentication error", async () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWJqZWN0Ijp7ImlkIjoiMSJ9fQ.s1gn4tur3";

    (verify as jest.Mock).mockRejectedValueOnce(new JwtTokenExpired(token));

    const service = new Service(
      { resolveByRoute: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
    );

    const execution = service.execute({
      permission: {
        route: "/private-route-for-expired-token",
        method: "GET",
        type: "HTTP",
      },
      authorization: { value: token },
    });

    await expect(execution).rejects.toThrow(
      "Authentication error. Token expired",
    );
    await expect(execution).rejects.not.toThrow(token);
  });
});

/**
 * BDD Suite: role-less permissions and the sensitive-route subtraction.
 *
 * Given: a route resolves to a permission row with no role relations.
 * When: authorization is evaluated for an anonymous and for a role-holding caller.
 * Then: ordinary public routes stay public and sensitive routes require a role.
 */
describe("Given: a role-less permission on a sensitive route", () => {
  /**
   * BDD Scenario
   * Given: the seeded identity collection permission carries no role.
   * When: an anonymous request is authorized.
   * Then: it is refused instead of falling public by omission.
   */
  it("When: an anonymous request hits it Then: refuses the read", async () => {
    const service = new Service(
      createPermissionService({
        permission: {
          id: "permission-identities-find",
          type: "HTTP",
          method: "GET",
          path: "/api/rbac/identities",
        },
      }) as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      { find: jest.fn() } as any,
    );

    await expect(
      service.execute({
        permission: {
          route: "/api/rbac/identities",
          method: "GET",
          type: "HTTP",
        },
        authorization: {},
      }),
    ).rejects.toThrow("Permission error");
  });

  /**
   * BDD Scenario
   * Given: the sensitive route's permission has the admin role attached.
   * When: a subject holding that role is authorized.
   * Then: the normal role intersection still grants access.
   */
  it("When: the caller holds the attached role Then: grants the read", async () => {
    (verify as jest.Mock).mockResolvedValueOnce({
      subject: { id: "subject-admin" },
    });

    const subjectsToRolesService = {
      find: jest
        .fn()
        .mockResolvedValue([
          { subjectId: "subject-admin", roleId: "role-admin" },
        ]),
    };
    const service = new Service(
      createPermissionService({
        permission: {
          id: "permission-identities-count",
          type: "HTTP",
          method: "GET",
          path: "/api/rbac/identities/count",
        },
      }) as any,
      {
        find: jest.fn().mockResolvedValue([
          {
            permissionId: "permission-identities-count",
            roleId: "role-admin",
          },
        ]),
      } as any,
      subjectsToRolesService as any,
    );

    await expect(
      service.execute({
        permission: {
          route: "/api/rbac/identities/count",
          method: "GET",
          type: "HTTP",
        },
        authorization: { value: "jwt-admin" },
      }),
    ).resolves.toEqual({ ok: true });
  });

  /**
   * BDD Scenario
   * Given: a subject that holds no role granting the route, and a root
   *        permission reserved for another role.
   * When: the subject requests the sensitive route.
   * Then: it is refused and the root-permission fallback does not rescue it.
   */
  it("When: the caller holds another role Then: the root fallback does not rescue it", async () => {
    (verify as jest.Mock).mockResolvedValueOnce({
      subject: { id: "subject-member" },
    });

    const service = new Service(
      createPermissionService({
        permission: {
          id: "permission-subjects-find",
          type: "HTTP",
          method: "GET",
          path: "/api/rbac/subjects",
        },
        rootPermission: { id: "permission-root", path: "*", method: "*" },
      }) as any,
      {
        find: jest.fn(async (props?: any) => {
          const permissionId = props?.params?.filters?.and?.[0]?.value;

          return permissionId === "permission-root"
            ? [{ permissionId, roleId: "role-admin" }]
            : [];
        }),
      } as any,
      {
        find: jest
          .fn()
          .mockResolvedValue([
            { subjectId: "subject-member", roleId: "role-user" },
          ]),
      } as any,
    );

    await expect(
      service.execute({
        permission: {
          route: "/api/rbac/subjects",
          method: "GET",
          type: "HTTP",
        },
        authorization: { value: "jwt-member" },
      }),
    ).rejects.toThrow("Permission error");
  });

  /**
   * BDD Scenario
   * Given: a project permission service that removes a route from the list.
   * When: an anonymous request hits that route.
   * Then: it is allowed, so the startup-layer override is the working seam.
   */
  it("When: the project reopens the route Then: honors the startup override", async () => {
    const permissionService = createPermissionService({
      permission: {
        id: "permission-roles-find",
        type: "HTTP",
        method: "GET",
        path: "/api/rbac/roles",
      },
    });
    permissionService.isSensitiveRoute = async (route: string) => {
      return route !== "/api/rbac/roles";
    };

    const service = new Service(
      permissionService as any,
      { find: jest.fn().mockResolvedValue([]) } as any,
      { find: jest.fn() } as any,
    );

    await expect(
      service.execute({
        permission: { route: "/api/rbac/roles", method: "GET", type: "HTTP" },
        authorization: {},
      }),
    ).resolves.toEqual({ ok: true });
  });
});
