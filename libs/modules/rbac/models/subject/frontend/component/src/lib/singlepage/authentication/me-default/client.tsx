"use client";
import "client-only";

import { IComponentProps, IModel } from "./interface";
import { useEffect } from "react";
import { useCookies } from "react-cookie";
import { useJwt } from "react-jwt";
import { Skeleton } from "./Skeleton";

export default function Client(props: IComponentProps) {
  const [jwtCookies] = useCookies(["rbac.subject.jwt"]);

  const token = useJwt<{
    exp: number;
    iat: number;
    subject: IModel;
  }>(jwtCookies["rbac.subject.jwt"]);

  useEffect(() => {
    if (
      props.set &&
      typeof props.set === "function" &&
      !token.isExpired &&
      token.decodedToken?.subject
    ) {
      props.set(token.decodedToken.subject);
    }
  }, [token.decodedToken, props]);

  if (!token.decodedToken?.subject || token.isExpired) {
    return props?.skeleton || <Skeleton />;
  }

  if (props.children) {
    return props.children({ data: token.decodedToken.subject });
  }

  return <></>;
}
