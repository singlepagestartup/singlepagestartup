import { Component as Metric } from "@sps/analytic/models/metric/frontend/component";
import { ISpsComponentBase } from "@sps/ui-adapter";

export function Component(props: ISpsComponentBase) {
  return <Metric variant="admin-v2-card" isServer={props.isServer} />;
}
