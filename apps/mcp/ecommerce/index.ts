import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as attributeRegisterResources,
  registerTools as attributeRegisterTools,
} from "./attribute";
import {
  registerResources as attributeKeyRegisterResources,
  registerTools as attributeKeyRegisterTools,
} from "./attribute-key";
import {
  registerResources as categoryRegisterResources,
  registerTools as categoryRegisterTools,
} from "./category";
import {
  registerResources as orderRegisterResources,
  registerTools as orderRegisterTools,
} from "./order";
import {
  registerResources as productRegisterResources,
  registerTools as productRegisterTools,
} from "./product";
import {
  registerResources as storeRegisterResources,
  registerTools as storeRegisterTools,
} from "./store";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as attributeKeysToAttributesRegisterResources,
  registerTools as attributeKeysToAttributesRegisterTools,
} from "./attribute-keys-to-attributes";
import {
  registerResources as attributesToBillingModuleCurrenciesRegisterResources,
  registerTools as attributesToBillingModuleCurrenciesRegisterTools,
} from "./attributes-to-billing-module-currencies";
import {
  registerResources as categoriesToFileStorageModuleFilesRegisterResources,
  registerTools as categoriesToFileStorageModuleFilesRegisterTools,
} from "./categories-to-file-storage-module-files";
import {
  registerResources as categoriesToProductsRegisterResources,
  registerTools as categoriesToProductsRegisterTools,
} from "./categories-to-products";
import {
  registerResources as categoriesToWebsiteBuilderModuleWidgetsRegisterResources,
  registerTools as categoriesToWebsiteBuilderModuleWidgetsRegisterTools,
} from "./categories-to-website-builder-module-widgets";
import {
  registerResources as ordersToBillingModuleCurrenciesRegisterResources,
  registerTools as ordersToBillingModuleCurrenciesRegisterTools,
} from "./orders-to-billing-module-currencies";
import {
  registerResources as ordersToBillingModulePaymentIntentsRegisterResources,
  registerTools as ordersToBillingModulePaymentIntentsRegisterTools,
} from "./orders-to-billing-module-payment-intents";
import {
  registerResources as ordersToFileStorageModuleFilesRegisterResources,
  registerTools as ordersToFileStorageModuleFilesRegisterTools,
} from "./orders-to-file-storage-module-files";
import {
  registerResources as ordersToProductsRegisterResources,
  registerTools as ordersToProductsRegisterTools,
} from "./orders-to-products";
import {
  registerResources as productsToAttributesRegisterResources,
  registerTools as productsToAttributesRegisterTools,
} from "./products-to-attributes";
import {
  registerResources as productsToFileStorageModuleFilesRegisterResources,
  registerTools as productsToFileStorageModuleFilesRegisterTools,
} from "./products-to-file-storage-module-files";
import {
  registerResources as productsToWebsiteBuilderModuleWidgetsRegisterResources,
  registerTools as productsToWebsiteBuilderModuleWidgetsRegisterTools,
} from "./products-to-website-builder-module-widgets";
import {
  registerResources as storesToAttributesRegisterResources,
  registerTools as storesToAttributesRegisterTools,
} from "./stores-to-attributes";
import {
  registerResources as storesToOrdersRegisterResources,
  registerTools as storesToOrdersRegisterTools,
} from "./stores-to-orders";
import {
  registerResources as storesToProductsRegisterResources,
  registerTools as storesToProductsRegisterTools,
} from "./stores-to-products";
import {
  registerResources as storesToProductsToAttributesRegisterResources,
  registerTools as storesToProductsToAttributesRegisterTools,
} from "./stores-to-products-to-attributes";
import {
  registerResources as widgetsToCategoriesRegisterResources,
  registerTools as widgetsToCategoriesRegisterTools,
} from "./widgets-to-categories";
import {
  registerResources as widgetsToProductsRegisterResources,
  registerTools as widgetsToProductsRegisterTools,
} from "./widgets-to-products";
import {
  registerResources as widgetsToStoresRegisterResources,
  registerTools as widgetsToStoresRegisterTools,
} from "./widgets-to-stores";

export function registerResources(mcp: McpServer) {
  attributeRegisterResources(mcp);
  attributeKeyRegisterResources(mcp);
  categoryRegisterResources(mcp);
  orderRegisterResources(mcp);
  productRegisterResources(mcp);
  storeRegisterResources(mcp);
  widgetRegisterResources(mcp);
  attributeKeysToAttributesRegisterResources(mcp);
  attributesToBillingModuleCurrenciesRegisterResources(mcp);
  categoriesToFileStorageModuleFilesRegisterResources(mcp);
  categoriesToProductsRegisterResources(mcp);
  categoriesToWebsiteBuilderModuleWidgetsRegisterResources(mcp);
  ordersToBillingModuleCurrenciesRegisterResources(mcp);
  ordersToBillingModulePaymentIntentsRegisterResources(mcp);
  ordersToFileStorageModuleFilesRegisterResources(mcp);
  ordersToProductsRegisterResources(mcp);
  productsToAttributesRegisterResources(mcp);
  productsToFileStorageModuleFilesRegisterResources(mcp);
  productsToWebsiteBuilderModuleWidgetsRegisterResources(mcp);
  storesToAttributesRegisterResources(mcp);
  storesToOrdersRegisterResources(mcp);
  storesToProductsRegisterResources(mcp);
  storesToProductsToAttributesRegisterResources(mcp);
  widgetsToCategoriesRegisterResources(mcp);
  widgetsToProductsRegisterResources(mcp);
  widgetsToStoresRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  attributeRegisterTools(mcp);
  attributeKeyRegisterTools(mcp);
  categoryRegisterTools(mcp);
  orderRegisterTools(mcp);
  productRegisterTools(mcp);
  storeRegisterTools(mcp);
  widgetRegisterTools(mcp);
  attributeKeysToAttributesRegisterTools(mcp);
  attributesToBillingModuleCurrenciesRegisterTools(mcp);
  categoriesToFileStorageModuleFilesRegisterTools(mcp);
  categoriesToProductsRegisterTools(mcp);
  categoriesToWebsiteBuilderModuleWidgetsRegisterTools(mcp);
  ordersToBillingModuleCurrenciesRegisterTools(mcp);
  ordersToBillingModulePaymentIntentsRegisterTools(mcp);
  ordersToFileStorageModuleFilesRegisterTools(mcp);
  ordersToProductsRegisterTools(mcp);
  productsToAttributesRegisterTools(mcp);
  productsToFileStorageModuleFilesRegisterTools(mcp);
  productsToWebsiteBuilderModuleWidgetsRegisterTools(mcp);
  storesToAttributesRegisterTools(mcp);
  storesToOrdersRegisterTools(mcp);
  storesToProductsRegisterTools(mcp);
  storesToProductsToAttributesRegisterTools(mcp);
  widgetsToCategoriesRegisterTools(mcp);
  widgetsToProductsRegisterTools(mcp);
  widgetsToStoresRegisterTools(mcp);
}
