"use server";
import "server-only";
import AuthenticationMe from "../../../../../authentication/me-default/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
import Client from "./client";
export default async function Server(props: IComponentProps) {
  return (
    <AuthenticationMe
      isServer={true}
      variant="authentication-me-default"
      apiProps={props.apiProps}
      skeleton={props.skeleton}
      fallback={
        <Client
          isServer={false}
          variant={props.variant}
          language={props.language}
          className={props.className}
          skeleton={props.skeleton}
          socialModuleChatId={props.socialModuleChatId}
          socialModuleThreadId={props.socialModuleThreadId}
        />
      }
    >
      {({ data, authenticated }) =>
        data && authenticated ? (
          <ChildComponent {...props} isServer={true} data={data} />
        ) : (
          <p role="status">Sign in to view chats.</p>
        )
      }
    </AuthenticationMe>
  );
}
