import { fetch as utilsFetch } from "@sps/shared-frontend-utils-server";
import {
  populate,
  route,
  IModelExtended,
} from "@sps/sps-website-builder-relations-pages-to-widgets-frontend-api-model";

export const api = {
  findById: async ({ id }: { id: number | string }) => {
    return await utilsFetch.api.findOne<IModelExtended>({
      id,
      model: route,
      populate,
      rootPath: "/api/sps-website-builder",
    });
  },
  find: async () => {
    return await utilsFetch.api.find<IModelExtended>({
      model: route,
      populate,
      rootPath: "/api/sps-website-builder",
    });
  },
};
