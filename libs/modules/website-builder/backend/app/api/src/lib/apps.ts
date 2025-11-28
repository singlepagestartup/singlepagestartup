import { app as button } from "@sps/website-builder/models/button/backend/app/api";
import { app as buttonsArray } from "@sps/website-builder/models/buttons-array/backend/app/api";
import { app as feature } from "@sps/website-builder/models/feature/backend/app/api";
import { app as logotype } from "@sps/website-builder/models/logotype/backend/app/api";
import { app as slide } from "@sps/website-builder/models/slide/backend/app/api";
import { app as slider } from "@sps/website-builder/models/slider/backend/app/api";
import { app as widget } from "@sps/website-builder/models/widget/backend/app/api";
import { app as buttonsArraysToButtons } from "@sps/website-builder/relations/buttons-arrays-to-buttons/backend/app/api";
import { app as buttonsToFileStorageModuleWidgets } from "@sps/website-builder/relations/buttons-to-file-storage-module-files/backend/app/api";
import { app as featuresToButtonsArrays } from "@sps/website-builder/relations/features-to-buttons-arrays/backend/app/api";
import { app as featuresToFileStorageModuleFiles } from "@sps/website-builder/relations/features-to-file-storage-module-files/backend/app/api";
import { app as logotypesToFileStorageModuleWidgets } from "@sps/website-builder/relations/logotypes-to-file-storage-module-files/backend/app/api";
import { app as slidersToSlides } from "@sps/website-builder/relations/sliders-to-slides/backend/app/api";
import { app as slidesToButtonsArrays } from "@sps/website-builder/relations/slides-to-buttons-arrays/backend/app/api";
import { app as slidesToFileStorageModuleWidgets } from "@sps/website-builder/relations/slides-to-file-storage-module-files/backend/app/api";
import { app as widgetsToButtonsArrays } from "@sps/website-builder/relations/widgets-to-buttons-arrays/backend/app/api";
import { app as widgetsToFeatures } from "@sps/website-builder/relations/widgets-to-features/backend/app/api";
import { app as widgetsToFileStorageModuleWidgets } from "@sps/website-builder/relations/widgets-to-file-storage-module-files/backend/app/api";
import { app as widgetsToLogotypes } from "@sps/website-builder/relations/widgets-to-logotypes/backend/app/api";
import { app as widgetsToSliders } from "@sps/website-builder/relations/widgets-to-sliders/backend/app/api";
import { DefaultApp } from "@sps/shared-backend-api";

export class Apps {
  apps: { type: "model" | "relation"; route: string; app: DefaultApp<any> }[] =
    [];

  constructor() {
    this.bindApps();
  }

  bindApps() {
    this.apps.push({
      type: "model",
      route: "/logotypes",
      app: logotype,
    });
    this.apps.push({
      type: "model",
      route: "/buttons-arrays",
      app: buttonsArray,
    });
    this.apps.push({
      type: "model",
      route: "/buttons",
      app: button,
    });
    this.apps.push({
      type: "model",
      route: "/features",
      app: feature,
    });
    this.apps.push({
      type: "model",
      route: "/slides",
      app: slide,
    });
    this.apps.push({
      type: "model",
      route: "/sliders",
      app: slider,
    });
    this.apps.push({
      type: "model",
      route: "/widgets",
      app: widget,
    });
    this.apps.push({
      type: "relation",
      route: "/buttons-arrays-to-buttons",
      app: buttonsArraysToButtons,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-features",
      app: widgetsToFeatures,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-logotypes",
      app: widgetsToLogotypes,
    });
    this.apps.push({
      type: "relation",
      route: "/features-to-file-storage-module-files",
      app: featuresToFileStorageModuleFiles,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-buttons-arrays",
      app: widgetsToButtonsArrays,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-file-storage-module-files",
      app: widgetsToFileStorageModuleWidgets,
    });
    this.apps.push({
      type: "relation",
      route: "/logotypes-to-file-storage-module-files",
      app: logotypesToFileStorageModuleWidgets,
    });
    this.apps.push({
      type: "relation",
      route: "/widgets-to-sliders",
      app: widgetsToSliders,
    });
    this.apps.push({
      type: "relation",
      route: "/sliders-to-slides",
      app: slidersToSlides,
    });
    this.apps.push({
      type: "relation",
      route: "/slides-to-buttons-arrays",
      app: slidesToButtonsArrays,
    });
    this.apps.push({
      type: "relation",
      route: "/slides-to-file-storage-module-files",
      app: slidesToFileStorageModuleWidgets,
    });
    this.apps.push({
      type: "relation",
      route: "/buttons-to-file-storage-module-files",
      app: buttonsToFileStorageModuleWidgets,
    });
    this.apps.push({
      type: "relation",
      route: "/features-to-buttons-arrays",
      app: featuresToButtonsArrays,
    });
  }
}
