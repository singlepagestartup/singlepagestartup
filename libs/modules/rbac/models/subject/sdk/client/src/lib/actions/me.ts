"use client";

import { STALE_TIME } from "@sps/shared-utils";
import { useQuery } from "@tanstack/react-query";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";

export type IProps = IParentProps["IMeProps"] & {
  reactQueryOptions?: Parameters<typeof useQuery>[1];
};

export type IResult = IParentResult["IMeResult"];

export function action(props: IProps) {
  return useQuery<IResult>({
    queryKey: [`${route}/me`],
    queryFn: async () => {
      try {
        const result = await api.me(props);

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/me`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: STALE_TIME,
    ...(props ? props.reactQueryOptions : {}),
  });
}
