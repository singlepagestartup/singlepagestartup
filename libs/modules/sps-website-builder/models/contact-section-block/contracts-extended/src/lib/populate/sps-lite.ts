import { populate as parentPopulate } from "@sps/sps-website-builder-contact-section-block-contracts";
import { populate as formPopulate } from "@sps/sps-crm-contracts/lib/models/form/populate";
import { populate as filePopulate } from "@sps/sps-file-storage-contracts/lib/models/file/populate";
import { populate as buttonsArrayPopulate } from "@sps/sps-website-builder-buttons-array-contracts";

export const populate = {
  ...parentPopulate,
  media: {
    populate: filePopulate,
  },
  additional_media: {
    populate: filePopulate,
  },
  form: {
    populate: formPopulate,
  },
  buttons_arrays: {
    populate: buttonsArrayPopulate,
  },
};