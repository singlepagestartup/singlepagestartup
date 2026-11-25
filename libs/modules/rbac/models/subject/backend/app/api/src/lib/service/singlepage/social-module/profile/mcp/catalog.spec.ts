/**
 * BDD Suite: profile-scoped MCP server catalog.
 *
 * Given: a social profile stores allowed MCP server identifiers.
 * When: RBAC resolves and opens its rbac.subject MCP catalog.
 * Then: only supported configured servers connect and stale identifiers remain visible.
 */

import { Service as ProfileMcpCatalogService } from "./catalog";
import { WorkMcpSession } from "./work-session";

function createSession() {
  return {
    serverId: "singlepagestartup" as const,
    listTools: jest.fn().mockResolvedValue([
      {
        name: "module-list",
        inputSchema: { type: "object" },
      },
    ]),
    callTool: jest.fn().mockResolvedValue({
      isError: false,
      text: '{"ok":true}',
    }),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe("profile-scoped MCP server catalog", () => {
  /**
   * BDD Scenario: MCP access is opt-in.
   *
   * Given: a profile has no allowed MCP servers.
   * When: its catalog is opened.
   * Then: descriptors remain discoverable but no server or tool session is connected.
   */
  it("does not connect when the profile has no allowed server", async () => {
    const singlePageStartupMcpClient = { openSession: jest.fn() };
    const service = new ProfileMcpCatalogService(
      singlePageStartupMcpClient as any,
    );
    const catalogSession = await service.open({
      configuredServerIds: [],
      rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
    });

    expect(catalogSession.catalog.supported).toEqual([
      expect.objectContaining({ id: "singlepagestartup" }),
    ]);
    expect(catalogSession.catalog.connected).toEqual([]);
    expect(singlePageStartupMcpClient.openSession).not.toHaveBeenCalled();
    await catalogSession.close();
  });

  /**
   * BDD Scenario: supported and stale server identifiers.
   *
   * Given: a profile allows SinglePageStartup MCP and retains an obsolete identifier.
   * When: the catalog is resolved.
   * Then: SinglePageStartup tools are live while the obsolete identifier is reported without connection.
   */
  it("connects SinglePageStartup MCP and reports stale identifiers", async () => {
    const session = createSession();
    const singlePageStartupMcpClient = {
      openSession: jest.fn().mockResolvedValue(session),
    };
    const service = new ProfileMcpCatalogService(
      singlePageStartupMcpClient as any,
    );
    const catalogSession = await service.open({
      configuredServerIds: ["singlepagestartup", "retired-server"],
      rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
    });

    expect(singlePageStartupMcpClient.openSession).toHaveBeenCalledWith({
      rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
    });
    expect(catalogSession.catalog.connected).toEqual([
      expect.objectContaining({
        id: "singlepagestartup",
        tools: [expect.objectContaining({ name: "module-list" })],
      }),
    ]);
    expect(catalogSession.catalog.stale).toEqual(["retired-server"]);

    await catalogSession.callTool({
      serverId: "singlepagestartup",
      name: "module-list",
      arguments: {},
    });
    expect(session.callTool).toHaveBeenCalledWith({
      name: "module-list",
      arguments: {},
    });
    await catalogSession.close();
    expect(session.close).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: configured-server boundary.
   *
   * Given: only SinglePageStartup MCP is connected for a profile.
   * When: a call names a different MCP server.
   * Then: dispatch is rejected before any MCP tool call.
   */
  it("rejects tools routed to a server not connected for the profile", async () => {
    const session = createSession();
    const service = new ProfileMcpCatalogService({
      openSession: jest.fn().mockResolvedValue(session),
    } as any);
    const catalogSession = await service.open({
      configuredServerIds: ["singlepagestartup"],
      rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
    });

    await expect(
      catalogSession.callTool({
        serverId: "external",
        name: "module-list",
        arguments: {},
      }),
    ).rejects.toThrow("not connected for this profile");
    expect(session.callTool).not.toHaveBeenCalled();
    await catalogSession.close();
  });

  /**
   * BDD Scenario: partial session cleanup.
   *
   * Given: a supported server session opens but live catalog loading fails.
   * When: profile catalog construction aborts.
   * Then: the already opened MCP session is still closed.
   */
  it("closes opened sessions when catalog loading fails", async () => {
    const session = createSession();
    session.listTools.mockRejectedValue(new Error("catalog unavailable"));
    const service = new ProfileMcpCatalogService({
      openSession: jest.fn().mockResolvedValue(session),
    } as any);

    await expect(
      service.open({
        configuredServerIds: ["singlepagestartup"],
        rbacSubjectAuthenticationJwt: "rbac-subject-authentication-jwt",
      }),
    ).rejects.toThrow("catalog unavailable");
    expect(session.close).toHaveBeenCalledTimes(1);
  });
});

describe("work agent MCP routing", () => {
  it("routes identical tool names to their own connection under the assigned identity", async () => {
    const first = createSession();
    const second = createSession();
    const external = {
      descriptor: { id: "inventory", title: "Inventory", description: "" },
      openSession: jest.fn().mockResolvedValue(second),
    };
    const local = { openSession: jest.fn().mockResolvedValue(first) };
    const catalog = await new ProfileMcpCatalogService(local as any, [
      external,
    ]).open({
      configuredServerIds: ["inventory", "singlepagestartup", "inventory"],
      rbacSubjectAuthenticationJwt: "local-only",
      subjectId: "agent",
    });
    expect(external.openSession).toHaveBeenCalledWith({ subjectId: "agent" });
    const authorize = jest.fn().mockResolvedValue(undefined);
    const session = new WorkMcpSession(catalog, authorize);
    const [localName, externalName] = session.tools.map(
      (tool) => tool.function.name,
    );
    expect(localName).not.toBe(externalName);
    expect(externalName).toMatch(/^[a-zA-Z0-9_-]{1,64}$/);
    expect(session.tools[1].function.parameters).toEqual({ type: "object" });
    await session.call(externalName, { query: "item" });
    expect(authorize).toHaveBeenCalledWith("inventory");
    expect(second.callTool).toHaveBeenCalledWith({
      name: "module-list",
      arguments: { query: "item" },
    });
    expect(first.callTool).not.toHaveBeenCalled();
    await expect(session.call("unpublished", {})).rejects.toThrow("Unknown");
    authorize.mockRejectedValueOnce(new Error("connection removed"));
    await expect(session.call(localName, {})).rejects.toThrow(
      "connection removed",
    );
    expect(first.callTool).not.toHaveBeenCalled();
    await session.close();
    expect(first.close).toHaveBeenCalledTimes(1);
    expect(second.close).toHaveBeenCalledTimes(1);
  });
});
