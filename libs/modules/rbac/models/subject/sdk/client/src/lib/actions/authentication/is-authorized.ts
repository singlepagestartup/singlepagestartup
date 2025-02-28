"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import { STALE_TIME } from "@sps/shared-utils";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";

export type IProps = IParentProps["IAuthenticationIsAuthorizedProps"] & {
  reactQueryOptions?: Partial<UseQueryOptions<any>>;
  mute?: boolean;
};

export type IResult = IParentResult["IAuthenticationIsAuthorizedResult"];

export function action(props: IProps) {
  return useQuery<IResult>({
    queryKey: [`${route}/authentication/is-authorized`],
    queryFn: async () => {
      const result = await api.authenticationIsAuthorized({
        ...props,
        host: clientHost,
      });

      return result;
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/authentication/is-authorized`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: STALE_TIME,
    ...props.reactQueryOptions,
  });
}
