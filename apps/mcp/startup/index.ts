import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";

export function registerResources(mcp: McpServer) {
  widgetRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  widgetRegisterTools(mcp);
}
