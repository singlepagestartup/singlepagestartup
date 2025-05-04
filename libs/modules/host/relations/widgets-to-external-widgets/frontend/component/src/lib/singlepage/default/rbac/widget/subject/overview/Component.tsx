import { IComponentProps } from "./interface";
import { Component as Default } from "./default/Component";
import { Component as SocialModuleProfileOverviewDefault } from "./social-module-profile-overview-default/Component";

export function Component(props: IComponentProps) {
  if (props.variant === "subject-overview-default") {
    return <Default {...props} />;
  }

  if (
    props.variant === "subject-overview-social-module-profile-overview-default"
  ) {
    return <SocialModuleProfileOverviewDefault {...props} />;
  }

  return <></>;
}
