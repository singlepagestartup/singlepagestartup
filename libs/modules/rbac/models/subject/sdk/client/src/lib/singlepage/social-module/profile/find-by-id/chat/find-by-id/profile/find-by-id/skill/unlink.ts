"use client";

import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

type TProps =
  IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUnlinkProps"];
export type IProps = Omit<TProps, "host" | "options"> & {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, TProps>>;
};
export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUnlinkResult"];

export function action(props: IProps) {
  const mutationKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/skills/${props.socialModuleSkillId}`;

  return useMutation<IResult, DefaultError, TProps>({
    mutationKey: [mutationKey],
    mutationFn: (value) =>
      api.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUnlink({
        ...value,
        host: clientHost,
        options: {
          ...value.options,
          headers: saturateHeaders(value.options?.headers),
        },
      }),
    ...props.reactQueryOptions,
  });
}
