import { populate as fileUploadPopulate } from "~redux/services/backend/extensions/upload/api/file/populate";
import { populate as tierPopulate } from "~redux/services/backend/api/tier/populate";

export const populate = {
  tiers: {
    populate: tierPopulate,
  },
  media: {
    populate: fileUploadPopulate,
  },
  additionalMedia: {
    populate: fileUploadPopulate,
  },
};
