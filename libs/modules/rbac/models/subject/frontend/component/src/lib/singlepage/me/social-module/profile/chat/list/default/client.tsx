"use client";
import "client-only";
import AuthenticationMe from "../../../../../../authentication/me-default/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  return (
    <AuthenticationMe
      isServer={false}
      variant="authentication-me-default"
      apiProps={props.apiProps}
      skeleton={props.skeleton}
      fallback={<p role="status">Sign in to view chats.</p>}
    >
      {({ data, authenticated }) =>
        data && authenticated ? (
          <ChildComponent {...props} isServer={false} data={data} />
        ) : (
          <p role="status">Sign in to view chats.</p>
        )
      }
    </AuthenticationMe>
  );
}
