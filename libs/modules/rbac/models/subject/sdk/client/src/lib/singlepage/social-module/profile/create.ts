"use client";
import {
  api,
  type IProps as IServerProps,
} from "@sps/rbac/models/subject/sdk/server";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  appendToListQueries,
} from "@sps/shared-frontend-client-api";
import { useMutation } from "@tanstack/react-query";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
export interface IProps {
  id: string;
}
export type IResult = IProfile;
export function action(props: IProps) {
  const collection = `${route}/${props.id}/social-module/profiles`;
  return useMutation({
    mutationKey: [collection],
    mutationFn: (variables: IServerProps["ISocialModuleProfileCreateProps"]) =>
      api.socialModuleProfileCreate({
        ...variables,
        host: clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    onSuccess(data, variables) {
      appendToListQueries(
        queryClient,
        `${route}/${variables.id}/social-module/profiles`,
        data,
      );
      appendToListQueries(queryClient, "/api/social/profiles", data);
      void queryClient.invalidateQueries({
        queryKey: ["/api/social/profiles/count"],
      });
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${variables.id}/social-module/profiles`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });
      void queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith(collection),
      });
    },
  });
}
