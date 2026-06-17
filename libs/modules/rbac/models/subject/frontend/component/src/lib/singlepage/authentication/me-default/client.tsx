"use client";
import "client-only";

import { useEffect, useMemo, useState } from "react";
import { useJwt } from "react-jwt";
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
  const [rawToken, setRawToken] = useState(readAuthenticationJwtCookie);

  const token = useJwt<{ exp: number; iat: number; subject: IModel }>(
    rawToken || "",
  );

  const decoded = useMemo(
    () => token.decodedToken,
    [rawToken, token.decodedToken],
  );

  useEffect(() => {
    const handleAuthenticationStorageChange = () => {
      setRawToken(readAuthenticationJwtCookie());
    };

    handleAuthenticationStorageChange();
    window.addEventListener(
      authenticationStorageEvent,
      handleAuthenticationStorageChange,
    );
    window.addEventListener("focus", handleAuthenticationStorageChange);

    return () => {
      window.removeEventListener(
        authenticationStorageEvent,
        handleAuthenticationStorageChange,
      );
      window.removeEventListener("focus", handleAuthenticationStorageChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (
      props.set &&
      typeof props.set === "function" &&
      !token.isExpired &&
      decoded?.subject
    ) {
      props.set(decoded.subject);
    }
  }, [decoded, token.isExpired, props.set]);

  if (!decoded?.subject || token.isExpired) {
    return <Skeleton />;
  }

  return props.children ? props.children({ data: decoded.subject }) : null;
}
