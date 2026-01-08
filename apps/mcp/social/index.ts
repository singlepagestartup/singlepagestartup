import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as actionRegisterResources,
  registerTools as actionRegisterTools,
} from "./action";
import {
  registerResources as attributeRegisterResources,
  registerTools as attributeRegisterTools,
} from "./attribute";
import {
  registerResources as attributeKeyRegisterResources,
  registerTools as attributeKeyRegisterTools,
} from "./attribute-key";
import {
  registerResources as chatRegisterResources,
  registerTools as chatRegisterTools,
} from "./chat";
import {
  registerResources as messageRegisterResources,
  registerTools as messageRegisterTools,
} from "./message";
import {
  registerResources as profileRegisterResources,
  registerTools as profileRegisterTools,
} from "./profile";
import {
  registerResources as threadRegisterResources,
  registerTools as threadRegisterTools,
} from "./thread";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as attributeKeysToAttributesRegisterResources,
  registerTools as attributeKeysToAttributesRegisterTools,
} from "./attribute-keys-to-attributes";
import {
  registerResources as chatsToActionsRegisterResources,
  registerTools as chatsToActionsRegisterTools,
} from "./chats-to-actions";
import {
  registerResources as chatsToMessagesRegisterResources,
  registerTools as chatsToMessagesRegisterTools,
} from "./chats-to-messages";
import {
  registerResources as chatsToThreadsRegisterResources,
  registerTools as chatsToThreadsRegisterTools,
} from "./chats-to-threads";
import {
  registerResources as messagesToFileStorageModuleFilesRegisterResources,
  registerTools as messagesToFileStorageModuleFilesRegisterTools,
} from "./messages-to-file-storage-module-files";
import {
  registerResources as profilesToActionsRegisterResources,
  registerTools as profilesToActionsRegisterTools,
} from "./profiles-to-actions";
import {
  registerResources as profilesToAttributesRegisterResources,
  registerTools as profilesToAttributesRegisterTools,
} from "./profiles-to-attributes";
import {
  registerResources as profilesToChatsRegisterResources,
  registerTools as profilesToChatsRegisterTools,
} from "./profiles-to-chats";
import {
  registerResources as profilesToEcommerceModuleProductsRegisterResources,
  registerTools as profilesToEcommerceModuleProductsRegisterTools,
} from "./profiles-to-ecommerce-module-products";
import {
  registerResources as profilesToFileStorageModuleFilesRegisterResources,
  registerTools as profilesToFileStorageModuleFilesRegisterTools,
} from "./profiles-to-file-storage-module-files";
import {
  registerResources as profilesToMessagesRegisterResources,
  registerTools as profilesToMessagesRegisterTools,
} from "./profiles-to-messages";
import {
  registerResources as profilesToWebsiteBuilderModuleWidgetsRegisterResources,
  registerTools as profilesToWebsiteBuilderModuleWidgetsRegisterTools,
} from "./profiles-to-website-builder-module-widgets";
import {
  registerResources as threadsToEcommerceModuleProductsRegisterResources,
  registerTools as threadsToEcommerceModuleProductsRegisterTools,
} from "./threads-to-ecommerce-module-products";
import {
  registerResources as threadsToMessagesRegisterResources,
  registerTools as threadsToMessagesRegisterTools,
} from "./threads-to-messages";

export function registerResources(mcp: McpServer) {
  actionRegisterResources(mcp);
  attributeRegisterResources(mcp);
  attributeKeyRegisterResources(mcp);
  chatRegisterResources(mcp);
  messageRegisterResources(mcp);
  profileRegisterResources(mcp);
  threadRegisterResources(mcp);
  widgetRegisterResources(mcp);
  attributeKeysToAttributesRegisterResources(mcp);
  chatsToActionsRegisterResources(mcp);
  chatsToMessagesRegisterResources(mcp);
  chatsToThreadsRegisterResources(mcp);
  messagesToFileStorageModuleFilesRegisterResources(mcp);
  profilesToActionsRegisterResources(mcp);
  profilesToAttributesRegisterResources(mcp);
  profilesToChatsRegisterResources(mcp);
  profilesToEcommerceModuleProductsRegisterResources(mcp);
  profilesToFileStorageModuleFilesRegisterResources(mcp);
  profilesToMessagesRegisterResources(mcp);
  profilesToWebsiteBuilderModuleWidgetsRegisterResources(mcp);
  threadsToEcommerceModuleProductsRegisterResources(mcp);
  threadsToMessagesRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  actionRegisterTools(mcp);
  attributeRegisterTools(mcp);
  attributeKeyRegisterTools(mcp);
  chatRegisterTools(mcp);
  messageRegisterTools(mcp);
  profileRegisterTools(mcp);
  threadRegisterTools(mcp);
  widgetRegisterTools(mcp);
  attributeKeysToAttributesRegisterTools(mcp);
  chatsToActionsRegisterTools(mcp);
  chatsToMessagesRegisterTools(mcp);
  chatsToThreadsRegisterTools(mcp);
  messagesToFileStorageModuleFilesRegisterTools(mcp);
  profilesToActionsRegisterTools(mcp);
  profilesToAttributesRegisterTools(mcp);
  profilesToChatsRegisterTools(mcp);
  profilesToEcommerceModuleProductsRegisterTools(mcp);
  profilesToFileStorageModuleFilesRegisterTools(mcp);
  profilesToMessagesRegisterTools(mcp);
  profilesToWebsiteBuilderModuleWidgetsRegisterTools(mcp);
  threadsToEcommerceModuleProductsRegisterTools(mcp);
  threadsToMessagesRegisterTools(mcp);
}
