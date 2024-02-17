import { populate as parentPopulate } from "@sps/sps-website-builder-contracts/lib/models/page/populate";
import { populate as layoutPopulate } from "@sps/sps-website-builder-contracts/lib/models/layout/populate";
import { populate as metatagPopulate } from "@sps/sps-website-builder-contracts/lib/models/metatag/populate";
import { populate as alertBlockPopulate } from "@sps/sps-website-builder-alert-block-contracts";
import { populate as ctaSectionBlockPopulate } from "@sps/sps-website-builder-contracts/lib/models/cta-section-block/populate";
import { populate as faqBlockPopulate } from "@sps/sps-website-builder-contracts/lib/models/faq-block/populate";
import { populate as featuresSectionBlockPopulate } from "@sps/sps-website-builder-contracts/lib/models/features-section-block/populate";
import { populate as headerSectionBlockPopulate } from "@sps/sps-website-builder-contracts/lib/models/header-section-block/populate";
import { populate as heroSectionBlockPopulate } from "@sps/sps-website-builder-hero-section-block-contracts";
import { populate as incentivesBlockPopulate } from "@sps/sps-website-builder-contracts/lib/models/incentives-block/populate";
import { populate as logotypesCloudBlockPopulate } from "@sps/sps-website-builder-contracts/lib/models/logotypes-cloud-block/populate";
import { populate as notFoundBlockPopulate } from "@sps/sps-website-builder-contracts/lib/models/not-found-block/populate";
import { populate as sliderBlockPopulate } from "@sps/sps-website-builder-contracts/lib/models/slider-block/populate";
import { populate as buttonPopulate } from "@sps/sps-website-builder-button-contracts";
import { populate as buttonsArrayPopulate } from "@sps/sps-website-builder-buttons-array-contracts";

const pageBlockPopulate = {
  ...alertBlockPopulate,
  ...ctaSectionBlockPopulate,
  ...faqBlockPopulate,
  ...featuresSectionBlockPopulate,
  ...headerSectionBlockPopulate,
  ...heroSectionBlockPopulate,
  ...incentivesBlockPopulate,
  ...logotypesCloudBlockPopulate,
  ...notFoundBlockPopulate,
  ...sliderBlockPopulate,
  ...buttonPopulate,
  ...buttonsArrayPopulate,
};

export const populate = {
  ...parentPopulate,
  layout: {
    populate: layoutPopulate,
  },
  metatag: {
    populate: metatagPopulate,
  },
  page_blocks: {
    populate: pageBlockPopulate,
  },
};
