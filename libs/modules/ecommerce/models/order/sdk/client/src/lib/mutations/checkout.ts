"use client";

import { route } from "@sps/ecommerce/models/order/sdk/model";
import { toast } from "sonner";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/ecommerce/models/order/sdk/server";
import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
};

export type IResult = IParentResult["ICheckoutResult"];

export function action(props: IProps) {
  return useMutation<
    IParentResult["ICheckoutResult"],
    DefaultError,
    IParentProps["ICheckoutProps"]
  >({
    mutationKey: [`${route}/:id/checkout`],
    mutationFn: async (
      mutationFunctionProps: IParentProps["ICheckoutProps"],
    ) => {
      try {
        const result = await api.checkout({
          id: mutationFunctionProps.id,
          params: mutationFunctionProps.params,
          options: {
            ...mutationFunctionProps.options,
          },
          data: mutationFunctionProps.data,
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
        name: `${route}/:id/ecommerce/orders/:orderId`,
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
