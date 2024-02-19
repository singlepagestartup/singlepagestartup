import { spsLiteEntity as parentEntity } from "@sps/sps-website-builder-features-section-block-contracts";
import { spsLiteEntity as feature } from "@sps/sps-website-builder-feature-contracts";
import { spsLiteEntity as file } from "@sps/sps-file-storage-file-contracts";
import type { IModel } from "../interfaces/sps-lite";

export const entity: IModel = {
  ...parentEntity,
  features: Array(4).fill(feature),
  media: [file],
  additionalMedia: [file],
};
