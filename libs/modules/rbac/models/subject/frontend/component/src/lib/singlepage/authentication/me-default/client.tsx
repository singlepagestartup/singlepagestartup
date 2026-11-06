"use client";
import "client-only";

import { useEffect, useMemo, useRef, useState } from "react";
import { useJwt } from "react-jwt";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { route } from "@sps/rbac/models/subject/sdk/model";
import { Skeleton } from "./Skeleton";
import type { IComponentProps, IModel } from "./interface";

const authenticationJwtCookieName = "rbac.subject.jwt";
const authenticationStorageEvent = "sps-rbac-auth-storage-change";

function readAuthenticationJwtCookie() {
  if (typeof document === "undefined") {
    return "";
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${authenticationJwtCookieName}=`));

  if (!cookie) {
    return "";
  }

  try {
    return decodeURIComponent(
      cookie.slice(authenticationJwtCookieName.length + 1),
    );
  } catch {
    return cookie.slice(authenticationJwtCookieName.length + 1);
  }
}

export default function Client(props: IComponentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rawToken, setRawToken] = useState(readAuthenticationJwtCookie);

  const token = useJwt<{ exp: number; iat: number; subject: IModel }>(
    rawToken || "",
  );

  const reEvaluateToken = useRef(token.reEvaluateToken);
  reEvaluateToken.current = token.reEvaluateToken;

  useEffect(() => {
    const expiresAt = token.decodedToken?.exp;
    if (!rawToken || !expiresAt || !Number.isFinite(expiresAt)) return;
    let timeout: ReturnType<typeof setTimeout>;
    const checkExpiry = () => {
      // An old deadline must not invalidate a refreshed cookie.
      const currentToken = readAuthenticationJwtCookie();
      if (currentToken !== rawToken) {
        setRawToken(currentToken);
        return;
      }
      const remaining = expiresAt * 1000 - Date.now();
      if (remaining >= 0) {
        timeout = setTimeout(checkExpiry, Math.min(remaining + 1, 2147483647));
        return;
      }
      reEvaluateToken.current(rawToken);
    };
    checkExpiry();
    return () => clearTimeout(timeout);
  }, [rawToken, token.decodedToken?.exp]);

  const decoded = useMemo(
    () => token.decodedToken,
    [rawToken, token.decodedToken],
  );

  const session = api.authenticationMe({
    ...props.apiProps,
    subjectId: decoded?.subject?.id,
    reactQueryOptions: {
      enabled: !!decoded?.subject?.id && !token.isExpired,
      retry: false,
    },
  });

  useEffect(() => {
    let currentToken = rawToken;
    const handleAuthenticationStorageChange = () => {
      const nextToken = readAuthenticationJwtCookie();
      setRawToken(nextToken);
      if (nextToken !== currentToken) {
        currentToken = nextToken;
        void queryClient.invalidateQueries({
          queryKey: [`${route}/authentication/me`],
        });
      }
    };

    window.addEventListener(
      authenticationStorageEvent,
      handleAuthenticationStorageChange,
    );
    window.addEventListener("focus", handleAuthenticationStorageChange);
    handleAuthenticationStorageChange();

    return () => {
      window.removeEventListener(
        authenticationStorageEvent,
        handleAuthenticationStorageChange,
      );
      window.removeEventListener("focus", handleAuthenticationStorageChange);
    };
  }, [queryClient]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (
      props.set &&
      typeof props.set === "function" &&
      !token.isExpired &&
      session.data?.id === decoded?.subject?.id
    ) {
      props.set(session.data);
    }
  }, [decoded, session.data, token.isExpired, props.set]);

  useEffect(() => {
    if (
      props.unauthenticatedRedirectHref &&
      !token.isExpired &&
      decoded?.subject?.id &&
      !session.isPending &&
      !session.isFetching &&
      !session.error &&
      session.data?.id === decoded.subject.id &&
      session.data.authenticated === false
    ) {
      router.replace(props.unauthenticatedRedirectHref);
    }
  }, [
    props.unauthenticatedRedirectHref,
    token.isExpired,
    decoded?.subject?.id,
    session.isPending,
    session.isFetching,
    session.error,
    session.data,
    router,
  ]);

  if (!rawToken || !decoded?.subject || token.isExpired) {
    return props.unauthenticatedRedirectHref
      ? (props.skeleton ?? <Skeleton />)
      : (props.fallback ?? <Skeleton />);
  }

  if (session.isPending) return props.skeleton ?? <Skeleton />;
  if (!session.data || session.data.id !== decoded.subject.id || session.error)
    return props.fallback ?? <Skeleton />;
  if (props.unauthenticatedRedirectHref && !session.data.authenticated)
    return props.skeleton ?? <Skeleton />;
  return props.children
    ? props.children({
        data: session.data,
        authenticated: session.data.authenticated === true,
      })
    : null;
}
