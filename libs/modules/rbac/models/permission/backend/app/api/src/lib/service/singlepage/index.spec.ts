/**
 * BDD Suite: RBAC permission route resolution.
 *
 * Given: exact, bracket-template, and wildcard HTTP permissions can coexist.
 * When: a request route is resolved.
 * Then: exact paths win and only bracketed segments behave as dynamic masks.
 */

import type { FindServiceProps } from "@sps/shared-backend-api";
import { Service } from ".";

function createService() {
  const service = new Service({} as any, { find: jest.fn() } as any);
  service.invalidateRouteResolutionCache();
  return service;
}

describe("Given: exact and masked RBAC permission paths", () => {
  /**
   * BDD Scenario
   * Given: an exact permission exists for the requested path.
   * When: the route is resolved.
   * Then: the exact permission is returned without scanning templates.
   */
  it("When: the exact path exists Then: resolves it before masks", async () => {
    const service = createService();
    const exactPermission = {
      id: "permission-exact",
      type: "HTTP",
      method: "GET",
      path: "/api/exact-profile-id/knowledge/sources",
    };
    service.find = jest.fn().mockImplementation(async (props: any) => {
      const pathFilter = props.params.filters.and.find(
        (filter: any) => filter.column === "path",
      );

      return pathFilter.method === "eq" &&
        pathFilter.value === exactPermission.path
        ? [exactPermission]
        : [];
    });

    await expect(
      service.resolveByRoute({
        permission: {
          type: "HTTP",
          method: "GET",
          route: exactPermission.path,
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({ permission: exactPermission }),
    );
    expect(service.find).not.toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filters: {
            and: expect.arrayContaining([
              expect.objectContaining({ method: "like" }),
            ]),
          },
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: requester profile, chat, and document ids are bracket masks but the target profile UUID is literal.
   * When: matching and non-matching target-profile routes are resolved.
   * Then: masked ids vary while the literal target profile cannot vary.
   */
  it("When: bracket masks are resolved Then: keeps the target profile UUID literal", async () => {
    const service = createService();
    const targetProfileId = "82d95822-2e14-4b5a-9576-2d1f11fa27c2";
    const templatePermission = {
      id: "permission-template",
      type: "HTTP",
      method: "PATCH",
      path: `/api/rbac/subjects/owner-id/social-module/profiles/[social.profiles.id]/chats/[social.chats.id]/profiles/${targetProfileId}/knowledge/sources/[knowledge.sources.id]`,
    };
    service.find = jest.fn().mockImplementation(async (props: any) => {
      const pathFilter = props.params.filters.and.find(
        (filter: any) => filter.column === "path",
      );

      return pathFilter.method === "like" ? [templatePermission] : [];
    });

    const matchingRoute = `/api/rbac/subjects/owner-id/social-module/profiles/requester-a/chats/chat-a/profiles/${targetProfileId}/knowledge/sources/document-a`;
    const foreignTargetRoute =
      "/api/rbac/subjects/owner-id/social-module/profiles/requester-b/chats/chat-b/profiles/another-profile-id/knowledge/sources/document-b";

    await expect(
      service.resolveByRoute({
        permission: {
          type: "HTTP",
          method: "PATCH",
          route: matchingRoute,
        },
      }),
    ).resolves.toEqual(
      expect.objectContaining({ permission: templatePermission }),
    );
    await expect(
      service.resolveByRoute({
        permission: {
          type: "HTTP",
          method: "PATCH",
          route: foreignTargetRoute,
        },
      }),
    ).resolves.toEqual(expect.objectContaining({ permission: undefined }));
  });
});

describe("UUID read permissions", () => {
  const collection = "/api/file-storage/files";
  const id = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
  const contentPermission = {
    path: `${collection}/:uuid/content`,
    method: "GET",
    type: "HTTP",
  };
  const readPermission = { ...contentPermission, path: `${collection}/:uuid` };

  function resolve(
    route: string,
    method = "GET",
    permissions = [readPermission, contentPermission],
  ) {
    const service = createService();
    service.find = jest
      .fn()
      .mockImplementation(async ({ params }: FindServiceProps) => {
        const path = params?.filters?.and.find(
          (filter) => filter.column === "path",
        );
        if (!path || path.method === "like") {
          return [];
        }
        return permissions.filter(
          (permission) =>
            permission.path === path.value && permission.method === method,
        );
      });
    return service.resolveByRoute({
      permission: { type: "HTTP", method, route },
    });
  }

  it("matches a record or its content and gives an exact record permission precedence", async () => {
    const exact = { ...readPermission, path: `${collection}/${id}` };
    expect((await resolve(exact.path)).permission).toBe(readPermission);
    expect((await resolve(exact.path + "/content")).permission).toBe(
      contentPermission,
    );
    expect(
      (await resolve(exact.path, "GET", [readPermission, exact])).permission,
    ).toBe(exact);
  });

  it.each([
    "dump",
    "count",
    "future-action",
    ":uuid",
    "%64ump",
    "dump/content",
    `${id}/delete`,
    `${id}/content/`,
  ])("does not grant %s through a record permission", async (suffix) => {
    expect(
      (await resolve(`${collection}/${suffix}`)).permission,
    ).toBeUndefined();
  });

  it("requires a separate HEAD permission for content", async () => {
    expect(
      (await resolve(`${collection}/${id}/content`, "HEAD")).permission,
    ).toBeUndefined();
  });
});
