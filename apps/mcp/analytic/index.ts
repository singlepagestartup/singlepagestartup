import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as metricRegisterResources,
  registerTools as metricRegisterTools,
} from "./metric";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";

export function registerResources(mcp: McpServer) {
  metricRegisterResources(mcp);
  widgetRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  metricRegisterTools(mcp);
  widgetRegisterTools(mcp);
}
