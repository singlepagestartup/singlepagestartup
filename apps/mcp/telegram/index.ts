import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as pageRegisterResources,
  registerTools as pageRegisterTools,
} from "./page";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as pagesToWidgetsRegisterResources,
  registerTools as pagesToWidgetsRegisterTools,
} from "./pages-to-widgets";
import {
  registerResources as widgetsToExternalWidgetsRegisterResources,
  registerTools as widgetsToExternalWidgetsRegisterTools,
} from "./widgets-to-external-widgets";

export function registerResources(mcp: McpServer) {
  pageRegisterResources(mcp);
  widgetRegisterResources(mcp);
  pagesToWidgetsRegisterResources(mcp);
  widgetsToExternalWidgetsRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  pageRegisterTools(mcp);
  widgetRegisterTools(mcp);
  pagesToWidgetsRegisterTools(mcp);
  widgetsToExternalWidgetsRegisterTools(mcp);
}
