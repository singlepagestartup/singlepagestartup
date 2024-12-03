"use client";
import "client-only";

import { factory } from "@sps/shared-frontend-client-api";
import { IComponentProps, IComponentPropsExtended } from "./interface";
import { ReactNode, useEffect } from "react";
import { Component as Skeleton } from "./Skeleton";
import { useCookies } from "react-cookie";
import { useJwt } from "react-jwt";

export function Component<
  M extends { id: string },
  V,
  A extends {
    api: ReturnType<typeof factory<M>>;
    Skeleton?: ReactNode;
    Component: React.ComponentType<
      IComponentPropsExtended<M, V, IComponentProps<M, V>>
    >;
  },
  CP extends IComponentProps<M, V>,
>(props: CP & A) {
  const { Component: Child } = props;

  const { data, isLoading, refetch } = props.api.findById({
    id: props.data.id,
    ...props.apiProps,
    reactQueryOptions: {
      enabled: false,
    },
  });

  const passProps: any = { ...props, data };
  delete passProps.Component;
  delete passProps.Skeleton;
  delete passProps.api;

  const [jwtCookies] = useCookies(["rbac.subject.jwt"]);

  const token = useJwt<{
    exp: number;
    iat: number;
    subject: M & {
      variant: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }>(jwtCookies["rbac.subject.jwt"]);

  useEffect(() => {
    if (token.decodedToken && token.decodedToken.subject.id !== props.data.id) {
      refetch();
    }
  }, [token.decodedToken, props.data.id]);

  if (!token.decodedToken?.subject) {
    return props?.skeleton || <Skeleton />;
  }

  if (isLoading) {
    return props?.skeleton || <Skeleton />;
  }

  if (token.decodedToken?.subject?.id === props.data.id) {
    return (
      <Child {...props} isServer={false} data={token.decodedToken.subject} />
    );
  }

  if (data) {
    return <Child {...props} isServer={false} data={data} />;
  }

  return <></>;
}
