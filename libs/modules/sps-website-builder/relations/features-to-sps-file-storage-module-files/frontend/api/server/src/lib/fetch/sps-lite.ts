import { actions } from "@sps/shared-frontend-server-api";
import {
  populate,
  route,
  IRelationExtended,
} from "@sps/sps-website-builder/relations/features-to-sps-file-storage-module-files/frontend/api/model";

export const api = {
  findById: async ({ id }: { id: string }) => {
    return await actions.findById<IRelationExtended>({
      id,
      path: "/api/sps-website-builder",
      model: route,
      params: {
        populate,
      },
    });
  },
  find: async (params: any = {}) => {
    return await actions.find<IRelationExtended>({
      model: route,
      path: "/api/sps-website-builder",
      params: {
        ...params,
        populate,
      },
    });
  },
};