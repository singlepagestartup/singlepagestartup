"use client";
import { useEffect } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import QueryString from "qs";
import {
  api,
  type IProps as IServerProps,
} from "@sps/rbac/models/subject/sdk/server";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IIdentity } from "@sps/rbac/models/identity/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { queryClient, subscription } from "@sps/shared-frontend-client-api";

type IServerFindProps = IServerProps["IIdentityFindProps"];
export interface IProps extends IServerFindProps {
  reactQueryOptions?: Partial<UseQueryOptions<IIdentity[]>>;
}
export type IResult = IIdentity[];

export function action(props: IProps) {
  const key = `${route}/${props.id}/identities?${QueryString.stringify(props.params, { encodeValuesOnly: true })}`;
  useEffect(() => subscription(key, queryClient), [key]);
  return useQuery<IResult>({
    ...props.reactQueryOptions,
    queryKey: [key],
    meta: {
      topics: ["rbac.identities", "rbac.subjects-to-identities"],
      ...props.reactQueryOptions?.meta,
    },
    queryFn: async () =>
      (await api.identityFind({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          next: { ...props.options?.next },
          headers: saturateHeaders(props.options?.headers),
        },
      })) ?? [],
  });
}
