import { populate as fileUploadPopulate } from "~redux/services/backend/extensions/upload/api/file/populate";

export const populate = {
  attributes: {
    populate: {
      media: { populate: fileUploadPopulate },
      additional_media: { populate: fileUploadPopulate },
    },
  },
};
