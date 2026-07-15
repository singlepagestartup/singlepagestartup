/**
 * BDD Suite: owner-scoped profile MCP catalog endpoint.
 *
 * Given: route middleware has established that the subject owns the profile.
 * When: the profile MCP descriptor endpoint is requested.
 * Then: configured identifiers and the owner bearer are resolved through RBAC service.
 */

const sign = jest
  .fn()
  .mockResolvedValue("server-signed-rbac-subject-authentication-jwt");

jest.mock("hono/jwt", () => ({ sign }));
jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "rbac-jwt-secret",
  RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
}));

import { Handler } from "./find";

describe("owner-scoped profile MCP catalog endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: live catalog response and cleanup.
   *
   * Given: a profile allows SinglePageStartup MCP and the authenticated owner supplies an RBAC subject authentication JWT.
   * When: its MCP server descriptors are requested.
   * Then: the catalog is returned and its turn-scoped session is closed.
   */
  it("returns the profile catalog and closes its MCP session", async () => {
    const close = jest.fn().mockResolvedValue(undefined);
    const catalog = {
      supported: [{ id: "singlepagestartup", title: "SinglePageStartup MCP" }],
      connected: [
        { id: "singlepagestartup", title: "SinglePageStartup MCP", tools: [] },
      ],
      stale: ["retired-server"],
    };
    const service = {
      socialModule: {
        profile: {
          findById: jest.fn().mockResolvedValue({
            id: "profile-1",
            allowedMcpServerIds: ["singlepagestartup", "retired-server"],
          }),
        },
      },
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([
          {
            subjectId: "rbac-subject-1",
            socialModuleProfileId: "profile-1",
          },
        ]),
      },
      findById: jest.fn().mockResolvedValue({
        id: "rbac-subject-1",
        slug: "rbac.subject",
      }),
      socialModuleProfileMcpCatalogOpen: jest
        .fn()
        .mockResolvedValue({ catalog, close }),
    } as any;
    const context = {
      req: {
        param: jest.fn((name: string) =>
          name === "socialModuleProfileId" ? "profile-1" : undefined,
        ),
      },
      json: jest.fn((body: unknown) => new Response(JSON.stringify(body))),
    } as any;

    await new Handler(service).execute(context, undefined);

    expect(service.socialModuleProfileMcpCatalogOpen).toHaveBeenCalledWith({
      configuredServerIds: ["singlepagestartup", "retired-server"],
      rbacSubjectAuthenticationJwt:
        "server-signed-rbac-subject-authentication-jwt",
    });
    expect(sign).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.objectContaining({ id: "rbac-subject-1" }),
      }),
      "rbac-jwt-secret",
    );
    expect(context.json).toHaveBeenCalledWith({ data: catalog });
    expect(close).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: ambiguous rbac.subject identity.
   *
   * Given: a profile is linked to multiple RBAC subjects.
   * When: its MCP catalog is requested.
   * Then: no rbac.subject JWT or MCP session is created.
   */
  it("fails closed unless the profile has exactly one rbac.subject", async () => {
    const service = {
      socialModule: {
        profile: {
          findById: jest.fn().mockResolvedValue({
            id: "profile-1",
            allowedMcpServerIds: ["singlepagestartup"],
          }),
        },
      },
      subjectsToSocialModuleProfiles: {
        find: jest
          .fn()
          .mockResolvedValue([
            { subjectId: "rbac.subject-1" },
            { subjectId: "rbac.subject-2" },
          ]),
      },
      findById: jest.fn(),
      socialModuleProfileMcpCatalogOpen: jest.fn(),
    } as any;
    const context = {
      req: {
        param: jest.fn(() => "profile-1"),
      },
    } as any;

    await expect(
      new Handler(service).execute(context, undefined),
    ).rejects.toThrow("exactly one linked rbac.subject");
    expect(sign).not.toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.anything() }),
      expect.anything(),
    );
    expect(service.socialModuleProfileMcpCatalogOpen).not.toHaveBeenCalled();
  });
});
