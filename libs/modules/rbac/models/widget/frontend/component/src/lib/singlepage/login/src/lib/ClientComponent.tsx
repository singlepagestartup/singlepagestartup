"use client";

import { IComponentPropsExtended } from "./interface";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { useState } from "react";

export function Component(props: IComponentPropsExtended) {
  const [provider, setProvider] = useState<
    "login-and-password" | "ethereum-virtual-machine"
  >("login-and-password");

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
                provider === "login-and-password" ? "primary" : "outline"
              }
              onClick={() => setProvider("login-and-password")}
            >
              Login and Password
            </Button>
            <Button
              variant={
                provider === "ethereum-virtual-machine" ? "primary" : "outline"
              }
              onClick={() => setProvider("ethereum-virtual-machine")}
            >
              Ethereum Virtual Machine
            </Button>
          </div>
          <Subject
            isServer={false}
            hostUrl={props.hostUrl}
            variant={provider as any}
            type="authentication"
          />
        </div>
      </div>
    </div>
  );
}
