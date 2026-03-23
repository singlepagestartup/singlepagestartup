import { Component as Agent } from "@sps/agent/models/agent/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: ISpsComponentBase) {
  return <Agent variant="admin-v2-card" isServer={props.isServer} />;
}
