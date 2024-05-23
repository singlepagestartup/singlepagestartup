import { populate as footerBlocksToLogotypes } from "@sps/sps-website-builder-models-footer-block-backend-schema-relations-footer-blocks-to-logotypes";
import { populate as widgetsToFooterBlocks } from "@sps/sps-website-builder-models-footer-block-backend-schema-relations-widgets-to-footer-blocks";
export const populate = {
  ...footerBlocksToLogotypes,
  ...widgetsToFooterBlocks,
};
