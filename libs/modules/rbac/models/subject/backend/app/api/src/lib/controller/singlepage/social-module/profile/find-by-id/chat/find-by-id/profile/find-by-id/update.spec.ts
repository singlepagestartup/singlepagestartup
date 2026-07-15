/**
 * BDD Suite: chat-local AI profile MCP configuration update.
 *
 * Given: an authorized chat operator edits an AI profile.
 * When: allowed MCP server identifiers are submitted through the profile sidebar route.
 * Then: only supported identifiers are forwarded to the Social profile SDK.
 */

const socialModuleProfileUpdate = jest.fn();

jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: {
    update: socialModuleProfileUpdate,
  },
}));
jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "rbac-secret",
}));

import { Handler } from "./update";

function createContext(allowedMcpServerIds: unknown) {
  return {
    req: {
      param: jest.fn(() => "profile-1"),
      json: jest.fn().mockResolvedValue({
        data: {
          allowedMcpServerIds,
        },
      }),
      parseBody: jest.fn(),
    },
    json: jest.fn((body: unknown) => new Response(JSON.stringify(body))),
  } as any;
}

describe("GIVEN: an authorized chat-local AI profile update", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const context = createContext(["singlepagestartup"]);

    await new Handler({} as any).execute(context, jest.fn());

    expect(socialModuleProfileUpdate).toHaveBeenCalledWith({
      id: "profile-1",
      data: {
        allowedMcpServerIds: ["singlepagestartup"],
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
    const context = createContext(["remote-server"]);

    await expect(
      new Handler({} as any).execute(context, jest.fn()),
    ).rejects.toThrow("Unsupported MCP server identifier");
    expect(socialModuleProfileUpdate).not.toHaveBeenCalled();
  });
});
