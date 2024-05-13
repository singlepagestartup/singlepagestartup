import type { IModel } from "../interfaces/sps-lite";
import { spsLiteEntity as parentEntity } from "@sps/sps-website-builder-models-slide-over-contracts";
import { spsLiteEntity as pageBlock } from "@sps/sps-website-builder-models-hero-section-block-contracts";

export const entity = {
  ...parentEntity,
  pageBlocks: [{ ...pageBlock }],
};
