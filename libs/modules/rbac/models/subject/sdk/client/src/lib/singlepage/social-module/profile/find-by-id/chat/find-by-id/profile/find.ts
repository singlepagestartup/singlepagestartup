"use client";

import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { STALE_TIME } from "@sps/shared-utils";

export type IProps =
  IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
  };
export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles`;

  return useQuery<IResult>({
    queryKey: [queryKey],
    queryFn: () =>
      api.socialModuleProfileFindByIdChatFindByIdProfileFind({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
    staleTime: STALE_TIME,
    ...props.reactQueryOptions,
  });
}
