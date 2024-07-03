"use client";

import {
  IRelationExtended,
  route,
  host,
} from "@sps/sps-rbac/relations/subjects-to-roles/frontend/api/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export const api = factory<IRelationExtended>({
  queryClient,
  route,
  host,
});