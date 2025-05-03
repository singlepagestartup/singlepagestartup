import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/blog/models/widget/sdk/model";
import { Component as List } from "./list/Component";
import { Component as Overview } from "./overview/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
    language: string;
  },
) {
  if (props.data.variant.startsWith("article-list")) {
    return <List {...props} />;
  }

  if (props.data.variant.startsWith("article-overview")) {
    return <Overview {...props} />;
  }

  return <></>;
}
