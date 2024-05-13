import { spsLiteEntity as parentEntity } from "@sps/sps-website-builder-models-features-section-block-contracts";
import { spsLiteEntity as feature } from "@sps/sps-website-builder-models-feature-contracts";
import { spsLiteEntity as file } from "@sps/sps-file-storage-models-file-contracts";
import type { IModel } from "../interfaces/sps-lite";

export const entity = {
  ...parentEntity,
  features: Array(4).fill(feature),
  media: [file],
  additionalMedia: [file],
};
