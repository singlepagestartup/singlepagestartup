"use client";
import "client-only";

import AuthenticationMe from "../../../../authentication/me-default/client";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export default function Client(props: IComponentProps) {
  return (
    <AuthenticationMe
      isServer={false}
      variant="authentication-me-default"
      apiProps={props.apiProps}
      skeleton={props.skeleton}
      fallback={null}
    >
      {({ data }) =>
        data ? <ChildComponent {...props} isServer={false} data={data} /> : null
      }
    </AuthenticationMe>
  );
}
