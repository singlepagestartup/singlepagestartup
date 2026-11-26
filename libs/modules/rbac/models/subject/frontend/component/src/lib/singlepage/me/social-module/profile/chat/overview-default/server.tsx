"use server";
import "server-only";
import AuthenticationMe from "../../../../../authentication/me-default/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
import Client from "./client";

export default async function Server(props: IComponentProps) {
  const clientReader = (
    <Client
      isServer={false}
      variant={props.variant}
      language={props.language}
      className={props.className}
      skeleton={props.skeleton}
      socialModuleChatId={props.socialModuleChatId}
      socialModuleThreadId={props.socialModuleThreadId}
      defaultThreadId={props.defaultThreadId}
      getThreadHref={props.getThreadHref}
    />
  );
  if (props.socialModuleThreadId) return clientReader;
  return (
    <AuthenticationMe
      isServer={true}
      variant="authentication-me-default"
      apiProps={props.apiProps}
      skeleton={props.skeleton}
      fallback={clientReader}
    >
      {({ data, authenticated }) =>
        data && authenticated ? (
          <ChildComponent {...props} isServer={true} data={data} />
        ) : (
          clientReader
        )
      }
    </AuthenticationMe>
  );
}
