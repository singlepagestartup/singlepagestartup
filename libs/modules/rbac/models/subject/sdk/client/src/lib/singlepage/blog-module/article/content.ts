"use client";
import { useEffect } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  api,
  type IProps as IServerProps,
  type IResult as IServerResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  subscription,
  consistencyQueryKey,
} from "@sps/shared-frontend-client-api";
export type IProps =
  IServerProps["IBlogModuleArticleFindByIdContentFindProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<IResult>>;
  };
export type IResult =
  IServerResult["IBlogModuleArticleFindByIdContentFindResult"] & {
    clientRequestStartedAt: number;
  };
export function action(props: IProps) {
  const path = `${route}/${props.id}/blog-module/articles/${props.blogModuleArticleId}/content`;
  const { meta, ...options } = props.reactQueryOptions || {};
  useEffect(() => subscription(path, queryClient), [path]);
  return useQuery<IResult>({
    queryKey: consistencyQueryKey(path, undefined, clientHost),
    queryFn: async ({ signal }) => {
      const clientRequestStartedAt = Date.now();
      try {
        const result = await api.blogModuleArticleFindByIdContentFind({
          ...props,
          host: clientHost,
          options: {
            ...props.options,
            signal,
            headers: saturateHeaders(props.options?.headers),
          },
        });
        return { ...result, clientRequestStartedAt };
      } catch (error) {
        const query = queryClient.getQueryCache().find<IResult>({
          queryKey: consistencyQueryKey(path, undefined, clientHost),
          exact: true,
        });
        if ([401, 403].includes((error as { status?: number }).status || 0)) {
          query?.setState({ data: undefined });
        } else if (query?.state.data) {
          query.setState({
            data: {
              ...query.state.data,
              access: { state: "locked", expiresAt: null },
              items: query.state.data.items.map((item) =>
                item.kind === "public"
                  ? item
                  : {
                      kind: "private",
                      key: item.key,
                      orderIndex: item.orderIndex,
                      access: { state: "locked", expiresAt: null },
                    },
              ),
            },
          });
        }
        throw error;
      }
    },
    meta: {
      ...meta,
      topics: [
        "blog.articles-to-website-builder-module-widgets",
        "blog.articles-to-ecommerce-module-products",
        "rbac.subjects-to-roles",
        "rbac.subjects-to-ecommerce-module-orders",
        "rbac.roles-to-ecommerce-module-products",
        "ecommerce.orders",
        "ecommerce.orders-to-products",
        "website-builder.widgets",
        ...((meta?.topics as string[]) || []),
      ],
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false,
    ...options,
  });
}
