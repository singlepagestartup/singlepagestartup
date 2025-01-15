import { IComponentProps } from "./interface";
import Client from "./client";
import Server from "./server";
import { Provider as ApiProvider } from "@sps/broadcast/models/channel/sdk/client";
import { Suspense } from "react";

export function Component(props: IComponentProps) {
  const Comp: any = props.isServer ? Server : Client;

  return (
    <Suspense>
      <ApiProvider>
        <Comp {...props} />
      </ApiProvider>
    </Suspense>
  );
}
