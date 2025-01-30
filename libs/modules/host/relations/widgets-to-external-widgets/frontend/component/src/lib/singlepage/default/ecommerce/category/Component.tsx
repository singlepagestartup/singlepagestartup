import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/ecommerce/models/widget/sdk/model";
import { Component as OverviewDefault } from "./overview-default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
    language: string;
  },
) {
  if (props.data.variant === "category-overview-default") {
    return (
      <OverviewDefault
        url={props.url}
        isServer={props.isServer}
        language={props.language}
      />
    );
  }

  return <></>;
}
