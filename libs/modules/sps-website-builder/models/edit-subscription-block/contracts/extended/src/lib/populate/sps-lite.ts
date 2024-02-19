import { populate as parentPopulate } from "@sps/sps-website-builder-edit-subscription-block-contracts";
import { populate as filePopulate } from "@sps/sps-file-storage-file-contracts";

export const populate = {
  ...parentPopulate,
  media: {
    populate: filePopulate,
  },
  additional_media: {
    populate: filePopulate,
  },
};
