"use client";

import { IComponentProps } from "./interface";
import { Component as Channel } from "@sps/broadcast/models/channel/frontend/component";
import { cn } from "@sps/shared-frontend-client-utils";

export function App(props: IComponentProps) {
  return (
    <div
      data-module="broadcast"
      className={cn("w-full flex flex-col", props.className)}
    >
      <Channel
        isServer={false}
        variant="find"
        apiProps={{
          params: {
            filters: {
              and: [
                {
                  column: "slug",
                  method: "eq",
                  value: "revalidation",
                },
              ],
            },
          },
        }}
      >
        {({ data }) => {
          return data?.map((entity, index) => {
            return (
              <Channel
                key={index}
                isServer={false}
                variant="subscription"
                data={entity}
              />
            );
          });
        }}
      </Channel>
    </div>
  );
}
