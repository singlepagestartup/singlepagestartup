import { createApi } from "@reduxjs/toolkit/query/react";
import { rtk, BACKEND_URL } from "@sps/shared-frontend-utils-client";
import {
  IModelExtended,
  route,
  tag,
  populate,
} from "@sps/sps-file-storage-models-widget-frontend-api-model";

export const api = createApi({
  baseQuery: rtk.api.fetchBaseQueryBuilder(
    `${BACKEND_URL}/api/sps-file-storage`,
  ),
  tagTypes: [tag],
  reducerPath: route,
  endpoints: (build) => ({
    findById: rtk.api.findById<IModelExtended>({
      serviceApi: this,
      build,
      populate,
      model: route,
      rtkType: tag,
    }),
    find: rtk.api.find<IModelExtended>({
      serviceApi: this,
      build,
      populate,
      model: route,
      rtkType: tag,
    }),
    create: rtk.api.create<IModelExtended>({
      serviceApi: this,
      build,
      populate,
      model: route,
      rtkType: tag,
    }),
    update: rtk.api.update<IModelExtended>({
      serviceApi: this,
      build,
      populate,
      model: route,
      rtkType: tag,
    }),
    delete: rtk.api.delete<IModelExtended>({
      serviceApi: this,
      build,
      populate,
      model: route,
      rtkType: tag,
    }),
  }),
});

export const subscription = (reduxStore: any) => {};