import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { Component as Identity } from "./identity/Component";
import { Component as ListDefault } from "./list-default/Component";
import { Component as OverviewDefault } from "./overview-default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    variant: string;
  },
) {
  if (props.variant.startsWith("subject-identity")) {
    return (
      <Identity
        isServer={props.isServer}
        hostUrl={props.hostUrl}
        variant={props.variant as any}
        data={props.data}
      />
    );
  }

  if (props.variant.startsWith("subject-list-default")) {
    return <ListDefault isServer={props.isServer} hostUrl={props.hostUrl} />;
  }

  if (props.variant.startsWith("subject-overview-default")) {
    return (
      <OverviewDefault isServer={props.isServer} hostUrl={props.hostUrl} />
    );
  }

  return <div className="p-5 bg-red-500"></div>;
}
