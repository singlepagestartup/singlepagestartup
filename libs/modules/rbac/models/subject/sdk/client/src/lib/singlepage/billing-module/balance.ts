"use client";
import {
  api,
  type IProps as IServerProps,
  type IResult as IServerResult,
} from "@sps/rbac/models/subject/sdk/server";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { queryClient, subscription } from "@sps/shared-frontend-client-api";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useEffect } from "react";

export type IResult = IServerResult["IBillingModuleBalanceResult"];
type IServerBalanceProps = IServerProps["IBillingModuleBalanceProps"];
export interface IProps extends IServerBalanceProps {
  reactQueryOptions?: Partial<UseQueryOptions<IResult>>;
}

export function action(props: IProps) {
  const key = `${route}/${props.id}/billing-module/balance`;
  useEffect(() => subscription(key, queryClient), [key]);
  return useQuery<IResult>({
    ...props.reactQueryOptions,
    queryKey: [key],
    meta: {
      topics: [
        "rbac.subjects-to-billing-module-currencies",
        "billing.currencies",
      ],
      ...props.reactQueryOptions?.meta,
    },
    queryFn: () =>
      api.billingModuleBalance({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}
