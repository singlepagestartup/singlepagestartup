"use client";
import "client-only";
import { ChatNotice } from "../../Notice";
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
      waitForAuthenticationInit
      fallback={<ChatNotice language={props.language} sessionError />}
    >
      {({ data, authenticated }) =>
        data && authenticated ? (
          <ChildComponent {...props} isServer={false} data={data} />
        ) : (
          <ChatNotice language={props.language} />
        )
      }
    </AuthenticationMe>
  );
}
