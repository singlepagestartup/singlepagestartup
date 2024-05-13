import { spsLiteEntity as parentEntity } from "@sps/sps-crm-models-review-contracts";
import type { IModel } from "../interfaces/sps-lite";
import { spsLiteEntity as file } from "@sps/sps-file-storage-models-file-contracts";

export const entity = {
  ...parentEntity,
  media: [file],
  additionalMedia: [file],
};
