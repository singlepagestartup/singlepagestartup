import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { Component as Identity } from "./identity/Component";
import { Component as ListDefault } from "./list-default/Component";
import { Component as OverviewDefault } from "./overview-default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    variant: string;
    url: string;
  },
) {
  if (props.variant.startsWith("subject-identity")) {
    return (
      <Identity
        isServer={props.isServer}
        variant={props.variant as any}
        data={props.data}
      />
    );
  }

  if (props.variant.startsWith("subject-list-default")) {
    return <ListDefault isServer={props.isServer} />;
  }

  if (props.variant.startsWith("subject-overview-default")) {
    return <OverviewDefault url={props.url} isServer={props.isServer} />;
  }

  return <div className="p-5 bg-red-500"></div>;
}
