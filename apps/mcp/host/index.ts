import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as layoutRegisterResources,
  registerTools as layoutRegisterTools,
} from "./layout";
import {
  registerResources as metadataRegisterResources,
  registerTools as metadataRegisterTools,
} from "./metadata";
import {
  registerResources as pageRegisterResources,
  registerTools as pageRegisterTools,
} from "./page";
import {
  registerResources as pagesToWidgetsRegisterResources,
  registerTools as pagesToWidgetsRegisterTools,
} from "./pages-to-widgets";
import {
  registerResources as pagesToLayoutsRegisterResources,
  registerTools as pagesToLayoutsRegisterTools,
} from "./pages-to-layouts";
import {
  registerResources as pagesToMetadataRegisterResources,
  registerTools as pagesToMetadataRegisterTools,
} from "./pages-to-metadata";
import {
  registerResources as layoutsToWidgetsRegisterResources,
  registerTools as layoutsToWidgetsRegisterTools,
} from "./layouts-to-widgets";
import {
  registerResources as widgetsToExternalWidgetsRegisterResources,
  registerTools as widgetsToExternalWidgetsRegisterTools,
} from "./widgets-to-external-widgets";

export function registerResources(mcp: McpServer) {
  widgetRegisterResources(mcp);
  layoutRegisterResources(mcp);
  metadataRegisterResources(mcp);
  pageRegisterResources(mcp);
  pagesToWidgetsRegisterResources(mcp);
  pagesToLayoutsRegisterResources(mcp);
  pagesToMetadataRegisterResources(mcp);
  layoutsToWidgetsRegisterResources(mcp);
  widgetsToExternalWidgetsRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  widgetRegisterTools(mcp);
  layoutRegisterTools(mcp);
  metadataRegisterTools(mcp);
  pageRegisterTools(mcp);
  pagesToWidgetsRegisterTools(mcp);
  pagesToLayoutsRegisterTools(mcp);
  pagesToMetadataRegisterTools(mcp);
  layoutsToWidgetsRegisterTools(mcp);
  widgetsToExternalWidgetsRegisterTools(mcp);
}
