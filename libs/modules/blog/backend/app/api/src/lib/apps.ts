import { app as articlesToEcommerceModuleProducts } from "@sps/blog/relations/articles-to-ecommerce-module-products/backend/app/api";
import { app as widgetApp } from "@sps/blog/models/widget/backend/app/api";
import { app as articleApp } from "@sps/blog/models/article/backend/app/api";
import { app as categoryApp } from "@sps/blog/models/category/backend/app/api";
import { app as categoriesToArticlesApp } from "@sps/blog/relations/categories-to-articles/backend/app/api";
import { app as articlesToFileStorageModuleWidgetsApp } from "@sps/blog/relations/articles-to-file-storage-module-files/backend/app/api";
import { app as articlesToWebsiteBuilderModuleWidgetsApp } from "@sps/blog/relations/articles-to-website-builder-module-widgets/backend/app/api";
import { DefaultApp } from "@sps/shared-backend-api";

export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] =
    [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/articles-to-ecommerce-module-products",
      app: articlesToEcommerceModuleProducts,
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: widgetApp,
    });
    this.apps.push({
      type: "model",
      route: "/articles",
      app: articleApp,
    });
    this.apps.push({
      type: "model",
      route: "/categories",
      app: categoryApp,
    });
    this.apps.push({
      type: "relation",
      route: "/categories-to-articles",
      app: categoriesToArticlesApp,
    });
    this.apps.push({
      type: "relation",
      route: "/articles-to-file-storage-module-files",
      app: articlesToFileStorageModuleWidgetsApp,
    });
    this.apps.push({
      type: "relation",
      route: "/articles-to-website-builder-module-widgets",
      app: articlesToWebsiteBuilderModuleWidgetsApp,
    });
  }
}
