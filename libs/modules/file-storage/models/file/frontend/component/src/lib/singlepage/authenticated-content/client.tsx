"use client";

import { useCallback, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api as fileApi } from "@sps/file-storage/models/file/sdk/client";
import { clientHost, route } from "@sps/file-storage/models/file/sdk/model";
import {
  consistencyQueryKey,
  queryClient,
  subscription,
} from "@sps/shared-frontend-client-api";
import { deriveTopicsFromPath } from "@sps/shared-utils";
import { ProtectedMediaContext } from "./context";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

/** The shared metadata reader cannot express the authenticated binary SDK operation. */
export default function Client(props: IComponentProps) {
  const scope = useContext(ProtectedMediaContext);
  const fileRoute = `${route}/${props.data.id}`;
  const content = useQuery(
    {
      queryKey: [
        ...consistencyQueryKey(`${fileRoute}/content`, undefined, clientHost),
        { protectedMediaScope: scope },
        props.data.updatedAt,
      ],
      queryFn: ({ signal }) =>
        fileApi.content({
          id: props.data.id,
          options: { signal, cache: "no-store" },
        }),
      enabled: Boolean(scope && props.data.id),
      retry: false,
      gcTime: 0,
      meta: {
        topics: deriveTopicsFromPath(fileRoute),
        protectedMediaScope: scope,
      },
    },
    queryClient,
  );
  useEffect(() => {
    if (!scope) return;
    return subscription(fileRoute, queryClient);
  }, [fileRoute, scope]);

  const retry = useCallback(() => {
    if (scope && props.data.id) void content.refetch();
  }, [content.refetch, scope, props.data.id]);
  const denied = [401, 403].includes(
    Number((content.error as { status?: number } | null)?.status),
  );
  const blob = scope && !denied ? content.data : undefined;
  return (
    <ChildComponent
      isServer={false}
      variant={props.variant}
      dataSource="props"
      data={props.data}
      language={props.language}
      className={props.className}
      containerClassName={props.containerClassName}
      content={blob}
      loading={Boolean(scope) && content.isPending}
      error={!scope || content.isError ? "Media unavailable" : undefined}
      onRetry={retry}
    />
  );
}
