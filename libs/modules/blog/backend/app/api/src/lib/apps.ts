import { serviceBootstrap as widgetsToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/widgets-to-website-builder-module-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToArticles } from "@sps/blog/relations/widgets-to-articles/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as articlesToEcommerceModuleProducts } from "@sps/blog/relations/articles-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetApp } from "@sps/blog/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as articleApp } from "@sps/blog/models/article/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as categoryApp } from "@sps/blog/models/category/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as categoriesToArticlesApp } from "@sps/blog/relations/categories-to-articles/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as articlesToFileStorageModuleWidgetsApp } from "@sps/blog/relations/articles-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as articlesToWebsiteBuilderModuleWidgetsApp } from "@sps/blog/relations/articles-to-website-builder-module-widgets/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToCategoriesApp } from "@sps/blog/relations/widgets-to-categories/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as categoriesToWebsiteBuilderModuleWidgetsApp } from "@sps/blog/relations/categories-to-website-builder-module-widgets/backend/app/api/src/lib/bootstrap";
import {
  createModuleChildApp,
  defaultAppAssembly,
  type IAppAssembly,
  type IModuleAppEntry,
} from "@sps/shared-backend-api";

export class Apps {
  apps: IModuleAppEntry[] = [];

  constructor(private readonly assembly: IAppAssembly = defaultAppAssembly) {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "relation",
      route: "/widgets-to-website-builder-module-widgets",
      app: createModuleChildApp(
        widgetsToWebsiteBuilderModuleWidgets,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-articles",
      app: createModuleChildApp(widgetsToArticles, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/articles-to-ecommerce-module-products",
      app: createModuleChildApp(
        articlesToEcommerceModuleProducts,
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
      route: "/articles",
      app: createModuleChildApp(articleApp, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/categories",
      app: createModuleChildApp(categoryApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/categories-to-articles",
      app: createModuleChildApp(categoriesToArticlesApp, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/articles-to-file-storage-module-files",
      app: createModuleChildApp(
        articlesToFileStorageModuleWidgetsApp,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/articles-to-website-builder-module-widgets",
      app: createModuleChildApp(
        articlesToWebsiteBuilderModuleWidgetsApp,
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
      route: "/categories-to-website-builder-module-widgets",
      app: createModuleChildApp(
        categoriesToWebsiteBuilderModuleWidgetsApp,
        this.assembly,
      ),
    });
  }
}
