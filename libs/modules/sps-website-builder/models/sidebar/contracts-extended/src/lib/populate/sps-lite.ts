import { populate as parentPopulate } from "@sps/sps-website-builder-sidebar-contracts";
import { populate as heroSectionBlockPopulate } from "@sps/sps-website-builder-hero-section-block-contracts";

export const populate = {
  ...parentPopulate,
  page_blocks: {
    populate: { ...heroSectionBlockPopulate },
  },
};