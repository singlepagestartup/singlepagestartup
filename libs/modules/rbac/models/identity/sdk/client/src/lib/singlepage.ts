"use client";

import { createId } from "@paralleldrive/cuid2";
import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/rbac/models/identity/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import { DefaultError, useMutation } from "@tanstack/react-query";
import QueryString from "qs";
import { toast } from "sonner";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export interface IChangePasswordMutationFunctionProps {
  id: string;
  data: {
    password: string;
    newPassword: string;
  };
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  changePassword: (props: {
    id: string;
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      { jwt: string; refresh: string },
      DefaultError,
      IChangePasswordMutationFunctionProps
    >({
      mutationKey: [`${route}/${props.id}/change-password`],
      mutationFn: async (
        mutationFunctionProps: IChangePasswordMutationFunctionProps,
      ) => {
        try {
          const { data } = mutationFunctionProps;

          const formData = prepareFormDataToSend({ data });

          const stringifiedQuery = QueryString.stringify(
            mutationFunctionProps.params || props?.params,
            {
              encodeValuesOnly: true,
            },
          );

          const requestOptions: NextRequestOptions = {
            credentials: "include",
            method: "PATCH",
            body: formData,
            ...(mutationFunctionProps.options || props?.options),
            next: {
              ...(mutationFunctionProps.options?.next || props?.options?.next),
            },
          };
          const res = await fetch(
            `${clientHost}${route}/${props.id}/change-password?${stringifiedQuery}`,
            requestOptions,
          );

          const json = await responsePipe<{
            data: IModel;
          }>({
            res,
          });

          const transformedData = transformResponseItem<IModel>(json);

          return transformedData;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props.id}/change-password`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
};
