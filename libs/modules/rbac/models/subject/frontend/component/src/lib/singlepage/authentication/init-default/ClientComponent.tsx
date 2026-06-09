"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IComponentPropsExtended } from "./interface";
import {
  AUTHENTICATION_STORAGE_EVENT,
  api,
  clearAuthenticationTokens,
} from "@sps/rbac/models/subject/sdk/client";
import { decodeToken } from "react-jwt";
import { cn } from "@sps/shared-frontend-client-utils";
import { useLocalStorage } from "@sps/shared-frontend-client-hooks";
import { usePathname, useSearchParams } from "next/navigation";

const authenticationJwtCookieName = "rbac.subject.jwt";

type IAuthenticationJwtPayload = {
  exp?: number;
  iat?: number;
  subject?: { id: string };
};

type IAuthenticationRefreshPayload = {
  exp?: number;
  iat?: number;
};

function readAuthenticationJwtCookie() {
  if (typeof document === "undefined") {
    return undefined;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${authenticationJwtCookieName}=`));

  if (!cookie) {
    return undefined;
  }

  try {
    return decodeURIComponent(
      cookie.slice(authenticationJwtCookieName.length + 1),
    );
  } catch {
    return cookie.slice(authenticationJwtCookieName.length + 1);
  }
}

function decodeAuthenticationToken<T extends object>(token?: string) {
  if (!token) {
    return null;
  }

  return decodeToken<T>(token);
}

function isAuthenticationTokenValid(
  token: { exp?: number } | null,
  now: number,
) {
  return typeof token?.exp === "number" && token.exp * 1000 >= now;
}

export function Component(props: IComponentPropsExtended) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [seconds, setSeconds] = useState(new Date().getTime());
  const [jwtCookie, setJwtCookie] = useState<string | undefined>(() =>
    readAuthenticationJwtCookie(),
  );
  const lastAuthActionRef = useRef<string | null>(null);

  const refresh = api.authenticationRefresh({
    mute: true,
  });
  const init = api.authenticationInit({
    reactQueryOptions: {
      enabled: false,
    },
  });
  const refreshToken = useLocalStorage("rbac.subject.refresh");
  const tokenDecoded = useMemo(
    () => decodeAuthenticationToken<IAuthenticationJwtPayload>(jwtCookie),
    [jwtCookie],
  );
  const refreshTokenDecoded = useMemo(
    () =>
      decodeAuthenticationToken<IAuthenticationRefreshPayload>(
        refreshToken || undefined,
      ),
    [refreshToken],
  );

  const isOAuthCallbackPending =
    pathname?.includes("/rbac/subject/authentication/select-method") &&
    (Boolean(searchParams.get("code")) ||
      Boolean(searchParams.get("oauthError")));

  const refreshError = refresh.error as unknown as
    | { status?: unknown }
    | null
    | undefined;
  const refreshErrorStatus =
    typeof refreshError?.status === "number" ? refreshError.status : undefined;

  useEffect(() => {
    if (isOAuthCallbackPending) {
      return;
    }

    const hasValidJwt = isAuthenticationTokenValid(tokenDecoded, seconds);

    if (hasValidJwt) {
      lastAuthActionRef.current = null;
      return;
    }

    if (refreshToken === "") {
      return;
    }

    const hasValidRefreshToken =
      Boolean(refreshToken) &&
      isAuthenticationTokenValid(refreshTokenDecoded, seconds);

    if (hasValidRefreshToken && refreshToken) {
      const refreshActionKey = tokenDecoded?.exp
        ? `refresh:expired-jwt:${tokenDecoded.exp}:${refreshToken}`
        : `refresh:missing-or-invalid-jwt:${refreshToken}`;

      if (lastAuthActionRef.current === refreshActionKey || refresh.isPending) {
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

    if (jwtCookie || refreshToken) {
      clearAuthenticationTokens();
    }

    const initActionKey = tokenDecoded?.exp
      ? `init:expired-jwt:${tokenDecoded.exp}`
      : jwtCookie
        ? "init:invalid-jwt"
        : refreshToken
          ? "init:invalid-refresh"
          : "init:missing-jwt";

    if (lastAuthActionRef.current === initActionKey || init.isFetching) {
      return;
    }

    lastAuthActionRef.current = initActionKey;
    init.refetch();
  }, [
    isOAuthCallbackPending,
    init.isFetching,
    init.refetch,
    jwtCookie,
    refresh.isPending,
    refresh.mutate,
    refreshToken,
    refreshTokenDecoded,
    seconds,
    tokenDecoded,
  ]);

  useEffect(() => {
    const handleAuthenticationStorageChange = () => {
      setJwtCookie(readAuthenticationJwtCookie());
    };

    handleAuthenticationStorageChange();
    window.addEventListener(
      AUTHENTICATION_STORAGE_EVENT,
      handleAuthenticationStorageChange,
    );
    window.addEventListener("focus", handleAuthenticationStorageChange);

    return () => {
      window.removeEventListener(
        AUTHENTICATION_STORAGE_EVENT,
        handleAuthenticationStorageChange,
      );
      window.removeEventListener("focus", handleAuthenticationStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!refresh.isError) {
      return;
    }

    if (refreshErrorStatus !== 401) {
      return;
    }

    clearAuthenticationTokens();
  }, [refresh.isError, refreshErrorStatus]);

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
