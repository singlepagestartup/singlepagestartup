import { populate as parentPopulate } from "@sps/sps-website-builder-not-found-block-contracts";
import { populate as buttonPopulate } from "@sps/sps-website-builder-button-contracts";
import { populate as filePopulate } from "@sps/sps-file-storage-contracts/lib/models/file/populate";

export const populate = {
  ...parentPopulate,
  buttons: {
    populate: buttonPopulate,
  },
  media: {
    populate: filePopulate,
  },
  additional_media: {
    populate: filePopulate,
  },
};