/**
 * BDD Suite: chat-local AI profile configuration update.
 *
 * Given: an authorized chat operator edits an AI profile.
 * When: a partial profile or MCP payload is submitted through the profile sidebar route.
 * Then: requested fields change while every omitted mutable field is preserved.
 */

const socialModuleProfileUpdate = jest.fn();
const socialModuleProfileFindById = jest.fn();

jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: {
    findById: socialModuleProfileFindById,
    update: socialModuleProfileUpdate,
  },
}));
jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "rbac-secret",
}));

import { Handler } from "./update";

function createContext(data: Record<string, unknown>) {
  return {
    req: {
      param: jest.fn(() => "profile-1"),
      json: jest.fn().mockResolvedValue({
        data,
      }),
      parseBody: jest.fn(),
    },
    json: jest.fn((body: unknown) => new Response(JSON.stringify(body))),
  } as any;
}

describe("GIVEN: an authorized chat-local AI profile update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    socialModuleProfileFindById.mockResolvedValue({
      id: "profile-1",
      adminTitle: "Assistant profile",
      allowedMcpServerIds: ["retired-server"],
      title: { en: "Assistant" },
      subtitle: { en: "Helper" },
      description: { en: "Description" },
    });
    socialModuleProfileUpdate.mockResolvedValue({
      id: "profile-1",
      allowedMcpServerIds: ["singlepagestartup"],
    });
  });

  /**
   * BDD Scenario: save the local MCP server.
   *
   * Given: the profile currently has no allowed MCP servers.
   * When: SinglePageStartup MCP is enabled from the chat sidebar.
   * Then: the stable identifier is persisted through the Social profile SDK.
   */
  test("When: SinglePageStartup MCP is enabled Then: its identifier is forwarded", async () => {
    const context = createContext({
      allowedMcpServerIds: ["singlepagestartup"],
    });

    await new Handler({} as any).execute(context, jest.fn());

    expect(socialModuleProfileUpdate).toHaveBeenCalledWith({
      id: "profile-1",
      data: {
        adminTitle: "Assistant profile",
        allowedMcpServerIds: ["retired-server", "singlepagestartup"],
        title: { en: "Assistant" },
        subtitle: { en: "Helper" },
        description: { en: "Description" },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
  });

  /**
   * BDD Scenario: reject an unknown MCP server.
   *
   * Given: the caller submits an identifier not supported by this deployment.
   * When: the profile update is validated.
   * Then: the update fails before the Social profile SDK is called.
   */
  test("When: an unknown MCP server is submitted Then: the update fails closed", async () => {
    const context = createContext({
      allowedMcpServerIds: ["remote-server"],
    });

    await expect(
      new Handler({} as any).execute(context, jest.fn()),
    ).rejects.toThrow("Unsupported MCP server identifier");
    expect(socialModuleProfileUpdate).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: preserve MCP while editing localized profile text.
   *
   * Given: an AI profile has an enabled MCP server and localized content.
   * When: only the Russian title is submitted through the profile editor.
   * Then: the update carries the existing MCP selection and all omitted fields.
   */
  test("When: profile text is edited Then: omitted configuration is preserved", async () => {
    socialModuleProfileFindById.mockResolvedValue({
      id: "profile-1",
      adminTitle: "Assistant profile",
      allowedMcpServerIds: ["singlepagestartup"],
      title: { en: "Assistant", ru: "Ассистент" },
      subtitle: {},
      description: {},
    });
    const context = createContext({
      title: { en: "Assistant", ru: "Новый ассистент" },
    });

    await new Handler({} as any).execute(context, jest.fn());

    expect(socialModuleProfileUpdate).toHaveBeenCalledWith({
      id: "profile-1",
      data: {
        adminTitle: "Assistant profile",
        allowedMcpServerIds: ["singlepagestartup"],
        title: { en: "Assistant", ru: "Новый ассистент" },
        subtitle: {},
        description: {},
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
  });
});
