"use client";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  type IProps as IServerProps,
} from "@sps/rbac/models/subject/sdk/server";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { queryClient } from "@sps/shared-frontend-client-api";
export type IProps = IServerProps["IProviderConnectionsProps"];
export type IChangeProps = IServerProps["IChangeProviderConnectionProps"];
const settingsKey = (props: IProps) => [
  `${route}/${props.id}/stores/${props.storeId}/provider-connections`,
];
function authorized(props: IProps) {
  return {
    ...props,
    host: clientHost,
    options: {
      ...props.options,
      headers: saturateHeaders(props.options?.headers),
    },
  };
}
export function providerConnections(props: IProps) {
  return useQuery({
    queryKey: [...settingsKey(props), props.before ?? null],
    enabled: Boolean(props.id && props.storeId),
    queryFn: () => api.providerConnections(authorized(props)),
    staleTime: 0,
  });
}
// Keep write-only credentials out of mutation caches, realtime events and sessionStorage.
export async function changeProviderConnection(props: IChangeProps) {
  const result = await api.changeProviderConnection({
    ...authorized(props),
    data: props.data,
  });
  await queryClient.invalidateQueries({ queryKey: settingsKey(props) });
  return result;
}
