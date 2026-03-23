import { Component as Widget } from "@sps/analytic/models/widget/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: ISpsComponentBase) {
  return <Widget variant="admin-v2-card" isServer={props.isServer} />;
}
