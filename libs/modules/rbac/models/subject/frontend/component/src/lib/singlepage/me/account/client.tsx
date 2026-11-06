"use client";
import AuthenticationMe from "../../authentication/me-default/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";

export default function Client(props: IComponentProps) {
  const guest = (
    <ChildComponent
      isServer={false}
      variant={props.variant}
      language={props.language}
      className={props.className}
      authenticated={false}
    />
  );
  return (
    <AuthenticationMe
      isServer={false}
      variant="authentication-me-default"
      apiProps={props.apiProps}
      skeleton={props.skeleton}
      fallback={guest}
    >
      {({ data, authenticated }) => (
        <ChildComponent
          isServer={false}
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
