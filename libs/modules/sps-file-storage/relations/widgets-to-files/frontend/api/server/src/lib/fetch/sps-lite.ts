import { fetch as utilsFetch } from "@sps/shared-frontend-utils-server";
import {
  populate,
  route,
  IRelationExtended,
} from "@sps/sps-file-storage-relations-widgets-to-files-frontend-api-model";

export const api = {
  findById: async ({ id }: { id: number | string }) => {
    return await utilsFetch.api.findOne<IRelationExtended>({
      id,
      model: route,
      populate,
      rootPath: "/api/sps-file-storage",
    });
  },
  find: async () => {
    return await utilsFetch.api.find<IRelationExtended>({
      model: route,
      populate,
      rootPath: "/api/sps-file-storage",
    });
  },
};