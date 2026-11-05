"use client";

import { useEffect } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  queryClient,
  subscription,
  consistencyQueryKey,
} from "@sps/shared-frontend-client-api";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { clientHost, route } from "@sps/social/models/profile/sdk/model";
import {
  api,
  type IProps as IServerProps,
  type IResult as IServerResult,
} from "@sps/social/models/profile/sdk/server";

export type IAuthorFindResult = IServerResult["IAuthorFindResult"];
export type IAuthorFindCountResult = IServerResult["IAuthorFindCountResult"];
export type IAuthorFindByIdResult = IServerResult["IAuthorFindByIdResult"];
type IServerAuthorFindProps = IServerProps["IAuthorFindProps"];
type IServerAuthorFindCountProps = IServerProps["IAuthorFindCountProps"];
type IServerAuthorFindByIdProps = IServerProps["IAuthorFindByIdProps"];
export interface IAuthorFindProps extends IServerAuthorFindProps {
  reactQueryOptions?: Partial<UseQueryOptions<IAuthorFindResult>>;
}
export interface IAuthorFindCountProps extends IServerAuthorFindCountProps {
  reactQueryOptions?: Partial<UseQueryOptions<IAuthorFindCountResult>>;
}
export interface IAuthorFindByIdProps extends IServerAuthorFindByIdProps {
  reactQueryOptions?: Partial<UseQueryOptions<IAuthorFindByIdResult>>;
}

const topics = [
  "social.profiles",
  "social.profiles-to-blog-module-articles",
  "social.profiles-to-ecommerce-module-products",
  "social.profiles-to-file-storage-module-files",
  "blog.articles",
  "ecommerce.products",
  "file-storage.files",
];
function useAuthorsQuery<T>(props: {
  path: string;
  params?: object;
  host?: string;
  options?: IServerProps["IAuthorFindProps"]["options"];
  reactQueryOptions?: Partial<UseQueryOptions<T>>;
  fetch: (
    host: string,
    options: IServerProps["IAuthorFindProps"]["options"],
  ) => Promise<T>;
}) {
  const key = `${route}/authors${props.path}`;
  const host = props.host ?? clientHost;
  useEffect(() => subscription(key, queryClient), [key]);
  const { meta, ...options } = props.reactQueryOptions ?? {};
  return useQuery<T>({
    ...options,
    queryKey: consistencyQueryKey(key, props.params, host),
    meta: {
      ...meta,
      topics: [...topics, ...(Array.isArray(meta?.topics) ? meta.topics : [])],
    },
    queryFn: () =>
      props.fetch(host, {
        ...props.options,
        headers: saturateHeaders(props.options?.headers),
      }),
  });
}
export function authorFind(props: IAuthorFindProps = {}) {
  return useAuthorsQuery({
    ...props,
    path: "",
    fetch: (host, options) => api.authorFind({ ...props, host, options }),
  });
}
export function authorFindCount(props: IAuthorFindCountProps = {}) {
  return useAuthorsQuery({
    ...props,
    path: "/count",
    fetch: (host, options) => api.authorFindCount({ ...props, host, options }),
  });
}
export function authorFindById(props: IAuthorFindByIdProps) {
  return useAuthorsQuery({
    ...props,
    path: `/${encodeURIComponent(props.id)}`,
    fetch: (host, options) => api.authorFindById({ ...props, host, options }),
  });
}
