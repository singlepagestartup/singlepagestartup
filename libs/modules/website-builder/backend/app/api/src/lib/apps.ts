import { serviceBootstrap as button } from "@sps/website-builder/models/button/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as buttonsArray } from "@sps/website-builder/models/buttons-array/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as feature } from "@sps/website-builder/models/feature/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as logotype } from "@sps/website-builder/models/logotype/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as slide } from "@sps/website-builder/models/slide/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as slider } from "@sps/website-builder/models/slider/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widget } from "@sps/website-builder/models/widget/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as buttonsArraysToButtons } from "@sps/website-builder/relations/buttons-arrays-to-buttons/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as buttonsToFileStorageModuleWidgets } from "@sps/website-builder/relations/buttons-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as featuresToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as featuresToFileStorageModuleFiles } from "@sps/website-builder/relations/features-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as logotypesToFileStorageModuleWidgets } from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as slidersToSlides } from "@sps/website-builder/relations/sliders-to-slides/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as slidesToButtonsArrays } from "@sps/website-builder/relations/slides-to-buttons-arrays/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as slidesToFileStorageModuleWidgets } from "@sps/website-builder/relations/slides-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToFileStorageModuleWidgets } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as widgetsToSliders } from "@sps/website-builder/relations/widgets-to-sliders/backend/app/api/src/lib/bootstrap";
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
      type: "model",
      route: "/logotypes",
      app: createModuleChildApp(logotype, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/buttons-arrays",
      app: createModuleChildApp(buttonsArray, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/buttons",
      app: createModuleChildApp(button, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/features",
      app: createModuleChildApp(feature, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/slides",
      app: createModuleChildApp(slide, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/sliders",
      app: createModuleChildApp(slider, this.assembly),
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: createModuleChildApp(widget, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/buttons-arrays-to-buttons",
      app: createModuleChildApp(buttonsArraysToButtons, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-features",
      app: createModuleChildApp(widgetsToFeatures, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-logotypes",
      app: createModuleChildApp(widgetsToLogotypes, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/features-to-file-storage-module-files",
      app: createModuleChildApp(
        featuresToFileStorageModuleFiles,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-buttons-arrays",
      app: createModuleChildApp(widgetsToButtonsArrays, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-file-storage-module-files",
      app: createModuleChildApp(
        widgetsToFileStorageModuleWidgets,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/logotypes-to-file-storage-module-files",
      app: createModuleChildApp(
        logotypesToFileStorageModuleWidgets,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-sliders",
      app: createModuleChildApp(widgetsToSliders, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/sliders-to-slides",
      app: createModuleChildApp(slidersToSlides, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/slides-to-buttons-arrays",
      app: createModuleChildApp(slidesToButtonsArrays, this.assembly),
    });
    this.apps.push({
      type: "relation",
      route: "/slides-to-file-storage-module-files",
      app: createModuleChildApp(
        slidesToFileStorageModuleWidgets,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/buttons-to-file-storage-module-files",
      app: createModuleChildApp(
        buttonsToFileStorageModuleWidgets,
        this.assembly,
      ),
    });
    this.apps.push({
      type: "relation",
      route: "/features-to-buttons-arrays",
      app: createModuleChildApp(featuresToButtonsArrays, this.assembly),
    });
  }
}
