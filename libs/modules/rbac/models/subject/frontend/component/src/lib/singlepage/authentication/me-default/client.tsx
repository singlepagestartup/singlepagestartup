"use client";
import "client-only";

import { useEffect, useMemo } from "react";
import { useCookies } from "react-cookie";
import { useJwt } from "react-jwt";
import { Skeleton } from "./Skeleton";
import type { IComponentProps, IModel } from "./interface";

export default function Client(props: IComponentProps) {
  const [jwtCookies] = useCookies(["rbac.subject.jwt"]);
  const rawToken = jwtCookies["rbac.subject.jwt"];

  const token = useJwt<{ exp: number; iat: number; subject: IModel }>(
    rawToken || "",
  );

  const decoded = useMemo(
    () => token.decodedToken,
    [rawToken, token.decodedToken],
  );

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
