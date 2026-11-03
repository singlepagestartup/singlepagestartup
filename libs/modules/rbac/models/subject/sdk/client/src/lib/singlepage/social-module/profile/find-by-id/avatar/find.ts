"use client";
import { useEffect } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  api,
  type IProps as IServerProps,
  type IResult as IServerResult,
} from "@sps/rbac/models/subject/sdk/server";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { queryClient, subscription } from "@sps/shared-frontend-client-api";
type IServerFindProps =
  IServerProps["ISocialModuleProfileFindByIdAvatarFindProps"];
export interface IProps extends IServerFindProps {
  reactQueryOptions?: Partial<UseQueryOptions<IResult>>;
}
export type IResult =
  IServerResult["ISocialModuleProfileFindByIdAvatarFindResult"];
export function action(props: IProps) {
  const key = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/avatar`;
  useEffect(() => subscription(key, queryClient), [key]);
  return useQuery<IResult>({
    ...props.reactQueryOptions,
    queryKey: [key],
    meta: {
      topics: [
        "social.profiles-to-file-storage-module-files",
        "file-storage.files",
      ],
      ...props.reactQueryOptions?.meta,
    },
    queryFn: () =>
      api.socialModuleProfileFindByIdAvatarFind({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}
