"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
  id: string;
  socialModuleProfileId: string;
  socialModuleChatId: string;
  targetSocialModuleProfileId: string;
  socialModuleSkillId: string;
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdateResult"];

export function action(props: IProps) {
  const mutationKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/skills/${props.socialModuleSkillId}`;

  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdateProps"]
  >({
    mutationKey: [mutationKey],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdateProps"],
    ) => {
      try {
        return await api.socialModuleProfileFindByIdChatFindByIdProfileFindByIdSkillUpdate(
          {
            ...mutationFunctionProps,
            options: {
              ...mutationFunctionProps.options,
              headers: saturateHeaders(mutationFunctionProps.options?.headers),
            },
            host: clientHost,
          },
        );
      } catch (error: any) {
        toast.error(error.message);
        throw error;
      }
    },
    onSuccess(data) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: mutationKey,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    ...props.reactQueryOptions,
  });
}
