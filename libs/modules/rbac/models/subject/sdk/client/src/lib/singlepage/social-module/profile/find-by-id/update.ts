"use client";
import {
  api,
  type IProps as IServerProps,
} from "@sps/rbac/models/subject/sdk/server";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  patchInListQueries,
} from "@sps/shared-frontend-client-api";
import { useMutation } from "@tanstack/react-query";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
export interface IProps {}
export type IResult = Awaited<
  ReturnType<typeof api.socialModuleProfileFindByIdUpdate>
>;
export function action(_props: IProps) {
  return useMutation({
    mutationFn: (
      variables: IServerProps["ISocialModuleProfileFindByIdUpdateProps"],
    ) =>
      api.socialModuleProfileFindByIdUpdate({
        ...variables,
        host: clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    onSuccess(data, variables) {
      patchInListQueries(queryClient, "/api/social/profiles", data.id, data);
      patchInListQueries(
        queryClient,
        `${route}/${variables.id}/social-module/profiles`,
        data.id,
        data,
      );
      queryClient.setQueriesData(
        { queryKey: [`/api/social/profiles/${data.id}`] },
        data,
      );
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/:id/social-module/profiles/:profileId`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });
    },
  });
}
