import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as contentManagementRegisterResources,
  registerTools as contentManagementRegisterTools,
} from "./content-management";

export function createMcpServer() {
  const mcp = new McpServer({
    name: "singlepagestartup-mcp",
    version: "1.0.0",
  });

  contentManagementRegisterResources(mcp);
  contentManagementRegisterTools(mcp);

  return mcp;
}

export const mcp = createMcpServer();
