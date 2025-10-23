"use client";

import { STALE_TIME } from "@sps/shared-utils";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export type IProps = IParentProps["IAuthenticationInitProps"] & {
  reactQueryOptions?: Partial<UseQueryOptions<any>>;
};

export type IResult = IParentResult["IAuthenticationInitResult"];

export function action(props: IProps) {
  return useQuery<IResult>({
    queryKey: [`${route}/authentication/init`],
    queryFn: async () => {
      try {
        const result = await api.authenticationInit({
          ...props,
          options: {
            ...props.options,
            headers: saturateHeaders(props.options?.headers),
          },
          host: clientHost,
        });

        if (!result) {
          throw new Error("Internal error. No data");
        }

        localStorage.setItem("rbac.subject.refresh", result.refresh);
        Cookies.set("rbac.subject.jwt", result.jwt);

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/authentication/init`,
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
