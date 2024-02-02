import { populate as parentPopulate } from "@sps/sps-ecommerce-contracts/lib/models/products-list-block/populate";
import { populate as buttonPopulate } from "@sps/sps-website-builder-contracts/lib/models/button/populate";

export const populate = {
  ...parentPopulate,
  buttons: {
    populate: buttonPopulate,
  },
};
