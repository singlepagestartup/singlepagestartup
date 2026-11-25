"use client";

import { factory, queryClient } from "@sps/shared-frontend-client-api";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { route, type IModel } from "@sps/crm/models/funnel/sdk/model";

export const { find: useAdminRecords } = factory<IModel>({
  host: NEXT_PUBLIC_API_SERVICE_URL,
  route: route + "/admin-records",
  queryClient,
});
