"use client";
import {
  api,
  type IProps as IServerProps,
} from "@sps/rbac/models/subject/sdk/server";
import {
  clientHost,
  route as subjectRoute,
} from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  appendToListQueries,
  removeFromListQueries,
} from "@sps/shared-frontend-client-api";
import { useMutation } from "@tanstack/react-query";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
export interface IProps {}
export type IResult = Awaited<
  ReturnType<typeof api.socialModuleProfileFindByIdAvatarUpdate>
>;
export function action(_props: IProps) {
  return useMutation({
    mutationFn: (
      variables: IServerProps["ISocialModuleProfileFindByIdAvatarUpdateProps"],
    ) =>
      api.socialModuleProfileFindByIdAvatarUpdate({
        ...variables,
        host: clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    onSuccess(data, variables) {
      queryClient.setQueryData(
        [
          `${subjectRoute}/${variables.id}/social-module/profiles/${variables.socialModuleProfileId}/avatar`,
        ],
        data,
      );
      const route = "/api/social/profiles-to-file-storage-module-files";
      const ids = new Set<string>();
      for (const query of queryClient.getQueryCache().findAll({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          String(query.queryKey[0]).startsWith(route),
      })) {
        if (Array.isArray(query.state.data))
          for (const link of query.state.data)
            if (
              link.profileId === variables.socialModuleProfileId &&
              link.id !== data.relation?.id
            )
              ids.add(link.id);
      }
      for (const id of ids) removeFromListQueries(queryClient, route, id);
      if (data.relation) appendToListQueries(queryClient, route, data.relation);
      if (data.file)
        appendToListQueries(queryClient, "/api/file-storage/files", data.file);
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${subjectRoute}/:id/social-module/profiles/:profileId/avatar`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });
    },
  });
}
