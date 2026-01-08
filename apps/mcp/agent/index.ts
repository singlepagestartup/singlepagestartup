import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as agentRegisterResources,
  registerTools as agentRegisterTools,
} from "./agent";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";

export function registerResources(mcp: McpServer) {
  agentRegisterResources(mcp);
  widgetRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  agentRegisterTools(mcp);
  widgetRegisterTools(mcp);
}
