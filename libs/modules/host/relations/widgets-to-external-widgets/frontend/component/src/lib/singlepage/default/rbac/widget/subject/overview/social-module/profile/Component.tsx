import { IComponentProps } from "./interface";
import { Component as OverviewDefault } from "./overview-default/Component";

export function Component(props: IComponentProps) {
  if (
    props.variant === "subject-overview-social-module-profile-overview-default"
  ) {
    return <OverviewDefault {...props} />;
  }

  return <></>;
}
