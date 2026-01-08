import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as channelRegisterResources,
  registerTools as channelRegisterTools,
} from "./channel";
import {
  registerResources as messageRegisterResources,
  registerTools as messageRegisterTools,
} from "./message";
import {
  registerResources as channelsToMessagesRegisterResources,
  registerTools as channelsToMessagesRegisterTools,
} from "./channels-to-messages";

export function registerResources(mcp: McpServer) {
  channelRegisterResources(mcp);
  messageRegisterResources(mcp);
  channelsToMessagesRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  channelRegisterTools(mcp);
  messageRegisterTools(mcp);
  channelsToMessagesRegisterTools(mcp);
}
