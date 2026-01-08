import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as agentModuleRegisterResources,
  registerTools as agentModuleRegisterTools,
} from "./agent";
import {
  registerResources as analyticModuleRegisterResources,
  registerTools as analyticModuleRegisterTools,
} from "./analytic";
import {
  registerResources as billingModuleRegisterResources,
  registerTools as billingModuleRegisterTools,
} from "./billing";
import {
  registerResources as blogModuleRegisterResources,
  registerTools as blogModuleRegisterTools,
} from "./blog";
import {
  registerResources as broadcastModuleRegisterResources,
  registerTools as broadcastModuleRegisterTools,
} from "./broadcast";
import {
  registerResources as crmModuleRegisterResources,
  registerTools as crmModuleRegisterTools,
} from "./crm";
import {
  registerResources as ecommerceModuleRegisterResources,
  registerTools as ecommerceModuleRegisterTools,
} from "./ecommerce";
import {
  registerResources as fileStorageModuleRegisterResources,
  registerTools as fileStorageModuleRegisterTools,
} from "./file-storage";
import {
  registerResources as hostModuleRegisterResources,
  registerTools as hostModuleRegisterTools,
} from "./host";
import {
  registerResources as notificationModuleRegisterResources,
  registerTools as notificationModuleRegisterTools,
} from "./notification";
import {
  registerResources as rbacModuleRegisterResources,
  registerTools as rbacModuleRegisterTools,
} from "./rbac";
import {
  registerResources as socialModuleRegisterResources,
  registerTools as socialModuleRegisterTools,
} from "./social";
import {
  registerResources as startupModuleRegisterResources,
  registerTools as startupModuleRegisterTools,
} from "./startup";
import {
  registerResources as telegramModuleRegisterResources,
  registerTools as telegramModuleRegisterTools,
} from "./telegram";
import {
  registerResources as websiteBuilderModuleRegisterResources,
  registerTools as websiteBuilderModuleRegisterTools,
} from "./website-builder";
import { registerTools as documentationRegisterTools } from "./documentation";

export const mcp = new McpServer({
  name: "singlepagestartup-mcp",
  version: "1.0.0",
});

agentModuleRegisterResources(mcp);
agentModuleRegisterTools(mcp);
analyticModuleRegisterResources(mcp);
analyticModuleRegisterTools(mcp);
billingModuleRegisterResources(mcp);
billingModuleRegisterTools(mcp);
blogModuleRegisterResources(mcp);
blogModuleRegisterTools(mcp);
broadcastModuleRegisterResources(mcp);
broadcastModuleRegisterTools(mcp);
crmModuleRegisterResources(mcp);
crmModuleRegisterTools(mcp);
ecommerceModuleRegisterResources(mcp);
ecommerceModuleRegisterTools(mcp);
fileStorageModuleRegisterResources(mcp);
fileStorageModuleRegisterTools(mcp);
hostModuleRegisterResources(mcp);
hostModuleRegisterTools(mcp);
notificationModuleRegisterResources(mcp);
notificationModuleRegisterTools(mcp);
rbacModuleRegisterResources(mcp);
rbacModuleRegisterTools(mcp);
socialModuleRegisterResources(mcp);
socialModuleRegisterTools(mcp);
startupModuleRegisterResources(mcp);
startupModuleRegisterTools(mcp);
telegramModuleRegisterResources(mcp);
telegramModuleRegisterTools(mcp);
websiteBuilderModuleRegisterResources(mcp);
websiteBuilderModuleRegisterTools(mcp);
documentationRegisterTools(mcp);
