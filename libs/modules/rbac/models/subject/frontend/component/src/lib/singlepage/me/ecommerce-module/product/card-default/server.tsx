"use server";
import "server-only";

import AuthenticationMe from "../../../../authentication/me-default/server";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
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
          ecommerceModuleProduct={props.ecommerceModuleProduct}
          ecommerceModuleStore={props.ecommerceModuleStore}
        />
      }
    >
      {({ data }) =>
        data ? <ChildComponent {...props} isServer={true} data={data} /> : null
      }
    </AuthenticationMe>
  );
}
