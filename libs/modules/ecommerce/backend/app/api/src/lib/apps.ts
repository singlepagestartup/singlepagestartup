import { serviceBootstrap as offersToOffersApp } from "@sps/ecommerce/relations/offers-to-offers/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as categoriesToWebsiteBuilderModuleWidgets } from "@sps/ecommerce/relations/categories-to-website-builder-module-widgets/backend/app/api/src/lib/bootstrap";
import {
  createModuleChildApp,
  defaultAppAssembly,
  type IAppAssembly,
  type IModuleAppEntry,
} from "@sps/shared-backend-api";
import { serviceBootstrap as widgetApp } from "@sps/ecommerce/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as storeApp } from "@sps/ecommerce/models/store/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as productApp } from "@sps/ecommerce/models/product/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as categoryApp } from "@sps/ecommerce/models/category/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as orderApp } from "@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as attributeApp } from "@sps/ecommerce/models/attribute/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as attributeKeyApp } from "@sps/ecommerce/models/attribute-key/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as attributesToAttributeKeysApp } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as productsToAttributesApp } from "@sps/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as ordersToProductsApp } from "@sps/ecommerce/relations/orders-to-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as ordersToBillingPaymentIntentsApp } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as ordersToBillingCurrenciesApp } from "@sps/ecommerce/relations/orders-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as ordersToFileStorageModuleFiles } from "@sps/ecommerce/relations/orders-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as storesToProductsApp } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as storesToOrdersApp } from "@sps/ecommerce/relations/stores-to-orders/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as storesToProductsToAttributesApp } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as storesToAttributesApp } from "@sps/ecommerce/relations/stores-to-attributes/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as categoriesToProductsApp } from "@sps/ecommerce/relations/categories-to-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as productsToFileStorageModuleWidgetsApp } from "@sps/ecommerce/relations/products-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as productsToWebsiteBuilderModuleWidgetsApp } from "@sps/ecommerce/relations/products-to-website-builder-module-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as categoriesToFileStorageModuleWidgetsApp } from "@sps/ecommerce/relations/categories-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToCategoriesApp } from "@sps/ecommerce/relations/widgets-to-categories/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToProductsApp } from "@sps/ecommerce/relations/widgets-to-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToStoresApp } from "@sps/ecommerce/relations/widgets-to-stores/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as attributesToBillingModuleCurrenciesApp } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as OrderWorkApp } from "@sps/ecommerce/models/order-work/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as OrdersToOrderWorksApp } from "@sps/ecommerce/relations/orders-to-order-works/backend/app/api/src/lib/bootstrap";

export class Apps {
  apps: IModuleAppEntry[] = [];

  constructor(private readonly assembly: IAppAssembly = defaultAppAssembly) {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/categories-to-website-builder-module-widgets",
      app: createModuleChildApp(
        categoriesToWebsiteBuilderModuleWidgets,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widgetApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/stores",
      app: createModuleChildApp(storeApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/products",
      app: createModuleChildApp(productApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/categories",
      app: createModuleChildApp(categoryApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/orders",
      app: createModuleChildApp(orderApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/attributes",
      app: createModuleChildApp(attributeApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/attribute-keys",
      app: createModuleChildApp(attributeKeyApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/attribute-keys-to-attributes",
      app: createModuleChildApp(attributesToAttributeKeysApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/products-to-attributes",
      app: createModuleChildApp(productsToAttributesApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/orders-to-products",
      app: createModuleChildApp(ordersToProductsApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/orders-to-billing-module-payment-intents",
      app: createModuleChildApp(
        ordersToBillingPaymentIntentsApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/orders-to-billing-module-currencies",
      app: createModuleChildApp(ordersToBillingCurrenciesApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/orders-to-file-storage-module-files",
      app: createModuleChildApp(ordersToFileStorageModuleFiles, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/categories-to-products",
      app: createModuleChildApp(categoriesToProductsApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/stores-to-products",
      app: createModuleChildApp(storesToProductsApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/stores-to-orders",
      app: createModuleChildApp(storesToOrdersApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/stores-to-products-to-attributes",
      app: createModuleChildApp(storesToProductsToAttributesApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/stores-to-attributes",
      app: createModuleChildApp(storesToAttributesApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/products-to-file-storage-module-files",
      app: createModuleChildApp(
        productsToFileStorageModuleWidgetsApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/products-to-website-builder-module-widgets",
      app: createModuleChildApp(
        productsToWebsiteBuilderModuleWidgetsApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/categories-to-file-storage-module-files",
      app: createModuleChildApp(
        categoriesToFileStorageModuleWidgetsApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-categories",
      app: createModuleChildApp(widgetsToCategoriesApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-products",
      app: createModuleChildApp(widgetsToProductsApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-stores",
      app: createModuleChildApp(widgetsToStoresApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/attributes-to-billing-module-currencies",
      app: createModuleChildApp(
        attributesToBillingModuleCurrenciesApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/offers-to-offers",
      app: createModuleChildApp(offersToOffersApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/order-works",
      app: createModuleChildApp(OrderWorkApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/orders-to-order-works",
      app: createModuleChildApp(OrdersToOrderWorksApp, this.assembly),
    });
  }
}
