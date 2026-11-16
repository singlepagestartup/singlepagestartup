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
import { ensureActiveSocialModuleProfile } from "../../social-module/profile/active-selection";
import { queryClient } from "@sps/shared-frontend-client-api";

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
};

export type IResult = IParentResult["IEcommerceModuleOrderCheckoutResult"];

export function action(props: IProps) {
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["IEcommerceModuleOrderCheckoutProps"]
  >({
    mutationKey: [`${route}/:id/ecommerce-module/orders/checkout`],
    mutationFn: async (
      mutationFunctionProps: IParentProps["IEcommerceModuleOrderCheckoutProps"],
    ) => {
      try {
        const socialModuleProfileId = await ensureActiveSocialModuleProfile(
          mutationFunctionProps.id,
          mutationFunctionProps.params?.socialModuleProfileId,
        );
        const result = await api.ecommerceModuleOrderCheckout({
          ...mutationFunctionProps,
          params: { ...mutationFunctionProps.params, socialModuleProfileId },
          options: {
            ...mutationFunctionProps.options,
            headers: saturateHeaders(mutationFunctionProps.options?.headers),
          },
          host: clientHost,
        });

        await queryClient.invalidateQueries({
          predicate: (query) => {
            const [path, serializedParams] = query.queryKey;
            return (
              typeof path === "string" &&
              path.startsWith(
                `${route}/${mutationFunctionProps.id}/ecommerce-module/`,
              ) &&
              typeof serializedParams === "string" &&
              new URLSearchParams(serializedParams).get(
                "socialModuleProfileId",
              ) === socialModuleProfileId
            );
          },
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
        name: `${route}/:id/ecommerce-module/orders/checkout`,
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
