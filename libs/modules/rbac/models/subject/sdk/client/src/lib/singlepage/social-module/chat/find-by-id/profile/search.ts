"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import { DefaultError, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export type IProps = {
  reactQueryOptions?: Partial<UseQueryOptions<IResult, DefaultError>>;
  id: string;
  socialModuleChatId: string;
  q: string;
  limit?: number;
};

export type IResult =
  IParentResult["ISocialModuleChatFindByIdProfileSearchResult"];

export function action(props: IProps) {
  const normalizedQuery = props.q.trim();

  return useQuery<IResult, DefaultError>({
    queryKey: [
      `${route}/${props.id}/social-module/chats/${props.socialModuleChatId}/profiles/search`,
      normalizedQuery,
      props.limit,
    ],
    queryFn: async () => {
      try {
        const result = await api.socialModuleChatFindByIdProfileSearch({
          id: props.id,
          socialModuleChatId: props.socialModuleChatId,
          q: normalizedQuery,
          limit: props.limit,
          options: {
            headers: saturateHeaders(undefined),
          },
          host: clientHost,
        } satisfies IParentProps["ISocialModuleChatFindByIdProfileSearchProps"]);

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    enabled: normalizedQuery.length >= 2,
    ...props.reactQueryOptions,
  });
}
