"use client";

import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={cn("flex w-full flex-col gap-6", props.className)}
    >
      {props.socialModuleMessages.map((socialModuleMessage, index) => {
        return (
          <div key={index} className="p-4 border rounded-xl">
            <p>{socialModuleMessage.description}</p>
          </div>
        );
      })}
    </div>
  );
}
