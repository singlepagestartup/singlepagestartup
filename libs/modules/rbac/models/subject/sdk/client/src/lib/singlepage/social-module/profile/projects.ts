"use client";

import {
  api,
  type IProps as IServerProps,
  type IResult as IServerResult,
} from "@sps/rbac/models/subject/sdk/server";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  subscription,
  consistencyQueryKey,
} from "@sps/shared-frontend-client-api";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useEffect } from "react";

export type IResult = IServerResult["ISocialModuleProfileProjectsResult"];
type IServerProjectsProps = IServerProps["ISocialModuleProfileProjectsProps"];
export interface IProps extends IServerProjectsProps {
  reactQueryOptions?: Partial<UseQueryOptions<IResult>>;
}

export function action(props: IProps) {
  const key = `${route}/${props.id}/social-module/profiles/projects`;
  const { meta, ...reactQueryOptions } = props.reactQueryOptions ?? {};
  useEffect(() => subscription(key, queryClient), [key]);
  return useQuery<IResult>({
    ...reactQueryOptions,
    queryKey: consistencyQueryKey(key, undefined, clientHost),
    meta: {
      topics: [
        "social.profiles",
        "social.chats",
        "social.profiles-to-chats",
        "social.threads",
        "social.chats-to-threads",
        "rbac.subjects-to-social-module-profiles",
      ],
      ...meta,
    },
    queryFn: () =>
      api.socialModuleProfileProjects({
        id: props.id,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}
