import {
  createModuleChildApp,
  defaultAppAssembly,
  type IAppAssembly,
  type IModuleAppEntry,
} from "@sps/shared-backend-api";
import { serviceBootstrap as widgetApp } from "@sps/billing/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as paymentIntentApp } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as invoiceApp } from "@sps/billing/models/invoice/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as currencyApp } from "@sps/billing/models/currency/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as paymentIntentsToCurrenciesApp } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as paymentIntentsToInvoicesApp } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api/src/lib/bootstrap";

export class Apps {
  apps: IModuleAppEntry[] = [];

  constructor(private readonly assembly: IAppAssembly = defaultAppAssembly) {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widgetApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/payment-intents",
      app: createModuleChildApp(paymentIntentApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/invoices",
      app: createModuleChildApp(invoiceApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/currencies",
      app: createModuleChildApp(currencyApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/payment-intents-to-currencies",
      app: createModuleChildApp(paymentIntentsToCurrenciesApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/payment-intents-to-invoices",
      app: createModuleChildApp(paymentIntentsToInvoicesApp, this.assembly),
    });
  }
}
