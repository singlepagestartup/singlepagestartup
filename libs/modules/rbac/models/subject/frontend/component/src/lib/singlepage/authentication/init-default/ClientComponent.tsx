"use client";

import { useEffect, useRef, useState } from "react";
import { IComponentPropsExtended } from "./interface";
import {
  api,
  clearAuthenticationTokens,
} from "@sps/rbac/models/subject/sdk/client";
import { useCookies } from "react-cookie";
import { useJwt } from "react-jwt";
import { cn } from "@sps/shared-frontend-client-utils";
import { useLocalStorage } from "@sps/shared-frontend-client-hooks";
import { usePathname, useSearchParams } from "next/navigation";

export function Component(props: IComponentPropsExtended) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [seconds, setSeconds] = useState(new Date().getTime());
  const lastAuthActionRef = useRef<string | null>(null);

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
  const jwtCookie = cookies["rbac.subject.jwt"];

  const tokenDecoded = useJwt<{
    exp: number;
    iat: number;
    subject: { id: string };
  }>(jwtCookie);
  const refreshTokenDecoded = useJwt<{
    exp: number;
    iat: number;
  }>(refreshToken || "");

  const isOAuthCallbackPending =
    pathname?.includes("/rbac/subject/authentication/select-method") &&
    (Boolean(searchParams.get("code")) ||
      Boolean(searchParams.get("oauthError")));

  useEffect(() => {
    if (isOAuthCallbackPending) {
      return;
    }

    const decodedJwt = tokenDecoded.decodedToken;
    const hasValidJwt = decodedJwt ? decodedJwt.exp * 1000 >= seconds : false;

    if (hasValidJwt) {
      lastAuthActionRef.current = null;
      return;
    }

    const hasValidRefreshToken =
      Boolean(refreshToken) && !refreshTokenDecoded.isExpired;

    if (!decodedJwt) {
      if (hasValidRefreshToken && refreshToken) {
        const refreshActionKey = `refresh:missing-or-invalid-jwt:${refreshToken}`;

        if (
          lastAuthActionRef.current === refreshActionKey ||
          refresh.isPending
        ) {
          return;
        }

        lastAuthActionRef.current = refreshActionKey;
        refresh.mutate({
          data: {
            refresh: refreshToken,
          },
        });
        return;
      }

      const initActionKey = "init:missing-jwt";

      if (lastAuthActionRef.current === initActionKey || init.isFetching) {
        return;
      }

      lastAuthActionRef.current = initActionKey;
      init.refetch();
      return;
    }

    if (decodedJwt.exp * 1000 < seconds) {
      if (hasValidRefreshToken && refreshToken) {
        const refreshActionKey = `refresh:expired-jwt:${decodedJwt.exp}:${refreshToken}`;

        if (
          lastAuthActionRef.current === refreshActionKey ||
          refresh.isPending
        ) {
          return;
        }

        lastAuthActionRef.current = refreshActionKey;
        refresh.mutate({
          data: {
            refresh: refreshToken,
          },
        });
        return;
      }

      clearAuthenticationTokens();

      const initActionKey = `init:expired-jwt:${decodedJwt.exp}`;

      if (lastAuthActionRef.current === initActionKey || init.isFetching) {
        return;
      }

      lastAuthActionRef.current = initActionKey;
      init.refetch();
    }
  }, [
    isOAuthCallbackPending,
    init.isFetching,
    init.refetch,
    jwtCookie,
    refresh.isPending,
    refresh.mutate,
    refreshToken,
    refreshTokenDecoded.isExpired,
    seconds,
    tokenDecoded.decodedToken,
  ]);

  useEffect(() => {
    if (!refresh.isError) {
      return;
    }

    clearAuthenticationTokens();
  }, [refresh.isError]);

  useEffect(() => {
    if (!refresh.isSuccess && !init.isSuccess) {
      return;
    }

    lastAuthActionRef.current = null;
  }, [init.isSuccess, refresh.isSuccess]);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(Date.now()), 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    ></div>
  );
}
