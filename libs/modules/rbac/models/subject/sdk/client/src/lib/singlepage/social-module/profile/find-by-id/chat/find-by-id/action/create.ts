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
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdActionCreateResult"];

export function action(props: IProps) {
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdChatFindByIdActionCreateProps"]
  >({
    mutationKey: [
      `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/actions`,
    ],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdChatFindByIdActionCreateProps"],
    ) => {
      try {
        const result =
          await api.socialModuleProfileFindByIdChatFindByIdActionCreate({
            ...mutationFunctionProps,
            options: {
              ...mutationFunctionProps.options,
              headers: saturateHeaders(mutationFunctionProps.options?.headers),
            },
            host: clientHost,
          });

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    onSuccess(data) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/actions`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    ...props?.reactQueryOptions,
  });
}
