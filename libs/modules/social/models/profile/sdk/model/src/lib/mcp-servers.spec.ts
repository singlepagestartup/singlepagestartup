/**
 * BDD Suite: social profile MCP server configuration contract.
 *
 * Given: profiles opt into MCP servers by stable identifier.
 * When: schema defaults and configured identifiers are resolved.
 * Then: MCP access defaults to empty and only the project server is supported.
 */

import { insertSchema } from "./index";
import {
  resolveMcpServerConfiguration,
  setMcpServerEnabled,
} from "./mcp-servers";

describe("GIVEN: social profile MCP server configuration", () => {
  /**
   * BDD Scenario: a profile does not receive MCP access implicitly.
   *
   * Given: profile input omits allowed MCP servers.
   * When: the input schema applies defaults.
   * Then: the allowed server list is empty.
   */
  test("When: allowed servers are omitted Then: the schema defaults to an empty list", () => {
    expect(insertSchema.parse({}).allowedMcpServerIds).toEqual([]);
  });

  /**
   * BDD Scenario: the built-in project server is recognized.
   *
   * Given: a profile stores the project server identifier.
   * When: the configuration is resolved.
   * Then: project is supported and no stale identifiers are reported.
   */
  test("When: project is configured Then: it resolves as the supported server", () => {
    expect(resolveMcpServerConfiguration(["project"])).toEqual({
      supported: [
        expect.objectContaining({
          id: "project",
        }),
      ],
      stale: [],
    });
  });

  /**
   * BDD Scenario: an unavailable stored identifier is preserved but inactive.
   *
   * Given: a profile contains an identifier unknown to this deployment.
   * When: project MCP is enabled.
   * Then: the stale value is rejected from the active configuration.
   */
  test("When: project is enabled beside a stale value Then: stale data is excluded from the active configuration", () => {
    const configured = setMcpServerEnabled(["retired-server"], "project", true);

    expect(configured).toEqual(["project"]);
    expect(resolveMcpServerConfiguration(configured)).toEqual({
      supported: [
        expect.objectContaining({
          id: "project",
        }),
      ],
      stale: [],
    });
    expect(resolveMcpServerConfiguration(["retired-server"])).toEqual({
      supported: [],
      stale: ["retired-server"],
    });
    expect(() =>
      insertSchema.parse({ allowedMcpServerIds: ["retired-server"] }),
    ).toThrow();
  });
});
