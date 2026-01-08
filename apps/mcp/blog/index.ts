import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as articleRegisterResources,
  registerTools as articleRegisterTools,
} from "./article";
import {
  registerResources as categoryRegisterResources,
  registerTools as categoryRegisterTools,
} from "./category";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as articlesToEcommerceModuleProductsRegisterResources,
  registerTools as articlesToEcommerceModuleProductsRegisterTools,
} from "./articles-to-ecommerce-module-products";
import {
  registerResources as articlesToFileStorageModuleFilesRegisterResources,
  registerTools as articlesToFileStorageModuleFilesRegisterTools,
} from "./articles-to-file-storage-module-files";
import {
  registerResources as articlesToWebsiteBuilderModuleWidgetsRegisterResources,
  registerTools as articlesToWebsiteBuilderModuleWidgetsRegisterTools,
} from "./articles-to-website-builder-module-widgets";
import {
  registerResources as categoriesToArticlesRegisterResources,
  registerTools as categoriesToArticlesRegisterTools,
} from "./categories-to-articles";
import {
  registerResources as categoriesToWebsiteBuilderModuleWidgetsRegisterResources,
  registerTools as categoriesToWebsiteBuilderModuleWidgetsRegisterTools,
} from "./categories-to-website-builder-module-widgets";
import {
  registerResources as widgetsToArticlesRegisterResources,
  registerTools as widgetsToArticlesRegisterTools,
} from "./widgets-to-articles";
import {
  registerResources as widgetsToCategoriesRegisterResources,
  registerTools as widgetsToCategoriesRegisterTools,
} from "./widgets-to-categories";

export function registerResources(mcp: McpServer) {
  articleRegisterResources(mcp);
  categoryRegisterResources(mcp);
  widgetRegisterResources(mcp);
  articlesToEcommerceModuleProductsRegisterResources(mcp);
  articlesToFileStorageModuleFilesRegisterResources(mcp);
  articlesToWebsiteBuilderModuleWidgetsRegisterResources(mcp);
  categoriesToArticlesRegisterResources(mcp);
  categoriesToWebsiteBuilderModuleWidgetsRegisterResources(mcp);
  widgetsToArticlesRegisterResources(mcp);
  widgetsToCategoriesRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  articleRegisterTools(mcp);
  categoryRegisterTools(mcp);
  widgetRegisterTools(mcp);
  articlesToEcommerceModuleProductsRegisterTools(mcp);
  articlesToFileStorageModuleFilesRegisterTools(mcp);
  articlesToWebsiteBuilderModuleWidgetsRegisterTools(mcp);
  categoriesToArticlesRegisterTools(mcp);
  categoriesToWebsiteBuilderModuleWidgetsRegisterTools(mcp);
  widgetsToArticlesRegisterTools(mcp);
  widgetsToCategoriesRegisterTools(mcp);
}
