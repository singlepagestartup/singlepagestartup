import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as notificationRegisterResources,
  registerTools as notificationRegisterTools,
} from "./notification";
import {
  registerResources as templateRegisterResources,
  registerTools as templateRegisterTools,
} from "./template";
import {
  registerResources as topicRegisterResources,
  registerTools as topicRegisterTools,
} from "./topic";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as notificationsToTemplatesRegisterResources,
  registerTools as notificationsToTemplatesRegisterTools,
} from "./notifications-to-templates";
import {
  registerResources as topicsToNotificationsRegisterResources,
  registerTools as topicsToNotificationsRegisterTools,
} from "./topics-to-notifications";

export function registerResources(mcp: McpServer) {
  notificationRegisterResources(mcp);
  templateRegisterResources(mcp);
  topicRegisterResources(mcp);
  widgetRegisterResources(mcp);
  notificationsToTemplatesRegisterResources(mcp);
  topicsToNotificationsRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  notificationRegisterTools(mcp);
  templateRegisterTools(mcp);
  topicRegisterTools(mcp);
  widgetRegisterTools(mcp);
  notificationsToTemplatesRegisterTools(mcp);
  topicsToNotificationsRegisterTools(mcp);
}
