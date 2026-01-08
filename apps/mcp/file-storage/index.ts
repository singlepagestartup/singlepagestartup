import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as fileRegisterResources,
  registerTools as fileRegisterTools,
} from "./file";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as widgetsToFilesRegisterResources,
  registerTools as widgetsToFilesRegisterTools,
} from "./widgets-to-files";

export function registerResources(mcp: McpServer) {
  fileRegisterResources(mcp);
  widgetRegisterResources(mcp);
  widgetsToFilesRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  fileRegisterTools(mcp);
  widgetRegisterTools(mcp);
  widgetsToFilesRegisterTools(mcp);
}
