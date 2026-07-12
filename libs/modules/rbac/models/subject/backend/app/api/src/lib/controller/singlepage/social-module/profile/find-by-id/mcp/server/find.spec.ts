/**
 * BDD Suite: owner-scoped profile MCP catalog endpoint.
 *
 * Given: route middleware has established that the subject owns the profile.
 * When: the profile MCP descriptor endpoint is requested.
 * Then: configured identifiers and the owner bearer are resolved through RBAC service.
 */

const sign = jest.fn().mockResolvedValue("server-signed-employee-jwt");

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
   * Given: a profile allows project MCP and the authenticated owner supplies an SPS JWT.
   * When: its MCP server descriptors are requested.
   * Then: the catalog is returned and its turn-scoped session is closed.
   */
  it("returns the profile catalog and closes its MCP session", async () => {
    const close = jest.fn().mockResolvedValue(undefined);
    const catalog = {
      supported: [{ id: "project", title: "Project MCP" }],
      connected: [{ id: "project", title: "Project MCP", tools: [] }],
      stale: ["retired-server"],
    };
    const service = {
      socialModule: {
        profile: {
          findById: jest.fn().mockResolvedValue({
            id: "profile-1",
            allowedMcpServerIds: ["project", "retired-server"],
          }),
        },
      },
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([
          {
            subjectId: "employee-subject-1",
            socialModuleProfileId: "profile-1",
          },
        ]),
      },
      findById: jest.fn().mockResolvedValue({
        id: "employee-subject-1",
        slug: "employee",
      }),
      openProfileMcpCatalog: jest.fn().mockResolvedValue({ catalog, close }),
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

    expect(service.openProfileMcpCatalog).toHaveBeenCalledWith({
      configuredServerIds: ["project", "retired-server"],
      employeeSpsJwt: "server-signed-employee-jwt",
    });
    expect(sign).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.objectContaining({ id: "employee-subject-1" }),
      }),
      "rbac-jwt-secret",
    );
    expect(context.json).toHaveBeenCalledWith({ data: catalog });
    expect(close).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: ambiguous employee identity.
   *
   * Given: a profile is linked to multiple RBAC subjects.
   * When: its MCP catalog is requested.
   * Then: no employee JWT or MCP session is created.
   */
  it("fails closed unless the profile has exactly one employee subject", async () => {
    const service = {
      socialModule: {
        profile: {
          findById: jest.fn().mockResolvedValue({
            id: "profile-1",
            allowedMcpServerIds: ["project"],
          }),
        },
      },
      subjectsToSocialModuleProfiles: {
        find: jest
          .fn()
          .mockResolvedValue([
            { subjectId: "employee-1" },
            { subjectId: "employee-2" },
          ]),
      },
      findById: jest.fn(),
      openProfileMcpCatalog: jest.fn(),
    } as any;
    const context = {
      req: {
        param: jest.fn(() => "profile-1"),
      },
    } as any;

    await expect(
      new Handler(service).execute(context, undefined),
    ).rejects.toThrow("exactly one employee subject");
    expect(sign).not.toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.anything() }),
      expect.anything(),
    );
    expect(service.openProfileMcpCatalog).not.toHaveBeenCalled();
  });
});
