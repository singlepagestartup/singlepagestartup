import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerPrompts as contentManagementRegisterPrompts,
  registerResources as contentManagementRegisterResources,
  registerTools as contentManagementRegisterTools,
} from "./content-management";
import { SPS_MCP_SERVER_INSTRUCTIONS } from "./lib/guidance";

export function createMcpServer() {
  const mcp = new McpServer(
    {
      name: "singlepagestartup-mcp",
      version: "1.0.0",
    },
    {
      instructions: SPS_MCP_SERVER_INSTRUCTIONS,
    },
  );

  contentManagementRegisterResources(mcp);
  contentManagementRegisterTools(mcp);
  contentManagementRegisterPrompts(mcp);

  return mcp;
}

export const mcp = createMcpServer();
