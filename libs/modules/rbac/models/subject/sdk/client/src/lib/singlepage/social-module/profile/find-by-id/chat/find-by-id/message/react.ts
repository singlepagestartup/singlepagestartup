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
  socialModuleMessageId: string;
};

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdMessageFindByIdReactResult"];

export function action(props: IProps) {
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdChatFindByIdMessageFindByIdReactProps"]
  >({
    mutationKey: [
      `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/messages/${props.socialModuleChatId}/react`,
    ],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdChatFindByIdMessageFindByIdReactProps"],
    ) => {
      try {
        const result =
          await api.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReact(
            {
              ...mutationFunctionProps,
              options: {
                ...mutationFunctionProps.options,
                headers: saturateHeaders(
                  mutationFunctionProps.options?.headers,
                ),
              },
              host: clientHost,
            },
          );

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    onSuccess(data) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/messages/${props.socialModuleMessageId}/react`,
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
