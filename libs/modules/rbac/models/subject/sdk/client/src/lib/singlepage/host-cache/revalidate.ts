"use client";

import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  api,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { authorization } from "@sps/shared-frontend-client-utils";
import { useMutation } from "@tanstack/react-query";

export type IResult = IParentResult["IHostCacheRevalidateResult"];

export function action() {
  return useMutation<IResult>({
    mutationKey: [`${route}/host-cache/revalidate`],
    mutationFn: () =>
      api.hostCacheRevalidate({
        authorization:
          new Headers(authorization.headers()).get("Authorization") ??
          undefined,
        host: clientHost,
      }),
  });
}
