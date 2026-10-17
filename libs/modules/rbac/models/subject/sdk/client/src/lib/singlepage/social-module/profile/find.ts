"use client";
import {
  api,
  type IProps as IServerProps,
} from "@sps/rbac/models/subject/sdk/server";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { queryClient, subscription } from "@sps/shared-frontend-client-api";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import QueryString from "qs";
type IServerFindProps = IServerProps["ISocialModuleProfileFindProps"];
export interface IProps extends IServerFindProps {
  reactQueryOptions?: Partial<UseQueryOptions<IProfile[]>>;
}
export type IResult = IProfile[];
export function action(props: IProps) {
  const key = `${route}/${props.id}/social-module/profiles?${QueryString.stringify(props.params, { encodeValuesOnly: true })}`;
  useEffect(() => subscription(key, queryClient), [key]);
  return useQuery<IResult>({
    ...props.reactQueryOptions,
    queryKey: [key],
    meta: {
      topics: [
        "social.profiles",
        "social.profiles-to-chats",
        "rbac.subjects-to-social-module-profiles",
      ],
      ...props.reactQueryOptions?.meta,
    },
    queryFn: () =>
      api.socialModuleProfileFind({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}
