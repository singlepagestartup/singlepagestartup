import { ISpsLiteBackendExtensionUploadApiFile } from "~redux/services/backend/extensions/upload/api/file/interfaces/sps-lite";
import { ISpsLiteBackendComponentButton } from "../../button/interfaces/sps-lite";

export interface ISpsLiteBackendComponentButtonsArray {
  id: number;
  __component: "elements.buttons-array";
  variant: "column-with-title" | "row";
  title: string | null;
  additionalAttributes: any;
  buttons: ISpsLiteBackendComponentButton[];
  description: string | null;
  className: string | null;
  url: string | null;
  media?: ISpsLiteBackendExtensionUploadApiFile[] | null;
  additionalMedia?: ISpsLiteBackendExtensionUploadApiFile[] | null;
}