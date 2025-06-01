import { IComponentProps } from "./interface";
import { Component as Page } from "@sps/host/models/page/frontend/component";

import { cn } from "@sps/shared-frontend-client-utils";

export function App(props: IComponentProps) {
  return (
    <div
      data-module="host"
      className={cn("w-full flex flex-col", props.className)}
    >
      <Page isServer={props.isServer} variant="find-by-url" url={props.url}>
        {({ data }) => {
          if (!data) {
            return;
          }

          return (
            <Page
              isServer={props.isServer}
              variant={data?.variant as any}
              data={data}
              url={props.url}
              language={props.language}
            />
          );
        }}
      </Page>
    </div>
  );
}
