import { DefaultApp } from "@sps/shared-backend-api";
import { app as widgetApp } from "@sps/billing/models/widget/backend/app/api";
import { app as paymentIntentApp } from "@sps/billing/models/payment-intent/backend/app/api";
import { app as invoiceApp } from "@sps/billing/models/invoice/backend/app/api";
import { app as currencyApp } from "@sps/billing/models/currency/backend/app/api";
import { app as paymentIntentsToCurrenciesApp } from "@sps/billing/relations/payment-intents-to-currencies/backend/app/api";
import { app as paymentIntentsToInvoicesApp } from "@sps/billing/relations/payment-intents-to-invoices/backend/app/api";

export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] =
    [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: widgetApp,
    });
    this.apps.push({
      type: "model",
      route: "/payment-intents",
      app: paymentIntentApp,
    });
    this.apps.push({
      type: "model",
      route: "/invoices",
      app: invoiceApp,
    });
    this.apps.push({
      type: "model",
      route: "/currencies",
      app: currencyApp,
    });
    this.apps.push({
      type: "relation",
      route: "/payment-intents-to-currencies",
      app: paymentIntentsToCurrenciesApp,
    });
    this.apps.push({
      type: "relation",
      route: "/payment-intents-to-invoices",
      app: paymentIntentsToInvoicesApp,
    });
  }
}
