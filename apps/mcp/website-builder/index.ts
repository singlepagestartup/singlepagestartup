import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as buttonRegisterResources,
  registerTools as buttonRegisterTools,
} from "./button";
import {
  registerResources as buttonsArrayRegisterResources,
  registerTools as buttonsArrayRegisterTools,
} from "./buttons-array";
import {
  registerResources as featureRegisterResources,
  registerTools as featureRegisterTools,
} from "./feature";
import {
  registerResources as logotypeRegisterResources,
  registerTools as logotypeRegisterTools,
} from "./logotype";
import {
  registerResources as slideRegisterResources,
  registerTools as slideRegisterTools,
} from "./slide";
import {
  registerResources as sliderRegisterResources,
  registerTools as sliderRegisterTools,
} from "./slider";
import {
  registerResources as buttonsArraysToButtonsRegisterResources,
  registerTools as buttonsArraysToButtonsRegisterTools,
} from "./buttons-arrays-to-buttons";
import {
  registerResources as buttonsToFileStorageRegisterResources,
  registerTools as buttonsToFileStorageRegisterTools,
} from "./buttons-to-file-storage-module-files";
import {
  registerResources as featuresToButtonsArraysRegisterResources,
  registerTools as featuresToButtonsArraysRegisterTools,
} from "./features-to-buttons-arrays";
import {
  registerResources as featuresToFileStorageRegisterResources,
  registerTools as featuresToFileStorageRegisterTools,
} from "./features-to-file-storage-module-files";
import {
  registerResources as logotypesToFileStorageRegisterResources,
  registerTools as logotypesToFileStorageRegisterTools,
} from "./logotypes-to-file-storage-module-files";
import {
  registerResources as slidersToSlidesRegisterResources,
  registerTools as slidersToSlidesRegisterTools,
} from "./sliders-to-slides";
import {
  registerResources as slidesToButtonsArraysRegisterResources,
  registerTools as slidesToButtonsArraysRegisterTools,
} from "./slides-to-buttons-arrays";
import {
  registerResources as slidesToFileStorageRegisterResources,
  registerTools as slidesToFileStorageRegisterTools,
} from "./slides-to-file-storage-module-files";
import {
  registerResources as widgetsToButtonsArraysRegisterResources,
  registerTools as widgetsToButtonsArraysRegisterTools,
} from "./widgets-to-buttons-arrays";
import {
  registerResources as widgetsToFeaturesRegisterResources,
  registerTools as widgetsToFeaturesRegisterTools,
} from "./widgets-to-features";
import {
  registerResources as widgetsToFileStorageRegisterResources,
  registerTools as widgetsToFileStorageRegisterTools,
} from "./widgets-to-file-storage-module-files";
import {
  registerResources as widgetsToLogotypesRegisterResources,
  registerTools as widgetsToLogotypesRegisterTools,
} from "./widgets-to-logotypes";
import {
  registerResources as widgetsToSlidersRegisterResources,
  registerTools as widgetsToSlidersRegisterTools,
} from "./widgets-to-sliders";

export function registerResources(mcp: McpServer) {
  widgetRegisterResources(mcp);
  buttonRegisterResources(mcp);
  buttonsArrayRegisterResources(mcp);
  featureRegisterResources(mcp);
  logotypeRegisterResources(mcp);
  slideRegisterResources(mcp);
  sliderRegisterResources(mcp);
  buttonsArraysToButtonsRegisterResources(mcp);
  buttonsToFileStorageRegisterResources(mcp);
  featuresToButtonsArraysRegisterResources(mcp);
  featuresToFileStorageRegisterResources(mcp);
  logotypesToFileStorageRegisterResources(mcp);
  slidersToSlidesRegisterResources(mcp);
  slidesToButtonsArraysRegisterResources(mcp);
  slidesToFileStorageRegisterResources(mcp);
  widgetsToButtonsArraysRegisterResources(mcp);
  widgetsToFeaturesRegisterResources(mcp);
  widgetsToFileStorageRegisterResources(mcp);
  widgetsToLogotypesRegisterResources(mcp);
  widgetsToSlidersRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  widgetRegisterTools(mcp);
  buttonRegisterTools(mcp);
  buttonsArrayRegisterTools(mcp);
  featureRegisterTools(mcp);
  logotypeRegisterTools(mcp);
  slideRegisterTools(mcp);
  sliderRegisterTools(mcp);
  buttonsArraysToButtonsRegisterTools(mcp);
  buttonsToFileStorageRegisterTools(mcp);
  featuresToButtonsArraysRegisterTools(mcp);
  featuresToFileStorageRegisterTools(mcp);
  logotypesToFileStorageRegisterTools(mcp);
  slidersToSlidesRegisterTools(mcp);
  slidesToButtonsArraysRegisterTools(mcp);
  slidesToFileStorageRegisterTools(mcp);
  widgetsToButtonsArraysRegisterTools(mcp);
  widgetsToFeaturesRegisterTools(mcp);
  widgetsToFileStorageRegisterTools(mcp);
  widgetsToLogotypesRegisterTools(mcp);
  widgetsToSlidersRegisterTools(mcp);
}
