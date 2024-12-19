import { DefaultApp } from "@sps/shared-backend-api";
import { app as widgetApp } from "@sps/ecommerce/models/widget/backend/app/api";
import { app as storeApp } from "@sps/ecommerce/models/store/backend/app/api";
import { app as productApp } from "@sps/ecommerce/models/product/backend/app/api";
import { app as categoryApp } from "@sps/ecommerce/models/category/backend/app/api";
import { app as orderApp } from "@sps/ecommerce/models/order/backend/app/api";
import { app as attributeApp } from "@sps/ecommerce/models/attribute/backend/app/api";
import { app as attributeKeyApp } from "@sps/ecommerce/models/attribute-key/backend/app/api";
import { app as attributesToAttributeKeysApp } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api";
import { app as productsToAttributesApp } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api";
import { app as ordersToProductsApp } from "@sps/ecommerce/relations/orders-to-products/backend/app/api";
import { app as ordersToBillingPaymentIntentsApp } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api";
import { app as ordersToBillingCurrenciesApp } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api";
import { app as storesToProductsApp } from "@sps/ecommerce/relations/stores-to-products/backend/app/api";
import { app as storesToProductsToAttributesApp } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/app/api";
import { app as storesToAttributesApp } from "@sps/ecommerce/relations/stores-to-attributes/backend/app/api";
import { app as categoriesToProductsApp } from "@sps/ecommerce/relations/categories-to-products/backend/app/api";
import { app as productsToFileStorageModuleWidgetsApp } from "@sps/ecommerce/relations/products-to-file-storage-module-widgets/backend/app/api";
import { app as categoriesToFileStorageModuleWidgetsApp } from "@sps/ecommerce/relations/categories-to-file-storage-module-widgets/backend/app/api";
import { app as widgetsToCategoriesApp } from "@sps/ecommerce/relations/widgets-to-categories/backend/app/api";
import { app as widgetsToProductsApp } from "@sps/ecommerce/relations/widgets-to-products/backend/app/api";
import { app as attributesToBillingModuleCurrenciesApp } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api";

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
      route: "/stores",
      app: storeApp,
    });
    this.apps.push({
      type: "model",
      route: "/products",
      app: productApp,
    });
    this.apps.push({
      type: "model",
      route: "/categories",
      app: categoryApp,
    });
    this.apps.push({
      type: "model",
      route: "/orders",
      app: orderApp,
    });
    this.apps.push({
      type: "model",
      route: "/attributes",
      app: attributeApp,
    });
    this.apps.push({
      type: "model",
      route: "/attribute-keys",
      app: attributeKeyApp,
    });
    this.apps.push({
      type: "relation",
      route: "/attribute-keys-to-attributes",
      app: attributesToAttributeKeysApp,
    });
    this.apps.push({
      type: "relation",
      route: "/products-to-attributes",
      app: productsToAttributesApp,
    });
    this.apps.push({
      type: "relation",
      route: "/orders-to-products",
      app: ordersToProductsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/orders-to-billing-module-payment-intents",
      app: ordersToBillingPaymentIntentsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/orders-to-billing-module-currencies",
      app: ordersToBillingCurrenciesApp,
    });
    this.apps.push({
      type: "relation",
      route: "/categories-to-products",
      app: categoriesToProductsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/stores-to-products",
      app: storesToProductsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/stores-to-products-to-attributes",
      app: storesToProductsToAttributesApp,
    });
    this.apps.push({
      type: "relation",
      route: "/stores-to-attributes",
      app: storesToAttributesApp,
    });
    this.apps.push({
      type: "relation",
      route: "/products-to-file-storage-module-widgets",
      app: productsToFileStorageModuleWidgetsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/categories-to-file-storage-module-widgets",
      app: categoriesToFileStorageModuleWidgetsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-categories",
      app: widgetsToCategoriesApp,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-products",
      app: widgetsToProductsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/attributes-to-billing-module-currencies",
      app: attributesToBillingModuleCurrenciesApp,
    });
  }
}
