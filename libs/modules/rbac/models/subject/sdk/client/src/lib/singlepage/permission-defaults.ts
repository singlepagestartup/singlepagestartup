"use client";

import { useQuery } from "@tanstack/react-query";
import { consistencyQueryKey } from "@sps/shared-frontend-client-api";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  api,
  type IResult as IServerResult,
} from "@sps/rbac/models/subject/sdk/server";

export type IResult = IServerResult["IPermissionDefaultsResult"];

export function action() {
  return useQuery<IResult>({
    queryKey: consistencyQueryKey(
      `${route}/permission-defaults`,
      undefined,
      clientHost,
    ),
    meta: { topics: ["rbac.permissions"] },
    queryFn: ({ signal }) =>
      api.permissionDefaults({
        host: clientHost,
        options: { signal, headers: saturateHeaders() },
      }),
    retry: false,
    gcTime: 0,
  });
}
