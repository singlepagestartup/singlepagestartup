import { createApi } from "@reduxjs/toolkit/query/react";
import { rtk, BACKEND_URL } from "@sps/utils";
import { populate } from "@sps/sps-ecommerce-contracts-extended/lib/entities/attribute-key/populate";
import type { IEntity } from "@sps/sps-ecommerce-contracts-extended/lib/entities/attribute-key/interfaces";

const extension = "sps-ecommerce/";
const model = "attribute-keys";
const reducerPath = `${extension}${model}`;
const rtkType = "AttributeKey";

export const api = createApi({
  baseQuery: rtk.api.fetchBaseQueryBuilder(`${BACKEND_URL}/api/sps-ecommerce`),
  tagTypes: [rtkType],
  reducerPath,
  endpoints: (build) => ({
    get: rtk.api.find<IEntity>({
      serviceApi: this,
      build,
      populate,
      model,
      rtkType,
    }),

    getById: rtk.api.findOne<IEntity>({
      serviceApi: this,
      build,
      populate,
      model,
      rtkType,
    }),
  }),
});
