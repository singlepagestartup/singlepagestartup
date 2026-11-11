"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  api as serverApi,
  type IProps as IServerProps,
  type IResult as IServerResult,
} from "@sps/broadcast/relations/channels-to-messages/sdk/server";
import {
  clientHost,
  route,
} from "@sps/broadcast/relations/channels-to-messages/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { queryClient, subscription } from "@sps/shared-frontend-client-api";
import { STALE_TIME } from "@sps/shared-utils";

export type IProps = IServerProps["IMessageProps"];
export type IResult = IServerResult["IMessageResult"];
export function action(props: IProps) {
  const key = `${route}/${props.id}/message`;
  useEffect(() => subscription(key, queryClient), [key]);
  return useQuery<IResult>({
    queryKey: [key],
    meta: { topics: ["broadcast.channels-to-messages", "broadcast.messages"] },
    staleTime: STALE_TIME,
    queryFn: () =>
      serverApi.message({
        ...props,
        host: props.host ?? clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}
