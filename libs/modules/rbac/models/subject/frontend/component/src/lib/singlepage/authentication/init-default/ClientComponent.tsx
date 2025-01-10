"use client";

import { useEffect } from "react";
import { IComponentPropsExtended } from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import Cookie from "js-cookie";
import { useCookies } from "react-cookie";
import { useJwt } from "react-jwt";
import { cn } from "@sps/shared-frontend-client-utils";
import { useLocalStorage } from "@sps/shared-frontend-client-hooks";
import { useRouter } from "next/navigation";

export function Component(props: IComponentPropsExtended) {
  const router = useRouter();

  const refresh = api.authenticationRefresh({
    mute: true,
  });
  const init = api.authenticationInit({
    reactQueryOptions: {
      enabled: false,
    },
  });
  const [cookies] = useCookies(["rbac.subject.jwt"]);
  const refreshToken = useLocalStorage("rbac.subject.refresh");

  const tokenDecoded = useJwt<{
    exp: number;
    iat: number;
    subject: { id: string };
  }>(cookies["rbac.subject.jwt"]);
  const refreshTokenDecoded = useJwt<{
    exp: number;
    iat: number;
  }>(refreshToken || "");

  useEffect(() => {
    if (!refreshToken && typeof refreshToken !== "string") {
      init.refetch();
    }
  }, [refreshToken]);

  const handleStorageChange = () => {
    if (tokenDecoded.isExpired) {
      /**
       * No Cookies['rbac.subject.jwt']
       */
      if (!tokenDecoded.decodedToken) {
        if (refreshToken && !refreshTokenDecoded.isExpired) {
          refresh.mutate({
            data: {
              refresh: refreshToken,
            },
          });
          return;
        } else {
          init.refetch();
          return;
        }
      } else {
        if (!refreshToken && typeof refreshToken !== "string") {
          Cookie.remove("rbac.subject.jwt");
          localStorage.removeItem("rbac.subject.refresh");
          return;
        }

        if (refreshToken.length) {
          refresh.mutate({
            data: {
              refresh: refreshToken,
            },
          });
        }
      }
    }
  };

  useEffect(() => {
    handleStorageChange();
  }, [tokenDecoded.decodedToken, refreshToken, refreshTokenDecoded.isExpired]);

  useEffect(() => {
    if (refresh.isError) {
      Cookie.remove("rbac.subject.jwt");
      localStorage.removeItem("rbac.subject.refresh");
      router.replace("/");
    }
  }, [refresh.status]);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    ></div>
  );
}
