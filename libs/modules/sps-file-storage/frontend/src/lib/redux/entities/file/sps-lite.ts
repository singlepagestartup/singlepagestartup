import { createApi } from "@reduxjs/toolkit/query/react";
import { rtk, BACKEND_URL } from "@sps/utils";

const model = "upload";
const rtkType = "Upload";

export const api = createApi({
  baseQuery: rtk.api.fetchBaseQueryBuilder(`${BACKEND_URL}/api`),
  tagTypes: [rtkType],
  reducerPath: model,
  endpoints: (build) => ({}),
});
