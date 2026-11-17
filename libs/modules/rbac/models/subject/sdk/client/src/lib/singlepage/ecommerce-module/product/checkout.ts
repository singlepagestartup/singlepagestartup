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
import {
  queryClient,
  invalidateRouteQueries,
} from "@sps/shared-frontend-client-api";

type IVariables = IParentProps["IEcommerceModuleProductCheckoutProps"];

export interface IProps {
  reactQueryOptions?: Partial<
    UseMutationOptions<IResult, DefaultError, IVariables>
  >;
}

export type IResult = IParentResult["IEcommerceModuleProductCheckoutResult"];

export function action(props: IProps) {
  return useMutation<IResult, DefaultError, IVariables>({
    ...props.reactQueryOptions,
    mutationKey: [`${route}/:id/ecommerce-module/products/:productId/checkout`],
    mutationFn: async (mutationFunctionProps: IVariables) => {
      let result: IResult;
      try {
        result = await api.ecommerceModuleProductCheckout({
          ...mutationFunctionProps,
          options: {
            ...mutationFunctionProps.options,
            headers: saturateHeaders(mutationFunctionProps.options?.headers),
          },
          host: clientHost,
        });
      } catch (error: any) {
        // Checkout may retain a newly created cart or a pending payment attempt.
        await invalidateRouteQueries(
          queryClient,
          `${route}/${mutationFunctionProps.id}/ecommerce-module/orders`,
        ).catch(() => undefined);
        toast.error(error.message);

        throw error;
      }
      await invalidateRouteQueries(
        queryClient,
        `${route}/${mutationFunctionProps.id}/ecommerce-module/orders`,
      ).catch(() => undefined);
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${mutationFunctionProps.id}/ecommerce-module/products/${mutationFunctionProps.productId ?? mutationFunctionProps.data.productId}/checkout`,
        props: { id: mutationFunctionProps.id },
        result: {
          invoiceIds: result.billingModule.invoices.map(
            (invoice) => invoice.id,
          ),
        },
        timestamp: Date.now(),
        requestId: createId(),
      });
      return result;
    },
  });
}
