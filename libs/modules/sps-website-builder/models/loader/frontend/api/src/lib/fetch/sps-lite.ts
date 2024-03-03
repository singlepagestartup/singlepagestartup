import { fetch } from "@sps/shared-frontend-utils-client";
import { populate, route, IModelExtended } from "../model";

export const api = {
  find: async () => {
    return await fetch.api.find<IModelExtended>({ model: route, populate });
  },
  findOne: async ({ id }: { id: number }) => {
    return await fetch.api.findOne<IModelExtended>({
      id,
      model: route,
      populate,
    });
  },
};