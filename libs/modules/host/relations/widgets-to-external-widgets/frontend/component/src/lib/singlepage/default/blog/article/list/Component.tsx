import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/blog/models/widget/sdk/model";
import { Component as Default } from "./default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    url: string;
    language: string;
  },
) {
  if (props.data.variant === "article-list-default") {
    return <Default {...props} />;
  }

  return <></>;
}
