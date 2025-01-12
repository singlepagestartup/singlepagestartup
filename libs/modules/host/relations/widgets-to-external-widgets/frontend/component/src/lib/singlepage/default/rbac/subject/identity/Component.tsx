import { ISpsComponentBase } from "@sps/ui-adapter";
import { IModel } from "@sps/rbac/models/widget/sdk/model";
import { Component as Settings } from "./settings-default/Component";

export function Component(
  props: ISpsComponentBase & {
    data: IModel;
    variant: string;
  },
) {
  if (props.variant.startsWith("subject-identity-settings")) {
    return <Settings {...props} />;
  }

  return;
}
