"use client";
import {
  useMutation,
  type DefaultError,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  invalidateRouteQueries,
} from "@sps/shared-frontend-client-api";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import { toast } from "sonner";
type IVariables = IParentProps["IEcommerceModuleOrderDeleteProps"];
export type IResult = IParentResult["IEcommerceModuleOrderDeleteResult"];
export interface IProps {
  reactQueryOptions?: Partial<
    UseMutationOptions<IResult, DefaultError, IVariables>
  >;
}
export function action(props: IProps = {}) {
  const { onSuccess, ...options } = props.reactQueryOptions ?? {};
  return useMutation<IResult, DefaultError, IVariables>({
    ...options,
    mutationKey: [`${route}/:id/ecommerce-module/orders/:orderId`],
    mutationFn: async (variables) => {
      const result = await api
        .ecommerceModuleOrderDelete({
          ...variables,
          host: variables.host ?? clientHost,
          options: {
            ...variables.options,
            headers: saturateHeaders(variables.options?.headers),
          },
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : String(error));
          throw error;
        });
      // This aggregate operation returns a Subject, so reconcile the scoped Order
      // collection instead of patching incomplete Order rows into its cache.
      await invalidateRouteQueries(
        queryClient,
        `${route}/${variables.id}/ecommerce-module/orders`,
      );
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${variables.id}/ecommerce-module/orders/:orderId`,
        props: { id: variables.id },
        result: { id: result.id },
        timestamp: Date.now(),
        requestId: createId(),
      });
      return result;
    },
    async onSuccess(...args) {
      await onSuccess?.(...args);
    },
  });
}
