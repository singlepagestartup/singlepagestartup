import { createApi } from "@reduxjs/toolkit/query/react";
import { BACKEND_URL } from "~utils/envs";
import { strapiFetchBaseQueryBuilder, strapiFind } from "~redux/strapi-rtk";
import { populate } from "../populate";
import { IBackendApiEntity } from "../interfaces";

const model = "slide-overs";
const rtkType = "SlideOver";

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
    }),
  }),
});
