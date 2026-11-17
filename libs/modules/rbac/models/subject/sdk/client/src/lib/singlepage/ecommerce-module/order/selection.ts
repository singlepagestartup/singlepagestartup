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

type IVariables = IParentProps["IEcommerceModuleOrderSelectionProps"];
export type IResult = IParentResult["IEcommerceModuleOrderSelectionResult"];
export interface IProps {
  reactQueryOptions?: Partial<
    UseMutationOptions<IResult, DefaultError, IVariables>
  >;
}

export function action(props: IProps = {}) {
  const { onSuccess, ...options } = props.reactQueryOptions ?? {};
  return useMutation<IResult, DefaultError, IVariables>({
    ...options,
    mutationKey: [`${route}/:id/ecommerce-module/orders/:orderId/selection`],
    mutationFn: async (variables) => {
      const result = await api.ecommerceModuleOrderSelection({
        ...variables,
        host: variables.host ?? clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      });
      if (result.applied) {
        // An aggregate mutation returns quotes and IDs, so reconcile its scoped
        // collection instead of inserting incomplete Order or Subject records.
        await invalidateRouteQueries(
          queryClient,
          `${route}/${variables.id}/ecommerce-module/orders`,
        );
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${variables.id}/ecommerce-module/orders/${variables.orderId}/selection`,
          props: { id: variables.id, orderId: variables.orderId },
          result: { applied: result.applied, orderIds: result.orderIds },
          timestamp: Date.now(),
          requestId: createId(),
        });
      }
      return result;
    },
    async onSuccess(...args) {
      await onSuccess?.(...args);
    },
  });
}
