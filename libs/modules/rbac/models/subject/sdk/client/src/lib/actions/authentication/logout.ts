"use client";

import { route } from "@sps/rbac/models/subject/sdk/model";
import { STALE_TIME } from "@sps/shared-utils";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";
import Cookies from "js-cookie";

export type IProps = IParentProps["IAuthenticationLogoutProps"] & {
  reactQueryOptions?: Partial<UseQueryOptions<any>>;
};

export type IResult = IParentResult["IAuthenticationLogoutResult"];

export function action(props: IProps) {
  return useQuery<IResult>({
    queryKey: [`${route}/authentication/logout`],
    queryFn: async () => {
      try {
        const result = await api.authenticationLogout(props);

        localStorage.removeItem("rbac.subject.refresh");
        Cookies.remove("rbac.subject.jwt");

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/authentication/logout`,
        props: this,
        result: data,
        timestamp: Date.now(),
        requestId: createId(),
      });

      return data;
    },
    staleTime: STALE_TIME,
    ...props?.reactQueryOptions,
  });
}
