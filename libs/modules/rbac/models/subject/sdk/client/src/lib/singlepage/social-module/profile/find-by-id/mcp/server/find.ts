"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { STALE_TIME } from "@sps/shared-utils";

export type IProps =
  IParentProps["ISocialModuleProfileFindByIdMcpServerFindProps"] & {
    reactQueryOptions?: Partial<UseQueryOptions<any>>;
  };

export type IResult =
  IParentResult["ISocialModuleProfileFindByIdMcpServerFindResult"];

export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/mcp/servers`;

  return useQuery<IResult>({
    queryKey: [queryKey],
    queryFn: async () => {
      return api.socialModuleProfileFindByIdMcpServerFind({
        ...props,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
        host: clientHost,
      });
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "query",
        name: queryKey,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: STALE_TIME,
    ...props.reactQueryOptions,
  });
}
