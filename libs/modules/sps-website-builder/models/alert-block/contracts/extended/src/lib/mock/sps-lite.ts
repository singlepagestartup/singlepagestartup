import { spsLiteEntity as parentEntity } from "@sps/sps-website-builder-models-alert-block-contracts";
import { spsLiteEntity as button } from "@sps/sps-website-builder-models-button-contracts";
import { spsLiteEntity as file } from "@sps/sps-file-storage-models-file-contracts";
import type { IModel } from "../interfaces";

export const entity = {
  ...parentEntity,
  buttons: [{ ...button }],
  media: [file],
  additionalMedia: [file],
};
