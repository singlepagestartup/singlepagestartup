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
  IParentResult["ISocialModuleProfileFindByIdChatFindByIdDeleteResult"];

export function action(props: IProps) {
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["ISocialModuleProfileFindByIdChatFindByIdDeleteProps"]
  >({
    mutationKey: [
      `${route}/:id/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}`,
    ],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ISocialModuleProfileFindByIdChatFindByIdDeleteProps"],
    ) => {
      try {
        const result = await api.socialModuleProfileFindByIdChatFindByIdDelete({
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
        name: `${route}/:id/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}`,
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
