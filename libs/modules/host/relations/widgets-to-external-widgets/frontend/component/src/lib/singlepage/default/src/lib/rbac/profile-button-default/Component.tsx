import { Component as ClientAction } from "./ClientAction";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: ISpsComponentBase) {
  return <ClientAction {...props} />;
}
