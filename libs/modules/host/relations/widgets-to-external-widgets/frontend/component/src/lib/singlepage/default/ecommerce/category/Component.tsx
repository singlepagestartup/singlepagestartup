import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as OverviewDefault } from "./overview-default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
  },
) {
  if (props.data.variant === "category-overview-default") {
    return (
      <OverviewDefault isServer={props.isServer} hostUrl={props.hostUrl} />
    );
  }

  return <></>;
}
