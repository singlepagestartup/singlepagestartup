/**
 * BDD Suite: social profile MCP server configuration contract.
 *
 * Given: profiles opt into MCP servers by stable identifier.
 * When: schema defaults and configured identifiers are resolved.
 * Then: MCP access defaults to empty and only the SinglePageStartup server is supported.
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
   * BDD Scenario: the built-in SinglePageStartup server is recognized.
   *
   * Given: a profile stores the SinglePageStartup server identifier.
   * When: the configuration is resolved.
   * Then: SinglePageStartup is supported and no stale identifiers are reported.
   */
  test("When: SinglePageStartup is configured Then: it resolves as the supported server", () => {
    expect(resolveMcpServerConfiguration(["singlepagestartup"])).toEqual({
      supported: [
        expect.objectContaining({
          id: "singlepagestartup",
        }),
      ],
      stale: [],
    });
  });

  /**
   * BDD Scenario: an unavailable stored identifier is preserved but inactive.
   *
   * Given: a profile contains an identifier unknown to this deployment.
   * When: SinglePageStartup MCP is enabled.
   * Then: the stale value is rejected from the active configuration.
   */
  test("When: SinglePageStartup is enabled beside a stale value Then: stale data is excluded from the active configuration", () => {
    const configured = setMcpServerEnabled(
      ["retired-server"],
      "singlepagestartup",
      true,
    );

    expect(configured).toEqual(["singlepagestartup"]);
    expect(resolveMcpServerConfiguration(configured)).toEqual({
      supported: [
        expect.objectContaining({
          id: "singlepagestartup",
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
