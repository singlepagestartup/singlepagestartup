import { createApi } from "@reduxjs/toolkit/query/react";
import { rtk, BACKEND_URL } from "@sps/utils";
import { route, tag } from "../../_model";

export const api = createApi({
  baseQuery: rtk.api.fetchBaseQueryBuilder(`${BACKEND_URL}/api`),
  tagTypes: [tag],
  reducerPath: route,
  endpoints: (build) => ({}),
});