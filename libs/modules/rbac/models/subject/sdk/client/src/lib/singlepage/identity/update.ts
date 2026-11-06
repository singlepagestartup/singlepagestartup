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
  patchInListQueries,
} from "@sps/shared-frontend-client-api";

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
};

export type IResult = IParentResult["IIdentityUpdateResult"];

export function action(props: IProps) {
  const { onSuccess, ...reactQueryOptions } = props.reactQueryOptions ?? {};
  return useMutation<
    IParentResult["IIdentityUpdateResult"],
    DefaultError,
    IParentProps["IIdentityUpdateProps"]
  >({
    mutationKey: [`${route}/:id/identities/:identityId`],
    mutationFn: async (
      mutationFunctionProps: IParentProps["IIdentityUpdateProps"],
    ) => {
      try {
        const result = await api.identityUpdate({
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
    ...reactQueryOptions,
    async onSuccess(...args) {
      const [data, variables] = args;
      patchInListQueries(
        queryClient,
        `${route}/${variables.id}/identities`,
        data.id,
        data,
      );
      patchInListQueries(queryClient, "/api/rbac/identities", data.id, data);
      queryClient.setQueriesData(
        { queryKey: [`/api/rbac/identities/${data.id}`] },
        data,
      );
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/:id/identities/:identityId`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      await onSuccess?.(...args);
    },
  });
}
