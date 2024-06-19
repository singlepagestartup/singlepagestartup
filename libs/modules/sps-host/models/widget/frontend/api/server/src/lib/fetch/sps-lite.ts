import { fetch as utilsFetch } from "@sps/shared-frontend-utils-server";
import {
  populate,
  route,
  IModelExtended,
} from "@sps/sps-host-models-widget-frontend-api-model";

export const api = {
  findById: async ({ id }: { id: string }) => {
    return await utilsFetch.api.findById<IModelExtended>({
      id,
      model: route,
      populate,
      rootPath: "/api/sps-host",
    });
  },
  find: async () => {
    return await utilsFetch.api.find<IModelExtended>({
      model: route,
      populate,
      rootPath: "/api/sps-host",
    });
  },
};
