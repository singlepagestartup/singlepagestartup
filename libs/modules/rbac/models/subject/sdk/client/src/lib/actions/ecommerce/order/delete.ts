"use client";

import { route, IModel } from "@sps/rbac/models/subject/sdk/model";
import { NextRequestOptions } from "@sps/shared-utils";
import { DefaultError, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";

export type IProps = {
  id: IModel["id"];
  orderId?: string;
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
  reactQueryOptions?: Parameters<typeof useQuery>[1];
};

export type IResult = IParentResult["IEcommerceOrderCreateResult"];

export function action(props: IProps) {
  return useMutation<
    IParentResult["IEcommerceOrderDeleteResult"],
    DefaultError,
    IParentProps["IEcommerceOrderDeleteProps"]
  >({
    mutationKey: [`${route}/${props.id}/ecommerce/orders/${props.orderId}`],
    mutationFn: async (
      mutationFunctionProps: IParentProps["IEcommerceOrderDeleteProps"],
    ) => {
      try {
        const result = await api.ecommerceOrderDelete({
          ...mutationFunctionProps,
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
        name: `${route}/${props.id}/ecommerce/orders/${props.orderId}`,
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
