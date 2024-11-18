"use client";

import { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import Cookie from "js-cookie";
import { useCookies } from "react-cookie";
import { useJwt } from "react-jwt";
// import { useRouter } from "next/navigation";
import { cn } from "@sps/shared-frontend-client-utils";
import { useLocalStorage } from "@sps/shared-frontend-client-hooks";

export function Component(props: IComponentPropsExtended) {
  // const router = useRouter();
  const refresh = api.refresh();
  const init = api.init({
    reactQueryOptions: {
      enabled: false,
    },
  });
  const [jwtCookies] = useCookies(["rbac.subject.jwt"]);
  const refreshToken = useLocalStorage("rbac.subject.refresh");

  const token = useJwt<{
    exp: number;
    iat: number;
    subject: { id: string };
  }>(jwtCookies["rbac.subject.jwt"]);
  const refreshTokenDecoded = useJwt<{
    exp: number;
    iat: number;
  }>(refreshToken || "");

  useEffect(() => {
    if (!refreshToken && typeof refreshToken !== "string") {
      init.refetch();
    }
  }, [refreshToken]);

  useEffect(() => {
    if (!token.decodedToken) {
      return;
    }

    if (token.isExpired) {
      if (!refreshToken) {
        Cookie.remove("rbac.subject.jwt");
        localStorage.removeItem("rbac.subject.refresh");

        return;
      }

      if (refreshTokenDecoded.isExpired || !refreshToken) {
        Cookie.remove("rbac.subject.jwt");
        localStorage.removeItem("rbac.subject.refresh");

        return;
      }

      refresh.mutate({
        data: {
          refresh: refreshToken,
        },
      });
    }
  }, [
    init.status,
    token.decodedToken,
    refreshToken,
    refreshTokenDecoded.isExpired,
    refreshTokenDecoded.decodedToken,
  ]);

  useEffect(() => {
    if (refresh.isError) {
      Cookie.remove("rbac.subject.jwt");
      localStorage.removeItem("rbac.subject.refresh");
    }
  }, [refresh.status]);

  // useEffect(() => {
  //   if (init.status === "success") {
  //     router.refresh();
  //   }
  // }, [init.status]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    ></div>
  );
}
