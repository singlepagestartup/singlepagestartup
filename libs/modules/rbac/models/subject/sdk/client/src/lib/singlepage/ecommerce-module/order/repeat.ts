"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  useMutation,
  type DefaultError,
  type UseMutationOptions,
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
import { queryClient } from "@sps/shared-frontend-client-api";

type IVariables = IParentProps["IEcommerceModuleOrderRepeatProps"];

export interface IProps {
  reactQueryOptions?: Partial<
    UseMutationOptions<IResult, DefaultError, IVariables>
  >;
}

export type IResult = IParentResult["IEcommerceModuleOrderRepeatResult"];

export function action(props: IProps = {}) {
  const { onSuccess, ...reactQueryOptions } = props.reactQueryOptions ?? {};

  return useMutation<IResult, DefaultError, IVariables>({
    ...reactQueryOptions,
    mutationKey: [
      `${route}/:id/social-module/profiles/:socialModuleProfileId/ecommerce-module/orders/:orderId/repeat`,
    ],
    mutationFn: async (variables) => {
      const { id, orderId } = variables;
      const socialModuleProfileId = variables.params?.socialModuleProfileId;

      try {
        if (!socialModuleProfileId) {
          throw new Error(
            "Validation error. socialModuleProfileId is required",
          );
        }

        const requestProps: IVariables = {
          ...variables,
          id,
          orderId,
          params: { socialModuleProfileId },
          options: {
            ...variables.options,
            headers: saturateHeaders(variables.options?.headers),
          },
          host: variables.host ?? clientHost,
        };
        const result = await api.ecommerceModuleOrderRepeat(requestProps);

        // The result contains IDs, so reconcile the affected profile's cart
        // aggregates instead of inserting incomplete Order records.
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const [path, serializedParams] = query.queryKey;

            return (
              typeof path === "string" &&
              path.startsWith(`${route}/${id}/ecommerce-module/`) &&
              typeof serializedParams === "string" &&
              new URLSearchParams(serializedParams).get(
                "socialModuleProfileId",
              ) === socialModuleProfileId
            );
          },
        });

        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${id}/social-module/profiles/${socialModuleProfileId}/ecommerce-module/orders/${orderId}/repeat`,
          props: { id, orderId, params: { socialModuleProfileId } },
          result,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return result;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error));

        throw error;
      }
    },
    async onSuccess(...args) {
      await onSuccess?.(...args);
    },
  });
}
