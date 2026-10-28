"use client";

import {
  useMutation,
  type UseMutationOptions,
  type DefaultError,
} from "@tanstack/react-query";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { route as articleRoute } from "@sps/blog/models/article/sdk/model";
import { route as profileRoute } from "@sps/social/models/profile/sdk/model";
import {
  api,
  type IProps as IServerProps,
  type IResult as IServerResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  appendToListQueries,
} from "@sps/shared-frontend-client-api";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";

type IVariables = IServerProps["IBlogModuleArticleCreateProps"];
export type IResult = IServerResult["IBlogModuleArticleCreateResult"];
export interface IProps {
  reactQueryOptions?: Partial<
    UseMutationOptions<IResult, DefaultError, IVariables>
  >;
}
export function action(props: IProps = {}) {
  const { onSuccess, ...options } = props.reactQueryOptions ?? {};
  return useMutation<IResult, DefaultError, IVariables>({
    ...options,
    mutationKey: [`${route}/:id/blog-module/articles`],
    mutationFn: (variables) =>
      api.blogModuleArticleCreate({
        ...variables,
        host: variables.host ?? clientHost,
        options: {
          ...variables.options,
          headers: saturateHeaders(variables.options?.headers),
        },
      }),
    async onSuccess(...args) {
      const [data, variables] = args;
      appendToListQueries(queryClient, articleRoute, data.article);
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            typeof key === "string" &&
            (key === `${articleRoute}/count` ||
              key.startsWith(`${profileRoute}/authors`) ||
              key.startsWith(`${route}/${variables.id}/blog-module/articles`))
          );
        },
      });
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${variables.id}/blog-module/articles`,
        props: variables,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });
      await onSuccess?.(...args);
    },
  });
}
