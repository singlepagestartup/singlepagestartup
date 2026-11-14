import { Component as Reader } from "@sps/shared-frontend-components/singlepage/reader";
import { Provider } from "@sps/broadcast/relations/channels-to-messages/sdk/client";
import { Component as Client } from "./client";
import { Component as Server } from "./server";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const component = props.isServer ? Server : Client;
  return (
    <Reader Component={component} Provider={Provider} componentProps={props} />
  );
}
