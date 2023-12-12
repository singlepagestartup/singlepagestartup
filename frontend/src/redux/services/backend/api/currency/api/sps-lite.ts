import { createApi } from "@reduxjs/toolkit/query/react";
import { api as modalApi } from "~redux/services/backend/api/modal/api";
import { BACKEND_URL } from "~utils/envs";
import { strapiFetchBaseQueryBuilder, strapiFind } from "~redux/strapi-rtk";
import { IBackendApiEntity } from "../interfaces";
import { populate } from "../populate";

const rtkType = "Currency";
const model = "currencies";

export const api = createApi({
  baseQuery: strapiFetchBaseQueryBuilder(BACKEND_URL),
  tagTypes: [rtkType],
  reducerPath: model,
  endpoints: (build) => ({
    get: strapiFind<IBackendApiEntity>({
      serviceApi: this,
      build,
      populate,
      model,
      rtkType,
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        await queryFulfilled;
        dispatch(modalApi.util.invalidateTags(["Modal"]));
      },
    }),
  }),
});
