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
  ...jest.requireActual("@sps/shared-utils"),
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
        allowedMcpServerIds: ["retired-server", "singlepagestartup"],
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
   * Then: only the title is updated, retaining its English translation.
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
      title: { ru: "Новый ассистент" },
    });

    await new Handler({} as any).execute(context, jest.fn());

    expect(socialModuleProfileUpdate).toHaveBeenCalledWith({
      id: "profile-1",
      data: {
        title: { en: "Assistant", ru: "Новый ассистент" },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
  });
  test("preserves legacy localized JSON and stored rich text when adding an English translation", async () => {
    const richDescription = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ text: "Описание" }] }],
    };
    socialModuleProfileFindById.mockResolvedValue({
      adminTitle: "Internal label",
      allowedMcpServerIds: ["retired-server"],
      title: JSON.stringify({ ru: "Агент", de: "Agent" }),
      description: richDescription,
    });
    await new Handler({} as any).execute(
      createContext({ title: { en: "Assistant" } }),
      jest.fn(),
    );
    expect(socialModuleProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: { ru: "Агент", de: "Agent", en: "Assistant" } },
      }),
    );
  });
  it("rejects only edited translations over the role limit, preserving historic translations", async () => {
    const old = "a".repeat(12001);
    socialModuleProfileFindById.mockResolvedValue({
      description: { en: old, ru: "previous" },
    });
    await expect(
      new Handler({} as any).execute(
        createContext({ description: { ru: old } }),
        jest.fn(),
      ),
    ).rejects.toThrow("12000");
    expect(socialModuleProfileUpdate).not.toHaveBeenCalled();
    const edited = old.slice(1);
    await new Handler({} as any).execute(
      createContext({ description: { en: old, ru: edited } }),
      jest.fn(),
    );
    expect(socialModuleProfileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { description: { en: old, ru: edited } },
      }),
    );
  });
});
