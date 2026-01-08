import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as currencyRegisterResources,
  registerTools as currencyRegisterTools,
} from "./currency";
import {
  registerResources as invoiceRegisterResources,
  registerTools as invoiceRegisterTools,
} from "./invoice";
import {
  registerResources as paymentIntentRegisterResources,
  registerTools as paymentIntentRegisterTools,
} from "./payment-intent";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as paymentIntentsToCurrenciesRegisterResources,
  registerTools as paymentIntentsToCurrenciesRegisterTools,
} from "./payment-intents-to-currencies";
import {
  registerResources as paymentIntentsToInvoicesRegisterResources,
  registerTools as paymentIntentsToInvoicesRegisterTools,
} from "./payment-intents-to-invoices";

export function registerResources(mcp: McpServer) {
  currencyRegisterResources(mcp);
  invoiceRegisterResources(mcp);
  paymentIntentRegisterResources(mcp);
  widgetRegisterResources(mcp);
  paymentIntentsToCurrenciesRegisterResources(mcp);
  paymentIntentsToInvoicesRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  currencyRegisterTools(mcp);
  invoiceRegisterTools(mcp);
  paymentIntentRegisterTools(mcp);
  widgetRegisterTools(mcp);
  paymentIntentsToCurrenciesRegisterTools(mcp);
  paymentIntentsToInvoicesRegisterTools(mcp);
}
