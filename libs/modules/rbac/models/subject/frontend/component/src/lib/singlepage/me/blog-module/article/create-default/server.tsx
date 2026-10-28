"use server";
import "server-only";
import AuthenticationMe from "../../../../authentication/me-default/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
import Client from "./client";

export default async function Server(props: IComponentProps) {
  return (
    <AuthenticationMe
      isServer
      variant="authentication-me-default"
      apiProps={props.apiProps}
      fallback={
        <Client
          isServer={false}
          variant={props.variant}
          language={props.language}
          className={props.className}
          skeleton={props.skeleton}
        />
      }
    >
      {({ data, authenticated }) => (
        <ChildComponent
          isServer
          variant={props.variant}
          language={props.language}
          className={props.className}
          data={data}
          authenticated={authenticated}
        />
      )}
    </AuthenticationMe>
  );
}
