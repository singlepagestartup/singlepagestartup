import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerResources as formRegisterResources,
  registerTools as formRegisterTools,
} from "./form";
import {
  registerResources as inputRegisterResources,
  registerTools as inputRegisterTools,
} from "./input";
import {
  registerResources as optionRegisterResources,
  registerTools as optionRegisterTools,
} from "./option";
import {
  registerResources as requestRegisterResources,
  registerTools as requestRegisterTools,
} from "./request";
import {
  registerResources as stepRegisterResources,
  registerTools as stepRegisterTools,
} from "./step";
import {
  registerResources as widgetRegisterResources,
  registerTools as widgetRegisterTools,
} from "./widget";
import {
  registerResources as formsToRequestsRegisterResources,
  registerTools as formsToRequestsRegisterTools,
} from "./forms-to-requests";
import {
  registerResources as formsToStepsRegisterResources,
  registerTools as formsToStepsRegisterTools,
} from "./forms-to-steps";
import {
  registerResources as inputsToOptionsRegisterResources,
  registerTools as inputsToOptionsRegisterTools,
} from "./inputs-to-options";
import {
  registerResources as optionsToFileStorageModuleFilesRegisterResources,
  registerTools as optionsToFileStorageModuleFilesRegisterTools,
} from "./options-to-file-storage-module-files";
import {
  registerResources as stepsToInputsRegisterResources,
  registerTools as stepsToInputsRegisterTools,
} from "./steps-to-inputs";
import {
  registerResources as widgetsToFormsRegisterResources,
  registerTools as widgetsToFormsRegisterTools,
} from "./widgets-to-forms";

export function registerResources(mcp: McpServer) {
  formRegisterResources(mcp);
  inputRegisterResources(mcp);
  optionRegisterResources(mcp);
  requestRegisterResources(mcp);
  stepRegisterResources(mcp);
  widgetRegisterResources(mcp);
  formsToRequestsRegisterResources(mcp);
  formsToStepsRegisterResources(mcp);
  inputsToOptionsRegisterResources(mcp);
  optionsToFileStorageModuleFilesRegisterResources(mcp);
  stepsToInputsRegisterResources(mcp);
  widgetsToFormsRegisterResources(mcp);
}

export function registerTools(mcp: McpServer) {
  formRegisterTools(mcp);
  inputRegisterTools(mcp);
  optionRegisterTools(mcp);
  requestRegisterTools(mcp);
  stepRegisterTools(mcp);
  widgetRegisterTools(mcp);
  formsToRequestsRegisterTools(mcp);
  formsToStepsRegisterTools(mcp);
  inputsToOptionsRegisterTools(mcp);
  optionsToFileStorageModuleFilesRegisterTools(mcp);
  stepsToInputsRegisterTools(mcp);
  widgetsToFormsRegisterTools(mcp);
}
