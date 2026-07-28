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
  IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillAvailableProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
  };
export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillAvailableResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/skills/available?limit=${props.limit ?? ""}&offset=${props.offset ?? ""}&search=${props.search ?? ""}`;

  return useQuery<IResult>({
    queryKey: [queryKey],
    queryFn: () =>
      api.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillAvailable({
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
