"use client";

import { IComponentPropsExtended } from "./interface";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { useState } from "react";

export function Component(props: IComponentPropsExtended) {
  const [provider, setProvider] = useState<
    | "authentication-login-and-password-authentication-form-default"
    | "authentication-ethereum-virtual-machine-default"
  >("authentication-login-and-password-authentication-form-default");

  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className || "px-2 py-20 lg:py-32",
      )}
    >
      <div className="w-full mx-auto max-w-7xl flex flex-col gap-4 lg:gap-10">
        {props.data?.title ? (
          <h1 className="text-2xl font-bold lg:text-4xl w-full">
            {props.data?.title}
          </h1>
        ) : null}
        <div className="w-full lg:w-1/2">
          <div className="flex gap-3">
            <Button
              variant={
                provider ===
                "authentication-login-and-password-authentication-form-default"
                  ? "primary"
                  : "outline"
              }
              onClick={() =>
                setProvider(
                  "authentication-login-and-password-authentication-form-default",
                )
              }
            >
              Login and Password
            </Button>
            <Button
              variant={
                provider === "authentication-ethereum-virtual-machine-default"
                  ? "primary"
                  : "outline"
              }
              onClick={() =>
                setProvider("authentication-ethereum-virtual-machine-default")
              }
            >
              Ethereum Virtual Machine
            </Button>
          </div>
          <Subject
            isServer={false}
            hostUrl={props.hostUrl}
            variant={provider}
          />
        </div>
      </div>
    </div>
  );
}
