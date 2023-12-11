import { ISpsLiteBackendExtensionUploadApiFile } from "~redux/services/backend/extensions/upload/api/file/interfaces/sps-lite";
import { ISpsLiteBackendComponentButton } from "../../../elements/button/interfaces/sps-lite";

export interface ISpsLiteBackendComponentCtaSectionBlock {
  id: number;
  __component: "page-blocks.cta-section-block";
  variant: "dark-with-image";
  title: string | null;
  subtitle: string | null;
  description: string | null;
  media?: ISpsLiteBackendExtensionUploadApiFile[];
  additionalMedia?: ISpsLiteBackendExtensionUploadApiFile[];
  anchor: string | null;
  className: string | null;
  buttons?: ISpsLiteBackendComponentButton[];
}