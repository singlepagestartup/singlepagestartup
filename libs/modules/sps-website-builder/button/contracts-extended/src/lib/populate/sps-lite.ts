import { populate as parentPopulate } from "@sps/sps-website-builder-button-contracts";
import { populate as filePopulate } from "@sps/sps-file-storage-contracts/lib/models/file/populate";
import { populate as flyoutPopulate } from "libs/modules/sps-website-builder/flyout/contracts/src/lib/populate";

export const populate = {
  ...parentPopulate,
  media: {
    populate: filePopulate,
  },
  additional_media: {
    populate: filePopulate,
  },
  flyout: {
    populate: flyoutPopulate,
  },
};
